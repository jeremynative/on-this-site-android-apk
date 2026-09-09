/* Reading support for guided stops. No requests, dependencies or map movement. */
(function (root) {
  "use strict";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const grades = ["K–2", "3–5", "6–8", "9–12"];
  // Each route has a concrete concept, an accessible explanation, and a progression
  // from observation to evidence-based interpretation. Historical claims stay in
  // the published stop text and the linked article with its references.
  const lessons = {
    "native-resistance-and-activism": ["People working for change", "Activism is organized work to change an unfair situation or protect a community's rights. Native people have used meetings, demonstrations, legal claims, art, and many other approaches. At this stop, identify what people wanted to change and how they made their voices heard.", "When something is unfair, people can work together to ask for change. Read with a grown-up about what this community wanted to protect.", "Find the people asking for change. What did they want others to understand?", "Name the problem, the people speaking up, and one action they took. Use a detail from the story.", "Explain how the action addressed a particular decision or institution. What evidence shows the community's goals?", "Evaluate the relationship between the community's demands, the strategy used, and the response. Distinguish an immediate outcome from a longer struggle."],
    "sovereignty-tribal-governance": ["Who makes decisions?", "Native nations have their own communities, leaders, and responsibilities. Sovereignty means their right to govern themselves. At this stop, look for a decision about land or community life and the people making it.", "A community needs people who listen, make decisions, and care for its home. Native nations have leaders and governments today as well as in the past.", "Find a person or community named here. Tell a grown-up what they were protecting.", "Name the people making the agreement or decision. What did they want to keep or change? Use one detail from the stop.", "Identify each government or group involved. Which part of the account shows consent, negotiation, or disagreement? Explain your choice.", "Use a specific term or action in the record to explain how authority was asserted. Compare legal recognition with the continuing life of the Native nation."],
    "making-a-living-economic-development": ["Knowledge, work, and community", "An economy includes how people make, share, trade, and earn what they need. Native work on Long Island draws on skills with land, water, materials, and art. Ask who did the work, who benefited, and who could make choices about it.", "People use many skills to help their families and neighbors. Look for something people made, grew, shared, or cared for at this place.", "Draw or name one kind of work in the story. What skill would it take?", "Describe one job or skill and how it helped a family or community. Point to the detail that helped you.", "Find who controlled the work or its earnings. How did workers use their knowledge, and what limited their choices?", "Compare skilled labor with control over land, markets, or revenue. Build a claim about economic self-determination using evidence from this stop."],
    "coastal-knowledge": ["Read the water as well as the land", "Long Island's coast includes ocean beaches, sheltered bays, creeks, and marshes. These are different environments. Native coastal knowledge includes travel, seasons, food, skilled work, and responsibilities toward places and living things.", "Water connects places. People learn about tides, animals, and seasons by paying close attention and learning from others.", "Find the water on the map. Is it a creek, bay, or ocean? Ask someone to help you name it.", "Find one way water shaped life at this stop. Describe what people needed to know.", "Connect a water feature with a practice or right in the account. What evidence explains that connection?", "Explain how coastal expertise and authority appear together here. Compare a community practice with how a legal or historical source describes it."],
    "place-names-language": ["A name can carry a history", "An Indigenous place name may connect people with water, plants, landforms, or community memory. Older written spellings often came from outsiders trying to record spoken words. Read the explanation and its source before deciding what a name means.", "Places have names and stories. A name you do not know is a chance to listen and learn. Different people may write a name in different ways.", "Say or point to the place name with a grown-up. What question would you like to ask about it?", "Find the explanation given for this name. Does it refer to people, water, plants, or another feature? Say where you found the explanation.", "Compare the recorded spelling and explanation with another example in the article. What is known, and what remains uncertain?", "Examine who recorded or interpreted the name. Explain how language, transcription, and changes to the landscape affect the interpretation."],
    "burial-sacred-sites": ["Learning with care", "Burial grounds hold ancestors and continuing family and community relationships. Sacred places have religious or cultural importance to the people connected to them. Learning can happen through the public account without entering a place or seeking private knowledge.", "Some places help families remember people they love. We can learn about caring for these places by reading and listening together.", "With a grown-up, name one way to show care and respect. You do not need to visit.", "Who is connected to this place? Describe one way its history helps you understand why it needs care.", "Identify a threat or protection described in the account. Whose voices help explain what is at stake?", "Compare community responsibilities with the treatment of the place in a public record or policy. Explain what responsible public interpretation should protect."],
    "colonial-law-land-loss": ["Read the agreement closely", "Colonization brought European settlement and expanding control over Native homelands. A deed records a claimed land transfer; a lease allows use for a time; reserved rights keep specified uses. Those differences matter when reading what people agreed to and what happened afterward.", "An agreement is a promise people make together. In these stories, people tried to protect their homes and the ways they used the land.", "Find something people wanted to keep, such as a home or a place to fish. Tell someone why it mattered.", "List what the agreement allowed and what it kept for Native people. Use the words or details in this stop.", "Separate the terms of the agreement from later events. Did people describe or carry out those terms differently?", "Analyze the document's author, terms, and power relationships. Compare the recorded transaction with evidence of continued Native rights or later dispossession."],
    "plants-animals-ecology": ["A place is a web of relationships", "Ecology studies relationships among living things and their surroundings. Water, soil, plants, animals, and people shape one another's lives. At this stop, connect a habitat or species with the Native history described in the account.", "Plants, animals, water, and people share places. Look closely at the picture or map to notice what lives or grows here.", "Draw one living thing or water feature you notice. What might it need to thrive?", "Name a plant, animal, or habitat in the story. Describe one connection between it and community life.", "Explain how a change to water or habitat could affect both other species and people. Use a detail from the stop.", "Connect the ecological evidence with community knowledge or stewardship. Explain what a restoration project or place name helps reveal, and what it cannot tell you alone."],
    "contemporary-native-long-island": ["Native Long Island is here today", "Native communities continue to govern, create art, gather, teach, and care for their homelands. Contemporary means happening in the present or recent times. This path follows people shaping community life now, with relationships that reach across generations.", "Native people live on Long Island today. Families, artists, teachers, and leaders share knowledge and make new things together.", "Find something people do together at this place. What would you like to learn about it?", "Describe who leads or uses this place and one thing they do. How does it help people connect?", "Connect a present-day activity with an older relationship or responsibility described in the account.", "Explain how this place challenges an account that treats Native people only as part of the past. Support your explanation with a specific community-led action."],
    "default": ["People, place, and evidence", "A map point marks a place connected to a larger story. Start by identifying the people, the setting, and what happened. Then read the account's evidence before deciding what it helps explain.", "Every place has stories. Read this one with a grown-up and look for the people who are part of it.", "Name one person or place in the story. Tell someone one thing you notice or wonder.", "Describe who is involved, where the story happens, and one important action. Use a detail from the account.", "Identify the people, date, and source behind an important event. What perspective does that source give you?", "Build a claim about this place using a specific piece of evidence. Identify whose perspective is represented and what further evidence would help."]
  };
  const glossary = {
    "sachem": "A leader in a number of Algonquian-speaking Native communities. Responsibilities and ways of choosing leaders varied among nations; the word does not mean that every Native nation had the same government.",
    "sovereignty": "A nation's inherent right to govern itself: to make decisions about its people, land, and community life.",
    "self-determination": "The ability of a people to shape their own future and make decisions about their community.",
    "jurisdiction": "The authority of a government to make and apply rules in a particular place or over particular matters.",
    "consent": "Permission or agreement. When reading a historical agreement, ask who gave consent and exactly what they agreed to.",
    "right-of-way": "Permission to travel across land for a particular purpose. Permission to cross is different from ownership of the land.",
    "reserved rights": "Rights explicitly kept in an agreement, such as continuing to fish, plant, hunt, or live in a place.",
    "deed": "A written document recording a transfer of an interest in land. Read its terms and other evidence to understand what was transferred or retained.",
    "lease": "An agreement allowing someone to use land or property for a stated period and under stated conditions.",
    "land grant": "A document or act assigning rights to land. The terms and the authority claimed by the person making it matter.",
    "dispossession": "The loss or taking away of land, homes, or control over them.",
    "diplomacy": "The work of negotiating relationships and agreements between peoples or governments.",
    "federal acknowledgment": "Formal recognition by the United States of a government-to-government relationship with a Native nation. It is not the beginning of that people's history.",
    "state recognition": "Recognition of a Native nation by a state government. It is a different legal relationship from federal acknowledgment.",
    "constitution": "A set of basic principles and rules describing how a government works.",
    "trustee": "A person responsible for managing something on behalf of others. The duties depend on the particular system or agreement.",
    "kinship": "Relationships through family and community that can carry responsibilities, belonging, and shared knowledge.",
    "homeland": "A place to which a people have enduring connections through community life, history, and responsibilities.",
    "reservation": "Land retained or set apart as a homeland for a Native community. Its history and legal arrangements differ from place to place.",
    "Unkechaug": "A Native nation whose continuing homeland includes Poospatuck in Mastic, on Long Island's south shore.",
    "Poospatuck": "The Unkechaug homeland and reservation in Mastic, Suffolk County. You may also see the spelling Poosepatuck in historical sources.",
    "Mastic": "A community on Long Island's south shore in the Town of Brookhaven, Suffolk County. It is the setting of the Unkechaug stop on this path.",
    "Shinnecock": "A Native nation with a continuing homeland in the Southampton area of eastern Long Island. The name also appears on nearby bays, hills, and other places.",
    "Montaukett": "A Native people of eastern Long Island whose families, leadership, and community life continue today.",
    "Matinecock": "A Native people connected to Long Island's North Shore, with continuing families, community life, and organizing.",
    "Corchaug": "A Native community associated with Long Island's North Fork. The Fort Corchaug account connects this homeland with shell-working and trade.",
    "Hempstead Plains": "A broad central Long Island landscape historically known for grasslands. A place name may refer to a much larger area than one modern map point.",
    "North Fork": "The northern of the two long branches at Long Island's eastern end; the South Fork is the other.",
    "Long Island Sound": "The body of water between Long Island's north shore and the Connecticut coast.",
    "peninsula": "Land surrounded by water on most sides but connected to a larger area of land.",
    "headwaters": "The streams, ponds, or other waters near the beginning of a river system.",
    "estuary": "A partly enclosed coastal body of water where river or stream water mixes with seawater.",
    "wetland": "Land where water covers the ground or stays near its surface long enough to shape its soil, plants, and animal life.",
    "marsh": "A wetland with soft-stemmed plants such as grasses, rather than mostly trees.",
    "habitat": "The surroundings where a living thing gets the food, water, shelter, and other conditions it needs.",
    "stewardship": "Taking responsibility for the care of a place and its living relationships over time.",
    "aquaculture": "Growing or raising aquatic life, such as oysters or kelp, in water.",
    "restoration": "Work to help a damaged habitat or system recover its health and functions.",
    "wampum": "Beads made from particular shells. Native people have used them in relationships, diplomacy, ceremony, and exchange; they are more than simply money.",
    "quahog": "A hard-shell clam. Its purple shell material is used to make purple wampum beads.",
    "whelk": "A sea snail whose shell can provide material for white wampum beads.",
    "foodways": "The knowledge and practices involved in growing, gathering, preparing, sharing, and eating food.",
    "maritime": "Connected with the sea, seafaring, or work on the water.",
    "shell midden": "A deposit of shells and other traces left by human activity. Its layers and relationships can hold historical evidence; leave it undisturbed.",
    "archaeology": "The study of past human life through places, objects, and other material traces, considered in their context.",
    "colonial": "Connected with a period or system in which settlers and an outside government expanded control over another people's homeland.",
    "testimony": "An account someone gives about what they know or experienced, often in a legal proceeding.",
    "primary source": "Evidence made by people connected to the time or event being studied, such as a letter, agreement, photograph, or firsthand account.",
    "sacred": "Having religious or deep spiritual importance to the people connected to it. Some knowledge about sacred places is not public.",
    "contemporary": "Of the present or recent times. Native history includes people and communities living today.",
    "activism": "Organized efforts to bring about change or protect rights, through actions such as meetings, demonstrations, legal work, and public education.",
    "powwow": "A Native gathering that can include dancing, music, visiting, and community celebration. Each event has its own hosts, traditions, and visitor guidance."
  };
  const aliases = { sachems:"sachem", deeds:"deed", leases:"lease", trustees:"trustee", homelands:"homeland", reservations:"reservation", wetlands:"wetland", marshes:"marsh", habitats:"habitat", "shell middens":"shell midden", "right of way":"right-of-way" };
  const termKeys = [...Object.keys(glossary), ...Object.keys(aliases)].sort((a,b) => b.length-a.length);
  const termPattern = new RegExp(`\\b(${termKeys.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})\\b`, "gi");
  function definedText(value) {
    let last = 0, html = "";
    for (const match of String(value || "").matchAll(termPattern)) {
      html += esc(String(value).slice(last, match.index));
      const key = Object.keys(glossary).find(k=>k.toLowerCase() === match[0].toLowerCase()) || aliases[match[0].toLowerCase()];
      html += `<button type="button" class="learn-term" data-learn-term="${esc(key)}" aria-label="${esc(match[0])}: show definition" aria-expanded="false">${esc(match[0])}</button>`;
      last = match.index + match[0].length;
    }
    return html + esc(String(value || "").slice(last));
  }
  function stopHtml(info) {
    const lesson = lessons[info.pathSlug] || lessons.default;
    const selected = root.NLILearningHub.getLevel();
    const unkechaug = info.siteSlug === "unkechaug-indian-reservation";
    const context = unkechaug ? "The Unkechaug Nation is a living Native community. Poospatuck, in Mastic on Long Island's south shore, is its continuing homeland. In the 1690 agreement described below, Tobacus acted as a sachem, or leader. People seeking to cross the land needed an agreement with the people who held authority there." : "";
    return `<div class="learn-stop-guide"><div class="learn-stop-tools"><label>Reading & activity level <select data-learn-stop-level aria-label="Reading and activity grade band">${grades.map((g,i)=>`<option value="${i}"${i===selected?' selected':''}>Grades ${g}${i===0?' · Read together':''}</option>`).join("")}</select></label><span>Underlined words: hover, focus, or tap for a definition.</span></div>
      <section class="learn-stop-context"><h4>${esc(lesson[0])}</h4><p data-learn-foundation="young"${selected===0?'':' hidden'}>${definedText(lesson[2])}</p><p data-learn-foundation="older"${selected===0?' hidden':''}>${definedText(lesson[1])}</p>${context?`<h4>Place and people</h4><p>${definedText(context)}</p>`:""}</section>
      <section class="learn-stop-evidence"><h4>The story at this stop</h4>${info.why?`<p>${definedText(info.why)}</p>`:`<p>Read the linked account of ${esc(info.siteTitle || "this place")}. Look for the people involved, the setting, and the sources behind the story.</p>`}</section>
      <section class="learn-stop-task"><h4>Make a connection</h4>${grades.map((g,i)=>`<div data-learn-stop-band="${i}"${i===selected?'':' hidden'}><p class="learn-stop-band-label">Grades ${g}${i===0?' · Read and talk with a grown-up':''}</p><p>${definedText(lesson[i+3])}</p>${i===1?'<p class="learn-sentence-start">Start with: “At this place, ___ mattered because ___.”</p>':i===2?'<p class="learn-sentence-start">Start with: “The detail ___ suggests ___ because ___.”</p>':i===3?'<p class="learn-sentence-start">Start with: “The source supports ___, while leaving ___ unresolved.”</p>':""}</div>`).join("")}
      ${info.question?`<details class="learn-deeper"><summary>Go deeper: a question to discuss</summary><p>${definedText(info.question)}</p>${info.activity?`<p>${definedText(info.activity)}</p>`:""}</details>`:""}</section>
      <details class="learn-guide-sources"><summary>Sources & reading help</summary><p>For this stop's dates, people, and events, read the linked place article and its Historic Moments and References. Definitions are reading aids; an agreement's exact words and context still matter.</p><ul><li><a href="https://americanindian.si.edu/nk360/about/essential-understandings" target="_blank" rel="noopener noreferrer">Smithsonian: Native nations, cultures, and governments</a></li><li><a href="https://americanindian.si.edu/nk360/thanksgiving/sq2ss3.html" target="_blank" rel="noopener noreferrer">Smithsonian: one example of sachem leadership, in Wampanoag society</a></li><li><a href="https://americanindian.si.edu/nk360/manhattan/journey-of-trade/journey-of-trade.cshtml" target="_blank" rel="noopener noreferrer">Smithsonian: wampum and trade in Native New York</a></li><li><a href="https://oceanservice.noaa.gov/facts/aquaculture.html" target="_blank" rel="noopener noreferrer">NOAA: aquaculture</a> · <a href="https://marineprotectedareas.noaa.gov/resources/glossary/" target="_blank" rel="noopener noreferrer">Coastal glossary</a></li><li><a href="https://www.nps.gov/subjects/archeology/glossary.htm" target="_blank" rel="noopener noreferrer">National Park Service: archaeology glossary</a></li>${unkechaug?'<li><a href="https://history.pmlib.org/node/42" target="_blank" rel="noopener noreferrer">Patchogue-Medford Library: Unkechaug history and sources</a></li>':""}</ul></details></div>`;
  }
  let active = null, bubble = null, pinned = false, leaveTimer = 0, dismissed = null;
  function hide() {
    root.clearTimeout(leaveTimer);
    if (active) { active.setAttribute("aria-expanded", "false"); active.removeAttribute("aria-describedby"); }
    active = null; pinned = false; bubble?.remove(); bubble = null;
  }
  function show(button, pin = false) {
    root.clearTimeout(leaveTimer);
    const definition = glossary[button.dataset.learnTerm];
    if (!definition) return;
    if (active !== button) hide();
    active = button; pinned = pin;
    if (!bubble) {
      bubble = root.document.createElement("div"); bubble.id = "learn-term-definition"; bubble.className = "learn-term-definition"; bubble.setAttribute("role", "tooltip");
      bubble.textContent = definition; root.document.body.appendChild(bubble);
    }
    button.setAttribute("aria-expanded", "true"); button.setAttribute("aria-describedby", bubble.id);
    const rect = button.getBoundingClientRect(), viewport = root.visualViewport;
    const width = viewport?.width || root.innerWidth, height = viewport?.height || root.innerHeight;
    const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0;
    bubble.style.maxWidth = `${Math.min(330, width - 24)}px`;
    const box = bubble.getBoundingClientRect();
    bubble.style.left = `${Math.max(left+12, Math.min(rect.left, left+width-box.width-12))}px`;
    bubble.style.top = `${Math.max(top+12, rect.bottom+box.height+12 <= top+height ? rect.bottom+6 : rect.top-box.height-6)}px`;
  }
  root.document.addEventListener("pointerover", event => {
    if (event.pointerType === "touch") return;
    if (bubble?.contains(event.target) || active?.contains(event.target)) root.clearTimeout(leaveTimer);
    const term = event.target.closest?.("[data-learn-term]");
    if (term && term !== active && term !== dismissed) show(term);
  });
  root.document.addEventListener("pointerout", event => {
    if (dismissed?.contains(event.target) && !dismissed.contains(event.relatedTarget)) dismissed = null;
    if (!active || pinned || event.pointerType === "touch") return;
    if ((active.contains(event.target) || bubble?.contains(event.target)) && !active.contains(event.relatedTarget) && !bubble?.contains(event.relatedTarget)) leaveTimer = root.setTimeout(hide, 150);
  });
  root.document.addEventListener("focusin", event => { const term = event.target.closest?.("[data-learn-term]"); if (term && term !== dismissed) show(term); else if (!term) { dismissed = null; hide(); } });
  root.document.addEventListener("click", event => {
    const term = event.target.closest?.("[data-learn-term]");
    if (term) { event.preventDefault(); if (active === term && pinned) { dismissed = term; hide(); } else { dismissed = null; show(term, true); } }
    else if (!bubble?.contains(event.target)) hide();
  });
  root.document.addEventListener("keydown", event => { if (event.key === "Escape" && active) { event.preventDefault(); event.stopPropagation(); dismissed = active; hide(); } }, true);
  root.document.addEventListener("scroll", () => { if (active) hide(); }, true);
  root.addEventListener("resize", hide);
  root.document.addEventListener("change", event => {
    if (!event.target.matches?.("[data-learn-stop-level]")) return;
    const selected = Number(event.target.value); if (!Number.isInteger(selected) || selected < 0 || selected > 3) return;
    root.NLILearningHub.setLevel(selected); hide();
    root.document.querySelectorAll(".learn-stop-guide").forEach(guide => {
      guide.querySelector("select").value = String(selected);
      guide.querySelectorAll("[data-learn-stop-band]").forEach(block => { block.hidden = Number(block.dataset.learnStopBand) !== selected; });
      guide.querySelector('[data-learn-foundation="young"]').hidden = selected !== 0;
      guide.querySelector('[data-learn-foundation="older"]').hidden = selected === 0;
    });
  });
  function mobileStopHtml(path, stop) {
    return stopHtml({pathSlug:path.slug, siteSlug:stop.site?.slug, siteTitle:stop.title, why:stop.why, question:stop.question, activity:stop.activity});
  }
  function mobileHeader(path, site) {
    const stop = path?.stops.find(item => item.site?.slug === site.slug);
    if (!stop) return "";
    return `<section class="section mobile-learning-current-stop"><p class="section-kicker">Guided path · Stop ${esc(stop.stop_number)} of ${path.stops.length}</p><h3>${esc(path.title)}</h3>${mobileStopHtml(path, stop)}${stop.sensitiveNote?`<p>${esc(stop.sensitiveNote)}</p>`:""}<button type="button" class="action secondary" data-mobile-learning-path-open="${esc(path.slug)}">Return to path & progress</button></section>`;
  }
  root.NLILearningGuide = { stopHtml, definedText, mobileStopHtml, mobileHeader };
})(typeof window !== "undefined" ? window : globalThis);
