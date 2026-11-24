// "Continue with Google" and "Continue with Facebook" for contributors, beside
// the email login on the desktop and phone web pages and in the Android app.
// Directus signs the person in with the provider (its SSO), sets its refresh
// cookie and sends them back here with ?sso=<provider>; the page then trades
// that cookie for the same tokens a password login gets. A first sign-in has
// no contributor profile yet: the visitor confirms the name to show and agrees
// to the privacy policy, and account-registration.php (sso_complete) creates
// the active account an email sign-up gets after its verification link. A
// button shows only for a provider the server offers.
//
// Google and Facebook refuse sign-in inside app web views, so in the Android
// app the button asks the app (AndroidApp.openSignIn) to sign in in the
// browser; sso-app-return.html there hands the session back to the app, which
// passes it to window.NLI_SSO_APP_RETURN here.
(function () {
  const PRIVACY_URL = "https://nativelongisland.com/privacy-policy.html";
  // The provider a tab left for: Directus drops ?sso when sign-in fails.
  const PENDING = "nli-sso-pending";
  const GOOGLE_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.8-2.1 5.1-4.4 6.7v5.6h7.1c4.2-3.9 6.6-9.6 6.6-16.3z"/><path fill="#34A853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.6c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.6-3.9-12.4-9.1H4.3v5.7C7.9 41 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.6 28c-.4-1.3-.7-2.6-.7-4s.3-2.7.7-4v-5.7H4.3C2.8 17.3 2 20.6 2 24s.8 6.7 2.3 9.7l7.3-5.7z"/><path fill="#EA4335" d="M24 10.9c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C35 4.4 30 2 24 2 15.4 2 7.9 7 4.3 14.3l7.3 5.7c1.8-5.2 6.6-9.1 12.4-9.1z"/></svg>';
  const FACEBOOK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/></svg>';
  const PROVIDERS = [
    { name: "google", label: "Google", icon: GOOGLE_ICON },
    { name: "facebook", label: "Facebook", icon: FACEBOOK_ICON }
  ];
  const byName = name => PROVIDERS.find(provider => provider.name === name) || null;
  // What went wrong, from the reason Directus sends back (the app passes it on
  // as the error): INVALID_PROVIDER means the email already has a password
  // account; SERVICE_UNAVAILABLE means the server could not finish with the
  // provider, which is ours to fix, not the visitor's.
  const failed = (provider, reason) => {
    const name = provider ? `${provider.label} sign-in` : "Sign-in";
    if (reason === "INVALID_PROVIDER") return "This email already has an On This Site account. Log in with its email and password.";
    if (reason === "SERVICE_UNAVAILABLE") return `${name} isn't working right now. Please try again later, or log in with your email and password.`;
    return `${name} could not finish. Please try again, or log in with your email and password.`;
  };

  function create(ctx) {
    const directus = ctx.directusUrl;
    const inApp = () => Boolean(ctx.inApp?.());
    let offered = null;
    let queued = false;

    // The providers the server lists publicly; in the app, only when the app
    // can open the browser for them.
    function providers() {
      if (inApp() && typeof window.AndroidApp?.openSignIn !== "function") return Promise.resolve([]);
      if (!offered) {
        offered = fetch(`${directus}/auth`, { cache: "no-store" })
          .then(response => response.ok ? response.json() : null)
          .then(json => {
            const names = (json?.data || []).map(provider => String(provider?.name || "").toLowerCase());
            return PROVIDERS.filter(provider => names.includes(provider.name));
          })
          .catch(() => []);
      }
      return offered;
    }

    function isOffered() {
      return providers().then(list => list.length > 0);
    }

    // Back to this page after signing in. The website comes back to its home
    // page, the address on the server's allow list there (Directus matches the
    // path exactly); the phone page lives on the server's own host, where any
    // page is allowed.
    function startUrl(name = "google") {
      const back = new URL(window.location.href);
      if (back.host !== new URL(directus).host) back.pathname = "/";
      back.hash = "";
      back.searchParams.delete("reason");
      back.searchParams.set("sso", name);
      return `${directus}/auth/login/${name}?redirect=${encodeURIComponent(back.toString())}`;
    }

    function installStyles() {
      if (document.getElementById("social-signin-styles")) return;
      const style = document.createElement("style");
      style.id = "social-signin-styles";
      style.textContent = `
        .social-signin { display: grid; gap: 8px; margin: 10px 0 0; }
        .social-signin-link { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 44px; padding: 8px 16px;
          border: 1px solid #c9d3cb; border-radius: 10px; background: #fff; color: #1f1f1f; font-family: inherit; font-size: 15px; font-weight: 600;
          line-height: 1.2; text-decoration: none; }
        .social-signin-link svg { width: 20px; height: 20px; flex: none; }
        .social-signin-link:focus-visible { outline: 3px solid #2d6b4f; outline-offset: 2px; }
        .social-signin-dialog { position: fixed; inset: 0; z-index: 2147483000; display: grid; place-items: center; padding: 16px; background: rgba(16, 28, 21, 0.55); }
        .social-signin-dialog form { width: min(420px, 100%); padding: 20px; border-radius: 14px; background: #fff; color: #10231a; box-shadow: 0 18px 40px rgba(0, 0, 0, 0.3); }
        .social-signin-dialog h2 { margin: 0 0 8px; font-size: 20px; }
        .social-signin-dialog p { margin: 0 0 12px; line-height: 1.45; }
        .social-signin-dialog label { display: block; margin: 10px 0 4px; font-weight: 700; }
        .social-signin-dialog input[type=text] { box-sizing: border-box; width: 100%; padding: 10px; border: 1px solid #b9c5bc; border-radius: 8px; font: inherit; }
        .social-signin-dialog .agree { display: flex; gap: 8px; align-items: flex-start; font-weight: 400; }
        .social-signin-dialog .actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
        .social-signin-dialog button { min-height: 42px; padding: 8px 14px; border-radius: 8px; border: 1px solid #2d6b4f; font-family: inherit; font-size: 15px; font-weight: 700; line-height: 1; }
        .social-signin-dialog button[type=submit] { background: #2d6b4f; color: #fff; }
        .social-signin-dialog button[type=button] { background: #fff; color: #2d6b4f; }
        .social-signin-dialog .status { min-height: 1.2em; margin: 10px 0 0; color: #a12b1f; }
      `;
      document.head.appendChild(style);
    }

    // A "Continue with ..." link per provider right after each email login button.
    function addButtons(list) {
      queued = false;
      document.querySelectorAll(ctx.loginSelector).forEach(login => {
        if (login.nextElementSibling?.classList.contains("social-signin")) return;
        const group = document.createElement("div");
        group.className = "social-signin";
        list.forEach(provider => {
          const link = document.createElement("a");
          link.className = `social-signin-link ${provider.name}`;
          link.href = startUrl(provider.name);
          link.innerHTML = `${provider.icon}<span>Continue with ${provider.label}</span>`;
          link.addEventListener("click", event => {
            if (inApp()) {
              event.preventDefault();
              window.AndroidApp.openSignIn(String(window.__NLI_ANDROID_BRIDGE_TOKEN || ""), provider.name);
              return;
            }
            link.href = startUrl(provider.name);
            try {
              window.sessionStorage.setItem(PENDING, provider.name);
            } catch (error) {
              // Without storage a failed sign-in just returns to the page.
            }
          });
          group.appendChild(link);
        });
        login.insertAdjacentElement("afterend", group);
      });
    }

    async function watch() {
      const list = await providers();
      if (!list.length) return;
      installStyles();
      addButtons(list);
      // Login forms are drawn and redrawn as panels open; add the links to new ones.
      new MutationObserver(() => {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(() => addButtons(list));
      }).observe(document.body, { childList: true, subtree: true });
    }

    async function api(path, token) {
      const response = await fetch(`${directus}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      return response.ok ? (await response.json())?.data || null : null;
    }

    // Tokens for a session: from the refresh cookie Directus set in this
    // browser, or from a refresh token the app was handed.
    function refresh(refreshToken) {
      const request = refreshToken
        ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }) }
        : { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "json" }) };
      return fetch(`${directus}/auth/refresh`, request)
        .then(response => response.ok ? response.json() : null)
        .then(json => json?.data || null)
        .catch(() => null);
    }

    // The first sign-in: the name to show, and the privacy policy.
    function askToFinish(tokens, user, email, provider) {
      installStyles();
      const dialog = document.createElement("div");
      dialog.className = "social-signin-dialog";
      dialog.innerHTML = `<form>
        <h2>Finish creating your account</h2>
        <p>You signed in with ${provider.label} as <strong></strong>. Choose the name shown on your contributions.</p>
        <label for="social-signin-name">Name to show</label>
        <input type="text" id="social-signin-name" autocomplete="name" maxlength="120" required>
        <label class="agree"><input type="checkbox" required> <span>I have read and agree to the <a href="${PRIVACY_URL}" target="_blank" rel="noopener">Privacy policy</a>.</span></label>
        <p class="status" role="status"></p>
        <div class="actions"><button type="button">Not now</button><button type="submit">Create my account</button></div>
      </form>`;
      dialog.querySelector("strong").textContent = email;
      const name = dialog.querySelector("#social-signin-name");
      name.value = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
      const status = dialog.querySelector(".status");
      dialog.querySelector("button[type=button]").addEventListener("click", () => dialog.remove());
      dialog.querySelector("form").addEventListener("submit", async event => {
        event.preventDefault();
        const submit = dialog.querySelector("button[type=submit]");
        submit.disabled = true;
        status.textContent = "Creating your account...";
        try {
          const response = await fetch(ctx.registrationUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "sso_complete", access_token: tokens.access_token, display_name: name.value.trim(), agreement: true })
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok || !result?.ok) throw new Error(result?.error || "Your account could not be created yet. Please try again.");
          dialog.remove();
          await ctx.signIn(tokens, email);
        } catch (error) {
          status.textContent = error.message;
          submit.disabled = false;
        }
      });
      document.body.appendChild(dialog);
      name.focus();
    }

    // Signed in: the same sign-in as a password login, or the first-time step.
    async function finish(tokens, provider) {
      if (!tokens?.access_token) return ctx.notify(failed(provider), "error");
      const user = await api("/users/me?fields=id,email,first_name,last_name", tokens.access_token).catch(() => null);
      const email = String(user?.email || "").trim().toLowerCase();
      if (!email) return ctx.notify(failed(provider), "error");
      const profile = await Promise.resolve(ctx.profileFor(tokens.access_token, email)).catch(() => null);
      if (profile?.id) return ctx.signIn(tokens, email);
      askToFinish(tokens, user, email, provider);
    }

    // Back from the provider in this browser tab.
    async function finishReturn() {
      const url = new URL(window.location.href);
      let pending = null;
      try {
        pending = window.sessionStorage.getItem(PENDING);
        window.sessionStorage.removeItem(PENDING);
      } catch (error) {
        // No storage: only a successful return is recognised.
      }
      const provider = byName(url.searchParams.get("sso"));
      const reason = url.searchParams.get("reason");
      const failedFrom = reason ? byName(pending) : null;
      if (!provider && !failedFrom) return;
      url.searchParams.delete("sso");
      url.searchParams.delete("reason");
      window.history.replaceState(window.history.state, "", url.toString());
      if (reason || !provider) return ctx.notify(failed(provider || failedFrom, reason), "error");
      await finish(await refresh(), provider);
    }

    // In the app: the session the browser handed back (sso-app-return.html
    // -> the app -> here). Returns true so the app knows it arrived.
    if (inApp()) {
      window.NLI_SSO_APP_RETURN = result => {
        const provider = byName(result?.provider);
        if (result?.error || !result?.refresh_token) {
          ctx.notify(failed(provider, result?.error), "error");
          return true;
        }
        refresh(String(result.refresh_token)).then(tokens => finish(tokens, provider || PROVIDERS[0]));
        return true;
      };
    }

    return { isOffered, watch, finishReturn, startUrl };
  }

  window.NLI_GOOGLE_SIGNIN = { create };
}());
