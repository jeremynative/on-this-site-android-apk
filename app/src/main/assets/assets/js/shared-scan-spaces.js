// AR for the Android app's home-screen AR button and the AR button on a
// site panel: the camera opens straight onto bubbles (stories, people,
// words, finds) floating around the visitor. The AR view is a native (APK)
// screen. Photogrammetry scanning was removed on 2026-11-01.
(function () {
  function create(ctx) {
    const { state, DIRECTUS, openSheet, androidBridgeToken, requestUserLocation, nativeCachedUserPosition, sheetEl, listEl } = ctx;
    // APK copy: the offline shell passes iconBase (bundled "asset:" icons the
    // AR screen opens without a network) and siteDetail (the bundled page).

    // The AR button shows in any version of the app; one too old for AR
    // bubbles is asked to update.
    function arAppAvailable() {
      return Boolean(window.AndroidApp?.openArNearby || window.AndroidApp?.openScanSpace);
    }

    function arUserLocation() {
      const native = window.AndroidApp?.getCachedLocation ? nativeCachedUserPosition() : null;
      if (native) return { lat: native.latitude, lng: native.longitude };
      const known = Array.isArray(state.userLocation) ? state.userLocation : null;
      return known ? { lat: Number(known[1]), lng: Number(known[0]) } : null;
    }

    // AR like Pokémon GO: the camera opens straight away and bubbles float
    // around you at eye level, with no scan, marker card or placing needed.
    // Anywhere: clips about the ancestral land you are standing on and its
    // history, the biography people of the area, and animal relatives who
    // teach a word. At a site (standing near it): what is unique to that
    // place. Burial grounds and sensitive places never become bubbles.
    const AR_GUIDES = [
      ["Black duck", "animal-american-black-duck.png"],
      ["Eel", "animal-american-eel.png"],
      ["Box turtle", "animal-eastern-box-turtle.png"],
      ["Deer", "animal-white-tailed-deer.png"],
      ["Turkey", "animal-wild-turkey.png"]
    ];
    const AR_ICON_BASE = ctx.iconBase || "https://nativelongisland.com/assets/map-icons/";
    const AR_PERSON_ICON = AR_ICON_BASE + "person-biography-marker.png";
    const AR_WORDS = 2;
    const AR_PEOPLE = 4;
    const AR_PEOPLE_KM = 20;
    const AR_LAND_KM = 8;
    // Photo stories and plant IDs this close float where they were photographed.
    const AR_FIND_KM = 0.5;
    const AR_FINDS = 4;
    // Standing this close to a site (or inside its land) opens its own AR.
    const SITE_AR_KM = 0.5;

    function arDistanceKm(a, b) {
      const rad = Math.PI / 180;
      const dLat = (b.lat - a.lat) * rad;
      const dLng = (b.lng - a.lng) * rad;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
      return 12742 * Math.asin(Math.sqrt(h));
    }

    // Compass bearing (degrees from true north) from a to b.
    function arBearingDeg(a, b) {
      const rad = Math.PI / 180;
      const y = Math.sin((b.lng - a.lng) * rad) * Math.cos(b.lat * rad);
      const x = Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos((b.lng - a.lng) * rad);
      return (Math.atan2(y, x) / rad + 360) % 360;
    }

    // Points a bubble toward a real place, so the app floats it that way.
    // Not when the visitor is already there (the direction means nothing).
    function arToward(item, here, target) {
      if (!here || !target || !Number.isFinite(target.lat) || !Number.isFinite(target.lng)) return item;
      const metres = arDistanceKm(here, target) * 1000;
      return metres < 40 ? item : { ...item, bearing_deg: Math.round(arBearingDeg(here, target) * 10) / 10, distance_m: Math.round(metres) };
    }

    // A find's GPS point (where its photo was taken), so the app floats it at
    // that spot instead of anywhere. Older apps use the direction alone.
    function arAtSpot(item, here, lat, lng) {
      const spot = { lat: Number(lat), lng: Number(lng) };
      if (lat == null || lng == null || !Number.isFinite(spot.lat) || !Number.isFinite(spot.lng)) return item;
      const placed = { ...item, spot };
      return here ? { ...placed, bearing_deg: Math.round(arBearingDeg(here, spot) * 10) / 10, distance_m: Math.round(arDistanceKm(here, spot) * 1000) } : placed;
    }

    function arStoryItem(story, here) {
      return arAtSpot({
        id: `story-${story.id}`, layer: "family", kind: "photo", placement: "discover",
        title: story.author_name ? `Shared by ${arText(story.author_name)}` : "A photo story",
        caption: arText(story.caption), credit: story.created_at ? new Date(story.created_at).toLocaleDateString() : "",
        image: arAsset(story.photo)
      }, here, story.latitude, story.longitude);
    }

    function arPlantItem(plant, here) {
      return arAtSpot({
        id: `plant-${plant.id}`, layer: "archival", kind: "note", placement: "discover",
        title: arText(plant.common_name || "A plant found here"),
        // Placeholder guidance ("Connect this observation…") isn't knowledge; leave it out.
        caption: [plant.scientific_name, plant.algonquian_word ? `Algonquian: ${plant.algonquian_word}` : "",
          /^connect this observation/i.test(plant.indigenous_context || "") ? "" : plant.indigenous_context]
          .map(part => arText(part).replace(/\.$/, "")).filter(Boolean).join(". "),
        credit: plant.author_name ? `Found by ${arText(plant.author_name)}` : "Community plant find",
        image: arAsset(plant.photo)
      }, here, plant.observation_latitude, plant.observation_longitude);
    }

    const arShared = record => !/rejected|deleted/i.test(record.status || "");

    // Photo stories and plant IDs, a plant posted with a photo story shown
    // once (as the story).
    function arFinds(stories, plants, here) {
      const storyPlants = new Set(stories.map(story => String(story.plant_observation?.id ?? story.plant_observation ?? "")));
      return [...stories.map(story => arStoryItem(story, here)),
        ...plants.filter(plant => !storyPlants.has(String(plant.id))).map(plant => arPlantItem(plant, here))];
    }

    function arShuffled(list, random = Math.random) {
      const copy = list.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    // Plain text for the AR cards (summaries are stored with HTML entities).
    function arText(value) {
      const entities = { amp: "&", quot: "\"", "#39": "'", apos: "'", lt: "<", gt: ">", nbsp: " " };
      return String(value || "").replace(/<[^>]*>/g, " ").replace(/&(amp|quot|#39|apos|lt|gt|nbsp);/g, (match, name) => entities[name])
        .replace(/\s+/g, " ").trim();
    }

    function arInsideRing(point, ring) {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if ((yi > point.lat) !== (yj > point.lat) && point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }

    function arInsideGeometry(point, geometry) {
      if (!Array.isArray(geometry?.coordinates)) return false;
      const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
      return polygons.some(polygon => arInsideRing(point, polygon[0] || []) && !polygon.slice(1).some(hole => arInsideRing(point, hole)));
    }

    // A rough middle of a point or polygon, for distances.
    function arGeometryCentre(geometry) {
      if (geometry?.type === "Point") return { lng: Number(geometry.coordinates[0]), lat: Number(geometry.coordinates[1]) };
      const points = JSON.stringify(geometry?.coordinates || []).match(/-?\d+(\.\d+)?,-?\d+(\.\d+)?/g) || [];
      if (!points.length) return null;
      const pairs = points.map(pair => pair.split(",").map(Number));
      const xs = pairs.map(pair => pair[0]);
      const ys = pairs.map(pair => pair[1]);
      return { lng: (Math.min(...xs) + Math.max(...xs)) / 2, lat: (Math.min(...ys) + Math.max(...ys)) / 2 };
    }

    // Land-history entries describe a site; the shape is the site's own.
    function arEntryGeometry(entry) {
      const site = (state.sites || []).find(item => Number(item.id) === Number(entry.siteId) || item.slug === entry.slug);
      const shape = site?.displayGeometry || site?.geojson || null;
      if (typeof shape !== "string") return shape;
      try {
        return JSON.parse(shape);
      } catch {
        return null;
      }
    }

    function arLandEntries() {
      return (window.NLI_LAND_HISTORY_DATA?.entries || []).filter(entry => entry.reviewStatus !== "draft");
    }

    function arSource(entry) {
      return (entry.sources || []).map(source => source.citation).filter(Boolean)[0] || "On This Site land history";
    }

    // Clips about one land-history entry: its story, its history, and how
    // to visit respectfully.
    function arLandClips(entry, prefix = "") {
      const credit = arSource(entry);
      const respect = entry.sensitivity ? ` ${arText(entry.sensitivity)}` : "";
      const clips = [{
        id: `${prefix}land-${entry.slug}`, layer: "archival", kind: "note", placement: "discover",
        title: arText(entry.title), caption: `${entry.dateLabel ? `${arText(entry.dateLabel)}. ` : ""}${arText(entry.description)}${respect}`, credit
      }];
      if (entry.historicalContext) clips.push({
        id: `${prefix}land-context-${entry.slug}`, layer: "archival", kind: "note", placement: "discover",
        title: `${arText(entry.title)}: the history`, caption: arText(entry.historicalContext), credit
      });
      if (arText(entry.community).length >= 60) clips.push({
        id: `${prefix}land-community-${entry.slug}`, layer: "archival", kind: "note", placement: "discover",
        title: `${arText(entry.title)}: the people`, caption: arText(entry.community), credit
      });
      return clips;
    }

    // Biography people with a documented place within reach, at their nearest place.
    function arPeople(point, withinKm, limit, here = point) {
      const people = window.NLI_BIOGRAPHY_PATH_DATA || {};
      return Object.entries(people)
        .map(([slug, person]) => {
          const near = (person.places || [])
            .filter(place => Array.isArray(place.coordinates))
            .map(place => ({ place, km: arDistanceKm(point, { lng: Number(place.coordinates[0]), lat: Number(place.coordinates[1]) }) }))
            .sort((a, b) => a.km - b.km)[0];
          return near && near.km <= withinKm ? { slug, person, ...near } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.km - b.km)
        .slice(0, limit)
        .map(({ slug, person, place }) => {
          const intro = arText((state.wikiArticles || []).find(article => article.slug === slug)?.summary);
          const name = arText(person.mapLabel || person.title);
          return arToward({
            id: `person-${slug}`, layer: "archival", kind: "note", placement: "discover",
            title: `Meet ${name}`,
            caption: `${intro ? `${intro}\n\n` : ""}Near here${place.dateLabel ? `, ${arText(place.dateLabel)}` : ""} (${arText(place.place)}): ${arText(place.eventTitle)}. ${arText(place.reason)}`,
            credit: `From the On This Site biography "${arText(person.title)}"`,
            figure: AR_PERSON_ICON
          }, here, { lng: Number(place.coordinates[0]), lat: Number(place.coordinates[1]) });
        });
    }

    function arWords(count, random) {
      const words = window.NLI_LANGUAGE_QUIZ_WORDS || [];
      // Greetings first: they are what a guide says on meeting you.
      const greetings = words.filter(word => /greeting|thank you/.test(word.english));
      const picked = [...arShuffled(greetings, random), ...arShuffled(words.filter(word => !greetings.includes(word)), random)].slice(0, count);
      const first = Math.floor(random() * AR_GUIDES.length);
      return picked.map((word, index) => {
        const [name, icon] = AR_GUIDES[(first + index) % AR_GUIDES.length];
        const others = arShuffled(words.filter(other => other.english !== word.english), random).slice(0, 2).map(other => other.english);
        return {
          id: `word-${word.id}`, layer: "language", kind: "phrase", placement: "discover",
          title: name, word: word.algonquian, meaning: word.english,
          choices: arShuffled([word.english, ...others], random),
          credit: word.source, figure: AR_ICON_BASE + icon
        };
      });
    }

    // A site page's article sections, read for AR in this order.
    const AR_SECTIONS = [
      ["introduction_content", "Welcome"],
      ["history_content", "History"],
      ["oral_history_content", "Oral history"],
      ["translation_content", "What the name means"],
      ["legends_and_lore_content", "Legends and lore"],
      ["artifacts_content", "Artifacts"],
      ["colonial_description_content", "In colonial records"],
      ["land_loss_content", "How the land was lost"],
      ["preservation_content", "Caring for this place"]
    ];
    const AR_SITE_FIELDS = ["title", "slug", "summary", "why_this_matters", "listing_image_url", "listing_image_alt", ...AR_SECTIONS.map(([field]) => field)].join(",");
    const AR_PHOTOS = 6;
    const AR_READINGS = 4;
    const AR_NEARBY_PLACES = 3;
    const AR_NEARBY_KM = 3;

    // Photos and their captions in an article section's HTML.
    // Each photo also carries the article text around it (the paragraph
    // after it, else the one before), so a card explains what you see.
    function arPhotos(html, section) {
      const parts = String(html || "").split(/(<figure[\s\S]*?<\/figure>|<img[^>]*>)/i);
      const photos = [];
      for (let i = 1; i < parts.length; i += 2) {
        const block = parts[i];
        const src = (block.match(/<img[^>]*?\ssrc="(https:[^"]+)"/i) || [])[1] || "";
        if (!src) continue;
        const caption = arText((block.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i) || [])[1] || (block.match(/\salt="([^"]*)"/i) || [])[1] || "");
        // The paragraph right after the photo, unless it is a source note.
        const after = arReading(parts[i + 1], 700).split("\n\n").filter(text => text.length >= 60 && !/\baccessed\b|\bretrieved\b/i.test(text));
        // An alt text without spaces is a file name, not a caption.
        photos.push({ src, caption: /\s/.test(caption) ? caption : "", context: after[0] || "", section });
      }
      return photos;
    }

    // A short title from a caption: its first sentence or clause (not cut at
    // "no." or an initial), without parentheses, trimmed.
    function arCaptionTitle(caption) {
      const first = caption.replace(/\s*\([^)]*\)/g, "").split(/[;:]\s|(?<=[a-z0-9]{3}\.)\s(?=[A-Z])|\s(?=From\s)/)[0].replace(/\.$/, "");
      return first.length <= 70 ? first : `${first.slice(0, first.lastIndexOf(" ", 66))} …`;
    }

    // Photos grouped in a gallery have no paragraph beside them; find the
    // page's paragraph about what the photo shows instead (it has to share
    // at least two distinctive words with the caption).
    const AR_COMMON_WORDS = new Set("shinnecock reservation nation indian indians photo image courtesy from with that this their there were which when where what original history article page".split(" "));
    function arRelatedPassage(caption, paragraphs) {
      const words = [...new Set((caption.toLowerCase().match(/[a-z]{4,}/g) || []).filter(word => !AR_COMMON_WORDS.has(word)))];
      let best = null;
      let bestScore = 1;
      paragraphs.forEach(paragraph => {
        const text = paragraph.toLowerCase();
        const score = words.filter(word => text.includes(word)).length;
        if (score > bestScore) {
          best = paragraph;
          bestScore = score;
        }
      });
      return best || "";
    }

    // A section's text without its photos and captions, keeping its
    // paragraphs and subheadings apart, ending on a sentence.
    function arReading(html, limit = 1400) {
      const marked = String(html || "").replace(/<figure[\s\S]*?<\/figure>/gi, " ")
        .replace(/<\/(p|h[1-6]|li|blockquote)>|<br\s*\/?>/gi, " ¶ ");
      const text = arText(marked).split(/\s*¶\s*/).filter(Boolean).join("\n\n");
      if (text.length <= limit) return text;
      const cut = text.slice(0, limit);
      return `${cut.slice(0, Math.max(cut.lastIndexOf(". ") + 1, limit * 0.6))} …`;
    }

    // The full page of a site (its article sections), fetched when AR opens.
    async function arSiteDetail(slug) {
      try {
        const response = await fetch(`${DIRECTUS}/items/sites?limit=1&filter[publication_status][_eq]=published&filter[slug][_eq]=${encodeURIComponent(slug)}&fields=${AR_SITE_FIELDS}`,
          { signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined });
        return response.ok ? (await response.json()).data?.[0] || null : null;
      } catch {
        return null;
      }
    }

    function arSiteImage(siteId) {
      const site = (state.sites || []).find(item => Number(item.id) === Number(siteId));
      return site?.listing_image_url || site?.listing_image_thumb_url || "";
    }

    function arScene(title, items, random, here = null) {
      return { schema: 1, site_id: "nearby", title, here: here ? { lat: here.lat, lng: here.lng } : undefined, items: arShuffled(items, random) };
    }

    // Anywhere: the ancestral land you are on, other land history close by,
    // the area's biography people, and two words.
    function regionArScene(here, random = Math.random) {
      const entries = arLandEntries();
      const items = [];
      if (here) {
        const homeland = entries.filter(entry => entry.isAncestralLand && arInsideGeometry(here, arEntryGeometry(entry)));
        homeland.forEach(entry => {
          const [welcome, ...more] = arLandClips(entry);
          items.push({ ...welcome, title: `You are on ${arText(entry.title)}`, image: arSiteImage(entry.siteId) }, ...more);
        });
        (state.sites || [])
          .filter(site => Array.isArray(site.center) && site.summary && (site.listing_image_url || site.listing_image_thumb_url) && !arSensitiveSite(site)
            && !homeland.some(entry => Number(entry.siteId) === Number(site.id)))
          .map(site => ({ site, km: arDistanceKm(here, { lng: Number(site.center[0]), lat: Number(site.center[1]) }) }))
          .filter(item => item.km <= AR_NEARBY_KM)
          .sort((a, b) => a.km - b.km)
          .slice(0, AR_NEARBY_PLACES)
          .forEach(({ site, km }) => items.push(arToward({
            id: `place-${site.slug}`, layer: "archival", kind: "note", placement: "discover",
            title: `Nearby: ${arText(site.title)}`,
            caption: `${km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`} from you, in the direction of this bubble. ${arText(site.summary)}`,
            credit: "On This Site", image: site.listing_image_url || site.listing_image_thumb_url
          }, here, { lng: Number(site.center[0]), lat: Number(site.center[1]) })));
        entries
          .filter(entry => !entry.isAncestralLand)
          .map(entry => ({ entry, centre: arGeometryCentre(arEntryGeometry(entry)) }))
          .filter(item => item.centre && arDistanceKm(here, item.centre) <= AR_LAND_KM)
          .sort((a, b) => arDistanceKm(here, a.centre) - arDistanceKm(here, b.centre))
          .slice(0, 3)
          .forEach(({ entry, centre }) => items.push(arToward(arLandClips(entry)[0], here, centre)));
        items.push(...arPeople(here, AR_PEOPLE_KM, AR_PEOPLE));
        // Photo stories and plant IDs found close by, at their spots.
        const close = (lat, lng) => lat != null && lng != null && arDistanceKm(here, { lat: Number(lat), lng: Number(lng) }) <= AR_FIND_KM;
        items.push(...arFinds(
          (state.mapStories || []).filter(story => story.photo && arShared(story) && close(story.latitude, story.longitude)),
          (state.plantObservations || []).filter(plant => arShared(plant) && close(plant.observation_latitude, plant.observation_longitude)),
          here
        ).sort((a, b) => a.distance_m - b.distance_m).slice(0, AR_FINDS));
      } else {
        // Without a location: a few ancestral lands to learn about.
        arShuffled(entries.filter(entry => entry.isAncestralLand), random).slice(0, 3).forEach(entry => items.push(arLandClips(entry)[0]));
      }
      items.push(...arWords(AR_WORDS, random));
      return arScene("Around you", items, random, here);
    }

    function arAsset(id) {
      return id ? `${DIRECTUS}/assets/${encodeURIComponent(id)}?width=1200&quality=80` : "";
    }

    // At a site: its story and photo, its land history, the people tied to
    // it, and what the community has shared there (photo stories, plant
    // finds, notes).
    function siteArScene(site, detail = null, random = Math.random) {
      const page = { ...site, ...(detail || {}) };
      const slug = site.slug;
      const title = arText(page.title);
      const centre = Array.isArray(site.center) ? { lng: Number(site.center[0]), lat: Number(site.center[1]) } : null;
      const featured = page.listing_image_url || page.listing_image_thumb_url || "";
      const items = [{
        id: `site-${slug}`, layer: "archival", kind: "note", placement: "discover",
        title: `Welcome to ${title}`, caption: arReading(page.introduction_content) || arText(page.summary), credit: "On This Site",
        image: featured
      }];
      if (page.why_this_matters) items.push({
        id: `site-why-${slug}`, layer: "archival", kind: "note", placement: "discover",
        title: "Why this place matters", caption: arText(page.why_this_matters), credit: title
      });
      // Photos from the page with their captions, captioned ones first.
      const paragraphs = AR_SECTIONS.flatMap(([field]) => arReading(page[field], 100000).split("\n\n")).filter(text => text.length >= 80);
      const seen = new Set([featured]);
      AR_SECTIONS.flatMap(([field, label]) => arPhotos(page[field], label))
        .filter(photo => !seen.has(photo.src) && seen.add(photo.src))
        .sort((a, b) => Boolean(b.caption) - Boolean(a.caption))
        .slice(0, AR_PHOTOS)
        .forEach((photo, index) => items.push({
          id: `photo-${slug}-${index}`, layer: "archival", kind: "note", placement: "discover",
          title: photo.caption ? arCaptionTitle(photo.caption) : `A photo from the ${photo.section.toLowerCase()} of ${title}`,
          // The caption, the page's passage about it, and a classroom looking prompt.
          caption: [photo.caption, photo.context || (photo.caption ? arRelatedPassage(photo.caption, paragraphs) : ""),
            "Look closely: What do you notice? What do you wonder?"].filter(Boolean).join("\n\n"),
          credit: `From "${photo.section}" on the On This Site page for ${title}`, image: photo.src
        }));
      // Short readings from the rest of the page.
      AR_SECTIONS.slice(1)
        .map(([field, label]) => ({ label, text: arReading(page[field]) }))
        .filter(reading => reading.text.length >= 120)
        .slice(0, AR_READINGS)
        .forEach(reading => items.push({
          id: `reading-${slug}-${reading.label.toLowerCase().replace(/[^a-z]+/g, "-")}`, layer: "archival", kind: "note", placement: "discover",
          title: reading.label, caption: reading.text, credit: `From the On This Site page on ${title}`
        }));
      const land = arLandEntries().find(entry => entry.slug === slug);
      if (land) items.push(...arLandClips(land, "site-"));
      const here = arUserLocation();
      if (centre) items.push(...arPeople(centre, 2, 3, here));
      items.push(...arFinds(
        (state.mapStories || []).filter(story => story.attached_site_slug === slug && story.photo && arShared(story)).slice(-4),
        (state.plantObservations || []).filter(plant => plant.site_slug === slug && arShared(plant)),
        here
      ).slice(0, 7));
      (state.publicComments || [])
        .filter(comment => comment.site_slug === slug && String(comment.source_type || "site") === "site" && comment.comment)
        .slice(-2)
        .forEach(comment => items.push({
          id: `note-${comment.id}`, layer: "archival", kind: "note", placement: "discover",
          title: comment.author_name ? `${arText(comment.author_name)} says` : "A community note",
          caption: arText(comment.comment), credit: "Community note on On This Site"
        }));
      items.push(...arWords(AR_WORDS, random));
      return arScene(title, items, random, arUserLocation());
    }

    function arSupported() {
      return Boolean(window.AndroidApp?.openArNearby) && (!window.AndroidApp.isArSupported || window.AndroidApp.isArSupported());
    }

    function openArBubbles(scene) {
      window.AndroidApp.openArNearby(androidBridgeToken(), JSON.stringify(scene));
    }

    async function openRegionAr() {
      if (!arUserLocation()) await requestUserLocation({ silent: true }).catch(() => null);
      openArBubbles(regionArScene(arUserLocation()));
    }

    // Burial grounds and sensitive places never become bubbles, here or as
    // a site's own AR.
    function arSensitiveSite(site) {
      return /sensitive|burial|grave|cemetery/i.test(site?.site_type || "") || /cemetery|burial/i.test(site?.title || "");
    }

    function nearSite(site) {
      const here = arUserLocation();
      if (!here || !Array.isArray(site?.center)) return false;
      if (arDistanceKm(here, { lng: Number(site.center[0]), lat: Number(site.center[1]) }) <= SITE_AR_KM) return true;
      const land = arLandEntries().find(entry => entry.slug === site.slug);
      return Boolean(land && arInsideGeometry(here, arEntryGeometry(land)));
    }

    // The AR button beside a site panel's close button, shown to visitors
    // standing at that site. The panel's buttons (AR, the app's navigate
    // arrow, close) sit together in one group.
    let siteArButton = null;
    let siteArLocatedAt = 0;
    function syncSiteArButton() {
      const close = document.getElementById("close-detail");
      if (!close || !arSupported()) return;
      if (!siteArButton) {
        const actions = document.createElement("span");
        actions.className = "detail-head-actions";
        close.replaceWith(actions);
        siteArButton = document.createElement("button");
        siteArButton.type = "button";
        siteArButton.className = "site-ar-button";
        // The same cube and label as the AR button on the map.
        siteArButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"></path><path d="M4 7.5 12 12l8-4.5"></path><path d="M12 12v9"></path></svg><span class="mobile-ar-label" aria-hidden="true">AR</span>';
        siteArButton.setAttribute("aria-label", "See this site's stories around you in AR");
        siteArButton.hidden = true;
        siteArButton.addEventListener("click", async () => {
          const site = state.selectedSite;
          if (!site?.slug || siteArButton.disabled) return;
          siteArButton.disabled = true;
          try {
            openArBubbles(siteArScene(site, ctx.siteDetail ? await ctx.siteDetail(site).catch(() => null) : await arSiteDetail(site.slug)));
          } finally {
            siteArButton.disabled = false;
          }
        });
        actions.append(siteArButton, close);
      }
      // The app adds its navigate arrow beside close; keep it in the group.
      const navigate = close.closest(".detail-head")?.querySelector(":scope > .nli-listing-top-navigation");
      if (navigate) close.before(navigate);
      const site = state.selectedSite;
      const open = document.getElementById("detail")?.classList.contains("open");
      // Without a recent location the button can't tell you're here: ask
      // quietly, only when location is already allowed, at most once a minute.
      if (open && site?.slug && !arUserLocation() && window.AndroidApp?.hasLocationPermission?.()
        && Date.now() - siteArLocatedAt > 60000) {
        siteArLocatedAt = Date.now();
        requestUserLocation({ silent: true }).then(found => found && syncSiteArButton()).catch(() => {});
      }
      siteArButton.hidden = !(open && site?.slug && !arSensitiveSite(site) && nearSite(site));
    }

    // The AR button opens the camera with stories around you. An app too old
    // for AR bubbles (or a phone without AR) gets a short explanation instead.
    async function openAr() {
      if (arSupported()) return openRegionAr();
      openSheet(sheetEl);
      const tooOld = window.AndroidApp && !window.AndroidApp.openArNearby;
      if (listEl) listEl.innerHTML = `<p class="summary">${tooOld
        ? "AR needs the newest On This Site app. Update the app, then tap AR again to see stories, people and words from this place floating around you."
        : "This phone doesn't support AR. The stories, people and words are on the map and in Learn."}</p>`;
    }

    // The site AR button: re-checked when a site panel opens or changes, and
    // every few seconds while one is open, as the visitor walks.
    function watch() {
      const detail = document.getElementById("detail");
      if (!detail) return;
      new MutationObserver(syncSiteArButton).observe(detail, { attributes: true, attributeFilter: ["class"] });
      const title = document.getElementById("detail-title");
      if (title) new MutationObserver(syncSiteArButton).observe(title, { childList: true, subtree: true });
      window.setInterval(() => {
        if (detail.classList.contains("open")) syncSiteArButton();
      }, 8000);
    }

    return { available: arAppAvailable, openAr, watch, regionArScene, siteArScene };
  }

  window.NLI_SCAN_SPACES = { create };
}());
