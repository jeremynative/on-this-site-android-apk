/* Shared, dependency-free Learn browser. Path facts and progress come from the host. */
(function (root) {
  "use strict";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const levels = [
    { label: "K–2", name: "Notice & wonder", task: "Choose a place with a grown-up. Look at its picture or map. Draw one thing you notice and tell someone one question you have.", question: "You see a name on the map that is new to you. What could you do first?", answers: ["Guess what it means", "Open the place and read or listen together", "Decide nobody lives there"], correct: 1, feedback: "Start with the place’s story. A grown-up can help you read it and find out more about the people connected to it." },
    { label: "3–5", name: "Explore & describe", task: "Choose two places on one path. Find something they share and something that makes each place different. Use a detail from each story.", question: "A map shows an old place name. What is the best way to learn its meaning?", answers: ["Check the linked story and its sources", "Use only how the word sounds", "Assume the map tells the whole story"], correct: 0, feedback: "Names invite questions. Read the linked story and check where the explanation comes from before drawing a conclusion." },
    { label: "6–8", name: "Compare & question", task: "Read two stops on a path. Compare their dates, sources, and perspectives. What do they help you understand together? What question remains?", question: "Two accounts describe the same place differently. What should you compare first?", answers: ["Which account is shortest", "Which one agrees with your first guess", "Who made each account, when, and why"], correct: 2, feedback: "Authorship, date, and purpose help you evaluate an account. Compare the evidence and notice whose perspectives are present or missing." },
    { label: "9–12", name: "Investigate & connect", task: "Build a claim using evidence from two path stops. Explain how the sources support it, identify a limitation, and connect the history to a question about the landscape today.", question: "A deed records a land transaction. Which approach makes the strongest investigation?", answers: ["Treat the deed as the only account needed", "Compare its terms with other records and Native perspectives", "Assume the document explains everyone’s intentions"], correct: 1, feedback: "Read the deed’s terms closely, then compare sources and perspectives. Distinguish what the evidence supports from what still needs investigation." }
  ];
  // Selected connections, researched against NYSED's K–8 (2016) and 9–12 (2017) framework.
  const curriculum = [
    { theme:"Families, communities & belonging", focus:"K–2 builds understanding of identity, cultural differences, communities, maps, and change over time. These are foundations for learning about Native neighbors.", connection:"Read a present-day Native community story together. Locate its place on the map, notice something in a photograph, and ask a question. Begin with people and communities living on Long Island today.", refs:"K–2 grade introductions; K.2", document:"k8" },
    { theme:"Native New York & relationships with land", focus:"Grade 4 explicitly studies Haudenosaunee and Algonquian-speaking peoples: environment, governance, culture, and colonial contact. Grade 5 compares Indigenous peoples and environments across the Americas.", connection:"Use the Coast, Ecology, and Governance paths to connect these themes to Long Island. Compare two places and explain how water, work, and community life connect, using a detail from each story.", refs:"3.1; 4.2, 4.3; 5.1, 5.3", document:"k8" },
    { theme:"Contact, land & historical evidence", focus:"Grade 7 examines diverse Native societies, geography, and colonial relationships, including land loss. Grade 8 examines expansion and its consequences for Native peoples.", connection:"Compare a biography, a dated historic moment, and a land record on the Law or Governance paths. Ask who created each source, whose perspective it records, and how Native leaders responded.", refs:"6.1; 7.1, 7.2b; 8.3a", document:"k8" },
    { theme:"Sovereignty, policy & civic action", focus:"Grade 11 examines colonial contact, federal reservation and assimilation policies, and Native activism, identity, land claims, and sovereignty. High-school practices emphasize evidence and civic participation.", connection:"Build an argument from cited deeds, biographies, and historic moments. Connect land agreements to contemporary Native government and preservation through the Governance, Law, and Activism paths; weigh evidence and identify unanswered questions.", refs:"9.8, 9.10; 10.4; 11.1a, 11.4c, 11.10b; 9–12 Social Studies Practices", document:"high" }
  ];
  const curriculumSources = {
    k8:"https://www.nysed.gov/sites/default/files/programs/standards-instruction/ss-framework-k-8a2.pdf",
    high:"https://www.nysed.gov/sites/default/files/programs/standards-instruction/framework-9-12-with-2017-updates.pdf"
  };
  // Grade sequence complements the selected Native-history key ideas above.
  const gradeConnections = [
    { themes:["contemporary", "ecology"], grades:[["Kindergarten", "Self, others, and cultural identity."], ["Grade 1", "Families today and long ago."], ["Grade 2", "Local and other U.S. communities."]], note:"Build these foundations through photographs, maps, and reading together about Native communities today." },
    { themes:["coast", "ecology", "sovereignty"], grades:[["Grade 3", "Compare communities around the world using maps and cultural evidence."], ["Grade 4", "Study New York’s Native peoples, land, governance, and colonial encounters."], ["Grade 5", "Compare Indigenous societies and European colonization across the Americas."]], note:"Long Island provides a local example to connect with the wider communities studied in class." },
    { themes:["law", "sovereignty"], grades:[["Grade 6", "Eastern Hemisphere geography and history; practice comparison and source reading."], ["Grade 7", "Native North America, colonial relationships, and land loss."], ["Grade 8", "U.S. expansion and its effects on Native peoples."]], note:"For grade 6, use Long Island as a comparison activity alongside the Eastern Hemisphere course." },
    { themes:["law", "sovereignty", "activism-protest"], grades:[["Grade 9", "Indigenous American civilizations and encounters across the Atlantic."], ["Grade 10", "Global imperialism, resistance, and changing borders."], ["Grade 11", "U.S. policy, Native sovereignty, land claims, and activism."], ["Grade 12", "Participation in government and economic decision-making."]], note:"For grades 10 and 12, local land and stewardship questions extend broader global-history and civic themes." }
  ];
  let level = 1;
  try { const saved = Number(root.localStorage.getItem("nli-learn-grade")); if (root.localStorage.getItem("nli-learn-grade") !== null && Number.isInteger(saved) && saved >= 0 && saved < levels.length) level = saved; } catch {}
  let query = "", mode = "all";
  const art = '<svg viewBox="0 0 300 130" aria-hidden="true" focusable="false"><path d="M18 98C75 98 52 28 122 28S170 106 214 87 237 28 281 28" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 6"/><g fill="currentColor"><circle cx="18" cy="98" r="6"/><circle cx="122" cy="28" r="6"/><circle cx="214" cy="87" r="6"/><circle cx="281" cy="28" r="6"/></g><g fill="currentColor" font-family="sans-serif" font-size="13"><text x="6" y="124">Notice</text><text x="110" y="14">Ask</text><text x="190" y="116">Connect</text></g></svg>';
  function shell(paths, close) {
    return `<div class="learning-hub" aria-label="Learn about Native Long Island">
      <div class="learn-hero"><div><p class="learn-eyebrow">ON THIS SITE · K–12 LEARNING</p><h2>Long Island is your classroom.</h2><p>Meet people, explore places, and ask bigger questions about Native Long Island—past and present.</p><span class="learn-hero-meta">${paths.length} guided paths · Learn from anywhere</span></div><div class="learn-hero-art">${art}</div>${close ? '<button type="button" class="learn-close" data-learn-close aria-label="Close Learn">×</button>' : ""}</div>
      <section class="learn-levels" aria-label="Choose a grade band"><div class="learn-section-heading"><h3>Start with your learners</h3><p>Choose a grade band to change the activity.</p></div><div class="learn-grade-grid">${levels.map((v, i) => `<button type="button" data-learn-level="${i}" aria-pressed="${level === i}"><strong>Grades ${v.label}</strong><span>${v.name}</span></button>`).join("")}</div></section>
      <div class="learn-view-tabs" aria-label="Learning view"><button type="button" data-learn-view="library" aria-pressed="true">Explore paths</button><button type="button" data-learn-view="lab" aria-pressed="false">Try an activity</button></div>
      <div class="learn-workspace" data-learn-viewing="library"><section class="learn-curriculum" aria-label="New York curriculum connections" data-learn-curriculum></section><aside class="learn-lab" aria-label="Activities and classroom guide"><div data-learn-lab></div><details class="learn-teacher"><summary>For teachers & families</summary><p>Use the map in class or at home. No visit or account is needed to explore.</p><ol><li>Introduce the activity and choose a path.</li><li>Open a stop together. Read its story and follow its references.</li><li>Discuss, sketch, or write using the grade-band prompt.</li></ol><p>The activities offer K–12 scaffolding; each path retains its own suggested grades. Preview the reading and subject matter before sharing with younger learners.</p><p>Path progress is saved on this device. On a shared device, it may reflect another learner’s work.</p></details></aside>
      <section class="learn-library" aria-label="Guided learning paths"><div class="learn-section-heading"><div><p class="learn-eyebrow">FOLLOW YOUR CURIOSITY</p><h3 tabindex="-1" data-learn-library-heading>Find your next path</h3></div></div><div class="learn-library-tools"><label class="learn-search">Search paths<input type="search" data-learn-search placeholder="Try coast, language, or leadership" value="${esc(query)}"></label><div class="learn-filter" aria-label="Path filter"><button type="button" data-learn-filter="all" aria-pressed="${mode === "all"}">All paths</button><button type="button" data-learn-filter="curriculum" aria-pressed="${mode === "curriculum"}">This curriculum</button><button type="button" data-learn-filter="progress" aria-pressed="${mode === "progress"}">My progress</button></div></div><p class="learn-results" data-learn-results role="status"></p><div class="learn-path-grid" data-learn-cards></div></section></div>
    </div>`;
  }
  function card(path, index, action) {
    const completed = Math.min(path.stops.length, Math.max(0, path.completed || 0));
    return `<article class="learn-path-card"><div class="learn-card-band"><span aria-hidden="true">${String(index + 1).padStart(2, "0")}</span><span>${esc(path.theme || "Guided exploration")}</span></div><div class="learn-card-copy"><h4>${esc(path.title)}</h4><p>${esc(path.summary)}</p><div class="learn-card-meta"><span>${path.stops.length} stops</span>${path.minutes ? `<span>${esc(path.minutes)} min</span>` : ""}${path.grades ? `<span>${esc(path.grades)}</span>` : ""}</div>${completed ? `<div class="learn-path-progress"><span>${completed} of ${path.stops.length} stops complete</span><progress value="${completed}" max="${path.stops.length}" aria-label="${esc(path.title)} progress"></progress></div>` : ""}<details class="learn-preview"><summary>Inside this path</summary>${path.question ? `<p><strong>Think about:</strong> ${esc(path.question)}</p>` : ""}<ol>${path.stops.slice(0, 3).map(s => `<li>${esc(s)}</li>`).join("")}</ol>${path.stops.length > 3 ? `<p>Plus ${path.stops.length - 3} more stops.</p>` : ""}</details><button type="button" class="learn-start" ${action}="${esc(path.slug)}">${completed ? completed === path.stops.length ? "Revisit path" : "Continue learning" : "Explore path"}<span aria-hidden="true">↗</span></button></div></article>`;
  }
  function mount(target, options) {
    const paths = options.paths || [];
    target.innerHTML = shell(paths, options.close);
    const hub = target.querySelector(".learning-hub");
    function related(path) { return gradeConnections[level].themes.includes(String(path.theme || '').toLowerCase()); }
    function library() {
      const matching = paths.filter(p => (mode !== "progress" || p.completed > 0) && (mode !== "curriculum" || related(p)) && `${p.title} ${p.summary} ${p.theme}`.toLowerCase().includes(query.toLowerCase().trim()));
      hub.querySelector("[data-learn-results]").textContent = `${matching.length} ${matching.length === 1 ? "path" : "paths"}${mode === "progress" ? " with saved progress" : mode === "curriculum" ? ` connected to the grades ${levels[level].label} themes` : " to explore"}`;
      hub.querySelector("[data-learn-cards]").innerHTML = matching.length ? matching.map(p => card(p, paths.indexOf(p), options.action)).join("") : `<div class="learn-empty"><h4>${mode === "progress" ? "Your next discovery starts here" : "No matching paths yet"}</h4><p>${mode === "progress" ? "Complete a stop on a path to see your progress here." : "Try a different word, or browse all paths."}</p><button type="button" data-learn-reset>Browse all paths</button></div>`;
    }
    function lab() {
      const v = levels[level];
      const c = curriculum[level], curriculumBox = hub.querySelector('[data-learn-curriculum]');
      const expanded = curriculumBox.querySelector('details')?.open;
      curriculumBox.innerHTML = `<p class="learn-eyebrow">NEW YORK CURRICULUM · GRADES ${v.label}</p><h3>${c.theme}</h3><p>${c.focus}</p><details ${expanded ? 'open' : ''}><summary>Classroom connections & sources</summary><h4>Grade by grade</h4><dl class="learn-grade-notes">${gradeConnections[level].grades.map(([grade, text]) => `<div><dt>${grade}</dt><dd>${text}</dd></div>`).join("")}</dl><p>${gradeConnections[level].note}</p><a href="https://www.nysed.gov/sites/default/files/programs/standards-instruction/ss-framework-k-12-intro.pdf" target="_blank" rel="noopener">NYSED grade sequence (PDF, p. 12)</a><h4>In the state framework</h4><a href="${curriculumSources[c.document]}" target="_blank" rel="noopener">NYSED framework (PDF): ${c.refs}</a><h4>Build on it with On This Site</h4><p>${c.connection}</p>${paths.some(related) ? `<button type="button" data-learn-related>Find related paths</button><p class="learn-curriculum-note">Choose a path to preview its reading and suggested grades. Younger learners can explore selected photos and stories with an adult.</p>` : ""}<p class="learn-curriculum-note">New York requires social studies throughout K–12; districts choose their curriculum and resources. These selected connections support that teaching. On This Site is an independent learning resource.</p><a href="https://www.nysed.gov/standards-instruction/social-studies-faq" target="_blank" rel="noopener">NYSED: requirements & local curriculum</a></details>`;
      hub.querySelector("[data-learn-lab]").innerHTML = `<section class="learn-mission"><p class="learn-eyebrow">YOUR ACTIVITY · GRADES ${v.label}</p><h3>${v.name}</h3><p>${v.task}</p><span class="learn-mission-note">Choose a path, then try this at a stop.</span></section><section class="learn-challenge"><p class="learn-eyebrow">MAP LAB · TRY IT NOW</p><h3>Think like a researcher</h3><p>${v.question}</p><div class="learn-answer-options">${v.answers.map((answer, i) => `<button type="button" data-learn-answer="${i}" aria-pressed="false">${esc(answer)}</button>`).join("")}</div><div class="learn-answer-feedback" data-learn-feedback role="status"></div></section>`;
    }
    library(); lab();
    hub.addEventListener("input", event => { if (event.target.matches("[data-learn-search]")) { query = event.target.value; library(); } });
    hub.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.hasAttribute("data-learn-close")) { options.close?.(); return; }
      if (button.hasAttribute("data-learn-view")) {
        hub.querySelector(".learn-workspace").dataset.learnViewing = button.dataset.learnView;
        hub.querySelectorAll("[data-learn-view]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
      }
      if (button.hasAttribute("data-learn-level")) {
        level = Number(button.dataset.learnLevel);
        try { root.localStorage.setItem("nli-learn-grade", String(level)); } catch {}
        hub.querySelectorAll("[data-learn-level]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
        lab();
        if (mode === 'curriculum') library();
      }
      if (button.hasAttribute("data-learn-filter") || button.hasAttribute("data-learn-reset") || button.hasAttribute('data-learn-related')) {
        const connected = button.hasAttribute('data-learn-related');
        mode = connected ? 'curriculum' : button.dataset.learnFilter || "all";
        if (button.hasAttribute("data-learn-reset") || connected) { query = ""; hub.querySelector("[data-learn-search]").value = ""; }
        if (connected) {
          hub.querySelector('.learn-workspace').dataset.learnViewing = 'library';
          hub.querySelectorAll('[data-learn-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.learnView === 'library')));
        }
        hub.querySelectorAll("[data-learn-filter]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.learnFilter === mode)));
        library();
        if (connected) {
          const heading = hub.querySelector("[data-learn-library-heading]");
          heading.focus({ preventScroll:true }); heading.scrollIntoView?.({ block:"start", behavior:"auto" });
        }
        else if (button.hasAttribute("data-learn-reset")) hub.querySelector("[data-learn-search]").focus();
      }
      if (button.hasAttribute("data-learn-answer")) {
        const correct = Number(button.dataset.learnAnswer) === levels[level].correct;
        hub.querySelectorAll("[data-learn-answer]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
        hub.querySelector("[data-learn-feedback]").textContent = correct ? `Map skill practiced. ${levels[level].feedback}` : "Take another look. Which choice helps you learn from evidence instead of making an assumption? Try again.";
      }
    });
    hub.addEventListener("keydown", event => { if (event.key === "Escape" && options.close) { event.preventDefault(); event.stopPropagation(); options.close(); } });
    return hub;
  }
  function mergePathRows(rows, stops, sites) {
    const paths = [...rows], pathStops = [...stops];
    const slugs = new Set(rows.map(p => p.slug));
    const bySlug = new Map(sites.map(s => [s.slug, s]));
    for (const seed of root.NLI_GUIDED_LEARNING_PATH_SEEDS || []) {
      if (slugs.has(seed.slug)) continue;
      const id = `seed:${seed.slug}`;
      const resolved = seed.stops.map((stop, index) => {
        const site = bySlug.get(stop[0]);
        return site ? { id:`${id}:${site.slug}`, learning_path_id:id, site_id:site.id,
          stop_number:index + 1, sort_order:index + 1, stop_title_override:site.title,
          why_this_stop_matters:stop[1], path_question:stop[2], sensitive_note:stop[3] || "",
          show_exact_location:seed.sensitivity_level !== "sensitive", is_required:true } : null;
      }).filter(Boolean);
      if (resolved.length) { paths.push({ ...seed, id }); pathStops.push(...resolved); }
    }
    return [paths, pathStops];
  }
  root.NLILearningHub = { mount, mergePathRows, getLevel: () => level, setLevel: value => { level = value; try { root.localStorage.setItem("nli-learn-grade", String(level)); } catch {} } };
})(typeof window !== "undefined" ? window : globalThis);
