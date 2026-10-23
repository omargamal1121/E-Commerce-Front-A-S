import React, { useState, useId } from "react";
import { getImageUrl, getImageSrcSet, PLACEHOLDER_IMAGE, isImageKitUrl } from "../../utils/imageUtils";

/**
 * Reusable, high-performance ProductImage component for Admin portal.
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

  const cleanAlt = typeof alt === "string" ? alt.trim() : "";
  const finalAlt = cleanAlt || "Admin asset image";

  const targetWidth = typeof width === "number" && width > 0 ? width : 400;
  const targetHeight = typeof height === "number" && height > 0 ? height : undefined;

  const currentSrc = hasError
    ? PLACEHOLDER_IMAGE
    : getImageUrl(src, { width: targetWidth, height: targetHeight, quality });

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
