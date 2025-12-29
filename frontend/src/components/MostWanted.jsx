import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';
import axios from "axios";

const MostWanted = () => {
    const { t } = useTranslation();
    const { backendUrl } = useContext(ShopContext);
    const [mostWantedProducts, setMostWantedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMostWanted = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${backendUrl}/api/Products/most-wishlisted?page=1&pageSize=8`);

                let products = [];
                if (response.data?.responseBody?.data) {
                    products = response.data.responseBody.data;
                } else if (response.data?.data) {
                    products = response.data.data;
                } else if (Array.isArray(response.data)) {
                    products = response.data;
                }

                setMostWantedProducts(products);
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
                        <div key={index} className="animate-pulse bg-gray-100 aspect-[3/4] rounded-sm"></div>
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
                    <div className="h-1 w-20 bg-black mt-2"></div>
                </div>
                <p className="max-w-lg text-gray-500 font-light text-sm md:text-base">
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
                    const productImages = Array.isArray(item.images)
                        ? item.images.map(img => img.url || img.imageUrl).filter(Boolean)
                        : (item.image || item.mainImageUrl ? [item.image || item.mainImageUrl] : []);

                    return (
                        <motion.div key={item.productId || item.id || item._id || index} variants={itemVariants} className="card-luxury">
                            <ProductItem
                                id={item.productId || item.id || item._id}
                                image={productImages}
                                name={item.productName || item.name}
                                price={item.price}
                                finalPrice={item.finalPrice}
                                discountPrecentage={item.discountPrecentage}
                                hidePrice={true}
                            />
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default MostWanted;
