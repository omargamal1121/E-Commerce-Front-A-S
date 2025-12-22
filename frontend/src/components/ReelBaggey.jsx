import React, { useContext, useState, useEffect } from 'react'
import Title from './Title'
import { ShopContext } from '../context/ShopContext'
import ProductCard from './ProductCard'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next';

const ReelBaggey = () => {
    const { t } = useTranslation();
    const { backendUrl } = useContext(ShopContext);

    const [wishlistProducts, setWishlistProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Function to fetch wishlist products
    const fetchWishlistProducts = async () => {
        try {
            const authToken = localStorage.getItem("token");
            
            if (!authToken) {
                setError("Please log in to view your wishlist");
                setWishlistProducts([]);
                return;
            }

            const headers = {
                "Content-Type": "application/json",
                "Accept": "text/plain",
                "Authorization": `Bearer ${authToken}`
            };

            console.log("Fetching wishlist from:", `${backendUrl}/api/Wishlist`);
            const response = await fetch(`${backendUrl}/api/Wishlist`, { headers });
            
            if (response.ok) {
                const data = await response.json();
                console.log("Wishlist API response:", data);
                
                if (data.responseBody?.data && Array.isArray(data.responseBody.data)) {
                    // Extract product data from wishlist items
                    const products = data.responseBody.data.map(wishlistItem => {
                        // If wishlist item has a product property, use it
                        if (wishlistItem.product) {
                            return wishlistItem.product;
                        }
                        // If wishlist item is the product itself, use it directly
                        return wishlistItem;
                    }).filter(product => product && product.id); // Filter out invalid products
                    
                    console.log("Extracted products:", products);
                    setWishlistProducts(products);
                } else {
                    console.log("No wishlist data found");
                    setWishlistProducts([]);
                }
            } else if (response.status === 401) {
                setError("Please log in to view your wishlist");
                setWishlistProducts([]);
            } else {
                console.error("Wishlist API error:", response.status, response.statusText);
                setError("Failed to load wishlist products");
                setWishlistProducts([]);
            }
        } catch (error) {
            console.error("Error fetching wishlist products:", error);
            setError("Network error. Please try again.");
            setWishlistProducts([]);
        }
    };

    useEffect(() => {
        const loadWishlistProducts = async () => {
            try {
                setLoading(true);
                setError("");
                await fetchWishlistProducts();
            } catch (err) {
                console.error("Error loading wishlist products:", err);
                setError("Failed to load wishlist products");
            } finally {
                setLoading(false);
            }
        };

        loadWishlistProducts();
    }, [backendUrl]);

    return (
        <motion.div
            className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1, margin: "-100px" }}
            variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: "easeOut" },
                },
            }}
        >
            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                </div>
            ) : error ? (
                <div className="text-center text-red-600 p-4 bg-red-100 rounded-md">
                    {error}
                </div>
            ) : (
                <>
                    {/* Subcategory Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <h1 className="text-xl sm:text-2xl md:text-3xl tracking-wide mb-3 sm:mb-4 uppercase">
                            <Title text1={t('MY')} text2={t('WISHLIST')} />
                        </h1>
                        <p className="text-gray-600 text-sm sm:text-base max-w-3xl mx-auto px-4">
                            {t('WISHLIST_PRODUCTS_DESCRIPTION')}
                        </p>
                    </div>

                    {/* Debug Info */}
                    <div className="text-center text-xs text-gray-400 mb-4">
                        Debug: {wishlistProducts.length} products found
                    </div>

                    {/* Products Grid */}
                    {wishlistProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                            {wishlistProducts.slice(0, 8).map((product) => {
                                console.log("Rendering product:", product);
                                return (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 my-8">
                            <div className="max-w-md mx-auto">
                                <div className="text-6xl mb-4">💝</div>
                                <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
                                <p className="text-sm sm:text-base mb-4">
                                    {t('NO_WISHLIST_PRODUCTS') || 'Start adding products to your wishlist to see them here.'}
                                </p>
                                <a 
                                    href="/" 
                                    className="inline-block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
                                >
                                    Continue Shopping
                                </a>
                            </div>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    )
}

export default ReelBaggey
