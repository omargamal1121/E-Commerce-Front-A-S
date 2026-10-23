/**
 * Image upload & client-side compression utilities
 * R&S Fashion Store
 */

import imageCompression from "browser-image-compression";

export const MAX_CATALOG_IMAGE_SIZE_BYTES = 40 * 1024 * 1024; // 40MB for products, categories, collections
export const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;   // 5MB for profile photos
export const MAX_IMAGE_SIZE_BYTES = MAX_CATALOG_IMAGE_SIZE_BYTES; // default 40MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Validates an image file before upload.
 *
 * @param {File} file
 * @param {{ isProfile?: boolean, maxSizeBytes?: number }} [options]
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateImageFile(file, options = {}) {
  if (!file) {
    return { valid: false, error: "Please select a valid image file." };
  }

  const fileType = (file.type || "").toLowerCase();
  const fileName = (file.name || "").toLowerCase();

  const isAllowedType =
    ALLOWED_IMAGE_TYPES.includes(fileType) ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".webp");

  if (!isAllowedType) {
    return {
      valid: false,
      error: "Invalid format. Only JPEG, PNG, and WebP images are allowed.",
    };
  }

  const maxBytes =
    options.maxSizeBytes ||
    (options.isProfile ? MAX_PROFILE_IMAGE_SIZE_BYTES : MAX_CATALOG_IMAGE_SIZE_BYTES);
  const maxMb = Math.round(maxBytes / (1024 * 1024));

  if (file.size > maxBytes) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const targetLabel = options.isProfile ? "profile photos" : "this upload";
    return {
      valid: false,
      error: `File size is ${sizeInMb}MB. Maximum allowed size for ${targetLabel} is ${maxMb}MB.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Compresses an image file in the browser before sending to the server.
 * Uses Web Workers for fluid UI performance.
 * Falls back to the original file if compression fails.
 *
 * @param {File} file
 * @param {Object} customOptions
 * @returns {Promise<File>}
 */
export async function compressImage(file, customOptions = {}) {
  if (!file) return file;

  // Skip compressing SVGs or non-standard blobs
  if (file.type === "image/svg+xml") return file;

  const defaultOptions = {
    maxWidthOrHeight: 2000,
    initialQuality: 0.85,
    fileType: "image/webp",
    useWebWorker: true,
    maxIteration: 10,
  };

  const options = { ...defaultOptions, ...customOptions };

  const originalKb = (file.size / 1024).toFixed(1);
  console.log(`[ImageCompression] ⏳ "${file.name}" — before: ${originalKb} KB`);

  try {
    const compressedBlob = await imageCompression(file, options);

    // Keep name and set webp extension
    const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "image";
    const extension = options.fileType === "image/webp" ? "webp" : "jpg";
    const finalName = `${baseName}.${extension}`;

    const compressedFile = new File([compressedBlob], finalName, {
      type: options.fileType || compressedBlob.type,
      lastModified: Date.now(),
    });

    const compressedKb = (compressedFile.size / 1024).toFixed(1);
    const saving = (((file.size - compressedFile.size) / file.size) * 100).toFixed(1);
    console.log(`[ImageCompression] ✅ "${finalName}" — after: ${compressedKb} KB (saved ${saving}%)`);

    return compressedFile;
  } catch (err) {
    console.warn(
      `[ImageCompression] Compression failed for "${file.name}". Falling back to original file.`,
      err
    );
    // Graceful fallback: backend will still handle validation & compression
    return file;
  }
}

/**
 * Compresses multiple images with limited concurrency (default 3)
 * so the browser main thread remains responsive.
 *
 * @param {File[]} files
 * @param {(completed: number, total: number) => void} [onProgress]
 * @param {number} [maxConcurrency=3]
 * @returns {Promise<File[]>}
 */
export async function compressImagesBatch(files, onProgress, maxConcurrency = 3) {
  if (!Array.isArray(files) || files.length === 0) return [];

  const results = new Array(files.length);
  let completed = 0;
  let currentIndex = 0;

  const worker = async () => {
    while (currentIndex < files.length) {
      const idx = currentIndex++;
      const file = files[idx];
      results[idx] = await compressImage(file);
      completed++;
      if (typeof onProgress === "function") {
        onProgress(completed, files.length);
      }
    }
  };

  const poolSize = Math.min(maxConcurrency, files.length);
  const workers = Array.from({ length: poolSize }, () => worker());
  await Promise.all(workers);

  return results;
}

/**
 * Creates an object URL for a preview and returns a revocation cleanup function.
 * Avoids memory leaks in single-page applications.
 *
 * @param {Blob|File} file
 * @returns {{ url: string, revoke: () => void }}
 */
export function createImagePreview(file) {
  if (!file) return { url: "", revoke: () => {} };

  const url = URL.createObjectURL(file);
  return {
    url,
    revoke: () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Safe ignore
      }
    },
  };
}
