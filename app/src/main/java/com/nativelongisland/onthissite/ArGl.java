package com.nativelongisland.onthissite;

import android.graphics.Bitmap;
import android.opengl.GLES11Ext;
import android.opengl.GLES20;
import android.opengl.GLUtils;
import android.opengl.Matrix;
import com.google.ar.core.Coordinates2d;
import com.google.ar.core.Frame;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.nio.ShortBuffer;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Minimal OpenGL ES 2 drawing for the AR view: the camera feed behind
 * everything, placed 3D things (flags, banners, arrows), and alpha-blended textured quads
 * (photos, cards, orbs, floor rings, stickers) in front. Must only be used on
 * the GL thread.
 */
final class ArGl {
    private static final String BACKGROUND_VERTEX =
        "attribute vec4 a_Position;\n"
            + "attribute vec2 a_TexCoord;\n"
            + "varying vec2 v_TexCoord;\n"
            + "void main() { gl_Position = a_Position; v_TexCoord = a_TexCoord; }\n";
    private static final String BACKGROUND_FRAGMENT =
        "#extension GL_OES_EGL_image_external : require\n"
            + "precision mediump float;\n"
            + "varying vec2 v_TexCoord;\n"
            + "uniform samplerExternalOES u_Texture;\n"
            + "void main() { gl_FragColor = texture2D(u_Texture, v_TexCoord); }\n";
    private static final String QUAD_VERTEX =
        "uniform mat4 u_Mvp;\n"
            + "attribute vec4 a_Position;\n"
            + "attribute vec2 a_TexCoord;\n"
            + "varying vec2 v_TexCoord;\n"
            + "void main() { gl_Position = u_Mvp * a_Position; v_TexCoord = a_TexCoord; }\n";
    private static final String QUAD_FRAGMENT =
        "precision mediump float;\n"
            + "varying vec2 v_TexCoord;\n"
            + "uniform sampler2D u_Texture;\n"
            + "uniform float u_Alpha;\n"
            + "uniform float u_Premultiplied;\n"
            + "uniform float u_Additive;\n"
            + "void main() { vec4 c = texture2D(u_Texture, v_TexCoord);"
            + " gl_FragColor = vec4(c.rgb * mix(1.0, u_Alpha, u_Premultiplied), c.a * u_Alpha * (1.0 - u_Additive)); }\n";

