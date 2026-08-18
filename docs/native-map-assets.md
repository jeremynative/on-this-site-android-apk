# Native map assets

The production MapLibre Native renderer uses project-owned style JSON and two bounded PMTiles archives derived from the current Protomaps Basemap build of OpenStreetMap and Natural Earth data.

- Coverage: `-74.35,40.40,-71.65,41.35`
- Bundled partial-offline archive: zoom 0 through 10, copied from APK assets into the app's private files directory before MapLibre opens it.
- Self-hosted online archive: zoom 0 through 14, published separately to `https://directus.nativelongisland.com/app/map/long-island-z14.pmtiles` by the web repository's `Deploy native Long Island map archive` workflow.
- Map style: `app/src/main/assets/map/on-this-site-native-style.json`
- Glyphs: bundled Noto Sans Regular PBF ranges from `protomaps/basemaps-assets`, licensed under the SIL Open Font License in `app/src/main/assets/map-font/OFL.txt`.

The August 17, 2026 source build was extracted with go-pmtiles 1.31.2:

```text
pmtiles extract https://build.protomaps.com/20260817.pmtiles long-island.pmtiles --bbox=-74.35,40.40,-71.65,41.35 --maxzoom=14
```

The public map credit must continue to identify OpenStreetMap contributors. Project GeoJSON overlays and the Long Island outline retain their existing On This Site/NYS source credits in the app's compact data-credit control.

## Native overlay bridge

The native renderer receives one cached state snapshot from the existing mobile app instead of issuing its own Directus requests. The snapshot currently covers ancestral territories, site polygons and points, project labels, biography paths, current calendar events, user location, unread badges, contributor journey paths and markers, community stories, approved plant observations, approved site suggestions, temporary search/suggestion pins, and the selected-site label.

The APK already packages the project's map-marker PNGs under `assets/map-icons`. MapLibre Native normalizes those images to a consistent 64-pixel transparent canvas and references them through each site's `native_icon_key`; listings without a packaged custom icon keep the small default project point.

The Obtainium APK packages `arm64-v8a` and `armeabi-v7a` to keep the universal download compact. The Google Play App Bundle packages those plus `x86` and `x86_64`; Play then delivers only the architecture needed by each tester's device.

MapLibre Native feature taps are routed back to the existing content, contributor, story, plant, event, and suggestion UI. The renderer does not duplicate those API calls or contribution forms.
