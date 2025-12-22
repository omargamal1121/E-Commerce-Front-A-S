import React, { useContext, useState, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useTranslation } from 'react-i18next';

const WishlistButton = ({
  productId,
  className = "",
  showText = false,
  size = "default",
  variant = "default",
  isInWishlist: isInWishlistProp = null
}) => {
  const { t } = useTranslation();
  const {
    addToWishlist,
    removeFromWishlist,
    wishlistItems,
    wishlistLoading,
    user
  } = useContext(ShopContext);

  // Check if product is in wishlist using context data
  const [isLoading, setIsLoading] = useState(false);
  const isInWishlistState = wishlistItems.some(item => item.id === productId || item.productId === productId);

  // No effect needed - derived state from context
  React.useEffect(() => {
    // Optional: Trigger a refresh of wishlist items if empty and user is logged in
    // But generally, ShopContext should handle initial load.
  }, []);

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    if (isLoading || wishlistLoading) return;

    console.log('Toggling wishlist for product:', productId);
    setIsLoading(true);

    try {
      if (isInWishlistState) {
        const success = await removeFromWishlist(Number(productId));
        if (success) {
          // No need to set isInWishlistState here, it's derived from context
        }
      } else {
        const success = await addToWishlist(Number(productId));
        if (success) {
          // No need to set isInWishlistState here, it's derived from context
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Size variants
  const sizeClasses = {
    small: "w-8 h-8 p-1",
    default: "w-10 h-10 p-2",
    large: "w-12 h-12 p-3"
  };

  // Style variants
  const variantClasses = {
    default: "bg-white/90 hover:bg-white shadow-md",
    minimal: "bg-transparent hover:bg-white/50",
    filled: isInWishlistState ? "bg-red-500 hover:bg-red-600" : "bg-white/90 hover:bg-white"
  };

  const iconSizes = {
    small: "h-4 w-4",
    default: "h-5 w-5",
    large: "h-6 w-6"
  };

  return (
    <button
      onClick={handleToggleWishlist}
      disabled={isLoading || wishlistLoading}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full transition-all duration-200 hover:scale-110 
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center
        ${className}
      `}
      title={isInWishlistState ? t("REMOVE_FROM_WISHLIST") : t("ADD_TO_WISHLIST")}
    >
      {isLoading ? (
        <div className={`animate-spin rounded-full border-b-2 border-current ${iconSizes[size]}`}></div>
      ) : (
        <svg
          className={`${iconSizes[size]} ${isInWishlistState ? 'text-red-500' : 'text-gray-600'
            }`}
          fill={isInWishlistState ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}

      {showText && (
        <span className="ml-2 text-sm font-medium">
          {isInWishlistState ? t("SAVED") : t("SAVE")}
        </span>
      )}
    </button>
  );
};

export default WishlistButton;
