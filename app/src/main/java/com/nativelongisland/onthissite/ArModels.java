package com.nativelongisland.onthissite;

import android.opengl.Matrix;
import java.util.List;

/**
 * The 3D things from the Place drawer as meshes to draw: the flag and the land
 * banners (a pole, its ball and the waving cloth) and the arrows (shaft,
 * fletching, nock, and their point when in the air), each with the shadow it
 * casts. Used by AR and by QA builds' model pictures, so both draw the same.
 */
final class ArModels {
    private ArModels() {}

    static final ArGl.Mesh POLE = ArPlace.cylinder(18, ArPlace.POLE_RADIUS, ArPlace.POLE_HEIGHT);
    static final ArGl.Mesh FINIAL = ArPlace.sphere(8, 12, ArPlace.FINIAL_RADIUS);
    static final ArGl.Mesh CLOTH = ArPlace.cloth(24, 12);
    // Long and narrow, so more columns than rows.
    static final ArGl.Mesh BANNER_CLOTH = ArPlace.cloth(40, 6);
    private static final float[] GOLD = {0.84f, 0.67f, 0.26f, 1f};
    private static final float[] BRASS = {0.76f, 0.6f, 0.3f, 1f};
    // A banner's rings: round the pole and through a grommet 22.5 mm into the cloth.
    static final ArGl.Mesh RING = ArPlace.torus(
        (ArPlace.POLE_RADIUS + ArBanner.GROMMET_U * ArBanner.LENGTH + ArPlace.POLE_RADIUS + 0.004f) / 2f, 0.0026f, 28, 8);

    // An arrow leans from its surface's normal: back towards where it came from
    // when in the ground, tail up a little when in a wall (it was dropping).
    static final float ARROW_LEAN_GROUND = 32f;
    static final float ARROW_LEAN_WALL = -11f;

    /** Whether a texture is ready to draw with. */
    interface Ready {
        boolean has(String texture);
    }

    /**
     * The meshes for a placed 3D thing. base is its anchor (with the visitor's
     * turn): +Y up for the flag and banners, the surface's normal for an arrow.
     * Parts whose texture isn't ready yet are left out for now.
     */
    static void add(ArPlace.Asset asset, float[] base, float scale, boolean inAir, Ready ready, List<ArGl.MeshDraw> meshes) {
        if (asset.kind == ArPlace.Kind.ARROW) {
            addArrow(asset, base, scale, inAir, ready, meshes);
            return;
        }
        if (asset.kind == ArPlace.Kind.WIGWAM) {
            ArWigwam.addMeshes(base, scale, null, ready, meshes);
            return;
        }
        boolean banner = asset.kind == ArPlace.Kind.BANNER;
        float[] pole = base.clone();
        Matrix.scaleM(pole, 0, scale, scale, scale);
        int first = meshes.size();
        if (banner && ready.has(ArPlace.BANNER_POLE_TEXTURE)) {
            // Varnished wood.
            meshes.add(finish(ArGl.MeshDraw.textured(POLE, pole.clone(), ArPlace.BANNER_POLE_TEXTURE), 0.14f, 18f));
        } else {
            meshes.add(ArGl.MeshDraw.solid(POLE, pole.clone(), ArPlace.poleColor(asset)));
        }
        float[] finial = pole.clone();
        Matrix.translateM(finial, 0, 0f, ArPlace.POLE_HEIGHT + ArPlace.FINIAL_RADIUS * 0.6f, 0f);
        ArGl.MeshDraw ball = ArGl.MeshDraw.solid(FINIAL, finial, GOLD);
        meshes.add(banner ? metal(ball, 0.7f, 40f) : ball);
        // The cloth shows once its artwork is ready (a moment after it is first chosen).
        if (ready.has(asset.texture())) {
            float length = banner ? ArBanner.LENGTH : ArPlace.FLAG_WIDTH;
            float high = banner ? ArBanner.HEIGHT : ArPlace.FLAG_HEIGHT;
            float gap = banner ? ArBanner.TOP_GAP : ArPlace.FLAG_TOP_GAP;
            float[] cloth = pole.clone();
            Matrix.translateM(cloth, 0, ArPlace.POLE_RADIUS, ArPlace.POLE_HEIGHT - gap - high, 0f);
            Matrix.scaleM(cloth, 0, length, high, 1f);
            ArGl.MeshDraw draw = ArGl.MeshDraw.cloth(banner ? BANNER_CLOTH : CLOTH, cloth, asset.texture(),
                (banner ? ArBanner.WAVE : ArPlace.FLAG_WAVE) * scale);
            if (banner) {
                draw.calm = true;
                draw.mirror = ArBanner.mirror(asset.phrase);
                // Woven polyester: a soft, broad sheen along its folds.
                draw.ambient = 0.72f;
                finish(draw, 0.07f, 6f);
            }
            meshes.add(draw);
        }
        if (banner) {
            // A brass ring through each grommet and round the pole.
            float grommetX = ArPlace.POLE_RADIUS + ArBanner.GROMMET_U * ArBanner.LENGTH;
            float behind = -(ArPlace.POLE_RADIUS + 0.004f);
            for (float v : ArBanner.GROMMET_V) {
                float[] ring = pole.clone();
                Matrix.translateM(ring, 0, (grommetX + behind) / 2f, ArPlace.POLE_HEIGHT - ArBanner.TOP_GAP - v * ArBanner.HEIGHT, 0f);
                meshes.add(metal(ArGl.MeshDraw.solid(RING, ring, BRASS), 0.75f, 44f));
            }
        }
        float[] foot = {pole[12], pole[13], pole[14]};
        for (int index = first; index < meshes.size(); index++) {
            meshes.get(index).shadow(foot, new float[] {0f, 1f, 0f}, ArGl.SUN, 3.5f * scale, 0.42f);
        }
    }

