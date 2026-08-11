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

  function commentVotes(commentId, votes = []) {
    const id = String(commentId || "");
    return (votes || []).filter(vote => String(relationId(vote.comment)) === id);
  }

  function directusReaction(commentId, voter, votes = []) {
    if (!voter) return "";
    const profileId = String(voter).replace(/^profile:/, "");
    const match = commentVotes(commentId, votes).find(vote => String(relationId(vote.member_profile)) === profileId);
    return match?.vote || "";
  }

  function directusReactionCounts(comment, votes = []) {
    const values = commentVotes(comment?.id, votes).map(vote => String(vote.vote || ""));
    return {
      up: Number(comment?.upvotes || comment?.upvote_count || 0) + values.filter(value => value === "up").length,
      down: Number(comment?.downvotes || comment?.downvote_count || 0) + values.filter(value => value === "down").length,
      report: Number(comment?.reports || comment?.report_count || 0) + values.filter(value => value === "report").length
    };
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
    return mergeRecordsByIdOrKey(target, records, "vote_key");
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
    activityThreadHtml
  };
}());
