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

  // Exact taxa only: photo-provider names include authors and change with taxonomy.
  // These small, reviewed profiles are shared offline by both clients. No requests
  // are made while rendering or moving the map. Add sources with every new profile.
  const plantSpeciesProfiles = [
    {
      names: ["calamagrostis breviligulata", "ammophila breviligulata"], common: ["american beachgrass", "american beach grass"],
      native: ["Native to Long Island", "native"], conservation: ["Not NY-listed as endangered or threatened", "secure"],
      facts: [["Habitat", "Sandy beaches and coastal dunes."], ["Ecological role", "Traps windblown sand and helps build the dunes that shelter inland habitats."], ["What to notice", "Underground stems spread through the sand; new shoots can grow as sand accumulates."], ["Care for this habitat", "Use established beach access paths and keep off dune vegetation."]],
      note: "The endangered Champlain beachgrass is a separately listed subspecies; its status should not be applied to all American beachgrass.",
      sources: [["National Park Service: American beachgrass", "https://www.nps.gov/gate/learn/nature/american-beach-grass.htm"], ["Fire Island: sand dunes", "https://www.nps.gov/fiis/learn/nature/sanddunes.htm"], ["Kew: accepted name and synonym", "https://powo.science.kew.org/taxon/77165977-1"]], nyChecked: true
    },
    {
      names: ["ammophila champlainensis", "ammophila breviligulata ssp champlainensis", "ammophila breviligulata subsp champlainensis"], common: ["champlain beachgrass"],
      native: ["Native to northern New York; not Long Island", "regional"], conservation: ["Endangered in New York", "protected"],
      facts: [["Habitat", "Freshwater dunes in the Lake Champlain and eastern Lake Ontario region."], ["Identification", "A distinct conservation concern from the American beachgrass of Long Island's coast."]],
      sources: [["NatureServe: Champlain beachgrass", "https://explorer.natureserve.org/Taxon/ELEMENT_GLOBAL.2.154157/Ammophila_champlainensis"]], nyChecked: true
    },
    {
      names: ["myrica pensylvanica", "morella pensylvanica"], common: ["northern bayberry"],
      native: ["Native to Long Island", "native"], conservation: ["Not NY-listed as endangered or threatened", "secure"],
      facts: [["Habitat", "Coastal dunes, thickets and other sandy or exposed ground."], ["Wildlife", "Waxy fruits feed migrating tree swallows and yellow-rumped warblers."], ["Ecological role", "A coastal shrub that provides cover and helps stabilize poor soils."]],
      sources: [["Brooklyn Botanic Garden: northern bayberry", "https://nymf.bbg.org/species/539"], ["Long Island Botanical Society: bayberry", "https://www.libotanical.org/newsletters/2704.pdf"], ["NYSDEC: revegetation guide, p. 76", "https://extapps.dec.ny.gov/docs/materials_minerals_pdf/reveg3.pdf"]], nyChecked: true
    },
    {
      names: ["myrica cerifera", "morella cerifera"], common: ["southern bayberry", "southern wax myrtle"],
      native: ["Regional native; Long Island status uncertain", "regional"], conservation: ["Not NY-listed as endangered or threatened", "secure"],
      facts: [["Native range", "Primarily the southeastern coastal plain, reaching north to New Jersey; New York reports are atypical."], ["Wildlife", "Its fruit and evergreen cover support birds and other wildlife."], ["Compare the ID", "Check against northern bayberry before treating a Long Island photo as southern wax myrtle."]],
      note: "Brooklyn Botanic Garden records it as a rare native in the wider metropolitan region. That region includes New Jersey and does not establish a Long Island population.",
      sources: [["US Forest Service: wax myrtle", "https://research.fs.usda.gov/feis/species-reviews/morcer"], ["Brooklyn Botanic Garden: wax myrtle", "https://nymf.bbg.org/species/537"], ["Kew: Myrica cerifera", "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:166220-2"]], nyChecked: true
    },
    {
      names: ["senecio inaequidens"], common: ["narrow leaved ragwort", "narrow-leaved ragwort", "south african ragwort"],
      native: ["Not native to Long Island", "introduced"], conservation: ["Not NY-listed as endangered or threatened", "secure"],
      facts: [["Native range", "Southern Africa, from Mozambique to South Africa."], ["Growth", "A perennial member of the daisy family associated with subtropical conditions."], ["Compare the ID", "Check flowers, leaves and the whole plant. A photo suggestion alone does not establish this species on Long Island."]],
      sources: [["Kew: narrow-leaved ragwort", "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:245637-1"]], nyChecked: true
    },
    {
      names: ["solidago simplex"], common: ["mt albert goldenrod", "mt. albert goldenrod"],
      native: ["North American native; local ID unresolved", "regional"], conservation: ["Variety needed: some are NY-protected", "protected"],
      facts: [["Habitat", "This goldenrod group includes plants of rocky and mountain habitats."], ["Conservation detail", "New York lists variety racemosa as endangered and variety monticola as threatened."], ["Compare the ID", "The name Solidago simplex alone cannot identify the variety or establish its Long Island native status."]],
      sources: [["NatureServe: Solidago simplex", "https://explorer.natureserve.org/Taxon/ELEMENT_GLOBAL.2.640050/Solidago_simplex"]], nyChecked: true
    },
    {
      names: ["jacaranda mimosifolia"], common: ["blue jacaranda"],
      native: ["Not native to Long Island", "introduced"], conservation: ["Vulnerable globally (IUCN)", "protected"],
      facts: [["Native range", "South America, including Bolivia and northwestern Argentina."], ["What to notice", "A subtropical tree with finely divided leaves and purple-blue flowers."], ["Conservation detail", "Widely planted as an ornamental, but its wild populations are classed as Vulnerable. Global status differs from New York protection."]],
      sources: [["Kew: jacaranda distribution", "https://powo.science.kew.org/taxon/130936-2"], ["Kew: IUCN assessment and description", "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:130936-2/general-information"]]
    },
    {
      names: ["wisteria sinensis"], common: ["chinese wisteria"],
      native: ["Not native to Long Island", "introduced"], conservation: ["Invasive concern in the New York region", "introduced"],
      facts: [["Growth", "A woody climbing vine introduced from China."], ["Ecological concern", "New York Botanical Garden records Chinese wisteria as invasive in the city flora."], ["Compare the ID", "Identify the species before applying this status to other wisterias."]],
      sources: [["New York Botanical Garden: flora checklist", "https://www.nybg.org/content/uploads/2017/08/NYBG_NYCEcoFlora_Checklist_1Aug.pdf"]]
    },
    {
      names: ["wisteria floribunda"], common: ["japanese wisteria"],
      native: ["Not native to Long Island", "introduced"], conservation: ["Not NY-listed as endangered or threatened", "secure"],
      facts: [["Growth", "An ornamental climbing vine introduced from Japan."], ["Regional status", "Recorded as non-native and naturalized in the New York City flora."]],
      sources: [["New York Botanical Garden: flora checklist", "https://www.nybg.org/content/uploads/2017/08/NYBG_NYCEcoFlora_Checklist_1Aug.pdf"]], nyChecked: true
    }
  ];

  const nyPlantProtectionSource = ["NYSDEC: protected plants and species lists", "https://dec.ny.gov/nature/animals-fish-plants/plants/state-protected-plants"];

  function plantSpeciesProfile(fields = {}) {
    const scientific = defaultNormalizeText(fields.scientific_name || fields.identification || "");
    if (scientific) {
      // A named variety must never inherit the parent species' conservation status.
      const candidates = plantSpeciesProfiles.flatMap(profile => profile.names.map(name => ({ profile, name })))
        .sort((a, b) => b.name.length - a.name.length);
      return candidates.find(({ name }) => {
        if (scientific !== name && !scientific.startsWith(name + " ")) return false;
        const suffix = scientific.slice(name.length);
        return !/\b(?:var|ssp|subsp|hybrid|x|or|cf|aff)\b/.test(suffix);
      })?.profile || null;
    }
    const common = defaultNormalizeText(String(fields.common_name || fields.name || "").replace(/\([^)]*\)/g, ""));
    return plantSpeciesProfiles.find(profile => profile.common.some(name => defaultNormalizeText(name) === common)) || null;
  }

  function plantConfidencePercent(value, alreadyPercent = false) {
    if (value === null || value === undefined || String(value).trim() === "") return "";
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > (alreadyPercent ? 100 : 1)) return "";
    const percent = alreadyPercent ? number : number * 100;
    return percent > 0 && percent < 1 ? "<1" : String(Math.round(percent));
  }

  function plantObservationInsightsHtml(fields = {}, options = {}) {
    const escape = options.escapeHtml || (value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])));
    const profile = plantSpeciesProfile(fields);
    const source = usefulPlantText(fields.identification_source || fields.source || "", options);
    const rows = plantObservationFactRows(fields, null, options);
    const sources = profile ? [...profile.sources, ...(profile.nyChecked ? [nyPlantProtectionSource] : [])] : [];
    const identity = cleanText(fields.scientific_name || fields.identification || fields.common_name || fields.name, options);
    const lookup = "https://powo.science.kew.org/results?q=" + encodeURIComponent(identity || "plant");
    const statusTile = ([value, tone], label) => `<div class="plant-status-tile plant-status-${tone}"><span>${label}</span><strong>${escape(value)}</strong></div>`;
    return `<section class="plant-insights" aria-label="About the suggested plant species">
      <p class="plant-insights-label">About this suggested species</p>
      ${profile ? `<div class="plant-status-grid">${statusTile(profile.native, "Long Island native status")}${statusTile(profile.conservation, "Conservation / protection")}</div>` : `<p class="plant-id-check">${/wisteria/i.test(identity) ? "Wisterias differ by species. Chinese and Japanese wisteria are introduced; a genus-only identification cannot settle local native or conservation status." : /^[a-z]+ [a-z]+(?:\s|$)/i.test(String(fields.scientific_name || fields.identification || "")) ? "Explore the linked botanical sources for this species’ range and conservation status." : "A species-level identification is needed to check Long Island native status and New York protection."}</p>`}
      <div class="site-plant-facts">${rows.map(([label, value]) => `<div class="site-plant-fact"><strong>${escape(label)}</strong><span>${escape(value)}</span></div>`).join("")}</div>
      <details class="plant-species-sources"><summary>Species details &amp; sources</summary>
        ${profile?.note ? `<p>${escape(profile.note)}</p>` : ""}
        <p>These facts describe the suggested species; the photo identification still needs confirmation.</p>
        ${source ? `<p>Photo identification: ${escape(source)}.</p>` : ""}
        ${sources.length ? `<ul>${sources.map(([label, url]) => `<li><a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a></li>`).join("")}</ul><p class="plant-source-date">Sources checked September 8, 2026.</p>` : ""}
        <a href="${escape(lookup)}" target="_blank" rel="noopener noreferrer">Compare names and range in Kew's plant database</a>
      </details>
    </section>`;
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
    return /^[\s.;,]*$/.test(text) ? fallback : text;
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
    const match = plantReferenceMatch(haystack, species, options);
    const scientific = defaultNormalizeText(fields.scientific_name || fields.identification || "");
    if (match?.common === "bayberry" && scientific && !/^(?:myrica|morella) pensylvanica\b/.test(scientific)) return null;
    return match;
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
    const rows = [...(plantSpeciesProfile(fields)?.facts || [])];
    const algonquian = usefulPlantText(options.algonquianValue ?? fields.algonquian ?? fields.algonquian_word, options);
    if (algonquian) rows.push(["Recorded Indigenous name", algonquian]);
    const medicinal = usefulPlantText(fields.medicinal_use, options);
    if (medicinal && !/not shown|not documented|without .*source|not yet|not assessed/i.test(medicinal)) rows.push(["Medicinal use", medicinal]);
    return rows;
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
      confidence: plantConfidencePercent(record?.confidence),
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
    plantSpeciesProfiles,
    plantSpeciesProfile,
    plantConfidencePercent,
    plantObservationInsightsHtml,
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
