(function () {
  const parseTimestamp = window.NLI_SHARED_UTILS?.parseContributionTimestamp || (value => new Date(value));
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
    if (story?.admin_temporary) return parseTimestamp(story.expires_at);
    if (story?.permanent || story?.admin_permanent) return null;
    const baseLifetimeMs = Number(options.baseLifetimeMs || 24 * 60 * 60 * 1000);
    const voteHourMs = Number(options.voteHourMs || 60 * 60 * 1000);
    const created = parseTimestamp(story?.created_at || "").getTime() || currentTime(options);
    const original = parseTimestamp(story?.expires_original_at || story?.expires_at || "").getTime() || (created + baseLifetimeMs);
    const counts = storyVoteCounts(story, votes);
    return new Date(original + (counts.up - counts.down) * voteHourMs);
  }

  function isPermanent(story, votes = [], options = {}) {
    if (story?.admin_temporary) return false;
    const permanentScore = Number(options.permanentScore || 10);
    return Boolean(story?.permanent || story?.admin_permanent || storyVoteCounts(story, votes).score >= permanentScore);
  }

  async function toggleAdminPermanence(story, votes, options = {}) {
    if (!options.isAdmin?.()) throw new Error("Administrator access is required.");
    if (!story?.id || ["rejected", "archived"].includes(story.status)) throw new Error("This story is not available.");
    const temporary = isPermanent(story, votes, options);
    const expiry = new Date(currentTime(options) + Number(options.baseLifetimeMs || 86400000)).toISOString();
    const payload = { permanent: !temporary, admin_permanent: !temporary, admin_temporary: temporary,
      expires_at: temporary ? expiry : null, expires_original_at: temporary ? expiry : story.expires_original_at || story.expires_at || null };
    const response = await options.patch("mobile_map_stories", story.id, payload, { requireAuth: true });
    if (!response?.data?.id || String(response.data.id) !== String(story.id)) throw new Error("The story change was not confirmed. Please try again.");
    return { ...story, ...payload, ...response.data };
  }

  function permanenceButton(story, votes, options = {}) {
    if (!options.isAdmin || ["rejected", "archived"].includes(story?.status)) return "";
    const permanent = isPermanent(story, votes, options);
    return `<button class="${options.className}" type="button" data-toggle-story-permanence="${options.escape(story.id)}" aria-pressed="${permanent}">${permanent ? "Make temporary" : "Make permanent"}</button>`;
  }

  function voteSummary(story, votes) {
    const count = storyVoteCounts(story, votes).up;
    return `${count} helpful vote${count === 1 ? "" : "s"}; ${story.admin_temporary ? "temporary by admin choice" : "10 keeps it permanently"}.`;
  }

  async function handlePermanenceToggle(stories, votes, button, options) {
    const story = stories.find(item => String(item.id) === String(button.dataset.toggleStoryPermanence));
    if (!options.isAdmin() || button.disabled || !story) return;
    button.disabled = true;
    const label = button.textContent;
    button.textContent = "Savingâ€¦";
    try {
      const saved = await toggleAdminPermanence(story, votes, options);
      Object.assign(story, saved);
      options.render(story);
      options.notify(saved.admin_temporary ? "Story is temporary again: 24 hours from now." : "Story is now permanent.");
    } catch (error) {
      options.notify(error.message || "Could not change story duration. Please try again.");
    } finally { button.disabled = false; button.textContent = label; }
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
      story?.admin_temporary,
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

  // Display-only groups: preserve submitted locations and split as screen space allows.
  function placeMarkers(stories, _sites, project, unproject, size) {
    const result = new Map();
    result.groups = new Map();
    if (!size || size.width <= 0 || size.height <= 0) return result;
    const groups = stories.map(story => ({ ids: [String(story.id)], point: project(story.coordinates) }))
      .filter(group => Number.isFinite(group.point?.x) && Number.isFinite(group.point?.y)
        && group.point.x >= 0 && group.point.y >= 0 && group.point.x <= size.width && group.point.y <= size.height)
      .sort((a, b) => a.ids[0].localeCompare(b.ids[0]));
    // Merge overlapping screen-space markers; reconsider merged centroids so
    // every story is represented and the resulting groups do not overlap.
    let merged = true;
    while (merged) {
      merged = false;
      for (let i = 0; i < groups.length && !merged; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          const a = groups[i], b = groups[j];
          if (Math.hypot(a.point.x - b.point.x, a.point.y - b.point.y) >= 52) continue;
          const total = a.ids.length + b.ids.length;
          a.point = { x: (a.point.x * a.ids.length + b.point.x * b.ids.length) / total,
            y: (a.point.y * a.ids.length + b.point.y * b.ids.length) / total };
          a.ids.push(...b.ids);
          a.ids.sort();
          groups.splice(j, 1);
          merged = true;
          break;
        }
      }
    }
    for (const group of groups) {
      const key = group.ids[0];
      result.set(key, unproject({ x: group.point.x + 24, y: group.point.y - 24 }));
      result.groups.set(key, group.ids);
    }
    return result;
  }

  function syncMarkers(registry, records, placements, create) {
    for (const [id, marker] of registry) {
      const ids = placements.groups.get(id);
      if (!ids || marker.getElement().dataset.storyMembers !== ids.join(",")) {
        marker.remove();
        registry.delete(id);
      }
    }
    for (const [id, coords] of placements) {
      if (registry.has(id)) {
        const marker = registry.get(id);
        marker.setLngLat(coords);
        marker.getElement().style.visibility = "";
      } else {
        const story = records.find(item => String(item.id) === id);
        if (story) registry.set(id, create({ ...story, clusterStoryIds: placements.groups.get(id) }, coords));
      }
    }
  }

  function showCluster(ids, records, container, openStory) {
    const stories = ids.map(id => records.find(item => String(item.id) === String(id))).filter(Boolean);
    if (!stories.length || !container) return;
    openStory(stories[0]);
    container.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = `${stories.length} stories here`;
    const instruction = document.createElement("p");
    instruction.textContent = "Select a story, or zoom in to separate nearby locations.";
    container.append(heading, instruction);
    for (const story of stories) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "action secondary";
      button.style.cssText = "display:block;width:100%;margin:8px 0;text-align:left";
      button.textContent = `${story.caption || "Visitor story"} — ${story.author_name || "Contributor"}`;
      button.addEventListener("click", () => openStory(story));
      container.append(button);
    }
  }

  function promptForKey(prompts = [], key = "") {
    const promptList = Array.isArray(prompts) ? prompts : [];
    return promptList.find(prompt => prompt?.key === key) || promptList[0] || null;
  }

  const markerOutline = "M10 4H26Q32 4 32 10V23Q32 29 26 29H22L18 34L14 29H10Q4 29 4 23V10Q4 4 10 4Z";
  function markerSvg(count = 1) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" aria-hidden="true" focusable="false"><path d="${markerOutline}" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 12H25M11 17H25M11 22H20" fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="round"/>${count > 1 ? `<circle cx="27" cy="9" r="9" fill="#bc302b" stroke="#fff" stroke-width="1.5"/><text x="27" y="12" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="${count > 99 ? 7 : 10}" font-weight="700">${Math.max(2, Math.floor(Number(count) || 2))}</text>` : ""}</svg>`;
  }

  window.NLI_MAP_STORY_UTILS = {
    placeMarkers,
    showCluster,
    syncMarkers,
    markerOutline,
    markerSvg,
    buildStoryVoteIndex,
    storyVoteIndex,
    invalidateStoryVoteIndex,
    storyVotes,
    storyVoteCounts,
    effectiveExpiresAt,
    isPermanent,
    toggleAdminPermanence,
    permanenceButton,
    voteSummary,
    handlePermanenceToggle,
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
