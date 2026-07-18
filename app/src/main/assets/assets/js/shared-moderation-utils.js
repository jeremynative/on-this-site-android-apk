(function () {
  const LEET = {
    "0": "o",
    "1": "i",
    "!": "i",
    "|": "i",
    "3": "e",
    "4": "a",
    "@": "a",
    "$": "s",
    "5": "s",
    "7": "t",
    "+": "t",
    "8": "b"
  };

  const BLOCKED_TERMS = [
    "fuck",
    "shit",
    "bitch",
    "cunt",
    "asshole",
    "bastard",
    "dickhead",
    "motherfucker",
    "slut",
    "whore",
    "faggot",
    "retard",
    "nigger",
    "kike",
    "spic",
    "chink",
    "gook",
    "wetback",
    "tranny"
  ];

  function normalize(value = "") {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[0134@!|$57+8]/g, character => LEET[character] || character);
  }

  function compact(value = "") {
    return normalize(value).replace(/[^a-z]+/g, "");
  }

  function hasBlockedLanguage(value = "") {
    const plain = normalize(value);
    const joined = compact(value);
    return BLOCKED_TERMS.some(term => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i").test(plain) || joined.includes(term);
    });
  }

  function checkPublicText(value = "", label = "This text") {
    if (!String(value || "").trim()) return { ok: true, message: "" };
    if (!hasBlockedLanguage(value)) return { ok: true, message: "" };
    return {
      ok: false,
      message: `${label} includes language that is not allowed in public archive posts. Please revise it and try again.`
    };
  }

  window.NLI_MODERATION_UTILS = {
    checkPublicText,
    hasBlockedLanguage,
    normalize,
    compact
  };
}());
