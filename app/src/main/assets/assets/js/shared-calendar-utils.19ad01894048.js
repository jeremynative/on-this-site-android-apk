(function () {
  const DATE_LABEL_MONTHS = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12"
  };

  function eventTypeLabel(value) {
    return String(value || "event")
      .replace(/_/g, " ")
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function eventDateRange(event = {}, options = {}) {
    if (event.is_permanent || event.on_view_status === "permanent") return "Permanent collection";
    const startValue = event.start_datetime || event.start_date;
    const endValue = event.end_datetime || event.end_date;
    const start = startValue ? new Date(startValue) : null;
    const end = endValue ? new Date(endValue) : null;
    const dateOptions = options.dateOptions || { month: "short", day: "numeric", year: "numeric" };
    if (start && end) return `${start.toLocaleDateString(undefined, dateOptions)} - ${end.toLocaleDateString(undefined, dateOptions)}`;
    if (start) return start.toLocaleDateString(undefined, dateOptions);
    if (event.collection_date) return `Collected ${new Date(event.collection_date).toLocaleDateString(undefined, dateOptions)}`;
    return eventTypeLabel(event.event_type || event.status);
  }

  function isCalendarEventActive(event = {}, deps = {}) {
    const normalizeText = deps.normalizeText || (value => String(value || "").toLowerCase().trim());
    const localDateKey = deps.localDateKey || (() => new Date().toISOString().slice(0, 10));
    const publishStatus = normalizeText(event.status);
    if (publishStatus && !/published|current|active|on view|permanent/.test(publishStatus)) return false;
    const viewStatus = normalizeText(event.on_view_status || event.status);
    if (viewStatus && !/published|current|active|on view|permanent/.test(viewStatus)) return false;
    const today = localDateKey();
    const start = String(event.start_datetime || event.start_date || "").slice(0, 10);
    const end = String(event.end_datetime || event.end_date || "").slice(0, 10);
    if (end) return (!start || start <= today) && end >= today;
    if (start) return start === today;
    return Boolean(event.is_permanent || viewStatus.includes("permanent"));
  }

  function isCalendarEventCurrentOrUpcoming(event = {}, deps = {}) {
    const normalizeText = deps.normalizeText || (value => String(value || "").toLowerCase().trim());
    const localDateKey = deps.localDateKey || (() => new Date().toISOString().slice(0, 10));
    const publishStatus = normalizeText(event.status);
    if (publishStatus && !/published|current|active|on view|permanent|planned/.test(publishStatus)) return false;
    const viewStatus = normalizeText(event.on_view_status);
    if (/closed|archived|draft/.test(viewStatus)) return false;
    const today = localDateKey();
    const start = String(event.start_datetime || event.start_date || "").slice(0, 10);
    const end = String(event.end_datetime || event.end_date || "").slice(0, 10);
    if (end) return end >= today;
    return Boolean(start && start >= today);
  }

  function normalizeCalendarEvents(events, deps = {}) {
    const siteCenter = deps.siteCenter || (() => null);
    return (events || [])
      .filter(event => !event.status || event.status === "published")
      .map(event => {
        const geometry = event.geojson || null;
        return {
          ...event,
          slug: event.slug || String(event.id),
          center: siteCenter(geometry)
        };
      })
      .filter(event => event.title && event.center);
  }

  function calendarDate(value = new Date()) {
    const raw = value && typeof value === "object" && !(value instanceof Date)
      ? (value.start_datetime || value.start_date || value.end_datetime || value.end_date || value.collection_date)
      : value;
    if (raw instanceof Date) return raw;
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function calendarDayNumber(value = new Date()) {
    const day = Number(calendarDate(value)?.getDate?.());
    return Number.isFinite(day) && day >= 1 && day <= 31 ? String(day) : "";
  }

  function calendarMonthDay(value = new Date()) {
    if (value && typeof value === "object" && !(value instanceof Date)) {
      const start = calendarMonthDay(value.start_datetime || value.start_date || "");
      const end = calendarMonthDay(value.end_datetime || value.end_date || "");
      if (start && end && start !== end) return `${start}–${end}`;
    }
    const date = calendarDate(value);
    const month = Number(date?.getMonth?.()) + 1;
    const day = Number(date?.getDate?.());
    return Number.isFinite(month) && month >= 1 && month <= 12 && Number.isFinite(day) && day >= 1 && day <= 31
      ? `${month}/${day}`
      : "";
  }

  function calendarBadgeMarkup(value = new Date(), extraClass = "") {
    const className = ["calendar-date-badge", "on-this-day-badge", calendarMonthDay(value).includes("–") ? "calendar-date-range" : "", extraClass].filter(Boolean).join(" ");
    return `<span class="${className}" aria-hidden="true"><span class="calendar-date-badge-date on-this-day-badge-date">${calendarMonthDay(value)}</span></span>`;
  }

  function onThisDayNumber(date = new Date()) {
    return calendarDayNumber(date);
  }

  function onThisDayCalendarMarkup(date = new Date()) {
    return calendarBadgeMarkup(date);
  }

  function dateLabelMonthDay(dateLabel) {
    const text = String(dateLabel || "").trim();
    const match = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
    if (!match) return "";
    const month = DATE_LABEL_MONTHS[match[1].toLowerCase()];
    const dayNumber = Number(match[2]);
    const day = Number.isFinite(dayNumber) ? String(dayNumber).padStart(2, "0") : "";
    return month && day ? `${month}-${day}` : "";
  }

  function isNativeHistoryMoment(event = {}) {
    // Evaluate the event's account, never its parent listing's title, tags,
    // location or references: a park on Native land is not itself Native history.
    const text = [event.title, event.description, event.summary, event.timeline_headline]
      .filter(Boolean).join(" ").replace(/<[^>]*>/g, " ");
    return /\b(?:indigenous|native american|american indian|first nations|sachems?|tribal|tribes?|powwow|wampum|algonquian|algonquin|shinnecock|montaukett|unkechaug|matinecock|manhansett|corchaug|setalcott|mohegan|pequot|narragansett|wampanoag|haudenosaunee|lenape|niantic)\b/i.test(text)
      || /\b(?:native|indian)\s+(?:people|peoples|communit(?:y|ies)|nation|nations|famil(?:y|ies)|women|men|children|ancestr\w*|homeland|land|lands|rights|sovereignty|history|histories|culture|cultural|language|languages|art|artists|burial|burials|reservation|reservations|removal|education|school|schools|boarding)\b/i.test(text);
  }

  function timelineEventMatchesToday(event, today = new Date().toISOString().slice(0, 10)) {
    const todayMonthDay = String(today || "").slice(5, 10);
    return Boolean(todayMonthDay && dateLabelMonthDay(event?.date_label) === todayMonthDay);
  }

  function roundedRectPath(context, x, y, width, height, radius) {
    const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.lineTo(x + width - safeRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    context.lineTo(x + width, y + height - safeRadius);
    context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    context.lineTo(x + safeRadius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    context.lineTo(x, y + safeRadius);
    context.quadraticCurveTo(x, y, x + safeRadius, y);
    context.closePath();
  }

  function addCalendarMapImage(map, id = "calendar-date", value = new Date()) {
    if (!map?.addImage || map.hasImage?.(id) || typeof document === "undefined") return false;
    const pixelRatio = 2;
    const label = calendarMonthDay(value);
    const width = label.includes("–") ? 78 : 38;
    const size = 38;
    const canvas = document.createElement("canvas");
    canvas.width = width * pixelRatio;
    canvas.height = size * pixelRatio;
    const context = canvas.getContext("2d");
    if (!context) return false;
    context.scale(pixelRatio, pixelRatio);

    context.shadowColor = "rgba(23, 38, 29, 0.28)";
    context.shadowBlur = 4;
    context.shadowOffsetY = 2;
    context.fillStyle = "#fbf7e9";
    context.strokeStyle = "#315c48";
    context.lineWidth = 2;
    roundedRectPath(context, 4, 5, width - 8, 29, 5);
    context.fill();
    context.shadowColor = "transparent";
    context.stroke();

    context.save();
    roundedRectPath(context, 4, 5, width - 8, 29, 5);
    context.clip();
    context.fillStyle = "#315c48";
    context.fillRect(4, 5, width - 8, 8);
    context.restore();

    context.strokeStyle = "#315c48";
    context.lineWidth = 2;
    context.lineCap = "round";
    [12, width - 12].forEach(x => {
      context.beginPath();
      context.moveTo(x, 3);
      context.lineTo(x, 8);
      context.stroke();
    });

    context.fillStyle = "#315c48";
    context.font = "700 9px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, width / 2, 24, width - 15);
    map.addImage(id, context.getImageData(0, 0, canvas.width, canvas.height), { pixelRatio });
    return true;
  }

  function addOnThisDayMapImage(map, id = "on-this-day-calendar", date = new Date()) {
    return addCalendarMapImage(map, id, date);
  }

  // One DOM overlay works with both vector maps and the Leaflet fallback.
  function createMapCallouts(options) {
    const map = options.map, host = map.getContainer();
    const root = document.createElement("div");
    root.className = "event-map-callouts";
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", "Events on the map");
    const style = document.createElement("style");
    style.textContent = `.event-map-callouts{position:absolute;inset:0;pointer-events:none;z-index:450;overflow:hidden}.event-map-callouts svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}.event-map-card{z-index:1;position:absolute;box-sizing:border-box;width:250px;background:rgba(255,255,250,.97);border:1px solid #adc5bc;border-radius:12px;box-shadow:0 3px 12px #173b3924;color:#203d33;padding:13px;pointer-events:auto;font:13px/1.35 system-ui,sans-serif}.event-map-card .event-map-image{display:block;width:auto;height:auto;max-width:100%;max-height:280px;object-fit:contain;border-radius:7px;margin:0 auto 9px}.event-map-card:has(.event-map-image) .event-map-close{background:#fffdf5;box-shadow:0 1px 4px #173b3924}.event-map-card button{font:inherit;cursor:pointer}.event-map-card .event-map-category{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;padding-right:30px;color:#567267}.event-map-card .event-map-title{display:block;border:0;background:none;color:inherit;font-size:15px;font-weight:700;line-height:1.2;text-align:left;padding:5px 22px 0 0;width:100%}.event-map-card .event-map-venue{margin:6px 0 0;font-size:12px;font-weight:600;line-height:1.35;overflow-wrap:anywhere;color:#456256}.event-map-card .event-map-description{margin:7px 0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.event-map-card .event-map-dates{font-size:11px;font-weight:650;display:block}.event-map-card .event-map-reception{font-size:11px;margin:5px 0 0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.event-map-card .event-map-close{position:absolute;right:3px;top:3px;width:36px;height:36px;border:0;border-radius:50%;background:transparent;color:#38564b;font-size:23px;font-weight:400;padding:0}.event-map-card button:focus-visible,.event-map-more:focus-visible{outline:2px solid #235f52;outline-offset:2px}.event-map-more{position:absolute;right:12px;bottom:12px;pointer-events:auto;border:1px solid #adc5bc;border-radius:20px;background:#fffdf5;color:#315c48;padding:9px 13px;min-height:40px;box-shadow:0 2px 8px #173b3920;font:600 12px system-ui;cursor:pointer}@media(max-width:600px){.event-map-card{width:205px;padding:10px}.event-map-card .event-map-title{font-size:13px}.event-map-card .event-map-description{font-size:12px;-webkit-line-clamp:2}.event-map-card .event-map-close{width:40px;height:40px}.event-map-card .event-map-category{font-size:9px}}`;
    root.append(style);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true"); root.append(svg); host.append(root);
    const more = document.createElement("button"); more.className="event-map-more";more.type="button";root.append(more);
    let zoomSettleTimer = 0, renderedZoom, blockerEls = null, blockerVersion = -1, blockerAt = 0;
    const watchedBlockers = new WeakSet();
    let dismissed = new Set(), cards = [], frame = 0, page = 0, signature = "", layoutVersion = 0, placedKey = "";
    const anchors = new Map();
    let indexedGeometry=null, indexedLand=null;
    try { dismissed = new Set(JSON.parse(sessionStorage.getItem("nli-event-card-dismissals") || "[]")); } catch (_) {}
    const key = e => `${e.slug || e.id}:${e.start_datetime || e.start_date || ""}:${e.end_datetime || e.end_date || ""}`;
    const text = html => { const doc = new DOMParser().parseFromString(String(html || ""),"text/html"); return doc.body.textContent.replace(/\s+/g," ").trim(); };
    const project = point => options.project(point);
    const overlap = (a,b) => a.x < b.x+b.w+8 && a.x+a.w+8 > b.x && a.y < b.y+b.h+8 && a.y+a.h+8 > b.y;
    function content(e, card) {
      const add = (tag, cls, value) => { const el=document.createElement(tag);el.className=cls;el.textContent=value;card.append(el);return el; };
      const imageUrl=options.imageUrl?.(e);
      if(imageUrl && /^https?:\/\//i.test(imageUrl)) {
        const image=add("img","event-map-image","");image.src=imageUrl;image.alt=e.title;image.loading="eager";image.decoding="async";
        image.addEventListener("load",refresh,{once:true});
        image.addEventListener("error",()=>{image.remove();refresh();},{once:true});
      }
      add("span","event-map-category",eventTypeLabel(e.event_type));
      const title=add("button","event-map-title",e.title);title.type="button";title.addEventListener("click",()=>options.open(e));
      const venue=text(e.venue || e.siteTitle || e.address_label);
      if(venue)add("p","event-map-venue",venue);
      add("p","event-map-description",text(e.summary || e.activity_pin_preview || "").slice(0,240));
      // Date-only and offset-free Directus values are local wall dates, never UTC dates shifted west.
      const dateLabel = value => {const parts=String(value||"").match(/^(\d{4})-(\d{2})-(\d{2})/);return parts?new Date(+parts[1],+parts[2]-1,+parts[3]).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}):"";};
      const start=e.start_datetime||e.start_date,end=e.end_datetime||e.end_date;
      let dates=dateLabel(start);if(end&&String(end).slice(0,10)!==String(start).slice(0,10))dates+=` – ${dateLabel(end)}`;
      if(!e.all_day&&start){const t=String(start).match(/T(\d{2}):(\d{2})/);if(t&&t[0]!=="T00:00")dates+=` · ${(+t[1]%12)||12}:${t[2]} ${+t[1]<12?"AM":"PM"}${e.timezone==="America/New_York"?" ET":""}`;}
      add("span","event-map-dates",dates || eventDateRange(e));
      const reception=e.opening_reception_label || text(e.body).match(/(?:meet.the.artist )?opening reception[^.!?]*(?:[.!?]|$)/i)?.[0]?.split(/,?\s+an artist talk/i)[0];
      if(reception)add("p","event-map-reception",reception);
      const close=add("button","event-map-close","×");close.type="button";close.setAttribute("aria-label",`Dismiss ${e.title}`);
      close.addEventListener("click",()=>{dismissed.add(key(e));try{sessionStorage.setItem("nli-event-card-dismissals",JSON.stringify([...dismissed]));}catch(_){}signature="";refresh();more.focus();});
      for(const name of ["pointerdown","click","dblclick","wheel"])card.addEventListener(name,event=>event.stopPropagation());
    }
    function render() {
      frame=0;if(!host.isConnected)return;
      const bounds=host.getBoundingClientRect(), w=bounds.width,h=bounds.height;
      const all=(options.items()||[]).filter(e=>Array.isArray(e.center)&&isCalendarEventCurrentOrUpcoming(e));
      const visible=all.filter(e=>{const p=project(e.center);return p&&p.x>=0&&p.y>=0&&p.x<=w&&p.y<=h&&!dismissed.has(key(e));});
      const limit=w<600?1:w<1000?2:3, count=visible.length;
      page=count?page%Math.ceil(count/limit):0;
      const selected=visible.slice(page*limit,(page+1)*limit);
      const next=selected.map(e=>key(e)+e.title+e.venue+e.siteTitle+e.address_label+e.summary+e.body+e.cover_image).join("|")+`:${w<600}`;
      if(next!==signature){cards.forEach(c=>{c.el.remove();c.line.remove();});cards=[];signature=next;for(const e of selected){const el=document.createElement("article");el.className="event-map-card";root.append(el);content(e,el);const line=document.createElementNS(svg.namespaceURI,"line");line.setAttribute("class","event-map-connector");line.setAttribute("stroke","#fff");line.setAttribute("stroke-width","1");line.setAttribute("vector-effect","non-scaling-stroke");svg.append(line);cards.push({e,el,line});}}
      // Layer redraws call refresh() often; skip placement when neither the camera,
      // the selected cards, nor the surrounding panels have changed since last time.
      const camera=cards.map(c=>{const p=project(anchors.get(key(c.e))||c.e.center);return p?`${Math.round(p.x*10)},${Math.round(p.y*10)}`:"-";}).join(";");
      const nextPlacedKey=`${signature}|${count}/${all.length}|${w}x${h}|${camera}|${layoutVersion}|${options.landGeometry?.()===indexedGeometry}`;
      // Unplaced (hidden) cards keep retrying, since land/water inputs can change underneath them.
      if(nextPlacedKey===placedKey&&cards.every(c=>c.el.isConnected&&!c.el.hidden))return;
      placedKey=nextPlacedKey;
      // Panels can be created without a watched attribute change, so re-query every few seconds.
      if(!blockerEls||blockerVersion!==layoutVersion||performance.now()-blockerAt>4000||!blockerEls.every(el=>el.isConnected)){blockerAt=performance.now();blockerEls=[...document.querySelectorAll("#article,#detail,#timeline-dock,.daily-card-stack,.sheet,.activity-panel,.notification-panel,.article-contents,.topbar,.mobile-activity-button,.mobile-notification-button,.mobile-location-button,.maplibregl-ctrl,.mapboxgl-ctrl,.leaflet-control,.daily-card-restore-dock,.monthly-support-goal,.research-question-restore,.research-question-prompt,.android-beta-prompt,.land-history-toggle")].filter(el=>!root.contains(el));blockerEls.forEach(el=>{if(!watchedBlockers.has(el)){watchedBlockers.add(el);observer.observe(el);}});blockerVersion=layoutVersion;}
      const blockers=blockerEls.filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=="hidden").map(el=>{const r=el.getBoundingClientRect();return{x:r.left-bounds.left,y:r.top-bounds.top,w:r.width,h:r.height};});
      const geometry=options.landGeometry?.();
      if(geometry!==indexedGeometry){indexedGeometry=geometry;indexedLand=geometry&&window.NLI_GEOMETRY_UTILS?.createPointInGeometryTester?.(geometry);}
      const isLand=indexedLand||options.isLand;
      const placed=[], waterCache=new Map();
      const water=(x,y)=>{const k=`${x},${y}`;if(!waterCache.has(k))waterCache.set(k,isLand?.(options.unproject([x,y]))===false);return waterCache.get(k);};
      // Connect to an edge midpoint, with the short portion beneath the venue icon omitted.
      function connection(r,p){
        const ends=[{x:r.x+r.w/2,y:r.y},{x:r.x+r.w/2,y:r.y+r.h},{x:r.x,y:r.y+r.h/2},{x:r.x+r.w,y:r.y+r.h/2}];
        ends.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
        for(const end of ends){
          const length=Math.hypot(end.x-p.x,end.y-p.y);if(length<20)continue;
          const start={x:p.x+(end.x-p.x)*14/length,y:p.y+(end.y-p.y)*14/length};
          let clear=true;const steps=Math.ceil((length-14)/8);
          for(let i=0;i<=steps;i++){const t=i/steps,x=start.x+(end.x-start.x)*t,y=start.y+(end.y-start.y)*t;
            if((x>r.x+.1&&x<r.x+r.w-.1&&y>r.y+.1&&y<r.y+r.h-.1)||!water(x,y)||[...blockers,...placed].some(b=>x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h)){clear=false;break;}
          }
          if(clear)return {start,end};
        }
        return null;
      }
      function placement(r,p){
        if(r.x<0||r.y<0||r.x+r.w>w||r.y+r.h>h||[...blockers,...placed].some(b=>overlap(r,b)))return null;
        const link=connection(r,p);if(!link)return null;
        // Include the entire card perimeter and interior; never accept a land fallback.
        const nx=Math.ceil(r.w/16),ny=Math.ceil(r.h/16);
        for(let ix=0;ix<=nx;ix++)for(let iy=0;iy<=ny;iy++)if(!water(r.x+r.w*ix/nx,r.y+r.h*iy/ny))return null;
        return {...r,link};
      }
      for(const c of cards){
        c.el.hidden=false;
        const p=project(c.e.center),cw=c.el.offsetWidth,ch=c.el.offsetHeight;
        const anchor=anchors.get(key(c.e)), projected=anchor&&project(anchor);
        c.pos=projected?placement({x:projected.x,y:projected.y,w:cw,h:ch},p):null;
        if(!c.pos){
          const candidates=[];
          for(let y=14;y+ch<h-52;y+=Math.max(40,ch/2))for(let x=12;x+cw<w-10;x+=Math.max(40,cw/2)){
            candidates.push({x,y,w:cw,h:ch,score:Math.hypot(x+cw/2-p.x,y+ch/2-p.y)});
          }
          for(const candidate of candidates.sort((a,b)=>a.score-b.score)){c.pos=placement(candidate,p);if(c.pos)break;}
          if(c.pos)anchors.set(key(c.e),options.unproject([c.pos.x,c.pos.y]));
        }
        c.el.hidden=!c.pos;c.line.style.display=c.pos?"":"none";if(!c.pos)continue;
        placed.push(c.pos);const r=c.pos;c.el.style.left="0";c.el.style.top="0";c.el.style.transform=`translate(${r.x}px,${r.y}px)`;
        c.line.setAttribute("x1",r.link.start.x);c.line.setAttribute("y1",r.link.start.y);c.line.setAttribute("x2",r.link.end.x);c.line.setAttribute("y2",r.link.end.y);
      }
      const hidden=all.some(e=>dismissed.has(key(e)));
      more.hidden=!all.length || (!hidden&&count<=limit&&cards.every(c=>c.pos));
      more.textContent=count>limit?`More events · ${page+1}/${Math.ceil(count/limit)}`:hidden?"Restore event cards":"Events";
      // Keep the Events button clear of the timeline dock and corner controls; hide it rather than float it mid-map.
      if(!more.hidden){let bottom=12;const mw=more.offsetWidth||64,mh=more.offsetHeight||40;
        for(let i=0;i<4;i++){const r={x:w-12-mw,y:h-bottom-mh,w:mw,h:mh},hit=blockers.filter(b=>overlap(r,b));if(!hit.length)break;bottom=Math.ceil(h-Math.min(...hit.map(b=>b.y))+8);}
        more.style.bottom=`${bottom}px`;more.style.visibility=bottom>h*0.5?"hidden":"";}
    }
    function refresh(){if(!frame&&!zoomSettleTimer)frame=requestAnimationFrame(render);}
    // Card placement samples land/water around every card, which is too heavy to
    // repeat on each frame of a zoom. Pans keep the full placement; while the zoom
    // level is changing, cards simply ride their geographic anchors (connectors
    // hidden) and the full placement runs once the zoom settles.
    renderedZoom=map.getZoom?.();
    function followAnchors(){
      for(const c of cards){
        if(c.el.hidden)continue;
        const p=project(anchors.get(key(c.e))||c.e.center);
        if(!p)continue;
        c.el.style.transform=`translate(${p.x}px,${p.y}px)`;c.line.style.display="none";
      }
    }
    function onMove(){
      const zoom=map.getZoom?.();
      if(zoom===renderedZoom&&!zoomSettleTimer){refresh();return;}
      followAnchors();clearTimeout(zoomSettleTimer);
      zoomSettleTimer=setTimeout(()=>{zoomSettleTimer=0;renderedZoom=map.getZoom?.();refresh();},160);
    }
    more.addEventListener("click",()=>{if(more.textContent==="Restore event cards"){dismissed.clear();try{sessionStorage.removeItem("nli-event-card-dismissals");}catch(_){}}else if(more.textContent==="Events"&&cards[0]){options.open(cards[0].e);return;}else page++;signature="";refresh();});
    more.addEventListener("pointerdown",e=>e.stopPropagation());
    map.on("move",onMove);map.on("moveend",onMove);map.on("resize",refresh);
    const layoutChanged=()=>{layoutVersion++;refresh();};
    const observer=new ResizeObserver(layoutChanged);observer.observe(host);
    // Some code rewrites panel classes to the same value on every map frame; only real changes matter.
    const mutations=new MutationObserver(records=>{if(records.some(r=>r.target.getAttribute(r.attributeName)!==r.oldValue))layoutChanged();});for(const el of document.querySelectorAll("#article,#detail,#timeline-dock,.daily-card-stack,.sheet,.activity-panel,.notification-panel"))mutations.observe(el,{attributes:true,attributeOldValue:true,attributeFilter:["class","style","hidden"]});
    const expiryTimer=setInterval(layoutChanged,60000);
    refresh();return {refresh,destroy(){clearInterval(expiryTimer);cancelAnimationFrame(frame);observer.disconnect();mutations.disconnect();clearTimeout(zoomSettleTimer);map.off("moveend",onMove);map.off("move",onMove);map.off("resize",refresh);root.remove();}};
  }

  window.NLI_CALENDAR_UTILS = {
    createMapCallouts,
    addCalendarMapImage,
    addOnThisDayMapImage,
    calendarBadgeMarkup,
    calendarDayNumber,
    calendarMonthDay,
    dateLabelMonthDay,
    eventTypeLabel,
    eventDateRange,
    exhibitDateLabel: eventDateRange,
    isCalendarEventActive,
    isCalendarEventCurrentOrUpcoming,
    isExhibitActive: isCalendarEventActive,
    isExhibitCurrentOrUpcoming: isCalendarEventCurrentOrUpcoming,
    normalizeCalendarEvents,
    onThisDayCalendarMarkup,
    onThisDayNumber,
    isNativeHistoryMoment,
    timelineEventMatchesToday
  };
}());
