(function () {
  const plantObservationSpecies = [
    ["oak", ["oak", "white oak", "red oak", "black oak", "acorn", "quercus"], "huchemus", "Oak is represented in the Unquachog/Poospatuck vocabulary recorded by Thomas Jefferson in 1791.", "Do not eat or harvest based on this app.", "Native group; many Quercus species are native in New York.", "Not listed as invasive.", "Not assessed here; check exact species.", "NY Flora Atlas; Jefferson Unquachog/Poospatuck vocabulary."],
    ["pine", ["pine", "pitch pine", "pinus"], "cw", "Pine is represented in the Unquachog/Poospatuck vocabulary recorded by Thomas Jefferson in 1791.", "Do not eat or harvest based on this app.", "Native group; pitch pine and other pines occur in Long Island habitats.", "Not listed as invasive.", "Not assessed here; check exact species.", "NY Flora Atlas; Jefferson Unquachog/Poospatuck vocabulary."],
    ["hickory", ["hickory", "hiccory", "carya"], "wusquiat", "Hickory is represented in the Unquachog/Poospatuck vocabulary recorded by Thomas Jefferson in 1791.", "Do not eat or harvest based on this app.", "Native group; hickories occur in New York.", "Not listed as invasive.", "Not assessed here; check exact species.", "NY Flora Atlas; Jefferson Unquachog/Poospatuck vocabulary."],
    ["strawberry", ["strawberry", "wild strawberry", "fragaria"], "wotahomon", "Strawberry is represented in the Unquachog/Poospatuck vocabulary recorded by Thomas Jefferson in 1791.", "Do not eat or harvest based on this app.", "Native group possible; exact Fragaria species matters.", "Not listed as invasive.", "Not assessed here; check exact species.", "NY Flora Atlas; Jefferson Unquachog/Poospatuck vocabulary."],
    ["grape", ["grape", "wild grape", "vitis"], "catemenon", "Grape is represented in the Unquachog/Poospatuck vocabulary recorded by Thomas Jefferson in 1791.", "Do not eat or harvest based on this app.", "Native group possible; exact Vitis species matters.", "Not listed as invasive.", "Not assessed here; check exact species.", "NY Flora Atlas; Jefferson Unquachog/Poospatuck vocabulary."],
    ["rose", ["rose", "wild rose", "rosa"], "wosowancon", "Rose is represented in the Unquachog/Poospatuck vocabulary recorded by Thomas Jefferson in 1791.", "Do not eat or harvest based on this app.", "Mixed group: some roses are native, some are introduced.", "Some introduced roses can be invasive; exact species matters.", "Not assessed here; check exact species.", "NY Flora Atlas; Jefferson Unquachog/Poospatuck vocabulary."],
    ["sage", ["sage", "white sage", "sagebrush", "smudge", "salvia"], "", "Sage observations need careful context. Cultural uses are sensitive, and bundled or dried plants cannot always be identified from a photo.", "Do not eat, burn, harvest, or remove plants based on this app.", "Exact species and source matter.", "Not assessed here.", "Not assessed here; check exact species.", "NY Flora Atlas."],
    ["tobacco", ["tobacco", "nicotiana"], "tobac", "Tobacco is represented in the Unquachog/Poospatuck vocabulary recorded by Thomas Jefferson in 1791.", "Not edible; nicotine-containing plants can be toxic.", "Cultivated plant context.", "Not listed here as invasive.", "Not assessed here; check exact species.", "NY Flora Atlas; Jefferson Unquachog/Poospatuck vocabulary."],
    ["corn", ["corn", "maize", "indian corn", "zea"], "sowhammen", "Corn is represented in the Unquachog/Poospatuck vocabulary recorded by Thomas Jefferson in 1791.", "Food context is documented, but this app does not advise eating plants found on-site.", "Cultivated plant.", "Not invasive.", "Not endangered.", "Jefferson Unquachog/Poospatuck vocabulary."],
    ["beans", ["bean", "beans", "phaseolus"], "mais-cusseet", "Beans are represented in the Unquachog/Poospatuck vocabulary recorded by Thomas Jefferson in 1791.", "Food context is documented, but this app does not advise eating plants found on-site.", "Cultivated or native group possible; exact species matters.", "Not assessed here.", "Not assessed here; check exact species.", "NY Flora Atlas; Jefferson Unquachog/Poospatuck vocabulary."],
    ["squash or gourd", ["squash", "gourd", "cucurbita"], "ascoot / whorammok", "Squash and gourd are represented in the Unquachog/Poospatuck vocabulary recorded by Thomas Jefferson in 1791.", "Food context is documented, but this app does not advise eating plants found on-site.", "Cultivated plant context.", "Not invasive.", "Not endangered.", "Jefferson Unquachog/Poospatuck vocabulary."],
    ["bayberry", ["bayberry", "northern bayberry", "wax myrtle", "morella pensylvanica", "myrica pensylvanica", "morella", "myrica"], "", "Northern bayberry is a locally relevant coastal shrub.", "Do not eat, harvest, or use based on this app.", "Native to the region; commonly used in coastal and native plant lists.", "Not listed here as invasive.", "Not listed here as endangered; verify site-specific protections.", "NY Flora Atlas; native plant lists for the New York/Long Island region."],
    ["black-eyed Susan", ["black-eyed susan", "black eyed susan", "rudbeckia hirta", "rudbeckia", "yellow coneflower"], "", "Black-eyed Susan is a common yellow composite flower.", "Do not eat, harvest, or use based on this app.", "NY Flora Atlas treats Rudbeckia hirta as not native/persisting in New York; other Rudbeckia species may differ.", "Not listed here as invasive.", "Not listed here as endangered; verify exact species.", "NY Flora Atlas."],
    ["wisteria", ["wisteria", "wisteria sinensis", "wisteria floribunda", "chinese wisteria", "japanese wisteria"], "", "Wisteria is an introduced ornamental vine often seen around buildings, fences, and woodland edges.", "Do not eat, harvest, or use based on this app.", "Usually non-native when Chinese or Japanese wisteria.", "Invasive concern; New York invasiveness assessments rank Chinese/Japanese wisteria as moderate in natural areas, though NYBG notes it is not currently regulated by New York State.", "Not listed here as endangered.", "NY Flora Atlas; New York Invasiveness Ranking Forms; NYBG Plant Information Service."]
  ].map(([common, keys, algonquian, context, edible, native, invasive, endangered, source]) => ({
    common,
    keys,
    algonquian,
    context,
    edible,
    native,
    invasive,
    medicinal: "Medicinal-use information is not shown without a reviewed source.",
    endangered,
    safety: edible,
    source: source || "NY Flora Atlas; On This Site plant reference layer."
  }));

  function cleanText(value, options = {}) {
    const cleaner = typeof options.cleanText === "function" ? options.cleanText : text => String(text || "").trim();
    return cleaner(value || "");
  }

  function defaultNormalizeText(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function normalize(value, options = {}) {
    const normalizer = typeof options.normalizeText === "function"
      ? options.normalizeText
      : defaultNormalizeText;
    return normalizer(value || "");
  }

  const plantReferenceIndexCache = new WeakMap();

  function plantReferenceIndex(species = plantObservationSpecies, options = {}) {
    if (!Array.isArray(species)) return [];
    const normalizer = typeof options.normalizeText === "function" ? options.normalizeText : defaultNormalizeText;
    let indexes = plantReferenceIndexCache.get(species);
    if (!indexes) {
      indexes = new Map();
      plantReferenceIndexCache.set(species, indexes);
    }
    if (indexes.has(normalizer)) return indexes.get(normalizer);
    const index = species.map(item => ({
      item,
      keys: [...new Set((item?.keys || []).map(key => normalizer(key)).filter(Boolean))]
        .sort((a, b) => b.length - a.length)
    }));
    indexes.set(normalizer, index);
    return index;
  }

  function plantReferenceMatch(value = "", species = plantObservationSpecies, options = {}) {
    const haystack = normalize(value, options);
    if (!haystack) return null;
    const paddedHaystack = ` ${haystack} `;
    const match = plantReferenceIndex(species, options).find(entry =>
      entry.keys.some(key => paddedHaystack.includes(` ${key} `))
    );
    return match?.item || null;
  }

  function publicPlantText(value, fallback = "", options = {}) {
    let text = cleanText(value, options);
    if (!text) return fallback;
    const internalPatterns = [
      new RegExp(["connect this observation", "to indigenous plant knowledge", "only after source review"].join(".*"), "ig"),
      /review species, location, and cultural or ecological context before treating this as confirmed\.?/ig,
      /requires reviewed sources before publication\.?/ig,
      /requires reviewed sources\.?/ig,
      /needs? local review for long island[.;]*/ig,
      /needs? verification before public interpretation[.;]*/ig,
      /exact species(?:, origin,)? and local status (?:need|needs) verification\.?/ig,
      /local ecological review needed; no algonquian vocabulary source attached yet\.?/ig,
      /add indigenous-language or cultural-use context only after a reviewed source is attached\.?/ig
    ];
    internalPatterns.forEach(pattern => {
      text = text.replace(pattern, "");
    });
    text = text.replace(/\s{2,}/g, " ").replace(/\s+\./g, ".").trim();
    return text || fallback;
  }

  function usefulPlantText(value = "", options = {}) {
    const text = publicPlantText(value || "", "", options);
    if (!text) return "";
    if (/needs? local review|needs? verification|not assessed from this photo|awaiting identification review|pending review/i.test(text)) return "";
    return text;
  }

  function plantFactValue(value, fallback = "Not yet documented", options = {}) {
    return publicPlantText(value, fallback, options);
  }

  function plantGuideMatchFromFields(fields = {}, species = plantObservationSpecies, options = {}) {
    const haystack = `${fields.name || ""} ${fields.identification || ""} ${fields.vocabulary || ""} ${fields.common_name || ""} ${fields.scientific_name || ""} ${fields.algonquian_word || ""}`;
    return plantReferenceMatch(haystack, species, options);
  }

  function plantNativeLabel(nativeStatus = "", invasiveStatus = "", match = null) {
    const text = `${nativeStatus || ""} ${invasiveStatus || ""}`.toLowerCase();
    if (/non-native|not native|introduced|ornamental|invasive concern|chinese|japanese/.test(text)) return "Non-native";
    if (/native to|native group|many .* native|commonly used in coastal and native plant lists/.test(text)) return "Native";
    if (/cultivated/.test(text)) return "Non-native or cultivated";
    return match ? "Needs exact species" : "Not yet documented";
  }

  function plantOriginText(fields = {}, match = null, options = {}) {
    const haystack = normalize([
      fields.name,
      fields.identification,
      fields.common_name,
      fields.scientific_name,
      match?.common,
      ...(match?.keys || [])
    ].filter(Boolean).join(" "), options);
    if (/wisteria|sinensis|floribunda/.test(haystack)) return "China or Japan, depending on species";
    if (/bayberry|morella|myrica/.test(haystack)) return "Eastern North America";
    if (/rudbeckia|black eyed susan|black-eyed susan/.test(haystack)) return "North America; exact New York status depends on species/source";
    if (/oak|quercus/.test(haystack)) return "North America; many oak species are native in New York";
    if (/corn|maize|zea/.test(haystack)) return "Cultivated crop from the Americas";
    return "";
  }

  function plantEndangeredLabel(value = "", match = null, options = {}) {
    const text = publicPlantText(value || match?.endangered || "", "", options).toLowerCase();
    if (!text) return "Not assessed";
    if (/not listed|not endangered/.test(text)) return "Not endangered";
    if (/endangered|threatened|sensitive/.test(text) && !/not /.test(text)) return "Yes";
    return "Not assessed";
  }

  function plantObservationFactRows(fields = {}, match = null, options = {}) {
    const algonquianValue = options.algonquianValue ?? fields.algonquian ?? fields.algonquian_word ?? "";
    const sourceValue = options.sourceValue ?? fields.source ?? fields.identification_source ?? fields.source_reference ?? "";
    const guidanceValue = options.guidanceValue ?? fields.edible_safety ?? fields.visitor_guidance ?? fields.guidance ?? "";
    const nativeStatus = usefulPlantText(fields.native_status, options) || match?.native || "";
    const invasiveStatus = usefulPlantText(fields.invasive_status, options) || match?.invasive || "";
    const nativeLabel = plantNativeLabel(nativeStatus, invasiveStatus, match);
    const origin = plantOriginText(fields, match, options);
    const source = usefulPlantText(sourceValue, options) || match?.source || "";
    return [
      ["Algonquian Word", plantFactValue(algonquianValue, "The word may exist or may have existed, but it has not been found in the sources reviewed.", options)],
      ["Native / non-native", origin ? `${nativeLabel}. Origin: ${origin}.` : nativeLabel],
      ["Status source", plantFactValue(source, "Not yet documented", options)],
      ["Medicinal use", usefulPlantText(fields.medicinal_use, options) || match?.medicinal || "Not shown without a source"],
      ["Endangered", plantEndangeredLabel(fields.endangered_status, match, options)],
      ["Safety", usefulPlantText(guidanceValue, options) || match?.safety || "Verify with a field guide or expert before touching, eating, or using any plant"]
    ];
  }

  function publicPlantReferenceFor(fields = {}, species = plantObservationSpecies, options = {}) {
    const haystack = [
      fields.common_name,
      fields.scientific_name,
      fields.name,
      fields.identification,
      fields.algonquian_word,
      fields.visitor_notes,
      fields.indigenous_context,
      fields.context
    ].filter(Boolean).join(" ");
    return plantReferenceMatch(haystack, species, options);
  }

  function knownPlantSpeciesList(item = {}) {
    const raw = item.known_plant_species;
    if (!raw) return [];
    let values = raw;
    if (typeof raw === "string") {
      try {
        values = JSON.parse(raw);
      } catch {
        values = raw.split(/\r?\n|;|,/);
      }
    }
    if (!Array.isArray(values)) values = [values];
    return [...new Set(values.map(value => {
      if (typeof value === "string") return value;
      return value?.scientific_name || value?.common_name || value?.name || value?.title || "";
    }).map(value => String(value || "").trim()).filter(Boolean))];
  }

  function plantSpeciesKey(value = "", options = {}) {
    return normalize(String(value || "").replace(/\([^)]*\)/g, " "), options);
  }

  function knownPlantStats(item = {}, observations = [], options = {}) {
    const knownSpecies = knownPlantSpeciesList(item);
    const observationText = typeof options.observationText === "function"
      ? options.observationText
      : observation => {
        const fields = observation?.fields || observation || {};
        return `${fields.scientific_name || fields.identification || ""} ${fields.common_name || fields.name || ""}`;
      };
    const observedKeys = observations.map(observation => plantSpeciesKey(observationText(observation), options)).filter(Boolean);
    const uniqueObserved = new Set(observedKeys);
    const documented = knownSpecies.filter(species => {
      const knownKey = plantSpeciesKey(species, options);
      return observedKeys.some(observed => observed.includes(knownKey) || knownKey.includes(observed));
    }).length;
    const percent = knownSpecies.length ? Math.round((documented / knownSpecies.length) * 100) : 0;
    return {
      observationCount: observations.length,
      uniqueObservedCount: uniqueObserved.size,
      knownSpeciesCount: knownSpecies.length,
      documentedCount: documented,
      percent
    };
  }

  function knownPlantStatsText(item = {}, observations = [], options = {}) {
    const stats = knownPlantStats(item, observations, options);
    const separator = options.separator || " - ";
    const approved = options.approved === true;
    const observationNoun = options.observationNoun || "observation";
    const uniqueSingular = options.uniqueSingular || "plant type";
    const uniquePlural = options.uniquePlural || `${uniqueSingular}s`;
    const uniqueVerb = options.uniqueVerb || "";
    const observationLabel = `${stats.observationCount} ${approved ? "approved " : ""}${observationNoun}${stats.observationCount === 1 ? "" : "s"}`;
    const uniqueLabel = `${stats.uniqueObservedCount} ${stats.uniqueObservedCount === 1 ? uniqueSingular : uniquePlural}${uniqueVerb ? ` ${uniqueVerb}` : ""}`;
    const base = `${observationLabel}${separator}${uniqueLabel}`;
    const detailSeparator = options.detailSeparator || ". ";
    if (!stats.knownSpeciesCount) return `${base}${detailSeparator}Known species list not yet added.`;
    return `${base}${detailSeparator}${stats.documentedCount}/${stats.knownSpeciesCount} known species documented (${stats.percent}%).`;
  }

  function plantStatusLabel(status) {
    const value = String(status || "").toLowerCase();
    if (value.includes("vocabulary")) return "Vocabulary match";
    if (value.includes("local")) return "Needs review";
    if (value.includes("identified") || value.includes("approved")) return "Suggested ID";
    if (value.includes("service") || value.includes("unavailable")) return "Needs review";
    if (value.includes("pending")) return "Pending review";
    return value ? value.replace(/_/g, " ") : "Pending review";
  }

  function plantObservationRecordFields(record, options = {}) {
    const relationId = typeof options.relationId === "function" ? options.relationId : value => {
      if (!value) return "";
      if (typeof value === "object") return value.id || value.value || "";
      return value;
    };
    const confidence = Number(record?.confidence || 0);
    const identificationStatus = String(record?.identification_status || "").toLowerCase();
    const unresolvedServiceResult = /service_error|unavailable|provider_error/.test(identificationStatus)
      || /identification unavailable/i.test(String(record?.common_name || ""));
    const vocabulary = record?.algonquian_word
      ? `${record.common_name || "Plant"} - ${record.algonquian_word}`
      : "";
    return {
      id: record?.id,
      name: unresolvedServiceResult ? "Unidentified nature observation" : (record?.common_name || "Plant observation"),
      identification: unresolvedServiceResult ? "Identification pending review" : (record?.scientific_name || record?.identification_status || "Awaiting identification review."),
      vocabulary,
      algonquian: record?.algonquian_word || "",
      context: record?.indigenous_context || "",
      guidance: record?.visitor_guidance || "",
      source: unresolvedServiceResult ? "Visitor photo awaiting identification" : (record?.identification_source || ""),
      status_label: plantStatusLabel(record?.identification_status || record?.status),
      native_status: record?.native_status || "",
      invasive_status: record?.invasive_status || "",
      edible_safety: record?.edible_safety || "",
      medicinal_use: record?.medicinal_use || "",
      endangered_status: record?.endangered_status || "",
      visitor_notes: record?.visitor_notes || "",
      confidence: confidence ? String(Math.round(confidence * 100)) : "",
      contributor: record?.author_name || "Contributor",
      member_profile: relationId(record?.member_profile) || null,
      photo: record?.photo || null,
      status: record?.status || "pending",
      photo_taken_at: record?.public_submitted_at || record?.photo_taken_at || record?.created_at || "",
      public_submitted_at: record?.public_submitted_at || "",
      created_at: record?.created_at || "",
      site_slug: record?.site_slug || record?.source_slug || "",
      site_title: record?.site_title || record?.source_title || "",
      ancestral_territory: relationId(record?.ancestral_territory) || null,
      ancestral_territory_slug: record?.ancestral_territory_slug || "",
      ancestral_territory_title: record?.ancestral_territory_title || "",
      observation_latitude: record?.observation_latitude ?? null,
      observation_longitude: record?.observation_longitude ?? null,
      observation_location_source: record?.observation_location_source || "",
      _structured: true
    };
  }

  function plantObservationSourceMatches(record = {}, sourceType = "site", item = {}) {
    if (!item) return false;
    if (sourceType === "territory") {
      const itemId = String(item.id || "");
      const itemSlug = String(item.slug || "");
      const territoryValue = record.ancestral_territory;
      const territoryId = String(typeof territoryValue === "object"
        ? (territoryValue?.id || territoryValue?.value || "")
        : (territoryValue || ""));
      const territorySlug = String(record.ancestral_territory_slug || "");
      return Boolean((itemId && territoryId === itemId) || (itemSlug && territorySlug === itemSlug));
    }
    if (sourceType !== "site") return false;
    if (String(record.source_type || "site") !== "site") return false;
    const sourceId = String(item.id || "");
    const sourceSlug = String(item.slug || "");
    const recordSourceId = String(record.source_id || "");
    const recordSourceSlug = String(record.source_slug || record.site_slug || "");
    return Boolean((sourceId && recordSourceId === sourceId) || (sourceSlug && recordSourceSlug === sourceSlug));
  }

  function plantObservationDateValue(record = {}) {
    const raw = record.photo_taken_at || record.public_submitted_at || record.created_at || record.comment?.created_at || "";
    const time = raw ? new Date(raw).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
  }

  function plantObservationSeason(record = {}) {
    const time = plantObservationDateValue(record);
    if (!time) return "Unknown season";
    const month = new Date(time).getMonth() + 1;
    if (month >= 3 && month <= 5) return "Spring";
    if (month >= 6 && month <= 8) return "Summer";
    if (month >= 9 && month <= 11) return "Fall";
    return "Winter";
  }

  function plantObservationSeasonGroups(observations = []) {
    const order = ["Spring", "Summer", "Fall", "Winter", "Unknown season"];
    const groups = new Map(order.map(label => [label, []]));
    (observations || []).forEach(record => groups.get(plantObservationSeason(record)).push(record));
    return order
      .map(label => ({
        label,
        observations: groups.get(label).sort((a, b) => plantObservationDateValue(b) - plantObservationDateValue(a))
      }))
      .filter(group => group.observations.length);
  }

  function plantObservationsForSource(observations = [], sourceType = "site", item = {}, options = {}) {
    const normalizeStatus = typeof options.normalizeStatus === "function"
      ? options.normalizeStatus
      : record => String(record?.status || "").toLowerCase();
    const mapRecord = typeof options.mapRecord === "function" ? options.mapRecord : record => record;
    return (observations || [])
      .filter(record => normalizeStatus(record) === "approved")
      .filter(record => plantObservationSourceMatches(record, sourceType, item))
      .sort((a, b) => plantObservationDateValue(b) - plantObservationDateValue(a))
      .map(mapRecord);
  }

  window.NLI_PLANT_UTILS = {
    plantObservationSpecies,
    publicPlantReference: plantObservationSpecies,
    publicPlantText,
    usefulPlantText,
    plantFactValue,
    plantReferenceMatch,
    plantGuideMatchFromFields,
    plantNativeLabel,
    plantOriginText,
    plantEndangeredLabel,
    plantObservationFactRows,
    publicPlantReferenceFor,
    knownPlantSpeciesList,
    plantSpeciesKey,
    knownPlantStats,
    knownPlantStatsText,
    plantStatusLabel,
    plantObservationRecordFields,
    plantObservationSourceMatches,
    plantObservationDateValue,
    plantObservationSeason,
    plantObservationSeasonGroups,
    plantObservationsForSource
  };
}());