    // Placed 3D things (flags, banners, arrows): lit from above, both sides shaded
    // alike. With u_Wave above 0 the mesh is a unit cloth blowing from its pole
    // edge (texture u = 0). A flag (u_Calm 0) has a slow swing about the pole, a
    // travelling ripple and a quicker flutter, all growing towards the free end.
    // A banner (u_Calm 1) moves slower, in long waves (less than one along the
    // cloth), and its breeze comes and goes, so its lettering stays readable.
    // A banner also sags a little at its free end when the breeze drops, and its
    // ripples run a little diagonally, as real cloth's do.
    //
    // Inside a wigwam, u_Sun dims the daylight and u_FireLight (the fire's
    // colour, flickering) lights each surface from u_FirePos, falling off with
    // distance and brightest where it faces the fire.
    //
    // With u_Flatten above 0 the same shape is its shadow instead: slid along
    // u_ShadowDir onto the surface through u_Foot facing u_PlaneNormal (the
    // ground under a flag, the wall an arrow is in), faded with distance from
    // u_Foot.
    private static final String MESH_VERTEX =
        "uniform mat4 u_Mvp;\n"
            + "uniform mat4 u_Model;\n"
            + "uniform mat4 u_ViewProjection;\n"
            + "uniform float u_Wave;\n"
            + "uniform float u_Calm;\n"
            + "uniform float u_Time;\n"
            + "uniform float u_Flatten;\n"
            + "uniform vec3 u_Foot;\n"
            + "uniform vec3 u_PlaneNormal;\n"
            + "uniform vec3 u_ShadowDir;\n"
            + "uniform float u_FadeLength;\n"
            + "uniform vec3 u_Eye;\n"
            + "uniform vec3 u_FirePos;\n"
            + "attribute vec3 a_Position;\n"
            + "attribute vec3 a_Normal;\n"
            + "attribute vec2 a_TexCoord;\n"
            + "varying vec2 v_TexCoord;\n"
            + "varying vec3 v_Normal;\n"
            + "varying vec3 v_ToEye;\n"
            + "varying vec3 v_FromFire;\n"
            + "varying float v_Fade;\n"
            + "void main() {\n"
            + "  vec3 p = a_Position;\n"
            + "  vec3 n = a_Normal;\n"
            + "  if (u_Wave > 0.0) {\n"
            + "    float along = a_TexCoord.x;\n"
            + "    float bend;\n"
            + "    float slope;\n"
            + "    if (u_Calm > 0.5) {\n"
            + "      float breeze = 0.6 * sin(0.21 * u_Time) + 0.4 * sin(0.53 * u_Time + 1.7);\n"
            + "      float gust = 0.4 + 0.6 * smoothstep(-0.3, 0.8, breeze);\n"
            + "      float swing = 0.45 * sin(0.37 * u_Time);\n"
            + "      float phase = 2.4 * along - 1.15 * u_Time + 1.3 * a_TexCoord.y;\n"
            + "      float flutter = 7.0 * along - 3.1 * u_Time + 2.2 * a_TexCoord.y;\n"
            + "      bend = swing + gust * (sin(phase) + 0.12 * sin(flutter));\n"
            + "      slope = bend + along * gust * (2.4 * cos(phase) + 0.84 * cos(flutter));\n"
            + "      p.y -= 0.07 * (1.0 - 0.6 * gust) * along * along;\n"
            + "    } else {\n"
            + "      float swing = 2.0 * sin(0.8 * u_Time);\n"
            + "      float phase = 5.0 * along - 3.4 * u_Time + 0.9 * a_TexCoord.y;\n"
            + "      float flutter = 11.0 * along - 6.5 * u_Time + 2.0 * a_TexCoord.y;\n"
            + "      bend = swing + sin(phase) + 0.3 * sin(flutter);\n"
            + "      slope = bend + along * (5.0 * cos(phase) + 3.3 * cos(flutter));\n"
            + "    }\n"
            + "    p.z += u_Wave * along * bend;\n"
            + "    n = normalize(vec3(-u_Wave * slope, 0.0, 1.0));\n"
            + "  }\n"
            + "  v_TexCoord = a_TexCoord;\n"
            + "  v_Normal = (u_Model * vec4(n, 0.0)).xyz;\n"
            + "  vec4 world = u_Model * vec4(p, 1.0);\n"
            + "  v_ToEye = u_Eye - world.xyz;\n"
            + "  v_FromFire = world.xyz - u_FirePos;\n"
            + "  v_Fade = 1.0;\n"
            + "  if (u_Flatten > 0.0) {\n"
            + "    float above = dot(world.xyz - u_Foot, u_PlaneNormal);\n"
            + "    world.xyz -= u_ShadowDir * (above / dot(u_ShadowDir, u_PlaneNormal));\n"
            + "    world.xyz += u_PlaneNormal * 0.003;\n"
            + "    v_Fade = 1.0 - clamp(distance(world.xyz, u_Foot) / u_FadeLength, 0.0, 1.0);\n"
            + "    gl_Position = u_ViewProjection * world;\n"
            + "    gl_Position.z = 0.9999 * gl_Position.w;\n"
            + "  } else {\n"
            + "    gl_Position = u_Mvp * vec4(p, 1.0);\n"
            + "  }\n"
            + "}\n";
    // A flag or banner reads the same from both sides: on its back the band
    // u_Mirror describes (centre, and where the mirroring fades out and ends,
    // as half-widths in texture u) is un-mirrored, as on a printed two-sided
    // flag: the flag's seal, a banner's lettering. The rest of the cloth, with
    // its tears and wear or its swallowtail, stays where it is, and the shadow
    // has the same cut-outs. u_Gloss adds a highlight for carbon, metal,
    // plastic and varnish.
    private static final String MESH_FRAGMENT =
        "precision mediump float;\n"
            + "varying vec2 v_TexCoord;\n"
            + "varying vec3 v_Normal;\n"
            + "varying vec3 v_ToEye;\n"
            + "varying vec3 v_FromFire;\n"
            + "varying float v_Fade;\n"
            + "uniform sampler2D u_Texture;\n"
            + "uniform float u_Sun;\n"
            + "uniform vec3 u_FireLight;\n"
            + "uniform float u_UseTexture;\n"
            + "uniform float u_TwoSided;\n"
            + "uniform vec3 u_Mirror;\n"
            + "uniform float u_Gloss;\n"
            + "uniform float u_Shine;\n"
            + "uniform float u_Metal;\n"
            + "uniform float u_Ambient;\n"
            + "uniform float u_ShadowAlpha;\n"
            + "uniform vec4 u_Color;\n"
            + "void main() {\n"
            + "  vec4 cloth = u_UseTexture > 0.5 ? texture2D(u_Texture, v_TexCoord) : vec4(1.0);\n"
            + "  if (cloth.a < 0.5) discard;\n"
            + "  if (u_ShadowAlpha > 0.0) {\n"
            + "    gl_FragColor = vec4(0.0, 0.0, 0.0, u_ShadowAlpha * v_Fade);\n"
            + "    return;\n"
            + "  }\n"
            + "  vec3 normal = normalize(v_Normal);\n"
            + "  vec3 sun = normalize(vec3(0.35, 0.9, 0.25));\n"
            + "  float light = abs(dot(normal, sun));\n"
            + "  vec4 base = u_UseTexture > 0.5 ? cloth * u_Color : u_Color;\n"
            + "  if (u_TwoSided > 0.5 && !gl_FrontFacing) {\n"
            + "    vec4 flipped = texture2D(u_Texture, vec2(2.0 * u_Mirror.x - v_TexCoord.x, v_TexCoord.y));\n"
            + "    base = mix(base, flipped, 1.0 - smoothstep(u_Mirror.y, u_Mirror.z, abs(v_TexCoord.x - u_Mirror.x)));\n"
            + "  }\n"
            + "  vec3 colour = base.rgb * (u_Ambient + (1.0 - u_Ambient) * light) * u_Sun;\n"
            + "  if (u_FireLight.r > 0.0) {\n"
            + "    float far = length(v_FromFire);\n"
            + "    float facing = 0.35 + 0.65 * abs(dot(normal, v_FromFire / max(far, 0.001)));\n"
            + "    colour += base.rgb * u_FireLight * facing / (1.0 + 2.4 * far * far);\n"
            + "  }\n"
            + "  if (u_Gloss > 0.0) {\n"
            + "    vec3 eye = normalize(v_ToEye);\n"
            + "    if (dot(normal, eye) < 0.0) normal = -normal;\n"
            + "    float shine = pow(max(dot(normal, normalize(sun + eye)), 0.0), u_Shine);\n"
            + "    colour += u_Gloss * shine * base.a * mix(vec3(1.0), base.rgb * 1.6, u_Metal);\n"
            + "  }\n"
            + "  gl_FragColor = vec4(colour, base.a);\n"
            + "}\n";

