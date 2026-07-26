(function () {
  const relationId = window.NLI_SHARED_UTILS?.relationId || (value => {
    if (!value) return "";
    if (typeof value === "object") return value.id || value.value || "";
    return value;
  });

  function storyVotes(story, votes = []) {
    const id = String(story?.id || "");
    return (votes || []).filter(vote => String(relationId(vote.story)) === id);
  }

  function storyVoteCounts(story, votes = []) {
    const matchingVotes = storyVotes(story, votes);
    const up = matchingVotes.filter(vote => Number(vote.vote) > 0).length || Number(story?.up_votes || 0);
    const down = matchingVotes.filter(vote => Number(vote.vote) < 0).length || Number(story?.down_votes || 0);
    return { up, down, score: up - down };
  }

  function currentTime(options = {}) {
    const value = Number(options.now);
    return Number.isFinite(value) && value > 0 ? value : Date.now();
  }

  function effectiveExpiresAt(story, votes = [], options = {}) {
    if (story?.permanent || story?.admin_permanent) return null;
    const baseLifetimeMs = Number(options.baseLifetimeMs || 24 * 60 * 60 * 1000);
    const voteHourMs = Number(options.voteHourMs || 60 * 60 * 1000);
    const created = Date.parse(story?.created_at || "") || currentTime(options);
    const original = Date.parse(story?.expires_original_at || story?.expires_at || "") || (created + baseLifetimeMs);
    const counts = storyVoteCounts(story, votes);
    return new Date(original + (counts.up - counts.down) * voteHourMs);
  }

  function isPermanent(story, votes = [], options = {}) {
    const permanentScore = Number(options.permanentScore || 10);
    return Boolean(story?.permanent || story?.admin_permanent || storyVoteCounts(story, votes).score >= permanentScore);
  }

  function isActive(story, votes = [], options = {}) {
    if (!story || story.status === "rejected" || story.status === "archived") return false;
    if (isPermanent(story, votes, options)) return true;
    const expiry = effectiveExpiresAt(story, votes, options);
    return !expiry || expiry.getTime() > currentTime(options);
  }

  function activeStories(stories = [], votes = [], options = {}) {
    return (stories || []).filter(story => isActive(story, votes, options));
  }

  function timeLabel(story, votes = [], options = {}) {
    if (isPermanent(story, votes, options)) return "Permanent story";
    const expiry = effectiveExpiresAt(story, votes, options);
    if (!expiry) return "Story";
    const voteHourMs = Number(options.voteHourMs || 60 * 60 * 1000);
    const hours = Math.max(0, Math.ceil((expiry.getTime() - currentTime(options)) / voteHourMs));
    return hours > 1 ? `${hours} hours left` : `${hours || 1} hour left`;
  }

  function visitorKey(storage = localStorage) {
    const storageKey = "nli-map-story-visitor-key";
    let value = storage.getItem(storageKey);
    if (!value) {
      value = `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      storage.setItem(storageKey, value);
    }
    return value;
  }

  function memberVoteKey(storyId, profileId) {
    return storyId && profileId ? `story:${storyId}:profile:${profileId}` : "";
  }

  function hasVisitorVote(story, votes = [], key = visitorKey()) {
    return storyVotes(story, votes).some(vote => String(vote.visitor_key || "") === key);
  }

  function hasMemberVote(story, votes = [], profileId) {
    const memberId = Number(relationId(profileId));
    if (!memberId) return false;
    const storyId = String(story?.id || "");
    const voteKey = memberVoteKey(storyId, memberId);
    return storyVotes(story, votes).some(vote =>
      Number(relationId(vote.member_profile)) === memberId ||
      (voteKey && String(vote.visitor_key || "") === voteKey)
    );
  }

  function mergeVoteRecords(target = [], records = []) {
    (records || []).filter(Boolean).forEach(record => {
      const id = Number(record.id);
      const visitorKey = String(record.visitor_key || "");
      const index = Number.isFinite(id) && id > 0
        ? target.findIndex(item => Number(item.id) === id)
        : target.findIndex(item => visitorKey && String(item.visitor_key || "") === visitorKey);
      if (index >= 0) target[index] = { ...target[index], ...record };
      else target.push(record);
    });
    return target;
  }

  function mergeStoryRecords(current = [], remote = [], options = {}) {
    const now = Number(options.now || Date.now());
    const localGraceMs = Math.max(0, Number(options.localGraceMs || 2 * 60 * 1000));
    const remoteById = new Map();
    (remote || []).filter(Boolean).forEach(story => {
      const id = String(story.id || "");
      if (id) remoteById.set(id, story);
    });
    const merged = Array.from(remoteById.values());
    const mergedIds = new Set(remoteById.keys());

    (current || []).filter(Boolean).forEach(story => {
      const id = String(story.id || "");
      if (id && mergedIds.has(id)) return;
      const createdAt = Date.parse(story.created_at || "") || 0;
      const pendingUntil = Number(story._pendingServerSyncUntil || 0);
      const locallyRecent = Boolean(
        story._pendingServerSync
        || id.startsWith("local-")
        || pendingUntil > now
        || (createdAt && now - createdAt <= localGraceMs)
      );
      if (locallyRecent && isActive(story, [], options)) merged.push(story);
    });

    return merged.map(story => {
      const id = String(story.id || "");
      if (!id || !remoteById.has(id)) return story;
      const previous = (current || []).find(item => String(item?.id || "") === id);
      const next = { ...(previous || {}), ...story };
      delete next._pendingServerSync;
      delete next._pendingServerSyncUntil;
      return next;
    });
  }

  function authorName(story, fallback = "Contributor") {
    return story?.author_name || fallback;
  }

  function quotedText(story, options = {}) {
    const fallback = options.fallback || "A visitor shared this place on the map.";
    const separator = options.separator || " - ";
    const text = String(story?.caption || fallback).trim();
    return `"${text}"${separator}${authorName(story, options.authorFallback || "Contributor")}`;
  }

  function coordinates(story) {
    const lng = Number(story?.longitude);
    const lat = Number(story?.latitude);
    return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
  }

  function promptForKey(prompts = [], key = "") {
    const promptList = Array.isArray(prompts) ? prompts : [];
    return promptList.find(prompt => prompt?.key === key) || promptList[0] || null;
  }

  window.NLI_MAP_STORY_UTILS = {
    storyVotes,
    storyVoteCounts,
    effectiveExpiresAt,
    isPermanent,
    isActive,
    activeStories,
    timeLabel,
    visitorKey,
    memberVoteKey,
    hasVisitorVote,
    hasMemberVote,
    mergeStoryRecords,
    mergeVoteRecords,
    authorName,
    quotedText,
    coordinates,
    promptForKey
  };
}());
