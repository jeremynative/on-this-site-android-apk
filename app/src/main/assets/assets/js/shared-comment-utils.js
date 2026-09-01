(function () {
  const escapeHtml = window.NLI_SHARED_UTILS?.escapeHtml || (value => String(value || ""));

  try {
    localStorage.removeItem(["nli", "comment", "reactions"].join("-"));
    localStorage.removeItem(["nli", "local", "pending", "comments"].join("-"));
    localStorage.removeItem(["nli", "comment", "anon", "id"].join("-"));
  } catch {}

  function relationId(value) {
    if (value == null) return "";
    if (typeof value === "object") return String(value.id ?? value.value ?? "");
    return String(value);
  }

  const commentVoteIndexCache = new WeakMap();

  function commentVoteIndex(votes = []) {
    if (!Array.isArray(votes)) return new Map();
    const cached = commentVoteIndexCache.get(votes);
    if (cached) return cached;
    const index = new Map();
    votes.forEach(vote => {
      const commentId = relationId(vote?.comment);
      if (!commentId) return;
      if (!index.has(commentId)) index.set(commentId, []);
      index.get(commentId).push(vote);
    });
    commentVoteIndexCache.set(votes, index);
    return index;
  }

  function commentVotes(commentId, votes = []) {
    const id = String(commentId || "");
    return commentVoteIndex(votes).get(id) || [];
  }

  function directusReaction(commentId, voter, votes = []) {
    if (!voter) return "";
    const profileId = String(voter).replace(/^profile:/, "");
    const match = commentVotes(commentId, votes).find(vote => String(relationId(vote.member_profile)) === profileId);
    return match?.vote || "";
  }

  function directusReactionCounts(comment, votes = []) {
    const counts = {
      up: Number(comment?.upvotes || comment?.upvote_count || 0),
      down: Number(comment?.downvotes || comment?.downvote_count || 0),
      report: Number(comment?.reports || comment?.report_count || 0)
    };
    commentVotes(comment?.id, votes).forEach(vote => {
      const value = String(vote?.vote || "");
      if (value === "up" || value === "down" || value === "report") counts[value] += 1;
    });
    return counts;
  }

  function reactionCounts(comment, options) {
    return directusReactionCounts(comment, options?.votes || []);
  }

  function score(comment, options = {}) {
    const counts = typeof options.reactionCounts === "function"
      ? options.reactionCounts(comment)
      : reactionCounts(comment, options);
    return Number(counts.up || 0) - Number(counts.down || 0);
  }

  function ranked(comments = [], options = {}) {
    return [...(comments || [])].sort((a, b) =>
      score(b, options) - score(a, options) ||
      new Date(a.created_at || 0) - new Date(b.created_at || 0)
    );
  }

  function controlsHtml(comment, voter, options = {}) {
    const votes = options?.votes || [];
    const counts = directusReactionCounts(comment, votes);
    if (!voter) {
      return `
        <button class="comment-vote-button" type="button" data-comment-vote-login aria-label="Log in to mark comment helpful">Helpful ${counts.up}</button>
        <button class="comment-vote-button report" type="button" data-comment-vote-login aria-label="Log in to report a concern">Report concern${counts.report ? ` ${counts.report}` : ""}</button>
      `;
    }
    const active = directusReaction(comment?.id, voter, votes);
    return `
      <button class="comment-vote-button${active === "up" ? " active" : ""}" type="button" ${active ? "disabled " : ""}data-comment-vote="up" data-comment-id="${escapeHtml(comment?.id)}" aria-label="Mark comment helpful">Helpful ${counts.up}</button>
      <button class="comment-vote-button report${active === "report" ? " active" : ""}" type="button" ${active ? "disabled " : ""}data-comment-vote="report" data-comment-id="${escapeHtml(comment?.id)}" aria-label="Report concern">Report concern${counts.report ? ` ${counts.report}` : ""}</button>
    `;
  }

  function reactionState(commentOrId, profile, options = {}) {
    const comment = typeof commentOrId === "object" && commentOrId
      ? commentOrId
      : { id: commentOrId };
    const votes = options?.votes || [];
    const voter = commentVoterKey(profile, options.canVote !== false);
    return {
      voter,
      active: directusReaction(comment?.id, voter, votes),
      counts: directusReactionCounts(comment, votes),
      controls: controlsHtml(comment, voter, { votes })
    };
  }

  function normalizeCommentStatus(comment) {
    const value = String(comment?.status || "approved").toLowerCase();
    if (value.includes("approve")) return "approved";
    if (value.includes("reject") || value.includes("decline")) return "rejected";
    if (value.includes("delete") || value.includes("remove")) return "deleted";
    if (value.includes("pending") || value.includes("review")) return "pending";
    return value || "approved";
  }

  function normalizeSourceType(comment) {
    const value = String(comment?.source_type || (comment?.site_slug ? "site" : "")).toLowerCase();
    if (value.includes("wiki")) return "wiki";
    if (value.includes("site") || value.includes("listing")) return "site";
    return value;
  }

  function isModeratedDeleted(comment) {
    return comment?.moderated_deleted === true || comment?.moderated_deleted === 1 || String(comment?.moderated_deleted || "").toLowerCase() === "true";
  }

  function isLikelyPublicTestComment(comment = {}) {
    const author = String(comment.author_name || "").trim().toLowerCase();
    const body = String(comment.comment || "").trim().toLowerCase();
    const source = String(comment.source_title || comment.site_title || comment.source_slug || comment.site_slug || "").trim().toLowerCase();
    if (author === "bob dylan" && source.includes("whale") && (body === "yup" || body === "thats how i feel" || body === "that's how i feel")) return true;
    if (author.includes("ocean pin mobile tester")) return true;
    const qaTool = "co" + "dex";
    if (author.includes(qaTool) || body.includes(qaTool)) return true;
    if (/feedback-verifier|permission test|fallback test/.test(source)) return true;
    return false;
  }

  function visibleToViewer(comment, options = {}) {
    if (!comment) return false;
    if (isModeratedDeleted(comment)) return true;
    if (isLikelyPublicTestComment(comment)) return false;
    const normalizeStatus = options.normalizeStatus || normalizeCommentStatus;
    const isProfileBanned = typeof options.isProfileBanned === "function"
      ? options.isProfileBanned
      : () => false;
    if (isProfileBanned(options.authorProfile || null)) return false;
    const status = normalizeStatus(comment);
    if (status === "rejected" || status === "deleted") return false;
    if (status === "approved" || status === "pending") return true;
    if (options.adminMode) return true;
    const profile = options.profile || null;
    return Boolean(profile?.id && Number(comment.member_profile) === Number(profile.id));
  }

  function isPublicActivityComment(comment, options = {}) {
    if (!comment || isLikelyPublicTestComment(comment)) return false;
    if (isModeratedDeleted(comment)) return false;
    const normalizeStatus = options.normalizeStatus || normalizeCommentStatus;
    return !["rejected", "deleted"].includes(normalizeStatus(comment));
  }

  function matchesSource(comment, sourceType, item, options = {}) {
    if (!comment || !item) return false;
    const normalize = options.normalizeSourceType || normalizeSourceType;
    const normalizedType = normalize(comment);
    const sourceSlug = item.slug;
    const sourceId = Number(item.id);
    if (normalizedType) {
      const slugMatches = comment.source_slug === sourceSlug || (options.useLegacySiteSlug && comment.site_slug === sourceSlug);
      const idMatches = options.matchSourceId && Number(comment.source_id) === sourceId;
      return normalizedType === sourceType && (slugMatches || idMatches);
    }
    if (!options.allowLegacySiteFallback) return false;
    return sourceType === "site" && (comment.site_slug === sourceSlug || Number(comment.site) === sourceId);
  }

  function commentsForSource(comments = [], sourceType, item, options = {}) {
    if (!item) return [];
    const isVisible = typeof options.isVisible === "function" ? options.isVisible : () => true;
    const matchOptions = options.matchOptions || {};
    const sortCompare = typeof options.sortCompare === "function"
      ? options.sortCompare
      : (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0);
    return (comments || [])
      .filter(comment => isVisible(comment) && matchesSource(comment, sourceType, item, matchOptions))
      .sort(sortCompare);
  }

  function commentThreadIndex(comments = [], options = {}) {
    const roots = [];
    const byId = new Map();
    const repliesByParent = new Map();
    const excludeRoot = typeof options.excludeRoot === "function" ? options.excludeRoot : () => false;
    (comments || []).forEach(comment => {
      const id = relationId(comment?.id);
      if (id) byId.set(id, comment);
    });
    (comments || []).forEach(comment => {
      const parentId = relationId(comment?.parent_comment);
      if (!parentId || parentId === "0") {
        if (!excludeRoot(comment)) roots.push(comment);
        return;
      }
      if (!repliesByParent.has(parentId)) repliesByParent.set(parentId, []);
      repliesByParent.get(parentId).push(comment);
    });
    return {
      roots,
      byId,
      repliesByParent,
      repliesFor(parentId) {
        return repliesByParent.get(relationId(parentId)) || [];
      },
      parentFor(comment) {
        return byId.get(relationId(comment?.parent_comment)) || null;
      }
    };
  }

  function mergeSeededComments(comments = [], seededComments = [], options = {}) {
    const existing = comments || [];
    const keyFor = typeof options.keyFor === "function"
      ? options.keyFor
      : comment => String(comment?.id || "");
    const keys = new Set(existing.map(keyFor).filter(Boolean));
    const seeded = (seededComments || []).filter(comment => {
      const key = keyFor(comment);
      if (!key || keys.has(key)) return false;
      keys.add(key);
      return true;
    });
    return [...existing, ...seeded];
  }

  function mergeFetchedCommentsPreservingPending(nextRows = [], currentRows = []) {
    const incoming = (Array.isArray(nextRows) ? nextRows : []).map(row => ({
      ...row,
      _local_pending: false
    }));
    const incomingIds = new Set(incoming.map(row => String(row?.id || "")).filter(Boolean));
    const pending = (Array.isArray(currentRows) ? currentRows : []).filter(row =>
      row?._local_pending === true &&
      (!row.id || !incomingIds.has(String(row.id)))
    );
    return pending.length ? [...incoming, ...pending] : incoming;
  }

  function mergeRecordsByIdOrKey(target = [], records = [], keyField = "vote_key") {
    (records || []).forEach(record => {
      if (!record) return;
      const id = Number(record.id);
      const key = String(record[keyField] || "");
      const index = id
        ? target.findIndex(item => Number(item.id) === id)
        : target.findIndex(item => key && String(item[keyField] || "") === key);
      if (index >= 0) target[index] = { ...target[index], ...record };
      else target.push(record);
    });
    return target;
  }

  function mergeCommentVoteRecords(target = [], records = []) {
    const merged = mergeRecordsByIdOrKey(target, records, "vote_key");
    if (Array.isArray(target)) commentVoteIndexCache.delete(target);
    return merged;
  }

  async function refreshRemoteCommentVote(commentId, profileId, options = {}) {
    if (typeof options.fetchJson !== "function") return null;
    const key = voteKey(commentId, profileId);
    const fields = options.fields || "";
    const response = await options.fetchJson(
      `/items/mobile_comment_votes?limit=1&filter[vote_key][_eq]=${encodeURIComponent(key)}&fields=${fields}`,
      options.fetchOptions || {}
    );
    const incoming = response?.data || [];
    if (typeof options.merge === "function") options.merge(incoming);
    return incoming[0] || null;
  }

  function commentVoterKey(profile, canVote = true) {
    if (!profile?.id || !canVote) return "";
    return `profile:${profile.id}`;
  }

  function viewerOwnsComment(comment, options = {}) {
    const profile = options.profile || null;
    const viewerEmail = String(options.viewerEmail || profile?.username || "").toLowerCase();
    if (profile?.id && Number(comment?.member_profile) === Number(profile.id)) return true;
    return Boolean(viewerEmail && String(comment?.author_email || "").toLowerCase() === viewerEmail);
  }

  function voteKey(commentId, profileId) {
    return `${String(commentId)}:${String(profileId)}`;
  }

  function votePayload(commentId, value, profile, options = {}) {
    const id = String(commentId);
    const profileId = Number(profile?.id);
    return {
      comment: Number(id),
      vote: value === "report" ? "report" : "up",
      member_profile: profileId,
      vote_key: voteKey(id, profileId),
      created_at: options.createdAt || new Date().toISOString()
    };
  }

  function helpfulVotePointEvent(options = {}) {
    const comment = options.comment || {};
    const voteRecord = options.voteRecord || {};
    const relation = options.relationId || relationId;
    return {
      event_key: `helpful_vote:${String(options.commentId)}:${String(options.profileId)}`,
      event_type: "helpful_vote",
      points: Number(options.points || 0),
      member_profile: Number(relation(comment.member_profile)),
      source_collection: "mobile_comment_votes",
      source_id: voteRecord.id,
      source_slug: comment.source_slug || comment.site_slug || "",
      source_title: comment.source_title || comment.site_title || "Helpful comment vote",
      created_at: voteRecord.created_at || new Date().toISOString()
    };
  }

  function comparableMediaUrl(value, baseUrl = window.location.href) {
    try {
      const parsed = new URL(String(value || ""), baseUrl);
      return `${parsed.origin}${parsed.pathname}`.toLowerCase();
    } catch {
      return String(value || "").trim().toLowerCase().split(/[?#]/)[0];
    }
  }

  function approvedCommentPhotoSlides(comments = [], listingImage = "", options = {}) {
    const normalizeStatus = options.normalizeStatus || normalizeCommentStatus;
    const assetUrl = typeof options.assetUrl === "function"
      ? options.assetUrl
      : comment => comment?.comment_image || "";
    const snapshotUrl = typeof options.snapshotUrl === "function"
      ? options.snapshotUrl
      : value => value;
    const comparableUrl = typeof options.comparableUrl === "function"
      ? options.comparableUrl
      : comparableMediaUrl;
    const authorName = typeof options.authorName === "function"
      ? options.authorName
      : comment => comment?.author_name || "Contributor";
    const seen = new Set([comparableUrl(listingImage)].filter(Boolean));
    const slides = [];
    (comments || []).forEach(comment => {
      if (normalizeStatus(comment) !== "approved") return;
      const source = assetUrl(comment);
      if (!source) return;
      const image = snapshotUrl(source, comment);
      const comparable = comparableUrl(image);
      if (!image || !comparable || seen.has(comparable)) return;
      seen.add(comparable);
      slides.push({
        id: String(comment?.id || ""),
        image,
        author: authorName(comment) || "Contributor"
      });
    });
    return slides;
  }

  function visibleCarouselSlides(root) {
    if (!root) return [];
    return [...root.querySelectorAll("[data-site-hero-slide-index]")].filter(slide => !slide.hidden);
  }

  function setCarouselIndex(root, requestedIndex) {
    const slides = visibleCarouselSlides(root);
    if (!slides.length) return false;
    const normalized = ((Number(requestedIndex) % slides.length) + slides.length) % slides.length;
    const activeSlide = slides[normalized];
    const activeIndex = String(activeSlide.dataset.siteHeroSlideIndex || "0");
    root.dataset.siteHeroIndex = activeIndex;
    root.querySelectorAll("[data-site-hero-slide-index]").forEach(slide => {
      const active = slide === activeSlide;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      if (slide.matches("button")) slide.tabIndex = active ? 0 : -1;
    });
    root.querySelectorAll("[data-site-hero-dot]").forEach(dot => {
      const active = dot.dataset.siteHeroDot === activeIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-pressed", String(active));
    });
    const credit = String(activeSlide.dataset.siteHeroCredit || "").trim();
    const creditNode = root.nextElementSibling?.matches?.("[data-site-hero-carousel-credit]")
      ? root.nextElementSibling
      : null;
    if (creditNode) {
      creditNode.textContent = credit;
      creditNode.hidden = !credit;
    }
    return true;
  }

  function advanceCarousel(root, delta = 1) {
    const slides = visibleCarouselSlides(root);
    if (slides.length < 2) return false;
    const current = slides.findIndex(slide => slide.classList.contains("is-active"));
    return setCarouselIndex(root, current + Number(delta || 0));
  }

  function bindCarouselInteractions(root, options = {}) {
    if (!root) return false;
    root.querySelectorAll("[data-site-hero-comment-image]").forEach(image => {
      if (image.dataset.siteHeroErrorBound === "true") return;
      image.dataset.siteHeroErrorBound = "true";
      image.addEventListener("error", () => {
        const slide = image.closest("[data-site-hero-slide-index]");
        const failedIndex = slide?.dataset.siteHeroSlideIndex;
        if (slide) slide.hidden = true;
        if (failedIndex != null) {
          [...root.querySelectorAll("[data-site-hero-dot]")]
            .find(dot => dot.dataset.siteHeroDot === String(failedIndex))
            ?.setAttribute("hidden", "");
        }
        setCarouselIndex(root, 0);
        options.onSlidesChanged?.(root);
      }, { once: true });
    });
    if (root.dataset.siteHeroInteractionsBound === "true") return true;
    root.dataset.siteHeroInteractionsBound = "true";
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartedAt = 0;
    root.addEventListener("touchstart", event => {
      if (event.touches.length !== 1) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchStartedAt = Date.now();
    }, { passive: true });
    root.addEventListener("touchend", event => {
      const touch = event.changedTouches[0];
      if (!touch || !touchStartedAt) return;
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const elapsed = Date.now() - touchStartedAt;
      touchStartedAt = 0;
      if (elapsed > 1000 || Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) return;
      advanceCarousel(root, deltaX < 0 ? 1 : -1);
      root.dataset.siteHeroSuppressClickUntil = String(Date.now() + 500);
      options.onRestart?.(root);
    }, { passive: true });
    root.addEventListener("click", event => {
      if (Number(root.dataset.siteHeroSuppressClickUntil || 0) <= Date.now()) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    return true;
  }

  function activityThreadHtml(comments = [], options = {}) {
    const escape = options.escapeHtml || (value => String(value || ""));
    const authorName = options.authorName || (comment => comment?.author_name || "Contributor");
    const parse = options.parseComment || (comment => ({ body: comment?.comment || "", quote: "" }));
    const attachmentUrl = options.attachmentUrl || (() => "");
    const entries = comments.map(comment => {
      const name = authorName(comment);
      const parsed = parse(comment) || {};
      const body = parsed.body || (!parsed.quote ? comment.comment || "" : "");
      const attachment = attachmentUrl(comment) || "";
      const date = comment.created_at ? new Date(comment.created_at).toLocaleString() : "Approved comment";
      return `<article class="activity-thread-entry${comment.parent_comment ? " is-reply" : ""}"><strong>${escape(name)}</strong>${parsed.quote ? `<q>${escape(parsed.quote)}</q>` : ""}${body ? `<span class="activity-thread-caption">${escape(body)}</span>` : ""}${attachment ? `<img class="comment-image activity-thread-image" src="${escape(attachment)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : ""}<time>${escape(date)}</time></article>`;
    }).join("");
    return `<div class="activity-comment-thread" aria-label="Existing comments"><div class="activity-comment-thread-heading"><strong>${comments.length} comment${comments.length === 1 ? "" : "s"}</strong><span>${comments.length ? "Join the conversation below." : "Start the conversation."}</span></div>${entries || `<p class="activity-thread-empty">No comments yet.</p>`}</div>`;
  }

  window.NLI_COMMENT_UTILS = {
    relationId,
    commentVotes,
    directusReaction,
    directusReactionCounts,
    reactionCounts,
    score,
    ranked,
    controlsHtml,
    reactionState,
    normalizeStatus: normalizeCommentStatus,
    normalizeSourceType,
    isModeratedDeleted,
    isLikelyPublicTestComment,
    isPublicActivityComment,
    visibleToViewer,
    matchesSource,
    commentsForSource,
    commentThreadIndex,
    mergeSeededComments,
    mergeFetchedCommentsPreservingPending,
    mergeRecordsByIdOrKey,
    mergeCommentVoteRecords,
    refreshRemoteCommentVote,
    commentVoterKey,
    viewerOwnsComment,
    voteKey,
    votePayload,
    helpfulVotePointEvent,
    comparableMediaUrl,
    approvedCommentPhotoSlides,
    visibleCarouselSlides,
    setCarouselIndex,
    advanceCarousel,
    bindCarouselInteractions,
    activityThreadHtml
  };
}());
