(function () {
  const checkinHistoryDescription = "At places open to the public, each respectful visit is a chance to learn from the landscape, notice changes, and discover another part of Long Island’s Native history. Sharing what you see helps build a public record and community support for protecting these places from neglect and inappropriate development.";
  const normalizeText = window.NLI_SHARED_UTILS?.normalizeText || (value =>
    String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()
  );

  function isCoordinateOnlyLabel(value) {
    return /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(String(value || "").trim());
  }

  function titleCaseSiteType(value) {
    return String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function normalizeHexColor(value, fallback) {
    const text = String(value || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(text)) return text;
    if (/^[0-9a-f]{6}$/i.test(text)) return `#${text}`;
    return fallback;
  }

  const DEFAULT_BLUE_PIN_SITE_SLUGS = new Set([
    "matinecock",
    "matinecock-indian-nation",
    "matinecock-tribal-nation"
  ]);

  const BROAD_TERRITORY_SLUGS = new Set([
    "canarsie-traditional-land",
    "rockaway-traditional-land",
    "matinecock-traditional-land",
    "merrick-ancestral-land",
    "massapequa-ancestral-lands",
    "nissaquogues",
    "secatogue-ancestral-land",
    "setauket-ancestral-land",
    "unkechaug-ancestral-land",
    "corchaug-ancestral-land",
    "shinnecock-ancestral-land",
    "montaukett-ancestral-land",
    "manhansett-ancestral-land"
  ]);

  const SITE_CONTENT_APPEND_OVERRIDES = {
    "shinnecock-hills-golf-club": {
      field: "whereintheworld_content",
      marker: "Df9SfZ2L3Z0",
      html: `
        <figure class="video-embed">
          <iframe src="https://www.youtube.com/embed/Df9SfZ2L3Z0" title="The Land We Share | 2026 U.S. Open | Golf Channel" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
          <figcaption>The Land We Share, a Golf Channel video connected with the 2026 U.S. Open at Shinnecock Hills.</figcaption>
        </figure>
      `
    }
  };

  function siteUsesDefaultBluePin(site = {}) {
    return DEFAULT_BLUE_PIN_SITE_SLUGS.has(String(site?.slug || "").trim().toLowerCase());
  }

  function siteWithContentOverrides(site = {}) {
    const slug = String(site?.slug || "").trim().toLowerCase();
    const override = SITE_CONTENT_APPEND_OVERRIDES[slug];
    if (!override?.field || !override.html) return site;
    const current = String(site?.[override.field] || "");
    if (override.marker && current.includes(override.marker)) return site;
    return {
      ...site,
      [override.field]: `${current.trimEnd()}${current.trim() ? "\n" : ""}${override.html.trim()}`
    };
  }

  const PUBLIC_SITE_CONTENT_FIELDS = [
    ["introduction_title", "introduction_content"],
    ["oral_history_title", "oral_history_content"],
    ["history_title", "history_content"],
    ["legends_and_lore_title", "legends_and_lore_content"],
    ["translation_title", "translation_content"],
    ["preservation_title", "preservation_content"],
    ["artifacts_title", "artifacts_content"],
    ["colonial_description_title", "colonial_description_content"],
    ["land_loss_title", "land_loss_content"],
    ["excavation_title", "excavation_content"],
    ["vandalism_title", "vandalism_content"],
    ["whereintheworld_title", "whereintheworld_content"]
  ];

  function plainPublicSiteText(value) {
    return String(value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, " ")
      .trim();
  }

  function publicFacingWorkflowTextCleanup(value) {
    if (value == null || typeof value !== "string") return value;
    const vulnerableSites = ["vulnerable", "sites"].join(" ");
    const historyShouldBeTaught = ["The history", "should be taught"].join(" ");
    return String(value || "")
      .replace(/,\s*a public-safe way to explain ([^.]+?) without mapping private or sacred-use details/gi, ", a careful account of $1 while keeping sensitive place details private")
      .replace(/\ba public-safe way to explain\b/gi, "a careful account of")
      .replace(/\bpublic-safe overview\b/gi, "public overview")
      .replace(/\bpublic safety note\b/gi, "Learning With Care")
      .replace(/\bpublic-safe note\b/gi, "note")
      .replace(/\bpublic-safe interpretation\b/gi, "careful interpretation")
      .replace(/\bpublic-safe context\b/gi, "public context")
      .replace(/\bpublic-safe approximate\b/gi, "approximate")
      .replace(/\bpublic-safe shell-deposit\b/gi, "carefully framed shell-deposit")
      .replace(/\bpublic-safety handling\b/gi, "careful handling")
      .replace(/\bpublic-safe\b/gi, "carefully framed")
      .replace(/\bsource-supported biography\b/gi, "sourced biography")
      .replace(/\bsource-supported place-name moment\b/gi, "sourced place-name moment")
      .replace(/\bsource-supported case\b/gi, "sourced case")
      .replace(/\bsource-supported\b/gi, "source-based")
      .replace(/\bTimi\?oara\b/g, "Timisoara")
      .replace(/\bThe entry preserves\b/g, "The name preserves")
      .replace(/\bwith inline footnotes for specific facts\b/gi, "with references for specific facts")
      .replace(/\bon this site knowledgebase\b/gi, "this knowledgebase")
      .replace(/\bthe entry avoids\b/gi, "the account avoids")
      .replace(/\bwithout mapping private or sacred-use details\b/gi, "while keeping sensitive place details private")
      .replace(new RegExp(`\\b${historyShouldBeTaught} with respect for cultural places and without turning ${vulnerableSites} into destinations\\.?`, "gi"), "")
      .replace(new RegExp(`\\bThey should be interpreted through broad landscape context and community care, without exposing ${vulnerableSites}\\.?`, "gi"), "Shell midden history belongs within broad coastal landscapes, foodways, and community care; exact sensitive locations are not shared.")
      .replace(new RegExp(`\\bwithout exposing ${vulnerableSites}\\b`, "gi"), "without sharing sensitive locations")
      .replace(/\bSource used for this Freeport\/Merrick archive entry; see this page notes for sensitivity and location-generalization context\.?/gi, "Reference for Freeport and Merrick-area context; exact sensitive locations are kept broad.")
      .replace(/\bSource used for this Native-history entry\.?/gi, "Reference for Native history context.")
      .replace(/\bSource used for this ancestral-land public learning page\.?/gi, "Reference for ancestral land and community history context.")
      .replace(/\bwomen\?s\b/gi, "women's")
      .replace(/\bsource trails\b/gi, "source materials")
      .replace(/\bsource trail\b/gi, "source material")
      .replace(/\bSource used for this ([^.;]{2,80}) archive entry\b/gi, "Reference for $1 context")
      .replace(/\bsee this page notes for sensitivity and location-generalization context\b/gi, "exact sensitive locations are kept broad")
      .replace(/;\s*exact heading\/page review needed because source scan cuts this page heading\.?/gi, "")
      .replace(/;\s*exact title and page need citation review\.?/gi, "")
      .replace(/;\s*exact transcription and page details need citation review\.?/gi, "")
      .replace(/\s*Exact calendar edition and document details need citation review\.?/gi, "")
      .replace(/\s*Exact record and transcription need citation review\.?/gi, "")
      .replace(/;\s*exact volume and page details need citation review\.?/gi, "")
      .replace(/\s*Exact sheet and date need citation review\.?/gi, "")
      .replace(/;\s*exact [^.]{1,180}citation review(?: needed)?\.?/gi, "")
      .replace(/\s*Exact [^.]{1,180}citation review(?: needed)?\.?/g, "")
      .replace(/\bcurrent preserve location and history need citation review\.?/gi, "current preserve location and history context")
      .replace(/\bmodern preserve context and acreage\/coastline details need citation review\.?/gi, "modern preserve context and acreage/coastline details")
      .replace(new RegExp(`\\bThe digital source has a gap in the ${"entry"} text\\.?`, "gi"), "")
      .replace(/\bcalled in Bob\b/gi, "called Bob")
      .replace(new RegExp(`\\b${"general"}ized\\b`, "gi"), "general");
  }

  function stripInternalPublicSiteSections(value) {
    if (value == null || typeof value !== "string") return value;
    const marker = ["audit", "pass"].join("-");
    const pattern = new RegExp(`<section\\b[^>]*\\b${marker}[^>]*>[\\s\\S]*?<\\/section>`, "gi");
    const stripped = publicFacingWorkflowTextCleanup(value).replace(pattern, " ");
    if (stripped === value) return value;
    return plainPublicSiteText(stripped) ? stripped.trim() : null;
  }

  function isInternalPublicSiteNoteSection(title, content) {
    const combined = normalizeText(`${plainPublicSiteText(title)} ${plainPublicSiteText(content)}`);
    const normalizedTitle = normalizeText(plainPublicSiteText(title));
    const hasPhrase = words => combined.includes(words.join(" "));
    const titleHasPhrase = words => normalizedTitle.includes(words.join(" "));
    const titleLooksInternal =
      titleHasPhrase(["public", "engagement"]) ||
      titleHasPhrase(["public", "access", "note"]) ||
      titleHasPhrase(["public", "engagement", "note"]) ||
      /\bstewardship\b/.test(normalizedTitle);
    const processLooksInternal =
      hasPhrase(["this", "page", "should", "frame"]) ||
      hasPhrase(["any", "map", "location", "should", "identify", "only"]) ||
      hasPhrase(["map", "location", "should", "identify", "only"]) ||
      hasPhrase(["should", "avoid", "archaeological", "burial", "residential", "or", "private", "property", "details"]);
    const contentLooksInternal =
      titleLooksInternal ||
      hasPhrase(["public", "event", "education", "site"]) ||
      hasPhrase(["map", "only", "the", "general", "public", "school", "event", "grounds"]) ||
      hasPhrase(["do", "not", "map", "surrounding", "habitation", "burial", "or", "private", "property", "archaeology"]) ||
      hasPhrase(["suitable", "for", "public", "education", "when", "tied", "to", "a", "public", "event", "venue"]) ||
      hasPhrase(["should", "not", "point", "readers", "to", "sensitive", "or", "unverified", "locations"]);
    return processLooksInternal || (titleLooksInternal && contentLooksInternal);
  }

  function sanitizePublicSiteContent(site = {}) {
    if (!site || typeof site !== "object") return site;
    let next = site;
    for (const field of ["summary", "address_label", "why_this_matters", "listing_image_alt"]) {
      const cleaned = publicFacingWorkflowTextCleanup(site[field]);
      if (cleaned !== site[field]) {
        if (next === site) next = { ...site };
        next[field] = cleaned;
      }
    }
    if (Array.isArray(site.source_list)) {
      const cleanedSources = site.source_list.map(source => ({
        ...source,
        citation: publicFacingWorkflowTextCleanup(source?.citation),
        citation_context: publicFacingWorkflowTextCleanup(source?.citation_context)
      }));
      if (JSON.stringify(cleanedSources) !== JSON.stringify(site.source_list)) {
        if (next === site) next = { ...site };
        next.source_list = cleanedSources;
      }
    }
    for (const [titleField, contentField] of PUBLIC_SITE_CONTENT_FIELDS) {
      const cleanedTitle = publicFacingWorkflowTextCleanup(site[titleField]);
      const cleanedContent = stripInternalPublicSiteSections(site[contentField]);
      if (plainPublicSiteText(cleanedTitle) && !plainPublicSiteText(cleanedContent)) {
        if (next === site) next = { ...site };
        next[titleField] = null;
        next[contentField] = null;
        continue;
      }
      if (cleanedTitle !== site[titleField]) {
        if (next === site) next = { ...site };
        next[titleField] = cleanedTitle;
      }
      if (cleanedContent !== site[contentField]) {
        if (next === site) next = { ...site };
        next[contentField] = cleanedContent;
      }
      if (isInternalPublicSiteNoteSection(site[titleField], cleanedContent)) {
        if (next === site) next = { ...site };
        next[titleField] = null;
        next[contentField] = null;
      }
    }
    return next;
  }

  // Full listing articles use the structured Introduction when present; the
  // shorter summary remains the single fallback and continues to serve cards.
  function siteIntroductionPresentation(site = {}, sections = [], options = {}) {
    const cleanText = typeof options.cleanText === "function"
      ? options.cleanText
      : plainPublicSiteText;
    const summaryValue = options.summary !== undefined ? options.summary : site?.summary;
    const summary = cleanText(summaryValue || "");
    const introductionField = options.introductionField || "introduction_content";
    const hasStructuredIntroduction = (sections || []).some(section =>
      section?.[2]?.content === introductionField
    );
    return {
      hasStructuredIntroduction,
      leadSummary: hasStructuredIntroduction ? "" : summary
    };
  }

  function siteDisplayType(site, options = {}) {
    if (!site) return "";
    const overrides = options.overrides || {};
    const typeLabels = options.typeLabels || {};
    const override = overrides[site.slug];
    if (override) return override;
    const rawType = String(site.site_type || "").trim();
    const normalizedType = rawType.toLowerCase();
    return rawType ? typeLabels[normalizedType] || titleCaseSiteType(rawType) : "";
  }


  // Census 2025 Places Gazetteer representative points (not municipal boundaries).
  // https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gaz_place_national.zip
  // Regional subset: 40.45–41.5 N, 74.3–71.7 W. Proximity labels always say "near".
  const MODERN_PLACES = [["Ansonia","CT",-73.069825,41.344249],["Ball Pond","CT",-73.526846,41.461651],["Bethel","CT",-73.413942,41.360293],["Bigelow Corners","CT",-73.508198,41.465011],["Botsford","CT",-73.267159,41.358776],["Branchville","CT",-73.443369,41.26784],["Branford Center","CT",-72.816095,41.277654],["Bridgeport","CT",-73.195757,41.187393],["Brookfield Center","CT",-73.387528,41.462362],["Byram","CT",-73.65412,41.001096],["Candlewood Isle","CT",-73.453284,41.488531],["Candlewood Knolls","CT",-73.463613,41.479055],["Candlewood Lake Club","CT",-73.436793,41.493143],["Candlewood Orchards","CT",-73.4373,41.471615],["Candlewood Shores","CT",-73.438045,41.480054],["Cannondale","CT",-73.425264,41.216158],["Chester Center","CT",-72.456949,41.403012],["Clinton","CT",-72.529,41.276405],["Coleytown","CT",-73.343358,41.176904],["Compo","CT",-73.351528,41.122758],["Conning Towers-Nautilus Park","CT",-72.063784,41.389239],["Cos Cob","CT",-73.591901,41.048594],["Danbury","CT",-73.478103,41.398741],["Daniels Farm","CT",-73.212263,41.276903],["Darien Downtown","CT",-73.469669,41.076738],["Deep River Center","CT",-72.440493,41.37886],["Derby","CT",-73.082574,41.326124],["Dodgingtown","CT",-73.352369,41.379765],["Durham","CT",-72.684525,41.468922],["East Haven","CT",-72.858994,41.293453],["East Village","CT",-73.186534,41.36044],["Essex Village","CT",-72.393538,41.356648],["Fairfield University","CT",-73.257057,41.158953],["Fenwick","CT",-72.354585,41.27107],["Gales Ferry","CT",-72.084501,41.421722],["Georgetown","CT",-73.435673,41.241985],["Glenville","CT",-73.664156,41.035221],["Greens Farms","CT",-73.322685,41.124096],["Greenwich","CT",-73.626931,41.027773],["Groton","CT",-72.066862,41.325054],["Groton Long Point","CT",-72.010155,41.314186],["Guilford Center","CT",-72.676216,41.280512],["Hawleyville","CT",-73.350443,41.428912],["Heritage Village","CT",-73.233294,41.485917],["Higganum","CT",-72.557768,41.490703],["Indian Field","CT",-73.608029,41.019841],["Kellogg Point","CT",-73.459889,41.46819],["Lakes East","CT",-73.492539,41.330675],["Lakes West","CT",-73.51194,41.336318],["Long Hill","CT",-73.228362,41.266595],["Long Hill","CT",-72.050529,41.349614],["Lordship","CT",-73.114229,41.153023],["Madison Center","CT",-72.602272,41.280223],["Mamanasco Lake","CT",-73.529803,41.318172],["Mashantucket","CT",-71.974802,41.464443],["Milford city (balance)","CT",-73.064556,41.223644],["Mill Plain","CT",-73.268283,41.154692],["Murray","CT",-73.289525,41.197407],["Mystic","CT",-71.955882,41.355976],["Naugatuck","CT",-73.051551,41.487785],["New Canaan","CT",-73.490141,41.141703],["New Haven","CT",-72.924953,41.310809],["New London","CT",-72.096176,41.332957],["Newtown","CT",-73.31195,41.411897],["Niantic","CT",-72.199865,41.316768],["Noank","CT",-71.997557,41.337502],["Noroton","CT",-73.490526,41.058356],["Noroton Heights","CT",-73.497221,41.074091],["Northford","CT",-72.783181,41.395805],["North Haven","CT",-72.856371,41.381465],["Norwalk","CT",-73.419796,41.092739],["Old Greenwich","CT",-73.567675,41.020119],["Old Hill","CT",-73.379378,41.149936],["Old Mystic","CT",-71.986246,41.383632],["Old Saybrook Center","CT",-72.358179,41.286632],["Orange","CT",-73.024637,41.284951],["Oronoque","CT",-73.110639,41.259164],["Oxoboxo River","CT",-72.126864,41.444859],["Pawcatuck","CT",-71.856422,41.37389],["Pemberwick","CT",-73.656203,41.018188],["Plattsville","CT",-73.259096,41.225936],["Poplar Plains","CT",-73.378238,41.168872],["Poquonock Bridge","CT",-72.012268,41.336426],["Quinnipiac University","CT",-72.893614,41.420102],["Redding Center","CT",-73.383024,41.306663],["Ridgebury","CT",-73.535893,41.356765],["Ridgefield","CT",-73.492611,41.269688],["Riverside","CT",-73.583719,41.030093],["Rock Ridge","CT",-73.648396,41.03442],["Route 7 Gateway","CT",-73.475382,41.318764],["Sacred Heart University","CT",-73.2442,41.22148],["Sandy Hook","CT",-73.24263,41.409],["Saugatuck","CT",-73.368771,41.112131],["Saybrook Manor","CT",-72.406605,41.28343],["Shelton","CT",-73.139215,41.304577],["Southport","CT",-73.287125,41.13494],["South Wilton","CT",-73.416966,41.172295],["Stamford","CT",-73.54608,41.079611],["Staples","CT",-73.325627,41.155369],["Stepney","CT",-73.268391,41.324356],["Stonington","CT",-71.899459,41.334765],["Stratford Downtown","CT",-73.12767,41.198849],["Taylor Corners","CT",-73.528687,41.446413],["Tashua","CT",-73.254445,41.275019],["Tokeneke","CT",-73.462564,41.053462],["Topstone","CT",-73.44657,41.296308],["Trumbull Center","CT",-73.183483,41.242397],["Wallingford Center","CT",-72.818334,41.449917],["Waterford","CT",-72.129342,41.346273],["Westbrook Center","CT",-72.442347,41.281404],["West Haven","CT",-72.967497,41.272121],["West Mountain","CT",-73.542315,41.300077],["Weston","CT",-73.378781,41.203236],["Westport Village","CT",-73.360253,41.143351],["Wilton Center","CT",-73.426163,41.191279],["Woodmont","CT",-72.995071,41.221553],["Allendale","NJ",-74.133826,41.032669],["Alpine","NJ",-73.916896,40.968782],["Ampere North","NJ",-74.191831,40.77574],["Avenel","NJ",-74.271626,40.584334],["Bayonne","NJ",-74.110201,40.662495],["Bergenfield","NJ",-73.998001,40.922334],["Bogota","NJ",-74.029737,40.874293],["Brookdale","NJ",-74.179793,40.834296],["Caldwell","NJ",-74.277026,40.839235],["Carlstadt","NJ",-74.062335,40.826431],["Carteret","NJ",-74.227457,40.58379],["Cliffside Park","NJ",-73.987932,40.82205],["Clifton","NJ",-74.160393,40.862137],["Closter","NJ",-73.960315,40.97289],["Connecticut Farms","NJ",-74.271549,40.693015],["Cresskill","NJ",-73.958313,40.940018],["Demarest","NJ",-73.954921,40.954103],["Dumont","NJ",-73.992428,40.945239],["East Newark","NJ",-74.162189,40.752011],["East Orange","NJ",-74.211655,40.765055],["East Rutherford","NJ",-74.085024,40.817097],["Edgewater","NJ",-73.973793,40.82465],["Elizabeth","NJ",-74.193503,40.666367],["Elmwood Park","NJ",-74.119514,40.904526],["Emerson","NJ",-74.023248,40.97499],["Englewood","NJ",-73.972515,40.891197],["Englewood Cliffs","NJ",-73.944654,40.884634],["Essex Fells","NJ",-74.276226,40.828102],["Fair Lawn","NJ",-74.117505,40.93583],["Fairview","NJ",-74.003032,40.82111],["Fort Lee","NJ",-73.971007,40.85064],["Franklin Lakes","NJ",-74.205653,41.007526],["Garfield","NJ",-74.10825,40.879797],["Glen Ridge","NJ",-74.204569,40.804798],["Glen Rock","NJ",-74.125202,40.959471],["Great Notch","NJ",-74.208634,40.871476],["Guttenberg","NJ",-74.004572,40.792784],["Hackensack","NJ",-74.045698,40.889398],["Haledon","NJ",-74.188867,40.936989],["Harrington Park","NJ",-73.980202,40.991681],["Harrison","NJ",-74.152911,40.742978],["Hasbrouck Heights","NJ",-74.075182,40.862751],["Haworth","NJ",-73.99747,40.962737],["Hawthorne","NJ",-74.158561,40.956957],["Hillsdale","NJ",-74.045119,41.007127],["Hoboken","NJ",-74.027926,40.745251],["Ho-Ho-Kus","NJ",-74.096583,40.9995],["Hopelawn","NJ",-74.293633,40.528629],["Jersey City","NJ",-74.06476,40.711417],["Keansburg","NJ",-74.155634,40.451869],["Kean University","NJ",-74.233159,40.677838],["Kearny","NJ",-74.123093,40.752332],["Kenilworth","NJ",-74.288114,40.678089],["Leonia","NJ",-73.988466,40.863391],["Linden","NJ",-74.23631,40.627337],["Little Ferry","NJ",-74.034239,40.843431],["Llewellyn Park","NJ",-74.239687,40.789328],["Lodi","NJ",-74.0825,40.877915],["Maywood","NJ",-74.063457,40.902885],["Midland Park","NJ",-74.141262,40.995809],["Montclair State University","NJ",-74.198359,40.865917],["Montvale","NJ",-74.047298,41.054594],["Moonachie","NJ",-74.057671,40.841334],["Newark","NJ",-74.172574,40.72422],["New Milford","NJ",-74.019453,40.934161],["North Arlington","NJ",-74.12622,40.786256],["North Caldwell","NJ",-74.259996,40.8645],["North Haledon","NJ",-74.185281,40.963618],["Northvale","NJ",-73.948553,41.012874],["Norwood","NJ",-73.950551,40.992046],["Oakland","NJ",-74.240502,41.031022],["Old Tappan","NJ",-73.984223,41.023305],["Oradell","NJ",-74.032862,40.956653],["Packanack Lake","NJ",-74.255839,40.938537],["Palisades Park","NJ",-73.997061,40.847017],["Paramus","NJ",-74.070169,40.947299],["Park Ridge","NJ",-74.044293,41.036183],["Passaic","NJ",-74.129089,40.857552],["Paterson","NJ",-74.162829,40.914766],["Perth Amboy","NJ",-74.271331,40.52016],["Pines Lake","NJ",-74.263775,40.998672],["Pleasantdale","NJ",-74.274636,40.804002],["Pompton Lakes","NJ",-74.286742,41.002734],["Port Reading","NJ",-74.244933,40.567422],["Preakness","NJ",-74.224894,40.93821],["Prospect Park","NJ",-74.174088,40.941559],["Rahway","NJ",-74.280531,40.607152],["Ramapo College of New Jersey","NJ",-74.17412,41.08082],["Ramsey","NJ",-74.146996,41.061325],["Ridgefield","NJ",-74.014088,40.832677],["Ridgefield Park","NJ",-74.019926,40.854705],["Ridgewood","NJ",-74.113506,40.981591],["Ringwood","NJ",-74.271138,41.103963],["River Edge","NJ",-74.037468,40.926766],["Rockleigh","NJ",-73.934068,41.000241],["Roselle","NJ",-74.260158,40.652211],["Roselle Park","NJ",-74.266558,40.665309],["Rutherford","NJ",-74.106041,40.820314],["Saddle River","NJ",-74.092553,41.023696],["Secaucus","NJ",-74.067649,40.781958],["Sewaren","NJ",-74.255175,40.548849],["Silver Lake","NJ",-74.182815,40.780435],["Singac","NJ",-74.242912,40.884938],["South Amboy","NJ",-74.279133,40.488533],["Tenafly","NJ",-73.950523,40.918309],["Teterboro","NJ",-74.059619,40.854573],["Totowa","NJ",-74.219779,40.903415],["Union","NJ",-74.269291,40.696539],["Union City","NJ",-74.032279,40.767425],["Upper Montclair","NJ",-74.201302,40.842576],["Upper Saddle River","NJ",-74.099973,41.063162],["Vauxhall","NJ",-74.283782,40.717383],["Waldwick","NJ",-74.125217,41.013367],["Wallington","NJ",-74.106323,40.853084],["Wanaque","NJ",-74.288643,41.042424],["Watsessing","NJ",-74.201159,40.786567],["West New York","NJ",-74.009507,40.786032],["Westwood","NJ",-74.031872,40.989032],["William Paterson University of New Jersey","NJ",-74.198218,40.945824],["Woodbridge","NJ",-74.286939,40.552857],["Woodcliff Lake","NJ",-74.061061,41.025977],["Woodland Park","NJ",-74.194356,40.889855],["Wood-Ridge","NJ",-74.087068,40.850183],["Airmont","NY",-74.097916,41.099156],["Albertson","NY",-73.648155,40.771589],["Amagansett","NY",-72.130131,40.983382],["Amityville","NY",-73.415787,40.669844],["Aquebogue","NY",-72.615397,40.944013],["Ardsley","NY",-73.839289,41.013479],["Armonk","NY",-73.719279,41.133462],["Asharoken","NY",-73.38506,40.93927],["Atlantic Beach","NY",-73.725097,40.586057],["Babylon","NY",-73.326,40.693679],["Baiting Hollow","NY",-72.744252,40.962793],["Baldwin","NY",-73.607709,40.650127],["Bardonia","NY",-73.979297,41.113952],["Barnum Island","NY",-73.643134,40.604916],["Baxter Estates","NY",-73.694759,40.833771],["Bay Park","NY",-73.668521,40.631817],["Bayport","NY",-73.056388,40.745984],["Bay Shore","NY",-73.250141,40.729377],["Bayville","NY",-73.561166,40.907257],["Baywood","NY",-73.289926,40.753354],["Beaver Dam Lake","NY",-74.125929,41.43896],["Bedford","NY",-73.657377,41.186863],["Bedford Hills","NY",-73.688149,41.240568],["Bellerose","NY",-73.716674,40.724275],["Bellerose Terrace","NY",-73.725159,40.722147],["Belle Terre","NY",-73.067274,40.960698],["Bellmore","NY",-73.526597,40.660239],["Bellport","NY",-72.941325,40.75095],["Bethpage","NY",-73.485536,40.749517],["Blauvelt","NY",-73.954937,41.068236],["Blue Point","NY",-73.035015,40.751642],["Bohemia","NY",-73.13509,40.777011],["Brentwood","NY",-73.252235,40.783918],["Brewster","NY",-73.616269,41.396162],["Brewster Heights","NY",-73.628568,41.407277],["Brewster Hill","NY",-73.606864,41.421304],["Briarcliff Manor","NY",-73.847504,41.140333],["Bridgehampton","NY",-72.305709,40.941131],["Brightwaters","NY",-73.261514,40.716435],["Bronxville","NY",-73.82644,40.939493],["Brookhaven","NY",-72.907833,40.776671],["Brookville","NY",-73.570122,40.807912],["Buchanan","NY",-73.944966,41.263168],["Calverton","NY",-72.77337,40.91994],["Captree","NY",-73.257051,40.646074],["Carle Place","NY",-73.612367,40.749895],["Carmel","NY",-73.684986,41.402995],["Cedarhurst","NY",-73.727831,40.625202],["Centereach","NY",-73.082104,40.868067],["Center Moriches","NY",-72.796524,40.799313],["Centerport","NY",-73.371427,40.902425],["Central Islip","NY",-73.194475,40.783589],["Centre Island","NY",-73.521919,40.898546],["Chappaqua","NY",-73.768268,41.155922],["Chester","NY",-74.276921,41.356942],["Chestnut Ridge","NY",-74.048071,41.084908],["Cold Spring","NY",-73.954745,41.419238],["Cold Spring Harbor","NY",-73.456406,40.864322],["Commack","NY",-73.283336,40.843449],["Congers","NY",-73.946371,41.149122],["Copiague","NY",-73.392761,40.670358],["Coram","NY",-73.005882,40.881236],["Cornwall-on-Hudson","NY",-74.015145,41.433521],["Cove Neck","NY",-73.497304,40.885781],["Crompond","NY",-73.839963,41.295265],["Croton-on-Hudson","NY",-73.901152,41.209652],["Crugers","NY",-73.92581,41.231337],["Cutchogue","NY",-72.486958,41.021223],["Deer Park","NY",-73.321736,40.761441],["Dering Harbor","NY",-72.341328,41.092177],["Dix Hills","NY",-73.337459,40.803322],["Dobbs Ferry","NY",-73.868636,41.009994],["East Atlantic Beach","NY",-73.712204,40.585582],["Eastchester","NY",-73.807489,40.958347],["East Farmingdale","NY",-73.411368,40.736657],["East Hampton","NY",-72.196094,40.951543],["East Hampton North","NY",-72.189126,40.972767],["East Hills","NY",-73.629176,40.795841],["East Islip","NY",-73.187346,40.726249],["East Marion","NY",-72.33516,41.135271],["East Massapequa","NY",-73.437058,40.676236],["East Meadow","NY",-73.558861,40.720115],["East Moriches","NY",-72.756601,40.808772],["East Northport","NY",-73.323244,40.879131],["East Norwich","NY",-73.528852,40.849523],["East Patchogue","NY",-72.981772,40.770031],["Eastport","NY",-72.735052,40.83508],["East Quogue","NY",-72.575354,40.845851],["East Rockaway","NY",-73.66713,40.643804],["East Setauket","NY",-73.093714,40.920966],["East Shoreham","NY",-72.875352,40.950232],["East Williston","NY",-73.633607,40.76085],["Eatons Neck","NY",-73.401771,40.930969],["Elmont","NY",-73.706166,40.699176],["Elmsford","NY",-73.814325,41.054114],["Elwood","NY",-73.338874,40.846198],["Fairview","NY",-73.795952,41.04419],["Farmingdale","NY",-73.446759,40.732808],["Farmingville","NY",-73.040463,40.838978],["Fire Island","NY",-73.203314,40.637097],["Firthcliffe","NY",-74.033072,41.442048],["Fishers Island","NY",-71.992796,41.267681],["Flanders","NY",-72.604235,40.888755],["Floral Park","NY",-73.702824,40.721952],["Flower Hill","NY",-73.675568,40.807495],["Fort Montgomery","NY",-73.98718,41.342865],["Fort Salonga","NY",-73.295587,40.911413],["Franklin Square","NY",-73.677478,40.700193],["Freeport","NY",-73.584575,40.650851],["Garden City","NY",-73.645398,40.725756],["Garden City Park","NY",-73.663307,40.74293],["Garden City South","NY",-73.660475,40.712153],["Gilgo","NY",-73.383775,40.636151],["Glen Cove","NY",-73.644781,40.884756],["Glen Head","NY",-73.618018,40.844918],["Glenwood Landing","NY",-73.637736,40.829451],["Golden's Bridge","NY",-73.670416,41.290172],["Gordon Heights","NY",-72.962088,40.863647],["Grand View-on-Hudson","NY",-73.9209,41.062889],["Great Neck","NY",-73.733099,40.802368],["Great Neck Estates","NY",-73.740167,40.786476],["Great Neck Gardens","NY",-73.722465,40.796953],["Great Neck Plaza","NY",-73.726155,40.786913],["Great River","NY",-73.176039,40.713454],["Greenlawn","NY",-73.365754,40.863515],["Greenport","NY",-72.366763,41.102428],["Greenport West","NY",-72.384584,41.090168],["Greenvale","NY",-73.626327,40.811957],["Greenville","NY",-73.818977,40.998643],["Greenwood Lake","NY",-74.287578,41.221103],["Halesite","NY",-73.412514,40.886284],["Hampton Bays","NY",-72.518104,40.864652],["Harbor Hills","NY",-73.749019,40.788588],["Harbor Isle","NY",-73.66472,40.602508],["Harriman","NY",-74.144094,41.309057],["Harrison","NY",-73.719283,41.023538],["Hartsdale","NY",-73.803641,41.015434],["Hastings-on-Hudson","NY",-73.881236,40.988041],["Hauppauge","NY",-73.210701,40.822351],["Haverstraw","NY",-73.943331,41.178245],["Hawthorne","NY",-73.796912,41.103433],["Head of the Harbor","NY",-73.161536,40.897658],["Hempstead","NY",-73.619445,40.704374],["Heritage Hills","NY",-73.700677,41.339661],["Herricks","NY",-73.663492,40.756682],["Hewlett","NY",-73.694393,40.641996],["Hewlett Bay Park","NY",-73.695824,40.63512],["Hewlett Harbor","NY",-73.685898,40.633619],["Hewlett Neck","NY",-73.697082,40.624763],["Hicksville","NY",-73.524806,40.764136],["Highland Falls","NY",-73.968924,41.364565],["Hillburn","NY",-74.170503,41.127177],["Hillcrest","NY",-74.035011,41.129814],["Holbrook","NY",-73.070022,40.794373],["Holtsville","NY",-73.044653,40.812373],["Huntington","NY",-73.405761,40.875389],["Huntington Bay","NY",-73.412127,40.903556],["Huntington Station","NY",-73.404812,40.844488],["Inwood","NY",-73.75699,40.621346],["Irvington","NY",-73.867028,41.034258],["Islandia","NY",-73.171084,40.806862],["Island Park","NY",-73.6553,40.605221],["Islip","NY",-73.216113,40.730319],["Islip Terrace","NY",-73.186889,40.750269],["Jamesport","NY",-72.583173,40.960967],["Jefferson Valley-Yorktown","NY",-73.799864,41.318669],["Jericho","NY",-73.541615,40.787447],["Kaser","NY",-74.068575,41.121257],["Katonah","NY",-73.685185,41.255069],["Kensington","NY",-73.722242,40.793077],["Kings Park","NY",-73.245571,40.886964],["Kings Point","NY",-73.73932,40.817892],["Kiryas Joel","NY",-74.167274,41.340667],["Lake Carmel","NY",-73.663331,41.462746],["Lake Grove","NY",-73.116844,40.857817],["Lake Mohegan","NY",-73.848057,41.318803],["Lake Ronkonkoma","NY",-73.113298,40.830318],["Lake Success","NY",-73.711112,40.763883],["Lakeview","NY",-73.649718,40.677732],["Larchmont","NY",-73.75196,40.925961],["Lattingtown","NY",-73.595343,40.89464],["Laurel","NY",-72.554532,40.972918],["Laurel Hollow","NY",-73.477542,40.8567],["Lawrence","NY",-73.714434,40.602924],["Levittown","NY",-73.512709,40.72399],["Lido Beach","NY",-73.604318,40.589098],["Lincolndale","NY",-73.726698,41.335321],["Lindenhurst","NY",-73.371594,40.685751],["Lloyd Harbor","NY",-73.443386,40.921496],["Locust Valley","NY",-73.589333,40.878083],["Long Beach","NY",-73.665403,40.585835],["Lynbrook","NY",-73.674199,40.657883],["Mahopac","NY",-73.74069,41.369734],["Malverne","NY",-73.672101,40.674541],["Malverne Park Oaks","NY",-73.664414,40.681655],["Mamaroneck","NY",-73.726138,40.936452],["Manhasset","NY",-73.694879,40.784977],["Manhasset Hills","NY",-73.68087,40.759137],["Manorhaven","NY",-73.710825,40.83885],["Manorville","NY",-72.787521,40.862328],["Massapequa","NY",-73.471515,40.668302],["Massapequa Park","NY",-73.449689,40.680909],["Mastic","NY",-72.847986,40.809653],["Mastic Beach","NY",-72.836722,40.765722],["Matinecock","NY",-73.580472,40.859352],["Mattituck","NY",-72.543521,41.007298],["Maybrook","NY",-74.213498,41.488335],["Medford","NY",-72.985918,40.821979],["Melville","NY",-73.408824,40.782357],["Merrick","NY",-73.552013,40.653175],["Middle Island","NY",-72.951175,40.892509],["Miller Place","NY",-72.993342,40.943115],["Mill Neck","NY",-73.558968,40.882132],["Millwood","NY",-73.793047,41.202753],["Mineola","NY",-73.639363,40.747026],["Monroe","NY",-74.185748,41.317698],["Monsey","NY",-74.076972,41.109477],["Montauk","NY",-71.946369,41.047538],["Montebello","NY",-74.110078,41.130795],["Montrose","NY",-73.943837,41.238901],["Moriches","NY",-72.826992,40.805414],["Mountain Lodge Park","NY",-74.141761,41.386534],["Mount Ivy","NY",-74.029579,41.192669],["Mount Kisco","NY",-73.728258,41.201696],["Mount Sinai","NY",-73.020242,40.94178],["Mount Vernon","NY",-73.829317,40.913105],["Munsey Park","NY",-73.67985,40.798993],["Muttontown","NY",-73.536338,40.825394],["Nanuet","NY",-74.015879,41.095478],["Napeague","NY",-72.06422,40.99847],["Nelsonville","NY",-73.949914,41.429474],["Nesconset","NY",-73.152008,40.846855],["New Cassel","NY",-73.564934,40.760202],["New City","NY",-73.990426,41.152205],["New Hempstead","NY",-74.051034,41.145709],["New Hyde Park","NY",-73.685864,40.732273],["New Rochelle","NY",-73.779344,40.923243],["New Square","NY",-74.029362,41.141022],["New Suffolk","NY",-72.477472,40.996754],["New Windsor","NY",-74.031832,41.46983],["New York","NY",-73.938677,40.662712],["Nissequogue","NY",-73.186246,40.902716],["North Amityville","NY",-73.411884,40.700525],["Northampton","NY",-72.684077,40.875159],["North Babylon","NY",-73.32493,40.731454],["North Bay Shore","NY",-73.261674,40.760191],["North Bellmore","NY",-73.539016,40.690346],["North Bellport","NY",-72.94568,40.786816],["North Great River","NY",-73.163061,40.756157],["North Haven","NY",-72.313997,41.023263],["North Hills","NY",-73.677847,40.77645],["North Lindenhurst","NY",-73.385968,40.707221],["North Lynbrook","NY",-73.673588,40.668563],["North Massapequa","NY",-73.469122,40.703007],["North Merrick","NY",-73.560577,40.688369],["North New Hyde Park","NY",-73.687775,40.745753],["North Patchogue","NY",-73.023889,40.784034],["Northport","NY",-73.344968,40.904045],["North Sea","NY",-72.40604,40.931543],["North Valley Stream","NY",-73.708077,40.684262],["Northville","NY",-72.630246,40.975572],["North Wantagh","NY",-73.51636,40.693878],["Northwest Harbor","NY",-72.220394,41.013774],["Noyack","NY",-72.346015,40.978706],["Nyack","NY",-73.915236,41.09295],["Oak Beach","NY",-73.276481,40.638582],["Oakdale","NY",-73.134698,40.737782],["Ocean Beach","NY",-73.156523,40.646286],["Oceanside","NY",-73.637701,40.63302],["Old Bethpage","NY",-73.458396,40.750823],["Old Brookville","NY",-73.605108,40.83647],["Old Field","NY",-73.131044,40.966673],["Old Westbury","NY",-73.597508,40.786543],["Orangeburg","NY",-73.940763,41.048729],["Orient","NY",-72.249384,41.148888],["Ossining","NY",-73.870587,41.15349],["Oyster Bay","NY",-73.531053,40.868057],["Oyster Bay Cove","NY",-73.505379,40.860496],["Patchogue","NY",-73.019773,40.76371],["Peach Lake","NY",-73.576945,41.370537],["Pearl River","NY",-74.007832,41.061561],["Peconic","NY",-72.464419,41.039067],["Peekskill","NY",-73.923597,41.287396],["Pelham","NY",-73.807704,40.91108],["Pelham Manor","NY",-73.805928,40.893068],["Piermont","NY",-73.910831,41.041851],["Plainedge","NY",-73.476993,40.724009],["Plainview","NY",-73.473118,40.781771],["Plandome","NY",-73.70163,40.806579],["Plandome Heights","NY",-73.704901,40.802072],["Plandome Manor","NY",-73.698699,40.812909],["Pleasantville","NY",-73.78415,41.134006],["Point Lookout","NY",-73.57941,40.590634],["Pomona","NY",-74.054249,41.189153],["Poquott","NY",-73.090877,40.953044],["Port Chester","NY",-73.667175,41.004701],["Port Jefferson","NY",-73.052799,40.942177],["Port Jefferson Station","NY",-73.065186,40.925939],["Port Washington","NY",-73.680008,40.827452],["Port Washington North","NY",-73.700058,40.843047],["Putnam Lake","NY",-73.550487,41.474265],["Quiogue","NY",-72.62815,40.819696],["Quogue","NY",-72.598903,40.821406],["Remsenburg-Speonk","NY",-72.705765,40.816233],["Ridge","NY",-72.88588,40.903814],["Riverhead","NY",-72.676056,40.951315],["Riverside","NY",-72.671719,40.905087],["Rockville Centre","NY",-73.638048,40.664024],["Rocky Point","NY",-72.936301,40.939825],["Ronkonkoma","NY",-73.124548,40.803529],["Roosevelt","NY",-73.583372,40.679422],["Roslyn","NY",-73.650424,40.799816],["Roslyn Estates","NY",-73.661217,40.793672],["Roslyn Harbor","NY",-73.640582,40.811234],["Roslyn Heights","NY",-73.639593,40.778746],["Russell Gardens","NY",-73.725451,40.780892],["Rye","NY",-73.686374,40.944738],["Rye Brook","NY",-73.686354,41.030003],["Saddle Rock","NY",-73.749278,40.79438],["Saddle Rock Estates","NY",-73.741499,40.793949],["Sagaponack","NY",-72.268719,40.930895],["Sag Harbor","NY",-72.288503,40.994274],["St. James","NY",-73.152102,40.876403],["Salisbury","NY",-73.56033,40.745822],["Salisbury Mills","NY",-74.106275,41.432322],["Saltaire","NY",-73.194717,40.638072],["Sands Point","NY",-73.703586,40.85343],["Sayville","NY",-73.085232,40.747588],["Scarsdale","NY",-73.777201,40.993614],["Scotts Corners","NY",-73.556069,41.188877],["Sea Cliff","NY",-73.65043,40.846158],["Seaford","NY",-73.49264,40.66624],["Searingtown","NY",-73.660335,40.77047],["Selden","NY",-73.046615,40.871444],["Setauket","NY",-73.115085,40.948859],["Shelter Island","NY",-72.297129,41.05532],["Shelter Island Heights","NY",-72.360384,41.055473],["Shenorock","NY",-73.740602,41.330959],["Shinnecock Hills","NY",-72.452751,40.888612],["Shirley","NY",-72.875911,40.793602],["Shoreham","NY",-72.907054,40.957097],["Shrub Oak","NY",-73.82989,41.327335],["Sleepy Hollow","NY",-73.869641,41.097514],["Sloatsburg","NY",-74.190873,41.162046],["Smithtown","NY",-73.21667,40.857482],["Sound Beach","NY",-72.970764,40.96286],["Southampton","NY",-72.403089,40.876617],["South Blooming Grove","NY",-74.16703,41.373695],["South Farmingdale","NY",-73.448606,40.716886],["South Floral Park","NY",-73.700442,40.713507],["South Hempstead","NY",-73.623334,40.68134],["South Huntington","NY",-73.392162,40.822505],["Southold","NY",-72.429783,41.065368],["South Valley Stream","NY",-73.718538,40.655792],["Sparkill","NY",-73.933284,41.028907],["Springs","NY",-72.159656,41.03112],["Spring Valley","NY",-74.048712,41.114567],["Stewart Manor","NY",-73.685412,40.720118],["Stony Brook","NY",-73.127479,40.907804],["Stony Brook University","NY",-73.121696,40.909812],["Stony Point","NY",-73.997646,41.229379],["Suffern","NY",-74.141382,41.111983],["Syosset","NY",-73.502025,40.815682],["Tappan","NY",-73.951396,41.025541],["Tarrytown","NY",-73.866257,41.065205],["Terryville","NY",-73.048662,40.909259],["Thiells","NY",-74.012659,41.204445],["Thomaston","NY",-73.715158,40.78752],["Thornwood","NY",-73.779477,41.118374],["Tuckahoe","NY",-72.435547,40.903533],["Tuckahoe","NY",-73.822944,40.953147],["Tuxedo","NY",-74.171688,41.242006],["Tuxedo Park","NY",-74.210391,41.197024],["Uniondale","NY",-73.594656,40.717593],["University Gardens","NY",-73.727922,40.775089],["Upper Brookville","NY",-73.562901,40.847499],["Upper Nyack","NY",-73.91078,41.120954],["Vails Gate","NY",-74.053247,41.458923],["Valhalla","NY",-73.777916,41.077528],["Valley Cottage","NY",-73.943534,41.115486],["Valley Stream","NY",-73.704902,40.664747],["Verplanck","NY",-73.961153,41.254253],["Village of the Branch","NY",-73.18223,40.853368],["Viola","NY",-74.083415,41.126135],["Wading River","NY",-72.814925,40.95358],["Wainscott","NY",-72.255312,40.954784],["Walton Park","NY",-74.225079,41.313967],["Wantagh","NY",-73.510464,40.667859],["Washingtonville","NY",-74.158574,41.428481],["Water Mill","NY",-72.350704,40.922393],["Wesley Hills","NY",-74.079012,41.157577],["West Babylon","NY",-73.359727,40.712417],["West Bay Shore","NY",-73.260107,40.70167],["Westbury","NY",-73.589185,40.75988],["Westhampton","NY",-72.659916,40.846782],["Westhampton Beach","NY",-72.645072,40.806972],["West Hampton Dunes","NY",-72.706733,40.77877],["West Haverstraw","NY",-73.986782,41.206306],["West Hempstead","NY",-73.650454,40.695816],["West Hills","NY",-73.433923,40.819938],["West Islip","NY",-73.295526,40.702861],["West Nyack","NY",-73.968833,41.09114],["West Point","NY",-74.019749,41.360729],["West Sayville","NY",-73.1052,40.729739],["Wheatley Heights","NY",-73.370558,40.762408],["White Plains","NY",-73.751048,41.0238],["Williston Park","NY",-73.646588,40.758756],["Woodbury","NY",-73.47245,40.820208],["Woodbury","NY",-74.102111,41.327541],["Woodmere","NY",-73.721186,40.637358],["Woodsburgh","NY",-73.706215,40.621197],["Wyandanch","NY",-73.363525,40.749143],["Yaphank","NY",-72.93165,40.83101],["Yonkers","NY",-73.867446,40.945862],["Yorktown Heights","NY",-73.774708,41.270592],["Ashaway","RI",-71.786214,41.428019],["Bradford","RI",-71.764416,41.388997],["Hopkinton","RI",-71.781088,41.466945],["Misquamicut","RI",-71.827067,41.320087],["Quonochontaug","RI",-71.704659,41.345082],["Watch Hill","RI",-71.846809,41.315381],["Weekapaug","RI",-71.761921,41.337424],["Westerly","RI",-71.806783,41.373301]];

  function presentDayLocation(site = {}) {
    if (site.slug === "whaling") return "(Present Day Atlantic Ocean, off Long Island, NY)";
    if (site.slug === "rapahamuck") return "(Present Day Flanders, NY)";
    const address = String(site.present_day_location || site.address_label || "").trim();
    if (address && !isCoordinateOnlyLabel(address)) return "(Present Day " + address.replace(/^Present[ -]Day\s+/i, "") + ")";
    const geometry = site.display_geojson || site.displayGeometry || site.geojson;
    const coordinates = [];
    function collect(value) {
      if (!Array.isArray(value)) return;
      if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") coordinates.push(value);
      else value.forEach(collect);
    }
    collect(geometry?.coordinates);
    if (!coordinates.length && Array.isArray(site.center)) collect(site.center);
    if (!coordinates.length) return "";
    const west = Math.min(...coordinates.map(p => p[0])), east = Math.max(...coordinates.map(p => p[0]));
    const south = Math.min(...coordinates.map(p => p[1])), north = Math.max(...coordinates.map(p => p[1]));
    const longitude = (west + east) / 2, latitude = (south + north) / 2;
    // Broad territories need regional context, not a single hamlet at their center.
    if (isBroadTerritory(site) || east - west > 0.3 || north - south > 0.2) {
      if (west >= -74.05 && east <= -71.8 && south >= 40.5 && north <= 41.2) return "(Present Day Long Island, NY)";
      return "";
    }
    let nearest = null, distance = Infinity;
    for (const place of MODERN_PLACES) {
      const km = Math.hypot((place[2] - longitude) * 84, (place[3] - latitude) * 111);
      if (km < distance) { nearest = place; distance = km; }
    }
    return nearest && distance <= 20 ? "(Present Day near " + nearest[0] + ", " + nearest[1] + ")" : "";
  }

  function siteSubtitle(site, options = {}) {
    const fallback = options.fallback || "Long Island";
    if (!site) return fallback;
    const typeLabel = siteDisplayType(site, options);
    if (typeLabel) return typeLabel;
    const address = String(site.address_label || "").trim();
    if (address && !isCoordinateOnlyLabel(address)) return address;
    return fallback;
  }

  function isBroadTerritory(site, options = {}) {
    const slug = String(site?.slug || site?.directus_site_slug || "").trim().toLowerCase();
    if (slug) return BROAD_TERRITORY_SLUGS.has(slug);
    const normalize = options.normalizeText || normalizeText;
    const title = normalize(site?.title || "");
    const type = normalize(site?.site_type || "");
    if (options.matchAnyAncestral) {
      return /territory|ancestral|traditional/.test(type) || /ancestral land|traditional land/.test(title);
    }
    return /territory|ancestral land|traditional land/.test(`${title} ${type}`);
  }

  function siteIsAlgonquianPlaceName(site, options = {}) {
    if (Array.isArray(site?.precomputed_category_tags)) {
      return site.precomputed_category_tags.some(tag => tag?.key === "theme:algonquian-place-name");
    }
    const excludedSlugs = new Set(options.excludedSlugs || ["amagansett-indian-well"]);
    if (excludedSlugs.has(String(site?.slug || ""))) return false;
    const isBroad = typeof options.isBroadTerritory === "function"
      ? options.isBroadTerritory(site)
      : isBroadTerritory(site, options);
    if (isBroad) return false;
    const rawType = String(site?.site_type || "").trim();
    if (/^place[_ -]?name$|^placename$/i.test(rawType)) return true;
    const normalize = options.normalizeText || normalizeText;
    const text = normalize([
      site?.title,
      site?.summary,
      site?.introduction_content,
      site?.history_content,
      site?.translation_content
    ].join(" "));
    if (!text) return false;
    return /\btooker(?:'s)?\s+(?:recorded\s+)?(?:indigenous\s+|native\s+|algonquian\s+)?place-?name\b/.test(text) ||
      /\bwilliam wallace tooker\b.{0,120}\b(?:place-?name|name for|records?|recorded|connects?|links?)\b/.test(text) ||
      /\brecorded indigenous place-?name\b/.test(text) ||
      /\b(?:is|was)\s+(?:a|an)\s+(?:[^.]{0,70}\s)?(?:algonquian|indigenous|native-language)\s+place-?name\b/.test(text) ||
      /\b(?:is|was)\s+(?:a|an)\s+(?:[^.]{0,70}\s)?place-?name\s+(?:recorded|connected|associated|interpreted)\b/.test(text);
  }

  function siteCategoryTags(site, options = {}) {
    if (!site) return [];
    if (Array.isArray(site.precomputed_category_tags) && site.precomputed_category_tags.length) {
      return site.precomputed_category_tags
        .filter(tag => tag?.key && tag?.label)
        .map(tag => ({ key: String(tag.key), label: String(tag.label) }));
    }
    const normalize = options.normalizeText || normalizeText;
    const tags = new Map();
    const labels = new Set();
    const addTag = (key, label) => {
      const cleanKey = String(key || "").trim();
      const cleanLabel = String(label || "").trim();
      const labelKey = normalize(cleanLabel);
      if (cleanKey && cleanLabel && !tags.has(cleanKey) && !labels.has(labelKey)) {
        tags.set(cleanKey, cleanLabel);
        labels.add(labelKey);
      }
    };
    const rawType = String(site.site_type || "").trim();
    const useDisplayType = options.typeMode === "display";
    const typeLabel = useDisplayType ? siteDisplayType(site, options) : rawType;
    const normalizedRawType = normalize(rawType).replace(/\s+/g, "-");
    if (typeLabel) {
      const normalizedType = useDisplayType ? normalize(typeLabel).replace(/\s+/g, "-") : normalizedRawType;
      const excludedType = /^(place-name|placename|historic-site|historical-site|historicsite|historicalsite|site|map-pin|pin)$/.test(normalizedType);
      if (!excludedType) {
        addTag(`type:${normalizedType}`, useDisplayType ? typeLabel : titleCaseSiteType(rawType));
      }
    }
    const text = normalize([site.title, site.summary, site.introduction_content, site.history_content].join(" "));
    const typeText = normalize(rawType).replace(/[^a-z0-9]+/g, " ");
    const broad = typeof options.isBroadTerritory === "function"
      ? options.isBroadTerritory(site)
      : isBroadTerritory(site, options);
    if (broad) addTag("theme:ancestral-territory", "Ancestral Territory");
    const algonquian = typeof options.isAlgonquianPlaceName === "function"
      ? options.isAlgonquianPlaceName(site)
      : siteIsAlgonquianPlaceName(site, { ...options, isBroadTerritory: () => broad });
    if (algonquian) addTag("theme:algonquian-place-name", "Algonquian Place Name");
    if (/\b(deed|deeds|patent|patents|treaty|treaties|court|document|documents|archive|archives|land record|land records|town record|town records|colonial record|colonial records)\b/.test(typeText) ||
      /\b(deed|deeds|patent|patents|treaty|treaties|court case|court cases|colonial document|colonial documents|land record|land records|town record|town records|archival record|archival records|records and deeds)\b/.test(text)) {
      addTag("theme:records", "Records and Deeds");
    }
    if (/water|river|bay|pond|harbor|inlet|shore|beach|fish|whal|shellfish/.test(text)) addTag("theme:water", "Water and Shore");
    if (/whaling|powwow|ceremony|spiritual|cosmology|ritual|tradition|cultural practice|wampum|food/.test(text)) addTag("theme:cultural-practices", "Cultural Practices");
    if (isExhibitSite(site)) addTag("theme:exhibits", "Exhibits and Art");
    return [...tags.entries()].slice(0, 5).map(([key, label]) => ({ key, label }));
  }

  const SITE_LAYER_CATEGORIES = [
    { key: "shell-middens", label: "Shell Middens" },
    { key: "fishing-sites", label: "Fishing Sites" },
    { key: "whaling-sites", label: "Whaling Sites" },
    { key: "burial-sacred", label: "Sacred Sites" },
    { key: "villages-settlements", label: "Villages" },
    { key: "trails-routes", label: "Trails" },
    { key: "waterways-coastal", label: "Waterways" },
    { key: "place-names", label: "Place Names" },
    { key: "islands", label: "Islands" },
    { key: "marshes-wetlands", label: "Wetlands" },
    { key: "town-area-place-names", label: "Town and Area Names" },
    { key: "polygons", label: "Area Overlays" },
    { key: "approximate-locations", label: "Approximate" },
    { key: "precise-locations", label: "Precise" }
  ];

  function siteLayerText(site = {}) {
    return normalizeText([
      site.title,
      site.slug,
      site.site_type,
      site.summary,
      site.address_label,
      site.introduction_content,
      site.history_content,
      site.translation_content,
      site.ancestral_territory_note
    ].join(" "));
  }

  function siteLocationAccuracy(site = {}) {
    if (siteUsesDefaultBluePin(site)) return "approximate";
    const text = siteLayerText(site);
    const status = normalizeText(site.geometry_cleanup_status || "");
    const surface = normalizeText(site.geometry_surface || "");
    if (/\b(approximate|general|broad|near|area|landscape|not precise|public safe|public-safe)\b/.test(text)) return "approximate";
    if (/approx|broad|mixed|needs review|pending/.test(`${status} ${surface}`)) return "approximate";
    if (site.display_geojson && !site.geojson) return "approximate";
    return "precise";
  }

  function siteLayerCategoryKeys(site = {}) {
    if (Array.isArray(site.precomputed_layer_category_keys) && site.precomputed_layer_category_keys.length) {
      return [...new Set(site.precomputed_layer_category_keys.filter(Boolean))];
    }
    const text = siteLayerText(site);
    const rawType = normalizeText(site.site_type || "");
    const title = normalizeText(site.title || "");
    const keys = new Set();
    const add = key => keys.add(key);
    if (/\bshell\s*(midden|heap|deposit|bed)|midden|shellfish|oyster|clam\b/.test(text)) add("shell-middens");
    if (/\bfish|fishing|fishery|eel|weir|net|brook|creek|pond|bay|harbor|inlet\b/.test(text)) add("fishing-sites");
    if (/\bwhal|whaling|whale\b/.test(text)) add("whaling-sites");
    if (/\bburial|burial site|cemetery|grave|sacred|ceremonial|spiritual|council rock|ritual\b/.test(text) || /burial|sacred/.test(rawType)) add("burial-sacred");
    if (/\bvillage|settlement|camp|wigwam|fort|reservation|community|neighborhood\b/.test(text) || /village|settlement|reservation/.test(rawType)) add("villages-settlements");
    if (/\btrail|path|route|road|travel|portage|crossing|neck|landing\b/.test(text)) add("trails-routes");
    if (/\bwater|river|bay|pond|harbor|inlet|shore|beach|coast|coastal|creek|brook|spring|well|island|neck|marsh|meadow\b/.test(text)) add("waterways-coastal");
    if (siteIsAlgonquianPlaceName(site)) add("place-names");
    if (/\bisland\b/.test(text)) add("islands");
    if (/\bmarsh|meadow|wetland|swamp|bog\b/.test(text)) add("marshes-wetlands");
    if (/\btown|township|hamlet|village|district|neighborhood|community|area\b/.test(text)) add("town-area-place-names");
    if (/Polygon/.test(site.geojson?.type || site.display_geojson?.type || "")) add("polygons");
    if (siteLocationAccuracy(site) === "approximate") add("approximate-locations");
    else add("precise-locations");
    if (isExhibitSite(site)) add("exhibits");
    if (title.includes("ma s house") || title.includes("mas house") || title.includes("preservation long island")) add("exhibits");
    return [...keys];
  }

  function layerFilterSetFromInputs(inputs = [], isActive = input => input?.checked !== false) {
    return new Set(
      (inputs || [])
        .filter(input => input && isActive(input))
        .map(input => input.value)
        .filter(Boolean)
    );
  }

  function passesLayerCategoryFilters(keys = [], active = new Set(), totalCount = 0) {
    const values = [...new Set((keys || []).filter(Boolean))];
    if (active.size >= totalCount) return true;
    if (!active.size) return false;
    if (!values.length) return true;
    return values.some(key => active.has(key));
  }

  function featureVisibleInPrimaryLayers(geometryType = "", options = {}) {
    const isPoint = geometryType === "Point";
    const isPolygon = geometryType === "Polygon" || geometryType === "MultiPolygon";
    const isExhibit = options.isExhibit === true;
    const exhibitsOn = options.exhibitsOn !== false;
    const pinsOn = options.pinsOn !== false;
    const shapesOn = options.shapesOn !== false;
    if (isExhibit && !exhibitsOn) return false;
    if (isPoint) return pinsOn || (isExhibit && exhibitsOn);
    if (isPolygon) return shapesOn || (isExhibit && exhibitsOn);
    return pinsOn || shapesOn || (isExhibit && exhibitsOn);
  }

  function isExhibitSite(site = {}) {
    if (siteUsesDefaultBluePin(site)) return false;
    const text = siteLayerText(site);
    const rawType = normalizeText(site.site_type || "");
    return /^(exhibit|exhibit supporter|museum|gallery|public art|cultural center|heritage center|house museum|preservation)$/.test(rawType) ||
      /\b(museum|gallery|exhibit|exhibition|public art|art center|cultural center|heritage center|house museum|ma s house|mas house|preservation long island)\b/.test(text);
  }

  function siteTerritoryFillColor(site = {}, fallback = "#496f5d", options = {}) {
    const overrides = options.overrides || {};
    const slug = String(site?.slug || "");
    if (slug && overrides[slug]) return overrides[slug];
    const normalizeHex = options.normalizeHex || window.NLI_GEOMETRY_UTILS?.normalizeHex || normalizeHexColor;
    return normalizeHex(site?.map_fill_color, fallback);
  }

  window.NLI_SITE_UTILS = {
    checkinHistoryDescription,
    isCoordinateOnlyLabel,
    titleCaseSiteType,
    siteDisplayType,
    siteSubtitle,
    presentDayLocation,
    isBroadTerritory,
    siteIsAlgonquianPlaceName,
    siteCategoryTags,
    SITE_LAYER_CATEGORIES,
    siteLayerCategoryKeys,
    layerFilterSetFromInputs,
    passesLayerCategoryFilters,
    featureVisibleInPrimaryLayers,
    siteLocationAccuracy,
    isExhibitSite,
    isInternalPublicSiteNoteSection,
    siteUsesDefaultBluePin,
    sanitizePublicSiteContent,
    siteIntroductionPresentation,
    stripInternalPublicSiteSections,
    siteWithContentOverrides,
    siteTerritoryFillColor
  };
}());
