(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NLI_LAND_HISTORY = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";
  const TITLE = "How The Land Was Lost";
  const MODE = "landloss";
  const ANCESTRAL_SLUGS = Object.freeze([
    "canarsie-traditional-land", "rockaway-traditional-land", "matinecock-traditional-land",
    "merrick-ancestral-land", "massapequa-ancestral-lands", "nissaquogues",
    "secatogue-ancestral-land", "setauket-ancestral-land", "unkechaug-ancestral-land",
    "corchaug-ancestral-land", "shinnecock-ancestral-land", "montaukett-ancestral-land",
    "manhansett-ancestral-land"
  ]);
  const CATEGORIES = new Set(["ancestral-land", "deed", "land-loss", "sovereignty", "identity", "economic-development", "land-return"]);

  function audit(data) {
    const errors = [], ids = new Set(), slugs = new Set();
    const entries = data?.entries || [];
    for (const entry of entries) {
      const key = entry.slug || entry.siteId || "unnamed";
      const fail = message => errors.push(`${key}: ${message}`);
      if (!Number.isInteger(entry.siteId) || !entry.slug) fail("requires an existing site ID and slug");
      if (ids.has(entry.siteId) || slugs.has(entry.slug)) fail("duplicate site");
      ids.add(entry.siteId); slugs.add(entry.slug);
      for (const field of ["title", "description", "historicalContext", "community", "dateLabel", "uncertainty", "sensitivity"]) {
        if (!String(entry[field] || "").trim()) fail(`missing ${field}`);
      }
      if (!entry.categories?.length || entry.categories.some(category => !CATEGORIES.has(category))) fail("invalid categories");
      if (!entry.sources?.length || entry.sources.some(source => !source.citation || !source.id)) fail("missing source citations");
      if (!Array.isArray(entry.historicMomentIds) || !entry.historicMomentIds.length || entry.historicMomentIds.some(id => !Number.isInteger(id) || id <= 0)) fail("requires normal Historic Moment references");
      if (!["point", "polygon", "both"].includes(entry.display)) fail("invalid display choice");
      if (!entry.geometry?.type || !entry.geometry.confidence || !entry.geometry.precision || entry.geometry.siteId !== entry.siteId) fail("missing geometry provenance/confidence/precision");
      if (entry.display !== "point" && !/approximat/i.test(entry.geometry?.note || "")) fail("polygon requires explicit approximation language");
      if (entry.display !== "point" && !entry.geometry?.sourceCitation) fail("polygon requires a geometry source citation");
      if (entry.reviewStatus !== "researched-and-publishable") fail("not cleared for publication");
      if (Boolean(entry.isAncestralLand) !== ANCESTRAL_SLUGS.includes(entry.slug)) fail("incorrect ancestral-land classification");
    }
    const ancestral = entries.filter(entry => entry.isAncestralLand).map(entry => entry.slug);
    if (ancestral.length !== 13 || ANCESTRAL_SLUGS.some(slug => !ancestral.includes(slug))) errors.push("requires exactly the intended 13 ancestral-land sites");
    const deed = entries.find(entry => entry.slug === "december-1685-deed-land");
    if (!deed?.modeOnly) errors.push("December 1685 Deed must be mode-only");
    return errors;
  }

  function createCatalog(data) {
    const errors = audit(data);
    if (errors.length) throw new Error(`Land-history research audit failed:\n${errors.join("\n")}`);
    const bySlug = new Map(data.entries.map(entry => [entry.slug, entry]));
    const byId = new Map(data.entries.map(entry => [String(entry.siteId), entry]));
    function entryFor(value) {
      const props = value?.properties || value || {};
      return bySlug.get(props.directus_site_slug || props.listing_slug || props.slug || props.site_slug)
        || byId.get(String(props.directus_site_id || props.site_id || props.id || ""));
    }
    function includes(value, enabled) {
      const entry = entryFor(value);
      return enabled ? Boolean(entry) : !entry?.modeOnly;
    }
    const chapterColors = ["#aa83b5", "#6e9fba", "#c89376", "#8a9d60", "#ba8397", "#9596c4"];
    function decorate(feature, site = feature) {
      const entry = entryFor(site);
      if (!entry) return feature;
      return { ...feature, properties: { ...feature.properties,
        land_history_id: entry.siteId,
        land_history_kind: entry.mapKind || (entry.isAncestralLand ? "ancestral" : "deed"),
        fillcolor: entry.isAncestralLand ? "#668f83" : entry.mapKind === "continuance" ? "#388c98" : entry.mapKind === "context" ? chapterColors[entry.siteId % chapterColors.length] : "#d89a45",
        linecolor: entry.isAncestralLand ? "#244f45" : entry.mapKind === "continuance" ? "#185965" : entry.mapKind === "context" ? "#534363" : "#763f12",
        opacity: entry.isAncestralLand ? 0.12 : 0.48
      } };
    }
    return Object.freeze({ entries: data.entries, entryFor, includes, decorate });
  }

  const outlineHovers = new WeakMap();
  function syncOutlineLayers(map, sources, enabled, hoveredIds) {
    if (!map?.getSource || !map?.getStyle) return;
    if (hoveredIds || !enabled) outlineHovers.set(map, hoveredIds || []);
    for (const source of sources) {
      if (!map.getSource(source)) continue;
      for (const kind of ["ancestral", "deed", "context", "continuance"]) {
        const id = `${source}-land-history-${kind}`;
        const filter = ["all", ["==", ["geometry-type"], "Polygon"], ["==", ["get", "land_history_kind"], kind], ["!", ["in", ["get", "land_history_id"], ["literal", outlineHovers.get(map) || []]]]];
        if (!map.getLayer(id)) {
          const before = map.getStyle()?.layers?.find(layer => layer.type === "symbol")?.id;
          map.addLayer({ id, source, type: "line", filter,
            layout: { visibility: enabled ? "visible" : "none" },
            paint: { "line-color": kind === "ancestral" ? "#244f45" : kind === "continuance" ? "#185965" : kind === "context" ? "#534363" : "#763f12", "line-width": kind === "ancestral" ? 1 : 2, "line-opacity": 0.85 }
          }, before);
        } else { map.setFilter(id, filter); map.setLayoutProperty(id, "visibility", enabled ? "visible" : "none"); }
      }
    }
  }


  const CONTEXT_SOURCES = {
    title: {url: "https://www.law.cornell.edu/wex/fee_simple", label: "Cornell Legal Information Institute: Fee simple"},
    discovery: {url: "https://supreme.justia.com/cases/federal/us/21/543/", label: "Johnson v. M’Intosh (1823), pp. 573–574, 604–605"},
    restoration: {url: "https://sogoreate-landtrust.org/sequoia-point-land-return/", label: "Sogorea Te’ Land Trust: Rinihmu Pulte’irekne land return"},
    relationships: {url: "https://americanindian.si.edu/nk360/manhattan/different-views-land/different-views-land.cshtml", label: "Smithsonian NMAI: Different Views of Land"},
    return: {url: "https://sogoreate-landtrust.org/what-is-rematriation/", label: "Sogorea Te’ Land Trust: What is Rematriation?"},
    continuance: {url: "https://www.shinnecock-nsn.gov/post/land-determination-announcement", label: "Shinnecock Nation: Land Determination, January 2025"}
  };
  const LOCAL_RIGHTS = {
    "islip-colonial-estates-native-rights": "In the 1683 agreement with William Nicoll, Winnaquaheagh and his heirs retained residence, planting, hunting and fishing on land Nicoll had not developed. That condition mattered: development could narrow where those rights applied. A colonial estate claim did not mean Native people had agreed to disappear.",
    "east-hampton-1648-agreement-land-rights": "The 1648 agreement reserved Native fishing, hunting, shells for wampum and portions of stranded whales. In 1656, the English town imposed restrictions on Native planting, dwellings and trapping. Retained rights and later restrictions must be read together to understand how settler control grew.",
    "anchannock": "The 1656/57 Sylvester–Booth agreement required Booth to permit Native people from Shelter Island to gather shells and catch fish around Robins Island without interference. A settler’s conditional half-island interest existed alongside expressly recorded Native access; the document is not proof that Native relationships with these waters ended.",
    "newtown-land-claims-native-rights": "Newtown’s 1666 deed describes Native hunting rights retained after the 1656 agreement, then records their release. The earlier agreement had not ended all Native use; settlers sought a further release as their occupation expanded.",
    "flushing-land-claims-native-rights": "The 1684 Flushing agreement reserved Native access to gather bulrushes. These materials and the places where they grew remained important even as settlers asserted ownership of the surrounding land.",
    "montauk-auction-landscape-1879": "The 1879 Montauk auction notice itself acknowledged Montauk tribal rights, including station and woodcutting rights. The auction did not announce that those rights, or Montaukett people, had ceased to exist.",
    "smithtown-land-claims-native-rights-context": "The 1665 Smithtown agreement preserved Native access to materials for mats and canoes. Rights to use a landscape and a colonist’s claim to own it could appear in the same instrument.",
    "brookhaven-land-claims-native-rights-context": "Brookhaven’s records include Gie’s retained planting and hunting rights in 1675. These clauses make continuing Native use visible within documents later used to support settler land claims."
  };
  function contextSections(entry) {
    if (!entry) return [];
    const sections = [{title: "Land relationships and a deed are different things", teaser: "In Lenape–Dutch encounters, permission to share land could be treated by newcomers as a permanent purchase. Native governance and rights to use resources were not the same as transferable private ownership.", text: "Native communities governed homelands and maintained relationships with fields, waters and other communities before European deeds. In its account of Lenape–Dutch encounters, the Smithsonian’s National Museum of the American Indian explains how permission to share land could be treated by newcomers as a permanent purchase. This regional history does not establish what every signer intended. Rights to use land or its resources are sometimes called usufruct rights. They are different from treating land as a permanently transferable private possession. Each agreement needs to be read for its parties, promises, retained rights and later enforcement.", source: CONTEXT_SOURCES.relationships}];
    if (LOCAL_RIGHTS[entry.slug]) sections.unshift({title: "Native rights in the record", text: LOCAL_RIGHTS[entry.slug], source: entry.sources.find(s => s.url) || null});
    sections.push({title: "What private title changed", teaser: "A right to plant, fish or live in a place differs from a private title that can be inherited or sold. The rights written into each local agreement matter.", text: "Fee simple is a form of private ownership that can continue indefinitely and pass to heirs or another owner, subject to law. It is different from permission to use particular resources. When reading these deeds, ask what settlers claimed to acquire, what Native people retained, and who later enforced the terms. The presence of a signature or mark does not answer all three questions.", source: CONTEXT_SOURCES.title});
    sections.push({title: "Who claimed the power to take land?", teaser: "European governments claimed authority over inhabited Native homelands. In 1823, the U.S. Supreme Court used the Doctrine of Discovery to limit Native power to convey land.", text: "Dispossession involved government power as well as individual transactions. In Johnson v. M’Intosh (1823), Chief Justice John Marshall’s opinion treated European discovery as giving the colonizing power exclusive authority to acquire Native land, while recognizing Native occupancy. The Court refused to recognize private purchases directly from Native nations. This imposed hierarchy helps explain the legal machinery of dispossession; the case concerned land in Illinois, not a ruling on any particular Long Island deed.", source: CONTEXT_SOURCES.discovery});
    sections.push({title: "LandBack: land, authority and relationships", teaser: "Sogorea Te’ Land Trust in California links land return with language, ceremony and Indigenous care. This is one model: each Native community defines its own priorities.", text: "Land return can support Indigenous decision-making, cultural practice and care for a place. In California’s Lisjan territory, the Indigenous women-led Sogorea Te’ Land Trust describes rematriation as restoring relationships with ancestral land, language and ceremony. Its work offers one model, not a single policy for every Native nation. Follow the priorities named by the community whose homeland this is.", source: CONTEXT_SOURCES.return});
    sections.push({title: "LandBack in practice: a place to care for again", teaser: "In Oakland, California, a 2022 cultural easement restored Indigenous access and stewardship at Rinihmu Pulte’irekne. Land return can support ceremony, gathering and ecological restoration.", text: "In December 2022, Oakland granted a perpetual cultural conservation easement at Rinihmu Pulte’irekne to Sogorea Te’ Land Trust, working with the Villages of Lisjan Nation. The city retained underlying ownership; the agreement restored rights for Indigenous stewardship, cultural practice and education. Work there includes gathering Native plants and foods and restoring habitat. This California example shows one practical route toward restored relationships and authority, rather than a promise that every Long Island community seeks the same arrangement.", source: CONTEXT_SOURCES.restoration});
    sections.push({title: "Continuing ownership is not a new land return", teaser: "In 2025, the Shinnecock Nation reported federal reaffirmation of its continuously held Westwoods land. Defending retained land is different from receiving land back.", text: "Here on Long Island, the Shinnecock Nation reported in January 2025 that the U.S. Department of the Interior reaffirmed Westwoods as land the Nation had continuously held, protected against sale without federal consent. This was recognition of retained land, not a new transfer back. Land history includes the defense of continuing Native authority as well as dispossession and return.", source: CONTEXT_SOURCES.continuance});
    return sections;
  }
  function contextHtml(entry) {
    return contextSections(entry).map(item => `<section class="section land-history-context"><h3>${item.title}</h3><p>${item.text}</p>${item.source?.url ? `<p><a href="${item.source.url}" target="_blank" rel="noopener noreferrer">${item.source.label || 'Read the historical record'}</a></p>` : ''}</section>`).join('');
  }
  // A bounded search on settled views: never place a card over land or UI.
  function contextPosition(width, height, cardWidth, cardHeight, focus, blockers, water) {
    const candidates = [];
    const overlaps = (a,b) => a.x < b.x+b.w+8 && a.x+a.w+8 > b.x && a.y < b.y+b.h+8 && a.y+a.h+8 > b.y;
    for (let y=12; y+cardHeight<height-12; y+=32) for(let x=12; x+cardWidth<width-12; x+=32) {
      const box={x,y,w:cardWidth,h:cardHeight};
      if(blockers.some(b=>overlaps(box,b)) || overlaps(box,{x:focus.x-42,y:focus.y-42,w:84,h:84})) continue;
      candidates.push({...box,score:Math.hypot(x+cardWidth/2-focus.x,y+cardHeight/2-focus.y)});
    }
    candidates.sort((a,b)=>a.score-b.score);
    for(const box of candidates) {
      const {x,y}=box;
      let clear=true;
      for(let dx=0;dx<=cardWidth&&clear;dx+=Math.min(20,cardWidth-dx||20)) {
        for(let dy=0;dy<=cardHeight;dy+=Math.min(20,cardHeight-dy||20)) if(!water(x+dx,y+dy)){clear=false;break;}
      }
      if(clear) return box;
    }
    return null;
  }
  function isContextWater(point, landTest, waterTest) {
    // Outside an island-only land mask is unknown, not proof of water.
    return !!landTest && !!waterTest && waterTest(point) === true && landTest(point) === false;
  }
  function createContextCards({getMap,getFocus,getLandGeometry,catalog,isEnabled,doc}) {
    if (typeof MutationObserver !== "function" || typeof ResizeObserver !== "function" || typeof requestAnimationFrame !== "function") return {refresh() {}};
    let map,card,frame=0,index=0,slug='',moving=false,geometry,tester,waterTester,waterRequested=false;
    const dismissed = new Set();
    const blockersSelector='#article,#detail,#timeline-dock,.land-history-guide,.daily-card-stack,.sheet,.activity-panel,.notification-panel,.article-contents,.mobile-map-toolbar,.mobile-land-history-notice,.topbar,.mobile-activity-button,.mobile-notification-button,.mobile-location-button,.maplibregl-ctrl,.mapboxgl-ctrl,.leaflet-control';
    function hide(reason){if(card){card.hidden=true;card.dataset.hiddenReason=reason || "dismissed";}}
    function render(){
      frame=0;
      if(!isEnabled() || moving){hide(moving ? "moving" : "normal-mode");return;}
      const current=getMap();
      if(!current?.getContainer){hide();return;}
      if(map!==current){
        if(map){map.off('movestart',start);map.off('moveend',settle);map.off('resize',refresh);}
        map=current;map.on('movestart',start);map.on('moveend',settle);map.on('resize',refresh);
      }
      const focus=getFocus?.(), entry=catalog.entryFor(focus?.site);
      if(!entry || !focus?.center || dismissed.has(entry.slug)){hide();return;}
      if(!waterRequested){
        waterRequested=true;
        // Optional overlay only: failed/offline fetch leaves the article intact.
        fetch(new URL('assets/data/land-context-water-v1.json',doc.baseURI))
          .then(response=>{if(!response.ok)throw new Error('Water mask unavailable');return response.json();})
          .then(data=>{waterTester=window.NLI_GEOMETRY_UTILS?.createPointInGeometryTester?.(data.geometry);refresh();})
          .catch(()=>{hide('water-mask-unavailable');});
      }
      if(!waterTester){hide('water-mask-pending');return;}
      const host=map.getContainer();
      if(!card){
        card=doc.createElement('aside');card.className='land-context-card';card.setAttribute('aria-label','Land history explained');host.append(card);
        for(const name of ['pointerdown','click','dblclick','wheel','touchstart'])card.addEventListener(name,event=>event.stopPropagation());
      }
      if(slug!==entry.slug){slug=entry.slug;index=0;}
      const items=contextSections(entry), item=items[index%items.length];
      const keepFocus=doc.activeElement === card.querySelector('.land-context-next');
      const key=slug+':'+index;
      if(card.dataset.key!==key){
        card.dataset.key=key;
        card.innerHTML='<button type="button" class="land-context-close" aria-label="Dismiss land history explanation">×</button><small>LAND HISTORY EXPLAINED</small><h3></h3><p></p><a target="_blank" rel="noopener noreferrer">Read source</a><button type="button" class="land-context-next"></button>';
        card.querySelector('h3').textContent=item.title;
        card.querySelector('p').textContent=item.teaser || item.text.split(/(?<=\.)\s/).slice(0,1).join(' ');
        card.querySelector('a').href=item.source?.url || '#';card.querySelector('a').hidden=!item.source?.url;
        card.querySelector('.land-context-next').textContent=`Next · ${index%items.length+1} of ${items.length}`;
        card.querySelector('.land-context-next').onclick=()=>{index++;refresh();};
        card.querySelector('.land-context-close').onclick=()=>{dismissed.add(slug);hide();};
      }
      const nextGeometry=getLandGeometry?.();
      if(geometry!==nextGeometry){geometry=nextGeometry;tester=geometry&&window.NLI_GEOMETRY_UTILS?.createPointInGeometryTester?.(geometry);}
      if(!tester){hide("land-mask-pending");return;}
      const bounds=host.getBoundingClientRect();
      const projected=map.latLngToContainerPoint?map.latLngToContainerPoint([focus.center[1],focus.center[0]]):map.project(focus.center);
      if(projected.x<0||projected.y<0||projected.x>bounds.width||projected.y>bounds.height){hide("focus-outside-map");return;}
      const blockers=[...doc.querySelectorAll(blockersSelector)].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>{const r=el.getBoundingClientRect();return{x:r.left-bounds.left,y:r.top-bounds.top,w:r.width,h:r.height};});
      card.hidden=false;card.style.visibility='hidden';
      const pos=contextPosition(bounds.width,bounds.height,card.offsetWidth,card.offsetHeight,projected,blockers,(x,y)=>{
        const ll=map.containerPointToLatLng?map.containerPointToLatLng([x,y]):map.unproject([x,y]);return isContextWater([ll.lng,ll.lat],tester,waterTester);
      });
      card.hidden=!pos;card.dataset.hiddenReason=pos ? '' : 'no-clear-water-space';card.style.visibility='';
      if(pos){card.style.left=pos.x+'px';card.style.top=pos.y+'px';if(keepFocus)card.querySelector('.land-context-next').focus({preventScroll:true});}
    }
    function start(){moving=true;hide();}
    function settle(){moving=false;refresh();}
    function refresh(){if(!frame)frame=requestAnimationFrame(render);}
    const observer=new MutationObserver(refresh);
    const resize=new ResizeObserver(refresh);
    for(const el of doc.querySelectorAll('#article,#detail,#timeline-dock')){observer.observe(el,{attributes:true,attributeFilter:['class','style','hidden']});resize.observe(el);}
    return {refresh};
  }

  function placementHtml(site, data) {
    const entry = data?.entries?.find(item => item.slug === site?.slug || Number(item.siteId) === Number(site?.id));
    if (!entry) return "";
    const escape = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const text = entry.isAncestralLand
      ? 'This shaded homeland is a regional historical interpretation. Native relationships, movement and kinship extend across its edges; it is not an exclusive or surveyed legal boundary.'
      : entry.display === 'point'
        ? 'This pin identifies a place connected with the history. It does not outline the land described in a deed or establish current ownership.'
        : 'The shaded area is an approximate historical interpretation, not a surveyed legal boundary or a statement of current ownership.';
    const explanation = entry.placementExplanation ? `<p>${escape(entry.placementExplanation)}</p>` : '';
    const access = /private tribal land/i.test(entry.sensitivity || '') ? `<p>${escape(entry.sensitivity)}</p>` : '';
    return `<section class="section land-history-placement"><h3>About this map location</h3><p>${text}</p>${explanation}${access}</section>${contextHtml(entry)}`;
  }

  const auxiliaryVisibility = new WeakMap();
  function avoidPanel(button, shell, panel, host = window) {
    if (!button || !shell || !panel || !host.ResizeObserver) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const bounds = shell.getBoundingClientRect();
      const tray = panel.getBoundingClientRect();
      const control = button.getBoundingClientRect();
      const overlaps = panel.classList.contains('open') && tray.height > 0 && tray.top < bounds.bottom && tray.bottom > bounds.top
        && tray.left < control.right && tray.right > control.left;
      button.style.setProperty('--land-history-panel-offset', `${overlaps ? Math.max(4, bounds.bottom - tray.top + 6) : 4}px`);
      host.__nliSyncNativeMapViewport?.();
    };
    const schedule = () => { if (!frame) frame = host.requestAnimationFrame(update); };
    const observer = new host.ResizeObserver(schedule);
    observer.observe(shell);
    observer.observe(panel);
    if (host.MutationObserver) new host.MutationObserver(schedule).observe(panel, {attributes:true,attributeFilter:['class','style']});
    panel.addEventListener('transitionend', schedule);
    host.addEventListener('resize', schedule);
    schedule();
  }

  function syncAuxiliaryMarkers(markers, enabled) {
    for (const marker of markers) {
      const element = marker?.getElement?.();
      if (!element?.style) continue;
      if (enabled) {
        if (!auxiliaryVisibility.has(element)) auxiliaryVisibility.set(element, element.style.visibility);
        element.style.visibility = "hidden";
      } else if (auxiliaryVisibility.has(element)) {
        element.style.visibility = auxiliaryVisibility.get(element);
        auxiliaryVisibility.delete(element);
      }
    }
  }

  function capturePose(map) {
    const center = map?.getCenter?.();
    if (!center || !Number.isFinite(map.getZoom?.())) return null;
    return { center: [Number(center.lng), Number(center.lat)], zoom: map.getZoom(), bearing: map.getBearing?.() || 0, pitch: map.getPitch?.() || 0 };
  }
  function restorePose(map, pose) {
    if (!map || !pose) return;
    const snap = map.options?.zoomSnap;
    // Preserve fractional zoom through Leaflet stop().
    if (map.options) map.options.zoomSnap = 0;
    try {
      map.stop?.();
      if (JSON.stringify(capturePose(map)) === JSON.stringify(pose)) return;
      if (map.jumpTo) map.jumpTo({ ...pose, center: [...pose.center] });
      else map.setView?.([pose.center[1], pose.center[0]], pose.zoom, { animate: false });
    } finally { if (map.options) map.options.zoomSnap = snap; }
  }

  // Redraw cached layers without reopening content or moving the camera.
  function createController({ catalog, getMap, redraw, button, location, history, onStatus = () => {}, openSite, getFocus, getLandGeometry }) {
    let enabled = false;
    const guide = createGuide(button, catalog, getMap, openSite);
    const cards = button?.ownerDocument && createContextCards({getMap,getFocus,getLandGeometry,catalog,isEnabled:()=>enabled,doc:button.ownerDocument});
    function updateButton() {
      if (guide) guide.hidden = !enabled;
      if (button) {
        button.textContent = TITLE;
        button.setAttribute("aria-pressed", String(enabled));
        button.title = enabled ? "Return to the normal map" : "Explore land history";
        button.classList.toggle("is-active", enabled);
      }
      onStatus(enabled ? TITLE : "Normal map");
      cards?.refresh();
    }
    function setEnabled(next, { writeRoute = true } = {}) {
      next = Boolean(next);
      if (next === enabled) { updateButton(); return false; }
      // Keep the current view in both directions.
      const previousPose = capturePose(getMap());
      restorePose(getMap(), previousPose);
      enabled = next;
      updateButton();
      redraw(enabled);
      restorePose(getMap(), previousPose);
      if (writeRoute && location && history) {
        const url = new URL(location.href);
        if (enabled) url.searchParams.set("mode", MODE);
        else url.searchParams.delete("mode");
        history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
      }
      return true;
    }
    function restoreRoute() {
      const url = new URL(location.href);
      if (url.searchParams.get("mode") === "land-history") {
        url.searchParams.set("mode", MODE);
        history?.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
      }
      return setEnabled(url.searchParams.get("mode") === MODE, { writeRoute: false });
    }
    button?.addEventListener("click", () => setEnabled(!enabled));
    if (button) button.hidden = false;
    updateButton();
    return Object.freeze({ get enabled() { return enabled; }, refreshContext: () => cards?.refresh(), setEnabled, restoreRoute, entryFor: catalog.entryFor, decorate: catalog.decorate, includes: value => catalog.includes(value, enabled) });
  }
  function withSources(item, data) {
    if (!item?.site_type || item.source_list?.length) return item;
    const entry = data?.entries?.find(entry => entry.slug === item.slug);
    return entry ? { ...item, source_list: entry.sources } : item;
  }
  function createGuide(button, catalog, getMap, openSite) {
    const doc = button?.ownerDocument;
    if (!doc || !openSite) return null;
    const guide = doc.createElement('aside');
    guide.className = 'land-history-guide';
    guide.setAttribute('aria-label', 'Explore Long Island land history');
    guide.innerHTML = '<label>Explore across Long Island<select aria-label="Choose a land-history chapter"><option value="">Choose a place and date…</option></select></label><button type="button">View whole island</button><details><summary>Map key &amp; coverage</summary><p>Selected histories, not every deed. Unshaded land does not mean no dispossession.</p><p><span class="land-key deed">Ochre: land claims / loss</span><br><span class="land-key context">Varied colors: related landscapes</span><br><span class="land-key continuance">Blue: retained land / continuance</span><br><span class="land-key ancestral">Green: ancestral homelands</span></p><p>Areas are approximate. Open a chapter for Historic Moments, citations and the reason for its placement.</p></details>';
    const select = guide.querySelector('select');
    for (const entry of catalog.entries.filter(e => e.chapterLabel).sort((a,b) => a.guideOrder-b.guideOrder)) {
      const option = doc.createElement('option');
      option.value = entry.slug; option.textContent = entry.chapterLabel;
      select.append(option);
    }
    select.addEventListener('change', () => { if (select.value) openSite(select.value); select.value = ''; });
    guide.querySelector('button').addEventListener('click', () => {
      const map = getMap();
      if (!map?.fitBounds) return;
      map.stop?.();
      if (map.jumpTo) map.fitBounds([[-74.07,40.54],[-71.82,41.18]], {padding:70,duration:1500});
      else map.fitBounds([[40.54,-74.07],[41.18,-71.82]], {padding:[60,90],animate:true,duration:1.5});
    });
    for (const event of ['pointerdown','click','dblclick','wheel']) guide.addEventListener(event, e => e.stopPropagation());
    guide.hidden = true;
    button.insertAdjacentElement('afterend', guide);
    return guide;
  }
  return Object.freeze({ TITLE, MODE, ANCESTRAL_SLUGS, contextSections, contextPosition, isContextWater, audit, createCatalog, capturePose, restorePose, createController, syncOutlineLayers, syncAuxiliaryMarkers, avoidPanel, placementHtml, withSources });
});
