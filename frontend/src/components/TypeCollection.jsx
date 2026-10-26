import React, { useState, useEffect, useContext } from "react";
import { assets } from "../assets/frontend_assets/assets";
import { Link } from "react-router-dom";
import Title from "./Title";
import { useTranslation } from "react-i18next";
import { ShopContext } from "../context/ShopContext";
import { motion, AnimatePresence } from "framer-motion";

const CategoryCard = ({ item, t }) => {
  const images = Array.isArray(item.images) && item.images.length > 0
    ? item.images
    : [item.image].filter(Boolean);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let interval;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentIdx((prev) => (prev + 1) % images.length);
      }, 1500);
    } else {
      setCurrentIdx(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  return (
    <Link
      to={item.link}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="block bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)] hover:shadow-xl transition-all overflow-hidden group cursor-pointer"
    >
      <div className="overflow-hidden rounded-t-2xl bg-[var(--surface-raised)] flex items-center justify-center h-60 relative">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIdx}
            src={images[currentIdx] || assets.eniem}
            alt={item.name}
            initial={{ opacity: 0.8, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.8, scale: 1.05 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Progress dots for multiple images cycling */}
        {images.length > 1 && isHovered && (
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1 z-10 px-3">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  idx === currentIdx ? "bg-[var(--accent)] w-3" : "bg-white/60 backdrop-blur-sm"
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="p-4 bg-[var(--surface)]">
        <h3 className="font-bold text-base text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
          {item.name}
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">
          {item.description || t("VIEW_PRODUCTS")}
        </p>
      </div>
    </Link>
  );
};

const TypeCollection = () => {
  const { t } = useTranslation();
  const { backendUrl } = useContext(ShopContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories for user pages: isActive=true & isDeleted=false
        const response = await fetch(
          `${backendUrl}/api/categories?search&isActive=true&isDeleted=false&page=1&pageSize=10`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.responseBody?.data && Array.isArray(data.responseBody.data)) {
          const transformedCategories = data.responseBody.data.map(
            (category) => {
              // Extract the main image and all images from the images array
              const mainImage = category.images?.find(img => img.isMain) || category.images?.[0];
              const imageUrl = mainImage?.url || assets.eniem;
              const allImages = Array.isArray(category.images) && category.images.length > 0
                ? category.images.map(img => typeof img === 'string' ? img : img.url).filter(Boolean)
                : [imageUrl];

              return {
                id: category.id,
                name: category.name,
                image: imageUrl,
                images: allImages,
                link: `/category/${category.id}`,
                description: category.description || "",
              };
            }
          );

          setCategories(transformedCategories);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err.message);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    if (backendUrl) {
      fetchCategories();
    }
  }, [backendUrl]);

  // If loading, show nothing or a spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">{t("LOADING")}...</span>
      </div>
    );
  }

  // If no categories, return null to hide the section
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="my-10 overflow-hidden px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw]">
      <div className="text-center text-2xl py-6 mb-6">
        <Title text1={t("OUR")} text2={t("CATEGORIES")} />
      </div>

      {/* ❌ حالة الخطأ */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{t("ERROR_LOADING_CATEGORIES")}</p>
        </div>
      )}

      {/* ✅ عرض البيانات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((item) => (
          <CategoryCard key={item.id} item={item} t={t} />
        ))}
      </div>
    </div>
  );
};

export default TypeCollection;
