(function () {
  const DEFAULT_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
  const BLOCKED_REMOTE_IMAGE_HOSTS = new Set([
    "cdn.newsday.com",
    "www.easthamptonstar.com"
  ]);

  function absoluteMediaUrl(url, baseHref) {
    const raw = String(url || "").replace(/&amp;/g, "&");
    try {
      return new URL(raw, baseHref || window.location.href).href;
    } catch {
      return raw;
    }
  }

  function rewriteMediaUrl(url, options = {}) {
    const raw = String(url || "").replace(/&amp;/g, "&");
    const mediaMap = options.mediaMap || {};
    const rewritten = mediaMap[raw] || mediaMap[raw.split("?")[0]] || raw;
    return absoluteMediaUrl(rewritten, options.baseHref);
  }

  function isBlockedRemoteImageUrl(value, baseHref) {
    const raw = String(value || "").trim();
    if (!raw || raw.startsWith("/") || raw.startsWith("#")) return false;
    try {
      const url = new URL(raw, baseHref || window.location.href);
      return BLOCKED_REMOTE_IMAGE_HOSTS.has(url.hostname.toLowerCase());
    } catch {
      return false;
    }
  }

  function cleanImageUrl(value) {
    const raw = String(value || "").trim();
    if (!raw || raw === "null" || raw === "undefined" || raw === "#") return "";
    if (/^(?:about:blank|data:image\/gif)/i.test(raw)) return "";
    if (isBlockedRemoteImageUrl(raw)) return "";
    if (!/\.(?:jpe?g|png|gif|webp|svg)(?:[?#].*)?$/i.test(raw) && !/\/assets\/[a-f0-9-]{20,}/i.test(raw)) return "";
    return raw;
  }

  function listingImage(site, deps = {}) {
    const file = deps.directusAssetUrl?.(site?.listing_image_file) || "";
    if (file) return file;
    const raw = cleanImageUrl(site?.listing_image_thumb_url)
      || cleanImageUrl(site?.listing_image_url)
      || cleanImageUrl(site?.content_image_url);
    return raw ? deps.rewriteMediaUrl?.(raw) || raw : "";
  }

  function siteHasHeaderImage(site, deps = {}) {
    return Boolean(
      deps.directusAssetUrl?.(site?.listing_image_file) ||
      cleanImageUrl(site?.listing_image_url) ||
      cleanImageUrl(site?.listing_image_thumb_url)
    );
  }

  const KNOWN_LISTING_IMAGE_CREDITS = Object.freeze({
    "preservation-long-island": "Painting by Shinnecock artist David Bunn Martine, on view at Preservation Long Island as part of Indigenous History & Art at Good Little Water Place (2020)."
  });

  function cleanImageCredit(value) {
    const text = String(value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#(?:39|x27);/gi, "'")
      .replace(/\s+/g, " ")
      .trim();
    if (!text || text.length > 320) return "";
    return /\b(?:painting|artwork|illustration|photograph|photo|image)\s+(?:by|courtesy of|from)\b|\bcourtesy of\b/i.test(text)
      ? text
      : "";
  }

  function isProjectAdminImageCreditName(value) {
    const key = String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
    return ["jeremy dennis", "jeremynative", "on this site", "native long island", "on this site - native long island"].includes(key);
  }

  function listingImageCredit(site) {
    const explicit = cleanImageCredit(site?.listing_image_credit || site?.listing_image_caption);
    if (explicit) return explicit;
    const slug = String(site?.slug || "").trim().toLowerCase();
    const imageUrl = String(site?.listing_image_url || "");
    if (KNOWN_LISTING_IMAGE_CREDITS[slug]) return KNOWN_LISTING_IMAGE_CREDITS[slug];
    if (/E2013\.62_David_Martine-3(?:[-.])/i.test(imageUrl)) {
      return KNOWN_LISTING_IMAGE_CREDITS["preservation-long-island"];
    }
    return cleanImageCredit(site?.listing_image_alt);
  }

  function listingHeroImage(site, deps = {}) {
    const file = deps.directusAssetUrl?.(site?.listing_image_file) || "";
    if (file) return file;
    const raw = cleanImageUrl(site?.listing_image_url)
      || cleanImageUrl(site?.listing_image_thumb_url)
      || cleanImageUrl(site?.content_image_url);
    return raw ? deps.rewriteMediaUrl?.(raw) || raw : "";
  }

  function listingImageFallback(site, deps = {}) {
    if (deps.directusAssetUrl?.(site?.listing_image_file)) return "";
    const raw = cleanImageUrl(site?.listing_image_url)
      || cleanImageUrl(site?.listing_image_thumb_url)
      || cleanImageUrl(site?.content_image_url);
    return raw ? deps.absoluteMediaUrl?.(raw) || absoluteMediaUrl(raw, deps.baseHref) : "";
  }

  function listingRewrittenImageFallback(site, deps = {}) {
    if (deps.directusAssetUrl?.(site?.listing_image_file)) return "";
    const raw = cleanImageUrl(site?.listing_image_url)
      || cleanImageUrl(site?.listing_image_thumb_url)
      || cleanImageUrl(site?.content_image_url);
    const rewritten = raw ? deps.rewriteMediaUrl?.(raw) || rewriteMediaUrl(raw, deps) : "";
    return raw && rewritten !== raw ? raw : "";
  }

  function listingThumbFallback(site, deps = {}) {
    if (deps.directusAssetUrl?.(site?.listing_image_file)) return "";
    const raw = cleanImageUrl(site?.listing_image_thumb_url) || cleanImageUrl(site?.listing_image_url);
    return raw ? deps.absoluteMediaUrl?.(raw) || absoluteMediaUrl(raw, deps.baseHref) : "";
  }

  function htmlAttributeJsString(value = "") {
    return JSON.stringify(String(value || ""))
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function imageErrorAction(fallback = "", options = {}) {
    const removeAction = options.removeAction || "this.remove();";
    const fallbackAction = options.fallbackAction || `this.onerror=null;this.src=${htmlAttributeJsString(fallback)};`;
    return fallback ? fallbackAction : removeAction;
  }

  function dataFallbackImageErrorAction(options = {}) {
    const dataKey = options.dataKey || "fallbackSrc";
    const removeAction = options.removeAction || "this.remove();";
    return `const fallback=this.dataset.${dataKey};if(fallback&&this.src!==fallback){this.dataset.${dataKey}='';this.onerror=null;this.src=fallback;}else{${removeAction}}`;
  }

  function siteMapIconUrl(site, deps = {}) {
    const overrides = {
      "whales-fin": "3caadb30-8343-405d-9ab6-7a6f84d6f3d7"
    };
    if (overrides[site?.slug]) return deps.directusAssetUrl?.(overrides[site.slug]) || "";
    return deps.directusAssetUrl?.(site?.map_icon) || "";
  }

  function optimizedMapIconUrl(url, options = {}) {
    const value = String(url || "").trim();
    // Marker originals are already map-sized. Directus image transformations,
    // especially WebP conversion, can add dark edge pixels to transparent art
    // when Mapbox or Leaflet resamples it into a marker texture atlas.
    return value;
  }

  function eventMapIconUrl(event, deps = {}) {
    return deps.directusAssetUrl?.(event?.map_icon) || "";
  }

  function safeImageBasename(name, fallback = "upload-image") {
    const base = String(name || fallback)
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 42);
    return base || fallback;
  }

  function fileExtensionForType(type) {
    if (/jpe?g/i.test(type || "")) return "jpg";
    if (/webp/i.test(type || "")) return "webp";
    return "png";
  }

  async function canvasToImageFile(canvas, options = {}) {
    const type = options.type || "image/png";
    const quality = Number(options.quality || 0.9);
    const basename = options.basename || "screenshot";
    const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality));
    if (!blob) throw new Error(options.errorMessage || "Could not prepare image.");
    return new File([blob], `${basename}.${fileExtensionForType(type)}`, { type });
  }

  async function imageElementFromFile(file) {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.decoding = "async";
      const loaded = new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
      });
      image.src = url;
      return await loaded;
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
  }

  async function compressImageFile(file, options = {}) {
    if (!file) return null;
    if (file.type && !/^image\//i.test(file.type || "")) {
      throw new Error(options.typeErrorMessage || "Use an image file.");
    }
    const basename = options.basename || "upload-image";
    const maxBytes = Number(options.maxBytes || 3 * 1024 * 1024);
    const maxEdge = Number(options.maxEdge || 1280);
    const qualities = Array.isArray(options.qualities) && options.qualities.length
      ? options.qualities
      : [0.78, 0.68, 0.58, 0.48];
    const finalQuality = Number(options.finalQuality || 0.42);
    const compressedName = `${safeImageBasename(file.name, basename)}-${Date.now()}.jpg`;
    const image = await imageElementFromFile(file);
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(image, 0, 0, width, height);
    const toBlob = quality => new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
    for (const quality of qualities) {
      const blob = await toBlob(quality);
      if (blob && blob.size <= maxBytes) {
        return new File([blob], compressedName, { type: "image/jpeg", lastModified: Date.now() });
      }
    }
    const blob = await toBlob(finalQuality);
    if (!blob) throw new Error(options.processErrorMessage || "Could not process that image.");
    if (blob.size > maxBytes) {
      throw new Error(options.tooLargeMessage || "That image is still too large after compression. Try a closer crop.");
    }
    return new File([blob], compressedName, { type: "image/jpeg", lastModified: Date.now() });
  }

  async function compressNamedImageFile(file, basename = "upload-image", options = {}) {
    return compressImageFile(file, {
      ...options,
      basename,
      processErrorMessage: options.processErrorMessage || "Could not process that image."
    });
  }

  function isJpegFile(file) {
    return /jpe?g$/i.test(file?.type || "") || /\.jpe?g$/i.test(file?.name || "");
  }

  function isImageFileLike(file, options = {}) {
    if (!file) return false;
    const type = String(file.type || "");
    if (/^image\//i.test(type)) return true;
    const extensions = options.extensions || "jpe?g|png|webp|gif|heic|heif";
    return new RegExp(`\\.(${extensions})$`, "i").test(String(file.name || ""));
  }

  function validateJpegUploadImage(file, options = {}) {
    if (!file) return "";
    const maxBytes = Number(options.maxBytes || DEFAULT_UPLOAD_MAX_BYTES);
    if (!isJpegFile(file)) return options.typeMessage || "Use a JPG or JPEG image.";
    if (file.size > maxBytes) return options.sizeMessage || "Image must be 5 MB or smaller.";
    return "";
  }

  function formatImageSize(bytes) {
    const size = Number(bytes || 0);
    if (!size) return "0 KB";
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  function setFilePreview(scope, image, file, options = {}) {
    if (!image) return "";
    const key = options.key || "_imagePreviewUrl";
    if (scope?.[key]) {
      URL.revokeObjectURL(scope[key]);
      scope[key] = "";
    }
    if (!file) {
      image.hidden = true;
      image.removeAttribute("src");
      return "";
    }
    const url = URL.createObjectURL(file);
    if (scope) scope[key] = url;
    image.src = url;
    image.hidden = false;
    return url;
  }

  async function prepareJpegUploadImage(file, options = {}) {
    if (!file) return null;
    const maxBytes = Number(options.maxBytes || DEFAULT_UPLOAD_MAX_BYTES);
    const basename = options.basename || "upload-image";
    const shouldCompress = file.size > maxBytes || !isJpegFile(file);
    const prepared = shouldCompress
      ? await compressNamedImageFile(file, basename, {
        ...options,
        maxBytes,
        processErrorMessage: options.processErrorMessage || "Could not process that image."
      })
      : file;
    const imageError = validateJpegUploadImage(prepared, options);
    if (imageError) throw new Error(imageError);
    return prepared;
  }

  window.NLI_MEDIA_UTILS = {
    absoluteMediaUrl,
    rewriteMediaUrl,
    isBlockedRemoteImageUrl,
    cleanImageUrl,
    listingImage,
    siteHasHeaderImage,
    cleanImageCredit,
    isProjectAdminImageCreditName,
    listingImageCredit,
    listingHoverImage: listingImage,
    listingHeroImage,
    listingImageFallback,
    listingRewrittenImageFallback,
    listingThumbFallback,
    htmlAttributeJsString,
    imageErrorAction,
    dataFallbackImageErrorAction,
    siteMapIconUrl,
    optimizedMapIconUrl,
    eventMapIconUrl,
    safeImageBasename,
    fileExtensionForType,
    canvasToImageFile,
    imageElementFromFile,
    compressImageFile,
    compressNamedImageFile,
    isJpegFile,
    isImageFileLike,
    validateJpegUploadImage,
    formatImageSize,
    setFilePreview,
    prepareJpegUploadImage
  };
}());
