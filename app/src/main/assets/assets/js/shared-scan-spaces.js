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
        { id: "homeland", title: "Every town on Long Island stands on Native homeland", text: "Long before English towns were founded in the 1600s, Algonquian-speaking communities lived across Long Island. Colonial deeds changed who held title to the land; they did not end Native people’s belonging to it.", more: "Each ancestral land in this app is broad homeland context, not an exact property or political boundary: Native life moved through villages, kinship, diplomacy, seasonal movement and shared land and water. Deeds recorded colonial claims; they did not record every family’s movements, relationships or continuing sense of belonging.", source: "On This Site land history, ancestral land entries" },
        { id: "still-here", title: "Native nations still live and govern on Long Island today", text: "The Shinnecock Indian Nation in Southampton and the Unkechaug Indian Nation in Mastic keep their own reservations and governments. Montaukett, Matinecock and Setalcott communities carry their histories forward too.", more: "Continuance is visible in work led by Native people: language renewal by Shinnecock, Unkechaug and Montaukett collaborators, the Setalcott Nation’s care for Conscience Bay, Matinecock descendants sharing their history at Flushing Town Hall, and Lenape Center’s art and education in New York.", source: "Shinnecock Indian Nation; National Park Service; Montauk Tribe of Indians; Flushing Town Hall (2018); Three Village Historical Society and Setalcott Nation (2025)" },
        { id: "memory", title: "A land acknowledgment means learning whose land you are on, and acting on it", text: "Acknowledging land is more than saying a name: learn whose homeland you stand in, listen to Native leaders, and respect the places and knowledge that communities choose to protect.", more: "The popular list of Long Island’s “thirteen tribes” is a later framework drawn from colonial records, not a full picture of Native government. A name missing from later records is not evidence that a people disappeared, which is why the bubbles here follow living communities as well as old documents.", source: "On This Site land history; John A. Strong, The Thirteen Tribes of Long Island: The History of a Myth" }
      ],
      lands: {
        "shinnecock-ancestral-land": [
          { id: "living-nation", title: "The Shinnecock have lived in Southampton since time immemorial", text: "Long before Southampton was founded in 1640, Shinnecock families fished, farmed and gathered around Shinnecock Bay and the Hills. Today the Shinnecock Indian Nation governs its own reservation on Shinnecock Neck.", more: "The Nation describes its people as belonging here since time immemorial and identifies community both on and off the reservation, with continuing ties to Westwoods. Shinnecock Bay, the Hills and Canoe Place connect that ancestral life with a living nation.", source: "Shinnecock Indian Nation, official website; On This Site, Shinnecock Ancestral Land" },
          { id: "recognition", title: "The Shinnecock Nation won federal recognition in 2010, 32 years after applying", text: "The Shinnecock first asked the U.S. government to formally acknowledge them as a tribe in 1978. After 32 years of review and a lawsuit, the Interior Department agreed in June 2010; it took effect on October 1, 2010.", more: "Federal recognition is the United States’ formal acknowledgment of a tribe as a sovereign nation, in a government-to-government relationship. The Nation had to prove seven criteria, among them that it had been identified as an Indian community since 1900, kept a distinct community and political leadership, and that members descend from the historical tribe. Recognition was a U.S. legal decision, not the beginning of a nation that was already here.", source: "Final Determination for Federal Acknowledgment of the Shinnecock Indian Nation, 75 Fed. Reg. 34760 (June 18, 2010); Bureau of Indian Affairs; Native American Rights Fund" },
          { id: "hills-1859", title: "An 1859 New York law took the Shinnecock Hills from the Nation", text: "Under a 1703 agreement, Southampton leased the Shinnecock Hills to the Nation for 1,000 years. In 1859 New York approved trading those rights, about 3,500 acres, for Shinnecock Neck; tribal members said the petition was forged.", more: "The Hills later became home to the Shinnecock Hills Golf Club, a college campus and summer houses. They remain a sacred burial landscape for the Nation. In 2005 the Nation sued to reclaim the land; the courts dismissed the claim as brought too late (a doctrine called laches), not because the history was disproven.", source: "Shinnecock Land Claim Historical and Legal Timeline; New York State law of March 16, 1859; On This Site, Shinnecock Hills" },
          { id: "wider-homeland", title: "The Shinnecock homeland is much bigger than today’s reservation", text: "The reservation is one living community within a wider homeland that includes Shinnecock Bay, Shinnecock Hills, Canoe Place and much of Southampton. Land loss shrank what the Nation holds, not where it belongs.", more: "Southampton’s older place names, coastal routes and gathering places preserve these relationships. Colonial land loss and later development reduced access to the homeland; they did not end Shinnecock belonging, which runs through leadership by sachems and sunksquaws, maritime work, cultural life and modern sovereignty.", source: "On This Site, Shinnecock Ancestral Land" },
          { id: "circassian", title: "In 1876 ten Shinnecock men died salvaging the wrecked ship Circassian", text: "The Circassian ran aground off Bridgehampton in December 1876. Shinnecock men hired to salvage its cargo stayed aboard, and when a second storm broke the ship apart on December 29, all ten of them died.", more: "Twenty-eight men died in all. The loss left nine widows and twenty-five fatherless children in the Shinnecock community. Shinnecock men had long worked the sea as whalers, fishermen and salvage crews, so the disaster reached nearly every family.", source: "Southampton History Museum, “Shipwreck: The Tragic Loss of the Circassian”; Bridgehampton Museum" },
          { id: "name", title: "“Shinnecock” has been read as “at the level land” or “at the big neck”", text: "A 1911 place-name study read Shinnecock as “at the level land or country”; linguist Ives Goddard later read it as “at the big neck.” Southampton’s 1640 records already speak of the “Shinecock plaine.”", more: "Recorded spellings include Shunnecock, Shinecock and Shinnacock. English use of the name spread from the plain across the hills, bay, canal and reservation. Both readings are attributed interpretations, not a settled translation, and colonial records document spelling and use; they do not define Shinnecock identity.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911), pp. 81–82; Ives Goddard, “A Note on Shinnecock in Munsee” (2017); Southampton Town Records, December 13, 1640" },
          { id: "bluefish", title: "Shinnecock elders recorded when the bluefish come into the bays", text: "A 2014 catalogue of Shinnecock elders’ knowledge follows bluefish from spring into late fall, when the bays become their feeding and breeding waters: knowledge built over generations of fishing.", more: "The same catalogue remembers blowfish caught in Shinnecock Bay, the Atlantic and around Mecox Bay, and smooth dogfish moving north in spring and south in autumn. Its attention to season and water conditions records knowledge built through repeated fishing.", source: "Shinnecock Environmental Department, Natural Resources Identified by Shinnecock Elders (2014), p. 2" },
          { id: "mussels", title: "Shinnecock elders left some mussels in place to hold the shore together", text: "Elders distinguished gathering from caring: blue mussels were preferred for eating, while ribbed “bank” mussels were often left alone because their beds held the shoreline together.", more: "Shells from both kinds of mussel were worn as jewelry. Crabbing is remembered as long-standing work along the water’s edge: blue-claw crabs, including their soft-shell stage, were food, while lady crabs usually were not eaten.", source: "Shinnecock Environmental Department, Natural Resources Identified by Shinnecock Elders (2014), p. 4" },
          { id: "oysters", title: "The Shinnecock Nation has run its own shellfish hatchery since 1980", text: "Oysters fed Shinnecock families, and their crushed shells enriched planting fields. In 1980 the Nation established a shellfish hatchery, which continues the work of growing oysters and clams.", more: "Fall scalloping is remembered as a much-anticipated part of Shinnecock food life, though elders noted poorer bay-scallop harvests in the years before 2014. Whelks gave food, shell ornaments and whistles.", source: "Shinnecock Environmental Department, Natural Resources Identified by Shinnecock Elders (2014), pp. 4–5" },
          { id: "wampum", title: "Wampum beads, cut from Long Island clam shells, were never just money", text: "White and purple wampum beads were made from the shells of hard clams (quahogs). Shinnecock elders describe them as carrying meaning in relationships of exchange, unlike the cash value colonists later gave them.", more: "Hard clams connected Shinnecock meals with tools, agriculture and wampum. Along the same shores, eelgrass served as weaving material and insulation for dwellings, and the elders’ catalogue notes restoration efforts underway in 2013.", source: "Shinnecock Environmental Department, Natural Resources Identified by Shinnecock Elders (2014), pp. 6–7" },
          { id: "language", title: "Shinnecock, Unkechaug and Montaukett people are bringing their language back", text: "Through the Algonquian Language Revitalization Project at Stony Brook University, Shinnecock people are relearning and teaching their Algonquian language with Unkechaug and Montaukett collaborators.", more: "The project works from historical word lists and community knowledge, and members of the nations as well as Stony Brook students are learning the languages. The shared work shows how distinct nations keep relationships across the lines on a map.", source: "Stony Brook University Department of Linguistics, Algonquian Language Revitalization Project" }
        ],
        "unkechaug-ancestral-land": [
          { id: "poospatuck", title: "The Unkechaug Nation still lives at Poospatuck in Mastic", text: "Unkechaug families live on the Poospatuck Reservation in Mastic, where Poospatuck Creek runs to the Forge River and Moriches Bay, the waters their ancestors fished for generations.", more: "The Unkechaug Indian Nation is recognized by New York State and governs its reservation community, with its own government, language work and relationships with land and water. The name connects Unkechaug people with Yaphank and Weeks Pond, Mastic-area places and South Shore waterways.", source: "National Park Service, Native American Heritage at Fire Island National Seashore; On This Site, Unkechaug Indian Reservation" },
          { id: "reservation-1700", title: "The Poospatuck Reservation began with a 1700 deed for 175 acres", text: "In 1700, William “Tangier” Smith, who held a vast estate on the South Shore, signed a deed setting aside 175 acres for the Unkechaug at Poospatuck. Over the centuries the reservation shrank to about 55 acres.", more: "The small area kept as a reservation is not the full extent of Unkechaug belonging, which reaches across Mastic, Moriches and Brookhaven’s waters. The wider homeland and the reservation are distinct but deeply connected parts of Unkechaug continuity.", source: "William Smith deed, July 2, 1700, as quoted on the Poospatuck Reservation historic marker (William G. Pomeroy Foundation); Mastic Peninsula Historical Society" },
          { id: "jefferson-1791", title: "Thomas Jefferson wrote down Unkechaug words at Poospatuck in 1791", text: "On a June 1791 trip to Long Island, Thomas Jefferson visited Poospatuck and recorded about 200 Unkechaug words, from animals and plants to numbers. His list survives at the Smithsonian and the American Philosophical Society.", more: "Jefferson believed the language was disappearing and took the Unkechaug women he met to be among its last speakers. More than two centuries later, his list is one of the sources Unkechaug people use to bring the language back.", source: "“Vocabulary of the Unquachog or Puspatuck” (1791), National Anthropological Archives, Smithsonian Institution; American Philosophical Society" },
          { id: "language", title: "Unkechaug people are teaching their language again", text: "Through the Algonquian Language Revitalization Project at Stony Brook University, Unkechaug people work with Shinnecock and Montaukett collaborators to relearn their language and teach it to the next generation.", more: "Continuance is visible in work led by Native people. Historical records such as Jefferson’s word list join community knowledge, and members of the nations as well as Stony Brook students are learning the languages.", source: "Stony Brook University Department of Linguistics, Algonquian Language Revitalization Project" },
          { id: "waters", title: "Fishing and care for the bays tie Unkechaug families to the South Shore", text: "Generations of fishing, family life and care for the waters connect the Poospatuck community to a much wider South Shore homeland, from the Forge River to Moriches Bay and beyond.", more: "The National Park Service describes generations of Unkechaug life along these waterways. Land, water, language, governance and community run from early records to the present.", source: "National Park Service, Native American Heritage at Fire Island National Seashore" },
          { id: "tobacus", title: "In 1693 Unkechaug Sachem Tobagus challenged Brookhaven’s claim to the beach", text: "In 1693 Sachem Tobagus (also written Tobacus) challenged Brookhaven’s claim to South Beach on Fire Island. English governors and William “Tangier” Smith used patents and estate law to claim the beach and bay anyway.", more: "Seventeenth-century Brookhaven records also name him in land transactions and boundary descriptions. Native relationships to the barrier beach continued through Unkechaug, Secatogue and Shinnecock stewardship.", source: "On This Site, Fire Island: Native Objections and English Estate Claims; John A. Strong, The Unkechaug Indians of Eastern Long Island: A History" },
          { id: "respect", title: "Some Unkechaug places are kept off maps on purpose", text: "Archaeological, ceremonial and family places around Poospatuck and Mastic are described only broadly, so they stay protected. Respect means following the Nation’s decisions about access and cultural knowledge.", more: "Historian John A. Strong’s work shows why the familiar “thirteen tribes” map should be handled carefully: the Unkechaug name appears in colonial records, while community life continued through land pressure, adaptation and survival.", source: "On This Site, Unkechaug Ancestral Land" }
        ],
        "montaukett-ancestral-land": [
          { id: "homeland", title: "Montauk takes its name from the Montaukett, who still call it home", text: "For thousands of years Montaukett families lived at Montauk and Indian Fields, fishing its waters and gathering along its shores. Montaukett people still live on the East End and keep their nation alive.", more: "Montaukett history connects language, fortified high land, shoreline movement, leadership, land loss and continued presence, from Montauk to Freetown and Eastville and as far as Wisconsin.", source: "Montauk Tribe of Indians; On This Site, Montaukett Ancestral Land" },
          { id: "hither-woods-1662", title: "A 1662 agreement let East Hampton claim Hither Woods but kept Montaukett rights", text: "During a time of displacement, the Montaukett made an agreement that helped English East Hampton claim Hither Woods, yet it preserved Native houses, firewood and protections for planted corn.", more: "Its promises and restrictions show how control of land changed hands without ending Native relationships to it, a pattern that runs through Montauk’s history until the 1879 sale.", source: "On This Site, Hither Woods: Refuge, Land Agreements and Continuing Rights" },
          { id: "auction-1879", title: "In 1879 Montauk was auctioned off and Montaukett families were pushed out", text: "A court-ordered auction in 1879 sold more than 10,000 acres of Montauk to Brooklyn businessman Arthur Benson for $151,000. The sale was supposed to respect Montaukett rights, but Benson paid families to leave Indian Fields.", more: "Families were offered plots in Freetown, north of East Hampton, and their empty houses were torn down. When the Montauketts went to court to get their land back, the judge sided with Benson, leading to the 1910 ruling.", source: "Montauk Library Historic Archives; East Hampton Star, “Righting Centuries’ Wrongs” (November 21, 2024); On This Site, Montauk Auction Landscape (1879)" },
          { id: "1910", title: "In 1910 a New York judge wrongly declared the Montaukett “extinct”", text: "When Chief Wyandank Pharaoh sued to recover Montauk, Justice Abel Blackmar ruled in 1910 that the tribe no longer existed, pointing to intermarriage and stereotypes, while living Montauketts stood in his court.", more: "The ruling stripped away state recognition and helped make the loss of Montauk look legal, but it did not end Montaukett identity, kinship or political advocacy. Historians describe it as a racially motivated decision.", source: "Pharaoh v. Benson (N.Y. Sup. Ct. 1910); John A. Strong, The Montaukett Indians of Eastern Long Island" },
          { id: "recognition", title: "Montauketts are still fighting to restore their New York recognition", text: "Bills to restore Montaukett state recognition have passed New York’s legislature again and again, but governors vetoed them seven times, most recently in December 2025. A new bill passed both houses in 2026.", more: "Recognition is a legal status, not proof that a people exists: Montaukett families and organizations have kept up community life, cultural education and advocacy the whole time. As of September 2026 the 2026 bill (A10129) had not become law.", source: "East Hampton Star, “Montaukett Recognition Vetoed Again” (December 25, 2025); New York State Assembly, A10129 (2026)" },
          { id: "brothertown", title: "Montaukett ancestors helped found the Brothertown Indian Nation", text: "In the late 1700s, Christian Montaukett, Pequot, Niantic and other coastal Native families united as Brothertown, settled among the Oneida in New York in 1784, and moved to Wisconsin in the 1830s.", more: "Mohegan minister Samson Occom was one of its founders. The Brothertown Indian Nation continues in Wisconsin today, so Montauk’s history reaches all the way to the Great Lakes.", source: "Wisconsin Historical Society; Brothertown Indian Nation" },
          { id: "pharoah-brothers", title: "Two Montaukett boys were indentured at Sylvester Manor in 1829", text: "In 1829 Montaukett brothers William and Isaac Pharoah, ages eight and five, were bound to work at Sylvester Manor on Shelter Island until age 21. William escaped in 1840 and sailed on a whaling voyage.", more: "Isaac completed his indenture and stayed at the Manor. Their story connects Montaukett families with Manhansett land on Shelter Island and with the whaling work that drew many Native men to sea.", source: "On This Site, Sylvester Manor; Sylvester Manor" },
          { id: "pharoah-1798", title: "In 1798 Sachem George Pharoah shared Montaukett words to be written down", text: "In 1798 George Pharoah, the 66-year-old Montaukett sachem, repeated words of his language for John Lyon Gardiner, who wrote them down. The list was later published for readers today.", more: "Gardiner wrote that only about seven people could then speak the language, which was spoken with little difference across the East End. The Montaukett dialect was understood by Shinnecock, Unkechaug and New England peoples.", source: "Gaynell Stone, ed., Languages and Lore of the Long Island Indians, vol. IV" },
          { id: "2024", title: "In 2024 East Hampton honored the Montaukett Indian Nation", text: "In November 2024, during Native American Heritage Month, East Hampton Town honored Chief Robert Pharaoh and Sandi Brewster-Walker with a proclamation recognizing the Montaukett Indian Nation.", more: "That year the Montauk Indian Museum stayed closed while the Montauk Historical Society reconsidered its exhibits, after new federal NAGPRA rules strengthened requirements for consulting tribes and returning ancestors and sacred objects.", source: "Christopher Walsh, “Town Recognizes the Montaukett Indian Nation,” East Hampton Star, November 14, 2024; Denis Hartnett, “Montauk Indian Museum Is in Flux,” East Hampton Star, August 1, 2024" }
        ],
        "corchaug-ancestral-land": [
          { id: "homeland", title: "The Corchaug lived on the North Fork long before Southold was founded", text: "Corchaug families farmed, fished and made wampum across the North Fork, roughly from Wading River toward Orient Point, long before English settlers founded Southold in 1640. Their name lives on in Cutchogue.", more: "That territory is an approximate description from nineteenth-century histories, not a rigid political boundary. Corchaug land use and kinship did not fit later town lines.", source: "John A. Strong, The Algonquian Peoples of Long Island from Earliest Times to 1700; On This Site, Corchaug Ancestral Land" },
          { id: "fort-corchaug", title: "Fort Corchaug in Cutchogue is a National Historic Landmark", text: "On Downs Creek in Cutchogue, the Corchaug built a palisaded fort in the 1600s. Archaeologists found shell, stone tools and finished wampum beads there, and it became a National Historic Landmark in 1999.", more: "The North Fork was one of the most important wampum-making regions in seventeenth-century America, and the beads and whelk shell suggest wampum was made in and around the fort’s walls. The site is protected within Downs Farm Preserve.", source: "National Park Service, National Register of Historic Places (1974) and National Historic Landmark (1999); Ralph Solecki, Archeological Position of Historic Fort Corchaug (1950); Cutchogue-New Suffolk Historical Council" },
          { id: "saugust", title: "English settlers took over Corchaug fields at Saugust", text: "After English settlement, newcomers took over cleared Corchaug fields at Saugust, while deeds, fences and grazing livestock narrowed Native access to land and the shore.", more: "Corchaug people did not simply disappear: individuals and families remained, moved among related Native communities and asserted their land rights.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "robins-island", title: "A 1600s agreement kept Native fishing rights at Robins Island", text: "When Robins Island in Peconic Bay, known as Anchannock, passed to colonists between 1651 and 1665, the agreement still spelled out Native rights to fish and gather shells there.", more: "Rights written into colonial agreements show that land changing hands did not end Native use of the water, and that Corchaug and neighboring people negotiated to keep what mattered.", source: "On This Site, Anchannock / Robins Island" },
          { id: "1763", title: "In 1763 Corchaug people petitioned to defend their land at Indian Neck", text: "More than a century after Southold was founded, Corchaug people were still asserting their rights: a 1763 petition concerned land at Indian Neck and South Harbor.", more: "Reading colonial deeds alongside archaeology, family history and the 1763 petition keeps dispossession visible while recognizing Corchaug continuity, adaptation and legal resistance across generations.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "descendants", title: "No Corchaug reservation remains, but that doesn’t mean no descendants", text: "There is no reservation bearing the Corchaug name today. That absence is not proof that Corchaug people left no descendants; families moved, married and found refuge among related Native communities.", more: "Particular family connections require family and community evidence; the map does not appoint another nation as a substitute for Corchaug identity.", source: "On This Site, Corchaug Ancestral Land" },
          { id: "diplomacy", title: "North Fork records show Corchaug diplomacy and wampum trade", text: "Records involving Southold, Paucamp, Momoweta and neighboring Native leaders show diplomacy, trade and wampum moving across the North Fork’s waters in the 1600s.", more: "Corchaug history appears in land records, place-name sources, community memory and preservation discussions across the North Fork. Sensitive archaeological, burial and ceremonial places are not identified.", source: "On This Site, Corchaug Ancestral Land" }
        ],
        "manhansett-ancestral-land": [
          { id: "island", title: "Shelter Island’s Native name was Manhansack-Ahaquatuwamock", text: "Shelter Island is the homeland of the Manhansett, recorded in colonial papers as Manhansack-Ahaquatuwamock. Its waters connected Native communities long before a colonial plantation occupied the island.", more: "Early English records connect Manhansett people and leaders with Shelter Island and nearby Peconic waters through wampum, diplomacy, labor and land negotiations.", source: "On This Site, Manhansett Ancestral Land" },
          { id: "name", title: "“Manhansett” is read as “island land” or “neighborhood”", text: "The name Manhansett is read as “island land” or “neighborhood,” a fitting name for a people of an island in the Peconic bays. An older reading as a river mouth is rejected.", more: "Related forms include Manhansick and Manhansack-Ahaquatuwamock. The ending is understood as “at” or “about” rather than a river-mouth element.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "montauk", title: "The Manhansett had close political and family ties with the Montaukett", text: "Researchers at the University of Massachusetts Boston describe the Manhansett as affiliated with the Montaukett, linked by political and cultural relationships across the East End.", more: "Historical affiliation does not by itself establish the descent of every present-day family, but it challenges the idea that each named community was isolated or vanished when its land passed into colonial hands.", source: "Fiske Center for Archaeological Research, University of Massachusetts Boston" },
          { id: "plantation", title: "In 1651 an English plantation took over Shelter Island", text: "In 1651 a provisioning plantation was established on Shelter Island, Manhansett land. Sylvester Manor’s own history says it was tied to Barbados sugar trade and depended on slavery and forced labor.", more: "The plantation transformed an inhabited homeland; it did not replace an empty landscape. Later, in 1829, two Montaukett boys were indentured there.", source: "Sylvester Manor; On This Site, Sylvester Manor" },
          { id: "wampum", title: "Manhansett workers made wampum at Sylvester Manor", text: "Archaeologists from the Fiske Center at UMass Boston found evidence of Native labor and wampum-making at Sylvester Manor: Manhansett people working on the plantation built on their own land.", more: "Wampum, diplomacy and labor appear together in the early records of Shelter Island, alongside the land negotiations that turned an Indigenous homeland into written boundaries.", source: "Fiske Center for Archaeological Research, University of Massachusetts Boston" },
          { id: "respect", title: "Shelter Island’s burial places are kept off public maps", text: "Shelter Island holds Manhansett burial places and family histories. They are left out of public maps and directions so they stay protected, with Native voices central to how this history is told.", more: "Remembering Manhansett ancestry calls for respect for descendant knowledge and care for cultural places.", source: "On This Site, Manhansett Ancestral Land" }
        ],
        "setauket-ancestral-land": [
          { id: "nation", title: "Setauket is the homeland of the Setalcott Nation", text: "The town of Setauket carries the name of the Setalcott Nation, whose homeland around Setauket, Stony Brook and Port Jefferson reaches back thousands of years and continues through descendant families.", more: "Setauket and Setalcott homelands are remembered along North Shore necks, harbors, streams and inland routes as far as Wading River.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "christian-avenue", title: "Christian Avenue in Setauket is a Black and Indigenous community", text: "Setalcott ties continue through descendant families, including the Black and Indigenous community around Christian Avenue, now part of the Bethel–Christian Avenue–Laurel Hill Historic District.", more: "Preservation work there carries forward histories of Native, African American and mixed-heritage family life, labor, kinship and local cultural education.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "last-member", title: "The Setalcott reject the old claim that their nation died out", text: "Outsiders once declared the Setalcott gone whenever someone was called the nation’s “last” member. In 2025 the Nation and the Three Village Historical Society publicly rejected that claim.", more: "Their collaboration places descendant knowledge at the center of this history. Recorded elder interviews have been collected since the 1980s.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "waters", title: "The Setalcott Nation is restoring oysters and kelp in its home waters", text: "With a 2025 restoration grant, the Nation is planting native plants, studying an oyster hatchery at Conscience Bay and planning kelp farming at Poquott.", more: "These are present-day expressions of responsibility to ancestral waters, not simply commemorations of the past. At the wetland opening, the Nation’s youth chair joined the council co-chairs, bringing another generation into the work.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "council", title: "Setalcott council co-chairs Helen Sells and Robert Thompson lead today", text: "Helen Sells and Robert “Silver Wolf” Thompson co-chair the council named in the 2025 statement, which also honors Gail “Chief Running Water” Revis and historian Theodore Green.", more: "Family historian Kevin Sells adds his perspective: his 2023 interview at the Three Village Historical Society connects remembered relatives and reunions with museum interpretation.", source: "Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "warawakmy", title: "In 1655 the Setauket sachem Warawakmy signed the Setauket deed", text: "On April 14, 1655, a deed for Setauket land was signed by Warawakmy, named as a Setauket sachem. Deeds like it recorded colonial claims but left out much of Native law, kinship and understanding of land.", more: "Wyandanch is not named in that deed. Records around Warawakmy point to people negotiating, surviving and keeping a presence in a changing Brookhaven landscape.", source: "Brookhaven Town Records" },
          { id: "name", title: "“Setauket” is read as “land at the mouth of a river”", text: "Setauket has been interpreted as “land at the mouth of a river or creek,” an early twentieth-century reading rather than a final community translation. Records spell it Setalcott, Seatauke, Setokett and more.", more: "Recorded forms also include Sichteyhacky, Setawke and Selasacott. At Stony Brook, members of the nations as well as students are learning the languages.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911); Stony Brook University Department of Linguistics" }
        ],
        "nissaquogues": [
          { id: "river", title: "The Nissequogue River carries the name of the people who lived along it", text: "Generations of Nissequogue people lived along this river, its shores and nearby North Shore places such as Smithtown and Stony Brook. The river’s name is one of the clearest traces of that homeland.", more: "The river is more than a surviving word: it connects the older Nissequogue homeland with the shores and settlements recorded later.", source: "On This Site, Nissequogue Ancestral Land" },
          { id: "deeds", title: "Smithtown grew from deeds that narrowed Nissequogue land", text: "Colonial deeds and the growth of Smithtown narrowed Nissequogue control of the river valley, but those papers did not record every family’s movements, relationships or continuing belonging.", more: "Seventeenth-century Dutch and English paperwork preserves Nissequogue-related names, showing Native geography entering colonial treaty, town and boundary systems through spellings shaped by non-Native record keepers.", source: "On This Site, Nissequogue Ancestral Land" },
          { id: "neighbours", title: "Matinecock and Setalcott neighbors still live on this North Shore", text: "The Matinecock to the west and the Setalcott to the east remain present today. Their family histories reach beyond the separate territories drawn on maps, including the Nissequogue homeland between them.", more: "Their public accounts describe descendant families, cultural responsibilities and relationships that do not fit neatly inside the familiar “thirteen tribes” map.", source: "Flushing Town Hall (2018); Three Village Historical Society and Setalcott Nation (2025)" },
          { id: "smithtown", title: "Nissequogue people challenged Richard Smith’s claim to their land", text: "After a 1659 deed, Nissequogue people disputed Richard Smith’s claim to the river valley, and leaders such as Nesatesconsett pressed claims of their own. Later agreements recorded payments and rights they kept.", more: "Colonial patents then strengthened Smith’s claim into an inheritable estate and required English settlement: the path by which Smithtown took shape on Nissequogue land.", source: "Records of the Town of Smithtown, Long Island, N.Y. (1898), pp. 3–5, 8–9, 16–17; On This Site, Smithtown: Contested Land and Native Rights" },
          { id: "extinct", title: "A tribal name missing from later records doesn’t mean a people vanished", text: "Later records often stopped using the Nissequogue name. A missing label in colonial paperwork is not a sound basis for declaring a people extinct; families moved, married and lived on.", more: "Later boundary disputes and place-name studies keep the Nissequogue River and nearby villages visible as Native geography within a modern North Shore landscape.", source: "On This Site, Nissequogue Ancestral Land" }
        ],
        "secatogue-ancestral-land": [
          { id: "bay", title: "The Secatogue lived along the creeks and marshes of Great South Bay", text: "Secatogue people lived along the creeks, meadows and shores of Great South Bay, around today’s Islip and Bay Shore, long before colonial towns were founded there.", more: "Secatogue history is tied to South Shore tidal creeks, bay travel, colonial deed records, community gatherings and later descendant history.", source: "National Park Service, Native American Heritage at Fire Island National Seashore; On This Site, Secatogue Ancestral Land" },
          { id: "fire-island", title: "The Secatogue are among Fire Island’s first peoples", text: "The National Park Service counts Secatogue people among the ancestral communities of the Great South Bay and Fire Island, whose shores and marshes were part of their homeland.", more: "The historical records connect the Secatogue name to shore, creek and meadow places and to relationships with neighboring Native leaders.", source: "National Park Service, Native American Heritage at Fire Island National Seashore" },
          { id: "name", title: "Dutch records called Secatogue land Sichetanyhacky", text: "In Dutch-period records, Sichetanyhacky (also Siketenhacky) names the country of the Secatogue, at the eastern edge of Massapequa land on the South Shore.", more: "Colonial spellings like these were written by Dutch and English record keepers; they are evidence of a Native place and people, not a single standardized name.", source: "Documents Relative to the Colonial History of the State of New York, vol. XIV; William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "islip-1683", title: "A 1683 agreement in Islip kept Native rights to live, plant and fish", text: "When William Nicoll made a 1683 agreement with Winnaquaheagh for land in Islip, it kept Native rights to live, plant and fish on the land he had not developed, and Native residents stayed.", more: "English patents later strengthened private estate claims. Islip’s separate estates show why a deed, a colonial patent and a town are different steps in the history of land loss.", source: "Winnaquaheagh–William Nicoll agreement, November 29, 1683; On This Site, Islip: Colonial Estates and Continuing Native Rights" },
          { id: "captree-1814", title: "In 1814 a court rejected rival colonial claims to Captree Island", text: "Secatogue people are named in a 1705 beach deed. When two colonial parties later fought over Captree, Oak and Grass islands in Great South Bay, an 1814 decree rejected both of their titles.", more: "Later town agreements over the islands did not amount to new Native consent: the original Native relationship to these bay islands was never simply handed over.", source: "On This Site, Captree and the Bay Islands: Native Agreements and Competing Claims" },
          { id: "visible", title: "Land sales made the Secatogue harder to see in records, not gone", text: "Land transactions and settlement changed how Secatogue people appeared in written records. A less visible name is not evidence that a people vanished.", more: "Land records and colonial restrictions show Native presence under increasing pressure rather than disappearance. Secatogue histories continued through kinship, movement and relationships with neighboring communities.", source: "On This Site, Secatogue Ancestral Land" },
          { id: "living-coast", title: "Unkechaug and Shinnecock neighbors show the South Shore never emptied", text: "The Unkechaug community at Poospatuck and the Shinnecock Nation keep Native life visible along this coast, so the story of a vanished Native South Shore does not hold.", more: "Their presence does not establish that every Secatogue family became part of either nation; it does show Native continuance across the wider coastal region.", source: "National Park Service; Shinnecock Indian Nation" }
        ],
        "massapequa-ancestral-lands": [
          { id: "homeland", title: "Massapequa is named for the Native homeland around South Oyster Bay", text: "Today’s Massapequa takes its name from a Native homeland around South Oyster Bay and Fort Neck, with its ponds, brook, meadows and waterways.", more: "Massapequa and Massapeague homelands center South Oyster Bay, Fort Neck and related South Shore waters, including the Fort Massapeag site. The name belongs to both a place and a people.", source: "On This Site, Massapequa Ancestral Lands" },
          { id: "tackapousha", title: "Sachem Tackapousha defended Massapequa land against colonists", text: "In the mid-1600s the Massapequa sachem Tackapousha defended Native interests as Dutch and English settlement pressed into fields, meadows and waterways, signing treaties and challenging claims.", more: "Massapequa history includes agreements, deeds, diplomacy, fortification and disputed colonial authority around South Oyster Bay and Fort Neck. These records show land loss as a contested process involving Native leadership.", source: "John A. Strong, The Algonquian Peoples of Long Island from Earliest Times to 1700" },
          { id: "1639", title: "A 1639 deed preserves the names of Massapequa people", text: "The 1639 Marossepinck deed names Mechowodt, Piscamoc and others, and a 1656 treaty names Tackapousha with allied western Long Island leaders: real people behind the place names.", more: "The 1639 deed also names Wattewochkeouw, Kachpoher and Ketchquawars, and the 1658 Massapeoque Meadows record preserves Massapequa, Rockaway and Secatogue names together.", source: "Documents Relative to the Colonial History of the State of New York, vol. XIV; John A. Strong" },
          { id: "name", title: "“Massapequa” is read as “great water land”", text: "Massapeague is interpreted as “great water land” or “land on the great cove,” fitting a homeland centered on South Oyster Bay. Colonial records spell it dozens of ways.", more: "Related forms include Marsapeague, Masepeage, Marossepinck and Massepinc. Necochawodt is a personal name rather than a confirmed place name.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "meadows", title: "Massapequa’s tidal meadows were both a home and a contested resource", text: "The salt meadows and tidal waters of South Oyster Bay fed Native life around Massapequa. Later, colonists claimed those same meadows for grazing hay, and the records of the dispute preserve Native names.", more: "The 1658 Massapeoque Meadows record names Massapequa, Rockaway and Secatogue people together, a sign of how wetlands could be both a home landscape and a resource fought over.", source: "On This Site, Massapeoque Meadows / South Oyster Bay; An Illustrated History of Massapequa" },
          { id: "villages", title: "Long Island had villages, not thirteen neat tribes", text: "The popular list of Long Island’s “thirteen tribes” makes Native life look like fixed townships. Life was organized through villages, kinship, diplomacy, seasonal movement and shared land and water.", more: "Massapequa remains a homeland name with continuing community memory, best understood as a guide to people and place rather than a claim that every modern line marks an old political border.", source: "John A. Strong, The Thirteen Tribes of Long Island: The History of a Myth" }
        ],
        "matinecock-traditional-land": [
          { id: "homeland", title: "The Matinecock homeland stretches from Queens across the North Shore", text: "Matinecock ancestral land reaches from northeastern Queens across Long Island’s North Shore, through Oyster Bay, Glen Cove, Cold Spring Harbor and Huntington. Matinecock families still live here.", more: "Colonial deeds and place-name spellings record land pressure, while later sources and public memory show continued Native presence through descendant families and cultural work.", source: "Flushing Town Hall (2018); On This Site, Matinecock Traditional Land" },
          { id: "1931", title: "In 1931 Matinecock graves were moved to widen Northern Boulevard", text: "When Northern Boulevard in Little Neck was widened in 1931, about 30 Matinecock ancestors were removed from their burial ground despite descendants’ opposition and reburied at Zion Episcopal Church in Douglaston.", more: "The marker over them, a split boulder, calls them “the last of the Matinecoc,” yet descendants still live in the area. In 2015 the corner of Northern Boulevard and Marathon Parkway was co-named Matinecock Way.", source: "Queens Public Library, via Urban Archive; Zion Episcopal Church, Douglaston; On This Site, Matinecock Way" },
          { id: "1969", title: "In 1969 Matinecock leaders confronted Huntington over their land", text: "In 1969 Princess Sun Tama (Ann Harding Murdock) and the Matinecock Indian Council confronted Huntington officials, challenging the town’s reliance on colonial deeds to claim Matinecock land.", more: "They insisted that Matinecock title, memory and political identity did not depend on whether officials acknowledged them. Recognition by outsiders, ownership in deeds and Native belonging are different matters.", source: "On This Site, Matinecock Town Hall Confrontation (1969)" },
          { id: "huntington-1653", title: "Huntington’s 1653 “First Purchase” came with conditions", text: "On April 2, 1653, Raseokan and other Native signers made an agreement with three Englishmen for land from Cold Spring Harbor toward Northport Harbor. It required the bounds to be shown within twenty days, or it was void.", more: "Its boundary language and conditions matter as much as the word “purchase.” It was one step in a longer expansion toward the South Shore, as later acquisitions and patents turned Matinecock homeland into town-held and private property.", source: "Town of Huntington Archives, The First Purchase (April 2, 1653), transcription by Town Archivist Antonia S. Mattheou" },
          { id: "flushing", title: "Flushing’s settlers had to respect Native gathering rights", text: "Dutch director Willem Kieft authorized Flushing’s settlers in 1645. A later agreement between named Native proprietors and town agents covered the land they occupied, while keeping Native rights to gather there.", more: "Agreements like this show that colonial towns in present-day Queens grew over Native land in steps, and that Native people negotiated to keep using it.", source: "Henry D. Waller, History of the Town of Flushing (1899); On This Site, Flushing: A Charter Before a Native Land Agreement" },
          { id: "2018", title: "In 2018 Matinecock descendants shared their history at Flushing Town Hall", text: "At a 2018 gathering at Flushing Town Hall, Matinecock descendants publicly shared their own history and cultural protocols, telling the story in their own voices.", more: "Family historian Donna Gentle Spirit Barron and members of the Ceaser family make Matinecock and Montaukett kinship visible: specific family relationships, not interchangeable identities.", source: "Flushing Town Hall (2018)" },
          { id: "name", title: "“Matinecock” may mean “at the place of observation”", text: "Matinecock is interpreted as “at the place of observation,” “at the place to look around from” or “at the hilly land,” fitting the North Shore’s hills and harbors.", more: "Recorded forms include Matinnekonck, Martinnehouch, Matinnecoke, Montinnecok and Metinicok.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" }
        ],
        "merrick-ancestral-land": [
          { id: "homeland", title: "Merrick is named for the Merikoke people of the South Shore plains", text: "Today’s Merrick recalls the Merikoke homeland of open plains, creeks and South Shore bays in what is now Nassau County. Native people still gather and assert belonging on this coast.", more: "Merrick/Merikoke history overlaps with Massapequa, Rockaway, Canarsie, Secatogue and Matinecock histories. The name keeps people visible where modern maps often remember only roads and property lines.", source: "On This Site, Merrick Ancestral Land" },
          { id: "1675", title: "In 1675 Sachem Tackapousha said Hempstead never paid for Merrick land", text: "At a hearing on August 5, 1675, Tackapousha and other Native speakers told colonial officials that Hempstead had never paid for Mercock (Merrick) land, challenging the town’s evidence.", more: "They also challenged another sachem’s authority to give the land away. A 1657 Hempstead confirmation already bore the marks of Takaposha, Wantagh, Chegonoe and others.", source: "On This Site, 1675 Mercock Land Dispute; John A. Strong, The Algonquian Peoples of Long Island from Earliest Times to 1700" },
          { id: "contested", title: "Hempstead’s 1643 land deal was disputed, not a simple sale", text: "In 1643 Native representatives of Massapequa, Merrick and Rockaway communities made a land transaction with English purchasers Robert Fordham and John Carman, but its meaning was argued over for decades.", more: "Such papers record diplomacy, translation, boundary disputes and Native legal resistance, not just sales, during the years colonial governments turned Native homelands into English town land.", source: "On This Site, Merrick Ancestral Land" },
          { id: "name", title: "“Merrick” is read as “bare land,” the open Hempstead Plains", text: "Merrick is connected with an Algonquian meaning of bare land or plain, fitting the Hempstead Plains, once a vast open grassland.", more: "Recorded forms include Merriack, Meracock, Moroke, Mericoke, Mercock and Meroke. Written down by English and Dutch record keepers, they are historical evidence rather than one final spelling.", source: "William Wallace Tooker, Indian Place-Names on Long Island (1911)" },
          { id: "2023", title: "In 2023 Native paddlers gathered by canoe at Jones Beach", text: "A 2023 Native canoe gathering at Jones Beach connected this South Shore with Native people who continue to travel its waters and assert their belonging here.", more: "The Wantagh High School mascot debate and the canoe gathering connect this region with present-day questions of Indigenous representation and sovereignty. The Montaukett Nation’s 2022 Hempstead Lake invitation documents public outreach too.", source: "The Long Island Advocate (2023)" },
          { id: "learning", title: "Markers and preserves near Merrick teach its Native history", text: "The Lister Park Greenway marker introduces Native histories of the Mill River, and Hempstead Plains Preserve links prairie conservation with the history of land once held in common.", more: "Meroke Preserve carries a regional name along Newbridge Creek, and the Duke’s Laws roadside marker connects a Hempstead street corner with colonial restrictions on Native land, trade and worship.", source: "On This Site, Merrick Ancestral Land" }
        ],
        "rockaway-traditional-land": [
          { id: "lenape", title: "Rockaway is part of the Lenape homeland", text: "Rockaway preserves a Native name on the shores of a much older Lenape homeland, where Jamaica Bay, islands and waterways connected people long before colonial deeds divided the land.", more: "Rockaway history spans western Long Island, Jamaica Bay, Hempstead Bay and the South Shore islands, and overlaps with Merrick, Massapequa and Canarsie through diplomacy, trade and kinship.", source: "National Park Service" },
          { id: "continue", title: "Lenape people live on, in New York and far beyond", text: "Displacement did not end Lenape life: Lenape communities continue in their homeland and in nations beyond New York, many of them far from the coast their ancestors knew.", more: "Lenape Center describes a people whose present-day nations and cultural work extend across a diaspora as well as the ancestral homeland. Being forced from land can separate a community from it without ending its relationship to it.", source: "Lenape Center" },
          { id: "1655", title: "A 1655 deed preserves the names of Rockaway leaders", text: "The 1655 Rockaway Neck deed names Ruckquaheag, Ronnessoke and Adam, also called Achitteronose, among others: people of Rockaway recorded in the colonial paperwork.", more: "Earlier records include a 1639 western Long Island deed boundary reaching from Rockaway and the 1643 Hempstead deed linking Rockaway with Massapequa and Merrick communities.", source: "Documents Relative to the Colonial History of the State of New York, vol. XIV; John A. Strong" },
          { id: "palmer-1685", title: "In 1685 an English patent claimed Rockaway’s Native coastal homeland", text: "In 1685 John Palmer took a deed for Rockaway and English Governor Thomas Dongan granted him a patent. The town of Hempstead disputed it, and Palmer later passed the land to Richard Cornell.", more: "Following the named parties shows how colonial title passed between settlers. Colonial title is not the same as Native disappearance: Rockaway was a Native homeland before the patent and its people’s relationships continued after it.", source: "On This Site, Rockaway: Native Homeland, English Patent and Private Transfers" },
          { id: "1657", title: "In 1657 Rockaway’s sachem met other Long Island leaders at Hempstead", text: "At a 1657 conference in Hempstead, Mangwobe of Rockaway met with Tackapousha of Massapequa, Wyandanch of Montauk, the interpreter Cockenoe and Merrick representatives.", more: "Meetings like this show Long Island’s Native leaders acting together in diplomacy. Village and archaeological references are kept broad so sensitive places are not mapped for visitation.", source: "Documents Relative to the Colonial History of the State of New York, vol. XIV" }
        ],
        "canarsie-traditional-land": [
          { id: "homeland", title: "Canarsie was a Native community in what is now Brooklyn", text: "Canarsie, also written Canarsee, carries the name of a Native community whose homeland included parts of present-day Brooklyn and Jamaica Bay. Generations lived from and cared for these shores.", more: "The name connects the modern neighborhood to the older Native geography of Brooklyn and Jamaica Bay, before Dutch and English settlement brought dispossession.", source: "National Park Service; On This Site, Canarsie Traditional Land" },
          { id: "city", title: "Brooklyn grew on Canarsie land taken through grants and patents", text: "Dutch and English grants, petitions and patents in the 1600s recorded a struggle over inhabited land. Reading them only as property transfers hides the communities whose land became the city.", more: "These records show Native land relationships being translated into colonial property systems, while Canarsie people remained part of western Long Island’s political and cultural history.", source: "On This Site, Canarsie Traditional Land" },
          { id: "gowanus-1636", title: "Gowanus in Brooklyn was Canarsee farmland before a 1636 purchase", text: "In 1636 colonists made a purchase at Gowanus, a Brooklyn landscape already cultivated by Canarsee people. Dutch records wrote the creek and bay as Gowanus, Gowanes and Gouwanes.", more: "The fields colonists wanted were already planted: purchases like this one took over working Native farmland, not empty ground.", source: "Alyssa Loorya, Eileen Kao and Elissa Rutigliano, Phase IA Documentary Study (2021, revised 2024); On This Site, Gowanus" },
          { id: "bushwick-1638", title: "In 1638 the Dutch claimed Native land along Brooklyn’s East River shore", text: "A 1638 agreement with named Native leaders gave the Dutch West India Company a claim along the East River. Company grants and later towns took over a homeland now within Greenpoint and Williamsburg.", more: "Brooklyn’s Native fields and shorelines became colonial claims through separate agreements, expanding settlement and war, one place at a time.", source: "Documents Relative to the Colonial History of the State of New York, vol. XIV; On This Site, East River Company Claim / Early Bushwick (1638)" },
          { id: "nayack-1652", title: "A 1652 agreement required Native families to leave Nayack in Brooklyn", text: "In 1652 an agreement for Nayack, in today’s southern Brooklyn, explicitly required its Native residents and their descendants to leave: one of the clearest records of removal on western Long Island.", more: "Removal did not end Lenape life: Lenape people continue in their homeland and beyond it, and cultural return to New York continues today.", source: "Documents Relative to the Colonial History of the State of New York, vol. XIV; On This Site, Brooklyn: Native Fields, Colonial Claims and Forced Removal" },
          { id: "lenape-center", title: "Lenape Center speaks for Lenape history in New York today", text: "Today Lenape people speak for their own history through institutions such as Lenape Center, connecting present-day nations with New York through art, education, language and public history.", more: "That broader continuance should not be confused with a documented genealogy for every Canarsie family.", source: "Lenape Center" },
          { id: "not-gone", title: "The Canarsie were displaced, not erased", text: "Later histories sometimes turned Canarsie into folklore or a disappearance story. Displacement and changed community names do not amount to disappearance.", more: "An acknowledgment can be honest about the limits of the surviving records while recognizing that Lenape people continue in their homeland and beyond it.", source: "On This Site, Canarsie Traditional Land" }
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
          const when = place.dateLabel ? arText(place.dateLabel) : "";
          // The title is what happened near here and when (a whole idea, not just a name);
          // the card says who they were, and opening it adds why the moment mattered.
          const why = `${arText(place.reason)} This happened at ${arText(place.place)}${when ? `, ${when}` : ""}.`;
          return arToward({
            id: `person-${slug}`, layer: "archival", kind: "note", placement: "discover",
            title: `${arText(place.eventTitle)}${when ? ` (${when})` : ""}`, name,
            caption: intro || why, more: intro ? why : "",
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
    // each with its first two teachings (their titles already name the land); opening
    // one says where that homeland begins.
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
          const where = `${title}, a neighbouring homeland, begins about ${arKm(near.km)} from here, in the direction of this bubble.`;
          const items = learnings.length
            ? learnings.map(learning => arLearning(learning, `neighbour-${entry.slug}`))
            : [{ ...arLandClips(entry, "neighbour-")[0], title: `${title} is a neighbouring homeland` }];
          return items.map(item => arToward({ ...item, image, more: [where, item.more].filter(Boolean).join("\n\n") }, here, near));
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
          .map(learning => arLearning(learning, entry.slug)));
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
        else around.push(...learnings.slice(0, 3).map(learning => arLearning(learning, entry.slug)));
      });
      const homelandSites = new Set(homelands.map(({ entry }) => Number(entry.siteId)));
      const nearby = arNearbySites(here, homelandSites);
      const island = (state.sites || []).find(site => site.slug === AR_ISLAND_SLUG && site.summary);
      around.push(...arLandHere(here, entries), ...arPlaceNames(here, new Set(nearby.map(({ site }) => site.slug)), sitePages), ...arNeighbours(here, homelands, entries));
      if (island) around.push({
        id: `island-${island.slug}`, layer: "archival", kind: "note", placement: "discover",
        title: `${arText(island.title).replace(/\s*\(.*\)$/, "")} is one of the Native names recorded for Long Island`, caption: arText(island.summary),
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
