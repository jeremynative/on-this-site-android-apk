(function () {
  const workerUrl = "https://on-this-site-support.onthissiteny.workers.dev";
  const publishableKey = "";
  const endpoint = workerUrl.replace(/\/+$/, "");
  window.NLI_SUPPORT_CONFIG = {
    ...(window.NLI_SUPPORT_CONFIG || {}),
    checkoutEndpoint: endpoint ? `${endpoint}/support/create-checkout-session` : "",
    publishableKey,
    stripeJsUrl: "https://js.stripe.com/v3/",
    publicThankYousUrl: endpoint ? `${endpoint}/support/public-thank-yous` : "support/public-thank-yous.json",
    adminActivityUrl: endpoint ? `${endpoint}/support/admin/recent-activity.json` : ""
  };
})();
