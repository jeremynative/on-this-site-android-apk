// AR for the Android app's home-screen AR button and the AR button on a
// site panel: the camera opens straight onto bubbles (stories, people,
// words, finds) floating around the visitor. The AR view is a native (APK)
// screen. Photogrammetry scanning was removed on 2026-11-01.
(function () {
  function create(ctx) {
    const { state, DIRECTUS, openSheet, androidBridgeToken, requestUserLocation, nativeCachedUserPosition, sheetEl, listEl } = ctx;
    // The APK's offline shell passes iconBase (bundled "asset:" icons the AR
    // screen opens without a network) and siteDetail (the bundled page). The
    // APK keeps an identical copy of this file for offline use.

    // The AR button shows in any version of the app; one too old for AR
    // bubbles is asked to update.
    function arAppAvailable() {
      return Boolean(window.AndroidApp?.openArNearby || window.AndroidApp?.openScanSpace);
    }

    function arUserLocation() {
      const native = window.AndroidApp?.getCachedLocation ? nativeCachedUserPosition() : null;
      if (native) return { lat: native.latitude, lng: native.longitude };
      const known = Array.isArray(state.userLocation) ? state.userLocation : null;
      return known ? { lat: Number(known[1]), lng: Number(known[0]) } : null;
    }

    // AR like Pokémon GO: the camera opens straight away and bubbles float
    // around you at eye level, with no scan, marker card or placing needed.
    // Anywhere: teachings about the ancestral land you are standing on, the
    // biography people of the area, animal relatives who teach a word, and
    // nearby sites to visit. At a site (standing near it): what is unique to that
    // place. Burial grounds and sensitive places never become bubbles.
    const AR_GUIDES = [
      ["Black duck", "animal-american-black-duck.png"],
      ["Eel", "animal-american-eel.png"],
      ["Box turtle", "animal-eastern-box-turtle.png"],
      ["Deer", "animal-white-tailed-deer.png"],
      ["Turkey", "animal-wild-turkey.png"]
    ];
    const AR_ICON_BASE = ctx.iconBase || "https://nativelongisland.com/assets/map-icons/";
    const AR_PERSON_ICON = AR_ICON_BASE + "person-biography-marker.png";
    const AR_WORDS = 3;
    const AR_PEOPLE = 3;
    const AR_PEOPLE_KM = 20;
    // Around you, the ancestral land comes first: its own teachings (or, for a
    // land without them, its page's readings) and captioned photos, then the
    // Native place names nearby and the neighbouring homelands. Between mapped
    // lands, the nearest land within reach.
    const AR_LAND_READINGS = 4;
    const AR_LAND_PHOTOS = 2;
    const AR_PLACE_NAMES = 6;
    const AR_PLACE_NAME_KM = 8;
    const AR_NEIGHBOURS = 2;
    const AR_NEIGHBOUR_KM = 10;
    const AR_ISLAND_SLUG = "mattanwake-long-island";
    // Photo stories and plant IDs this close float where they were photographed.
    const AR_FIND_KM = 0.5;
    const AR_FINDS = 4;
    // Standing this close to a site (or inside its land) opens its own AR.
    const SITE_AR_KM = 0.5;

    // Short, complete teachings for the AR bubbles, written from each ancestral land's
    // reviewed page: three everyone sees first, then each territory's own. A bubble
    // shows the teaching; its source is small print at the bottom of the opened card.
    // Drafts and sources: research-workflow/ar-learnings-20261104/.
    const AR_LEARNINGS = {
      // Everyone sees these first, wherever they stand on Long Island.
      essentials: [
        {
          id: "homeland",
          title: "Whose homeland is this?",
          text: "Every town on Long Island sits within Native homelands. Colonial deeds and later development changed who held title and access to land; they did not end Native belonging.",
          source: "On This Site land history, ancestral land entries"
        },
        {
          id: "still-here",
          title: "Still here",
          text: "Native nations continue on Long Island today. The Shinnecock and Unkechaug nations keep their own governments and reservation communities, and Montaukett, Matinecock and Setalcott people carry their communities forward.",
          source: "Shinnecock Indian Nation; National Park Service; Montauk Tribe of Indians; Flushing Town Hall (2018); Three Village Historical Society and Setalcott Nation (2025)"
        },
        {
          id: "memory",
          title: "Honoring memory",
          text: "Acknowledging land means more than naming it: learn whose homeland you stand in, listen to Native leadership, and respect the places and knowledge communities choose to protect.",
          source: "On This Site land history, ancestral land entries"
        }
      ],
      lands: {
        "shinnecock-ancestral-land": [
          { id: "living-nation", title: "A living nation", text: "Shinnecock people have belonged to this Southampton homeland since time immemorial. Today the Shinnecock Indian Nation sustains self-government, family and cultural life, on and beyond the reservation.", source: "Shinnecock Indian Nation, official website" },
          { id: "wider-homeland", title: "More than the reservation", text: "The reservation is a living community within a wider homeland, not the beginning or the outer limit of Shinnecock history. Shinnecock Bay, the Hills and Canoe Place are all part of it.", source: "On This Site, Shinnecock Ancestral Land" },
          { id: "recognition", title: "2010 was not a beginning", text: "The Shinnecock Indian Nation became federally recognized in 2010. That date marks a United States legal decision, not the origin of a nation that has belonged here since time immemorial.", source: "Shinnecock Indian Nation, official website" },
          { id: "name", title: "What the name may mean", text: "Shinnecock has been read as “at the level land or country” and, more recently, as “at the big neck.” Both are attributed readings, not a settled translation.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911), pp. 81–82; Ives Goddard, “A Note on Shinnecock in Munsee” (2017)" },
          { id: "bluefish", title: "Knowledge of the bays", text: "A 2014 catalogue of Shinnecock elders’ knowledge follows bluefish from spring into late fall and describes the bays as their feeding and breeding waters.", source: "Shinnecock Environmental Department, Natural Resources Identified by Shinnecock Elders (2014), p. 2" },
          { id: "mussels", title: "Caring for the shore", text: "Elders distinguished gathering from caring: blue mussels were preferred for eating, while ribbed “bank” mussels were often left because they held the shore together.", source: "Shinnecock Environmental Department, Natural Resources Identified by Shinnecock Elders (2014), p. 4" },
          { id: "oysters", title: "Oysters and the hatchery", text: "Oysters fed people and their crushed shells were used in planting. The Shinnecock shellfish hatchery, established in 1980, continues the work of growing bivalves.", source: "Shinnecock Environmental Department, Natural Resources Identified by Shinnecock Elders (2014), p. 4" },
          { id: "wampum", title: "Wampum is not money", text: "White and purple wampum beads made from hard clams held meaning in relationships of exchange, unlike the monetary value imposed in colonial trade.", source: "Shinnecock Environmental Department, Natural Resources Identified by Shinnecock Elders (2014), pp. 6–7" },
          { id: "language", title: "Language returning", text: "Shinnecock people are renewing their Algonquian language alongside Unkechaug and Montaukett collaborators, through the Algonquian Language Revitalization Project.", source: "Stony Brook University Department of Linguistics, Algonquian Language Revitalization Project" },
          { id: "not-only-loss", title: "Loss is not the whole story", text: "Dispossession and development changed access to Shinnecock places. Acknowledging those losses should not reduce Shinnecock life to loss alone.", source: "On This Site, Shinnecock Ancestral Land" },
          { id: "respect", title: "Respect here", text: "Respect here includes listening to Shinnecock leadership and supporting the protection of ancestral land, waters and cultural places.", source: "On This Site, Shinnecock Ancestral Land" }
        ],
        "unkechaug-ancestral-land": [
          { id: "poospatuck", title: "A living South Shore nation", text: "Unkechaug people continue to live in their ancestral homeland at Poospatuck, where the creek leads toward the Forge River and Moriches Bay.", source: "National Park Service, Native American Heritage at Fire Island National Seashore" },
          { id: "government", title: "Still governing", text: "Despite colonial dispossession and continuing pressure on their land, the Unkechaug Indian Nation sustains its government, community and work to renew its language.", source: "National Park Service; Stony Brook University Department of Linguistics" },
          { id: "wider-homeland", title: "More than the reservation", text: "The small area kept as the Poospatuck reservation should not be mistaken for the full extent of Unkechaug belonging, which reaches across Mastic, Moriches and Brookhaven’s waters.", source: "John A. Strong, The Unkechaug Indians of Eastern Long Island: A History" },
          { id: "waters", title: "Waters and generations", text: "Generations of fishing, family life and care for the waters connect the Poospatuck community to a much wider South Shore homeland.", source: "National Park Service, Native American Heritage at Fire Island National Seashore" },
          { id: "language", title: "Language returning", text: "Unkechaug people take part in the Algonquian Language Revitalization Project with Shinnecock and Montaukett collaborators, connecting language, education and responsibility to future generations.", source: "Stony Brook University Department of Linguistics, Algonquian Language Revitalization Project" },
          { id: "tobacus", title: "Leaders in the records", text: "Seventeenth-century records name Unkechaug leaders such as Tobacus in land transactions and boundary descriptions.", source: "John A. Strong, The Unkechaug Indians of Eastern Long Island: A History" },
          { id: "own-voice", title: "A nation’s own voice", text: "Learning the names and history of this South Shore should lead to recognition of a living nation and its authority to speak for itself.", source: "On This Site, Unkechaug Ancestral Land" },
          { id: "respect", title: "Respect here", text: "Respect for Unkechaug land and waters includes respecting community decisions about access, cultural knowledge and the protection of ancestral places.", source: "On This Site, Unkechaug Ancestral Land" }
        ],
        "montaukett-ancestral-land": [
          { id: "homeland", title: "A living homeland", text: "Montauk is a living Montaukett homeland, with deep ancestral ties to its waters, Indian Fields and places beyond the East End.", source: "Montauk Tribe of Indians" },
          { id: "1910", title: "Declared extinct, still here", text: "In 1910 a New York court wrongly claimed the Montaukett Nation no longer existed, while Montaukett people were present and contesting the loss of their lands. The ruling did not end them.", source: "John A. Strong, The Montaukett Indians of Eastern Long Island" },
          { id: "recognition", title: "Recognition is not existence", text: "Legal acknowledgment and a people’s existence are different things. Montaukett families continue community and cultural work and the campaign to restore state recognition.", source: "Montauk Tribe of Indians; New York State Legislature" },
          { id: "brothertown", title: "Kin in Wisconsin", text: "Montaukett ancestors were among the founding peoples of the Brothertown Indian Nation, which continues today in Wisconsin.", source: "Brothertown Indian Nation" },
          { id: "indian-fields", title: "Families who remained", text: "Indian Fields, Freetown and Eastville connect the history of Montaukett land loss with the lives of families who remained on the East End.", source: "On This Site, Montaukett Ancestral Land" },
          { id: "name", title: "What the name may mean", text: "Montauk has been read as “the fort country,” and Dutch records wrote the homeland as Mirrachtauhacky. Colonial records kept many spellings, from Meantaucutt to Montaukett.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911); Documents Relative to the Colonial History of the State of New York, vol. XIV" },
          { id: "pharoah-1798", title: "Words kept in 1798", text: "In 1798, Sachem George Pharoah, then 66, shared Montaukett words with John Lyon Gardiner, who wrote them down. The vocabulary was later published for readers today.", source: "Gaynell Stone, ed., Languages and Lore of the Long Island Indians, vol. IV" },
          { id: "2024", title: "Honored today", text: "In November 2024, East Hampton Town honored Chief Robert Pharaoh and Sandi Brewster-Walker with a proclamation recognizing the Montaukett Indian Nation.", source: "Christopher Walsh, “Town Recognizes the Montaukett Indian Nation,” East Hampton Star, November 14, 2024" },
          { id: "respect", title: "Respect here", text: "Supporting Montaukett-led education and listening to descendant accounts connects a place name with a living people.", source: "On This Site, Montaukett Ancestral Land" }
        ],
        "corchaug-ancestral-land": [
          { id: "homeland", title: "A North Fork homeland", text: "Corchaug homelands on the North Fork hold generations of farming, fishing and wampum-making, remembered in names such as Cutchogue.", source: "John A. Strong, The Algonquian Peoples of Long Island from Earliest Times to 1700" },
          { id: "older-than-southold", title: "Older than Southold", text: "Cutchogue and the North Fork’s older place names carry a Native geography that predates Southold’s establishment in 1640.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "saugust", title: "Fields taken", text: "After English settlement, settlers took over cleared fields at Saugust, while deeds, fencing and livestock narrowed Native access to land and the shore.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "1763", title: "The 1763 petition", text: "Corchaug people kept asserting land rights long after colonial settlement began, including in a 1763 petition concerning Indian Neck and South Harbor.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "descendants", title: "No reservation, not no people", text: "The absence of a reservation bearing the Corchaug name should not be mistaken for proof that its people left no descendants.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "across-lines", title: "Relationships across lines", text: "Native families moved, married and found refuge across places later drawn as separate tribal territories; a colored map cannot hold all of those relationships.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "diplomacy", title: "Diplomacy and wampum", text: "Records involving Southold, Paucamp and Momoweta show Native diplomacy, trade and wampum across this coastal homeland.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "voices", title: "Voices left out", text: "Learning this history means attending both to the land that was taken and to the living Native communities whose voices colonial accounts often left out.", source: "On This Site, Corchaug Ancestral Land" }
        ],
        "manhansett-ancestral-land": [
          { id: "island", title: "Shelter Island’s Native name", text: "Shelter Island is Manhansett ancestral land, recorded as Manhansack-Ahaquatuwamock. Its waters connected Native communities long before a colonial plantation occupied the island.", source: "On This Site, Manhansett Ancestral Land" },
          { id: "name", title: "What the name may mean", text: "Manhansett is read as “island land” or “neighborhood”; an older reading as a river mouth is rejected.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "montauk", title: "Ties to Montauk", text: "Manhansett history includes documented political and cultural relationships with Montauk people.", source: "Fiske Center for Archaeological Research, University of Massachusetts Boston" },
          { id: "plantation", title: "A plantation on Native land", text: "Sylvester Manor’s own history acknowledges that its plantation was established on Manhansett ancestral land in 1651 and depended on an Atlantic economy of slavery and labor.", source: "Sylvester Manor" },
          { id: "wampum", title: "Native labor and wampum", text: "Researchers describe evidence of Native labor and wampum production at Sylvester Manor.", source: "Fiske Center for Archaeological Research, University of Massachusetts Boston" },
          { id: "inhabited", title: "Inhabited, not empty", text: "The plantation transformed an inhabited homeland; it did not replace an empty landscape.", source: "On This Site, Manhansett Ancestral Land" },
          { id: "respect", title: "Respect here", text: "Remembering Manhansett ancestry calls for respect for descendant knowledge and care for cultural places, with Native voices central to how this history is told.", source: "On This Site, Manhansett Ancestral Land" }
        ],
        "setauket-ancestral-land": [
          { id: "nation", title: "The Setalcott Nation", text: "Setauket carries a Native place name within the living homeland of the Setalcott Nation, whose history here reaches back thousands of years.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "christian-avenue", title: "Christian Avenue", text: "Setalcott ties continue through descendant families, including the Black and Indigenous community around Christian Avenue.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "last-member", title: "No “last member”", text: "The Setalcott Nation’s 2025 acknowledgment rejects the old habit of declaring a people gone when an outsider named a supposed last member.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "waters", title: "Caring for ancestral waters", text: "The Nation’s 2025 restoration grant links native planting and an oyster-hatchery study at Conscience Bay with planned kelp farming at Poquott.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "council", title: "Leading today", text: "Helen Sells and Robert “Silver Wolf” Thompson co-chair the council named in the 2025 statement, which also honors Gail “Chief Running Water” Revis and historian Theodore Green.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "name", title: "What the name may mean", text: "Setauket has been read as “land at the mouth of a river or creek,” an early twentieth-century interpretation rather than a final community translation.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "warawakmy", title: "Warawakmy", text: "The April 14, 1655 Setauket deed names Warawakmy as a Setauket sachem. Deeds like it leave out much of Native law, kinship and understanding of the land.", source: "Brookhaven Town Records" },
          { id: "respect", title: "Respect here", text: "Acknowledgment here means recognizing the continuing Setalcott community, listening to its members and supporting their role in caring for ancestral places.", source: "On This Site, Setauket Ancestral Land" }
        ],
        "nissaquogues": [
          { id: "river", title: "A river’s name", text: "The Nissequogue River preserves a Native name within an ancestral homeland shaped by generations of life along its waters.", source: "On This Site, Nissequogue Ancestral Land" },
          { id: "deeds", title: "What deeds leave out", text: "Colonial deeds and the growth of Smithtown narrowed Native control, but those papers did not record every family’s movements, relationships or belonging.", source: "On This Site, Nissequogue Ancestral Land" },
          { id: "neighbours", title: "Neighbors still here", text: "Matinecock and Setalcott communities remain present on this North Shore; their histories show family relationships reaching beyond the separate territories on a map.", source: "Flushing Town Hall (2018); Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "extinct", title: "A missing label is not extinction", text: "A missing tribal label in later records is not a sound basis for declaring a people extinct.", source: "On This Site, Nissequogue Ancestral Land" },
          { id: "between", title: "Between neighbors", text: "Earlier sources place Nissequogue lands between Matinecock lands to the west and Setauket lands to the east, along the river, shore and inland routes.", source: "On This Site, Nissequogue Ancestral Land" },
          { id: "respect", title: "Respect here", text: "Acknowledgment here leaves room for descendant knowledge and recognizes the obligations that come with living beside this ancestral river.", source: "On This Site, Nissequogue Ancestral Land" }
        ],
        "secatogue-ancestral-land": [
          { id: "bay", title: "A Great South Bay homeland", text: "Secatogue ancestry belongs to the creeks, meadows and shores of Great South Bay, where Native life long preceded colonial towns.", source: "National Park Service, Native American Heritage at Fire Island National Seashore" },
          { id: "visible", title: "Less visible, not vanished", text: "Land transactions changed how Secatogue people appeared in written records. A less visible name is not evidence that a people vanished.", source: "On This Site, Secatogue Ancestral Land" },
          { id: "name", title: "Land of the Secatogues", text: "Sichetanyhacky, a name in Dutch-period records, is interpreted as the country or land of the Secatogues.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911); Documents Relative to the Colonial History of the State of New York, vol. XIV" },
          { id: "fire-island", title: "Fire Island", text: "The National Park Service identifies Secatogue people among the ancestral communities of the Great South Bay and Fire Island region.", source: "National Park Service, Native American Heritage at Fire Island National Seashore" },
          { id: "living-coast", title: "A living coast", text: "The Unkechaug community at Poospatuck and the Shinnecock Nation make Native continuance visible on this coast; the story of a vanished Native South Shore does not hold.", source: "National Park Service; Shinnecock Indian Nation" },
          { id: "respect", title: "Respect here", text: "Honoring Secatogue ancestry includes protecting the bay and cultural places, and making room for family histories that deed archives may not preserve.", source: "On This Site, Secatogue Ancestral Land" }
        ],
        "massapequa-ancestral-lands": [
          { id: "homeland", title: "South Oyster Bay homeland", text: "Massapequa’s name connects today’s community to an older Native homeland around South Oyster Bay and Fort Neck.", source: "On This Site, Massapequa Ancestral Lands" },
          { id: "tackapousha", title: "Tackapousha", text: "Leaders such as Tackapousha defended Native interests as colonial settlement pressed into fields, meadows and waterways.", source: "John A. Strong, The Algonquian Peoples of Long Island from Earliest Times to 1700" },
          { id: "negotiating", title: "Negotiating, not surrendering", text: "Treaties and disputes name leaders across Massapequa, Rockaway and Secatogue: people negotiating and resisting under pressure, not simply leaving history.", source: "On This Site, Massapequa Ancestral Lands" },
          { id: "name", title: "What the name may mean", text: "Massapeague is interpreted as “great water land” or “land on the great cove.”", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "1639", title: "Names in the records", text: "The 1639 Marossepinck deed preserves Native names such as Mechowodt and Piscamoc, and the 1656 treaty names Tackapousha with allied western Long Island signers.", source: "Documents Relative to the Colonial History of the State of New York, vol. XIV; John A. Strong" },
          { id: "villages", title: "Villages, not townships", text: "The popular list of Long Island’s “thirteen tribes” makes Native life look like fixed townships; it was organized through villages, kinship, diplomacy, seasonal movement and shared land and water.", source: "John A. Strong, The Thirteen Tribes of Long Island: The History of a Myth" },
          { id: "respect", title: "Respect here", text: "Acknowledgment here means caring for ancestral places and respecting descendants’ authority to explain their own family connections.", source: "On This Site, Massapequa Ancestral Lands" }
        ],
        "matinecock-traditional-land": [
          { id: "homeland", title: "A North Shore homeland", text: "Matinecock ancestral land reaches across the North Shore from Queens into Long Island, and its people remain present through descendant families and cultural work.", source: "Flushing Town Hall (2018)" },
          { id: "name", title: "What the name may mean", text: "Matinecock is interpreted as “at the place of observation,” “at the place to look around from,” or “at the hilly land.”", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "1931", title: "Ancestors disturbed", text: "In 1931 a Matinecock burial ground was removed for the widening of Northern Boulevard, despite descendant opposition.", source: "Queens Public Library, via Urban Archive" },
          { id: "kin", title: "Kin across nations", text: "Family historian Donna Gentle Spirit Barron and the Ceaser family make Matinecock and Montaukett kinship visible: specific family relationships, not interchangeable identities.", source: "Flushing Town Hall (2018)" },
          { id: "2018", title: "Sharing their own history", text: "Matinecock descendants publicly shared their history and cultural protocols at Flushing Town Hall’s 2018 gathering.", source: "Flushing Town Hall (2018)" },
          { id: "no-reservation", title: "No reservation, still a people", text: "Recognition by outsiders, ownership in deeds and Native belonging are different matters; a missing reservation does not mean a missing people.", source: "On This Site, Matinecock Traditional Land" },
          { id: "places", title: "Places of the homeland", text: "Matinecock history is documented around Oyster Bay, Glen Cove, Cold Spring Harbor, Huntington and neighboring North Shore communities.", source: "On This Site, Matinecock Traditional Land" }
        ],
        "merrick-ancestral-land": [
          { id: "homeland", title: "The Merikoke homeland", text: "Merrick’s name recalls the Merikoke homeland of plains, creeks and South Shore waters.", source: "On This Site, Merrick Ancestral Land" },
          { id: "name", title: "What the name may mean", text: "Merrick is connected with an Algonquian meaning of bare land or plain, fitting the Hempstead Plains, a large open grassland.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "1675", title: "“Not paid for”", text: "In 1675, Tackapousha publicly challenged Hempstead’s use of Mercock land, stating that it had not been paid for.", source: "John A. Strong, The Algonquian Peoples of Long Island from Earliest Times to 1700" },
          { id: "contested", title: "Deeds were contested", text: "Early land papers here record diplomacy, translation, boundary disputes and Native legal resistance, not simple sales.", source: "On This Site, Merrick Ancestral Land" },
          { id: "2023", title: "On the water today", text: "A 2023 Native canoe gathering at Jones Beach connects this South Shore with Native people who continue to gather and assert belonging here.", source: "The Long Island Advocate (2023)" },
          { id: "learning", title: "Places to keep learning", text: "The Lister Park Greenway marker introduces Native histories of the Mill River, and Hempstead Plains Preserve connects prairie conservation with the history of the commons.", source: "On This Site, Merrick Ancestral Land" },
          { id: "sign", title: "A missing sign", text: "The missing Meroke village sign shows how fragile public acknowledgment can be.", source: "On This Site, Merrick Ancestral Land" }
        ],
        "rockaway-traditional-land": [
          { id: "lenape", title: "A Lenape homeland", text: "Rockaway preserves a Native name on the shores of a much older Lenape homeland, where bays, islands and waterways connected people.", source: "National Park Service" },
          { id: "continue", title: "Lenape life continues", text: "Displacement did not end Lenape life: communities continue in the homeland and in nations beyond New York.", source: "Lenape Center" },
          { id: "relationship", title: "Displaced, still related", text: "Displacement can separate a community from land without ending its relationship to that land.", source: "Lenape Center; On This Site, Rockaway Traditional Land" },
          { id: "1655", title: "Names in the 1655 deed", text: "The 1655 Rockaway Neck deed names Ruckquaheag, Ronnessoke and Adam, also called Achitteronose, among others.", source: "Documents Relative to the Colonial History of the State of New York, vol. XIV; John A. Strong" },
          { id: "1657", title: "The 1657 conference", text: "At a 1657 Hempstead conference, Mangwobe of Rockaway met with Tackapousha, Wyandanch, Cockenoe and Merrick representatives.", source: "Documents Relative to the Colonial History of the State of New York, vol. XIV" },
          { id: "respect", title: "Respect here", text: "Acknowledgment here makes room for living Lenape voices and the responsibilities carried by a name that survived the growth of the city.", source: "On This Site, Rockaway Traditional Land" }
        ],
        "canarsie-traditional-land": [
          { id: "homeland", title: "Brooklyn’s Native homeland", text: "Canarsie carries the name of a Native community whose homeland included parts of present-day Brooklyn and Jamaica Bay.", source: "National Park Service" },
          { id: "shores", title: "Caring for these shores", text: "Generations lived from and cared for these shores before Dutch and English settlement brought dispossession.", source: "On This Site, Canarsie Traditional Land" },
          { id: "city", title: "Land that became the city", text: "Colonial grants, petitions and patents record a struggle over inhabited land; reading them only as property transfers hides the communities whose land became the city.", source: "On This Site, Canarsie Traditional Land" },
          { id: "lenape-center", title: "Speaking for themselves", text: "Today Lenape people speak for their own history through institutions such as Lenape Center, connecting present-day nations with New York through art, education, language and public history.", source: "Lenape Center" },
          { id: "not-gone", title: "Not a disappearance", text: "Later histories sometimes turned Canarsie into folklore or a disappearance story. Displacement and changed community names do not amount to disappearance.", source: "On This Site, Canarsie Traditional Land" }
        ]
      }
    };

    function arDistanceKm(a, b) {
      const rad = Math.PI / 180;
      const dLat = (b.lat - a.lat) * rad;
      const dLng = (b.lng - a.lng) * rad;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
      return 12742 * Math.asin(Math.sqrt(h));
    }

    // Compass bearing (degrees from true north) from a to b.
    function arBearingDeg(a, b) {
      const rad = Math.PI / 180;
      const y = Math.sin((b.lng - a.lng) * rad) * Math.cos(b.lat * rad);
      const x = Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos((b.lng - a.lng) * rad);
      return (Math.atan2(y, x) / rad + 360) % 360;
    }

    // Points a bubble toward a real place, so the app floats it that way.
    // Not when the visitor is already there (the direction means nothing).
    function arToward(item, here, target) {
      if (!here || !target || !Number.isFinite(target.lat) || !Number.isFinite(target.lng)) return item;
      const metres = arDistanceKm(here, target) * 1000;
      return metres < 40 ? item : { ...item, bearing_deg: Math.round(arBearingDeg(here, target) * 10) / 10, distance_m: Math.round(metres) };
    }

    // A find's GPS point (where its photo was taken), so the app floats it at
    // that spot instead of anywhere. Older apps use the direction alone.
    function arAtSpot(item, here, lat, lng) {
      const spot = { lat: Number(lat), lng: Number(lng) };
      if (lat == null || lng == null || !Number.isFinite(spot.lat) || !Number.isFinite(spot.lng)) return item;
      const placed = { ...item, spot };
      return here ? { ...placed, bearing_deg: Math.round(arBearingDeg(here, spot) * 10) / 10, distance_m: Math.round(arDistanceKm(here, spot) * 1000) } : placed;
    }

    function arStoryItem(story, here) {
      return arAtSpot({
        id: `story-${story.id}`, layer: "family", kind: "photo", placement: "discover",
        title: story.author_name ? `Shared by ${arText(story.author_name)}` : "A photo story",
        caption: arText(story.caption), credit: story.created_at ? new Date(story.created_at).toLocaleDateString() : "",
        image: arAsset(story.photo)
      }, here, story.latitude, story.longitude);
    }

    function arPlantItem(plant, here) {
      return arAtSpot({
        id: `plant-${plant.id}`, layer: "archival", kind: "note", placement: "discover",
        title: arText(plant.common_name || "A plant found here"),
        // Placeholder guidance ("Connect this observation…") isn't knowledge; leave it out.
        caption: [plant.scientific_name, plant.algonquian_word ? `Algonquian: ${plant.algonquian_word}` : "",
          /^connect this observation/i.test(plant.indigenous_context || "") ? "" : plant.indigenous_context]
          .map(part => arText(part).replace(/\.$/, "")).filter(Boolean).join(". "),
        credit: plant.author_name ? `Found by ${arText(plant.author_name)}` : "Community plant find",
        image: arAsset(plant.photo)
      }, here, plant.observation_latitude, plant.observation_longitude);
    }

    const arShared = record => !/rejected|deleted/i.test(record.status || "");

    // Photo stories and plant IDs, a plant posted with a photo story shown
    // once (as the story).
    function arFinds(stories, plants, here) {
      const storyPlants = new Set(stories.map(story => String(story.plant_observation?.id ?? story.plant_observation ?? "")));
      return [...stories.map(story => arStoryItem(story, here)),
        ...plants.filter(plant => !storyPlants.has(String(plant.id))).map(plant => arPlantItem(plant, here))];
    }

    function arShuffled(list, random = Math.random) {
      const copy = list.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    // Plain text for the AR cards (summaries are stored with HTML entities).
    function arText(value) {
      const entities = { amp: "&", quot: "\"", "#39": "'", apos: "'", lt: "<", gt: ">", nbsp: " " };
      return String(value || "").replace(/<[^>]*>/g, " ").replace(/&(amp|quot|#39|apos|lt|gt|nbsp);/g, (match, name) => entities[name])
        .replace(/\s+/g, " ").trim();
    }

    function arInsideRing(point, ring) {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if ((yi > point.lat) !== (yj > point.lat) && point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }

    function arInsideGeometry(point, geometry) {
      if (!Array.isArray(geometry?.coordinates)) return false;
      const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
      return polygons.some(polygon => arInsideRing(point, polygon[0] || []) && !polygon.slice(1).some(hole => arInsideRing(point, hole)));
    }

    // A rough middle of a point or polygon, for distances.
    function arGeometryCentre(geometry) {
      if (geometry?.type === "Point") return { lng: Number(geometry.coordinates[0]), lat: Number(geometry.coordinates[1]) };
      const points = JSON.stringify(geometry?.coordinates || []).match(/-?\d+(\.\d+)?,-?\d+(\.\d+)?/g) || [];
      if (!points.length) return null;
      const pairs = points.map(pair => pair.split(",").map(Number));
      const xs = pairs.map(pair => pair[0]);
      const ys = pairs.map(pair => pair[1]);
      return { lng: (Math.min(...xs) + Math.max(...xs)) / 2, lat: (Math.min(...ys) + Math.max(...ys)) / 2 };
    }

    // Land-history entries describe a site; the shape is the site's own.
    function arEntryGeometry(entry) {
      const site = (state.sites || []).find(item => Number(item.id) === Number(entry.siteId) || item.slug === entry.slug);
      const shape = site?.displayGeometry || site?.geojson || null;
      if (typeof shape !== "string") return shape;
      try {
        return JSON.parse(shape);
      } catch {
        return null;
      }
    }

    function arLandEntries() {
      return (window.NLI_LAND_HISTORY_DATA?.entries || []).filter(entry => entry.reviewStatus !== "draft");
    }

    function arSource(entry) {
      return (entry.sources || []).map(source => source.citation).filter(Boolean)[0] || "On This Site land history";
    }

    // Clips about one land-history entry: its story, its history, and how
    // to visit respectfully.
    function arLandClips(entry, prefix = "") {
      const credit = arSource(entry);
      const respect = entry.sensitivity ? ` ${arText(entry.sensitivity)}` : "";
      const clips = [{
        id: `${prefix}land-${entry.slug}`, layer: "archival", kind: "note", placement: "discover",
        title: arText(entry.title), caption: `${entry.dateLabel ? `${arText(entry.dateLabel)}. ` : ""}${arText(entry.description)}${respect}`, credit
      }];
      if (entry.historicalContext) clips.push({
        id: `${prefix}land-context-${entry.slug}`, layer: "archival", kind: "note", placement: "discover",
        title: `${arText(entry.title)}: the history`, caption: arText(entry.historicalContext), credit
      });
      if (arText(entry.community).length >= 60) clips.push({
        id: `${prefix}land-community-${entry.slug}`, layer: "archival", kind: "note", placement: "discover",
        title: `${arText(entry.title)}: the people`, caption: arText(entry.community), credit
      });
      return clips;
    }

    // Biography people with a documented place within reach, at their nearest place.
    function arPeople(point, withinKm, limit, here = point) {
      const people = window.NLI_BIOGRAPHY_PATH_DATA || {};
      return Object.entries(people)
        .map(([slug, person]) => {
          const near = (person.places || [])
            .filter(place => Array.isArray(place.coordinates))
            .map(place => ({ place, km: arDistanceKm(point, { lng: Number(place.coordinates[0]), lat: Number(place.coordinates[1]) }) }))
            .sort((a, b) => a.km - b.km)[0];
          return near && near.km <= withinKm ? { slug, person, ...near } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.km - b.km)
        .slice(0, limit)
        .map(({ slug, person, place }) => {
          const intro = arText((state.wikiArticles || []).find(article => article.slug === slug)?.summary);
          const name = arText(person.mapLabel || person.title);
          return arToward({
            id: `person-${slug}`, layer: "archival", kind: "note", placement: "discover",
            title: `Meet ${name}`,
            caption: `${intro ? `${intro}\n\n` : ""}Near here${place.dateLabel ? `, ${arText(place.dateLabel)}` : ""} (${arText(place.place)}): ${arText(place.eventTitle)}. ${arText(place.reason)}`,
            credit: `From the On This Site biography "${arText(person.title)}"`,
            figure: AR_PERSON_ICON
          }, here, { lng: Number(place.coordinates[0]), lat: Number(place.coordinates[1]) });
        });
    }

    function arWords(count, random) {
      const words = window.NLI_LANGUAGE_QUIZ_WORDS || [];
      // Greetings first: they are what a guide says on meeting you.
      const greetings = words.filter(word => /greeting|thank you/.test(word.english));
      const picked = [...arShuffled(greetings, random), ...arShuffled(words.filter(word => !greetings.includes(word)), random)].slice(0, count);
      const first = Math.floor(random() * AR_GUIDES.length);
      return picked.map((word, index) => {
        const [name, icon] = AR_GUIDES[(first + index) % AR_GUIDES.length];
        const others = arShuffled(words.filter(other => other.english !== word.english), random).slice(0, 2).map(other => other.english);
        return {
          id: `word-${word.id}`, layer: "language", kind: "phrase", placement: "discover",
          title: name, word: word.algonquian, meaning: word.english,
          choices: arShuffled([word.english, ...others], random),
          credit: word.source, figure: AR_ICON_BASE + icon
        };
      });
    }

    // A site page's article sections, read for AR in this order.
    const AR_SECTIONS = [
      ["introduction_content", "Welcome"],
      ["history_content", "History"],
      ["oral_history_content", "Oral history"],
      ["translation_content", "What the name means"],
      ["legends_and_lore_content", "Legends and lore"],
      ["artifacts_content", "Artifacts"],
      ["colonial_description_content", "In colonial records"],
      ["land_loss_content", "How the land was lost"],
      ["preservation_content", "Caring for this place"]
    ];
    const AR_SITE_FIELDS = ["title", "slug", "summary", "why_this_matters", "listing_image_url", "listing_image_alt", ...AR_SECTIONS.map(([field]) => field)].join(",");
    const AR_PHOTOS = 6;
    const AR_READINGS = 4;
    // Nearby sites float up as signs in the sky, each in its real direction (sky: true),
    // last of all: the reason to go and visit. Within 5 km, or up to 15 km to find five.
    const AR_NEARBY_PLACES = 8;
    const AR_NEARBY_KM = 5;
    const AR_NEARBY_MIN = 5;
    const AR_NEARBY_FAR_KM = 15;
    // At most this many bubbles in all; what is around you gives way first.
    const AR_MAX_ITEMS = 40;
    // The "You are here" marker lists this many of them.
    const AR_HERE_NEARBY = 3;
    // Other land history (a reservation, a park…) only when you are inside it, or this
    // close to a point.
    const AR_INSIDE_POINT_KM = 0.3;

    function arKm(km) {
      return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
    }

    // One short line for a sky sign: the summary's first sentence, at most ~90 characters.
    function arBrief(value) {
      const text = arText(value);
      const sentence = (text.match(/^.*?[.!?](?=\s|$)/) || [text])[0];
      if (sentence.length <= 90) return sentence;
      const cut = sentence.lastIndexOf(" ", 88);
      return `${sentence.slice(0, cut > 40 ? cut : 88)}…`;
    }

    // Photos and their captions in an article section's HTML.
    // Each photo also carries the article text around it (the paragraph
    // after it, else the one before), so a card explains what you see.
    function arPhotos(html, section) {
      const parts = String(html || "").split(/(<figure[\s\S]*?<\/figure>|<img[^>]*>)/i);
      const photos = [];
      for (let i = 1; i < parts.length; i += 2) {
        const block = parts[i];
        const src = (block.match(/<img[^>]*?\ssrc="(https:[^"]+)"/i) || [])[1] || "";
        if (!src) continue;
        const caption = arText((block.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i) || [])[1] || (block.match(/\salt="([^"]*)"/i) || [])[1] || "");
        // The paragraph right after the photo, unless it is a source note.
        const after = arReading(parts[i + 1], 700).split("\n\n").filter(text => text.length >= 60 && !/\baccessed\b|\bretrieved\b/i.test(text));
        // An alt text without spaces is a file name, not a caption.
        photos.push({ src, caption: /\s/.test(caption) ? caption : "", context: after[0] || "", section });
      }
      return photos;
    }

    // A short title from a caption: its first sentence or clause (not cut at
    // "no." or an initial), without parentheses, trimmed.
    function arCaptionTitle(caption) {
      const first = caption.replace(/\s*\([^)]*\)/g, "").split(/[;:]\s|(?<=[a-z0-9]{3}\.)\s(?=[A-Z])|\s(?=From\s)/)[0].replace(/\.$/, "");
      return first.length <= 70 ? first : `${first.slice(0, first.lastIndexOf(" ", 66))} …`;
    }

    // Photos grouped in a gallery have no paragraph beside them; find the
    // page's paragraph about what the photo shows instead (it has to share
    // at least two distinctive words with the caption).
    const AR_COMMON_WORDS = new Set("shinnecock reservation nation indian indians photo image courtesy from with that this their there were which when where what original history article page".split(" "));
    function arRelatedPassage(caption, paragraphs) {
      const words = [...new Set((caption.toLowerCase().match(/[a-z]{4,}/g) || []).filter(word => !AR_COMMON_WORDS.has(word)))];
      let best = null;
      let bestScore = 1;
      paragraphs.forEach(paragraph => {
        const text = paragraph.toLowerCase();
        const score = words.filter(word => text.includes(word)).length;
        if (score > bestScore) {
          best = paragraph;
          bestScore = score;
        }
      });
      return best || "";
    }

    // A section's text without its photos and captions, keeping its
    // paragraphs and subheadings apart, ending on a sentence.
    function arReading(html, limit = 1400) {
      const marked = String(html || "").replace(/<figure[\s\S]*?<\/figure>/gi, " ")
        .replace(/<\/(p|h[1-6]|li|blockquote)>|<br\s*\/?>/gi, " ¶ ");
      const text = arText(marked).split(/\s*¶\s*/).filter(Boolean).join("\n\n");
      if (text.length <= limit) return text;
      const cut = text.slice(0, limit);
      return `${cut.slice(0, Math.max(cut.lastIndexOf(". ") + 1, limit * 0.6))} …`;
    }

    // The full page of a site (its article sections), fetched when AR opens.
    async function arSiteDetail(slug) {
      try {
        const response = await fetch(`${DIRECTUS}/items/sites?limit=1&filter[publication_status][_eq]=published&filter[slug][_eq]=${encodeURIComponent(slug)}&fields=${AR_SITE_FIELDS}`,
          { signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined });
        return response.ok ? (await response.json()).data?.[0] || null : null;
      } catch {
        return null;
      }
    }

    function arSiteImage(siteId) {
      const site = (state.sites || []).find(item => Number(item.id) === Number(siteId));
      return site?.listing_image_url || site?.listing_image_thumb_url || "";
    }

    function arScene(title, items, random, here = null, ordered = false) {
      return { schema: 1, site_id: "nearby", title, here: here ? { lat: here.lat, lng: here.lng } : undefined, items: ordered ? items : arShuffled(items, random) };
    }

    // The app shows bubbles in list order: the land's own stories first, with
    // one of everything else after every two of them.
    function arInterleave(first, rest, every = 2) {
      const out = [];
      let next = 0;
      first.forEach((item, index) => {
        out.push(item);
        if ((index + 1) % every === 0 && next < rest.length) out.push(rest[next++]);
      });
      return out.concat(rest.slice(next));
    }

    // The point of a shape nearest to you, and how far away it is.
    function arNearestPoint(here, geometry) {
      const pairs = JSON.stringify(geometry?.coordinates || []).match(/-?\d+(\.\d+)?,-?\d+(\.\d+)?/g) || [];
      let best = null;
      pairs.forEach(pair => {
        const [lng, lat] = pair.split(",").map(Number);
        const km = arDistanceKm(here, { lng, lat });
        if (!best || km < best.km) best = { lng, lat, km };
      });
      return best;
    }

    // The ancestral land you are on; between mapped lands, the nearest one
    // within reach (with how far it is).
    function arHomelands(here, entries) {
      const lands = entries.filter(entry => entry.isAncestralLand);
      const inside = lands.filter(entry => arInsideGeometry(here, arEntryGeometry(entry)));
      if (inside.length) return inside.map(entry => ({ entry, near: null }));
      const nearest = lands.map(entry => ({ entry, near: arNearestPoint(here, arEntryGeometry(entry)) }))
        .filter(item => item.near && item.near.km <= AR_NEIGHBOUR_KM)
        .sort((a, b) => a.near.km - b.near.km)[0];
      return nearest ? [nearest] : [];
    }

    // An ancestral land's own page, read for AR: its sections (unless the land has
    // its own teachings) and captioned photos.
    function arLandPageItems(entry, page, readings = true) {
      if (!page) return [];
      const title = arText(entry.title);
      const items = !readings ? [] : AR_SECTIONS
        // The land's own history card already tells its history.
        .filter(([field]) => !(field === "history_content" && entry.historicalContext))
        .map(([field, label]) => ({ label, text: arReading(page[field]) }))
        .filter(reading => reading.text.length >= 120)
        .slice(0, AR_LAND_READINGS)
        .map(reading => ({
          id: `land-reading-${entry.slug}-${reading.label.toLowerCase().replace(/[^a-z]+/g, "-")}`, layer: "archival", kind: "note", placement: "discover",
          title: `${title}: ${reading.label}`, caption: reading.text, credit: `From the On This Site page on ${title}`
        }));
      AR_SECTIONS.flatMap(([field, label]) => arPhotos(page[field], label))
        .filter(photo => photo.caption)
        .slice(0, AR_LAND_PHOTOS)
        .forEach((photo, index) => items.push({
          id: `land-photo-${entry.slug}-${index}`, layer: "archival", kind: "note", placement: "discover",
          title: arCaptionTitle(photo.caption), caption: [photo.caption, photo.context].filter(Boolean).join("\n\n"),
          credit: `From "${photo.section}" on the On This Site page for ${title}`, image: photo.src
        }));
      return items;
    }

    // Native place names around you, each pointing its way. They are the
    // land's own names, so they need no visit to a site. A summary that is
    // about a reference (Tooker's records) rather than the place is left out,
    // as are sentences about where the map marker sits.
    function arPlaceNames(here, skip) {
      return (state.sites || [])
        .filter(site => site.site_type === "placename" && site.slug !== AR_ISLAND_SLUG && !skip.has(site.slug)
          && Array.isArray(site.center) && site.summary && !/tooker/i.test(site.summary) && !arSensitiveSite(site))
        .map(site => ({ site, centre: { lng: Number(site.center[0]), lat: Number(site.center[1]) },
          caption: arText(site.summary).split(/(?<=[.!?])\s+/).filter(sentence => !/\bmap (point|marker)|\bmarker\b|\bgeneral location\b/i.test(sentence)).join(" ") }))
        .map(item => ({ ...item, km: arDistanceKm(here, item.centre) }))
        .filter(item => item.km <= AR_PLACE_NAME_KM && item.caption.length >= 40)
        .sort((a, b) => a.km - b.km)
        .slice(0, AR_PLACE_NAMES)
        .map(({ site, centre, caption }) => arToward({
          id: `placename-${site.slug}`, layer: "archival", kind: "note", placement: "discover",
          title: `Native place name: ${arText(site.title)}`, caption,
          credit: "On This Site", image: site.listing_image_url || site.listing_image_thumb_url || undefined
        }, here, centre));
    }

    // A teaching as a bubble; its source is small print in the opened card.
    function arLearning(learning, slug, title = learning.title) {
      return {
        id: `learn-${slug}-${learning.id}`, layer: "archival", kind: "note", placement: "discover",
        title, caption: learning.text, credit: learning.source
      };
    }

    // The homelands beside the one you are on, pointing toward their nearest edge,
    // each with its first two teachings.
    function arNeighbours(here, homelands, entries) {
      const own = new Set(homelands.map(({ entry }) => entry.slug));
      return entries
        .filter(entry => entry.isAncestralLand && !own.has(entry.slug))
        .map(entry => ({ entry, near: arNearestPoint(here, arEntryGeometry(entry)) }))
        .filter(item => item.near && item.near.km <= AR_NEIGHBOUR_KM)
        .sort((a, b) => a.near.km - b.near.km)
        .slice(0, AR_NEIGHBOURS)
        .flatMap(({ entry, near }) => {
          const title = arText(entry.title);
          const image = arSiteImage(entry.siteId) || undefined;
          const learnings = (AR_LEARNINGS.lands[entry.slug] || []).slice(0, 2);
          const items = learnings.length
            ? learnings.map((learning, index) => arLearning(learning, `neighbour-${entry.slug}`, index ? `${title}: ${learning.title}` : `Neighbouring homeland: ${title}`))
            : [{ ...arLandClips(entry, "neighbour-")[0], title: `Neighbouring homeland: ${title}` }];
          return items.map(item => arToward({ ...item, image }, here, near));
        });
    }

    // Other land history (a reservation, a preserve, a court case's place) only
    // where you stand: inside its shape, or right beside its point.
    function arLandHere(here, entries) {
      return entries
        .filter(entry => !entry.isAncestralLand)
        .map(entry => ({ entry, geometry: arEntryGeometry(entry) }))
        .filter(({ geometry }) => geometry?.type === "Point"
          ? arDistanceKm(here, arGeometryCentre(geometry)) <= AR_INSIDE_POINT_KM
          : arInsideGeometry(here, geometry))
        .slice(0, 3)
        .map(({ entry }) => {
          const [clip] = arLandClips(entry);
          const respect = entry.sensitivity ? ` ${arText(entry.sensitivity)}` : "";
          return { ...clip, caption: `${arText(entry.description)}${respect}`, image: arSiteImage(entry.siteId) || undefined };
        });
    }

    // Nearby sites with a photo and a summary, nearest first: within 5 km, or
    // as far as 15 km to find five.
    function arNearbySites(here, skipSites) {
      const all = (state.sites || [])
        .filter(site => Array.isArray(site.center) && site.summary && (site.listing_image_url || site.listing_image_thumb_url) && !arSensitiveSite(site)
          && !skipSites.has(Number(site.id)))
        .map(site => ({ site, km: arDistanceKm(here, { lng: Number(site.center[0]), lat: Number(site.center[1]) }) }))
        .filter(item => item.km <= AR_NEARBY_FAR_KM)
        .sort((a, b) => a.km - b.km);
      const close = all.filter(item => item.km <= AR_NEARBY_KM);
      return (close.length >= AR_NEARBY_MIN ? close : all.slice(0, AR_NEARBY_MIN)).slice(0, AR_NEARBY_PLACES);
    }

    // Anywhere, in this order: the "You are here" pin with the ancestral land you
    // are on (or the nearest one); three teachings for everyone; that land's own
    // teachings and photos; then what is around you (Native place names,
    // neighbouring homelands, land history where you stand, people, finds and
    // words); and last, the nearby sites as signs in the sky, the reason to go and
    // visit. The app shows bubbles in list order; sky_after tells it how many to
    // open before the signs rise. landPages: the land pages, fetched by openRegionAr.
    function regionArScene(here, random = Math.random, landPages = {}) {
      const entries = arLandEntries();
      const essentials = AR_LEARNINGS.essentials.map(learning => arLearning(learning, "all"));
      if (!here) {
        // Without a location: the essentials, then a few ancestral lands to learn about.
        const lands = arShuffled(entries.filter(entry => entry.isAncestralLand && AR_LEARNINGS.lands[entry.slug]), random).slice(0, 3);
        const learned = lands.flatMap(entry => AR_LEARNINGS.lands[entry.slug].slice(0, 2)
          .map(learning => arLearning(learning, entry.slug, `${arText(entry.title)}: ${learning.title}`)));
        return arScene("Around you", [...essentials, ...learned, ...arWords(AR_WORDS, random)], random, null, true);
      }
      const homelands = arHomelands(here, entries);
      const own = [];
      const around = [];
      homelands.forEach(({ entry, near }, index) => {
        const learnings = AR_LEARNINGS.lands[entry.slug] || [];
        const page = landPages[entry.slug];
        if (!learnings.length) {
          // A land without its own teachings yet: its land-history cards and page.
          const [welcome, ...more] = arLandClips(entry);
          (index === 0 ? own : around).push(...(index === 0 ? [] : [{ ...welcome, image: arSiteImage(entry.siteId) || undefined }]), ...more, ...arLandPageItems(entry, page));
          return;
        }
        const photos = arLandPageItems(entry, page, false);
        // The land you are on is told in full; a second, overlapping land by its first three.
        if (index === 0) own.push(...arInterleave(learnings.map(learning => arLearning(learning, entry.slug)), photos, 3));
        else around.push(...learnings.slice(0, 3).map(learning => arLearning(learning, entry.slug, `${arText(entry.title)}: ${learning.title}`)));
      });
      const homelandSites = new Set(homelands.map(({ entry }) => Number(entry.siteId)));
      const nearby = arNearbySites(here, homelandSites);
      const island = (state.sites || []).find(site => site.slug === AR_ISLAND_SLUG && site.summary);
      around.push(...arLandHere(here, entries), ...arPlaceNames(here, new Set(nearby.map(({ site }) => site.slug))), ...arNeighbours(here, homelands, entries));
      if (island) around.push({
        id: `island-${island.slug}`, layer: "archival", kind: "note", placement: "discover",
        title: `${arText(island.title)}: a name for this island`, caption: arText(island.summary), credit: "On This Site"
      });
      // Photo stories and plant IDs found close by, at their spots.
      const close = (lat, lng) => lat != null && lng != null && arDistanceKm(here, { lat: Number(lat), lng: Number(lng) }) <= AR_FIND_KM;
      const others = [
        ...arPeople(here, AR_PEOPLE_KM, AR_PEOPLE),
        ...arFinds(
          (state.mapStories || []).filter(story => story.photo && arShared(story) && close(story.latitude, story.longitude)),
          (state.plantObservations || []).filter(plant => arShared(plant) && close(plant.observation_latitude, plant.observation_longitude)),
          here
        ).sort((a, b) => a.distance_m - b.distance_m).slice(0, AR_FINDS),
        ...arWords(AR_WORDS, random)
      ];
      // Signs in the sky, each in its site's real direction: name, distance and one line
      // (sky, brief); opening one reads the full summary. Older apps show bubbles.
      const signs = nearby.map(({ site, km }) => arToward({
        id: `place-${site.slug}`, layer: "archival", kind: "note", placement: "discover",
        title: `Nearby: ${arText(site.title)}`,
        caption: `${arText(site.summary)}\n\n${arKm(km)} from you, in the direction of this sign.`,
        credit: "On This Site", image: site.listing_image_url || site.listing_image_thumb_url,
        sky: true, name: arText(site.title), brief: arBrief(site.summary)
      }, here, { lng: Number(site.center[0]), lat: Number(site.center[1]) }));
      // First of all: a red arrow down at your spot, saying whose land it is and what is near.
      const first = homelands[0];
      const nearest = nearby.slice(0, AR_HERE_NEARBY).map(({ site, km }) => `${arText(site.title)} · ${arKm(km)}`);
      const landTitle = first ? arText(first.entry.title) : "";
      const landLine = !first ? "Long Island (Paumanok)"
        : first.near ? `Near ${landTitle} · ${arKm(first.near.km)}` : `On ${landTitle}`;
      const hereItem = {
        id: "here", layer: "archival", kind: "here", placement: "discover",
        title: "You are here", land: landLine, nearby: nearest,
        caption: [first ? `${landLine}. ${arText(first.entry.description)}` : `${landLine}.`,
          nearest.length ? `Nearby:\n${nearest.join("\n")}` : ""].filter(Boolean).join("\n\n"),
        credit: first ? `On This Site, ${landTitle}` : "On This Site",
        image: first ? arSiteImage(first.entry.siteId) || undefined : undefined
      };
      const ordered = [...essentials, ...own, ...arInterleave(arShuffled(around, random), arShuffled(others, random))]
        .slice(0, AR_MAX_ITEMS - 1 - signs.length);
      const scene = arScene("Around you", [hereItem, ...ordered, ...signs], random, here, true);
      // The signs rise once this many bubbles (those that float up anywhere) are open.
      scene.sky_after = ordered.filter(item => !Number.isFinite(item.bearing_deg) && !item.spot).length;
      return scene;
    }

    function arAsset(id) {
      return id ? `${DIRECTUS}/assets/${encodeURIComponent(id)}?width=1200&quality=80` : "";
    }

    // At a site: its story and photo, its land history, the people tied to
    // it, and what the community has shared there (photo stories, plant
    // finds, notes).
    function siteArScene(site, detail = null, random = Math.random) {
      const page = { ...site, ...(detail || {}) };
      const slug = site.slug;
      const title = arText(page.title);
      const centre = Array.isArray(site.center) ? { lng: Number(site.center[0]), lat: Number(site.center[1]) } : null;
      const featured = page.listing_image_url || page.listing_image_thumb_url || "";
      const items = [{
        id: `site-${slug}`, layer: "archival", kind: "note", placement: "discover",
        title: `Welcome to ${title}`, caption: arReading(page.introduction_content) || arText(page.summary), credit: "On This Site",
        image: featured
      }];
      if (page.why_this_matters) items.push({
        id: `site-why-${slug}`, layer: "archival", kind: "note", placement: "discover",
        title: "Why this place matters", caption: arText(page.why_this_matters), credit: title
      });
      // Photos from the page with their captions, captioned ones first.
      const paragraphs = AR_SECTIONS.flatMap(([field]) => arReading(page[field], 100000).split("\n\n")).filter(text => text.length >= 80);
      const seen = new Set([featured]);
      AR_SECTIONS.flatMap(([field, label]) => arPhotos(page[field], label))
        .filter(photo => !seen.has(photo.src) && seen.add(photo.src))
        .sort((a, b) => Boolean(b.caption) - Boolean(a.caption))
        .slice(0, AR_PHOTOS)
        .forEach((photo, index) => items.push({
          id: `photo-${slug}-${index}`, layer: "archival", kind: "note", placement: "discover",
          title: photo.caption ? arCaptionTitle(photo.caption) : `A photo from the ${photo.section.toLowerCase()} of ${title}`,
          // The caption, the page's passage about it, and a classroom looking prompt.
          caption: [photo.caption, photo.context || (photo.caption ? arRelatedPassage(photo.caption, paragraphs) : ""),
            "Look closely: What do you notice? What do you wonder?"].filter(Boolean).join("\n\n"),
          credit: `From "${photo.section}" on the On This Site page for ${title}`, image: photo.src
        }));
      // Short readings from the rest of the page.
      AR_SECTIONS.slice(1)
        .map(([field, label]) => ({ label, text: arReading(page[field]) }))
        .filter(reading => reading.text.length >= 120)
        .slice(0, AR_READINGS)
        .forEach(reading => items.push({
          id: `reading-${slug}-${reading.label.toLowerCase().replace(/[^a-z]+/g, "-")}`, layer: "archival", kind: "note", placement: "discover",
          title: reading.label, caption: reading.text, credit: `From the On This Site page on ${title}`
        }));
      const land = arLandEntries().find(entry => entry.slug === slug);
      if (land) items.push(...arLandClips(land, "site-"));
      const here = arUserLocation();
      if (centre) items.push(...arPeople(centre, 2, 3, here));
      items.push(...arFinds(
        (state.mapStories || []).filter(story => story.attached_site_slug === slug && story.photo && arShared(story)).slice(-4),
        (state.plantObservations || []).filter(plant => plant.site_slug === slug && arShared(plant)),
        here
      ).slice(0, 7));
      (state.publicComments || [])
        .filter(comment => comment.site_slug === slug && String(comment.source_type || "site") === "site" && comment.comment)
        .slice(-2)
        .forEach(comment => items.push({
          id: `note-${comment.id}`, layer: "archival", kind: "note", placement: "discover",
          title: comment.author_name ? `${arText(comment.author_name)} says` : "A community note",
          caption: arText(comment.comment), credit: "Community note on On This Site"
        }));
      items.push(...arWords(AR_WORDS, random));
      return arScene(title, items, random, arUserLocation());
    }

    // Phones that can't run full AR get the camera with the bubbles over it,
    // in apps that have that mode.
    function arSupported() {
      const app = window.AndroidApp;
      return Boolean(app?.openArNearby) && (!app.isArSupported || app.isArSupported() || Boolean(app.hasArCameraMode?.()));
    }

    function openArBubbles(scene) {
      window.AndroidApp.openArNearby(androidBridgeToken(), JSON.stringify(scene));
    }

    async function openRegionAr() {
      if (!arUserLocation()) await requestUserLocation({ silent: true }).catch(() => null);
      const here = arUserLocation();
      openArBubbles(regionArScene(here, Math.random, here ? await arLandPages(here) : {}));
    }

    // The pages of the ancestral land around you (from the bundle when
    // offline). AR waits for them only briefly.
    async function arLandPages(here) {
      const pages = {};
      await Promise.all(arHomelands(here, arLandEntries()).map(async ({ entry }) => {
        const site = (state.sites || []).find(item => Number(item.id) === Number(entry.siteId) || item.slug === entry.slug) || { id: entry.siteId, slug: entry.slug };
        const load = Promise.resolve().then(() => ctx.siteDetail ? ctx.siteDetail(site) : arSiteDetail(site.slug)).catch(() => null);
        pages[entry.slug] = await Promise.race([load, new Promise(resolve => window.setTimeout(() => resolve(null), 2500))]);
      }));
      return pages;
    }

    // Burial grounds and sensitive places never become bubbles, here or as
    // a site's own AR.
    function arSensitiveSite(site) {
      return /sensitive|burial|grave|cemetery/i.test(site?.site_type || "") || /cemetery|burial/i.test(site?.title || "");
    }

    function nearSite(site) {
      const here = arUserLocation();
      if (!here || !Array.isArray(site?.center)) return false;
      if (arDistanceKm(here, { lng: Number(site.center[0]), lat: Number(site.center[1]) }) <= SITE_AR_KM) return true;
      const land = arLandEntries().find(entry => entry.slug === site.slug);
      return Boolean(land && arInsideGeometry(here, arEntryGeometry(land)));
    }

    // The AR button beside a site panel's close button, shown to visitors
    // standing at that site. The panel's buttons (AR, the app's navigate
    // arrow, close) sit together in one group.
    let siteArButton = null;
    let siteArLocatedAt = 0;
    function syncSiteArButton() {
      const close = document.getElementById("close-detail");
      if (!close || !arSupported()) return;
      if (!siteArButton) {
        const actions = document.createElement("span");
        actions.className = "detail-head-actions";
        close.replaceWith(actions);
        siteArButton = document.createElement("button");
        siteArButton.type = "button";
        siteArButton.className = "site-ar-button";
        // The same cube and label as the AR button on the map.
        siteArButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"></path><path d="M4 7.5 12 12l8-4.5"></path><path d="M12 12v9"></path></svg><span class="mobile-ar-label" aria-hidden="true">AR</span>';
        siteArButton.setAttribute("aria-label", "See this site's stories around you in AR");
        siteArButton.hidden = true;
        siteArButton.addEventListener("click", async () => {
          const site = state.selectedSite;
          if (!site?.slug || siteArButton.disabled) return;
          siteArButton.disabled = true;
          try {
            openArBubbles(siteArScene(site, ctx.siteDetail ? await ctx.siteDetail(site).catch(() => null) : await arSiteDetail(site.slug)));
          } finally {
            siteArButton.disabled = false;
          }
        });
        actions.append(siteArButton, close);
      }
      // The app adds its navigate arrow beside close; keep it in the group.
      const navigate = close.closest(".detail-head")?.querySelector(":scope > .nli-listing-top-navigation");
      if (navigate) close.before(navigate);
      const site = state.selectedSite;
      const open = document.getElementById("detail")?.classList.contains("open");
      // Without a recent location the button can't tell you're here: ask
      // quietly, only when location is already allowed, at most once a minute.
      if (open && site?.slug && !arUserLocation() && window.AndroidApp?.hasLocationPermission?.()
        && Date.now() - siteArLocatedAt > 60000) {
        siteArLocatedAt = Date.now();
        requestUserLocation({ silent: true }).then(found => found && syncSiteArButton()).catch(() => {});
      }
      siteArButton.hidden = !(open && site?.slug && !arSensitiveSite(site) && nearSite(site));
    }

    // The AR button opens the camera with stories around you. An app too old
    // for AR bubbles (or a phone without AR) gets a short explanation instead.
    async function openAr() {
      if (arSupported()) return openRegionAr();
      openSheet(sheetEl);
      const tooOld = window.AndroidApp && !window.AndroidApp.openArNearby;
      if (listEl) listEl.innerHTML = `<p class="summary">${tooOld
        ? "AR needs the newest On This Site app. Update the app, then tap AR again to see stories, people and words from this place floating around you."
        : "This phone doesn't support AR. The stories, people and words are on the map and in Learn."}</p>`;
    }

    // The site AR button: re-checked when a site panel opens or changes, and
    // every few seconds while one is open, as the visitor walks.
    function watch() {
      const detail = document.getElementById("detail");
      if (!detail) return;
      new MutationObserver(syncSiteArButton).observe(detail, { attributes: true, attributeFilter: ["class"] });
      const title = document.getElementById("detail-title");
      if (title) new MutationObserver(syncSiteArButton).observe(title, { childList: true, subtree: true });
      window.setInterval(() => {
        if (detail.classList.contains("open")) syncSiteArButton();
      }, 8000);
    }

    return { available: arAppAvailable, openAr, watch, regionArScene, siteArScene };
  }

  window.NLI_SCAN_SPACES = { create };
}());
