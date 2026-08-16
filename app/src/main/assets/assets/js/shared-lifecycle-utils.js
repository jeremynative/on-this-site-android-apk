(function initSharedLifecycleUtils(global) {
  "use strict";

  function contentKey(content) {
    if (!content || typeof content !== "object") return "";
    const type = String(content.type || "").trim();
    const target = String(content.slug || content.page || "").trim();
    return type && target ? `${type}:${target}` : "";
  }

  function stableSerialize(value) {
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    if (value && typeof value === "object") {
      return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  }

  function snapshotSignature(snapshot) {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return "";
    const { savedAt: _savedAt, ...state } = snapshot;
    return stableSerialize(state);
  }

  function snapshotIsValid(snapshot, options = {}) {
    const savedAt = Number(snapshot?.savedAt);
    const now = Number(options.now ?? Date.now());
    const maxAge = Math.max(0, Number(options.maxAge || 0));
    const futureTolerance = Math.max(0, Number(options.futureTolerance ?? 60000));
    if (!Number.isFinite(savedAt) || savedAt <= 0 || !Number.isFinite(now) || !maxAge) return false;
    const age = now - savedAt;
    return age >= -futureTolerance && age <= maxAge;
  }

  function createScrollRestorer(options = {}) {
    const element = options.element;
    const targetScrollTop = Math.max(0, Number(options.targetScrollTop || 0));
    const isActive = typeof options.isActive === "function" ? options.isActive : () => true;
    const setTimer = options.setTimeout || global.setTimeout?.bind(global);
    const clearTimer = options.clearTimeout || global.clearTimeout?.bind(global);
    const now = typeof options.now === "function" ? options.now : () => Date.now();
    const maxDurationMs = Math.max(250, Number(options.maxDurationMs || 8000));
    const retryDelays = Array.isArray(options.retryDelays) && options.retryDelays.length
      ? options.retryDelays.map(value => Math.max(0, Number(value) || 0))
      : [16, 120, 350, 900, 1800, 2500];
    const userEvents = ["pointerdown", "pointermove", "touchstart", "touchmove", "wheel", "keydown"];
    const startedAt = now();
    let timer = null;
    let retryIndex = 0;
    let reachedAttempts = 0;
    let active = Boolean(element && targetScrollTop > 0 && setTimer && clearTimer);

    const controller = {
      get active() {
        return active;
      },
      get targetScrollTop() {
        return targetScrollTop;
      },
      cancel
    };

    function cleanup() {
      if (timer !== null) clearTimer(timer);
      timer = null;
      for (const eventName of userEvents) element?.removeEventListener?.(eventName, cancel, true);
    }

    function cancel() {
      if (!active) return;
      active = false;
      cleanup();
      options.onStop?.();
    }

    function scheduleNext(elapsed) {
      const configuredDelay = retryDelays[Math.min(retryIndex, retryDelays.length - 1)] || 250;
      retryIndex += 1;
      const remaining = Math.max(0, maxDurationMs - elapsed);
      if (!remaining) {
        cancel();
        return;
      }
      timer = setTimer(apply, Math.min(configuredDelay, remaining));
    }

    function apply() {
      timer = null;
      if (!active || !isActive()) {
        cancel();
        return;
      }
      const maximum = Math.max(0, Number(element.scrollHeight || 0) - Number(element.clientHeight || 0));
      const reachableTarget = Math.min(targetScrollTop, maximum);
      if (maximum > 0) element.scrollTop = reachableTarget;
      const targetReached = maximum + 1 >= targetScrollTop
        && Math.abs(Number(element.scrollTop || 0) - targetScrollTop) <= 1;
      reachedAttempts = targetReached ? reachedAttempts + 1 : 0;
      const elapsed = Math.max(0, now() - startedAt);
      if ((targetReached && reachedAttempts >= 2 && elapsed >= 250) || elapsed >= maxDurationMs) {
        cancel();
        return;
      }
      scheduleNext(elapsed);
    }

    if (!active) return controller;
    for (const eventName of userEvents) {
      element.addEventListener?.(eventName, cancel, { capture: true, passive: true });
    }
    apply();
    return controller;
  }

  global.NLI_LIFECYCLE_UTILS = Object.freeze({
    contentKey,
    createScrollRestorer,
    snapshotIsValid,
    snapshotSignature
  });
})(window);