    /** A placed 3D thing's triangles: interleaved position, normal and texture coordinates. */
    static final class Mesh {
        final FloatBuffer vertices;
        final ShortBuffer indices;
        final int count;

        Mesh(float[] vertexData, short[] indexData) {
            vertices = buffer(vertexData);
            indices = ByteBuffer.allocateDirect(indexData.length * 2).order(ByteOrder.nativeOrder()).asShortBuffer();
            indices.put(indexData).position(0);
            count = indexData.length;
        }
    }

    private static final float[] NDC_QUAD = {-1f, -1f, 1f, -1f, -1f, 1f, 1f, 1f};
    // Unit quad in the XY plane facing +Z; texture v grows downwards.
    private static final float[] UNIT_QUAD = {
        -0.5f, -0.5f, 0f, 0f, 1f,
        0.5f, -0.5f, 0f, 1f, 1f,
        -0.5f, 0.5f, 0f, 0f, 0f,
        0.5f, 0.5f, 0f, 1f, 0f,
    };

    int cameraTexture;
    private int backgroundProgram;
    private int quadProgram;
    private int meshProgram;
    private FloatBuffer ndcCoords;
    private FloatBuffer cameraTexCoords;
    private FloatBuffer unitQuad;
    private final float[] mvp = new float[16];

    private final Map<String, int[]> textures = new HashMap<>();
    private final ConcurrentLinkedQueue<Object[]> uploads = new ConcurrentLinkedQueue<>();

