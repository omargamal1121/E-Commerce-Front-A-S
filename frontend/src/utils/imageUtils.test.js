import { getImageUrl, isImageKitUrl, getImageSrcSet, PLACEHOLDER_IMAGE } from "./imageUtils.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`✓ PASS: ${message}`);
}

console.log("=== Running Image Utility Tests ===");

// 1. ImageKit URL with width
const ikUrl1 = "https://ik.imagekit.io/8rna4gbjz/CategoryPhotos/file.webp";
const res1 = getImageUrl(ikUrl1, { width: 400 });
assert(
  res1.includes("tr=w-400%2Cq-80%2Cf-webp") || res1.includes("tr=w-400,q-80,f-webp"),
  "ImageKit URL appends width, quality, and webp format"
);

// 2. ImageKit URL with width and height
const res2 = getImageUrl(ikUrl1, { width: 400, height: 400 });
assert(
  (res2.includes("w-400") && res2.includes("h-400") && res2.includes("c-maintain_ratio")),
  "ImageKit URL with height includes c-maintain_ratio and h-{height}"
);

// 3. ImageKit URL with custom quality
const res3 = getImageUrl(ikUrl1, { width: 800, quality: 65 });
assert(
  res3.includes("q-65"),
  "Custom quality applied correctly"
);

// 4. Non-ImageKit URL unchanged
const cloudinaryUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
const res4 = getImageUrl(cloudinaryUrl, { width: 400 });
assert(
  res4 === cloudinaryUrl,
  "Non-ImageKit Cloudinary URL is returned completely unchanged"
);

const localUrl = "/assets/logo.png";
const resLocal = getImageUrl(localUrl, { width: 400 });
assert(
  resLocal === localUrl,
  "Local asset URL is returned unchanged"
);

// 5. Null, undefined, and empty string handling
assert(
  getImageUrl(null) === PLACEHOLDER_IMAGE,
  "Null URL returns local placeholder image"
);
assert(
  getImageUrl(undefined) === PLACEHOLDER_IMAGE,
  "Undefined URL returns local placeholder image"
);
assert(
  getImageUrl("") === PLACEHOLDER_IMAGE,
  "Empty string returns local placeholder image"
);
assert(
  getImageUrl("   ") === PLACEHOLDER_IMAGE,
  "Whitespace string returns local placeholder image"
);

// 6. Existing query string handling
const ikUrlWithQuery = "https://ik.imagekit.io/8rna4gbjz/CategoryPhotos/file.webp?v=123&theme=dark";
const res6 = getImageUrl(ikUrlWithQuery, { width: 400 });
assert(
  res6.includes("v=123") && res6.includes("theme=dark") && res6.includes("tr="),
  "Preserves existing query parameters when adding tr transformation"
);

// 7. Width cap at 2000px maximum
const res7 = getImageUrl(ikUrl1, { width: 3500 });
assert(
  res7.includes("w-2000") && !res7.includes("w-3500"),
  "Widths larger than 2000 are clamped to 2000"
);

// 8. SrcSet generation
const srcset = getImageSrcSet(ikUrl1, [400, 800, 1200]);
assert(
  srcset && srcset.includes("400w") && srcset.includes("800w") && srcset.includes("1200w"),
  "getImageSrcSet generates valid responsive srcset for 400w, 800w, 1200w"
);

const nonIkSrcset = getImageSrcSet(cloudinaryUrl);
assert(
  nonIkSrcset === undefined,
  "getImageSrcSet returns undefined for non-ImageKit URLs"
);

console.log("\nAll 8 test suites PASSED successfully!\n");
