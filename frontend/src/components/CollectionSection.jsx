import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import Title from "./Title";
import { useTranslation } from "react-i18next";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/frontend_assets/assets";

const CollectionSection = () => {
    const { t } = useTranslation();
    const { backendUrl } = useContext(ShopContext);
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCollections = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch collections as specified by user: isDeleted=true&isActive=false
                const response = await fetch(
                    `${backendUrl}/api/Collection?page=1&pageSize=10&isDeleted=true&isActive=false`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.responseBody?.data && Array.isArray(data.responseBody.data)) {
                    const transformedCollections = data.responseBody.data.map(
                        (collection) => {
                            const mainImage = collection.images?.find(img => img.isMain) || collection.images?.[0];
                            const imageUrl = mainImage?.url || assets.eniem;

                            return {
                                id: collection.id,
                                name: collection.name,
                                image: imageUrl,
                                link: `/collection-products/${collection.id}`,
                                description: collection.description || "",
                            };
                        }
                    );

                    setCollections(transformedCollections);
                } else {
                    setCollections([]);
                }
            } catch (err) {
                console.error("Error fetching collections:", err);
                setError(err.message);
                setCollections([]);
            } finally {
                setLoading(false);
            }
        };

        if (backendUrl) {
            fetchCollections();
        }
    }, [backendUrl]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                <span className="ml-3 text-gray-600">{t("LOADING_COLLECTIONS")}...</span>
            </div>
        );
    }

    if (collections.length === 0) {
        return null;
    }

    return (
        <div className="my-10 overflow-hidden px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw]">
            <div className="text-center text-2xl py-6 mb-6">
                <Title text1={t("SPECIAL")} text2={t("COLLECTIONS")} />
            </div>

            {error && (
                <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{t("ERROR_LOADING_COLLECTIONS")}</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {collections.map((item) => (
                    <Link
                        key={item.id}
                        to={item.link}
                        className="block border border-gray-200 rounded-lg hover:shadow-lg transition-all"
                    >
                        <div className="overflow-hidden rounded-t-lg bg-gray-100 flex items-center justify-center h-60">
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                onError={(e) => {
                                    e.target.src = assets.eniem;
                                }}
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="font-medium text-lg text-gray-900">
                                {item.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {item.description || t("VIEW_COLLECTION")}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default CollectionSection;
