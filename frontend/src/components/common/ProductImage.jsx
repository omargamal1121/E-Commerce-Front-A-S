import React, { useState, useId } from "react";
import { getImageUrl, getImageSrcSet, PLACEHOLDER_IMAGE, isImageKitUrl } from "../../utils/imageUtils";

/**
 * Reusable, high-performance ProductImage component.
 * Features:
 * - ImageKit URL transformation query generation
 * - Automatic responsive srcset (400w, 800w, 1200w) & sensible sizes
 * - Zero Layout Shift (CLS): explicit width/height or aspect-ratio
 * - Lazy / Eager loading based on `priority`
 * - Shimmer skeleton loading state
 * - Graceful fallback on error
 * - Accessible with meaningful alt text validation
 */
const ProductImage = ({
  src,
  alt,
  width,
  height,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px",
  priority = false,
  className = "",
  style = {},
  aspectRatio,
  onClick,
  onError,
  objectFit = "cover",
  quality = 80,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const skeletonId = useId();

  // Validate alt text
  const cleanAlt = typeof alt === "string" ? alt.trim() : "";
  const finalAlt = cleanAlt || "Product image";
  if (!cleanAlt && process.env.NODE_ENV !== "production") {
    console.warn(`[ProductImage] Missing meaningful "alt" text for image: "${src}"`);
  }

  // Derive initial image URL: target standard width or default 400px
  const targetWidth = typeof width === "number" && width > 0 ? width : 400;
  const targetHeight = typeof height === "number" && height > 0 ? height : undefined;

  const currentSrc = hasError
    ? PLACEHOLDER_IMAGE
    : getImageUrl(src, { width: targetWidth, height: targetHeight, quality });

  // Responsive srcset only for ImageKit URLs
  const srcSet = !hasError && isImageKitUrl(src)
    ? getImageSrcSet(src, [400, 800, 1200], quality)
    : undefined;

  const handleError = (e) => {
    setHasError(true);
    setIsLoaded(true);
    if (typeof onError === "function") {
      onError(e);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Combine inline styles for layout stability (prevent CLS)
  const combinedStyle = {
    ...style,
    ...(aspectRatio ? { aspectRatio } : {}),
    objectFit,
  };

  return (
    <div
      className={`relative overflow-hidden inline-block ${className}`}
      style={{
        ...(aspectRatio ? { aspectRatio } : {}),
        ...(width && typeof width === "number" ? { maxWidth: `${width}px` } : {}),
      }}
    >
      {/* Skeleton Shimmer Placeholder while loading */}
      {!isLoaded && !hasError && (
        <div
          aria-hidden="true"
          id={skeletonId}
          className="absolute inset-0 bg-neutral-200/70 animate-pulse z-0 rounded-[inherit]"
        />
      )}

      <img
        src={currentSrc}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={finalAlt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        className={`w-full h-full transition-opacity duration-300 ease-in-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={combinedStyle}
        {...rest}
      />
    </div>
  );
};

export default React.memo(ProductImage);
