    const SHARED_CONFIG = window.NLI_SHARED_CONFIG || {};
    const SHARED_FIELDS = SHARED_CONFIG.fields || {};
    const SHARED_MAP_STORY = SHARED_CONFIG.mapStory || {};
    const SHARED_UTILS = window.NLI_SHARED_UTILS || {};
    const formatDate = SHARED_UTILS.formatDate;
    const SITE_UTILS = window.NLI_SITE_UTILS || {};
    const SHARED_DIRECTUS = window.NLI_DIRECTUS_CLIENT || {};
    const PROFILE_UTILS = window.NLI_PROFILE_UTILS || {};
    const MAP_STORY_UTILS = window.NLI_MAP_STORY_UTILS || {};
    const LEARNING_CARD_UTILS = window.NLI_LEARNING_CARD_UTILS || {};
    const mobileLearningActionGuard = LEARNING_CARD_UTILS.createActionGuard?.() || (() => {
      const pending = new Set();
      return {
        begin(key) {
          const normalized = String(key || "");
          if (!normalized || pending.has(normalized)) return false;
          pending.add(normalized);
          return true;
        },
        end(key) {
          pending.delete(String(key || ""));
        }
      };
    })();
    const ACTIVITY_UTILS = window.NLI_ACTIVITY_UTILS || {};
    const COMMENT_UTILS = window.NLI_COMMENT_UTILS || {};
    const QUOTE_COMMENT_UTILS = window.NLI_QUOTE_COMMENT_UTILS || {};
    const FEEDBACK_UTILS = window.NLI_FEEDBACK_UTILS || {};
    const SUPPORT_UTILS = window.NLI_SUPPORT_UTILS || {};
    const TIMELINE_UTILS = window.NLI_TIMELINE_UTILS || {};
    const PLANT_UTILS = window.NLI_PLANT_UTILS || {};
    const SITE_TITLE_UTILS = window.NLI_SITE_TITLE_UTILS || {};
    const CALENDAR_UTILS = window.NLI_CALENDAR_UTILS || {};
    const GEOMETRY_UTILS = window.NLI_GEOMETRY_UTILS || {};
    const ROUTE_UTILS = window.NLI_ROUTE_UTILS || {};
    const HTML_UTILS = window.NLI_HTML_UTILS || {};
    const MEDIA_UTILS = window.NLI_MEDIA_UTILS || {};
    const cleanImageUrl = MEDIA_UTILS.cleanImageUrl || (value => String(value || "").trim());
    const normalizeHex = GEOMETRY_UTILS.normalizeHex || ((value, fallback) => {
      const text = String(value || "").trim();
      if (/^#[0-9a-f]{6}$/i.test(text)) return text;
      if (/^[0-9a-f]{6}$/i.test(text)) return `#${text}`;
      return fallback;
    });
    const MAP_UTILS = window.NLI_SHARED_MAP_UTILS || {};
    const normalizeComparisonText = SHARED_UTILS.normalizeText || (value => String(value || "").toLowerCase().trim());
    const DIRECTUS = SHARED_CONFIG.directusUrl || "https://directus.nativelongisland.com";
    const ADMIN_NOTIFICATION_FLOW_IDS = {
      approveSuggestion: "6f80f94d-c0d9-4266-9291-2a455e7a7f8d",
      declineSuggestion: "dd749434-2093-4d04-8ec4-5084400ce14c"
    };
    const DATA_CACHE_VERSION = "2026-05-24-profile-tracking-1";
    const directusClient = SHARED_DIRECTUS.createDirectusClient({
      baseUrl: DIRECTUS,
      cacheVersion: DATA_CACHE_VERSION,
      fetchErrorPrefix: "Archive request failed",
      fetchErrorSeparator: " ",
      tokenProvider: () => state.profile?.token || "",
      refreshTokenProvider: () => state.profile?.refreshToken || state.profile?.refresh_token || "",
      onTokenRefresh: credentials => {
        if (!state.profile) return;
        saveProfile({
          ...state.profile,
          token: credentials.token,
          refreshToken: credentials.refreshToken,
          refresh_token: credentials.refreshToken,
          tokenExpires: credentials.expires || null
        });
      },
      onAuthExpired: () => {
        if (!state.profile?.token && !state.profile?.refreshToken && !state.profile?.refresh_token) return;
        expireProfileSession("Your login expired. Please log back in to continue earning points or contributing.");
      }
    });
    const NEW_CONTENT_ALERT_INTERVAL_MS = 5 * 60 * 60 * 1000;
    const PUBLIC_ARCHIVE_BASE = SHARED_CONFIG.publicArchiveBase || "https://nativelongisland.com/";
    const EXHIBIT_MARKER_ICON = "assets/map-icons/exhibit-framed-landscape-marker.png";
    const BIOGRAPHY_PERSON_ICON_URL = "assets/map-icons/person-biography-marker.png";
    const WHALING_WHALE_ICON_URL = "assets/map-icons/whaling-moving-whale.png";
    const WHALING_FEATURE_SLUG = "whaling";
    const MOVING_DOG_ICON_URL = "assets/map-icons/dog-moving-icon.png";
    const MOVING_DOG_WIKI_SLUG = "dog-ceremonialism";
    const MOBILE_MOVING_MARKER_INTERVAL_MS = 180;
    const MOBILE_BIOGRAPHY_MARKER_ONE_WAY_MS = 720000;
    const MOBILE_BIOGRAPHY_MARKER_STAGGER_MS = 85;
    const MOBILE_WHALE_ONE_WAY_MS = 900000;
    const MOBILE_WHALE_START_OFFSET_MS = MOBILE_WHALE_ONE_WAY_MS * 0.78;
    const MOBILE_WHALE_ROUTE = Object.freeze([
      [-73.88, 40.52],
      [-73.62, 40.52],
      [-73.34, 40.56],
      [-73.03, 40.61],
      [-72.74, 40.68],
      [-72.50, 40.74],
      [-72.24, 40.79],
      [-71.98, 40.84]
    ]);
    const MOBILE_DOG_ONE_WAY_MS = 1020000;
    const MOBILE_DOG_START_OFFSET_MS = MOBILE_DOG_ONE_WAY_MS * 0.35;
    const MOBILE_DOG_ROUTE = Object.freeze([
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
    const FORCE_BLUE_DOT_SITE_SLUGS = new Set([
      "coopers-beach-shinnecock-access",
      "watermill-center",
    ]);
    const FORCE_BLUE_DOT_LOCAL_ICON = "assets/map-icons/blue-dot-placeholder.png";
    const APK_LOCAL_MAP_ICON_OVERRIDES = Object.freeze({
      "1eb120bb-fff6-4bd5-9c6e-062d18454856": "assets/map-icons/historicalsite-marker.png",
      "02e1cfbf-55b7-4276-abe0-fb5fa18352d4": "assets/map-icons/fishingsite-marker.png",
      "3975e162-74df-4858-a1db-5aa560b4e4fc": "assets/map-icons/burialsite-marker.png",
      "903968a4-64a0-4a70-b7ce-7430ec4d3e8b": "assets/map-icons/shellheap-marker.png",
      "253f1ea8-eebf-46cf-bb28-8d17c0734eae": "assets/map-icons/historicalsite-marker.png",
      "de9dbd0c-551d-4568-b487-d1142eaebadc": "assets/map-icons/sacredsite-marker.png",
      "93a5cfa5-bc2c-426e-9be5-ad80d1181c0e": "assets/map-icons/powwowground-marker.png",
      "ce3d3f40-95fd-47f8-887d-e000411b9369": "assets/map-icons/historicalsite-marker.png",
      "f7b0a998-7baf-42fe-a94d-7f33afae43a7": "assets/map-icons/church-marker.png",
      "7daa69ee-9773-433b-a52b-5447bf28d475": "assets/map-icons/ayeuonganit-wampum-ayimooup-icon.png",
      "75d778f9-5728-47a3-a7af-9976a7bea1b9": "assets/map-icons/bethel-christian-laurel-hill-icon.png",
      "29a78e22-70d0-4f0a-91e6-658072411469": "assets/map-icons/canoe-place-chapel-icon.png",
      "d3d05fdf-43fc-441c-a213-b24844d1cc77": "assets/map-icons/circassian-shipwreck-icon.png",
      "3b60bd8c-0a3b-40ee-b485-18465fb30355": "assets/map-icons/conscience-point-icon.png",
      "204485ed-5e28-4fbb-b455-3cb63a69a3f9": "assets/map-icons/cove-realty-site-icon.png",
      "a6737992-c153-4ab2-a595-ef1ceff3c7db": "assets/map-icons/devils-footprint-icon.png",
      "fd0b9061-a37e-47e9-9736-e72d7a12cfb0": "assets/map-icons/eastville-icon.png",
      "94d941a0-038e-42b7-824c-f12b2fbd1095": "assets/map-icons/elliott-brooks-carvings-icon.png",
      "482e2fb0-420a-4b95-b80e-bd4cf119be7d": "assets/map-icons/fowler-house-icon.png",
      "0c9a0aca-543d-47d0-aced-7cc9630710da": "assets/map-icons/halsey-house-icon.png",
      "d50ea654-5470-495d-98e4-8b60c0c34f57": "assets/map-icons/horse-barn-site-icon.png",
      "7934a356-b60b-47bb-b7d7-58ae61aa301f": "assets/map-icons/howell-home-icon.png",
      "e98ed5ef-1b3c-4a49-a7d6-81084516104c": "assets/map-icons/manitou-hill-icon.png",
      "b2562ac4-4d51-4536-bd9e-b1f930f6e908": "assets/map-icons/mas-house-logo-marker.png",
      "2833b659-933b-4456-a45b-861dcb73a46c": "assets/map-icons/matinecock-way-icon.png",
      "45f2e7fd-636d-48e9-9e36-ed5ba2dd669e": EXHIBIT_MARKER_ICON,
      "051fb219-f05e-4fee-a2d9-a6a837ca3b45": "assets/map-icons/shinnecock-hills-golf-club-icon.png",
      "5a1d550a-10f1-4090-aa54-44120290ed49": "assets/map-icons/shinnecock-reservation-flag-icon.png",
      "8c60c835-6c14-42c9-82a4-bd9bc462747c": "assets/map-icons/shinnecock-monument-icon.png",
      "6fffc301-439e-4c15-bc6d-b3e18e2df14c": "assets/map-icons/southold-museum-icon.png",
      "de8dcc31-4398-4287-8fd1-7ab5bc3c8405": "assets/map-icons/stephen-talkhouse-house-icon.png",
      "73ada1c6-be6c-4f93-a038-7c02f7e9c982": "assets/map-icons/st-matthew-chapel-icon.png",
      "1768130a-aff0-41bd-830e-e071250cead6": "assets/map-icons/sugar-loaf-hill-icon.png",
      "282c9aa3-a264-44f1-ba48-5df26be16cc3": "assets/map-icons/sylvester-manor-icon.png",
      "29a08e0a-5ebb-449b-ae57-f1d9d571b114": "assets/map-icons/unkechaug-reservation-flag-icon.png",
      "e0fadae2-69d2-4fec-a85e-afcabb384f0c": "assets/map-icons/wertheim-refuge-icon.png",
      "cfb5f041-859b-448c-b980-d91d6b620d4e": "assets/map-icons/william-floyd-estate-icon.png"
    });
    const LAND_MASK_URL = `long-island-land-ma${"sk"}-lite.json`;
    const LAND_MASK_VERSION = "2026-07-18-compressible-runtime-mask";
    const LONG_ISLAND_BOUNDS = [[-75.15, 39.75], [-70.65, 42.05]];
    const LONG_ISLAND_VIEW_BOUNDS = [[-74.35, 40.32], [-71.48, 41.36]];
    const STARTUP_LOCATION_CENTER_BOUNDS = [[-74.25, 40.45], [-71.65, 41.25]];
    const FALLBACK_CENTER = [-72.95, 40.86];
    const MOBILE_LONG_ISLAND_START_VIEWS = [
      { center: [-73.72, 40.72], zoom: 9.25 },
      { center: [-73.36, 40.76], zoom: 9.25 },
      { center: [-73.02, 40.82], zoom: 9.2 },
      { center: [-72.68, 40.84], zoom: 9.2 },
      { center: [-72.34, 40.88], zoom: 9.15 },
      { center: [-72.02, 40.93], zoom: 9.1 },
      { center: [-71.82, 41.02], zoom: 9.05 }
    ];
    const MOBILE_STARTUP_VIEW = randomMobileLongIslandStartupView();
    const KNOWLEDGEBASE_CATEGORIES = [
      { label: "Biography", slugs: ["mocomanto-shinnecock-sachem-1640", "sagamore-raseokan-ratiocanof-matinnicoke-matinecock", "chief-harry-wallace-of-the-unkechaug", "worison-unkechaug-whaler", "sunksqua-weany-pametsechs", "wuchikittawbut", "quashawam", "elizabeth-thunder-bird-haile-shinnecock", "betty-lewis-cromwell-shinnecock", "sachem-aquash-of-the-montaukett", "jeremiah-pharoah-montaukett-whaler", "sylvester-pharoah", "mary-rebecca-bunn-aunt-becky", "sachem-warawakmy-of-the-setauket", "chief-mahue-mayhew-of-unkechaug", "peter-john-cuffee", "lois-princess-nowedonah-hunter", "mandush-17th-century-sachem-of-shinnecock", "ninigret-eastern-niantic-sachem", "poggatacut-sachem-of-the-manhassets-of-shelter-island", "momoweta", "paucamp", "wobetom", "william-wallace-tooker", "john-a-strong", "nathan-jeffrey-cuffee", "samson-occom", "wyandanch", "cockenoe", "rev-paul-cuffee", "sachem-tackapousha", "mangwobe-sachem-of-rockaway", "adam-achitteronose", "penhawitz-sachem-of-the-canarsie", "stephen-talkhouse-pharoah", "nasseconset-sachem-of-the-nissequogue", "keeossechok-sachem-of-the-secatogue", "sunksquaws-and-indigenous-womens-leadership"] },
      { label: "Tribal Nations and Communities", entries: [["wiki", "native-long-island-overview"], ["wiki", "continued-indigenous-presence-today"], ["wiki", "the-tribes-of-long-island"], ["wiki", "western-long-island-native-communities"], ["wiki", "central-long-island-native-communities"], ["wiki", "eastern-long-island-native-communities"], ["wiki", "myth-of-the-thirteen-tribes"], ["site", "montaukett-ancestral-land"], ["site", "shinnecock-indian-reservation"], ["site", "unkechaug-indian-reservation"], ["site", "corchaug-tribe"], ["site", "manhansack-aqua-quash-awamock"], ["site", "setauket-ancestral-land"], ["site", "nissaquogue"], ["site", "matinecock"], ["site", "secatogues"], ["site", "massapequas"], ["site", "merricks"], ["site", "rockaways"], ["site", "canarsie"]] },
      { label: "History", slugs: ["native-long-island-overview", "slavery", "indian-missions-on-long-island", "colonial-descriptions-of-indians", "indian-forts", "13-tribes-of-long-island-david-martine", "early-contact-period-1600-ad-1700-ad", "post-contact", "creation-of-long-island", "land-deeds-and-dispossession", "myth-of-extinction-and-survivance", "myth-of-the-thirteen-tribes", "historic-preservation", "history-and-place-names", "merrick-people-in-early-land-records"] },
      { label: "Sovereignty and Governance", slugs: ["tribal-trustees", "sovereignty-recognition-and-detribalization", "land-deeds-and-dispossession", "continued-indigenous-presence-today"] },
      { label: "Culture, Ceremony, and Lifeways", slugs: ["sweat-lodge", "nunnowa", "wampum", "burial", "powwow", "spirituality-ceremony-cosmology", "language", "algonquian-language-and-place-names", "dog-ceremonialism", "spring", "summer", "fall", "winter", "food", "fishing", "whaling", "indigenous-whaling-and-maritime-labor", "ecology-and-flexible-sedentism"] },
      { label: "Time Periods and Archaeology", slugs: ["paleo-indian-period", "archaic-period", "orient-transitional-period", "woodland-period", "late-woodland", "early-contact-period-1600-ad-1700-ad", "post-contact", "shell-midden", "killed-pottery", "arrow-heads", "phase-archaeology-investigation", "phase-ii-archaeology-investigation", "phase-iii-archaeological-investigation", "burial-protection-and-sacred-landscapes"] },
      { label: "Preservation and Site Protection", slugs: ["preservation", "burial-protection-and-sacred-landscapes", "vandalism", "phase-archaeology-investigation", "phase-ii-archaeology-investigation", "phase-iii-archaeological-investigation"] },
      { label: "Natural Resources", slugs: ["native-plants", "beach-plum", "spring", "summer", "fall", "winter", "food", "fishing", "whaling", "indigenous-whaling-and-maritime-labor", "shell-midden", "ecology-and-flexible-sedentism"] },
      { label: "Maps and Reference", slugs: ["13-tribes-of-long-island-david-martine", "history-and-place-names", "algonquian-language-and-place-names", "western-long-island-native-communities", "central-long-island-native-communities", "eastern-long-island-native-communities"] }
    ];
    const BIOGRAPHY_WIKI_SLUGS = new Set((KNOWLEDGEBASE_CATEGORIES.find(category => category.label === "Biography")?.slugs || []));
    const BIOGRAPHY_PLACE_PATHS = {
      "wyandanch": {
        title: "Wyandanch associated places",
        note: "Broad associated places from the story; not a precise travel route.",
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
        note: "Broad associated places from the records and historic moments; not a precise travel route.",
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
      "lois-princess-nowedonah-hunter": {
        title: "Lois Hunter associated places",
        note: "Places and institutions connected with this life story; not a precise private route.",
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
      "john-a-strong": {
        title: "John A. Strong associated places",
        note: "Broad places connected with Strong's Long Island Native history scholarship and research roles.",
        places: [
          { label: "1964 - Long Island University teaching", place: "Southampton College, Long Island University", coordinates: [-72.427, 40.887], reason: "Strong began teaching at Long Island University in 1964 and later published biographies identify him with Southampton College." },
          { label: "1996-1997 - Hofstra Long Island Studies Institute publications", place: "Hofstra University, Hempstead", coordinates: [-73.601, 40.716], reason: "Hofstra's Long Island Studies Institute published Strong's companion volumes on Long Island Algonquian history and contemporary Native communities." },
          { label: "2001 - Montaukett history", place: "Montauk / eastern Long Island context", coordinates: [-71.944, 41.036], reason: "Strong's Montaukett history focused on land tenure, recognition, and eastern Long Island Native history." },
          { label: "2009-2011 - Unkechaug sovereignty and history", place: "Poospatuck Reservation / Unkechaug context", coordinates: [-72.869, 40.787], reason: "Strong's expert-witness work and 2011 book documented Unkechaug community persistence and sovereignty." },
          { label: "2018 - Native shore-whaling research", place: "Long Island shore-whaling history", coordinates: [-72.63, 40.94], reason: "America's Early Whalemen examined Native shore-whaling labor on Long Island from 1650 to 1750." }
        ]
      },
      "adam-achitteronose": {
        title: "Adam Achitteronose associated places",
        note: "Broad places from the cited sources; not a precise travel route.",
        places: [
          { label: "Merrick/Mericock records", place: "Merrick and southern Hempstead bays", coordinates: [-73.555, 40.667], reason: "Adam Achitteronose is connected with western Long Island alliance records that included Mericock/Merrick." },
          { label: "Hempstead conference context", place: "Hempstead", coordinates: [-73.621, 40.706], reason: "The cited records connect western Long Island sachems and envoys to Hempstead boundary and conference records." },
          { label: "New Amsterdam diplomacy", place: "Lower Manhattan / New Amsterdam", coordinates: [-74.006, 40.705], reason: "Dutch treaty records place western Long Island diplomacy in relation to New Amsterdam." }
        ]
      },
      "penhawitz-sachem-of-the-canarsie": {
        title: "Penhawitz associated places",
        note: "Broad places connected to Penhawitz's cited records. Private and sensitive locations are not pinned.",
        places: [
          { label: "Canarsie homeland", place: "Canarsie, Brooklyn", coordinates: [-73.902, 40.640], reason: "Penhawitz is remembered in the Canarsie/Keschaechquereren records." },
          { label: "Keschaechquereren / Flatbush", place: "Flatbush, Brooklyn", coordinates: [-73.961, 40.641], reason: "Museum of the City of New York identifies Penhawitz with a major community near Canarsie in what is now Flatbush." },
          { label: "Massapequa deed context", place: "Massapequa / Fort Neck area", coordinates: [-73.462, 40.681], reason: "The cited records include a 1639 Massapequa deed reference to Penhawitz." },
          { label: "New Amsterdam", place: "Lower Manhattan", coordinates: [-74.006, 40.705], reason: "Dutch colonial records connect Penhawitz to New Netherland diplomacy." }
        ]
      },
      "momoweta": {
        title: "Momoweta associated places",
        note: "Broad places connected to Corchaug and North Fork records.",
        places: [
          { label: "Corchaug homeland", place: "North Fork / Cutchogue area", coordinates: [-72.487, 41.011], reason: "Momoweta is remembered as a Corchaug sachem." },
          { label: "Southold records", place: "Southold", coordinates: [-72.427, 41.064], reason: "North Fork records and colonial documentation preserve this connection." },
          { label: "Peconic Bay diplomacy", place: "Peconic Bay", coordinates: [-72.460, 40.970], reason: "The Corchaug record context sits within the Peconic and North Fork landscape." }
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
          { label: "Hempstead Plains", place: "Hempstead", coordinates: [-73.621, 40.706], reason: "The cited records connect him to Hempstead boundary and conference records." },
          { label: "Merrick / Mericock", place: "Merrick", coordinates: [-73.555, 40.667], reason: "Western Long Island diplomacy included Merrick/Mericock interests." },
          { label: "Rockaway / Jamaica Bay", place: "Rockaway and Jamaica Bay", coordinates: [-73.835, 40.592], reason: "The treaty and alliance records connect Massapequa leadership with Rockaway and other western communities." }
        ]
      },
      "sagamore-raseokan-ratiocanof-matinnicoke-matinecock": {
        title: "Raseokan/Ratiocan associated places",
        note: "Broad North Shore places named in Matinecock records.",
        places: [
          { label: "Asharoken", place: "Asharoken Beach", coordinates: [-73.356, 40.927], reason: "Name variants connect Raseokan/Ratiocan with Asharoken-area records." },
          { label: "Eaton's Neck", place: "Eaton's Neck", coordinates: [-73.393, 40.954], reason: "Matinecock and Huntington records include Eaton's Neck." },
          { label: "Lloyd Neck / Caumsett", place: "Lloyd Neck", coordinates: [-73.472, 40.915], reason: "Lloyd Neck and North Shore land records preserve this connection." },
          { label: "Cold Spring Harbor", place: "Cold Spring Harbor", coordinates: [-73.456, 40.872], reason: "Cold Spring Harbor histories preserve part of the Matinecock record context." }
        ]
      },
      "mangwobe-sachem-of-rockaway": {
        title: "Mangwobe associated places",
        note: "Broad places tied to Rockaway and Hempstead conference records.",
        places: [
          { label: "Rockaway homeland", place: "Rockaway Peninsula", coordinates: [-73.835, 40.592], reason: "Mangwobe is remembered as a Rockaway sachem." },
          { label: "Hempstead conference context", place: "Hempstead", coordinates: [-73.621, 40.706], reason: "His cited records include the 1657 Hempstead conference." },
          { label: "Merrick and south bays", place: "Merrick / southern Hempstead bays", coordinates: [-73.555, 40.667], reason: "The conference records connected Rockaway, Merrick, Massapequa, and Hempstead interests." }
        ]
      },
      "sachem-warawakmy-of-the-setauket": {
        title: "Warawakmy associated places",
        note: "Broad places tied to Setauket records.",
        places: [
          { label: "Setauket homeland", place: "Setauket", coordinates: [-73.105, 40.941], reason: "Warawakmy is remembered as a Setauket sachem." },
          { label: "Stony Brook", place: "Stony Brook", coordinates: [-73.140, 40.925], reason: "The 1655 deed names land between Stony Brook and Peconic headwaters." },
          { label: "Peconic headwaters", place: "Wading River / Peconic headwaters area", coordinates: [-72.830, 40.930], reason: "The deed record connects Warawakmy to the headwaters boundary language." }
        ]
      },
      "nasseconset-sachem-of-the-nissequogue": {
        title: "Nasseconset associated places",
        note: "Broad places connected with land and place-name records.",
        places: [
          { label: "Nissequogue River", place: "Nissequogue River", coordinates: [-73.203, 40.906], reason: "Nasseconset is tied to the Nissequogue River records." },
          { label: "Smithtown", place: "Smithtown", coordinates: [-73.200, 40.856], reason: "Records connect Nasseconset with land that became part of Smithtown." },
          { label: "Crab Meadow / Katawamake", place: "Crab Meadow area", coordinates: [-73.312, 40.928], reason: "Nearby place-name and land records provide context." }
        ]
      },
      "keeossechok-sachem-of-the-secatogue": {
        title: "Keeossechok associated places",
        note: "Broad places connected with the brief deed and place-name record.",
        places: [
          { label: "Secatogue Neck", place: "West Islip / Bay Shore area", coordinates: [-73.294, 40.706], reason: "Keeossechok is remembered as a Secatogue sachem." },
          { label: "Great South Bay marshes", place: "Great South Bay", coordinates: [-73.238, 40.688], reason: "The Secatogue record context is tied to South Shore homelands and salt meadows." },
          { label: "Islip / Babylon south shore", place: "Islip and Babylon shoreline", coordinates: [-73.318, 40.727], reason: "The broader Secatogue region includes this South Shore corridor." }
        ]
      },
      "mocomanto-shinnecock-sachem-1640": {
        title: "Mocomanto associated places",
        note: "Broad places connected to Southampton and Shinnecock records.",
        places: [
          { label: "Shinnecock homeland", place: "Shinnecock, Southampton", coordinates: [-72.432, 40.884], reason: "Mocomanto is remembered as a Shinnecock leader." },
          { label: "Conscience Point context", place: "North Sea / Conscience Point", coordinates: [-72.439, 40.920], reason: "Southampton founding narratives connect this area with early colonial arrival." },
          { label: "Southampton records", place: "Southampton Village", coordinates: [-72.389, 40.884], reason: "His name appears in early Southampton records." }
        ]
      },
      "mandush-17th-century-sachem-of-shinnecock": {
        title: "Mandush associated places",
        note: "Approximate places named in Shinnecock and South Fork records.",
        places: [
          { label: "Shinnecock homeland", place: "Shinnecock, Southampton", coordinates: [-72.432, 40.884], reason: "Mandush is remembered as a Shinnecock sachem." },
          { label: "Southampton records", place: "Southampton Village", coordinates: [-72.389, 40.884], reason: "Southampton land and testimony records preserve Mandush's name." },
          { label: "Montaukett diplomacy", place: "Montauk", coordinates: [-71.944, 41.036], reason: "The cited records link Mandush with regional diplomacy involving Montaukett leadership." }
        ]
      },
      "sunksqua-weany-pametsechs": {
        title: "Weany/Pametsechs associated places",
        note: "Broad places connected with deed and land-record references to women's leadership.",
        places: [
          { label: "Shinnecock homeland", place: "Shinnecock, Southampton", coordinates: [-72.432, 40.884], reason: "Weany is remembered in Shinnecock leadership records." },
          { label: "Quogue lands", place: "Quogue", coordinates: [-72.581, 40.823], reason: "Quogue-area land records preserve Weany's name." },
          { label: "Canoe Place / Niamuck", place: "Canoe Place", coordinates: [-72.504, 40.884], reason: "The South Fork corridor provides broader context for Shinnecock and neighboring records." }
        ]
      },
      "chief-mahue-mayhew-of-unkechaug": {
        title: "Mahue/Mayhew associated places",
        note: "Broad places connected with Unkechaug and Setauket records.",
        places: [
          { label: "Poospatuck / Unkechaug homeland", place: "Poospatuck Reservation area", coordinates: [-72.869, 40.787], reason: "Mahue/Mayhew is remembered as an Unkechaug-connected leader." },
          { label: "Setauket connection", place: "Setauket", coordinates: [-73.105, 40.941], reason: "Unkechaug and Setauket records preserve these connections." },
          { label: "Mastic / Brookhaven south shore", place: "Mastic area", coordinates: [-72.840, 40.760], reason: "Unkechaug records center the south shore of Brookhaven." }
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
      "worison-unkechaug-whaler": {
        title: "Worison associated places",
        note: "Broad places connected with Worison in Unkechaug land and shore-whaling records.",
        places: [
          { label: "Winter 1676-1677 - shore-whaling contracts", place: "Southampton shore-whaling records", coordinates: [-72.389, 40.884], reason: "Worison signed early shore-whaling contracts with John Cooper for a share of the profits." },
          { label: "1680 - Watchogue Neck residence", place: "Watchogue Neck / East Moriches area", coordinates: [-72.789, 40.762], reason: "A land description places Warishone at a neck of land west of Watchogue and identifies him as Mahue's kinsman." }
        ]
      },
      "rev-paul-cuffee": {
        title: "Rev. Paul Cuffee associated places",
        note: "Broad places connected to Cuffee's preaching circuit; not a precise route.",
        places: [
          { label: "Poospatuck / Unkechaug", place: "Poospatuck Reservation area", coordinates: [-72.869, 40.787], reason: "Cuffee's ministry connected with Unkechaug community life." },
          { label: "Shinnecock", place: "Shinnecock, Southampton", coordinates: [-72.432, 40.884], reason: "Shinnecock mission history preserves this connection." },
          { label: "Canoe Place", place: "Canoe Place", coordinates: [-72.504, 40.884], reason: "Canoe Place appears in the mission circuit records." },
          { label: "Montauk", place: "Montauk", coordinates: [-71.944, 41.036], reason: "Cuffee's preaching route connected eastern Long Island Native communities." }
        ]
      },
      "nathan-jeffrey-cuffee": {
        title: "Nathan Jeffrey Cuffee associated places",
        note: "Broad places connected to Montaukett writing, community history, and land advocacy.",
        places: [
          { label: "Eastville community", place: "Sag Harbor / Eastville", coordinates: [-72.317, 40.999], reason: "Cuffee is connected with the Eastville community." },
          { label: "Indian Fields", place: "Montauk", coordinates: [-71.944, 41.036], reason: "Montaukett advocacy for Indian Fields preserves this connection." },
          { label: "Hither Woods", place: "Hither Woods, Montauk", coordinates: [-72.020, 41.030], reason: "Hither Woods is part of the Montaukett land advocacy record." }
        ]
      },
      "jeremiah-pharoah-montaukett-whaler": {
        title: "Jeremiah Pharoah associated places",
        note: "Broad places connected with Jeremiah Pharoah's whaling life. Indian Fields archaeological and household locations are not pinned.",
        places: [
          { label: "1794 - Nantucket marriage and whaling", place: "Nantucket, Massachusetts", coordinates: [-70.1, 41.283], reason: "Jeremiah Pharoah married Aloosa / Lois Tallman while working as a whaler out of Nantucket." },
          { label: "1798 - return to Montauk", place: "Montauk / Indian Fields context", coordinates: [-71.944, 41.036], reason: "A transcription records Jeremiah Pharoah returning to Montauk after nine years and five months away sailing out of Nantucket." },
          { label: "late 18th-early 19th century - household material culture", place: "Indian Fields, Montauk", coordinates: [-71.944, 41.036], reason: "Archaeological research at Indian Fields documented household material culture associated with Jeremiah Pharoah, including a scrimshaw knife handle bearing his name." }
        ]
      },
      "sachem-aquash-of-the-montaukett": {
        title: "Aquash associated places",
        note: "Broad places connected to Montaukett and East Hampton records.",
        places: [
          { label: "Montaukett homeland", place: "Montauk", coordinates: [-71.944, 41.036], reason: "Aquash is remembered as a Montaukett sachem." },
          { label: "East Hampton records", place: "East Hampton", coordinates: [-72.185, 40.963], reason: "East Hampton records preserve Aquash's name." },
          { label: "Indian Fields context", place: "Montauk", coordinates: [-71.972, 41.047], reason: "The cited records connect later Montaukett leadership with Montauk land and fencing agreements." }
        ]
      },
      "stephen-talkhouse-pharoah": {
        title: "Stephen Talkhouse associated places",
        note: "Approximate places connected to Stephen Talkhouse Pharoah. Private or sensitive locations are not pinned.",
        places: [
          { label: "Springs / Molly's Hill", place: "Springs, East Hampton", coordinates: [-72.137, 41.035], reason: "Archive records connect Talkhouse with Molly's Hill in Springs." },
          { label: "Talkhouse house site context", place: "Montauk", coordinates: [-72.014, 41.032], reason: "Stephen Talkhouse Pharoah House context belongs to his later-life story." },
          { label: "St. Matthew Chapel / Freetown", place: "East Hampton", coordinates: [-72.177, 41.020], reason: "Local records connect Montaukett and African American community places in East Hampton." },
          { label: "Bridgehampton path context", place: "Bridgehampton", coordinates: [-72.306, 40.937], reason: "The house listing notes a footpath toward Bridgehampton." }
        ]
      }
    };
    const MOBILE_BASEMAPS = {
      streets: { tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "© OpenStreetMap contributors" },
      satellite: { tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles © Esri" },
      outdoors: { tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "© OpenStreetMap contributors" },
      blank: null
    };

    function mobileBasemapStyle(value) {
      const base = MOBILE_BASEMAPS[value];
      if (!base) return { version: 8, sources: {}, layers: [{ id: "mobile-blank-background", type: "background", paint: { "background-color": "#eef3ef" } }] };
      return {
        version: 8,
        sources: { "mobile-raster-basemap": { type: "raster", tiles: [base.tileUrl], tileSize: 256, attribution: base.attribution } },
        layers: [{ id: "mobile-raster-basemap", type: "raster", source: "mobile-raster-basemap", paint: { "raster-saturation": value === "satellite" ? 0.08 : -0.24, "raster-brightness-max": value === "satellite" ? 0.9 : 1 } }]
      };
    }
    const MAPBOX_PUBLIC_TOKEN = "__NLI_MAPBOX_TOKEN__";
    const SITE_INDEX_FIELDS = SHARED_FIELDS.mobileSiteIndex;
    const SITE_INDEX_RUNTIME_FIELDS = String(SITE_INDEX_FIELDS || "").split(",").filter(field => !["geojson", "display_geojson"].includes(field)).join(",");
    const SITE_INDEX_URL = "assets/data/mobile-site-index.json";
    const SITE_INDEX_VERSION = "20260723-site-index-v2";
    const SITE_GEOMETRY_URL = "assets/data/mobile-site-geometry.json";
    const SITE_GEOMETRY_VERSION = "20260723-site-geometry-v2";
    const SITE_DETAIL_FIELDS = SHARED_FIELDS.mobileSiteDetail;
    const WIKI_INDEX_FIELDS = SHARED_FIELDS.mobileWikiIndex;
    const WIKI_INDEX_URL = "assets/data/mobile-wiki-index.json";
    const WIKI_INDEX_VERSION = "20260714-public-content-audit-v1";
    const WIKI_DETAIL_FIELDS = SHARED_FIELDS.mobileWikiDetail;
    const TIMELINE_FIELDS = SHARED_FIELDS.timeline;
    const BASIC_TIMELINE_FIELDS = SHARED_FIELDS.basicTimeline;
    const TIMELINE_INDEX_FIELDS = String(BASIC_TIMELINE_FIELDS || "").split(",").filter(field => field !== "description").join(",");
    const TIMELINE_INDEX_URL = "assets/data/mobile-timeline-index.json";
    const TIMELINE_INDEX_VERSION = "20260714-public-content-audit-v1";
    const EXHIBIT_FIELDS = SHARED_FIELDS.exhibit;
    const PROFILE_FIELDS = SHARED_FIELDS.profile;
    const PUBLIC_COMMENT_FIELDS = SHARED_FIELDS.publicComment;
    const COMMENT_VOTE_FIELDS = SHARED_FIELDS.commentVote;
    const POINT_EVENT_FIELDS = SHARED_FIELDS.pointEvent;
    const PLANT_OBSERVATION_FIELDS = SHARED_FIELDS.plantObservation;
    const PUBLIC_VISIT_FIELDS = SHARED_FIELDS.publicVisit;
    const SITE_SUGGESTION_FIELDS = SHARED_FIELDS.siteSuggestion;
    const ACCOUNT_REGISTRATION_FIELDS = [
      "id", "email", "email_normalized", "display_name", "status", "account_enabled", "account_banned",
      "review_note", "created_at", "reviewed_at"
    ].join(",");
    const LANGUAGE_PROGRESS_FIELDS = SHARED_FIELDS.languageProgress;
    const LOGIN_REWARD_FIELDS = SHARED_FIELDS.loginReward;
    const FOLLOW_FIELDS = SHARED_FIELDS.follow;
    const SUPPORT_FIELDS = SHARED_FIELDS.support;
    const MAP_STORY_FIELDS = SHARED_FIELDS.mapStory;
    const MAP_STORY_VOTE_FIELDS = SHARED_FIELDS.mapStoryVote;
    const MAP_STORY_BASE_LIFETIME_MS = SHARED_MAP_STORY.baseLifetimeMs || 24 * 60 * 60 * 1000;
    const MAP_STORY_VOTE_HOUR_MS = SHARED_MAP_STORY.voteHourMs || 60 * 60 * 1000;
    const MAP_STORY_PERMANENT_SCORE = SHARED_MAP_STORY.permanentScore || 10;
    const DEFAULT_LAST_EDITED_LABEL = "10/01/2018";
    const MAP_STORY_PROMPTS = SHARED_MAP_STORY.prompts || [
      { key: "indigenous_memory", label: "Share a story from this place", help: "A place, view, object, plant, shoreline, or building that makes you think about Native history and presence." },
      { key: "missing_site", label: "A place that should be added to the map", help: "A possible Native site, place name, archive clue, memorial idea, or location that needs more research." },
      { key: "land_appreciation", label: "Gratitude for Native land from this place", help: "A respectful landscape, nature preserve, shoreline, or view that helps people notice the land they are on." },
      { key: "needs_care", label: "A place needing care, protection, or remembrance", help: "A threatened place, construction concern, plant habitat, cemetery, shoreline, or site that should be treated carefully." },
      { key: "art_or_visit", label: "Art, exhibit, or site visit connected to Native Long Island", help: "A photo from an exhibit, artwork, public program, or one of the mapped sites." }
    ];
    const MAP_STORY_RULES = {
      baseLifetimeMs: MAP_STORY_BASE_LIFETIME_MS,
      voteHourMs: MAP_STORY_VOTE_HOUR_MS,
      permanentScore: MAP_STORY_PERMANENT_SCORE
    };
    const NEAR_ME_ZOOM = 10.5;
    const STARTUP_LOCATION_ZOOM = NEAR_ME_ZOOM;
    const SITE_CHECKIN_RADIUS_MILES = 0.05;
    const SITE_VISIT_ALERT_RADIUS_MILES = 0.5;
    const SITE_LABEL_MIN_ZOOM = 10.75;
    const SITE_POINT_LABEL_MIN_ZOOM = 13.35;
    const PLACE_NAME_AREA_LABEL_MIN_ZOOM = 10.25;
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
    const NEARBY_LIST_DESKTOP_LIMIT = 18;
    const NEARBY_LIST_ANDROID_INITIAL_LIMIT = 8;
    const NEARBY_LIST_ANDROID_DEFAULT_LIMIT = 12;
    const NEARBY_LIST_SEARCH_LIMIT = 60;
    const NEARBY_LIST_INCREMENT = 12;
    const TIMELINE_FEED_INITIAL_LIMIT = 10;
    const TIMELINE_FEED_INCREMENT = 10;
    const TIMELINE_SCRUBBER_WINDOW = 30;
    const MOBILE_ACTIVITY_INITIAL_LIMIT = 8;
    const MOBILE_ACTIVITY_INCREMENT = 8;
    const MOBILE_PANEL_STATE_KEY = "nli-mobile-bottom-panel-state";
    const MOBILE_APP_BUILD_ID = "20260603-label-threshold-quieter";
    const MIN_ANDROID_APP_BUILD_ID = "20260524-plant-camera-analysis-7";
    const ANDROID_APK_UPDATE_URL = "https://github.com/jeremynative/on-this-site-android-apk/releases/latest/download/on-this-site-latest.apk";
    const LANGUAGE_QUIZ_WORDS = window.NLI_LANGUAGE_QUIZ_WORDS || [];
    const LANGUAGE_QUIZ_WORD_BY_ID = new Map(LANGUAGE_QUIZ_WORDS.map(word => [String(word.id), word]));
    const PLANT_OBSERVATION_SPECIES = PLANT_UTILS.plantObservationSpecies || [];

    function androidBridgeCssPixel(methodName) {
      const bridge = window.AndroidApp;
      if (!bridge || typeof bridge[methodName] !== "function") return 0;
      try {
        return Math.max(0, Number(bridge[methodName]()) || 0);
      } catch {
        return 0;
      }
    }

    function syncSystemSafeArea() {
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isNativeAndroid = isAndroid && Boolean(window.AndroidApp || window.AndroidStory);
      document.body.classList.toggle("android-device", isAndroid);
      document.documentElement.classList.toggle("android-device", isAndroid);
      document.body.classList.toggle("native-android-app", isNativeAndroid);
      document.documentElement.classList.toggle("native-android-app", isNativeAndroid);
      const viewport = window.visualViewport;
      const topGap = viewport ? Math.max(0, viewport.offsetTop) : 0;
      const bottomGap = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
      const leftGap = viewport ? Math.max(0, viewport.offsetLeft) : 0;
      const rightGap = viewport ? Math.max(0, window.innerWidth - viewport.width - viewport.offsetLeft) : 0;
      const nativeTop = isNativeAndroid ? Math.ceil(androidBridgeCssPixel("getSafeInsetTop")) : 0;
      const nativeBottom = isNativeAndroid ? Math.ceil(androidBridgeCssPixel("getSafeInsetBottom")) : 0;
      const nativeLeft = isNativeAndroid ? Math.ceil(androidBridgeCssPixel("getSafeInsetLeft")) : 0;
      const nativeRight = isNativeAndroid ? Math.ceil(androidBridgeCssPixel("getSafeInsetRight")) : 0;
      document.documentElement.style.setProperty("--viewport-top-safe", `${Math.round(topGap)}px`);
      document.documentElement.style.setProperty("--viewport-bottom-safe", `${Math.round(bottomGap)}px`);
      document.documentElement.style.setProperty("--viewport-left-safe", `${Math.round(leftGap)}px`);
      document.documentElement.style.setProperty("--viewport-right-safe", `${Math.round(rightGap)}px`);
      document.documentElement.style.setProperty("--native-top-safe", `${nativeTop}px`);
      document.documentElement.style.setProperty("--native-bottom-safe", `${nativeBottom}px`);
      document.documentElement.style.setProperty("--native-left-safe", `${nativeLeft}px`);
      document.documentElement.style.setProperty("--native-right-safe", `${nativeRight}px`);
    }

    syncSystemSafeArea();
    window.visualViewport?.addEventListener("resize", syncSystemSafeArea);
    window.visualViewport?.addEventListener("scroll", syncSystemSafeArea);
    window.addEventListener("nli-native-insets-changed", () => {
      syncSystemSafeArea();
      window.requestAnimationFrame(() => {
        positionMobileMapActionButtons();
        positionMobileStartupSpotlight();
        const moreMenu = document.querySelector(".mobile-more-menu[open]");
        if (moreMenu) fitMobileMoreMenu(moreMenu);
        const layerMenu = document.querySelector(".mobile-layer-menu[open]");
        if (layerMenu) fitMobileLayerMenu(layerMenu);
      });
    });
    window.addEventListener("orientationchange", () => window.setTimeout(syncSystemSafeArea, 250));

    function isNativeAndroidApp() {
      return /Android/i.test(navigator.userAgent) && Boolean(window.AndroidApp || window.AndroidStory);
    }

    function isApkSnapshotMode() {
      return Boolean(window.NLI_APK_SNAPSHOT_MODE);
    }

    function isOfflineTextMode() {
      return Boolean(window.NLI_APK_OFFLINE_TEXT_MODE) || (isNativeAndroidApp() && navigator.onLine === false);
    }

    const SEEDED_PUBLIC_PROFILES = SHARED_CONFIG.seededPublicProfiles || [];
    const SEEDED_PUBLIC_COMMENTS = SHARED_CONFIG.seededPublicComments || [];

    const state = {
      map: null,
      sites: [],
      siteById: new Map(),
      siteBySlug: new Map(),
      wikiArticles: [],
      wikiById: new Map(),
      wikiBySlug: new Map(),
      linkTerms: [],
      filtered: [],
      mapSites: [],
      timelineEvents: [],
      timelineById: new Map(),
      exhibits: [],
      eventById: new Map(),
      eventBySlug: new Map(),
      contributorProfiles: [],
      publicComments: [],
      siteHeroCarouselTimer: null,
      siteHeroCarouselKey: "",
      commentVotes: [],
      profilePointEvents: [],
      profilePointEventCanonicalIds: new Set(),
      profilePointEventSyncPromises: new Map(),
      plantObservations: [],
      publicVisits: [],
      siteSuggestions: [],
      mapStories: [],
      mapStoryVotes: [],
      languageQuizAttempts: [],
      profileLoginRewards: [],
      profileFollows: [],
      supportSettings: null,
      placeNameAreas: { type: "FeatureCollection", features: [] },
      landMaskData: null,
      landMaskPromise: null,
      selectedSlug: "",
      selectedSite: null,
      userLocation: null,
      userMarker: null,
      lastLocationMarkerUpdateAt: 0,
      addressMarker: null,
      locationWatchId: null,
      addressSearchMode: false,
      addressSearchPending: "",
      activeTimelineIndex: 0,
      timelineRandomized: false,
      sortedTimelineEvents: [],
      profileActivityCache: null,
      storyStream: null,
      storyRecorder: null,
      storyRecordedChunks: [],
      storyLastBlob: null,
      storyLastUrl: "",
      storyCanvas: null,
      storyCanvasLoop: null,
      storyRecordingStartedAt: 0,
      storyDiscardRecording: false,
      pendingCommentPhotoDiscussion: null,
      suggestionMarker: null,
      mediaMap: window.NLI_MOBILE_MEDIA_MAP || {},
      blogPosts: [],
      blogPostsLoaded: false,
      siteDetailCache: new Map(),
      wikiDetailCache: new Map(),
      timelineDetailCache: new Map(),
      relatedSitesCache: new Map(),
      relatedSiteIndexCache: null,
      deferredDataLoaded: false,
      deferredDataLoading: false,
      deferredCommunityDataLoaded: false,
      mobileActivityRenderedSignature: "",
      mobileActivityRenderLimit: MOBILE_ACTIVITY_INITIAL_LIMIT,
      mobileActivityDiscussionKeys: new Set(),
      mobileActivityDrafts: new Map(),
      profileActivitySynced: false,
      profileActivitySyncPromise: null,
      mobileStartupRendering: false,
      mobileTimelineRendered: false,
      timelineRenderLimit: TIMELINE_FEED_INITIAL_LIMIT,
      timelineWindowStart: 0,
      timelineScrubberIndex: 0,
      timelineLastRenderedScrubberIndex: 0,
      timelineScrubberPendingIndex: 0,
      timelineScrubberJumpTimer: null,
      timelineScrubberScrollFrame: null,
      timelineScrubberDragging: false,
      timelineFeedSignature: "",
      timelineFeedObserver: null,
      nearbyFeedObserver: null,
      expandedLearningCardKeys: new Set(),
      mobilePanelState: "normal",
      mobilePanelPreviousOpenState: "normal",
      timelineScrollTop: 0,
      nearbyScrollTop: 0,
      mobileStartupSpotlightSite: null,
      mobileStartupSpotlightShown: false,
      mobileStartupSpotlightReturnOnDetailClose: false,
      mobilePromoKind: "",
      mobilePromoPayload: null,
      mobilePromoStartupScheduled: false,
      mobilePromoStartupResolved: false,
      researchQuestionInstance: null,
      nearbyRenderLimit: 0,
      searchMapSyncTimer: null,
      searchRenderSettledTimer: null,
      searchDataVersion: 0,
      lastSearchDataVersion: -1,
      lastAutocompleteQuery: null,
      lastAutocompleteDataVersion: -1,
      placeAutocompleteTimer: null,
      placeAutocompleteRequest: 0,
      placeAutocompleteQuery: "",
      placeAutocompleteResults: [],
      androidImeSearchDraft: "",
      layers: [],
      markers: new Map(),
      mapSourceCache: null,
      mapSourceCacheKey: "",
      mapSourceRevision: 0,
      mapSourceAppliedKey: "",
      siteAttentionPulseTimer: null,
      siteAttentionPulseStartedAt: 0,
      mobileSiteIconImagesLoaded: new Set(),
      mobileSiteIconImagesFailed: new Set(),
      mobileSiteIconImagePlaceholders: new Set(),
      mobileStyleImageMissingBound: false,
      mobileSiteIconImagesLoading: false,
      mobileSiteIconImageQueue: [],
      mobileSiteIconImagesQueued: new Set(),
      mobileSiteIconQueueTimer: null,
      mobileMapLayerEventsBound: false,
      mobileMapLayerHandlers: new Map(),
      mobileMapPulseMoveBound: false,
      exhibitMarkers: new Map(),
      storyMarkers: new Map(),
      siteSourceListCache: new Map(),
      suggestionPublicMarkers: new Map(),
      activeSiteLabelMarker: null,
      mobileBiographyPathMarkers: [],
      mobileMovingBiographyMarkers: new Map(),
      mobileMovingBiographyMarkerQueueTimer: null,
      mobileMovingDogMarker: null,
      mobileMovingWhaleMarker: null,
      mobileMovingMarkerFrame: null,
      mobileMovingMarkerLastAt: 0,
      mobileMovingMarkerInteractionUntil: 0,
      mapStoryRefreshTimer: null,
      passwordResetToken: ROUTE_UTILS.passwordResetTokenFromUrl(window.location),
      plantMarkers: new Map(),
      accountRegistrations: [],
      lastMobileMapTapAt: 0,
      lastMobileMapTapKey: "",
      lastMobileMapTapFeatureKey: "",
      mobilePanelTapBlockUntil: 0,
      listTouchActivationUntil: 0,
      mobileMapTouchTap: null,
      pendingAndroidSearchResultTap: null,
      androidMapGestureActive: false,
      androidMapGestureSettleTimer: null,
      pendingAndroidMapRefresh: false,
      androidMapGestureGuardsBound: false,
      androidMapRefreshTimers: new Set(),
      androidMapRefreshToken: 0,
      androidMapResizeObserver: null,
      androidMapLastSizeKey: "",
      nearbySiteOpenTimer: null,
      nearbySiteOpenToken: 0,
      selectedWikiSlug: "",
      androidLifecycleRestored: false,
      feedbackScreenshotFile: null,
      contributorSortMode: "alpha",
      expandedMobileProfileKey: "",
      memberUsageSessionStartedAt: Date.now(),
      memberUsageLastFlushAt: 0,
      memberUsageFlushedSeconds: 0,
      memberUsageSessionRecorded: false,
      memberUsageFlushPromise: null,
      memberUsageLoadedProfileIds: new Set(),
      settings: loadSettings(),
      profile: loadProfile()
    };

    const listEl = document.getElementById("site-list");
    const appEl = document.querySelector(".app");
    const statusEl = document.getElementById("status");
    const listTitleTextEl = document.querySelector(".list-head .list-title strong");
    const loadingScreenEl = document.getElementById("loading-screen");
    const loadingMessageEl = document.getElementById("loading-message");
    const searchEl = document.getElementById("search");
    const searchSuggestionsEl = document.getElementById("search-suggestions");
    const territorySubtitleEl = document.getElementById("territory-subtitle");
    const locateBtn = document.getElementById("locate");
    const mobileMapLocateBtn = document.getElementById("mobile-map-locate");
    const mapStoryOpenBtn = document.getElementById("map-story-open");
    const loginOpenBtn = document.getElementById("login-open");
    const rewardsOpenBtn = document.getElementById("rewards-open");
    const profilesOpenBtn = document.getElementById("profiles-open");
    const followingOpenBtn = document.getElementById("following-open");
    const eventsOpenBtn = document.getElementById("events-open");
    const settingsOpenBtn = document.getElementById("settings-open");
    const feedbackOpenBtn = document.getElementById("feedback-open");
    const storyOpenBtn = document.getElementById("story-open");
    const mobileRefreshAppBtn = document.getElementById("mobile-refresh-app");
    const suggestSiteOpenBtn = document.getElementById("suggest-site-open");
    const mobileLearnOpenBtn = document.getElementById("mobile-learn-open");
    const mobileDonateButton = document.getElementById("mobile-donate-button");
    const mobileAdminMenu = document.getElementById("mobile-admin-menu");
    const mobileBasemapSelect = document.getElementById("mobile-basemap");
    const mobileStartupSpotlightEl = document.getElementById("mobile-startup-spotlight");
    const mobileStartupSpotlightLabelEl = document.getElementById("mobile-startup-spotlight-label");
    const mobileStartupSpotlightTitleEl = document.getElementById("mobile-startup-spotlight-title");
    const mobileStartupSpotlightSummaryEl = document.getElementById("mobile-startup-spotlight-summary");
    const mobileStartupSpotlightLearnBtn = document.getElementById("mobile-startup-spotlight-learn");
    const mobileStartupSpotlightDismissBtn = document.getElementById("mobile-startup-spotlight-dismiss");
    const mobileStartupSpotlightCloseBtn = document.getElementById("mobile-startup-spotlight-close");
    const mobilePromoDockEl = document.getElementById("mobile-promo-dock");
    const mobilePromoButtons = [...document.querySelectorAll("[data-mobile-promo-kind]")];
    const mobilePinsToggleBtn = document.getElementById("mobile-pins-toggle");
    const mobileShapesToggleBtn = document.getElementById("mobile-shapes-toggle");
    const exhibitsToggleBtn = document.getElementById("exhibits-toggle");
    const mobileLayerMenu = document.getElementById("mobile-layer-menu");
    const mobileLayerEnableAllBtn = document.getElementById("mobile-layer-enable-all");
    const mobileLayerDisableAllBtn = document.getElementById("mobile-layer-disable-all");
    let mobileLayerBulkReadyAt = 0;
    const mobileLayerExhibitsInput = document.getElementById("mobile-layer-exhibits");
    const mobileLayerPinsInput = document.getElementById("mobile-layer-pins");
    const mobileLayerShapesInput = document.getElementById("mobile-layer-shapes");
    const mobileLayerBiographyPathsInput = document.getElementById("mobile-layer-biography-paths");
    const mobileLayerCategoryInputs = [...document.querySelectorAll(".mobile-layer-category")];
    const mobileLayerEraInputs = [...document.querySelectorAll(".mobile-layer-era")];
    const collapseListBtn = document.getElementById("collapse-list");
    const mobilePanelSizeBtn = document.getElementById("mobile-panel-size-toggle");
    const mobileTimelineEl = document.querySelector(".mobile-timeline");
    const showTimelineBtn = document.getElementById("show-timeline");
    const mobileTimelineCurrentBtn = document.getElementById("mobile-timeline-current");
    const mobileTimelineStatusEl = document.getElementById("mobile-timeline-status");
    const mobileTimelineScrubberEl = document.getElementById("mobile-timeline-scrubber");
    const mobileTimelineScrubberRangeEl = document.getElementById("mobile-timeline-scrubber-range");
    const mobileTimelineScrubberLabelEl = document.getElementById("mobile-timeline-scrubber-label");
    const mobileTimelineScrubberScaleEl = document.getElementById("mobile-timeline-scrubber-scale");
    const listPanelEl = document.querySelector(".list-panel");
    const mobileTabTimelineBtn = document.getElementById("mobile-tab-timeline");
    const mobileTabNearbyBtn = document.getElementById("mobile-tab-nearby");
    const detailEl = document.getElementById("detail");
    const detailHeadEl = detailEl?.querySelector(".detail-head");
    const detailTitleEl = document.getElementById("detail-title");
    const detailBodyEl = document.getElementById("detail-body");
    const detailDrawerHandleEl = document.getElementById("detail-drawer-handle");
    const closeBtn = document.getElementById("close-detail");
    const detailHeroDockEl = document.createElement("div");
    detailHeroDockEl.className = "detail-hero-dock";
    detailHeroDockEl.setAttribute("aria-hidden", "true");
    detailHeroDockEl.setAttribute("role", "button");
    detailHeroDockEl.setAttribute("tabindex", "-1");
    detailHeroDockEl.setAttribute("aria-label", "Show the full site image");
    detailHeadEl?.appendChild(detailHeroDockEl);
    let detailHeroHomeNode = null;
    const bannerEl = document.getElementById("banner");
    const languageQuizModalEl = document.getElementById("language-quiz-modal");
    const plantPhotoViewerEl = document.getElementById("plant-photo-viewer");
    const plantPhotoViewerImageEl = document.getElementById("plant-photo-viewer-image");
    const plantPhotoViewerTitleEl = document.getElementById("plant-photo-viewer-title");
    const plantPhotoViewerCloseBtn = document.getElementById("plant-photo-viewer-close");
    const loginSheetEl = document.getElementById("login-sheet");
    const accountSheetTitleEl = document.getElementById("account-sheet-title");
    const rewardsSheetEl = document.getElementById("rewards-sheet");
    const profilesSheetEl = document.getElementById("profiles-sheet");
    const followingSheetEl = document.getElementById("following-sheet");
    const activitySheetEl = document.getElementById("activity-sheet");
    const notificationsSheetEl = document.getElementById("notifications-sheet");
    const contributeSheetEl = document.getElementById("contribute-sheet");
    const mapStorySheetEl = document.getElementById("map-story-sheet");
    const mapStoryViewSheetEl = document.getElementById("map-story-view-sheet");
    const mapStoryPromptEl = document.getElementById("map-story-prompt");
    const mapStoryPromptHelpEl = document.getElementById("map-story-prompt-help");
    const mapStoryCaptionEl = document.getElementById("map-story-caption");
    const mapStoryPhotoEl = document.getElementById("map-story-photo");
    const mapStoryPhotoButtonEl = document.getElementById("map-story-photo-button");
    const mapStoryPhotoPreviewEl = document.getElementById("map-story-photo-preview");
    const mapStoryLocationEl = document.getElementById("map-story-location");
    const mapStorySubmitEl = document.getElementById("map-story-submit");
    const mapStoryViewEl = document.getElementById("map-story-view");
    const mobileActivityOpenBtn = document.getElementById("mobile-activity-open");
    const mobileActivityListEl = document.getElementById("mobile-activity-list");
    const mobileNotificationsOpenBtn = document.getElementById("mobile-notifications-open");
    const mobileNotificationsListEl = document.getElementById("mobile-notifications-list");
    const contributeStoryOpenBtn = document.getElementById("contribute-story-open");
    const contributeSiteOpenBtn = document.getElementById("contribute-site-open");
    const contributeSiteNoteEl = document.getElementById("contribute-site-note");
    const eventsSheetEl = document.getElementById("events-sheet");
    const settingsSheetEl = document.getElementById("settings-sheet");
    const feedbackSheetEl = document.getElementById("feedback-sheet");
    const storySheetEl = document.getElementById("story-sheet");
    const suggestSiteSheetEl = document.getElementById("suggest-site-sheet");
    // Register sheet dismissal before the optional feature setup below. A
    // missing optional control must never leave a visible sheet without a
    // working close button on Android WebView.
    document.addEventListener("pointerup", closeMobileSheetFromControl);
    const loginEmailEl = document.getElementById("login-email");
    const loginPasswordEl = document.getElementById("login-password");
    const loginSubmitBtn = document.getElementById("login-submit");
    const loginStatusEl = document.getElementById("login-status");
    const registerToggleBtn = document.getElementById("register-toggle");
    const registerPanelEl = document.getElementById("register-panel");
    const registerNameEl = document.getElementById("register-name");
    const registerEmailEl = document.getElementById("register-email");
    const registerPasswordEl = document.getElementById("register-password");
    const registerInviteCodeEl = document.getElementById("register-invite-code");
    const registerSubmitBtn = document.getElementById("register-submit");
    const registerStatusEl = document.getElementById("register-status");
    const passwordResetToggleBtn = document.getElementById("password-reset-toggle");
    const passwordResetPanelEl = document.getElementById("password-reset-panel");
    const passwordResetEmailEl = document.getElementById("password-reset-email");
    const passwordResetPasswordEl = document.getElementById("password-reset-password");
    const passwordResetHelpEl = document.getElementById("password-reset-help");
    const passwordResetNewPasswordFieldEl = document.getElementById("password-reset-new-password-field");
    const passwordResetSubmitBtn = document.getElementById("password-reset-submit");
    const passwordResetStatusEl = document.getElementById("password-reset-status");
    const logoutSubmitBtn = document.getElementById("logout-submit");
    const demoLoginBtn = document.getElementById("demo-login");
    const profileCardEl = document.getElementById("profile-card");
    loginOpenBtn?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      openContributorAccountSheet();
    }, { capture: true });
    document.addEventListener("click", event => {
      if (!event.target?.closest?.("#login-open")) return;
      event.preventDefault();
      event.stopPropagation();
      openContributorAccountSheet();
    }, true);
    const supportGoalEl = document.getElementById("support-goal");
    const visitSummaryEl = document.getElementById("visit-summary");
    const badgeGridEl = document.getElementById("badge-grid");
    const profilesSortEl = document.getElementById("profiles-sort");
    const profilesListEl = document.getElementById("profiles-list");
    const followingListEl = document.getElementById("following-list");
    const eventsListEl = document.getElementById("events-list");
    const historyAlertsEl = document.getElementById("history-alerts");
    const proximityAlertsEl = document.getElementById("proximity-alerts");
    const newContentAlertsEl = document.getElementById("new-content-alerts");
    const notificationTestBtn = document.getElementById("notification-test");
    const storyOverlayEl = document.getElementById("story-overlay");
    const storyProgressBarEl = document.getElementById("story-progress-bar");
    const storyVideoEl = document.getElementById("story-video");
    const storyTextEl = document.getElementById("story-text");
    const storyRecordBtn = document.getElementById("story-record");
    const storyCancelBtn = document.getElementById("story-cancel");
    const storyCameraStatusEl = document.getElementById("story-camera-status");
    const storySavePanelEl = document.getElementById("story-save-panel");
    const storyDownloadLinkEl = document.getElementById("story-download-link");
    const storyShareBtn = document.getElementById("story-share");
    const suggestTitleEl = document.getElementById("suggest-title");
    const suggestIntroEl = document.getElementById("suggest-introduction");
    const suggestImageEl = document.getElementById("suggest-image");
    const suggestLatitudeEl = document.getElementById("suggest-latitude");
    const suggestLongitudeEl = document.getElementById("suggest-longitude");
    const suggestSiteReviewNoteEl = document.getElementById("suggest-site-review-note");
    const suggestClickLocationBtn = document.getElementById("suggest-click-location");
    const suggestUseLocationBtn = document.getElementById("suggest-use-location");
    const suggestSubmitBtn = document.getElementById("suggest-submit");
    const suggestMapPickInstructionsEl = document.getElementById("suggest-map-pick-instructions");
    const suggestMapPickCancelBtn = document.getElementById("suggest-map-pick-cancel");
    const feedbackNameEl = document.getElementById("feedback-name");
    const feedbackEmailEl = document.getElementById("feedback-email");
    const feedbackMessageEl = document.getElementById("feedback-message");
    const feedbackScreenshotEl = document.getElementById("feedback-screenshot");
    const feedbackCaptureBtn = document.getElementById("feedback-capture");
    const feedbackUploadBtn = document.getElementById("feedback-upload");
    const feedbackRemoveScreenshotBtn = document.getElementById("feedback-remove-screenshot");
    const feedbackScreenshotStatusEl = document.getElementById("feedback-screenshot-status");
    const feedbackSubmitBtn = document.getElementById("feedback-submit");

    function loadSettings() {
      const storedSettings = SHARED_UTILS.readStorageJson("nli-mobile-settings", {}) || {};
      const saved = storedSettings && typeof storedSettings === "object" && !Array.isArray(storedSettings) ? storedSettings : {};
      if (!saved.basemapUserSet && saved.basemap === "streets") saved.basemap = "outdoors";
      const settings = {
        historyAlerts: false,
        proximityAlerts: saved.proximityAlerts !== false,
        newContentAlerts: false,
        exhibits: true,
        locationEnabled: true,
        locationPrompted: false,
        basemap: "outdoors",
        showPins: true,
        showShapes: true,
        showBiographyPaths: false,
        layerCategories: {},
        eraCategories: {},
        ...saved
      };
      settings.layerCategories = { ...(saved.layerCategories || {}) };
      settings.eraCategories = { ...(saved.eraCategories || {}) };
      return settings;
    }

    function saveSettings() {
      SHARED_UTILS.writeStorageJson("nli-mobile-settings", state.settings);
    }

    function loadProfile() {
      const saved = SHARED_UTILS.readStorageJson(["nli-contributor-profile", "nli-contributor-session", "nli-mobile-profile"], null);
      if (!saved) return null;
      return PROFILE_UTILS.normalizeStoredContributorProfile(saved, { mobileFields: true });
    }

    function saveProfile(profile) {
      const previousKey = state.profile ? `${state.profile.email || ""}:${state.profile.profileId || ""}:${state.profile.token || ""}` : "";
      state.profile = profile;
      if (profile) {
        const normalized = PROFILE_UTILS.normalizeStoredContributorProfile(profile, { mobileFields: true });
        state.profile = normalized;
        SHARED_UTILS.writeStorageJson(["nli-contributor-profile", "nli-contributor-session", "nli-mobile-profile"], normalized);
        const nextKey = `${normalized.email || ""}:${normalized.profileId || ""}:${normalized.token || ""}`;
        if (nextKey !== previousKey) {
          state.profileActivitySynced = false;
          state.profileActivityCache = null;
        }
      } else {
        SHARED_UTILS.removeStorageKeys(["nli-contributor-profile", "nli-contributor-session", "nli-mobile-profile"]);
        if (previousKey) {
          state.profileActivitySynced = false;
          state.profileActivityCache = null;
        }
      }
      renderProfile();
    }

    function expireProfileSession(message = "Your login expired. Please log back in.") {
      if (!state.profile) return;
      saveProfile(null);
      showBanner(message);
      if (registerPanelEl) registerPanelEl.hidden = true;
      if (state.selectedSite?.slug) openSite(state.selectedSite.slug, { focus: false });
    }

    function trackedMemberProfile() {
      const profile = currentContributorProfile?.();
      if (!profile?.id || state.profile?.pending || state.profile?.approved === false) return null;
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
      if (!Object.keys(payload).length) return null;
      state.memberUsageFlushPromise = patchDirectusItem("mobile_member_profiles", profile.id, payload, { requireAuth: true })
        .then(result => {
          Object.assign(profile, payload, result?.data || {});
          if (state.profile) {
            saveProfile({ ...state.profile, ...payload });
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
      if (saved) {
        renderProfile();
        renderRewards();
      }
      if (!saved) throw new Error(PROFILE_UTILS.contributorWriteSessionMessage("save language progress"));
      return saved;
    }

    const localDateKey = SHARED_UTILS.localDateKey;

    function remoteLoginRewardRecords(profile = state.profile || currentContributorProfile()) {
      return PROFILE_UTILS.profileLoginRewardRecords(state.profileLoginRewards, profileIdentityIds(profile), { relationId });
    }

    async function refreshRemoteLoginRewardsForProfile(profile = state.profile || currentContributorProfile()) {
      const profileIds = [...profileIdentityIds(profile)];
      if (!profileIds.length) return [];
      const response = await fetchJson(
        `/items/mobile_profile_logins?limit=-1&filter[member_profile][_in]=${profileIds.join(",")}&fields=${LOGIN_REWARD_FIELDS}`,
        { fresh: true }
      );
      const incoming = response.data || [];
      state.profileLoginRewards = PROFILE_UTILS.mergeLoginRewardRecords(state.profileLoginRewards, incoming);
      return incoming;
    }

    const loginRewardStatsFromDates = PROFILE_UTILS.loginRewardStatsFromDates;

    function loginRewardStats(profile = state.profile || currentContributorProfile()) {
      if (!profile) return { totalDays: 0, currentStreak: 0, bestStreak: 0, lastLoginDate: "" };
      const remoteDates = remoteLoginRewardRecords(profile).map(item => item.login_date);
      return loginRewardStatsFromDates(remoteDates);
    }

    async function recordDailyLoginReward(profile = state.profile || currentContributorProfile()) {
      if (!profile || profile.pending || profile.approved === false) return null;
      const profileId = relationId(profile.id || profile.profileId);
      if (!profileId) return null;
      await refreshRemoteLoginRewardsForProfile(profile);
      const loginRecords = remoteLoginRewardRecords(profile);
      const currentStats = loginRewardStats(profile);
      if (PROFILE_UTILS.loginRewardRecentlyAwarded(loginRecords, { minHours: 24 })) {
        await refreshRemotePointEventsForProfileId(profileId).catch(() => []);
        return { earned: false, recentlyAwarded: true, ...currentStats };
      }
      const reward = PROFILE_UTILS.nextDailyLoginReward(profileId, currentStats, loginRecords.map(item => item.login_date));
      if (!reward?.earned) return reward;
      const payload = reward.payload;
      const committed = await commitEngagementAction("daily_open", payload);
      const record = committed?.source || null;
      const pointEvent = committed?.data || null;
      if (committed?.recently_awarded) return { earned: false, recentlyAwarded: true, ...loginRewardStats(profile) };
      if (!record) throw new Error("The daily visit could not be confirmed.");
      if (!pointEvent) throw new Error("The daily point could not be confirmed.");
      return { ...reward, earned: committed?.earned !== false };
    }

    async function awardDailyLoginReward(options = {}) {
      try {
        const result = await recordDailyLoginReward(state.profile || currentContributorProfile());
        if (result?.earned && !options.silent) {
          showBanner(`Daily visit point saved. ${result.currentStreak} day streak.`);
          renderProfile();
          renderProfiles();
        }
        return result;
      } catch (error) {
        console.warn("Daily login point could not be saved", error);
        if (!options.silent) showBanner("Login worked, but the daily visit point could not be saved yet.");
        return null;
      }
    }

    function learnedLanguageWords(profile = state.profile || currentContributorProfile()) {
      return PROFILE_UTILS.learnedLanguageWordsFromAttempts(state.languageQuizAttempts, profileIdentityIds(profile), { relationId, wordById: LANGUAGE_QUIZ_WORD_BY_ID });
    }

    function languageCorrectAttemptCount(profile = state.profile || currentContributorProfile()) {
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
      renderProfile();
      renderRewards();
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
        `/items/mobile_language_quiz_progress?limit=-1&filter[member_profile][_eq]=${id}&filter[content_key][_eq]=${encodeURIComponent(contentKey)}&filter[word_id][_eq]=${encodeURIComponent(wordId)}&fields=${LANGUAGE_PROGRESS_FIELDS}`,
        { fresh: true }
      );
      const incoming = response.data || [];
      mergeLanguageAttemptRecords(incoming);
      return incoming.find(item => String(item.answered_at || "").slice(0, 10) === String(dateKey || "").slice(0, 10)) || null;
    }

    async function syncLanguageAttempt(contentKey, word, correct) {
      return PROFILE_UTILS.syncLanguageAttempt({
        profile: currentContributorProfile(),
        profileId: activeContributorProfileId(),
        contentKey,
        word,
        correct,
        attempts: state.languageQuizAttempts,
        relationId,
        refreshRemoteAttempt: refreshRemoteLanguageAttempt,
        remoteAttemptExists: languageRemoteAttemptExists,
        recordPointForAttempt: recordLanguagePointForAttempt,
        commitEngagementAction,
        refreshRemotePointEvents: refreshRemotePointEventsForProfileId,
        mergePointEventRecords
      });
    }

    function siteVisitRecord(profile, site) {
      return PROFILE_UTILS.siteVisitRecord(state.publicVisits, profile, site, {
        relationId,
        fallbackProfileId: state.profile?.profileId
      });
    }

    function mergeVisitRecords(records = []) {
      PROFILE_UTILS.mergeVisitRecords(state.publicVisits, records, { relationId });
    }

    async function refreshRemoteSiteVisitsForProfileSite(profile, site) {
      const profileId = Number(relationId(profile?.id || profile?.profileId || state.profile?.profileId));
      if (!profileId || !site?.slug) return [];
      const response = await fetchJson(
        `/items/mobile_site_visits?limit=-1&filter[member_profile][_eq]=${profileId}&filter[site_slug][_eq]=${encodeURIComponent(site.slug)}&fields=${PUBLIC_VISIT_FIELDS}`,
        { fresh: true }
      );
      const incoming = response.data || [];
      mergeVisitRecords(incoming);
      return incoming;
    }

    function siteHasCheckin(profile, site) {
      return PROFILE_UTILS.siteHasCheckin(state.publicVisits, profile, site, {
        relationId,
        fallbackProfileId: state.profile?.profileId
      });
    }

    function siteHasRecordedCheckin(profile, site) {
      if (siteHasCheckin(profile, site)) return true;
      const profileId = Number(relationId(profile?.id || profile?.profileId || state.profile?.profileId));
      if (!profileId || !site?.slug) return false;
      const matchingVisits = (state.publicVisits || [])
        .filter(visit => Number(relationId(visit.member_profile)) === profileId && String(visit.site_slug || "") === String(site.slug))
      const visitIds = new Set(matchingVisits.map(visit => String(visit.id || "")).filter(Boolean));
      const hasLegacyCommunityCheckin = String(site.site_type || "").trim().toLowerCase() === "community_resource" &&
        matchingVisits.some(visit => !PROFILE_UTILS.hasSavedCheckinDistance(visit.distance_miles));
      return hasLegacyCommunityCheckin || (state.profilePointEvents || []).some(event =>
        Number(relationId(event.member_profile)) === profileId &&
        String(event.event_type || "") === "site_checkin" &&
        (String(event.source_slug || "") === String(site.slug) || visitIds.has(String(event.source_id || "")))
      );
    }

    function siteVisitPayload(profile, site, options = {}) {
      return PROFILE_UTILS.siteVisitPayload(profile, site, {
        ...options,
        relationId,
        fallbackProfileId: state.profile?.profileId
      });
    }

    async function recordSiteVisit(site, options = {}) {
      const profile = currentContributorProfile();
      if (!profile?.id || !isApprovedContributor() || !site?.slug) return null;
      const distanceMiles = Number(options.distanceMiles);
      const wantsCheckin = Number.isFinite(distanceMiles);
      if (wantsCheckin && distanceMiles > SITE_CHECKIN_RADIUS_MILES) {
        throw new Error(`Check-ins unlock within ${SITE_CHECKIN_RADIUS_MILES.toFixed(2)} mi of this site.`);
      }
      let existing = siteVisitRecord(profile, site);
      if (!existing || (wantsCheckin && !siteHasRecordedCheckin(profile, site))) {
        await refreshRemoteSiteVisitsForProfileSite(profile, site).catch(() => []);
        existing = siteVisitRecord(profile, site);
      }
      if (existing && (!wantsCheckin || siteHasRecordedCheckin(profile, site))) return { earned: false, record: existing };
      const payload = siteVisitPayload(profile, site, options);
      if (!payload) return null;
      if (existing?.id && wantsCheckin) {
        try {
          const committed = await commitEngagementAction("site_checkin", {
            distance_miles: payload.distance_miles,
            public_activity: true
          }, existing.id);
          Object.assign(existing, committed?.source || payload);
          const pointEvent = committed?.data || null;
          if (!pointEvent) throw new Error("The check-in point could not be confirmed.");
          renderProfile();
          renderRewards();
          return { earned: true, checkin: true, record: existing };
        } catch (error) {
          throw error;
        }
      }
      const committed = await commitEngagementAction("site_visit", payload);
      const record = committed?.source || null;
      const visitPoint = committed?.data || null;
      if (!record) throw new Error("The visit could not be confirmed.");
      if (!visitPoint) throw new Error("The visit point could not be confirmed.");
      if (wantsCheckin) {
        const checkin = await commitEngagementAction("site_checkin", {
          distance_miles: payload.distance_miles,
          public_activity: true
        }, record.id);
        const checkinPoint = checkin?.data || null;
        if (!checkinPoint) throw new Error("The check-in point could not be confirmed.");
      }
      renderProfile();
      renderRewards();
      return { earned: true, checkin: wantsCheckin, record };
    }

    function mergeSeededProfiles(profiles) {
      return PROFILE_UTILS.mergeSeededProfiles(profiles, SEEDED_PUBLIC_PROFILES);
    }

    function mergeSeededComments(comments) {
      return COMMENT_UTILS.mergeSeededComments(comments, SEEDED_PUBLIC_COMMENTS, {
        keyFor: comment => String(comment?.id || "")
      });
    }

    const normalizeAccountEmail = PROFILE_UTILS.normalizeAccountEmail;
    const profileSlugFromEmail = PROFILE_UTILS.profileSlugFromEmail;

    async function registerLocalAccount({ displayName, email, password, inviteCode = "" }) {
      const normalizedEmail = normalizeAccountEmail(email);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) throw new Error("Enter a valid email address.");
      if (String(password || "").length < 10) throw new Error("Password must be at least 10 characters.");
      const profile = {
        display_name: displayName || normalizedEmail,
        email: normalizedEmail,
        username: normalizedEmail,
        role: "Account awaiting review",
        roleLabel: "Account awaiting review",
        pending: true,
        approved: false,
        local: true,
        registrationSynced: false
      };
      const response = await fetch("https://nativelongisland.com/account-registration.php", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password, display_name: profile.display_name })
      });
      const registrationRecord = await response.json().catch(() => ({}));
      if (!response.ok || !registrationRecord?.ok) throw new Error(registrationRecord?.error || "Could not create contributor account request.");
      profile.registrationSynced = true;
      profile.registrationId = registrationRecord?.data?.id || null;
      if (profile.registrationSynced) {
        try {
          await FEEDBACK_UTILS.sendAccountSignupEmail(
            { ...(registrationRecord?.data || {}), id: profile.registrationId || registrationRecord?.data?.id },
            { appUrl: window.location.href, platform: "mobile" }
          );
          profile.signupEmailSent = true;
        } catch (error) {
          profile.signupEmailSent = false;
          profile.signupEmailError = "Your account request was saved, but the admin email could not be sent. Please use Feedback to let us know.";
          console.warn("Account signup email failed:", error);
        }
      }
      const cleanedInviteCode = String(inviteCode || "").trim();
      if (cleanedInviteCode && profile.registrationSynced) {
        try {
          const inviteResult = await FEEDBACK_UTILS.redeemAccountInviteCode({
            code: cleanedInviteCode,
            email: normalizedEmail,
            registrationId: profile.registrationId || registrationRecord?.data?.id
          }, { platform: "mobile" });
          profile.inviteRedeemed = !!inviteResult?.ok;
          profile.invitePointsAwarded = Number(inviteResult?.points_awarded || 0);
        } catch (error) {
          profile.inviteError = error.message || "Invite code could not be applied.";
        }
      }
      profile.reviewTodoSynced = profile.registrationSynced;
      profile.memberProfileSynced = true;
      return profile;
    }

    async function requestPasswordReset({ email }) {
      const normalizedEmail = normalizeAccountEmail(email);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) throw new Error("Enter the email for the account.");
      let response = await fetch(`${DIRECTUS}/auth/password/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, reset_url: ROUTE_UTILS.passwordResetReturnUrl(window.location) })
      });
      if (!response.ok && response.status === 400) {
        response = await fetch(`${DIRECTUS}/auth/password/request`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail })
        });
      }
      if (!response.ok) throw new Error("Could not send reset email.");
      return true;
    }

    async function completePasswordReset({ password }) {
      if (!state.passwordResetToken) throw new Error("This reset link is missing its token. Request a new reset email.");
      if (String(password || "").length < 8) throw new Error("New password must be at least 8 characters.");
      const response = await fetch(`${DIRECTUS}/auth/password/reset`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: state.passwordResetToken, password })
      });
      if (!response.ok) throw new Error("This reset link is expired or has already been used.");
      state.passwordResetToken = "";
      ROUTE_UTILS.clearPasswordResetUrl({ location: window.location, history });
      return true;
    }

    const money = PROFILE_UTILS.money;
    const supportMonths = PROFILE_UTILS.supportMonths;
    const supporterLine = PROFILE_UTILS.supporterLine;

    function monthlySupportCurrent() {
      const configured = Number(state.supportSettings?.current_monthly_support);
      if (configured > 0) return configured;
      return state.contributorProfiles.reduce((sum, profile) => {
        return sum + (profile.is_monthly_supporter ? Number(profile.support_monthly_amount || 0) : 0);
      }, 0);
    }

    function renderSupportGoal() {
      if (!supportGoalEl) return;
      const settings = state.supportSettings;
      if (!settings?.show_support_goal) {
        supportGoalEl.hidden = true;
        supportGoalEl.innerHTML = "";
        return;
      }
      const goal = Number(settings.monthly_goal || 200);
      const current = monthlySupportCurrent();
      const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
      supportGoalEl.hidden = false;
      supportGoalEl.innerHTML = `
        <div class="support-row">
          <strong>${escapeHtml(settings.title || "Support On This Site")}</strong>
          <span class="detail-meta">${money(current)} / ${money(goal)} monthly</span>
        </div>
        <div class="support-meter" aria-label="${escapeHtml(`${pct}% of monthly support goal`)}"><span style="width:${pct}%"></span></div>
        <p class="detail-meta">${escapeHtml(settings.support_note || "Monthly support keeps On This Site online and growing.")}</p>
        <button class="action secondary" type="button" data-app-page="support">Support Project</button>
      `;
    }

    const escapeHtml = SHARED_UTILS.escapeHtml;

    function languageQuizContentKey(type, item) {
      return PROFILE_UTILS.languageQuizContentKey(type, item);
    }

    function languageQuizAlreadyUsedToday(contentKey) {
      const profile = currentContributorProfile();
      if (!state.profile || !profile) return true;
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
      return PROFILE_UTILS.languageWordForText(LANGUAGE_QUIZ_WORDS, text, { requireIncludes: true });
    }

    function canUseLanguageQuiz() {
      return canShowContributorProgress();
    }

    function attachLanguageQuizMarkers(type, item) {
      if (!detailBodyEl || !canUseLanguageQuiz()) return;
      const contentKey = languageQuizContentKey(type, item);
      if (languageQuizAlreadyUsedToday(contentKey)) return;
      if (detailBodyEl.querySelector(".language-quiz-marker")) return;
      const walker = document.createTreeWalker(detailBodyEl, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || !node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
          if (parent.closest("a, button, input, textarea, select, script, style, .kid-friendly-section, .language-vocab-card, .language-quiz-marker")) return NodeFilter.FILTER_REJECT;
          if (parent.closest("[hidden]") || parent.offsetParent === null) return NodeFilter.FILTER_REJECT;
          return languageWordForText(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      });
      const node = walker.nextNode();
      if (!node) return;
      const word = languageWordForText(node.nodeValue);
      if (!word) return;
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
      const button = document.createElement("button");
      button.type = "button";
      button.className = "language-quiz-marker";
      button.textContent = "!";
      button.setAttribute("aria-label", `Language quiz for ${word.english}`);
      button.dataset.languageQuizId = word.id;
      button.dataset.languageContentKey = contentKey;
      button.dataset.languageContentTitle = item?.title || "current story";
      term.parentNode.insertBefore(button, after);
    }

    function decorateCurrentDetailForLanguageQuiz(type, item) {
      window.requestAnimationFrame(() => attachLanguageQuizMarkers(type, item));
    }

    function languageQuizChoices(word) {
      const distractors = LANGUAGE_QUIZ_WORDS
        .filter(item => item.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .map(item => item.algonquian);
      return [word.algonquian, ...distractors].sort(() => Math.random() - 0.5);
    }

    function openLanguageQuiz(wordId, contentKey, contentTitle) {
      const word = LANGUAGE_QUIZ_WORDS.find(item => item.id === wordId);
      if (!word || !languageQuizModalEl) return;
      languageQuizModalEl.innerHTML = `
        <div class="language-quiz-card">
          <h3 id="language-quiz-title">Language quiz</h3>
          <p class="summary">Which Algonquian word matches <strong>${escapeHtml(word.english)}</strong>?</p>
          <div class="language-quiz-options">
            ${languageQuizChoices(word).map(choice => `<button class="language-quiz-option" type="button" data-language-answer="${escapeHtml(choice)}" data-language-word="${escapeHtml(word.id)}" data-language-content-key="${escapeHtml(contentKey)}">${escapeHtml(choice)}</button>`).join("")}
          </div>
          <p class="language-quiz-result" data-language-result hidden></p>
          <p class="detail-meta">One try per article each day. Correct answers add 1 point to Language in your profile.</p>
          <p class="detail-meta">Source: ${escapeHtml(word.source)}</p>
          <button class="action secondary" type="button" data-close-language-quiz>Close</button>
        </div>
      `;
      languageQuizModalEl.hidden = false;
    }

    async function answerLanguageQuiz(button) {
      const word = LANGUAGE_QUIZ_WORDS.find(item => item.id === button.dataset.languageWord);
      if (!word || button.dataset.answered) return;
      const card = button.closest(".language-quiz-card");
      const buttons = [...card.querySelectorAll("[data-language-answer]")];
      const contentKey = button.dataset.languageContentKey || "";
      if (languageQuizAlreadyUsedToday(contentKey)) {
        buttons.forEach(item => {
          item.dataset.answered = "true";
          item.disabled = true;
        });
        const result = card.querySelector("[data-language-result]");
        if (result) {
          result.hidden = false;
          result.textContent = "You already tried this language quiz today.";
        }
        detailBodyEl.querySelector(`.language-quiz-marker[data-language-quiz-id="${CSS.escape(word.id)}"]`)?.remove();
        return;
      }
      const correct = button.dataset.languageAnswer === word.algonquian;
      buttons.forEach(item => {
        item.dataset.answered = "true";
        item.disabled = true;
        if (item.dataset.languageAnswer === word.algonquian) item.classList.add("correct");
      });
      if (!correct) button.classList.add("wrong");
      const result = card.querySelector("[data-language-result]");
      if (result) {
        result.hidden = false;
        result.textContent = "Saving language progress...";
      }
      try {
        const saved = await saveLanguageAttempt(contentKey, word, correct);
        if (correct && !saved?._languagePointEvent) throw new Error("Your answer was saved, but the language point could not be confirmed. Please try again.");
        if (result) {
          result.textContent = correct
            ? (saved?._existingAttempt ? "Language point is saved. Word is on your profile." : "+1 point. Word added to your Language profile.")
            : `Not this time. The answer is ${word.algonquian}.`;
        }
        detailBodyEl.querySelector(`.language-quiz-marker[data-language-quiz-id="${CSS.escape(word.id)}"]`)?.remove();
        showBanner(correct ? "Language point added." : "Language quiz saved for today.");
      } catch (error) {
        buttons.forEach(item => {
          delete item.dataset.answered;
          item.disabled = false;
          item.classList.remove("correct", "wrong");
        });
        const message = error?.message || "Could not save language progress to Directus. Please log in again and try once more.";
        if (result) result.textContent = message;
        showBanner(message);
      }
    }

    const profileWebsiteUrl = PROFILE_UTILS.profileWebsiteUrl;

    const profileJoinedDateValue = PROFILE_UTILS.profileJoinedDateValue;

    const profileAccountAgeLabel = PROFILE_UTILS.profileAccountAgeLabel;

    const profileUserSinceLine = PROFILE_UTILS.profileUserSinceLine;

    function formatVisitDate(value) {
      return formatDate(value, { fallback: "Visited" });
    }

    function mergedProfileVisits(profile = currentContributorProfile()) {
      const bySlug = new Map();
      const profileIds = profileIdentityIds(profile);
      if (profileIds.size) {
        state.publicVisits
          .filter(visit => profileIds.has(Number(relationId(visit.member_profile))))
          .forEach(visit => {
            if (!visit?.site_slug) return;
            const existing = bySlug.get(visit.site_slug);
            if (!existing || String(visit.visited_at || "") > String(existing.visited_at || "")) bySlug.set(visit.site_slug, visit);
          });
      }
      return [...bySlug.values()].sort((a, b) => String(b.visited_at || "").localeCompare(String(a.visited_at || "")));
    }

    function stripHtml(value) {
      const div = document.createElement("div");
      div.innerHTML = String(value || "")
        .replace(/This map feature is imported from WP Go Maps but is not paired to (?:a complete )?[^.]*listing yet\.?/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/&nbsp;/gi, " ");
      return div.textContent.replace(/\s+/g, " ").trim();
    }

    function cleanPlainText(value) {
      const textarea = document.createElement("textarea");
      textarea.innerHTML = String(value || "");
      let text = textarea.value;
      for (let index = 0; index < 2; index += 1) text = stripHtml(text);
      return text
        .replace(/This map feature is imported from WP Go Maps but is not paired to (?:a complete )?[^.]*listing yet\.?/gi, " ")
        .replace(/\[[^\]]{0,140}\]/g, " ")
        .replace(/\{[^}]{0,140}\}/g, " ")
        .replace(/<\/?[a-z][^>]*>/gi, " ")
        .replace(/&(?:nbsp|amp|quot|apos|lt|gt);/gi, " ")
        .replace(/\s+/g, " ")
        .replace(/\s+([.,;:!?])/g, "$1")
        .trim();
    }

    function decodeImportedText(value) {
      const textarea = document.createElement("textarea");
      textarea.innerHTML = String(value || "")
        .replace(/Ã‚Â /g, " ")
        .replace(/Ã‚/g, "")
        .replace(/Ã¢â‚¬â„¢|&#8217;|&rsquo;/g, "'")
        .replace(/Ã¢â‚¬Ëœ|&#8216;|&lsquo;/g, "'")
        .replace(/Ã¢â‚¬Å“|&#8220;|&ldquo;/g, "\"")
        .replace(/Ã¢â‚¬Â|&#8221;|&rdquo;/g, "\"")
        .replace(/Ã¢â‚¬â€œ|&#8211;/g, "-")
        .replace(/Ã¢â‚¬â€|&#8212;/g, "-")
        .replace(/&nbsp;/gi, " ");
      return textarea.value.replace(/\s+/g, " ").trim();
    }

    function importedFootnoteSources(value) {
      return SHARED_UTILS.importedFootnoteSources(value, {
        cleanText: cleanPlainText,
        normalizeText: decodeImportedText
      });
    }

    const removeFootnoteReferenceMarkers = SHARED_UTILS.removeFootnoteReferenceMarkers;

    function cleanHtml(value) {
      return HTML_UTILS.cleanHtml(value, { mode: "mobile", convertFootnotes: false, rewriteMediaUrl, internalHref, cleanImageUrl });
    }

    function firstContentImage(html) {
      const template = document.createElement("template");
      template.innerHTML = html || "";
      const image = template.content.querySelector("img");
      const src = cleanImageUrl(image?.getAttribute("data-src") || image?.getAttribute("src") || "");
      return src ? rewriteMediaUrl(src) : "";
    }

    function formatSectionContent(title, content, options = {}) {
      const html = cleanHtml(content);
      const shouldRenderTimeline = HTML_UTILS.shouldRenderSectionTimeline(title);
      const rendered = shouldRenderTimeline ? (sectionTimelineHtml(html) || html) : html;
      return autoLinkHtml(rendered, options);
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
          if (!parent || !node.nodeValue.trim() || parent.closest("a, button, h1, h2, h3, h4, .timeline-year")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      for (const node of textNodes) linkFirstAvailableTerm(node, used, excludeHref);
      return template.innerHTML;
    }

    function linkFirstAvailableTerm(node, used, excludeHref) {
      const value = node.nodeValue;
      for (const term of state.linkTerms) {
        if (used.has(term.href) || term.href === excludeHref) continue;
        const index = indexOfInternalLinkTerm(value, term.label);
        if (index < 0) continue;
        const fragment = document.createDocumentFragment();
        if (index) fragment.appendChild(document.createTextNode(value.slice(0, index)));
        const link = document.createElement("a");
        link.href = term.href;
        link.textContent = value.slice(index, index + term.label.length);
        fragment.appendChild(link);
        if (index + term.label.length < value.length) fragment.appendChild(document.createTextNode(value.slice(index + term.label.length)));
        node.replaceWith(fragment);
        used.add(term.href);
        return;
      }
    }

    function indexOfInternalLinkTerm(value, term) {
      const text = String(value || "").toLowerCase();
      const needle = String(term || "").toLowerCase();
      let index = text.indexOf(needle);
      while (index >= 0) {
        const before = index ? text[index - 1] : "";
        const after = text[index + needle.length] || "";
        if (!/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after)) return index;
        index = text.indexOf(needle, index + 1);
      }
      return -1;
    }

    function sectionTimelineHtml(html) {
      return SHARED_UTILS.sectionTimelineHtml(html, {
        stripHtml,
        renderTimelineRun: events => `
          <div class="timeline section-derived-timeline">
            ${events.map(event => {
              const rawBody = event.nodes.join("") || "<p></p>";
              const sourceNote = importedFootnoteSources(rawBody).join("; ");
              const bodyHtml = removeFootnoteReferenceMarkers(rawBody);
              return `
                <article class="timeline-item section-derived-moment">
                  <div class="timeline-year">${escapeHtml(event.year)}</div>
                  <div class="timeline-body">${bodyHtml}</div>
                  ${sourceNote ? `
                    <button class="timeline-source-info" type="button" data-timeline-source-info data-source-reference="${escapeHtml(sourceNote)}" aria-label="Show source reference" aria-expanded="false" title="${escapeHtml(sourceNote)}">i</button>
                    <div class="timeline-source-popover" role="note"><div>${HTML_UTILS.sourceReferenceTextHtml(sourceNote, { escapeHtml })}</div><div class="timeline-source-copy-hint">Source reference.</div></div>
                  ` : ""}
                </article>
              `;
            }).join("")}
          </div>
        `
      });
    }

    function publicCleanText(value) {
      return cleanPlainText(value);
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
      const summary = publicWikiSummary(article);
      const content = SITE_UTILS.stripInternalPublicSiteSections(article.content);
      const whyThisMatters = SITE_UTILS.stripInternalPublicSiteSections(article.why_this_matters);
      if (summary === article.summary && content === article.content && whyThisMatters === article.why_this_matters) return article;
      return { ...article, summary, content, why_this_matters: whyThisMatters };
    }

    function sourceAwareSectionHtml(title, content, options = {}) {
      const sourceNote = importedFootnoteSources(content).join("; ");
      const html = removeFootnoteReferenceMarkers(formatSectionContent(title, content, {
        used: options.linked,
        excludeHref: options.excludeHref
      }));
      return `
        <section class="section${sourceNote ? " has-source" : ""}"${options.introduction ? ` data-site-introduction="section"` : ""}>
          <h3>${escapeHtml(title)}</h3>
          <div class="section-content">${html}</div>
          ${sourceNote ? `
            <button class="timeline-source-info" type="button" data-timeline-source-info data-source-reference="${escapeHtml(sourceNote)}" aria-label="Show source reference" aria-expanded="false" title="${escapeHtml(sourceNote)}">i</button>
            <div class="timeline-source-popover" role="note"><div>${HTML_UTILS.sourceReferenceTextHtml(sourceNote, { escapeHtml })}</div><div class="timeline-source-copy-hint">Source reference.</div></div>
          ` : ""}
        </section>
      `;
    }

    function rewriteMediaUrl(url) {
      return MEDIA_UTILS.rewriteMediaUrl(url, { mediaMap: state.mediaMap });
    }

    function internalHref(value) {
      return ROUTE_UTILS.internalHref(value);
    }

    function listingImage(site) {
      if (isOfflineTextMode()) return "";
      return MEDIA_UTILS.listingHeroImage(site, { directusAssetUrl, rewriteMediaUrl });
    }

    function listingImageFallback(site) {
      if (isOfflineTextMode()) return "";
      return MEDIA_UTILS.listingRewrittenImageFallback(site, { directusAssetUrl, rewriteMediaUrl });
    }

    function isBundledMobileImageUrl(url) {
      const value = String(url || "").trim();
      if (!value) return false;
      if (/^(?:data:|blob:)/i.test(value)) return true;
      try {
        const parsed = new URL(value, window.location.href);
        const path = parsed.pathname.replace(/^\/+/, "");
        return path.startsWith("assets/");
      } catch {
        return /^(?:assets\/|\.\/assets\/)/i.test(value);
      }
    }

    function mobileSnapshotImageUrl(url) {
      const value = String(url || "").trim();
      if (isOfflineTextMode()) return "";
      if (!isApkSnapshotMode()) return value;
      return isBundledMobileImageUrl(value) ? value : "";
    }

    function removeUnbundledSnapshotImages(root) {
      if (!isApkSnapshotMode() || !root) return;
      root.querySelectorAll("img").forEach(image => {
        if (isOfflineTextMode() || !isBundledMobileImageUrl(image.getAttribute("src") || image.currentSrc)) image.remove();
      });
    }

    function siteHasHeaderImage(site) {
      return Boolean(
        directusAssetUrl(site?.listing_image_file) ||
        MEDIA_UTILS.cleanImageUrl(site?.listing_image_url) ||
        MEDIA_UTILS.cleanImageUrl(site?.listing_image_thumb_url)
      );
    }

    function imageErrorAction(fallback) {
      if (isApkSnapshotMode()) return "this.remove()";
      return MEDIA_UTILS.imageErrorAction(fallback, { removeAction: "this.remove()" });
    }

    function siteCardThumbHtml(site) {
      const icon = siteMapIconUrl(site);
      const image = mobileSnapshotImageUrl(icon || listingImage(site));
      const fallback = mobileSnapshotImageUrl(icon ? listingImage(site) || listingImageFallback(site) : listingImageFallback(site));
      if (!image) return `<span class="thumb empty">${escapeHtml((site.title || "?").slice(0, 1))}</span>`;
      return `<img class="thumb${icon ? " map-icon" : ""}" src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async" onerror="${imageErrorAction(fallback)}">`;
    }

    function searchResultThumbHtml(item) {
      if (item?.resultType !== "wiki") return siteCardThumbHtml(item);
      return `<span class="thumb empty">${escapeHtml((item.title || "A").slice(0, 1))}</span>`;
    }

    const directusAssetUrl = value => SHARED_UTILS.directusAssetUrl(value, DIRECTUS);
    const repairSiteTitles = sites => SITE_TITLE_UTILS.repairSites(sites);

    const relationId = SHARED_UTILS.relationId;

    const normalizeText = SHARED_UTILS.normalizeText;

    function isBroadTerritory(site) {
      return SITE_UTILS.isBroadTerritory(site, { normalizeText, matchAnyAncestral: true });
    }

    const numeric = SHARED_UTILS.numeric;

    function isExhibitActive(exhibit) {
      return CALENDAR_UTILS.isExhibitActive(exhibit, { normalizeText, localDateKey });
    }

    function exhibitHasSiteMapPin(exhibit) {
      const linkedSlug = exhibit?.related_site_slug || exhibit?.source_slug || "";
      const exhibitSlug = exhibit?.slug || "";
      return state.mapSites.some(site => {
        if (linkedSlug && site.slug === linkedSlug) return true;
        return exhibitSlug && site.slug === exhibitSlug && siteDisplayGeometry(site)?.type === "Point";
      });
    }

    function shouldShowExhibitMarker(exhibit) {
      return state.settings.exhibits && isExhibitActive(exhibit) && !exhibitHasSiteMapPin(exhibit);
    }

    function collectCoordinates(value, output) {
      GEOMETRY_UTILS.collectCoordinates(value, output);
    }

    function geometryCenter(geometry) {
      return GEOMETRY_UTILS.geometryBoundsCenter(geometry);
    }

    function geometryBounds(geometry) {
      return GEOMETRY_UTILS.geometryBounds(geometry);
    }

    function geometryBoundsArea(geometry) {
      return GEOMETRY_UTILS.geometryBoundsArea(geometry);
    }

    function pointInGeometry(point, geometry) {
      return GEOMETRY_UTILS.pointInGeometry(point, geometry);
    }

    function pointWithinBounds(point, bounds) {
      return GEOMETRY_UTILS.pointWithinBounds(point, bounds);
    }

    function territoryForPoint(point) {
      if (!point) return null;
      return state.mapSites
        .filter(site => isBroadTerritory(site))
        .map(site => ({ site, geometry: siteDisplayGeometry(site) }))
        .filter(item => pointInGeometry(point, item.geometry))
        .sort((a, b) => geometryBoundsArea(a.geometry) - geometryBoundsArea(b.geometry))[0]?.site || null;
    }

    function territoryLineForPoint(point) {
      const territory = territoryForPoint(point);
      return territory?.title ? `You are on ${territory.title}` : "";
    }

    function territoryForSite(site) {
      const center = site?.center || geometryCenter(siteDisplayGeometry(site));
      if (!center) return null;
      const territory = territoryForPoint(center);
      if (!territory?.slug || territory.slug === site.slug) return null;
      return territory;
    }

    function homelandKeyForSite(site) {
      if (!site) return "";
      if (isBroadTerritory(site)) return `territory:${site.id || site.slug || site.title}`;
      const linkedTerritoryId = relationId(site.ancestral_territory);
      if (linkedTerritoryId) return `territory:${linkedTerritoryId}`;
      const territory = territoryForSite(site);
      return territory ? `territory:${territory.id || territory.slug || territory.title}` : "";
    }

    function distinctVisitedHomelandCount(sites = []) {
      return new Set((sites || []).map(homelandKeyForSite).filter(Boolean)).size;
    }

    function mobileSiteTitleHtml(site) {
      const territory = territoryForSite(site);
      return `
        <h2>${escapeHtml(site.title)}</h2>
        ${placeAdoptionBylineHtml(site)}
        <p class="detail-meta">${escapeHtml(siteSubtitle(site))} ${distanceLabel(site) ? ` - ${escapeHtml(distanceLabel(site))}` : ""}</p>
        ${territory ? `<button class="detail-territory-link" type="button" data-site-territory-slug="${escapeHtml(territory.slug)}">On ${escapeHtml(territory.title)}</button>` : ""}
      `;
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

    function mobileAdoptPlaceCtaHtml(item = {}) {
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
            <button class="action adopt-place-button" type="button" data-mobile-adopt-place data-adopt-place-slug="${escapeHtml(slug)}" data-adopt-place-title="${escapeHtml(title)}">
              ${active ? "Add support for this place" : "Adopt this place - $25/month"}
            </button>
          </div>
        </section>
      `;
    }

    function renderCurrentTerritoryStatus() {
      if (!territorySubtitleEl) return;
      const territory = territoryForPoint(state.userLocation);
      if (!territory) {
        territorySubtitleEl.hidden = true;
        territorySubtitleEl.textContent = "";
        delete territorySubtitleEl.dataset.territorySlug;
        territorySubtitleEl.removeAttribute("aria-label");
        return;
      }
      territorySubtitleEl.hidden = false;
      territorySubtitleEl.dataset.territorySlug = territory.slug || "";
      territorySubtitleEl.textContent = `You are on ${territory.title}`;
      territorySubtitleEl.setAttribute("aria-label", `Open ${territory.title}`);
    }

    function polygonLabelSize(site) {
      const bounds = geometryBounds(siteDisplayGeometry(site));
      if (!bounds) return 10;
      const width = Math.abs(bounds[1][0] - bounds[0][0]);
      const height = Math.abs(bounds[1][1] - bounds[0][1]);
      const area = Math.max(width * height, 0.00001);
      if (isBroadTerritory(site)) return 12;
      if (area > 0.06) return 10;
      if (area > 0.015) return 9;
      return 8;
    }

    function activeMapSites() {
      return state.mapSites.filter(siteVisibleInMobileLayers);
    }

    function invalidateMapSourceCache() {
      state.mapSourceCache = null;
      state.mapSourceCacheKey = "";
      state.mapSourceRevision += 1;
    }

    function polygonLabelCollection(kind = "all", sites = state.mapSites) {
      return {
        type: "FeatureCollection",
        features: sites
          .filter(site => {
            const type = siteDisplayGeometry(site)?.type;
            return type === "Polygon" || type === "MultiPolygon";
          })
          .filter(site => kind === "territory" ? isBroadTerritory(site) : !isBroadTerritory(site))
          .map(site => {
            const center = (Array.isArray(site.territory_label_point) && site.territory_label_point.length >= 2)
              ? site.territory_label_point
              : geometryCenter(siteDisplayGeometry(site));
            if (!center) return null;
            return {
              type: "Feature",
              geometry: { type: "Point", coordinates: center },
              properties: {
                slug: site.slug,
                title: site.title,
                label_size: polygonLabelSize(site)
              }
            };
          })
          .filter(Boolean)
      };
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

    function siteAttentionFeatureCollection(sites = activeMapSites()) {
      const visibleSites = new Set((sites || []).map(site => site?.slug).filter(Boolean));
      const entries = activeSiteAttentionEntries();
      return {
        type: "FeatureCollection",
        features: [...entries.entries()].map(([slug, attention]) => {
          if (!visibleSites.has(slug)) return null;
          const site = state.siteBySlug.get(slug) || state.sites.find(item => item.slug === slug);
          const geometry = siteDisplayGeometry(site);
          const center = geometryCenter(geometry);
          if (!site || !center) return null;
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: center },
            properties: {
              slug: site.slug,
              title: site.title,
              attention_kind: attention.kind,
              attention_reason: attention.reason,
              layer_categories: SITE_UTILS.siteLayerCategoryKeys(site).join(" ")
            }
          };
        }).filter(Boolean)
      };
    }

    function siteDisplayGeometry(site) {
      const displayGeometry = site?.display_geojson || null;
      if (SITE_UTILS.siteUsesDefaultBluePin?.(site)) {
        const center = geometryCenter(site?.geojson || displayGeometry);
        return center ? { type: "Point", coordinates: center } : (displayGeometry || site?.geojson || null);
      }
      if (displayGeometry) {
        let geometry = restoreContainedLandPieces(site, displayGeometry);
        if (/montaukett/i.test(`${site?.title || ""} ${site?.slug || ""}`)) {
          const gardiners = islandPolygonFromMask("gardiners");
          geometry = gardiners ? appendPolygonToGeometry(geometry, gardiners) : geometry;
        }
        return geometry;
      }
      if (site?.geojson) return site.geojson;
      return null;
    }

    async function ensureLandMask() {
      if (state.landMaskData !== null) return state.landMaskData;
      if (state.landMaskPromise) return state.landMaskPromise;
      state.landMaskPromise = fetch(`${LAND_MASK_URL}?v=${LAND_MASK_VERSION}`, { cache: "force-cache" })
        .then(response => {
          if (!response.ok) throw new Error(`Land mask unavailable: ${response.status}`);
          return response.json();
        })
        .then(mask => {
          state.landMaskData = mask?.type === "Feature" ? mask : null;
          return state.landMaskData;
        })
        .catch(error => {
          console.warn("Mobile land mask could not be loaded for shoreline display cleanup.", error);
          state.landMaskData = null;
          return null;
        });
      return state.landMaskPromise;
    }

    function islandPolygonFromMask(name) {
      if (!state.landMaskData?.geometry) return null;
      const matchers = {
        gardiners: center => center[0] > -72.18 && center[0] < -71.98 && center[1] > 41.02 && center[1] < 41.15
      };
      const matcher = matchers[name];
      if (!matcher) return null;
      const polygons = state.landMaskData.geometry.type === "Polygon"
        ? [state.landMaskData.geometry.coordinates]
        : (state.landMaskData.geometry.coordinates || []);
      for (const rings of polygons) {
        const center = ringCenter(rings?.[0] || []);
        if (center && matcher(center)) return rings;
      }
      return null;
    }

    function restoreContainedLandPieces(site, displayGeometry) {
      const sourceGeometry = site?.geojson || displayGeometry;
      if (!state.landMaskData?.geometry || !sourceGeometry || !displayGeometry) return displayGeometry;
      if (sourceGeometry.type === "Point" || displayGeometry.type === "Point") return displayGeometry;
      const text = normalizeText(`${site?.title || ""} ${site?.site_type || ""}`);
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
        if (!pointInGeometry(center, sourceGeometry) && !barrierBeachMatchesTerritory(site, center, sourceGeometry)) continue;
        if (pointInGeometry(center, restored)) continue;
        if (!isMeaningfulLandPiece(outer, center)) continue;
        restored = appendPolygonToGeometry(restored, rings);
      }
      return restored;
    }

    function barrierBeachMatchesTerritory(site, center, sourceGeometry) {
      return GEOMETRY_UTILS.barrierBeachMatchesTerritory(site, center, sourceGeometry, { normalizeText });
    }

    function isMeaningfulLandPiece(ring, center) {
      const bounds = ringBounds(ring);
      if (!bounds) return false;
      const width = Math.abs(bounds[1][0] - bounds[0][0]);
      const height = Math.abs(bounds[1][1] - bounds[0][1]);
      const area = width * height;
      if (area < 0.000002) return false;
      if (center[0] < -73.98 && center[1] < 40.56) return false;
      if (center[0] < -74.05 && center[1] > 40.57) return false;
      return true;
    }

    function appendPolygonToGeometry(geometry, polygonCoordinates) {
      return GEOMETRY_UTILS.appendPolygonToGeometry(geometry, polygonCoordinates);
    }

    function ringCenter(ring) {
      return GEOMETRY_UTILS.ringCenter(ring);
    }

    function ringBounds(ring) {
      return GEOMETRY_UTILS.ringBounds(ring);
    }

    function milesBetween(a, b) {
      return GEOMETRY_UTILS.milesBetweenPoints(a, b);
    }

    function userSiteDistance(site) {
      if (!state.userLocation || !site?.center) return null;
      const center = site.center;
      const from = state.userLocation;
      const miles = milesBetween(from, center);
      return Number.isFinite(miles) ? miles : null;
    }

    function siteDistance(site, options = {}) {
      if (options.source === "user") return userSiteDistance(site);
      if (Number.isFinite(site?._addressDistance)) return site._addressDistance;
      return userSiteDistance(site);
    }

    function distanceLabel(site, options = {}) {
      const miles = siteDistance(site, options);
      if (miles === null) return "";
      return GEOMETRY_UTILS.distanceLabelMiles
        ? GEOMETRY_UTILS.distanceLabelMiles(miles)
        : `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
    }

    const MOBILE_SITE_CONTENT_SECTION_FIELDS = [
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
      return SHARED_UTILS.contentSectionsFromFields(publicSite, MOBILE_SITE_CONTENT_SECTION_FIELDS, {
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
        const preview = listingImage(item);
        return `<label class="field"><span>${escapeHtml(label)}</span>${preview ? `<img class="hero" src="${escapeHtml(preview)}" alt="" loading="lazy" decoding="async">` : ""}<input id="mobile-frontend-editor-${field}" name="${escapeHtml(field)}" type="file" accept="image/*"><span class="detail-meta">Optional. Large images are compressed before upload.</span></label>`;
      }
      const value = type === "textarea" ? publicCleanText(item?.[field] || "") : (item?.[field] || "");
      const id = `mobile-frontend-editor-${field}`;
      if (type === "input") {
        return `<label class="field"><span>${escapeHtml(label)}</span><input id="${id}" name="${escapeHtml(field)}" value="${escapeHtml(value)}"></label>`;
      }
      return `<label class="field"><span>${escapeHtml(label)}</span><textarea id="${id}" name="${escapeHtml(field)}" rows="6">${escapeHtml(value)}</textarea></label>`;
    }

    function frontendEditorHtml(kind, item) {
      const fields = frontendEditorFields(kind);
      const label = kind === "wiki" ? "article" : kind === "timeline" ? "historic moment" : "site";
      const editorSlug = kind === "timeline" ? item.id : item.slug;
      return `
        <form class="section frontend-content-editor" data-frontend-editor="${escapeHtml(kind)}" data-editor-id="${escapeHtml(item.id || "")}" data-editor-slug="${escapeHtml(editorSlug || "")}">
          <h3>Edit ${label} content</h3>
          <p class="summary">Edit reader-facing text without leaving the app.</p>
          ${fields.map(field => frontendEditorFieldHtml(item, field)).join("")}
          <div class="actions">
            <button class="action" type="submit">Save updates</button>
            <button class="action secondary" type="button" data-cancel-frontend-editor>Cancel</button>
          </div>
          <p class="summary" data-frontend-editor-status></p>
        </form>
      `;
    }

    function legacyWhyThisMattersTexts(item) {
      return SHARED_UTILS.legacyWhyThisMattersTexts(item, MOBILE_SITE_CONTENT_SECTION_FIELDS, {
        hasContent: value => stripHtml(value).length > 0
      });
    }

    function mobileWhyThisMattersFallback(item) {
      const text = publicCleanText([
        item?.summary,
        item?.introduction_content,
        item?.preservation_content,
        item?.history_content
      ].filter(Boolean).join(" "));
      const fallback = "A mapped place can connect Native Long Island history, presence, stewardship, and memory.";
      return firstCompleteSentences(text, 2, 320) || fallback;
    }

    function whyThisMattersHtml(item) {
      const paragraphs = SHARED_UTILS.uniqueTextBlocks(
        (() => {
          const realTexts = [item?.why_this_matters || "", ...legacyWhyThisMattersTexts(item)].filter(Boolean);
          return realTexts.length ? realTexts : [mobileWhyThisMattersFallback(item)];
        })(),
        { cleanText: publicCleanText, normalizeText }
      );
      return paragraphs.length ? `<section class="section"><h3>Why This Matters</h3>${paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join("")}</section>` : "";
    }

    function normalizeSourceRelation(relation) {
      const source = relation?.source || relation;
      if (!source?.title && !source?.citation && !source?.url) return null;
      const cleanSourceText = SHARED_UTILS.publicFacingWorkflowTextCleanup || publicCleanText;
      return {
        id: source.id,
        title: source.title || source.citation || "Reference",
        source_type: source.source_type || "",
        author: source.author || "",
        year: source.year || "",
        citation: cleanSourceText(source.citation || ""),
        url: source.url || "",
        citation_context: cleanSourceText(relation?.citation_context || source.citation_context || "")
      };
    }

    async function fetchSiteSources(site) {
      const siteId = Number(site?.id);
      if (!Number.isFinite(siteId)) return [];
      if (Array.isArray(site.source_list)) return site.source_list;
      if (state.siteSourceListCache.has(siteId)) return state.siteSourceListCache.get(siteId);
      const promise = fetchJson(`/items/site_sources?limit=-1&filter[site][_eq]=${encodeURIComponent(siteId)}&fields=id,site,citation_context,source.id,source.title,source.source_type,source.author,source.year,source.citation,source.url`, { cacheKey: `site-sources-${siteId}`, ttl: 300000, fresh: false })
        .then(response => (response.data || []).map(normalizeSourceRelation).filter(Boolean))
        .catch(() => []);
      state.siteSourceListCache.set(siteId, promise);
      return promise;
    }

    function latestEditedDate(item) {
      if (!item) return "";
      return ACTIVITY_UTILS.siteEditedDate(item, { extended: true });
    }

    function sourcesEvidenceSection(item) {
      const edited = ACTIVITY_UTILS.editedDateLabel(latestEditedDate(item), { fallback: DEFAULT_LAST_EDITED_LABEL });
      return HTML_UTILS.sourcesEvidenceHtml(item, {
        cleanText: publicCleanText,
        escapeHtml,
        editedLabel: edited,
        metaClass: "detail-meta"
      });
    }

    function timelineEventsForSource(sourceType, sourceId, sourceSlug) {
      return TIMELINE_UTILS.eventsForSource(state.timelineEvents, sourceType, sourceId, sourceSlug, {
        sortValue: timelineSortValue
      });
    }

    function historicMomentsHtml(events, options = {}) {
      if (!events.length) return "";
      const showLocations = options.showLocations !== false;
      const title = options.title || "Historic Moments";
      return `
        <section class="section">
          <h3>${escapeHtml(title)}</h3>
          <div class="timeline">
            ${events.map(event => {
              const sourceNote = timelineSourceText(event);
              const location = showLocations ? timelineLocationLabel(event) : "";
              return `
                <article class="timeline-item" id="timeline-moment-${escapeHtml(event.id)}" data-event-id="${escapeHtml(event.id)}">
                  <div class="timeline-year">${escapeHtml(timelineLabel(event))}</div>
                  ${location ? `<p class="timeline-location"><strong>Location:</strong> ${escapeHtml(location)}</p>` : ""}
                  <div class="timeline-body">
                    <p><strong>${escapeHtml(timelineTitle(event))}</strong></p>
                    ${event.description ? cleanHtml(timelineDisplayDescription(event)) : ""}
                  </div>
                  ${isAdminContributor() ? `<div class="actions"><button class="action secondary" type="button" data-open-frontend-editor="timeline" data-editor-slug="${escapeHtml(event.id)}">Edit moment</button></div>` : ""}
                  ${sourceNote ? `
                    <button class="timeline-source-info" type="button" data-timeline-source-info data-source-reference="${escapeHtml(sourceNote)}" aria-label="Show source reference" aria-expanded="false" title="${escapeHtml(sourceNote)}">i</button>
                    <div class="timeline-source-popover" role="note"><div>${HTML_UTILS.sourceReferenceTextHtml(sourceNote, { escapeHtml })}</div><div class="timeline-source-copy-hint">Source reference.</div></div>
                  ` : ""}
                </article>
              `;
            }).join("")}
          </div>
        </section>
      `;
    }

    function showBanner(message) {
      bannerEl.textContent = message;
      bannerEl.classList.add("show");
      window.setTimeout(() => bannerEl.classList.remove("show"), 3600);
    }

    function nativeAndroidBuildId() {
      try {
        if (window.AndroidApp?.getBuildId) return String(window.AndroidApp.getBuildId() || "");
      } catch {}
      return "";
    }

    function nativeAndroidVersionName() {
      try {
        if (window.AndroidApp?.getVersionName) return String(window.AndroidApp.getVersionName() || "");
      } catch {}
      return "";
    }

    const ANDROID_LIFECYCLE_STATE_KEY = "nli-android-lifecycle-state";
    const ANDROID_LIFECYCLE_STATE_MAX_AGE = 12 * 60 * 60 * 1000;

    function clearAndroidLifecycleSnapshot() {
      try {
        localStorage.removeItem(ANDROID_LIFECYCLE_STATE_KEY);
      } catch {}
    }

    function showAndroidUpdateRequiredNotice(installedBuild = "") {
      if (document.getElementById("android-update-required")) return;
      const notice = document.createElement("div");
      notice.id = "android-update-required";
      notice.setAttribute("role", "dialog");
      notice.setAttribute("aria-live", "polite");
      notice.style.cssText = [
        "position:fixed",
        "left:14px",
        "right:14px",
        "bottom:calc(var(--app-bottom-safe, 18px) + 14px)",
        "z-index:10050",
        "padding:14px",
        "border-radius:14px",
        "background:#ffffff",
        "border:1px solid rgba(31,39,31,.18)",
        "box-shadow:0 16px 38px rgba(20,31,23,.28)",
        "color:#223027",
        "font:14px/1.35 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
      ].join(";");
      notice.innerHTML = `
        <strong style="display:block;font-size:15px;margin-bottom:4px;">App update required</strong>
        <span style="display:block;margin-bottom:10px;">This feature needs a newer On This Site APK. Your live content will still refresh, but reinstall the latest APK for this feature.</span>
        <div style="display:flex;gap:8px;justify-content:flex-end;align-items:center;">
          <small style="margin-right:auto;color:#647267;">${escapeHtml(nativeAndroidVersionName() || installedBuild || "Installed app")}</small>
          <button type="button" data-close-update style="min-height:44px;border:1px solid #c9d3c8;border-radius:8px;background:#fff;padding:0 12px;font-weight:800;color:#2b5a43;">Later</button>
          <a href="${ANDROID_APK_UPDATE_URL}" target="_blank" rel="noopener" style="min-height:44px;display:inline-flex;align-items:center;border-radius:8px;background:#2f6b4f;color:#fff;padding:0 12px;font-weight:850;text-decoration:none;">Update APK</a>
        </div>
      `;
      notice.querySelector("[data-close-update]")?.addEventListener("click", () => notice.remove());
      document.body.appendChild(notice);
    }

    function checkAndroidAppCompatibility() {
      const looksLikeNativeAndroid = /Android/i.test(navigator.userAgent) && (window.AndroidApp || window.AndroidStory);
      if (!looksLikeNativeAndroid) return;
      const installedBuild = nativeAndroidBuildId();
      if (!installedBuild || installedBuild < MIN_ANDROID_APP_BUILD_ID) {
        showAndroidUpdateRequiredNotice(installedBuild);
      }
    }

    function setLoadingMessage(message) {
      if (!loadingMessageEl || !message) return;
      if (/could not|failed|trouble|error/i.test(message)) loadingMessageEl.textContent = message;
    }

    function hideLoadingScreen() {
      loadingScreenEl?.classList.add("hidden");
      if (loadingScreenEl) loadingScreenEl.hidden = true;
    }

    function showRegisterStatus(message, status = "") {
      if (!registerStatusEl) return;
      registerStatusEl.textContent = message || "";
      registerStatusEl.hidden = !message;
      registerStatusEl.classList.toggle("success", status === "success");
      registerStatusEl.classList.toggle("error", status === "error");
    }

    function showLoginStatus(message, status = "") {
      if (!loginStatusEl) return;
      loginStatusEl.textContent = message || "";
      loginStatusEl.hidden = !message;
      loginStatusEl.classList.toggle("success", status === "success");
      loginStatusEl.classList.toggle("error", status === "error");
    }

    function showPasswordResetStatus(message, status = "") {
      if (!passwordResetStatusEl) return;
      passwordResetStatusEl.textContent = message || "";
      passwordResetStatusEl.hidden = !message;
      passwordResetStatusEl.classList.toggle("success", status === "success");
      passwordResetStatusEl.classList.toggle("error", status === "error");
    }

    function renderPasswordResetPanelMode() {
      const completing = Boolean(state.passwordResetToken);
      if (passwordResetPanelEl && completing) passwordResetPanelEl.hidden = false;
      if (passwordResetHelpEl) {
        passwordResetHelpEl.textContent = completing
          ? "Enter a new password for this reset link."
          : "Enter your account email. If it exists, we will send a one-time link to set a new password.";
      }
      if (passwordResetEmailEl) passwordResetEmailEl.closest(".field").hidden = completing;
      if (passwordResetNewPasswordFieldEl) passwordResetNewPasswordFieldEl.hidden = !completing;
      if (passwordResetSubmitBtn) passwordResetSubmitBtn.textContent = completing ? "Set new password" : "Email reset link";
    }

    async function notifyUser(title, body) {
      if (window.AndroidApp?.showNotification) {
        try {
          if (window.AndroidApp.showNotification(String(title || ""), String(body || ""))) return true;
        } catch {}
      }
      if (!("Notification" in window)) {
        showBanner(body || title);
        return false;
      }
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission !== "granted") {
        showBanner("Notifications are blocked for this browser. You can enable them in your app or browser settings.");
        return false;
      }
      new Notification(title, { body, tag: "nli-mobile" });
      return true;
    }

    async function fetchJson(path, options = {}) {
      return directusClient.fetchJson(path, options);
    }

    async function contributorProfileForToken(token, email = "") {
      if (token) {
        try {
          const { profile } = await directusClient.fetchProfileForToken(token, {
            profileFields: PROFILE_FIELDS
          });
          if (profile) {
            const index = state.contributorProfiles.findIndex(item => Number(item.id) === Number(profile.id));
            if (index >= 0) state.contributorProfiles[index] = { ...state.contributorProfiles[index], ...profile };
            else state.contributorProfiles.push(profile);
            return profile;
          }
        } catch {}
      }
      return profileForLogin(email);
    }

    async function postDirectusItem(collection, payload, options = {}) {
      return directusClient.postItem(collection, payload, {
        ...options,
        timeout: Number(options.timeout || 15000)
      });
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
      state.profileActivityCache = null;
      updateProfileMenuButton();
    }

    function localPointEventForKey(eventKey, profileId = null) {
      return PROFILE_UTILS.findProfilePointEventForKey(state.profilePointEvents, eventKey, profileId, { relationId });
    }

    async function ensureCanonicalProfilePointEvents(profile = currentContributorProfile()) {
      const ids = canonicalPointProfileIds(profile);
      if (!ids.length || profilePointEventsAreCanonical(profile)) return true;
      const key = ids.join(",");
      if (state.profilePointEventSyncPromises.has(key)) return state.profilePointEventSyncPromises.get(key);
      const promise = fetchJson(`/items/mobile_point_events?limit=-1&filter[member_profile][_in]=${key}&fields=${POINT_EVENT_FIELDS}`, { fresh: true })
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
      const response = await fetchJson(`/items/mobile_point_events?limit=-1&filter[member_profile][_eq]=${id}&fields=${POINT_EVENT_FIELDS}`, { fresh: true });
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
      const response = await fetchJson(
        `/items/mobile_point_events?limit=1&filter[event_key][_eq]=${encodeURIComponent(key)}&filter[member_profile][_eq]=${id}&fields=${POINT_EVENT_FIELDS}`,
        { fresh: true }
      );
      const record = (response.data || [])[0] || null;
      if (record) mergePointEventRecords([record]);
      return record;
    }

    function activeContributorProfileId() {
      const profile = currentContributorProfile();
      return PROFILE_UTILS.activeContributorProfileId(profile, state.profile?.profileId, { relationId });
    }

    async function commitEngagementAction(eventType, activity = {}, sourceId = "") {
      const response = await directusClient.fetchAuthenticated("https://nativelongisland.com/engagement-action.php", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event_type: eventType, source_id: sourceId || undefined, activity })
      }, {
        authExpiredMessage: "Your login expired. Please log in again to save points."
      });
      const result = await response.json();
      if (result?.source) {
        if (eventType === "daily_open") state.profileLoginRewards = PROFILE_UTILS.mergeLoginRewardRecords(state.profileLoginRewards, [result.source]);
        if (eventType === "vocab_guess") mergeLanguageAttemptRecords([result.source]);
        if (eventType === "site_visit" || eventType === "site_checkin") mergeVisitRecords([result.source]);
      }
      if (result?.data?.id) mergePointEventRecords([result.data]);
      state.profileActivityCache = null;
      updateProfileMenuButton();
      if (loginSheetEl?.classList.contains("open")) renderProfile();
      return result;
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
        const created = await commitEngagementAction(eventType, {}, payload.source_id);
        const record = created?.data ? { ...payload, ...created.data } : null;
        if (!record?.id) throw new Error("The points record could not be confirmed.");
        mergePointEventRecords([record]);
        const confirmed = await refreshRemotePointEventForKey(event.event_key, profileId).catch(() => null);
        if (!confirmed) throw new Error("The points record could not be confirmed.");
        return confirmed;
      } catch (error) {
        const latest = await refreshRemotePointEventForKey(event.event_key, profileId).catch(() => null);
        if (latest) return latest;
        throw error;
      }
    }

    function moderationCheck(value, label) {
      return window.NLI_MODERATION_UTILS.checkPublicText(value, label);
    }

    async function fetchSiteDetail(site) {
      if (!site?.slug) return site;
      if ("introduction_content" in site || "history_content" in site) return SITE_UTILS.sanitizePublicSiteContent(site);
      if (state.siteDetailCache.has(site.slug)) return state.siteDetailCache.get(site.slug);
      const promise = fetchJson(`/items/sites?limit=1&filter[publication_status][_eq]=published&filter[slug][_eq]=${encodeURIComponent(site.slug)}&fields=${SITE_DETAIL_FIELDS}`)
        .then(response => {
          const remote = response.data?.[0] || null;
          const full = SITE_UTILS.sanitizePublicSiteContent(remote ? { ...site, ...remote } : site);
          if (site.territory_assignment_version && site.display_geojson) {
            full.display_geojson = site.display_geojson;
            full.territory_assignment_version = site.territory_assignment_version;
            full.territory_display_label = site.territory_display_label;
            full.geometry_cleanup_status = site.geometry_cleanup_status;
          }
          const index = state.sites.findIndex(item => item.slug === site.slug);
          if (index >= 0) state.sites[index] = { ...state.sites[index], ...full };
          const filteredIndex = state.filtered.findIndex(item => item.slug === site.slug);
          if (filteredIndex >= 0) state.filtered[filteredIndex] = { ...state.filtered[filteredIndex], ...full };
          clearRelatedSiteCaches();
          return full;
        })
        .catch(() => SITE_UTILS.sanitizePublicSiteContent(site));
      state.siteDetailCache.set(site.slug, promise);
      return promise;
    }

    function compactSiteGeometryToGeojson(row = {}) {
      if (row.geojson) return row.geojson;
      return Array.isArray(row.center) && row.center.length >= 2
        ? { type: "Point", coordinates: row.center }
        : null;
    }

    function mergeMobileSiteGeometryRows(sites = [], rows = []) {
      if (!Array.isArray(rows) || !rows.length) return sites;
      const bySlug = new Map(rows.filter(row => row?.slug).map(row => [String(row.slug), row]));
      const byId = new Map(rows.filter(row => row?.id != null).map(row => [String(row.id), row]));
      return sites.map(site => {
        const row = bySlug.get(String(site?.slug || "")) || byId.get(String(site?.id || ""));
        const geojson = compactSiteGeometryToGeojson(row);
        if (!row) return site;
        return {
          ...site,
          ...(geojson ? { geojson } : {}),
          ...(row.display_geojson ? { display_geojson: row.display_geojson } : {}),
          ...(row.map_geometry_alias_of ? { map_geometry_alias_of: row.map_geometry_alias_of } : {}),
          ...(row.geometry_cleanup_status ? { geometry_cleanup_status: row.geometry_cleanup_status } : {}),
          ...(row.territory_display_label ? { territory_display_label: row.territory_display_label } : {}),
          ...(row.territory_assignment_version ? { territory_assignment_version: row.territory_assignment_version } : {})
        };
      });
    }

    async function fetchMobileSiteIndexRows() {
      try {
        const response = await fetch(`${SITE_INDEX_URL}?v=${SITE_INDEX_VERSION}`, { cache: "no-cache" });
        if (!response.ok) throw new Error(`Mobile site index unavailable: ${response.status}`);
        const json = await response.json();
        if (Array.isArray(json?.rows) && json.rows.length) return json.rows;
        throw new Error("Mobile site index snapshot was empty.");
      } catch (error) {
        console.warn("Static mobile site index unavailable; falling back to Directus site metadata.", error);
        const fallback = await fetchJson(`/items/sites?limit=-1&filter[publication_status][_eq]=published&sort=title&fields=${SITE_INDEX_RUNTIME_FIELDS}`, {
          cacheKey: "mobile-sites",
          ttl: 60000,
          fresh: false
        });
        return fallback.data || [];
      }
    }

    async function fetchMobileSiteGeometryRows() {
      try {
        const response = await fetch(`${SITE_GEOMETRY_URL}?v=${SITE_GEOMETRY_VERSION}`, { cache: "no-cache" });
        if (!response.ok) throw new Error(`Mobile site geometry unavailable: ${response.status}`);
        const json = await response.json();
        if (Array.isArray(json?.rows) && json.rows.length) return json.rows;
        throw new Error("Mobile site geometry snapshot was empty.");
      } catch (error) {
        console.warn("Static mobile geometry unavailable; falling back to Directus geometry.", error);
        const fallback = await fetchJson("/items/sites?limit=-1&filter[publication_status][_eq]=published&sort=title&fields=id,slug,geojson", {
          cacheKey: "mobile-site-geometry-fallback",
          ttl: 60000,
          fresh: false
        });
        return fallback.data || [];
      }
    }

    async function fetchWikiDetail(articleOrSlug) {
      const slug = typeof articleOrSlug === "string" ? articleOrSlug : articleOrSlug?.slug;
      if (!slug) return null;
      const existing = typeof articleOrSlug === "string" ? state.wikiBySlug.get(slug) : articleOrSlug;
      if (existing && "content" in existing) return existing;
      if (state.wikiDetailCache.has(slug)) return state.wikiDetailCache.get(slug);
      const promise = fetchJson(`/items/wiki_articles?limit=1&filter[slug][_eq]=${encodeURIComponent(slug)}&fields=${WIKI_DETAIL_FIELDS}`, { cacheKey: `wiki-detail-${slug}`, ttl: 60000, fresh: false })
        .then(response => {
          const full = response.data?.[0];
          if (!full) return existing || null;
          const merged = sanitizePublicWikiArticle({ ...(existing || {}), ...full });
          state.wikiBySlug.set(slug, merged);
          const index = state.wikiArticles.findIndex(article => article.slug === slug);
          if (index >= 0) state.wikiArticles[index] = merged;
          else state.wikiArticles.push(merged);
          return merged;
        })
        .catch(() => existing ? sanitizePublicWikiArticle(existing) : null);
      state.wikiDetailCache.set(slug, promise);
      return promise;
    }

    function mergeTimelineEvents(rows = []) {
      let changed = false;
      rows.forEach(row => {
        if (!row?.id) return;
        const id = String(row.id);
        const existing = state.timelineById.get(id) || null;
        const merged = existing ? { ...existing, ...row } : row;
        const index = state.timelineEvents.findIndex(event => String(event.id) === id);
        if (index >= 0) state.timelineEvents[index] = merged;
        else state.timelineEvents.push(merged);
        state.timelineById.set(id, merged);
        changed = true;
      });
      if (changed) rebuildSortedTimelineEvents();
      return rows;
    }

    async function ensureTimelineDetailsForSource(sourceType, sourceId, sourceSlug) {
      const type = String(sourceType || "").trim();
      const slug = String(sourceSlug || "").trim();
      const numericId = Number(sourceId);
      if (!type || (!slug && !Number.isFinite(numericId))) return [];
      const key = `${type}:${slug || numericId}`;
      if (state.timelineDetailCache.has(key)) return state.timelineDetailCache.get(key);
      const sourceFilter = slug
        ? `&filter[source_slug][_eq]=${encodeURIComponent(slug)}`
        : `&filter[source_id][_eq]=${encodeURIComponent(String(numericId))}`;
      const promise = fetchJson(`/items/timeline_events?limit=-1&filter[source_type][_eq]=${encodeURIComponent(type)}${sourceFilter}&fields=${TIMELINE_FIELDS}`, {
        cacheKey: `timeline-detail-${key}`,
        ttl: 60000,
        fresh: false
      })
        .then(response => mergeTimelineEvents(response.data || []))
        .catch(() => []);
      state.timelineDetailCache.set(key, promise);
      return promise;
    }

    function idleTask(callback) {
      if ("requestIdleCallback" in window) return window.requestIdleCallback(callback, { timeout: 2400 });
      return window.setTimeout(callback, 250);
    }

    function waitForMapbox(timeout = 12000) {
      if (window.mapboxgl?.Map) return Promise.resolve(true);
      const script = document.getElementById("mapbox-gl-script");
      return new Promise(resolve => {
        let settled = false;
        const finish = value => {
          if (settled) return;
          settled = true;
          resolve(Boolean(value && window.mapboxgl?.Map));
        };
        const timer = window.setTimeout(() => finish(false), timeout);
        script?.addEventListener("load", () => {
          window.clearTimeout(timer);
          finish(true);
        }, { once: true });
        script?.addEventListener("error", () => {
          window.clearTimeout(timer);
          finish(false);
        }, { once: true });
      });
    }

    async function uploadDirectusFile(file, title, options = {}) {
      return SHARED_DIRECTUS.uploadDirectusFile(directusClient, file, title, options);
    }

    async function captureFeedbackScreenshot() {
      state.feedbackScreenshotFile = await FEEDBACK_UTILS.captureFeedbackScreenshot({
        hiddenEl: feedbackSheetEl,
        statusEl: feedbackScreenshotStatusEl,
        captureMessage: "Capturing the current screen...",
        basename: "mobile-feedback-screenshot",
        ignoreElementId: "notifications-sheet"
      });
      syncFeedbackScreenshotControls();
    }

    function syncFeedbackScreenshotControls() {
      const screenshotFile = state.feedbackScreenshotFile || feedbackScreenshotEl?.files?.[0] || null;
      if (feedbackRemoveScreenshotBtn) feedbackRemoveScreenshotBtn.hidden = !screenshotFile;
      if (!screenshotFile && feedbackScreenshotStatusEl) {
        feedbackScreenshotStatusEl.textContent = "Optional screenshot helps explain what happened.";
      }
    }

    function removeFeedbackScreenshot() {
      state.feedbackScreenshotFile = null;
      if (feedbackScreenshotEl) feedbackScreenshotEl.value = "";
      syncFeedbackScreenshotControls();
      showBanner("Screenshot removed. Your feedback text is still here.");
    }

    async function uploadFeedbackScreenshot(file, title) {
      return FEEDBACK_UTILS.uploadFeedbackScreenshot(file, title, {
        compressImage: compressFeedbackImage,
        uploadFile: uploadDirectusFile,
        normalizeUploadFileId: SHARED_DIRECTUS.normalizeUploadFileId
      });
    }

    async function loadData() {
      if (window.NLI_MOBILE_DATA) {
        state.sites = repairSiteTitles((window.NLI_MOBILE_DATA.sites || []).map(SITE_UTILS.sanitizePublicSiteContent));
        state.wikiArticles = (window.NLI_MOBILE_DATA.wikiArticles || []).map(sanitizePublicWikiArticle);
        state.blogPosts = (window.NLI_MOBILE_DATA.blogPosts || []).map(normalizeBlogPost);
        state.blogPostsLoaded = state.blogPosts.length > 0;
        state.wikiById = new Map(state.wikiArticles.map(article => [Number(article.id), article]));
        state.wikiBySlug = new Map(state.wikiArticles.map(article => [article.slug, article]));
        state.layers = window.NLI_MOBILE_DATA.layers || [];
        state.timelineEvents = window.NLI_MOBILE_DATA.timelineEvents || [];
        state.timelineById = new Map(state.timelineEvents.map(item => [String(item.id), item]));
        rebuildSortedTimelineEvents();
      state.exhibits = window.NLI_MOBILE_DATA.exhibits || [];
      state.contributorProfiles = mergeSeededProfiles(window.NLI_MOBILE_DATA.contributorProfiles || []);
      state.publicComments = mergeSeededComments(window.NLI_MOBILE_DATA.publicComments || []);
      state.commentVotes = window.NLI_MOBILE_DATA.commentVotes || [];
      state.profilePointEvents = window.NLI_MOBILE_DATA.profilePointEvents || [];
      state.plantObservations = window.NLI_MOBILE_DATA.plantObservations || [];
        state.publicVisits = window.NLI_MOBILE_DATA.publicVisits || [];
        state.siteSuggestions = window.NLI_MOBILE_DATA.siteSuggestions || [];
        state.mapStories = window.NLI_MOBILE_DATA.mapStories || [];
        state.mapStoryVotes = window.NLI_MOBILE_DATA.mapStoryVotes || [];
        state.languageQuizAttempts = window.NLI_MOBILE_DATA.languageQuizAttempts || [];
        state.profileActivityCache = null;
        state.profileFollows = window.NLI_MOBILE_DATA.profileFollows || [];
      state.profileLoginRewards = window.NLI_MOBILE_DATA.profileLoginRewards || [];
      state.profileActivitySynced = false;
      state.deferredDataLoaded = true;
      state.deferredCommunityDataLoaded = false;
      state.supportSettings = window.NLI_MOBILE_DATA.supportSettings || null;
      state.placeNameAreas = window.NLI_MOBILE_DATA.placeNameAreas || window.NLI_PLACE_NAME_AREAS || { type: "FeatureCollection", features: [] };
      state.mediaMap = { ...(window.NLI_MOBILE_MEDIA_MAP || {}), ...(window.NLI_MOBILE_DATA.mediaMap || {}) };
      updateMobileActivityUnreadBadge();
      updateMobileNotificationUnreadBadge();
      updateMobileHeaderInstruction();
      return;
      }
      let sitesResponse;
      let siteGeometryRows;
      let layersResponse;
      let supportResponse;
      try {
        [sitesResponse, siteGeometryRows, layersResponse, supportResponse] = await Promise.all([
          fetchMobileSiteIndexRows().then(data => ({ data })),
          fetchMobileSiteGeometryRows(),
          fetchJson("/items/map_layers?limit=1&filter[slug][_eq]=native-long-island-base-map&fields=id,title,slug,layer_type,style_json,visible_by_default,description", { cacheKey: "mobile-layers-base", ttl: 300000, fresh: false }),
          fetchJson(`/items/project_support_settings?limit=1&filter[key][_eq]=native-long-island&fields=${SUPPORT_FIELDS}`, { cacheKey: "mobile-support", ttl: 300000, fresh: false }).catch(() => ({ data: [] }))
        ]);
      } catch (error) {
        if (isNativeAndroidApp() && !/\/mobile-app\.html$/i.test(location.pathname || "")) {
          setLoadingMessage("Loading the bundled archive.");
          const fallbackUrl = `${PUBLIC_ARCHIVE_BASE}mobile-app.html?apk-fallback=${Date.now()}`;
          location.replace(fallbackUrl);
          await new Promise(resolve => window.setTimeout(resolve, 3000));
        }
        throw error;
      }
      state.sites = repairSiteTitles(mergeMobileSiteGeometryRows(sitesResponse.data || [], siteGeometryRows).map(SITE_UTILS.sanitizePublicSiteContent));
      state.layers = layersResponse.data || [];
      state.supportSettings = supportResponse.data?.[0] || null;
      state.placeNameAreas = window.NLI_PLACE_NAME_AREAS || { type: "FeatureCollection", features: [] };
      state.mediaMap = window.NLI_MOBILE_MEDIA_MAP || {};
      updateMobileActivityUnreadBadge();
      updateMobileNotificationUnreadBadge();
      updateMobileHeaderInstruction();
    }

    function updateMobileHeaderInstruction() {
      const headerEls = [...document.querySelectorAll(".mobile-header-instruction")];
      if (!headerEls.length) return;
      const listings = state.sites?.length || 0;
      const wikiArticles = state.wikiArticles?.length || 0;
      const blogPosts = Number(window.NLI_MOBILE_DATA?.blogPosts?.length || headerEls[0].dataset.blogCount || 10);
      const calendarEvents = state.exhibits?.length || 0;
      const text = isOfflineTextMode()
        ? `Offline archive: ${listings} listings and ${wikiArticles} wiki articles are available offline. Search or browse text below; maps, media, accounts, and submissions return when online.`
        : isApkSnapshotMode()
          ? `${listings} listings loaded from the APK snapshot. Click a pin or colored territory to read its article.`
        : `${listings} listings, ${wikiArticles} wiki articles, ${blogPosts} blog posts, and ${calendarEvents} calendar events loaded. Click a pin or colored territory to read its article.`;
      headerEls.forEach(el => {
        el.textContent = text;
        el.dataset.loadedSummary = text;
        el.style.transform = "translate3d(0,0,0)";
        void el.offsetHeight;
        window.requestAnimationFrame(() => {
          el.textContent = text;
          el.style.opacity = "0.999";
          window.requestAnimationFrame(() => {
            el.style.opacity = "1";
          });
        });
      });
    }

    function applyMobileSiteIconUpdates(rows = []) {
      let changed = false;
      rows.forEach(row => {
        const id = Number(row?.id);
        const slug = String(row?.slug || "");
        const site = state.sites.find(item =>
          (Number.isFinite(id) && Number(item.id) === id) ||
          (slug && item.slug === slug)
        );
        if (!site) return;
        const nextIcon = row.map_icon || null;
        if ((site.map_icon || null) === nextIcon) return;
        site.map_icon = nextIcon;
        changed = true;
      });
      if (!changed) return false;
      invalidateMapSourceCache();
      state.mobileSiteIconImagesLoading = false;
      if (state.map) {
        loadMobileSiteIconImages();
        refreshMobileMapSources({ force: true });
      }
      return true;
    }

    async function refreshMobileSiteIconFieldsFromDirectus() {
      try {
        const response = await fetchJson("/items/sites?limit=-1&filter[publication_status][_eq]=published&fields=id,slug,map_icon", {
          cacheKey: "mobile-site-icons",
          fresh: true
        });
        applyMobileSiteIconUpdates(response.data || []);
      } catch (error) {
        console.warn("Directus site icons will use bundled values for now.", error);
      }
    }

    function runDeferredUpdate(label, callback) {
      try {
        return callback();
      } catch (error) {
        console.warn(`${label} will update later.`, error);
        return null;
      }
    }

    async function fetchMobileWikiIndexRows() {
      try {
        const response = await fetch(`${WIKI_INDEX_URL}?v=${WIKI_INDEX_VERSION}`, { cache: "force-cache" });
        if (!response.ok) throw new Error(`Mobile wiki index unavailable: ${response.status}`);
        const json = await response.json();
        if (Array.isArray(json?.rows) && json.rows.length) return json.rows;
        throw new Error("Mobile wiki index snapshot was empty.");
      } catch (error) {
        console.warn("Static mobile wiki index unavailable; falling back to Directus wiki index.", error);
        const fallback = await fetchJson(`/items/wiki_articles?limit=-1&filter[status][_eq]=published&sort=title&fields=${WIKI_INDEX_FIELDS}`, {
          cacheKey: "mobile-wiki",
          ttl: 60000,
          fresh: false
        });
        return fallback.data || [];
      }
    }

    async function fetchMobileTimelineIndexRows() {
      try {
        const response = await fetch(`${TIMELINE_INDEX_URL}?v=${TIMELINE_INDEX_VERSION}`, { cache: "force-cache" });
        if (!response.ok) throw new Error(`Mobile timeline index unavailable: ${response.status}`);
        const json = await response.json();
        if (Array.isArray(json?.rows) && json.rows.length) return json.rows;
        throw new Error("Mobile timeline index snapshot was empty.");
      } catch (error) {
        console.warn("Static mobile timeline index unavailable; falling back to Directus timeline index.", error);
        const fallback = await fetchJson(`/items/timeline_events?limit=-1&fields=${TIMELINE_INDEX_FIELDS}`, {
          cacheKey: "mobile-timeline-index",
          ttl: 60000,
          fresh: false
        });
        return fallback.data || [];
      }
    }

    async function loadDeferredData(options = {}) {
      const includeCommunity = options.includeCommunity === true;
      if (state.deferredDataLoaded && (!includeCommunity || state.deferredCommunityDataLoaded)) return true;
      if (state.deferredDataLoading && state.deferredDataPromise) {
        return state.deferredDataPromise.then(() =>
          includeCommunity && !state.deferredCommunityDataLoaded
            ? loadDeferredData({ includeCommunity: true })
            : true
        );
      }
      state.deferredDataLoading = true;
      state.deferredDataPromise = (async () => {
      try {
      runDeferredUpdate("Mobile timeline", renderMobileTimeline);
      const loadCoreData = !state.deferredDataLoaded;
      const signedInCommunity = Boolean(state.profile?.token);
      const loadTimelineEvents = () =>
        loadCoreData ? fetchMobileTimelineIndexRows()
          .then(data => ({ data }))
          .catch(() => fetchJson(`/items/timeline_events?limit=-1&fields=${BASIC_TIMELINE_FIELDS}`, { cacheKey: "mobile-timeline-basic", ttl: 60000 }))
          .catch(() => ({ data: [] }))
          : Promise.resolve({ data: state.timelineEvents });
      const legacyExhibitsRequest = includeCommunity && state.profile?.token
        ? fetchJson(`/items/mobile_exhibits?limit=-1&fields=${EXHIBIT_FIELDS}`, { cacheKey: "mobile-exhibits", ttl: 60000, fresh: false }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] });
      const siteSuggestionsRequest = includeCommunity && state.profile?.token
        ? fetchJson(`/items/site_suggestions?limit=-1&fields=${SITE_SUGGESTION_FIELDS}`, { fresh: true }).catch(() => ({ ...currentRowsFallback(state.siteSuggestions), _fallback: true }))
        : Promise.resolve({ ...currentRowsFallback(state.siteSuggestions), _skipped: true });
      const communityRequest = async (request, fallbackRows = []) => {
        if (!includeCommunity) return { ...currentRowsFallback(fallbackRows), _skipped: true };
        try {
          const response = await request();
          return Array.isArray(response) ? { data: response, _fallback: true } : (response || { data: [] });
        } catch (_) {
          return { ...currentRowsFallback(fallbackRows), _fallback: true };
        }
      };
      // Keep the map usable while slower account and social requests finish. Public learning content
      // is rendered immediately when its own request resolves instead of waiting for every request.
      const wikiRequest = loadCoreData ? fetchMobileWikiIndexRows()
        .then(data => ({ data }))
        .then(response => {
          state.wikiArticles = (response.data || []).map(sanitizePublicWikiArticle);
          state.wikiById = new Map(state.wikiArticles.map(article => [Number(article.id), article]));
          state.wikiBySlug = new Map(state.wikiArticles.map(article => [article.slug, article]));
          clearRelatedSiteCaches();
          updateMobileHeaderInstruction();
          return response;
        })
        .catch(() => ({ data: [] }))
        : Promise.resolve({ data: state.wikiArticles });
      const eventRequest = loadCoreData ? fetchJson(`/items/calendar_events?limit=-1&sort=start_datetime,title&fields=${EXHIBIT_FIELDS}`, { cacheKey: "mobile-events", ttl: 60000, fresh: false })
        .then(response => {
          state.exhibits = mergeCalendarEvents(response.data || [], state.exhibits || []);
          updateMobileHeaderInstruction();
          runDeferredUpdate("Exhibits", prepareExhibits);
          runDeferredUpdate("Exhibit markers", syncExhibitMarkers);
          return response;
        })
        .catch(() => ({ data: [] }))
        : Promise.resolve({ data: state.exhibits });
      const [timelineResponse, wikiResponse, eventResponse, legacyExhibitResponse, profilesResponse, commentsResponse, commentVotesResponse, pointEventsResponse, plantObservationsResponse, visitsResponse, suggestionsResponse, registrationsResponse, storyResponse, storyVotesResponse, languageResponse, followsResponse, loginRewardsResponse] = await Promise.all([
        loadTimelineEvents(),
        wikiRequest,
        eventRequest,
        legacyExhibitsRequest,
        communityRequest(() => fetchJson(`/items/mobile_member_profiles?limit=-1&sort=display_name&fields=${PROFILE_FIELDS}`, { fresh: true }).catch(() => currentRowsFallback(state.contributorProfiles)), state.contributorProfiles),
        communityRequest(() => fetchJson(`/items/mobile_comments?limit=80&filter[status][_eq]=approved&filter[public_activity][_eq]=true&sort=-created_at&fields=${PUBLIC_COMMENT_FIELDS}`, { cacheKey: "mobile-comments", ttl: 45000, fresh: false }).catch(() => currentRowsFallback(state.publicComments)), state.publicComments),
        communityRequest(() => fetchJson(`/items/mobile_comment_votes?limit=-1&fields=${COMMENT_VOTE_FIELDS}`, { cacheKey: "mobile-comment-votes", ttl: 30000, fresh: false }).catch(() => currentRowsFallback(state.commentVotes)), state.commentVotes),
        signedInCommunity ? communityRequest(() => fetchJson(`/items/mobile_point_events?limit=-1&fields=${POINT_EVENT_FIELDS}`, { cacheKey: "mobile-point-events", ttl: 30000, fresh: false }).catch(() => currentRowsFallback(state.profilePointEvents)), state.profilePointEvents) : Promise.resolve({ ...currentRowsFallback(state.profilePointEvents), _skipped: true }),
        signedInCommunity ? communityRequest(() => fetchJson(`/items/mobile_plant_observations?limit=-1&filter[status][_eq]=approved&fields=${PLANT_OBSERVATION_FIELDS}`, { cacheKey: "mobile-plant-observations", ttl: 45000, fresh: false }).catch(() => ({ data: [] })), state.plantObservations) : Promise.resolve({ ...currentRowsFallback(state.plantObservations), _skipped: true }),
        communityRequest(() => fetchJson(`/items/mobile_site_visits?limit=80&sort=-visited_at&fields=${PUBLIC_VISIT_FIELDS}`, { cacheKey: "mobile-site-visits", ttl: 45000, fresh: false }).catch(() => currentRowsFallback(state.publicVisits)), state.publicVisits),
        siteSuggestionsRequest,
        communityRequest(() => adminAccountRegistrationsRequest().catch(() => currentRowsFallback(state.accountRegistrations)), state.accountRegistrations),
        loadCoreData || includeCommunity ? fetchJson(`/items/mobile_map_stories?limit=-1&fields=${MAP_STORY_FIELDS}`, { cacheKey: "mobile-map-stories", ttl: 30000, fresh: false }).catch(() => currentRowsFallback(state.mapStories)) : Promise.resolve({ data: state.mapStories }),
        loadCoreData || includeCommunity ? fetchJson(`/items/mobile_map_story_votes?limit=-1&fields=${MAP_STORY_VOTE_FIELDS}`, { cacheKey: "mobile-map-story-votes", ttl: 30000, fresh: false }).catch(() => currentRowsFallback(state.mapStoryVotes)) : Promise.resolve({ data: state.mapStoryVotes }),
        signedInCommunity ? communityRequest(() => fetchJson(`/items/mobile_language_quiz_progress?limit=-1&fields=${LANGUAGE_PROGRESS_FIELDS}`, { fresh: true }).catch(() => currentRowsFallback(state.languageQuizAttempts)), state.languageQuizAttempts) : Promise.resolve({ ...currentRowsFallback(state.languageQuizAttempts), _skipped: true }),
        signedInCommunity ? communityRequest(() => fetchJson(`/items/mobile_profile_follows?limit=-1&fields=${FOLLOW_FIELDS}`, { fresh: true }).catch(() => currentRowsFallback(state.profileFollows)), state.profileFollows) : Promise.resolve({ ...currentRowsFallback(state.profileFollows), _skipped: true }),
        signedInCommunity ? communityRequest(() => fetchJson(`/items/mobile_profile_logins?limit=-1&fields=${LOGIN_REWARD_FIELDS}`, { fresh: true }).catch(() => currentRowsFallback(state.profileLoginRewards)), state.profileLoginRewards) : Promise.resolve({ ...currentRowsFallback(state.profileLoginRewards), _skipped: true })
      ]);
      const existingTimelineById = new Map(state.timelineEvents.map(item => [String(item.id), item]));
      state.timelineEvents = (timelineResponse.data || []).map(item => ({ ...item, ...(existingTimelineById.get(String(item.id)) || {}) }));
      state.timelineById = new Map(state.timelineEvents.map(item => [String(item.id), item]));
      rebuildSortedTimelineEvents();
      state.wikiArticles = (wikiResponse.data || []).map(sanitizePublicWikiArticle);
      state.wikiById = new Map(state.wikiArticles.map(article => [Number(article.id), article]));
      state.wikiBySlug = new Map(state.wikiArticles.map(article => [article.slug, article]));
      clearRelatedSiteCaches();
      state.exhibits = mergeCalendarEvents(eventResponse.data || [], legacyExhibitResponse.data || []);
      state.contributorProfiles = mergeSeededProfiles(profilesResponse.data || []);
      state.publicComments = mergeSeededComments(preserveActiveProfileRows(commentsResponse.data, state.publicComments));
      state.commentVotes = preserveActiveProfileRows(commentVotesResponse.data, state.commentVotes);
      state.profilePointEvents = preserveActiveProfileRows(pointEventsResponse.data, state.profilePointEvents);
      state.plantObservations = plantObservationsResponse.data || [];
      state.publicVisits = preserveActiveProfileRows(visitsResponse.data, state.publicVisits);
      state.siteSuggestions = preserveActiveProfileRows(suggestionsResponse.data, state.siteSuggestions, ["author_profile"]);
      state.accountRegistrations = registrationsResponse.data || [];
      state.mapStories = MAP_STORY_UTILS.mergeStoryRecords(state.mapStories, storyResponse.data || []);
      state.mapStoryVotes = storyVotesResponse.data || [];
      state.languageQuizAttempts = preserveActiveProfileRows(languageResponse.data, state.languageQuizAttempts);
      state.profileFollows = preserveActiveProfileRows(followsResponse.data, state.profileFollows, ["follower_profile", "following_profile"]);
      state.profileLoginRewards = preserveActiveProfileRows(loginRewardsResponse.data, state.profileLoginRewards);
      // Public community activity is complete for anonymous visitors too. Do
      // not schedule a second fetch/render merely because there is no profile.
      state.profileActivitySynced = includeCommunity && allResponsesFresh([
        profilesResponse,
        commentsResponse,
        commentVotesResponse,
        pointEventsResponse,
        visitsResponse,
        suggestionsResponse,
        registrationsResponse,
        languageResponse,
        followsResponse,
        loginRewardsResponse
      ]);
      state.profileActivityCache = null;
      state.deferredDataLoaded = true;
      if (includeCommunity) state.deferredCommunityDataLoaded = true;
      runDeferredUpdate("Exhibits", prepareExhibits);
      runDeferredUpdate("Profile", renderProfile);
      runDeferredUpdate("Achievements", renderRewards);
      runDeferredUpdate("Mobile timeline", renderMobileTimeline);
      if (profilesSheetEl?.classList.contains("open")) runDeferredUpdate("Profiles", renderProfiles);
      if (followingSheetEl?.classList.contains("open")) runDeferredUpdate("Following", renderFollowing);
      if (eventsSheetEl?.classList.contains("open")) runDeferredUpdate("Events", renderEventsList);
      if (activitySheetEl?.classList.contains("open")) runDeferredUpdate("Activity", () => {
        renderMobileActivitySheet();
        markMobileActivitySeen();
      });
      if (notificationsSheetEl?.classList.contains("open")) runDeferredUpdate("Notifications", () => {
        renderMobileNotificationsSheet();
        markMobileNotificationsSeen();
      });
      runDeferredUpdate("Exhibit markers", syncExhibitMarkers);
      runDeferredUpdate("Suggestion markers", syncApprovedSuggestionMarkers);
      runDeferredUpdate("Story markers", syncMapStoryMarkers);
      runDeferredUpdate("Activity badge", updateMobileActivityUnreadBadge);
      runDeferredUpdate("Notification badge", updateMobileNotificationUnreadBadge);
      if (state.selectedSite?.slug) {
        Promise.resolve(openSite(state.selectedSite.slug, { focus: false, skipCommentRefresh: true, skipRoute: true }))
          .catch(error => console.warn("Selected site will refresh later.", error));
      }
      return true;
      } catch (error) {
        console.warn("Deferred site data will retry later.", error);
        return false;
      } finally {
        state.deferredDataLoading = false;
        state.deferredDataPromise = null;
      }
      })();
      return state.deferredDataPromise;
    }

    const withProfileSyncTimeout = PROFILE_UTILS.withFallbackTimeout;
    const currentRowsFallback = rows => PROFILE_UTILS.rowsFallback(rows, { markFallback: true });
    const allResponsesFresh = PROFILE_UTILS.allResponsesFresh;

    function activeProfileFilterSuffix(profileFields = ["member_profile"]) {
      return PROFILE_UTILS.activeProfileFilterSuffix(currentContributorProfile() || state.profile, profileFields, {
        candidates: state.contributorProfiles,
        relationId,
        fallbackProfileId: state.profile?.profileId,
        fallbackEmail: state.profile?.email,
        extraNames: [state.profile?.display_name, state.profile?.displayName, state.profile?.email, state.profile?.username]
      });
    }

    function activeProfileRowsRequest(collection, fields, currentRows, profileFields = ["member_profile"], options = { fresh: true }) {
      const suffix = activeProfileFilterSuffix(profileFields);
      if (!suffix) return Promise.resolve(currentRowsFallback(currentRows));
      return fetchJson(`/items/${collection}?limit=-1${suffix}&fields=${fields}`, options)
        .catch(() => currentRowsFallback(currentRows));
    }

    function preserveActiveProfileRows(nextRows, currentRows, profileFields = ["member_profile"]) {
      if (!state.profile) return Array.isArray(nextRows) ? nextRows : [];
      return PROFILE_UTILS.preserveActiveProfileRows(nextRows, currentRows, currentContributorProfile() || state.profile, {
        profileFields,
        candidates: state.contributorProfiles,
        relationId,
        fallbackProfileId: state.profile?.profileId,
        fallbackEmail: state.profile?.email,
        extraNames: [state.profile?.display_name, state.profile?.displayName, state.profile?.email, state.profile?.username]
      });
    }

    async function refreshProfileActivityData() {
      const [profilesResponse, commentsResponse, commentVotesResponse, pointEventsResponse, visitsResponse, suggestionsResponse, registrationsResponse, languageResponse, followsResponse, loginRewardsResponse] = await Promise.all([
        withProfileSyncTimeout(fetchJson(`/items/mobile_member_profiles?limit=-1&sort=display_name&fields=${PROFILE_FIELDS}`, { fresh: true }).catch(() => currentRowsFallback(state.contributorProfiles)), currentRowsFallback(state.contributorProfiles)),
        withProfileSyncTimeout(fetchJson(`/items/mobile_comments?limit=-1&filter[status][_eq]=approved&filter[public_activity][_eq]=true&fields=${PUBLIC_COMMENT_FIELDS}`, { fresh: true }).catch(() => currentRowsFallback(state.publicComments)), currentRowsFallback(state.publicComments)),
        withProfileSyncTimeout(fetchJson(`/items/mobile_comment_votes?limit=-1&fields=${COMMENT_VOTE_FIELDS}`, { fresh: true }).catch(() => currentRowsFallback(state.commentVotes)), currentRowsFallback(state.commentVotes)),
        withProfileSyncTimeout(activeProfileRowsRequest("mobile_point_events", POINT_EVENT_FIELDS, state.profilePointEvents), currentRowsFallback(state.profilePointEvents)),
        withProfileSyncTimeout(activeProfileRowsRequest("mobile_site_visits", PUBLIC_VISIT_FIELDS, state.publicVisits), currentRowsFallback(state.publicVisits)),
        withProfileSyncTimeout(
          (isCurrentAdminReviewer()
            ? fetchJson(`/items/site_suggestions?limit=-1&fields=${SITE_SUGGESTION_FIELDS}`, { fresh: true }).catch(() => currentRowsFallback(state.siteSuggestions))
            : activeProfileRowsRequest("site_suggestions", SITE_SUGGESTION_FIELDS, state.siteSuggestions, ["author_profile"])),
          currentRowsFallback(state.siteSuggestions)
        ),
        withProfileSyncTimeout(adminAccountRegistrationsRequest().catch(() => currentRowsFallback(state.accountRegistrations)), currentRowsFallback(state.accountRegistrations)),
        withProfileSyncTimeout(activeProfileRowsRequest("mobile_language_quiz_progress", LANGUAGE_PROGRESS_FIELDS, state.languageQuizAttempts), currentRowsFallback(state.languageQuizAttempts)),
        withProfileSyncTimeout(fetchJson(`/items/mobile_profile_follows?limit=-1&fields=${FOLLOW_FIELDS}`, { fresh: true }).catch(() => currentRowsFallback(state.profileFollows)), currentRowsFallback(state.profileFollows)),
        withProfileSyncTimeout(activeProfileRowsRequest("mobile_profile_logins", LOGIN_REWARD_FIELDS, state.profileLoginRewards), currentRowsFallback(state.profileLoginRewards))
      ]);
      state.contributorProfiles = mergeSeededProfiles(profilesResponse.data || []);
      state.publicComments = mergeSeededComments(preserveActiveProfileRows(commentsResponse.data, state.publicComments));
      state.commentVotes = preserveActiveProfileRows(commentVotesResponse.data, state.commentVotes);
      state.profilePointEvents = preserveActiveProfileRows(pointEventsResponse.data, state.profilePointEvents);
      state.publicVisits = preserveActiveProfileRows(visitsResponse.data, state.publicVisits);
      state.siteSuggestions = preserveActiveProfileRows(suggestionsResponse.data, state.siteSuggestions, ["author_profile"]);
      state.accountRegistrations = registrationsResponse.data || [];
      state.languageQuizAttempts = preserveActiveProfileRows(languageResponse.data, state.languageQuizAttempts);
      state.profileFollows = preserveActiveProfileRows(followsResponse.data, state.profileFollows, ["follower_profile", "following_profile"]);
      state.profileLoginRewards = preserveActiveProfileRows(loginRewardsResponse.data, state.profileLoginRewards);
      state.profileActivityCache = null;
      // Admin-only review data is useful in the account sheet, but it must not
      // leave an otherwise healthy contributor profile in a permanent loading state.
      state.profileActivitySynced = allResponsesFresh([
        profilesResponse,
        commentsResponse,
        commentVotesResponse,
        pointEventsResponse,
        visitsResponse,
        languageResponse,
        followsResponse,
        loginRewardsResponse
      ]);
      if (profilesSheetEl?.classList.contains("open")) renderProfiles();
      if (followingSheetEl?.classList.contains("open")) renderFollowing();
      if (activitySheetEl?.classList.contains("open")) renderMobileActivitySheet();
      if (notificationsSheetEl?.classList.contains("open")) renderMobileNotificationsSheet();
      updateMobileActivityUnreadBadge();
      updateMobileNotificationUnreadBadge();
      return state.profileActivitySynced;
    }

    async function ensureProfileActivitySynced() {
      if (state.profileActivitySynced) return true;
      if (state.profileActivitySyncPromise) return state.profileActivitySyncPromise;
      const syncPromise = state.deferredDataLoading && state.deferredDataPromise
        ? state.deferredDataPromise.then(() => state.profileActivitySynced || refreshProfileActivityData())
        : refreshProfileActivityData();
      state.profileActivitySyncPromise = syncPromise
        .catch(error => {
          console.warn("Profile activity sync will retry later.", error);
          state.profileActivitySynced = false;
          return false;
        })
        .finally(() => {
          state.profileActivitySyncPromise = null;
        });
      return state.profileActivitySyncPromise;
    }

    async function ensureProfileStatsSynced() {
      if (!state.profile) return false;
      const activitySynced = await ensureProfileActivitySynced();
      const pointEventsSynced = await ensureCanonicalProfilePointEvents(currentContributorProfile());
      return Boolean(activitySynced || pointEventsSynced);
    }

    async function ensureDeferredDataLoaded() {
      if (state.deferredDataLoaded) return true;
      try {
        return await loadDeferredData();
      } catch (error) {
        state.deferredDataLoading = false;
        console.warn("Deferred site data will retry later.", error);
        return false;
      }
    }

    async function refreshMapStories() {
      try {
        const [storyResponse, voteResponse] = await Promise.all([
          fetchJson(`/items/mobile_map_stories?limit=-1&fields=${MAP_STORY_FIELDS}`, { cacheKey: "mobile-map-stories", ttl: 0, fresh: true }).catch(() => ({ data: state.mapStories || [] })),
          fetchJson(`/items/mobile_map_story_votes?limit=-1&fields=${MAP_STORY_VOTE_FIELDS}`, { cacheKey: "mobile-map-story-votes", ttl: 0, fresh: true }).catch(() => ({ data: state.mapStoryVotes || [] }))
        ]);
        state.mapStories = MAP_STORY_UTILS.mergeStoryRecords(state.mapStories, storyResponse.data || []);
        state.mapStoryVotes = voteResponse.data || state.mapStoryVotes || [];
        syncMapStoryMarkers();
        if (activitySheetEl?.classList.contains("open")) renderMobileActivitySheet();
        if (notificationsSheetEl?.classList.contains("open")) renderMobileNotificationsSheet();
        updateMobileActivityUnreadBadge();
        updateMobileNotificationUnreadBadge();
        return true;
      } catch (error) {
        console.warn("Map stories will refresh later.", error);
        return false;
      }
    }

    function startMapStoryRefresh() {
      if (state.mapStoryRefreshTimer) return;
      state.mapStoryRefreshTimer = window.setInterval(refreshMapStories, 45000);
    }

    async function refreshCommentsNow({ rerender = true } = {}) {
      try {
        const [response, plantResponse] = await Promise.all([
          fetchJson(`/items/mobile_comments?limit=-1&filter[status][_eq]=approved&filter[public_activity][_eq]=true&fields=${PUBLIC_COMMENT_FIELDS}`, { fresh: true }),
          fetchJson(`/items/mobile_plant_observations?limit=-1&filter[status][_eq]=approved&fields=${PLANT_OBSERVATION_FIELDS}`, { fresh: true }).catch(() => ({ data: state.plantObservations || [] }))
        ]);
        const refreshedComments = COMMENT_UTILS.mergeFetchedCommentsPreservingPending(response.data, state.publicComments);
        state.publicComments = mergeSeededComments(preserveActiveProfileRows(refreshedComments, state.publicComments));
        state.plantObservations = plantResponse.data || [];
        state.profileActivityCache = null;
        if (rerender) {
          if (state.selectedSite?.slug) openSite(state.selectedSite.slug, { focus: false, skipCommentRefresh: true });
          if (profilesSheetEl?.classList.contains("open")) renderProfiles();
        }
        updateMobileActivityUnreadBadge();
        updateMobileNotificationUnreadBadge();
        return true;
      } catch {
        return false;
      }
    }

    async function refreshMobileAppDataFromDirectus() {
      const originalLabel = mobileRefreshAppBtn?.textContent || "Refresh app";
      if (mobileRefreshAppBtn) {
        mobileRefreshAppBtn.disabled = true;
        mobileRefreshAppBtn.textContent = "Refreshing...";
      }
      try {
        showBanner("Refreshing profile and app data...");
        state.profileActivitySynced = false;
        const results = await Promise.allSettled([
          ensureDeferredDataLoaded(),
          refreshProfileActivityData(),
          refreshCommentsNow({ rerender: false }),
          refreshMapStories()
        ]);
        const refreshed = results.some(result => result.status === "fulfilled" && result.value !== false);
        if (!refreshed) throw new Error("No refresh task completed.");
        state.profileActivityCache = null;
        renderProfile();
        renderRewards();
        if (profilesSheetEl?.classList.contains("open")) renderProfiles();
        if (followingSheetEl?.classList.contains("open")) renderFollowing();
        if (activitySheetEl?.classList.contains("open")) renderMobileActivitySheet();
        if (notificationsSheetEl?.classList.contains("open")) renderMobileNotificationsSheet();
        updateMobileActivityUnreadBadge();
        updateMobileNotificationUnreadBadge();
        if (state.selectedSite?.slug) {
          await openSite(state.selectedSite.slug, { focus: false, skipCommentRefresh: true, skipRoute: true });
        }
        showBanner("Profile and app data refreshed.");
        return true;
      } catch (error) {
        console.warn("Mobile app data refresh failed.", error);
        showBanner("Could not refresh profile data yet.");
        return false;
      } finally {
        if (mobileRefreshAppBtn) {
          mobileRefreshAppBtn.disabled = false;
          mobileRefreshAppBtn.textContent = originalLabel;
        }
      }
    }

    function mergeCalendarEvents(events, legacyExhibits) {
      const bySlug = new Map();
      for (const item of [...events, ...legacyExhibits]) {
        const slug = item.slug || String(item.id);
        if (!slug || bySlug.has(slug)) continue;
        bySlug.set(slug, item);
      }
      return [...bySlug.values()];
    }

    function prepareSites() {
      performance.mark?.("nli-mobile-sites-prepare-start");
      state.searchDataVersion += 1;
      state.sites = repairSiteTitles(state.sites)
        .map(site => {
          const displayGeometry = siteDisplayGeometry(site);
          return {
            ...site,
            displayGeometry,
            center: geometryCenter(displayGeometry),
            checkinCenter: geometryCenter(site.geojson || site.display_geojson || displayGeometry),
            searchText: mobileListingSearchText(site).toLowerCase(),
            normalizedSearchText: normalizeText(mobileListingSearchText(site))
          };
        })
        .filter(site => site.title);
      state.siteBySlug = new Map(state.sites.map(site => [site.slug || "", site]));
      state.siteById = new Map(state.sites.map(site => [Number(site.id), site]));
      state.linkTerms = buildInternalLinkTerms();
      state.mapSites = state.sites.filter(site => (
        site.center &&
        site.slug !== WHALING_FEATURE_SLUG &&
        !site.map_geometry_alias_of
      ));
      invalidateMapSourceCache();
      prepareExhibits();
      updateMobileHeaderInstruction();
      state.filtered = browsableSites().filter(site => isOfflineTextMode() || site.center);
      clearRelatedSiteCaches();
      sortSites();
      resetNearbyRenderLimit();
      performance.mark?.("nli-mobile-sites-prepare-end");
      performance.measure?.("nli-mobile-sites-prepare", "nli-mobile-sites-prepare-start", "nli-mobile-sites-prepare-end");
    }

    function prepareExhibits() {
      const prepared = state.exhibits
        .map(exhibit => ({ ...exhibit, center: geometryCenter(exhibit.geojson) }))
        .filter(exhibit => exhibit.title);
      state.eventById = new Map(prepared.map(exhibit => [Number(exhibit.id), exhibit]));
      state.eventBySlug = new Map(prepared.map(exhibit => [exhibit.slug || "", exhibit]));
      state.exhibits = prepared.filter(exhibit => exhibit.center);
    }

    function visitableSites() {
      return state.sites.filter(site => {
        return !isBroadTerritory(site);
      });
    }

    function browsableSites() {
      return isOfflineTextMode() ? [...state.sites] : visitableSites();
    }

    function mobileStartupSpotlightCandidates() {
      return visitableSites().filter(site => {
        if (!site?.center || !site.slug || site.slug === "address-result") return false;
        const geometry = siteDisplayGeometry(site);
        return !geometry || geometry.type === "Point" || geometryBoundsArea(geometry) < 0.012;
      });
    }

    function upcomingMobileExhibit() {
      const today = new Date(`${localDateKey()}T00:00:00`);
      const candidates = state.exhibits
        .filter(exhibit => /exhibit|exhibition|gallery|collection|on[_ ]?view|artwork|portrait/i.test([exhibit.event_type, exhibit.title, exhibit.summary, exhibit.body, exhibit.venue].join(" ")))
        .map(exhibit => {
          const start = new Date(exhibit.start_datetime || exhibit.collection_date || exhibit.end_datetime || "");
          const end = new Date(exhibit.end_datetime || exhibit.start_datetime || exhibit.collection_date || "");
          return { exhibit, start, end };
        })
        .filter(item => Number.isFinite(item.start.getTime()) && (!Number.isFinite(item.end.getTime()) || item.end >= today))
        .sort((a, b) => a.start - b.start || String(a.exhibit.title || "").localeCompare(String(b.exhibit.title || "")));
      return candidates[0]?.exhibit || null;
    }

    function mobilePromoDailyIndex(length, salt = "") {
      if (!length) return -1;
      const seed = `${localDateKey()}-${salt}`;
      let hash = 0;
      for (let index = 0; index < seed.length; index += 1) {
        hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
      }
      return Math.abs(hash) % length;
    }

    function mobileOnThisDateMoment() {
      const moments = sortedTimelineEvents().filter(event => (
        timelineEventMatchesToday(event)
        && publicCleanText(event.description || event.summary || event.title)
      ));
      return moments[mobilePromoDailyIndex(moments.length, "on-this-date")] || null;
    }

    function mobileDidYouKnowMoment() {
      const moments = sortedTimelineEvents().filter(event => (
        !timelineEventMatchesToday(event)
        && publicCleanText(event.description || event.summary || event.title)
      ));
      return moments[mobilePromoDailyIndex(moments.length, "did-you-know")] || null;
    }

    function mobileDailyLearningSite() {
      const candidates = mobileStartupSpotlightCandidates().filter(site => (
        publicCleanText(site.why_this_matters)
        || publicCleanText(site.summary)
        || publicCleanText(stripHtml(site.introduction_content || ""))
      ));
      return candidates[mobilePromoDailyIndex(candidates.length, "daily-learning")] || null;
    }

    function sortSites() {
      state.filtered.sort((a, b) => {
        const da = siteDistance(a, { source: "user" });
        const db = siteDistance(b, { source: "user" });
        if (da !== null && db !== null && Math.abs(da - db) > 0.02) return da - db;
        if (da !== null && db === null) return -1;
        if (da === null && db !== null) return 1;
        return String(a.title || "").localeCompare(String(b.title || ""));
      });
    }

    function mobileListingSearchText(site) {
      return [
        site?.title,
        site?.slug,
        site?.address_label,
        site?.site_type,
        site?.summary,
        site?.why_this_matters,
        site?.introduction_content,
        site?.history_content,
        site?.oral_history_content,
        site?.translation_content,
        site?.preservation_content,
        site?.colonial_description_content,
        site?.land_loss_content,
        site?.artifacts_content,
        site?.excavation_content,
        site?.vandalism_content,
        site?.whereintheworld_content,
        site?.known_plant_species,
        site?.ancestral_territory,
        site?.ancestral_territory_note,
        Array.isArray(site?.source_list)
          ? site.source_list.map(source => [source?.title, source?.author, source?.citation, source?.citation_context].filter(Boolean).join(" ")).join(" ")
          : ""
      ].map(value => stripHtml(value || "")).filter(Boolean).join(" ");
    }

    function mobileCompactSearchKey(value) {
      // Treat punctuation such as the apostrophe in Ma's House as optional
      // while preserving normal word-based matching everywhere else.
      return normalizeText(value).replace(/\s+/g, "");
    }

    function mobileSiteSearchScore(site, query) {
      const rawQuery = String(query || "").trim().toLowerCase();
      if (!rawQuery) return 0;
      const queryKey = normalizeText(rawQuery);
      const compactQuery = mobileCompactSearchKey(rawQuery);
      const terms = queryKey.split(" ").filter(term => term.length >= 2);
      const title = normalizeText(site.title || "");
      const slug = normalizeText(site.slug || "");
      const address = normalizeText(site.address_label || "");
      const type = normalizeText(site.site_type || "");
      const summary = normalizeText(site.summary || "");
      const full = normalizeText(site.searchText || "");
      const compactTitle = mobileCompactSearchKey(site.title || "");
      const compactSlug = mobileCompactSearchKey(site.slug || "");
      const leadingTitleTerms = title.split(" ").filter(Boolean);
      let score = 0;
      // Let punctuation-free typing such as "mas" strongly identify
      // "Ma's House" instead of burying it below every title beginning Mass-.
      if (compactQuery && leadingTitleTerms.length > 1 && leadingTitleTerms[0].length <= 3
          && `${leadingTitleTerms[0]}${leadingTitleTerms[1]}` === compactQuery) score += 2600;
      if (compactQuery && compactTitle === compactQuery) score += 1400;
      if (compactQuery && compactTitle.startsWith(compactQuery)) score += 1000;
      if (compactQuery && compactSlug.startsWith(compactQuery)) score += 520;
      if (title === queryKey) score += 1200;
      if (title.startsWith(queryKey)) score += 800;
      if (title.includes(queryKey)) score += 520;
      if (terms.length > 1 && terms.every(term => title.includes(term))) score += 430;
      if (slug === queryKey) score += 650;
      if (slug.startsWith(queryKey)) score += 420;
      if (slug.includes(queryKey)) score += 260;
      if (address.includes(queryKey)) score += 160;
      if (type.includes(queryKey)) score += 90;
      if (summary.includes(queryKey)) score += 70;
      if (terms.length > 1 && terms.every(term => summary.includes(term))) score += 58;
      if (full.includes(queryKey)) score += 42;
      if (terms.length > 1 && terms.every(term => full.includes(term))) score += 34;
      return score;
    }

    function mobileWikiSearchText(article) {
      return [
        article?.title,
        article?.slug,
        article?.summary,
        stripHtml(article?.content || ""),
        stripHtml(article?.why_this_matters || "")
      ].join(" ").toLowerCase();
    }

    function mobileWikiSearchResult(article) {
      const searchText = mobileWikiSearchText(article);
      return {
        ...article,
        resultType: "wiki",
        searchText,
        normalizedSearchText: normalizeText(searchText)
      };
    }

    function mobileWikiSearchScore(article, query) {
      const rawQuery = String(query || "").trim().toLowerCase();
      if (!rawQuery) return 0;
      const queryKey = normalizeText(rawQuery);
      const compactQuery = mobileCompactSearchKey(rawQuery);
      const terms = queryKey.split(" ").filter(term => term.length >= 2);
      const title = normalizeText(article.title || "");
      const slug = normalizeText(article.slug || "");
      const summary = normalizeText(article.summary || "");
      const content = normalizeText(stripHtml(article.content || ""));
      const full = normalizeText(article.searchText || mobileWikiSearchText(article));
      const compactTitle = mobileCompactSearchKey(article.title || "");
      const compactSlug = mobileCompactSearchKey(article.slug || "");
      let score = 0;
      if (compactQuery && compactTitle === compactQuery) score += 1800;
      if (compactQuery && compactTitle.startsWith(compactQuery)) score += 1400;
      if (compactQuery && compactSlug.startsWith(compactQuery)) score += 820;
      if (title === queryKey) score += 1600;
      if (title.startsWith(queryKey)) score += 1200;
      if (title.includes(queryKey)) score += 850;
      if (slug === queryKey) score += 900;
      if (slug.startsWith(queryKey)) score += 700;
      if (slug.includes(queryKey)) score += 420;
      if (terms.length > 1 && terms.every(term => title.includes(term))) score += 760;
      if (terms.length > 1 && terms.every(term => slug.includes(term))) score += 520;
      if (summary.includes(queryKey)) score += 180;
      if (content.includes(queryKey)) score += 70;
      if (terms.length > 1 && terms.every(term => full.includes(term))) score += 160;
      if (!score && full.includes(queryKey)) score += 28;
      return score;
    }

    function mobileSearchResultScore(item, query) {
      return item?.resultType === "wiki"
        ? mobileWikiSearchScore(item, query)
        : mobileSiteSearchScore(item, query);
    }

    function mobileEditDistanceWithin(left, right, maxDistance = 3) {
      left = normalizeText(left);
      right = normalizeText(right);
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

    function mobileDidYouMeanSearch(query, matches = []) {
      const queryKey = normalizeText(query);
      if (queryKey.length < 3) return null;
      if (matches.some(item => normalizeText(item.title || "") === queryKey || normalizeText(item.title || "").startsWith(queryKey))) return null;
      const candidates = [];
      const addCandidate = item => {
        const title = String(item?.title || "").trim();
        if (!title) return;
        const keys = new Set([
          title,
          String(item?.slug || "").replace(/-/g, " "),
          ...title.split(/\s+/).filter(word => word.length >= 4),
          ...String(item?.slug || "").split(/[-_\s]+/).filter(word => word.length >= 4)
        ].map(value => normalizeText(value)).filter(value => value.length >= 3));
        let best = Infinity;
        keys.forEach(key => {
          if (key === queryKey) best = Math.min(best, 0);
          else if (key.startsWith(queryKey) || queryKey.startsWith(key)) best = Math.min(best, Math.abs(key.length - queryKey.length) <= 3 ? 1 : 2);
          else if (Math.abs(key.length - queryKey.length) <= 3) best = Math.min(best, mobileEditDistanceWithin(queryKey, key, 3));
        });
        if (best <= Math.max(1, Math.floor(queryKey.length / 4))) candidates.push({ item, title, score: best });
      };
      state.sites.forEach(addCandidate);
      (state.wikiArticles || []).forEach(addCandidate);
      candidates.sort((a, b) => a.score - b.score || a.title.localeCompare(b.title));
      return candidates[0] || null;
    }

    function sortSearchMatches(query) {
      state.filtered.sort((a, b) => {
        const scoreDelta = mobileSearchResultScore(b, query) - mobileSearchResultScore(a, query);
        if (scoreDelta) return scoreDelta;
        return String(a.title || "").localeCompare(String(b.title || ""));
      });
    }

    function defaultNearbyRenderLimit() {
      const query = activeMobileSearchValue().trim();
      if (state.addressSearchMode) return 12;
      if (query) return Math.min(18, NEARBY_LIST_SEARCH_LIMIT);
      if (isNativeAndroidApp()) {
        return state.mobileStartupRendering ? NEARBY_LIST_ANDROID_INITIAL_LIMIT : NEARBY_LIST_ANDROID_DEFAULT_LIMIT;
      }
      return NEARBY_LIST_DESKTOP_LIMIT;
    }

    function resetNearbyRenderLimit() {
      state.nearbyRenderLimit = defaultNearbyRenderLimit();
    }

    function scheduleSearchMapSync() {
      // Results searching must not redraw the visitor's map. Only an explicit
      // result selection is allowed to reframe it.
      window.clearTimeout(state.searchMapSyncTimer);
      state.searchMapSyncTimer = null;
    }

    function scheduleSearchRenderSettle() {
      if (!isNativeAndroidApp()) return;
      window.clearTimeout(state.searchRenderSettledTimer);
      state.searchRenderSettledTimer = window.setTimeout(() => {
        state.searchRenderSettledTimer = null;
        const query = activeMobileSearchValue().trim();
        if (!query || state.nearbyRenderLimit >= Math.min(NEARBY_LIST_SEARCH_LIMIT, 36)) return;
        state.nearbyRenderLimit = Math.min(NEARBY_LIST_SEARCH_LIMIT, 36, state.filtered.length || 36);
        renderList();
      }, 900);
    }

    function showAndroidSearchPreviewPanel() {
      if (!isNativeAndroidApp() || !activeMobileSearchValue().trim()) return;
      setMobilePanelMode("nearby");
      // Full mode hides the header, including the focused search field. While
      // typing, reveal a normal-height results tray instead of dismissing the
      // keyboard after the first character.
      if (state.mobilePanelState === "collapsed") setMobileBottomPanelState("normal");
      listEl?.scrollTo?.({ top: 0, behavior: "auto" });
    }

    function filterSites() {
      const rawQuery = activeMobileSearchValue().trim();
      const query = rawQuery.toLowerCase();
      const normalizedQuery = normalizeText(rawQuery);
      const compactQuery = mobileCompactSearchKey(rawQuery);
      if (!query) {
        clearAddressSearch();
        state.filtered = browsableSites();
        sortSites();
        resetNearbyRenderLimit();
        renderList();
        syncMarkers();
        return;
      }
      const includesSearch = item => String(item.searchText || "").includes(query)
        || String(item.normalizedSearchText || "").includes(normalizedQuery)
        || (compactQuery.length >= 2 && (
          mobileCompactSearchKey(item.title || "").includes(compactQuery)
          || mobileCompactSearchKey(item.normalizedSearchText || "").includes(compactQuery)
        ));
      const siteMatches = state.sites.filter(includesSearch);
      const wikiMatches = (state.wikiArticles || [])
        .map(mobileWikiSearchResult)
        .filter(includesSearch);
      const matches = [...siteMatches, ...wikiMatches];
      const placeSearch = isPlaceSearchCandidate(query, matches);
      if (placeSearch) {
        state.addressSearchMode = true;
        state.addressSearchPending = query;
        state.filtered = matches;
        sortSearchMatches(query);
        resetNearbyRenderLimit();
        renderList();
        showAndroidSearchPreviewPanel();
        updateAddressSearch(query);
        return;
      }
      state.filtered = matches;
      sortSearchMatches(query);
      resetNearbyRenderLimit();
      renderList();
      showAndroidSearchPreviewPanel();
      clearAddressSearch();
      scheduleSearchRenderSettle();
    }

    function closeDetailForSearchResults() {
      if (!activeMobileSearchValue().trim() || !detailEl?.classList.contains("open")) return false;
      closeDetail({ skipRoute: true, blockMapTap: false });
      return true;
    }

    function clearMobileSearchForResultOpen() {
      if (!activeMobileSearchValue().trim()) return false;
      window.clearTimeout(state.searchTimer);
      window.clearTimeout(state.searchMapSyncTimer);
      window.clearTimeout(state.searchRenderSettledTimer);
      searchEl.value = "";
      state.androidImeSearchDraft = "";
      state.lastSearchValue = "";
      state.lastSearchDataVersion = state.searchDataVersion;
      if (state.searchValueWatchTimer) {
        window.clearInterval(state.searchValueWatchTimer);
        state.searchValueWatchTimer = null;
      }
      clearAddressSearch();
      state.filtered = browsableSites();
      sortSites();
      resetNearbyRenderLimit();
      renderList();
      return true;
    }

    function scheduleFilterSites() {
      window.clearTimeout(state.searchTimer);
      state.searchTimer = window.setTimeout(filterSites, isNativeAndroidApp() ? 260 : 140);
    }

    function scheduleSearchSync() {
      if (!searchEl) return;
      const value = activeMobileSearchValue();
      if (value === state.lastSearchValue && state.lastSearchDataVersion === state.searchDataVersion) return;
      state.lastSearchValue = value;
      state.lastSearchDataVersion = state.searchDataVersion;
      refreshMobileSearchSuggestions();
    }

    function openMobileSearchResultsPage() {
      if (!searchEl) return;
      const query = activeMobileSearchValue().trim();
      // Commit Android's full native composition into the DOM before any
      // existing result/blur paths inspect input.value.
      if (searchEl.value !== query) searchEl.value = query;
      state.androidImeSearchDraft = query;
      window.clearTimeout(state.searchTimer);
      if (detailEl?.classList.contains("open")) closeDetail({ skipRoute: true, blockMapTap: false });
      filterSites();
      if (!query) {
        setMobilePanelMode("nearby");
        setNearbyPanelState("default");
        return;
      }
      state.nearbyRenderLimit = Math.min(NEARBY_LIST_SEARCH_LIMIT, Math.max(18, defaultNearbyRenderLimit()));
      renderList();
      setMobilePanelMode("nearby");
      setMobileBottomPanelState("maximized");
      listEl?.scrollTo?.({ top: 0, behavior: "smooth" });
      searchEl.blur();
      renderSearchSuggestions("");
      if (state.filtered.length) showBanner(`${state.filtered.length} search result${state.filtered.length === 1 ? "" : "s"}.`);
    }

    function handleMobileSearchKeydown(event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      openMobileSearchResultsPage();
    }

    function handleMobileSearchCommand() {
      if (!activeMobileSearchValue().trim()) return;
      // The Android keyboard's Search action is delivered as this event and
      // may arrive immediately after the final character.  Always honor it.
      openMobileSearchResultsPage();
    }

    // Android IMEs deliver their Search action through InputConnection rather
    // than consistently emitting the HTML search event in WebView.
    window.__nliSubmitMobileSearch = handleMobileSearchCommand;

    function activeMobileSearchValue() {
      const nativeValue = state.androidImeSearchDraft || "";
      const resolvedValue = reconcileNativeSearchDraft(nativeValue);
      if (resolvedValue !== nativeValue) state.androidImeSearchDraft = resolvedValue;
      return resolvedValue;
    }

    function handleMobileSearchInput(nativeDraft = null) {
      const domValue = searchEl?.value || "";
      const priorDraft = state.androidImeSearchDraft || "";
      const hasNativeDraft = typeof nativeDraft === "string";
      // Android can emit a stale input event that still exposes the first
      // committed character after the IME has sent a longer composing string.
      state.androidImeSearchDraft = !hasNativeDraft
        ? (!domValue
          ? ""
          : isNativeAndroidApp() && priorDraft.length > domValue.length && priorDraft.startsWith(domValue)
          ? priorDraft
          : domValue)
        : nativeDraft;
      state.lastSearchInputAt = Date.now();
      // Typing only changes the type-ahead. Keep the visible map and current
      // listing context steady until the visitor chooses a suggestion or
      // explicitly submits the search.
      state.lastSearchValue = activeMobileSearchValue();
      state.lastSearchDataVersion = state.searchDataVersion;
      refreshMobileSearchSuggestions();
      window.clearTimeout(state.searchTimer);
    }

    // Native WebView input can update the visible field without delivering a
    // usable DOM event. Expose the same closure-bound handler for Android.
    window.__nliRefreshMobileSearchInput = handleMobileSearchInput;
    // Android's composing text can advance before Chromium updates input.value.
    // MainActivity forwards it here so every character drives the local search.
    function reconcileNativeSearchDraft(value) {
      const nativeValue = String(value || "");
      const domValue = searchEl?.value || "";
      if (!nativeValue) return domValue;
      const nativeKey = nativeValue.toLowerCase();
      const domKey = domValue.toLowerCase();
      return domValue.length > nativeValue.length
        && (domKey.startsWith(nativeKey) || domKey.endsWith(nativeKey))
        ? domValue
        : nativeValue;
    }

    window.__nliSetNativeSearchDraft = value => handleMobileSearchInput(reconcileNativeSearchDraft(value));
    window.__nliAppendNativeSearchText = value => {
      const fragment = String(value || "");
      if (fragment) handleMobileSearchInput(`${activeMobileSearchValue()}${fragment}`);
    };
    window.__nliDeleteNativeSearchText = count => {
      const amount = Math.max(1, Number(count) || 1);
      handleMobileSearchInput(activeMobileSearchValue().slice(0, -amount));
    };

    function handleMobileSearchFocus() {
      state.androidImeSearchDraft = searchEl?.value || "";
      state.lastAutocompleteQuery = null;
      hideMobileStartupSpotlight();
      closeDetailForSearchResults();
      startSearchValueWatch();
      refreshMobileSearchSuggestions();
    }

    function startSearchValueWatch() {
      if (!searchEl || state.searchValueWatchTimer) return;
      state.lastSearchValue = searchEl.value || "";
      state.searchValueWatchTimer = window.setInterval(scheduleSearchSync, 180);
      window.setTimeout(stopSearchValueWatch, 5000);
    }

    function stopSearchValueWatch() {
      if (!state.searchValueWatchTimer) return;
      window.clearInterval(state.searchValueWatchTimer);
      state.searchValueWatchTimer = null;
      scheduleSearchSync();
      if (searchEl?.value.trim()) window.setTimeout(showAndroidSearchPreviewPanel, 80);
    }

    function installNativeAndroidSearchWatch() {
      if (!/Android/i.test(navigator.userAgent) || state.nativeAndroidSearchWatchTimer || !searchEl) return;
      state.lastSearchValue = "";
      scheduleSearchSync();
      // Some Samsung WebView/IME combinations mutate input.value without
      // dispatching a later input event. Keep autocomplete independent from
      // the heavier map/list filter so each actual field value is rendered.
      state.nativeAndroidSearchWatchTimer = window.setInterval(() => {
        refreshMobileSearchSuggestions();
        scheduleSearchSync();
      }, 180);
    }

    function isPlaceSearchCandidate(query, matches = []) {
      if (!query || query.length < 3) return false;
      if (matches.length && matches.some(site => String(site.title || "").toLowerCase() === query)) return false;
      const queryTerms = normalizeText(query).split(" ").filter(term => term.length >= 3);
      return /\d/.test(query)
        || /\b(street|st|road|rd|avenue|ave|lane|ln|drive|dr|court|ct|boulevard|blvd|highway|hwy|route|ny-|zip|new york|long island|university|college|school|hospital|museum|library|park|station|airport|restaurant|cafe|store|market|church|cemetery|beach|marina|hotel|center|centre|campus)\b/i.test(query)
        || queryTerms.length >= 2;
    }

    function clearAddressSearch() {
      state.addressSearchMode = false;
      state.addressSearchPending = "";
      state.addressSearchToken = "";
      state.filtered = state.filtered.filter(site => site.slug !== "address-result");
      if (state.addressMarker) {
        state.addressMarker.remove();
        state.addressMarker = null;
      }
    }

    async function updateAddressSearch(query) {
      if (!query || query.length < 3) return;
      const token = query;
      state.addressSearchToken = token;
      try {
        const bbox = LONG_ISLAND_BOUNDS.flat().join(",");
        const tokenValue = window.mapboxgl?.accessToken || MAPBOX_PUBLIC_TOKEN;
        const normalizedQuery = query.replace(/\bstonybrook\b/ig, "stony brook");
        const searchboxFeature = await searchboxPlaceSearch(normalizedQuery, tokenValue, bbox);
        if (state.addressSearchToken !== token) return;
        const feature = searchboxFeature || await geocodePlaceSearch(normalizedQuery, tokenValue, bbox);
        if (state.addressSearchToken !== token) return;
        if (!feature?.center) {
          state.addressSearchMode = false;
          state.addressSearchPending = "";
          state.filtered = [];
          resetNearbyRenderLimit();
          renderList();
          syncMarkers();
          return;
        }
        applyAddressSearchFeature(feature);
      } catch {
        if (state.addressSearchToken === token) {
          state.addressSearchMode = false;
          state.addressSearchPending = "";
          state.filtered = [];
          resetNearbyRenderLimit();
          renderList();
          syncMarkers();
        }
      }
    }

    async function searchboxPlaceSearch(query, tokenValue, bbox) {
      const sessionToken = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${encodeURIComponent(tokenValue)}&session_token=${encodeURIComponent(sessionToken)}&limit=6&bbox=${bbox}&proximity=-73.1,40.85`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
      const scored = suggestions
        .filter(item => item?.mapbox_id)
        .map(item => ({ item, score: placeSuggestionScore(item, query) }))
        .filter(entry => entry.score > -100)
        .sort((a, b) => b.score - a.score);
      const suggestion = scored[0]?.item;
      if (!suggestion) return null;
      return retrieveSearchboxSuggestion({ ...suggestion, sessionToken }, tokenValue);
    }

    async function retrieveSearchboxSuggestion(suggestion, tokenValue) {
      const mapboxId = suggestion?.mapboxId || suggestion?.mapbox_id;
      const sessionToken = suggestion?.sessionToken;
      if (!mapboxId || !sessionToken) return null;
      const retrieveUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?access_token=${encodeURIComponent(tokenValue)}&session_token=${encodeURIComponent(sessionToken)}`;
      const retrieveResponse = await fetch(retrieveUrl);
      if (!retrieveResponse.ok) return null;
      const retrieveData = await retrieveResponse.json();
      const result = (retrieveData.features || [])[0];
      const center = result?.geometry?.coordinates;
      if (!pointWithinBounds(center, LONG_ISLAND_BOUNDS)) return null;
      const props = result.properties || {};
      const name = props.name || suggestion.name || "Search result";
      const address = props.full_address || suggestion.full_address || props.place_formatted || suggestion.place_formatted || "";
      return {
        center,
        placeName: address ? `${name}, ${address}` : name,
        label: props.feature_type === "poi" || suggestion.feature_type === "poi" || suggestion.featureType === "poi" ? "Place search result" : "Search result",
        summary: props.feature_type === "poi" || suggestion.feature_type === "poi" || suggestion.featureType === "poi" ? "Place or business search result" : "Map search result"
      };
    }

    function schedulePlaceAutocomplete(rawQuery) {
      const query = String(rawQuery || "").trim();
      if (query === state.placeAutocompleteQuery) return;
      state.placeAutocompleteQuery = query;
      state.placeAutocompleteResults = [];
      state.placeAutocompleteRequest += 1;
      window.clearTimeout(state.placeAutocompleteTimer);
      if (query.length < 3 || isOfflineTextMode() || navigator.onLine === false) return;
      const requestId = state.placeAutocompleteRequest;
      state.placeAutocompleteTimer = window.setTimeout(() => loadPlaceAutocomplete(query, requestId), 320);
    }

    async function loadPlaceAutocomplete(rawQuery, requestId) {
      const query = rawQuery.replace(/\bstonybrook\b/ig, "stony brook");
      const tokenValue = window.mapboxgl?.accessToken || MAPBOX_PUBLIC_TOKEN;
      if (!tokenValue || String(tokenValue).startsWith("__NLI_")) return;
      const sessionToken = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const bbox = LONG_ISLAND_BOUNDS.flat().join(",");
      const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${encodeURIComponent(tokenValue)}&session_token=${encodeURIComponent(sessionToken)}&limit=6&bbox=${bbox}&proximity=-73.1,40.85`;
      try {
        const response = await fetch(url);
        if (!response.ok || requestId !== state.placeAutocompleteRequest) return;
        const data = await response.json();
        if (requestId !== state.placeAutocompleteRequest || rawQuery !== state.placeAutocompleteQuery) return;
        const seen = new Set();
        state.placeAutocompleteResults = (Array.isArray(data.suggestions) ? data.suggestions : [])
          .filter(item => item?.mapbox_id && placeSuggestionScore(item, query) > -100)
          .map(item => ({
            mapboxId: item.mapbox_id,
            sessionToken,
            title: String(item.name || item.full_address || "Map search result").trim(),
            subtitle: String(item.full_address || item.place_formatted || "Long Island map result").trim(),
            featureType: item.feature_type || "place"
          }))
          .filter(item => {
            const key = `${item.title}|${item.subtitle}`.toLowerCase();
            if (!item.title || seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .slice(0, 4);
        renderSearchSuggestions(rawQuery);
      } catch {
        if (requestId === state.placeAutocompleteRequest) state.placeAutocompleteResults = [];
      }
    }

    async function openPlaceAutocompleteSuggestion(index) {
      const suggestion = state.placeAutocompleteResults[Number(index)];
      if (!suggestion) return false;
      const tokenValue = window.mapboxgl?.accessToken || MAPBOX_PUBLIC_TOKEN;
      searchEl.value = suggestion.title;
      state.androidImeSearchDraft = suggestion.title;
      searchSuggestionsEl?.replaceChildren();
      if (searchSuggestionsEl) searchSuggestionsEl.hidden = true;
      searchEl.setAttribute("aria-expanded", "false");
      showBanner(`Finding ${suggestion.title} on Long Island...`);
      const feature = await retrieveSearchboxSuggestion(suggestion, tokenValue);
      if (!feature?.center) {
        openMobileSearchResultsPage();
        return false;
      }
      searchEl.value = feature.placeName;
      state.androidImeSearchDraft = feature.placeName;
      state.lastSearchValue = feature.placeName;
      if (detailEl?.classList.contains("open")) closeDetail({ skipRoute: true, blockMapTap: false });
      applyAddressSearchFeature(feature);
      setMobilePanelMode("nearby");
      setMobileBottomPanelState("maximized");
      listEl?.scrollTo?.({ top: 0, behavior: "smooth" });
      searchEl.blur();
      showBanner(`Showing ${suggestion.title} with nearby On This Site places.`);
      return true;
    }

    function placeSuggestionScore(suggestion, query) {
      return MAP_UTILS.scorePlaceSuggestion(suggestion, query, {
        normalizeText,
        weights: {
          street: -35,
          place: -10,
          nameTerm: 8,
          missingTerm: -5
        }
      });
    }

    async function geocodePlaceSearch(query, tokenValue, bbox) {
      const geocodeQuery = /\b(new york|ny|long island|nassau|suffolk|brooklyn|queens)\b/i.test(query)
        ? query
        : `${query} Long Island NY`;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(geocodeQuery)}.json?access_token=${encodeURIComponent(tokenValue)}&autocomplete=true&limit=5&types=poi,address,place,locality,neighborhood&bbox=${bbox}&proximity=-73.1,40.85`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      const feature = (data.features || []).find(item => {
        if (!pointWithinBounds(item.center, LONG_ISLAND_BOUNDS)) return false;
        const resultName = normalizeText(item.text || item.place_name);
        if (resultName === "long island" && normalizeText(query).split(" ").length > 1) return false;
        return true;
      });
      if (!feature?.center) return null;
      return {
        center: feature.center,
        placeName: feature.place_name,
        label: "Search result",
        summary: "Map search result"
      };
    }

    function setAddressMarker(center, label = "Your search") {
      if (!state.map || !Array.isArray(center) || !window.mapboxgl?.Marker) return;
      if (state.addressMarker) state.addressMarker.remove();
      const territoryLine = territoryLineForPoint(center);
      const element = document.createElement("button");
      element.type = "button";
      element.className = "user-location-dot";
      element.setAttribute("aria-label", "Your search result");
      const popupHtml = `
        <div style="max-width:190px">
          <strong>Your Search</strong>
          <p style="margin:.25rem 0 .5rem">${escapeHtml(label)}</p>
          ${territoryLine ? `<p style="margin:.25rem 0 .5rem;color:#225f4c;font-weight:800">${escapeHtml(territoryLine)}</p>` : ""}
          <button type="button" class="action secondary" data-clear-address>Clear</button>
        </div>
      `;
      const popup = window.mapboxgl?.Popup
        ? new mapboxgl.Popup({ closeButton: false, offset: 18 }).setHTML(popupHtml)
        : null;
      state.addressMarker = new mapboxgl.Marker({ element, anchor: "center" })
        .setLngLat(center)
        .addTo(state.map);
      if (popup) state.addressMarker.setPopup(popup);
      element.addEventListener("click", () => {
        if (popup) state.addressMarker.togglePopup();
        else showBanner("Your search result.");
      });
    }

    const SITE_SUBTITLE_OVERRIDES = {
      "st-matthew-chapel": "Historic Site",
      "council-rock": "Sacred Site",
      "orient-burial": "Sacred Site",
      "setalcott-powwow-grounds": "Cultural Gathering Place",
      "shinnecock-powwow-grounds": "Cultural Gathering Place",
      "whaling": "Cultural Practice"
    };

    const SITE_TYPE_LABELS = {
      placename: "Place Name",
      place_name: "Place Name",
      burial_site: "Burial Site",
      sacred_site: "Sacred Site",
      historic_site: "Historic Site",
      village_site: "Village Site",
      ancestral_territory: "Ancestral Territory",
      territory: "Ancestral Territory",
      cultural_practice: "Cultural Practice",
      cultural_practices: "Cultural Practice",
      cultural_gathering_place: "Cultural Gathering Place",
      exhibit_supporter: "Exhibit / Supporter Site",
      deed: "Deed Site",
      search: "Search Result"
    };
    const MOBILE_TERRITORY_FILL_OVERRIDES = {
      "shinnecock-ancestral-land": "#ffd93d",
      "corchaug-ancestral-land": "#ff8a00",
      "merrick-ancestral-land": "#00a7b5",
      "hoggenoch": "#66ff00",
      "hoggenoch-manhansett-ancestral-land": "#66ff00"
    };

    function siteSubtitle(site) {
      return SITE_UTILS.siteSubtitle(site, { overrides: SITE_SUBTITLE_OVERRIDES, typeLabels: SITE_TYPE_LABELS });
    }

    function siteIsAlgonquianPlaceName(site) {
      return SITE_UTILS.siteIsAlgonquianPlaceName(site, {
        normalizeText,
        isBroadTerritory
      });
    }

    function siteCategoryTags(site) {
      return SITE_UTILS.siteCategoryTags(site, {
        normalizeText,
        isBroadTerritory,
        isAlgonquianPlaceName: siteIsAlgonquianPlaceName,
        typeMode: "display",
        overrides: SITE_SUBTITLE_OVERRIDES,
        typeLabels: SITE_TYPE_LABELS
      });
    }

    function activeMobileLayerCategories() {
      const configured = state.settings.layerCategories || {};
      return SITE_UTILS.layerFilterSetFromInputs(mobileLayerCategoryInputs, input => configured[input.value] !== false);
    }

    function sitePassesMobileLayerCategories(site) {
      if (!mobileLayerCategoryInputs.length) return true;
      if (SITE_UTILS.isExhibitSite(site) && state.settings.exhibits !== false) return true;
      const active = activeMobileLayerCategories();
      const keys = SITE_UTILS.siteLayerCategoryKeys(site);
      return SITE_UTILS.passesLayerCategoryFilters(keys, active, mobileLayerCategoryInputs.length);
    }

    function activeMobileEraCategories() {
      const configured = state.settings.eraCategories || {};
      return new Set(mobileLayerEraInputs
        .filter(input => configured[input.value] !== false)
        .map(input => input.value));
    }

    function fallbackMobileEraKeysForText(value = "") {
      const text = normalizeText(value);
      const eras = new Set();
      if (/pre.?contact|ancient|prehistoric|paleo|archaic|orient|woodland|archaeolog|shell midden|burial/.test(text)) eras.add("precontact");
      if (/contact period|early contact|colonial|deed|patent|treaty|purchase|17th century|1600|160\d|161\d|162\d|163\d|164\d|165\d|166\d|167\d|168\d|169\d/.test(text)) eras.add("contact");
      if (/historic|18th century|19th century|1700|1800|reservation|mission|whal|deed|record/.test(text)) eras.add("historic");
      if (/contemporary|modern|today|present|current|20th century|21st century|1900|2000|museum|exhibit|powwow|community|artist|school/.test(text)) eras.add("contemporary");
      if (!eras.size) eras.add("historic");
      return eras;
    }

    function siteEraKeys(site = {}) {
      if (isBroadTerritory(site)) return new Set(["precontact", "contact"]);
      if (SITE_UTILS.isExhibitSite(site)) return new Set(["contemporary"]);
      const eras = new Set(timelineEventsForSource("site", site.id, site.slug)
        .map(event => TIMELINE_UTILS.eraForEvent?.(event)?.key)
        .filter(Boolean));
      if (eras.size) return eras;
      return fallbackMobileEraKeysForText([
        site.title,
        site.site_type,
        site.summary,
        site.introduction_content,
        site.history_content,
        site.preservation_content
      ].join(" "));
    }

    function sitePassesMobileEraCategories(site) {
      if (!mobileLayerEraInputs.length) return true;
      const active = activeMobileEraCategories();
      if (active.size >= mobileLayerEraInputs.length) return true;
      if (!active.size) return false;
      return [...siteEraKeys(site)].some(key => active.has(key));
    }

    function timelineEventPassesMobileEraCategories(event = {}) {
      if (!mobileLayerEraInputs.length) return true;
      const active = activeMobileEraCategories();
      if (active.size >= mobileLayerEraInputs.length) return true;
      if (!active.size) return false;
      const key = TIMELINE_UTILS.eraForEvent?.(event)?.key;
      return key ? active.has(key) : true;
    }

    function siteVisibleInMobileLayers(site) {
      if (!sitePassesMobileLayerCategories(site)) return false;
      if (!sitePassesMobileEraCategories(site)) return false;
      const exhibitSite = SITE_UTILS.isExhibitSite(site);
      const exhibitsOn = state.settings.exhibits !== false;
      if (exhibitSite && !exhibitsOn) return false;
      const geometryType = siteDisplayGeometry(site)?.type;
      return SITE_UTILS.featureVisibleInPrimaryLayers(geometryType, {
        isExhibit: exhibitSite,
        exhibitsOn,
        pinsOn: state.settings.showPins !== false,
        shapesOn: state.settings.showShapes !== false
      });
    }

    function siteTagsHtml(site) {
      const tags = siteCategoryTags(site);
      if (!tags.length) return "";
      return `<div class="tag-list" aria-label="Related categories"><span class="tag-list-label">Tags</span>${tags.map(tag => {
        const url = new URL(window.location.href);
        url.search = "";
        url.searchParams.set("tag", tag.key);
        return `<a class="site-tag" href="${escapeHtml(`${url.pathname}${url.search}${url.hash}`)}" data-site-tag="${escapeHtml(tag.key)}">${escapeHtml(tag.label)}</a>`;
      }).join("")}</div>`;
    }

    function relatedSiteCenter(site) {
      if (Array.isArray(site?.center) && site.center.length >= 2) return site.center;
      const geometry = siteDisplayGeometry(site);
      if (geometry?.type === "Point" && Array.isArray(geometry.coordinates)) return geometry.coordinates;
      return geometry ? geometryCenter(geometry) : null;
    }

    function relatedMomentKeys(site) {
      return new Set(timelineEventsForSource("site", site?.id, site?.slug)
        .map(event => [
          event.related_wiki_slug,
          event.related_site_slug,
          event.source_slug,
          event.source_title,
          event.date_label && event.title ? `${event.date_label}:${event.title}` : ""
        ].filter(Boolean).map(value => normalizeText(value)))
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
      const text = normalizeText([
        site?.title,
        site?.summary,
        site?.introduction_content,
        site?.history_content,
        site?.ancestral_territory ? state.sites.find(item => Number(item.id) === Number(site.ancestral_territory))?.title : ""
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
        town: normalizeText(site?.town || ""),
        county: normalizeText(site?.county || ""),
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
            reasons.push(sharedTags.some(tag => tag.key === "theme:algonquian-place-name") ? "Shared place-name history" : "Same theme");
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
          const miles = milesBetween(currentCenter, entry.center);
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

    function relatedSiteCardHtml(entry, index, { initialLimit = 3 } = {}) {
      const site = entry.site;
      const summary = publicCleanText(site.summary || site.address_label || "Mapped place").slice(0, 145);
      const meta = [siteSubtitle(site), GEOMETRY_UTILS.distanceLabelMiles(entry.miles)].filter(Boolean).join(" - ");
      return `
        <button class="site-card related-site-card${index >= initialLimit ? " related-site-extra" : ""}" type="button" data-slug="${escapeHtml(site.slug)}" ${index >= initialLimit ? "hidden" : ""}>
          <span>
            <span class="related-site-reason">${escapeHtml(entry.reason || "Connected site")}</span>
            <h2>${escapeHtml(site.title)}</h2>
            ${meta ? `<small class="related-site-meta">${escapeHtml(meta)}</small>` : ""}
            ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
          </span>
        </button>
      `;
    }

    function relatedSitesSection(site, options = {}) {
      const related = connectedSitesFor(site, { limit: options.limit || 3 });
      if (!related.length) return "";
      const initialLimit = Math.min(3, options.initialLimit || 3);
      return `
        <section class="section related-sites-section">
          <h3>Sites connected to this place</h3>
          <div class="related-sites-list">
            ${related.map((entry, index) => relatedSiteCardHtml(entry, index, { initialLimit })).join("")}
          </div>
        </section>
      `;
    }

    function openSiteTagList(tagKey, options = {}) {
      const sample = state.sites.find(site => siteCategoryTags(site).some(tag => tag.key === tagKey));
      const tag = sample ? siteCategoryTags(sample).find(item => item.key === tagKey) : null;
      const title = tag?.label || "Related Sites";
      const matches = state.sites
        .filter(site => site.slug !== "address-result" && siteCategoryTags(site).some(item => item.key === tagKey))
        .sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
      openInfoPanel(title, `${matches.length} related place${matches.length === 1 ? "" : "s"}`, `
        <p class="summary">Places connected by this category or theme.</p>
        <section class="section compact-list">
          ${matches.map(siteCardButton).join("") || `<p class="summary">No related places found yet.</p>`}
        </section>
      `);
      setMobileContentRoute({ tag: tagKey }, options);
    }

    function normalizeMobileLearningCard(input = {}, options = {}) {
      if (typeof LEARNING_CARD_UTILS.normalizeLearningCard === "function") {
        return LEARNING_CARD_UTILS.normalizeLearningCard(input, options);
      }
      return {
        key: `${input.type || "learning"}:${input.id || input.slug || input.title || "card"}`,
        id: String(input.id || ""),
        type: input.type || "learning",
        title: cleanPlainText(input.title || "Explore local history"),
        sourceName: cleanPlainText(input.sourceName || input.source || input.title || ""),
        date: cleanPlainText(input.date || ""),
        imageUrl: cleanImageUrl(input.imageUrl || ""),
        imageFallbackUrl: cleanImageUrl(input.imageFallbackUrl || ""),
        excerpt: cleanPlainText(input.excerpt || input.summary || ""),
        target: input.target || null,
        relatedMapItem: input.map || null,
        capabilities: input.capabilities || {},
        permissions: input.permissions || {},
        counts: input.counts || { upvotes: 0, comments: 0 }
      };
    }

    function learningCardImageHtml(card, actionAttribute = "", alt = "", options = {}) {
      if (!card?.imageUrl) {
        return options.hideWhenMissing === true
          ? ""
          : `<span class="learning-card-media learning-card-media-empty" aria-hidden="true">${escapeHtml((card?.title || "?").slice(0, 1))}</span>`;
      }
      const fallback = mobileSnapshotImageUrl(card.imageFallbackUrl || "");
      const priority = options.priority === true;
      const eager = options.eager === true || priority;
      return `
        <button class="learning-card-media" type="button" ${actionAttribute} aria-label="${escapeHtml(`Open ${card.title}`)}">
          <img class="learning-card-image" src="${escapeHtml(mobileSnapshotImageUrl(card.imageUrl))}" alt="${escapeHtml(alt)}" loading="${eager ? "eager" : "lazy"}"${priority ? ' fetchpriority="high"' : ""} decoding="async" onload="this.classList.add('is-loaded')" onerror="${imageErrorAction(fallback)}">
        </button>
      `;
    }

    function learningCardExcerptHtml(card) {
      const excerpt = cleanPlainText(card?.excerpt || "");
      if (!excerpt) return "";
      const expandable = excerpt.length > 220;
      const expanded = state.expandedLearningCardKeys.has(card.key);
      return `
        <p class="learning-card-excerpt${expanded ? " is-expanded" : ""}" data-learning-card-excerpt>${escapeHtml(excerpt)}</p>
        ${expandable ? `<button class="learning-card-see-more" type="button" data-learning-see-more="${escapeHtml(card.key)}" aria-expanded="${expanded ? "true" : "false"}">${expanded ? "See less" : "See more"}</button>` : ""}
      `;
    }

    function learningCardTagsHtml(tags = []) {
      const visible = tags.map(tag => cleanPlainText(tag?.label || tag)).filter(Boolean).slice(0, 3);
      return visible.length ? `<div class="learning-card-tags">${visible.map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : "";
    }

    function learningCardCommentCount(sourceType, item) {
      if (!item || !["site", "wiki"].includes(sourceType)) return 0;
      return commentsForSource(sourceType, item).length;
    }

    function nearbyFeedCardModel(item, index, options = {}) {
      const isWiki = item.resultType === "wiki";
      const isExternalMapResult = item.slug === "address-result";
      const sourceType = isWiki ? "wiki" : "site";
      const image = isWiki ? "" : mobileSnapshotImageUrl(listingImage(item));
      const fallback = isWiki ? "" : mobileSnapshotImageUrl(listingImageFallback(item));
      const summary = isWiki
        ? stripHtml(item.summary || item.content || "")
        : stripHtml(item.summary || item.introduction_content || item.why_this_matters || "");
      const distance = options.showingAddressResults && Number.isFinite(item?._addressDistance)
        ? distanceLabel(item)
        : state.userLocation
          ? distanceLabel(item, { source: "user" })
          : "";
      const map = !isWiki && Array.isArray(item.center)
        ? { itemType: "site", itemId: item.id, slug: item.slug, coordinates: item.center }
        : null;
      const card = normalizeMobileLearningCard({
        id: item.id,
        type: sourceType,
        title: item.title,
        sourceName: isWiki ? "Knowledgebase" : siteSubtitle(item),
        imageUrl: image,
        imageFallbackUrl: fallback,
        excerpt: summary,
        target: { type: sourceType, id: item.id, slug: item.slug },
        map,
        counts: { comments: learningCardCommentCount(sourceType, item) },
        capabilities: { open: true, map: Boolean(map), comment: !isExternalMapResult },
        permissions: { loggedIn: Boolean(currentContributorProfile()) }
      }, { excerptLimit: 520 });
      return {
        ...card,
        item,
        sourceType,
        index,
        distance,
        tags: isWiki ? ["Knowledgebase"] : siteCategoryTags(item)
      };
    }

    function nearbyFeedCardHtml(card) {
      const isWiki = card.sourceType === "wiki";
      const isExternalMapResult = card.item.slug === "address-result";
      const buttonAttrs = isWiki
        ? `data-wiki-slug="${escapeHtml(card.item.slug)}"`
        : `data-slug="${escapeHtml(card.item.slug)}"`;
      const resultAttrs = `data-result-index="${card.index}" data-result-kind="${isWiki ? "wiki" : "site"}" data-result-slug="${escapeHtml(card.item.slug || "")}"`;
      const mapAction = card.capabilities.map
        ? `<button type="button" data-nearby-map="${escapeHtml(card.item.slug)}">Map</button>`
        : "";
      const commentCount = Number(card.counts?.comments || 0);
      return `
        <article class="site-card learning-card nearby-feed-card${!isWiki && card.item.slug === state.selectedSlug ? " active" : ""}" ${buttonAttrs} ${resultAttrs} data-learning-card-key="${escapeHtml(card.key)}">
          ${learningCardImageHtml(card, isWiki ? `data-nearby-open-wiki="${escapeHtml(card.item.slug)}"` : `data-nearby-open="${escapeHtml(card.item.slug)}"`, card.item.listing_image_alt || "", { hideWhenMissing: true })}
          <div class="learning-card-body">
            <div class="learning-card-meta">
              <span>${escapeHtml(card.sourceName)}</span>
              ${card.distance ? `<strong>${escapeHtml(card.distance)}</strong>` : ""}
            </div>
            <h2><button type="button" ${isWiki ? `data-nearby-open-wiki="${escapeHtml(card.item.slug)}"` : `data-nearby-open="${escapeHtml(card.item.slug)}"`}>${escapeHtml(card.title)}</button></h2>
            ${learningCardTagsHtml(card.tags)}
            ${learningCardExcerptHtml(card)}
            <div class="learning-card-actions">
              ${mapAction}
              <button class="primary" type="button" ${isWiki ? `data-nearby-open-wiki="${escapeHtml(card.item.slug)}"` : `data-nearby-open="${escapeHtml(card.item.slug)}"`}>${isWiki ? "Read" : isExternalMapResult ? "Show" : "Open"}</button>
              ${card.capabilities.comment ? `<button type="button" data-learning-discuss="${escapeHtml(card.sourceType)}" data-learning-slug="${escapeHtml(card.item.slug)}">Discuss${commentCount ? ` ${commentCount}` : ""}</button>` : ""}
            </div>
          </div>
        </article>
      `;
    }

    function installLearningFeedObserver(kind, root, loadMore) {
      const observerKey = kind === "timeline" ? "timelineFeedObserver" : "nearbyFeedObserver";
      state[observerKey]?.disconnect?.();
      state[observerKey] = null;
      const sentinel = root?.querySelector?.(`[data-learning-feed-sentinel="${kind}"]`);
      if (!sentinel || typeof IntersectionObserver !== "function") return;
      state[observerKey] = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) loadMore();
      }, { root, rootMargin: "180px 0px", threshold: 0.01 });
      state[observerKey].observe(sentinel);
    }

    function loadMoreNearbyCards() {
      const current = Number(state.nearbyRenderLimit || defaultNearbyRenderLimit());
      if (current >= state.filtered.length) return;
      state.nearbyRenderLimit = Math.min(state.filtered.length, current + NEARBY_LIST_INCREMENT);
      renderList({ preserveScroll: true });
    }

    function renderList(options = {}) {
      const previousScrollTop = options.preserveScroll ? listEl.scrollTop : 0;
      state.nearbyFeedObserver?.disconnect?.();
      state.nearbyFeedObserver = null;
      const count = state.filtered.length;
      const query = activeMobileSearchValue().trim();
      const showingSearch = Boolean(query);
      const showingAddressResults = state.filtered.some(site => site?.slug === "address-result");
      const didYouMean = showingSearch && !state.addressSearchMode ? mobileDidYouMeanSearch(query, state.filtered) : null;
      const renderLimit = Math.max(1, Math.min(count, Number(state.nearbyRenderLimit || defaultNearbyRenderLimit())));
      const visibleCards = state.filtered.slice(0, renderLimit).map((item, index) =>
        nearbyFeedCardModel(item, index, { showingAddressResults })
      );
      appEl?.classList.toggle("mobile-search-results", showingSearch);
      if (listTitleTextEl) listTitleTextEl.textContent = showingSearch ? "Search results" : "Nearby sites";
      statusEl.textContent = state.addressSearchMode
        ? "Searching map..."
        : showingSearch
          ? `${count} result${count === 1 ? "" : "s"} for "${query}"`
          : state.userLocation
            ? `${count} place${count === 1 ? "" : "s"}, sorted by proximity`
            : `${count} place${count === 1 ? "" : "s"}, sorted by name`;
      if (!count) {
        listEl.innerHTML = `
          <div class="site-card empty-state" role="status">
            <span class="site-copy">
              <h2>${state.addressSearchMode ? "Searching the map..." : "No matching sites found"}</h2>
              <p>${state.addressSearchMode && state.addressSearchPending ? `Looking for "${escapeHtml(state.addressSearchPending)}" as a place or business.` : query ? `No local site matched "${escapeHtml(query)}". Try a broader search or a nearby place name.` : "No sites are available for this view."}</p>
              ${didYouMean ? `<button class="action secondary" type="button" data-search-suggestion="${escapeHtml(didYouMean.title)}">Did you mean: ${escapeHtml(didYouMean.title)}</button>` : ""}
            </span>
          </div>
        `;
        renderSearchSuggestions();
        return;
      }
      const hasMore = count > renderLimit;
      listEl.innerHTML = `
        ${visibleCards.map(nearbyFeedCardHtml).join("")}
        ${hasMore ? `
          <div class="learning-feed-more" data-learning-feed-sentinel="nearby">
            <button type="button" data-nearby-show-more>Load more places</button>
            <span>${count - renderLimit} remaining</span>
          </div>
        ` : `<p class="learning-feed-end">End of nearby places</p>`}
      `;
      if (options.preserveScroll) listEl.scrollTop = previousScrollTop;
      state.nearbyScrollTop = listEl.scrollTop;
      installLearningFeedObserver("nearby", listEl, loadMoreNearbyCards);
      renderSearchSuggestions();
    }

    function applyAddressSearchFeature(feature) {
      if (!feature?.center) return false;
      const addressSite = {
        id: "address-result",
        slug: "address-result",
        title: feature.placeName,
        summary: territoryLineForPoint(feature.center) || feature.summary || "Map search result",
        address_label: feature.label || "Search result",
        site_type: "search",
        geojson: { type: "Point", coordinates: feature.center },
        center: feature.center
      };
      if (state.map && window.mapboxgl?.Marker) {
        setAddressMarker(feature.center, feature.placeName);
        state.map.easeTo({ center: feature.center, zoom: Math.max(state.map.getZoom(), 10.8), duration: 650 });
      }
      const nearby = visitableSites()
        .map(site => ({ site, miles: milesBetween(feature.center, site.center) }))
        .filter(item => Number.isFinite(item.miles))
        .sort((a, b) => a.miles - b.miles)
        .slice(0, 40)
        .map(item => ({ ...item.site, _addressDistance: item.miles }));
      state.filtered = [addressSite, ...nearby];
      state.addressSearchMode = false;
      state.addressSearchPending = "";
      resetNearbyRenderLimit();
      renderList();
      syncMarkers();
      return true;
    }

    function handleAndroidSearchBeforeInput(event) {
      if (!isNativeAndroidApp() || !searchEl) return;
      const committed = searchEl.value || "";
      const prior = state.androidImeSearchDraft || committed;
      const text = String(event.data || "");
      if (event.inputType === "deleteContentBackward") {
        state.androidImeSearchDraft = prior.slice(0, -1);
      } else if (event.inputType?.startsWith("insert")) {
        state.androidImeSearchDraft = prior + text;
      } else {
        state.androidImeSearchDraft = committed;
      }
      state.lastAutocompleteQuery = null;
      renderSearchSuggestions(state.androidImeSearchDraft);
    }

    function mobileAutocompleteCandidates(rawQuery) {
      const query = String(rawQuery || "").trim().toLowerCase();
      const normalizedQuery = normalizeText(rawQuery);
      const compactQuery = mobileCompactSearchKey(rawQuery);
      if (!query) return [];
      const includesSearch = item => String(item.searchText || "").includes(query)
        || String(item.normalizedSearchText || "").includes(normalizedQuery)
        || (compactQuery.length >= 2 && (
          mobileCompactSearchKey(item.title || "").includes(compactQuery)
          || mobileCompactSearchKey(item.normalizedSearchText || "").includes(compactQuery)
        ));
      return [
        ...state.sites.filter(includesSearch),
        ...(state.wikiArticles || []).map(mobileWikiSearchResult).filter(includesSearch)
      ].sort((left, right) =>
        mobileSearchResultScore(right, rawQuery) - mobileSearchResultScore(left, rawQuery)
        || String(left.title || "").localeCompare(String(right.title || ""))
      );
    }

    function refreshMobileSearchSuggestions() {
      if (!searchEl) return;
      const value = activeMobileSearchValue();
      schedulePlaceAutocomplete(value);
      if (value === state.lastAutocompleteQuery && state.lastAutocompleteDataVersion === state.searchDataVersion) return;
      state.lastAutocompleteQuery = value;
      state.lastAutocompleteDataVersion = state.searchDataVersion;
      renderSearchSuggestions();
    }

    function mobileSearchResultTypeLabel(value) {
      return String(value || "Map entry")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, character => character.toUpperCase());
    }

    function renderSearchSuggestions(queryOverride = null) {
      if (!searchSuggestionsEl || !searchEl) return;
      const query = String(queryOverride == null ? activeMobileSearchValue() : queryOverride).trim();
      const hide = () => {
        searchSuggestionsEl.hidden = true;
        searchSuggestionsEl.replaceChildren();
        searchEl.setAttribute("aria-expanded", "false");
      };
      if (document.activeElement !== searchEl) return hide();
      // A visitor may start a new search while the results tray is already
      // full-height. Keep type-ahead available there instead of silently
      // hiding it after the first search.
      if (!query) return hide();
      const seen = new Set();
      const localSuggestions = mobileAutocompleteCandidates(query)
        .filter(item => item && item.slug !== "address-result" && item.title)
        .filter(item => {
          const key = String(item.title).trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      const placeSuggestions = query === state.placeAutocompleteQuery ? state.placeAutocompleteResults : [];
      const localLimit = placeSuggestions.length ? Math.min(3, localSuggestions.length) : 5;
      const suggestions = localSuggestions.slice(0, localLimit);
      const visiblePlaces = placeSuggestions.slice(0, Math.max(0, 5 - suggestions.length));
      if (!suggestions.length && !visiblePlaces.length) return hide();
      searchSuggestionsEl.innerHTML = `${suggestions.map(item => `
        <button class="search-suggestion" type="button" role="option" data-search-suggestion="${escapeHtml(item.title)}">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.resultType === "wiki" ? "Knowledgebase" : mobileSearchResultTypeLabel(item.site_type))}</span>
        </button>
      `).join("")}${visiblePlaces.map((item, index) => `
        <button class="search-suggestion place-search-suggestion" type="button" role="option" data-place-suggestion="${index}">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.featureType === "poi" ? "Place or business" : "Long Island map result")}${item.subtitle ? ` · ${escapeHtml(item.subtitle)}` : ""}</span>
        </button>
      `).join("")}`;
      searchSuggestionsEl.hidden = false;
      searchEl.setAttribute("aria-expanded", "true");
    }

    function timelineSortValue(event) {
      const options = {
        fallback: 9999,
        candidates: ["sort_key", "start_year", "date_label", "period"],
        keywordYears: [
          { pattern: /pre.?contact|prehistory|woodland/, value: -1000 },
          { pattern: /contact/, value: 1600 },
          { pattern: /contemporary|present|today|current/, value: 2000 }
        ],
        parseRanges: false,
        yearPattern: /\b(1[5-9]\d{2}|20\d{2})\b/
      };
      const chronological = TIMELINE_UTILS.chronologicalSortValue
        ? TIMELINE_UTILS.chronologicalSortValue(event, { ...options, fallback: NaN })
        : NaN;
      return Number.isFinite(chronological) ? chronological : TIMELINE_UTILS.sortValue(event, options);
    }

    function sortedTimelineEvents() {
      if ((!state.sortedTimelineEvents || !state.sortedTimelineEvents.length) && state.timelineEvents?.length) {
        rebuildSortedTimelineEvents();
      }
      return state.sortedTimelineEvents;
    }

    function visibleMobileTimelineEvents() {
      let events = sortedTimelineEvents().filter(timelineEventPassesMobileEraCategories);
      if (!events.length && window.NLI_MOBILE_DATA?.timelineEvents?.length) {
        if (!state.timelineEvents?.length) state.timelineEvents = window.NLI_MOBILE_DATA.timelineEvents || [];
        rebuildSortedTimelineEvents();
        events = sortedTimelineEvents();
      }
      return events;
    }

    function rebuildSortedTimelineEvents() {
      state.sortedTimelineEvents = [...state.timelineEvents]
        // Keep public source-record moments even when they have no linked
        // site/wiki article.  Their card correctly renders without a dead
        // Full article action, rather than disappearing from the timeline.
        .filter(event => event && (event.title || event.description || event.date_label || event.sort_key))
        .sort((a, b) =>
          timelineSortValue(a) - timelineSortValue(b) ||
          String(a.date_label || "").localeCompare(String(b.date_label || "")) ||
          String(a.title || "").localeCompare(String(b.title || ""))
        );
      state.timelineRandomized = false;
    }

    function timelineLabel(event) {
      return cleanPlainText(TIMELINE_UTILS.rangeLabel(event));
    }

    function timelineTitleLooksWeak(title) {
      const value = cleanPlainText(title || "").trim();
      if (!value) return true;
      const hasAction = /\b(is|are|was|were|became|dies|died|records?|describes?|documented|included|built|opened|closed|signed|founded|connected|lived|served|worked|spoke|held|established|removed|renamed|returned|arrived|departed|occurred|began|ended)\b/i.test(value);
      if (/^(a|an|the|and|or|but|then|there|this|that|where|which|who|in|on|at|to|from|with|for)\b/i.test(value) && value.split(/\s+/).length <= 7 && !hasAction) return true;
      if (/\b(leads to a|leads to an|part of a|located at a|known as a)$/i.test(value)) return true;
      if (!/[A-Z0-9]/.test(value)) return true;
      if (value.split(/\s+/).length <= 8 && !hasAction) return true;
      return false;
    }

    function timelineTitle(event) {
      const headline = cleanPlainText(event.timeline_headline || "");
      if (headline) return headline;
      const title = cleanPlainText(event.title || "");
      if (!timelineTitleLooksWeak(title)) return title;
      if (event.description || event.summary) {
        const descriptionHeadline = timelineTeaser(event);
        if (descriptionHeadline) return descriptionHeadline;
      }
      if (title) return title.replace(/^([a-z])/, (_, character) => character.toUpperCase());
      const source = cleanPlainText(event.source_title || "");
      const section = cleanPlainText(event.source_section || "");
      const date = timelineLabel(event);
      if (source && date && date !== "Historic moment") return `${date} at ${source}`;
      if (source && section && !/^history$/i.test(section)) return `${source}: ${section}`;
      if (source) return `${source} historic moment`;
      const description = cleanPlainText(event.description || event.summary || "");
      if (description) return description.length > 90 ? `${description.slice(0, 87).trim()}...` : description;
      return "Historic moment";
    }

    function timelineTeaser(event) {
      return TIMELINE_UTILS.teaser(event, {
        cleanText: cleanPlainText,
        limit: 180,
        fallback: "Use Map to see the place or Full article to read the related entry."
      });
    }

    function timelineDisplayDescription(event) {
      return TIMELINE_UTILS.displayDescription(event);
    }

    function timelineSourceText(event) {
      return TIMELINE_UTILS.sourceText(event, { cleanText: cleanPlainText });
    }

    function timelineLocationLabel(event = {}) {
      return TIMELINE_UTILS.locationLabel(event, { cleanText: cleanPlainText });
    }

    function closeTimelineSourceReferences(scope = document) {
      scope.querySelectorAll?.(".timeline-current.show-source, .timeline-item.show-source, .timeline-feed-card.show-source, .section.has-source.show-source")
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

    function smoothTimelineMapOptions(options = {}) {
      return {
        duration: 5200,
        essential: true,
        easing: t => 0.5 - Math.cos(Math.PI * t) / 2,
        ...options
      };
    }

    function mobileTimelineCardImage(event, contentTarget) {
      if (contentTarget?.type === "site") {
        return {
          imageUrl: mobileSnapshotImageUrl(listingImage(contentTarget.record)),
          imageFallbackUrl: mobileSnapshotImageUrl(listingImageFallback(contentTarget.record))
        };
      }
      if (contentTarget?.type === "calendar_event") {
        const relatedSite = mobileTimelineExhibitSite(contentTarget.record);
        return {
          imageUrl: mobileSnapshotImageUrl(directusAssetUrl(contentTarget.record?.cover_image) || (relatedSite ? listingImage(relatedSite) : "")),
          imageFallbackUrl: mobileSnapshotImageUrl(relatedSite ? listingImageFallback(relatedSite) : "")
        };
      }
      return {
        imageUrl: mobileSnapshotImageUrl(directusAssetUrl(event.cover_image || event.image || event.featured_image)),
        imageFallbackUrl: ""
      };
    }

    function mobileCoordinatePair(longitudeValue, latitudeValue) {
      const longitudeText = String(longitudeValue ?? "").trim();
      const latitudeText = String(latitudeValue ?? "").trim();
      if (!longitudeText || !latitudeText) return null;
      const longitude = Number(longitudeText);
      const latitude = Number(latitudeText);
      return Number.isFinite(longitude) && Number.isFinite(latitude) ? [longitude, latitude] : null;
    }

    function mobileTimelineCardCoordinates(event, contentTarget) {
      if (contentTarget?.type === "site" && Array.isArray(contentTarget.record?.center)) {
        return mobileCoordinatePair(contentTarget.record.center[0], contentTarget.record.center[1]);
      }
      if (contentTarget?.type === "calendar_event") {
        if (Array.isArray(contentTarget.record?.center)) {
          return mobileCoordinatePair(contentTarget.record.center[0], contentTarget.record.center[1]);
        }
        const relatedSite = mobileTimelineExhibitSite(contentTarget.record);
        if (Array.isArray(relatedSite?.center)) {
          return mobileCoordinatePair(relatedSite.center[0], relatedSite.center[1]);
        }
      }
      return mobileCoordinatePair(event.longitude, event.latitude);
    }

    function mobileTimelineFeedCardModel(event, index) {
      const contentTarget = mobileTimelineContentTarget(event);
      const image = mobileTimelineCardImage(event, contentTarget);
      const sourceType = ["site", "wiki"].includes(contentTarget?.type) ? contentTarget.type : "";
      const targetRecord = contentTarget?.record || null;
      const coordinates = mobileTimelineCardCoordinates(event, contentTarget);
      const sourceName = cleanPlainText(event.source_title || targetRecord?.title || "Historic record");
      const sourceNote = timelineSourceText(event);
      const excerpt = cleanPlainText(
        timelineDisplayDescription(event) ||
        event.excerpt ||
        event.summary ||
        targetRecord?.summary ||
        timelineTeaser(event)
      );
      const card = normalizeMobileLearningCard({
        id: event.id,
        type: "historic-moment",
        title: timelineTitle(event),
        sourceName,
        date: timelineLabel(event),
        imageUrl: image.imageUrl,
        imageFallbackUrl: image.imageFallbackUrl,
        excerpt,
        target: contentTarget
          ? { type: contentTarget.type, id: targetRecord?.id, slug: targetRecord?.slug }
          : null,
        map: coordinates
          ? { itemType: contentTarget?.type || "historic-moment", itemId: targetRecord?.id || event.id, slug: targetRecord?.slug || "", coordinates }
          : null,
        counts: { comments: sourceType ? learningCardCommentCount(sourceType, targetRecord) : 0 },
        capabilities: {
          open: Boolean(contentTarget),
          map: Boolean(coordinates),
          comment: Boolean(sourceType)
        },
        permissions: { loggedIn: Boolean(currentContributorProfile()) }
      }, { excerptLimit: 700 });
      return {
        ...card,
        event,
        index,
        contentTarget,
        targetRecord,
        sourceType,
        sourceNote,
        location: timelineLocationLabel(event),
        tags: [event.period, event.source_section].filter(Boolean)
      };
    }

    function mobileTimelineFeedCardHtml(card) {
      const eventId = String(card.event.id || card.id || card.index);
      const commentCount = Number(card.counts?.comments || 0);
      const mediaAction = card.capabilities.open
        ? `data-timeline-open="${escapeHtml(eventId)}"`
        : card.capabilities.map
          ? `data-timeline-map="${escapeHtml(eventId)}"`
          : "";
      return `
        <article class="learning-card timeline-feed-card" data-timeline-id="${escapeHtml(eventId)}" data-timeline-index="${escapeHtml(card.index)}" data-learning-card-key="${escapeHtml(card.key)}">
          ${learningCardImageHtml(card, mediaAction, card.event.image_alt || "", { hideWhenMissing: true })}
          <div class="learning-card-body">
            <div class="learning-card-meta">
              <strong>${escapeHtml(card.date)}</strong>
              ${card.location ? `<span>${escapeHtml(card.location)}</span>` : ""}
            </div>
            <h2><button type="button" data-timeline-open="${escapeHtml(eventId)}">${escapeHtml(card.title)}</button></h2>
            <div class="timeline-source-row">
              <span class="source">${escapeHtml(card.sourceName)}</span>
              ${card.sourceNote ? `<button class="timeline-source-info" type="button" data-timeline-source-info data-source-reference="${escapeHtml(card.sourceNote)}" aria-label="Show source reference" aria-expanded="false" title="${escapeHtml(card.sourceNote)}">i</button>` : ""}
            </div>
            ${card.sourceNote ? `<div class="timeline-source-popover"><span>${HTML_UTILS.sourceReferenceTextHtml(card.sourceNote, { escapeHtml })}</span><span class="timeline-source-copy-hint">Source reference.</span></div>` : ""}
            ${learningCardTagsHtml(card.tags)}
            ${learningCardExcerptHtml(card)}
            <div class="learning-card-actions">
              ${card.capabilities.map ? `<button type="button" data-timeline-map="${escapeHtml(eventId)}">Map</button>` : ""}
              ${card.capabilities.open ? `<button class="primary" type="button" data-timeline-open="${escapeHtml(eventId)}">Read</button>` : ""}
              ${card.capabilities.comment ? `<button type="button" data-learning-discuss="${escapeHtml(card.sourceType)}" data-learning-slug="${escapeHtml(card.targetRecord?.slug || "")}">Discuss${commentCount ? ` ${commentCount}` : ""}</button>` : ""}
            </div>
          </div>
        </article>
      `;
    }

    function mobileTimelineScrubberLabel(event, index, total) {
      const date = event ? timelineLabel(event) : "Beginning";
      return `${date || "Historic moment"} - ${index + 1} of ${total}`;
    }

    function ensureMobileTimelineScrubberScale() {
      if (!mobileTimelineScrubberScaleEl || mobileTimelineScrubberScaleEl.childElementCount) return;
      const tickCount = 27;
      mobileTimelineScrubberScaleEl.innerHTML = `${Array.from({ length: tickCount }, (_, index) => (
        `<span class="mobile-timeline-scrubber-tick" data-timeline-scrubber-tick="${index}"></span>`
      )).join("")}<span class="mobile-timeline-scrubber-cursor"></span>`;
    }

    function renderMobileTimelineScrubberScale(progress = 0) {
      if (!mobileTimelineScrubberEl || !mobileTimelineScrubberScaleEl) return;
      ensureMobileTimelineScrubberScale();
      const focus = Math.max(0, Math.min(1, Number(progress) || 0));
      const ticks = [...mobileTimelineScrubberScaleEl.querySelectorAll("[data-timeline-scrubber-tick]")];
      ticks.forEach((tick, index) => {
        const position = ticks.length > 1 ? index / (ticks.length - 1) : 0;
        const distance = Math.abs(position - focus);
        const influence = Math.pow(Math.max(0, 1 - Math.min(1, distance / 0.48)), 1.45);
        tick.style.setProperty("--timeline-tick-top", `${Math.round(position * 1000) / 10}%`);
        tick.style.setProperty("--timeline-tick-width", `${Math.round(5 + (34 * influence))}px`);
        tick.style.setProperty("--timeline-tick-opacity", String((0.24 + (0.7 * influence)).toFixed(2)));
      });
      mobileTimelineScrubberEl.style.setProperty("--timeline-scrubber-progress", `${Math.round(focus * 1000) / 10}%`);
    }

    function syncMobileTimelineScrubber(index = state.timelineScrubberIndex, events = visibleMobileTimelineEvents()) {
      if (!mobileTimelineScrubberEl || !mobileTimelineScrubberRangeEl || !mobileTimelineScrubberLabelEl) return;
      const total = events.length;
      mobileTimelineScrubberEl.hidden = total < 2;
      if (total < 2) return;
      const targetIndex = Math.max(0, Math.min(total - 1, Number(index) || 0));
      state.timelineScrubberIndex = targetIndex;
      mobileTimelineScrubberRangeEl.max = String(total - 1);
      mobileTimelineScrubberRangeEl.value = String(targetIndex);
      mobileTimelineScrubberRangeEl.setAttribute("aria-valuetext", mobileTimelineScrubberLabel(events[targetIndex], targetIndex, total));
      mobileTimelineScrubberLabelEl.textContent = mobileTimelineScrubberLabel(events[targetIndex], targetIndex, total);
      const progress = total > 1 ? targetIndex / (total - 1) : 0;
      mobileTimelineScrubberEl.style.setProperty("--timeline-scrubber-label-top", `calc(${Math.round(progress * 100)}% - ${Math.round(progress * 34)}px)`);
      renderMobileTimelineScrubberScale(progress);
    }

    function jumpMobileTimelineToIndex(index) {
      const events = visibleMobileTimelineEvents();
      if (!events.length) return;
      const targetIndex = Math.max(0, Math.min(events.length - 1, Number(index) || 0));
      const windowSize = Math.min(events.length, TIMELINE_SCRUBBER_WINDOW);
      state.timelineWindowStart = Math.max(0, Math.min(targetIndex - 5, events.length - windowSize));
      state.timelineRenderLimit = windowSize;
      state.timelineScrubberIndex = targetIndex;
      state.timelineLastRenderedScrubberIndex = targetIndex;
      renderMobileTimeline({ jumpIndex: targetIndex });
    }

    function scheduleMobileTimelineJump(index, immediate = false) {
      const targetIndex = Number(index) || 0;
      syncMobileTimelineScrubber(targetIndex);
      state.timelineScrubberPendingIndex = targetIndex;
      if (immediate) {
        window.clearTimeout(state.timelineScrubberJumpTimer);
        state.timelineScrubberJumpTimer = null;
        jumpMobileTimelineToIndex(targetIndex);
        return;
      }
      if (state.timelineScrubberJumpTimer) return;
      state.timelineScrubberJumpTimer = window.setTimeout(() => {
        state.timelineScrubberJumpTimer = null;
        const pendingIndex = Number(state.timelineScrubberPendingIndex) || 0;
        const lastRendered = Number(state.timelineLastRenderedScrubberIndex) || 0;
        if (Math.abs(pendingIndex - lastRendered) >= 3) jumpMobileTimelineToIndex(pendingIndex);
      }, 32);
    }

    function mobileTimelineScrubberIndexAtClientY(clientY) {
      if (!mobileTimelineScrubberEl || !mobileTimelineScrubberRangeEl) return 0;
      const bounds = mobileTimelineScrubberEl.getBoundingClientRect();
      const height = Math.max(1, bounds.height);
      const progress = Math.max(0, Math.min(1, (Number(clientY) - bounds.top) / height));
      const maximum = Math.max(0, Number(mobileTimelineScrubberRangeEl.max) || 0);
      return Math.round(progress * maximum);
    }

    function updateMobileTimelineScrubberFromPointer(event, immediate = false) {
      const targetIndex = mobileTimelineScrubberIndexAtClientY(event.clientY);
      scheduleMobileTimelineJump(targetIndex, immediate);
    }

    function loadEarlierMobileTimeline() {
      const previousStart = Math.max(0, Number(state.timelineWindowStart) || 0);
      if (!previousStart) return;
      const nextStart = Math.max(0, previousStart - TIMELINE_FEED_INCREMENT);
      state.timelineWindowStart = nextStart;
      state.timelineRenderLimit += previousStart - nextStart;
      renderMobileTimeline({ preserveScroll: true, preserveEventIndex: previousStart });
    }

    function loadMoreMobileTimeline() {
      const events = visibleMobileTimelineEvents();
      const start = Math.max(0, Number(state.timelineWindowStart) || 0);
      const current = Number(state.timelineRenderLimit || TIMELINE_FEED_INITIAL_LIMIT);
      if (start + current >= events.length) return;
      state.timelineRenderLimit = Math.min(events.length - start, current + TIMELINE_FEED_INCREMENT);
      renderMobileTimeline({ preserveScroll: true });
    }

    function renderMobileTimeline(options = {}) {
      if (!mobileTimelineCurrentBtn) return;
      state.mobileTimelineRendered = true;
      const previousScrollTop = options.preserveScroll ? mobileTimelineCurrentBtn.scrollTop : state.timelineScrollTop;
      state.timelineFeedObserver?.disconnect?.();
      state.timelineFeedObserver = null;
      const events = visibleMobileTimelineEvents();
      const signature = events.map(event => String(event.id || "")).join("|");
      if (signature !== state.timelineFeedSignature) {
        state.timelineFeedSignature = signature;
        state.timelineRenderLimit = TIMELINE_FEED_INITIAL_LIMIT;
        state.timelineWindowStart = 0;
        state.timelineScrubberIndex = 0;
      }
      if (!events.length) {
        const loading = state.deferredDataLoading || !state.deferredDataLoaded;
        mobileTimelineCurrentBtn.innerHTML = `
          <div class="learning-feed-empty" role="status">
            <strong>${loading ? "Loading historic moments..." : "No historic moments available"}</strong>
            <span>${loading ? "Timeline records are being prepared." : "Historic records will appear here when available."}</span>
          </div>
        `;
        if (mobileTimelineStatusEl) mobileTimelineStatusEl.textContent = loading ? "Loading..." : "No moments";
        if (mobileTimelineScrubberEl) mobileTimelineScrubberEl.hidden = true;
        return;
      }
      const windowStart = Math.max(0, Math.min(events.length - 1, Number(state.timelineWindowStart) || 0));
      const renderLimit = Math.max(1, Math.min(events.length - windowStart, Number(state.timelineRenderLimit || TIMELINE_FEED_INITIAL_LIMIT)));
      const windowEnd = windowStart + renderLimit;
      const cards = events.slice(windowStart, windowEnd).map((event, index) => mobileTimelineFeedCardModel(event, windowStart + index));
      const hasEarlier = windowStart > 0;
      const hasMore = windowEnd < events.length;
      mobileTimelineCurrentBtn.innerHTML = `
        ${hasEarlier ? `
          <div class="learning-feed-more is-earlier">
            <button type="button" data-timeline-show-earlier>Load earlier moments</button>
            <span>${windowStart} before this point</span>
          </div>
        ` : ""}
        ${cards.map(mobileTimelineFeedCardHtml).join("")}
        ${hasMore ? `
          <div class="learning-feed-more" data-learning-feed-sentinel="timeline">
            <button type="button" data-timeline-show-more>Load more moments</button>
            <span>${events.length - windowEnd} remaining</span>
          </div>
        ` : `<p class="learning-feed-end">End of historic timeline</p>`}
      `;
      if (mobileTimelineStatusEl) mobileTimelineStatusEl.textContent = `Showing ${windowStart + 1}-${windowEnd} of ${events.length}`;
      if (Number.isFinite(options.jumpIndex)) {
        const targetCard = mobileTimelineCurrentBtn.querySelector(`[data-timeline-index="${options.jumpIndex}"]`);
        mobileTimelineCurrentBtn.scrollTop = targetCard ? Math.max(0, targetCard.offsetTop - mobileTimelineCurrentBtn.offsetTop - 8) : 0;
      } else if (Number.isFinite(options.preserveEventIndex)) {
        const preservedCard = mobileTimelineCurrentBtn.querySelector(`[data-timeline-index="${options.preserveEventIndex}"]`);
        mobileTimelineCurrentBtn.scrollTop = preservedCard ? Math.max(0, preservedCard.offsetTop - mobileTimelineCurrentBtn.offsetTop - 8) : Math.max(0, previousScrollTop || 0);
      } else {
        mobileTimelineCurrentBtn.scrollTop = Math.max(0, previousScrollTop || 0);
      }
      state.timelineScrollTop = mobileTimelineCurrentBtn.scrollTop;
      syncMobileTimelineScrubber(Number.isFinite(options.jumpIndex) ? options.jumpIndex : state.timelineScrubberIndex, events);
      installLearningFeedObserver("timeline", mobileTimelineCurrentBtn, loadMoreMobileTimeline);
    }

    function mobileTimelineExhibitSite(exhibit = {}) {
      const slug = exhibit.related_site_slug || exhibit.source_slug || "";
      return slug ? state.sites.find(item => item.slug === slug) || null : null;
    }

    function mobileTimelineContentTarget(event = {}) {
      return TIMELINE_UTILS.contentTarget(event, {
        siteById: state.siteById,
        siteBySlug: state.siteBySlug,
        wikiById: state.wikiById,
        wikiBySlug: state.wikiBySlug,
        calendarById: state.eventById,
        calendarBySlug: state.eventBySlug
      });
    }

    function mobileTimelineHasMapTarget(event = {}) {
      const target = mobileTimelineContentTarget(event);
      return Boolean(mobileTimelineCardCoordinates(event, target));
    }

    function focusMobileTimelineEvent(event) {
      if (!event) return;
      const target = mobileTimelineContentTarget(event);
      const exhibit = target?.type === "calendar_event" ? target.record : null;
      if (exhibit) {
        const site = mobileTimelineExhibitSite(exhibit);
        if (site) {
          state.selectedSlug = site.slug;
          state.selectedSite = site;
          syncActiveSiteMapLabel(site);
          focusSite(site, { timeline: true });
          window.setTimeout(() => animateMobileSiteMarker(site), 2400);
          showBanner(event.source_title || site.title || "Exhibit located on the map.");
          return;
        }
        if (Array.isArray(exhibit.center) && state.map) {
          state.map.easeTo(smoothTimelineMapOptions({ center: exhibit.center, zoom: 11.2 }));
          window.setTimeout(() => pulseTimelineMapTarget(exhibit.center), 2400);
          showBanner(event.source_title || exhibit.title || "Exhibit located on the map.");
          return;
        }
      }
      const site = target?.type === "site" ? target.record : null;
      if (site) {
        state.selectedSlug = site.slug;
        state.selectedSite = site;
        syncActiveSiteMapLabel(site);
        focusSite(site, { timeline: true });
        window.setTimeout(() => animateMobileSiteMarker(site), 2400);
        showBanner(event.source_title || site.title || "Site located on the map.");
        return;
      }
      if (event.latitude && event.longitude && state.map) {
        const coordinates = [Number(event.longitude), Number(event.latitude)];
        state.map.easeTo(smoothTimelineMapOptions({ center: coordinates, zoom: 11.2 }));
        window.setTimeout(() => pulseTimelineMapTarget(coordinates), 2400);
        showBanner(event.source_title || event.title || "Historic moment located on the map.");
        return;
      }
      showBanner(event.source_title || event.title || "This moment does not have a mapped place yet.");
    }

    function animateMobileSiteMarker(site) {
      if (!site?.slug) return;
      const marker = state.markers.get(site.slug);
      const element = marker?.getElement?.();
      if (!element) return;
      element.classList.remove("mobile-marker-focus");
      void element.offsetWidth;
      element.classList.add("mobile-marker-focus");
      window.setTimeout(() => element.classList.remove("mobile-marker-focus"), 700);
    }

    function pulseTimelineMapTarget(coordinates) {
      if (!state.map || !Array.isArray(coordinates) || !window.mapboxgl?.Marker) return;
      const el = document.createElement("div");
      el.className = "timeline-map-pulse";
      const marker = new mapboxgl.Marker({ element: el }).setLngLat(coordinates).addTo(state.map);
      window.setTimeout(() => marker.remove(), 1800);
    }

    function openMobileTimelineEvent(event) {
      if (!event) return;
      const target = mobileTimelineContentTarget(event);
      if (target?.type === "calendar_event") {
        openExhibit(target.record);
        return;
      }
      if (target?.type === "site") {
        openSite(target.record.slug);
        return;
      }
      if (target?.type === "wiki") {
        openWikiArticle(target.record.slug, { timelineEventId: event.id, timelineEvent: event });
        return;
      }
      if (event.latitude && event.longitude) {
        focusMobileTimelineEvent(event);
        showBanner("This timeline moment has a map location but no full article yet.");
        return;
      }
      showBanner(event.source_title ? `${event.source_title} is not available in the mobile app yet.` : "This moment does not have a mobile article yet.");
    }

    function setMobilePanelMode(mode) {
      const next = mode === "timeline" ? "timeline" : "nearby";
      if (appEl?.classList.contains("panel-timeline")) state.timelineScrollTop = mobileTimelineCurrentBtn?.scrollTop || 0;
      if (appEl?.classList.contains("panel-nearby")) state.nearbyScrollTop = listEl?.scrollTop || 0;
      appEl?.classList.toggle("panel-timeline", next === "timeline");
      appEl?.classList.toggle("panel-nearby", next === "nearby");
      mobileTabTimelineBtn?.setAttribute("aria-pressed", String(next === "timeline"));
      mobileTabNearbyBtn?.setAttribute("aria-pressed", String(next === "nearby"));
      if (next === "timeline" && !state.mobileTimelineRendered) renderMobileTimeline();
      mobileTimelineEl?.setAttribute("aria-hidden", String(next !== "timeline" || state.mobilePanelState === "collapsed"));
      listPanelEl?.setAttribute("aria-hidden", String(next !== "nearby" || state.mobilePanelState === "collapsed"));
      window.requestAnimationFrame(() => {
        if (next === "timeline" && mobileTimelineCurrentBtn) mobileTimelineCurrentBtn.scrollTop = state.timelineScrollTop || 0;
        if (next === "nearby" && listEl) listEl.scrollTop = state.nearbyScrollTop || 0;
      });
      try {
        localStorage.setItem("nli-mobile-panel-mode", next);
      } catch {}
      window.setTimeout(() => state.map?.resize?.(), 80);
    }

    function selectMobilePanelTab(mode) {
      const openFull = state.mobilePanelState === "collapsed";
      setMobilePanelMode(mode);
      if (openFull) setMobileBottomPanelState("maximized");
    }

    function normalizeMobilePanelState(value) {
      if (value === "collapsed" || value === "maximized") return value;
      return "normal";
    }

    function restoreMobileBottomPanelState() {
      let saved = "normal";
      try {
        saved = localStorage.getItem(MOBILE_PANEL_STATE_KEY) || "";
        if (!saved) {
          const legacy = localStorage.getItem("nli-nearby-panel-state");
          saved = legacy === "hidden" || legacy === "collapsed"
            ? "collapsed"
            : legacy === "expanded" || localStorage.getItem("nli-nearby-expanded") === "1"
              ? "maximized"
              : "normal";
        }
      } catch {}
      setMobileBottomPanelState(saved, { persist: false });
    }

    function setMobileBottomPanelState(nextState, options = {}) {
      const panelState = normalizeMobilePanelState(nextState);
      const previous = state.mobilePanelState;
      if (panelState !== "collapsed") state.mobilePanelPreviousOpenState = panelState;
      else if (previous && previous !== "collapsed") state.mobilePanelPreviousOpenState = previous;
      state.mobilePanelState = panelState;
      if (panelState === "maximized") {
        document.querySelector(".mobile-more-menu[open]")?.removeAttribute("open");
        document.querySelector(".mobile-layer-menu[open]")?.removeAttribute("open");
        hideMobileStartupSpotlight();
        hideQuoteSelectionPopup();
        closeTimelineSourceReferences(document);
      }
      appEl?.classList.remove(
        "timeline-hidden",
        "nearby-hidden",
        "nearby-expanded",
        "list-collapsed",
        "list-expanded",
        "panel-collapsed",
        "panel-normal",
        "panel-maximized"
      );
      listPanelEl?.classList.remove("collapsed", "expanded");
      appEl?.style.removeProperty("--map-height");
      appEl?.classList.add(`panel-${panelState}`);
      const mode = appEl?.classList.contains("panel-timeline") ? "timeline" : "nearby";
      mobileTimelineEl?.setAttribute("aria-hidden", String(mode !== "timeline" || panelState === "collapsed"));
      listPanelEl?.setAttribute("aria-hidden", String(mode !== "nearby" || panelState === "collapsed"));
      if (collapseListBtn) {
        const collapsed = panelState === "collapsed";
        collapseListBtn.hidden = panelState === "maximized";
        collapseListBtn.textContent = collapsed ? "Open" : "Collapse";
        collapseListBtn.setAttribute("aria-label", collapsed ? "Open bottom panel" : "Collapse bottom panel");
        collapseListBtn.setAttribute("aria-expanded", String(!collapsed));
      }
      if (mobilePanelSizeBtn) {
        const maximized = panelState === "maximized";
        mobilePanelSizeBtn.textContent = maximized ? "Map view" : "Full";
        mobilePanelSizeBtn.setAttribute("aria-label", maximized ? "Return to the map and bottom panel" : "Open full-screen bottom panel");
        mobilePanelSizeBtn.setAttribute("aria-expanded", String(maximized));
      }
      if (options.persist !== false) {
        try {
          localStorage.setItem(MOBILE_PANEL_STATE_KEY, panelState);
        } catch {}
      }
      window.setTimeout(() => state.map?.resize?.(), 90);
    }

    function setNearbyExpanded(expanded) {
      setMobileBottomPanelState(expanded ? "maximized" : "normal");
    }

    function restoreNearbyPanelHeight() {
      restoreMobileBottomPanelState();
    }

    function setNearbyPanelState(nextState) {
      if (nextState === "hidden" || nextState === "collapsed") {
        setMobileBottomPanelState("collapsed");
      } else if (nextState === "expanded") {
        setMobileBottomPanelState("maximized");
      } else {
        setMobileBottomPanelState("normal");
      }
    }

    function collapseNearbyPanelForSiteOpen() {
      if (state.mobilePanelState === "maximized") setMobileBottomPanelState("normal");
    }

    function openNearbySiteWithMapPreview(slug) {
      const site = state.sites.find(item => item.slug === slug);
      if (!site) return;
      window.clearTimeout(state.nearbySiteOpenTimer);
      const token = ++state.nearbySiteOpenToken;
      state.selectedSlug = site.slug;
      state.selectedSite = site;
      syncActiveSiteMapLabel(site);
      renderList();
      collapseNearbyPanelForSiteOpen();
      if (!state.map || !site.center) {
        openSite(slug);
        return;
      }
      let opened = false;
      const openAfterMapMove = () => {
        if (opened || token !== state.nearbySiteOpenToken) return;
        opened = true;
        window.clearTimeout(state.nearbySiteOpenTimer);
        openSite(slug, { focus: false });
      };
      if (typeof state.map.once === "function") state.map.once("moveend", openAfterMapMove);
      focusSite(site, { duration: 1150, preview: true });
      animateMobileSiteMarker(site);
      state.nearbySiteOpenTimer = window.setTimeout(openAfterMapMove, 1350);
    }

    function installMobileBottomPanelDrag() {
      const handles = [mobileTimelineEl?.querySelector(".mobile-feed-head"), listPanelEl?.querySelector(".list-head")].filter(Boolean);
      handles.forEach(handle => {
        let startY = 0;
        let dragging = false;
        let didDrag = false;
        const finish = event => {
          if (!dragging) return;
          const delta = (event?.clientY ?? startY) - startY;
          dragging = false;
          appEl?.classList.remove("mobile-panel-dragging");
          if (!didDrag || Math.abs(delta) < 28) return;
          if (delta < 0) {
            setMobileBottomPanelState("maximized");
          } else if (state.mobilePanelState === "maximized") {
            setMobileBottomPanelState("normal");
          } else {
            setMobileBottomPanelState("collapsed");
          }
        };
        handle.addEventListener("pointerdown", event => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          if (event.target.closest("button, a, input, select, textarea, summary")) return;
          startY = event.clientY;
          dragging = true;
          didDrag = false;
          appEl?.classList.add("mobile-panel-dragging");
          handle.setPointerCapture?.(event.pointerId);
        });
        handle.addEventListener("pointermove", event => {
          if (!dragging) return;
          if (Math.abs(event.clientY - startY) > 8) didDrag = true;
        });
        handle.addEventListener("pointerup", finish);
        handle.addEventListener("pointercancel", () => {
          dragging = false;
          appEl?.classList.remove("mobile-panel-dragging");
        });
      });
    }

    function installNearbyPanelDrag() {
      installMobileBottomPanelDrag();
    }

    function detailDrawerLimits() {
      const viewport = Math.max(window.innerHeight || 0, 420);
      const reserved = cssPixelValue("--app-top-safe", 0) + cssPixelValue("--app-bottom-safe", 0);
      const max = Math.max(240, viewport - reserved - 12);
      return {
        collapsed: Math.min(max, Math.max(190, Math.round(viewport * 0.34))),
        half: Math.min(max, Math.max(270, Math.round(viewport * 0.58))),
        expanded: Math.min(max, Math.max(340, Math.round(viewport * 0.86)))
      };
    }

    function setDetailDrawerState(stateName = "half", options = {}) {
      if (!detailEl) return;
      const cleanState = ["collapsed", "half", "expanded"].includes(stateName) ? stateName : "half";
      detailEl.classList.remove("drawer-collapsed", "drawer-half", "drawer-expanded");
      detailEl.classList.add(`drawer-${cleanState}`);
      if (!options.keepInlineHeight) detailEl.style.removeProperty("--detail-drawer-height");
      detailDrawerHandleEl?.setAttribute("aria-expanded", cleanState === "expanded" ? "true" : "false");
      detailDrawerHandleEl?.setAttribute("aria-label", cleanState === "expanded" ? "Reduce listing drawer height" : "Adjust listing drawer height");
      window.requestAnimationFrame(() => state.map?.resize?.());
    }

    function nearestDetailDrawerState(height) {
      const limits = detailDrawerLimits();
      return Object.entries(limits)
        .sort((a, b) => Math.abs(a[1] - height) - Math.abs(b[1] - height))[0]?.[0] || "half";
    }

    function cycleDetailDrawerState() {
      if (!detailEl?.classList.contains("open")) return;
      const next = detailEl.classList.contains("drawer-collapsed")
        ? "half"
        : detailEl.classList.contains("drawer-half")
          ? "expanded"
          : "collapsed";
      setDetailDrawerState(next);
    }

    function installDetailPanelDrag() {
      if (!detailEl || !detailBodyEl) return;
      let startY = 0;
      let startHeight = 0;
      let latestHeight = 0;
      let dragging = false;
      let armed = false;
      let touchIdentifier = null;

      const reset = () => {
        dragging = false;
        armed = false;
        touchIdentifier = null;
        detailEl.classList.remove("dragging");
        detailEl.style.transform = "";
      };

      const canStartDrag = target => {
        if (!detailEl.classList.contains("open")) return false;
        if (target.closest(".detail-drawer-handle")) return true;
        if (target.closest("button, a, input, select, textarea, summary, img, iframe")) return false;
        return Boolean(target.closest(".detail-head"));
      };

      const movePanel = clientY => {
        const deltaY = clientY - startY;
        const limits = detailDrawerLimits();
        latestHeight = Math.min(limits.expanded, Math.max(limits.collapsed * 0.66, startHeight - deltaY));
        dragging = Math.abs(deltaY) > 6;
        if (dragging) {
          detailEl.classList.add("dragging");
          detailEl.style.setProperty("--detail-drawer-height", `${Math.round(latestHeight)}px`);
        }
      };

      const finishDrag = () => {
        if (!armed) return;
        const limits = detailDrawerLimits();
        const shouldClose = dragging && latestHeight < limits.collapsed * 0.78;
        const snapState = nearestDetailDrawerState(latestHeight || startHeight);
        reset();
        if (shouldClose) closeDetail();
        else setDetailDrawerState(snapState);
      };

      detailEl.addEventListener("pointerdown", event => {
        if (event.pointerType === "touch") return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (!canStartDrag(event.target)) return;
        armed = true;
        dragging = false;
        startY = event.clientY;
        startHeight = detailEl.getBoundingClientRect().height || detailDrawerLimits().half;
        latestHeight = startHeight;
        detailEl.setPointerCapture?.(event.pointerId);
      });

      detailEl.addEventListener("pointermove", event => {
        if (!armed) return;
        movePanel(event.clientY);
        if (dragging) event.preventDefault();
      });

      detailEl.addEventListener("pointerup", finishDrag);
      detailEl.addEventListener("pointercancel", reset);

      detailEl.addEventListener("touchstart", event => {
        if (event.touches.length !== 1) return;
        if (!canStartDrag(event.target)) return;
        const touch = event.touches[0];
        touchIdentifier = touch.identifier;
        armed = true;
        dragging = false;
        startY = touch.clientY;
        startHeight = detailEl.getBoundingClientRect().height || detailDrawerLimits().half;
        latestHeight = startHeight;
      }, { passive: true });

      detailEl.addEventListener("touchmove", event => {
        if (!armed || touchIdentifier === null) return;
        const touch = [...event.changedTouches].find(item => item.identifier === touchIdentifier) || event.touches[0];
        if (!touch) return;
        movePanel(touch.clientY);
        if (dragging) event.preventDefault();
      }, { passive: false });

      detailEl.addEventListener("touchend", finishDrag, { passive: true });
      detailEl.addEventListener("touchcancel", reset, { passive: true });
      detailDrawerHandleEl?.addEventListener("click", event => {
        if (dragging) return;
        event.preventDefault();
        cycleDetailDrawerState();
      });
    }

    function mobilePolygonOpacity(site) {
      if (site?.slug === "shinnecock-ancestral-land") return 0.38;
      const fallback = isBroadTerritory(site) ? 0.18 : 0.2;
      const sourceOpacity = numeric(site.map_opacity, fallback);
      return Math.max(0.08, Math.min(isBroadTerritory(site) ? 0.22 : 0.26, sourceOpacity * 0.55));
    }

    function siteFeatureCollection(sites = state.mapSites) {
      return {
        type: "FeatureCollection",
        features: sites.map(site => ({
          type: "Feature",
          geometry: siteDisplayGeometry(site),
          properties: {
            id: site.id,
            slug: site.slug,
            title: site.title,
            site_type: site.site_type,
            color: site.site_type === "territory" ? "#496f5d" : "#b27d3f",
            location_accuracy: SITE_UTILS.siteLocationAccuracy(site),
            layer_categories: SITE_UTILS.siteLayerCategoryKeys(site).join(" "),
            fillcolor: siteTerritoryFillColor(site, isBroadTerritory(site) ? "#496f5d" : "#7b9b68"),
            opacity: mobilePolygonOpacity(site),
            label_size: polygonLabelSize(site),
            has_header_image: siteHasHeaderImage(site),
            has_icon: !!siteMapIconUrl(site),
            icon_key: mobileSiteIconKey(site),
            broad: isBroadTerritory(site),
            territory_label_point: site.territory_label_point || null,
            bounds_area: geometryBoundsArea(siteDisplayGeometry(site))
          }
        }))
      };
    }

    function mobilePlaceNameAreaFeatures(sites = []) {
      if (state.settings.showShapes === false) return [];
      if (state.settings.layerCategories?.["place-name-areas"] === false) return [];
      const activeBySlug = new Map((sites || []).map(site => [site.slug, site]));
      const activeCategories = activeMobileLayerCategories();
      return (state.placeNameAreas?.features || [])
        .filter(feature => activeBySlug.has(feature.properties?.directus_site_slug || feature.properties?.slug))
        .filter(feature => {
          const keys = String(feature.properties?.layer_categories || "").split(/\s+/).filter(Boolean);
          return SITE_UTILS.passesLayerCategoryFilters(keys, activeCategories, mobileLayerCategoryInputs.length);
        })
        .map(feature => {
          const slug = feature.properties?.directus_site_slug || feature.properties?.slug;
          const site = activeBySlug.get(slug);
          const approximate = feature.properties?.geometry_is_approximate === true || feature.properties?.geometry_is_approximate === "true";
          const categories = new Set(String(feature.properties?.layer_categories || "").split(/\s+/).filter(Boolean));
          categories.add("place-name-areas");
          categories.add("place-names");
          return {
            ...feature,
            properties: {
              ...(feature.properties || {}),
              id: site?.id || feature.properties?.directus_site_id,
              slug,
              title: site?.title || feature.properties?.title,
              site_type: site?.site_type || "placename",
              feature_category: "placename",
              place_name_area_overlay: true,
              layer_categories: [...categories].join(" "),
              fillcolor: feature.properties?.fillcolor || (approximate ? "#c98a38" : "#78b943"),
              linecolor: "#315b50",
              lineopacity: 0.3,
              opacity: Math.min(0.18, mobilePolygonOpacity({
                map_opacity: Number.isFinite(Number(feature.properties?.opacity))
                  ? Number(feature.properties.opacity)
                  : 0.18
              })),
              broad: false,
              label_size: 10.5,
              bounds_area: geometryBoundsArea(feature.geometry)
            }
          };
        });
    }

    function mobilePlaceNameAreaLabelFeatures(features = []) {
      return {
        type: "FeatureCollection",
        features: (features || []).map(feature => {
          const center = geometryCenter(feature.geometry);
          if (!center) return null;
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: center },
            properties: { ...(feature.properties || {}) }
          };
        }).filter(Boolean)
      };
    }

    function cachedMobileMapSourceData() {
      const sites = activeMapSites();
      const shapeSites = sites.filter(site => {
        const type = siteDisplayGeometry(site)?.type;
        return type === "Polygon" || type === "MultiPolygon";
      });
      const pointHitSites = sites.filter(site => siteDisplayGeometry(site)?.type === "Point");
      const categoryKey = JSON.stringify(state.settings.layerCategories || {});
      const eraKey = JSON.stringify(state.settings.eraCategories || {});
      const dateKey = localDateKey();
      const cacheKey = `${state.mapSourceRevision}|${dateKey}|${state.settings.showPins !== false ? "pins" : "no-pins"}|${state.settings.showShapes !== false ? "shapes" : "no-shapes"}|${state.settings.exhibits !== false ? "exhibits" : "no-exhibits"}|${categoryKey}|${eraKey}|${sites.length}|${state.placeNameAreas?.features?.length || 0}`;
      if (!state.mapSourceCache || state.mapSourceCacheKey !== cacheKey) {
        const siteFeatures = siteFeatureCollection([...shapeSites, ...pointHitSites]);
        const placeNameAreas = mobilePlaceNameAreaFeatures(sites);
        siteFeatures.features.push(...placeNameAreas);
        state.mapSourceCache = {
          sites: siteFeatures,
          attention: siteAttentionFeatureCollection(sites),
          territoryLabels: polygonLabelCollection("territory", shapeSites),
          detailLabels: polygonLabelCollection("detail", shapeSites),
          placeNameAreaLabels: mobilePlaceNameAreaLabelFeatures(placeNameAreas)
        };
        state.mapSourceCacheKey = cacheKey;
      }
      return state.mapSourceCache;
    }

    function bestClickableFeature(features = []) {
      const placeNameArea = [...features]
        .filter(feature => feature?.properties?.place_name_area_overlay === true || feature?.properties?.place_name_area_overlay === "true")
        .sort((a, b) => Number(a.properties?.bounds_area || 0) - Number(b.properties?.bounds_area || 0))[0];
      return placeNameArea || preferredAncestralLandFeature(features) || [...features]
        .filter(feature => feature?.properties?.slug || feature?.properties?.wiki_slug)
        .sort((a, b) => {
          const aBroad = a.properties?.broad === true || a.properties?.broad === "true";
          const bBroad = b.properties?.broad === true || b.properties?.broad === "true";
          if (aBroad !== bBroad) return aBroad ? 1 : -1;
          return Number(a.properties?.bounds_area || 0) - Number(b.properties?.bounds_area || 0);
        })[0] || null;
    }

    function mobileFeatureCommunity(feature) {
      const text = normalizeComparisonText(`${feature?.properties?.slug || ""} ${feature?.properties?.title || ""} ${feature?.properties?.site_type || ""}`);
      if (text.includes("shinnecock")) return "shinnecock";
      if (text.includes("unkechaug")) return "unkechaug";
      return "";
    }

    function isMobileAncestralLandFeature(feature) {
      const slug = feature?.properties?.slug || "";
      if (slug === "shinnecock-ancestral-land" || slug === "unkechaug-ancestral-land") return true;
      return /ancestral land/i.test(`${feature?.properties?.title || ""} ${feature?.properties?.site_type || ""}`);
    }

    function isMobileReservationFeature(feature) {
      const slug = feature?.properties?.slug || "";
      if (slug === "shinnecock-indian-reservation" || slug === "unkechaug-indian-reservation") return true;
      return /reservation/i.test(`${feature?.properties?.title || ""} ${feature?.properties?.site_type || ""}`);
    }

    function preferredAncestralLandFeature(features = []) {
      const candidates = features.filter(isMobileAncestralLandFeature);
      if (!candidates.length) return null;
      const reservationCommunities = new Set(features.filter(isMobileReservationFeature).map(mobileFeatureCommunity).filter(Boolean));
      return candidates
        .filter(feature => reservationCommunities.has(mobileFeatureCommunity(feature)))
        .sort((a, b) => Number(a.properties?.bounds_area || 0) - Number(b.properties?.bounds_area || 0))[0] || null;
    }

    function mobileMapHitFeatures(event) {
      if (!state.map || !event?.point) return event?.features || [];
      const radius = 18;
      const point = event.point;
      const targetLayers = [
        "mobile-biography-place-labels",
        "mobile-biography-place-points",
        "mobile-biography-path-labels",
        "mobile-biography-path-point-numbers",
        "mobile-biography-path-points",
        "mobile-site-point-hit",
        "mobile-place-name-area-labels",
        "mobile-place-name-area-fill",
        "mobile-detail-labels",
        "mobile-territory-labels",
        "mobile-site-polygons",
        "mobile-territory-polygons"
      ];
      return MAP_UTILS.queryRenderedFeaturesAround(state.map, point, targetLayers, radius, { fallback: event?.features || [] });
    }

    function mobileMapPolygonHitFeatures(event) {
      if (!state.map || !event?.point) return [];
      const radius = 10;
      const point = event.point;
      const targetLayers = [
        "mobile-detail-labels",
        "mobile-place-name-area-labels",
        "mobile-place-name-area-fill",
        "mobile-territory-labels",
        "mobile-site-polygons",
        "mobile-territory-polygons"
      ];
      return MAP_UTILS.queryRenderedFeaturesAround(state.map, point, targetLayers, radius);
    }

    function bestAndroidPolygonFeature(event) {
      const containedPolygon = bestClickableFeature([
        ...mobileGeometryHitFeatures(event),
        ...mobileProjectedGeometryHitFeatures(event)
      ]);
      if (containedPolygon) return containedPolygon;
      const renderedFeatures = mobileMapPolygonHitFeatures(event);
      const detailLabel = bestClickableFeature(renderedFeatures.filter(feature =>
        (feature?.layer?.id === "mobile-place-name-area-labels" || feature?.layer?.id === "mobile-detail-labels") && feature?.properties?.slug
      ));
      if (detailLabel) return detailLabel;
      const renderedPolygon = bestClickableFeature(renderedFeatures.filter(feature =>
        feature?.layer?.id === "mobile-place-name-area-fill" || feature?.layer?.id === "mobile-site-polygons" || feature?.layer?.id === "mobile-territory-polygons"
      ));
      if (renderedPolygon) return renderedPolygon;
      const territoryLabel = bestClickableFeature(renderedFeatures.filter(feature =>
        feature?.layer?.id === "mobile-territory-labels" && feature?.properties?.slug
      ));
      if (territoryLabel) return territoryLabel;
      return null;
    }

    function isMobilePolygonLayerFeature(feature) {
      const layerId = feature?.layer?.id || "";
      return layerId === "mobile-site-polygons" ||
        layerId === "mobile-territory-polygons" ||
        layerId === "mobile-place-name-area-fill" ||
        layerId === "mobile-place-name-area-labels" ||
        layerId === "mobile-detail-labels" ||
        layerId === "mobile-territory-labels";
    }

    function isMobilePointHitFeature(feature) {
      return feature?.layer?.id === "mobile-site-point-hit";
    }

    function bestMobilePointHitFeature(features = [], event = null) {
      const candidates = features.filter(feature =>
        isMobilePointHitFeature(feature) && (feature?.properties?.slug || feature?.properties?.wiki_slug)
      );
      if (!candidates.length) return null;
      if (!state.map || !event?.point) return bestClickableFeature(candidates);
      return [...candidates].sort((a, b) => {
        const aCoordinates = a?.geometry?.type === "Point" ? a.geometry.coordinates : null;
        const bCoordinates = b?.geometry?.type === "Point" ? b.geometry.coordinates : null;
        const aPoint = Array.isArray(aCoordinates) ? state.map.project(aCoordinates) : null;
        const bPoint = Array.isArray(bCoordinates) ? state.map.project(bCoordinates) : null;
        const aDistance = aPoint ? Math.hypot(aPoint.x - event.point.x, aPoint.y - event.point.y) : Number.POSITIVE_INFINITY;
        const bDistance = bPoint ? Math.hypot(bPoint.x - event.point.x, bPoint.y - event.point.y) : Number.POSITIVE_INFINITY;
        return aDistance - bDistance;
      })[0] || null;
    }

    function bestMobileRenderedPointHitFeature(event) {
      if (!state.map || !event?.point) {
        return bestMobilePointHitFeature(event?.features || [], event);
      }
      const rendered = MAP_UTILS.queryRenderedFeaturesAround(
        state.map,
        event.point,
        ["mobile-site-point-hit"],
        2,
        { fallback: event?.features || [] }
      );
      return bestMobilePointHitFeature(rendered, event);
    }

    function bestMobileRenderedBiographyFeature(event) {
      if (!state.map || !event?.point) {
        return bestClickableFeature((event?.features || []).filter(isMobileBiographyPathFeature));
      }
      const rendered = MAP_UTILS.queryRenderedFeaturesAround(
        state.map,
        event.point,
        [
          "mobile-biography-place-labels",
          "mobile-biography-place-points",
          "mobile-biography-place-path",
          "mobile-biography-path-labels",
          "mobile-biography-path-point-numbers",
          "mobile-biography-path-points",
          "mobile-biography-path-lines"
        ],
        8,
        { fallback: event?.features || [] }
      );
      return bestClickableFeature(rendered.filter(isMobileBiographyPathFeature));
    }

    function isMobileBiographyPathFeature(feature) {
      const layerId = feature?.layer?.id || "";
      return layerId === "mobile-biography-place-labels" ||
        layerId === "mobile-biography-place-points" ||
        layerId === "mobile-biography-place-path" ||
        layerId === "mobile-biography-path-labels" ||
        layerId === "mobile-biography-path-point-numbers" ||
        layerId === "mobile-biography-path-points" ||
        layerId === "mobile-biography-path-lines";
    }

    function bestMobileLayerEventFeature(event) {
      const features = event?.features || [];
      if (!features.length) return null;
      const biographyPath = bestClickableFeature(features.filter(isMobileBiographyPathFeature));
      if (biographyPath) return biographyPath;
      const point = bestMobilePointHitFeature(features, event);
      if (point) return point;
      const polygon = bestClickableFeature(features.filter(isMobilePolygonLayerFeature));
      if (polygon) return polygon;
      return point || bestClickableFeature(features);
    }

    function bestMobileRenderedTapFeature(event) {
      const rendered = mobileMapHitFeatures(event);
      const biographyPath = bestClickableFeature(rendered.filter(isMobileBiographyPathFeature));
      if (biographyPath) return biographyPath;
      const point = bestMobilePointHitFeature(rendered, event);
      if (point) return point;
      const polygon = bestClickableFeature(rendered.filter(isMobilePolygonLayerFeature));
      if (polygon) return polygon;
      const geometry = bestClickableFeature([
        ...mobileGeometryHitFeatures(event),
        ...mobileProjectedGeometryHitFeatures(event)
      ]);
      if (geometry) return geometry;
      return point || bestClickableFeature(rendered);
    }

    function mobileGeometryHitFeatures(event) {
      if (state.settings.showShapes === false || !event?.lngLat) return [];
      const point = [event.lngLat.lng, event.lngLat.lat];
      const siteFeatures = activeMapSites()
        .filter(site => {
          const geometry = siteDisplayGeometry(site);
          return (geometry?.type === "Polygon" || geometry?.type === "MultiPolygon") && pointInGeometry(point, geometry);
        })
        .map(site => {
          const geometry = siteDisplayGeometry(site);
          return {
            type: "Feature",
            geometry,
            properties: {
              id: site.id,
              slug: site.slug,
              title: site.title,
              site_type: site.site_type,
              broad: isBroadTerritory(site),
              bounds_area: geometryBoundsArea(geometry)
            }
          };
        });
      const placeNameAreas = mobilePlaceNameAreaFeatures(activeMapSites())
        .filter(feature => pointInGeometry(point, feature.geometry));
      return [...placeNameAreas, ...siteFeatures];
    }

    function projectedGeometryRings(geometry) {
      const rings = [];
      const addRing = ring => {
        if (!Array.isArray(ring) || ring.length < 3) return;
        const projected = ring
          .map(coord => Array.isArray(coord) ? state.map.project(coord) : null)
          .filter(Boolean)
          .map(coord => [coord.x, coord.y]);
        if (projected.length >= 3) rings.push(projected);
      };
      if (geometry?.type === "Polygon") {
        (geometry.coordinates || []).forEach(addRing);
      } else if (geometry?.type === "MultiPolygon") {
        (geometry.coordinates || []).forEach(poly => (poly || []).forEach(addRing));
      }
      return rings;
    }

    function pointInProjectedRing(point, ring) {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0];
        const yi = ring[i][1];
        const xj = ring[j][0];
        const yj = ring[j][1];
        const intersects = ((yi > point.y) !== (yj > point.y)) &&
          point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 0.000001) + xi;
        if (intersects) inside = !inside;
      }
      return inside;
    }

    function projectedRingBounds(ring) {
      const xs = ring.map(point => point[0]);
      const ys = ring.map(point => point[1]);
      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys)
      };
    }

    function pointInProjectedGeometry(point, geometry) {
      return projectedGeometryRings(geometry).some(ring => {
        const bounds = projectedRingBounds(ring);
        const tolerance = 4;
        if (point.x < bounds.minX - tolerance || point.x > bounds.maxX + tolerance ||
            point.y < bounds.minY - tolerance || point.y > bounds.maxY + tolerance) {
          return false;
        }
        return pointInProjectedRing(point, ring);
      });
    }

    function mobileProjectedGeometryHitFeatures(event) {
      if (state.settings.showShapes === false || !state.map || !event?.point) return [];
      const siteFeatures = activeMapSites()
        .filter(site => {
          const geometry = siteDisplayGeometry(site);
          return (geometry?.type === "Polygon" || geometry?.type === "MultiPolygon") &&
            pointInProjectedGeometry(event.point, geometry);
        })
        .map(site => {
          const geometry = siteDisplayGeometry(site);
          return {
            type: "Feature",
            geometry,
            properties: {
              id: site.id,
              slug: site.slug,
              title: site.title,
              site_type: site.site_type,
              broad: isBroadTerritory(site),
              bounds_area: geometryBoundsArea(geometry)
            }
          };
        });
      const placeNameAreas = mobilePlaceNameAreaFeatures(activeMapSites())
        .filter(feature => pointInProjectedGeometry(event.point, feature.geometry));
      return [...placeNameAreas, ...siteFeatures];
    }

    function openMapFeature(feature) {
      const wikiSlug = feature?.properties?.wiki_slug;
      if (wikiSlug && state.wikiBySlug.has(wikiSlug)) {
        openWikiArticle(state.wikiBySlug.get(wikiSlug), {
          focus: false,
          timelineEventId: feature?.properties?.event_id || feature?.properties?.eventId || ""
        });
        return;
      }
      const slug = feature?.properties?.slug;
      if (slug) openSite(slug, { focus: false });
    }

    function openMobilePolygonLayerFeature(event) {
      if (isMobileMapTapBlocked() || state.suggestionMapPickMode) return false;
      if (mobileMapEventHandled(event)) return true;
      const pointFeature = bestMobileRenderedPointHitFeature(event);
      if (pointFeature) {
        const point = event?.point;
        const lngLat = event?.lngLat;
        const tapKey = point
          ? `${Math.round(point.x)}:${Math.round(point.y)}`
          : `${Math.round((lngLat?.lng || 0) * 10000)}:${Math.round((lngLat?.lat || 0) * 10000)}`;
        rememberMobileMapTap(tapKey, pointFeature);
        event?.preventDefault?.();
        event?.originalEvent?.preventDefault?.();
        event?.originalEvent?.stopPropagation?.();
        markMobileMapEventHandled(event);
        openMapFeature(pointFeature);
        return true;
      }
      const feature = bestClickableFeature((event?.features || []).filter(isMobilePolygonLayerFeature));
      if (!feature) return false;
      const point = event?.point;
      const lngLat = event?.lngLat;
      const tapKey = point
        ? `${Math.round(point.x)}:${Math.round(point.y)}`
        : `${Math.round((lngLat?.lng || 0) * 10000)}:${Math.round((lngLat?.lat || 0) * 10000)}`;
      rememberMobileMapTap(tapKey, feature);
      event?.preventDefault?.();
      event?.originalEvent?.preventDefault?.();
      event?.originalEvent?.stopPropagation?.();
      markMobileMapEventHandled(event);
      openMapFeature(feature);
      return true;
    }

    function mobileMarkerTapRadius(androidWebViewTap = false) {
      const zoom = Number(state.map?.getZoom?.() || 6);
      const visualRadius = 12 + Math.max(0, Math.min(1, (zoom - 6) / 8)) * 8;
      return Math.round(Math.min(21, visualRadius + (androidWebViewTap ? 1 : 0)));
    }

    function mobileFeatureTapKey(feature) {
      return String(feature?.properties?.wiki_slug || feature?.properties?.slug || feature?.properties?.id || "");
    }

    function rememberMobileMapTap(tapKey, feature, now = performance.now()) {
      state.lastMobileMapTapKey = tapKey || "";
      state.lastMobileMapTapFeatureKey = mobileFeatureTapKey(feature);
      state.lastMobileMapTapAt = now;
    }

    function nearestMobileMarkerFeature(event, radius = 24) {
      if (state.settings.showPins === false || !state.map || !event?.point) return null;
      let best = null;
      activeMapSites().forEach(site => {
        if (!Array.isArray(site.center)) return;
        const geometry = siteDisplayGeometry(site);
        if (geometry?.type !== "Point" && !siteMapIconUrl(site)) return;
        const projected = state.map.project(site.center);
        const distance = Math.hypot(projected.x - event.point.x, projected.y - event.point.y);
        if (distance > radius || (best && distance >= best.distance)) return;
        best = { site, distance };
      });
      if (!best?.site) return null;
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: best.site.center },
        properties: {
          id: best.site.id,
          slug: best.site.slug,
          title: best.site.title,
          site_type: best.site.site_type,
          broad: false,
          bounds_area: 0
        }
      };
    }

    function nearestMobileMovingFeature(event, radius = 18) {
      if (!state.map || !event?.point) return null;
      let best = null;
      const consider = (marker, properties) => {
        const point = marker?.getLngLat?.();
        const element = marker?.getElement?.();
        if (!point || !element || !element.getClientRects().length) return;
        const projected = state.map.project([point.lng, point.lat]);
        const distance = Math.hypot(projected.x - event.point.x, projected.y - event.point.y);
        if (distance > radius || (best && distance >= best.distance)) return;
        best = {
          distance,
          feature: {
            type: "Feature",
            geometry: { type: "Point", coordinates: [point.lng, point.lat] },
            properties
          }
        };
      };
      for (const entry of state.mobileMovingBiographyMarkers.values()) {
        consider(entry.marker, {
          wiki_slug: entry.item?.slug || "",
          title: entry.item?.person || "Biography",
          feature_kind: "moving-biography"
        });
      }
      consider(state.mobileMovingDogMarker, {
        wiki_slug: MOVING_DOG_WIKI_SLUG,
        title: "Dog",
        feature_kind: "moving-dog"
      });
      const whalingProperties = state.siteBySlug.has(WHALING_FEATURE_SLUG)
        ? { slug: WHALING_FEATURE_SLUG, title: "Whaling", feature_kind: "moving-whale" }
        : { wiki_slug: WHALING_FEATURE_SLUG, title: "Whaling", feature_kind: "moving-whale" };
      consider(state.mobileMovingWhaleMarker, whalingProperties);
      return best?.feature || null;
    }

    function openMobileMapTap(event) {
      const androidWebViewTap = event?.source === "android-webview";
      const now = performance.now();
      const followsAndroidOverlayTap = now - (state.lastAndroidUiOverlayTapAt || 0) < 300;
      if (isMobileMapTapBlocked() && (!androidWebViewTap || followsAndroidOverlayTap)) return false;
      if (state.suggestionMapPickMode) return false;
      const point = event?.point;
      const lngLat = event?.lngLat;
      const tapKey = point
        ? `${Math.round(point.x)}:${Math.round(point.y)}`
        : `${Math.round((lngLat?.lng || 0) * 10000)}:${Math.round((lngLat?.lat || 0) * 10000)}`;
      if (androidWebViewTap && state.lastMobileMapTapAt > 0 && now - state.lastMobileMapTapAt < 650) return true;
      if (tapKey && state.lastMobileMapTapKey === tapKey && now - state.lastMobileMapTapAt < 300) return true;
      const movingFeature = nearestMobileMovingFeature(event, androidWebViewTap ? 20 : 18);
      const biographyFeature = bestMobileRenderedBiographyFeature(event);
      const renderedPointFeature = bestMobileRenderedPointHitFeature(event);
      const preciseMarkerFeature = nearestMobileMarkerFeature(event, mobileMarkerTapRadius(androidWebViewTap));
      const polygonFeature = androidWebViewTap
        ? bestAndroidPolygonFeature(event)
        : null;
      const layerEventFeature = androidWebViewTap
        ? null
        : bestMobileLayerEventFeature(event);
      const feature = movingFeature ||
        biographyFeature ||
        renderedPointFeature ||
        preciseMarkerFeature ||
        polygonFeature ||
        layerEventFeature ||
        bestMobileRenderedTapFeature(event);
      if (!feature) {
        if (event?.source === "android-webview" && !event?.retry && point && state.map) {
          window.setTimeout(() => {
            const retryLngLat = state.map?.unproject?.(point);
            if (!retryLngLat) return;
            openMobileMapTap({ ...event, lngLat: retryLngLat, source: "android-retry", retry: true });
          }, 140);
          return true;
        }
        return false;
      }
      rememberMobileMapTap(tapKey, feature, now);
      openMapFeature(feature);
      return true;
    }

    function bindMobileMapTouchFallback() {
      if (!state.map?.getCanvas || state.mobileMapTouchTap?.bound) return;
      const canvas = state.map.getCanvas();
      const target = state.map.getContainer?.() || canvas;
      state.mobileMapTouchTap = { bound: true, startX: 0, startY: 0, moved: false, startedAt: 0 };
      target.addEventListener("touchstart", event => {
        if (event.touches.length !== 1) {
          state.mobileMapTouchTap.moved = true;
          return;
        }
        if (state.mobileDetailCloseMapTimer) {
          window.clearTimeout(state.mobileDetailCloseMapTimer);
          state.mobileDetailCloseMapTimer = 0;
        }
        if (state.map?.isEasing?.()) state.map.stop?.();
        const touch = event.touches[0];
        state.mobileMapTouchTap.startX = touch.clientX;
        state.mobileMapTouchTap.startY = touch.clientY;
        state.mobileMapTouchTap.startedAt = performance.now();
        state.mobileMapTouchTap.moved = false;
      }, { passive: true });
      target.addEventListener("touchmove", event => {
        if (!state.mobileMapTouchTap || state.mobileMapTouchTap.moved) return;
        const touch = event.touches[0];
        if (!touch) return;
        const dx = touch.clientX - state.mobileMapTouchTap.startX;
        const dy = touch.clientY - state.mobileMapTouchTap.startY;
        if (Math.hypot(dx, dy) > 12) state.mobileMapTouchTap.moved = true;
      }, { passive: true });
      target.addEventListener("touchend", event => {
        if (isMobileMapTapBlocked()) return;
        const tap = state.mobileMapTouchTap;
        const touch = event.changedTouches?.[0];
        if (!tap || !touch || tap.moved || performance.now() - tap.startedAt > 700) return;
        if (event.target?.closest?.(".mapboxgl-marker button")) return;
        const rect = canvas.getBoundingClientRect();
        const point = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        };
        const lngLat = state.map.unproject(point);
        if (handleSuggestionMapPick({ lngLat })) return;
        if (openMobileMapTap({ point, lngLat, source: "android-webview", sourceEvent: event })) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, { passive: false, capture: true });
    }

    function blockMobileMapTaps(durationMs = 240) {
      const now = performance.now();
      state.mobilePanelTapBlockUntil = Math.max(state.mobilePanelTapBlockUntil || 0, now + durationMs);
    }

    function markAndroidUiOverlayTap(durationMs = 650) {
      state.lastAndroidUiOverlayTapAt = performance.now();
      blockMobileMapTaps(durationMs);
    }

    function isMobileMapTapBlocked() {
      return performance.now() < (state.mobilePanelTapBlockUntil || 0);
    }

    const ANDROID_UI_TAP_OVERLAY_SELECTOR = [
      "button",
      "a",
      "input",
      "select",
      "textarea",
      "details",
      "summary",
      "[role='button']",
      "[role='dialog']",
      "[data-app-page]",
      "[data-close-sheet]",
      "[data-mobile-activity-type]",
      "[data-mobile-notification-type]",
      ".mobile-header",
      "header",
      ".title-row",
      ".title-actions",
      ".quick-actions",
      ".mobile-more-menu",
      ".mobile-more-grid",
      ".mobile-layer-menu",
      ".mobile-layer-panel",
      ".mobile-layer-option",
      ".map-style-select",
      ".mobile-activity-button",
      ".mobile-notification-button",
      ".mobile-view-tabs",
      ".mobile-timeline",
      ".timeline-current",
      ".timeline-step",
      ".timeline-toggle",
      ".list-panel",
      ".list-head",
      ".site-list",
      ".site-card",
      ".sheet",
      ".sheet-head",
      ".sheet-body",
      ".detail",
      ".detail-head",
      ".detail-body",
      ".mobile-startup-spotlight",
      ".plant-photo-viewer",
      ".language-quiz-modal",
      ".mapboxgl-control-container",
      ".mapboxgl-ctrl"
    ].join(", ");

    function androidTapElementsAt(clientX, clientY) {
      if (typeof document.elementsFromPoint === "function") {
        const elements = document.elementsFromPoint(clientX, clientY);
        if (elements?.length) return elements;
      }
      const target = document.elementFromPoint(clientX, clientY);
      return target ? [target] : [];
    }

    function isAndroidMapMarkerElement(element) {
      return !!element?.closest?.(".mapboxgl-marker button");
    }

    function isAndroidUiOverlayElement(element) {
      if (!element?.closest) return false;
      if (isAndroidMapMarkerElement(element)) return false;
      return !!element.closest(ANDROID_UI_TAP_OVERLAY_SELECTOR);
    }

    function blockAndroidUiOverlayMapTapStart(event) {
      const target = event?.target;
      if (!target?.closest || isAndroidMapMarkerElement(target)) return;
      if (target.closest(ANDROID_UI_TAP_OVERLAY_SELECTOR)) markAndroidUiOverlayTap();
    }

    function consumePanelCloseEvent(event) {
      markAndroidUiOverlayTap();
      event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
    }

    function isAndroidMapCanvasTap(clientX, clientY, canvas) {
      const rect = canvas?.getBoundingClientRect?.();
      const insideCanvas = !!rect && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
      const target = document.elementFromPoint(clientX, clientY);
      if (target === canvas || !!target?.closest?.(".mapboxgl-canvas")) return true;
      if (!target?.closest) return insideCanvas;
      if (isAndroidMapMarkerElement(target)) return true;
      if (isAndroidUiOverlayTap(clientX, clientY)) return false;
      const mapContainer = canvas.closest?.(".mapboxgl-map") || state.map?.getContainer?.();
      return insideCanvas || (!!mapContainer && mapContainer.contains(target));
    }

    function isAndroidUiOverlayTap(clientX, clientY) {
      const canvas = state.map?.getCanvas?.();
      const mapContainer = state.map?.getContainer?.();
      for (const element of androidTapElementsAt(clientX, clientY)) {
        if (isAndroidMapMarkerElement(element)) return false;
        if (isAndroidUiOverlayElement(element)) return true;
        if (element === canvas || element?.closest?.(".mapboxgl-canvas")) return false;
        if (mapContainer && (element === mapContainer || element?.closest?.(".mapboxgl-map"))) return false;
      }
      return false;
    }

    function openAndroidMapDomTarget(clientX, clientY) {
      const target = document.elementFromPoint(clientX, clientY);
      const markerButton = target?.closest?.(".mapboxgl-marker button");
      if (!markerButton) return false;
      markerButton.click();
      return true;
    }

    function androidViewportTapCandidates(viewX, viewY, viewWidth, viewHeight) {
      const suppliedWidth = Number(viewWidth);
      const suppliedHeight = Number(viewHeight);
      const hasSuppliedViewport = Number.isFinite(suppliedWidth) && suppliedWidth > 0 &&
        Number.isFinite(suppliedHeight) && suppliedHeight > 0;
      const width = hasSuppliedViewport ? suppliedWidth : (window.innerWidth || document.documentElement.clientWidth || 1);
      const height = hasSuppliedViewport ? suppliedHeight : (window.innerHeight || document.documentElement.clientHeight || 1);
      const rawX = Number(viewX);
      const rawY = Number(viewY);
      const dpr = Number(window.devicePixelRatio) || 1;
      const scaled = {
        clientX: rawX * ((window.innerWidth || width) / width),
        clientY: rawY * ((window.innerHeight || height) / height)
      };
      const candidates = hasSuppliedViewport
        ? [scaled]
        : [scaled, { clientX: rawX, clientY: rawY }, { clientX: rawX / dpr, clientY: rawY / dpr }];
      const uniqueCandidates = SHARED_UTILS.uniqueBy(candidates, candidate => `${Math.round(candidate.clientX)}:${Math.round(candidate.clientY)}`);
      return uniqueCandidates.filter(candidate => {
        if (!Number.isFinite(candidate.clientX) || !Number.isFinite(candidate.clientY)) return false;
        return candidate.clientX >= 0 && candidate.clientX <= (window.innerWidth || width) &&
          candidate.clientY >= 0 && candidate.clientY <= (window.innerHeight || height);
      });
    }

    window.onAndroidUiOverlayTapStart = function onAndroidUiOverlayTapStart(viewX, viewY, viewWidth, viewHeight) {
      const isOverlayTap = androidViewportTapCandidates(viewX, viewY, viewWidth, viewHeight)
        .some(candidate => isAndroidUiOverlayTap(candidate.clientX, candidate.clientY));
      if (isOverlayTap) {
        markAndroidUiOverlayTap();
      }
      return isOverlayTap;
    };

    // Some Android WebView builds identify a fixed, animated card as a UI
    // overlay yet fail to dispatch its synthetic click. The native shell calls
    // this only on touch release, after ordinary browser delivery has had the
    // same chance to handle the gesture.
    window.onAndroidMobilePromoActionTap = function onAndroidMobilePromoActionTap(viewX, viewY, viewWidth, viewHeight) {
      for (const candidate of androidViewportTapCandidates(viewX, viewY, viewWidth, viewHeight)) {
        const target = document.elementFromPoint(candidate.clientX, candidate.clientY);
        const action = target?.closest?.("#mobile-startup-spotlight-learn, #mobile-startup-spotlight-dismiss, #mobile-startup-spotlight-close");
        if (!action || mobileStartupSpotlightEl?.hidden) continue;
        if (action === mobileStartupSpotlightLearnBtn) activateMobilePromo();
        else hideMobileStartupSpotlight();
        markAndroidUiOverlayTap();
        return true;
      }
      return false;
    };

    window.onAndroidSearchResultTapStart = function onAndroidSearchResultTapStart(viewX, viewY, viewWidth, viewHeight) {
      state.pendingAndroidSearchResultTap = null;
      if (!searchEl?.value?.trim() || !listEl) return false;
      const boundsCard = androidSearchResultCardFromViewPoint(viewX, viewY, viewWidth, viewHeight);
      if (boundsCard) return cacheAndroidSearchResultCard(boundsCard);
      const nearestCard = nearestAndroidSearchResultCardFromViewPoint(viewX, viewY, viewWidth, viewHeight);
      if (nearestCard) return cacheAndroidSearchResultCard(nearestCard);
      const rawCard = nearestAndroidSearchResultCardFromRawPoint(viewX, viewY, viewWidth, viewHeight);
      if (rawCard) return cacheAndroidSearchResultCard(rawCard);
      for (const candidate of androidViewportTapCandidates(viewX, viewY, viewWidth, viewHeight)) {
        const target = document.elementFromPoint(candidate.clientX, candidate.clientY);
        const card = target?.closest?.(".site-card[data-slug], .site-card[data-wiki-slug]");
        if (!card || !listEl.contains(card)) continue;
        cacheAndroidSearchResultCard(card);
        return true;
      }
      return false;
    };

    function androidSearchResultCardFromViewPoint(viewX, viewY, viewWidth, viewHeight) {
      const rawX = Number(viewX);
      const rawY = Number(viewY);
      if (!Number.isFinite(rawX) || !Number.isFinite(rawY) || !listEl) return null;
      const cards = Array.from(listEl.querySelectorAll(".site-card[data-slug], .site-card[data-wiki-slug]"));
      if (!cards.length) return null;
      const innerWidth = window.innerWidth || document.documentElement.clientWidth || 1;
      const innerHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      const dpr = Number(window.devicePixelRatio) || 1;
      const widthScale = (Number(viewWidth) || innerWidth) / innerWidth;
      const heightScale = (Number(viewHeight) || innerHeight) / innerHeight;
      const candidates = [
        { clientX: rawX / dpr, clientY: rawY / dpr },
        { clientX: rawX / widthScale, clientY: rawY / widthScale },
        { clientX: rawX / widthScale, clientY: rawY / heightScale }
      ];
      for (const point of candidates) {
        if (!Number.isFinite(point.clientX) || !Number.isFinite(point.clientY)) continue;
        const match = cards.find(card => {
          const rect = card.getBoundingClientRect();
          return point.clientX >= rect.left - 8 &&
            point.clientX <= rect.right + 8 &&
            point.clientY >= rect.top - 8 &&
            point.clientY <= rect.bottom + 8;
        });
        if (match) return match;
      }
      return null;
    }

    function nearestAndroidSearchResultCardFromViewPoint(viewX, viewY, viewWidth, viewHeight) {
      if (!listEl || !searchEl?.value?.trim()) return null;
      const cards = Array.from(listEl.querySelectorAll(".site-card[data-slug], .site-card[data-wiki-slug]"))
        .filter(card => {
          const rect = card.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight || 1);
        });
      if (!cards.length) return null;
      const listRect = listEl.getBoundingClientRect();
      const visibleBottom = Math.min(listRect.bottom, window.innerHeight || document.documentElement.clientHeight || listRect.bottom);
      let best = null;
      let bestScore = Infinity;
      for (const point of androidViewportTapCandidates(viewX, viewY, viewWidth, viewHeight)) {
        if (point.clientY < listRect.top - 28 || point.clientY > visibleBottom + 28) continue;
        for (const card of cards) {
          const rect = card.getBoundingClientRect();
          const centerY = rect.top + (rect.height / 2);
          const centerX = rect.left + (rect.width / 2);
          const xPenalty = point.clientX < rect.left - 18 || point.clientX > rect.right + 18
            ? Math.abs(point.clientX - centerX) * 0.35
            : 0;
          const score = Math.abs(point.clientY - centerY) + xPenalty;
          if (score < bestScore) {
            best = card;
            bestScore = score;
          }
        }
      }
      return bestScore <= 190 ? best : null;
    }

    function nearestAndroidSearchResultCardFromRawPoint(viewX, viewY, viewWidth, viewHeight) {
      if (!listEl || !searchEl?.value?.trim()) return null;
      const rawX = Number(viewX);
      const rawY = Number(viewY);
      const rawWidth = Number(viewWidth) || window.innerWidth || document.documentElement.clientWidth || 1;
      const rawHeight = Number(viewHeight) || window.innerHeight || document.documentElement.clientHeight || 1;
      if (!Number.isFinite(rawX) || !Number.isFinite(rawY) || rawY < rawHeight * 0.26 || rawY > rawHeight * 0.74) return null;
      const cards = Array.from(listEl.querySelectorAll(".site-card[data-slug], .site-card[data-wiki-slug]"))
        .filter(card => {
          const rect = card.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight || 1);
        });
      if (!cards.length) return null;
      const dpr = Number(window.devicePixelRatio) || 1;
      const innerWidth = window.innerWidth || document.documentElement.clientWidth || rawWidth;
      const innerHeight = window.innerHeight || document.documentElement.clientHeight || rawHeight;
      const scales = [1, dpr, rawWidth / innerWidth, rawHeight / innerHeight]
        .filter(scale => Number.isFinite(scale) && scale > 0);
      let best = null;
      let bestScore = Infinity;
      for (const scale of scales) {
        for (const card of cards) {
          const rect = card.getBoundingClientRect();
          const top = rect.top * scale;
          const bottom = rect.bottom * scale;
          const left = rect.left * scale;
          const right = rect.right * scale;
          if (rawY < top - 34 || rawY > bottom + 34) continue;
          const centerY = top + ((bottom - top) / 2);
          const centerX = left + ((right - left) / 2);
          const xPenalty = rawX < left - 34 || rawX > right + 34
            ? Math.abs(rawX - centerX) * 0.25
            : 0;
          const score = Math.abs(rawY - centerY) + xPenalty;
          if (score < bestScore) {
            best = card;
            bestScore = score;
          }
        }
      }
      if (best && bestScore <= 240) return best;
      return rawY > rawHeight * 0.32 && rawY < rawHeight * 0.66 ? cards[0] : null;
    }

    function cacheAndroidSearchResultCard(card) {
      if (!card || !listEl?.contains(card)) return false;
      const target = mobileListCardTarget(card);
      const slug = target.wikiSlug || target.slug || "";
      state.pendingAndroidSearchResultTap = {
        slug: target.slug || "",
        wikiSlug: target.wikiSlug || "",
        until: performance.now() + 900
      };
      return slug || true;
    }

    function mobileListCardTarget(card) {
      if (!card) return { slug: "", wikiSlug: "" };
      const cardDataTarget = mobileListCardTargetFromData(card);
      if (cardDataTarget.slug || cardDataTarget.wikiSlug) return cardDataTarget;
      const cardIndexTarget = mobileListCardTargetByIndex(card);
      if (cardIndexTarget.slug || cardIndexTarget.wikiSlug) return cardIndexTarget;
      const explicitSlug = card.dataset.slug || "";
      const explicitWikiSlug = card.dataset.wikiSlug || "";
      if (explicitSlug || explicitWikiSlug) return { slug: explicitSlug, wikiSlug: explicitWikiSlug };
      const title = card.querySelector(".site-copy h2, h2")?.textContent?.trim() || "";
      const key = normalizeText(title);
      if (!key) return { slug: "", wikiSlug: "" };
      const wiki = (state.wikiArticles || []).find(article => normalizeText(article.title || "") === key);
      if (wiki?.slug) return { slug: "", wikiSlug: wiki.slug };
      const site = (state.sites || []).find(item => normalizeText(item.title || "") === key);
      return { slug: site?.slug || "", wikiSlug: "" };
    }

    function mobileListCardTargetFromData(card) {
      const slug = card?.dataset?.resultSlug || "";
      if (!slug) return { slug: "", wikiSlug: "" };
      return card.dataset.resultKind === "wiki"
        ? { slug: "", wikiSlug: slug }
        : { slug, wikiSlug: "" };
    }

    function mobileListCardTargetByIndex(card) {
      if (!card || !listEl?.contains(card)) return { slug: "", wikiSlug: "" };
      const dataIndex = Number(card.dataset.resultIndex);
      if (Number.isFinite(dataIndex)) {
        const dataItem = state.filtered[dataIndex];
        if (dataItem?.slug) {
          return dataItem.resultType === "wiki"
            ? { slug: "", wikiSlug: dataItem.slug }
            : { slug: dataItem.slug, wikiSlug: "" };
        }
      }
      const cards = Array.from(listEl.querySelectorAll(".site-card"))
        .filter(item => !item.matches(".site-card-more, .empty-state"));
      const index = cards.indexOf(card);
      const item = index >= 0 ? state.filtered[index] : null;
      if (!item?.slug) return { slug: "", wikiSlug: "" };
      return item.resultType === "wiki"
        ? { slug: "", wikiSlug: item.slug }
        : { slug: item.slug, wikiSlug: "" };
    }

    function activatePendingAndroidSearchResultTap() {
      const pending = state.pendingAndroidSearchResultTap;
      state.pendingAndroidSearchResultTap = null;
      if (!pending || performance.now() > pending.until) return false;
      clearMobileSearchForResultOpen();
      searchEl?.blur?.();
      state.listTouchActivationUntil = performance.now() + 650;
      if (pending.wikiSlug) {
        setNearbyPanelState("hidden");
        openWikiArticle(pending.wikiSlug);
        window.setTimeout(() => setNearbyPanelState("hidden"), 180);
        return true;
      }
      if (pending.slug) {
        openNearbySiteWithMapPreview(pending.slug);
        return true;
      }
      return false;
    }

    function androidTapCandidates(viewX, viewY, viewWidth, viewHeight, canvas) {
      const rect = canvas.getBoundingClientRect();
      return androidViewportTapCandidates(viewX, viewY, viewWidth, viewHeight).filter(candidate => {
        if (!Number.isFinite(candidate.clientX) || !Number.isFinite(candidate.clientY)) return false;
        return candidate.clientX >= rect.left && candidate.clientX <= rect.right &&
          candidate.clientY >= rect.top && candidate.clientY <= rect.bottom;
      });
    }

    window.onAndroidMapTap = function onAndroidMapTap(viewX, viewY, viewWidth, viewHeight, retry = false) {
      if (!state.map?.getCanvas) return false;
      if (isMobileMapTapBlocked() && performance.now() - (state.lastAndroidUiOverlayTapAt || 0) < 300) return false;
      if (activatePendingAndroidSearchResultTap()) return true;
      if (searchEl?.value?.trim()) return false;
      const canvas = state.map.getCanvas();
      const rect = canvas.getBoundingClientRect();
      const candidates = androidTapCandidates(viewX, viewY, viewWidth, viewHeight, canvas);
      if (candidates.some(candidate => isAndroidUiOverlayTap(candidate.clientX, candidate.clientY))) return false;
      for (const candidate of candidates) {
        const { clientX, clientY } = candidate;
        if (openAndroidMapDomTarget(clientX, clientY)) return true;
        if (!isAndroidMapCanvasTap(clientX, clientY, canvas)) continue;
        const point = { x: clientX - rect.left, y: clientY - rect.top };
        const lngLat = state.map.unproject(point);
        if (handleSuggestionMapPick({ lngLat })) return true;
        if (openMobileMapTap({ point, lngLat, source: "android-webview" })) return true;
      }
      if (!retry) {
        window.setTimeout(() => window.onAndroidMapTap(viewX, viewY, viewWidth, viewHeight, true), 180);
        return true;
      }
      return false;
    };

    function siteTerritoryFillColor(site, fallback) {
      return SITE_UTILS.siteTerritoryFillColor(site, fallback, {
        overrides: MOBILE_TERRITORY_FILL_OVERRIDES,
        normalizeHex
      });
    }

    function siteMapIconUrl(site) {
      if (isOfflineTextMode()) return "";
      const rawIcon = String(site?.map_icon || "").trim();
      const forceBlueDot = FORCE_BLUE_DOT_SITE_SLUGS.has(String(site?.slug || "").trim());
      if (isApkSnapshotMode()) {
        if (forceBlueDot) return FORCE_BLUE_DOT_LOCAL_ICON;
        const localIcon = APK_LOCAL_MAP_ICON_OVERRIDES[rawIcon] || (SITE_UTILS.isExhibitSite(site) ? EXHIBIT_MARKER_ICON : "");
        return localIcon || "";
      }
      if (forceBlueDot) return FORCE_BLUE_DOT_LOCAL_ICON;
      if (HEADER_IMAGE_BLUE_PLACEHOLDER_ICON_IDS.has(rawIcon) && !siteHasHeaderImage(site) && !forceBlueDot) return TEXT_ONLY_GREEN_PLACEHOLDER_ICON;
      const iconUrl = MEDIA_UTILS.siteMapIconUrl(site, { directusAssetUrl }) || "";
      return MEDIA_UTILS.optimizedMapIconUrl?.(iconUrl, { width: 128, height: 128 }) || iconUrl;
    }

    function mobileSiteIconKey(site) {
      const raw = String(site?.map_icon || (SITE_UTILS.isExhibitSite(site) ? `exhibit-${site?.slug || site?.id || "site"}` : "")).trim();
      return raw ? `mobile-site-icon-${SHARED_UTILS.sanitizeDomKey(raw)}` : "";
    }

    function prepareMobileSiteIconImage(image) {
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

    function mobileSiteIconPriority(site) {
      const geometry = siteDisplayGeometry(site);
      const coordinates = geometry?.type === "Point" ? geometry.coordinates : site?.center;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return Number.MAX_SAFE_INTEGER;
      const center = state.map?.getCenter?.();
      const dx = Number(coordinates[0]) - Number(center?.lng || FALLBACK_CENTER[0]);
      const dy = Number(coordinates[1]) - Number(center?.lat || FALLBACK_CENTER[1]);
      const visible = state.map?.getBounds?.()?.contains?.(coordinates) ? 0 : 1000;
      return visible + (dx * dx) + (dy * dy);
    }

    function scheduleNextMobileSiteIcon() {
      if (state.mobileSiteIconQueueTimer || state.mobileSiteIconImagesLoading || !state.mobileSiteIconImageQueue.length) return;
      state.mobileSiteIconQueueTimer = window.setTimeout(() => {
        state.mobileSiteIconQueueTimer = null;
        processMobileSiteIconQueue();
      }, 72);
    }

    function processMobileSiteIconQueue() {
      if (!state.map || state.mobileSiteIconImagesLoading) return;
      const entry = state.mobileSiteIconImageQueue.shift();
      if (!entry) return;
      const { key, url } = entry;
      state.mobileSiteIconImagesQueued.delete(key);
      if (state.map.hasImage?.(key) && !state.mobileSiteIconImagePlaceholders.has(key)) {
        state.mobileSiteIconImagesLoaded.add(key);
        scheduleNextMobileSiteIcon();
        return;
      }
      state.mobileSiteIconImagesLoading = true;
      state.map.loadImage(url, (error, image) => {
        try {
          if (error || !image) {
            state.mobileSiteIconImagesFailed.add(key);
            return;
          }
          if (state.mobileSiteIconImagePlaceholders.has(key) && state.map.hasImage?.(key)) state.map.removeImage(key);
          const prepared = prepareMobileSiteIconImage(image);
          if (!state.map.hasImage?.(key)) state.map.addImage(key, prepared.image, { sdf: false, ...(prepared.options || {}) });
          state.mobileSiteIconImagePlaceholders.delete(key);
          state.mobileSiteIconImagesLoaded.add(key);
        } catch {
          state.mobileSiteIconImagesFailed.add(key);
        } finally {
          state.mobileSiteIconImagesLoading = false;
          scheduleNextMobileSiteIcon();
        }
      });
    }

    function loadMobileSiteIconImages() {
      if (!state.map) return;
      const iconEntries = new Map();
      activeMapSites().forEach(site => {
        const key = mobileSiteIconKey(site);
        const url = siteMapIconUrl(site);
        if (!key || !url || state.mobileSiteIconImagesFailed.has(key) || state.mobileSiteIconImagesLoaded.has(key)) return;
        if (isApkSnapshotMode() && !/^assets\/map-icons\//i.test(url)) return;
        if (state.map.hasImage?.(key) && !state.mobileSiteIconImagePlaceholders.has(key)) {
          state.mobileSiteIconImagesLoaded.add(key);
          return;
        }
        const current = iconEntries.get(key);
        const priority = mobileSiteIconPriority(site);
        if (!current || priority < current.priority) iconEntries.set(key, { key, url, priority });
      });
      const pending = new Map(state.mobileSiteIconImageQueue.map(entry => [entry.key, entry]));
      iconEntries.forEach((entry, key) => pending.set(key, entry));
      state.mobileSiteIconImageQueue = [...pending.values()].sort((a, b) => a.priority - b.priority || a.key.localeCompare(b.key));
      state.mobileSiteIconImagesQueued = new Set(state.mobileSiteIconImageQueue.map(entry => entry.key));
      processMobileSiteIconQueue();
    }

    function shouldShowCustomMapIcons() {
      return true;
    }

    function syncMarkers(options = {}) {
      if (!state.map) return;
      const includeAuxiliary = options.auxiliary !== false;
      for (const [slug, marker] of state.markers) {
        marker.remove();
        state.markers.delete(slug);
      }
      if (shouldShowCustomMapIcons()) loadMobileSiteIconImages();
      refreshMobileMapSources();
      if (includeAuxiliary) {
        syncExhibitMarkers();
        syncApprovedSuggestionMarkers();
        syncMapStoryMarkers();
        syncSitePlantMarkers(state.selectedSite);
      }
    }

    function syncExhibitMarkers() {
      if (!state.map) return;
      const active = new Set(
        state.exhibits
          .filter(shouldShowExhibitMarker)
          .map(exhibit => exhibit.slug || String(exhibit.id))
      );
      for (const [key, marker] of state.exhibitMarkers) {
        if (!active.has(key)) {
          marker.remove();
          state.exhibitMarkers.delete(key);
        }
      }
      state.exhibits
        .filter(shouldShowExhibitMarker)
        .forEach(exhibit => {
          const key = exhibit.slug || String(exhibit.id);
          if (state.exhibitMarkers.has(key)) return;
          const element = document.createElement("button");
          element.type = "button";
          element.setAttribute("aria-label", exhibit.title);
          element.style.width = "36px";
          element.style.height = "36px";
          element.style.border = "0";
          element.style.borderRadius = "0";
          element.style.background = `url(${EXHIBIT_MARKER_ICON}) center / contain no-repeat`;
          element.style.boxShadow = "none";
          element.addEventListener("click", () => openExhibit(exhibit));
          state.exhibitMarkers.set(key, new mapboxgl.Marker({ element, anchor: "center" }).setLngLat(exhibit.center).addTo(state.map));
        });
    }

    function approvedSiteSuggestions() {
      return (state.siteSuggestions || []).filter(item => {
        if (String(item.status || "").toLowerCase() !== "approved") return false;
        const coords = Array.isArray(item.geojson?.coordinates)
          ? item.geojson.coordinates
          : [Number(item.longitude), Number(item.latitude)];
        return coords.every(Number.isFinite);
      });
    }

    function suggestionCoordinates(suggestion) {
      return Array.isArray(suggestion?.geojson?.coordinates)
        ? suggestion.geojson.coordinates
        : [Number(suggestion?.longitude), Number(suggestion?.latitude)];
    }

    function suggestionMarkerElement(suggestion) {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "mobile-approved-suggestion-marker";
      element.setAttribute("aria-label", suggestion.title || "Approved suggested site");
      element.textContent = "+";
      element.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const coords = suggestionCoordinates(suggestion);
        if (coords.every(Number.isFinite)) state.map?.flyTo?.({ center: coords, zoom: Math.max(state.map.getZoom?.() || 9, 13), duration: 650 });
        showBanner(`${suggestion.title || "Suggested site"} is public and saved.`);
      });
      return element;
    }

    function syncApprovedSuggestionMarkers() {
      if (!state.map) return;
      const active = new Set(approvedSiteSuggestions().map(item => String(item.id || item.title)));
      for (const [key, marker] of state.suggestionPublicMarkers) {
        if (!active.has(key)) {
          marker.remove();
          state.suggestionPublicMarkers.delete(key);
        }
      }
      if (state.settings.showPins === false) return;
      approvedSiteSuggestions().forEach(suggestion => {
        const key = String(suggestion.id || suggestion.title);
        if (state.suggestionPublicMarkers.has(key)) return;
        state.suggestionPublicMarkers.set(key, new mapboxgl.Marker({ element: suggestionMarkerElement(suggestion), anchor: "bottom" })
          .setLngLat(suggestionCoordinates(suggestion))
          .addTo(state.map));
      });
    }

    function mergeMapStoryVoteRecords(records = []) {
      MAP_STORY_UTILS.mergeVoteRecords(state.mapStoryVotes, records);
    }

    async function refreshRemoteMapStoryVote(storyId, profileId) {
      if (!storyId || !profileId) return null;
      const response = await fetchJson(
        `/items/mobile_map_story_votes?limit=1&filter[story][_eq]=${encodeURIComponent(storyId)}&filter[member_profile][_eq]=${encodeURIComponent(profileId)}&fields=${MAP_STORY_VOTE_FIELDS}`,
        { fresh: true }
      );
      const record = response.data?.[0] || null;
      if (record) mergeMapStoryVoteRecords([record]);
      return record;
    }

    function activeMapStories() {
      return MAP_STORY_UTILS.activeStories(state.mapStories, state.mapStoryVotes, MAP_STORY_RULES);
    }

    // A story attached to a listing should visually sit at the listing, not a
    // slightly drifted device coordinate. The original GPS coordinates remain
    // stored with the story for provenance.
    function mapStoryDisplayCoordinates(story) {
      const attachedSlug = String(story?.attached_site_slug || "").trim();
      const attachedSite = attachedSlug ? state.siteBySlug.get(attachedSlug) : null;
      const attachedCoordinates = attachedSite && !isBroadTerritory(attachedSite)
        ? (attachedSite.center || geometryCenter(siteDisplayGeometry(attachedSite)))
        : null;
      return attachedCoordinates || MAP_STORY_UTILS.coordinates(story);
    }

    function storyAttachmentSite(coords) {
      if (!coords) return null;
      return activeMapSites()
        .filter(site => site?.slug && !isBroadTerritory(site))
        .map(site => {
          const center = site.center || geometryCenter(siteDisplayGeometry(site));
          const miles = milesBetween(coords, center);
          return { site, miles };
        })
        .filter(entry => Number.isFinite(entry.miles) && entry.miles <= 0.18)
        .sort((a, b) => a.miles - b.miles)[0]?.site || null;
    }

    function mapStoryMarkerElement(story) {
      const element = document.createElement("button");
      element.type = "button";
      element.className = `mobile-story-marker${story.attached_site_slug ? " is-attached" : ""}`;
      element.setAttribute("aria-label", "Open visitor story");
      element.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        focusMapStory(story);
        openMapStory(story);
      });
      return element;
    }

    function mapStoryMarkerOffset(story) {
      if (!story?.attached_site_slug) return [0, -12];
      const zoom = Number(state.map?.getZoom?.() || 0);
      // Keep an attached story close enough to its listing that it reads as
      // one location, including on the wide overview used at mobile startup.
      if (zoom >= 15) return [0, -10];
      if (zoom >= 13.5) return [0, -16];
      if (zoom >= 11) return [0, -22];
      return [0, -28];
    }

    function focusMapStory(story, options = {}) {
      const coords = mapStoryDisplayCoordinates(story);
      if (!coords || !state.map?.easeTo) return;
      const zoom = Math.max(Number(state.map.getZoom?.() || 0), 13);
      const duration = Number.isFinite(Number(options.duration)) ? Number(options.duration) : 850;
      state.map.easeTo({ center: coords, zoom, duration, essential: true });
    }

    function syncMapStoryMarkers() {
      if (!state.map) return;
      const stories = activeMapStories();
      const visible = new Set(stories.map(story => String(story.id)));
      const storyById = new Map(stories.map(story => [String(story.id), story]));
      for (const [id, marker] of state.storyMarkers) {
        if (!visible.has(id)) {
          marker.remove();
          state.storyMarkers.delete(id);
          continue;
        }
        const story = storyById.get(id);
        const coords = mapStoryDisplayCoordinates(story);
        if (coords) marker.setLngLat(coords);
        marker.setOffset(mapStoryMarkerOffset(story));
      }
      stories.forEach(story => {
        const key = String(story.id);
        if (state.storyMarkers.has(key)) return;
        const coords = mapStoryDisplayCoordinates(story);
        if (!coords) return;
        state.storyMarkers.set(key, new mapboxgl.Marker({ element: mapStoryMarkerElement(story), anchor: "bottom", offset: mapStoryMarkerOffset(story) }).setLngLat(coords).addTo(state.map));
      });
    }

    function openMapStory(story) {
      if (!mapStoryViewEl) return;
      const counts = MAP_STORY_UTILS.storyVoteCounts(story, state.mapStoryVotes);
      const photo = directusAssetUrl(story.photo);
      const attached = story.attached_site_slug
        ? `<button class="action secondary" type="button" data-story-site="${escapeHtml(story.attached_site_slug)}">Open ${escapeHtml(story.attached_site_title || "attached site")}</button>`
        : "";
      mapStoryViewEl.innerHTML = `
        ${photo ? `<img class="map-story-photo" src="${escapeHtml(photo)}" alt="" loading="lazy" decoding="async">` : ""}
        <p class="map-story-kicker">Visitor Story</p>
        <h3>${escapeHtml(MAP_STORY_UTILS.authorName(story))} says:</h3>
        <p class="map-story-text">${escapeHtml(MAP_STORY_UTILS.quotedText(story))}</p>
        <p class="detail-meta">${escapeHtml(MAP_STORY_UTILS.timeLabel(story, state.mapStoryVotes, MAP_STORY_RULES))}</p>
        ${attached}
        <div class="map-story-vote-row">
          <button class="action secondary" type="button" data-story-vote="1" data-story-id="${escapeHtml(story.id)}">Helpful ${counts.up}</button>
          <span class="detail-meta">${counts.up} helpful vote${counts.up === 1 ? "" : "s"}; 10 keeps it.</span>
        </div>
        ${MAP_STORY_UTILS.hasMemberVote(story, state.mapStoryVotes, currentContributorProfile()?.id) ? `<p class="detail-meta">You already voted on this story.</p>` : ""}
      `;
      openSheet(mapStoryViewSheetEl);
    }

    async function voteMapStory(storyId, value, options = {}) {
      const story = state.mapStories.find(item => String(item.id) === String(storyId));
      if (!story) return;
      const profile = currentContributorProfile();
      if (!profile?.id || state.contributorSession?.pending) {
        showBanner("Login as an approved contributor to vote on map stories.");
        openSheet(loginSheetEl);
        return;
      }
      const actionKey = `story-vote:${story.id}:${profile.id}`;
      if (!mobileLearningActionGuard.begin(actionKey)) {
        showBanner("That helpful vote is already being saved.");
        return;
      }
      try {
        const remoteVote = await refreshRemoteMapStoryVote(story.id, profile.id).catch(() => null);
        if (remoteVote) {
          showBanner("You already voted on this story.");
          if (options.reopen !== false) openMapStory(story);
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
          const created = await postDirectusItem("mobile_map_story_votes", vote, { requireAuth: true, timeout: 10000 });
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
          if (options.reopen !== false) openMapStory(story);
          syncMapStoryMarkers();
        } catch (error) {
          showBanner(error.message || "Could not save vote.");
        }
      } finally {
        mobileLearningActionGuard.end(actionKey);
      }
    }

    function renderMapStoryPrompts() {
      if (!mapStoryPromptEl) return;
      mapStoryPromptEl.innerHTML = MAP_STORY_PROMPTS.map(prompt => `<option value="${escapeHtml(prompt.key)}">${escapeHtml(prompt.label)}</option>`).join("");
      const update = () => {
        const prompt = MAP_STORY_UTILS.promptForKey(MAP_STORY_PROMPTS, mapStoryPromptEl.value);
        if (mapStoryPromptHelpEl) mapStoryPromptHelpEl.textContent = prompt.help;
      };
      mapStoryPromptEl.addEventListener("change", update);
      update();
    }

    function openMapStoryComposer() {
      if (!isApprovedContributor()) {
        showBanner("Login as an approved contributor to add a map story.");
        openSheet(loginSheetEl);
        return;
      }
      const profile = currentContributorProfile();
      if (!contributorCanUseDailyAction("stories", profile)) return;
      renderMapStoryPrompts();
      if (mapStoryCaptionEl) mapStoryCaptionEl.value = "";
      if (mapStoryPhotoEl) mapStoryPhotoEl.value = "";
      if (mapStoryPhotoPreviewEl) mapStoryPhotoPreviewEl.innerHTML = "";
      if (mapStoryLocationEl) mapStoryLocationEl.textContent = state.userLocation ? "Using your current location." : "Location will be requested when you submit.";
      openSheet(mapStorySheetEl);
    }

    function updateContributionReviewCopy() {
      const admin = isAdminContributor();
      if (contributeSiteNoteEl) {
        contributeSiteNoteEl.textContent = admin
          ? "Editor submissions are saved and become public immediately."
          : "Requires project review before it becomes public.";
      }
      if (suggestSiteReviewNoteEl) {
        suggestSiteReviewNoteEl.textContent = admin
          ? "Editor site submissions are saved as approved and become public immediately."
          : "Contributor suggestions are saved for review before becoming public listings. Suggested sites use a pin only.";
      }
      if (suggestSubmitBtn) suggestSubmitBtn.textContent = admin ? "Publish site" : "Submit for review";
    }

    function openContributionSheet() {
      if (!isApprovedContributor()) {
        showBanner("Login as an approved contributor to add a story or suggest a site.");
        openSheet(loginSheetEl);
        return;
      }
      updateContributionReviewCopy();
      openSheet(contributeSheetEl);
    }

    async function submitMapStory() {
      if (!isApprovedContributor()) {
        showBanner("Login as an approved contributor to add a map story.");
        return;
      }
      const profile = currentContributorProfile();
      if (!contributorCanUseDailyAction("stories", profile)) return;
      const file = mapStoryPhotoEl?.files?.[0];
      const caption = mapStoryCaptionEl?.value.trim() || "";
      if (!caption && !file) {
        showBanner("Add story text or an optional photo before submitting.");
        return;
      }
      const moderation = moderationCheck(caption, "Your story");
      if (!moderation.ok) {
        showBanner(moderation.message);
        return;
      }
      const imageError = file ? validatePlantImage(file) : "";
      if (imageError) {
        showBanner(imageError);
        return;
      }
      mapStorySubmitEl.disabled = true;
      mapStorySubmitEl.textContent = "Submitting...";
      try {
        if (!state.userLocation) await requestUserLocation({ centerMap: false, silent: false });
        const coords = state.userLocation;
        if (!coords) throw new Error("Current location is needed for map stories.");
        const attachedSite = storyAttachmentSite(coords);
        const prompt = MAP_STORY_UTILS.promptForKey(MAP_STORY_PROMPTS, mapStoryPromptEl?.value);
        let imageId = null;
        if (file) {
          const compressed = await compressPlantImage(file);
          imageId = await uploadDirectusFile(compressed || file, `Map story - ${prompt.label}`);
        }
        const now = new Date();
        const expires = new Date(now.getTime() + MAP_STORY_BASE_LIFETIME_MS);
        const payload = {
          prompt_key: prompt.key,
          prompt_label: prompt.label,
          caption,
          photo: imageId,
          latitude: coords[1],
          longitude: coords[0],
          location_source: "device_current_location",
          attached_site: attachedSite?.id || null,
          attached_site_slug: attachedSite?.slug || "",
          attached_site_title: attachedSite?.title || "",
          created_at: now.toISOString(),
          expires_at: expires.toISOString(),
          expires_original_at: expires.toISOString()
        };
        const created = await postDirectusItem("mobile_map_stories", payload, { requireAuth: true, timeout: 20000 });
        state.mapStories.push({
          id: created.data?.id || `local-${Date.now()}`,
          ...payload,
          _pendingServerSync: true,
          _pendingServerSyncUntil: Date.now() + 2 * 60 * 1000,
          status: created.data?.status || "active",
          member_profile: profile?.id || null,
          author_name: profile?.display_name || state.profile?.display_name || state.profile?.email || "Contributor",
          permanent: Boolean(created.data?.permanent),
          admin_permanent: Boolean(created.data?.admin_permanent),
          up_votes: Number(created.data?.up_votes || 0),
          down_votes: Number(created.data?.down_votes || 0),
          vote_score: Number(created.data?.vote_score || 0),
          ...(created.data || {})
        });
        mapStorySheetEl.classList.remove("open");
        syncMapStoryMarkers();
        refreshMapStories();
        if (activitySheetEl?.classList.contains("open")) renderMobileActivitySheet();
        updateMobileActivityUnreadBadge();
        showBanner(attachedSite ? `Story attached to ${attachedSite.title}.` : "Story added to the map.");
      } catch (error) {
        showBanner(error.message || "Could not submit map story.");
      } finally {
        mapStorySubmitEl.disabled = false;
        mapStorySubmitEl.textContent = "Submit story";
      }
    }

    function approvedPlantObservationsForSite(site) {
      if (!site?.slug) return [];
      return PLANT_UTILS.plantObservationsForSource(state.plantObservations, "site", site, {
        normalizeStatus: normalizeCommentStatus
      });
    }

    function plantObservationCoordinates(record) {
      const lat = Number(record?.observation_latitude);
      const lng = Number(record?.observation_longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return [lng, lat];
      return null;
    }

    function plantObservationDomId(record) {
      const key = record?.id || `${record?.source_slug || record?.site_slug || "site"}-${record?.common_name || "plant"}-${record?.created_at || ""}`;
      const safeKey = SHARED_UTILS.sanitizeDomKey(key, { lowercase: true, collapse: true });
      return `plant-observation-${safeKey}`;
    }

    function plantPopupHtml(record, guideMatch) {
      const image = directusAssetUrl(record.photo);
      const commonName = record.common_name || "Plant observation";
      const scientific = record.scientific_name || "Scientific name not yet verified";
      const fields = enrichedPlantObservationFields(plantObservationRecordFields(record));
      const badge = nativeStatusBadgeText(fields.native_status || fields.invasive_status || "");
      const note = fields.context || record.visitor_notes || "";
      return `
        <div class="plant-observation-popup-card">
          ${image ? `<img src="${escapeHtml(image)}" alt="">` : ""}
          <strong>${escapeHtml(commonName)}</strong>
          <span><em>${escapeHtml(scientific)}</em></span>
          <span class="site-plant-status-pill">${escapeHtml(badge)}</span>
          ${note ? `<span>${escapeHtml(note)}</span>` : ""}
          <button type="button" data-plant-popup-observation="${escapeHtml(plantObservationDomId(record))}">View in site grid</button>
          ${guideMatch ? `<button type="button" data-plant-popup-guide="${escapeHtml(guideMatch.common)}">Plant guide</button>` : ""}
        </div>
      `;
    }

    function openPlantObservationPopup(record, coordinates) {
      if (!state.map || !coordinates) return;
      const guideMatch = plantGuideMatchFromFields({
        name: record.common_name,
        identification: record.scientific_name,
        vocabulary: record.algonquian_word
      });
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: true,
        className: "plant-observation-popup",
        offset: 18
      })
        .setLngLat(coordinates)
        .setHTML(plantPopupHtml(record, guideMatch))
        .addTo(state.map);
      const popupElement = popup.getElement();
      popupElement?.querySelector("[data-plant-popup-guide]")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const plantName = event.currentTarget?.getAttribute("data-plant-popup-guide");
        if (plantName) openNativePlantsGuide(plantName);
        popup.remove();
      });
      popupElement?.querySelector("[data-plant-popup-observation]")?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const targetId = event.currentTarget?.getAttribute("data-plant-popup-observation");
        detailEl.classList.add("open", "plant-browse-mode");
        syncMobilePanelAccessibility();
        window.setTimeout(() => {
          const target = targetId ? detailBodyEl.querySelector(`#${CSS.escape(targetId)}`) : detailBodyEl.querySelector(".site-plant-grid");
          target?.scrollIntoView({ block: "center" });
        }, 80);
        popup.remove();
      });
    }

    function plantMarkerElement(record, coordinates) {
      const element = document.createElement("button");
      element.type = "button";
      element.setAttribute("aria-label", record.common_name || "Plant observation");
      element.style.width = "28px";
      element.style.height = "28px";
      element.style.border = "2px solid white";
      element.style.borderRadius = "50%";
      element.style.background = "#fff";
      element.style.boxShadow = "0 4px 12px rgba(0,0,0,.22)";
      element.style.fontSize = "17px";
      element.style.lineHeight = "24px";
      element.textContent = "\u273f";
      element.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        openPlantObservationPopup(record, coordinates);
      });
      return element;
    }

    function syncSitePlantMarkers(site = state.selectedSite) {
      if (!state.map || !state.plantMarkers) return;
      const active = new Set();
      approvedPlantObservationsForSite(site).forEach(record => {
        const coordinates = plantObservationCoordinates(record);
        if (!coordinates) return;
        const key = String(record.id || `${record.site_slug}-${record.common_name}-${record.created_at}`);
        active.add(key);
        if (state.plantMarkers.has(key)) return;
        const marker = new mapboxgl.Marker({ element: plantMarkerElement(record, coordinates), anchor: "center" })
          .setLngLat(coordinates)
          .addTo(state.map);
        state.plantMarkers.set(key, marker);
      });
      for (const [key, marker] of state.plantMarkers) {
        if (!active.has(key)) {
          marker.remove();
          state.plantMarkers.delete(key);
        }
      }
    }

    function mobilePanelMapPadding() {
      const mapRect = document.getElementById("map")?.getBoundingClientRect?.();
      if (!mapRect?.height) return { top: 12, right: 12, bottom: 12, left: 12 };
      const openPanel = detailEl?.classList.contains("open")
        ? detailEl
        : document.querySelector(".sheet.open");
      const panelRect = openPanel?.getBoundingClientRect?.();
      const overlap = panelRect
        ? Math.max(0, Math.min(mapRect.bottom, panelRect.bottom) - Math.max(mapRect.top, panelRect.top))
        : 0;
      const maxBottom = Math.max(12, mapRect.height - 72);
      return {
        top: 12,
        right: 12,
        bottom: Math.min(maxBottom, Math.round(overlap + 14)),
        left: 12
      };
    }

    function focusMobileCoordinateInVisibleMap(coordinates, options = {}) {
      if (!state.map || !Array.isArray(coordinates) || !coordinates.every(Number.isFinite)) return;
      const currentZoom = Number(state.map.getZoom?.()) || 10;
      state.map.easeTo?.({
        center: coordinates,
        zoom: Number.isFinite(Number(options.zoom)) ? Number(options.zoom) : currentZoom,
        padding: mobilePanelMapPadding(),
        retainPadding: false,
        duration: Number.isFinite(Number(options.duration)) ? Number(options.duration) : 420,
        essential: true
      });
    }

    function focusSite(site, options = {}) {
      if (!state.map || !site?.center) return;
      const geometry = siteDisplayGeometry(site);
      const duration = options.duration || 600;
      const motion = options.timeline ? smoothTimelineMapOptions() : { duration, essential: true };
      const padding = options.forPanel ? mobilePanelMapPadding() : (options.timeline ? 64 : 40);
      const currentZoom = Number(state.map.getZoom?.()) || 10;
      if (geometry?.type === "Point") {
        const method = options.preview && typeof state.map.flyTo === "function" ? "flyTo" : "easeTo";
        state.map[method]({
          center: options.center || site.center,
          zoom: options.preserveZoom ? currentZoom : (options.zoom || (options.timeline ? 11.3 : 12)),
          padding,
          retainPadding: false,
          ...motion
        });
      } else {
        const bounds = geometryBounds(geometry);
        if (options.zoom) {
          const method = options.preview && typeof state.map.flyTo === "function" ? "flyTo" : "easeTo";
          state.map[method]({ center: options.center || site.center, zoom: options.zoom, padding, retainPadding: false, ...motion });
        } else if (options.preserveZoom) {
          focusMobileCoordinateInVisibleMap(options.center || site.center, { zoom: currentZoom, duration });
        } else if (bounds) state.map.fitBounds(bounds, { padding, maxZoom: options.timeline ? 10.8 : 12, ...motion });
        else {
          const method = options.preview && typeof state.map.flyTo === "function" ? "flyTo" : "easeTo";
          state.map[method]({ center: options.center || site.center, zoom: options.timeline ? 10.2 : 10.5, padding, retainPadding: false, ...motion });
        }
      }
    }

    function googleMapsUrl(site) {
      const [lng, lat] = site.center || [];
      const destination = Number.isFinite(lat) && Number.isFinite(lng)
        ? `${lat},${lng}`
        : site.title;
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    }

    function markVisited(site) {
      if (!site || site.slug === "address-result") return;
      if (!PROFILE_UTILS.isEligiblePublicVisitSite(site)) {
        showBanner("This place is for learning on the map, not a public visit check-off.");
        return;
      }
      if (!isApprovedContributor()) {
        openSheet(loginSheetEl);
        showBanner("Login to save visited sites to your profile.");
        return;
      }
      recordSiteVisit(site)
        .then(result => {
          showBanner(result?.earned ? `Visit saved: ${site.title}` : "This site is already saved in your profile.");
          renderRewards();
          renderProfile();
          renderProfiles();
        })
        .catch(error => showBanner(error.message || "Could not save this visit yet."));
    }

    async function checkInAtSite(site) {
      if (!site || site.slug === "address-result") return;
      if (!PROFILE_UTILS.isEligiblePublicVisitSite(site)) {
        showBanner("This place is not available for public check-ins.");
        return;
      }
      if (!isApprovedContributor()) {
        openSheet(loginSheetEl);
        showBanner("Login before checking in.");
        return;
      }
      if (!navigator.geolocation) {
        showBanner("Location is not available on this device.");
        return;
      }
      const center = site.center || site.checkinCenter || getGeometryCenter(site.geojson || site.display_geojson || null);
      if (!center) {
        showBanner("This site does not have a public check-in location.");
        return;
      }
      navigator.geolocation.getCurrentPosition(position => {
        const current = [position.coords.longitude, position.coords.latitude];
        const miles = milesBetween(current, center);
        if (!Number.isFinite(miles)) {
          showBanner("Could not compare your location with this site.");
          return;
        }
        if (miles > SITE_CHECKIN_RADIUS_MILES) {
          showBanner(`Move closer to this site's map icon to check in. You are about ${miles.toFixed(2)} mi away; check-in unlocks within ${SITE_CHECKIN_RADIUS_MILES.toFixed(2)} mi.`);
          return;
        }
        recordSiteVisit(site, { distanceMiles: miles })
          .then(result => {
            showBanner(result?.earned ? `Check-in saved: ${site.title}` : "You already checked in here.");
            refreshMobileVisitActions(site);
            renderRewards();
            renderProfile();
            renderProfiles();
          })
          .catch(error => showBanner(error.message || "Could not save this check-in yet."));
      }, () => {
        showBanner("Could not get your current location.");
      }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
    }

    function requireRegisteredContributor() {
      if (isApprovedContributor()) return true;
      openSheet(loginSheetEl);
      showBanner(state.profile?.pending
        ? "Thanks for registering. Your account needs approval before contributor tools unlock."
        : "Login with an approved contributor account before suggesting a site.");
      return false;
    }

    function setSuggestionPin(center) {
      if (!center || center.length < 2) return;
      suggestLongitudeEl.value = Number(center[0]).toFixed(6);
      suggestLatitudeEl.value = Number(center[1]).toFixed(6);
      if (state.map && window.mapboxgl?.Marker) {
        if (!state.suggestionMarker) {
          state.suggestionMarker = new mapboxgl.Marker({ color: "#245f44" }).setLngLat(center).addTo(state.map);
        } else {
          state.suggestionMarker.setLngLat(center);
        }
      }
      showBanner("Suggestion pin set.");
    }

    function setSuggestionMapPickMode(active) {
      state.suggestionMapPickMode = !!active;
      suggestMapPickInstructionsEl?.classList.toggle("show", !!active);
      if (state.map?.getCanvas) state.map.getCanvas().style.cursor = active ? "crosshair" : "";
      if (active) {
        if (detailEl?.classList.contains("open")) closeDetail();
        document.querySelectorAll(".sheet.open").forEach(item => item.classList.remove("open"));
        syncMobilePanelAccessibility();
        showBanner("Use two fingers to move the map, then tap once to pick the site.");
      }
    }

    function handleSuggestionMapPick(event) {
      if (!state.suggestionMapPickMode || !event?.lngLat) return false;
      setSuggestionPin([event.lngLat.lng, event.lngLat.lat]);
      setSuggestionMapPickMode(false);
      openSheet(suggestSiteSheetEl);
      return true;
    }

    function handleSuggestionMapPickClick(event) {
      if (!handleSuggestionMapPick(event)) return false;
      markMobileMapEventHandled(event);
      event?.preventDefault?.();
      event?.originalEvent?.preventDefault?.();
      event?.originalEvent?.stopPropagation?.();
      return true;
    }

    function validateSuggestionImage(file) {
      if (!file) return "";
      const isImage = MEDIA_UTILS.isImageFileLike(file);
      if (!isImage) return "Use a photo image file.";
      return "";
    }

    const validateJpegImage = SHARED_UTILS.validateJpegImage;

    function validatePlantImage(file) {
      if (!file) return "";
      const maxBytes = 5 * 1024 * 1024;
      const isImage = MEDIA_UTILS.isImageFileLike(file);
      if (!isImage) return "Use a photo image file.";
      if (file.size > maxBytes) return "Image must be 5 MB or smaller.";
      return "";
    }

    async function compressPlantImage(file) {
      const options = {
        basename: "plant-observation",
        processErrorMessage: "Could not process that photo."
      };
      return MEDIA_UTILS.compressNamedImageFile(file, "plant-observation", options);
    }

    async function compressFeedbackImage(file) {
      return compressPlantImage(file);
    }

    async function prepareJpegUploadImage(file, basename = "plant-observation") {
      return MEDIA_UTILS.prepareJpegUploadImage(file, {
        basename,
        processErrorMessage: "Could not process that photo."
      });
    }

    function setCommentPhotoStatus(section, message, tone = "") {
      const status = section?.querySelector("[data-comment-photo-status]");
      if (!status) return;
      status.textContent = message || "";
      status.hidden = !message;
      status.dataset.tone = tone || "";
    }

    function setCommentPhotoPreview(section, file) {
      const preview = section?.querySelector("[data-comment-photo-preview]");
      if (!preview) return;
      MEDIA_UTILS.setFilePreview(section, preview, file, { key: "_commentPhotoPreviewUrl" });
    }

    async function prepareCommentPhotoFile(section, rawFile) {
      if (!section) return null;
      section._commentPhotoFile = null;
      setCommentPhotoPreview(section, null);
      if (!rawFile) {
        setCommentPhotoStatus(section, "");
        return null;
      }
      const isImage = MEDIA_UTILS.isImageFileLike(rawFile);
      if (!isImage) {
        setCommentPhotoStatus(section, "Choose an image file.", "error");
        showBanner("Choose an image file.");
        return null;
      }
      setCommentPhotoStatus(section, `Preparing photo (${MEDIA_UTILS.formatImageSize(rawFile.size)})...`);
      const prepared = await prepareJpegUploadImage(rawFile, "plant-observation");
      section._commentPhotoFile = prepared;
      const changedSize = prepared.size && rawFile.size && prepared.size !== rawFile.size
        ? `, compressed from ${MEDIA_UTILS.formatImageSize(rawFile.size)}`
        : "";
      setCommentPhotoPreview(section, prepared);
      setCommentPhotoStatus(section, `Photo ready (${MEDIA_UTILS.formatImageSize(prepared.size)}${changedSize}).`);
      return prepared;
    }

    async function prepareSelectedCommentPhoto(section) {
      const input = section?.querySelector("[data-discussion-image]");
      return prepareCommentPhotoFile(section, input?.files?.[0] || null);
    }

    function plantIdentificationEndpoint() {
      if (window.NLI_PLANT_ID_ENDPOINT) return window.NLI_PLANT_ID_ENDPOINT;
      if (/nativelongisland\.com$/i.test(window.location.hostname)) {
        return new URL("native-plant-photo-api-20260523e.php", window.location.href).toString();
      }
      return "";
    }

    async function fetchPlantProviderStatus() {
      const endpoint = plantIdentificationEndpoint();
      if (!endpoint) {
        return {
          configured: false,
          providers: {},
          message: "Automatic species ID is checked on the live site. This preview can still test camera compression, vocabulary matching, and review submission."
        };
      }
      if (state.plantProviderStatus && Date.now() - state.plantProviderStatus.checkedAt < 5 * 60 * 1000) {
        return state.plantProviderStatus;
      }
      const response = await fetch(endpoint, {
        method: "GET",
        cache: "no-store",
        headers: { accept: "application/json" }
      });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) {
        throw new Error("Plant ID service status could not be checked from this connection.");
      }
      const data = await response.json();
      state.plantProviderStatus = { ...data, checkedAt: Date.now() };
      return state.plantProviderStatus;
    }

    function setPlantProviderCooldown(minutes = 20) {
      try {
        localStorage.setItem("nliPlantProviderCooldownUntil", String(Date.now() + minutes * 60 * 1000));
      } catch {}
    }

    function normalizePlantIdentification(data) {
      const top = Array.isArray(data?.suggestions) ? data.suggestions[0] : null;
      const plant = top?.plant_details || top?.plant || {};
      const probability = top?.probability ?? top?.confidence ?? data?.confidence ?? data?.probability;
      const suggestionMatches = Array.isArray(data?.suggestions)
        ? data.suggestions.map(suggestion => {
            const details = suggestion?.plant_details || suggestion?.plant || {};
            return {
              common_name: suggestion?.common_name || suggestion?.commonName || suggestion?.plant_name || details.common_names?.[0] || details.common_name || "",
              scientific_name: suggestion?.scientific_name || suggestion?.scientificName || details.scientific_name || details.name || suggestion?.plant_name || "",
              confidence: suggestion?.probability ?? suggestion?.confidence ?? null,
              source: "Pl@ntNet"
            };
          })
        : [];
      return {
        commonName: data?.common_name || data?.commonName || data?.plant_name || data?.name || plant.common_names?.[0] || plant.common_name || "",
        scientificName: data?.scientific_name || data?.scientificName || plant.scientific_name || plant.name || "",
        confidence: Number(probability || 0) || null,
        rawName: data?.raw_name || top?.plant_name || "",
        source: data?.source || "Plant identification service",
        alternatives: Array.isArray(data?.alternatives) ? data.alternatives : [],
        topMatches: Array.isArray(data?.top_matches) && data.top_matches.length ? data.top_matches : suggestionMatches,
        aiExplanation: data?.ai_explanation || "",
        safetyWarning: data?.safety_warning || "Automated plant identification can be wrong. Verify with a field guide or expert before touching, eating, or using any plant.",
        visualEvidence: data?.visual_evidence || "",
        nativeStatus: data?.native_status || "",
        invasiveStatus: data?.invasive_status || "",
        edibleSafety: data?.edible_safety || "",
        medicinalUse: data?.medicinal_use || "",
        endangeredStatus: data?.endangered_or_sensitive || "",
        indigenousContext: data?.indigenous_context || "",
        algonquianWord: data?.algonquian_word || "",
        algonquianSource: data?.algonquian_source || "",
        visitorGuidance: data?.visitor_guidance || "",
        status: data?.identification_status || data?.status || "identified",
        rawPlantNetData: data?.raw_plantnet_data || null
      };
    }

    function plantObservationGuess(section, analysis = null) {
      const notes = section.querySelector("[data-plant-notes]")?.value || "";
      const file = section._plantPhotoFile || section.querySelector("[data-plant-image]")?.files?.[0];
      const names = [analysis?.commonName, analysis?.scientificName, analysis?.rawName].filter(Boolean).join(" ");
      const haystack = `${names} ${notes} ${file?.name || ""}`.toLowerCase();
      return PLANT_OBSERVATION_SPECIES.find(item => item.keys.some(key => haystack.includes(key))) || null;
    }

    function analysisFromPlantGuess(guess, sourceNote = "Matched against project plant vocabulary") {
      if (!guess) return null;
      return {
        commonName: guess.common,
        scientificName: "",
        confidence: null,
        rawName: guess.keys?.[0] || guess.common,
        source: sourceNote,
        visualEvidence: "Matched from the observation note, filename, or vocabulary context; review the photo before publication.",
        indigenousContext: guess.context,
        algonquianWord: guess.algonquian,
        algonquianSource: guess.source,
        edibleSafety: guess.edible,
        medicinalUse: guess.medicinal,
        nativeStatus: guess.native,
        invasiveStatus: guess.invasive,
        endangeredStatus: guess.endangered,
        visitorGuidance: "Photograph only. Do not pick, disturb, harvest, or remove plants.",
        status: "vocabulary_match"
      };
    }

    function plantOrganForAnalysis(section, file = null) {
      const notes = section?.querySelector("[data-plant-notes]")?.value || "";
      const filename = file?.name || section?._plantOriginalPhotoFile?.name || "";
      const text = `${notes} ${filename}`.toLowerCase();
      if (/flower|bloom|petal|black.?eyed.?susan|rudbeckia|wisteria|rose|daisy|coneflower/.test(text)) return "flower";
      if (/berry|fruit|grape|bayberry/.test(text)) return "fruit";
      if (/bark|trunk/.test(text)) return "bark";
      return "auto";
    }

    async function analyzePlantPhoto(file, section) {
      const endpoint = plantIdentificationEndpoint();
      if (endpoint) {
        const providerStatus = await fetchPlantProviderStatus().catch(() => null);
        if (providerStatus && providerStatus.plantnet_configured === false) {
          const vocabularyMatch = analysisFromPlantGuess(plantObservationGuess(section, { rawName: file?.name || "" }));
          if (vocabularyMatch) return vocabularyMatch;
          return {
            commonName: "Photo compressed; pending plant review",
            scientificName: "",
            confidence: null,
            rawName: "",
            source: "Visitor plant photo pending review",
            status: "service_error",
            serviceError: "Automatic species ID needs Pl@ntNet connected on the backend. This photo was compressed and can still be submitted for human review."
          };
        }
        try {
          const body = new FormData();
          body.append("image", file, file.name || "plant-observation.jpg");
          body.append("site", state.selectedSite?.title || "");
          body.append("notes", section.querySelector("[data-plant-notes]")?.value || "");
          body.append("original_filename", section._plantOriginalPhotoFile?.name || file.name || "");
          const organ = plantOrganForAnalysis(section, file);
          if (organ !== "auto") body.append("organ", organ);
          const coords = state.userLocation || getGeometryCenter(state.selectedSite?.geojson || state.selectedSite?.display_geojson || null);
          if (coords && Number.isFinite(Number(coords.lat)) && Number.isFinite(Number(coords.lng))) {
            body.append("lat", String(Number(coords.lat).toFixed(5)));
            body.append("lng", String(Number(coords.lng).toFixed(5)));
          }
          const response = await fetch(endpoint, { method: "POST", body });
          if (response.ok) {
            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
              throw new Error("The plant identification endpoint returned a hosting protection page instead of a plant result.");
            }
            const data = await response.json();
            return normalizePlantIdentification(data);
          }
          let message = `Plant identification service returned ${response.status}.`;
          try {
            const data = await response.json();
            if (data?.error) message = data.detail ? `${data.error} ${data.detail}` : data.error;
          } catch {}
          if (response.status === 429) setPlantProviderCooldown(2);
          if (response.status === 429) {
            message = "Automatic plant identification is busy right now. The photo was still compressed and can be submitted for review.";
          }
          message = message.replace(/openai/ig, "plant identification provider");
          const vocabularyMatch = analysisFromPlantGuess(plantObservationGuess(section, { rawName: file?.name || "" }));
          if (vocabularyMatch) return vocabularyMatch;
          return {
            commonName: "Photo compressed; identification unavailable",
            scientificName: "",
            confidence: null,
            rawName: "",
            source: "Plant identification service",
            status: "service_error",
            serviceError: `${message} You can still submit this photo for human review.`
          };
        } catch (error) {
          console.warn("Plant identification service unavailable", error);
          const vocabularyMatch = analysisFromPlantGuess(plantObservationGuess(section, { rawName: file?.name || "" }));
          if (vocabularyMatch) return vocabularyMatch;
          return {
            commonName: "Photo compressed; identification unavailable",
            scientificName: "",
            confidence: null,
            rawName: "",
            source: "Plant identification service",
            status: "service_error",
            serviceError: `${error.message || "Could not reach the plant identification service."} You can still submit this photo for human review.`
          };
        }
      }
      const guess = plantObservationGuess(section, { rawName: file?.name || "" });
      const vocabularyMatch = analysisFromPlantGuess(guess);
      if (vocabularyMatch) return vocabularyMatch;
      return {
        commonName: guess?.common || "Photo compressed; pending plant review",
        scientificName: "",
        confidence: null,
        rawName: "",
        source: guess ? "Matched against project vocabulary from note or file name" : "Visitor plant photo pending review",
        status: guess ? "vocabulary_match" : "needs_review",
        serviceError: guess ? "" : "Automatic identification did not return a confident plant result. Submit the photo for review."
      };
    }

    function plantObservationPayload({ site, discussion, profile, analysis, guess, notes, imageId }) {
      const resolvedProfile = profile?.id ? profile : currentContributorProfile();
      const submittedAt = new Date().toISOString();
      const location = state.userLocation && Number.isFinite(Number(state.userLocation.lat)) && Number.isFinite(Number(state.userLocation.lng))
        ? state.userLocation
        : null;
      return {
        status: "approved",
        site_slug: site?.slug || discussion?.dataset.discussionSlug || null,
        site_title: site?.title || discussion?.dataset.discussionTitle || "Site",
        source_type: "site",
        source_id: Number(discussion?.dataset.discussionId) || site?.id || null,
        source_slug: site?.slug || discussion?.dataset.discussionSlug || null,
        source_title: site?.title || discussion?.dataset.discussionTitle || "Site",
        member_profile: resolvedProfile?.id || null,
        author_name: resolvedProfile?.display_name || profile?.display_name || resolvedProfile?.username || profile?.username || state.profile?.email || "Contributor",
        photo: imageId || null,
        common_name: analysis?.commonName || guess?.common || "Plant observation",
        scientific_name: analysis?.scientificName || "",
        confidence: analysis?.confidence || null,
        identification_status: analysis?.status || "pending_review",
        identification_source: analysis?.source || "",
        algonquian_word: analysis?.algonquianWord || guess?.algonquian || "",
        algonquian_source: analysis?.algonquianSource || guess?.source || "",
        indigenous_context: analysis?.indigenousContext || guess?.context || "Visitor plant observation for review.",
        edible_safety: analysis?.edibleSafety || guess?.edible || "Unknown; do not eat or harvest based on this app.",
        medicinal_use: analysis?.medicinalUse || guess?.medicinal || "",
        native_status: analysis?.nativeStatus || guess?.native || "",
        invasive_status: analysis?.invasiveStatus || guess?.invasive || "",
        endangered_status: analysis?.endangeredStatus || guess?.endangered || "",
        visitor_guidance: analysis?.visitorGuidance || "Photograph only. Do not pick, disturb, harvest, or remove plants.",
        visitor_notes: notes || "",
        raw_plantnet_data: analysis?.rawPlantNetData || null,
        observation_latitude: location ? Number(location.lat) : null,
        observation_longitude: location ? Number(location.lng) : null,
        observation_location_source: location ? "user_location_at_submission" : "",
        public_submitted_at: submittedAt,
        created_at: submittedAt
      };
    }

    function renderPlantContext(section) {
      const output = section.querySelector("[data-plant-preview]");
      if (!output) return;
      const submitButton = section.querySelector("[data-submit-plant-report]");
      const analysis = section._plantAnalysis || null;
      const guess = plantObservationGuess(section, analysis);
      const compressed = section._plantPhotoFile;
      const original = section._plantOriginalPhotoFile;
      const sizeLabel = compressed ? `${Math.round(compressed.size / 1024)} KB compressed from ${original ? `${Math.round(original.size / 1024)} KB` : "camera photo"}` : "";
      if (!analysis) {
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Take a plant photo first";
        }
        output.innerHTML = `
          <div class="plant-context-card plant-review-card">
            <strong>Plant review</strong>
            <span>Take or upload a plant photo. The app will show a review page before anything appears publicly.</span>
            <span class="plant-safety-warning">Automated plant identification can be wrong. Verify with a field guide or expert before touching, eating, or using any plant.</span>
          </div>
        `;
        return;
      }
      const guideMatch = plantGuideMatchFromFields({
        name: analysis.commonName,
        identification: analysis.scientificName,
        vocabulary: analysis.algonquianWord || guess?.algonquian || ""
      });
      const nativeBadge = nativeStatusBadgeText(analysis.nativeStatus || guess?.native || guess?.invasive || "");
      const indigenousName = analysis.algonquianWord || guess?.algonquian || "";
      const indigenousLabel = indigenousName || "Indigenous name not yet added";
      const confidenceScore = Number(analysis.confidence || 0);
      const confidenceLabel = confidenceScore ? `${Math.round(confidenceScore * 100)}% confidence` : "confidence not provided";
      const summary = plantUseEcologySummary(analysis, guess);
      const topMatches = Array.isArray(analysis.topMatches) ? analysis.topMatches : [];
      const topMatchesHtml = Array.isArray(analysis?.topMatches) && analysis.topMatches.length
        ? `<div class="plant-match-list">${analysis.topMatches.slice(0, 3).map(match => {
            const common = match?.common_name || match?.commonName || "";
            const scientific = match?.scientific_name || match?.scientificName || "";
            const confidence = Number(match?.confidence || 0);
            const score = confidence ? `${Math.round(confidence * 100)}%` : "score unavailable";
            const source = match?.source || "Pl@ntNet";
            return `<div><strong>${escapeHtml(common || scientific || "Plant match")}</strong><span>${escapeHtml(scientific || "")}</span><em>${escapeHtml(score)} · ${escapeHtml(source)}</em></div>`;
          }).join("")}</div>`
        : "";
      const exactWarning = analysis?.safetyWarning || "Automated plant identification can be wrong. Verify with a field guide or expert before touching, eating, or using any plant.";
      const limitState = plantSubmissionLimitState(currentContributorProfile());
      const limitStatus = section.querySelector("[data-plant-limit-status]");
      if (limitStatus) limitStatus.textContent = limitState.reached ? " Daily plant submission limit reached for today." : "";
      if (submitButton) {
        submitButton.disabled = limitState.reached;
        submitButton.textContent = "Submit to this site's plant grid";
      }
      output.innerHTML = `
        <div class="plant-context-card plant-review-card">
          ${section._plantPreviewUrl ? `<img class="plant-photo-preview" src="${escapeHtml(section._plantPreviewUrl)}" alt="">` : ""}
          <strong>${plantWikiLinkHtml(analysis.commonName || "Plant observation", guideMatch)}</strong>
          <span>${escapeHtml(analysis.scientificName || "Scientific name not yet verified")}</span>
          <span>${plantWikiLinkHtml(indigenousLabel, guideMatch)}</span>
          <div class="plant-context-tags">
            <span>${escapeHtml(nativeBadge)}</span>
            <span>No harvesting</span>
            <span>${escapeHtml(confidenceLabel)}</span>
          </div>
          <span>${escapeHtml(summary)}</span>
          ${analysis.serviceError ? `<span>${escapeHtml(analysis.serviceError)}</span>` : ""}
          <span class="plant-safety-warning">${escapeHtml(exactWarning)}</span>
          <div class="plant-review-actions">
            <button class="action secondary" type="button" data-retake-plant-photo>Retake</button>
          </div>
          <details class="plant-advanced-details">
            <summary>Advanced PlantNet details</summary>
            ${topMatchesHtml || `<p class="detail-meta">No alternative PlantNet matches returned.</p>`}
            ${analysis.visualEvidence ? `<p>${escapeHtml(analysis.visualEvidence)}</p>` : ""}
            ${analysis.aiExplanation ? `<p>${escapeHtml(analysis.aiExplanation)}</p>` : ""}
            ${sizeLabel ? `<p>${escapeHtml(sizeLabel)}</p>` : ""}
            ${analysis.source ? `<p>Source: ${escapeHtml(analysis.source)}</p>` : ""}
          </details>
        </div>
      `;
    }

    async function processPlantCameraPhoto(section) {
      const input = section.querySelector("[data-plant-image]");
      const file = input?.files?.[0] || null;
      if (!file) return;
      await processPlantPhotoFile(section, file);
    }

    async function processPlantPhotoFile(section, file) {
      const button = section.querySelector("[data-take-plant-photo]");
      const original = button?.textContent || "Take plant photo";
      try {
        if (button) {
          button.setAttribute("aria-disabled", "true");
          button.textContent = "Compressing photo...";
        }
        section._plantOriginalPhotoFile = file;
        const compressed = await compressPlantImage(file);
        section._plantPhotoFile = compressed;
        if (section._plantPreviewUrl) URL.revokeObjectURL(section._plantPreviewUrl);
        section._plantPreviewUrl = URL.createObjectURL(compressed);
        renderPlantContext(section);
        if (button) button.textContent = "Analyzing...";
        showBanner("Analyzing compressed plant photo...");
        section._plantAnalysis = await analyzePlantPhoto(compressed, section);
        renderPlantContext(section);
      } catch (error) {
        showBanner(error.message || "Could not prepare that plant photo.");
      } finally {
        if (button) {
          button.removeAttribute("aria-disabled");
          button.textContent = original;
        }
      }
    }

    function fileFromBase64(base64, mimeType, filename) {
      const binary = atob(base64 || "");
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      return new File([bytes], filename || `plant-observation-${Date.now()}.jpg`, {
        type: mimeType || "image/jpeg",
        lastModified: Date.now()
      });
    }

    let plantCameraStream = null;
    let plantCameraOverlay = null;

    function stopPlantCameraStream() {
      if (plantCameraStream) {
        plantCameraStream.getTracks().forEach(track => track.stop());
        plantCameraStream = null;
      }
      if (plantCameraOverlay) {
        plantCameraOverlay.remove();
        plantCameraOverlay = null;
      }
    }

    function capturePlantVideoFrame(video) {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const canvas = document.createElement("canvas");
      const maxEdge = 1280;
      const scale = Math.min(1, maxEdge / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error("Could not capture the plant photo."));
            return;
          }
          resolve(new File([blob], `plant-observation-${Date.now()}.jpg`, { type: "image/jpeg", lastModified: Date.now() }));
        }, "image/jpeg", 0.82);
      });
    }

    async function openInAppPlantCamera(section) {
      if (!navigator.mediaDevices?.getUserMedia) return false;
      stopPlantCameraStream();
      const overlay = document.createElement("div");
      overlay.className = "plant-camera-overlay";
      overlay.innerHTML = `
        <video autoplay playsinline muted></video>
        <div class="plant-camera-controls">
          <p class="plant-camera-help">Frame the plant clearly, then capture. Stay on public paths and do not pick or disturb plants.</p>
          <button class="action" type="button" data-plant-capture>Capture</button>
          <button class="ghost-button" type="button" data-plant-cancel>Cancel</button>
        </div>
      `;
      document.body.appendChild(overlay);
      plantCameraOverlay = overlay;
      const video = overlay.querySelector("video");
      try {
        plantCameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        video.srcObject = plantCameraStream;
        await video.play();
      } catch (error) {
        stopPlantCameraStream();
        return false;
      }
      overlay.querySelector("[data-plant-cancel]").addEventListener("click", stopPlantCameraStream, { once: true });
      overlay.querySelector("[data-plant-capture]").addEventListener("click", async event => {
        const button = event.currentTarget;
        button.textContent = "Capturing...";
        button.disabled = true;
        try {
          const file = await capturePlantVideoFrame(video);
          stopPlantCameraStream();
          await processPlantPhotoFile(section, file);
        } catch (error) {
          showBanner(error.message || "Could not capture that plant photo.");
          stopPlantCameraStream();
        }
      });
      return true;
    }

    window.onAndroidPlantPhoto = (ok, message, base64, mimeType, filename) => {
      const section = state.pendingPlantObservationPanel || document.querySelector("[data-plant-observation][open]") || document.querySelector("[data-plant-observation]");
      state.pendingPlantObservationPanel = null;
      if (!ok) {
        showBanner(message || "Plant photo was cancelled.");
        return true;
      }
      if (!section || !base64) {
        showBanner("Could not return the plant photo to the page.");
        return true;
      }
      const file = fileFromBase64(base64, mimeType, filename);
      processPlantPhotoFile(section, file).catch(error => showBanner(error.message || "Could not analyze that plant photo."));
      return true;
    };

    window.onAndroidCommentPhoto = (ok, message, base64, mimeType, filename) => {
      const section = state.pendingCommentPhotoDiscussion || document.querySelector(".discussion-section");
      if (!ok) {
        state.pendingCommentPhotoDiscussion = null;
        if (section) setCommentPhotoStatus(section, message || "Photo was cancelled.", "error");
        showBanner(message || "Photo was cancelled.");
        return true;
      }
      if (!section || !base64) return false;
      state.pendingCommentPhotoDiscussion = null;
      setCommentPhotoStatus(section, "Preparing captured photo...");
      const file = fileFromBase64(base64, mimeType, filename || `comment-photo-${Date.now()}.jpg`);
      prepareCommentPhotoFile(section, file).catch(error => {
        setCommentPhotoStatus(section, error.message || "Could not prepare that comment photo.", "error");
        showBanner(error.message || "Could not prepare that comment photo.");
      });
      return true;
    };

    async function submitSiteSuggestion() {
      if (!requireRegisteredContributor()) return;
      const title = suggestTitleEl.value.trim();
      const introduction = suggestIntroEl.value.trim();
      const prompt = document.querySelector("input[name='suggest-prompt']:checked")?.value || "Do you know a Native place name?";
      const latitudeRaw = suggestLatitudeEl.value || "";
      const longitudeRaw = suggestLongitudeEl.value || "";
      const latitude = Number(latitudeRaw);
      const longitude = Number(longitudeRaw);
      let image = suggestImageEl.files?.[0] || null;
      if (!title || !introduction) {
        showBanner("Add a title and introduction.");
        return;
      }
      if (!latitudeRaw || !longitudeRaw || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        showBanner("Set a map pin by clicking the map or using your location.");
        return;
      }
      const imageError = validateSuggestionImage(image);
      if (imageError) {
        showBanner(imageError);
        return;
      }
      suggestSubmitBtn.disabled = true;
      const admin = isAdminContributor();
      suggestSubmitBtn.textContent = image ? "Preparing image..." : (admin ? "Publishing..." : "Submitting...");
      try {
        const identity = currentContributorIdentity();
        const profile = identity.profile;
        image = await prepareJpegUploadImage(image, "plant-observation");
        suggestSubmitBtn.textContent = image ? "Uploading image..." : (admin ? "Publishing..." : "Submitting...");
        const imageId = image ? await uploadDirectusFile(image, title) : null;
        suggestSubmitBtn.textContent = admin ? "Publishing..." : "Submitting...";
        const submittedAt = new Date().toISOString();
        const payload = {
          status: admin ? "approved" : "pending",
          priority: 1,
          title,
          introduction,
          suggested_image: imageId,
          geojson: { type: "Point", coordinates: [longitude, latitude] },
          longitude,
          latitude,
          author_profile: profile?.id || null,
          author_name: identity.name,
          author_email: identity.email,
          submitted_at: submittedAt,
          review_note: admin
            ? `Editor public site submission. Contribution type: ${prompt}`
            : `Contribution type: ${prompt}`
        };
        const created = await postDirectusItem("site_suggestions", payload);
        state.siteSuggestions.push({ id: created?.data?.id || `local-${Date.now()}`, ...payload });
        suggestTitleEl.value = "";
        suggestIntroEl.value = "";
        suggestImageEl.value = "";
        suggestLatitudeEl.value = "";
        suggestLongitudeEl.value = "";
        state.suggestionMarker?.remove?.();
        state.suggestionMarker = null;
        renderMobileActivitySheet();
        syncApprovedSuggestionMarkers();
        updateMobileActivityUnreadBadge();
        showBanner(admin ? "Site published and saved." : "Site suggestion submitted for review.");
        suggestSiteSheetEl.classList.remove("open");
      } catch (error) {
        showBanner(error.message || "Could not submit site suggestion.");
      } finally {
        suggestSubmitBtn.disabled = false;
        suggestSubmitBtn.textContent = isAdminContributor() ? "Publish site" : "Submit for review";
      }
    }

    function profileForLogin(email = "") {
      const normalized = email.toLowerCase();
      if (normalized === "jeremynative@gmail.com" || normalized === "jeremydennis") return state.contributorProfiles.find(profile => profile.slug === "jeremy-dennis" && !isProfileBanned(profile));
      return bestContributorProfile(state.contributorProfiles.filter(profile => String(profile.username || "").toLowerCase() === normalized && !isProfileBanned(profile)))
        || null;
    }

    function currentContributorProfile() {
      if (!state.profile) return null;
      const profileMatchesSessionEmail = profile => {
        const sessionEmail = String(state.profile?.email || "").trim().toLowerCase();
        const profileEmail = String(profile?.username || profile?.email || "").trim().toLowerCase();
        return !sessionEmail || !profileEmail || sessionEmail === profileEmail;
      };
      const linked = bestContributorProfile(state.contributorProfiles.filter(profile => Number(profile.id) === Number(state.profile.profileId)));
      if (linked) {
        if (profileMatchesSessionEmail(linked) && !isProfileBanned(linked) && (linked.account_enabled !== false || PROFILE_UTILS.isAdminContributor(linked, { email: state.profile?.email }))) return linked;
        if (isProfileBanned(linked) || !profileMatchesSessionEmail(linked) || linked.account_enabled === false) {
          saveProfile({ ...state.profile, profileId: null });
        }
      }
      const byEmail = profileForLogin(state.profile.email || "");
      if (byEmail && (byEmail.account_enabled !== false || PROFILE_UTILS.isAdminContributor(byEmail, { email: state.profile?.email }))) return byEmail;
      return {
        id: state.profile.profileId || null,
        slug: "",
        display_name: state.profile.display_name || state.profile.email || "Contributor",
        username: state.profile.email || "",
        account_enabled: state.profile.account_enabled,
        profile_status: state.profile.profile_status,
        public_profile: state.profile.public_profile
      };
    }

    function currentContributorIdentity() {
      const profile = currentContributorProfile();
      const email = normalizeAccountEmail(state.profile?.email || profile?.username || profile?.email || "");
      const name = String(profile?.display_name || state.profile?.display_name || state.profile?.displayName || profile?.username || email || "Contributor").trim();
      return {
        profile,
        name: name === "undefined" ? "Contributor" : name,
        email: email === "undefined" ? "" : email
      };
    }

    const isProfileBanned = PROFILE_UTILS.isProfileBanned;

    function profileIdentityNames(profile = currentContributorProfile()) {
      return PROFILE_UTILS.profileIdentityNames(profile, [
        state.profile?.display_name,
        state.profile?.displayName,
        state.profile?.email,
        state.profile?.username
      ]);
    }

    function profileIdentityIds(profile = currentContributorProfile()) {
      return PROFILE_UTILS.profileIdentityIds(profile, state.contributorProfiles, PROFILE_UTILS.profileIdentityOptions(state.profile, {
        relationId,
        extraNames: [state.profile?.display_name, state.profile?.displayName, state.profile?.email, state.profile?.username]
      }));
    }

    function canonicalPointProfileIds(profile = currentContributorProfile()) {
      return PROFILE_UTILS.canonicalProfileIds(profile, state.contributorProfiles, PROFILE_UTILS.profileIdentityOptions(state.profile, {
        relationId,
        extraNames: [state.profile?.display_name, state.profile?.displayName, state.profile?.email, state.profile?.username]
      }));
    }

    function profilePointEventsAreCanonical(profile = currentContributorProfile()) {
      const ids = canonicalPointProfileIds(profile);
      return Boolean(ids.length && ids.every(id => state.profilePointEventCanonicalIds.has(String(id))));
    }

    const bestContributorProfile = PROFILE_UTILS.bestContributorProfile;

    function publicContributorProfiles() {
      return PROFILE_UTILS.publicContributorProfiles(state.contributorProfiles);
    }

    function hasContributorWriteSession() {
      return PROFILE_UTILS.hasContributorWriteSession(state.profile);
    }

    function requireContributorWriteSession(action = "save this") {
      const profile = currentContributorProfile();
      if (!profile) throw new Error("Login required.");
      if (state.profile?.pending) throw new Error("Your account is waiting for review before saving points.");
      if (!hasContributorWriteSession()) {
        const message = PROFILE_UTILS.contributorWriteSessionMessage(action);
        expireProfileSession(message);
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
      if (state.profile?.pending) return "Your account is waiting for review. Commenting unlocks after approval.";
      if (state.profile && !hasContributorWriteSession()) return "Log in again to comment or reply. Approved comments appear on contributor profiles.";
      return "Login to comment or reply. Approved comments appear on contributor profiles.";
    }

    function isApprovedContributor() {
      if (!state.profile || state.profile.pending) return false;
      if (!hasContributorWriteSession()) return false;
      const profile = currentContributorProfile();
      if (PROFILE_UTILS.isAdminContributor(profile, { email: state.profile?.email })) return true;
      if (state.profile.token) return Boolean(!profile || !isProfileBanned(profile));
      if (state.profile.approved) return Boolean(!profile || !isProfileBanned(profile));
      return Boolean(profile?.id && !isProfileBanned(profile) && profile.account_enabled !== false && profile.profile_status !== "hidden");
    }

    function canShowContributorProgress(profile = currentContributorProfile()) {
      if (!state.profile || state.profile.pending || state.profile.approved === false || !profile?.id) return false;
      if (isProfileBanned(profile)) return false;
      // Public-profile visibility is a privacy choice, not an account-approval state.
      return profile.account_enabled !== false;
    }

    function isAdminContributor() {
      const profile = currentContributorProfile();
      return Boolean(PROFILE_UTILS.isAdminContributor(profile, { email: state.profile?.email }));
    }

    function activeEditableContent(kind, slug) {
      if (kind === "wiki") return state.wikiBySlug.get(slug) || state.wikiArticles.find(article => article.slug === slug) || null;
      if (kind === "timeline") return state.timelineById.get(String(slug)) || state.timelineEvents.find(event => String(event.id) === String(slug)) || null;
      return state.sites.find(site => site.slug === slug) || null;
    }

    async function openFrontendEditor(kind, slug) {
      if (!isAdminContributor()) {
        showBanner("Log in with the project editor account to edit content.");
        return;
      }
      const item = activeEditableContent(kind, slug);
      if (!item?.id) {
        showBanner("This content is not editable yet.");
        return;
      }
      const hydrated = kind === "wiki" ? await fetchWikiDetail(item) : await fetchSiteDetail(item);
      const formHost = detailBodyEl.querySelector(`[data-open-frontend-editor="${CSS.escape(kind)}"][data-editor-slug="${CSS.escape(slug)}"]`)?.closest(".actions");
      if (formHost) formHost.outerHTML = frontendEditorHtml(kind, hydrated);
      else detailBodyEl.insertAdjacentHTML("beforeend", frontendEditorHtml(kind, hydrated));
      detailBodyEl.querySelector("[data-frontend-editor]")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    function frontendEditorPayload(form) {
      const fields = frontendEditorFields(form.dataset.frontendEditor);
      return Object.fromEntries(fields.filter(([, , type]) => type !== "image").map(([field]) => [field, form.elements[field]?.value?.trim() || ""]));
    }

    async function frontendEditorUploadPayload(form, status) {
      if (form.dataset.frontendEditor !== "site") return {};
      const image = form.elements.listing_image_file?.files?.[0] || null;
      if (!image) return {};
      if (!/^image\//i.test(image.type || "")) throw new Error("Use an image file for the header.");
      if (status) status.textContent = "Uploading header image...";
      const uploadFile = await prepareJpegUploadImage(image, "plant-observation");
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
        return;
      }
      const index = state.sites.findIndex(site => site.slug === slug);
      if (index >= 0) state.sites[index] = { ...state.sites[index], ...updated };
      const filteredIndex = state.filtered.findIndex(site => site.slug === slug);
      if (filteredIndex >= 0) state.filtered[filteredIndex] = { ...state.filtered[filteredIndex], ...updated };
      clearRelatedSiteCaches();
    }

    async function saveFrontendEditor(form) {
      const kind = form.dataset.frontendEditor;
      const id = form.dataset.editorId;
      const slug = form.dataset.editorSlug;
      const status = form.querySelector("[data-frontend-editor-status]");
      if (!isAdminContributor() || !id || !slug) return;
      status.textContent = "Saving...";
      try {
        const contentPayload = {
          ...frontendEditorPayload(form),
          ...await frontendEditorUploadPayload(form, status)
        };
        if (!state.profile?.token) throw new Error("Content editing needs the editor password.");
        const targetCollection = kind === "wiki" ? "wiki_articles" : kind === "timeline" ? "timeline_events" : "sites";
        const saved = await patchDirectusItem(targetCollection, id, contentPayload, { requireAuth: true });
        const updated = { ...activeEditableContent(kind, slug), ...contentPayload, ...(saved?.data || {}) };
        mergeUpdatedContent(kind, slug, updated);
        status.textContent = "Saved.";
        showBanner("Updates saved.");
        if (kind === "wiki") openWikiArticle(updated, { focus: false, skipCommentRefresh: true, skipRoute: true });
        else if (kind === "timeline") {
          const active = state.activeContent;
          if (active?.type === "site") openSite(active.slug, { focus: false, skipCommentRefresh: true, skipRoute: true });
          else if (active?.type === "wiki") openWikiArticle(state.wikiBySlug.get(active.slug), { focus: false, skipCommentRefresh: true, skipRoute: true, timelineEventId: slug });
        } else openSite(slug, { focus: false, skipCommentRefresh: true, skipRoute: true });
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
        profile: currentContributorProfile(),
        viewerEmail: state.profile?.email
      });
    }

    function commentsForSource(sourceType, item) {
      return COMMENT_UTILS.commentsForSource(state.publicComments, sourceType, item, {
        isVisible: commentVisibleToCurrentViewer,
        matchOptions: {
          normalizeSourceType: normalizeCommentSourceType,
          useLegacySiteSlug: true
        }
      });
    }

    function isPlantObservationComment(comment) {
      return /^Plant observation\b/i.test(String(comment?.comment || "").trim());
    }

    function plantObservationFields(comment) {
      const fields = {};
      String(comment?.comment || "").split(/\n+/).forEach(line => {
        const match = line.match(/^([^:]+):\s*(.*)$/);
        if (match) fields[match[1].trim().toLowerCase()] = match[2].trim();
      });
      const idLine = fields["suggested identification"] || fields["suggested identification unavailable"] || "";
      const name = idLine
        .replace(/;.*$/, "")
        .replace(/\s*\([^)]*\)\s*$/, "")
        .trim();
      const vocabularyText = fields["algonquian vocabulary"] || "";
      const vocabularyMatch = vocabularyText.match(/\s-\s(.+)$/);
      return {
        name: name || "Plant observation",
        identification: idLine || "Awaiting identification review.",
        vocabulary: vocabularyText,
        algonquian: vocabularyMatch ? vocabularyMatch[1].trim() : vocabularyText,
        context: fields.context || "",
        guidance: fields.guidelines || "",
        source: fields["identification source"] || "",
        confidence: (idLine.match(/confidence\s+(\d+)%/i) || [])[1] || "",
      };
    }

    function mergePlantObservationRecords(records = []) {
      (records || []).forEach(record => {
        if (!record) return;
        const id = Number(record.id);
        const index = id
          ? state.plantObservations.findIndex(item => Number(item.id) === id)
          : state.plantObservations.findIndex(item =>
              String(item.site_slug || "") === String(record.site_slug || "") &&
              Number(relationId(item.member_profile)) === Number(relationId(record.member_profile)) &&
              String(item.public_submitted_at || item.created_at || "") === String(record.public_submitted_at || record.created_at || "")
            );
        if (index >= 0) state.plantObservations[index] = { ...state.plantObservations[index], ...record };
        else state.plantObservations.push(record);
      });
    }

    async function refreshRemotePlantObservationsForProfile(profile = currentContributorProfile()) {
      const profileId = Number(relationId(profile?.id));
      if (!profileId) return [];
      const response = await fetchJson(
        `/items/mobile_plant_observations?limit=-1&filter[member_profile][_eq]=${profileId}&filter[status][_eq]=approved&fields=${PLANT_OBSERVATION_FIELDS}`,
        { fresh: true }
      );
      const incoming = response.data || [];
      mergePlantObservationRecords(incoming);
      return incoming;
    }

    function plantSubmissionsToday(profile = currentContributorProfile()) {
      const today = localDateKey();
      const profileId = Number(profile?.id || 0);
      return (state.plantObservations || []).filter(record => {
        if (profileId && Number(relationId(record.member_profile)) !== profileId) return false;
        const date = String(record.public_submitted_at || record.created_at || "").slice(0, 10);
        return date === today;
      }).length;
    }

    function contributorDailyState(kind = "comments", profile = currentContributorProfile()) {
      const stats = mobileProfileStats(profile || {}, { syncRemote: false });
      let records = state.publicComments;
      let dateFields = ["created_at"];
      let statusFilter = record => !["deleted", "rejected"].includes(normalizeCommentStatus(record));
      if (kind === "stories") {
        records = state.mapStories;
        statusFilter = record => !["deleted", "expired", "hidden", "rejected"].includes(normalizeCommentStatus(record));
      } else if (kind === "plants") {
        records = state.plantObservations;
        dateFields = ["public_submitted_at", "created_at"];
        statusFilter = record => !["deleted", "rejected"].includes(normalizeCommentStatus(record));
      }
      return PROFILE_UTILS.contributorDailyLimitState({
        kind,
        records,
        profile,
        points: mobileProfilePointTotal(stats),
        relationId,
        identityIds: profileIdentityIds(profile),
        dateFields,
        statusFilter
      });
    }

    function contributorDailyLimitMessage(kind = "comments", profile = currentContributorProfile()) {
      const limitState = contributorDailyState(kind, profile);
      const label = kind === "plants" ? "plant IDs" : kind === "stories" ? "map stories" : "comments";
      return `${limitState.tier.label}: ${limitState.used} of ${PROFILE_UTILS.contributorLimitLabel(limitState.limit)} ${label} used today.`;
    }

    function contributorCanUseDailyAction(kind = "comments", profile = currentContributorProfile()) {
      const limitState = contributorDailyState(kind, profile);
      if (!limitState.reached) return true;
      const label = kind === "plants" ? "plant ID" : kind === "stories" ? "map story" : "comment";
      showBanner(`Daily ${label} limit reached for ${limitState.tier.label}. Earn points to unlock more.`);
      return false;
    }

    function plantSubmissionLimitState(profile = currentContributorProfile()) {
      return contributorDailyState("plants", profile);
    }

    function plantGuideMatchFromFields(fields) {
      return PLANT_UTILS.plantGuideMatchFromFields(fields, PLANT_OBSERVATION_SPECIES);
    }

    function usefulPlantText(value = "") {
      return PLANT_UTILS.usefulPlantText(value, { cleanText: publicCleanText });
    }

    function enrichedPlantObservationFields(fields = {}) {
      const match = plantGuideMatchFromFields(fields);
      if (!match) return fields;
      return {
        ...fields,
        algonquian: usefulPlantText(fields.algonquian) || match.algonquian || "",
        context: usefulPlantText(fields.context) || match.context || "",
        guidance: usefulPlantText(fields.guidance) || match.source || "",
        native_status: usefulPlantText(fields.native_status) || match.native || "",
        invasive_status: usefulPlantText(fields.invasive_status) || match.invasive || "",
        edible_safety: usefulPlantText(fields.edible_safety) || match.edible || "",
        medicinal_use: usefulPlantText(fields.medicinal_use) || match.medicinal || "",
        endangered_status: usefulPlantText(fields.endangered_status) || match.endangered || "",
        source: usefulPlantText(fields.source) || match.source || ""
      };
    }

    function plantWikiArticleForMatch(match, label = "") {
      if (!match && !label) return null;
      const candidates = [
        match?.common,
        label,
        ...(match?.keys || [])
      ]
        .filter(Boolean)
        .map(value => normalizeText(value));
      if (!candidates.length) return null;
      return (state.wikiArticles || []).find(article => {
        const title = normalizeText(article.title);
        const slug = normalizeText(String(article.slug || "").replace(/-/g, " "));
        return candidates.some(candidate => candidate && (title === candidate || slug === candidate));
      }) || null;
    }

    function nativeStatusBadgeText(value = "") {
      const text = String(value || "").toLowerCase();
      if (/invasive/.test(text)) return "Possible invasive";
      if (/native/.test(text) && !/not native|non-native/.test(text)) return "Native status suggested";
      if (/non-native|introduced|not native/.test(text)) return "Non-native status suggested";
      return "Native status not documented";
    }

    function plantUseEcologySummary(analysis = {}, guess = null) {
      const pieces = [
        analysis.indigenousContext,
        guess?.context,
        analysis.nativeStatus,
        analysis.invasiveStatus,
        analysis.endangeredStatus
      ].filter(Boolean);
      return pieces[0] || "Plant details are not yet documented for this site.";
    }

    function plantWikiLinkHtml(label = "", match = null) {
      const text = String(label || "").trim();
      if (!text) return "";
      if (!match) return escapeHtml(text);
      const wiki = plantWikiArticleForMatch(match, text);
      if (wiki?.slug) return `<button class="plant-inline-link" type="button" data-open-plant-wiki="${escapeHtml(wiki.slug)}">${escapeHtml(text)}</button>`;
      return `<button class="plant-inline-link" type="button" data-open-native-plants="${escapeHtml(match.common)}">${escapeHtml(text)}</button>`;
    }

    function plantSpeciesMatchForArticle(article = {}) {
      const haystack = normalizeText(`${article.title || ""} ${String(article.slug || "").replace(/-/g, " ")} ${article.summary || ""}`);
      if (!haystack) return null;
      return PLANT_OBSERVATION_SPECIES.find(plant => {
        const labels = [plant.common, plant.algonquian, ...(plant.keys || [])].map(value => normalizeText(value));
        return labels.some(label => label && (haystack === label || haystack.includes(label)));
      }) || null;
    }

    function plantWikiObservationSitesHtml(article = {}) {
      const plant = plantSpeciesMatchForArticle(article);
      if (!plant) return "";
      const reports = (state.plantObservations || [])
        .filter(record => normalizeCommentStatus(record) === "approved")
        .map(record => ({ record, fields: plantObservationRecordFields(record) }))
        .filter(item => plantGuideMatchFromFields(item.fields)?.common === plant.common);
      const siteLinks = [...new Map(reports.map(item => {
        const slug = item.record.site_slug || item.record.source_slug || "";
        const title = item.record.site_title || item.record.source_title || "";
        return slug && title ? [slug, title] : null;
      }).filter(Boolean)).entries()];
      return `
        <section class="section native-plant-wiki-sites">
          <h3>Sites Where Visitors Identified This Plant</h3>
          <p class="detail-meta">${reports.length} approved observation${reports.length === 1 ? "" : "s"} connected to ${escapeHtml(plant.common)}.</p>
          ${siteLinks.length ? `
            <div class="native-plant-sites">
              ${siteLinks.map(([slug, title]) => `<button type="button" data-slug="${escapeHtml(slug)}">${escapeHtml(title)}</button>`).join("")}
            </div>
          ` : `<p class="summary">No approved site observations yet.</p>`}
        </section>
      `;
    }

    function plantStatusLabel(status) {
      return PLANT_UTILS.plantStatusLabel(status);
    }

    function plantObservationRecordFields(record) {
      return PLANT_UTILS.plantObservationRecordFields(record, { relationId });
    }

    function plantObservationsForSource(sourceType, item) {
      if (sourceType !== "site") return [];
      return PLANT_UTILS.plantObservationsForSource(state.plantObservations, sourceType, item, {
        normalizeStatus: normalizeCommentStatus,
        mapRecord: plantObservationRecordFields
      });
    }

    function detailQuoteRoot() {
      return detailBodyEl;
    }

    function decorateCurrentDetailForQuoteComments(sourceType, item) {
      window.requestAnimationFrame(() => {
        const root = detailQuoteRoot();
        if (!root) return;
        commentsForSource(sourceType, item).forEach(comment => {
          const parsed = QUOTE_COMMENT_UTILS.parseCommentRecord(comment);
          if (!parsed.quote || !comment.id) return;
          QUOTE_COMMENT_UTILS.markQuote(root, parsed.quote, comment.id);
        });
      });
    }

    function ensureQuoteSelectionPopup() {
      let popup = document.getElementById("mobile-quote-selection-popup");
      if (popup) return popup;
      popup = document.createElement("button");
      popup.id = "mobile-quote-selection-popup";
      popup.className = "quote-selection-popup mobile";
      popup.type = "button";
      popup.hidden = true;
      popup.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h7"/><path d="M7 11h10"/><path d="M7 15h6"/><path d="M5 3h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-8l-5 3v-3H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/></svg><span>Quote</span>';
      document.body.appendChild(popup);
      popup.addEventListener("click", () => startQuoteCommentFromSelection(popup.dataset.quote || "", popup.dataset.context || ""));
      return popup;
    }

    function hideQuoteSelectionPopup() {
      const popup = document.getElementById("mobile-quote-selection-popup");
      if (popup) popup.hidden = true;
    }

    function mobileHeroComparableImageUrl(value) {
      try {
        const parsed = new URL(String(value || ""), window.location.href);
        return `${parsed.origin}${parsed.pathname}`.toLowerCase();
      } catch {
        return String(value || "").trim().toLowerCase().split(/[?#]/)[0];
      }
    }

    function approvedSiteCommentPhotoSlides(site, listingImage = "") {
      const seen = new Set([mobileHeroComparableImageUrl(listingImage)].filter(Boolean));
      return commentsForSource("site", site)
        .filter(comment => normalizeCommentStatus(comment) === "approved" && directusAssetUrl(comment.comment_image))
        .map(comment => {
          const image = mobileSnapshotImageUrl(directusAssetUrl(comment.comment_image));
          const comparable = mobileHeroComparableImageUrl(image);
          if (!image || !comparable || seen.has(comparable)) return null;
          seen.add(comparable);
          const profile = state.contributorProfiles.find(item => Number(item.id) === Number(comment.member_profile));
          return {
            id: String(comment.id || ""),
            image,
            author: profile?.display_name || comment.author_name || "Contributor"
          };
        })
        .filter(Boolean);
    }

    function siteHeroCarouselHtml(site, image, imageFallback = "") {
      const commentSlides = approvedSiteCommentPhotoSlides(site, image);
      if (!commentSlides.length) {
        return image ? `<img class="hero article-sticky-hero" src="${escapeHtml(image)}" alt="${escapeHtml(site.listing_image_alt || site.title)}" loading="lazy" decoding="async" onerror="${imageErrorAction(imageFallback)}">` : "";
      }
      const slides = [
        ...(image ? [{ image, author: "", id: "", primary: true }] : []),
        ...commentSlides
      ];
      return `
        <div class="site-hero-carousel hero article-sticky-hero" data-site-hero-carousel data-site-hero-site="${escapeHtml(site.slug || site.id || "")}" data-site-hero-index="0" aria-label="${escapeHtml(site.title)} photo carousel">
          <div class="site-hero-carousel-stage">
            ${slides.map((slide, index) => slide.primary ? `
              <div class="site-hero-slide${index === 0 ? " is-active" : ""}" data-site-hero-slide-index="${index}" aria-hidden="${index === 0 ? "false" : "true"}">
                <img src="${escapeHtml(slide.image)}" alt="${escapeHtml(site.listing_image_alt || site.title)}" loading="eager" decoding="async" onerror="${imageErrorAction(imageFallback)}">
              </div>
            ` : `
              <button class="site-hero-slide site-hero-comment-slide${index === 0 ? " is-active" : ""}" type="button" data-site-hero-slide-index="${index}" data-site-hero-comment="${escapeHtml(slide.id)}" aria-hidden="${index === 0 ? "false" : "true"}" tabindex="${index === 0 ? "0" : "-1"}" aria-label="View ${escapeHtml(slide.author)}'s approved comment">
                <img src="${escapeHtml(slide.image)}" alt="Photo from ${escapeHtml(slide.author)}'s approved comment" loading="lazy" decoding="async" data-site-hero-comment-image>
                <span class="site-hero-comment-caption">${escapeHtml(slide.author)} · View comment</span>
              </button>
            `).join("")}
          </div>
          <div class="site-hero-carousel-dots" aria-label="Choose a site photo">
            ${slides.map((slide, index) => `<button type="button" data-site-hero-dot="${index}" class="${index === 0 ? "is-active" : ""}" aria-label="Show photo ${index + 1} of ${slides.length}" aria-pressed="${index === 0 ? "true" : "false"}"></button>`).join("")}
          </div>
        </div>
      `;
    }

    function stopSiteHeroCarousel() {
      window.clearInterval(state.siteHeroCarouselTimer);
      state.siteHeroCarouselTimer = null;
      state.siteHeroCarouselKey = "";
    }

    function setSiteHeroCarouselIndex(root, requestedIndex) {
      if (!root) return;
      const slides = [...root.querySelectorAll("[data-site-hero-slide-index]")].filter(slide => !slide.hidden);
      if (!slides.length) return;
      const normalized = ((Number(requestedIndex) % slides.length) + slides.length) % slides.length;
      const activeSlide = slides[normalized];
      const activeIndex = String(activeSlide.dataset.siteHeroSlideIndex || "0");
      root.dataset.siteHeroIndex = activeIndex;
      root.querySelectorAll("[data-site-hero-slide-index]").forEach(slide => {
        const active = slide === activeSlide;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
        if (slide.matches("button")) slide.tabIndex = active ? 0 : -1;
      });
      root.querySelectorAll("[data-site-hero-dot]").forEach(dot => {
        const active = dot.dataset.siteHeroDot === activeIndex;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-pressed", String(active));
      });
    }

    function bindSiteHeroCarouselSwipe(root) {
      if (!root || root.dataset.siteHeroSwipeBound === "true") return;
      root.dataset.siteHeroSwipeBound = "true";
      let touchStartX = 0;
      let touchStartY = 0;
      let touchStartedAt = 0;
      root.addEventListener("touchstart", event => {
        if (event.touches.length !== 1) return;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchStartedAt = Date.now();
      }, { passive: true });
      root.addEventListener("touchend", event => {
        const touch = event.changedTouches[0];
        if (!touch || !touchStartedAt) return;
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const elapsed = Date.now() - touchStartedAt;
        touchStartedAt = 0;
        if (elapsed > 1000 || Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) return;
        const slides = [...root.querySelectorAll("[data-site-hero-slide-index]")].filter(slide => !slide.hidden);
        const current = slides.findIndex(slide => slide.classList.contains("is-active"));
        setSiteHeroCarouselIndex(root, current + (deltaX < 0 ? 1 : -1));
        root.dataset.siteHeroSuppressClickUntil = String(Date.now() + 500);
        startSiteHeroCarousel(root, { restart: true });
      }, { passive: true });
      root.addEventListener("click", event => {
        if (Number(root.dataset.siteHeroSuppressClickUntil || 0) <= Date.now()) return;
        event.preventDefault();
        event.stopPropagation();
      }, true);
    }

    function startSiteHeroCarousel(root = detailBodyEl?.querySelector("[data-site-hero-carousel]") || detailHeroDockEl?.querySelector("[data-site-hero-carousel]"), options = {}) {
      if (!root) return;
      bindSiteHeroCarouselSwipe(root);
      root.querySelectorAll("[data-site-hero-comment-image]").forEach(image => image.addEventListener("error", () => {
        const slide = image.closest("[data-site-hero-slide-index]");
        const failedIndex = slide?.dataset.siteHeroSlideIndex;
        if (slide) slide.hidden = true;
        if (failedIndex != null) root.querySelector(`[data-site-hero-dot="${CSS.escape(failedIndex)}"]`)?.setAttribute("hidden", "");
        setSiteHeroCarouselIndex(root, 0);
      }, { once: true }));
      if (root.querySelectorAll("[data-site-hero-slide-index]").length < 2) return;
      const carouselKey = root.dataset.siteHeroSite || "";
      if (options.restart || (state.siteHeroCarouselKey && state.siteHeroCarouselKey !== carouselKey)) {
        stopSiteHeroCarousel();
      }
      state.siteHeroCarouselKey = carouselKey;
      if (state.siteHeroCarouselTimer) return;
      state.siteHeroCarouselTimer = window.setInterval(() => {
        const currentRoot = detailBodyEl?.querySelector("[data-site-hero-carousel]") || detailHeroDockEl?.querySelector("[data-site-hero-carousel]");
        if (!currentRoot || document.hidden || currentRoot.classList.contains("is-compact")) return;
        bindSiteHeroCarouselSwipe(currentRoot);
        const slides = [...currentRoot.querySelectorAll("[data-site-hero-slide-index]")].filter(slide => !slide.hidden);
        const current = slides.findIndex(slide => slide.classList.contains("is-active"));
        setSiteHeroCarouselIndex(currentRoot, current + 1);
      }, 8000);
    }

    function syncDetailHeroScrollState() {
      const hero = detailBodyEl?.querySelector(".article-sticky-hero") || detailHeroDockEl?.querySelector(".article-sticky-hero");
      if (!hero) return;
      const scrollTop = detailBodyEl.scrollTop || 0;
      if (scrollTop > 0 && !detailHeroDockEl.contains(hero)) {
        animateDetailHeroMove(hero, () => {
          detailHeroHomeNode = document.createComment("detail hero home");
          hero.replaceWith(detailHeroHomeNode);
          detailHeroDockEl.appendChild(hero);
          detailHeroDockEl.removeAttribute("aria-hidden");
          detailHeroDockEl.setAttribute("tabindex", "0");
          detailEl.classList.add("hero-docked");
          hero.classList.add("is-compact");
        });
      } else if (scrollTop <= 0 && detailHeroDockEl.contains(hero)) {
        restoreDetailHeroToBody({ animate: true });
      }
      if (detailHeroDockEl.contains(hero)) hero.classList.toggle("is-compact", scrollTop > 0);
    }

    function animateDetailHeroMove(hero, move) {
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

    function restoreDetailHeroToBody({ animate = false } = {}) {
      const hero = detailHeroDockEl?.querySelector(".article-sticky-hero");
      if (!hero) {
        detailEl.classList.remove("hero-docked");
        detailHeroDockEl.setAttribute("aria-hidden", "true");
        detailHeroDockEl.setAttribute("tabindex", "-1");
        return;
      }
      const move = () => {
        hero.classList.remove("is-compact");
        if (detailHeroHomeNode?.parentNode) {
          detailHeroHomeNode.replaceWith(hero);
        } else if (detailHeroHomeNode) {
          // The detail body was replaced while its hero was docked. Discard the
          // detached article's hero instead of inserting it into the new article.
          hero.remove();
        } else {
          detailBodyEl.prepend(hero);
        }
        detailHeroHomeNode = null;
        detailHeroDockEl.setAttribute("aria-hidden", "true");
        detailHeroDockEl.setAttribute("tabindex", "-1");
        detailEl.classList.remove("hero-docked");
      };
      if (animate) animateDetailHeroMove(hero, move);
      else move();
    }

    new MutationObserver(() => {
      if (!detailHeroHomeNode || detailHeroHomeNode.isConnected) return;
      detailHeroDockEl.querySelector(".article-sticky-hero")?.remove();
      detailHeroHomeNode = null;
      detailHeroDockEl.setAttribute("aria-hidden", "true");
      detailHeroDockEl.setAttribute("tabindex", "-1");
      detailEl.classList.remove("hero-docked");
    }).observe(detailBodyEl, { childList: true });

    function showFullDetailHero() {
      if (!detailHeroDockEl.querySelector(".article-sticky-hero")) return;
      detailBodyEl.scrollTo({ top: 0, behavior: "smooth" });
    }

    detailHeroDockEl.addEventListener("click", showFullDetailHero);
    detailHeroDockEl.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      showFullDetailHero();
    });

    function canOfferQuoteSelection() {
      const profile = currentContributorProfile();
      return Boolean(state.profile && !state.profile.pending && profile && (state.selectedWikiSlug || state.selectedSite?.slug));
    }

    function activeQuoteContextTitle() {
      if (state.selectedWikiSlug) return state.wikiArticles.find(article => article.slug === state.selectedWikiSlug)?.title || "";
      return state.selectedSite?.title || detailBodyEl.querySelector(".discussion-section")?.dataset.discussionTitle || "";
    }

    function activeQuoteContextKind() {
      if (state.selectedWikiSlug) return "Knowledgebase article";
      if (state.selectedSite?.slug) return "Site page";
      return "";
    }

    function activeQuoteHeaderContext() {
      return QUOTE_COMMENT_UTILS.compactHeaderContext([detailTitleEl, detailBodyEl]);
    }

    function quoteSelectionBlockedSelector() {
      return QUOTE_COMMENT_UTILS.quoteBlockedSelector();
    }

    function quoteSelectionContext() {
      const blocked = quoteSelectionBlockedSelector();
      return QUOTE_COMMENT_UTILS.selectionContext(detailQuoteRoot(), {
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
      const quote = QUOTE_COMMENT_UTILS.selectedQuoteText(detailQuoteRoot(), blocked);
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
      const popupBounds = popup.getBoundingClientRect();
      const safeLeft = cssPixelValue("--app-left-safe", 0) + 10;
      const safeRight = cssPixelValue("--app-right-safe", 0) + 10;
      const safeTop = cssPixelValue("--app-top-safe", 0) + 10;
      const safeBottom = cssPixelValue("--app-bottom-safe", 0) + 10;
      const popupWidth = Math.max(104, popupBounds.width || 0);
      const popupHeight = Math.max(34, popupBounds.height || 0);
      const preferredLeft = popupRect.left + popupRect.width / 2 - (popupWidth / 2);
      popup.style.left = `${Math.min(
        window.innerWidth - safeRight - popupWidth,
        Math.max(safeLeft, preferredLeft)
      )}px`;
      popup.style.top = `${Math.min(
        window.innerHeight - safeBottom - popupHeight,
        Math.max(safeTop, popupRect.top - popupHeight - 8)
      )}px`;
    }

    function startQuoteCommentFromSelection(quote, context = "") {
      const cleanedQuote = QUOTE_COMMENT_UTILS.cleanQuoteText(quote);
      if (!cleanedQuote) return;
      const discussion = detailBodyEl.querySelector(".discussion-section");
      const input = discussion?.querySelector("[data-discussion-input]");
      if (!discussion || !input) {
        showBanner("Log in as an approved contributor to quote this text.");
        return;
      }
      const body = QUOTE_COMMENT_UTILS.stripQuotedCommentPrefix(input.value);
      input.value = QUOTE_COMMENT_UTILS.formatQuotedComment(cleanedQuote, body, context || quoteSelectionContext());
      hideQuoteSelectionPopup();
      window.getSelection()?.removeAllRanges?.();
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      input.closest(".discussion-composer")?.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    function jumpToQuoteComment(commentId) {
      const target = detailBodyEl.querySelector(`[data-comment-card="${CSS.escape(String(commentId))}"]`);
      if (!target) return;
      target.scrollIntoView({ block: "center", behavior: "smooth" });
      target.classList.add("quote-jump-highlight");
      window.setTimeout(() => target.classList.remove("quote-jump-highlight"), 1400);
    }

    function jumpToCommentQuote(commentId) {
      const target = detailBodyEl.querySelector(`[data-quote-comment-anchor="${CSS.escape(String(commentId))}"]`);
      if (!target) {
        showBanner("The quoted text is not visible in this section.");
        return;
      }
      target.scrollIntoView({ block: "center", behavior: "smooth" });
      target.classList.add("quote-jump-highlight");
      window.setTimeout(() => target.classList.remove("quote-jump-highlight"), 1400);
    }

    function knownPlantStatsText(item, observations) {
      return PLANT_UTILS.knownPlantStatsText(item, observations, {
          normalizeText,
          observationText: observation => {
            const fields = observation.fields || observation;
            return `${fields.identification || ""} ${fields.name || ""}`;
          },
          uniqueSingular: "unique species",
          uniquePlural: "unique species",
          separator: " - ",
          detailSeparator: " - "
        });
    }

    function publicPlantText(value, fallback = "") {
      return PLANT_UTILS.publicPlantText(value, fallback, { cleanText: publicCleanText });
    }

    function plantObservationFactRows(fields = {}) {
      fields = enrichedPlantObservationFields(fields);
      const match = plantGuideMatchFromFields(fields);
      return PLANT_UTILS.plantObservationFactRows(fields, match, {
          cleanText: publicCleanText,
          normalizeText: normalizeComparisonText,
          algonquianValue: fields.algonquian,
          sourceValue: fields.source || match?.source || "",
          guidanceValue: fields.edible_safety || fields.guidance || ""
        });
    }

    function plantObservationFactsHtml(fields = {}) {
      return `
        <div class="site-plant-facts">
          ${plantObservationFactRows(fields).map(([label, value]) => `
            <div class="site-plant-fact"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>
          `).join("")}
        </div>
      `;
    }

    function openPlantPhotoViewer(src, title = "Plant photo") {
      if (!src || !plantPhotoViewerEl || !plantPhotoViewerImageEl) return;
      plantPhotoViewerImageEl.src = src;
      plantPhotoViewerImageEl.alt = title;
      if (plantPhotoViewerTitleEl) plantPhotoViewerTitleEl.textContent = title;
      plantPhotoViewerEl.hidden = false;
      document.body.classList.add("sheet-open");
    }

    function closePlantPhotoViewer() {
      if (!plantPhotoViewerEl || !plantPhotoViewerImageEl) return;
      plantPhotoViewerEl.hidden = true;
      plantPhotoViewerImageEl.removeAttribute("src");
      document.body.classList.remove("sheet-open");
    }

    function plantObservationGridHtml(sourceType, item) {
      const observations = plantObservationsForSource(sourceType, item);
      if (!observations.length) return "";
      return `
        <div class="site-plant-grid" aria-label="Plants reported at this site">
          <h4>Plants Identified at This Site</h4>
          <p class="detail-meta">${escapeHtml(knownPlantStatsText(item, observations))}</p>
          <div class="site-plant-cards">
            ${observations.slice(0, 8).map(comment => {
              const fields = enrichedPlantObservationFields(comment.fields || comment);
              const sourceRecord = comment.comment || comment;
              const author = state.contributorProfiles.find(profile => Number(profile.id) === Number(relationId(sourceRecord.member_profile)));
              const contributor = author?.display_name || fields.contributor || sourceRecord.author_name || "Contributor";
              const contributorKey = author?.id || author?.slug || contributor;
              const attachment = directusAssetUrl(sourceRecord.photo || sourceRecord.comment_image);
              const pending = normalizeCommentStatus(sourceRecord) !== "approved";
              const guideMatch = plantGuideMatchFromFields(fields);
              const context = publicPlantText(fields.context || guideMatch?.context || "");
              const rawStatusLabel = fields.status_label || plantStatusLabel(fields.identification);
              const statusLabel = /need|review|unavailable|pending/i.test(rawStatusLabel) ? "visitor suggested" : rawStatusLabel;
              const indigenousName = fields.algonquian || "Indigenous name not yet added";
              const commonName = publicPlantText(fields.name, "Plant observation").replace(/\s*\([^)]*needs review[^)]*\)/ig, "");
              const scientificName = fields.identification || "Scientific name not yet verified";
              const imageLabel = `${commonName}${scientificName && scientificName !== "Scientific name not yet verified" ? ` - ${scientificName}` : ""}`;
              const plantWiki = plantWikiArticleForMatch(guideMatch, commonName);
              const cardId = plantObservationDomId(sourceRecord);
              const detailsId = `${cardId}-details`;
              const detailLines = [
                fields.source ? `Identification source: ${fields.source}` : "",
                fields.guidance ? `Visitor guidance: ${publicPlantText(fields.guidance)}` : "",
                fields.native_status ? `Native status: ${publicPlantText(fields.native_status)}` : "Native status not yet documented",
                fields.invasive_status ? `Invasive status: ${publicPlantText(fields.invasive_status)}` : "Invasive status not yet documented",
                fields.medicinal_use ? `Medicinal use: ${publicPlantText(fields.medicinal_use)}` : "Medicinal use not shown without a source",
                fields.endangered_status ? `Endangered/sensitive status: ${fields.endangered_status}` : "Endangered/sensitive status not assessed",
                fields.vocabulary ? `Vocabulary: ${fields.vocabulary}` : "Indigenous name not yet added",
                fields.edible_safety ? `Safety: ${publicPlantText(fields.edible_safety)}` : "Safety: verify with a field guide or expert before touching, eating, or using"
              ].filter(Boolean);
              return `
                <article class="site-plant-card" id="${escapeHtml(cardId)}">
                  ${attachment ? `<button class="site-plant-image-button" type="button" data-plant-photo-view="${escapeHtml(attachment)}" data-plant-photo-title="${escapeHtml(imageLabel)}" aria-label="Open larger photo of ${escapeHtml(commonName)}"><img src="${escapeHtml(attachment)}" alt="" loading="lazy" decoding="async"></button>` : ""}
                  <div class="site-plant-card-body">
                    <span class="site-plant-card-title">${plantWikiLinkHtml(indigenousName, guideMatch)}</span>
                    <span>${plantWikiLinkHtml(commonName, guideMatch)}</span>
                    <span><em>${plantWikiLinkHtml(scientificName, guideMatch)}</em></span>
                    <span class="site-plant-status-pill">${escapeHtml(pending ? "Pending review" : statusLabel)}</span>
                    ${plantObservationFactsHtml(fields)}
                    ${context ? `<span class="site-plant-card-context">${escapeHtml(context)}</span>` : ""}
                    ${fields.visitor_notes ? `<span class="site-plant-card-context">${escapeHtml(fields.visitor_notes)}</span>` : ""}
                    <span class="site-plant-card-meta">
                      ${author ? `<button class="site-plant-contributor" type="button" data-open-mobile-profile="${escapeHtml(contributorKey)}">${escapeHtml(contributor)}</button>` : escapeHtml(contributor)}
                      ${sourceRecord.created_at ? ` - ${escapeHtml(new Date(sourceRecord.created_at).toLocaleDateString())}` : ""}${fields.confidence ? ` - ${escapeHtml(fields.confidence)}% confidence` : ""}
                    </span>
                    ${guideMatch ? (plantWiki?.slug
                      ? `<button class="site-plant-card-action" type="button" data-open-plant-wiki="${escapeHtml(plantWiki.slug)}">Open plant wiki</button>`
                      : `<button class="site-plant-card-action" type="button" data-open-native-plants="${escapeHtml(guideMatch.common)}">Open plant guide</button>`)
                      : `<span class="site-plant-card-meta">Plant guide not yet added.</span>`}
                    <button class="site-plant-card-action" type="button" data-plant-observation-details="${escapeHtml(detailsId)}">View observation details</button>
                    <details class="site-plant-card-details" id="${escapeHtml(detailsId)}">
                      <summary>Observation details</summary>
                      ${detailLines.map(line => `<p>${escapeHtml(line)}</p>`).join("")}
                    </details>
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }

    function currentCommentReactionState(commentOrId) {
      return COMMENT_UTILS.reactionState(commentOrId, currentContributorProfile(), {
        canVote: isApprovedContributor(),
        votes: state.commentVotes
      });
    }

    function commentReaction(commentId) {
      return currentCommentReactionState(commentId).active;
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
        fields: COMMENT_VOTE_FIELDS,
        fetchOptions: { fresh: true },
        merge: mergeCommentVoteRecords
      });
    }

    async function setCommentReaction(commentId, value) {
      const id = String(commentId);
      const profile = currentContributorProfile();
      if (!profile?.id || !isApprovedContributor()) {
        showBanner("Log in to mark comments helpful or report a concern.");
        return false;
      }
      const votedComment = state.publicComments.find(item => String(item.id) === id);
      if (currentViewerOwnsComment(votedComment)) {
        showBanner("You cannot vote on your own comment.");
        return false;
      }
      if (commentReaction(id)) {
        showBanner("Your vote for this comment is already saved.");
        return false;
      }
      const actionKey = `comment-vote:${id}:${profile.id}`;
      if (!mobileLearningActionGuard.begin(actionKey)) {
        showBanner("That comment vote is already being saved.");
        return false;
      }
      try {
        await refreshRemoteCommentVote(id, profile.id).catch(() => null);
        if (commentReaction(id)) {
          showBanner("Your vote for this comment is already saved.");
          return false;
        }
        const vote = COMMENT_UTILS.votePayload(id, value, profile);
        let created;
        try {
          created = await postDirectusItem("mobile_comment_votes", vote, { requireAuth: true });
        } catch (error) {
          await refreshRemoteCommentVote(id, profile.id).catch(() => null);
          if (commentReaction(id)) {
            showBanner("Your vote for this comment is already saved.");
            return false;
          }
          showBanner("Comment votes are not available yet. Please try again later.");
          return false;
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
          })).catch(error => {
            console.warn("Comment vote saved, but its point will retry later.", error);
            return null;
          });
        }
        document.querySelectorAll("[data-comment-actions]").forEach(container => {
          if (String(container.dataset.commentActions) !== id) return;
          const comment = state.publicComments.find(item => String(item.id) === id);
          if (comment) container.innerHTML = commentReactionControls(comment);
        });
        showBanner(value === "report" ? "Report saved." : "Comment vote saved.");
        return true;
      } finally {
        mobileLearningActionGuard.end(actionKey);
      }
    }

    function currentViewerOwnsComment(comment) {
      const profile = currentContributorProfile();
      const viewerEmail = String(state.profile?.email || profile?.username || "").toLowerCase();
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
      showBanner("Comment deleted.");
      const sourceType = normalizeCommentSourceType(comment);
      const sourceSlug = comment.source_slug || comment.site_slug || "";
      if (sourceType === "wiki" && sourceSlug) openWikiArticle(sourceSlug, { focus: false, skipCommentRefresh: true });
      else if (sourceSlug) openSite(sourceSlug, { focus: false, skipCommentRefresh: true });
      renderMobileActivitySheet();
    }

    function discussionHtml(sourceType, item) {
      const comments = commentsForSource(sourceType, item);
      const profile = currentContributorProfile();
      const canContribute = isApprovedContributor();
      const plantInputId = `plant-image-${String(item.slug || item.id || "site").replace(/[^a-z0-9_-]+/gi, "-")}`;
      const rootComments = comments.filter(comment => !comment.parent_comment && !isPlantObservationComment(comment));
      const repliesFor = parentId => comments.filter(comment => Number(comment.parent_comment) === Number(parentId));
      const renderComment = (comment, depth = 0) => {
        const author = state.contributorProfiles.find(profile => Number(profile.id) === Number(comment.member_profile));
        const parent = depth ? comments.find(item => Number(item.id) === Number(comment.parent_comment)) : null;
        const parentAuthor = parent ? state.contributorProfiles.find(profile => Number(profile.id) === Number(parent.member_profile)) : null;
        const parentName = parentAuthor?.display_name || parent?.author_name || "";
        const attachment = directusAssetUrl(comment.comment_image);
        const name = author?.display_name || comment.author_name || "Contributor";
        const avatar = directusAssetUrl(author?.avatar);
        const initial = (name || "?").trim().slice(0, 1) || "?";
        const pending = false;
        const parsedComment = QUOTE_COMMENT_UTILS.parseCommentRecord(comment);
        const commentBody = parsedComment.body || (!parsedComment.quote ? comment.comment || "" : "");
        return `
          <article class="comment${depth ? " reply" : ""}${pending ? " pending" : ""}" data-comment-card="${escapeHtml(comment.id || "")}" style="margin-left:${Math.min(Math.max(depth - 1, 0), 2) * 18}px">
            <span class="comment-avatar" aria-hidden="true">${avatar ? `<img src="${escapeHtml(avatar)}" alt="">` : escapeHtml(initial)}</span>
            <div>
              <div class="comment-bubble">
                ${depth ? `<span class="reply-label">Reply${parentName ? ` to ${escapeHtml(parentName)}` : ""}</span>` : ""}
                <strong class="comment-author">${escapeHtml(name)}</strong>
                ${QUOTE_COMMENT_UTILS.quoteCommentButtonHtml(comment, parsedComment.quote, parsedComment.context)}
                ${commentBody ? `<p class="comment-text">${escapeHtml(commentBody)}</p>` : ""}
                ${attachment ? `
                  <button class="comment-image-button" type="button" data-comment-photo-view="${escapeHtml(attachment)}" data-comment-photo-title="${escapeHtml(`${name} comment photo`)}" aria-label="Open comment photo">
                    <img class="comment-image" src="${escapeHtml(attachment)}" alt="" loading="lazy" decoding="async">
                  </button>
                ` : ""}
              </div>
              <div class="comment-meta-row">
                <span>${comment.created_at ? escapeHtml(new Date(comment.created_at).toLocaleString()) : "Approved comment"}</span>
                ${pending ? `<span class="comment-status-pill">Not public</span>` : ""}
                ${!pending ? `<span class="comment-actions" data-comment-actions="${escapeHtml(comment.id)}">${commentReactionControls(comment)}</span>` : ""}
                ${canContribute && !pending ? `<button class="comment-reply-button" type="button" data-reply-comment="${escapeHtml(comment.id)}" data-reply-profile="${escapeHtml(comment.member_profile || "")}">Reply</button>` : ""}
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
      return `
        <section class="section discussion-section" data-discussion-type="${escapeHtml(sourceType)}" data-discussion-id="${escapeHtml(item.id)}" data-discussion-slug="${escapeHtml(item.slug)}" data-discussion-title="${escapeHtml(item.title)}">
          <div class="discussion-heading">
            <span class="discussion-heading-icon" aria-hidden="true">"</span>
            <div>
              <h3>Community Notes</h3>
              <p>${rootComments.length ? `${rootComments.length} public note${rootComments.length === 1 ? "" : "s"} from contributors.` : "Add context, memories, corrections, or respectful questions for this place."}</p>
            </div>
          </div>
          <div class="comments">
            ${rootComments.length ? rootComments.map(comment => renderComment(comment)).join("") : `<div class="comment-empty-state"><strong>No community notes yet</strong><span>Be the first to add helpful context for future visitors.</span></div>`}
          </div>
          ${canContribute ? `
            <div class="discussion-composer">
              <span class="comment-avatar" aria-hidden="true">${currentAvatar ? `<img src="${escapeHtml(currentAvatar)}" alt="">` : escapeHtml(currentInitial)}</span>
              <div class="discussion-composer-panel">
                <div class="field">
                  <label for="comment-text">Comment as ${escapeHtml(currentName)}</label>
                  <textarea id="comment-text" data-discussion-input placeholder="Write a comment..."></textarea>
                </div>
                <div class="field">
                  <label for="comment-image">Optional photo</label>
                  <input id="comment-image" data-discussion-image type="file" accept="image/*" hidden>
                  <div class="discussion-composer-actions">
                    <button class="action secondary" type="button" data-take-comment-photo>Take photo</button>
                    <button class="action secondary" type="button" data-choose-comment-photo>Choose photo</button>
                  </div>
                  <p class="comment-photo-status" data-comment-photo-status hidden></p>
                  <img class="comment-photo-preview" data-comment-photo-preview alt="" hidden>
                </div>
                <p class="contributor-limit-note">${escapeHtml(contributorDailyLimitMessage("comments", profile))}</p>
                <div class="discussion-composer-actions">
                  <button class="action secondary" type="button" data-submit-discussion>Post comment</button>
                  <button class="action secondary" type="button" data-cancel-reply hidden>Cancel reply</button>
                </div>
              </div>
            </div>
            <input type="hidden" data-parent-comment value="">
            <input type="hidden" data-reply-to-profile value="">
          ` : `
            <p class="summary">${escapeHtml(contributorWritePrompt())}</p>
            <button class="action secondary" type="button" data-open-login>Login</button>
          `}
          ${sourceType === "site" ? `
            ${plantObservationGridHtml(sourceType, item)}
            <details class="plant-observation-panel" data-plant-observation>
              <summary>
                <span class="plant-report-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M12 21c-1.2-4.8-.3-8.3 2.8-10.6 1.8-1.3 4.1-1.8 6.7-1.4-.4 2.8-1.5 5-3.3 6.6-1.7 1.5-3.8 2.1-6.2 1.8"/><path d="M11.2 16.3c-2.6.3-4.8-.4-6.4-2C3.2 12.7 2.4 10.6 2.3 8c2.7-.2 5 .4 6.7 1.9 1.9 1.6 2.6 3.8 2.2 6.4Z"/><path d="M12 21V9"/></svg>
                </span>
                <span>
                  <strong>Report a plant seen here</strong>
                  <small>Help document the living landscape with one clear photo.</small>
                </span>
              </summary>
              <p class="detail-meta">Take or upload one clear plant photo. You can review the result before submitting it to this site.</p>
              <button class="site-plant-card-action plant-guide-button" type="button" data-open-native-plants>Open Native plants guide</button>
              <div class="plant-camera-row">
                <div class="plant-camera-actions">
                  <button class="action plant-camera-trigger" type="button" data-take-plant-photo>Take plant photo</button>
                  <button class="action secondary plant-camera-trigger" type="button" data-upload-plant-photo>Upload photo</button>
                </div>
                <input id="${escapeHtml(plantInputId)}" data-plant-image type="file" accept="image/*" capture="environment">
              </div>
              <div data-plant-preview>
                <div class="plant-context-card">
                  <strong>Plant identification</strong>
                  <span>Take a photo to generate a review-ready plant report with safety guidance and Indigenous vocabulary context when available.</span>
                </div>
              </div>
              <div class="field">
                <label for="plant-notes">Optional observation note</label>
                <textarea id="plant-notes" data-plant-notes placeholder="Where was it seen? Flowering, fruiting, wetland edge, dune, woods..."></textarea>
              </div>
              ${canContribute ? `
                <p class="plant-safety-warning plant-submit-limit-note">${escapeHtml(contributorDailyLimitMessage("plants", profile))} The first goal is 100 profile points.<span data-plant-limit-status></span></p>
                <button class="action" type="button" data-submit-plant-report disabled>Take a plant photo first</button>
              ` : `<p class="summary">Login as an approved contributor to submit plant observations.</p>`}
            </details>
          ` : ""}
        </section>
      `;
    }

    async function submitMobileDiscussion(section) {
      const submitButton = section.querySelector("[data-submit-discussion]");
      const originalLabel = submitButton?.textContent || "Post comment";
      const profile = currentContributorProfile();
      if (!profile || !isApprovedContributor()) {
        showBanner(contributorWritePrompt());
        return;
      }
      if (!contributorCanUseDailyAction("comments", profile)) return;
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
      const sourceType = section.dataset.discussionType;
      const sourceSlug = section.dataset.discussionSlug;
      const sourceTitle = section.dataset.discussionTitle;
      const parentComment = section.querySelector("[data-parent-comment]")?.value || null;
      const replyToProfile = section.querySelector("[data-reply-to-profile]")?.value || null;
      const actionKey = `comment-submit:${profile.id}:${sourceType}:${section.dataset.discussionId || sourceSlug}:${parentComment || "root"}`;
      if (!mobileLearningActionGuard.begin(actionKey)) {
        showBanner("That comment is already being posted.");
        return;
      }
      try {
      let image = section._commentPhotoFile || section.querySelector("[data-discussion-image]")?.files?.[0] || null;
      if (image && image !== section._commentPhotoFile) {
        try {
          image = await prepareSelectedCommentPhoto(section);
        } catch (error) {
          showBanner(error.message || "Could not prepare that comment photo.");
          return;
        }
      }
      const imageError = validateJpegImage(image);
      if (imageError) {
        showBanner(imageError);
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
        imageId = null;
        showBanner("The image could not upload, so the comment will post without it.");
      }
      if (submitButton) submitButton.textContent = "Posting...";
      const quoteContextFields = QUOTE_COMMENT_UTILS.quoteCommentContextFields(text, {
        source_type: sourceType,
        source_title: sourceTitle
      });
      const payload = {
        status: "approved",
        public_activity: true,
        source_type: sourceType,
        source_id: Number(section.dataset.discussionId) || null,
        source_slug: sourceSlug,
        source_title: sourceTitle,
        ...quoteContextFields,
        article_url: ROUTE_UTILS.publicArchiveUrl({ [sourceType === "wiki" ? "wiki" : "site"]: sourceSlug }, { baseUrl: PUBLIC_ARCHIVE_BASE }),
        site_slug: sourceType === "site" ? sourceSlug : null,
        site_title: sourceType === "site" ? sourceTitle : null,
        member_profile: profile.id || null,
        author_name: profile.display_name || profile.username || state.profile?.email || "Contributor",
        author_email: state.profile?.email || profile.username || "",
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
          author_email: state.profile?.email || "",
          _local_pending: true
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
          }).then(() => {
            state.profileActivityCache = null;
            renderProfile();
            renderRewards();
          }).catch(error => {
            console.warn("Comment posted, but its point will retry later.", error);
            return null;
          });
        }
        if (replyToProfile && profile.id && Number(replyToProfile) !== Number(profile.id)) {
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
            platform: "mobile"
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
      if (section.dataset.activityInline === "true") {
        const card = section.closest("[data-mobile-activity-key]");
        const key = card?.dataset.mobileActivityKey || "";
        if (key) {
          state.mobileActivityDrafts.delete(key);
          state.mobileActivityDiscussionKeys.add(key);
        }
        state.mobileActivityRenderedSignature = "";
        renderMobileActivitySheet();
      } else if (sourceType === "site" && sourceSlug) openSite(sourceSlug, { focus: false, skipCommentRefresh: true });
      else if (sourceType === "wiki" && sourceSlug) openWikiArticle(sourceSlug, { focus: false, skipCommentRefresh: true });
      } finally {
        mobileLearningActionGuard.end(actionKey);
      }
    }

    async function submitPlantObservation(section) {
      const discussion = section.closest(".discussion-section");
      const profile = currentContributorProfile();
      if (!profile || !isApprovedContributor()) {
        showBanner(state.profile?.pending
          ? "Your account is waiting for approval before plant reports can be submitted."
          : "Login as an approved contributor before submitting plant reports.");
        return;
      }
      await refreshRemotePlantObservationsForProfile(profile).catch(() => []);
      if (!contributorCanUseDailyAction("plants", profile)) {
        renderPlantContext(section);
        return;
      }
      const site = state.selectedSite || state.sites.find(item => item.slug === discussion?.dataset.discussionSlug);
      let image = section._plantPhotoFile || section.querySelector("[data-plant-image]")?.files?.[0] || null;
      if (!image) {
        showBanner("Take a plant photo first.");
        return;
      }
      if (!section._plantPhotoFile) image = await compressPlantImage(image);
      const imageError = validatePlantImage(image);
      if (imageError) {
        showBanner(imageError);
        return;
      }
      const notes = section.querySelector("[data-plant-notes]")?.value?.trim() || "";
      if (!section._plantAnalysis) {
        section._plantAnalysis = await analyzePlantPhoto(image, section);
        renderPlantContext(section);
      }
      const guess = plantObservationGuess(section, section._plantAnalysis);
      const button = section.querySelector("[data-submit-plant-report]");
      const originalLabel = button?.textContent || "Submit to this site's plant grid";
      if (button) {
        button.disabled = true;
        button.textContent = "Uploading photo...";
      }
      let imageId = null;
      try {
        imageId = await uploadDirectusFile(image, `Plant observation - ${site?.title || "On This Site"}`, { requireAuth: true });
        if (button) button.textContent = "Submitting...";
        const observationPayload = plantObservationPayload({ site, discussion, profile, analysis: section._plantAnalysis, guess, notes, imageId });
        const createdObservation = await postDirectusItem("mobile_plant_observations", observationPayload, { requireAuth: true });
        mergePlantObservationRecords([{
          id: createdObservation.data?.id || `plant-${Date.now()}`,
          ...observationPayload,
          ...(createdObservation.data || {})
        }]);
        showBanner("Plant added to this site's plant grid.");
        syncSitePlantMarkers(site);
        if (site?.slug) openSite(site.slug, { focus: false, skipCommentRefresh: true });
      } catch (error) {
        showBanner(error.message || "Could not submit plant observation.");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      }
    }

    function storyTerritoryFor(site) {
      if (!site) return "";
      if (isBroadTerritory(site)) return site.title || "";
      const point = site.center || geometryCenter(siteDisplayGeometry(site));
      if (!point) return "";
      const territories = state.mapSites
        .filter(candidate => candidate?.slug !== site.slug && isBroadTerritory(candidate))
        .map(candidate => ({ site: candidate, geometry: siteDisplayGeometry(candidate) }))
        .filter(candidate => pointInGeometry(point, candidate.geometry))
        .sort((a, b) => geometryBoundsArea(a.geometry) - geometryBoundsArea(b.geometry));
      return territories[0]?.site?.title || "";
    }

    function storyPartsFor(site) {
      if (!site) {
        return {
          lead: "",
          intro: "Choose a site to create a story overlay.",
          why: "",
          visit: "Visit www.nativelongisland.com to learn more about this place."
        };
      }
      const territory = publicCleanText(storyTerritoryFor(site));
      const siteName = publicCleanText(site.title || "this place");
      const lead = territory && normalizeText(territory) !== normalizeText(siteName)
        ? `I am on ${territory} at ${siteName}.`
        : (territory ? `I am on ${territory}.` : `I am at ${siteName}.`);
      const intro = publicCleanText(site.introduction_content || site.summary || "");
      const why = publicCleanText(site.preservation_content || site.history_content || site.oral_history_content || "");
      return {
        lead,
        intro,
        why,
        visit: "Visit www.nativelongisland.com to learn more about this place."
      };
    }

    function splitStoryCaptionText(text, maxLength = 92) {
      const cleaned = publicCleanText(text || "").replace(/\s+/g, " ").trim();
      if (!cleaned) return [];
      const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
      const blocks = [];
      let current = "";
      sentences.forEach(sentence => {
        const value = sentence.trim();
        if (!value) return;
        const next = current ? `${current} ${value}` : value;
        if (next.length <= maxLength) {
          current = next;
          return;
        }
        if (current) blocks.push(current);
        if (value.length <= maxLength) {
          current = value;
          return;
        }
        const words = value.split(/\s+/);
        let line = "";
        words.forEach(word => {
          const candidate = line ? `${line} ${word}` : word;
          if (candidate.length > maxLength && line) {
            blocks.push(line);
            line = word;
          } else {
            line = candidate;
          }
        });
        current = line;
      });
      if (current) blocks.push(current);
      return blocks.filter(Boolean);
    }

    function storyCaptionBlocksFor(site) {
      const parts = storyPartsFor(site);
      const bodyText = [parts.intro, parts.why].filter(Boolean).join(" ");
      const bodyBlocks = splitStoryCaptionText(bodyText, 88).slice(0, 12);
      const blocks = [
        { kicker: "On This Site", text: parts.lead || "Choose a place to begin.", footer: "" },
        ...bodyBlocks.map(text => ({ kicker: "", text, footer: "" })),
        { kicker: "", text: "Learn more in the On This Site archive.", footer: "nativelongisland.com" }
      ].filter(block => block.text);
      return blocks.length ? blocks : [{ kicker: "On This Site", text: "Choose a site to create a story overlay.", footer: "" }];
    }

    function storyCaptionDurationMs(blocks = []) {
      return Math.min(90000, Math.max(18000, (blocks.length || 1) * 4800));
    }

    function storyCaptionHtmlFor(site) {
      const blocks = storyCaptionBlocksFor(site);
      return blocks.map((block, index) => `
        <section class="story-caption-block" style="--story-caption-index: ${index}" aria-hidden="${index === 0 ? "false" : "true"}">
          ${block.kicker ? `<span class="story-caption-kicker">${escapeHtml(block.kicker)}</span>` : ""}
          <strong class="story-caption-line">${escapeHtml(block.text)}</strong>
          ${block.footer ? `<span class="story-caption-footer">${escapeHtml(block.footer)}</span>` : ""}
        </section>
      `).join("");
    }

    function openExhibit(exhibit) {
      detailTitleEl.innerHTML = `
        <h2>${escapeHtml(exhibit.title)}</h2>
        <p class="detail-meta">${escapeHtml([CALENDAR_UTILS.exhibitDateLabel(exhibit), exhibit.venue || exhibit.address_label, CALENDAR_UTILS.eventTypeLabel(exhibit.event_type || exhibit.status)].filter(Boolean).join(" - "))}</p>
      `;
      detailBodyEl.innerHTML = `
        ${exhibit.summary ? `<p class="summary">${escapeHtml(exhibit.summary)}</p>` : ""}
        ${exhibit.body ? `<section class="section"><h3>Details</h3><div>${cleanHtml(exhibit.body)}</div></section>` : ""}
        ${(exhibit.collection_piece_title || exhibit.collection_artist || exhibit.collection_date) ? `
          <section class="section">
            <h3>Collection Moment</h3>
            ${exhibit.collection_piece_title ? `<p><strong>${escapeHtml(exhibit.collection_piece_title)}</strong></p>` : ""}
            ${exhibit.collection_artist ? `<p>${escapeHtml(exhibit.collection_artist)}</p>` : ""}
            ${exhibit.collection_date ? `<p>${escapeHtml(CALENDAR_UTILS.exhibitDateLabel({ collection_date: exhibit.collection_date }))}</p>` : ""}
          </section>
        ` : ""}
        <div class="actions">
          <a class="action purple" href="${escapeHtml(googleMapsUrl(exhibit))}" target="_blank" rel="noreferrer">Directions</a>
          ${exhibit.external_url ? `<a class="action secondary" href="${escapeHtml(exhibit.external_url)}" target="_blank" rel="noreferrer">Event link</a>` : ""}
          ${isAdminContributor() ? `<a class="action secondary" href="${DIRECTUS}/admin/content/calendar_events/${escapeHtml(exhibit.id)}" target="_blank" rel="noreferrer">Edit event</a>` : ""}
          <button class="action secondary" type="button" id="mark-visited">Mark visited</button>
          <button class="action secondary" type="button" id="check-in-site">Check in nearby</button>
        </div>
      `;
      state.selectedSite = exhibit;
      syncActiveSiteMapLabel(exhibit);
      detailEl.classList.add("open");
      syncMobilePanelAccessibility();
      if (exhibit.center && state.map) {
        state.map.easeTo({ center: exhibit.center, zoom: 12, duration: 650 });
      }
    }

    function mobileBiographyPathData(article) {
      if (!article?.slug || !BIOGRAPHY_WIKI_SLUGS.has(article.slug)) return null;
      const path = BIOGRAPHY_PLACE_PATHS[article.slug];
      if (!path?.places?.length) return null;
      const places = path.places.filter(place => Array.isArray(place.coordinates) && place.coordinates.every(Number.isFinite));
      if (places.length < 2) return null;
      return { ...path, places };
    }

    function mobileBiographyPathPersonName(article, fallbackSlug = "") {
      const title = stripHtml(article?.title || "").trim();
      if (title) return title;
      const pathTitle = stripHtml(BIOGRAPHY_PLACE_PATHS[fallbackSlug]?.title || "").replace(/\s+(associated\s+places|life\s+timeline|timeline|path|places).*$/i, "").trim();
      if (pathTitle) return pathTitle;
      return String(fallbackSlug || "Biography").split("-").filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
    }

    function mobileBiographyPathWordCount(value) {
      return String(value || "").trim().split(/\s+/).filter(Boolean).length;
    }

    function mobileBiographyPathCompactWords(value, maxWords = 3) {
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

    function mobileBiographyPathCompactPersonName(person) {
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

    function mobileBiographyPathCompactPlace(place = {}) {
      const candidates = [place.place, place.label].filter(Boolean);
      for (const candidate of candidates) {
        let text = stripHtml(candidate)
          .replace(/^\s*\d{3,4}\s*[-–—]\s*/g, "")
          .replace(/\([^)]*\)/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (text.includes(" - ")) text = text.split(" - ").pop().trim();
        text = text.split(/[,;/]/)[0].replace(/\b(area|region|context)\b/ig, "").replace(/\s+/g, " ").trim();
        const compact = mobileBiographyPathCompactWords(text, 3);
        if (compact) return compact;
      }
      return "this place";
    }

    function mobileBiographyPathActionText(place = {}) {
      const text = `${place.label || ""} ${place.place || ""} ${place.reason || ""}`.toLowerCase();
      if (/teach|teacher|school|training|college/.test(text)) return "to teach";
      if (/testif|testimony|voting|rights/.test(text)) return "for testimony";
      if (/powwow|address|voice|speak|speech/.test(text)) return "to speak";
      if (/negot|alliance|diplomac|sachem|leader/.test(text)) return "for diplomacy";
      if (/war|pequot/.test(text)) return "after war";
      if (/record|deed|land|source/.test(text)) return "to document land history";
      if (/minister|preach|mission/.test(text)) return "to preach";
      if (/advocacy|advocate/.test(text)) return "for advocacy";
      if (/born|birth|homeland|home/.test(text)) return "for roots";
      if (/funeral|remembrance|community|tribute/.test(text)) return "for community";
      return "for history";
    }

    function mobileBiographyPathActionLabel(person, place = {}) {
      const who = mobileBiographyPathCompactPersonName(person);
      const where = mobileBiographyPathCompactPlace(place);
      const action = mobileBiographyPathActionText(place);
      let label = `${who} visits ${where} ${action}`.replace(/\s+/g, " ").trim();
      if (mobileBiographyPathWordCount(label) <= 10) return label;
      label = `${who} visits ${mobileBiographyPathCompactWords(where, 2)} ${action}`.replace(/\s+/g, " ").trim();
      if (mobileBiographyPathWordCount(label) <= 10) return label;
      return `${who} visits ${mobileBiographyPathCompactWords(where, 2)}`.replace(/\s+/g, " ").trim();
    }

    function mobileBiographyPathTimelineLabel(place = {}) {
      const title = stripHtml(place.title || place.label || place.place || "Mapped place")
        .replace(/\s+/g, " ")
        .trim();
      const date = stripHtml(place.dateLabel || place.date_label || "")
        .replace(/\s+/g, " ")
        .trim();
      const titleLower = title.toLowerCase();
      const dateLower = date.toLowerCase();
      if (!date || titleLower.startsWith(dateLower) || titleLower.includes(dateLower)) return title;
      return `${date} - ${title}`;
    }

    function mobileBiographyPathMapPinLabel(place = {}, order = 1) {
      return `${order} - ${mobileBiographyPathTimelineLabel(place)}`.replace(/\s+/g, " ").trim();
    }

    function mobileBiographyPathCompactTimelineLabel(place = {}) {
      const title = stripHtml(place.title || place.label || place.place || "Mapped place")
        .replace(/\s+/g, " ")
        .trim();
      const date = stripHtml(place.dateLabel || place.date_label || "")
        .replace(/\s+/g, " ")
        .trim();
      const compactTitle = mobileBiographyPathCompactWords(title, 5);
      if (!date || title.toLowerCase().includes(date.toLowerCase())) return compactTitle;
      return `${date} - ${compactTitle}`.replace(/\s+/g, " ").trim();
    }

    function mobileBiographyPathCompactMapPinLabel(place = {}, order = 1) {
      return `${order} - ${mobileBiographyPathCompactTimelineLabel(place)}`.replace(/\s+/g, " ").trim();
    }

    function mobileBiographyPathLabelCoordinates(places = [], index = 0) {
      const place = places[index] || {};
      const coordinates = Array.isArray(place.coordinates) ? place.coordinates : null;
      // Keep the callout at its dotted-line endpoint, not an invented location.
      return coordinates?.every(Number.isFinite) ? coordinates : null;
    }

    function mobileBiographyPathsEnabled() {
      return state.settings.showBiographyPaths === true;
    }

    // Keep the mobile map's visual route faithful to the reviewed desktop route:
    // routePlaces can add travel detail, while break flags deliberately prevent a
    // line from implying a journey that the source does not document.
    function mobileBiographyRoutePlaces(path) {
      return (path?.routePlaces?.length >= 2 ? path.routePlaces : path?.places) || [];
    }

    function mobileBiographyRouteLineGeometry(path) {
      const places = mobileBiographyRoutePlaces(path);
      const lines = [];
      let current = [];
      places.forEach((place, index) => {
        const coordinates = Array.isArray(place) ? place : place?.coordinates;
        if (!Array.isArray(coordinates) || !coordinates.every(Number.isFinite)) return;
        const previous = places[index - 1];
        const breaksFromPrevious = index > 0 && (previous?.skipToNext || place?.skipFromPrevious);
        if (breaksFromPrevious) {
          if (current.length >= 2) lines.push(current);
          current = [coordinates];
        } else {
          current.push(coordinates);
        }
      });
      if (current.length >= 2) lines.push(current);
      if (lines.length > 1) return { type: "MultiLineString", coordinates: lines };
      return { type: "LineString", coordinates: lines[0] || places.map(place => Array.isArray(place) ? place : place?.coordinates).filter(Boolean) };
    }

    function allMobileBiographyPathFeatureCollection({ enabled = false } = {}) {
      if (!enabled) return { type: "FeatureCollection", features: [] };
      const features = [];
      for (const slug of Object.keys(BIOGRAPHY_PLACE_PATHS)) {
        const article = state.wikiBySlug.get(slug) || { slug, title: BIOGRAPHY_PLACE_PATHS[slug]?.title || "" };
        const path = mobileBiographyTimelineData(article, timelineEventsForSource("wiki", article.id, slug)) || mobileBiographyPathData(article);
        if (path?.hidePath) continue;
        if (!path?.places?.length) continue;
        const person = mobileBiographyPathPersonName(article, slug);
        features.push({
          type: "Feature",
          geometry: mobileBiographyRouteLineGeometry(path),
          properties: { kind: "path", person, wiki_slug: slug, title: `${person} learning path` }
        });
        path.places.forEach((place, index) => {
          const order = index + 1;
          const pathLabel = mobileBiographyPathTimelineLabel(place);
          const numberedPathLabel = mobileBiographyPathMapPinLabel(place, order);
          const compactPathLabel = mobileBiographyPathCompactMapPinLabel(place, order);
          const labelCoordinates = mobileBiographyPathLabelCoordinates(path.places, index);
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

    function mobileTimelineEventCoordinates(event = {}) {
      const lng = Number(event.longitude);
      const lat = Number(event.latitude);
      return Number.isFinite(lng) && Number.isFinite(lat) && lng >= -76 && lng <= -70.5 && lat >= 39.5 && lat <= 42.5 ? [lng, lat] : null;
    }

    function normalizedMobileBiographyPlaceText(value) {
      return normalizeText(stripHtml(String(value || ""))).replace(/[^a-z0-9]+/g, " ").trim();
    }

    function mobileBiographyPlaceMatchesEvent(place, event) {
      if (!place || !event) return false;
      const placeText = normalizedMobileBiographyPlaceText([place.label, place.place].filter(Boolean).join(" "));
      const eventText = normalizedMobileBiographyPlaceText([
        timelineLocationLabel(event),
        timelineTitle(event),
        event.source_title,
        event.description
      ].filter(Boolean).join(" "));
      if (!placeText || !eventText) return false;
      if (eventText.includes(placeText) || placeText.includes(eventText)) return true;
      const placeTerms = placeText.split(" ").filter(term => term.length >= 5);
      return placeTerms.some(term => eventText.includes(term));
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

    function mobileBiographyTimelineData(article, events = []) {
      const path = mobileBiographyPathData(article);
      return TIMELINE_UTILS.buildBiographyTimelineData({
        article,
        path,
        events,
        matchesEvent: mobileBiographyPlaceMatchesEvent,
        coordinatesForEvent: mobileTimelineEventCoordinates,
        sortValue: timelineSortValue,
        dateLabel: timelineLabel,
        title: timelineTitle,
        location: timelineLocationLabel,
        descriptionHtml: event => event.description ? cleanHtml(timelineDisplayDescription(event)) : "",
        sourceNote: timelineSourceText,
        reasonText: event => stripHtml(timelineDisplayDescription(event)),
        escapeHtml
      });
    }

    function mobileBiographyPathHtml(article, events = []) {
      const path = mobileBiographyTimelineData(article, events);
      if (!path) return historicMomentsHtml(events);
      return `
        <section class="section mobile-biography-path-section">
          <h3>Life timeline and places</h3>
          ${path.note ? `<p class="detail-meta">${escapeHtml(path.note)}</p>` : ""}
          <div class="mobile-biography-path-list">
            ${path.entries.map(entry => `
              <article class="timeline-item mobile-biography-timeline-entry" ${entry.event?.id ? `id="timeline-moment-${escapeHtml(entry.event.id)}" data-event-id="${escapeHtml(entry.event.id)}"` : ""}>
                <div class="timeline-year">${escapeHtml(entry.dateLabel || "Mapped place")}</div>
                ${Number.isFinite(entry.pathIndex) ? `
                  <button class="mobile-biography-path-place" type="button" data-mobile-biography-path-index="${entry.pathIndex}" aria-label="Show ${escapeHtml(entry.title)} on the map">
                    <span class="mobile-biography-path-number">${entry.mapOrder}</span>
                    <span>
                      <strong>${escapeHtml(entry.title)}</strong>
                      ${entry.location ? `<em>${escapeHtml(entry.location)}</em>` : ""}
                    </span>
                  </button>
                ` : `
                  ${entry.location ? `<p class="timeline-location"><strong>Location:</strong> ${escapeHtml(entry.location)}</p>` : ""}
                  <div class="timeline-body"><p><strong>${escapeHtml(entry.title)}</strong></p></div>
                `}
                ${entry.descriptionHtml ? `<div class="timeline-body">${entry.descriptionHtml}</div>` : ""}
                ${isAdminContributor() && entry.event?.id ? `<div class="actions"><button class="action secondary" type="button" data-open-frontend-editor="timeline" data-editor-slug="${escapeHtml(entry.event.id)}">Edit moment</button></div>` : ""}
                ${entry.sourceNote ? `
                  <button class="timeline-source-info" type="button" data-timeline-source-info data-source-reference="${escapeHtml(entry.sourceNote)}" aria-label="Show source reference" aria-expanded="false" title="${escapeHtml(entry.sourceNote)}">i</button>
                  <div class="timeline-source-popover" role="note"><div>${HTML_UTILS.sourceReferenceTextHtml(entry.sourceNote, { escapeHtml })}</div><div class="timeline-source-copy-hint">Source reference.</div></div>
                ` : ""}
              </article>
            `).join("")}
          </div>
        </section>
      `;
    }

    function mobileBiographyPathFeatureCollection(path, article = null) {
      if (!path?.places?.length) return { type: "FeatureCollection", features: [] };
      const person = mobileBiographyPathPersonName(article, article?.slug || "");
      return {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: mobileBiographyRouteLineGeometry(path),
            properties: { kind: "path", title: `${person || path.title || "Biography"} path`, person, wiki_slug: article?.slug || "" }
          },
          ...path.places.map((place, index) => {
            const order = index + 1;
            const pathLabel = mobileBiographyPathTimelineLabel(place);
            const numberedPathLabel = mobileBiographyPathMapPinLabel(place, order);
            const compactPathLabel = mobileBiographyPathCompactMapPinLabel(place, order);
            return {
              type: "Feature",
              geometry: { type: "Point", coordinates: place.coordinates },
              properties: {
                kind: "point",
                person,
                wiki_slug: article?.slug || "",
                order,
                label: String(order),
                pin_label: numberedPathLabel,
                compact_pin_label: compactPathLabel,
                title: pathLabel,
                place: place.place || "",
                reason: place.reason || "",
                event_id: place.event_id || place.eventId || ""
              }
            };
          }),
          ...path.places.map((place, index) => {
            const order = index + 1;
            const pathLabel = mobileBiographyPathTimelineLabel(place);
            const numberedPathLabel = mobileBiographyPathMapPinLabel(place, order);
            const compactPathLabel = mobileBiographyPathCompactMapPinLabel(place, order);
            return {
              type: "Feature",
              geometry: { type: "Point", coordinates: mobileBiographyPathLabelCoordinates(path.places, index) || place.coordinates },
              properties: {
                kind: "label",
                person,
                wiki_slug: article?.slug || "",
                order,
                label: String(order),
                pin_label: numberedPathLabel,
                compact_pin_label: compactPathLabel,
                title: pathLabel,
                place: place.place || "",
                reason: place.reason || "",
                event_id: place.event_id || place.eventId || ""
              }
            };
          })
        ]
      };
    }

    function clearMobileBiographyPathOverlay() {
      if (state.map) {
        for (const id of ["mobile-biography-place-labels", "mobile-biography-place-points", "mobile-biography-place-path"]) {
          if (state.map.getLayer(id)) state.map.removeLayer(id);
        }
        if (state.map.getSource("mobile-biography-place-path")) state.map.removeSource("mobile-biography-place-path");
      }
      if (Array.isArray(state.mobileBiographyPathMarkers)) {
        state.mobileBiographyPathMarkers.forEach(marker => marker?.remove?.());
      }
      state.mobileBiographyPathMarkers = [];
      state.activeMobileBiographyPath = null;
    }

    function promoteMobileBiographyPathLayers() {
      if (!state.map) return;
      for (const id of ["mobile-biography-place-path", "mobile-biography-place-points", "mobile-biography-place-labels"]) {
        if (state.map.getLayer(id)) state.map.moveLayer(id);
      }
    }

    function focusMobileBiographyPathPlace(pathOrArticle, index = 0, options = {}) {
      const path = pathOrArticle?.places ? pathOrArticle : (state.activeMobileBiographyPath?.places ? state.activeMobileBiographyPath : mobileBiographyPathData(pathOrArticle));
      if (!path?.places?.length || !state.map) return false;
      const place = path.places[Math.max(0, Math.min(path.places.length - 1, Number(index) || 0))];
      if (!place?.coordinates?.every(Number.isFinite)) return false;
      state.map.flyTo?.({
        center: place.coordinates,
        zoom: Number.isFinite(Number(options.zoom)) ? Number(options.zoom) : 12,
        duration: Number.isFinite(Number(options.duration)) ? Number(options.duration) : 720,
        essential: true
      });
      return true;
    }

    function showMobileBiographyPathOverlay(article, options = {}) {
      const path = mobileBiographyTimelineData(article, options.events || []);
      clearMobileBiographyPathOverlay();
      if (!path || !state.map) return;
      state.activeMobileBiographyPath = path;
      state.map.addSource("mobile-biography-place-path", { type: "geojson", data: mobileBiographyPathFeatureCollection(path, article) });
      const beforeLayer = state.map.getLayer("mobile-site-icons") ? "mobile-site-icons" : undefined;
      state.map.addLayer({
        id: "mobile-biography-place-path",
        type: "line",
        source: "mobile-biography-place-path",
        filter: ["==", ["get", "kind"], "path"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#59605c",
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 2.5, 12, 4.5],
          "line-opacity": 0.88,
          "line-dasharray": ["literal", [1.2, 1.1]]
        }
      }, beforeLayer);
      state.map.addLayer({
        id: "mobile-biography-place-points",
        type: "circle",
        source: "mobile-biography-place-path",
        filter: ["==", ["get", "kind"], "point"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 6, 12, 10],
          "circle-color": "#59605c",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
          "circle-opacity": 0.96
        }
      });
      state.map.addLayer({
        id: "mobile-biography-place-labels",
        type: "symbol",
        source: "mobile-biography-place-path",
        filter: ["==", ["get", "kind"], "label"],
        minzoom: 8.2,
        layout: {
          "text-field": ["step", ["zoom"], ["get", "compact_pin_label"], 10.6, ["get", "pin_label"]],
          "text-size": ["interpolate", ["linear"], ["zoom"], 8.2, 8, 13, 10.75],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-variable-anchor": ["literal", ["top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"]],
          "text-radial-offset": ["interpolate", ["linear"], ["zoom"], 8.2, 0.78, 13, 1.16],
          "text-justify": "auto",
          "text-max-width": ["interpolate", ["linear"], ["zoom"], 8.2, 5.25, 13, 7.5],
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
      promoteMobileBiographyPathLayers();
      if (options.focus !== false) focusMobileBiographyPathPlace(path, 0, { zoom: 10.9, duration: 760 });
    }

    function mobileMovingRouteSegments(route = []) {
      return route.slice(0, -1).map((start, index) => {
        const end = route[index + 1];
        return { start, end, distance: milesBetween(start, end) || 0 };
      }).filter(segment => segment.start?.every(Number.isFinite) && segment.end?.every(Number.isFinite));
    }

    function mobileMovingCoordinateAt(route = [], progress = 0) {
      const segments = mobileMovingRouteSegments(route);
      const total = segments.reduce((sum, segment) => sum + segment.distance, 0);
      if (!segments.length || total <= 0) return route[0] || null;
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

    function mobileMovingPingPong(route = [], oneWayMs = 600000, offsetMs = 0, now = performance.now()) {
      const cycle = Math.max(1000, oneWayMs * 2);
      const elapsed = (((now + offsetMs) % cycle) + cycle) % cycle;
      const movingRight = elapsed <= oneWayMs;
      const progress = movingRight ? elapsed / oneWayMs : 1 - ((elapsed - oneWayMs) / oneWayMs);
      const coordinates = mobileMovingCoordinateAt(route, progress) || route[0] || [FALLBACK_CENTER[0], FALLBACK_CENTER[1]];
      const sample = mobileMovingCoordinateAt(route, Math.min(1, Math.max(0, progress + (movingRight ? 0.01 : -0.01)))) || coordinates;
      return {
        coordinates,
        direction: sample[0] >= coordinates[0] ? "right" : "left",
        progress
      };
    }

    function mobileMovingRouteDuration(route = []) {
      const totalMiles = mobileMovingRouteSegments(route).reduce((sum, segment) => sum + segment.distance, 0);
      return Math.max(360000, Math.min(1440000, totalMiles * 42000));
    }

    const MOBILE_CANOE_LAND_SAMPLE_RADIUS_DEG = 0.00022;

    function mobileMovingLandSamples(coordinates = []) {
      const lng = Number(coordinates?.[0]);
      const lat = Number(coordinates?.[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return [];
      const radius = MOBILE_CANOE_LAND_SAMPLE_RADIUS_DEG;
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

    function mobileMovingPointIsOnLand(coordinates = []) {
      // Before land data arrives, use the safe canoe state.
      if (!coordinates.every(Number.isFinite) || !state.landMaskData?.geometry) return false;
      try {
        return mobileMovingLandSamples(coordinates).some(sample =>
          pointInGeometry(sample, state.landMaskData.geometry)
        );
      } catch {
        return false;
      }
    }

    function mobileMovingBiographyItems() {
      return Object.keys(BIOGRAPHY_PLACE_PATHS)
        .map((slug, index) => {
          const article = state.wikiBySlug.get(slug) || { slug, title: BIOGRAPHY_PLACE_PATHS[slug]?.title || slug };
          const path = mobileBiographyTimelineData(article, timelineEventsForSource("wiki", article.id, slug)) || mobileBiographyPathData(article);
          // Source review can opt a visual guide out.
          if (path?.animate === false) return null;
          if (!path?.places?.length || path.places.length < 2) return null;
          const route = (path.routePlaces?.length ? path.routePlaces : path.places)
            .map(place => Array.isArray(place) ? place : place?.coordinates)
            .filter(coords => Array.isArray(coords) && coords.every(Number.isFinite));
          if (route.length < 2) return null;
          return {
            slug,
            article,
            path,
            route,
            person: mobileBiographyPathPersonName(article, slug),
            duration: mobileMovingRouteDuration(route),
            offset: index * 31000
          };
        })
        .filter(Boolean);
    }

    function mobileMovingBiographyStatus(item, motion) {
      const places = item?.path?.places || [];
      if (!places.length) return "";
      const targetIndex = Math.min(places.length - 1, Math.max(0, Math.ceil((motion?.progress || 0) * (places.length - 1))));
      const target = places[targetIndex] || places[places.length - 1];
      const compact = mobileBiographyPathCompactPlace(target);
      return compact ? `on the way to ${compact}` : "";
    }

    function mobileMovingBiographyHtml(item) {
      const name = item?.person || "Biography";
      return `
        <button class="mobile-moving-biography-marker" type="button" aria-label="Open ${escapeHtml(name)}">
          <span class="mobile-moving-biography-shell" aria-hidden="true">
            <span class="mobile-moving-biography-canoe"></span>
            <img src="${escapeHtml(BIOGRAPHY_PERSON_ICON_URL)}" alt="">
          </span>
          <span class="mobile-moving-biography-label" aria-hidden="true">
            <span class="mobile-moving-biography-name">${escapeHtml(name)}</span>
            <span class="mobile-moving-biography-status"></span>
          </span>
        </button>
      `;
    }

    function claimMobileMovingMarkerInteraction(event, options = {}) {
      state.mobileMovingMarkerInteractionUntil = Math.max(state.mobileMovingMarkerInteractionUntil || 0, performance.now() + 900);
      blockMobileMapTaps(1000);
      if (options.preventDefault) event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
    }

    function bindMobileMovingMarkerButton(button, open) {
      if (!button || button.dataset.bound === "true") return;
      button.dataset.bound = "true";
      button.addEventListener("pointerdown", event => claimMobileMovingMarkerInteraction(event));
      button.addEventListener("click", event => {
        claimMobileMovingMarkerInteraction(event, { preventDefault: true });
        open();
      });
    }

    function bindMobileMovingBiographyElement(marker, item) {
      const button = marker?.getElement?.()?.querySelector?.(".mobile-moving-biography-marker");
      bindMobileMovingMarkerButton(button, () => {
        const point = marker.getLngLat?.();
        openWikiArticle(item.slug, {
          focus: false,
          mapCenter: point ? [point.lng, point.lat] : null
        });
      });
    }

    function updateMobileMovingBiographyMarker(item, marker, now = performance.now()) {
      const motion = mobileMovingPingPong(item.route, item.duration, item.offset, now);
      marker.setLngLat(motion.coordinates);
      const element = marker.getElement?.();
      const button = element?.querySelector?.(".mobile-moving-biography-marker");
      if (!button) return;
      button.dataset.direction = motion.direction;
      button.dataset.showLabel = state.map?.getZoom?.() >= SITE_POINT_LABEL_MIN_ZOOM ? "true" : "false";
      button.dataset.onWater = mobileMovingPointIsOnLand(motion.coordinates) ? "false" : "true";
      const status = button.querySelector(".mobile-moving-biography-status");
      if (status) status.textContent = mobileMovingBiographyStatus(item, motion);
    }

    function ensureMobileMovingBiographyMarkers() {
      if (!state.map || !window.mapboxgl?.Marker) return;
      if (!mobileBiographyPathsEnabled() && state.mobileMovingBiographyMarkerQueueTimer) {
        window.clearTimeout(state.mobileMovingBiographyMarkerQueueTimer);
        state.mobileMovingBiographyMarkerQueueTimer = null;
      }
      // The Biography paths & icons control owns the moving biography markers
      // as well as the Mapbox route layers. Otherwise Disable all leaves a
      // visible, interactive biography icon behind.
      const items = mobileBiographyPathsEnabled() ? mobileMovingBiographyItems() : [];
      const wanted = new Set(items.map(item => item.slug));
      for (const [slug, entry] of state.mobileMovingBiographyMarkers) {
        if (!wanted.has(slug)) {
          entry.marker?.remove?.();
          state.mobileMovingBiographyMarkers.delete(slug);
        }
      }
      const missing = items.filter(item => !state.mobileMovingBiographyMarkers.has(item.slug));
      if (!missing.length) return;
      let index = 0;
      const addNext = () => {
        if (!mobileBiographyPathsEnabled()) {
          state.mobileMovingBiographyMarkerQueueTimer = null;
          return;
        }
        const item = missing[index++];
        if (!item || !state.map || state.mobileMovingBiographyMarkers.has(item.slug)) return;
        const element = document.createElement("div");
        element.className = "mobile-moving-biography-mapbox-icon";
        element.innerHTML = mobileMovingBiographyHtml(item);
        const marker = new mapboxgl.Marker({ element, anchor: "center" })
          .setLngLat(item.route[0])
          .addTo(state.map);
        state.mobileMovingBiographyMarkers.set(item.slug, { item, marker });
        bindMobileMovingBiographyElement(marker, item);
        updateMobileMovingBiographyMarker(item, marker, performance.now());
        if (index < missing.length) {
          state.mobileMovingBiographyMarkerQueueTimer = window.setTimeout(addNext, MOBILE_BIOGRAPHY_MARKER_STAGGER_MS);
        } else {
          state.mobileMovingBiographyMarkerQueueTimer = null;
        }
      };
      if (!state.mobileMovingBiographyMarkerQueueTimer) addNext();
    }

    function mobileMovingDogHtml() {
      return `
        <button class="mobile-moving-dog-marker" type="button" aria-label="Open Dog article">
          <span class="mobile-moving-dog-shell" aria-hidden="true"><img src="${escapeHtml(MOVING_DOG_ICON_URL)}" alt=""></span>
          <span class="mobile-moving-dog-label" aria-hidden="true">Dog</span>
        </button>
      `;
    }

    function ensureMobileMovingDogMarker() {
      if (!state.map || !window.mapboxgl?.Marker || state.mobileMovingDogMarker) return;
      const element = document.createElement("div");
      element.className = "mobile-moving-dog-mapbox-icon";
      element.innerHTML = mobileMovingDogHtml();
      state.mobileMovingDogMarker = new mapboxgl.Marker({ element, anchor: "center" })
        .setLngLat(MOBILE_DOG_ROUTE[0])
        .addTo(state.map);
      const button = element.querySelector(".mobile-moving-dog-marker");
      bindMobileMovingMarkerButton(button, () => {
        const point = state.mobileMovingDogMarker?.getLngLat?.();
        openWikiArticle(MOVING_DOG_WIKI_SLUG, {
          focus: false,
          mapCenter: point ? [point.lng, point.lat] : null
        });
      });
    }

    function updateMobileMovingDogMarker(now = performance.now()) {
      if (!state.mobileMovingDogMarker) return;
      const motion = mobileMovingPingPong(MOBILE_DOG_ROUTE, MOBILE_DOG_ONE_WAY_MS, MOBILE_DOG_START_OFFSET_MS, now);
      state.mobileMovingDogMarker.setLngLat(motion.coordinates);
      const button = state.mobileMovingDogMarker.getElement?.()?.querySelector?.(".mobile-moving-dog-marker");
      if (!button) return;
      button.dataset.direction = motion.direction;
      button.dataset.showLabel = state.map?.getZoom?.() >= SITE_POINT_LABEL_MIN_ZOOM ? "true" : "false";
    }

    function mobileMovingWhaleHtml() {
      return `
        <button class="mobile-moving-whale-marker" type="button" aria-label="Open Whaling">
          <span class="mobile-moving-whale-shell" aria-hidden="true"><img src="${escapeHtml(WHALING_WHALE_ICON_URL)}" alt=""></span>
        </button>
      `;
    }

    function mobileMovingWhaleCenter() {
      const point = state.mobileMovingWhaleMarker?.getLngLat?.();
      return point && Number.isFinite(point.lng) && Number.isFinite(point.lat)
        ? [point.lng, point.lat]
        : [...MOBILE_WHALE_ROUTE[0]];
    }

    function ensureMobileMovingWhaleMarker() {
      if (!state.map || !window.mapboxgl?.Marker || state.mobileMovingWhaleMarker) return;
      const element = document.createElement("div");
      element.className = "mobile-moving-whale-mapbox-icon";
      element.innerHTML = mobileMovingWhaleHtml();
      state.mobileMovingWhaleMarker = new mapboxgl.Marker({ element, anchor: "center" })
        .setLngLat(MOBILE_WHALE_ROUTE[0])
        .addTo(state.map);
      const button = element.querySelector(".mobile-moving-whale-marker");
      bindMobileMovingMarkerButton(button, () => {
        const mapCenter = mobileMovingWhaleCenter();
        if (state.siteBySlug.has(WHALING_FEATURE_SLUG)) openSite(WHALING_FEATURE_SLUG, { focus: false, mapCenter });
        else openWikiArticle(WHALING_FEATURE_SLUG, { focus: false, mapCenter });
      });
    }

    function updateMobileMovingWhaleMarker(now = performance.now()) {
      if (!state.mobileMovingWhaleMarker) return;
      const motion = mobileMovingPingPong(MOBILE_WHALE_ROUTE, MOBILE_WHALE_ONE_WAY_MS, MOBILE_WHALE_START_OFFSET_MS, now);
      state.mobileMovingWhaleMarker.setLngLat(motion.coordinates);
      const button = state.mobileMovingWhaleMarker.getElement?.()?.querySelector?.(".mobile-moving-whale-marker");
      if (!button) return;
      button.dataset.direction = motion.direction;
    }

    function updateMobileMovingFeatureMarkers(now = performance.now()) {
      if (!state.map || document.hidden || isAndroidMapGestureActive() || mobileMapCameraIsInteracting() || now < (state.mobileMovingMarkerInteractionUntil || 0)) return;
      for (const entry of state.mobileMovingBiographyMarkers.values()) {
        updateMobileMovingBiographyMarker(entry.item, entry.marker, now);
      }
      updateMobileMovingDogMarker(now);
      updateMobileMovingWhaleMarker(now);
    }

    function startMobileMovingFeatureAnimation() {
      if (state.mobileMovingMarkerFrame || !window.requestAnimationFrame) return;
      const tick = now => {
        if (!document.hidden && now - (state.mobileMovingMarkerLastAt || 0) >= MOBILE_MOVING_MARKER_INTERVAL_MS) {
          updateMobileMovingFeatureMarkers(now);
          state.mobileMovingMarkerLastAt = now;
        }
        state.mobileMovingMarkerFrame = window.requestAnimationFrame(tick);
      };
      state.mobileMovingMarkerFrame = window.requestAnimationFrame(tick);
    }

    async function ensureMobileMovingFeatureMarkers() {
      if (!state.map) return;
      ensureMobileMovingDogMarker();
      ensureMobileMovingWhaleMarker();
      ensureMobileMovingBiographyMarkers();
      ensureLandMask().then(() => updateMobileMovingFeatureMarkers()).catch(() => {});
      updateMobileMovingFeatureMarkers();
      startMobileMovingFeatureAnimation();
    }

    function mobileDetailLoadingHtml(item = {}) {
      const summary = publicCleanText(item?.summary);
      return `
        ${summary ? `<p class="summary">${escapeHtml(summary)}</p>` : ""}
        <p class="detail-loading-status" role="status">Loading full article...</p>
      `;
    }

    async function openWikiArticle(articleOrSlug, options = {}) {
      clearMobileBiographyPathOverlay();
      const slug = typeof articleOrSlug === "string" ? articleOrSlug : articleOrSlug?.slug;
      if (!slug) {
        showBanner("This knowledgebase article is not available yet.");
        return;
      }
      let article = state.wikiBySlug.get(slug) || (typeof articleOrSlug === "object" ? articleOrSlug : null);
      state.selectedSlug = "";
      state.selectedSite = null;
      state.selectedWikiSlug = slug;
      clearActiveSiteMapLabel();
      detailTitleEl.innerHTML = `
        <h2>${escapeHtml(article?.title || options.timelineEvent?.source_title || "Knowledgebase article")}</h2>
        <p class="detail-meta">Knowledgebase</p>
      `;
      detailBodyEl.innerHTML = mobileDetailLoadingHtml(article);
      detailEl.classList.add("open");
      syncMobilePanelAccessibility();
      resetMobilePanelScroll(detailEl);
      if (options.mapCenter?.every?.(Number.isFinite)) {
        window.requestAnimationFrame(() => focusMobileCoordinateInVisibleMap(options.mapCenter, { duration: 420 }));
      }
      article = await fetchWikiDetail(article || slug);
      if (!article) {
        detailBodyEl.innerHTML = `<p class="summary">This knowledgebase article is not available in this view yet.</p>`;
        return;
      }
      await ensureTimelineDetailsForSource("wiki", article.id, article.slug);
      if (state.selectedWikiSlug !== slug) return;
      const event = options.timelineEventId
        ? (state.timelineById.get(String(options.timelineEventId)) || options.timelineEvent || state.timelineEvents.find(item => String(item.id) === String(options.timelineEventId)))
        : null;
      const image = mobileSnapshotImageUrl(firstContentImage(article.content || ""));
      const articleTimelineHtml = article.content ? sectionTimelineHtml(cleanHtml(article.content)) : "";
      const rawArticleContentHtml = article.content ? (articleTimelineHtml || cleanHtml(article.content)) : "";
      const articleContentHtml = cleanupBiographyArticleHtml(
        article,
        autoLinkHtml(isBiographyWikiArticle(article) ? rawArticleContentHtml : removeFootnoteReferenceMarkers(rawArticleContentHtml), {
          used: new Set(),
          excludeHref: `#wiki/${article.slug}`
        })
      );
      const showArticleSummary = Boolean(publicCleanText(article.summary)) && !articleContentHtml;
      const wikiMoments = timelineEventsForSource("wiki", article.id, article.slug);
      const biographyTimeline = mobileBiographyTimelineData(article, wikiMoments);
      detailTitleEl.innerHTML = `
        <h2>${escapeHtml(article.title)}</h2>
        <p class="detail-meta">${article.lastmod ? "Knowledgebase article" : "Knowledgebase"}</p>
      `;
      detailBodyEl.innerHTML = `
        ${image ? `<img class="hero article-sticky-hero" src="${escapeHtml(image)}" alt="${escapeHtml(article.title)}" loading="lazy" decoding="async" onerror="${imageErrorAction("")}">` : ""}
        ${showArticleSummary ? `<p class="summary">${escapeHtml(publicCleanText(article.summary))}</p>` : ""}
        ${articleContentHtml ? `<section class="section"><h3>Sections</h3><div class="section-content">${articleContentHtml}</div></section>` : ""}
        ${whyThisMattersHtml(article)}
        ${mobileBiographyPathHtml(article, wikiMoments)}
        ${sourcesEvidenceSection(article)}
        ${plantWikiObservationSitesHtml(article)}
        ${discussionHtml("wiki", article)}
        <div class="actions">
          ${article.source_url ? `<a class="action secondary" href="${escapeHtml(article.source_url)}" target="_blank" rel="noreferrer">Original page</a>` : ""}
          ${isAdminContributor() ? `<button class="action secondary" type="button" data-open-frontend-editor="wiki" data-editor-slug="${escapeHtml(article.slug)}">Edit article</button>` : ""}
        </div>
      `;
      removeUnbundledSnapshotImages(detailBodyEl);
      detailBodyEl.scrollTop = 0;
      syncDetailHeroScrollState();
      detailEl.classList.add("open");
      syncMobilePanelAccessibility();
      decorateCurrentDetailForQuoteComments("wiki", article);
      decorateCurrentDetailForLanguageQuiz("wiki", article);
      setMobileContentRoute({ wiki: article.slug, event: options.timelineEventId || "" }, options);
      if (biographyTimeline?.places?.length >= 2) showMobileBiographyPathOverlay(article, { focus: options.focus !== false, events: wikiMoments });
      if (event?.id) {
        window.setTimeout(() => detailBodyEl.querySelector(`#timeline-moment-${CSS.escape(String(event.id))}`)?.scrollIntoView({ block: "start" }), 80);
      }
      if (!options.skipCommentRefresh) refreshCommentsNow({ rerender: false }).then(updated => {
        if (updated) openWikiArticle(article.slug, { ...options, skipCommentRefresh: true, skipRoute: true });
      });
    }

    function openInfoPanel(title, meta, bodyHtml, quizContext = null) {
      clearMobileBiographyPathOverlay();
      detailTitleEl.innerHTML = `
        <h2>${escapeHtml(title)}</h2>
        <p class="detail-meta">${escapeHtml(meta || "On This Site")}</p>
      `;
      detailBodyEl.innerHTML = bodyHtml;
      state.selectedSlug = "";
      state.selectedSite = null;
      state.selectedWikiSlug = "";
      clearActiveSiteMapLabel();
      document.querySelectorAll(".sheet.open").forEach(item => item.classList.remove("open"));
      document.querySelector(".mobile-more-menu[open]")?.removeAttribute("open");
      detailEl.classList.remove("plant-browse-mode");
      detailEl.classList.add("open");
      syncMobilePanelAccessibility();
      resetMobilePanelScroll(detailEl);
      resetMobilePanelScroll(detailEl);
      const fallbackQuizItem = { title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-") };
      decorateCurrentDetailForLanguageQuiz(quizContext?.type || "page", quizContext?.item || fallbackQuizItem);
    }

    function openNativePlantsGuide(focusCommon = "") {
      const reported = (state.plantObservations || [])
        .filter(record => normalizeCommentStatus(record) === "approved")
        .map(record => ({ comment: record, fields: plantObservationRecordFields(record) }));
      const cards = PLANT_OBSERVATION_SPECIES.map(plant => {
        const uses = reported.filter(item => {
          const match = plantGuideMatchFromFields(item.fields);
          return match?.common === plant.common;
        });
        const siteLinks = [...new Map(uses.map(item => {
          const slug = item.comment.site_slug || item.comment.source_slug || "";
          const title = item.comment.site_title || item.comment.source_title || "";
          return slug && title ? [slug, title] : null;
        }).filter(Boolean)).entries()];
        return `
          <article class="native-plant-guide-card" id="plant-guide-${escapeHtml(plant.common.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}">
            <strong>${escapeHtml(plant.common)}</strong>
            <span>${escapeHtml(plant.algonquian)}</span>
            <span>${escapeHtml(plant.context)}</span>
            <span class="site-plant-card-meta">${escapeHtml(plant.source)}</span>
            ${siteLinks.length ? `
              <span class="site-plant-card-meta">Sites where identified</span>
              <div class="native-plant-sites">
                ${siteLinks.slice(0, 6).map(([slug, title]) => `<button type="button" data-slug="${escapeHtml(slug)}">${escapeHtml(title)}</button>`).join("")}
              </div>
            ` : `<span class="site-plant-card-meta">No approved site observations yet.</span>`}
          </article>
        `;
      }).join("");
      openInfoPanel("Native Plants", "Natural resources knowledgebase", `
        <section class="section">
          <p class="summary">This natural resources guide connects plant observations from site visitors with the Algonquian vocabulary already used in On This Site. Identifications are suggestions until reviewed, and the app should never be used as a harvesting or foraging guide.</p>
          <button class="action secondary" type="button" data-wiki-slug="native-plants">Open full knowledgebase article</button>
        </section>
        <section class="section">
          <h3>Plant Vocabulary</h3>
          <div class="native-plant-guide-grid">${cards}</div>
        </section>
      `, { type: "wiki", item: { title: "Native Plants", slug: "native-plants" } });
      detailEl.classList.add("plant-browse-mode");
      setMobileContentRoute({ page: "native-plants" }, { skipRoute: false });
      const target = focusCommon
        ? detailBodyEl.querySelector(`#plant-guide-${CSS.escape(String(focusCommon).toLowerCase().replace(/[^a-z0-9]+/g, "-"))}`)
        : null;
      if (target) window.setTimeout(() => target.scrollIntoView({ block: "center" }), 80);
    }

    function siteCardButton(site) {
      return `
        <button class="site-card" type="button" data-slug="${escapeHtml(site.slug)}">
          ${siteCardThumbHtml(site)}
          <span>
            <h2>${escapeHtml(site.title)}</h2>
            <p>${escapeHtml(publicCleanText(site.summary || site.address_label || "Mapped place").slice(0, 150))}</p>
          </span>
        </button>
      `;
    }

    function openHomePanel() {
      openInfoPanel("On This Site", "Native Long Island", `
        <div class="ots-page-intro">
          <p class="summary">Explore mapped places, Native place names, historic records, exhibits, community notes, and timeline moments connected to Long Island Indigenous history.</p>
        </div>
        <section class="section ots-page-grid">
          <article class="ots-page-card">
            <h3>Start exploring</h3>
            <p>Browse sites, ancestral territories, wiki articles, historic moments, and community notes through the map.</p>
            <div class="actions">
              <button class="action secondary" type="button" data-app-page="browse">Browse sites</button>
              <button class="action secondary" type="button" data-app-page="knowledgebase">Knowledgebase</button>
            </div>
          </article>
          <article class="ots-page-card">
            <h3>Support the project</h3>
            <p>Community support helps keep On This Site online, reviewed, expanded, and available across the website and mobile app.</p>
            <div class="actions">
              <button class="action secondary" type="button" data-app-page="support">Support Project</button>
              <button class="action secondary" type="button" data-app-page="about">About the project</button>
            </div>
          </article>
        </section>
        <section class="section ots-support-strip">
          <h3>Project support</h3>
          <p>On This Site has been supported in part through a Monument Lab fellowship, alongside community contributions, artist research, and public history partnerships.</p>
        </section>
      `);
    }

    function openAboutPanel() {
      openInfoPanel("About", "On This Site", `
        <div class="ots-page-intro">
          <p class="summary">On This Site is an archive and map project documenting Indigenous Long Island history through places, photographs, research notes, public storytelling, and community contributions.</p>
        </div>
        <section class="section ots-page-grid">
          <article class="ots-page-card">
            <h3>What the app does</h3>
            <p>Use the map to explore Native place names, ancestral territories, historic locations, contemporary exhibits, and learning prompts. Contributor accounts can add community notes and suggest new places for review.</p>
          </article>
          <article class="ots-page-card">
            <h3>Created by</h3>
            <p>On This Site is created by Shinnecock artist and photographer Jeremy Dennis as part of Native Long Island cultural mapping and public history work.</p>
          </article>
        </section>
        <section class="section ots-support-strip">
          <h3>Project support</h3>
          <p>On This Site has been supported in part through a Monument Lab fellowship, with continuing support from community members, collaborators, and visitors who help keep the project public.</p>
          <div class="actions">
            <button class="action secondary" type="button" data-app-page="support">Support Project</button>
            <button class="action secondary" type="button" data-app-page="contact">Contact</button>
          </div>
        </section>
      `);
    }

    function openContactPanel() {
      openInfoPanel("Contact", "On This Site", `
        <p class="summary">For corrections, collaboration, educational use, or questions about On This Site, contact the project through the website or email Jeremy Dennis.</p>
        <div class="actions">
          <a class="action secondary" href="mailto:jeremynative@gmail.com">Email project</a>
          <button class="action secondary" type="button" data-app-page="browse">Browse mapped sites</button>
          <button class="action secondary" type="button" id="suggest-site-open-inline">Suggest a site</button>
        </div>
      `);
    }

    function openSupportPanel(options = {}) {
      const identity = currentContributorIdentity?.() || {};
      const adoption = options.adoption ? {
        siteSlug: options.adoption.siteSlug || "",
        siteTitle: options.adoption.siteTitle || "this place",
        amount: Number(options.adoption.amount || 25),
        displayName: identity.name || ""
      } : null;
      openInfoPanel("Support Project", "On This Site", SUPPORT_UTILS.supportFormHtml({
          settings: state.supportSettings || {},
          adoption,
          prefill: {
            name: identity.name || "",
            email: identity.email || "",
            publicDisplayName: identity.name || "",
            frequency: adoption ? "monthly" : "once",
            amount: adoption ? 25 : undefined
          },
          platform: "mobile",
          escapeHtml
        }));
      SUPPORT_UTILS.renderPublicThankYous(detailBodyEl, { escapeHtml });
    }

    async function openSupportAdminPanel() {
      if (!isAdminContributor()) {
        showBanner("Log in with the project admin account to view supporter activity.");
        openContributorAccountSheet();
        return;
      }
      openInfoPanel("Supporter Activity", "Admin", `<p class="summary">Loading supporter activity...</p>`);
      try {
        const data = await SUPPORT_UTILS.fetchAdminSupportActivity(state.profile?.token || "");
        detailBodyEl.innerHTML = SUPPORT_UTILS.supportAdminActivityHtml(data, { escapeHtml });
      } catch (error) {
        detailBodyEl.innerHTML = `<p class="form-status error">${escapeHtml(error.message || "Could not load supporter activity.")}</p>`;
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

    function openBrowsePanel() {
      const sites = [...state.sites].sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
      openInfoPanel("Browse", `${sites.length} mapped places`, `
        <p class="summary">Choose a place to open it inside the app.</p>
        <section class="section compact-list">
          ${sites.map(siteCardButton).join("") || `<p class="summary">No sites are loaded yet.</p>`}
        </section>
      `);
    }

    async function openKnowledgebasePanel() {
      detailTitleEl.innerHTML = `<h2>Knowledgebase</h2><p class="detail-meta">Articles</p>`;
      detailBodyEl.innerHTML = `<p class="summary">Loading knowledgebase articles...</p>`;
      detailEl.classList.add("open");
      syncMobilePanelAccessibility();
      await loadDeferredData();
      const articles = [...state.wikiArticles].sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
      const categoryItems = category => (category.entries || (category.slugs || []).map(slug => ["wiki", slug]))
        .map(([type, slug]) => {
          const item = type === "site" ? state.sites.find(site => site.slug === slug) : state.wikiBySlug.get(slug);
          return item ? { type, item } : null;
        })
        .filter(Boolean);
      const categorizedSlugs = new Set(KNOWLEDGEBASE_CATEGORIES.flatMap(category => categoryItems(category).filter(entry => entry.type === "wiki").map(entry => entry.item.slug)));
      const uncategorizedArticles = articles.filter(article => !categorizedSlugs.has(article.slug));
      detailTitleEl.innerHTML = `<h2>Knowledgebase</h2><p class="detail-meta">${articles.length} articles</p>`;
      detailBodyEl.innerHTML = `
        <p class="summary">Articles grouped by topic, with community notes when available.</p>
        <section class="section">
          <h3>Featured</h3>
          <div class="compact-list">
            <button class="site-card" type="button" data-app-page="native-plants">
              <span class="thumb empty">P</span>
              <span>
                <h2>Native Plants</h2>
                <p>Plant observations, Algonquian vocabulary, and natural-resource notes connected to On This Site.</p>
              </span>
            </button>
          </div>
        </section>
        ${KNOWLEDGEBASE_CATEGORIES.map(category => {
          const matches = categoryItems(category);
          if (!matches.length) return "";
          return `
            <section class="section compact-list">
              <h3>${escapeHtml(category.label)}</h3>
              ${matches.map(entry => entry.type === "site"
                ? siteCardButton(entry.item)
                : `<button class="site-card" type="button" data-wiki-slug="${escapeHtml(entry.item.slug)}">
                    <span class="thumb empty">${escapeHtml((entry.item.title || "K").slice(0, 1))}</span>
                    <span>
                      <h2>${escapeHtml(entry.item.title || "Knowledgebase article")}</h2>
                      <p>${escapeHtml(publicCleanText(entry.item.summary || "Open article").slice(0, 150))}</p>
                    </span>
                  </button>`).join("")}
            </section>
          `;
        }).join("")}
        ${uncategorizedArticles.length ? `
          <section class="section compact-list">
            <h3>More Articles</h3>
            ${uncategorizedArticles.map(article => `
              <button class="site-card" type="button" data-wiki-slug="${escapeHtml(article.slug)}">
                <span class="thumb empty">${escapeHtml((article.title || "K").slice(0, 1))}</span>
                <span>
                  <h2>${escapeHtml(article.title || "Knowledgebase article")}</h2>
                  <p>${escapeHtml(publicCleanText(article.summary || "Open article").slice(0, 150))}</p>
                </span>
              </button>
            `).join("")}
          </section>
        ` : ""}
      `;
    }

    async function fetchBlogPosts() {
      if (state.blogPostsLoaded) return state.blogPosts;
      try {
        const response = await fetchJson(
          "/items/blog_posts?limit=12&sort=-published_at,title&filter[status][_eq]=published&fields=id,title,slug,summary,content,published_at,featured_image_url,source_url",
          { cacheKey: "mobile-blog-posts", ttl: 300000, fresh: false }
        );
        state.blogPosts = (response.data || []).map(normalizeBlogPost);
        if (!state.blogPosts.length) throw new Error("Directus blog unavailable");
      } catch {
        try {
          const response = await fetch("https://nativelongisland.com/wp-json/wp/v2/posts?per_page=12&_embed=1", { cache: "no-store" });
          if (!response.ok) throw new Error("WordPress blog unavailable");
          state.blogPosts = (await response.json()).map(normalizeBlogPost);
        } catch {
          state.blogPosts = [];
        }
      }
      state.blogPostsLoaded = true;
      return state.blogPosts;
    }

    function normalizeBlogPost(post = {}) {
      if (post?.title?.rendered) return post;
      const image = post.featured_image_url || "";
      return {
        ...post,
        title: { rendered: post.title || "Blog post" },
        excerpt: { rendered: post.summary || "" },
        content: { rendered: post.content || post.summary || "" },
        date: post.published_at || post.date || "",
        _embedded: image ? { "wp:featuredmedia": [{ source_url: image }] } : {}
      };
    }

    async function openBlogPanel() {
      detailTitleEl.innerHTML = `<h2>Blog</h2><p class="detail-meta">Latest posts</p>`;
      detailBodyEl.innerHTML = `<p class="summary">Loading recent posts...</p>`;
      detailEl.classList.add("open");
      syncMobilePanelAccessibility();
      const posts = await fetchBlogPosts();
      detailBodyEl.innerHTML = `
        <p class="summary">Recent posts open here inside the app.</p>
        <section class="section compact-list">
          ${posts.map((post, index) => {
            const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "";
            return `
              <button class="site-card" type="button" data-blog-index="${index}">
                ${image ? `<img class="thumb" src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async">` : `<span class="thumb empty">B</span>`}
                <span>
                  <h2>${escapeHtml(cleanPlainText(post.title?.rendered || "Blog post"))}</h2>
                  <p>${escapeHtml(publicCleanText(post.excerpt?.rendered || "").slice(0, 150))}</p>
                </span>
              </button>
            `;
          }).join("") || `<p class="summary">Recent posts could not be loaded right now.</p>`}
        </section>
      `;
    }

    function openBlogPost(index) {
      const post = state.blogPosts[Number(index)];
      if (!post) return;
      openInfoPanel(cleanPlainText(post.title?.rendered || "Blog post"), post.date ? new Date(post.date).toLocaleDateString() : "Blog", `
        ${post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ? `<img class="hero" src="${escapeHtml(post._embedded["wp:featuredmedia"][0].source_url)}" alt="" loading="lazy" decoding="async">` : ""}
        <section class="section"><div class="section-content">${cleanHtml(post.content?.rendered || post.excerpt?.rendered || "")}</div></section>
      `, { type: "blog", item: { title: cleanPlainText(post.title?.rendered || "Blog post"), slug: post.slug || post.id || String(index) } });
    }

    async function openInternalAppLink(value) {
      const internal = internalHref(value);
      const match = internal.match(/^#([^/]+)\/(.+)$/);
      if (!match) return false;
      const kind = match[1].toLowerCase();
      const slug = decodeURIComponent(match[2] || "").replace(/^page-/, "").replace(/\/$/, "");
      if (!slug) return false;
      if (kind === "listing") {
        const site = state.sites.find(item => item.slug === slug);
        if (!site) {
          showBanner("That linked site is not loaded in the app yet.");
          return true;
        }
        openSite(slug);
        return true;
      }
      if (kind === "wiki") {
        openWikiArticle(slug);
        return true;
      }
      if (kind === "blog") {
        const posts = await fetchBlogPosts();
        const index = posts.findIndex(post => String(post.slug || "") === slug);
        if (index >= 0) openBlogPost(index);
        else showBanner("That linked blog post is not loaded in the app yet.");
        return true;
      }
      if (kind === "page") {
        const pageMap = {
          "home": "home",
          "about": "about",
          "contact": "contact",
          "browse": "browse",
          "knowledgebase": "knowledgebase",
          "wiki": "knowledgebase",
          "native-plants": "native-plants",
          "blog": "blog",
          "news": "blog",
          "suggest-site": "suggest-site",
          "profile": "profile",
          "login": "profile",
          "contributors": "contributors",
          "events": "events",
          "donate": "support",
          "support": "support"
        };
        const page = pageMap[slug] || slug;
        openAppPage(page);
        return true;
      }
      return false;
    }

    function nativeTakePlantPhoto() {
      try {
        if (window.AndroidApp?.takePlantPhoto) {
          window.AndroidApp.takePlantPhoto();
          return true;
        }
      } catch {}
      return false;
    }

    async function openInitialRouteFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const siteRoute = params.get("site");
      if (siteRoute) {
        openSite(siteRoute, { skipRoute: true });
        return true;
      }
      const wikiRoute = params.get("wiki");
      if (wikiRoute) {
        openWikiArticle(wikiRoute, { skipRoute: true });
        return true;
      }
      const tagRoute = params.get("tag");
      if (tagRoute) {
        openSiteTagList(tagRoute, { skipRoute: true });
        return true;
      }
      const pageRoute = params.get("page");
      if (pageRoute) return openInternalAppLink(`#page/${pageRoute}`);
      const blogRoute = params.get("blog");
      if (blogRoute) return openInternalAppLink(`#blog/${blogRoute}`);
      const eventRoute = params.get("calendar") || params.get("event");
      if (eventRoute) {
        const exhibit = state.exhibits.find(item => String(item.slug || item.id) === String(eventRoute));
        if (exhibit) {
          openExhibit(exhibit);
          return true;
        }
      }
      return false;
    }

    function nativeTakeCommentPhoto() {
      try {
        if (window.AndroidApp?.takeCommentPhoto) {
          window.AndroidApp.takeCommentPhoto();
          return true;
        }
      } catch {}
      return false;
    }

    function nativeChooseCommentPhoto() {
      try {
        if (window.AndroidApp?.chooseCommentPhoto) {
          window.AndroidApp.chooseCommentPhoto();
          return true;
        }
      } catch {}
      return false;
    }

    function setMobileContentRoute(params, options = {}) {
      if (options.skipRoute) return;
      const url = new URL(window.location.href);
      url.search = "";
      for (const [key, value] of Object.entries(params || {})) {
        if (value) url.searchParams.set(key, value);
      }
      const next = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next === current) return;
      window.history.pushState({ nliContentPanel: true }, "", url);
    }

    function mobileSheetRouteKey(sheet) {
      if (sheet === eventsSheetEl) return "events";
      if (sheet === profilesSheetEl) return "contributors";
      if (sheet === loginSheetEl) return "profile";
      if (sheet === contributeSheetEl) return "contribute";
      if (sheet === suggestSiteSheetEl) return "suggest-site";
      if (sheet === feedbackSheetEl) return "feedback";
      if (sheet === settingsSheetEl) return "settings";
      if (sheet === rewardsSheetEl) return "achievements";
      if (sheet === followingSheetEl) return "following";
      if (sheet === activitySheetEl) return "activity";
      if (sheet === notificationsSheetEl) return "notifications";
      return "";
    }

    function currentDetailDrawerState() {
      if (detailEl?.classList.contains("drawer-collapsed")) return "collapsed";
      if (detailEl?.classList.contains("drawer-expanded")) return "expanded";
      return "half";
    }

    function currentNearbyPanelState() {
      return state.mobilePanelState;
    }

    function activeAndroidLifecycleContent() {
      const params = new URLSearchParams(window.location.search || "");
      if (detailEl?.classList.contains("open")) {
        if (state.selectedSlug) return { type: "site", slug: state.selectedSlug };
        if (state.selectedWikiSlug) return { type: "wiki", slug: state.selectedWikiSlug };
        if (params.get("site")) return { type: "site", slug: params.get("site") };
        if (params.get("wiki")) return { type: "wiki", slug: params.get("wiki") };
        if (params.get("page")) return { type: "page", page: params.get("page") };
      }
      const openSheet = document.querySelector(".sheet.open");
      const sheetKey = openSheet ? mobileSheetRouteKey(openSheet) : "";
      if (sheetKey) return { type: "page", page: sheetKey };
      if (params.get("page")) return { type: "page", page: params.get("page") };
      return null;
    }

    function androidLifecycleContentKey(content) {
      return content
        ? [content.type, content.slug || content.page || ""].join(":")
        : "";
    }

    function captureAndroidLifecycleSnapshot() {
      if (!isNativeAndroidApp()) return null;
      const center = state.map?.getCenter?.();
      const activeContent = activeAndroidLifecycleContent();
      // A native startup watchdog may replace a slow live shell with the
      // bundled archive before this page has restored its saved route. Its
      // pagehide/visibility handlers must not erase a meaningful snapshot
      // with the still-empty startup DOM.
      if (state.mobileStartupRendering) {
        try {
          const existing = JSON.parse(localStorage.getItem(ANDROID_LIFECYCLE_STATE_KEY) || "null");
          const existingAge = Date.now() - Number(existing?.savedAt || 0);
          const activeContentKey = androidLifecycleContentKey(activeContent);
          const existingContentKey = androidLifecycleContentKey(existing?.content);
          if (existingContentKey
              && (!activeContentKey || activeContentKey === existingContentKey)
              && existingAge >= 0
              && existingAge <= ANDROID_LIFECYCLE_STATE_MAX_AGE) {
            return existing;
          }
        } catch {}
      }
      const snapshot = {
        savedAt: Date.now(),
        content: activeContent,
        panelMode: appEl?.classList.contains("panel-timeline") ? "timeline" : "nearby",
        panelState: currentNearbyPanelState(),
        timelineScrollTop: mobileTimelineCurrentBtn?.scrollTop || state.timelineScrollTop || 0,
        nearbyScrollTop: listEl?.scrollTop || state.nearbyScrollTop || 0,
        timelineRenderLimit: state.timelineRenderLimit,
        timelineWindowStart: state.timelineWindowStart,
        timelineScrubberIndex: state.timelineScrubberIndex,
        nearbyRenderLimit: state.nearbyRenderLimit,
        detailDrawerState: currentDetailDrawerState(),
        detailScrollTop: detailBodyEl?.scrollTop || 0,
        search: searchEl?.value || "",
        map: center ? {
          center: [center.lng, center.lat],
          zoom: state.map?.getZoom?.(),
          bearing: state.map?.getBearing?.(),
          pitch: state.map?.getPitch?.()
        } : null
      };
      try {
        localStorage.setItem(ANDROID_LIFECYCLE_STATE_KEY, JSON.stringify(snapshot));
      } catch {}
      return snapshot;
    }

    function readAndroidLifecycleSnapshot() {
      if (!isNativeAndroidApp()) return null;
      try {
        const snapshot = JSON.parse(localStorage.getItem(ANDROID_LIFECYCLE_STATE_KEY) || "null");
        if (!snapshot?.savedAt || Date.now() - Number(snapshot.savedAt) > ANDROID_LIFECYCLE_STATE_MAX_AGE) {
          clearAndroidLifecycleSnapshot();
          return null;
        }
        return snapshot;
      } catch {
        clearAndroidLifecycleSnapshot();
        return null;
      }
    }

    function restoreAndroidLifecyclePanels(snapshot) {
      if (!snapshot) return;
      state.timelineScrollTop = Number(snapshot.timelineScrollTop || 0);
      state.nearbyScrollTop = Number(snapshot.nearbyScrollTop || 0);
      state.timelineRenderLimit = Math.max(TIMELINE_FEED_INITIAL_LIMIT, Number(snapshot.timelineRenderLimit || TIMELINE_FEED_INITIAL_LIMIT));
      state.timelineWindowStart = Math.max(0, Number(snapshot.timelineWindowStart || 0));
      state.timelineScrubberIndex = Math.max(0, Number(snapshot.timelineScrubberIndex || state.timelineWindowStart || 0));
      state.nearbyRenderLimit = Math.max(defaultNearbyRenderLimit(), Number(snapshot.nearbyRenderLimit || defaultNearbyRenderLimit()));
      state.timelineFeedSignature = visibleMobileTimelineEvents().map(event => String(event.id || "")).join("|");
      renderMobileTimeline();
      renderList();
      setMobilePanelMode(snapshot.panelMode === "timeline" ? "timeline" : "nearby");
      const legacyPanelState = snapshot.nearbyExpanded
        ? "maximized"
        : snapshot.nearbyPanelState === "hidden"
          ? "collapsed"
          : snapshot.nearbyPanelState === "expanded"
            ? "maximized"
            : snapshot.nearbyPanelState;
      setMobileBottomPanelState(snapshot.panelState || legacyPanelState || "normal");
      if (searchEl && snapshot.search) {
        searchEl.value = snapshot.search;
        filterSites();
      }
    }

    function restoreAndroidLifecycleDetailScroll(snapshot) {
      const targetScrollTop = Math.max(0, Number(snapshot?.detailScrollTop || 0));
      const expectedContentKey = androidLifecycleContentKey(snapshot?.content);
      if (!targetScrollTop || !expectedContentKey || !detailBodyEl) return;

      let cancelled = false;
      const cancel = () => {
        cancelled = true;
        cleanup();
      };
      const cleanup = () => {
        detailBodyEl.removeEventListener("pointerdown", cancel, true);
        detailBodyEl.removeEventListener("pointermove", cancel, true);
        detailBodyEl.removeEventListener("touchstart", cancel, true);
        detailBodyEl.removeEventListener("touchmove", cancel, true);
        detailBodyEl.removeEventListener("wheel", cancel, true);
      };
      const apply = () => {
        if (cancelled
            || !detailEl?.classList.contains("open")
            || androidLifecycleContentKey(activeAndroidLifecycleContent()) !== expectedContentKey) {
          cleanup();
          return;
        }
        const maximum = Math.max(0, detailBodyEl.scrollHeight - detailBodyEl.clientHeight);
        if (maximum > 0) detailBodyEl.scrollTop = Math.min(targetScrollTop, maximum);
      };

      detailBodyEl.addEventListener("pointerdown", cancel, { capture: true, passive: true });
      detailBodyEl.addEventListener("pointermove", cancel, { capture: true, passive: true });
      detailBodyEl.addEventListener("touchstart", cancel, { capture: true, passive: true });
      detailBodyEl.addEventListener("touchmove", cancel, { capture: true, passive: true });
      detailBodyEl.addEventListener("wheel", cancel, { capture: true, passive: true });
      apply();
      window.requestAnimationFrame(apply);
      [150, 550, 1500, 3500].forEach(delay => window.setTimeout(apply, delay));
      window.setTimeout(() => {
        apply();
        cleanup();
      }, 8000);
    }

    async function restoreAndroidLifecycleContent(snapshot) {
      const content = snapshot?.content;
      if (!content) return false;
      if (content.type === "site" && content.slug) {
        await openSite(content.slug, { focus: false, skipRoute: true, drawerState: snapshot.detailDrawerState || "half" });
        restoreAndroidLifecycleDetailScroll(snapshot);
        return true;
      }
      if (content.type === "wiki" && content.slug) {
        await openWikiArticle(content.slug, { focus: false, skipRoute: true });
        if (snapshot.detailDrawerState) setDetailDrawerState(snapshot.detailDrawerState);
        restoreAndroidLifecycleDetailScroll(snapshot);
        return true;
      }
      if (content.type === "page" && content.page) {
        await openAppPage(content.page, { skipRoute: true });
        return true;
      }
      return false;
    }

    function restoreAndroidLifecycleMap(snapshot) {
      const mapState = snapshot?.map;
      if (!state.map || !Array.isArray(mapState?.center)) return false;
      const [lng, lat] = mapState.center.map(Number);
      const zoom = Number(mapState.zoom);
      if (!Number.isFinite(lng) || !Number.isFinite(lat) || !Number.isFinite(zoom)) return false;
      state.map.jumpTo({
        center: [lng, lat],
        zoom,
        bearing: Number(mapState.bearing) || 0,
        pitch: Number(mapState.pitch) || 0
      });
      refreshAndroidMapAfterSettle("android-lifecycle-restore");
      return true;
    }

    function clearMobileRoute() {
      window.history.replaceState(null, "", window.location.pathname);
    }

    async function openAppPage(page, options = {}) {
      document.querySelector(".mobile-more-menu[open]")?.removeAttribute("open");
      const routePage = String(page || "").replace(/^page-/, "");
      if (["home", "about", "contact", "support", "support-admin", "browse", "knowledgebase", "blog", "native-plants"].includes(routePage)) {
        if (routePage === "home") openHomePanel();
        if (routePage === "about") openAboutPanel();
        if (routePage === "contact") openContactPanel();
        if (routePage === "support") openSupportPanel();
        if (routePage === "support-admin") await openSupportAdminPanel();
        if (routePage === "browse") openBrowsePanel();
        if (routePage === "knowledgebase") await openKnowledgebasePanel();
        if (routePage === "blog") await openBlogPanel();
        if (routePage === "native-plants") openNativePlantsGuide();
        setMobileContentRoute({ page: routePage }, options);
        return;
      }
      if (routePage === "events") return openSheet(eventsSheetEl, options);
      if (routePage === "contributors") return openSheet(profilesSheetEl, options);
      if (routePage === "profile" || routePage === "login") return openSheet(loginSheetEl, options);
      if (routePage === "contribute") return openContributionSheet();
      if (routePage === "suggest-site") {
        if (requireRegisteredContributor()) openSheet(suggestSiteSheetEl, options);
        return;
      }
      if (routePage === "feedback") return openSheet(feedbackSheetEl, options);
      if (routePage === "settings") return openSheet(settingsSheetEl, options);
      if (routePage === "achievements" || routePage === "rewards") return openSheet(rewardsSheetEl, options);
      if (routePage === "following") return openSheet(followingSheetEl, options);
      if (routePage === "activity") return openSheet(activitySheetEl, options);
      if (routePage === "notifications") return openSheet(notificationsSheetEl, options);
      showBanner("That app page is not available yet.");
    }

    async function openSite(slug, options = {}) {
      const hadStartupSpotlight = Boolean(mobileStartupSpotlightEl && !mobileStartupSpotlightEl.hidden);
      hideMobileStartupSpotlight({
        deferLongIslandView: slug !== "address-result" && (hadStartupSpotlight || options.fromStartupSpotlight),
        zoomLongIslandView: slug === "address-result" && hadStartupSpotlight
      });
      clearMobileBiographyPathOverlay();
      if (slug === "address-result") {
        const address = state.filtered.find(item => item.slug === "address-result");
        if (address) {
          state.selectedSite = address;
          focusSite(address);
          if (state.map && window.mapboxgl?.Marker) {
            setAddressMarker(address.center, address.title || "Your search");
            showBanner("Address pinned on map.");
          } else {
            showBanner("Address result selected.");
          }
        }
        return;
      }
      let site = state.sites.find(item => item.slug === slug);
      if (!site) return;
      const selectedMapCenter = slug === WHALING_FEATURE_SLUG
        ? (options.mapCenter || mobileMovingWhaleCenter())
        : (options.mapCenter || site.center);
      state.selectedSlug = slug;
      state.selectedSite = site;
      state.selectedWikiSlug = "";
      syncActiveSiteMapLabel(site);
      renderList();
      detailTitleEl.innerHTML = mobileSiteTitleHtml(site);
      detailBodyEl.innerHTML = mobileDetailLoadingHtml(site);
      detailEl.classList.add("open");
      setDetailDrawerState(options.drawerState || "half");
      syncMobilePanelAccessibility();
      resetMobilePanelScroll(detailEl);
      window.requestAnimationFrame(() => focusSite(site, {
        forPanel: true,
        center: selectedMapCenter,
        preserveZoom: options.focus === false,
        duration: options.focus === false ? 360 : 520
      }));
      site = await fetchSiteDetail(site);
      if (state.selectedSlug !== slug) return;
      if (isApprovedContributor()) {
        const profile = currentContributorProfile();
        await Promise.all([
          refreshRemoteSiteVisitsForProfileSite(profile, site),
          refreshRemotePointEventsForProfileId(relationId(profile?.id || profile?.profileId || state.profile?.profileId))
        ]).catch(() => []);
      }
      if (state.selectedSlug !== slug) return;
      state.selectedSite = site;
      syncActiveSiteMapLabel(site);
      const image = mobileSnapshotImageUrl(listingImage(site));
      const imageFallback = mobileSnapshotImageUrl(listingImageFallback(site));
      await ensureTimelineDetailsForSource("site", site.id, site.slug);
      if (state.selectedSlug !== slug) return;
      const moments = timelineEventsForSource("site", site.id, site.slug);
      if (!Array.isArray(site.source_list)) {
        const sourceList = await fetchSiteSources(site);
        if (sourceList.length) site = { ...site, source_list: sourceList };
      }
      let renderedMoments = false;
      const sectionEntries = contentSections(site);
      const linked = new Set();
      const excludeHref = `#listing/${site.slug}`;
      const introductionPresentation = SITE_UTILS.siteIntroductionPresentation(site, sectionEntries, {
        cleanText: publicCleanText,
        summary: site.summary
      });
      const sections = sectionEntries.map(([title, content, field]) => {
        if (field?.content === "history_content" && moments.length) {
          renderedMoments = true;
          return `${sourceAwareSectionHtml(title, content, { linked, excludeHref })}${historicMomentsHtml(moments, { showLocations: false })}`;
        }
        return sourceAwareSectionHtml(title, content, {
          linked,
          excludeHref,
          introduction: field?.content === "introduction_content"
        });
      }).join("");
      const historyHtml = moments.length && !renderedMoments ? historicMomentsHtml(moments, { showLocations: false }) : "";
      detailTitleEl.innerHTML = mobileSiteTitleHtml(site);
      restoreDetailHeroToBody();
      detailBodyEl.innerHTML = `
        ${siteHeroCarouselHtml(site, image, imageFallback)}
        ${introductionPresentation.leadSummary ? `<p class="summary" data-site-introduction="summary">${escapeHtml(introductionPresentation.leadSummary)}</p>` : ""}
        ${siteTagsHtml(site)}
        ${sections}
        ${historyHtml}
        ${whyThisMattersHtml(site)}
        ${relatedSitesSection(site)}
        ${sourcesEvidenceSection(site)}
        ${mobileAdoptPlaceCtaHtml(site)}
        ${discussionHtml("site", site)}
        <div class="actions">
          <a class="action" href="${escapeHtml(googleMapsUrl(site))}" target="_blank" rel="noreferrer">Directions</a>
          <span class="mobile-visit-actions" data-mobile-visit-actions>${mobileVisitActionsHtml(site)}</span>
          <button class="action secondary" type="button" id="open-story-current">AR story</button>
          <a class="action secondary" href="${escapeHtml(ROUTE_UTILS.publicArchiveUrl({ site: site.slug }, { baseUrl: PUBLIC_ARCHIVE_BASE }))}" target="_blank" rel="noreferrer">Full page</a>
          ${isAdminContributor() ? `<button class="action secondary" type="button" data-open-frontend-editor="site" data-editor-slug="${escapeHtml(site.slug)}">Edit site</button>` : ""}
        </div>
      `;
      removeUnbundledSnapshotImages(detailBodyEl);
      detailBodyEl.scrollTop = 0;
      syncDetailHeroScrollState();
      startSiteHeroCarousel();
      detailEl.classList.add("open");
      setDetailDrawerState(options.drawerState || "half");
      detailEl.classList.toggle("plant-browse-mode", plantObservationsForSource("site", site).length > 0);
      syncMobilePanelAccessibility();
      resetMobilePanelScroll(detailEl);
      syncSitePlantMarkers(site);
      decorateCurrentDetailForQuoteComments("site", site);
      decorateCurrentDetailForLanguageQuiz("site", site);
      setMobileContentRoute({ site: site.slug }, options);
      if (Number(options.preserveDetailScrollTop) > 0) {
        restoreAndroidLifecycleDetailScroll({
          content: { type: "site", slug },
          detailScrollTop: Number(options.preserveDetailScrollTop)
        });
      }
      if (!options.skipCommentRefresh) refreshCommentsNow({ rerender: false }).then(updated => {
        if (updated && state.selectedSlug === slug) {
          openSite(slug, {
            focus: false,
            skipCommentRefresh: true,
            skipRoute: true,
            drawerState: currentDetailDrawerState(),
            preserveDetailScrollTop: detailBodyEl.scrollTop
          });
        }
      });
    }

    function closeDetail(options = {}) {
      stopSiteHeroCarousel();
      restoreDetailHeroToBody();
      const returnToLongIslandView = state.mobileStartupSpotlightReturnOnDetailClose;
      state.mobileStartupSpotlightReturnOnDetailClose = false;
      if (options.blockMapTap !== false) blockMobileMapTaps();
      const activeElement = document.activeElement;
      if (activeElement && detailEl.contains(activeElement) && typeof activeElement.blur === "function") {
        activeElement.blur();
      }
      detailEl.classList.remove("open");
      detailEl.classList.remove("plant-browse-mode");
      detailEl.classList.remove("drawer-collapsed", "drawer-half", "drawer-expanded", "dragging");
      detailEl.style.removeProperty("--detail-drawer-height");
      detailEl.style.transform = "";
      state.selectedSlug = "";
      state.selectedSite = null;
      state.selectedWikiSlug = "";
      clearActiveSiteMapLabel();
      clearMobileBiographyPathOverlay();
      syncSitePlantMarkers(null);
      renderList();
      if (!options.skipRoute) window.history.replaceState(null, "", window.location.pathname);
      syncMobilePanelAccessibility();
      if (returnToLongIslandView) {
        window.setTimeout(() => fitLongIslandMapView("mobile-startup-spotlight-article-closed"), 120);
      } else if (options.settleMap !== false && state.map) {
        const currentZoom = Number(state.map.getZoom?.());
        const overviewZoom = 11.25;
        if (Number.isFinite(currentZoom) && currentZoom > overviewZoom) {
          const settleOptions = {
            center: state.map.getCenter?.(),
            zoom: overviewZoom,
            padding: 0,
            retainPadding: false
          };
          if (isNativeAndroidApp()) {
            window.clearTimeout(state.mobileDetailCloseMapTimer);
            state.mobileDetailCloseMapTimer = window.setTimeout(() => {
              state.mobileDetailCloseMapTimer = 0;
              state.map?.stop?.();
              state.map?.jumpTo?.(settleOptions);
              state.map?.triggerRepaint?.();
            }, 700);
          } else {
            window.setTimeout(() => state.map?.easeTo?.({
              ...settleOptions,
              duration: 260,
              essential: true
            }), 60);
          }
        }
      }
    }

    window.addEventListener("popstate", () => {
      const openMoreMenu = document.querySelector(".mobile-more-menu[open]");
      if (openMoreMenu) openMoreMenu.removeAttribute("open");
      const openLayerMenu = document.querySelector(".mobile-layer-menu[open]");
      if (openLayerMenu) openLayerMenu.removeAttribute("open");
      const openSheet = document.querySelector(".sheet.open");
      if (openSheet) {
        if (openSheet === storySheetEl) closeStoryMode();
        else openSheet.classList.remove("open");
        syncMobilePanelAccessibility();
      }
      const params = new URLSearchParams(window.location.search);
      const siteRoute = params.get("site");
      const wikiRoute = params.get("wiki");
      if (siteRoute) {
        openSite(siteRoute, { skipRoute: true, focus: false });
        return;
      }
      if (wikiRoute) {
        openWikiArticle(wikiRoute, { skipRoute: true });
        return;
      }
      const pageRoute = params.get("page");
      if (pageRoute) {
        openAppPage(pageRoute, { skipRoute: true });
        return;
      }
      if (detailEl?.classList.contains("open")) closeDetail({ skipRoute: true });
    });

    window.onAndroidBackPressed = function onAndroidBackPressed() {
      const openMoreMenu = document.querySelector(".mobile-more-menu[open]");
      if (openMoreMenu) {
        openMoreMenu.removeAttribute("open");
        return true;
      }
      const openLayerMenu = document.querySelector(".mobile-layer-menu[open]");
      if (openLayerMenu) {
        openLayerMenu.removeAttribute("open");
        return true;
      }
      const openSheet = document.querySelector(".sheet.open");
      if (openSheet) {
        if (openSheet === storySheetEl) closeStoryMode();
        else openSheet.classList.remove("open");
        if (mobileSheetRouteKey(openSheet)) clearMobileRoute();
        syncMobilePanelAccessibility();
        return true;
      }
      if (detailEl?.classList.contains("open")) {
        closeDetail();
        return true;
      }
      if (state.mobilePanelState === "maximized") {
        setMobileBottomPanelState("normal");
        return true;
      }
      if (state.mobilePanelState === "normal") {
        setMobileBottomPanelState("collapsed");
        return true;
      }
      return false;
    };

    function syncUserLocationMarker({ centerMap = false, zoom = NEAR_ME_ZOOM } = {}) {
      if (!state.map || !state.userLocation || typeof mapboxgl === "undefined") return;
      if (state.userMarker?.setLngLat) {
        state.userMarker.setLngLat(state.userLocation);
      } else {
        if (state.userMarker) state.userMarker.remove();
        const element = document.createElement("div");
        element.className = "user-location-dot";
        element.setAttribute("aria-hidden", "true");
        state.userMarker = new mapboxgl.Marker({ element, anchor: "center" }).setLngLat(state.userLocation).addTo(state.map);
      }
      if (centerMap) state.map.easeTo({ center: state.userLocation, zoom, duration: 850 });
    }

    function fitLongIslandMapView(reason = "long-island-view") {
      if (!state.map?.easeTo) return;
      state.map.easeTo({
        center: MOBILE_STARTUP_VIEW.center,
        zoom: MOBILE_STARTUP_VIEW.zoom,
        duration: 850,
        essential: true
      });
      refreshAndroidMapAfterSettle(reason);
    }

    function randomMobileLongIslandStartupView() {
      const views = MOBILE_LONG_ISLAND_START_VIEWS.length
        ? MOBILE_LONG_ISLAND_START_VIEWS
        : [{ center: FALLBACK_CENTER, zoom: 9.2 }];
      const randomUnit = () => window.crypto?.getRandomValues
        ? window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296
        : Math.random();
      if (views.length < 2) return views[0];
      const scaled = randomUnit() * (views.length - 1);
      const index = Math.min(views.length - 2, Math.floor(scaled));
      const local = scaled - index;
      const start = views[index];
      const end = views[index + 1] || start;
      return {
        center: [
          Number(start.center[0]) + (Number(end.center[0]) - Number(start.center[0])) * local,
          Number(start.center[1]) + (Number(end.center[1]) - Number(start.center[1])) * local + (randomUnit() - 0.5) * 0.025
        ],
        zoom: Number(start.zoom) + (Number(end.zoom) - Number(start.zoom)) * local
      };
    }

    function mobileStartupSpotlightText(site) {
      const text = publicCleanText(site?.summary)
        || publicCleanText(stripHtml(site?.introduction_content || ""))
        || publicCleanText(site?.site_type)
        || "Explore this mapped place in the On This Site archive.";
      return text.length > 128 ? `${text.slice(0, 125).trim()}...` : text;
    }

    function positionMobileStartupSpotlight() {
      if (!mobileStartupSpotlightEl || mobileStartupSpotlightEl.hidden) return;
      const mapEl = document.getElementById("map");
      const rect = mapEl?.getBoundingClientRect();
      if (!rect?.height) return;
      const cardHeight = mobileStartupSpotlightEl.offsetHeight || 104;
      const compactNative = isNativeAndroidApp() && window.innerHeight <= 560;
      const bottomInset = compactNative ? 8 : (isNativeAndroidApp() ? 96 : 58);
      const safeTop = rect.top + 8;
      const safeBottom = rect.bottom - bottomInset;
      const availableHeight = Math.max(0, safeBottom - safeTop);
      if (compactNative && availableHeight < 120) {
        hideMobileStartupSpotlight();
        return;
      }
      const top = Math.max(safeTop, safeBottom - cardHeight);
      mobileStartupSpotlightEl.style.top = `${Math.round(top)}px`;
      mobileStartupSpotlightEl.style.maxHeight = `${Math.round(availableHeight)}px`;
    }

    function hideMobileStartupSpotlight() {
      if (!mobileStartupSpotlightEl) return;
      mobileStartupSpotlightEl.hidden = true;
      mobileStartupSpotlightEl.classList.remove("show");
      mobileStartupSpotlightEl.style.removeProperty("top");
      mobileStartupSpotlightEl.style.removeProperty("max-height");
      state.mobileStartupSpotlightSite = null;
      state.mobileStartupSpotlightExhibit = null;
      state.mobilePromoKind = "";
      state.mobilePromoPayload = null;
      mobilePromoButtons.forEach(button => button.classList.remove("is-active"));
    }

    function mobilePromoPayload(kind) {
      if (kind === "event") {
        const exhibit = upcomingMobileExhibit();
        if (!exhibit) return null;
        const dateLabel = CALENDAR_UTILS.exhibitDateLabel(exhibit);
        const context = [dateLabel, exhibit.venue].filter(Boolean).join(" - ");
        const summary = [context, publicCleanText(exhibit.summary || "")].filter(Boolean).join(". ");
        return {
          kind,
          label: "Upcoming exhibit",
          title: exhibit.title || "On This Site exhibit",
          summary: summary || "Open the event details for dates, location, and related sites.",
          actionLabel: "View exhibit",
          exhibit
        };
      }
      if (kind === "on-this-date") {
        const event = mobileOnThisDateMoment();
        if (!event) return null;
        const hasContent = Boolean(mobileTimelineContentTarget(event));
        return {
          kind,
          label: `On This Date - ${timelineLabel(event)}`,
          title: timelineTitle(event),
          summary: timelineTeaser(event),
          actionLabel: hasContent ? "Read history" : (mobileTimelineHasMapTarget(event) ? "Show on map" : ""),
          event
        };
      }
      if (kind === "did-you-know") {
        const event = mobileDidYouKnowMoment();
        if (!event) return null;
        const hasContent = Boolean(mobileTimelineContentTarget(event));
        return {
          kind,
          label: "Did You Know?",
          title: timelineTitle(event),
          summary: timelineTeaser(event),
          actionLabel: hasContent ? "Learn more" : (mobileTimelineHasMapTarget(event) ? "Show on map" : ""),
          event
        };
      }
      if (kind === "learning") {
        const site = mobileDailyLearningSite();
        if (!site) return null;
        const summary = publicCleanText(site.why_this_matters)
          || publicCleanText(site.summary)
          || publicCleanText(stripHtml(site.introduction_content || ""));
        return {
          kind,
          label: "Daily learning",
          title: site.title || "Explore a mapped place",
          summary: firstCompleteSentences(summary, 2, 180) || mobileStartupSpotlightText(site),
          actionLabel: "Open place",
          site
        };
      }
      if (kind === "question" && state.researchQuestionInstance?.open) {
        return {
          kind,
          label: "Support through curiosity",
          title: "Have a question about Native Long Island?",
          summary: "Ask a public-history question or support deeper research with a paid question.",
          actionLabel: "Ask a question"
        };
      }
      return null;
    }

    function availableMobilePromoKinds() {
      return ["event", "on-this-date", "did-you-know", "learning", "question"]
        .filter(kind => Boolean(mobilePromoPayload(kind)));
    }

    function syncMobilePromoDock() {
      if (!mobilePromoDockEl) return;
      if (!isNativeAndroidApp() || isOfflineTextMode()) {
        mobilePromoDockEl.hidden = true;
        return;
      }
      const available = new Set(availableMobilePromoKinds());
      mobilePromoButtons.forEach(button => {
        button.hidden = !available.has(button.dataset.mobilePromoKind || "");
      });
      mobilePromoDockEl.hidden = available.size === 0;
    }

    function showMobilePromo(kind) {
      const payload = mobilePromoPayload(kind);
      if (!payload || !mobileStartupSpotlightEl || appEl?.classList.contains("panel-maximized")) return false;
      state.mobilePromoKind = kind;
      state.mobilePromoPayload = payload;
      state.mobileStartupSpotlightSite = payload.site || null;
      state.mobileStartupSpotlightExhibit = payload.exhibit || null;
      state.mobileStartupSpotlightShown = true;
      if (mobileStartupSpotlightLabelEl) mobileStartupSpotlightLabelEl.textContent = payload.label;
      if (mobileStartupSpotlightTitleEl) mobileStartupSpotlightTitleEl.textContent = payload.title;
      if (mobileStartupSpotlightSummaryEl) mobileStartupSpotlightSummaryEl.textContent = payload.summary;
      if (mobileStartupSpotlightLearnBtn) {
        mobileStartupSpotlightLearnBtn.textContent = payload.actionLabel;
        mobileStartupSpotlightLearnBtn.hidden = !payload.actionLabel;
      }
      mobileStartupSpotlightEl.hidden = false;
      mobileStartupSpotlightEl.classList.add("show");
      mobilePromoButtons.forEach(button => {
        button.classList.toggle("is-active", button.dataset.mobilePromoKind === kind);
      });
      window.requestAnimationFrame(positionMobileStartupSpotlight);
      window.setTimeout(positionMobileStartupSpotlight, 120);
      return true;
    }

    function activateMobilePromo() {
      const payload = state.mobilePromoPayload;
      if (!payload) return;
      hideMobileStartupSpotlight();
      if (payload.kind === "event" && payload.exhibit) {
        openExhibit(payload.exhibit);
        return;
      }
      if (["on-this-date", "did-you-know"].includes(payload.kind) && payload.event) {
        openMobileTimelineEvent(payload.event);
        return;
      }
      if (payload.kind === "learning" && payload.site?.slug) {
        openSite(payload.site.slug, { focus: true, drawerState: "half" });
        return;
      }
      if (payload.kind === "question") state.researchQuestionInstance?.open?.();
    }

    function showRandomMobileStartupSpotlight() {
      const candidates = availableMobilePromoKinds();
      if (!candidates.length) return false;
      const selected = candidates.filter(() => Math.random() < 0.28);
      if (!selected.length) return false;
      return showMobilePromo(selected[Math.floor(Math.random() * selected.length)]);
    }

    function mobilePromoUiBusy() {
      return Boolean(
        detailEl?.classList.contains("open")
        || appEl?.classList.contains("panel-maximized")
        || document.querySelector(".sheet.open")
        || document.querySelector("#language-quiz-modal:not([hidden])")
        || document.querySelector("#plant-photo-viewer:not([hidden])")
        || document.body.classList.contains("research-question-dialog-open")
      );
    }

    function scheduleMobilePromoStartup(attempt = 0) {
      if (!isNativeAndroidApp() || state.mobilePromoStartupResolved) return;
      if (attempt === 0) {
        if (state.mobilePromoStartupScheduled) return;
        state.mobilePromoStartupScheduled = true;
      }
      window.setTimeout(() => {
        if (state.mobilePromoStartupResolved) return;
        if (mobilePromoUiBusy()) {
          if (attempt < 4) scheduleMobilePromoStartup(attempt + 1);
          else state.mobilePromoStartupResolved = true;
          return;
        }
        state.mobilePromoStartupResolved = true;
        showRandomMobileStartupSpotlight();
      }, attempt === 0 ? 1600 : 900);
    }

    function locationMovedEnough(nextLocation) {
      if (!state.userLocation) return true;
      const miles = milesBetween(state.userLocation, nextLocation);
      return Number.isFinite(miles) && miles >= 0.006;
    }

    function setLocationControlsBusy(busy) {
      locateBtn.textContent = busy ? "Finding..." : "Near me";
      if (!mobileMapLocateBtn) return;
      mobileMapLocateBtn.disabled = busy;
      mobileMapLocateBtn.classList.toggle("is-finding", busy);
      mobileMapLocateBtn.setAttribute("aria-busy", busy ? "true" : "false");
    }

    function mapIsCenteredOnLocation(location, tolerancePixels = 12) {
      if (!state.map || !Array.isArray(location) || location.length < 2) return false;
      const longitude = Number(location[0]);
      const latitude = Number(location[1]);
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return false;
      try {
        const centerPoint = state.map.project(state.map.getCenter());
        const locationPoint = state.map.project([longitude, latitude]);
        return Math.hypot(centerPoint.x - locationPoint.x, centerPoint.y - locationPoint.y) <= tolerancePixels;
      } catch (_) {
        return false;
      }
    }

    function nextLocationControlZoom() {
      const currentZoom = Number(state.map?.getZoom?.());
      const maximumZoom = Number(state.map?.getMaxZoom?.());
      if (!Number.isFinite(currentZoom)) return NEAR_ME_ZOOM;
      return Math.min(currentZoom + 1, Number.isFinite(maximumZoom) ? maximumZoom : currentZoom + 1);
    }

    function applyUserLocation(position, { centerMap = false, mapZoom = NEAR_ME_ZOOM, centerBounds = null } = {}) {
      const nextLocation = [position.coords.longitude, position.coords.latitude];
      const moved = locationMovedEnough(nextLocation);
      state.userLocation = nextLocation;
      state.settings.locationEnabled = true;
      state.settings.locationPrompted = true;
      saveSettings();
      setLocationControlsBusy(false);
      renderCurrentTerritoryStatus();
      if (moved || centerMap) {
        sortSites();
        renderList();
      }
      const mayCenter = !centerMap || !centerBounds || pointWithinBounds(nextLocation, centerBounds);
      syncUserLocationMarker({ centerMap: centerMap && mayCenter, zoom: mapZoom });
      if (centerMap && mayCenter) refreshAndroidMapAfterSettle("android-location-center");
      else if (centerMap && centerBounds && !mayCenter) {
        fitLongIslandMapView("android-location-outside-long-island");
      }
      state.lastLocationMarkerUpdateAt = Date.now();
      startLocationWatch();
    }

    async function requestUserLocation({
      centerMap = false,
      silent = false,
      mapZoom = NEAR_ME_ZOOM,
      centerBounds = null,
      zoomIfAlreadyCentered = false
    } = {}) {
      if (!navigator.geolocation) {
        if (!silent) showBanner("Location is not available on this device.");
        return false;
      }
      setLocationControlsBusy(true);
      return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(position => {
          const nextLocation = [position.coords.longitude, position.coords.latitude];
          const resolvedMapZoom = zoomIfAlreadyCentered && mapIsCenteredOnLocation(nextLocation)
            ? nextLocationControlZoom()
            : mapZoom;
          applyUserLocation(position, { centerMap, mapZoom: resolvedMapZoom, centerBounds });
          resolve(true);
      }, () => {
        state.settings.locationEnabled = false;
        state.settings.locationPrompted = true;
        saveSettings();
        setLocationControlsBusy(false);
        state.userLocation = null;
        renderCurrentTerritoryStatus();
          renderList();
          if (!silent) showBanner("Location permission was not available. Showing sites near central Long Island without personal distances.");
          resolve(false);
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
      });
    }

    async function locateUser() {
      setMobilePanelMode("nearby");
      setNearbyPanelState("default");
      return requestUserLocation({ centerMap: true, silent: false, mapZoom: NEAR_ME_ZOOM });
    }

    async function locateMapUser() {
      return requestUserLocation({
        centerMap: true,
        silent: false,
        mapZoom: NEAR_ME_ZOOM,
        zoomIfAlreadyCentered: isNativeAndroidApp()
      });
    }

    function installApkLocationControlDebugHook() {
      if (!isNativeAndroidApp() || window.AndroidApp?.isDebugBuild?.() !== true) return;
      const snapshot = () => ({
        ready: Boolean(state.map && state.userLocation),
        centered: mapIsCenteredOnLocation(state.userLocation),
        zoom: Number(state.map?.getZoom?.())
      });
      window.NLI_APK_LOCATION_CONTROL_AUDIT = Object.freeze({
        snapshot,
        moveAway() {
          if (!state.map || !state.userLocation) return snapshot();
          state.map.jumpTo({
            center: [state.userLocation[0] + 0.18, state.userLocation[1]],
            zoom: state.map.getZoom()
          });
          return snapshot();
        }
      });
    }

    async function requestStartupLocation() {
      if (isNativeAndroidApp()) {
        setMobilePanelMode("nearby");
        setNearbyPanelState("default");
        return requestUserLocation({ centerMap: true, silent: true, mapZoom: STARTUP_LOCATION_ZOOM, centerBounds: STARTUP_LOCATION_CENTER_BOUNDS });
      }
      if (state.settings.proximityAlerts) {
        setMobilePanelMode("nearby");
        setNearbyPanelState("default");
        return requestUserLocation({ centerMap: true, silent: false, mapZoom: STARTUP_LOCATION_ZOOM, centerBounds: STARTUP_LOCATION_CENTER_BOUNDS });
      }
      return false;
    }

    function startLocationWatch() {
      if (!navigator.geolocation || state.locationWatchId) return;
      state.locationWatchId = navigator.geolocation.watchPosition(position => {
        const nextLocation = [position.coords.longitude, position.coords.latitude];
        const moved = locationMovedEnough(nextLocation);
        const now = Date.now();
        if (!moved && now - state.lastLocationMarkerUpdateAt < 5000) return;
        state.userLocation = nextLocation;
        renderCurrentTerritoryStatus();
        if (moved && now - state.lastLocationMarkerUpdateAt >= 5000) {
          sortSites();
          renderList();
          syncUserLocationMarker({ centerMap: false });
          state.lastLocationMarkerUpdateAt = now;
        } else if (!state.userMarker) {
          syncUserLocationMarker({ centerMap: false });
          state.lastLocationMarkerUpdateAt = now;
        }
        checkProximityAlerts();
      }, () => {}, { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 });
    }

    function checkProximityAlerts() {
      if (!state.settings.proximityAlerts || !state.userLocation) return;
      const hour = new Date().getHours();
      if (hour < 9 || hour > 17) return;
      const todayKey = localDateKey();
      if (localStorage.getItem("nli-proximity-alert-date") === todayKey) return;
      const profile = currentContributorProfile();
      const nearby = visitableSites()
        .filter(site => !isBroadTerritory(site))
        .filter(site => !profile || !siteHasRecordedCheckin(profile, site))
        .map(site => ({ site, miles: milesBetween(state.userLocation, site.center) }))
        .filter(item => Number.isFinite(item.miles) && item.miles <= SITE_VISIT_ALERT_RADIUS_MILES)
        .sort((a, b) => a.miles - b.miles)[0];
      if (!nearby) return;
      notifyUser("On This Site nearby", `You are within ${nearby.miles.toFixed(1)} mi of ${nearby.site.title}.`)
        .then(sent => {
          if (sent) localStorage.setItem("nli-proximity-alert-date", todayKey);
        });
    }

    function checkDailyHistoryMoment() {
      if (!state.settings.historyAlerts) return;
      const today = new Date();
      const hour = today.getHours();
      if (hour < 9 || hour > 10) return;
      const key = localDateKey(today);
      if (localStorage.getItem("nli-history-alert-date") === key) return;
      const month = today.toLocaleString("en-US", { month: "long" }).toLowerCase();
      const day = today.getDate();
      const match = state.timelineEvents.find(event => {
        const label = String(event.date_label || event.title || event.description || "").toLowerCase();
        const dayPattern = new RegExp(`\\b${day}(?:st|nd|rd|th)?\\b`);
        return label.includes(month) && dayPattern.test(label);
      });
      if (!match) return;
      notifyUser("On This Day", `${match.date_label || ""} ${match.title || match.source_title || ""}`.trim())
        .then(sent => {
          if (sent) localStorage.setItem("nli-history-alert-date", key);
        });
    }

    function mobileVisitActionsHtml(site) {
      const profile = currentContributorProfile();
      if (profile && siteHasRecordedCheckin(profile, site)) {
        return `<button class="action secondary checkin-complete" type="button" disabled aria-disabled="true">Checked In!</button>`;
      }
      if (PROFILE_UTILS.isEligiblePublicVisitSite(site)) {
        return `
          <button class="action secondary" type="button" id="mark-visited">Mark visited</button>
          <button class="action secondary" type="button" id="check-in-site">Check in nearby</button>
        `;
      }
      return `<p class="detail-meta">Learn from this map entry; public visits or check-ins are not encouraged here.</p>`;
    }

    function refreshMobileVisitActions(site = state.selectedSite) {
      const container = detailBodyEl?.querySelector?.("[data-mobile-visit-actions]");
      if (container && site) container.innerHTML = mobileVisitActionsHtml(site);
    }

    function newContentAlertCandidates() {
      const sites = (state.sites || []).map(site => ({
        key: `site:${site.slug || site.id}`,
        type: "site",
        title: site.title || "New site",
        slug: site.slug || "",
        updatedAt: site.last_reviewed || site.wp_date || ""
      }));
      const wikis = (state.wikiArticles || []).map(article => ({
        key: `wiki:${article.slug || article.id}`,
        type: "wiki",
        title: article.title || "New wiki page",
        slug: article.slug || "",
        updatedAt: article.last_reviewed || article.lastmod || ""
      }));
      return [...sites, ...wikis].filter(item => item.key && item.key !== "site:undefined" && item.key !== "wiki:undefined");
    }

    function newestContentItem(items) {
      return [...items].sort((a, b) => {
        const at = Date.parse(a.updatedAt || "") || Number(String(a.key).replace(/\D/g, "")) || 0;
        const bt = Date.parse(b.updatedAt || "") || Number(String(b.key).replace(/\D/g, "")) || 0;
        return bt - at;
      })[0] || null;
    }

    async function checkNewContentAlerts() {
      if (!state.settings.newContentAlerts) return;
      const currentItems = newContentAlertCandidates();
      if (!currentItems.length) return;
      const currentKeys = currentItems.map(item => item.key);
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem("nli-new-content-alert-state") || "null");
      } catch {}
      if (!saved?.keys?.length) {
        localStorage.setItem("nli-new-content-alert-state", JSON.stringify({
          keys: currentKeys,
          pending: [],
          lastAlertAt: 0
        }));
        return;
      }
      const known = new Set(saved.keys || []);
      const pendingByKey = new Map((saved.pending || []).map(item => [item.key, item]));
      currentItems.filter(item => !known.has(item.key)).forEach(item => pendingByKey.set(item.key, item));
      const pending = [...pendingByKey.values()].filter(item => currentKeys.includes(item.key));
      const now = Date.now();
      const lastAlertAt = Number(saved.lastAlertAt || 0);
      const nextState = {
        keys: [...new Set([...known, ...currentKeys])],
        pending,
        lastAlertAt
      };
      if (!pending.length || now - lastAlertAt < NEW_CONTENT_ALERT_INTERVAL_MS) {
        localStorage.setItem("nli-new-content-alert-state", JSON.stringify(nextState));
        return;
      }
      const item = newestContentItem(pending);
      if (!item) {
        localStorage.setItem("nli-new-content-alert-state", JSON.stringify(nextState));
        return;
      }
      const label = item.type === "wiki" ? "New wiki page" : "New site";
      const sent = await notifyUser(label, `${item.title} was added to On This Site.`);
      if (!sent) {
        localStorage.setItem("nli-new-content-alert-state", JSON.stringify(nextState));
        return;
      }
      localStorage.setItem("nli-new-content-alert-state", JSON.stringify({
        keys: nextState.keys,
        pending: pending.filter(candidate => candidate.key !== item.key),
        lastAlertAt: now
      }));
    }

    function addPolygonLayers() {
      if (!state.map || state.map.getSource("mobile-sites")) return;
      if (!state.mobileStyleImageMissingBound) {
        state.mobileStyleImageMissingBound = true;
        state.map.on("styleimagemissing", event => {
          const key = String(event?.id || "");
          if (!key.startsWith("mobile-site-icon-") || state.map.hasImage?.(key)) return;
          const transparent = new Uint8Array(4 * 4 * 4);
          state.map.addImage(key, { width: 4, height: 4, data: transparent });
          state.mobileSiteIconImagePlaceholders.add(key);
        });
      }
      const sourceData = cachedMobileMapSourceData();
      CALENDAR_UTILS.addOnThisDayMapImage?.(state.map, "mobile-on-this-day-calendar");
      state.map.addSource("mobile-sites", { type: "geojson", data: sourceData.sites });
      state.map.addSource("mobile-site-attention", { type: "geojson", data: sourceData.attention });
      state.map.addSource("mobile-place-name-area-labels", { type: "geojson", data: sourceData.placeNameAreaLabels });
      state.map.addSource("mobile-biography-paths", { type: "geojson", data: allMobileBiographyPathFeatureCollection({ enabled: mobileBiographyPathsEnabled() }) });
      state.map.addLayer({
        id: "mobile-territory-polygons",
        type: "fill",
        source: "mobile-sites",
        filter: ["all", ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]], ["==", ["get", "broad"], true]],
        paint: {
          "fill-color": ["coalesce", ["get", "fillcolor"], "#496f5d"],
          "fill-opacity": ["min", ["coalesce", ["to-number", ["get", "opacity"]], 0.18], 0.28]
        }
      });
      state.map.addLayer({
        id: "mobile-place-name-area-fill",
        type: "fill",
        source: "mobile-sites",
        filter: ["all", ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]], ["==", ["get", "place_name_area_overlay"], true]],
        paint: {
          "fill-color": ["coalesce", ["get", "fillcolor"], "#15988f"],
          "fill-opacity": ["min", ["coalesce", ["to-number", ["get", "opacity"]], 0.42], 0.32]
        }
      });
      state.map.addLayer({
        id: "mobile-place-name-area-line",
        type: "line",
        source: "mobile-sites",
        filter: ["all", ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]], ["==", ["get", "place_name_area_overlay"], true]],
        paint: {
          "line-color": ["coalesce", ["get", "linecolor"], "#315b50"],
          "line-opacity": ["coalesce", ["to-number", ["get", "lineopacity"]], 0.3],
          "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.4, 12, 0.8, 16, 1.1]
        }
      });
      state.map.addLayer({
        id: "mobile-site-polygons",
        type: "fill",
        source: "mobile-sites",
        filter: ["all", ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]], ["!=", ["get", "broad"], true], ["!=", ["get", "place_name_area_overlay"], true]],
        paint: {
          "fill-color": ["coalesce", ["get", "fillcolor"], "#7b9b68"],
          "fill-opacity": ["min", ["coalesce", ["to-number", ["get", "opacity"]], 0.2], 0.28]
        }
      });
      state.map.addLayer({
        id: "mobile-site-lines",
        type: "line",
        source: "mobile-sites",
        filter: ["all", ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]], ["!=", ["get", "place_name_area_overlay"], true], ["!=", ["get", "site_type"], "placename"]],
        paint: {
          "line-color": "#2f5a49",
          "line-opacity": 0.34,
          "line-width": 1
        }
      });
      state.map.addLayer({
        id: "mobile-site-attention-outer",
        type: "circle",
        source: "mobile-site-attention",
        filter: ["==", ["get", "attention_kind"], "urgent"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 24, 10, 34, 14, 50],
          "circle-color": "#d71920",
          "circle-blur": 0.72,
          "circle-opacity": 0.34,
          "circle-translate": [0, -8]
        }
      });
      state.map.addLayer({
        id: "mobile-site-attention-core",
        type: "circle",
        source: "mobile-site-attention",
        filter: ["==", ["get", "attention_kind"], "urgent"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 10, 10, 15, 14, 22],
          "circle-color": "#d71920",
          "circle-blur": 0.42,
          "circle-opacity": 0.38,
          "circle-translate": [0, -8]
        }
      });
      state.map.addLayer({
        id: "mobile-site-point-hit",
        type: "circle",
        source: "mobile-sites",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 10, 10, 14, 14, 18],
          "circle-color": "#245f43",
          "circle-opacity": 0.01,
          "circle-stroke-opacity": 0
        }
      });
      state.map.addLayer({
        id: "mobile-site-point-dots",
        type: "circle",
        source: "mobile-sites",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 4.4, 10, 5.8, 14, 7.2],
          "circle-color": ["case", ["==", ["get", "has_header_image"], true], "#326fe3", "#496f5d"],
          "circle-opacity": 0.92,
          "circle-stroke-color": "rgba(255,255,255,0.36)",
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 6, 0.4, 12, 0.8],
          "circle-stroke-opacity": 0.55
        }
      });
      state.map.addLayer({
        id: "mobile-site-icons",
        type: "symbol",
        source: "mobile-sites",
        filter: ["all", ["==", ["geometry-type"], "Point"], ["==", ["get", "has_icon"], true]],
        layout: {
          "icon-image": ["get", "icon_key"],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 6, 0.72, 10, 0.9, 14, 1.08],
          "icon-anchor": "center",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-optional": true
        }
      });
      state.map.addLayer({
        id: "mobile-site-attention-history-badge",
        type: "circle",
        source: "mobile-site-attention",
        filter: ["==", ["get", "attention_kind"], "on-this-day"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 12, 10, 17, 14, 21],
          "circle-color": "#315c48",
          "circle-opacity": 0.12,
          "circle-blur": 0.2,
          "circle-translate": [0, -16],
          "circle-stroke-color": "#315c48",
          "circle-stroke-width": 1,
          "circle-stroke-opacity": 0.18
        }
      });
      state.map.addLayer({
        id: "mobile-site-attention-history-icon",
        type: "symbol",
        source: "mobile-site-attention",
        filter: ["==", ["get", "attention_kind"], "on-this-day"],
        layout: {
          "icon-image": "mobile-on-this-day-calendar",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 6, 0.72, 10, 0.92, 14, 1.08],
          "icon-anchor": "center",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true
        },
        paint: {
          "icon-opacity": 1,
          "icon-translate": [0, -16]
        }
      });
      state.map.addLayer({
        id: "mobile-biography-path-lines",
        type: "line",
        source: "mobile-biography-paths",
        filter: ["==", ["get", "kind"], "path"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#59605c",
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.4, 12, 3],
          "line-opacity": 0.62,
          "line-dasharray": ["literal", [1.2, 1.2]]
        }
      });
      state.map.addLayer({
        id: "mobile-biography-path-points",
        type: "circle",
        source: "mobile-biography-paths",
        filter: ["==", ["get", "kind"], "point"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 4.2, 12, 7],
          "circle-color": "#59605c",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1.7,
          "circle-opacity": 0.92
        }
      });
      state.map.addLayer({
        id: "mobile-biography-path-point-numbers",
        type: "symbol",
        source: "mobile-biography-paths",
        filter: ["==", ["get", "kind"], "point"],
        layout: {
          "text-field": ["get", "label"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6, 8, 12, 10.25],
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
        id: "mobile-biography-path-labels",
        type: "symbol",
        source: "mobile-biography-paths",
        filter: ["==", ["get", "kind"], "label"],
        minzoom: 8.2,
        layout: {
          "text-field": ["get", "pin_label"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 8.2, 8, 13, 10.75],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-variable-anchor": ["literal", ["top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"]],
          "text-radial-offset": ["interpolate", ["linear"], ["zoom"], 8.2, 0.78, 13, 1.16],
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
      if (shouldShowCustomMapIcons()) loadMobileSiteIconImages();
      state.map.addSource("mobile-territory-labels", { type: "geojson", data: sourceData.territoryLabels });
      state.map.addLayer({
        id: "mobile-territory-labels",
        type: "symbol",
        source: "mobile-territory-labels",
        minzoom: 6,
        layout: {
          "text-field": ["get", "title"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6, 9, 9, 12, 12, 15],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
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
          "text-halo-width": 1.7
        }
      });
      state.map.addSource("mobile-detail-labels", { type: "geojson", data: sourceData.detailLabels });
      state.map.addLayer({
        id: "mobile-detail-labels",
        type: "symbol",
        source: "mobile-detail-labels",
        minzoom: SITE_LABEL_MIN_ZOOM,
        layout: {
          "text-field": ["get", "title"],
          "text-size": ["interpolate", ["linear"], ["zoom"], SITE_LABEL_MIN_ZOOM, ["*", ["get", "label_size"], 0.84], 16, ["*", ["get", "label_size"], 1.25]],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-anchor": "center",
          "text-variable-anchor": ["literal", ["center", "top", "bottom", "left", "right"]],
          "text-radial-offset": 0.7,
          "text-justify": "auto",
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-max-width": 8,
          "text-optional": true
        },
        paint: {
          "text-color": "#2d352f",
          "text-halo-color": "rgba(255,255,255,0.88)",
          "text-halo-width": 1.35
        }
      });
      state.map.addLayer({
        id: "mobile-place-name-area-labels",
        type: "symbol",
        source: "mobile-place-name-area-labels",
        minzoom: PLACE_NAME_AREA_LABEL_MIN_ZOOM,
        layout: {
          "text-field": ["get", "title"],
          "text-size": ["interpolate", ["linear"], ["zoom"], PLACE_NAME_AREA_LABEL_MIN_ZOOM, 10.5, 12, 13.5, 16, 16],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
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
      state.map.addLayer({
        id: "mobile-site-point-labels",
        type: "symbol",
        source: "mobile-sites",
        filter: ["==", ["geometry-type"], "Point"],
        minzoom: SITE_POINT_LABEL_MIN_ZOOM,
        layout: {
          "text-field": ["get", "title"],
          "text-size": ["interpolate", ["linear"], ["zoom"], SITE_POINT_LABEL_MIN_ZOOM, 10.25, 17, 14],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
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
          "text-color": "#183528",
          "text-opacity": ["interpolate", ["linear"], ["zoom"], SITE_POINT_LABEL_MIN_ZOOM, 0, SITE_POINT_LABEL_MIN_ZOOM + 0.35, 1],
          "text-halo-color": "rgba(255,255,255,0.92)",
          "text-halo-width": 1.5
        }
      });
      state.mapSourceAppliedKey = state.mapSourceCacheKey || "";
      syncMobileBiographyPathLayers();
      startMobileSiteAttentionPulse();
      ensureMobileMovingFeatureMarkers();
      bindMobileMapLayerEvents();
    }

    function rebindMobileMapLayerEvent(type, layerId, handler) {
      MAP_UTILS.rebindLayerEvent(state.map, state.mobileMapLayerHandlers, type, layerId, handler);
    }

    function bindMobileInteractiveLayer(layerId, clickHandler) {
      rebindMobileMapLayerEvent("click", layerId, clickHandler);
      rebindMobileMapLayerEvent("mouseenter", layerId, () => state.map.getCanvas().style.cursor = "pointer");
      rebindMobileMapLayerEvent("mouseleave", layerId, () => state.map.getCanvas().style.cursor = "");
    }

    function syncMobileBiographyPathLayers() {
      if (!state.map) return;
      const visible = mobileBiographyPathsEnabled();
      const source = state.map.getSource("mobile-biography-paths");
      if (source) source.setData(allMobileBiographyPathFeatureCollection({ enabled: visible }));
      MAP_UTILS.setLayerVisibilityMany(state.map, ["mobile-biography-path-lines", "mobile-biography-path-points", "mobile-biography-path-point-numbers", "mobile-biography-path-labels"], visible ? "visible" : "none");
    }

    function openMobileInteractivePolygonLayer(event) {
      if (mobileMapEventHandled(event)) return;
      if (handleSuggestionMapPickClick(event)) return;
      if (openMobilePolygonLayerFeature(event)) return;
      if (openMobileMapTap(event)) markMobileMapEventHandled(event);
    }

    function bindMobileMapLayerEvents() {
      if (!state.map) return;
      bindMobileInteractiveLayer("mobile-site-point-hit", event => {
        if (handleSuggestionMapPickClick(event)) return;
        if (openMobileMapTap(event)) markMobileMapEventHandled(event);
      });
      ["mobile-biography-place-labels", "mobile-biography-place-points", "mobile-biography-path-labels", "mobile-biography-path-point-numbers", "mobile-biography-path-points"]
        .forEach(layerId => bindMobileInteractiveLayer(layerId, event => {
          if (handleSuggestionMapPickClick(event)) return;
          if (openMobileMapTap(event)) markMobileMapEventHandled(event);
        }));
      ["mobile-place-name-area-fill", "mobile-place-name-area-labels", "mobile-site-polygons", "mobile-territory-polygons", "mobile-detail-labels", "mobile-territory-labels"]
        .forEach(layerId => bindMobileInteractiveLayer(layerId, openMobileInteractivePolygonLayer));
      if (!state.mobileMapLayerEventsBound) {
        state.mobileMapLayerEventsBound = true;
        state.map.on("click", event => {
          if (mobileMapEventHandled(event)) return;
          openMobileMapTap(event);
        });
      }
    }

    function updateMobileSiteAttentionPulse() {
      if (!state.map) return;
      if (document.hidden || isAndroidMapGestureActive() || mobileMapCameraIsInteracting()) return;
      if (!state.map.getLayer("mobile-site-attention-outer") || !state.map.getLayer("mobile-site-attention-core")) return;
      const elapsed = Date.now() - (state.siteAttentionPulseStartedAt || Date.now());
      const progress = (elapsed % 1800) / 1800;
      const wave = 0.5 - Math.cos(progress * Math.PI * 2) / 2;
      state.map.setPaintProperty("mobile-site-attention-outer", "circle-radius", ["interpolate", ["linear"], ["zoom"], 6, 24 + wave * 10, 10, 34 + wave * 14, 14, 50 + wave * 18]);
      state.map.setPaintProperty("mobile-site-attention-outer", "circle-opacity", 0.2 + (1 - wave) * 0.3);
      state.map.setPaintProperty("mobile-site-attention-core", "circle-radius", ["interpolate", ["linear"], ["zoom"], 6, 10 + wave * 4, 10, 15 + wave * 5, 14, 22 + wave * 7]);
      state.map.setPaintProperty("mobile-site-attention-core", "circle-opacity", 0.26 + wave * 0.34);
    }

    function startMobileSiteAttentionPulse() {
      if (state.siteAttentionPulseTimer) return;
      state.siteAttentionPulseStartedAt = Date.now();
      updateMobileSiteAttentionPulse();
      state.siteAttentionPulseTimer = window.setInterval(updateMobileSiteAttentionPulse, 240);
      if (!state.mobileMapPulseMoveBound && state.map?.on) {
        state.mobileMapPulseMoveBound = true;
        state.map.on("moveend", updateMobileSiteAttentionPulse);
        state.map.on("zoomend", updateMobileSiteAttentionPulse);
      }
    }

    function markMobileMapEventHandled(event) {
      if (event?.originalEvent) event.originalEvent.__nliMobileMapHandled = true;
    }

    function mobileMapEventHandled(event) {
      return Boolean(event?.originalEvent?.__nliMobileMapHandled);
    }

    function mobileMapCameraIsInteracting() {
      if (!state.map) return false;
      return Boolean(
        state.map.isMoving?.() ||
        state.map.isZooming?.() ||
        state.map.isRotating?.() ||
        state.map.isEasing?.()
      );
    }

    function refreshMobileMapSources(options = {}) {
      if (!state.map) return;
      const data = cachedMobileMapSourceData();
      const sourceKey = state.mapSourceCacheKey || "";
      if (options.force !== true && sourceKey && state.mapSourceAppliedKey === sourceKey) return;
      const sources = [
        ["mobile-sites", data.sites],
        ["mobile-site-attention", data.attention],
        ["mobile-territory-labels", data.territoryLabels],
        ["mobile-detail-labels", data.detailLabels],
        ["mobile-place-name-area-labels", data.placeNameAreaLabels]
      ];
      MAP_UTILS.setGeoJsonSourceDataMany(state.map, sources);
      state.mapSourceAppliedKey = sourceKey;
      syncMobileBiographyPathLayers();
    }

    function isAndroidMapGestureActive() {
      return isNativeAndroidApp() && state.androidMapGestureActive;
    }

    function markAndroidMapGestureActive() {
      if (!isNativeAndroidApp()) return;
      state.androidMapGestureActive = true;
      if (state.androidMapGestureSettleTimer) {
        window.clearTimeout(state.androidMapGestureSettleTimer);
        state.androidMapGestureSettleTimer = null;
      }
    }

    function markAndroidMapGestureSettled() {
      if (!isNativeAndroidApp()) return;
      if (state.androidMapGestureSettleTimer) window.clearTimeout(state.androidMapGestureSettleTimer);
      state.androidMapGestureSettleTimer = window.setTimeout(() => {
        state.androidMapGestureActive = false;
        if (state.pendingAndroidMapRefresh) {
          state.pendingAndroidMapRefresh = false;
          refreshAndroidMapAfterSettle("android-map-post-gesture");
        }
      }, 260);
    }

    function bindAndroidMapGestureGuards() {
      if (!isNativeAndroidApp() || !state.map || state.androidMapGestureGuardsBound) return;
      state.androidMapGestureGuardsBound = true;
      state.map.on("dragstart", markAndroidMapGestureActive);
      state.map.on("dragend", markAndroidMapGestureSettled);
      state.map.on("zoomstart", markAndroidMapGestureActive);
      state.map.on("zoomend", markAndroidMapGestureSettled);
      state.map.on("rotateend", markAndroidMapGestureSettled);
      state.map.on("pitchend", markAndroidMapGestureSettled);
    }

    function refreshAndroidMapAfterSettle(reason = "android-map-settle") {
      if (!isNativeAndroidApp() || !state.map) return;
      state.androidMapRefreshToken += 1;
      const token = state.androidMapRefreshToken;
      state.androidMapRefreshTimers.forEach(timer => window.clearTimeout(timer));
      state.androidMapRefreshTimers.clear();
      let refreshCount = 0;
      const refresh = () => {
        if (!state.map || token !== state.androidMapRefreshToken || document.hidden) return;
        if (isAndroidMapGestureActive()) {
          state.pendingAndroidMapRefresh = true;
          return;
        }
        try {
          if (refreshCount === 0) {
            syncMarkers({ auxiliary: false });
            refreshMobileMapSources();
          }
          refreshCount += 1;
          state.map.resize();
          state.map.triggerRepaint?.();
        } catch (error) {
          console.warn(`${reason} map refresh will retry later.`, error);
        }
        const stable = Boolean(state.map.loaded?.() && (!state.map.areTilesLoaded || state.map.areTilesLoaded()));
        if (stable && refreshCount >= 2) {
          state.androidMapRefreshTimers.forEach(timer => window.clearTimeout(timer));
          state.androidMapRefreshTimers.clear();
        }
      };
      window.requestAnimationFrame(refresh);
      [280, 1100, 2600].forEach(delay => {
        const timer = window.setTimeout(() => {
          state.androidMapRefreshTimers.delete(timer);
          refresh();
        }, delay);
        state.androidMapRefreshTimers.add(timer);
      });
    }

    function stabilizeAndroidMapPaint() {
      if (!isNativeAndroidApp() || !state.map) return;
      refreshAndroidMapAfterSettle("android-map-stabilize");
    }

    function bindAndroidMapResizeObserver() {
      if (!isNativeAndroidApp() || !state.map || state.androidMapResizeObserver || !window.ResizeObserver) return;
      const mapElement = document.getElementById("map");
      if (!mapElement) return;
      const sizeKey = () => {
        const rect = mapElement.getBoundingClientRect();
        return `${Math.round(rect.width)}x${Math.round(rect.height)}`;
      };
      state.androidMapLastSizeKey = sizeKey();
      state.androidMapResizeObserver = new ResizeObserver(() => {
        const nextSizeKey = sizeKey();
        if (!nextSizeKey || nextSizeKey === state.androidMapLastSizeKey) return;
        state.androidMapLastSizeKey = nextSizeKey;
        refreshAndroidMapAfterSettle("android-map-container-resize");
      });
      state.androidMapResizeObserver.observe(mapElement);
    }

    function updateProfileMenuButton(stats = null) {
      if (mobileAdminMenu) {
        mobileAdminMenu.hidden = !isAdminContributor();
        if (mobileAdminMenu.hidden) mobileAdminMenu.removeAttribute("open");
      }
      if (!loginOpenBtn) return;
      if (!state.profile) {
        loginOpenBtn.textContent = "Login";
        loginOpenBtn.title = "Login or register as a contributor";
        return;
      }
      if (state.profile.pending) {
        loginOpenBtn.textContent = "Account Pending";
        loginOpenBtn.title = "Contributor account awaiting review";
        return;
      }
      const activeProfile = currentContributorProfile() || state.profile;
      const resolvedStats = stats || mobileProfileStats(activeProfile, { syncRemote: false });
      const pointsSyncing = !state.profileActivitySynced || resolvedStats.pointsSyncing;
      const points = mobileProfilePointTotal(resolvedStats);
      const displayName = activeProfile?.display_name || state.profile.display_name || state.profile.email || "Profile";
      loginOpenBtn.textContent = `${displayName} (${points})`;
      loginOpenBtn.title = pointsSyncing ? `${displayName}: refreshing profile points` : `${displayName}: ${points} profile ${points === 1 ? "point" : "points"}`;
    }

    function mobileContributorTierProgressHtml(stats = {}) {
      const points = mobileProfilePointTotal(stats);
      const progress = PROFILE_UTILS.contributorProgressToNextTier(points);
      const current = progress.current;
      const next = progress.next;
      const unlockText = next ? next.unlocks : current.unlocks;
      const percent = Math.max(0, Math.min(100, Number(progress.percent) || 0));
      return `
        <section class="contributor-tier-card" aria-label="Contributor tier progress">
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
        </section>
      `;
    }

    function mobileAccountInviteHtml(profile = {}) {
      if (!profile?.id || state.profile?.pending || !isApprovedContributor()) return "";
      return `
        <details class="community-extra">
          <summary>Invite a friend</summary>
          <p class="detail-meta">Email a one-time invite code. If your friend registers with the code tied to that email, you receive 100 profile points.</p>
          <div class="field">
            <label for="mobile-invite-name">Friend name (optional)</label>
            <input id="mobile-invite-name" data-account-invite-name autocomplete="name">
          </div>
          <div class="field">
            <label for="mobile-invite-email">Friend email</label>
            <input id="mobile-invite-email" data-account-invite-email autocomplete="email" inputmode="email">
          </div>
          <div class="field">
            <label for="mobile-invite-message">Personal message (optional)</label>
            <textarea id="mobile-invite-message" data-account-invite-message maxlength="600"></textarea>
          </div>
          <button class="action" type="button" data-send-account-invite>Email invite</button>
          <p class="form-status" data-account-invite-status hidden></p>
        </details>
      `;
    }

    function renderProfile() {
      if (!profileCardEl) return;
      loginSheetEl?.classList.toggle("has-profile", !!state.profile);
      if (accountSheetTitleEl) accountSheetTitleEl.textContent = state.profile ? "Contributor Account" : "Login";
      if (mapStoryOpenBtn) mapStoryOpenBtn.hidden = !isApprovedContributor();
      if (!state.profile) {
        profileCardEl.innerHTML = `<p class="summary">Not logged in. Use one contributor account for the desktop map and mobile app.</p>`;
        updateProfileMenuButton();
        loginSubmitBtn.hidden = false;
        registerToggleBtn.hidden = false;
        if (demoLoginBtn) demoLoginBtn.hidden = true;
        logoutSubmitBtn.hidden = true;
        registerPanelEl.hidden = true;
        return;
      }
      const profileSyncing = !state.profileActivitySynced;
      if (profileSyncing && !state.mobileStartupRendering) {
        ensureProfileStatsSynced().then(updated => {
          if (updated) renderProfile();
        });
      }
      loginSubmitBtn.hidden = true;
      registerToggleBtn.hidden = true;
      if (demoLoginBtn) demoLoginBtn.hidden = true;
      logoutSubmitBtn.hidden = false;
      registerPanelEl.hidden = true;
      const linkedProfile = currentContributorProfile();
      const support = supporterLine(linkedProfile);
      const displayName = linkedProfile?.display_name || state.profile.display_name || state.profile.email || "";
      const roleLabel = linkedProfile?.role_label || state.profile.role || "Contributor";
      const bio = linkedProfile?.bio || state.profile.bio || "";
      const headline = linkedProfile?.headline || state.profile.headline || "";
      const locationLabel = linkedProfile?.location_label || state.profile.location_label || "";
      const website = linkedProfile?.website_url || state.profile.website_url || "";
      const websiteUrl = profileWebsiteUrl(website);
      const userSinceLine = profileUserSinceLine(linkedProfile || state.profile);
      const visits = mergedProfileVisits(linkedProfile);
      const comments = profileActivity(linkedProfile || {}).comments || [];
      const activeProfile = linkedProfile || state.profile;
      const languageWords = learnedLanguageWords(activeProfile);
      const showProgress = canShowContributorProgress(activeProfile);
      const stats = showProgress ? mobileProfileStats(activeProfile) : { points: 0, loginStreak: 0, loginDays: 0, commentUpvotes: 0, milestone: "New Learner" };
      const languagePoints = showProgress ? languageCorrectAttemptCount(activeProfile) : 0;
      const loginRewards = showProgress ? loginRewardStats(activeProfile) : { totalDays: 0, currentStreak: 0, bestStreak: 0, lastLoginDate: "" };
      const publicSiteCount = PROFILE_UTILS.publicSiteTotal(state.sites);
      const visitProgress = PROFILE_UTILS.visitProgressLabel(visits.length, publicSiteCount);
      const totalPoints = mobileProfilePointTotal(stats);
      updateProfileMenuButton(stats);
      const recentVisits = visits.slice(0, 3);
      profileCardEl.innerHTML = `
        <strong>${escapeHtml(displayName || "Contributor")}</strong>
        ${profileSyncing ? `<p class="detail-meta">Refreshing latest Directus activity...</p>` : ""}
        <p class="detail-meta">${escapeHtml([roleLabel, locationLabel].filter(Boolean).join(" - "))}</p>
        ${userSinceLine ? `<p class="detail-meta">${escapeHtml(userSinceLine)}</p>` : ""}
        ${state.profile.pending ? `<p class="detail-meta">Thank you for registering. Your account is waiting for review.</p>` : ""}
        ${support ? `<p class="detail-meta">${escapeHtml(support)}</p>` : ""}
        ${(headline || bio || websiteUrl) ? `
          <div class="profile-preview">
            ${headline ? `<strong>${escapeHtml(headline)}</strong>` : ""}
            ${bio ? `<p class="summary">${escapeHtml(bio)}</p>` : ""}
            ${websiteUrl ? `<a class="detail-meta" href="${escapeHtml(websiteUrl)}" target="_blank" rel="noreferrer">${escapeHtml(website)}</a>` : ""}
          </div>
        ` : `<p class="summary">Add a biography and website so people can learn more from your profile.</p>`}
        <div class="profile-stats">
          <button class="profile-stat" type="button" data-show-mobile-profile-progress aria-expanded="false"><strong>${escapeHtml(String(totalPoints))}</strong><span class="detail-meta">profile points</span></button>
          <button class="profile-stat" type="button" data-show-mobile-profile-progress aria-expanded="false"><strong>${visits.length}</strong><span class="detail-meta">${escapeHtml(publicSiteCount ? `of ${publicSiteCount} places` : "places visited")}</span></button>
          <button class="profile-stat" type="button" data-show-mobile-profile-comments aria-expanded="false"><strong>${comments.length}</strong><span class="detail-meta">community notes</span></button>
          <button class="profile-stat" type="button" data-show-mobile-profile-progress aria-expanded="false"><strong>${loginRewards.currentStreak}</strong><span class="detail-meta">day streak</span></button>
        </div>
        ${stats.pointsSyncing ? `<p class="detail-meta">Refreshing latest point activity...</p>` : ""}
        ${showProgress ? mobileContributorTierProgressHtml(stats) : ""}
        ${mobileProfileBadgesHtml(activeProfile, stats)}
        ${mobileProfileTrackersHtml(activeProfile, stats)}
        <p class="detail-meta">${escapeHtml(visitProgress)}</p>
        ${showProgress ? `<p class="detail-meta">Daily signed-in visit: +1 point after 24 hours${loginRewards.bestStreak ? ` - best streak ${loginRewards.bestStreak}` : ""}. Language points: ${languagePoints}.</p>` : `<p class="detail-meta">Points and streaks unlock after this contributor account is approved.</p>`}
        ${showProgress ? mobileProfilePointsBreakdownHtml(stats, activeProfile, true) : ""}
        ${mobileAccountInviteHtml(activeProfile)}
        ${mobileProfileActivityFeedHtml(activeProfile)}
        ${mobileProfileLanguageHtml(activeProfile, true)}
        ${mobileProfileCommentsHtml(activeProfile, true)}
        <div class="visit-preview">
          <strong>Sites visited</strong>
          ${recentVisits.length ? recentVisits.map(visit => `
            <button class="visit-row" type="button" data-profile-site="${escapeHtml(visit.site_slug)}">
              <span>${escapeHtml(visit.site_title || visit.site_slug || "Visited site")}</span>
              <span class="detail-meta">${PROFILE_UTILS.hasSavedCheckinDistance(visit.distance_miles) ? "Checked in" : "Visited"} - ${escapeHtml(formatVisitDate(visit.visited_at))}</span>
            </button>
          `).join("") : `<p class="detail-meta">Mark places visited from a site page and they will appear here.</p>`}
          <button class="action secondary" type="button" data-open-visits>View sites visited</button>
        </div>
        ${state.supportSettings?.donate_url ? `<a class="action secondary" href="${escapeHtml(state.supportSettings.donate_url)}" target="_blank" rel="noreferrer">Donate monthly</a>` : ""}
        <details class="community-extra" ${state.profile.pending ? "hidden" : ""}>
          <summary>Edit profile</summary>
          <div class="field">
            <label for="profile-display-name">Display name</label>
            <input id="profile-display-name" data-profile-display-name value="${escapeHtml(displayName)}">
          </div>
          <div class="field">
            <label for="profile-headline">Headline</label>
            <input id="profile-headline" data-profile-headline value="${escapeHtml(headline)}">
          </div>
          <div class="field">
            <label for="profile-location">Location</label>
            <input id="profile-location" data-profile-location value="${escapeHtml(locationLabel)}">
          </div>
          <div class="field">
            <label for="profile-website">Website or social link</label>
            <input id="profile-website" data-profile-website value="${escapeHtml(website)}">
          </div>
          <div class="field">
            <label for="profile-bio">Biography</label>
            <textarea id="profile-bio" data-profile-bio>${escapeHtml(bio)}</textarea>
          </div>
          <button class="action" type="button" data-save-profile>Save profile</button>
        </details>
        <button class="action secondary" type="button" data-profile-logout>Logout</button>
      `;
    }

    async function saveEditedProfile() {
      if (!state.profile) return;
      const payload = PROFILE_UTILS.profileEditorPayload(profileCardEl, state.profile, {
        displayNameFallback: state.profile.display_name || state.profile.email
      });
      const moderation = moderationCheck([payload.display_name, payload.headline, payload.bio].filter(Boolean).join(" "), "Your profile");
      if (!moderation.ok) {
        showBanner(moderation.message);
        return;
      }
      const linkedProfile = currentContributorProfile();
      if (state.profile.pending || !linkedProfile?.id) {
        showBanner(state.profile.pending
          ? "This account is still waiting for approval. Profile edits save after approval."
          : "Could not find your profile to update. Please log in again.");
        return;
      }
      try {
        await patchDirectusItem("mobile_member_profiles", linkedProfile.id, payload, { requireAuth: true });
        Object.assign(linkedProfile, payload);
        saveProfile({ ...state.profile, display_name: payload.display_name, headline: payload.headline, location_label: payload.location_label, website_url: payload.website_url, bio: payload.bio });
        renderProfiles();
        renderProfile();
        showBanner("Profile updated.");
      } catch (error) {
        showBanner(error.message || "Could not save profile.");
      }
    }

    async function sendMobileAccountInvite(root) {
      const profile = currentContributorProfile();
      if (!profile?.id || state.profile?.pending || !isApprovedContributor()) {
        showBanner("Login as an approved contributor before inviting a friend.");
        return;
      }
      const button = root.querySelector("[data-send-account-invite]");
      const statusEl = root.querySelector("[data-account-invite-status]");
      const originalLabel = button?.textContent || "Email invite";
      const invitedName = root.querySelector("[data-account-invite-name]")?.value.trim() || "";
      const invitedEmail = normalizeAccountEmail(root.querySelector("[data-account-invite-email]")?.value || "");
      const message = root.querySelector("[data-account-invite-message]")?.value.trim() || "";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invitedEmail)) {
        showBanner("Enter your friend's email.");
        return;
      }
      if (button) {
        button.disabled = true;
        button.textContent = "Sending...";
      }
      if (statusEl) {
        statusEl.textContent = "Sending invite email...";
        statusEl.hidden = false;
        statusEl.classList.remove("error", "success");
      }
      try {
        await FEEDBACK_UTILS.sendAccountInviteEmail({
          inviterProfile: profile.id,
          inviterEmail: state.profile?.email || profile.username || "",
          inviterName: profile.display_name || state.profile?.display_name || state.profile?.email || "Contributor",
          invitedName,
          invitedEmail,
          message
        }, { appUrl: window.location.href, platform: "mobile" });
        root.querySelector("[data-account-invite-name]").value = "";
        root.querySelector("[data-account-invite-email]").value = "";
        root.querySelector("[data-account-invite-message]").value = "";
        if (statusEl) {
          statusEl.textContent = "Invite emailed. The code can be used once by that email address.";
          statusEl.hidden = false;
          statusEl.classList.add("success");
        }
        showBanner("Invite emailed.");
      } catch (error) {
        if (statusEl) {
          statusEl.textContent = error.message || "Could not send invite.";
          statusEl.hidden = false;
          statusEl.classList.add("error");
        }
        showBanner(error.message || "Could not send invite.");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      }
    }

    function clearActiveSiteMapLabel() {
      if (state.activeSiteLabelMarker?.remove) state.activeSiteLabelMarker.remove();
      state.activeSiteLabelMarker = null;
    }

    function syncActiveSiteMapLabel(site = state.selectedSite) {
      clearActiveSiteMapLabel();
      if (!state.map || !site?.center || site.slug === WHALING_FEATURE_SLUG || typeof mapboxgl === "undefined") return;
      const element = document.createElement("div");
      element.className = "selected-site-map-label";
      element.textContent = site.title || "Selected site";
      element.setAttribute("aria-hidden", "true");
      state.activeSiteLabelMarker = new mapboxgl.Marker({ element, anchor: "bottom", offset: [0, -22] })
        .setLngLat(site.center)
        .addTo(state.map);
    }

    function renderRewards() {
      const mergedVisits = mergedProfileVisits();
      visitSummaryEl.innerHTML = `
        <strong>${mergedVisits.length} places visited</strong>
        <p class="detail-meta">${state.profile ? "Your visited places and check-ins sync with your profile." : "Login to save visits and check-ins to your contributor profile."}</p>
        <div class="visit-list">
          ${mergedVisits.length ? mergedVisits.map(visit => `
            <button class="visit-row" type="button" data-profile-site="${escapeHtml(visit.site_slug)}">
              <span>${escapeHtml(visit.site_title || visit.site_slug || "Visited site")}</span>
              <span class="detail-meta">${PROFILE_UTILS.hasSavedCheckinDistance(visit.distance_miles) ? "Checked in" : "Visited"} - ${escapeHtml(formatVisitDate(visit.visited_at))}</span>
            </button>
          `).join("") : `<p class="summary">No visited sites yet. Open a site page and tap Mark visited.</p>`}
        </div>
      `;
      const stats = state.profile ? mobileProfileStats(currentContributorProfile() || state.profile) : PROFILE_UTILS.profileStatsFromActivity({
        visits: mergedVisits,
        comments: [],
        commentVotes: [],
        suggestions: []
      }, { emptyMilestone: "New Learner" });
      const badges = PROFILE_UTILS.profileAchievementsFromStats(stats);
      badgeGridEl.innerHTML = badges.map(badge => `
        <div class="badge${badge.earned ? " earned" : ""}">
          <strong>${escapeHtml(badge.progressLabel)}</strong>
          <span>${escapeHtml(badge.label)}</span>
        </div>
      `).join("");
    }

    function profileActivity(profile) {
      const profileIds = profileIdentityIds(profile);
      const siteBySlug = state.siteBySlug?.size
        ? state.siteBySlug
        : new Map((state.sites || []).map(site => [site.slug || "", site]));
      const profileVisits = (state.publicVisits || [])
        .filter(visit => profileIds.has(Number(relationId(visit.member_profile))));
      const visitedSites = PROFILE_UTILS.uniqueVisitRecords(profileVisits)
        .map(visit => siteBySlug.get(visit.site_slug || ""))
        .filter(Boolean);
      return PROFILE_UTILS.profileActivityFromCollections(profile, {
        comments: state.publicComments,
        commentVotes: state.commentVotes,
        pointEvents: state.profilePointEvents,
        visits: profileVisits,
        suggestions: state.siteSuggestions,
        visitedSites,
        waterwaySites: visitedSites.filter(site => siteCategoryTags(site).some(tag => tag.key === "theme:water")),
        historicRecords: visitedSites.filter(site => siteCategoryTags(site).some(tag => tag.key === "theme:records"))
      }, {
        relationId,
        normalizeCommentStatus,
        identityIds: profileIds,
        identityNames: profileIdentityNames(profile)
      });
    }

    function mobileProfileStats(profile, options = {}) {
      const activity = profileActivity(profile || {});
      const ids = canonicalPointProfileIds(profile);
      const pointsSyncing = Boolean(ids.length && !profilePointEventsAreCanonical(profile));
      const stats = PROFILE_UTILS.profileStatsFromActivity(activity, {
        homelandsCount: distinctVisitedHomelandCount(activity.visitedSites || []),
        languageLearned: learnedLanguageWords(profile).length,
        languageCorrectAttempts: languageCorrectAttemptCount(profile),
        loginRewards: loginRewardStats(profile),
        supporterPoints: profile?.is_monthly_supporter ? supportMonths(profile) * 100 : 0,
        emptyMilestone: "New Learner"
      });
      const showPointsSyncing = pointsSyncing && options.syncRemote !== false;
      if (showPointsSyncing) {
        ensureCanonicalProfilePointEvents(profile).then(updated => {
          if (!updated) return;
          renderProfile();
          if (profilesSheetEl?.classList.contains("open")) renderProfiles();
        });
      }
      return { ...stats, pointsSyncing: showPointsSyncing };
    }

    function mobileProfileBadgesHtml(profile, providedStats = null) {
      const stats = providedStats || mobileProfileStats(profile || {});
      const badges = PROFILE_UTILS.profileBadgeSummariesFromStats(stats);
      return badges.length ? `
        <div class="profile-badges" aria-label="Profile badges">
          ${badges.map(badge => badge.type === "language"
            ? `<button class="profile-badge profile-badge-button" type="button" data-show-profile-language aria-expanded="false">${escapeHtml(badge.label)}</button>`
            : `<button class="profile-badge profile-badge-button" type="button" data-show-mobile-profile-progress aria-expanded="false">${escapeHtml(badge.label)}</button>`).join("")}
        </div>
      ` : "";
    }

    function mobileProfileTrackersHtml(profile, providedStats = null) {
      const stats = providedStats || mobileProfileStats(profile || {});
      const rows = PROFILE_UTILS.profileTrackerRowsFromStats(stats);
      return rows.length ? `
        <div class="profile-trackers" aria-label="Profile trackers">
          ${rows.map(row => `<button class="profile-tracker" type="button" data-show-mobile-profile-progress aria-expanded="false">${escapeHtml(row.text)}</button>`).join("")}
        </div>
      ` : "";
    }

    function mobileProfileLanguageHtml(profile, hidden = true) {
      const languageWords = learnedLanguageWords(profile)
        .slice()
        .sort((a, b) => String(b.learned_at || "").localeCompare(String(a.learned_at || "")));
      return `
        <section class="visit-preview profile-language-section" data-profile-language ${hidden ? "hidden aria-hidden=\"true\"" : "aria-hidden=\"false\""}>
          <strong>Language Work</strong>
          ${languageWords.length ? `
            <div class="language-learned-list">
              ${languageWords.map(word => `
                <div class="language-learned-row">
                  <strong>${escapeHtml(word.english || "")} - ${escapeHtml(word.algonquian || "")}</strong>
                  <span>${escapeHtml(word.source || "Source saved with quiz")}</span>
                </div>
              `).join("")}
            </div>
          ` : `<p class="detail-meta">Correct language quiz answers will appear here with their source.</p>`}
        </section>
      `;
    }

    function mobileProfileActivityItems(profile, limit = 14) {
      const activity = profileActivity(profile || {});
      return PROFILE_UTILS.profileActivityFeedItems(activity, {
        activityPreview,
        activityDateValue,
        languageWords: learnedLanguageWords(profile),
        loginRecords: remoteLoginRewardRecords(profile),
        includePurchases: false,
        commentPreviewLength: 104,
        limit
      });
    }

    function mobileProfileActivityFeedHtml(profile, limit = 14) {
      const items = mobileProfileActivityItems(profile, limit);
      return `
        <section class="visit-preview profile-mini-feed">
          <strong>Recent Activity</strong>
          ${items.length ? items.map(item => `
            <article class="profile-feed-row">
              <div>
                <span class="detail-meta">${escapeHtml(item.type)} - ${escapeHtml(activityDateLabel(item.date))}</span>
                ${item.site_slug ? `<button class="profile-feed-title" type="button" data-profile-site="${escapeHtml(item.site_slug)}">${escapeHtml(item.title)}</button>` : `<strong>${escapeHtml(item.title)}</strong>`}
                ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}
              </div>
              <span class="profile-feed-points" aria-label="${Number(item.points) || 0} points earned">+${Number(item.points) || 0}</span>
            </article>
          `).join("") : `<p class="detail-meta">Activity will appear here after comments, visits, daily signed-in visits, or language quizzes.</p>`}
        </section>
      `;
    }

    function mobileProfilePointTotal(stats = {}) {
      return PROFILE_UTILS.profilePointTotal(stats);
    }

    function mobileProfilePointsBreakdownHtml(stats = {}, profile = {}, hidden = true) {
      const rows = PROFILE_UTILS.profilePointBreakdownRows(stats);
      const achievements = PROFILE_UTILS.profileAchievementsFromStats(stats);
      const details = [
        ["Places visited", stats.visitsCount, "Distinct map places saved as visited."],
        ["Nearby check-ins", stats.checkinsCount, "Visits confirmed while near a mapped place."],
        ["Approved comments", stats.commentsCount, "Community notes approved for public display.", "comments"],
        ["Language work", stats.languageLearned, "Distinct language words answered correctly."],
        ["Signed-in visit streak", stats.loginStreak, "Consecutive eligible days after the 24-hour interval."],
        ["Helpful votes", stats.commentUpvotes, "Positive votes received on approved comments.", "helpful"],
        ["Suggested sites", stats.suggestionsCount, "Site suggestions connected to this profile."],
        ["Homelands explored", stats.homelandsCount, "Distinct ancestral homelands represented by visited places."]
      ];
      return `
        <section class="visit-preview profile-points-detail" data-mobile-profile-progress ${hidden ? "hidden aria-hidden=\"true\"" : "aria-hidden=\"false\""}>
          <strong>Progress details</strong>
          <p class="detail-meta">Counts update from approved activity and saved account progress.</p>
          <div class="profile-progress-grid">
            ${details.map(([label, value, explanation, review]) => `
              <${review ? "button" : "div"} class="profile-progress-row" ${review ? `type="button" data-show-mobile-profile-${review === "helpful" ? "helpful" : "comments"}` : ""}>
                <span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(explanation)}</small></span>
                <strong>${Number(value) || 0}</strong>
              </${review ? "button" : "div"}>
            `).join("")}
          </div>
          <strong>Points</strong>
          ${rows.length ? rows.map(([label, value]) => `<div class="points-breakdown-row"><span>${escapeHtml(label)}</span><strong>${Number(value) || 0}</strong></div>`).join("") : `<p class="detail-meta">Points appear after daily opens, visits, check-ins, language quizzes, and community activity.</p>`}
          <div class="points-breakdown-row"><span>Total</span><strong>${mobileProfilePointTotal(stats)}</strong></div>
          <strong>Achievements</strong>
          <div class="profile-achievement-list">
            ${achievements.map(achievement => {
              const review = achievement.metric === "commentsCount" ? "comments" : achievement.metric === "commentUpvotes" ? "helpful" : "";
              return `
              <${review ? "button" : "div"} class="profile-progress-row${achievement.earned ? " earned" : ""}" ${review ? `type="button" data-show-mobile-profile-${review}` : ""}>
                <span><strong>${escapeHtml(achievement.label)}</strong><small>${achievement.earned ? "Completed" : `${achievement.target - achievement.value} remaining`}</small></span>
                <strong>${escapeHtml(achievement.progressLabel)}</strong>
              </${review ? "button" : "div"}>
            `;
            }).join("")}
          </div>
        </section>
      `;
    }

    function mobileProfileCommentsHtml(profile, hidden = true) {
      const comments = profileActivity(profile || {}).comments.slice().reverse();
      return `
        <section class="visit-preview profile-comments-section" data-mobile-profile-comments ${hidden ? "hidden aria-hidden=\"true\"" : "aria-hidden=\"false\""}>
          <strong>Approved Comments</strong>
          ${comments.length ? comments.map(comment => `
            <article class="profile-activity-item">
              <span class="detail-meta">${escapeHtml(formatDate(comment.created_at || ""))}</span>
              <button class="action secondary" type="button" data-profile-site="${escapeHtml(comment.site_slug || comment.source_slug || "")}">View on ${escapeHtml(comment.site_title || comment.source_title || "article")}</button>
              <p>${escapeHtml(comment.comment || "")}</p>
            </article>
          `).join("") : `<p class="detail-meta">No approved comments yet.</p>`}
        </section>
      `;
    }

    function currentProfileId() {
      return Number(currentContributorProfile()?.id || 0);
    }

    function activeFollowsFor(profileId = currentProfileId()) {
      return state.profileFollows.filter(item => item.status === "active" && Number(item.follower_profile) === Number(profileId));
    }

    function isFollowing(profileId) {
      return activeFollowsFor().some(item => Number(item.following_profile) === Number(profileId));
    }

    function isFriend(profileId) {
      const me = currentProfileId();
      return isFollowing(profileId) && state.profileFollows.some(item =>
        item.status === "active" &&
        Number(item.follower_profile) === Number(profileId) &&
        Number(item.following_profile) === Number(me)
      );
    }

    function mergeProfileFollowRecords(records = []) {
      records.filter(Boolean).forEach(record => {
        const id = Number(record.id);
        const followerId = Number(relationId(record.follower_profile));
        const followingId = Number(relationId(record.following_profile));
        const index = Number.isFinite(id) && id > 0
          ? state.profileFollows.findIndex(item => Number(item.id) === id)
          : state.profileFollows.findIndex(item =>
            Number(relationId(item.follower_profile)) === followerId &&
            Number(relationId(item.following_profile)) === followingId
          );
        if (index >= 0) state.profileFollows[index] = { ...state.profileFollows[index], ...record };
        else state.profileFollows.push(record);
      });
    }

    async function refreshRemoteProfileFollow(followerId, followingId) {
      if (!followerId || !followingId) return null;
      const response = await fetchJson(
        `/items/mobile_profile_follows?limit=1&filter[status][_eq]=active&filter[follower_profile][_eq]=${encodeURIComponent(followerId)}&filter[following_profile][_eq]=${encodeURIComponent(followingId)}&fields=${FOLLOW_FIELDS}`,
        { fresh: true }
      );
      const record = response.data?.[0] || null;
      if (record) mergeProfileFollowRecords([record]);
      return record;
    }

    function milestoneText(profile) {
      const activity = profileActivity(profile);
      return PROFILE_UTILS.profileStatsFromActivity(activity, {
        languageLearned: learnedLanguageWords(profile).length,
        languageCorrectAttempts: languageCorrectAttemptCount(profile),
        loginRewards: loginRewardStats(profile),
        emptyMilestone: "New Contributor"
      }).milestone;
    }

    async function followProfile(profile) {
      const me = currentContributorProfile();
      if (!me?.id || state.contributorSession?.pending) {
        openSheet(loginSheetEl);
        showBanner("Login to follow contributors.");
        return;
      }
      if (Number(me.id) === Number(profile.id)) {
        showBanner("This is your contributor profile.");
        return;
      }
      if (isFollowing(profile.id)) {
        showBanner(`Already following ${profile.display_name || profile.username}.`);
        return;
      }
      const existingFollow = await refreshRemoteProfileFollow(me.id, profile.id).catch(() => null);
      if (existingFollow) {
        showBanner(`Already following ${profile.display_name || profile.username}.`);
        renderProfiles();
        renderFollowing();
        return;
      }
      const payload = {
        status: "active",
        follower_profile: Number(me.id),
        following_profile: Number(profile.id),
        follower_name: me.display_name || me.username || "Contributor",
        following_name: profile.display_name || profile.username || "Contributor",
        created_at: new Date().toISOString()
      };
      const created = await postDirectusItem("mobile_profile_follows", payload, { requireAuth: true });
      mergeProfileFollowRecords([{ id: created.data?.id, ...payload, ...(created.data || {}) }]);
      showBanner(`Following ${payload.following_name}.`);
      renderProfiles();
      renderFollowing();
    }

    function followedProfiles() {
      const ids = new Set(activeFollowsFor().map(item => Number(item.following_profile)));
      return publicContributorProfiles().filter(profile => ids.has(Number(profile.id)));
    }

    function renderFollowing() {
      if (!followingListEl) return;
      const me = currentContributorProfile();
      if (!me?.id) {
        followingListEl.innerHTML = `<p class="summary">Login to follow contributor activity.</p>`;
        return;
      }
      const profiles = followedProfiles();
      if (!profiles.length) {
        followingListEl.innerHTML = `<p class="summary">You are not following anyone yet. Open Contributors and follow people to build this feed.</p>`;
        return;
      }
      const followedIds = new Set(profiles.map(profile => Number(profile.id)));
      const comments = state.publicComments
        .filter(comment => followedIds.has(Number(comment.member_profile)))
        .map(comment => ({ type: "comment", date: comment.created_at, profile: state.contributorProfiles.find(profile => Number(profile.id) === Number(comment.member_profile)), item: comment }));
      const visits = state.publicVisits
        .filter(visit => followedIds.has(Number(visit.member_profile)))
        .map(visit => ({ type: "visit", date: visit.visited_at, profile: state.contributorProfiles.find(profile => Number(profile.id) === Number(visit.member_profile)), item: visit }));
      const feed = [...comments, ...visits]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 30);
      followingListEl.innerHTML = `
        <p class="summary">Following ${profiles.length} contributor${profiles.length === 1 ? "" : "s"}.</p>
        ${profiles.map(profile => `<div class="badge"><strong>${escapeHtml(profile.display_name || profile.username || "Contributor")}</strong><span>${isFriend(profile.id) ? "Friend - " : ""}${escapeHtml(milestoneText(profile))}</span></div>`).join("")}
        <section class="section"><h3>Latest Activity</h3>
          ${feed.map(entry => {
            const name = entry.profile?.display_name || entry.profile?.username || "Contributor";
            if (entry.type === "visit") {
              return `<article class="comment"><strong>${escapeHtml(name)} visited</strong><button class="action secondary" type="button" data-profile-site="${escapeHtml(entry.item.site_slug || "")}">${escapeHtml(entry.item.site_title || "Visited site")}</button></article>`;
            }
            const image = directusAssetUrl(entry.item.comment_image);
            return `<article class="comment"><strong>${escapeHtml(name)} commented</strong><button class="action secondary" type="button" data-profile-site="${escapeHtml(entry.item.site_slug || entry.item.source_slug || "")}">${escapeHtml(entry.item.site_title || entry.item.source_title || "Site")}</button><p>${escapeHtml(entry.item.comment || "")}</p>${image ? `<img class="hero" src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async">` : ""}</article>`;
          }).join("") || `<p class="summary">No recent public activity from followed contributors yet.</p>`}
        </section>
      `;
    }

    function sortedExhibits() {
      return [...state.exhibits].sort((a, b) => {
        const aPermanent = a.is_permanent || a.on_view_status === "permanent";
        const bPermanent = b.is_permanent || b.on_view_status === "permanent";
        if (aPermanent !== bPermanent) return aPermanent ? 1 : -1;
        return new Date(a.start_datetime || a.start_date || "9999-12-31") - new Date(b.start_datetime || b.start_date || "9999-12-31") ||
          String(a.title || "").localeCompare(String(b.title || ""));
      });
    }

    function renderEventsList() {
      if (!eventsListEl) return;
      const events = sortedExhibits().filter(isExhibitActive);
      eventsListEl.innerHTML = `
        <p class="summary">Upcoming events, exhibits, and permanent collection moments can appear on the map and calendar list.</p>
        ${events.map(exhibit => {
          const image = directusAssetUrl(exhibit.cover_image);
          return `
            <button class="site-card" type="button" data-event-slug="${escapeHtml(exhibit.slug || exhibit.id)}">
              ${image ? `<img class="thumb" src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async">` : `<span class="thumb empty">${escapeHtml((exhibit.title || "E").slice(0, 1))}</span>`}
              <span class="site-copy">
                <h2>${escapeHtml(exhibit.title || "Untitled event")}</h2>
                <p>${escapeHtml([CALENDAR_UTILS.eventTypeLabel(exhibit.event_type), exhibit.venue || exhibit.address_label].filter(Boolean).join(" - "))}</p>
                <p>${escapeHtml(CALENDAR_UTILS.exhibitDateLabel(exhibit))}</p>
              </span>
              <span class="distance">Open</span>
            </button>
          `;
        }).join("") || `<p class="summary">No published events or exhibits yet.</p>`}
        ${isAdminContributor() ? `<a class="action secondary" href="${DIRECTUS}/admin/content/calendar_events/+" target="_blank" rel="noreferrer">Add event</a>` : ""}
      `;
    }

    const activityDateValue = SHARED_UTILS.activityDateValue;

    function activityDateLabel(value) {
      return ACTIVITY_UTILS.dateLabel(value, { relative: true, includeTime: true });
    }

    function activityPreview(value, limit = 132) {
      return ACTIVITY_UTILS.preview(value, { limit, cleanText: publicCleanText });
    }

    function latestMobileActivity() {
      const comments = state.publicComments
        .filter(commentVisibleToCurrentViewer)
        .map(comment => {
          const profile = state.contributorProfiles.find(item => Number(item.id) === Number(comment.member_profile));
          const plantFields = isPlantObservationComment(comment) ? plantObservationFields(comment) : null;
          const sourceType = normalizeCommentSourceType(comment) || "site";
          return {
            type: sourceType === "support" ? "support" : "comment",
            sourceType,
            commentId: String(comment.id || ""),
            slug: comment.source_slug || comment.site_slug || "",
            title: comment.site_title || comment.source_title || "Community note",
            authorName: profile?.display_name || comment.author_name || "Contributor",
            label: ACTIVITY_UTILS.commentLabel(sourceType, {
              plantObservation: Boolean(plantFields),
              authorName: profile?.display_name || comment.author_name || "Contributor"
            }),
            preview: plantFields ? publicCleanText(`${plantFields.name} - ${plantFields.vocabulary || plantFields.identification}`) : publicCleanText(comment.comment),
            date: comment.created_at
          };
        });
      const suggestions = (state.siteSuggestions || [])
        .filter(() => !isCurrentAdminReviewer())
        .filter(suggestion => String(suggestion.status || "").toLowerCase() === "approved")
        .map(suggestion => ({
          type: "suggestion",
          slug: String(suggestion.id || ""),
          title: suggestion.title || "Suggested site",
          label: ACTIVITY_UTILS.suggestionLabel(suggestion),
          preview: publicCleanText(suggestion.review_note || "A contributor sent information for On This Site."),
          date: ACTIVITY_UTILS.suggestionDate(suggestion)
        }))
        .filter(item => activityDateValue(item.date));
      const historicMoments = (state.timelineEvents || [])
        .map(moment => {
          const sourceSite = moment.source_type === "site"
            ? state.sites.find(site => site.slug === moment.source_slug || Number(site.id) === Number(moment.source_id))
            : null;
          const sourceWiki = moment.source_type === "wiki"
            ? state.wikiArticles.find(article => article.slug === moment.source_slug || Number(article.id) === Number(moment.source_id))
            : null;
          if (sourceWiki && ACTIVITY_UTILS.wikiActivityLabel(sourceWiki) === "New Article") return null;
          const date = ACTIVITY_UTILS.contentUpdateDate(sourceSite || sourceWiki);
          return {
            type: "historic-moment",
            sourceType: moment.source_type === "wiki" ? "wiki" : "site",
            activityId: String(moment.id || ""),
            slug: moment.source_slug || "",
            title: moment.title || moment.source_title || "Historic moment",
            label: "Historic moment updated",
             preview: publicCleanText(moment.description || moment.source_excerpt || moment.citation || ""),
             sourceTitle: (sourceSite || sourceWiki)?.title || moment.source_title || "",
             date
          };
        })
        .filter(Boolean)
        .filter(item => item.slug && activityDateValue(item.date));
      const visits = state.publicVisits.map(visit => ({
        type: "site",
        slug: visit.site_slug || "",
        title: visit.site_title || "Visited site",
        label: "Site visit",
        preview: `${visit.visitor_name || "A contributor"} marked this place visited.`,
        date: visit.visited_at
      }));
      const stories = activeMapStories().map(story => ({
        type: "map-story",
        slug: String(story.id || ""),
        title: story.attached_site_title || "Shared from the map",
        authorName: MAP_STORY_UTILS.authorName(story),
        label: `${story.author_name || "Contributor"} shared a story`,
        preview: publicCleanText(story.caption || ""),
        image: directusAssetUrl(story.photo),
        date: story.created_at
      }));
      const sites = state.sites
        .filter(site => site.slug !== "address-result")
        .map(site => {
          const pinned = ACTIVITY_UTILS.activityIsPinned(site);
          const label = pinned ? ACTIVITY_UTILS.activityPinLabel(site) : ACTIVITY_UTILS.siteActivityLabel(site);
          const activityMedia = mobileActivitySiteMedia(site);
          const date = pinned
            ? ACTIVITY_UTILS.siteEditedDate(site, { extended: true })
            : ACTIVITY_UTILS.siteActivityDate(site);
          return {
            type: "site",
            slug: site.slug,
            title: pinned && site.activity_pin_title ? site.activity_pin_title : site.title,
            label,
            preview: pinned && site.activity_pin_preview
              ? publicCleanText(site.activity_pin_preview)
              : ACTIVITY_UTILS.activityNewsPreview(site, {
                  type: "site",
                  timelineEvents: state.timelineEvents,
                  cleanText: publicCleanText,
                  isNew: label === "Site added"
                }),
            image: activityMedia.image,
            imageFallback: activityMedia.fallback,
            date,
            pinUntil: site.activity_pin_until,
            pinned
          };
        })
        .filter(item => item.pinned || (activityDateValue(item.date) && item.preview));
      const wikis = state.wikiArticles.map(article => {
        const label = ACTIVITY_UTILS.wikiActivityLabel(article);
        return {
          type: "wiki",
          slug: article.slug,
          title: article.title || "Knowledgebase article",
          label,
          preview: ACTIVITY_UTILS.activityNewsPreview(article, {
            type: "wiki",
            timelineEvents: state.timelineEvents,
            cleanText: publicCleanText,
            isNew: label === "New Article"
          }),
          image: firstContentImage(article.content),
          date: ACTIVITY_UTILS.wikiActivityDate(article),
          activityPriority: ACTIVITY_UTILS.wikiActivityPriority(article)
        };
      }).filter(item => activityDateValue(item.date) && item.preview);
      const events = state.exhibits.map(exhibit => {
        const pinned = ACTIVITY_UTILS.activityIsPinned(exhibit);
        const eventTargetSlug = exhibit.related_site_slug || exhibit.source_slug || String(exhibit.slug || exhibit.id || "");
        return {
          type: "event",
          slug: eventTargetSlug,
          activityId: String(exhibit.id || ""),
          title: pinned && exhibit.activity_pin_title ? exhibit.activity_pin_title : exhibit.title || "Event",
          label: pinned ? ACTIVITY_UTILS.activityPinLabel(exhibit) : CALENDAR_UTILS.eventTypeLabel(exhibit.event_type),
          preview: publicCleanText(pinned && exhibit.activity_pin_preview ? exhibit.activity_pin_preview : exhibit.summary || exhibit.description || exhibit.venue || ""),
          image: directusAssetUrl(exhibit.cover_image),
          date: ACTIVITY_UTILS.eventActivityDate(exhibit),
          pinUntil: exhibit.activity_pin_until,
          pinned
        };
      }).filter(item => item.pinned || activityDateValue(item.date));
      return ACTIVITY_UTILS.mergeRecentActivity([
          comments,
          suggestions,
          historicMoments,
          visits,
          stories,
          sites,
          wikis,
          events
        ], { limit: 80 })
        .filter(item => item.slug || item.type === "event")
        .slice(0, 40);
    }

    function mobileActivitySourceRecord(sourceType, slug, id = "") {
      if (sourceType === "wiki") {
        return state.wikiBySlug.get(slug) ||
          state.wikiArticles.find(article => String(article.id) === String(id) || article.slug === slug) ||
          null;
      }
      if (sourceType === "site") {
        return state.siteBySlug.get(slug) ||
          state.sites.find(site => String(site.id) === String(id) || site.slug === slug) ||
          null;
      }
      return null;
    }

    function mobileActivitySiteMedia(record) {
      if (!record) return { image: "", fallback: "" };
      const thumbnail = MEDIA_UTILS.listingImage(record, { directusAssetUrl, rewriteMediaUrl });
      const hero = listingImage(record);
      return {
        image: thumbnail || hero,
        fallback: hero && hero !== thumbnail ? hero : listingImageFallback(record)
      };
    }

    function mobileActivitySourceMedia(sourceType, record) {
      if (!record) return { image: "", fallback: "" };
      if (sourceType === "site") {
        return mobileActivitySiteMedia(record);
      }
      if (sourceType === "wiki") {
        const raw = MEDIA_UTILS.cleanImageUrl(record.activity_image_url || "");
        const image = raw ? rewriteMediaUrl(raw) : firstContentImage(record.content || "");
        const absolute = raw ? MEDIA_UTILS.absoluteMediaUrl(raw, window.location.href) : "";
        return {
          image,
          fallback: absolute && absolute !== image ? absolute : ""
        };
      }
      return { image: "", fallback: "" };
    }

    function mobileActivityCardModel(item, index) {
      const type = String(item.type || "");
      const comment = type === "comment"
        ? state.publicComments.find(record => String(record.id) === String(item.commentId || item.id))
        : null;
      const story = type === "map-story"
        ? state.mapStories.find(record => String(record.id) === String(item.slug || item.id))
        : null;
      const moment = type === "historic-moment"
        ? state.timelineEvents.find(record => String(record.id) === String(item.activityId || item.id))
        : null;
      const exhibit = type === "event"
        ? state.exhibits.find(record => String(record.id) === String(item.activityId) || String(record.slug || record.id) === String(item.slug))
        : null;
      const sourceType = type === "comment"
        ? normalizeCommentSourceType(comment || { source_type: item.sourceType })
        : item.sourceType || (type === "wiki" ? "wiki" : type === "site" ? "site" : "");
      let canonicalTarget = mobileActivitySourceRecord(
        sourceType,
        item.slug || comment?.source_slug || comment?.site_slug || moment?.source_slug || "",
        comment?.source_id || moment?.source_id || ""
      );
      if (!canonicalTarget && type === "event") {
        canonicalTarget = mobileActivitySourceRecord("site", exhibit?.related_site_slug || exhibit?.source_slug || item.slug || "");
      }
      const canonicalType = canonicalTarget
        ? (state.wikiBySlug.has(canonicalTarget.slug) || sourceType === "wiki" ? "wiki" : "site")
        : "";
      const canonicalSlug = canonicalTarget?.slug || "";
      const authorName = item.authorName ||
        (comment ? state.contributorProfiles.find(profile => Number(profile.id) === Number(comment.member_profile))?.display_name || comment.author_name : "") ||
        (story ? MAP_STORY_UTILS.authorName(story) : "");
      const commentReactionState = comment ? currentCommentReactionState(comment) : null;
      const storyCounts = story ? MAP_STORY_UTILS.storyVoteCounts(story, state.mapStoryVotes) : null;
      const sourceTitle = canonicalTarget?.title || item.title || "On This Site";
      const cardType = type === "map-story" ? "user-story" : type;
      const canonicalMedia = mobileActivitySourceMedia(canonicalType, canonicalTarget);
      const imageUrl = item.image || canonicalMedia.image;
      const imageFallbackUrl = item.imageFallback || canonicalMedia.fallback;
      const supportsVote = Boolean(comment?.id || story?.id);
      const supportsComment = Boolean(canonicalTarget && ["site", "wiki"].includes(canonicalType));
      const normalized = normalizeMobileLearningCard({
         key: item.activityGroupKey || `activity:${type}:${item.commentId || item.activityId || item.id || item.slug || index}`,
        id: item.commentId || item.activityId || item.id || item.slug || index,
        type: cardType,
        title: type === "map-story"
          ? `${authorName || "A community member"} shared a story${story?.attached_site_title ? ` at ${story.attached_site_title}` : ""}`
          : item.title,
        sourceName: type === "map-story" ? (story?.attached_site_title || authorName) : sourceTitle,
        pageName: sourceTitle,
        authorName,
        date: item.date,
        imageUrl,
        imageFallbackUrl,
        excerpt: item.preview,
        target: canonicalTarget ? { type: canonicalType, id: canonicalTarget.id, slug: canonicalSlug } : (
          story ? { type: "user-story", id: story.id, slug: String(story.id) } :
            exhibit ? { type: "event", id: exhibit.id, slug: String(exhibit.slug || exhibit.id) } : null
        ),
        counts: {
          upvotes: commentReactionState?.counts?.up || storyCounts?.up || 0,
          comments: canonicalTarget ? learningCardCommentCount(canonicalType, canonicalTarget) : 0
        },
        capabilities: {
          open: Boolean(canonicalTarget || story || exhibit || type === "suggestion" || type === "support"),
          vote: supportsVote,
          comment: supportsComment
        },
        permissions: {
          loggedIn: isApprovedContributor(),
          canVote: supportsVote && isApprovedContributor(),
          canComment: supportsComment && isApprovedContributor()
        },
        pinned: item.pinned
      });
      return {
        ...normalized,
        activityType: type,
        activityLabel: item.label || "Archive activity",
        activityId: item.activityId || item.id || "",
        activitySlug: item.slug || "",
        sourceType,
        canonicalTarget,
        canonicalType,
        canonicalSlug,
        comment,
         story,
         authorName,
         updates: Array.isArray(item.updates) ? item.updates : [],
         hasVoted: Boolean(commentReactionState?.active || (story && MAP_STORY_UTILS.hasMemberVote(story, state.mapStoryVotes, currentContributorProfile()?.id)))
      };
    }

    function mobileActivityLearningCards(feed = latestMobileActivity()) {
      return feed.map(mobileActivityCardModel);
    }

    function isCurrentAdminReviewer() {
      const email = normalizeAccountEmail(state.profile?.email || currentContributorProfile()?.username || "");
      return isAdminContributor() || email === "jeremynative@gmail.com";
    }

    function adminAccountRegistrationsRequest() {
      if (!isCurrentAdminReviewer()) return Promise.resolve({ data: [] });
      return fetchJson(`/items/mobile_account_registrations?limit=-1&sort=-created_at&fields=${ACCOUNT_REGISTRATION_FIELDS}`, { fresh: true });
    }

    function adminMobileSuggestionNotifications() {
      if (!isCurrentAdminReviewer()) return [];
      return (state.siteSuggestions || [])
        .map(item => {
          const feedback = ACTIVITY_UTILS.suggestionIsFeedback(item);
          const status = String(item.status || "pending").toLowerCase();
          return {
            type: "suggestion-review",
            slug: String(item.id || ""),
            title: feedback ? "Feedback needs review" : status === "pending" ? "Suggested site needs review" : "Site suggestion",
            label: `${feedback ? "Feedback" : "Suggested site"} - ${status}`,
            preview: activityPreview(item.introduction || item.review_note || "A contributor sent information for On This Site."),
            date: ACTIVITY_UTILS.suggestionDate(item),
            meta: `${item.author_name || item.author_email || "Contributor"}${item.suggested_image ? " - screenshot attached" : ""}`,
            image: directusAssetUrl(item.suggested_image),
            pendingReview: status === "pending"
          };
        });
    }

    function pendingMobileAccountNotifications() {
      if (!isCurrentAdminReviewer()) return [];
      return (state.accountRegistrations || [])
        .filter(item => ACTIVITY_UTILS.registrationNeedsReview(item))
        .map(item => ({
          type: "account-review",
          slug: String(item.id || ""),
          title: "New contributor account",
          label: "Account request",
          preview: activityPreview(item.review_note || item.email || item.email_normalized || "A contributor account is waiting for review."),
          date: ACTIVITY_UTILS.registrationDate(item),
          meta: item.display_name || item.email || item.email_normalized || "New account"
        }));
    }

    function personalMobileNotificationItems() {
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
            type: "comment",
            slug: comment.source_slug || comment.site_slug || "",
            sourceType: sourceType || "site",
            commentId,
            title: isPlantComment ? "Someone commented on your flower" : "Someone replied to you",
            label: isPlantComment ? "Flower note" : "Reply",
            preview: activityPreview(comment.comment || ""),
            date: comment.created_at,
            meta: comment.author_name || "Contributor"
          };
        })
        .filter(Boolean);
    }

    function latestMobileNotifications(limit = 30) {
      return ACTIVITY_UTILS.mergeRecentActivity([personalMobileNotificationItems(), adminMobileSuggestionNotifications(), pendingMobileAccountNotifications()], { limit });
    }

    function mobileNotificationLastSeenKey() {
      const profile = currentContributorProfile?.();
      const key = profile?.id || state.profile?.profileId || state.profile?.email || "public";
      return ACTIVITY_UTILS.lastSeenKey("nli-mobile-notification-last-seen", key);
    }

    function mobileUnreadNotificationCount() {
      const seen = ACTIVITY_UTILS.readSeen(mobileNotificationLastSeenKey());
      return ACTIVITY_UTILS.unreadCount(latestMobileNotifications(), seen, { capAtNow: true });
    }

    function updateMobileNotificationUnreadBadge() {
      const badge = document.querySelector("[data-mobile-notification-unread-badge]");
      if (!badge) return;
      const count = mobileUnreadNotificationCount();
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.hidden = count <= 0;
      badge.classList.toggle("show", count > 0);
      mobileNotificationsOpenBtn?.setAttribute("aria-label", count > 0 ? `Open notifications, ${count} new` : "Open notifications");
    }

    function markMobileNotificationsSeen() {
      ACTIVITY_UTILS.writeSeen(mobileNotificationLastSeenKey(), latestMobileNotifications(), { capAtNow: true });
      updateMobileNotificationUnreadBadge();
    }

    function mobileActivityLastSeenKey() {
      const profile = currentContributorProfile?.();
      const key = profile?.id || state.profile?.profileId || state.profile?.email || "public";
      return ACTIVITY_UTILS.lastSeenKey("nli-mobile-activity-last-seen", key);
    }

    function mobileUnreadActivityCount() {
      const seen = ACTIVITY_UTILS.readSeen(mobileActivityLastSeenKey());
      return ACTIVITY_UTILS.unreadCount(latestMobileActivity(), seen, { capAtNow: true });
    }

    function updateMobileActivityUnreadBadge() {
      const badge = document.querySelector("[data-mobile-activity-unread-badge]");
      if (!badge) return;
      const count = mobileUnreadActivityCount();
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.hidden = count <= 0;
      badge.classList.toggle("show", count > 0);
      mobileActivityOpenBtn?.setAttribute("aria-label", count > 0 ? `Open community activity, ${count} new updates` : "Open community activity");
    }

    function markMobileActivitySeen() {
      ACTIVITY_UTILS.writeSeen(mobileActivityLastSeenKey(), latestMobileActivity(), { capAtNow: true });
      updateMobileActivityUnreadBadge();
      updateMobileNotificationUnreadBadge();
    }

    function mobileActivityFeedSignature(feed = []) {
      const cards = mobileActivityLearningCards(feed);
      const cardSignature = typeof LEARNING_CARD_UTILS.learningCardsSignature === "function"
        ? LEARNING_CARD_UTILS.learningCardsSignature(cards)
        : cards.map(card => JSON.stringify(card)).join("\u001e");
      return `${cardSignature}\u001d${cards.map(card => [
        card.activityLabel,
        card.activityType,
        card.activitySlug,
        card.activityId,
        card.authorName,
        card.hasVoted ? "1" : "0"
      ].join("\u001f")).join("\u001e")}`;
    }

    function mobileActivityCommentThreadHtml(card) {
      const comments = card.canonicalTarget ? commentsForSource(card.canonicalType, card.canonicalTarget) : [];
      const roots = comments.filter(comment => !comment.parent_comment);
      const repliesFor = parentId => comments.filter(comment => Number(comment.parent_comment) === Number(parentId));
      const renderComment = (comment, depth = 0) => {
        const author = state.contributorProfiles.find(profile => Number(profile.id) === Number(comment.member_profile));
        const name = author?.display_name || comment.author_name || "Contributor";
        const avatar = directusAssetUrl(author?.avatar);
        const initial = (name || "?").trim().slice(0, 1) || "?";
        const parsed = QUOTE_COMMENT_UTILS.parseCommentRecord(comment);
        const body = parsed.body || (!parsed.quote ? comment.comment || "" : "");
        const attachment = directusAssetUrl(comment.comment_image);
        const attachmentTitle = body ? `${name}: ${body}` : `${name} comment photo`;
        return `
          <article class="activity-thread-comment${depth ? " is-reply" : ""}">
            <span class="comment-avatar" aria-hidden="true">${avatar ? `<img src="${escapeHtml(avatar)}" alt="">` : escapeHtml(initial)}</span>
            <div class="activity-thread-comment-copy">
              <div class="activity-thread-bubble">
                <strong>${escapeHtml(name)}</strong>
                ${parsed.quote ? `<blockquote>${escapeHtml(parsed.quote)}</blockquote>` : ""}
                ${body ? `<p>${escapeHtml(body)}</p>` : ""}
                ${attachment ? `
                  <button class="comment-image-button" type="button" data-comment-photo-view="${escapeHtml(attachment)}" data-comment-photo-title="${escapeHtml(attachmentTitle)}" aria-label="Open image attached to ${escapeHtml(name)}'s comment">
                    <img class="comment-image activity-thread-image" src="${escapeHtml(attachment)}" alt="" loading="lazy" decoding="async">
                  </button>
                ` : ""}
              </div>
              <time>${comment.created_at ? escapeHtml(new Date(comment.created_at).toLocaleString()) : "Approved comment"}</time>
            </div>
          </article>
          ${repliesFor(comment.id).map(reply => renderComment(reply, depth + 1)).join("")}
        `;
      };
      return `
        <div class="activity-comment-thread" aria-label="Existing comments">
          <div class="activity-comment-thread-heading">
            <strong>${comments.length} comment${comments.length === 1 ? "" : "s"}</strong>
            <span>${comments.length ? "Join the conversation below." : "Start the conversation."}</span>
          </div>
          ${roots.length ? `<div class="activity-thread-list">${roots.map(comment => renderComment(comment)).join("")}</div>` : `<p class="activity-thread-empty">No comments yet.</p>`}
        </div>
      `;
    }

    function mobileActivityDiscussionHtml(card) {
      if (!card.capabilities.comment || !card.canonicalTarget) return "";
      const open = state.mobileActivityDiscussionKeys.has(card.key);
      const draft = state.mobileActivityDrafts.get(card.key) || "";
      const profile = currentContributorProfile();
      const currentName = profile?.display_name || profile?.username || "Contributor";
      const target = card.canonicalTarget;
      const parentComment = card.comment?.id || "";
      const replyProfile = parentComment ? relationId(card.comment?.member_profile) : "";
      const inputId = `activity-comment-${String(card.key).replace(/[^a-z0-9_-]+/gi, "-")}`;
      return `
        <section class="activity-inline-discussion discussion-section" data-activity-inline="true" data-discussion-type="${escapeHtml(card.canonicalType)}" data-discussion-id="${escapeHtml(target.id || "")}" data-discussion-slug="${escapeHtml(target.slug || "")}" data-discussion-title="${escapeHtml(target.title || card.sourceName)}"${open ? "" : " hidden"}>
          ${mobileActivityCommentThreadHtml(card)}
          ${card.permissions.canComment ? `
            <div class="activity-comment-composer">
              <label for="${escapeHtml(inputId)}">${parentComment ? `Reply to ${escapeHtml(card.authorName || "this contributor")}` : `Comment as ${escapeHtml(currentName)}`}</label>
              <textarea id="${escapeHtml(inputId)}" data-discussion-input data-mobile-activity-draft="${escapeHtml(card.key)}" placeholder="${parentComment ? "Write a respectful reply..." : "Add context, a memory, correction, or question..."}">${escapeHtml(draft)}</textarea>
              <input type="hidden" data-parent-comment value="${escapeHtml(parentComment)}">
              <input type="hidden" data-reply-to-profile value="${escapeHtml(replyProfile)}">
              <div class="activity-inline-discussion-actions">
                <button class="action secondary" type="button" data-submit-discussion>Post ${parentComment ? "reply" : "comment"}</button>
                <button class="learning-card-action" type="button" data-mobile-activity-comment-cancel="${escapeHtml(card.key)}">Close</button>
              </div>
            </div>
          ` : `
            <button class="learning-card-action activity-comment-login" type="button" data-mobile-activity-comment-login>Log in to add a comment</button>
          `}
        </section>
      `;
    }

    function mobileActivityUpdatesHtml(card) {
      if (!Array.isArray(card.updates) || !card.updates.length) return "";
      return `
        <div class="activity-update-summary">
          <strong>Updated content</strong>
          <ul>${card.updates.map(update => `<li>${update.title ? `<strong>${escapeHtml(update.title)}</strong>` : ""}${update.detail ? `<span>${escapeHtml(update.detail)}</span>` : ""}</li>`).join("")}</ul>
        </div>
      `;
    }

    function mobileActivityCardHtml(card, index) {
      const openAttributes = `data-mobile-activity-open data-mobile-activity-index="${index}"`;
      const canOpen = card.capabilities.open;
      const actionPrompt = isApprovedContributor() ? "" : "Log in to ";
      const sourceLabel = card.activityType === "map-story"
        ? (card.story?.attached_site_title || "Community map")
        : card.sourceName;
      const commentLabel = card.comment ? "Reply" : "Comment";
      return `
        <article class="activity-feed-item activity-learning-card learning-card${card.pinned ? " is-pinned" : ""}" data-learning-card-key="${escapeHtml(card.key)}" data-mobile-activity-key="${escapeHtml(card.key)}" data-mobile-activity-index="${index}" data-mobile-activity-type="${escapeHtml(card.activityType)}" data-mobile-activity-source-type="${escapeHtml(card.sourceType || "")}" data-mobile-activity-id="${escapeHtml(card.activityId || card.id || "")}" data-mobile-activity-slug="${escapeHtml(card.activitySlug || "")}">
          <header class="learning-card-header">
            <span>${card.pinned ? mobileActivityPinIconHtml() : ""}${escapeHtml(card.activityLabel)}</span>
            <time datetime="${escapeHtml(card.date || "")}">${escapeHtml(activityDateLabel(card.date))}</time>
          </header>
          <div class="learning-card-layout">
            ${learningCardImageHtml(card, canOpen ? openAttributes : "", "", { eager: index < MOBILE_ACTIVITY_INITIAL_LIMIT, priority: index < 2, hideWhenMissing: true })}
            <div class="learning-card-body">
              ${canOpen ? `<button class="learning-card-title" type="button" ${openAttributes}>${escapeHtml(card.title || "Archive activity")}</button>` : `<h3 class="learning-card-title-static">${escapeHtml(card.title || "Archive activity")}</h3>`}
              <p class="learning-card-source">Source: <strong>${escapeHtml(sourceLabel || "On This Site")}</strong></p>
               ${card.authorName ? `<p class="learning-card-author">By ${escapeHtml(card.authorName)}</p>` : ""}
               ${mobileActivityUpdatesHtml(card)}
               ${learningCardExcerptHtml(card)}
              <p class="learning-card-counts" aria-label="${card.counts.upvotes} helpful votes and ${card.counts.comments} comments">
                <span>${card.counts.upvotes} helpful</span>
                <span>${card.counts.comments} comment${card.counts.comments === 1 ? "" : "s"}</span>
              </p>
            </div>
          </div>
          <div class="learning-card-actions" aria-label="Activity actions">
            ${card.capabilities.vote ? `<button class="learning-card-action${card.hasVoted ? " is-active" : ""}" type="button" data-mobile-activity-helpful="${escapeHtml(card.key)}"${card.hasVoted ? " disabled" : ""}>${card.permissions.canVote ? "Helpful" : `${actionPrompt}vote`} ${card.counts.upvotes}</button>` : ""}
            ${card.capabilities.comment ? `<button class="learning-card-action" type="button" data-mobile-activity-comment="${escapeHtml(card.key)}" aria-expanded="${state.mobileActivityDiscussionKeys.has(card.key) ? "true" : "false"}"><span>${commentLabel}</span><span class="learning-card-action-count">${card.counts.comments}</span></button>` : ""}
          </div>
          ${mobileActivityDiscussionHtml(card)}
        </article>
      `;
    }

    function renderMobileActivitySheet(options = {}) {
      if (!mobileActivityListEl) return;
      const feed = latestMobileActivity();
      const cards = mobileActivityLearningCards(feed);
      const renderLimit = Math.max(1, Math.min(cards.length || 1, Number(state.mobileActivityRenderLimit || MOBILE_ACTIVITY_INITIAL_LIMIT)));
      const signature = `${mobileActivityFeedSignature(feed)}\u001dlimit:${renderLimit}`;
      if (signature === state.mobileActivityRenderedSignature && mobileActivityListEl.hasChildNodes()) return;
      const preservedScrollTop = mobileActivityListEl.scrollTop;
      mobileActivityListEl.innerHTML = `
        <p class="summary">Recent public activity from the archive. Open a title or image for the full source; use the actions to respond in place.</p>
        ${cards.slice(0, renderLimit).map(mobileActivityCardHtml).join("") || `<p class="summary">No public activity has loaded yet.</p>`}
        ${renderLimit < cards.length ? `<button class="learning-card-load-more" type="button" data-mobile-activity-show-more>Load ${Math.min(MOBILE_ACTIVITY_INCREMENT, cards.length - renderLimit)} more updates</button>` : ""}
      `;
      state.mobileActivityRenderedSignature = signature;
      mobileActivityListEl.scrollTop = Math.min(preservedScrollTop, Math.max(0, mobileActivityListEl.scrollHeight - mobileActivityListEl.clientHeight));
    }

    function loadMoreMobileActivityCards() {
      const cards = mobileActivityLearningCards();
      state.mobileActivityRenderLimit = Math.min(cards.length, Number(state.mobileActivityRenderLimit || MOBILE_ACTIVITY_INITIAL_LIMIT) + MOBILE_ACTIVITY_INCREMENT);
      renderMobileActivitySheet();
    }

    function mobileActivityPinIconHtml() {
      return `<span class="activity-pin-icon" aria-label="Pinned"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l5 5-4 1-4 6-3-3 6-4 1-5Z"></path><path d="M9 13l-5 5"></path></svg></span>`;
    }

    function renderMobileNotificationsSheet() {
      if (!mobileNotificationsListEl) return;
      const items = latestMobileNotifications();
      mobileNotificationsListEl.innerHTML = `
        <p class="summary">Replies, plant notes, and review items.</p>
        ${items.map((item, index) => `
          <article class="activity-feed-item" data-mobile-notification-index="${index}" data-mobile-notification-type="${escapeHtml(item.type)}" data-mobile-notification-slug="${escapeHtml(item.slug || "")}" data-mobile-notification-source-type="${escapeHtml(item.sourceType || "")}" data-mobile-notification-comment-id="${escapeHtml(item.commentId || "")}">
            <button class="notification-main" type="button" data-open-mobile-notification>
              ${item.image ? `<span class="notification-thumb"><img src="${escapeHtml(item.image)}" alt="" loading="lazy" decoding="async" onerror="this.closest('.notification-thumb')?.remove();"></span>` : ""}
              <span class="detail-meta">${escapeHtml(item.label)} - ${escapeHtml(item.meta || activityDateLabel(item.date))}</span>
              <strong>${escapeHtml(item.title || "Notification")}</strong>
              ${item.preview ? `<p>${escapeHtml(item.preview)}</p>` : ""}
            </button>
            ${item.type === "suggestion-review" && item.pendingReview ? `<div class="notification-actions">
              <button type="button" data-mobile-notification-action="approve">Approve</button>
              <button type="button" data-mobile-notification-action="decline">Deny</button>
            </div>` : ""}
          </article>
        `).join("") || `<p class="summary">No notifications right now.</p>`}
      `;
    }

    async function openMobileActivitySheet() {
      const activityReady = state.deferredCommunityDataLoaded;
      if (activityReady) renderMobileActivitySheet();
      openSheet(activitySheetEl);
      if (!activityReady) {
        state.mobileActivityRenderedSignature = "";
        if (mobileActivityListEl) {
          mobileActivityListEl.innerHTML = `
            <div class="mobile-activity-loading" role="status" aria-live="polite" aria-busy="true">
              <span></span><span></span>
              <p>Loading the latest community activity...</p>
            </div>
          `;
        }
        await loadDeferredData({ includeCommunity: true });
      }
      markMobileActivitySeen();
    }

    async function openMobileNotificationsSheet() {
      renderMobileNotificationsSheet();
      openSheet(notificationsSheetEl);
      if (!state.deferredCommunityDataLoaded && !window.NLI_MOBILE_DATA) {
        await loadDeferredData({ includeCommunity: true });
      }
      renderMobileNotificationsSheet();
      markMobileNotificationsSeen();
    }

    function openMobileActivityTarget(button) {
      const type = button?.dataset.mobileActivityType || "";
      const slug = button?.dataset.mobileActivitySlug || "";
      const sourceType = button?.dataset.mobileActivitySourceType || "";
      const activityId = button?.dataset.mobileActivityId || "";
      activitySheetEl?.classList.remove("open");
      if (type === "map-story" && slug) {
        const story = state.mapStories.find(item => String(item.id) === String(slug));
        if (story && MAP_STORY_UTILS.isActive(story, state.mapStoryVotes, MAP_STORY_RULES)) {
          focusMapStory(story, { duration: 950 });
          openMapStory(story);
        }
        else {
          showBanner("That visitor story is no longer active.");
          renderMobileActivitySheet();
        }
      } else if (type === "suggestion" && slug) {
        const suggestion = state.siteSuggestions.find(item => String(item.id) === String(slug));
        const coords = Array.isArray(suggestion?.geojson?.coordinates)
          ? suggestion.geojson.coordinates
          : [Number(suggestion?.longitude), Number(suggestion?.latitude)];
        if (coords.every(Number.isFinite)) {
          state.map?.flyTo?.({ center: coords, zoom: Math.max(state.map.getZoom?.() || 9, 13), duration: 850 });
          showBanner(`${suggestion.title || "Suggested site"} is marked on the map.`);
        }
      } else if (type === "historic-moment") {
        if (sourceType === "wiki" && slug) {
          const event = activityId ? state.timelineEvents.find(item => String(item.id) === String(activityId)) : null;
          openWikiArticle(slug, { timelineEventId: activityId, timelineEvent: event });
        } else if (slug) openSite(slug, { timelineEventId: activityId });
      } else if (type === "support" || sourceType === "support") {
        openSupportPanel();
      } else if (type === "wiki" && slug) openWikiArticle(slug);
      else if (type === "event" && slug) {
        if (state.siteBySlug.has(slug)) return openSite(slug);
        const exhibit = state.exhibits.find(item => String(item.id) === String(activityId) || String(item.slug || item.id) === String(slug));
        if (exhibit) openExhibit(exhibit);
      } else if (slug && state.wikiBySlug.has(slug)) openWikiArticle(slug);
      else if (slug) openSite(slug);
      syncMobilePanelAccessibility();
    }

    async function handleMobileSuggestionReview(id, action) {
      if (!isCurrentAdminReviewer()) return showBanner("Only an editor can review suggestions.");
      const suggestion = state.siteSuggestions.find(item => String(item.id) === String(id));
      if (!suggestion) return showBanner("That suggestion is not loaded.");
      const nextStatus = action === "approve" ? "approved" : "declined";
      const stampedNote = `${suggestion.review_note || ""}\n${nextStatus === "approved" ? "Approved" : "Denied"} from mobile app by ${state.profile?.email || "admin"} on ${new Date().toISOString()}.`.trim();
      try {
        await triggerAdminNotificationAction(action === "approve" ? "approve" : "decline", {
          id: suggestion.id,
          status: nextStatus,
          review_note: stampedNote
        });
        suggestion.status = nextStatus;
        suggestion.review_note = stampedNote;
        renderMobileNotificationsSheet();
        renderMobileActivitySheet();
        showBanner(nextStatus === "approved" ? "Approved and archived." : "Denied and archived.");
      } catch (error) {
        showBanner("Could not update review status.");
      }
    }

    function openMobileNotificationTarget(card) {
      const type = card?.dataset.mobileNotificationType || "";
      const slug = card?.dataset.mobileNotificationSlug || "";
      notificationsSheetEl?.classList.remove("open");
      if (type === "suggestion-review") {
        const suggestion = state.siteSuggestions.find(item => String(item.id) === String(slug));
        const coords = Array.isArray(suggestion?.geojson?.coordinates)
          ? suggestion.geojson.coordinates
          : [Number(suggestion?.longitude), Number(suggestion?.latitude)];
        if (coords.every(Number.isFinite)) state.map?.flyTo?.({ center: coords, zoom: Math.max(state.map.getZoom?.() || 9, 13), duration: 850 });
        return;
      }
      if (type === "account-review") {
        if (slug) window.open(`${DIRECTUS}/admin/content/mobile_account_registrations/${encodeURIComponent(slug)}`, "_blank", "noopener,noreferrer");
        return;
      }
      if (type === "comment") {
        const sourceType = card.dataset.mobileNotificationSourceType || "";
        if (sourceType === "wiki" && slug) openWikiArticle(slug);
        else if (slug) openSite(slug);
      }
      syncMobilePanelAccessibility();
    }

    function renderProfiles() {
      if (!profilesListEl) return;
      if (profilesSortEl) profilesSortEl.value = state.contributorSortMode || "alpha";
      const rows = publicContributorProfiles().map(profile => {
        const activity = profileActivity(profile);
        const languageWords = learnedLanguageWords(profile);
        const stats = mobileProfileStats(profile, { syncRemote: false });
        return { profile, activity, languageWords, stats };
      }).sort((a, b) => {
        if (state.contributorSortMode === "points") {
          return Number(b.stats.points || 0) - Number(a.stats.points || 0)
            || String(a.profile.display_name || a.profile.username || "").localeCompare(String(b.profile.display_name || b.profile.username || ""));
        }
        return String(a.profile.display_name || a.profile.username || "").localeCompare(String(b.profile.display_name || b.profile.username || ""));
      });
      profilesListEl.innerHTML = rows.length ? rows.map(({ profile, activity, languageWords, stats }) => {
        const totalPoints = `${mobileProfilePointTotal(stats)} points`;
        const avatar = directusAssetUrl(profile.avatar);
        const profileKey = String(profile.id || profile.slug || profile.display_name || "");
        const profileAnchor = `mobile-profile-${profileKey.replace(/[^a-z0-9_-]/gi, "-")}`;
        const userSinceLine = profileUserSinceLine(profile);
        const expanded = state.expandedMobileProfileKey === profileKey;
        const name = profile.display_name || profile.username || "Contributor";
        return `
          <article class="comment contributor-card${expanded ? " is-expanded" : ""}" id="${escapeHtml(profileAnchor)}" data-mobile-profile-card="${escapeHtml(profileKey)}">
            <button class="contributor-summary" type="button" data-toggle-mobile-profile="${escapeHtml(profileKey)}" aria-expanded="${expanded ? "true" : "false"}">
              ${avatar ? `<img class="thumb" src="${escapeHtml(avatar)}" alt="">` : `<span class="thumb empty">${escapeHtml(name.slice(0, 1) || "?")}</span>`}
              <span class="contributor-summary-text">
                <strong>${escapeHtml(name)}</strong>
                <span>${escapeHtml(profile.role_label || "Contributor")}${profile.location_label ? ` - ${escapeHtml(profile.location_label)}` : ""}</span>
                <span>${escapeHtml(totalPoints)} - ${activity.comments.length} comments - ${activity.visits.length} visits</span>
              </span>
              <span class="contributor-chevron" aria-hidden="true">${expanded ? "Hide" : "Open"}</span>
            </button>
            <div class="contributor-body" ${expanded ? "" : "hidden"}>
              ${userSinceLine ? `<p class="detail-meta">${escapeHtml(userSinceLine)}</p>` : ""}
              ${profile.headline ? `<p class="summary">${escapeHtml(profile.headline)}</p>` : ""}
              ${profile.bio ? `<p>${escapeHtml(profile.bio)}</p>` : ""}
              <div class="profile-stats profile-stats-compact">
                <button class="profile-stat" type="button" data-show-mobile-profile-progress aria-expanded="false"><strong>${activity.comments.length}</strong><span class="detail-meta">comments</span></button>
                <button class="profile-stat" type="button" data-show-mobile-profile-progress aria-expanded="false"><strong>${activity.visits.length}</strong><span class="detail-meta">visits</span></button>
                <button class="profile-stat" type="button" data-show-profile-language aria-expanded="false"><strong>${languageWords.length}</strong><span class="detail-meta">language words</span></button>
                <button class="profile-stat" type="button" data-show-mobile-profile-progress aria-expanded="false"><strong>${stats.loginStreak}</strong><span class="detail-meta">day streak</span></button>
              </div>
              <button class="profile-total-points" type="button" data-show-mobile-profile-progress aria-expanded="false">${escapeHtml(totalPoints)} - view details</button>
              <p class="detail-meta">${escapeHtml(milestoneText(profile))}</p>
              ${supporterLine(profile) ? `<p class="detail-meta">${escapeHtml(supporterLine(profile))}</p>` : ""}
              ${mobileProfileBadgesHtml(profile)}
              ${mobileProfileTrackersHtml(profile, stats)}
              ${mobileProfilePointsBreakdownHtml(stats, profile, true)}
              ${mobileProfileActivityFeedHtml(profile, 6)}
              ${mobileProfileLanguageHtml(profile, true)}
              ${currentProfileId() && Number(currentProfileId()) !== Number(profile.id) ? `<button class="action secondary" type="button" data-follow-profile="${escapeHtml(profile.id)}">${isFriend(profile.id) ? "Friend" : isFollowing(profile.id) ? "Following" : "Follow"}</button>` : ""}
              ${activity.comments.length ? `<section class="section"><h3>Comments</h3>${activity.comments.map(comment => `
                <button class="action secondary" type="button" data-profile-site="${escapeHtml(comment.site_slug || "")}">${escapeHtml(comment.site_title || "Site")}</button>
                <p>${escapeHtml(comment.comment || "")}</p>
                ${directusAssetUrl(comment.comment_image) ? `<img class="hero" src="${escapeHtml(directusAssetUrl(comment.comment_image))}" alt="" loading="lazy" decoding="async">` : ""}
              `).join("")}</section>` : ""}
              ${activity.visits.length ? `<section class="section"><h3>Visited</h3>${activity.visits.map(visit => `
                <button class="action secondary" type="button" data-profile-site="${escapeHtml(visit.site_slug || "")}">${escapeHtml(visit.site_title || "Visited site")}</button>
              `).join("")}</section>` : ""}
            </div>
          </article>
        `;
      }).join("") : `<p class="summary">No public contributor profiles are published yet.</p>`;
    }

    function openMobileContributorProfile(profileKey) {
      const key = String(profileKey || "").trim().toLowerCase();
      const profile = state.contributorProfiles.find(item =>
        String(item.id || "") === String(profileKey || "") ||
        String(item.slug || "").toLowerCase() === key ||
        String(item.display_name || "").toLowerCase() === key ||
        String(item.username || "").toLowerCase() === key
      );
      if (!profile) {
        showBanner("Contributor profile is not public yet.");
        return;
      }
      state.expandedMobileProfileKey = String(profile.id || profile.slug || profile.display_name || "");
      openSheet(profilesSheetEl);
      window.setTimeout(() => {
        const selector = `[data-mobile-profile-card="${CSS.escape(String(profile.id || profile.slug || profile.display_name || ""))}"]`;
        const card = profilesListEl?.querySelector(selector);
        card?.scrollIntoView({ block: "start", behavior: "smooth" });
      }, 60);
    }

    function openSheet(sheet, options = {}) {
      document.querySelectorAll(".sheet.open").forEach(item => item.classList.remove("open"));
      document.querySelector(".mobile-more-menu[open]")?.removeAttribute("open");
      sheet.classList.add("open");
      syncMobilePanelAccessibility();
      resetMobilePanelScroll(sheet);
      const routeKey = mobileSheetRouteKey(sheet);
      if (routeKey) setMobileContentRoute({ page: routeKey }, options);
      if (sheet === rewardsSheetEl) renderRewards();
      if (sheet === profilesSheetEl) renderProfiles();
      if (sheet === followingSheetEl) renderFollowing();
      if (sheet === eventsSheetEl) renderEventsList();
      if (sheet === activitySheetEl) renderMobileActivitySheet();
      if (sheet === notificationsSheetEl) renderMobileNotificationsSheet();
      if (sheet === loginSheetEl) renderProfile();
      if (sheet === settingsSheetEl) {
        historyAlertsEl.checked = !!state.settings.historyAlerts;
        proximityAlertsEl.checked = !!state.settings.proximityAlerts;
        newContentAlertsEl.checked = !!state.settings.newContentAlerts;
      }
      if (sheet === storySheetEl) {
        updateStoryText();
        storyRecordBtn.textContent = "Record";
        storyRecordBtn.disabled = false;
        if (storyCameraStatusEl) {
          storyCameraStatusEl.hidden = true;
          storyCameraStatusEl.textContent = "";
        }
      }
      if (sheet === contributeSheetEl || sheet === suggestSiteSheetEl) updateContributionReviewCopy();
      if (sheet === suggestSiteSheetEl) setSuggestionMapPickMode(false);
      if (sheet === feedbackSheetEl) prefillFeedbackIdentity();
    }

    function prefillFeedbackIdentity() {
      const identity = currentContributorIdentity();
      if (feedbackNameEl && !feedbackNameEl.value.trim() && identity.name !== "Contributor") feedbackNameEl.value = identity.name;
      if (feedbackEmailEl && !feedbackEmailEl.value.trim() && identity.email) feedbackEmailEl.value = identity.email;
    }

    function openContributorAccountSheet() {
      try {
        renderProfile();
      } catch (error) {
        console.warn("Profile card will render after the account sheet opens.", error);
      }
      try {
        openSheet(loginSheetEl);
      } catch (error) {
        console.warn("Opening account sheet with fallback path.", error);
        document.querySelectorAll(".sheet.open").forEach(item => item.classList.remove("open"));
        loginSheetEl?.classList.add("open");
        syncMobilePanelAccessibility();
      }
      if (state.profile) {
        state.profileActivitySynced = false;
        ensureProfileStatsSynced()
          .then(() => renderProfile())
          .catch(error => console.warn("Profile sync will retry later.", error));
      }
    }

    async function sendFeedback() {
      const identity = currentContributorIdentity();
      const name = feedbackNameEl.value.trim() || identity.name || "";
      const email = feedbackEmailEl.value.trim() || identity.email || "";
      const message = feedbackMessageEl.value.trim();
      if (!message) {
        showBanner("Add a short feedback message first.");
        feedbackMessageEl.focus();
        return;
      }
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        showBanner("Enter a valid email address or leave it blank.");
        feedbackEmailEl.focus();
        return;
      }
      feedbackSubmitBtn.disabled = true;
      feedbackSubmitBtn.textContent = "Sending...";
      const screenshotFile = state.feedbackScreenshotFile || feedbackScreenshotEl?.files?.[0] || null;
      try {
        let accessToken = state.profile?.token || "";
        if (accessToken) {
          accessToken = await directusClient.ensureAuthSession({
            requireAuth: true,
            authExpiredMessage: "Your login expired. Please log in again before sending signed-in feedback."
          });
        }
        let screenshotId = null;
        let screenshotNote = screenshotFile ? "Screenshot capture/upload was requested." : "No screenshot.";
        if (screenshotFile) {
          try {
            feedbackSubmitBtn.textContent = "Uploading screenshot...";
            screenshotId = await uploadFeedbackScreenshot(screenshotFile, `mobile-feedback-${Date.now()}`);
            screenshotNote = screenshotId ? "Screenshot attached." : "Screenshot was not attached.";
          } catch (uploadError) {
            const attachmentError = new Error("The screenshot could not be uploaded, so the feedback was not sent. Remove the screenshot to send text only, or try the upload again.");
            attachmentError.isFeedbackScreenshotUploadError = true;
            attachmentError.cause = uploadError;
            throw attachmentError;
          }
        }
        feedbackSubmitBtn.textContent = "Sending...";
        const profile = identity.profile;
        const feedbackPayload = FEEDBACK_UTILS.buildFeedbackCommentPayload({
          platform: "mobile",
          name,
          email,
          message,
          profile,
          fallbackEmail: identity.email,
          pageUrl: window.location.href,
          screenshotId,
          screenshotNote
        });
        await FEEDBACK_UTILS.submitFeedbackReview(feedbackPayload, {
          platform: "mobile",
          appUrl: window.location.href,
          accessToken
        });
      } finally {
        feedbackSubmitBtn.disabled = false;
        feedbackSubmitBtn.textContent = "Send feedback";
      }
      feedbackMessageEl.value = "";
      state.feedbackScreenshotFile = null;
      if (feedbackScreenshotEl) feedbackScreenshotEl.value = "";
      syncFeedbackScreenshotControls();
      feedbackSheetEl.classList.remove("open");
      syncMobilePanelAccessibility();
      showBanner("Feedback sent. Thank you.");
    }

    function keepFeedbackFieldVisible(event) {
      if (!feedbackSheetEl?.classList.contains("open")) return;
      const field = event.target.closest(".field") || event.target;
      window.setTimeout(() => {
        field.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 180);
    }

    function resetMobilePanelScroll(panel) {
      if (!panel) return;
      const scrollTargets = [
        panel,
        panel.querySelector?.(".sheet-body"),
        panel.querySelector?.(".detail-body")
      ].filter(Boolean);
      const reset = () => scrollTargets.forEach(target => {
        if (typeof target.scrollTo === "function") target.scrollTo({ top: 0, left: 0, behavior: "auto" });
        else target.scrollTop = 0;
      });
      reset();
      window.requestAnimationFrame(reset);
    }

    function positionMobileMapActionButtons() {
      const mapRect = document.getElementById("map")?.getBoundingClientRect?.();
      if (!mapRect?.height) return;
      const nativeApp = isNativeAndroidApp();
      const compactRow = nativeApp && window.innerHeight <= 560;
      const controlHeight = 44;
      const edgeGap = 6;
      const requiredHeight = compactRow
        ? controlHeight + edgeGap * 2
        : controlHeight * 2 + 8 + edgeGap * 2;
      const desiredTop = mapRect.top + (nativeApp ? 28 : 10);
      const maximumTop = mapRect.bottom - controlHeight - edgeGap;
      const safeTop = Math.max(mapRect.top + edgeGap, Math.min(desiredTop, maximumTop));
      appEl?.classList.toggle("mobile-map-actions-hidden", mapRect.height < requiredHeight);
      document.documentElement.style.setProperty("--mobile-map-actions-top", `${Math.round(safeTop)}px`);
      document.documentElement.style.setProperty("--mobile-map-prompt-bottom", `${Math.round(Math.max(10, window.innerHeight - mapRect.bottom + 10))}px`);
    }

    function syncMobilePanelAccessibility() {
      let sheetOpen = false;
      document.querySelectorAll(".sheet").forEach(sheet => {
        const open = sheet.classList.contains("open");
        sheetOpen ||= open;
        sheet.toggleAttribute("inert", !open);
        sheet.setAttribute("aria-hidden", open ? "false" : "true");
      });
      const detailOpen = detailEl?.classList.contains("open");
      detailEl?.toggleAttribute("inert", !detailOpen);
      detailEl?.setAttribute("aria-hidden", detailOpen ? "false" : "true");
      document.body.classList.toggle("mobile-content-open", Boolean(detailOpen || sheetOpen));
      document.body.classList.toggle("mobile-detail-open", Boolean(detailOpen));
      document.body.classList.toggle("mobile-sheet-open", Boolean(sheetOpen));
      window.requestAnimationFrame(() => {
        positionMobileMapActionButtons();
        state.map?.resize?.();
      });
    }

    function updateStoryText() {
      const site = state.selectedSite || state.filtered[0] || state.sites[0];
      const blocks = storyCaptionBlocksFor(site);
      const durationMs = storyCaptionDurationMs(blocks);
      storyTextEl.innerHTML = site ? storyCaptionHtmlFor(site) : storyCaptionHtmlFor(null);
      storyOverlayEl.classList.remove("recording");
      storySavePanelEl.classList.remove("open");
      storyOverlayEl.style.setProperty("--story-scroll-duration", `${Math.round(durationMs / 1000)}s`);
      storyOverlayEl.style.setProperty("--story-block-duration", "4.8s");
    }

    async function startStoryCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          if (storyCameraStatusEl) {
            storyCameraStatusEl.hidden = false;
            storyCameraStatusEl.textContent = "Recording is not available in this WebView. You can still read and scroll the story text.";
          }
          showBanner("Camera needs the updated Android app. Story text still works.");
          return;
        }
        if (state.storyStream) return state.storyStream;
        storyRecordBtn.disabled = true;
        storyRecordBtn.textContent = "Allow camera";
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        state.storyStream = stream;
        storyVideoEl.srcObject = stream;
        storyRecordBtn.disabled = false;
        storyRecordBtn.textContent = "Record";
        if (storyCameraStatusEl) {
          storyCameraStatusEl.hidden = true;
          storyCameraStatusEl.textContent = "";
        }
        return stream;
      } catch (error) {
        const blocked = error?.name === "NotAllowedError" || error?.name === "SecurityError";
        storyRecordBtn.disabled = false;
        storyRecordBtn.textContent = blocked ? "Allow camera" : "Record";
        if (storyCameraStatusEl) {
          storyCameraStatusEl.hidden = false;
          storyCameraStatusEl.textContent = blocked
            ? "Camera access was blocked. Tap Allow camera and approve the Android permission message to record, or continue reading the story text without recording."
            : "Recording is not available in this WebView. You can still read and scroll the story text.";
        }
        showBanner(blocked ? "Camera permission was blocked. Allow camera access for On This Site and try again." : "Camera needs the updated Android app. Story text still works.");
        return null;
      }
    }

    function stopStoryCamera() {
      state.storyStream?.getTracks?.().forEach(track => track.stop());
      state.storyStream = null;
      storyVideoEl.srcObject = null;
    }

    function resetStoryMode() {
      storyOverlayEl.classList.remove("recording");
      storyRecordBtn.textContent = "Record";
      storyRecordBtn.disabled = false;
      storyProgressBarEl.style.animation = "none";
      void storyProgressBarEl.offsetWidth;
      storyProgressBarEl.style.animation = "";
      if (state.storyCanvasLoop) cancelAnimationFrame(state.storyCanvasLoop);
      state.storyCanvasLoop = null;
      state.storyRecordingStartedAt = 0;
      if (state.storyRecorder?.state === "recording") state.storyRecorder.stop();
      state.storyRecorder = null;
    }

    function closeStoryMode() {
      state.storyDiscardRecording = true;
      resetStoryMode();
      stopStoryCamera();
      storySavePanelEl.classList.remove("open");
      storySheetEl.classList.remove("open");
      syncMobilePanelAccessibility();
    }

    function showStorySavePanel(blob, url, filename) {
      state.storyLastBlob = blob;
      if (state.storyLastUrl && state.storyLastUrl !== url) URL.revokeObjectURL(state.storyLastUrl);
      state.storyLastUrl = url;
      storyDownloadLinkEl.href = url;
      storyDownloadLinkEl.download = filename;
      storyDownloadLinkEl.textContent = window.AndroidStory ? "Open video" : "Download video";
      storyShareBtn.textContent = window.AndroidStory ? "Share" : "Share";
      storySavePanelEl.classList.add("open");
    }

    function blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
        reader.onerror = () => reject(reader.error || new Error("Could not read video."));
        reader.readAsDataURL(blob);
      });
    }

    window.onAndroidStorySaved = (ok, message, uri) => {
      if (ok) {
        storySavePanelEl.querySelector("p").textContent = "Saved to Movies/On This Site on this Android device. Use Open video to view it or Share to send it to another app.";
        storyDownloadLinkEl.removeAttribute("aria-disabled");
        storyShareBtn.disabled = false;
        showBanner(message || "Story video saved to your device.");
      } else {
        storySavePanelEl.querySelector("p").textContent = message || "Android could not save this video. Try Download video instead.";
        storyDownloadLinkEl.removeAttribute("aria-disabled");
        storyShareBtn.disabled = false;
        showBanner(message || "Could not save story video.");
      }
    };

    function wrapCanvasText(context, text, maxWidth) {
      const words = text.split(/\s+/);
      const lines = [];
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (context.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      return lines;
    }

    function roundRectPath(context, x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      context.beginPath();
      context.moveTo(x + r, y);
      context.arcTo(x + width, y, x + width, y + height, r);
      context.arcTo(x + width, y + height, x, y + height, r);
      context.arcTo(x, y + height, x, y, r);
      context.arcTo(x, y, x + width, y, r);
      context.closePath();
    }

    function drawRoundedTextPanel(context, x, y, width, height, radius, fillStyle) {
      context.save();
      context.fillStyle = fillStyle;
      roundRectPath(context, x, y, width, height, radius);
      context.fill();
      context.restore();
    }

    function drawStoryFrame(canvas, context, blocks, startedAt) {
      const width = canvas.width;
      const height = canvas.height;
      context.clearRect(0, 0, width, height);
      if (storyVideoEl.videoWidth && storyVideoEl.videoHeight) {
        const scale = Math.max(width / storyVideoEl.videoWidth, height / storyVideoEl.videoHeight);
        const drawWidth = storyVideoEl.videoWidth * scale;
        const drawHeight = storyVideoEl.videoHeight * scale;
        context.drawImage(storyVideoEl, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      } else {
        context.fillStyle = "#142117";
        context.fillRect(0, 0, width, height);
      }
      const gradient = context.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "rgba(0,0,0,.44)");
      gradient.addColorStop(0.5, "rgba(0,0,0,.14)");
      gradient.addColorStop(1, "rgba(0,0,0,.44)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      const duration = storyCaptionDurationMs(blocks);
      const elapsed = performance.now() - startedAt;
      const blockMs = duration / Math.max(1, blocks.length);
      const active = blocks[Math.min(blocks.length - 1, Math.floor(elapsed / blockMs))] || blocks[0] || { text: "" };
      const progress = (elapsed % blockMs) / blockMs;
      const fade = Math.min(1, progress / 0.14, (1 - progress) / 0.12);
      context.save();
      context.globalAlpha = Math.max(0, Math.min(1, fade));
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.shadowColor = "rgba(0,0,0,.72)";
      context.shadowBlur = 10;
      context.shadowOffsetY = 3;
      const fontSize = Math.max(34, Math.round(width * 0.062));
      const lineHeight = Math.round(fontSize * 1.16);
      const maxTextWidth = width - 96;
      context.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
      const lines = wrapCanvasText(context, active.text || "", maxTextWidth);
      if (!lines.length) {
        context.restore();
        return;
      }
      const kickerSize = Math.max(18, Math.round(fontSize * 0.42));
      const footerSize = Math.max(18, Math.round(fontSize * 0.44));
      const hasKicker = !!active.kicker;
      const hasFooter = !!active.footer;
      const textHeight = lines.length * lineHeight;
      const panelHeight = textHeight + Math.round(fontSize * 0.78);
      const panelWidth = Math.min(width - 72, Math.max(...lines.map(line => context.measureText(line).width), width * 0.42) + 56);
      const panelX = (width - panelWidth) / 2;
      const panelY = height * 0.68 - panelHeight / 2;
      if (hasKicker) {
        context.font = `800 ${kickerSize}px Inter, system-ui, sans-serif`;
        const kickerWidth = Math.min(width - 120, context.measureText(active.kicker).width + 46);
        drawRoundedTextPanel(context, (width - kickerWidth) / 2, panelY - kickerSize - 24, kickerWidth, kickerSize + 18, kickerSize, "rgba(255,255,255,.18)");
        context.fillStyle = "white";
        context.fillText(active.kicker.toUpperCase(), width / 2, panelY - kickerSize / 2 - 15);
      }
      drawRoundedTextPanel(context, panelX, panelY, panelWidth, panelHeight, 18, "rgba(5,9,7,.66)");
      context.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
      context.fillStyle = "white";
      let y = panelY + panelHeight / 2 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach(line => {
        context.fillText(line, width / 2, y);
        y += lineHeight;
      });
      if (hasFooter) {
        context.font = `700 ${footerSize}px Inter, system-ui, sans-serif`;
        const footerWidth = Math.min(width - 120, context.measureText(active.footer).width + 44);
        drawRoundedTextPanel(context, (width - footerWidth) / 2, panelY + panelHeight + 14, footerWidth, footerSize + 18, footerSize, "rgba(255,255,255,.18)");
        context.fillStyle = "rgba(255,255,255,.94)";
        context.fillText(active.footer, width / 2, panelY + panelHeight + footerSize / 2 + 23);
      }
      context.restore();
    }

    async function startStoryRecording() {
      const stream = await startStoryCamera();
      if (!stream || typeof MediaRecorder === "undefined") {
        showBanner("Recording is not available yet. Story text is still available to read and scroll.");
        return;
      }
      storyOverlayEl.classList.add("recording");
      storySavePanelEl.classList.remove("open");
      storyProgressBarEl.style.animation = "none";
      void storyProgressBarEl.offsetWidth;
      storyProgressBarEl.style.animation = "";
      const canvas = state.storyCanvas || document.createElement("canvas");
      state.storyCanvas = canvas;
      const bounds = storyOverlayEl.getBoundingClientRect();
      canvas.width = Math.max(720, Math.round(bounds.width * Math.min(2, window.devicePixelRatio || 1)));
      canvas.height = Math.max(1280, Math.round(bounds.height * Math.min(2, window.devicePixelRatio || 1)));
      const context = canvas.getContext("2d");
      const blocks = storyCaptionBlocksFor(state.selectedSite || state.filtered[0] || state.sites[0]);
      const durationMs = storyCaptionDurationMs(blocks);
      storyOverlayEl.style.setProperty("--story-scroll-duration", `${Math.round(durationMs / 1000)}s`);
      state.storyRecordingStartedAt = performance.now();
      const loop = () => {
        drawStoryFrame(canvas, context, blocks, state.storyRecordingStartedAt);
        state.storyCanvasLoop = requestAnimationFrame(loop);
      };
      loop();
      state.storyRecordedChunks = [];
      state.storyDiscardRecording = false;
      const recordingStream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
      state.storyRecorder = new MediaRecorder(recordingStream, { mimeType });
      state.storyRecorder.addEventListener("dataavailable", event => {
        if (event.data?.size) state.storyRecordedChunks.push(event.data);
      });
      state.storyRecorder.addEventListener("stop", () => {
        if (state.storyCanvasLoop) cancelAnimationFrame(state.storyCanvasLoop);
        state.storyCanvasLoop = null;
        if (state.storyDiscardRecording) {
          state.storyRecordedChunks = [];
          state.storyDiscardRecording = false;
          showBanner("Story recording cancelled.");
          return;
        }
        const blob = new Blob(state.storyRecordedChunks, { type: mimeType });
        if (!blob.size) return;
        const url = URL.createObjectURL(blob);
        const slug = SHARED_UTILS.sanitizeDomKey(state.selectedSite?.slug || "on-this-site-story", { collapse: true });
        const filename = `${slug}-ar-story.webm`;
        showStorySavePanel(blob, url, filename);
        if (window.AndroidStory?.saveVideo) {
          storySavePanelEl.querySelector("p").textContent = "Saving to Movies/On This Site on this Android device...";
          storyDownloadLinkEl.setAttribute("aria-disabled", "true");
          storyShareBtn.disabled = true;
          blobToBase64(blob)
            .then(base64 => window.AndroidStory.saveVideo(base64, filename, mimeType))
            .catch(() => {
              storySavePanelEl.querySelector("p").textContent = "Android could not receive the video. Use Download video instead.";
              storyDownloadLinkEl.removeAttribute("aria-disabled");
              storyShareBtn.disabled = false;
            });
        } else {
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
          showBanner("Story video saved locally.");
        }
      });
      state.storyRecorder.start(500);
      storyRecordBtn.textContent = "Stop";
    }

    function stopStoryRecording() {
      state.storyDiscardRecording = false;
      storyOverlayEl.classList.remove("recording");
      storyRecordBtn.textContent = "Record";
      if (state.storyRecorder?.state === "recording") state.storyRecorder.stop();
      else if (state.storyCanvasLoop) cancelAnimationFrame(state.storyCanvasLoop);
      state.storyCanvasLoop = null;
      state.storyRecorder = null;
    }

    async function initMap() {
      setLoadingMessage("Drawing the mobile map.");
      if (isOfflineTextMode()) {
        renderOfflineMapIndex();
        statusEl.textContent = `${state.filtered.length || state.sites.length} saved places`;
        return false;
      }
      const ready = await waitForMapbox();
      if (!ready) {
        const mapEl = document.getElementById("map");
        if (mapEl) {
          mapEl.innerHTML = `<div class="map-fallback">Map is still loading. Nearby sites and articles are available below.</div>`;
        }
        statusEl.textContent = `${state.filtered.length || state.sites.length} sites`;
        return false;
      }
      const baseLayer = (state.layers || []).find(layer => layer.slug === "native-long-island-base-map");
      const styleJson = baseLayer?.style_json || {};
      mapboxgl.accessToken = styleJson.publicToken || MAPBOX_PUBLIC_TOKEN;
      const savedBasemap = Object.prototype.hasOwnProperty.call(MOBILE_BASEMAPS, state.settings.basemap) ? state.settings.basemap : "outdoors";
      state.settings.basemap = savedBasemap;
      if (mobileBasemapSelect) mobileBasemapSelect.value = savedBasemap;
      state.map = new mapboxgl.Map({
        container: "map",
        style: mobileBasemapStyle(savedBasemap),
        center: MOBILE_STARTUP_VIEW.center,
        zoom: MOBILE_STARTUP_VIEW.zoom,
        minZoom: 7,
        maxBounds: LONG_ISLAND_VIEW_BOUNDS,
        attributionControl: false
      });
      state.map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      state.map.on("click", event => {
        handleSuggestionMapPickClick(event);
      });
      bindMobileMapTouchFallback();
        return new Promise(resolve => {
          let settled = false;
          let errorTimer = null;
          let postLoadRecoveryTimer = null;
          const fallbackToOfflineIndex = (allowAfterLoad = false) => {
            if (settled && !allowAfterLoad) return;
            settled = true;
            if (errorTimer) window.clearTimeout(errorTimer);
            if (postLoadRecoveryTimer) window.clearTimeout(postLoadRecoveryTimer);
          try { state.map?.remove(); } catch {}
          state.map = null;
          renderOfflineMapIndex();
          statusEl.textContent = `${state.filtered.length || state.sites.length} saved places`;
          showBanner("The map could not load, so saved places are still available below.");
          resolve(false);
        };
        state.map.on("load", () => {
          if (settled) return;
          addPolygonLayers();
          syncMarkers();
          syncUserLocationMarker({ centerMap: false });
          bindAndroidMapGestureGuards();
          bindAndroidMapResizeObserver();
          stabilizeAndroidMapPaint();
          state.map.once?.("idle", () => refreshAndroidMapAfterSettle("android-map-idle"));
          state.map.on("zoomend", () => {
            syncMarkers({ auxiliary: false });
            syncMapStoryMarkers();
          });
          state.map.on("moveend", loadMobileSiteIconImages);
          window.setTimeout(() => {
            if (settled) return;
            settled = true;
            resolve(true);
          }, 160);
          });
          state.map.on("error", () => {
            if (!settled) {
              if (!errorTimer) errorTimer = window.setTimeout(fallbackToOfflineIndex, 800);
              return;
            }
            // Mapbox can emit a tile error after `load` in Android WebView. Do
            // not leave a live shell surrounding a blank map when it never
            // recovers; replace only an still-unpainted canvas after a grace period.
            if (postLoadRecoveryTimer) return;
            postLoadRecoveryTimer = window.setTimeout(() => {
              postLoadRecoveryTimer = null;
              if (!state.map) return;
              const tilesReady = !state.map.areTilesLoaded || state.map.areTilesLoaded();
              if (!tilesReady) fallbackToOfflineIndex(true);
            }, 1600);
          });
      });
    }

    function offlineRegionSites(region) {
      if (region === "all") return [...state.sites];
      return state.sites.filter(site => {
        const longitude = Number(site?.center?.[0]);
        if (!Number.isFinite(longitude)) return false;
        if (region === "west") return longitude < -73.45;
        if (region === "central") return longitude >= -73.45 && longitude < -72.95;
        if (region === "east") return longitude >= -72.95;
        return true;
      });
    }

    function selectOfflineRegion(region = "all") {
      searchEl.value = "";
      state.addressSearchMode = false;
      state.filtered = offlineRegionSites(region).sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
      state.nearbyRenderLimit = defaultNearbyRenderLimit();
      renderList();
      setMobilePanelMode("nearby");
      setNearbyPanelState("default");
      document.querySelectorAll("[data-offline-region]").forEach(button => {
        const active = button.dataset.offlineRegion === region;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }

    function renderOfflineMapIndex() {
      document.body.classList.add("offline-text-mode");
      document.documentElement.classList.add("offline-text-mode");
      const mapEl = document.getElementById("map");
      if (!mapEl) return;
      mapEl.innerHTML = `
        <div class="offline-map-index" role="region" aria-label="Offline place index">
          <strong>Offline place index</strong>
          <p>Choose an area, then open any saved listing below. This backup uses text only and does not load map tiles or media.</p>
          <div class="offline-map-regions" aria-label="Saved areas">
            <button type="button" data-offline-region="all" class="active" aria-pressed="true">All areas</button>
            <button type="button" data-offline-region="west" aria-pressed="false">Western Long Island</button>
            <button type="button" data-offline-region="central" aria-pressed="false">Central Long Island</button>
            <button type="button" data-offline-region="east" aria-pressed="false">East End and islands</button>
          </div>
        </div>
      `;
      mapEl.querySelectorAll("[data-offline-region]").forEach(button => {
        button.addEventListener("click", () => selectOfflineRegion(button.dataset.offlineRegion || "all"));
      });
      [loginOpenBtn, feedbackOpenBtn, locateBtn, mobileMapLocateBtn, suggestSiteOpenBtn].forEach(button => {
        if (!button) return;
        button.disabled = true;
        button.title = "Available when the app is online";
        button.setAttribute("aria-disabled", "true");
        button.dataset.requiresOnline = "true";
      });
      updateMobileHeaderInstruction();
    }

    function restoreMobileMapLayers() {
      state.mapSourceAppliedKey = "";
      state.mobileSiteIconImagesLoaded.clear();
      state.mobileSiteIconImagePlaceholders.clear();
      state.mobileSiteIconImagesLoading = false;
      state.mobileSiteIconImageQueue = [];
      state.mobileSiteIconImagesQueued.clear();
      if (state.mobileSiteIconQueueTimer) window.clearTimeout(state.mobileSiteIconQueueTimer);
      state.mobileSiteIconQueueTimer = null;
      addPolygonLayers();
      syncMarkers();
      syncUserLocationMarker({ centerMap: false });
      syncExhibitMarkers();
      syncApprovedSuggestionMarkers();
      ensureMobileMovingFeatureMarkers();
    }

    function syncMobileLayerButtons() {
      if (mobileLayerExhibitsInput) mobileLayerExhibitsInput.checked = state.settings.exhibits !== false;
      if (mobileLayerPinsInput) {
        mobileLayerPinsInput.checked = state.settings.showPins !== false;
        mobileLayerPinsInput.disabled = false;
      }
      if (mobileLayerShapesInput) mobileLayerShapesInput.checked = state.settings.showShapes !== false;
      if (mobileLayerBiographyPathsInput) mobileLayerBiographyPathsInput.checked = mobileBiographyPathsEnabled();
      const configured = state.settings.layerCategories || {};
      mobileLayerCategoryInputs.forEach(input => {
        input.checked = configured[input.value] !== false;
        input.disabled = false;
      });
      const configuredEras = state.settings.eraCategories || {};
      mobileLayerEraInputs.forEach(input => {
        input.checked = configuredEras[input.value] !== false;
        input.disabled = false;
      });
      if (mobileLayerMenu) {
        const primaryStates = [
          state.settings.exhibits !== false,
          state.settings.showPins !== false,
          state.settings.showShapes !== false,
          mobileBiographyPathsEnabled()
        ];
        const primaryCount = primaryStates.filter(Boolean).length;
        const categoryCount = mobileLayerCategoryInputs.filter(input => input.checked).length;
        const eraCount = mobileLayerEraInputs.filter(input => input.checked).length;
        const totalLayerCount = primaryStates.length + mobileLayerCategoryInputs.length + mobileLayerEraInputs.length;
        const activeLayerCount = primaryCount + categoryCount + eraCount;
        const allOn = activeLayerCount === totalLayerCount;
        const allBulkLabelsOn = primaryStates.slice(0, 3).every(Boolean)
          && categoryCount === mobileLayerCategoryInputs.length
          && eraCount === mobileLayerEraInputs.length;
        const bulkActionsReady = !mobileLayerMenu.open || Date.now() >= mobileLayerBulkReadyAt;
        mobileLayerMenu.querySelector("summary").textContent = allOn ? "Labels" : `Labels ${activeLayerCount}/${totalLayerCount}`;
        if (mobileLayerEnableAllBtn) mobileLayerEnableAllBtn.disabled = allBulkLabelsOn || !bulkActionsReady;
        if (mobileLayerDisableAllBtn) mobileLayerDisableAllBtn.disabled = activeLayerCount === 0 || !bulkActionsReady;
      }
      if (exhibitsToggleBtn) {
        exhibitsToggleBtn.textContent = state.settings.exhibits === false ? "Exhibits off" : "Exhibits";
        exhibitsToggleBtn.setAttribute("aria-pressed", String(state.settings.exhibits !== false));
      }
      if (mobilePinsToggleBtn) {
        mobilePinsToggleBtn.textContent = state.settings.showPins === false ? "Sites off" : "Sites";
        mobilePinsToggleBtn.setAttribute("aria-pressed", String(state.settings.showPins !== false));
        mobilePinsToggleBtn.disabled = false;
      }
      if (mobileShapesToggleBtn) {
        mobileShapesToggleBtn.textContent = state.settings.showShapes === false ? "Boundaries off" : "Boundaries";
        mobileShapesToggleBtn.setAttribute("aria-pressed", String(state.settings.showShapes !== false));
      }
    }

    function setMobileLayerVisibility(kind, visible) {
      if (kind === "exhibits") state.settings.exhibits = visible;
      if (kind === "pins") state.settings.showPins = visible;
      if (kind === "shapes") state.settings.showShapes = visible;
      if (kind === "biographyPaths") state.settings.showBiographyPaths = visible;
      if (kind === "category") {
        state.settings.layerCategories = { ...(state.settings.layerCategories || {}) };
        mobileLayerCategoryInputs.forEach(input => {
          state.settings.layerCategories[input.value] = input.checked;
        });
      }
      if (kind === "era") {
        state.settings.eraCategories = { ...(state.settings.eraCategories || {}) };
        mobileLayerEraInputs.forEach(input => {
          state.settings.eraCategories[input.value] = input.checked;
        });
      }
      saveSettings();
      invalidateMapSourceCache();
      syncMobileLayerButtons();
      syncMobileBiographyPathLayers();
      syncMarkers();
      ensureMobileMovingBiographyMarkers();
      if (kind === "era") renderMobileTimeline();
    }

    function setAllMobileLayerVisibility(visible) {
      const nextVisible = visible === true;
      state.settings.exhibits = nextVisible;
      state.settings.showPins = nextVisible;
      state.settings.showShapes = nextVisible;
      // Biography paths are a separate guided-story overlay, not a label.
      // Keep them off during either bulk label action so "Enable all" cannot
      // cover the map with every biography route.
      state.settings.showBiographyPaths = false;
      state.settings.layerCategories = {};
      mobileLayerCategoryInputs.forEach(input => {
        state.settings.layerCategories[input.value] = nextVisible;
      });
      state.settings.eraCategories = {};
      mobileLayerEraInputs.forEach(input => {
        state.settings.eraCategories[input.value] = nextVisible;
      });
      saveSettings();
      invalidateMapSourceCache();
      syncMobileLayerButtons();
      syncMobileBiographyPathLayers();
      syncMarkers();
      ensureMobileMovingBiographyMarkers();
      renderMobileTimeline();
    }

    function setMobileBasemap(value) {
      const next = Object.prototype.hasOwnProperty.call(MOBILE_BASEMAPS, value) ? value : "outdoors";
      state.settings.basemap = next;
      state.settings.basemapUserSet = true;
      saveSettings();
      if (mobileBasemapSelect) mobileBasemapSelect.value = next;
      if (!state.map) return;
      const style = mobileBasemapStyle(next);
      state.mapSourceAppliedKey = "";
      state.mobileSiteIconImagesLoaded.clear();
      state.mobileSiteIconImagesLoading = false;
      state.map.once("style.load", restoreMobileMapLayers);
      state.map.setStyle(style, { diff: false });
    }

    function cssPixelValue(name, fallback = 0) {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
      const matches = String(raw || "").match(/-?\d+(?:\.\d+)?px/g);
      if (!matches?.length) return fallback;
      return Math.max(...matches.map(value => Number.parseFloat(value)).filter(Number.isFinite), fallback);
    }

    function fitFixedMobilePanel(menu, panel, options = {}) {
      if (!menu?.open || !panel) return;
      const summary = menu.querySelector("summary");
      const summaryRect = summary?.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportWidth = Math.round(viewport?.width || window.innerWidth || document.documentElement.clientWidth || 360);
      const viewportHeight = Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight || 720);
      const viewportLeft = Math.round(viewport?.offsetLeft || 0);
      const viewportTop = Math.round(viewport?.offsetTop || 0);
      const pad = options.pad ?? 8;
      const bottomSafe = cssPixelValue("--app-bottom-safe", 0);
      const leftSafe = Math.max(pad, cssPixelValue("--app-left-safe", 0));
      const rightSafe = Math.max(pad, cssPixelValue("--app-right-safe", 0));
      const topBoundary = viewportTop + pad;
      const bottomBoundary = viewportTop + viewportHeight - bottomSafe - pad;
      const preferredMinHeight = Math.max(0, options.minHeight || 160);
      const preferredTop = Math.round(viewportTop + (summaryRect?.bottom || 74) + 6);
      let top = Math.max(topBoundary, Math.min(bottomBoundary, preferredTop));
      if (bottomBoundary - top < preferredMinHeight) {
        top = Math.max(topBoundary, bottomBoundary - preferredMinHeight);
      }
      const left = viewportLeft + leftSafe;
      const width = Math.max(0, viewportWidth - leftSafe - rightSafe);
      const maxHeight = Math.max(0, bottomBoundary - top);
      panel.style.setProperty(options.topVar, `${top}px`);
      panel.style.setProperty(options.leftVar, `${left}px`);
      panel.style.setProperty(options.widthVar, `${width}px`);
      panel.style.setProperty("position", "fixed", "important");
      panel.style.setProperty("left", `${left}px`, "important");
      panel.style.setProperty("right", "auto", "important");
      panel.style.setProperty("width", `${width}px`, "important");
      panel.style.setProperty("max-width", `${width}px`, "important");
      panel.style.setProperty("max-height", `${maxHeight}px`, "important");
      if (options.disableTransform) panel.style.setProperty("transform", "none", "important");
      if (options.zIndex) panel.style.setProperty("z-index", String(options.zIndex), "important");
    }

    function fitMobileMoreMenu(menu) {
      if (!menu?.open) return;
      const grid = menu.querySelector(".mobile-more-grid");
      fitFixedMobilePanel(menu, grid, {
        topVar: "--mobile-more-top",
        leftVar: "--mobile-more-left",
        widthVar: "--mobile-more-width",
        disableTransform: true,
        zIndex: 1000
      });
    }

    function fitMobileLayerMenu(menu) {
      if (!menu?.open) return;
      const panel = menu.querySelector(".mobile-layer-panel");
      fitFixedMobilePanel(menu, panel, {
        topVar: "--mobile-layer-top",
        leftVar: "--mobile-layer-left",
        widthVar: "--mobile-layer-width"
      });
    }

    function toggleLearningCardExpansion(button) {
      const key = button?.dataset?.learningSeeMore;
      if (!key) return false;
      const expanded = !state.expandedLearningCardKeys.has(key);
      if (expanded) state.expandedLearningCardKeys.add(key);
      else state.expandedLearningCardKeys.delete(key);
      const card = button.closest("[data-learning-card-key]");
      card?.querySelector("[data-learning-card-excerpt]")?.classList.toggle("is-expanded", expanded);
      button.textContent = expanded ? "See less" : "See more";
      button.setAttribute("aria-expanded", String(expanded));
      return true;
    }

    async function openMobileLearningDiscussion(sourceType, slug) {
      if (!["site", "wiki"].includes(sourceType) || !slug) return;
      await loadDeferredData({ includeCommunity: true });
      if (sourceType === "wiki") await openWikiArticle(slug);
      else await openSite(slug);
      window.setTimeout(() => {
        const discussion = detailBodyEl?.querySelector(".discussion-section, [data-discussion]");
        discussion?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      }, 80);
    }

    function activateMobileListTarget(target, event) {
      const placeSuggestion = target?.closest?.("[data-place-suggestion]");
      if (placeSuggestion) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        openPlaceAutocompleteSuggestion(placeSuggestion.dataset.placeSuggestion);
        return true;
      }
      const searchSuggestion = target?.closest?.("[data-search-suggestion]");
      if (searchSuggestion) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        searchEl.value = searchSuggestion.dataset.searchSuggestion || "";
        searchSuggestionsEl?.replaceChildren();
        if (searchSuggestionsEl) searchSuggestionsEl.hidden = true;
        searchEl.setAttribute("aria-expanded", "false");
        scheduleSearchSync();
        searchEl.focus();
        return true;
      }
      const more = target?.closest?.("[data-nearby-show-more]");
      if (more) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        loadMoreNearbyCards();
        return true;
      }
      const seeMore = target?.closest?.("[data-learning-see-more]");
      if (seeMore) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        toggleLearningCardExpansion(seeMore);
        return true;
      }
      const discuss = target?.closest?.("[data-learning-discuss]");
      if (discuss) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        openMobileLearningDiscussion(discuss.dataset.learningDiscuss, discuss.dataset.learningSlug);
        return true;
      }
      const mapAction = target?.closest?.("[data-nearby-map]");
      if (mapAction) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        const site = state.siteBySlug.get(mapAction.dataset.nearbyMap) || state.sites.find(item => item.slug === mapAction.dataset.nearbyMap);
        if (site) {
          if (state.mobilePanelState === "maximized") setMobileBottomPanelState("normal");
          state.selectedSlug = site.slug;
          state.selectedSite = site;
          renderList({ preserveScroll: true });
          focusSite(site, { duration: 900, preview: true });
          animateMobileSiteMarker(site);
        }
        return true;
      }
      const openWiki = target?.closest?.("[data-nearby-open-wiki]");
      if (openWiki) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        clearMobileSearchForResultOpen();
        searchEl?.blur?.();
        openWikiArticle(openWiki.dataset.nearbyOpenWiki);
        return true;
      }
      const openSiteAction = target?.closest?.("[data-nearby-open]");
      if (openSiteAction) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        clearMobileSearchForResultOpen();
        searchEl?.blur?.();
        openNearbySiteWithMapPreview(openSiteAction.dataset.nearbyOpen);
        return true;
      }
      const resultCard = target?.closest?.(".site-card[data-slug], .site-card[data-wiki-slug]");
      if (resultCard) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        const cardTarget = mobileListCardTarget(resultCard);
        clearMobileSearchForResultOpen();
        searchEl?.blur?.();
        if (cardTarget.wikiSlug) {
          setNearbyPanelState("hidden");
          openWikiArticle(cardTarget.wikiSlug);
          window.setTimeout(() => setNearbyPanelState("hidden"), 180);
          return true;
        }
        if (cardTarget.slug) {
          openNearbySiteWithMapPreview(cardTarget.slug);
          return true;
        }
      }
      return false;
    }

    listEl.addEventListener("touchend", event => {
      if (!isNativeAndroidApp() || !searchEl?.value?.trim()) return;
      if (!event.target?.closest?.(".site-card")) return;
      if (activateMobileListTarget(event.target, event)) {
        state.pendingAndroidSearchResultTap = null;
        state.listTouchActivationUntil = performance.now() + 650;
        event.stopImmediatePropagation?.();
      }
    }, { passive: false, capture: true });

    listEl.addEventListener("touchstart", event => {
      if (!isNativeAndroidApp() || !searchEl?.value?.trim()) return;
      const card = event.target?.closest?.(".site-card[data-slug], .site-card[data-wiki-slug]");
      if (card) cacheAndroidSearchResultCard(card);
    }, { passive: true, capture: true });

    listEl.addEventListener("click", event => {
      if (performance.now() < (state.listTouchActivationUntil || 0)) {
        event.preventDefault();
        return;
      }
      activateMobileListTarget(event.target, event);
    });
    searchSuggestionsEl?.addEventListener("pointerdown", event => {
      // Keep the keyboard and search focus stable while choosing a suggestion.
      event.preventDefault();
    });
    searchSuggestionsEl?.addEventListener("click", event => {
      activateMobileListTarget(event.target, event);
    });
    profilesListEl.addEventListener("click", event => {
      const toggle = event.target.closest("[data-toggle-mobile-profile]");
      if (toggle?.dataset.toggleMobileProfile) {
        const key = toggle.dataset.toggleMobileProfile;
        state.expandedMobileProfileKey = state.expandedMobileProfileKey === key ? "" : key;
        renderProfiles();
        if (state.expandedMobileProfileKey) {
          profilesListEl.querySelector(`[data-mobile-profile-card="${CSS.escape(key)}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
        return;
      }
      const languageToggle = event.target.closest("[data-show-profile-language]");
      if (languageToggle) {
        const scope = languageToggle.closest("[data-mobile-profile-card], #profile-card") || profilesListEl;
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
      const progressToggle = event.target.closest("[data-show-mobile-profile-progress]");
      if (progressToggle) {
        const scope = progressToggle.closest("[data-mobile-profile-card]") || profilesListEl;
        const progress = scope.querySelector("[data-mobile-profile-progress]");
        if (progress) {
          const show = progress.hasAttribute("hidden");
          progress.hidden = !show;
          progress.setAttribute("aria-hidden", show ? "false" : "true");
          scope.querySelectorAll("[data-show-mobile-profile-progress]").forEach(button => {
            button.setAttribute("aria-expanded", show ? "true" : "false");
          });
          if (show) progress.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
        return;
      }
      const follow = event.target.closest("[data-follow-profile]");
      if (follow?.dataset.followProfile) {
        const profile = state.contributorProfiles.find(item => Number(item.id) === Number(follow.dataset.followProfile));
        if (profile) followProfile(profile).catch(() => showBanner("Could not follow contributor."));
        return;
      }
      const link = event.target.closest("[data-profile-site]");
      if (link?.dataset.profileSite) {
        openSite(link.dataset.profileSite);
        profilesSheetEl.classList.remove("open");
      }
    });
    profilesSortEl?.addEventListener("change", () => {
      state.contributorSortMode = profilesSortEl.value === "points" ? "points" : "alpha";
      state.expandedMobileProfileKey = "";
      renderProfiles();
    });
    followingListEl.addEventListener("click", event => {
      const link = event.target.closest("[data-profile-site]");
      if (link?.dataset.profileSite) {
        openSite(link.dataset.profileSite);
        followingSheetEl.classList.remove("open");
      }
    });
    eventsListEl.addEventListener("click", event => {
      const card = event.target.closest("[data-event-slug]");
      if (!card) return;
      const exhibit = state.exhibits.find(item => String(item.slug || item.id) === String(card.dataset.eventSlug));
      if (exhibit) {
        openExhibit(exhibit);
        eventsSheetEl.classList.remove("open");
      }
    });
    mobileActivityOpenBtn?.addEventListener("click", openMobileActivitySheet);
    mobileActivityListEl?.addEventListener("input", event => {
      const draft = event.target.closest("[data-mobile-activity-draft]");
      if (draft?.dataset.mobileActivityDraft) {
        state.mobileActivityDrafts.set(draft.dataset.mobileActivityDraft, draft.value);
      }
    });
    mobileActivityListEl?.addEventListener("click", async event => {
      const showMore = event.target.closest("[data-mobile-activity-show-more]");
      if (showMore) {
        loadMoreMobileActivityCards();
        return;
      }
      const seeMore = event.target.closest("[data-learning-see-more]");
      if (seeMore) {
        toggleLearningCardExpansion(seeMore);
        return;
      }
      const cardElement = event.target.closest("[data-mobile-activity-key]");
      const key = cardElement?.dataset.mobileActivityKey || "";
      const card = key ? mobileActivityLearningCards().find(item => item.key === key) : null;
      const cancelComment = event.target.closest("[data-mobile-activity-comment-cancel]");
      if (cancelComment && card) {
        state.mobileActivityDiscussionKeys.delete(card.key);
        cardElement.querySelector(".activity-inline-discussion")?.setAttribute("hidden", "");
        cardElement.querySelector("[data-mobile-activity-comment]")?.setAttribute("aria-expanded", "false");
        return;
      }
      const commentButton = event.target.closest("[data-mobile-activity-comment]");
      if (commentButton && card) {
        const open = !state.mobileActivityDiscussionKeys.has(card.key);
        if (open) state.mobileActivityDiscussionKeys.add(card.key);
        else state.mobileActivityDiscussionKeys.delete(card.key);
        const composer = cardElement.querySelector(".activity-inline-discussion");
        if (composer) composer.hidden = !open;
        commentButton.setAttribute("aria-expanded", String(open));
        if (open) composer?.focus?.({ preventScroll: true });
        return;
      }
      if (event.target.closest("[data-mobile-activity-comment-login]")) {
        showBanner(contributorWritePrompt());
        openSheet(loginSheetEl);
        return;
      }
      const helpfulButton = event.target.closest("[data-mobile-activity-helpful]");
      if (helpfulButton && card) {
        if (!card.permissions.canVote) {
          showBanner("Login as an approved contributor to vote.");
          openSheet(loginSheetEl);
          return;
        }
        helpfulButton.disabled = true;
        try {
          if (card.comment?.id) await setCommentReaction(card.comment.id, "up");
          else if (card.story?.id) await voteMapStory(card.story.id, 1, { reopen: false });
        } catch (error) {
          showBanner(error.message || "Could not save the helpful vote.");
        } finally {
          state.mobileActivityRenderedSignature = "";
          renderMobileActivitySheet();
        }
        return;
      }
      const discussion = event.target.closest(".activity-inline-discussion");
      if (event.target.closest("[data-submit-discussion]") && discussion) {
        const draft = discussion.querySelector("[data-discussion-input]");
        if (draft && card) state.mobileActivityDrafts.set(card.key, draft.value);
        submitMobileDiscussion(discussion).catch(error => showBanner(error.message || "Could not submit comment."));
        return;
      }
      if (event.target.closest("[data-mobile-activity-open]") && cardElement) {
        openMobileActivityTarget(cardElement);
      }
    });
    mobileNotificationsOpenBtn?.addEventListener("click", openMobileNotificationsSheet);
    mobileNotificationsListEl?.addEventListener("click", event => {
      const actionButton = event.target.closest("[data-mobile-notification-action]");
      const item = event.target.closest("[data-mobile-notification-type]");
      if (actionButton && item) {
        handleMobileSuggestionReview(item.dataset.mobileNotificationSlug, actionButton.dataset.mobileNotificationAction);
        return;
      }
      if (event.target.closest("[data-open-mobile-notification]") && item) openMobileNotificationTarget(item);
    });
    plantPhotoViewerCloseBtn?.addEventListener("click", closePlantPhotoViewer);
    plantPhotoViewerEl?.addEventListener("click", event => {
      if (event.target === plantPhotoViewerEl) closePlantPhotoViewer();
    });
    detailBodyEl.addEventListener("click", event => {
      const heroDot = event.target.closest("[data-site-hero-dot]");
      if (heroDot) {
        event.preventDefault();
        const carousel = heroDot.closest("[data-site-hero-carousel]");
        setSiteHeroCarouselIndex(carousel, Number(heroDot.dataset.siteHeroDot || 0));
        startSiteHeroCarousel(carousel, { restart: true });
        return;
      }
      const heroCommentSlide = event.target.closest("[data-site-hero-comment]");
      if (heroCommentSlide?.dataset.siteHeroComment) {
        event.preventDefault();
        jumpToQuoteComment(heroCommentSlide.dataset.siteHeroComment);
        return;
      }
      const discussion = event.target.closest(".discussion-section");
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
      const commentPhotoButton = event.target.closest("[data-comment-photo-view]");
      if (commentPhotoButton?.dataset.commentPhotoView) {
        event.preventDefault();
        openPlantPhotoViewer(commentPhotoButton.dataset.commentPhotoView, commentPhotoButton.dataset.commentPhotoTitle || "Comment photo");
        return;
      }
      const plantPhotoButton = event.target.closest("[data-plant-photo-view]");
      if (plantPhotoButton?.dataset.plantPhotoView) {
        event.preventDefault();
        openPlantPhotoViewer(plantPhotoButton.dataset.plantPhotoView, plantPhotoButton.dataset.plantPhotoTitle || "Plant photo");
        return;
      }
      const languageQuizButton = event.target.closest("[data-language-quiz-id]");
      if (languageQuizButton) {
        openLanguageQuiz(languageQuizButton.dataset.languageQuizId, languageQuizButton.dataset.languageContentKey, languageQuizButton.dataset.languageContentTitle);
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
        if (kind === "wiki" && slug) openWikiArticle(slug, { focus: false, skipCommentRefresh: true, skipRoute: true });
        else if (slug) openSite(slug, { focus: false, skipCommentRefresh: true, skipRoute: true });
        return;
      }
      const sourceButton = event.target.closest("[data-timeline-source-info]");
      if (sourceButton) {
        event.preventDefault();
        event.stopPropagation();
        const item = sourceButton.closest(".timeline-item, .section.has-source");
        toggleTimelineSourceReference(sourceButton, item);
        return;
      }
      const linkedRoute = event.target.closest("a[href]");
      if (linkedRoute) {
        const internal = internalHref(linkedRoute.getAttribute("href"));
        if (internal) {
          event.preventDefault();
          openInternalAppLink(internal);
          return;
        }
      }
      const tagButton = event.target.closest("[data-site-tag]");
      if (tagButton?.dataset.siteTag) {
        event.preventDefault();
        openSiteTagList(tagButton.dataset.siteTag);
        return;
      }
      const relatedMore = event.target.closest("[data-related-sites-more]");
      if (relatedMore) {
        const section = relatedMore.closest(".related-sites-section");
        section?.querySelectorAll(".related-site-extra[hidden]").forEach(item => { item.hidden = false; });
        relatedMore.hidden = true;
        return;
      }
      const biographyPathPlace = event.target.closest("[data-mobile-biography-path-index]");
      if (biographyPathPlace) {
        const slug = new URL(window.location.href).searchParams.get("wiki") || "";
        const article = slug ? state.wikiBySlug.get(slug) : null;
        if (focusMobileBiographyPathPlace(state.activeMobileBiographyPath || article, biographyPathPlace.dataset.mobileBiographyPathIndex, { zoom: 12.2, duration: 720 })) {
          biographyPathPlace.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
        return;
      }
      const appPageButton = event.target.closest("[data-app-page]");
      if (appPageButton?.dataset.appPage) {
        openAppPage(appPageButton.dataset.appPage);
        return;
      }
      const adoptPlaceButton = event.target.closest("[data-mobile-adopt-place]");
      if (adoptPlaceButton) {
        event.preventDefault();
        openSupportPanel({
          adoption: {
            siteSlug: adoptPlaceButton.dataset.adoptPlaceSlug || state.selectedSite?.slug || "",
            siteTitle: adoptPlaceButton.dataset.adoptPlaceTitle || state.selectedSite?.title || "this place",
            amount: 25
          }
        });
        return;
      }
      const supportForm = event.target.closest("[data-support-form]");
      if (event.target.closest("[data-support-submit]") && supportForm) {
        submitSupportPayment(supportForm);
        return;
      }
      const wikiButton = event.target.closest("[data-wiki-slug]");
      if (wikiButton?.dataset.wikiSlug) {
        openWikiArticle(wikiButton.dataset.wikiSlug);
        return;
      }
      const nativePlantsButton = event.target.closest("[data-open-native-plants]");
      if (nativePlantsButton) {
        openNativePlantsGuide(nativePlantsButton.dataset.openNativePlants || "");
        return;
      }
      const plantWikiButton = event.target.closest("[data-open-plant-wiki]");
      if (plantWikiButton?.dataset.openPlantWiki) {
        openWikiArticle(plantWikiButton.dataset.openPlantWiki);
        return;
      }
      const plantDetailsButton = event.target.closest("[data-plant-observation-details]");
      if (plantDetailsButton) {
        const details = detailBodyEl.querySelector(`#${CSS.escape(plantDetailsButton.dataset.plantObservationDetails || "")}`);
        if (details) {
          details.open = true;
          details.scrollIntoView({ block: "center" });
        }
        return;
      }
      const mobileProfileButton = event.target.closest("[data-open-mobile-profile]");
      if (mobileProfileButton?.dataset.openMobileProfile) {
        openMobileContributorProfile(mobileProfileButton.dataset.openMobileProfile);
        return;
      }
      if (event.target.closest("#login-open")) {
        openContributorAccountSheet();
        return;
      }
      const blogButton = event.target.closest("[data-blog-index]");
      if (blogButton?.dataset.blogIndex) {
        openBlogPost(blogButton.dataset.blogIndex);
        return;
      }
      const siteButton = event.target.closest("[data-slug]");
      if (siteButton?.dataset.slug) {
        openSite(siteButton.dataset.slug);
        return;
      }
      if (event.target.closest("#suggest-site-open-inline")) {
        if (requireRegisteredContributor()) openSheet(suggestSiteSheetEl);
        return;
      }
      if (event.target.id === "mark-visited") markVisited(state.selectedSite);
      if (event.target.id === "check-in-site") checkInAtSite(state.selectedSite);
      if (event.target.id === "open-story-current") openSheet(storySheetEl);
      if (event.target.closest("[data-open-login]")) {
        openSheet(loginSheetEl);
        return;
      }
      if (event.target.closest("[data-demo-login-inline]")) return;
      if (event.target.closest("[data-submit-discussion]") && discussion) {
        submitMobileDiscussion(discussion).catch(error => showBanner(error.message || "Could not submit comment."));
        return;
      }
      if (event.target.closest("[data-take-comment-photo]") && discussion) {
        event.preventDefault();
        state.pendingCommentPhotoDiscussion = discussion;
        setCommentPhotoStatus(discussion, "Opening camera...");
        if (nativeTakeCommentPhoto()) return;
        const input = discussion.querySelector("[data-discussion-image]");
        if (input) {
          input.setAttribute("capture", "environment");
          input.value = "";
          try {
            input.showPicker ? input.showPicker() : input.click();
          } catch {
            input.click();
          }
        }
        return;
      }
      if (event.target.closest("[data-choose-comment-photo]") && discussion) {
        event.preventDefault();
        state.pendingCommentPhotoDiscussion = discussion;
        setCommentPhotoStatus(discussion, "Opening photo library...");
        if (nativeChooseCommentPhoto()) return;
        state.pendingCommentPhotoDiscussion = null;
        const input = discussion.querySelector("[data-discussion-image]");
        if (input) {
          input.removeAttribute("capture");
          input.value = "";
          try {
            input.showPicker ? input.showPicker() : input.click();
          } catch {
            input.click();
          }
        }
        return;
      }
      const plantPanel = event.target.closest("[data-plant-observation]");
      if (event.target.closest("[data-take-plant-photo]") && plantPanel) {
        event.preventDefault();
        state.pendingPlantObservationPanel = plantPanel;
        const button = plantPanel.querySelector("[data-take-plant-photo]");
        if (button) button.textContent = "Opening camera...";
        openInAppPlantCamera(plantPanel).then(opened => {
          if (button) button.textContent = "Take plant photo";
          if (opened) return;
          if (nativeTakePlantPhoto()) {
            if (button) button.textContent = "Opening camera...";
            return;
          }
          const input = plantPanel.querySelector("[data-plant-image]");
          if (input) {
            input.setAttribute("capture", "environment");
            input.value = "";
            try {
              input.showPicker ? input.showPicker() : input.click();
            } catch {
              input.click();
            }
          }
        }).catch(error => {
          if (button) button.textContent = "Take plant photo";
          showBanner(error.message || "Could not open the camera.");
        });
          return;
      }
      if (event.target.closest("[data-upload-plant-photo]") && plantPanel) {
        event.preventDefault();
        state.pendingPlantObservationPanel = plantPanel;
        const input = plantPanel.querySelector("[data-plant-image]");
        if (input) {
          input.removeAttribute("capture");
          input.value = "";
          try {
            input.showPicker ? input.showPicker() : input.click();
          } catch {
            input.click();
          }
        }
        return;
      }
      if (event.target.closest("[data-retake-plant-photo]") && plantPanel) {
        event.preventDefault();
        plantPanel._plantAnalysis = null;
        plantPanel._plantPhotoFile = null;
        plantPanel._plantOriginalPhotoFile = null;
        if (plantPanel._plantPreviewUrl) URL.revokeObjectURL(plantPanel._plantPreviewUrl);
        plantPanel._plantPreviewUrl = "";
        const input = plantPanel.querySelector("[data-plant-image]");
        if (input) {
          input.setAttribute("capture", "environment");
          input.value = "";
        }
        renderPlantContext(plantPanel);
        input?.click();
        return;
      }
      if (event.target.closest("[data-submit-plant-report]") && plantPanel) {
        submitPlantObservation(plantPanel).catch(error => showBanner(error.message || "Could not submit plant report."));
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
        if (!isApprovedContributor()) {
          showBanner(state.profile?.pending
            ? "Your account is waiting for review before replying."
            : "Login as an approved contributor before replying.");
          return;
        }
        const parentInput = discussion.querySelector("[data-parent-comment]");
        const profileInput = discussion.querySelector("[data-reply-to-profile]");
        if (!parentInput || !profileInput) {
          showBanner("Open the comment form before replying.");
          return;
        }
        parentInput.value = replyButton.dataset.replyComment || "";
        profileInput.value = replyButton.dataset.replyProfile || "";
        const input = discussion.querySelector("[data-discussion-input]");
        const cancel = discussion.querySelector("[data-cancel-reply]");
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
        if (input) input.placeholder = "Write a comment...";
        event.target.closest("[data-cancel-reply]").hidden = true;
        return;
      }
    });
    detailBodyEl.addEventListener("submit", event => {
      const form = event.target.closest("[data-frontend-editor]");
      if (!form) return;
      event.preventDefault();
      saveFrontendEditor(form);
    });
    detailBodyEl.addEventListener("mouseup", () => window.setTimeout(updateQuoteSelectionPopup, 0));
    detailBodyEl.addEventListener("touchend", () => window.setTimeout(updateQuoteSelectionPopup, 120), { passive: true });
    detailBodyEl.addEventListener("keyup", event => {
      if (event.key === "Shift" || event.key.startsWith("Arrow")) window.setTimeout(updateQuoteSelectionPopup, 0);
    });
    detailBodyEl.addEventListener("scroll", () => {
      hideQuoteSelectionPopup();
      syncDetailHeroScrollState();
    }, { passive: true });
    document.addEventListener("selectionchange", () => {
      if (!detailEl?.classList?.contains("open")) return;
      window.clearTimeout(state.quoteSelectionTimer);
      state.quoteSelectionTimer = window.setTimeout(updateQuoteSelectionPopup, 100);
    });
    detailBodyEl.addEventListener("toggle", event => {
      const plantPanel = event.target.closest?.("[data-plant-observation]");
      if (!plantPanel || event.target !== plantPanel) return;
      detailEl.classList.toggle("plant-browse-mode", plantPanel.open);
      if (state.map) window.requestAnimationFrame(() => state.map?.resize?.());
    }, true);
    detailBodyEl.addEventListener("input", event => {
      const plantPanel = event.target.closest("[data-plant-observation]");
      if (plantPanel && event.target.matches("[data-plant-notes]")) renderPlantContext(plantPanel);
    });
    detailBodyEl.addEventListener("change", event => {
      const discussion = event.target.closest(".discussion-section");
      if (discussion && event.target.matches("[data-discussion-image]")) {
        prepareSelectedCommentPhoto(discussion).catch(error => {
          setCommentPhotoStatus(discussion, error.message || "Could not prepare that comment photo.", "error");
          showBanner(error.message || "Could not prepare that comment photo.");
        });
        return;
      }
      const plantPanel = event.target.closest("[data-plant-observation]");
      if (plantPanel && event.target.matches("[data-plant-image]")) processPlantCameraPhoto(plantPanel);
      if (plantPanel && event.target.matches("[data-plant-image]")) event.target.setAttribute("capture", "environment");
    });
    detailBodyEl.addEventListener("keydown", event => {
      const trigger = event.target.closest?.("[data-take-plant-photo]");
      if (!trigger || (event.key !== "Enter" && event.key !== " ")) return;
      if (trigger.tagName === "BUTTON") return;
      const plantPanel = trigger.closest("[data-plant-observation]");
      if (!plantPanel) return;
      event.preventDefault();
      plantPanel.querySelector("[data-plant-image]")?.click();
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
    searchEl.addEventListener("search", handleMobileSearchCommand);
    searchEl.addEventListener("input", handleMobileSearchInput);
    searchEl.addEventListener("beforeinput", handleAndroidSearchBeforeInput);
    searchEl.addEventListener("keyup", handleMobileSearchInput);
    searchEl.addEventListener("change", handleMobileSearchInput);
    searchEl.addEventListener("search", handleMobileSearchInput);
    searchEl.addEventListener("keydown", handleMobileSearchKeydown);
    searchEl.addEventListener("compositionend", handleMobileSearchInput);
    searchEl.addEventListener("focus", handleMobileSearchFocus);
    searchEl.addEventListener("blur", stopSearchValueWatch);
    document.addEventListener("pointerdown", blockAndroidUiOverlayMapTapStart, { passive: true, capture: true });
    document.addEventListener("touchstart", blockAndroidUiOverlayMapTapStart, { passive: true, capture: true });
    const refreshMobileViewportLayout = () => {
      syncSystemSafeArea();
      restoreNearbyPanelHeight();
      positionMobileMapActionButtons();
      window.setTimeout(() => {
        positionMobileMapActionButtons();
        state.map?.resize?.();
      }, 80);
    };
    window.addEventListener("resize", refreshMobileViewportLayout);
    window.addEventListener("orientationchange", () => window.setTimeout(refreshMobileViewportLayout, 280));
    window.visualViewport?.addEventListener("resize", refreshMobileViewportLayout);
    locateBtn.addEventListener("click", locateUser);
    mobileMapLocateBtn?.addEventListener("click", event => {
      event.stopPropagation();
      locateMapUser();
    });
    installApkLocationControlDebugHook();
    const blockPanelControlMapTap = event => {
      blockMobileMapTaps();
      event?.stopPropagation?.();
    };
    [
      collapseListBtn,
      mobilePanelSizeBtn,
      showTimelineBtn,
      mobileTabTimelineBtn,
      mobileTabNearbyBtn,
      mobileMapLocateBtn,
      mobileTimelineScrubberRangeEl
    ].forEach(control => {
      control?.addEventListener("pointerdown", blockPanelControlMapTap, { capture: true });
      control?.addEventListener("touchstart", blockPanelControlMapTap, { capture: true, passive: true });
    });
    closeBtn.addEventListener("pointerdown", event => {
      blockMobileMapTaps();
      event.stopPropagation();
    }, { capture: true });
    closeBtn.addEventListener("touchstart", event => {
      blockMobileMapTaps();
      event.stopPropagation();
    }, { capture: true, passive: true });
    closeBtn.addEventListener("click", event => {
      consumePanelCloseEvent(event);
      closeDetail({ blockMapTap: false });
    });
    showTimelineBtn?.addEventListener("click", event => {
      blockPanelControlMapTap(event);
      setMobilePanelMode("timeline");
    });
    mobileTabTimelineBtn?.addEventListener("click", event => {
      blockPanelControlMapTap(event);
      selectMobilePanelTab("timeline");
    });
    mobileTabNearbyBtn?.addEventListener("click", event => {
      blockPanelControlMapTap(event);
      selectMobilePanelTab("nearby");
    });
    mobileTimelineCurrentBtn.addEventListener("click", event => {
      const sourceButton = event.target.closest("[data-timeline-source-info]");
      if (sourceButton) {
        event.preventDefault();
        event.stopPropagation();
        toggleTimelineSourceReference(sourceButton, sourceButton.closest(".timeline-feed-card"));
        return;
      }
      const seeMore = event.target.closest("[data-learning-see-more]");
      if (seeMore) {
        event.preventDefault();
        toggleLearningCardExpansion(seeMore);
        return;
      }
      const loadMore = event.target.closest("[data-timeline-show-more]");
      if (loadMore) {
        event.preventDefault();
        loadMoreMobileTimeline();
        return;
      }
      const loadEarlier = event.target.closest("[data-timeline-show-earlier]");
      if (loadEarlier) {
        event.preventDefault();
        loadEarlierMobileTimeline();
        return;
      }
      const discuss = event.target.closest("[data-learning-discuss]");
      if (discuss) {
        event.preventDefault();
        openMobileLearningDiscussion(discuss.dataset.learningDiscuss, discuss.dataset.learningSlug);
        return;
      }
      const card = event.target.closest("[data-timeline-id]");
      const current = card
        ? state.timelineById.get(String(card.dataset.timelineId)) || visibleMobileTimelineEvents().find(item => String(item.id) === String(card.dataset.timelineId))
        : null;
      if (event.target.closest("[data-timeline-open]")) {
        openMobileTimelineEvent(current);
        return;
      }
      if (event.target.closest("[data-timeline-map]")) {
        if (state.mobilePanelState === "maximized") setMobileBottomPanelState("normal");
        focusMobileTimelineEvent(current);
        return;
      }
    });
    mobileTimelineCurrentBtn.addEventListener("scroll", () => {
      state.timelineScrollTop = mobileTimelineCurrentBtn.scrollTop;
      if (state.timelineScrubberDragging) return;
      window.cancelAnimationFrame(state.timelineScrubberScrollFrame);
      state.timelineScrubberScrollFrame = window.requestAnimationFrame(() => {
        const cards = [...mobileTimelineCurrentBtn.querySelectorAll("[data-timeline-index]")];
        if (!cards.length) return;
        const threshold = mobileTimelineCurrentBtn.scrollTop + 24;
        let current = cards[0];
        cards.forEach(card => {
          if (card.offsetTop - mobileTimelineCurrentBtn.offsetTop <= threshold) current = card;
        });
        syncMobileTimelineScrubber(Number(current.dataset.timelineIndex) || 0);
      });
    }, { passive: true });
    mobileTimelineScrubberEl?.addEventListener("pointerdown", event => {
      if (event.button !== undefined && event.button !== 0) return;
      blockPanelControlMapTap(event);
      state.timelineScrubberDragging = true;
      mobileTimelineScrubberEl?.classList.add("is-active");
      mobileTimelineScrubberEl?.setPointerCapture?.(event.pointerId);
      updateMobileTimelineScrubberFromPointer(event);
    });
    mobileTimelineScrubberEl?.addEventListener("pointermove", event => {
      if (!state.timelineScrubberDragging) return;
      event.preventDefault();
      updateMobileTimelineScrubberFromPointer(event);
    });
    mobileTimelineScrubberRangeEl?.addEventListener("input", event => {
      scheduleMobileTimelineJump(event.currentTarget.value);
    });
    const finishTimelineScrub = event => {
      if (!state.timelineScrubberDragging && event.type !== "change") return;
      if (state.timelineScrubberDragging && event.type !== "pointercancel" && Number.isFinite(event.clientY)) {
        updateMobileTimelineScrubberFromPointer(event, true);
      } else {
        scheduleMobileTimelineJump(event.currentTarget?.value || state.timelineScrubberIndex, true);
      }
      state.timelineScrubberDragging = false;
      if (event.pointerId !== undefined && mobileTimelineScrubberEl?.hasPointerCapture?.(event.pointerId)) {
        mobileTimelineScrubberEl.releasePointerCapture(event.pointerId);
      }
      mobileTimelineScrubberEl?.classList.remove("is-active");
    };
    mobileTimelineScrubberEl?.addEventListener("pointerup", finishTimelineScrub);
    mobileTimelineScrubberEl?.addEventListener("pointercancel", finishTimelineScrub);
    mobileTimelineScrubberRangeEl?.addEventListener("change", finishTimelineScrub);
    document.addEventListener("scroll", event => {
      if (!event.target?.closest?.(".timeline-source-popover")) closeTimelineSourceReferences(document);
    }, { passive: true, capture: true });
    document.addEventListener("pointerdown", event => {
      if (event.target?.closest?.("[data-timeline-source-info], .timeline-source-popover")) return;
      closeTimelineSourceReferences(document);
    }, { capture: true });
    collapseListBtn.addEventListener("click", event => {
      blockPanelControlMapTap(event);
      const next = state.mobilePanelState === "collapsed"
        ? state.mobilePanelPreviousOpenState || "normal"
        : "collapsed";
      setMobileBottomPanelState(next);
    });
    mobilePanelSizeBtn?.addEventListener("click", event => {
      blockPanelControlMapTap(event);
      setMobileBottomPanelState(state.mobilePanelState === "maximized" ? "normal" : "maximized");
    });
    loginOpenBtn.addEventListener("click", openContributorAccountSheet);
    rewardsOpenBtn.addEventListener("click", async () => {
      renderRewards();
      openSheet(rewardsSheetEl);
      await ensureProfileStatsSynced();
      renderRewards();
    });
    profilesOpenBtn.addEventListener("click", async () => {
      renderProfiles();
      openSheet(profilesSheetEl);
      await ensureProfileStatsSynced();
      renderProfiles();
    });
    followingOpenBtn.addEventListener("click", () => openSheet(followingSheetEl));
    eventsOpenBtn.addEventListener("click", () => openSheet(eventsSheetEl));
    settingsOpenBtn.addEventListener("click", () => openSheet(settingsSheetEl));
    feedbackOpenBtn.addEventListener("click", () => openSheet(feedbackSheetEl));
    [feedbackNameEl, feedbackEmailEl, feedbackMessageEl].forEach(field => {
      field?.addEventListener("focus", keepFeedbackFieldVisible);
    });
    feedbackUploadBtn?.addEventListener("click", () => feedbackScreenshotEl?.click());
    feedbackRemoveScreenshotBtn?.addEventListener("click", removeFeedbackScreenshot);
    feedbackCaptureBtn?.addEventListener("click", () => {
      captureFeedbackScreenshot().catch(error => {
        if (feedbackScreenshotStatusEl) feedbackScreenshotStatusEl.textContent = error.message || "Could not capture screenshot. Upload one instead.";
        showBanner(error.message || "Could not capture screenshot. Upload one instead.");
      });
    });
    feedbackScreenshotEl?.addEventListener("change", () => {
      state.feedbackScreenshotFile = null;
      if (feedbackScreenshotStatusEl) feedbackScreenshotStatusEl.textContent = feedbackScreenshotEl.files?.[0]
        ? `Screenshot selected: ${feedbackScreenshotEl.files[0].name}`
        : "Optional screenshot helps explain what happened.";
      syncFeedbackScreenshotControls();
    });
    storyOpenBtn.addEventListener("click", () => openSheet(storySheetEl));
    mapStoryOpenBtn?.addEventListener("click", openContributionSheet);
    contributeStoryOpenBtn?.addEventListener("click", openMapStoryComposer);
    contributeSiteOpenBtn?.addEventListener("click", () => {
      if (requireRegisteredContributor()) openSheet(suggestSiteSheetEl);
    });
    mapStoryPhotoButtonEl?.addEventListener("click", () => mapStoryPhotoEl?.click());
    mapStoryPhotoEl?.addEventListener("change", () => {
      const file = mapStoryPhotoEl.files?.[0];
      if (!mapStoryPhotoPreviewEl) return;
      if (!file) {
        mapStoryPhotoPreviewEl.innerHTML = "";
        return;
      }
      const url = URL.createObjectURL(file);
      mapStoryPhotoPreviewEl.innerHTML = `<img src="${escapeHtml(url)}" alt="Selected story photo">`;
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
    mapStorySubmitEl?.addEventListener("click", () => submitMapStory());
    mapStoryViewEl?.addEventListener("click", event => {
      const vote = event.target.closest("[data-story-vote]");
      if (vote) {
        voteMapStory(vote.dataset.storyId, vote.dataset.storyVote);
        return;
      }
      const siteLink = event.target.closest("[data-story-site]");
      if (siteLink?.dataset.storySite) {
        mapStoryViewSheetEl.classList.remove("open");
        openSite(siteLink.dataset.storySite);
      }
    });
    mobileRefreshAppBtn?.addEventListener("click", async () => {
      document.querySelector(".mobile-more-menu[open]")?.removeAttribute("open");
      await refreshMobileAppDataFromDirectus();
    });
    mobileLearnOpenBtn?.addEventListener("click", () => {
      localStorage.removeItem("nli-kid-mode");
      document.querySelector(".mobile-more-menu[open]")?.removeAttribute("open");
      openAppPage("knowledgebase");
      showBanner("Learning articles opened.");
    });
    suggestSiteOpenBtn.addEventListener("click", () => {
      if (!requireRegisteredContributor()) return;
      openSheet(suggestSiteSheetEl);
    });
    document.addEventListener("click", event => {
      if (event.target.closest("[data-clear-address]")) {
        clearAddressSearch();
        renderList();
        showBanner("Search pin cleared.");
        return;
      }
      const appPageButton = event.target.closest("[data-app-page]");
      if (appPageButton?.dataset.appPage) {
        event.preventDefault();
        document.querySelector(".mobile-more-menu[open]")?.removeAttribute("open");
        openAppPage(appPageButton.dataset.appPage);
        return;
      }
      const menu = document.querySelector(".mobile-more-menu[open]");
      if (menu && !menu.contains(event.target)) {
        menu.removeAttribute("open");
        if (window.history.state?.nliMenu) window.history.back();
      }
      const layerMenu = document.querySelector(".mobile-layer-menu[open]");
      if (layerMenu && !layerMenu.contains(event.target)) {
        layerMenu.removeAttribute("open");
        if (window.history.state?.nliLayerMenu) window.history.back();
      }
    });
    document.querySelectorAll(".mobile-more-menu").forEach(menu => {
      menu.addEventListener("toggle", () => {
        if (menu.open) {
          document.querySelector(".mobile-layer-menu[open]")?.removeAttribute("open");
          // A full promo card must never sit over the actionable top menu.
          hideMobileStartupSpotlight();
          window.history.pushState({ nliMenu: true }, "", window.location.href);
        }
        fitMobileMoreMenu(menu);
      });
    });
    document.querySelectorAll(".mobile-layer-menu").forEach(menu => {
      menu.addEventListener("toggle", () => {
        if (menu.open) {
          document.querySelector(".mobile-more-menu[open]")?.removeAttribute("open");
          // Layer controls are also a full-screen interaction surface.
          hideMobileStartupSpotlight();
          // The fixed panel moves into place as the native <details> gesture
          // finishes. Briefly arm its bulk buttons so that opening Labels
          // cannot also activate the button that appears under the same touch.
          mobileLayerBulkReadyAt = Date.now() + 400;
          syncMobileLayerButtons();
          window.setTimeout(() => {
            if (menu.open) syncMobileLayerButtons();
          }, 425);
          window.history.pushState({ nliLayerMenu: true }, "", window.location.href);
        }
        fitMobileLayerMenu(menu);
      });
    });
    window.addEventListener("resize", () => {
      const menu = document.querySelector(".mobile-more-menu[open]");
      if (menu) fitMobileMoreMenu(menu);
      const layerMenu = document.querySelector(".mobile-layer-menu[open]");
      if (layerMenu) fitMobileLayerMenu(layerMenu);
    });
    function closeMobileSheetFromControl(event) {
      const button = event.target?.closest?.("[data-close-sheet]");
      if (!button) return;
      const sheet = button.closest(".sheet");
      if (sheet === storySheetEl) {
        closeStoryMode();
        return;
      }
      sheet?.classList.remove("open");
      if (sheet && mobileSheetRouteKey(sheet)) clearMobileRoute();
      syncMobilePanelAccessibility();
    }
    document.querySelectorAll("[data-close-sheet]").forEach(button => {
      button.addEventListener("click", closeMobileSheetFromControl);
    });
    function showMobileProfileReview(scope, kind) {
      const comments = scope?.querySelector("[data-mobile-profile-comments]");
      const progress = scope?.querySelector("[data-mobile-profile-progress]");
      if (kind === "helpful" && progress) {
        progress.hidden = false;
        progress.setAttribute("aria-hidden", "false");
      }
      if (comments) {
        comments.hidden = false;
        comments.setAttribute("aria-hidden", "false");
        comments.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }

    profileCardEl.addEventListener("click", event => {
      if (event.target.closest("[data-save-profile]")) {
        saveEditedProfile();
      }
      const inviteButton = event.target.closest("[data-send-account-invite]");
      if (inviteButton) {
        sendMobileAccountInvite(inviteButton.closest(".community-extra") || profileCardEl);
        return;
      }
      const languageToggle = event.target.closest("[data-show-profile-language]");
      if (languageToggle) {
        const language = profileCardEl.querySelector("[data-profile-language]");
        if (language) {
          const show = language.hasAttribute("hidden");
          language.hidden = !show;
          language.setAttribute("aria-hidden", show ? "false" : "true");
          languageToggle.setAttribute("aria-expanded", show ? "true" : "false");
          if (show) language.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
        return;
      }
      const profileComments = event.target.closest("[data-show-mobile-profile-comments]");
      if (profileComments) {
        showMobileProfileReview(profileCardEl, "comments");
        return;
      }
      const helpfulComments = event.target.closest("[data-show-mobile-profile-helpful]");
      if (helpfulComments) {
        showMobileProfileReview(profileCardEl, "helpful");
        return;
      }
      const progressToggle = event.target.closest("[data-show-mobile-profile-progress]");
      if (progressToggle) {
        const progress = profileCardEl.querySelector("[data-mobile-profile-progress]");
        if (progress) {
          const show = progress.hasAttribute("hidden");
          progress.hidden = !show;
          progress.setAttribute("aria-hidden", show ? "false" : "true");
          profileCardEl.querySelectorAll("[data-show-mobile-profile-progress]").forEach(button => {
            button.setAttribute("aria-expanded", show ? "true" : "false");
          });
          if (show) progress.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
        return;
      }
      const visitLink = event.target.closest("[data-profile-site]");
      if (visitLink?.dataset.profileSite) {
        openSite(visitLink.dataset.profileSite);
        loginSheetEl?.classList.remove("open");
        syncMobilePanelAccessibility();
        return;
      }
      if (event.target.closest("[data-open-visits]")) {
        openSheet(rewardsSheetEl);
        return;
      }
      if (event.target.closest("[data-profile-logout]")) {
        directusClient.logout().catch(() => false);
        saveProfile(null);
        registerPanelEl.hidden = true;
        showBanner("Logged out.");
        syncMobilePanelAccessibility();
        if (state.selectedSite?.slug) openSite(state.selectedSite.slug, { focus: false });
      }
    });
    visitSummaryEl.addEventListener("click", event => {
      const visitLink = event.target.closest("[data-profile-site]");
      if (!visitLink?.dataset.profileSite) return;
      openSite(visitLink.dataset.profileSite);
      rewardsSheetEl?.classList.remove("open");
      syncMobilePanelAccessibility();
    });
    suggestClickLocationBtn.addEventListener("click", () => {
      if (!state.map) {
        showBanner("The map is still loading.");
        return;
      }
      setSuggestionMapPickMode(true);
    });
    suggestUseLocationBtn.addEventListener("click", () => {
      if (state.userLocation) {
        setSuggestionPin(state.userLocation);
        return;
      }
      if (!navigator.geolocation) {
        showBanner("Location is not available on this device.");
        return;
      }
      navigator.geolocation.getCurrentPosition(position => {
        setSuggestionPin([position.coords.longitude, position.coords.latitude]);
      }, () => showBanner("Could not get your location."));
    });
    suggestSubmitBtn.addEventListener("click", () => {
      submitSiteSuggestion();
    });
    suggestMapPickCancelBtn?.addEventListener("click", () => {
      setSuggestionMapPickMode(false);
      openSheet(suggestSiteSheetEl);
    });
    feedbackSubmitBtn.addEventListener("click", () => {
      sendFeedback().catch(error => {
        feedbackSubmitBtn.disabled = false;
        feedbackSubmitBtn.textContent = "Send feedback";
        showBanner(error.message || "Could not send feedback.");
      });
    });
    demoLoginBtn?.addEventListener("click", () => {});
    registerToggleBtn.addEventListener("click", () => {
      registerPanelEl.hidden = !registerPanelEl.hidden;
      if (!registerPanelEl.hidden) passwordResetPanelEl.hidden = true;
      registerEmailEl.value = registerEmailEl.value || loginEmailEl.value.trim();
    });
    passwordResetToggleBtn?.addEventListener("click", () => {
      passwordResetPanelEl.hidden = !passwordResetPanelEl.hidden;
      if (!passwordResetPanelEl.hidden) {
        registerPanelEl.hidden = true;
        passwordResetEmailEl.value = passwordResetEmailEl.value || loginEmailEl.value.trim();
        renderPasswordResetPanelMode();
      }
    });
    registerSubmitBtn.addEventListener("click", async () => {
      const originalLabel = registerSubmitBtn.textContent;
      registerSubmitBtn.disabled = true;
      registerSubmitBtn.textContent = "Saving...";
      showRegisterStatus("Saving account request...");
      try {
        const profile = await registerLocalAccount({
          displayName: registerNameEl.value.trim(),
          email: registerEmailEl.value.trim(),
          password: registerPasswordEl.value,
          inviteCode: registerInviteCodeEl?.value || ""
        });
        loginEmailEl.value = profile.email;
        loginPasswordEl.value = "";
        registerPasswordEl.value = "";
        if (registerInviteCodeEl) registerInviteCodeEl.value = "";
        const message = profile.signupEmailError || (profile.inviteRedeemed
          ? "Thank you for registering. Your invite code was accepted and 100 points were awarded to the friend who invited you."
          : profile.inviteError
            ? `Thank you for registering. We will review your account soon. Invite code note: ${profile.inviteError}`
            : "Thank you for registering. We will review your account soon.");
        showRegisterStatus(message, profile.signupEmailError ? "error" : "success");
        showBanner(message);
      } catch (error) {
        showRegisterStatus(error.message || "Could not create registration.", "error");
        showBanner(error.message || "Could not create registration.");
      } finally {
        registerSubmitBtn.disabled = false;
        registerSubmitBtn.textContent = originalLabel;
      }
    });
    passwordResetSubmitBtn?.addEventListener("click", async () => {
      const originalLabel = passwordResetSubmitBtn.textContent;
      passwordResetSubmitBtn.disabled = true;
      passwordResetSubmitBtn.textContent = "Sending...";
      showPasswordResetStatus(state.passwordResetToken ? "Saving new password..." : "Sending reset email...");
      try {
        if (state.passwordResetToken) {
          await completePasswordReset({ password: passwordResetPasswordEl.value });
          passwordResetPasswordEl.value = "";
          renderPasswordResetPanelMode();
          const message = "Password updated. You can log in with the new password.";
          showPasswordResetStatus(message, "success");
          showBanner(message);
          return;
        }
        await requestPasswordReset({ email: passwordResetEmailEl.value.trim() });
        const message = "If an account exists for that email, a reset link has been sent.";
        showPasswordResetStatus(message, "success");
        showBanner(message);
      } catch (error) {
        showPasswordResetStatus(error.message || "Could not reset password.", "error");
        showBanner(error.message || "Could not reset password.");
      } finally {
        passwordResetSubmitBtn.disabled = false;
        passwordResetSubmitBtn.textContent = originalLabel;
        renderPasswordResetPanelMode();
      }
    });
    logoutSubmitBtn.addEventListener("click", async () => {
      await directusClient.logout?.({ revokeServerSession: true }).catch(() => null);
      saveProfile(null);
      registerPanelEl.hidden = true;
      showBanner("Logged out.");
      if (state.selectedSite?.slug) openSite(state.selectedSite.slug, { focus: false });
    });
    loginSubmitBtn.addEventListener("click", async () => {
      showLoginStatus("");
      if (!loginEmailEl.value.trim() || !loginPasswordEl.value) {
        showLoginStatus("Enter contributor email and password.", "error");
        showBanner("Enter contributor email and password.");
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(loginEmailEl.value.trim())) {
        showLoginStatus("Enter a valid email address.", "error");
        showBanner("Enter a valid email address.");
        return;
      }
      const originalLabel = loginSubmitBtn.textContent;
      loginSubmitBtn.disabled = true;
      loginSubmitBtn.textContent = "Checking...";
      showLoginStatus("Checking account...");
      try {
        const data = await directusClient.loginWithPassword(loginEmailEl.value.trim(), loginPasswordEl.value);
        const profile = await contributorProfileForToken(data?.access_token, loginEmailEl.value.trim());
        if (isProfileBanned(profile)) {
          throw new Error(profile?.ban_reason || "This account has been banned.");
        }
        saveProfile({
          display_name: profile?.display_name || loginEmailEl.value.trim(),
          email: loginEmailEl.value.trim(),
          role: profile?.role_label || "Contributor",
          approved: profile?.account_enabled !== false,
          pending: false,
          account_enabled: profile?.account_enabled !== false,
          profile_status: profile?.profile_status || "hidden",
          public_profile: profile?.public_profile === true,
          headline: profile?.headline || "",
          location_label: profile?.location_label || "",
          website_url: profile?.website_url || "",
          bio: profile?.bio || "",
          token: data?.access_token,
          refreshToken: data?.refresh_token || null,
          refresh_token: data?.refresh_token || null,
          tokenExpires: data?.expires || null,
          profileId: profile?.id || null
        });
        await directusClient.ensureAuthSession({
          requireAuth: true,
          authExpiredMessage: "Login could not establish a secure contributor session. Please try again."
        });
        showLoginStatus("Logged in.", "success");
        showBanner("Logged in.");
        if (state.selectedSite?.slug) openSite(state.selectedSite.slug, { focus: false });
        renderFollowing();
        void awardDailyLoginReward({ silent: true }).then(() => {
          renderProfile();
          renderRewards();
        });
        void ensureProfileStatsSynced().then(() => {
          renderProfile();
          renderRewards();
          if (profilesSheetEl?.classList.contains("open")) renderProfiles();
        }).catch(error => {
          console.warn("Contributor profile activity will retry after login.", error);
          return false;
        });
        scheduleMemberProfileActivityTracking({ login: true, force: true });
      } catch (error) {
        showLoginStatus(error.message || "Login did not work. Check the email/password or request account approval.", "error");
        showBanner(error.message || "Login did not work. Check the email/password or request account approval.");
      } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = originalLabel;
      }
    });
    historyAlertsEl.addEventListener("change", () => {
      state.settings.historyAlerts = historyAlertsEl.checked;
      saveSettings();
      if (state.settings.historyAlerts) checkDailyHistoryMoment();
    });
    proximityAlertsEl.addEventListener("change", () => {
      state.settings.proximityAlerts = proximityAlertsEl.checked;
      saveSettings();
      if (state.settings.proximityAlerts) locateUser();
    });
    newContentAlertsEl.addEventListener("change", () => {
      state.settings.newContentAlerts = newContentAlertsEl.checked;
      saveSettings();
      if (state.settings.newContentAlerts) checkNewContentAlerts();
    });
    territorySubtitleEl?.addEventListener("click", () => {
      const slug = territorySubtitleEl.dataset.territorySlug;
      if (!slug) return;
      openSite(slug, { focus: true });
    });
    detailTitleEl?.addEventListener("click", event => {
      const link = event.target.closest("[data-site-territory-slug]");
      if (!link) return;
      const slug = link.dataset.siteTerritorySlug;
      if (slug) openSite(slug, { focus: true });
    });
    notificationTestBtn.addEventListener("click", async () => {
      const sent = await notifyUser("On This Site", "Alerts are enabled for this app.");
      if (sent) showBanner("Alerts are enabled for this app.");
    });
    exhibitsToggleBtn?.addEventListener("click", () => {
      setMobileLayerVisibility("exhibits", state.settings.exhibits === false);
    });
    mobileBasemapSelect?.addEventListener("change", () => setMobileBasemap(mobileBasemapSelect.value));
    mobileLayerExhibitsInput?.addEventListener("change", () => setMobileLayerVisibility("exhibits", mobileLayerExhibitsInput.checked));
    mobileLayerPinsInput?.addEventListener("change", () => setMobileLayerVisibility("pins", mobileLayerPinsInput.checked));
    mobileLayerShapesInput?.addEventListener("change", () => setMobileLayerVisibility("shapes", mobileLayerShapesInput.checked));
    mobileLayerBiographyPathsInput?.addEventListener("change", () => setMobileLayerVisibility("biographyPaths", mobileLayerBiographyPathsInput.checked));
    mobileLayerCategoryInputs.forEach(input => input.addEventListener("change", () => setMobileLayerVisibility("category", true)));
    mobileLayerEraInputs.forEach(input => input.addEventListener("change", () => setMobileLayerVisibility("era", true)));
    function runMobileLayerBulkAction(visible) {
      if (mobileLayerMenu?.open && Date.now() < mobileLayerBulkReadyAt) return;
      setAllMobileLayerVisibility(visible);
    }
    mobileLayerEnableAllBtn?.addEventListener("click", () => runMobileLayerBulkAction(true));
    mobileLayerDisableAllBtn?.addEventListener("click", () => runMobileLayerBulkAction(false));
    mobilePinsToggleBtn?.addEventListener("click", () => setMobileLayerVisibility("pins", state.settings.showPins === false));
    mobileShapesToggleBtn?.addEventListener("click", () => setMobileLayerVisibility("shapes", state.settings.showShapes === false));
    function bindMobileStartupSpotlightAction(button, action) {
      if (!button) return;
      let touchHandledAt = 0;
      button.addEventListener("pointerup", event => {
        if (event.pointerType !== "touch") return;
        event.preventDefault();
        touchHandledAt = Date.now();
        action();
      });
      button.addEventListener("click", event => {
        if (Date.now() - touchHandledAt < 700) {
          event.preventDefault();
          return;
        }
        action();
      });
    }
    bindMobileStartupSpotlightAction(mobileStartupSpotlightLearnBtn, activateMobilePromo);
    bindMobileStartupSpotlightAction(mobileStartupSpotlightDismissBtn, hideMobileStartupSpotlight);
    bindMobileStartupSpotlightAction(mobileStartupSpotlightCloseBtn, hideMobileStartupSpotlight);
    mobilePromoButtons.forEach(button => button.addEventListener("click", () => {
      const kind = button.dataset.mobilePromoKind || "";
      if (state.mobilePromoKind === kind && !mobileStartupSpotlightEl?.hidden) {
        hideMobileStartupSpotlight();
        return;
      }
      showMobilePromo(kind);
    }));
    window.addEventListener("resize", positionMobileStartupSpotlight);
    window.addEventListener("orientationchange", () => window.setTimeout(positionMobileStartupSpotlight, 260));
    storyRecordBtn.addEventListener("click", async () => {
      if (state.storyRecorder?.state === "recording") {
        stopStoryRecording();
        return;
      }
      storyRecordBtn.disabled = true;
      try {
        await startStoryRecording();
      } finally {
        storyRecordBtn.disabled = false;
      }
    });
    storyCancelBtn.addEventListener("click", closeStoryMode);
    storyProgressBarEl.addEventListener("animationend", event => {
      if (event.animationName !== "story-progress") return;
      if (state.storyRecorder?.state === "recording") {
        storyRecordBtn.textContent = "Stop & save";
        showBanner("Story text finished. Tap Stop & save when ready.");
      }
    });
    storyDownloadLinkEl.addEventListener("click", event => {
      if (window.AndroidStory?.openLastVideo && state.storyLastBlob) {
        event.preventDefault();
        window.AndroidStory.openLastVideo();
      }
    });
    storyShareBtn.addEventListener("click", async () => {
      if (!state.storyLastBlob) {
        showBanner("Record a story video first.");
        return;
      }
      if (window.AndroidStory?.shareLastVideo) {
        window.AndroidStory.shareLastVideo();
        return;
      }
      const file = new File([state.storyLastBlob], storyDownloadLinkEl.download || "on-this-site-ar-story.webm", { type: state.storyLastBlob.type || "video/webm" });
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        try {
          await navigator.share({
            files: [file],
            title: "On This Site AR Story",
            text: "Recorded with On This Site."
          });
          return;
        } catch (error) {
          if (error?.name === "AbortError") return;
        }
      }
      showBanner("Sharing is not available here. Use Open video, then share from Downloads or Files.");
    });
    document.addEventListener("keydown", event => {
      const target = event.target;
      const editing = target && /input|textarea|select/i.test(target.tagName || "");
      scheduleMemberProfileActivityTracking();
    });
    ["click", "touchend"].forEach(type => {
      document.addEventListener(type, () => scheduleMemberProfileActivityTracking(), { passive: true });
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        captureAndroidLifecycleSnapshot();
        scheduleMemberProfileActivityTracking({ force: true, throttleMs: 0 });
      } else {
        scheduleMemberProfileActivityTracking();
        if (state.profile) {
          state.profileActivitySynced = false;
          ensureProfileStatsSynced().then(() => {
            renderProfile();
            renderRewards();
          }).catch(() => null);
        }
        refreshAndroidMapAfterSettle("android-app-visible");
      }
    });
    window.addEventListener("storage", event => {
      if (!["nli-contributor-session", "nli-contributor-profile", "nli-mobile-profile"].includes(event.key || "")) return;
      state.profile = loadProfile();
      state.profileActivitySynced = false;
      state.profileActivityCache = null;
      renderProfile();
      if (state.profile) ensureProfileStatsSynced().then(() => {
        renderProfile();
        renderRewards();
      }).catch(() => null);
    });
    window.addEventListener("pagehide", () => {
      captureAndroidLifecycleSnapshot();
      scheduleMemberProfileActivityTracking({ force: true, throttleMs: 0 });
    });

    window.__nliCaptureAndroidLifecycleSnapshot = captureAndroidLifecycleSnapshot;

    async function start() {
      try {
        checkAndroidAppCompatibility();
        const nativeAndroid = isNativeAndroidApp();
        state.mobileStartupRendering = true;
        setLoadingMessage("Loading sites and nearby tools.");
        const startupLandMask = isOfflineTextMode() ? Promise.resolve(null) : ensureLandMask();
        await loadData();
        await startupLandMask;
        setLoadingMessage("Preparing the mobile interface.");
        prepareSites();
        renderProfile();
        if (nativeAndroid) idleTask(renderRewards);
        else renderRewards();
        renderSupportGoal();
        renderPasswordResetPanelMode();
        syncMobileLayerButtons();
        syncMobilePanelAccessibility();
        renderCurrentTerritoryStatus();
        const androidLifecycleSnapshot = nativeAndroid ? readAndroidLifecycleSnapshot() : null;
        if (nativeAndroid && !isOfflineTextMode()) await requestStartupLocation();
        if (nativeAndroid) {
          idleTask(() => {
            if (!state.mobileTimelineRendered) renderMobileTimeline();
          });
        } else {
          renderMobileTimeline();
        }
        renderList();
        // A cold launch should always reveal the map first.  Only restore a
        // panel mode/size when Android is returning the user to content that
        // was already open (for example after taking a photo in a draft).
        if (androidLifecycleSnapshot?.content) {
          restoreAndroidLifecyclePanels(androidLifecycleSnapshot);
        } else {
          setMobilePanelMode("nearby");
          setMobileBottomPanelState("normal", { persist: false });
        }
        installMobileBottomPanelDrag();
        installDetailPanelDrag();
        installNativeAndroidSearchWatch();
        if (nativeAndroid) {
          await new Promise(resolve => window.requestAnimationFrame(resolve));
        }
        await openInitialRouteFromUrl();
        let androidLifecycleContentRestored = false;
        const routeAlreadyOpened = Boolean(detailEl?.classList.contains("open") || document.querySelector(".sheet.open"));
        if (!routeAlreadyOpened && androidLifecycleSnapshot) {
          androidLifecycleContentRestored = await restoreAndroidLifecycleContent(androidLifecycleSnapshot);
        }
        if (state.passwordResetToken) openSheet(loginSheetEl);
        // The searchable local index is ready at this point.  Let people use
        // the app while the slower map initializes in the background.
        hideLoadingScreen();
        await initMap().catch(error => {
          console.warn("Map did not initialize yet.", error);
          statusEl.textContent = `${state.filtered.length || state.sites.length} sites`;
        });
        if (!isOfflineTextMode()) {
          state.researchQuestionInstance = window.NLI_RESEARCH_QUESTION_UTILS?.init?.({
            platform: "mobile",
            getIdentity: currentContributorIdentity,
            getAccessToken: () => state.profile?.token || "",
            autoPrompt: false,
            showRestore: false,
            isUiBusy: () => Boolean(
              detailEl?.classList.contains("open")
              || document.querySelector(".sheet.open")
              || document.querySelector("#language-quiz-modal:not([hidden])")
              || document.querySelector("#plant-photo-viewer:not([hidden])")
            )
          }) || null;
        }
        syncMobilePromoDock();
        if (!window.NLI_DISABLE_DIRECTUS_RUNTIME) {
          window.setTimeout(() => idleTask(refreshMobileSiteIconFieldsFromDirectus), 30000);
        }
        // Do not make a just-added visitor story wait for the deferred archive
        // pass or the polling timer before its marker is eligible to appear.
        if (!window.NLI_DISABLE_DIRECTUS_RUNTIME) refreshMapStories();
        state.mobileStartupRendering = false;
        updateMobileHeaderInstruction();
        if (nativeAndroid) {
          [300, 1000, 2500].forEach(delay => window.setTimeout(updateMobileHeaderInstruction, delay));
        }
        const androidLifecycleMapRestored = androidLifecycleSnapshot ? restoreAndroidLifecycleMap(androidLifecycleSnapshot) : false;
        state.androidLifecycleRestored = Boolean(androidLifecycleSnapshot && (androidLifecycleMapRestored || androidLifecycleContentRestored));
        if (androidLifecycleContentRestored) restoreAndroidLifecycleDetailScroll(androidLifecycleSnapshot);
        if (nativeAndroid && state.userLocation && !state.androidLifecycleRestored) {
          if (pointWithinBounds(state.userLocation, STARTUP_LOCATION_CENTER_BOUNDS)) {
            syncUserLocationMarker({ centerMap: true, zoom: NEAR_ME_ZOOM });
            refreshAndroidMapAfterSettle("android-startup-near-me");
          } else {
            syncUserLocationMarker({ centerMap: false });
            fitLongIslandMapView("android-startup-outside-long-island");
          }
        }
        if (state.selectedSite && !androidLifecycleMapRestored) focusSite(state.selectedSite);
        scheduleMobilePromoStartup();
        checkDailyHistoryMoment();
        checkNewContentAlerts();
        if (!nativeAndroid) requestStartupLocation();
        if (!window.NLI_DISABLE_DIRECTUS_RUNTIME) {
          idleTask(() => (state.profile ? ensureProfileStatsSynced() : Promise.resolve(false))
            .then(() => awardDailyLoginReward({ silent: true }))
            .then(result => {
              if (result?.earned) {
                renderProfile();
                renderRewards();
              }
              scheduleMemberProfileActivityTracking();
            })
            .catch(() => null));
        }
        idleTask(() => loadDeferredData({ includeCommunity: true })
          .then(() => state.profile && !state.profileActivitySynced ? ensureProfileActivitySynced() : true)
          .then(() => {
            if (state.profile) {
              renderProfile();
              renderRewards();
            }
            checkDailyHistoryMoment();
            checkNewContentAlerts();
            syncMobilePromoDock();
            startMapStoryRefresh();
          })
          .catch(error => console.warn("Deferred site data did not load yet.", error)));
      } catch (error) {
        state.mobileStartupRendering = false;
        statusEl.textContent = "Could not load site data";
        setLoadingMessage("The mobile site data could not finish loading.");
        window.setTimeout(hideLoadingScreen, 1200);
        showBanner("The mobile site data could not load yet.");
        console.error(error);
      }
    }

    start();
