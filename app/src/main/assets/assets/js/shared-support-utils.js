(function () {
  const DEFAULT_CONFIG = {
    projectName: "On This Site",
    supportEmail: "jeremynative@gmail.com",
    checkoutEndpoint: "",
    publishableKey: "",
    stripeJsUrl: "https://js.stripe.com/v3/",
    publicThankYousUrl: "support/public-thank-yous.json",
    adminActivityUrl: "",
    defaultAmounts: [10, 25, 50, 100],
    defaultAmount: 25
  };

  function config() {
    return {
      ...DEFAULT_CONFIG,
      ...(window.NLI_SUPPORT_CONFIG || {})
    };
  }

  function cleanText(value, limit = 500) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
  }

  function safeStripeCheckoutUrl(value) {
    try {
      const url = new URL(String(value || "").trim());
      return url.protocol === "https:" && url.hostname === "checkout.stripe.com" && !url.username && !url.password
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  function money(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return "$0";
    return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function amountOptions() {
    const amounts = config().defaultAmounts || DEFAULT_CONFIG.defaultAmounts;
    return amounts.map(Number).filter(amount => Number.isFinite(amount) && amount > 0);
  }

  function selectedAmount(form) {
    const custom = Number(form.querySelector("[data-support-custom-amount]")?.value || 0);
    if (custom > 0) return Math.round(custom * 100) / 100;
    const checked = form.querySelector("[data-support-amount]:checked");
    const amount = Number(checked?.value || config().defaultAmount || DEFAULT_CONFIG.defaultAmount);
    return Number.isFinite(amount) && amount > 0 ? amount : DEFAULT_CONFIG.defaultAmount;
  }

  function intentFromForm(form, pageUrl = window.location.href) {
    const frequency = form.querySelector("[data-support-frequency]:checked")?.value === "monthly" ? "monthly" : "once";
    const amount = selectedAmount(form);
    const name = cleanText(form.querySelector("[data-support-name]")?.value, 180);
    const email = cleanText(form.querySelector("[data-support-email]")?.value, 180);
    if (!name) {
      throw new Error("Enter your name.");
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }
    return {
      project: config().projectName,
      frequency,
      amount,
      name,
      email,
      publicDisplayName: cleanText(form.querySelector("[data-support-public-name]")?.value, 180),
      publicThankYou: Boolean(form.querySelector("[data-support-public-thanks]")?.checked),
      publicCaption: cleanText(form.querySelector("[data-support-public-caption]")?.value, 180),
      note: cleanText(form.querySelector("[data-support-note]")?.value, 1000),
      connection: cleanText(form.querySelector("[data-support-connection]")?.value, 500),
      artworkTitle: cleanText(form.querySelector("[data-support-artwork-title]")?.value, 180),
      researchQuestionId: cleanText(form.querySelector("[data-support-research-question-id]")?.value, 120),
      sourceUrl: pageUrl,
      createdAt: new Date().toISOString()
    };
  }

  function sanitizePublicThankYou(record, options = {}) {
    const displayName = cleanText(record?.displayName || record?.display_name || record?.name, 120);
    if (!displayName) return null;
    const hasApprovedFlag = Object.prototype.hasOwnProperty.call(record || {}, "approved");
    const approved = record?.approved === true || record?.approved === "true" || record?.approved === 1;
    if (hasApprovedFlag && !approved) return null;
    if (options.requireApproved !== false && !approved) return null;
    const message = cleanText(record?.message || `Thank you ${displayName} for supporting On This Site.`, 220);
    return {
      displayName,
      message,
      createdAt: cleanText(record?.createdAt || record?.created_at, 80)
    };
  }

  function publicThankYousHtml(records = [], options = {}) {
    const esc = options.escapeHtml || escapeHtml;
    const publicRecords = records.map(record => sanitizePublicThankYou(record, options)).filter(Boolean);
    if (!publicRecords.length) {
      return "";
    }
    return `
      <div class="support-thank-you-list">
        ${publicRecords.map(record => `
          <article class="support-thank-you">
            <strong>${esc(record.displayName)}</strong>
            <p>${esc(record.message)}</p>
          </article>
        `).join("")}
      </div>
    `;
  }

  function supportReturnNotice(pageUrl = window.location.href) {
    let status = "";
    try {
      status = new URL(pageUrl, window.location.href).searchParams.get("support") || "";
    } catch {
      status = "";
    }
    if (status === "success") {
      return {
        type: "success",
        message: "Thank you for supporting On This Site. Your payment is being confirmed securely."
      };
    }
    if (status === "cancel") {
      return {
        type: "error",
        message: "Payment was not completed. You can try again whenever you are ready."
      };
    }
    return null;
  }

  function supportReturnNoticeHtml(pageUrl = window.location.href, options = {}) {
    const notice = supportReturnNotice(pageUrl);
    if (!notice) return "";
    const esc = options.escapeHtml || escapeHtml;
    return `<p class="form-status ${esc(notice.type)}" data-support-return-status>${esc(notice.message)}</p>`;
  }

  function supportCompletionHtml(options = {}) {
    const esc = options.escapeHtml || escapeHtml;
    return `
      <div class="support-complete" data-support-complete hidden>
        <strong>${esc("Thank you for supporting On This Site.")}</strong>
        <p>${esc("Your payment was approved. The project records will update from Stripe securely.")}</p>
      </div>
    `;
  }

  function adminMoney(value) {
    const amount = Number(value || 0);
    return amount.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  }

  function adminDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return cleanText(value, 40);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function supportAdminActivityHtml(data = {}, options = {}) {
    const esc = options.escapeHtml || escapeHtml;
    const rows = Array.isArray(data.records) ? data.records : [];
    const summary = data.summary || {};
    return `
      <section class="section support-admin-dashboard">
        <div class="support-admin-heading">
          <div>
            <p class="article-kicker">Admin</p>
            <h3>Supporter Donations</h3>
          </div>
          <span class="support-admin-freshness">${esc(data.generatedAt ? `Updated ${adminDate(data.generatedAt)}` : "Private support view")}</span>
        </div>
        <div class="support-admin-summary-grid">
          <div class="support-admin-stat"><span>Recent gifts</span><strong>${rows.length}</strong></div>
          <div class="support-admin-stat"><span>Recent total</span><strong>${esc(adminMoney(summary.totalAmount || 0))}</strong></div>
          <div class="support-admin-stat"><span>Public opt-ins</span><strong>${Number(summary.publicCount || 0)}</strong></div>
        </div>
      </section>
      <section class="section support-admin-list-section">
        ${rows.length ? `
          <div class="support-admin-list">
            ${rows.map(row => `
              <article class="support-admin-donation">
                <div class="support-admin-donation-main">
                  <div>
                    <strong>${esc(row.name || "Supporter")}</strong>
                    <span>${esc(row.email || "")}</span>
                  </div>
                  <div class="support-admin-amount">
                    <strong>${esc(adminMoney(row.amount || 0))}</strong>
                    <span>${esc([row.status, row.frequency].filter(Boolean).join(" - "))}</span>
                  </div>
                </div>
                <dl class="support-admin-meta">
                  <div><dt>Date</dt><dd>${esc(adminDate(row.createdAt) || "Not recorded")}</dd></div>
                  <div><dt>Public</dt><dd>${row.publicThankYou ? esc(row.publicName || row.name || "Yes") : "No"}</dd></div>
                  ${row.publicMessage || row.note ? `<div><dt>Caption / note</dt><dd>${esc(row.publicMessage || row.note)}</dd></div>` : ""}
                  ${row.connection ? `<div><dt>Connection</dt><dd>${esc(row.connection)}</dd></div>` : ""}
                </dl>
              </article>
            `).join("")}
          </div>
        ` : `<p class="article-summary">No recent supporter activity found yet.</p>`}
      </section>
    `;
  }

  async function fetchAdminSupportActivity(token) {
    const url = config().adminActivityUrl;
    if (!url) throw new Error("Support admin activity is not connected yet.");
    if (!token) throw new Error("Log in again with the admin account to view supporter activity.");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Could not load supporter activity.");
    return data;
  }

  function hasEmbeddedCheckoutConfig(supportConfig = config()) {
    return /^pk_(test|live)_/.test(String(supportConfig.publishableKey || ""));
  }

  function loadStripeJs(supportConfig = config()) {
    if (window.Stripe) return Promise.resolve(window.Stripe);
    if (window.NLI_STRIPE_JS_PROMISE) return window.NLI_STRIPE_JS_PROMISE;
    window.NLI_STRIPE_JS_PROMISE = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = supportConfig.stripeJsUrl || DEFAULT_CONFIG.stripeJsUrl;
      script.async = true;
      script.onload = () => window.Stripe ? resolve(window.Stripe) : reject(new Error("Stripe could not load."));
      script.onerror = () => reject(new Error("Stripe could not load."));
      document.head.appendChild(script);
    });
    return window.NLI_STRIPE_JS_PROMISE;
  }

  function supportFormHtml(options = {}) {
    const settings = options.settings || {};
    const supportConfig = config();
    const esc = options.escapeHtml || escapeHtml;
    const amounts = amountOptions();
    const defaultAmount = Number(supportConfig.defaultAmount || amounts[0] || 25);
    const title = settings.title || "Support On This Site";
    const note = settings.support_note || "Thank you to Monument Lab, Running Strong for American Indian Youth, community contributors, and other supporters who help keep On This Site online, reviewed, expanded, and available across the website and mobile app.";
    const hasStripe = Boolean(supportConfig.checkoutEndpoint);
    const hasEmbedded = hasStripe && hasEmbeddedCheckoutConfig(supportConfig);
    const initialThankYousHtml = publicThankYousHtml(window.NLI_PUBLIC_SUPPORTERS || [], { escapeHtml: esc });
    return `
      <div class="ots-page-intro support-page-intro">
        <p class="summary">${esc(note)}</p>
      </div>
      <section class="section support-form-section" data-support-form data-support-platform="${esc(options.platform || "web")}">
        <h3>${esc(title)}</h3>
        <p class="article-meta">${hasStripe ? (hasEmbedded ? "Secure payment opens here on the project site." : "Payments open through secure checkout.") : "Secure checkout is being connected. Payment will open here after the support system is ready."}</p>
        ${supportReturnNoticeHtml(options.pageUrl || window.location.href, { escapeHtml: esc })}
        ${supportCompletionHtml({ escapeHtml: esc })}
        <div class="support-frequency" role="group" aria-label="Support frequency">
          <label><input type="radio" name="support-frequency-${esc(options.platform || "web")}" data-support-frequency value="once" checked> One-time</label>
          <label><input type="radio" name="support-frequency-${esc(options.platform || "web")}" data-support-frequency value="monthly"> Monthly</label>
        </div>
        <div class="support-amount-grid" aria-label="Support amount">
          ${amounts.map(amount => `
            <label>
              <input type="radio" name="support-amount-${esc(options.platform || "web")}" data-support-amount value="${amount}" ${amount === defaultAmount ? "checked" : ""}>
              <span>${esc(money(amount))}</span>
            </label>
          `).join("")}
        </div>
        <div class="field">
          <label for="${esc(options.platform || "web")}-support-custom-amount">Custom amount</label>
          <input id="${esc(options.platform || "web")}-support-custom-amount" data-support-custom-amount type="number" min="1" step="1" inputmode="decimal" placeholder="Optional">
        </div>
        <div class="field">
          <label for="${esc(options.platform || "web")}-support-name">Name</label>
          <input id="${esc(options.platform || "web")}-support-name" data-support-name autocomplete="name" required>
        </div>
        <div class="field">
          <label for="${esc(options.platform || "web")}-support-email">Email</label>
          <input id="${esc(options.platform || "web")}-support-email" data-support-email autocomplete="email" inputmode="email" type="email" required>
        </div>
        <div class="field">
          <label for="${esc(options.platform || "web")}-support-public-name">Public display name</label>
          <input id="${esc(options.platform || "web")}-support-public-name" data-support-public-name placeholder="Optional">
        </div>
        <label class="support-check">
          <input type="checkbox" data-support-public-thanks>
          <span>Thank me publicly on the project site.</span>
        </label>
        <div class="field">
          <label for="${esc(options.platform || "web")}-support-public-caption">Public donation caption</label>
          <textarea id="${esc(options.platform || "web")}-support-public-caption" data-support-public-caption rows="2" maxlength="180" placeholder="Optional short note for the activity feed"></textarea>
        </div>
        <div class="field">
          <label for="${esc(options.platform || "web")}-support-connection">Artwork or project connection</label>
          <input id="${esc(options.platform || "web")}-support-connection" data-support-connection placeholder="Optional">
        </div>
        <div class="field">
          <label for="${esc(options.platform || "web")}-support-artwork-title">Artwork collected</label>
          <input id="${esc(options.platform || "web")}-support-artwork-title" data-support-artwork-title placeholder="Optional artwork or edition title">
        </div>
        <div class="field">
          <label for="${esc(options.platform || "web")}-support-note">Optional note</label>
          <textarea id="${esc(options.platform || "web")}-support-note" data-support-note rows="4"></textarea>
        </div>
        <div class="actions">
          <button class="button action" type="button" data-support-submit ${hasStripe ? "" : "disabled"}>Continue to secure payment</button>
          <a class="button action secondary" href="mailto:${esc(supportConfig.supportEmail)}">Ask a question</a>
        </div>
        <p class="form-status" data-support-status hidden></p>
        <div class="support-embedded-checkout" data-support-embedded-checkout hidden></div>
      </section>
      <section class="section ots-support-strip" ${initialThankYousHtml ? "" : "hidden"}>
        <h3>Community thanks</h3>
        <div data-public-thank-yous>${initialThankYousHtml}</div>
      </section>
    `;
  }

  async function renderPublicThankYous(root = document, options = {}) {
    const container = root.querySelector?.("[data-public-thank-yous]");
    if (!container) return [];
    let records = window.NLI_PUBLIC_SUPPORTERS || [];
    let requireApproved = true;
    const publicUrl = config().publicThankYousUrl;
    if (!records.length && publicUrl && typeof fetch === "function") {
      try {
        const response = await fetch(publicUrl, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          records = Array.isArray(data) ? data : (data.thankYous || data.records || []);
          requireApproved = false;
        }
      } catch {
        records = [];
      }
    }
    const sanitized = records.map(record => sanitizePublicThankYou(record, { requireApproved })).filter(Boolean);
    container.innerHTML = publicThankYousHtml(sanitized, { ...options, requireApproved: false });
    const section = container.closest?.(".ots-support-strip");
    if (section) section.hidden = sanitized.length === 0;
    return sanitized;
  }

  async function completeEmbeddedCheckout(form, options = {}) {
    if (!form) return false;
    const checkout = form.__supportEmbeddedCheckout;
    form.__supportEmbeddedCheckout = null;
    if (checkout?.destroy) {
      try {
        await checkout.destroy();
      } catch (error) {
        console.warn("Could not close embedded checkout after payment.", error);
      }
    }
    const container = form.querySelector("[data-support-embedded-checkout]");
    if (container) {
      container.hidden = true;
      container.innerHTML = "";
    }
    form.querySelectorAll(".support-frequency, .support-amount-grid, .field, .support-check, .actions").forEach(element => {
      element.hidden = true;
    });
    const completion = form.querySelector("[data-support-complete]");
    if (completion) completion.hidden = false;
    const status = form.querySelector("[data-support-status]");
    if (status) {
      status.hidden = false;
      status.textContent = "Payment approved. Thank you for supporting On This Site.";
      status.className = "form-status success";
    }
    if (options.updateUrl !== false) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("page", "support");
        url.searchParams.set("support", "success");
        window.history?.replaceState?.(window.history.state, "", url.toString());
      } catch {
        // The in-panel thank-you state is enough if the URL cannot be updated.
      }
    }
    return true;
  }

  async function startCheckout(form, options = {}) {
    const intent = intentFromForm(form, options.pageUrl || window.location.href);
    if (intent.publicThankYou && window.NLI_MODERATION_UTILS?.checkPublicText) {
      const publicName = intent.publicDisplayName || intent.name;
      const nameCheck = window.NLI_MODERATION_UTILS.checkPublicText(publicName, "Public display name");
      if (!nameCheck.ok) throw new Error(nameCheck.message);
      const captionCheck = window.NLI_MODERATION_UTILS.checkPublicText(intent.publicCaption, "Public donation caption");
      if (!captionCheck.ok) throw new Error(captionCheck.message);
    }
    const supportConfig = config();
    if (supportConfig.checkoutEndpoint) {
      const createSession = async embedded => {
        const response = await fetch(supportConfig.checkoutEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...intent, embedded })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Payment checkout could not start.");
        return data;
      };
      if (options.embedded !== false && hasEmbeddedCheckoutConfig(supportConfig)) {
        try {
          const data = await createSession(true);
          if (!data.clientSecret) throw new Error("Embedded checkout is not available for this session.");
          const Stripe = await loadStripeJs(supportConfig);
          const stripe = Stripe(supportConfig.publishableKey);
          if (!stripe?.initEmbeddedCheckout) throw new Error("Embedded checkout is not available in this browser.");
          const container = form.querySelector("[data-support-embedded-checkout]");
          if (!container) throw new Error("Embedded checkout container is missing.");
          if (form.__supportEmbeddedCheckout?.destroy) {
            await form.__supportEmbeddedCheckout.destroy();
          }
          container.hidden = false;
          container.innerHTML = "";
          let checkout;
          const handleComplete = async () => {
            await completeEmbeddedCheckout(form, options);
            if (typeof options.onComplete === "function") options.onComplete(form);
          };
          checkout = await stripe.initEmbeddedCheckout({
            clientSecret: data.clientSecret,
            onComplete: handleComplete
          });
          checkout.mount(container);
          form.__supportEmbeddedCheckout = checkout;
          return { embedded: true, clientSecret: data.clientSecret };
        } catch (error) {
          if (options.redirectFallback === false) {
            throw new Error("The secure payment form could not load here. Please try again.");
          }
          console.warn("Embedded checkout unavailable; falling back to redirect checkout.", error);
        }
      }
      if (options.redirectFallback === false) {
        throw new Error("The secure payment form could not load here. Please try again.");
      }
      const data = await createSession(false);
      const checkoutUrl = safeStripeCheckoutUrl(data.url);
      if (!checkoutUrl) throw new Error(data.message || "Payment checkout returned an unsafe destination.");
      return { url: checkoutUrl };
    }
    throw new Error("Secure checkout is not connected yet.");
  }

  window.NLI_SUPPORT_UTILS = {
    config,
    amountOptions,
    intentFromForm,
    sanitizePublicThankYou,
    publicThankYousHtml,
    supportReturnNotice,
    supportReturnNoticeHtml,
    hasEmbeddedCheckoutConfig,
    supportCompletionHtml,
    renderPublicThankYous,
    completeEmbeddedCheckout,
    fetchAdminSupportActivity,
    supportAdminActivityHtml,
    supportFormHtml,
    startCheckout
  };
})();
