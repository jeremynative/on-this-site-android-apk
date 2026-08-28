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
    cleanHtml
  };
}());
