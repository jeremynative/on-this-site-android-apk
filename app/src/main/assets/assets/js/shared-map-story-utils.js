(function () {
  const relationId = window.NLI_SHARED_UTILS?.relationId || (value => {
    if (!value) return "";
    if (typeof value === "object") return value.id || value.value || "";
    return value;
  });

  const voteIndexCache = new WeakMap();

  function voteRecordId(vote) {
    const value = vote?.id;
    return value === undefined || value === null || value === "" ? "" : String(value);
  }

  function voteVisitorKey(vote) {
    return String(vote?.visitor_key || "");
  }

  function buildStoryVoteIndex(votes = []) {
    const source = Array.isArray(votes) ? votes : [];
    const records = [];
    const idPositions = new Map();
    const visitorPositions = new Map();
    source.filter(Boolean).forEach(vote => {
      const id = voteRecordId(vote);
      const visitor = voteVisitorKey(vote);
      const idPosition = id ? idPositions.get(id) : undefined;
      const position = Number.isInteger(idPosition) ? idPosition : visitorPositions.get(visitor);
      const previous = Number.isInteger(position) ? records[position] : null;
      const record = previous ? { ...previous, ...vote } : vote;
      const nextPosition = previous ? position : records.push(record) - 1;
      if (previous) {
        const previousId = voteRecordId(previous);
        const previousVisitor = voteVisitorKey(previous);
        if (previousId && idPositions.get(previousId) === position) idPositions.delete(previousId);
        if (previousVisitor && visitorPositions.get(previousVisitor) === position) visitorPositions.delete(previousVisitor);
        records[position] = record;
      }
      const nextId = voteRecordId(record);
      const nextVisitor = voteVisitorKey(record);
      if (nextId) idPositions.set(nextId, nextPosition);
      if (nextVisitor) visitorPositions.set(nextVisitor, nextPosition);
    });

    const byStory = new Map();
    const countsByStory = new Map();
    const membersByStory = new Map();
    const visitorsByStory = new Map();
    records.forEach(vote => {
      const storyId = String(relationId(vote?.story) || "");
      if (!storyId) return;
      if (!byStory.has(storyId)) byStory.set(storyId, []);
      byStory.get(storyId).push(vote);
      if (!countsByStory.has(storyId)) countsByStory.set(storyId, { up: 0, down: 0, score: 0 });
      const counts = countsByStory.get(storyId);
      const value = Number(vote?.vote);
      if (value > 0) counts.up += 1;
      else if (value < 0) counts.down += 1;
      counts.score = counts.up - counts.down;
      const memberId = String(relationId(vote?.member_profile) || "");
      if (memberId) {
        if (!membersByStory.has(storyId)) membersByStory.set(storyId, new Set());
        membersByStory.get(storyId).add(memberId);
      }
      const visitor = voteVisitorKey(vote);
      if (visitor) {
        if (!visitorsByStory.has(storyId)) visitorsByStory.set(storyId, new Set());
        visitorsByStory.get(storyId).add(visitor);
      }
    });
    return { source, records, byStory, countsByStory, membersByStory, visitorsByStory };
  }

  function storyVoteIndex(votes = []) {
    if (votes?.byStory instanceof Map) return votes;
    if (!Array.isArray(votes)) return buildStoryVoteIndex([]);
    let index = voteIndexCache.get(votes);
    if (!index) {
      index = buildStoryVoteIndex(votes);
      voteIndexCache.set(votes, index);
    }
    return index;
  }

  function invalidateStoryVoteIndex(votes = []) {
    if (Array.isArray(votes)) voteIndexCache.delete(votes);
  }

  function storyVotes(story, votes = []) {
    const id = String(story?.id || "");
    if (!id) return [];
    return storyVoteIndex(votes).byStory.get(id) || [];
  }

  function storyVoteCounts(story, votes = []) {
    const storyId = String(story?.id || "");
    const index = storyVoteIndex(votes);
    const indexed = storyId ? index.countsByStory.get(storyId) : null;
    if (indexed) return { up: indexed.up, down: indexed.down, score: indexed.score };
    const up = Number(story?.up_votes || 0);
    const down = Number(story?.down_votes || 0);
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
    const storyId = String(story?.id || "");
    return Boolean(storyId && key && storyVoteIndex(votes).visitorsByStory.get(storyId)?.has(String(key)));
  }

  function hasMemberVote(story, votes = [], profileId) {
    const memberId = String(relationId(profileId) || "");
    if (!memberId) return false;
    const storyId = String(story?.id || "");
    const voteKey = memberVoteKey(storyId, memberId);
    const index = storyVoteIndex(votes);
    return Boolean(
      storyId && (
        index.membersByStory.get(storyId)?.has(memberId) ||
        (voteKey && index.visitorsByStory.get(storyId)?.has(voteKey))
      )
    );
  }

  function mergeVoteRecords(target = [], records = []) {
    const idPositions = new Map();
    const visitorPositions = new Map();
    target.forEach((item, index) => {
      const id = Number(item?.id);
      const visitor = String(item?.visitor_key || "");
      if (Number.isFinite(id) && id > 0) idPositions.set(id, index);
      if (visitor) visitorPositions.set(visitor, index);
    });
    (records || []).filter(Boolean).forEach(record => {
      const id = Number(record.id);
      const visitorKey = String(record.visitor_key || "");
      const idIndex = Number.isFinite(id) && id > 0 ? idPositions.get(id) : undefined;
      const index = Number.isInteger(idIndex) ? idIndex : visitorPositions.get(visitorKey);
      if (Number.isInteger(index)) {
        const previous = target[index] || {};
        const previousId = Number(previous.id);
        const previousVisitor = String(previous.visitor_key || "");
        if (Number.isFinite(previousId) && idPositions.get(previousId) === index) idPositions.delete(previousId);
        if (previousVisitor && visitorPositions.get(previousVisitor) === index) visitorPositions.delete(previousVisitor);
        target[index] = { ...previous, ...record };
        const nextId = Number(target[index].id);
        const nextVisitor = String(target[index].visitor_key || "");
        if (Number.isFinite(nextId) && nextId > 0) idPositions.set(nextId, index);
        if (nextVisitor) visitorPositions.set(nextVisitor, index);
      } else {
        const nextIndex = target.push(record) - 1;
        if (Number.isFinite(id) && id > 0) idPositions.set(id, nextIndex);
        if (visitorKey) visitorPositions.set(visitorKey, nextIndex);
      }
    });
    invalidateStoryVoteIndex(target);
    return target;
  }

  function mergeStoryRecords(current = [], remote = [], options = {}) {
    const now = Number(options.now || Date.now());
    const localGraceMs = Math.max(0, Number(options.localGraceMs || 2 * 60 * 1000));
    const remoteById = new Map();
    const currentById = new Map();
    (remote || []).filter(Boolean).forEach(story => {
      const id = String(story.id || "");
      if (id) remoteById.set(id, story);
    });
    (current || []).filter(Boolean).forEach(story => {
      const id = String(story.id || "");
      if (id) currentById.set(id, story);
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
      const previous = currentById.get(id);
      const next = { ...(previous || {}), ...story };
      delete next._pendingServerSync;
      delete next._pendingServerSyncUntil;
      return next;
    });
  }

  function storyStateSignature(stories = [], votes = []) {
    const storyPart = (stories || []).map(story => [
      story?.id,
      story?.status,
      story?.expires_at,
      story?.permanent,
      story?.admin_permanent,
      story?.up_votes,
      story?.down_votes,
      story?.vote_score,
      story?.created_at
    ].map(value => String(value ?? "")).join(":")).sort().join("|");
    const votePart = storyVoteIndex(votes).records.map(vote => [
      vote?.id,
      relationId(vote?.story),
      vote?.vote,
      vote?.visitor_key,
      relationId(vote?.member_profile),
      vote?.created_at
    ].map(value => String(value ?? "")).join(":")).sort().join("|");
    return `${storyPart}::${votePart}`;
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
    buildStoryVoteIndex,
    storyVoteIndex,
    invalidateStoryVoteIndex,
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
    storyStateSignature,
    authorName,
    quotedText,
    coordinates,
    promptForKey
  };
}());
