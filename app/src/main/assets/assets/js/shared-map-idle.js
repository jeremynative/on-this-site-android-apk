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
  // Every flight lasts at least this long, so cards never come back to
  // back: there is always a stretch of panning in between.
  const FLY_MIN_MS = 9000;
  const FLY_MAX_MS = 16000;
  const NEXT_MIN_KM = 1.5;
  const NEXT_MAX_KM = 30;
  const EXTRA_MAX_KM = 40;
  const MAX_RUN_MS = 15 * 60 * 1000;
  // The phone card sits this far above the bottom of the screen (CSS pixels).
  const CARD_BOTTOM_PX = 190;
  const CARD_GUESS_PX = 132;
  const WIDE_MIN_PX = 900;
  // Long Island: its ends (for turning the tour around) and the whole-island view.
  const WEST_LNG = -73.95;
  const EAST_LNG = -71.88;
  const ISLAND = { center: [-72.95, 40.82], widthKm: 190 };
  const LONG_ISLAND = { west: -74.1, east: -71.8, south: 40.5, north: 41.3 };
  const PERSON_ICON = "assets/map-icons/person-biography-marker.png";
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

    // People from the biography paths, at the places in their records.
    function personStops() {
      return (ctx.people?.() || []).flatMap(person => (person.places || [])
        .filter(place => onLongIsland(place.coordinates) && !/burial|grave|cemetery|private/i.test(`${place.place} ${place.label}`))
        .map(place => ({
          key: `person:${person.slug}`,
          kicker: "People of Long Island",
          title: plain(person.name),
          line: [plain(place.dateLabel || place.label), plain(place.place)].filter(Boolean).join(" · "),
          texts: [place.reason, person.article?.summary, person.article?.why_this_matters],
          image: person.image || PERSON_ICON,
          icon: !person.image,
          center: place.coordinates.slice(0, 2).map(Number),
          open: person.open
        })));
    }

    // The animal relatives that wander the map, met where they are.
    function animalStops() {
      return (ctx.animals?.() || []).map(animal => ({
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
          text: "Running Strong for American Indian Youth supported the project through its Dreamstarter program, with Dreamstarter GOLD supporting its next stage in 2020. Monument Lab has supported the project through a fellowship.",
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
        .map-idle-card { position: fixed; left: 12px; right: 12px; bottom: calc(${CARD_BOTTOM_PX}px + env(safe-area-inset-bottom, 0px)); z-index: 40;
          display: flex; gap: 12px; align-items: center; max-width: 520px; margin: 0 auto; padding: 12px; border-radius: 14px; overflow: hidden;
          background: rgba(20, 31, 23, 0.92); color: #fff; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.3);
          opacity: 0; transform: translateY(10px); transition: opacity 0.9s ease, transform 0.9s ease; pointer-events: none; cursor: pointer; }
        .map-idle-card.show { opacity: 1; transform: none; pointer-events: auto; }
        .map-idle-card[hidden] { display: none; }
        .map-idle-card img { flex: none; width: 76px; height: 76px; border-radius: 10px; object-fit: cover; background: #2b3a30; }
        .map-idle-card img.icon { object-fit: contain; padding: 8px; background: #eef3ed; }
        .map-idle-card span { display: block; color: #9fd4b0; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
        .map-idle-card strong { display: block; margin: 2px 0 1px; font-size: 16px; line-height: 1.2; }
        .map-idle-card small { display: block; margin-bottom: 4px; color: #b9cdbf; font-size: 12px; line-height: 1.3; }
        .map-idle-card p { margin: 0; color: #dfe8e1; font-size: 13px; line-height: 1.35; }
        .map-idle-card em { display: block; margin-top: 4px; color: #9fd4b0; font-size: 12px; font-style: normal; }
        .map-idle-card i { display: none; }
        .map-idle-card.wide { left: var(--map-idle-left, 24px); right: auto; bottom: var(--map-idle-bottom, 24px); width: clamp(320px, 30vw, 460px);
          max-width: none; max-height: calc(100vh - var(--map-idle-top, 96px) - var(--map-idle-bottom, 24px)); margin: 0;
          flex-direction: column; align-items: stretch; gap: 0; padding: 0; border-radius: 16px; }
        .map-idle-card.wide img { width: 100%; height: clamp(130px, 26vh, 260px); border-radius: 0; }
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
        @media (max-height: 700px) { .map-idle-card.wide img { height: 120px; } .map-idle-card.wide img.icon { height: 84px; } }
      `;
      document.head.appendChild(style);
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
      }
      window.clearTimeout(hideTimer);
      card.classList.remove("show");
      card.classList.toggle("wide", wide());
      if (wide()) {
        const inset = ctx.insets?.() || {};
        card.style.setProperty("--map-idle-left", `${Math.max(16, inset.left || 24)}px`);
        card.style.setProperty("--map-idle-bottom", `${Math.max(16, inset.bottom || 24)}px`);
        card.style.setProperty("--map-idle-top", `${Math.max(16, inset.top || 96)}px`);
      }
      cardOpen = stop.open || null;
      const photo = hasPhoto(stop) ? stop.image : "";
      card.innerHTML = `${photo ? `<img${stop.icon ? " class=\"icon\"" : ""} src="${escapeHtml(photo)}" alt="" onerror="this.remove()">` : ""}
        <div><span>${escapeHtml(kicker)}</span><strong>${escapeHtml(stop.title)}</strong>
        ${stop.line ? `<small>${escapeHtml(stop.line)}</small>` : ""}
        <p>${escapeHtml(stop.text)}</p>${cardOpen ? `<em>${escapeHtml(stop.action || (wide() ? "Click to read more" : "Tap to read more"))}</em>` : ""}</div><i></i>`;
      card.setAttribute("aria-hidden", "true");
      card.hidden = false;
    }

    function showCard() {
      if (!card) return;
      card.removeAttribute("aria-hidden");
      requestAnimationFrame(() => requestAnimationFrame(() => card?.classList.add("show")));
    }

    function hideCard() {
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
        if (running) step();
      }, ms);
    }

    // Where a stop should land: the middle of the map that is actually
    // visible, below the top bar and beside or above the card. Returned as
    // padding for the native map, whose view covers exactly the page's map
    // area (physical pixels from that view's top and bottom), and as an
    // offset from the map's centre (CSS pixels) for web maps.
    function framing() {
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
      const cardRect = card && !card.hidden ? card.getBoundingClientRect() : null;
      if (cardRect?.width && card.classList.contains("wide")) free.left = Math.max(free.left, cardRect.right + 16);
      else free.bottom = Math.min(free.bottom, (cardRect?.height ? cardRect.top : window.innerHeight - CARD_BOTTOM_PX - CARD_GUESS_PX) - 8);
      free.bottom = Math.max(free.bottom, Math.min(box.bottom, free.top + 120));
      free.right = Math.max(free.right, Math.min(box.right, free.left + 160));
      const dpr = window.devicePixelRatio || 1;
      return {
        padTop: Math.round((free.top - box.top) * dpr),
        padBottom: Math.round((box.bottom - free.bottom) * dpr),
        offset: [Math.round((free.left + free.right - box.left - box.right) / 2), Math.round((free.top + free.bottom - box.top - box.bottom) / 2)],
        width: free.right - free.left
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
      if (nativeCamera()) return ctx.camera.move({ ...view, fly, padTop: frame?.padTop, padBottom: frame?.padBottom, offset: frame?.offset });
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
      const frame = framing();
      const camera = currentCenter();
      let flight = flightMs(camera, stop.center);
      // A wandering animal is met where it will be halfway through its card.
      const center = stop.centerAt ? stop.centerAt(flight + 300 + CARD_MS / 2) : stop.center;
      flight = stop.island ? FLY_MAX_MS : flight;
      const zoom = stop.island ? islandZoom(frame) : stop.zoom || STOP_ZOOM;
      moveTo({ center, zoom, bearing: 0, pitch: 0, duration: flight }, true, frame);
      if (!stop.island) here = center;
      later(() => arrive(stop), flight + 300);
    }

    // At the stop, held still: its card fades in, then out.
    function arrive(stop) {
      shown.add(stop.key);
      visits += 1;
      showCard();
      later(() => {
        hideCard();
        later(tour, 1000);
      }, CARD_MS);
    }

    // After a long time untouched, settle on the whole island and stay put.
    function rest() {
      hideCard();
      running = false;
      rested = true;
      if (cameraReady()) {
        const frame = framing();
        moveTo({ center: ISLAND.center, zoom: islandZoom(frame), bearing: 0, pitch: 0, duration: 8000 }, true, frame);
      }
    }

    function start() {
      if (!cameraReady() || running) return;
      running = true;
      startedAt = Date.now();
      visits = 0;
      here = null;
      const center = currentCenter();
      direction = center[0] > (WEST_LNG + EAST_LNG) / 2 ? -1 : 1;
      tour();
    }

    // Any touch, key, mouse movement or native map gesture: stop right where
    // the camera is.
    function wake() {
      lastActivity = Date.now();
      rested = false;
      if (!running) return;
      running = false;
      window.clearTimeout(timer);
      stopCamera();
      hideCard();
    }

    ["pointerdown", "touchstart", "wheel", "keydown"].forEach(type => {
      document.addEventListener(type, event => {
        if (card && card.contains(event.target)) return;
        // The tap that wakes the map only wakes it; it doesn't also open
        // whatever was under the finger. Drags carry on as normal.
        if (running && (type === "pointerdown" || type === "touchstart")) swallowClickUntil = Date.now() + 700;
        wake();
      }, { capture: true, passive: true });
    });
    // A mouse that really moves (browsers also send moves when only the page
    // under a still pointer changes).
    document.addEventListener("mousemove", event => {
      const moved = pointer && Math.hypot(event.screenX - pointer[0], event.screenY - pointer[1]) > 6;
      pointer = [event.screenX, event.screenY];
      if (moved && !(card && card.contains(event.target))) wake();
    }, { capture: true, passive: true });
    document.addEventListener("click", event => {
      if (Date.now() > swallowClickUntil || (card && card.contains(event.target))) return;
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
