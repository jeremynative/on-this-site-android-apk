package com.nativelongisland.onthissite;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.opengl.EGL14;
import android.opengl.EGLConfig;
import android.opengl.EGLContext;
import android.opengl.EGLDisplay;
import android.opengl.EGLSurface;
import android.opengl.GLES20;
import android.opengl.Matrix;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.List;

/**
 * QA builds only: pictures of the Place drawer's 3D things drawn off screen with
 * the AR view's own shaders and meshes (ArGl, ArModels), so they can be checked
 * on any phone or tablet, without ARCore or a walk. Flags and banners stand on
 * the ground, seen from the front and from behind at a few moments of their
 * wave; arrows are seen in a wall, in the ground and in the air.
 */
final class ArModelPreview {
    private ArModelPreview() {}

    private static final int WIDTH = 900;
    private static final int HEIGHT = 700;

    /** Saves model-<id>-<view>.png into out for each asset; returns how many were saved. */
    static int render(List<ArPlace.Asset> assets, Resources resources, File out) {
        EGLDisplay display = EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY);
        int[] version = new int[2];
        if (!EGL14.eglInitialize(display, version, 0, version, 1)) throw new IllegalStateException("EGL unavailable");
        int[] attributes = {
            EGL14.EGL_RENDERABLE_TYPE, EGL14.EGL_OPENGL_ES2_BIT, EGL14.EGL_SURFACE_TYPE, EGL14.EGL_PBUFFER_BIT,
            EGL14.EGL_RED_SIZE, 8, EGL14.EGL_GREEN_SIZE, 8, EGL14.EGL_BLUE_SIZE, 8, EGL14.EGL_ALPHA_SIZE, 8,
            EGL14.EGL_DEPTH_SIZE, 16, EGL14.EGL_NONE};
        EGLConfig[] configs = new EGLConfig[1];
        int[] count = new int[1];
        EGL14.eglChooseConfig(display, attributes, 0, configs, 0, 1, count, 0);
        if (count[0] == 0) throw new IllegalStateException("No EGL config");
        EGLContext context = EGL14.eglCreateContext(display, configs[0], EGL14.EGL_NO_CONTEXT,
            new int[] {EGL14.EGL_CONTEXT_CLIENT_VERSION, 2, EGL14.EGL_NONE}, 0);
        EGLSurface surface = EGL14.eglCreatePbufferSurface(display, configs[0],
            new int[] {EGL14.EGL_WIDTH, WIDTH, EGL14.EGL_HEIGHT, HEIGHT, EGL14.EGL_NONE}, 0);
        EGL14.eglMakeCurrent(display, surface, surface, context);
        int saved = 0;
        try {
            ArGl gl = new ArGl();
            gl.init();
            GLES20.glViewport(0, 0, WIDTH, HEIGHT);
            for (ArPlace.Asset asset : assets) {
                if (!asset.model()) continue;
                for (String key : asset.textures()) {
                    if (!gl.hasTexture(key)) {
                        gl.queueTexture(key, ArPlace.texture(asset, key, resources), asset.kind == ArPlace.Kind.WIGWAM && ArWigwam.repeats(key));
                    }
                }
                gl.processUploads();
                for (View view : views(asset)) {
                    Bitmap picture = draw(gl, asset, view);
                    String name = "model-" + asset.id.replace(':', '-') + "-" + view.name + ".png";
                    try (FileOutputStream stream = new FileOutputStream(new File(out, name))) {
                        picture.compress(Bitmap.CompressFormat.PNG, 100, stream);
                        saved++;
                    } catch (Exception error) {
                        android.util.Log.w("OnThisSiteAR", "QA model " + name + " failed: " + error);
                    }
                    picture.recycle();
                }
            }
        } finally {
            EGL14.eglMakeCurrent(display, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_CONTEXT);
            EGL14.eglDestroySurface(display, surface);
            EGL14.eglDestroyContext(display, context);
            EGL14.eglTerminate(display);
        }
        return saved;
    }

    /** Where the camera stands and looks, the surface the thing is on, and the moment of the wave. */
    private static final class View {
        final String name;
        final float[] eye;
        final float[] target;
        final float[] normal;
        final boolean inAir;
        final float time;

        View(String name, float[] eye, float[] target, float[] normal, boolean inAir, float time) {
            this.name = name;
            this.eye = eye;
            this.target = target;
            this.normal = normal;
            this.inAir = inAir;
            this.time = time;
        }
    }

    private static List<View> views(ArPlace.Asset asset) {
        List<View> views = new ArrayList<>();
        float[] up = {0f, 1f, 0f};
        if (asset.kind == ArPlace.Kind.WIGWAM) {
            // Outside: near, far off (the plume), at the door and pushing through it; then standing inside.
            float plane = ArWigwam.doorPlane();
            views.add(new View("outside", new float[] {2.8f, 1.7f, 3.9f}, new float[] {0f, 1.0f, -1.9f}, up, false, 5f));
            views.add(new View("outside-far", new float[] {7f, 1.6f, 11f}, new float[] {0f, 3.2f, -1.9f}, up, false, 9f));
            views.add(new View("outside-door", new float[] {0.35f, 1.3f, 1.6f}, new float[] {0f, 0.8f, -1.2f}, up, false, 5f));
            views.add(new View("door-pushed", new float[] {0.12f, 1.15f, plane + 0.75f}, new float[] {0f, 0.7f, plane - 1f}, up, false, 5f));
            views.add(new View("inside-bench", new float[] {0.6f, 1.45f, -1.0f}, new float[] {-1.4f, 0.4f, -1.9f}, up, false, 5f));
            views.add(new View("inside-rack", new float[] {0.1f, 1.45f, -1.2f}, new float[] {0.1f, 0.75f, -3.2f}, up, false, 5f));
            views.add(new View("inside-fire", new float[] {0.65f, 1.05f, -0.95f}, new float[] {0f, 0.2f, -1.9f}, up, false, 6f));
            views.add(new View("inside-right", new float[] {-0.5f, 1.45f, -1.4f}, new float[] {1.5f, 0.8f, -2.2f}, up, false, 5f));
            views.add(new View("inside-door", new float[] {0.1f, 1.4f, -3.0f}, new float[] {0f, 0.8f, -0.2f}, up, false, 5f));
            views.add(new View("inside-up", new float[] {0.35f, 1.3f, -1.35f}, new float[] {0f, 2.45f, -1.9f}, up, false, 7f));
            return views;
        }
        if (asset.standsUp()) {
            float middle = asset.kind == ArPlace.Kind.BANNER ? ArBanner.LENGTH / 2f : ArPlace.FLAG_WIDTH / 2f;
            float[] target = {middle, 1.35f, 0f};
            views.add(new View("front", new float[] {middle + 0.6f, 1.55f, 3.6f}, target, up, false, 0f));
            views.add(new View("front-later", new float[] {middle + 0.6f, 1.55f, 3.6f}, target, up, false, 7.5f));
            views.add(new View("front-gust", new float[] {middle - 0.4f, 1.6f, 3.4f}, target, up, false, 26f));
            views.add(new View("behind", new float[] {middle - 0.5f, 1.55f, -3.6f}, target, up, false, 3f));
            if (asset.kind == ArPlace.Kind.BANNER) {
                float top = ArPlace.POLE_HEIGHT - ArBanner.TOP_GAP - ArBanner.HEIGHT / 2f;
                views.add(new View("close-hoist", new float[] {0.32f, top + 0.05f, 0.55f}, new float[] {0.12f, top, 0f}, up, false, 9f));
                views.add(new View("close-words", new float[] {0.95f, top - 0.1f, 1.35f}, new float[] {0.72f, top, 0f}, up, false, 9f));
            }
            return views;
        }
        // An arrow in a wall facing +Z (seen from in front, from the side and
        // close to its fletching), in the ground, and in the air.
        float[] wall = {0f, 0f, 1f};
        views.add(new View("wall", new float[] {0.5f, 0.28f, 0.8f}, new float[] {0f, 0.06f, 0.33f}, wall, false, 0f));
        views.add(new View("wall-side", new float[] {0.85f, 0.12f, 0.36f}, new float[] {0f, 0.06f, 0.36f}, wall, false, 0f));
        views.add(new View("wall-close", new float[] {0.16f, 0.2f, 0.88f}, new float[] {0f, 0.11f, 0.6f}, wall, false, 0f));
        views.add(new View("ground", new float[] {0.65f, 0.5f, 0.55f}, new float[] {0f, 0.28f, 0.17f}, up, false, 0f));
        views.add(new View("air", new float[] {-0.33f, 0.12f, 0.85f}, new float[] {-0.33f, 0.06f, 0f}, new float[] {-1f, 0f, 0f}, true, 0f));
        views.add(new View("air-point", new float[] {0.1f, 0.04f, 0.2f}, new float[] {0.04f, 0.01f, 0f}, new float[] {-1f, 0f, 0f}, true, 0f));
        return views;
    }

    // Where the visitor stood when placing it, which turns it as AR does.
    private static final float[] PLACER = {0f, 1.5f, 3.6f};

    private static float far(float[] a, float[] b) {
        float dx = a[0] - b[0];
        float dy = a[1] - b[1];
        float dz = a[2] - b[2];
        return dx * dx + dy * dy + dz * dz;
    }

    private static float[] normalize(float x, float y, float z) {
        float length = (float) Math.sqrt(x * x + y * y + z * z);
        return new float[] {x / length, y / length, z / length};
    }

    private static Bitmap draw(ArGl gl, ArPlace.Asset asset, View view) {
        float[] projection = new float[16];
        float[] camera = new float[16];
        float[] viewProjection = new float[16];
        boolean wigwam = asset.kind == ArPlace.Kind.WIGWAM;
        // A phone's camera sees about this much; a little wider inside a wigwam, as a visitor looks round.
        Matrix.perspectiveM(projection, 0, wigwam && view.name.startsWith("inside") ? 64f : 50f, WIDTH / (float) HEIGHT, 0.05f, 100f);
        Matrix.setLookAtM(camera, 0, view.eye[0], view.eye[1], view.eye[2], view.target[0], view.target[1], view.target[2], 0f, 1f, 0f);
        Matrix.multiplyMM(viewProjection, 0, projection, 0, camera, 0);
        // The anchor, posed as AR poses it: at the origin, turned to whoever placed it.
        float[] rotation = ArPlacement.placedRotation(view.normal, new float[] {0f, 0f, 0f}, PLACER, asset.standsUp());
        float[] base = new float[16];
        new com.google.ar.core.Pose(new float[] {0f, 0f, 0f}, rotation).toMatrix(base, 0);
        List<ArGl.MeshDraw> meshes = new ArrayList<>();
        if (asset.kind == ArPlace.Kind.WIGWAM && view.name.equals("door-pushed")) {
            // The door as the visitor's phone pushes it, after a second of pushing.
            float[] door = new float[8];
            float[] pusher = {view.eye[0], view.eye[1], view.eye[2] - 0.55f};
            for (int i = 0; i < 60; i++) ArWigwam.stepDoor(door, pusher, 1f / 60f, view.time + i / 60f);
            ArWigwam.addMeshes(base, 1f, door, gl::hasTexture, meshes);
        } else {
            ArModels.add(asset, base, 1f, view.inAir, gl::hasTexture, meshes);
        }
        GLES20.glClearColor(0.74f, 0.73f, 0.7f, 1f);
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT | GLES20.GL_DEPTH_BUFFER_BIT);
        GLES20.glEnable(GLES20.GL_DEPTH_TEST);
        gl.beginMeshes();
        for (ArGl.MeshDraw mesh : meshes) gl.drawShadow(viewProjection, mesh, gl.texture(mesh.texture), view.time);
        for (ArGl.MeshDraw mesh : meshes) gl.drawMesh(viewProjection, mesh, gl.texture(mesh.texture), view.time, view.eye);
        gl.endMeshes();
        if (wigwam) {
            // Its fire, smoke and words, back to front, as AR draws them.
            float[] forward = normalize(view.target[0] - view.eye[0], view.target[1] - view.eye[1], view.target[2] - view.eye[2]);
            float[] right = normalize(forward[1] * 0f - forward[2] * 1f, forward[2] * 0f - forward[0] * 0f, forward[0] * 1f - forward[1] * 0f);
            float[] upward = {right[1] * forward[2] - right[2] * forward[1], right[2] * forward[0] - right[0] * forward[2], right[0] * forward[1] - right[1] * forward[0]};
            List<ArWigwam.Quad> quads = new ArrayList<>();
            ArWigwam.addQuads(base, 1f, view.time, view.eye, right, upward, true, gl::hasTexture, quads);
            java.util.Collections.sort(quads, (a, b) -> Float.compare(far(b.point, view.eye), far(a.point, view.eye)));
            gl.beginQuads();
            for (ArWigwam.Quad quad : quads) gl.drawQuad(viewProjection, quad.model, gl.texture(quad.texture), quad.alpha, true, quad.additive);
            gl.endQuads();
        }
        ByteBuffer pixels = ByteBuffer.allocateDirect(WIDTH * HEIGHT * 4).order(ByteOrder.nativeOrder());
        GLES20.glReadPixels(0, 0, WIDTH, HEIGHT, GLES20.GL_RGBA, GLES20.GL_UNSIGNED_BYTE, pixels);
        Bitmap upsideDown = Bitmap.createBitmap(WIDTH, HEIGHT, Bitmap.Config.ARGB_8888);
        pixels.position(0);
        upsideDown.copyPixelsFromBuffer(pixels);
        android.graphics.Matrix flip = new android.graphics.Matrix();
        flip.preScale(1f, -1f);
        Bitmap picture = Bitmap.createBitmap(upsideDown, 0, 0, WIDTH, HEIGHT, flip, false);
        upsideDown.recycle();
        return picture;
    }
}
