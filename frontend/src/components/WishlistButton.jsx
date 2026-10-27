import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const {
    addToWishlist,
    removeFromWishlist,
    wishlistItems,
    wishlistLoading,
    user
  } = useContext(ShopContext);

  const [isLoading, setIsLoading] = useState(false);
  const isInWishlistFromContext = wishlistItems.some(item => item.id === productId || item.productId === productId);
  const resolvedIsInWishlist = isInWishlistProp !== null && isInWishlistProp !== undefined
    ? Boolean(isInWishlistProp)
    : isInWishlistFromContext;
  const [isInWishlist, setIsInWishlist] = useState(Boolean(resolvedIsInWishlist));

  useEffect(() => {
    setIsInWishlist(Boolean(resolvedIsInWishlist));
  }, [resolvedIsInWishlist]);

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    if (isLoading || wishlistLoading) return;

    setIsLoading(true);
    const current = Boolean(isInWishlist);
    setIsInWishlist(!current);

    try {
      if (current) {
        const success = await removeFromWishlist(Number(productId));
        if (success) {
          setIsInWishlist(false);
        } else {
          setIsInWishlist(true);
        }
      } else {
        const success = await addToWishlist(Number(productId));
        if (success) {
          setIsInWishlist(true);
        } else {
          setIsInWishlist(false);
        }
      }
    } catch (error) {
      setIsInWishlist(current);
    } finally {
      setIsLoading(false);
    }
  };

  // Size variants
  const sizeClasses = {
    small: "w-8 h-8 p-1",
    default: "w-10 h-10 p-2",
    large: "w-12 h-12 p-3",
    sm: "w-8 h-8 p-1",
    lg: "w-12 h-12 p-3"
  };

  // Style variants
  const variantClasses = {
    default: "bg-white/90 hover:bg-white shadow-md",
    minimal: "bg-transparent hover:bg-white/50",
    filled: isInWishlist ? "bg-red-500 hover:bg-red-600" : "bg-white/90 hover:bg-white",
    floating: "bg-white/90 hover:bg-white shadow-xl"
  };

  const iconSizes = {
    small: "h-4 w-4",
    default: "h-5 w-5",
    large: "h-6 w-6",
    sm: "h-4 w-4",
    lg: "h-6 w-6"
  };

  return (
    <button
      onClick={handleToggleWishlist}
      disabled={isLoading || wishlistLoading}
      className={`
        ${sizeClasses[size] || sizeClasses.default}
        ${variantClasses[variant] || variantClasses.default}
        rounded-full transition-all duration-200 hover:scale-110 
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center
        ${className}
      `}
      title={isInWishlist ? t("REMOVE_FROM_WISHLIST") : t("ADD_TO_WISHLIST")}
    >
      {isLoading ? (
        <div className={`animate-spin rounded-full border-b-2 border-current ${iconSizes[size] || iconSizes.default}`}></div>
      ) : (
        <svg
          className={`${iconSizes[size] || iconSizes.default} ${isInWishlist ? 'text-red-500' : 'text-gray-600'
            }`}
          fill={isInWishlist ? 'currentColor' : 'none'}
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
          {isInWishlist ? t("SAVED") : t("SAVE")}
        </span>
      )}
    </button>
  );
};

export default WishlistButton;
