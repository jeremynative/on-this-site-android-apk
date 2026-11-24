// Idle "screensaver" for the map: a slow tour of Long Island. When the map is
// left open (after opening the app, or after closing a site) and nothing is
// touched for a while, the camera flies from stop to stop along the island,
// zooming out as it pans and back in as it arrives. Most stops are places
// ("Did you know?", "Site highlight"); some are people from the biography
// paths and the map's animal relatives; and now and then it pulls back to the
// whole island for a fact about the project itself. It only holds still at a
// stop, framed in the part of the map that is visible, while that stop's card
// fades in; then it flies on. Any touch ends it at once and nothing opens
// unless the card itself is tapped. It never runs while a content page is
// open.
//
// Cards only say something worth learning: a place, person or animal is a
// stop only when its own text has a sentence about Indigenous history,
// language or storytelling, and that sentence is the one shown (never, say,
// just the year a district was designated).
//
// In the Android app it moves the native map itself through ctx.camera (the
// web map follows), which stays smooth on slower tablets; the desktop site
// passes its Leaflet map the same way; elsewhere it moves the web map. The
// moves are always animated: Android's "animations off" (often a power or
// developer setting) would otherwise turn them into jumps. On a desktop
// screen (ctx.layout "desktop") the card is larger, with a big photo and more
// of the story, and the stop is framed beside it.
(function () {
  const IDLE_MS = 45000;
  const CHECK_MS = 1000;
  const STOP_ZOOM = 13.6;
  const ANIMAL_ZOOM = 12.6;
  // Long enough to read a card at a relaxed pace.
  const CARD_MS = 16000;
  const FOLLOW_MS = 2000;
  // Every flight lasts at least this long, so cards never come back to
  // back: there is always a stretch of panning in between.
  const FLY_MIN_MS = 9000;
  const FLY_MAX_MS = 16000;
  const NEXT_MIN_KM = 1.5;
  const NEXT_MAX_KM = 30;
  const EXTRA_MAX_KM = 40;
  const MAX_RUN_MS = 15 * 60 * 1000;
  // On phones and tablets the card sits inside the map, this far above its
  // round buttons (or its bottom edge); in landscape it runs down the right
  // side, clear of the locate button (CSS pixels). The height is a first
  // guess until the card has content.
  const CARD_GAP_PX = 10;
  const LOCATE_CLEARANCE_PX = 72;
  const CARD_GUESS_PX = 132;
  const WIDE_MIN_PX = 900;
  // On a wide screen the card sits halfway between what it describes and the edge
  // of the screen, never closer to it than this. A place with no shape keeps this
  // much clear for its pin and name.
  const CARD_BESIDE_PX = 44;
  const POINT_CLEAR = { left: 90, right: 90, up: 70, down: 70 };
  // Blocks the card moves aside for, once it is known where they have settled.
  const CARD_BLOCKERS = ".event-map-card:not([hidden]), [data-research-question-prompt]:not([hidden]), #timeline-dock, .daily-card-stack, .daily-card-restore-dock, .monthly-support-goal, .leaflet-control-zoom";
  // Long Island: its ends (for turning the tour around) and the whole-island view.
  const WEST_LNG = -73.95;
  const EAST_LNG = -71.88;
  const ISLAND = { center: [-72.95, 40.82], widthKm: 190 };
  const LONG_ISLAND = { west: -74.1, east: -71.8, south: 40.5, north: 41.3 };
  // The southernmost land along the island, west to east, so the card can sit in
  // the ocean just off it.
  const SOUTH_SHORE = [[-74.1, 40.57], [-74.03, 40.57], [-73.93, 40.543], [-73.83, 40.562], [-73.73, 40.582], [-73.53, 40.573], [-73.43, 40.598],
    [-73.33, 40.621], [-73.23, 40.622], [-73.13, 40.641], [-73.03, 40.663], [-72.93, 40.694], [-72.83, 40.731], [-72.73, 40.759], [-72.63, 40.784],
    [-72.53, 40.815], [-72.43, 40.839], [-72.33, 40.877], [-72.23, 40.913], [-72.13, 40.949], [-72.03, 40.984], [-71.93, 41.02], [-71.8, 41.06]];
  const mercator = lat => 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
  // Pixels per degree of longitude on the desktop map (256-pixel tiles).
  const pixelsPerDegree = zoom => 256 * 2 ** zoom / 360;
  const PERSON_ICON = "assets/map-icons/person-biography-marker.png";
  // Desktop: a stop's other pictures (beyond its header image) float beside the card,
  // each sized to its own shape and kept off the card, the place, its name and the
  // page's panels. Too little room shows fewer pictures, never tiny ones; each
  // picture shown adds time at the stop.
  const MEDIA_MAX = 4;
  const MEDIA_MS = 5000;
  const MEDIA_EXTRA_MAX_MS = 15000;
  // A picture is shown at least this big on its short side, or left out: fewer
  // pictures rather than small ones. Very wide or tall ones are cropped to fit.
  const MEDIA_MIN_SIDE_PX = 200;
  const MEDIA_MAX_W_PX = 480;
  const MEDIA_MAX_H_PX = 380;
  const MEDIA_RATIO_MIN = 0.75;
  const MEDIA_RATIO_MAX = 2;
  const MEDIA_GAP_PX = 14;
  const MEDIA_CAPTION_PX = 44;
  const MEDIA_GRID_PX = 12;
  const smooth = t => t * t * (3 - 2 * t);

  // What makes a sentence worth a card: Indigenous history, language (what
  // a name means), archaeology and storytelling. Town names that are also
  // nation names only count when the sentence is about the people.
  const INDIGENOUS = /\b(Native|Indigenous|Shinnecock|Montauketts?|Unkechaug|Poospatuck|Setalcott|Secatogue|Corchaug|Manhansets?|Lenape|Munsee|Algonquian|Pequots?|Narragansetts?|Niantics?|Mohegans?|Meitowax|wampum|sachems?|sunksquaws?|tribes?|tribal|nations?|ancestral|homelands?|pow ?wows?|ancestors?|descendants?)\b|\b(Montauk|Matinecock|Massapequa|Merrick|Rockaway|Canarsie|Nissequogue|Setauket|Manhasset|Patchogue|Cutchogue)\s+(people|nation|sachem|famil(y|ies)|community|leaders?|proprietors|territory|homeland|ancestral)/i;
  const MEANING = /\b(name|word|term)\b[^.]{0,60}\b(means?|meant|interpreted|translat\w*|describ\w*|connected (to|with) the|refers? to|comes? from|derived)|\binterpreted as\b|\bmeaning\b|\barchaeolog\w*|\bshell[- ]middens?\b|\bpottery\b/i;
  const STORY = /\b(stor(y|ies|ytelling)|oral|tradition\w*|ceremon\w*|gather\w*|whal\w*|shell\w*|canoes?|fish\w*|planting|corn|language|deeds?|treat(y|ies)|villages?|trails?|stewardship|resist\w*|surviv\w*|continu\w*|memory|remember\w*|knowledge|protest\w*|sovereign\w*|cultur\w*|leadership|regalia|art)\b/i;
  // Bookkeeping rather than history: dates of designation, the map's own
  // notes about its records, addresses.
  const ADMIN = /\b(established|recognized by|designated|listed on|National Register|incorporated|zoning|is included among|this (record|entry|marker|listing|page)|the map\b|publish\w*|geometry|marker is|coordinates|private residence|source review|source-supported|records? (identify|identifies|name|names))\b/i;
  const CLIPPED = /\b(the|of|a|an|and|to|in|for|with|by|at|on|from|or|members)\.$/i;

  function create(ctx) {
    const { getMap, getSites, mainMapIdle, openSite, escapeHtml } = ctx;
    const showPhotos = ctx.showPhotos || (() => true);
    const placeOf = ctx.placeOf || (() => ({}));
    const idleMs = ctx.idleMs || IDLE_MS;
    let lastActivity = Date.now();
    let running = false;
    let rested = false;
    let startedAt = 0;
    let timer = 0;
    let followTimer = 0;
    let lineTimer = 0;
    let hideTimer = 0;
    let direction = 1;
    let visits = 0;
    let here = null;
    let shown = new Set();
    let factIndex = 0;
    let card = null;
    let cardOpen = null;
    let swallowClickUntil = 0;
    let pointer = null;
    // The thin white line from the place on the map to its card, the stop it
    // points at, and where the last stop was framed on screen.
    let line = null;
    let lineStop = null;
    // On a wide screen: where the stop lands and where the card can go beside it.
    let beside = null;
    let lastFrame = null;
    // The next stop's pictures, asked for while the camera flies there, and the
    // layer they are shown on.
    let mediaFor = null;
    let mediaLayer = null;

    function inTour(target) {
      return Boolean((card && card.contains(target)) || (mediaLayer && mediaLayer.contains(target)));
    }

    function sensitive(site) {
      return /sensitive|burial|grave|cemetery/i.test(site?.site_type || "") || /cemetery|burial/i.test(site?.title || "");
    }

    function plain(value) {
      return String(value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
        .replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, "\"").replace(/\s+/g, " ").trim();
    }

    function wide() {
      return ctx.layout === "desktop" && window.innerWidth >= WIDE_MIN_PX;
    }

    function textLimit() {
      return wide() ? 360 : 220;
    }

    function shorten(text, limit) {
      if (text.length <= limit) return text;
      const cut = text.slice(0, limit);
      return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "")}…`;
    }

    // Sentences, without splitting "R.W. Hawkins" or "St. James".
    function sentences(text) {
      const parts = plain(text).split(/(?<=[.!?])\s+(?=["“(]?[A-Z0-9])/);
      const merged = [];
      parts.forEach(part => {
        const previous = merged[merged.length - 1];
        if (previous && /(\b[A-Z]\.|\b(St|Mr|Mrs|Ms|Dr|Jr|Sr|Rev|Capt|Gen|Col|Lt|Ft|Mt|No|vs|ca|c)\.)$/.test(previous)) merged[merged.length - 1] = `${previous} ${part}`;
        else merged.push(part);
      });
      return merged.filter(Boolean);
    }

    function score(sentence) {
      let value = 0;
      if (INDIGENOUS.test(sentence)) value += 3;
      if (MEANING.test(sentence)) value += 3;
      if (STORY.test(sentence)) value += 1;
      if (ADMIN.test(sentence)) value -= 4;
      if (sentence.length < 40) value -= 2;
      if (CLIPPED.test(sentence) || !/[.!?"”)]$/.test(sentence)) value -= 6;
      return value;
    }

    // A stretch of consecutive sentences from one of the texts (in order of
    // preference) that holds at least one sentence about Indigenous history,
    // language or storytelling; from the start of the text when that works,
    // so the card keeps its context. "" when nothing qualifies.
    function fact(texts) {
      const limit = textLimit();
      let best = null;
      texts.forEach(text => sentences(text).forEach((sentence, start, all) => {
        if (score(sentence) < 0) return;
        let text = "";
        let top = -Infinity;
        let good = 0;
        for (const next of all.slice(start)) {
          const value = score(next);
          if (value < 0 || (text && `${text} ${next}`.length > limit)) break;
          text = text ? `${text} ${next}` : next;
          top = Math.max(top, value);
          if (value >= 3) good += 1;
        }
        if (top < 3) return;
        const value = top + good / 2 - (start > 0 ? 1 : 0);
        if (!best || value > best.value) best = { value, text };
      }));
      return best ? shorten(best.text, limit) : "";
    }

    // "Sag Harbor" from "(Present Day 139 Hampton St, Sag Harbor, NY 11963)";
    // "near Noyack" from "(Present Day near Noyack, NY)".
    function town(presentDay) {
      const text = plain(presentDay).replace(/^\(?\s*Present Day\s*/i, "").replace(/\)\s*$/, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
      const parts = text.split(",").map(part => part.trim()).filter(Boolean);
      const state = parts.findIndex(part => /^(NY|New York)\b/i.test(part));
      let place = state > 0 ? parts[state - 1] : parts[0] || "";
      if (/county$/i.test(place) && state > 1) place = parts[state - 2];
      if (/^-?\d+(\.\d+)?$/.test(place)) return "";
      return place.length > 40 ? `${place.slice(0, 39)}…` : place;
    }

    // "Present day: Southampton · Shinnecock Ancestral Land"
    function placeLine(site) {
      const place = placeOf(site) || {};
      const where = town(place.presentDay || site.address_label || "");
      return [where ? `Present day: ${where}` : "", plain(place.land || "")].filter(Boolean).join(" · ");
    }

    function distanceKm(a, b) {
      const rad = Math.PI / 180;
      const dLat = (b[1] - a[1]) * rad;
      const dLng = (b[0] - a[0]) * rad;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
      return 12742 * Math.asin(Math.sqrt(h));
    }

    function onLongIsland(center) {
      return Array.isArray(center) && center.length >= 2 && center.every(Number.isFinite)
        && center[0] >= LONG_ISLAND.west && center[0] <= LONG_ISLAND.east && center[1] >= LONG_ISLAND.south && center[1] <= LONG_ISLAND.north;
    }

    // A page hook that fails (in an older offline copy, say) only loses its
    // own stops; the tour carries on.
    function fromPage(hook) {
      try {
        return hook?.() || [];
      } catch (error) {
        console.warn("Map tour: a stop source failed.", error);
        return [];
      }
    }

    // Every stop of a kind: { key, kicker, title, line, text, image, icon, center, zoom, open }.
    function siteStops() {
      return (getSites() || []).filter(site => Array.isArray(site.center) && site.slug && site.title && !sensitive(site))
        .map(site => ({ site, center: site.center.slice(0, 2).map(Number) }))
        .filter(item => onLongIsland(item.center))
        .map(({ site, center }) => ({
          key: `site:${site.slug}`,
          site,
          title: plain(site.title),
          center,
          image: site.listing_image_thumb_url || site.listing_image_url || "",
          open: () => openSite(site.slug)
        }));
    }

    // A biography's header image: the picture its article opens with (an archival
    // portrait, such as those from the Shinnecock Portrait Project). Articles that
    // don't open with a figure keep the person icon. CMS photos load as a small copy.
    function articleLeadImage(article) {
      let url = String(article?.lead_image_url || "");
      if (!url) {
        const figure = String(article?.content || "").match(/^\s*<figure\b[\s\S]*?<\/figure>/i)?.[0] || "";
        url = (figure.match(/<img\b[^>]*\bsrc="([^"]+)"/i)?.[1] || "").replace(/&amp;/g, "&");
      }
      if (/^https:\/\/directus\.nativelongisland\.com\/assets\/[^?#]+$/i.test(url)) url += "?width=720&quality=72&format=webp";
      return /^(?:https:\/\/|assets\/)/i.test(url) ? url : "";
    }

    // Where the face sits in that picture ("X% Y%", the image's data-focus in the CMS),
    // so the card's crop keeps it in view. Empty means the card's default (near the top).
    function articleLeadFocus(article) {
      const utils = window.NLI_MEDIA_UTILS || {};
      const recorded = utils.imageFocusValue ? utils.imageFocusValue(article?.lead_image_focus) : "";
      return recorded || (utils.firstImageFocus ? utils.firstImageFocus(String(article?.content || "").match(/^\s*<figure\b[\s\S]*?<\/figure>/i)?.[0] || "") : "");
    }

    // People from the biography paths. A person walking the map (their icon
    // is on) is met where the icon is and followed, with the place on their
    // path nearest to it; otherwise at the places in their records.
    function personStops() {
      return fromPage(ctx.people).flatMap(person => {
        const places = (person.places || [])
          .filter(place => onLongIsland(place.coordinates) && !/burial|grave|cemetery|private/i.test(`${place.place} ${place.label}`));
        const portrait = person.image || articleLeadImage(person.article);
        const stop = place => ({
          key: `person:${person.slug}`,
          slug: person.slug,
          kicker: "People of Long Island",
          // A path title such as "Momoweta — life and connections" names the person.
          title: plain(person.name).replace(/\s*[—–-]\s*life and connections$/i, ""),
          line: place ? [plain(place.dateLabel || place.label), plain(place.place)].filter(Boolean).join(" · ") : "",
          texts: [place?.reason, person.article?.summary, person.article?.why_this_matters],
          image: portrait || PERSON_ICON,
          icon: !portrait,
          portrait: Boolean(portrait),
          focus: portrait && !person.image ? articleLeadFocus(person.article) : "",
          center: place?.coordinates.slice(0, 2).map(Number),
          open: person.open
        });
        if (!person.centerAt) return places.map(stop);
        const walking = person.centerAt(0);
        if (!onLongIsland(walking)) return [];
        const nearest = places.slice().sort((a, b) => distanceKm(walking, a.coordinates) - distanceKm(walking, b.coordinates))[0];
        return [{ ...stop(nearest), center: walking, centerAt: person.centerAt }];
      });
    }

    // The animal relatives that wander the map, met where they are.
    function animalStops() {
      return fromPage(ctx.animals).map(animal => ({
        key: `animal:${animal.slug}`,
        kicker: "Animal relatives",
        title: plain(animal.title),
        texts: [animal.article?.summary, animal.article?.why_this_matters],
        image: animal.image,
        icon: true,
        center: animal.centerAt(0),
        centerAt: animal.centerAt,
        zoom: ANIMAL_ZOOM,
        open: animal.open
      })).filter(stop => onLongIsland(stop.center));
    }

    // Facts about the project, shown with the whole island in view. Each
    // comes from the project's own About, Support and site pages.
    function projectFacts() {
      const project = ctx.project;
      if (!project) return [];
      const sites = getSites() || [];
      const placeNames = sites.filter(site => site.site_type === "placename").length;
      const lands = sites.filter(site => site.site_type === "territory").length;
      const facts = [
        {
          title: "Created by Jeremy Dennis",
          text: "Shinnecock artist and photographer Jeremy Dennis created On This Site. It traces back to his 2016 Dreamstarter award from Running Strong for American Indian Youth; the first book edition was completed in 2018.",
          image: "assets/about/jeremy-dennis.png",
          open: project.openAbout
        },
        {
          kicker: "Long Island's traditional names",
          title: "Meitowax",
          text: "Meitowax is one of the Indigenous names recorded for Long Island, interpreted as the land of the periwinkle or country of the ear shell. Early spellings include Matouwac, Metoac, Matowcas, Mattanwake, and Matowa.",
          open: () => openSite("mattanwake-long-island")
        },
        {
          title: "A map of Indigenous Long Island",
          line: sites.length ? `${sites.length} places${placeNames ? ` · ${placeNames} Native place names` : ""}${lands ? ` · ${lands} ancestral lands` : ""}` : "",
          text: "On This Site documents Indigenous Long Island history through places, photographs, research notes, public storytelling, and community contributions.",
          open: project.openAbout
        },
        {
          title: "Support the project",
          text: "Community support helps keep On This Site online, reviewed, expanded, and available across the website and mobile app.",
          open: project.openSupport,
          action: "Tap to support On This Site"
        },
        {
          title: "Project supporters",
          text: "Running Strong for American Indian Youth supported the project through its Dreamstarter program, with Dreamstarter GOLD supporting its next stage in 2020. Monument Lab has supported the project through a fellowship, and the Indigenous Screen Office and Agog: The Immersive Media Institute are funding its app and AR features for 2026–2027.",
          image: "assets/about/running-strong-logo.png",
          icon: true,
          open: project.openAbout
        },
        project.betaInviteUrl ? {
          title: "Help test the Android app",
          text: "On This Site has an Android app in closed beta. Email us to receive an invite.",
          open: () => { window.location.href = project.betaInviteUrl; },
          action: "Tap to email for an invite"
        } : null
      ].filter(Boolean);
      return facts.map(item => ({ kicker: "About On This Site", ...item, key: `fact:${item.title}`, center: ISLAND.center, island: true }));
    }

    function withText(stop) {
      if (stop.text) return stop;
      const text = fact(stop.site ? [stop.site.summary, stop.site.why_this_matters] : stop.texts || []);
      return text ? { ...stop, text, line: stop.site ? placeLine(stop.site) : stop.line } : null;
    }

    function hasPhoto(stop) {
      return Boolean(showPhotos() && stop.image);
    }

    // The next place along the island in the tour's direction, a short flight
    // away, not shown yet; photos first. At an end of the island it turns back.
    function nextSite(from) {
      const all = siteStops().filter(stop => !shown.has(stop.key));
      for (let turn = 0; turn < 2; turn++) {
        const ahead = all.filter(stop => (stop.center[0] - from[0]) * direction > 0)
          .map(stop => ({ stop, km: distanceKm(from, stop.center) }))
          .filter(item => item.km >= NEXT_MIN_KM && item.km <= NEXT_MAX_KM)
          .sort((a, b) => (hasPhoto(b.stop) - hasPhoto(a.stop)) || (a.km - b.km));
        // The first few (by photo, then distance) that have something to say.
        const usable = [];
        for (const item of ahead) {
          const stop = withText(item.stop);
          if (stop) usable.push(stop);
          else shown.add(item.stop.key);
          if (usable.length >= 5) break;
        }
        if (usable.length) return usable[Math.floor(Math.random() * usable.length)];
        direction = -direction;
      }
      // Nothing a short flight away: the nearest place anywhere.
      const nearest = all.filter(stop => !shown.has(stop.key))
        .sort((a, b) => distanceKm(from, a.center) - distanceKm(from, b.center));
      for (const item of nearest) {
        const stop = withText(item);
        if (stop) return stop;
        shown.add(item.key);
      }
      shown = new Set();
      return null;
    }

    // A person or animal within reach (either way along the island).
    function nextExtra(stops, from) {
      const near = stops.filter(stop => !shown.has(stop.key))
        .map(stop => ({ stop, km: distanceKm(from, stop.center) }))
        .filter(item => item.km >= NEXT_MIN_KM && item.km <= EXTRA_MAX_KM)
        .sort((a, b) => a.km - b.km)
        .map(item => withText(item.stop)).filter(Boolean)
        .slice(0, 3);
      return near.length ? near[Math.floor(Math.random() * near.length)] : null;
    }

    function nextFact() {
      const facts = projectFacts();
      if (!facts.length) return null;
      return facts[factIndex++ % facts.length];
    }

    function installStyles() {
      if (document.getElementById("map-idle-styles")) return;
      const style = document.createElement("style");
      style.id = "map-idle-styles";
      style.textContent = `
        .map-idle-card { position: fixed; left: 12px; right: 12px; bottom: calc(190px + env(safe-area-inset-bottom, 0px)); z-index: 40;
          box-sizing: border-box; display: flex; gap: 12px; align-items: center; max-width: 520px; margin: 0; padding: 12px; border-radius: 14px; overflow: hidden;
          background: rgba(20, 31, 23, 0.92); color: #fff; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.3);
          opacity: 0; transform: translateY(10px); transition: opacity 0.9s ease, transform 0.9s ease; pointer-events: none; cursor: pointer; }
        .map-idle-card.show { opacity: 1; transform: none; pointer-events: auto; }
        .map-idle-card[hidden] { display: none; }
        .map-idle-card img { flex: none; width: 76px; height: 76px; border-radius: 10px; object-fit: cover; background: #2b3a30; }
        .map-idle-card img.icon { object-fit: contain; padding: 8px; background: #eef3ed; }
        .map-idle-card img.portrait { object-position: 50% 8%; }
        .map-idle-card span { display: block; color: #9fd4b0; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
        .map-idle-card strong { display: block; margin: 2px 0 1px; font-size: 16px; line-height: 1.2; }
        .map-idle-card small { display: block; margin-bottom: 4px; color: #b9cdbf; font-size: 12px; line-height: 1.3; }
        .map-idle-card p { margin: 0; color: #dfe8e1; font-size: 13px; line-height: 1.35;
          display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden; }
        .map-idle-card.wide p { display: block; }
        .map-idle-card em { display: block; margin-top: 4px; color: #9fd4b0; font-size: 12px; font-style: normal; }
        .map-idle-card i { display: none; }
        .map-idle-card.wide { left: var(--map-idle-left, 24px); right: auto; bottom: var(--map-idle-bottom, 24px); width: clamp(320px, 30vw, 460px);
          max-width: none; max-height: var(--map-idle-max, calc(100vh - 120px)); margin: 0;
          flex-direction: column; align-items: stretch; gap: 0; padding: 0; border-radius: 16px; }
        .map-idle-card.wide img { width: 100%; height: clamp(130px, 26vh, 260px); border-radius: 0; }
        .map-idle-card.wide.row { flex-direction: row; width: clamp(440px, 42vw, 620px); }
        .map-idle-card.wide.row img { width: 36%; height: auto; flex: none; align-self: stretch; }
        .map-idle-card.wide img.icon { height: clamp(96px, 16vh, 150px); padding: 18px; }
        .map-idle-card.wide > div { padding: 16px 20px 20px; overflow: auto; }
        .map-idle-card.wide span { font-size: 12px; }
        .map-idle-card.wide strong { margin: 4px 0 2px; font-size: clamp(19px, 1.5vw, 24px); }
        .map-idle-card.wide small { margin-bottom: 8px; font-size: 13px; }
        .map-idle-card.wide p { font-size: clamp(14px, 1.05vw, 16px); line-height: 1.55; }
        .map-idle-card.wide em { margin-top: 12px; font-size: 13px; }
        .map-idle-card.wide i { display: block; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: #9fd4b0; transform-origin: left; transform: scaleX(0); }
        .map-idle-card.wide.show i { animation: map-idle-timer ${CARD_MS}ms linear forwards; }
        @keyframes map-idle-timer { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        .map-idle-line { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 39; pointer-events: none; overflow: visible;
          opacity: 0; transition: opacity 0.9s ease; filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.55)); }
        .map-idle-line.show { opacity: 1; }
        .map-idle-line line { stroke: #fff; stroke-width: 1.5; stroke-linecap: round; }
        .map-idle-line circle { fill: #fff; }
        @media (max-height: 700px) { .map-idle-card.wide img { height: 120px; } .map-idle-card.wide img.icon { height: 84px; } }
        .map-idle-media-layer { position: fixed; inset: 0; z-index: 41; pointer-events: none; }
        .map-idle-media-layer[hidden] { display: none; }
        .map-idle-media { position: absolute; box-sizing: border-box; display: flex; flex-direction: column; margin: 0; padding: 0; border: 0;
          border-radius: 14px; overflow: hidden; background: rgba(20, 31, 23, 0.92); color: #dfe8e1; box-shadow: 0 10px 26px rgba(0, 0, 0, 0.3);
          font: inherit; text-align: left; cursor: pointer; opacity: 0; transform: translateY(10px) scale(0.98);
          transition: opacity 0.8s ease, transform 0.8s ease; pointer-events: none; }
        .map-idle-media-layer.show .map-idle-media { opacity: 1; transform: none; pointer-events: auto; }
        .map-idle-media img { display: block; width: 100%; object-fit: cover; background: #2b3a30; }
        .map-idle-media span { display: block; box-sizing: border-box; height: ${MEDIA_CAPTION_PX}px; padding: 6px 10px 0; overflow: hidden; font-size: 12px; line-height: 1.3; }
        .map-idle-media span b { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-weight: 400; }
        .map-idle-media:hover span, .map-idle-media:focus-visible span { color: #fff; }
        .map-idle-media:focus-visible { outline: 2px solid #9fd4b0; outline-offset: 2px; }
      `;
      document.head.appendChild(style);
    }

    // Where the card goes on phones and tablets, inside the map. Tall maps:
    // centred at the foot, above the round buttons (or the bottom edge).
    // Wide, short maps (landscape): down the right side, clear of the locate
    // button, so the stop has the open map to its left.
    function placeCard() {
      if (!card || card.classList.contains("wide")) return;
      const rect = document.getElementById("map")?.getBoundingClientRect?.();
      if (!rect?.width || !rect?.height) return;
      const floor = Math.min(rect.bottom, window.innerHeight - (ctx.insets?.()?.bottom || 0));
      const landscape = rect.width > rect.height * 1.4;
      let left = 0;
      let width = 0;
      let bottom = floor - CARD_GAP_PX;
      if (landscape) {
        width = Math.min(380, Math.round(rect.width * 0.46));
        left = rect.right - LOCATE_CLEARANCE_PX - width;
      } else {
        const dock = document.getElementById("mobile-promo-dock")?.getBoundingClientRect?.();
        if (dock?.height && dock.top > rect.top && dock.top < floor) bottom = dock.top - CARD_GAP_PX;
        width = Math.min(520, rect.width - 24);
        left = rect.left + (rect.width - width) / 2;
        // The app's locate button sits at the map's bottom right: a wide map
        // narrows the card to stop short of it; a phone lifts the card above it.
        const locate = document.querySelector(".mobile-map-locate")?.getBoundingClientRect?.();
        if (locate?.width) {
          place(left, width, bottom);
          const top = bottom - (card.offsetHeight || CARD_GUESS_PX);
          if (locate.top < bottom && locate.bottom > top && locate.left < left + width) {
            if (rect.width >= 560) {
              const room = locate.left - CARD_GAP_PX - (rect.left + 12);
              width = Math.min(width, room);
              left = rect.left + 12 + (room - width) / 2;
            } else bottom = Math.min(bottom, locate.top - CARD_GAP_PX);
          }
        }
      }
      card.dataset.side = landscape ? "right" : "bottom";
      place(left, width, bottom);
    }

    function place(left, width, bottom) {
      Object.assign(card.style, {
        left: `${Math.round(left)}px`,
        right: "auto",
        width: `${Math.round(width)}px`,
        bottom: `${Math.round(Math.max(8, window.innerHeight - bottom))}px`
      });
    }

    // Fills the card for the next stop while it is still invisible, so the
    // flight can frame the stop beside it.
    function prepareCard(stop, kicker) {
      installStyles();
      if (!card) {
        card = document.createElement("aside");
        card.className = "map-idle-card";
        card.setAttribute("role", "status");
        card.setAttribute("aria-live", "polite");
        card.addEventListener("click", () => {
          const open = cardOpen;
          wake();
          open?.();
        });
        document.body.appendChild(card);
        window.addEventListener("resize", () => {
          placeCard();
          if (lineStop) drawLine(lineStop);
        });
      }
      window.clearTimeout(hideTimer);
      card.classList.remove("show");
      card.classList.toggle("wide", wide());
      if (wide()) {
        Object.assign(card.style, { left: "", right: "", width: "", bottom: "" });
        card.style.setProperty("--map-idle-max", `${Math.max(180, Math.round(openArea().height))}px`);
      }
      cardOpen = stop.open || null;
      const photo = hasPhoto(stop) ? stop.image : "";
      // Under the whole island a photo goes beside the words, to keep the card low.
      card.classList.toggle("row", wide() && Boolean(stop.island && photo));
      const photoClass = stop.icon ? " class=\"icon\"" : stop.portrait ? " class=\"portrait\"" : "";
      const photoFocus = stop.portrait && stop.focus ? ` style="object-position:${escapeHtml(stop.focus)}"` : "";
      card.innerHTML = `${photo ? `<img${photoClass}${photoFocus} src="${escapeHtml(photo)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : ""}
        <div><span>${escapeHtml(kicker)}</span><strong>${escapeHtml(stop.title)}</strong>
        ${stop.line ? `<small>${escapeHtml(stop.line)}</small>` : ""}
        <p>${escapeHtml(stop.text)}</p>${cardOpen ? `<em>${escapeHtml(stop.action || (wide() ? "Click to read more" : "Tap to read more"))}</em>` : ""}</div><i></i>`;
      card.setAttribute("aria-hidden", "true");
      card.hidden = false;
      placeCard();
      beside = wide() ? planBeside(stop) : null;
      if (beside) putCard(beside.spots[0]);
      requestMedia(stop);
    }

    // The page's open map: clear of the top bar, the quote ticker and any panel.
    function openArea() {
      const inset = ctx.insets?.() || {};
      const left = Math.max(12, inset.left || 0);
      const top = Math.max(12, inset.top || 0);
      const right = window.innerWidth - Math.max(12, inset.right || 0);
      const bottom = window.innerHeight - Math.max(12, inset.bottom || 0);
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    }

    // What a stop shows on the map, as [[west, south], [east, north]]; null for a point.
    function stopBounds(stop) {
      if (stop.island) return [[LONG_ISLAND.west, LONG_ISLAND.south], [LONG_ISLAND.east, LONG_ISLAND.north]];
      return (stop.site && ctx.camera?.siteBounds?.(stop.site)) || null;
    }

    // Pixels from the stop's centre to each side of what it shows, at a zoom.
    function reach(stop, zoom) {
      const bounds = stopBounds(stop);
      if (!bounds) return POINT_CLEAR;
      const scale = pixelsPerDegree(zoom);
      const y = mercator(stop.center[1]);
      return {
        left: Math.max(POINT_CLEAR.left, (stop.center[0] - bounds[0][0]) * scale),
        right: Math.max(POINT_CLEAR.right, (bounds[1][0] - stop.center[0]) * scale),
        up: Math.max(POINT_CLEAR.up, (mercator(bounds[1][1]) - y) * scale),
        down: Math.max(POINT_CLEAR.down, (y - mercator(bounds[0][1])) * scale)
      };
    }

    // Down from the island's centre (pixels) to the south shore, across the stretch
    // of it between two distances along the island.
    function offShore(from, to, zoom) {
      const scale = pixelsPerDegree(zoom);
      const middle = mercator(ISLAND.center[1]);
      const shore = SOUTH_SHORE.map(([lng, lat]) => [(lng - ISLAND.center[0]) * scale, (middle - mercator(lat)) * scale]);
      const at = x => {
        const next = shore.findIndex(point => point[0] >= x);
        if (next <= 0) return shore[next === 0 ? 0 : shore.length - 1][1];
        const [a, b] = [shore[next - 1], shore[next]];
        return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      };
      return Math.max(at(from), at(to), ...shore.filter(point => point[0] > from && point[0] < to).map(point => point[1]));
    }

    function planIsland(stop, area, width, height) {
      let zoom = Math.max(7, Math.min(9.6, Math.log2((area.width - 24) * 360 / (256 * (LONG_ISLAND.east - LONG_ISLAND.west)))));
      let span = reach(stop, zoom);
      let below = offShore(-width / 2, width / 2, zoom) + CARD_BESIDE_PX;
      while (zoom > 7 && span.up + Math.max(span.down, below + height) > area.height) {
        zoom -= 0.1;
        span = reach(stop, zoom);
        below = offShore(-width / 2, width / 2, zoom) + CARD_BESIDE_PX;
      }
      const x = (area.left + area.right + span.left - span.right) / 2;
      const y = (area.top + area.bottom + span.up - Math.max(span.down, below + height)) / 2;
      // Under the middle of the island first, then along the shore either way,
      // halfway down between the shore and the edge of the open map.
      const spots = [0, -90, 90, -180, 180, -270, 270, -360, 360].map(shift => {
        const shore = y + offShore(shift - width / 2, shift + width / 2, zoom);
        return { left: x + shift - width / 2, top: Math.max(shore + CARD_BESIDE_PX, (shore + area.bottom - height) / 2), side: "bottom" };
      }).filter(spot => spot.left >= area.left && spot.left + width <= area.right && spot.top + height <= area.bottom);
      return { zoom, x, y, spots };
    }

    function planSite(stop, area, width, height) {
      const bounds = stopBounds(stop);
      let zoom = stop.zoom || STOP_ZOOM;
      if (bounds) {
        const across = (area.width - width - 2 * CARD_BESIDE_PX - 24) / (bounds[1][0] - bounds[0][0]);
        const high = (area.height - 24) / (mercator(bounds[1][1]) - mercator(bounds[0][1]));
        zoom = Math.max(9, Math.min(zoom, Math.log2(Math.min(across, high) * 360 / 256)));
      }
      const span = reach(stop, zoom);
      // The place in the middle of the open map, or right of it if a wide shape needs the room.
      const x = Math.max((area.left + area.right) / 2, area.left + width + 2 * CARD_BESIDE_PX + span.left);
      const y = (area.top + area.bottom + span.up - span.down) / 2;
      const middle = Math.max(area.top, Math.min(area.bottom - height, y - height / 2));
      // Halfway from the place (or its shape's edge) to the edge of the screen, on a
      // narrow screen only as near the place as still leaves it clear.
      const nearLeft = bounds ? x - span.left : x;
      const nearRight = bounds ? x + span.right : x;
      const sides = [
        ["left", Math.min((area.left + nearLeft - width) / 2, x - span.left - CARD_BESIDE_PX - width)],
        ["right", Math.max((nearRight + area.right - width) / 2, x + span.right + CARD_BESIDE_PX)]
      ];
      const spots = [];
      for (const [side, left] of sides) {
        if (left < area.left || left + width > area.right) continue;
        for (const shift of [0, -70, 70, -140, 140]) {
          const top = middle + shift;
          if (top >= area.top && top + height <= area.bottom) spots.push({ left, top, side });
        }
      }
      return { zoom, x, y, spots };
    }

    function planBeside(stop) {
      const area = openArea();
      if (stop.island) {
        // The prompt at the foot of the map is right where this card goes: stay above it.
        const prompt = document.querySelector("[data-research-question-prompt]:not([hidden])")?.getBoundingClientRect();
        if (prompt?.height > 1) {
          area.bottom = Math.min(area.bottom, prompt.top - 12);
          area.height = area.bottom - area.top;
        }
      }
      const plan = stop.island ? planIsland(stop, area, card.offsetWidth, card.offsetHeight) : planSite(stop, area, card.offsetWidth, card.offsetHeight);
      return plan.spots.length ? plan : null;
    }

    function putCard(spot) {
      card.style.setProperty("--map-idle-left", `${Math.round(spot.left)}px`);
      card.style.setProperty("--map-idle-bottom", `${Math.round(window.innerHeight - spot.top - card.offsetHeight)}px`);
      card.dataset.side = spot.side;
    }

    // Once the map has stopped: the first spot clear of event cards, prompts and panels.
    function settleCard() {
      if (!beside) return;
      const blocks = [...document.querySelectorAll(CARD_BLOCKERS)].map(element => element.getBoundingClientRect()).filter(rect => rect.width > 1 && rect.height > 1);
      const width = card.offsetWidth;
      const height = card.offsetHeight;
      const clear = beside.spots.find(spot => !blocks.some(block => spot.left < block.right + 8 && spot.left + width > block.left - 8 && spot.top < block.bottom + 8 && spot.top + height > block.top - 8));
      if (clear) putCard(clear);
    }

    function showCard() {
      if (!card) return;
      card.removeAttribute("aria-hidden");
      requestAnimationFrame(() => requestAnimationFrame(() => card?.classList.add("show")));
    }

    // Where the stop's place is on screen (page pixels): from the map when it can
    // say, else the middle of the framed view, where every stop lands (the app's
    // native map flies itself, out of the page's reach).
    function stopScreenPoint(stop) {
      if (stop.island) return null;
      // A walking person: the figure itself, where the page draws it.
      const figure = stop.centerAt && stop.slug ? ctx.camera?.personPoint?.(stop.slug) : null;
      if (figure) return figure;
      const center = stop.centerAt ? here : stop.center;
      if (!center) return null;
      const fromCamera = ctx.camera?.toScreen?.(center);
      if (fromCamera) return fromCamera;
      const map = !nativeCamera() && getMap();
      if (map?.project && map.getCanvas && map.getContainer) {
        const point = map.project(center);
        const rect = map.getContainer().getBoundingClientRect();
        return [rect.left + point.x, rect.top + point.y];
      }
      return lastFrame?.point || null;
    }

    // A site drawn as a shape is found by its name, not the middle of the
    // shape: when the map can say where the stop's title label shows, the line
    // ends just short of the label's side facing the card.
    function labelPoint(stop, side) {
      const box = stop.site && ctx.camera?.labelBox?.(stop.site);
      if (!box?.width) return null;
      const middle = (box.top + box.bottom) / 2;
      return side === "left" ? [box.left - 4, middle]
        : side === "right" ? [box.right + 4, middle]
          : [(box.left + box.right) / 2, box.bottom + 4];
    }

    // A thin white line from the place to the nearest edge of its card, so the
    // eye can follow which place the card is about. Hidden with the card.
    function drawLine(stop) {
      lineStop = stop;
      const side = card?.dataset.side;
      const point = card && !card.hidden && (labelPoint(stop, side) || stopScreenPoint(stop));
      if (!point) return hideLine();
      const rect = card.getBoundingClientRect();
      const [x, y] = point;
      if (!rect.width || (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)) return hideLine();
      const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
      const end = side === "left" ? [rect.right, clamp(y, rect.top + 24, rect.bottom - 24)]
        : side === "right" ? [rect.left, clamp(y, rect.top + 24, rect.bottom - 24)]
          : [clamp(x, rect.left + 24, rect.right - 24), rect.top];
      if (!line) {
        line = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        line.setAttribute("class", "map-idle-line");
        line.setAttribute("aria-hidden", "true");
        line.innerHTML = '<line></line><circle r="3.5"></circle>';
        document.body.appendChild(line);
      }
      const [segment, dot] = line.children;
      segment.setAttribute("x1", x);
      segment.setAttribute("y1", y);
      segment.setAttribute("x2", end[0]);
      segment.setAttribute("y2", end[1]);
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      line.classList.add("show");
    }

    function hideLine() {
      lineStop = null;
      line?.classList.remove("show");
    }

    // The stop's pictures (desktop): asked of the page as the flight begins, each
    // loaded to learn its shape; only pictures that load at a useful size count.
    function requestMedia(stop) {
      const request = { key: stop.key, items: null };
      mediaFor = request;
      if (!wide() || stop.island || typeof ctx.media !== "function") return;
      const [kind, slug] = String(stop.key).split(":");
      Promise.resolve()
        .then(() => ctx.media({ kind, slug: stop.slug || slug, site: stop.site || null }))
        .then(list => Promise.all((Array.isArray(list) ? list : []).slice(0, MEDIA_MAX * 2).map(loadMedia)))
        .then(loaded => {
          if (mediaFor === request) request.items = loaded.filter(Boolean).slice(0, MEDIA_MAX);
        })
        .catch(() => {
          if (mediaFor === request) request.items = [];
        });
    }

    function loadMedia(item) {
      return new Promise(resolve => {
        if (!item?.src) return resolve(null);
        const image = new Image();
        let timeout = 0;
        const done = loaded => {
          window.clearTimeout(timeout);
          const ok = loaded && image.naturalWidth >= 160 && image.naturalHeight >= 120;
          resolve(ok ? { ...item, ratio: image.naturalWidth / image.naturalHeight } : null);
        };
        timeout = window.setTimeout(() => done(false), 8000);
        image.onload = () => done(true);
        image.onerror = () => done(false);
        image.decoding = "async";
        image.src = item.src;
      });
    }

    // What the pictures must leave clear: the card, the place (its shape, unless the
    // shape fills most of the map, then its middle) and its name, the line to the
    // card, and the page's own panels and buttons.
    function mediaAvoid(stop, area) {
      const grow = (rect, by) => ({ left: rect.left - by, top: rect.top - by, right: rect.right + by, bottom: rect.bottom + by });
      const rects = [];
      const cardRect = card?.getBoundingClientRect();
      if (cardRect?.width) rects.push(grow(cardRect, 18));
      document.querySelectorAll(CARD_BLOCKERS).forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.width > 1 && rect.height > 1) rects.push(grow(rect, 10));
      });
      const point = stopScreenPoint(stop);
      if (point) {
        let span = reach(stop, beside?.zoom || stop.zoom || STOP_ZOOM);
        if ((span.left + span.right) * (span.up + span.down) > area.width * area.height * 0.35) span = POINT_CLEAR;
        rects.push({ left: point[0] - span.left - 16, top: point[1] - span.up - 16, right: point[0] + span.right + 16, bottom: point[1] + span.down + 16 });
      }
      const label = stop.site && ctx.camera?.labelBox?.(stop.site);
      if (label?.width) rects.push(grow(label, 12));
      const segment = line?.classList.contains("show") && line.firstElementChild;
      if (segment) {
        const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map(name => Number(segment.getAttribute(name)));
        rects.push({ left: Math.min(x1, x2) - 10, top: Math.min(y1, y2) - 10, right: Math.max(x1, x2) + 10, bottom: Math.max(y1, y2) + 10 });
      }
      return rects;
    }

    // The free spot nearest the anchor for a box of this size, on a coarse grid.
    function mediaSpot(box, area, avoid, anchor) {
      let best = null;
      let bestScore = Infinity;
      for (let top = area.top; top + box.height <= area.bottom; top += MEDIA_GRID_PX) {
        for (let left = area.left; left + box.width <= area.right; left += MEDIA_GRID_PX) {
          const right = left + box.width;
          const bottom = top + box.height;
          if (avoid.some(rect => left < rect.right && right > rect.left && top < rect.bottom && bottom > rect.top)) continue;
          const score = Math.hypot(left + box.width / 2 - anchor[0], top + box.height / 2 - anchor[1]);
          if (score < bestScore) {
            bestScore = score;
            best = { left, top };
          }
        }
      }
      return best;
    }

    // Each picture keeps its own shape (within limits) at about the same area,
    // gathered between the card and the place; one that won't fit is tried a little
    // smaller, never below the minimum, then left out.
    function layoutMedia(stop, items) {
      const area = openArea();
      const avoid = mediaAvoid(stop, area);
      const cardRect = card.getBoundingClientRect();
      const point = stopScreenPoint(stop) || [area.left + area.width / 2, area.top + area.height / 2];
      const anchor = [((cardRect.left + cardRect.right) / 2 + point[0]) / 2, ((cardRect.top + cardRect.bottom) / 2 + point[1]) / 2];
      const baseArea = Math.max(64000, Math.min(110000, area.width * area.height * 0.075));
      const placed = [];
      for (const item of items) {
        const ratio = Math.min(MEDIA_RATIO_MAX, Math.max(MEDIA_RATIO_MIN, item.ratio));
        for (const scale of [1, 0.85]) {
          let width = Math.sqrt(baseArea * scale * ratio);
          let height = Math.sqrt(baseArea * scale / ratio);
          const fit = Math.min(1, MEDIA_MAX_W_PX / width, MEDIA_MAX_H_PX / height);
          width *= fit;
          height *= fit;
          if (Math.min(width, height) < MEDIA_MIN_SIDE_PX) {
            const up = MEDIA_MIN_SIDE_PX / Math.min(width, height);
            width *= up;
            height *= up;
          }
          const box = { width: Math.round(width), height: Math.round(height) + MEDIA_CAPTION_PX };
          const taken = placed.map(entry => ({ left: entry.left - MEDIA_GAP_PX, top: entry.top - MEDIA_GAP_PX, right: entry.left + entry.width + MEDIA_GAP_PX, bottom: entry.top + entry.height + MEDIA_GAP_PX }));
          const spot = mediaSpot(box, area, [...avoid, ...taken], anchor);
          if (spot) {
            placed.push({ item, left: spot.left, top: spot.top, width: box.width, height: box.height, imageHeight: Math.round(height) });
            break;
          }
        }
      }
      return placed;
    }

    function showMedia(placed) {
      if (!placed.length) return;
      if (!mediaLayer) {
        mediaLayer = document.createElement("div");
        mediaLayer.className = "map-idle-media-layer";
        mediaLayer.addEventListener("click", event => {
          const button = event.target.closest?.(".map-idle-media");
          const item = button && mediaLayer.placed?.[Number(button.dataset.index)]?.item;
          if (!item) return;
          event.stopPropagation();
          wake();
          item.open?.();
        });
        document.body.appendChild(mediaLayer);
      }
      mediaLayer.placed = placed;
      mediaLayer.classList.remove("show");
      mediaLayer.innerHTML = placed.map((entry, index) => `<button type="button" class="map-idle-media" data-index="${index}" title="${escapeHtml(entry.item.caption || "")}"
        style="left:${Math.round(entry.left)}px;top:${Math.round(entry.top)}px;width:${entry.width}px;transition-delay:${400 + index * 450}ms">
        <img src="${escapeHtml(entry.item.src)}" alt="${escapeHtml(entry.item.alt || "")}" loading="lazy" decoding="async" style="height:${entry.imageHeight}px" onerror="this.closest('.map-idle-media')?.remove()">
        <span><b>${escapeHtml(entry.item.caption || "")}</b></span></button>`).join("");
      mediaLayer.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => mediaLayer?.classList.add("show")));
    }

    function hideMedia() {
      if (!mediaLayer || mediaLayer.hidden) return;
      const layer = mediaLayer;
      layer.classList.remove("show");
      window.setTimeout(() => {
        if (layer.classList.contains("show")) return;
        layer.hidden = true;
        layer.innerHTML = "";
        layer.placed = null;
      }, 900);
    }

    function hideCard() {
      hideLine();
      hideMedia();
      if (!card || card.hidden) return;
      card.classList.remove("show");
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        if (card && !card.classList.contains("show")) card.hidden = true;
      }, 900);
    }

    function later(step, ms) {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!running) return;
        // Anything unexpected ends the tour cleanly rather than leaving the
        // map stuck mid-flight with a card half shown.
        try {
          step();
        } catch (error) {
          console.warn("Map tour stopped.", error);
          wake();
        }
      }, ms);
    }

    // Where a stop should land: the middle of the map that is actually
    // visible, below the top bar and beside or above the card. Returned as
    // padding for the native map, whose view covers exactly the page's map
    // area (physical pixels from that view's top and bottom), and as an
    // offset from the map's centre (CSS pixels) for web maps.
    function framing(stop = null) {
      const mapRect = document.getElementById("map")?.getBoundingClientRect();
      const visible = mapRect && mapRect.height > 80;
      const box = visible
        ? { left: Math.max(0, mapRect.left), top: Math.max(0, mapRect.top), right: Math.min(window.innerWidth, mapRect.right), bottom: Math.min(window.innerHeight, mapRect.bottom) }
        : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
      const inset = ctx.insets?.() || {};
      const free = {
        left: Math.max(box.left, inset.left || 0),
        top: Math.max(box.top, inset.top || 0),
        right: Math.min(box.right, window.innerWidth - (inset.right || 0)),
        bottom: Math.min(box.bottom, window.innerHeight - (inset.bottom || 0))
      };
      if (!wide()) {
        const cardRect = card && !card.hidden ? card.getBoundingClientRect() : null;
        const side = cardRect?.width ? card.dataset.side : "";
        if (side === "right") free.right = Math.min(free.right, cardRect.left - 16);
        else free.bottom = Math.min(free.bottom, (cardRect?.height ? cardRect.top : free.bottom - CARD_GUESS_PX) - 8);
      }
      free.bottom = Math.max(free.bottom, Math.min(box.bottom, free.top + 120));
      free.right = Math.max(free.right, Math.min(box.right, free.left + 160));
      if (stop && beside) {
        return {
          zoom: beside.zoom,
          offset: [Math.round(beside.x - (box.left + box.right) / 2), Math.round(beside.y - (box.top + box.bottom) / 2)],
          width: free.right - free.left,
          point: [beside.x, beside.y]
        };
      }
      const dpr = window.devicePixelRatio || 1;
      return {
        padTop: Math.round((free.top - box.top) * dpr),
        padBottom: Math.round((box.bottom - free.bottom) * dpr),
        offset: [Math.round((free.left + free.right - box.left - box.right) / 2), Math.round((free.top + free.bottom - box.top - box.bottom) / 2)],
        width: free.right - free.left,
        // Where a stop lands on screen (page pixels): the middle of the free view.
        point: [(free.left + free.right) / 2, (free.top + free.bottom) / 2]
      };
    }

    // The zoom that fits the whole island across the visible map.
    function islandZoom(frame) {
      const metresPerPixelAtZoom0 = 156543.03 * Math.cos(ISLAND.center[1] * Math.PI / 180);
      return Math.max(7, Math.min(9.6, Math.log2(metresPerPixelAtZoom0 * frame.width / (ISLAND.widthKm * 1000))));
    }

    // The native (or desktop) map when the page hands one over; otherwise the web map.
    function nativeCamera() {
      return Boolean(ctx.camera?.ready());
    }

    function cameraReady() {
      return nativeCamera() || Boolean(getMap());
    }

    // fly: zoom out while panning and back in on arrival (one continuous move).
    // frame (optional): where on screen the target should land.
    function moveTo(view, fly, frame = null) {
      if (nativeCamera()) {
        // The app's native map takes top and bottom padding; a sideways
        // offset moves the target instead. (The desktop map takes offsets.)
        const shift = frame && !ctx.camera.offsets ? frame.offset[0] : 0;
        // Degrees of longitude per pixel on a 512-pixel-tile map (MapLibre).
        const center = shift ? [view.center[0] - shift * 360 / 512 / 2 ** view.zoom, view.center[1]] : view.center;
        return ctx.camera.move({ ...view, center, fly, padTop: frame?.padTop, padBottom: frame?.padBottom, offset: frame?.offset });
      }
      const map = getMap();
      if (!map) return;
      const placed = frame ? { ...view, offset: frame.offset } : view;
      if (fly && typeof map.flyTo === "function") map.flyTo({ ...placed, curve: 1.42, essential: true });
      else map.easeTo({ ...placed, easing: smooth, essential: true });
    }

    function stopCamera() {
      if (nativeCamera()) ctx.camera.stop();
      else getMap()?.stop?.();
    }

    function currentCenter() {
      const center = getMap()?.getCenter?.();
      if (center) return [Number(center.lng), Number(center.lat)];
      return ctx.camera?.center?.() || here || ISLAND.center;
    }

    function flightMs(from, to) {
      return Math.round(Math.min(FLY_MAX_MS, Math.max(FLY_MIN_MS, 6000 + distanceKm(from, to) * 300)));
    }

    // What comes next: mostly places; a person every third stop and an
    // animal every fifth when one is within reach; every sixth, the whole
    // island and a fact about the project.
    function pick(from) {
      const n = visits + 1;
      return (n % 6 === 0 && nextFact())
        || (n % 5 === 0 && nextExtra(animalStops(), from))
        || (n % 3 === 0 && nextExtra(personStops(), from))
        || nextSite(from);
    }

    function kickerFor(stop) {
      if (stop.kicker) return stop.kicker;
      return (visits + 1) % 4 === 0 ? "Site highlight" : "Did you know?";
    }

    // Fly on to the next stop; only an arrival stops the camera.
    function tour() {
      if (!cameraReady()) return wake();
      if (Date.now() - startedAt > MAX_RUN_MS) return rest();
      const from = here || currentCenter();
      if (from[0] <= WEST_LNG + 0.05) direction = 1;
      if (from[0] >= EAST_LNG - 0.05) direction = -1;
      const stop = pick(from);
      if (!stop) return later(tour, 300);
      prepareCard(stop, kickerFor(stop));
      const frame = framing(stop);
      lastFrame = frame;
      const camera = currentCenter();
      let flight = flightMs(camera, stop.center);
      // A walking person or wandering animal is met where it will be on
      // arrival, then followed (follow()).
      const center = stop.centerAt ? stop.centerAt(flight + 300) || stop.center : stop.center;
      flight = stop.island ? FLY_MAX_MS : flight;
      const zoom = frame.zoom ?? (stop.island ? islandZoom(frame) : stop.zoom || STOP_ZOOM);
      moveTo({ center, zoom, bearing: 0, pitch: 0, duration: flight }, true, frame);
      if (!stop.island) here = center;
      later(() => arrive(stop), flight + 300);
    }

    // At the stop: its card fades in, then out. A place is held still; a
    // moving person or animal is kept in the same spot on screen.
    function arrive(stop) {
      shown.add(stop.key);
      visits += 1;
      settleCard();
      // Drawn once the card has settled (it slides up as it fades in).
      drawLine(stop);
      // Pictures that arrived during the flight float beside the card; each one
      // shown keeps the stop up a little longer (the card's timer bar follows).
      const items = mediaFor?.key === stop.key ? mediaFor.items || [] : [];
      const placed = items.length && card && !card.hidden ? layoutMedia(stop, items) : [];
      const hold = CARD_MS + Math.min(MEDIA_EXTRA_MAX_MS, placed.length * MEDIA_MS);
      const timerBar = card?.querySelector("i");
      if (timerBar) timerBar.style.animationDuration = `${hold}ms`;
      showCard();
      showMedia(placed);
      window.setTimeout(() => running && lineStop === stop && drawLine(stop), 950);
      if (stop.centerAt) {
        followTimer = window.setInterval(() => follow(stop), FOLLOW_MS);
        // The line stays on a walking figure between the camera's follow moves.
        lineTimer = window.setInterval(() => running && lineStop === stop && drawLine(stop), 150);
      }
      later(() => {
        stopFollowing();
        hideCard();
        later(tour, 1000);
      }, hold);
    }

    function follow(stop) {
      const center = running && stop.centerAt(0);
      if (!onLongIsland(center)) return;
      here = center;
      // A short framed move (the app's native ease can't take the framing).
      const frame = framing(stop);
      moveTo({ center, zoom: frame.zoom ?? (stop.zoom || STOP_ZOOM), bearing: 0, pitch: 0, duration: FOLLOW_MS }, nativeCamera(), frame);
      window.setTimeout(() => running && lineStop === stop && drawLine(stop), FOLLOW_MS + 50);
    }

    function stopFollowing() {
      window.clearInterval(followTimer);
      followTimer = 0;
      window.clearInterval(lineTimer);
      lineTimer = 0;
    }

    // After a long time untouched, settle on the whole island and stay put.
    function rest() {
      stopFollowing();
      hideCard();
      beside = null;
      running = false;
      rested = true;
      if (cameraReady()) {
        const frame = framing();
        moveTo({ center: ISLAND.center, zoom: islandZoom(frame), bearing: 0, pitch: 0, duration: 8000 }, true, frame);
      }
    }

    function start() {
      if (!cameraReady() || running) return;
      // The tour flies the map on its own; people who ask their device for reduced motion don't get it.
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
      running = true;
      startedAt = Date.now();
      visits = 0;
      here = null;
      const center = currentCenter();
      direction = center[0] > (WEST_LNG + EAST_LNG) / 2 ? -1 : 1;
      tour();
    }

    // Any touch, click, key, mouse movement off the map or native map
    // gesture: stop right where the camera is.
    function wake() {
      lastActivity = Date.now();
      rested = false;
      if (!running) return;
      running = false;
      window.clearTimeout(timer);
      stopFollowing();
      stopCamera();
      hideCard();
    }

    ["pointerdown", "touchstart", "wheel", "keydown"].forEach(type => {
      document.addEventListener(type, event => {
        if (inTour(event.target)) return;
        // The tap that wakes the map only wakes it; it doesn't also open
        // whatever was under the finger. Drags carry on as normal.
        if (running && (type === "pointerdown" || type === "touchstart")) swallowClickUntil = Date.now() + 700;
        wake();
      }, { capture: true, passive: true });
    });
    // A mouse that really moves (browsers also send moves when only the page
    // under a still pointer changes). Moving over the map itself doesn't
    // count: a mouse resting on or drifting across the map leaves the tour
    // going, and only a click, scroll or key stops it.
    document.addEventListener("mousemove", event => {
      const moved = pointer && Math.hypot(event.screenX - pointer[0], event.screenY - pointer[1]) > 6;
      pointer = [event.screenX, event.screenY];
      if (!moved || inTour(event.target)) return;
      if ((ctx.mapElement?.() || getMap()?.getContainer?.())?.contains(event.target)) return;
      wake();
    }, { capture: true, passive: true });
    document.addEventListener("click", event => {
      if (Date.now() > swallowClickUntil || inTour(event.target)) return;
      swallowClickUntil = 0;
      event.preventDefault();
      event.stopPropagation();
    }, { capture: true });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") wake();
    });
    // Checked every second: a content page opening (or anything else taking
    // over the map) ends the tour straight away.
    window.setInterval(() => {
      if (running) {
        if (!mainMapIdle()) wake();
        return;
      }
      if (rested || document.visibilityState !== "visible") return;
      if (Date.now() - lastActivity >= idleMs && cameraReady() && mainMapIdle()) start();
    }, CHECK_MS);

    return { wake, start, running: () => running, fact };
  }

  window.NLI_MAP_IDLE = { create };
}());
