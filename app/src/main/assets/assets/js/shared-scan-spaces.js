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
        { id: "homeland", title: "Whose homeland is this?", text: "Every town on Long Island sits within Native homelands. Colonial deeds and later development changed who held title and access to land; they did not end Native belonging.", more: "Each ancestral land here is broad homeland context, not an exact property or political boundary: Native life moved through villages, kinship, diplomacy, seasonal movement and shared land and water. Deeds recorded colonial claims; they did not record every family’s movements, relationships or continuing sense of belonging.", source: "On This Site land history, ancestral land entries" },
        { id: "still-here", title: "Still here", text: "Native nations continue on Long Island today. The Shinnecock and Unkechaug nations keep their own governments and reservation communities, and Montaukett, Matinecock and Setalcott people carry their communities forward.", more: "Continuance is visible in work led by Native people: language renewal by Shinnecock, Unkechaug and Montaukett collaborators, the Setalcott Nation’s care for Conscience Bay, Matinecock descendants sharing their history at Flushing Town Hall, and Lenape Center’s art and education in New York.", source: "Shinnecock Indian Nation; National Park Service; Montauk Tribe of Indians; Flushing Town Hall (2018); Three Village Historical Society and Setalcott Nation (2025)" },
        { id: "memory", title: "Honoring memory", text: "Acknowledging land means more than naming it: learn whose homeland you stand in, listen to Native leadership, and respect the places and knowledge communities choose to protect.", more: "The old list of Long Island’s “thirteen tribes” is a later framework drawn from colonial records, not a full picture of Native government. A missing tribal label in later records is not a sound basis for declaring a people extinct.", source: "On This Site land history, ancestral land entries" }
      ],
      lands: {
        "shinnecock-ancestral-land": [
          { id: "living-nation", title: "A living nation", text: "Shinnecock people have belonged to this Southampton homeland since time immemorial. Today the Shinnecock Indian Nation sustains self-government, family and cultural life, on and beyond the reservation.", more: "Shinnecock Bay, the Hills and Canoe Place connect ancestral life with a living nation. The Nation identifies community both on and off the reservation, with continuing ties to Westwoods.", source: "Shinnecock Indian Nation, official website" },
          { id: "wider-homeland", title: "More than the reservation", text: "The reservation is a living community within a wider homeland, not the beginning or the outer limit of Shinnecock history. Shinnecock Bay, the Hills and Canoe Place are all part of it.", more: "Shinnecock homeland includes Southampton, Shinnecock Bay, Canoe Place, Shinnecock Hills, the reservation and surrounding sacred and coastal places. Southampton’s older place names, coastal routes and gathering places preserve these relationships.", source: "On This Site, Shinnecock Ancestral Land" },
          { id: "recognition", title: "2010 was not a beginning", text: "The Shinnecock Indian Nation became federally recognized in 2010. That date marks a United States legal decision, not the origin of a nation that has belonged here since time immemorial.", more: "Colonial land loss and later development reduced access to a much larger homeland; they did not end Shinnecock belonging. Shinnecock history includes leadership by sachems and sunksquaws, maritime labor, cultural continuity and modern sovereignty.", source: "Shinnecock Indian Nation, official website" },
          { id: "name", title: "What the name may mean", text: "Shinnecock has been read as “at the level land or country” and, more recently, as “at the big neck.” Both are attributed readings, not a settled translation.", more: "Recorded spellings include Shunnecock, Shinecock and Shinnacock. A Southampton record of December 13, 1640 already speaks of “Shinecock plaine”; English use of the name later spread across the hills, bay, canal and reservation. Colonial records document spelling and use; they do not define Shinnecock identity.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911), pp. 81–82; Ives Goddard, “A Note on Shinnecock in Munsee” (2017)" },
          { id: "bluefish", title: "Knowledge of the bays", text: "A 2014 catalogue of Shinnecock elders’ knowledge follows bluefish from spring into late fall and describes the bays as their feeding and breeding waters.", more: "The same catalogue remembers blowfish caught in Shinnecock Bay, the Atlantic and around Mecox Bay, and smooth dogfish moving north in spring and south in autumn. Its attention to season and water conditions records knowledge built through repeated fishing.", source: "Shinnecock Environmental Department, Natural Resources Identified by Shinnecock Elders (2014), p. 2" },
          { id: "mussels", title: "Caring for the shore", text: "Elders distinguished gathering from caring: blue mussels were preferred for eating, while ribbed “bank” mussels were often left because they held the shore together.", more: "Shells from both kinds of mussel were worn as jewelry. Crabbing is remembered as long-standing work along the water’s edge: blue-claw crabs, including their soft-shell stage, were food, while lady crabs usually were not eaten.", source: "Shinnecock Environmental Department, Natural Resources Identified by Shinnecock Elders (2014), p. 4" },
          { id: "oysters", title: "Oysters and the hatchery", text: "Oysters fed people and their crushed shells were used in planting. The Shinnecock shellfish hatchery, established in 1980, continues the work of growing bivalves.", more: "Fall scalloping is remembered as a much-anticipated part of Shinnecock food life, though elders noted poorer bay-scallop harvests in the years before 2014. Whelks gave food, shell ornaments and whistles.", source: "Shinnecock Environmental Department, Natural Resources Identified by Shinnecock Elders (2014), p. 4" },
          { id: "wampum", title: "Wampum is not money", text: "White and purple wampum beads made from hard clams held meaning in relationships of exchange, unlike the monetary value imposed in colonial trade.", more: "Hard clams connected Shinnecock meals with tools, agriculture and wampum. Along the same shores, eelgrass served as weaving material and insulation for dwellings, and the catalogue notes restoration efforts underway in 2013.", source: "Shinnecock Environmental Department, Natural Resources Identified by Shinnecock Elders (2014), pp. 6–7" },
          { id: "language", title: "Language returning", text: "Shinnecock people are renewing their Algonquian language alongside Unkechaug and Montaukett collaborators, through the Algonquian Language Revitalization Project.", more: "This shared work shows how distinct nations sustain relationships across the map. At Stony Brook, members of the Nations as well as students are learning the languages.", source: "Stony Brook University Department of Linguistics, Algonquian Language Revitalization Project" },
          { id: "not-only-loss", title: "Loss is not the whole story", text: "Dispossession and development changed access to Shinnecock places. Acknowledging those losses should not reduce Shinnecock life to loss alone.", more: "Shinnecock history includes deep ancestral ties to Southampton, colonial land pressure, reservation history, maritime labor, cultural continuity and modern sovereignty. The 2014 elders’ catalogue of fish, shellfish, plants and animals is one record of that continuing knowledge.", source: "On This Site, Shinnecock Ancestral Land" },
          { id: "respect", title: "Respect here", text: "Respect here includes listening to Shinnecock leadership and supporting the protection of ancestral land, waters and cultural places.", more: "This homeland layer offers broad context, not an exact historic, archaeological or property boundary, and sensitive places remain protected. Burial-ground protection is part of Shinnecock history and continuing cultural work.", source: "On This Site, Shinnecock Ancestral Land" }
        ],
        "unkechaug-ancestral-land": [
          { id: "poospatuck", title: "A living South Shore nation", text: "Unkechaug people continue to live in their ancestral homeland at Poospatuck, where the creek leads toward the Forge River and Moriches Bay.", more: "Poospatuck is both an ancestral place and a present-day reservation community of the state-recognized Unkechaug Indian Nation. The name connects Unkechaug people with Yaphank and Weeks Pond, Mastic-area places and South Shore waterways.", source: "National Park Service, Native American Heritage at Fire Island National Seashore" },
          { id: "government", title: "Still governing", text: "Despite colonial dispossession and continuing pressure on their land, the Unkechaug Indian Nation sustains its government, community and work to renew its language.", more: "The Poospatuck Reservation is a living center of Unkechaug community and sovereignty. Community structure and reservation history developed through land pressure, adaptation and survival.", source: "National Park Service; Stony Brook University Department of Linguistics" },
          { id: "wider-homeland", title: "More than the reservation", text: "The small area kept as the Poospatuck reservation should not be mistaken for the full extent of Unkechaug belonging, which reaches across Mastic, Moriches and Brookhaven’s waters.", more: "Unkechaug homelands center Poospatuck, Mastic, Moriches, Brookhaven waterways, wetlands and South Shore village landscapes. The wider homeland and the present reservation are distinct but deeply connected parts of Unkechaug continuity.", source: "John A. Strong, The Unkechaug Indians of Eastern Long Island: A History" },
          { id: "waters", title: "Waters and generations", text: "Generations of fishing, family life and care for the waters connect the Poospatuck community to a much wider South Shore homeland.", more: "The National Park Service describes generations of Unkechaug life along the waterways linking Poospatuck Creek, the Forge River and Moriches Bay. Land, water, language, governance and community run from early records to the present.", source: "National Park Service, Native American Heritage at Fire Island National Seashore" },
          { id: "language", title: "Language returning", text: "Unkechaug people take part in the Algonquian Language Revitalization Project with Shinnecock and Montaukett collaborators, connecting language, education and responsibility to future generations.", more: "Continuance is visible in work led by Native people. At Stony Brook, members of the Nations as well as students are learning the languages.", source: "Stony Brook University Department of Linguistics, Algonquian Language Revitalization Project" },
          { id: "tobacus", title: "Leaders in the records", text: "Seventeenth-century records name Unkechaug leaders such as Tobacus in land transactions and boundary descriptions.", more: "Unkechaug history is documented in Brookhaven records, place-name sources, reservation history and language records. The Unkechaug name is both a record trail and a living identity.", source: "John A. Strong, The Unkechaug Indians of Eastern Long Island: A History" },
          { id: "own-voice", title: "A nation’s own voice", text: "Learning the names and history of this South Shore should lead to recognition of a living nation and its authority to speak for itself.", more: "Historian John A. Strong’s work shows why the familiar “thirteen tribes” map should be handled carefully: the Unkechaug name appears in colonial records, while community life continued through land pressure, adaptation and survival.", source: "On This Site, Unkechaug Ancestral Land" },
          { id: "respect", title: "Respect here", text: "Respect for Unkechaug land and waters includes respecting community decisions about access, cultural knowledge and the protection of ancestral places.", more: "Sensitive archaeological, ceremonial and family places are described broadly and respectfully, without mapping private or vulnerable locations.", source: "On This Site, Unkechaug Ancestral Land" }
        ],
        "montaukett-ancestral-land": [
          { id: "homeland", title: "A living homeland", text: "Montauk is a living Montaukett homeland, with deep ancestral ties to its waters, Indian Fields and places beyond the East End.", more: "Montaukett history connects language, fortified high land, shoreline movement, leadership, land loss and continued presence, from Montauk to Indian Fields, Freetown and Eastville.", source: "Montauk Tribe of Indians" },
          { id: "1910", title: "Declared extinct, still here", text: "In 1910 a New York court wrongly claimed the Montaukett Nation no longer existed, while Montaukett people were present and contesting the loss of their lands. The ruling did not end them.", more: "That ruling stripped away state recognition and helped legitimize dispossession, but it did not end Montaukett identity, kinship or political advocacy.", source: "John A. Strong, The Montaukett Indians of Eastern Long Island" },
          { id: "recognition", title: "Recognition is not existence", text: "Legal acknowledgment and a people’s existence are different things. Montaukett families continue community and cultural work and the campaign to restore state recognition.", more: "As checked on September 22, 2026, New York bill A10129 to restore Montaukett state recognition had passed the Assembly and Senate; the official tracker did not show enactment.", source: "Montauk Tribe of Indians; New York State Legislature" },
          { id: "brothertown", title: "Kin in Wisconsin", text: "Montaukett ancestors were among the founding peoples of the Brothertown Indian Nation, which continues today in Wisconsin.", more: "That connection reaches from the East End to Wisconsin. Closer to home, Manhansett history on Shelter Island includes documented political and cultural relationships with Montauk people.", source: "Brothertown Indian Nation" },
          { id: "indian-fields", title: "Families who remained", text: "Indian Fields, Freetown and Eastville connect the history of Montaukett land loss with the lives of families who remained on the East End.", more: "Montaukett history includes colonial deeds, changing access to land and fisheries, pressure around Indian Field and Montauk, and long struggles over public recognition and community continuity.", source: "On This Site, Montaukett Ancestral Land" },
          { id: "name", title: "What the name may mean", text: "Montauk has been read as “the fort country,” and Dutch records wrote the homeland as Mirrachtauhacky. Colonial records kept many spellings, from Meantaucutt to Montaukett.", more: "Colonial records kept many spellings, including Meantaucutt, Meantauket, Menataukett, Mountacutt and Merautahacky. They come from different records and later interpretations, not one standardized Indigenous spelling.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911); Documents Relative to the Colonial History of the State of New York, vol. XIV" },
          { id: "pharoah-1798", title: "Words kept in 1798", text: "In 1798, Sachem George Pharoah, then 66, shared Montaukett words with John Lyon Gardiner, who wrote them down. The vocabulary was later published for readers today.", more: "Gardiner wrote that only about seven people could then speak the language, which was spoken with little difference across the East End. The Montaukett dialect was understood by Shinnecock, Unkechaug and New England peoples.", source: "Gaynell Stone, ed., Languages and Lore of the Long Island Indians, vol. IV" },
          { id: "2024", title: "Honored today", text: "In November 2024, East Hampton Town honored Chief Robert Pharaoh and Sandi Brewster-Walker with a proclamation recognizing the Montaukett Indian Nation.", more: "That year the Montauk Indian Museum stayed closed while the Montauk Historical Society reconsidered its exhibits, after new federal NAGPRA rules strengthened requirements for consultation and return.", source: "Christopher Walsh, “Town Recognizes the Montaukett Indian Nation,” East Hampton Star, November 14, 2024" },
          { id: "respect", title: "Respect here", text: "Supporting Montaukett-led education and listening to descendant accounts connects a place name with a living people.", more: "Sensitive places remain unnamed, while related site entries carry more of this homeland story.", source: "On This Site, Montaukett Ancestral Land" }
        ],
        "corchaug-ancestral-land": [
          { id: "homeland", title: "A North Fork homeland", text: "Corchaug homelands on the North Fork hold generations of farming, fishing and wampum-making, remembered in names such as Cutchogue.", more: "Nineteenth-century histories describe Corchaug territory from around Wading River toward Orient Point, an approximate description rather than a rigid political boundary.", source: "John A. Strong, The Algonquian Peoples of Long Island from Earliest Times to 1700" },
          { id: "older-than-southold", title: "Older than Southold", text: "Cutchogue and the North Fork’s older place names carry a Native geography that predates Southold’s establishment in 1640.", more: "Long before Southold’s founding in 1640, Native families cultivated, fished, gathered, traveled coastal waters and made wampum across this landscape.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "saugust", title: "Fields taken", text: "After English settlement, settlers took over cleared fields at Saugust, while deeds, fencing and livestock narrowed Native access to land and the shore.", more: "Corchaug people did not simply disappear: individuals and families remained, moved among related Native communities and asserted their land rights.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "1763", title: "The 1763 petition", text: "Corchaug people kept asserting land rights long after colonial settlement began, including in a 1763 petition concerning Indian Neck and South Harbor.", more: "Reading colonial deeds alongside archaeological scholarship, family history and the 1763 petition keeps dispossession visible while recognizing Corchaug continuity, adaptation and legal resistance across generations.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "descendants", title: "No reservation, not no people", text: "The absence of a reservation bearing the Corchaug name should not be mistaken for proof that its people left no descendants.", more: "Particular family connections require family and community evidence; the map does not appoint another nation as a substitute for Corchaug identity.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "across-lines", title: "Relationships across lines", text: "Native families moved, married and found refuge across places later drawn as separate tribal territories; a colored map cannot hold all of those relationships.", more: "Corchaug land use and kinship did not fit later town lines, which is why this homeland’s boundaries are interpretive.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "diplomacy", title: "Diplomacy and wampum", text: "Records involving Southold, Paucamp and Momoweta show Native diplomacy, trade and wampum across this coastal homeland.", more: "Corchaug history appears in land records, place-name sources, community memory and preservation discussions across the North Fork. Records of Southold, also written Yennecott, show continued Native presence alongside land pressure.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "voices", title: "Voices left out", text: "Learning this history means attending both to the land that was taken and to the living Native communities whose voices colonial accounts often left out.", more: "Sensitive archaeological, burial, family and ceremonial places are not identified, so this history can be shared without exposing them.", source: "On This Site, Corchaug Ancestral Land" }
        ],
        "manhansett-ancestral-land": [
          { id: "island", title: "Shelter Island’s Native name", text: "Shelter Island is Manhansett ancestral land, recorded as Manhansack-Ahaquatuwamock. Its waters connected Native communities long before a colonial plantation occupied the island.", more: "Early English records connect Manhansett people and leaders with Shelter Island and nearby Peconic waters through wampum, diplomacy, labor and land negotiations.", source: "On This Site, Manhansett Ancestral Land" },
          { id: "name", title: "What the name may mean", text: "Manhansett is read as “island land” or “neighborhood”; an older reading as a river mouth is rejected.", more: "Related forms include Manhansick and Manhansack-Ahaquatuwamock. The ending is understood as “at” or “about” rather than a river-mouth element.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "montauk", title: "Ties to Montauk", text: "Manhansett history includes documented political and cultural relationships with Montauk people.", more: "Historical affiliation does not by itself establish the descent of every present-day family. It does challenge the idea that each named community was isolated or ceased to exist when its land passed into colonial hands.", source: "Fiske Center for Archaeological Research, University of Massachusetts Boston" },
          { id: "plantation", title: "A plantation on Native land", text: "Sylvester Manor’s own history acknowledges that its plantation was established on Manhansett ancestral land in 1651 and depended on an Atlantic economy of slavery and labor.", more: "Manhansett is best read as a place-based community name preserved through records of land, water and colonial contact, one that returns attention to the families, leaders, workers and descendants connected to Shelter Island.", source: "Sylvester Manor" },
          { id: "wampum", title: "Native labor and wampum", text: "Researchers describe evidence of Native labor and wampum production at Sylvester Manor.", more: "Wampum, diplomacy and labor appear together in the early English records of Shelter Island, alongside the land negotiations that turned an Indigenous homeland into written boundaries.", source: "Fiske Center for Archaeological Research, University of Massachusetts Boston" },
          { id: "inhabited", title: "Inhabited, not empty", text: "The plantation transformed an inhabited homeland; it did not replace an empty landscape.", more: "Historian John A. Strong explains why the familiar “thirteen tribes” map needs caution: it is a later framework drawn from colonial records, not a perfect picture of Native government before contact.", source: "On This Site, Manhansett Ancestral Land" },
          { id: "respect", title: "Respect here", text: "Remembering Manhansett ancestry calls for respect for descendant knowledge and care for cultural places, with Native voices central to how this history is told.", more: "Shelter Island is interpreted as Manhansett homeland while sensitive sublocations and burial-related histories are kept out of public maps and directions.", source: "On This Site, Manhansett Ancestral Land" }
        ],
        "setauket-ancestral-land": [
          { id: "nation", title: "The Setalcott Nation", text: "Setauket carries a Native place name within the living homeland of the Setalcott Nation, whose history here reaches back thousands of years.", more: "Setauket and Setalcott homelands are remembered around Setauket, Stony Brook, Port Jefferson, Wading River and North Shore necks, harbors, streams and inland routes.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "christian-avenue", title: "Christian Avenue", text: "Setalcott ties continue through descendant families, including the Black and Indigenous community around Christian Avenue.", more: "Preservation work around the Bethel–Christian Avenue–Laurel Hill Historic District carries forward histories of Native, African American and mixed-heritage family life, labor, kinship and local cultural education.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "last-member", title: "No “last member”", text: "The Setalcott Nation’s 2025 acknowledgment rejects the old habit of declaring a people gone when an outsider named a supposed last member.", more: "The Nation’s work with the Three Village Historical Society places descendant knowledge at the center of this history. Recorded elder interviews have been collected since the 1980s.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "waters", title: "Caring for ancestral waters", text: "The Nation’s 2025 restoration grant links native planting and an oyster-hatchery study at Conscience Bay with planned kelp farming at Poquott.", more: "These are contemporary expressions of responsibility to ancestral waters, not simply commemorations of the past. At the wetland opening, the Nation’s youth chair joined the council co-chairs, bringing another generation into the public conversation.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "council", title: "Leading today", text: "Helen Sells and Robert “Silver Wolf” Thompson co-chair the council named in the 2025 statement, which also honors Gail “Chief Running Water” Revis and historian Theodore Green.", more: "Family historian Kevin Sells adds his perspective: his 2023 interview at the Three Village Historical Society connects remembered relatives and reunions with museum interpretation.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "name", title: "What the name may mean", text: "Setauket has been read as “land at the mouth of a river or creek,” an early twentieth-century interpretation rather than a final community translation.", more: "Recorded forms include Sichteyhacky, Seatauke, Setokett, Setawke, Setaulcott and Selasacott. At Stony Brook, members of the Nations as well as students are learning the languages.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "warawakmy", title: "Warawakmy", text: "The April 14, 1655 Setauket deed names Warawakmy as a Setauket sachem. Deeds like it leave out much of Native law, kinship and understanding of the land.", more: "Wyandanch is not named in that deed. Records around Warawakmy point to people negotiating, surviving and keeping a presence in a changing Brookhaven landscape.", source: "Brookhaven Town Records" },
          { id: "respect", title: "Respect here", text: "Acknowledgment here means recognizing the continuing Setalcott community, listening to its members and supporting their role in caring for ancestral places.", more: "Setauket/Setalcott is a people-and-place name: a homeland preserved in records, a community memory carried forward, and a reminder that Indigenous political life was more complex than colonial boundary lines.", source: "On This Site, Setauket Ancestral Land" }
        ],
        "nissaquogues": [
          { id: "river", title: "A river’s name", text: "The Nissequogue River preserves a Native name within an ancestral homeland shaped by generations of life along its waters.", more: "Nissequogue homelands are remembered around the Nissequogue River, Smithtown, Stony Brook and nearby North Shore places.", source: "On This Site, Nissequogue Ancestral Land" },
          { id: "deeds", title: "What deeds leave out", text: "Colonial deeds and the growth of Smithtown narrowed Native control, but those papers did not record every family’s movements, relationships or belonging.", more: "Seventeenth-century Dutch and English paperwork preserves Nissequogue-related names, showing Native geography entering colonial treaty, town and boundary systems through spellings shaped by non-Native record keepers.", source: "On This Site, Nissequogue Ancestral Land" },
          { id: "neighbours", title: "Neighbors still here", text: "Matinecock and Setalcott communities remain present on this North Shore; their histories show family relationships reaching beyond the separate territories on a map.", more: "Their public accounts describe descendant families, cultural responsibilities and relationships that do not fit neatly inside the familiar thirteen-tribes map.", source: "Flushing Town Hall (2018); Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "extinct", title: "A missing label is not extinction", text: "A missing tribal label in later records is not a sound basis for declaring a people extinct.", more: "Later boundary disputes and place-name studies keep the Nissequogue River and nearby villages visible as Native geography within a modern North Shore landscape.", source: "On This Site, Nissequogue Ancestral Land" },
          { id: "between", title: "Between neighbors", text: "Earlier sources place Nissequogue lands between Matinecock lands to the west and Setauket lands to the east, along the river, shore and inland routes.", more: "Native relationships to land were lived through kinship, travel, diplomacy and use of waterways, not only through lines on a map.", source: "On This Site, Nissequogue Ancestral Land" },
          { id: "respect", title: "Respect here", text: "Acknowledgment here leaves room for descendant knowledge and recognizes the obligations that come with living beside this ancestral river.", more: "The river is more than a surviving word: it connects the older Nissequogue homeland with the shores and settlements recorded later.", source: "On This Site, Nissequogue Ancestral Land" }
        ],
        "secatogue-ancestral-land": [
          { id: "bay", title: "A Great South Bay homeland", text: "Secatogue ancestry belongs to the creeks, meadows and shores of Great South Bay, where Native life long preceded colonial towns.", more: "Secatogue history is tied to South Shore tidal creeks, bay travel, colonial deed records, community gatherings and later descendant history.", source: "National Park Service, Native American Heritage at Fire Island National Seashore" },
          { id: "visible", title: "Less visible, not vanished", text: "Land transactions changed how Secatogue people appeared in written records. A less visible name is not evidence that a people vanished.", more: "Land records and colonial restrictions show Native presence under increasing pressure rather than disappearance.", source: "On This Site, Secatogue Ancestral Land" },
          { id: "name", title: "Land of the Secatogues", text: "Sichetanyhacky, a name in Dutch-period records, is interpreted as the country or land of the Secatogues.", more: "Recorded forms include Siketenwhacky, Siketenhacky and Sickentanhacky. Dutch-period records tie the name to the eastern boundary of Massapeag jurisdiction and to Secatogue territory on the South Shore.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911); Documents Relative to the Colonial History of the State of New York, vol. XIV" },
          { id: "fire-island", title: "Fire Island", text: "The National Park Service identifies Secatogue people among the ancestral communities of the Great South Bay and Fire Island region.", more: "The historical records connect the Secatogue name to shore, creek and meadow places and to relationships with neighboring Native leaders.", source: "National Park Service, Native American Heritage at Fire Island National Seashore" },
          { id: "living-coast", title: "A living coast", text: "The Unkechaug community at Poospatuck and the Shinnecock Nation make Native continuance visible on this coast; the story of a vanished Native South Shore does not hold.", more: "Their presence does not establish that every Secatogue family became part of either nation. Secatogue histories continued through kinship, movement, land records, descendant memory and relationships with neighboring communities.", source: "National Park Service; Shinnecock Indian Nation" },
          { id: "respect", title: "Respect here", text: "Honoring Secatogue ancestry includes protecting the bay and cultural places, and making room for family histories that deed archives may not preserve.", more: "Some Secatogue histories involve camps, village sites, family places and archaeological traces, so the public story stays at the level of the broader South Shore landscape.", source: "On This Site, Secatogue Ancestral Land" }
        ],
        "massapequa-ancestral-lands": [
          { id: "homeland", title: "South Oyster Bay homeland", text: "Massapequa’s name connects today’s community to an older Native homeland around South Oyster Bay and Fort Neck.", more: "Massapequa and Massapeague homelands center South Oyster Bay, Fort Neck and related South Shore waters, including Massapequa pond and brook and the Fort Massapeag site.", source: "On This Site, Massapequa Ancestral Lands" },
          { id: "tackapousha", title: "Tackapousha", text: "Leaders such as Tackapousha defended Native interests as colonial settlement pressed into fields, meadows and waterways.", more: "Massapequa history includes agreements, deeds, diplomacy, fortification and disputed colonial authority around South Oyster Bay and Fort Neck. These records show land loss as a contested process involving Native leadership.", source: "John A. Strong, The Algonquian Peoples of Long Island from Earliest Times to 1700" },
          { id: "negotiating", title: "Negotiating, not surrendering", text: "Treaties and disputes name leaders across Massapequa, Rockaway and Secatogue: people negotiating and resisting under pressure, not simply leaving history.", more: "The 1658 Massapeoque Meadows record preserves Massapequa, Rockaway and Secatogue names together.", source: "On This Site, Massapequa Ancestral Lands" },
          { id: "name", title: "What the name may mean", text: "Massapeague is interpreted as “great water land” or “land on the great cove.”", more: "Related forms include Massapeague, Marsapeague, Masepeage, Marossepinck and Massepinc. Necochawodt is presented as a personal name rather than a confirmed place name.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "1639", title: "Names in the records", text: "The 1639 Marossepinck deed preserves Native names such as Mechowodt and Piscamoc, and the 1656 treaty names Tackapousha with allied western Long Island signers.", more: "The 1639 deed also names Wattewochkeouw, Kachpoher and Ketchquawars. Records like these preserve Native names as well as place names.", source: "Documents Relative to the Colonial History of the State of New York, vol. XIV; John A. Strong" },
          { id: "villages", title: "Villages, not townships", text: "The popular list of Long Island’s “thirteen tribes” makes Native life look like fixed townships; it was organized through villages, kinship, diplomacy, seasonal movement and shared land and water.", more: "Massapequa remains a homeland name with continuing community memory, best understood as a guide to people and place rather than a claim that every modern line marks an old political border.", source: "John A. Strong, The Thirteen Tribes of Long Island: The History of a Myth" },
          { id: "respect", title: "Respect here", text: "Acknowledgment here means caring for ancestral places and respecting descendants’ authority to explain their own family connections.", more: "Massapequa ancestral land includes fort, village, shell and archaeological histories; some connected places are sensitive, so homeland context is shared without identifying vulnerable locations.", source: "On This Site, Massapequa Ancestral Lands" }
        ],
        "matinecock-traditional-land": [
          { id: "homeland", title: "A North Shore homeland", text: "Matinecock ancestral land reaches across the North Shore from Queens into Long Island, and its people remain present through descendant families and cultural work.", more: "Matinecock place names and family histories ask us to recognize a living community, not a people confined to the past.", source: "Flushing Town Hall (2018)" },
          { id: "name", title: "What the name may mean", text: "Matinecock is interpreted as “at the place of observation,” “at the place to look around from,” or “at the hilly land.”", more: "Recorded forms include Matinnekonck, Martinnehouch, Matinnecoke, Montinnecok and Metinicok. The North Shore it names is shaped by hills, harbors, observation places, travel and diplomacy.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "1931", title: "Ancestors disturbed", text: "In 1931 a Matinecock burial ground was removed for the widening of Northern Boulevard, despite descendant opposition.", more: "Land loss and even the removal of ancestors from a burial ground did not erase Matinecock belonging. This history belongs alongside the work of living Matinecock people.", source: "Queens Public Library, via Urban Archive" },
          { id: "kin", title: "Kin across nations", text: "Family historian Donna Gentle Spirit Barron and the Ceaser family make Matinecock and Montaukett kinship visible: specific family relationships, not interchangeable identities.", more: "These connections reach among Matinecock, Montaukett and other Native relatives, and they are carried by the families and family historians themselves.", source: "Flushing Town Hall (2018)" },
          { id: "2018", title: "Sharing their own history", text: "Matinecock descendants publicly shared their history and cultural protocols at Flushing Town Hall’s 2018 gathering.", more: "An acknowledgment should direct attention toward community voices and responsibilities to land and ancestors.", source: "Flushing Town Hall (2018)" },
          { id: "no-reservation", title: "No reservation, still a people", text: "Recognition by outsiders, ownership in deeds and Native belonging are different matters; a missing reservation does not mean a missing people.", more: "Colonial deeds and place-name spellings record land pressure, while later sources and public memory show continued Native presence.", source: "On This Site, Matinecock Traditional Land" },
          { id: "places", title: "Places of the homeland", text: "Matinecock history is documented around Oyster Bay, Glen Cove, Cold Spring Harbor, Huntington and neighboring North Shore communities.", more: "Matinecock history includes family places, private property, ceremonial landscapes and archaeological sites, so the homeland is shared without directing visitors to sensitive or private locations.", source: "On This Site, Matinecock Traditional Land" }
        ],
        "merrick-ancestral-land": [
          { id: "homeland", title: "The Merikoke homeland", text: "Merrick’s name recalls the Merikoke homeland of plains, creeks and South Shore waters.", more: "Merrick/Merikoke history overlaps with Massapequa, Rockaway, Canarsie, Secatogue, Matinecock and other western Long Island Native histories. The name keeps people visible where modern maps often remember only roads, towns and property lines.", source: "On This Site, Merrick Ancestral Land" },
          { id: "name", title: "What the name may mean", text: "Merrick is connected with an Algonquian meaning of bare land or plain, fitting the Hempstead Plains, a large open grassland.", more: "Recorded forms include Merriack, Meracock, Moroke, Mericoke, Mercock and Meroke. Written down by English and Dutch record keepers, they are historical evidence rather than one final spelling.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "1675", title: "“Not paid for”", text: "In 1675, Tackapousha publicly challenged Hempstead’s use of Mercock land, stating that it had not been paid for.", more: "At the hearing of August 5, 1675, Tackapousha and other Native speakers challenged Hempstead’s claim that Mercock land had been paid for. A 1657 Hempstead confirmation bears the marks of Takaposha, Wantagh, Chegonoe and others.", source: "John A. Strong, The Algonquian Peoples of Long Island from Earliest Times to 1700" },
          { id: "contested", title: "Deeds were contested", text: "Early land papers here record diplomacy, translation, boundary disputes and Native legal resistance, not simple sales.", more: "A 1643 Hempstead land transaction involved Native representatives associated with Massapequa, Merrick and Rockaway and English purchasers Robert Fordham and John Carman. Such transactions did not settle the meaning of land, payment or authority.", source: "On This Site, Merrick Ancestral Land" },
          { id: "2023", title: "On the water today", text: "A 2023 Native canoe gathering at Jones Beach connects this South Shore with Native people who continue to gather and assert belonging here.", more: "The Wantagh High School mascot debate and the canoe gathering connect this region with contemporary questions of Indigenous representation and sovereignty. The Montaukett Nation’s 2022 Hempstead Lake invitation documents public outreach too.", source: "The Long Island Advocate (2023)" },
          { id: "learning", title: "Places to keep learning", text: "The Lister Park Greenway marker introduces Native histories of the Mill River, and Hempstead Plains Preserve connects prairie conservation with the history of the commons.", more: "Meroke Preserve carries a regional name along Newbridge Creek, and the Duke’s Laws roadside marker connects a Hempstead street corner with colonial restrictions on Native land, trade and worship.", source: "On This Site, Merrick Ancestral Land" },
          { id: "sign", title: "A missing sign", text: "The missing Meroke village sign shows how fragile public acknowledgment can be.", more: "Horton’s 1742 Merrick journal entry, accounts of refuge between Merrick and Massapequa people, and the name Merrack Neck offer glimpses of community life along this coast.", source: "On This Site, Merrick Ancestral Land" }
        ],
        "rockaway-traditional-land": [
          { id: "lenape", title: "A Lenape homeland", text: "Rockaway preserves a Native name on the shores of a much older Lenape homeland, where bays, islands and waterways connected people.", more: "Rockaway history spans western Long Island, Jamaica Bay, Hempstead Bay and the South Shore islands, and overlaps with Merrick, Massapequa and Canarsie through diplomacy, trade and kinship.", source: "National Park Service" },
          { id: "continue", title: "Lenape life continues", text: "Displacement did not end Lenape life: communities continue in the homeland and in nations beyond New York.", more: "Lenape Center describes a people whose present-day nations and cultural work extend across a diaspora as well as the ancestral homeland.", source: "Lenape Center" },
          { id: "relationship", title: "Displaced, still related", text: "Displacement can separate a community from land without ending its relationship to that land.", more: "This is a broader Lenape connection, not a claim that a particular living nation contains every Rockaway descendant.", source: "Lenape Center; On This Site, Rockaway Traditional Land" },
          { id: "1655", title: "Names in the 1655 deed", text: "The 1655 Rockaway Neck deed names Ruckquaheag, Ronnessoke and Adam, also called Achitteronose, among others.", more: "Earlier records include a 1639 western Long Island deed boundary reaching from Rockaway and the 1643 Hempstead deed linking Rockaway with Massapequa and Merrick communities.", source: "Documents Relative to the Colonial History of the State of New York, vol. XIV; John A. Strong" },
          { id: "1657", title: "The 1657 conference", text: "At a 1657 Hempstead conference, Mangwobe of Rockaway met with Tackapousha, Wyandanch, Cockenoe and Merrick representatives.", more: "Early colonial sources also describe Rockaway villages and South Shore waterways; village and archaeological references are kept broad so sensitive places are not mapped for visitation.", source: "Documents Relative to the Colonial History of the State of New York, vol. XIV" },
          { id: "respect", title: "Respect here", text: "Acknowledgment here makes room for living Lenape voices and the responsibilities carried by a name that survived the growth of the city.", more: "The colonial records capture negotiations and claims; they do not define the whole life of a community.", source: "On This Site, Rockaway Traditional Land" }
        ],
        "canarsie-traditional-land": [
          { id: "homeland", title: "Brooklyn’s Native homeland", text: "Canarsie carries the name of a Native community whose homeland included parts of present-day Brooklyn and Jamaica Bay.", more: "Canarsie, also recorded as Canarsee, connects the modern neighborhood to the older Native geography of Brooklyn and Jamaica Bay.", source: "National Park Service" },
          { id: "shores", title: "Caring for these shores", text: "Generations lived from and cared for these shores before Dutch and English settlement brought dispossession.", more: "Seventeenth-century Dutch and English records preserve Canarsie-related names in grants, petitions and patent descriptions.", source: "On This Site, Canarsie Traditional Land" },
          { id: "city", title: "Land that became the city", text: "Colonial grants, petitions and patents record a struggle over inhabited land; reading them only as property transfers hides the communities whose land became the city.", more: "These records show Native land relationships being translated into colonial property systems, while Canarsie people remained part of western Long Island political and cultural history.", source: "On This Site, Canarsie Traditional Land" },
          { id: "lenape-center", title: "Speaking for themselves", text: "Today Lenape people speak for their own history through institutions such as Lenape Center, connecting present-day nations with New York through art, education, language and public history.", more: "That broader continuance should not be confused with a documented genealogy for every Canarsie family.", source: "Lenape Center" },
          { id: "not-gone", title: "Not a disappearance", text: "Later histories sometimes turned Canarsie into folklore or a disappearance story. Displacement and changed community names do not amount to disappearance.", more: "An acknowledgment can be honest about the limits of the surviving records while recognizing that Lenape people continue in their homeland and beyond it.", source: "On This Site, Canarsie Traditional Land" }
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
          // The card says who they were; opening it adds what happened near here.
          const nearHere = `Near here${place.dateLabel ? `, ${arText(place.dateLabel)}` : ""} (${arText(place.place)}): ${arText(place.eventTitle)}. ${arText(place.reason)}`;
          return arToward({
            id: `person-${slug}`, layer: "archival", kind: "note", placement: "discover",
            title: `Meet ${name}`,
            caption: intro || nearHere, more: intro ? nearHere : "",
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
    function arPlaceNames(here, skip, sitePages = {}) {
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
          title: `Native place name: ${arText(site.title)}`, caption, more: arSiteMore(sitePages[site.slug], site.summary),
          credit: "On This Site", image: site.listing_image_url || site.listing_image_thumb_url || undefined
        }, here, centre));
    }

    // A teaching as a bubble: the card shows the teaching, opening it adds more;
    // its source is small print in the opened card.
    function arLearning(learning, slug, title = learning.title) {
      return {
        id: `learn-${slug}-${learning.id}`, layer: "archival", kind: "note", placement: "discover",
        title, caption: learning.text, more: learning.more || "", credit: learning.source
      };
    }

    // What an opened card adds for a site: why it matters and the opening of its
    // page's sections, without what the card already shows, sentences about the map
    // marker, or Tooker (references stay in the small print).
    const AR_MORE_SECTIONS = ["introduction_content", "history_content", "oral_history_content", "preservation_content", "artifacts_content", "land_loss_content"];
    function arSiteMore(page, shown = "") {
      if (!page) return "";
      // The elders' catalogue lists (resource by resource, with page numbers) read
      // better on the page itself.
      const reading = AR_MORE_SECTIONS.flatMap(field => arReading(page[field], 600).split("\n\n"))
        .filter(part => !/\bPDF pp?\.|catalogue names .* in its resource accounts/i.test(part));
      return arMoreThan(shown, [arText(page.why_this_matters), ...reading]);
    }

    // Parts of a longer text not already on the card, without sentences about the
    // page or map, or naming Tooker; whole sentences, at most about 700 characters.
    function arMoreThan(shown, parts) {
      const already = arText(shown);
      const keep = sentence => sentence.length >= 25 && !already.includes(sentence)
        && !/tooker|\bmap (point|marker)|\bmarker\b|see references|sources? for|\baccessed\b|\b(below|above)\b|historic moments/i.test(sentence);
      const kept = parts.map(part => String(part || "").split(/(?<=[.!?])\s+(?=[A-Z“"])/).filter(keep).join(" "))
        .filter(part => part.length >= 60);
      let more = [...new Set(kept)].join("\n\n");
      if (more.length > 700) more = more.slice(0, more.lastIndexOf(". ", 700) + 1);
      return more.replace(/\s*…$/, "");
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
          // Opening it adds the history and the people.
          const caption = `${arText(entry.description)}${respect}`;
          const more = arMoreThan(caption, [arText(entry.historicalContext), arText(entry.community)]);
          return { ...clip, caption, more, image: arSiteImage(entry.siteId) || undefined };
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
    // open before the signs rise. landPages and sitePages: the pages of the lands
    // and of the place names and nearby sites, fetched by openRegionAr; an opened
    // card reads more from them than the floating card shows.
    function regionArScene(here, random = Math.random, landPages = {}, sitePages = {}) {
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
      around.push(...arLandHere(here, entries), ...arPlaceNames(here, new Set(nearby.map(({ site }) => site.slug)), sitePages), ...arNeighbours(here, homelands, entries));
      if (island) around.push({
        id: `island-${island.slug}`, layer: "archival", kind: "note", placement: "discover",
        title: `${arText(island.title)}: a name for this island`, caption: arText(island.summary),
        more: arSiteMore(sitePages[island.slug], island.summary), credit: "On This Site"
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
        more: arSiteMore(sitePages[site.slug], site.summary),
        credit: "On This Site", image: site.listing_image_url || site.listing_image_thumb_url,
        sky: true, name: arText(site.title), brief: arBrief(site.summary)
      }, here, { lng: Number(site.center[0]), lat: Number(site.center[1]) }));
      // First of all: a red pin at your spot, saying whose land it is. Walk up to it (or
      // tap it) and it tells the land; opening it adds why it matters and what is near.
      const first = homelands[0];
      const nearest = nearby.slice(0, AR_HERE_NEARBY).map(({ site, km }) => `${arText(site.title)} · ${arKm(km)}`);
      const landTitle = first ? arText(first.entry.title) : "";
      const landLine = !first ? "Long Island (Paumanok)"
        : first.near ? `Near ${landTitle} · ${arKm(first.near.km)}` : `On ${landTitle}`;
      const hereItem = {
        id: "here", layer: "archival", kind: "here", placement: "discover",
        title: !first ? "You are on Long Island (Paumanok)" : first.near ? `Near ${landTitle}` : `You are on ${landTitle}`,
        land: landLine, nearby: nearest,
        caption: first ? arText(first.entry.description) : "Every town on Long Island sits within Native homelands.",
        more: [first ? arText(landPages[first.entry.slug]?.why_this_matters) : "",
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
      if (!here) return openArBubbles(regionArScene(null));
      // The place names, nearby sites and island name the scene will show, whose pages
      // give their opened cards more to read; fetched alongside the land pages.
      const slugs = regionArScene(here).items
        .map(item => (item.id.match(/^(?:placename|place|island)-(.+)$/) || [])[1]).filter(Boolean);
      const [landPages, sitePages] = await Promise.all([arLandPages(here), arSitePages(slugs)]);
      openArBubbles(regionArScene(here, Math.random, landPages, sitePages));
    }

    // Pages of the given sites (from the bundle when offline; else in one request),
    // with what an opened card reads: why it matters and the opening sections.
    async function arSitePages(slugs) {
      const pages = {};
      if (!slugs.length) return pages;
      const sites = slugs.map(slug => (state.sites || []).find(item => item.slug === slug) || { slug });
      const load = ctx.siteDetail
        ? Promise.all(sites.map(site => Promise.resolve().then(() => ctx.siteDetail(site)).catch(() => null)
          .then(page => { if (page) pages[site.slug] = page; })))
        : fetch(`${DIRECTUS}/items/sites?limit=-1&filter[publication_status][_eq]=published&filter[slug][_in]=${slugs.map(encodeURIComponent).join(",")}&fields=slug,why_this_matters,${AR_MORE_SECTIONS.join(",")}`)
          .then(response => response.ok ? response.json() : { data: [] })
          .then(json => (json.data || []).forEach(page => { pages[page.slug] = page; }))
          .catch(() => null);
      await Promise.race([load, new Promise(resolve => window.setTimeout(resolve, 2500))]);
      return pages;
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
