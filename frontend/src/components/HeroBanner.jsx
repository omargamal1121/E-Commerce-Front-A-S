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
import "swiper/css/effect-coverflow";
import { Autoplay, Pagination, Navigation, EffectCoverflow } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";

const HeroBanner = () => {
  const { backendUrl } = useContext(ShopContext);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('none');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        try {
          const collResponse = await axios.get(`${backendUrl}/api/Collection?page=1&pageSize=10`);
          let collData = collResponse.data?.responseBody?.data || collResponse.data?.data || [];
          if (collData.length > 0) {
            setCollections(collData);
            setViewMode('collections');
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
      <div className="w-full h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  const slidesData = viewMode === 'collections' ? collections : [
    { name: "Winter Collection", subtitle: "Luxury Outerwear", image: assets.Winter_collection_img, link: "/collection" },
    { name: "Streetwear Culture", subtitle: "Modern Essentials", image: assets.hero_banner_img, link: "/collection" },
    { name: "Baggie Trends", subtitle: "Relaxed Fit", image: assets.baggey3, link: "/collection" }
  ];

  return (
    <div className="w-full h-[65vh] md:h-[85vh] relative overflow-hidden bg-black">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectCoverflow]}
        effect="coverflow"
        loop={true}
        speed={1200}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        coverflowEffect={{ rotate: 10, stretch: 0, depth: 100, modifier: 1, slideShadows: false }}
        className="w-full h-full hero-banner-swiper"
      >
        {slidesData.map((item, index) => {
          const imgUrl = item.images ? (item.images.find(img => img.isMain)?.url || item.images[0]?.url) : item.image;
          const finalLink = item.id ? `/collection-products/${item.id}` : item.link;

          return (
            <SwiperSlide key={index} className="w-full h-full overflow-hidden">
              <div className="group relative w-full h-full cursor-pointer">
                <img
                  src={imgUrl || assets.hero_banner_img}
                  alt={item.name}
                  className="w-full h-full object-cover object-center scale-100 transition-transform duration-[12000ms] ease-out swiper-zoom-in"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80"></div>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
                  <AnimatePresence mode="wait">
                    {activeIndex === index && (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col items-center"
                      >
                        <motion.span variants={textVariants} className="text-sm uppercase tracking-[0.5em] mb-6 font-bold text-white/70">
                          {item.subtitle || "Featured Selection"}
                        </motion.span>
                        <motion.h2 variants={textVariants} className="text-5xl md:text-8xl font-black mb-12 tracking-tighter drop-shadow-2xl">
                          {item.name}
                        </motion.h2>
                        <motion.div variants={textVariants}>
                          <Link to={finalLink}>
                            <button className="btn-premium px-16 py-5 bg-white text-black font-black text-xs uppercase tracking-[0.3em] rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all">
                              {viewMode === 'collections' ? "See Collection" : "Discover Now"}
                            </button>
                          </Link>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
      <style>{`
        .hero-banner-swiper .swiper-pagination-bullet { background: #fff !important; width: 10px; height: 10px; transition: all 0.3s; }
        .hero-banner-swiper .swiper-pagination-bullet-active { width: 30px; border-radius: 5px; opacity: 1 !important; }
        .hero-banner-swiper .swiper-slide-active img { transform: scale(1.1); }
      `}</style>
    </div>
  );
};

export default HeroBanner;