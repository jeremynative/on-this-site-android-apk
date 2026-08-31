(function () {
  if (window.__nliNavigationCompanionInstalled) return true;
  window.__nliNavigationCompanionInstalled = true;
  const token = String(window.__NLI_ANDROID_BRIDGE_TOKEN || "");
  const bridge = window.AndroidApp;
  if (!token || !bridge?.setNavigationCompanionEnabled || !bridge?.isNavigationCompanionEnabled) return false;

  const install = () => {
    const settingsBody = document.querySelector("#settings-sheet .sheet-body");
    if (!settingsBody || document.getElementById("navigation-companion-toggle")) return false;
    const row = document.createElement("div");
    row.className = "toggle-row";
    row.innerHTML = `
      <span>
        <label for="navigation-companion-toggle">Google Maps companion</label>
        <p>While you travel on Long Island, show nearby public-site alerts. Tapping an alert asks before opening Google Maps; Google Maps controls any route change.</p>
        <p id="navigation-companion-status" class="form-status" aria-live="polite"></p>
        <button id="navigation-companion-undo" class="action secondary" type="button" hidden>Undo and turn off</button>
      </span>
      <input id="navigation-companion-toggle" type="checkbox">
    `;
    const proximityRow = document.getElementById("proximity-alerts")?.closest(".toggle-row");
    if (proximityRow) proximityRow.insertAdjacentElement("afterend", row);
    else settingsBody.prepend(row);
    const toggle = row.querySelector("#navigation-companion-toggle");
    const status = row.querySelector("#navigation-companion-status");
    const undo = row.querySelector("#navigation-companion-undo");
    let undoTimer = 0;

    const enabled = () => {
      try { return bridge.isNavigationCompanionEnabled(token) === true; } catch { return false; }
    };
    const render = (message = "") => {
      const on = enabled();
      toggle.checked = on;
      status.textContent = message || (on
        ? "On. Turn it off here or from the persistent Android notification."
        : "Off. No navigation companion location service is running.");
      if (!on) undo.hidden = true;
    };
    const turnOff = () => {
      window.clearTimeout(undoTimer);
      try { bridge.setNavigationCompanionEnabled(token, false); } catch {}
      render("Turned off. You can enable it again at any time.");
    };
    toggle.addEventListener("change", () => {
      if (!toggle.checked) return turnOff();
      let result = 0;
      try { result = Number(bridge.setNavigationCompanionEnabled(token, true)) || 0; } catch {}
      if (result === 1) {
        render("Companion enabled. Undo is available below and in the Android notification.");
        undo.hidden = false;
        undoTimer = window.setTimeout(() => { undo.hidden = true; }, 10000);
      } else if (result === 2) {
        status.textContent = "Finish the Android location and notification prompts to enable it.";
        window.setTimeout(() => render(), 1500);
      } else {
        render("Companion was not enabled. Check location and notification permissions and try again.");
      }
    });
    undo.addEventListener("click", turnOff);
    window.addEventListener("nli-navigation-companion-change", event => {
      render(event.detail?.enabled ? "Companion enabled. You can undo here or from the Android notification." : "Companion turned off.");
    });
    render();
    return true;
  };

  if (!install()) {
    const observer = new MutationObserver(() => {
      if (install()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 20000);
  }
  return true;
})();
