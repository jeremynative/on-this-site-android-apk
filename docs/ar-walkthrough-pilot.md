# AR walk-through pilot (Ma's House)

Native AR view (`ArActivity`) for walking through a site with the phone camera:
floating family and archival photos, before/after photos locked to the spot they
were taken from, and language/audio prompts that visitors discover. Android
first (ARCore 1.56, declared optional so non-AR devices still install the app).
iOS will mirror the same scene format with ARKit once Xcode signing is restored.

## How it anchors content (inside and outside)

GPS does not work indoors and drifts by metres outside, so every room is anchored
to a printed **room card** (`app/src/main/assets/ar/markers/marker-N.png`, eight
cards, regenerate with `scripts/generate-ar-markers.ps1`).

- Print each card **exactly 20 cm wide** on matte paper (gloss glare breaks tracking).
- Mount it flat on a wall at roughly chest height, or lay it flat on a table. One per
  room or outdoor area (porch, yard). It must not move after content is placed.
- Scanning a card sets that room's frame. All content is stored relative to the card,
  so it reappears in the same place on every visit and every phone.
- Only the current room's layer shows: the room whose drawn zone the visitor is
  standing in, otherwise the last card scanned. That keeps rooms from showing
  through walls.

## Author mode (QA builds)

Long-press the app icon → **AR author mode** (visitor view is **Ma's House AR**).

1. Scan a card → name the room, tick **Open to visitors** for public rooms
   (untick for bedrooms, offices, storage) and **Outdoors** if it applies.
2. **Photo** → choose an image → title/caption/credit, Family or Archival layer →
   aim the ring at a wall, table or floor and tap. Wall photos hang flat on the wall;
   floor/table placements stand upright facing you.
3. **Before/after** → choose the old photo → stand where it was taken, line the
   translucent photo up with the room, set the distance slider to roughly how far
   away the main subject is, tap **Anchor**. Visitors see a "STAND HERE" ring on the
   floor; standing on it lines the photo up and shows a Then/Now slider.
4. **Prompt** → Language word or Audio clip. Leave **Discoverable** ticked to let the
   app place it, or untick to tap a fixed spot. Optionally attach an audio file.
   Only enter community-approved words and pronunciations.
5. **Zone** → tap the floor at the corners of the open, walkable area of a room.
   Discoverable prompts then appear only inside it. Without a zone they stay within
   3.5 m of the card.
6. **More → Export scene** saves a `.zip` (scene.json + photos + audio) to share
   with another phone (**Import**) or, later, to load into Directus.

## Where discoverable prompts may appear

Each visit places them fresh, one at a time, using only spots that pass every rule
(`ArPlacement` + `ArActivity.spawnDiscoverables`):

- The visitor is in a room marked **Open to visitors**; private rooms never get prompts.
- The spot is an upward-facing surface ARCore has detected **and the camera is
  looking at right now**, so it is a visible, physical surface, never inside a wall
  or behind a closed door.
- 0.25–2.2 m below the camera (floor or table, not shelves or stairwells), and
  0.8–4 m away horizontally.
- Inside the room's drawn zone (or radius), and not inside a private room's zone or
  nearer a private room's card than this room's card.
- At least 1 m from other content.
- It floats at chest height over a floor or just above a table. Walking within
  1.6 m reveals it, plays any audio, and buzzes the phone.

## Scene format

`scene.json` (bundled default: `app/src/main/assets/ar/mas-house/scene.json`;
authored copy in app storage). Poses are `[tx, ty, tz, qx, qy, qz, qw]` in the
room frame: origin at the card centre, +Y up, +Z out from the card into the room.

```json
{ "schema": 1, "site_id": "mas-house",
  "markers": [{ "id": "marker-1", "asset": "asset:ar/markers/marker-1.png", "width_m": 0.2 }],
  "rooms": [{ "id": "room-…", "marker_id": "marker-1", "name": "Kitchen", "public": true,
              "outdoor": false, "discover_radius_m": 3.5, "zone": [[x, z], …] }],
  "items": [{ "id": "item-…", "room_id": "room-…", "layer": "family|archival|language|audio",
              "kind": "photo|rephoto|phrase|audio", "placement": "anchored|discover",
              "title": "", "caption": "", "credit": "", "word": "", "pronunciation": "",
              "meaning": "", "image": "item-….jpg", "audio": "", "width_m": 0.6,
              "pose": [7 numbers], "viewpoint": [7 numbers, before/after only] }] }
```

## Proposed Directus collections (not created yet)

`ar_scenes` (site, title, status), `ar_rooms` (scene, marker_id, name, public,
outdoor, discover_radius_m, zone JSON), `ar_items` (scene, room, layer, kind,
placement, text fields, image/audio file relations, width_m, pose JSON,
viewpoint JSON, review_status, approved_by). Family photos need a decision before
anything is uploaded: Directus files are publicly readable today, so private
family material should either stay in exported scene files or go into a
restricted folder/role.

## Verification

- `javac -d build/ar-verify app/src/main/java/com/nativelongisland/onthissite/ArPlacement.java scripts/VerifyArPlacement.java`
  then `java -cp build/ar-verify com.nativelongisland.onthissite.VerifyArPlacement`
  (room-frame maths, zone and drop-spot rules, before/after sizing).
- Unsupported device (iPlay 50 mini Pro): shows "This device doesn't support AR"
  instead of sending people to the Play Store.
- On-site checks still needed on an ARCore phone: card detection distance, wall vs
  table placement, before/after alignment, discover rules in a private room,
  outdoor porch card in daylight, and drift walking between rooms.
