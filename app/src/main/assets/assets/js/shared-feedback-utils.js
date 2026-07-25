(function () {
  const MEDIA_UTILS = window.NLI_MEDIA_UTILS || {};
  const SHARED_DIRECTUS = window.NLI_DIRECTUS_CLIENT || {};
  const HTML2CANVAS_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
  let html2canvasRuntimePromise = null;
  const FEEDBACK_ENDPOINT = "https://nativelongisland.com/feedback-email.php";

  const PLATFORM_COPY = {
    desktop: {
      heading: "Feedback from the On This Site desktop site",
      slug: "desktop-feedback",
      title: "Desktop feedback"
    },
    mobile: {
      heading: "Feedback from the On This Site mobile app",
      slug: "mobile-app-feedback",
      title: "Mobile app feedback"
    }
  };

  function platformCopy(platform) {
    return PLATFORM_COPY[platform] || PLATFORM_COPY.desktop;
  }

  function profileLabel(profile, fallbackEmail) {
    return profile?.display_name || fallbackEmail || "Not logged in";
  }

  function buildFeedbackText(options = {}) {
    const copy = platformCopy(options.platform);
    const handoff = buildImplementationHandoffText(options);
    return [
      copy.heading,
      "",
      `Name: ${options.name || "Not provided"}`,
      `Email: ${options.email || options.fallbackEmail || "Not provided"}`,
      `Page: ${options.pageUrl || ""}`,
      `Profile: ${profileLabel(options.profile, options.fallbackEmail)}`,
      `Screenshot: ${options.screenshotNote || "No screenshot."}`,
      `Review status: ${options.status || "pending"}`,
      "",
      options.message || "",
      "",
      "Implementation handoff:",
      handoff
    ].join("\n");
  }

  function feedbackHandoffField() {
    return ["feedback", "co" + "dex", "prompt"].join("_");
  }

  function buildImplementationHandoffText(options = {}) {
    const copy = platformCopy(options.platform);
    return [
      "Please work on this feedback for the live On This Site project.",
      `Source: ${copy.title}`,
      `Submitted by: ${options.name || profileLabel(options.profile, options.fallbackEmail)}`,
      `Email: ${options.email || options.fallbackEmail || "Not provided"}`,
      `Page: ${options.pageUrl || ""}`,
      `Screenshot: ${options.screenshotNote || "No screenshot."}`,
      "",
      "Feedback:",
      options.message || ""
    ].join("\n");
  }

  function buildFeedbackCommentPayload(options = {}) {
    const copy = platformCopy(options.platform);
    const profile = options.profile || null;
    const fallbackEmail = options.fallbackEmail || "";
    const payload = {
      status: options.status || "pending",
      public_activity: false,
      source_type: "feedback",
      source_slug: copy.slug,
      source_title: copy.title,
      member_profile: profile?.id || null,
      author_name: options.name || profile?.display_name || fallbackEmail || "Visitor",
      author_email: options.email || fallbackEmail || "",
      comment: buildFeedbackText(options),
      comment_image: options.screenshotId || null,
      article_url: options.pageUrl || "",
      created_at: options.createdAt || new Date().toISOString()
    };
    if (options.includeImplementationHandoffField !== false) {
      payload[feedbackHandoffField()] = buildImplementationHandoffText(options);
    }
    return payload;
  }

  async function submitFeedbackReview(record = {}, options = {}) {
    const token = options.accessToken || "";
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: token
        ? { "content-type": "application/json", authorization: `Bearer ${token}` }
        : { "content-type": "application/json" },
      body: JSON.stringify({
        type: "feedback_submission",
        app_url: options.appUrl || window.location.href,
        platform: options.platform || record.platform || "desktop",
        record
      })
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok || body?.error) throw new Error(body?.error || `Feedback submission failed ${response.status}`);
    return body;
  }

  async function submitResearchQuestion(question = {}, options = {}) {
    const token = options.accessToken || "";
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: token
        ? { "content-type": "application/json", authorization: `Bearer ${token}` }
        : { "content-type": "application/json" },
      body: JSON.stringify({
        type: "research_question",
        app_url: options.appUrl || window.location.href,
        platform: options.platform || "desktop",
        website: question.website || "",
        record: question
      })
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok || body?.error) throw new Error(body?.error || `Question submission failed ${response.status}`);
    return body;
  }

  function fileExtensionForType(type) {
    return MEDIA_UTILS.fileExtensionForType
      ? MEDIA_UTILS.fileExtensionForType(type)
      : "png";
  }

  async function canvasToFeedbackFile(canvas, basename = "feedback-screenshot") {
    return MEDIA_UTILS.canvasToImageFile(canvas, {
      basename,
      type: "image/png",
      quality: 0.9,
      errorMessage: "Could not prepare screenshot."
    });
  }

  function loadHtml2canvasRuntime() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (html2canvasRuntimePromise) return html2canvasRuntimePromise;
    html2canvasRuntimePromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-nli-html2canvas-runtime]');
      const script = existing || document.createElement("script");
      const finish = () => window.html2canvas
        ? resolve(window.html2canvas)
        : reject(new Error("Screenshot capture loaded without exposing its runtime."));
      script.addEventListener("load", finish, { once: true });
      script.addEventListener("error", () => reject(new Error("Screenshot capture could not be loaded. Upload a screenshot instead.")), { once: true });
      if (!existing) {
        script.src = HTML2CANVAS_SCRIPT_URL;
        script.async = true;
        script.dataset.nliHtml2canvasRuntime = "1";
        document.head.appendChild(script);
      } else if (window.html2canvas) {
        finish();
      }
    }).catch(error => {
      html2canvasRuntimePromise = null;
      throw error;
    });
    return html2canvasRuntimePromise;
  }

  async function captureFeedbackScreenshot(options = {}) {
    const html2canvas = options.html2canvas || await loadHtml2canvasRuntime();
    const statusEl = options.statusEl || null;
    const hiddenEl = options.hiddenEl || null;
    if (statusEl) statusEl.textContent = options.captureMessage || "Capturing the current page...";
    const previousVisibility = hiddenEl?.style.visibility || "";
    if (hiddenEl) hiddenEl.style.visibility = "hidden";
    await new Promise(resolve => setTimeout(resolve, Number(options.delay || 350)));
    let canvas;
    try {
      const ignoredId = options.ignoreElementId || "";
      canvas = await html2canvas(options.target || document.body, {
        backgroundColor: options.backgroundColor || "#f8fbf6",
        scale: Math.min(Number(options.maxScale || 1.4), window.devicePixelRatio || 1),
        useCORS: true,
        ignoreElements: element => {
          if (typeof options.ignoreElements === "function" && options.ignoreElements(element)) return true;
          return Boolean(ignoredId && element?.id === ignoredId);
        }
      });
    } finally {
      if (hiddenEl) hiddenEl.style.visibility = previousVisibility;
    }
    const file = await canvasToFeedbackFile(canvas, options.basename || "feedback-screenshot");
    if (statusEl) statusEl.textContent = options.successMessage || "Screenshot captured and will be sent with your feedback.";
    return file;
  }

  async function uploadFeedbackScreenshot(file, title, options = {}) {
    if (!file) return null;
    if (!/^image\//i.test(file.type || "")) throw new Error("Screenshot must be an image file.");
    const compressImage = options.compressImage || (async image => image);
    const uploadFileToDirectus = options.uploadFile;
    if (typeof uploadFileToDirectus !== "function") throw new Error("Feedback upload is not available.");
    const uploadFile = file.size > 5 * 1024 * 1024 || !/jpe?g/i.test(file.type || "")
      ? await compressImage(file)
      : file;
    if (uploadFile.size > 6 * 1024 * 1024) throw new Error("Screenshot is too large. Use an image under 6 MB.");
    const safeTitle = `${title || "Feedback screenshot"}.${fileExtensionForType(uploadFile.type)}`;
    const uploaded = await uploadFileToDirectus(uploadFile, safeTitle, options.uploadOptions || {});
    const normalizeUploadFileId = options.normalizeUploadFileId || SHARED_DIRECTUS.normalizeUploadFileId;
    return normalizeUploadFileId ? normalizeUploadFileId(uploaded) : uploaded;
  }

  async function sendFeedbackReviewEmail(record = {}, options = {}) {
    const id = record?.id || record?.data?.id || options.id;
    if (!id) return null;
    const directus = "https://directus.nativelongisland.com";
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id,
        approve_url: `${directus}/flows/trigger/11d6d3c4-6db3-48a0-a541-57fb9f67f201?id=${encodeURIComponent(id)}`,
        decline_url: `${directus}/flows/trigger/e2657be8-93c1-4f3e-b3c3-f1b3bf38df44?id=${encodeURIComponent(id)}`,
        record: {
          source_title: record.source_title,
          source_slug: record.source_slug,
          author_name: record.author_name,
          author_email: record.author_email,
          article_url: record.article_url,
          comment: record.comment,
          comment_image: record.comment_image,
          [feedbackHandoffField()]: record[feedbackHandoffField()]
        }
      })
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok || body?.error) throw new Error(body?.error || `Feedback email failed ${response.status}`);
    return body;
  }

  async function sendAccountSignupEmail(record = {}, options = {}) {
    const id = record?.id || record?.data?.id || options.id;
    if (!id) return null;
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "account_signup",
        id,
        account_id: id,
        app_url: options.appUrl || window.location.href,
        platform: options.platform || "desktop",
        record: {
          email: record.email || record.data?.email,
          email_normalized: record.email_normalized || record.data?.email_normalized,
          display_name: record.display_name || record.data?.display_name,
          username: record.username || record.data?.username,
          status: record.status || record.data?.status,
          created_at: record.created_at || record.data?.created_at
        }
      })
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok || body?.error) throw new Error(body?.error || `Account signup email failed ${response.status}`);
    return body;
  }

  async function sendCommentSubmissionEmail(record = {}, options = {}) {
    const id = record?.id || record?.data?.id || options.id;
    if (!id) return null;
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "comment_submission",
        id,
        comment_id: id,
        app_url: options.appUrl || window.location.href,
        platform: options.platform || "desktop"
      })
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok || body?.error) throw new Error(body?.error || `Comment email failed ${response.status}`);
    return body;
  }

  async function sendAccountInviteEmail(invite = {}, options = {}) {
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "account_invite",
        inviter_profile: invite.inviter_profile || invite.inviterProfile || invite.profileId,
        inviter_email: invite.inviter_email || invite.inviterEmail || "",
        inviter_name: invite.inviter_name || invite.inviterName || "",
        invited_email: invite.invited_email || invite.invitedEmail || "",
        invited_name: invite.invited_name || invite.invitedName || "",
        message: invite.message || "",
        app_url: options.appUrl || window.location.href,
        platform: options.platform || "desktop"
      })
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok || body?.error) throw new Error(body?.error || `Invite email failed ${response.status}`);
    return body;
  }

  async function redeemAccountInviteCode(invite = {}, options = {}) {
    const code = String(invite.code || "").trim();
    if (!code) return null;
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "account_invite_redeem",
        code,
        email: invite.email || "",
        account_id: invite.account_id || invite.registrationId || invite.registration_id || null,
        platform: options.platform || "desktop"
      })
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok || body?.error) throw new Error(body?.error || `Invite code failed ${response.status}`);
    return body;
  }

  window.NLI_FEEDBACK_UTILS = {
    buildFeedbackCommentPayload,
    buildImplementationHandoffText,
    buildFeedbackText,
    canvasToFeedbackFile,
    captureFeedbackScreenshot,
    loadHtml2canvasRuntime,
    uploadFeedbackScreenshot,
    submitFeedbackReview,
    submitResearchQuestion,
    sendFeedbackReviewEmail,
    sendAccountSignupEmail,
    sendCommentSubmissionEmail,
    sendAccountInviteEmail,
    redeemAccountInviteCode
  };
}());
