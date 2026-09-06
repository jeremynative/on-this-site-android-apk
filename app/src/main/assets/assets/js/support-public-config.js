(function () {
  // Keep support configuration cache-safe when the Stripe public contract changes.
  const workerUrl = "https://on-this-site-support.onthissiteny.workers.dev";
  const publishableKey = "pk_live_51TZGQxAkpq699T4Icb8edN1IFX44qqq3aeLuKrqgLH6Ga0XlrLJIqM76Edp8w5jvCCldfXPEfGHmpSf4VcnQ8eSs00lsCYoXSn";
  const endpoint = workerUrl.replace(/\/+$/, "");
  window.NLI_SUPPORT_CONFIG = {
    ...(window.NLI_SUPPORT_CONFIG || {}),
    checkoutEndpoint: endpoint ? `${endpoint}/support/create-checkout-session` : "",
    playVerificationEndpoint: endpoint ? `${endpoint}/support/google-play/verify` : "",
    publishableKey,
    stripeJsUrl: "https://js.stripe.com/v3/",
    publicThankYousUrl: endpoint ? `${endpoint}/support/public-thank-yous` : "support/public-thank-yous.json",
    monthlyGoalUrl: endpoint ? `${endpoint}/support/monthly-goal` : "",
    adminActivityUrl: endpoint ? `${endpoint}/support/admin/recent-activity.json` : ""
  };
})();
