import React, { useRef, useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/frontend_assets/assets";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";

const HeroImage = ({ height }) => {
  const { t } = useTranslation();
  const { backendUrl } = useContext(ShopContext);
  const swiperRef = useRef();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        setLoading(true);
        try {
          const collResponse = await axios.get(`${backendUrl}/api/Collection?isActive=true&page=1&pageSize=10`);
          const collData = collResponse.data?.responseBody?.data || collResponse.data?.data || [];

          if (collData.length > 0) {
            setSlides(collData.map(c => ({
              id: c.id,
              name: c.name,
              image: c.images?.find(i => i.isMain)?.url || c.images?.[0]?.url,
              link: `/collection-products/${c.id}`,
              type: 'collection',
              subtitle: 'New Collection'
            })));
            setLoading(false);
            return;
          }
        } catch (err) { }

        const staticSlides = [
          { name: "Urban Essentials", image: assets.hero_img2, link: "/collection", type: 'lifestyle', subtitle: 'Summer Trends' },
          { name: "Modern Minimalism", image: assets.hero_img3, link: "/collection", type: 'lifestyle', subtitle: 'Autumn Drop' },
          { name: "The Denim Hub", image: assets.eniem, link: "/collection", type: 'lifestyle', subtitle: 'Heritage Look' }
        ];
        setSlides(staticSlides);
      } catch (err) {
        console.error("HeroImage: Fatal error", err);
      } finally {
        setLoading(false);
      }
    };

    if (backendUrl) fetchHeroData();
  }, [backendUrl]);

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${backendUrl}${url}`;
    return url;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  if (loading) {
    return (
      <div className={`relative w-full h-[${height}vh] bg-gray-50 flex items-center justify-center`} style={{ height: `${height}vh` }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <section className={`relative w-full overflow-hidden m-0 p-0`} style={{ height: `${height}vh` }}>
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        loop={slides.length > 1}
        autoplay={{ delay: 7000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="w-full h-full hero-swiper"
      >
        {slides.map((slide, idx) => {
          const imgUrl = slide.type === 'lifestyle' ? slide.image : resolveImageUrl(slide.image);

          return (
            <SwiperSlide key={idx} className="relative w-full h-full overflow-hidden">
              <div className="w-full h-full relative cursor-pointer" onClick={() => navigate(slide.link)}>
                <img
                  src={imgUrl || assets.hero_img}
                  alt={slide.name}
                  className="w-full h-full object-cover object-center scale-100 transition-transform duration-[15000ms] linear transform translate-z-0 swiper-zoom-container"
                  onError={(e) => { e.target.src = assets.hero_img; }}
                />
                <div className="absolute inset-0 bg-black/40 z-10"></div>

                <div className="absolute inset-0 z-20 flex items-center justify-center text-center p-6">
                  <AnimatePresence mode="wait">
                    {activeIndex === idx && (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="flex flex-col items-center"
                      >
                        <motion.span
                          variants={itemVariants}
                          className="text-white/80 uppercase tracking-[0.5em] text-sm mb-6 font-bold drop-shadow-lg"
                        >
                          {slide.subtitle}
                        </motion.span>
                        <motion.h1
                          variants={itemVariants}
                          className="text-6xl md:text-9xl font-black text-white mb-12 drop-shadow-2xl max-w-6xl px-2 leading-none tracking-tighter"
                        >
                          {slide.name}
                        </motion.h1>

                        <motion.div variants={itemVariants}>
                          <Link to={slide.link} onClick={(e) => e.stopPropagation()}>
                            <button className="btn-premium bg-white text-black px-20 py-6 shadow-2xl font-black rounded-sm transition-all duration-500 transform hover:scale-110 hover:tracking-[0.2em] uppercase tracking-widest text-sm">
                              {t("SHOP_NOW")}
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
        .hero-swiper .swiper-pagination-bullet { width: 14px; height: 14px; background: white; opacity: 0.3; margin: 0 8px !important; transition: all 0.4s; }
        .hero-swiper .swiper-pagination-bullet-active { background: white; opacity: 1; width: 40px; border-radius: 7px; }
        .hero-swiper .swiper-button-next, .hero-swiper .swiper-button-prev { color: white; opacity: 0.3; transform: scale(0.6); transition: all 0.3s; }
        .hero-swiper .swiper-button-next:hover, .hero-swiper .swiper-button-prev:hover { opacity: 0.8; transform: scale(0.8); }
        .hero-swiper .swiper-slide-active img { transform: scale(1.1); }
        @media (max-width: 1024px) { .hero-swiper .swiper-button-next, .hero-swiper .swiper-button-prev { display: none; } }
      `}</style>
    </section>
  );
};

export default HeroImage;
