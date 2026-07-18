window.NLI_LANGUAGE_QUIZ_WORDS = [
  ["water", "núp"], ["ocean", "cutstúk"], ["river", "seépus"], ["bay", "petápagh"], ["stone", "sun"],
  ["sand", "yaac"], ["rain", "sukerun"], ["snow", "soáchpo"], ["ice", "copátn"], ["fire", "ruht; yuht"],
  ["thunder", "pataquáhamoc"], ["lightning", "wowosúmpsa"], ["sun", "haquaqua"], ["moon", "néepa"], ["star", "aráqusac"],
  ["cloud", "pamayáuxer"], ["rainbow", "papuhmúncsunc"], ["tree", "péewye"], ["pine", "cw"], ["oak", "húchemus"],
  ["hickory", "wusquíat"], ["corn", "sowhámmen"], ["beans", "mais-cusseet"], ["squash", "áscoot"], ["potato", "panac"],
  ["bread", "áp"], ["meat", "wéows"], ["milk", "wampachú-unk"], ["tobacco", "tobac"], ["whale", "púttap"],
  ["fish", "opéramac"], ["clam", "poquahoc"], ["oyster", "apóonahac"], ["deer", "hátk"], ["dog", "arrúm"],
  ["fox", "squiríntes"], ["squirrel", "moccás"], ["rabbit", "móh-tux"], ["mouse", "poquáttas"], ["bird", "a ássas"],
  ["crow", "concónchus"], ["eagle", "wéquaran"], ["goose", "hakénoh"], ["duck", "nanásecus"], ["dove", "má-owks"],
  ["snake", "skúk / skook"], ["bug", "séukr"], ["worm", "húquer"], ["fly", "mucháwas"], ["mosquito", "murráquitch"],
  ["woman", "squah"], ["man", "run"], ["father", "cws"], ["mother", "cwca"], ["brother", "contáyux"],
  ["sister", "kéessums"], ["grandfather", "numpsoonk"], ["grandmother", "nánnax"], ["uncle", "nisséis"], ["aunt", "cacácas"],
  ["husband", "ks-hámps"], ["wife", "keé-us"], ["child", "neechuntz"], ["boy", "macúchax"], ["girl", "squásses"],
  ["house", "wéecho"], ["door", "squnt"], ["blanket", "aqueéwants"], ["bow", "átump"], ["arrow", "neep"],
  ["tomahawk", "chékenas"], ["axe", "ochégan"], ["wampum", "whámpump"], ["war", "ayutówac"], ["peace", "weéhsaac"],
  ["head", "okéyununc"], ["hair", "wé-usk"], ["eyes", "skésuc"], ["nose", "cochón"], ["mouth", "cúttoh"],
  ["teeth", "képut"], ["hand", "córitch"], ["finger", "córitcheus"], ["knee", "cucúttuc"], ["foot", "cusseéd"],
  ["black", "shíckayo"], ["white", "wámpayo"], ["red", "sqúayo"], ["yellow", "weesa-wayo"], ["blue", "seewamp-wayo"],
  ["green", "uscu-sqúayo"], ["good", "woreécan"], ["bad", "máttatéayuh"], ["small", "péewátsu"], ["turtle", "matcîk"],
  ["sea beach", "siwâ a"], ["shell fish", "sétcawa"], ["thank you", "tabutnî"], ["greeting", "háhcamî"], ["come quick", "mekwí"]
].map(([english, algonquian]) => ({
  id: english.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  english,
  algonquian,
  source: /turtle|sea beach|shell fish|thank you|greeting|come quick/.test(english)
    ? "M. R. Harrington, Shinnecock Notes (1903), reprinted in Bonvillain and Stone, Languages and Lore of the Long Island Indians, p. 22"
    : "Thomas Jefferson Unkechaug/Unquachog vocabulary (1791), reprinted in Bonvillain and Stone, Languages and Lore of the Long Island Indians, pp. 17-18"
}));
