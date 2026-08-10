package com.nativelongisland.onthissite;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

final class BillingManager implements PurchasesUpdatedListener {
    static final String TYPE_ONE_TIME = BillingClient.ProductType.INAPP;
    static final String TYPE_SUBSCRIPTION = BillingClient.ProductType.SUBS;

    private static final Set<String> ONE_TIME_PRODUCTS = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
        "support_10", "support_25", "support_50", "support_100"
    )));
    private static final Set<String> SUBSCRIPTION_PRODUCTS = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
        "support_monthly_10", "support_monthly_25", "support_monthly_50", "support_monthly_100"
    )));

    private final MainActivity activity;
    private final BillingClient billingClient;
    private final Map<String, ProductDetails> productDetailsById = new HashMap<>();
    private boolean connecting;

    BillingManager(MainActivity activity) {
        this.activity = activity;
        billingClient = BillingClient.newBuilder(activity)
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build();
    }

    void start() {
        if (billingClient.isReady() || connecting) return;
        connecting = true;
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                connecting = false;
                JSONObject event = baseEvent("status", result);
                put(event, "ready", result.getResponseCode() == BillingClient.BillingResponseCode.OK);
                activity.dispatchPlayBillingEvent(event);
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) restorePurchases();
            }

            @Override
            public void onBillingServiceDisconnected() {
                connecting = false;
                JSONObject event = new JSONObject();
                put(event, "event", "status");
                put(event, "ready", false);
                put(event, "message", "Google Play billing disconnected. It will reconnect automatically.");
                activity.dispatchPlayBillingEvent(event);
            }
        });
    }

    boolean isReady() {
        return billingClient.isReady();
    }

    void queryProducts(String productType, String productIdsJson) {
        String type = safeProductType(productType);
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        try {
            JSONArray requested = new JSONArray(productIdsJson == null ? "[]" : productIdsJson);
            for (int index = 0; index < requested.length(); index++) {
                String productId = requested.optString(index, "");
                if (!isAllowedProduct(type, productId)) continue;
                products.add(QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(productId)
                    .setProductType(type)
                    .build());
            }
        } catch (Exception error) {
            dispatchError("products", "Invalid Google Play product request.");
            return;
        }
        if (products.isEmpty()) {
            dispatchError("products", "No supported Google Play products were requested.");
            return;
        }
        if (!billingClient.isReady()) {
            start();
            dispatchError("products", "Google Play billing is still connecting. Try again in a moment.");
            return;
        }
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(products)
            .build();
        billingClient.queryProductDetailsAsync(params, (result, queryResult) -> {
            JSONArray available = new JSONArray();
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && queryResult != null) {
                for (ProductDetails details : queryResult.getProductDetailsList()) {
                    productDetailsById.put(details.getProductId(), details);
                    available.put(productDetailsJson(details));
                }
            }
            JSONObject event = baseEvent("products", result);
            put(event, "productType", type);
            put(event, "products", available);
            activity.dispatchPlayBillingEvent(event);
        });
    }

    void launchPurchase(String productId, String productType, String obfuscatedAccountId) {
        String type = safeProductType(productType);
        if (!isAllowedProduct(type, productId)) {
            dispatchError("purchase", "This Google Play product is not supported by the app.");
            return;
        }
        if (!billingClient.isReady()) {
            start();
            dispatchError("purchase", "Google Play billing is still connecting. Try again in a moment.");
            return;
        }
        ProductDetails details = productDetailsById.get(productId);
        if (details == null) {
            dispatchError("purchase", "Google Play is still loading this product. Try again in a moment.");
            return;
        }
        BillingFlowParams.ProductDetailsParams.Builder productParams =
            BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details);
        if (TYPE_SUBSCRIPTION.equals(type)) {
            List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
            if (offers == null || offers.isEmpty()) {
                dispatchError("purchase", "No Google Play subscription offer is available.");
                return;
            }
            productParams.setOfferToken(offers.get(0).getOfferToken());
        } else {
            List<ProductDetails.OneTimePurchaseOfferDetails> offers = details.getOneTimePurchaseOfferDetailsList();
            if (offers != null && !offers.isEmpty() && offers.get(0).getOfferToken() != null) {
                productParams.setOfferToken(offers.get(0).getOfferToken());
            }
        }
        BillingFlowParams.Builder flow = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(Collections.singletonList(productParams.build()));
        String accountId = obfuscatedAccountId == null ? "" : obfuscatedAccountId.trim();
        if (accountId.matches("[A-Za-z0-9_-]{8,64}")) flow.setObfuscatedAccountId(accountId);
        BillingResult result = billingClient.launchBillingFlow(activity, flow.build());
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            activity.dispatchPlayBillingEvent(baseEvent("purchase", result));
        }
    }

    void restorePurchases() {
        if (!billingClient.isReady()) {
            start();
            return;
        }
        queryPurchases(TYPE_ONE_TIME);
        queryPurchases(TYPE_SUBSCRIPTION);
    }

    private void queryPurchases(String type) {
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder().setProductType(type).build();
        billingClient.queryPurchasesAsync(params, (result, purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                activity.dispatchPlayBillingEvent(baseEvent("restore", result));
                return;
            }
            for (Purchase purchase : purchases) deliverPurchase(purchase, type, true);
            JSONObject complete = baseEvent("restore-complete", result);
            put(complete, "productType", type);
            activity.dispatchPlayBillingEvent(complete);
        });
    }

    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                String type = TYPE_ONE_TIME;
                for (String productId : purchase.getProducts()) {
                    if (SUBSCRIPTION_PRODUCTS.contains(productId)) {
                        type = TYPE_SUBSCRIPTION;
                        break;
                    }
                }
                deliverPurchase(purchase, type, false);
            }
            return;
        }
        activity.dispatchPlayBillingEvent(baseEvent("purchase", result));
    }

    void completeVerifiedPurchase(String purchaseToken, String productType, boolean consume) {
        if (purchaseToken == null || purchaseToken.trim().isEmpty()) {
            dispatchError("complete", "Google Play purchase token is missing.");
            return;
        }
        if (consume && TYPE_ONE_TIME.equals(safeProductType(productType))) {
            ConsumeParams params = ConsumeParams.newBuilder().setPurchaseToken(purchaseToken).build();
            billingClient.consumeAsync(params, (result, token) -> {
                JSONObject event = baseEvent("complete", result);
                put(event, "purchaseToken", token);
                put(event, "consumed", result.getResponseCode() == BillingClient.BillingResponseCode.OK);
                activity.dispatchPlayBillingEvent(event);
            });
            return;
        }
        AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchaseToken)
            .build();
        billingClient.acknowledgePurchase(params, result -> {
            JSONObject event = baseEvent("complete", result);
            put(event, "purchaseToken", purchaseToken);
            put(event, "acknowledged", result.getResponseCode() == BillingClient.BillingResponseCode.OK);
            activity.dispatchPlayBillingEvent(event);
        });
    }

    void close() {
        if (billingClient.isReady()) billingClient.endConnection();
    }

    private void deliverPurchase(Purchase purchase, String type, boolean restored) {
        JSONObject event = new JSONObject();
        put(event, "event", "purchase-update");
        put(event, "productType", type);
        put(event, "products", new JSONArray(purchase.getProducts()));
        put(event, "purchaseToken", purchase.getPurchaseToken());
        put(event, "orderId", purchase.getOrderId() == null ? "" : purchase.getOrderId());
        put(event, "purchaseTime", purchase.getPurchaseTime());
        put(event, "purchaseState", purchase.getPurchaseState());
        put(event, "acknowledged", purchase.isAcknowledged());
        put(event, "autoRenewing", purchase.isAutoRenewing());
        put(event, "restored", restored);
        put(event, "packageName", activity.getPackageName());
        activity.dispatchPlayBillingEvent(event);
    }

    private JSONObject productDetailsJson(ProductDetails details) {
        JSONObject product = new JSONObject();
        put(product, "productId", details.getProductId());
        put(product, "productType", details.getProductType());
        put(product, "title", details.getTitle());
        put(product, "description", details.getDescription());
        if (TYPE_ONE_TIME.equals(details.getProductType())) {
            List<ProductDetails.OneTimePurchaseOfferDetails> offers = details.getOneTimePurchaseOfferDetailsList();
            if (offers != null && !offers.isEmpty()) {
                ProductDetails.OneTimePurchaseOfferDetails offer = offers.get(0);
                put(product, "formattedPrice", offer.getFormattedPrice());
                put(product, "priceAmountMicros", offer.getPriceAmountMicros());
                put(product, "priceCurrencyCode", offer.getPriceCurrencyCode());
            }
        } else {
            List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
            if (offers != null && !offers.isEmpty()) {
                List<ProductDetails.PricingPhase> phases = offers.get(0).getPricingPhases().getPricingPhaseList();
                if (!phases.isEmpty()) {
                    ProductDetails.PricingPhase phase = phases.get(0);
                    put(product, "formattedPrice", phase.getFormattedPrice());
                    put(product, "priceAmountMicros", phase.getPriceAmountMicros());
                    put(product, "priceCurrencyCode", phase.getPriceCurrencyCode());
                    put(product, "billingPeriod", phase.getBillingPeriod());
                }
            }
        }
        return product;
    }

    private String safeProductType(String value) {
        return TYPE_SUBSCRIPTION.equals(value) ? TYPE_SUBSCRIPTION : TYPE_ONE_TIME;
    }

    private boolean isAllowedProduct(String type, String productId) {
        return TYPE_SUBSCRIPTION.equals(type)
            ? SUBSCRIPTION_PRODUCTS.contains(productId)
            : ONE_TIME_PRODUCTS.contains(productId);
    }

    private JSONObject baseEvent(String eventName, BillingResult result) {
        JSONObject event = new JSONObject();
        put(event, "event", eventName);
        put(event, "responseCode", result == null ? BillingClient.BillingResponseCode.ERROR : result.getResponseCode());
        put(event, "message", result == null ? "Google Play billing failed." : result.getDebugMessage());
        return event;
    }

    private void dispatchError(String eventName, String message) {
        JSONObject event = new JSONObject();
        put(event, "event", eventName);
        put(event, "responseCode", BillingClient.BillingResponseCode.ERROR);
        put(event, "message", message);
        activity.dispatchPlayBillingEvent(event);
    }

    private static void put(JSONObject object, String key, Object value) {
        try {
            object.put(key, value);
        } catch (Exception ignored) {
            // Values supplied by the billing client are JSON-compatible.
        }
    }
}
