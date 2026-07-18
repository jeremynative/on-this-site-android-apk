(function () {
  const knownTitleBySlug = {
    "acabonack": "Acabonack",
    "amagansett-indian-well": "Amagansett Indian Well",
    "appaquogue": "Appaquogue",
    "ashawagh": "Ashawagh",
    "ayeuonganit-aunakesuck-muhhogkunk": "Ayeuonganit Aunakésuck Muhhogkunk",
    "bethel-christian-ave-laurel-hill-historic-district": "Bethel Christian Ave., Laurel Hill Historic District",
    "canarsie": "Canarsie Traditional Land",
    "canoe-place-chapel": "Canoe Place Chapel",
    "cataconacke-old-field": "Cataconacke (Old Field)",
    "chepiohkomuk-qut": "Chepiohkomuk-qut",
    "chequit": "Chequit",
    "circassian-shipwreck": "Circassian Shipwreck",
    "conegums": "Conegums",
    "conscience-point": "Conscience Point",
    "council-rock": "Council Rock",
    "december-1685-deed-land": "December 1685 Deed",
    "devils-footprint": "Devil's Footprint",
    "eastville": "Eastville",
    "elliot-a-brooks-carvings": "Elliot A. Brook's Carvings",
    "fort-corchaug": "Fort Corchaug",
    "fowler-house": "Fowler House",
    "freetown": "Freetown",
    "fresh-pond-fort": "Fresh Pond Fort",
    "fresh-pond-site": "Fresh Pond Site",
    "garvies-point-site": "Garvie's Point Site",
    "gids-island-fort": "Gid's Island Fort",
    "gowanus": "Gowanus",
    "hallock-site": "Hallock Site",
    "halsey-homestead": "Halsey Homestead",
    "hawthorne-site": "Hawthorne Site",
    "hoggenoch": "Hoggenoch",
    "horse-barn": "Horse Barn Burial Site",
    "howell-homestead": "Howell Homestead",
    "indian-field-cemetery": "Indian Field Cemetery",
    "indian-fields": "Indian Fields",
    "keskaechqueren": "Keskaechqueren",
    "manhansack-aqua-quash-awamock": "Manhansack-aqua-quash-awamock",
    "manitou-hill": "Manitou Hill",
    "matinecock": "Matinecock Tribal Nation",
    "matinecock-way": "Matinecock Way",
    "montaukett": "Montaukett",
    "shinnecock-indian-reservation": "Shinnecock Indian Reservation",
    "shinnecock-monument": "Shinnecock Monument",
    "sonquoequahesick": "Sonquoequahesick",
    "south-harbor": "South Harbor",
    "southold-indian-museum": "Southold Indian Museum",
    "springy-banks-pow-wow-grounds": "Springy Banks Pow Wow Grounds",
    "squassux-landing": "Squassux Landing",
    "st-matthew-chapel": "St. Matthew Chapel",
    "stephen-talkhouse-pharoah-house": "Stephen Talkhouse Pharoah House",
    "stony-brook-site": "Stony Brook Site",
    "sugar-loaf-hill": "Sugar Loaf Hill",
    "sylvester-manor": "Sylvester Manor",
    "the-point": "The Point",
    "unkechaug-indian-reservation": "Unkechaug Indian Reservation",
    "wading-river-site": "Wading River Site",
    "weckatuck": "Weeckatuck",
    "weeckatuck": "Weeckatuck",
    "wegwagonock": "Wegwagonock",
    "werpos": "Werpos",
    "west-woods": "West Woods",
    "whales-fin": "Whale's Fin",
    "william-floyd-estate": "William Floyd Estate",
    "winippague": "Winippague",
    "yaphank-weeks-pond-settlement": "Yaphank, Weeks Pond Settlement",
    "yennecock-southold-town": "Yennecock / Southold Town",
    "yonahqosunuk": "Yonáhqôsunuk"
  };

  const smallWords = new Set(["a", "an", "and", "at", "ave", "by", "for", "in", "of", "on", "or", "the", "to"]);

  function cleanText(value) {
    return String(value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, " ")
      .trim();
  }

  function titleCaseSlug(slug) {
    return String(slug || "")
      .split("-")
      .filter(Boolean)
      .map((part, index) => {
        const lower = part.toLowerCase();
        if (index > 0 && smallWords.has(lower)) return lower;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(" ");
  }

  function titleFromSummary(summary) {
    const text = cleanText(summary);
    if (!text) return "";
    const match = text.match(/^(.{3,80}?)(?:,|\sis\b|\swas\b|\sare\b|\shas\b|\shave\b)/i);
    const title = cleanText(match?.[1] || "");
    if (!title || /^\d|^(in|on|during|around|at|once|known)\b/i.test(title)) return "";
    return title.replace(/\s*["']\s*$/g, "");
  }

  function repairedSiteTitle(site) {
    const current = cleanText(site?.title);
    const slug = String(site?.slug || "").trim();
    if (current && (current !== "Potinack" || slug === "potinack")) return current;
    return knownTitleBySlug[slug] || titleFromSummary(site?.summary) || titleCaseSlug(slug) || current || "Untitled site";
  }

  function repairSite(site) {
    if (!site || typeof site !== "object") return site;
    const title = repairedSiteTitle(site);
    return title === site.title ? site : { ...site, title };
  }

  function repairSites(sites) {
    return Array.isArray(sites) ? sites.map(repairSite) : [];
  }

  const api = { repairedSiteTitle, repairSite, repairSites, titleCaseSlug };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.NLI_SITE_TITLE_UTILS = api;
})();
