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
 * everything, placed 3D things (the flag), and alpha-blended textured quads
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
            + "void main() { vec4 c = texture2D(u_Texture, v_TexCoord);"
            + " gl_FragColor = vec4(c.rgb * mix(1.0, u_Alpha, u_Premultiplied), c.a * u_Alpha); }\n";

    // Placed 3D things (the flag): lit from above, both sides shaded alike. With
    // u_Wave above 0 the mesh is a unit cloth blowing from its pole edge
    // (texture u = 0): a slow swing about the pole, a travelling ripple, and a
    // quicker flutter, all growing towards the free end.
    //
    // With u_Flatten above 0 the same shape is its shadow instead: slid along the
    // light onto the ground (y = u_Foot.y) and faded with distance from u_Foot.
    private static final String MESH_VERTEX =
        "uniform mat4 u_Mvp;\n"
            + "uniform mat4 u_Model;\n"
            + "uniform mat4 u_ViewProjection;\n"
            + "uniform float u_Wave;\n"
            + "uniform float u_Time;\n"
            + "uniform float u_Flatten;\n"
            + "uniform vec3 u_Foot;\n"
            + "uniform float u_FadeLength;\n"
            + "attribute vec3 a_Position;\n"
            + "attribute vec3 a_Normal;\n"
            + "attribute vec2 a_TexCoord;\n"
            + "varying vec2 v_TexCoord;\n"
            + "varying vec3 v_Normal;\n"
            + "varying float v_Fade;\n"
            + "void main() {\n"
            + "  vec3 p = a_Position;\n"
            + "  vec3 n = a_Normal;\n"
            + "  if (u_Wave > 0.0) {\n"
            + "    float along = a_TexCoord.x;\n"
            + "    float swing = 2.0 * sin(0.8 * u_Time);\n"
            + "    float phase = 5.0 * along - 3.4 * u_Time + 0.9 * a_TexCoord.y;\n"
            + "    float flutter = 11.0 * along - 6.5 * u_Time + 2.0 * a_TexCoord.y;\n"
            + "    p.z += u_Wave * along * (swing + sin(phase) + 0.3 * sin(flutter));\n"
            + "    float slope = u_Wave * (swing + sin(phase) + 0.3 * sin(flutter)\n"
            + "      + along * (5.0 * cos(phase) + 3.3 * cos(flutter)));\n"
            + "    n = normalize(vec3(-slope, 0.0, 1.0));\n"
            + "  }\n"
            + "  v_TexCoord = a_TexCoord;\n"
            + "  v_Normal = (u_Model * vec4(n, 0.0)).xyz;\n"
            + "  v_Fade = 1.0;\n"
            + "  if (u_Flatten > 0.0) {\n"
            + "    vec3 toward = normalize(vec3(0.35, 0.9, 0.25));\n"
            + "    vec4 world = u_Model * vec4(p, 1.0);\n"
            + "    world.xyz -= toward * ((world.y - u_Foot.y) / toward.y);\n"
            + "    world.y = u_Foot.y + 0.003;\n"
            + "    v_Fade = 1.0 - clamp(distance(world.xz, u_Foot.xz) / u_FadeLength, 0.0, 1.0);\n"
            + "    gl_Position = u_ViewProjection * world;\n"
            + "    gl_Position.z = 0.9999 * gl_Position.w;\n"
            + "  } else {\n"
            + "    gl_Position = u_Mvp * vec4(p, 1.0);\n"
            + "  }\n"
            + "}\n";
    // A flag reads the same from both sides: the seal on its back is un-mirrored,
    // as on a printed two-sided flag. The rest of the cloth, with its tears and
    // wear, stays where it is, and the shadow has the tears too.
    private static final String MESH_FRAGMENT =
        "precision mediump float;\n"
            + "varying vec2 v_TexCoord;\n"
            + "varying vec3 v_Normal;\n"
            + "varying float v_Fade;\n"
            + "uniform sampler2D u_Texture;\n"
            + "uniform float u_UseTexture;\n"
            + "uniform float u_TwoSided;\n"
            + "uniform float u_ShadowAlpha;\n"
            + "uniform vec4 u_Color;\n"
            + "void main() {\n"
            + "  vec4 cloth = u_UseTexture > 0.5 ? texture2D(u_Texture, v_TexCoord) : vec4(1.0);\n"
            + "  if (cloth.a < 0.5) discard;\n"
            + "  if (u_ShadowAlpha > 0.0) {\n"
            + "    gl_FragColor = vec4(0.0, 0.0, 0.0, u_ShadowAlpha * v_Fade);\n"
            + "    return;\n"
            + "  }\n"
            + "  float light = abs(dot(normalize(v_Normal), normalize(vec3(0.35, 0.9, 0.25))));\n"
            + "  vec4 base = u_UseTexture > 0.5 ? cloth : u_Color;\n"
            + "  if (u_TwoSided > 0.5 && !gl_FrontFacing) {\n"
            + "    vec4 flipped = texture2D(u_Texture, vec2(1.0 - v_TexCoord.x, v_TexCoord.y));\n"
            + "    base = mix(base, flipped, 1.0 - smoothstep(0.285, 0.33, abs(v_TexCoord.x - 0.5)));\n"
            + "  }\n"
            + "  gl_FragColor = vec4(base.rgb * (0.5 + 0.5 * light), base.a);\n"
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
            // A GPU that rejects it loses only the 3D flag, not AR.
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
        if (texture == 0 || alpha <= 0.01f) return;
        GLES20.glBlendFunc(premultiplied ? GLES20.GL_ONE : GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA);
        Matrix.multiplyMM(mvp, 0, viewProjection, 0, model, 0);
        GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(quadProgram, "u_Mvp"), 1, false, mvp, 0);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(quadProgram, "u_Alpha"), Math.min(1f, alpha));
        GLES20.glUniform1f(GLES20.glGetUniformLocation(quadProgram, "u_Premultiplied"), premultiplied ? 1f : 0f);
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

    /** texture 0 draws in the colour (r, g, b, a); wave above 0 ripples a unit cloth. */
    void drawMesh(float[] viewProjection, float[] model, Mesh mesh, int texture, float[] color, float wave, float time) {
        if (meshProgram == 0) return;
        Matrix.multiplyMM(mvp, 0, viewProjection, 0, model, 0);
        GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(meshProgram, "u_Mvp"), 1, false, mvp, 0);
        GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(meshProgram, "u_Model"), 1, false, model, 0);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Wave"), wave);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Time"), time);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_UseTexture"), texture != 0 ? 1f : 0f);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_TwoSided"), wave > 0f ? 1f : 0f);
        GLES20.glUniform4fv(GLES20.glGetUniformLocation(meshProgram, "u_Color"), 1, color, 0);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Flatten"), 0f);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_ShadowAlpha"), 0f);
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, texture);
        GLES20.glUniform1i(GLES20.glGetUniformLocation(meshProgram, "u_Texture"), 0);
        drawElements(mesh);
    }

    /**
     * The mesh's shadow on the ground at foot (world x, y, z): the shape slid
     * along the light onto that level, darkest at the foot and fading out by
     * fadeLength metres. Call before the meshes themselves. Every shadow
     * fragment gets the same far depth, so where shadows overlap (the pole's and
     * the cloth's, or a fold of the cloth) the first one wins instead of the
     * two darkening each other, and the real meshes still draw over them.
     */
    void drawShadow(float[] viewProjection, float[] model, Mesh mesh, int texture, float wave, float time, float[] foot, float fadeLength, float alpha) {
        if (meshProgram == 0) return;
        Matrix.multiplyMM(mvp, 0, viewProjection, 0, model, 0);
        GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(meshProgram, "u_Mvp"), 1, false, mvp, 0);
        GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(meshProgram, "u_Model"), 1, false, model, 0);
        GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(meshProgram, "u_ViewProjection"), 1, false, viewProjection, 0);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Wave"), wave);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Time"), time);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_Flatten"), 1f);
        GLES20.glUniform3fv(GLES20.glGetUniformLocation(meshProgram, "u_Foot"), 1, foot, 0);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_FadeLength"), fadeLength);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_ShadowAlpha"), alpha);
        GLES20.glUniform1f(GLES20.glGetUniformLocation(meshProgram, "u_UseTexture"), texture != 0 ? 1f : 0f);
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, texture);
        GLES20.glUniform1i(GLES20.glGetUniformLocation(meshProgram, "u_Texture"), 0);
        drawElements(mesh);
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
        uploads.add(new Object[] {key, bitmap});
    }

    void processUploads() {
        Object[] upload;
        while ((upload = uploads.poll()) != null) {
            String key = (String) upload[0];
            Bitmap bitmap = (Bitmap) upload[1];
            int[] existing = textures.remove(key);
            if (existing != null) GLES20.glDeleteTextures(1, existing, 0);
            int[] ids = new int[1];
            GLES20.glGenTextures(1, ids, 0);
            GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, ids[0]);
            GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR_MIPMAP_LINEAR);
            GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
            GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
            GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);
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
