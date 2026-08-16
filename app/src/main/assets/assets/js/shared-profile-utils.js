(function () {
  try {
    localStorage.removeItem(["nli", "contributor", "local", "accounts"].join("-"));
    localStorage.removeItem(["nli", "mobile", "local", "accounts"].join("-"));
  } catch {}

  const sharedUtils = window.NLI_SHARED_UTILS || {};
  const localDateKey = sharedUtils.localDateKey;
  const previousLocalDateKey = sharedUtils.previousLocalDateKey;
  const normalizeText = sharedUtils.normalizeText || (value =>
    String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()
  );

  function profileWebsiteUrl(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (!/^https?:\/\//i.test(text)) return `https://${text}`;
    return text;
  }

  function normalizeAccountEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function profileSlugFromEmail(email, fallbackPrefix = "contributor") {
    const base = normalizeAccountEmail(email)
      .split("@")[0]
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120);
    return base || `${fallbackPrefix}-${Date.now()}`;
  }

  function randomSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return [...bytes].map(value => value.toString(16).padStart(2, "0")).join("");
  }

  async function hashPassword(password, salt) {
    const encoded = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
  }

  function existingRegistrationMessage(registration) {
    if (!registration) return "";
    if (registration.account_banned === true || registration.status === "banned") {
      return registration.ban_reason || registration.review_note || "This email is attached to an account that cannot be used.";
    }
    if (registration.account_enabled === true || registration.status === "approved") {
      return "An account already exists for this email. Log in or use password reset.";
    }
    if (registration.status === "declined") {
      return registration.review_note || "This email already has a declined account request.";
    }
    return "An account request for this email is already waiting for review.";
  }

  function strongestRegistrationRecord(records = []) {
    const items = records.filter(Boolean);
    if (!items.length) return null;
    const rank = item => {
      let score = Number(item.id) || 0;
      if (item.account_banned === true || item.status === "banned") score += 1000000;
      if (item.account_enabled === true || item.status === "approved") score += 100000;
      if (item.status === "pending") score += 10000;
      const created = Date.parse(item.created_at || item.reviewed_at || "");
      if (Number.isFinite(created)) score += Math.floor(created / 100000000);
      return score;
    };
    return [...items].sort((a, b) => rank(b) - rank(a))[0];
  }

  function registrationIsApproved(registration) {
    if (!registration || registration.account_banned === true || registration.status === "banned") return false;
    return registration.status === "approved" || registration.account_enabled === true;
  }

  function hasContributorWriteSession(session = {}) {
    return Boolean(session?.token || session?.refreshToken || session?.refresh_token);
  }

  function contributorWriteSessionMessage(action = "save this") {
    const requestedAction = String(action || "save this").trim() || "save this";
    return `Your secure account session expired. Please log in again to ${requestedAction}.`;
  }

  function money(value) {
    return `$${Math.round(Number(value) || 0).toLocaleString()}`;
  }

  function supportMonths(profile) {
    if (!profile?.support_started_at) return 0;
    const started = new Date(profile.support_started_at);
    if (Number.isNaN(started.getTime())) return 0;
    const now = new Date();
    return Math.max(1, (now.getFullYear() - started.getFullYear()) * 12 + now.getMonth() - started.getMonth() + 1);
  }

  function supporterLine(profile) {
    if (!profile?.is_monthly_supporter) return "";
    const months = supportMonths(profile);
    return months ? `Monthly supporter for ${months} month${months === 1 ? "" : "s"}` : "Monthly supporter";
  }

  function profileJoinedDateValue(profile) {
    const value = profile?.joined_at || profile?.date_created || profile?.created_at || "";
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date : null;
  }

  function profileAccountAgeLabel(date) {
    if (!date) return "";
    const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
    if (days < 1) return "joined today";
    if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? "" : "s"}`;
  }

  function profileUserSinceLine(profile) {
    const date = profileJoinedDateValue(profile);
    if (!date) return "";
    const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const age = profileAccountAgeLabel(date);
    return `User since ${label}${age ? ` - ${age}` : ""}`;
  }

  function memberUsagePayload(profile, options = {}) {
    const now = Number(options.now || Date.now());
    const sessionStartedAt = Number(options.sessionStartedAt || now);
    const flushedSeconds = Number(options.flushedSeconds || 0);
    const sessionRecorded = options.sessionRecorded === true;
    const totalSessionSeconds = Math.max(0, Math.floor((now - sessionStartedAt) / 1000));
    const incrementalSeconds = Math.max(0, totalSessionSeconds - flushedSeconds);
    const currentTotal = Math.max(0, Number(profile?.usage_seconds_total || 0));
    const currentSessions = Math.max(0, Number(profile?.usage_session_count || 0));
    const payload = {
      last_active_at: new Date(now).toISOString()
    };
    if (options.login) payload.last_login_at = payload.last_active_at;
    if (options.trackUsage !== false && incrementalSeconds >= 5) {
      payload.usage_seconds_total = currentTotal + incrementalSeconds;
    }
    if (options.trackUsage !== false && (!sessionRecorded || options.login)) {
      payload.usage_session_count = currentSessions + 1;
    }
    return { payload, incrementalSeconds };
  }

  function isProfileBanned(profile) {
    return Boolean(profile?.account_banned === true || profile?.profile_status === "banned");
  }

  function profileIdentityEmail(profile = {}) {
    return String(profile.username || profile.email || "").trim().toLowerCase();
  }

  function profileIdentityNames(profile = {}, extras = []) {
    return new Set([
      profile.display_name,
      profile.displayName,
      profile.name,
      profile.username,
      profile.email,
      ...extras
    ].map(value => String(value || "").trim().toLowerCase()).filter(Boolean));
  }

  function defaultRelationId(value) {
    return value && typeof value === "object" && "id" in value ? value.id : value;
  }

  function profilesShareIdentity(a = {}, b = {}, options = {}) {
    if (!a || !b) return false;
    const relationId = options.relationId || defaultRelationId;
    const aId = Number(relationId(a.id || a.profileId));
    const bId = Number(relationId(b.id || b.profileId || options.fallbackProfileId));
    if (aId && bId && aId === bId) return true;
    const aEmail = profileIdentityEmail(a);
    const bEmail = profileIdentityEmail(b) || String(options.fallbackEmail || "").trim().toLowerCase();
    if (aEmail && bEmail && aEmail === bEmail) return true;
    const aNames = profileIdentityNames(a);
    const bNames = profileIdentityNames(b, options.extraNames || []);
    return [...aNames].some(name => bNames.has(name));
  }

  function profileIdentityIds(profile, candidates = [], options = {}) {
    const relationId = options.relationId || defaultRelationId;
    const ids = new Set();
    const directId = Number(relationId(profile?.id || profile?.profileId || options.fallbackProfileId));
    if (directId) ids.add(directId);
    if (directId) return ids;
    const identityEmail = String(profile?.username || profile?.email || options.fallbackEmail || "").trim().toLowerCase();
    const identitySlug = String(profile?.slug || "").trim().toLowerCase();
    if (identitySlug === "jeremy-dennis" || identityEmail === "jeremynative@gmail.com" || identityEmail === "jeremydennis") {
      ids.add(1);
    }
    (candidates || []).forEach(candidate => {
      const candidateEmail = profileIdentityEmail(candidate);
      const emailMatches = identityEmail && candidateEmail && identityEmail === candidateEmail;
      if (!isProfileBanned(candidate) && emailMatches) {
        const id = Number(relationId(candidate.id));
        if (id) ids.add(id);
      }
    });
    return ids;
  }

  function canonicalProfileIds(profile, candidates = [], options = {}) {
    return [...profileIdentityIds(profile, candidates, options)]
      .map(id => Number(id))
      .filter(Boolean)
      .sort((a, b) => a - b);
  }

  function profileIdentityOptions(session = {}, options = {}) {
    return {
      relationId: options.relationId || defaultRelationId,
      fallbackProfileId: session?.profileId,
      fallbackEmail: session?.email,
      extraNames: Array.isArray(options.extraNames)
        ? options.extraNames
        : [session?.display_name, session?.displayName, session?.email, session?.username]
    };
  }

  function rowsFallback(rows = [], options = {}) {
    const fallback = { data: Array.isArray(rows) ? rows : [] };
    if (options.markFallback) fallback.__fallback = true;
    return fallback;
  }

  function responseUsedFallback(response) {
    return Boolean(response?.__fallback);
  }

  function allResponsesFresh(responses = []) {
    return (responses || []).every(response => !responseUsedFallback(response));
  }

  function withFallbackTimeout(promise, fallback, timeoutMs = 12000) {
    const timer = typeof window !== "undefined" && window.setTimeout ? window.setTimeout.bind(window) : setTimeout;
    return Promise.race([
      promise,
      new Promise(resolve => timer(() => resolve(fallback), timeoutMs))
    ]);
  }

  function rowsIncludeProfile(rows = [], profile = {}, options = {}) {
    const relationId = options.relationId || defaultRelationId;
    const profileFields = options.profileFields || ["member_profile"];
    const profileIds = profileIdentityIds(profile, options.candidates || [], options);
    if (!profileIds.size) return false;
    return (rows || []).some(row =>
      profileFields.some(field => profileIds.has(Number(relationId(row?.[field]))))
    );
  }

  function activeProfileRowKey(row = {}, options = {}) {
    const relationId = options.relationId || defaultRelationId;
    const id = Number(relationId(row?.id));
    if (id) return `id:${id}`;
    const keyFields = options.keyFields || [
      "event_key",
      "vote_key",
      "site_slug",
      "visited_at",
      "content_key",
      "word_id",
      "answered_at",
      "login_date",
      "follower_profile",
      "following_profile",
      "source_collection",
      "source_id",
      "source_slug",
      "created_at"
    ];
    const parts = [];
    keyFields.forEach(field => {
      const value = relationId(row?.[field]);
      if (value !== undefined && value !== null && value !== "") parts.push(`${field}:${String(value)}`);
    });
    return parts.length ? parts.join("|") : "";
  }

  function preserveActiveProfileRows(nextRows = [], currentRows = [], profile = {}, options = {}) {
    const incoming = Array.isArray(nextRows) ? nextRows : [];
    const current = Array.isArray(currentRows) ? currentRows : [];
    if (!profile || !current.length) return incoming;
    const relationId = options.relationId || defaultRelationId;
    const profileFields = options.profileFields || ["member_profile"];
    const profileIds = profileIdentityIds(profile, options.candidates || [], options);
    if (!profileIds.size) return incoming;
    const incomingKeys = new Set(incoming.map(row => activeProfileRowKey(row, options)).filter(Boolean));
    const appendedKeys = new Set();
    const activeRows = current.filter(row =>
      profileFields.some(field => profileIds.has(Number(relationId(row?.[field]))))
    ).filter(row => {
      const key = activeProfileRowKey(row, options);
      if (!key) return true;
      if (incomingKeys.has(key) || appendedKeys.has(key)) return false;
      appendedKeys.add(key);
      return true;
    });
    return activeRows.length ? [...incoming, ...activeRows] : incoming;
  }

  function activeProfileFilterSuffix(profile = {}, profileFields = ["member_profile"], options = {}) {
    const profileIds = [...profileIdentityIds(profile, options.candidates || [], options)]
      .map(id => Number(id))
      .filter(Boolean)
      .sort((a, b) => a - b);
    if (!profileIds.length || profileFields.length !== 1) return "";
    return `&filter[${profileFields[0]}][_in]=${profileIds.join(",")}`;
  }

  function contributorProfileScore(profile) {
    if (!profile) return -Infinity;
    let score = Number(profile.id) || 0;
    if (profile.account_banned === true || profile.profile_status === "banned") score -= 10000;
    if (profile.account_enabled === true) score += 1000;
    if (profile.account_enabled !== false) score += 100;
    if (profile.profile_status === "published") score += 300;
    if (profile.profile_status === "hidden") score -= 300;
    if (profile.public_profile !== false) score += 50;
    if (String(profile.bio || "").trim()) score += 30;
    if (String(profile.headline || "").trim()) score += 10;
    return score;
  }

  function bestContributorProfile(matches = []) {
    return matches
      .filter(Boolean)
      .sort((a, b) => contributorProfileScore(b) - contributorProfileScore(a))[0] || null;
  }

  function publicContributorProfiles(profiles = []) {
    const publicProfiles = (profiles || []).filter(profile =>
      !isProfileBanned(profile) &&
      !isLikelyTestProfile(profile) &&
      profile.account_enabled !== false &&
      profile.public_profile !== false &&
      profile.profile_status !== "hidden"
    );
    return publicProfiles.reduce((list, profile) => {
      const existingIndex = list.findIndex(item => profilesShareIdentity(item, profile));
      if (existingIndex < 0) return [...list, profile];
      if (contributorProfileScore(profile) > contributorProfileScore(list[existingIndex])) {
        list[existingIndex] = profile;
      }
      return list;
    }, []);
  }

  function isLikelyTestProfile(profile = {}) {
    const text = [
      profile.username,
      profile.display_name,
      profile.slug,
      profile.headline,
      profile.bio
    ].filter(Boolean).join(" ").toLowerCase();
    const qaTool = "co" + "dex";
    return new RegExp(`\\b${qaTool}\\b|${qaTool}qa|${qaTool}-|${qaTool}_|point sync qa|nativelongisland\\.test|\\b(test|testing|sample|demo|john doe|jane doe|bob dylan|robert paulsen)\\b`).test(text);
  }

  function isAdminContributor(profile = {}, options = {}) {
    if (!profile || isProfileBanned(profile)) return false;
    const role = String(profile.role_label || profile.role || options.roleLabel || "").toLowerCase();
    const email = String(profile.username || profile.email || options.email || "").trim().toLowerCase();
    const slug = String(profile.slug || options.slug || "").trim().toLowerCase();
    return /\b(admin|administrator|founder)\b/.test(role) ||
      slug === "jeremy-dennis" ||
      email === "jeremynative@gmail.com" ||
      email === "onthissiteny@gmail.com";
  }

  function mergeSeededProfiles(profiles = [], seededProfiles = [], options = {}) {
    const keyFields = options.keyFields || ["id", "username", "slug"];
    const seen = new Set();
    const keyFor = (field, value) => `${field}:${String(value).trim().toLowerCase()}`;
    const addKeys = profile => {
      keyFields.forEach(field => {
        const value = profile?.[field];
        if (value !== undefined && value !== null && String(value).trim()) seen.add(keyFor(field, value));
      });
    };
    (profiles || []).forEach(addKeys);
    const seeded = (seededProfiles || []).filter(profile => {
      const duplicate = keyFields.some(field => {
        const value = profile?.[field];
        return value !== undefined && value !== null && String(value).trim() && seen.has(keyFor(field, value));
      });
      if (!duplicate) addKeys(profile);
      return !duplicate;
    });
    return [...(profiles || []), ...seeded];
  }

  function profileStorageKey(profile = {}, options = {}) {
    return String(
      profile?.id ||
      profile?.profileId ||
      options.fallbackProfileId ||
      profile?.username ||
      profile?.email ||
      options.fallbackEmail ||
      "anonymous"
    ).toLowerCase();
  }

  function contributorProfileIsPending(profile = {}) {
    return profile?.pending === true ||
      profile?.approved === false ||
      /awaiting review|pending/i.test(`${profile?.role || ""} ${profile?.roleLabel || ""}`);
  }

  function normalizeStoredContributorProfile(profile = {}, options = {}) {
    if (!profile) return null;
    const pending = contributorProfileIsPending(profile);
    const normalized = {
      ...profile,
      pending,
      approved: pending ? false : (profile.approved ?? true)
    };
    if (options.mobileFields) {
      normalized.email = String(profile.email || profile.username || "").toLowerCase();
      normalized.username = profile.username || profile.email || "";
      normalized.display_name = profile.display_name || profile.displayName || profile.email || "";
      normalized.displayName = profile.displayName || profile.display_name || profile.email || "";
      normalized.role = profile.role || profile.roleLabel || (pending ? "Account awaiting review" : "Contributor");
    }
    return normalized;
  }

  const POINT_RULES = Object.freeze({
    daily_open: 1,
    site_visit: 10,
    site_checkin: 15,
    vocab_guess: 1,
    approved_comment: 1,
    suggested_site: 5,
    friend_invite: 100,
    artwork_support: 100,
    monthly_supporter: 100,
    helpful_vote: 1
  });

  const CONTRIBUTOR_TIERS = Object.freeze([
    {
      key: "new",
      label: "New Contributor",
      minPoints: 0,
      commentsPerDay: 1,
      storiesPerDay: 1,
      plantsPerDay: 1,
      unlocks: "1 comment, 1 map story, and 1 plant ID each day"
    },
    {
      key: "trusted",
      label: "Trusted Contributor",
      minPoints: 100,
      commentsPerDay: 10,
      storiesPerDay: 10,
      plantsPerDay: 5,
      unlocks: "10 comments/stories and 5 plant IDs each day"
    },
    {
      key: "steward",
      label: "Community Steward",
      minPoints: 500,
      commentsPerDay: Infinity,
      storiesPerDay: Infinity,
      plantsPerDay: 10,
      unlocks: "unlimited comments/stories and 10 plant IDs each day"
    }
  ]);

  function contributorTierForPoints(points = 0) {
    const total = Math.max(0, Number(points) || 0);
    return [...CONTRIBUTOR_TIERS]
      .sort((a, b) => Number(b.minPoints || 0) - Number(a.minPoints || 0))
      .find(tier => total >= Number(tier.minPoints || 0)) || CONTRIBUTOR_TIERS[0];
  }

  function nextContributorTier(points = 0) {
    const total = Math.max(0, Number(points) || 0);
    return [...CONTRIBUTOR_TIERS]
      .sort((a, b) => Number(a.minPoints || 0) - Number(b.minPoints || 0))
      .find(tier => total < Number(tier.minPoints || 0)) || null;
  }

  function contributorProgressToNextTier(points = 0) {
    const total = Math.max(0, Number(points) || 0);
    const current = contributorTierForPoints(total);
    const next = nextContributorTier(total);
    const currentMin = Number(current.minPoints || 0);
    const nextMin = Number(next?.minPoints || 0);
    const span = Math.max(1, nextMin - currentMin);
    const percent = next ? Math.max(0, Math.min(100, ((total - currentMin) / span) * 100)) : 100;
    return {
      current,
      next,
      points: total,
      percent,
      remaining: next ? Math.max(0, nextMin - total) : 0,
      goal: next ? nextMin : currentMin,
      label: next ? `${Math.floor(percent)}% to ${next.label}` : "Top contributor tier"
    };
  }

  function contributorLimitLabel(value) {
    return Number.isFinite(Number(value)) ? String(Number(value)) : "unlimited";
  }

  function contributorDailyLimit(points = 0, kind = "comments") {
    const tier = contributorTierForPoints(points);
    if (kind === "plants" || kind === "plant") return tier.plantsPerDay;
    if (kind === "stories" || kind === "story") return tier.storiesPerDay;
    return tier.commentsPerDay;
  }

  function contributorActionDateKey(record = {}, fields = ["created_at"]) {
    const fieldList = Array.isArray(fields) ? fields : [fields];
    const value = fieldList.map(field => record?.[field]).find(Boolean);
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return localDateKey(date);
  }

  function contributorDailyActionCount(records = [], profile = {}, options = {}) {
    const relationId = options.relationId || defaultRelationId;
    const profileIds = options.identityIds instanceof Set
      ? options.identityIds
      : profileIdentityIds(profile, options.profiles || [], { relationId, ...options });
    if (!profileIds?.size) return 0;
    const today = options.today || localDateKey();
    const profileField = options.profileField || "member_profile";
    const dateFields = options.dateFields || ["created_at"];
    const statusFilter = typeof options.statusFilter === "function" ? options.statusFilter : null;
    return (records || []).filter(record => {
      if (statusFilter && !statusFilter(record)) return false;
      if (!profileIds.has(Number(relationId(record?.[profileField])))) return false;
      return contributorActionDateKey(record, dateFields) === today;
    }).length;
  }

  function contributorDailyLimitState(options = {}) {
    const points = Number(options.points || 0);
    const kind = options.kind || "comments";
    const limit = contributorDailyLimit(points, kind);
    const used = contributorDailyActionCount(options.records || [], options.profile || {}, options);
    return {
      kind,
      tier: contributorTierForPoints(points),
      limit,
      used,
      remaining: Number.isFinite(limit) ? Math.max(0, Number(limit) - used) : Infinity,
      reached: Number.isFinite(limit) && used >= Number(limit)
    };
  }

  function contributorTierSummary(points = 0) {
    const tier = contributorTierForPoints(points);
    return `${tier.label}: ${contributorLimitLabel(tier.commentsPerDay)} comments, ${contributorLimitLabel(tier.storiesPerDay)} map stories, ${contributorLimitLabel(tier.plantsPerDay)} plant IDs per day.`;
  }

  function isPublishedPublicSite(site = {}) {
    const status = String(site.publication_status || site.status || "published").trim().toLowerCase();
    if (!site?.slug || !site?.title) return false;
    return !["draft", "hidden", "private", "trash", "archived", "internal"].includes(status);
  }

  function isBroadTerritorySite(site = {}) {
    if (window.NLI_SITE_UTILS?.isBroadTerritory) {
      return window.NLI_SITE_UTILS.isBroadTerritory(site, { matchAnyAncestral: true });
    }
    const text = normalizeText(`${site?.title || ""} ${site?.site_type || ""}`);
    return /territory|ancestral land|traditional land/.test(text);
  }

  function publicVisitAccessStatus(site = {}) {
    const explicit = normalizeText(`${site?.visit_status || ""} ${site?.access_status || ""} ${site?.public_access || ""}`);
    if (/do not|closed|restricted|private/.test(explicit)) return "private";
    if (/learn|sensitive|approx/.test(explicit)) return "learn";
    if (/visit|public|open/.test(explicit)) return "visitable";
    // A community resource can sit on a reservation without being a private
    // or sensitive map entry. Respect explicit access restrictions above,
    // but do not infer one solely from that contextual language.
    if (normalizeText(site?.site_type || "") === "community resource") return "visitable";
    const text = normalizeText(`${site?.title || ""} ${site?.site_type || ""} ${site?.summary || ""}`);
    if (isBroadTerritorySite(site)) return "learn";
    if (/reservation|burial|sacred|private|cemetery/.test(text)) return "learn";
    return "visitable";
  }

  function isEligiblePublicVisitSite(site = {}) {
    return isPublishedPublicSite(site) && publicVisitAccessStatus(site) === "visitable";
  }

  function publicSiteTotal(sites = []) {
    return (sites || []).filter(isEligiblePublicVisitSite).length;
  }

  function visitProgressLabel(visitedCount = 0, totalCount = 0) {
    const visited = Number(visitedCount) || 0;
    const total = Number(totalCount) || 0;
    return total > 0 ? `${visited} / ${total} places visited` : `${visited} places visited`;
  }

  const SITE_CHECKIN_RADIUS_MILES = 0.05;
  const siteVisitIndexCache = new WeakMap();
  const pointEventIndexCache = new WeakMap();

  function profileSiteKey(profileId, siteSlug) {
    const id = Number(profileId);
    const slug = String(siteSlug || "").trim().toLowerCase();
    return id && slug ? `${id}|${slug}` : "";
  }

  function siteVisitIndex(visits = [], options = {}) {
    const relationId = options.relationId || defaultRelationId;
    if (!Array.isArray(visits)) return { byProfileSite: new Map(), byId: new Map() };
    const cached = siteVisitIndexCache.get(visits);
    if (cached && cached.relationId === relationId && cached.length === visits.length) return cached;
    const byProfileSite = new Map();
    const byId = new Map();
    visits.forEach(visit => {
      if (!visit) return;
      const key = profileSiteKey(relationId(visit.member_profile), visit.site_slug);
      if (key) {
        const records = byProfileSite.get(key) || [];
        records.push(visit);
        byProfileSite.set(key, records);
      }
      const id = String(relationId(visit.id) || "");
      if (id) byId.set(id, visit);
    });
    byProfileSite.forEach(records => records.sort((a, b) => String(b.visited_at || "").localeCompare(String(a.visited_at || ""))));
    const index = { relationId, length: visits.length, byProfileSite, byId };
    siteVisitIndexCache.set(visits, index);
    return index;
  }

  function pointEventIndex(events = [], options = {}) {
    const relationId = options.relationId || defaultRelationId;
    if (!Array.isArray(events)) {
      return { byKey: new Map(), byProfileKey: new Map(), checkinSlugsByProfile: new Map(), checkinSourceIdsByProfile: new Map() };
    }
    const cached = pointEventIndexCache.get(events);
    if (cached && cached.relationId === relationId && cached.length === events.length) return cached;
    const byKey = new Map();
    const byProfileKey = new Map();
    const checkinSlugsByProfile = new Map();
    const checkinSourceIdsByProfile = new Map();
    events.forEach(event => {
      if (!event) return;
      const eventKey = String(event.event_key || "");
      const profileId = Number(relationId(event.member_profile));
      if (eventKey && !byKey.has(eventKey)) byKey.set(eventKey, event);
      const profileKey = eventKey && profileId ? `${profileId}|${eventKey}` : "";
      if (profileKey && !byProfileKey.has(profileKey)) byProfileKey.set(profileKey, event);
      if (profileId && String(event.event_type || "") === "site_checkin") {
        const slug = String(event.source_slug || "").trim().toLowerCase();
        const sourceId = String(relationId(event.source_id) || "");
        if (slug) {
          const slugs = checkinSlugsByProfile.get(profileId) || new Set();
          slugs.add(slug);
          checkinSlugsByProfile.set(profileId, slugs);
        }
        if (sourceId) {
          const sourceIds = checkinSourceIdsByProfile.get(profileId) || new Set();
          sourceIds.add(sourceId);
          checkinSourceIdsByProfile.set(profileId, sourceIds);
        }
      }
    });
    const index = { relationId, length: events.length, byKey, byProfileKey, checkinSlugsByProfile, checkinSourceIdsByProfile };
    pointEventIndexCache.set(events, index);
    return index;
  }

  function hasSavedCheckinDistance(value) {
    if (value === null || value === undefined || value === "") return false;
    return Number.isFinite(Number(value));
  }

  function visitProfileId(profile = {}, options = {}) {
    const relationId = options.relationId || defaultRelationId;
    return Number(relationId(profile?.id || profile?.profileId || options.fallbackProfileId));
  }

  function siteVisitRecord(visits = [], profile = {}, site = {}, options = {}) {
    const profileId = visitProfileId(profile, options);
    if (!profileId || !site?.slug) return null;
    const key = profileSiteKey(profileId, site.slug);
    return siteVisitIndex(visits, options).byProfileSite.get(key)?.[0] || null;
  }

  function siteHasCheckin(visits = [], profile = {}, site = {}, options = {}) {
    const profileId = visitProfileId(profile, options);
    if (!profileId || !site?.slug) return false;
    const key = profileSiteKey(profileId, site.slug);
    return (siteVisitIndex(visits, options).byProfileSite.get(key) || []).some(visit => hasSavedCheckinDistance(visit.distance_miles));
  }

  function siteHasRecordedCheckin(visits = [], pointEvents = [], profile = {}, site = {}, options = {}) {
    const relationId = options.relationId || defaultRelationId;
    const profileId = visitProfileId(profile, options);
    if (!profileId || !site?.slug) return false;
    const key = profileSiteKey(profileId, site.slug);
    const matchingVisits = siteVisitIndex(visits, options).byProfileSite.get(key) || [];
    if (matchingVisits.some(visit => hasSavedCheckinDistance(visit.distance_miles))) return true;
    const siteType = normalizeText(site.site_type || "");
    if (siteType === "community resource" && matchingVisits.length) return true;
    const eventIndex = pointEventIndex(pointEvents, options);
    if (eventIndex.checkinSlugsByProfile.get(profileId)?.has(String(site.slug).trim().toLowerCase())) return true;
    const sourceIds = eventIndex.checkinSourceIdsByProfile.get(profileId);
    return Boolean(sourceIds && matchingVisits.some(visit => sourceIds.has(String(relationId(visit.id) || ""))));
  }

  function checkinDistanceStatus(value, options = {}) {
    const distanceMiles = Number(value);
    const radiusMiles = Number(options.radiusMiles ?? SITE_CHECKIN_RADIUS_MILES);
    const wantsCheckin = Number.isFinite(distanceMiles);
    return {
      wantsCheckin,
      allowed: !wantsCheckin || distanceMiles <= radiusMiles,
      distanceMiles: wantsCheckin ? distanceMiles : null,
      radiusMiles
    };
  }

  function checkinDistanceMessage(value, options = {}) {
    const status = checkinDistanceStatus(value, options);
    if (!status.wantsCheckin || status.allowed) return "";
    return `Move closer to this site's map icon to check in. You are about ${status.distanceMiles.toFixed(2)} mi away; check-in unlocks within ${status.radiusMiles.toFixed(2)} mi.`;
  }

  function siteVisitPayload(profile = {}, site = {}, options = {}) {
    const profileId = visitProfileId(profile, options);
    if (!profileId || !site?.slug) return null;
    const payload = {
      member_profile: profileId,
      site: Number(site.id) || null,
      site_slug: site.slug,
      site_title: site.title || site.slug,
      visited_at: options.visitedAt || new Date().toISOString(),
      public_activity: true
    };
    if (Number.isFinite(Number(options.distanceMiles))) payload.distance_miles = Number(options.distanceMiles).toFixed(3);
    return payload;
  }

  async function syncSiteVisit(options = {}) {
    const profile = options.profile || {};
    const site = options.site || {};
    const visits = Array.isArray(options.visits) ? options.visits : [];
    const pointEvents = Array.isArray(options.pointEvents) ? options.pointEvents : [];
    const relationId = options.relationId || defaultRelationId;
    const sharedOptions = { relationId, fallbackProfileId: options.fallbackProfileId };
    if (!visitProfileId(profile, sharedOptions) || !site.slug) return null;
    const distance = checkinDistanceStatus(options.distanceMiles, { radiusMiles: options.radiusMiles });
    if (!distance.allowed) throw new Error(checkinDistanceMessage(distance.distanceMiles, { radiusMiles: distance.radiusMiles }));
    const hasRecordedCheckin = () => siteHasRecordedCheckin(visits, pointEvents, profile, site, sharedOptions);
    let existing = siteVisitRecord(visits, profile, site, sharedOptions);
    if (!existing || (distance.wantsCheckin && !hasRecordedCheckin())) {
      if (typeof options.refreshRemoteVisits === "function") await options.refreshRemoteVisits(profile, site).catch(() => []);
      existing = siteVisitRecord(visits, profile, site, sharedOptions);
    }
    if (existing && (!distance.wantsCheckin || hasRecordedCheckin())) return { earned: false, checkin: distance.wantsCheckin, record: existing };
    if (typeof options.commitEngagementAction !== "function") throw new Error("Site visit synchronization is not configured.");
    const payloadOptions = { ...sharedOptions, visitedAt: options.visitedAt };
    if (distance.wantsCheckin) payloadOptions.distanceMiles = distance.distanceMiles;
    const payload = siteVisitPayload(profile, site, payloadOptions);
    if (!payload) return null;
    if (existing?.id && distance.wantsCheckin) {
      const committed = await options.commitEngagementAction("site_checkin", {
        distance_miles: payload.distance_miles,
        public_activity: true
      }, existing.id);
      const record = committed?.source || existing;
      if (record === existing) Object.assign(existing, payload);
      if (!committed?.data) throw new Error("The check-in point could not be confirmed.");
      return { earned: true, checkin: true, record };
    }
    const committed = await options.commitEngagementAction("site_visit", payload);
    const record = committed?.source || null;
    if (!record) throw new Error("The visit could not be confirmed.");
    if (!committed?.data) throw new Error("The visit point could not be confirmed.");
    if (distance.wantsCheckin) {
      const checkin = await options.commitEngagementAction("site_checkin", {
        distance_miles: payload.distance_miles,
        public_activity: true
      }, record.id);
      if (!checkin?.data) throw new Error("The check-in point could not be confirmed.");
    }
    return { earned: true, checkin: distance.wantsCheckin, record };
  }

  function loginRewardStatsFromDates(dates = []) {
    const sorted = [...new Set(dates.filter(Boolean))].sort();
    if (!sorted.length) return { totalDays: 0, currentStreak: 0, bestStreak: 0, lastLoginDate: "" };
    let bestStreak = 0;
    let run = 0;
    let previous = "";
    sorted.forEach(date => {
      const expected = previous ? previousLocalDateKey(new Date(`${date}T12:00:00`)) : "";
      run = previous && expected === previous ? run + 1 : 1;
      bestStreak = Math.max(bestStreak, run);
      previous = date;
    });
    const today = localDateKey();
    const yesterday = previousLocalDateKey();
    let currentStreak = 0;
    let cursor = sorted[sorted.length - 1];
    if (cursor === today || cursor === yesterday) {
      const dateSet = new Set(sorted);
      while (dateSet.has(cursor)) {
        currentStreak += 1;
        cursor = previousLocalDateKey(new Date(`${cursor}T12:00:00`));
      }
    }
    return {
      totalDays: sorted.length,
      currentStreak,
      bestStreak,
      lastLoginDate: sorted[sorted.length - 1]
    };
  }

  function profileLoginRewardRecords(records = [], profileIds = new Set(), options = {}) {
    const relationId = options.relationId || defaultRelationId;
    if (!profileIds?.size) return [];
    return (records || [])
      .filter(item => profileIds.has(Number(relationId(item.member_profile))) && item.login_date)
      .map(item => ({ ...item, login_date: String(item.login_date).slice(0, 10) }));
  }

  function loginRewardRecordKey(record = {}) {
    return String(record.id || `${record.member_profile || ""}:${record.login_date || ""}`);
  }

  function mergeLoginRewardRecords(existing = [], incoming = []) {
    const byId = new Map((existing || []).map(item => [loginRewardRecordKey(item), item]));
    (incoming || []).forEach(item => byId.set(loginRewardRecordKey(item), item));
    return [...byId.values()];
  }

  function latestLoginRewardAwardedAt(records = []) {
    let latest = 0;
    (records || []).forEach(record => {
      const raw = record?.created_at || record?.date_created || record?.awarded_at || "";
      const value = raw ? Date.parse(raw) : NaN;
      if (Number.isFinite(value)) latest = Math.max(latest, value);
    });
    return latest ? new Date(latest).toISOString() : "";
  }

  function loginRewardRecentlyAwarded(records = [], options = {}) {
    const latest = latestLoginRewardAwardedAt(records);
    if (!latest) return false;
    const nowMs = Number.isFinite(Number(options.nowMs))
      ? Number(options.nowMs)
      : Date.parse(options.now || new Date().toISOString());
    const latestMs = Date.parse(latest);
    const minMs = Math.max(1, Number(options.minHours || 24)) * 60 * 60 * 1000;
    if (!Number.isFinite(nowMs) || !Number.isFinite(latestMs)) return false;
    const elapsedMs = nowMs - latestMs;
    return elapsedMs >= 0 && elapsedMs < minMs;
  }

  function nextDailyLoginReward(profileId, currentStats = {}, existingDates = [], options = {}) {
    const today = options.today || localDateKey();
    const yesterday = options.yesterday || previousLocalDateKey();
    if (!profileId) return null;
    if (currentStats.lastLoginDate === today) return { earned: false, ...currentStats };
    const currentStreak = currentStats.lastLoginDate === yesterday
      ? Number(currentStats.currentStreak || 0) + 1
      : 1;
    const awardedAt = options.awardedAt || new Date().toISOString();
    const payload = {
      member_profile: profileId,
      login_date: today,
      streak_day: currentStreak,
      created_at: awardedAt
    };
    const dates = [...new Set([...(existingDates || []), today].filter(Boolean))];
    return {
      earned: true,
      payload,
      dates,
      totalDays: Number(currentStats.totalDays || 0) + 1,
      currentStreak,
      bestStreak: Math.max(Number(currentStats.bestStreak || 0), currentStreak),
      lastLoginDate: today,
      lastAwardedAt: awardedAt
    };
  }

  function learnedLanguageWordsFromAttempts(attempts = [], profileIds = new Set(), options = {}) {
    const relationId = options.relationId || defaultRelationId;
    const wordById = options.wordById || new Map();
    if (!profileIds?.size) return [];
    const words = new Map();
    (attempts || [])
      .filter(item => profileIds.has(Number(relationId(item.member_profile))) && item.correct !== false)
      .forEach(item => {
        const id = item.word_id || String(item.english || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (!id || words.has(id)) return;
        const recordedWord = wordById.get(String(id)) || {};
        words.set(id, {
          id,
          english: item.english || recordedWord.english || "",
          algonquian: item.algonquian || recordedWord.algonquian || "",
          source: item.source || recordedWord.source || "",
          learned_at: item.answered_at,
          content_key: item.content_key
        });
      });
    return [...words.values()];
  }

  function languageCorrectAttemptCountFromAttempts(attempts = [], profileIds = new Set(), options = {}) {
    const relationId = options.relationId || defaultRelationId;
    if (!profileIds?.size) return 0;
    const correctKeys = new Set();
    (attempts || [])
      .filter(item => profileIds.has(Number(relationId(item.member_profile))) && item.correct !== false)
      .forEach(item => {
        const date = String(item.answered_at || "").slice(0, 10);
        correctKeys.add(`${date}|${item.content_key || ""}|${item.word_id || ""}`);
      });
    return correctKeys.size;
  }

  function languageQuizCompletionCountFromAttempts(attempts = [], profileIds = new Set(), options = {}) {
    const relationId = options.relationId || defaultRelationId;
    if (!profileIds?.size) return 0;
    const completionKeys = new Set();
    (attempts || [])
      .filter(item => profileIds.has(Number(relationId(item.member_profile))))
      .forEach(item => {
        const recordId = relationId(item.id);
        const date = String(item.answered_at || "").slice(0, 10);
        completionKeys.add(recordId
          ? `id:${recordId}`
          : `${date}|${item.content_key || ""}|${item.word_id || ""}`);
      });
    return completionKeys.size;
  }

  function languageRemoteAttemptExists(attempts = [], profileId, contentKey, wordId, options = {}) {
    const relationId = options.relationId || defaultRelationId;
    const dateKeys = new Set([String(options.dateKey || localDateKey()).slice(0, 10)]);
    if (!options.dateKey) dateKeys.add(new Date().toISOString().slice(0, 10));
    return (attempts || []).some(item =>
      Number(relationId(item.member_profile)) === Number(profileId) &&
      String(item.content_key || "") === String(contentKey || "") &&
      String(item.word_id || "") === String(wordId || "") &&
      dateKeys.has(String(item.answered_at || "").slice(0, 10))
    );
  }

  function languageQuizContentKey(type, item = {}) {
    return `${type}:${item?.slug || item?.id || item?.title || "content"}`;
  }

  function languageWordPattern(word = {}) {
    const source = String(word.english || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    return new RegExp(`(^|[^A-Za-z])(${source})(?=$|[^A-Za-z']|\\B')`, "i");
  }

  function languageWordForText(words = [], text = "", options = {}) {
    const source = String(text || "");
    const candidates = options.sortLongest
      ? [...(words || [])].sort((a, b) => String(b.english || "").length - String(a.english || "").length)
      : [...(words || [])];
    const lower = source.toLowerCase();
    return candidates.find(word => {
      if (options.requireIncludes && !lower.includes(String(word?.english || "").toLowerCase())) return false;
      return languageWordPattern(word).test(source);
    });
  }

  function languageAttemptPayload(profileId, contentKey, word = {}, options = {}) {
    const id = Number(profileId);
    if (!id || !word?.id) return null;
    return {
      member_profile: id,
      word_id: word.id,
      english: word.english,
      algonquian: word.algonquian,
      source: word.source,
      content_key: contentKey,
      content_title: options.contentTitle || "",
      correct: options.correct !== false,
      answered_at: options.answeredAt || new Date().toISOString()
    };
  }

  function mergeLanguageAttemptRecords(target = [], records = [], options = {}) {
    const relationId = options.relationId || defaultRelationId;
    (records || []).forEach(record => {
      if (!record) return;
      const id = Number(record.id);
      const index = id
        ? target.findIndex(item => Number(item.id) === id)
        : target.findIndex(item =>
            Number(relationId(item.member_profile)) === Number(relationId(record.member_profile)) &&
            String(item.content_key || "") === String(record.content_key || "") &&
            String(item.word_id || "") === String(record.word_id || "") &&
            String(item.answered_at || "").slice(0, 10) === String(record.answered_at || "").slice(0, 10)
          );
      if (index >= 0) target[index] = { ...target[index], ...record };
      else target.push(record);
    });
    return target;
  }

  async function syncLanguageAttempt(options = {}) {
    const relationId = options.relationId || defaultRelationId;
    const profile = options.profile;
    const profileId = Number(options.profileId);
    const contentKey = options.contentKey;
    const word = options.word || {};
    if (!profile?.id || !profileId || Number(relationId(profile.id)) !== profileId) return;

    const payload = languageAttemptPayload(profileId, contentKey, word, { correct: options.correct });
    if (!payload) return;

    const dateKey = String(payload.answered_at || "").slice(0, 10);
    const existing = typeof options.refreshRemoteAttempt === "function"
      ? await options.refreshRemoteAttempt(profileId, contentKey, word.id, dateKey).catch(() => null)
      : null;
    const existsRemotely = existing || (
      typeof options.remoteAttemptExists === "function" &&
      options.remoteAttemptExists(profileId, contentKey, word.id)
    );
    if (existsRemotely) {
      const record = existing || (options.attempts || []).find(item =>
        Number(relationId(item.member_profile)) === profileId &&
        String(item.content_key || "") === String(contentKey || "") &&
        String(item.word_id || "") === String(word.id || "") &&
        String(item.answered_at || "").slice(0, 10) === dateKey
      );
      const pointEvent = typeof options.recordPointForAttempt === "function"
        ? await options.recordPointForAttempt(profileId, contentKey, word, record)
        : null;
      return record ? { ...record, _existingAttempt: true, _languagePointEvent: pointEvent || null } : null;
    }

    if (typeof options.commitEngagementAction !== "function") {
      throw new Error("Language progress synchronization is not configured.");
    }
    const committed = await options.commitEngagementAction("vocab_guess", payload);
    const record = committed?.source || null;
    if (!record) throw new Error("Language progress could not be confirmed.");
    const pointEvent = committed?.data || null;
    if (typeof options.refreshRemotePointEvents === "function") {
      await options.refreshRemotePointEvents(profileId).catch(() => []);
    }
    // A replica/cache can briefly return the pre-write ledger. Keep the
    // server-confirmed event authoritative so the visible total never rolls back.
    if (pointEvent && typeof options.mergePointEventRecords === "function") {
      options.mergePointEventRecords([pointEvent]);
    }
    return { ...record, _createdAttempt: true, _languagePointEvent: pointEvent || null };
  }

  function uniqueVisitRecords(visits = []) {
    const uniqueVisits = new Map();
    (visits || []).forEach(visit => {
      const key = String(visit.site_slug || visit.site || visit.site_title || visit.id || "").toLowerCase();
      if (!key) return;
      const existing = uniqueVisits.get(key);
      if (!existing || String(visit.visited_at || "") > String(existing.visited_at || "")) uniqueVisits.set(key, visit);
    });
    return [...uniqueVisits.values()];
  }

  function mergeVisitRecords(target = [], records = [], options = {}) {
    const relationId = options.relationId || defaultRelationId;
    (records || []).forEach(record => {
      if (!record) return;
      const id = Number(record.id);
      const index = id
        ? target.findIndex(item => Number(item.id) === id)
        : target.findIndex(item =>
            Number(relationId(item.member_profile)) === Number(relationId(record.member_profile)) &&
            String(item.site_slug || "") === String(record.site_slug || "") &&
            String(item.visited_at || "") === String(record.visited_at || "")
          );
      if (index >= 0) target[index] = { ...target[index], ...record };
      else target.push(record);
    });
    siteVisitIndexCache.delete(target);
    return target;
  }

  function profilePointEventsFromActivity(activity = {}, options = {}) {
    const hasExplicitPointEvents = Object.prototype.hasOwnProperty.call(activity, "pointEvents") && Array.isArray(activity.pointEvents);
    const explicitPointEvents = hasExplicitPointEvents
      ? activity.pointEvents.map(event => ({
        key: event.event_key || event.key || `${event.event_type || event.type || "point"}:${defaultRelationId(event.id) || event.source_id || event.created_at || ""}`,
        type: event.event_type || event.type || "point",
        points: Number(event.points || 0),
        date: event.created_at || event.date || "",
        source: event.source_collection || event.source || "",
        source_id: event.source_id || defaultRelationId(event.id),
        title: event.source_title || event.title || ""
      })).filter(event => event.key && event.points)
      : [];
    const explicitTypes = new Set(explicitPointEvents.map(event => event.type));
    const pointRules = { ...POINT_RULES, ...(options.pointRules || {}) };
    const events = [];
    const seenKeys = new Set();
    const push = event => {
      const points = Number(event?.points || 0);
      if (!event?.key || !points || seenKeys.has(event.key)) return;
      seenKeys.add(event.key);
      events.push({ ...event, points });
    };
    explicitPointEvents.forEach(push);

    if (!hasExplicitPointEvents) {
      (activity.comments || []).forEach(comment => {
        const id = defaultRelationId(comment.id) || `${comment.source_slug || comment.site_slug || "comment"}:${comment.created_at || ""}`;
        push({
          key: `approved_comment:${id}`,
          type: "approved_comment",
          points: pointRules.approved_comment,
          date: comment.created_at || "",
          source: "mobile_comments",
          source_id: defaultRelationId(comment.id),
          title: comment.site_title || comment.source_title || "Approved comment"
        });
      });

      uniqueVisitRecords(activity.visits).forEach(visit => {
        const key = String(visit.site_slug || visit.site || visit.site_title || visit.id || "").toLowerCase();
        push({
          key: `site_visit:${key}`,
          type: "site_visit",
          points: pointRules.site_visit,
          date: visit.visited_at || "",
          source: "mobile_site_visits",
          source_id: defaultRelationId(visit.id),
          title: visit.site_title || visit.site_slug || "Visited site"
        });
        if (hasSavedCheckinDistance(visit.distance_miles)) {
          push({
            key: `site_checkin:${key}`,
            type: "site_checkin",
            points: pointRules.site_checkin,
            date: visit.visited_at || "",
            source: "mobile_site_visits",
            source_id: defaultRelationId(visit.id),
            title: visit.site_title || visit.site_slug || "Site check-in"
          });
        }
      });

      (activity.suggestions || []).forEach(suggestion => {
        const id = defaultRelationId(suggestion.id) || `${suggestion.title || "suggestion"}:${suggestion.submitted_at || suggestion.date_created || ""}`;
        push({
          key: `suggested_site:${id}`,
          type: "suggested_site",
          points: pointRules.suggested_site,
          date: suggestion.submitted_at || suggestion.date_created || "",
          source: "site_suggestions",
          source_id: defaultRelationId(suggestion.id),
          title: suggestion.title || "Suggested site"
        });
      });

      (activity.purchases || []).forEach(purchase => {
        const id = defaultRelationId(purchase.id) || `${purchase.artwork_title || "support"}:${purchase.created_at || purchase.purchase_date || ""}`;
        push({
          key: `artwork_support:${id}`,
          type: "artwork_support",
          points: pointRules.artwork_support,
          date: purchase.created_at || purchase.purchase_date || "",
          source: "print_purchases",
          source_id: defaultRelationId(purchase.id),
          title: purchase.artwork_title || "Artwork support"
        });
      });

      const commentIds = new Set((activity.comments || []).map(comment => String(defaultRelationId(comment.id))).filter(Boolean));
      (activity.commentVotes || [])
        .filter(vote => commentIds.has(String(defaultRelationId(vote.comment))) && String(vote.vote || "") === "up")
        .forEach(vote => {
          const id = defaultRelationId(vote.id) || vote.vote_key || `${defaultRelationId(vote.comment)}:${defaultRelationId(vote.member_profile)}`;
          push({
            key: `helpful_vote:${id}`,
            type: "helpful_vote",
            points: pointRules.helpful_vote,
            date: vote.created_at || "",
            source: "mobile_comment_votes",
            source_id: defaultRelationId(vote.id),
            title: "Helpful comment vote"
          });
        });
      (activity.comments || []).forEach(comment => {
        const legacyUpvotes = Number(comment.upvotes || comment.upvote_count || 0);
        for (let index = 0; index < legacyUpvotes; index += 1) {
          push({
            key: `legacy_helpful_vote:${defaultRelationId(comment.id) || comment.created_at || "comment"}:${index}`,
            type: "helpful_vote",
            points: pointRules.helpful_vote,
            date: comment.created_at || "",
            source: "mobile_comments",
            source_id: defaultRelationId(comment.id),
            title: "Helpful comment vote"
          });
        }
      });
    }

    const languageWords = Array.isArray(options.languageWords) ? options.languageWords : [];
    const languageCount = languageWords.length || Number(options.languageCorrectAttempts || options.languageLearned || 0);
    if (!hasExplicitPointEvents && !explicitTypes.has("vocab_guess") && languageWords.length) {
      languageWords.forEach(word => {
        const id = word.id || word.word_id || `${word.content_key || "language"}:${word.english || word.algonquian || word.learned_at || ""}`;
        push({
          key: `vocab_guess:${id}`,
          type: "vocab_guess",
          points: pointRules.vocab_guess,
          date: word.learned_at || word.answered_at || "",
          source: "mobile_language_quiz_progress",
          source_id: defaultRelationId(word.id),
          title: word.english || "Language word"
        });
      });
    } else if (!hasExplicitPointEvents && !explicitTypes.has("vocab_guess")) {
      for (let index = 0; index < languageCount; index += 1) {
        push({
          key: `vocab_guess:counted:${index + 1}`,
          type: "vocab_guess",
          points: pointRules.vocab_guess,
          date: "",
          source: "mobile_language_quiz_progress",
          title: "Language word"
        });
      }
    }

    const loginRecords = Array.isArray(options.loginRecords) ? options.loginRecords : [];
    if (!hasExplicitPointEvents && !explicitTypes.has("daily_open") && loginRecords.length) {
      profileLoginRewardRecords(loginRecords, options.identityIds || new Set(), { relationId: options.relationId || defaultRelationId })
        .forEach(record => {
          push({
            key: `daily_open:${record.login_date}`,
            type: "daily_open",
            points: pointRules.daily_open,
            date: record.created_at || record.login_date || "",
            source: "mobile_profile_logins",
            source_id: defaultRelationId(record.id),
            title: "Daily signed-in visit"
          });
        });
    } else if (!hasExplicitPointEvents && !explicitTypes.has("daily_open")) {
      const totalDays = Number(options.loginRewards?.totalDays || 0);
      for (let index = 0; index < totalDays; index += 1) {
        push({
          key: `daily_open:counted:${index + 1}`,
          type: "daily_open",
          points: pointRules.daily_open,
          date: "",
          source: "mobile_profile_logins",
          title: "Daily signed-in visit"
        });
      }
    }

    const supporterPoints = Number(options.supporterPoints || 0);
    if (!hasExplicitPointEvents && supporterPoints) {
      push({
        key: "monthly_supporter:current",
        type: "monthly_supporter",
        points: supporterPoints,
        date: "",
        source: "mobile_member_profiles",
        title: "Monthly supporter"
      });
    }

    return events;
  }

  function mergeProfilePointEvents(target = [], records = []) {
    (records || []).forEach(record => {
      if (!record?.event_key && !record?.id) return;
      const index = target.findIndex(item =>
        (record.id && Number(item.id) === Number(record.id)) ||
        (record.event_key && String(item.event_key || "") === String(record.event_key))
      );
      if (index >= 0) target[index] = { ...target[index], ...record };
      else target.push(record);
    });
    pointEventIndexCache.delete(target);
    return target;
  }

  function profilePointEventMemberId(event = {}, options = {}) {
    const relationId = options.relationId || defaultRelationId;
    return Number(relationId(event.member_profile));
  }

  function findProfilePointEventForKey(events = [], eventKey = "", profileId = null, options = {}) {
    const key = String(eventKey || "");
    if (!key) return null;
    const relationId = options.relationId || defaultRelationId;
    const id = Number(relationId(profileId));
    const index = pointEventIndex(events, options);
    return (id ? index.byProfileKey.get(`${id}|${key}`) : index.byKey.get(key)) || null;
  }

  function profilePointEventRequiresActiveProfile(eventType) {
    return ["daily_open", "vocab_guess", "site_visit", "site_checkin", "suggested_site"].includes(String(eventType || ""));
  }

  function activeContributorProfileId(profile = {}, sessionProfileId = null, options = {}) {
    const relationId = options.relationId || defaultRelationId;
    const profileId = Number(relationId(profile?.id));
    const savedProfileId = Number(relationId(sessionProfileId));
    if (savedProfileId) return profileId === savedProfileId ? profileId : 0;
    return profileId || 0;
  }

  function profilePointEventPayload(event = {}, options = {}) {
    const relationId = options.relationId || defaultRelationId;
    const profileId = Number(relationId(event.member_profile));
    const points = Number(event.points || 0);
    const eventType = String(event.event_type || "");
    if (!profileId || !points || !eventType || !event.event_key) return null;
    return {
      event_key: String(event.event_key),
      event_type: eventType,
      points,
      member_profile: profileId,
      source_collection: event.source_collection || "",
      source_id: event.source_id ? String(event.source_id) : "",
      source_slug: event.source_slug || "",
      source_title: event.source_title || "",
      created_at: event.created_at || new Date().toISOString()
    };
  }

  function profilePointEventsWithoutProfileIds(events = [], profileIds = [], options = {}) {
    const idSet = new Set((profileIds || []).map(id => String(Number(id))).filter(id => id !== "0"));
    if (!idSet.size) return Array.isArray(events) ? events : [];
    return (events || []).filter(event => !idSet.has(String(profilePointEventMemberId(event, options))));
  }

  function profileStatsFromActivity(activity = {}, options = {}) {
    const comments = activity.comments?.length || 0;
    const uniqueVisits = uniqueVisitRecords(activity.visits);
    const visits = uniqueVisits.length;
    const checkIns = uniqueVisits.filter(visit => hasSavedCheckinDistance(visit.distance_miles)).length;
    const purchases = activity.purchases?.length || 0;
    const suggestions = activity.suggestions?.length || 0;
    const waterwaySites = activity.waterwaySites?.length || 0;
    const historicRecords = activity.historicRecords?.length || 0;
    const homelands = Number(options.homelandsCount ?? activity.homelandsCount ?? activity.homelandCount ?? 0);
    const languageLearned = Number(options.languageLearned || 0);
    const languageCorrectAttempts = Number(options.languageCorrectAttempts || languageLearned || 0);
    const quizzesCompleted = Number(options.quizzesCompleted || 0);
    const plantSubmissions = Number(options.plantSubmissions || 0);
    const storiesPosted = Number(options.storiesPosted || 0);
    const loginRewards = options.loginRewards || { totalDays: 0, currentStreak: 0, bestStreak: 0 };
    const commentIds = new Set((activity.comments || []).map(comment => String(defaultRelationId(comment.id))).filter(Boolean));
    const commentUpvotes = (activity.commentVotes || []).filter(vote =>
      commentIds.has(String(defaultRelationId(vote.comment))) && String(vote.vote || "") === "up"
    ).length + (activity.comments || []).reduce((sum, comment) => sum + Number(comment.upvotes || comment.upvote_count || 0), 0);
    const pointEvents = profilePointEventsFromActivity(activity, options);
    const pointsByType = pointEvents.reduce((totals, event) => {
      totals[event.type] = Number(totals[event.type] || 0) + Number(event.points || 0);
      return totals;
    }, {});
    const commentPoints = Number(pointsByType.approved_comment || 0);
    const visitPoints = Number(pointsByType.site_visit || 0);
    const checkinPoints = Number(pointsByType.site_checkin || 0);
    const purchasePoints = Number(pointsByType.artwork_support || 0);
    const supporterPoints = Number(pointsByType.monthly_supporter || 0);
    const upvotePoints = Number(pointsByType.helpful_vote || 0);
    const languagePoints = Number(pointsByType.vocab_guess || 0);
    const loginPoints = Number(pointsByType.daily_open || 0);
    const suggestionPoints = Number(pointsByType.suggested_site || 0);
    const friendInvitePoints = Number(pointsByType.friend_invite || 0);
    const points = pointEvents.reduce((sum, event) => sum + Number(event.points || 0), 0);
    const emptyMilestone = options.emptyMilestone || "New Contributor";
    const milestone = visits >= 25 ? "Archive Walker"
      : homelands >= 13 ? "Thirteen Homelands"
      : languageLearned >= 10 ? "Language Learner"
      : Number(loginRewards.currentStreak || 0) >= 7 ? "Daily Learner"
      : comments >= 10 ? "Community Storyteller"
      : comments || visits || purchases || languageLearned || loginPoints || friendInvitePoints ? "Active Contributor"
      : emptyMilestone;
    return {
      ...activity,
      commentsCount: comments,
      visitsCount: visits,
      checkinsCount: checkIns,
      purchasesCount: purchases,
      suggestionsCount: suggestions,
      homelandsCount: homelands,
      waterwaySitesCount: waterwaySites,
      historicRecordsCount: historicRecords,
      languageLearned,
      languageCorrectAttempts,
      quizzesCompleted,
      plantSubmissions,
      storiesPosted,
      commentUpvotes,
      commentPoints,
      visitPoints,
      checkinPoints,
      purchasePoints,
      suggestionPoints,
      friendInvitePoints,
      supporterPoints,
      upvotePoints,
      languagePoints,
      loginPoints,
      loginStreak: Number(loginRewards.currentStreak || 0),
      loginDays: loginPoints,
      bestLoginStreak: Number(loginRewards.bestStreak || 0),
      pointEvents,
      pointsByType,
      points,
      milestone
    };
  }

  function profileCareBadgesFromStats(stats = {}, options = {}) {
    const badges = [];
    if (stats.commentsCount) badges.push("Respectful Contributor");
    if (stats.visitsCount) badges.push("Careful Visitor");
    if (stats.checkinsCount) badges.push("Place Keeper");
    if (stats.waterwaySitesCount) badges.push("Waterway Explorer");
    if (stats.historicRecordsCount) badges.push("Record Reader");
    if (stats.suggestionsCount) badges.push("Site Scout");
    if (stats.languageLearned) badges.push("Language Learner");
    if (Number(stats.loginStreak || 0) >= 3) badges.push("Daily Learner");
    if (stats.commentUpvotes) badges.push("Community Listener");
    if (stats.friendInvitePoints) badges.push("Community Inviter");
    if (stats.purchasesCount || stats.supporterPoints) badges.push("Project Supporter");
    if (!badges.length) badges.push(options.emptyBadge || "New Learner");
    return badges;
  }

  const ACHIEVEMENT_DEFINITIONS = [
    { key: "first_visit", label: "First Visit", metric: "visitsCount", target: 1 },
    { key: "long_island_explorer", label: "Long Island Explorer", metric: "visitsCount", target: 5 },
    { key: "thirteen_homelands", label: "Thirteen Homelands", metric: "homelandsCount", target: 13 },
    { key: "archive_walker", label: "Archive Walker", metric: "visitsCount", target: 25 },
    { key: "place_keeper", label: "Place Keeper", metric: "checkinsCount", target: 1 },
    { key: "language_learner", label: "Language Learner", metric: "languageLearned", target: 10 },
    { key: "daily_learner", label: "Daily Learner", metric: "loginStreak", target: 7 },
    { key: "community_storyteller", label: "Community Storyteller", metric: "commentsCount", target: 10 },
    { key: "community_listener", label: "Community Listener", metric: "commentUpvotes", target: 1 },
    { key: "site_scout", label: "Site Scout", metric: "suggestionsCount", target: 1 }
  ];

  function profileAchievementsFromStats(stats = {}, definitions = ACHIEVEMENT_DEFINITIONS) {
    return definitions.map(definition => {
      const value = Math.max(0, Number(stats[definition.metric] || 0));
      const target = Math.max(1, Number(definition.target || 1));
      return {
        ...definition,
        value,
        target,
        earned: value >= target,
        progressLabel: value >= target ? "Earned" : `${value}/${target}`
      };
    });
  }

  function profileBadgeSummariesFromStats(stats = {}) {
    return [
      { label: stats.milestone },
      stats.commentsCount ? { label: `${stats.commentsCount} comment${stats.commentsCount === 1 ? "" : "s"}` } : null,
      stats.visitsCount ? { label: `${stats.visitsCount} visit${stats.visitsCount === 1 ? "" : "s"}` } : null,
      stats.checkinsCount ? { label: `${stats.checkinsCount} check-in${stats.checkinsCount === 1 ? "" : "s"}` } : null,
      stats.waterwaySitesCount ? { label: `${stats.waterwaySitesCount} waterway site${stats.waterwaySitesCount === 1 ? "" : "s"}` } : null,
      stats.historicRecordsCount ? { label: `${stats.historicRecordsCount} historic record${stats.historicRecordsCount === 1 ? "" : "s"}` } : null,
      stats.suggestionsCount ? { label: `${stats.suggestionsCount} suggested site${stats.suggestionsCount === 1 ? "" : "s"}` } : null,
      stats.languageLearned ? { label: `Language Work (${stats.languageLearned})`, type: "language" } : null,
      stats.loginStreak ? { label: `${stats.loginStreak} day streak` } : null,
      stats.commentUpvotes ? { label: `${stats.commentUpvotes} helpful vote${stats.commentUpvotes === 1 ? "" : "s"}` } : null
    ].filter(Boolean);
  }

  function profileTrackerRowsFromStats(stats = {}) {
    return [
      {
        count: Number(stats.waterwaySitesCount || 0),
        text: `You explored ${Number(stats.waterwaySitesCount || 0)} site${Number(stats.waterwaySitesCount || 0) === 1 ? "" : "s"} connected to waterways.`
      },
      {
        count: Number(stats.historicRecordsCount || 0),
        text: `You viewed ${Number(stats.historicRecordsCount || 0)} historic record${Number(stats.historicRecordsCount || 0) === 1 ? "" : "s"}.`
      },
      {
        count: Number(stats.suggestionsCount || 0),
        text: `You contributed ${Number(stats.suggestionsCount || 0)} suggested site${Number(stats.suggestionsCount || 0) === 1 ? "" : "s"}.`
      }
    ].filter(row => row.count > 0);
  }

  function profilePointTotal(stats = {}) {
    const points = Number(stats.points);
    return Number.isFinite(points) ? points : 0;
  }

  function profilePointBreakdownRows(stats = {}, options = {}) {
    const labels = {
      login: "Daily signed-in visits",
      visit: "Visited sites",
      checkin: "Nearby check-ins",
      language: "Language words",
      comments: "Comments",
      helpful: "Helpful votes",
      suggestions: "Suggested sites",
      friendInvite: "Friend invites",
      support: "Support",
      purchases: "Artwork/support badges",
      supporter: "Monthly supporter",
      ...(options.labels || {})
    };
    const rows = (options.splitSupport
      ? [
        [labels.comments, stats.commentPoints],
        [labels.helpful, stats.upvotePoints],
        [labels.visit, stats.visitPoints],
        [labels.checkin, stats.checkinPoints],
        [labels.suggestions, stats.suggestionPoints],
        [labels.friendInvite, stats.friendInvitePoints],
        [labels.language, stats.languagePoints],
        [labels.login, stats.loginPoints],
        [labels.purchases, stats.purchasePoints],
        [labels.supporter, stats.supporterPoints]
      ]
      : [
        [labels.login, stats.loginPoints],
        [labels.visit, stats.visitPoints],
        [labels.checkin, stats.checkinPoints],
        [labels.language, stats.languagePoints],
        [labels.comments, stats.commentPoints],
        [labels.helpful, stats.upvotePoints],
        [labels.suggestions, stats.suggestionPoints],
        [labels.friendInvite, stats.friendInvitePoints],
        [labels.support, Number(stats.purchasePoints || 0) + Number(stats.supporterPoints || 0)]
      ]).filter(([, value]) => Number(value) > 0).map(([label, value]) => [label, Number(value) || 0]);
    return rows;
  }

  function profileEditorPayload(root, profile = {}, options = {}) {
    const value = selector => root?.querySelector(selector)?.value.trim() || "";
    const payload = {
      display_name: value("[data-profile-display-name]") || options.displayNameFallback || profile.display_name || "",
      headline: value("[data-profile-headline]"),
      location_label: value("[data-profile-location]"),
      website_url: value("[data-profile-website]"),
      bio: value("[data-profile-bio]")
    };
    if (options.includePublicProfile) {
      const publicEl = root?.querySelector("[data-profile-public]");
      payload.public_profile = !!publicEl?.checked;
      payload.profile_status = publicEl?.checked ? "published" : "hidden";
    }
    return payload;
  }

  function profileActivityFeedItems(activity = {}, options = {}) {
    const activityPreview = typeof options.activityPreview === "function"
      ? options.activityPreview
      : (value, length = 110) => String(value || "").slice(0, length);
    const activityDateValue = typeof options.activityDateValue === "function"
      ? options.activityDateValue
      : value => {
        const time = new Date(value || 0).getTime();
        return Number.isFinite(time) ? time : 0;
      };
    const language = (options.languageWords || []).map(word => ({
      type: "Language",
      title: `${word.english || "Word"} - ${word.algonquian || "saved"}`,
      detail: word.source || "Language quiz",
      date: word.learned_at || word.answered_at || "",
      points: 1
    }));
    const uniqueLogins = new Map();
    (options.loginRecords || []).forEach(record => {
      const key = String(record.login_date || record.created_at || record.id || "").slice(0, 10);
      if (!key) return;
      const existing = uniqueLogins.get(key);
      if (!existing || String(record.created_at || "") > String(existing.created_at || "")) uniqueLogins.set(key, record);
    });
    const logins = [...uniqueLogins.values()].map(record => ({
      type: "Visit",
      title: "Daily signed-in visit",
      detail: record.login_date || "Signed-in visit",
      date: record.created_at || record.login_date || "",
      points: 1
    }));
    const comments = (activity.comments || []).map(comment => {
      const sourceType = String(comment.source_type || "site").toLowerCase() === "wiki" ? "wiki" : "site";
      const sourceSlug = comment.site_slug || comment.source_slug || "";
      return {
        type: "Comment",
        title: comment.site_title || comment.source_title || "Community note",
        detail: activityPreview(comment.comment || "Approved comment", options.commentPreviewLength || 110),
        date: comment.created_at || "",
        points: 1 + Number(comment.upvotes || comment.upvote_count || 0),
        site_slug: sourceType === "site" ? sourceSlug : "",
        wiki_slug: sourceType === "wiki" ? sourceSlug : ""
      };
    });
    const uniqueFeedVisits = new Map();
    (activity.visits || []).forEach(visit => {
      const key = String(visit.site_slug || visit.site || visit.site_title || visit.id || "").toLowerCase();
      if (!key) return;
      const existing = uniqueFeedVisits.get(key);
      if (!existing || String(visit.visited_at || "") > String(existing.visited_at || "")) uniqueFeedVisits.set(key, visit);
    });
    const visits = [...uniqueFeedVisits.values()].map(visit => ({
      type: hasSavedCheckinDistance(visit.distance_miles) ? "Check-in" : "Visit",
      title: visit.site_title || visit.site_slug || "Visited site",
      detail: hasSavedCheckinDistance(visit.distance_miles) ? `Checked in nearby (${Number(visit.distance_miles).toFixed(2)} mi)` : "Marked as visited",
      date: visit.visited_at || "",
      points: POINT_RULES.site_visit + (hasSavedCheckinDistance(visit.distance_miles) ? POINT_RULES.site_checkin : 0),
      site_slug: visit.site_slug || ""
    }));
    const suggestions = (activity.suggestions || []).map(suggestion => ({
      type: "Suggestion",
      title: suggestion.title || "Suggested site",
      detail: "Submitted for review",
      date: suggestion.submitted_at || suggestion.date_created || "",
      points: 5
    }));
    const purchases = (activity.purchases || []).map(purchase => ({
      type: "Support",
      title: purchase.artwork_title || "Artwork support",
      detail: [purchase.print_size, purchase.material].filter(Boolean).join(" - ") || "Project support",
      date: purchase.created_at || purchase.purchase_date || "",
      points: 100
    }));
    const friendInvites = profilePointEventsFromActivity(activity, options)
      .filter(event => event.type === "friend_invite")
      .map(event => ({
        type: "Invite",
        title: event.title || "Friend accepted invite",
        detail: "A friend registered with your emailed invite code",
        date: event.date || "",
        points: event.points || POINT_RULES.friend_invite
      }));
    const progressLabels = {
      plant: "Plant find",
      story: "Story",
      quiz: "Quiz",
      interaction: "Community interaction"
    };
    const extraProgress = (options.profileMapItems || [])
      .filter(item => Object.prototype.hasOwnProperty.call(progressLabels, item.activity_type))
      .map(item => ({
        type: progressLabels[item.activity_type],
        title: item.title || "Contribution",
        detail: activityPreview(item.excerpt || progressLabels[item.activity_type], options.commentPreviewLength || 110),
        date: item.date_time || "",
        points: Number(item.points || 0),
        site_slug: item.related_type === "site" ? item.related_slug || "" : "",
        wiki_slug: item.related_type === "wiki" ? item.related_slug || "" : ""
      }));
    const includePurchases = options.includePurchases !== false;
    return [...comments, ...visits, ...suggestions, ...friendInvites, ...language, ...extraProgress, ...logins, ...(includePurchases ? purchases : [])]
      .sort((a, b) => activityDateValue(b.date) - activityDateValue(a.date))
      .slice(0, Number(options.limit || 14));
  }

  function profileActivityFromCollections(profile, collections = {}, options = {}) {
    const relationId = options.relationId || defaultRelationId;
    const normalizeCommentStatus = typeof options.normalizeCommentStatus === "function"
      ? options.normalizeCommentStatus
      : comment => String(comment?.status || "approved").toLowerCase();
    const identityIds = options.identityIds instanceof Set
      ? options.identityIds
      : profileIdentityIds(profile, options.profiles || [], { relationId });
    const identityNames = options.identityNames instanceof Set
      ? options.identityNames
      : profileIdentityNames(profile);
    if (isProfileBanned(profile)) {
      return {
        comments: [],
        visits: [],
        purchases: [],
      suggestions: [],
      waterwaySites: [],
      historicRecords: [],
      visitedSites: [],
      commentVotes: [],
      pointEvents: []
      };
    }
    const comments = (collections.comments || []).filter(comment => {
      if (["rejected", "deleted"].includes(normalizeCommentStatus(comment))) return false;
      if (comment.public_activity === false || String(comment.source_type || "").toLowerCase() === "feedback") return false;
      const memberId = Number(relationId(comment.member_profile));
      if (memberId && identityIds.has(memberId)) return true;
      const author = String(comment.author_name || "").trim().toLowerCase();
      return Boolean(author && identityNames.has(author));
    });
    const commentIds = new Set(comments.map(comment => String(relationId(comment.id))).filter(Boolean));
    const suggestionLooksLikeSite = suggestion => {
      if (/feedback/i.test(String(suggestion?.review_note || ""))) return false;
      if (Number.isFinite(Number(suggestion?.latitude)) && Number.isFinite(Number(suggestion?.longitude))) return true;
      return Boolean(suggestion?.geojson);
    };
    return {
      comments,
      commentVotes: (collections.commentVotes || []).filter(vote => commentIds.has(String(relationId(vote.comment)))),
      pointEvents: (collections.pointEvents || []).filter(event => identityIds.has(Number(relationId(event.member_profile)))),
      visits: (collections.visits || []).filter(visit => identityIds.has(Number(relationId(visit.member_profile)))),
      purchases: (collections.purchases || []).filter(purchase => identityIds.has(Number(relationId(purchase.member_profile)))),
      suggestions: (collections.suggestions || []).filter(suggestion => {
        if (!suggestionLooksLikeSite(suggestion)) return false;
        const authorId = Number(relationId(suggestion.author_profile));
        if (authorId && identityIds.has(authorId)) return true;
        const author = String(suggestion.author_name || suggestion.author_email || "").trim().toLowerCase();
        return Boolean(author && identityNames.has(author));
      }),
      waterwaySites: collections.waterwaySites || [],
      historicRecords: collections.historicRecords || [],
      visitedSites: collections.visitedSites || []
    };
  }

  function profileMapActivityModel(profile = {}, activity = {}, options = {}) {
    const relationId = options.relationId || defaultRelationId;
    const identityIds = options.identityIds instanceof Set
      ? options.identityIds
      : profileIdentityIds(profile, options.profiles || [], { relationId });
    const identityNames = options.identityNames instanceof Set
      ? options.identityNames
      : profileIdentityNames(profile);
    const resolveReference = typeof options.resolveReference === "function" ? options.resolveReference : () => null;
    const imageUrl = typeof options.imageUrl === "function" ? options.imageUrl : value => String(value || "");
    const cleanExcerpt = (value, limit = 180) => {
      const text = String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
    };
    const coordinates = value => {
      const pair = Array.isArray(value) ? value : [];
      const lng = Number(pair[0]);
      const lat = Number(pair[1]);
      return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
    };
    const explicitCoordinates = record => coordinates(
      record?.coordinates || record?.center || record?.geojson?.coordinates ||
      [record?.longitude ?? record?.observation_longitude, record?.latitude ?? record?.observation_latitude]
    );
    const referenceFor = (sourceType, slug, title, record = {}) => {
      const resolved = resolveReference({ sourceType, slug, title, record }) || {};
      return {
        sourceType: resolved.sourceType || sourceType || "site",
        relatedId: relationId(resolved.relatedId ?? resolved.id ?? record.source_id) || null,
        slug: resolved.slug || slug || "",
        title: resolved.title || title || slug || "Contribution",
        coordinates: coordinates(resolved.coordinates) || explicitCoordinates(record),
        url: resolved.url || "",
        image: imageUrl(resolved.image || "")
      };
    };
    const items = [];
    const belongsToProfile = (record, profileFields = ["member_profile"], nameFields = ["author_name", "submitted_by_name"]) => {
      let hasProfileReference = false;
      for (const field of profileFields) {
        const rawId = relationId(record?.[field]);
        if (rawId === null || rawId === undefined || rawId === "") continue;
        hasProfileReference = true;
        if (identityIds.has(Number(rawId))) return true;
      }
      if (hasProfileReference) return false;
      return nameFields.some(field => {
        const name = String(record?.[field] || "").trim().toLowerCase();
        return Boolean(name && identityNames.has(name));
      });
    };
    const add = (type, record, reference, detail = {}) => {
      if (!record || !reference) return;
      items.push({
        user_id: Number(relationId(profile.id || profile.profileId)) || null,
        activity_id: relationId(record.id) || null,
        activity_type: type,
        related_type: reference.sourceType || "site",
        related_id: reference.relatedId ?? detail.relatedId ?? null,
        related_slug: reference.slug || "",
        title: reference.title || detail.title || "Contribution",
        coordinates: reference.coordinates,
        date_time: detail.date || "",
        excerpt: cleanExcerpt(detail.excerpt || ""),
        image: imageUrl(detail.image || reference.image || ""),
        points: Number(detail.points || 0),
        url: detail.url || reference.url || ""
      });
    };

    uniqueVisitRecords(activity.visits || []).forEach(record => {
      const slug = record.site_slug || "";
      const checkedIn = hasSavedCheckinDistance(record.distance_miles);
      add(checkedIn ? "checkin" : "visit", record, referenceFor("site", slug, record.site_title || slug, record), {
        date: record.visited_at,
        excerpt: checkedIn ? `Checked in nearby (${Number(record.distance_miles).toFixed(2)} mi)` : "Marked as visited",
        points: POINT_RULES.site_visit + (checkedIn ? POINT_RULES.site_checkin : 0)
      });
    });
    (activity.comments || []).forEach(record => {
      const sourceType = String(record.source_type || "site").toLowerCase() === "wiki" ? "wiki" : "site";
      const slug = record.site_slug || record.source_slug || "";
      add("comment", record, referenceFor(sourceType, slug, record.site_title || record.source_title || slug, record), {
        date: record.created_at, excerpt: record.comment, image: record.comment_image, points: POINT_RULES.approved_comment
      });
    });
    (options.languageWords || []).forEach(record => {
      const [keyType, ...slugParts] = String(record.content_key || "").split(":");
      const sourceType = keyType === "wiki" ? "wiki" : "site";
      const slug = record.site_slug || record.source_slug || slugParts.join(":");
      add("language", record, referenceFor(sourceType, slug, record.content_title || record.source || slug, record), {
        date: record.learned_at || record.answered_at,
        excerpt: [record.english, record.algonquian].filter(Boolean).join(" - "),
        points: POINT_RULES.vocab_guess
      });
    });
    const quizAttemptKeys = new Set();
    (options.languageAttempts || []).forEach(record => {
      const memberId = Number(relationId(record.member_profile));
      if (!memberId || !identityIds.has(memberId)) return;
      const recordId = relationId(record.id);
      const date = String(record.answered_at || "").slice(0, 10);
      const attemptKey = recordId
        ? `id:${recordId}`
        : `${memberId}|${date}|${record.content_key || ""}|${record.word_id || ""}`;
      if (quizAttemptKeys.has(attemptKey)) return;
      quizAttemptKeys.add(attemptKey);
      const [keyType, ...slugParts] = String(record.content_key || "").split(":");
      const sourceType = keyType === "wiki" ? "wiki" : "site";
      const slug = record.site_slug || record.source_slug || slugParts.join(":");
      add("quiz", record, referenceFor(sourceType, slug, record.content_title || record.source || slug || "Word quiz", record), {
        date: record.answered_at,
        excerpt: record.correct === false ? "Completed a word quiz" : "Completed a word quiz correctly"
      });
    });
    (options.plantObservations || []).forEach(record => {
      if (!belongsToProfile(record)) return;
      if (["rejected", "deleted"].includes(String(record.status || "").toLowerCase())) return;
      const sourceType = String(record.source_type || "site").toLowerCase() === "wiki" ? "wiki" : "site";
      const slug = record.site_slug || record.source_slug || "";
      add("plant", record, referenceFor(sourceType, slug, record.site_title || record.source_title || record.common_name || "Plant find", record), {
        date: record.observed_at || record.created_at || record.date_created,
        excerpt: [record.common_name, record.scientific_name].filter(Boolean).join(" - "),
        image: record.photo || record.image
      });
    });
    (options.stories || []).forEach(record => {
      if (!belongsToProfile(record)) return;
      if (["rejected", "deleted"].includes(String(record.status || "").toLowerCase())) return;
      const slug = record.attached_site_slug || record.site_slug || record.source_slug || "";
      add("story", record, referenceFor("site", slug, record.attached_site_title || record.site_title || "Story", record), {
        date: record.created_at || record.date_created,
        excerpt: record.caption || record.story_text,
        image: record.photo || record.image
      });
    });
    (activity.suggestions || []).forEach(record => {
      const approvedSlug = String(relationId(record.approved_site) || record.site_slug || "");
      add("suggestion", record, referenceFor("site", approvedSlug, record.title || "Suggested site", record), {
        date: record.submitted_at || record.date_created,
        excerpt: record.introduction || record.review_note,
        image: record.suggested_image,
        points: POINT_RULES.suggested_site
      });
    });
    const allCommentsById = new Map((options.allComments || []).map(comment => [String(relationId(comment.id)), comment]));
    (options.interactionVotes || []).forEach(record => {
      const memberId = Number(relationId(record.member_profile));
      if (!memberId || !identityIds.has(memberId)) return;
      const comment = allCommentsById.get(String(relationId(record.comment)));
      if (!comment) return;
      const sourceType = String(comment.source_type || "site").toLowerCase() === "wiki" ? "wiki" : "site";
      const slug = comment.site_slug || comment.source_slug || "";
      add("interaction", record, referenceFor(sourceType, slug, comment.site_title || comment.source_title || slug, comment), {
        date: record.created_at,
        excerpt: record.vote === "up" ? "Marked a community comment as helpful" : "Interacted with a community comment"
      });
    });

    const typeOrder = ["checkin", "visit", "comment", "story", "plant", "language", "quiz", "suggestion", "interaction"];
    const mappedItems = items.filter(item => coordinates(item.coordinates));
    const groupsByKey = new Map();
    mappedItems.forEach(item => {
      const key = item.related_slug
        ? `${item.related_type}:${item.related_slug}`
        : `coordinate:${item.coordinates.map(value => Number(value).toFixed(4)).join(",")}`;
      const group = groupsByKey.get(key) || {
        key, title: item.title, related_type: item.related_type, related_slug: item.related_slug,
        coordinates: item.coordinates, url: item.url, image: item.image, items: []
      };
      group.items.push(item);
      if (!group.image && item.image) group.image = item.image;
      if (!group.url && item.url) group.url = item.url;
      groupsByKey.set(key, group);
    });
    const groups = [...groupsByKey.values()].map(group => {
      const types = [...new Set(group.items.map(item => item.activity_type))]
        .sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b));
      const dated = group.items.slice().sort((a, b) => new Date(a.date_time || 0) - new Date(b.date_time || 0));
      return {
        ...group,
        types,
        primary_type: types[0] || "interaction",
        first_date: dated[0]?.date_time || "",
        latest_date: dated[dated.length - 1]?.date_time || "",
        points: group.items.reduce((sum, item) => sum + Number(item.points || 0), 0)
      };
    }).sort((a, b) => new Date(a.first_date || 0) - new Date(b.first_date || 0));
    const journey = mappedItems
      .map((item, sourceIndex) => ({ item, sourceIndex, timestamp: Date.parse(item.date_time || "") }))
      .sort((a, b) => {
        const aTime = Number.isFinite(a.timestamp) ? a.timestamp : Number.MAX_SAFE_INTEGER;
        const bTime = Number.isFinite(b.timestamp) ? b.timestamp : Number.MAX_SAFE_INTEGER;
        return aTime - bTime || a.sourceIndex - b.sourceIndex;
      })
      .reduce((steps, entry) => {
        const previous = steps[steps.length - 1];
        const samePlace = previous
          && previous.coordinates[0] === entry.item.coordinates[0]
          && previous.coordinates[1] === entry.item.coordinates[1];
        if (!samePlace) steps.push({ ...entry.item, order: steps.length + 1 });
        return steps;
      }, []);
    const journeySegments = journey.slice(1).map((step, index) => ({
      order: index + 2,
      from: journey[index].coordinates,
      to: step.coordinates,
      date_time: step.date_time || "",
      title: step.title,
      activity_type: step.activity_type
    }));
    const counts = items.reduce((totals, item) => {
      totals[item.activity_type] = Number(totals[item.activity_type] || 0) + 1;
      return totals;
    }, {});
    return {
      user_id: Number(relationId(profile.id || profile.profileId)) || null,
      items,
      mappedItems,
      groups,
      journey,
      journeySegments,
      path: journey.map(step => step.coordinates),
      counts,
      unmappedCount: items.length - mappedItems.length,
      empty: items.length === 0,
      emptyMap: groups.length === 0
    };
  }

  function profileMapActivitySignature(collections = []) {
    let hash = 2166136261;
    let count = 0;
    (collections || []).forEach(collection => {
      const records = Array.isArray(collection) ? collection : [];
      count += records.length;
      const serialized = JSON.stringify(records);
      for (let index = 0; index < serialized.length; index += 1) {
        hash ^= serialized.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      hash ^= 124;
      hash = Math.imul(hash, 16777619);
    });
    return `${count}:${(hash >>> 0).toString(36)}`;
  }

  window.NLI_PROFILE_UTILS = {
    profileWebsiteUrl,
    normalizeAccountEmail,
    profileSlugFromEmail,
    randomSalt,
    hashPassword,
    existingRegistrationMessage,
    strongestRegistrationRecord,
    registrationIsApproved,
    hasContributorWriteSession,
    contributorWriteSessionMessage,
    money,
    supportMonths,
    supporterLine,
    profileJoinedDateValue,
    profileAccountAgeLabel,
    profileUserSinceLine,
    memberUsagePayload,
    isProfileBanned,
    isLikelyTestProfile,
    profileIdentityEmail,
    profileIdentityNames,
    profilesShareIdentity,
    profileIdentityIds,
    canonicalProfileIds,
    profileIdentityOptions,
    rowsFallback,
    responseUsedFallback,
    allResponsesFresh,
    withFallbackTimeout,
    rowsIncludeProfile,
    preserveActiveProfileRows,
    activeProfileFilterSuffix,
    contributorProfileScore,
    bestContributorProfile,
    publicContributorProfiles,
    isAdminContributor,
    mergeSeededProfiles,
    profileStorageKey,
    contributorProfileIsPending,
    normalizeStoredContributorProfile,
    CONTRIBUTOR_TIERS,
    contributorTierForPoints,
    nextContributorTier,
    contributorProgressToNextTier,
    contributorLimitLabel,
    contributorDailyLimit,
    contributorActionDateKey,
    contributorDailyActionCount,
    contributorDailyLimitState,
    contributorTierSummary,
    loginRewardStatsFromDates,
    profileLoginRewardRecords,
    loginRewardRecordKey,
    mergeLoginRewardRecords,
    latestLoginRewardAwardedAt,
    loginRewardRecentlyAwarded,
    nextDailyLoginReward,
    learnedLanguageWordsFromAttempts,
    languageCorrectAttemptCountFromAttempts,
    languageQuizCompletionCountFromAttempts,
    languageRemoteAttemptExists,
    languageQuizContentKey,
    languageWordPattern,
    languageWordForText,
    languageAttemptPayload,
    mergeLanguageAttemptRecords,
    syncLanguageAttempt,
    isPublishedPublicSite,
    publicVisitAccessStatus,
    isEligiblePublicVisitSite,
    publicSiteTotal,
    visitProgressLabel,
    SITE_CHECKIN_RADIUS_MILES,
    siteVisitIndex,
    hasSavedCheckinDistance,
    visitProfileId,
    siteVisitRecord,
    siteHasCheckin,
    siteHasRecordedCheckin,
    checkinDistanceStatus,
    checkinDistanceMessage,
    siteVisitPayload,
    syncSiteVisit,
    uniqueVisitRecords,
    mergeVisitRecords,
    pointEventIndex,
    profileStatsFromActivity,
    profilePointEventsFromActivity,
    mergeProfilePointEvents,
    profilePointEventMemberId,
    findProfilePointEventForKey,
    profilePointEventRequiresActiveProfile,
    activeContributorProfileId,
    profilePointEventPayload,
    profilePointEventsWithoutProfileIds,
    profileCareBadgesFromStats,
    profileAchievementsFromStats,
    profileBadgeSummariesFromStats,
    profileTrackerRowsFromStats,
    profilePointTotal,
    profilePointBreakdownRows,
    profileEditorPayload,
    profileActivityFeedItems,
    profileActivityFromCollections,
    profileMapActivityModel,
    profileMapActivitySignature,
    POINT_RULES
  };
}());
