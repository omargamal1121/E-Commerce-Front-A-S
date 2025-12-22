import React, { useRef, useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/frontend_assets/assets";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";

// Default slider images as fallback
const defaultSliderImages = [assets.hero_img2, assets.hero_img3];

const HeroImage = ({ height }) => {
  const { t } = useTranslation();
  const { backendUrl } = useContext(ShopContext);
  const swiperRef = useRef();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch active collections
  useEffect(() => {
    const fetchActiveCollections = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${backendUrl}/api/Collection`, {
          params: {
            isActive: true,
            includeDeleted: false,
          },
        });

        if (response.data?.responseBody?.data) {
          const activeCollections = response.data.responseBody.data;
          setCollections(activeCollections);
        }
      } catch (err) {
        console.error("Error fetching active collections:", err);
        setError("Failed to load collections");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveCollections();
  }, [backendUrl]);

  // Default fallback image if collection has no main image
  const defaultSliderImage = "/images/default-slider.jpg";

  // Get slider images
  const sliderImages =
    collections.length > 0
      ? collections.map((collection) => {
        // Try to find the main image in the collection
        const mainImage = collection.images?.find((img) => img.isMain);

        // Return the main image if found, otherwise fallback
        return mainImage ? mainImage.url : defaultSliderImage;
      })
      : [defaultSliderImage];

  // Get collection names for display
  const collectionNames = collections.map((collection) => collection.name);

  // Handle loading state
  if (loading && collections.length === 0) {
    // Use default images during loading
    console.log("Loading collections...");
  }

  // Handle error state
  if (error && collections.length === 0) {
    console.error("Error loading collections:", error);
  }

  return (
    <section className={`relative w-full h-[${height}vh] overflow-hidden m-0 p-0`}
      style={{ height: `${height}vh` }}>
      {/* Collection indicator dots
      {collections.length > 1 && (
        <div className="absolute top-4 right-4 z-20 flex space-x-2">
          {collections.map((_, idx) => (
            <button
              key={idx}
              className={`w-3 h-3 rounded-full ${idx === activeIndex ? "bg-white" : "bg-white/50"}`}
              onClick={() => swiperRef.current?.slideTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )} */}

      {/* Swiper Slider as Hero Image */}
      <Swiper
        modules={[Autoplay]}
        loop={sliderImages.length > 1}
        grabCursor={true}
        autoplay={{ delay: 10000, disableOnInteraction: false }}
        className="absolute inset-0 w-full h-full m-0 p-0 hero-swiper"
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
      >
        {sliderImages.map((img, idx) => (
          <SwiperSlide
            key={idx}
            className="relative cursor-pointer"
            onClick={() => {
              if (collections.length > 0 && idx < collections.length) {
                navigate(`/collection-products/${collections[idx].id}`);
              } else {
                navigate("/collection");
              }
            }}
          >
            {/* Hero image */}
            <img
              src={img}
              alt={`slide-${idx}`}
              className="w-full h-full object-cover object-center m-0 p-0"
            />

            {/* Black overlay */}
            <div className="absolute inset-0 bg-black/20 z-10"></div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center bg-opacity-30 z-10 m-0 p-0"
        style={{ pointerEvents: "none" }}
      >
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <h1 className="font-bold text-white mb-6 drop-shadow-lg text-center m-0 p-0">
            {collections.length > 0 && activeIndex < collections.length
              ? collectionNames[activeIndex]
              : activeIndex === 0
                ? t("HERO_IMAGE_TITLE")
                : "SS25"}
          </h1>

          {/* Navigate to collection products page */}
          <Link
            to={
              collections.length > 0 && activeIndex < collections.length
                ? `/collection-products/${collections[activeIndex].id}`
                : "/collection"
            }
            style={{ pointerEvents: "auto" }}
          >
            <button
              className="relative overflow-hidden text-white px-8 py-3 shadow border border-white text-sm font-normal m-0 p-0 cursor-pointer group"
              style={{ pointerEvents: "auto" }}
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-black">
                {t("SHOP_NOW")}
              </span>
              <span className="absolute inset-0 bg-white transform translate-y-full transition-transform duration-300 group-hover:translate-y-0"></span>
            </button>
          </Link>
        </motion.div>
      </div>
      {/* Swiper pagination dots will appear below the slider by default, but we can style them */}
      <style>{`
        .hero-swiper .swiper-pagination {
          position: absolute;
          bottom: 24px;
          left: 0;
          width: 100%;
          display: flex;
          justify-content: center;
          z-index: 20;
        }
        .hero-swiper .swiper-pagination-bullet {
          background: #fff;
          opacity: 0.7;
          width: 16px;
          height: 16px;
          margin: 0 8px;
          border-radius: 50%;
          border: 2px solid #000;
          transition: background 0.3s, opacity 0.3s, transform 0.3s;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: #000;
          opacity: 1;
          transform: scale(1.2);
          border-color: #fff;
        }
        .hero-swiper .swiper-button-next,
        .hero-swiper .swiper-button-prev {
          color: #fff;
          background: rgba(0,0,0,0.3);
          border-radius: 50%;
          width: 44px;
          height: 44px;
          top: 50%;
          transform: translateY(-50%);
        }
        .hero-swiper .swiper-button-next:after,
        .hero-swiper .swiper-button-prev:after {
          font-size: 22px;
          font-weight: bold;
        }
      `}</style>
    </section>
  );
};

export default HeroImage;
