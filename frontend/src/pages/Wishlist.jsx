import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShopContext } from '../context/ShopContext';
import { useTranslation } from 'react-i18next';

const Wishlist = () => {
  const { t } = useTranslation();
  const { 
    wishlistItems, 
    wishlistLoading, 
    removeFromWishlist, 
    addToCart, 
    clearWishlist,
    fetchWishlist,
    currency,
    user 
  } = useContext(ShopContext);

  const [isRemoving, setIsRemoving] = useState({});


  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
    } else {
      console.log('Fetching wishlist on page load...');
      fetchWishlist();
      console.log('Current wishlist items:', wishlistItems);
    }
  }, [user]);

  const handleRemoveFromWishlist = async (productId) => {
    console.log('Removing from wishlist:', productId);
    setIsRemoving(prev => ({ ...prev, [productId]: true }));
    await removeFromWishlist(Number(productId));
    setIsRemoving(prev => ({ ...prev, [productId]: false }));
  };

  const handleAddToCart = async (productId, size = 'M', color = 'default') => {
    console.log('Adding to cart:', { productId, size, color });
    await addToCart(String(productId), size, color, 1);
  };

  const handleClearWishlist = async () => {
    if (window.confirm('Are you sure you want to clear your wishlist?')) {
      await clearWishlist();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view your wishlist</h2>
          <Link 
            to="/login" 
            className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (wishlistLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("WISHLIST")}</h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : t("WISHLIST_ITEMS")}
            </p>
            <button 
              onClick={() => fetchWishlist()} 
              className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center"
              disabled={wishlistLoading}
            >
              {wishlistLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  Refreshing...
                </span>
              ) : (
                <span>Refresh Wishlist</span>
              )}
            </button>
          </div>
        </div>


        {/* Clear Wishlist Button */}
        {wishlistItems.length > 0 && (
          <div className="mb-6">
            <button
              onClick={handleClearWishlist}
              className="text-red-600 hover:text-red-800 underline text-sm"
            >
              {t("CLEAR_WISHLIST")}
            </button>
          </div>
        )}

        {/* Empty State */}
        {wishlistItems.length === 0 && !wishlistLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="mb-6">
              <svg
                className="mx-auto h-24 w-24 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">{t("WISHLIST_EMPTY")}</h3>
            <p className="text-gray-600 mb-6">
              {t("WISHLIST_EMPTY_DESC")}
            </p>
            <Link
              to="/"
              className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors inline-block"
            >
              {t("CONTINUE_SHOPPING")}
            </Link>
          </motion.div>
        )}

        {/* Wishlist Items */}
        {wishlistItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {wishlistItems.map((item, index) => {
              const product = item.product;
              
              // Handle case where product data might be missing
              if (!product) {
                console.warn('Wishlist item missing product data:', item);
                return null;
              }
              
              const mainImage = product?.images?.find(img => img.isMain)?.url || 
                               product?.images?.[0]?.url || 
                               'https://via.placeholder.com/300x400';
              
              const originalPrice = product?.price || 0;
              const finalPrice = product?.finalPrice || originalPrice;
              const hasDiscount = finalPrice < originalPrice;

              console.log('Wishlist item:', item);
              console.log('Product data:', product);

              return (
                <motion.div
                  key={item.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <Link to={`/product/${product?.id}`}>
                      <img
                        src={mainImage}
                        alt={product?.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    
                    {/* Remove from Wishlist Button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(product?.id)}
                      disabled={isRemoving[product?.id]}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110 disabled:opacity-50"
                    >
                      {isRemoving[product?.id] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      ) : (
                        <svg
                          className="h-4 w-4 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                        {Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4">
                    <Link to={`/product/${product?.id}`} className="block">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 hover:text-gray-600 transition-colors">
                        {product?.name || 'Product Name Not Available'}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {product?.description || 'No description available'}
                      </p>
                    </Link>

                    {/* Price */}
                    <div className="mb-4">
                      {hasDiscount ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {currency}{finalPrice}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {currency}{originalPrice}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-semibold text-gray-900">
                          {currency}{originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(product?.id)}
                      className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors duration-200 text-sm font-medium"
                    >
                      {t("ADD_TO_CART")}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Continue Shopping Button */}
        {wishlistItems.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              to="/"
              className="bg-gray-200 text-gray-900 px-8 py-3 rounded hover:bg-gray-300 transition-colors inline-block"
            >
              {t("CONTINUE_SHOPPING")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
