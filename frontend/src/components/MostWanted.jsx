import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';
import axios from "axios";

// Helper to normalize and resolve any image format
const resolveImageUrl = (img, backendUrl = "") => {
    if (!img) return null;
    let url = typeof img === "string" ? img : (img.url || img.imageUrl || img.Url || img.ImageUrl || img.path || img.src);
    if (!url || typeof url !== "string") return null;
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
        return trimmed;
    }
    if (backendUrl && (trimmed.startsWith("/") || trimmed.startsWith("uploads/"))) {
        const cleanBase = backendUrl.replace(/\/+$/, "");
        const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
        return `${cleanBase}${cleanPath}`;
    }
    return trimmed;
};

// Helper to extract image array from item, nested product, or catalog fallback
const getProductImages = (item, products = [], backendUrl = "") => {
    const candidate = item?.product || item;
    let rawList = [];

    if (Array.isArray(candidate?.images) && candidate.images.length > 0) {
        rawList = candidate.images;
    } else if (Array.isArray(item?.images) && item.images.length > 0) {
        rawList = item.images;
    } else if (Array.isArray(candidate?.image) && candidate.image.length > 0) {
        rawList = candidate.image;
    } else if (Array.isArray(item?.image) && item.image.length > 0) {
        rawList = item.image;
    } else if (candidate?.mainImageUrl || item?.mainImageUrl) {
        rawList = [candidate?.mainImageUrl || item?.mainImageUrl];
    } else if (candidate?.imageUrl || item?.imageUrl) {
        rawList = [candidate?.imageUrl || item?.imageUrl];
    } else if (candidate?.image || item?.image) {
        rawList = [candidate?.image || item?.image];
    }

    let resolved = rawList.map(img => resolveImageUrl(img, backendUrl)).filter(Boolean);

    // Fallback: lookup in ShopContext products catalog
    if (resolved.length === 0 && Array.isArray(products) && products.length > 0) {
        const pId = String(item?.productId || item?.id || item?._id || candidate?.id || candidate?._id || "");
        const catalogItem = products.find(p => String(p.id || p._id) === pId);
        if (catalogItem) {
            if (Array.isArray(catalogItem.image) && catalogItem.image.length > 0) {
                resolved = catalogItem.image.map(img => resolveImageUrl(img, backendUrl)).filter(Boolean);
            } else if (Array.isArray(catalogItem.images) && catalogItem.images.length > 0) {
                resolved = catalogItem.images.map(img => resolveImageUrl(img, backendUrl)).filter(Boolean);
            } else if (catalogItem.mainImageUrl) {
                resolved = [resolveImageUrl(catalogItem.mainImageUrl, backendUrl)].filter(Boolean);
            }
        }
    }

    return resolved;
};

const MostWanted = () => {
    const { t } = useTranslation();
    const { backendUrl, products } = useContext(ShopContext);
    const [mostWantedProducts, setMostWantedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMostWanted = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${backendUrl}/api/Products/most-wishlisted?isActive=true&includeDeleted=false&page=1&pageSize=8`);

                let prods = [];
                if (response.data?.responseBody?.data) {
                    prods = response.data.responseBody.data;
                } else if (response.data?.data) {
                    prods = response.data.data;
                } else if (Array.isArray(response.data)) {
                    prods = response.data;
                }

                setMostWantedProducts(prods);
            } catch (err) {
                console.error("Error fetching most wanted products:", err);
            } finally {
                setLoading(false);
            }
        };

        if (backendUrl) {
            fetchMostWanted();
        }
    }, [backendUrl]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.12,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 30 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1]
            }
        },
    };

    if (loading) {
        return (
            <div className="my-20 px-4 sm:px-[5vw]">
                <div className="text-left py-8">
                    <Title text1={'MOST'} text2={'WANTED'} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, index) => (
                        <div key={index} className="animate-pulse bg-[var(--surface-raised)] border border-[var(--border)] aspect-[3/4] rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (mostWantedProducts.length === 0) return null;

    return (
        <div className="my-24 px-4 sm:px-[5vw]">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-left py-8 flex flex-col md:flex-row md:items-end justify-between items-start gap-4 mb-8"
            >
                <div>
                    <Title text1={'MOST'} text2={'WANTED'} />
                    <div className="h-1 w-20 bg-[var(--accent)] mt-2"></div>
                </div>
                <p className="max-w-lg text-[var(--text-muted)] font-light text-sm md:text-base">
                    Discover what’s trending globally. These items are the current peak of style and desirability according to our community.
                </p>
            </motion.div>

            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={containerVariants}
                className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-12"
            >
                {mostWantedProducts.map((item, index) => {
                    const productImages = getProductImages(item, products, backendUrl);
                    const prodId = item.productId || item.id || item._id || item.product?.id || item.product?._id;
                    const prodName = item.productName || item.name || item.product?.name;
                    const prodPrice = item.price ?? item.product?.price ?? 0;
                    const prodFinalPrice = item.finalPrice ?? item.product?.finalPrice ?? prodPrice;
                    const prodDiscount = item.discountPrecentage ?? item.discountPercentage ?? item.product?.discountPrecentage;
                    const prodQty = item.quantity ?? item.product?.quantity;
                    const prodIsLiked = item.isInWishlist ?? item.IsLiked ?? item.isLiked ?? item.product?.isInWishlist ?? item.product?.IsLiked ?? item.product?.isLiked;

                    // Create unique key using both id and index to avoid duplicates
                    const uniqueKey = `${prodId || 'mw'}-${index}`;

                    return (
                        <motion.div key={uniqueKey} variants={itemVariants} className="card-luxury">
                            <ProductItem
                                id={prodId}
                                image={productImages}
                                name={prodName}
                                price={prodPrice}
                                finalPrice={prodFinalPrice}
                                discountPrecentage={prodDiscount}
                                hidePrice={true}
                                quantity={prodQty}
                                isInWishlist={prodIsLiked}
                            />
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default MostWanted;
