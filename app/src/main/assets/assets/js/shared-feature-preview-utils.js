(function () {
  function call(fn, fallback, ...args) {
    return typeof fn === "function" ? fn(...args) : fallback;
  }

  function hoverSummary(deps, value) {
    return call(deps.hoverSummary, value || "", value || "", { limit: 620, minSentenceLength: 140 });
  }

  function cleanText(deps, value) {
    return call(deps.stripHtml, value || "", value || "").replace(/\s+/g, " ").trim();
  }

  function uniqueTextParts(parts) {
    const seen = [];
    return parts.filter(part => {
      const text = String(part || "").replace(/\s+/g, " ").trim();
      if (!text) return false;
      const key = text.toLowerCase();
      if (seen.some(existing => existing.includes(key) || key.includes(existing))) return false;
      seen.push(key);
      return true;
    });
  }

  function siteHoverSummary(site, deps) {
    if (!site) return "";
    return uniqueTextParts([
      cleanText(deps, site.summary),
      cleanText(deps, site.introduction_content),
      cleanText(deps, site.preservation_content),
      cleanText(deps, site.history_content),
      cleanText(deps, site.oral_history_content),
      cleanText(deps, site.legends_and_lore_content)
    ]).join(" ");
  }

  function siteHoverTags(site, deps) {
    const tags = typeof deps.siteCategoryTags === "function" ? deps.siteCategoryTags(site) : [];
    return Array.isArray(tags)
      ? tags.map(tag => typeof tag === "string" ? tag : tag?.label).filter(Boolean)
      : [];
  }

  function buildFeaturePreview(feature, deps = {}) {
    const props = feature?.properties || {};
    if (props.map_story_id) {
      const story = call(deps.findMapStory, null, props.map_story_id);
      const author = call(deps.mapStoryAuthorName, "Contributor", story) || "Contributor";
      const text = call(deps.quotedMapStoryText, "", story) || "";
      return {
        title: `${author} says:`,
        summary: hoverSummary(deps, text),
        image: call(deps.directusAssetUrl, "", story?.photo) || "",
        imageFallback: "",
        meta: story?.attached_site_title || call(deps.mapStoryTimeLabel, "", story) || "",
        footer: "Visitor Story"
      };
    }

    if (props.calendar_event_slug) {
      const event = call(deps.findEventBySlug, null, props.calendar_event_slug);
      if (event) {
        const dateRange = call(deps.eventDateRange, "", event) || "";
        const eventText = event.summary || event.body || dateRange;
        return {
          title: event.title,
          summary: hoverSummary(deps, call(deps.stripHtml, eventText || "", eventText || "")),
          image: call(deps.directusAssetUrl, "", event.cover_image) || "",
          imageFallback: "",
          meta: [dateRange, event.venue].filter(Boolean).join(" - ")
        };
      }
    }

    const territory = Boolean(call(deps.isImportedTerritory, false, feature));
    const target = territory ? call(deps.territoryTarget, null, feature) : null;
    const territorySite = target?.type === "site" ? target.item : null;
    const site = territorySite || call(deps.findSiteFromFeature, null, feature);
    const displayedTitle = call(deps.displayFeatureTitle, "", props);
    const title = territory ? displayedTitle : (site?.title || displayedTitle || "Map feature");
    const description = props.description || "";
    const summary = site
      ? siteHoverSummary(site, deps)
      : cleanText(deps, description);
    const categoryLabel = call(deps.featureCategoryLabel, "", props.feature_category) || "";
    const meta = site
      ? (site.site_type ? call(deps.safeSiteSubtitle, "", { site_type: site.site_type }) : "")
      : categoryLabel;
    return {
      title,
      summary: summary ? hoverSummary(deps, summary) : categoryLabel,
      image: site
        ? call(deps.listingHoverImage, "", site) || ""
        : props.gallery?.[0]?.thumbnail || props.pic || "",
      imageFallback: site ? call(deps.listingThumbFallback, "", site) || "" : "",
      meta,
      tags: site ? siteHoverTags(site, deps) : (categoryLabel ? [categoryLabel] : []),
      actions: []
    };
  }

  window.NLI_FEATURE_PREVIEW_UTILS = {
    buildFeaturePreview
  };
}());