    void init() {
        int[] ids = new int[1];
        GLES20.glGenTextures(1, ids, 0);
        cameraTexture = ids[0];
        GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, cameraTexture);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);

        backgroundProgram = program(BACKGROUND_VERTEX, BACKGROUND_FRAGMENT);
        quadProgram = program(QUAD_VERTEX, QUAD_FRAGMENT);
        try {
            meshProgram = program(MESH_VERTEX, MESH_FRAGMENT);
        } catch (IllegalStateException error) {
            // A GPU that rejects it loses only the 3D things, not AR.
            android.util.Log.w("OnThisSiteAR", "3D shader unavailable: " + error.getMessage());
            meshProgram = 0;
        }
        ndcCoords = buffer(NDC_QUAD);
        cameraTexCoords = buffer(new float[8]);
        unitQuad = buffer(UNIT_QUAD);
        // Textures from a previous GL context are gone; re-upload on demand.
        textures.clear();
    }

    void drawBackground(Frame frame) {
        if (frame.hasDisplayGeometryChanged()) {
            ndcCoords.position(0);
            cameraTexCoords.position(0);
            frame.transformCoordinates2d(
                Coordinates2d.OPENGL_NORMALIZED_DEVICE_COORDINATES, ndcCoords,
                Coordinates2d.TEXTURE_NORMALIZED, cameraTexCoords);
        }
        if (frame.getTimestamp() == 0) return;
        GLES20.glDisable(GLES20.GL_DEPTH_TEST);
        GLES20.glDepthMask(false);
        GLES20.glUseProgram(backgroundProgram);
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
        GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, cameraTexture);
        GLES20.glUniform1i(GLES20.glGetUniformLocation(backgroundProgram, "u_Texture"), 0);
        int position = GLES20.glGetAttribLocation(backgroundProgram, "a_Position");
        int texCoord = GLES20.glGetAttribLocation(backgroundProgram, "a_TexCoord");
        ndcCoords.position(0);
        cameraTexCoords.position(0);
        GLES20.glVertexAttribPointer(position, 2, GLES20.GL_FLOAT, false, 0, ndcCoords);
        GLES20.glVertexAttribPointer(texCoord, 2, GLES20.GL_FLOAT, false, 0, cameraTexCoords);
        GLES20.glEnableVertexAttribArray(position);
        GLES20.glEnableVertexAttribArray(texCoord);
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        GLES20.glDisableVertexAttribArray(position);
        GLES20.glDisableVertexAttribArray(texCoord);
        GLES20.glDepthMask(true);
        GLES20.glEnable(GLES20.GL_DEPTH_TEST);
    }

    void beginQuads() {
        GLES20.glEnable(GLES20.GL_BLEND);
        GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA);
        // Transparent quads are drawn back to front without depth writes so
        // a photo behind a card never punches holes in it.
        GLES20.glDepthMask(false);
        GLES20.glUseProgram(quadProgram);
    }

    void endQuads() {
        GLES20.glDepthMask(true);
        GLES20.glDisable(GLES20.GL_BLEND);
    }

    /** model already includes the quad's world pose and its width/height scale. */
    void drawQuad(float[] viewProjection, float[] model, int texture, float alpha) {
        drawQuad(viewProjection, model, texture, alpha, false);
    }

    /**
     * premultiplied: blend the texture as Android drew it (colour already
     * multiplied by alpha), so a soft coloured glow lights what is behind it
     * instead of darkening it. Placed artwork (the neon stickers) needs this.
     */
    void drawQuad(float[] viewProjection, float[] model, int texture, float alpha, boolean premultiplied) {
        drawQuad(viewProjection, model, texture, alpha, premultiplied, 0f);
    }

    /** additive (0 to 1): how far it adds its light to what is behind instead of covering it, as fire glows. */
    void drawQuad(float[] viewProjection, float[] model, int texture, float alpha, boolean premultiplied, float additive) {
        if (texture == 0 || alpha <= 0.01f) return;
        GLES20.glBlendFunc(premultiplied ? GLES20.GL_ONE : GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA);
        Matrix.multiplyMM(mvp, 0, viewProjection, 0, model, 0);
        GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(quadProgram, "u_Mvp"), 1, false, mvp, 0);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(quadProgram, "u_Alpha"), Math.min(1f, alpha));
        GLES20.glUniform1f(GLES20.glGetUniformLocation(quadProgram, "u_Premultiplied"), premultiplied ? 1f : 0f);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(quadProgram, "u_Additive"), additive);
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, texture);
        GLES20.glUniform1i(GLES20.glGetUniformLocation(quadProgram, "u_Texture"), 0);
        int position = GLES20.glGetAttribLocation(quadProgram, "a_Position");
        int texCoord = GLES20.glGetAttribLocation(quadProgram, "a_TexCoord");
        unitQuad.position(0);
        GLES20.glVertexAttribPointer(position, 3, GLES20.GL_FLOAT, false, 20, unitQuad);
        unitQuad.position(3);
        GLES20.glVertexAttribPointer(texCoord, 2, GLES20.GL_FLOAT, false, 20, unitQuad);
        GLES20.glEnableVertexAttribArray(position);
        GLES20.glEnableVertexAttribArray(texCoord);
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        GLES20.glDisableVertexAttribArray(position);
        GLES20.glDisableVertexAttribArray(texCoord);
    }

    /**
     * Solid 3D things are drawn before the quads, writing depth, so a bubble
     * behind the flag is hidden by it and one in front still shows.
     */
    void beginMeshes() {
        if (meshProgram == 0) return;
        GLES20.glEnable(GLES20.GL_DEPTH_TEST);
        GLES20.glDepthMask(true);
        GLES20.glEnable(GLES20.GL_BLEND);
        GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA);
        GLES20.glUseProgram(meshProgram);
    }

    void endMeshes() {
        GLES20.glDisable(GLES20.GL_BLEND);
    }

    /**
     * One placed 3D part to draw this frame: its mesh and pose, its texture
     * (null draws in the colour; with a texture the colour tints it), and how
     * it moves, shines and casts its shadow.
     */
    static final class MeshDraw {
        Mesh mesh;
        float[] model;
        String texture;
        float[] color = {1f, 1f, 1f, 1f};
        // Above 0 the mesh is a unit cloth waving this far (metres) at its free end.
        float wave;
        // A banner's slow wave rather than a flag's.
        boolean calm;
        // The band of a two-sided cloth un-mirrored on its back: centre, fade start, end.
        float[] mirror = {0.5f, 0.285f, 0.33f};
        float gloss;
        // How tight the highlight is (higher is glossier), and whether it takes
        // the surface's own colour, as on metal (0 to 1).
        float shine = 28f;
        float metal;
        // How lit a side facing away from the light still is (0 to 1). A banner is
        // brighter than the flag, so its colour reads true and its words stand out.
        float ambient = 0.5f;
        // How much daylight reaches it (1 outside; less inside a wigwam), and
        // the fire lighting it (world position; null for none).
        float sun = 1f;
        float[] fire;
        // Where its shadow falls: a point on the surface it stands on or is stuck
        // into (world x, y, z), that surface's normal, the direction the shadow
        // is cast along, and how far it fades out. A null foot casts none.
        float[] shadowFoot;
        float[] shadowNormal = {0f, 1f, 0f};
        float[] shadowDirection = SUN;
        float shadowFade;
        float shadowAlpha = 0.42f;

        static MeshDraw solid(Mesh mesh, float[] model, float[] color) {
            MeshDraw draw = new MeshDraw();
            draw.mesh = mesh;
            draw.model = model;
            draw.color = color;
            return draw;
        }

        static MeshDraw textured(Mesh mesh, float[] model, String texture) {
            MeshDraw draw = new MeshDraw();
            draw.mesh = mesh;
            draw.model = model;
            draw.texture = texture;
            return draw;
        }

        static MeshDraw cloth(Mesh mesh, float[] model, String texture, float wave) {
            MeshDraw draw = textured(mesh, model, texture);
            draw.wave = wave;
            return draw;
        }

        /** Casts its shadow onto the surface through foot facing normal, along direction, fading out by fade metres. */
        MeshDraw shadow(float[] foot, float[] normal, float[] direction, float fade, float alpha) {
            shadowFoot = foot;
            shadowNormal = normal;
            shadowDirection = direction;
            shadowFade = fade;
            shadowAlpha = alpha;
            return this;
        }
    }

    private static final float[] NO_FIRE = {0f, 0f, 0f};

    /** How bright a fire is at this moment: a steady glow with a quick, uneven flicker. */
    static float fireStrength(float time) {
        return 1.15f + 0.12f * (float) Math.sin(time * 13.1f) + 0.08f * (float) Math.sin(time * 7.3f + 1f) + 0.06f * (float) Math.sin(time * 23.7f + 2f);
    }

    /** The light, from above, that shades every placed thing and casts the flag's shadow (world space). */
    static final float[] SUN = normalize3(0.35f, 0.9f, 0.25f);

    private static float[] normalize3(float x, float y, float z) {
        float length = (float) Math.sqrt(x * x + y * y + z * z);
        return new float[] {x / length, y / length, z / length};
    }

    /** eye is the camera's position (world), for highlights. */
    void drawMesh(float[] viewProjection, MeshDraw draw, int texture, float time, float[] eye) {
        if (meshProgram == 0) return;
        Matrix.multiplyMM(mvp, 0, viewProjection, 0, draw.model, 0);
        GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(meshProgram, "u_Mvp"), 1, false, mvp, 0);
        GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(meshProgram, "u_Model"), 1, false, draw.model, 0);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Wave"), draw.wave);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Calm"), draw.calm ? 1f : 0f);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Time"), time);
        GLES20.glUniform3fv(GLES20.glGetUniformLocation(meshProgram, "u_Eye"), 1, eye, 0);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_UseTexture"), texture != 0 ? 1f : 0f);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_TwoSided"), draw.wave > 0f ? 1f : 0f);
        GLES20.glUniform3fv(GLES20.glGetUniformLocation(meshProgram, "u_Mirror"), 1, draw.mirror, 0);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Gloss"), draw.gloss);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Ambient"), draw.ambient);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Sun"), draw.sun);
        GLES20.glUniform3fv(GLES20.glGetUniformLocation(meshProgram, "u_FirePos"), 1, draw.fire != null ? draw.fire : NO_FIRE, 0);
        float flame = draw.fire == null ? 0f : fireStrength(time);
        GLES20.glUniform3f(GLES20.glGetUniformLocation(meshProgram, "u_FireLight"), 1f * flame, 0.56f * flame, 0.24f * flame);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Shine"), draw.shine);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Metal"), draw.metal);
        GLES20.glUniform4fv(GLES20.glGetUniformLocation(meshProgram, "u_Color"), 1, draw.color, 0);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Flatten"), 0f);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_ShadowAlpha"), 0f);
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, texture);
        GLES20.glUniform1i(GLES20.glGetUniformLocation(meshProgram, "u_Texture"), 0);
        drawElements(draw.mesh);
    }

    /**
     * The mesh's shadow on its surface: the shape slid along the shadow's
     * direction onto the surface, darkest at the foot and fading out by its
     * fade length. Call before the meshes themselves. Every shadow fragment
     * gets the same far depth, so where shadows overlap (the pole's and the
     * cloth's, or a fold of the cloth) the first one wins instead of the two
     * darkening each other, and the real meshes still draw over them.
     */
    void drawShadow(float[] viewProjection, MeshDraw draw, int texture, float time) {
        if (meshProgram == 0 || draw.shadowFoot == null) return;
        Matrix.multiplyMM(mvp, 0, viewProjection, 0, draw.model, 0);
        GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(meshProgram, "u_Mvp"), 1, false, mvp, 0);
        GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(meshProgram, "u_Model"), 1, false, draw.model, 0);
        GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(meshProgram, "u_ViewProjection"), 1, false, viewProjection, 0);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Wave"), draw.wave);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Calm"), draw.calm ? 1f : 0f);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Time"), time);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Flatten"), 1f);
        GLES20.glUniform3fv(GLES20.glGetUniformLocation(meshProgram, "u_Foot"), 1, draw.shadowFoot, 0);
        GLES20.glUniform3fv(GLES20.glGetUniformLocation(meshProgram, "u_PlaneNormal"), 1, draw.shadowNormal, 0);
        GLES20.glUniform3fv(GLES20.glGetUniformLocation(meshProgram, "u_ShadowDir"), 1, draw.shadowDirection, 0);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_FadeLength"), draw.shadowFade);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_ShadowAlpha"), draw.shadowAlpha);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_UseTexture"), texture != 0 ? 1f : 0f);
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, texture);
        GLES20.glUniform1i(GLES20.glGetUniformLocation(meshProgram, "u_Texture"), 0);
        drawElements(draw.mesh);
    }

    private void drawElements(Mesh mesh) {
        int position = GLES20.glGetAttribLocation(meshProgram, "a_Position");
        int normal = GLES20.glGetAttribLocation(meshProgram, "a_Normal");
        int texCoord = GLES20.glGetAttribLocation(meshProgram, "a_TexCoord");
        mesh.vertices.position(0);
        GLES20.glVertexAttribPointer(position, 3, GLES20.GL_FLOAT, false, 32, mesh.vertices);
        mesh.vertices.position(3);
        GLES20.glVertexAttribPointer(normal, 3, GLES20.GL_FLOAT, false, 32, mesh.vertices);
        mesh.vertices.position(6);
        GLES20.glVertexAttribPointer(texCoord, 2, GLES20.GL_FLOAT, false, 32, mesh.vertices);
        GLES20.glEnableVertexAttribArray(position);
        GLES20.glEnableVertexAttribArray(normal);
        GLES20.glEnableVertexAttribArray(texCoord);
        mesh.indices.position(0);
        GLES20.glDrawElements(GLES20.GL_TRIANGLES, mesh.count, GLES20.GL_UNSIGNED_SHORT, mesh.indices);
        GLES20.glDisableVertexAttribArray(position);
        GLES20.glDisableVertexAttribArray(normal);
        GLES20.glDisableVertexAttribArray(texCoord);
    }

    /** Thread-safe: queue a bitmap; it is uploaded at the next frame. */
    void queueTexture(String key, Bitmap bitmap) {
        queueTexture(key, bitmap, false);
    }

    /** repeat: the texture tiles (its sides must be powers of two). */
    void queueTexture(String key, Bitmap bitmap, boolean repeat) {
        uploads.add(new Object[] {key, bitmap, repeat});
    }

    void processUploads() {
        Object[] upload;
        while ((upload = uploads.poll()) != null) {
            String key = (String) upload[0];
            Bitmap bitmap = (Bitmap) upload[1];
            int wrap = (Boolean) upload[2] ? GLES20.GL_REPEAT : GLES20.GL_CLAMP_TO_EDGE;
            int[] existing = textures.remove(key);
            if (existing != null) GLES20.glDeleteTextures(1, existing, 0);
            int[] ids = new int[1];
            GLES20.glGenTextures(1, ids, 0);
            GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, ids[0]);
            GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR_MIPMAP_LINEAR);
            GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
            GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, wrap);
            GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, wrap);
            GLUtils.texImage2D(GLES20.GL_TEXTURE_2D, 0, bitmap, 0);
            GLES20.glGenerateMipmap(GLES20.GL_TEXTURE_2D);
            textures.put(key, new int[] {ids[0], bitmap.getWidth(), bitmap.getHeight()});
        }
    }

    int texture(String key) {
        int[] entry = textures.get(key);
        return entry == null ? 0 : entry[0];
    }

    /** Height / width of an uploaded texture, or 0 when it is not ready. */
    float aspect(String key) {
        int[] entry = textures.get(key);
        return entry == null || entry[1] == 0 ? 0f : entry[2] / (float) entry[1];
    }

    boolean hasTexture(String key) {
        return textures.containsKey(key);
    }

    private static FloatBuffer buffer(float[] values) {
        FloatBuffer buffer = ByteBuffer.allocateDirect(values.length * 4).order(ByteOrder.nativeOrder()).asFloatBuffer();
        buffer.put(values).position(0);
        return buffer;
    }

    private static int program(String vertexSource, String fragmentSource) {
        int program = GLES20.glCreateProgram();
        GLES20.glAttachShader(program, shader(GLES20.GL_VERTEX_SHADER, vertexSource));
        GLES20.glAttachShader(program, shader(GLES20.GL_FRAGMENT_SHADER, fragmentSource));
        GLES20.glLinkProgram(program);
        int[] status = new int[1];
        GLES20.glGetProgramiv(program, GLES20.GL_LINK_STATUS, status, 0);
        if (status[0] == 0) throw new IllegalStateException("AR shader link failed: " + GLES20.glGetProgramInfoLog(program));
        return program;
    }

    private static int shader(int type, String source) {
        int shader = GLES20.glCreateShader(type);
        GLES20.glShaderSource(shader, source);
        GLES20.glCompileShader(shader);
        int[] status = new int[1];
        GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, status, 0);
        if (status[0] == 0) throw new IllegalStateException("AR shader compile failed: " + GLES20.glGetShaderInfoLog(shader));
        return shader;
    }
}
