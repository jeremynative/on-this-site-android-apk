(function () {
  const FEEDBACK_UTILS = window.NLI_FEEDBACK_UTILS || {};
  const SUPPORT_UTILS = window.NLI_SUPPORT_UTILS || {};
  const SESSION_KEY = "nli-research-question-prompt-dismissed";
  // Phone browsers are invited to the app once: the App Store on iPhone and iPad, a beta-invite email
  // on Android. "Continue in the browser" keeps it away for two weeks; following the link, for 60 days.
  const APP_PROMPT_DISMISSED_UNTIL_KEY = "nli-app-prompt-dismissed-until";
  const APP_PROMPT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
  const APP_PROMPT_ACTED_COOLDOWN_MS = 60 * 24 * 60 * 60 * 1000;
  const IOS_APP_STORE_URL = "https://apps.apple.com/us/app/on-this-site/id6809090479";
  const APP_ICON_SVG = `<svg class="app-download-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="14" fill="#496f5d"/><path d="M18 39c10-19 23-18 29-14-11 2-18 10-22 23-3-2-5-5-7-9Z" fill="#f8fbf6"/><circle cx="42" cy="19" r="4" fill="#f4c95d"/></svg>`;
  const QUESTION_PAGE_URL = "/question";
  // Answered visitor questions are published as Knowledgebase articles whose
  // slugs start with this prefix ("Questions and Answers" category).
  const ANSWER_SLUG_PREFIX = "visitor-question-";
  const ANSWERS_TOPIC_URL = "/?topic=questions-and-answers";
  const ANSWER_LIMIT = 12;
  const ANDROID_BETA_EMAIL_URL = "mailto:jeremynative@gmail.com?subject=On%20This%20Site%20Android%20beta%20invite&body=Please%20invite%20this%20Google%20Account%20email%20to%20the%20On%20This%20Site%20Android%20closed%20beta%3A%20";
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
    if (route) return route;
    return /^\/question\/?$/i.test(window.location.pathname) ? "Question page" : "Map home";
  }

  function isAndroidWebBrowserContext() {
    return /Android/i.test(navigator.userAgent || "")
      && !window.AndroidApp
      && !window.AndroidStory
      && !document.body.classList.contains("native-android-app");
  }

  // iPhone and iPad browsers, but not the On This Site iOS app (its WebView adds "OnThisSite-iOS").
  // iPadOS Safari reports itself as a Mac, so a Mac with a touch screen counts as an iPad.
  function isIosWebBrowserContext() {
    const agent = navigator.userAgent || "";
    if (/OnThisSite-iOS/.test(agent)) return false;
    return /iPhone|iPad|iPod/i.test(agent) || (/Macintosh/i.test(agent) && Number(navigator.maxTouchPoints || 0) > 1);
  }

  // "?app-prompt=ios" or "?app-prompt=android" shows that version anywhere, for checking it.
  function appPromptPlatform() {
    let forced = "";
    try { forced = new URLSearchParams(window.location.search).get("app-prompt") || ""; } catch {}
    if (forced === "ios" || forced === "android") return forced;
    if (isAndroidWebBrowserContext()) return "android";
    if (isIosWebBrowserContext()) return "ios";
    return "";
  }

  function appPromptHtml(appPlatform) {
    if (!appPlatform) return "";
    const ios = appPlatform === "ios";
    return `
      <div class="app-download-prompt app-download-prompt-${appPlatform}" data-app-prompt hidden>
        <button class="app-download-backdrop" type="button" data-app-prompt-dismiss tabindex="-1" aria-label="Continue in the browser"></button>
        <section class="app-download-card" role="dialog" aria-modal="true" aria-labelledby="app-download-title" aria-describedby="app-download-text">
          ${APP_ICON_SVG}
          <p class="app-download-kicker">On This Site app</p>
          <h2 id="app-download-title">${ios ? "Get the free app for iPhone and iPad" : "Try the Android app"}</h2>
          <p id="app-download-text">${ios
            ? "The app is the best way to explore the map and its histories on your phone."
            : "The Android app is in a closed beta. Email us the Google account email on your phone, and we'll send you an invite."}</p>
          <a class="app-download-action" href="${ios ? IOS_APP_STORE_URL : ANDROID_BETA_EMAIL_URL}" data-app-prompt-action>${ios ? "Download on the App Store" : "Email for a beta invite"}</a>
          <button class="app-download-continue" type="button" data-app-prompt-dismiss>Continue in the browser</button>
        </section>
      </div>`;
  }

  function promptHtml(platform, appPlatform, questionUrl) {
    return `
      ${appPromptHtml(appPlatform)}
      <aside class="research-question-prompt" data-research-question-prompt aria-label="Ask On This Site a research question" hidden>
        <button class="research-question-prompt-close" type="button" data-research-question-dismiss aria-label="Dismiss research question prompt">&times;</button>
        <div>
          <strong>Have a question?</strong>
          <span>Steer the research through your curiosity.</span>
        </div>
        <a class="research-question-prompt-action" href="${escapeHtml(questionUrl)}" data-research-question-open>Ask a question</a>
      </aside>
      <a class="research-question-restore" href="${escapeHtml(questionUrl)}" data-research-question-open data-research-question-restore aria-label="Ask a research question" title="Ask a question" hidden>?</a>
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
          <section class="research-question-archive" data-research-question-archive aria-labelledby="research-question-archive-title" hidden>
            <h3 id="research-question-archive-title">Previously Asked Questions</h3>
            <div class="research-question-archive-list" data-research-question-archive-list></div>
            <a class="research-question-archive-all" href="${ANSWERS_TOPIC_URL}" data-research-question-answers>See all questions and answers</a>
          </section>
        </section>
      </div>
    `;
  }

  function answerHref(slug) {
    return `/?wiki=${encodeURIComponent(slug)}`;
  }

  function archiveItemHtml(answer) {
    return `
      <details class="research-question-archive-item">
        <summary>${escapeHtml(answer.title)}</summary>
        ${answer.summary ? `<p>${escapeHtml(answer.summary)}</p>` : ""}
        <a href="${escapeHtml(answerHref(answer.slug))}" data-research-question-answer="${escapeHtml(answer.slug)}">Read the full answer and sources</a>
      </details>
    `;
  }

  async function fetchPublishedAnswers() {
    const base = (window.NLI_SHARED_CONFIG?.directusUrl || "https://directus.nativelongisland.com").replace(/\/$/, "");
    const params = new URLSearchParams({
      "filter[status][_eq]": "published",
      "filter[slug][_starts_with]": ANSWER_SLUG_PREFIX,
      fields: "title,slug,summary,last_reviewed",
      sort: "-last_reviewed",
      limit: String(ANSWER_LIMIT)
    });
    const response = await fetch(`${base}/items/wiki_articles?${params.toString()}`, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Previously asked questions unavailable: ${response.status}`);
    const body = await response.json();
    return (Array.isArray(body?.data) ? body.data : []).filter(answer => answer?.slug && answer?.title);
  }

  function init(options = {}) {
    if (instance) return instance;
    const platform = options.platform || "desktop";
    const pageMode = options.pageMode === true;
    const urlBackedModal = options.urlBackedModal === true;
    const questionUrl = options.questionUrl || QUESTION_PAGE_URL;
    const closeUrl = options.closeUrl || "/";
    const androidWebBrowser = isAndroidWebBrowserContext();
    // The dedicated question page is for writing a question, so it never opens the app invitation.
    const appPlatform = pageMode ? "" : appPromptPlatform();
    const identity = typeof options.getIdentity === "function" ? (options.getIdentity() || {}) : {};
    const shell = document.createElement("div");
    shell.className = `research-question-shell research-question-shell-${platform}`;
    shell.innerHTML = promptHtml(platform, appPlatform, questionUrl) + dialogHtml(identity);
    document.body.appendChild(shell);

    const appPrompt = shell.querySelector("[data-app-prompt]");
    const prompt = shell.querySelector("[data-research-question-prompt]");
    const restore = shell.querySelector("[data-research-question-restore]");
    const dialog = shell.querySelector("[data-research-question-dialog]");
    const form = shell.querySelector("[data-research-question-form]");
    const status = shell.querySelector("[data-research-question-status]");
    const submit = shell.querySelector("[data-research-question-submit]");
    const supportToggle = shell.querySelector("[data-research-support-enabled]");
    const supportFields = shell.querySelector("[data-research-support-fields]");
    const promptDismiss = shell.querySelector("[data-research-question-dismiss]");
    const appPromptAction = shell.querySelector("[data-app-prompt-action]");
    const archive = shell.querySelector("[data-research-question-archive]");
    const archiveList = shell.querySelector("[data-research-question-archive-list]");
    const showRestore = options.showRestore !== false;
    let archiveRequest = null;
    let archiveLoaded = false;
    const autoPrompt = options.autoPrompt !== false;
    let promptRequested = false;
    let appPromptRequested = false;
    let appPromptReturnFocus = null;
    let questionSent = false;
    let checkoutAttempt = 0;

    function isQuestionRoute() {
      return /^\/question\/?$/i.test(window.location.pathname);
    }

    function setQuestionRoute(open) {
      if (!urlBackedModal || pageMode) return;
      const target = open ? questionUrl : closeUrl;
      if (open && isQuestionRoute()) return;
      if (!open && !isQuestionRoute()) return;
      const method = open ? "pushState" : "replaceState";
      window.history?.[method]?.({}, "", target);
    }

    function dismissed() {
      try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
    }

    function setDismissed() {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    }

    function appPromptForced() {
      try { return Boolean(new URLSearchParams(window.location.search).get("app-prompt")); } catch { return false; }
    }

    function appPromptDismissed() {
      if (appPromptForced()) return false;
      try {
        return Number(localStorage.getItem(APP_PROMPT_DISMISSED_UNTIL_KEY) || 0) > Date.now();
      } catch {
        return false;
      }
    }

    function setAppPromptDismissed(cooldown = APP_PROMPT_COOLDOWN_MS) {
      try { localStorage.setItem(APP_PROMPT_DISMISSED_UNTIL_KEY, String(Date.now() + cooldown)); } catch {}
    }

    function interfaceBusy() {
      if (dialog && !dialog.hidden) return false;
      return typeof options.isUiBusy === "function" && options.isUiBusy();
    }

    function syncPrompt() {
      if (appPrompt) {
        const wasHidden = appPrompt.hidden;
        appPrompt.hidden = !appPromptRequested || appPromptDismissed() || !dialog.hidden;
        document.body.classList.toggle("app-download-prompt-open", !appPrompt.hidden);
        if (wasHidden && !appPrompt.hidden) {
          appPromptReturnFocus = document.activeElement;
          window.requestAnimationFrame(() => appPromptAction?.focus({ preventScroll: true }));
        }
      }
      // One invitation at a time: the question prompt waits until the app
      // invitation is closed (the "?" restore button stays available).
      const appPromptVisible = Boolean(appPrompt && !appPrompt.hidden);
      prompt.hidden = !promptRequested || dismissed() || interfaceBusy() || appPromptVisible;
      restore.hidden = !showRestore || !promptRequested || !prompt.hidden || !dialog.hidden || appPromptVisible;
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

    function renderArchive(answers) {
      archiveList.innerHTML = answers.slice(0, ANSWER_LIMIT).map(archiveItemHtml).join("");
      archive.hidden = !answers.length;
      archiveLoaded = answers.length > 0;
    }

    // The host's loaded articles come first (also offline); Directus is the
    // fallback. Until answers appear, each open tries again.
    function loadArchive() {
      if (archiveLoaded || archiveRequest) return;
      const local = typeof options.getPreviousQuestions === "function" ? (options.getPreviousQuestions() || []) : [];
      if (local.length) {
        renderArchive(local);
        return;
      }
      archiveRequest = fetchPublishedAnswers()
        .then(renderArchive)
        .catch(error => console.warn("Previously asked questions will load later.", error))
        .finally(() => { archiveRequest = null; });
    }

    function openArchiveLink(event) {
      const answerLink = event.target.closest("[data-research-question-answer]");
      const allLink = event.target.closest("[data-research-question-answers]");
      if (!answerLink && !allLink) return false;
      // Leave /question first so the answer's own route (?wiki=, ?topic=) is shareable.
      setQuestionRoute(false);
      const opened = answerLink
        ? options.openAnswer?.(answerLink.getAttribute("data-research-question-answer"))
        : options.openAnswers?.();
      if (!opened) return true;
      event.preventDefault();
      // The host already routed to the answer, so leave the URL alone.
      closeDialog({ updateUrl: false });
      return true;
    }

    function openDialog({ updateUrl = true } = {}) {
      const nativeAndroidApp = Boolean(
        window.AndroidApp
        || window.AndroidStory
        || document.body.classList.contains("native-android-app")
      );
      if (!pageMode && !urlBackedModal && !nativeAndroidApp) {
        window.location.assign(questionUrl);
        return;
      }
      if (updateUrl && !nativeAndroidApp) setQuestionRoute(true);
      setDismissed();
      prompt.hidden = true;
      refreshIdentity();
      loadArchive();
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

    function closeDialog({ updateUrl = true } = {}) {
      checkoutAttempt += 1;
      try {
        cancelPendingCheckout();
      } finally {
        if (pageMode) {
          window.location.assign(closeUrl);
          return;
        }
        dialog.hidden = true;
        document.body.classList.remove("research-question-dialog-open");
        if (updateUrl) setQuestionRoute(false);
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

    function dismissAppPrompt(event) {
      event?.preventDefault();
      event?.stopPropagation();
      setAppPromptDismissed();
      appPromptRequested = false;
      syncPrompt();
      try { appPromptReturnFocus?.focus?.({ preventScroll: true }); } catch {}
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
    shell.querySelectorAll("[data-app-prompt-dismiss]").forEach(control => control.addEventListener("click", dismissAppPrompt));
    // Following the link counts as an answer; the invitation stays closed when they come back.
    appPromptAction?.addEventListener("click", () => {
      setAppPromptDismissed(APP_PROMPT_ACTED_COOLDOWN_MS);
      appPromptRequested = false;
      window.setTimeout(syncPrompt, 0);
    });
    // Two controls: keep keyboard focus inside the invitation while it is open.
    appPrompt?.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        dismissAppPrompt(event);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = [...appPrompt.querySelectorAll(".app-download-card a, .app-download-card button")];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    shell.querySelectorAll("[data-research-question-close]").forEach(control => {
      control.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        closeDialog();
      });
    });
    shell.addEventListener("click", event => {
      if (openArchiveLink(event)) return;
      if (event.target.closest("[data-research-question-open]")) {
        event.preventDefault();
        openDialog();
      }
      window.requestAnimationFrame(syncPrompt);
    });
    form.addEventListener("submit", submitQuestion);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !dialog.hidden) closeDialog();
    });
    document.addEventListener("click", () => window.requestAnimationFrame(syncPrompt));
    window.addEventListener("resize", syncPrompt);
    if (urlBackedModal && !pageMode) {
      window.addEventListener("popstate", () => {
        if (isQuestionRoute()) openDialog({ updateUrl: false });
        else if (!dialog.hidden) closeDialog({ updateUrl: false });
      });
    }

    // Phone browsers get the app invitation instead, so they are not asked twice.
    if (autoPrompt && !androidWebBrowser && !appPlatform) {
      const delay = Number.isFinite(Number(options.delay)) ? Number(options.delay) : (platform === "mobile" ? 11000 : 9000);
      window.setTimeout(() => {
        promptRequested = true;
        syncPrompt();
      }, Math.max(0, delay));
    }
    if (appPrompt && !appPromptDismissed()) {
      // Let the map draw first, so the invitation opens over a page that is already there.
      const appPromptDelay = Number.isFinite(Number(options.appPromptDelay)) ? Number(options.appPromptDelay) : 1200;
      window.setTimeout(() => {
        appPromptRequested = true;
        syncPrompt();
      }, Math.max(0, appPromptDelay));
    }
    if (pageMode || (urlBackedModal && isQuestionRoute())) openDialog({ updateUrl: false });

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

  window.NLI_RESEARCH_QUESTION_UTILS = { init, QUESTION_PAGE_URL, ANDROID_BETA_EMAIL_URL };
}());
