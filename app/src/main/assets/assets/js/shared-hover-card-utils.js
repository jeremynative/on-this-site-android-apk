(function () {
  function hoverSummary(value, options = {}) {
    const limit = Number(options.limit || 420);
    const minSentenceLength = Number(options.minSentenceLength || 90);
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= limit) return text;
    const sentenceEndings = [...text.matchAll(/[.!?](?=\s|$)/g)]
      .map(match => match.index + 1)
      .filter(index => index >= minSentenceLength && index <= limit);
    if (sentenceEndings.length) return text.slice(0, sentenceEndings[sentenceEndings.length - 1]);
    const fallback = text.slice(0, limit);
    const lastSpace = fallback.lastIndexOf(" ");
    return `${fallback.slice(0, lastSpace > 0 ? lastSpace : fallback.length)}...`;
  }

  function imageErrorHandler() {
    return "const fallback=this.dataset.fallbackSrc;if(fallback&&this.src!==fallback){this.dataset.fallbackSrc='';this.src=fallback;}else{this.remove();}";
  }

  function hoverHtml(preview = {}, options = {}) {
    const escapeHtml = typeof options.escapeHtml === "function" ? options.escapeHtml : value => String(value || "");
    const imageWidth = Number(options.imageWidth || 300);
    const imageHeight = Number(options.imageHeight || 116);
    const image = preview.image || "";
    const fallback = preview.imageFallback || "";
    const tags = Array.isArray(preview.tags) ? preview.tags.filter(Boolean).slice(0, 4) : [];
    const actions = Array.isArray(preview.actions) ? preview.actions.filter(Boolean).slice(0, 3) : [];
    return `
        <div class="hover-preview">
          ${image ? `<img src="${escapeHtml(image)}" alt="" width="${imageWidth}" height="${imageHeight}" decoding="async" draggable="false" ${fallback ? `data-fallback-src="${escapeHtml(fallback)}"` : ""} onerror="${imageErrorHandler()}">` : ""}
          <div>
            <strong>${escapeHtml(preview.title || "")}</strong>
            ${preview.meta ? `<small>${escapeHtml(preview.meta)}</small>` : ""}
            <span>${escapeHtml(preview.summary || "")}</span>
            ${tags.length ? `<ul class="hover-preview-tags">${tags.map(tag => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>` : ""}
            ${actions.length ? `<p class="hover-preview-actions">${actions.map(action => `<b>${escapeHtml(action)}</b>`).join("")}</p>` : ""}
            ${preview.footer ? `<em>${escapeHtml(preview.footer)}</em>` : ""}
          </div>
        </div>
      `;
  }

  window.NLI_HOVER_CARD_UTILS = {
    hoverSummary,
    hoverHtml
  };
}());
