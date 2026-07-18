(function () {
  const MAX_QUOTE_LENGTH = 520;
  const MAX_CONTEXT_LENGTH = 320;
  const QUOTE_BLOCKED_SELECTOR_PARTS = [
    "a",
    "button",
    "input",
    "textarea",
    "select",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    ".discussion-section",
    ".quote-selection-popup"
  ];
  const COMPACT_HEADER_CONTEXT_SELECTOR = [
    ".eyebrow",
    ".article-kicker",
    ".panel-kicker",
    ".section-kicker",
    "h1",
    "h2",
    ".article-title",
    ".detail-title",
    ".panel-title",
    ".site-title",
    ".wiki-title",
    ".article-meta",
    ".detail-meta",
    ".summary",
    ".article-summary",
    ".feature-note",
    ".address-territory",
    ".article-meta-link",
    ".detail-territory-link",
    ".site-tag-chip",
    ".site-tag",
    "[data-site-territory-slug]",
    "[data-site-tag-label]",
    "[data-quote-header-context]"
  ].join(",");

  function cleanQuoteText(value = "") {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_QUOTE_LENGTH);
  }

  function cleanContextText(value = "") {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\s+[-|]\s+$/, "")
      .trim()
      .slice(0, MAX_CONTEXT_LENGTH);
  }

  function escapeHtml(value = "") {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function formatQuotedComment(quote = "", body = "", context = "") {
    const cleanedQuote = cleanQuoteText(quote);
    const cleanedBody = String(body || "").trim();
    const cleanedContext = cleanContextText(context);
    if (!cleanedQuote) return cleanedBody;
    const quoteLines = cleanedQuote.split(/\n+/).map(line => `> ${line.trim()}`).join("\n");
    const contextLine = cleanedContext ? `[Quote context: ${cleanedContext}]` : "";
    return [quoteLines, contextLine, cleanedBody].filter(Boolean).join("\n\n");
  }

  function parseQuotedComment(value = "") {
    const original = String(value || "");
    const lines = original.replace(/^\s+/, "").split(/\r?\n/);
    if (!/^>\s?/.test(lines[0] || "")) return { quote: "", body: original };
    const quoteLines = [];
    let index = 0;
    while (index < lines.length && /^>\s?/.test(lines[index] || "")) {
      quoteLines.push(lines[index].replace(/^>\s?/, "").trim());
      index += 1;
    }
    if ((lines[index] || "").trim() === "") index += 1;
    let context = "";
    const contextMatch = /^\[Quote context:\s*(.*?)\]\s*$/i.exec(lines[index] || "");
    if (contextMatch) {
      context = cleanContextText(contextMatch[1]);
      index += 1;
      if ((lines[index] || "").trim() === "") index += 1;
    }
    return {
      quote: cleanQuoteText(quoteLines.join(" ")),
      context,
      body: lines.slice(index).join("\n").trim()
    };
  }

  function parseCommentRecord(comment = {}) {
    return parseQuotedComment(comment?.comment || "");
  }

  function selectedQuoteText(root, blockedSelector = "") {
    const selection = window.getSelection?.();
    if (!root || !selection || selection.rangeCount === 0 || selection.isCollapsed) return "";
    const range = selection.getRangeAt(0);
    const common = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;
    if (!common || !root.contains(common)) return "";
    if (blockedSelector && common.closest?.(blockedSelector)) return "";
    return cleanQuoteText(selection.toString());
  }

  function selectionStartElement(root) {
    const selection = window.getSelection?.();
    if (!root || !selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    const start = range.startContainer?.nodeType === Node.ELEMENT_NODE
      ? range.startContainer
      : range.startContainer?.parentElement;
    return start && root.contains(start) ? start : null;
  }

  function hasBlockedAncestor(element, blockedSelector = "") {
    if (!element || !blockedSelector) return false;
    const ancestor = element.parentElement?.closest?.(blockedSelector);
    return Boolean(ancestor);
  }

  function selectedSectionTitle(root, blockedSelector = "") {
    const start = selectionStartElement(root);
    if (!start) return "";
    if (blockedSelector && start.closest?.(blockedSelector)) return "";
    const headings = [...root.querySelectorAll("h2,h3,h4,h5,h6,.section-heading,.section-title,[data-section-title]")]
      .filter(heading => !hasBlockedAncestor(heading, blockedSelector));
    let section = "";
    for (const heading of headings) {
      if (heading === start || heading.compareDocumentPosition(start) & Node.DOCUMENT_POSITION_FOLLOWING) {
        section = heading.dataset?.sectionTitle || heading.textContent.trim();
      }
    }
    return cleanContextText(section);
  }

  function selectedNearbyContext(root, blockedSelector = "") {
    const start = selectionStartElement(root);
    if (!start) return "";
    if (blockedSelector && start.closest?.(blockedSelector)) return "";
    const contextElement = start.closest?.("p, li, blockquote, figcaption, .historic-moment-body, .article-summary, .summary");
    const text = cleanContextText(contextElement?.textContent || "");
    const quote = cleanQuoteText(window.getSelection?.()?.toString?.() || "");
    if (!text || text.toLowerCase() === quote.toLowerCase()) return "";
    return text;
  }

  function selectedLocalSummary(root, blockedSelector = "") {
    const start = selectionStartElement(root);
    if (!start) return "";
    if (blockedSelector && start.closest?.(blockedSelector)) return "";
    const quote = cleanQuoteText(window.getSelection?.()?.toString?.() || "");
    const container = start.closest?.(".historic-moment, .timeline-item, .section.has-source, section, article");
    if (!container || !root.contains(container)) return "";
    const selector = ".historic-moment-body, .timeline-body, .section-content, p, li, blockquote, figcaption, .article-summary, .summary";
    const summary = [...container.querySelectorAll(selector)]
      .filter(element => !hasBlockedAncestor(element, blockedSelector))
      .map(element => cleanContextText(element.textContent || ""))
      .find(text => text && text.toLowerCase() !== quote.toLowerCase());
    return summary || "";
  }

  function selectedContainerContext(root, blockedSelector = "") {
    const start = selectionStartElement(root);
    if (!start) return "";
    if (blockedSelector && start.closest?.(blockedSelector)) return "";
    const container = start.closest?.(".historic-moment, .timeline-item, .section.has-source, section, article");
    if (!container || !root.contains(container)) return "";
    const selector = "h2,h3,h4,h5,h6,.section-heading,.section-title,[data-section-title],.historic-moment-date,.historic-moment-location,.timeline-year,.timeline-date,.timeline-label,.article-meta,.detail-meta";
    const parts = [...container.querySelectorAll(selector)]
      .filter(element => !hasBlockedAncestor(element, blockedSelector))
      .map(element => element.dataset?.sectionTitle || element.textContent || "");
    return quoteContext(parts);
  }

  function compactContextPart(value = "", limit = MAX_CONTEXT_LENGTH) {
    const text = cleanContextText(value);
    const max = Math.max(12, Number(limit) || MAX_CONTEXT_LENGTH);
    return text.length > max ? `${text.slice(0, Math.max(0, max - 3)).trim()}...` : text;
  }

  function quoteContext(parts = [], options = {}) {
    const limit = Math.max(40, Number(options.limit || MAX_CONTEXT_LENGTH));
    const separator = " - ";
    const unique = [];
    const seen = new Set();
    parts.map(cleanContextText).filter(Boolean).forEach(part => {
      const key = part.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(part);
    });
    const kept = [];
    let length = 0;
    for (const part of unique) {
      const prefix = kept.length ? separator.length : 0;
      const remaining = limit - length - prefix;
      if (remaining <= 0) break;
      const compact = compactContextPart(part, remaining);
      if (!compact) continue;
      kept.push(compact);
      length += prefix + compact.length;
    }
    return kept.join(separator);
  }

  function labeledContextPart(label = "", value = "", limit = 90) {
    const cleanedLabel = cleanContextText(label).replace(/[:\s]+$/g, "");
    const cleanedValue = compactContextPart(value, Math.max(20, limit - cleanedLabel.length - 2));
    if (!cleanedLabel || !cleanedValue) return cleanedValue || "";
    return `${cleanedLabel}: ${cleanedValue}`;
  }

  function headingLevel(element) {
    const match = String(element?.tagName || "").match(/^H([1-6])$/i);
    return match ? Number(match[1]) : 6;
  }

  function selectedHeadingTrail(root, blockedSelector = "") {
    const start = selectionStartElement(root);
    if (!start) return "";
    if (blockedSelector && start.closest?.(blockedSelector)) return "";
    const headings = [...root.querySelectorAll("h2,h3,h4,h5,h6,.section-heading,.section-title,[data-section-title]")]
      .filter(heading => !hasBlockedAncestor(heading, blockedSelector));
    const trail = [];
    for (const heading of headings) {
      if (!(heading === start || heading.compareDocumentPosition(start) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
      const level = headingLevel(heading);
      trail.length = Math.min(trail.length, Math.max(0, level - 2));
      trail[level - 2] = heading.dataset?.sectionTitle || heading.textContent.trim();
    }
    return quoteContext(trail);
  }

  function quoteBlockedSelector(extraSelectors = []) {
    const extras = Array.isArray(extraSelectors) ? extraSelectors : [extraSelectors];
    return [...new Set([...QUOTE_BLOCKED_SELECTOR_PARTS, ...extras].map(value => String(value || "").trim()).filter(Boolean))].join(", ");
  }

  function selectionContext(root, options = {}) {
    const blockedSelector = options.blockedSelector || quoteBlockedSelector(options.extraBlockedSelectors || []);
    const contextLimit = options.limit || MAX_CONTEXT_LENGTH;
    const headerContext = quoteContext([
      ...(options.parts || []).map(part => compactContextPart(part, 92)),
      compactContextPart(compactHeaderContext(root), 112)
    ], { limit: 156 });
    const sectionContext = quoteContext([
      compactContextPart(selectedHeadingTrail(root, blockedSelector), 84),
      compactContextPart(selectedSectionTitle(root, blockedSelector), 64),
      compactContextPart(selectedContainerContext(root, blockedSelector), 92)
    ], { limit: 140 });
    const nearbyContext = quoteContext([
      compactContextPart(selectedNearbyContext(root, blockedSelector), 112),
      compactContextPart(selectedLocalSummary(root, blockedSelector), 96)
    ], { limit: 132 });
    return quoteContext([
      labeledContextPart("Header section", headerContext, 172),
      labeledContextPart("Section header", sectionContext, 140),
      labeledContextPart("Nearby context", nearbyContext, 128)
    ], { limit: contextLimit });
  }

  function selectionPopupRect() {
    const selection = window.getSelection?.();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (!range) return null;
    const rect = range.getBoundingClientRect?.();
    const fallbackRect = range.getClientRects?.()?.[0];
    const popupRect = rect && (rect.width || rect.height) ? rect : fallbackRect;
    return popupRect && (popupRect.width || popupRect.height) ? popupRect : null;
  }

  function stripQuotedCommentPrefix(value = "") {
    return String(value || "").replace(/^>\s?.*(\n>\s?.*)*\n*/m, "").trim();
  }

  function contextIncludes(context = "", value = "") {
    const cleanedContext = cleanContextText(context).toLowerCase();
    const cleanedValue = cleanContextText(value).toLowerCase();
    return Boolean(cleanedContext && cleanedValue && cleanedContext.includes(cleanedValue));
  }

  function contextHasLabeledPart(context = "", label = "", value = "") {
    const cleanedContext = cleanContextText(context).toLowerCase();
    const labelKey = `${cleanContextText(label).replace(/[:\s]+$/g, "").toLowerCase()}:`;
    const valueKey = cleanContextText(value).toLowerCase();
    if (!cleanedContext || !labelKey || !cleanedContext.includes(labelKey)) return false;
    if (!valueKey) return true;
    const labelIndex = cleanedContext.indexOf(labelKey);
    return cleanedContext.slice(labelIndex + labelKey.length).includes(valueKey);
  }

  function labeledContextValue(context = "", label = "") {
    const cleanedContext = cleanContextText(context);
    const cleanedLabel = cleanContextText(label).replace(/[:\s]+$/g, "");
    if (!cleanedContext || !cleanedLabel) return "";
    const pattern = new RegExp(`${cleanedLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*([\\s\\S]*?)(?=\\s+-\\s+[A-Z][A-Za-z ]+:|$)`, "i");
    return cleanContextText(pattern.exec(cleanedContext)?.[1] || "");
  }

  function quoteCommentContextFields(commentText = "", fallback = {}) {
    const parsed = parseQuotedComment(commentText);
    const context = cleanContextText(parsed.context || "");
    if (!context && !parsed.quote) return {};
    const savedContext = quoteCommentDisplayContext({
      source_type: fallback.source_type,
      source_title: fallback.source_title,
      source_section: fallback.source_section,
      section_title: fallback.section_title,
      source_section_key: fallback.source_section_key,
      location_label: fallback.location_label,
      date_label: fallback.date_label,
      source_excerpt: fallback.source_excerpt,
      citation: fallback.citation
    }, context);
    return {
      quote_context: savedContext || context || null,
      source_section: labeledContextValue(savedContext, "Section header") || labeledContextValue(context, "Section header") || null,
      source_excerpt: labeledContextValue(savedContext, "Nearby context") || labeledContextValue(context, "Nearby context") || parsed.quote || null
    };
  }

  function sourceTypeLabel(value = "") {
    const type = cleanContextText(value).toLowerCase();
    if (type === "wiki") return "Knowledgebase article";
    if (type === "site") return "Site page";
    if (type === "blog") return "Blog post";
    if (type === "event") return "Event page";
    return "";
  }

  function quoteCommentDisplayContext(comment = {}, context = "") {
    const savedContext = cleanContextText(context || comment.quote_context || comment.context || "");
    const headerValue = comment.source_title || comment.site_title || comment.title || "";
    const headerWithType = quoteContext([sourceTypeLabel(comment.source_type), headerValue], { limit: 132 });
    const sectionValue = quoteContext([
      comment.source_section,
      comment.section_title,
      comment.source_section_key
    ], { limit: 112 });
    const nearbyValue = quoteContext([
      comment.location_label,
      comment.date_label,
      comment.source_excerpt,
      comment.citation
    ], { limit: 132 });
    const headerContext = labeledContextPart(
      "Header section",
      contextHasLabeledPart(savedContext, "Header section", headerValue) ? "" : headerWithType,
      172
    );
    const sectionContext = labeledContextPart(
      "Section header",
      contextHasLabeledPart(savedContext, "Section header", sectionValue) ? "" : sectionValue,
      140
    );
    const nearbyContext = labeledContextPart(
      "Nearby context",
      contextHasLabeledPart(savedContext, "Nearby context", nearbyValue) ? "" : nearbyValue,
      128
    );
    return quoteContext([savedContext, headerContext, sectionContext, nearbyContext], { limit: 320 });
  }

  function quoteCommentContextHtml(context = "") {
    const displayContext = cleanContextText(context);
    if (!displayContext) return "";
    const parts = ["Header section", "Section header", "Nearby context"]
      .map(label => ({ label, value: labeledContextValue(displayContext, label) }))
      .filter(part => part.value);
    if (!parts.length) {
      return `<small class="comment-quote-context">${escapeHtml(displayContext)}</small>`;
    }
    return `
            <small class="comment-quote-context">
              ${parts.map(part => `<i><b>${escapeHtml(part.label)}:</b> ${escapeHtml(part.value)}</i>`).join("")}
            </small>
          `;
  }

  function quoteCommentButtonHtml(comment = {}, quote = "", context = "") {
    if (!quote) return "";
    const displayContext = quoteCommentDisplayContext(comment, context);
    return `
        <button class="comment-quote-link" type="button" data-jump-comment-quote="${escapeHtml(comment.id || "")}">
          <span aria-hidden="true">"</span>
          <span class="comment-quote-content">
            <strong>${escapeHtml(quote)}</strong>
            ${quoteCommentContextHtml(displayContext)}
          </span>
        </button>
      `;
  }

  function elementContext(root, selector) {
    if (!root || !selector) return "";
    return quoteContext([...root.querySelectorAll(selector)].map(element => element.textContent || ""));
  }

  function compactHeaderContext(root, selector = COMPACT_HEADER_CONTEXT_SELECTOR) {
    const roots = Array.isArray(root) ? root : [root];
    if (!roots.some(Boolean)) return "";
    const ignored = /^(back|close|x|edit|edit content|edit site|directions|full page|ar story|quote|quote comment|post comment|reply)$/i;
    const parts = [];
    const seen = new Set();
    const addElement = element => {
      if (!element || element.closest?.("input,textarea,select,.discussion-section,.quote-selection-popup")) return;
      const allowedLinkedContext = element.matches?.(".site-tag-chip,.site-tag,[data-site-tag-label],.address-territory,.article-meta-link,.detail-territory-link,[data-site-territory-slug]") || element.closest?.(".site-tag-actions,.tag-list");
      if (element.closest?.("a,button") && !allowedLinkedContext) return;
      const raw = element.dataset?.quoteHeaderContext || element.dataset?.siteTagLabel || element.textContent || "";
      const text = cleanContextText(raw);
      const key = text.toLowerCase();
      if (!text || ignored.test(text) || seen.has(key)) return;
      seen.add(key);
      parts.push(text);
    };
    roots.filter(Boolean).forEach(contextRoot => {
      if (contextRoot.matches?.(selector)) addElement(contextRoot);
      [...contextRoot.querySelectorAll(selector)].forEach(addElement);
    });
    return quoteContext(parts.slice(0, 7));
  }

  function normalizedIndexMap(text = "") {
    const normalized = [];
    const map = [];
    let lastWasSpace = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (/\s/.test(char)) {
        if (lastWasSpace) continue;
        normalized.push(" ");
        map.push(i);
        lastWasSpace = true;
      } else {
        normalized.push(char.toLowerCase());
        map.push(i);
        lastWasSpace = false;
      }
    }
    return { normalized: normalized.join("").trim(), map };
  }

  function findQuoteInTextNode(node, quote) {
    const needle = cleanQuoteText(quote).toLowerCase();
    if (!node?.nodeValue || !needle) return null;
    const directIndex = node.nodeValue.toLowerCase().indexOf(needle);
    if (directIndex >= 0) return { start: directIndex, end: directIndex + needle.length };
    const source = node.nodeValue;
    const mapped = normalizedIndexMap(source);
    const normalizedNeedle = cleanQuoteText(quote).toLowerCase();
    const normalizedIndex = mapped.normalized.indexOf(normalizedNeedle);
    if (normalizedIndex < 0) return null;
    const start = mapped.map[normalizedIndex] ?? 0;
    const lastMapped = mapped.map[Math.min(mapped.map.length - 1, normalizedIndex + normalizedNeedle.length - 1)];
    const end = Number.isFinite(lastMapped) ? lastMapped + 1 : start + quote.length;
    return { start, end };
  }

  function markQuote(root, quote, commentId, options = {}) {
    if (!root || !quote || !commentId) return false;
    if (root.querySelector(`[data-quote-comment-anchor="${CSS.escape(String(commentId))}"]`)) return true;
    const blockedSelector = options.blockedSelector || "a, button, input, textarea, select, script, style, h1, h2, h3, h4, h5, h6, .discussion-section, .article-social-actions, .share-panel, .quote-comment-anchor";
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest(blockedSelector)) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node;
    while ((node = walker.nextNode())) {
      const match = findQuoteInTextNode(node, quote);
      if (!match || match.end <= match.start) continue;
      const after = node.splitText(match.end);
      const matched = node.splitText(match.start);
      const span = document.createElement("span");
      span.className = "quote-comment-anchor";
      span.dataset.quoteCommentAnchor = String(commentId);
      span.title = "Community note connected to this text";
      matched.parentNode.insertBefore(span, matched);
      span.appendChild(matched);
      const button = document.createElement("button");
      button.className = "quote-comment-marker";
      button.type = "button";
      button.dataset.jumpQuoteComment = String(commentId);
      button.title = "Show community note";
      button.setAttribute("aria-label", "Show community note connected to this text");
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h7"/><path d="M7 11h10"/><path d="M7 15h6"/><path d="M5 3h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-8l-5 3v-3H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/></svg>';
      span.parentNode.insertBefore(button, after);
      return true;
    }
    return false;
  }

  window.NLI_QUOTE_COMMENT_UTILS = {
    cleanQuoteText,
    cleanContextText,
    formatQuotedComment,
    parseQuotedComment,
    parseCommentRecord,
    selectedQuoteText,
    selectedSectionTitle,
    selectedHeadingTrail,
    selectedNearbyContext,
    selectedLocalSummary,
    selectedContainerContext,
    quoteContext,
    labeledContextPart,
    quoteBlockedSelector,
    selectionContext,
    selectionPopupRect,
    stripQuotedCommentPrefix,
    contextIncludes,
    contextHasLabeledPart,
    labeledContextValue,
    quoteCommentContextFields,
    quoteCommentDisplayContext,
    quoteCommentContextHtml,
    quoteCommentButtonHtml,
    elementContext,
    COMPACT_HEADER_CONTEXT_SELECTOR,
    compactHeaderContext,
    markQuote
  };
})();
