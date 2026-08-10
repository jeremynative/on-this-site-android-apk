(function () {
  function fields(list) {
    return list.join(",");
  }

  const profileFields = fields([
    "id", "display_name", "slug", "role_label", "headline", "bio", "location_label", "website_url", "avatar", "joined_at",
    "public_profile", "profile_status", "account_enabled", "account_banned", "is_monthly_supporter"
  ]);

  const publicVisitFields = fields(["id", "member_profile", "site", "site_slug", "site_title", "visited_at", "distance_miles", "public_activity"]);
  const siteSuggestionFields = fields(["id", "status", "title", "introduction", "suggested_image", "approved_site", "author_profile", "author_name", "latitude", "longitude", "geojson", "submitted_at", "date_created"]);
  const languageProgressFields = fields(["id", "member_profile", "word_id", "english", "algonquian", "source", "content_key", "content_title", "correct", "answered_at"]);
  const loginRewardFields = fields(["id", "member_profile", "login_date", "streak_day", "created_at"]);
  const followFields = fields(["id", "status", "follower_profile", "following_profile", "follower_name", "following_name", "created_at"]);
  const supportFields = fields(["id", "key", "title", "show_support_goal", "monthly_goal", "current_monthly_support", "donate_url", "support_note"]);
  const siteAdoptionFields = [
    "adopted_by_display_name", "adopted_by_name", "adopter_display_name", "adopter_name",
    "place_steward_name", "supporter_display_name", "adoption_status", "adopted_status",
    "place_stewardship_status", "adoption_active", "place_stewardship_active"
  ];
  const desktopSiteFields = fields([
    "id", "title", "slug", "publication_status", "summary", "address_label", "site_type", "geojson", "display_geojson",
    "geometry_surface", "geometry_cleanup_status", "map_geometry_source", "map_fill_color", "map_opacity",
    "map_icon", "listing_image_file", "listing_image_url", "listing_image_thumb_url", "listing_image_alt",
    "activity_pin_until", "activity_pin_label", "activity_pin_title", "activity_pin_preview",
    "activity_update_date", "activity_update_summary",
    "show_print_purchase", "last_reviewed", "wp_date", "known_plant_species", "ancestral_territory",
    "ancestral_territory_note", "why_this_matters",
    ...siteAdoptionFields
  ]);
  const mobileSiteIndexFields = fields([
    "id", "title", "slug", "publication_status", "summary", "address_label", "site_type", "geojson", "display_geojson",
    "geometry_surface", "geometry_cleanup_status", "map_icon", "map_fill_color", "map_opacity",
    "listing_image_file", "listing_image_thumb_url", "listing_image_url", "listing_image_alt",
    "activity_pin_until", "activity_pin_label", "activity_pin_title", "activity_pin_preview",
    "activity_update_date", "activity_update_summary",
    "show_print_purchase",
    "last_reviewed", "known_plant_species", "ancestral_territory", "ancestral_territory_note", "why_this_matters",
    ...siteAdoptionFields
  ]);
  const mobileSiteDetailFields = fields([
    "id", "title", "slug", "publication_status", "summary", "address_label", "site_type", "geojson", "display_geojson",
    "geometry_surface", "geometry_cleanup_status", "map_icon", "map_fill_color", "map_opacity",
    "listing_image_file", "listing_image_url", "listing_image_thumb_url", "listing_image_alt",
    "activity_pin_until", "activity_pin_label", "activity_pin_title", "activity_pin_preview",
    "activity_update_date", "activity_update_summary",
    "show_print_purchase", "introduction_title", "introduction_content", "history_title", "history_content",
    "preservation_title", "preservation_content", "oral_history_title", "oral_history_content",
    "translation_title", "translation_content", "legends_and_lore_title", "legends_and_lore_content",
    "artifacts_title", "artifacts_content", "colonial_description_title", "colonial_description_content",
    "land_loss_title", "land_loss_content", "excavation_title", "excavation_content",
    "vandalism_title", "vandalism_content",
    "whereintheworld_title", "whereintheworld_content",
    "last_reviewed", "wp_date", "known_plant_species", "ancestral_territory", "ancestral_territory_note", "why_this_matters",
    ...siteAdoptionFields
  ]);
  const desktopWikiFields = fields(["id", "title", "slug", "summary", "why_this_matters", "source_url", "activity_update_date", "activity_update_summary", "last_reviewed", "lastmod", "imported_at"]);
  const mobileWikiIndexFields = fields(["id", "title", "slug", "summary", "why_this_matters", "source_url", "activity_update_date", "activity_update_summary", "last_reviewed", "lastmod", "imported_at"]);
  const mobileWikiDetailFields = fields(["id", "title", "slug", "summary", "content", "why_this_matters", "source_url", "activity_update_date", "activity_update_summary", "last_reviewed", "lastmod", "imported_at"]);
  const desktopPageFields = fields(["id", "title", "slug", "summary", "content_type", "wp_date", "featured_image_url"]);
  const desktopBlogFields = fields(["id", "title", "slug", "summary", "published_at", "featured_image_url"]);
  const timelineFields = fields([
    "id", "title", "description", "date_label", "period", "start_year", "end_year", "sort_key",
    "source_type", "source_id", "source_slug", "source_title", "source_section", "source_section_key",
    "location_label", "citation", "source_excerpt", "research_source_id", "site", "wiki_article", "latitude", "longitude"
  ]);
  const basicTimelineFields = fields([
    "id", "title", "description", "date_label", "period", "start_year", "end_year", "sort_key",
    "source_type", "source_id", "source_slug", "source_title", "source_section", "location_label",
    "site", "wiki_article", "latitude", "longitude"
  ]);
  const todoMapFields = fields([
    "id", "title", "connected_site", "todo_geojson", "todo_map_geometry_type", "todo_map_icon", "todo_map_notes", "ready_to_apply"
  ]);

  const exhibitFields = fields([
    "id", "status", "event_type", "title", "slug", "venue", "address_label", "summary", "body",
    "start_datetime", "end_datetime", "all_day", "timezone", "on_view_status", "is_permanent",
    "geojson", "map_icon", "icon_color", "cover_image", "external_url", "related_site_slug",
    "related_wiki_slug", "related_blog_slug", "collection_piece_title", "collection_artist",
    "collection_date", "activity_feed_date", "activity_pin_until", "activity_pin_label",
    "activity_pin_title", "activity_pin_preview", "create_historic_moment", "historic_period"
  ]);

  const plantObservationFields = fields([
    "id", "status", "site_slug", "site_title", "source_type", "source_id", "source_slug", "source_title",
    "member_profile", "author_name", "photo", "common_name", "scientific_name", "confidence",
    "identification_status", "identification_source", "algonquian_word", "algonquian_source",
    "indigenous_context", "edible_safety", "medicinal_use", "native_status", "invasive_status",
    "endangered_status", "visitor_guidance", "visitor_notes", "observation_latitude",
    "observation_longitude", "observation_location_source", "public_submitted_at", "created_at"
  ]);

  const mapStoryFields = fields([
    "id", "status", "prompt_key", "prompt_label", "caption", "photo",
    "latitude", "longitude", "location_source", "attached_site", "attached_site_slug", "attached_site_title",
    "member_profile", "author_name", "created_at", "expires_at", "expires_original_at",
    "permanent", "admin_permanent", "up_votes", "down_votes", "vote_score"
  ]);

  window.NLI_SHARED_CONFIG = {
    directusUrl: "https://directus.nativelongisland.com",
    publicArchiveBase: "https://nativelongisland.com/",
    fields: {
      profile: profileFields,
      publicVisit: publicVisitFields,
      siteSuggestion: siteSuggestionFields,
      languageProgress: languageProgressFields,
      loginReward: loginRewardFields,
      follow: followFields,
      support: supportFields,
      desktopSite: desktopSiteFields,
      mobileSiteIndex: mobileSiteIndexFields,
      mobileSiteDetail: mobileSiteDetailFields,
      desktopWiki: desktopWikiFields,
      mobileWikiIndex: mobileWikiIndexFields,
      mobileWikiDetail: mobileWikiDetailFields,
      desktopPage: desktopPageFields,
      desktopBlog: desktopBlogFields,
      timeline: timelineFields,
      basicTimeline: basicTimelineFields,
      todoMap: todoMapFields,
      exhibit: exhibitFields,
      plantObservation: plantObservationFields,
      mapStory: mapStoryFields,
      mapStoryVote: fields(["id", "story", "vote", "visitor_key", "member_profile", "created_at"]),
      commentVote: fields(["id", "comment", "vote", "vote_key", "member_profile", "created_at"]),
      pointEvent: fields(["id", "event_key", "event_type", "points", "member_profile", "source_collection", "source_id", "source_slug", "source_title", "created_at"]),
      publicComment: fields([
        "id", "status", "public_activity", "source_type", "source_id", "source_slug", "source_title",
        "quote_context", "source_section", "source_excerpt",
        "site_slug", "site_title", "member_profile", "author_name", "parent_comment", "reply_to_profile",
        "comment", "comment_image", "created_at"
      ]),
      desktopPublicComment: fields([
        "id", "member_profile", "site_slug", "site_title", "source_type", "source_id", "source_slug",
        "source_title", "quote_context", "source_section", "source_excerpt", "author_name", "parent_comment", "reply_to_profile", "comment", "comment_image",
        "status", "created_at"
      ]),
      printPurchase: fields([
        "id", "status", "public_on_profile", "member_profile", "buyer_name", "artwork_title",
        "artwork_image_url", "source_type", "source_slug", "print_size", "material", "amount", "paid_at"
      ])
    },
    mapStory: {
      baseLifetimeMs: 24 * 60 * 60 * 1000,
      voteHourMs: 60 * 60 * 1000,
      permanentScore: 10,
      prompts: [
        { key: "indigenous_memory", label: "Share a story from this place", help: "A place, view, object, plant, shoreline, or building that makes you think about Native history and presence." },
        { key: "missing_site", label: "A place that should be added to the map", help: "A possible Native site, place name, archive clue, memorial idea, or location that needs more research." },
        { key: "land_appreciation", label: "Gratitude for Native land from this place", help: "A respectful landscape, nature preserve, shoreline, or view that helps people notice the land they are on." },
        { key: "needs_care", label: "A place needing care, protection, or remembrance", help: "A threatened place, construction concern, plant habitat, cemetery, shoreline, or site that should be treated carefully." },
        { key: "art_or_visit", label: "Art, exhibit, or site visit connected to Native Long Island", help: "A photo from an exhibit, artwork, public program, or one of the mapped sites." }
      ]
    },
    seededPublicProfiles: [
      {
        id: "seeded-ocean-pin-mobile-tester",
        username: "ocean-pin-mobile-tester",
        display_name: "Ocean Pin Mobile Tester",
        slug: "ocean-pin-mobile-tester",
        role_label: "QA Contributor",
        public_profile: false,
        profile_status: "hidden",
        account_enabled: true,
        account_banned: false,
        joined_at: "2026-05-18T00:00:00Z"
      }
    ],
    seededPublicComments: [
      {
        id: "seeded-whales-fin-ocean-pin-mobile",
        status: "approved",
        source_type: "site",
        source_slug: "whales-fin",
        source_title: "Whale's Fin",
        site_slug: "whales-fin",
        site_title: "Whale's Fin",
        member_profile: "seeded-ocean-pin-mobile-tester",
        author_name: "Ocean Pin Mobile Tester",
        comment: "Mobile map pin verification fixture.",
        created_at: "2026-05-18T00:00:00Z"
      }
    ]
  };
}());