    /** A metal surface: its highlight takes its own colour. */
    private static ArGl.MeshDraw metal(ArGl.MeshDraw draw, float gloss, float shine) {
        finish(draw, gloss, shine);
        draw.metal = 1f;
        return draw;
    }

    private static ArGl.MeshDraw finish(ArGl.MeshDraw draw, float gloss, float shine) {
        draw.gloss = gloss;
        draw.shine = shine;
        return draw;
    }

    /**
     * An arrow, leaning from its surface (its frame: ArArrow), scaled. In the
     * air it has its point and casts no shadow; in a surface the point is
     * hidden in it and the arrow's shadow falls on the surface. In the ground
     * it is cast by the same light as a flag's; on a wall the light is turned
     * to come from in front of the wall, so the shadow is short and always
     * shows, whichever way the wall faces. Each part shines as its material
     * does: lacquered wood softly, carbon and plastic sharply, metal in its
     * own colour, feathers and rubber hardly at all.
     */
    private static void addArrow(ArPlace.Asset asset, float[] base, float scale, boolean inAir, Ready ready, List<ArGl.MeshDraw> meshes) {
        ArArrow.Style style = asset.arrow();
        ArArrow.Parts parts = ArArrow.parts(style);
        String[] textures = asset.textures();
        String fletch = textures[0];
        String shaft = textures[1];
        if (!ready.has(shaft) || !ready.has(fletch)) return;
        float[] normal = normalize(new float[] {base[4], base[5], base[6]});
        float[] arrow = lean(base, normal);
        Matrix.scaleM(arrow, 0, scale, scale, scale);
        int first = meshes.size();
        ArGl.MeshDraw shaftDraw = ArGl.MeshDraw.textured(inAir ? parts.shaftInAir : parts.shaftInSurface, arrow, shaft);
        switch (style.shaft) {
            case "carbon":
                finish(shaftDraw, 0.55f, 60f);
                break;
            case "aluminum":
                metal(shaftDraw, 0.6f, 40f).metal = 0.6f;
                break;
            case "fiberglass":
                finish(shaftDraw, 0.35f, 30f);
                break;
            default:
                finish(shaftDraw, style.gloss, 18f);
                break;
        }
        meshes.add(shaftDraw);
        ArGl.MeshDraw nock = ArGl.MeshDraw.solid(parts.nock, arrow, rgba(style.nock));
        meshes.add(style.traditional ? finish(nock, style.gloss, 18f) : finish(nock, 0.45f, 50f));
        ArGl.MeshDraw vanes = ArGl.MeshDraw.textured(parts.fletching, arrow, fletch);
        meshes.add(style.traditional ? finish(vanes, "crow".equals(style.bird) ? 0.14f : 0.05f, 8f) : finish(vanes, 0.3f, 30f));
        if (inAir) {
            ArGl.MeshDraw point;
            if (style.point == ArArrow.Point.STONE) {
                // Knapped stone, its broad face turned to the visitor (an arrow in
                // the air is placed with its frame's X towards them): glassy flake scars.
                float[] flat = arrow.clone();
                Matrix.rotateM(flat, 0, 90f, 0f, 1f, 0f);
                point = textures.length > 2 && ready.has(textures[2])
                    ? finish(ArGl.MeshDraw.textured(parts.point, flat, textures[2]), 0.3f, 40f)
                    : finish(ArGl.MeshDraw.solid(parts.point, flat, rgba(style.pointColor)), 0.3f, 40f);
            } else if (style.point == ArArrow.Point.STEEL) {
                point = metal(ArGl.MeshDraw.solid(parts.point, arrow, rgba(style.pointColor)), 0.9f, 60f);
            } else {
                point = finish(ArGl.MeshDraw.solid(parts.point, arrow, rgba(style.pointColor)), 0.06f, 8f);
            }
            meshes.add(point);
            return;
        }
        float[] foot = {base[12], base[13], base[14]};
        float[] cast = ArGl.SUN;
        if (Math.abs(normal[1]) <= 0.7f) {
            float facing = dot(ArGl.SUN, normal);
            cast = normalize(new float[] {
                (ArGl.SUN[0] - normal[0] * facing) * 0.55f + normal[0],
                (ArGl.SUN[1] - normal[1] * facing) * 0.55f + normal[1],
                (ArGl.SUN[2] - normal[2] * facing) * 0.55f + normal[2]});
        }
        for (int index = first; index < meshes.size(); index++) {
            meshes.get(index).shadow(foot, normal, cast, 0.75f * scale, 0.32f);
        }
    }

