(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NLI_LEARNING_CARD_UTILS = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const GENERIC_PUBLIC_LABELS = new Set([
    "",
    "article",
    "historic moment",
    "knowledgebase article",
    "listing",
    "record",
    "story",
    "this article",
    "untitled",
    "user story",
    "wiki article"
  ]);

  function plainText(value) {
    return String(value == null ? "" : value)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;|&#34;/gi, "\"")
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizedLabel(value) {
    return plainText(value).toLowerCase().replace(/[.:;,!?]+$/g, "").trim();
  }

  function meaningfulLabel(value) {
    const text = plainText(value);
    return GENERIC_PUBLIC_LABELS.has(normalizedLabel(text)) ? "" : text;
  }

  function firstMeaningful(values) {
    for (const value of values) {
      const text = meaningfulLabel(value);
      if (text) return text;
    }
    return "";
  }

  function firstText(values) {
    for (const value of values) {
      const text = plainText(value);
      if (text) return text;
    }
    return "";
  }

  function compactText(value, limit = 0) {
    const text = plainText(value);
    if (!limit || text.length <= limit) return text;
    const clipped = text.slice(0, limit + 1);
    const boundary = clipped.lastIndexOf(" ");
    return `${clipped.slice(0, boundary > Math.floor(limit * 0.55) ? boundary : limit).trim()}...`;
  }

  function normalizeType(value) {
    const type = String(value || "").trim().toLowerCase().replace(/[\s_]+/g, "-");
    if (["map-story", "visitor-story", "community-story"].includes(type)) return "user-story";
    if (["timeline", "timeline-event", "historic-event"].includes(type)) return "historic-moment";
    if (["knowledgebase", "knowledge-base", "wiki-article"].includes(type)) return "wiki";
    if (["place", "listing"].includes(type)) return "site";
    return type || "learning";
  }

  function normalizeAuthor(input = {}) {
    const authorInput = input.author && typeof input.author === "object" ? input.author : {};
    const displayName = firstMeaningful([
      authorInput.displayName,
      authorInput.display_name,
      authorInput.name,
      input.authorName,
      input.author_name,
      input.displayName,
      input.display_name
    ]);
    const id = firstText([
      authorInput.id,
      authorInput.profileId,
      input.authorId,
      input.author_id,
      input.memberProfile,
      input.member_profile
    ]);
    return { id, displayName };
  }

  function fallbackTitle(type, authorName) {
    if (type === "site") return "Explore this place";
    if (type === "wiki") return "Explore this history";
    if (type === "historic-moment") return "A moment in local history";
    if (type === "user-story") return authorName
      ? `${authorName} shared a story`
      : "A community member shared a story";
    if (type === "comment") return authorName
      ? `Community note from ${authorName}`
      : "A community note";
    if (type === "event") return "A community event";
    return "Explore local history";
  }

  function resolveNames(input, type, author) {
    const sourceCandidate = firstMeaningful([
      input.source,
      input.sourceName,
      input.source_name,
      input.pageName,
      input.page_name,
      input.sourceTitle,
      input.source_title,
      input.relatedTitle,
      input.related_title,
      input.attachedSiteTitle,
      input.attached_site_title
    ]);
    const titleCandidate = firstMeaningful([
      input.title,
      input.headline,
      input.cardTitle,
      input.card_title
    ]);
    const title = titleCandidate ||
      ((type === "site" || type === "wiki" || type === "comment") ? sourceCandidate : "") ||
      fallbackTitle(type, author.displayName);

    let source = sourceCandidate;
    if (type === "user-story") source = author.displayName || sourceCandidate;
    if (!source && type === "comment") source = author.displayName || "Community discussion";
    if (!source) source = title;

    const pageName = firstMeaningful([input.pageName, input.page_name]) || source;
    return { title, source, pageName };
  }

  function cleanUrl(value) {
    const url = String(value || "").trim();
    if (!url || /^(?:javascript|vbscript):/i.test(url)) return "";
    return url;
  }

  function relationId(value) {
    if (value == null) return "";
    if (typeof value === "object") return firstText([value.id, value.value, value.slug]);
    return firstText([value]);
  }

  function firstRelationId(values) {
    for (const value of values) {
      const id = relationId(value);
      if (id) return id;
    }
    return "";
  }

  function normalizeTarget(input = {}, type = "") {
    const targetInput = input.target && typeof input.target === "object"
      ? input.target
      : input.deepTarget && typeof input.deepTarget === "object"
        ? input.deepTarget
        : {};
    const targetType = normalizeType(firstText([
      targetInput.type,
      input.targetType,
      input.target_type,
      type
    ]));
    const id = firstRelationId([
      targetInput.id,
      input.targetId,
      input.target_id,
      input.sourceId,
      input.source_id
    ]);
    const slug = firstText([
      targetInput.slug,
      input.targetSlug,
      input.target_slug,
      input.slug,
      input.sourceSlug,
      input.source_slug
    ]);
    const url = cleanUrl(firstText([
      targetInput.url,
      targetInput.fullUrl,
      input.fullUrl,
      input.full_url,
      input.url,
      input.articleUrl,
      input.article_url
    ]));
    if (!id && !slug && !url) return null;
    return { type: targetType, id, slug, url };
  }

  function normalizeCoordinates(value, input = {}) {
    let longitude;
    let latitude;
    if (Array.isArray(value)) {
      [longitude, latitude] = value;
    } else if (value && typeof value === "object") {
      longitude = value.longitude ?? value.lng ?? value.lon ?? value.x;
      latitude = value.latitude ?? value.lat ?? value.y;
    } else {
      longitude = input.longitude ?? input.lng ?? input.lon;
      latitude = input.latitude ?? input.lat;
    }

    function coordinateNumber(coordinate) {
      if (coordinate == null) return null;
      if (typeof coordinate === "string" && !coordinate.trim()) return null;
      const number = Number(coordinate);
      return Number.isFinite(number) ? number : null;
    }

    longitude = coordinateNumber(longitude);
    latitude = coordinateNumber(latitude);
    if (longitude == null || latitude == null) return null;
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;
    return [longitude, latitude];
  }

  function normalizeMapTarget(input = {}) {
    const mapInput = input.map && typeof input.map === "object"
      ? input.map
      : input.relatedMapItem && typeof input.relatedMapItem === "object"
        ? input.relatedMapItem
        : input.mapItem && typeof input.mapItem === "object"
          ? input.mapItem
          : {};
    const coordinates = normalizeCoordinates(
      input.coordinates || input.mapCoordinates || input.map_coordinates || mapInput.coordinates,
      { ...input, ...mapInput }
    );
    const itemType = normalizeType(firstText([
      mapInput.itemType,
      mapInput.item_type,
      mapInput.type,
      input.mapItemType,
      input.map_item_type
    ]));
    const itemId = firstRelationId([
      mapInput.itemId,
      mapInput.item_id,
      mapInput.id,
      input.mapItemId,
      input.map_item_id
    ]);
    const slug = firstText([mapInput.slug, input.mapSlug, input.map_slug]);
    if (!coordinates && !itemId && !slug) return null;
    return { itemType, itemId, slug, coordinates };
  }

  function finiteCount(value) {
    const count = Number(value);
    return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  }

  function normalizeCounts(input = {}) {
    const counts = input.counts && typeof input.counts === "object" ? input.counts : {};
    return {
      upvotes: finiteCount(
        counts.upvotes ?? counts.upVotes ?? counts.likes ??
        input.upvoteCount ?? input.upvote_count ?? input.upvotes ?? input.likeCount
      ),
      comments: finiteCount(
        counts.comments ?? counts.commentCount ??
        input.commentCount ?? input.comment_count ?? input.commentsCount
      )
    };
  }

  function explicitBoolean(values, fallback = false) {
    for (const value of values) {
      if (typeof value === "boolean") return value;
    }
    return fallback;
  }

  function normalizeAccess(input = {}, target, mapTarget) {
    const capabilitiesInput = input.capabilities && typeof input.capabilities === "object"
      ? input.capabilities
      : {};
    const permissionsInput = input.permissions && typeof input.permissions === "object"
      ? input.permissions
      : {};
    const capabilities = {
      open: explicitBoolean(
        [capabilitiesInput.open, capabilitiesInput.canOpen, input.supportsOpen],
        Boolean(target)
      ),
      map: explicitBoolean(
        [capabilitiesInput.map, capabilitiesInput.canMap, input.supportsMap],
        Boolean(mapTarget)
      ),
      vote: explicitBoolean(
        [capabilitiesInput.vote, capabilitiesInput.canVote, input.supportsVote],
        false
      ),
      comment: explicitBoolean(
        [capabilitiesInput.comment, capabilitiesInput.canComment, input.supportsComment],
        false
      )
    };
    const loggedIn = explicitBoolean([
      permissionsInput.loggedIn,
      permissionsInput.logged_in,
      input.loggedIn,
      input.logged_in
    ], false);
    const permissions = {
      loggedIn,
      canOpen: capabilities.open && explicitBoolean([
        permissionsInput.canOpen,
        permissionsInput.open
      ], true),
      canMap: capabilities.map && explicitBoolean([
        permissionsInput.canMap,
        permissionsInput.map
      ], true),
      canVote: loggedIn && capabilities.vote && explicitBoolean([
        permissionsInput.canVote,
        permissionsInput.vote
      ], true),
      canComment: loggedIn && capabilities.comment && explicitBoolean([
        permissionsInput.canComment,
        permissionsInput.comment
      ], true)
    };
    return { capabilities, permissions };
  }

  function shortHash(value) {
    const text = String(value || "");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function stableCardKey(input, type, id, target, title, date) {
    const explicit = firstText([input.key, input.cardKey, input.card_key]);
    if (explicit) return explicit;
    if (id) return `${type}:${id}`;
    if (target?.id) return `${type}:${target.type}:${target.id}`;
    if (target?.slug) return `${type}:${target.type}:${target.slug}`;
    if (target?.url) return `${type}:url:${shortHash(target.url)}`;
    return `${type}:generated:${shortHash([title, date].join("|"))}`;
  }

  function normalizeLearningCard(input = {}, options = {}) {
    const type = normalizeType(input.type || input.kind || options.type);
    const author = normalizeAuthor(input);
    const names = resolveNames(input, type, author);
    const id = firstRelationId([
      input.id,
      input.cardId,
      input.card_id,
      input.activityId,
      input.activity_id
    ]);
    const date = firstText([
      input.date,
      input.dateTime,
      input.date_time,
      input.createdAt,
      input.created_at,
      input.updatedAt,
      input.updated_at
    ]);
    const target = normalizeTarget(input, type);
    const map = normalizeMapTarget(input);
    const access = normalizeAccess(input, target, map);
    const imageUrl = cleanUrl(firstText([
      input.imageUrl,
      input.image_url,
      input.image,
      input.photo,
      input.featuredImage,
      input.featured_image
    ]));
    const imageFallbackUrl = cleanUrl(firstText([
      input.imageFallbackUrl,
      input.image_fallback_url,
      input.imageFallback,
      input.image_fallback,
      input.fallbackImage,
      input.fallback_image
    ]));
    const excerpt = compactText(firstText([
      input.excerpt,
      input.preview,
      input.description,
      input.summary,
      input.storyText,
      input.story_text,
      input.message,
      input.comment,
      input.caption
    ]), Number(options.excerptLimit || 0));
    const fullUrl = cleanUrl(firstText([
      input.fullUrl,
      input.full_url,
      target?.url
    ]));
    const pinned = explicitBoolean([input.pinned, input.isPinned, input.is_pinned], false);
    const error = compactText(
      typeof input.error === "object" && input.error
        ? input.error.message
        : input.error,
      240
    );
    const card = {
      key: "",
      id,
      type,
      title: names.title,
      source: names.source,
      sourceName: names.source,
      pageName: names.pageName,
      date,
      imageUrl,
      imageFallbackUrl,
      excerpt,
      fullUrl,
      target,
      relatedMapItem: map,
      coordinates: map?.coordinates || null,
      counts: normalizeCounts(input),
      author,
      permissions: access.permissions,
      capabilities: access.capabilities,
      loading: Boolean(input.loading),
      error,
      pinned
    };
    card.key = stableCardKey(input, type, id, target, card.title, date);
    return card;
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") {
      return Object.keys(value).sort().reduce((result, key) => {
        result[key] = stableValue(value[key]);
        return result;
      }, {});
    }
    if (typeof value === "number" && !Number.isFinite(value)) return null;
    return value;
  }

  function learningCardSignature(card) {
    return JSON.stringify(stableValue(normalizeLearningCard(card)));
  }

  function learningCardsSignature(cards = []) {
    return (cards || []).map(learningCardSignature).join("\u001e");
  }

  function learningCardsEqual(first = [], second = []) {
    return learningCardsSignature(first) === learningCardsSignature(second);
  }

  function createActionGuard() {
    const activeKeys = new Set();

    function normalizeActionKey(key) {
      return String(key == null ? "" : key).trim();
    }

    function has(key) {
      const normalizedKey = normalizeActionKey(key);
      return Boolean(normalizedKey && activeKeys.has(normalizedKey));
    }

    function begin(key) {
      const normalizedKey = normalizeActionKey(key);
      if (!normalizedKey || activeKeys.has(normalizedKey)) return false;
      activeKeys.add(normalizedKey);
      return true;
    }

    function end(key) {
      const normalizedKey = normalizeActionKey(key);
      return Boolean(normalizedKey && activeKeys.delete(normalizedKey));
    }

    function run(key, action) {
      if (typeof action !== "function") {
        throw new TypeError("Action guard requires a function.");
      }
      if (!begin(key)) return null;

      try {
        return Promise.resolve(action()).finally(() => {
          end(key);
        });
      } catch (error) {
        end(key);
        return Promise.reject(error);
      }
    }

    return {
      begin,
      has,
      end,
      run
    };
  }

  return {
    GENERIC_PUBLIC_LABELS,
    plainText,
    meaningfulLabel,
    normalizeType,
    normalizeCoordinates,
    normalizeLearningCard,
    learningCardSignature,
    learningCardsSignature,
    learningCardsEqual,
    createActionGuard
  };
}));
