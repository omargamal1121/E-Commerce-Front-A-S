/**
 * ImageKit transformation & image optimization helpers
 * R&S Admin Portal
 */

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Cpath fill='%239ca3af' d='M160 180a24 24 0 100-48 24 24 0 000 48zm-60 140h200l-62.5-80-45 55-32.5-40-60 65z'/%3E%3Ctext x='50%25' y='72%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='14' font-weight='600'%3ER%26S%3C/text%3E%3C/svg%3E";

const MAX_IMAGEKIT_WIDTH = 2000;
const MAX_IMAGEKIT_HEIGHT = 2000;

/**
 * Checks whether a given URL is an ImageKit URL.
 * Preserves non-ImageKit URLs (Cloudinary, local, external, blob, etc.).
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isImageKitUrl(url) {
  if (!url || typeof url !== "string") return false;
  return url.includes("ik.imagekit.io");
}

/**
 * Builds an ImageKit optimized URL with requested width, height, and quality.
 *
 * Query format:
 * - with width: ?tr=w-{width},q-{quality},f-webp
 * - with width & height: ?tr=w-{width},h-{height},c-maintain_ratio,q-{quality},f-webp
 *
 * @param {string|null|undefined} url
 * @param {{ width?: number, height?: number, quality?: number }} options
 * @returns {string}
 */
export function getImageUrl(url, { width, height, quality = 80 } = {}) {
  // 1. Handle null / undefined / empty string
  if (!url || (typeof url === "string" && !url.trim())) {
    return PLACEHOLDER_IMAGE;
  }

  const trimmedUrl = String(url).trim();

  // 2. Return unchanged if not an ImageKit URL (never break old images or blobs)
  if (!isImageKitUrl(trimmedUrl)) {
    return trimmedUrl;
  }

  // 3. Assemble transformation parameters
  const trParts = [];

  if (typeof width === "number" && width > 0) {
    const safeWidth = Math.min(Math.round(width), MAX_IMAGEKIT_WIDTH);
    trParts.push(`w-${safeWidth}`);
  }

  if (typeof height === "number" && height > 0) {
    const safeHeight = Math.min(Math.round(height), MAX_IMAGEKIT_HEIGHT);
    trParts.push(`h-${safeHeight}`);
    trParts.push("c-maintain_ratio");
  }

  const safeQuality = Math.min(Math.max(Math.round(quality || 80), 1), 100);
  trParts.push(`q-${safeQuality}`);
  trParts.push("f-webp");

  const trValue = trParts.join(",");

  // 4. Safely handle query strings (existing params, no params, or relative/absolute)
  try {
    const urlObj = new URL(trimmedUrl, "https://ik.imagekit.io");
    urlObj.searchParams.set("tr", trValue);

    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      return urlObj.pathname + urlObj.search + urlObj.hash;
    }

    return urlObj.toString();
  } catch {
    const separator = trimmedUrl.includes("?") ? "&" : "?";
    return `${trimmedUrl}${separator}tr=${trValue}`;
  }
}

/**
 * Builds responsive srcset string for ImageKit URLs.
 *
 * @param {string} url
 * @param {number[]} widths
 * @param {number} quality
 * @returns {string|undefined}
 */
export function getImageSrcSet(url, widths = [400, 800, 1200], quality = 80) {
  if (!isImageKitUrl(url)) return undefined;

  const validWidths = widths
    .filter((w) => typeof w === "number" && w > 0 && w <= MAX_IMAGEKIT_WIDTH)
    .sort((a, b) => a - b);

  if (validWidths.length === 0) return undefined;

  return validWidths
    .map((w) => `${getImageUrl(url, { width: w, quality })} ${w}w`)
    .join(", ");
}
