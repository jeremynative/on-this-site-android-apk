(function () {
  const FEEDBACK_UTILS = window.NLI_FEEDBACK_UTILS || {};
  const SUPPORT_UTILS = window.NLI_SUPPORT_UTILS || {};
  const SESSION_KEY = "nli-research-question-prompt-dismissed";
  let instance = null;

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function validEmail(value) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value || "").trim());
  }

  function selectedAmount(form) {
    const amount = Number(form.querySelector("[data-research-support-amount]")?.value || 25);
    if (!Number.isFinite(amount) || amount < 1) return 25;
    return Math.round(Math.min(amount, 10000) * 100) / 100;
  }

  function routeContext() {
    const params = new URLSearchParams(window.location.search);
    const route = ["site", "wiki", "page", "blog", "calendar", "event"]
      .map(key => params.get(key) ? `${key}=${params.get(key)}` : "")
      .find(Boolean);
    return route || "Map home";
  }

  function promptHtml() {
    return `
      <aside class="research-question-prompt" data-research-question-prompt aria-label="Ask On This Site a research question" hidden>
        <button class="research-question-prompt-close" type="button" data-research-question-dismiss aria-label="Dismiss research question prompt">&times;</button>
        <div>
          <strong>Have a question?</strong>
          <span>Steer the research through your curiosity.</span>
        </div>
        <button class="research-question-prompt-action" type="button" data-research-question-open>Ask a question</button>
      </aside>
      <button class="research-question-restore" type="button" data-research-question-open data-research-question-restore aria-label="Ask a research question" title="Ask a question" hidden>?</button>
    `;
  }

  function dialogHtml(identity = {}) {
    const name = identity.name && identity.name !== "Contributor" ? identity.name : "";
    return `
      <div class="research-question-dialog" data-research-question-dialog hidden>
        <button class="research-question-backdrop" type="button" data-research-question-close aria-label="Close question form"></button>
        <section class="research-question-card" role="dialog" aria-modal="true" aria-labelledby="research-question-title">
          <header>
            <div>
              <p>Support through curiosity</p>
              <h2 id="research-question-title">Ask a question</h2>
            </div>
            <button class="research-question-close" type="button" data-research-question-close aria-label="Close question form">x</button>
          </header>
          <p class="research-question-intro">Questions are free. A completed tip helps prioritize the next round of research and guarantees a personal response. Support never changes how evidence is interpreted.</p>
          <form data-research-question-form novalidate>
            <div class="research-question-field">
              <label for="research-question-name">Name</label>
              <input id="research-question-name" data-research-name data-support-name autocomplete="name" value="${escapeHtml(name)}" required>
            </div>
            <div class="research-question-field">
              <label for="research-question-email">Email</label>
              <input id="research-question-email" data-research-email data-support-email type="email" inputmode="email" autocomplete="email" value="${escapeHtml(identity.email || "")}" required>
            </div>
            <div class="research-question-field research-question-wide">
              <label for="research-question-text">Question</label>
              <textarea id="research-question-text" data-research-question data-support-note rows="5" maxlength="3000" placeholder="What would you like On This Site to research or explain?" required></textarea>
            </div>
            <div class="research-question-honeypot" aria-hidden="true">
              <label for="research-question-website">Website</label>
              <input id="research-question-website" data-research-website tabindex="-1" autocomplete="off">
            </div>
            <label class="research-question-support-toggle research-question-wide">
              <input type="checkbox" data-research-support-enabled>
              <span><strong>Support this question</strong><small>Optional. Completed support guarantees a personal follow-up.</small></span>
            </label>
            <div class="research-question-support-fields research-question-wide" data-research-support-fields hidden>
              <label for="research-question-amount">Tip amount</label>
              <div class="research-question-amount-wrap">
                <span aria-hidden="true">$</span>
                <input id="research-question-amount" data-research-support-amount data-support-custom-amount type="number" min="1" max="10000" step="1" inputmode="decimal" value="25">
              </div>
              <p>Change the amount to any value of $1 or more.</p>
            </div>
            <input type="radio" data-support-frequency value="once" checked hidden>
            <input type="radio" data-support-amount value="25" checked hidden>
            <input type="hidden" data-support-connection value="Visitor research question">
            <input type="hidden" data-support-public-name value="">
            <input type="checkbox" data-support-public-thanks hidden>
            <textarea data-support-public-caption hidden></textarea>
            <input type="hidden" data-support-artwork-title value="">
            <input type="hidden" data-support-research-question-id value="">
            <div class="research-question-actions research-question-wide">
              <button class="research-question-submit" type="submit" data-research-question-submit>Send question</button>
              <button class="research-question-cancel" type="button" data-research-question-close>Cancel</button>
            </div>
            <p class="research-question-status research-question-wide" data-research-question-status role="status" aria-live="polite" hidden></p>
            <div class="support-complete" data-support-complete hidden>
              <strong>Thank you for supporting On This Site.</strong>
              <p>Your payment was approved and your question has been sent.</p>
            </div>
            <div class="support-embedded-checkout research-question-wide" data-support-embedded-checkout hidden></div>
          </form>
        </section>
      </div>
    `;
  }

  function init(options = {}) {
    if (instance) return instance;
    const platform = options.platform || "desktop";
    const identity = typeof options.getIdentity === "function" ? (options.getIdentity() || {}) : {};
    const shell = document.createElement("div");
    shell.className = `research-question-shell research-question-shell-${platform}`;
    shell.innerHTML = promptHtml() + dialogHtml(identity);
    document.body.appendChild(shell);

    const prompt = shell.querySelector("[data-research-question-prompt]");
    const restore = shell.querySelector("[data-research-question-restore]");
    const dialog = shell.querySelector("[data-research-question-dialog]");
    const form = shell.querySelector("[data-research-question-form]");
    const status = shell.querySelector("[data-research-question-status]");
    const submit = shell.querySelector("[data-research-question-submit]");
    const supportToggle = shell.querySelector("[data-research-support-enabled]");
    const supportFields = shell.querySelector("[data-research-support-fields]");
    const promptDismiss = shell.querySelector("[data-research-question-dismiss]");
    const showRestore = options.showRestore !== false;
    const autoPrompt = options.autoPrompt !== false;
    let promptRequested = false;
    let questionSent = false;
    let checkoutAttempt = 0;

    function dismissed() {
      try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
    }

    function setDismissed() {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    }

    function interfaceBusy() {
      if (dialog && !dialog.hidden) return false;
      return typeof options.isUiBusy === "function" && options.isUiBusy();
    }

    function syncPrompt() {
      prompt.hidden = !promptRequested || dismissed() || interfaceBusy();
      restore.hidden = !showRestore || !promptRequested || !prompt.hidden || !dialog.hidden;
    }

    function setStatus(message, kind = "") {
      status.hidden = !message;
      status.textContent = message || "";
      status.className = `research-question-status research-question-wide${kind ? ` ${kind}` : ""}`;
    }

    function refreshIdentity() {
      const current = typeof options.getIdentity === "function" ? (options.getIdentity() || {}) : {};
      const nameInput = form.querySelector("[data-research-name]");
      const emailInput = form.querySelector("[data-research-email]");
      if (!nameInput.value && current.name && current.name !== "Contributor") nameInput.value = current.name;
      if (!emailInput.value && current.email) emailInput.value = current.email;
    }

    function openDialog() {
      setDismissed();
      prompt.hidden = true;
      refreshIdentity();
      dialog.hidden = false;
      document.body.classList.add("research-question-dialog-open");
      window.setTimeout(() => form.querySelector("[data-research-question]")?.focus(), 30);
    }

    function cancelPendingCheckout() {
      const container = form.querySelector("[data-support-embedded-checkout]");
      const checkout = form.__supportEmbeddedCheckout;
      const completion = form.querySelector("[data-support-complete]");
      form.__supportEmbeddedCheckout = null;
      if (checkout?.destroy) {
        try {
          Promise.resolve(checkout.destroy()).catch(() => null);
        } catch {
          // Closing the question panel must not depend on Stripe cleanup.
        }
      }
      if (container) {
        container.hidden = true;
        container.innerHTML = "";
      }
      if (!completion || completion.hidden) {
        form.querySelectorAll(".research-question-field, .research-question-support-toggle, .research-question-support-fields, .research-question-actions").forEach(element => {
          element.hidden = element.matches(".research-question-support-fields") ? !supportToggle.checked : false;
        });
        submit.disabled = false;
        submit.textContent = supportToggle.checked ? "Send question and continue to payment" : "Send question";
        setStatus("");
        questionSent = false;
      }
    }

    function closeDialog() {
      checkoutAttempt += 1;
      try {
        cancelPendingCheckout();
      } finally {
        dialog.hidden = true;
        document.body.classList.remove("research-question-dialog-open");
        window.requestAnimationFrame(syncPrompt);
      }
    }

    function dismissPrompt(event) {
      event?.preventDefault();
      event?.stopPropagation();
      setDismissed();
      prompt.hidden = true;
      restore.hidden = !showRestore;
    }

    async function submitQuestion(event) {
      event.preventDefault();
      const attempt = ++checkoutAttempt;
      const name = form.querySelector("[data-research-name]")?.value.trim() || "";
      const email = form.querySelector("[data-research-email]")?.value.trim() || "";
      const question = form.querySelector("[data-research-question]")?.value.trim() || "";
      const website = form.querySelector("[data-research-website]")?.value || "";
      const supportRequested = Boolean(supportToggle.checked);
      const amount = selectedAmount(form);
      if (!name) return setStatus("Enter your name.", "error");
      if (!validEmail(email)) return setStatus("Enter a valid email address.", "error");
      if (question.length < 8) return setStatus("Enter a little more detail about your question.", "error");
      submit.disabled = true;
      submit.textContent = supportRequested ? "Saving question..." : "Sending...";
      setStatus(supportRequested ? "Saving your question before secure payment..." : "Sending your question...", "pending");
      try {
        const result = await FEEDBACK_UTILS.submitResearchQuestion({
          name,
          email,
          question,
          website,
          support_requested: supportRequested,
          selected_amount: supportRequested ? amount : null,
          page_url: window.location.href,
          page_context: routeContext(),
          submitted_at: new Date().toISOString()
        }, {
          platform,
          appUrl: window.location.href,
          accessToken: typeof options.getAccessToken === "function" ? options.getAccessToken() : ""
        });
        if (attempt !== checkoutAttempt || dialog.hidden) return;
        questionSent = true;
        const questionId = result?.question_id || result?.id || "";
        if (!supportRequested) {
          setStatus("Question sent. Thank you for helping guide the research.", "success");
          submit.textContent = "Question sent";
          return;
        }
        const note = form.querySelector("[data-support-note]");
        const connection = form.querySelector("[data-support-connection]");
        const researchQuestionId = form.querySelector("[data-support-research-question-id]");
        note.value = `${questionId ? `Research question ${questionId}: ` : "Research question: "}${question}`.slice(0, 1000);
        connection.value = `${routeContext()} | ${window.location.href}`.slice(0, 500);
        researchQuestionId.value = questionId;
        setStatus("Question saved. Preparing secure payment.", "pending");
        const checkout = await SUPPORT_UTILS.startCheckout(form, {
          pageUrl: window.location.href,
          embedded: true,
          redirectFallback: false,
          updateUrl: false,
          onComplete: () => {
            form.querySelectorAll(".research-question-field, .research-question-support-toggle, .research-question-support-fields, .research-question-actions").forEach(element => {
              element.hidden = true;
            });
            setStatus("Payment completed. Thank you. Your question has been submitted for a personal response.", "success");
          }
        });
        if (attempt !== checkoutAttempt || dialog.hidden) {
          cancelPendingCheckout();
          return;
        }
        if (checkout?.embedded) {
          setStatus("Question saved. Complete the secure payment form below.", "pending");
          submit.textContent = "Payment form ready";
        } else {
          throw new Error("The secure payment form could not load here. Please try again.");
        }
      } catch (error) {
        const message = error?.message || "The question could not be sent yet.";
        setStatus(questionSent ? `Your question was saved, but payment did not complete. ${message}` : message, questionSent ? "pending" : "error");
        submit.disabled = false;
        submit.textContent = questionSent ? "Try secure payment again" : (supportRequested ? "Send question and continue to payment" : "Send question");
      }
    }

    supportToggle.addEventListener("change", () => {
      supportFields.hidden = !supportToggle.checked;
      submit.textContent = supportToggle.checked ? "Send question and continue to payment" : "Send question";
    });
    promptDismiss?.addEventListener("click", dismissPrompt);
    shell.querySelectorAll("[data-research-question-close]").forEach(control => {
      control.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        closeDialog();
      });
    });
    shell.addEventListener("click", event => {
      if (event.target.closest("[data-research-question-open]")) openDialog();
      window.requestAnimationFrame(syncPrompt);
    });
    form.addEventListener("submit", submitQuestion);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !dialog.hidden) closeDialog();
    });
    document.addEventListener("click", () => window.requestAnimationFrame(syncPrompt));
    window.addEventListener("resize", syncPrompt);

    if (autoPrompt) {
      const delay = Number.isFinite(Number(options.delay)) ? Number(options.delay) : (platform === "mobile" ? 11000 : 9000);
      window.setTimeout(() => {
        promptRequested = true;
        syncPrompt();
      }, Math.max(0, delay));
    }

    instance = {
      shell,
      prompt,
      restore,
      dialog,
      form,
      open: openDialog,
      close: closeDialog,
      showPrompt: () => {
        promptRequested = true;
        syncPrompt();
      }
    };
    return instance;
  }

  window.NLI_RESEARCH_QUESTION_UTILS = { init };
}());