    /** The arrow's frame: base leaned about its own X, towards +Z in the ground (the visitor) or up in a wall. */
    static float[] lean(float[] base, float[] normal) {
        float[] arrow = base.clone();
        boolean ground = Math.abs(normal[1]) > 0.7f;
        Matrix.rotateM(arrow, 0, ground ? ARROW_LEAN_GROUND : ARROW_LEAN_WALL, 1f, 0f, 0f);
        return arrow;
    }

    /** The middle of a placed arrow (world), for its tap box. */
    static float[] arrowMiddle(float[] base, float scale) {
        float[] arrow = lean(base, normalize(new float[] {base[4], base[5], base[6]}));
        float[] middle = new float[4];
        Matrix.multiplyMV(middle, 0, arrow, 0, new float[] {0f, ArArrow.SHAFT_TOP * scale / 2f, 0f, 1f}, 0);
        return new float[] {middle[0], middle[1], middle[2]};
    }

    static float[] rgba(int color) {
        return new float[] {android.graphics.Color.red(color) / 255f, android.graphics.Color.green(color) / 255f,
            android.graphics.Color.blue(color) / 255f, 1f};
    }

    private static float dot(float[] a, float[] b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    private static float[] normalize(float[] v) {
        float length = (float) Math.sqrt(dot(v, v));
        return length < 1e-6f ? new float[] {0f, 1f, 0f} : new float[] {v[0] / length, v[1] / length, v[2] / length};
    }
}
