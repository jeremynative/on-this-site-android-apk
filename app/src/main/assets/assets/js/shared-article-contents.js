/* Reader navigation only: no map routes, content fetches or polling. */
(function () {
  'use strict';
  function sectionCount(heading, body) {
    const title = heading.textContent.trim();
    const inventory = heading.closest(".site-plant-grid");
    if (inventory && heading === inventory.querySelector("h4")) return inventory.querySelectorAll("[data-plant-observation-id]").length;
    const references = heading.matches('.article-references > summary');
    const history = /^check[\s-]?in history$/i.test(title);
    const moments = /^(historic moments|life timeline and places)$/i.test(title);
    if (!references && !history && !moments) return null;
    let scope;
    if (references) scope = heading.parentElement;
    else if (history) scope = heading.closest('.checkin-history-section');
    if (history && scope) {
      const total = scope.querySelector('.checkin-history-heading > strong')?.textContent.trim();
      if (/^\d+$/.test(total || '')) return Number(total);
    }
    if (!scope) {
      const range = document.createRange(); range.selectNodeContents(body); range.setStartAfter(heading);
      const level = Number(heading.tagName[1]);
      const next = [...body.querySelectorAll('h2,h3,h4')].find(h => (heading.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) && Number(h.tagName[1]) <= level && !h.closest('article,.article-references'));
      if (next) range.setEndBefore(next);
      scope = range.cloneContents();
    }
    if (history) return scope.querySelectorAll('.checkin-history-row').length;
    if (moments) return scope.querySelectorAll('.historic-moment,.timeline-item').length;
    const records = scope.querySelectorAll('.source-reference-card,.article-footnotes > li');
    if (records.length) return records.length;
    const items = [...scope.querySelectorAll('li')].filter(li => !li.parentElement.closest('li'));
    if (items.length) return items.length;
    return [...scope.querySelectorAll('p')].filter(p => p.textContent.trim() && !p.matches('.article-meta')).length;
  }
  function collapseReferences(body) {
    body.querySelectorAll('h2,h3,h4,h5,h6').forEach(heading => {
      if (heading.closest('details') || !/^(references?(?:\s*(?:&|and)\s*sources?)?|sources?(?:\s*(?:&|and)\s*references?)?|page references|references and original records|bibliography|works cited|further reading)\s*:?$/i.test(heading.textContent.trim())) return;
      const disclosure = document.createElement('details'), summary = document.createElement('summary');
      disclosure.className = 'article-references';
      let next = heading.nextSibling;
      heading.before(disclosure); summary.append(heading); disclosure.append(summary);
      while (next) {
        if (next.nodeType === 1 && (/^H[1-6]$/.test(next.tagName) && Number(next.tagName[1]) <= Number(heading.tagName[1]) || next.matches('.article-meta,.section,section'))) break;
        const following = next.nextSibling; disclosure.append(next); next = following;
      }
    });
  }
  function attach(panel, body, mobile) {
    if (!panel || !body) return null;
    const nav = document.createElement('nav');
    nav.className = 'article-contents'; nav.hidden = true;
    nav.setAttribute('aria-label', 'Article contents');
    const toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'article-contents-toggle';
    toggle.innerHTML = '<span class="article-contents-symbol" aria-hidden="true">☰</span><span class="article-contents-caption"><span class="article-contents-label">On this page</span></span><span class="article-contents-chevron" aria-hidden="true">⌄</span>';
    const list = document.createElement('ol');
    list.className = 'article-contents-list'; list.id = panel.id + '-contents-list';
    toggle.setAttribute('aria-controls', list.id);
    nav.append(toggle, list); document.body.append(nav);
    const ignored = 'article, .timeline-item, .timeline-event, .timeline-card, .biography-path-stop, .related-site-card, .source-reference-list, .plant-observation-card, .plant-species-insights, .activity-item, [hidden], details:not([open])';
    let entries = [], offsets = [], active = -1, floating = false, expanded = false;
    let frame = 0, dirty = true, measure = true, destroyed = false, revealCurrent = false;
    function schedule(rebuild = false, geometry = false) {
      dirty ||= rebuild; measure ||= geometry;
      if (!frame && !destroyed) frame = requestAnimationFrame(update);
    }
    function setExpanded(value) {
      expanded = value; list.hidden = !value; revealCurrent = value;
      toggle.setAttribute('aria-expanded', String(value));
      toggle.setAttribute('aria-label', (value ? 'Hide' : 'Show') + ' article contents');
      nav.classList.toggle('is-expanded', value);
    }
    function collect() {
      const candidates = [...body.querySelectorAll('h2,h3,h4,.article-references > summary,[data-plant-observation] > summary')].filter(h => {
        if (h.matches('.article-references > summary,[data-plant-observation] > summary')) return h.getClientRects().length > 0;
        if (h.closest('.article-references')) return false;
        if (!h.textContent.trim() || h.closest(ignored) && h.closest(ignored) !== panel) return false;
        return h.getClientRects().length > 0;
      });
      const next = candidates.map(heading => ({heading, label:heading.matches("[data-plant-observation] > summary") ? "Plant ID" : heading.textContent.trim(), count:sectionCount(heading,body), level:heading.tagName === 'SUMMARY' ? 3 : Number(heading.tagName.slice(1))}));
      if (candidates.length && candidates[0].getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop > 60) {
        next.unshift({heading:body,label:'Overview',level:Math.min(...next.map(e=>e.level))});
      }
      if (next.length === entries.length && next.every((e,i) => e.heading === entries[i].heading && e.label === entries[i].label)) {
        next.forEach((e,i) => { if (e.count !== entries[i].count) { entries[i].count=e.count; renderCount(entries[i]); } });
        return;
      }
      const replacement = entries.length && !entries.some(e => e.heading !== body && body.contains(e.heading));
      entries = next;
      list.replaceChildren(); active = -1;
      const base = Math.min(...entries.map(e => e.level));
      entries.forEach((e,i) => {
        const li = document.createElement('li'), button = document.createElement('button');
        button.type = 'button'; button.className = 'article-contents-link';
        button.textContent = e.label; button.title = e.label;
        button.dataset.sectionIndex = String(i);
        button.style.setProperty('--contents-depth', String(Math.min(2,e.level-base)));
        li.append(button); list.append(li); e.button = button; renderCount(e);
      });
      if (replacement) setExpanded(floating);
      measure = true;
    }
    function renderCount(entry) {
      entry.button.querySelector('.article-contents-count')?.remove();
      if (entry.count == null) return;
      const badge = document.createElement('span'); badge.className='article-contents-count';
      badge.textContent=String(entry.count); badge.setAttribute('aria-hidden','true');
      entry.button.append(badge); entry.button.setAttribute('aria-label',`${entry.label}, ${entry.count} ${entry.count === 1 ? "item" : "items"}`);
    }
    function position() {
      const rect = panel.getBoundingClientRect();
      const available = innerWidth - rect.right - 24;
      const nextFloating = !mobile && innerWidth > 860 && available >= 216;
      if (nextFloating !== floating || (nextFloating ? nav.parentNode !== document.body : nav.parentNode !== panel)) {
        floating = nextFloating;
        if (floating) document.body.append(nav); else panel.insertBefore(nav, body);
        nav.classList.toggle('is-floating', floating);
        panel.classList.toggle('has-article-contents-inline', !floating);
        setExpanded(floating); measure = true;
      }
      const viewportHeight = window.visualViewport?.height || innerHeight;
      if (floating) {
        nav.style.left = Math.round(rect.right + 12) + 'px';
        nav.style.top = Math.round(Math.max(12,rect.top)) + 'px';
        nav.style.maxHeight = Math.max(100,Math.min(rect.height,viewportHeight-rect.top-12)) + 'px';
        nav.style.setProperty('--contents-list-height', Math.max(48,Math.min(rect.height,viewportHeight-rect.top-12)-68) + 'px');
      } else {
        nav.style.removeProperty('left'); nav.style.removeProperty('top'); nav.style.removeProperty('max-height');
        nav.style.setProperty('--contents-list-height', Math.max(44,Math.min(240,rect.height * .45,body.clientHeight - 12)) + 'px');
      }
    }
    function update() {
      frame = 0;
      if (dirty) collapseReferences(body);
      const visible = panel.classList.contains('open') && body.classList.contains('content-entry-body') && panel.getClientRects().length && !panel.inert;
      // toggle(…, false) leaves the attribute alone when the class is absent. classList.remove
      // always rewrites it, which re-fired panelObserver and ran this every frame while closed.
      if (!visible) { nav.hidden = true; panel.classList.toggle('has-article-contents-inline', false); return; }
      if (dirty) { dirty = false; collect(); }
      nav.hidden = entries.length < 2;
      if (nav.hidden) { panel.classList.toggle('has-article-contents-inline', false); return; }
      position();
      // Restoring a closed reader must restore its reserved inline row, too.
      panel.classList.toggle('has-article-contents-inline', !floating);
      if (measure) {
        const top = body.getBoundingClientRect().top;
        offsets = entries.map(e => e.heading === body ? 0 : e.heading.getBoundingClientRect().top - top + body.scrollTop);
        measure = false;
      }
      // Desktop follows the section entering the middle of the reading area.
      const point = body.scrollTop + (mobile ? 20 : body.clientHeight * 0.5);
      let index = 0;
      // Keep the first entry selected while the reader is at the top.
      if (body.scrollTop > 3) {
        for (let i = 0; i < offsets.length; i++) { if (offsets[i] <= point) index = i; else break; }
        if (body.scrollHeight > body.clientHeight && body.scrollTop + body.clientHeight >= body.scrollHeight - 3) index = entries.length - 1;
      }
      if (index !== active) {
        entries[active]?.button.removeAttribute('aria-current'); active = index;
        const e = entries[index]; e.button.setAttribute('aria-current','location');
        if (!nav.contains(document.activeElement)) revealCurrent = true;
      }
      if (expanded && revealCurrent) {
        revealCurrent = false;
        const button = entries[active]?.button;
        if (button) {
          const y = button.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
          if (y < list.scrollTop || y + button.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = Math.max(0,y-list.clientHeight/2);
        }
      }
    }
    toggle.addEventListener('click', () => { setExpanded(!expanded); schedule(false,true); });
    nav.addEventListener('keydown', event => {
      if (event.key === 'Escape' && expanded) { event.preventDefault(); event.stopPropagation(); setExpanded(false); toggle.focus(); }
    });
    list.addEventListener('click', event => {
      const button = event.target.closest('[data-section-index]'); if (!button) return;
      const e = entries[Number(button.dataset.sectionIndex)]; if (!e?.heading.isConnected) return;
      if (!floating) setExpanded(false);
      const target = e.heading;
      if (target.matches('.article-references > summary,[data-plant-observation] > summary')) target.parentElement.open = true;
      const y = target === body ? 0 : body.scrollTop + target.getBoundingClientRect().top - body.getBoundingClientRect().top - 12;
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex','-1');
      target.focus({preventScroll:true});
      body.scrollTo({top:Math.max(0,y),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      schedule(false,true);
    });
    const onScroll = () => schedule();
    const onReferenceLink = event => {
      const href = event.target.closest?.('a[href^="#"]')?.getAttribute('href');
      if (!href) return;
      let id; try { id = decodeURIComponent(href.slice(1)); } catch { return; }
      const target = document.getElementById(id);
      if (!target || !body.contains(target)) return;
      for (let parent = target.parentElement; parent && parent !== body; parent = parent.parentElement) {
        if (parent.matches('details.article-references')) parent.open = true;
      }
    };
    const onResize = () => schedule(false,true);
    const onTransition = () => schedule(true,true);
    const observer = new MutationObserver(() => schedule(true,true));
    observer.observe(body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','hidden','open']});
    const panelObserver = new MutationObserver(() => schedule(true,true));
    panelObserver.observe(panel,{attributes:true,attributeFilter:['class','style','inert']});
    const resize = new ResizeObserver(onResize); resize.observe(panel); resize.observe(body);
    body.addEventListener('scroll',onScroll,{passive:true}); body.addEventListener('load',onResize,true);
    body.addEventListener('click',onReferenceLink,true);
    panel.addEventListener('transitionend',onTransition); window.addEventListener('resize',onResize);
    window.visualViewport?.addEventListener('resize',onResize);
    setExpanded(false); schedule(true,true);
    return { refresh:()=>schedule(true,true), destroy(){
      destroyed=true; cancelAnimationFrame(frame); observer.disconnect(); panelObserver.disconnect(); resize.disconnect();
      body.removeEventListener('scroll',onScroll); body.removeEventListener('load',onResize,true);
      body.removeEventListener('click',onReferenceLink,true);
      panel.removeEventListener('transitionend',onTransition); window.removeEventListener('resize',onResize);
      window.visualViewport?.removeEventListener('resize',onResize); panel.classList.remove('has-article-contents-inline'); nav.remove();
    }};
  }
  window.NLI_ARTICLE_CONTENTS = {attach};
  function start() {
    const mobile = Boolean(document.getElementById('detail-body'));
    attach(document.getElementById(mobile?'detail':'article'),document.getElementById(mobile?'detail-body':'article-body'),mobile);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
}());
