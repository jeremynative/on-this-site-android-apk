(function () {
  const DESKTOP_ALLOWED_TAGS = new Set([
    "A", "ABBR", "B", "BLOCKQUOTE", "BR", "CAPTION", "CITE", "DETAILS", "DIV", "EM",
    "FIGCAPTION", "FIGURE", "H1", "H2", "H3", "H4", "HR", "I", "IFRAME", "IMG", "LI",
    "OL", "P", "SPAN", "STRONG", "SUMMARY", "SUP", "TABLE", "TBODY", "TD", "TH", "THEAD", "TR", "U", "UL"
  ]);
  const DESKTOP_ALLOWED_ATTRS = new Set(["allow", "allowfullscreen", "class", "data-src", "frameborder", "height", "href", "referrerpolicy", "src", "title", "width", "alt"]);
  const TIMELINE_SECTION_TITLE_PATTERN = /history|colonial|land loss|excavation|preservation|disruption|vandalism/i;
  const BLOCKED_REMOTE_IMAGE_HOSTS = new Set([
    "cdn.newsday.com",
    "www.easthamptonstar.com"
  ]);
  const BLOCKED_REMOTE_IMAGE_TAG_PATTERN = /<img\b(?=[^>]*https?:\/\/(?:cdn\.newsday\.com|www\.easthamptonstar\.com)\b)[^>]*>/gi;
  const INTERNAL_LINK_MATCHER_CACHE = new WeakMap();
  const INTERNAL_LINK_IGNORED_LABELS = new Set(["home", "about", "blog", "map", "maps", "page"]);
  const INTERNAL_LINK_CURATED_ALIASES = Object.freeze({
    "lois-princess-nowedonah-hunter": ["Lois Hunter", "Lois Marie Hunter", "Princess Nowedonah"],
    "william-wallace-tooker": ["William Tooker", "Tooker"],
    "john-a-strong": ["John Strong"],
    "rev-paul-cuffee": ["Paul Cuffee", "Reverend Paul Cuffee"],
    "elizabeth-thunder-bird-haile-shinnecock": ["Elizabeth Haile", "Chee Chee"],
    "mary-rebecca-bunn-aunt-becky": ["Mary Rebecca Bunn", "Aunt Becky"],
    "stephen-talkhouse-pharoah": ["Stephen Talkhouse", "Talkhouse"],
    "chief-mahue-mayhew-of-unkechaug": ["Mahue", "Mahew", "Mayhew", "John Mahue"],
    "cockenoe": ["Cockenow", "Cheekanoo", "Chekkonnow", "Cheknow", "Chegonoe"],
    "myth-of-the-thirteen-tribes": ["thirteen tribes myth", "13 tribes myth"],
    "algonquian-language-and-place-names": ["Algonquian place names"],
    "indigenous-whaling-and-maritime-labor": ["Indigenous whaling", "Shinnecock whaling"],
    "shinnecock-ancestral-land": ["Shinnecock"]
  });

  function publicFacingWorkflowTextCleanup(value) {
    return String(value || "")
      .replace(/,\s*a public-safe way to explain ([^.]+?) without mapping private or sacred-use details/gi, ", a careful account of $1 while keeping sensitive place details private")
      .replace(/\ba public-safe way to explain\b/gi, "a careful account of")
      .replace(/\bpublic-safe way to explain\b/gi, "careful account of")
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
      .replace(/\bsource trails\b/gi, "source materials")
      .replace(/\bsource trail\b/gi, "source material")
      .replace(/\bwithout mapping private or sacred-use details\b/gi, "while keeping sensitive place details private");
  }

  function isBlockedRemoteImageUrl(value) {
    const raw = String(value || "").trim();
    if (!raw || raw.startsWith("/") || raw.startsWith("#")) return false;
    try {
      const url = new URL(raw, window.location.href);
      return BLOCKED_REMOTE_IMAGE_HOSTS.has(url.hostname.toLowerCase());
    } catch {
      return false;
    }
  }

  function safeExternalUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      const url = new URL(raw, window.location.href);
      if (url.protocol !== "http:" && url.protocol !== "https:") return "";
      if (url.username || url.password) return "";
      return url.href;
    } catch {
      return "";
    }
  }

  function baseClean(value, options = {}) {
    const convertImportedFootnotes = options.convertImportedFootnotes || (text => String(text || ""));
    const source = options.convertFootnotes === false ? String(value || "") : convertImportedFootnotes(value);
    let html = publicFacingWorkflowTextCleanup(source)
      .replace(/This map feature is imported from WP Go Maps but is not paired to a complete Directus listing yet\.?/gi, "")
      .replace(/This map feature is imported from WP Go Maps but is not paired to a Directus listing yet\.?/gi, "")
      .replace(/This map feature is imported from WP Go Maps but is not paired to (?:a complete )?[^.]*listing yet\.?/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(BLOCKED_REMOTE_IMAGE_TAG_PATTERN, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/\sdata-src=/gi, " src=");
    if (options.mode === "desktop") {
      html = html
        .replace(/<form[\s\S]*?<\/form>/gi, "")
        .replace(/<svg[\s\S]*?<\/svg>/gi, "")
        .replace(/\s+src=["']data:image\/gif[^"']*["']/gi, "")
        .replace(/\[(?!\d+\.)[^\]]+\]/g, "")
        .replace(/&#8211;/g, "-")
        .replace(/&#8216;|&#8217;|&rsquo;/g, "'")
        .replace(/&#8220;|&#8221;|&quot;/g, "\"")
        .replace(/&#038;|&amp;/g, "&")
        .replace(/&hellip;/g, "...")
        .replace(/\sdata-srcset=/gi, " srcset=");
    } else {
      html = html.replace(/\[[^\]]+\]/g, "");
    }
    return html;
  }

  function cleanHtml(value, options = {}) {
    const template = document.createElement("template");
    template.innerHTML = baseClean(value, options);
    if (options.mode === "desktop") cleanDesktopTemplate(template, options);
    else cleanMobileTemplate(template, options);
    return template.innerHTML;
  }

  function cleanDesktopTemplate(template, options) {
    const allowedTags = options.allowedTags || DESKTOP_ALLOWED_TAGS;
    const allowedAttrs = options.allowedAttrs || DESKTOP_ALLOWED_ATTRS;
    const rewriteMediaUrl = options.rewriteMediaUrl || (value => value);
    const internalHref = options.internalHref || (() => "");
    const isMediaUrl = options.isMediaUrl || (() => false);
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
    const unwrap = [];
    while (walker.nextNode()) {
      const element = walker.currentNode;
      if (!allowedTags.has(element.tagName)) {
        unwrap.push(element);
        continue;
      }
      for (const attr of [...element.attributes]) {
        if (!allowedAttrs.has(attr.name.toLowerCase())) element.removeAttribute(attr.name);
      }
      if (element.tagName === "IMG") {
        const src = element.getAttribute("src") || "";
        if (!src || src.startsWith("data:image/gif") || isBlockedRemoteImageUrl(src)) {
          element.remove();
          continue;
        }
        element.setAttribute("src", rewriteMediaUrl(src));
        element.setAttribute("loading", "lazy");
        element.setAttribute("decoding", "async");
      }
      if (element.tagName === "IFRAME") {
        const src = element.getAttribute("src") || element.getAttribute("data-src") || "";
        if (!/^https:\/\/www\.youtube\.com\/embed\//i.test(src)) {
          element.remove();
          continue;
        }
        element.setAttribute("src", src);
        element.removeAttribute("data-src");
        element.setAttribute("loading", "lazy");
      }
      if (element.tagName === "A") {
        const rawHref = element.getAttribute("href");
        const href = internalHref(rawHref);
        if (href) {
          element.setAttribute("href", href);
          element.removeAttribute("target");
          element.removeAttribute("rel");
        } else if (isMediaUrl(rawHref)) {
          const mediaHref = safeExternalUrl(rewriteMediaUrl(rawHref));
          if (mediaHref) element.setAttribute("href", mediaHref);
          else element.removeAttribute("href");
        } else {
          const externalHref = safeExternalUrl(rawHref);
          if (externalHref) element.setAttribute("href", externalHref);
          else element.removeAttribute("href");
          element.target = "_blank";
          element.rel = "noopener noreferrer";
        }
      }
    }
    for (const element of unwrap) element.replaceWith(...element.childNodes);
  }

  function cleanMobileTemplate(template, options) {
    const allowedTags = options.allowedTags || DESKTOP_ALLOWED_TAGS;
    const allowedAttrs = options.allowedAttrs || DESKTOP_ALLOWED_ATTRS;
    const rewriteMediaUrl = options.rewriteMediaUrl || (value => value);
    const internalHref = options.internalHref || (() => "");
    const cleanImageUrl = options.cleanImageUrl || (value => String(value || ""));
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
    const unwrap = [];
    while (walker.nextNode()) {
      const element = walker.currentNode;
      if (!allowedTags.has(element.tagName)) {
        unwrap.push(element);
        continue;
      }
      for (const attr of [...element.attributes]) {
        if (!allowedAttrs.has(attr.name.toLowerCase())) element.removeAttribute(attr.name);
      }
    }
    for (const element of unwrap) element.replaceWith(...element.childNodes);
    template.content.querySelectorAll("img").forEach(img => {
      const src = cleanImageUrl(img.getAttribute("src") || "");
      if (!src || isBlockedRemoteImageUrl(src)) img.remove();
      else {
        img.src = rewriteMediaUrl(src);
        img.loading = "lazy";
        img.decoding = "async";
      }
    });
    template.content.querySelectorAll("a").forEach(link => {
      const rawHref = link.getAttribute("href");
      const internal = internalHref(rawHref);
      if (internal) {
        link.setAttribute("href", internal);
        link.removeAttribute("target");
        link.removeAttribute("rel");
        link.dataset.internalLink = "true";
      } else {
        const externalHref = safeExternalUrl(rawHref);
        if (externalHref) link.setAttribute("href", externalHref);
        else link.removeAttribute("href");
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    });
    template.content.querySelectorAll("iframe").forEach(frame => {
      const src = frame.getAttribute("src") || "";
      if (!/^https:\/\/www\.youtube\.com\/embed\//i.test(src)) frame.remove();
      else frame.loading = "lazy";
    });
  }

  function normalizeImportedText(value) {
    return String(value || "")
      .replace(/\\+(?=(?:&(?:quot|#0?39|apos|amp|nbsp|rsquo|lsquo|ldquo|rdquo);)|["'])/gi, "")
      .replace(/\\{2,}/g, "\\")
      .replace(/Ã‚Â /g, " ")
      .replace(/Ã‚/g, "")
      .replace(/Ã¢â‚¬â„¢|&#8217;|&rsquo;/g, "'")
      .replace(/Ã¢â‚¬Ëœ|&#8216;|&lsquo;/g, "'")
      .replace(/Ã¢â‚¬Å“|&#8220;|&ldquo;/g, "\"")
      .replace(/Ã¢â‚¬Â|&#8221;|&rdquo;/g, "\"")
      .replace(/Ã¢â‚¬â€œ|&#8211;/g, "-")
      .replace(/Ã¢â‚¬â€|&#8212;/g, "-")
      .replace(/&quot;/g, "\"")
      .replace(/&#0?39;|&apos;/g, "'")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/\.{2,}/g, ".")
      .replace(/\s+/g, " ");
  }

  function convertImportedFootnotes(value, options = {}) {
    const escapeHtml = options.escapeHtml || (text => String(text || ""));
    const normalize = options.normalizeImportedText || normalizeImportedText;
    return normalize(value).replace(/\[(\d+)\.\s*([^\]]{8,300})\]/g, (_, number, note) => {
      const cleanNote = escapeHtml(normalize(note).trim());
      return `<sup class="footnote-ref" title="${cleanNote}">${number}</sup>`;
    });
  }

  function stripHtml(value, options = {}) {
    const div = document.createElement("div");
    const convert = options.convertImportedFootnotes || (text => String(text || ""));
    div.innerHTML = convert(value)
      .replace(/This map feature is imported from WP Go Maps but is not paired to (?:a complete )?[^.]*listing yet\.?/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(BLOCKED_REMOTE_IMAGE_TAG_PATTERN, "")
      .replace(/\[(caption|gallery|vc_|et_|wpsm|perfectpullquote)[^\]]*\]/gi, "")
      .replace(/\[\/(caption|gallery|vc_|et_|wpsm|perfectpullquote)\]/gi, "")
      .replace(/&nbsp;/gi, " ");
    return div.textContent.replace(/\s+/g, " ").trim();
  }

  function publicCleanText(value, options = {}) {
    const normalize = options.normalizeImportedText || normalizeImportedText;
    const strip = options.stripHtml || stripHtml;
    const cleaned = normalize(value)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<sup[\s\S]*?<\/sup>/gi, " ")
      .replace(/\[(?:caption|gallery|embed|video|audio|playlist|wpvideo|vc_[^\]]*|et_[^\]]*|wpsm[^\]]*)[^\]]*\]/gi, " ")
      .replace(/\[\/(?:caption|gallery|embed|video|audio|playlist|wpvideo|vc_[^\]]*|et_[^\]]*|wpsm[^\]]*)\]/gi, " ")
      .replace(/\[(\d+)\.\s*([^\]]{8,300})\]/g, " ");
    return publicFacingWorkflowTextCleanup(strip(cleaned))
      .replace(/This map feature is imported from WP Go Maps but is not paired to a complete Directus listing yet\.?/gi, "")
      .replace(/This map feature is imported from WP Go Maps but is not paired to a Directus listing yet\.?/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizedRepeatText(value) {
    if (value?.nodeType) {
      return String(value.textContent || "")
        .normalize("NFKD")
        .toLowerCase()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    return String(template.content?.textContent || template.textContent || "")
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function repeatedTextMatch(left, right, options = {}) {
    const minimumLength = Math.max(20, Number(options.minimumLength || 36));
    const leftText = normalizedRepeatText(left);
    const rightText = normalizedRepeatText(right);
    if (!leftText || !rightText || Math.min(leftText.length, rightText.length) < minimumLength) return false;
    if (leftText === rightText) return true;
    const shorter = leftText.length <= rightText.length ? leftText : rightText;
    const longer = leftText.length > rightText.length ? leftText : rightText;
    return shorter.length >= 90
      && shorter.length / longer.length >= 0.94
      && longer.includes(shorter);
  }

  function safeRepeatedContentBlock(element) {
    if (!element?.matches?.("p, div, section, article, blockquote, li")) return false;
    return !element.querySelector("img, picture, video, audio, iframe, form, table, button, input, textarea, select, canvas, svg");
  }

  // Content editors often keep a short summary and repeat it as the first rich-text
  // block. Render the summary once, and remove only an identical leading block or
  // an immediately adjacent duplicate. Repeated references later in an article are
  // intentionally preserved because they may carry legitimate historical context.
  function removeRepeatedContent(value, options = {}) {
    const html = String(value || "");
    if (!html) return "";
    const template = document.createElement("template");
    template.innerHTML = html;
    const root = template.content;
    const leadTexts = (Array.isArray(options.leadTexts) ? options.leadTexts : [options.leadText])
      .map(normalizedRepeatText)
      .filter(Boolean);

    const firstElement = [...root.children].find(element => normalizedRepeatText(element).length > 0);
    if (firstElement && safeRepeatedContentBlock(firstElement)) {
      const firstText = normalizedRepeatText(firstElement);
      if (leadTexts.some(lead => repeatedTextMatch(firstText, lead, options))) firstElement.remove();
    }

    if (options.removeAdjacent !== false) {
      const removeAdjacentRepeats = parent => {
        let previous = null;
        for (const child of [...parent.children]) {
          removeAdjacentRepeats(child);
          if (!safeRepeatedContentBlock(child)) {
            previous = null;
            continue;
          }
          const text = normalizedRepeatText(child);
          if (!text) continue;
          if (previous && repeatedTextMatch(previous, text, options)) {
            child.remove();
            continue;
          }
          previous = text;
        }
      };
      removeAdjacentRepeats(root);
    }
    return template.innerHTML.trim();
  }

  function sourceReferences(item = {}) {
    const sources = Array.isArray(item?.source_list)
      ? item.source_list.filter(source => source?.title || source?.citation || source?.url)
      : [];
    const biographyCitation = publicCleanText(item?.biography_source_citation || "");
    if (!sources.length && biographyCitation) {
      return [{ title: "Sources", citation: biographyCitation, url: item?.source_url || "" }];
    }
    if (!sources.length && item?.source_url) return [{ title: "Source", url: item.source_url }];
    return sources;
  }

  function sourceReferenceHtml(source = {}, options = {}) {
    const escape = options.escapeHtml || (value => String(value ?? ""));
    const cleanText = options.cleanText || (value => publicCleanText(value));
    const title = source?.title || source?.citation || "Reference";
    const type = [source?.source_type, source?.year].filter(Boolean).join(" - ");
    const context = cleanText(source?.citation_context || "");
    const citation = cleanText(source?.citation || "");
    const body = context || citation;
    const sourceUrl = safeExternalUrl(source?.url);
    const titleHtml = sourceUrl
      ? `<a href="${escape(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escape(title)}</a>`
      : escape(title);
    return `
        <article class="source-reference-card">
          <strong>${titleHtml}</strong>
          ${type ? `<span>${escape(type)}</span>` : ""}
          ${body ? `<p>${escape(body)}</p>` : ""}
        </article>
      `;
  }

  function sourceReferenceTextHtml(value, options = {}) {
    const escape = options.escapeHtml || (text => String(text ?? ""));
    const text = String(value || "");
    const urlPattern = /(https?:\/\/[^\s<>"']+)/gi;
    let cursor = 0;
    let html = "";
    for (const match of text.matchAll(urlPattern)) {
      html += escape(text.slice(cursor, match.index)).replace(/\r?\n/g, "<br>");
      const url = match[0];
      html += `<a class="timeline-source-link" href="${escape(url)}" target="_blank" rel="noreferrer">${escape(url)}</a>`;
      cursor = Number(match.index) + url.length;
    }
    html += escape(text.slice(cursor)).replace(/\r?\n/g, "<br>");
    return html;
  }

  function sourcesEvidenceHtml(item = {}, options = {}) {
    const escape = options.escapeHtml || (value => String(value ?? ""));
    const sources = Array.isArray(options.sources) ? options.sources : sourceReferences(item);
    const limit = Math.max(1, Number(options.limit || 12));
    const metaClass = options.metaClass || "article-meta";
    const editedLabel = options.editedLabel || "";
    const renderSource = typeof options.sourceReferenceHtml === "function"
      ? options.sourceReferenceHtml
      : source => sourceReferenceHtml(source, options);
    return `
        <section class="section sources-section">
          ${sources.length ? `
            <h3>References</h3>
            <div class="source-reference-list">
              ${sources.slice(0, limit).map(renderSource).join("")}
            </div>
          ` : ""}
          <p class="${escape(metaClass)}">Last edited: ${escape(editedLabel)}. Sources and entries are periodically reviewed.</p>
        </section>
      `;
  }

  function shouldRenderSectionTimeline(title = "") {
    return TIMELINE_SECTION_TITLE_PATTERN.test(String(title || ""));
  }

  function normalizedInternalLinkLabel(value) {
    return String(value || "")
      .replace(/^Private:\s*/i, "")
      .replace(/&nbsp;|\u00a0/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function internalLinkLabelAllowed(value) {
    const label = normalizedInternalLinkLabel(value);
    return label.length >= 4
      && !INTERNAL_LINK_IGNORED_LABELS.has(label.toLowerCase())
      && !/^[0-9\s.,–—-]+$/.test(label);
  }

  function internalLinkLabelVariants(value) {
    const variants = new Set();
    const add = candidate => {
      const label = normalizedInternalLinkLabel(candidate);
      if (internalLinkLabelAllowed(label)) variants.add(label);
    };
    const label = normalizedInternalLinkLabel(value);
    add(label);
    add(label.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"));
    if (/["']/.test(label)) {
      add(label
        .replace(/"([^"\r\n]+)"/g, "“$1”")
        .replace(/([A-Za-z])'([A-Za-z])/g, "$1’$2"));
    }
    return [...variants];
  }

  function plainInternalLinkText(value) {
    return String(value || "")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&quot;/gi, '"')
      .replace(/&#0?39;|&apos;/gi, "'")
      .replace(/&amp;/gi, "&")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function biographyLeadAlias(item = {}) {
    const summary = plainInternalLinkText(item.summary);
    const lead = summary.match(/^(.{2,90}?)(?=,\s+(?:also|a|an|the)\b|\s+(?:was|is|were|are)\b)/i)?.[1] || "";
    const words = normalizedInternalLinkLabel(lead).split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 8 || /[.!?;:]/.test(lead)) return "";
    return lead;
  }

  function internalLinkAliases(item = {}, options = {}) {
    const aliases = new Set();
    const title = normalizedInternalLinkLabel(item.title);
    const add = value => internalLinkLabelVariants(value).forEach(label => aliases.add(label));
    const addDerived = value => {
      const label = normalizedInternalLinkLabel(value);
      if (!label) return;
      add(label);
      add(label.replace(/^(?:Chief|Sachem|Sagamore|Rev\.?|Reverend|Princess)\s+/i, ""));
      add(label.replace(/\s+of\s+(?:the\s+)?(?:Unkechaug|Montaukett|Setauket|Secatogue|Manhassets?|Shinnecock|Rockaway|Canarsie|Nissequogue)\s*$/i, ""));
      const withoutParenthetical = normalizedInternalLinkLabel(label.replace(/\s*\([^)]{2,100}\)\s*/g, " "));
      if (withoutParenthetical && withoutParenthetical !== label) {
        add(withoutParenthetical);
        add(withoutParenthetical.replace(/^(?:Chief|Sachem|Sagamore|Rev\.?|Reverend|Princess)\s+/i, ""));
        add(withoutParenthetical.replace(/\s+of\s+(?:the\s+)?(?:Unkechaug|Montaukett|Setauket|Secatogue|Manhassets?|Shinnecock|Rockaway|Canarsie|Nissequogue)\s*$/i, ""));
      }
    };

    add(title);
    addDerived(title.replace(/\s*[“"][^”"\r\n]{2,80}[”"]\s*/g, " "));
    addDerived(title.replace(/\s*\([^)]{2,100}\)\s*/g, " "));
    for (const match of title.matchAll(/\(([^)]{2,80})\)/g)) {
      const parenthetical = match[1].trim();
      const communityQualifier = /^(?:Shinnecock|Unkechaug|Montaukett|Setauket|Secatogue|Manhansett|Matinecock|Rockaway|Canarsie|Nissequogue)$/i.test(parenthetical);
      const isAlternateName = /\s+\/\s+/.test(title) || (options.biography && !communityQualifier);
      if (isAlternateName && !/,/.test(parenthetical) && parenthetical.split(/\s+/).length <= 7) addDerived(parenthetical);
    }
    title.split(/\s+\/\s+|:\s+/).forEach(addDerived);

    if (options.biography) addDerived(biographyLeadAlias(item));
    (INTERNAL_LINK_CURATED_ALIASES[item.slug] || []).forEach(addDerived);
    return [...aliases].filter(label => label.toLowerCase() !== title.toLowerCase());
  }

  function buildInternalLinkTerms(options = {}) {
    const biographySlugs = new Set(options.biographySlugs || []);
    const buckets = new Map();
    const add = (label, href, priority, exact = false) => {
      const normalized = normalizedInternalLinkLabel(label);
      if (!internalLinkLabelAllowed(normalized) || !href) return;
      const key = normalized.toLowerCase();
      if (!buckets.has(key)) buckets.set(key, new Map());
      const candidates = buckets.get(key);
      const current = candidates.get(href);
      const candidate = { label: normalized, href, priority, exact };
      if (!current || Number(exact) > Number(current.exact) || priority < current.priority) candidates.set(href, candidate);
    };
    const addRecord = (item, href, priority, recordOptions = {}) => {
      if (!item?.title || !item?.slug) return;
      internalLinkLabelVariants(item.title).forEach(label => add(label, href, priority, true));
      internalLinkAliases(item, recordOptions).forEach(label => add(label, href, priority, false));
    };
    (options.sites || []).forEach(item => addRecord(item, `#listing/${item.slug}`, 1));
    (options.wikiArticles || []).forEach(item => addRecord(item, `#wiki/${item.slug}`, 2, {
      biography: biographySlugs.has(item.slug)
    }));
    (options.siteContent || []).forEach(item => addRecord(item, `#page/${item.slug}`, 3));
    (options.blogPosts || []).forEach(item => addRecord(item, `#blog/${item.slug}`, 4));

    const terms = [];
    for (const candidates of buckets.values()) {
      const values = [...candidates.values()];
      const exact = values.filter(candidate => candidate.exact);
      if (exact.length) {
        terms.push(exact.sort((a, b) => a.priority - b.priority)[0]);
      } else if (values.length === 1) {
        terms.push(values[0]);
      }
    }
    return terms.sort((a, b) => b.label.length - a.label.length || a.priority - b.priority || a.label.localeCompare(b.label));
  }

  function indexOfInternalLinkTerm(value, term, fromIndex = 0) {
    const text = String(value || "").toLowerCase();
    const needle = String(term || "").toLowerCase();
    let index = text.indexOf(needle, Math.max(0, Number(fromIndex) || 0));
    while (index >= 0) {
      const before = index ? text[index - 1] : "";
      const after = text[index + needle.length] || "";
      if (!/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after)) return index;
      index = text.indexOf(needle, index + 1);
    }
    return -1;
  }

  function escapeInternalLinkPattern(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function compileInternalLinkMatcher(terms = []) {
    if (!Array.isArray(terms) || !terms.length) return { regex: null, termsByInitial: new Map() };
    const cached = INTERNAL_LINK_MATCHER_CACHE.get(terms);
    if (cached) return cached;
    const unique = new Map();
    terms.forEach(term => {
      const label = normalizedInternalLinkLabel(term?.label);
      if (!label || !term?.href) return;
      const key = label.toLowerCase();
      if (!unique.has(key)) unique.set(key, { ...term, label, normalizedLabel: key });
    });
    const sorted = [...unique.values()].sort((a, b) => b.label.length - a.label.length || a.label.localeCompare(b.label));
    const termsByInitial = new Map();
    sorted.forEach(term => {
      const initial = term.normalizedLabel[0] || "";
      if (!termsByInitial.has(initial)) termsByInitial.set(initial, []);
      termsByInitial.get(initial).push(term);
    });
    const source = sorted.map(term => escapeInternalLinkPattern(term.label)).join("|");
    const matcher = {
      regex: source ? new RegExp(`(?<![A-Za-z0-9])(?:${source})(?![A-Za-z0-9])`, "gi") : null,
      termsByInitial
    };
    INTERNAL_LINK_MATCHER_CACHE.set(terms, matcher);
    return matcher;
  }

  function internalLinkTermAt(value, index, term) {
    const text = String(value || "");
    const before = index ? text[index - 1] : "";
    const after = text[index + term.label.length] || "";
    return !/[a-z0-9]/i.test(before)
      && !/[a-z0-9]/i.test(after)
      && text.slice(index, index + term.label.length).toLowerCase() === term.normalizedLabel;
  }

  function nextInternalLinkMatch(value, matcher, options = {}) {
    const text = String(value || "");
    const regex = matcher?.regex;
    if (!regex) return null;
    const used = options.used || new Set();
    const excludeHref = options.excludeHref || "";
    regex.lastIndex = Math.max(0, Number(options.fromIndex) || 0);
    let match;
    while ((match = regex.exec(text))) {
      const candidates = matcher.termsByInitial.get((match[0][0] || "").toLowerCase()) || [];
      const term = candidates.find(candidate => (
        candidate.href !== excludeHref
        && !used.has(candidate.href)
        && internalLinkTermAt(text, match.index, candidate)
      ));
      if (term) return { index: match.index, term };
      // A longer match may already be used while a shorter or overlapping project
      // term is still eligible. Resume one character later to preserve the original
      // first-reference behavior without rescanning the full catalog.
      regex.lastIndex = match.index + 1;
    }
    return null;
  }

  function linkInternalTextNodes(root, options = {}) {
    const terms = Array.isArray(options.terms) ? options.terms : [];
    const ownerDocument = root?.ownerDocument || (root?.nodeType === 9 ? root : document);
    if (!root || !ownerDocument?.createTreeWalker || !terms.length) return 0;
    const used = options.used || new Set();
    const excludeHref = options.excludeHref || "";
    const skipSelector = [
      "a", "button", "h1", "h2", "h3", "h4", "code", "pre", ".timeline-year",
      options.skipSelector || ""
    ].filter(Boolean).join(", ");
    if (options.seedExistingLinks) {
      root.querySelectorAll?.('a[href^="#listing/"], a[href^="#wiki/"], a[href^="#page/"], a[href^="#blog/"]')
        .forEach(link => {
          const href = link.getAttribute("href") || "";
          if (href && href !== excludeHref) used.add(href);
        });
    }
    const rootText = String(root.textContent || "").toLowerCase();
    // Compiling and running one regular expression containing every site and
    // knowledgebase title made text-only biographies take several seconds to
    // open. Narrow the matcher to labels that actually occur in this article;
    // boundary and first-reference rules are still enforced below.
    const relevantTerms = terms.filter(term => {
      const label = String(term?.label || "").toLowerCase();
      return label && rootText.includes(label);
    });
    if (!relevantTerms.length) return 0;
    const walker = ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement?.closest(skipSelector)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    const matcher = compileInternalLinkMatcher(relevantTerms);
    let linkedCount = 0;
    for (const node of textNodes) {
      const text = node.nodeValue;
      const fragment = ownerDocument.createDocumentFragment();
      let cursor = 0;
      let linked = false;
      while (cursor < text.length) {
        const best = nextInternalLinkMatch(text, matcher, { fromIndex: cursor, used, excludeHref });
        if (!best) break;
        if (best.index > cursor) fragment.appendChild(ownerDocument.createTextNode(text.slice(cursor, best.index)));
        const link = ownerDocument.createElement("a");
        link.href = best.term.href;
        link.textContent = text.slice(best.index, best.index + best.term.label.length);
        fragment.appendChild(link);
        used.add(best.term.href);
        cursor = best.index + best.term.label.length;
        linked = true;
        linkedCount += 1;
      }
      if (!linked) continue;
      if (cursor < text.length) fragment.appendChild(ownerDocument.createTextNode(text.slice(cursor)));
      node.replaceWith(fragment);
    }
    return linkedCount;
  }

  function autoLinkHtml(html, options = {}) {
    const template = document.createElement("template");
    template.innerHTML = html || "";
    linkInternalTextNodes(template.content, options);
    return template.innerHTML;
  }

  function linkInternalReferences(root, options = {}) {
    return linkInternalTextNodes(root, { ...options, seedExistingLinks: true });
  }

  function cleanupBiographyArticleHtml(html, options = {}) {
    if (!options.enabled || !html) return html;
    const ownerDocument = options.document || window.document;
    if (!ownerDocument?.createElement) return html;
    const cleanText = typeof options.cleanText === "function"
      ? options.cleanText
      : value => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const elementNode = ownerDocument.defaultView?.Node?.ELEMENT_NODE || 1;
    const template = ownerDocument.createElement("template");
    template.innerHTML = String(html || "");
    [...template.content.querySelectorAll("h2, h3")].forEach(heading => {
      const label = cleanText(heading.textContent || "");
      const isIntroHeading = /^introduction$/i.test(label);
      const isDuplicateSection = /^(places connected|connected places|places|why this matters)$/i.test(label);
      if (!isIntroHeading && !isDuplicateSection) return;
      const level = Number(heading.tagName.replace(/^H/i, "")) || 2;
      let node = heading.nextSibling;
      heading.remove();
      if (isIntroHeading) return;
      while (node) {
        const next = node.nextSibling;
        const isBoundary = node.nodeType === elementNode
          && /^H[1-6]$/i.test(node.tagName || "")
          && (Number(node.tagName.replace(/^H/i, "")) || 2) <= level;
        if (isBoundary) break;
        node.remove();
        node = next;
      }
    });
    return template.innerHTML.trim();
  }

  function firstCompleteSentences(text, maxSentences = 2, maxLength = 260, cleanText = publicCleanText) {
    const cleaned = cleanText(text || "")
      .replace(/\s+/g, " ")
      .replace(/\b[A-Z]{1,2}\d{2,}\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned) return "";
    const sentences = cleaned.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [];
    const chosen = sentences.slice(0, maxSentences).join(" ").replace(/\s+/g, " ").trim();
    if (chosen && chosen.length <= maxLength) return chosen;
    if (chosen) return chosen.slice(0, maxLength).replace(/\s+\S*$/, "").trim() + ".";
    if (cleaned.length <= maxLength) return `${cleaned}.`;
    return cleaned.slice(0, maxLength).replace(/\s+\S*$/, "").trim() + ".";
  }

  function isInternalKnowledgebaseProcessNote(value = "", stripText = stripHtml) {
    return /source-supported biography|on this site knowledgebase|inline footnotes|public-safe context/i.test(stripText(value || ""));
  }

  function publicWikiSummary(article = {}, options = {}) {
    const stripText = typeof options.stripText === "function" ? options.stripText : stripHtml;
    const cleanText = typeof options.cleanText === "function" ? options.cleanText : publicCleanText;
    const summary = article.summary || "";
    if (!isInternalKnowledgebaseProcessNote(summary, stripText)) return summary;
    const fallback = firstCompleteSentences(article.content || article.why_this_matters || "", 2, 300, cleanText);
    return fallback && !isInternalKnowledgebaseProcessNote(fallback, stripText) ? fallback : "";
  }

  window.NLI_HTML_UTILS = {
    normalizeImportedText,
    convertImportedFootnotes,
    stripHtml,
    publicCleanText,
    publicFacingWorkflowTextCleanup,
    safeExternalUrl,
    sourceReferences,
    sourceReferenceHtml,
    sourceReferenceTextHtml,
    sourcesEvidenceHtml,
    shouldRenderSectionTimeline,
    internalLinkAliases,
    buildInternalLinkTerms,
    indexOfInternalLinkTerm,
    compileInternalLinkMatcher,
    nextInternalLinkMatch,
    autoLinkHtml,
    linkInternalReferences,
    cleanupBiographyArticleHtml,
    firstCompleteSentences,
    isInternalKnowledgebaseProcessNote,
    publicWikiSummary,
    normalizedRepeatText,
    repeatedTextMatch,
    removeRepeatedContent,
    cleanHtml
  };
}());
