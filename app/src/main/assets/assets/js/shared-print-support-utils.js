(function () {
  const PRINT_OPTIONS = [
    ["8x10", "8 x 10", 100],
    ["11x14", "11 x 14", 175],
    ["16x20", "16 x 20", 300],
    ["20x30", "20 x 30", 600],
    ["24x36", "24 x 36", 900],
    ["30x40", "30 x 40", 1500],
    ["40x60", "40 x 60", 3000]
  ];
  const PRINT_MATERIALS = [
    ["archival_inkjet", "Archival inkjet print"],
    ["metal", "Metal print"]
  ];

  function paypalUrl(itemName, amount = "") {
    const params = new URLSearchParams({
      cmd: amount ? "_xclick" : "_donations",
      business: "jeremynative@gmail.com",
      item_name: itemName,
      currency_code: "USD"
    });
    if (amount) params.set("amount", String(amount));
    return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
  }

  function printOptionPrice(size) {
    return PRINT_OPTIONS.find(([value]) => value === size)?.[2] || PRINT_OPTIONS[0][2];
  }

  function printSupportPanel({ title, image, sourceType, slug, enabled = true }, deps = {}) {
    if (!image || enabled === false) return "";
    const escapeHtml = deps.escapeHtml || (value => String(value || ""));
    const money = deps.money || (value => `$${Number(value || 0).toLocaleString()}`);
    const locationRef = deps.location || window.location;
    const sourceUrl = `${locationRef.origin}${locationRef.pathname}?${sourceType === "wiki" ? "wiki" : "site"}=${slug}`;
    const inquiry = `mailto:onthissiteny@gmail.com?subject=${encodeURIComponent(`Print inquiry: ${title}`)}&body=${encodeURIComponent(`I am interested in a print of ${title}.\n\nSize:\nMaterial:\nCustomization:\n\nSource: ${sourceUrl}`)}`;
    const item = `Print: ${title} - 8 x 10 - Archival inkjet print`;
    return `
      <details class="print-panel" data-print-panel data-print-title="${escapeHtml(title)}" data-print-source="${escapeHtml(sourceType)}" data-print-slug="${escapeHtml(slug)}">
        <summary>Purchase a print of this artwork to support On This Site</summary>
        <div class="print-grid">
          <label>Size
            <select data-print-size>
              ${PRINT_OPTIONS.map(([value, label, price]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)} - ${money(price)}</option>`).join("")}
            </select>
          </label>
          <label>Material
            <select data-print-material>
              ${PRINT_MATERIALS.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("")}
            </select>
          </label>
        </div>
        <label class="print-customization">Customization
          <textarea data-print-customization maxlength="180" placeholder="Optional note: crop, paper border, delivery, inscription, or other request"></textarea>
        </label>
        <div class="print-actions">
          <a class="button secondary" data-print-pay href="${escapeHtml(paypalUrl(item, 100))}" target="_blank" rel="noreferrer">Pay with PayPal - ${money(100)}</a>
          <a class="button secondary" href="${escapeHtml(inquiry)}">Print inquiry</a>
        </div>
        <p class="article-meta">Paid print purchases can be added to your contributor profile as a public or private support badge after confirmation.</p>
      </details>
    `;
  }

  function updatePrintPanel(panel, deps = {}) {
    if (!panel) return;
    const money = deps.money || (value => `$${Number(value || 0).toLocaleString()}`);
    const title = panel.dataset.printTitle || "On This Site print";
    const size = panel.querySelector("[data-print-size]")?.value || "8x10";
    const material = panel.querySelector("[data-print-material]")?.value || "archival_inkjet";
    const customization = (panel.querySelector("[data-print-customization]")?.value || "").trim();
    const price = printOptionPrice(size);
    const sizeLabel = PRINT_OPTIONS.find(([value]) => value === size)?.[1] || size;
    const materialLabel = PRINT_MATERIALS.find(([value]) => value === material)?.[1] || material;
    const link = panel.querySelector("[data-print-pay]");
    if (!link) return;
    const itemParts = [`Print: ${title}`, sizeLabel, materialLabel];
    if (customization) itemParts.push(`Customization: ${customization.slice(0, 120)}`);
    link.href = paypalUrl(itemParts.join(" - "), price);
    link.textContent = `Pay with PayPal - ${money(price)}`;
  }

  window.NLI_PRINT_SUPPORT_UTILS = {
    PRINT_OPTIONS,
    PRINT_MATERIALS,
    paypalUrl,
    printOptionPrice,
    printSupportPanel,
    updatePrintPanel
  };
}());
