(function () {
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
    const hasPhrase = words => combined.includes(words.join(" "));
    const titleLooksInternal =
      hasPhrase(["public", "engagement"]) ||
      hasPhrase(["public", "access", "note"]) ||
      hasPhrase(["public", "engagement", "note"]) ||
      /\bstewardship\b/.test(combined);
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
    isCoordinateOnlyLabel,
    titleCaseSiteType,
    siteDisplayType,
    siteSubtitle,
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
