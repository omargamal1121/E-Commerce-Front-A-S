import React, { useContext, useState, useEffect } from 'react'
import Title from './Title'
import { ShopContext } from '../context/ShopContext'
import ProductCard from './ProductCard'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next';

const ReelBaggey = () => {
    const { t } = useTranslation();
    const { backendUrl, token } = useContext(ShopContext);

    const [wishlistProducts, setWishlistProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Function to fetch wishlist products
    const fetchWishlistProducts = async () => {
        if (!token) return;

        try {
            const headers = {
                "Content-Type": "application/json",
                "Accept": "text/plain",
                "Authorization": `Bearer ${token}`
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
        if (!token) {
            setLoading(false);
            return;
        }

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
    }, [backendUrl, token]);

    // If no token, or if we've finished loading and there are no products, don't display anything
    if (!token || (!loading && wishlistProducts.length === 0)) return null;

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

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        {wishlistProducts.slice(0, 8).map((product) => {
                            return (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            );
                        })}
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default ReelBaggey;
