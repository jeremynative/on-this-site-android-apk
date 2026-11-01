// Idle "screensaver" for the map. When the app is left open on the main map
// (after opening it, or after closing a site) and nothing is touched for a
// while, the camera drifts slowly along Long Island, easing in and out.
// Every few stops it pauses and fades in a "Did you know" card about a place
// near that spot, and now and then it glides in to one site for a closer
// look before pulling back out. Any touch ends it at once; tapping a card
// opens that site. Live, it moves the web map, which the Android app mirrors
// onto its native map; offline (no web map) it eases the native map itself
// through ctx.camera.
(function () {
  const IDLE_MS = 45000;
  const CHECK_MS = 5000;
  const HOP_MS = 16000;
  const CARD_MS = 9000;
  const VISIT_IN_MS = 7000;
  const VISIT_HOLD_MS = 10000;
  const VISIT_OUT_MS = 6000;
  const MAX_RUN_MS = 15 * 60 * 1000;
  const NEAR_KM = 14;
  // West to east along the island: Brooklyn and Queens to Montauk Point.
  const SPINE = [
    [-73.93, 40.67], [-73.66, 40.73], [-73.4, 40.78], [-73.12, 40.82],
    [-72.84, 40.86], [-72.56, 40.89], [-72.3, 40.93], [-72.06, 40.99], [-71.9, 41.04]
  ];
  const ZOOMS = [9.4, 10.2];
  const OVERVIEW = { center: [-72.85, 40.86], zoom: 8.6 };
  const smooth = t => t * t * (3 - 2 * t);

  function create(ctx) {
    const { getMap, getSites, mainMapIdle, openSite, escapeHtml } = ctx;
    const showPhotos = ctx.showPhotos || (() => true);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    let lastActivity = Date.now();
    let running = false;
    let rested = false;
    let startedAt = 0;
    let timer = 0;
    let stop = 0;
    let direction = 1;
    let hops = 0;
    let shown = new Set();
    let card = null;
    let swallowClickUntil = 0;

    function sensitive(site) {
      return /sensitive|burial|grave|cemetery/i.test(site?.site_type || "") || /cemetery|burial/i.test(site?.title || "");
    }

    function plain(value) {
      return String(value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
        .replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, "\"").replace(/\s+/g, " ").trim();
    }

    function teaser(site) {
      const text = plain(site.summary || site.why_this_matters);
      if (text.length <= 170) return text;
      const cut = text.slice(0, 170);
      const sentence = cut.lastIndexOf(". ");
      return sentence > 80 ? cut.slice(0, sentence + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
    }

    function distanceKm(a, b) {
      const rad = Math.PI / 180;
      const dLat = (b[1] - a[1]) * rad;
      const dLng = (b[0] - a[0]) * rad;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
      return 12742 * Math.asin(Math.sqrt(h));
    }

    function candidates() {
      return (getSites() || []).filter(site => Array.isArray(site.center) && site.center.every(Number.isFinite)
        && site.slug && site.title && teaser(site) && !sensitive(site));
    }

    // A place near the given point not featured yet; photos first.
    function siteNear(point) {
      const near = candidates().filter(site => !shown.has(site.slug) && distanceKm(point, site.center.map(Number)) <= NEAR_KM);
      const pool = showPhotos() ? near.filter(site => site.listing_image_thumb_url || site.listing_image_url) : [];
      const list = pool.length ? pool : near;
      return list.length ? list[Math.floor(Math.random() * list.length)] : null;
    }

    function randomSite() {
      const all = candidates().filter(site => !shown.has(site.slug));
      const withPhoto = showPhotos() ? all.filter(site => site.listing_image_thumb_url || site.listing_image_url) : [];
      const list = withPhoto.length ? withPhoto : all;
      if (!list.length) shown = new Set();
      return list.length ? list[Math.floor(Math.random() * list.length)] : null;
    }

    function installStyles() {
      if (document.getElementById("map-idle-styles")) return;
      const style = document.createElement("style");
      style.id = "map-idle-styles";
      style.textContent = `
        .map-idle-card { position: fixed; left: 12px; right: 12px; bottom: calc(190px + env(safe-area-inset-bottom, 0px)); z-index: 40;
          display: flex; gap: 12px; align-items: center; max-width: 520px; margin: 0 auto; padding: 12px; border-radius: 14px;
          background: rgba(20, 31, 23, 0.9); color: #fff; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.3);
          opacity: 0; transform: translateY(10px); transition: opacity 0.9s ease, transform 0.9s ease; pointer-events: none; }
        .map-idle-card.show { opacity: 1; transform: none; pointer-events: auto; }
        .map-idle-card[hidden] { display: none; }
        .map-idle-card img { flex: none; width: 76px; height: 76px; border-radius: 10px; object-fit: cover; background: #2b3a30; }
        .map-idle-card span { display: block; color: #9fd4b0; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
        .map-idle-card strong { display: block; margin: 2px 0 3px; font-size: 16px; line-height: 1.2; }
        .map-idle-card p { margin: 0; color: #dfe8e1; font-size: 13px; line-height: 1.35; }
        .map-idle-card em { display: block; margin-top: 4px; color: #9fd4b0; font-size: 12px; font-style: normal; }
      `;
      document.head.appendChild(style);
    }

    function showCard(site, kicker) {
      installStyles();
      if (!card) {
        card = document.createElement("aside");
        card.className = "map-idle-card";
        card.setAttribute("role", "status");
        card.setAttribute("aria-live", "polite");
        card.hidden = true;
        card.addEventListener("click", () => {
          const slug = card.dataset.slug;
          wake();
          if (slug) openSite(slug);
        });
        document.body.appendChild(card);
      }
      shown.add(site.slug);
      const photo = showPhotos() ? site.listing_image_thumb_url || site.listing_image_url || "" : "";
      card.dataset.slug = site.slug;
      card.innerHTML = `${photo ? `<img src="${escapeHtml(photo)}" alt="" onerror="this.remove()">` : ""}
        <div><span>${escapeHtml(kicker)}</span><strong>${escapeHtml(plain(site.title))}</strong>
        <p>${escapeHtml(teaser(site))}</p><em>Tap to read more</em></div>`;
      card.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => card?.classList.add("show")));
    }

    function hideCard() {
      if (!card || card.hidden) return;
      card.classList.remove("show");
      const fading = card;
      window.setTimeout(() => {
        if (!fading.classList.contains("show")) fading.hidden = true;
      }, 900);
    }

    // The web map when there is one; offline, the native map via ctx.camera.
    function cameraReady() {
      return Boolean(getMap() || ctx.camera?.ready());
    }

    function moveTo(view, fly) {
      const map = getMap();
      if (!map) return ctx.camera?.move(view);
      if (fly && typeof map.flyTo === "function") map.flyTo({ ...view, curve: 1.3, essential: true });
      else map.easeTo({ ...view, easing: smooth });
    }

    function stopCamera() {
      const map = getMap();
      if (map) map.stop?.();
      else ctx.camera?.stop();
    }

    function later(step, ms) {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (running) step();
      }, ms);
    }

    function nearestStop(center) {
      let best = 0;
      SPINE.forEach((point, index) => {
        if (distanceKm(center, point) < distanceKm(center, SPINE[best])) best = index;
      });
      return best;
    }

    // One slow hop to the next stop along the island, turning back at the ends.
    function drift() {
      if (!cameraReady()) return wake();
      if (Date.now() - startedAt > MAX_RUN_MS) return rest();
      if (stop + direction < 0 || stop + direction >= SPINE.length) direction = -direction;
      stop += direction;
      hops += 1;
      if (!reducedMotion) {
        moveTo({ center: SPINE[stop], zoom: ZOOMS[hops % 2], bearing: 0, pitch: 0, duration: HOP_MS });
      }
      later(pause, reducedMotion ? CARD_MS : HOP_MS + 400);
    }

    // At a stop: every second one, a nearby place fades in; every fifth, a
    // closer look at one site somewhere on the island.
    function pause() {
      if (hops % 5 === 0) return visit();
      if (hops % 2 === 0) {
        const site = siteNear(reducedMotion ? currentCenter() : SPINE[stop]);
        if (site) {
          showCard(site, "Did you know?");
          later(() => {
            hideCard();
            later(drift, 1200);
          }, CARD_MS);
          return;
        }
      }
      drift();
    }

    function visit() {
      const site = randomSite();
      if (!cameraReady() || !site) return drift();
      const center = site.center.map(Number);
      if (reducedMotion) {
        showCard(site, "Site highlight");
        return later(() => {
          hideCard();
          later(drift, 1200);
        }, VISIT_HOLD_MS);
      }
      moveTo({ center, zoom: 13, bearing: 0, pitch: 0, duration: VISIT_IN_MS }, true);
      later(() => {
        showCard(site, "Site highlight");
        later(() => {
          hideCard();
          stop = nearestStop(center);
          moveTo({ center, zoom: ZOOMS[0], bearing: 0, pitch: 0, duration: VISIT_OUT_MS });
          later(drift, VISIT_OUT_MS + 400);
        }, VISIT_HOLD_MS);
      }, VISIT_IN_MS + 300);
    }

    function currentCenter() {
      const center = getMap()?.getCenter?.();
      if (center) return [Number(center.lng), Number(center.lat)];
      return ctx.camera?.center?.() || SPINE[Math.floor(SPINE.length / 2)];
    }

    // After a long time untouched, settle on the whole island and stay put.
    function rest() {
      hideCard();
      running = false;
      rested = true;
      if (cameraReady() && !reducedMotion) moveTo({ ...OVERVIEW, bearing: 0, pitch: 0, duration: 8000 });
    }

    function start() {
      if (!cameraReady() || running) return;
      running = true;
      startedAt = Date.now();
      hops = 0;
      stop = nearestStop(currentCenter());
      direction = stop >= SPINE.length - 1 ? -1 : stop === 0 ? 1 : direction;
      drift();
    }

    // Any touch, key or native map gesture: stop right where the camera is.
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
    document.addEventListener("click", event => {
      if (Date.now() > swallowClickUntil || (card && card.contains(event.target))) return;
      swallowClickUntil = 0;
      event.preventDefault();
      event.stopPropagation();
    }, { capture: true });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") wake();
    });
    window.setInterval(() => {
      if (running) {
        if (!mainMapIdle()) wake();
        return;
      }
      if (rested || document.visibilityState !== "visible") return;
      if (Date.now() - lastActivity >= IDLE_MS && cameraReady() && mainMapIdle()) start();
    }, CHECK_MS);

    return { wake, start, running: () => running };
  }

  window.NLI_MAP_IDLE = { create };
}());
