    const SHARED_CONFIG = window.NLI_SHARED_CONFIG || {};
    const SHARED_FIELDS = SHARED_CONFIG.fields || {};
    const SHARED_MAP_STORY = SHARED_CONFIG.mapStory || {};
    const SHARED_UTILS = window.NLI_SHARED_UTILS || {};
    const formatDate = SHARED_UTILS.formatDate;
    const SITE_UTILS = window.NLI_SITE_UTILS || {};
    const SHARED_DIRECTUS = window.NLI_DIRECTUS_CLIENT || {};
    const PROFILE_UTILS = window.NLI_PROFILE_UTILS || {};
    const MAP_STORY_UTILS = window.NLI_MAP_STORY_UTILS || {};
    const ACTIVITY_UTILS = window.NLI_ACTIVITY_UTILS || {};
    const COMMENT_UTILS = window.NLI_COMMENT_UTILS || {};
    const QUOTE_COMMENT_UTILS = window.NLI_QUOTE_COMMENT_UTILS || {};
    const FEEDBACK_UTILS = window.NLI_FEEDBACK_UTILS || {};
    const SUPPORT_UTILS = window.NLI_SUPPORT_UTILS || {};
    const TIMELINE_UTILS = window.NLI_TIMELINE_UTILS || {};
    const PLANT_UTILS = window.NLI_PLANT_UTILS || {};
    const SITE_TITLE_UTILS = window.NLI_SITE_TITLE_UTILS || {};
    const SHARED_MAP_CONFIG = window.NLI_SHARED_MAP_CONFIG || {};
    const HOVER_CARD_UTILS = window.NLI_HOVER_CARD_UTILS || {};
    const FEATURE_PREVIEW_UTILS = window.NLI_FEATURE_PREVIEW_UTILS || {};
    const MEDIA_UTILS = window.NLI_MEDIA_UTILS || {};
    const PRINT_SUPPORT_UTILS = window.NLI_PRINT_SUPPORT_UTILS || {};
    const CALENDAR_UTILS = window.NLI_CALENDAR_UTILS || {};
    const GEOMETRY_UTILS = window.NLI_GEOMETRY_UTILS || {};
    const normalizeHex = GEOMETRY_UTILS.normalizeHex || ((value, fallback) => {
      const text = String(value || "").trim();
      if (/^#[0-9a-f]{6}$/i.test(text)) return text;
      if (/^[0-9a-f]{6}$/i.test(text)) return `#${text}`;
      return fallback;
    });
    const ROUTE_UTILS = window.NLI_ROUTE_UTILS || {};
    const HTML_UTILS = window.NLI_HTML_UTILS || {};
    const MAP_UTILS = window.NLI_SHARED_MAP_UTILS || {};
    const DIRECTUS = SHARED_CONFIG.directusUrl || "https://directus.nativelongisland.com";
    const ADMIN_NOTIFICATION_FLOW_IDS = {
      approveSuggestion: "6f80f94d-c0d9-4266-9291-2a455e7a7f8d",
      declineSuggestion: "dd749434-2093-4d04-8ec4-5084400ce14c"
    };
    const directusClient = SHARED_DIRECTUS.createDirectusClient({
      baseUrl: DIRECTUS,
      fetchErrorPrefix: "Archive request failed",
      tokenProvider: () => state.contributorSession?.token || "",
      refreshTokenProvider: () => state.contributorSession?.refreshToken || state.contributorSession?.refresh_token || "",
      onTokenRefresh: credentials => {
        if (!state.contributorSession) return;
        saveContributorSession({
          ...state.contributorSession,
          token: credentials.token,
          refreshToken: credentials.refreshToken,
          refresh_token: credentials.refreshToken,
          tokenExpires: credentials.expires || null
        });
      },
      onAuthExpired: () => {
        if (!state.contributorSession?.token && !state.contributorSession?.refreshToken && !state.contributorSession?.refresh_token) return;
        saveContributorSession({
          ...state.contributorSession,
          token: null,
          refreshToken: null,
          refresh_token: null,
          tokenExpired: true
        });
        showBanner("Login needs refreshing before saving changes.");
      }
    });
    const PUBLIC_ARCHIVE_BASE = SHARED_CONFIG.publicArchiveBase || "https://nativelongisland.com/";
    const EXHIBIT_MARKER_ICON = "assets/map-icons/exhibit-framed-landscape-marker.png";
    const BIOGRAPHY_PERSON_ICON_URL = "assets/map-icons/person-biography-marker.png";
    const BIOGRAPHY_PERSON_ICON_ID = "biography-person-icon";
    const BIOGRAPHY_CANOE_ICON_ID = "biography-canoe-icon";
    const WHALING_WHALE_ICON_URL = "assets/map-icons/whaling-moving-whale.png";
    const WHALING_FEATURE_SLUG = "whaling";
    const MOVING_DOG_ICON_URL = "assets/map-icons/dog-moving-icon.png";
    const MOVING_DOG_WIKI_SLUG = "dog-ceremonialism";
    const WIKI_TO_SITE_ROUTE_ALIASES = Object.freeze({
      whaling: WHALING_FEATURE_SLUG,
      "indigenous-whaling-and-maritime-labor": WHALING_FEATURE_SLUG
    });
    const WHALING_WHALE_ONE_WAY_MS = 900000;
    const WHALING_WHALE_START_OFFSET_MS = WHALING_WHALE_ONE_WAY_MS * 0.78;
    const WHALING_WHALE_TURN_FADE_MS = 1800;
    const WHALING_WHALE_ANIMATION_INTERVAL_MS = 90;
    const WHALING_WHALE_ROUTE = Object.freeze([
      [-73.88, 40.52],
      [-73.62, 40.52],
      [-73.34, 40.56],
      [-73.03, 40.61],
      [-72.74, 40.68],
      [-72.50, 40.74],
      [-72.24, 40.79],
      [-71.98, 40.84]
    ]);
    const MOVING_DOG_ONE_WAY_MS = 1020000;
    const MOVING_DOG_START_OFFSET_MS = MOVING_DOG_ONE_WAY_MS * 0.35;
    const MOVING_DOG_ANIMATION_INTERVAL_MS = 90;
    const MOVING_DOG_ROUTE = Object.freeze([
      [-73.86, 40.70],
      [-73.72, 40.72],
      [-73.56, 40.75],
      [-73.39, 40.78],
      [-73.20, 40.80],
      [-73.02, 40.82],
      [-72.84, 40.84],
      [-72.72, 40.865],
      [-72.64, 40.865],
      [-72.56, 40.855]
    ]);
    const HEADER_IMAGE_BLUE_PLACEHOLDER_ICON_IDS = new Set(["18979e5a-120e-4af1-b711-9867a67936eb"]);
    const TEXT_ONLY_GREEN_PLACEHOLDER_ICON = "assets/map-icons/acombamack-green-dot-placeholder.png";
    const JEREMY_BIOGRAPHY_SLUG = "jeremy-dennis";
    const BIOGRAPHY_PERSON_ICON_MAX_PX = 24;
    const BIOGRAPHY_PERSON_HIT_TARGET_PX = 44;
    const BIOGRAPHY_CANOE_MAPPED_WATER_SLUGS = new Set([
      "massapootupaug"
    ]);
    const BIOGRAPHY_CANOE_SHALLOW_WATER_AREAS = [
      {
        name: "Flanders Bay and western Great Peconic shallows",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-72.690, 40.885],
            [-72.610, 40.887],
            [-72.505, 40.902],
            [-72.472, 40.928],
            [-72.505, 40.946],
            [-72.612, 40.945],
            [-72.688, 40.926],
            [-72.707, 40.904],
            [-72.690, 40.885]
          ]]
        }
      },
      {
        name: "Napeague Harbor and Napeague Bay shallows",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-72.115, 40.990],
            [-72.075, 40.989],
            [-72.018, 41.003],
            [-71.994, 41.026],
            [-72.019, 41.045],
            [-72.076, 41.047],
            [-72.114, 41.031],
            [-72.128, 41.008],
            [-72.115, 40.990]
          ]]
        }
      },
      {
        name: "Shinnecock Bay interior shallows",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-72.555, 40.820],
            [-72.502, 40.808],
            [-72.420, 40.815],
            [-72.365, 40.840],
            [-72.382, 40.872],
            [-72.463, 40.878],
            [-72.545, 40.858],
            [-72.568, 40.838],
            [-72.555, 40.820]
          ]]
        }
      },
      {
        name: "Moriches and Quantuck Bay interior shallows",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-72.920, 40.748],
            [-72.810, 40.745],
            [-72.670, 40.760],
            [-72.548, 40.786],
            [-72.520, 40.812],
            [-72.552, 40.834],
            [-72.690, 40.820],
            [-72.832, 40.802],
            [-72.933, 40.782],
            [-72.920, 40.748]
          ]]
        }
      }
    ];
    const BIOGRAPHY_CANOE_NARROW_LAND_AREAS = [
      {
        name: "Ponquogue and Shinnecock Bay narrow land",
        geometry: {
          type: "MultiPolygon",
          coordinates: [
            [[
              [-72.505, 40.864],
              [-72.479, 40.868],
              [-72.448, 40.866],
              [-72.419, 40.858],
              [-72.404, 40.846],
              [-72.403, 40.826],
              [-72.414, 40.816],
              [-72.429, 40.817],
              [-72.437, 40.832],
              [-72.455, 40.836],
              [-72.481, 40.844],
              [-72.505, 40.864]
            ]],
            [[
              [-72.565, 40.858],
              [-72.548, 40.864],
              [-72.522, 40.858],
              [-72.506, 40.845],
              [-72.494, 40.824],
              [-72.504, 40.815],
              [-72.522, 40.824],
              [-72.541, 40.842],
              [-72.565, 40.858]
            ]],
            [[
              [-72.602, 40.843],
              [-72.582, 40.846],
              [-72.560, 40.836],
              [-72.545, 40.819],
              [-72.553, 40.810],
              [-72.574, 40.818],
              [-72.594, 40.833],
              [-72.602, 40.843]
            ]],
            [[
              [-72.700, 40.786],
              [-72.664, 40.789],
              [-72.625, 40.799],
              [-72.589, 40.811],
              [-72.535, 40.829],
              [-72.532, 40.824],
              [-72.587, 40.803],
              [-72.627, 40.791],
              [-72.664, 40.782],
              [-72.700, 40.780],
              [-72.700, 40.786]
            ]]
          ]
        }
      }
    ];
    const BIOGRAPHY_PERSON_ROUTE_DURATION_MS = 300000;
    const BIOGRAPHY_PERSON_REFERENCE_ROUTE_DISTANCE = 0.35;
    const BIOGRAPHY_PERSON_ANIMATION_INTERVAL_MS = 140;
    const BIOGRAPHY_PERSON_FOLLOW_ANIMATION_INTERVAL_MS = 16;
    const BIOGRAPHY_PERSON_FOLLOW_INTERVAL_MS = 16;
    const BIOGRAPHY_CANOE_LAND_SAMPLE_RADIUS_DEG = 0.00022;
    const BIOGRAPHY_PERSON_PROGRESSIVE_LOAD_DELAY_MS = 120;
    const BIOGRAPHY_PERSON_FOLLOW_CENTER_EPSILON_PX = 0.75;
    const BIOGRAPHY_PERSON_LABEL_MIN_ZOOM = 13.35;
    const BIOGRAPHY_PERSON_MIN_STOP_MS = 1000;
    const BIOGRAPHY_PERSON_MAX_STOP_MS = 5000;
    const BIOGRAPHY_PERSON_FINAL_STOP_MS = 5000;
    const BIOGRAPHY_PERSON_FADE_MS = 900;
    const BIOGRAPHY_PERSON_PHOTO_FLASH_MS = 650;
    const BIOGRAPHY_PERSON_QUOTE_VISIBLE_MIN_MS = 22000;
    const BIOGRAPHY_PERSON_QUOTE_VISIBLE_MAX_MS = 34000;
    const BIOGRAPHY_PERSON_QUOTE_TYPE_MS_PER_CHAR = 92;
    const BIOGRAPHY_PERSON_QUOTE_ENCOUNTER_RADIUS_PX = 100;
    const BIOGRAPHY_PERSON_QUOTE_ENCOUNTER_COOLDOWN_MS = 5000;
    const BIOGRAPHY_PERSON_QUOTE_ENCOUNTER_TURN_GAP_MS = 1600;
    const BIOGRAPHY_PERSON_QUOTE_MAX_ACTIVE = 4;
    const BIOGRAPHY_PERSON_QUOTE_AUTO_WINDOW_MS = 60000;
    const BIOGRAPHY_PERSON_QUOTE_AUTO_MIN_DELAY_MS = 4500;
    const BIOGRAPHY_PERSON_QUOTE_AUTO_STAGGER_MS = 3500;
    const BIOGRAPHY_PERSON_QUOTE_AUTO_RETRY_MS = 5000;
    const JEREMY_BIOGRAPHY_ROUTE_BATCH_SIZE = 36;
    const JEREMY_BIOGRAPHY_ROUTE_BATCH_MS = 2 * 60 * 60 * 1000;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("admin") === "0") window.localStorage.removeItem("nli-admin-mode");
    if (urlParams.get("admin") === "1") window.localStorage.setItem("nli-admin-mode", "1");
    if (localStorage.getItem("nli-activity-layout-version") !== "4") {
      localStorage.removeItem("nli-latest-activity-collapsed");
      localStorage.setItem("nli-activity-layout-version", "4");
    }
    const adminMode = urlParams.get("admin") === "1";
    document.body.classList.toggle("admin-mode", adminMode);
    const DEFAULT_MAPBOX_BASEMAPS = {
      satellite: "mapbox://styles/mapbox/satellite-streets-v12",
      road: "mapbox://styles/mapbox/streets-v12",
      outdoors: "mapbox://styles/mapbox/outdoors-v12",
      blank: {
        version: 8,
        glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
        sources: {},
        layers: [{
          id: "blank-background",
          type: "background",
          paint: { "background-color": "#f6f8f3" }
        }]
      }
    };
    const DEFAULT_LEAFLET_BASEMAPS = {
      satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        options: {
          maxZoom: 19,
          attribution: "Tiles © Esri"
        }
      },
      road: {
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        options: {
          maxZoom: 19,
          attribution: "© OpenStreetMap"
        }
      },
      outdoors: {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        options: {
          maxZoom: 17,
          attribution: "Map data © OpenStreetMap, SRTM | Map style © OpenTopoMap"
        }
      },
      blank: null
    };
    const DEFAULT_LEAFLET_VIEW = {
      center: [40.84, -72.78],
      zoom: 9.7,
      minZoom: 7.35,
      maxZoom: 18,
      maxBounds: [[35, -85], [48, -60]],
      maxBoundsViscosity: 0.3
    };
    const LONG_ISLAND_START_VIEWS = [
      { center: [40.72, -73.72], zoom: 11.2 },
      { center: [40.76, -73.36], zoom: 11.2 },
      { center: [40.82, -73.02], zoom: 11.18 },
      { center: [40.84, -72.68], zoom: 11.16 },
      { center: [40.88, -72.34], zoom: 11.14 },
      { center: [40.93, -72.02], zoom: 11.12 },
      { center: [41.02, -71.82], zoom: 11.1 }
    ];
    const BASEMAPS = SHARED_MAP_CONFIG.mapboxBasemaps || DEFAULT_MAPBOX_BASEMAPS;
    const USE_LEAFLET_PRIMARY = SHARED_MAP_CONFIG.useLeafletPrimary !== false;
    const MAPBOX_GL_SCRIPT_URL = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";
    const MAPBOX_GL_STYLESHEET_URL = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";
    let mapboxRuntimePromise = null;
    const LEAFLET_BASEMAPS = SHARED_MAP_CONFIG.leafletBasemaps || DEFAULT_LEAFLET_BASEMAPS;
    const LEAFLET_VIEW = { ...DEFAULT_LEAFLET_VIEW, ...(SHARED_MAP_CONFIG.leafletView || {}) };
    const SITE_LABEL_MIN_ZOOM = 10.75;
    const SITE_POINT_LABEL_MIN_ZOOM = 13.35;
    const PLACE_NAME_AREA_LABEL_MIN_ZOOM = 10.25;
    const LEAFLET_VIEWPORT_POINT_LIMIT = 500;
    const TERRITORY_LABEL_MIN_ZOOM = 0;
    const LEAFLET_DETAIL_LABEL_MIN_ZOOM = 10.75;
    const LEAFLET_MANAGED_LABEL_MIN_ZOOM = 11.15;
    const RESTORE_CONTAINED_LAND_PIECES_ON_RENDER = false;
    const FALLBACK_STYLE = BASEMAPS.road;
    const ANCESTRAL_LAND_MASK_ASSIGNMENTS = [
      {
        title: /montaukett ancestral land/,
        label: "Gardiner's Island",
        match: ([lng, lat]) => lng > -72.18 && lng < -72.05 && lat > 41.03 && lat < 41.14
      },
      {
        title: /corchaug ancestral land/,
        label: "Plum Island",
        match: ([lng, lat]) => lng > -72.23 && lng < -72.15 && lat > 41.15 && lat < 41.20
      },
      {
        title: /manhansett ancestral land/,
        label: "Robins Island",
        match: ([lng, lat]) => lng > -72.49 && lng < -72.43 && lat > 40.94 && lat < 40.995
      },
      {
        title: /massapequa ancestral lands/,
        label: "Jones Beach barrier island",
        match: ([lng, lat]) => lng > -73.58 && lng < -73.25 && lat > 40.57 && lat < 40.65
      },
      {
        title: /secatogue ancestral land/,
        label: "Captree / Oak Beach barrier island",
        match: ([lng, lat]) => lng > -73.32 && lng < -73.26 && lat > 40.62 && lat < 40.66
      },
      {
        title: /unkechaug ancestral land/,
        label: "Fire Island barrier island",
        match: ([lng, lat]) => lng > -73.32 && lng < -72.75 && lat > 40.62 && lat < 40.77
      },
      {
        title: /shinnecock ancestral land/,
        label: "Moriches / Westhampton barrier island",
        match: ([lng, lat]) => lng > -72.75 && lng < -72.70 && lat > 40.76 && lat < 40.80
      }
    ];
    const STYLE_MARKER_LAYER_ID = "native-long-island-wp-go-maps-dcejvz";
    const STYLE_POLYGON_LAYER_ID = "native-long-island-wp-go-maps-28zbd8";
    const ARCHIVE_LAYER_IDS = [
      "biography-place-points",
      "biography-place-labels",
      "biography-place-path",
      "biography-place-path-casing",
      "biography-people-quotes",
      "biography-people-labels",
      "biography-photo-flash",
      "biography-people-canoes",
      "biography-people",
      "biography-path-labels",
      "biography-path-point-numbers",
      "biography-path-points",
      "biography-path-lines",
      "biography-path-line-casing",
      "hover-feature-line",
      "hover-feature-fill",
      "site-attention-pulse-core",
      "site-attention-pulse-outer",
      "site-attention-history-icon",
      "site-attention-history-badge",
      "map-story-labels",
      "map-stories",
      "calendar-event-icons",
      "calendar-event-points",
      "calendar-event-polygons",
      "directus-site-icons",
      "directus-site-point-labels",
      "directus-site-points",
      "directus-site-labels",
      "directus-site-territory-labels",
      "directus-site-polygons",
      "directus-site-territories",
      "wp-marker-labels",
      "wp-markers-original-icon",
      "wp-markers-original-dot",
      "place-name-area-label",
      "place-name-area-line",
      "place-name-area-fill",
      "wp-polygons-detail-label",
      "wp-polygons-territory-label",
      "long-island-emphasis",
      "wp-polygons-detail-fill",
      "gardiners-montaukett-territory-fill",
      "long-island-water-mask",
      "wp-polygons-original-line",
      "wp-polygons-original-fill"
    ];
    const ARCHIVE_SOURCE_IDS = [
      "biography-place-path",
      "biography-people",
      "biography-place-paths",
      "hover-feature",
      "site-attention-points",
      "map-stories",
      "calendar-event-icons",
      "calendar-events",
      "directus-site-icons",
      "directus-site-labels",
      "directus-site-territory-labels",
      "directus-site-geometries",
      "wp-markers-icons",
      "wp-markers-original",
      "place-name-area-labels",
      "place-name-areas",
      "wp-polygons-detail-labels",
      "wp-polygons-territory-labels",
      "long-island-emphasis",
      "gardiners-montaukett-territory",
      "long-island-water-mask",
      "wp-polygons-original"
    ];
    const LONG_ISLAND_BOUNDS = [[-75.15, 39.75], [-70.65, 42.05]];
    const LONG_ISLAND_VIEW_BOUNDS = [[-74.35, 40.32], [-71.48, 41.36]];
    const SITE_CHECKIN_RADIUS_MILES = 0.25;
    const LAND_MASK_URL = `long-island-land-ma${"sk"}-lite.geojson`;
    const LAND_MASK_VERSION = "2026-06-24-lite-runtime-mask";
    const ATTENTION_SITE_WINDOWS = [
      {
        slug: "shinnecock-hills-golf-club",
        until: "2026-06-21",
        reason: "Site of attention and urgency"
      }
    ];
    const DATE_LABEL_MONTHS = {
      january: "01",
      february: "02",
      march: "03",
      april: "04",
      may: "05",
      june: "06",
      july: "07",
      august: "08",
      september: "09",
      october: "10",
      november: "11",
      december: "12"
    };
    const KNOWLEDGEBASE_CATEGORIES = [
      { label: "Biography", slugs: ["mocomanto-shinnecock-sachem-1640", "sagamore-raseokan-ratiocanof-matinnicoke-matinecock", "chief-harry-wallace-of-the-unkechaug", "worison-unkechaug-whaler", "sunksqua-weany-pametsechs", "wuchikittawbut", "quashawam", "elizabeth-thunder-bird-haile-shinnecock", "betty-lewis-cromwell-shinnecock", "sachem-aquash-of-the-montaukett", "jeremiah-pharoah-montaukett-whaler", "sylvester-pharoah", "mary-rebecca-bunn-aunt-becky", "sachem-warawakmy-of-the-setauket", "chief-mahue-mayhew-of-unkechaug", "peter-john-cuffee", "lois-princess-nowedonah-hunter", "mandush-17th-century-sachem-of-shinnecock", "ninigret-eastern-niantic-sachem", "poggatacut-sachem-of-the-manhassets-of-shelter-island", "momoweta", "paucamp", "wobetom", "william-wallace-tooker", "john-a-strong", "nathan-jeffrey-cuffee", "samson-occom", "wyandanch", "cockenoe", "rev-paul-cuffee", "sachem-tackapousha", "mangwobe-sachem-of-rockaway", "adam-achitteronose", "penhawitz-sachem-of-the-canarsie", "stephen-talkhouse-pharoah", "nasseconset-sachem-of-the-nissequogue", "keeossechok-sachem-of-the-secatogue", "sunksquaws-and-indigenous-womens-leadership", JEREMY_BIOGRAPHY_SLUG] },
      { label: "Tribal Nations and Communities", entries: [["wiki", "native-long-island-overview"], ["wiki", "continued-indigenous-presence-today"], ["wiki", "the-tribes-of-long-island"], ["wiki", "western-long-island-native-communities"], ["wiki", "central-long-island-native-communities"], ["wiki", "eastern-long-island-native-communities"], ["wiki", "myth-of-the-thirteen-tribes"], ["site", "montaukett"], ["site", "shinnecock-indian-reservation"], ["site", "unkechaug-indian-reservation"], ["site", "corchaug-tribe"], ["site", "manhansack-aqua-quash-awamock"], ["site", "setauket-ancestral-land"], ["site", "nissaquogue"], ["site", "matinecock"], ["site", "secatogues"], ["site", "massapequas"], ["site", "merricks"], ["site", "rockaways"], ["site", "canarsie"]] },
      { label: "History", slugs: ["native-long-island-overview", "slavery", "indian-missions-on-long-island", "colonial-descriptions-of-indians", "indian-forts", "13-tribes-of-long-island-david-martine", "early-contact-period-1600-ad-1700-ad", "post-contact", "creation-of-long-island", "land-deeds-and-dispossession", "myth-of-extinction-and-survivance", "myth-of-the-thirteen-tribes", "historic-preservation", "history-and-place-names", "merrick-people-in-early-land-records"] },
      { label: "Sovereignty and Governance", slugs: ["tribal-trustees", "sovereignty-recognition-and-detribalization", "land-deeds-and-dispossession", "continued-indigenous-presence-today"] },
      { label: "Culture, Ceremony, and Lifeways", slugs: ["sweat-lodge", "nunnowa", "wampum", "burial", "powwow", "spirituality-ceremony-cosmology", "language", "algonquian-language-and-place-names", "dog-ceremonialism", "spring", "summer", "fall", "winter", "food", "fishing", "whaling", "indigenous-whaling-and-maritime-labor", "ecology-and-flexible-sedentism"] },
      { label: "Time Periods and Archaeology", slugs: ["paleo-indian-period", "archaic-period", "orient-transitional-period", "woodland-period", "late-woodland", "early-contact-period-1600-ad-1700-ad", "post-contact", "shell-midden", "killed-pottery", "arrow-heads", "phase-archaeology-investigation", "phase-ii-archaeology-investigation", "phase-iii-archaeological-investigation", "burial-protection-and-sacred-landscapes"] },
      { label: "Preservation and Site Protection", slugs: ["preservation", "burial-protection-and-sacred-landscapes", "vandalism", "phase-archaeology-investigation", "phase-ii-archaeology-investigation", "phase-iii-archaeological-investigation"] },
      { label: "Natural Resources", slugs: ["native-plants", "beach-plum", "spring", "summer", "fall", "winter", "food", "fishing", "whaling", "indigenous-whaling-and-maritime-labor", "shell-midden", "ecology-and-flexible-sedentism"] },
      { label: "Maps and Reference", slugs: ["13-tribes-of-long-island-david-martine", "history-and-place-names", "algonquian-language-and-place-names", "western-long-island-native-communities", "central-long-island-native-communities", "eastern-long-island-native-communities"] }
    ];
    const BIOGRAPHY_WIKI_SLUGS = new Set((KNOWLEDGEBASE_CATEGORIES.find(category => category.label === "Biography")?.slugs || []));
    BIOGRAPHY_WIKI_SLUGS.add(JEREMY_BIOGRAPHY_SLUG);
    const BIOGRAPHY_PERSON_HOVER_INTROS = {
      "adam-achitteronose": "Adam, also identified as Achitteronose, was a western Long Island and Massapequa-associated bilingual envoy in seventeenth-century diplomacy.",
      "betty-lewis-cromwell-shinnecock": "Betty Lewis Cromwell was a Shinnecock community member documented in a 1997 Shinnecock Nation Cultural Center and Museum fundraiser photograph.",
      "chief-mahue-mayhew-of-unkechaug": "Mahue, also written Mahew, Mayhew, or John Mahue, was an Unkechaug and Setauket-connected proprietor, headman, and negotiator in seventeenth-century records.",
      "chief-harry-wallace-of-the-unkechaug": "Chief Harry Wallace is an Unkechaug leader, attorney, and advocate for sovereignty, language, community renewal, and Poospatuck Reservation life.",
      "elizabeth-thunder-bird-haile-shinnecock": "Elizabeth Thunder Bird Haile, also known as Chee Chee, is documented as a Shinnecock storyteller, museum leader, Tribal Council member, and oral-history contributor.",
      "john-a-strong": "John A. Strong is a historian and ethnohistorian whose scholarship has shaped modern public understanding of Native Long Island history, land, labor, sovereignty, and survivance.",
      "jeremiah-pharoah-montaukett-whaler": "Jeremiah Pharoah was a Montaukett deep-sea whaler whose life connected Indian Fields, Nantucket, Sag Harbor, Samson Occom's book history, and household material culture.",
      "keeossechok-sachem-of-the-secatogue": "Keeossechok was a Secatogue sachem named in the June 1, 1657 Five Necks deed for South Shore meadow lands.",
      "mandush-17th-century-sachem-of-shinnecock": "Mandush was a Shinnecock sachem named in the 1640 Southampton deed and later testimony about Shinnecock, Montaukett, and Wyandanch-related political relationships.",
      "mangwobe-sachem-of-rockaway": "Mangwobe was a mid-seventeenth-century Rockaway sachem named in the July 4, 1657 Hempstead boundary conference.",
      "mary-rebecca-bunn-aunt-becky": "Mary Rebecca Bunn, known as Aunt Becky, was a Shinnecock teacher and elder connected with reservation education, family history, and Shinnecock community memory.",
      "mocomanto-shinnecock-sachem-1640": "Mocomanto was a mid-seventeenth-century Shinnecock leader named among the Native signers of the December 13, 1640 Southampton deed.",
      "momoweta": "Momoweta was a Corchaug sachem whose name appears in mid-seventeenth-century diplomacy and North Fork land records.",
      "nasseconset-sachem-of-the-nissequogue": "Nasseconset, also written Nassaconsett or Nasseconseke, was a Nissequogue sachem named in Smithtown and Nissequogue River land records.",
      "nathan-jeffrey-cuffee": "Nathan Jeffrey Cuffee was a Montaukett author and tribal-rights advocate associated with the Eastville community in Sag Harbor.",
      "ninigret-eastern-niantic-sachem": "Ninigret was an Eastern Niantic sachem from across Long Island Sound whose diplomacy and warfare affected Montaukett and other Long Island Native communities.",
      "paucamp": "Paucamp, also recorded as Paueumpt, was a Corchaug elder whose testimony preserved Indigenous boundary and place knowledge around Occabauk, Aquebogue, and Peconic Bay.",
      "penhawitz-sachem-of-the-canarsie": "Penhawitz, also written Penhawis, was a seventeenth-century Indigenous leader associated with the Keshaechquereren and Canarsie world of western Long Island.",
      "poggatacut-sachem-of-the-manhassets-of-shelter-island": "Poggatacut was a Manhanset sachem associated with Shelter Island in the early contact period.",
      "rev-paul-cuffee": "Rev. Paul Cuffee (1757-1812) was a Native Congregational minister whose life connected Shinnecock, Unkechaug, Montaukett, and other Long Island Native Christian communities.",
      "sachem-aquash-of-the-montaukett": "Aquash, also written Aquaas or Aquosh, was a late seventeenth-century Montaukett sachem named in East Hampton and Montaukett land records.",
      "sachem-tackapousha": "Tackapousha, also written Tackapausha or Takaposha in some records, was a seventeenth-century Massapequa leader whose diplomacy connected Native and colonial records across western Long Island.",
      "sachem-warawakmy-of-the-setauket": "Warawakmy was a mid-seventeenth-century Setauket sachem named in the April 14, 1655 Setauket land deed.",
      "samson-occom": "Samson Occom, also written Sampson Occum or Samson Occam, was a Mohegan minister, teacher, writer, and Native political leader whose life connected Mohegan, Montaukett, Shinnecock, and Brothertown histories.",
      "sagamore-raseokan-ratiocanof-matinnicoke-matinecock": "Raseokan, also recorded as Ratiocan, Resorokon, and Asharoken, was a seventeenth-century Matinecock sagamore associated with North Shore land negotiations.",
      "stephen-talkhouse-pharoah": "Stephen Talkhouse Pharoah, also remembered as Stephen Talkhouse, was a nineteenth-century Montaukett man connected with Molly's Hill, Montaukett homelands, whaling, Civil War service, walking routes, and community memory.",
      "sunksqua-weany-pametsechs": "Weany was a Shinnecock sunksquaw whose leadership appears in the April 1662 Quogue purchase record.",
      "wobetom": "Wobetom, also recorded as Awabeton, Wahpetum, Awaupetun, Webbeton, or Woboton, was a seventeenth-century Montaukett leader, cattle keeper, and whaler.",
      "wuchikittawbut": "Wuchikittawbut, also written Wicchitaubit, was a mid-seventeenth-century Montaukett sunksquaw, widow of Wyandanch, and mother of Wyancombone.",
      "wyandanch": "Wyandanch was a seventeenth-century Montaukett sachem whose leadership appears across Long Island records of diplomacy, warfare, land negotiations, and alliance politics.",
      "jeremy-dennis": "Jeremy Dennis is the Creator of On This Site and a Shinnecock Tribal Member. He is a contemporary fine art photographer and founder of the On This Site project documenting Native Long Island through mapped places, photography, research, and community storytelling."
    };
    const BIOGRAPHY_PERSON_QUOTES = {
      "jeremy-dennis": {
        text: "Invisibility is an intentional tool� our rights are devalued.",
        date: "April 18, 2026 panel; published April 29, 2026",
        source: "East End Beacon, April 29, 2026",
        url: "https://www.eastendbeacon.com/regeneration-art-as-an-ecological-force/"
      },
      "lois-princess-nowedonah-hunter": {
        text: "I don�t want [Manhattan] back after they�ve messed it up. I want the rent they owe us.",
        date: "Recalled from the 1970s",
        source: "Company One Theatre program, 2025",
        url: "https://companyone.org/wp-content/uploads/2025/02/S26_HNT_Program_Web2.pdf"
      },
      "jeremiah-pharoah-montaukett-whaler": {
        text: "I Jeremiah Pharaoh the Bold mariner I sailed the world all over nine long years.",
        date: "Recorded from his 1798 return to Montauk",
        source: "Sag Harbor Express, July 31, 1924, as cited by McGovern"
      },
      "chief-harry-wallace-of-the-unkechaug": {
        text: "We are strongly committed to preserving our sovereignty and to protecting our rights as an Indian nation and our traditions.",
        date: "1994",
        source: "John A. Strong, The Unkechaug Indians of Eastern Long Island"
      },
      "john-a-strong": {
        text: "The more serious issue here is... the assertion that there are no real tribes or Indians left on Long Island.",
        date: "1997",
        source: "John A. Strong, The Algonquian Peoples of Long Island From Earliest Times to 1700"
      },
      "wyandanch": { text: "Aquay. Wyandanch nutusuwis.\n(Hello. Wyandanch is my name)" },
      "quashawam": { text: "Aquay. Quashawam nutusuwis.\n(Hello. Quashawam is my name)" },
      "adam-achitteronose": { text: "Aquay. Adam nutusuwis.\n(Hello. Adam is my name)" },
      "penhawitz-sachem-of-the-canarsie": { text: "Aquay. Penhawitz nutusuwis.\n(Hello. Penhawitz is my name)" },
      "momoweta": { text: "Aquay. Momoweta nutusuwis.\n(Hello. Momoweta is my name)" },
      "poggatacut-sachem-of-the-manhassets-of-shelter-island": { text: "Aquay. Poggatacut nutusuwis.\n(Hello. Poggatacut is my name)" },
      "sachem-tackapousha": { text: "Aquay. Tackapousha nutusuwis.\n(Hello. Tackapousha is my name)" },
      "sagamore-raseokan-ratiocanof-matinnicoke-matinecock": { text: "Aquay. Raseokan nutusuwis.\n(Hello. Raseokan is my name)" },
      "mangwobe-sachem-of-rockaway": { text: "Aquay. Mangwobe nutusuwis.\n(Hello. Mangwobe is my name)" },
      "sachem-warawakmy-of-the-setauket": { text: "Aquay. Warawakmy nutusuwis.\n(Hello. Warawakmy is my name)" },
      "nasseconset-sachem-of-the-nissequogue": { text: "Aquay. Nasseconset nutusuwis.\n(Hello. Nasseconset is my name)" },
      "keeossechok-sachem-of-the-secatogue": { text: "Aquay. Keeossechok nutusuwis.\n(Hello. Keeossechok is my name)" },
      "mocomanto-shinnecock-sachem-1640": { text: "Aquay. Mocomanto nutusuwis.\n(Hello. Mocomanto is my name)" },
      "mandush-17th-century-sachem-of-shinnecock": { text: "Aquay. Mandush nutusuwis.\n(Hello. Mandush is my name)" },
      "sunksqua-weany-pametsechs": { text: "Aquay. Weany nutusuwis.\n(Hello. Weany is my name)" },
      "chief-mahue-mayhew-of-unkechaug": { text: "Aquay. Mahue nutusuwis.\n(Hello. Mahue is my name)" },
      "rev-paul-cuffee": { text: "Aquay. Paul nutusuwis.\n(Hello. Paul is my name)" },
      "sachem-aquash-of-the-montaukett": { text: "Aquay. Aquash nutusuwis.\n(Hello. Aquash is my name)" },
      "samson-occom": { text: "Aquay. Samson nutusuwis.\n(Hello. Samson is my name)" },
      "stephen-talkhouse-pharoah": { text: "Aquay. Stephen nutusuwis.\n(Hello. Stephen is my name)" },
      "wuchikittawbut": { text: "Aquay. Wuchikittawbut nutusuwis.\n(Hello. Wuchikittawbut is my name)" },
      "wobetom": { text: "Aquay. Wobetom nutusuwis.\n(Hello. Wobetom is my name)" },
      "ninigret-eastern-niantic-sachem": { text: "Aquay. Ninigret nutusuwis.\n(Hello. Ninigret is my name)" },
      "paucamp": { text: "Aquay. Paucamp nutusuwis.\n(Hello. Paucamp is my name)" }
    };
    const BIOGRAPHY_PLACE_PATHS = {
      "jeremy-dennis": {
        title: "Jeremy Dennis visiting On This Site map entries",
        mapLabel: "Jeremy Dennis",
        routeSource: "all-sites",
        hidePath: true,
        startAtRouteStart: true,
        photoStops: true,
        randomFinalStop: true,
        stopMinMs: 1000,
        stopMaxMs: 10000,
        places: [
          {
            label: "Ma's House",
            place: "159 Old Point Road, Southampton, NY 11969",
            coordinates: [-72.42747682588364, 40.867202882578056],
            reason: "Starting point for the Creator of On This Site and Shinnecock Tribal Member biography marker."
          }
        ]
      },
      "wyandanch": {
        title: "Wyandanch associated places",
        mapLabel: "Sachem Wyandanch",
        note: "This path shows associated places from the story, not a precise travel route.",
        places: [
          {
            label: "Montaukett homeland",
            place: "Montauk, East Hampton",
            coordinates: [-71.944, 41.036],
            reason: "Wyandanch is remembered as a Montaukett sachem."
          },
          {
            label: "Fort Saybrook",
            place: "Old Saybrook, Connecticut",
            coordinates: [-72.351, 41.284],
            reason: "Wyandanch negotiated an English alliance at Fort Saybrook after the Pequot War."
          },
          {
            label: "Pequot War region",
            place: "Mystic River area, Connecticut",
            coordinates: [-71.966, 41.355],
            reason: "His diplomacy is connected with the 1637 Pequot War and its aftermath."
          },
          {
            label: "Shinnecock diplomacy",
            place: "Southampton / Shinnecock area",
            coordinates: [-72.436, 40.884],
            reason: "Wyandanch is linked to 1649 negotiations involving Mandush of Shinnecock."
          }
        ]
      },
      "quashawam": {
        title: "Quashawam associated places",
        note: "This path shows associated places from the records and historic moments, not a precise travel route.",
        places: [
          {
            label: "1653 - Niantic raid and ransom",
            place: "Montaukett homeland, Montauk / East Hampton",
            coordinates: [-71.944, 41.036],
            reason: "Quashawam was captured during a Niantic raid on the Montaukett and later ransomed with English assistance."
          },
          {
            label: "1663/64 - Shinnecock agreement",
            place: "Southampton / Shinnecock and Montaukett record context",
            coordinates: [-72.436, 40.884],
            reason: "Southampton records recognized Quashawam in an agreement involving Montaukett and Shinnecock authority and succession."
          },
          {
            label: "1663/64 - Jamaica deed",
            place: "Jamaica, Queens",
            coordinates: [-73.795, 40.702],
            reason: "A Jamaica land transaction handled by John Scott included a payment to Quashawam."
          },
          {
            label: "1665 - Southold court",
            place: "Southold",
            coordinates: [-72.427, 41.064],
            reason: "A court at Southold upheld an annual payment owed to the Montauk sunksquaw."
          },
          {
            label: "1665 - Court of Assizes",
            place: "New York colonial court / Long Island agreement",
            coordinates: [-74.006, 40.705],
            reason: "Governor Nicolls and Long Island leaders addressed the colonial superior-sachem title and Montaukett land issues."
          },
          {
            label: "1665-1666 - Three Mile Harbor",
            place: "Three Mile Harbor, East Hampton",
            coordinates: [-72.188, 41.018],
            reason: "Strong and Karabag place Quashawam and her Pequot husband in a Native village near Three Mile Harbor when Richard Smith sought her testimony."
          }
        ]
      },
      "elizabeth-thunder-bird-haile-shinnecock": {
        title: "Elizabeth Thunder Bird Haile life timeline and places",
        mapLabel: "Elizabeth Haile",
        note: "Numbered entries use broad locations from the cited sources. Current sources do not provide a precise birth location, death date, or detailed off-Island travel route.",
        places: [
          {
            label: "c. 1930 - Shinnecock roots",
            place: "Shinnecock Indian Nation Reservation / Shinnecock waters",
            coordinates: [-72.408, 40.875],
            reason: "Shoemaker met Elizabeth Thunder Bird Haile at her Shinnecock home in July 2011 shortly after her eighty-first birthday; sources also identify her as Elizabeth Bess (Haile).",
            event_id: 1425
          },
          {
            label: "1974 - Chief Thunder Bird and Chee Chee",
            place: "Shinnecock Indian Nation Reservation",
            coordinates: [-72.432, 40.884],
            reason: "Strong captions a 1974 photograph of Chief Thunder Bird, Henry Bess, with his daughter Chee Chee.",
            event_id: 1426
          },
          {
            label: "1990 - Shinnecock museum board",
            place: "Shinnecock Nation Cultural Center and Museum",
            coordinates: [-72.414, 40.887],
            reason: "A 1994 account names Chee Chee (Elizabeth Haile) among directors helping plan the Shinnecock Nation Cultural Center and Museum.",
            event_id: 1427
          },
          {
            label: "Early 1990s - Storytelling programs",
            place: "Shinnecock Nation Cultural Center and Museum / reservation nature trail",
            coordinates: [-72.414, 40.887],
            reason: "Museum education programs included storytelling sessions presented by Shinnecock storyteller Elizabeth Haile.",
            event_id: 1428
          },
          {
            label: "1997 - Cultural-center fundraiser",
            place: "Southampton / Shinnecock museum fundraiser context",
            coordinates: [-72.414, 40.887],
            reason: "Strong documents Elizabeth Haile in a December 6, 1997 Shinnecock Nation Cultural Center and Museum fundraiser photograph.",
            event_id: 1429
          },
          {
            label: "1998 - Shinnecock land rights",
            place: "Shinnecock Hills / Southampton land-rights context",
            coordinates: [-72.441, 40.89],
            reason: "As a Shinnecock Tribal Council member, Haile spoke publicly about recognition of Shinnecock original ownership before the 1859 dispossession.",
            event_id: 1430
          },
          {
            label: "2011 - Oral history",
            place: "Elizabeth Thunder Bird Haile home, Shinnecock Indian Nation Reservation",
            coordinates: [-72.408, 40.875],
            reason: "Haile contributed oral history to Nancy Shoemaker at her home; Shoemaker also recorded her daughter Holly Haile Davis.",
            event_id: 1431
          }
        ]
      },
      "wobetom": {
        title: "Wobetom associated places",
        note: "Broad places connected with Wobetom in East Hampton, Montauk, and shore-whaling records. Cemetery and burial contexts are not pinned.",
        places: [
          { label: "1657 - East Hampton deed record", place: "East Hampton", coordinates: [-72.185, 40.963], reason: "Wobetom, marked with an X, appears among the signatures to a 1657 deed conveying Montaukett lands to East Hampton trustees." },
          { label: "1670 - cattle keeping beyond Fort Pond", place: "Fort Pond / Montauk", coordinates: [-71.947, 41.0448], reason: "East Hampton settlers hired Wobetom to keep cattle beyond Fort Pond at Montauk." },
          { label: "1675 - shore-whaling agreement", place: "East Hampton shore-whaling records", coordinates: [-72.185, 40.963], reason: "Wobetom appears as Awaupetun / Wahpetum in a 1675 agreement to hunt whales for Thomas James's company." }
        ]
      },
      "ninigret-eastern-niantic-sachem": {
        title: "Ninigret associated places",
        note: "Broad places tied to Ninigret's documented impact on Montaukett history. This is not a precise travel route.",
        places: [
          { label: "1653 - attack on the Montaukett", place: "Montauk", coordinates: [-71.944, 41.036], reason: "Ninigret led a 1653 attack on the Montaukett in which two sachems were killed and several women, including Quashawam, were taken captive." },
          { label: "1669 - Rhode Island court testimony", place: "Rhode Island court record", coordinates: [-71.31, 41.49], reason: "Ninigret told a Rhode Island court that Wyandanch's daughter was no longer alive." }
        ]
      },
      "paucamp": {
        title: "Paucamp associated places",
        note: "Broad North Fork places connected with Paucamp's recorded boundary knowledge.",
        places: [
          { label: "1648 - western Peconic Bay land context", place: "Western Peconic Bay / Occabauk", coordinates: [-72.60, 40.94], reason: "North Fork deed research identifies Paueumpt as a Corchaug elder and owner of land near the western end of Peconic Bay." },
          { label: "1660 - Occabauk boundary testimony", place: "Occabauk / Aquebogue", coordinates: [-72.627, 40.943], reason: "Around age eighty, Paucamp testified about the traditional boundaries of Occabauk / Aquebogue and surrounding North Fork lands." }
        ]
      },
      "lois-princess-nowedonah-hunter": {
        title: "Lois Hunter associated places",
        mapLabel: "Princess Nowedonah (Lois Hunter)",
        note: "This path follows places and institutions connected with this life story; not a precise private route.",
        startAtRouteStart: true,
        routePlaces: [
          { coordinates: [-72.432, 40.884] },
          { coordinates: [-72.662, 40.918] },
          { coordinates: [-73.223, 40.817] },
          { coordinates: [-73.415, 40.793] },
          { coordinates: [-73.836, 40.747] },
          { coordinates: [-73.963, 40.755], skipFromPrevious: true },
          { coordinates: [-74.009, 40.758] },
          { coordinates: [-74.044, 40.744], skipFromPrevious: true },
          { coordinates: [-74.172, 40.735] },
          { coordinates: [-74.451, 40.486] },
          { coordinates: [-74.742, 40.217] },
          { coordinates: [-75.165, 39.952] },
          { coordinates: [-75.528, 39.934] },
          { coordinates: [-75.165, 39.952] },
          { coordinates: [-74.742, 40.217] },
          { coordinates: [-74.451, 40.486] },
          { coordinates: [-74.172, 40.735] },
          { coordinates: [-74.044, 40.744] },
          { coordinates: [-74.009, 40.758], skipFromPrevious: true },
          { coordinates: [-73.963, 40.755] },
          { coordinates: [-73.836, 40.747], skipFromPrevious: true },
          { coordinates: [-73.415, 40.793] },
          { coordinates: [-73.223, 40.817] },
          { coordinates: [-72.426, 40.882] },
          { coordinates: [-72.418, 40.883] },
          { coordinates: [-73.223, 40.817] },
          { coordinates: [-72.438, 40.886] }
        ],
        places: [
          {
            label: "1903 - Shinnecock homeland",
            place: "Shinnecock Indian Reservation, Southampton",
            coordinates: [-72.432, 40.884],
            reason: "Lois Marie Hunter was born into Shinnecock community life and is remembered through Shinnecock homeland history."
          },
          {
            label: "Teacher training - Cheyney",
            place: "Cheyney State Teachers College, Pennsylvania",
            coordinates: [-75.528, 39.934],
            reason: "Hunter graduated from Cheyney State Teachers College before returning to teach."
          },
          {
            label: "Teaching - Reservation School",
            place: "Shinnecock Reservation School area, Southampton",
            coordinates: [-72.426, 40.882],
            reason: "Hunter taught at the Shinnecock Reservation School before World War II."
          },
          {
            label: "Public voice - Powwow grounds",
            place: "Shinnecock Powwow grounds, Southampton",
            coordinates: [-72.418, 40.883],
            reason: "Hunter gave opening addresses at Shinnecock powwows and helped carry Shinnecock community memory."
          },
          {
            label: "1967 - Voting rights testimony",
            place: "Suffolk County civic offices, Hauppauge",
            coordinates: [-73.223, 40.817],
            reason: "Hunter joined Shinnecock women's advocacy for voting rights and testified before the Suffolk County Human Rights Commission."
          },
          {
            label: "1975 - Community remembrance",
            place: "Shinnecock community, Southampton",
            coordinates: [-72.438, 40.886],
            reason: "Her funeral procession is remembered as a Shinnecock cultural reaffirmation and community tribute."
          }
        ]
      },
      "mary-rebecca-bunn-aunt-becky": {
        title: "Mary Rebecca Bunn associated places",
        note: "Broad Shinnecock places connected with Mary Rebecca Bunn's life, teaching, and elder memory.",
        places: [
          { label: "ca. 1840 - Shinnecock life context", place: "Shinnecock Reservation", coordinates: [-72.43013, 40.87195], reason: "Sources identify Mary Rebecca Bunn as a Shinnecock elder who lived to 102 years old before her death in 1936." },
          { label: "late 1800s / early 1900s - reservation school", place: "Shinnecock Reservation School context", coordinates: [-72.43013, 40.87195], reason: "Sources identify her as a New Paltz graduate and the first Shinnecock tribal member to teach at the reservation school." },
          { label: "1936 - community remembrance", place: "Shinnecock Reservation", coordinates: [-72.43013, 40.87195], reason: "Mary Rebecca Bunn, known as Aunt Becky, died in 1936 at the age of 102." }
        ]
      },
      "betty-lewis-cromwell-shinnecock": {
        title: "Betty Lewis Cromwell associated places",
        mapLabel: "Betty Lewis Cromwell",
        note: "Broad Shinnecock cultural-center context documented in the current source record.",
        places: [
          { label: "December 6, 1997 - cultural-center fundraiser", place: "Shinnecock Nation Cultural Center and Museum context", coordinates: [-72.432, 40.884], reason: "Betty Lewis Cromwell is documented in a photograph caption from a Shinnecock Nation Cultural Center and Museum fundraiser." }
        ]
      },
      "john-a-strong": {
        title: "John A. Strong associated places",
        mapLabel: "John A. Strong",
        note: "Broad places connected with Strong's Long Island Native history scholarship and research roles.",
        places: [
          { label: "1964 - Long Island University teaching", place: "Southampton College, Long Island University", coordinates: [-72.427, 40.887], reason: "Strong began teaching at Long Island University in 1964 and later published biographies identify him with Southampton College." },
          { label: "1996-1997 - Hofstra Long Island Studies Institute publications", place: "Hofstra University, Hempstead", coordinates: [-73.601, 40.716], reason: "Hofstra's Long Island Studies Institute published Strong's companion volumes on Long Island Algonquian history and contemporary Native communities." },
          { label: "2001 - Montaukett history", place: "Montauk / eastern Long Island context", coordinates: [-71.944, 41.036], reason: "Strong's Montaukett history focused on land tenure, recognition, and eastern Long Island Native history." },
          { label: "2009-2011 - Unkechaug sovereignty and history", place: "Poospatuck Reservation / Unkechaug context", coordinates: [-72.869, 40.787], reason: "Strong's expert-witness work and 2011 book documented Unkechaug community persistence and sovereignty." },
          { label: "2018 - Native shore-whaling research", place: "Long Island shore-whaling history", coordinates: [-72.63, 40.94], reason: "America's Early Whalemen examined Native shore-whaling labor on Long Island from 1650 to 1750." }
        ]
      },
      "chief-harry-wallace-of-the-unkechaug": {
        title: "Chief Harry Wallace associated places",
        mapLabel: "Chief Harry Wallace",
        note: "Broad places connected with Chief Wallace's leadership and Unkechaug community history.",
        places: [
          { label: "1991 - reservation smoke shop", place: "Poospatuck Reservation", coordinates: [-72.869, 40.787], reason: "Strong connects Wallace's 1991 smoke shop with economic, political, and cultural changes at Poospatuck." },
          { label: "April 5, 1994 - elected chief", place: "Poospatuck Reservation", coordinates: [-72.869, 40.787], reason: "Harry Wallace was elected Chief of the Unkechaug with a tribal council." },
          { label: "1995-1996 - community renewal", place: "Poospatuck Reservation", coordinates: [-72.869, 40.787], reason: "Strong connects Wallace's support with community self-help, traditional culture, public grounds, and roads." },
          { label: "2009 - June Meeting and sovereignty defense", place: "Poospatuck Reservation", coordinates: [-72.869, 40.787], reason: "Strong connects Wallace with June Meeting at Poospatuck and sovereignty defense during legal challenges." }
        ]
      },
      "peter-john-cuffee": {
        title: "Peter John Cuffee associated places",
        mapLabel: "Peter John Cuffee",
        note: "Broad places connected with Peter John Cuffee's Native ministry and family church history.",
        places: [
          { label: "c. 1712-1715 - Hay Ground birth", place: "Hay Ground / Bridgehampton", coordinates: [-72.315, 40.937], reason: "Jensen places Rev. Peter John Cuffee's birth at Hay Ground sometime between 1712 and 1715." },
          { label: "1741-1744 - Great Awakening ministry", place: "Poospatuck Reservation area", coordinates: [-72.869, 40.787], reason: "Sources connect Peter John Cuffee with the Great Congregationalist Revival and a parish at Poospatuck." },
          { label: "Native church network", place: "Wading River, Islip, and Canoe Place", coordinates: [-72.504, 40.884], reason: "Sources connect him with churches or preaching places at Wading River, Poospatuck, Islip, and Canoe Place." }
        ]
      },
      "jeremiah-pharoah-montaukett-whaler": {
        title: "Jeremiah Pharoah associated places",
        note: "Broad places connected with Jeremiah Pharoah's whaling life. Indian Fields archaeological and household locations are not pinned.",
        places: [
          { label: "1794 - Nantucket marriage and whaling", place: "Nantucket, Massachusetts", coordinates: [-70.10, 41.283], reason: "Jeremiah Pharoah married Aloosa / Lois Tallman while working as a whaler out of Nantucket." },
          { label: "1798 - return to Montauk", place: "Montauk / Indian Fields context", coordinates: [-71.944, 41.036], reason: "A transcription records Jeremiah Pharoah returning to Montauk after nine years and five months away sailing out of Nantucket." },
          { label: "late 18th-early 19th century - household material culture", place: "Indian Fields, Montauk", coordinates: [-71.944, 41.036], reason: "Archaeological research at Indian Fields documented household material culture associated with Jeremiah Pharoah, including a scrimshaw knife handle bearing his name." }
        ]
      },
      "adam-achitteronose": {
        title: "Adam Achitteronose associated places",
        note: "This path uses broad places from the cited sources; not a precise travel route.",
        places: [
          { label: "Fall 1655 - Rockaway Neck deed", place: "Rockaway Neck / Rockaway Peninsula", coordinates: [-73.835, 40.592], reason: "Adam acted as a bilingual envoy in negotiations for a Rockaway Neck deed with Hempstead officials." },
          { label: "March 12, 1656 - Hempstead treaty", place: "Hempstead", coordinates: [-73.621, 40.706], reason: "Adam appears in the treaty negotiated with the Dutch by Tackapousha and allied western Long Island Native leaders." },
          { label: "Western Long Island alliance context", place: "Merrick, Rockaway, Secatogue, Maskinekaug, and Canarsie records", coordinates: [-73.555, 40.667], reason: "Strong connects Adam with a western Long Island alliance rather than one exclusive community." }
        ]
      },
      "samson-occom": {
        title: "Samson Occom associated places",
        mapLabel: "Samson Occom",
        note: "Broad places connected with Occom's education, Long Island ministry, writing, travel, and Brothertown leadership.",
        places: [
          { label: "December 6, 1743 - study at Lebanon", place: "Lebanon, Connecticut", coordinates: [-72.212, 41.636], reason: "Occom went to study with Rev. Eleazar Wheelock at Lebanon, Connecticut." },
          { label: "1749-1761 - Montauk ministry", place: "Montauk", coordinates: [-71.944, 41.036], reason: "Occom taught and ministered among the Montaukett and married Mary Fowler." },
          { label: "August 29-30, 1759 - East Hampton ordination", place: "East Hampton", coordinates: [-72.185, 40.963], reason: "Occom was examined and ordained by the Presbytery of Long Island in East Hampton." },
          { label: "1765-1768 - Great Britain tour", place: "London, England", coordinates: [-0.1276, 51.5072], reason: "Occom traveled to England and Scotland to raise funds for Moor's Indian Charity School." },
          { label: "1785-1792 - Brothertown leadership", place: "Brothertown, New York", coordinates: [-75.62, 42.98], reason: "Occom helped lead the Brothertown movement, connecting Native families from Long Island and New England." }
        ]
      },
      "penhawitz-sachem-of-the-canarsie": {
        title: "Penhawitz associated places",
        note: "Broad places connected with Penhawitz in early Dutch land records. Private and sensitive locations are not pinned.",
        places: [
          { label: "Keshaechquereren / Canarsie homeland", place: "Canarsie, Brooklyn", coordinates: [-73.902, 40.640], reason: "Penhawitz is associated with the Keshaechquereren and Canarsie world of western Long Island." },
          { label: "1637 - Pagganack / Governors Island sale", place: "Governors Island / New York Harbor", coordinates: [-74.016, 40.689], reason: "Strong identifies Penhawis and Cakapeteyno in a 1637 sale involving Pagganack, now Governors Island, and Brooklyn tracts." },
          { label: "1637 - Rinnegaconck / Brooklyn tracts", place: "Brooklyn", coordinates: [-73.950, 40.650], reason: "The same 1637 record involved Brooklyn tracts known in the Dutch record as Rinnegaconck." },
          { label: "New Amsterdam records", place: "Lower Manhattan", coordinates: [-74.006, 40.705], reason: "Dutch colonial documents preserved the land record context for Penhawitz's biography." }
        ]
      },
      "momoweta": {
        title: "Momoweta associated places",
        note: "Broad places connected to Momoweta's documented diplomacy and North Fork land records.",
        places: [
          { label: "Corchaug homeland", place: "North Fork / Cutchogue area", coordinates: [-72.487, 41.011], reason: "Momoweta is remembered as a Corchaug sachem." },
          { label: "1644 - United Colonies diplomacy", place: "Boston / New England", coordinates: [-71.0589, 42.3601], reason: "The Plymouth colonial record places Momoweta, written Moughmaitow, before the Commissioners of the United Colonies seeking peace and protection." },
          { label: "May 6, 1648 - North Fork deed context", place: "Paucuckatux / Peconic Bay area", coordinates: [-72.460, 40.970], reason: "Momoweta appears in the 1648 deed context involving Corchaug territory, Paucuckatux, Mattituck/Cutchogue, and Plum Island." }
        ]
      },
      "poggatacut-sachem-of-the-manhassets-of-shelter-island": {
        title: "Poggatacut associated places",
        note: "Broad places from Manhansett and Shelter Island records.",
        places: [
          { label: "Manhansett homeland", place: "Shelter Island", coordinates: [-72.340, 41.070], reason: "Poggatacut is remembered as a Manhansett sachem of Shelter Island." },
          { label: "Sylvester Manor area", place: "Shelter Island", coordinates: [-72.349, 41.084], reason: "Shelter Island colonial records and later histories preserve Manhansett place and leadership history." },
          { label: "Peconic Bay connection", place: "Peconic Bay", coordinates: [-72.460, 40.970], reason: "Shelter Island is connected with wider Peconic and eastern Long Island diplomacy." }
        ]
      },
      "sachem-tackapousha": {
        title: "Tackapousha associated places",
        note: "Broad places tied to western Long Island diplomacy. Sensitive sites are not pinned.",
        places: [
          { label: "Massapequa homeland", place: "Massapequa / Fort Neck area", coordinates: [-73.462, 40.681], reason: "Tackapousha is remembered as a Massapequa leader." },
          { label: "Hempstead Plains", place: "Hempstead", coordinates: [-73.621, 40.706], reason: "The records connect him to Hempstead boundary and conference records." },
          { label: "Merrick / Mericock", place: "Merrick", coordinates: [-73.555, 40.667], reason: "Western Long Island diplomacy included Merrick/Mericock interests." },
          { label: "Rockaway / Jamaica Bay", place: "Rockaway and Jamaica Bay", coordinates: [-73.835, 40.592], reason: "The treaty and alliance records connect Massapequa leadership with Rockaway and other western communities." }
        ]
      },
      "sagamore-raseokan-ratiocanof-matinnicoke-matinecock": {
        title: "Raseokan/Ratiocan associated places",
        note: "Broad North Shore places named in seventeenth-century Matinecock land records.",
        places: [
          { label: "1646 - Eaton's Neck grant", place: "Eaton's Neck", coordinates: [-73.393, 40.954], reason: "Resorokon, sagamore of Ketanomocke, appears in a 1646 grant of Eaton's Neck to Theophilus Eaton." },
          { label: "April 2, 1653 - Huntington First Purchase", place: "Cold Spring Harbor to Northport", coordinates: [-73.456, 40.872], reason: "Raseokan is named as sagamore of Matinecock in the Huntington First Purchase." },
          { label: "September 20, 1654 - Caumsett deed", place: "Lloyd Neck / Caumsett", coordinates: [-73.472, 40.915], reason: "Ratiocan, identified as sagamore of Cow Harbor, sold Caumsett, now Lloyd Neck, to Samuel Mayo." },
          { label: "July 1656 - Eastern Purchase", place: "Asharoken / eastern Huntington", coordinates: [-73.356, 40.927], reason: "Asharoken appears in the July 1656 Eastern Purchase of Huntington, a separate transaction from Caumsett." }
        ]
      },
      "mangwobe-sachem-of-rockaway": {
        title: "Mangwobe associated places",
        note: "Broad places tied to Rockaway and Hempstead conference records.",
        places: [
          { label: "Rockaway homeland", place: "Rockaway Peninsula", coordinates: [-73.835, 40.592], reason: "Mangwobe is remembered as a Rockaway sachem." },
          { label: "July 4, 1657 - Hempstead boundary conference", place: "Hempstead", coordinates: [-73.621, 40.706], reason: "Mangwobe met with English officials, Tackapousha, Wyandanch, and others to clarify ancestral land boundaries." },
          { label: "Merrick and south bays", place: "Merrick / southern Hempstead bays", coordinates: [-73.555, 40.667], reason: "The conference records connected Rockaway, Merrick, Massapequa, and Hempstead interests." }
        ]
      },
      "sachem-warawakmy-of-the-setauket": {
        title: "Warawakmy associated places",
        note: "Broad places tied to Setauket records.",
        places: [
          { label: "Setauket homeland", place: "Setauket", coordinates: [-73.105, 40.941], reason: "Warawakmy is remembered as a Setauket sachem." },
          { label: "April 14, 1655 - Setauket deed", place: "Setauket / Stony Brook area", coordinates: [-73.140, 40.925], reason: "Warawakmy appears with fourteen other Native men in the sale of a North Shore tract." },
          { label: "Peconic headwaters", place: "Wading River / Peconic headwaters area", coordinates: [-72.830, 40.930], reason: "The deed record names land between Stony Brook and the Peconic headwaters." }
        ]
      },
      "nasseconset-sachem-of-the-nissequogue": {
        title: "Nasseconset associated places",
        note: "Broad places connected with land and place-name records.",
        places: [
          { label: "1650 - Jonas Wood deed context", place: "Nissequogue River / Smithtown area", coordinates: [-73.203, 40.906], reason: "Strong notes a 1650 deed between Jonas Wood and Nasseconseke in the Nissequogue River area." },
          { label: "1664 - Smithtown quitclaim", place: "Smithtown", coordinates: [-73.200, 40.856], reason: "Nasseconset settled a Smithtown land dispute with Richard Smith through a quitclaim remembered in later source accounts." },
          { label: "Crab Meadow / Katawamake", place: "Crab Meadow area", coordinates: [-73.312, 40.928], reason: "Place-name and land-record context connect the broader Nissequogue area with Crab Meadow/Katawamake." }
        ]
      },
      "keeossechok-sachem-of-the-secatogue": {
        title: "Keeossechok associated places",
        note: "Broad places connected with the brief deed and place-name record.",
        places: [
          { label: "June 1, 1657 - Five Necks deed", place: "Secatogue Neck / West Islip area", coordinates: [-73.294, 40.706], reason: "Keeossechok, sachem of the Secatogue, appears in the Five Necks deed for South Shore meadow lands." },
          { label: "Great South Bay marshes", place: "Great South Bay", coordinates: [-73.238, 40.688], reason: "The Five Necks deed concerned meadow necks and South Shore marshland context." },
          { label: "Islip / Babylon south shore", place: "Islip and Babylon shoreline", coordinates: [-73.318, 40.727], reason: "The broader Secatogue region includes this South Shore corridor." }
        ]
      },
      "mocomanto-shinnecock-sachem-1640": {
        title: "Mocomanto associated places",
        note: "Broad places connected to Southampton and Shinnecock records.",
        places: [
          { label: "Shinnecock homeland", place: "Shinnecock, Southampton", coordinates: [-72.432, 40.884], reason: "Mocomanto is remembered as a Shinnecock leader." },
          { label: "December 13, 1640 - Southampton deed", place: "Southampton", coordinates: [-72.389, 40.884], reason: "Mocomanto appears among the Native signers of the December 13, 1640 Southampton deed." },
          { label: "Southampton colonial record context", place: "Southampton Village", coordinates: [-72.389, 40.884], reason: "The document is central to colonial Southampton history but preserves only a narrow view of Mocomanto's life and leadership." }
        ]
      },
      "mandush-17th-century-sachem-of-shinnecock": {
        title: "Mandush associated places",
        note: "Approximate places named in Shinnecock and South Fork records. This is not a precise travel route.",
        places: [
          { label: "1640 - Southampton deed signer", place: "Southampton", coordinates: [-72.389, 40.884], reason: "Mandush, recorded as Manadush in published deed text, appears among the Native signers of the December 13, 1640 Southampton deed." },
          { label: "1666 record - turf testimony", place: "Southampton / Shinnecock", coordinates: [-72.432, 40.884], reason: "Southampton testimony remembered Mandush cutting and giving a turf of ground to Wyandanch as a symbolic act about rights and authority." },
          { label: "Wyandanch-related political context", place: "Montaukett / Shinnecock diplomacy", coordinates: [-71.944, 41.036], reason: "The record ties Mandush to testimony about Shinnecock, Montaukett, and Wyandanch-related political relationships." }
        ]
      },
      "worison-unkechaug-whaler": {
        title: "Worison associated places",
        note: "Broad places connected with Worison in Unkechaug land and shore-whaling records.",
        places: [
          { label: "Winter 1676-1677 - shore-whaling contracts", place: "Southampton shore-whaling records", coordinates: [-72.389, 40.884], reason: "Worison signed early shore-whaling contracts with John Cooper for a share of the profits." },
          { label: "1680 - Watchogue Neck residence", place: "Watchogue Neck / East Moriches area", coordinates: [-72.789, 40.762], reason: "A land description places Warishone at a neck of land west of Watchogue and identifies him as Mahue's kinsman." }
        ]
      },
      "wuchikittawbut": {
        title: "Wuchikittawbut associated places",
        mapLabel: "Wuchikittawbut",
        note: "Broad places connected with Wuchikittawbut's Montaukett leadership after Wyandanch's death.",
        places: [
          { label: "c. 1660-1661 - Montaukett leadership", place: "Montauk", coordinates: [-71.944, 41.036], reason: "After Wyandanch's death, Wuchikittawbut and her son Wyancombone appear in records tied to Montaukett land, herbage, beach, and whaling rights." },
          { label: "January 14, 1663 - sunksquaw record", place: "Montaukett land and beach-rights context", coordinates: [-71.944, 41.036], reason: "A record identifies Wuchikittawbut as a Montaukett sunksquaw in testimony connected to beach boundaries and drift-whale agreements." }
        ]
      },
      "sunksqua-weany-pametsechs": {
        title: "Weany associated places",
        note: "Broad places connected with deed and land-record references to women's leadership.",
        places: [
          { label: "Shinnecock homeland", place: "Shinnecock, Southampton", coordinates: [-72.432, 40.884], reason: "Weany is remembered as a Shinnecock sunksquaw." },
          { label: "April 1662 - Quogue purchase", place: "Quogue / Quantuck", coordinates: [-72.581, 40.823], reason: "Weany and Cobish sold Thomas Topping lands from Canoe Place to Seatuck Creek, asserting Shinnecock authority." },
          { label: "Canoe Place / Niamuck", place: "Canoe Place", coordinates: [-72.504, 40.884], reason: "The April 1662 record names Canoe Place, or Niamuck, as one side of the land description." }
        ]
      },
      "chief-mahue-mayhew-of-unkechaug": {
        title: "Mahue/Mayhew associated places",
        note: "Broad places connected with Unkechaug and Setauket records.",
        places: [
          { label: "April 14, 1655 - Setauket deed", place: "Setauket / Stony Brook area", coordinates: [-73.140, 40.925], reason: "Mahue appears with Warawakmy and other Native signers in the Setauket deed for North Shore land." },
          { label: "1659 - Cataconacke / Old Field deed", place: "Setauket / Old Field area", coordinates: [-73.126, 40.965], reason: "Mahue appears in a Setauket-area deed context involving Cataconacke and Old Field." },
          { label: "December 1685 - Moriches patent", place: "Center Moriches / Forge River area", coordinates: [-72.800, 40.800], reason: "Mahue sold Governor Thomas Dongan a patent for a large tract of Moriches land." }
        ]
      },
      "rev-paul-cuffee": {
        title: "Rev. Paul Cuffee associated places",
        mapLabel: "Reverend Paul Cuffee",
        note: "Broad places connected to Cuffee's life and preaching circuit; not a precise route.",
        places: [
          { label: "March 4, 1757 - Brookhaven birth context", place: "Brookhaven Township / Wading River area", coordinates: [-72.842, 40.945], reason: "Sources place Paul Cuffee's birth in Brookhaven and part of his youth in Wading River." },
          { label: "1790 - Poospatuck ordination", place: "Poospatuck Reservation area", coordinates: [-72.869, 40.787], reason: "The Connecticut Strict Congregational Convention ordained Cuffee at Poospatuck." },
          { label: "Shinnecock ministry and June Meeting context", place: "Shinnecock, Southampton", coordinates: [-72.432, 40.884], reason: "Cuffee's ministry connected with Shinnecock Native Christian worship and the June Meeting tradition." },
          { label: "1798-1812 - Montaukett ministry", place: "Montauk", coordinates: [-71.944, 41.036], reason: "Missionary sources connect Cuffee with ministry among the Montaukett." },
          { label: "March 7, 1812 - Canoe Place burial context", place: "Canoe Place / Hampton Bays", coordinates: [-72.504, 40.884], reason: "Cuffee died in 1812 and was buried at the Native burial ground at Canoe Place; the map keeps the location broad." }
        ]
      },
      "nathan-jeffrey-cuffee": {
        title: "Nathan Jeffrey Cuffee associated places",
        note: "Broad places connected to Montaukett writing, Eastville community history, and land-rights advocacy.",
        places: [
          { label: "Eastville community", place: "Sag Harbor / Eastville", coordinates: [-72.284, 40.99618], reason: "Cuffee is associated with the Eastville community in Sag Harbor." },
          { label: "1896 - tribal-rights committee", place: "Sag Harbor / Eastville and Montaukett land-rights context", coordinates: [-72.284, 40.99618], reason: "Cuffee headed the Committee on Tribal Rights and urged legal action to reclaim Hither Woods, North Neck, and Indian Fields." },
          { label: "Montaukett land claims", place: "Hither Woods / North Neck / Indian Fields context", coordinates: [-72.020, 41.030], reason: "The 1896 advocacy centered Montaukett claims to Hither Woods, North Neck, and Indian Fields; sensitive and archaeological locations are kept broad." },
          { label: "1905 - Lords of the Soil publication", place: "Long Island / Boston publication context", coordinates: [-72.284, 40.99618], reason: "Nathan Cuffee and Lydia Jocelyn published Lords of the Soil, a historical novel about Long Island Indian life, in 1905." }
        ]
      },
      "sachem-aquash-of-the-montaukett": {
        title: "Aquash associated places",
        note: "Broad places connected to Aquash in late seventeenth-century Montaukett and East Hampton records.",
        places: [
          { label: "1684 - Aquaas named as sachem", place: "East Hampton / Montaukett records", coordinates: [-72.185, 40.963], reason: "Strong notes that the Montaukett sachem is identified as Aquaas or Aquosh in 1684." },
          { label: "1687 - Wyandanch name in deed context", place: "Montaukett deed context", coordinates: [-71.944, 41.036], reason: "Strong writes that Aquaas appears to have taken the name of his great-grandfather Wyandanch in 1687." }
        ]
      },
      "sylvester-pharoah": {
        title: "Sylvester Pharoah associated places",
        note: "Broad places connected with Sylvester Pharoah in Montaukett whaling, marriage, and leadership records.",
        places: [
          { label: "1828 - Sag Harbor whaling voyage", place: "Sag Harbor", coordinates: [-72.293, 40.997], reason: "A Montaukett whaling table lists Silvester Pharoah sailing from Sag Harbor on the whaleship Thames toward Patagonia." },
          { label: "1861 - marriage at Amagansett", place: "Amagansett", coordinates: [-72.143, 40.973], reason: "A marriage record identifies Sylvester Pharoah as King of the Montauk Indians and records his marriage to Jerusha Pharoah at Amagansett." },
          { label: "1870 - Indian Fields leadership context", place: "Indian Fields / Montauk", coordinates: [-71.950, 41.036], reason: "Strong writes that Sylvester Pharoah continued receiving the largest number of East Hampton pasture-lease shares until his death in 1870." }
        ]
      },
      "stephen-talkhouse-pharoah": {
        title: "Stephen Talkhouse associated places",
        note: "Approximate places connected to Stephen Talkhouse Pharoah. Documented events are separated from route lore, and private or sensitive locations are not pinned.",
        places: [
          { label: "ca. 1819-1821 - birth at Molly's Hill", place: "Springs, East Hampton", coordinates: [-72.137, 41.035], reason: "Sources place Talkhouse's birth at Molly's Hill in Springs; the exact birth year varies across records." },
          { label: "Later life, before 1879 - house east of Neapeague Harbor", place: "Montauk", coordinates: [-72.014, 41.032], reason: "The On This Site guide says the house east of Neapeague Harbor was used later in his life and had a footpath toward Bridgehampton, but no dated Bridgehampton visit is documented." },
          { label: "August 1879 - funeral in Freetown", place: "East Hampton / Freetown", coordinates: [-72.17746, 41.01998], reason: "Sources describe Talkhouse's funeral as held in Freetown after his body was found on a walking trail near East Hampton." }
        ]
      }
    };
    const POPULAR_TAGS = ["burial", "Indian", "montaukett", "period", "sachem", "shinnecock"];
    const TRIBAL_ARTICLES = [
      ["tribal-setauket", "Setauket", "More research is being added for this tribal-group article."]
    ].map(([slug, title, summary]) => ({
      id: `virtual-${slug}`,
      status: "published",
      slug,
      title,
      summary,
      content: `<p>${summary}</p><p>More context is being prepared so the mapped ancestral/traditional land can be paired with a clearer story and sources.</p>`,
      virtual: true
    }));
    const VIRTUAL_WIKI_ARTICLES = [
      ["duck-decoys", "Duck Decoys", "More research is being added for this topic."],
      ["bowls", "Bowls", "More research is being added for this topic."],
      ["june-meeting", "June Meeting", "More research is being added for this topic."],
      ["early-contact-period", "Early Contact Period", "More research is being added for this topic."],
      ["contact-period", "Contact Period", "More research is being added for this topic."],
      ["native-plants", "Native Plants", "Plant observations, Algonquian vocabulary, and natural-resource notes connected to On This Site. Visitor plant identifications remain suggestions until reviewed."]
    ].map(([slug, title, summary]) => ({
      id: `virtual-${slug}`,
      status: "published",
      slug,
      title,
      summary,
      content: `<p>${summary}</p>`,
      virtual: true
    }));
    const LANGUAGE_QUIZ_WORDS = window.NLI_LANGUAGE_QUIZ_WORDS || [];
    const MAP_QUOTE_TICKER_ITEMS = [
      {
        person: "Lois Marie Hunter / Princess Nowedonah",
        year: "1972",
        quote: "[T]he Shinnecock are 'tired of people saying they've lived with us and think they know all about us: we just want to be left alone.'",
        source: "The Shinnecock Indians: A Culture History, Vol. VI",
        wikiSlug: "lois-princess-nowedonah-hunter"
      },
      {
        person: "Sachem Miantonomo",
        year: "1638",
        quote: "Brothers, we must be one as the English are, or we shall soon all be destroyed. You know our Fathers had plenty of deer and skins; our plains were full of deer and turkeys, and our coves and rivers were full of fish. But, brothers, since these English have seized upon our country, they cut down the grass with scythes, and the trees with axes. Their cows and horses eat up the grass, and their hogs spoil our beds of clams; and finally we shall starve to death. Therefore, I beseech you to act like men.",
        source: "The Long Island Indians and Their New England Ancestors"
      },
      {
        person: "Samson Occom",
        year: "Late 18th Century",
        quote: "The Supreme and independent Spirit above, who is the right owner and Dis-poser of all Worlds and all things and Creatures therein, Saw fit, to give us this great Continent to live in, and here we have been, nobody knows how long, and it pleased him also, in process of Time to Send your forefathers in this Country...",
        source: "The Collected Writings of Samson Occom, Mohegan",
        wikiSlug: "samson-occom"
      },
      {
        person: "James Bunn",
        year: "1888",
        quote: "[The 3000 acres of Shinnecock Hills] belongs to us, we occupy the land, it was given to us, we sued to have [the land]... they built on our land and never paid us for it... we still claim the land is ours.",
        source: "Shinnecock Land Claim Timeline (Testimony before the Special Committee to Investigate the Indian Problem of the State of New York)"
      },
      {
        person: "Princess Sun Tama",
        year: "1969",
        quote: "The Indian Council is requesting the town officers to investigate historical deeds and see whether something can be done to investigate our claim as to the ownership of the [Huntington/Matinecock] land... We told them we want bonafide recognition that we are the proprietors of this land... we want our portion of the loot... we want [the stolen land] back for our use.",
        source: "The Long-Islander (\"Indians Assert Claim to Land\")"
      },
      {
        person: "Elizabeth Haile",
        year: "1998",
        quote: "I'd like to see our original ownership [of the Shinnecock Hills] recognized... We live on a peninsula, but we had all the lands in the area before 1859.",
        source: "The East Hampton Star (\"Court - Shinnecock Land is Still Theirs\")"
      },
      {
        person: "Margo Thunder Bird",
        year: "1999",
        quote: "We grew up chasing trespassers off our [Shinnecock] land... That's how we made our political goals as children. We would throw stones at them and tell the non-Indian people to get off our land. We would say, 'You can't be here. This is Indian land.' Our grandmother raised us. She applauded our efforts.",
        source: "The New York Times (\"Land, Wealth and Power Within Shinnecocks' Grasp\")"
      },
      {
        person: "Margo Thunder Bird",
        year: "1999",
        quote: "The [Shinnecock Hills] golf course is on our land... We don't have to throw them out. We could charge back rent. I'll ride up on my horse and collect it every month.",
        source: "The New York Times (\"Land, Wealth and Power Within Shinnecocks' Grasp\")"
      }
    ];

    const GUIDED_LEARNING_PATH_PROGRESS_KEY = "nli-guided-learning-path-progress-v1";
    const GUIDED_LEARNING_PATH_SEEDS = [
      {
        title: "Sovereignty and Tribal Governance",
        slug: "sovereignty-tribal-governance",
        short_description: "Leadership, land, law, recognition, jurisdiction, and Native government across Long Island.",
        long_intro: "This route follows Native leaders and communities as they negotiated, governed, defended land, and asserted jurisdiction from the seventeenth century to the present. Shinnecock is federally recognized; Unkechaug is recognized in New York law; Montaukett and Matinecock communities continue to organize and pursue recognition and land justice. Those legal categories are different, and none of them creates or erases Native identity.",
        theme: "sovereignty",
        estimated_time_minutes: 30,
        recommended_grades: "Grades 7+",
        badge_name: "Sovereignty and Governance Path Completed",
        key_questions: [
          "How did Native leaders protect land and community authority within colonial legal systems?",
          "What is the difference between community continuity, state recognition, and federal acknowledgment?",
          "How do taxation, land use, and economic development become questions of jurisdiction?"
        ],
        sensitivity_level: "educational",
        sort_order: 1,
        stops: [
          ["mechowodt-treaty-reserved-rights-landscape-1639", "Mechowodt's agreement retained planting, fishing, hunting, and residence rights. It shows Native diplomacy working to protect community life, even when colonial documents tried to turn shared landscapes into property.", "Which rights did Mechowodt insist should continue after the agreement?"],
          ["shinnecock-indian-reservation", "Shinnecock leaders appear as a council in the 1640 Southampton agreement. The Nation later adapted the state-created trustee system, completed federal acknowledgment in 2010, and adopted a constitution that protects sovereignty, land, resources, culture, and self-determination.", "How can a government change its form while the nation and its responsibilities continue?"],
          ["unkechaug-indian-reservation", "Sachem Tobacus's 1690 right-of-way agreement shows that outsiders still sought Unkechaug consent to cross the Mastic peninsula. The 1700 Poospatuck land grant helped preserve a continuing homeland whose government is recognized in New York law.", "What does a right-of-way agreement reveal about who held authority over the land?"],
          ["shinnecock-hills-golf-club", "Shinnecock leaders negotiated a 1,000-year lease covering Shinnecock Hills, Neck, and Sebonac in 1703. The 1859 transfer that removed most of the Hills from Shinnecock control remains central to the Nation's history of land defense.", "How did colonial and state law turn a long-term lease into dispossession?"],
          ["indian-fields", "Indian Fields remained a center of Montaukett life as families defended land and community identity. Later court and recognition struggles show why a government declaring a people absent cannot erase kinship, leadership, memory, or continued nationhood.", "Who has the authority to decide whether an Indigenous nation continues to exist?"],
          ["cove-realty-site", "In the 1950s, Shinnecock community members organized through the Shinnecock Indian Community Group when a developer began building along the reservation's northern boundary. Their legal and physical defense forced the company from the land.", "How did community organization make sovereignty visible at a disputed boundary?"],
          ["matinecock-town-hall-confrontation-1969", "Princess Sun Tama and Matinecock supporters brought land claims and demands for recognition directly to Huntington officials in 1969.", "What changes when Native leaders speak for themselves inside a town government building?"],
          ["shinnecock-outpost-tax-demonstrations-1997", "Shinnecock people defended the Outpost during the 1997 conflict over New York taxation. The demonstrations made a practical question of sovereignty visible: which government has authority over commerce on Native land?", "Why are taxation disputes also disputes about jurisdiction?"],
          ["shinnecock-monument", "The Shinnecock Nation's 2019 monuments asserted authority to use tribal land for community revenue. The Nation's 2024 travel-plaza groundbreaking extended that work through a project it described as fully funded and managed by Shinnecock.", "How can an economic project also be an act of government?"]
        ]
      },
      {
        title: "Making a Living: Indigenous Work and Economic Development",
        slug: "making-a-living-economic-development",
        short_description: "Wampum, foodways, whaling, skilled labor, art, aquaculture, and sovereign enterprise.",
        long_intro: "This route follows how Native Long Islanders have supported families and communities through land and water knowledge, skilled work, trade, art, entrepreneurship, and tribally directed development. It also asks how dispossession narrowed choices, how workers negotiated unequal systems, and how economic sovereignty continues today.",
        theme: "economic-development",
        estimated_time_minutes: 30,
        recommended_grades: "Grades 7+",
        badge_name: "Making a Living Path Completed",
        key_questions: [
          "How did Native knowledge and skill shape Long Island's economy?",
          "How did dispossession change the choices available to Native families?",
          "What makes present-day economic development an expression of sovereignty?"
        ],
        sensitivity_level: "educational",
        sort_order: 2,
        stops: [
          ["fort-corchaug", "Corchaug artisans transformed local whelk and quahog shells into wampum used in diplomacy, ceremony, and exchange.", "How did shell-working knowledge create both economic and political power?"],
          ["mechowodt-treaty-reserved-rights-landscape-1639", "The 1639 agreement associated with Mechowodt reserved rights to plant, fish, hunt, and live across parts of the landscape.", "Why would reserved land-use rights matter as much as a boundary line?"],
          ["whaling", "Shinnecock, Unkechaug, Montaukett, and other Native whalemen brought maritime knowledge and specialized skill to shore-whaling crews while negotiating unequal labor systems.", "How can the same work show both expertise and exploitation?"],
          ["manor-of-st-george", "On May 23-24, 1676, Unkechaug leaders asked to whale with their own boats and sell what they produced where they chose.", "What did economic independence mean to Unkechaug leaders in 1676?"],
          ["eastville", "Eastville and nearby East End communities joined Native, Black, and mixed-heritage family networks connected to seafaring, domestic work, farming, factory labor, guiding, basketry, and woodcraft.", "How can work and kinship preserve community when official records divide people by race?"],
          ["shinnecock-hills-golf-club", "Shinnecock people helped build and maintain the golf course on dispossessed Shinnecock land, and Oscar Bunn competed in the 1896 U.S. Open.", "How did Shinnecock workers maintain a presence on land taken from the Nation?"],
          ["shinnecock-oyster-project", "The tribally managed Shinnecock Oyster Project joined shellfish restoration, technical training, jobs, and economic self-determination. Since 2019, the women-led Shinnecock Kelp Farmers have continued that relationship through aquaculture and climate response.", "How can aquaculture support both a living bay and a living community?"],
          ["mas-house", "Ma's House opened in 2021 as a Native-led art studio, residency, library, exhibition, and gathering space on the Shinnecock Reservation.", "What kinds of value does an artist-run space create beyond sales?"],
          ["shinnecock-monument", "The Shinnecock Nation built the Sunrise Highway monuments to create revenue under its own jurisdiction and broke ground nearby on a fully Shinnecock-funded and managed travel plaza in 2024.", "Who decides how tribal land can be used for economic development?"]
        ]
      },
      {
        title: "Whaling, Fishing, and the Coast",
        slug: "coastal-knowledge",
        short_description: "Coastal knowledge, whales, shellfish, fishing sites, and waterways.",
        long_intro: "This route follows shore, bay, whale, shellfish, and waterway sites that show the depth of Native coastal knowledge.",
        theme: "coast",
        estimated_time_minutes: 15,
        badge_name: "Coastal Knowledge Path Completed",
        key_questions: [
          "How did water shape foodways, travel, and community life?",
          "What does coastal knowledge include beyond fishing?",
          "How do present-day restoration projects continue older relationships with water?"
        ],
        sensitivity_level: "educational",
        sort_order: 3,
        stops: [
          ["whaling", "Whaling connects coastal knowledge, labor, ceremony, and Long Island maritime history.", "How can whaling history be told without reducing Native people to a single practice?"],
          ["whales-fin", "Whale's Fin keeps attention on a Shinnecock sacred place connected to whales and shore.", "Why do some places need careful public interpretation?"],
          ["jones-beach-drift-whale-rights", "Drift whale rights show how colonial records touched Native coastal authority.", "What does a legal record reveal about rights along the shore?"],
          ["shinnecock-oyster-project", "The Shinnecock Oyster Project shows contemporary shellfish restoration and stewardship.", "How does restoring shellfish also restore relationships with place?"],
          ["massapeoque-meadows-south-oyster-bay", "South Oyster Bay connects place names, marshes, and coastal food landscapes.", "How do wetlands hold history?"],
          ["seaford-creek-unqua-neck-cultural-landscape", "Creek and neck landscapes show how water routes shaped community geographies.", "How can a creek connect many kinds of history?"],
          ["napock-peconic-river-headwaters", "Napock centers ponds and wetlands near the Peconic River headwaters.", "Why do headwaters matter in coastal history?"]
        ]
      },
      {
        title: "Place Names and Language",
        slug: "place-names-language",
        short_description: "Indigenous place names, meanings, spelling variations, language roots, and colonial records.",
        long_intro: "This route follows Indigenous place names that preserve relationships among language, land, water, plants, and community memory.",
        theme: "language",
        estimated_time_minutes: 25,
        recommended_grades: "Grades 6+",
        badge_name: "Place Names Path Completed",
        key_questions: [
          "What can a place name remember?",
          "Why do spellings vary across colonial documents?",
          "How should we handle uncertainty when interpreting older names?"
        ],
        sensitivity_level: "general",
        sort_order: 4,
        stops: [
          ["appaquogue", "Appaquogue connects language with wetland plants and everyday materials.", "What does this name suggest about plant knowledge?"],
          ["werpos", "Werpos preserves a Brooklyn placename interpreted through landscape and vegetation.", "How does a placename keep local ecology visible?"],
          ["manchonack", "Manchonack connects Gardiners Island to an early land agreement and layered meanings.", "What changes when an island is read through its Indigenous name?"],
          ["nissaquogue", "Nissequogue shows how a river, town, and community name remain connected.", "How do names move between waterways and people?"],
          ["merrick-hempstead-plains", "Merrick connects the Hempstead Plains with community history and colonial-era references.", "What can a name tell us about a broad landscape?"],
          ["wamponamon-montauk-point", "Wamponamon carries Montauk Point history through an Indigenous placename.", "Why do eastern Long Island names matter to broader Native geography?"],
          ["shinnecock-placename", "Shinnecock connects neck, bay, hills, plain, and community identity.", "How can one name gather many places?"],
          ["maspeth", "Maspeth links present-day Queens to Native placename history.", "How do Native place names remain inside urban geography?"],
          ["marechkawick", "Marechkawick is tied to early Brooklyn place naming and colonial documentation.", "How can public history keep older Native geographies visible?"],
          ["massapootupaug", "Massapootupaug centers water, bay, and place-name memory along the south shore.", "How do waterways shape language on the map?"]
        ]
      },
      {
        title: "Burial Grounds and Sacred Sites",
        slug: "burial-sacred-sites",
        short_description: "Protected places, with some locations shown broadly to prevent harm.",
        long_intro: "This respect path introduces protected and sensitive places with limited detail where privacy, care, or community safety requires it.",
        theme: "protected-knowledge",
        estimated_time_minutes: 18,
        recommended_grades: "Grades 8+",
        badge_name: "Respect Path Completed",
        key_questions: [
          "Why are some details intentionally limited?",
          "What does respectful learning require?",
          "How can public history protect burial grounds and sacred places?"
        ],
        sensitivity_level: "sensitive",
        sort_order: 5,
        stops: [
          ["indian-field-cemetery", "This stop asks visitors to approach cemetery history through memory, respect, and protection.", "What does it mean to learn without treating a place as a destination?", "Some details may be limited to protect burial grounds and community privacy."],
          ["council-rock", "Council Rock is connected to community memory and a sensitive landscape.", "How can a public marker point toward history without exposing too much?", "Some locations are shown broadly to prevent harm."],
          ["orient-burial", "Orient Burial is included as protected knowledge, with exact details limited.", "Why should some archaeological and burial details remain protected?", "Details are intentionally limited."],
          ["indian-island-site", "Indian Island requires careful interpretation because public access and sensitive history overlap.", "How can public parks carry responsibilities to Native ancestors?", "Learn with care and do not disturb protected places."],
          ["horse-barn", "Horse Barn Burial Site is treated with privacy and respect rather than visit-focused language.", "What is the difference between learning and locating?", "The public map should not encourage locating burial places."],
          ["fort-shinnecock", "Fort Shinnecock connects memory, defense, and sensitive Shinnecock land history.", "How can the map mark significance while respecting limits?", "Details may be limited to protect community privacy."]
        ]
      },
      {
        title: "Colonial Law and Land Loss",
        slug: "colonial-law-land-loss",
        short_description: "Deeds, petitions, town records, boundaries, legal conflicts, and dispossession.",
        long_intro: "This route follows places where colonial law, deeds, boundaries, and petitions reshaped Native land on Long Island.",
        theme: "law",
        estimated_time_minutes: 25,
        recommended_grades: "Grades 8+",
        badge_name: "Land Records Path Completed",
        key_questions: [
          "How did legal documents change Native land relationships?",
          "Who appears as a signer, witness, or translator?",
          "What is missing from colonial records?"
        ],
        sensitivity_level: "educational",
        sort_order: 6,
        stops: [
          ["mechowodt-treaty-reserved-rights-landscape-1639", "Mechowodt highlights treaty language, reserved rights, and the limits of colonial paperwork.", "What rights were Native leaders trying to preserve?"],
          ["hempstead-plains-deed-landscape-1643", "The Hempstead Plains deed landscape shows how broad territories were written into colonial claims.", "What happens when a living landscape becomes a deed description?"],
          ["mercock-land-dispute-1675", "The Mercock dispute connects land, testimony, and legal conflict.", "What does disagreement reveal about colonial land pressure?"],
          ["december-1685-deed-land", "The December 1685 deed centers a major Moriches-area land transaction.", "Who held authority in this agreement?"],
          ["jones-beach-drift-whale-rights", "Drift whale rights show legal attention to shoreline resources.", "How did colonial law try to define access to coastal life?"],
          ["manor-of-st-george", "The Manor of St. George connects estate power, colonial landholding, and Native labor history.", "How did manor systems reshape Native homelands?"],
          ["william-floyd-estate", "William Floyd Estate connects public history with Unkechaug labor and land context.", "What stories sit behind preserved colonial houses?"],
          ["merrick-road-ancient-south-shore-trail", "Merrick Road carries older Native route history through later colonial and modern infrastructure.", "How do roads preserve and overwrite older movement?"]
        ]
      },
      {
        title: "Plants, Animals, and Indigenous Ecology",
        slug: "plants-animals-ecology",
        short_description: "Species, habitats, seasonal knowledge, and Native ecological relationships.",
        long_intro: "This route follows wetlands, shellfish, plants, animals, ponds, and habitats that show Indigenous ecological relationships across Long Island.",
        theme: "ecology",
        estimated_time_minutes: 20,
        badge_name: "Ecology Path Completed",
        key_questions: [
          "How does Native history live in plants, animals, and habitats?",
          "What can wetlands and shellfish teach about stewardship?",
          "How do place names preserve ecological knowledge?"
        ],
        sensitivity_level: "educational",
        sort_order: 7,
        stops: [
          ["appaquogue", "Appaquogue links flags, wetland plants, and useful materials.", "How can plants become part of a place name?"],
          ["shinnecock-oyster-project", "The Shinnecock Oyster Project shows contemporary shellfish restoration.", "What does restoration repair beyond habitat?"],
          ["fresh-pond-site", "Fresh Pond connects shell middens, public learning, and coastal archaeology.", "How can public education protect vulnerable evidence?"],
          ["massapeoque-meadows-south-oyster-bay", "South Oyster Bay centers marshes, meadows, and shellfish landscapes.", "Why are marshes central to coastal life?"],
          ["lake-agawam", "Lake Agawam connects water, settlement, and Shinnecock geography.", "How does a lake shape local history?"],
          ["napock-peconic-river-headwaters", "Napock focuses attention on headwaters, ponds, and wetlands.", "Why begin coastal learning inland?"],
          ["poyhas-swamp", "Poyhas Swamp keeps wetland knowledge visible in a placename.", "How do swamps carry history?"],
          ["quarapin-round-swamp", "Quarapin links Round Swamp to older land and water memory.", "What does a swamp name preserve?"],
          ["whales-fin", "Whale's Fin connects animal life, ceremony, and Shinnecock shore memory.", "How can one coastal place hold more than one meaning?"]
        ]
      },
      {
        title: "Contemporary Native Long Island",
        slug: "contemporary-native-long-island",
        short_description: "Artists, cultural centers, present-day tribal nations, events, organizing, and Native futures.",
        long_intro: "This route follows present-day Native Long Island through community spaces, cultural centers, restoration, art, and public gathering.",
        theme: "contemporary",
        estimated_time_minutes: 15,
        badge_name: "Contemporary Native Long Island Path Completed",
        key_questions: [
          "Where is Native Long Island visible today?",
          "How do art, restoration, and gathering carry community futures?",
          "What does the map show when Native presence is not treated as past tense?"
        ],
        sensitivity_level: "general",
        sort_order: 8,
        stops: [
          ["shinnecock-indian-reservation", "The Shinnecock Indian Reservation is a present-day sovereign homeland.", "How does the map show Native nationhood now?"],
          ["unkechaug-indian-reservation", "The Unkechaug Indian Reservation centers present-day Unkechaug homeland and community continuity.", "What does continuity look like on a map?"],
          ["mas-house", "Ma's House connects Native art, gathering, and community work.", "How can art create public memory and future possibility?"],
          ["shinnecock-nation-cultural-center-and-museum", "The cultural center is a public place for Shinnecock-led learning.", "Why does community authority matter in education?"],
          ["shinnecock-oyster-project", "The oyster project shows contemporary Native environmental stewardship.", "How does stewardship become public history?"],
          ["shinnecock-powwow-grounds", "The powwow grounds represent cultural gathering and annual public presence.", "What does gathering teach across generations?"],
          ["setalcott-powwow-grounds", "Setalcott Powwow Grounds connects public education, gathering, and present-day Native visibility.", "How do events help communities teach their own histories?"]
        ]
      }
    ];

    const state = {
      sites: [],
      layers: [],
      wikiArticles: [],
      siteContent: [],
      blogPosts: [],
      calendarEvents: [],
      contributorProfiles: [],
      publicComments: [],
      commentVotes: [],
      profilePointEvents: [],
      profilePointEventCanonicalIds: new Set(),
      profilePointEventSyncPromises: new Map(),
      deferredSocialDataLoaded: false,
      deferredSocialDataMode: "",
      deferredSocialDataLoading: false,
      deferredSocialDataPromise: null,
      deferredSocialDataRequestMode: "",
      publicVisits: [],
      siteSuggestions: [],
      plantObservations: [],
      mapStories: [],
      mapStoryVotes: [],
      mapStoryRefreshTimer: null,
      learningPaths: [],
      learningPathBySlug: new Map(),
      learningPathsDirectusRequested: false,
      learningPathsDirectusPromise: null,
      learningPathProgress: loadGuidedLearningPathProgress(),
      guidedPathsExpanded: false,
      activeLearningPathSlug: "",
      activeLearningPathStopIndex: 0,
      activeLearningPathShowOnly: true,
      leafletLearningPathLayer: null,
      languageQuizAttempts: [],
      profileLoginRewards: [],
      artworkPrintPurchases: [],
      supportSettings: null,
      contributorSession: loadContributorSession(),
      passwordResetToken: ROUTE_UTILS.passwordResetTokenFromUrl(window.location),
      timelineEvents: [],
      todoMapTasks: [],
      placeNameAreas: { type: "FeatureCollection", features: [] },
      siteById: new Map(),
      siteBySlug: new Map(),
      wikiById: new Map(),
      wikiBySlug: new Map(),
      contentBySlug: new Map(),
      blogBySlug: new Map(),
      eventBySlug: new Map(),
      searchIndex: [],
      linkTerms: [],
      addressResults: [],
      addressSearchToken: 0,
      deepSearchToken: 0,
      deepSearchResults: [],
      deepSearchLoading: false,
      addressMarker: null,
      addressPopup: null,
      suggestionMarker: null,
      timelineIconJump: null,
      timelineIconOffset: 0,
      timelineIconJumpTimers: [],
      siteAttentionPulseTimer: null,
      siteAttentionPulseStartedAt: 0,
      loadedMapIconKeys: new Set(),
      failedMapIconKeys: new Set(),
      archiveLayerHandlers: new Map(),
      timelineHighlightTimer: null,
      lastHoverMove: 0,
      activeHoverFeatureKey: "",
      activeHoverGeometryKey: "",
      activeLeafletHoverFeatureKey: "",
      leafletHoverCard: null,
      leafletHoverCardSize: null,
      leafletHoverHydrationRequested: false,
      leafletHoverHydrationTimer: null,
      leafletHoverRefreshTimer: null,
      leafletViewportRenderTimer: null,
      leafletPriorityHoverKey: "",
      leafletPriorityHoverLngLat: null,
      timelineById: new Map(),
      timelineEventsForCache: new Map(),
      timelineSortValueCache: new WeakMap(),
      timelineYearValueCache: new WeakMap(),
      timelineEraForCache: new WeakMap(),
      timelineRangePercentCache: new WeakMap(),
      activeTimelineEventId: null,
      timelineContextEventIds: [],
      timelineZoom: 1,
      timelinePan: 0,
      timelineDragging: false,
      timelineDragStartX: 0,
      timelineDragStartPan: 0,
      userMapInteractionAt: 0,
      mapAutoMovingUntil: 0,
      activityHiddenForArticle: true,
      activityForceOpen: false,
      activityScrollTimer: null,
      activityScrollResetTimer: null,
      activityScrollPaused: false,
      activityScrollListenersReady: false,
      activityRenderTimer: null,
      activityRenderToken: 0,
      siteListFilterSyncTimer: null,
      siteListItemCache: new Map(),
      siteListPublishedSitesCache: null,
      notificationPanelOpen: false,
      feedbackScreenshotFile: null,
      contributorSortMode: "alpha",
      memberUsageSessionStartedAt: Date.now(),
      memberUsageLastFlushAt: 0,
      memberUsageFlushedSeconds: 0,
      memberUsageSessionRecorded: false,
      memberUsageFlushPromise: null,
      memberUsageLoadedProfileIds: new Set(),
      accountRegistrations: [],
      activeContent: null,
      detailCache: {
        sites: new Map(),
        wiki: new Map(),
        pages: new Map(),
        blog: new Map()
      },
      siteSearchSectionsBySlug: new Map(),
      siteSearchDataLoaded: false,
      siteSearchDataPromise: null,
      featureCache: new Map(),
      featurePreviewCache: new Map(),
      activeFilterSetCache: new Map(),
      siteEraKeysCache: new WeakMap(),
      featureEraKeysCache: new WeakMap(),
      siteDisplayGeometryCache: new WeakMap(),
      geometryBoundsCache: new WeakMap(),
      relatedSitesCache: new Map(),
      relatedSiteIndexCache: null,
      mediaMap: {},
      basemap: "road",
      panelHistory: [],
      landMaskData: null,
      landMaskPromise: null,
      waterMask: null,
      map: null,
      leafletMap: null,
      leafletArchiveLayer: null,
      leafletStaticArchiveLayer: null,
      leafletPointArchiveLayer: null,
      leafletPathArchiveLayer: null,
      leafletStaticRenderSignature: "",
      leafletRenderedPointBounds: null,
      leafletProgressivePointLayer: null,
      leafletProgressivePointTimer: null,
      leafletProgressivePointToken: 0,
      leafletProgressivePointDripActive: false,
      leafletBiographyPathLayer: null,
      leafletBiographyPeopleLayer: null,
      leafletBiographyPeopleSignature: "",
      biographyPeopleVisibleSlugs: new Set(),
      biographyPeopleProgressiveActive: false,
      biographyPeopleProgressiveTimer: null,
      biographyPeopleProgressiveToken: 0,
      biographyPeopleProgressiveSignature: "",
      biographyPathMarkers: [],
      leafletBiographyPersonMarkers: [],
      leafletWhalingWhaleMarker: null,
      whalingWhaleMapboxMarker: null,
      whalingWhaleAnimationFrame: null,
      whalingWhaleLastAnimationAt: 0,
      followedWhalingWhale: false,
      whalingWhaleFollowLastCenteredAt: 0,
      leafletMovingDogMarker: null,
      movingDogMapboxMarker: null,
      movingDogAnimationFrame: null,
      movingDogLastAnimationAt: 0,
      biographyPersonPathCache: new Map(),
      biographyPersonPathCacheKey: "",
      biographyPersonMotionTimelineCache: new Map(),
      biographyMappedGeometryCache: new Map(),
      biographyWaterCoordinateCache: new Map(),
      biographyPersonMotionStartedAt: new Map(),
      biographyPersonQuoteSchedules: new Map(),
      biographyPersonQuoteAutoSchedules: new Map(),
      biographyPersonQuoteTypeStates: new Map(),
      biographyPersonQuoteEncounterPairs: new Map(),
      biographyPersonQuoteLastAutoAt: 0,
      biographyPeopleAnimationFrame: null,
      biographyPeopleAnimationDelayTimer: null,
      biographyPeopleLastAnimationAt: 0,
      followedBiographySlug: "",
      biographyFollowLastCenteredAt: 0,
      leafletBaseLayer: null,
      leafletCanvasRenderer: null,
      leafletPlaceNameAreaRenderer: null,
      leafletPlaceNameAreaLabelLayer: null,
      leafletRenderSignature: "",
      leafletStartupFullRenderPending: false,
      leafletStartupFullRenderTimer: null,
      leafletStartupProgressiveRenderScheduled: false,
      leafletStartupPointDripUsed: false,
      leafletStartupPinsVisibleReady: false,
      leafletBiographyStartupDeferred: false,
      loadingScreenHideRequested: false,
      usingLeafletFallback: false,
      suggestionMapPickMode: false,
      approvalRefreshInFlight: false,
      archiveMapEventsBound: false,
      mapFeatureTapClaimUntil: 0,
      mapFeatureTapClaimX: null,
      mapFeatureTapClaimY: null
    };
    const DEFAULT_WHY_THIS_MATTERS_OVERRIDES = {
      "garvies-point-site": "Shell middens and Archaic-period tools at Garvie's Point help visitors understand Native Long Island in deep time, through generations of Indigenous knowledge, coastal foodways, and careful use of local stone, shellfish, and shoreline environments. The lesson is also about protection: erosion, development, and collecting have damaged many coastal archaeological places, so attention stays on the public museum and preserve rather than vulnerable deposits. Learning here should build respect for Native continuity and for the responsibility to preserve what remains.",
      "shinnecock-indian-reservation": "The Shinnecock Indian Reservation is a self-governing homeland with more than 1,200 enrolled members, community institutions, a shellfish hatchery, museum, education center, and a powwow held every Labor Day weekend since 1946. The present-day takeaway is that this is not only a historic place on a map; it is a living Native nation where sovereignty, culture, language, and community continue in public view."
    };
    const WHY_THIS_MATTERS_OVERRIDES = {
      ...DEFAULT_WHY_THIS_MATTERS_OVERRIDES,
      ...(window.NLI_WHY_THIS_MATTERS_OVERRIDES || {})
    };

    const statusEl = document.getElementById("status");
    const articleEl = document.getElementById("article");
    const articleHeadEl = document.getElementById("article-head");
    const articleBodyEl = document.getElementById("article-body");
    const bannerEl = document.getElementById("banner");
    const languageQuizModalEl = document.getElementById("language-quiz-modal");
    const loadingScreenEl = document.getElementById("loading-screen");
    const loadingMessageEl = document.getElementById("loading-message");
    const searchEl = document.getElementById("search");
    const supportDonateButtonEl = document.getElementById("support-donate-button");
    const learnPathsToggleEl = document.getElementById("learn-paths-toggle");
    const siteTitleRotatorEl = document.getElementById("site-title-rotator");
    const suggestionsEl = document.getElementById("suggestions");
    const markerToggle = document.getElementById("show-markers");
    const polygonToggle = document.getElementById("show-polygons");
    const exhibitToggle = document.getElementById("show-exhibits");
    const biographyPathsToggle = document.getElementById("show-biography-paths");
    const categoryToggles = [...document.querySelectorAll(".category-toggle")];
    const accessToggles = [...document.querySelectorAll(".access-toggle")];
    const themeToggles = [...document.querySelectorAll(".theme-toggle")];
    const placeNameAreaToggle = themeToggles.find(input => input.value === "place-name-areas") || null;
    const eraToggles = [...document.querySelectorAll(".era-toggle")];
    eraToggles.forEach(input => {
      input.checked = true;
      input.defaultChecked = true;
    });
    const navButtons = [...document.querySelectorAll("[data-view]")];
    const basemapSelect = document.getElementById("basemap-select");
    const suggestMapPickInstructionsEl = document.getElementById("suggest-map-pick-instructions");
    const suggestMapPickCancelBtn = document.getElementById("suggest-map-pick-cancel");
    const controlMenu = document.querySelector(".control-menu");
    const topbarEl = document.querySelector(".topbar");
    const brandEl = document.querySelector(".brand");
    const toolsEl = document.querySelector(".tools");
    const mainMenuEl = document.getElementById("main-menu");
    const mainMenuGridEl = mainMenuEl?.querySelector(".main-menu-grid");
    const mainOverflowMenuEl = document.getElementById("main-overflow-menu");
    const mainOverflowGridEl = document.getElementById("main-overflow-grid");
    const mainMenuOverflowItems = mainMenuGridEl ? [...mainMenuGridEl.children].filter(item => item !== mainOverflowMenuEl) : [];
    const guidedPathsEl = document.getElementById("guided-paths");
    const guidedPathsCollapsedEl = document.getElementById("guided-paths-collapsed");
    const guidedPathsDrawerEl = document.getElementById("guided-paths-drawer");
    const closeArticleBtn = document.getElementById("close-article");
    const mediaLightboxEl = document.getElementById("media-lightbox");
    const mediaCloseBtn = document.getElementById("media-close");
    const mediaImageEl = document.getElementById("media-image");
    const timelineDockEl = document.getElementById("timeline-dock");
    const dailyCardStackEl = document.getElementById("daily-card-stack");
    const dailyDidYouKnowCardEl = document.getElementById("daily-did-you-know-card");
    const dailyLearningCardEl = document.getElementById("daily-learning-card");
    const timelineTrackEl = document.getElementById("timeline-track");
    const timelineSummaryEl = document.getElementById("timeline-summary");
    const timelineCollapseBtn = document.getElementById("timeline-collapse");
    const timelineZoomInBtn = document.getElementById("timeline-zoom-in");
    const timelineZoomOutBtn = document.getElementById("timeline-zoom-out");
    const timelinePrevBtn = document.getElementById("timeline-prev");
    const timelineNextBtn = document.getElementById("timeline-next");
    const timelineExpandBtn = document.getElementById("timeline-expand");
    const timelinePanEl = document.getElementById("timeline-pan");
    const timelineHoverEl = document.getElementById("timeline-hover-card");
    const profileHoverEl = document.getElementById("profile-hover-card");
    const quoteTickerEl = document.getElementById("quote-ticker");
    const activityPanelEl = document.getElementById("activity-panel");
    const activityBodyEl = document.getElementById("activity-body");
    const activityCollapseBtn = document.getElementById("activity-collapse");
    const activityRestoreBtn = document.getElementById("activity-restore");
    const notificationRestoreBtn = document.getElementById("notification-restore");
    const notificationPanelEl = document.getElementById("notification-panel");
    const notificationBodyEl = document.getElementById("notification-body");
    const notificationCloseBtn = document.getElementById("notification-close");
    const hoverPopup = window.mapboxgl?.Popup ? new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      className: "hover-card"
    }) : {
      remove() {},
      setLngLat() { return this; },
      setHTML() { return this; },
      addTo() { return this; }
    };
    if (window.matchMedia("(max-width: 420px)").matches) controlMenu?.removeAttribute("open");

    function desktopMenuOverflowPriority(item) {
      if (!item) return 5;
      if (item.matches?.('[data-view="about"], [data-view="feedback"], .layer-menu')) return 0;
      if (item.matches?.('[data-view="home"], [data-view="site-list"], [data-view="blog"], #contributor-login-button')) return 1;
      if (item.matches?.('[data-view="support"], [data-view="contact"]')) return 2;
      if (item.matches?.('[data-view="contributors"], [data-view="suggest-site"], [data-view="knowledgebase"], [data-view="events"]')) return 3;
      if (item.matches?.("#learn-paths-toggle")) return 1;
      if (item.matches?.(".admin-menu, .admin-chip, .map-select")) return 5;
      return 4;
    }

    function itemIsVisibleMenuControl(item) {
      if (!item || item.hidden) return false;
      if (item.matches?.(".admin-chip") && getComputedStyle(item).display === "none") return false;
      return true;
    }

    function restoreDesktopMenuItems() {
      if (!mainMenuGridEl || !mainOverflowMenuEl || !mainOverflowGridEl) return;
      mainMenuOverflowItems.forEach(item => mainMenuGridEl.insertBefore(item, mainOverflowMenuEl));
      mainOverflowMenuEl.hidden = true;
      mainOverflowMenuEl.removeAttribute("open");
    }

    function layoutDesktopMenuOverflow() {
      if (!mainMenuGridEl || !mainOverflowMenuEl || !mainOverflowGridEl || !mainMenuOverflowItems.length) return;
      restoreDesktopMenuItems();
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
      const maxRight = viewportWidth - 14;
      const overflows = () => {
        const toolsRect = toolsEl?.getBoundingClientRect();
        const gridRect = mainMenuGridEl.getBoundingClientRect();
        return Boolean(
          toolsRect && toolsRect.right > maxRight + 1 ||
          gridRect.right > maxRight + 1 ||
          toolsEl && toolsEl.scrollWidth > toolsEl.clientWidth + 1 ||
          mainMenuGridEl.scrollWidth > mainMenuGridEl.clientWidth + 1
        );
      };
      const overflowItems = new Set();
      const candidates = mainMenuOverflowItems
        .map((item, index) => ({ item, index, priority: desktopMenuOverflowPriority(item) }))
        .filter(entry => itemIsVisibleMenuControl(entry.item))
        .sort((a, b) => b.priority - a.priority || b.index - a.index);
      let guard = 0;
      while (overflows() && candidates.length && guard < mainMenuOverflowItems.length + 2) {
        const next = candidates.shift();
        if (!next) break;
        overflowItems.add(next.item);
        mainOverflowMenuEl.hidden = false;
        mainMenuOverflowItems.forEach(item => {
          if (overflowItems.has(item)) mainOverflowGridEl.appendChild(item);
        });
        guard += 1;
      }
      if (!overflowItems.size) {
        mainOverflowMenuEl.hidden = true;
      }
    }

    function updateResponsiveTopbar() {
      if (!topbarEl || !toolsEl || !mainMenuEl) return;
      const setTopbarClearance = () => {
        const rect = topbarEl.getBoundingClientRect();
        const brandRect = brandEl?.getBoundingClientRect();
        const clearance = Math.max(56, Math.ceil(rect.bottom));
        const brandClearance = Math.max(56, Math.ceil(brandRect?.bottom || rect.bottom));
        document.documentElement.style.setProperty("--topbar-clearance", `${clearance}px`);
        document.documentElement.style.setProperty("--brand-clearance", `${brandClearance}px`);
        return rect;
      };
      if (window.matchMedia("(max-width: 860px)").matches) {
        document.body.classList.remove("nav-collapsed");
        toolsEl.style.removeProperty("--toolbar-available-width");
        document.documentElement.style.removeProperty("--guided-paths-left");
        document.documentElement.style.removeProperty("--guided-paths-right");
        mainMenuEl.setAttribute("open", "");
        layoutDesktopMenuOverflow();
        setTopbarClearance();
        return;
      }
      document.body.classList.remove("nav-collapsed");
      mainMenuEl.setAttribute("open", "");
      toolsEl.style.removeProperty("--toolbar-available-width");
      setTopbarClearance();
      const brandRect = brandEl?.getBoundingClientRect();
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
      const toolsLeft = Math.ceil((brandRect?.right || 14) + 8);
      const availableWidth = Math.max(300, viewportWidth - toolsLeft - 14);
      toolsEl.style.setProperty("--toolbar-available-width", `${availableWidth}px`);
      const toolsRect = toolsEl.getBoundingClientRect();
      const menuGrid = mainMenuEl.querySelector(".main-menu-grid");
      const menuRect = menuGrid?.getBoundingClientRect();
      const searchRect = searchEl?.closest(".search-wrap")?.getBoundingClientRect();
      document.body.classList.remove("nav-collapsed");
      mainMenuEl.setAttribute("open", "");
      layoutDesktopMenuOverflow();
      setTopbarClearance();
      const finalToolsRect = toolsEl.getBoundingClientRect();
      const shortcutLeft = Math.max(14, Math.min(viewportWidth - 100, Math.round(finalToolsRect.left)));
      const shortcutTop = Math.max(64, Math.round(finalToolsRect.bottom + 10));
      document.documentElement.style.setProperty("--desktop-shortcut-left", `${shortcutLeft}px`);
      document.documentElement.style.setProperty("--desktop-shortcut-top", `${shortcutTop}px`);
      document.documentElement.style.setProperty("--guided-paths-left", `${shortcutLeft}px`);
      document.documentElement.style.setProperty("--guided-paths-right", "14px");
      window.requestAnimationFrame(fitGuidedLearningPathQuickButtons);
    }

    let topbarResizeFrame = null;
    function scheduleResponsiveTopbar() {
      if (topbarResizeFrame) window.cancelAnimationFrame(topbarResizeFrame);
      topbarResizeFrame = window.requestAnimationFrame(() => {
        topbarResizeFrame = null;
        updateResponsiveTopbar();
      });
    }

    scheduleResponsiveTopbar();
    window.addEventListener("resize", scheduleResponsiveTopbar);
    window.addEventListener("orientationchange", scheduleResponsiveTopbar);
    window.addEventListener("load", scheduleResponsiveTopbar);


    function startSiteTitleRotation() {
      if (!siteTitleRotatorEl) return;
      const titles = [
        "Native Long Island",
        "Sewanhacky (The Isle of Shells)",
        "Paumanack (The Land of Tribute)"
      ];
      let index = 0;
      const updateTitleLinkState = () => {
        const isLanguageName = /^(sew?anhacky|paumanack)\b/i.test(siteTitleRotatorEl.textContent || "");
        siteTitleRotatorEl.classList.toggle("is-language-link", isLanguageName);
        siteTitleRotatorEl.setAttribute("aria-disabled", isLanguageName ? "false" : "true");
        siteTitleRotatorEl.setAttribute("tabindex", isLanguageName ? "0" : "-1");
        siteTitleRotatorEl.setAttribute("title", isLanguageName ? "Read about Native place names" : "");
      };
      updateTitleLinkState();
      window.setInterval(() => {
        index = (index + 1) % titles.length;
        siteTitleRotatorEl.classList.add("is-changing");
        window.setTimeout(() => {
          siteTitleRotatorEl.textContent = titles[index];
          updateTitleLinkState();
          siteTitleRotatorEl.classList.remove("is-changing");
        }, 420);
      }, 7000);
    }

    startSiteTitleRotation();

    function openLanguageWikiFromTitle(event) {
      if (!siteTitleRotatorEl?.classList.contains("is-language-link")) return;
      event.preventDefault();
      event.stopPropagation();
      const article = state.wikiBySlug?.get("language") || { slug: "language", title: "Language" };
      openWikiArticle(article, { source: "Project title" });
    }

    const ICONS = {
      expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5"/><path d="M3 3l7 7"/><path d="M16 3h5v5"/><path d="M21 3l-7 7"/><path d="M8 21H3v-5"/><path d="M3 21l7-7"/><path d="M16 21h5v-5"/><path d="M21 21l-7-7"/></svg>',
      shrink: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3v7H3"/><path d="M3 10l7-7"/><path d="M14 3v7h7"/><path d="M21 10l-7-7"/><path d="M10 21v-7H3"/><path d="M3 14l7 7"/><path d="M14 21v-7h7"/><path d="M21 14l-7 7"/></svg>',
      minimize: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
      restore: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9z"/></svg>',
      comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-8.6 8.2 9 9 0 0 1-3.9-.9L3 20l1.4-4.6a7.8 7.8 0 0 1-.9-3.8 8.4 8.4 0 0 1 8.6-8.2 8.4 8.4 0 0 1 8.9 8.1Z"/></svg>',
      share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>'
    };

    function repairTimelineControls() {
      if (timelineZoomOutBtn) timelineZoomOutBtn.textContent = "-";
      if (timelineZoomInBtn) timelineZoomInBtn.textContent = "+";
      if (timelinePrevBtn) timelinePrevBtn.textContent = "<";
      if (timelineNextBtn) timelineNextBtn.textContent = ">";
      if (timelineExpandBtn) timelineExpandBtn.innerHTML = timelineDockEl?.classList.contains("large") ? ICONS.shrink : ICONS.expand;
      if (timelineCollapseBtn) timelineCollapseBtn.innerHTML = timelineDockEl?.classList.contains("collapsed") ? ICONS.restore : ICONS.minimize;
    }

    repairTimelineControls();

    const expandArticleBtn = document.createElement("button");
    expandArticleBtn.className = "expand icon-button";
    expandArticleBtn.type = "button";
    expandArticleBtn.setAttribute("aria-label", "Expand article panel");
    expandArticleBtn.setAttribute("title", "Expand article panel");
    expandArticleBtn.innerHTML = ICONS.expand;
    articleEl.appendChild(expandArticleBtn);
    const backArticleBtn = document.createElement("button");
    backArticleBtn.className = "panel-back";
    backArticleBtn.type = "button";
    backArticleBtn.textContent = "Back";
    articleEl.appendChild(backArticleBtn);
    const articleResizeHandle = document.createElement("button");
    articleResizeHandle.className = "article-resize";
    articleResizeHandle.type = "button";
    articleResizeHandle.setAttribute("aria-label", "Resize article panel");
    articleResizeHandle.setAttribute("title", "Drag to resize article panel");
    articleEl.appendChild(articleResizeHandle);
    const articleHeroDockEl = document.createElement("div");
    articleHeroDockEl.className = "article-hero-dock";
    articleHeroDockEl.setAttribute("aria-hidden", "true");
    articleEl.appendChild(articleHeroDockEl);
    let articleHeroHomeNode = null;

    function setArticlePanelWidth(width) {
      const max = Math.max(360, Math.min(window.innerWidth - 28, Math.round(window.innerWidth * 0.72)));
      const next = Math.max(320, Math.min(max, Math.round(width)));
      articleEl.style.setProperty("--article-width", `${next}px`);
      document.body.style.setProperty("--article-width", `${next}px`);
      localStorage.setItem("nli-article-panel-width", String(next));
    }

    function restoreArticlePanelWidth() {
      const saved = Number(localStorage.getItem("nli-article-panel-width") || 0);
      if (Number.isFinite(saved) && saved > 0) setArticlePanelWidth(saved);
    }
    restoreArticlePanelWidth();

    function rememberPanel() {
      if (!articleEl.classList.contains("open")) return;
      restoreArticleHeroToBody();
      state.panelHistory.push({
        head: articleHeadEl.innerHTML,
        body: articleBodyEl.innerHTML,
        expanded: articleEl.classList.contains("expanded")
      });
      if (state.panelHistory.length > 20) state.panelHistory.shift();
      updateBackButton();
    }

    function updateBackButton() {
      backArticleBtn.classList.toggle("show", state.panelHistory.length > 0);
    }

    function resetArticleScroll() {
      restoreArticleHeroToBody();
      articleBodyEl.scrollTop = 0;
      articleEl.scrollTop = 0;
      syncArticleHeroScrollState();
    }

    function articleHeroElement() {
      return articleBodyEl?.querySelector(".article-sticky-hero") || articleHeroDockEl?.querySelector(".article-sticky-hero");
    }

    function animateArticleHeroMove(hero, move) {
      const first = hero.getBoundingClientRect();
      move();
      const last = hero.getBoundingClientRect();
      if (!first.width || !first.height || !last.width || !last.height) return;
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      const sx = first.width / last.width;
      const sy = first.height / last.height;
      hero.classList.add("is-moving");
      hero.style.transformOrigin = "top left";
      hero.style.transition = "none";
      hero.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      hero.getBoundingClientRect();
      window.requestAnimationFrame(() => {
        hero.style.transition = "transform 240ms ease, border-radius 240ms ease, box-shadow 240ms ease";
        hero.style.transform = "translate(0, 0) scale(1, 1)";
        window.setTimeout(() => {
          hero.classList.remove("is-moving");
          hero.style.transform = "";
          hero.style.transformOrigin = "";
          hero.style.transition = "";
        }, 280);
      });
    }

    function restoreArticleHeroToBody({ animate = false } = {}) {
      const hero = articleHeroDockEl?.querySelector(".article-sticky-hero");
      if (!hero) {
        articleEl.classList.remove("hero-docked");
        articleHeroDockEl.setAttribute("aria-hidden", "true");
        return;
      }
      const move = () => {
        hero.classList.remove("is-compact");
        if (articleHeroHomeNode?.parentNode) articleHeroHomeNode.replaceWith(hero);
        else articleBodyEl.prepend(hero);
        articleHeroHomeNode = null;
        articleHeroDockEl.setAttribute("aria-hidden", "true");
        articleEl.classList.remove("hero-docked");
      };
      if (animate) animateArticleHeroMove(hero, move);
      else move();
    }

    function syncArticleHeroScrollState() {
      const hero = articleHeroElement();
      if (!hero) return;
      const scrollTop = articleBodyEl.scrollTop || 0;
      if (scrollTop > 0 && !articleHeroDockEl.contains(hero)) {
        animateArticleHeroMove(hero, () => {
          articleHeroHomeNode = document.createComment("article hero home");
          hero.replaceWith(articleHeroHomeNode);
          articleHeroDockEl.appendChild(hero);
          articleHeroDockEl.removeAttribute("aria-hidden");
          articleEl.classList.add("hero-docked");
          hero.classList.add("is-compact");
        });
      } else if (scrollTop <= 0 && articleHeroDockEl.contains(hero)) {
        restoreArticleHeroToBody({ animate: true });
      }
      if (articleHeroDockEl.contains(hero)) hero.classList.toggle("is-compact", scrollTop > 0);
    }

    new MutationObserver(() => {
      if (!articleHeroHomeNode || articleHeroHomeNode.isConnected) return;
      articleHeroDockEl.querySelector(".article-sticky-hero")?.remove();
      articleHeroHomeNode = null;
      articleHeroDockEl.setAttribute("aria-hidden", "true");
      articleEl.classList.remove("hero-docked");
    }).observe(articleBodyEl, { childList: true });

    function clearActiveTimelineEvent() {
      state.activeTimelineEventId = null;
      state.timelineContextEventIds = [];
      document.querySelectorAll(".timeline-card.active").forEach(item => item.classList.remove("active"));
      document.querySelectorAll(".historic-moment.active").forEach(item => item.classList.remove("active"));
      updateTimelineContextLines();
      updateTimelineCurrentLine();
    }

    function markArticlePanelOpen() {
      articleEl.classList.add("open");
      document.body.classList.add("article-panel-open");
      if (window.innerWidth > 860) {
        state.activityHiddenForArticle = true;
        renderActivityPanel();
      }
      window.requestAnimationFrame(syncFloatingPanelLayout);
    }

    function restorePreviousPanel() {
      const previous = state.panelHistory.pop();
      if (!previous) return;
      restoreArticleHeroToBody();
      articleHeadEl.innerHTML = previous.head;
      articleBodyEl.innerHTML = previous.body;
      articleEl.classList.toggle("expanded", previous.expanded);
      markArticlePanelOpen();
      updateBackButton();
    }

    function collapseActivityPanel({ persist = false } = {}) {
      if (!activityPanelEl || activityPanelEl.hidden) return;
      if (persist) localStorage.setItem("nli-latest-activity-hidden", "1");
      renderActivityPanel({ preserveBody: true });
    }

    function syncFloatingPanelLayout() {
      const dailyCardsVisible = Boolean(
        dailyCardStackEl &&
        !dailyCardStackEl.hidden &&
        window.getComputedStyle(dailyCardStackEl).display !== "none"
      );
      document.body.classList.toggle("daily-cards-visible", dailyCardsVisible);
      if (!dailyCardsVisible) {
        document.documentElement.style.removeProperty("--daily-card-control-clearance");
      }
      if (!activityPanelEl) return;
      const top = activityPanelEl.getBoundingClientRect().top || 156;
      const maxHeight = Math.max(180, Math.floor(window.innerHeight - top - 24));
      activityPanelEl.style.setProperty("--activity-max-height", `${maxHeight}px`);
      if (!dailyCardsVisible) return;
      dailyCardStackEl.classList.remove("avoid-activity-control");
      const activityControl = !activityRestoreBtn.hidden
        ? activityRestoreBtn
        : activityPanelEl.classList.contains("collapsed")
          ? activityPanelEl
          : null;
      if (activityControl) {
        const controlRect = activityControl.getBoundingClientRect();
        const dailyRect = dailyCardStackEl.getBoundingClientRect();
        const overlaps = !(dailyRect.left > controlRect.right + 10 ||
          dailyRect.right < controlRect.left - 10 ||
          dailyRect.top > controlRect.bottom + 10 ||
          dailyRect.bottom < controlRect.top - 10);
        dailyCardStackEl.classList.toggle("avoid-activity-control", overlaps && window.innerWidth > 860);
      }
      const finalDailyRect = dailyCardStackEl.getBoundingClientRect();
      const controlClearance = Math.ceil(Math.max(14, window.innerWidth - finalDailyRect.left + 14));
      document.documentElement.style.setProperty("--daily-card-control-clearance", `${controlClearance}px`);
    }

    function normalizeImportedText(value) {
      return String(value || "")
        .replace(/\\+(?=(?:&(?:quot|#0?39|apos|amp|nbsp|rsquo|lsquo|ldquo|rdquo);)|["'])/gi, "")
        .replace(/\\{2,}/g, "\\")
        .replace(/Â /g, " ")
        .replace(/Â/g, "")
        .replace(/â€™|&#8217;|&rsquo;/g, "'")
        .replace(/â€˜|&#8216;|&lsquo;/g, "'")
        .replace(/â€œ|&#8220;|&ldquo;/g, "\"")
        .replace(/â€|&#8221;|&rdquo;/g, "\"")
        .replace(/â€“|&#8211;/g, "-")
        .replace(/â€”|&#8212;/g, "-")
        .replace(/&quot;/g, "\"")
        .replace(/&#0?39;|&apos;/g, "'")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+([,.;:!?])/g, "$1")
        .replace(/\.{2,}/g, ".")
        .replace(/\s+/g, " ");
    }

    function convertImportedFootnotes(value) {
      return HTML_UTILS.convertImportedFootnotes(value, { escapeHtml, normalizeImportedText });
    }

    function importedFootnoteSources(value) {
      return SHARED_UTILS.importedFootnoteSources(value, {
        cleanText: stripHtml,
        normalizeText: normalizeImportedText
      });
    }

    const removeFootnoteReferenceMarkers = SHARED_UTILS.removeFootnoteReferenceMarkers;

    function stripHtml(value) {
      return HTML_UTILS.stripHtml(value, { convertImportedFootnotes });
    }

    function cleanHtml(value) {
      return HTML_UTILS.cleanHtml(value, { mode: "desktop", convertImportedFootnotes, rewriteMediaUrl, internalHref, isMediaUrl });
    }

    function publicCleanText(value) {
      return HTML_UTILS.publicCleanText(value, { normalizeImportedText, stripHtml });
    }

    function formatSectionContent(title, content) {
      const html = cleanHtml(content);
      const shouldRenderTimeline = HTML_UTILS.shouldRenderSectionTimeline(title);
      if (!shouldRenderTimeline) return html;
      return timelineHtml(html) || html;
    }

    function sourceAwareSectionHtml(title, content, options = {}) {
      const sourceNote = importedFootnoteSources(content).join("; ");
      const html = removeFootnoteReferenceMarkers(formatSectionContent(title, content));
      return `
        <section class="section${sourceNote ? " has-source" : ""}">
          <h3>${escapeHtml(title)}</h3>
          <div class="section-content">${autoLinkHtml(html, options)}</div>
          ${sourceNote ? `
            <button class="timeline-source-info" type="button" data-timeline-source-info data-source-reference="${escapeHtml(sourceNote)}" aria-label="Show source reference" title="${escapeHtml(sourceNote)}">i</button>
            <div class="timeline-source-popover" role="note">
              <div>${escapeHtml(sourceNote)}</div>
              <span class="timeline-source-copy-hint">Click the icon to copy reference to clipboard.</span>
              <span class="timeline-source-copy-confirm">Source reference copied.</span>
            </div>
          ` : ""}
        </section>
      `;
    }

    function timelineHtml(html) {
      return SHARED_UTILS.sectionTimelineHtml(html, {
        stripHtml,
        renderTimelineRun: events => `
          <div class="historic-moments section-derived-timeline">
            ${events.map(event => {
              const rawBody = event.nodes.join("") || "<p></p>";
              const sourceNote = importedFootnoteSources(rawBody).join("; ");
              const bodyHtml = removeFootnoteReferenceMarkers(cleanHtml(rawBody));
              return `
                <article class="historic-moment section-derived-moment">
                  <div class="historic-moment-date">${escapeHtml(event.year)}</div>
                  <div class="historic-moment-body">${bodyHtml}</div>
                  ${sourceNote ? `
                    <button class="timeline-source-info" type="button" data-timeline-source-info data-source-reference="${escapeHtml(sourceNote)}" aria-label="Show source" title="${escapeHtml(sourceNote)}">i</button>
                    <div class="timeline-source-popover" role="note">
                      <div>${escapeHtml(sourceNote)}</div>
                      <span class="timeline-source-copy-hint">Click the icon to copy reference to clipboard.</span>
                      <span class="timeline-source-copy-confirm">Source reference copied.</span>
                    </div>
                  ` : ""}
                </article>
              `;
            }).join("")}
          </div>
        `
      });
    }

    function isMediaUrl(value) {
      return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(String(value || ""));
    }

    function rewriteMediaUrl(url) {
      return MEDIA_UTILS.rewriteMediaUrl(url, { mediaMap: state.mediaMap, baseHref: window.location.href });
    }

    function internalHref(value) {
      return ROUTE_UTILS.internalHref(value, {
        parseQuery: false,
        pageRoutePrefix: "page-",
        excludedPageSlugs: ["listing", "wiki", "wp-admin", "wp-content"],
        isBlogSlug: slug => state.blogBySlug.has(slug)
      });
    }

    const escapeHtml = SHARED_UTILS.escapeHtml;

    const profileJoinedDateValue = PROFILE_UTILS.profileJoinedDateValue;

    const profileAccountAgeLabel = PROFILE_UTILS.profileAccountAgeLabel;

    const profileUserSinceLine = PROFILE_UTILS.profileUserSinceLine;

    function shuffledQuoteTickerItems() {
      const items = [...MAP_QUOTE_TICKER_ITEMS];
      for (let index = items.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [items[index], items[swap]] = [items[swap], items[index]];
      }
      return items;
    }

    function quoteTickerNameHtml(item) {
      const name = escapeHtml(item.person);
      if (!item.wikiSlug) return name;
      return `<a class="quote-ticker-name" href="?wiki=${encodeURIComponent(item.wikiSlug)}" data-quote-ticker-wiki="${escapeHtml(item.wikiSlug)}">${name}</a>`;
    }

    function quoteTickerItemHtml(item) {
      return `
        <span class="quote-ticker-item">
          <span class="quote-ticker-quote">"${escapeHtml(item.quote)}"</span>
          <span class="quote-ticker-meta">- ${quoteTickerNameHtml(item)} | ${escapeHtml(item.year)} | ${escapeHtml(item.source)}</span>
        </span>`;
    }

    function renderQuoteTicker() {
      if (!quoteTickerEl) return;
      const ordered = shuffledQuoteTickerItems();
      const sequence = [...ordered, ...ordered, ...ordered, ...ordered];
      quoteTickerEl.innerHTML = `<div class="quote-ticker-track">${sequence.map(quoteTickerItemHtml).join("")}</div>`;
      const totalCharacters = sequence.reduce((sum, item) => sum + item.quote.length + item.person.length + item.source.length + 20, 0);
      quoteTickerEl.style.setProperty("--quote-ticker-duration", `${Math.max(180, Math.round(totalCharacters / 8))}s`);
      quoteTickerEl.classList.add("ready");
    }

    function showBanner(message) {
      bannerEl.textContent = message;
      bannerEl.classList.add("show");
      window.clearTimeout(state.bannerTimer);
      state.bannerTimer = window.setTimeout(() => bannerEl.classList.remove("show"), 4200);
    }

    renderQuoteTicker();

    function setInlineStatus(section, selector, message, status = "") {
      const statusEl = section?.querySelector(selector);
      if (!statusEl) return;
      statusEl.textContent = message || "";
      statusEl.hidden = !message;
      statusEl.classList.toggle("success", status === "success");
      statusEl.classList.toggle("error", status === "error");
    }

    function setSuggestionFormCoordinates(section, lngLat) {
      if (!section || !lngLat) return;
      const lng = Number(lngLat.lng ?? lngLat[0]);
      const lat = Number(lngLat.lat ?? lngLat[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      section.querySelector("[data-suggest-latitude]").value = lat.toFixed(6);
      section.querySelector("[data-suggest-longitude]").value = lng.toFixed(6);
      if (state.map && window.mapboxgl?.Marker) {
        const center = [lng, lat];
        if (!state.suggestionMarker) {
          state.suggestionMarker = new mapboxgl.Marker({ color: "#245f44" }).setLngLat(center).addTo(state.map);
        } else {
          state.suggestionMarker.setLngLat(center);
        }
      } else if (state.leafletMap && window.L) {
        const center = [lat, lng];
        if (!state.suggestionMarker) {
          state.suggestionMarker = L.marker(center, { title: "Suggested site location" }).addTo(state.leafletMap);
        } else if (state.suggestionMarker.setLatLng) {
          state.suggestionMarker.setLatLng(center);
        }
      }
      setInlineStatus(section, "[data-suggest-status]", "Pin location set.", "success");
    }

    function currentSuggestionPanel() {
      return articleBodyEl?.querySelector("[data-site-suggestion-panel]");
    }

    function setSuggestionMapPickMode(active) {
      state.suggestionMapPickMode = !!active;
      suggestMapPickInstructionsEl?.classList.toggle("show", !!active);
      if (state.map?.getCanvas) state.map.getCanvas().style.cursor = active ? "crosshair" : "";
      if (active) {
        articleEl.classList.remove("open");
        showBanner("Move and zoom the map, then click or tap once to pick the site.");
      }
    }

    function handleSuggestionMapPick(event) {
      if (!state.suggestionMapPickMode || !event?.lngLat) return false;
      const panel = currentSuggestionPanel();
      if (!panel) {
        setSuggestionMapPickMode(false);
        showBanner("Map pick canceled. Open Suggest Site to choose a location.");
        return true;
      }
      setSuggestionFormCoordinates(panel, event.lngLat);
      setSuggestionMapPickMode(false);
      markArticlePanelOpen();
      updateBackButton();
      showBanner("Suggestion pin set.");
      return true;
    }

    function handleSuggestionMapPickClick(event) {
      if (!handleSuggestionMapPick(event)) return false;
      event?.preventDefault?.();
      event?.originalEvent?.preventDefault?.();
      event?.originalEvent?.stopPropagation?.();
      return true;
    }

    function useCurrentLocationForSuggestion(section) {
      if (!navigator.geolocation) {
        setInlineStatus(section, "[data-suggest-status]", "Location is not available in this browser.", "error");
        return;
      }
      setInlineStatus(section, "[data-suggest-status]", "Getting your location...", "");
      navigator.geolocation.getCurrentPosition(position => {
        const lngLat = { lng: position.coords.longitude, lat: position.coords.latitude };
        setSuggestionFormCoordinates(section, lngLat);
        if (state.map?.easeTo) state.map.easeTo({ center: [lngLat.lng, lngLat.lat], zoom: Math.max(state.map.getZoom(), 13), duration: 650 });
      }, () => {
        setInlineStatus(section, "[data-suggest-status]", "Could not get your current location.", "error");
      }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
    }

    const numeric = SHARED_UTILS.numeric;

    function isLongIslandCoordinate(lng, lat) {
      return GEOMETRY_UTILS.coordinateWithinBounds(lng, lat, LONG_ISLAND_BOUNDS);
    }

    async function fetchJson(path, options = {}) {
      return directusClient.fetchJson(path, options);
    }

    async function fetchCachedPublicJson(path, cacheKey, ttl = PUBLIC_DIRECTUS_CACHE_TTL_MS) {
      return fetchJson(path, { cacheKey, ttl, fresh: false });
    }

    async function postDirectusItem(collection, payload, options = {}) {
      return directusClient.postItem(collection, payload, options);
    }

    async function triggerAdminNotificationAction(action, payload) {
      return directusClient.triggerReviewAction(action, payload, {
        flowIds: {
          approve: ADMIN_NOTIFICATION_FLOW_IDS.approveSuggestion,
          decline: ADMIN_NOTIFICATION_FLOW_IDS.declineSuggestion
        }
      });
    }

    async function patchDirectusItem(collection, id, payload, options = {}) {
      return directusClient.patchItem(collection, id, payload, options);
    }

    function mergePointEventRecords(records = []) {
      PROFILE_UTILS.mergeProfilePointEvents(state.profilePointEvents, records);
    }

    function localPointEventForKey(eventKey, profileId = null) {
      return PROFILE_UTILS.findProfilePointEventForKey(state.profilePointEvents, eventKey, profileId, { relationId });
    }

    function canonicalPointProfileIds(profile = currentContributorProfile?.()) {
      return PROFILE_UTILS.canonicalProfileIds(profile, state.contributorProfiles, PROFILE_UTILS.profileIdentityOptions(state.contributorSession, {
        relationId,
        extraNames: [state.contributorSession?.display_name, state.contributorSession?.displayName, state.contributorSession?.email, state.contributorSession?.username]
      }));
    }

    function profilePointEventsAreCanonical(profile = currentContributorProfile?.()) {
      const ids = canonicalPointProfileIds(profile);
      return Boolean(ids.length && ids.every(id => state.profilePointEventCanonicalIds.has(String(id))));
    }

    async function ensureCanonicalProfilePointEvents(profile = currentContributorProfile?.()) {
      const ids = canonicalPointProfileIds(profile);
      if (!ids.length || profilePointEventsAreCanonical(profile)) return true;
      const key = ids.join(",");
      if (state.profilePointEventSyncPromises.has(key)) return state.profilePointEventSyncPromises.get(key);
      const promise = fetchJson(`/items/mobile_point_events?limit=-1&filter[member_profile][_in]=${key}&fields=${INITIAL_POINT_EVENT_FIELDS}`, { fresh: true })
        .then(response => {
          state.profilePointEvents = PROFILE_UTILS.profilePointEventsWithoutProfileIds(state.profilePointEvents, ids, { relationId });
          mergePointEventRecords(response.data || []);
          ids.forEach(id => state.profilePointEventCanonicalIds.add(String(id)));
          return true;
        })
        .catch(error => {
          console.warn("Profile points will retry from Directus.", error);
          return false;
        })
        .finally(() => {
          state.profilePointEventSyncPromises.delete(key);
        });
      state.profilePointEventSyncPromises.set(key, promise);
      return promise;
    }

    async function refreshRemotePointEventsForProfileId(profileId) {
      const id = Number(profileId);
      if (!id) return [];
      const response = await fetchJson(`/items/mobile_point_events?limit=-1&filter[member_profile][_eq]=${id}&fields=${INITIAL_POINT_EVENT_FIELDS}`, { fresh: true });
      const incoming = response.data || [];
      state.profilePointEvents = PROFILE_UTILS.profilePointEventsWithoutProfileIds(state.profilePointEvents, [id], { relationId });
      mergePointEventRecords(incoming);
      state.profilePointEventCanonicalIds.add(String(id));
      return incoming;
    }

    async function refreshRemotePointEventForKey(eventKey, profileId) {
      const key = String(eventKey || "").trim();
      const id = Number(profileId);
      if (!key || !id) return null;
      const response = await fetchJson(`/items/mobile_point_events?limit=1&filter[event_key][_eq]=${encodeURIComponent(key)}&filter[member_profile][_eq]=${id}&fields=${INITIAL_POINT_EVENT_FIELDS}`, { fresh: true });
      const record = (response.data || [])[0] || null;
      if (record) mergePointEventRecords([record]);
      return record;
    }

    function activeContributorProfileId() {
      const profile = currentContributorProfile();
      return PROFILE_UTILS.activeContributorProfileId(profile, state.contributorSession?.profileId, { relationId });
    }

    async function recordProfilePointEvent(event = {}) {
      const profileId = Number(relationId(event.member_profile));
      const eventType = String(event.event_type || "");
      const payload = PROFILE_UTILS.profilePointEventPayload(event, { relationId });
      if (!payload) return null;
      if (PROFILE_UTILS.profilePointEventRequiresActiveProfile(eventType) && activeContributorProfileId() !== profileId) {
        console.warn("Refusing point write for a profile that is not the active login.", { eventType, profileId });
        return null;
      }
      const existing = localPointEventForKey(event.event_key, profileId);
      if (existing) return existing;
      const remoteExisting = await refreshRemotePointEventForKey(event.event_key, profileId).catch(() => null);
      if (remoteExisting) return remoteExisting;
      try {
        const created = await postDirectusItem("mobile_point_events", payload, { requireAuth: true });
        const record = created?.data ? { ...payload, ...created.data } : payload;
        mergePointEventRecords([record]);
        await refreshRemotePointEventsForProfileId(profileId).catch(() => []);
        return record;
      } catch (error) {
        const latest = await refreshRemotePointEventForKey(event.event_key, profileId).catch(() => null);
        if (latest) return latest;
        await refreshRemotePointEventsForProfileId(profileId).catch(() => []);
        return localPointEventForKey(event.event_key, profileId);
      }
    }

    function moderationCheck(value, label) {
      return window.NLI_MODERATION_UTILS.checkPublicText(value, label);
    }

    const profileSlugFromEmail = PROFILE_UTILS.profileSlugFromEmail;

    async function uploadDirectusFile(file, title, options = {}) {
      return SHARED_DIRECTUS.uploadDirectusFile(directusClient, file, title, options);
    }

    async function compressUploadImage(file, basename = "upload-image") {
      return MEDIA_UTILS.compressNamedImageFile(file, basename);
    }

    async function compressFeedbackImage(file) {
      return compressUploadImage(file, "feedback-screenshot");
    }

    async function prepareJpegUploadImage(file, basename = "upload-image") {
      return MEDIA_UTILS.prepareJpegUploadImage(file, { basename });
    }

    function isImageUploadFile(file) {
      return MEDIA_UTILS.isImageFileLike(file);
    }

    async function captureFeedbackScreenshot(section) {
      state.feedbackScreenshotFile = await FEEDBACK_UTILS.captureFeedbackScreenshot({
        hiddenEl: section,
        statusEl: section?.querySelector("[data-feedback-screenshot-status]"),
        captureMessage: "Capturing the current page...",
        ignoreElementId: "notification-panel"
      });
    }

    async function uploadFeedbackScreenshot(file, title) {
      return FEEDBACK_UTILS.uploadFeedbackScreenshot(file, title, {
        compressImage: compressFeedbackImage,
        uploadFile: uploadDirectusFile,
        normalizeUploadFileId: SHARED_DIRECTUS.normalizeUploadFileId
      });
    }

    function loadContributorSession() {
      const session = SHARED_UTILS.readStorageJson("nli-contributor-session", null);
      if (!session) return null;
      return PROFILE_UTILS.normalizeStoredContributorProfile(session);
    }

    function saveContributorSession(session) {
      state.contributorSession = session;
      if (session) {
        SHARED_UTILS.writeStorageJson("nli-contributor-session", session);
      } else {
        SHARED_UTILS.removeStorageKeys(["nli-contributor-session", "nli-contributor-profile", "nli-mobile-profile"]);
      }
      renderContributorLoginButton();
    }

    function expireContributorSession(message = "Your login expired. Please log back in.") {
      if (!state.contributorSession) return;
      saveContributorSession(null);
      showBanner(message);
      if (state.activeContent) reopenActiveContent();
    }

    function trackedMemberProfile() {
      const profile = currentContributorProfile?.();
      if (!profile?.id || state.contributorSession?.pending || state.contributorSession?.approved === false) return null;
      return profile;
    }

    async function ensureMemberUsageBaseline(profile) {
      const profileId = Number(relationId(profile?.id));
      if (!profileId) return false;
      if (state.memberUsageLoadedProfileIds.has(String(profileId))) return true;
      const response = await fetchJson(`/items/mobile_member_profiles/${profileId}?fields=last_login_at,last_active_at,usage_seconds_total,usage_session_count`, { fresh: true });
      const data = response?.data || {};
      Object.assign(profile, data);
      state.memberUsageLoadedProfileIds.add(String(profileId));
      return true;
    }

    function memberUsagePayload(profile, options = {}) {
      return PROFILE_UTILS.memberUsagePayload(profile, {
        ...options,
        sessionStartedAt: state.memberUsageSessionStartedAt,
        flushedSeconds: state.memberUsageFlushedSeconds,
        sessionRecorded: state.memberUsageSessionRecorded
      });
    }

    async function trackMemberProfileActivity(options = {}) {
      const profile = trackedMemberProfile();
      if (!profile || state.memberUsageFlushPromise) return null;
      const now = Date.now();
      const throttleMs = Number(options.throttleMs || 60000);
      if (!options.force && !options.login && state.memberUsageLastFlushAt && now - state.memberUsageLastFlushAt < throttleMs) return null;
      const baselineReady = await ensureMemberUsageBaseline(profile).catch(() => false);
      const { payload, incrementalSeconds } = memberUsagePayload(profile, { ...options, trackUsage: baselineReady });
      state.memberUsageFlushPromise = patchDirectusItem("mobile_member_profiles", profile.id, payload, { requireAuth: true })
        .then(result => {
          Object.assign(profile, payload, result?.data || {});
          if (state.contributorSession) {
            saveContributorSession({ ...state.contributorSession, ...payload });
          }
          if (incrementalSeconds) state.memberUsageFlushedSeconds += incrementalSeconds;
          if (payload.usage_session_count !== undefined) state.memberUsageSessionRecorded = true;
          state.memberUsageLastFlushAt = Date.now();
          return result;
        })
        .catch(() => null)
        .finally(() => {
          state.memberUsageFlushPromise = null;
        });
      return state.memberUsageFlushPromise;
    }

    function scheduleMemberProfileActivityTracking(options = {}) {
      if (!trackedMemberProfile()) return;
      window.setTimeout(() => {
        trackMemberProfileActivity(options).catch(() => null);
      }, 0);
    }

    async function saveLanguageAttempt(contentKey, word, correct) {
      await ensureContributorWriteSession("save language progress");
      const saved = await syncLanguageAttempt(contentKey, word, correct);
      if (!saved) throw new Error(PROFILE_UTILS.contributorWriteSessionMessage("save language progress"));
      renderContributorLoginButton();
      if (articleEl.classList.contains("open") && state.activeContent?.type === "login") openContributorLogin();
      return saved;
    }

    const localDateKey = SHARED_UTILS.localDateKey;

    function remoteLoginRewardRecords(profile = currentContributorProfile()) {
      return PROFILE_UTILS.profileLoginRewardRecords(state.profileLoginRewards, profileIdentityIds(profile), { relationId });
    }

    async function refreshRemoteLoginRewardsForProfile(profile = currentContributorProfile()) {
      const profileIds = [...profileIdentityIds(profile)];
      if (!profileIds.length) return [];
      const response = await fetchJson(`/items/mobile_profile_logins?limit=-1&filter[member_profile][_in]=${profileIds.join(",")}&fields=${INITIAL_LOGIN_REWARD_FIELDS}`);
      const incoming = response.data || [];
      state.profileLoginRewards = PROFILE_UTILS.mergeLoginRewardRecords(state.profileLoginRewards, incoming);
      return incoming;
    }

    const loginRewardStatsFromDates = PROFILE_UTILS.loginRewardStatsFromDates;

    function loginRewardStats(profile = currentContributorProfile()) {
      if (!profile) return { totalDays: 0, currentStreak: 0, bestStreak: 0, lastLoginDate: "" };
      return loginRewardStatsFromDates(remoteLoginRewardRecords(profile).map(item => item.login_date));
    }

    async function recordDailyLoginReward(profile = currentContributorProfile()) {
      if (!profile || state.contributorSession?.pending) return null;
      const profileId = Number(relationId(profile.id || state.contributorSession?.profileId));
      if (!profileId) return null;
      await refreshRemoteLoginRewardsForProfile(profile);
      const loginRecords = remoteLoginRewardRecords(profile);
      const currentStats = loginRewardStats(profile);
      if (PROFILE_UTILS.loginRewardRecentlyAwarded(loginRecords, { minHours: 24 })) {
        return { earned: false, recentlyAwarded: true, ...currentStats };
      }
      const reward = PROFILE_UTILS.nextDailyLoginReward(profileId, currentStats, loginRecords.map(item => item.login_date));
      if (!reward?.earned) return reward;
      const payload = reward.payload;
      const created = await postDirectusItem("mobile_profile_logins", payload, { requireAuth: true });
      const record = created?.data ? { ...payload, ...created.data } : payload;
      state.profileLoginRewards.push(record);
      await recordProfilePointEvent({
        event_key: `daily_open:${profileId}:${payload.login_date}`,
        event_type: "daily_open",
        points: PROFILE_UTILS.POINT_RULES.daily_open,
        member_profile: profileId,
        source_collection: "mobile_profile_logins",
        source_id: record.id,
        source_title: "Daily signed-in visit",
        created_at: record.created_at || payload.created_at
      });
      return reward;
    }

    async function awardDailyLoginReward(options = {}) {
      const profile = currentContributorProfile();
      try {
        const result = await recordDailyLoginReward(profile);
        if (result?.earned && !options.silent) {
          showBanner(`Daily visit point saved. ${result.currentStreak} day streak.`);
          renderContributorLoginButton();
        if (articleEl.classList.contains("open") && state.activeContent?.type === "login") openContributorLogin();
        }
        return result;
      } catch (error) {
        console.warn("Daily login point could not be saved", error);
        if (!options.silent) showBanner("Login worked, but the daily visit point could not be saved yet.");
        return null;
      }
    }

    function learnedLanguageWords(profile = currentContributorProfile()) {
      return PROFILE_UTILS.learnedLanguageWordsFromAttempts(state.languageQuizAttempts, profileIdentityIds(profile), { relationId });
    }

    function languageCorrectAttemptCount(profile = currentContributorProfile()) {
      return PROFILE_UTILS.languageCorrectAttemptCountFromAttempts(state.languageQuizAttempts, profileIdentityIds(profile), { relationId });
    }

    function languageRemoteAttemptExists(profileId, contentKey, wordId) {
      return PROFILE_UTILS.languageRemoteAttemptExists(state.languageQuizAttempts, profileId, contentKey, wordId, { relationId });
    }

    async function recordLanguagePointForAttempt(profileId, contentKey, word, record) {
      if (!profileId || !record || record.correct === false) return null;
      const pointEvent = await recordProfilePointEvent({
        event_key: `vocab_guess:${profileId}:${record.content_key || contentKey}:${record.word_id || word.id}:${String(record.answered_at || "").slice(0, 10)}`,
        event_type: "vocab_guess",
        points: PROFILE_UTILS.POINT_RULES.vocab_guess,
        member_profile: profileId,
        source_collection: "mobile_language_quiz_progress",
        source_id: record.id,
        source_slug: record.content_key || contentKey,
        source_title: record.content_title || word.english || "Language word",
        created_at: record.answered_at || new Date().toISOString()
      });
      await refreshRemotePointEventsForProfileId(profileId).catch(() => []);
      renderContributorLoginButton();
      if (articleEl.classList.contains("open") && state.activeContent?.type === "login") openContributorLogin();
      return pointEvent;
    }

    function mergeLanguageAttemptRecords(records = []) {
      PROFILE_UTILS.mergeLanguageAttemptRecords(state.languageQuizAttempts, records, { relationId });
      state.profileActivityCache = null;
    }

    async function refreshRemoteLanguageAttempt(profileId, contentKey, wordId, dateKey = localDateKey()) {
      const id = Number(profileId);
      if (!id || !contentKey || !wordId) return null;
      const response = await fetchJson(
        `/items/mobile_language_quiz_progress?limit=-1&filter[member_profile][_eq]=${id}&filter[content_key][_eq]=${encodeURIComponent(contentKey)}&filter[word_id][_eq]=${encodeURIComponent(wordId)}&fields=${INITIAL_LANGUAGE_PROGRESS_FIELDS}`,
        { fresh: true }
      );
      const incoming = response.data || [];
      mergeLanguageAttemptRecords(incoming);
      return incoming.find(item => String(item.answered_at || "").slice(0, 10) === String(dateKey || "").slice(0, 10)) || null;
    }

    async function syncLanguageAttempt(contentKey, word, correct) {
      const profile = currentContributorProfile();
      const profileId = activeContributorProfileId();
      if (!profile?.id || !profileId || Number(relationId(profile.id)) !== profileId) return;
      const payload = PROFILE_UTILS.languageAttemptPayload(profileId, contentKey, word, { correct });
      if (!payload) return;
      const existing = await refreshRemoteLanguageAttempt(profileId, contentKey, word.id, String(payload.answered_at || "").slice(0, 10)).catch(() => null);
      if (existing || languageRemoteAttemptExists(profileId, contentKey, word.id)) {
        const record = existing || state.languageQuizAttempts.find(item =>
          Number(relationId(item.member_profile)) === Number(profileId) &&
          String(item.content_key || "") === String(contentKey || "") &&
          String(item.word_id || "") === String(word.id || "") &&
          String(item.answered_at || "").slice(0, 10) === String(payload.answered_at || "").slice(0, 10)
        );
        const pointEvent = await recordLanguagePointForAttempt(profileId, contentKey, word, record);
        return record ? { ...record, _existingAttempt: true, _languagePointEvent: pointEvent || null } : null;
      }
      const languageAuthMessage = PROFILE_UTILS.contributorWriteSessionMessage("save language progress");
      const created = await postDirectusItem("mobile_language_quiz_progress", payload, {
        requireAuth: true,
        missingAuthMessage: languageAuthMessage,
        authExpiredMessage: languageAuthMessage
      });
      const record = created?.data ? { ...payload, ...created.data } : payload;
      mergeLanguageAttemptRecords([record]);
      const pointEvent = await recordLanguagePointForAttempt(profileId, contentKey, word, record);
      return { ...record, _createdAttempt: true, _languagePointEvent: pointEvent || null };
    }

    function siteVisitRecord(profile, site) {
      return PROFILE_UTILS.siteVisitRecord(state.publicVisits, profile, site, {
        relationId,
        fallbackProfileId: state.contributorSession?.profileId
      });
    }

    function mergeVisitRecords(records = []) {
      PROFILE_UTILS.mergeVisitRecords(state.publicVisits, records, { relationId });
    }

    async function refreshRemoteSiteVisitsForProfileSite(profile, site) {
      const profileId = Number(relationId(profile?.id || state.contributorSession?.profileId));
      if (!profileId || !site?.slug) return [];
      const response = await fetchJson(
        `/items/mobile_site_visits?limit=-1&filter[member_profile][_eq]=${profileId}&filter[site_slug][_eq]=${encodeURIComponent(site.slug)}&fields=${INITIAL_PUBLIC_VISIT_FIELDS}`
      );
      const incoming = response.data || [];
      mergeVisitRecords(incoming);
      return incoming;
    }

    function siteHasCheckin(profile, site) {
      return PROFILE_UTILS.siteHasCheckin(state.publicVisits, profile, site, {
        relationId,
        fallbackProfileId: state.contributorSession?.profileId
      });
    }

    function siteVisitPayload(profile, site, options = {}) {
      return PROFILE_UTILS.siteVisitPayload(profile, site, {
        ...options,
        relationId,
        fallbackProfileId: state.contributorSession?.profileId
      });
    }

    async function recordSiteVisit(site, options = {}) {
      const profile = currentContributorProfile();
      if (!profile?.id || state.contributorSession?.pending || !site?.slug) return null;
      const distanceMiles = Number(options.distanceMiles);
      const wantsCheckin = Number.isFinite(distanceMiles);
      if (wantsCheckin && distanceMiles > SITE_CHECKIN_RADIUS_MILES) {
        throw new Error(`Check-ins unlock within ${SITE_CHECKIN_RADIUS_MILES.toFixed(2)} mi of this site.`);
      }
      let existing = siteVisitRecord(profile, site);
      if (!existing || (wantsCheckin && !siteHasCheckin(profile, site))) {
        await refreshRemoteSiteVisitsForProfileSite(profile, site).catch(() => []);
        existing = siteVisitRecord(profile, site);
      }
      if (existing && (!wantsCheckin || siteHasCheckin(profile, site))) return { earned: false, record: existing };
      const payload = siteVisitPayload(profile, site, options);
      if (!payload) return null;
      if (existing?.id && wantsCheckin) {
        try {
          const updated = await patchDirectusItem("mobile_site_visits", existing.id, {
            distance_miles: payload.distance_miles,
            visited_at: payload.visited_at,
            public_activity: true
          });
          Object.assign(existing, updated?.data || payload);
          await recordProfilePointEvent({
            event_key: `site_checkin:${profile.id}:${site.slug}`,
            event_type: "site_checkin",
            points: PROFILE_UTILS.POINT_RULES.site_checkin,
            member_profile: profile.id,
            source_collection: "mobile_site_visits",
            source_id: existing.id,
            source_slug: site.slug,
            source_title: site.title || site.slug,
            created_at: existing.visited_at || payload.visited_at
          });
          return { earned: true, checkin: true, record: existing };
        } catch {}
      }
      const created = await postDirectusItem("mobile_site_visits", payload, { requireAuth: true });
      const record = created?.data ? { ...payload, ...created.data } : payload;
      mergeVisitRecords([record]);
      await recordProfilePointEvent({
        event_key: `site_visit:${profile.id}:${site.slug}`,
        event_type: "site_visit",
        points: PROFILE_UTILS.POINT_RULES.site_visit,
        member_profile: profile.id,
        source_collection: "mobile_site_visits",
        source_id: record.id,
        source_slug: site.slug,
        source_title: site.title || site.slug,
        created_at: record.visited_at || payload.visited_at
      });
      if (wantsCheckin) {
        await recordProfilePointEvent({
          event_key: `site_checkin:${profile.id}:${site.slug}`,
          event_type: "site_checkin",
          points: PROFILE_UTILS.POINT_RULES.site_checkin,
          member_profile: profile.id,
          source_collection: "mobile_site_visits",
          source_id: record.id,
          source_slug: site.slug,
          source_title: site.title || site.slug,
          created_at: record.visited_at || payload.visited_at
        });
      }
      return { earned: true, checkin: wantsCheckin, record };
    }

    function milesBetweenPoints(a, b) {
      return GEOMETRY_UTILS.milesBetweenPoints(a, b);
    }

    function siteCheckinCenter(site) {
      const geometry = site?.geojson || site?.display_geojson || siteDisplayGeometry(site) || null;
      return siteCenter(geometry);
    }

    function currentPosition() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Location is not available in this browser."));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
      });
    }

    async function checkInAtSite(site) {
      const profile = currentContributorProfile();
      if (!profile?.id || state.contributorSession?.pending) {
        showBanner("Login before checking in.");
        return null;
      }
      const center = siteCheckinCenter(site);
      if (!center) {
        showBanner("This site does not have a public check-in location.");
        return null;
      }
      try {
        const position = await currentPosition();
        const miles = milesBetweenPoints([position.coords.longitude, position.coords.latitude], center);
        if (!Number.isFinite(miles)) throw new Error("Could not compare your location with this site.");
        if (miles > SITE_CHECKIN_RADIUS_MILES) {
          showBanner(`Check-in not saved. You are about ${miles.toFixed(1)} mi from this site.`);
          return null;
        }
        const result = await recordSiteVisit(site, { distanceMiles: miles });
        showBanner(result?.earned ? `Check-in saved for ${site.title}.` : "You already checked in here.");
        if (state.activeContent?.type === "login") openContributorLogin();
        return result;
      } catch (error) {
        showBanner(error.message || "Could not check in from this device.");
        return null;
      }
    }

    function absoluteMediaUrl(url) {
      return MEDIA_UTILS.absoluteMediaUrl(url, window.location.href);
    }

    function mergeSeededProfiles(profiles) {
      return PROFILE_UTILS.mergeSeededProfiles(profiles, SEEDED_PUBLIC_PROFILES);
    }

    function mergeSeededComments(comments) {
      return COMMENT_UTILS.mergeSeededComments(comments, SEEDED_WHALES_FIN_COMMENTS, {
        keyFor: comment => `${comment?.source_slug || comment?.site_slug || ""}|${comment?.author_name || ""}|${comment?.comment || ""}`.toLowerCase()
      });
    }

    const randomSalt = PROFILE_UTILS.randomSalt;
    const hashPassword = PROFILE_UTILS.hashPassword;
    const normalizeAccountEmail = PROFILE_UTILS.normalizeAccountEmail;
    const existingRegistrationMessage = PROFILE_UTILS.existingRegistrationMessage;

    async function registerContributorFromSection(section) {
      const button = section.querySelector("[data-register-contributor]");
      const originalLabel = button?.textContent || "Submit account request";
      setInlineStatus(section, "[data-register-status]", "Saving account request...");
      if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
      }
      try {
        const displayName = section.querySelector("[data-register-name]")?.value.trim() || "";
        const email = normalizeAccountEmail(section.querySelector("[data-register-email]")?.value);
        const password = section.querySelector("[data-register-password]")?.value || "";
        const inviteCode = section.querySelector("[data-register-invite-code]")?.value.trim() || "";
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email address.");
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        const existingRegistration = await fetchLatestRegistrationReview(email);
        if (existingRegistration) throw new Error(existingRegistrationMessage(existingRegistration));
        const salt = randomSalt();
        const passwordHash = await hashPassword(password, salt);
        const profile = {
          email,
          displayName: displayName || email,
          local: true,
          pending: true,
          roleLabel: "Account awaiting review"
        };
        const registrationRecord = await postDirectusItem("mobile_account_registrations", {
          email,
          email_normalized: email,
          username: email,
          display_name: profile.displayName,
          password_hash: passwordHash,
          password_salt: salt,
          created_at: new Date().toISOString()
        });
        const synced = !!registrationRecord;
        let registrationId = registrationRecord?.data?.id || null;
        if (synced && !registrationId) {
          registrationId = (await fetchLatestRegistrationReview(email))?.id || null;
        }
        let signupEmailError = "";
        if (synced) {
          try {
            await FEEDBACK_UTILS.sendAccountSignupEmail(
              { ...(registrationRecord?.data || {}), id: registrationId || registrationRecord?.data?.id },
              { appUrl: window.location.href, platform: "desktop" }
            );
          } catch (error) {
            signupEmailError = "Your account request was saved, but the admin email could not be sent. Please use Feedback to let us know.";
            console.warn("Account signup email failed:", error);
          }
        }
        let inviteMessage = "";
        if (inviteCode && synced) {
          try {
            const inviteResult = await FEEDBACK_UTILS.redeemAccountInviteCode({
              code: inviteCode,
              email,
              registrationId
            }, { platform: "desktop" });
            if (inviteResult?.ok) inviteMessage = " Your invite code was accepted and 100 points were awarded to the friend who invited you.";
          } catch (error) {
            inviteMessage = ` Invite code note: ${error.message || "The invite code could not be applied."}`;
          }
        }
        if (synced) await createPendingMemberProfile({ email, display_name: profile.displayName, registrationId }).catch(() => null);
        saveContributorSession(profile);
        section.querySelector("[data-register-password]").value = "";
        const inviteInput = section.querySelector("[data-register-invite-code]");
        if (inviteInput) inviteInput.value = "";
        const message = signupEmailError || `Thank you for registering. We will review your account soon.${inviteMessage}`;
        setInlineStatus(section, "[data-register-status]", message, signupEmailError ? "error" : "success");
        showBanner(message);
        section.querySelectorAll("[data-register-name], [data-register-email], [data-register-password], [data-register-invite-code]").forEach(input => {
          input.value = "";
          input.disabled = true;
        });
        if (button) {
          button.textContent = "Account request submitted";
          button.disabled = true;
        }
        section.querySelector("[data-register-panel]")?.setAttribute("open", "");
        renderContributorLoginButton();
        return profile;
      } catch (error) {
        setInlineStatus(section, "[data-register-status]", error.message || "Could not create contributor account request.", "error");
        throw error;
      } finally {
        if (button && button.textContent !== "Account request submitted") {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      }
    }

    async function fetchLatestRegistrationReview(email, includePassword = false) {
      const normalized = normalizeAccountEmail(email);
      if (!normalized) return null;
      try {
        const fields = includePassword
          ? "id,email,email_normalized,display_name,account_enabled,account_banned,ban_reason,status,review_note,password_hash,password_salt"
          : "id,email,email_normalized,display_name,account_enabled,account_banned,ban_reason,status,review_note";
        let response = await fetch(`${DIRECTUS}/items/mobile_account_registrations?limit=1&filter[email_normalized][_eq]=${encodeURIComponent(normalized)}&sort=-created_at&fields=${fields}`);
        if (!response.ok) response = await fetch(`${DIRECTUS}/items/mobile_account_registrations?limit=1&filter[email][_eq]=${encodeURIComponent(normalized)}&sort=-created_at&fields=${fields}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data?.data?.[0] || null;
      } catch {
        return null;
      }
    }

    async function requestContributorPasswordReset(section) {
      const button = section.querySelector("[data-password-reset-submit]");
      const originalLabel = button?.textContent || "Email reset link";
      setInlineStatus(section, "[data-password-reset-status]", "Sending reset email...");
      if (button) {
        button.disabled = true;
        button.textContent = "Sending...";
      }
      try {
        const email = normalizeAccountEmail(section.querySelector("[data-password-reset-email]")?.value);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter the email for the account.");
        let response = await fetch(`${DIRECTUS}/auth/password/request`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, reset_url: ROUTE_UTILS.passwordResetReturnUrl(window.location) })
        });
        if (!response.ok && response.status === 400) {
          response = await fetch(`${DIRECTUS}/auth/password/request`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email })
          });
        }
        if (!response.ok) throw new Error("Could not send reset email.");
        const message = "If an account exists for that email, a reset link has been sent.";
        setInlineStatus(section, "[data-password-reset-status]", message, "success");
        showBanner(message);
      } catch (error) {
        setInlineStatus(section, "[data-password-reset-status]", error.message || "Could not send reset email.", "error");
        throw error;
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      }
    }

    async function completeContributorPasswordReset(section) {
      const button = section.querySelector("[data-password-reset-complete]");
      const originalLabel = button?.textContent || "Set new password";
      const password = section.querySelector("[data-password-reset-new-password]")?.value || "";
      setInlineStatus(section, "[data-password-reset-complete-status]", "Saving new password...");
      if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
      }
      try {
        if (!state.passwordResetToken) throw new Error("This reset link is missing its token. Request a new reset email.");
        if (password.length < 8) throw new Error("New password must be at least 8 characters.");
        const response = await fetch(`${DIRECTUS}/auth/password/reset`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token: state.passwordResetToken, password })
        });
        if (!response.ok) throw new Error("This reset link is expired or has already been used.");
        state.passwordResetToken = "";
        section.querySelector("[data-password-reset-new-password]").value = "";
        ROUTE_UTILS.clearPasswordResetUrl({ location: window.location, history });
        const message = "Password updated. You can log in with the new password.";
        setInlineStatus(section, "[data-password-reset-complete-status]", message, "success");
        showBanner(message);
        openContributorLogin();
      } catch (error) {
        setInlineStatus(section, "[data-password-reset-complete-status]", error.message || "Could not update password.", "error");
        throw error;
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      }
    }

    const registrationIsApproved = PROFILE_UTILS.registrationIsApproved;

    const bestContributorProfile = PROFILE_UTILS.bestContributorProfile;

    function contributorProfileForLoginEmail(email = "") {
      const normalized = String(email || "").trim().toLowerCase();
      if (!normalized) return null;
      const usernameMatch = bestContributorProfile(state.contributorProfiles.filter(profile =>
        String(profile.username || "").toLowerCase() === normalized
      ));
      if (usernameMatch) return usernameMatch;
      if (normalized === "jeremynative@gmail.com" || normalized === "jeremydennis") {
        const jeremyProfile = state.contributorProfiles.find(profile => profile.slug === "jeremy-dennis");
        return isProfileBanned(jeremyProfile) ? null : jeremyProfile || null;
      }
      return null;
    }

    async function fetchContributorProfileForRegistration(registration) {
      if (!registration?.email && !registration?.id) return null;
      const normalized = String(registration.email || "").trim().toLowerCase();
      const cached = contributorProfileForLoginEmail(normalized);
      if (cached) return cached;
      try {
        const response = await fetchJson(`/items/mobile_member_profiles?limit=-1&filter[username][_eq]=${encodeURIComponent(normalized)}&fields=${INITIAL_PROFILE_FIELDS}`);
        const profiles = response.data || [];
        profiles.forEach(profile => replaceCachedItem("contributorProfiles", null, null, profile));
        return bestContributorProfile(profiles) || contributorProfileForLoginEmail(normalized);
      } catch {
        return null;
      }
    }

    async function createContributorProfileForRegistration(registration, overrides = {}) {
      const normalized = String(registration?.email || state.contributorSession?.email || "").trim().toLowerCase();
      if (!normalized) return null;
      const displayName = overrides.display_name || registration?.display_name || state.contributorSession?.displayName || normalized;
      const payload = {
        account_registration: registration?.id || state.contributorSession?.registrationId || null,
        account_enabled: true,
        account_banned: false,
        username: normalized,
        display_name: displayName,
        slug: profileSlugFromEmail(normalized),
        role_label: "Contributor",
        headline: overrides.headline || "Contributor to On This Site.",
        bio: overrides.bio || "",
        public_profile: overrides.public_profile ?? true,
        profile_status: overrides.profile_status || "published",
        joined_at: overrides.joined_at || registration?.joined_at || registration?.reviewed_at || new Date().toISOString()
      };
      try {
        const created = await postDirectusItem("mobile_member_profiles", payload);
        const profile = created?.data ? { ...payload, ...created.data } : null;
        if (profile?.id) {
          const existingIndex = state.contributorProfiles.findIndex(item => Number(item.id) === Number(profile.id));
          if (existingIndex >= 0) state.contributorProfiles[existingIndex] = profile;
          else state.contributorProfiles.push(profile);
          return profile;
        }
      } catch (error) {
        console.warn("Could not create contributor profile", error);
      }
      return null;
    }

    async function refreshContributorSessionApproval({ silent = false } = {}) {
      const session = state.contributorSession;
      if (!session?.pending || !session.email || state.approvalRefreshInFlight) return false;
      state.approvalRefreshInFlight = true;
      try {
        const registration = await fetchLatestRegistrationReview(session.email);
        if (!registration) return false;
        if (registration.account_banned === true || registration.status === "banned") {
          saveContributorSession(null);
          if (!silent) showBanner(registration.ban_reason || registration.review_note || "This account has been banned.");
          return true;
        }
        if (registration.status === "declined") {
          saveContributorSession(null);
          if (!silent) showBanner(registration.review_note || "This account request was declined.");
          return true;
        }
        let profile = await fetchContributorProfileForRegistration(registration);
        if (!profile && registrationIsApproved(registration)) {
          profile = await createContributorProfileForRegistration(registration);
        }
        if (!registrationIsApproved(registration) && profile?.account_enabled !== true) return false;
        saveContributorSession({
          ...session,
          displayName: registration.display_name || session.displayName || session.email,
          registrationId: registration.id || session.registrationId || null,
          profileId: profile?.id || session.profileId || null,
          pending: false,
          roleLabel: profile?.role_label || "Contributor",
          profile_status: profile?.profile_status ?? session.profile_status,
          public_profile: profile?.public_profile ?? session.public_profile
        });
        if (!silent) showBanner("Contributor account approved. Login is active.");
        return true;
      } finally {
        state.approvalRefreshInFlight = false;
      }
    }

    async function createPendingMemberProfile(profile) {
      const slug = String(profile.email || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 120);
      return postDirectusItem("mobile_member_profiles", {
        account_registration: profile.registrationId || null,
        account_enabled: false,
        account_banned: false,
        profile_status: "hidden",
        public_profile: false,
        username: profile.email,
        display_name: profile.display_name || profile.email,
        slug,
        role_label: "Account awaiting review",
        headline: "Contributor account request pending review.",
        bio: "",
        joined_at: new Date().toISOString()
      });
    }

    async function loginRegistrationContributor(email, password) {
      const normalized = String(email || "").trim().toLowerCase();
      if (!normalized || !password) return null;
      const registration = await fetchLatestRegistrationReview(normalized, true);
      if (!registration) return null;
      if (registration.status === "declined") {
        throw new Error(registration.review_note || "This account request was declined.");
      }
      if (registration.account_banned === true || registration.status === "banned") {
        throw new Error(registration.ban_reason || registration.review_note || "This account has been banned.");
      }
      const existingProfile = contributorProfileForLoginEmail(normalized);
      if (isProfileBanned(existingProfile)) {
        throw new Error(existingProfile.ban_reason || "This account has been banned.");
      }
      if (!registration.password_hash || !registration.password_salt) {
        return null;
      }
      const passwordHash = await hashPassword(password, registration.password_salt);
      if (passwordHash !== registration.password_hash) return null;
      let profile = await fetchContributorProfileForRegistration(registration);
      const approved = registrationIsApproved(registration) || profile?.account_enabled === true;
      if (!approved) {
        return {
          email: normalized,
          displayName: registration.display_name || normalized,
          registrationId: registration.id,
          profileId: profile?.id || null,
          local: true,
          pending: true,
          roleLabel: "Account awaiting review",
          reviewNote: registration.review_note || ""
        };
      }
      return null;
    }

    function renderContributorLoginButton() {
      const button = document.getElementById("contributor-login-button");
      if (!button) return;
      const profile = currentContributorProfile();
      if (profile && !state.contributorSession?.pending) {
        const stats = profileStats(profile);
        const points = Number(stats.points || 0);
        const displayName = profile.display_name || state.contributorSession?.displayName || state.contributorSession?.email || "Profile";
        button.textContent = stats.pointsSyncing ? `${displayName} (...)` : `${displayName} (${points})`;
      } else {
        button.textContent = state.contributorSession?.pending ? "Account Pending" : "Profile";
      }
      button.title = profile ? "Contributor account" : "Login or register as a contributor";
      syncSupportAdminMenu();
    }

    function syncSupportAdminMenu() {
      const menu = document.getElementById("support-admin-menu");
      if (!menu) return;
      menu.hidden = !isAdminContributor();
      if (menu.hidden) menu.removeAttribute("open");
    }

    const fetchFirstItem = (collection, filterField, value) => directusClient.fetchFirstItem(collection, filterField, value);

    async function contributorProfileForToken(token, email = "") {
      if (token) {
        try {
          const { profile } = await directusClient.fetchProfileForToken(token, {
            profileFields: INITIAL_PROFILE_FIELDS
          });
          if (profile) return replaceCachedItem("contributorProfiles", null, null, profile);
        } catch {}
      }
      const normalized = String(email || "").toLowerCase();
      if (normalized === "jeremynative@gmail.com" || normalized === "jeremydennis") return state.contributorProfiles.find(item => item.slug === "jeremy-dennis") || null;
      return state.contributorProfiles.find(item => {
        const username = String(item.username || "").toLowerCase();
        return username === normalized || username === normalized.split("@")[0].toLowerCase();
      }) || null;
    }

    function replaceCachedItem(listName, idMapName, slugMapName, item) {
      if (!item) return item;
      const nextItem = listName === "sites" ? SITE_UTILS.sanitizePublicSiteContent(item) : item;
      const list = state[listName] || [];
      const index = list.findIndex(existing => Number(existing.id) === Number(nextItem.id) || (nextItem.slug && existing.slug === nextItem.slug));
      if (index >= 0) list[index] = { ...list[index], ...nextItem };
      else list.push(nextItem);
      state[listName] = list;
      const target = list[index >= 0 ? index : list.length - 1];
      if (idMapName && nextItem.id !== undefined && nextItem.id !== null && nextItem.id !== "") {
        const numericId = Number(nextItem.id);
        if (Number.isFinite(numericId)) state[idMapName].set(numericId, target);
        state[idMapName].set(String(nextItem.id), target);
      }
      if (slugMapName && nextItem.slug) state[slugMapName].set(nextItem.slug, target);
      if (slugMapName && nextItem.slug) state[slugMapName].set(normalizedActivitySlug(nextItem.slug), target);
      if (listName === "sites") {
        clearSiteListCaches();
        clearEraKeyCaches();
      }
      return target;
    }

    function siteNeedsDetail(site) {
      return !site || !("introduction_content" in site) || !("history_content" in site);
    }

    function wikiNeedsDetail(article) {
      return !article || !("content" in article);
    }

    function pageNeedsDetail(item) {
      return !item || !("content" in item);
    }

    async function staticSiteDetail(site) {
      if (!site) return null;
      if (!window.NLI_SITE_DETAIL_MANIFEST && window.NLI_SITE_DETAIL_MANIFEST_READY) {
        window.NLI_LOAD_SITE_DETAIL_MANIFEST?.();
        await window.NLI_SITE_DETAIL_MANIFEST_READY;
      }
      const manifest = window.NLI_SITE_DETAIL_MANIFEST;
      const detailUrl = manifest?.bySlug?.[site.slug] || manifest?.byId?.[String(site.id)];
      if (!detailUrl) return null;
      const response = await fetch(detailUrl, {
        cache: "force-cache",
        credentials: "same-origin"
      });
      if (!response.ok) throw new Error(`Static site detail request failed (${response.status}).`);
      return response.json();
    }

    async function hydrateSite(site) {
      if (!site || !siteNeedsDetail(site)) return site;
      const key = site.slug || site.id;
      if (state.detailCache.sites.has(key)) return state.detailCache.sites.get(key);
      const promise = staticSiteDetail(site)
        .catch(() => null)
        .then(staticDetail => staticDetail || fetchFirstItem("sites", site.slug ? "slug" : "id", key))
        .then(full => replaceCachedItem("sites", "siteById", "siteBySlug", SITE_UTILS.sanitizePublicSiteContent(full ? { ...site, ...full } : site)))
        .catch(() => SITE_UTILS.sanitizePublicSiteContent(site));
      state.detailCache.sites.set(key, promise);
      return promise;
    }

    async function hydrateWiki(article) {
      if (!article || article.virtual || !wikiNeedsDetail(article)) return article;
      const key = article.slug || article.id;
      if (state.detailCache.wiki.has(key)) return state.detailCache.wiki.get(key);
      const promise = fetchFirstItem("wiki_articles", article.slug ? "slug" : "id", key)
        .then(full => replaceCachedItem("wikiArticles", "wikiById", "wikiBySlug", sanitizePublicWikiArticle(full ? { ...article, ...full } : article)))
        .catch(() => sanitizePublicWikiArticle(article));
      state.detailCache.wiki.set(key, promise);
      return promise;
    }

    async function hydratePage(item) {
      if (!item || !pageNeedsDetail(item)) return item;
      const key = item.slug || item.id;
      if (state.detailCache.pages.has(key)) return state.detailCache.pages.get(key);
      const promise = fetchFirstItem("site_content", item.slug ? "slug" : "id", key)
        .then(full => replaceCachedItem("siteContent", null, "contentBySlug", full ? { ...item, ...full } : item))
        .catch(() => item);
      state.detailCache.pages.set(key, promise);
      return promise;
    }

    async function hydrateBlogPost(item) {
      if (!item || !pageNeedsDetail(item)) return item;
      const key = item.slug || item.id;
      if (state.detailCache.blog.has(key)) return state.detailCache.blog.get(key);
      const promise = fetchFirstItem("blog_posts", item.slug ? "slug" : "id", key)
        .then(full => replaceCachedItem("blogPosts", null, "blogBySlug", full ? { ...item, ...full } : item))
        .catch(() => item);
      state.detailCache.blog.set(key, promise);
      return promise;
    }

    const INITIAL_SITE_FIELDS = SHARED_FIELDS.desktopSite || [
      "id", "title", "slug", "summary", "address_label", "site_type", "geojson", "display_geojson", "geometry_surface", "geometry_cleanup_status", "map_geometry_source",
      "map_fill_color", "map_opacity", "map_icon", "listing_image_file", "listing_image_url", "listing_image_thumb_url", "listing_image_alt", "show_print_purchase", "introduction_content", "history_content", "last_reviewed", "wp_date", "known_plant_species"
      , "ancestral_territory", "ancestral_territory_note"
    ].join(",");
    const INITIAL_WIKI_FIELDS = SHARED_FIELDS.desktopWiki || ["id", "title", "slug", "summary", "last_reviewed", "lastmod"].join(",");
    const INITIAL_PAGE_FIELDS = SHARED_FIELDS.desktopPage || ["id", "title", "slug", "summary", "content_type", "wp_date", "featured_image_url"].join(",");
    const INITIAL_BLOG_FIELDS = SHARED_FIELDS.desktopBlog || ["id", "title", "slug", "summary", "published_at", "featured_image_url"].join(",");
    const INITIAL_EVENT_FIELDS = SHARED_FIELDS.exhibit || [
      "id", "status", "event_type", "title", "slug", "venue", "address_label", "summary", "body",
      "start_datetime", "end_datetime", "all_day", "timezone", "on_view_status", "is_permanent",
      "geojson", "map_icon", "icon_color", "cover_image", "external_url", "related_site_slug",
      "related_wiki_slug", "related_blog_slug", "collection_piece_title", "collection_artist",
      "collection_date", "create_historic_moment", "historic_period"
    ].join(",");
    const INITIAL_PROFILE_FIELDS = SHARED_FIELDS.profile || [
      "id", "username", "display_name", "slug", "role_label", "headline", "bio", "location_label", "website_url", "avatar", "joined_at",
      "public_profile", "profile_status", "account_enabled", "account_banned", "ban_reason",
      "is_monthly_supporter", "support_started_at", "support_monthly_amount"
    ].join(",");
    const INITIAL_PUBLIC_COMMENT_FIELDS = SHARED_FIELDS.desktopPublicComment || [
      "id", "member_profile", "site_slug", "site_title", "source_type", "source_id", "source_slug",
      "source_title", "author_name", "parent_comment", "reply_to_profile", "comment", "comment_image",
      "status", "created_at"
    ].join(",");
    const INITIAL_COMMENT_VOTE_FIELDS = SHARED_FIELDS.commentVote || ["id", "comment", "vote", "vote_key", "member_profile", "created_at"].join(",");
    const INITIAL_POINT_EVENT_FIELDS = SHARED_FIELDS.pointEvent || ["id", "event_key", "event_type", "points", "member_profile", "source_collection", "source_id", "source_slug", "source_title", "created_at"].join(",");
    const INITIAL_PUBLIC_VISIT_FIELDS = SHARED_FIELDS.publicVisit || ["id", "member_profile", "site_slug", "site_title", "visited_at", "distance_miles"].join(",");
    const INITIAL_SITE_SUGGESTION_FIELDS = SHARED_FIELDS.siteSuggestion || ["id", "status", "title", "author_profile", "author_name", "author_email", "latitude", "longitude", "geojson", "submitted_at", "date_created", "review_note"].join(",");
    const INITIAL_ACCOUNT_REGISTRATION_FIELDS = [
      "id", "email", "email_normalized", "display_name", "status", "account_enabled", "account_banned",
      "review_note", "created_at", "date_created", "reviewed_at"
    ].join(",");
    const INITIAL_PLANT_OBSERVATION_FIELDS = SHARED_FIELDS.plantObservation || [
      "id", "status", "site_slug", "site_title", "source_type", "source_id", "source_slug", "source_title",
      "member_profile", "author_name", "photo", "common_name", "scientific_name", "confidence",
      "identification_status", "identification_source", "algonquian_word", "algonquian_source",
      "indigenous_context", "edible_safety", "medicinal_use", "native_status", "invasive_status",
      "endangered_status", "visitor_guidance", "visitor_notes", "public_submitted_at", "created_at"
    ].join(",");
    const INITIAL_MAP_STORY_FIELDS = SHARED_FIELDS.mapStory || [
      "id", "status", "prompt_key", "prompt_label", "caption", "photo",
      "latitude", "longitude", "location_source", "attached_site", "attached_site_slug", "attached_site_title",
      "member_profile", "author_name", "created_at", "expires_at", "expires_original_at",
      "permanent", "admin_permanent", "up_votes", "down_votes", "vote_score"
    ].join(",");
    const INITIAL_MAP_STORY_VOTE_FIELDS = SHARED_FIELDS.mapStoryVote || ["id", "story", "vote", "visitor_key", "member_profile", "created_at"].join(",");
    const MAP_STORY_BASE_LIFETIME_MS = SHARED_MAP_STORY.baseLifetimeMs || 24 * 60 * 60 * 1000;
    const MAP_STORY_VOTE_HOUR_MS = SHARED_MAP_STORY.voteHourMs || 60 * 60 * 1000;
    const MAP_STORY_PERMANENT_SCORE = SHARED_MAP_STORY.permanentScore || 10;
    const MAP_STORY_REFRESH_INTERVAL_MS = Math.max(60000, Number(SHARED_MAP_STORY.refreshIntervalMs || 5 * 60 * 1000));
    const PUBLIC_DIRECTUS_CACHE_TTL_MS = Math.max(5 * 60 * 1000, Number(SHARED_CONFIG.publicDirectusCacheTtlMs || SHARED_CONFIG.publicSocialCacheTtlMs || 10 * 60 * 1000));
    const MAP_STORY_RULES = {
      baseLifetimeMs: MAP_STORY_BASE_LIFETIME_MS,
      voteHourMs: MAP_STORY_VOTE_HOUR_MS,
      permanentScore: MAP_STORY_PERMANENT_SCORE
    };
    const INITIAL_LANGUAGE_PROGRESS_FIELDS = SHARED_FIELDS.languageProgress || ["id", "member_profile", "word_id", "english", "algonquian", "source", "content_key", "content_title", "correct", "answered_at"].join(",");
    const INITIAL_LOGIN_REWARD_FIELDS = SHARED_FIELDS.loginReward || ["id", "member_profile", "login_date", "streak_day", "created_at"].join(",");
    const INITIAL_PRINT_PURCHASE_FIELDS = SHARED_FIELDS.printPurchase || [
      "id", "status", "public_on_profile", "member_profile", "buyer_name", "artwork_title",
      "artwork_image_url", "source_type", "source_slug", "print_size", "material", "amount", "paid_at"
    ].join(",");
    const SEEDED_PUBLIC_PROFILES = SHARED_CONFIG.seededPublicProfiles || [];
    const SEEDED_WHALES_FIN_COMMENTS = SHARED_CONFIG.seededPublicComments || [];
    const INITIAL_SUPPORT_FIELDS = SHARED_FIELDS.support || ["id", "key", "title", "show_support_goal", "monthly_goal", "current_monthly_support", "donate_url", "support_note"].join(",");
    const INITIAL_TIMELINE_FIELDS = SHARED_FIELDS.timeline || [
      "id", "title", "description", "date_label", "period", "start_year", "end_year", "sort_key",
      "source_type", "source_id", "source_slug", "source_title", "source_section", "source_section_key", "location_label", "citation", "source_excerpt", "research_source_id", "latitude", "longitude"
    ].join(",");
    const BASIC_TIMELINE_FIELDS = SHARED_FIELDS.basicTimeline || [
      "id", "title", "description", "date_label", "period", "start_year", "end_year", "sort_key",
      "source_type", "source_id", "source_slug", "source_title", "source_section", "location_label", "latitude", "longitude"
    ].join(",");
    const TODO_MAP_FIELDS = SHARED_FIELDS.todoMap || [
      "id", "title", "connected_site", "todo_geojson", "todo_map_geometry_type", "todo_map_icon", "todo_map_notes", "ready_to_apply"
    ].join(",");

    async function loadData() {
      if (!window.NLI_EMBEDDED_DATA && window.NLI_EMBEDDED_DATA_READY) {
        window.NLI_LOAD_EMBEDDED_DATA?.();
        await window.NLI_EMBEDDED_DATA_READY.catch(error => {
          console.warn("Embedded site data did not finish loading before Directus fallback.", error);
        });
      }
      if (window.NLI_EMBEDDED_DATA) {
        const embeddedSites = window.NLI_EMBEDDED_DATA.sites || [];
        if (embeddedSites.length) {
          state.sites = repairSiteTitles(embeddedSites.map(SITE_UTILS.sanitizePublicSiteContent));
        } else if (!state.sites.length && window.NLI_MAP_DATA?.sites?.length) {
          state.sites = repairSiteTitles(window.NLI_MAP_DATA.sites);
        } else if (!state.sites.length) {
          const sitesResponse = await fetchJson(`/items/sites?limit=-1&filter[publication_status][_eq]=published&sort=title&fields=${INITIAL_SITE_FIELDS}`);
          state.sites = repairSiteTitles((sitesResponse.data || []).map(SITE_UTILS.sanitizePublicSiteContent));
        }
        state.layers = window.NLI_EMBEDDED_DATA.layers || [];
        state.wikiArticles = window.NLI_EMBEDDED_DATA.wikiArticles || [];
        state.siteContent = window.NLI_EMBEDDED_DATA.siteContent || [];
        state.blogPosts = window.NLI_EMBEDDED_DATA.blogPosts || [];
        state.calendarEvents = window.NLI_EMBEDDED_DATA.calendarEvents || [];
        state.contributorProfiles = mergeSeededProfiles(window.NLI_EMBEDDED_DATA.contributorProfiles || []);
        state.publicComments = mergeSeededComments(window.NLI_EMBEDDED_DATA.publicComments || []);
        state.commentVotes = window.NLI_EMBEDDED_DATA.commentVotes || [];
        state.profilePointEvents = window.NLI_EMBEDDED_DATA.profilePointEvents || [];
        state.publicVisits = window.NLI_EMBEDDED_DATA.publicVisits || [];
        state.siteSuggestions = window.NLI_EMBEDDED_DATA.siteSuggestions || [];
        state.plantObservations = window.NLI_EMBEDDED_DATA.plantObservations || [];
        state.mapStories = window.NLI_EMBEDDED_DATA.mapStories || [];
        state.mapStoryVotes = window.NLI_EMBEDDED_DATA.mapStoryVotes || [];
        state.languageQuizAttempts = window.NLI_EMBEDDED_DATA.languageQuizAttempts || [];
        state.profileLoginRewards = window.NLI_EMBEDDED_DATA.profileLoginRewards || [];
        state.artworkPrintPurchases = window.NLI_EMBEDDED_DATA.artworkPrintPurchases || [];
        state.supportSettings = window.NLI_EMBEDDED_DATA.supportSettings || null;
        state.timelineEvents = window.NLI_EMBEDDED_DATA.timelineEvents || [];
        state.todoMapTasks = window.NLI_EMBEDDED_DATA.todoMapTasks || [];
        state.placeNameAreas = window.NLI_EMBEDDED_DATA.placeNameAreas || { type: "FeatureCollection", features: [] };
        state.mediaMap = window.NLI_EMBEDDED_DATA.mediaMap || {};
        state.isLive = false;
        initializeIndexes();
        return;
      }
      try {
        const loadTimelineEvents = () =>
          fetchJson(`/items/timeline_events?limit=-1&sort=sort_key,date_label,title&fields=${INITIAL_TIMELINE_FIELDS}`)
            .catch(() => fetchJson(`/items/timeline_events?limit=-1&sort=sort_key,date_label,title&fields=${BASIC_TIMELINE_FIELDS}`))
            .catch(() => ({ data: [] }));
        const [sitesResponse, layersResponse, wikiResponse, contentResponse, blogResponse, eventsResponse, timelineResponse, todoMapResponse, supportResponse] = await Promise.all([
          fetchJson(`/items/sites?limit=-1&filter[publication_status][_eq]=published&sort=title&fields=${INITIAL_SITE_FIELDS}`),
          fetchJson("/items/map_layers?limit=-1"),
          fetchJson(`/items/wiki_articles?limit=-1&filter[status][_eq]=published&sort=title&fields=${INITIAL_WIKI_FIELDS}`),
          fetchJson(`/items/site_content?limit=-1&sort=content_type,title&fields=${INITIAL_PAGE_FIELDS}`),
          fetchJson(`/items/blog_posts?limit=-1&sort=-published_at,title&fields=${INITIAL_BLOG_FIELDS}`),
          fetchJson(`/items/calendar_events?limit=-1&sort=start_datetime,title&fields=${INITIAL_EVENT_FIELDS}`).catch(() => ({ data: [] })),
          loadTimelineEvents(),
          fetchJson(`/items/content_todo_items?limit=-1&fields=${TODO_MAP_FIELDS}`).catch(() => ({ data: [] })),
          fetchJson(`/items/project_support_settings?limit=1&filter[key][_eq]=native-long-island&fields=${INITIAL_SUPPORT_FIELDS}`).catch(() => ({ data: [] }))
        ]);
        state.sites = repairSiteTitles((sitesResponse.data || []).map(SITE_UTILS.sanitizePublicSiteContent));
        state.layers = layersResponse.data || [];
        state.wikiArticles = wikiResponse.data || [];
        state.siteContent = contentResponse.data || [];
        state.blogPosts = blogResponse.data || [];
        state.calendarEvents = eventsResponse.data || [];
        state.contributorProfiles = mergeSeededProfiles([]);
        state.publicComments = mergeSeededComments([]);
        state.siteSuggestions = [];
        state.plantObservations = [];
        state.mapStories = [];
        state.mapStoryVotes = [];
        state.supportSettings = supportResponse.data?.[0] || null;
        state.timelineEvents = timelineResponse.data || [];
        state.todoMapTasks = todoMapResponse.data || [];
        state.placeNameAreas = window.NLI_MAP_DATA?.placeNameAreas || window.NLI_EMBEDDED_DATA?.placeNameAreas || state.placeNameAreas;
        state.mediaMap = window.NLI_EMBEDDED_DATA?.mediaMap || {};
        state.isLive = true;
      } catch (error) {
        if (!window.NLI_EMBEDDED_DATA) throw error;
        const fallbackSites = window.NLI_EMBEDDED_DATA.sites || window.NLI_MAP_DATA?.sites || state.sites || [];
        if (fallbackSites.length) state.sites = repairSiteTitles(fallbackSites.map(SITE_UTILS.sanitizePublicSiteContent));
        state.layers = window.NLI_EMBEDDED_DATA.layers || [];
        state.wikiArticles = window.NLI_EMBEDDED_DATA.wikiArticles || [];
        state.siteContent = window.NLI_EMBEDDED_DATA.siteContent || [];
        state.blogPosts = window.NLI_EMBEDDED_DATA.blogPosts || [];
        state.calendarEvents = window.NLI_EMBEDDED_DATA.calendarEvents || [];
        state.contributorProfiles = mergeSeededProfiles(window.NLI_EMBEDDED_DATA.contributorProfiles || []);
        state.publicComments = mergeSeededComments(window.NLI_EMBEDDED_DATA.publicComments || []);
        state.commentVotes = window.NLI_EMBEDDED_DATA.commentVotes || [];
        state.profilePointEvents = window.NLI_EMBEDDED_DATA.profilePointEvents || [];
        state.publicVisits = window.NLI_EMBEDDED_DATA.publicVisits || [];
        state.siteSuggestions = window.NLI_EMBEDDED_DATA.siteSuggestions || [];
        state.plantObservations = window.NLI_EMBEDDED_DATA.plantObservations || [];
        state.mapStories = window.NLI_EMBEDDED_DATA.mapStories || [];
        state.mapStoryVotes = window.NLI_EMBEDDED_DATA.mapStoryVotes || [];
        state.languageQuizAttempts = window.NLI_EMBEDDED_DATA.languageQuizAttempts || [];
        state.profileLoginRewards = window.NLI_EMBEDDED_DATA.profileLoginRewards || [];
        state.artworkPrintPurchases = window.NLI_EMBEDDED_DATA.artworkPrintPurchases || [];
        state.supportSettings = window.NLI_EMBEDDED_DATA.supportSettings || null;
        state.timelineEvents = window.NLI_EMBEDDED_DATA.timelineEvents || [];
        state.todoMapTasks = window.NLI_EMBEDDED_DATA.todoMapTasks || [];
        state.placeNameAreas = window.NLI_EMBEDDED_DATA.placeNameAreas || { type: "FeatureCollection", features: [] };
        state.mediaMap = window.NLI_EMBEDDED_DATA.mediaMap || {};
        state.isLive = false;
        showBanner("Showing saved preview data because live content could not be reached.");
      }
      initializeIndexes();
    }

    async function loadInitialMapData() {
      if (!window.NLI_MAP_DATA && window.NLI_MAP_DATA_READY) {
        await window.NLI_MAP_DATA_READY.catch(error => {
          console.warn("Compact map data did not finish loading before Directus fallback.", error);
        });
      }
      const mapData = window.NLI_MAP_DATA;
      if (!mapData || !Array.isArray(mapData.sites) || !mapData.sites.length) return false;
      state.sites = repairSiteTitles(mapData.sites || []);
      state.layers = mapData.layers || [];
      state.wikiArticles = [];
      state.siteContent = [];
      state.blogPosts = [];
      state.calendarEvents = mapData.calendarEvents || [];
      state.mapStories = mapData.mapStories || [];
      state.mapStoryVotes = mapData.mapStoryVotes || [];
      state.timelineEvents = [];
      state.todoMapTasks = mapData.todoMapTasks || [];
      state.placeNameAreas = mapData.placeNameAreas || { type: "FeatureCollection", features: [] };
      state.mediaMap = mapData.mediaMap || {};
      state.loadedCompactMapData = true;
      initializeIndexes();
      return true;
    }

    function applySiteIconUpdates(rows = []) {
      let changed = false;
      rows.forEach(row => {
        const id = Number(row?.id);
        const slug = String(row?.slug || "");
        const site = (Number.isFinite(id) && state.siteById.get(id)) || (slug && state.siteBySlug.get(slug));
        if (!site) return;
        const nextIcon = row.map_icon || null;
        if ((site.map_icon || null) === nextIcon) return;
        site.map_icon = nextIcon;
        changed = true;
      });
      if (!changed) return false;
      initializeIndexes();
      clearFeatureCache();
      if (state.map && !state.usingLeafletFallback) {
        loadMarkerIcons().then(() => {
          if (state.map?.getSource("directus-site-icons")) state.map.getSource("directus-site-icons").setData(filterByCategory(customSiteIconFeatures()));
          if (state.map?.getSource("directus-site-geometries")) state.map.getSource("directus-site-geometries").setData(filterByCategory(filteredManagedSiteFeatures()));
        });
      } else if (state.usingLeafletFallback) {
        renderLeafletArchiveLayers(state.leafletStartupFullRenderPending
          ? { polygonsOnly: true, includeBiographyPeople: false }
          : { skipIfStable: true, viewportOnly: true, viewportPad: 0.42, pointLimit: LEAFLET_VIEWPORT_POINT_LIMIT });
      }
      return true;
    }

    async function refreshSiteIconFieldsFromDirectus() {
      if (!state.isLive && window.NLI_EMBEDDED_DATA) return false;
      try {
        const response = await fetchJson("/items/sites?limit=-1&filter[publication_status][_eq]=published&fields=id,slug,map_icon");
        return applySiteIconUpdates(response.data || []);
      } catch (error) {
        console.warn("Directus site icons will use bundled values for now.", error);
        return false;
      }
    }

    async function loadDeferredSocialData() {
      const socialMode = state.contributorSession?.token || isCurrentAdminReviewer() ? "full" : "public";
      if (state.deferredSocialDataLoaded && (state.deferredSocialDataMode === "full" || socialMode === "public")) return true;
      if (state.deferredSocialDataLoading && state.deferredSocialDataPromise) {
        if (socialMode === "public" || state.deferredSocialDataRequestMode === "full") return state.deferredSocialDataPromise;
        return state.deferredSocialDataPromise.then(() => loadDeferredSocialData());
      }
      state.deferredSocialDataLoading = true;
      state.deferredSocialDataRequestMode = socialMode;
      state.deferredSocialDataPromise = (async () => {
      try {
        const currentRowsFallback = rows => PROFILE_UTILS.rowsFallback(rows);
        const existingRows = rows => Promise.resolve(currentRowsFallback(rows));
        const mergePublicRows = (currentRows = [], nextRows = [], keyFields = ["id"]) => {
          const merged = [...currentRows];
          (nextRows || []).filter(Boolean).forEach(row => {
            const key = keyFields.map(field => String(row?.[field] || "")).find(Boolean);
            const index = key
              ? merged.findIndex(item => keyFields.some(field => String(item?.[field] || "") === key))
              : -1;
            if (index >= 0) merged[index] = { ...merged[index], ...row };
            else merged.push(row);
          });
          return merged;
        };
        const preserveActiveProfileRows = (nextRows, currentRows, profileFields = ["member_profile"]) => {
          if (!state.contributorSession) return Array.isArray(nextRows) ? nextRows : [];
          return PROFILE_UTILS.preserveActiveProfileRows(nextRows, currentRows, currentContributorProfile() || state.contributorSession, {
            profileFields,
            candidates: state.contributorProfiles,
            relationId,
            fallbackProfileId: state.contributorSession?.profileId,
            fallbackEmail: state.contributorSession?.email,
            extraNames: [state.contributorSession?.displayName, state.contributorSession?.email]
          });
        };
        const fullSocialData = socialMode === "full";
        if (!fullSocialData) {
          let publicActivityRenderTimer = null;
          const renderPublicActivityData = (options = {}) => {
            window.clearTimeout(publicActivityRenderTimer);
            publicActivityRenderTimer = null;
            const renderNow = () => {
              renderActivityPanel();
              renderNotificationPanel();
            };
            if (options.flush) {
              renderNow();
              return;
            }
            publicActivityRenderTimer = window.setTimeout(renderNow, 80);
          };
          const flushPublicActivityDataRender = () => {
            window.clearTimeout(publicActivityRenderTimer);
            publicActivityRenderTimer = null;
            renderActivityPanel();
            renderNotificationPanel();
          };
          const publicSocialTasks = [
            fetchCachedPublicJson(`/items/mobile_comments?limit=80&filter[status][_eq]=approved&filter[public_activity][_eq]=true&sort=-created_at&fields=${INITIAL_PUBLIC_COMMENT_FIELDS}`, "public-comments")
              .catch(() => existingRows(state.publicComments))
              .then(commentsResponse => {
                state.publicComments = mergeSeededComments(mergePublicRows(state.publicComments, commentsResponse.data, ["id", "created_at", "comment"]));
                renderPublicActivityData();
              }),
            fetchCachedPublicJson(`/items/site_suggestions?limit=40&filter[status][_eq]=approved&sort=-submitted_at,-date_created&fields=${INITIAL_SITE_SUGGESTION_FIELDS}`, "public-site-suggestions")
              .catch(() => existingRows(state.siteSuggestions))
              .then(suggestionsResponse => {
                state.siteSuggestions = mergePublicRows(state.siteSuggestions, suggestionsResponse.data, ["id", "title"]);
                renderPublicActivityData();
              }),
            fetchCachedPublicJson(`/items/mobile_plant_observations?limit=80&filter[status][_eq]=approved&sort=-created_at&fields=${INITIAL_PLANT_OBSERVATION_FIELDS}`, "public-plant-observations")
              .catch(() => existingRows(state.plantObservations))
              .then(plantResponse => {
                state.plantObservations = mergePublicRows(state.plantObservations, plantResponse.data, ["id", "created_at"]);
                renderPublicActivityData();
              })
          ];
          await Promise.all(publicSocialTasks);
          flushPublicActivityDataRender();
          repaintActiveContentPreservingScroll();
          renderContributorLoginButton();
          state.deferredSocialDataLoaded = true;
          state.deferredSocialDataMode = socialMode;
          return true;
        }
        const siteSuggestionsRequest = fetchJson(`/items/site_suggestions?limit=-1&fields=${INITIAL_SITE_SUGGESTION_FIELDS}`)
          .catch(() => currentRowsFallback(state.siteSuggestions));
        const [profilesResponse, commentsResponse, commentVotesResponse, pointEventsResponse, visitsResponse, suggestionsResponse, registrationsResponse, plantResponse, storyResponse, storyVotesResponse, languageResponse, loginRewardsResponse, purchasesResponse] = await Promise.all([
          fetchJson(`/items/mobile_member_profiles?limit=-1&sort=display_name&fields=${INITIAL_PROFILE_FIELDS}`).catch(() => currentRowsFallback(state.contributorProfiles)),
          fetchJson(`/items/mobile_comments?limit=-1&filter[status][_eq]=approved&filter[public_activity][_eq]=true&sort=-created_at&fields=${INITIAL_PUBLIC_COMMENT_FIELDS}`).catch(() => currentRowsFallback(state.publicComments)),
          fetchJson(`/items/mobile_comment_votes?limit=-1&fields=${INITIAL_COMMENT_VOTE_FIELDS}`).catch(() => currentRowsFallback(state.commentVotes)),
          fetchJson(`/items/mobile_point_events?limit=-1&fields=${INITIAL_POINT_EVENT_FIELDS}`).catch(() => currentRowsFallback(state.profilePointEvents)),
          fetchJson(`/items/mobile_site_visits?limit=-1&fields=${INITIAL_PUBLIC_VISIT_FIELDS}`).catch(() => currentRowsFallback(state.publicVisits)),
          siteSuggestionsRequest,
          adminAccountRegistrationsRequest().catch(() => currentRowsFallback(state.accountRegistrations)),
          fetchJson(`/items/mobile_plant_observations?limit=-1&filter[status][_eq]=approved&sort=-created_at&fields=${INITIAL_PLANT_OBSERVATION_FIELDS}`).catch(() => currentRowsFallback(state.plantObservations)),
          fetchJson(`/items/mobile_map_stories?limit=-1&fields=${INITIAL_MAP_STORY_FIELDS}`).catch(() => ({ data: state.mapStories || [] })),
          fetchJson(`/items/mobile_map_story_votes?limit=-1&fields=${INITIAL_MAP_STORY_VOTE_FIELDS}`).catch(() => ({ data: state.mapStoryVotes || [] })),
          fetchJson(`/items/mobile_language_quiz_progress?limit=-1&fields=${INITIAL_LANGUAGE_PROGRESS_FIELDS}`).catch(() => currentRowsFallback(state.languageQuizAttempts)),
          fetchJson(`/items/mobile_profile_logins?limit=-1&fields=${INITIAL_LOGIN_REWARD_FIELDS}`).catch(() => currentRowsFallback(state.profileLoginRewards)),
          fetchJson(`/items/artwork_print_purchases?limit=-1&fields=${INITIAL_PRINT_PURCHASE_FIELDS}`).catch(() => currentRowsFallback(state.artworkPrintPurchases))
        ]);
        state.contributorProfiles = mergeSeededProfiles(profilesResponse.data || []);
        state.publicComments = mergeSeededComments(fullSocialData
          ? preserveActiveProfileRows(commentsResponse.data, state.publicComments)
          : mergePublicRows(state.publicComments, commentsResponse.data, ["id", "created_at", "comment"]));
        state.commentVotes = preserveActiveProfileRows(commentVotesResponse.data, state.commentVotes);
        state.profilePointEvents = preserveActiveProfileRows(pointEventsResponse.data, state.profilePointEvents);
        state.publicVisits = preserveActiveProfileRows(visitsResponse.data, state.publicVisits);
        state.siteSuggestions = fullSocialData
          ? preserveActiveProfileRows(suggestionsResponse.data, state.siteSuggestions, ["author_profile"])
          : mergePublicRows(state.siteSuggestions, suggestionsResponse.data, ["id", "title"]);
        state.accountRegistrations = registrationsResponse.data || [];
        state.plantObservations = fullSocialData ? (plantResponse.data || []) : mergePublicRows(state.plantObservations, plantResponse.data, ["id", "created_at"]);
        state.mapStories = storyResponse.data || state.mapStories || [];
        state.mapStoryVotes = storyVotesResponse.data || state.mapStoryVotes || [];
        state.languageQuizAttempts = preserveActiveProfileRows(languageResponse.data, state.languageQuizAttempts);
        state.profileLoginRewards = preserveActiveProfileRows(loginRewardsResponse.data, state.profileLoginRewards);
        state.artworkPrintPurchases = preserveActiveProfileRows(purchasesResponse.data, state.artworkPrintPurchases);
        if (state.contributorSession) await refreshContributorSessionApproval({ silent: true });
        renderContributorLoginButton();
        renderActivityPanel();
        renderNotificationPanel();
        if (state.map?.getSource("map-stories")) state.map.getSource("map-stories").setData(mapStoryFeatures());
        if (state.activeContent?.type === "site" && state.activeContent.slug) {
          const activeSite = state.siteBySlug.get(state.activeContent.slug);
          if (activeSite && articleEl.classList.contains("open")) {
            const previousScroll = articleBodyEl.scrollTop;
            await openListing(activeSite, {
              source: articleHeadEl.querySelector(".article-kicker")?.textContent || "Archive listing",
              skipHistory: true,
              skipRoute: true,
              focus: false
            });
            articleBodyEl.scrollTop = previousScroll;
          }
        }
        state.deferredSocialDataLoaded = true;
        state.deferredSocialDataMode = socialMode;
        return true;
      } catch (error) {
        console.warn("Community data will load later.", error);
        return false;
      } finally {
        state.deferredSocialDataLoading = false;
        state.deferredSocialDataPromise = null;
        state.deferredSocialDataRequestMode = "";
      }
      })();
      return state.deferredSocialDataPromise;
    }

    async function refreshSignedInProfileAfterOpen(options = {}) {
      if (!state.contributorSession || state.contributorSession.pending) return null;
      const loaded = await loadDeferredSocialData();
      const reward = await awardDailyLoginReward({ silent: options.silent !== false });
      const profile = currentContributorProfile();
      if (profile) await ensureCanonicalProfilePointEvents(profile).catch(() => false);
      renderContributorLoginButton();
      return { loaded, reward };
    }

    function mapStoryRefreshSignature(stories = [], votes = []) {
      const storyPart = (stories || []).map(story => [
        story?.id,
        story?.status,
        story?.expires_at,
        story?.permanent,
        story?.admin_permanent,
        story?.up_votes,
        story?.down_votes,
        story?.vote_score,
        story?.created_at
      ].map(value => String(value ?? "")).join(":")).sort().join("|");
      const votePart = (votes || []).map(vote => [
        vote?.id,
        vote?.story,
        vote?.vote,
        vote?.visitor_key,
        relationId(vote?.member_profile),
        vote?.created_at
      ].map(value => String(value ?? "")).join(":")).sort().join("|");
      return `${storyPart}::${votePart}`;
    }

    async function refreshMapStories(options = {}) {
      if (document.hidden && !options.force) return false;
      try {
        const [storyResponse, storyVotesResponse] = await Promise.all([
          fetchCachedPublicJson(`/items/mobile_map_stories?limit=-1&fields=${INITIAL_MAP_STORY_FIELDS}`, "public-map-stories").catch(() => ({ data: state.mapStories || [] })),
          fetchCachedPublicJson(`/items/mobile_map_story_votes?limit=-1&fields=${INITIAL_MAP_STORY_VOTE_FIELDS}`, "public-map-story-votes").catch(() => ({ data: state.mapStoryVotes || [] }))
        ]);
        const nextStories = storyResponse.data || state.mapStories || [];
        const nextVotes = storyVotesResponse.data || state.mapStoryVotes || [];
        if (!options.force && mapStoryRefreshSignature(nextStories, nextVotes) === mapStoryRefreshSignature(state.mapStories, state.mapStoryVotes)) {
          return false;
        }
        state.mapStories = nextStories;
        state.mapStoryVotes = nextVotes;
        if (state.map?.getSource("map-stories")) state.map.getSource("map-stories").setData(mapStoryFeatures());
        renderActivityPanel();
        renderNotificationPanel();
        return true;
      } catch (error) {
        console.warn("Map stories will refresh later.", error);
        return false;
      }
    }

    function startMapStoryRefresh() {
      if (state.mapStoryRefreshTimer) return;
      refreshMapStories();
      state.mapStoryRefreshTimer = window.setInterval(refreshMapStories, MAP_STORY_REFRESH_INTERVAL_MS);
    }

    async function loadDeferredMapAndTimelineData() {
      const requests = [];
      let loadedLegacyMapLayers = false;
      let loadedTimelineEvents = false;
      const hasLegacyMapLayers = (state.layers || []).some(layer =>
        layer.slug === "imported-wp-go-maps-markers" || layer.slug === "imported-wp-go-maps-polygons"
      );
      if (!hasLegacyMapLayers) {
        requests.push(fetchCachedPublicJson("/items/map_layers?limit=-1", "deferred-map-layers")
          .then(response => {
            state.layers = response.data || [];
            loadedLegacyMapLayers = true;
          })
          .catch(error => console.warn("Legacy map layers will load later.", error)));
      }
      if (!state.timelineEvents?.length) {
        requests.push(fetchCachedPublicJson(`/items/timeline_events?limit=-1&sort=sort_key,date_label,title&fields=${INITIAL_TIMELINE_FIELDS}`, "deferred-timeline-events")
          .catch(() => fetchCachedPublicJson(`/items/timeline_events?limit=-1&sort=sort_key,date_label,title&fields=${BASIC_TIMELINE_FIELDS}`, "deferred-timeline-events-basic"))
          .then(response => {
            state.timelineEvents = response.data || [];
            loadedTimelineEvents = true;
          })
          .catch(error => console.warn("Historic timeline will load later.", error)));
      }
      if (!requests.length) return;
      await Promise.all(requests);
      if (loadedTimelineEvents) {
        initializeIndexes();
        renderDailyLearningCard();
        renderUpcomingExhibitCard();
        renderTimelineDock();
        renderActivityPanel();
      } else if (loadedLegacyMapLayers) {
        clearFeatureCache();
      }
      if (state.map && !state.usingLeafletFallback) {
        applyLayerVisibility();
        loadMarkerIcons().then(() => {
          if (state.map?.getSource("wp-markers-icons")) state.map.getSource("wp-markers-icons").setData(markerIconFeatures());
          if (state.map?.getSource("directus-site-icons")) state.map.getSource("directus-site-icons").setData(filterByCategory(customSiteIconFeatures()));
        });
      } else if (state.usingLeafletFallback) {
        renderLeafletArchiveLayers(state.leafletStartupFullRenderPending
          ? { polygonsOnly: true, includeBiographyPeople: false }
          : { skipIfStable: true, viewportOnly: true, viewportPad: 0.42, pointLimit: LEAFLET_VIEWPORT_POINT_LIMIT });
      }
    }

    async function refreshReadyTodoMapTasks() {
      if (!isFrontendAdmin()) return false;
      try {
        const response = await fetchJson(`/items/content_todo_items?limit=-1&fields=${TODO_MAP_FIELDS}`);
        state.todoMapTasks = response.data || state.todoMapTasks || [];
        return true;
      } catch {
        state.todoMapTasks = state.todoMapTasks || [];
        return false;
      }
    }

    function applyReadyTodoMapTasks() {
      const readyTasks = (state.todoMapTasks || []).filter(task =>
        task.ready_to_apply && task.todo_geojson && task.connected_site
      );
      for (const task of readyTasks) {
        const site = state.siteById.get(Number(task.connected_site)) ||
          state.sites.find(item => Number(item.id) === Number(task.connected_site));
        if (!site) continue;
        const hasDirectusGeometry = !!site.geojson;
        if (!hasDirectusGeometry) {
          site.geojson = task.todo_geojson;
          site.map_geometry_type = task.todo_map_geometry_type || task.todo_geojson.type || site.map_geometry_type || "Point";
          site.map_geometry_source = "todo_ready_to_apply";
        }
        site.map_editor_notes = task.todo_map_notes || site.map_editor_notes || "";
        if (task.todo_map_icon) site.map_icon = task.todo_map_icon;
        site.todo_map_task_id = task.id;
        site.todo_map_task_title = task.title;
      }
      clearFeatureCache();
    }

    function initializeIndexes() {
      clearRelatedSiteCaches();
      clearSiteListCaches();
      clearEraKeyCaches();
      clearTimelineEventCaches();
      state.featurePreviewCache.clear();
      state.siteDisplayGeometryCache = new WeakMap();
      state.geometryBoundsCache = new WeakMap();
      state.biographyMappedGeometryCache.clear();
      state.biographyWaterCoordinateCache.clear();
      state.sites = repairSiteTitles(state.sites);
      state.siteById = new Map(state.sites.map(site => [Number(site.id), site]));
      applyReadyTodoMapTasks();
      state.siteBySlug = new Map(state.sites.map(site => [site.slug, site]));
      const importedWikiSlugs = new Set(state.wikiArticles.map(article => article.slug));
      state.wikiArticles = [
        ...state.wikiArticles,
        ...[...TRIBAL_ARTICLES, ...VIRTUAL_WIKI_ARTICLES].filter(article => !importedWikiSlugs.has(article.slug))
      ].map(sanitizePublicWikiArticle);
      state.wikiById = new Map();
      state.wikiArticles.forEach(article => {
        if (article.id === undefined || article.id === null || article.id === "") return;
        const numericId = Number(article.id);
        if (Number.isFinite(numericId)) state.wikiById.set(numericId, article);
        state.wikiById.set(String(article.id), article);
      });
      state.wikiBySlug = new Map(state.wikiArticles.map(article => [article.slug, article]));
      state.contentBySlug = new Map(state.siteContent.map(item => [item.slug, item]));
      state.blogBySlug = new Map(state.blogPosts.map(item => [item.slug, item]));
      state.calendarEvents = normalizeCalendarEvents(state.calendarEvents);
      state.eventBySlug = new Map(state.calendarEvents.map(item => [item.slug, item]));
      state.timelineById = new Map(state.timelineEvents.map(item => [String(item.id), item]));
      state.linkTerms = buildInternalLinkTerms();
      state.searchIndex = buildSearchIndex();
      initializeGuidedLearningPaths();
      renderGuidedPathsUi();
    }

    function prepareSearchIndexEntry(entry = {}) {
      return {
        ...entry,
        searchTitleKey: normalizeComparisonText(entry.title || ""),
        searchSummaryKey: normalizeComparisonText(entry.summary || ""),
        searchBodyKey: normalizeComparisonText(entry.body || "")
      };
    }

    function buildSearchIndex() {
      return [
        ...state.sites.map(item => {
          const searchSections = state.siteSearchSectionsBySlug.get(item.slug) || [];
          return {
            type: "listing",
            label: "Listing",
            title: item.title,
            summary: item.summary,
            body: searchSections.length
              ? searchSections.map(([, content]) => content).filter(Boolean).join(" ")
              : listingSearchText(item),
            searchSections,
            item
          };
        }),
        ...state.wikiArticles.map(item => ({
          type: "wiki",
          label: "Knowledgebase",
          title: item.title,
          summary: item.summary,
          body: [item.content, item.why_this_matters].map(stripHtml).join(" "),
          item
        })),
        ...state.blogPosts.map(item => ({
          type: "blog",
          label: "Blog",
          title: item.title,
          summary: item.summary,
          body: stripHtml(item.content || ""),
          item
        })),
        ...state.calendarEvents.map(item => ({
          type: "event",
          label: "Event",
          title: item.title,
          summary: item.summary || CALENDAR_UTILS.eventDateRange(item),
          body: [item.venue, item.address_label, item.collection_piece_title, item.collection_artist].map(value => stripHtml(value || "")).join(" "),
          item
        })),
        ...state.siteContent
          .filter(item => !/cart|checkout|my-account|shop|search|wp-|map/i.test(`${item.slug || ""} ${item.title || ""}`))
          .map(item => ({
            type: item.content_type,
            label: item.content_type === "post" ? "Blog archive" : "Page",
            title: item.title,
            summary: item.summary,
            body: stripHtml(item.content || ""),
            item
          }))
      ].map(prepareSearchIndexEntry);
    }

    async function ensureSiteSearchData() {
      if (state.siteSearchDataLoaded) return true;
      if (state.siteSearchDataPromise) return state.siteSearchDataPromise;
      state.siteSearchDataPromise = (async () => {
        if (!window.NLI_SITE_SEARCH_DATA && window.NLI_SITE_SEARCH_DATA_READY) {
          window.NLI_LOAD_SITE_SEARCH_DATA?.();
          await window.NLI_SITE_SEARCH_DATA_READY;
        }
        const rows = window.NLI_SITE_SEARCH_DATA?.sites || [];
        state.siteSearchSectionsBySlug = new Map(rows
          .filter(row => row?.slug && Array.isArray(row.sections))
          .map(row => [row.slug, row.sections]));
        state.siteSearchDataLoaded = state.siteSearchSectionsBySlug.size > 0;
        state.searchIndex = buildSearchIndex();
        return state.siteSearchDataLoaded;
      })().finally(() => {
        state.siteSearchDataPromise = null;
      });
      return state.siteSearchDataPromise;
    }

    function listingSearchText(item) {
      return [
        item?.slug,
        item?.site_type,
        item?.address_label,
        item?.summary,
        item?.why_this_matters,
        item?.introduction_content,
        item?.history_content,
        item?.oral_history_content,
        item?.translation_content,
        item?.preservation_content,
        item?.colonial_description_content,
        item?.land_loss_content,
        item?.artifacts_content,
        item?.excavation_content,
        item?.vandalism_content,
        item?.whereintheworld_content,
        item?.known_plant_species,
        item?.ancestral_territory,
        item?.ancestral_territory_note,
        Array.isArray(item?.source_list)
          ? item.source_list.map(source => [source?.title, source?.author, source?.citation, source?.citation_context].filter(Boolean).join(" ")).join(" ")
          : ""
      ].map(value => stripHtml(value || "")).filter(Boolean).join(" ");
    }

    function loadGuidedLearningPathProgress() {
      try {
        const parsed = JSON.parse(localStorage.getItem(GUIDED_LEARNING_PATH_PROGRESS_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        localStorage.removeItem(GUIDED_LEARNING_PATH_PROGRESS_KEY);
        return {};
      }
    }

    function saveGuidedLearningPathProgress() {
      try {
        localStorage.setItem(GUIDED_LEARNING_PATH_PROGRESS_KEY, JSON.stringify(state.learningPathProgress || {}));
      } catch {}
    }

    function normalizeGuidedPathStop(stop, index, path) {
      const raw = Array.isArray(stop) ? {
        site_slug: stop[0],
        why_this_stop_matters: stop[1],
        path_question: stop[2],
        sensitive_note: stop[3]
      } : (stop || {});
      const siteId = relationId(raw.site_id || raw.site || raw.directus_site || raw.connected_site);
      const rawSlug = raw.site_slug || raw.slug || raw.siteSlug || raw.directus_site_slug || raw.site?.slug || "";
      const slug = listingSlugAlias(rawSlug);
      const site = (slug && state.siteBySlug.get(slug)) ||
        (siteId && state.siteById.get(Number(siteId))) ||
        null;
      if (!site) return null;
      const stopNumber = Number(raw.stop_number || raw.sort_order || index + 1);
      return {
        id: raw.id || `${path.slug}-${site.slug}-${stopNumber}`,
        pathSlug: path.slug,
        site,
        siteSlug: site.slug,
        stop_number: Number.isFinite(stopNumber) ? stopNumber : index + 1,
        stop_title_override: raw.stop_title_override || raw.title || "",
        why_this_stop_matters: raw.why_this_stop_matters || raw.why || "",
        path_question: raw.path_question || raw.question || "",
        short_activity: raw.short_activity || raw.activity || "",
        sensitive_note: raw.sensitive_note || "",
        show_exact_location: raw.show_exact_location !== false,
        is_required: raw.is_required !== false,
        sort_order: Number(raw.sort_order || stopNumber || index + 1)
      };
    }

    function normalizeGuidedLearningPath(path = {}, index = 0) {
      const slug = String(path.slug || path.title || `guided-path-${index + 1}`)
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const stops = (path.stops || path.sites || [])
        .map((stop, stopIndex) => normalizeGuidedPathStop(stop, stopIndex, { ...path, slug }))
        .filter(Boolean)
        .sort((a, b) => a.stop_number - b.stop_number || a.sort_order - b.sort_order);
      if (!slug || !path.title || !stops.length) return null;
      return {
        id: path.id || slug,
        title: path.title,
        slug,
        short_description: path.short_description || path.description || "",
        long_intro: path.long_intro || path.introduction || path.short_description || "",
        theme: path.theme || "",
        estimated_time_minutes: Number(path.estimated_time_minutes || path.minutes || 0),
        recommended_grades: path.recommended_grades || "",
        cover_image: path.cover_image || "",
        icon: path.icon || "",
        badge_name: path.badge_name || "",
        key_questions: Array.isArray(path.key_questions)
          ? path.key_questions.filter(Boolean)
          : String(path.key_questions || "").split(/\n|;/).map(value => value.trim()).filter(Boolean),
        sensitivity_level: path.sensitivity_level || "general",
        is_public: path.is_public !== false,
        sort_order: Number(path.sort_order || index + 1),
        stops
      };
    }

    function initializeGuidedLearningPaths(paths = null) {
      const source = Array.isArray(paths) && paths.length ? paths : GUIDED_LEARNING_PATH_SEEDS;
      const normalized = source
        .map((path, index) => normalizeGuidedLearningPath(path, index))
        .filter(path => path && path.is_public)
        .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
      state.learningPaths = normalized;
      state.learningPathBySlug = new Map(normalized.map(path => [path.slug, path]));
      if (state.activeLearningPathSlug && !state.learningPathBySlug.has(state.activeLearningPathSlug)) {
        state.activeLearningPathSlug = "";
        state.activeLearningPathStopIndex = 0;
      }
    }

    async function loadGuidedLearningPathsFromDirectus() {
      try {
        const pathFields = "id,title,slug,short_description,long_intro,theme,estimated_time_minutes,recommended_grades,cover_image,icon,badge_name,key_questions,sensitivity_level,is_public,sort_order";
        const stopFields = "id,learning_path_id,site_id,stop_number,stop_title_override,why_this_stop_matters,path_question,short_activity,sensitive_note,show_exact_location,is_required,sort_order";
        const [pathResponse, stopResponse] = await Promise.all([
          fetchJson(`/items/learning_paths?limit=-1&filter[is_public][_eq]=true&sort=sort_order,title&fields=${pathFields}`).catch(() => ({ data: [] })),
          fetchJson(`/items/learning_path_sites?limit=-1&sort=sort_order,stop_number&fields=${stopFields}`).catch(() => ({ data: [] }))
        ]);
        const rows = pathResponse.data || [];
        if (!rows.length) return false;
        const stopsByPath = new Map();
        (stopResponse.data || []).forEach(stop => {
          const pathId = relationId(stop.learning_path_id);
          if (!pathId) return;
          if (!stopsByPath.has(String(pathId))) stopsByPath.set(String(pathId), []);
          stopsByPath.get(String(pathId)).push(stop);
        });
        const directusPaths = rows.map(row => ({ ...row, stops: stopsByPath.get(String(row.id)) || [] }));
        const pathsBySlug = new Map();
        GUIDED_LEARNING_PATH_SEEDS.forEach(path => {
          if (path?.slug) pathsBySlug.set(path.slug, path);
        });
        directusPaths.forEach(path => {
          if (path?.slug) pathsBySlug.set(path.slug, path);
        });
        const paths = [...pathsBySlug.values()];
        const previous = state.learningPaths;
        initializeGuidedLearningPaths(paths);
        if (!state.learningPaths.length) {
          initializeGuidedLearningPaths(previous);
          return false;
        }
        renderGuidedPathsUi();
        syncFilteredViews();
        return true;
      } catch (error) {
        console.warn("Guided learning paths will use bundled routes for now.", error);
        return false;
      }
    }

    function ensureGuidedLearningPathsFromDirectus() {
      if (state.learningPathsDirectusRequested) return state.learningPathsDirectusPromise || Promise.resolve(false);
      state.learningPathsDirectusRequested = true;
      state.learningPathsDirectusPromise = loadGuidedLearningPathsFromDirectus()
        .finally(() => {
          state.learningPathsDirectusPromise = null;
        });
      return state.learningPathsDirectusPromise;
    }

    function activeGuidedLearningPath() {
      return state.activeLearningPathSlug ? state.learningPathBySlug.get(state.activeLearningPathSlug) || null : null;
    }

    function guidedLearningPathStop(path = activeGuidedLearningPath(), index = state.activeLearningPathStopIndex) {
      if (!path?.stops?.length) return null;
      return path.stops[Math.max(0, Math.min(path.stops.length - 1, Number(index) || 0))] || null;
    }

    function guidedLearningPathCompletedSet(path) {
      const entry = state.learningPathProgress?.[path?.slug] || {};
      return new Set(Array.isArray(entry.completedStops) ? entry.completedStops : []);
    }

    function guidedLearningPathStats(path) {
      const total = path?.stops?.length || 0;
      const completed = total ? path.stops.filter(stop => guidedLearningPathCompletedSet(path).has(stop.siteSlug)).length : 0;
      return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
    }

    function guidedLearningPathStopTitle(stop) {
      return stop?.stop_title_override || stop?.site?.title || "Path stop";
    }

    function guidedLearningPathButtonLabel(path) {
      if (!path) return "";
      const stats = guidedLearningPathStats(path);
      return stats.completed ? `Resume Path` : "Start Path";
    }

    function fitGuidedLearningPathQuickButtons() {
      if (!guidedPathsEl || !guidedPathsCollapsedEl || activeGuidedLearningPath() || guidedPathsEl.classList.contains("is-hidden")) return;
      guidedPathsEl.classList.remove("quick-hide-place", "quick-hide-coast", "quick-hide-all");
      if (window.matchMedia("(max-width: 860px)").matches) return;
      const overflows = () => {
        const quick = guidedPathsEl.querySelector(".guided-paths-quick");
        return guidedPathsCollapsedEl.scrollWidth > guidedPathsCollapsedEl.clientWidth + 1 ||
          (quick && quick.scrollWidth > quick.clientWidth + 1);
      };
      if (!overflows()) return;
      guidedPathsEl.classList.add("quick-hide-place");
      if (!overflows()) return;
      guidedPathsEl.classList.add("quick-hide-coast");
      if (!overflows()) return;
      guidedPathsEl.classList.add("quick-hide-all");
    }

    function renderGuidedPathsUi() {
      if (!guidedPathsEl || !guidedPathsCollapsedEl || !guidedPathsDrawerEl) return;
      const active = activeGuidedLearningPath();
      guidedPathsEl.classList.toggle("is-hidden", !active && !state.guidedPathsExpanded);
      guidedPathsEl.classList.toggle("is-expanded", state.guidedPathsExpanded && !active);
      guidedPathsEl.classList.toggle("is-active", !!active);
      if (active) {
        const stop = guidedLearningPathStop(active);
        const stats = guidedLearningPathStats(active);
        guidedPathsCollapsedEl.innerHTML = `
          <div class="guided-paths-active">
            <div class="guided-paths-progress">
              <strong>Active Path: ${escapeHtml(active.title)}</strong>
              <span>Stop ${Math.min((state.activeLearningPathStopIndex || 0) + 1, stats.total)} of ${stats.total} � ${stats.percent}% complete${stop ? ` � ${escapeHtml(guidedLearningPathStopTitle(stop))}` : ""}</span>
            </div>
            <div class="guided-paths-active-actions" aria-label="Guided path controls">
              <button class="guided-paths-button" type="button" data-learning-path-prev aria-label="Previous guided path stop">Previous</button>
              <button class="guided-paths-button" type="button" data-learning-path-overview>Overview</button>
              <button class="guided-paths-button" type="button" data-learning-path-complete aria-label="Mark guided path stop complete">Mark Complete</button>
              <button class="guided-paths-button primary" type="button" data-learning-path-next aria-label="Next guided path stop">Next</button>
              <button class="guided-paths-button" type="button" data-learning-path-exit aria-label="Exit guided path">Exit</button>
              <button class="guided-paths-toggle" type="button" data-learning-path-filter-toggle aria-pressed="${state.activeLearningPathShowOnly ? "true" : "false"}">Show only path sites: ${state.activeLearningPathShowOnly ? "ON" : "OFF"}</button>
            </div>
          </div>
        `;
        guidedPathsDrawerEl.hidden = true;
        guidedPathsDrawerEl.innerHTML = "";
        learnPathsToggleEl?.setAttribute("aria-expanded", "false");
        return;
      }
      guidedPathsCollapsedEl.innerHTML = `
        <div class="guided-paths-title">
          <strong>Guided Learning Paths:</strong>
          <span>Explore Native Long Island through curated map routes</span>
        </div>
        <div class="guided-paths-quick">
          <button class="guided-paths-button quick-desktop" type="button" data-learning-path-start="sovereignty-tribal-governance">Sovereignty and Tribal Governance</button>
          <button class="guided-paths-button quick-desktop" type="button" data-learning-path-start="making-a-living-economic-development">Making a Living</button>
          <button class="guided-paths-button quick-desktop" type="button" data-learning-path-start="place-names-language">Place Names and Language</button>
          <button class="guided-paths-button guided-paths-more-mobile" type="button" data-learning-path-toggle aria-expanded="${state.guidedPathsExpanded ? "true" : "false"}">${window.matchMedia("(max-width: 860px)").matches ? "Explore Guided Paths" : "More Paths"}</button>
        </div>
      `;
      guidedPathsDrawerEl.hidden = !state.guidedPathsExpanded;
      guidedPathsDrawerEl.innerHTML = state.guidedPathsExpanded ? guidedLearningPathsDrawerHtml() : "";
      learnPathsToggleEl?.setAttribute("aria-expanded", state.guidedPathsExpanded ? "true" : "false");
      if (state.guidedPathsExpanded) window.requestAnimationFrame(fitGuidedLearningPathQuickButtons);
      wireGuidedLearningPathControls();
    }

    function wireGuidedLearningPathControls() {
      if (!guidedPathsEl) return;
      const controlSelector = "[data-learning-path-toggle], [data-learning-path-start], [data-learning-path-exit], [data-learning-path-overview], [data-learning-path-complete], [data-learning-path-next], [data-learning-path-prev], [data-learning-path-filter-toggle], [data-learning-path-stop], [data-learning-path-resume]";
      guidedPathsEl.querySelectorAll(controlSelector).forEach(control => {
        control.onclick = event => {
          if (handleGuidedLearningPathClick(event)) {
            event.preventDefault();
            event.stopPropagation();
          }
        };
      });
      if (guidedPathsEl.dataset.learningPathControlsWired === "true") return;
      guidedPathsEl.dataset.learningPathControlsWired = "true";
      guidedPathsEl.addEventListener("click", event => {
        if (!event.target?.closest?.(controlSelector)) return;
        if (handleGuidedLearningPathClick(event)) {
          event.preventDefault();
          event.stopPropagation();
        }
      });
    }

    function guidedLearningPathsDrawerHtml() {
      return `
        <div class="guided-paths-drawer-head">
          <div>
            <h2>Guided Learning Paths</h2>
            <p>Choose a curated route through the map. Each path connects selected sites with short explanations, questions, and sources.</p>
          </div>
          <button class="guided-paths-close" type="button" data-learning-path-toggle aria-expanded="true" aria-label="Close guided learning paths">&times;</button>
        </div>
        <div class="guided-paths-cards">
          ${state.learningPaths.map(path => guidedLearningPathCardHtml(path)).join("")}
        </div>
      `;
    }

    function guidedLearningPathCardHtml(path) {
      const stats = guidedLearningPathStats(path);
      const meta = [
        `${path.stops.length} stops`,
        path.estimated_time_minutes ? `${path.estimated_time_minutes} min` : "",
        path.recommended_grades,
        path.sensitivity_level === "sensitive" ? "Sensitive" : ""
      ].filter(Boolean);
      return `
        <article class="guided-paths-card">
          <h3>${escapeHtml(path.title)}</h3>
          <p>${escapeHtml(path.short_description)}</p>
          <div class="guided-paths-meta">
            ${meta.map(item => `<span class="${/sensitive/i.test(item) ? "sensitive" : ""}">${escapeHtml(item)}</span>`).join("")}
            ${stats.completed ? `<span>${stats.completed}/${stats.total} complete</span>` : ""}
          </div>
          <button type="button" data-learning-path-start="${escapeHtml(path.slug)}">${escapeHtml(guidedLearningPathButtonLabel(path))}</button>
        </article>
      `;
    }

    function learningPathArticleHeader(site) {
      const path = activeGuidedLearningPath();
      if (!path || !site) return "";
      const index = path.stops.findIndex(stop => stop.siteSlug === site.slug);
      if (index < 0) return "";
      const stop = path.stops[index];
      const stats = guidedLearningPathStats(path);
      const complete = guidedLearningPathCompletedSet(path).has(stop.siteSlug);
      return `
        <section class="guided-paths-article-header" aria-label="Guided path stop">
          <p class="kicker">Guided Path</p>
          <h3>${escapeHtml(path.title)}</h3>
          <p class="path-stop-line">Stop ${index + 1} of ${path.stops.length}: ${escapeHtml(guidedLearningPathStopTitle(stop))}${complete ? " ?" : ""}</p>
          ${stop.why_this_stop_matters ? `<p><strong>Why this stop matters:</strong> ${escapeHtml(stop.why_this_stop_matters)}</p>` : ""}
          ${stop.path_question ? `<p><strong>Key question:</strong> ${escapeHtml(stop.path_question)}</p>` : ""}
          ${stop.short_activity ? `<p><strong>Try this:</strong> ${escapeHtml(stop.short_activity)}</p>` : ""}
          ${stop.sensitive_note ? `<p><strong>Respect note:</strong> ${escapeHtml(stop.sensitive_note)}</p>` : ""}
          <div class="guided-paths-stop-actions">
            <button class="guided-paths-button" type="button" data-learning-path-complete>${complete ? "Completed" : "Mark Complete"}</button>
            <button class="guided-paths-button primary" type="button" data-learning-path-next>${stats.completed === stats.total ? "Review Next" : "Next Stop"}</button>
          </div>
        </section>
      `;
    }

    function guidedLearningPathOverviewHtml(path) {
      const completed = guidedLearningPathCompletedSet(path);
      return `
        <section class="guided-paths-overview">
          <div>
            <p class="article-kicker">Guided Path Overview</p>
            <h3>${escapeHtml(path.title)}</h3>
          </div>
          <p>${escapeHtml(path.long_intro || path.short_description)}</p>
          ${path.key_questions.length ? `
            <div>
              <h3>Key questions</h3>
              <ol>
                ${path.key_questions.map((question, index) => `<li>${index + 1}. ${escapeHtml(question)}</li>`).join("")}
              </ol>
            </div>
          ` : ""}
          <div>
            <h3>Stops</h3>
            <ol>
              ${path.stops.map((stop, index) => `
                <li>
                  <button type="button" data-learning-path-stop="${index}">
                    <strong>${completed.has(stop.siteSlug) ? "?" : "?"} ${index + 1}.</strong>
                    <span>${escapeHtml(guidedLearningPathStopTitle(stop))}</span>
                  </button>
                </li>
              `).join("")}
            </ol>
          </div>
          <button class="button" type="button" data-learning-path-resume>Resume Path</button>
        </section>
      `;
    }

    function syncGuidedLearningPathStopForSite(site) {
      const path = activeGuidedLearningPath();
      if (!path || !site?.slug) return false;
      const index = path.stops.findIndex(stop => stop.siteSlug === site.slug);
      if (index < 0) return false;
      state.activeLearningPathStopIndex = index;
      renderGuidedPathsUi();
      syncGuidedLearningPathLayers();
      return true;
    }

    function guidedLearningPathBounds(path) {
      const coords = [];
      (path?.stops || []).forEach(stop => {
        const geometry = siteDisplayGeometry(stop.site);
        if (geometry) collectCoordinates(geometry.coordinates, coords);
      });
      const valid = coords.filter(coord => Array.isArray(coord) && coord.length >= 2 && coord.every(Number.isFinite));
      if (!valid.length) return null;
      const lngs = valid.map(coord => coord[0]);
      const lats = valid.map(coord => coord[1]);
      return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
    }

    function focusGuidedLearningPathBounds(path) {
      const bounds = guidedLearningPathBounds(path);
      if (!bounds) return;
      markMapAutoMove(700);
      if (state.leafletMap?.fitBounds) {
        state.leafletMap.fitBounds([[bounds[0][1], bounds[0][0]], [bounds[1][1], bounds[1][0]]], {
          paddingTopLeft: [24, 110],
          paddingBottomRight: [24, 120],
          maxZoom: 11.5
        });
        return;
      }
      if (state.map?.fitBounds) state.map.fitBounds(bounds, { padding: focusPadding(), maxZoom: 11.5, duration: 700, essential: true });
    }

    function openGuidedLearningPathStop(index, options = {}) {
      const path = activeGuidedLearningPath();
      if (!path?.stops?.length) return;
      const nextIndex = Math.max(0, Math.min(path.stops.length - 1, Number(index) || 0));
      state.activeLearningPathStopIndex = nextIndex;
      const stop = guidedLearningPathStop(path, nextIndex);
      const stopGeometry = stop?.site ? siteDisplayGeometry(stop.site) : null;
      renderGuidedPathsUi();
      syncFilteredViews();
      if (options.fitPathBounds) focusGuidedLearningPathBounds(path);
      if (stop?.site) {
        openListing(stop.site, {
          source: "Guided path stop",
          focusGeometry: stopGeometry,
          focusZoom: stopGeometry?.type === "Point" ? 14 : 12.5,
          focusDuration: 1800,
          localPolygonFocus: stopGeometry?.type !== "Point",
          skipHistory: options.skipHistory === true
        });
      }
    }

    function startGuidedLearningPath(slug, index = 0) {
      const path = state.learningPathBySlug.get(slug);
      if (!path?.stops?.length) {
        showBanner("That guided path is not available yet.");
        return;
      }
      state.activeLearningPathSlug = path.slug;
      state.activeLearningPathStopIndex = Math.max(0, Math.min(path.stops.length - 1, Number(index) || 0));
      state.activeLearningPathShowOnly = true;
      state.guidedPathsExpanded = false;
      clearFeatureCache();
      renderGuidedPathsUi();
      syncFilteredViews();
      focusGuidedLearningPathBounds(path);
      window.setTimeout(() => openGuidedLearningPathStop(state.activeLearningPathStopIndex, { skipHistory: true }), 120);
    }

    function exitGuidedLearningPath() {
      state.activeLearningPathSlug = "";
      state.activeLearningPathStopIndex = 0;
      state.activeLearningPathShowOnly = true;
      clearFeatureCache();
      renderGuidedPathsUi();
      syncFilteredViews();
      showBanner("Guided path closed. Normal map view restored.");
    }

    function markGuidedLearningPathStopComplete() {
      const path = activeGuidedLearningPath();
      const stop = guidedLearningPathStop(path);
      if (!path || !stop) return;
      const entry = state.learningPathProgress[path.slug] || { completedStops: [], completedAt: "" };
      const completed = new Set(Array.isArray(entry.completedStops) ? entry.completedStops : []);
      completed.add(stop.siteSlug);
      entry.completedStops = [...completed];
      const completedCount = path.stops.filter(item => completed.has(item.siteSlug)).length;
      if (completedCount >= path.stops.length) entry.completedAt = new Date().toISOString();
      state.learningPathProgress[path.slug] = entry;
      saveGuidedLearningPathProgress();
      renderGuidedPathsUi();
      syncGuidedLearningPathLayers();
      if (completedCount >= path.stops.length) showBanner("Path complete. Progress is saved in this browser.");
      else showBanner("Stop marked complete.");
      if (state.activeContent?.type === "site" && state.activeContent.slug === stop.siteSlug) {
        openListing(stop.site, { source: "Guided path stop", skipHistory: true, skipRoute: true, focus: false });
      }
    }

    function openGuidedLearningPathOverview() {
      const path = activeGuidedLearningPath();
      if (!path) return;
      rememberPanel();
      state.activeContent = { type: "guided-path", slug: path.slug };
      articleHeadEl.innerHTML = `
        <p class="article-kicker">Guided Learning Path</p>
        <h2>${escapeHtml(path.title)}</h2>
        <p class="article-meta">${guidedLearningPathStats(path).completed} of ${path.stops.length} stops complete</p>
      `;
      articleBodyEl.innerHTML = guidedLearningPathOverviewHtml(path);
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
    }

    function handleGuidedLearningPathClick(event) {
      const toggle = event.target.closest("[data-learning-path-toggle]");
      if (toggle) {
        state.guidedPathsExpanded = !state.guidedPathsExpanded;
        renderGuidedPathsUi();
        if (state.guidedPathsExpanded) ensureGuidedLearningPathsFromDirectus();
        return true;
      }
      const start = event.target.closest("[data-learning-path-start]");
      if (start?.dataset.learningPathStart) {
        startGuidedLearningPath(start.dataset.learningPathStart);
        return true;
      }
      if (event.target.closest("[data-learning-path-exit]")) {
        exitGuidedLearningPath();
        return true;
      }
      if (event.target.closest("[data-learning-path-overview]")) {
        openGuidedLearningPathOverview();
        return true;
      }
      if (event.target.closest("[data-learning-path-complete]")) {
        markGuidedLearningPathStopComplete();
        return true;
      }
      if (event.target.closest("[data-learning-path-next]")) {
        const path = activeGuidedLearningPath();
        if (path) openGuidedLearningPathStop((state.activeLearningPathStopIndex + 1) % path.stops.length);
        return true;
      }
      if (event.target.closest("[data-learning-path-prev]")) {
        const path = activeGuidedLearningPath();
        if (path) openGuidedLearningPathStop((state.activeLearningPathStopIndex - 1 + path.stops.length) % path.stops.length);
        return true;
      }
      if (event.target.closest("[data-learning-path-filter-toggle]")) {
        state.activeLearningPathShowOnly = !state.activeLearningPathShowOnly;
        clearFeatureCache();
        renderGuidedPathsUi();
        syncFilteredViews();
        return true;
      }
      const stopButton = event.target.closest("[data-learning-path-stop]");
      if (stopButton?.dataset.learningPathStop !== undefined) {
        openGuidedLearningPathStop(Number(stopButton.dataset.learningPathStop));
        return true;
      }
      if (event.target.closest("[data-learning-path-resume]")) {
        openGuidedLearningPathStop(state.activeLearningPathStopIndex);
        return true;
      }
      return false;
    }


    function searchPanelSections(result) {
      const item = result.item || {};
      if (result.type === "listing") {
        if (Array.isArray(result.searchSections) && result.searchSections.length) return result.searchSections;
        return [
          ["Title", item.title || result.title],
          ["Summary", item.summary],
          ["Why This Matters", item.why_this_matters],
          ...contentSections(item),
          ["Sources", Array.isArray(item.source_list)
            ? item.source_list.map(source => [source?.title, source?.author, source?.citation, source?.citation_context].filter(Boolean).join(" ")).join(" ")
            : ""]
        ];
      }
      if (result.type === "wiki") {
        return [
          ["Title", item.title || result.title],
          ["Summary", item.summary],
          ["Why This Matters", item.why_this_matters],
          ["Article", item.content]
        ];
      }
      if (result.type === "blog" || result.type === "page" || result.type === "post") {
        return [
          ["Title", item.title || result.title],
          ["Summary", item.summary],
          ["Article", item.content]
        ];
      }
      return [["Description", [result.summary, result.body].filter(Boolean).join(" ")]];
    }

    function searchTermList(query) {
      const normalized = normalizeComparisonText(query);
      const terms = normalized.split(" ").filter(term => term.length >= 2);
      return [...new Set([normalized, ...terms].filter(Boolean))].sort((a, b) => b.length - a.length);
    }

    function sectionMatchesSearch(text, query) {
      const normalizedText = normalizeComparisonText(text);
      const normalizedQuery = normalizeComparisonText(query);
      if (!normalizedText || !normalizedQuery) return false;
      const terms = normalizedQuery.split(" ").filter(term => term.length >= 2);
      return normalizedText.includes(normalizedQuery) || (terms.length > 1 && terms.every(term => normalizedText.includes(term)));
    }

    function escapeRegExp(value) {
      return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function highlightedSearchText(text, query) {
      const terms = searchTermList(query)
        .filter(term => term.length >= 2)
        .map(escapeRegExp);
      if (!terms.length) return escapeHtml(text);
      const pattern = new RegExp(`(${terms.join("|")})`, "ig");
      const testPattern = new RegExp(`^(?:${terms.join("|")})$`, "i");
      return String(text || "")
        .split(pattern)
        .map(part => testPattern.test(part) ? `<mark class="search-hit">${escapeHtml(part)}</mark>` : escapeHtml(part))
        .join("");
    }

    function searchSnippet(text, query, maxLength = 260) {
      const clean = publicCleanText(text || "");
      if (!clean) return "";
      const queryKey = normalizeComparisonText(query);
      const terms = queryKey.split(" ").filter(term => term.length >= 2);
      const lower = clean.toLowerCase();
      let index = lower.indexOf(String(query || "").trim().toLowerCase());
      if (index < 0) {
        const firstTerm = terms.find(term => lower.includes(term));
        if (firstTerm) index = lower.indexOf(firstTerm);
      }
      if (index < 0) index = 0;
      const start = Math.max(0, index - Math.floor(maxLength / 2));
      const end = Math.min(clean.length, start + maxLength);
      const prefix = start > 0 ? "... " : "";
      const suffix = end < clean.length ? " ..." : "";
      const snippet = `${prefix}${clean.slice(start, end).replace(/^\S*\s/, start > 0 ? "" : match => match).replace(/\s+\S*$/, end < clean.length ? "" : match => match)}${suffix}`;
      return highlightedSearchText(snippet, query);
    }

    function searchResultSnippet(result, query) {
      for (const [sectionTitle, content] of searchPanelSections(result)) {
        if (!sectionMatchesSearch(content || "", query)) continue;
        return {
          sectionTitle: sectionTitle || "Matched section",
          html: searchSnippet(content, query)
        };
      }
      return {
        sectionTitle: result.label || "Result",
        html: searchSnippet([result.title, result.summary, result.body].filter(Boolean).join(" "), query)
      };
    }

    function searchResultPanelCard(result, query) {
      const item = result.item || {};
      const type = result.type;
      const attr = type === "listing"
        ? `data-site-slug="${escapeHtml(item.slug || "")}"`
        : type === "wiki"
          ? `data-wiki-slug="${escapeHtml(item.slug || "")}"`
          : type === "blog"
            ? `data-blog-slug="${escapeHtml(item.slug || "")}"`
            : `data-content-slug="${escapeHtml(item.slug || "")}"`;
      const snippet = searchResultSnippet(result, query);
      const meta = [result.label, snippet.sectionTitle].filter(Boolean).join(" - ");
      return `
        <button class="content-card search-result-card" type="button" ${attr}>
          <span class="content-card-body">
            <span class="content-card-meta">${escapeHtml(meta)}</span>
            <strong>${highlightedSearchText(item.title || result.title || "Untitled", query)}</strong>
            ${snippet.html ? `<span class="content-card-summary search-result-snippet">${snippet.html}</span>` : ""}
          </span>
        </button>
      `;
    }

    function searchPanelResults(query) {
      const normalizedQuery = normalizeComparisonText(query);
      if (!normalizedQuery) return [];
      return (state.searchIndex || [])
        .filter(result => ["listing", "wiki", "page", "post", "blog"].includes(result.type || ""))
        .map(result => ({
          ...result,
          score: searchScore(result, query),
          hasSectionMatch: searchPanelSections(result).some(([title, content]) => sectionMatchesSearch(`${title || ""} ${content || ""}`, query))
        }))
        .filter(result => result.score > 0 || result.hasSectionMatch)
        .sort((a, b) => (b.hasSectionMatch ? 1 : 0) - (a.hasSectionMatch ? 1 : 0) || b.score - a.score || String(a.title || "").localeCompare(String(b.title || "")))
        .slice(0, 30);
    }

    function openSearchResultsPanel(rawQuery, context = {}) {
      const query = String(rawQuery || "").trim();
      if (!query) return;
      if (!context.skipHistory) rememberPanel();
      clearBiographyPathOverlay();
      clearActiveTimelineEvent();
      suggestionsEl.classList.remove("show");
      const results = searchPanelResults(query);
      const didYouMean = didYouMeanSearchResult(query, results);
      state.activeContent = { type: "search", query };
      articleHeadEl.innerHTML = `
        <p class="article-kicker">Search results</p>
        <h2>${escapeHtml(query)}</h2>
        <p class="article-meta">${results.length} result${results.length === 1 ? "" : "s"} from listings, wiki articles, and site pages</p>
      `;
      articleBodyEl.innerHTML = `
        ${didYouMean ? `<p class="article-summary search-correction">Did you mean <button type="button" data-search-panel-suggestion="${escapeHtml(didYouMean.title)}">${escapeHtml(didYouMean.title)}</button>?</p>` : ""}
        ${results.length ? `
          <p class="article-summary">Showing matching articles and the section where the term appears.</p>
          <div class="content-list search-results-list">
            ${results.map(result => searchResultPanelCard(result, query)).join("")}
          </div>
        ` : `<p class="article-summary">No listing or wiki article text matched this term. Try a broader word, a place name, or check the spelling.</p>`}
      `;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
    }

    function normalizeCalendarEvents(events) {
      return CALENDAR_UTILS.normalizeCalendarEvents(events, { siteCenter });
    }

    function findLayer(slug) {
      return state.layers.find(layer => layer.slug === slug);
    }

    const SITE_CONTENT_SECTION_FIELDS = [
      { title: "introduction_title", content: "introduction_content", defaultTitle: "Introduction" },
      { title: "oral_history_title", content: "oral_history_content", defaultTitle: "Oral History" },
      { title: "history_title", content: "history_content", defaultTitle: "History" },
      { title: "legends_and_lore_title", content: "legends_and_lore_content", defaultTitle: "Legends and Lore" },
      { title: "translation_title", content: "translation_content", defaultTitle: "Translation" },
      { title: "preservation_title", content: "preservation_content", defaultTitle: "Preservation" },
      { title: "artifacts_title", content: "artifacts_content", defaultTitle: "Artifacts" },
      { title: "colonial_description_title", content: "colonial_description_content", defaultTitle: "Colonial Description" },
      { title: "land_loss_title", content: "land_loss_content", defaultTitle: "Land Loss" },
      { title: "excavation_title", content: "excavation_content", defaultTitle: "Excavation" },
      { title: "vandalism_title", content: "vandalism_content", defaultTitle: "Disruption and Vandalism" },
      { title: "whereintheworld_title", content: "whereintheworld_content", defaultTitle: "On This Site / Off This Site" }
    ];

    function contentSections(site) {
      const publicSite = SITE_UTILS.siteWithContentOverrides(SITE_UTILS.sanitizePublicSiteContent(site));
      return SHARED_UTILS.contentSectionsFromFields(publicSite, SITE_CONTENT_SECTION_FIELDS, {
        hasContent: value => SHARED_UTILS.richTextHasDisplayContent(value, { cleanText: stripHtml }),
        excludeTitle: title => SHARED_UTILS.isWhyThisMattersTitle(title)
      });
    }

    const SITE_FRONTEND_EDITOR_FIELDS = [
      ["title", "Title", "input"],
      ["address_label", "Address / place label", "input"],
      ["listing_image_file", "Header image", "image"],
      ["why_this_matters", "Why This Matters", "textarea"],
      ["introduction_content", "Site text", "textarea"],
      ["history_content", "History", "textarea"],
      ["preservation_content", "Preservation", "textarea"],
      ["oral_history_content", "Oral History", "textarea"]
    ];

    const WIKI_FRONTEND_EDITOR_FIELDS = [
      ["title", "Title", "input"],
      ["why_this_matters", "Why This Matters", "textarea"],
      ["content", "Article text", "textarea"]
    ];

    const TIMELINE_FRONTEND_EDITOR_FIELDS = [
      ["date_label", "Date", "input"],
      ["title", "Title", "input"],
      ["description", "Moment text", "textarea"]
    ];

    function frontendEditorFields(kind) {
      if (kind === "wiki") return WIKI_FRONTEND_EDITOR_FIELDS;
      if (kind === "timeline") return TIMELINE_FRONTEND_EDITOR_FIELDS;
      return SITE_FRONTEND_EDITOR_FIELDS;
    }

    function frontendEditorFieldHtml(item, [field, label, type]) {
      if (type === "image") {
        const preview = listingHeroImage(item);
        return `<div class="field"><label for="frontend-editor-${field}">${escapeHtml(label)}</label>${preview ? `<img class="hero-image" src="${escapeHtml(preview)}" alt="" loading="lazy" decoding="async">` : ""}<input id="frontend-editor-${field}" name="${escapeHtml(field)}" type="file" accept="image/*"><p class="article-meta">Optional. Large images are compressed before upload.</p></div>`;
      }
      const value = type === "textarea" ? stripHtml(item?.[field] || "") : (item?.[field] || "");
      const id = `frontend-editor-${field}`;
      if (type === "input") {
        return `<div class="field"><label for="${id}">${escapeHtml(label)}</label><input id="${id}" name="${escapeHtml(field)}" value="${escapeHtml(value)}"></div>`;
      }
      return `<div class="field"><label for="${id}">${escapeHtml(label)}</label><textarea id="${id}" name="${escapeHtml(field)}" rows="7">${escapeHtml(value)}</textarea></div>`;
    }

    function frontendEditorHtml(kind, item) {
      const fields = frontendEditorFields(kind);
      const label = kind === "wiki" ? "article" : kind === "timeline" ? "historic moment" : "site";
      const editorSlug = kind === "timeline" ? item.id : item.slug;
      return `
        <form class="section frontend-content-editor" data-frontend-editor="${escapeHtml(kind)}" data-editor-id="${escapeHtml(item.id || "")}" data-editor-slug="${escapeHtml(editorSlug || "")}">
          <h3>Edit ${label} content</h3>
          <p class="article-summary">Edit reader-facing text here. Save updates directly without leaving this app.</p>
          ${fields.map(field => frontendEditorFieldHtml(item, field)).join("")}
          <div class="article-actions">
            <button class="button" type="submit">Save updates</button>
            <button class="button secondary" type="button" data-cancel-frontend-editor>Cancel</button>
          </div>
          <p class="article-meta" data-frontend-editor-status></p>
        </form>
      `;
    }

    function clearTimelineEventCaches() {
      state.timelineEventsForCache?.clear?.();
      state.timelineSortValueCache = new WeakMap();
      state.timelineYearValueCache = new WeakMap();
      state.timelineEraForCache = new WeakMap();
      state.timelineRangePercentCache = new WeakMap();
    }

    function timelineEventsForCacheKey(sourceType, sourceId, sourceSlug) {
      return `${String(sourceType || "")}|${String(sourceId ?? "")}|${String(sourceSlug || "")}`;
    }

    function timelineEventsFor(sourceType, sourceId, sourceSlug) {
      const key = timelineEventsForCacheKey(sourceType, sourceId, sourceSlug);
      if (state.timelineEventsForCache.has(key)) return state.timelineEventsForCache.get(key);
      const events = TIMELINE_UTILS.eventsForSource(state.timelineEvents, sourceType, sourceId, sourceSlug, {
        sortValue: timelineSortValue
      });
      state.timelineEventsForCache.set(key, events);
      return events;
    }

    function timelineRangeLabel(event) {
      return TIMELINE_UTILS.rangeLabel(event);
    }

    function timelineBestDateValue(event, fallback = 999999) {
      return TIMELINE_UTILS.sortValue(event, {
        fallback,
        candidates: ["sort_key", "start_year", "date_label", "title", "description"]
      });
    }

    function timelineSortValue(event) {
      if (event && typeof event === "object" && state.timelineSortValueCache.has(event)) return state.timelineSortValueCache.get(event);
      const value = timelineBestDateValue(event, numeric(event?.sort_key, numeric(event?.start_year, 999999)));
      if (event && typeof event === "object") state.timelineSortValueCache.set(event, value);
      return value;
    }

    const TIMELINE_ERAS = TIMELINE_UTILS.eras || [
      { key: "precontact", label: "Precontact", min: -10000, max: 1600 },
      { key: "contact", label: "Contact Period", min: 1600, max: 1700 },
      { key: "historic", label: "Historic", min: 1700, max: 1950 },
      { key: "contemporary", label: "Contemporary", min: 1950, max: 2030 }
    ];

    function timelineYearValue(event) {
      if (event && typeof event === "object" && state.timelineYearValueCache.has(event)) return state.timelineYearValueCache.get(event);
      const value = TIMELINE_UTILS.eraYearValue ? TIMELINE_UTILS.eraYearValue(event) : timelineBestDateValue(event, 2000);
      if (event && typeof event === "object") state.timelineYearValueCache.set(event, value);
      return value;
    }

    function explicitTimelineYear(value) {
      if (value === null || value === undefined || String(value).trim() === "") return NaN;
      const year = Number(value);
      return Number.isFinite(year) ? year : NaN;
    }

    function timelineStartYearValue(event) {
      const explicit = explicitTimelineYear(event?.start_year);
      return Number.isFinite(explicit) ? explicit : timelineYearValue(event);
    }

    function timelineEndYearValue(event) {
      const end = explicitTimelineYear(event?.end_year);
      return Number.isFinite(end) ? end : NaN;
    }

    function timelineEraFor(event) {
      if (event && typeof event === "object" && state.timelineEraForCache.has(event)) return state.timelineEraForCache.get(event);
      const era = TIMELINE_UTILS.eraForEvent ? TIMELINE_UTILS.eraForEvent(event) : TIMELINE_ERAS.find(item => timelineYearValue(event) < item.max) || TIMELINE_ERAS[TIMELINE_ERAS.length - 1];
      if (event && typeof event === "object") state.timelineEraForCache.set(event, era);
      return era;
    }

    function timelineEraForYear(year) {
      const numericYear = Number(year);
      if (!Number.isFinite(numericYear)) return null;
      return TIMELINE_ERAS.find(era => numericYear < era.max) || TIMELINE_ERAS[TIMELINE_ERAS.length - 1];
    }

    function timelineXPercentForYear(year, fallbackEvent = null) {
      const era = timelineEraForYear(year) || (fallbackEvent ? timelineEraFor(fallbackEvent) : TIMELINE_ERAS[TIMELINE_ERAS.length - 1]);
      const eraIndex = TIMELINE_ERAS.indexOf(era);
      const eraWidth = 100 / TIMELINE_ERAS.length;
      const clampedYear = Math.max(era.min, Math.min(era.max, Number(year)));
      const span = era.max - era.min || 1;
      const local = (clampedYear - era.min) / span;
      return Math.max(1.2, Math.min(98.8, eraIndex * eraWidth + local * eraWidth));
    }

    function timelineRangePercent(event) {
      if (event && typeof event === "object" && state.timelineRangePercentCache.has(event)) return state.timelineRangePercentCache.get(event);
      const startYear = timelineStartYearValue(event);
      const endYear = timelineEndYearValue(event);
      const startX = timelineXPercentForYear(startYear, event);
      if (!Number.isFinite(endYear) || endYear === startYear) {
        const range = { startYear, endYear: NaN, startX, endX: startX, midpoint: startX, hasRange: false, width: 0 };
        if (event && typeof event === "object") state.timelineRangePercentCache.set(event, range);
        return range;
      }
      const endX = timelineXPercentForYear(endYear, event);
      const left = Math.min(startX, endX);
      const right = Math.max(startX, endX);
      const range = {
        startYear,
        endYear,
        startX: left,
        endX: right,
        midpoint: (left + right) / 2,
        hasRange: Math.abs(right - left) >= 0.18,
        width: Math.max(0, right - left)
      };
      if (event && typeof event === "object") state.timelineRangePercentCache.set(event, range);
      return range;
    }

    function timelineXPercent(event) {
      return timelineRangePercent(event).midpoint;
    }

    function timelineScaleMarks() {
      const marks = [
        { label: "1600", year: 1600, major: true },
        { label: "1700", year: 1700, major: true },
        { label: "1800", year: 1800, major: true },
        { label: "1900", year: 1900, major: true },
        { label: "1950", year: 1950, major: true },
        { label: "2000", year: 2000, major: true },
        { label: "2025", year: 2025, major: false }
      ];
      for (let year = 1620; year < 1700; year += 20) marks.push({ year, label: String(year), major: false });
      for (let year = 1725; year < 1950; year += 25) marks.push({ year, label: String(year), major: false });
      for (let year = 1960; year < 2030; year += 10) marks.push({ year, label: String(year), major: false });
      return marks.map(mark => ({ ...mark, x: timelineXPercent({ start_year: mark.year, sort_key: mark.year }) }));
    }

    function eventSourceItem(event) {
      if (event.source_type === "site" && event.source_slug) return state.siteBySlug.get(event.source_slug);
      if (event.source_type === "wiki" && event.source_slug) return state.wikiBySlug.get(event.source_slug);
      if (event.source_type === "calendar_event" && event.source_slug) return state.eventBySlug.get(event.source_slug);
      return null;
    }

    function timelineEventImage(event, index) {
      const item = eventSourceItem(event);
      const image = event.source_type === "site"
        ? listingImage(item || {})
        : event.source_type === "calendar_event"
          ? directusAssetUrl(item?.cover_image)
          : firstContentImage(item?.content || "");
      if (!image) return "";
      if (event.source_type === "site" && siteHasHeaderImage(item)) return image;
      const title = String(event.title || "");
      const important = /museum|powwow|federal|wampum|burial|fort|oyster|recognition|sachem|governance|rescue/i.test(title);
      if (important) return image;
      return index % 18 === 0 ? image : "";
    }

    function timelineCaption(event) {
      const sourceTitle = normalizeComparisonText(event.source_title || "");
      const title = stripHtml(event.title || "");
      const genericTitle = !title ||
        /^historic moment$/i.test(title) ||
        normalizeComparisonText(title) === sourceTitle ||
        sourceTitle.includes(normalizeComparisonText(title));
      const description = stripHtml(event.description || "");
      if (!genericTitle && title.length <= 54) return title;
      const sentence = description.match(/[^.!?]+[.!?]/)?.[0] || description;
      const cleaned = sentence
        .replace(/^\s*(in\s+)?(\d{3,4}s?|\d{3,4}(?:-\d{2,4})?|precontact|contact period|historic|contemporary)\s*[,:\-\u2013]?\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();
      if (cleaned.length > 12) return cleaned.length > 78 ? `${cleaned.slice(0, 75).trim()}...` : cleaned;
      return title || event.source_title || "Historic moment";
    }

    function timelineTitleLooksWeak(title) {
      const value = stripHtml(title || "").trim();
      if (!value) return true;
      if (/^(a|an|the|and|or|but|then|there|this|that|where|which|who|in|on|at|to|from|with|for)\b/i.test(value) && value.split(/\s+/).length <= 7) return true;
      if (/\b(leads to a|leads to an|part of a|located at a|known as a)$/i.test(value)) return true;
      if (!/[A-Z0-9]/.test(value)) return true;
      return false;
    }

    function timelineTitle(event) {
      const title = stripHtml(event.title || "");
      if (!timelineTitleLooksWeak(title)) return title;
      const source = stripHtml(event.source_title || "");
      const section = stripHtml(event.source_section || "");
      const date = timelineRangeLabel(event);
      if (source && date && date !== "Historic moment") return `${date} at ${source}`;
      if (source && section && !/^history$/i.test(section)) return `${source}: ${section}`;
      if (source) return `${source} historic moment`;
      const description = stripHtml(event.description || event.summary || "");
      if (description) return description.length > 90 ? `${description.slice(0, 87).trim()}...` : description;
      return "Historic moment";
    }

    function timelineTeaser(event) {
      return TIMELINE_UTILS.teaser(event, {
        cleanText: stripHtml,
        limit: 150,
        removeLeadingDate: true,
        preferFirstSentence: true,
        sourceFallback: false
      });
    }

    function timelineHoverHtml(event) {
      const teaser = timelineTeaser(event);
      return `
        <span class="timeline-card-date">${escapeHtml(timelineRangeLabel(event))}</span>
        <span class="timeline-card-title">${escapeHtml(timelineCaption(event))}</span>
        <span class="timeline-card-source">${escapeHtml(event.source_title || sourceLabel(event))}</span>
        ${teaser ? `<span class="timeline-card-summary">${escapeHtml(teaser)}</span>` : ""}
      `;
    }

    function showTimelineHover(card) {
      if (!timelineHoverEl || !card) return;
      const event = state.timelineById.get(String(card.dataset.timelineId || ""));
      if (!event) return;
      const rect = card.getBoundingClientRect();
      timelineHoverEl.innerHTML = timelineHoverHtml(event);
      timelineHoverEl.classList.add("show");
      timelineHoverEl.setAttribute("aria-hidden", "false");
      const width = timelineHoverEl.offsetWidth || 310;
      const height = timelineHoverEl.offsetHeight || 90;
      const preferredLeft = rect.left + rect.width / 2;
      const left = Math.max(12 + width / 2, Math.min(window.innerWidth - 12 - width / 2, preferredLeft));
      const top = Math.max(12, rect.top - height - 12);
      timelineHoverEl.style.left = `${left}px`;
      timelineHoverEl.style.top = `${top}px`;
    }

    function hideTimelineHover() {
      if (!timelineHoverEl) return;
      timelineHoverEl.classList.remove("show");
      timelineHoverEl.setAttribute("aria-hidden", "true");
    }

    function sortedTimelineEvents() {
      return [...state.timelineEvents]
        .filter(event => event.source_type && (event.source_slug || event.source_id))
        .filter(eventPassesEraFilter)
        .filter(event => {
          const active = activeThemeFilters();
          if (!active.size) return true;
          const site = event.source_type === "site"
            ? (state.siteBySlug.get(event.source_slug) || state.siteById.get(Number(event.source_id)))
            : null;
          if (site) return sitePassesThemeFilters(site);
          return featurePassesThemeFilters({ properties: { title: event.title, description: event.description || event.source_title } });
        })
        .sort((a, b) =>
          timelineSortValue(a) - timelineSortValue(b) ||
          String(a.date_label || "").localeCompare(String(b.date_label || "")) ||
          String(a.title || "").localeCompare(String(b.title || ""))
        );
    }

    function timelineRangeLanes(events) {
      const laneEnds = [];
      const lanes = new Map();
      const ranges = events
        .map((event, index) => ({ event, index, range: timelineRangePercent(event) }))
        .filter(item => item.range.hasRange)
        .sort((a, b) =>
          a.range.startX - b.range.startX ||
          b.range.endX - a.range.endX ||
          a.index - b.index
        );
      for (const item of ranges) {
        const gap = Math.max(0.28, Math.min(1.1, item.range.width * 0.035));
        let lane = laneEnds.findIndex(end => item.range.startX >= end + gap);
        if (lane < 0) {
          lane = laneEnds.length;
          laneEnds.push(-Infinity);
        }
        laneEnds[lane] = item.range.endX;
        lanes.set(String(item.event.id), lane % 6);
      }
      return lanes;
    }

    function isMobileTimelineViewport() {
      return Boolean(window.matchMedia?.("(max-width: 520px)")?.matches);
    }

    function timelineVisibleWindow(buffer = 0) {
      const zoom = Math.max(1, Number(state.timelineZoom) || 1);
      const visibleWidth = 100 / zoom;
      const start = Math.max(0, Number(state.timelinePan) || 0);
      return {
        start: Math.max(0, start - buffer),
        end: Math.min(100, start + visibleWidth + buffer)
      };
    }

    function timelineMaxZoom() {
      return isMobileTimelineViewport() ? 12 : 8;
    }

    function shouldWindowTimelineEvents() {
      return isMobileTimelineViewport()
        && timelineDockEl?.classList.contains("large")
        && (Number(state.timelineZoom) || 1) > 1.2;
    }

    function timelineEventsForCurrentWindow(events) {
      if (!shouldWindowTimelineEvents()) return events;
      const windowRange = timelineVisibleWindow(1.2);
      const activeId = String(state.activeTimelineEventId || "");
      const contextIds = new Set((state.timelineContextEventIds || []).map(id => String(id)));
      const visibleEvents = events.filter(event => {
        const id = String(event?.id || "");
        if (id && (id === activeId || contextIds.has(id))) return true;
        const range = timelineRangePercent(event);
        const start = range.hasRange ? range.startX : range.midpoint;
        const end = range.hasRange ? range.endX : range.midpoint;
        return end >= windowRange.start && start <= windowRange.end;
      });
      const mobileLimit = 140;
      if (visibleEvents.length <= mobileLimit) return visibleEvents;
      const priorityIds = new Set([activeId, ...contextIds].filter(Boolean));
      const stride = Math.max(2, Math.ceil(visibleEvents.length / mobileLimit));
      return visibleEvents.filter((event, index) => priorityIds.has(String(event?.id || "")) || index % stride === 0);
    }

    function setMobileTimelineDefaultView() {
      if (!isMobileTimelineViewport()) return false;
      if ((Number(state.timelineZoom) || 1) > 1.2) return false;
      state.timelineZoom = timelineMaxZoom();
      const activeEvent = state.activeTimelineEventId ? state.timelineById.get(String(state.activeTimelineEventId)) : null;
      const newestEvent = sortedTimelineEvents()
        .filter(event => timelineYearValue(event) >= 1950)
        .sort((a, b) => timelineSortValue(b) - timelineSortValue(a))[0];
      const x = activeEvent ? timelineXPercent(activeEvent) : (newestEvent ? timelineXPercent(newestEvent) : timelineXPercentForYear(2000));
      const maxShift = ((state.timelineZoom - 1) / state.timelineZoom) * 100;
      state.timelinePan = Math.max(0, Math.min(maxShift, x - (50 / state.timelineZoom)));
      return true;
    }

    function renderTimelineDock() {
      hideTimelineHover();
      const events = sortedTimelineEvents();
      timelineSummaryEl.textContent = `${events.length} moments across precontact, contact, historic, and contemporary eras.`;
      const eraBands = TIMELINE_ERAS.map((era, index) => `
        <button class="timeline-era${activeEraFilters().has(era.key) ? " active" : " inactive"}" type="button" data-era-toggle="${era.key}" aria-pressed="${activeEraFilters().has(era.key)}" title="Toggle ${escapeHtml(era.label)} map sites" style="--x:${index * 25}%;--w:25%;">${escapeHtml(era.label)}</button>
      `).join("");
      const scale = timelineScaleMarks().map(mark => `
        <span class="timeline-scale-mark${mark.major ? " major" : " minor"}" style="--x:${mark.x.toFixed(3)}%;">${mark.label ? `<span>${escapeHtml(mark.label)}</span>` : ""}</span>
      `).join("");
      const showImages = timelineDockEl.classList.contains("large");
      const lightDock = !showImages && (state.timelineZoom || 1) <= 1 && !state.activeTimelineEventId;
      const bindEraButtons = () => {
        timelineTrackEl.querySelectorAll("[data-era-toggle]").forEach(button => {
          button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            toggleEraFilter(button.dataset.eraToggle);
          });
        });
      };
      if (lightDock) {
        timelineTrackEl.innerHTML = `<div class="timeline-stage timeline-stage-light" id="timeline-stage">${eraBands}<div class="timeline-context-lines" id="timeline-context-lines" aria-hidden="true"></div><div class="timeline-current-line" id="timeline-current-line" aria-hidden="true"></div><div class="timeline-baseline"></div><div class="timeline-scale">${scale}</div></div>`;
        bindEraButtons();
        applyTimelineZoom();
        updateTimelineContextLines();
        updateTimelineCurrentLine();
        return;
      }
      timelineImageLanes.length = 0;
      const renderedEvents = timelineEventsForCurrentWindow(events);
      const rangeLanes = timelineRangeLanes(renderedEvents);
      const rangeBars = renderedEvents.map(event => {
        const range = timelineRangePercent(event);
        if (!range.hasRange) return "";
        const lane = rangeLanes.get(String(event.id)) || 0;
        const label = `${timelineRangeLabel(event)} - ${timelineCaption(event)} - ${event.source_title || sourceLabel(event)}`;
        return `
        <button class="timeline-range-bar${String(event.id) === String(state.activeTimelineEventId) ? " active" : ""}" type="button" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" data-route="${escapeHtml(timelineEventHref(event))}" data-timeline-id="${escapeHtml(event.id)}" data-x="${range.midpoint.toFixed(3)}" style="--range-left:${range.startX.toFixed(3)}%;--range-width:${range.width.toFixed(3)}%;--range-lane:${lane};">
          <span class="timeline-range-dot start" aria-hidden="true"></span>
          <span class="timeline-range-dot end" aria-hidden="true"></span>
        </button>
      `;
      }).join("");
      const eventTicks = renderedEvents.map((event, index) => {
        const range = timelineRangePercent(event);
        const x = range.midpoint;
        const active = String(event.id) === String(state.activeTimelineEventId);
        let image = showImages ? timelineEventImage(event, index) : "";
        let imageLane = image ? timelineImageLane(x) : 0;
        if (imageLane < 0 && active) imageLane = 0;
        if (imageLane < 0) image = "";
        const label = `${timelineRangeLabel(event)} - ${timelineCaption(event)} - ${event.source_title || sourceLabel(event)}`;
        const teaser = timelineTeaser(event);
        return `
        <button class="timeline-card${range.hasRange ? " is-range" : ""}${image ? " has-image" : ""}${active ? " active" : ""}" type="button" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" data-route="${escapeHtml(timelineEventHref(event))}" data-timeline-id="${escapeHtml(event.id)}" data-x="${x.toFixed(3)}" style="--x:${x.toFixed(3)}%;--image-lane:${imageLane};">
          ${image ? `<img class="timeline-thumb" src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async">` : ""}
          <span class="timeline-card-detail">
            <span class="timeline-card-date">${escapeHtml(timelineRangeLabel(event))}</span>
            <span class="timeline-card-title">${escapeHtml(timelineCaption(event))}</span>
            <span class="timeline-card-source">${escapeHtml(event.source_title || sourceLabel(event))}</span>
            ${teaser ? `<span class="timeline-card-summary">${escapeHtml(teaser)}</span>` : ""}
          </span>
        </button>
      `;
      }).join("");
      timelineTrackEl.innerHTML = `<div class="timeline-stage" id="timeline-stage">${eraBands}<div class="timeline-context-lines" id="timeline-context-lines" aria-hidden="true"></div><div class="timeline-current-line" id="timeline-current-line" aria-hidden="true"></div><div class="timeline-baseline"></div><div class="timeline-scale">${scale}</div>${rangeBars}${eventTicks}</div>`;
      bindEraButtons();
      applyTimelineZoom();
      updateTimelineContextLines();
      updateTimelineCurrentLine();
      timelineTrackEl.querySelectorAll("[data-timeline-id]").forEach(card => {
        card.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          openTimelineEvent(card.dataset.timelineId);
        });
        card.addEventListener("mouseover", () => {
          setActiveTimelineEvent(card.dataset.timelineId, { scrollTimeline: false });
          showTimelineHover(card);
        });
        card.addEventListener("mousemove", () => showTimelineHover(card));
        card.addEventListener("focus", () => showTimelineHover(card));
        card.addEventListener("mouseout", hideTimelineHover);
        card.addEventListener("blur", hideTimelineHover);
      });
    }

    const timelineImageLanes = [];

    function timelineImageLane(x) {
      const maxLanes = timelineMaxImageLanes();
      const minGap = timelineDockEl.classList.contains("zoomed") ? 4 : 5;
      for (let lane = 0; lane < maxLanes; lane += 1) {
        if (!Number.isFinite(timelineImageLanes[lane]) || Math.abs(x - timelineImageLanes[lane]) > minGap) {
          timelineImageLanes[lane] = x;
          return lane;
        }
      }
      return -1;
    }

    function timelineMaxImageLanes() {
      if (!timelineDockEl?.classList.contains("large")) return 0;
      const trackHeight = timelineTrackEl?.getBoundingClientRect?.().height || 160;
      const safeLaneSpace = Math.max(0, trackHeight - 112);
      return Math.max(1, Math.min(3, Math.floor(safeLaneSpace / 46) + 1));
    }

    function applyTimelineZoom() {
      const maxZoom = timelineMaxZoom();
      const zoom = Math.max(1, Math.min(maxZoom, state.timelineZoom || 1));
      state.timelineZoom = zoom;
      const maxShift = zoom <= 1 ? 0 : ((zoom - 1) / zoom) * 100;
      state.timelinePan = Math.max(0, Math.min(maxShift, state.timelinePan || 0));
      timelineDockEl.classList.toggle("zoomed", zoom > 1);
      timelineTrackEl.style.setProperty("--timeline-zoom", zoom);
      timelineTrackEl.style.setProperty("--timeline-shift", `${state.timelinePan}%`);
      timelinePanEl.max = String(maxZoom);
      timelinePanEl.value = String(zoom);
      timelineZoomOutBtn.disabled = zoom <= 1;
      timelineZoomInBtn.disabled = zoom >= maxZoom;
    }

    function changeTimelineZoom(delta) {
      const oldZoom = state.timelineZoom || 1;
      const nextZoom = Math.max(1, Math.min(timelineMaxZoom(), oldZoom + delta));
      if (nextZoom === oldZoom) return;
      const oldMaxPan = oldZoom <= 1 ? 0 : ((oldZoom - 1) / oldZoom) * 100;
      const oldRatio = oldMaxPan ? (state.timelinePan || 0) / oldMaxPan : 0.5;
      const nextMaxPan = nextZoom <= 1 ? 0 : ((nextZoom - 1) / nextZoom) * 100;
      state.timelineZoom = nextZoom;
      state.timelinePan = nextMaxPan * oldRatio;
      applyTimelineZoom();
      if (shouldWindowTimelineEvents() || nextZoom > 1 && !timelineTrackEl.querySelector("[data-timeline-id]")) {
        renderTimelineDock();
      }
    }

    function panTimeline(delta) {
      const zoom = state.timelineZoom || 1;
      const maxShift = zoom <= 1 ? 0 : ((zoom - 1) / zoom) * 100;
      if (!maxShift) return;
      state.timelinePan = Math.max(0, Math.min(maxShift, (state.timelinePan || 0) + delta));
      applyTimelineZoom();
    }

    function setTimelineZoom(value) {
      const oldZoom = state.timelineZoom || 1;
      const nextZoom = Math.max(1, Math.min(timelineMaxZoom(), Number(value) || 1));
      const oldMaxPan = oldZoom <= 1 ? 0 : ((oldZoom - 1) / oldZoom) * 100;
      const oldRatio = oldMaxPan ? (state.timelinePan || 0) / oldMaxPan : 0.5;
      const nextMaxPan = nextZoom <= 1 ? 0 : ((nextZoom - 1) / nextZoom) * 100;
      state.timelineZoom = nextZoom;
      state.timelinePan = nextMaxPan * oldRatio;
      applyTimelineZoom();
      if (shouldWindowTimelineEvents() || nextZoom > 1 && !timelineTrackEl.querySelector("[data-timeline-id]")) {
        renderTimelineDock();
      }
    }

    function centerTimelineOnPercent(x) {
      const zoom = state.timelineZoom || 1;
      if (zoom <= 1 || !Number.isFinite(x)) return;
      const maxShift = ((zoom - 1) / zoom) * 100;
      state.timelinePan = Math.max(0, Math.min(maxShift, x - (50 / zoom)));
      applyTimelineZoom();
    }

    function setTimelineContextEvents(events = []) {
      state.timelineContextEventIds = [...new Set(events.map(event => String(event?.id || "")).filter(Boolean))];
      updateTimelineContextLines();
    }

    function nowMs() {
      return (window.performance && typeof performance.now === "function") ? performance.now() : Date.now();
    }

    function markMapAutoMove(duration = 0) {
      state.mapAutoMovingUntil = nowMs() + Math.max(0, Number(duration) || 0) + 350;
    }

    function markUserMapInteraction(options = {}) {
      if (!options.force && nowMs() <= state.mapAutoMovingUntil) return;
      if (!options.preserveBiographyFollow) {
        stopBiographyPersonFollow();
        stopWhalingWhaleFollow();
      }
      state.userMapInteractionAt = nowMs();
    }

    function userMovedMapSince(startedAt) {
      return Number(state.userMapInteractionAt || 0) > Number(startedAt || 0);
    }

    function runWhenMapIsQuiet(callback, options = {}) {
      const quietMs = Number.isFinite(Number(options.quietMs)) ? Number(options.quietMs) : 1400;
      const delay = Math.max(0, Number(options.delay) || 0);
      const attempt = () => {
        if (nowMs() - Number(state.userMapInteractionAt || 0) < quietMs) {
          window.setTimeout(attempt, Math.max(800, quietMs));
          return;
        }
        callback();
      };
      window.setTimeout(attempt, delay);
    }

    function updateTimelineContextLines() {
      const container = document.getElementById("timeline-context-lines");
      if (!container) return;
      const lines = (state.timelineContextEventIds || []).map(id => {
        const event = state.timelineById.get(String(id));
        if (!event) return "";
        const x = timelineXPercent(event);
        if (!Number.isFinite(x)) return "";
        const label = `${timelineRangeLabel(event)} ${timelineCaption(event)}`.trim();
        return `<span class="timeline-context-line" style="--x:${x.toFixed(3)}%;" title="${escapeHtml(label)}"></span>`;
      }).join("");
      container.innerHTML = lines;
    }

    function updateTimelineCurrentLine() {
      const line = document.getElementById("timeline-current-line");
      if (!line) return;
      const event = state.timelineById.get(String(state.activeTimelineEventId || ""));
      if (!event) {
        line.classList.remove("show");
        return;
      }
      const x = timelineXPercent(event);
      line.style.setProperty("--x", `${x.toFixed(3)}%`);
      line.classList.add("show");
    }

    function updateTimelineSensitivity(clientX) {
      const box = timelineTrackEl.getBoundingClientRect();
      if (!box.width) return;
      const zoom = state.timelineZoom || 1;
      const percent = (((clientX - box.left) / box.width) * 100 + (state.timelinePan || 0)) / zoom;
      timelineTrackEl.querySelectorAll(".timeline-card").forEach(card => {
        const x = Number(card.dataset.x);
        card.classList.toggle("near", Number.isFinite(x) && Math.abs(x - percent) < 3.2);
      });
    }

    function timelineEventHref(event) {
      const params = new URLSearchParams();
      if (event.source_type === "site" && event.source_slug) params.set("site", event.source_slug);
      else if (event.source_type === "wiki" && event.source_slug) params.set("wiki", event.source_slug);
      else if (event.source_type === "calendar_event" && event.source_slug) params.set("calendar", event.source_slug);
      if (event.id) params.set("event", event.id);
      return params.toString() ? `?${params.toString()}` : "#";
    }

    function sourceLabel(event) {
      if (event.source_type === "site") return "Listing";
      if (event.source_type === "wiki") return "Knowledgebase";
      if (event.source_type === "calendar_event") return "Event / exhibit";
      return "Archive";
    }

    function setActiveTimelineEvent(eventId, options = {}) {
      state.activeTimelineEventId = eventId ? String(eventId) : null;
      document.querySelectorAll(".timeline-card.active, .timeline-range-bar.active").forEach(item => item.classList.remove("active"));
      document.querySelectorAll(".historic-moment.active").forEach(item => item.classList.remove("active"));
      updateTimelineCurrentLine();
      if (!eventId) return;
      const cards = timelineTrackEl.querySelectorAll(`[data-timeline-id="${CSS.escape(String(eventId))}"]`);
      if (cards.length) {
        cards.forEach(card => card.classList.add("active"));
        const card = timelineTrackEl.querySelector(`.timeline-card[data-timeline-id="${CSS.escape(String(eventId))}"]`) || cards[0];
        card.classList.add("active");
        if (options.scrollTimeline) centerTimelineOnPercent(Number(card.dataset.x));
      }
      const moment = articleBodyEl.querySelector(`[data-event-id="${CSS.escape(String(eventId))}"]`);
      if (moment) {
        moment.classList.add("active");
        if (options.scrollArticle) moment.scrollIntoView({ block: "center" });
      }
    }

    function timelineEventSite(event = {}) {
      if (!event || event.source_type !== "site") return null;
      if (event.source_slug && state.siteBySlug.has(event.source_slug)) return state.siteBySlug.get(event.source_slug);
      const sourceId = Number(event.source_id);
      if (Number.isFinite(sourceId) && state.siteById.has(sourceId)) return state.siteById.get(sourceId);
      return null;
    }

    function timelineEventWiki(event = {}) {
      if (!event || event.source_type !== "wiki") return null;
      if (event.source_slug && state.wikiBySlug.has(event.source_slug)) return state.wikiBySlug.get(event.source_slug);
      const sourceId = Number(event.source_id);
      if (Number.isFinite(sourceId) && state.wikiById?.has?.(sourceId)) return state.wikiById.get(sourceId);
      return null;
    }

    function timelineEventCalendarEvent(event = {}) {
      if (!event || event.source_type !== "calendar_event") return null;
      if (event.source_slug && state.eventBySlug.has(event.source_slug)) return state.eventBySlug.get(event.source_slug);
      const sourceId = Number(event.source_id);
      if (!Number.isFinite(sourceId)) return null;
      return state.calendarEvents.find(item => Number(item.id) === sourceId) || null;
    }

    function timelineEventTargetGeometry(event = {}, site = null, wiki = null, calendarEvent = null) {
      if (isLongIslandCoordinate(Number(event.longitude), Number(event.latitude))) {
        return { type: "Point", coordinates: [Number(event.longitude), Number(event.latitude)] };
      }
      if (calendarEvent?.geojson) return calendarEvent.geojson;
      if (calendarEvent?.related_site_slug) {
        const relatedSite = state.siteBySlug.get(calendarEvent.related_site_slug);
        if (relatedSite) {
          return siteDisplayGeometry(relatedSite)
            || relatedContentFeature("site", relatedSite.slug, { preferPoint: true })?.geometry
            || relatedContentFeature("site", relatedSite.slug)?.geometry
            || null;
        }
      }
      if (site) {
        return siteDisplayGeometry(site)
          || relatedContentFeature("site", site.slug, { preferPoint: true })?.geometry
          || relatedContentFeature("site", site.slug)?.geometry
          || null;
      }
      if (wiki?.slug) return relatedContentFeature("wiki", wiki.slug)?.geometry || null;
      return null;
    }

    async function openTimelineEvent(eventId) {
      const event = state.timelineById.get(String(eventId));
      if (!event) return;
      setActiveTimelineEvent(eventId, { scrollTimeline: true });
      const site = timelineEventSite(event);
      const wiki = timelineEventWiki(event);
      const calendarEvent = timelineEventCalendarEvent(event);
      const relatedCalendarSite = calendarEvent?.related_site_slug ? state.siteBySlug.get(calendarEvent.related_site_slug) : null;
      const targetGeometry = timelineEventTargetGeometry(event, site || relatedCalendarSite, wiki, calendarEvent);
      if (site) {
        await openListing(site, { source: "Timeline", timelineEventId: eventId, focus: false });
      } else if (wiki) {
        await openWikiArticle(wiki, { source: "Timeline", timelineEventId: eventId, focus: false });
      } else if (calendarEvent) {
        await openCalendarEvent(calendarEvent, { source: "Timeline", timelineEventId: eventId, focus: false });
      } else {
        openTimelineMomentPanel(event);
      }
      window.setTimeout(() => setActiveTimelineEvent(eventId, { scrollTimeline: false, scrollArticle: true }), 80);
      if (targetGeometry) focusGeometry(targetGeometry, targetGeometry.type === "Point" ? 12 : 9.5, { duration: 1800, essential: true });
      window.setTimeout(() => {
        showTimelineMapFeedback(event);
      }, targetGeometry ? 1860 : 760);
    }
    window.openTimelineEvent = openTimelineEvent;

    function openTimelineMomentPanel(event) {
      rememberPanel();
      const title = event.title || event.source_title || "Historic moment";
      articleHeadEl.innerHTML = `
        <p class="eyebrow">Timeline</p>
        <h2>${escapeHtml(title)}</h2>
        <p class="article-meta">${escapeHtml(timelineRangeLabel(event))}${event.period ? ` - ${escapeHtml(event.period)}` : ""}</p>
      `;
      articleBodyEl.innerHTML = `
        <section class="section">
          <h3>${escapeHtml(timelineCaption(event))}</h3>
          ${event.description ? `<p class="article-summary">${escapeHtml(stripHtml(event.description))}</p>` : `<p class="article-summary">This moment is part of the larger Native Long Island timeline.</p>`}
          ${event.source_title ? `<p class="feature-note">Related source: ${escapeHtml(event.source_title)}</p>` : ""}
        </section>
      `;
      state.activeContent = { type: "timeline", slug: String(event.id || "") };
      markArticlePanelOpen();
      decorateCurrentArticleForLanguageQuiz("timeline", event);
      updateBackButton();
      resetArticleScroll();
    }

    function stepTimeline(direction) {
      const events = sortedTimelineEvents();
      if (!events.length) return;
      const current = String(state.activeTimelineEventId || "");
      const currentIndex = events.findIndex(event => String(event.id) === current);
      const startIndex = currentIndex >= 0 ? currentIndex : (direction > 0 ? -1 : events.length);
      const nextIndex = Math.max(0, Math.min(events.length - 1, startIndex + direction));
      openTimelineEvent(events[nextIndex].id);
    }

    function timelineDisplayDescription(event) {
      return TIMELINE_UTILS.displayDescription(event);
    }

    function timelineSourceText(event) {
      return TIMELINE_UTILS.sourceText(event, { cleanText: stripHtml });
    }

    function timelineLocationLabel(event = {}) {
      return TIMELINE_UTILS.locationLabel(event, {
        cleanText: publicCleanText,
        hasMappedLocation: item => isLongIslandCoordinate(Number(item.longitude), Number(item.latitude))
      });
    }

    function historicMomentsSection(events, options = {}) {
      if (!events.length) return "";
      const linked = options.linked || new Set();
      const excludeHref = options.excludeHref || "";
      const showLocations = options.showLocations !== false;
      return `
        <section class="section section-history-moments">
          <h3>Historic Moments</h3>
          <div class="historic-moments">
            ${events.map(event => {
              const sourceNote = timelineSourceText(event);
              const location = showLocations ? timelineLocationLabel(event) : "";
              return `
                <article class="historic-moment" data-event-id="${escapeHtml(event.id)}" data-sort-key="${escapeHtml(event.sort_key || "")}">
                  <div class="historic-moment-date">${escapeHtml(timelineRangeLabel(event))}</div>
                  ${location ? `<p class="historic-moment-location"><strong>Location:</strong> ${escapeHtml(location)}</p>` : ""}
                  <div class="historic-moment-body">
                    ${autoLinkHtml(cleanHtml(timelineDisplayDescription(event)), { used: linked, excludeHref })}
                  </div>
                  ${isFrontendAdmin() ? `<div class="article-actions"><button class="button secondary" type="button" data-open-frontend-editor="timeline" data-editor-slug="${escapeHtml(event.id)}">Edit moment</button></div>` : ""}
                  ${sourceNote ? `
                    <button class="timeline-source-info" type="button" data-timeline-source-info data-source-reference="${escapeHtml(sourceNote)}" aria-label="Show source" title="${escapeHtml(sourceNote)}">i</button>
                    <div class="timeline-source-popover" role="note">
                      <div>${escapeHtml(sourceNote)}</div>
                      <span class="timeline-source-copy-hint">Click the icon to copy reference to clipboard.</span>
                      <span class="timeline-source-copy-confirm">Source reference copied.</span>
                    </div>
                  ` : ""}
                </article>
              `;
            }).join("")}
          </div>
        </section>
      `;
    }

    function buildInternalLinkTerms() {
      const terms = new Map();
      const add = (title, href, priority) => {
        const label = String(title || "").replace(/^Private:\s*/i, "").replace(/\s+/g, " ").trim();
        if (label.length < 4 || /^[0-9\s.,-]+$/.test(label)) return;
        const key = label.toLowerCase();
        if (!terms.has(key) || priority < terms.get(key).priority) terms.set(key, { label, href, priority });
      };
      state.sites.forEach(site => add(site.title, `#listing/${site.slug}`, 1));
      state.wikiArticles.forEach(article => add(article.title, `#wiki/${article.slug}`, 2));
      state.siteContent.forEach(item => add(item.title, `#page/${item.slug}`, 3));
      state.blogPosts.forEach(item => add(item.title, `#blog/${item.slug}`, 4));
      return [...terms.values()]
        .filter(item => !["home", "about", "blog", "map", "maps", "page"].includes(item.label.toLowerCase()))
        .sort((a, b) => b.label.length - a.label.length || a.priority - b.priority);
    }

    function autoLinkHtml(html, options = {}) {
      const template = document.createElement("template");
      template.innerHTML = html || "";
      const used = options.used || new Set();
      const excludeHref = options.excludeHref || "";
      const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (parent.closest("a, button, h1, h2, h3, h4, .timeline-year")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      for (const node of textNodes) {
        linkFirstAvailableTerm(node, used, excludeHref);
      }
      return template.innerHTML;
    }

    function linkFirstAvailableTerm(node, used, excludeHref) {
      const text = node.nodeValue;
      for (const term of state.linkTerms) {
        if (used.has(term.href) || term.href === excludeHref) continue;
        const index = indexOfTerm(text, term.label);
        if (index < 0) continue;
        const before = text.slice(0, index);
        const match = text.slice(index, index + term.label.length);
        const after = text.slice(index + term.label.length);
        const fragment = document.createDocumentFragment();
        if (before) fragment.appendChild(document.createTextNode(before));
        const link = document.createElement("a");
        link.href = term.href;
        link.textContent = match;
        fragment.appendChild(link);
        if (after) fragment.appendChild(document.createTextNode(after));
        node.replaceWith(fragment);
        used.add(term.href);
        return;
      }
    }

    function indexOfTerm(text, term) {
      const lowerText = text.toLowerCase();
      const lowerTerm = term.toLowerCase();
      let index = lowerText.indexOf(lowerTerm);
      while (index >= 0) {
        const before = index === 0 ? "" : lowerText[index - 1];
        const after = lowerText[index + lowerTerm.length] || "";
        if (!/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after)) return index;
        index = lowerText.indexOf(lowerTerm, index + 1);
      }
      return -1;
    }

    function listingImage(site) {
      return MEDIA_UTILS.listingImage(site, { directusAssetUrl, rewriteMediaUrl });
    }

    function listingHoverImage(site) {
      return MEDIA_UTILS.listingHoverImage(site, { directusAssetUrl, rewriteMediaUrl });
    }

    function listingHeroImage(site) {
      return MEDIA_UTILS.listingHeroImage(site, { directusAssetUrl, rewriteMediaUrl });
    }

    function listingHeroSrcset(site) {
      if (directusAssetUrl(site.listing_image_file)) return "";
      const candidates = [
        [MEDIA_UTILS.cleanImageUrl(site.listing_image_thumb_url), "768w"],
        [MEDIA_UTILS.cleanImageUrl(site.listing_image_url), "1600w"]
      ];
      const seen = new Set();
      return candidates
        .filter(([raw]) => raw && !seen.has(raw) && seen.add(raw))
        .map(([raw, width]) => `${escapeHtml(rewriteMediaUrl(raw))} ${width}`)
        .join(", ");
    }

    function listingImageFallback(site) {
      return MEDIA_UTILS.listingImageFallback(site, { directusAssetUrl, absoluteMediaUrl, baseHref: window.location.href });
    }

    function listingThumbFallback(site) {
      return MEDIA_UTILS.listingThumbFallback(site, { directusAssetUrl, absoluteMediaUrl, baseHref: window.location.href });
    }

    function siteHasHeaderImage(site) {
      return Boolean(
        directusAssetUrl(site?.listing_image_file) ||
        MEDIA_UTILS.cleanImageUrl(site?.listing_image_url) ||
        MEDIA_UTILS.cleanImageUrl(site?.listing_image_thumb_url)
      );
    }

    function imageErrorAction(fallback = "", options = {}) {
      return MEDIA_UTILS.imageErrorAction(fallback, options);
    }

    function dataFallbackImageErrorAction(options = {}) {
      return MEDIA_UTILS.dataFallbackImageErrorAction(options);
    }

    const directusFileId = SHARED_UTILS.directusFileId;

    const directusAssetUrl = value => SHARED_UTILS.directusAssetUrl(value, DIRECTUS);
    const repairSiteTitles = sites => SITE_TITLE_UTILS.repairSites(sites);

    const relationId = SHARED_UTILS.relationId;

    function printSupportPanel({ title, image, sourceType, slug, enabled = true }) {
      return PRINT_SUPPORT_UTILS.printSupportPanel({ title, image, sourceType, slug, enabled }, { escapeHtml, money, location });
    }

    function updatePrintPanel(panel) {
      PRINT_SUPPORT_UTILS.updatePrintPanel(panel, { money });
    }

    function siteMapIconUrl(site) {
      const rawIcon = String(site?.map_icon || "").trim();
      if (HEADER_IMAGE_BLUE_PLACEHOLDER_ICON_IDS.has(rawIcon) && !siteHasHeaderImage(site)) return TEXT_ONLY_GREEN_PLACEHOLDER_ICON;
      const iconUrl = MEDIA_UTILS.siteMapIconUrl(site, { directusAssetUrl }) || (SITE_UTILS.isExhibitSite(site) ? EXHIBIT_MARKER_ICON : "");
      return MEDIA_UTILS.optimizedMapIconUrl?.(iconUrl, { width: 128, height: 128 }) || iconUrl;
    }

    function siteMapIconKey(site) {
      const raw = String(site?.map_icon || (SITE_UTILS.isExhibitSite(site) ? `exhibit-${site?.slug || site?.id || "site"}` : "")).trim();
      return raw && siteMapIconUrl(site) ? `directus-site-icon-${SHARED_UTILS.sanitizeDomKey(raw)}` : "";
    }

    function siteHasLoadedMapIcon(site) {
      const key = siteMapIconKey(site);
      return Boolean(key && state.loadedMapIconKeys.has(key));
    }

    function isExhibitCalendarEvent(event = {}) {
      const text = normalizeComparisonText([event.event_type, event.title, event.summary, event.body, event.venue].join(" "));
      return /\b(exhibit|exhibition|gallery|collection|on view|artwork|portrait)\b/.test(text);
    }

    function eventMapIconKey(event) {
      return MEDIA_UTILS.eventMapIconUrl(event, { directusAssetUrl }) ? `calendar-event-icon-${SHARED_UTILS.sanitizeDomKey(event?.id || event?.slug || "event")}` : "";
    }

    const BLOCKED_REMOTE_IMAGE_TAG_PATTERN = /<img\b(?=[^>]*https?:\/\/(?:cdn\.newsday\.com|(?:www\.)?27east\.com|www\.easthamptonstar\.com)\b)[^>]*>/gi;

    function firstContentImage(html) {
      const template = document.createElement("template");
      template.innerHTML = String(html || "").replace(BLOCKED_REMOTE_IMAGE_TAG_PATTERN, "");
      const image = template.content.querySelector("img");
      const src = MEDIA_UTILS.cleanImageUrl(image?.getAttribute("data-src") || image?.getAttribute("src") || "");
      return src ? rewriteMediaUrl(src) : "";
    }

    function comparableImageUrl(value) {
      const cleaned = MEDIA_UTILS.cleanImageUrl(value || "");
      const rewritten = rewriteMediaUrl(cleaned);
      try {
        const url = new URL(rewritten, window.location.href);
        url.hash = "";
        return url.href.replace(/[?&](w|width|h|height|fit|crop|auto|quality|q)=[^&]+/gi, "").replace(/[?&]$/, "");
      } catch {
        return String(rewritten || "").replace(/[#?].*$/, "");
      }
    }

    function removeDuplicateHeroImageFromContent(html, heroImage) {
      if (!html || !heroImage) return html || "";
      const heroComparable = comparableImageUrl(heroImage);
      if (!heroComparable) return html || "";
      const template = document.createElement("template");
      template.innerHTML = html;
      const firstImage = template.content.querySelector("img");
      const firstImageComparable = comparableImageUrl(firstImage?.getAttribute("data-src") || firstImage?.getAttribute("src") || "");
      if (!firstImage || firstImageComparable !== heroComparable) return html;
      const container = firstImage.closest("figure, p");
      firstImage.remove();
      if (container && !container.textContent.trim() && !container.querySelector("img, video, iframe, audio")) container.remove();
      return template.innerHTML.trim();
    }

    function contentCardHtml(result) {
      const item = result.item || result;
      const type = result.type || "wiki";
      const thumb = type === "site" ? listingImage(item) : firstContentImage(item.content || "");
      const attr = type === "site" ? `data-site-slug="${escapeHtml(item.slug)}"` : `data-wiki-slug="${escapeHtml(item.slug)}"`;
      const wikiDate = item.last_reviewed || item.lastmod || "";
      const meta = type === "site"
        ? [safeSiteSubtitle(item), item.featured ? "Featured site" : ""].filter(Boolean).join(" - ")
        : ["Knowledgebase", wikiDate ? formatDate(wikiDate) : ""].filter(Boolean).join(" - ");
      return `
        <button class="content-card${thumb ? " has-thumb" : ""}" type="button" ${attr}>
          ${thumb ? `<img class="content-thumb" src="${escapeHtml(thumb)}" alt="" loading="lazy" decoding="async" onerror="${imageErrorAction("", { removeAction: "this.remove();this.closest('.content-card')?.classList.remove('has-thumb');" })}">` : ""}
          <span class="content-card-body">
            ${meta ? `<span class="content-card-meta">${escapeHtml(meta)}</span>` : ""}
            <strong>${escapeHtml(item.title)}</strong>
            <span class="content-card-summary">${escapeHtml(item.summary || "")}</span>
          </span>
        </button>
      `;
    }

    function siteListGeometryKind(site) {
      const geometry = siteDisplayGeometry(site);
      if (/Polygon/.test(geometry?.type || "")) return "polygon";
      return "site";
    }

    function siteListCategoryKey(site) {
      return siteListCachedItem(site).categoryKey;
    }

    function siteListCategoryLabel(site) {
      return siteListCachedItem(site).categoryLabel;
    }

    function sitePassesSiteListPrimaryFilter(site) {
      if (SITE_UTILS.isExhibitSite(site) && exhibitToggle?.checked === false) return false;
      if (siteListCachedItem(site).geometryKind === "polygon") return polygonToggle?.checked !== false;
      return markerToggle?.checked !== false;
    }

    function sitePassesSiteListFilters(site) {
      if (!site?.title || site.publication_status === "draft") return false;
      if (!sitePassesSiteListPrimaryFilter(site)) return false;
      if (!activeCategories().has(siteListCategoryKey(site))) return false;
      const access = activeAccessFilters();
      if (access.size < accessToggles.length) {
        const status = visitAccessStatus(site);
        if (status === "visitable" && !access.has("visitable")) return false;
        if (status !== "visitable" && !access.has("learn")) return false;
      }
      if (!sitePassesLayerCategoryFilters(site)) return false;
      if (eraToggles.length) {
        const activeEras = activeEraFilters();
        if (!activeEras.size) return false;
        if (activeEras.size < eraToggles.length && ![...siteEraKeys(site)].some(key => activeEras.has(key))) return false;
      }
      return true;
    }

    function sortedSiteListItems() {
      return siteListPublishedSites().filter(sitePassesSiteListFilters);
    }

    function clearSiteListCaches() {
      state.siteListItemCache?.clear?.();
      state.siteListPublishedSitesCache = null;
    }

    function siteListCacheKey(site) {
      return String(site?.slug || site?.id || site?.title || "");
    }

    function siteListCachedItem(site) {
      const key = siteListCacheKey(site);
      if (key && state.siteListItemCache?.has(key)) return state.siteListItemCache.get(key);
      const geometryKind = siteListGeometryKind(site);
      const categoryKey = classifySiteFeature(site, geometryKind === "polygon" ? "polygon" : "marker");
      const categoryLabel = {
        territory: "Territory",
        placename: "Place name",
        deed: "Record",
        reservation: "Reservation",
        other: "Other"
      }[categoryKey] || "Other";
      const entry = {
        geometryKind,
        categoryKey,
        categoryLabel,
        cardHtml: siteListCardHtmlUncached(site, categoryLabel),
        sortTitle: String(site?.title || "")
      };
      if (key) state.siteListItemCache.set(key, entry);
      return entry;
    }

    function siteListPublishedSites() {
      if (state.siteListPublishedSitesCache) return state.siteListPublishedSitesCache;
      state.siteListPublishedSitesCache = [...state.sites]
        .filter(site => site?.title && site.publication_status !== "draft")
        .sort((a, b) => siteListCachedItem(a).sortTitle.localeCompare(siteListCachedItem(b).sortTitle, undefined, { sensitivity: "base" }));
      return state.siteListPublishedSitesCache;
    }

    function siteListToggleInput(group, value) {
      if (group === "primary" && value === "sites") return markerToggle;
      if (group === "primary" && value === "boundaries") return polygonToggle;
      if (group === "primary" && value === "exhibits") return exhibitToggle;
      const pools = {
        category: categoryToggles,
        access: accessToggles,
        theme: themeToggles,
        era: eraToggles
      };
      return (pools[group] || []).find(input => input.value === value) || null;
    }

    function siteListFilterButtonHtml(group, value, label) {
      const input = siteListToggleInput(group, value);
      const checked = input?.checked !== false;
      return `<button class="site-list-filter-chip${checked ? " active" : ""}" type="button" data-site-list-filter="${escapeHtml(group)}" data-site-list-filter-value="${escapeHtml(value)}" aria-pressed="${checked ? "true" : "false"}">${escapeHtml(label)}</button>`;
    }

    function siteListFilterGroupHtml(title, items) {
      return `
        <div class="site-list-filter-group">
          <span class="site-list-filter-title">${escapeHtml(title)}</span>
          <div class="site-list-filter-row">
            ${items.map(item => siteListFilterButtonHtml(item.group, item.value, item.label)).join("")}
          </div>
        </div>
      `;
    }

    function toggleLabelText(input) {
      return String(input?.closest("label")?.textContent || input?.value || "").trim();
    }

    function siteListFiltersHtml() {
      return `
        <div class="site-list-filter-panel" aria-label="Site list filters">
          ${siteListFilterGroupHtml("Map labels", [
            { group: "primary", value: "sites", label: "All Sites" },
            { group: "primary", value: "boundaries", label: "Boundaries" },
            { group: "primary", value: "exhibits", label: "Exhibits" }
          ])}
          ${siteListFilterGroupHtml("Categories", categoryToggles.map(input => ({ group: "category", value: input.value, label: toggleLabelText(input) })))}
          ${siteListFilterGroupHtml("Access", accessToggles.map(input => ({ group: "access", value: input.value, label: toggleLabelText(input) })))}
          ${siteListFilterGroupHtml("Interests", themeToggles.map(input => ({ group: "theme", value: input.value, label: toggleLabelText(input) })))}
          ${siteListFilterGroupHtml("Eras", eraToggles.map(input => ({ group: "era", value: input.value, label: toggleLabelText(input) })))}
        </div>
      `;
    }

    function updateSiteListFilterChips(root = articleBodyEl) {
      root?.querySelectorAll?.("[data-site-list-filter]")?.forEach(button => {
        const input = siteListToggleInput(button.dataset.siteListFilter, button.dataset.siteListFilterValue);
        const active = input?.checked !== false;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function renderSiteListResults() {
      const countEl = articleBodyEl.querySelector("[data-site-list-count]");
      const listEl = articleBodyEl.querySelector("[data-site-list-results]");
      if (!countEl || !listEl) return false;
      const items = sortedSiteListItems();
      const total = siteListPublishedSites().length;
      countEl.textContent = `${items.length} of ${total} sites`;
      listEl.innerHTML = items.length ? siteListGroupsHtml(items) : "<p class=\"article-summary\">No sites match the active label filters.</p>";
      updateSiteListFilterChips();
      return true;
    }

    function scheduleSiteListFilterSideEffects(options = {}) {
      if (state.siteListFilterSyncTimer) window.clearTimeout(state.siteListFilterSyncTimer);
      state.siteListFilterSyncTimer = window.setTimeout(() => {
        state.siteListFilterSyncTimer = null;
        applyLayerVisibility();
        if (options.timeline) renderTimelineDock();
      }, 30);
    }

    function toggleSiteListFilter(group, value) {
      const input = siteListToggleInput(group, value);
      if (!input) return;
      input.checked = !input.checked;
      clearFeatureCache();
      updateSiteListFilterChips();
      renderSiteListResults();
      scheduleSiteListFilterSideEffects({ timeline: group === "era" || group === "theme" });
    }

    function siteListThumbnailHtml(site) {
      const image = listingImage(site);
      if (image) {
        return `<span class="site-list-thumb site-list-thumb-photo"><img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async" onerror="${imageErrorAction("", { removeAction: "this.remove();" })}"></span>`;
      }
      const icon = siteMapIconUrl(site);
      if (icon) {
        return `<span class="site-list-thumb site-list-thumb-icon"><img src="${escapeHtml(icon)}" alt="" loading="lazy" decoding="async" onerror="${imageErrorAction("", { removeAction: "this.remove();" })}"></span>`;
      }
      const initial = String(site.title || "?").trim().charAt(0).toUpperCase() || "?";
      return `<span class="site-list-thumb" aria-hidden="true">${escapeHtml(initial)}</span>`;
    }

    function siteListCardHtmlUncached(site, categoryLabel = siteListCategoryLabel(site)) {
      const meta = [categoryLabel, safeSiteSubtitle(site)].filter(Boolean).join(" - ");
      const summarySource = site.summary || site.why_this_matters || site.introduction_content || site.history_content || "";
      const summary = firstCompleteSentences(stripHtml(summarySource), 1, 180);
      return `
        <button class="content-card site-list-card" type="button" data-site-slug="${escapeHtml(site.slug || "")}">
          ${siteListThumbnailHtml(site)}
          <span class="content-card-body">
            ${meta ? `<span class="content-card-meta">${escapeHtml(meta)}</span>` : ""}
            <strong>${escapeHtml(site.title || "Untitled site")}</strong>
            ${summary ? `<span class="content-card-summary">${escapeHtml(summary)}</span>` : ""}
          </span>
        </button>
      `;
    }

    function siteListCardHtml(site) {
      return siteListCachedItem(site).cardHtml;
    }

    function siteListGroupsHtml(items) {
      let currentGroup = "";
      let html = "";
      items.forEach(site => {
        const letter = String(site.title || "#").trim().charAt(0).toUpperCase();
        const group = /[A-Z]/.test(letter) ? letter : "#";
        if (group !== currentGroup) {
          if (currentGroup) html += "</div>";
          currentGroup = group;
          html += `<div class="site-list-group"><h3 class="site-list-letter">${escapeHtml(group)}</h3>`;
        }
        html += siteListCardHtml(site);
      });
      if (currentGroup) html += "</div>";
      return html;
    }

    function renderSiteListIfActive() {
      if (state.activeContent?.type === "site-list" && articleEl.classList.contains("open")) {
        if (!renderSiteListResults()) openSiteList({ skipHistory: true, skipRoute: true, preserveScroll: true });
      }
    }

    function blogCardHtml(item) {
      const imageSource = MEDIA_UTILS.cleanImageUrl(item.featured_image_url) || firstContentImage(item.content || "");
      const image = imageSource ? rewriteMediaUrl(imageSource) : "";
      const date = item.published_at ? new Date(item.published_at).toLocaleDateString() : "";
      return `
        <button class="content-card${image ? " has-thumb" : ""}" type="button" data-blog-slug="${escapeHtml(item.slug)}">
          ${image ? `<img class="content-thumb" src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async">` : ""}
          <span class="content-card-body">
            ${date ? `<span class="content-card-meta">${escapeHtml(date)}</span>` : ""}
            <strong>${escapeHtml(item.title)}</strong>
            <span class="content-card-summary">${escapeHtml(item.summary || "")}</span>
          </span>
        </button>
      `;
    }

    function openKnowledgebaseTag(tag) {
      const cleanTag = String(tag || "").trim();
      if (!cleanTag) return;
      rememberPanel();
      const needle = normalizeComparisonText(cleanTag);
      const matches = state.wikiArticles
        .filter(article => normalizeComparisonText([article.title, article.summary, article.content].filter(Boolean).join(" ")).includes(needle))
        .sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")))
        .slice(0, 24);
      articleHeadEl.innerHTML = `
        <p class="article-kicker">Knowledgebase tag</p>
        <h2>${escapeHtml(cleanTag)}</h2>
      `;
      articleBodyEl.innerHTML = `
        <p class="article-summary">Articles connected to this word or theme.</p>
        <div class="content-list">
          ${matches.map(article => contentCardHtml({ type: "wiki", item: article })).join("") || "<p class=\"article-summary\">No articles matched this tag yet.</p>"}
        </div>
      `;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
    }

    function pageCardHtml(item) {
      const imageSource = MEDIA_UTILS.cleanImageUrl(item.featured_image_url) || firstContentImage(item.content || "");
      const image = imageSource ? rewriteMediaUrl(imageSource) : "";
      const date = item.wp_date ? new Date(item.wp_date).toLocaleDateString() : "";
      const typeLabel = item.content_type === "homepage" ? "Homepage" : "Public page";
      return `
        <button class="content-card${image ? " has-thumb" : ""}" type="button" data-content-slug="${escapeHtml(item.slug)}">
          ${image ? `<img class="content-thumb" src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async">` : ""}
          <span class="content-card-body">
            <span class="content-card-meta">${escapeHtml([typeLabel, date].filter(Boolean).join(" - "))}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <span class="content-card-summary">${escapeHtml(item.summary || "")}</span>
          </span>
        </button>
      `;
    }

    function languageQuizContentKey(type, item) {
      return PROFILE_UTILS.languageQuizContentKey(type, item);
    }

    function languageQuizAlreadyUsedToday(contentKey) {
      const profile = currentContributorProfile();
      if (!profile || state.contributorSession?.pending) return true;
      const today = localDateKey();
      return [...profileIdentityIds(profile)].some(profileId =>
          (state.languageQuizAttempts || []).some(item =>
            Number(relationId(item.member_profile)) === Number(profileId) &&
            String(item.content_key || "") === String(contentKey || "") &&
            String(item.answered_at || "").slice(0, 10) === today
          )
        );
    }

    function languageWordPattern(word) {
      return PROFILE_UTILS.languageWordPattern(word);
    }

    function languageWordForText(text) {
      return PROFILE_UTILS.languageWordForText(LANGUAGE_QUIZ_WORDS, text, { sortLongest: true });
    }

    function attachLanguageQuizMarkers(type, item) {
      const profile = currentContributorProfile();
      if (!profile || state.contributorSession?.pending || !articleBodyEl) return;
      const contentKey = languageQuizContentKey(type, item);
      if (languageQuizAlreadyUsedToday(contentKey)) return;
      const blockedSelector = "a, button, input, textarea, select, script, style, .language-vocab-grid, .language-comparison-table, .language-quiz-marker";
      const walker = document.createTreeWalker(articleBodyEl, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || parent.closest(blockedSelector)) return NodeFilter.FILTER_REJECT;
          if (parent.closest("[hidden]") || parent.offsetParent === null) return NodeFilter.FILTER_REJECT;
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          return languageWordForText(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      });
      const node = walker.nextNode();
      if (!node) return;
      const word = languageWordForText(node.nodeValue);
      const match = node.nodeValue.match(languageWordPattern(word));
      if (!match) return;
      const start = match.index + match[1].length;
      const end = start + match[2].length;
      const after = node.splitText(end);
      const matched = node.splitText(start);
      const term = document.createElement("span");
      term.className = "language-quiz-term";
      matched.parentNode.insertBefore(term, matched);
      term.appendChild(matched);
      const marker = document.createElement("button");
      marker.className = "language-quiz-marker";
      marker.type = "button";
      marker.textContent = "!";
      marker.title = `Language pop quiz: ${word.english}`;
      marker.setAttribute("aria-label", `Language pop quiz for ${word.english}`);
      marker.dataset.languageQuizId = word.id;
      marker.dataset.languageContentKey = contentKey;
      marker.dataset.languageContentTitle = item?.title || "";
      term.parentNode.insertBefore(marker, after);
    }

    function decorateCurrentArticleForLanguageQuiz(type, item) {
      window.requestAnimationFrame(() => attachLanguageQuizMarkers(type, item));
    }

    function languageQuizChoices(word) {
      const distractors = LANGUAGE_QUIZ_WORDS
        .filter(item => item.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      return [word, ...distractors].sort(() => Math.random() - 0.5);
    }

    function openLanguageQuiz(wordId, contentKey, contentTitle) {
      const word = LANGUAGE_QUIZ_WORDS.find(item => item.id === wordId);
      if (!word || !languageQuizModalEl) return;
      const choices = languageQuizChoices(word);
      languageQuizModalEl.innerHTML = `
        <div class="language-quiz-card" data-language-quiz-card data-word-id="${escapeHtml(word.id)}" data-content-key="${escapeHtml(contentKey)}">
          <h3 id="language-quiz-title">Language Pop Quiz</h3>
          <p>Which recorded Algonquian word matches <strong>${escapeHtml(word.english)}</strong>?</p>
          ${contentTitle ? `<p class="article-meta">From: ${escapeHtml(contentTitle)}</p>` : ""}
          <div class="language-quiz-options">
            ${choices.map(choice => `<button class="language-quiz-option" type="button" data-language-answer="${escapeHtml(choice.id)}">${escapeHtml(choice.algonquian)}</button>`).join("")}
          </div>
          <p class="language-quiz-result" data-language-result hidden></p>
          <button class="button secondary" type="button" data-close-language-quiz>Close</button>
        </div>
      `;
      languageQuizModalEl.hidden = false;
    }

    function placeAdoptionDisplayName(item = {}) {
      const fields = [
        item.adopted_by_display_name,
        item.adopted_by_name,
        item.adopter_display_name,
        item.adopter_name,
        item.place_steward_name,
        item.supporter_display_name
      ];
      return publicCleanText(fields.find(Boolean) || "");
    }

    function placeAdoptionIsActive(item = {}) {
      const name = placeAdoptionDisplayName(item);
      if (!name) return false;
      const status = normalizeComparisonText(item.adoption_status || item.adopted_status || item.place_stewardship_status || "");
      if (item.adoption_active === false || item.place_stewardship_active === false) return false;
      return !["inactive", "expired", "cancelled", "canceled", "ended"].includes(status);
    }

    function placeAdoptionBylineHtml(item = {}) {
      if (!placeAdoptionIsActive(item)) return "";
      return `<p class="place-adoption-byline">Adopted by ${escapeHtml(placeAdoptionDisplayName(item))}</p>`;
    }

    function placeAdoptionCtaHtml(item = {}, options = {}) {
      const title = publicCleanText(item.title || item.polyname || item.name || "this place");
      if (!title) return "";
      const slug = publicCleanText(item.slug || item.id || title);
      const activeName = placeAdoptionDisplayName(item);
      const active = placeAdoptionIsActive(item);
      return `
        <section class="section adopt-place-section" data-adopt-place-section>
          <div class="adopt-place-sign">
            <span class="adopt-place-kicker">${active ? "Place Stewardship" : "Adopt This Place"}</span>
            <h3>${active ? `Adopted by ${escapeHtml(activeName)}` : "Adopt This Place"}</h3>
            <p>${active
              ? escapeHtml(`${activeName} helps support care, research, source review, and public information connected to ${title}.`)
              : escapeHtml(`For $25/month, registered supporters can help steward ${title}. Confirmed adopters may have their public display name shown below the listing title as "Adopted by Name."`)}</p>
            <p class="adopt-place-note">${escapeHtml("Adoption supports the map, sources, community knowledge, and respectful updates. It does not imply ownership or permission to access private or sensitive places.")}</p>
            <button class="button action adopt-place-button" type="button" data-adopt-place data-adopt-place-slug="${escapeHtml(slug)}" data-adopt-place-title="${escapeHtml(title)}" data-adopt-place-kind="${escapeHtml(options.kind || "site")}">
              ${active ? "Add support for this place" : "Adopt this place - $25/month"}
            </button>
          </div>
        </section>
      `;
    }

    function openAdoptPlace(button) {
      const slug = button?.dataset?.adoptPlaceSlug || "";
      const title = button?.dataset?.adoptPlaceTitle || "this place";
      const site = slug && state.siteBySlug.has(slug) ? state.siteBySlug.get(slug) : null;
      openSupportPage({
        adoption: {
          siteSlug: site?.slug || slug,
          siteTitle: site?.title || title,
          amount: 25
        }
      });
    }

    async function answerLanguageQuiz(button) {
      const card = button.closest("[data-language-quiz-card]");
      const word = LANGUAGE_QUIZ_WORDS.find(item => item.id === card?.dataset.wordId);
      if (!card || !word) return;
      const contentKey = card.dataset.contentKey || "";
      const result = card.querySelector("[data-language-result]");
      if (languageQuizAlreadyUsedToday(contentKey)) {
        card.querySelectorAll("[data-language-answer]").forEach(option => { option.disabled = true; });
        if (result) {
          result.hidden = false;
          result.textContent = "You already tried this language quiz today.";
        }
        document.querySelector(`[data-language-quiz-id="${CSS.escape(word.id)}"]`)?.remove();
        return;
      }
      const correct = button.dataset.languageAnswer === word.id;
      card.querySelectorAll("[data-language-answer]").forEach(option => {
        option.disabled = true;
        option.classList.toggle("correct", option.dataset.languageAnswer === word.id);
        option.classList.toggle("wrong", option === button && !correct);
      });
      if (result) {
        result.hidden = false;
        result.textContent = "Saving language progress...";
      }
      try {
        const saved = await saveLanguageAttempt(contentKey, word, correct);
        if (result) result.textContent = correct
          ? (saved?._existingAttempt ? "Language point is saved. Word is on your profile." : "+1 language point. Word added to your profile.")
          : `Not this time. The recorded word is ${word.algonquian}.`;
        showBanner(correct ? "Language point earned." : "Language quiz answered for today.");
        document.querySelector(`[data-language-quiz-id="${CSS.escape(word.id)}"]`)?.remove();
      } catch (error) {
        card.querySelectorAll("[data-language-answer]").forEach(option => {
          option.disabled = false;
          option.classList.remove("correct", "wrong");
        });
        const message = error?.message || "Could not save language progress to Directus. Please log in again and try once more.";
        if (result) result.textContent = message;
        showBanner(message);
      }
    }

    async function openListing(site, context = {}) {
      const openedAt = nowMs();
      if (!context.skipHistory) rememberPanel();
      clearBiographyPathOverlay();
      if (!fullArchiveDataLoaded && !context.skipFullArchiveHydration) {
        const loadingSummary = site?.summary || (site ? safeSiteSubtitle(site) : "") || "The map is ready. Full site details are loading now.";
        articleHeadEl.innerHTML = `
          <p class="article-kicker">${escapeHtml(context.source || "Archive listing")}</p>
          <h2>${escapeHtml(site?.title || "Loading site")}</h2>
          <p class="article-meta">Loading article content...</p>
        `;
        articleBodyEl.innerHTML = `
          <p class="article-summary">${escapeHtml(loadingSummary)}</p>
          <p class="form-status">Preparing the full listing, sources, comments, and timeline.</p>
        `;
        markArticlePanelOpen();
        updateBackButton();
        await requestFullArchiveData("listing-open").catch(error => console.warn("Full listing content will keep loading in the background.", error));
        site = state.siteBySlug.get(site?.slug) || state.siteById.get(Number(site?.id)) || site;
      }
      site = await hydrateSite(site);
      state.activeContent = { type: "site", slug: site.slug };
      const linked = new Set();
      const excludeHref = `#listing/${site.slug}`;
      const summary = publicCleanText(site.summary || stripHtml(site.introduction_content || site.history_content));
      const showSummary = shouldShowLeadSummary(summary, site);
      const image = listingHeroImage(site);
      const imageSrcset = listingHeroSrcset(site);
      const access = visitAccessStatus(site);
      articleHeadEl.innerHTML = `
        <p class="article-kicker">${escapeHtml(context.source || "Archive listing")}</p>
        <h2>${escapeHtml(site.title)}</h2>
        ${placeAdoptionBylineHtml(site)}
        ${site.address_label && access === "visitable" ? `<p class="article-meta">${escapeHtml(site.address_label)}</p>` : `<p class="article-meta">${escapeHtml(visitAccessLabel(site))}</p>`}
        ${site.territory_display_label ? `<p class="article-meta territory-display-status">${escapeHtml(site.territory_display_label)}</p>` : ""}
        ${siteAncestralMeta(site)}
        ${siteCategoryTagButtons(site)}
      `;
      const siteMoments = timelineEventsFor("site", site.id, site.slug);
      const imageFallback = listingImageFallback(site);
      let renderedSiteMoments = false;
      const sections = contentSections(site).map(([title, content]) => {
        if (/^history$/i.test(title) && siteMoments.length) {
          renderedSiteMoments = true;
          return `${sourceAwareSectionHtml(title, content, { used: linked, excludeHref })}${historicMomentsSection(siteMoments, { linked, excludeHref, showLocations: false })}`;
        }
        return sourceAwareSectionHtml(title, content, { used: linked, excludeHref });
      }).join("");
      articleBodyEl.innerHTML = `
        ${learningPathArticleHeader(site)}
        ${image ? `<img class="hero-image article-sticky-hero" src="${escapeHtml(image)}" ${imageSrcset ? `srcset="${imageSrcset}" sizes="(max-width: 760px) 100vw, 760px"` : ""} ${imageFallback ? `data-fallback-src="${escapeHtml(imageFallback)}"` : ""} alt="" loading="lazy" decoding="async" onerror="${dataFallbackImageErrorAction({ removeAction: "this.remove();" })}">${printSupportPanel({ title: site.title, image, sourceType: "site", slug: site.slug, enabled: site.show_print_purchase !== false })}` : ""}
        ${showSummary ? `<p class="article-summary">${escapeHtml(summary)}</p>` : ""}
        ${sections}
        ${siteMoments.length && !renderedSiteMoments ? historicMomentsSection(siteMoments, { linked, excludeHref, showLocations: false }) : ""}
        ${whyThisMattersSection(site)}
        ${visitRespectfullySection(site)}
        ${sourcesEvidenceSection(site, "site")}
        ${relatedSitesSection(site)}
        ${placeAdoptionCtaHtml(site, { kind: "site" })}
        ${plantObservationGrid("site", site)}
        ${discussionSection("site", site)}
        ${isFrontendAdmin() ? `<div class="article-actions">
          <button class="button secondary" type="button" data-open-frontend-editor="site" data-editor-slug="${escapeHtml(site.slug)}">Edit content</button>
        </div>` : ""}
      `;
      markArticlePanelOpen();
      decorateCurrentArticleForQuoteComments("site", site);
      decorateCurrentArticleForLanguageQuiz("site", site);
      updateBackButton();
      resetArticleScroll();
      setTimelineContextEvents(siteMoments);
      const activeEvent = context.timelineEventId || siteMoments[0]?.id;
      if (activeEvent) setActiveTimelineEvent(activeEvent, { scrollTimeline: true });
      else clearActiveTimelineEvent();
      if (!context.skipRoute) setRoute({ site: site.slug, event: context.timelineEventId });
      if (context.focus !== false && (context.focusGeometry || context.focusCenter || !userMovedMapSince(openedAt))) {
        const targetGeometry = context.focusGeometry || siteDisplayGeometry(site);
        if (targetGeometry) focusGeometry(targetGeometry, targetGeometry.type === "Point" ? 11 : 9.5, {
          center: context.focusCenter || null,
          zoom: context.focusZoom || null,
          duration: context.focusDuration,
          localPolygonFocus: context.localPolygonFocus === true
        });
        else focusRelatedContentFeature("site", site.slug);
      }
    }

    function shouldShowLeadSummary(summary, site) {
      const lead = stripHtml(summary || "");
      if (!lead) return false;
      const introduction = stripHtml(site.introduction_content || "");
      if (!introduction) return true;
      const leadKey = normalizeComparisonText(lead);
      const introKey = normalizeComparisonText(introduction);
      if (introKey.includes(leadKey) || leadKey.includes(introKey.slice(0, Math.min(introKey.length, 180)))) return false;
      const leadStart = leadKey.split(/\s+/).slice(0, 18).join(" ");
      const introStart = introKey.split(/\s+/).slice(0, 18).join(" ");
      if (leadStart && introStart && (leadStart.startsWith(introStart.slice(0, 80)) || introStart.startsWith(leadStart.slice(0, 80)))) return false;
      const leadWords = new Set(leadKey.split(/\s+/).filter(word => word.length > 3).slice(0, 55));
      const introWords = new Set(introKey.split(/\s+/).filter(word => word.length > 3).slice(0, 55));
      if (leadWords.size && introWords.size) {
        let shared = 0;
        leadWords.forEach(word => {
          if (introWords.has(word)) shared += 1;
        });
        const overlap = shared / Math.min(leadWords.size, introWords.size);
        if (overlap >= 0.58) return false;
      }
      return true;
    }

    function shouldShowWikiLeadSummary(summary, articleContentHtml) {
      const lead = stripHtml(summary || "");
      if (!lead) return false;
      const body = stripHtml(articleContentHtml || "");
      return !body;
    }

    function firstCompleteSentences(text, maxSentences = 2, maxLength = 260) {
      const cleaned = publicCleanText(text || "")
        .replace(/\s+/g, " ")
        .replace(/\b[A-Z]{1,2}\d{2,}\b/g, "")
        .trim();
      if (!cleaned) return "";
      const sentences = cleaned.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [];
      const chosen = sentences.slice(0, maxSentences).join(" ").trim();
      if (chosen && chosen.length <= maxLength) return chosen;
      if (chosen) return chosen.slice(0, maxLength).replace(/\s+\S*$/, "").trim() + ".";
      return cleaned.slice(0, maxLength).replace(/\s+\S*$/, "").trim() + ".";
    }

    function isInternalKnowledgebaseProcessNote(value = "") {
      return /source-supported biography|on this site knowledgebase|inline footnotes|public-safe context/i.test(stripHtml(value || ""));
    }

    function publicWikiSummary(article = {}) {
      const summary = article.summary || "";
      if (!isInternalKnowledgebaseProcessNote(summary)) return summary;
      const fallback = firstCompleteSentences(article.content || article.why_this_matters || "", 2, 300);
      return fallback && !isInternalKnowledgebaseProcessNote(fallback) ? fallback : "";
    }

    function sanitizePublicWikiArticle(article = {}) {
      const summary = publicCleanText(publicWikiSummary(article));
      const content = SITE_UTILS.stripInternalPublicSiteSections(article.content);
      const whyThisMatters = SITE_UTILS.stripInternalPublicSiteSections(article.why_this_matters);
      if (summary === article.summary && content === article.content && whyThisMatters === article.why_this_matters) return article;
      return { ...article, summary, content, why_this_matters: whyThisMatters };
    }

    function legacyWhyThisMattersTexts(item) {
      return SHARED_UTILS.legacyWhyThisMattersTexts(item, SITE_CONTENT_SECTION_FIELDS, {
        hasContent: value => stripHtml(value).length > 0
      });
    }

    function whyThisMattersParagraphs(item) {
      const directusText = publicCleanText(item?.why_this_matters || "");
      const override = WHY_THIS_MATTERS_OVERRIDES[item?.slug];
      const sourceType = Number(state.siteBySlug.get(item?.slug)?.id) === Number(item?.id) ? "site" : state.wikiBySlug.has(item?.slug) ? "wiki" : "";
      const momentText = sourceType ? timelineEventsFor(sourceType, item.id, item.slug)
        .map(event => [event.date_label, event.title, event.description, event.summary].filter(Boolean).join(" "))
        .join(" ") : "";
      const text = publicCleanText([item.summary, item.introduction_content, item.preservation_content, item.history_content, momentText].filter(Boolean).join(" "));
      const generatedText = culturallySensitiveWhyText(item, text);
      const fallback = "A mapped place can connect Native Long Island history, presence, stewardship, and memory.";
      const legacyTexts = legacyWhyThisMattersTexts(item);
      const realTexts = [directusText, ...legacyTexts].filter(Boolean);
      const values = realTexts.length ? realTexts : [override, generatedText || fallback];
      return SHARED_UTILS.uniqueTextBlocks(
        values,
        { cleanText: publicCleanText, normalizeText: normalizeComparisonText }
      );
    }

    function whyThisMattersSection(item) {
      const paragraphs = whyThisMattersParagraphs(item);
      if (!paragraphs.length) return "";
      return `
        <section class="section why-matters-section">
          <h3>Why This Matters</h3>
          ${paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join("")}
        </section>
      `;
    }

    function whySentenceFrom(text, pattern) {
      const sentences = String(text || "")
        .replace(/\s+/g, " ")
        .split(/(?<=[.!?])\s+/)
        .map(line => line.trim())
        .filter(Boolean);
      return sentences.find(sentence => pattern.test(sentence) && sentence.length > 28) || "";
    }

    function whyTrimSentence(sentence, maxLength = 185) {
      const cleaned = String(sentence || "").replace(/\s+/g, " ").trim();
      if (!cleaned) return "";
      if (cleaned.length <= maxLength) return cleaned;
      return `${cleaned.slice(0, maxLength).replace(/\s+\S*$/, "").trim()}.`;
    }

    function whyExtractMeaning(title, text) {
      const patterns = [
        /(?:translates? (?:to|as)|translated (?:to|as)|means|meaning)\s+["'“”]?([^."'“”]{3,90})/i,
        /["'“”][^"'“”]{2,80}["'“”]\s+(?:means|translates? (?:to|as))\s+["'“”]?([^."'“”]{3,90})/i
      ];
      for (const pattern of patterns) {
        const match = String(text || "").match(pattern);
        if (match?.[1]) return match[1].replace(/\s+/g, " ").trim();
      }
      const titleMatch = String(text || "").match(new RegExp(`${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^.]{0,120}(?:means|translates?|translated)[^.]{3,120}`, "i"));
      return titleMatch ? whyTrimSentence(titleMatch[0], 150) : "";
    }

    function whySpecificClause(title, text, patterns, fallback = "") {
      const sentence = whyTrimSentence(whySentenceFrom(text, patterns));
      if (!sentence) return fallback;
      return sentence;
    }

    function culturallySensitiveWhyText(item, text) {
      const title = item.title || "This place";
      const combined = normalizeComparisonText(`${title} ${item.site_type || ""} ${text || ""}`);
      const titleTypeText = normalizeComparisonText(`${title} ${item.site_type || ""} ${item.category || ""}`);
      const translationText = normalizeComparisonText(`${item.translation_title || ""} ${item.translation_content || ""}`);
      const territory = state.siteById.get(Number(item?.ancestral_territory));
      const territoryLine = territory?.title && territory.id !== item?.id ? ` on ${territory.title}` : "";
      const isPlaceNameEntry = /place ?name|placename|translation/.test(titleTypeText) ||
        /name means|name translates|translates to|translated as|meaning of|called by|known as/.test(combined) ||
        /name means|translates|translated|meaning/.test(translationText);
      const harmfulColonialFramingPattern = new RegExp([
        "murdered by " + "indians",
        "savage",
        "indian attack",
        "killed by " + "indians"
      ].join("|"), "i");
      const safeSentence = (text || "")
        .split(/(?<=[.!?])\s+/)
        .map(line => line.trim())
        .find(line => line.length > 40 && !harmfulColonialFramingPattern.test(line));
      if (/burial|cemetery|sacred|ceremony|spiritual|cosmology|ritual/.test(combined)) {
        const detail = whySpecificClause(title, text, /burial|cemetery|sacred|ceremony|spiritual|cosmology|ritual|grave|ancestors/i, `${title} points to a place with cultural or spiritual sensitivity.`);
        return `${detail} The practical takeaway is care: some places are learned from through respect, restraint, and community context, not through treating every mapped location as a public destination.`;
      }
      if (/murder|massacre|war|raid|violence|conflict|attack|killed|prisoner|burned/.test(combined)) {
        const detail = whySpecificClause(title, text, /\b(1[5-9]\d{2}|20\d{2}|murder|massacre|war|raid|violence|conflict|attack|killed|prisoner|burned|settlers|settlement|diplomacy|sachem)\b/i, `${title} marks a difficult moment in colonial-era Long Island history.`);
        return `${detail} Read it as more than an isolated incident: the larger lesson is how settlement, land pressure, Native diplomacy, and survival were often recorded through colonial sources that only preserve part of the story.`;
      }
      if (/deed|purchase|patent|treaty|sale|record|colonial|court|lawsuit|petition/.test(combined)) {
        const detail = whySpecificClause(title, text, /deed|purchase|patent|treaty|sale|record|court|lawsuit|petition|boundary|claim|land/i, `${title} is tied to a written record about land.`);
        return `${detail} Use the record as evidence, but also as a question: who wrote it, whose authority did it serve, and what Native presence continued after the paperwork?`;
      }
      if (isPlaceNameEntry) {
        const meaning = whyExtractMeaning(title, `${item.translation_content || ""} ${text || ""}`);
        const detail = meaning ? `${title} is preserved here with the meaning or translation "${meaning}"` : `${title} is preserved here as a Native place name${territoryLine}`;
        return `${detail}. The lesson is that names are evidence: they can carry language, geography, memory, and relationships to land or water that later maps renamed, flattened, or obscured.`;
      }
      if (/reservation|nation|tribal|community|sovereign|recognition|govern/.test(combined)) {
        const detail = whySpecificClause(title, text, /reservation|nation|tribal|community|sovereign|recognition|govern|federal|state|people/i, `${title} connects the map to a living Native community.`);
        return `${detail} The present-day connection is central: this is about sovereignty, homeland, and community continuity, not only something that happened in the past.`;
      }
      if (/ancestral|traditional|territory|homeland/.test(combined)) {
        const detail = whySpecificClause(title, text, /ancestral|traditional|territory|homeland|community|people|land/i, `${title} represents a larger ancestral homeland area.`);
        return `${detail} This turns the map from scattered points into a connected landscape, showing homeland, movement, responsibility, and overlapping histories rather than isolated pins.`;
      }
      if (/water|shore|bay|pond|river|creek|brook|beach|island|whal|fish|shell|wampum|marsh/.test(combined)) {
        const detail = whySpecificClause(title, text, /water|shore|bay|pond|river|creek|brook|beach|island|whal|fish|shell|wampum|marsh|canoe|travel|food/i, `${title} shows a relationship between place, water, and Native life.`);
        return `${detail} A useful takeaway is to read the shoreline, bays, marshes, and waterways as part of the story: they shaped travel, foodways, trade, language, and environmental knowledge.`;
      }
      if (/museum|exhibit|collection|gallery|archive|preservation/.test(combined)) {
        const detail = whySpecificClause(title, text, /museum|exhibit|collection|gallery|archive|preservation|display|public|interpret/i, `${title} is connected to public interpretation or preservation.`);
        return `${detail} The bigger issue is interpretation: places like this shape what audiences learn, what gets protected, and what Native community context still needs to be centered.`;
      }
      if (/person|sachem|leader|princess|minister|artist|author|biograph|born|died/.test(combined)) {
        const detail = whySpecificClause(title, text, /sachem|leader|minister|artist|author|born|died|family|community|work|life/i, `${title} centers an individual life connected to Native Long Island history.`);
        return `${detail} Biography keeps the map grounded in people, families, choices, creativity, leadership, and community memory.`;
      }
      if (safeSentence) {
        const clipped = whyTrimSentence(safeSentence, 170);
        return `${clipped} Use that detail as the starting question: what does this place reveal about Native Long Island that a plain map label would miss?`;
      }
      return `${title} adds one more specific place, name, or memory to the larger map of Native Long Island history. The takeaway is to treat even a small entry as a doorway into a wider story.`;
    }

    const DEFAULT_LAST_EDITED_LABEL = "10/01/2018";

    function sourcesEvidenceSection(item, sourceType = "site") {
      const date = latestEditedDate(item);
      return HTML_UTILS.sourcesEvidenceHtml(item, {
        cleanText: publicCleanText,
        escapeHtml,
        editedLabel: ACTIVITY_UTILS.editedDateLabel(date, { fallback: DEFAULT_LAST_EDITED_LABEL }),
        metaClass: "article-meta"
      });
    }

    function latestEditedDate(item) {
      if (!item) return "";
      return ACTIVITY_UTILS.siteEditedDate(item);
    }

    function visitRespectfullySection(site) {
      const profile = currentContributorProfile();
      return `
        <section class="section">
          <div class="respect-note">
            <strong>Visit respectfully</strong>
            <p>${siteIsVisitable(site) ? "Not every map point leads to a public place. Stay on public roads and paths, do not enter private property, do not collect or disturb anything, and treat sensitive places with care." : "This place is best approached through learning, not directions. It may be private, sensitive, approximate, or not open for public visiting."}</p>
            ${profile?.id && !state.contributorSession?.pending ? `<div class="article-actions"><button class="button secondary" type="button" data-check-in-site="${escapeHtml(site.slug || "")}">Check in nearby</button></div>` : ""}
          </div>
        </section>
      `;
    }

    function siteAncestralMeta(site) {
      const territory = state.siteById.get(Number(site.ancestral_territory));
      if (!territory || territory.id === site.id) return "";
      return `<p class="article-meta">On <button class="article-meta-link" type="button" data-site-slug="${escapeHtml(territory.slug)}">${escapeHtml(territory.title)}</button></p>`;
    }

    function siteCategoryTagButtons(site) {
      const tags = siteCategoryTags(site);
      if (!tags.length) return "";
      return `
        <div class="site-tag-actions" aria-label="Related site lists">
          ${tags.map(tag => `<a class="site-tag-chip" href="${escapeHtml(siteTagUrl(tag.key))}" data-site-tag-key="${escapeHtml(tag.key)}" data-site-tag-label="${escapeHtml(tag.label)}">${escapeHtml(tag.label)}</a>`).join("")}
        </div>
      `;
    }

    function siteTagUrl(tagKey) {
      const url = new URL(window.location.href);
      url.search = "";
      if (adminMode) url.searchParams.set("admin", "1");
      url.searchParams.set("tag", tagKey);
      return `${url.pathname}${url.search}`;
    }

    function siteSubtitle(site) {
      return SITE_UTILS.siteSubtitle(site);
    }

    function safeSiteSubtitle(site) {
      try {
        return siteSubtitle(site);
      } catch {
        const rawType = String(site?.site_type || "").trim();
        const address = String(site?.address_label || "").trim();
        return rawType ? rawType.replace(/[_-]+/g, " ") : address || "Long Island";
      }
    }

    const normalizeComparisonText = SHARED_UTILS.normalizeText;
    const DESKTOP_TERRITORY_FILL_OVERRIDES = {
      "corchaug-ancestral-land": "#ff8a00",
      "merrick-ancestral-land": "#00a7b5",
      "hoggenoch": "#66ff00",
      "hoggenoch-manhansett-ancestral-land": "#66ff00"
    };

    function siteIsAlgonquianPlaceName(site) {
      return SITE_UTILS.siteIsAlgonquianPlaceName(site, {
        normalizeText: normalizeComparisonText,
        isBroadTerritory: isBroadTerritorySite
      });
    }

    function siteCategoryTags(site) {
      return SITE_UTILS.siteCategoryTags(site, {
        normalizeText: normalizeComparisonText,
        isBroadTerritory: isBroadTerritorySite,
        isAlgonquianPlaceName: siteIsAlgonquianPlaceName,
        typeMode: "raw"
      });
    }

    function relatedSiteCenter(site) {
      if (Array.isArray(site?.center) && site.center.length >= 2) return site.center;
      const geometry = siteDisplayGeometry(site);
      if (geometry?.type === "Point" && Array.isArray(geometry.coordinates)) return geometry.coordinates;
      return geometry ? siteCenter(geometry) : null;
    }

    function relatedSiteMiles(a, b) {
      return milesBetweenPoints(a, b);
    }

    function relatedMomentKeys(site) {
      return new Set(timelineEventsFor("site", site?.id, site?.slug)
        .map(event => [
          event.related_wiki_slug,
          event.related_site_slug,
          event.source_slug,
          event.source_title,
          event.date_label && event.title ? `${event.date_label}:${event.title}` : ""
        ].filter(Boolean).map(value => normalizeComparisonText(value)))
        .flat()
        .filter(value => value && value.length > 4));
    }

    function setsIntersect(a, b) {
      if (!a?.size || !b?.size) return false;
      const small = a.size <= b.size ? a : b;
      const large = small === a ? b : a;
      for (const value of small) {
        if (large.has(value)) return true;
      }
      return false;
    }

    function relatedCommunityKeys(site) {
      if (Array.isArray(site?.related_community_keys) && site.related_community_keys.length) {
        return site.related_community_keys;
      }
      const text = normalizeComparisonText([
        site?.title,
        site?.summary,
        site?.introduction_content,
        site?.history_content,
        site?.ancestral_territory ? state.siteById.get(Number(site.ancestral_territory))?.title : ""
      ].join(" "));
      return ["shinnecock", "unkechaug", "montaukett", "setalcott", "setauket", "matinecock", "massapequa", "canarsie", "rockaway", "corchaug", "manhasset", "nissaquogue", "secatogue", "merrick"]
        .filter(key => text.includes(key));
    }

    function relatedSiteIndexEntry(site) {
      const tags = siteCategoryTags(site);
      return {
        site,
        tags,
        tagKeys: new Set(tags.map(tag => tag.key)),
        town: normalizeComparisonText(site?.town || ""),
        county: normalizeComparisonText(site?.county || ""),
        territory: String(site?.ancestral_territory || ""),
        moments: relatedMomentKeys(site),
        communities: relatedCommunityKeys(site),
        center: relatedSiteCenter(site)
      };
    }

    function relatedSiteIndex() {
      if (state.relatedSiteIndexCache) return state.relatedSiteIndexCache;
      state.relatedSiteIndexCache = (state.sites || [])
        .filter(site => site?.slug && site.slug !== "address-result")
        .map(relatedSiteIndexEntry);
      return state.relatedSiteIndexCache;
    }

    function clearRelatedSiteCaches() {
      state.relatedSitesCache.clear();
      state.relatedSiteIndexCache = null;
    }

    function connectedSitesFor(site, { limit = 12 } = {}) {
      if (!site?.slug) return [];
      const cacheKey = `${site.slug}|${limit}`;
      if (state.relatedSitesCache.has(cacheKey)) return state.relatedSitesCache.get(cacheKey);
      const index = relatedSiteIndex();
      const currentEntry = index.find(entry => entry.site.slug === site.slug) || relatedSiteIndexEntry(site);
      const currentTagKeys = currentEntry.tagKeys;
      const currentTown = currentEntry.town;
      const currentCounty = currentEntry.county;
      const currentTerritory = currentEntry.territory;
      const currentMoments = currentEntry.moments;
      const currentCommunities = new Set(currentEntry.communities);
      const currentCenter = currentEntry.center;
      const related = index
        .filter(entry => entry.site.slug !== site.slug)
        .map(entry => {
          const candidate = entry.site;
          const reasons = [];
          let score = 0;
          const sharedTags = entry.tags.filter(tag => currentTagKeys.has(tag.key));
          if (sharedTags.length) {
            score += sharedTags.length * 12;
            const placeName = sharedTags.find(tag => tag.key === "theme:algonquian-place-name");
            reasons.push(placeName ? "Shared place-name history" : "Same theme");
          }
          if (currentTown && entry.town && currentTown === entry.town) {
            score += 18;
            reasons.push("Same town");
          } else if (currentCounty && entry.county && currentCounty === entry.county) {
            score += 5;
            reasons.push("Same region");
          }
          if (currentTerritory && entry.territory === currentTerritory) {
            score += 10;
            reasons.push("Same community");
          }
          if (entry.communities.some(key => currentCommunities.has(key))) {
            score += 10;
            reasons.push("Same community");
          }
          if (setsIntersect(entry.moments, currentMoments)) {
            score += 14;
            reasons.push("Shared historic moment");
          }
          const miles = relatedSiteMiles(currentCenter, entry.center);
          if (Number.isFinite(miles) && miles <= 3) {
            score += 14;
            reasons.push("Nearby site");
          } else if (Number.isFinite(miles) && miles <= 8) {
            score += 7;
            reasons.push("Nearby site");
          }
          return { site: candidate, score, reason: reasons[0] || "", miles };
        })
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score || (a.miles ?? 9999) - (b.miles ?? 9999) || String(a.site.title || "").localeCompare(String(b.site.title || "")))
        .slice(0, limit);
      state.relatedSitesCache.set(cacheKey, related);
      return related;
    }

    function relatedSiteCardHtml(entry, index, { mobile = false, initialLimit = 6 } = {}) {
      const site = entry.site;
      const summary = publicCleanText(site.summary || site.address_label || "Mapped place").slice(0, 170);
      const distance = GEOMETRY_UTILS.distanceLabelMiles(entry.miles);
      const meta = [safeSiteSubtitle(site), distance].filter(Boolean).join(" - ");
      const attr = mobile ? `data-slug="${escapeHtml(site.slug)}"` : `data-site-slug="${escapeHtml(site.slug)}"`;
      return `
        <button class="content-card related-site-card${index >= initialLimit ? " related-site-extra" : ""}" type="button" ${attr} ${index >= initialLimit ? "hidden" : ""}>
          <span class="content-card-body">
            <span class="related-site-reason">${escapeHtml(entry.reason || "Connected site")}</span>
            <strong>${escapeHtml(site.title)}</strong>
            ${meta ? `<span class="content-card-meta">${escapeHtml(meta)}</span>` : ""}
            ${summary ? `<span class="content-card-summary">${escapeHtml(summary)}</span>` : ""}
          </span>
        </button>
      `;
    }

    function relatedSitesSection(site, options = {}) {
      const related = connectedSitesFor(site, { limit: options.limit || 12 });
      if (!related.length) return "";
      const initialLimit = options.initialLimit || 6;
      return `
        <section class="section related-sites-section">
          <h3>Sites connected to this place</h3>
          <div class="related-sites-list">
            ${related.map((entry, index) => relatedSiteCardHtml(entry, index, { ...options, initialLimit })).join("")}
          </div>
          ${related.length > initialLimit ? `<button class="button secondary related-sites-more" type="button" data-related-sites-more>View more</button>` : ""}
        </section>
      `;
    }

    function biographyPathData(article) {
      if (!article?.slug || !BIOGRAPHY_WIKI_SLUGS.has(article.slug)) return null;
      const path = BIOGRAPHY_PLACE_PATHS[article.slug];
      if (!path?.places?.length) return null;
      const places = path.places
        .filter(place => Array.isArray(place.coordinates) && isLongIslandOrRegionalCoordinate(place.coordinates[0], place.coordinates[1]));
      if (places.length < 2) return null;
      const routePlaces = (path.routePlaces || [])
        .filter(place => Array.isArray(place.coordinates) && isLongIslandOrRegionalCoordinate(place.coordinates[0], place.coordinates[1]));
      return { ...path, routePlaces: routePlaces.length >= 2 ? routePlaces : undefined, places };
    }

    function biographyPathPersonName(article, fallbackSlug = "") {
      const title = stripHtml(article?.title || "").trim();
      if (title) return title;
      const pathTitle = stripHtml(BIOGRAPHY_PLACE_PATHS[fallbackSlug]?.title || "").replace(/\s+(associated\s+places|life\s+timeline|timeline|path|places).*$/i, "").trim();
      if (pathTitle) return pathTitle;
      return String(fallbackSlug || "Biography").split("-").filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
    }

    function biographyPersonMapLabel(article, slug = "") {
      const explicit = stripHtml(BIOGRAPHY_PLACE_PATHS[slug]?.mapLabel || "").trim();
      if (explicit) return explicit;
      return biographyPathPersonName(article, slug);
    }

    function biographyPersonQuoteFor(slug = "") {
      const quote = BIOGRAPHY_PERSON_QUOTES[String(slug || "")];
      if (!quote?.text) return null;
      const text = publicCleanText(quote.text)
        .replace(/\s+\((Hello\.[^)]+ is my name)\)$/i, "\n($1)");
      return {
        text,
        date: publicCleanText(quote.date || ""),
        source: publicCleanText(quote.source || ""),
        url: String(quote.url || "").trim()
      };
    }

    function biographyPersonQuoteLabel(quote, speaker = "") {
      if (!quote?.text) return "";
      const attribution = publicCleanText(speaker || "");
      return `"${quote.text}"${attribution ? `\n- ${attribution}` : ""}${quote.date ? `\n${quote.date}` : ""}`;
    }

    function biographyPersonTypedQuoteLabel(typedText, quoteDate, fullText, speaker = "") {
      const text = String(typedText || "");
      if (!text) return "";
      const date = String(quoteDate || "");
      const attribution = publicCleanText(speaker || "");
      const complete = text.length >= String(fullText || "").length;
      return `"${text}"${complete && attribution ? `\n- ${attribution}` : ""}${complete && date ? `\n${date}` : ""}`;
    }

    function biographyPersonStopDateMatch(value) {
      const text = publicCleanText(value || "");
      if (!text) return "";
      const patterns = [
        /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{3,4}\b/i,
        /\b(?:c\.|ca\.|circa)\s*\d{3,4}s?(?:\s*[-�/]\s*\d{2,4}s?)?\b/i,
        /\b(?:late|early|mid)\s+\d{3,4}s?(?:\s*[-�/]\s*(?:early|late|mid)?\s*\d{3,4}s?)?\b/i,
        /\b(?:spring|summer|fall|autumn|winter)\s+\d{3,4}\b/i,
        /\b\d{3,4}s?(?:\s*[-�/]\s*(?:early|late|mid)?\s*\d{2,4}s?)?\b/i
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[0]) return match[0].replace(/\s+/g, " ").trim();
      }
      return "";
    }

    function biographyPersonDestinationCandidate(value) {
      return publicCleanText(value || "")
        .replace(/^\s*(?:(?:c\.|ca\.|circa)\s*)?(?:(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{3,4}|(?:late|early|mid)\s+\d{3,4}s?(?:\s*[-�/]\s*(?:early|late|mid)?\s*\d{3,4}s?)?|(?:spring|summer|fall|autumn|winter)\s+\d{3,4}|\d{3,4}s?(?:\s*[-�/]\s*(?:early|late|mid)?\s*\d{2,4}s?)?)\s*(?:record)?\s*[-��]\s*/i, "")
        .replace(/[;:].*?\b(exact|approx|uncertain|unknown|source|record)\b.*$/ig, "")
        .replace(/\b(?:record|deed|conference|house site|path)?\s*context\b/ig, "")
        .replace(/\b(?:colonial|court|deed|land|source)?\s*records?\b/ig, "")
        .replace(/\bsource\s+trail\b/ig, "")
        .replace(/\s+(?:and|,)\s*$/i, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function biographyPersonInternalDestinationLabel(value) {
      const text = publicCleanText(value || "");
      return /\bcontext\b|source\s+trail|^land deed$|^church history$|^powwow history$|\b(named|reports?|reported|recognized|dies|death|grants?|gives?|court|testif|testimony|captured|signs?|signed|record|records|agreement)\b/i.test(text);
    }

    function biographyPersonPlaceLabel(place) {
      const label = biographyPersonDestinationCandidate(place?.label);
      const placeName = biographyPersonDestinationCandidate(place?.place);
      const title = biographyPersonDestinationCandidate(place?.title);
      const candidates = biographyPersonInternalDestinationLabel(place?.label)
        ? [placeName, label, title]
        : [label, placeName, title];
      return candidates.find(Boolean) || "";
    }

    function biographyPersonDestinationLabel(place) {
      const label = biographyPersonPlaceLabel(place);
      if (!label) return "";
      return label.length > 34 ? `${label.slice(0, 31).replace(/\s+\S*$/, "").trim()}...` : label;
    }

    function biographyPersonContextEraLabel(context = {}) {
      const explicitPath = BIOGRAPHY_PLACE_PATHS[context.slug] || {};
      const text = publicCleanText([
        context.slug,
        context.person,
        context.mapLabel,
        context.path?.title,
        context.path?.note,
        context.article?.title,
        context.article?.summary,
        context.article?.excerpt,
        context.article?.content,
        BIOGRAPHY_PERSON_HOVER_INTROS[context.slug],
        explicitPath.title,
        explicitPath.note,
        ...(explicitPath.places || []).flatMap(item => [item.label, item.reason, item.place, item.title])
      ].filter(Boolean).join(" ")).toLowerCase();
      if (!text) return "";
      if (/jeremy-dennis|creator of on this site|contemporary fine art photographer/.test(text)) return "contemporary";
      if (/twentieth|20th century|1900s|19\d{2}|voting rights|human rights|civil rights|oral history|shoemaker|powwow|hofstra|long island studies|john a strong|william wallace tooker|lois|nowedonah|haile|thunder bird|cromwell/.test(text)) return "ca. 1900s";
      if (/nineteenth|19th century|1800s|18\d{2}|civil war|whal(?:e|er|ing)|talkhouse|pharoah|cuffee|aunt becky|sylvester|jeremiah/.test(text)) return "ca. 1800s";
      if (/eighteenth|18th century|1700s|17\d{2}|great awakening|samson occom|occom|minister|preach|mission|ordination|nantucket/.test(text)) return "ca. 1700s";
      if (/seventeenth|17th century|1600s|16\d{2}|colonial|deed|purchase|patent|treaty|agreement|boundary|sachem|sagamore|sunksquaw|sunskquaw|headman|signer|signatures|commissioners|pequot|dutch|montaukett leader|cattle keeper|wobetom|wyandanch|cockenoe|tackapousha|warawakmy|mahue|mandush|mocomanto|ninigret|momoweta|paucamp|mangwobe|penhawitz|raseokan|wuchikittawbut|quashawam/.test(text)) return "ca. 1600s";
      return "";
    }

    function biographyPersonStopEraLabel(place = {}, context = {}) {
      const contextEra = biographyPersonContextEraLabel(context);
      const text = publicCleanText([
        place.label,
        place.reason,
        place.place,
        place.title,
        context.slug,
        context.person,
        context.mapLabel
      ].filter(Boolean).join(" ")).toLowerCase();
      if (!text) return contextEra || "ca. 1600s";
      if (/twentieth|20th century|1900s|19\d{2}|2000|201\d|202\d|voting rights|human rights|civil rights|cultural center|museum|fundraiser|oral history|shoemaker|powwow|published on this site|map entry/.test(text)) {
        if (/2000|201\d|202\d|published on this site|map entry/.test(text) && contextEra && contextEra !== "contemporary") return contextEra;
        return /2000|201\d|202\d|published on this site|map entry/.test(text) ? "contemporary" : "ca. 1900s";
      }
      if (/nineteenth|1800s|18\d{2}|civil war|whaling voyage|tribal-rights|lords of the soil|marriage/.test(text)) return "ca. 1800s";
      if (/eighteenth|1700s|17\d{2}|great awakening|minister|preach|mission|ordination|nantucket/.test(text)) return "ca. 1700s";
      if (/seventeenth|1600s|16\d{2}|colonial|deed|purchase|patent|treaty|agreement|boundary|sachem|sagamore|sunksquaw|sunskquaw|headman|signer|signatures|commissioners|pequot|dutch/.test(text)) return "ca. 1600s";
      return contextEra || "ca. 1600s";
    }

    function biographyPersonStopDateLabel(place = {}, context = {}) {
      const fields = [
        place.date_label,
        place.dateLabel,
        place.date,
        place.year,
        place.start_year,
        place.startYear,
        place.label,
        place.reason,
        place.place,
        place.title
      ].map(value => publicCleanText(value || "")).filter(Boolean);
      const value = fields.map(biographyPersonStopDateMatch).find(Boolean) || biographyPersonStopEraLabel(place, context);
      return value.length > 24 ? `${value.slice(0, 21).trim()}...` : value;
    }

    function biographyPersonTravelTask(action = "") {
      const task = publicCleanText(action)
        .replace(/^to\s+/i, "")
        .replace(/^for\s+/i, "")
        .replace(/\ba\s+deed\b/i, "deed")
        .replace(/\bthe\s+/ig, "")
        .replace(/\s+/g, " ")
        .trim();
      return task.length > 24 ? `${task.slice(0, 21).replace(/\s+\S*$/, "").trim()}...` : task;
    }

    function biographyPersonTravelStatus(nextPlace, context = {}) {
      const nextLabel = biographyPersonDestinationLabel(nextPlace);
      if (!nextLabel) return "";
      const date = biographyPersonStopDateLabel(nextPlace, context);
      const task = biographyPersonTravelTask(biographyPathActionText(nextPlace));
      const status = `${date} - ${nextLabel}${task ? `: ${task}` : ""}`;
      return status.length > 58 ? `${status.slice(0, 55).replace(/\s+\S*$/, "").trim()}...` : status;
    }

    function biographyPersonMapLabelWithStatus(mapLabel, travelStatus) {
      const label = publicCleanText(mapLabel || "").trim();
      return travelStatus ? `${label}\n${travelStatus}` : label;
    }

    function biographyPersonLeafletLabelHtml(feature) {
      const label = feature?.properties?.map_label || feature?.properties?.title || "";
      const status = feature?.properties?.travel_status || "";
      return `
        <span class="biography-person-label-name">${escapeHtml(label)}</span>
        ${status ? `<span class="biography-person-label-status">${escapeHtml(status)}</span>` : ""}
      `;
    }

    function biographyPersonLeafletQuoteHtml(feature) {
      const props = feature?.properties || {};
      const text = props.quote_typed_text || "";
      if (!String(text).trim()) return "";
      const fullText = props.quote_text || "";
      const complete = String(text).length >= String(fullText).length;
      const quoteTitle = [props.quote_source, props.quote_url].filter(Boolean).join(" - ");
      const speaker = props.quote_speaker || props.map_label || props.title || "";
      return `
        <span class="biography-speech-bubble ${complete ? "is-complete" : "is-typing"}"${quoteTitle ? ` title="${escapeHtml(quoteTitle)}"` : ""}>
          <span class="biography-speech-quote">${escapeHtml(`"${text}"`)}</span>
          ${complete && speaker ? `<span class="biography-speech-speaker">- ${escapeHtml(speaker)}</span>` : ""}
          ${complete && props.quote_date ? `<span class="biography-speech-date">${escapeHtml(props.quote_date)}</span>` : ""}
        </span>
      `;
    }

    function biographyPathWordCount(value) {
      return String(value || "").trim().split(/\s+/).filter(Boolean).length;
    }

    function biographyPathCompactWords(value, maxWords = 3) {
      return stripHtml(value || "")
        .replace(/\([^)]*\)/g, " ")
        .replace(/["'`]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, maxWords)
        .join(" ");
    }

    function biographyPathCompactPersonName(person) {
      const cleaned = stripHtml(person || "")
        .replace(/\([^)]*\)/g, " ")
        .replace(/["'`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const lead = cleaned.split(/[,;:]/)[0].trim();
      const words = lead.split(/\s+/).filter(Boolean);
      if (words.length <= 2) return lead || "This person";
      const skipped = new Set(["chief", "princess", "rev", "reverend", "sachem", "of", "the"]);
      const usable = words.filter(word => !skipped.has(word.toLowerCase()));
      if (usable.length >= 2) return `${usable[0]} ${usable[usable.length - 1]}`;
      return words.slice(0, 2).join(" ");
    }

    function biographyPathCompactPlace(place = {}) {
      const candidates = [place.place, place.label].filter(Boolean);
      for (const candidate of candidates) {
        let text = stripHtml(candidate)
          .replace(/^\s*\d{3,4}\s*[-��]\s*/g, "")
          .replace(/\([^)]*\)/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (text.includes(" - ")) text = text.split(" - ").pop().trim();
        text = text.split(/[,;/]/)[0].replace(/\b(area|region|context)\b/ig, "").replace(/\s+/g, " ").trim();
        const compact = biographyPathCompactWords(text, 3);
        if (compact) return compact;
      }
      return "this place";
    }

    function biographyPathActionText(place = {}) {
      const text = `${place.label || ""} ${place.place || ""} ${place.reason || ""}`.toLowerCase();
      if (/voting rights|human rights|civil rights/.test(text)) return "to advocate for rights";
      if (/oral history|interview|recorded her|recorded his|shoemaker/.test(text)) return "to share oral history";
      if (/fundraiser|cultural center|museum|education program|storytelling/.test(text)) return "to support cultural work";
      if (/teach|teacher|school|training|college/.test(text)) return "to teach";
      if (/testif|testimony|court|commission/.test(text)) return "to give testimony";
      if (/powwow|address|voice|speak|speech/.test(text)) return "to speak";
      if (/sign(?:ed|er|ature|atures)?|marked with an x|among the signatures/.test(text)) return "to sign a deed";
      if (/sold|sale|sell|grant|purchase|patent|convey|deed|treaty|agreement/.test(text)) return "to negotiate land";
      if (/boundary|boundaries|place knowledge|headwaters|names land|place-name|placename/.test(text)) return "to preserve place knowledge";
      if (/negot|alliance|diplomac|sachem|leader|envoy|commissioners|seeking peace|protection/.test(text)) return "to negotiate";
      if (/civil war/.test(text)) return "to serve in the Civil War";
      if (/pequot war|pequot/.test(text)) return "to respond to the Pequot War";
      if (/\bwar\b|conflict|captured|ransom|raid/.test(text)) return "to respond to conflict";
      if (/whal|shore-whaling|mariner|sail|voyage/.test(text)) return "to work at sea";
      if (/minister|preach|mission/.test(text)) return "to preach";
      if (/advocacy|advocate|claim|recognition|reclaim|land-rights|rights/.test(text)) return "to advocate";
      if (/marriage|married/.test(text)) return "to marry";
      if (/born|birth|birthplace/.test(text)) return "to mark a birthplace";
      if (/return|returned/.test(text)) return "to return home";
      if (/homeland|home/.test(text)) return "to return home";
      if (/funeral|remembrance|community|tribute|died|death/.test(text)) return "to be remembered";
      if (/named|identified|appears|record|source|document|colonial/.test(text)) return "to document Native presence";
      return "to continue the story";
    }

    function biographyPathActionLabel(person, place = {}) {
      const who = biographyPathCompactPersonName(person);
      const where = biographyPathCompactPlace(place);
      const action = biographyPathActionText(place);
      let label = `${who} visits ${where} ${action}`.replace(/\s+/g, " ").trim();
      if (biographyPathWordCount(label) <= 10) return label;
      label = `${who} visits ${biographyPathCompactWords(where, 2)} ${action}`.replace(/\s+/g, " ").trim();
      if (biographyPathWordCount(label) <= 10) return label;
      return `${who} visits ${biographyPathCompactWords(where, 2)}`.replace(/\s+/g, " ").trim();
    }

    function biographyPathTimelineLabel(place = {}) {
      const title = stripHtml(place.title || place.label || place.place || "Mapped place")
        .replace(/\s+/g, " ")
        .trim();
      const date = stripHtml(place.dateLabel || place.date_label || "")
        .replace(/\s+/g, " ")
        .trim();
      if (!date || new RegExp(`^${escapeRegExp(date)}\\b`, "i").test(title) || title.toLowerCase().includes(date.toLowerCase())) {
        return title;
      }
      return `${date} - ${title}`;
    }

    function biographyPathMapPinLabel(place = {}, order = 1) {
      return `${order} - ${biographyPathTimelineLabel(place)}`.replace(/\s+/g, " ").trim();
    }

    function biographyPathCompactTimelineLabel(place = {}) {
      const title = stripHtml(place.title || place.label || place.place || "Mapped place")
        .replace(/\s+/g, " ")
        .trim();
      const date = stripHtml(place.dateLabel || place.date_label || "")
        .replace(/\s+/g, " ")
        .trim();
      const compactTitle = biographyPathCompactWords(title, 5);
      if (!date || title.toLowerCase().includes(date.toLowerCase())) return compactTitle;
      return `${date} - ${compactTitle}`.replace(/\s+/g, " ").trim();
    }

    function biographyPathCompactMapPinLabel(place = {}, order = 1) {
      return `${order} - ${biographyPathCompactTimelineLabel(place)}`.replace(/\s+/g, " ").trim();
    }

    function biographyPathLabelCoordinates(places = [], index = 0) {
      const place = places[index] || {};
      const coordinates = Array.isArray(place.coordinates) ? place.coordinates : null;
      if (!coordinates?.every(Number.isFinite)) return coordinates;
      const closeIndexes = places
        .map((candidate, candidateIndex) => {
          const coords = Array.isArray(candidate?.coordinates) ? candidate.coordinates : null;
          if (!coords?.every(Number.isFinite)) return null;
          const lngDelta = Math.abs(coords[0] - coordinates[0]);
          const latDelta = Math.abs(coords[1] - coordinates[1]);
          return lngDelta <= 0.16 && latDelta <= 0.07 ? candidateIndex : null;
        })
        .filter(Number.isFinite);
      if (closeIndexes.length <= 1) return coordinates;
      const localIndex = Math.max(0, closeIndexes.indexOf(index));
      const lane = localIndex - ((closeIndexes.length - 1) / 2);
      const radiusLat = Math.max(0.0135, Math.min(0.024, 0.09 / Math.max(2, closeIndexes.length)));
      const radiusLng = (localIndex % 2 === 0 ? -0.006 : 0.006) * (Math.floor(localIndex / 2) + 1);
      return [
        Number((coordinates[0] + radiusLng).toFixed(6)),
        Number((coordinates[1] + lane * radiusLat).toFixed(6))
      ];
    }

    function allBiographyPathFeatureCollection({ enabled = false } = {}) {
      if (!enabled) return { type: "FeatureCollection", features: [] };
      const features = [];
      for (const slug of Object.keys(BIOGRAPHY_PLACE_PATHS)) {
        const article = state.wikiBySlug.get(slug) || { slug, title: BIOGRAPHY_PLACE_PATHS[slug]?.title || "" };
        const path = biographyTimelineData(article, timelineEventsFor("wiki", article.id, slug)) || biographyPathData(article);
        if (path?.hidePath) continue;
        if (!path?.places?.length) continue;
        const person = biographyPathPersonName(article, slug);
        features.push({
          type: "Feature",
          geometry: biographyPersonRouteLineGeometry(path),
          properties: {
            kind: "path",
            person,
            wiki_slug: slug,
            title: `${person} biography path`
          }
        });
        path.places.forEach((place, index) => {
          const order = index + 1;
          const pathLabel = biographyPathTimelineLabel(place);
          const numberedPathLabel = biographyPathMapPinLabel(place, order);
          const compactPathLabel = biographyPathCompactMapPinLabel(place, order);
          const labelCoordinates = biographyPathLabelCoordinates(path.places, index);
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: place.coordinates },
            properties: {
              kind: "point",
              person,
              wiki_slug: slug,
              order,
              label: String(order),
              pin_label: numberedPathLabel,
              compact_pin_label: compactPathLabel,
              title: pathLabel,
              place: place.place || "",
              reason: place.reason || "",
              event_id: place.event_id || place.eventId || ""
            }
          });
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: labelCoordinates || place.coordinates },
            properties: {
              kind: "label",
              person,
              wiki_slug: slug,
              order,
              label: String(order),
              pin_label: numberedPathLabel,
              compact_pin_label: compactPathLabel,
              title: pathLabel,
              place: place.place || "",
              reason: place.reason || "",
              event_id: place.event_id || place.eventId || ""
            }
          });
        });
      }
      return { type: "FeatureCollection", features };
    }

    function biographyPersonKnownSlugs() {
      const slugs = new Set(Object.keys(BIOGRAPHY_PLACE_PATHS));
      for (const slug of BIOGRAPHY_WIKI_SLUGS || []) slugs.add(slug);
      return [...slugs].filter(Boolean).sort();
    }

    function cleanBiographyPersonPlaces(places = []) {
      const seen = new Set();
      return places
        .map(place => {
          const coords = Array.isArray(place?.coordinates) ? place.coordinates.map(Number) : null;
          if (!coords || !isLongIslandOrRegionalCoordinate(coords[0], coords[1])) return null;
          const key = `${coords[0].toFixed(5)},${coords[1].toFixed(5)}`;
          if (seen.has(key)) return null;
          seen.add(key);
          return { ...place, coordinates: coords };
        })
        .filter(Boolean);
    }

    function biographyPersonEventPlaces(events = []) {
      return events
        .map(event => {
          const coordinates = timelineEventCoordinates(event);
          if (!coordinates) return null;
          return {
            coordinates,
            label: timelineTitle(event),
            place: timelineLocationLabel(event),
            reason: stripHtml(timelineDisplayDescription(event)),
            event_id: event.id || event.event_id || ""
          };
        })
        .filter(Boolean);
    }

    function biographyPersonSiteRoutePlaces(slug) {
      const stops = (state.sites || [])
        .filter(site => site?.publication_status !== "draft" && site?.title && site?.slug)
        .map(site => {
          const geometry = siteDisplayGeometry(site);
          const coordinates = siteCenter(geometry);
          if (!coordinates || !isLongIslandOrRegionalCoordinate(coordinates[0], coordinates[1])) return null;
          return {
            label: site.title,
            place: site.address_label || site.title,
            coordinates,
            reason: `${site.title} is a published On This Site map entry.`,
            site_slug: site.slug,
            site_id: site.id || ""
          };
        })
        .filter(Boolean);
      const unique = SHARED_UTILS.uniqueBy(stops, stop => `${stop.site_slug}:${Number(stop.coordinates[0]).toFixed(5)},${Number(stop.coordinates[1]).toFixed(5)}`);
      unique.sort((a, b) => {
        const aHash = Math.abs(biographyPersonHash(`${slug}:${a.site_slug || a.label}`));
        const bHash = Math.abs(biographyPersonHash(`${slug}:${b.site_slug || b.label}`));
        return aHash - bHash;
      });
      if (slug !== JEREMY_BIOGRAPHY_SLUG) return unique;
      const startStop = unique.find(isJeremyBiographyStartStop)
        || cleanBiographyPersonPlaces(BIOGRAPHY_PLACE_PATHS[JEREMY_BIOGRAPHY_SLUG]?.places || [])[0];
      if (!startStop) return unique;
      const startKey = biographyPersonRouteStopKey(startStop);
      const rest = unique.filter(stop => biographyPersonRouteStopKey(stop) !== startKey);
      return [startStop, ...jeremyBiographyRouteBatch(rest)];
    }

    function jeremyBiographyRouteBatch(stops = []) {
      if (stops.length <= JEREMY_BIOGRAPHY_ROUTE_BATCH_SIZE) return stops;
      const batchCount = Math.max(1, Math.ceil(stops.length / JEREMY_BIOGRAPHY_ROUTE_BATCH_SIZE));
      const batchIndex = Math.abs(biographyPersonHash(`jeremy-route:${jeremyBiographyRouteBatchKey()}`)) % batchCount;
      const start = batchIndex * JEREMY_BIOGRAPHY_ROUTE_BATCH_SIZE;
      const batch = stops.slice(start, start + JEREMY_BIOGRAPHY_ROUTE_BATCH_SIZE);
      if (batch.length >= JEREMY_BIOGRAPHY_ROUTE_BATCH_SIZE || !start) return batch;
      return [...batch, ...stops.slice(0, JEREMY_BIOGRAPHY_ROUTE_BATCH_SIZE - batch.length)];
    }

    function jeremyBiographyRouteBatchKey() {
      return Math.floor(Date.now() / JEREMY_BIOGRAPHY_ROUTE_BATCH_MS);
    }

    function biographyPersonRouteStopKey(stop) {
      const slug = String(stop?.site_slug || "").trim().toLowerCase();
      if (slug) return `site:${slug}`;
      const coordinates = Array.isArray(stop?.coordinates) ? stop.coordinates : [];
      return `coord:${Number(coordinates[0]).toFixed(5)},${Number(coordinates[1]).toFixed(5)}`;
    }

    function isJeremyBiographyStartStop(stop) {
      const text = normalizeComparisonText([stop?.label, stop?.place, stop?.site_slug].filter(Boolean).join(" "));
      return /\b(ma s house|mas house|bipoc art studio)\b/i.test(text);
    }

    function biographyPersonCoordinateIsLand(coordinates) {
      if (!Array.isArray(coordinates)) return true;
      if (state.landMaskData?.geometry) return pointInGeometry(coordinates, state.landMaskData.geometry);
      if (biographyPersonCoordinateIsMappedWater(coordinates)) return false;
      if (biographyPersonCoordinateIsMappedLand(coordinates)) return true;
      if (biographyPersonCoordinateIsShallowWater(coordinates)) return false;
      return true;
    }

    function biographyPersonSegmentCrossesWater(start, end, samples = 10) {
      if (!Array.isArray(start) || !Array.isArray(end)) return false;
      for (let index = 0; index <= samples; index += 1) {
        const t = index / samples;
        const point = [
          start[0] + ((end[0] - start[0]) * t),
          start[1] + ((end[1] - start[1]) * t)
        ];
        if (!biographyPersonCoordinateIsLand(point)) return true;
      }
      return false;
    }

    function biographyPersonCoordinateDistance(a, b) {
      return Math.hypot((a?.[0] || 0) - (b?.[0] || 0), (a?.[1] || 0) - (b?.[1] || 0));
    }

    function jeremyBiographyDirectRoutePlaces(places = []) {
      return cleanBiographyPersonPlaces(places);
    }

    function biographyPersonPathCacheKey() {
      return [
        state.wikiBySlug?.size || 0,
        state.sites?.length || 0,
        state.timelineEvents?.length || 0,
        Object.keys(BIOGRAPHY_PLACE_PATHS).length,
        "direct-route",
        `jeremy-batch:${jeremyBiographyRouteBatchKey()}`
      ].join("|");
    }

    function biographyPersonPathData(slug) {
      const cacheKey = biographyPersonPathCacheKey();
      if (state.biographyPersonPathCacheKey !== cacheKey) {
        state.biographyPersonPathCacheKey = cacheKey;
        state.biographyPersonPathCache.clear();
        state.biographyPersonMotionTimelineCache.clear();
      }
      if (state.biographyPersonPathCache.has(slug)) return state.biographyPersonPathCache.get(slug);
      const article = state.wikiBySlug.get(slug) || { slug, title: BIOGRAPHY_PLACE_PATHS[slug]?.title || "" };
      const events = timelineEventsFor("wiki", article.id, slug);
      const timelinePath = biographyTimelineData(article, events);
      const explicitPlaces = cleanBiographyPersonPlaces(BIOGRAPHY_PLACE_PATHS[slug]?.places || []);
      const eventPlaces = cleanBiographyPersonPlaces(biographyPersonEventPlaces(events));
      const siteRoutePlaces = BIOGRAPHY_PLACE_PATHS[slug]?.routeSource === "all-sites" ? cleanBiographyPersonPlaces(biographyPersonSiteRoutePlaces(slug)) : [];
      const places = cleanBiographyPersonPlaces(siteRoutePlaces.length ? siteRoutePlaces : (timelinePath?.places?.length ? timelinePath.places : (explicitPlaces.length ? explicitPlaces : eventPlaces)));
      const explicitRoutePlaces = cleanBiographyPersonPlaces(BIOGRAPHY_PLACE_PATHS[slug]?.routePlaces || []);
      const baseRoutePlaces = explicitRoutePlaces.length >= 2 ? explicitRoutePlaces : places;
      const routePlaces = slug === JEREMY_BIOGRAPHY_SLUG ? jeremyBiographyDirectRoutePlaces(baseRoutePlaces) : baseRoutePlaces;
      if (!places.length) {
        state.biographyPersonPathCache.set(slug, null);
        return null;
      }
      const path = {
        ...(BIOGRAPHY_PLACE_PATHS[slug] || {}),
        ...(timelinePath || {}),
        article,
        slug,
        routeDistance: biographyPersonRouteDistance(routePlaces),
        routePlaces,
        places
      };
      state.biographyPersonPathCache.set(slug, path);
      return path;
    }

    function biographyPersonHash(text) {
      let hash = 0;
      const value = String(text || "");
      for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
      }
      return hash;
    }

    function biographyPersonStableRandomInt(text, span) {
      let hash = 2166136261;
      const value = String(text || "");
      for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      hash += hash << 13;
      hash ^= hash >>> 7;
      hash += hash << 3;
      hash ^= hash >>> 17;
      hash += hash << 5;
      return (hash >>> 0) % Math.max(1, span);
    }

    function biographyPersonStopDwellMs(slug, index, options = {}) {
      const min = Math.max(0, numeric(options.stopMinMs, BIOGRAPHY_PERSON_MIN_STOP_MS));
      const max = Math.max(min, numeric(options.stopMaxMs, BIOGRAPHY_PERSON_MAX_STOP_MS));
      const span = Math.max(1, Math.round(max - min + 1));
      return min + biographyPersonStableRandomInt(`${slug || "person"}:${index}`, span);
    }

    function biographyPersonQuoteDurationMs(slug, cycle, visible) {
      const min = BIOGRAPHY_PERSON_QUOTE_VISIBLE_MIN_MS;
      const max = BIOGRAPHY_PERSON_QUOTE_VISIBLE_MAX_MS;
      const span = Math.max(1, Math.round(max - min + 1));
      return min + biographyPersonStableRandomInt(`${slug || "person"}:quote:${visible ? "show" : "hold"}:${cycle}`, span);
    }

    function biographyPersonQuoteAutoDelayMs(slug, cycle) {
      const min = BIOGRAPHY_PERSON_QUOTE_AUTO_MIN_DELAY_MS;
      const max = BIOGRAPHY_PERSON_QUOTE_AUTO_WINDOW_MS;
      const span = Math.max(1, Math.round(max - min + 1));
      return min + biographyPersonStableRandomInt(`${slug || "person"}:quote:auto:${cycle}`, span);
    }

    function biographyPersonQuoteVisibility(slug, now = performance.now()) {
      const schedule = slug ? state.biographyPersonQuoteSchedules.get(slug) : null;
      if (!schedule?.visible) return { visible: false, opacity: 0, cycle: schedule?.cycle || 0 };
      if (now >= schedule.nextAt) {
        schedule.visible = false;
        return { visible: false, opacity: 0, cycle: schedule.cycle || 0 };
      }
      const remaining = Math.max(0, schedule.nextAt - now);
      const fadeMs = 450;
      const fadeIn = Math.max(0, Math.min(1, (now - (schedule.startedAt || now)) / fadeMs));
      const fadeOut = Math.max(0, Math.min(1, Math.min(remaining / fadeMs, 1)));
      const opacity = Math.min(fadeIn, fadeOut);
      return { visible: true, opacity, cycle: schedule.cycle };
    }

    function biographyPersonLabelsVisible() {
      const zoom = state.leafletMap?.getZoom?.() ?? state.map?.getZoom?.() ?? 0;
      return Number(zoom) >= BIOGRAPHY_PERSON_LABEL_MIN_ZOOM;
    }

    function biographyPersonQuoteTypedText(slug, text, visible, cycle, now = performance.now()) {
      const clean = String(text || "");
      if (!clean) return "";
      const key = String(slug || "");
      let typeState = state.biographyPersonQuoteTypeStates.get(key);
      if (!visible) {
        if (typeState) typeState.visible = false;
        return "";
      }
      if (!typeState || typeState.cycle !== cycle || typeState.text !== clean || !typeState.visible) {
        typeState = { cycle, text: clean, startedAt: now, visible: true };
        state.biographyPersonQuoteTypeStates.set(key, typeState);
      }
      const elapsed = Math.max(0, now - typeState.startedAt);
      const chars = Math.max(1, Math.min(clean.length, Math.floor(elapsed / BIOGRAPHY_PERSON_QUOTE_TYPE_MS_PER_CHAR) + 1));
      return clean.slice(0, chars);
    }

    function biographyPersonScreenPoint(coordinates) {
      if (!Array.isArray(coordinates)) return null;
      if (state.leafletMap?.latLngToContainerPoint) {
        const point = state.leafletMap.latLngToContainerPoint([coordinates[1], coordinates[0]]);
        const x = Number(point?.x);
        const y = Number(point?.y);
        return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
      }
      if (state.map?.project) {
        const point = state.map.project(coordinates);
        const x = Number(point?.x);
        const y = Number(point?.y);
        return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
      }
      return null;
    }

    function biographyPersonActiveQuoteCount(now = performance.now()) {
      let count = 0;
      state.biographyPersonQuoteSchedules.forEach(schedule => {
        if (schedule?.visible && Number(schedule.nextAt) > now) count += 1;
      });
      return count;
    }

    function triggerBiographyPersonQuote(slug, now = performance.now()) {
      if (!slug) return false;
      const existing = state.biographyPersonQuoteSchedules.get(slug);
      if (existing?.visible && existing.nextAt > now) return true;
      if (biographyPersonActiveQuoteCount(now) >= BIOGRAPHY_PERSON_QUOTE_MAX_ACTIVE) return false;
      const cycle = Number(existing?.cycle || 0) + 1;
      const duration = biographyPersonQuoteDurationMs(slug, cycle, true);
      state.biographyPersonQuoteSchedules.set(slug, {
        visible: true,
        cycle,
        startedAt: now,
        nextAt: now + duration
      });
      const typeState = state.biographyPersonQuoteTypeStates.get(slug);
      if (typeState) typeState.visible = false;
      return true;
    }

    function scheduleBiographyPersonAutoQuote(slug, now = performance.now(), options = {}) {
      if (!slug) return null;
      const existing = state.biographyPersonQuoteAutoSchedules.get(slug);
      const cycle = Number(existing?.cycle || 0) + (options.advance ? 1 : 0);
      const delay = biographyPersonQuoteAutoDelayMs(slug, cycle);
      const nextAt = now + delay;
      const schedule = { cycle, nextAt };
      state.biographyPersonQuoteAutoSchedules.set(slug, schedule);
      return schedule;
    }

    function updateBiographyPersonAutoQuotes(entries = [], now = performance.now()) {
      if (!biographyPersonLabelsVisible()) {
        state.biographyPersonQuoteAutoSchedules.clear();
        state.biographyPersonQuoteLastAutoAt = 0;
        return;
      }
      const eligible = entries
        .filter(entry => entry?.quote?.text && Array.isArray(entry.coordinates) && numeric(entry.motionOpacity, 1) > 0.15)
        .map(entry => String(entry.slug || ""))
        .filter(Boolean);
      const visibleSlugs = new Set(eligible);
      for (const slug of Array.from(state.biographyPersonQuoteAutoSchedules.keys())) {
        if (!visibleSlugs.has(slug)) state.biographyPersonQuoteAutoSchedules.delete(slug);
      }
      for (const slug of eligible) {
        if (!state.biographyPersonQuoteAutoSchedules.has(slug)) scheduleBiographyPersonAutoQuote(slug, now);
      }
      if (now - Number(state.biographyPersonQuoteLastAutoAt || 0) < BIOGRAPHY_PERSON_QUOTE_AUTO_STAGGER_MS) return;
      const due = eligible
        .map(slug => ({ slug, schedule: state.biographyPersonQuoteAutoSchedules.get(slug) }))
        .filter(item => item.schedule && now >= Number(item.schedule.nextAt || 0))
        .sort((a, b) => Number(a.schedule.nextAt || 0) - Number(b.schedule.nextAt || 0));
      if (!due.length) return;
      const picked = due[0];
      const triggered = triggerBiographyPersonQuote(picked.slug, now);
      if (triggered) {
        state.biographyPersonQuoteLastAutoAt = now;
        scheduleBiographyPersonAutoQuote(picked.slug, now + BIOGRAPHY_PERSON_QUOTE_AUTO_WINDOW_MS, { advance: true });
      } else {
        const retryDelay = BIOGRAPHY_PERSON_QUOTE_AUTO_RETRY_MS + biographyPersonStableRandomInt(`${picked.slug}:quote:auto:retry:${Math.floor(now / 1000)}`, BIOGRAPHY_PERSON_QUOTE_AUTO_RETRY_MS);
        state.biographyPersonQuoteAutoSchedules.set(picked.slug, {
          cycle: Number(picked.schedule.cycle || 0),
          nextAt: now + retryDelay
        });
      }
    }

    function biographyPersonEncounterPairKey(a, b) {
      return [String(a || ""), String(b || "")].sort().join("|");
    }

    function biographyPersonQuoteActiveUntil(slug) {
      const schedule = slug ? state.biographyPersonQuoteSchedules.get(slug) : null;
      return schedule?.visible ? Number(schedule.nextAt || 0) : 0;
    }

    function biographyPersonEncounterNextSpeaker(a, b, previous, key, now) {
      if (previous?.lastTriggeredSlug === a.slug) return b;
      if (previous?.lastTriggeredSlug === b.slug) return a;
      return biographyPersonStableRandomInt(`${key}:${Math.floor(now / 1000)}`, 2) === 0 ? a : b;
    }

    function updateBiographyPersonQuoteEncounters(entries = [], now = performance.now()) {
      if (!biographyPersonLabelsVisible()) return;
      const quoteEntries = entries
        .filter(entry => entry?.quote?.text && Array.isArray(entry.coordinates) && numeric(entry.motionOpacity, 1) > 0.15)
        .map(entry => ({ ...entry, screenPoint: biographyPersonScreenPoint(entry.coordinates) }))
        .filter(entry => entry.screenPoint);
      const seenPairs = new Set();
      for (let i = 0; i < quoteEntries.length; i += 1) {
        for (let j = i + 1; j < quoteEntries.length; j += 1) {
          const a = quoteEntries[i];
          const b = quoteEntries[j];
          const dx = a.screenPoint.x - b.screenPoint.x;
          const dy = a.screenPoint.y - b.screenPoint.y;
          const near = Math.hypot(dx, dy) <= BIOGRAPHY_PERSON_QUOTE_ENCOUNTER_RADIUS_PX;
          const key = biographyPersonEncounterPairKey(a.slug, b.slug);
          seenPairs.add(key);
          const previous = state.biographyPersonQuoteEncounterPairs.get(key);
          if (!near) {
            state.biographyPersonQuoteEncounterPairs.set(key, {
              near: false,
              lastTriggeredAt: previous?.lastTriggeredAt || 0,
              lastTriggeredSlug: previous?.lastTriggeredSlug || ""
            });
            continue;
          }
          const nextSpeaker = biographyPersonEncounterNextSpeaker(a, b, previous, key, now);
          const lastTriggeredAt = Number(previous?.lastTriggeredAt || 0);
          const lastActiveUntil = biographyPersonQuoteActiveUntil(previous?.lastTriggeredSlug || "");
          const canTrigger = !previous?.near
            || (now >= lastActiveUntil + BIOGRAPHY_PERSON_QUOTE_ENCOUNTER_TURN_GAP_MS
              && now - lastTriggeredAt >= BIOGRAPHY_PERSON_QUOTE_ENCOUNTER_COOLDOWN_MS);
          if (canTrigger) {
            const triggered = triggerBiographyPersonQuote(nextSpeaker.slug, now);
            state.biographyPersonQuoteEncounterPairs.set(key, {
              near: true,
              lastTriggeredAt: now,
              lastTriggeredSlug: triggered ? nextSpeaker.slug : (previous?.lastTriggeredSlug || "")
            });
          } else {
            state.biographyPersonQuoteEncounterPairs.set(key, {
              near: true,
              lastTriggeredAt: lastTriggeredAt || now,
              lastTriggeredSlug: previous?.lastTriggeredSlug || ""
            });
          }
        }
      }
      if (state.biographyPersonQuoteEncounterPairs.size > 500) {
        for (const key of Array.from(state.biographyPersonQuoteEncounterPairs.keys())) {
          if (!seenPairs.has(key)) state.biographyPersonQuoteEncounterPairs.delete(key);
          if (state.biographyPersonQuoteEncounterPairs.size <= 380) break;
        }
      }
    }

    function biographyPersonRouteDistance(places = []) {
      return biographyPersonRouteSegments(places).reduce((total, segment) => total + segment.distance, 0);
    }

    function biographyPersonRouteSegments(places = []) {
      const segments = [];
      for (let index = 0; index < places.length - 1; index += 1) {
        const start = places[index]?.coordinates;
        const end = places[index + 1]?.coordinates;
        if (!start || !end) continue;
        if (places[index]?.skipToNext || places[index + 1]?.skipFromPrevious) continue;
        const distance = Math.hypot(end[0] - start[0], end[1] - start[1]);
        if (!distance) continue;
        segments.push({ start, end, distance });
      }
      return segments;
    }

    function biographyPersonRoutePlaces(path) {
      return (path?.routePlaces?.length >= 2 ? path.routePlaces : path?.places) || [];
    }

    function biographyPersonRouteLineGeometry(path) {
      const places = biographyPersonRoutePlaces(path);
      const lines = [];
      let current = [];
      places.forEach((place, index) => {
        const coords = place?.coordinates;
        if (!coords) return;
        const previous = places[index - 1];
        const breaksFromPrevious = index > 0 && (previous?.skipToNext || place?.skipFromPrevious);
        if (breaksFromPrevious) {
          if (current.length >= 2) lines.push(current);
          current = [coords];
        } else {
          current.push(coords);
        }
      });
      if (current.length >= 2) lines.push(current);
      if (lines.length > 1) return { type: "MultiLineString", coordinates: lines };
      return { type: "LineString", coordinates: lines[0] || places.map(place => place.coordinates).filter(Boolean) };
    }

    function biographyPersonRouteLeafletLineCoordinates(path) {
      const geometry = biographyPersonRouteLineGeometry(path);
      if (geometry.type === "MultiLineString") {
        return geometry.coordinates.map(line => line.map(([lng, lat]) => [lat, lng]));
      }
      return (geometry.coordinates || []).map(([lng, lat]) => [lat, lng]);
    }

    function biographyPersonCoordinateAt(places = [], progress = 0) {
      if (!places.length) return null;
      if (places.length === 1) return places[0].coordinates;
      const segments = biographyPersonRouteSegments(places);
      const total = segments.reduce((sum, segment) => sum + segment.distance, 0);
      if (!segments.length || !total) return places[0].coordinates;
      let target = Math.max(0, Math.min(1, progress)) * total;
      for (const segment of segments) {
        if (target > segment.distance) {
          target -= segment.distance;
          continue;
        }
        const t = segment.distance ? target / segment.distance : 0;
        return [
          segment.start[0] + ((segment.end[0] - segment.start[0]) * t),
          segment.start[1] + ((segment.end[1] - segment.start[1]) * t)
        ];
      }
      return segments[segments.length - 1].end;
    }

    function biographyPersonSegmentDuration(start, end) {
      const distance = Math.hypot((end?.[0] || 0) - (start?.[0] || 0), (end?.[1] || 0) - (start?.[1] || 0));
      if (!distance) return 0;
      return Math.max(1, (distance / BIOGRAPHY_PERSON_REFERENCE_ROUTE_DISTANCE) * BIOGRAPHY_PERSON_ROUTE_DURATION_MS);
    }

    function biographyPersonCoordinateIsWater(coordinates) {
      if (!Array.isArray(coordinates)) return false;
      const cacheKey = biographyPersonWaterCacheKey(coordinates);
      if (state.biographyWaterCoordinateCache.has(cacheKey)) return state.biographyWaterCoordinateCache.get(cacheKey);
      const result = biographyPersonCoordinateTouchesLand(coordinates) ? false
        : biographyPersonCoordinateIsMappedWater(coordinates) ? true
          : biographyPersonCoordinateIsShallowWater(coordinates) ? true
            : state.landMaskData?.geometry ? !pointInGeometry(coordinates, state.landMaskData.geometry)
              : false;
      if (state.biographyWaterCoordinateCache.size > 2500) state.biographyWaterCoordinateCache.clear();
      state.biographyWaterCoordinateCache.set(cacheKey, result);
      return result;
    }

    function biographyPersonWaterCacheKey(coordinates) {
      const landKey = state.landMaskData?.geometry ? "land" : "nol";
      return `${landKey}:${Number(coordinates?.[0] || 0).toFixed(5)},${Number(coordinates?.[1] || 0).toFixed(5)}`;
    }

    function biographyPersonLandMaskStateKey() {
      return state.landMaskData?.geometry ? "landmask-ready" : state.landMaskPromise ? "landmask-loading" : "landmask-missing";
    }
    function biographyPersonCoordinateTouchesLand(coordinates) {
      if (!Array.isArray(coordinates)) return false;
      const samples = biographyPersonLandSampleCoordinates(coordinates);
      return samples.some(sample =>
        (state.landMaskData?.geometry && pointInGeometry(sample, state.landMaskData.geometry)) ||
        biographyPersonCoordinateIsMappedLand(sample)
      );
    }

    function biographyPersonLandSampleCoordinates(coordinates) {
      const lng = Number(coordinates?.[0]);
      const lat = Number(coordinates?.[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return [];
      const radius = BIOGRAPHY_CANOE_LAND_SAMPLE_RADIUS_DEG;
      return [
        [lng, lat],
        [lng + radius, lat],
        [lng - radius, lat],
        [lng, lat + radius],
        [lng, lat - radius],
        [lng + radius, lat + radius],
        [lng + radius, lat - radius],
        [lng - radius, lat + radius],
        [lng - radius, lat - radius]
      ];
    }

    function biographyPersonSiteIsWaterGeometry(site) {
      const slug = normalizeComparisonText(site?.slug || "");
      const surface = normalizeComparisonText(site?.geometry_surface || "");
      return surface === "water" || BIOGRAPHY_CANOE_MAPPED_WATER_SLUGS.has(slug);
    }

    function biographyPersonCoordinateIsMappedWater(coordinates) {
      if (!Array.isArray(coordinates) || !state.sites?.length) return false;
      return biographyMappedGeometryCandidates("water").some(item =>
        pointInBounds(coordinates, item.bounds, 0.001) && pointInGeometry(coordinates, item.geometry)
      );
    }

    function biographyPersonCoordinateIsMappedLand(coordinates, options = {}) {
      if (!Array.isArray(coordinates)) return false;
      const includeNarrowLand = options.includeNarrowLand !== false;
      return (includeNarrowLand && biographyPersonCoordinateIsNarrowLand(coordinates)) || biographyMappedGeometryCandidates("land").some(item =>
        pointInBounds(coordinates, item.bounds, 0.001) && pointInGeometry(coordinates, item.geometry)
      );
    }

    function biographyPersonCoordinateIsNarrowLand(coordinates) {
      if (!Array.isArray(coordinates)) return false;
      return biographyNarrowLandCandidates().some(item =>
        pointInBounds(coordinates, item.bounds, 0.0006) && pointInGeometry(coordinates, item.geometry)
      );
    }

    function biographyPersonCoordinateIsShallowWater(coordinates) {
      if (!Array.isArray(coordinates)) return false;
      return biographyShallowWaterCandidates().some(item =>
        pointInBounds(coordinates, item.bounds, 0.001) && pointInGeometry(coordinates, item.geometry)
      );
    }

    function biographyShallowWaterCandidates() {
      if (state.biographyMappedGeometryCache.has("canoe-shallow-water")) {
        return state.biographyMappedGeometryCache.get("canoe-shallow-water");
      }
      const items = BIOGRAPHY_CANOE_SHALLOW_WATER_AREAS
        .map(item => {
          const geometry = item.geometry || null;
          const bounds = cachedGeometryBounds(geometry);
          return geometry && bounds ? { ...item, geometry, bounds } : null;
        })
        .filter(Boolean);
      state.biographyMappedGeometryCache.set("canoe-shallow-water", items);
      return items;
    }

    function biographyNarrowLandCandidates() {
      if (state.biographyMappedGeometryCache.has("canoe-narrow-land")) {
        return state.biographyMappedGeometryCache.get("canoe-narrow-land");
      }
      const items = BIOGRAPHY_CANOE_NARROW_LAND_AREAS
        .map(item => {
          const geometry = item.geometry || null;
          const bounds = cachedGeometryBounds(geometry);
          return geometry && bounds ? { ...item, geometry, bounds } : null;
        })
        .filter(Boolean);
      state.biographyMappedGeometryCache.set("canoe-narrow-land", items);
      return items;
    }

    function biographyMappedGeometryCandidates(kind) {
      const cacheKey = `${kind}:${state.sites?.length || 0}:${state.landMaskData?.geometry ? "land" : "nol"}`;
      if (state.biographyMappedGeometryCache.has(cacheKey)) return state.biographyMappedGeometryCache.get(cacheKey);
      const items = [];
      for (const site of state.sites || []) {
        const isWater = biographyPersonSiteIsWaterGeometry(site);
        if (kind === "water" && !isWater) continue;
        if (kind === "land") {
          if (isWater) continue;
          const siteType = normalizeComparisonText(site?.site_type || "");
          if (/territory|reservation/.test(siteType)) continue;
        }
        const geometry = siteDisplayGeometry(site);
        if (!/Polygon/.test(geometry?.type || "")) continue;
        const bounds = cachedGeometryBounds(geometry);
        if (!bounds) continue;
        const area = Math.abs(bounds[1][0] - bounds[0][0]) * Math.abs(bounds[1][1] - bounds[0][1]);
        if (kind === "land" && area > 0.02) continue;
        items.push({ geometry, bounds });
      }
      state.biographyMappedGeometryCache.set(cacheKey, items);
      return items;
    }

    function pointInBounds(point, bounds, padding = 0) {
      const lng = Number(point?.[0]);
      const lat = Number(point?.[1]);
      return Number.isFinite(lng) && Number.isFinite(lat) && bounds &&
        lng >= bounds[0][0] - padding &&
        lng <= bounds[1][0] + padding &&
        lat >= bounds[0][1] - padding &&
        lat <= bounds[1][1] + padding;
    }

    function biographyPersonIsOverWater(coordinates, motion = {}) {
      if (motion?.phase !== "moving") return false;
      return biographyPersonCoordinateIsWater(coordinates);
    }

    function biographyPersonNextStopPlace(places = [], startIndex = 0, fallbackIndex = 0) {
      for (let index = startIndex; index < places.length; index += 1) {
        if (!places[index]?.passThrough) return places[index];
      }
      return places[fallbackIndex] || places.find(place => !place?.passThrough) || null;
    }

    function biographyPersonMotionTimeline(slug, places = [], path = {}) {
      const validPlaces = places.filter(place => Array.isArray(place?.coordinates));
      if (validPlaces.length <= 1) return [];
      const timeline = [];
      const lastIndex = validPlaces.length - 1;
      timeline.push({
        type: "dwell",
        point: validPlaces[0].coordinates,
        duration: biographyPersonStopDwellMs(slug, 0, path),
        nextLabel: biographyPersonDestinationLabel(biographyPersonNextStopPlace(validPlaces, 1, 0)),
        nextPlace: biographyPersonNextStopPlace(validPlaces, 1, 0),
        photoStop: Boolean(path?.photoStops)
      });
      for (let index = 0; index < lastIndex; index += 1) {
        const current = validPlaces[index];
        const next = validPlaces[index + 1];
        const start = current.coordinates;
        const end = next.coordinates;
        const skipsSegment = current?.skipToNext || next?.skipFromPrevious;
        const travelDuration = skipsSegment ? 0 : biographyPersonSegmentDuration(start, end);
        const arrivalPlace = biographyPersonNextStopPlace(validPlaces, index + 1, 0);
        const arrivalLabel = biographyPersonDestinationLabel(arrivalPlace);
        if (travelDuration > 0) {
          timeline.push({ type: "move", start, end, duration: travelDuration, nextLabel: arrivalLabel, nextPlace: arrivalPlace });
        }
        if (next?.passThrough) continue;
        const isLastStop = index + 1 === lastIndex;
        const followingPlace = biographyPersonNextStopPlace(validPlaces, index + 2, 0);
        timeline.push({
          type: "dwell",
          point: end,
          duration: isLastStop && !path?.randomFinalStop ? BIOGRAPHY_PERSON_FINAL_STOP_MS : biographyPersonStopDwellMs(slug, index + 1, path),
          nextLabel: biographyPersonDestinationLabel(followingPlace),
          nextPlace: followingPlace,
          photoStop: Boolean(path?.photoStops)
        });
      }
      const first = validPlaces[0].coordinates;
      const last = validPlaces[lastIndex].coordinates;
      const firstLabel = biographyPersonDestinationLabel(validPlaces[0]);
      timeline.push({ type: "fade-out", point: last, duration: BIOGRAPHY_PERSON_FADE_MS, nextLabel: firstLabel, nextPlace: validPlaces[0] });
      timeline.push({ type: "fade-in", point: first, duration: BIOGRAPHY_PERSON_FADE_MS, nextLabel: biographyPersonDestinationLabel(validPlaces[1]), nextPlace: validPlaces[1] });
      return timeline.filter(item => item.duration > 0);
    }

    function biographyPersonMotionTimelineFor(slug, places = [], path = {}) {
      const validPlaces = places.filter(place => Array.isArray(place?.coordinates));
      const first = validPlaces[0]?.coordinates || [];
      const last = validPlaces[validPlaces.length - 1]?.coordinates || [];
      const key = [
        slug,
        validPlaces.length,
        Number(first[0] || 0).toFixed(5),
        Number(first[1] || 0).toFixed(5),
        Number(last[0] || 0).toFixed(5),
        Number(last[1] || 0).toFixed(5),
        path?.stopMinMs || "",
        path?.stopMaxMs || "",
        path?.photoStops ? "photo" : ""
      ].join("|");
      if (state.biographyPersonMotionTimelineCache.has(key)) return state.biographyPersonMotionTimelineCache.get(key);
      if (state.biographyPersonMotionTimelineCache.size > 80) state.biographyPersonMotionTimelineCache.clear();
      const timeline = biographyPersonMotionTimeline(slug, validPlaces, path);
      state.biographyPersonMotionTimelineCache.set(key, timeline);
      return timeline;
    }

    function biographyPersonStableMotionOffset(slug, cycleDuration) {
      return (Math.abs(biographyPersonHash(slug)) % 100000) / 100000 * cycleDuration;
    }

    function biographyPersonVisibleInitialElapsed(slug, timeline = [], cycleDuration = 0, path = {}) {
      if (path?.startAtRouteStart || !cycleDuration || !timeline.length) return 0;
      let elapsed = biographyPersonStableMotionOffset(slug, cycleDuration);
      let cursor = 0;
      for (let index = 0; index < timeline.length; index += 1) {
        const item = timeline[index];
        const start = cursor;
        const end = cursor + Number(item.duration || 0);
        if (elapsed <= end) {
          if (item.type === "fade-out" || item.type === "fade-in") {
            let nextIndex = (index + 1) % timeline.length;
            while (timeline[nextIndex]?.type === "fade-out" || timeline[nextIndex]?.type === "fade-in") {
              nextIndex = (nextIndex + 1) % timeline.length;
              if (nextIndex === index) return 0;
            }
            return timeline.slice(0, nextIndex).reduce((total, entry) => total + Number(entry.duration || 0), 0) % cycleDuration;
          }
          const next = timeline[(index + 1) % timeline.length];
          const remaining = Math.max(0, end - elapsed);
          if (item.type === "dwell" && next?.type === "fade-out" && remaining < BIOGRAPHY_PERSON_FINAL_STOP_MS) return start;
          return elapsed;
        }
        cursor = end;
      }
      return 0;
    }

    function biographyPersonDwellCameraState(item, elapsed) {
      if (!item?.photoStop) return { cameraPosition: "chest", photoFlash: "false" };
      const midpoint = item.duration / 2;
      const flashStart = Math.max(0, midpoint - (BIOGRAPHY_PERSON_PHOTO_FLASH_MS / 3));
      const flashEnd = Math.min(item.duration, flashStart + BIOGRAPHY_PERSON_PHOTO_FLASH_MS);
      const active = elapsed >= flashStart && elapsed <= flashEnd;
      return {
        cameraPosition: active ? "head" : "chest",
        photoFlash: active ? "true" : "false"
      };
    }

    function biographyPersonMotionState(slug, places = [], now = performance.now(), path = null) {
      const validPlaces = places.filter(place => Array.isArray(place?.coordinates));
      const first = validPlaces[0]?.coordinates || null;
      if (!first || validPlaces.length <= 1) return { coordinates: first, opacity: 1, phase: "static", cameraPosition: "chest", photoFlash: "false" };
      const timeline = biographyPersonMotionTimelineFor(slug, validPlaces, path || {});
      const cycleDuration = timeline.reduce((total, item) => total + item.duration, 0);
      if (!cycleDuration) return { coordinates: first, opacity: 1, phase: "static", cameraPosition: "chest", photoFlash: "false" };
      if (!state.biographyPersonMotionStartedAt.has(slug)) {
        const initialElapsed = biographyPersonVisibleInitialElapsed(slug, timeline, cycleDuration, path || {});
        state.biographyPersonMotionStartedAt.set(slug, now - initialElapsed);
      }
      const startedAt = Number(state.biographyPersonMotionStartedAt.get(slug) || now);
      let elapsed = Math.max(0, now - startedAt) % cycleDuration;
      for (const item of timeline) {
        if (elapsed > item.duration) {
          elapsed -= item.duration;
          continue;
        }
        const t = item.duration ? Math.max(0, Math.min(1, elapsed / item.duration)) : 0;
        if (item.type === "move") {
          return {
            coordinates: [
              item.start[0] + ((item.end[0] - item.start[0]) * t),
              item.start[1] + ((item.end[1] - item.start[1]) * t)
            ],
            opacity: 1,
            phase: "moving",
            nextLabel: item.nextLabel || "",
            nextPlace: item.nextPlace || null,
            start: item.start,
            end: item.end,
            cameraPosition: "chest",
            photoFlash: "false"
          };
        }
        if (item.type === "fade-out") return { coordinates: item.point, opacity: 1 - t, phase: "fade-out", nextLabel: item.nextLabel || "", nextPlace: item.nextPlace || null, cameraPosition: "chest", photoFlash: "false" };
        if (item.type === "fade-in") return { coordinates: item.point, opacity: t, phase: "fade-in", nextLabel: item.nextLabel || "", nextPlace: item.nextPlace || null, cameraPosition: "chest", photoFlash: "false" };
        return { coordinates: item.point, opacity: 1, phase: "dwell", nextLabel: item.nextLabel || "", nextPlace: item.nextPlace || null, ...biographyPersonDwellCameraState(item, elapsed) };
      }
      return { coordinates: first, opacity: 1, phase: "dwell", cameraPosition: "chest", photoFlash: "false" };
    }

    function biographyPersonFeatureCollection(now = performance.now(), options = {}) {
      const features = [];
      const entries = [];
      const visibleSlugs = options.visibleSlugs instanceof Set ? options.visibleSlugs : null;
      for (const slug of biographyPersonKnownSlugs()) {
        if (visibleSlugs && !visibleSlugs.has(slug)) continue;
        const path = biographyPersonPathData(slug);
        if (!path?.places?.length) continue;
        const article = path.article || state.wikiBySlug.get(slug) || { slug };
        const person = biographyPathPersonName(article, slug);
        const mapLabel = biographyPersonMapLabel(article, slug);
        const quote = biographyPersonQuoteFor(slug);
        const routePlaces = biographyPersonRoutePlaces(path);
        const moving = routePlaces.length >= 2;
        const motion = biographyPersonMotionState(slug, routePlaces, now, path);
        const coordinates = motion.coordinates;
        if (!coordinates) continue;
        const motionOpacity = Math.max(0, Math.min(1, numeric(motion.opacity, 1)));
        const travelStatus = biographyPersonTravelStatus(motion.nextPlace || null, { slug, path, article, person, mapLabel });
        const mapTravelLabel = biographyPersonMapLabelWithStatus(mapLabel, travelStatus);
        const canoeVisible = biographyPersonIsOverWater(coordinates, motion);
        const canoeOpacity = canoeVisible ? 1 : 0;
        entries.push({
          slug,
          path,
          article,
          person,
          mapLabel,
          quote,
          routePlaces,
          moving,
          motion,
          coordinates,
          motionOpacity,
          travelStatus,
          mapTravelLabel,
          canoeVisible,
          canoeOpacity
        });
      }
      updateBiographyPersonQuoteEncounters(entries, now);
      updateBiographyPersonAutoQuotes(entries, now);
      for (const entry of entries) {
        const quoteCanRender = entry.quote?.text && biographyPersonLabelsVisible();
        const quoteVisibility = quoteCanRender ? biographyPersonQuoteVisibility(entry.slug, now) : { visible: false, opacity: 0, cycle: 0 };
        const quoteTypedText = entry.quote?.text ? biographyPersonQuoteTypedText(entry.slug, entry.quote.text, quoteVisibility.visible, quoteVisibility.cycle, now) : "";
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: entry.coordinates },
          properties: {
            kind: "person",
            person: entry.person,
            wiki_slug: entry.slug,
            title: entry.person,
            pin_label: entry.person,
            map_label: entry.mapLabel,
            map_travel_label: entry.mapTravelLabel,
            travel_status: entry.travelStatus,
            next_destination: entry.motion.nextLabel || "",
            has_quote: entry.quote?.text ? "true" : "false",
            quote_visible: quoteVisibility.visible ? "true" : "false",
            quote_cycle: Number(quoteVisibility.cycle || 0),
            quote_opacity: Number(quoteVisibility.opacity.toFixed(3)),
            quote_text: entry.quote?.text || "",
            quote_typed_text: quoteTypedText,
            quote_typed_label: biographyPersonTypedQuoteLabel(quoteTypedText, entry.quote?.date || "", entry.quote?.text || "", entry.mapLabel),
            quote_date: entry.quote?.date || "",
            quote_label: biographyPersonQuoteLabel(entry.quote, entry.mapLabel),
            quote_speaker: entry.mapLabel,
            quote_source: entry.quote?.source || "",
            quote_url: entry.quote?.url || "",
            moving: entry.moving ? "true" : "false",
            motion_opacity: Number(entry.motionOpacity.toFixed(3)),
            motion_phase: entry.motion.phase || "static",
            canoe_visible: entry.canoeVisible ? "true" : "false",
            canoe_opacity: Number(entry.canoeOpacity.toFixed(3)),
            camera_person: entry.slug === JEREMY_BIOGRAPHY_SLUG ? "true" : "false",
            camera_position: entry.motion.cameraPosition || "chest",
            photo_flash: entry.motion.photoFlash || "false",
            path_points: entry.routePlaces.length
          }
        });
      }
      return { type: "FeatureCollection", features };
    }

    function stopBiographyPersonFollow() {
      state.followedBiographySlug = "";
      state.biographyFollowLastCenteredAt = 0;
      state.biographyPeopleLastAnimationAt = 0;
    }

    function startBiographyPersonFollow(feature) {
      const slug = feature?.properties?.wiki_slug || "";
      if (!slug) return;
      state.followedBiographySlug = slug;
      state.biographyFollowLastCenteredAt = 0;
      state.biographyPeopleLastAnimationAt = 0;
      startBiographyPeopleAnimation();
      syncFollowedBiographyCamera(biographyPersonFeatureCollection(), performance.now(), { force: true });
    }

    function syncFollowedBiographyCamera(data, now = performance.now(), options = {}) {
      const slug = state.followedBiographySlug || "";
      if (!slug) return;
      if (!options.force && now - (state.biographyFollowLastCenteredAt || 0) < BIOGRAPHY_PERSON_FOLLOW_INTERVAL_MS) return;
      const feature = (data.features || []).find(item => item.properties?.wiki_slug === slug);
      const coords = feature?.geometry?.coordinates;
      if (!coords || !coords.every(Number.isFinite)) {
        stopBiographyPersonFollow();
        return;
      }
      if (!options.force && !followedBiographyCameraNeedsCentering(coords)) {
        state.biographyFollowLastCenteredAt = now;
        return;
      }
      if (state.leafletMap?.setView) {
        const zoom = state.leafletMap.getZoom?.() || undefined;
        state.leafletMap.setView(leafletVisibleCenterLatLng(coords, zoom), zoom, { animate: false });
      } else if (state.map?.jumpTo) {
        state.map.jumpTo({ center: mapboxVisibleCenterCoordinates(coords) });
      }
      state.biographyFollowLastCenteredAt = now;
    }

    function followedBiographyFeature(data) {
      const slug = state.followedBiographySlug || "";
      return slug ? (data?.features || []).find(item => item.properties?.wiki_slug === slug) : null;
    }

    function followedBiographyCameraNeedsCentering(coords) {
      if (!Array.isArray(coords)) return false;
      if (state.map?.project && state.map?.getCenter) {
        const target = state.map.project(coords);
        const center = visibleMapCenterPoint(state.map.getContainer?.() || state.map.getCanvasContainer?.());
        const dx = Number(target?.x) - Number(center?.x);
        const dy = Number(target?.y) - Number(center?.y);
        if (Number.isFinite(dx) && Number.isFinite(dy)) {
          return Math.hypot(dx, dy) >= BIOGRAPHY_PERSON_FOLLOW_CENTER_EPSILON_PX;
        }
      }
      if (state.leafletMap?.latLngToContainerPoint && state.leafletMap?.getCenter) {
        const target = state.leafletMap.latLngToContainerPoint([coords[1], coords[0]]);
        const center = visibleMapCenterPoint(state.leafletMap.getContainer?.());
        const dx = Number(target?.x) - Number(center?.x);
        const dy = Number(target?.y) - Number(center?.y);
        if (Number.isFinite(dx) && Number.isFinite(dy)) {
          return Math.hypot(dx, dy) >= BIOGRAPHY_PERSON_FOLLOW_CENTER_EPSILON_PX;
        }
      }
      return true;
    }

    function followedBiographyCameraCenterCoordinates() {
      const center = state.leafletMap?.getCenter?.() || state.map?.getCenter?.();
      const lng = Number(center?.lng);
      const lat = Number(center?.lat);
      return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
    }

    function followedBiographyVisibleCenterCoordinates() {
      if (state.leafletMap?.containerPointToLatLng) {
        const centerPoint = visibleMapCenterPoint(state.leafletMap.getContainer?.());
        const latLng = state.leafletMap.containerPointToLatLng([centerPoint.x, centerPoint.y]);
        const lng = Number(latLng?.lng);
        const lat = Number(latLng?.lat);
        if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
      }
      if (state.map?.unproject) {
        const centerPoint = visibleMapCenterPoint(state.map.getContainer?.() || state.map.getCanvasContainer?.());
        const lngLat = state.map.unproject(centerPoint);
        const lng = Number(lngLat?.lng);
        const lat = Number(lngLat?.lat);
        if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
      }
      return followedBiographyCameraCenterCoordinates();
    }

    function biographyPersonRenderDataForFollow(data) {
      const slug = state.followedBiographySlug || "";
      if (!slug || !data?.features?.length) return data;
      const center = followedBiographyVisibleCenterCoordinates();
      if (!center) return data;
      let changed = false;
      const features = data.features.map(feature => {
        if (feature.properties?.wiki_slug !== slug) return feature;
        changed = true;
        return {
          ...feature,
          geometry: { ...feature.geometry, coordinates: center }
        };
      });
      return changed ? { ...data, features } : data;
    }

    function recenterFollowedBiographyCamera(options = {}) {
      if (!state.followedBiographySlug) return;
      syncFollowedBiographyCamera(biographyPersonFeatureCollection(performance.now()), performance.now(), { force: true, ...options });
    }

    function recenterFollowedBiographyCameraAfterZoom() {
      recenterFollowedBiographyCamera();
      window.setTimeout(recenterFollowedBiographyCamera, 120);
      window.setTimeout(recenterFollowedBiographyCamera, 320);
    }

    function activeBiographyPeopleVisibleSlugs() {
      return state.biographyPeopleProgressiveActive ? state.biographyPeopleVisibleSlugs : null;
    }

    function biographyPersonFeatureCollectionForRender(now = performance.now()) {
      return biographyPersonFeatureCollection(now, { visibleSlugs: activeBiographyPeopleVisibleSlugs() });
    }

    function resetBiographyPeopleProgressiveLoad(signature = "") {
      if (state.biographyPeopleProgressiveTimer) {
        window.clearTimeout(state.biographyPeopleProgressiveTimer);
        state.biographyPeopleProgressiveTimer = null;
      }
      state.biographyPeopleProgressiveToken += 1;
      state.biographyPeopleProgressiveSignature = signature;
      state.biographyPeopleProgressiveActive = true;
      state.biographyPeopleVisibleSlugs = new Set();
      state.biographyPersonQuoteAutoSchedules.clear();
      state.biographyPersonQuoteEncounterPairs.clear();
    }

    function scheduleBiographyPeopleProgressiveLoad(slugs = [], options = {}) {
      const list = [...new Set(slugs.filter(Boolean))];
      const token = state.biographyPeopleProgressiveToken;
      const delay = Number.isFinite(Number(options.delay)) ? Number(options.delay) : BIOGRAPHY_PERSON_PROGRESSIVE_LOAD_DELAY_MS;
      const onStep = typeof options.onStep === "function" ? options.onStep : () => updateBiographyPeopleLayer(performance.now());
      const loadNext = index => {
        if (token !== state.biographyPeopleProgressiveToken) return;
        if (index >= list.length) {
          state.biographyPeopleProgressiveTimer = null;
          state.biographyPeopleProgressiveActive = true;
          onStep();
          return;
        }
        state.biographyPeopleVisibleSlugs.add(list[index]);
        onStep(list[index], index);
        state.biographyPeopleProgressiveTimer = window.setTimeout(() => loadNext(index + 1), delay);
      };
      if (!list.length) {
        state.biographyPeopleProgressiveTimer = null;
        return;
      }
      loadNext(0);
    }

    function progressiveBiographyPeopleSlugs() {
      return biographyPersonKnownSlugs().filter(slug => biographyPersonPathData(slug)?.places?.length);
    }

    function updateBiographyPeopleLayer(now = performance.now()) {
      const data = biographyPersonFeatureCollectionForRender(now);
      syncFollowedBiographyCamera(data, now);
      const renderData = biographyPersonRenderDataForFollow(data);
      if (state.map?.getSource?.("biography-people")) {
        state.map.getSource("biography-people").setData(renderData);
      }
      if (state.leafletBiographyPersonMarkers?.length) {
        const featuresBySlug = new Map((renderData.features || []).map(feature => [feature.properties?.wiki_slug, feature]));
        const showPersonLabels = leafletCurrentZoom() >= BIOGRAPHY_PERSON_LABEL_MIN_ZOOM;
        state.leafletBiographyPersonMarkers.forEach(entry => {
          const feature = featuresBySlug.get(entry.slug);
          const coords = feature?.geometry?.coordinates;
          if (!coords || !entry.marker?.setLatLng) return;
          const opacity = Math.max(0, Math.min(1, numeric(feature.properties?.motion_opacity, 1)));
          entry.marker.setLatLng([coords[1], coords[0]]);
          entry.marker.setOpacity?.(opacity);
          entry.labelMarker?.setLatLng?.([coords[1], coords[0]]);
          entry.labelMarker?.setOpacity?.(showPersonLabels ? opacity : 0);
          const labelElement = entry.labelMarker?.getElement?.();
          setLeafletMarkerPointerEvents(entry.labelMarker, showPersonLabels && opacity > 0.05);
          if (labelElement) {
            labelElement.innerHTML = biographyPersonLeafletLabelHtml(feature);
            labelElement.setAttribute("aria-hidden", showPersonLabels ? "false" : "true");
          }
          entry.quoteMarker?.setLatLng?.([coords[1], coords[0]]);
          const quoteOpacity = Math.max(0, Math.min(1, numeric(feature.properties?.quote_opacity, 0)));
          const quoteVisible = showPersonLabels && feature.properties?.quote_visible === "true" && String(feature.properties?.quote_typed_text || "").trim();
          entry.quoteMarker?.setOpacity?.(quoteVisible ? opacity * quoteOpacity : 0);
          setLeafletMarkerPointerEvents(entry.quoteMarker, quoteVisible && opacity > 0.05);
          const quoteElement = entry.quoteMarker?.getElement?.();
          if (quoteElement && quoteVisible) {
            const nextQuoteKey = `${feature.properties?.quote_cycle || 0}:${feature.properties?.quote_typed_text || ""}:${feature.properties?.quote_date || ""}`;
            if (quoteElement.dataset.quoteTypeKey !== nextQuoteKey) {
              quoteElement.dataset.quoteTypeKey = nextQuoteKey;
              quoteElement.innerHTML = biographyPersonLeafletQuoteHtml(feature);
              quoteElement.removeAttribute("aria-hidden");
            }
          } else if (quoteElement) {
            quoteElement.dataset.quoteTypeKey = "";
            quoteElement.innerHTML = "";
            quoteElement.setAttribute("aria-hidden", "true");
          }
          if (entry.feature?.geometry) entry.feature.geometry.coordinates = coords;
          if (entry.feature?.properties) {
            entry.feature.properties.motion_opacity = opacity;
            entry.feature.properties.motion_phase = feature.properties?.motion_phase || "static";
            entry.feature.properties.camera_position = feature.properties?.camera_position || "chest";
            entry.feature.properties.photo_flash = feature.properties?.photo_flash || "false";
          }
          const element = entry.marker.getElement?.();
          if (element) {
            setLeafletBiographyPersonElementState(element, feature, coords);
            element.dataset.lng = String(coords[0]);
            element.dataset.lat = String(coords[1]);
          }
        });
      }
    }

    function setLeafletMarkerPointerEvents(marker, enabled) {
      const element = marker?.getElement?.();
      if (!element) return;
      element.style.pointerEvents = enabled ? "auto" : "none";
      element.setAttribute("aria-hidden", enabled ? "false" : "true");
    }

    function setLeafletBiographyPersonElementState(element, feature, coords) {
      if (!element || !feature?.properties) return;
      const cameraPosition = feature.properties.camera_position || "chest";
      const photoFlash = feature.properties.photo_flash || "false";
      const motionPhase = feature.properties.motion_phase || "static";
      const currentCoordinates = Array.isArray(coords) ? coords : feature.geometry?.coordinates;
      const canoeCurrentlyVisible = biographyPersonIsOverWater(currentCoordinates, { phase: motionPhase });
      const canoeVisible = canoeCurrentlyVisible ? "true" : "false";
      const canoeOpacity = canoeCurrentlyVisible ? "1" : "0";
      const targets = [element, element.querySelector?.(".biography-person-marker-shell")].filter(Boolean);
      targets.forEach(target => {
        target.dataset.cameraPosition = cameraPosition;
        target.dataset.photoFlash = photoFlash;
        target.dataset.canoeVisible = canoeVisible;
        target.dataset.motionPhase = motionPhase;
        target.style.setProperty("--biography-canoe-opacity", canoeOpacity);
        if (coords) {
          target.dataset.lng = String(coords[0]);
          target.dataset.lat = String(coords[1]);
        }
      });
    }

    function startBiographyPeopleAnimation() {
      if (state.biographyPeopleAnimationDelayTimer) {
        window.clearTimeout(state.biographyPeopleAnimationDelayTimer);
        state.biographyPeopleAnimationDelayTimer = null;
      }
      if (state.biographyPeopleAnimationFrame || !window.requestAnimationFrame) return;
      const tick = now => {
        const interval = state.followedBiographySlug
          ? BIOGRAPHY_PERSON_FOLLOW_ANIMATION_INTERVAL_MS
          : BIOGRAPHY_PERSON_ANIMATION_INTERVAL_MS;
        if (!document.hidden && now - state.biographyPeopleLastAnimationAt >= interval) {
          updateBiographyPeopleLayer(now);
          state.biographyPeopleLastAnimationAt = now;
        }
        state.biographyPeopleAnimationFrame = window.requestAnimationFrame(tick);
      };
      state.biographyPeopleAnimationFrame = window.requestAnimationFrame(tick);
    }

    function scheduleBiographyPeopleAnimationStart(delay = 30000) {
      if (state.biographyPeopleAnimationFrame || state.biographyPeopleAnimationDelayTimer) return;
      state.biographyPeopleAnimationDelayTimer = window.setTimeout(() => {
        state.biographyPeopleAnimationDelayTimer = null;
        startBiographyPeopleAnimation();
      }, delay);
    }

    function whalingWhaleRouteSegments() {
      const route = WHALING_WHALE_ROUTE;
      return route.slice(0, -1).map((start, index) => {
        const end = route[index + 1];
        return { start, end, distance: biographyPersonCoordinateDistance(start, end) };
      });
    }

    function whalingWhaleCoordinateAt(progress = 0) {
      const segments = whalingWhaleRouteSegments();
      const total = segments.reduce((sum, segment) => sum + segment.distance, 0);
      if (!segments.length || total <= 0) return WHALING_WHALE_ROUTE[0];
      let remaining = Math.max(0, Math.min(1, progress)) * total;
      for (const segment of segments) {
        if (remaining <= segment.distance) {
          const local = segment.distance ? remaining / segment.distance : 0;
          return [
            segment.start[0] + (segment.end[0] - segment.start[0]) * local,
            segment.start[1] + (segment.end[1] - segment.start[1]) * local
          ];
        }
        remaining -= segment.distance;
      }
      return segments[segments.length - 1].end;
    }

    function whalingWhaleMotionState(now = performance.now()) {
      const oneWay = WHALING_WHALE_ONE_WAY_MS;
      const cycle = oneWay * 2;
      const elapsed = (((now + WHALING_WHALE_START_OFFSET_MS) % cycle) + cycle) % cycle;
      const movingRight = elapsed <= oneWay;
      const progress = movingRight ? elapsed / oneWay : 1 - ((elapsed - oneWay) / oneWay);
      const turnDistance = Math.min(elapsed, Math.abs(elapsed - oneWay), cycle - elapsed);
      const turnRatio = Math.max(0, Math.min(1, turnDistance / WHALING_WHALE_TURN_FADE_MS));
      return {
        coordinates: whalingWhaleCoordinateAt(progress),
        direction: movingRight ? "right" : "left",
        opacity: 0.32 + (turnRatio * 0.68)
      };
    }

    function whalingTargetSite() {
      return state.siteBySlug?.get?.(WHALING_FEATURE_SLUG) || state.sites?.find?.(site => site.slug === WHALING_FEATURE_SLUG) || null;
    }

    function whalingTargetArticle() {
      return state.wikiBySlug?.get?.(WHALING_FEATURE_SLUG)
        || state.wikiBySlug?.get?.("indigenous-whaling-and-maritime-labor")
        || null;
    }

    function whalingWhaleFeature(motion = whalingWhaleMotionState()) {
      const site = whalingTargetSite();
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: motion.coordinates },
        properties: {
          kind: "moving-whaling-marker",
          directus_site_id: site?.id || "",
          directus_site_slug: WHALING_FEATURE_SLUG,
          directus_site_title: site?.title || "Whaling",
          title: site?.title || "Whaling",
          listing_title: site?.title || "Whaling",
          description: site?.summary || "Native Long Island whaling and maritime history.",
          feature_category: site?.site_type || "Water and Shore",
          layer_categories: "water-and-shore natural-resources culture-ceremony-and-lifeways",
          moving_whale: "true"
        }
      };
    }

    function stopWhalingWhaleFollow() {
      state.followedWhalingWhale = false;
      state.whalingWhaleFollowLastCenteredAt = 0;
    }

    function startWhalingWhaleFollow() {
      state.followedWhalingWhale = true;
      state.whalingWhaleFollowLastCenteredAt = 0;
      state.whalingWhaleLastAnimationAt = 0;
      startWhalingWhaleAnimation();
      syncFollowedWhalingWhaleCamera(whalingWhaleMotionState(), performance.now(), { force: true });
    }

    function syncFollowedWhalingWhaleCamera(motion, now = performance.now(), options = {}) {
      if (!state.followedWhalingWhale) return;
      if (!options.force && now - (state.whalingWhaleFollowLastCenteredAt || 0) < BIOGRAPHY_PERSON_FOLLOW_INTERVAL_MS) return;
      const coords = motion?.coordinates;
      if (!coords || !coords.every(Number.isFinite)) {
        stopWhalingWhaleFollow();
        return;
      }
      if (!options.force && !followedBiographyCameraNeedsCentering(coords)) {
        state.whalingWhaleFollowLastCenteredAt = now;
        return;
      }
      if (state.leafletMap?.setView) {
        const zoom = state.leafletMap.getZoom?.() || undefined;
        state.leafletMap.setView(leafletVisibleCenterLatLng(coords, zoom), zoom, { animate: false });
      } else if (state.map?.jumpTo) {
        state.map.jumpTo({ center: mapboxVisibleCenterCoordinates(coords) });
      }
      state.whalingWhaleFollowLastCenteredAt = now;
    }

    function openWhalingFeature() {
      const clickedAt = nowMs();
      stopBiographyPersonFollow();
      const site = whalingTargetSite();
      if (site) {
        openListing(site, { source: "Map marker", focus: false });
        window.setTimeout(() => {
          if (!userMovedMapSince(clickedAt)) startWhalingWhaleFollow();
        }, 140);
        window.setTimeout(() => {
          if (!userMovedMapSince(clickedAt) && state.followedWhalingWhale) {
            syncFollowedWhalingWhaleCamera(whalingWhaleMotionState(), performance.now(), { force: true });
          }
        }, 420);
        return;
      }
      const article = whalingTargetArticle();
      if (article) {
        openWikiArticle(article, { source: "Map marker", focus: false });
        window.setTimeout(() => {
          if (!userMovedMapSince(clickedAt)) startWhalingWhaleFollow();
        }, 140);
        return;
      }
      showBanner("Whaling content is still loading. Try again in a moment.");
    }

    function whalingWhaleMarkerHtml() {
      return `
        <button class="whaling-whale-marker" type="button" aria-label="Open Whaling" title="Whaling">
          <span class="whaling-whale-shell" aria-hidden="true">
            <img src="${escapeHtml(WHALING_WHALE_ICON_URL)}" alt="">
          </span>
        </button>
      `;
    }

    function setWhalingWhaleElementState(element, motion) {
      if (!element) return;
      const marker = element.matches?.(".whaling-whale-marker") ? element : element.querySelector?.(".whaling-whale-marker");
      const target = marker || element;
      target.dataset.direction = motion.direction;
      target.style.setProperty("--whaling-whale-opacity", String(Math.max(0, Math.min(1, motion.opacity))));
    }

    function bindWhalingWhaleElement(element) {
      const target = element?.matches?.(".whaling-whale-marker") ? element : element?.querySelector?.(".whaling-whale-marker");
      if (!target || target.dataset.whalingBound === "true") return;
      target.dataset.whalingBound = "true";
      target.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        if (window.L?.DomEvent?.stop) window.L.DomEvent.stop(event);
        hideLeafletHoverCard();
        openWhalingFeature();
      });
      const showHover = event => {
        showLeafletHoverCard(whalingWhaleFeature(whalingWhaleMotionState()), event, target);
      };
      bindFineHoverTarget(target, {
        enter: showHover,
        move: showHover,
        leave: hideLeafletHoverCard
      });
    }

    function ensureWhalingWhaleMarker() {
      const motion = whalingWhaleMotionState();
      if (state.map && window.mapboxgl?.Marker) {
        if (!state.whalingWhaleMapboxMarker) {
          const element = document.createElement("div");
          element.className = "mapbox-whaling-whale-icon";
          element.innerHTML = whalingWhaleMarkerHtml();
          bindWhalingWhaleElement(element);
          state.whalingWhaleMapboxMarker = new mapboxgl.Marker({ element, anchor: "center" })
            .setLngLat(motion.coordinates)
            .addTo(state.map);
        }
        const element = state.whalingWhaleMapboxMarker.getElement?.();
        bindWhalingWhaleElement(element);
        setWhalingWhaleElementState(element, motion);
      }
      if (state.leafletMap && window.L) {
        if (!state.leafletWhalingWhaleMarker) {
          state.leafletWhalingWhaleMarker = L.marker([motion.coordinates[1], motion.coordinates[0]], {
            interactive: true,
            bubblingMouseEvents: false,
            zIndexOffset: 2350,
            icon: L.divIcon({
              className: "leaflet-whaling-whale-icon",
              html: whalingWhaleMarkerHtml(),
              iconSize: [74, 46],
              iconAnchor: [37, 23],
              popupAnchor: [0, -28]
            })
          }).addTo(state.leafletMap);
          state.leafletWhalingWhaleMarker.on("click", event => {
            if (event?.originalEvent && window.L?.DomEvent?.stop) window.L.DomEvent.stop(event.originalEvent);
            hideLeafletHoverCard();
            openWhalingFeature();
          });
        }
        state.leafletWhalingWhaleMarker.setLatLng?.([motion.coordinates[1], motion.coordinates[0]]);
        const element = state.leafletWhalingWhaleMarker.getElement?.();
        bindWhalingWhaleElement(element);
        setWhalingWhaleElementState(element, motion);
      }
      startWhalingWhaleAnimation();
    }

    function updateWhalingWhaleMarker(now = performance.now()) {
      const motion = whalingWhaleMotionState(now);
      if (state.whalingWhaleMapboxMarker) {
        state.whalingWhaleMapboxMarker.setLngLat(motion.coordinates);
        setWhalingWhaleElementState(state.whalingWhaleMapboxMarker.getElement?.(), motion);
      }
      if (state.leafletWhalingWhaleMarker) {
        state.leafletWhalingWhaleMarker.setLatLng?.([motion.coordinates[1], motion.coordinates[0]]);
        setWhalingWhaleElementState(state.leafletWhalingWhaleMarker.getElement?.(), motion);
      }
      syncFollowedWhalingWhaleCamera(motion, now);
    }

    function startWhalingWhaleAnimation() {
      if (state.whalingWhaleAnimationFrame || !window.requestAnimationFrame) return;
      const tick = now => {
        if (!document.hidden && now - state.whalingWhaleLastAnimationAt >= WHALING_WHALE_ANIMATION_INTERVAL_MS) {
          updateWhalingWhaleMarker(now);
          state.whalingWhaleLastAnimationAt = now;
        }
        state.whalingWhaleAnimationFrame = window.requestAnimationFrame(tick);
      };
      state.whalingWhaleAnimationFrame = window.requestAnimationFrame(tick);
    }

    function movingDogRouteSegments() {
      const route = MOVING_DOG_ROUTE;
      return route.slice(0, -1).map((start, index) => {
        const end = route[index + 1];
        return { start, end, distance: biographyPersonCoordinateDistance(start, end) };
      });
    }

    function movingDogCoordinateAt(progress = 0) {
      const segments = movingDogRouteSegments();
      const total = segments.reduce((sum, segment) => sum + segment.distance, 0);
      if (!segments.length || total <= 0) return MOVING_DOG_ROUTE[0];
      let remaining = Math.max(0, Math.min(1, progress)) * total;
      for (const segment of segments) {
        if (remaining <= segment.distance) {
          const local = segment.distance ? remaining / segment.distance : 0;
          return [
            segment.start[0] + (segment.end[0] - segment.start[0]) * local,
            segment.start[1] + (segment.end[1] - segment.start[1]) * local
          ];
        }
        remaining -= segment.distance;
      }
      return segments[segments.length - 1].end;
    }

    function movingDogMotionState(now = performance.now()) {
      const oneWay = MOVING_DOG_ONE_WAY_MS;
      const cycle = oneWay * 2;
      const elapsed = (((now + MOVING_DOG_START_OFFSET_MS) % cycle) + cycle) % cycle;
      const movingRight = elapsed <= oneWay;
      const progress = movingRight ? elapsed / oneWay : 1 - ((elapsed - oneWay) / oneWay);
      return {
        coordinates: movingDogCoordinateAt(progress),
        direction: movingRight ? "right" : "left"
      };
    }

    function movingDogTargetArticle() {
      return state.wikiBySlug?.get?.(MOVING_DOG_WIKI_SLUG)
        || state.wikiArticles?.find?.(article => article.slug === MOVING_DOG_WIKI_SLUG)
        || null;
    }

    function movingDogFeature(motion = movingDogMotionState()) {
      const article = movingDogTargetArticle();
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: motion.coordinates },
        properties: {
          kind: "moving-dog-marker",
          wiki_slug: MOVING_DOG_WIKI_SLUG,
          title: article?.title || "Dog",
          description: article?.summary || "Dogs in Indigenous Long Island life, memory, and colonial conflict.",
          feature_category: "Culture, Ceremony, and Lifeways",
          layer_categories: "culture-ceremony-and-lifeways",
          moving_dog: "true"
        }
      };
    }

    async function openMovingDogFeature() {
      stopBiographyPersonFollow();
      stopWhalingWhaleFollow();
      let article = movingDogTargetArticle();
      if (!article && !fullArchiveDataLoaded) {
        articleHeadEl.innerHTML = `
          <p class="article-kicker">Map marker</p>
          <h2>Dog</h2>
          <p class="article-meta">Loading article content...</p>
        `;
        articleBodyEl.innerHTML = `
          <p class="article-summary">Dogs in Indigenous Long Island life, memory, and colonial conflict.</p>
          <p class="form-status">Preparing the full article, sources, and timeline.</p>
        `;
        markArticlePanelOpen();
        updateBackButton();
        await requestFullArchiveData("dog-marker-open").catch(error => console.warn("Dog article content will keep loading in the background.", error));
        article = movingDogTargetArticle();
      }
      if (article) {
        openWikiArticle(article, { source: "Map marker", focus: false });
        return;
      }
      showBanner("Dog article is still loading. Try again in a moment.");
    }

    function movingDogMarkerHtml() {
      return `
        <button class="moving-dog-marker" type="button" aria-label="Open Dog article" title="Dog">
          <span class="moving-dog-shell" aria-hidden="true">
            <img src="${escapeHtml(MOVING_DOG_ICON_URL)}" alt="">
          </span>
          <span class="moving-dog-label" aria-hidden="true">Dog</span>
        </button>
      `;
    }

    function setMovingDogElementState(element, motion) {
      if (!element) return;
      const marker = element.matches?.(".moving-dog-marker") ? element : element.querySelector?.(".moving-dog-marker");
      const target = marker || element;
      target.dataset.direction = motion.direction;
      target.dataset.showLabel = biographyPersonLabelsVisible() ? "true" : "false";
    }

    function bindMovingDogElement(element) {
      const target = element?.matches?.(".moving-dog-marker") ? element : element?.querySelector?.(".moving-dog-marker");
      if (!target || target.dataset.dogBound === "true") return;
      target.dataset.dogBound = "true";
      target.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        if (window.L?.DomEvent?.stop) window.L.DomEvent.stop(event);
        hideLeafletHoverCard();
        openMovingDogFeature();
      });
      const showHover = event => {
        showLeafletHoverCard(movingDogFeature(movingDogMotionState()), event, target);
      };
      bindFineHoverTarget(target, {
        enter: showHover,
        move: showHover,
        leave: hideLeafletHoverCard
      });
    }

    function ensureMovingDogMarker() {
      const motion = movingDogMotionState();
      if (state.map && window.mapboxgl?.Marker) {
        if (!state.movingDogMapboxMarker) {
          const element = document.createElement("div");
          element.className = "mapbox-moving-dog-icon";
          element.innerHTML = movingDogMarkerHtml();
          bindMovingDogElement(element);
          state.movingDogMapboxMarker = new mapboxgl.Marker({ element, anchor: "center" })
            .setLngLat(motion.coordinates)
            .addTo(state.map);
        }
        const element = state.movingDogMapboxMarker.getElement?.();
        bindMovingDogElement(element);
        setMovingDogElementState(element, motion);
      }
      if (state.leafletMap && window.L) {
        if (!state.leafletMovingDogMarker) {
          state.leafletMovingDogMarker = L.marker([motion.coordinates[1], motion.coordinates[0]], {
            interactive: true,
            bubblingMouseEvents: false,
            zIndexOffset: 2345,
            icon: L.divIcon({
              className: "leaflet-moving-dog-icon",
              html: movingDogMarkerHtml(),
              iconSize: [30, 24],
              iconAnchor: [15, 12],
              popupAnchor: [0, -16]
            })
          }).addTo(state.leafletMap);
          state.leafletMovingDogMarker.on("click", event => {
            if (event?.originalEvent && window.L?.DomEvent?.stop) window.L.DomEvent.stop(event.originalEvent);
            openMovingDogFeature();
          });
        }
        state.leafletMovingDogMarker.setLatLng?.([motion.coordinates[1], motion.coordinates[0]]);
        const element = state.leafletMovingDogMarker.getElement?.();
        bindMovingDogElement(element);
        setMovingDogElementState(element, motion);
      }
      startMovingDogAnimation();
    }

    function updateMovingDogMarker(now = performance.now()) {
      const motion = movingDogMotionState(now);
      if (state.movingDogMapboxMarker) {
        state.movingDogMapboxMarker.setLngLat(motion.coordinates);
        setMovingDogElementState(state.movingDogMapboxMarker.getElement?.(), motion);
      }
      if (state.leafletMovingDogMarker) {
        state.leafletMovingDogMarker.setLatLng?.([motion.coordinates[1], motion.coordinates[0]]);
        setMovingDogElementState(state.leafletMovingDogMarker.getElement?.(), motion);
      }
    }

    function startMovingDogAnimation() {
      if (state.movingDogAnimationFrame || !window.requestAnimationFrame) return;
      const tick = now => {
        if (!document.hidden && now - state.movingDogLastAnimationAt >= MOVING_DOG_ANIMATION_INTERVAL_MS) {
          updateMovingDogMarker(now);
          state.movingDogLastAnimationAt = now;
        }
        state.movingDogAnimationFrame = window.requestAnimationFrame(tick);
      };
      state.movingDogAnimationFrame = window.requestAnimationFrame(tick);
    }

    function biographyPathsEnabled() {
      return Boolean(biographyPathsToggle?.checked);
    }

    function timelineEventCoordinates(event = {}) {
      const lng = Number(event.longitude);
      const lat = Number(event.latitude);
      return isLongIslandOrRegionalCoordinate(lng, lat) ? [lng, lat] : null;
    }

    function isLongIslandOrRegionalCoordinate(lng, lat) {
      const x = Number(lng);
      const y = Number(lat);
      return Number.isFinite(x) && Number.isFinite(y) && x >= -76 && x <= -70.5 && y >= 39.5 && y <= 42.5;
    }

    function normalizedBiographyPlaceText(value) {
      return normalizeComparisonText(stripHtml(String(value || ""))).replace(/[^a-z0-9]+/g, " ").trim();
    }

    function isBiographyWikiArticle(article) {
      return Boolean(article?.slug && BIOGRAPHY_WIKI_SLUGS.has(article.slug));
    }

    function cleanupBiographyArticleHtml(article, html) {
      if (!isBiographyWikiArticle(article) || !html) return html;
      const template = document.createElement("template");
      template.innerHTML = String(html || "");
      [...template.content.querySelectorAll("h2, h3")].forEach(heading => {
        const label = publicCleanText(heading.textContent || "");
        const isIntroHeading = /^introduction$/i.test(label);
        const isDuplicateSection = /^(places connected|connected places|places|why this matters)$/i.test(label);
        if (!isIntroHeading && !isDuplicateSection) return;
        const level = Number(heading.tagName.replace(/^H/i, "")) || 2;
        let node = heading.nextSibling;
        heading.remove();
        if (isIntroHeading) return;
        while (node) {
          const next = node.nextSibling;
          const isBoundary = node.nodeType === Node.ELEMENT_NODE
            && /^H[1-6]$/i.test(node.tagName || "")
            && (Number(node.tagName.replace(/^H/i, "")) || 2) <= level;
          if (isBoundary) break;
          node.remove();
          node = next;
        }
      });
      return template.innerHTML.trim();
    }

    function biographyPlaceMatchesEvent(place, event) {
      if (!place || !event) return false;
      const placeText = normalizedBiographyPlaceText([place.label, place.place].filter(Boolean).join(" "));
      const eventText = normalizedBiographyPlaceText([
        timelineLocationLabel(event),
        timelineTitle(event),
        event.source_title,
        event.description
      ].filter(Boolean).join(" "));
      if (!placeText || !eventText) return false;
      if (eventText.includes(placeText) || placeText.includes(eventText)) return true;
      const placeTerms = placeText.split(" ").filter(term => term.length >= 5);
      if (!placeTerms.length) return false;
      return placeTerms.some(term => eventText.includes(term));
    }

    function biographyTimelineData(article, events = []) {
      const path = biographyPathData(article);
      const timeline = TIMELINE_UTILS.buildBiographyTimelineData({
        article,
        path,
        events,
        matchesEvent: biographyPlaceMatchesEvent,
        coordinatesForEvent: timelineEventCoordinates,
        sortValue: timelineSortValue,
        dateLabel: timelineRangeLabel,
        title: timelineTitle,
        location: timelineLocationLabel,
        descriptionHtml: event => autoLinkHtml(cleanHtml(timelineDisplayDescription(event)), { used: new Set(), excludeHref: `#wiki/${article.slug}` }),
        sourceNote: timelineSourceText,
        reasonText: event => stripHtml(timelineDisplayDescription(event)),
        escapeHtml
      });
      return timeline && path?.routePlaces?.length ? { ...timeline, routePlaces: path.routePlaces } : timeline;
    }

    function biographyPathFeatureCollection(path, article = null) {
      if (!path?.places?.length) return { type: "FeatureCollection", features: [] };
      const person = biographyPathPersonName(article, article?.slug || "");
      const line = {
        type: "Feature",
        geometry: biographyPersonRouteLineGeometry(path),
        properties: { title: `${person || path.title || "Biography"} path`, person, wiki_slug: article?.slug || "", kind: "path" }
      };
      const points = path.places.map((place, index) => {
        const order = index + 1;
        const pathLabel = biographyPathTimelineLabel(place);
        const numberedPathLabel = biographyPathMapPinLabel(place, order);
        const compactPathLabel = biographyPathCompactMapPinLabel(place, order);
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: place.coordinates },
          properties: {
            title: pathLabel,
            place: place.place,
            reason: place.reason,
            person,
            wiki_slug: article?.slug || "",
            order,
            label: String(order),
            pin_label: numberedPathLabel,
            compact_pin_label: compactPathLabel,
            event_id: place.event_id || place.eventId || "",
            kind: "point"
          }
        };
      });
      const labels = path.places.map((place, index) => {
        const order = index + 1;
        const pathLabel = biographyPathTimelineLabel(place);
        const numberedPathLabel = biographyPathMapPinLabel(place, order);
        const compactPathLabel = biographyPathCompactMapPinLabel(place, order);
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: biographyPathLabelCoordinates(path.places, index) || place.coordinates },
          properties: {
            title: pathLabel,
            place: place.place,
            reason: place.reason,
            person,
            wiki_slug: article?.slug || "",
            order,
            label: String(order),
            pin_label: numberedPathLabel,
            compact_pin_label: compactPathLabel,
            event_id: place.event_id || place.eventId || "",
            kind: "label"
          }
        };
      });
      return { type: "FeatureCollection", features: [line, ...points, ...labels] };
    }

    function biographyTimelineSection(article, events = []) {
      const path = biographyTimelineData(article, events);
      if (!path) return historicMomentsSection(events, { linked: new Set(), excludeHref: `#wiki/${article.slug}` });
      return `
        <section class="section biography-path-section">
          <h3>Life timeline and places</h3>
          ${path.note ? `<p class="article-meta">${escapeHtml(path.note)}</p>` : ""}
          <div class="biography-path-list">
            ${path.entries.map(entry => `
              <article class="historic-moment biography-timeline-entry" ${entry.event?.id ? `data-event-id="${escapeHtml(entry.event.id)}"` : ""}>
                <div class="historic-moment-date">${escapeHtml(entry.dateLabel || "Mapped place")}</div>
                ${Number.isFinite(entry.pathIndex) ? `
                  <button class="biography-path-place" type="button" data-biography-path-index="${entry.pathIndex}" aria-label="Show ${escapeHtml(entry.title)} on the map">
                    <span class="biography-path-number">${entry.mapOrder}</span>
                    <span>
                      <strong>${escapeHtml(entry.title)}</strong>
                      ${entry.location ? `<em>${escapeHtml(entry.location)}</em>` : ""}
                    </span>
                  </button>
                ` : `
                  <p><strong>${escapeHtml(entry.title)}</strong></p>
                  ${entry.location ? `<p class="historic-moment-location"><strong>Location:</strong> ${escapeHtml(entry.location)}</p>` : ""}
                `}
                <div class="historic-moment-body">${entry.descriptionHtml || ""}</div>
                ${isFrontendAdmin() && entry.event?.id ? `<div class="article-actions"><button class="button secondary" type="button" data-open-frontend-editor="timeline" data-editor-slug="${escapeHtml(entry.event.id)}">Edit moment</button></div>` : ""}
                ${entry.sourceNote ? `
                  <button class="timeline-source-info" type="button" data-timeline-source-info data-source-reference="${escapeHtml(entry.sourceNote)}" aria-label="Show source" title="${escapeHtml(entry.sourceNote)}">i</button>
                  <div class="timeline-source-popover" role="note">
                    <div>${escapeHtml(entry.sourceNote)}</div>
                    <span class="timeline-source-copy-hint">Click the icon to copy reference to clipboard.</span>
                    <span class="timeline-source-copy-confirm">Source reference copied.</span>
                  </div>
                ` : ""}
              </article>
            `).join("")}
          </div>
        </section>
      `;
    }

    function clearBiographyPathOverlay() {
      if (state.map) {
        for (const id of ["biography-place-labels", "biography-place-points", "biography-place-path", "biography-place-path-casing"]) {
          if (state.map.getLayer(id)) state.map.removeLayer(id);
        }
        if (state.map.getSource("biography-place-path")) state.map.removeSource("biography-place-path");
      }
      if (Array.isArray(state.biographyPathMarkers)) {
        state.biographyPathMarkers.forEach(marker => marker?.remove?.());
      }
      state.biographyPathMarkers = [];
      state.activeBiographyPath = null;
      if (state.leafletBiographyPathLayer && state.leafletMap) {
        state.leafletMap.removeLayer(state.leafletBiographyPathLayer);
      }
      state.leafletBiographyPathLayer = null;
    }

    function promoteActiveBiographyPathLayers() {
      if (state.map) {
        for (const id of ["biography-place-path-casing", "biography-place-path", "biography-place-points", "biography-place-labels"]) {
          if (state.map.getLayer(id)) state.map.moveLayer(id);
        }
      }
      if (state.leafletBiographyPathLayer?.eachLayer) {
        state.leafletBiographyPathLayer.eachLayer(layer => {
          layer.bringToFront?.();
        });
      }
    }

    function showBiographyPathOverlay(article, options = {}) {
      const path = biographyTimelineData(article, options.events || []);
      clearBiographyPathOverlay();
      if (!path) return;
      state.activeBiographyPath = path;
      const data = biographyPathFeatureCollection(path, article);
      if (state.map) {
        state.map.addSource("biography-place-path", { type: "geojson", data });
        const beforeLayer = state.map.getLayer("directus-site-icons") ? "directus-site-icons" : undefined;
        state.map.addLayer({
          id: "biography-place-path-casing",
          type: "line",
          source: "biography-place-path",
          filter: ["==", ["get", "kind"], "path"],
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "rgba(255, 255, 255, 0.95)",
            "line-width": ["interpolate", ["linear"], ["zoom"], 6, 5, 12, 8],
            "line-opacity": 0.92
          }
        }, beforeLayer);
        state.map.addLayer({
          id: "biography-place-path",
          type: "line",
          source: "biography-place-path",
          filter: ["==", ["get", "kind"], "path"],
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#59605c",
            "line-width": ["interpolate", ["linear"], ["zoom"], 6, 2.5, 12, 4.5],
            "line-opacity": 0.9,
            "line-dasharray": ["literal", [1.2, 1.1]]
          }
        }, beforeLayer);
        state.map.addLayer({
          id: "biography-place-points",
          type: "circle",
          source: "biography-place-path",
          filter: ["==", ["get", "kind"], "point"],
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 7, 12, 11],
            "circle-color": "#59605c",
            "circle-stroke-color": "#fff",
            "circle-stroke-width": 2.4,
            "circle-opacity": 0.96
          }
        });
        state.map.addLayer({
          id: "biography-place-labels",
          type: "symbol",
          source: "biography-place-path",
          filter: ["==", ["get", "kind"], "label"],
          minzoom: 7.8,
          layout: {
            "text-field": ["step", ["zoom"], ["get", "compact_pin_label"], 10.4, ["get", "pin_label"]],
            "text-size": ["interpolate", ["linear"], ["zoom"], 7.8, 8.5, 13, 10.75],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-variable-anchor": ["literal", ["top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"]],
            "text-radial-offset": ["interpolate", ["linear"], ["zoom"], 7.8, 0.85, 13, 1.18],
            "text-justify": "auto",
            "text-max-width": ["interpolate", ["linear"], ["zoom"], 7.8, 5.5, 13, 8],
            "text-padding": 10,
            "text-allow-overlap": false,
            "text-ignore-placement": false,
            "text-optional": true
          },
          paint: {
            "text-color": "#3f4742",
            "text-halo-color": "rgba(255,255,255,0.94)",
            "text-halo-width": 1.25
          }
        });
        ["biography-place-path-casing", "biography-place-path", "biography-place-points", "biography-place-labels"]
          .forEach(id => {
            if (state.map.getLayer(id)) state.map.moveLayer(id);
          });
      } else if (state.leafletMap && window.L) {
        const person = biographyPathPersonName(article, article?.slug || "");
        const line = L.polyline(biographyPersonRouteLeafletLineCoordinates(path), {
          color: "#59605c",
          weight: 4,
          opacity: 0.88,
          dashArray: "6 5"
        });
        const markers = path.places.map((place, index) => {
          const labelCoordinates = biographyPathLabelCoordinates(path.places, index) || place.coordinates;
          return L.marker([labelCoordinates[1], labelCoordinates[0]], {
            icon: L.divIcon({
              className: "biography-path-leaflet-label",
              html: `<span class="biography-path-map-label">${escapeHtml(biographyPathMapPinLabel(place, index + 1))}</span>`,
              iconSize: [270, 24],
              iconAnchor: [135, 12],
              tooltipAnchor: [0, -12]
            }),
            keyboard: false,
            zIndexOffset: 2800
          }).bindTooltip(biographyPathMapPinLabel(place, index + 1), { direction: "top" });
        });
        state.leafletBiographyPathLayer = L.layerGroup([line, ...markers]).addTo(state.leafletMap);
      }
      promoteActiveBiographyPathLayers();
      if (options.focus !== false) focusBiographyPathPlace(path, 0, { zoom: 10.9, duration: 760 });
    }

    function focusBiographyPathPlace(pathOrArticle, index = 0, options = {}) {
      const path = pathOrArticle?.places ? pathOrArticle : (state.activeBiographyPath?.places ? state.activeBiographyPath : biographyPathData(pathOrArticle));
      if (!path?.places?.length) return false;
      const place = path.places[Math.max(0, Math.min(path.places.length - 1, Number(index) || 0))];
      if (!place?.coordinates?.every(Number.isFinite)) return false;
      focusGeometry(
        { type: "Point", coordinates: place.coordinates },
        Number.isFinite(Number(options.zoom)) ? Number(options.zoom) : 12,
        { duration: Number.isFinite(Number(options.duration)) ? Number(options.duration) : 680 }
      );
      return true;
    }

    function siteMatchesCategoryTag(site, tagKey) {
      return siteCategoryTags(site).some(tag => tag.key === tagKey);
    }

    function openSiteCategoryTag(tagKey, tagLabel, options = {}) {
      const cleanKey = String(tagKey || "").trim();
      if (!cleanKey) return;
      if (!options.skipHistory) rememberPanel();
      if (!options.skipRoute) setRoute({ tag: cleanKey });
      clearBiographyPathOverlay();
      state.activeContent = null;
      clearActiveTimelineEvent();
      const matches = state.sites
        .filter(site => siteMatchesCategoryTag(site, cleanKey))
        .sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
      const sampleTag = matches.flatMap(site => siteCategoryTags(site)).find(tag => tag.key === cleanKey);
      const cleanLabel = String(tagLabel || sampleTag?.label || "").trim() || "Related Sites";
      articleHeadEl.innerHTML = `
        <p class="article-kicker">Site list</p>
        <h2>${escapeHtml(cleanLabel)}</h2>
      `;
      articleBodyEl.innerHTML = `
        <p class="article-summary">${matches.length} mapped site${matches.length === 1 ? "" : "s"} tagged ${escapeHtml(cleanLabel)}.</p>
        <div class="content-list">
          ${matches.map(site => contentCardHtml({ type: "site", item: site })).join("") || "<p class=\"article-summary\">No mapped sites matched this tag yet.</p>"}
        </div>
      `;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
    }

    function isBroadTerritorySite(site) {
      return SITE_UTILS.isBroadTerritory(site, { normalizeText: normalizeComparisonText });
    }

    function territoryAreaScore(geometry) {
      const bounds = geometryBounds(geometry);
      if (!bounds) return Number.POSITIVE_INFINITY;
      return Math.abs(bounds[1][0] - bounds[0][0]) * Math.abs(bounds[1][1] - bounds[0][1]);
    }

    function territoryForPoint(point) {
      if (!Array.isArray(point)) return null;
      return (state.sites || [])
        .filter(site => isBroadTerritorySite(site))
        .map(site => ({ site, geometry: siteDisplayGeometry(site) }))
        .filter(item => item.geometry && pointInGeometry(point, item.geometry))
        .sort((a, b) => territoryAreaScore(a.geometry) - territoryAreaScore(b.geometry))[0]?.site || null;
    }

    function coreAncestralLandSite(site) {
      const text = normalizeComparisonText(`${site?.title || ""} ${site?.slug || ""} ${site?.site_type || ""}`);
      return site?.site_type === "territory"
        && /ancestral|traditional/.test(text)
        && !/hoggenoch/.test(text)
        && /Polygon/.test(siteDisplayGeometry(site)?.type || site?.geojson?.type || "");
    }

    function coreAncestralLandForPoint(point) {
      if (!Array.isArray(point)) return null;
      return (state.sites || [])
        .filter(coreAncestralLandSite)
        .map(site => ({ site, geometry: siteDisplayGeometry(site) }))
        .filter(item => item.geometry && pointInGeometry(point, item.geometry))
        .sort((a, b) => territoryAreaScore(a.geometry) - territoryAreaScore(b.geometry))[0]?.site || null;
    }

    function homelandKeyForSite(site) {
      if (!site) return "";
      if (isBroadTerritorySite(site)) return `territory:${site.id || site.slug || site.title}`;
      const linkedTerritoryId = relationId(site.ancestral_territory);
      if (linkedTerritoryId) return `territory:${linkedTerritoryId}`;
      const center = site.center || geometryCenter(siteDisplayGeometry(site));
      const territory = territoryForPoint(center);
      if (!territory || territory.slug === site.slug) return "";
      return `territory:${territory.id || territory.slug || territory.title}`;
    }

    function distinctVisitedHomelandCount(sites = []) {
      return new Set((sites || []).map(homelandKeyForSite).filter(Boolean)).size;
    }

    function searchedLocationTerritoryHtml(center) {
      const territory = coreAncestralLandForPoint(center);
      if (!territory?.title) return "";
      return `<span class="address-territory">You are on ${escapeHtml(territory.title)}</span>`;
    }

    function visitAccessStatus(site) {
      const explicit = String(site?.visit_status || site?.access_status || site?.public_access || "").toLowerCase();
      if (/do[_ -]?not|closed|restricted|private/.test(explicit)) return "private";
      if (/learn|sensitive|approx/.test(explicit)) return "learn";
      if (/visit|public|open/.test(explicit)) return "visitable";
      const text = normalizeComparisonText(`${site?.title || ""} ${site?.site_type || ""} ${site?.summary || ""}`);
      if (isBroadTerritorySite(site)) return "learn";
      if (/reservation|burial|sacred|private|cemetery/.test(text)) return "learn";
      return "visitable";
    }

    function visitAccessLabel(site) {
      return {
        visitable: "Public visit possible",
        learn: "Learn here, visit with care",
        private: "Do not visit"
      }[visitAccessStatus(site)] || "Access not reviewed";
    }

    function siteIsVisitable(site) {
      return visitAccessStatus(site) === "visitable";
    }

    async function openWikiArticle(article, context = {}) {
      const openedAt = nowMs();
      if (!context.skipHistory) rememberPanel();
      article = await hydrateWiki(article);
      state.activeContent = { type: "wiki", slug: article.slug };
      const linked = new Set();
      const excludeHref = `#wiki/${article.slug}`;
      const image = firstContentImage(article.content || "");
      const wikiMoments = timelineEventsFor("wiki", article.id, article.slug);
      const biographyTimeline = biographyTimelineData(article, wikiMoments);
      const articleTimelineHtml = timelineHtml(cleanHtml(article.content));
      const rawArticleContentHtml = articleTimelineHtml || cleanHtml(article.content);
      const dedupedArticleContentHtml = removeDuplicateHeroImageFromContent(rawArticleContentHtml, image);
      const articleContentHtml = cleanupBiographyArticleHtml(
        article,
        isBiographyWikiArticle(article) ? dedupedArticleContentHtml : removeFootnoteReferenceMarkers(dedupedArticleContentHtml)
      );
      const showArticleSummary = shouldShowWikiLeadSummary(article.summary, articleContentHtml);
      articleHeadEl.innerHTML = `
        <p class="article-kicker">${escapeHtml(context.source || "Knowledgebase article")}</p>
        <h2>${escapeHtml(article.title)}</h2>
      `;
      articleBodyEl.innerHTML = `
        ${image ? `<img class="hero-image article-sticky-hero" src="${escapeHtml(image)}" alt="${escapeHtml(article.title)}" loading="lazy" decoding="async" onerror="this.remove()">` : ""}
        ${showArticleSummary ? `<p class="article-summary">${escapeHtml(article.summary)}</p>` : ""}
        ${articleContentHtml ? `<section class="section">
          <div class="section-content">${autoLinkHtml(articleContentHtml, { used: linked, excludeHref })}</div>
        </section>` : ""}
        ${whyThisMattersSection(article)}
        ${biographyTimelineSection(article, wikiMoments)}
        ${sourcesEvidenceSection(article, "wiki")}
        ${discussionSection("wiki", article)}
        ${article.virtual || !isFrontendAdmin() ? "" : `<div class="article-actions">
          <button class="button secondary" type="button" data-open-frontend-editor="wiki" data-editor-slug="${escapeHtml(article.slug)}">Edit article</button>
        </div>`}
      `;
      markArticlePanelOpen();
      decorateCurrentArticleForQuoteComments("wiki", article);
      decorateCurrentArticleForLanguageQuiz("wiki", article);
      updateBackButton();
      resetArticleScroll();
      setTimelineContextEvents(wikiMoments);
      const activeEvent = context.timelineEventId;
      if (activeEvent) setActiveTimelineEvent(activeEvent, { scrollTimeline: true, scrollArticle: true });
      else clearActiveTimelineEvent();
      if (!context.skipRoute) setRoute({ wiki: article.slug, event: context.timelineEventId });
      const shouldFocus = context.focus !== false && !userMovedMapSince(openedAt);
      if (biographyTimeline?.places?.length >= 2) showBiographyPathOverlay(article, { focus: shouldFocus, events: wikiMoments });
      else {
        clearBiographyPathOverlay();
        if (shouldFocus) focusRelatedContentFeature("wiki", article.slug);
      }
    }

    async function openSiteContent(item, context = {}) {
      if (!context.skipHistory) rememberPanel();
      clearBiographyPathOverlay();
      item = await hydratePage(item);
      state.activeContent = null;
      clearActiveTimelineEvent();
      const linked = new Set();
      const excludeHref = `#page/${item.slug}`;
      articleHeadEl.innerHTML = `
        <p class="article-kicker">${escapeHtml(context.source || item.content_type || "Page")}</p>
        <h2>${escapeHtml(item.title)}</h2>
        ${item.wp_date ? `<p class="article-meta">${escapeHtml(new Date(item.wp_date).toLocaleDateString())}</p>` : ""}
      `;
      articleBodyEl.innerHTML = `
        ${item.featured_image_url ? `<img class="hero-image" src="${escapeHtml(rewriteMediaUrl(item.featured_image_url))}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async">` : ""}
        ${item.summary ? `<p class="article-summary">${escapeHtml(item.summary)}</p>` : ""}
        <section class="section">
          <div class="section-content">${autoLinkHtml(cleanHtml(item.content || ""), { used: linked, excludeHref })}</div>
        </section>
        ${isFrontendAdmin() ? `<div class="article-actions">
          <a class="button secondary" href="${DIRECTUS}/admin/content/site_content/${item.id}" target="_blank" rel="noreferrer">Edit page</a>
        </div>` : ""}
      `;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
      if (!context.skipRoute) setRoute({ page: item.slug });
    }

    async function openBlogPost(item, context = {}) {
      if (!context.skipHistory) rememberPanel();
      clearBiographyPathOverlay();
      item = await hydrateBlogPost(item);
      state.activeContent = null;
      clearActiveTimelineEvent();
      const linked = new Set();
      const excludeHref = `#blog/${item.slug}`;
      articleHeadEl.innerHTML = `
        <p class="article-kicker">${escapeHtml(context.source || "Blog post")}</p>
        <h2>${escapeHtml(item.title)}</h2>
        ${item.published_at ? `<p class="article-meta">${escapeHtml(new Date(item.published_at).toLocaleDateString())}</p>` : ""}
      `;
      articleBodyEl.innerHTML = `
        ${item.featured_image_url ? `<img class="hero-image" src="${escapeHtml(rewriteMediaUrl(item.featured_image_url))}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async">` : ""}
        ${item.summary ? `<p class="article-summary">${escapeHtml(item.summary)}</p>` : ""}
        <section class="section">
          <div class="section-content">${autoLinkHtml(cleanHtml(item.content || ""), { used: linked, excludeHref })}</div>
        </section>
        ${isFrontendAdmin() ? `<div class="article-actions">
          <a class="button secondary" href="${DIRECTUS}/admin/content/blog_posts/${item.id}" target="_blank" rel="noreferrer">Edit blog post</a>
        </div>` : ""}
      `;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
      if (!context.skipRoute) setRoute({ blog: item.slug });
    }

    function contributorActivity(profile) {
      const profileVisits = (state.publicVisits || [])
        .filter(visit => profileIdentityIds(profile).has(Number(relationId(visit.member_profile))));
      const visitedSites = PROFILE_UTILS.uniqueVisitRecords(profileVisits)
        .map(visit => state.siteBySlug.get(visit.site_slug || ""))
        .filter(Boolean);
      return PROFILE_UTILS.profileActivityFromCollections(profile, {
        comments: state.publicComments,
        commentVotes: state.commentVotes,
        pointEvents: state.profilePointEvents,
        visits: profileVisits,
        purchases: state.artworkPrintPurchases,
        suggestions: state.siteSuggestions,
        visitedSites,
        waterwaySites: visitedSites.filter(site => desktopThemeSet(site).has("water, shore, or fishing")),
        historicRecords: visitedSites.filter(site => desktopThemeSet(site).has("a deed or colonial record"))
      }, {
        relationId,
        normalizeCommentStatus,
        identityIds: profileIdentityIds(profile),
        identityNames: profileIdentityNames(profile)
      });
    }

    const isProfileBanned = PROFILE_UTILS.isProfileBanned;

    const profileIdentityNames = PROFILE_UTILS.profileIdentityNames;

    function profileIdentityIds(profile = currentContributorProfile()) {
      return PROFILE_UTILS.profileIdentityIds(profile, state.contributorProfiles, PROFILE_UTILS.profileIdentityOptions(state.contributorSession, {
        relationId,
        extraNames: [state.contributorSession?.displayName, state.contributorSession?.email]
      }));
    }

    function publicContributorProfiles() {
      return PROFILE_UTILS.publicContributorProfiles(state.contributorProfiles);
    }

    const money = PROFILE_UTILS.money;
    const supportMonths = PROFILE_UTILS.supportMonths;
    const supporterLine = PROFILE_UTILS.supporterLine;

    function profileFromComment(comment) {
      if (!comment) return null;
      const existing = state.contributorProfiles.find(profile => Number(profile.id) === Number(comment.member_profile));
      if (existing) return existing;
      return {
        id: comment.member_profile || "",
        slug: "",
        display_name: comment.author_name || "Contributor",
        username: comment.author_email || "",
        role_label: "Contributor",
        bio: "",
        public_profile: true,
        account_enabled: true,
        _commentOnly: true
      };
    }

    function profileFromMapStory(story) {
      if (!story) return null;
      const profileId = relationId(story.member_profile);
      if (!profileId) return null;
      return state.contributorProfiles.find(profile => Number(profile.id) === Number(profileId)) || null;
    }

    function profileStats(profile, options = {}) {
      const activity = contributorActivity(profile);
      const ids = canonicalPointProfileIds(profile);
      const pointsSyncing = Boolean(ids.length && !profilePointEventsAreCanonical(profile));
      const stats = PROFILE_UTILS.profileStatsFromActivity(activity, {
        homelandsCount: distinctVisitedHomelandCount(activity.visitedSites || []),
        languageLearned: learnedLanguageWords(profile).length,
        languageCorrectAttempts: languageCorrectAttemptCount(profile),
        loginRewards: loginRewardStats(profile),
        supporterPoints: profile?.is_monthly_supporter ? supportMonths(profile) * 100 : 0,
        emptyMilestone: "New Contributor"
      });
      const showPointsSyncing = pointsSyncing && options.syncRemote !== false;
      if (showPointsSyncing) {
        ensureCanonicalProfilePointEvents(profile).then(updated => {
          if (!updated) return;
          renderContributorLoginButton();
          if (articleEl?.classList.contains("open") && articleBodyEl?.querySelector("[data-contributors-panel]")) {
            openContributors();
            return;
          }
          if (articleEl?.classList.contains("open") && (["login", "profile"].includes(state.activeContent?.type) || articleBodyEl?.querySelector("[data-login-panel]"))) {
            openContributorLogin();
          }
        });
      }
      return { ...stats, pointsSyncing: showPointsSyncing };
    }

    function profileStatsHtml(profile) {
      const stats = profileStats(profile);
      const careBadges = careBadgesForStats(stats);
      const publicSiteCount = PROFILE_UTILS.publicSiteTotal(state.sites);
      const pills = [
        escapeHtml(stats.milestone),
        stats.commentsCount ? { type: "comments", label: `${stats.commentsCount} comment${stats.commentsCount === 1 ? "" : "s"}` } : "",
        stats.visitsCount ? PROFILE_UTILS.visitProgressLabel(stats.visitsCount, publicSiteCount) : "",
        stats.languageLearned ? { type: "language", label: `Language Work (${stats.languageLearned})` } : "",
        stats.loginStreak ? `${stats.loginStreak} day signed-in visit streak` : "",
        stats.commentUpvotes ? `${stats.commentUpvotes} helpful vote${stats.commentUpvotes === 1 ? "" : "s"}` : "",
        stats.purchasesCount ? `${stats.purchasesCount} support badge${stats.purchasesCount === 1 ? "" : "s"}` : ""
      ].filter(Boolean);
      return `
        <div class="profile-stats" aria-label="Contributor activity">
          ${pills.map(pill => typeof pill === "object"
            ? `<button class="profile-pill" type="button" ${pill.type === "language" ? "data-show-profile-language" : "data-show-profile-comments"} aria-expanded="false">${escapeHtml(pill.label)}</button>`
            : `<span class="profile-pill">${pill}</span>`).join("")}
        </div>
        <div class="care-badges" aria-label="Care badges">${careBadges.map(badge => `<span class="care-badge">${escapeHtml(badge)}</span>`).join("")}</div>
      `;
    }

    function profileTrackerHtml(profile) {
      const stats = profileStats(profile);
      const rows = PROFILE_UTILS.profileTrackerRowsFromStats(stats);
      if (!rows.length) return "";
      return `
        <div class="profile-trackers" aria-label="Profile trackers">
          ${rows.map(row => `<span class="profile-tracker">${escapeHtml(row.text)}</span>`).join("")}
        </div>
      `;
    }

    function profileHoverHtml(profile) {
      if (!profile) return "";
      const stats = profileStats(profile);
      const badges = careBadgesForStats(stats).slice(0, 3);
      const name = profile.display_name || profile.username || "Contributor";
      const avatar = directusAssetUrl(profile.avatar);
      const bio = publicCleanText(profile.headline || profile.bio || profile.role_label || "Community contributor").slice(0, 170);
      const pointLabel = `${stats.points} ${stats.points === 1 ? "point" : "points"}`;
      return `
        <div class="profile-hover-top">
          <span class="comment-avatar" aria-hidden="true">${avatar ? `<img src="${escapeHtml(avatar)}" alt="">` : escapeHtml(name.slice(0, 1) || "?")}</span>
          <span>
            <strong>${escapeHtml(name)}</strong>
            <p>${escapeHtml(pointLabel)}</p>
          </span>
        </div>
        <p>${escapeHtml(bio)}</p>
        ${badges.length ? `<div class="profile-hover-badges">${badges.map(badge => `<span>${escapeHtml(badge)}</span>`).join("")}</div>` : ""}
      `;
    }

    let profileHoverHideTimer = null;

    function showProfileHover(profileId, anchor) {
      if (!profileHoverEl || !profileId || !anchor) return;
      window.clearTimeout(profileHoverHideTimer);
      const label = anchor.textContent?.trim() || anchor.getAttribute("aria-label")?.replace(/^Open\s+|\s+profile$/gi, "").trim() || "";
      const normalizedLabel = label.toLowerCase();
      const profile = state.contributorProfiles.find(item =>
        String(item.id) === String(profileId)
        || item.slug === String(profileId)
        || item.username === String(profileId)
        || (normalizedLabel && String(item.display_name || "").toLowerCase() === normalizedLabel)
        || (normalizedLabel && String(item.name || "").toLowerCase() === normalizedLabel)
      );
      if (!profile) return;
      profileHoverEl.innerHTML = profileHoverHtml(profile);
      const rect = anchor.getBoundingClientRect();
      const width = Math.min(280, window.innerWidth - 24);
      const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left));
      const top = Math.max(12, Math.min(window.innerHeight - 170, rect.bottom + 8));
      profileHoverEl.style.width = `${width}px`;
      profileHoverEl.style.left = `${left}px`;
      profileHoverEl.style.top = `${top}px`;
      profileHoverEl.classList.add("show");
      profileHoverEl.setAttribute("aria-hidden", "false");
    }

    function hideProfileHover() {
      if (!profileHoverEl) return;
      window.clearTimeout(profileHoverHideTimer);
      profileHoverEl.classList.remove("show");
      profileHoverEl.setAttribute("aria-hidden", "true");
    }

    function scheduleHideProfileHover() {
      window.clearTimeout(profileHoverHideTimer);
      profileHoverHideTimer = window.setTimeout(hideProfileHover, 180);
    }

    function profileCommentsSectionHtml(profile, hidden = true) {
      const comments = contributorActivity(profile).comments.slice(-12).reverse();
      return `
        <section class="section profile-comments-section" data-profile-comments ${hidden ? "hidden" : ""}>
          <h3>Comments</h3>
          ${comments.length ? comments.map(comment => `
            <article class="profile-activity-item">
              <span class="profile-activity-date">${comment.created_at ? escapeHtml(new Date(comment.created_at).toLocaleString()) : "Date unavailable"}</span>
              <button class="button secondary" type="button" data-site-slug="${escapeHtml(comment.site_slug || comment.source_slug || "")}" data-jump-comment="${escapeHtml(comment.id || "")}">View comment on ${escapeHtml(comment.site_title || comment.source_title || "article")}</button>
              <p>${escapeHtml(comment.comment || "")}</p>
            </article>
            ${directusAssetUrl(comment.comment_image) ? `<img class="hero-image" src="${escapeHtml(directusAssetUrl(comment.comment_image))}" alt="" loading="lazy" decoding="async">` : ""}
          `).join("") : `<p class="article-summary">No comments yet.</p>`}
        </section>
      `;
    }

    function profileLanguageSectionHtml(profile, hidden = true) {
      const words = learnedLanguageWords(profile)
        .slice()
        .sort((a, b) => String(b.learned_at || "").localeCompare(String(a.learned_at || "")));
      return `
        <section class="section profile-language-section" data-profile-language ${hidden ? "hidden aria-hidden=\"true\"" : "aria-hidden=\"false\""}>
          <h3>Language Work</h3>
          ${words.length ? `
            <div class="language-learned-list">
              ${words.map(word => `
                <div class="language-learned-row">
                  <div>
                    <strong>${escapeHtml(word.english || "")}</strong>
                    <span>English text</span>
                  </div>
                  <div>
                    <strong>${escapeHtml(word.algonquian || "")}</strong>
                    <span>${escapeHtml(word.source || "Source saved with quiz")}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          ` : `<p class="article-summary">Language quiz words answered correctly will appear here with their source.</p>`}
        </section>
      `;
    }

    function profileActivityFeedItems(profile, limit = 14) {
      const activity = contributorActivity(profile);
      return PROFILE_UTILS.profileActivityFeedItems(activity, {
        activityPreview,
        activityDateValue,
        languageWords: learnedLanguageWords(profile),
        loginRecords: remoteLoginRewardRecords(profile),
        includePurchases: true,
        commentPreviewLength: 110,
        limit
      });
    }

    function profileActivityFeedHtml(profile, limit = 14) {
      const items = profileActivityFeedItems(profile, limit);
      return `
        <section class="section profile-mini-feed">
          <h3>Recent Activity</h3>
          ${items.length ? items.map(item => `
            <article class="profile-feed-row">
              <div>
                <span class="profile-activity-date">${escapeHtml(item.type)} - ${escapeHtml(activityDateLabel(item.date))}</span>
                ${item.site_slug ? `<button class="profile-feed-title" type="button" data-site-slug="${escapeHtml(item.site_slug)}">${escapeHtml(item.title)}</button>` : `<strong>${escapeHtml(item.title)}</strong>`}
                ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}
              </div>
              <span class="profile-feed-points" aria-label="${Number(item.points) || 0} points earned">+${Number(item.points) || 0}</span>
            </article>
          `).join("") : `<p class="article-summary">Activity will appear here after comments, visits, daily signed-in visits, or language quizzes.</p>`}
        </section>
      `;
    }

    function careBadgesForStats(stats) {
      return PROFILE_UTILS.profileCareBadgesFromStats(stats, { emptyBadge: "New Learner" });
    }

    function profilePointTotal(stats = {}) {
      return PROFILE_UTILS.profilePointTotal(stats);
    }

    function profilePointsBreakdownHtml(stats) {
      const totalLabel = profilePointTotal(stats);
      const rows = PROFILE_UTILS.profilePointBreakdownRows(stats, {
        splitSupport: true,
        labels: {
          comments: "Approved comments",
          helpful: "Helpful votes on comments",
          visit: "Visited places",
          login: "Daily signed-in visits"
        }
      });
      return `
        <div class="points-breakdown" data-points-breakdown hidden>
          ${rows.length ? rows.map(([label, value]) => `<div class="points-breakdown-row"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`).join("") : `<div class="points-breakdown-row"><span>New contributor</span><strong>0</strong></div>`}
          <div class="points-breakdown-row"><span>Total</span><strong>${totalLabel}</strong></div>
        </div>
      `;
    }

    function contributorInviteForm(profile = {}) {
      if (!profile?.id || state.contributorSession?.pending) return "";
      return `
        <details class="section contributor-invite-panel">
          <summary>Invite a friend</summary>
          <p class="article-meta">Email a one-time invite code. If your friend registers with the code tied to that email, you receive 100 profile points.</p>
          <div class="field">
            <label for="contributor-invite-name">Friend name (optional)</label>
            <input id="contributor-invite-name" data-account-invite-name autocomplete="name">
          </div>
          <div class="field">
            <label for="contributor-invite-email">Friend email</label>
            <input id="contributor-invite-email" data-account-invite-email autocomplete="email" inputmode="email">
          </div>
          <div class="field">
            <label for="contributor-invite-message">Personal message (optional)</label>
            <textarea id="contributor-invite-message" data-account-invite-message maxlength="600"></textarea>
          </div>
          <button class="button" type="button" data-send-account-invite>Email invite</button>
          <p class="form-status" data-account-invite-status hidden></p>
        </details>
      `;
    }

    async function sendContributorInviteFromSection(section) {
      const profile = currentContributorProfile();
      if (!profile?.id || state.contributorSession?.pending) {
        showBanner("Login as an approved contributor before inviting a friend.");
        return;
      }
      const button = section.querySelector("[data-send-account-invite]");
      const statusEl = section.querySelector("[data-account-invite-status]");
      const originalLabel = button?.textContent || "Email invite";
      const invitedName = section.querySelector("[data-account-invite-name]")?.value.trim() || "";
      const invitedEmail = normalizeAccountEmail(section.querySelector("[data-account-invite-email]")?.value || "");
      const message = section.querySelector("[data-account-invite-message]")?.value.trim() || "";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invitedEmail)) {
        showBanner("Enter your friend's email.");
        return;
      }
      if (button) {
        button.disabled = true;
        button.textContent = "Sending...";
      }
      setInlineStatus(section, "[data-account-invite-status]", "Sending invite email...");
      try {
        await FEEDBACK_UTILS.sendAccountInviteEmail({
          inviterProfile: profile.id,
          inviterEmail: state.contributorSession?.email || profile.username || "",
          inviterName: profile.display_name || state.contributorSession?.displayName || state.contributorSession?.email || "Contributor",
          invitedName,
          invitedEmail,
          message
        }, { appUrl: window.location.href, platform: "desktop" });
        section.querySelector("[data-account-invite-name]").value = "";
        section.querySelector("[data-account-invite-email]").value = "";
        section.querySelector("[data-account-invite-message]").value = "";
        setInlineStatus(section, "[data-account-invite-status]", "Invite emailed. The code can be used once by that email address.", "success");
        showBanner("Invite emailed.");
      } catch (error) {
        setInlineStatus(section, "[data-account-invite-status]", error.message || "Could not send invite.", "error");
        showBanner(error.message || "Could not send invite.");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      }
    }

    function contributorTierProgressHtml(stats = {}) {
      const points = profilePointTotal(stats);
      const progress = PROFILE_UTILS.contributorProgressToNextTier(points);
      const current = progress.current;
      const next = progress.next;
      const unlockText = next ? next.unlocks : current.unlocks;
      const percent = Math.max(0, Math.min(100, Number(progress.percent) || 0));
      return `
        <div class="contributor-tier-card" aria-label="Contributor tier progress">
          <div class="contributor-tier-heading">
            <span>
              <strong>${escapeHtml(current.label)}</strong>
              <em>${escapeHtml(PROFILE_UTILS.contributorTierSummary(points))}</em>
            </span>
            <span class="contributor-tier-points">${points} / ${next ? Number(next.minPoints || 0) : points}</span>
          </div>
          <div class="contributor-tier-meter" role="progressbar" aria-valuemin="0" aria-valuemax="${next ? Number(next.minPoints || 0) : points}" aria-valuenow="${points}" title="${escapeHtml(unlockText)}">
            <span style="width:${percent.toFixed(1)}%"></span>
            ${next ? `<button type="button" class="contributor-tier-unlock" title="${escapeHtml(unlockText)}" aria-label="${escapeHtml(`At ${next.minPoints} points: ${unlockText}`)}">${escapeHtml(String(next.minPoints))}</button>` : `<button type="button" class="contributor-tier-unlock earned" title="${escapeHtml(current.unlocks)}" aria-label="${escapeHtml(current.unlocks)}">max</button>`}
          </div>
          <p>${next ? `${progress.remaining} point${progress.remaining === 1 ? "" : "s"} until ${next.label}. ${unlockText}.` : `Top tier unlocked: ${current.unlocks}.`}</p>
        </div>
      `;
    }

    function contributorDailyState(profile, kind) {
      const stats = profileStats(profile, { syncRemote: false });
      const records = kind === "stories" ? state.mapStories : state.publicComments;
      return PROFILE_UTILS.contributorDailyLimitState({
        kind,
        records,
        profile,
        points: profilePointTotal(stats),
        relationId,
        identityIds: profileIdentityIds(profile),
        dateFields: ["created_at", "public_submitted_at", "submitted_at"],
        statusFilter: record => {
          const status = normalizeCommentStatus(record);
          if (kind === "stories") return !["deleted", "expired", "hidden", "rejected"].includes(status);
          return !["deleted", "rejected"].includes(status);
        }
      });
    }

    function contributorLimitNoteHtml(profile, kind = "comments") {
      const stateForKind = contributorDailyState(profile, kind);
      const label = kind === "stories" ? "map stories" : "comments";
      const limitText = PROFILE_UTILS.contributorLimitLabel(stateForKind.limit);
      return `<p class="contributor-limit-note">${escapeHtml(`${stateForKind.tier.label}: ${stateForKind.used} of ${limitText} ${label} used today.`)}</p>`;
    }

    function contributorCanUseDailyAction(profile, kind = "comments") {
      const limitState = contributorDailyState(profile, kind);
      if (!limitState.reached) return true;
      const label = kind === "stories" ? "map stories" : "comments";
      showBanner(`Daily ${label} limit reached for ${limitState.tier.label}. Earn points to unlock more.`);
      return false;
    }

    function monthlySupportCurrent() {
      const configured = Number(state.supportSettings?.current_monthly_support);
      if (configured > 0) return configured;
      return state.contributorProfiles.reduce((sum, profile) => {
        return sum + (profile.is_monthly_supporter ? Number(profile.support_monthly_amount || 0) : 0);
      }, 0);
    }

    function renderSupportGoal() {
      if (!supportDonateButtonEl) return;
      const settings = state.supportSettings;
      supportDonateButtonEl.hidden = false;
      supportDonateButtonEl.title = settings?.show_support_goal
        ? `${settings.title || "Support On This Site"}: ${money(monthlySupportCurrent())} / ${money(settings.monthly_goal || 200)} monthly`
        : "Support On This Site";
    }

    const activityDateValue = SHARED_UTILS.activityDateValue;

    function activityDateLabel(value) {
      return ACTIVITY_UTILS.dateLabel(value, { includeTime: true });
    }

    function activityLastSeenKey() {
      const profile = currentContributorProfile?.();
      const key = profile?.id || state.contributorSession?.profileId || state.contributorSession?.email || "public";
      return ACTIVITY_UTILS.lastSeenKey("nli-activity-last-seen", key);
    }

    function latestActivityItemsForUnread() {
      return latestActivityFeed(60);
    }

    function unreadActivityCount() {
      const seen = ACTIVITY_UTILS.readSeen(activityLastSeenKey());
      return ACTIVITY_UTILS.unreadCount(latestActivityItemsForUnread(), seen);
    }

    function markActivitySeen() {
      ACTIVITY_UTILS.writeSeen(activityLastSeenKey(), latestActivityItemsForUnread());
      updateActivityUnreadBadge();
    }

    function updateActivityUnreadBadge() {
      const badges = document.querySelectorAll("[data-activity-unread-badge]");
      if (!badges.length) return;
      const count = unreadActivityCount();
      badges.forEach(badge => {
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.hidden = count <= 0;
        badge.classList.toggle("show", count > 0);
      });
      activityRestoreBtn?.setAttribute(
        "aria-label",
        count > 0 ? `Show community activity, ${count} new updates` : "Show community activity"
      );
    }

    function activityPreview(text, limit = 135) {
      return ACTIVITY_UTILS.preview(text, { limit, cleanText: stripHtml, preferSentence: true });
    }

    function latestCommentsActivity(limit = 5) {
      return state.publicComments
        .filter(commentIsPublic)
        .sort((a, b) => activityDateValue(b.created_at) - activityDateValue(a.created_at))
        .slice(0, limit)
        .map(comment => ({
          kind: "comment",
          label: ACTIVITY_UTILS.commentLabel(normalizeCommentSourceType(comment)),
          title: comment.source_title || comment.site_title || "Article",
          meta: `${comment.author_name || "Contributor"} - ${activityDateLabel(comment.created_at)}`,
          preview: comment.comment || "",
          date: comment.created_at,
          image: directusAssetUrl(comment.comment_image),
          imageFallback: "",
          sourceType: normalizeCommentSourceType(comment) || "site",
          slug: comment.source_slug || comment.site_slug || "",
          id: comment.source_id || comment.site || "",
          commentId: comment.id || ""
        }));
    }

    function latestSuggestionActivity(limit = 8) {
      return (state.siteSuggestions || [])
        .filter(item => item.title && String(item.status || "").toLowerCase() === "approved")
        .sort((a, b) => activityDateValue(ACTIVITY_UTILS.suggestionDate(b)) - activityDateValue(ACTIVITY_UTILS.suggestionDate(a)))
        .slice(0, limit)
        .map(item => ({
          kind: "suggestion",
          label: ACTIVITY_UTILS.suggestionLabel(item),
          title: item.title,
          meta: `${item.author_name || "Contributor"} - ${activityDateLabel(ACTIVITY_UTILS.suggestionDate(item))}`,
          preview: item.review_note || "A contributor sent information for On This Site.",
          date: ACTIVITY_UTILS.suggestionDate(item),
          image: directusAssetUrl(item.suggested_image),
          imageFallback: "",
          id: item.id || ""
        }));
    }

    function latestHistoricMomentActivity(limit = 8) {
      return (state.timelineEvents || [])
        .map(item => {
          const sourceSite = item.source_type === "site"
            ? (state.siteBySlug.get(item.source_slug) || state.siteById.get(Number(item.source_id)))
            : null;
          const sourceWiki = item.source_type === "wiki"
            ? (state.wikiBySlug.get(item.source_slug) || state.wikiById?.get?.(Number(item.source_id)))
            : null;
          const sourceItem = sourceSite || sourceWiki;
          if (sourceWiki && ACTIVITY_UTILS.wikiActivityLabel(sourceWiki) === "New Article") return null;
          const date = latestEditedDate(sourceItem);
          return {
            kind: "historic-moment",
            label: "Historic moment updated",
            title: item.title || item.source_title || "Historic moment",
            meta: activityDateLabel(date),
            preview: item.description || item.source_excerpt || item.citation || "",
            date,
            image: sourceSite ? listingImage(sourceSite) : "",
            imageFallback: sourceSite ? listingThumbFallback(sourceSite) : "",
            slug: item.source_slug || "",
            sourceType: item.source_type || "",
            id: item.id || ""
          };
        })
        .filter(Boolean)
        .filter(item => item.title && item.date && item.slug)
        .sort((a, b) => activityDateValue(b.date) - activityDateValue(a.date) || String(a.title).localeCompare(String(b.title)))
        .slice(0, limit);
    }

    function latestMapStoryActivity(limit = 5) {
      return activeMapStories()
        .sort((a, b) => activityDateValue(b.created_at) - activityDateValue(a.created_at))
        .slice(0, limit)
        .map(story => ({
          kind: "map-story",
          label: "Visitor story",
          title: story.attached_site_title || "Shared from the map",
          meta: `${story.author_name || "Contributor"} - ${MAP_STORY_UTILS.timeLabel(story, state.mapStoryVotes, MAP_STORY_RULES)}`,
          preview: story.caption || "",
          date: story.created_at,
          image: directusAssetUrl(story.photo),
          imageFallback: "",
          id: story.id || ""
        }));
    }

    function latestUpdatedActivity(limit = 8) {
      const items = [
        ...state.sites
          .filter(item => item.slug && item.slug !== "address-result")
          .map(item => {
            const pinned = ACTIVITY_UTILS.activityIsPinned(item);
            return {
              kind: "site",
              label: pinned ? ACTIVITY_UTILS.activityPinLabel(item) : ACTIVITY_UTILS.siteActivityLabel(item),
              title: pinned && item.activity_pin_title ? item.activity_pin_title : item.title,
              meta: activityDateLabel(latestEditedDate(item)),
              preview: pinned && item.activity_pin_preview ? item.activity_pin_preview : item.summary || item.introduction_content || safeSiteSubtitle(item) || "",
              date: latestEditedDate(item),
              pinUntil: item.activity_pin_until,
              pinned,
              image: listingImage(item),
              imageFallback: listingThumbFallback(item),
              slug: item.slug,
              id: item.id || ""
            };
          }),
        ...state.wikiArticles.map(item => ({
          kind: "wiki",
          label: ACTIVITY_UTILS.wikiActivityLabel(item),
          title: item.title,
          meta: activityDateLabel(ACTIVITY_UTILS.wikiActivityDate(item)),
          preview: item.summary || item.content || "",
          date: ACTIVITY_UTILS.wikiActivityDate(item),
          activityPriority: ACTIVITY_UTILS.wikiActivityPriority(item),
          image: firstContentImage(item.content || ""),
          imageFallback: "",
          slug: item.slug,
          id: item.id || ""
        })),
        ...state.blogPosts.map(item => ({
          kind: "blog",
          label: "Blog post",
          title: item.title,
          meta: activityDateLabel(item.published_at),
          preview: item.summary || "",
          date: item.published_at,
          image: MEDIA_UTILS.cleanImageUrl(item.featured_image_url) ? rewriteMediaUrl(item.featured_image_url) : "",
          imageFallback: MEDIA_UTILS.cleanImageUrl(item.featured_image_url) ? absoluteMediaUrl(item.featured_image_url) : "",
          slug: item.slug
        })),
        ...state.siteContent
          .filter(item => !/cart|checkout|my-account|shop|search|wp-/i.test(`${item.slug || ""} ${item.title || ""}`))
          .map(item => ({
            kind: item.content_type === "post" ? "site-post" : "page",
            label: item.content_type === "post" ? "Post updated" : "Page updated",
            title: item.title,
            meta: activityDateLabel(item.wp_date),
            preview: item.summary || item.content || "",
            date: item.wp_date,
            image: MEDIA_UTILS.cleanImageUrl(item.featured_image_url) ? rewriteMediaUrl(item.featured_image_url) : "",
            imageFallback: MEDIA_UTILS.cleanImageUrl(item.featured_image_url) ? absoluteMediaUrl(item.featured_image_url) : "",
            slug: item.slug
          })),
        ...state.calendarEvents.map(item => {
          const pinned = ACTIVITY_UTILS.activityIsPinned(item);
          const eventTargetSlug = item.related_site_slug || item.source_slug || item.slug;
          return {
            kind: "event",
            label: pinned ? ACTIVITY_UTILS.activityPinLabel(item) : "Event / exhibit",
            title: pinned && item.activity_pin_title ? item.activity_pin_title : item.title,
            meta: activityDateLabel(ACTIVITY_UTILS.eventActivityDate(item)),
            preview: pinned && item.activity_pin_preview ? item.activity_pin_preview : item.summary || item.body || item.venue || "",
            date: ACTIVITY_UTILS.eventActivityDate(item),
            pinUntil: item.activity_pin_until,
            pinned,
            image: directusAssetUrl(item.cover_image),
            imageFallback: "",
            slug: eventTargetSlug,
            id: item.id || ""
          };
        })
      ];
      const seen = new Set();
      const dedupedItems = items
        .filter(item => item.title && item.slug)
        .filter(item => {
          const key = `${String(item.slug).toLowerCase()}|${normalizeComparisonText(item.title || "")}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      return ACTIVITY_UTILS.sortByRecentActivity(dedupedItems).slice(0, limit);
    }

    function latestActivityFeed(limit = 18) {
      return ACTIVITY_UTILS.mergeRecentActivity([
        latestCommentsActivity(30),
        ...(isCurrentAdminReviewer() ? [] : [latestSuggestionActivity(30)]),
        latestMapStoryActivity(30),
        latestHistoricMomentActivity(30),
        latestUpdatedActivity(30)
      ], { limit });
    }

    function isCurrentAdminReviewer() {
      const email = normalizeAccountEmail(state.contributorSession?.email || currentContributorProfile()?.username || "");
      return isFrontendAdmin() || email === "jeremynative@gmail.com";
    }

    function adminAccountRegistrationsRequest() {
      if (!isCurrentAdminReviewer()) return Promise.resolve({ data: [] });
      return fetchJson(`/items/mobile_account_registrations?limit=-1&sort=-created_at&fields=${INITIAL_ACCOUNT_REGISTRATION_FIELDS}`);
    }

    function adminSuggestionNotifications() {
      if (!isCurrentAdminReviewer()) return [];
      return (state.siteSuggestions || [])
        .map(item => {
          const feedback = ACTIVITY_UTILS.suggestionIsFeedback(item);
          const status = String(item.status || "pending").toLowerCase();
          return {
            kind: "suggestion-review",
            id: String(item.id || ""),
            title: feedback ? "Feedback needs review" : status === "pending" ? "Suggested site needs review" : "Site suggestion",
            label: `${feedback ? "Feedback" : "Suggested site"} - ${status}`,
            meta: `${item.author_name || item.author_email || "Contributor"} - ${activityDateLabel(ACTIVITY_UTILS.suggestionDate(item))}${item.suggested_image ? " - screenshot attached" : ""}`,
            preview: activityPreview(item.introduction || item.review_note || "A contributor sent information for On This Site.", 160),
            date: ACTIVITY_UTILS.suggestionDate(item),
            image: directusAssetUrl(item.suggested_image),
            actionId: String(item.id || ""),
            pendingReview: status === "pending"
          };
        });
    }

    function pendingAccountNotifications() {
      if (!isCurrentAdminReviewer()) return [];
      return (state.accountRegistrations || [])
        .filter(item => ACTIVITY_UTILS.registrationNeedsReview(item))
        .map(item => ({
          kind: "account-review",
          id: String(item.id || ""),
          title: "New contributor account",
          label: "Account request",
          meta: `${item.display_name || item.email || item.email_normalized || "New account"} - ${activityDateLabel(ACTIVITY_UTILS.registrationDate(item))}`,
          preview: activityPreview(item.review_note || item.email || item.email_normalized || "A contributor account is waiting for review.", 160),
          date: ACTIVITY_UTILS.registrationDate(item)
        }));
    }

    function personalNotificationItems() {
      const profile = currentContributorProfile();
      const profileIds = profileIdentityIds(profile);
      if (!profileIds.size) return [];
      const ownCommentIds = new Set(
        state.publicComments
          .filter(comment => profileIds.has(Number(relationId(comment.member_profile))))
          .map(comment => String(comment.id || ""))
      );
      const ownPlantIds = new Set(
        state.plantObservations
          .filter(plant => profileIds.has(Number(relationId(plant.member_profile))))
          .map(plant => String(plant.id || ""))
      );
      const seen = new Set();
      return state.publicComments
        .filter(commentIsPublic)
        .filter(comment => !profileIds.has(Number(relationId(comment.member_profile))))
        .map(comment => {
          const commentId = String(comment.id || "");
          const parentId = String(comment.parent_comment || "");
          const sourceType = normalizeCommentSourceType(comment);
          const sourceId = String(comment.source_id || "");
          const isDirectReply = profileIds.has(Number(relationId(comment.reply_to_profile)));
          const isReplyToOwnComment = parentId && ownCommentIds.has(parentId);
          const isPlantComment = /plant/.test(sourceType) && sourceId && ownPlantIds.has(sourceId);
          if (!isDirectReply && !isReplyToOwnComment && !isPlantComment) return null;
          if (seen.has(commentId)) return null;
          seen.add(commentId);
          return {
            kind: "comment",
            id: commentId,
            commentId,
            sourceType: sourceType || "site",
            slug: comment.source_slug || comment.site_slug || "",
            title: isPlantComment ? "Someone commented on your flower" : "Someone replied to you",
            label: isPlantComment ? "Flower note" : "Reply",
            meta: `${comment.author_name || "Contributor"} - ${activityDateLabel(comment.created_at)}`,
            preview: activityPreview(comment.comment || "", 160),
            date: comment.created_at
          };
        })
        .filter(Boolean);
    }

    function latestNotifications(limit = 30) {
      return ACTIVITY_UTILS.mergeRecentActivity([personalNotificationItems(), adminSuggestionNotifications(), pendingAccountNotifications()], { limit });
    }

    function notificationLastSeenKey() {
      const profile = currentContributorProfile?.();
      const key = profile?.id || state.contributorSession?.profileId || state.contributorSession?.email || "public";
      return ACTIVITY_UTILS.lastSeenKey("nli-notification-last-seen", key);
    }

    function unreadNotificationCount() {
      const seen = ACTIVITY_UTILS.readSeen(notificationLastSeenKey());
      return ACTIVITY_UTILS.unreadCount(latestNotifications(60), seen);
    }

    function updateNotificationUnreadBadge() {
      const count = unreadNotificationCount();
      document.querySelectorAll("[data-notification-unread-badge]").forEach(badge => {
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.hidden = count <= 0;
        badge.classList.toggle("show", count > 0);
      });
      notificationRestoreBtn?.setAttribute("aria-label", count > 0 ? `Show notifications, ${count} new` : "Show notifications");
    }

    function markNotificationsSeen() {
      ACTIVITY_UTILS.writeSeen(notificationLastSeenKey(), latestNotifications(60));
      updateNotificationUnreadBadge();
    }

    function notificationItemHtml(item) {
      return `
        <article class="notification-item" data-notification-kind="${escapeHtml(item.kind)}" data-notification-id="${escapeHtml(item.id || "")}" data-notification-source-type="${escapeHtml(item.sourceType || "")}" data-notification-slug="${escapeHtml(item.slug || "")}" data-notification-comment-id="${escapeHtml(item.commentId || "")}">
          <button class="notification-main" type="button" data-open-notification>
            ${item.image ? `<span class="notification-thumb"><img src="${escapeHtml(item.image)}" alt="" loading="lazy" decoding="async" onerror="this.closest('.notification-thumb')?.remove();"></span>` : ""}
            <span class="activity-meta">${escapeHtml(item.label)} - ${escapeHtml(item.meta || "Recently")}</span>
            <strong>${escapeHtml(item.title || "Notification")}</strong>
            ${item.preview ? `<p class="activity-preview">${escapeHtml(item.preview)}</p>` : ""}
          </button>
          ${item.kind === "suggestion-review" && item.pendingReview ? `<div class="notification-actions">
            <button type="button" data-notification-action="approve">Approve</button>
            <button type="button" data-notification-action="decline">Deny</button>
          </div>` : ""}
        </article>
      `;
    }

    function renderNotificationPanel() {
      if (!notificationPanelEl || !notificationBodyEl) return;
      notificationPanelEl.hidden = !state.notificationPanelOpen;
      const items = latestNotifications(30);
      notificationBodyEl.innerHTML = items.length
        ? items.map(notificationItemHtml).join("")
        : `<p class="article-meta">No notifications right now.</p>`;
      updateNotificationUnreadBadge();
    }

    async function handleSuggestionReview(id, action) {
      if (!isCurrentAdminReviewer()) return showBanner("Only an editor can review suggestions.");
      const suggestion = state.siteSuggestions.find(item => String(item.id) === String(id));
      if (!suggestion) return showBanner("That suggestion is not loaded.");
      const nextStatus = action === "approve" ? "approved" : "declined";
      const stampedNote = `${suggestion.review_note || ""}\n${nextStatus === "approved" ? "Approved" : "Denied"} from public app by ${state.contributorSession?.email || "admin"} on ${new Date().toISOString()}.`.trim();
      try {
        await triggerAdminNotificationAction(action === "approve" ? "approve" : "decline", {
          id: suggestion.id,
          status: nextStatus,
          review_note: stampedNote
        });
        suggestion.status = nextStatus;
        suggestion.review_note = stampedNote;
        renderNotificationPanel();
        renderActivityPanel();
        showBanner(nextStatus === "approved" ? "Approved and archived." : "Denied and archived.");
      } catch (error) {
        showBanner("Could not update review status.");
      }
    }

    function openNotificationItem(card) {
      const kind = card?.dataset.notificationKind || "";
      if (kind === "suggestion-review") {
        const suggestion = state.siteSuggestions.find(item => String(item.id) === String(card.dataset.notificationId));
        if (!suggestion) return;
        const coords = Array.isArray(suggestion.geojson?.coordinates)
          ? suggestion.geojson.coordinates
          : [Number(suggestion.longitude), Number(suggestion.latitude)];
        if (coords.every(Number.isFinite)) state.map?.flyTo?.({ center: coords, zoom: Math.max(state.map.getZoom?.() || 9, 13), duration: 850 });
        return;
      }
      if (kind === "account-review") {
        const id = card?.dataset.notificationId || "";
        if (id) window.open(`${DIRECTUS}/admin/content/mobile_account_registrations/${encodeURIComponent(id)}`, "_blank", "noopener,noreferrer");
        return;
      }
      if (kind === "comment") {
        openActivityItem({
          dataset: {
            activityKind: "comment",
            activitySlug: card.dataset.notificationSlug || "",
            activitySourceType: card.dataset.notificationSourceType || "",
            activityCommentId: card.dataset.notificationCommentId || ""
          }
        });
      }
    }

    function activityImageHtml(item) {
      const image = item.image || "";
      if (!image) return "";
      const fallback = item.imageFallback || "";
      const onerror = fallback && fallback !== image
        ? imageErrorAction(fallback)
        : imageErrorAction();
      return `<span class="activity-thumb"><img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async" onerror="${onerror}"></span>`;
    }

    function activityItemHtml(item) {
      return `
        <button class="activity-item${item.image ? " has-image" : ""}${item.pinned ? " is-pinned" : ""}" type="button" data-activity-kind="${escapeHtml(item.kind)}" data-activity-slug="${escapeHtml(item.slug || "")}" data-activity-source-type="${escapeHtml(item.sourceType || "")}" data-activity-id="${escapeHtml(item.id || "")}" data-activity-title="${escapeHtml(item.title || "")}" data-activity-comment-id="${escapeHtml(item.commentId || "")}">
          ${activityImageHtml(item)}
          <span class="activity-copy">
          <span class="activity-meta">${item.pinned ? `<span class="activity-pin-icon" aria-label="Pinned">${ACTIVITY_ICONS.pin}</span>` : ""}${escapeHtml(item.label)} - ${escapeHtml(item.meta || "Recently")}</span>
          <strong>${escapeHtml(item.title || "Untitled")}</strong>
          ${activityPreview(item.preview) ? `<p class="activity-preview">${escapeHtml(activityPreview(item.preview))}</p>` : ""}
          </span>
        </button>
      `;
    }

    function stopActivityProgressiveRender() {
      if (state.activityRenderTimer) window.clearTimeout(state.activityRenderTimer);
      state.activityRenderTimer = null;
      state.activityRenderToken += 1;
    }

    function appendActivityItemsProgressively(groupEl, feed, startIndex, token) {
      if (!groupEl || token !== state.activityRenderToken) return;
      const chunkSize = startIndex < 6 ? 1 : 2;
      const nextItems = feed.slice(startIndex, startIndex + chunkSize);
      if (!nextItems.length) {
        startActivityAutoScroll();
        return;
      }
      groupEl.insertAdjacentHTML("beforeend", nextItems.map(activityItemHtml).join(""));
      syncFloatingPanelLayout();
      const nextIndex = startIndex + nextItems.length;
      if (nextIndex < feed.length) {
        state.activityRenderTimer = window.setTimeout(() => appendActivityItemsProgressively(groupEl, feed, nextIndex, token), 320);
      } else {
        state.activityRenderTimer = null;
        startActivityAutoScroll();
      }
    }

    function normalizedActivitySlug(value) {
      return String(value || "").trim().toLowerCase();
    }

    async function fetchActivityRecord(collection, mapNames = {}, { slug = "", id = "" } = {}) {
      const key = slug || id;
      if (!key) return null;
      try {
        const item = await fetchFirstItem(collection, slug ? "slug" : "id", key);
        return item ? replaceCachedItem(mapNames.list, mapNames.id, mapNames.slug, item) : null;
      } catch {
        return null;
      }
    }

    function findActivityRecord(list, slugMap, idMap, { slug = "", id = "", title = "" } = {}) {
      const normalizedSlug = normalizedActivitySlug(slug);
      if (normalizedSlug && slugMap?.has?.(normalizedSlug)) return slugMap.get(normalizedSlug);
      if (slug && slugMap?.has?.(slug)) return slugMap.get(slug);
      if (id !== undefined && id !== null && id !== "") {
        if (idMap?.has?.(String(id))) return idMap.get(String(id));
        const numericId = Number(id);
        if (Number.isFinite(numericId) && idMap?.has?.(numericId)) return idMap.get(numericId);
      }
      if (normalizedSlug) {
        const byNormalizedSlug = (list || []).find(entry => normalizedActivitySlug(entry.slug) === normalizedSlug);
        if (byNormalizedSlug) return byNormalizedSlug;
      }
      const normalizedTitle = normalizeComparisonText(title || "");
      if (normalizedTitle) return (list || []).find(entry => normalizeComparisonText(entry.title || "") === normalizedTitle) || null;
      return null;
    }

    async function resolveActivityWikiTarget({ slug = "", id = "", title = "" } = {}) {
      return findActivityRecord(state.wikiArticles, state.wikiBySlug, state.wikiById, { slug, id, title }) ||
        await fetchActivityRecord("wiki_articles", { list: "wikiArticles", id: "wikiById", slug: "wikiBySlug" }, { slug, id });
    }

    async function resolveActivitySiteTarget({ slug = "", id = "", title = "" } = {}) {
      return findActivityRecord(state.sites, state.siteBySlug, state.siteById, { slug, id, title }) ||
        await fetchActivityRecord("sites", { list: "sites", id: "siteById", slug: "siteBySlug" }, { slug, id });
    }

    const ACTIVITY_ICONS = {
      pin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l5 5-4 1-4 6-3-3 6-4 1-5Z"></path><path d="M9 13l-5 5"></path></svg>`,
      newspaper: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h12a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3V5Z"></path><path d="M8 8h6"></path><path d="M8 12h7"></path><path d="M8 16h4"></path><path d="M19 8h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1"></path></svg>`,
      collapse: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6l8 6-8 6"></path></svg>`,
      hide: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"></path><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path><path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c5 0 8.5 4.1 10 8-.5 1.3-1.3 2.6-2.3 3.7"></path><path d="M6.1 6.2C4.2 7.6 2.8 9.7 2 12c1.5 3.9 5 8 10 8 1.7 0 3.2-.4 4.5-1.1"></path></svg>`
    };

    function setupActivityAutoScroll() {
      if (!activityBodyEl || state.activityScrollListenersReady) return;
      activityBodyEl.addEventListener("mouseenter", () => {
        state.activityScrollPaused = true;
      });
      activityBodyEl.addEventListener("mouseleave", () => {
        state.activityScrollPaused = false;
      });
      activityBodyEl.addEventListener("focusin", () => {
        state.activityScrollPaused = true;
      });
      activityBodyEl.addEventListener("focusout", () => {
        state.activityScrollPaused = false;
      });
      state.activityScrollListenersReady = true;
    }

    function startActivityAutoScroll() {
      window.clearInterval(state.activityScrollTimer);
      window.clearTimeout(state.activityScrollResetTimer);
      state.activityScrollResetTimer = null;
      setupActivityAutoScroll();
      if (!activityBodyEl || activityPanelEl?.hidden || activityPanelEl?.classList.contains("collapsed")) return;
      state.activityScrollTimer = window.setInterval(() => {
        if (state.activityScrollPaused || document.hidden) return;
        const maxScroll = activityBodyEl.scrollHeight - activityBodyEl.clientHeight;
        if (maxScroll <= 8) return;
        if (activityBodyEl.scrollTop >= maxScroll - 1) {
          if (state.activityScrollResetTimer) return;
          state.activityScrollResetTimer = window.setTimeout(() => {
            if (!state.activityScrollPaused) activityBodyEl.scrollTo({ top: 0, behavior: "smooth" });
            state.activityScrollResetTimer = null;
          }, 1800);
          return;
        }
        activityBodyEl.scrollTop += 1;
      }, 120);
    }

    function renderActivityPanel(options = {}) {
      if (!activityPanelEl || !activityBodyEl) return;
      stopActivityProgressiveRender();
      const preserveBody = options.preserveBody === true && activityBodyEl.hasChildNodes();
      const isMobileViewport = window.innerWidth <= 860;
      const articleOpen = articleEl?.classList.contains("open") && !isMobileViewport;
      document.body.classList.toggle("article-panel-open", Boolean(articleOpen));
      const compactActivityViewport = window.innerWidth > 860 && window.innerWidth <= 1280;
      const hidden = (isMobileViewport && !state.activityForceOpen) ||
        (compactActivityViewport && !state.activityForceOpen) ||
        localStorage.getItem("nli-latest-activity-hidden") === "1" ||
        (articleOpen && state.activityHiddenForArticle && !state.activityForceOpen);
      const collapsed = false;
      activityPanelEl.hidden = hidden;
      activityRestoreBtn.hidden = !hidden;
      activityRestoreBtn.innerHTML = `${ACTIVITY_ICONS.newspaper}<span class="activity-unread-badge" data-activity-unread-badge hidden></span>`;
      activityRestoreBtn.title = isMobileViewport || compactActivityViewport ? "Community activity" : "Show community activity";
      activityRestoreBtn.setAttribute("aria-label", isMobileViewport || compactActivityViewport ? "Community activity" : "Show community activity");
      activityPanelEl.classList.toggle("collapsed", collapsed);
      document.body.classList.toggle("activity-panel-expanded", !hidden && !collapsed);
      document.body.classList.toggle("activity-panel-collapsed", !hidden && collapsed);
      activityCollapseBtn.innerHTML = ACTIVITY_ICONS.hide;
      activityCollapseBtn.title = "Hide community activity";
      activityCollapseBtn.setAttribute("aria-label", "Hide community activity");
      if (preserveBody) {
        updateActivityUnreadBadge();
        updateNotificationUnreadBadge();
        syncFloatingPanelLayout();
        if (!hidden) startActivityAutoScroll();
        return;
      }
      const feed = latestActivityFeed(18);
      const progressive = !hidden && options.progressive !== false && feed.length > 1;
      const initialCount = hidden ? 0 : progressive ? Math.max(1, Math.min(Number(options.initialCount) || 1, feed.length)) : feed.length;
      const initialFeed = feed.slice(0, initialCount);
      activityBodyEl.innerHTML = `
        <section class="activity-group" aria-label="Most recent archive activity" data-activity-progressive-group>
          ${initialFeed.length ? initialFeed.map(activityItemHtml).join("") : `<p class="article-meta">Recent public activity will appear here.</p>`}
        </section>
      `;
      updateActivityUnreadBadge();
      updateNotificationUnreadBadge();
      syncFloatingPanelLayout();
      if (progressive && initialCount < feed.length) {
        const token = state.activityRenderToken;
        const groupEl = activityBodyEl.querySelector("[data-activity-progressive-group]");
        state.activityRenderTimer = window.setTimeout(() => appendActivityItemsProgressively(groupEl, feed, initialCount, token), Number(options.nextDelay) || 220);
      } else {
        startActivityAutoScroll();
      }
    }

    async function openActivityItem(item) {
      const kind = item?.dataset.activityKind || "";
      const slug = item?.dataset.activitySlug || "";
      const sourceType = item?.dataset.activitySourceType || "";
      const commentId = item?.dataset.activityCommentId || "";
      const activityId = item?.dataset.activityId || "";
      const activityTitle = item?.dataset.activityTitle || "";
      const wikiTarget = await resolveActivityWikiTarget({
        slug,
        id: kind === "wiki" ? activityId : "",
        title: activityTitle
      });
      const siteTarget = await resolveActivitySiteTarget({
        slug,
        id: kind === "site" ? activityId : "",
        title: activityTitle
      });
      if (kind === "comment") {
        if (sourceType === "support") {
          openSupportPage();
          return;
        }
        if (sourceType === "wiki" && wikiTarget) {
          openWikiArticle(wikiTarget, { source: "Latest comment" });
          revealActivityComment(commentId);
          return;
        }
        if (sourceType === "blog" && state.blogBySlug.has(slug)) {
          openBlogPost(state.blogBySlug.get(slug), { source: "Latest comment" });
          revealActivityComment(commentId);
          return;
        }
        if (slug && state.siteBySlug.has(slug)) {
          openListing(state.siteBySlug.get(slug), { source: "Latest comment" });
          revealActivityComment(commentId);
          return;
        }
      }
      if (kind === "map-story") {
        const story = state.mapStories.find(item => String(item.id) === String(activityId));
        if (story && MAP_STORY_UTILS.isActive(story, state.mapStoryVotes, MAP_STORY_RULES)) {
          focusMapStory(story, { duration: 950 });
          return openMapStoryPanel(story);
        }
        renderActivityPanel();
        showBanner("That visitor story is no longer active.");
        return;
      }
      if (kind === "suggestion") {
        const suggestion = state.siteSuggestions.find(entry => String(entry.id) === String(activityId));
        const coords = Array.isArray(suggestion?.geojson?.coordinates)
          ? suggestion.geojson.coordinates
          : [Number(suggestion?.longitude), Number(suggestion?.latitude)];
        if (coords.every(Number.isFinite)) {
          state.map?.flyTo?.({ center: coords, zoom: Math.max(state.map.getZoom?.() || 9, 12), duration: 900 });
          return showBanner(`${suggestion.title || "Suggested site"} is marked on the map.`);
        }
      }
      if (kind === "historic-moment") {
        if (sourceType === "wiki" && wikiTarget) return openWikiArticle(wikiTarget, { source: "Historic moment", timelineEventId: activityId });
        if (sourceType === "site" && siteTarget) return openListing(siteTarget, { source: "Historic moment", timelineEventId: activityId });
      }
      if (kind === "wiki" && wikiTarget) return openWikiArticle(wikiTarget, { source: "Latest activity" });
      if (kind === "site" && siteTarget) return openListing(siteTarget, { source: "Latest activity" });
      if (kind === "site" && wikiTarget) return openWikiArticle(wikiTarget, { source: "Latest activity" });
      if (kind === "blog" && state.blogBySlug.has(slug)) return openBlogPost(state.blogBySlug.get(slug), { source: "Latest activity" });
      if (kind === "site-post" && state.contentBySlug.has(slug)) return openSiteContent(state.contentBySlug.get(slug), { source: "Latest activity" });
      if (kind === "page" && state.contentBySlug.has(slug)) return openSiteContent(state.contentBySlug.get(slug), { source: "Latest activity" });
      if (kind === "event" && siteTarget) return openListing(siteTarget, { source: "Latest activity" });
      if (kind === "event" && state.eventBySlug.has(slug)) return openCalendarEvent(state.eventBySlug.get(slug), { source: "Latest activity" });
      showBanner("That activity item is not available yet.");
    }

    function revealActivityComment(commentId) {
      if (!commentId) return;
      let attempts = 0;
      const tryReveal = () => {
        attempts += 1;
        const discussion = articleBodyEl.querySelector(".discussion-section");
        const panel = discussion?.querySelector("[data-discussion-panel]");
        const toggle = discussion?.querySelector("[data-toggle-discussion]");
        if (panel) panel.hidden = false;
        if (toggle) toggle.setAttribute("aria-expanded", "true");
        const target = articleBodyEl.querySelector(`[data-comment-card="${CSS.escape(String(commentId))}"]`);
        if (!target) {
          if (attempts < 12) window.setTimeout(tryReveal, 120);
          return;
        }
        target.scrollIntoView({ block: "center", behavior: "smooth" });
        target.classList.add("activity-highlight");
        window.setTimeout(() => target.classList.remove("activity-highlight"), 2600);
      };
      window.setTimeout(tryReveal, 120);
    }

    function currentContributorProfile() {
      const session = state.contributorSession;
      if (!session) return null;
      const profileMatchesSessionEmail = profile => {
        const sessionEmail = String(session.email || "").trim().toLowerCase();
        const profileEmail = String(profile?.username || profile?.email || "").trim().toLowerCase();
        return !sessionEmail || !profileEmail || sessionEmail === profileEmail;
      };
      const applySessionOverrides = profile => profile ? {
        ...profile,
        display_name: profile.display_name || session.displayName || session.display_name,
        headline: profile.headline || session.headline || "",
        bio: profile.bio || session.bio || "",
        location_label: profile.location_label || session.location_label || session.locationLabel || "",
        website_url: profile.website_url || session.website_url || session.websiteUrl || "",
        public_profile: profile.public_profile ?? session.public_profile,
        profile_status: profile.profile_status || session.profile_status
      } : null;
      if (session.profileId) {
        const profile = bestContributorProfile(state.contributorProfiles.filter(profile => Number(profile.id) === Number(session.profileId)));
        if (profile && profileMatchesSessionEmail(profile) && !isProfileBanned(profile) && (profile.account_enabled !== false || PROFILE_UTILS.isAdminContributor(profile, { email: session.email }))) {
          return applySessionOverrides(profile) || null;
        }
        if (profile && (isProfileBanned(profile) || !profileMatchesSessionEmail(profile) || profile.account_enabled === false)) {
          saveContributorSession({ ...session, profileId: null });
        }
      }
      const email = String(session.email || "").toLowerCase();
      if (email === "jeremynative@gmail.com" || email === "jeremydennis") {
        const profile = state.contributorProfiles.find(profile => profile.slug === "jeremy-dennis");
        if (isProfileBanned(profile)) return null;
        if (profile) return applySessionOverrides(profile) || null;
      }
      const matchedProfile = bestContributorProfile(state.contributorProfiles.filter(profile =>
        String(profile.username || "").toLowerCase() === email
      ));
      if (isProfileBanned(matchedProfile)) return null;
      return applySessionOverrides(matchedProfile) || {
        id: session.profileId || null,
        slug: "",
        display_name: session.displayName || session.email || "Contributor",
        username: session.email || "",
        role_label: session.roleLabel || (session.pending ? "Pending contributor" : "Contributor"),
        headline: session.pending ? "Contributor account request pending review." : "",
        bio: session.bio || "",
        location_label: session.locationLabel || "",
        website_url: session.websiteUrl || "",
        public_profile: session.public_profile ?? true,
        profile_status: session.profile_status || "published"
      };
    }

    function currentContributorIdentity() {
      const profile = currentContributorProfile();
      const session = state.contributorSession || {};
      const email = normalizeAccountEmail(session.email || profile?.username || profile?.email || "");
      const name = String(profile?.display_name || session.displayName || session.display_name || profile?.username || email || "Contributor").trim();
      return {
        profile,
        name: name === "undefined" ? "Contributor" : name,
        email: email === "undefined" ? "" : email
      };
    }

    function isAdminContributor(profile = currentContributorProfile()) {
      return Boolean(PROFILE_UTILS.isAdminContributor(profile, { email: state.contributorSession?.email }));
    }

    function isFrontendAdmin() {
      return adminMode || isAdminContributor();
    }

    function hasContributorWriteSession() {
      return PROFILE_UTILS.hasContributorWriteSession(state.contributorSession);
    }

    function requireContributorWriteSession(action = "save this") {
      const profile = currentContributorProfile();
      if (!profile) throw new Error("Login required.");
      if (state.contributorSession?.pending) throw new Error("Your contributor account is waiting for approval before saving points.");
      if (!hasContributorWriteSession()) {
        const message = PROFILE_UTILS.contributorWriteSessionMessage(action);
        expireContributorSession(message);
        throw new Error(message);
      }
      return profile;
    }

    async function ensureContributorWriteSession(action = "save this") {
      const profile = requireContributorWriteSession(action);
      await directusClient.ensureAuthSession({
        requireAuth: true,
        missingAuthMessage: PROFILE_UTILS.contributorWriteSessionMessage(action),
        authExpiredMessage: PROFILE_UTILS.contributorWriteSessionMessage(action)
      });
      return profile;
    }

    function contributorWritePrompt() {
      if (state.contributorSession?.pending) return "Your contributor account is waiting for approval before posting comments.";
      if (state.contributorSession && !hasContributorWriteSession()) return "Log in again to comment. Approved comments appear on contributor profiles.";
      return "Log in with an approved contributor account to comment.";
    }

    function approvedContributorCanPost(profile = currentContributorProfile()) {
      return Boolean(profile && !state.contributorSession?.pending && hasContributorWriteSession() && (profile.id || state.contributorSession?.registrationId || state.contributorSession?.email));
    }

    function activeEditableContent(kind, slug) {
      if (kind === "wiki") return state.wikiBySlug.get(slug) || state.wikiArticles.find(article => article.slug === slug) || null;
      if (kind === "timeline") return state.timelineById.get(String(slug)) || state.timelineEvents.find(event => String(event.id) === String(slug)) || null;
      return state.siteBySlug.get(slug) || state.sites.find(site => site.slug === slug) || null;
    }

    async function openFrontendEditor(kind, slug) {
      if (!isFrontendAdmin()) {
        showBanner("Log in with the project editor account to edit content.");
        return;
      }
      const item = activeEditableContent(kind, slug);
      if (!item?.id) {
        showBanner("This content is not editable yet.");
        return;
      }
      const hydrated = kind === "wiki" ? await hydrateWiki(item) : item;
      const formHost = articleBodyEl.querySelector(`[data-open-frontend-editor="${CSS.escape(kind)}"][data-editor-slug="${CSS.escape(slug)}"]`)?.closest(".article-actions");
      if (formHost) formHost.outerHTML = frontendEditorHtml(kind, hydrated);
      else articleBodyEl.insertAdjacentHTML("beforeend", frontendEditorHtml(kind, hydrated));
      articleBodyEl.querySelector("[data-frontend-editor]")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    function frontendEditorPayload(form) {
      const kind = form.dataset.frontendEditor;
      const fields = frontendEditorFields(kind);
      return Object.fromEntries(fields.filter(([, , type]) => type !== "image").map(([field]) => [field, form.elements[field]?.value?.trim() || ""]));
    }

    async function frontendEditorUploadPayload(form, status) {
      if (form.dataset.frontendEditor !== "site") return {};
      const image = form.elements.listing_image_file?.files?.[0] || null;
      if (!image) return {};
      if (!/^image\//i.test(image.type || "")) throw new Error("Use an image file for the header.");
      if (status) status.textContent = "Uploading header image...";
      const uploadFile = await prepareJpegUploadImage(image, "site-suggestion-image");
      const uploaded = await uploadDirectusFile(uploadFile, `Site header - ${form.dataset.editorSlug || "On This Site"}`, { requireAuth: true });
      const fileId = SHARED_DIRECTUS.normalizeUploadFileId?.(uploaded) || null;
      if (!fileId) throw new Error("Header image upload did not return a file id.");
      return { listing_image_file: fileId };
    }

    function mergeUpdatedContent(kind, slug, updated) {
      if (kind === "wiki") {
        state.wikiBySlug.set(slug, { ...(state.wikiBySlug.get(slug) || {}), ...updated });
        const index = state.wikiArticles.findIndex(article => article.slug === slug);
        if (index >= 0) state.wikiArticles[index] = { ...state.wikiArticles[index], ...updated };
        clearRelatedSiteCaches();
        return;
      }
      if (kind === "timeline") {
        state.timelineById.set(String(slug), { ...(state.timelineById.get(String(slug)) || {}), ...updated });
        const index = state.timelineEvents.findIndex(event => String(event.id) === String(slug));
        if (index >= 0) state.timelineEvents[index] = { ...state.timelineEvents[index], ...updated };
        clearRelatedSiteCaches();
        clearTimelineEventCaches();
        clearEraKeyCaches();
        return;
      }
      state.siteBySlug.set(slug, { ...(state.siteBySlug.get(slug) || {}), ...updated });
      const siteIndex = state.sites.findIndex(site => site.slug === slug);
      if (siteIndex >= 0) state.sites[siteIndex] = { ...state.sites[siteIndex], ...updated };
      const mapIndex = state.mapSites.findIndex(site => site.slug === slug);
      if (mapIndex >= 0) state.mapSites[mapIndex] = { ...state.mapSites[mapIndex], ...updated };
      clearRelatedSiteCaches();
    }

    async function saveFrontendEditor(form) {
      const kind = form.dataset.frontendEditor;
      const id = form.dataset.editorId;
      const slug = form.dataset.editorSlug;
      const status = form.querySelector("[data-frontend-editor-status]");
      if (!isFrontendAdmin() || !id || !slug) return;
      status.textContent = "Saving...";
      try {
        const contentPayload = {
          ...frontendEditorPayload(form),
          ...await frontendEditorUploadPayload(form, status)
        };
        if (!state.contributorSession?.token) throw new Error("Content editing needs the editor password.");
        const targetCollection = kind === "wiki" ? "wiki_articles" : kind === "timeline" ? "timeline_events" : "sites";
        const saved = await patchDirectusItem(targetCollection, id, contentPayload, { requireAuth: true });
        const updated = { ...activeEditableContent(kind, slug), ...contentPayload, ...(saved?.data || {}) };
        mergeUpdatedContent(kind, slug, updated);
        status.textContent = "Saved.";
        showBanner("Updates saved.");
        if (kind === "wiki") openWikiArticle(updated, { focus: false, skipHistory: true, skipRoute: true });
        else if (kind === "timeline") {
          const active = state.activeContent;
          if (active?.type === "site" && state.siteBySlug.has(active.slug)) openListing(state.siteBySlug.get(active.slug), { focus: false, skipHistory: true, skipRoute: true, timelineEventId: slug });
          else if (active?.type === "wiki" && state.wikiBySlug.has(active.slug)) openWikiArticle(state.wikiBySlug.get(active.slug), { focus: false, skipHistory: true, skipRoute: true, timelineEventId: slug });
        } else openListing(updated, { focus: false, skipHistory: true, skipRoute: true });
      } catch (error) {
        console.error(error);
        status.textContent = "Could not save. Make sure this account has content edit permission.";
        showBanner("Could not save edits.");
      }
    }

    const normalizeCommentStatus = COMMENT_UTILS.normalizeStatus;
    const normalizeCommentSourceType = COMMENT_UTILS.normalizeSourceType;

    function commentIsPublic(comment) {
      return COMMENT_UTILS.isPublicActivityComment(comment, { normalizeStatus: normalizeCommentStatus });
    }

    function commentVisibleToCurrentViewer(comment) {
      const authorProfile = state.contributorProfiles.find(profile => Number(profile.id) === Number(comment.member_profile));
      return COMMENT_UTILS.visibleToViewer(comment, {
        authorProfile,
        isProfileBanned,
        normalizeStatus: normalizeCommentStatus,
        adminMode,
        profile: currentContributorProfile(),
        viewerEmail: state.contributorSession?.email
      });
    }

    function contributorProfileForm(profile) {
      return `
        <details class="section" data-profile-editor>
          <summary>Edit profile</summary>
          <div class="field">
            <label for="desktop-profile-display-name">Display name</label>
            <input id="desktop-profile-display-name" data-profile-display-name value="${escapeHtml(profile.display_name || "")}">
          </div>
          <div class="field">
            <label for="desktop-profile-headline">Headline</label>
            <input id="desktop-profile-headline" data-profile-headline value="${escapeHtml(profile.headline || "")}">
          </div>
          <div class="field">
            <label for="desktop-profile-location">Location</label>
            <input id="desktop-profile-location" data-profile-location value="${escapeHtml(profile.location_label || "")}">
          </div>
          <div class="field">
            <label for="desktop-profile-website">Website or social link</label>
            <input id="desktop-profile-website" data-profile-website value="${escapeHtml(profile.website_url || "")}">
          </div>
          <div class="field">
            <label for="desktop-profile-bio">Biography</label>
            <textarea id="desktop-profile-bio" data-profile-bio rows="7">${escapeHtml(profile.bio || "")}</textarea>
          </div>
          <label class="toggle">
            <input data-profile-public type="checkbox" ${profile.public_profile === false ? "" : "checked"}>
            Show my contributor profile publicly
          </label>
          <button class="button" type="button" data-save-contributor-profile>Save profile</button>
        </details>
      `;
    }

    async function saveContributorProfile(section) {
      const profile = currentContributorProfile();
      if (!profile?.id) {
        showBanner("This account request is not approved yet, so the public profile can only be saved after review.");
        return;
      }
      const payload = PROFILE_UTILS.profileEditorPayload(section, profile, {
        displayNameFallback: profile.display_name || "",
        includePublicProfile: true
      });
      const moderation = moderationCheck([payload.display_name, payload.headline, payload.bio].filter(Boolean).join(" "), "Your profile");
      if (!moderation.ok) {
        showBanner(moderation.message);
        return;
      }
      try {
        await patchDirectusItem("mobile_member_profiles", profile.id, payload, { requireAuth: true });
        Object.assign(profile, payload);
        saveContributorSession({
          ...state.contributorSession,
          displayName: payload.display_name,
          profileId: profile.id,
          headline: payload.headline,
          location_label: payload.location_label,
          website_url: payload.website_url,
          bio: payload.bio,
          public_profile: payload.public_profile,
          profile_status: payload.profile_status
        });
        renderContributorLoginButton();
        showBanner("Profile updated.");
        openContributorLogin();
      } catch (error) {
        renderContributorLoginButton();
        showBanner(error.message || "Could not save profile.");
        openContributorLogin();
      }
    }

    function discussionComments(sourceType, item) {
      return COMMENT_UTILS.commentsForSource(state.publicComments, sourceType, item, {
        isVisible: commentVisibleToCurrentViewer,
        matchOptions: {
          normalizeSourceType: normalizeCommentSourceType,
          matchSourceId: true,
          allowLegacySiteFallback: true
        },
        sortCompare: (a, b) => {
          const pa = Number(a.parent_comment || 0);
          const pb = Number(b.parent_comment || 0);
          if (pa !== pb) return pa - pb;
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        }
      });
    }

    function currentCommentReactionState(commentOrId) {
      return COMMENT_UTILS.reactionState(commentOrId, currentContributorProfile(), {
        canVote: !state.contributorSession?.pending,
        votes: state.commentVotes
      });
    }

    function commentReaction(commentId) {
      return currentCommentReactionState(commentId).active;
    }

    function commentReactionCounts(comment) {
      return currentCommentReactionState(comment).counts;
    }

    function rankedComments(comments) {
      return COMMENT_UTILS.ranked(comments, { reactionCounts: commentReactionCounts });
    }

    function commentReactionControls(comment) {
      return currentCommentReactionState(comment).controls;
    }

    function mergeCommentVoteRecords(records = []) {
      COMMENT_UTILS.mergeCommentVoteRecords(state.commentVotes, records);
      state.profileActivityCache = null;
    }

    async function refreshRemoteCommentVote(commentId, profileId) {
      return COMMENT_UTILS.refreshRemoteCommentVote(commentId, profileId, {
        fetchJson,
        fields: INITIAL_COMMENT_VOTE_FIELDS,
        merge: mergeCommentVoteRecords
      });
    }

    async function setCommentReaction(commentId, value) {
      const id = String(commentId);
      const profile = currentContributorProfile();
      if (!profile?.id || state.contributorSession?.pending) {
        showBanner("Log in to mark comments helpful or report a concern.");
        return;
      }
      const votedComment = state.publicComments.find(item => String(item.id) === id);
      if (currentViewerOwnsComment(votedComment)) {
        showBanner("You cannot vote on your own comment.");
        return;
      }
      if (commentReaction(id)) {
        showBanner("Your vote for this comment is already saved.");
        return;
      }
      await refreshRemoteCommentVote(id, profile.id).catch(() => null);
      if (commentReaction(id)) {
        showBanner("Your vote for this comment is already saved.");
        return;
      }
      const vote = COMMENT_UTILS.votePayload(id, value, profile);
      let created;
      try {
        created = await postDirectusItem("mobile_comment_votes", vote, { requireAuth: true });
      } catch (error) {
        await refreshRemoteCommentVote(id, profile.id).catch(() => null);
        if (commentReaction(id)) {
          showBanner("Your vote for this comment is already saved.");
          return;
        }
        showBanner("Comment votes are not available yet. Please try again later.");
        return;
      }
      const voteRecord = created?.data ? { ...vote, ...created.data } : vote;
      mergeCommentVoteRecords([voteRecord]);
      if (voteRecord.vote === "up" && votedComment?.member_profile) {
        await recordProfilePointEvent(COMMENT_UTILS.helpfulVotePointEvent({
          commentId: id,
          profileId: profile.id,
          comment: votedComment,
          voteRecord,
          points: PROFILE_UTILS.POINT_RULES.helpful_vote,
          relationId
        }));
      }
      document.querySelectorAll(`[data-comment-actions="${CSS.escape(id)}"]`).forEach(container => {
        const comment = state.publicComments.find(item => String(item.id) === id);
        if (comment) container.innerHTML = commentReactionControls(comment);
      });
      showBanner(value === "report" ? "Report saved." : "Comment vote saved.");
    }

    function currentViewerOwnsComment(comment) {
      const profile = currentContributorProfile();
      const viewerEmail = String(state.contributorSession?.email || profile?.username || "").toLowerCase();
      return COMMENT_UTILS.viewerOwnsComment(comment, { profile, viewerEmail });
    }

    async function deleteOwnComment(commentId) {
      const id = String(commentId || "");
      const comment = state.publicComments.find(item => String(item.id) === id);
      if (!comment || !currentViewerOwnsComment(comment)) {
        showBanner("Only the person who posted this comment can delete it.");
        return;
      }
      if (!window.confirm("Delete this comment from the public archive?")) return;
      if (!id.startsWith("pending-")) {
        try {
          await patchDirectusItem("mobile_comments", id, { status: "deleted" }, { requireAuth: true });
        } catch (error) {
          showBanner("Could not delete the comment yet. Please try again.");
          return;
        }
      }
      state.publicComments = state.publicComments.filter(item => String(item.id) !== id);
      renderActivityPanel();
      reopenActiveContent();
      showBanner("Comment deleted.");
    }

    function articleShareUrl(sourceType, item) {
      const url = new URL(window.location.href);
      url.search = "";
      if (sourceType === "wiki") url.searchParams.set("wiki", item.slug);
      else url.searchParams.set("site", item.slug);
      return url.href;
    }

    function shareIcon(name) {
      return ({
        copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg>',
        facebook: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 8.1h2.2V4.4c-.4-.1-1.7-.2-3.2-.2-3.2 0-5.4 2-5.4 5.6v3.1H4.3V17h3.5v7h4.3v-7h3.4l.6-4.1h-4V10.2c0-1.2.3-2.1 2.1-2.1Z"/></svg>',
        x: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.1 10.3 22.4 1h-2L13.2 9.1 7.5 1H.8l8.7 12.4L.8 23h2l7.6-8.5 6.1 8.5h6.7l-9.1-12.7Zm-2.7 3-1-1.4-7-9.2h3.1l5.6 7.4 1 1.4 7.4 9.8h-3.1l-6-8Z"/></svg>',
        threads: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.8 10.8c-.4-3.1-2.1-5-5-5-3.1 0-5.1 2.2-5.1 6.1 0 4 2.2 6.4 5.8 6.4 2.7 0 4.6-1.5 4.6-3.7 0-2.1-1.7-3.3-4.6-3.3-2 0-3.3.8-3.3 2.2 0 1.2 1 2 2.5 2 1.9 0 3.2-1.4 3.2-3.8 0-4.8-2.9-7.6-7.4-7.6"/><path d="M17.7 3.8c2.2 1.7 3.4 4.5 3.4 8.2 0 5.4-3.2 9.2-8.7 9.2-5.6 0-9.5-3.8-9.5-9.3 0-5.4 3.7-9.1 9-9.1 1.6 0 3 .3 4.2 1"/></svg>',
        bluesky: '<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12.8c-1.5-3-5.4-8.5-8.2-11C1.1-.7 0 0 0 3.4c0 .7.4 5.8.7 6.6.9 3 4.3 4 7.3 3.5-5.2.9-6.5 3.8-3.7 6.7 5.4 5.6 7.7-1.4 8.3-3.2.1-.3.2-.5.2-.4 0-.1.1.1.2.4.6 1.8 2.9 8.8 8.3 3.2 2.8-2.9 1.5-5.8-3.7-6.7 3 .5 6.4-.5 7.3-3.5.3-.8.7-5.9.7-6.6 0-3.4-1.1-4.1-3.8-1.6-2.8 2.5-6.7 8-8.2 11Z"/></svg>',
        email: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>'
      })[name] || "";
    }

    function sharePanel(sourceType, item) {
      const url = articleShareUrl(sourceType, item);
      const title = item.title || "On This Site - Native Long Island";
      const encodedUrl = encodeURIComponent(url);
      const encodedTitle = encodeURIComponent(title);
      const encodedText = encodeURIComponent(`${title} - On This Site`);
      return `
        <div class="share-panel" data-share-panel hidden>
          <button type="button" data-copy-share="${escapeHtml(url)}" title="Copy link" aria-label="Copy link">${shareIcon("copy")}<span class="sr-only">Copy link</span></button>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noreferrer" title="Share on Facebook" aria-label="Share on Facebook">${shareIcon("facebook")}<span class="sr-only">Facebook</span></a>
          <a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}" target="_blank" rel="noreferrer" title="Share on X" aria-label="Share on X">${shareIcon("x")}<span class="sr-only">X</span></a>
          <a href="https://www.threads.net/intent/post?text=${encodedText}%20${encodedUrl}" target="_blank" rel="noreferrer" title="Share on Threads" aria-label="Share on Threads">${shareIcon("threads")}<span class="sr-only">Threads</span></a>
          <a href="https://bsky.app/intent/compose?text=${encodedText}%20${encodedUrl}" target="_blank" rel="noreferrer" title="Share on Bluesky" aria-label="Share on Bluesky">${shareIcon("bluesky")}<span class="sr-only">Bluesky</span></a>
          <a href="mailto:?subject=${encodedTitle}&body=${encodedUrl}" title="Share by email" aria-label="Share by email">${shareIcon("email")}<span class="sr-only">Email</span></a>
        </div>
      `;
    }

    function plantObservationsForItem(sourceType, item) {
      if (sourceType !== "site" || !item) return [];
      return PLANT_UTILS.plantObservationsForSource(state.plantObservations, sourceType, item, {
        normalizeStatus: normalizeCommentStatus
      });
    }

    function knownPlantSpeciesList(item = {}) {
      return PLANT_UTILS.knownPlantSpeciesList(item);
    }

    function plantSpeciesKey(value = "") {
      return PLANT_UTILS.plantSpeciesKey(value, { normalizeText: normalizeComparisonText });
    }

    function knownPlantStatsText(item, observations) {
      return PLANT_UTILS.knownPlantStatsText(item, observations, {
          normalizeText: normalizeComparisonText,
          observationText: observation => `${observation.scientific_name || ""} ${observation.common_name || ""}`,
          approved: true,
          uniqueSingular: "plant type",
          uniquePlural: "plant types",
          uniqueVerb: "photographed",
          separator: " - "
        });
    }

    function plantObservationGuideMatch(observation) {
      const haystack = [
        observation.common_name,
        observation.scientific_name,
        observation.algonquian_word,
        observation.visitor_notes,
        observation.indigenous_context
      ].filter(Boolean).join(" ").toLowerCase();
      return LANGUAGE_QUIZ_WORDS.find(word =>
        haystack.includes(String(word.english || "").toLowerCase()) ||
        (word.algonquian && haystack.includes(String(word.algonquian).toLowerCase()))
      );
    }

    const PUBLIC_PLANT_REFERENCE = PLANT_UTILS.publicPlantReference;

    function publicPlantReferenceFor(observation = {}) {
      return PLANT_UTILS.publicPlantReferenceFor(observation, PUBLIC_PLANT_REFERENCE, {
        normalizeText: normalizeComparisonText
      });
    }

    function usefulPlantText(value = "") {
      return PLANT_UTILS.usefulPlantText(value, { cleanText: publicCleanText });
    }

    function publicPlantText(value, fallback = "") {
      return PLANT_UTILS.publicPlantText(value, fallback, { cleanText: publicCleanText });
    }

    function plantObservationFactRows(observation = {}) {
      const reference = publicPlantReferenceFor(observation);
      return PLANT_UTILS.plantObservationFactRows(observation, reference, {
          cleanText: publicCleanText,
          normalizeText: normalizeComparisonText,
          algonquianValue: observation.algonquian_word,
          sourceValue: observation.identification_source || observation.source_reference || "",
          guidanceValue: observation.edible_safety || observation.visitor_guidance || ""
        });
    }

    function plantObservationFactsHtml(observation = {}) {
      return `
        <div class="site-plant-facts">
          ${plantObservationFactRows(observation).map(([label, value]) => `
            <div class="site-plant-fact"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>
          `).join("")}
        </div>
      `;
    }

    function plantObservationGrid(sourceType, item) {
      const observations = plantObservationsForItem(sourceType, item);
      if (!observations.length) return "";
      return `
        <section class="site-plant-grid" aria-label="Plants reported at this site">
          <h4>Plants Identified at This Site</h4>
          <p class="site-plant-card-meta">${escapeHtml(knownPlantStatsText(item, observations))}</p>
          <div class="site-plant-cards">
            ${observations.slice(0, 8).map(observation => {
              const contributor = state.contributorProfiles.find(profile => Number(profile.id) === Number(relationId(observation.member_profile)));
              const contributorName = contributor?.display_name || observation.author_name || "Contributor";
              const contributorKey = contributor?.id || contributor?.slug || contributorName;
              const photo = directusAssetUrl(observation.photo);
              const common = publicPlantText(observation.common_name, "Plant observation").replace(/\s*\([^)]*needs review[^)]*\)/ig, "");
              const scientific = observation.scientific_name ? ` (${observation.scientific_name})` : "";
              const rawStatus = String(observation.identification_status || observation.native_status || "visitor suggested").replace(/_/g, " ");
              const status = /need|review|unavailable|pending/i.test(rawStatus) ? "visitor suggested" : rawStatus;
              const guideMatch = plantObservationGuideMatch(observation);
              const date = observation.public_submitted_at || observation.created_at;
              const context = publicPlantText(observation.indigenous_context || "");
              return `
                <article class="site-plant-card">
                  ${photo ? `<img src="${escapeHtml(photo)}" alt="" loading="lazy" decoding="async">` : `<div aria-hidden="true"></div>`}
                  <div class="site-plant-card-body">
                    <div class="site-plant-card-title">${escapeHtml(common)}${scientific ? `<span>${escapeHtml(scientific)}</span>` : ""}</div>
                    <p class="site-plant-card-meta">
                      ${contributor ? `<button class="site-plant-contributor" type="button" data-open-profile="${escapeHtml(contributorKey)}">${escapeHtml(contributorName)}</button>` : escapeHtml(contributorName)}
                      ${date ? ` - ${escapeHtml(new Date(date).toLocaleDateString())}` : ""}${observation.confidence ? ` - ${escapeHtml(String(observation.confidence))}% confidence` : ""}
                    </p>
                    <span class="site-plant-status-pill">${escapeHtml(status)}</span>
                    ${plantObservationFactsHtml(observation)}
                    ${context ? `<p class="site-plant-card-context">${escapeHtml(context)}</p>` : ""}
                    ${guideMatch ? `<button class="site-plant-card-action" type="button" data-wiki-slug="native-plants">Open plant guide</button>` : ""}
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        </section>
      `;
    }

    function articleQuoteRoot() {
      return articleBodyEl;
    }

    function decorateCurrentArticleForQuoteComments(sourceType, item) {
      window.requestAnimationFrame(() => {
        const root = articleQuoteRoot();
        if (!root) return;
        discussionComments(sourceType, item).forEach(comment => {
          const parsed = QUOTE_COMMENT_UTILS.parseCommentRecord(comment);
          if (!parsed.quote || !comment.id) return;
          QUOTE_COMMENT_UTILS.markQuote(root, parsed.quote, comment.id);
        });
      });
    }

    function ensureQuoteSelectionPopup() {
      let popup = document.getElementById("quote-selection-popup");
      if (popup) return popup;
      popup = document.createElement("button");
      popup.id = "quote-selection-popup";
      popup.className = "quote-selection-popup";
      popup.type = "button";
      popup.hidden = true;
      popup.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h7"/><path d="M7 11h10"/><path d="M7 15h6"/><path d="M5 3h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-8l-5 3v-3H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/></svg><span>Quote comment</span>';
      document.body.appendChild(popup);
      popup.addEventListener("click", () => startQuoteCommentFromSelection(popup.dataset.quote || "", popup.dataset.context || ""));
      return popup;
    }

    function hideQuoteSelectionPopup() {
      const popup = document.getElementById("quote-selection-popup");
      if (popup) popup.hidden = true;
    }

    function canOfferQuoteSelection() {
      const profile = currentContributorProfile();
      return Boolean(profile && !state.contributorSession?.pending && ["site", "wiki"].includes(state.activeContent?.type || ""));
    }

    function activeQuoteContextTitle() {
      const active = state.activeContent || {};
      if (active.type === "site") return state.siteBySlug.get(active.slug)?.title || "";
      if (active.type === "wiki") return state.wikiBySlug.get(active.slug)?.title || "";
      return articleBodyEl.querySelector(".discussion-section")?.dataset.discussionTitle || "";
    }

    function activeQuoteContextKind() {
      const activeType = state.activeContent?.type || "";
      if (activeType === "site") return "Site page";
      if (activeType === "wiki") return "Knowledgebase article";
      return "";
    }

    function activeQuoteHeaderContext() {
      return QUOTE_COMMENT_UTILS.compactHeaderContext([articleHeadEl, articleBodyEl]);
    }

    function quoteSelectionBlockedSelector() {
      return QUOTE_COMMENT_UTILS.quoteBlockedSelector([".share-panel", ".article-social-actions"]);
    }

    function quoteSelectionContext() {
      const blocked = quoteSelectionBlockedSelector();
      return QUOTE_COMMENT_UTILS.selectionContext(articleQuoteRoot(), {
        blockedSelector: blocked,
        parts: [activeQuoteContextKind(), activeQuoteContextTitle(), activeQuoteHeaderContext()]
      });
    }

    function updateQuoteSelectionPopup() {
      const popup = ensureQuoteSelectionPopup();
      if (!canOfferQuoteSelection()) {
        hideQuoteSelectionPopup();
        return;
      }
      const blocked = quoteSelectionBlockedSelector();
      const quote = QUOTE_COMMENT_UTILS.selectedQuoteText(articleQuoteRoot(), blocked);
      if (!quote || quote.length < 8) {
        hideQuoteSelectionPopup();
        return;
      }
      const popupRect = QUOTE_COMMENT_UTILS.selectionPopupRect();
      if (!popupRect) {
        hideQuoteSelectionPopup();
        return;
      }
      popup.dataset.quote = quote;
      popup.dataset.context = quoteSelectionContext();
      popup.hidden = false;
      popup.style.left = `${Math.min(window.innerWidth - 170, Math.max(12, popupRect.left + popupRect.width / 2 - 76))}px`;
      popup.style.top = `${Math.max(12, popupRect.top - 44)}px`;
    }

    function startQuoteCommentFromSelection(quote, context = "") {
      const cleanedQuote = QUOTE_COMMENT_UTILS.cleanQuoteText(quote);
      if (!cleanedQuote) return;
      const discussion = articleBodyEl.querySelector(".discussion-section");
      const panel = discussion?.querySelector("[data-discussion-panel]");
      const toggle = discussion?.querySelector("[data-toggle-discussion]");
      const input = discussion?.querySelector("[data-discussion-input]");
      if (!discussion || !input) {
        showBanner("Log in as an approved contributor to quote this text.");
        return;
      }
      if (panel) panel.hidden = false;
      if (toggle) toggle.setAttribute("aria-expanded", "true");
      const body = QUOTE_COMMENT_UTILS.stripQuotedCommentPrefix(input.value);
      input.value = QUOTE_COMMENT_UTILS.formatQuotedComment(cleanedQuote, body, context || quoteSelectionContext());
      hideQuoteSelectionPopup();
      window.getSelection()?.removeAllRanges?.();
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      input.closest(".discussion-composer")?.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    function jumpToQuoteComment(commentId) {
      const target = articleBodyEl.querySelector(`[data-comment-card="${CSS.escape(String(commentId))}"]`);
      if (!target) return;
      const panel = target.closest("[data-discussion-panel]");
      if (panel) panel.hidden = false;
      target.scrollIntoView({ block: "center", behavior: "smooth" });
      target.classList.add("quote-jump-highlight");
      window.setTimeout(() => target.classList.remove("quote-jump-highlight"), 1400);
    }

    function jumpToCommentQuote(commentId) {
      const target = articleBodyEl.querySelector(`[data-quote-comment-anchor="${CSS.escape(String(commentId))}"]`);
      if (!target) {
        showBanner("The quoted text is not visible in this section.");
        return;
      }
      target.scrollIntoView({ block: "center", behavior: "smooth" });
      target.classList.add("quote-jump-highlight");
      window.setTimeout(() => target.classList.remove("quote-jump-highlight"), 1400);
    }

    function discussionSection(sourceType, item) {
      const comments = discussionComments(sourceType, item);
      const profile = currentContributorProfile();
      const rootComments = rankedComments(comments.filter(comment => !comment.parent_comment));
      const repliesFor = parentId => rankedComments(comments.filter(comment => Number(comment.parent_comment) === Number(parentId)));
      const renderComment = (comment, depth = 0) => {
        const profile = profileFromComment(comment);
        const parent = depth ? comments.find(item => Number(item.id) === Number(comment.parent_comment)) : null;
        const parentProfile = parent ? profileFromComment(parent) : null;
        const parentName = parentProfile?.display_name || parent?.author_name || "";
        const attachment = directusAssetUrl(comment.comment_image);
        const name = profile?.display_name || comment.author_name || "Contributor";
        const avatar = directusAssetUrl(profile?.avatar);
        const initial = (name || "?").trim().slice(0, 1) || "?";
        const pending = false;
        const adminReviewUrl = `${DIRECTUS}/admin/content/mobile_comments/${comment.id}`;
        const profileId = profile?.id || comment.member_profile || "";
        const profileButtonAttrs = ` data-open-profile="${escapeHtml(profileId || name)}"`;
        const parsedComment = QUOTE_COMMENT_UTILS.parseCommentRecord(comment);
        const commentBody = parsedComment.body || (!parsedComment.quote ? comment.comment || "" : "");
        return `
          <article class="comment${depth ? " reply" : ""}${pending ? " pending" : ""}" data-comment-card="${escapeHtml(comment.id || "")}" style="margin-left:${Math.min(Math.max(depth - 1, 0), 2) * 24}px">
            <button class="comment-profile-link"${profileButtonAttrs} type="button" aria-label="Open ${escapeHtml(name)} profile">
              <span class="comment-avatar" aria-hidden="true">${avatar ? `<img src="${escapeHtml(avatar)}" alt="">` : escapeHtml(initial)}</span>
            </button>
            <div>
              <div class="comment-bubble">
                ${depth ? `<span class="reply-label">Reply${parentName ? ` to ${escapeHtml(parentName)}` : ""}</span>` : ""}
                <button class="comment-profile-name"${profileButtonAttrs} type="button">${escapeHtml(name)}</button>
                ${QUOTE_COMMENT_UTILS.quoteCommentButtonHtml(comment, parsedComment.quote, parsedComment.context)}
                ${commentBody ? `<p class="comment-text">${escapeHtml(commentBody)}</p>` : ""}
                ${attachment ? `<img class="comment-image" src="${escapeHtml(attachment)}" alt="" loading="lazy" decoding="async">` : ""}
              </div>
              <div class="comment-meta-row">
                <span>${comment.created_at ? escapeHtml(new Date(comment.created_at).toLocaleString()) : "Approved comment"}</span>
                ${pending ? `<span class="comment-status-pill">Not public</span>` : ""}
                ${!pending ? `<span class="comment-actions" data-comment-actions="${escapeHtml(comment.id)}">${commentReactionControls(comment)}</span>` : ""}
                ${adminMode && pending ? `<a class="comment-reply-button" href="${escapeHtml(adminReviewUrl)}" target="_blank" rel="noreferrer">Review</a>` : ""}
                ${currentContributorProfile() && !pending ? `<button class="comment-reply-button" type="button" data-reply-comment="${escapeHtml(comment.id)}" data-reply-profile="${escapeHtml(comment.member_profile || "")}">Reply</button>` : ""}
                ${currentViewerOwnsComment(comment) ? `<button class="comment-reply-button" type="button" data-delete-comment="${escapeHtml(comment.id)}">Delete</button>` : ""}
              </div>
            </div>
          </article>
          ${repliesFor(comment.id).map(reply => renderComment(reply, depth + 1)).join("")}
        `;
      };
      const currentName = profile?.display_name || profile?.username || "Contributor";
      const currentAvatar = directusAssetUrl(profile?.avatar);
      const currentInitial = (currentName || "?").trim().slice(0, 1) || "?";
      const countLabel = rootComments.length ? `${rootComments.length} comment${rootComments.length === 1 ? "" : "s"}` : "Comments";
      return `
        <section class="section discussion-section" data-discussion-type="${escapeHtml(sourceType)}" data-discussion-id="${escapeHtml(item.id)}" data-discussion-slug="${escapeHtml(item.slug)}" data-discussion-title="${escapeHtml(item.title)}">
          <div class="article-social-actions" aria-label="Article actions">
            <button class="article-social-button" type="button" data-toggle-discussion aria-expanded="${rootComments.length ? "true" : "false"}" title="${escapeHtml(countLabel)}" aria-label="${escapeHtml(countLabel)}">${ICONS.comment}<span class="action-label">Comments</span></button>
            <button class="article-social-button" type="button" data-toggle-share aria-expanded="false" title="Share article" aria-label="Share article">${ICONS.share}<span class="action-label">Share</span></button>
          </div>
          ${sharePanel(sourceType, item)}
          <div class="discussion-panel" data-discussion-panel ${rootComments.length ? "" : "hidden"}>
            <div class="discussion-heading">
              <span class="discussion-heading-icon" aria-hidden="true">"</span>
              <div>
                <h3>Community Notes</h3>
                <p>${rootComments.length ? `${rootComments.length} public note${rootComments.length === 1 ? "" : "s"} from contributors.` : "Add context, memories, corrections, or respectful questions for this story."}</p>
              </div>
            </div>
            <div class="comments">
              ${rootComments.length ? rootComments.map(comment => renderComment(comment)).join("") : `<div class="comment-empty-state"><strong>No community notes yet</strong><span>Be the first to add helpful context for future readers.</span></div>`}
            </div>
            ${approvedContributorCanPost(profile) ? `
              <div class="discussion-composer">
                <span class="comment-avatar" aria-hidden="true">${currentAvatar ? `<img src="${escapeHtml(currentAvatar)}" alt="">` : escapeHtml(currentInitial)}</span>
                <div class="discussion-composer-panel">
                  <div class="field">
                    <label for="discussion-comment">Comment as ${escapeHtml(currentName)}</label>
                    <textarea id="discussion-comment" data-discussion-input placeholder="Write a comment..."></textarea>
                  </div>
                  <div class="field">
                    <label for="discussion-image">Optional JPG/JPEG image, max 5 MB</label>
                    <input id="discussion-image" data-discussion-image type="file" accept=".jpg,.jpeg,image/jpeg">
                  </div>
                  <span class="reply-context" data-reply-context></span>
                  ${contributorLimitNoteHtml(profile, "comments")}
                  <div class="discussion-composer-actions">
                    <button class="button" type="button" data-submit-discussion>Post comment</button>
                    <button class="button secondary" type="button" data-cancel-reply hidden>Cancel reply</button>
                  </div>
                </div>
              </div>
              <input type="hidden" data-parent-comment value="">
              <input type="hidden" data-reply-to-profile value="">
            ` : profile ? `
              <p class="article-summary">${escapeHtml(contributorWritePrompt())}</p>
            ` : `
              <div class="field">
                <label for="contributor-email">Contributor email</label>
                <input id="contributor-email" data-login-email autocomplete="username">
              </div>
              <div class="field">
                <label for="contributor-password">Password</label>
                <input id="contributor-password" data-login-password type="password" autocomplete="current-password">
              </div>
            <button class="button" type="button" data-contributor-login>Login to comment</button>
            <p class="form-status" data-login-status hidden></p>
            `}
          </div>
        </section>
      `;
    }

    function contributorProfileCard(profile, expanded = false) {
      const activity = expanded ? contributorActivity(profile) : null;
      const stats = profileStats(profile, { syncRemote: expanded });
      const pointTotal = profilePointTotal(stats);
      const avatar = directusAssetUrl(profile.avatar);
      const name = profile.display_name || profile.username || "Contributor";
      const latestComments = activity ? activity.comments.slice(-5).reverse() : [];
      const userSinceLine = profileUserSinceLine(profile);
      const cardKey = profile.id || profile.slug || name;
      const expandedBody = expanded ? `
          <div class="contributor-card-body" data-contributor-card-body>
            ${profilePointsBreakdownHtml(stats)}
            ${profile.bio ? `<p>${escapeHtml(profile.bio)}</p>` : profile._commentOnly ? `<p>This contributor has public activity, but has not published a profile biography yet.</p>` : ""}
            ${contributorTierProgressHtml(stats)}
            ${profileStatsHtml(profile)}
            ${profileTrackerHtml(profile)}
            ${supporterLine(profile) ? `<span>${escapeHtml(supporterLine(profile))}</span>` : ""}
            ${profileActivityFeedHtml(profile, 14)}
            ${profileLanguageSectionHtml(profile, true)}
            ${activity.purchases.length ? `<section class="section"><h3>Artwork Support</h3>${activity.purchases.map(purchase => `
              <div class="support-badge">
                <strong>${escapeHtml(purchase.artwork_title || "Artwork print")}</strong>
                <span>${escapeHtml([purchase.print_size, purchase.material, purchase.amount ? money(purchase.amount) : ""].filter(Boolean).join(" - "))}</span>
              </div>
            `).join("")}</section>` : ""}
            ${profileCommentsSectionHtml(profile, latestComments.length ? false : true)}
            ${activity.visits.length ? `<section class="section"><h3>Visited Sites</h3>${activity.visits.slice(-8).reverse().map(visit => `
              <button class="button secondary" type="button" data-site-slug="${escapeHtml(visit.site_slug || "")}">Visited: ${escapeHtml(visit.site_title || "Site")}</button>
            `).join("")}</section>` : ""}
          </div>
        ` : "";
      return `
        <article class="content-card public-profile-card${expanded ? " expanded" : ""}" data-contributor-card="${escapeHtml(cardKey)}">
          <div class="profile-topline">
            <button class="comment-profile-link" type="button" data-open-profile="${escapeHtml(profile.id || profile.slug || name)}" aria-label="Open ${escapeHtml(name)} profile">
              ${avatar ? `<img class="hero-image" src="${escapeHtml(avatar)}" alt="${escapeHtml(name)}">` : `<span class="comment-avatar" aria-hidden="true">${escapeHtml(name.slice(0, 1) || "?")}</span>`}
            </button>
            <span class="profile-identity">
              <strong>${escapeHtml(name)}</strong>
              <span class="profile-role-line">${escapeHtml(profile.role_label || "Contributor")}${profile.location_label ? ` - ${escapeHtml(profile.location_label)}` : ""}</span>
              ${userSinceLine ? `<span class="profile-role-line">${escapeHtml(userSinceLine)}</span>` : ""}
              ${profile.headline ? `<span class="profile-headline-line">${escapeHtml(profile.headline)}</span>` : ""}
            </span>
            <button class="profile-points-badge" type="button" data-toggle-points aria-expanded="false" aria-label="${pointTotal} contributor points. Show points breakdown.">
              <strong>${pointTotal}</strong>
              <span>points</span>
              <em>Details</em>
            </button>
          </div>
          ${expandedBody}
          ${!expanded ? `<button class="button secondary" type="button" data-expand-contributor="${escapeHtml(cardKey)}" aria-expanded="false">View profile</button>` : ""}
        </article>
      `;
    }

    function sortedContributorProfiles() {
      return publicContributorProfiles().sort((a, b) => {
        if (state.contributorSortMode === "points") {
          const pointDelta = Number(profileStats(b, { syncRemote: false }).points || 0) - Number(profileStats(a, { syncRemote: false }).points || 0);
          if (pointDelta) return pointDelta;
        }
        return String(a.display_name || a.username || "").localeCompare(String(b.display_name || b.username || ""));
      });
    }

    function openContributorProfile(profileKey) {
      const key = String(profileKey || "");
      const profile = state.contributorProfiles.find(item =>
        String(item.id) === key || item.slug === key || item.username === key
      ) || profileFromComment(state.publicComments.find(comment => String(comment.member_profile) === key || comment.author_name === key))
        || profileFromMapStory(state.mapStories.find(story => String(relationId(story.member_profile)) === key));
      if (!profile) {
        showBanner("Contributor profile is not available yet.");
        return;
      }
      const viewer = currentContributorProfile();
      const isOwnProfile = viewer?.id && Number(viewer.id) === Number(profile.id);
      if (profile.public_profile === false && !adminMode && !isOwnProfile) {
        showBanner("This contributor profile is private.");
        return;
      }
      rememberPanel();
      clearBiographyPathOverlay();
      state.activeContent = null;
      clearActiveTimelineEvent();
      articleHeadEl.innerHTML = `
        <p class="article-kicker">Contributor Profile</p>
        <h2>${escapeHtml(profile.display_name || profile.username || "Contributor")}</h2>
      `;
      articleBodyEl.innerHTML = contributorProfileCard(profile, true);
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
    }

    function openContributors() {
      rememberPanel();
      clearBiographyPathOverlay();
      state.activeContent = null;
      clearActiveTimelineEvent();
      articleHeadEl.innerHTML = `
        <p class="article-kicker">Community</p>
        <h2>Contributors</h2>
      `;
      articleBodyEl.innerHTML = `
        <p class="article-summary">Public contributor biographies and approved community activity for On This Site.</p>
        <div class="profile-directory-controls">
          <label for="contributor-sort">Sort</label>
          <select id="contributor-sort" data-contributor-sort>
            <option value="alpha"${state.contributorSortMode === "alpha" ? " selected" : ""}>Alphabetical</option>
            <option value="points"${state.contributorSortMode === "points" ? " selected" : ""}>Leadership points</option>
          </select>
        </div>
        <div class="content-list" data-contributors-panel>
          ${sortedContributorProfiles().map(profile => contributorProfileCard(profile, false)).join("") || `<p class="article-summary">No public contributor profiles are published yet.</p>`}
        </div>
      `;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
    }

    function openContributorLogin() {
      rememberPanel();
      clearBiographyPathOverlay();
      document.querySelectorAll(".layer-menu[open], .more-menu[open], .main-menu[open]").forEach(menu => {
        if (!menu.matches("#main-menu") || document.body.classList.contains("nav-collapsed")) menu.removeAttribute("open");
      });
      state.activeContent = null;
      clearActiveTimelineEvent();
      if (state.contributorSession?.pending && !state.approvalRefreshInFlight) {
        refreshContributorSessionApproval().then(updated => {
          if (updated) openContributorLogin();
          else renderContributorLoginButton();
        }).catch(() => renderContributorLoginButton());
      }
      const profile = currentContributorProfile();
      const stats = profile ? profileStats(profile) : null;
      const publicSiteCount = PROFILE_UTILS.publicSiteTotal(state.sites);
      const visitProgress = stats ? PROFILE_UTILS.visitProgressLabel(stats.visitsCount, publicSiteCount) : "";
      articleHeadEl.innerHTML = `
        <p class="article-kicker">Community</p>
        <h2>Contributor Account</h2>
      `;
      articleBodyEl.innerHTML = profile ? `
        <section class="section contributor-login-panel" data-login-panel>
          <h3>${escapeHtml(profile.display_name || profile.username || "Contributor")}</h3>
          <p class="article-summary">${state.contributorSession?.pending ? "Your contributor account request is saved and waiting for review." : `${escapeHtml(profile.role_label || "Contributor")} account is active for comments, replies, and reviewed community contributions.`}</p>
          ${profileUserSinceLine(profile) ? `<p class="article-meta">${escapeHtml(profileUserSinceLine(profile))}</p>` : ""}
          ${state.contributorSession?.pending ? `<p class="article-meta">Once approved, this same login can submit reviewed contributions.</p>` : ""}
          ${!state.contributorSession?.pending && stats ? `
            <div class="account-summary-card">
              <div>
                <h4>${escapeHtml(stats.milestone)}</h4>
                <p><button class="inline-stat-button" type="button" data-show-profile-comments aria-expanded="false">${stats.commentsCount} approved comment${stats.commentsCount === 1 ? "" : "s"}</button> - ${escapeHtml(visitProgress)} - ${stats.languageLearned} language word${stats.languageLearned === 1 ? "" : "s"} - ${stats.commentUpvotes} helpful vote${stats.commentUpvotes === 1 ? "" : "s"}</p>
              </div>
              <button class="profile-points-badge" type="button" data-toggle-points aria-expanded="false" aria-label="${stats.points} contributor points. Show points breakdown.">
                <strong>${stats.points}</strong>
                <span>points</span>
                <em>Details</em>
              </button>
              ${profilePointsBreakdownHtml(stats)}
              ${contributorTierProgressHtml(stats)}
              ${profileStatsHtml(profile)}
              ${profileTrackerHtml(profile)}
            </div>
            ${contributorInviteForm(profile)}
            ${profileActivityFeedHtml(profile)}
            ${profileLanguageSectionHtml(profile, true)}
            ${profileCommentsSectionHtml(profile, true)}
          ` : ""}
          ${profile.bio ? `<p>${escapeHtml(profile.bio)}</p>` : ""}
          ${supporterLine(profile) ? `<p class="article-meta">${escapeHtml(supporterLine(profile))}</p>` : ""}
          ${state.contributorSession?.pending ? "" : contributorProfileForm(profile)}
          ${contributorActivity(profile).purchases.length ? `<section class="section"><h3>Artwork Support</h3>${contributorActivity(profile).purchases.map(purchase => `
            <div class="support-badge">
              <strong>${escapeHtml(purchase.artwork_title || "Artwork print")}</strong>
              <span>${escapeHtml([purchase.print_size, purchase.material, purchase.amount ? money(purchase.amount) : ""].filter(Boolean).join(" - "))}</span>
            </div>
          `).join("")}</section>` : ""}
          <div class="contributor-account-actions">
            <button class="button" type="button" data-view-profiles>View contributor profiles</button>
            <button class="button secondary" type="button" data-logout-contributor>Logout</button>
          </div>
        </section>
      ` : `
        <section class="section contributor-login-panel" data-login-panel>
          <h3>Login</h3>
          <p class="article-summary">Use one contributor account on the desktop map and mobile app. New accounts and public comments stay pending until reviewed.</p>
          <div class="field">
            <label for="top-contributor-email">Contributor email</label>
            <input id="top-contributor-email" data-login-email autocomplete="username">
          </div>
          <div class="field">
            <label for="top-contributor-password">Password</label>
            <input id="top-contributor-password" data-login-password type="password" autocomplete="current-password">
          </div>
          <button class="button" type="button" data-contributor-login-panel>Login</button>
          <p class="form-status" data-login-status hidden></p>
          ${state.passwordResetToken ? `
            <section class="section" data-password-reset-complete-panel>
              <h3>Set new password</h3>
              <p class="article-meta">Enter a new password for this reset link.</p>
              <div class="field">
                <label for="top-password-reset-new-password">New password</label>
                <input id="top-password-reset-new-password" data-password-reset-new-password type="password" autocomplete="new-password">
              </div>
              <button class="button" type="button" data-password-reset-complete>Set new password</button>
              <p class="form-status" data-password-reset-complete-status hidden></p>
            </section>
          ` : ""}
          <details class="section" data-password-reset-panel>
            <summary>Reset password</summary>
            <p class="article-meta">Enter your account email. If it exists, we will send a one-time link to set a new password.</p>
            <div class="field">
              <label for="top-password-reset-email">Account email</label>
              <input id="top-password-reset-email" data-password-reset-email autocomplete="email" inputmode="email">
            </div>
            <button class="button secondary" type="button" data-password-reset-submit>Email reset link</button>
            <p class="form-status" data-password-reset-status hidden></p>
          </details>
          <details class="section" data-register-panel>
            <summary>Register contributor account</summary>
            <div class="field">
              <label for="top-register-name">Display name</label>
              <input id="top-register-name" data-register-name autocomplete="name">
            </div>
            <div class="field">
              <label for="top-register-email">Email / username</label>
              <input id="top-register-email" data-register-email autocomplete="email" inputmode="email">
            </div>
            <div class="field">
              <label for="top-register-password">Password</label>
              <input id="top-register-password" data-register-password type="password" autocomplete="new-password">
            </div>
            <div class="field">
              <label for="top-register-invite-code">Invite code (optional)</label>
              <input id="top-register-invite-code" data-register-invite-code autocomplete="off" inputmode="text">
            </div>
            <button class="button" type="button" data-register-contributor>Submit account request</button>
            <p class="form-status" data-register-status hidden></p>
            <p class="article-meta">This creates a contributor account request for review. After approval, the same login works on desktop and mobile.</p>
          </details>
        </section>
      `;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
    }

    function openContributorProfileRoute(options = {}) {
      openContributorLogin();
      if (!options.skipRoute) setRoute({ page: "profile" });
    }

    function isCalendarEventActive(event) {
      return CALENDAR_UTILS.isCalendarEventActive(event, { normalizeText: normalizeComparisonText, localDateKey });
    }

    function openCalendarEvent(event, context = {}) {
      if (!context.skipHistory) rememberPanel();
      clearBiographyPathOverlay();
      state.activeContent = { type: "event", slug: event.slug };
      if (context.timelineEventId) setActiveTimelineEvent(context.timelineEventId, { scrollTimeline: false });
      else clearActiveTimelineEvent();
      const image = directusAssetUrl(event.cover_image);
      const related = [
        event.related_site_slug && state.siteBySlug.has(event.related_site_slug)
          ? `<button class="button secondary" type="button" data-site-slug="${escapeHtml(event.related_site_slug)}">Related listing</button>` : "",
        event.related_wiki_slug && state.wikiBySlug.has(event.related_wiki_slug)
          ? `<button class="button secondary" type="button" data-wiki-slug="${escapeHtml(event.related_wiki_slug)}">Related wiki article</button>` : "",
        event.related_blog_slug && state.blogBySlug.has(event.related_blog_slug)
          ? `<button class="button secondary" type="button" data-blog-slug="${escapeHtml(event.related_blog_slug)}">Related blog post</button>` : ""
      ].filter(Boolean).join("");
      articleHeadEl.innerHTML = `
        <p class="article-kicker">${escapeHtml(context.source || CALENDAR_UTILS.eventTypeLabel(event.event_type))}</p>
        <h2>${escapeHtml(event.title)}</h2>
        <p class="article-meta">${escapeHtml([CALENDAR_UTILS.eventDateRange(event), event.venue, event.address_label].filter(Boolean).join(" - "))}</p>
      `;
      articleBodyEl.innerHTML = `
        ${image ? `<img class="hero-image" src="${escapeHtml(image)}" alt="${escapeHtml(event.title)}" onerror="this.remove()">` : ""}
        ${event.summary ? `<p class="article-summary">${cleanHtml(event.summary)}</p>` : ""}
        ${event.body ? `<section class="section"><h3>Details</h3><div class="section-content">${cleanHtml(event.body)}</div></section>` : ""}
        ${(event.collection_piece_title || event.collection_artist || event.collection_date) ? `
          <section class="section">
            <h3>Collection Moment</h3>
            ${event.collection_piece_title ? `<p><strong>${escapeHtml(event.collection_piece_title)}</strong></p>` : ""}
            ${event.collection_artist ? `<p>${escapeHtml(event.collection_artist)}</p>` : ""}
            ${event.collection_date ? `<p>${escapeHtml(CALENDAR_UTILS.eventDateRange({ collection_date: event.collection_date }))}</p>` : ""}
          </section>
        ` : ""}
        ${related ? `<div class="article-actions">${related}</div>` : ""}
        ${isFrontendAdmin() ? `<div class="article-actions">
          ${event.external_url ? `<a class="button secondary" href="${escapeHtml(event.external_url)}" target="_blank" rel="noreferrer">Event link</a>` : ""}
          <a class="button secondary" href="${DIRECTUS}/admin/content/calendar_events/${event.id}" target="_blank" rel="noreferrer">Edit event</a>
        </div>` : event.external_url ? `<div class="article-actions"><a class="button secondary" href="${escapeHtml(event.external_url)}" target="_blank" rel="noreferrer">Event link</a></div>` : ""}
      `;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
      if (!context.skipRoute) setRoute({ calendar: event.slug });
      if (context.focus !== false) focusGeometry(event.geojson, 12);
    }

    function openEventsList() {
      rememberPanel();
      clearBiographyPathOverlay();
      state.activeContent = null;
      clearActiveTimelineEvent();
      const events = [...state.calendarEvents].filter(isCalendarEventActive).sort((a, b) =>
        String(a.start_datetime || a.collection_date || "9999").localeCompare(String(b.start_datetime || b.collection_date || "9999")) ||
        String(a.title || "").localeCompare(String(b.title || ""))
      );
      articleHeadEl.innerHTML = `
        <p class="article-kicker">On This Site</p>
        <h2>Calendar / On View</h2>
      `;
      articleBodyEl.innerHTML = `
        <p class="article-summary">Exhibits, permanent collections, programs, and collection moments that can appear on the map and timeline.</p>
        <div class="content-list">
          ${events.map(event => `
            <button class="content-card" type="button" data-calendar-slug="${escapeHtml(event.slug)}">
              <span class="content-date">${escapeHtml(CALENDAR_UTILS.eventDateRange(event))}</span>
              <strong>${escapeHtml(event.title)}</strong>
              <span>${escapeHtml([CALENDAR_UTILS.eventTypeLabel(event.event_type), event.venue].filter(Boolean).join(" - "))}</span>
              ${event.summary ? `<span>${escapeHtml(stripHtml(event.summary).slice(0, 180))}</span>` : ""}
            </button>
          `).join("") || `<p class="article-summary">No published calendar events yet.</p>`}
        </div>
        ${isFrontendAdmin() ? `<div class="article-actions">
          <a class="button secondary" href="${DIRECTUS}/admin/content/calendar_events/+" target="_blank" rel="noreferrer">Add calendar event</a>
        </div>` : ""}
      `;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
    }

    async function loginContributorFromSection(section) {
      const email = section.querySelector("[data-login-email]")?.value?.trim() || "";
      const password = section.querySelector("[data-login-password]")?.value || "";
      if (!email || !password) {
        setInlineStatus(section, "[data-login-status]", "Enter contributor email and password.", "error");
        showBanner("Enter contributor email and password.");
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
        setInlineStatus(section, "[data-login-status]", "Enter a valid email address.", "error");
        showBanner("Enter a valid email address.");
        return;
      }
      setInlineStatus(section, "[data-login-status]", "Checking account...");
      try {
        const registered = await loginRegistrationContributor(email, password);
        if (registered) {
          saveContributorSession(registered);
          scheduleMemberProfileActivityTracking({ login: true, force: true });
          const message = registered.pending ? "This account is still waiting for approval." : "Contributor login active.";
          setInlineStatus(section, "[data-login-status]", message, registered.pending ? "error" : "success");
          showBanner(message);
          openContributorProfileRoute();
          return;
        }
      } catch (error) {
        setInlineStatus(section, "[data-login-status]", error.message || "Login failed.", "error");
        throw error;
      }
      let data;
      try {
        data = await directusClient.loginWithPassword(email, password);
      } catch {
        setInlineStatus(section, "[data-login-status]", "Login failed. Check the email/password or register for review.", "error");
        throw new Error("Login failed. Check the email/password or register for review.");
      }
      const profile = await contributorProfileForToken(data?.access_token, email);
      if (isProfileBanned(profile)) {
        setInlineStatus(section, "[data-login-status]", profile?.ban_reason || "This account has been banned.", "error");
        showBanner(profile?.ban_reason || "This account has been banned.");
        return;
      }
      saveContributorSession({
        email,
        displayName: profile?.display_name || email,
        profileId: profile?.id || null,
        token: data?.access_token || null,
        refreshToken: data?.refresh_token || null,
        refresh_token: data?.refresh_token || null,
        tokenExpires: data?.expires || null
      });
      scheduleMemberProfileActivityTracking({ login: true, force: true });
      await awardDailyLoginReward();
      await loadDeferredSocialData();
      setInlineStatus(section, "[data-login-status]", "Contributor login active.", "success");
      showBanner("Contributor login active.");
      if (state.activeContent) reopenActiveContent();
      else openContributorProfileRoute();
    }

    function reopenActiveContent() {
      if (state.activeContent?.type === "site") {
        const site = state.siteBySlug.get(state.activeContent.slug);
        if (site) openListing(site, { source: "Archive listing", skipHistory: true, focus: false });
      } else if (state.activeContent?.type === "wiki") {
        const article = state.wikiBySlug.get(state.activeContent.slug);
        if (article) openWikiArticle(article, { source: "Knowledgebase article", skipHistory: true, focus: false });
      }
    }

    function repaintActiveContentPreservingScroll() {
      if (!state.activeContent || !articleEl.classList.contains("open")) return;
      const previousScroll = articleBodyEl.scrollTop || 0;
      reopenActiveContent();
      articleBodyEl.scrollTop = previousScroll;
    }

    async function refreshCommentsNow({ rerender = true } = {}) {
      try {
        const response = await fetchJson(`/items/mobile_comments?limit=-1&filter[status][_eq]=approved&filter[public_activity][_eq]=true&fields=${INITIAL_PUBLIC_COMMENT_FIELDS}`);
        state.publicComments = response.data || [];
        if (rerender) {
          renderActivityPanel();
          renderNotificationPanel();
          reopenActiveContent();
        }
        return true;
      } catch {
        return false;
      }
    }

    async function submitDiscussion(section) {
      const submitButton = section.querySelector("[data-submit-discussion]");
      const originalLabel = submitButton?.textContent || "Post comment";
      const profile = currentContributorProfile();
      if (!approvedContributorCanPost(profile)) {
        showBanner(contributorWritePrompt());
        return;
      }
      if (!contributorCanUseDailyAction(profile, "comments")) return;
      const text = section.querySelector("[data-discussion-input]")?.value?.trim() || "";
      if (!text) {
        showBanner("Write a comment first.");
        return;
      }
      const moderation = moderationCheck(text, "Your comment");
      if (!moderation.ok) {
        showBanner(moderation.message);
        return;
      }
      let image = section.querySelector("[data-discussion-image]")?.files?.[0] || null;
      if (image && !isImageUploadFile(image)) {
        showBanner("Choose an image file.");
        return;
      }
      try {
        image = await prepareJpegUploadImage(image, "comment-image");
      } catch (error) {
        showBanner(error.message || "Could not prepare that comment photo.");
        return;
      }
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = image ? "Uploading image..." : "Posting...";
      }
      let imageId = null;
      try {
        imageId = image ? await uploadDirectusFile(image, `Comment image - ${section.dataset.discussionTitle}`, { requireAuth: true }) : null;
        if (submitButton) submitButton.textContent = "Posting...";
      } catch (error) {
        if (error?.code === "AUTH_EXPIRED") {
          showBanner(error.message || "Login expired. Please log in again, then post your comment.");
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalLabel;
          }
          return;
        }
        showBanner("The image could not be attached, but the comment text will still be posted.");
        if (submitButton) submitButton.textContent = "Posting...";
      }
      const sourceType = section.dataset.discussionType;
      const sourceId = Number(section.dataset.discussionId);
      const sourceSlug = section.dataset.discussionSlug;
      const sourceTitle = section.dataset.discussionTitle;
      const parentComment = section.querySelector("[data-parent-comment]")?.value || null;
      const replyToProfile = section.querySelector("[data-reply-to-profile]")?.value || null;
      const quoteContextFields = QUOTE_COMMENT_UTILS.quoteCommentContextFields(text, {
        source_type: sourceType,
        source_title: sourceTitle
      });
      const payload = {
        status: "approved",
        public_activity: true,
        source_type: sourceType,
        source_id: sourceId,
        source_slug: sourceSlug,
        source_title: sourceTitle,
        ...quoteContextFields,
        article_url: ROUTE_UTILS.publicArchiveUrl({ [sourceType === "wiki" ? "wiki" : "site"]: sourceSlug }, { baseUrl: PUBLIC_ARCHIVE_BASE }),
        site_slug: sourceType === "site" ? sourceSlug : null,
        site_title: sourceType === "site" ? sourceTitle : null,
        member_profile: profile.id || null,
        author_name: profile.display_name || profile.username || "Contributor",
        author_email: state.contributorSession?.email || profile.username || "",
        parent_comment: parentComment || null,
        reply_to_profile: replyToProfile || null,
        comment: text,
        comment_image: imageId,
        created_at: new Date().toISOString()
      };
      let created = null;
      let commentEmailError = "";
      try {
        created = await postDirectusItem("mobile_comments", payload, {
          requireAuth: true,
          authExpiredMessage: "Login expired. Please log in again, then post your comment."
        });
        const visibleComment = {
          id: created?.data?.id || `pending-${Date.now()}`,
          ...payload,
          status: created?.data?.status || payload.status,
          author_email: state.contributorSession?.email || "",
          _local_pending: false
        };
        state.publicComments.push(visibleComment);
        if (Number(profile.id)) {
          await recordProfilePointEvent({
            event_key: `approved_comment:${profile.id}:${visibleComment.id}`,
            event_type: "approved_comment",
            points: PROFILE_UTILS.POINT_RULES.approved_comment,
            member_profile: Number(profile.id),
            source_collection: "mobile_comments",
            source_id: visibleComment.id,
            source_slug: sourceSlug,
            source_title: sourceTitle,
            created_at: visibleComment.created_at || payload.created_at
          });
        }
        if (profile.id && replyToProfile && Number(replyToProfile) !== Number(profile.id)) {
          await postDirectusItem("mobile_app_notifications", {
            status: "unread",
            recipient_profile: Number(replyToProfile),
            actor_profile: Number(profile.id),
            type: "reply",
            title: `New reply on ${sourceTitle}`,
            message: `${payload.author_name} replied: ${text.slice(0, 180)}`,
            source_type: sourceType,
            source_slug: sourceSlug,
            comment_id: created.data?.id || null,
            created_at: new Date().toISOString()
          }).catch(() => null);
        }
        try {
          await FEEDBACK_UTILS.sendCommentSubmissionEmail(created, {
            appUrl: payload.article_url,
            platform: "desktop"
          });
        } catch (error) {
          commentEmailError = "Your comment is visible, but the admin email could not be sent.";
          console.warn("Comment email failed:", error);
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalLabel;
        }
      }
      showBanner(commentEmailError || "Your comment is now visible. Thank you.");
      await refreshCommentsNow({ rerender: false });
      renderActivityPanel();
      reopenActiveContent();
    }

    function openSuggestSite() {
      rememberPanel();
      clearBiographyPathOverlay();
      state.activeContent = null;
      clearActiveTimelineEvent();
      const identity = currentContributorIdentity();
      const profile = identity.profile;
      const canSubmit = approvedContributorCanPost(profile);
      articleHeadEl.innerHTML = `
        <p class="article-kicker">Community Contribution</p>
        <h2>Suggest a Site</h2>
      `;
      articleBodyEl.innerHTML = canSubmit ? `
        <p class="article-summary">Suggest a new map pin for review. This does not publish immediately.</p>
        <section class="section contributor-login-panel" data-site-suggestion-panel>
          <fieldset class="suggest-prompt-list" aria-label="Contribution type">
            <legend>What would you like to share?</legend>
            <label><input type="radio" name="desktop-suggest-prompt" data-suggest-prompt value="Do you know a Native place name?" checked> <span>Do you know a Native place name?</span></label>
            <label><input type="radio" name="desktop-suggest-prompt" data-suggest-prompt value="Do you have a family story connected to this place?"> <span>Do you have a family story connected to this place?</span></label>
            <label><input type="radio" name="desktop-suggest-prompt" data-suggest-prompt value="Do you know a source we should add?"> <span>Do you know a source we should add?</span></label>
            <label><input type="radio" name="desktop-suggest-prompt" data-suggest-prompt value="Do you have a correction?"> <span>Do you have a correction?</span></label>
            <label><input type="radio" name="desktop-suggest-prompt" data-suggest-prompt value="Do you have a photo?"> <span>Do you have a photo?</span></label>
          </fieldset>
          <div class="field">
            <label for="suggest-title">Title or place name</label>
            <input id="suggest-title" data-suggest-title maxlength="255">
          </div>
          <div class="field">
            <label for="suggest-introduction">What should we know?</label>
            <textarea id="suggest-introduction" data-suggest-introduction rows="6"></textarea>
          </div>
          <div class="field">
            <label for="suggest-image">Optional image</label>
            <input id="suggest-image" data-suggest-image type="file" accept="image/*">
          </div>
          <div class="field">
            <label>Map pin</label>
            <p class="article-summary">Zoom in as far as you can, then choose where the site should appear.</p>
          </div>
          <div class="field-grid">
            <div class="field">
              <label for="suggest-latitude">Selected latitude</label>
              <input id="suggest-latitude" data-suggest-latitude inputmode="decimal" readonly value="">
            </div>
            <div class="field">
              <label for="suggest-longitude">Selected longitude</label>
              <input id="suggest-longitude" data-suggest-longitude inputmode="decimal" readonly value="">
            </div>
          </div>
          <div class="article-actions">
            <button class="button secondary" type="button" data-click-suggest-location>Pick Site on Map</button>
            <button class="button secondary" type="button" data-use-current-location>Use my location</button>
            <button class="button" type="button" data-submit-site-suggestion>Submit for review</button>
          </div>
          <p class="form-status" data-suggest-status hidden></p>
        </section>
      ` : `
        <p class="article-summary">${state.contributorSession?.pending ? "Your account is waiting for approval before suggesting new sites." : "Login with an approved contributor account before suggesting a site."}</p>
        <button class="button" type="button" data-view-login>Login or register</button>
      `;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
    }

    async function submitSiteSuggestionDesktop(section) {
      const identity = currentContributorIdentity();
      const profile = identity.profile;
      if (!profile?.id || state.contributorSession?.pending) {
        showBanner("Login with an approved contributor account before suggesting a site.");
        return;
      }
      const title = section.querySelector("[data-suggest-title]")?.value.trim() || "";
      const introduction = section.querySelector("[data-suggest-introduction]")?.value.trim() || "";
      const prompt = section.querySelector("[data-suggest-prompt]:checked")?.value || "Do you know a Native place name?";
      const latitudeRaw = section.querySelector("[data-suggest-latitude]")?.value || "";
      const longitudeRaw = section.querySelector("[data-suggest-longitude]")?.value || "";
      const latitude = Number(latitudeRaw);
      const longitude = Number(longitudeRaw);
      let image = section.querySelector("[data-suggest-image]")?.files?.[0] || null;
      if (!title || !introduction) {
        setInlineStatus(section, "[data-suggest-status]", "Add a title and introduction.", "error");
        return;
      }
      if (!latitudeRaw || !longitudeRaw || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setInlineStatus(section, "[data-suggest-status]", "Set a map pin by clicking the map or using your location.", "error");
        return;
      }
      if (image && !isImageUploadFile(image)) {
        setInlineStatus(section, "[data-suggest-status]", "Choose an image file.", "error");
        return;
      }
      const button = section.querySelector("[data-submit-site-suggestion]");
      const originalLabel = button?.textContent || "Submit for review";
      if (button) {
        button.disabled = true;
        button.textContent = image ? "Preparing image..." : "Submitting...";
      }
      try {
        image = await prepareJpegUploadImage(image, "site-suggestion-image");
        if (button) button.textContent = image ? "Uploading image..." : "Submitting...";
        const imageId = image ? await uploadDirectusFile(image, title) : null;
        if (button) button.textContent = "Submitting...";
        await postDirectusItem("site_suggestions", {
          status: "pending",
          priority: 1,
          title,
          introduction,
          suggested_image: imageId,
          geojson: { type: "Point", coordinates: [longitude, latitude] },
          longitude,
          latitude,
          author_profile: profile.id,
          author_name: identity.name,
          author_email: identity.email,
          submitted_at: new Date().toISOString(),
          review_note: `Contribution type: ${prompt}`
        });
        setInlineStatus(section, "[data-suggest-status]", "Site suggestion submitted for review. Thank you.", "success");
        showBanner("Site suggestion submitted for review.");
        state.suggestionMarker?.remove?.();
        state.suggestionMarker = null;
        section.querySelectorAll("input, textarea, button").forEach(control => control.disabled = true);
      } catch (error) {
        setInlineStatus(section, "[data-suggest-status]", error.message || "Could not submit site suggestion.", "error");
        showBanner(error.message || "Could not submit site suggestion.");
        if (button) {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      }
    }

    function openContact(options = {}) {
      rememberPanel();
      clearBiographyPathOverlay();
      state.activeContent = null;
      clearActiveTimelineEvent();
      const identity = currentContributorIdentity();
      if (!options.skipRoute) setRoute({ page: "page-contact" });
      articleHeadEl.innerHTML = `
        <p class="article-kicker">On This Site</p>
        <h2>Contact</h2>
      `;
      articleBodyEl.innerHTML = `
        <p class="article-summary">For questions, research notes, corrections, collaborations, exhibitions, education, or support for On This Site, you can send a message here.</p>
        <section class="section" data-contact-form>
          <h3>Submit Feedback</h3>
          <p class="article-meta">Send a bug report, correction, confusing behavior, or idea. A screenshot is optional but helps with map and phone issues.</p>
          <div class="field">
            <label for="contact-name">Name</label>
            <input id="contact-name" data-contact-name autocomplete="name" value="${escapeHtml(identity.name !== "Contributor" ? identity.name : "")}">
          </div>
          <div class="field">
            <label for="contact-email">Email</label>
            <input id="contact-email" data-contact-email autocomplete="email" inputmode="email" value="${escapeHtml(identity.email)}">
          </div>
          <div class="field">
            <label for="contact-message">Message</label>
            <textarea id="contact-message" data-contact-message rows="8" placeholder="Tell us what prompted this feedback..."></textarea>
          </div>
          <div class="feedback-screenshot-controls">
            <input id="contact-screenshot" data-feedback-screenshot type="file" accept="image/*" hidden>
            <button class="button secondary" type="button" data-capture-feedback-screenshot>Capture current page</button>
            <button class="button secondary" type="button" data-upload-feedback-screenshot>Upload screenshot</button>
            <p class="article-meta" data-feedback-screenshot-status>Optional screenshot helps explain what happened.</p>
          </div>
          <button class="button" type="button" data-submit-contact>Send feedback</button>
          <p class="form-status" data-contact-status hidden></p>
        </section>
        <section class="section">
          <h3>Project Contact</h3>
          <p><strong>Jeremy Dennis</strong></p>
          <p>Shinnecock Indian Nation artist and photographer; founder and editor of On This Site - Native Long Island.</p>
          <p><a href="mailto:jeremynative@gmail.com">jeremynative@gmail.com</a></p>
          <p><a href="tel:+16315660486">631-566-0486</a></p>
          <p><a href="https://nativelongisland.com" target="_blank" rel="noreferrer">nativelongisland.com</a></p>
        </section>
        <section class="section">
          <h3>Contact Long Island Tribal Nations</h3>
          <div class="content-list">
            <article class="content-card">
              <strong>Shinnecock Indian Nation</strong>
              <span>Southampton and surrounding regions</span>
              <span><a href="https://www.shinnecock-nsn.gov/" target="_blank" rel="noreferrer">shinnecock-nsn.gov</a></span>
            </article>
            <article class="content-card">
              <strong>Unkechaug Indian Nation</strong>
              <span>Mastic, Islip, Quogue, and surrounding regions</span>
              <span><a href="mailto:unkechaugnation@gmail.com">unkechaugnation@gmail.com</a> / (631) 281-6464</span>
            </article>
            <article class="content-card">
              <strong>Montaukett Indian Nation</strong>
              <span>East Hampton, Montauk, and surrounding region</span>
              <span><a href="https://montaukett.org/" target="_blank" rel="noreferrer">montaukett.org</a> / Sandi Brewster-Walker / <a href="mailto:sbrewsterw@gmail.com">sbrewsterw@gmail.com</a></span>
            </article>
            <article class="content-card">
              <strong>Matinecock Indian Nation</strong>
              <span>Oyster Bay, Queens, and surrounding region</span>
              <span><a href="https://www.matinecocktribalnation.org/" target="_blank" rel="noreferrer">matinecocktribalnation.org</a> / <a href="mailto:matinecocktribalnation@gmail.com">matinecocktribalnation@gmail.com</a></span>
            </article>
            <article class="content-card">
              <strong>Setalcott Indian Nation</strong>
              <span>Setauket and surrounding region</span>
              <span><a href="mailto:sellshelen9@aol.com">sellshelen9@aol.com</a></span>
            </article>
          </div>
        </section>
      `;
      markArticlePanelOpen();
      decorateCurrentArticleForLanguageQuiz("page", { title: "Contact", slug: "contact" });
      updateBackButton();
      resetArticleScroll();
    }

    function openSupportPage(options = {}) {
      rememberPanel();
      clearBiographyPathOverlay();
      state.activeContent = { type: "page", slug: "support" };
      clearActiveTimelineEvent();
      if (!options.skipRoute) setRoute({ page: "page-support" });
      const identity = currentContributorIdentity();
      const adoption = options.adoption ? {
        siteSlug: options.adoption.siteSlug || "",
        siteTitle: options.adoption.siteTitle || "this place",
        amount: Number(options.adoption.amount || 25),
        displayName: identity.name && identity.name !== "Contributor" ? identity.name : "your name"
      } : null;
      articleHeadEl.innerHTML = `
        <p class="article-kicker">On This Site</p>
        <h2>${adoption ? "Adopt This Place" : "Support Project"}</h2>
        ${adoption ? `<p class="article-meta">Monthly stewardship support for ${escapeHtml(adoption.siteTitle)}.</p>` : ""}
      `;
      articleBodyEl.innerHTML = SUPPORT_UTILS.supportFormHtml({
          settings: state.supportSettings || {},
          platform: "desktop",
          adoption,
          prefill: {
            name: identity.name && identity.name !== "Contributor" ? identity.name : "",
            email: identity.email || "",
            publicDisplayName: identity.name && identity.name !== "Contributor" ? identity.name : "",
            frequency: adoption ? "monthly" : "once",
            amount: adoption ? 25 : undefined
          },
          escapeHtml
        });
      SUPPORT_UTILS.renderPublicThankYous(articleBodyEl, { escapeHtml });
      markArticlePanelOpen();
      decorateCurrentArticleForLanguageQuiz("page", { title: "Support Project", slug: "support" });
      updateBackButton();
      resetArticleScroll();
    }

    async function openSupportAdminPage(options = {}) {
      if (!isAdminContributor()) {
        showBanner("Log in with the project admin account to view supporter activity.");
        openContributorLogin();
        return;
      }
      rememberPanel();
      clearBiographyPathOverlay();
      state.activeContent = { type: "page", slug: "support-admin" };
      clearActiveTimelineEvent();
      if (!options.skipRoute) setRoute({ page: "support-admin" });
      articleHeadEl.innerHTML = `
        <p class="article-kicker">Admin</p>
        <h2>Supporter Activity</h2>
        <p class="article-summary">Recent donor and supporter records from the private support system.</p>
      `;
      articleBodyEl.innerHTML = `<p class="article-summary">Loading supporter activity...</p>`;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
      try {
        const data = await SUPPORT_UTILS.fetchAdminSupportActivity(state.contributorSession?.token || "");
        articleBodyEl.innerHTML = SUPPORT_UTILS.supportAdminActivityHtml(data, { escapeHtml });
      } catch (error) {
        articleBodyEl.innerHTML = `<p class="form-status error">${escapeHtml(error.message || "Could not load supporter activity.")}</p>`;
        showBanner(error.message || "Could not load supporter activity.");
      }
    }

    async function submitSupportPayment(section) {
      const button = section.querySelector("[data-support-submit]");
      const originalLabel = button?.textContent || "Continue to secure payment";
      if (button) {
        button.disabled = true;
        button.textContent = "Opening secure payment...";
      }
      try {
        const checkoutResult = await SUPPORT_UTILS.startCheckout(section, { pageUrl: window.location.href });
        const checkoutUrl = typeof checkoutResult === "string" ? checkoutResult : checkoutResult?.url;
        if (checkoutResult?.embedded) {
          setInlineStatus(section, "[data-support-status]", "Secure payment form is ready below.", "success");
          if (button) {
            button.disabled = true;
            button.textContent = "Payment form ready";
          }
          return;
        }
        if (!checkoutUrl) throw new Error("Payment setup is not connected yet.");
        setInlineStatus(section, "[data-support-status]", "Opening secure payment...", "success");
        window.location.href = checkoutUrl;
      } catch (error) {
        setInlineStatus(section, "[data-support-status]", error.message || "Payment setup is not connected yet.", "error");
        showBanner(error.message || "Payment setup is not connected yet.");
        if (button) {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      }
    }

    async function submitContactMessage(section) {
      const identity = currentContributorIdentity();
      const name = section.querySelector("[data-contact-name]")?.value.trim() || identity.name || "";
      const email = section.querySelector("[data-contact-email]")?.value.trim() || identity.email || "";
      const message = section.querySelector("[data-contact-message]")?.value.trim() || "";
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email address or leave it blank.");
      if (message.length < 5) throw new Error("Enter a message.");
      const button = section.querySelector("[data-submit-contact]");
      if (button) {
        button.disabled = true;
        button.textContent = "Sending...";
      }
      const createdAt = new Date().toISOString();
      const profile = currentContributorProfile();
      const screenshotInput = section.querySelector("[data-feedback-screenshot]");
      const screenshotFile = state.feedbackScreenshotFile || screenshotInput?.files?.[0] || null;
      let screenshotId = null;
      try {
        let screenshotNote = screenshotFile ? "Screenshot capture/upload was requested." : "No screenshot.";
        if (screenshotFile) {
          try {
            if (button) button.textContent = "Uploading screenshot...";
            screenshotId = await uploadFeedbackScreenshot(screenshotFile, `desktop-feedback-${Date.now()}`);
            screenshotNote = screenshotId ? "Screenshot attached." : "Screenshot was not attached.";
          } catch (uploadError) {
            screenshotNote = `Screenshot could not be uploaded: ${uploadError.message || "permission denied"}.`;
            console.warn("Feedback screenshot upload failed; sending text feedback without it.", uploadError);
          }
        }
        if (button) button.textContent = "Sending...";
        const feedbackPayload = FEEDBACK_UTILS.buildFeedbackCommentPayload({
          platform: "desktop",
          name,
          email,
          message,
          profile,
          fallbackEmail: identity.email,
          pageUrl: window.location.href,
          screenshotId,
          screenshotNote,
          attachProfile: false,
          createdAt
        });
        await FEEDBACK_UTILS.submitFeedbackReview(feedbackPayload, { platform: "desktop", appUrl: window.location.href });
        setInlineStatus(section, "[data-contact-status]", "Feedback sent. Thank you.", "success");
        showBanner("Feedback sent. Thank you.");
        state.feedbackScreenshotFile = null;
        const messageInput = section.querySelector("[data-contact-message]");
        if (messageInput) messageInput.value = "";
        if (screenshotInput) screenshotInput.value = "";
        const screenshotStatus = section.querySelector("[data-feedback-screenshot-status]");
        if (screenshotStatus) screenshotStatus.textContent = "Optional screenshot helps explain what happened.";
        section.querySelectorAll("input, textarea, button").forEach(control => control.disabled = true);
        if (button) button.textContent = "Feedback sent";
      } catch (error) {
        const fallbackMessage = "The feedback could not be sent yet. Please try again, or email onthissiteny@gmail.com if this is urgent.";
        setInlineStatus(section, "[data-contact-status]", fallbackMessage, "error");
        showBanner("Could not send feedback yet.");
        if (button) {
          button.disabled = false;
          button.textContent = "Send feedback";
        }
        console.warn("Feedback submission failed.", error);
      }
    }

    function topPageRoute(kind) {
      return {
        home: "page-home",
        about: "page-about",
        blog: "blog",
        contact: "page-contact",
        feedback: "page-feedback",
        support: "page-support",
        "support-admin": "support-admin",
        donate: "page-support",
        "site-list": "site-list",
        knowledgebase: "knowledgebase",
        contributors: "contributors",
        events: "events",
        login: "login",
        profile: "profile",
        "suggest-site": "suggest-site"
      }[kind] || "";
    }

    function openContentList(kind, options = {}) {
      clearBiographyPathOverlay();
      state.activeContent = null;
      clearActiveTimelineEvent();
      const route = topPageRoute(kind);
      if (route && !options.skipRoute) setRoute({ page: route });
      if (kind === "contact" || kind === "feedback") {
        openContact({ skipRoute: true });
        return;
      }
      if (kind === "support" || kind === "donate") {
        openSupportPage({ skipRoute: true });
        return;
      }
      if (kind === "support-admin") {
        openSupportAdminPage({ skipRoute: true });
        return;
      }
      if (kind === "site-list") {
        openSiteList({ skipRoute: true });
        return;
      }
      if (kind === "knowledgebase") {
        openKnowledgebase();
        return;
      }
      if (kind === "contributors") {
        openContributors();
        return;
      }
      if (kind === "events") {
        openEventsList();
        return;
      }
      if (kind === "login") {
        if (currentContributorProfile()) {
          openContributorProfileRoute({ skipRoute: options.skipRoute });
          return;
        }
        openContributorLogin();
        return;
      }
      if (kind === "profile") {
        openContributorLogin();
        return;
      }
      if (kind === "suggest-site") {
        openSuggestSite();
        return;
      }
      rememberPanel();
      const isBlog = kind === "blog";
      const items = isBlog
        ? state.blogPosts
        : state.siteContent.filter(item => {
            if (kind === "pages") return item.content_type === "page" && !/cart|checkout|my-account|fire-island/i.test(item.slug);
            if (kind === "home") return item.content_type === "homepage";
            return item.slug === `page-${kind}` || item.content_type === kind;
          });
      if (!isBlog && items.length === 1) {
        openSiteContent(items[0], { source: kind === "home" ? "Homepage" : "Site page" });
        return;
      }
      const title = isBlog ? "Blog / News" : "Site Pages";
      articleHeadEl.innerHTML = `
        <p class="article-kicker">On This Site</p>
        <h2>${escapeHtml(title)}</h2>
      `;
      articleBodyEl.innerHTML = `
        <p class="article-summary">${isBlog ? "Recent posts from NativeLongIsland.com." : "Public pages from NativeLongIsland.com."}</p>
        <div class="content-list">
          ${isBlog ? items.map(blogCardHtml).join("") : items.map(pageCardHtml).join("")}
        </div>
      `;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
    }

    function openSiteList(options = {}) {
      if (!options.skipHistory) rememberPanel();
      clearBiographyPathOverlay();
      clearActiveTimelineEvent();
      state.activeContent = { type: "site-list" };
      if (!options.skipRoute) setRoute({ page: "site-list" });
      const previousScroll = options.preserveScroll ? articleBodyEl.scrollTop : 0;
      const items = sortedSiteListItems();
      const total = siteListPublishedSites().length;
      articleHeadEl.innerHTML = `
        <p class="article-kicker">On This Site</p>
        <h2>Site List</h2>
      `;
      articleBodyEl.innerHTML = `
        ${siteListFiltersHtml()}
        <p class="site-list-count" data-site-list-count>${items.length} of ${total} sites</p>
        <div class="content-list site-list" data-site-list-results>
          ${items.length ? siteListGroupsHtml(items) : "<p class=\"article-summary\">No sites match the active label filters.</p>"}
        </div>
      `;
      updateSiteListFilterChips();
      markArticlePanelOpen();
      updateBackButton();
      if (options.preserveScroll) articleBodyEl.scrollTop = previousScroll;
      else resetArticleScroll();
    }

    function openKnowledgebase() {
      rememberPanel();
      clearBiographyPathOverlay();
      state.activeContent = null;
      clearActiveTimelineEvent();
      const tribeArticle = state.wikiBySlug.get("the-tribes-of-long-island");
      const latest = [...state.wikiArticles]
        .sort((a, b) => String(b.lastmod || "").localeCompare(String(a.lastmod || "")))
        .slice(0, 8);
      articleHeadEl.innerHTML = `
        <p class="article-kicker">On This Site</p>
        <h2>Knowledgebase</h2>
      `;
      articleBodyEl.innerHTML = `
        <p class="article-summary">Browse research articles, categories, and tags connected to Native Long Island history, place, language, and community memory.</p>
        ${tribeArticle ? contentCardHtml({ type: "wiki", item: tribeArticle }) : ""}
        <section class="section">
          <h3>Categories</h3>
          <div class="content-list">
            ${KNOWLEDGEBASE_CATEGORIES.map(category => {
              const count = categoryItems(category).length || (category.entries || category.slugs || []).length;
              return `<button class="content-card" type="button" data-kb-category="${escapeHtml(category.label)}">
                <span class="content-card-body">
                  <span class="content-card-meta">Category</span>
                  <strong>${escapeHtml(category.label)}</strong>
                  <span class="content-card-summary">${count} related article${count === 1 ? "" : "s"}</span>
                </span>
              </button>`;
            }).join("")}
          </div>
        </section>
        <section class="section">
          <h3>Popular Tags</h3>
          <div class="keyword-actions" aria-label="Popular knowledgebase tags">
            ${POPULAR_TAGS.map(tag => `<button class="button secondary" type="button" data-kb-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")}
          </div>
        </section>
        <section class="section">
          <h3>Latest Articles</h3>
          <div class="content-list">
            ${latest.map(article => contentCardHtml({ type: "wiki", item: article })).join("")}
          </div>
        </section>
      `;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
    }

    function renderKnowledgebaseCategory(label, matches) {
      articleHeadEl.innerHTML = `
        <p class="article-kicker">Knowledgebase category</p>
        <h2>${escapeHtml(label)}</h2>
      `;
      articleBodyEl.innerHTML = `
        <div class="content-list">
          ${matches.map(contentCardHtml).join("") || "<p class=\"article-summary\">No articles matched this category yet.</p>"}
        </div>
      `;
    }

    function openKnowledgebaseCategory(label) {
      rememberPanel();
      const category = KNOWLEDGEBASE_CATEGORIES.find(item => item.label === label);
      renderKnowledgebaseCategory(label, categoryItems(category));
      if (fullArchiveDataLoaded) return;
      articleBodyEl.innerHTML = "<p class=\"article-summary\">Loading category articles...</p>";
      requestFullArchiveData("knowledgebase-category")
        .then(() => renderKnowledgebaseCategory(label, categoryItems(category)))
        .catch(error => {
          console.warn("Knowledgebase category details will continue loading in the background.", error);
          renderKnowledgebaseCategory(label, categoryItems(category));
        });
    }

    function openUnpairedFeature(feature, source) {
      rememberPanel();
      clearBiographyPathOverlay();
      state.activeContent = null;
      const props = feature?.properties || {};
      const wikiSlug = slugFromWikiUrl(props.link || props.original_link);
      const wikiArticle = wikiSlug ? state.wikiBySlug.get(wikiSlug) : null;
      if (wikiArticle) {
        openWikiArticle(wikiArticle, { source, featureTitle: props.title || props.polyname });
        return;
      }
      clearActiveTimelineEvent();
      articleHeadEl.innerHTML = `
        <p class="article-kicker">${escapeHtml(source)}</p>
        <h2>${escapeHtml(props.title || props.polyname || "Map feature")}</h2>
        ${placeAdoptionBylineHtml(props)}
      `;
      articleBodyEl.innerHTML = `
        ${props.description ? `<div class="article-summary">${cleanHtml(props.description)}</div>` : ""}
        ${placeAdoptionCtaHtml({ ...props, title: props.title || props.polyname || "Map feature", slug: props.slug || props.id || props.title || props.polyname }, { kind: "polygon" })}
      `;
      markArticlePanelOpen();
      updateBackButton();
      resetArticleScroll();
    }

    function openMapArticle(feature, source) {
      rememberPanel();
      clearBiographyPathOverlay();
      state.activeContent = null;
      clearActiveTimelineEvent();
      const props = feature?.properties || {};
      const title = displayFeatureTitle(props);
      articleHeadEl.innerHTML = `
        <p class="article-kicker">${escapeHtml(source)}</p>
        <h2>${escapeHtml(title)}</h2>
        ${placeAdoptionBylineHtml(props)}
      `;
      articleBodyEl.innerHTML = `
        ${props.description ? `<div class="article-summary">${cleanHtml(props.description)}</div>` : ""}
        ${placeAdoptionCtaHtml({ ...props, title, slug: props.slug || props.id || title }, { kind: "polygon" })}
      `;
      markArticlePanelOpen();
      updateBackButton();
    }

    function findSiteFromFeature(feature) {
      const props = feature?.properties || {};
      // Older WordPress territory polygons sometimes point at a smaller site that
      // shared their listing URL. Resolve broad territory titles first so a large
      // ancestral-land polygon cannot open the reservation article.
      if (isLegacyBroadTerritoryFeature(feature)) {
        const territorySite = findSiteByFeatureTitle(displayFeatureTitle(props), feature?.geometry?.type);
        if (territorySite) return territorySite;
      }
      const directusId = Number(props.directus_site_id);
      if (Number.isFinite(directusId) && state.siteById.has(directusId)) return state.siteById.get(directusId);
      const slug = listingSlugAlias(props.directus_site_slug || props.listing_slug || props.slug || slugFromListingUrl(props.link || props.original_link));
      if (slug && state.siteBySlug.has(slug)) return state.siteBySlug.get(slug);
      return findSiteByFeatureTitle(props.title || props.polyname, feature?.geometry?.type);
    }

    function slugFromListingUrl(url) {
      return ROUTE_UTILS.slugFromListingUrl(url);
    }

    function listingSlugAlias(slug) {
      return ROUTE_UTILS.listingSlugAlias(slug);
    }

    function slugFromWikiUrl(url) {
      return ROUTE_UTILS.slugFromWikiUrl(url);
    }

    function normalizeName(value) {
      return String(value || "")
        .toLowerCase()
        .replace(/ancestral land|traditional land|indian reservation|reservation|territory|people|nation|tribe/g, "")
        .replace(/[^a-z0-9]+/g, "");
    }

    function findSiteByFeatureTitle(title, geometryType = "") {
      const normalized = normalizeName(title);
      if (!normalized) return null;
      return state.sites.find(site => {
        const siteName = normalizeName(site.title);
        const siteSlug = normalizeName(site.slug);
        if (siteName === normalized || siteSlug === normalized) return true;
        if (/Polygon/.test(geometryType)) return false;
        return siteName.startsWith(normalized) ||
          normalized.startsWith(siteName) ||
          siteSlug.startsWith(normalized) ||
          normalized.startsWith(siteSlug);
      }) || null;
    }

    function mapStoryAuthorHeadingHtml(story) {
      const authorName = MAP_STORY_UTILS.authorName(story);
      const profile = profileFromMapStory(story);
      if (!profile) return `${escapeHtml(authorName)} says:`;
      const profileKey = profile.id || profile.slug || authorName;
      return `<button class="story-profile-link" type="button" data-open-profile="${escapeHtml(profileKey)}" aria-label="Open ${escapeHtml(authorName)} profile">${escapeHtml(authorName)}</button> says:`;
    }

    function mergeMapStoryVoteRecords(records = []) {
      MAP_STORY_UTILS.mergeVoteRecords(state.mapStoryVotes, records);
    }

    async function refreshRemoteMapStoryVote(storyId, profileId) {
      if (!storyId || !profileId) return null;
      const response = await fetchJson(
        `/items/mobile_map_story_votes?limit=1&filter[story][_eq]=${encodeURIComponent(storyId)}&filter[member_profile][_eq]=${encodeURIComponent(profileId)}&fields=${INITIAL_MAP_STORY_VOTE_FIELDS}`,
        { fresh: true }
      );
      const record = response.data?.[0] || null;
      if (record) mergeMapStoryVoteRecords([record]);
      return record;
    }

    function focusMapStory(story, options = {}) {
      const coords = MAP_STORY_UTILS.coordinates(story);
      if (!coords) return;
      const [lng, lat] = coords;
      const zoom = Math.max(Number(state.map?.getZoom?.() || 0), 12.5);
      const duration = Number.isFinite(Number(options.duration)) ? Number(options.duration) : 850;
      if (state.leafletMap?.flyTo) {
        state.leafletMap.flyTo([lat, lng], zoom, { duration: duration / 1000 });
        return;
      }
      if (state.map?.easeTo) {
        state.map.easeTo({ center: [lng, lat], zoom, padding: focusPadding(), duration, essential: true });
      }
    }

    async function voteMapStory(storyId, value) {
      const story = state.mapStories.find(item => String(item.id) === String(storyId));
      if (!story) return;
      const profile = currentContributorProfile();
      if (!profile?.id || state.contributorSession?.pending) {
        showBanner("Login as an approved contributor to vote on map stories.");
        return;
      }
      const remoteVote = await refreshRemoteMapStoryVote(story.id, profile.id).catch(() => null);
      if (remoteVote) {
        showBanner("You already voted on this story.");
        openMapStoryPanel(story);
        return;
      }
      if (MAP_STORY_UTILS.hasMemberVote(story, state.mapStoryVotes, currentContributorProfile()?.id)) {
        showBanner("You already voted on this story.");
        return;
      }
      const vote = {
        story: Number(story.id),
        vote: Number(value) > 0 ? 1 : -1,
        visitor_key: MAP_STORY_UTILS.memberVoteKey(story?.id, profile?.id),
        created_at: new Date().toISOString()
      };
      try {
        const created = await postDirectusItem("mobile_map_story_votes", vote, { requireAuth: true });
        mergeMapStoryVoteRecords([{ id: created.data?.id || `local-${Date.now()}`, ...vote, member_profile: Number(profile.id), ...(created.data || {}) }]);
        const counts = MAP_STORY_UTILS.storyVoteCounts(story, state.mapStoryVotes);
        const patch = {
          up_votes: counts.up,
          down_votes: counts.down,
          vote_score: counts.score,
          permanent: Boolean(story.permanent || counts.score >= MAP_STORY_PERMANENT_SCORE)
        };
        const expiry = MAP_STORY_UTILS.effectiveExpiresAt(story, state.mapStoryVotes, MAP_STORY_RULES);
        if (expiry) patch.expires_at = expiry.toISOString();
        if (expiry && expiry.getTime() <= Date.now()) patch.status = "archived";
        Object.assign(story, patch);
        if (state.map?.getSource("map-stories")) state.map.getSource("map-stories").setData(mapStoryFeatures());
        openMapStoryPanel(story);
      } catch (error) {
        showBanner(error.message || "Could not save vote.");
      }
    }

    function openMapStoryPanel(story) {
      rememberPanel();
      state.activeContent = { type: "map-story", id: story.id };
      clearActiveTimelineEvent();
      const counts = MAP_STORY_UTILS.storyVoteCounts(story, state.mapStoryVotes);
      const photo = directusAssetUrl(story.photo);
      articleHeadEl.innerHTML = `
        <p class="article-kicker">Visitor Story</p>
        <h2>${mapStoryAuthorHeadingHtml(story)}</h2>
      `;
      articleBodyEl.innerHTML = `
        <section class="map-story-panel-card">
          ${photo ? `<img class="article-hero map-story-panel-photo" src="${escapeHtml(photo)}" alt="" loading="lazy" decoding="async">` : ""}
          <p class="map-story-panel-text">${escapeHtml(MAP_STORY_UTILS.quotedText(story))}</p>
          <p class="detail-meta">${escapeHtml(MAP_STORY_UTILS.timeLabel(story, state.mapStoryVotes, MAP_STORY_RULES))}</p>
          ${story.attached_site_slug ? `<button class="article-action" type="button" data-story-site="${escapeHtml(story.attached_site_slug)}">Open ${escapeHtml(story.attached_site_title || "attached site")}</button>` : ""}
        </section>
        <div class="article-actions map-story-actions">
          <button class="article-action" type="button" data-story-vote="1" data-story-id="${escapeHtml(story.id)}" aria-label="Helpful story">Helpful ${counts.up}</button>
          <span class="detail-meta">${counts.up} helpful vote${counts.up === 1 ? "" : "s"}; 10 keeps it permanently.</span>
        </div>
      `;
      markArticlePanelOpen();
      updateBackButton();
    }

    function mapFeatureTapPoint(originalEvent) {
      const touch = originalEvent?.changedTouches?.[0] || originalEvent?.touches?.[0];
      const clientX = Number(touch?.clientX ?? originalEvent?.clientX);
      const clientY = Number(touch?.clientY ?? originalEvent?.clientY);
      return Number.isFinite(clientX) && Number.isFinite(clientY) ? { x: clientX, y: clientY } : null;
    }

    function isTouchMapFeatureEvent(originalEvent) {
      if (!originalEvent) return false;
      if (originalEvent.pointerType === "touch") return true;
      if (/^touch/i.test(String(originalEvent.type || ""))) return true;
      return Boolean(originalEvent.changedTouches?.length || originalEvent.touches?.length);
    }

    function shouldCollapseMapFeatureTaps(originalEvent) {
      if (isTouchMapFeatureEvent(originalEvent)) return true;
      return Boolean(window.matchMedia?.("(pointer: coarse)")?.matches);
    }

    function claimMapFeatureTap(originalEvent) {
      if (!shouldCollapseMapFeatureTaps(originalEvent)) return true;
      if (originalEvent?.__nliMapFeatureTapClaimed) return false;
      if (originalEvent) {
        try {
          originalEvent.__nliMapFeatureTapClaimed = true;
        } catch (error) {
          // Some synthetic events are not extensible; the time/point guard below still applies.
        }
      }
      const now = nowMs();
      const point = mapFeatureTapPoint(originalEvent);
      const previousX = Number(state.mapFeatureTapClaimX);
      const previousY = Number(state.mapFeatureTapClaimY);
      const hasPreviousPoint = Number.isFinite(previousX) && Number.isFinite(previousY);
      const distance = point && hasPreviousPoint ? Math.hypot(point.x - previousX, point.y - previousY) : 0;
      if (now < Number(state.mapFeatureTapClaimUntil || 0) && (!point || !hasPreviousPoint || distance <= 72)) return false;
      state.mapFeatureTapClaimUntil = now + 680;
      state.mapFeatureTapClaimX = point?.x ?? null;
      state.mapFeatureTapClaimY = point?.y ?? null;
      return true;
    }

    function handleFeatureClick(feature, source, originalEvent = null, clickLngLat = null) {
      if (!claimMapFeatureTap(originalEvent)) return;
      hoverPopup.remove();
      hideLeafletHoverCard();
      state.activeHoverFeatureKey = "";
      setHoverFeature(null);
      if (state.map?.getCanvas) state.map.getCanvas().style.cursor = "";
      const props = feature?.properties || {};
      const isBiographyPerson = isBiographyPersonFeature(feature);
      if (!isBiographyPerson) stopBiographyPersonFollow();
      stopWhalingWhaleFollow();
      if (props.map_story_id) {
        const story = state.mapStories.find(item => String(item.id) === String(props.map_story_id));
        if (story) {
          openMapStoryPanel(story);
          focusMapStory(story);
          return;
        }
      }
      if (props.calendar_event_slug && state.eventBySlug.has(props.calendar_event_slug)) {
        openCalendarEvent(state.eventBySlug.get(props.calendar_event_slug), { source: "Calendar event" });
        focusFeature(feature);
        return;
      }
      if (props.wiki_slug && state.wikiBySlug.has(props.wiki_slug)) {
        openWikiArticle(state.wikiBySlug.get(props.wiki_slug), {
          source: isBiographyPerson ? "Knowledgebase biography" : "Biography path",
          featureTitle: displayFeatureTitle(props),
          timelineEventId: props.event_id || props.eventId || "",
          focus: isBiographyPerson ? false : undefined
        });
        if (!isBiographyPerson) {
          focusFeature(feature, { duration: 700 });
        } else {
          const clickedAt = nowMs();
          window.setTimeout(() => {
            if (!userMovedMapSince(clickedAt)) startBiographyPersonFollow(feature);
          }, 140);
          window.setTimeout(() => {
            if (!userMovedMapSince(clickedAt) && state.followedBiographySlug === (feature?.properties?.wiki_slug || "")) {
              recenterFollowedBiographyCamera();
            }
          }, 420);
        }
        return;
      }
      if (isImportedTerritory(feature)) {
        const target = territoryTarget(feature);
        const localFocus = broadTerritoryClickFocus(feature, clickLngLat);
        if (target?.type === "site") {
          openListing(target.item, {
            source: "Territory source",
            featureTitle: displayFeatureTitle(props),
            focusGeometry: feature.geometry,
            focusCenter: localFocus?.center || null,
            focusZoom: localFocus?.zoom || null,
            localPolygonFocus: Boolean(localFocus)
          });
          return;
        } else if (target?.type === "wiki") {
          openWikiArticle(target.item, { source: "Territory knowledgebase article", featureTitle: displayFeatureTitle(props) });
        } else {
          openMapArticle(feature, "Territory article");
        }
        focusFeature(feature);
        return;
      }
      const site = findSiteFromFeature(feature);
      if (site) {
        syncGuidedLearningPathStopForSite(site);
        const localFocus = broadTerritoryClickFocus(feature, clickLngLat, site);
        openListing(site, {
          source,
          featureTitle: displayFeatureTitle(props) || props.directus_site_title,
          focusGeometry: feature.geometry,
          focusCenter: localFocus?.center || null,
          focusZoom: localFocus?.zoom || null,
          localPolygonFocus: Boolean(localFocus)
        });
      } else {
        openUnpairedFeature(feature, source);
        focusFeature(feature);
      }
    }

    function featurePreview(feature) {
      if (suppressHoverPopupForFeature(feature)) return {};
      if (isBiographyPersonFeature(feature)) return biographyPersonFeaturePreview(feature);
      if (feature?.properties?.moving_dog === "true") {
        const article = movingDogTargetArticle();
        const summary = article?.summary || feature.properties.description || "Dogs in Indigenous Long Island life, memory, and colonial conflict.";
        return {
          title: article?.title || feature.properties.title || "Dog",
          summary: hoverSummary(summary, { limit: 260, minSentenceLength: 90 }),
          image: "",
          imageFallback: "",
          meta: "",
          tags: [],
          actions: []
        };
      }
      const previewCacheKey = featurePreviewCacheKey(feature);
      if (previewCacheKey && state.featurePreviewCache.has(previewCacheKey)) return state.featurePreviewCache.get(previewCacheKey);
      const preview = FEATURE_PREVIEW_UTILS.buildFeaturePreview ? FEATURE_PREVIEW_UTILS.buildFeaturePreview(feature, {
        findMapStory: id => state.mapStories.find(item => String(item.id) === String(id)),
        findEventBySlug: slug => state.eventBySlug.get(slug),
        mapStoryAuthorName: story => MAP_STORY_UTILS.authorName(story),
        mapStoryTimeLabel: story => MAP_STORY_UTILS.timeLabel(story, state.mapStoryVotes, MAP_STORY_RULES),
        quotedMapStoryText: MAP_STORY_UTILS.quotedText,
        hoverSummary,
        directusAssetUrl,
        eventDateRange: event => CALENDAR_UTILS.eventDateRange(event),
        stripHtml,
        isImportedTerritory,
        territoryTarget,
        findSiteFromFeature,
        displayFeatureTitle,
        listingHoverImage,
        listingThumbFallback,
        safeSiteSubtitle,
        featureCategoryLabel,
        siteCategoryTags
      }) : {};
      const resolvedPreview = preview?.title ? preview : fallbackFeaturePreview(feature);
      if (previewCacheKey && resolvedPreview?.title) state.featurePreviewCache.set(previewCacheKey, resolvedPreview);
      return resolvedPreview;
    }

    function featurePreviewCacheKey(feature) {
      if (!feature || isBiographyPersonFeature(feature)) return "";
      const props = feature.properties || {};
      if (props.map_story_id) return "";
      if (props.moving_dog === "true") return "";
      const key = hoverFeatureKey(feature);
      return key ? `${fullArchiveDataLoaded ? "full" : "compact"}|${key}` : "";
    }

    function fallbackFeaturePreview(feature) {
      if (suppressHoverPopupForFeature(feature)) return {};
      const props = feature?.properties || {};
      const site = findSiteFromFeature(feature);
      const title = site?.title || displayFeatureTitle(props) || props.directus_site_title || props.listing_title || props.name || "";
      if (!title) return {};
      const categoryLabel = featureCategoryLabel(props.feature_category);
      const rawSummary = site?.summary || site?.address_label || props.description || props.address || categoryLabel || "";
      return {
        title,
        summary: hoverSummary(rawSummary || "Full article details are still loading.", { limit: 260, minSentenceLength: 90 }),
        image: site ? listingHoverImage(site) || "" : props.gallery?.[0]?.thumbnail || props.pic || "",
        imageFallback: site ? listingThumbFallback(site) || "" : "",
        meta: site ? safeSiteSubtitle(site) : categoryLabel,
        tags: site ? siteCategoryTags(site).map(tag => typeof tag === "string" ? tag : tag?.label).filter(Boolean).slice(0, 3) : [categoryLabel].filter(Boolean),
        actions: fullArchiveDataLoaded ? [] : ["Loading full details"]
      };
    }

    function hoverSummary(value, options = {}) {
      return HOVER_CARD_UTILS.hoverSummary
        ? HOVER_CARD_UTILS.hoverSummary(value, options)
        : ACTIVITY_UTILS.preview(value, { limit: 190, cleanText: stripHtml, preferSentence: true });
    }

    function isImportedTerritory(feature) {
      const props = feature?.properties || {};
      if (props.directus_site_id || props.directus_site_slug) return false;
      const title = displayFeatureTitle(props).toLowerCase();
      return props.feature_category === "territory" && /ancestral land|traditional land/.test(title);
    }

    function suppressHoverPopupForFeature(feature) {
      const props = feature?.properties || {};
      const site = findSiteFromFeature(feature);
      if (site && isBroadTerritorySite(site)) return true;
      const title = displayFeatureTitle(props).toLowerCase();
      return props.feature_category === "territory" && /ancestral land|traditional land/.test(title);
    }

    function bestHoverPolygonFeature(features = []) {
      return bestPolygonFeature(features.filter(feature => !suppressHoverPopupForFeature(feature))) ||
        bestPolygonFeature(features);
    }

    function territoryTarget(feature) {
      const title = displayFeatureTitle(feature?.properties).toLowerCase();
      const directSlug = listingSlugAlias(slugFromListingUrl(feature?.properties?.link || feature?.properties?.original_link));
      const route = [
        [/montaukett/, ["wiki", "tribal-montaukett"]],
        [/shinnecock/, [["site", "shinnecock-ancestral-land"], ["site", "shinnecock-indian-reservation"]]],
        [/unkechaug/, [["site", "unkechaug-ancestral-land"], ["site", "unkechaug-indian-reservation"]]],
        [/matinecock/, ["site", "matinecock"]],
        [/corchaug/, ["site", "corchaug-tribe"]],
        [/manhansett|hoggenoch/, ["site", "manhansack-aqua-quash-awamock"]],
        [/setauket/, ["site", "setauket-ancestral-land"]],
        [/nissequogue/, ["site", "nissaquogue"]],
        [/secatogue/, ["site", "secatogues"]],
        [/massapequa/, ["site", "massapequas"]],
        [/merrick/, ["site", "merricks"]],
        [/rockaway/, ["site", "rockaways"]],
        [/canarsie/, ["site", "canarsie"]]
      ].find(([pattern]) => pattern.test(title));
      const routeCandidates = route
        ? (Array.isArray(route[1]?.[0]) ? route[1] : [route[1]])
        : [];
      const candidates = routeCandidates.length ? routeCandidates : [[directSlug ? "site" : "", directSlug], ["wiki", "the-tribes-of-long-island"]];
      for (const [type, slug] of candidates) {
        if (type === "site" && slug && state.siteBySlug.has(slug)) return { type, item: state.siteBySlug.get(slug) };
        if (type === "wiki" && slug && state.wikiBySlug.has(slug)) return { type, item: state.wikiBySlug.get(slug) };
      }
      return null;
    }

    function bestPolygonFeature(features) {
      return preferredAncestralLandFeature(features) || [...features].sort((a, b) => polygonClickScore(a) - polygonClickScore(b))[0];
    }

    function featureListingSlug(feature) {
      const props = feature?.properties || {};
      return listingSlugAlias(props.directus_site_slug || props.listing_slug || props.slug || slugFromListingUrl(props.link || props.original_link));
    }

    function ancestralLandCommunity(feature) {
      const props = feature?.properties || {};
      const text = normalizeComparisonText([
        featureListingSlug(feature),
        displayFeatureTitle(props),
        props.description,
        props.site_type
      ].filter(Boolean).join(" "));
      if (text.includes("shinnecock")) return "shinnecock";
      if (text.includes("unkechaug")) return "unkechaug";
      return "";
    }

    function isAncestralLandClickFeature(feature) {
      const slug = featureListingSlug(feature);
      if (slug === "shinnecock-ancestral-land" || slug === "unkechaug-ancestral-land") return true;
      const props = feature?.properties || {};
      return /ancestral land/i.test(`${displayFeatureTitle(props)} ${props.site_type || ""}`);
    }

    function isReservationClickFeature(feature) {
      const slug = featureListingSlug(feature);
      if (slug === "shinnecock-indian-reservation" || slug === "unkechaug-indian-reservation") return true;
      const props = feature?.properties || {};
      return /reservation/i.test(`${displayFeatureTitle(props)} ${props.site_type || ""}`);
    }

    function preferredAncestralLandFeature(features = []) {
      const candidates = features.filter(isAncestralLandClickFeature);
      if (!candidates.length) return null;
      const reservationCommunities = new Set(features.filter(isReservationClickFeature).map(ancestralLandCommunity).filter(Boolean));
      const preferred = candidates
        .filter(feature => reservationCommunities.has(ancestralLandCommunity(feature)))
        .sort((a, b) => polygonClickScore(a) - polygonClickScore(b));
      return preferred[0] || null;
    }

    function polygonFeatureKey(feature) {
      const props = feature?.properties || {};
      return [
        feature?.layer?.id || "",
        feature?.source || "",
        props.directus_site_id || props.directus_site_slug || props.calendar_event_id || props.calendar_event_slug || props.id || props.wp_id || props.wp_feature_id || props.slug || "",
        displayFeatureTitle(props)
      ].join("|");
    }

    function hoverFeatureKey(feature) {
      const props = feature?.properties || {};
      return [
        polygonFeatureKey(feature),
        props.icon_key || props.icon_url || "",
        props.listing_slug || props.directus_site_slug || ""
      ].join("|");
    }

    function uniqueFeatures(features) {
      return SHARED_UTILS.uniqueBy(features, polygonFeatureKey);
    }

    function queryPolygonFeatures(point, options = {}) {
      if (!polygonToggle.checked) return [];
      const includeScreenBounds = options.includeScreenBounds !== false;
      const layers = MAP_UTILS.existingLayerIds(state.map, ["calendar-event-polygons", "directus-site-polygons", "directus-site-territories", "place-name-area-label", "place-name-area-fill", "gardiners-montaukett-territory-fill", "wp-polygons-original-fill", "wp-polygons-detail-fill"]);
      const exact = state.map.queryRenderedFeatures(point, { layers });
      const tolerance = Number(options.tolerance || 14);
      const nearby = MAP_UTILS.queryRenderedFeaturesAround(state.map, point, layers, tolerance);
      const screenMatches = includeScreenBounds
        ? screenPolygonFeatures(point).filter(feature => featureIsActiveAtPoint(feature, point))
        : [];
      return uniqueFeatures([...exact, ...nearby, ...geographicPolygonFeatures(point), ...screenMatches]);
    }

    function queryMarkerFeatures(point, options = {}) {
      const layers = MAP_UTILS.existingLayerIds(state.map, ["learning-path-stop-labels", "learning-path-stop-numbers", "learning-path-stop-halos", "site-attention-history-icon", "site-attention-history-badge", "map-story-labels", "map-stories", "biography-people-quotes", "biography-people-labels", "biography-people", "biography-place-labels", "biography-place-points", "biography-place-path", "biography-path-labels", "biography-path-point-numbers", "biography-path-points", "biography-path-lines", "calendar-event-icons", "calendar-event-points", "directus-site-icons", "wp-markers-original-icon", "wp-markers-original-dot", "directus-site-points"]);
      if (!layers.length) return [];
      const exact = state.map.queryRenderedFeatures(point, { layers });
      const tolerance = Number(options.tolerance || 18);
      const nearby = MAP_UTILS.queryRenderedFeaturesAround(state.map, point, layers, tolerance)
        .filter(feature => markerFeatureWithinQueryTolerance(feature, point, tolerance));
      return uniqueFeatures([...exact, ...nearby]);
    }

    function markerFeatureWithinQueryTolerance(feature, point, fallbackTolerance = 18) {
      const layerId = feature?.layer?.id || "";
      if (!/^biography-/.test(layerId)) return true;
      const coords = feature?.geometry?.type === "Point" ? feature.geometry.coordinates : null;
      if (!coords || !state.map?.project) return true;
      const projected = state.map.project(coords);
      const dx = Number(projected?.x) - Number(point?.x);
      const dy = Number(projected?.y) - Number(point?.y);
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return true;
      const zoom = Number(state.map?.getZoom?.() || 0);
      const biographyTolerance = zoom < BIOGRAPHY_PERSON_LABEL_MIN_ZOOM ? 7 : 10;
      return Math.hypot(dx, dy) <= Math.min(fallbackTolerance, biographyTolerance);
    }

    function featureIsActiveAtPoint(feature, point) {
      const category = feature?.properties?.feature_category || "";
      if (!/territory|reservation/.test(category)) return true;
      if (!state.landMaskData || !state.map) return true;
      const lngLat = state.map.unproject(point);
      return pointInGeometry([lngLat.lng, lngLat.lat], state.landMaskData.geometry);
    }

    function geographicPolygonFeatures(point) {
      if (!state.map) return [];
      const lngLat = state.map.unproject(point);
      const clickPoint = [lngLat.lng, lngLat.lat];
      const imported = (filteredPolygonFeatures().features || [])
        .filter(feature => pointInGeometry(clickPoint, feature.geometry))
        .map(feature => ({
          ...feature,
          source: feature.properties?.place_name_area_overlay ? "place-name-areas" : "wp-polygons-original",
          layer: { id: importedPolygonLayerId(feature) },
          properties: { ...(feature.properties || {}) }
        }));
      const managed = (filteredManagedSiteFeatures().features || [])
        .filter(feature => /Polygon/.test(feature.geometry?.type || ""))
        .filter(feature => pointInGeometry(clickPoint, feature.geometry))
        .map(feature => ({
          ...feature,
          source: "directus-site-geometries",
          layer: { id: "directus-site-polygons" }
        }));
      const events = (calendarEventFeatures().features || [])
        .filter(feature => /Polygon/.test(feature.geometry?.type || ""))
        .filter(feature => pointInGeometry(clickPoint, feature.geometry))
        .map(feature => ({
          ...feature,
          source: "calendar-events",
          layer: { id: "calendar-event-polygons" }
        }));
      return [...events, ...managed, ...imported];
    }

    function geographicPolygonFeaturesAtLngLat(lngLat) {
      if (!lngLat || !polygonToggle?.checked) return [];
      const clickPoint = [Number(lngLat.lng), Number(lngLat.lat)];
      if (!clickPoint.every(Number.isFinite)) return [];
      const imported = (filteredPolygonFeatures().features || [])
        .filter(feature => pointInGeometry(clickPoint, feature.geometry))
        .map(feature => ({
          ...feature,
          source: feature.properties?.place_name_area_overlay ? "place-name-areas" : "wp-polygons-original",
          layer: { id: importedPolygonLayerId(feature) },
          properties: { ...(feature.properties || {}) }
        }));
      const managed = (filteredManagedSiteFeatures().features || [])
        .filter(feature => /Polygon/.test(feature.geometry?.type || ""))
        .filter(feature => pointInGeometry(clickPoint, feature.geometry))
        .map(feature => ({
          ...feature,
          source: "directus-site-geometries",
          layer: { id: "directus-site-polygons" }
        }));
      const events = (calendarEventFeatures().features || [])
        .filter(feature => /Polygon/.test(feature.geometry?.type || ""))
        .filter(feature => pointInGeometry(clickPoint, feature.geometry))
        .map(feature => ({
          ...feature,
          source: "calendar-events",
          layer: { id: "calendar-event-polygons" }
        }));
      return uniqueFeatures([...events, ...managed, ...imported]);
    }

    function screenPolygonFeatures(point) {
      if (!state.map) return [];
      const features = [
        ...(calendarEventFeatures().features || []).map(feature => ({ feature, source: "calendar-events", layerId: "calendar-event-polygons" })),
        ...(filteredManagedSiteFeatures().features || []).map(feature => ({ feature, source: "directus-site-geometries", layerId: "directus-site-polygons" })),
        ...(filteredPolygonFeatures().features || []).map(feature => ({
          feature,
          source: feature.properties?.place_name_area_overlay ? "place-name-areas" : "wp-polygons-original",
          layerId: importedPolygonLayerId(feature)
        }))
      ];
      return features
        .filter(({ feature }) => /Polygon/.test(feature.geometry?.type || ""))
        .filter(({ feature }) => pointInProjectedFeatureBounds(point, feature))
        .map(({ feature, source, layerId }) => ({
          ...feature,
          source,
          layer: { id: layerId },
          properties: {
            ...(feature.properties || {}),
            polygon_sort_key: polygonSortKey(feature)
          }
        }));
    }

    function pointInProjectedFeatureBounds(point, feature) {
      const coords = [];
      collectCoordinates(feature.geometry?.coordinates, coords);
      const projected = coords
        .filter(coord => isLongIslandCoordinate(Number(coord[0]), Number(coord[1])))
        .map(coord => state.map.project(coord));
      if (!projected.length) return false;
      const xs = projected.map(coord => coord.x);
      const ys = projected.map(coord => coord.y);
      const tolerance = 3;
      return point.x >= Math.min(...xs) - tolerance &&
        point.x <= Math.max(...xs) + tolerance &&
        point.y >= Math.min(...ys) - tolerance &&
        point.y <= Math.max(...ys) + tolerance;
    }

    function pointInGeometry(point, geometry) {
      if (!pointInGeometryBounds(point, geometry)) return false;
      return GEOMETRY_UTILS.pointInGeometry(point, geometry);
    }

    function cachedGeometryBounds(geometry) {
      if (!geometry || typeof geometry !== "object") return null;
      const cached = state.geometryBoundsCache.get(geometry);
      if (cached !== undefined) return cached;
      const bounds = geometryBounds(geometry);
      state.geometryBoundsCache.set(geometry, bounds || null);
      return bounds || null;
    }

    function pointInGeometryBounds(point, geometry, padding = 0.000001) {
      if (!Array.isArray(point) || !geometry) return false;
      const bounds = cachedGeometryBounds(geometry);
      if (!bounds) return false;
      const lng = Number(point[0]);
      const lat = Number(point[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
      return lng >= bounds[0][0] - padding &&
        lng <= bounds[1][0] + padding &&
        lat >= bounds[0][1] - padding &&
        lat <= bounds[1][1] + padding;
    }

    function isPolygonFeature(feature) {
      return /Polygon/.test(feature?.geometry?.type || "");
    }

    function bestLeafletPolygonAtLatLng(latlng, fallbackFeature = null) {
      if (!latlng || !isPolygonFeature(fallbackFeature)) return fallbackFeature;
      if (fallbackFeature?.properties?.place_name_area_overlay === true || fallbackFeature?.properties?.place_name_area_overlay === "true") {
        return fallbackFeature;
      }
      return bestPolygonFeature(geographicPolygonFeaturesAtLngLat(latlng)) || fallbackFeature;
    }

    function bestLeafletHoverPolygonAtLatLng(latlng, fallbackFeature = null) {
      if (!latlng || !isPolygonFeature(fallbackFeature)) return fallbackFeature;
      if (fallbackFeature?.properties?.place_name_area_overlay === true || fallbackFeature?.properties?.place_name_area_overlay === "true") {
        return fallbackFeature;
      }
      return bestHoverPolygonFeature(geographicPolygonFeaturesAtLngLat(latlng)) || fallbackFeature;
    }

    function setHoverFeature(feature) {
      if (!state.map?.getSource("hover-feature")) return;
      const fullFeature = findOriginalMapFeature(feature) || feature;
      const geometryType = fullFeature?.geometry?.type || "";
      const features = (/Polygon/.test(geometryType) || geometryType === "Point")
        ? [{
            type: "Feature",
            geometry: fullFeature.geometry,
            properties: { ...(fullFeature.properties || {}) }
          }]
        : [];
      const geometryKey = features.length ? `${hoverFeatureKey(fullFeature)}|${geometryType}` : "";
      if (state.activeHoverGeometryKey === geometryKey) return;
      state.activeHoverGeometryKey = geometryKey;
      state.map.getSource("hover-feature").setData({ type: "FeatureCollection", features });
    }

    function findOriginalMapFeature(feature) {
      const props = feature?.properties || {};
      const source = feature?.source;
      const id = String(props.id || props.wp_id || "");
      const title = displayFeatureTitle(props);
      const collection = source === "directus-site-geometries"
        ? filteredManagedSiteFeatures()
        : source === "place-name-areas" || source === "place-name-area-labels"
          ? filteredPlaceNameAreaFeatures()
          : filteredPolygonFeatures();
      return (collection.features || []).find(candidate => {
        const candidateProps = candidate.properties || {};
        return (id && String(candidateProps.id || candidateProps.wp_id || "") === id) ||
          (title && displayFeatureTitle(candidateProps) === title);
      }) || null;
    }

    function polygonClickScore(feature) {
      const props = feature?.properties || {};
      const category = props.feature_category || "other";
      const categoryScore = ({
        placename: 0,
        deed: 1,
        reservation: 2,
        other: 3,
        territory: 4
      })[category] ?? 3;
      return categoryScore * 100000 + numeric(props.feature_area, 99999);
    }

    function polygonSortKey(feature) {
      return Math.max(0, 1000000 - polygonClickScore(feature));
    }

    function featureCategoryLabel(category) {
      return ({
        territory: "Ancestral or traditional territory",
        placename: "Place name or mapped site",
        deed: "Deed, purchase, sale, or colonial land record",
        reservation: "Reservation boundary",
        other: "Map feature"
      })[category] || "Map feature";
    }

    function hoverHtml(feature) {
      return hoverHtmlFromPreview(featurePreview(feature));
    }

    function polygonOpacityExpression(maximum = 0.45) {
      return ["min", maximum, ["coalesce", ["to-number", ["get", "opacity"]], maximum]];
    }

    function markerFeatures() {
      const markerLayer = findLayer("imported-wp-go-maps-markers");
      const data = onlyPrimaryMap(markerLayer?.geojson || { type: "FeatureCollection", features: [] });
      return withFeatureCategories({
        type: "FeatureCollection",
        features: (data.features || [])
          .filter(feature => !featureSiteHasCustomIcon(feature))
          .map(feature => ({
            ...feature,
            properties: {
              ...(feature.properties || {}),
              icon_url: rewriteMediaUrl(feature.properties?.icon_url || ""),
                timeline_jump: timelineIconJumpMatchesFeature(feature),
                timeline_offset: timelineIconJumpMatchesFeature(feature) ? state.timelineIconOffset : 0
            }
          }))
      }, "marker");
    }

    function featureSiteHasCustomIcon(feature) {
      const site = findSiteFromFeature(feature);
      return Boolean(site && siteMapIconUrl(site));
    }

    function markerIconFeatures() {
      const data = filteredMarkerFeatures();
      return {
        type: "FeatureCollection",
        features: (data.features || []).filter(feature => {
          const key = feature.properties?.icon_key;
          return key && state.loadedMapIconKeys.has(key);
        })
      };
    }

    function polygonFeatures() {
      const categorized = importedPolygonFeaturesForHitTest();
      const placeNameAreas = placeNameAreaFeatures().features || [];
      return importedFallbackFeatures({
        type: "FeatureCollection",
        features: [...(categorized.features || []), ...placeNameAreas].map(feature => ({
          ...feature,
          properties: {
            ...(feature.properties || {}),
            polygon_sort_key: polygonSortKey(feature)
          }
        }))
      }, "polygon");
    }

    function importedPolygonLayerId(feature) {
      if (feature?.properties?.place_name_area_overlay) return "place-name-area-fill";
      return ["territory", "reservation"].includes(feature?.properties?.feature_category)
        ? "wp-polygons-original-fill"
        : "wp-polygons-detail-fill";
    }

    function placeNameAreaFeatures() {
      return cachedFeatures("placeNameAreaFeatures", () => ({
        type: "FeatureCollection",
        features: (state.placeNameAreas?.features || []).map(feature => {
          const approximate = feature.properties?.geometry_is_approximate === true || feature.properties?.geometry_is_approximate === "true";
          const categories = new Set(String(feature.properties?.layer_categories || "").split(/\s+/).filter(Boolean));
          categories.add("place-name-areas");
          categories.add("place-names");
          return {
            ...feature,
            properties: {
              ...(feature.properties || {}),
              place_name_area_overlay: true,
              feature_category: "placename",
              layer_categories: [...categories].join(" "),
              fillcolor: GEOMETRY_UTILS.normalizeHex(feature.properties?.fillcolor, approximate ? "#c98a38" : "#78b943"),
              linecolor: "#315b50",
              lineopacity: 0.3,
              opacity: Math.min(0.2, numeric(feature.properties?.opacity, approximate ? 0.14 : 0.18)),
              label_size: Math.max(9.5, numeric(feature.properties?.label_size, 10.5)),
              polygon_sort_key: polygonSortKey(feature)
            }
          };
        })
      }));
    }

    function filteredPlaceNameAreaFeatures() {
      return cachedFeatures("filteredPlaceNameAreaFeatures", () => filterByCategory(placeNameAreaFeatures()));
    }

    function placeNameAreaLabelFeatures() {
      return cachedFeatures("placeNameAreaLabelFeatures", () => ({
        type: "FeatureCollection",
        features: dedupeLabelFeatures((filteredPlaceNameAreaFeatures().features || []).flatMap(labelPointFeaturesForFeature))
      }));
    }

    function isGardinersIslandCenter(center) {
      return center?.[0] > -72.18 && center[0] < -72.05 && center[1] > 41.03 && center[1] < 41.14;
    }

    function gardinersIslandPolygonFromGeometry(geometry) {
      const polygons = geometry?.type === "Polygon"
        ? [geometry.coordinates]
        : geometry?.type === "MultiPolygon"
          ? (geometry.coordinates || [])
          : [];
      return polygons
        .filter(rings => isGardinersIslandCenter(ringCenter(rings?.[0] || [])))
        .sort((a, b) => featureArea({ geometry: { type: "Polygon", coordinates: b } }) - featureArea({ geometry: { type: "Polygon", coordinates: a } }))[0] || null;
    }

    function gardinersMontaukettOverlayFeatures() {
      return cachedFeatures("gardinersMontaukettOverlayFeatures", () => {
        const site = state.siteBySlug?.get("montaukett-ancestral-land") ||
          (state.sites || []).find(item => /montaukett ancestral land/i.test(`${item?.title || ""} ${item?.slug || ""}`));
        const rings = islandPolygonFromMask("gardiners") ||
          gardinersIslandPolygonFromGeometry(site?.display_geojson) ||
          gardinersIslandPolygonFromGeometry(site?.geojson) ||
          gardinersIslandPolygonFromGeometry(siteDisplayGeometry(site));
        if (!site || !rings) return { type: "FeatureCollection", features: [] };
        return {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry: { type: "Polygon", coordinates: rings },
            properties: {
              directus_site_id: site.id,
              directus_site_slug: site.slug,
              slug: site.slug,
              title: site.title || "Montaukett Ancestral Land",
              description: site.summary || "",
              link: `/listing/${site.slug}/`,
              gardiners_montaukett_overlay: true,
              fillcolor: GEOMETRY_UTILS.normalizeHex(site.map_fill_color, "#ff1f1f"),
              linecolor: GEOMETRY_UTILS.normalizeHex(site.map_fill_color, "#26352a"),
              opacity: Math.max(0.5, numeric(site.map_opacity, 0.5)),
              layer_categories: SITE_UTILS.siteLayerCategoryKeys(site).join(" "),
              feature_category: "territory",
              label_size: 1,
              feature_area: featureArea({ geometry: { type: "Polygon", coordinates: rings } })
            }
          }]
        };
      });
    }

    function importedPolygonFeaturesForHitTest() {
      const polygonLayer = findLayer("imported-wp-go-maps-polygons");
      const features = onlyPrimaryMap(polygonLayer?.geojson || { type: "FeatureCollection", features: [] }).features || [];
      return withFeatureCategories({
        type: "FeatureCollection",
        features: features.map(feature => {
          const normalizedFeature = augmentTerritoryGeometry({
            ...feature,
            properties: {
              ...(feature.properties || {}),
              title: normalizedPolygonTitle(feature.properties)
            }
          });
          return {
            ...normalizedFeature,
            properties: {
              ...(normalizedFeature.properties || {}),
              fillcolor: polygonFillColor(normalizedFeature.properties),
              linecolor: GEOMETRY_UTILS.normalizeHex(normalizedFeature.properties?.linecolor, "#26352a"),
              opacity: numeric(normalizedFeature.properties?.opacity, 0.42),
              label_size: featureBoundsScale(normalizedFeature),
              feature_area: featureArea(normalizedFeature)
            }
          };
        })
      }, "polygon");
    }

    function augmentTerritoryGeometry(feature) {
      const title = normalizedPolygonTitle(feature?.properties || {}).toLowerCase();
      const landPieces = territoryLandMaskPolygonsForTitle(title);
      if (!landPieces.length) return feature;
      let geometry = feature.geometry;
      for (const rings of landPieces) geometry = appendPolygonToGeometry(geometry, rings);
      return {
        ...feature,
        geometry,
        properties: {
          ...(feature.properties || {}),
          geometry_notes: [
            feature.properties?.geometry_notes,
            `Nearby Long Island land-mask pieces added to ${normalizedPolygonTitle(feature.properties)}: ${landPieces.map(piece => piece.__nliLabel).filter(Boolean).join(", ")}.`
          ].filter(Boolean).join(" ")
        }
      };
    }

    function territoryLandMaskPolygonsForTitle(title) {
      if (!state.landMaskData?.geometry) return [];
      const assignments = ANCESTRAL_LAND_MASK_ASSIGNMENTS.filter(assignment => assignment.title.test(title));
      if (!assignments.length) return [];
      const polygons = state.landMaskData.geometry.type === "Polygon"
        ? [state.landMaskData.geometry.coordinates]
        : (state.landMaskData.geometry.coordinates || []);
      return polygons.map(rings => {
        const center = ringCenter(rings?.[0] || []);
        if (!center) return null;
        const assignment = assignments.find(item => item.match(center));
        if (!assignment) return null;
        Object.defineProperty(rings, "__nliLabel", {
          value: assignment.label,
          enumerable: false,
          configurable: true
        });
        return rings;
      }).filter(Boolean);
    }

    function islandPolygonFromMask(name) {
      const assignment = {
        gardiners: /gardiner/i
      }[name];
      if (!assignment) return null;
      return territoryLandMaskPolygonsForTitle("montaukett ancestral land")
        .filter(rings => assignment.test(rings.__nliLabel || ""))
        .sort((a, b) => featureArea({ geometry: { type: "Polygon", coordinates: b } }) - featureArea({ geometry: { type: "Polygon", coordinates: a } }))[0] || null;
    }

    function appendPolygonToGeometry(geometry, polygonCoordinates) {
      return GEOMETRY_UTILS.appendPolygonToGeometry(geometry, polygonCoordinates, { dedupe: true, method: "bounds" });
    }

    function ringCenter(ring) {
      return GEOMETRY_UTILS.ringCenter(ring, { method: "bounds" });
    }

    function ringKey(ring) {
      return GEOMETRY_UTILS.ringKey(ring, { method: "bounds" });
    }

    function displayFeatureTitle(props = {}) {
      return String(props.title || props.polyname || "").trim();
    }

    function normalizedPolygonTitle(props = {}) {
      const title = displayFeatureTitle(props);
      if (/^matinecock tribal nation$/i.test(title)) return "Matinecock Ancestral Land";
      if (/^matinecock traditional land$/i.test(title)) return "Matinecock Ancestral Land";
      return title;
    }

    function polygonFillColor(props = {}) {
      const title = normalizedPolygonTitle(props).toLowerCase();
      if (title === "corchaug ancestral land") return "#ff8a00";
      if (title === "merrick ancestral land") return "#00a7b5";
      return GEOMETRY_UTILS.normalizeHex(props.fillcolor, "#7b956f");
    }

    function importedFallbackFeatures(collection, geometryKind) {
      return {
        type: "FeatureCollection",
        features: (collection.features || []).filter(feature =>
          !isLegacyBroadTerritoryFeature(feature) &&
          !siteHasDirectusGeometry(feature, geometryKind) &&
          !directusSiteExistsForFeature(feature, geometryKind)
        )
      };
    }

    function isLegacyBroadTerritoryFeature(feature) {
      const title = normalizeName(normalizedPolygonTitle(feature?.properties || {}));
      return [
        "canarsie ancestral land",
        "canarsie traditional land",
        "rockaway ancestral land",
        "rockaway traditional land",
        "matinecock ancestral land",
        "matinecock traditional land",
        "merrick ancestral land",
        "massapequa ancestral land",
        "massapequa ancestral lands",
        "secatogue ancestral land",
        "nissequogue ancestral land",
        "setauket ancestral land",
        "unkechaug ancestral land",
        "corchaug ancestral land",
        "shinnecock ancestral land",
        "montaukett ancestral land",
        "manhansett ancestral land",
        "hoggenoch manhansett ancestral land"
      ].includes(title);
    }

    function siteHasDirectusGeometry(feature, geometryKind) {
      const site = findSiteFromFeature(feature);
      const geometry = site?.display_geojson?.type ? site.display_geojson : site?.geojson;
      if (!geometry?.type) return false;
      const directusKind = geometry.type === "Point" ? "marker" : "polygon";
      return directusKind === geometryKind;
    }

    function directusSiteExistsForFeature(feature, geometryKind) {
      if (siteHasDirectusGeometry(feature, geometryKind)) return true;
      const title = normalizedPolygonTitle(feature?.properties || {}) || displayFeatureTitle(feature?.properties || {});
      if (!title) return false;
      const normalized = normalizeName(title);
      return state.sites.some(site => {
        const geometry = site?.display_geojson?.type ? site.display_geojson : site?.geojson;
        if (!geometry?.type) return false;
        const directusKind = geometry.type === "Point" ? "marker" : "polygon";
        if (directusKind !== geometryKind) return false;
        return normalizeName(site.title) === normalized;
      });
    }

    function siteHasImportedReservationPolygon(site) {
      if (!site?.slug) return false;
      const polygonLayer = findLayer("imported-wp-go-maps-polygons");
      const features = onlyPrimaryMap(polygonLayer?.geojson || { type: "FeatureCollection", features: [] }).features || [];
      return features.some(feature => {
        const slug = listingSlugAlias(slugFromListingUrl(feature.properties?.link || feature.properties?.original_link));
        const title = displayFeatureTitle(feature.properties).toLowerCase();
        return slug === site.slug && /reservation/.test(title);
      });
    }

    function siteHasImportedMarker(site) {
      if (!site?.slug) return false;
      const markerLayer = findLayer("imported-wp-go-maps-markers");
      const features = onlyPrimaryMap(markerLayer?.geojson || { type: "FeatureCollection", features: [] }).features || [];
      return features.some(feature => {
        const slug = listingSlugAlias(slugFromListingUrl(feature.properties?.link || feature.properties?.original_link));
        return slug === site.slug;
      });
    }

    function onlyPrimaryMap(collection) {
      return {
        type: "FeatureCollection",
        features: (collection.features || []).filter(feature => String(feature.properties?.map_id) === "1")
      };
    }

    function withFeatureCategories(collection, geometryKind) {
      return {
        type: "FeatureCollection",
        features: (collection.features || []).map(feature => ({
          ...feature,
          properties: {
            ...(feature.properties || {}),
            feature_category: classifyFeature(feature, geometryKind)
          }
        }))
      };
    }

    function classifyFeature(feature, geometryKind) {
      const props = feature?.properties || {};
      const title = String(props.title || props.polyname || "").toLowerCase();
      const linkedSite = findSiteFromFeature(feature);
      if (linkedSite) return classifySiteFeature(linkedSite, geometryKind);
      const deedPattern = /deed|purchase|patent|treaty|agreement|conveyance|sale/;
      const fullText = [
        title,
        props.site_type,
        props.link,
        props.original_link,
        props.icon_url,
        props.description
      ].join(" ").toLowerCase();
      if (/ancestral land|traditional land|territory/.test(title)) return "territory";
      if (/reservation/.test(title)) return "reservation";
      if (deedPattern.test(title)) return "deed";
      if (isPlaceNameText(fullText)) {
        return "placename";
      }
      if (deedPattern.test(fullText)) return "deed";
      return "other";
    }

    function classifySiteFeature(site, geometryKind) {
      const rawType = normalizeComparisonText(site?.site_type || "");
      const title = normalizeComparisonText(site?.title || "");
      const fullText = normalizeComparisonText([
        site?.title,
        site?.site_type,
        site?.summary,
        site?.description,
        site?.introduction_content,
        site?.history_content
      ].join(" "));
      if (/ancestral_territory|territory/.test(rawType) || /ancestral land|traditional land|territory/.test(title)) return "territory";
      if (/reservation/.test(rawType) || /reservation/.test(title)) return "reservation";
      if (/deed/.test(rawType) || /deed|purchase|patent|treaty|agreement|conveyance|sale/.test(title)) return "deed";
      if (/place_?name|placename/.test(rawType) || isPlaceNameText(fullText)) {
        return "placename";
      }
      return "other";
    }

    function isPlaceNameText(text) {
      return /\b(place ?name|placename|translation|translates|translated|meaning|means|algonquian name|munsee name|montaukett name|shinnecock name)\b/.test(normalizeComparisonText(text || ""));
    }

    function featureBoundsScale(feature) {
      const coords = [];
      collectCoordinates(feature.geometry?.coordinates, coords);
      if (!coords.length) return 8;
      const lngs = coords.map(point => point[0]);
      const lats = coords.map(point => point[1]);
      const width = Math.max(...lngs) - Math.min(...lngs);
      const height = Math.max(...lats) - Math.min(...lats);
      const size = Math.sqrt(Math.max(width * height, 0));
      return Math.max(6, Math.min(11, 6 + size * 42));
    }

    function featureArea(feature) {
      const coords = [];
      collectCoordinates(feature.geometry?.coordinates, coords);
      if (!coords.length) return 0;
      const lngs = coords.map(point => point[0]);
      const lats = coords.map(point => point[1]);
      return (Math.max(...lngs) - Math.min(...lngs)) * (Math.max(...lats) - Math.min(...lats));
    }

    function featureCentroid(feature) {
      const best = bestLabelPoint(feature);
      if (best) return best;
      const coords = [];
      collectCoordinates(feature.geometry?.coordinates, coords);
      if (!coords.length) return null;
      const sum = coords.reduce((memo, point) => [memo[0] + point[0], memo[1] + point[1]], [0, 0]);
      return [sum[0] / coords.length, sum[1] / coords.length];
    }

    function bestLabelPoint(feature) {
      const rings = largestPolygonRings(feature.geometry);
      const outer = rings?.[0];
      if (!outer?.length) return null;
      const lngs = outer.map(point => point[0]);
      const lats = outer.map(point => point[1]);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const steps = 12;
      let best = null;
      for (let x = 1; x < steps; x++) {
        for (let y = 1; y < steps; y++) {
          const point = [
            minLng + ((maxLng - minLng) * x) / steps,
            minLat + ((maxLat - minLat) * y) / steps
          ];
          if (!pointInRings(point, rings)) continue;
          const distance = Math.min(...outer.map((coord, index) => pointSegmentDistance(point, coord, outer[(index + 1) % outer.length])));
          if (!best || distance > best.distance) best = { point, distance };
        }
      }
      if (best) return best.point;
      const center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
      return pointInRings(center, rings) ? center : null;
    }

    function largestPolygonRings(geometry) {
      if (!geometry) return null;
      if (geometry.type === "Polygon") return geometry.coordinates;
      if (geometry.type === "MultiPolygon") {
        return geometry.coordinates
          .map(rings => ({ rings, area: Math.abs(ringArea(rings[0] || [])) }))
          .sort((a, b) => b.area - a.area)[0]?.rings || null;
      }
      return null;
    }

    function ringArea(ring) {
      return ring.reduce((sum, point, index) => {
        const next = ring[(index + 1) % ring.length];
        return sum + point[0] * next[1] - next[0] * point[1];
      }, 0) / 2;
    }

    function pointInRings(point, rings) {
      if (!pointInRing(point, rings[0] || [])) return false;
      return !rings.slice(1).some(ring => pointInRing(point, ring));
    }

    function pointInRing(point, ring) {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        const intersect = ((yi > point[1]) !== (yj > point[1])) &&
          (point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi || 1e-12) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }

    function pointSegmentDistance(point, start, end) {
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / length));
      const x = start[0] + t * dx;
      const y = start[1] + t * dy;
      return Math.hypot(point[0] - x, point[1] - y);
    }

    function collectCoordinates(value, output) {
      GEOMETRY_UTILS.collectCoordinates(value, output);
    }

    function geometryCenter(geometry) {
      return GEOMETRY_UTILS.geometryBoundsCenter(geometry);
    }

    function activeFilterSet(name, inputs, builder = null) {
      if (state.activeFilterSetCache.has(name)) return state.activeFilterSetCache.get(name);
      const set = builder
        ? builder(inputs)
        : new Set((inputs || []).filter(input => input.checked).map(input => input.value));
      state.activeFilterSetCache.set(name, set);
      return set;
    }

    function clearActiveFilterCaches() {
      state.activeFilterSetCache?.clear?.();
    }

    function activeCategories() {
      return activeFilterSet("categories", categoryToggles);
    }

    function activeEraFilters() {
      return activeFilterSet("eras", eraToggles);
    }

    function fallbackEraKeysForText(value = "") {
      const text = normalizeComparisonText(value);
      const eras = new Set();
      if (/pre.?contact|ancient|prehistoric|paleo|archaic|orient|woodland|archaeolog|shell midden|burial/.test(text)) eras.add("precontact");
      if (/contact period|early contact|colonial|deed|patent|treaty|purchase|17th century|1600|160\d|161\d|162\d|163\d|164\d|165\d|166\d|167\d|168\d|169\d/.test(text)) eras.add("contact");
      if (/historic|18th century|19th century|1700|1800|reservation|mission|whal|deed|record/.test(text)) eras.add("historic");
      if (/contemporary|modern|today|present|current|20th century|21st century|1900|2000|museum|exhibit|powwow|community|artist|school/.test(text)) eras.add("contemporary");
      if (!eras.size) eras.add("historic");
      return eras;
    }

    function clearEraKeyCaches() {
      state.siteEraKeysCache = new WeakMap();
      state.featureEraKeysCache = new WeakMap();
    }

    function siteEraKeys(site = {}) {
      if (site && typeof site === "object" && state.siteEraKeysCache.has(site)) return state.siteEraKeysCache.get(site);
      if (isBroadTerritorySite(site)) {
        const eras = new Set(["precontact", "contact"]);
        if (site && typeof site === "object") state.siteEraKeysCache.set(site, eras);
        return eras;
      }
      if (SITE_UTILS.isExhibitSite(site)) {
        const eras = new Set(["contemporary"]);
        if (site && typeof site === "object") state.siteEraKeysCache.set(site, eras);
        return eras;
      }
      const events = timelineEventsFor("site", site.id, site.slug);
      const eras = new Set(events.map(event => timelineEraFor(event)?.key).filter(Boolean));
      const resolved = eras.size ? eras : fallbackEraKeysForText([
        site.title,
        site.site_type,
        site.summary,
        site.introduction_content,
        site.history_content,
        site.preservation_content
      ].join(" "));
      if (site && typeof site === "object") state.siteEraKeysCache.set(site, resolved);
      return resolved;
    }

    function featureEraKeys(feature = {}) {
      if (feature && typeof feature === "object" && state.featureEraKeysCache.has(feature)) return state.featureEraKeysCache.get(feature);
      const site = findSiteFromFeature(feature);
      if (site) {
        const eras = siteEraKeys(site);
        if (feature && typeof feature === "object") state.featureEraKeysCache.set(feature, eras);
        return eras;
      }
      const props = feature.properties || {};
      const eras = fallbackEraKeysForText([
        props.title,
        props.polyname,
        props.site_type,
        props.feature_category,
        props.description,
        props.layer_categories
      ].join(" "));
      if (feature && typeof feature === "object") state.featureEraKeysCache.set(feature, eras);
      return eras;
    }

    function eventPassesEraFilter(event = {}) {
      if (!eraToggles.length) return true;
      const active = activeEraFilters();
      if (active.size >= eraToggles.length) return true;
      if (!active.size) return false;
      const key = timelineEraFor(event)?.key;
      return key ? active.has(key) : true;
    }

    function featurePassesEraFilter(feature) {
      if (!eraToggles.length) return true;
      const active = activeEraFilters();
      if (active.size >= eraToggles.length) return true;
      if (!active.size) return false;
      return [...featureEraKeys(feature)].some(key => active.has(key));
    }

    function toggleEraFilter(key) {
      const input = eraToggles.find(item => item.value === key);
      if (!input) return;
      input.checked = !input.checked;
      clearFeatureCache();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      applyLayerVisibility();
      renderTimelineDock();
    }

    function activeAccessFilters() {
      return activeFilterSet("access", accessToggles);
    }

    function featureFilterSignature() {
      return JSON.stringify({
        categories: [...activeCategories()].sort(),
        access: [...activeAccessFilters()].sort(),
        themes: [...activeThemeFilters()].sort(),
        eras: [...activeEraFilters()].sort(),
        icons: state.loadedMapIconKeys.size,
        guidedPath: state.activeLearningPathSlug || "",
        guidedPathOnly: state.activeLearningPathShowOnly ? 1 : 0,
        jump: state.timelineIconJump ? `${state.timelineIconJump.type}:${state.timelineIconJump.slug}:${state.timelineIconOffset}` : ""
      });
    }

    function cachedFeatures(name, builder) {
      const key = `${name}:${featureFilterSignature()}`;
      if (state.featureCache.has(key)) return state.featureCache.get(key);
      const value = builder();
      state.featureCache.set(key, value);
      return value;
    }

    function clearFeatureCache() {
      state.featureCache.clear();
      state.featurePreviewCache.clear();
      clearActiveFilterCaches();
    }

    function featurePassesAccessFilter(feature) {
      const active = activeAccessFilters();
      if (active.size >= accessToggles.length) return true;
      const site = findSiteFromFeature(feature);
      const status = site ? visitAccessStatus(site) : "visitable";
      if (status === "visitable") return active.has("visitable");
      return active.has("learn");
    }

    function activeThemeFilters() {
      return activeFilterSet("themes", themeToggles, inputs => SITE_UTILS.layerFilterSetFromInputs
        ? SITE_UTILS.layerFilterSetFromInputs(inputs)
        : new Set(inputs.filter(input => input.checked).map(input => input.value)));
    }

    function activeLayerCategoryFilters() {
      return activeThemeFilters();
    }

    function sitePassesLayerCategoryFilters(site) {
      if (SITE_UTILS.isExhibitSite(site) && (!exhibitToggle || exhibitToggle.checked !== false)) return true;
      const active = activeLayerCategoryFilters();
      const keys = new Set(SITE_UTILS.siteLayerCategoryKeys(site));
      return SITE_UTILS.passesLayerCategoryFilters([...keys], active, themeToggles.length);
    }

    function featurePassesLayerCategoryFilters(feature) {
      const active = activeLayerCategoryFilters();
      if (feature?.properties?.place_name_area_overlay) {
        if (placeNameAreaToggle && !placeNameAreaToggle.checked) return false;
        const keys = String(feature.properties.layer_categories || "").split(/\s+/).filter(Boolean);
        return SITE_UTILS.passesLayerCategoryFilters(keys, active, themeToggles.length);
      }
      const site = findSiteFromFeature(feature);
      if (site) return sitePassesLayerCategoryFilters(site);
      if (featureIsExhibitLayerFeature(feature) && (!exhibitToggle || exhibitToggle.checked !== false)) return true;
      const keys = String(feature?.properties?.layer_categories || "").split(/\s+/).filter(Boolean);
      return SITE_UTILS.passesLayerCategoryFilters(keys, active, themeToggles.length);
    }

    function featurePassesExhibitLayer(feature) {
      if (!exhibitToggle || exhibitToggle.checked) return true;
      return !featureIsExhibitLayerFeature(feature);
    }

    function featureIsExhibitLayerFeature(feature) {
      const site = findSiteFromFeature(feature);
      if (site) return SITE_UTILS.isExhibitSite(site);
      const keys = String(feature?.properties?.layer_categories || "").split(/\s+/);
      if (keys.includes("exhibits")) return true;
      const text = normalizeComparisonText([
        feature?.properties?.title,
        feature?.properties?.polyname,
        feature?.properties?.description,
        feature?.properties?.site_type,
        feature?.properties?.feature_category
      ].join(" "));
      return /\b(museum|gallery|exhibit|exhibition|public art|collection|ma s house|mas house|preservation long island)\b/.test(text);
    }

    function featurePassesPrimaryLayerVisibility(feature) {
      const geometryType = feature?.geometry?.type || "";
      const isExhibit = featureIsExhibitLayerFeature(feature);
      const exhibitsOn = !exhibitToggle || exhibitToggle.checked !== false;
      return SITE_UTILS.featureVisibleInPrimaryLayers(geometryType, {
        isExhibit,
        exhibitsOn,
        pinsOn: markerToggle?.checked !== false,
        shapesOn: polygonToggle?.checked !== false
      });
    }

    function isBiographyPersonFeature(feature) {
      const props = feature?.properties || {};
      return props.kind === "person" && Boolean(props.wiki_slug);
    }

    function biographyPersonFeaturePreview(feature) {
      const props = feature?.properties || {};
      const article = state.wikiBySlug.get(props.wiki_slug) || null;
      const title = article?.title || props.person || props.title || "Knowledgebase biography";
      return {
        title,
        summary: biographyPersonHoverSummary(props.wiki_slug, article, props),
        image: article ? firstContentImage(article.content || "") : "",
        imageFallback: "",
        meta: "Knowledgebase biography",
        tags: ["Biography"],
        actions: []
      };
    }

    function biographyPersonHoverSummary(slug, article, props = {}) {
      const summary = stripHtml(article?.summary || "");
      const summaryIsGeneric = /source-supported biography|knowledgebase biography|inline footnotes|public-safe context/i.test(summary);
      const summarySources = [
        summaryIsGeneric ? "" : summary,
        article?.introduction_content,
        article?.content,
        props.biography_intro,
        props.summary
      ].filter(Boolean);
      for (const source of summarySources) {
        const cleaned = stripHtml(source)
          .replace(/\b(Life timeline and places|Places connected|Connected places|Biography path|This map path|This path follows|This path shows)\b.*$/i, "")
          .replace(/^\s*(Introduction|Biography)\s*/i, "")
          .trim();
        const intro = firstCompleteSentences(cleaned, 2, 360);
        if (intro && intro.length > 35 && !/map path|precise travel route|associated places|public-safe approximate/i.test(intro)) return intro;
      }
      if (BIOGRAPHY_PERSON_HOVER_INTROS[slug]) return BIOGRAPHY_PERSON_HOVER_INTROS[slug];
      const person = props.person || props.title || article?.title || "this person";
      return `Open this biography to learn more about ${person}.`;
    }

    function sitePassesThemeFilters(site) {
      return sitePassesLayerCategoryFilters(site);
    }

    function featurePassesThemeFilters(feature) {
      return featurePassesLayerCategoryFilters(feature);
    }

    function filterByCategory(collection) {
      const active = activeCategories();
      return {
        type: "FeatureCollection",
        features: (collection.features || [])
          .filter(feature => active.has(feature.properties?.feature_category || "other"))
          .filter(featurePassesAccessFilter)
          .filter(featurePassesThemeFilters)
          .filter(featurePassesEraFilter)
          .filter(featurePassesExhibitLayer)
          .filter(featurePassesPrimaryLayerVisibility)
          .filter(featurePassesGuidedLearningPathFilter)
      };
    }

    function guidedLearningPathSiteSlugs(path = activeGuidedLearningPath()) {
      return new Set((path?.stops || []).map(stop => stop.siteSlug).filter(Boolean));
    }

    function featurePassesGuidedLearningPathFilter(feature) {
      const path = activeGuidedLearningPath();
      if (!path || !state.activeLearningPathShowOnly) return true;
      const geometryType = feature?.geometry?.type || "";
      if (geometryType && geometryType !== "Point") return true;
      const site = findSiteFromFeature(feature);
      if (!site?.slug) return false;
      return guidedLearningPathSiteSlugs(path).has(site.slug);
    }

    function guidedLearningPathStopFeatures() {
      const path = activeGuidedLearningPath();
      if (!path) return { type: "FeatureCollection", features: [] };
      const completed = guidedLearningPathCompletedSet(path);
      const features = path.stops.map((stop, index) => {
        const geometry = siteDisplayGeometry(stop.site);
        const center = geometry ? siteCenter(geometry) : null;
        if (!center) return null;
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: center },
          properties: {
            title: guidedLearningPathStopTitle(stop),
            directus_site_id: stop.site?.id || "",
            directus_site_slug: stop.siteSlug,
            feature_category: "other",
            learning_path_slug: path.slug,
            learning_path_title: path.title,
            learning_path_stop_number: index + 1,
            learning_path_stop_complete: completed.has(stop.siteSlug),
            why_this_stop_matters: stop.why_this_stop_matters || "",
            path_question: stop.path_question || ""
          }
        };
      }).filter(Boolean);
      return { type: "FeatureCollection", features };
    }

    function syncGuidedLearningPathLayers() {
      const data = guidedLearningPathStopFeatures();
      if (state.map?.getSource("learning-path-stops")) {
        state.map.getSource("learning-path-stops").setData(data);
      }
      const visible = activeGuidedLearningPath() ? "visible" : "none";
      if (state.map) MAP_UTILS.setLayerVisibilityMany(state.map, ["learning-path-stop-halos", "learning-path-stop-numbers", "learning-path-stop-labels"], visible);
      promoteGuidedLearningPathLayers();
      if (state.leafletMap) syncLeafletGuidedLearningPathLayer();
    }

    function promoteGuidedLearningPathLayers() {
      if (!state.map?.getLayer) return;
      ["learning-path-stop-halos", "learning-path-stop-numbers", "learning-path-stop-labels"].forEach(id => {
        if (!state.map.getLayer(id)) return;
        try {
          state.map.moveLayer(id);
        } catch {}
      });
    }

    function syncLeafletGuidedLearningPathLayer() {
      if (!state.leafletMap || !window.L) return;
      if (state.leafletLearningPathLayer) state.leafletLearningPathLayer.clearLayers();
      else state.leafletLearningPathLayer = L.layerGroup().addTo(state.leafletMap);
      const data = guidedLearningPathStopFeatures();
      for (const feature of data.features || []) {
        const coords = feature.geometry?.coordinates;
        if (!coords) continue;
        const number = feature.properties?.learning_path_stop_number || "";
        const complete = feature.properties?.learning_path_stop_complete === true;
        const marker = L.marker([coords[1], coords[0]], {
          interactive: true,
          zIndexOffset: 3100,
          icon: L.divIcon({
            className: "leaflet-learning-path-stop",
            html: `<span class="learning-path-stop-marker${complete ? " complete" : ""}">${escapeHtml(number)}</span>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(state.leafletLearningPathLayer);
        bindLeafletFeature(feature, marker, "Guided path stop");
        const label = L.marker([coords[1], coords[0]], {
          interactive: true,
          zIndexOffset: 3090,
          icon: L.divIcon({
            className: "leaflet-learning-path-label",
            html: `<span class="learning-path-stop-label">${escapeHtml(number)}. ${escapeHtml(feature.properties?.title || "")}</span>`,
            iconSize: [220, 28],
            iconAnchor: [110, 42]
          })
        }).addTo(state.leafletLearningPathLayer);
        bindLeafletFeature(feature, label, "Guided path stop");
      }
    }

    function filteredMarkerFeatures() {
      return cachedFeatures("filteredMarkerFeatures", () => filterByCategory(markerFeatures()));
    }

    function filteredPolygonFeatures() {
      return cachedFeatures("filteredPolygonFeatures", () => filterByCategory(polygonFeatures()));
    }

    function isMuseumOrExhibitSite(item = {}) {
      return SITE_UTILS.isExhibitSite(item);
    }

    function desktopThemeSet(item = {}) {
      const text = normalizeComparisonText([item.title, item.site_type, item.summary, item.description, item.introduction_content, item.history_content].join(" "));
      const rawType = normalizeComparisonText(item.site_type || "");
      const themes = new Set();
      if (/place_?name|placename/.test(rawType) || isPlaceNameText(text)) themes.add("a Native place name");
      if (/deed|treaty|purchase|patent|record/.test(text)) themes.add("a deed or colonial record");
      if (/reservation|nation|tribal/.test(text)) themes.add("reservation history");
      if (/water|shore|bay|pond|river|creek|brook|beach|island|whal|fish|shell/.test(text)) themes.add("water, shore, or fishing");
      if (isMuseumOrExhibitSite(item)) themes.add("a museum, exhibit, or collection");
      return themes;
    }

    function dailyLearningGoal() {
      const today = localDateKey();
      const stored = JSON.parse(localStorage.getItem("nli-desktop-daily-learning") || "null");
      if (stored?.date === today && stored?.label) return stored;
      const labels = ["a Native place name", "a deed or colonial record", "reservation history", "water, shore, or fishing", "a museum, exhibit, or collection"];
      const label = labels[new Date().getDate() % labels.length];
      const site = state.sites.find(item => desktopThemeSet(item).has(label)) || state.sites[0];
      const goal = { date: today, label, siteSlug: site?.slug || "", siteTitle: site?.title || "" };
      localStorage.setItem("nli-desktop-daily-learning", JSON.stringify(goal));
      return goal;
    }

    function dailyLessonFromEvent(event) {
      const rawText = stripHtml(event.description || "")
        .replace(/\s+/g, " ")
        .trim();
      const body = firstCompleteSentences(rawText
        .replace(/^\s*(in\s+)?(\d{3,4}s?|\d{3,4}(?:-\d{2,4})?|precontact|contact period|historic|contemporary)\s*[,:\-–]?\s*/i, "")
        .trim(), 2, 360);
      const title = timelineCaption(event);
      const sourceTitle = event.source_title || sourceLabel(event);
      const lesson = body && body.length > 35
        ? body
        : `${title} connects ${sourceTitle || "this mapped place"} to a specific moment in Native Long Island history.`;
      return {
        dateLabel: timelineRangeLabel(event),
        sourceTitle,
        lesson
      };
    }

    function dailyHistoricMoment() {
      const today = localDateKey();
      const candidates = sortedTimelineEvents()
        .filter(event => event.source_type === "site")
        .filter(event => event.source_slug || event.source_id)
        .filter(event => stripHtml(event.description || "").trim().length > 24);
      if (!candidates.length) return null;
      let stored = null;
      try {
        stored = JSON.parse(localStorage.getItem("nli-desktop-daily-moment") || "null");
      } catch {
        localStorage.removeItem("nli-desktop-daily-moment");
      }
      const todaysEvents = candidates
        .filter(event => timelineEventMatchesToday(event, today))
        .sort((a, b) => String(a.source_title || a.title || "").localeCompare(String(b.source_title || b.title || "")));
      const storedEvent = stored?.date === today && stored?.id && stored?.version === 4
        ? candidates.find(event => String(event.id) === String(stored.id))
        : null;
      const event = todaysEvents[0] || storedEvent || candidates[Number(today.replace(/-/g, "")) % candidates.length];
      const lesson = dailyLessonFromEvent(event);
      const moment = {
        version: 4,
        date: today,
        id: String(event.id),
        title: timelineCaption(event),
        dateLabel: lesson.dateLabel,
        lesson: lesson.lesson,
        sourceTitle: event.source_title || sourceLabel(event),
        sourceSlug: event.source_slug || "",
        onThisDay: timelineEventMatchesToday(event, today)
      };
      localStorage.setItem("nli-desktop-daily-moment", JSON.stringify(moment));
      return moment;
    }

    function upcomingExhibitEvent() {
      const today = new Date(`${localDateKey()}T00:00:00`);
      const candidates = state.calendarEvents
        .filter(event => isExhibitCalendarEvent(event))
        .map(event => {
          const start = new Date(event.start_datetime || event.collection_date || event.end_datetime || "");
          const end = new Date(event.end_datetime || event.start_datetime || event.collection_date || "");
          return { event, start, end };
        })
        .filter(item => Number.isFinite(item.start.getTime()) && (!Number.isFinite(item.end.getTime()) || item.end >= today))
        .sort((a, b) => a.start - b.start || String(a.event.title || "").localeCompare(String(b.event.title || "")));
      return candidates[0]?.event || null;
    }

    function upcomingExhibitDismissKey(event) {
      return `nli-hide-upcoming-exhibit-${localDateKey()}-${event?.slug || event?.id || "event"}`;
    }

    function syncDailyCardStackVisibility() {
      if (!dailyCardStackEl || !dailyLearningCardEl || !dailyDidYouKnowCardEl) return;
      const upcomingCard = dailyCardStackEl.querySelector("#upcoming-exhibit-card");
      dailyCardStackEl.hidden = dailyDidYouKnowCardEl.hidden && dailyLearningCardEl.hidden && (!upcomingCard || upcomingCard.hidden);
      syncFloatingPanelLayout();
    }

    function renderUpcomingExhibitCard() {
      if (!dailyCardStackEl) return;
      const event = upcomingExhibitEvent();
      let card = dailyCardStackEl.querySelector("#upcoming-exhibit-card");
      if (!event || localStorage.getItem(upcomingExhibitDismissKey(event)) === "1") {
        if (card) {
          card.hidden = true;
          card.innerHTML = "";
        }
        syncDailyCardStackVisibility();
        return;
      }
      if (!card) {
        card = document.createElement("div");
        card.id = "upcoming-exhibit-card";
        card.className = "daily-learning-card upcoming-exhibit-card";
        dailyCardStackEl.prepend(card);
      }
      card.hidden = false;
      card.dataset.upcomingExhibitSlug = event.slug || "";
      card.innerHTML = `
        <strong>Upcoming exhibit: ${escapeHtml(event.title || "On This Site exhibit")}</strong>
        <p class="daily-lesson-context">${escapeHtml([CALENDAR_UTILS.eventDateRange(event), event.venue].filter(Boolean).join(" - "))}</p>
        ${event.summary ? `<p>${escapeHtml(firstCompleteSentences(stripHtml(event.summary), 1, 190))}</p>` : ""}
        <div class="mini-actions">
          <button class="button secondary" type="button" data-open-upcoming-exhibit="${escapeHtml(event.slug || "")}">Learn more</button>
          <button class="button secondary" type="button" data-hide-upcoming-exhibit="${escapeHtml(event.slug || "")}">Dismiss today</button>
        </div>
      `;
      syncDailyCardStackVisibility();
    }

    function renderDailyLearningCard() {
      if (!dailyCardStackEl || !dailyLearningCardEl || !dailyDidYouKnowCardEl) return;
      const today = localDateKey();
      const goalHidden = localStorage.getItem("nli-hide-daily-goal") === today;
      const didYouKnowHidden = localStorage.getItem("nli-hide-on-this-day") === today || localStorage.getItem("nli-hide-did-you-know") === today;
      const moment = dailyHistoricMoment();
      if (moment && !didYouKnowHidden) {
        const isOnThisDay = Boolean(moment.onThisDay);
        const openButton = isOnThisDay
          ? `<button class="button secondary" type="button" data-open-daily-moment="${escapeHtml(moment.id)}">Learn more</button>`
          : moment.sourceSlug
            ? `<button class="button secondary" type="button" data-open-daily-site="${escapeHtml(moment.sourceSlug)}">Learn more</button>`
            : `<button class="button secondary" type="button" data-open-daily-moment="${escapeHtml(moment.id)}">Learn more</button>`;
        dailyDidYouKnowCardEl.hidden = false;
        dailyDidYouKnowCardEl.classList.toggle("daily-on-this-day", isOnThisDay);
        dailyDidYouKnowCardEl.innerHTML = `
          <div class="on-this-day-card-head">
            ${isOnThisDay ? `<span class="on-this-day-badge" aria-hidden="true">??</span>` : ""}
            <strong>${isOnThisDay ? "On This Day in History" : "Did You Know?"}</strong>
          </div>
          <p class="daily-lesson-context">${escapeHtml([moment.dateLabel, moment.sourceTitle].filter(Boolean).join(" - "))}</p>
          <p><b>${escapeHtml(moment.title || "Historic moment")}</b>${moment.lesson ? ` - ${escapeHtml(moment.lesson)}` : ""}</p>
          <div class="mini-actions">
            ${openButton}
            <button class="button secondary" type="button" ${isOnThisDay ? "data-hide-on-this-day" : "data-hide-did-you-know"}>Dismiss today</button>
          </div>
        `;
      } else {
        dailyDidYouKnowCardEl.hidden = true;
        dailyDidYouKnowCardEl.classList.remove("daily-on-this-day");
        dailyDidYouKnowCardEl.innerHTML = "";
      }
      if (goalHidden) {
        dailyLearningCardEl.hidden = true;
        dailyLearningCardEl.innerHTML = "";
        syncDailyCardStackVisibility();
        return;
      }
      const goal = dailyLearningGoal();
      dailyLearningCardEl.hidden = false;
      dailyLearningCardEl.innerHTML = `
        <strong>Daily learning goal: find one site connected to ${escapeHtml(goal.label)}</strong>
        <p>Suggested starting point: ${escapeHtml(goal.siteTitle || "open the map and explore")}.</p>
        <div class="mini-actions">
          ${goal.siteSlug ? `<button class="button secondary" type="button" data-open-daily-site="${escapeHtml(goal.siteSlug)}">Open site</button>` : ""}
          <button class="button secondary" type="button" data-hide-daily-learning>Dismiss today</button>
        </div>
      `;
      syncDailyCardStackVisibility();
    }

    function loadLandMaskScriptOnMainThread(url) {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-nli-land-mask-runtime]');
        const script = existing || document.createElement("script");
        const finish = () => window.NLI_LAND_MASK_DATA
          ? resolve(window.NLI_LAND_MASK_DATA)
          : reject(new Error("Land mask data loaded without exposing its geometry."));
        script.addEventListener("load", finish, { once: true });
        script.addEventListener("error", () => reject(new Error("Land mask data could not be loaded.")), { once: true });
        if (!existing) {
          script.src = url;
          script.async = true;
          script.dataset.nliLandMaskRuntime = "1";
          document.head.appendChild(script);
        } else if (window.NLI_LAND_MASK_DATA) {
          finish();
        }
      });
    }

    function loadLandMaskScriptInWorker(url) {
      if (!window.Worker || !window.Blob || !window.URL?.createObjectURL) {
        return Promise.reject(new Error("Land mask worker is unavailable."));
      }
      return new Promise((resolve, reject) => {
        const workerSource = `self.onmessage = function (event) {
          try {
            importScripts(event.data);
            self.postMessage(globalThis.NLI_LAND_MASK_DATA || null);
          } catch (error) {
            self.postMessage({ __nliLandMaskError: error && error.message ? error.message : "Land mask worker failed." });
          }
        };`;
        const workerUrl = window.URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
        const worker = new Worker(workerUrl);
        let settled = false;
        const cleanup = () => {
          worker.terminate();
          window.URL.revokeObjectURL(workerUrl);
        };
        const finish = (callback, value) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          cleanup();
          callback(value);
        };
        const timer = window.setTimeout(() => finish(reject, new Error("Land mask worker timed out.")), 10000);
        worker.onmessage = event => {
          const value = event.data;
          if (value?.__nliLandMaskError) finish(reject, new Error(value.__nliLandMaskError));
          else finish(resolve, value);
        };
        worker.onerror = () => finish(reject, new Error("Land mask worker could not start."));
        worker.postMessage(new URL(url, window.location.href).href);
      });
    }

    async function ensureLandMask() {
      if (state.landMaskData !== null) return state.landMaskData;
      if (state.landMaskPromise) return state.landMaskPromise;
      state.landMaskPromise = (async () => {
        try {
          let mask = window.NLI_LAND_MASK_DATA || null;
          if (!mask && window.NLI_LAND_MASK_SCRIPT_URL) {
            mask = await loadLandMaskScriptInWorker(window.NLI_LAND_MASK_SCRIPT_URL)
              .catch(() => loadLandMaskScriptOnMainThread(window.NLI_LAND_MASK_SCRIPT_URL));
          }
          if (!mask) {
            const response = await fetch(`${LAND_MASK_URL}?v=${LAND_MASK_VERSION}`, { cache: "force-cache" });
            if (!response.ok) throw new Error(`Land mask unavailable: ${response.status}`);
            mask = await response.json();
          }
          state.landMaskData = mask?.type === "Feature" ? mask : null;
          state.waterMask = state.landMaskData ? createWaterMask(state.landMaskData) : null;
          clearFeatureCache();
          state.siteDisplayGeometryCache = new WeakMap();
        } catch (error) {
          console.warn("Land mask could not be loaded for shoreline display cleanup.", error);
          state.landMaskData = null;
          state.waterMask = null;
        } finally {
          state.landMaskPromise = null;
        }
        return state.landMaskData;
      })();
      return state.landMaskPromise;
    }

    function createWaterMask(landMask) {
      const holes = [];
      const geometry = landMask?.geometry;
      if (!geometry) return { type: "FeatureCollection", features: [] };
      if (geometry.type === "Polygon") {
        holes.push(...outerRingsForWaterMask([geometry.coordinates]));
      } else if (geometry.type === "MultiPolygon") {
        holes.push(...outerRingsForWaterMask(geometry.coordinates));
      }
      const outer = [
        [LONG_ISLAND_BOUNDS[0][0], LONG_ISLAND_BOUNDS[0][1]],
        [LONG_ISLAND_BOUNDS[1][0], LONG_ISLAND_BOUNDS[0][1]],
        [LONG_ISLAND_BOUNDS[1][0], LONG_ISLAND_BOUNDS[1][1]],
        [LONG_ISLAND_BOUNDS[0][0], LONG_ISLAND_BOUNDS[1][1]],
        [LONG_ISLAND_BOUNDS[0][0], LONG_ISLAND_BOUNDS[0][1]]
      ];
      return {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [outer, ...holes] }
        }]
      };
    }

    function outerRingsForWaterMask(polygons) {
      return (polygons || [])
        .map(rings => closeRing((rings || [])[0] || []))
        .filter(ring => ring.length >= 4 && Math.abs(ringArea(ring)) > 0.000001);
    }

    function closeRing(ring) {
      const cleaned = (ring || []).filter(point => Array.isArray(point) && point.length >= 2);
      if (!cleaned.length) return [];
      const first = cleaned[0];
      const last = cleaned[cleaned.length - 1];
      if (first[0] === last[0] && first[1] === last[1]) return cleaned;
      return [...cleaned, first];
    }

    function polygonLabelFeatures(category) {
      return cachedFeatures(`polygonLabelFeatures:${category}`, () => ({
        type: "FeatureCollection",
        features: dedupeLabelFeatures((filteredPolygonFeatures().features || [])
          .filter(feature => category === "territory"
            ? feature.properties?.feature_category === "territory"
            : feature.properties?.feature_category !== "territory"))
          .flatMap(feature => category === "territory"
            ? labelPointFeaturesForFeature(feature).slice(0, 1)
            : labelPointFeaturesForFeature(feature))
      }));
    }

    function geometryIntersectsLeafletBounds(geometry, bounds, padding = 0.015) {
      if (!geometry || !bounds) return false;
      const geometryBounds = cachedGeometryBounds(geometry);
      if (!geometryBounds) return false;
      return !(
        geometryBounds[1][0] < bounds.getWest() - padding ||
        geometryBounds[0][0] > bounds.getEast() + padding ||
        geometryBounds[1][1] < bounds.getSouth() - padding ||
        geometryBounds[0][1] > bounds.getNorth() + padding
      );
    }

    function polygonLabelFeaturesInLeafletBounds(category, bounds) {
      if (!bounds || category === "territory") return polygonLabelFeatures(category);
      const viewportKey = leafletViewportSignature(bounds);
      return cachedFeatures(`polygonLabelFeatures:${category}:leaflet:${viewportKey}`, () => ({
        type: "FeatureCollection",
        features: dedupeLabelFeatures((filteredPolygonFeatures().features || [])
          .filter(feature => feature.properties?.feature_category !== "territory")
          .filter(feature => geometryIntersectsLeafletBounds(feature.geometry, bounds))
          .flatMap(labelPointFeaturesForFeature))
      }));
    }

    function isPriorityTerritoryLabel(feature) {
      const title = displayFeatureTitle(feature?.properties || feature || "");
      return /montaukett ancestral land/i.test(title);
    }

    function labelPointFeaturesForFeature(feature) {
      const geometry = feature?.geometry;
      if (!geometry) return [];
      const preferredPoint = feature?.properties?.territory_label_point;
      if (Array.isArray(preferredPoint) && preferredPoint.length >= 2 && preferredPoint.every(Number.isFinite)) {
        return [labelFeatureAt(feature, preferredPoint, 0)];
      }
      if (geometry.type !== "MultiPolygon") {
        const center = featureCentroid(feature);
        return center ? [labelFeatureAt(feature, center, 0)] : [];
      }
      const pieces = (geometry.coordinates || [])
        .map((rings, index) => ({
          index,
          rings,
          area: Math.abs(ringArea((rings || [])[0] || []))
        }))
        .filter(piece => piece.rings?.[0]?.length && piece.area > 0)
        .sort((a, b) => b.area - a.area);
      const largest = pieces[0]?.area || 0;
      return pieces
        .filter((piece, index) => index === 0 || piece.area >= Math.max(largest * 0.08, 0.00003))
        .slice(0, 3)
        .map(piece => {
          const point = bestLabelPoint({ type: "Feature", geometry: { type: "Polygon", coordinates: piece.rings }, properties: feature.properties || {} });
          return point ? labelFeatureAt(feature, point, piece.index) : null;
        })
        .filter(Boolean);
    }

    function labelFeatureAt(feature, coordinates, index) {
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates },
        properties: {
          ...(feature.properties || {}),
          label_instance: index,
          priority_label: isPriorityTerritoryLabel(feature)
        }
      };
    }

    function dedupeLabelFeatures(features) {
      const sorted = [...features]
        .sort((a, b) => numeric(b.properties?.feature_area, 0) - numeric(a.properties?.feature_area, 0))
        .filter(feature => normalizeComparisonText(displayFeatureTitle(feature.properties || "")));
      const keyFor = feature => {
        const title = normalizeComparisonText(displayFeatureTitle(feature.properties || ""));
        const category = feature.properties?.feature_category || "";
        const coords = feature.geometry?.coordinates || [];
        return `${category}:${title}:${numeric(feature.properties?.label_instance, 0)}:${Number(coords[0] || 0).toFixed(3)},${Number(coords[1] || 0).toFixed(3)}`;
      };
      return SHARED_UTILS.uniqueBy(sorted, keyFor);
    }

    function filteredManagedSiteFeatures() {
      return cachedFeatures("filteredManagedSiteFeatures", () => filterByCategory(managedSiteFeatures()));
    }

    function managedSiteLabelFeatures() {
      return cachedFeatures("managedSiteLabelFeatures", () => ({
        type: "FeatureCollection",
        features: (filteredManagedSiteFeatures().features || [])
          .filter(feature => /Polygon/.test(feature.geometry?.type || ""))
          .flatMap(labelPointFeaturesForFeature)
      }));
    }

    function isManagedTerritoryLabelFeature(feature) {
      const props = feature?.properties || {};
      return props.broad === true || props.broad === "true";
    }

    function isBroadTerritoryFeature(feature) {
      const site = findSiteFromFeature(feature);
      if (site) return isBroadTerritorySite(site);
      const props = feature?.properties || {};
      return SITE_UTILS.isBroadTerritory({
        slug: props.directus_site_slug || props.listing_slug || props.slug,
        title: displayFeatureTitle(props),
        site_type: props.site_type || props.feature_category
      }, { normalizeText: normalizeComparisonText });
    }

    function isSuppressedManagedDetailLabelFeature(feature) {
      const props = feature?.properties || {};
      const slug = String(props.directus_site_slug || props.slug || "").toLowerCase();
      const title = normalizeComparisonText(displayFeatureTitle(props));
      // Hoggenoch has a placename polygon directly under the Hoggenoch-Manhansett territory polygon.
      // Showing both labels in the same place makes the territory title unreadable.
      return slug === "hoggenoch" || title === "hoggenoch";
    }

    function managedSiteTerritoryLabelFeatures() {
      return cachedFeatures("managedSiteTerritoryLabelFeatures", () => ({
        type: "FeatureCollection",
        features: (filteredManagedSiteFeatures().features || [])
          .filter(feature => /Polygon/.test(feature.geometry?.type || ""))
          .filter(isManagedTerritoryLabelFeature)
          .flatMap(feature => labelPointFeaturesForFeature(feature).slice(0, 1))
      }));
    }

    function managedSiteDetailLabelFeatures() {
      return cachedFeatures("managedSiteDetailLabelFeatures", () => ({
        type: "FeatureCollection",
        features: (managedSiteLabelFeatures().features || [])
          .filter(feature => !isManagedTerritoryLabelFeature(feature))
          .filter(feature => !isSuppressedManagedDetailLabelFeature(feature))
      }));
    }

    function managedSiteDetailLabelFeaturesInLeafletBounds(bounds) {
      if (!bounds) return managedSiteDetailLabelFeatures();
      const viewportKey = leafletViewportSignature(bounds);
      return cachedFeatures(`managedSiteDetailLabelFeatures:leaflet:${viewportKey}`, () => ({
        type: "FeatureCollection",
        features: dedupeLabelFeatures((filteredManagedSiteFeatures().features || [])
          .filter(feature => /Polygon/.test(feature.geometry?.type || ""))
          .filter(feature => geometryIntersectsLeafletBounds(feature.geometry, bounds))
          .flatMap(labelPointFeaturesForFeature)
          .filter(feature => !isManagedTerritoryLabelFeature(feature))
          .filter(feature => !isSuppressedManagedDetailLabelFeature(feature)))
      }));
    }

    function siteDisplayGeometry(site) {
      if (!site || typeof site !== "object") return null;
      if (site.map_geometry_alias_of) {
        const canonical = state.siteBySlug.get(site.map_geometry_alias_of);
        if (canonical && canonical !== site) return siteDisplayGeometry(canonical);
      }
      const defaultBluePin = SITE_UTILS.siteUsesDefaultBluePin?.(site) === true;
      const cached = state.siteDisplayGeometryCache.get(site);
      if (
        cached &&
        cached.displayGeometry === (site.display_geojson || null) &&
        cached.geojson === (site.geojson || null) &&
        cached.landMaskGeometry === (state.landMaskData?.geometry || null) &&
        cached.defaultBluePin === defaultBluePin
      ) {
        return cached.geometry;
      }
      let geometry = null;
      const displayGeometry = site?.display_geojson || null;
      if (defaultBluePin) {
        const center = siteCenter(site?.geojson || displayGeometry);
        geometry = center ? { type: "Point", coordinates: center } : (displayGeometry || site?.geojson || null);
      } else if (displayGeometry) {
        geometry = RESTORE_CONTAINED_LAND_PIECES_ON_RENDER
          ? restoreContainedLandPieces(site, displayGeometry)
          : displayGeometry;
        if (/montaukett/i.test(`${site?.title || ""} ${site?.slug || ""}`)) {
          const gardiners = islandPolygonFromMask("gardiners");
          geometry = gardiners ? appendPolygonToGeometry(geometry, gardiners) : geometry;
        }
      } else {
        geometry = site?.geojson || null;
      }
      state.siteDisplayGeometryCache.set(site, {
        displayGeometry,
        geojson: site?.geojson || null,
        landMaskGeometry: state.landMaskData?.geometry || null,
        defaultBluePin,
        geometry
      });
      return geometry;
    }

    function restoreContainedLandPieces(site, displayGeometry) {
      const sourceGeometry = site?.geojson || displayGeometry;
      if (!state.landMaskData?.geometry || !sourceGeometry || !displayGeometry) return displayGeometry;
      if (sourceGeometry.type === "Point" || displayGeometry.type === "Point") return displayGeometry;
      const text = normalizeComparisonText(`${site?.title || ""} ${site?.site_type || ""}`);
      if (!/ancestral land|traditional land|territory|reservation/.test(text)) return displayGeometry;
      const polygons = state.landMaskData.geometry.type === "Polygon"
        ? [state.landMaskData.geometry.coordinates]
        : (state.landMaskData.geometry.coordinates || []);
      let restored = displayGeometry;
      for (const rings of polygons) {
        const outer = rings?.[0] || [];
        if (!outer.length) continue;
        const center = ringCenter(outer);
        if (!center) continue;
        const barrierMatch = barrierBeachMatchesTerritory(site, center, sourceGeometry);
        if (!barrierMatch) {
          if (!pointInGeometryBounds(center, sourceGeometry, 0.001)) continue;
          if (!pointInGeometry(center, sourceGeometry)) continue;
        }
        if (pointInGeometryBounds(center, restored, 0.001) && pointInGeometry(center, restored)) continue;
        if (!isMeaningfulLandPiece(outer, center)) continue;
        restored = appendPolygonToGeometry(restored, rings);
      }
      return restored;
    }

    function barrierBeachMatchesTerritory(site, center, sourceGeometry) {
      return GEOMETRY_UTILS.barrierBeachMatchesTerritory(site, center, sourceGeometry, { normalizeText: normalizeComparisonText });
    }

    function isMeaningfulLandPiece(ring, center) {
      const bounds = ringBounds(ring);
      if (!bounds) return false;
      const width = Math.abs(bounds[1][0] - bounds[0][0]);
      const height = Math.abs(bounds[1][1] - bounds[0][1]);
      const area = width * height;
      if (area < 0.000002) return false;
      const isSouthShoreBarrier = center[1] < 40.82 && center[0] > -73.92 && center[0] < -72.35;
      const isEastEndIsland = center[0] > -72.4 && center[1] > 40.85;
      return isSouthShoreBarrier || isEastEndIsland || area > 0.00008;
    }

    function ringBounds(ring) {
      return GEOMETRY_UTILS.ringBounds(ring);
    }

    function customSiteIconFeatures() {
      return cachedFeatures("customSiteIconFeatures", () => ({
        type: "FeatureCollection",
        features: state.sites
          .filter(site => siteDisplayGeometry(site) && siteMapIconUrl(site) && (state.usingLeafletFallback || siteHasLoadedMapIcon(site)))
          .map(site => {
            const geometry = siteDisplayGeometry(site);
            const center = siteCenter(geometry);
            if (!center) return null;
            return {
              type: "Feature",
              geometry: { type: "Point", coordinates: center },
              properties: {
                directus_site_id: site.id,
                directus_site_slug: site.slug,
                title: site.title,
                description: site.summary || "",
                icon_key: siteMapIconKey(site),
                icon_url: siteMapIconUrl(site),
                location_accuracy: SITE_UTILS.siteLocationAccuracy(site),
                layer_categories: SITE_UTILS.siteLayerCategoryKeys(site).join(" "),
                timeline_jump: timelineIconJumpMatchesSite(site),
                timeline_offset: timelineIconJumpMatchesSite(site) ? state.timelineIconOffset : 0,
                feature_category: classifyFeature({
                  properties: {
                    title: site.title,
                    site_type: site.site_type || "",
                    description: site.summary || "",
                    link: `/listing/${site.slug}/`
                  }
                }, geometry?.type === "Point" ? "marker" : "polygon")
              }
            };
          })
          .filter(Boolean)
      }));
    }

    function dateLabelMonthDay(dateLabel) {
      const text = String(dateLabel || "").trim();
      const match = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
      if (!match) return "";
      const month = DATE_LABEL_MONTHS[match[1].toLowerCase()];
      const dayNumber = Number(match[2]);
      const day = Number.isFinite(dayNumber) ? String(dayNumber).padStart(2, "0") : "";
      return month && day ? `${month}-${day}` : "";
    }

    function timelineEventMatchesToday(event, today = localDateKey()) {
      const todayMonthDay = String(today || "").slice(5, 10);
      return Boolean(todayMonthDay && dateLabelMonthDay(event?.date_label) === todayMonthDay);
    }

    function activeSiteAttentionEntries(today = localDateKey()) {
      const entries = new Map();
      for (const config of ATTENTION_SITE_WINDOWS) {
        if (!config.slug || (config.until && today > config.until)) continue;
        entries.set(config.slug, {
          kind: "urgent",
          reason: config.reason || "Site of attention"
        });
      }
      for (const event of state.timelineEvents || []) {
        if (event.source_type !== "site" || !event.source_slug || !timelineEventMatchesToday(event, today)) continue;
        entries.set(event.source_slug, {
          kind: "on-this-day",
          reason: `On this day: ${event.title || event.date_label || "historic moment"}`
        });
      }
      return entries;
    }

    function siteAttentionFeatures() {
      const entries = activeSiteAttentionEntries();
      return {
        type: "FeatureCollection",
        features: [...entries.entries()].map(([slug, attention]) => {
          const site = state.siteBySlug.get(slug);
          const geometry = siteDisplayGeometry(site);
          const center = siteCenter(geometry);
          if (!site || !center) return null;
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: center },
            properties: {
              slug: site.slug,
              title: site.title,
              attention_kind: attention.kind,
              attention_reason: attention.reason,
              layer_categories: SITE_UTILS.siteLayerCategoryKeys(site).join(" "),
              feature_category: classifyFeature({
                properties: {
                  title: site.title,
                  site_type: site.site_type || "",
                  description: site.summary || "",
                  link: `/listing/${site.slug}/`
                }
              }, geometry?.type === "Point" ? "marker" : "polygon")
            }
          };
        }).filter(Boolean)
      };
    }

    function calendarEventFeatures() {
      return cachedFeatures("calendarEventFeatures", () => ({
        type: "FeatureCollection",
        features: state.calendarEvents
          .filter(event => event.geojson && event.center)
          .map(event => ({
            type: "Feature",
            geometry: event.geojson,
            properties: {
              calendar_event_id: event.id,
              calendar_event_slug: event.slug,
              title: event.title,
              description: stripHtml(event.summary || event.body || ""),
              event_type: event.event_type || "",
              date_label: CALENDAR_UTILS.eventDateRange(event),
              venue: event.venue || "",
              icon_key: eventMapIconKey(event),
              icon_url: MEDIA_UTILS.eventMapIconUrl(event, { directusAssetUrl }),
              fillcolor: GEOMETRY_UTILS.normalizeHex(event.icon_color, "#7b3fc6"),
              opacity: 0.28
            }
          }))
      }));
    }

    function calendarEventIconFeatures() {
      return cachedFeatures("calendarEventIconFeatures", () => ({
        type: "FeatureCollection",
        features: state.calendarEvents
          .filter(event => event.center && MEDIA_UTILS.eventMapIconUrl(event, { directusAssetUrl }))
          .map(event => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: event.center },
            properties: {
              calendar_event_id: event.id,
              calendar_event_slug: event.slug,
              title: event.title,
              description: stripHtml(event.summary || ""),
              icon_key: eventMapIconKey(event),
              icon_url: MEDIA_UTILS.eventMapIconUrl(event, { directusAssetUrl })
            }
          }))
      }));
    }

    function activeMapStories() {
      return MAP_STORY_UTILS.activeStories(state.mapStories, state.mapStoryVotes, MAP_STORY_RULES);
    }

    function mapStoryFeatures() {
      return {
        type: "FeatureCollection",
        features: activeMapStories().map(story => {
          const coords = MAP_STORY_UTILS.coordinates(story);
          if (!coords) return null;
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: coords },
            properties: {
              map_story_id: story.id,
              title: "Visitor story",
              description: story.caption || "",
              attached_site_slug: story.attached_site_slug || "",
              author_name: story.author_name || "Contributor",
              story_nudge: Boolean(story.attached_site_slug)
            }
          };
        }).filter(Boolean)
      };
    }

    function managedSiteFeatures() {
      return cachedFeatures("managedSiteFeatures", () => ({
        type: "FeatureCollection",
        features: state.sites
          .filter(site => siteDisplayGeometry(site))
          .filter(site => site.slug !== WHALING_FEATURE_SLUG)
          .filter(site => !site.map_geometry_alias_of)
          .filter(site => siteDisplayGeometry(site)?.type !== "Point" || !siteHasImportedReservationPolygon(site))
          .filter(site => siteDisplayGeometry(site)?.type !== "Point" || !siteHasImportedMarker(site))
          .map(site => {
            const geometry = siteDisplayGeometry(site);
            return {
              type: "Feature",
              geometry,
              properties: {
                directus_site_id: site.id,
                directus_site_slug: site.slug,
                title: site.title,
                description: site.summary || "",
                has_custom_icon: Boolean(siteMapIconUrl(site)),
                has_header_image: siteHasHeaderImage(site),
                location_accuracy: SITE_UTILS.siteLocationAccuracy(site),
                layer_categories: SITE_UTILS.siteLayerCategoryKeys(site).join(" "),
                feature_category: classifyFeature({
                  properties: {
                    title: site.title,
                    site_type: site.site_type || "",
                    description: site.summary || "",
                    link: `/listing/${site.slug}/`
                  }
                }, geometry?.type === "Point" ? "marker" : "polygon"),
                fillcolor: siteTerritoryFillColor(site, "#496f5d"),
                opacity: numeric(site.map_opacity, 0.38),
                broad: isBroadTerritorySite(site),
                territory_label_point: site.territory_label_point || null,
                label_size: featureBoundsScale({ geometry })
              }
            };
          })
      }));
    }

    function siteTerritoryFillColor(site, fallback) {
      return SITE_UTILS.siteTerritoryFillColor(site, fallback, {
        overrides: DESKTOP_TERRITORY_FILL_OVERRIDES,
        normalizeHex
      });
    }

    function prepareMapIconImage(image) {
      const cssBoxSize = 32;
      const pixelRatio = 2;
      const canvasSize = cssBoxSize * pixelRatio;
      const padding = 4 * pixelRatio;
      const width = Number(image?.width || 0);
      const height = Number(image?.height || 0);
      if (!width || !height) return { image };
      const canvas = document.createElement("canvas");
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const context = canvas.getContext("2d");
      const scale = Math.min((canvasSize - padding * 2) / width, (canvasSize - padding * 2) / height);
      const drawWidth = Math.max(1, Math.round(width * scale));
      const drawHeight = Math.max(1, Math.round(height * scale));
      const drawX = Math.round((canvasSize - drawWidth) / 2);
      const drawY = Math.round((canvasSize - drawHeight) / 2);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      return {
        image: context.getImageData(0, 0, canvas.width, canvas.height),
        options: { pixelRatio }
      };
    }

    function addMapStoryIcon() {
      if (!state.map || state.map.hasImage("story-bubble")) return;
      const pixelRatio = 2;
      const canvas = document.createElement("canvas");
      canvas.width = 72;
      canvas.height = 72;
      const context = canvas.getContext("2d");
      context.scale(pixelRatio, pixelRatio);
      context.shadowColor = "rgba(20, 31, 24, 0.22)";
      context.shadowBlur = 7;
      context.shadowOffsetY = 3;
      context.fillStyle = "#ffffff";
      context.strokeStyle = "rgba(52, 82, 67, 0.38)";
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(13, 5);
      context.lineTo(23, 5);
      context.quadraticCurveTo(31, 5, 31, 13);
      context.lineTo(31, 18);
      context.quadraticCurveTo(31, 26, 23, 26);
      context.lineTo(17, 26);
      context.lineTo(9, 32);
      context.lineTo(10.5, 25);
      context.quadraticCurveTo(5, 22.5, 5, 16.5);
      context.lineTo(5, 13);
      context.quadraticCurveTo(5, 5, 13, 5);
      context.closePath();
      context.fill();
      context.shadowColor = "transparent";
      context.stroke();
      context.fillStyle = "#4f6d5c";
      [13, 18, 23].forEach(x => {
        context.beginPath();
        context.arc(x, 15.5, 1.65, 0, Math.PI * 2);
        context.fill();
      });
      state.map.addImage("story-bubble", context.getImageData(0, 0, canvas.width, canvas.height), { pixelRatio });
    }

    function addBiographyCanoeIcon() {
      if (!state.map || state.map.hasImage(BIOGRAPHY_CANOE_ICON_ID)) return;
      const pixelRatio = 2;
      const width = 76;
      const height = 34;
      const canvas = document.createElement("canvas");
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      const context = canvas.getContext("2d");
      context.scale(pixelRatio, pixelRatio);
      context.translate(width / 2, height / 2);
      context.shadowColor = "rgba(22, 17, 11, 0.28)";
      context.shadowBlur = 3;
      context.shadowOffsetY = 1;
      context.fillStyle = "#74491f";
      context.strokeStyle = "#3f2916";
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(-29, 0);
      context.quadraticCurveTo(-16, -6, 0, -6);
      context.quadraticCurveTo(16, -6, 29, 0);
      context.quadraticCurveTo(16, 6, 0, 6);
      context.quadraticCurveTo(-16, 6, -29, 0);
      context.closePath();
      context.fill();
      context.shadowColor = "transparent";
      context.stroke();
      state.map.addImage(BIOGRAPHY_CANOE_ICON_ID, context.getImageData(0, 0, canvas.width, canvas.height), { pixelRatio });
    }

    function loadMapImage(id, url) {
      return new Promise(resolve => {
        if (!id || !url || state.map.hasImage(id)) {
          if (id && state.map?.hasImage(id)) state.loadedMapIconKeys.add(id);
          resolve(false);
          return;
        }
        const timeout = window.setTimeout(() => resolve(false), 2500);
        state.map.loadImage(url, (error, image) => {
          window.clearTimeout(timeout);
          if (!error && image && !state.map.hasImage(id)) {
            const prepared = prepareMapIconImage(image);
            state.map.addImage(id, prepared.image, prepared.options || {});
            state.loadedMapIconKeys.add(id);
            state.failedMapIconKeys.delete(id);
            resolve(true);
          } else {
            if (error) console.warn(`Could not load marker icon ${id}`, url, error);
            state.failedMapIconKeys.add(id);
            resolve(false);
          }
        });
      });
    }

    async function loadMarkerIcons() {
      const features = markerFeatures().features || [];
      const icons = new Map();
      addBiographyCanoeIcon();
      icons.set(BIOGRAPHY_PERSON_ICON_ID, BIOGRAPHY_PERSON_ICON_URL);
      for (const feature of features) {
        const key = feature.properties?.icon_key;
        const url = feature.properties?.icon_url;
        if (key && url) icons.set(key, url);
      }
      for (const site of state.sites) {
        const key = siteMapIconKey(site);
        const url = siteMapIconUrl(site);
        if (key && url) icons.set(key, url);
      }
      for (const feature of calendarEventIconFeatures().features || []) {
        const key = feature.properties?.icon_key;
        const url = feature.properties?.icon_url;
        if (key && url) icons.set(key, url);
      }
      await Promise.all([...icons].map(([key, url]) => loadMapImage(key, url)));
      clearFeatureCache();
    }

    function removeArchiveLayers() {
      if (!state.map) return;
      for (const id of ARCHIVE_LAYER_IDS) {
        if (state.map.getLayer(id)) state.map.removeLayer(id);
      }
      for (const id of ARCHIVE_SOURCE_IDS) {
        if (state.map.getSource(id)) state.map.removeSource(id);
      }
    }

    async function addArchiveLayers() {
      await ensureLandMask();
      removeArchiveLayers();
      for (const id of [STYLE_MARKER_LAYER_ID, STYLE_POLYGON_LAYER_ID]) {
        if (state.map.getLayer(id)) state.map.setLayoutProperty(id, "visibility", "none");
      }

      state.map.addSource("wp-polygons-original", { type: "geojson", data: filteredPolygonFeatures() });
      state.map.addSource("long-island-emphasis", {
        type: "geojson",
        data: state.landMaskData || { type: "FeatureCollection", features: [] }
      });
      state.map.addLayer({
        id: "long-island-emphasis",
        type: "fill",
        source: "long-island-emphasis",
        paint: {
          "fill-color": state.basemap === "blank" ? "#d7efe9" : "#7fc7e5",
          "fill-opacity": state.basemap === "satellite" ? 0.34 : 0.28
        }
      });
      state.map.addLayer({
        id: "wp-polygons-original-fill",
        type: "fill",
        source: "wp-polygons-original",
        filter: ["in", ["get", "feature_category"], ["literal", ["territory", "reservation"]]],
        layout: {
          "fill-sort-key": ["to-number", ["get", "polygon_sort_key"]]
        },
        paint: {
          "fill-color": ["get", "fillcolor"],
          "fill-opacity": polygonOpacityExpression(0.36)
        }
      });
      state.map.addLayer({
        id: "wp-polygons-original-line",
        type: "line",
        source: "wp-polygons-original",
        paint: {
          "line-color": ["get", "linecolor"],
          "line-opacity": 0,
          "line-width": 0
        }
      });
      state.map.addSource("long-island-water-mask", {
        type: "geojson",
        data: state.waterMask || { type: "FeatureCollection", features: [] }
      });
      state.map.addLayer({
        id: "long-island-water-mask",
        type: "fill",
        source: "long-island-water-mask",
        paint: {
          "fill-color": state.basemap === "blank" ? "#f6f8f3" : "#9ed8e7",
          "fill-opacity": state.basemap === "satellite" ? 0.78 : 0.9
        }
      });
      state.map.addSource("gardiners-montaukett-territory", {
        type: "geojson",
        data: gardinersMontaukettOverlayFeatures()
      });
      state.map.addLayer({
        id: "gardiners-montaukett-territory-fill",
        type: "fill",
        source: "gardiners-montaukett-territory",
        paint: {
          "fill-color": ["get", "fillcolor"],
          "fill-opacity": polygonOpacityExpression()
        }
      });
      state.map.addSource("directus-site-geometries", { type: "geojson", data: filteredManagedSiteFeatures() });
      state.map.addLayer({
        id: "directus-site-territories",
        type: "fill",
        source: "directus-site-geometries",
        filter: ["all", ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]], ["==", ["get", "broad"], true]],
        paint: {
          "fill-color": ["get", "fillcolor"],
          "fill-opacity": ["coalesce", ["to-number", ["get", "opacity"]], 0.35]
        }
      });
      state.map.addSource("place-name-areas", {
        type: "geojson",
        data: filteredPlaceNameAreaFeatures()
      });
      state.map.addLayer({
        id: "place-name-area-fill",
        type: "fill",
        source: "place-name-areas",
        paint: {
          "fill-color": ["coalesce", ["get", "fillcolor"], "#15988f"],
          "fill-opacity": ["coalesce", ["to-number", ["get", "opacity"]], 0.42]
        }
      });
      state.map.addLayer({
        id: "place-name-area-line",
        type: "line",
        source: "place-name-areas",
        paint: {
          "line-color": ["coalesce", ["get", "linecolor"], "#315b50"],
          "line-opacity": ["coalesce", ["to-number", ["get", "lineopacity"]], 0.3],
          "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.45, 12, 0.9, 16, 1.2]
        }
      });
      state.map.addLayer({
        id: "wp-polygons-detail-fill",
        type: "fill",
        source: "wp-polygons-original",
        filter: ["all", ["!", ["in", ["get", "feature_category"], ["literal", ["territory", "reservation"]]]], ["!=", ["get", "place_name_area_overlay"], true]],
        layout: {
          "fill-sort-key": ["to-number", ["get", "polygon_sort_key"]]
        },
        paint: {
          "fill-color": ["get", "fillcolor"],
          "fill-opacity": polygonOpacityExpression(0.3)
        }
      });
      state.map.addSource("wp-polygons-territory-labels", { type: "geojson", data: polygonLabelFeatures("territory") });
      state.map.addLayer({
        id: "wp-polygons-territory-label",
        type: "symbol",
        source: "wp-polygons-territory-labels",
        minzoom: TERRITORY_LABEL_MIN_ZOOM,
        layout: {
          "text-field": ["get", "title"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 4, 9.75, 9, 13.75, 12, 17],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "center",
          "text-variable-anchor": ["literal", ["center", "top", "bottom", "left", "right"]],
          "text-radial-offset": 0.7,
          "text-justify": "auto",
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-max-width": 9,
          "text-optional": true
        },
        paint: {
          "text-color": "#20251f",
          "text-halo-color": "rgba(255,255,255,0.92)",
          "text-halo-width": 1.35,
          "text-halo-blur": 0
        }
      });
      state.map.addSource("wp-polygons-detail-labels", { type: "geojson", data: polygonLabelFeatures("detail") });
      state.map.addLayer({
        id: "wp-polygons-detail-label",
        type: "symbol",
        source: "wp-polygons-detail-labels",
        filter: ["!=", ["get", "place_name_area_overlay"], true],
        minzoom: SITE_LABEL_MIN_ZOOM,
        layout: {
          "text-field": ["get", "title"],
          "text-size": ["interpolate", ["linear"], ["zoom"], SITE_LABEL_MIN_ZOOM, ["*", ["get", "label_size"], 0.84], 16, ["*", ["get", "label_size"], 1.16]],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "center",
          "text-variable-anchor": ["literal", ["center", "top", "bottom", "left", "right"]],
          "text-radial-offset": 0.7,
          "text-justify": "auto",
          "text-offset": ["literal", [0, 0.95]],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-max-width": 8,
          "text-optional": true
        },
        paint: {
          "text-color": "#26312a",
          "text-halo-color": "rgba(255,255,255,0.9)",
          "text-halo-width": 1.25,
          "text-halo-blur": 0
        }
      });
      state.map.addSource("place-name-area-labels", { type: "geojson", data: placeNameAreaLabelFeatures() });
      state.map.addLayer({
        id: "place-name-area-label",
        type: "symbol",
        source: "place-name-area-labels",
        minzoom: PLACE_NAME_AREA_LABEL_MIN_ZOOM,
        layout: {
          "text-field": ["get", "title"],
          "text-size": ["interpolate", ["linear"], ["zoom"], PLACE_NAME_AREA_LABEL_MIN_ZOOM, 10.5, 12, 13.5, 16, 16],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "center",
          "text-variable-anchor": ["literal", ["center", "top", "bottom", "left", "right"]],
          "text-radial-offset": 0.75,
          "text-justify": "auto",
          "text-max-width": 10,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-optional": true
        },
        paint: {
          "text-color": "#123f3b",
          "text-halo-color": "rgba(255,255,255,0.96)",
          "text-halo-width": 1.8,
          "text-halo-blur": 0.2
        }
      });

      state.map.addSource("wp-markers-original", { type: "geojson", data: filteredMarkerFeatures() });
      state.map.addLayer({
        id: "wp-markers-original-dot",
        type: "circle",
        source: "wp-markers-original",
        filter: ["!", ["has", "icon_key"]],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 4.8, 12, 7.2],
          "circle-color": "#8f5f3c",
          "circle-stroke-width": 1.4,
          "circle-stroke-color": "#fff",
          "circle-opacity": 0.78
        }
      });

      state.map.addSource("wp-markers-icons", { type: "geojson", data: markerIconFeatures() });
      state.map.addLayer({
        id: "wp-markers-original-icon",
        type: "symbol",
        source: "wp-markers-icons",
        layout: {
          "icon-image": ["get", "icon_key"],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 7, 1.39, 12, 1.54],
          "icon-offset": ["literal", [0, 0]],
          "icon-allow-overlap": true,
          "icon-anchor": "center"
        }
      });

      state.map.addSource("site-attention-points", { type: "geojson", data: filterByCategory(siteAttentionFeatures()) });
      state.map.addLayer({
        id: "directus-site-polygons",
        type: "fill",
        source: "directus-site-geometries",
        filter: ["all", ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]], ["!=", ["get", "broad"], true]],
        paint: {
          "fill-color": ["get", "fillcolor"],
          "fill-opacity": ["min", 0.32, ["coalesce", ["to-number", ["get", "opacity"]], 0.32]]
        }
      });
      state.map.addSource("directus-site-territory-labels", { type: "geojson", data: managedSiteTerritoryLabelFeatures() });
      state.map.addLayer({
        id: "directus-site-territory-labels",
        type: "symbol",
        source: "directus-site-territory-labels",
        minzoom: TERRITORY_LABEL_MIN_ZOOM,
        layout: {
          "text-field": ["get", "title"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 4, ["*", ["get", "label_size"], 0.82], 9, ["*", ["get", "label_size"], 1.02], 16, ["*", ["get", "label_size"], 1.32]],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "center",
          "text-variable-anchor": ["literal", ["center", "top", "bottom", "left", "right"]],
          "text-radial-offset": 0.75,
          "text-justify": "auto",
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-max-width": 8,
          "text-optional": true
        },
        paint: {
          "text-color": "#20251f",
          "text-halo-color": "rgba(255,255,255,0.9)",
          "text-halo-width": 1.28,
          "text-halo-blur": 0
        }
      });
      state.map.addSource("directus-site-labels", { type: "geojson", data: managedSiteDetailLabelFeatures() });
      state.map.addLayer({
        id: "directus-site-labels",
        type: "symbol",
        source: "directus-site-labels",
        minzoom: SITE_LABEL_MIN_ZOOM,
        layout: {
          "text-field": ["get", "title"],
          "text-size": ["interpolate", ["linear"], ["zoom"], SITE_LABEL_MIN_ZOOM, ["*", ["get", "label_size"], 0.9], 16, ["*", ["get", "label_size"], 1.32]],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "center",
          "text-variable-anchor": ["literal", ["center", "top", "bottom", "left", "right"]],
          "text-radial-offset": 0.75,
          "text-justify": "auto",
          "text-offset": ["case", ["==", ["get", "feature_category"], "territory"], ["literal", [0, -0.85]], ["literal", [0, 0.95]]],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-max-width": 8,
          "text-optional": true
        },
        paint: {
          "text-color": "#20251f",
          "text-halo-color": "rgba(255,255,255,0.9)",
          "text-halo-width": 1.28,
          "text-halo-blur": 0
        }
      });
      state.map.addLayer({
        id: "directus-site-point-labels",
        type: "symbol",
        source: "directus-site-geometries",
        filter: ["==", ["geometry-type"], "Point"],
        minzoom: SITE_POINT_LABEL_MIN_ZOOM,
        layout: {
          "text-field": ["get", "title"],
          "text-size": ["interpolate", ["linear"], ["zoom"], SITE_POINT_LABEL_MIN_ZOOM, 10.25, 17, 14],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "bottom",
          "text-variable-anchor": ["literal", ["bottom", "top", "left", "right"]],
          "text-radial-offset": 0.55,
          "text-justify": "auto",
          "text-offset": ["literal", [0, -1.45]],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-max-width": 9,
          "text-optional": true
        },
        paint: {
          "text-color": "#1f362a",
          "text-opacity": ["interpolate", ["linear"], ["zoom"], SITE_POINT_LABEL_MIN_ZOOM, 0, SITE_POINT_LABEL_MIN_ZOOM + 0.35, 1],
          "text-halo-color": "rgba(255,255,255,0.92)",
          "text-halo-width": 1.45,
          "text-halo-blur": 0
        }
      });
      state.map.addLayer({
        id: "site-attention-pulse-outer",
        type: "circle",
        source: "site-attention-points",
        filter: ["==", ["get", "attention_kind"], "urgent"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 24, 10, 34, 14, 50],
          "circle-color": "#d71920",
          "circle-opacity": 0.34,
          "circle-blur": 0.72,
          "circle-translate": [0, -8],
          "circle-stroke-opacity": 0
        }
      });
      state.map.addLayer({
        id: "site-attention-pulse-core",
        type: "circle",
        source: "site-attention-points",
        filter: ["==", ["get", "attention_kind"], "urgent"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 10, 10, 15, 14, 22],
          "circle-color": "#d71920",
          "circle-opacity": 0.38,
          "circle-blur": 0.32,
          "circle-translate": [0, -8],
          "circle-stroke-color": "rgba(255,255,255,0.75)",
          "circle-stroke-width": 1.2,
          "circle-stroke-opacity": 0.35
        }
      });
      state.map.addLayer({
        id: "site-attention-history-badge",
        type: "circle",
        source: "site-attention-points",
        filter: ["==", ["get", "attention_kind"], "on-this-day"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 9, 10, 13, 14, 17],
          "circle-color": "#fbf7e9",
          "circle-opacity": 0.98,
          "circle-translate": [0, -16],
          "circle-stroke-color": "#315c48",
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 7, 1.4, 12, 2],
          "circle-stroke-opacity": 0.92
        }
      });
      state.map.addLayer({
        id: "site-attention-history-icon",
        type: "symbol",
        source: "site-attention-points",
        filter: ["==", ["get", "attention_kind"], "on-this-day"],
        layout: {
          "text-field": "??",
          "text-size": ["interpolate", ["linear"], ["zoom"], 7, 14, 10, 18, 14, 23],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "center",
          "text-offset": ["literal", [0, -0.92]],
          "text-allow-overlap": true,
          "text-ignore-placement": true
        },
        paint: {
          "text-color": "#315c48",
          "text-halo-color": "rgba(255,255,255,0.88)",
          "text-halo-width": 0.7,
          "text-halo-blur": 0
        }
      });
      state.map.addLayer({
        id: "directus-site-points",
        type: "circle",
        source: "directus-site-geometries",
        filter: ["all", ["==", ["geometry-type"], "Point"], ["!=", ["get", "has_custom_icon"], true]],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 4.2, 12, 6.2, 15, 7.4],
          "circle-color": ["case", ["==", ["get", "has_header_image"], true], "#326fe3", "#496f5d"],
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 7, 1, 12, 1.5],
          "circle-stroke-color": "#fff",
          "circle-opacity": 0.92
        }
      });
      state.map.addSource("directus-site-icons", { type: "geojson", data: filterByCategory(customSiteIconFeatures()) });
      state.map.addLayer({
        id: "directus-site-icons",
        type: "symbol",
        source: "directus-site-icons",
        layout: {
          "icon-image": ["get", "icon_key"],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 7, 1.39, 12, 1.54],
          "icon-offset": ["literal", [0, 0]],
          "icon-allow-overlap": true,
          "icon-anchor": "center"
        }
      });
      state.map.addSource("learning-path-stops", { type: "geojson", data: guidedLearningPathStopFeatures() });
      state.map.addLayer({
        id: "learning-path-stop-halos",
        type: "circle",
        source: "learning-path-stops",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 13, 12, 18, 16, 23],
          "circle-color": ["case", ["==", ["get", "learning_path_stop_complete"], true], "#6b8e42", "#22392e"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2.5,
          "circle-opacity": 0.96
        }
      });
      state.map.addLayer({
        id: "learning-path-stop-numbers",
        type: "symbol",
        source: "learning-path-stops",
        layout: {
          "text-field": ["to-string", ["get", "learning_path_stop_number"]],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6, 12, 12, 15, 16, 17],
          "text-anchor": "center",
          "text-allow-overlap": true,
          "text-ignore-placement": true
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(0,0,0,0)",
          "text-halo-width": 0
        }
      });
      state.map.addLayer({
        id: "learning-path-stop-labels",
        type: "symbol",
        source: "learning-path-stops",
        minzoom: SITE_POINT_LABEL_MIN_ZOOM,
        layout: {
          "text-field": ["concat", ["to-string", ["get", "learning_path_stop_number"]], ". ", ["get", "title"]],
          "text-size": ["interpolate", ["linear"], ["zoom"], SITE_POINT_LABEL_MIN_ZOOM, 10.5, 16, 13],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "bottom",
          "text-variable-anchor": ["literal", ["bottom", "top", "left", "right"]],
          "text-radial-offset": 1.25,
          "text-justify": "auto",
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-max-width": 12,
          "text-optional": true
        },
        paint: {
          "text-color": "#19281f",
          "text-halo-color": "rgba(255,255,255,0.96)",
          "text-halo-width": 1.5,
          "text-halo-blur": 0
        }
      });
      state.map.addLayer({
        id: "wp-marker-labels",
        type: "symbol",
        source: "wp-markers-original",
        filter: ["==", ["geometry-type"], "Point"],
        minzoom: SITE_POINT_LABEL_MIN_ZOOM,
        layout: {
          "text-field": ["get", "title"],
          "text-size": ["interpolate", ["linear"], ["zoom"], SITE_POINT_LABEL_MIN_ZOOM, 10.25, 17, 14],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "bottom",
          "text-variable-anchor": ["literal", ["bottom", "top", "left", "right"]],
          "text-radial-offset": 0.55,
          "text-justify": "auto",
          "text-offset": ["literal", [0, -1.45]],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-max-width": 9,
          "text-optional": true
        },
        paint: {
          "text-color": "#34251a",
          "text-opacity": ["interpolate", ["linear"], ["zoom"], SITE_POINT_LABEL_MIN_ZOOM, 0, SITE_POINT_LABEL_MIN_ZOOM + 0.35, 1],
          "text-halo-color": "rgba(255,255,255,0.92)",
          "text-halo-width": 1.45,
          "text-halo-blur": 0
        }
      });

      resetBiographyPeopleProgressiveLoad(`mapbox:${leafletBiographyPeopleSignature()}`);
      state.map.addSource("biography-people", { type: "geojson", data: biographyPersonFeatureCollectionForRender() });
      state.map.addLayer({
        id: "biography-people",
        type: "symbol",
        source: "biography-people",
        filter: ["==", ["get", "kind"], "person"],
        minzoom: 6,
        layout: {
          "icon-image": BIOGRAPHY_PERSON_ICON_ID,
          "icon-size": ["interpolate", ["linear"], ["zoom"], 6, 0.72, 12, 0.96, 16, 1.08],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true
        },
        paint: {
          "icon-opacity": ["*", 0.94, ["coalesce", ["get", "motion_opacity"], 1]]
        }
      });
      state.map.addLayer({
        id: "biography-people-canoes",
        type: "symbol",
        source: "biography-people",
        filter: ["==", ["get", "kind"], "person"],
        minzoom: 6,
        layout: {
          "icon-image": BIOGRAPHY_CANOE_ICON_ID,
          "icon-size": ["interpolate", ["linear"], ["zoom"], 6, 0.28, 12, 0.36, 16, 0.44],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true
        },
        paint: {
          "icon-opacity": ["*", 0.9, ["coalesce", ["get", "motion_opacity"], 1], ["coalesce", ["get", "canoe_opacity"], 0]],
          "icon-translate": [0, 9]
        }
      });
      state.map.addLayer({
        id: "biography-photo-flash",
        type: "circle",
        source: "biography-people",
        filter: ["==", ["get", "photo_flash"], "true"],
        minzoom: 6,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 10, 12, 16, 16, 22],
          "circle-color": "#fff7cf",
          "circle-opacity": 0.72,
          "circle-stroke-color": "#f4b53f",
          "circle-stroke-opacity": 0.88,
          "circle-stroke-width": 2
        }
      });
      state.map.addLayer({
        id: "biography-people-quotes",
        type: "symbol",
        source: "biography-people",
        filter: ["all", ["==", ["get", "kind"], "person"], ["==", ["get", "has_quote"], "true"], ["==", ["get", "quote_visible"], "true"]],
        minzoom: BIOGRAPHY_PERSON_LABEL_MIN_ZOOM,
        layout: {
          "text-field": ["get", "quote_typed_label"],
          "text-size": ["interpolate", ["linear"], ["zoom"], BIOGRAPHY_PERSON_LABEL_MIN_ZOOM, 10.5, 17, 12.5],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Regular"],
          "text-anchor": "bottom",
          "text-offset": ["literal", [0, -3.65]],
          "text-max-width": 18,
          "text-line-height": 1.1,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-optional": true
        },
        paint: {
          "text-color": "#2f261c",
          "text-opacity": ["*", ["coalesce", ["get", "motion_opacity"], 1], ["coalesce", ["get", "quote_opacity"], 1], ["interpolate", ["linear"], ["zoom"], BIOGRAPHY_PERSON_LABEL_MIN_ZOOM, 0, BIOGRAPHY_PERSON_LABEL_MIN_ZOOM + 0.35, 1]],
          "text-halo-color": "rgba(255,252,244,0.98)",
          "text-halo-width": 4,
          "text-halo-blur": 0.35
        }
      });
      state.map.addLayer({
        id: "biography-people-labels",
        type: "symbol",
        source: "biography-people",
        filter: ["==", ["get", "kind"], "person"],
        minzoom: BIOGRAPHY_PERSON_LABEL_MIN_ZOOM,
        layout: {
          "text-field": ["coalesce", ["get", "map_travel_label"], ["get", "map_label"], ["get", "title"]],
          "text-size": ["interpolate", ["linear"], ["zoom"], BIOGRAPHY_PERSON_LABEL_MIN_ZOOM, 10.5, 17, 14],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-anchor": "bottom",
          "text-variable-anchor": ["literal", ["bottom", "top", "left", "right"]],
          "text-radial-offset": 0.55,
          "text-justify": "auto",
          "text-offset": ["literal", [0, -1.25]],
          "text-line-height": 1.08,
          "text-allow-overlap": false,
          "text-ignore-placement": true,
          "text-max-width": 15,
          "text-optional": true
        },
        paint: {
          "text-color": "#34251a",
          "text-opacity": ["*", ["coalesce", ["get", "motion_opacity"], 1], ["interpolate", ["linear"], ["zoom"], BIOGRAPHY_PERSON_LABEL_MIN_ZOOM, 0, BIOGRAPHY_PERSON_LABEL_MIN_ZOOM + 0.35, 1]],
          "text-halo-color": "rgba(255,255,255,0.94)",
          "text-halo-width": 1.5,
          "text-halo-blur": 0
        }
      });

      state.map.addSource("biography-place-paths", { type: "geojson", data: allBiographyPathFeatureCollection({ enabled: biographyPathsEnabled() }) });
      state.map.addLayer({
        id: "biography-path-line-casing",
        type: "line",
        source: "biography-place-paths",
        filter: ["==", ["get", "kind"], "path"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "rgba(255,255,255,0.92)",
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 4.2, 12, 6.5],
          "line-opacity": 0.82
        }
      });
      state.map.addLayer({
        id: "biography-path-lines",
        type: "line",
        source: "biography-place-paths",
        filter: ["==", ["get", "kind"], "path"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#59605c",
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.5, 12, 3.2],
          "line-opacity": 0.68,
          "line-dasharray": ["literal", [1.2, 1.2]]
        }
      });
      state.map.addLayer({
        id: "biography-path-points",
        type: "circle",
        source: "biography-place-paths",
        filter: ["==", ["get", "kind"], "point"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 4.5, 12, 7.5],
          "circle-color": "#59605c",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1.8,
          "circle-opacity": 0.92
        }
      });
      state.map.addLayer({
        id: "biography-path-point-numbers",
        type: "symbol",
        source: "biography-place-paths",
        filter: ["==", ["get", "kind"], "point"],
        layout: {
          "text-field": ["get", "label"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6, 8, 12, 10.5],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-allow-overlap": true,
          "text-ignore-placement": true
        },
        paint: {
          "text-color": "#fff",
          "text-halo-color": "rgba(42,47,44,0.8)",
          "text-halo-width": 0.6
        }
      });
      state.map.addLayer({
        id: "biography-path-labels",
        type: "symbol",
        source: "biography-place-paths",
        filter: ["==", ["get", "kind"], "label"],
        minzoom: 7.5,
        layout: {
          "text-field": ["get", "pin_label"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 7.5, 8, 13, 10.75],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-variable-anchor": ["literal", ["top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"]],
          "text-radial-offset": ["interpolate", ["linear"], ["zoom"], 7.5, 0.78, 13, 1.16],
          "text-justify": "auto",
          "text-max-width": 7,
          "text-padding": 4,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-optional": true
        },
        paint: {
          "text-color": "#3f4742",
          "text-halo-color": "rgba(255,255,255,0.94)",
          "text-halo-width": 1.25
        }
      });
      startBiographyPeopleAnimation();
      scheduleBiographyPeopleProgressiveLoad(progressiveBiographyPeopleSlugs());

      state.map.addSource("calendar-events", { type: "geojson", data: calendarEventFeatures() });
      state.map.addLayer({
        id: "calendar-event-polygons",
        type: "fill",
        source: "calendar-events",
        filter: ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]],
        paint: {
          "fill-color": ["get", "fillcolor"],
          "fill-opacity": ["coalesce", ["to-number", ["get", "opacity"]], 0.28]
        }
      });
      state.map.addLayer({
        id: "calendar-event-points",
        type: "circle",
        source: "calendar-events",
        filter: ["all", ["==", ["geometry-type"], "Point"], ["!", ["has", "icon_key"]]],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 8.4, 12, 13.2],
          "circle-color": ["get", "fillcolor"],
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
          "circle-opacity": 0.95
        }
      });
      state.map.addSource("calendar-event-icons", { type: "geojson", data: calendarEventIconFeatures() });
      state.map.addLayer({
        id: "calendar-event-icons",
        type: "symbol",
        source: "calendar-event-icons",
        layout: {
          "icon-image": ["get", "icon_key"],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 7, 1.06, 10, 1.24, 14, 1.38],
          "icon-offset": ["literal", [0, 0]],
          "icon-allow-overlap": true,
          "icon-anchor": "center"
        }
      });
      state.map.addSource("map-stories", { type: "geojson", data: mapStoryFeatures() });
      addMapStoryIcon();
      state.map.addLayer({
        id: "map-stories",
        type: "symbol",
        source: "map-stories",
        layout: {
          "icon-image": "story-bubble",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 7, 1.03, 12, 1.34],
          "icon-anchor": "bottom",
          "icon-offset": [
            "case",
            ["==", ["get", "story_nudge"], true],
            ["step", ["zoom"], ["literal", [0, -1.6]], 11, ["literal", [0, -1.1]], 13.5, ["literal", [0, -0.55]], 15, ["literal", [0, 0]]],
            ["literal", [0, 0]]
          ],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true
        }
      });
      state.map.addLayer({
        id: "map-story-labels",
        type: "symbol",
        source: "map-stories",
        layout: {
          "text-field": "",
          "text-size": 0,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-allow-overlap": false,
          "text-ignore-placement": false
        },
        paint: {
          "text-color": "#fff"
        }
      });
      state.map.addSource("hover-feature", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      state.map.addLayer({
        id: "hover-feature-fill",
        type: "fill",
        source: "hover-feature",
        filter: ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]],
        paint: {
          "fill-color": "#ffffff",
          "fill-opacity": 0.035
        }
      });
      state.map.addLayer({
        id: "hover-feature-line",
        type: "line",
        source: "hover-feature",
        filter: ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]],
        paint: {
          "line-color": "#1e2a21",
          "line-opacity": 0.96,
          "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.4, 12, 2.6],
          "line-dasharray": [2.2, 1.8]
        }
      });
      state.map.addLayer({
        id: "hover-feature-point",
        type: "circle",
        source: "hover-feature",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 12, 12, 18],
          "circle-color": "rgba(255,255,255,0)",
          "circle-stroke-color": "#1e2a21",
          "circle-stroke-opacity": 0.95,
          "circle-stroke-width": 2.5
        }
      });
      if (!state.archiveMapEventsBound) {
        state.archiveMapEventsBound = true;
        state.map.on("click", event => {
          if (handleSuggestionMapPickClick(event)) return;
          const markers = queryMarkerFeatures(event.point);
          if (markers.length) {
            handleFeatureClick(markers[0], "Map pin", event.originalEvent || event, event.lngLat || null);
            return;
          }
          const polygons = queryPolygonFeatures(event.point);
          if (polygons.length) {
            handleFeatureClick(bestPolygonFeature(polygons), "Territory / polygon", event.originalEvent || event, event.lngLat || null);
            return;
          }
          closeArticlePanel();
        });
        state.map.on("mousemove", event => {
          const now = performance.now();
          if (mapCameraIsInteracting() || now - state.lastHoverMove < 72) return;
          state.lastHoverMove = now;
          const layers = [
            "learning-path-stop-labels",
            "learning-path-stop-numbers",
            "learning-path-stop-halos",
            "site-attention-history-icon",
            "site-attention-history-badge",
            "biography-people-quotes",
            "biography-people-labels",
            "biography-people",
            "biography-place-labels",
            "biography-place-points",
            "biography-place-path",
            "biography-path-labels",
            "biography-path-point-numbers",
            "biography-path-points",
            "biography-path-lines",
            "calendar-event-icons",
            "calendar-event-points",
            "map-story-labels",
            "map-stories",
            "directus-site-icons",
            "wp-markers-original-icon",
            "wp-markers-original-dot",
            "directus-site-points",
            "calendar-event-polygons",
            "directus-site-polygons",
            "directus-site-territories",
            "place-name-area-label",
            "place-name-area-fill",
            "gardiners-montaukett-territory-fill",
            "wp-polygons-original-fill",
            "wp-polygons-detail-fill"
          ].filter(id => state.map.getLayer(id));
          const features = uniqueFeatures([
            ...state.map.queryRenderedFeatures(event.point, { layers }),
            ...queryPolygonFeatures(event.point, { includeScreenBounds: false, tolerance: 8 })
          ]).filter(feature => featureIsActiveAtPoint(feature, event.point));
          if (!features.length) {
            hoverPopup.remove();
            state.activeHoverFeatureKey = "";
            setHoverFeature(null);
            state.map.getCanvas().style.cursor = "";
            return;
          }
          const markerFeaturesUnderCursor = features.filter(item =>
            item.layer?.id === "learning-path-stop-labels" ||
            item.layer?.id === "learning-path-stop-numbers" ||
            item.layer?.id === "learning-path-stop-halos" ||
            item.layer?.id === "site-attention-history-icon" ||
            item.layer?.id === "site-attention-history-badge" ||
            item.layer?.id === "wp-markers-original-icon" ||
            item.layer?.id === "biography-people-quotes" ||
            item.layer?.id === "biography-people-labels" ||
            item.layer?.id === "biography-people" ||
            item.layer?.id === "biography-place-labels" ||
            item.layer?.id === "biography-place-points" ||
            item.layer?.id === "biography-place-path" ||
            item.layer?.id === "biography-path-labels" ||
            item.layer?.id === "biography-path-point-numbers" ||
            item.layer?.id === "biography-path-points" ||
            item.layer?.id === "biography-path-lines" ||
            item.layer?.id === "calendar-event-icons" ||
            item.layer?.id === "calendar-event-points" ||
            item.layer?.id === "map-story-labels" ||
            item.layer?.id === "map-stories" ||
            item.layer?.id === "directus-site-icons" ||
            item.layer?.id === "wp-markers-original-dot" ||
            item.layer?.id === "directus-site-points"
          );
          const polygonFeaturesUnderCursor = features.filter(item =>
            item.layer?.id === "calendar-event-polygons" || item.layer?.id === "place-name-area-label" || item.layer?.id === "place-name-area-fill" || item.layer?.id === "gardiners-montaukett-territory-fill" || item.layer?.id === "wp-polygons-original-fill" || item.layer?.id === "wp-polygons-detail-fill" || item.layer?.id === "directus-site-polygons" || item.layer?.id === "directus-site-territories"
          );
          const feature = markerFeaturesUnderCursor[0] || bestHoverPolygonFeature(polygonFeaturesUnderCursor) || features[0];
          state.map.getCanvas().style.cursor = "pointer";
          setHoverFeature(feature);
          if (suppressHoverPopupForFeature(feature)) {
            hoverPopup.remove();
            state.activeHoverFeatureKey = "";
            return;
          }
          const key = hoverFeatureKey(feature);
          hoverPopup.setLngLat(event.lngLat);
          if (state.activeHoverFeatureKey !== key) {
            state.activeHoverFeatureKey = key;
            hoverPopup.setHTML(hoverHtml(feature)).addTo(state.map);
          } else if (!hoverPopup.isOpen?.()) {
            hoverPopup.addTo(state.map);
          }
        });
        state.map.on("mouseleave", () => {
          hoverPopup.remove();
          state.activeHoverFeatureKey = "";
          setHoverFeature(null);
          state.map.getCanvas().style.cursor = "";
        });
        state.map.on("dragstart", () => {
          markUserMapInteraction({ force: true });
          hoverPopup.remove();
          state.activeHoverFeatureKey = "";
          setHoverFeature(null);
          state.map.getCanvas().style.cursor = "";
        });
        state.map.on("zoomstart", () => markUserMapInteraction({ preserveBiographyFollow: true }));
        state.map.on("zoomend", recenterFollowedBiographyCameraAfterZoom);
      }
      setPointerCursor(["learning-path-stop-labels", "learning-path-stop-numbers", "learning-path-stop-halos", "site-attention-history-icon", "site-attention-history-badge", "map-story-labels", "map-stories", "biography-people-quotes", "biography-people-labels", "biography-people", "biography-place-labels", "biography-place-points", "biography-place-path", "biography-path-labels", "biography-path-point-numbers", "biography-path-points", "biography-path-lines", "calendar-event-icons", "calendar-event-points", "calendar-event-polygons", "directus-site-icons", "directus-site-polygons", "directus-site-territories", "wp-markers-original-icon", "wp-markers-original-dot", "place-name-area-label", "place-name-area-fill", "gardiners-montaukett-territory-fill", "wp-polygons-original-fill", "wp-polygons-detail-fill"]);
      ensureWhalingWhaleMarker();
      ensureMovingDogMarker();
      applyLayerVisibility();
      promoteGuidedLearningPathLayers();
      startSiteAttentionPulse();
      loadMarkerIcons().then(() => {
        if (state.map?.getSource("wp-markers-icons")) {
          state.map.getSource("wp-markers-icons").setData(markerIconFeatures());
        }
        if (state.map?.getSource("directus-site-icons")) {
          state.map.getSource("directus-site-icons").setData(filterByCategory(customSiteIconFeatures()));
        }
        if (state.map?.getSource("directus-site-geometries")) {
          state.map.getSource("directus-site-geometries").setData(filteredManagedSiteFeatures());
        }
        if (state.map?.getSource("directus-site-labels")) {
          state.map.getSource("directus-site-labels").setData(managedSiteDetailLabelFeatures());
        }
        if (state.map?.getSource("directus-site-territory-labels")) {
          state.map.getSource("directus-site-territory-labels").setData(managedSiteTerritoryLabelFeatures());
        }
        if (state.map?.getSource("calendar-event-icons")) {
          state.map.getSource("calendar-event-icons").setData(calendarEventIconFeatures());
        }
        promoteActiveBiographyPathLayers();
      });
    }

    function setBasemap(value) {
      const next = BASEMAPS[value] ? value : "road";
      if (state.usingLeafletFallback) {
        setLeafletBasemap(next);
        return;
      }
      if (!state.map) return;
      state.basemap = next;
      basemapSelect.value = next;
      state.loadedMapIconKeys.clear();
      clearFeatureCache();
      hoverPopup.remove();
      state.activeHoverFeatureKey = "";
      const restoreArchiveLayers = () => {
        addArchiveLayers()
          .then(() => {
            applyLayerVisibility();
            refocusActiveMapContent();
          })
          .catch(error => {
            console.error("Could not restore archive layers after basemap change", error);
            showBanner("Map layers could not reload. Refresh the page and try again.");
          });
      };
      state.map.once("style.load", restoreArchiveLayers);
      state.map.setStyle(BASEMAPS[next], { diff: false });
    }

    function setLeafletBasemap(value) {
      if (!state.leafletMap || !window.L) return;
      const next = LEAFLET_BASEMAPS[value] !== undefined ? value : "road";
      state.basemap = next;
      basemapSelect.value = next;
      if (state.leafletBaseLayer) {
        state.leafletMap.removeLayer(state.leafletBaseLayer);
        state.leafletBaseLayer = null;
      }
      const base = LEAFLET_BASEMAPS[next];
      if (base?.url) {
        state.leafletBaseLayer = L.tileLayer(base.url, {
          updateWhenIdle: false,
          updateWhenZooming: true,
          updateInterval: 180,
          keepBuffer: 2,
          ...(base.options || {})
        }).addTo(state.leafletMap);
        state.leafletBaseLayer.bringToBack?.();
      }
      renderLeafletArchiveLayers({ viewportOnly: true, viewportPad: 0.42, pointLimit: LEAFLET_VIEWPORT_POINT_LIMIT });
    }


    function setPointerCursor(layerIds) {
      MAP_UTILS.bindPointerCursor(state.map, state.archiveLayerHandlers, layerIds);
    }

    function updateSiteAttentionPulse() {
      if (!state.map || state.usingLeafletFallback) return;
      if (document.hidden || mapCameraIsInteracting()) return;
      if (!state.map.getLayer("site-attention-pulse-outer") || !state.map.getLayer("site-attention-pulse-core")) return;
      const elapsed = Date.now() - (state.siteAttentionPulseStartedAt || Date.now());
      const phase = (elapsed % 1800) / 1800;
      const wave = (Math.sin(phase * Math.PI * 2) + 1) / 2;
      state.map.setPaintProperty("site-attention-pulse-outer", "circle-radius", ["interpolate", ["linear"], ["zoom"], 7, 24 + wave * 10, 10, 34 + wave * 14, 14, 50 + wave * 18]);
      state.map.setPaintProperty("site-attention-pulse-outer", "circle-opacity", 0.2 + (1 - wave) * 0.3);
      state.map.setPaintProperty("site-attention-pulse-core", "circle-radius", ["interpolate", ["linear"], ["zoom"], 7, 10 + wave * 4, 10, 15 + wave * 5, 14, 22 + wave * 7]);
      state.map.setPaintProperty("site-attention-pulse-core", "circle-opacity", 0.26 + wave * 0.34);
    }

    function startSiteAttentionPulse() {
      if (!state.map || state.usingLeafletFallback || state.siteAttentionPulseTimer) return;
      state.siteAttentionPulseStartedAt = Date.now();
      updateSiteAttentionPulse();
      state.siteAttentionPulseTimer = window.setInterval(updateSiteAttentionPulse, 180);
    }

    function mapCameraIsInteracting() {
      if (!state.map) return false;
      return Boolean(
        state.map.isMoving?.() ||
        state.map.isZooming?.() ||
        state.map.isRotating?.() ||
        state.map.isEasing?.()
      );
    }

    function applyLayerVisibility() {
      if (!state.map || state.usingLeafletFallback) {
        renderLeafletArchiveLayers({ viewportOnly: true, viewportPad: 0.42, pointLimit: LEAFLET_VIEWPORT_POINT_LIMIT });
        syncLeafletGuidedLearningPathLayer();
        return;
      }
      if (!state.map.isStyleLoaded?.()) return;
      clearFeatureCache();
      const exhibitsOn = !exhibitToggle || exhibitToggle.checked !== false;
      const markerVisibility = markerToggle?.checked === false && !exhibitsOn ? "none" : "visible";
      const polygonVisibility = polygonToggle?.checked === false && !exhibitsOn ? "none" : "visible";
      const exhibitVisibility = exhibitToggle?.checked === false ? "none" : "visible";
      MAP_UTILS.setGeoJsonSourceDataMany(state.map, [
        ["wp-polygons-original", filteredPolygonFeatures()],
        ["place-name-areas", filteredPlaceNameAreaFeatures()],
        ["place-name-area-labels", placeNameAreaLabelFeatures()],
        ["gardiners-montaukett-territory", gardinersMontaukettOverlayFeatures()],
        ["wp-polygons-territory-labels", polygonLabelFeatures("territory")],
        ["wp-polygons-detail-labels", polygonLabelFeatures("detail")],
        ["wp-markers-original", filteredMarkerFeatures()],
        ["wp-markers-icons", markerIconFeatures()],
        ["site-attention-points", filterByCategory(siteAttentionFeatures())],
        ["directus-site-geometries", filteredManagedSiteFeatures()],
        ["directus-site-labels", managedSiteDetailLabelFeatures()],
        ["directus-site-territory-labels", managedSiteTerritoryLabelFeatures()],
        ["directus-site-icons", filterByCategory(customSiteIconFeatures())],
        ["learning-path-stops", guidedLearningPathStopFeatures()],
        ["biography-people", biographyPersonFeatureCollection()],
        ["biography-place-paths", allBiographyPathFeatureCollection({ enabled: biographyPathsEnabled() })]
      ]);
      const biographyPathVisibility = biographyPathsEnabled() ? "visible" : "none";
      const guidedPathVisibility = activeGuidedLearningPath() ? "visible" : "none";
      MAP_UTILS.setLayerVisibilityMany(state.map, ["wp-markers-original-dot", "wp-markers-original-icon", "wp-marker-labels", "directus-site-points", "directus-site-icons", "directus-site-point-labels"], markerVisibility);
      MAP_UTILS.setLayerVisibilityMany(state.map, ["learning-path-stop-halos", "learning-path-stop-numbers", "learning-path-stop-labels"], guidedPathVisibility);
      MAP_UTILS.setLayerVisibilityMany(state.map, ["site-attention-pulse-outer", "site-attention-pulse-core"], markerVisibility);
      MAP_UTILS.setLayerVisibilityMany(state.map, ["site-attention-history-badge", "site-attention-history-icon"], markerVisibility);
      MAP_UTILS.setLayerVisibilityMany(state.map, ["calendar-event-icons", "calendar-event-points"], exhibitVisibility);
      MAP_UTILS.setLayerVisibilityMany(state.map, ["biography-path-line-casing", "biography-path-lines", "biography-path-points", "biography-path-point-numbers", "biography-path-labels"], biographyPathVisibility);
      MAP_UTILS.setLayerVisibilityMany(state.map, ["place-name-area-fill", "place-name-area-line", "place-name-area-label", "gardiners-montaukett-territory-fill", "wp-polygons-original-fill", "wp-polygons-detail-fill", "wp-polygons-original-line", "wp-polygons-territory-label", "wp-polygons-detail-label", "directus-site-territories", "directus-site-polygons", "directus-site-territory-labels", "directus-site-labels"], polygonVisibility);
      MAP_UTILS.setLayerVisibilityMany(state.map, ["calendar-event-polygons"], exhibitVisibility);
      MAP_UTILS.setLayerVisibilityMany(state.map, ["hover-feature-fill", "hover-feature-line"], polygonVisibility);
      MAP_UTILS.setLayerVisibilityMany(state.map, ["hover-feature-point"], markerVisibility);
      promoteGuidedLearningPathLayers();
    }

    function syncFilteredViews(options = {}) {
      clearFeatureCache();
      applyLayerVisibility();
      renderSiteListIfActive();
      if (options.timeline) renderTimelineDock();
    }

    function renderSuggestions() {
      const query = searchEl.value.trim().toLowerCase();
      suggestionsEl.innerHTML = "";
      if (!query) {
        suggestionsEl.classList.remove("show");
        return;
      }
      const localMatches = (state.searchIndex || [])
        .map(result => ({ ...result, score: searchScore(result, query) }))
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
        .slice(0, 10);
      const localKeys = new Set(localMatches.map(searchResultKey));
      const deepMatches = state.deepSearchResults
        .filter(result => result.query === query && !localKeys.has(searchResultKey(result)))
        .slice(0, 6);
      const matches = [...localMatches, ...deepMatches].slice(0, 14);
      const addressMatches = state.addressResults.filter(result => result.query === query).slice(0, 5);
      const addressLike = isAddressLikeSearchQuery(searchEl.value);
      const didYouMean = addressLike ? null : didYouMeanSearchResult(query, matches);
      if (!matches.length && !addressMatches.length && !didYouMean && !state.deepSearchLoading) {
        suggestionsEl.classList.remove("show");
        return;
      }
      const fragment = document.createDocumentFragment();
      for (const result of addressMatches.slice(0, 1)) {
        const button = document.createElement("button");
        button.className = "suggestion";
        button.type = "button";
        button.textContent = `${result.label || "Map search"}: ${result.title}`;
        button.addEventListener("click", () => selectAddressResult(result));
        fragment.appendChild(button);
      }
      if (didYouMean) {
        const button = document.createElement("button");
        button.className = "suggestion suggestion-correction";
        button.type = "button";
        button.textContent = `Did you mean: ${didYouMean.title}`;
        button.addEventListener("click", () => {
          searchEl.value = didYouMean.title;
          handleSearchInput();
          searchEl.focus();
        });
        fragment.appendChild(button);
      }
      for (const result of matches) {
        const button = document.createElement("button");
        button.className = "suggestion";
        button.type = "button";
        button.textContent = `${result.label}: ${result.title}`;
        button.addEventListener("click", () => {
          if (result.type === "listing") openListing(result.item, { source: "Search result" });
          else if (result.type === "wiki") openWikiArticle(result.item, { source: "Search result" });
          else if (result.type === "blog") openBlogPost(result.item, { source: "Search result" });
          else if (result.type === "event") openCalendarEvent(result.item);
          else openSiteContent(result.item, { source: result.label });
          suggestionsEl.classList.remove("show");
          const lng = Number(result.item.longitude);
          const lat = Number(result.item.latitude);
          if (result.type === "listing" && isLongIslandCoordinate(lng, lat) && state.map?.easeTo) {
            state.map.easeTo({ center: [lng, lat], zoom: 11, duration: 700 });
          }
        });
        fragment.appendChild(button);
      }
      if (state.deepSearchLoading) {
        const loading = document.createElement("div");
        loading.className = "suggestion suggestion-status";
        loading.textContent = "Searching full article text...";
        fragment.appendChild(loading);
      }
      suggestionsEl.appendChild(fragment);
      suggestionsEl.classList.add("show");
    }

    function closeSuggestions() {
      state.addressSearchToken++;
      state.deepSearchToken++;
      window.clearTimeout(state.searchTimer);
      window.clearTimeout(state.deepSearchTimer);
      state.deepSearchLoading = false;
      suggestionsEl.innerHTML = "";
      suggestionsEl.classList.remove("show");
    }

    function searchResultKey(result) {
      return `${result.type}:${result.item?.slug || result.item?.id || result.title}`;
    }

    function selectAddressResult(result) {
      suggestionsEl.classList.remove("show");
      searchEl.value = result.title;
      showAddressMarker(result);
      if (!state.map && state.leafletMap && result.center) {
        const target = [result.center[1], result.center[0]];
        if (result.bbox && state.leafletMap.fitBounds) {
          state.leafletMap.fitBounds([[result.bbox[1], result.bbox[0]], [result.bbox[3], result.bbox[2]]], { padding: [34, 34], maxZoom: 13 });
        } else if (state.leafletMap.flyTo) {
          state.leafletMap.flyTo(target, 13);
        } else {
          state.leafletMap.setView(target, 13);
        }
        closeArticlePanel();
        return;
      }
      if (!state.map) {
        closeArticlePanel();
        return;
      }
      if (result.bbox && state.map.fitBounds) {
        state.map.fitBounds([[result.bbox[0], result.bbox[1]], [result.bbox[2], result.bbox[3]]], {
          padding: focusPadding(),
          maxZoom: 13,
          duration: 700
        });
      } else if (state.map.easeTo) {
        state.map.easeTo({ center: result.center, zoom: 13, padding: focusPadding(), duration: 700 });
      }
      closeArticlePanel();
    }

    function showAddressMarker(result) {
      const center = Array.isArray(result) ? result : result?.center;
      if (!Array.isArray(center)) return;
      if (state.addressMarker) state.addressMarker.remove();
      if (state.addressPopup) state.addressPopup.remove();
      const territoryLine = searchedLocationTerritoryHtml(center);
      if (!state.map && state.leafletMap && window.L) {
        const title = escapeHtml(result?.title || "Searched location");
        state.addressMarker = L.marker([center[1], center[0]], { title: "Your search result" })
          .bindPopup(`<div class="address-popup"><strong>Your search result</strong><span>${title}</span>${territoryLine}</div>`)
          .addTo(state.leafletMap);
        state.addressMarker.openPopup();
        return;
      }
      if (!state.map) return;
      const element = document.createElement("div");
      element.className = "address-marker";
      element.tabIndex = 0;
      element.title = "Your search result";
      const title = escapeHtml(result?.title || "Searched location");
      const popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: false, offset: 18 })
        .setHTML(`
          <div class="address-popup">
            <strong>Your search result</strong>
            <span>${title}</span>
            ${territoryLine}
            <button type="button" data-clear-address-marker>Clear result</button>
          </div>
        `);
      state.addressMarker = new mapboxgl.Marker({ element, anchor: "bottom" })
        .setLngLat(center)
        .setPopup(popup)
        .addTo(state.map);
      state.addressPopup = popup;
      const openPopup = () => {
        if (!popup.isOpen()) state.addressMarker?.togglePopup();
      };
      element.addEventListener("mouseenter", openPopup);
      element.addEventListener("click", openPopup);
      element.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPopup();
        }
      });
      openPopup();
    }

    function clearAddressMarker() {
      state.addressPopup?.remove();
      state.addressMarker?.remove();
      state.addressPopup = null;
      state.addressMarker = null;
    }

    function normalizeMapSearchQuery(query) {
      return String(query || "")
        .replace(/\bstonybrook\b/ig, "stony brook")
        .replace(/\s+/g, " ")
        .trim();
    }

    function mapSearchAccessToken() {
      return window.mapboxgl?.accessToken
        || findLayer("native-long-island-base-map")?.style_json?.publicToken
        || "";
    }

    function isAddressLikeSearchQuery(query) {
      const text = String(query || "").trim();
      if (text.length < 3) return false;
      return /\d/.test(text)
        || /\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|ct|court|pl|place|blvd|boulevard|hwy|highway|pkwy|parkway|way|trail|turnpike|route)\b/i.test(text)
        || /\b(ny|new york|long island|nassau|suffolk|brooklyn|queens|bronx|manhattan)\b/i.test(text)
        || /,/.test(text);
    }

    function placeSuggestionScore(suggestion, query) {
      return MAP_UTILS.scorePlaceSuggestion(suggestion, query, { normalizeText: normalizeComparisonText });
    }

    function geocodeFeatureScore(feature, query) {
      const type = String(feature?.place_type?.[0] || "").toLowerCase();
      const title = normalizeComparisonText(feature?.text || feature?.place_name || "");
      const full = normalizeComparisonText(feature?.place_name || "");
      const queryKey = normalizeComparisonText(query);
      const queryTerms = queryKey.split(" ").filter(Boolean);
      let score = numeric(feature?.relevance, 0) * 100;
      if (type === "poi") score += 70;
      if (type === "address") score += 8;
      if (type === "street") score -= 45;
      if (title === queryKey) score += 60;
      if (title.startsWith(queryKey)) score += 28;
      queryTerms.forEach(term => {
        if (title.includes(term)) score += 10;
        else if (full.includes(term)) score += 4;
        else score -= 8;
      });
      if (title === "long island" && queryTerms.length > 1) score -= 80;
      return score;
    }

    async function searchboxMapPlace(query, tokenValue, bbox) {
      const sessionToken = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const suggestUrl = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${encodeURIComponent(tokenValue)}&session_token=${encodeURIComponent(sessionToken)}&limit=6&bbox=${bbox}&proximity=-73.1,40.85`;
      const response = await fetch(suggestUrl);
      if (!response.ok) return [];
      const data = await response.json();
      const suggestions = (Array.isArray(data.suggestions) ? data.suggestions : [])
        .filter(item => item?.mapbox_id)
        .map(item => ({ item, score: placeSuggestionScore(item, query) }))
        .filter(entry => entry.score > -100)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      const results = [];
      for (const entry of suggestions) {
        const retrieveUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(entry.item.mapbox_id)}?access_token=${encodeURIComponent(tokenValue)}&session_token=${encodeURIComponent(sessionToken)}`;
        const retrieveResponse = await fetch(retrieveUrl);
        if (!retrieveResponse.ok) continue;
        const retrieveData = await retrieveResponse.json();
        const feature = (retrieveData.features || [])[0];
        const center = feature?.geometry?.coordinates;
        if (!Array.isArray(center) || !isLongIslandCoordinate(center[0], center[1])) continue;
        const props = feature.properties || {};
        const isPoi = props.feature_type === "poi" || entry.item.feature_type === "poi";
        const name = props.name || entry.item.name || "Search result";
        const address = props.full_address || entry.item.full_address || props.place_formatted || entry.item.place_formatted || "";
        results.push({
          title: address ? `${name}, ${address}` : name,
          center,
          bbox: null,
          label: isPoi ? "Map place" : "Map search",
          score: entry.score
        });
      }
      return results;
    }

    async function geocodeMapPlace(query, tokenValue, bbox) {
      const geocodeQuery = /\b(new york|ny|long island|nassau|suffolk|brooklyn|queens)\b/i.test(query)
        ? query
        : `${query} Long Island NY`;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(geocodeQuery)}.json?access_token=${encodeURIComponent(tokenValue)}&autocomplete=true&limit=5&types=poi,address,place,locality,neighborhood&bbox=${bbox}&proximity=-73.1,40.85`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.features || [])
        .filter(feature => numeric(feature.relevance, 1) >= 0.5)
        .filter(feature => Array.isArray(feature.center) && isLongIslandCoordinate(feature.center[0], feature.center[1]))
        .map(feature => ({
          title: feature.place_name,
          center: feature.center,
          bbox: feature.bbox || null,
          label: String(feature.place_type?.[0] || "").toLowerCase() === "poi" ? "Map place" : "Map search",
          score: geocodeFeatureScore(feature, query)
        }))
        .filter(result => result.score > 15)
        .sort((a, b) => b.score - a.score);
    }

    async function updateAddressSuggestions() {
      const rawQuery = searchEl.value.trim();
      const query = rawQuery.toLowerCase();
      const token = ++state.addressSearchToken;
      const tokenValue = mapSearchAccessToken();
      if (rawQuery.length < 3 || !tokenValue) {
        state.addressResults = [];
        renderSuggestions();
        return [];
      }
      try {
        const bbox = LONG_ISLAND_BOUNDS.flat().join(",");
        const normalizedQuery = normalizeMapSearchQuery(rawQuery);
        const searchboxResults = await searchboxMapPlace(normalizedQuery, tokenValue, bbox);
        if (token !== state.addressSearchToken) return;
        const geocodeResults = searchboxResults.length ? [] : await geocodeMapPlace(normalizedQuery, tokenValue, bbox);
        if (token !== state.addressSearchToken) return;
        const seen = new Set();
        state.addressResults = [...searchboxResults, ...geocodeResults]
          .sort((a, b) => b.score - a.score)
          .filter(result => {
            const key = `${normalizeComparisonText(result.title)}:${result.center?.join(",")}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .slice(0, 5)
          .map(result => ({ ...result, query }));
        renderSuggestions();
        return state.addressResults;
      } catch {
        if (token === state.addressSearchToken) state.addressResults = [];
      }
      return [];
    }

    function deepSearchFilter(query, fields) {
      const encoded = encodeURIComponent(query);
      return fields.map(field => `filter[_or][][${field}][_contains]=${encoded}`).join("&");
    }

    function localDeepSearchSuggestions(rawQuery) {
      const query = String(rawQuery || "").trim().toLowerCase();
      const rank = result => ({ ...result, score: searchScore(result, query) });
      const keep = result => result.score > 0;
      const byScore = (a, b) => b.score - a.score || String(a.title || "").localeCompare(String(b.title || ""));
      const limits = new Map([["listing", 8], ["wiki", 8], ["blog", 4], ["page", 4], ["post", 4]]);
      const labels = new Map([["listing", "Full text listing"], ["wiki", "Full text knowledgebase"], ["blog", "Full text blog"], ["page", "Full text page"], ["post", "Full text page"]]);
      const counts = new Map();
      return (state.searchIndex || [])
        .map(rank)
        .filter(keep)
        .sort(byScore)
        .filter(result => {
          const limit = limits.get(result.type);
          if (!limit) return false;
          const count = counts.get(result.type) || 0;
          if (count >= limit) return false;
          counts.set(result.type, count + 1);
          return true;
        })
        .map(({ score, label, ...result }) => ({ ...result, query, label: labels.get(result.type) || label || "Full text result" }));
    }

    async function updateDeepSearchSuggestions() {
      const rawQuery = searchEl.value.trim();
      const query = rawQuery.toLowerCase();
      const token = ++state.deepSearchToken;
      state.deepSearchResults = state.deepSearchResults.filter(result => result.query === query);
      if (rawQuery.length < 4) {
        state.deepSearchLoading = false;
        renderSuggestions();
        return;
      }
      state.deepSearchLoading = true;
      renderSuggestions();
      try {
        if (fullArchiveDataLoaded) {
          state.deepSearchResults = localDeepSearchSuggestions(rawQuery);
          return;
        }
        const siteDeepFields = [
          "title", "summary", "why_this_matters", "introduction_content", "history_content",
          "oral_history_content", "translation_content", "preservation_content", "colonial_description_content",
          "land_loss_content", "artifacts_content", "excavation_content", "vandalism_content",
          "whereintheworld_content", "known_plant_species", "ancestral_territory", "ancestral_territory_note"
        ];
        const [sites, wiki, blog, pages] = await Promise.all([
          fetchJson(`/items/sites?limit=8&filter[publication_status][_eq]=published&${deepSearchFilter(rawQuery, siteDeepFields)}`),
          fetchJson(`/items/wiki_articles?limit=8&filter[status][_eq]=published&${deepSearchFilter(rawQuery, ["title", "summary", "content", "why_this_matters"])}`),
          fetchJson(`/items/blog_posts?limit=4&${deepSearchFilter(rawQuery, ["title", "summary", "content"])}`),
          fetchJson(`/items/site_content?limit=4&${deepSearchFilter(rawQuery, ["title", "summary", "content"])}`)
        ]);
        if (token !== state.deepSearchToken) return;
        state.deepSearchResults = [
          ...(sites.data || []).map(item => ({ query, type: "listing", label: "Full text listing", title: item.title, summary: item.summary, item: replaceCachedItem("sites", "siteById", "siteBySlug", item) })),
          ...(wiki.data || []).map(item => {
            const cleanItem = sanitizePublicWikiArticle(item);
            return { query, type: "wiki", label: "Full text knowledgebase", title: cleanItem.title, summary: cleanItem.summary, item: replaceCachedItem("wikiArticles", null, "wikiBySlug", cleanItem) };
          }),
          ...(blog.data || []).map(item => ({ query, type: "blog", label: "Full text blog", title: item.title, summary: item.summary, item: replaceCachedItem("blogPosts", null, "blogBySlug", item) })),
          ...(pages.data || []).map(item => ({ query, type: item.content_type || "page", label: "Full text page", title: item.title, summary: item.summary, item: replaceCachedItem("siteContent", null, "contentBySlug", item) }))
        ];
      } catch {
        if (token === state.deepSearchToken) state.deepSearchResults = [];
      } finally {
        if (token === state.deepSearchToken) {
          state.deepSearchLoading = false;
          renderSuggestions();
        }
      }
    }

    function handleSearchInput() {
      document.querySelectorAll(".layer-menu[open], .more-menu[open]").forEach(menu => menu.removeAttribute("open"));
      if (!searchEl.value.trim()) {
        state.addressSearchToken++;
        state.deepSearchToken++;
        state.addressResults = [];
        state.deepSearchResults = [];
        state.deepSearchLoading = false;
        clearAddressMarker();
        window.clearTimeout(state.searchTimer);
        window.clearTimeout(state.deepSearchTimer);
        renderSuggestions();
        return;
      }
      window.clearTimeout(state.searchTimer);
      if (isAddressLikeSearchQuery(searchEl.value)) {
        state.searchTimer = window.setTimeout(updateAddressSuggestions, 220);
      } else {
        state.addressSearchToken++;
        state.addressResults = [];
      }
      renderSuggestions();
      window.clearTimeout(state.deepSearchTimer);
      state.deepSearchTimer = window.setTimeout(updateDeepSearchSuggestions, 420);
    }

    async function handleSearchKeydown(event) {
      if (event.key !== "Enter") return;
      const query = searchEl.value.trim();
      if (!query) return;
      event.preventDefault();
      window.clearTimeout(state.searchTimer);
      window.clearTimeout(state.deepSearchTimer);
      state.deepSearchLoading = false;
      if (isAddressLikeSearchQuery(query)) {
        const normalizedQuery = query.toLowerCase();
        let addressResult = state.addressResults.find(result => result.query === normalizedQuery);
        if (!addressResult) {
          const results = await updateAddressSuggestions();
          addressResult = (results || []).find(result => result.query === normalizedQuery) || (results || [])[0];
        }
        if (addressResult) {
          selectAddressResult(addressResult);
          return;
        }
      }
      try {
        await Promise.all([
          requestFullArchiveData("search-enter"),
          ensureSiteSearchData()
        ]);
      } catch (error) {
        console.warn("Full search content will load later.", error);
      }
      openSearchResultsPanel(query);
    }

    function searchScore(result, query) {
      const queryKey = normalizeComparisonText(query);
      const terms = queryKey.split(" ").filter(term => term.length >= 2);
      const title = result.searchTitleKey || normalizeComparisonText(result.title || "");
      const summary = result.searchSummaryKey || normalizeComparisonText(result.summary || "");
      const body = result.searchBodyKey || normalizeComparisonText(result.body || "");
      let score = 0;
      if (title === queryKey) score += 1000;
      if (title.startsWith(queryKey)) score += 500;
      if (title.includes(queryKey)) score += 250;
      if (terms.length > 1 && terms.every(term => title.includes(term))) score += 210;
      if (summary.includes(queryKey)) score += 90;
      if (terms.length > 1 && terms.every(term => summary.includes(term))) score += 70;
      if (body.includes(queryKey)) score += 55;
      if (terms.length > 1 && terms.every(term => body.includes(term))) score += 45;
      if (!score) return 0;
      if (result.type === "page") score += 40;
      if (result.type === "blog") score += 35;
      if (result.type === "wiki") score += 30;
      return score;
    }

    function editDistanceWithin(left, right, maxDistance = 3) {
      left = normalizeComparisonText(left);
      right = normalizeComparisonText(right);
      if (!left || !right) return maxDistance + 1;
      if (left === right) return 0;
      if (Math.abs(left.length - right.length) > maxDistance) return maxDistance + 1;
      const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
      for (let i = 1; i <= left.length; i += 1) {
        const current = [i];
        let rowMin = current[0];
        for (let j = 1; j <= right.length; j += 1) {
          const cost = left[i - 1] === right[j - 1] ? 0 : 1;
          const value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
          current[j] = value;
          rowMin = Math.min(rowMin, value);
        }
        if (rowMin > maxDistance) return maxDistance + 1;
        for (let j = 0; j < current.length; j += 1) previous[j] = current[j];
      }
      return previous[right.length];
    }

    function didYouMeanSearchResult(query, matches = []) {
      const queryKey = normalizeComparisonText(query);
      if (queryKey.length < 3) return null;
      if (matches.some(result => normalizeComparisonText(result.title || "") === queryKey || normalizeComparisonText(result.title || "").startsWith(queryKey))) return null;
      const candidates = [];
      for (const result of state.searchIndex || []) {
        const title = String(result.title || "").trim();
        if (!title) continue;
        const keys = new Set([
          title,
          String(result.item?.slug || "").replace(/-/g, " "),
          ...title.split(/\s+/).filter(word => word.length >= 4),
          ...String(result.item?.slug || "").split(/[-_\s]+/).filter(word => word.length >= 4)
        ].map(value => normalizeComparisonText(value)).filter(value => value.length >= 3));
        let best = Infinity;
        keys.forEach(key => {
          if (key === queryKey) best = Math.min(best, 0);
          else if (key.startsWith(queryKey) || queryKey.startsWith(key)) best = Math.min(best, Math.abs(key.length - queryKey.length) <= 3 ? 1 : 2);
          else if (Math.abs(key.length - queryKey.length) <= 3) best = Math.min(best, editDistanceWithin(queryKey, key, 3));
        });
        if (best <= Math.max(1, Math.floor(queryKey.length / 4))) candidates.push({ result, title, score: best });
      }
      candidates.sort((a, b) => a.score - b.score || String(a.title).localeCompare(String(b.title)));
      return candidates[0]?.result || null;
    }

    function categoryItems(category) {
      if (!category) return [];
      const rawEntries = category.entries || (category.slugs || []).map(slug => ["wiki", slug]);
      return rawEntries
        .map(([type, slug]) => {
          const item = type === "site" ? state.siteBySlug.get(slug) : state.wikiBySlug.get(slug);
          return item ? { type, item } : null;
        })
        .filter(Boolean);
    }

    function openMediaViewer(image) {
      const src = image.currentSrc || image.src;
      const title = image.getAttribute("alt") || image.getAttribute("title") || "Image detail";
      mediaImageEl.src = src;
      mediaImageEl.alt = title;
      mediaLightboxEl.classList.add("open");
    }

    function setRoute(params) {
      const url = new URL(window.location.href);
      url.search = "";
      if (adminMode) url.searchParams.set("admin", "1");
      for (const [key, value] of Object.entries(params)) {
        if (value) url.searchParams.set(key, value);
      }
      window.history.replaceState(null, "", url);
    }

    function focusGeometry(geometry, zoom = 11, options = {}) {
      if (!options.preserveBiographyFollow) stopBiographyPersonFollow();
      const duration = Number.isFinite(Number(options.duration)) ? Number(options.duration) : 520;
      const essential = options.essential !== false;
      const currentZoom = Number(state.map?.getZoom?.() ?? state.leafletMap?.getZoom?.() ?? 0);
      const requestedZoom = Number.isFinite(Number(options.zoom)) ? Number(options.zoom) : zoom;
      const pointZoom = Math.max(requestedZoom, Number.isFinite(currentZoom) ? Math.min(currentZoom, 16) : 0);
      const optionCenter = Array.isArray(options.center)
        ? options.center
        : options.center && Number.isFinite(Number(options.center.lng)) && Number.isFinite(Number(options.center.lat))
          ? [Number(options.center.lng), Number(options.center.lat)]
          : null;
      markMapAutoMove(duration);
      if (state.leafletMap && geometry) {
        const bounds = geometryBounds(geometry);
        if (bounds && geometry.type !== "Point") {
          const center = optionCenter || siteCenter(geometry);
          if (options.localPolygonFocus && center) {
            const target = leafletVisibleCenterLatLng(center, pointZoom);
            if (state.leafletMap.flyTo) state.leafletMap.flyTo(target, pointZoom, { duration: duration / 1000 });
            else state.leafletMap.setView(target, pointZoom);
            return;
          }
          if (center && Number.isFinite(currentZoom) && currentZoom >= 12) {
            const target = leafletVisibleCenterLatLng(center, pointZoom);
            if (state.leafletMap.flyTo) state.leafletMap.flyTo(target, pointZoom, { duration: duration / 1000 });
            else state.leafletMap.setView(target, pointZoom);
            return;
          }
          const leafletBounds = [[bounds[0][1], bounds[0][0]], [bounds[1][1], bounds[1][0]]];
          const fitOptions = leafletFocusFitOptions(zoom, duration);
          if (state.leafletMap.flyToBounds) state.leafletMap.flyToBounds(leafletBounds, fitOptions);
          else state.leafletMap.fitBounds(leafletBounds, fitOptions);
          return;
        }
        const center = siteCenter(geometry);
        if (center) {
          const target = leafletVisibleCenterLatLng(center, pointZoom);
          if (state.leafletMap.flyTo) state.leafletMap.flyTo(target, pointZoom, { duration: duration / 1000 });
          else state.leafletMap.setView(target, pointZoom);
        }
        return;
      }
      if (!state.map || !geometry) return;
      const bounds = geometryBounds(geometry);
      if (bounds && geometry.type !== "Point") {
        const center = optionCenter || siteCenter(geometry);
        if (options.localPolygonFocus && center) {
          state.map.easeTo({ center, zoom: pointZoom, padding: focusPadding(), duration, essential });
          return;
        }
        if (center && Number.isFinite(currentZoom) && currentZoom >= 12) {
          state.map.easeTo({ center, zoom: pointZoom, padding: focusPadding(), duration, essential });
          return;
        }
        state.map.fitBounds(bounds, { padding: focusPadding(), maxZoom: zoom, duration, essential });
        return;
      }
      const center = siteCenter(geometry);
      if (center) state.map.easeTo({ center, zoom: pointZoom, padding: focusPadding(), duration, essential });
    }

    function focusFeature(feature, options = {}) {
      if (!options.preserveBiographyFollow) stopBiographyPersonFollow();
      markMapAutoMove(options.duration ?? 700);
      if (state.leafletMap && feature?.geometry) {
        focusGeometry(feature.geometry, feature.geometry.type === "Point" ? 11 : 9.5, options);
        return;
      }
      if (!state.map || !feature?.geometry) return;
      const bounds = geometryBounds(feature.geometry);
      const duration = Number.isFinite(Number(options.duration)) ? Number(options.duration) : 700;
      const essential = options.essential !== false;
      if (bounds && feature.geometry.type !== "Point") {
        const currentZoom = Number(state.map.getZoom?.() || 0);
        const center = siteCenter(feature.geometry);
        if (center && Number.isFinite(currentZoom) && currentZoom >= 12) {
          const zoom = Math.max(9.5, Math.min(currentZoom, 16));
          state.map.easeTo({ center, zoom, padding: focusPadding(), duration, essential });
          return;
        }
        state.map.fitBounds(bounds, { padding: focusPadding(), maxZoom: 9.5, duration, essential });
        return;
      }
      const center = siteCenter(feature.geometry);
      const currentZoom = Number(state.map.getZoom?.() || 0);
      const zoom = Math.max(11, Number.isFinite(currentZoom) ? Math.min(currentZoom, 16) : 0);
      if (center) state.map.easeTo({ center, zoom, padding: focusPadding(), duration, essential });
    }

    function focusPanelInsets(extra = 24) {
      const viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
      const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
      let top = extra;
      let right = extra;
      let bottom = extra;
      let left = extra;
      const rectIsVisible = rect => rect && rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth;
      const topbarRect = document.querySelector(".topbar")?.getBoundingClientRect();
      if (rectIsVisible(topbarRect)) top = Math.max(top, Math.round(topbarRect.bottom + extra));
      const timelineRect = timelineDockEl?.classList.contains("collapsed") ? null : timelineDockEl?.getBoundingClientRect();
      if (rectIsVisible(timelineRect) && timelineRect.top > viewportHeight * 0.35) {
        bottom = Math.max(bottom, Math.round(viewportHeight - timelineRect.top + extra));
      }
      if (articleEl?.classList.contains("open")) {
        const articleRect = articleEl.getBoundingClientRect();
        const isMobilePanel = viewportWidth <= 860;
        if (isMobilePanel) {
          const expanded = articleEl.classList.contains("expanded");
          const defaultBottom = document.body.classList.contains("timeline-collapsed") ? 88 : 96;
          const expectedTop = expanded ? 74 : viewportHeight - defaultBottom - Math.min(viewportHeight * 0.58, 520);
          const measuredTop = rectIsVisible(articleRect) ? articleRect.top : viewportHeight;
          const coveredFrom = Math.max(top + 44, Math.min(measuredTop, expectedTop));
          bottom = Math.max(bottom, Math.round(viewportHeight - coveredFrom + extra));
        } else if (rectIsVisible(articleRect)) {
          if (articleRect.left <= viewportWidth * 0.35) {
            left = Math.max(left, Math.round(articleRect.right + extra));
          } else if (articleRect.right >= viewportWidth * 0.65) {
            right = Math.max(right, Math.round(viewportWidth - articleRect.left + extra));
          }
        } else {
          left = Math.max(left, Math.round(Math.min(articleEl.offsetWidth || 440, viewportWidth * 0.46) + 38));
        }
      }
      const minVisibleWidth = Math.min(260, Math.max(160, Math.round(viewportWidth * 0.32)));
      const minVisibleHeight = Math.min(240, Math.max(150, Math.round(viewportHeight * 0.24)));
      if (left + right > viewportWidth - minVisibleWidth) {
        const scale = Math.max(0, (viewportWidth - minVisibleWidth) / Math.max(1, left + right));
        left = Math.round(left * scale);
        right = Math.round(right * scale);
      }
      if (top + bottom > viewportHeight - minVisibleHeight) {
        const scale = Math.max(0, (viewportHeight - minVisibleHeight) / Math.max(1, top + bottom));
        top = Math.round(top * scale);
        bottom = Math.round(bottom * scale);
      }
      return { top, left, right, bottom };
    }

    function focusPadding() {
      return focusPanelInsets(24);
    }

    function visibleMapCenterPoint(container) {
      const padding = focusPanelInsets(24);
      const rect = container?.getBoundingClientRect?.() || { left: 0, top: 0, width: window.innerWidth || 1, height: window.innerHeight || 1 };
      const left = Math.max(0, padding.left - rect.left);
      const top = Math.max(0, padding.top - rect.top);
      const right = Math.min(rect.width, (window.innerWidth || rect.width) - padding.right - rect.left);
      const bottom = Math.min(rect.height, (window.innerHeight || rect.height) - padding.bottom - rect.top);
      return {
        x: Math.round(left + Math.max(0, right - left) / 2),
        y: Math.round(top + Math.max(0, bottom - top) / 2)
      };
    }

    function mapboxVisibleCenterCoordinates(center) {
      const map = state.map;
      if (!map || !center) return center || [0, 0];
      const container = map.getContainer?.() || map.getCanvasContainer?.();
      const rect = container?.getBoundingClientRect?.() || { width: window.innerWidth || 1, height: window.innerHeight || 1 };
      const targetPoint = map.project?.(center);
      if (!targetPoint || !map.unproject) return center;
      const visibleCenter = visibleMapCenterPoint(container);
      const target = map.unproject({
        x: Number(targetPoint.x) + rect.width / 2 - visibleCenter.x,
        y: Number(targetPoint.y) + rect.height / 2 - visibleCenter.y
      });
      return [target.lng, target.lat];
    }

    function leafletVisibleCenterLatLng(center, zoom) {
      const map = state.leafletMap;
      if (!map || !center) return [center?.[1] || 0, center?.[0] || 0];
      const size = map.getSize?.();
      const targetPoint = map.project?.([center[1], center[0]], zoom);
      if (!size || !targetPoint || !map.unproject) return [center[1], center[0]];
      const visibleCenter = visibleMapCenterPoint(map.getContainer?.());
      const adjustedPoint = targetPoint.add([size.x / 2 - visibleCenter.x, size.y / 2 - visibleCenter.y]);
      const target = map.unproject(adjustedPoint, zoom);
      return [target.lat, target.lng];
    }

    function leafletFocusFitOptions(zoom, duration = 700) {
      const padding = focusPanelInsets(24);
      return {
        paddingTopLeft: [padding.left, padding.top],
        paddingBottomRight: [padding.right, padding.bottom],
        maxZoom: zoom,
        duration: duration / 1000
      };
    }

    function geometryBounds(geometry) {
      return GEOMETRY_UTILS.geometryBounds(geometry, { withinBounds: LONG_ISLAND_BOUNDS });
    }

    function focusRelatedContentFeature(type, slug) {
      if (!(state.map || state.leafletMap) || !slug) return;
      const match = relatedContentFeature(type, slug);
      if (match) focusFeature(match);
    }

    function relatedContentFeature(type, slug, options = {}) {
      if (!slug) return null;
      const markers = [
        ...(customSiteIconFeatures().features || []),
        ...(markerIconFeatures().features || []),
        ...(markerFeatures().features || [])
      ];
      const polygons = polygonFeatures().features || [];
      const managed = managedSiteFeatures().features || [];
      const managedPoints = managed.filter(feature => feature.geometry?.type === "Point");
      const managedPolygons = managed.filter(feature => /Polygon/.test(feature.geometry?.type || ""));
      const features = options.preferPoint
        ? [...managedPoints, ...markers, ...managedPolygons, ...polygons]
        : [...managedPolygons, ...polygons, ...managedPoints, ...markers];
      return features.find(feature => {
        if (type === "site") return findSiteFromFeature(feature)?.slug === slug;
        if (type === "wiki") return territoryTarget(feature)?.type === "wiki" && territoryTarget(feature)?.item?.slug === slug;
        return false;
      }) || null;
    }

    function timelineFeedbackFeature(event) {
      if (!event) return null;
      if (event.source_type === "site" && event.source_slug) {
        const site = state.siteBySlug.get(event.source_slug);
        const pointFeature = relatedContentFeature("site", event.source_slug, { preferPoint: true });
        if (pointFeature && pointFeature.geometry?.type === "Point") return pointFeature;
        const geometry = siteDisplayGeometry(site);
        if (geometry) {
          return {
            type: "Feature",
            geometry,
            properties: {
              directus_site_id: site.id,
              directus_site_slug: site.slug,
              title: site.title
            }
          };
        }
        return pointFeature || relatedContentFeature("site", event.source_slug);
      }
      if (event.source_type === "wiki" && event.source_slug) {
        return relatedContentFeature("wiki", event.source_slug);
      }
      if (event.source_type === "calendar_event") {
        const calendarEvent = timelineEventCalendarEvent(event);
        if (calendarEvent?.geojson) {
          return {
            type: "Feature",
            geometry: calendarEvent.geojson.type === "Feature" ? calendarEvent.geojson.geometry : calendarEvent.geojson,
            properties: {
              calendar_event_id: calendarEvent.id,
              calendar_event_slug: calendarEvent.slug,
              title: calendarEvent.title
            }
          };
        }
        if (calendarEvent?.related_site_slug) {
          const pointFeature = relatedContentFeature("site", calendarEvent.related_site_slug, { preferPoint: true });
          if (pointFeature) return pointFeature;
        }
      }
      if (isLongIslandCoordinate(Number(event.longitude), Number(event.latitude))) {
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [Number(event.longitude), Number(event.latitude)] },
          properties: { title: event.title || event.source_title || "Historic moment" }
        };
      }
      return null;
    }

    function showTimelineMapFeedback(event) {
      if (!state.map) return false;
      const feature = timelineFeedbackFeature(event);
      if (!feature?.geometry) return false;
      if (/Polygon/.test(feature.geometry.type)) {
        setHoverFeature(feature);
        window.clearTimeout(state.timelineHighlightTimer);
        state.timelineHighlightTimer = window.setTimeout(() => {
          if (String(state.activeTimelineEventId || "") === String(event.id || "")) return;
          setHoverFeature(null);
        }, 4200);
        return true;
      }
      const center = siteCenter(feature.geometry);
      return Boolean(center && animateTimelineIcon(feature, event));
    }

    function timelineIconIdentity(feature, event) {
      const props = feature?.properties || {};
      const siteId = Number(props.directus_site_id || event?.source_id);
      const siteSlug = props.directus_site_slug || event?.source_slug;
      const site = (Number.isFinite(siteId) && state.siteById.get(siteId)) || (siteSlug && state.siteBySlug.get(siteSlug));
      if (site && (siteMapIconUrl(site) || props.icon_url || props.icon_key)) return { type: "site", slug: site.slug };
      const featureSite = findSiteFromFeature(feature);
      if (featureSite && (siteMapIconUrl(featureSite) || props.icon_url || props.icon_key)) return { type: "site", slug: featureSite.slug };
      if (props.calendar_event_slug && state.eventBySlug.has(props.calendar_event_slug)) return { type: "event", slug: props.calendar_event_slug };
      return null;
    }

    function animateTimelineIcon(feature, event) {
      const identity = timelineIconIdentity(feature, event);
      if (!identity) return false;
      state.timelineIconJumpTimers.forEach(timer => window.clearTimeout(timer));
      state.timelineIconJumpTimers = [];
      state.timelineIconOffset = 0;
      updateTimelineIconLayerOffsets(0);
      const frames = [
        [0, -2],
        [80, -7],
        [170, -11],
        [280, -8],
        [390, -4],
        [520, -1],
        [640, 0]
      ];
      for (const [delay, offset] of frames) {
        state.timelineIconJumpTimers.push(window.setTimeout(() => {
          state.timelineIconJump = offset ? identity : null;
          state.timelineIconOffset = offset;
          updateTimelineIconLayerOffsets(offset);
          refreshTimelineIconSources();
        }, delay));
      }
      return true;
    }

    function updateTimelineIconLayerOffsets(offset = 0) {
      if (!state.map) return;
      for (const layerId of ["wp-markers-original-icon", "directus-site-icons", "calendar-event-icons"]) {
        if (!state.map.getLayer(layerId)) continue;
        state.map.setLayoutProperty(layerId, "icon-offset", [
          "case",
          ["==", ["get", "timeline_jump"], true],
          ["literal", [0, offset]],
          ["literal", [0, 0]]
        ]);
      }
    }

    function refreshTimelineIconSources() {
      if (!state.map) return;
      clearFeatureCache();
      if (state.map.getSource("wp-markers-original")) state.map.getSource("wp-markers-original").setData(filteredMarkerFeatures());
      if (state.map.getSource("wp-markers-icons")) state.map.getSource("wp-markers-icons").setData(markerIconFeatures());
      if (state.map.getSource("directus-site-icons")) state.map.getSource("directus-site-icons").setData(filterByCategory(customSiteIconFeatures()));
      if (state.map.getSource("calendar-event-icons")) state.map.getSource("calendar-event-icons").setData(calendarEventIconFeatures());
    }

    function timelineIconJumpMatchesFeature(feature) {
      const jump = state.timelineIconJump;
      if (!jump) return false;
      if (jump.type === "site") return findSiteFromFeature(feature)?.slug === jump.slug;
      if (jump.type === "event") return feature?.properties?.calendar_event_slug === jump.slug;
      return false;
    }

    function timelineIconJumpMatchesSite(site) {
      const jump = state.timelineIconJump;
      return Boolean(jump && jump.type === "site" && site?.slug === jump.slug);
    }

    function refocusActiveMapContent() {
      if (!state.activeContent) return;
      if (state.activeContent.type === "site") {
        const site = state.siteBySlug.get(state.activeContent.slug);
        if (siteDisplayGeometry(site)) focusGeometry(siteDisplayGeometry(site));
        else focusRelatedContentFeature("site", state.activeContent.slug);
      } else if (state.activeContent.type === "wiki") {
        const article = state.wikiBySlug.get(state.activeContent.slug);
        if (biographyPathData(article)) showBiographyPathOverlay(article);
        else focusRelatedContentFeature("wiki", state.activeContent.slug);
      } else if (state.activeContent.type === "event") {
        const event = state.eventBySlug.get(state.activeContent.slug);
        if (event?.geojson) focusGeometry(event.geojson, 12);
      }
    }

    function closeMediaViewer() {
      mediaLightboxEl.classList.remove("open");
      mediaImageEl.removeAttribute("src");
    }

    function setLoadingMessage(message) {
      if (!loadingMessageEl || !message) return;
      loadingMessageEl.textContent = message;
    }

    function hideLoadingScreen(options = {}) {
      state.loadingScreenHideRequested = false;
      loadingScreenEl?.classList.add("hidden");
      if (!performance.getEntriesByName?.("nli-desktop-map-ready").length) {
        performance.mark?.("nli-desktop-map-ready");
        performance.measure?.("nli-desktop-startup", "nli-desktop-startup-start", "nli-desktop-map-ready");
      }
    }

    function waitForNextPaint(frames = 2) {
      return new Promise(resolve => {
        const step = remaining => {
          if (remaining <= 0) {
            resolve();
            return;
          }
          if (window.requestAnimationFrame) {
            window.requestAnimationFrame(() => step(remaining - 1));
          } else {
            window.setTimeout(() => step(remaining - 1), 16);
          }
        };
        step(Math.max(1, Number(frames) || 1));
      });
    }

    function waitForMapboxPaintAfterArchiveLayers() {
      return new Promise(resolve => {
        if (!state.map) {
          resolve();
          return;
        }
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        const timer = window.setTimeout(finish, 900);
        state.map.once?.("idle", () => {
          window.clearTimeout(timer);
          waitForNextPaint(1).then(finish);
        });
      });
    }

    function waitForLeafletTerritoryPaint() {
      return new Promise(resolve => {
        const started = nowMs();
        const check = () => {
          const territoryLabels = document.querySelectorAll(".leaflet-polygon-label").length;
          if (territoryLabels >= 8 || nowMs() - started > 900) {
            waitForNextPaint(1).then(resolve);
            return;
          }
          if (window.requestAnimationFrame) window.requestAnimationFrame(check);
          else window.setTimeout(check, 16);
        };
        check();
      });
    }

    function revealLoadingScreenAfterStartupMapPaint() {
      waitForNextPaint(2).then(() => hideLoadingScreen({ force: true }));
    }

    function initLeafletFallback(reason = "") {
      return new Promise(resolve => {
        if (!window.L) {
          showBanner("This browser could not start the interactive map. Try enabling graphics acceleration or opening the page in Chrome.");
          resolve();
          return;
        }
        state.usingLeafletFallback = true;
        state.map = null;
        state.leafletBaseLayer = null;
        state.leafletStartupFullRenderPending = true;
        state.leafletStartupProgressiveRenderScheduled = false;
        state.leafletStartupPointDripUsed = false;
        state.leafletStartupPinsVisibleReady = false;
        state.leafletBiographyStartupDeferred = true;
        const runStartupWatchdog = () => {
          if (!state.leafletMap || !state.leafletStartupFullRenderPending) return;
          if (nowMs() - Number(state.userMapInteractionAt || 0) < 1400) {
            window.setTimeout(runStartupWatchdog, 1200);
            return;
          }
          scheduleLeafletStartupFullRender({ force: true });
        };
        window.setTimeout(runStartupWatchdog, 60000);
        clearFeatureCache();
        const mapEl = document.getElementById("map");
        mapEl.classList.add("leaflet-fallback-map");
        const firstView = initialLeafletView();
        const bootstrapMap = window.NLI_BOOTSTRAP_LEAFLET_MAP;
        if (bootstrapMap?.getContainer?.() === mapEl) {
          state.leafletMap = bootstrapMap;
          state.leafletBaseLayer = window.NLI_BOOTSTRAP_LEAFLET_BASE_LAYER || null;
          state.leafletMap.setMinZoom?.(LEAFLET_VIEW.minZoom);
          state.leafletMap.setMaxZoom?.(LEAFLET_VIEW.maxZoom);
          state.leafletMap.setMaxBounds?.(LEAFLET_VIEW.maxBounds);
          state.leafletMap.options.maxBoundsViscosity = LEAFLET_VIEW.maxBoundsViscosity;
          state.leafletMap.options.tapHold = false;
          state.leafletMap.options.tapTolerance = 28;
          state.leafletMap.options.bounceAtZoomLimits = false;
          state.leafletMap.options.inertia = false;
          state.leafletMap.options.inertiaMaxSpeed = 0;
          state.leafletMap.options.inertiaDeceleration = 10000;
          state.leafletMap.setView?.(firstView.center, firstView.zoom, { animate: false });
        } else {
          mapEl.replaceChildren();
          state.leafletMap = L.map(mapEl, {
            zoomControl: false,
            scrollWheelZoom: true,
            touchZoom: true,
            dragging: true,
            tapHold: false,
            tapTolerance: 28,
            bounceAtZoomLimits: false,
            inertia: false,
            inertiaMaxSpeed: 0,
            inertiaDeceleration: 10000,
            wheelDebounceTime: 24,
            wheelPxPerZoomLevel: 80,
            preferCanvas: true,
            minZoom: LEAFLET_VIEW.minZoom,
            maxZoom: LEAFLET_VIEW.maxZoom,
            maxBounds: LEAFLET_VIEW.maxBounds,
            maxBoundsViscosity: LEAFLET_VIEW.maxBoundsViscosity
          }).setView(firstView.center, firstView.zoom);
          state.leafletMap.zoomControl = L.control.zoom({ position: "topright" }).addTo(state.leafletMap);
        }
        state.leafletMap.zoomControl?.setPosition?.("topright");
        state.leafletMap.scrollWheelZoom?.enable?.();
        state.leafletMap.dragging?.enable?.();
        state.leafletMap.touchZoom?.enable?.();
        state.leafletCanvasRenderer = L.canvas({ padding: 0.35 });
        const placeNameAreaPane = state.leafletMap.getPane?.("nli-place-name-areas") || state.leafletMap.createPane?.("nli-place-name-areas");
        if (placeNameAreaPane) {
          placeNameAreaPane.style.zIndex = "440";
          placeNameAreaPane.style.pointerEvents = "auto";
        }
        state.leafletPlaceNameAreaRenderer = L.svg({ pane: "nli-place-name-areas", padding: 0.35 });
        setLeafletBasemap(basemapSelect?.value || state.basemap || "road");
        state.leafletMap.on("click", event => {
          if (handleSuggestionMapPickClick({ lngLat: { lng: event.latlng.lng, lat: event.latlng.lat }, originalEvent: event.originalEvent })) return;
          const target = event.originalEvent?.target;
          if (target?.closest?.(".leaflet-marker-icon, .leaflet-interactive, .leaflet-polygon-label, .leaflet-control, .leaflet-popup, .leaflet-hover-card")) return;
          const polygons = geographicPolygonFeaturesAtLngLat(event.latlng);
          const feature = bestPolygonFeature(polygons);
          if (feature) {
            handleFeatureClick(
              feature,
              "Territory / polygon",
              event.originalEvent || event,
              { lng: event.latlng.lng, lat: event.latlng.lat }
            );
            return;
          }
          hideLeafletHoverCard();
          closeTimelineSourceReferences(document);
          closeArticlePanel();
        });
        state.leafletMap.on("mousemove", event => {
          if (!shouldBindLeafletHoverInteractions()) return;
          const target = event.originalEvent?.target;
          if (target?.closest?.(".leaflet-marker-icon, .leaflet-polygon-label, .leaflet-control, .leaflet-popup")) return;
          const now = performance.now();
          if (now - state.lastHoverMove < 42) return;
          state.lastHoverMove = now;
          const feature = bestPolygonFeature(geographicPolygonFeaturesAtLngLat(event.latlng));
          if (feature && featurePreview(feature).title) {
            showLeafletHoverCard(feature, event.originalEvent || event, mapEl);
          } else {
            hideLeafletHoverCard();
          }
        });
        state.leafletMap.on("mouseout", hideLeafletHoverCard);
        state.leafletMap.on("dragstart", () => {
          markUserMapInteraction({ force: true });
          hideLeafletHoverCard();
          mapEl.classList.add("is-moving");
        });
        state.leafletMap.on("zoomstart", () => {
          markUserMapInteraction({ preserveBiographyFollow: true });
          hideLeafletHoverCard();
          mapEl.classList.add("is-moving");
        });
        state.leafletMap.on("dragend moveend zoomend", () => {
          window.setTimeout(() => mapEl.classList.remove("is-moving"), 80);
        });
        state.leafletMap.on("moveend", () => scheduleLeafletViewportRenderAfterNavigation());
        state.leafletMap.on("zoomend", () => {
          recenterFollowedBiographyCameraAfterZoom();
          refreshLeafletPlaceNameAreaLabels();
          scheduleLeafletViewportRenderAfterNavigation(180);
        });
        state.leafletMap.whenReady(() => {
          const finishReady = () => {
            window.setTimeout(() => state.leafletMap.invalidateSize(), 80);
            state.leafletStartupPinsVisibleReady = true;
            window.setTimeout(() => scheduleLeafletStartupFullRender(), 260);
            if (reason) console.warn("Using Leaflet fallback map:", reason);
            resolve();
          };
          const renderReadyLayers = () => {
            setLoadingMessage("Drawing ancestral territory layers.");
            renderLeafletArchiveLayers({ polygonsOnly: true, includeBiographyPeople: false });
            window.setTimeout(() => state.leafletMap?.invalidateSize?.(), 120);
            waitForLeafletTerritoryPaint().then(finishReady);
            scheduleLeafletStartupFullRender();
          };
          if (state.sites.length || state.layers.length) {
            window.requestAnimationFrame(renderReadyLayers);
          } else {
            finishReady();
          }
        });
      });
    }

    function leafletStyle(feature) {
      const props = feature?.properties || {};
      const isPlaceNameArea = props.place_name_area_overlay === true || props.place_name_area_overlay === "true";
      const isBroadTerritory = isBroadTerritoryFeature(feature);
      const requestedOpacity = numeric(props.opacity, isBroadTerritory ? 0.42 : 0.3);
      return {
        color: isPlaceNameArea ? "#315b50" : "transparent",
        weight: isPlaceNameArea ? 0.8 : 0,
        opacity: isPlaceNameArea ? 0.3 : 0,
        dashArray: null,
        fillColor: GEOMETRY_UTILS.normalizeHex(props.fillcolor, "#496f5d"),
        fillOpacity: isPlaceNameArea
          ? Math.min(0.2, numeric(props.opacity, 0.18))
          : isBroadTerritory
            ? requestedOpacity
            : Math.min(0.32, requestedOpacity)
      };
    }

    function setLeafletPolygonHoverStyle(layer, feature, active) {
      if (!layer?.setStyle || !/Polygon/.test(feature?.geometry?.type || "")) return;
      const base = leafletStyle(feature);
      layer.setStyle(active ? {
        ...base,
        color: "#1e2a21",
        weight: 2.2,
        opacity: 0.96,
        dashArray: "6 5",
        fillOpacity: Math.min(base.fillOpacity, 0.32)
      } : base);
    }

    function leafletCurrentZoom() {
      return state.leafletMap?.getZoom?.() || 8;
    }

    function leafletViewportBounds(pad = 0.5) {
      const bounds = state.leafletMap?.getBounds?.();
      return bounds?.pad ? bounds.pad(pad) : null;
    }

    function leafletViewportSignature(bounds) {
      if (!bounds?.getWest) return "viewport:none";
      return [
        "viewport",
        Number(bounds.getWest()).toFixed(2),
        Number(bounds.getSouth()).toFixed(2),
        Number(bounds.getEast()).toFixed(2),
        Number(bounds.getNorth()).toFixed(2)
      ].join(":");
    }

    function scheduleLeafletStartupFullRender(options = {}) {
      if (!state.leafletStartupFullRenderPending && options.force !== true) return;
      if (state.leafletStartupProgressiveRenderScheduled && options.force !== true) return;
      state.leafletStartupProgressiveRenderScheduled = true;
      const runWhenQuiet = (callback, delay, quietMs = 260) => {
        const attempt = () => {
          if (!state.leafletMap) return;
          if (nowMs() - Number(state.userMapInteractionAt || 0) < quietMs) {
            window.setTimeout(attempt, Math.max(180, quietMs));
            return;
          }
          callback();
        };
        window.setTimeout(attempt, delay);
      };
      runWhenQuiet(() => {
        state.leafletStartupFullRenderPending = false;
        state.leafletStartupFullRenderTimer = null;
        statusEl.textContent = `${state.sites.length} map listings loaded. Loading nearby pins one at a time.`;
        renderLeafletArchiveLayers({
          viewportOnly: true,
          viewportPad: 0.42,
          pointLimit: LEAFLET_VIEWPORT_POINT_LIMIT,
          skipBiographyPeople: true,
          skipDetailLabels: true,
          allowStartupPins: true
        });
      }, options.force ? 0 : 320);
      runWhenQuiet(() => {
        state.leafletBiographyStartupDeferred = false;
        state.biographyMappedGeometryCache.clear();
        state.biographyWaterCoordinateCache.clear();
        renderLeafletArchiveLayers({
          biographyOnly: true,
          includeBiographyPeople: true,
          biographyAnimationDelay: 700,
          skipDetailLabels: true
        });
      }, options.force ? 2300 : 4200, 800);
    }

    function initialLeafletView() {
      const params = new URLSearchParams(window.location.search || "");
      if (window.location.hash || params.get("site") || params.get("wiki") || params.get("event")) {
        return { center: LEAFLET_VIEW.center, zoom: LEAFLET_VIEW.zoom };
      }
      const bootstrapView = window.NLI_STARTUP_LEAFLET_VIEW;
      if (Array.isArray(bootstrapView?.center) && Number.isFinite(Number(bootstrapView.center[0])) && Number.isFinite(Number(bootstrapView.center[1]))) {
        return {
          center: [Number(bootstrapView.center[0]), Number(bootstrapView.center[1])],
          zoom: Math.max(Number(bootstrapView.zoom) || Number(LEAFLET_VIEW.zoom) || 9.7, 11.95)
        };
      }
      return randomLongIslandStartupView();
    }

    function randomLongIslandStartupView() {
      const views = LONG_ISLAND_START_VIEWS.length ? LONG_ISLAND_START_VIEWS : [{ center: LEAFLET_VIEW.center, zoom: LEAFLET_VIEW.zoom }];
      const randomUnit = () => window.crypto?.getRandomValues
        ? window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296
        : Math.random();
      if (views.length < 2) {
        return {
          center: views[0].center || LEAFLET_VIEW.center,
          zoom: Math.max(Number(views[0].zoom) || Number(LEAFLET_VIEW.zoom) || 9.7, 11.95)
        };
      }
      const scaled = randomUnit() * (views.length - 1);
      const index = Math.min(views.length - 2, Math.floor(scaled));
      const local = scaled - index;
      const start = views[index]?.center || LEAFLET_VIEW.center;
      const end = views[index + 1]?.center || start;
      const lat = Number(start[0]) + (Number(end[0]) - Number(start[0])) * local + (randomUnit() - 0.5) * 0.035;
      const lng = Number(start[1]) + (Number(end[1]) - Number(start[1])) * local;
      return {
        center: [lat, lng],
        zoom: Math.max(Number(LEAFLET_VIEW.zoom) || 9.7, 11.95)
      };
    }

    function leafletRenderSignature() {
      const zoom = leafletCurrentZoom();
      const placeNameAreaLabelLevel = zoom >= PLACE_NAME_AREA_LABEL_MIN_ZOOM ? "place-area-labels" : "no-place-area-labels";
      const labelLevel = zoom >= LEAFLET_MANAGED_LABEL_MIN_ZOOM ? "managed" : zoom >= LEAFLET_DETAIL_LABEL_MIN_ZOOM ? "detail" : "territory";
      const pointLabelLevel = zoom >= SITE_POINT_LABEL_MIN_ZOOM ? "points" : "no-points";
      const markerRadius = zoom >= 10 ? "large" : "small";
      const layerFilterSignature = JSON.stringify({
        categories: [...activeCategories()].sort(),
        access: [...activeAccessFilters()].sort(),
        themes: [...activeThemeFilters()].sort(),
        eras: [...activeEraFilters()].sort(),
        exhibits: exhibitToggle?.checked === false ? 0 : 1,
        guidedPath: state.activeLearningPathSlug || "",
        guidedPathOnly: state.activeLearningPathShowOnly ? 1 : 0
      });
      return [
        state.basemap || "road",
        polygonToggle?.checked ? "polygons" : "no-polygons",
        biographyPathsEnabled() ? "bio-paths" : "no-bio-paths",
        "markers",
        layerFilterSignature,
        placeNameAreaLabelLevel,
        labelLevel,
        pointLabelLevel,
        markerRadius
      ].join("|");
    }

    function leafletBiographyPeopleSignature() {
      return [
        biographyPersonKnownSlugs().join(","),
        biographyPersonLandMaskStateKey(),
        state.sites?.length || 0
      ].join("|");
    }

    function leafletPointLayer(feature, latlng) {
      if (feature?.properties?.map_story_id) {
        return L.marker(latlng, {
          icon: L.divIcon({
            className: "leaflet-story-bubble",
            html: `<span aria-hidden="true"><span></span><span></span><span></span></span>`,
            iconSize: [34, 34],
            iconAnchor: [17, 31],
            popupAnchor: [0, -28]
          }),
          zIndexOffset: 850
        });
      }
      const site = findSiteFromFeature(feature);
      const iconUrl = site ? siteMapIconUrl(site) : rewriteMediaUrl(feature?.properties?.icon_url || "");
      if (iconUrl) {
        return L.marker(latlng, {
          icon: L.divIcon({
            className: "leaflet-site-icon",
            html: `<img src="${escapeHtml(iconUrl)}" alt="">`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -20]
          })
        });
      }
      const dotColor = siteHasHeaderImage(site) ? "#326fe3" : "#496f5d";
      return L.marker(latlng, {
        icon: L.divIcon({
          className: "leaflet-site-dot-icon",
          html: `<span style="display:block;width:8px;height:8px;margin:5px;border-radius:999px;background:${dotColor};border:1.2px solid rgba(255,255,255,0.95);box-shadow:0 1px 3px rgba(24,32,25,0.24);"></span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -10]
        })
      });
    }

    function cancelLeafletPointDrip() {
      window.clearTimeout(state.leafletProgressivePointTimer);
      state.leafletProgressivePointTimer = null;
      state.leafletProgressivePointToken += 1;
      state.leafletProgressivePointDripActive = false;
      try {
        state.leafletProgressivePointLayer?.clearLayers?.();
      } catch {}
      state.leafletProgressivePointLayer = null;
    }

    function leafletPointDistanceFromCenter(feature) {
      const coords = feature?.geometry?.coordinates || [];
      const center = state.leafletMap?.getCenter?.();
      if (!center || feature?.geometry?.type !== "Point") return 0;
      return Math.pow(Number(coords[0]) - Number(center.lng), 2) + Math.pow(Number(coords[1]) - Number(center.lat), 2);
    }

    function createLeafletFeaturePoint(feature, source) {
      const coords = feature?.geometry?.coordinates;
      if (!coords || feature?.geometry?.type !== "Point") return null;
      const marker = leafletPointLayer(feature, L.latLng(coords[1], coords[0]));
      bindLeafletFeature(feature, marker, source);
      return marker;
    }

    function createLeafletAttentionPoint(feature) {
      const coords = feature?.geometry?.coordinates;
      if (!coords || feature?.geometry?.type !== "Point") return null;
      if (feature?.properties?.attention_kind === "on-this-day") {
        const marker = L.marker([coords[1], coords[0]], {
          interactive: true,
          zIndexOffset: 545,
          icon: L.divIcon({
            className: "leaflet-on-this-day-marker",
            html: "<span>??</span>",
            iconSize: [34, 34],
            iconAnchor: [17, 32]
          })
        });
        bindLeafletFeature(feature, marker, "On This Day in History");
        return marker;
      }
      return L.marker([coords[1], coords[0]], {
        interactive: false,
        zIndexOffset: 540,
        icon: L.divIcon({
          className: "leaflet-attention-pulse",
          html: "<span></span>",
          iconSize: [92, 92],
          iconAnchor: [46, 54]
        })
      });
    }

    function startLeafletPointDrip(queue) {
      cancelLeafletPointDrip();
      if (!state.leafletPointArchiveLayer || !window.L || !Array.isArray(queue) || !queue.length) return;
      state.leafletProgressivePointLayer = L.layerGroup().addTo(state.leafletPointArchiveLayer);
      const layer = state.leafletProgressivePointLayer;
      const token = ++state.leafletProgressivePointToken;
      state.leafletProgressivePointDripActive = true;
      let index = 0;
      const step = () => {
        if (token !== state.leafletProgressivePointToken || !layer || !state.leafletMap) return;
        const perFrame = 1;
        let added = 0;
        while (index < queue.length && added < perFrame) {
          const entry = queue[index++];
          const marker = entry?.create?.();
          if (marker) layer.addLayer(marker);
          added += 1;
        }
        if (index >= queue.length) {
          state.leafletProgressivePointTimer = null;
          state.leafletProgressivePointDripActive = false;
          scheduleLeafletViewportRenderAfterNavigation(40);
          return;
        }
        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(step);
        } else {
          state.leafletProgressivePointTimer = window.setTimeout(step, 16);
        }
      };
      step();
    }

    function positionLeafletHoverCard(event, fallbackElement = null) {
      if (!state.leafletHoverCard) return;
      const margin = 14;
      const offsetX = 18;
      const offsetY = 18;
      if (!state.leafletHoverCardSize) {
        const rect = state.leafletHoverCard.getBoundingClientRect();
        state.leafletHoverCardSize = { width: rect.width, height: rect.height };
      }
      const rect = state.leafletHoverCardSize;
      const eventX = Number(event?.clientX);
      const eventY = Number(event?.clientY);
      const hasEventPoint = Number.isFinite(eventX) && Number.isFinite(eventY);
      const targetRect = hasEventPoint ? null : fallbackElement?.getBoundingClientRect?.();
      const clientX = hasEventPoint ? eventX : (targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth / 2);
      const clientY = hasEventPoint ? eventY : (targetRect ? targetRect.top + targetRect.height / 2 : window.innerHeight / 2);
      let left = clientX + offsetX;
      let top = clientY + offsetY;
      if (left + rect.width + margin > window.innerWidth) left = Math.max(margin, clientX - rect.width - offsetX);
      if (top + rect.height + margin > window.innerHeight) top = Math.max(margin, clientY - rect.height - offsetY);
      state.leafletHoverCard.style.left = `${Math.round(left)}px`;
      state.leafletHoverCard.style.top = `${Math.round(top)}px`;
    }

    function showLeafletHoverCard(feature, event, fallbackElement = null) {
      if (!shouldBindLeafletHoverInteractions()) {
        hideLeafletHoverCard();
        return;
      }
      const preview = featurePreview(feature);
      if (!preview.title) return;
      rememberLeafletHoverPriority(feature, event);
      if (!state.leafletHoverCard) {
        state.leafletHoverCard = document.createElement("div");
        state.leafletHoverCard.className = "leaflet-tooltip leaflet-hover-card leaflet-hover-card-floating";
        document.body.appendChild(state.leafletHoverCard);
      }
      const key = hoverFeatureKey(feature);
      const previewKey = leafletHoverPreviewKey(preview);
      if (state.activeLeafletHoverFeatureKey !== key || state.leafletHoverCard.dataset.previewKey !== previewKey) {
        state.activeLeafletHoverFeatureKey = key;
        state.leafletHoverCard.dataset.previewKey = previewKey;
        state.leafletHoverCard.innerHTML = hoverHtmlFromPreview(preview);
        state.leafletHoverCardSize = null;
      }
      state.leafletHoverCard.hidden = false;
      state.leafletHoverCard.classList.add("show");
      positionLeafletHoverCard(event, fallbackElement);
    }

    function hideLeafletHoverCard() {
      window.clearTimeout(state.leafletHoverHydrationTimer);
      state.leafletHoverHydrationTimer = null;
      if (state.leafletHoverCard) {
        state.leafletHoverCard.classList.remove("show");
        state.leafletHoverCard.hidden = true;
      }
      state.leafletHoverCardSize = null;
      state.activeLeafletHoverFeatureKey = "";
    }

    function hoverHtmlFromPreview(preview) {
      return HOVER_CARD_UTILS.hoverHtml
        ? HOVER_CARD_UTILS.hoverHtml(preview, { escapeHtml })
        : `<div class="hover-preview"><div><strong>${escapeHtml(preview.title)}</strong><span>${escapeHtml(preview.summary)}</span></div></div>`;
    }

    function leafletHoverPreviewKey(preview = {}) {
      return [
        preview.title || "",
        preview.meta || "",
        preview.summary || "",
        preview.image || "",
        Array.isArray(preview.tags) ? preview.tags.join(",") : "",
        Array.isArray(preview.actions) ? preview.actions.join(",") : ""
      ].join("|").slice(0, 900);
    }

    function rememberLeafletHoverPriority(feature, event = null) {
      const key = hoverFeatureKey(feature);
      if (!key) return;
      state.leafletPriorityHoverKey = key;
      const coords = feature?.geometry?.type === "Point" ? feature.geometry.coordinates : null;
      const lng = Number(event?.latlng?.lng ?? coords?.[0]);
      const lat = Number(event?.latlng?.lat ?? coords?.[1]);
      state.leafletPriorityHoverLngLat = Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : null;
    }

    function refreshLeafletHoveredViewport() {
      if (!state.leafletMap || !state.usingLeafletFallback) return;
      window.clearTimeout(state.leafletHoverRefreshTimer);
      state.leafletHoverRefreshTimer = window.setTimeout(() => {
        if (state.leafletStartupFullRenderPending) return;
        renderLeafletArchiveLayers({ skipIfStable: true, viewportOnly: true, viewportPad: 0.42, pointLimit: LEAFLET_VIEWPORT_POINT_LIMIT });
      }, 40);
    }

    function scheduleLeafletViewportRenderAfterNavigation(delay = 260) {
      if (!state.leafletMap || !state.usingLeafletFallback) return;
      window.clearTimeout(state.leafletViewportRenderTimer);
      state.leafletViewportRenderTimer = window.setTimeout(() => {
        state.leafletViewportRenderTimer = null;
        if (!state.leafletMap || state.leafletStartupFullRenderPending) return;
        const currentBounds = leafletViewportBounds(0.04);
        const baseRenderSignature = leafletRenderSignature();
        const renderContextChanged = !String(state.leafletRenderSignature || "").startsWith(`${baseRenderSignature}|`);
        if (state.leafletRenderedPointBounds?.contains?.(currentBounds) && !renderContextChanged) return;
        renderLeafletArchiveLayers({
          skipIfStable: true,
          viewportOnly: true,
          viewportPad: 0.42,
          pointLimit: LEAFLET_VIEWPORT_POINT_LIMIT
        });
      }, Math.max(120, Number(delay) || 260));
    }

    function shouldBindLeafletHoverInteractions() {
      if (!window.matchMedia) return true;
      const primaryFineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const anyFineHover = window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches;
      const width = window.innerWidth || document.documentElement?.clientWidth || 0;
      return primaryFineHover || (anyFineHover && width >= 900);
    }

    function bindFineHoverTarget(target, handlers = {}) {
      if (!target) return;
      const enter = handlers.enter || handlers.move;
      const move = handlers.move || enter;
      const leave = handlers.leave || hideLeafletHoverCard;
      if (!enter || !move || !leave) return;
      if (shouldBindLeafletHoverInteractions()) {
        const supportsPointer = Boolean(window.PointerEvent);
        if (supportsPointer) {
          target.addEventListener("pointerover", enter);
          target.addEventListener("pointermove", move);
          target.addEventListener("pointerout", leave);
        } else {
          target.addEventListener("mouseenter", enter);
          target.addEventListener("mousemove", move);
          target.addEventListener("mouseleave", leave);
        }
      }
      target.addEventListener("focus", handlers.focus || enter);
      target.addEventListener("blur", handlers.blur || leave);
    }

    function bindLeafletElementHover(feature, layer) {
      if (!shouldBindLeafletHoverInteractions()) return;
      const element = layer.getElement?.();
      if (!element || element.dataset.leafletHoverBound === "true") return;
      element.dataset.leafletHoverBound = "true";
      const bindTarget = target => {
        if (!target || target.dataset?.leafletHoverBoundChild === "true") return;
        if (target.dataset) target.dataset.leafletHoverBoundChild = "true";
        bindFineHoverTarget(target, {
          enter: event => {
            element.classList.add("is-map-hovered");
            showLeafletHoverCard(feature, event, element);
          },
          move: event => positionLeafletHoverCard(event, element),
          leave: () => {
            element.classList.remove("is-map-hovered");
            hideLeafletHoverCard();
          },
          focus: event => {
            element.classList.add("is-map-hovered");
            showLeafletHoverCard(feature, event, element);
          },
          blur: () => {
            element.classList.remove("is-map-hovered");
            hideLeafletHoverCard();
          }
        });
      };
      bindTarget(element);
      element.querySelectorAll?.("img, span").forEach(bindTarget);
    }

    function bindLeafletFeature(feature, layer, source) {
      const identifyElement = () => {
        const element = layer.getElement?.();
        if (!element?.dataset) return;
        const slug = feature?.properties?.directus_site_slug || feature?.properties?.slug || "";
        if (slug) element.dataset.siteSlug = slug;
        if (feature?.properties?.place_name_area_overlay === true || feature?.properties?.place_name_area_overlay === "true") {
          element.dataset.placeNameArea = "true";
        }
      };
      layer.on("add", identifyElement);
      identifyElement();
      if (shouldBindLeafletHoverInteractions()) {
        layer.on("mouseover", event => {
          const hoverFeature = bestLeafletHoverPolygonAtLatLng(event?.latlng, feature);
          setLeafletPolygonHoverStyle(layer, hoverFeature, true);
          showLeafletHoverCard(hoverFeature, event?.originalEvent || event, layer.getElement?.());
        });
        layer.on("mousemove", event => {
          const hoverFeature = bestLeafletHoverPolygonAtLatLng(event?.latlng, feature);
          if (state.activeLeafletHoverFeatureKey !== hoverFeatureKey(hoverFeature)) {
            showLeafletHoverCard(hoverFeature, event?.originalEvent || event, layer.getElement?.());
          } else {
            positionLeafletHoverCard(event?.originalEvent || event, layer.getElement?.());
          }
        });
        layer.on("mouseout", () => {
          setLeafletPolygonHoverStyle(layer, feature, false);
          hideLeafletHoverCard();
        });
        layer.on("add", () => bindLeafletElementHover(feature, layer));
        bindLeafletElementHover(feature, layer);
      }
      layer.on("click", event => {
        if (event?.latlng && handleSuggestionMapPickClick({ lngLat: { lng: event.latlng.lng, lat: event.latlng.lat }, originalEvent: event.originalEvent })) return;
        hideLeafletHoverCard();
        if (event?.originalEvent && window.L?.DomEvent?.stop) window.L.DomEvent.stop(event.originalEvent);
        event?.originalEvent?.preventDefault?.();
        event?.originalEvent?.stopPropagation?.();
        const clickFeature = bestLeafletPolygonAtLatLng(event?.latlng, feature);
        handleFeatureClick(clickFeature, source, event?.originalEvent || event, event?.latlng ? { lng: event.latlng.lng, lat: event.latlng.lat } : null);
      });
    }

    function createLeafletLabelCollisionState() {
      return { boxes: [], titles: new Set() };
    }

    function placeLeafletLabel(coords, width, anchorY, collisionState, allowOffsets = true) {
      if (!state.leafletMap || !collisionState) return { latLng: [coords[1], coords[0]], box: null };
      const origin = state.leafletMap.latLngToLayerPoint([coords[1], coords[0]]);
      const height = 36;
      const horizontal = Math.max(42, Math.round(width * 0.58));
      const candidates = allowOffsets
        ? [[0, 0], [0, -42], [0, 42], [-horizontal, 0], [horizontal, 0], [-horizontal, -36], [horizontal, -36], [-horizontal, 36], [horizontal, 36]]
        : [[0, 0]];
      const padding = 5;
      for (const [offsetX, offsetY] of candidates) {
        const point = { x: origin.x + offsetX, y: origin.y + offsetY };
        const box = {
          left: point.x - width / 2 - padding,
          right: point.x + width / 2 + padding,
          top: point.y - anchorY - padding,
          bottom: point.y - anchorY + height + padding
        };
        const overlaps = collisionState.boxes.some(existing => !(
          box.right < existing.left || box.left > existing.right || box.bottom < existing.top || box.top > existing.bottom
        ));
        if (overlaps) continue;
        return { latLng: state.leafletMap.layerPointToLatLng(point), box };
      }
      return null;
    }

    function refreshLeafletPlaceNameAreaLabels(collisionState = null) {
      if (!state.leafletMap || !window.L) return;
      if (!state.leafletPlaceNameAreaLabelLayer) {
        state.leafletPlaceNameAreaLabelLayer = L.layerGroup().addTo(state.leafletArchiveLayer || state.leafletMap);
      }
      state.leafletPlaceNameAreaLabelLayer.clearLayers();
      if (leafletCurrentZoom() < PLACE_NAME_AREA_LABEL_MIN_ZOOM || placeNameAreaToggle?.checked === false) return;
      const placements = collisionState || createLeafletLabelCollisionState();
      for (const feature of (placeNameAreaLabelFeatures().features || [])) {
        const coords = feature.geometry?.coordinates;
        if (!coords || feature.geometry?.type !== "Point") continue;
        const title = displayFeatureTitle(feature.properties || {});
        if (!title) continue;
        const normalizedTitle = normalizeComparisonText(title);
        if (placements.titles.has(normalizedTitle)) continue;
        const placement = placeLeafletLabel(coords, 172, 18, placements, true);
        if (!placement) continue;
        placements.boxes.push(placement.box);
        placements.titles.add(normalizedTitle);
        const marker = L.marker(placement.latLng, {
          interactive: true,
          zIndexOffset: 650,
          icon: L.divIcon({
            className: "leaflet-polygon-label detail place-name-area",
            html: escapeHtml(title),
            iconSize: [172, 36],
            iconAnchor: [86, 18]
          })
        }).addTo(state.leafletPlaceNameAreaLabelLayer);
        bindLeafletFeature(feature, marker, "Place Name Area");
      }
    }

    function renderLeafletArchiveLayers(options = {}) {
      if (!state.leafletMap || !window.L) return;
      if (state.leafletProgressivePointDripActive && options.skipIfStable === true) return;
      if (state.leafletProgressivePointDripActive && options.allowStartupPins === true) return;
      if (state.leafletStartupFullRenderPending && options.polygonsOnly !== true && options.allowStartupPins !== true) {
        options = { ...options, polygonsOnly: true, includeBiographyPeople: false };
        scheduleLeafletStartupFullRender();
      }
      const polygonsOnly = options.polygonsOnly === true;
      const biographyOnly = options.biographyOnly === true;
      const includeBiographyPeople = options.includeBiographyPeople === true;
      const skipBiographyPeople = options.skipBiographyPeople === true || state.leafletBiographyStartupDeferred === true;
      const skipDetailLabels = options.skipDetailLabels === true;
      const viewportOnly = options.viewportOnly === true;
      const viewportPad = numeric(options.viewportPad, 0.72);
      const viewportBounds = viewportOnly ? leafletViewportBounds(viewportPad) : null;
      const pointLimit = Number.isFinite(Number(options.pointLimit)) ? Math.max(0, Math.floor(Number(options.pointLimit))) : 0;
      const labelCollisionState = createLeafletLabelCollisionState();
      const signature = `${leafletRenderSignature()}|${polygonsOnly ? "polygons-only" : "full"}|${biographyOnly ? "biography-only" : "all-layers"}|${skipDetailLabels ? "light-labels" : "detail-labels"}|${skipBiographyPeople ? "skip-bio" : "bio"}|${pointLimit ? `limit-${pointLimit}` : "all-visible"}|${viewportOnly ? leafletViewportSignature(viewportBounds) : "all-points"}`;
      if (options.skipIfStable && state.leafletRenderSignature === signature) return;
      state.leafletRenderSignature = signature;
      const staticSignature = `${leafletRenderSignature()}|${polygonsOnly ? "polygons-only" : "full"}`;
      let rebuildStaticLayers = false;
      if (!biographyOnly) {
        cancelLeafletPointDrip();
        if (!state.leafletArchiveLayer) {
          state.leafletArchiveLayer = L.layerGroup().addTo(state.leafletMap);
        }
        if (!state.leafletStaticArchiveLayer) state.leafletStaticArchiveLayer = L.layerGroup().addTo(state.leafletArchiveLayer);
        if (!state.leafletPointArchiveLayer) state.leafletPointArchiveLayer = L.layerGroup().addTo(state.leafletArchiveLayer);
        if (!state.leafletPathArchiveLayer) state.leafletPathArchiveLayer = L.layerGroup().addTo(state.leafletArchiveLayer);
        rebuildStaticLayers = state.leafletStaticRenderSignature !== staticSignature;
        if (rebuildStaticLayers) {
          state.leafletStaticRenderSignature = staticSignature;
          state.leafletStaticArchiveLayer.clearLayers();
          state.leafletPathArchiveLayer.clearLayers();
        }
        state.leafletPointArchiveLayer.clearLayers();
      }
      const addCollection = (collection, source, targetLayer = state.leafletStaticArchiveLayer) => {
        if (!targetLayer) return;
        L.geoJSON(collection, {
          bubblingMouseEvents: false,
          renderer: source === "Place Name Area"
            ? (state.leafletPlaceNameAreaRenderer || state.leafletCanvasRenderer || undefined)
            : (state.leafletCanvasRenderer || undefined),
          smoothFactor: 1.6,
          style: leafletStyle,
          pointToLayer: leafletPointLayer,
          onEachFeature: (feature, layer) => bindLeafletFeature(feature, layer, source)
        }).addTo(targetLayer);
      };
      const addWaterMask = () => {
        if (!state.waterMask?.features?.length || !state.leafletStaticArchiveLayer) return;
        L.geoJSON(state.waterMask, {
          interactive: false,
          renderer: state.leafletCanvasRenderer || undefined,
          smoothFactor: 1.8,
          style: {
            color: state.basemap === "blank" ? "#f6f8f3" : "#9ed8e7",
            weight: 0,
            fillColor: state.basemap === "blank" ? "#f6f8f3" : "#9ed8e7",
            fillOpacity: state.basemap === "satellite" ? 0.78 : 0.9
          }
        }).addTo(state.leafletStaticArchiveLayer);
      };
      if (rebuildStaticLayers && state.landMaskData?.geometry) {
        L.geoJSON(state.landMaskData, {
          interactive: false,
          renderer: state.leafletCanvasRenderer || undefined,
          smoothFactor: 1.8,
          style: {
            color: "#7fc7e5",
            weight: 0,
            fillColor: "#7fc7e5",
            fillOpacity: state.basemap === "satellite" ? 0.34 : 0.28
          }
        }).addTo(state.leafletStaticArchiveLayer);
      }
      const viewportPointFilterCache = new WeakMap();
      const filterGeometryTypes = (collection, types) => ({
        type: "FeatureCollection",
        features: (collection.features || []).filter(feature => types.includes(feature.geometry?.type))
      });
      const filterViewportPoints = collection => {
        if (!viewportBounds) return collection;
        if (!collection || typeof collection !== "object") return { type: "FeatureCollection", features: [] };
        const cached = viewportPointFilterCache.get(collection);
        if (cached) return cached;
        const center = state.leafletMap?.getCenter?.();
        const priorityKey = state.leafletPriorityHoverKey || "";
        const priorityPoint = state.leafletPriorityHoverLngLat || null;
        const pointDistance = feature => {
          const coords = feature.geometry?.coordinates || [];
          if (!center || feature.geometry?.type !== "Point") return 0;
          const featureKey = hoverFeatureKey(feature);
          if (priorityKey && featureKey === priorityKey) return -100;
          if (priorityPoint) {
            const hoverDistance = Math.pow(Number(coords[0]) - Number(priorityPoint.lng), 2) + Math.pow(Number(coords[1]) - Number(priorityPoint.lat), 2);
            if (hoverDistance < 0.00005) return -50 + hoverDistance;
          }
          return Math.pow(Number(coords[0]) - Number(center.lng), 2) + Math.pow(Number(coords[1]) - Number(center.lat), 2);
        };
        const pointFeatures = [];
        const otherFeatures = [];
        for (const feature of collection.features || []) {
          if (feature.geometry?.type !== "Point") {
            otherFeatures.push(feature);
            continue;
          }
          const coords = feature.geometry?.coordinates || [];
          if (viewportBounds.contains([coords[1], coords[0]])) pointFeatures.push(feature);
        }
        const visiblePoints = pointLimit
          ? pointFeatures.sort((a, b) => pointDistance(a) - pointDistance(b)).slice(0, pointLimit)
          : pointFeatures;
        const filtered = {
          type: "FeatureCollection",
          features: [...otherFeatures, ...visiblePoints]
        };
        viewportPointFilterCache.set(collection, filtered);
        return filtered;
      };
      const withoutCustomIconPoints = collection => ({
        type: "FeatureCollection",
        features: (collection.features || []).filter(feature => feature.geometry?.type !== "Point" || feature.properties?.has_custom_icon !== true)
      });
      const addLabels = (collection, className, width = 130, anchorY = 18, targetLayer = state.leafletStaticArchiveLayer, source = "Territory / polygon", viewportOnly = true) => {
        if (!targetLayer) return;
        const visibleCollection = viewportOnly ? filterViewportPoints(collection) : collection;
        for (const feature of (visibleCollection.features || [])) {
          const coords = feature.geometry?.coordinates;
          if (!coords || feature.geometry?.type !== "Point") continue;
          const title = displayFeatureTitle(feature.properties || {});
          if (!title) continue;
          const normalizedTitle = normalizeComparisonText(title);
          if (labelCollisionState.titles.has(normalizedTitle)) continue;
          const placement = placeLeafletLabel(coords, width, anchorY, labelCollisionState, Boolean(className));
          if (!placement) continue;
          labelCollisionState.boxes.push(placement.box);
          labelCollisionState.titles.add(normalizedTitle);
          const marker = L.marker(placement.latLng, {
            interactive: true,
            zIndexOffset: 650,
            icon: L.divIcon({
              className: `leaflet-polygon-label ${className || ""}`.trim(),
              html: escapeHtml(title),
              iconSize: [width, 36],
              iconAnchor: [width / 2, anchorY]
            })
          }).addTo(targetLayer);
          bindLeafletFeature(feature, marker, source);
        }
      };
      const pointDripQueue = [];
      const enqueuePointCollection = (collection, source, priority = 20) => {
        for (const feature of (collection.features || [])) {
          if (feature.geometry?.type !== "Point" || !feature.geometry?.coordinates) continue;
          pointDripQueue.push({
            priority,
            distance: leafletPointDistanceFromCenter(feature),
            create: () => createLeafletFeaturePoint(feature, source)
          });
        }
      };
      const enqueueAttentionMarkers = collection => {
        for (const feature of (collection.features || [])) {
          if (feature.geometry?.type !== "Point" || !feature.geometry?.coordinates) continue;
          pointDripQueue.push({
            priority: 4,
            distance: leafletPointDistanceFromCenter(feature),
            create: () => createLeafletAttentionPoint(feature)
          });
        }
      };
      const addBiographyPaths = () => {
        const data = allBiographyPathFeatureCollection({ enabled: biographyPathsEnabled() });
        const lineFeatures = (data.features || []).filter(feature => ["LineString", "MultiLineString"].includes(feature.geometry?.type));
        const pointFeatures = (data.features || []).filter(feature => feature.geometry?.type === "Point");
        lineFeatures.forEach(feature => {
          const coords = feature.geometry?.type === "MultiLineString"
            ? (feature.geometry?.coordinates || []).map(line => line.map(([lng, lat]) => [lat, lng]))
            : (feature.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]);
          if (coords.length < 2) return;
          const line = L.polyline(coords, {
            color: "#59605c",
            weight: 3,
            opacity: 0.58,
            dashArray: "6 5",
            renderer: state.leafletCanvasRenderer || undefined,
            interactive: true
          }).addTo(state.leafletPathArchiveLayer || state.leafletArchiveLayer);
          bindLeafletFeature(feature, line, "Biography path");
        });
        pointFeatures.forEach(feature => {
          const coords = feature.geometry?.coordinates;
          if (!coords) return;
          const label = feature.properties?.pin_label || feature.properties?.label || "";
          const marker = L.marker([coords[1], coords[0]], {
            interactive: true,
            zIndexOffset: 2800,
            icon: L.divIcon({
              className: "biography-path-leaflet-label biography-path-leaflet-label-global",
              html: `<span class="biography-path-map-label">${escapeHtml(label)}</span>`,
              iconSize: [270, 42],
              iconAnchor: [135, 21]
            })
          }).addTo(state.leafletPathArchiveLayer || state.leafletArchiveLayer);
          bindLeafletFeature(feature, marker, "Biography path");
        });
      };
      const addBiographyPeople = () => {
        const biographySignature = leafletBiographyPeopleSignature();
        if (
          state.leafletBiographyPeopleLayer &&
          state.leafletBiographyPersonMarkers?.length &&
          state.leafletBiographyPeopleSignature === biographySignature
        ) {
          updateBiographyPeopleLayer(performance.now());
          state.leafletBiographyPeopleLayer.bringToFront?.();
          return;
        }
        if (state.leafletBiographyPeopleLayer) {
          state.leafletBiographyPeopleLayer.clearLayers();
        } else {
          state.leafletBiographyPeopleLayer = L.layerGroup().addTo(state.leafletMap);
        }
        state.leafletBiographyPeopleSignature = biographySignature;
        state.leafletBiographyPersonMarkers = [];
        resetBiographyPeopleProgressiveLoad(biographySignature);
        const data = biographyPersonFeatureCollection();
        const showPersonLabels = leafletCurrentZoom() >= BIOGRAPHY_PERSON_LABEL_MIN_ZOOM;
        const biographyPersonLeafletIconHtml = feature => {
          const slug = feature.properties?.wiki_slug || "";
          const img = `<img src="${escapeHtml(BIOGRAPHY_PERSON_ICON_URL)}" alt="" height="${BIOGRAPHY_PERSON_ICON_MAX_PX}" data-biography-slug="${escapeHtml(slug)}" style="display:block;height:${BIOGRAPHY_PERSON_ICON_MAX_PX}px !important;width:auto !important;max-width:${BIOGRAPHY_PERSON_ICON_MAX_PX}px !important;max-height:${BIOGRAPHY_PERSON_ICON_MAX_PX}px !important;object-fit:contain;">`;
          const canoe = `<span class="biography-person-canoe" aria-hidden="true"></span>`;
          if (slug !== JEREMY_BIOGRAPHY_SLUG) return `<span class="biography-person-marker-shell" data-biography-slug="${escapeHtml(slug)}">${canoe}${img}</span>`;
          return `<span class="biography-person-marker-shell jeremy-biography-marker" data-biography-slug="${escapeHtml(slug)}">${canoe}${img}<span class="jeremy-bio-camera" aria-hidden="true"><span></span></span><span class="jeremy-bio-flash" aria-hidden="true"></span></span>`;
        };
        const features = (data.features || []).filter(feature => feature.geometry?.type === "Point" && feature.geometry?.coordinates);
        const addBiographyPersonFeature = feature => {
          const coords = feature.geometry?.coordinates;
          if (!coords || feature.geometry?.type !== "Point") return;
          const label = feature.properties?.map_label || feature.properties?.title || "";
          const opacity = Math.max(0, Math.min(1, numeric(feature.properties?.motion_opacity, 1)));
          const marker = L.marker([coords[1], coords[0]], {
            interactive: true,
            bubblingMouseEvents: false,
            zIndexOffset: 2200,
            icon: L.divIcon({
              className: `leaflet-biography-person-icon ${feature.properties?.camera_person === "true" ? "is-jeremy-biography" : ""}`.trim(),
              html: biographyPersonLeafletIconHtml(feature),
              iconSize: [BIOGRAPHY_PERSON_HIT_TARGET_PX, BIOGRAPHY_PERSON_HIT_TARGET_PX],
              iconAnchor: [BIOGRAPHY_PERSON_HIT_TARGET_PX / 2, BIOGRAPHY_PERSON_HIT_TARGET_PX / 2],
              popupAnchor: [0, -BIOGRAPHY_PERSON_ICON_MAX_PX / 2]
            })
          }).addTo(state.leafletBiographyPeopleLayer);
          const markerElement = marker.getElement?.();
          if (markerElement) {
            setLeafletBiographyPersonElementState(markerElement, feature, coords);
            markerElement.dataset.lng = String(coords[0]);
            markerElement.dataset.lat = String(coords[1]);
          }
          marker.setOpacity?.(opacity);
          bindLeafletFeature(feature, marker, "Biography");
          let labelMarker = null;
          let quoteMarker = null;
          if (label) {
            labelMarker = L.marker([coords[1], coords[0]], {
              interactive: true,
              zIndexOffset: 2180,
              icon: L.divIcon({
                className: "leaflet-polygon-label detail leaflet-biography-person-label",
                html: biographyPersonLeafletLabelHtml(feature),
                iconSize: [196, 50],
                iconAnchor: [98, 52]
              })
            }).addTo(state.leafletBiographyPeopleLayer);
            labelMarker.setOpacity?.(showPersonLabels ? opacity : 0);
            setLeafletMarkerPointerEvents(labelMarker, showPersonLabels && opacity > 0.05);
            bindLeafletFeature(feature, labelMarker, "Biography");
          }
          if (feature.properties?.has_quote === "true" && feature.properties?.quote_text) {
            quoteMarker = L.marker([coords[1], coords[0]], {
              interactive: true,
              zIndexOffset: 2190,
              icon: L.divIcon({
                className: "leaflet-biography-person-quote",
                html: biographyPersonLeafletQuoteHtml(feature),
                iconSize: [230, 1],
                iconAnchor: [115, 36]
              })
            }).addTo(state.leafletBiographyPeopleLayer);
            const quoteOpacity = Math.max(0, Math.min(1, numeric(feature.properties?.quote_opacity, 0)));
            const quoteVisible = showPersonLabels && feature.properties?.quote_visible === "true" && String(feature.properties?.quote_typed_text || "").trim();
            quoteMarker.setOpacity?.(quoteVisible ? opacity * quoteOpacity : 0);
            setLeafletMarkerPointerEvents(quoteMarker, quoteVisible && opacity > 0.05);
            if (!quoteVisible) quoteMarker.getElement?.()?.setAttribute("aria-hidden", "true");
            bindLeafletFeature(feature, quoteMarker, "Biography quote");
          }
          state.leafletBiographyPersonMarkers.push({ slug: feature.properties?.wiki_slug || "", marker, labelMarker, quoteMarker, feature });
        };
        scheduleBiographyPeopleProgressiveLoad(features.map(feature => feature.properties?.wiki_slug || ""), {
          onStep: slug => {
            const feature = features.find(item => item.properties?.wiki_slug === slug);
            if (feature) addBiographyPersonFeature(feature);
            state.leafletBiographyPeopleLayer.bringToFront?.();
            updateBiographyPeopleLayer(performance.now());
          }
        });
      };
      const managedFeatures = filteredManagedSiteFeatures();
      const zoom = leafletCurrentZoom();
      const managedPolygonFeatures = filterGeometryTypes(managedFeatures, ["Polygon", "MultiPolygon"]);
      const managedTerritoryPolygonFeatures = {
        type: "FeatureCollection",
        features: (managedPolygonFeatures.features || []).filter(isManagedTerritoryLabelFeature)
      };
      const managedDetailPolygonFeatures = {
        type: "FeatureCollection",
        features: (managedPolygonFeatures.features || []).filter(feature => !isManagedTerritoryLabelFeature(feature))
      };
      const managedPointFeatures = filterGeometryTypes(managedFeatures, ["Point"]);
      const managedPointFeaturesWithoutCustomIcons = withoutCustomIconPoints(managedPointFeatures);
      const markerFeatures = filteredMarkerFeatures();
      const customIconPointFeatures = filterByCategory(customSiteIconFeatures());
      if (!biographyOnly && rebuildStaticLayers && polygonToggle.checked) {
        const filteredPolygons = filteredPolygonFeatures();
        const importedBroadPolygons = {
          type: "FeatureCollection",
          features: (filteredPolygons.features || []).filter(feature => !feature.properties?.place_name_area_overlay && isBroadTerritoryFeature(feature))
        };
        const importedDetailPolygons = {
          type: "FeatureCollection",
          features: (filteredPolygons.features || []).filter(feature => !feature.properties?.place_name_area_overlay && !isBroadTerritoryFeature(feature))
        };
        addCollection(importedBroadPolygons, "Territory / polygon");
        addWaterMask();
        addCollection(gardinersMontaukettOverlayFeatures(), "Territory / polygon");
        addCollection(managedTerritoryPolygonFeatures, "Territory / polygon");
        addCollection(importedDetailPolygons, "Territory / polygon");
        addCollection(filteredPlaceNameAreaFeatures(), "Place Name Area");
        if (!polygonsOnly) {
          addCollection(managedDetailPolygonFeatures, "Map feature");
          addCollection(calendarEventFeatures(), "Calendar event");
        }
        addLabels(polygonLabelFeatures("territory"), "", 188);
        if (!polygonsOnly) addLabels(managedSiteTerritoryLabelFeatures(), "", 156);
        refreshLeafletPlaceNameAreaLabels(labelCollisionState);
        if (!polygonsOnly && !skipDetailLabels && zoom >= LEAFLET_DETAIL_LABEL_MIN_ZOOM) addLabels(polygonLabelFeaturesInLeafletBounds("detail", viewportBounds), "detail", 148);
        if (!polygonsOnly && !skipDetailLabels && zoom >= LEAFLET_MANAGED_LABEL_MIN_ZOOM) addLabels(managedSiteDetailLabelFeaturesInLeafletBounds(viewportBounds), "detail", 156);
      }
      if (!biographyOnly && !polygonsOnly && markerToggle?.checked !== false) {
        enqueueAttentionMarkers(filterViewportPoints(filterByCategory(siteAttentionFeatures())));
        enqueuePointCollection(filterViewportPoints(customIconPointFeatures), "Map pin", 8);
        enqueuePointCollection(filterViewportPoints(managedPointFeaturesWithoutCustomIcons), "Map feature", 12);
        enqueuePointCollection(filterViewportPoints(markerFeatures), "Map pin", 16);
        enqueuePointCollection(filterViewportPoints(calendarEventIconFeatures()), "Calendar event", 24);
        enqueuePointCollection(filterViewportPoints(mapStoryFeatures()), "Visitor story", 28);
        if (!skipDetailLabels && zoom >= SITE_POINT_LABEL_MIN_ZOOM) {
          addLabels(managedPointFeatures, "detail", 158, 44, state.leafletPointArchiveLayer);
          addLabels(markerFeatures, "detail", 158, 44, state.leafletPointArchiveLayer);
          addLabels(customIconPointFeatures, "detail", 158, 44, state.leafletPointArchiveLayer);
        }
        pointDripQueue.sort((a, b) => (a.priority - b.priority) || (a.distance - b.distance));
        if (options.allowStartupPins === true && state.leafletStartupPointDripUsed !== true) {
          state.leafletStartupPointDripUsed = true;
          startLeafletPointDrip(pointDripQueue);
        } else {
          for (const entry of pointDripQueue) {
            const marker = entry?.create?.();
            if (marker) marker.addTo(state.leafletPointArchiveLayer);
          }
        }
        state.leafletRenderedPointBounds = viewportOnly ? viewportBounds : null;
      }
      if ((biographyOnly || !polygonsOnly || includeBiographyPeople) && !skipBiographyPeople) {
        addBiographyPeople();
        scheduleBiographyPeopleAnimationStart(Number.isFinite(Number(options.biographyAnimationDelay)) ? Number(options.biographyAnimationDelay) : undefined);
      }
      if (!biographyOnly && !polygonsOnly) {
        if (rebuildStaticLayers && biographyPathsEnabled()) addBiographyPaths();
        ensureWhalingWhaleMarker();
        ensureMovingDogMarker();
      }
      if (state.leafletStartupFullRenderPending) scheduleLeafletStartupFullRender();
    }

    function loadMapboxRuntime() {
      if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
      if (mapboxRuntimePromise) return mapboxRuntimePromise;
      mapboxRuntimePromise = new Promise((resolve, reject) => {
        if (!document.querySelector('link[data-nli-mapbox-runtime]')) {
          const stylesheet = document.createElement("link");
          stylesheet.rel = "stylesheet";
          stylesheet.href = MAPBOX_GL_STYLESHEET_URL;
          stylesheet.dataset.nliMapboxRuntime = "1";
          document.head.appendChild(stylesheet);
        }
        const existing = document.querySelector('script[data-nli-mapbox-runtime]');
        const script = existing || document.createElement("script");
        const finish = () => window.mapboxgl
          ? resolve(window.mapboxgl)
          : reject(new Error("Mapbox GL loaded without exposing its runtime."));
        script.addEventListener("load", finish, { once: true });
        script.addEventListener("error", () => reject(new Error("Mapbox GL could not be loaded.")), { once: true });
        if (!existing) {
          script.src = MAPBOX_GL_SCRIPT_URL;
          script.async = true;
          script.dataset.nliMapboxRuntime = "1";
          document.head.appendChild(script);
        } else if (window.mapboxgl) {
          finish();
        }
      }).catch(error => {
        mapboxRuntimePromise = null;
        throw error;
      });
      return mapboxRuntimePromise;
    }

    async function initMap() {
      setLoadingMessage("Drawing the map layers.");
      if (USE_LEAFLET_PRIMARY) return initLeafletFallback("Leaflet is the primary map renderer.");
      if (!window.mapboxgl) {
        try {
          await loadMapboxRuntime();
        } catch (error) {
          return initLeafletFallback(error.message || "Mapbox GL did not load.");
        }
      }
      const baseLayer = findLayer("native-long-island-base-map");
      const styleJson = baseLayer?.style_json || {};
      mapboxgl.accessToken = styleJson.publicToken;
      return new Promise(resolve => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        const fallback = message => {
          if (settled) return;
          settled = true;
          try { state.map?.remove(); } catch {}
          initLeafletFallback(message).then(resolve);
        };
        try {
          state.map = new mapboxgl.Map({
            container: "map",
            style: styleJson.styleUrl || FALLBACK_STYLE,
            center: [-72.85, 40.82],
            zoom: 9.05,
            minZoom: 5.5,
            attributionControl: true,
            failIfMajorPerformanceCaveat: false
          });
        } catch (error) {
          fallback(error.message);
          return;
        }
        state.map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
        state.map.on("load", () => {
          window.requestAnimationFrame(() => {
            addArchiveLayers()
              .then(waitForMapboxPaintAfterArchiveLayers)
              .then(finish)
              .catch(error => {
                console.warn("Archive layers failed to finish loading.", error);
                showBanner("The map loaded, but some archive layers are still catching up.");
                waitForNextPaint(1).then(finish);
              });
          });
        });
        state.map.on("error", event => {
          const message = event?.error?.message || "";
          if (/webgl|failed to initialize/i.test(message)) {
            fallback(message);
            return;
          }
          if (message.toLowerCase().includes("style")) {
            showBanner("The map style had trouble loading. Site articles are still available in the article panel after the map loads.");
          }
          window.setTimeout(finish, 800);
        });
      });
    }

    function closeArticlePanel() {
      restoreArticleHeroToBody();
      clearBiographyPathOverlay();
      articleEl.classList.remove("open");
      document.body.classList.remove("article-panel-open");
      state.activityHiddenForArticle = true;
      renderActivityPanel();
      window.requestAnimationFrame(syncFloatingPanelLayout);
      state.activeContent = null;
      state.panelHistory = [];
      setTimelineContextEvents([]);
      setActiveTimelineEvent(null);
      updateBackButton();
      const url = new URL(window.location.href);
      ["site", "wiki", "event", "calendar", "page", "blog"].forEach(key => url.searchParams.delete(key));
      window.history.replaceState(null, "", url);
    }

    closeArticleBtn.addEventListener("click", closeArticlePanel);
    backArticleBtn.addEventListener("click", restorePreviousPanel);
    siteTitleRotatorEl?.addEventListener("click", openLanguageWikiFromTitle);
    learnPathsToggleEl?.addEventListener("click", () => {
      if (activeGuidedLearningPath()) return;
      state.guidedPathsExpanded = !state.guidedPathsExpanded;
      renderGuidedPathsUi();
      scheduleResponsiveTopbar();
      if (state.guidedPathsExpanded) ensureGuidedLearningPathsFromDirectus();
      if (state.guidedPathsExpanded) guidedPathsEl?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
    expandArticleBtn.addEventListener("click", () => {
      articleEl.classList.toggle("expanded");
      const expanded = articleEl.classList.contains("expanded");
      expandArticleBtn.setAttribute("aria-label", expanded ? "Shrink article panel" : "Expand article panel");
      expandArticleBtn.setAttribute("title", expanded ? "Shrink article panel" : "Expand article panel");
      expandArticleBtn.innerHTML = expanded ? ICONS.shrink : ICONS.expand;
    });
    searchEl.addEventListener("input", event => {
      handleSearchInput(event);
    });
    searchEl.addEventListener("search", event => {
      handleSearchInput(event);
    });
    searchEl.addEventListener("keydown", event => {
      handleSearchKeydown(event);
    });
    if (markerToggle) {
      markerToggle.checked = true;
      markerToggle.disabled = false;
      markerToggle.addEventListener("change", syncFilteredViews);
    }
    polygonToggle.addEventListener("change", syncFilteredViews);
    exhibitToggle?.addEventListener("change", syncFilteredViews);
    biographyPathsToggle?.addEventListener("change", syncFilteredViews);
    categoryToggles.forEach(input => input.addEventListener("change", syncFilteredViews));
    accessToggles.forEach(input => input.addEventListener("change", syncFilteredViews));
    eraToggles.forEach(input => input.addEventListener("change", () => syncFilteredViews({ timeline: true })));
    themeToggles.forEach(input => input.addEventListener("change", () => syncFilteredViews({ timeline: true })));
    basemapSelect.addEventListener("change", () => setBasemap(basemapSelect.value));
    suggestMapPickCancelBtn?.addEventListener("click", () => {
      setSuggestionMapPickMode(false);
      markArticlePanelOpen();
      updateBackButton();
    });
    timelineCollapseBtn.addEventListener("click", () => {
      timelineDockEl.classList.toggle("collapsed");
      const collapsed = timelineDockEl.classList.contains("collapsed");
      if (collapsed) {
        timelineDockEl.classList.remove("large");
        document.body.classList.remove("timeline-large");
      }
      document.body.classList.toggle("timeline-collapsed", collapsed);
      repairTimelineControls();
      timelineCollapseBtn.setAttribute("aria-label", collapsed ? "Expand timeline" : "Collapse timeline");
      timelineCollapseBtn.setAttribute("title", collapsed ? "Expand timeline" : "Collapse timeline");
    });
    timelineZoomInBtn.addEventListener("click", () => changeTimelineZoom(1));
    timelineZoomOutBtn.addEventListener("click", () => changeTimelineZoom(-1));
    timelinePrevBtn.addEventListener("click", () => stepTimeline(-1));
    timelineNextBtn.addEventListener("click", () => stepTimeline(1));
    timelineExpandBtn.addEventListener("click", () => {
      if (timelineDockEl.classList.contains("collapsed")) {
        timelineDockEl.classList.remove("collapsed");
        document.body.classList.remove("timeline-collapsed");
      }
      timelineDockEl.classList.toggle("large");
      const large = timelineDockEl.classList.contains("large");
      document.body.classList.toggle("timeline-large", large);
      repairTimelineControls();
      timelineExpandBtn.setAttribute("aria-label", large ? "Shrink timeline" : "Expand timeline");
      timelineExpandBtn.setAttribute("title", large ? "Shrink timeline" : "Expand timeline");
      const renderExpandedTimeline = async () => {
        if (large && !state.timelineEvents?.length) {
          timelineSummaryEl.textContent = "Loading historic moments...";
          await requestFullArchiveData("timeline-expand").catch(error => console.warn("Timeline moments will keep loading in the background.", error));
        }
        if (large) setMobileTimelineDefaultView();
        renderTimelineDock();
      };
      renderExpandedTimeline();
    });
    articleResizeHandle.addEventListener("pointerdown", event => {
      if (window.matchMedia("(max-width: 700px)").matches) return;
      event.preventDefault();
      articleEl.classList.add("resizing");
      articleEl.classList.remove("expanded");
      articleResizeHandle.setPointerCapture?.(event.pointerId);
      const move = moveEvent => setArticlePanelWidth(moveEvent.clientX - articleEl.getBoundingClientRect().left);
      const up = () => {
        articleEl.classList.remove("resizing");
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        document.removeEventListener("pointercancel", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
      document.addEventListener("pointercancel", up);
    });
    timelinePanEl.addEventListener("input", () => {
      setTimelineZoom(timelinePanEl.value);
    });
    document.addEventListener("click", event => {
      if (event.target?.closest?.("[data-learning-path-toggle], [data-learning-path-start], [data-learning-path-exit], [data-learning-path-overview], [data-learning-path-complete], [data-learning-path-next], [data-learning-path-prev], [data-learning-path-filter-toggle], [data-learning-path-stop], [data-learning-path-resume]")) {
        if (handleGuidedLearningPathClick(event)) {
          event.preventDefault();
          return;
        }
      }
      const quoteWikiLink = event.target?.closest?.("[data-quote-ticker-wiki]");
      if (quoteWikiLink?.dataset.quoteTickerWiki) {
        event.preventDefault();
        const slug = quoteWikiLink.dataset.quoteTickerWiki;
        requestFullArchiveData()
          .then(() => {
            const article = state.wikiBySlug.get(slug);
            if (article) openWikiArticle(article, { source: "Quote ticker" });
            else window.location.href = `?wiki=${encodeURIComponent(slug)}`;
          })
          .catch(() => { window.location.href = `?wiki=${encodeURIComponent(slug)}`; });
        return;
      }
      if (event.target?.closest?.("[data-clear-address-marker]")) {
        clearAddressMarker();
      }
      if (!event.target?.closest?.(".search-wrap")) {
        closeSuggestions();
      }
    });
    timelineTrackEl.addEventListener("click", event => {
      const card = event.target.closest("[data-timeline-id]");
      if (card) {
        event.preventDefault();
        openTimelineEvent(card.dataset.timelineId);
      }
    });
    timelineTrackEl.addEventListener("mouseover", event => {
      const card = event.target.closest("[data-timeline-id]");
      if (card) setActiveTimelineEvent(card.dataset.timelineId, { scrollTimeline: false });
    });
    timelineTrackEl.addEventListener("mousemove", event => updateTimelineSensitivity(event.clientX));
    timelineTrackEl.addEventListener("wheel", event => {
      event.preventDefault();
      const verticalWheel = Math.abs(event.deltaY) >= Math.abs(event.deltaX);
      if (verticalWheel) {
        changeTimelineZoom(event.deltaY > 0 ? -0.45 : 0.45);
      } else if (event.ctrlKey || event.metaKey) {
        changeTimelineZoom(event.deltaY > 0 ? -1 : 1);
      } else {
        const direction = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if ((state.timelineZoom || 1) <= 1) changeTimelineZoom(1);
        panTimeline(direction * 0.18);
      }
    }, { passive: false });
    timelineTrackEl.addEventListener("pointerdown", event => {
      if (event.target.closest("[data-timeline-id]")) return;
      if (event.target.closest("[data-era-toggle]")) return;
      if ((state.timelineZoom || 1) <= 1) changeTimelineZoom(1);
      state.timelineDragging = true;
      state.timelineDragStartX = event.clientX;
      state.timelineDragStartPan = state.timelinePan || 0;
      timelineTrackEl.classList.add("dragging");
      timelineTrackEl.setPointerCapture?.(event.pointerId);
    });
    timelineTrackEl.addEventListener("pointermove", event => {
      if (!state.timelineDragging) return;
      const box = timelineTrackEl.getBoundingClientRect();
      if (!box.width) return;
      const zoom = state.timelineZoom || 1;
      const maxShift = zoom <= 1 ? 0 : ((zoom - 1) / zoom) * 100;
      const deltaPercent = ((state.timelineDragStartX - event.clientX) / box.width) * 100 / zoom;
      state.timelinePan = Math.max(0, Math.min(maxShift, state.timelineDragStartPan + deltaPercent));
      applyTimelineZoom();
    });
    timelineTrackEl.addEventListener("pointerup", () => {
      state.timelineDragging = false;
      timelineTrackEl.classList.remove("dragging");
      if (shouldWindowTimelineEvents()) renderTimelineDock();
    });
    timelineTrackEl.addEventListener("pointercancel", () => {
      state.timelineDragging = false;
      timelineTrackEl.classList.remove("dragging");
      if (shouldWindowTimelineEvents()) renderTimelineDock();
    });
    timelineTrackEl.addEventListener("mouseleave", () => {
      state.timelineDragging = false;
      timelineTrackEl.classList.remove("dragging");
      timelineTrackEl.querySelectorAll(".timeline-card.near").forEach(card => card.classList.remove("near"));
    });
    document.addEventListener("mousemove", event => {
      const box = timelineTrackEl.getBoundingClientRect();
      const insideTimeline = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      if (insideTimeline) updateTimelineSensitivity(event.clientX);
    });
    document.addEventListener("click", event => {
      for (const menu of document.querySelectorAll(".layer-menu[open], .more-menu[open], body.nav-collapsed .main-menu[open]")) {
        if (!menu.contains(event.target)) menu.removeAttribute("open");
      }
    });
    document.querySelectorAll(".layer-menu, .more-menu").forEach(menu => {
      menu.addEventListener("toggle", () => {
        if (!menu.open) return;
        document.querySelectorAll(".layer-menu[open], .more-menu[open]").forEach(other => {
          if (other !== menu) other.removeAttribute("open");
        });
      });
    });
    navButtons.forEach(button => {
      button.addEventListener("click", () => {
        openContentList(button.dataset.view);
        button.closest(".more-menu")?.removeAttribute("open");
        if (document.body.classList.contains("nav-collapsed")) mainMenuEl?.removeAttribute("open");
        if (window.matchMedia("(max-width: 420px)").matches) controlMenu?.removeAttribute("open");
      });
    });
    if (window.matchMedia("(max-width: 420px)").matches) controlMenu?.removeAttribute("open");
    activityCollapseBtn?.addEventListener("click", () => {
      state.activityForceOpen = false;
      localStorage.setItem("nli-latest-activity-hidden", "1");
      renderActivityPanel();
    });
    activityRestoreBtn?.addEventListener("click", () => {
      localStorage.removeItem("nli-latest-activity-hidden");
      localStorage.removeItem("nli-latest-activity-collapsed");
      state.activityHiddenForArticle = false;
      state.activityForceOpen = true;
      markActivitySeen();
      renderActivityPanel();
    });
    activityBodyEl?.addEventListener("click", event => {
      const item = event.target.closest("[data-activity-kind]");
      if (item) openActivityItem(item);
    });
    notificationRestoreBtn?.addEventListener("click", () => {
      state.notificationPanelOpen = !state.notificationPanelOpen;
      if (state.notificationPanelOpen) markNotificationsSeen();
      renderNotificationPanel();
    });
    notificationCloseBtn?.addEventListener("click", () => {
      state.notificationPanelOpen = false;
      renderNotificationPanel();
    });
    notificationBodyEl?.addEventListener("click", event => {
      const actionButton = event.target.closest("[data-notification-action]");
      const card = event.target.closest("[data-notification-kind]");
      if (actionButton && card) {
        handleSuggestionReview(card.dataset.notificationId, actionButton.dataset.notificationAction);
        return;
      }
      if (event.target.closest("[data-open-notification]") && card) openNotificationItem(card);
    });
    window.addEventListener("resize", () => {
      if (window.matchMedia("(max-width: 860px)").matches) controlMenu?.removeAttribute("open");
      renderActivityPanel();
      renderNotificationPanel();
      syncFloatingPanelLayout();
    });
    new MutationObserver(() => {
      if (articleEl.classList.contains("open")) collapseActivityPanel();
    }).observe(articleEl, { attributes: true, attributeFilter: ["class"] });
    articleHeadEl.addEventListener("click", event => {
      const profileLink = event.target.closest("[data-open-profile]");
      if (profileLink?.dataset.openProfile) {
        openContributorProfile(profileLink.dataset.openProfile);
        return;
      }
      const siteLink = event.target.closest("[data-site-slug]");
      if (!siteLink) return;
      const site = state.siteBySlug.get(siteLink.dataset.siteSlug);
      if (site) openListing(site, { source: "Linked ancestral land" });
    });

    function closeTimelineSourceReferences(scope = document) {
      scope.querySelectorAll?.(".historic-moment.show-source, .timeline-item.show-source, .section.has-source.show-source")
        .forEach(item => item.classList.remove("show-source"));
      scope.querySelectorAll?.("[data-timeline-source-info][aria-expanded=\"true\"]")
        .forEach(button => button.setAttribute("aria-expanded", "false"));
      const focusedSourceButton = document.activeElement?.closest?.("[data-timeline-source-info]");
      focusedSourceButton?.blur?.();
    }

    function toggleTimelineSourceReference(button, container) {
      if (!button || !container) return;
      const wasOpen = container.classList.contains("show-source");
      closeTimelineSourceReferences(document);
      container.classList.toggle("show-source", !wasOpen);
      button.setAttribute("aria-expanded", String(!wasOpen));
      if (wasOpen) button.blur?.();
    }

    document.addEventListener("pointerdown", event => {
      if (event.target?.closest?.("[data-timeline-source-info], .timeline-source-popover")) return;
      closeTimelineSourceReferences(document);
    }, { capture: true });

    articleBodyEl.addEventListener("click", event => {
      if (event.target.closest("[data-learning-path-toggle], [data-learning-path-start], [data-learning-path-exit], [data-learning-path-overview], [data-learning-path-complete], [data-learning-path-next], [data-learning-path-prev], [data-learning-path-filter-toggle], [data-learning-path-stop], [data-learning-path-resume]")) {
        if (handleGuidedLearningPathClick(event)) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
      const discussion = event.target.closest(".discussion-section");
      const loginPanel = event.target.closest("[data-login-panel]");
      const quoteMarker = event.target.closest("[data-jump-quote-comment]");
      if (quoteMarker?.dataset.jumpQuoteComment) {
        jumpToQuoteComment(quoteMarker.dataset.jumpQuoteComment);
        return;
      }
      const quoteLink = event.target.closest("[data-jump-comment-quote]");
      if (quoteLink?.dataset.jumpCommentQuote) {
        jumpToCommentQuote(quoteLink.dataset.jumpCommentQuote);
        return;
      }
      const languageAnswer = event.target.closest("[data-language-answer]");
      if (languageAnswer) {
        answerLanguageQuiz(languageAnswer);
        return;
      }
      const searchPanelSuggestion = event.target.closest("[data-search-panel-suggestion]");
      if (searchPanelSuggestion) {
        const value = searchPanelSuggestion.dataset.searchPanelSuggestion || "";
        searchEl.value = value;
        openSearchResultsPanel(value);
        return;
      }
      const editorOpen = event.target.closest("[data-open-frontend-editor]");
      if (editorOpen) {
        openFrontendEditor(editorOpen.dataset.openFrontendEditor, editorOpen.dataset.editorSlug || "");
        return;
      }
      const editorCancel = event.target.closest("[data-cancel-frontend-editor]");
      if (editorCancel) {
        const form = editorCancel.closest("[data-frontend-editor]");
        const kind = form?.dataset.frontendEditor;
        const slug = form?.dataset.editorSlug;
        const item = activeEditableContent(kind, slug);
        if (kind === "wiki" && item) openWikiArticle(item, { focus: false, skipHistory: true, skipRoute: true });
        else if (item) openListing(item, { focus: false, skipHistory: true, skipRoute: true });
        return;
      }
      const languageClose = event.target.closest("[data-close-language-quiz]");
      if (languageClose) {
        languageQuizModalEl.hidden = true;
        return;
      }
      const languageQuizButton = event.target.closest("[data-language-quiz-id]");
      if (languageQuizButton) {
        openLanguageQuiz(languageQuizButton.dataset.languageQuizId, languageQuizButton.dataset.languageContentKey, languageQuizButton.dataset.languageContentTitle);
        return;
      }
      const profileLink = event.target.closest("[data-open-profile]");
      const sourceButton = event.target.closest("[data-timeline-source-info]");
      const contributorExpand = event.target.closest("[data-expand-contributor]");
      if (contributorExpand) {
        const card = contributorExpand.closest("[data-contributor-card]");
        const body = card?.querySelector("[data-contributor-card-body]");
        if (body) {
          const show = body.hasAttribute("hidden");
          body.hidden = !show;
          card.classList.toggle("expanded", show);
          contributorExpand.setAttribute("aria-expanded", show ? "true" : "false");
          contributorExpand.textContent = show ? "Hide profile" : "View profile";
          if (show) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
        return;
      }
      if (sourceButton) {
        event.preventDefault();
        event.stopPropagation();
        const item = sourceButton.closest(".historic-moment, .timeline-item, .section.has-source");
        const reference = sourceButton.dataset.sourceReference || "";
        const mobileLike = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || matchMedia("(pointer: coarse)").matches;
        if (mobileLike) {
          toggleTimelineSourceReference(sourceButton, item);
          return;
        }
        if (reference) {
          const markCopied = () => {
            item?.classList.add("source-copied");
            window.clearTimeout(item?._sourceCopiedTimer);
            if (item) {
              item._sourceCopiedTimer = window.setTimeout(() => item.classList.remove("source-copied"), 1300);
            }
          };
          navigator.clipboard?.writeText(reference).then(markCopied).catch(() => {
            const fallback = document.createElement("textarea");
            fallback.value = reference;
            fallback.setAttribute("readonly", "");
            fallback.style.position = "fixed";
            fallback.style.left = "-9999px";
            document.body.appendChild(fallback);
            fallback.select();
            document.execCommand("copy");
            fallback.remove();
            markCopied();
          });
        }
        return;
      }
      const relatedMore = event.target.closest("[data-related-sites-more]");
      if (relatedMore) {
        const section = relatedMore.closest(".related-sites-section");
        section?.querySelectorAll(".related-site-extra[hidden]").forEach(item => { item.hidden = false; });
        relatedMore.hidden = true;
        return;
      }
      const biographyPathPlace = event.target.closest("[data-biography-path-index]");
      if (biographyPathPlace) {
        const article = state.activeContent?.type === "wiki" ? state.wikiBySlug.get(state.activeContent.slug) : null;
        if (focusBiographyPathPlace(state.activeBiographyPath || article, biographyPathPlace.dataset.biographyPathIndex, { zoom: 12.2, duration: 720 })) {
          biographyPathPlace.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
        return;
      }
      if (profileLink?.dataset.openProfile) {
        openContributorProfile(profileLink.dataset.openProfile);
        return;
      }
      const storyVote = event.target.closest("[data-story-vote]");
      if (storyVote?.dataset.storyId) {
        voteMapStory(storyVote.dataset.storyId, storyVote.dataset.storyVote);
        return;
      }
      const storySite = event.target.closest("[data-story-site]");
      if (storySite?.dataset.storySite && state.siteBySlug.has(storySite.dataset.storySite)) {
        openListing(state.siteBySlug.get(storySite.dataset.storySite), { source: "Map story" });
        return;
      }
      const checkInButton = event.target.closest("[data-check-in-site]");
      if (checkInButton?.dataset.checkInSite) {
        const site = state.siteBySlug.get(checkInButton.dataset.checkInSite);
        if (site) checkInAtSite(site);
        return;
      }
      const pointsToggle = event.target.closest("[data-toggle-points]");
      if (pointsToggle) {
        const profileCard = pointsToggle.closest(".public-profile-card");
        const collapsedProfileBody = profileCard?.querySelector("[data-contributor-card-body][hidden]");
        if (collapsedProfileBody) {
          collapsedProfileBody.hidden = false;
          profileCard.classList.add("expanded");
          const expandButton = profileCard.querySelector("[data-expand-contributor]");
          if (expandButton) {
            expandButton.setAttribute("aria-expanded", "true");
            expandButton.textContent = "Hide profile";
          }
        }
        const breakdown = pointsToggle.closest(".public-profile-card, .contributor-login-panel, .section")?.querySelector("[data-points-breakdown]");
        if (breakdown) {
          const show = breakdown.hasAttribute("hidden");
          breakdown.hidden = !show;
          pointsToggle.setAttribute("aria-expanded", show ? "true" : "false");
          const label = pointsToggle.querySelector("em");
          if (label) label.textContent = show ? "Hide details" : "Details";
        }
        return;
      }
      const languageToggle = event.target.closest("[data-show-profile-language]");
      if (languageToggle) {
        const scope = languageToggle.closest(".public-profile-card, .contributor-login-panel, .section") || articleBodyEl;
        const language = scope.querySelector("[data-profile-language]");
        if (language) {
          const show = language.hasAttribute("hidden");
          language.hidden = !show;
          language.setAttribute("aria-hidden", show ? "false" : "true");
          languageToggle.setAttribute("aria-expanded", show ? "true" : "false");
          if (show) language.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
        return;
      }
      const commentsToggle = event.target.closest("[data-show-profile-comments]");
      if (commentsToggle) {
        const scope = commentsToggle.closest(".public-profile-card, .contributor-login-panel, .section") || articleBodyEl;
        const comments = scope.querySelector("[data-profile-comments]");
        if (comments) {
          const show = comments.hasAttribute("hidden");
          comments.hidden = !show;
          commentsToggle.setAttribute("aria-expanded", show ? "true" : "false");
          if (show) comments.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
        return;
      }
      const discussionToggle = event.target.closest("[data-toggle-discussion]");
      if (discussionToggle && discussion) {
        const panel = discussion.querySelector("[data-discussion-panel]");
        const expanded = panel?.hasAttribute("hidden");
        if (panel) panel.hidden = !expanded;
        discussionToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
        if (expanded) panel?.querySelector("[data-discussion-input], [data-login-email]")?.focus();
        return;
      }
      const shareToggle = event.target.closest("[data-toggle-share]");
      if (shareToggle && discussion) {
        const panel = discussion.querySelector("[data-share-panel]");
        const expanded = panel?.hasAttribute("hidden");
        if (panel) panel.hidden = !expanded;
        shareToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
        return;
      }
      const copyButton = event.target.closest("[data-copy-share]");
      if (copyButton) {
        const url = copyButton.dataset.copyShare || window.location.href;
        navigator.clipboard?.writeText(url)
          .then(() => showBanner("Article link copied."))
          .catch(() => {
            const fallback = document.createElement("textarea");
            fallback.value = url;
            fallback.setAttribute("readonly", "");
            fallback.style.position = "fixed";
            fallback.style.left = "-9999px";
            document.body.appendChild(fallback);
            fallback.select();
            document.execCommand("copy");
            fallback.remove();
            showBanner("Article link copied.");
          });
        return;
      }
      if (event.target.closest("[data-contributor-login-panel]") && loginPanel) {
        loginContributorFromSection(loginPanel).catch(error => showBanner(error.message || "Contributor login failed."));
        return;
      }
      if (event.target.closest("[data-register-contributor]") && loginPanel) {
        registerContributorFromSection(loginPanel).catch(error => showBanner(error.message || "Could not create contributor account request."));
        return;
      }
      const inviteButton = event.target.closest("[data-send-account-invite]");
      if (inviteButton) {
        sendContributorInviteFromSection(inviteButton.closest(".contributor-invite-panel") || loginPanel || articleBodyEl).catch(error => showBanner(error.message || "Could not send invite."));
        return;
      }
      if (event.target.closest("[data-password-reset-submit]") && loginPanel) {
        requestContributorPasswordReset(loginPanel).catch(error => showBanner(error.message || "Could not request password reset."));
        return;
      }
      if (event.target.closest("[data-password-reset-complete]") && loginPanel) {
        completeContributorPasswordReset(loginPanel).catch(error => showBanner(error.message || "Could not update password."));
        return;
      }
      if (event.target.closest("[data-logout-contributor]")) {
        saveContributorSession(null);
        showBanner("Contributor logged out.");
        openContributorLogin();
        return;
      }
      if (event.target.closest("[data-view-profiles]")) {
        openContentList("contributors");
        return;
      }
      if (event.target.closest("[data-view-login]")) {
        openContentList("login");
        return;
      }
      const suggestionPanel = event.target.closest("[data-site-suggestion-panel]");
      if (event.target.closest("[data-click-suggest-location]") && suggestionPanel) {
        if (!state.map && !state.leafletMap) {
          setInlineStatus(suggestionPanel, "[data-suggest-status]", "The map is still loading.", "error");
          return;
        }
        setSuggestionMapPickMode(true);
        return;
      }
      if (event.target.closest("[data-use-current-location]") && suggestionPanel) {
        useCurrentLocationForSuggestion(suggestionPanel);
        return;
      }
      if (event.target.closest("[data-submit-site-suggestion]") && suggestionPanel) {
        submitSiteSuggestionDesktop(suggestionPanel);
        return;
      }
      const profileEditor = event.target.closest("[data-profile-editor]");
      if (event.target.closest("[data-save-contributor-profile]") && profileEditor) {
        saveContributorProfile(profileEditor);
        return;
      }
      if (event.target.closest("[data-contributor-login]") && discussion) {
        loginContributorFromSection(discussion).catch(error => showBanner(error.message || "Contributor login failed."));
        return;
      }
      if (event.target.closest("[data-submit-discussion]") && discussion) {
        submitDiscussion(discussion).catch(error => showBanner(error.message || "Could not submit comment."));
        return;
      }
      const contactForm = event.target.closest("[data-contact-form]");
      const supportForm = event.target.closest("[data-support-form]");
      const adoptPlaceButton = event.target.closest("[data-adopt-place]");
      if (adoptPlaceButton) {
        openAdoptPlace(adoptPlaceButton);
        return;
      }
      if (event.target.closest("[data-support-submit]") && supportForm) {
        submitSupportPayment(supportForm);
        return;
      }
      if (event.target.closest("[data-upload-feedback-screenshot]") && contactForm) {
        contactForm.querySelector("[data-feedback-screenshot]")?.click();
        return;
      }
      if (event.target.closest("[data-capture-feedback-screenshot]") && contactForm) {
        captureFeedbackScreenshot(contactForm).catch(error => {
          const status = contactForm.querySelector("[data-feedback-screenshot-status]");
          if (status) status.textContent = error.message || "Could not capture screenshot. Upload one instead.";
          showBanner(error.message || "Could not capture screenshot. Upload one instead.");
        });
        return;
      }
      if (event.target.closest("[data-submit-contact]") && contactForm) {
        submitContactMessage(contactForm).catch(error => {
          setInlineStatus(contactForm, "[data-contact-status]", error.message || "Could not send message.", "error");
          showBanner(error.message || "Could not send message.");
        });
        return;
      }
      const voteButton = event.target.closest("[data-comment-vote]");
      if (voteButton?.dataset.commentId) {
        setCommentReaction(voteButton.dataset.commentId, voteButton.dataset.commentVote).catch(error => showBanner(error.message || "Could not save comment vote."));
        return;
      }
      const deleteCommentButton = event.target.closest("[data-delete-comment]");
      if (deleteCommentButton?.dataset.deleteComment) {
        deleteOwnComment(deleteCommentButton.dataset.deleteComment).catch(error => showBanner(error.message || "Could not delete comment."));
        return;
      }
      const replyButton = event.target.closest("[data-reply-comment]");
      if (replyButton && discussion) {
        discussion.querySelector("[data-parent-comment]").value = replyButton.dataset.replyComment || "";
        discussion.querySelector("[data-reply-to-profile]").value = replyButton.dataset.replyProfile || "";
        const input = discussion.querySelector("[data-discussion-input]");
        const cancel = discussion.querySelector("[data-cancel-reply]");
        const context = discussion.querySelector("[data-reply-context]");
        const name = replyButton.closest(".comment")?.querySelector(".comment-profile-name")?.textContent?.trim() || "comment";
        if (context) {
          context.textContent = `Replying to ${name}`;
          context.classList.add("show");
        }
        if (cancel) cancel.hidden = false;
        if (input) {
          input.placeholder = "Write a reply";
          input.focus();
        }
        return;
      }
      if (event.target.closest("[data-cancel-reply]") && discussion) {
        discussion.querySelector("[data-parent-comment]").value = "";
        discussion.querySelector("[data-reply-to-profile]").value = "";
        const input = discussion.querySelector("[data-discussion-input]");
        if (input) input.placeholder = "Add a comment or reply";
        const context = discussion.querySelector("[data-reply-context]");
        if (context) {
          context.textContent = "";
          context.classList.remove("show");
        }
        event.target.closest("[data-cancel-reply]").hidden = true;
        return;
      }
      const moment = event.target.closest("[data-event-id]");
      if (moment) {
        setActiveTimelineEvent(moment.dataset.eventId, { scrollTimeline: true });
      }
      const image = event.target.closest("img");
      if (image) {
        event.preventDefault();
        openMediaViewer(image);
        return;
      }
      const contentCard = event.target.closest("[data-content-slug]");
      if (contentCard) {
        const item = state.contentBySlug.get(contentCard.dataset.contentSlug);
        if (item) openSiteContent(item, { source: item.content_type === "post" ? "Blog post" : "Site page" });
        return;
      }
      const blogCard = event.target.closest("[data-blog-slug]");
      if (blogCard) {
        const item = state.blogBySlug.get(blogCard.dataset.blogSlug);
        if (item) openBlogPost(item, { source: "Blog post" });
        return;
      }
      const eventCard = event.target.closest("[data-calendar-slug]");
      if (eventCard) {
        const item = state.eventBySlug.get(eventCard.dataset.calendarSlug);
        if (item) openCalendarEvent(item, { source: "Calendar / On View" });
        return;
      }
      const wikiCard = event.target.closest("[data-wiki-slug]");
      if (wikiCard) {
        const article = state.wikiBySlug.get(wikiCard.dataset.wikiSlug);
        if (article) openWikiArticle(article, { source: "Knowledgebase" });
        return;
      }
      const siteListFilter = event.target.closest("[data-site-list-filter]");
      if (siteListFilter) {
        toggleSiteListFilter(siteListFilter.dataset.siteListFilter, siteListFilter.dataset.siteListFilterValue);
        return;
      }
      const siteCard = event.target.closest("[data-site-slug]");
      if (siteCard) {
        const site = state.siteBySlug.get(siteCard.dataset.siteSlug);
        if (site) {
          const source = siteCard.closest(".site-list") ? "Site List" : "Knowledgebase";
          openListing(site, { source });
          if (siteCard.dataset.jumpComment) revealActivityComment(siteCard.dataset.jumpComment);
        }
        return;
      }
      const kbCategory = event.target.closest("[data-kb-category]");
      if (kbCategory) {
        openKnowledgebaseCategory(kbCategory.dataset.kbCategory);
        return;
      }
      const kbTag = event.target.closest("[data-kb-tag]");
      if (kbTag) {
        openKnowledgebaseTag(kbTag.dataset.kbTag);
        return;
      }
      const link = event.target.closest("a");
      if (!link) return;
      const href = internalHref(link.getAttribute("href"));
      if (!href) return;
      event.preventDefault();
      const wikiSlug = href.match(/^#wiki\/(.+)$/)?.[1];
      if (wikiSlug && state.wikiBySlug.has(wikiSlug)) {
        openWikiArticle(state.wikiBySlug.get(wikiSlug), { source: "Linked knowledgebase article" });
        return;
      }
      const listingSlug = href.match(/^#listing\/(.+)$/)?.[1];
      if (listingSlug && state.siteBySlug.has(listingSlug)) {
        openListing(state.siteBySlug.get(listingSlug), { source: "Linked listing" });
        return;
      }
      const pageSlug = href.match(/^#page\/(.+)$/)?.[1];
      if (pageSlug && state.contentBySlug.has(pageSlug)) {
        openSiteContent(state.contentBySlug.get(pageSlug), { source: "Linked page" });
        return;
      }
      const blogSlug = href.match(/^#blog\/(.+)$/)?.[1];
      if (blogSlug && state.blogBySlug.has(blogSlug)) {
        openBlogPost(state.blogBySlug.get(blogSlug), { source: "Linked blog post" });
        return;
      }
      showBanner("That older site link does not have a matching article yet.");
    });
    articleHeadEl.addEventListener("click", event => {
      const tagButton = event.target.closest("[data-site-tag-key]");
      if (!tagButton) return;
      event.preventDefault();
      openSiteCategoryTag(tagButton.dataset.siteTagKey, tagButton.dataset.siteTagLabel);
    });
    articleBodyEl.addEventListener("submit", event => {
      const form = event.target.closest("[data-frontend-editor]");
      if (!form) return;
      event.preventDefault();
      saveFrontendEditor(form);
    });
    articleBodyEl.addEventListener("mouseup", () => window.setTimeout(updateQuoteSelectionPopup, 0));
    articleBodyEl.addEventListener("keyup", event => {
      if (event.key === "Shift" || event.key.startsWith("Arrow")) window.setTimeout(updateQuoteSelectionPopup, 0);
    });
    articleBodyEl.addEventListener("scroll", () => {
      hideQuoteSelectionPopup();
      syncArticleHeroScrollState();
    }, { passive: true });
    document.addEventListener("selectionchange", () => {
      if (!articleEl?.classList?.contains("open")) return;
      window.clearTimeout(state.quoteSelectionTimer);
      state.quoteSelectionTimer = window.setTimeout(updateQuoteSelectionPopup, 80);
    });
    languageQuizModalEl?.addEventListener("click", event => {
      const languageAnswer = event.target.closest("[data-language-answer]");
      if (languageAnswer) {
        answerLanguageQuiz(languageAnswer);
        return;
      }
      if (event.target === languageQuizModalEl || event.target.closest("[data-close-language-quiz]")) {
        languageQuizModalEl.hidden = true;
      }
    });
    articleBodyEl.addEventListener("mouseover", event => {
      const profileTrigger = event.target.closest(".comment-profile-name[data-open-profile], .comment-profile-link[data-open-profile]");
      if (profileTrigger) showProfileHover(profileTrigger.dataset.openProfile, profileTrigger);
      const moment = event.target.closest("[data-event-id]");
      if (moment) setActiveTimelineEvent(moment.dataset.eventId, { scrollTimeline: true });
    });
    articleBodyEl.addEventListener("mouseout", event => {
      if (event.target.closest(".comment-profile-name[data-open-profile], .comment-profile-link[data-open-profile]")) scheduleHideProfileHover();
    });
    articleBodyEl.addEventListener("focusin", event => {
      const profileTrigger = event.target.closest(".comment-profile-name[data-open-profile], .comment-profile-link[data-open-profile]");
      if (profileTrigger) showProfileHover(profileTrigger.dataset.openProfile, profileTrigger);
    });
    articleBodyEl.addEventListener("focusout", event => {
      if (event.target.closest(".comment-profile-name[data-open-profile], .comment-profile-link[data-open-profile]")) scheduleHideProfileHover();
    });
    profileHoverEl?.addEventListener("mouseenter", () => window.clearTimeout(profileHoverHideTimer));
    profileHoverEl?.addEventListener("mouseleave", scheduleHideProfileHover);
    profileHoverEl?.addEventListener("focusin", () => window.clearTimeout(profileHoverHideTimer));
    profileHoverEl?.addEventListener("focusout", scheduleHideProfileHover);
    articleBodyEl.addEventListener("change", event => {
      const screenshotInput = event.target.closest("[data-feedback-screenshot]");
      const contributorSort = event.target.closest("[data-contributor-sort]");
      if (contributorSort) {
        state.contributorSortMode = contributorSort.value === "points" ? "points" : "alpha";
        openContributors();
        return;
      }
      if (screenshotInput) {
        state.feedbackScreenshotFile = null;
        const status = screenshotInput.closest("[data-contact-form]")?.querySelector("[data-feedback-screenshot-status]");
        if (status) status.textContent = screenshotInput.files?.[0]
          ? `Screenshot selected: ${screenshotInput.files[0].name}`
          : "Optional screenshot helps explain what happened.";
        return;
      }
      const panel = event.target.closest("[data-print-panel]");
      if (panel) updatePrintPanel(panel);
    });
    articleBodyEl.addEventListener("input", event => {
      const panel = event.target.closest("[data-print-panel]");
      if (panel) updatePrintPanel(panel);
    });
    articleBodyEl.addEventListener("click", event => {
      const payLink = event.target.closest("[data-print-pay]");
      if (payLink) updatePrintPanel(payLink.closest("[data-print-panel]"));
    });
    mediaCloseBtn.addEventListener("click", closeMediaViewer);
    mediaLightboxEl.addEventListener("click", event => {
      if (event.target === mediaLightboxEl) closeMediaViewer();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeSuggestions();
        if (state.suggestionMapPickMode) {
          setSuggestionMapPickMode(false);
          markArticlePanelOpen();
          updateBackButton();
        }
      }
      if (event.key === "Escape" && mediaLightboxEl.classList.contains("open")) closeMediaViewer();
      const target = event.target;
      const editing = target && /input|textarea|select/i.test(target.tagName || "");
      if (!editing && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        stepTimeline(event.key === "ArrowRight" ? 1 : -1);
      }
    });
    articleBodyEl.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      const loginPanel = event.target.closest("[data-login-panel], .discussion-section");
      if (!loginPanel || !event.target.matches("[data-login-email], [data-login-password]")) return;
      event.preventDefault();
      loginContributorFromSection(loginPanel).catch(error => showBanner(error.message || "Contributor login failed."));
    });
    dailyCardStackEl?.addEventListener("click", event => {
      scheduleMemberProfileActivityTracking();
      const moment = event.target.closest("[data-open-daily-moment]");
      if (moment?.dataset.openDailyMoment && state.timelineById.has(String(moment.dataset.openDailyMoment))) {
        openTimelineEvent(moment.dataset.openDailyMoment);
        return;
      }
      const open = event.target.closest("[data-open-daily-site]");
      if (open?.dataset.openDailySite && state.siteBySlug.has(open.dataset.openDailySite)) {
        openListing(state.siteBySlug.get(open.dataset.openDailySite), { source: "Daily learning goal" });
        return;
      }
      if (event.target.closest("[data-hide-daily-learning]")) {
        localStorage.setItem("nli-hide-daily-goal", localDateKey());
        renderDailyLearningCard();
      }
      if (event.target.closest("[data-hide-on-this-day], [data-hide-did-you-know]")) {
        localStorage.setItem("nli-hide-on-this-day", localDateKey());
        renderDailyLearningCard();
      }
      const openUpcomingExhibit = event.target.closest("[data-open-upcoming-exhibit]");
      if (openUpcomingExhibit?.dataset.openUpcomingExhibit && state.eventBySlug.has(openUpcomingExhibit.dataset.openUpcomingExhibit)) {
        openCalendarEvent(state.eventBySlug.get(openUpcomingExhibit.dataset.openUpcomingExhibit), { source: "Upcoming exhibit" });
        return;
      }
      const hideUpcomingExhibit = event.target.closest("[data-hide-upcoming-exhibit]");
      if (hideUpcomingExhibit) {
        const item = state.eventBySlug.get(hideUpcomingExhibit.dataset.hideUpcomingExhibit || "") || upcomingExhibitEvent();
        localStorage.setItem(upcomingExhibitDismissKey(item), "1");
        renderUpcomingExhibitCard();
      }
    });
    ["click", "keydown", "touchend"].forEach(type => {
      document.addEventListener(type, () => scheduleMemberProfileActivityTracking(), { passive: true });
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) scheduleMemberProfileActivityTracking({ force: true, throttleMs: 0 });
      else {
        scheduleMemberProfileActivityTracking();
        if (state.mapStoryRefreshTimer) refreshMapStories().catch(() => {});
      }
    });
    window.addEventListener("pagehide", () => {
      scheduleMemberProfileActivityTracking({ force: true, throttleMs: 0 });
    });

    let fullArchiveDataLoaded = false;
    let fullArchiveDataPromise = null;
    function hasInitialContentRoute() {
      const params = new URLSearchParams(window.location.search);
      return Boolean(
        window.location.hash ||
        params.get("site") ||
        params.get("wiki") ||
        params.get("event") ||
        params.get("calendar") ||
        params.get("page") ||
        params.get("blog") ||
        params.get("tag")
      );
    }
    const hasInitialRoute = hasInitialContentRoute();
    const renderFullArchivePanels = () => {
      setLoadingMessage("Preparing listings, articles, and timeline.");
      statusEl.textContent = `${state.sites.length} listings, ${state.wikiArticles.length} wiki articles, ${state.blogPosts.length} blog posts, and ${state.calendarEvents.length} calendar events loaded. Click a pin or colored territory to read its article.`;
      scheduleResponsiveTopbar();
      window.setTimeout(scheduleResponsiveTopbar, 80);
      renderSupportGoal();
      renderContributorLoginButton();
      window.setTimeout(() => {
        renderDailyLearningCard();
        renderUpcomingExhibitCard();
      }, 40);
      window.setTimeout(() => renderActivityPanel({ initialCount: 1, nextDelay: 180 }), 90);
      window.setTimeout(() => renderTimelineDock(), 180);
      window.setTimeout(() => {
        (state.contributorSession ? refreshSignedInProfileAfterOpen({ silent: true }) : Promise.resolve())
          .then(() => scheduleMemberProfileActivityTracking())
          .catch(() => scheduleMemberProfileActivityTracking());
      }, 260);
    };
    const loadFullArchiveData = () => {
      if (fullArchiveDataLoaded) return Promise.resolve();
      if (fullArchiveDataPromise) return fullArchiveDataPromise;
      fullArchiveDataPromise = loadData().then(() => {
        fullArchiveDataLoaded = true;
        if (state.contributorSession) {
          state.deferredSocialDataLoaded = false;
          state.deferredSocialDataMode = "";
          state.profilePointEventCanonicalIds.clear();
        }
        renderFullArchivePanels();
      }).finally(() => {
        fullArchiveDataPromise = null;
      });
      return fullArchiveDataPromise;
    };
    const requestFullArchiveData = (_reason = "background") => {
      if (fullArchiveDataLoaded) return Promise.resolve();
      return loadFullArchiveData();
    };

    const initialMapDataReady = Promise.all([
      loadInitialMapData().then(loaded => loaded || loadFullArchiveData().then(() => false)),
      ensureLandMask().catch(error => {
        console.warn("The shoreline mask will use its geometry fallback.", error);
        return null;
      })
    ]).then(([loaded]) => loaded);

    const earlyMapReady = USE_LEAFLET_PRIMARY
      ? initialMapDataReady
        .then(() => initMap())
        .then(() => {
      statusEl.textContent = `${state.sites.length} map listings loaded. Articles, timeline, and activity are loading in the background.`;
      scheduleResponsiveTopbar();
      window.setTimeout(scheduleResponsiveTopbar, 80);
          renderActivityPanel({ initialCount: 1, nextDelay: 180 });
          hideLoadingScreen();
          return true;
        })
        .catch(error => {
          console.warn("Early map startup failed.", error);
          return false;
        })
      : null;
    const mapStartupReady = earlyMapReady
      ? earlyMapReady.then(started => started || initMap().then(() => {
        renderActivityPanel({ initialCount: 1, nextDelay: 180 });
        hideLoadingScreen();
        return true;
      }))
      : initialMapDataReady.then(() => initMap()).then(() => {
        renderActivityPanel({ initialCount: 1, nextDelay: 180 });
        hideLoadingScreen();
        return true;
      });

    mapStartupReady
      .then(() => {
        runWhenMapIsQuiet(() => {
          loadFullArchiveData()
            .then(() => {
              openRouteFromUrl();
              if (state.passwordResetToken) openContributorLogin();
              if (isFrontendAdmin()) window.setTimeout(refreshReadyTodoMapTasks, 250);
              if (state.isLive) window.setTimeout(refreshSiteIconFieldsFromDirectus, 45000);
              window.setTimeout(loadDeferredMapAndTimelineData, 450);
              window.setTimeout(() => {
                (state.contributorSession ? refreshSignedInProfileAfterOpen({ silent: true }) : loadDeferredSocialData())
                  .catch(error => console.warn("Community data will load later.", error));
              }, state.contributorSession ? 350 : (hasInitialRoute ? 900 : 45000));
              window.setTimeout(startMapStoryRefresh, 46000);
            })
            .catch(error => {
              console.warn("Full site data could not finish loading after map startup.", error);
              showBanner("The map is ready, but some article and activity content is still catching up.");
            });
        }, { delay: hasInitialRoute ? 250 : 12500, quietMs: hasInitialRoute ? 700 : 1200 });
      })
      .catch(error => {
        statusEl.textContent = "Could not load site data.";
        setLoadingMessage("The site data could not finish loading.");
        window.setTimeout(() => hideLoadingScreen({ force: true }), 1200);
        showBanner(error.message);
      });

    function siteCenter(geometry) {
      return GEOMETRY_UTILS.geometryAverageCenter
        ? GEOMETRY_UTILS.geometryAverageCenter(geometry)
        : null;
    }

    function openRouteFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const siteSlug = params.get("site");
      const wikiSlug = params.get("wiki");
      const pageSlug = params.get("page");
      const blogSlug = params.get("blog");
      const calendarSlug = params.get("calendar");
      const tagKey = params.get("tag");
      const eventId = params.get("event");
      const virtualPages = {
        "page-home": "home",
        home: "home",
        "page-contact": "contact",
        contact: "contact",
        "page-feedback": "feedback",
        feedback: "feedback",
        "page-support": "support",
        support: "support",
        "support-admin": "support-admin",
        donate: "support",
        knowledgebase: "knowledgebase",
        contributors: "contributors",
        events: "events",
        blog: "blog",
        "site-list": "site-list",
        login: "login",
        profile: "profile",
        "suggest-site": "suggest-site"
      };
      if (siteSlug && state.siteBySlug.has(siteSlug)) {
        openListing(state.siteBySlug.get(siteSlug), { source: "Shared listing", skipHistory: true, skipRoute: true, timelineEventId: eventId });
        if (eventId) window.setTimeout(() => setActiveTimelineEvent(eventId, { scrollTimeline: true, scrollArticle: true }), 120);
        return;
      }
      const aliasSiteSlug = wikiSlug ? WIKI_TO_SITE_ROUTE_ALIASES[wikiSlug] : "";
      if (aliasSiteSlug && state.siteBySlug.has(aliasSiteSlug)) {
        openListing(state.siteBySlug.get(aliasSiteSlug), { source: "Shared listing", skipHistory: true, skipRoute: true, timelineEventId: eventId });
        if (eventId) window.setTimeout(() => setActiveTimelineEvent(eventId, { scrollTimeline: true, scrollArticle: true }), 120);
        return;
      }
      if (wikiSlug && state.wikiBySlug.has(wikiSlug)) {
        openWikiArticle(state.wikiBySlug.get(wikiSlug), { source: "Shared knowledgebase article", skipHistory: true, skipRoute: true, timelineEventId: eventId });
        if (eventId) window.setTimeout(() => setActiveTimelineEvent(eventId, { scrollTimeline: true, scrollArticle: true }), 120);
        return;
      }
      if (pageSlug && virtualPages[pageSlug]) {
        if (pageSlug === "login" && currentContributorProfile()) {
          openContributorProfileRoute();
          return;
        }
        openContentList(virtualPages[pageSlug], { skipRoute: true });
        return;
      }
      if (pageSlug && state.contentBySlug.has(pageSlug)) {
        openSiteContent(state.contentBySlug.get(pageSlug), { source: "Shared page", skipHistory: true, skipRoute: true });
        return;
      }
      if (blogSlug && state.blogBySlug.has(blogSlug)) {
        openBlogPost(state.blogBySlug.get(blogSlug), { source: "Shared blog post", skipHistory: true, skipRoute: true });
        return;
      }
      if (calendarSlug && state.eventBySlug.has(calendarSlug)) {
        openCalendarEvent(state.eventBySlug.get(calendarSlug), { source: "Shared calendar event", skipHistory: true, skipRoute: true });
        return;
      }
      if (tagKey) {
        openSiteCategoryTag(tagKey, "", { skipHistory: true, skipRoute: true });
      }
    }

    function broadTerritoryClickFocus(feature, clickLngLat = null, site = null) {
      const props = feature?.properties || {};
      const linkedSite = site || findSiteFromFeature(feature) || territoryTarget(feature)?.item || null;
      const text = normalizeComparisonText([
        displayFeatureTitle(props),
        props.feature_category,
        linkedSite?.title,
        linkedSite?.site_type
      ].filter(Boolean).join(" "));
      if (!/territory|ancestral land|traditional land|reservation/.test(text)) return null;
      const lng = Number(clickLngLat?.lng ?? clickLngLat?.lngLat?.lng ?? clickLngLat?.[0]);
      const lat = Number(clickLngLat?.lat ?? clickLngLat?.lngLat?.lat ?? clickLngLat?.[1]);
      const center = Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : siteCenter(feature?.geometry);
      if (!center) return null;
      const currentZoom = Number(state.map?.getZoom?.() ?? state.leafletMap?.getZoom?.() ?? 0);
      const zoom = Math.max(10.75, Number.isFinite(currentZoom) ? Math.min(currentZoom, 12.25) : 10.75);
      return { center, zoom };
    }
