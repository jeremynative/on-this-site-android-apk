(function () {
  function normalizeUploadFileId(uploaded) {
    if (!uploaded) return null;
    if (typeof uploaded === "string" || typeof uploaded === "number") return String(uploaded);
    return uploaded.data?.id || uploaded.id || null;
  }

  async function uploadDirectusFile(client, file, title, requestOptions = {}) {
    if (!client?.uploadFile) return null;
    return normalizeUploadFileId(await client.uploadFile(file, title, requestOptions)) || null;
  }

  function createDirectusClient(options = {}) {
    const baseUrl = String(options.baseUrl || "").replace(/\/+$/, "");
    const cacheVersion = options.cacheVersion || "";
    const tokenProvider = typeof options.tokenProvider === "function" ? options.tokenProvider : () => "";
    const refreshTokenProvider = typeof options.refreshTokenProvider === "function" ? options.refreshTokenProvider : () => "";
    const onTokenRefresh = typeof options.onTokenRefresh === "function" ? options.onTokenRefresh : () => {};
    const onAuthExpired = typeof options.onAuthExpired === "function" ? options.onAuthExpired : () => {};
    const fetchErrorPrefix = options.fetchErrorPrefix || "Directus request failed";
    const fetchErrorSeparator = options.fetchErrorSeparator ?? ": ";
    const inFlightFetches = new Map();
    let refreshPromise = null;
    let expireAfterRefreshFailure = false;

    async function readErrorBody(response) {
      const text = await response.text().catch(() => "");
      if (!text) return "";
      return text.slice(0, 240);
    }

    function isAuthFailure(response) {
      return response?.status === 401 || response?.status === 403;
    }

    function authExpiredMessage(action = "save changes") {
      return `Login expired. Please log in again, then ${action}.`;
    }

    function expiredAuthError(message) {
      const error = new Error(message || authExpiredMessage());
      error.code = "AUTH_EXPIRED";
      return error;
    }

    function responseLooksExpired(response, body = "") {
      if (response?.status === 401) return true;
      return /TOKEN_EXPIRED|Token expired|INVALID_TOKEN|Invalid token/i.test(String(body || ""));
    }

    function authHeaders(token, extra = {}) {
      return token ? { ...extra, authorization: `Bearer ${token}` } : { ...extra };
    }

    async function refreshAuthToken(options = {}) {
      expireAfterRefreshFailure ||= options.expireOnAuthFailure !== false;
      if (refreshPromise) return refreshPromise;
      const attemptedRefreshToken = refreshTokenProvider();
      if (!attemptedRefreshToken) return "";
      refreshPromise = (async () => {
        const response = await fetch(`${baseUrl}/auth/refresh`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ refresh_token: attemptedRefreshToken, mode: "json" })
        }).catch(() => null);
        if (!response) return "";
        if (!response.ok) {
          const tokenIsCurrent = refreshTokenProvider() === attemptedRefreshToken;
          if (expireAfterRefreshFailure && tokenIsCurrent && isAuthFailure(response)) onAuthExpired();
          return "";
        }
        const data = await response.json();
        const next = data?.data || {};
        const accessToken = next.access_token || "";
        if (!accessToken) {
          const tokenIsCurrent = refreshTokenProvider() === attemptedRefreshToken;
          if (expireAfterRefreshFailure && tokenIsCurrent) onAuthExpired();
          return "";
        }
        onTokenRefresh({
          token: accessToken,
          refreshToken: next.refresh_token || attemptedRefreshToken,
          expires: next.expires || null
        });
        return accessToken;
      })();
      try {
        return await refreshPromise;
      } finally {
        refreshPromise = null;
        expireAfterRefreshFailure = false;
      }
    }

    async function logout() {
      const refreshToken = refreshTokenProvider();
      if (!refreshToken) return true;
      const response = await fetch(`${baseUrl}/auth/logout`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken, mode: "json" })
      }).catch(() => null);
      return Boolean(response?.ok);
    }

    async function fetchAuthenticated(url, fetchOptions = {}, requestOptions = {}) {
      const response = await withAuthRetry(token => fetch(url, {
        ...fetchOptions,
        headers: authHeaders(token, fetchOptions.headers || {})
      }), { ...requestOptions, requireAuth: true });
      if (!response.ok) {
        const body = await readErrorBody(response);
        if (responseLooksExpired(response, body)) {
          onAuthExpired();
          throw expiredAuthError(requestOptions.authExpiredMessage || authExpiredMessage());
        }
        let message = body;
        try {
          message = JSON.parse(body)?.error || body;
        } catch {}
        throw new Error(message || `${fetchErrorPrefix}${fetchErrorSeparator}${response.status}`);
      }
      return response;
    }

    async function withAuthRetry(send, requestOptions = {}) {
      const requireAuth = requestOptions.requireAuth === true;
      let token = tokenProvider();
      if (requireAuth && !token) {
        token = await refreshAuthToken({ expireOnAuthFailure: true });
      }
      if (requireAuth && !token) {
        throw expiredAuthError(requestOptions.authExpiredMessage || requestOptions.missingAuthMessage || authExpiredMessage());
      }
      let response = await send(token);
      if (isAuthFailure(response) && token && requireAuth) {
        const refreshed = await refreshAuthToken();
        if (refreshed) response = await send(refreshed);
      }
      return response;
    }

    async function ensureAuthSession(requestOptions = {}) {
      let token = tokenProvider();
      if (!token) token = await refreshAuthToken({ expireOnAuthFailure: true });
      if (!token && requestOptions.requireAuth === true) {
        throw expiredAuthError(requestOptions.authExpiredMessage || requestOptions.missingAuthMessage || authExpiredMessage());
      }
      return token;
    }

    async function fetchJsonFromNetwork(path, requestOptions = {}, cacheKey = "", ttl = 0) {
      const separator = String(path).includes("?") ? "&" : "?";
      const fresh = requestOptions.fresh !== false;
      const url = fresh ? `${baseUrl}${path}${separator}_=${Date.now()}` : `${baseUrl}${path}`;
      const headers = {};
      // Public archive reads must not wait for contributor-token refresh. A
      // stale signed-in session previously made an otherwise public article
      // take several seconds to open before the anonymous retry completed.
      const token = requestOptions.anonymous === true ? "" : tokenProvider();
      if (token) headers.authorization = `Bearer ${token}`;
      let response = await fetch(url, { headers, cache: fresh ? "no-store" : "default" });
      if (response.status === 403 && path.includes("why_this_matters")) {
        const fallbackPath = path
          .replace(/,?why_this_matters,?/g, match => match === ",why_this_matters," ? "," : "")
          .replace(/fields=,/g, "fields=")
          .replace(/,,/g, ",");
        const fallbackSeparator = fallbackPath.includes("?") ? "&" : "?";
        const fallbackUrl = fresh ? `${baseUrl}${fallbackPath}${fallbackSeparator}_=${Date.now()}` : `${baseUrl}${fallbackPath}`;
        response = await fetch(fallbackUrl, { headers, cache: fresh ? "no-store" : "default" });
      }
      if ((response.status === 401 || response.status === 403) && token) {
        const refreshed = await refreshAuthToken({ expireOnAuthFailure: false });
        if (refreshed) {
          response = await fetch(url, { headers: authHeaders(refreshed), cache: fresh ? "no-store" : "default" });
        }
      }
      if ((response.status === 401 || response.status === 403) && token) {
        response = await fetch(url, { cache: fresh ? "no-store" : "default" });
      }
      if (!response.ok) throw new Error(`${requestOptions.errorPrefix || fetchErrorPrefix}${requestOptions.errorSeparator ?? fetchErrorSeparator}${response.status}`);
      const data = await response.json();

      if (cacheKey && ttl > 0) {
        try {
          const payload = JSON.stringify({ time: Date.now(), data });
          localStorage.setItem(cacheKey, payload);
          sessionStorage.setItem(cacheKey, payload);
        } catch {}
      }
      return data;
    }

    async function fetchJson(path, requestOptions = {}) {
      const cacheKey = requestOptions.cacheKey && cacheVersion
        ? `nli-cache:${cacheVersion}:${requestOptions.cacheKey}:${path}`
        : "";
      const ttl = Number(requestOptions.ttl || 0);
      if (cacheKey && ttl > 0) {
        try {
          const cached = JSON.parse(localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey) || "null");
          if (cached?.time && Date.now() - cached.time < ttl) return cached.data;
        } catch {}
      }

      const token = requestOptions.anonymous === true ? "" : tokenProvider();
      const dedupeKey = requestOptions.dedupe === false
        ? ""
        : [path, requestOptions.fresh !== false ? "fresh" : "cacheable", token || "", requestOptions.errorPrefix || fetchErrorPrefix, requestOptions.errorSeparator ?? fetchErrorSeparator].join("|");
      if (dedupeKey && inFlightFetches.has(dedupeKey)) return inFlightFetches.get(dedupeKey);
      const request = fetchJsonFromNetwork(path, requestOptions, cacheKey, ttl);
      if (!dedupeKey) return request;
      inFlightFetches.set(dedupeKey, request);
      try {
        return await request;
      } finally {
        inFlightFetches.delete(dedupeKey);
      }
    }

    async function postItem(collection, payload, requestOptions = {}) {
      const token = tokenProvider();
      const requireAuth = requestOptions.requireAuth === true;
      const timeout = Number(requestOptions.timeout || 0);
      const controller = timeout && typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller ? window.setTimeout(() => controller.abort(), timeout) : null;
      try {
        let response = await withAuthRetry(authToken => fetch(`${baseUrl}/items/${collection}`, {
          method: "POST",
          headers: authHeaders(authToken, { "content-type": "application/json" }),
          body: JSON.stringify(payload),
          signal: controller?.signal
        }), { ...requestOptions, missingAuthMessage: `Login required to save ${collection}.` });
        if ((response.status === 401 || response.status === 403) && token && !requireAuth) {
          response = await fetch(`${baseUrl}/items/${collection}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller?.signal
          });
        }
        if (!response.ok) {
          const text = await readErrorBody(response);
          if (requireAuth && responseLooksExpired(response, text)) {
            onAuthExpired();
            throw expiredAuthError(requestOptions.authExpiredMessage || authExpiredMessage(`save ${collection}`));
          }
          throw new Error(`Could not save ${collection}: ${response.status}${text ? ` ${text.slice(0, 240)}` : ""}`);
        }
        const text = await response.text();
        return text ? JSON.parse(text) : { data: null };
      } finally {
        if (timer) window.clearTimeout(timer);
      }
    }

    async function patchItem(collection, id, payload, requestOptions = {}) {
      const token = tokenProvider();
      const requireAuth = requestOptions.requireAuth === true;
      const response = await withAuthRetry(authToken => fetch(`${baseUrl}/items/${collection}/${id}`, {
        method: "PATCH",
        headers: authHeaders(authToken, { "content-type": "application/json" }),
        body: JSON.stringify(payload)
      }), { ...requestOptions, missingAuthMessage: `Login required to update ${collection}.` });
      if (!response.ok) {
        const text = await readErrorBody(response);
        if (requireAuth && responseLooksExpired(response, text)) {
          onAuthExpired();
          throw expiredAuthError(requestOptions.authExpiredMessage || authExpiredMessage(`update ${collection}`));
        }
        throw new Error(`Could not update ${collection}: ${response.status}${text ? ` ${text}` : ""}`);
      }
      return response.json();
    }

    async function deleteItem(collection, id, requestOptions = {}) {
      const token = tokenProvider();
      const requireAuth = requestOptions.requireAuth === true;
      const response = await withAuthRetry(authToken => fetch(`${baseUrl}/items/${collection}/${id}`, {
        method: "DELETE",
        headers: authHeaders(authToken)
      }), { ...requestOptions, missingAuthMessage: `Login required to delete ${collection}.` });
      if (!response.ok) {
        const text = await readErrorBody(response);
        if (requireAuth && responseLooksExpired(response, text)) {
          onAuthExpired();
          throw expiredAuthError(requestOptions.authExpiredMessage || authExpiredMessage(`delete ${collection}`));
        }
        throw new Error(`Could not delete ${collection}: ${response.status}${text ? ` ${text}` : ""}`);
      }
      return true;
    }

    function filterValue(value) {
      return encodeURIComponent(String(value || ""));
    }

    async function fetchFirstItem(collection, filterField, value, fields = "", requestOptions = {}) {
      if (!value) return null;
      const fieldsParam = fields ? `&fields=${fields}` : "";
      const response = await fetchJson(`/items/${collection}?limit=1&filter[${filterField}][_eq]=${filterValue(value)}${fieldsParam}`, requestOptions);
      return response.data?.[0] || null;
    }

    async function triggerFlow(flowId, payload = {}, requestOptions = {}) {
      if (!flowId) return { ok: false, data: null };
      try {
        const response = await fetch(`${baseUrl}/flows/trigger/${flowId}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          cache: requestOptions.cache || "no-store"
        });
        if (!response.ok) return { ok: false, data: null };
        const text = await response.text();
        return { ok: true, data: text ? JSON.parse(text) : null };
      } catch (_error) {
        return { ok: false, data: null };
      }
    }

    async function triggerReviewAction(action, payload = {}, requestOptions = {}) {
      const normalizedAction = action === "approve" ? "approve" : "decline";
      const flowIds = requestOptions.flowIds || {};
      const flowId = flowIds[normalizedAction] || "";
      const flowResult = await triggerFlow(flowId, payload, requestOptions.flowOptions || {});
      if (flowResult.ok) return flowResult.data;
      const collection = requestOptions.collection || "site_suggestions";
      const statusField = requestOptions.statusField || "status";
      const noteField = requestOptions.noteField || "review_note";
      return patchItem(collection, payload.id, {
        [statusField]: normalizedAction === "approve"
          ? (requestOptions.approvedStatus || "approved")
          : (requestOptions.declinedStatus || "declined"),
        [noteField]: payload[noteField] || payload.review_note || ""
      }, requestOptions.patchOptions || {});
    }

    async function loginWithPassword(email, password) {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, mode: "json" })
      });
      if (!response.ok) throw new Error("Login failed.");
      const data = await response.json();
      return data?.data || {};
    }

    async function fetchProfileForToken(token, requestOptions = {}) {
      if (!token) return { user: null, profile: null };
      const userFields = requestOptions.userFields || "id,email,first_name,last_name";
      const profileFields = requestOptions.profileFields || "";
      const profileCollection = requestOptions.profileCollection || "mobile_member_profiles";
      const sessionProfileEndpoint = requestOptions.sessionProfileEndpoint === false
        ? ""
        : (requestOptions.sessionProfileEndpoint || "https://nativelongisland.com/engagement-action.php");
      if (sessionProfileEndpoint) {
        try {
          const sessionResponse = await fetch(sessionProfileEndpoint, {
            method: "POST",
            headers: { ...authHeaders(token), "content-type": "application/json" },
            body: JSON.stringify({ event_type: "session_profile" }),
            cache: "no-store"
          });
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            if (sessionData?.user?.id && sessionData?.profile?.id) {
              return { user: sessionData.user, profile: sessionData.profile };
            }
          }
        } catch (error) {
          console.warn("Secure profile session lookup failed; trying Directus permissions.", error);
        }
      }
      const userResponse = await fetch(`${baseUrl}/users/me?fields=${userFields}`, {
        headers: authHeaders(token),
        cache: "no-store"
      });
      if (!userResponse.ok) return { user: null, profile: null };
      const user = (await userResponse.json()).data || null;
      if (!user?.id) return { user, profile: null };
      const fieldsParam = profileFields ? `&fields=${profileFields}` : "";
      const profileResponse = await fetch(`${baseUrl}/items/${profileCollection}?limit=1&filter[directus_user][_eq]=${encodeURIComponent(user.id)}${fieldsParam}`, {
        headers: authHeaders(token),
        cache: "no-store"
      });
      if (!profileResponse.ok) return { user, profile: null };
      const profile = (await profileResponse.json()).data?.[0] || null;
      return { user, profile };
    }

    async function uploadFile(file, title, requestOptions = {}) {
      const body = new FormData();
      body.append("file", file);
      body.append("title", title || file.name);
      const token = tokenProvider();
      const requireAuth = requestOptions.requireAuth === true;
      let response = await withAuthRetry(authToken => fetch(`${baseUrl}/files`, { method: "POST", headers: authHeaders(authToken), body }), { ...requestOptions, missingAuthMessage: "Login required to upload images." });
      if ((response.status === 401 || response.status === 403) && token && !requireAuth) {
        response = await fetch(`${baseUrl}/files`, { method: "POST", body });
      }
      if (!response.ok) {
        const text = await readErrorBody(response);
        if (requireAuth && responseLooksExpired(response, text)) {
          onAuthExpired();
          throw expiredAuthError(requestOptions.authExpiredMessage || authExpiredMessage("upload the image"));
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error("This account does not have permission to upload images yet.");
        }
        throw new Error(`Could not upload image: ${response.status}`);
      }
      const data = await response.json();
      return normalizeUploadFileId(data);
    }

    return { fetchJson, postItem, patchItem, deleteItem, filterValue, fetchFirstItem, triggerFlow, triggerReviewAction, loginWithPassword, fetchProfileForToken, uploadFile, ensureAuthSession, fetchAuthenticated, logout };
  }

  window.NLI_DIRECTUS_CLIENT = { createDirectusClient, normalizeUploadFileId, uploadDirectusFile };
}());
