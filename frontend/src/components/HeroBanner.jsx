import React, { useState, useEffect, useContext } from 'react';
import { assets } from '../assets/frontend_assets/assets.js'
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { motion } from "framer-motion";

const HeroBanner = () => {
  const { backendUrl } = useContext(ShopContext);
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('none');
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperRef, setSwiperRef] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        try {
          const [collResponse, catResponse] = await Promise.all([
            axios.get(`${backendUrl}/api/Collection?page=1&pageSize=10&isActive=true&isDeleted=false&searchTerm=`),
            axios.get(`${backendUrl}/api/categories?isActive=true&isDeleted=false&page=1&pageSize=50`)
          ]);
          
          let collData = collResponse.data?.responseBody?.data || collResponse.data?.data || [];
          let catData = catResponse.data?.responseBody?.data || catResponse.data?.data || [];
          
          if (collData.length > 0 && catData.length > 0) {
            setCollections(collData);
            setCategories(catData);
            setViewMode('both');
            setLoading(false);
            return;
          } else if (collData.length > 0) {
            setCollections(collData);
            setViewMode('collections');
            setLoading(false);
            return;
          } else if (catData.length > 0) {
            setCategories(catData);
            setViewMode('categories');
            setLoading(false);
            return;
          }
        } catch (err) { }
        setViewMode('static');
      } finally { setLoading(false); }
    };
    if (backendUrl) fetchData();
  }, [backendUrl]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 30, letterSpacing: "0.2em" },
    visible: {
      opacity: 1,
      y: 0,
      letterSpacing: "0em",
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] bg-[var(--surface-raised)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text)]"></div>
      </div>
    );
  }

  const slidesData = viewMode === 'both' 
    ? [...categories.map(cat => ({ ...cat, type: 'category', link: `/category/${cat.id}`, displayType: 'Category' })), 
       { separator: true, displayType: 'Collections' },
       ...collections.map(coll => ({ ...coll, type: 'collection', link: `/collection-products/${coll.id}`, displayType: 'Collection' }))]
    : viewMode === 'categories' 
      ? categories.map(cat => ({ ...cat, type: 'category', link: `/category/${cat.id}`, displayType: 'Category' }))
      : viewMode === 'collections'
        ? collections.map(coll => ({ ...coll, type: 'collection', link: `/collection-products/${coll.id}`, displayType: 'Collection' }))
        : [
            { name: "Urban", subtitle: "Luxury Outerwear", image: assets.Winter_collection_img, link: "/collection", type: 'static', displayType: 'Featured' },
            { name: "Streetwear", subtitle: "Modern Essentials", image: assets.hero_banner_img, link: "/collection", type: 'static', displayType: 'Featured' },
            { name: "Signature", subtitle: "Relaxed Fit", image: assets.baggey3, link: "/collection", type: 'static', displayType: 'Featured' }
          ];

  console.log('Hero Banner - View Mode:', viewMode);
  console.log('Hero Banner - Total Slides:', slidesData.length);
  console.log('Hero Banner - Categories:', categories.length);
  console.log('Hero Banner - Collections:', collections.length);
  console.log('Hero Banner - Slides Data:', slidesData);

  return (
    <div className="w-full h-[65vh] md:h-[85vh] relative overflow-hidden hero-gradient">
      <Swiper
        key={slidesData.length}
        modules={[Autoplay, Pagination, Navigation]}
        loop={true}
        speed={1000}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: false
        }}
        pagination={{ clickable: true, dynamicBullets: true }}
        onSwiper={(swiper) => {
          console.log('Swiper initialized:', swiper);
          setSwiperRef(swiper);
        }}
        onSlideChange={(swiper) => {
          console.log('Slide changed. Active index:', swiper.activeIndex, 'Real index:', swiper.realIndex);
          setActiveIndex(swiper.realIndex);
        }}
        className="w-full h-full hero-banner-swiper"
      >
        {slidesData.map((item, index) => {
          if (item.separator) {
            return (
              <SwiperSlide key={index} className="w-full h-full overflow-hidden">
                <div className="w-full h-full bg-[var(--brand)] flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-[var(--surface-raised)]/40"></div>
                  <div className="relative z-10 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8 }}
                      className="flex flex-col items-center"
                    >
                      <h2 className="text-5xl md:text-7xl font-serif-title font-bold text-[var(--text)] tracking-tight uppercase mb-6">
                        {item.displayType}
                      </h2>
                      <div className="w-40 h-1 bg-[var(--accent)] mx-auto shadow-2xl"></div>
                      <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] mt-6 font-bold">
                        Curated Selections
                      </p>
                    </motion.div>
                  </div>
                </div>
              </SwiperSlide>
            );
          }

          const imgUrl = item.images
            ? (item.images.find(img => img.isMain)?.url || item.images[0]?.url)
            : item.image;
          const finalLink = item.link;

          return (
            <SwiperSlide key={index} className="w-full h-full overflow-hidden">
              <div className="group relative w-full h-full cursor-pointer bg-[var(--brand)]">
                <img
                  src={imgUrl || assets.hero_banner_img}
                  alt={item.name}
                  className="w-full h-full object-cover object-center scale-100 transition-transform duration-[12000ms] ease-out swiper-zoom-in opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/90 via-[var(--surface-raised)]/40 to-transparent"></div>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[var(--text)] px-4">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col items-center max-w-4xl"
                  >
                    <motion.span variants={textVariants} className="text-xs md:text-sm uppercase tracking-[0.5em] mb-4 font-bold text-[var(--accent)]">
                      {item.displayType} {item.subtitle ? `• ${item.subtitle}` : ''}
                    </motion.span>
                    <motion.h2 variants={textVariants} className="text-4xl md:text-7xl lg:text-8xl font-serif-title font-bold mb-8 tracking-tight drop-shadow-lg text-[var(--text)]">
                      {item.name}
                    </motion.h2>
                    <motion.div variants={textVariants}>
                      <Link to={finalLink}>
                        <button className="btn-primary-fashion px-12 py-4 shadow-2xl">
                          {item.displayType === 'Category' ? "Explore Category" : item.displayType === 'Collection' ? "See Collection" : "Discover Now"}
                        </button>
                      </Link>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
      <style>{`
        .hero-banner-swiper .swiper-pagination-bullet { background: var(--text) !important; width: 10px; height: 10px; transition: all 0.3s; }
        .hero-banner-swiper .swiper-pagination-bullet-active { width: 30px; border-radius: 5px; opacity: 1 !important; }
        .hero-banner-swiper .swiper-slide-active img { transform: scale(1.1); }
        .hero-banner-swiper .swiper-slide { transition: transform 0.6s ease; }
      `}</style>
    </div>
  );
};

export default HeroBanner;
