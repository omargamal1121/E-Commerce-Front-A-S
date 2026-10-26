import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaFilter, FaTimes } from "react-icons/fa";

const SubcategoryCard = ({ sub, itemVariants }) => {
  const images = Array.isArray(sub.images) && sub.images.length > 0
    ? sub.images.map((img) => (typeof img === "string" ? img : img.url)).filter(Boolean)
    : [];
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
    <motion.div variants={itemVariants} className="group">
      <Link
        to={`/subcategory/${sub.id}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="block relative bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] rounded-3xl overflow-hidden transition-all shadow-sm hover:shadow-xl cursor-pointer"
      >
        <div className="aspect-[3/4] overflow-hidden bg-[var(--surface-raised)] relative">
          {images.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIdx}
                src={images[currentIdx]}
                initial={{ opacity: 0.8, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.8, scale: 1.05 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full h-full object-cover"
                alt={sub.name}
              />
            </AnimatePresence>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-[var(--text-muted)]">
              NO VISUAL
            </div>
          )}

          {/* Progress dots for multiple images like ProductItem */}
          {images.length > 1 && isHovered && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 z-10 px-3">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    idx === currentIdx ? "bg-[var(--accent)]" : "bg-white/60 backdrop-blur-sm"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500"></div>
          <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            <button className="w-full py-3 bg-[var(--accent)] text-black font-extrabold text-[10px] uppercase tracking-widest rounded-2xl shadow-2xl cursor-pointer">
              Explore Subcategory
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-base font-bold tracking-tight text-[var(--text)] group-hover:text-[var(--accent)] transition-colors leading-tight">
              {sub.name}
            </h3>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
              Subcategory
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-medium line-clamp-1">
            {sub.description || "Discover high-end curated items"}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

const CategoryPage = () => {
  const { categoryId } = useParams();
  const { backendUrl } = useContext(ShopContext);
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOption, setSortOption] = useState("featured");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    const fetchCategoryAndSubcategories = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${backendUrl}/api/categories/${categoryId}?isActive=true&includeDeleted=false`);
        const data = await response.json();

        if (response.ok && data.responseBody) {
          setCategory(data.responseBody.data);
          if (data.responseBody.data.subCategories) {
            setSubcategories(data.responseBody.data.subCategories.filter(sub => sub.isActive));
          } else {
            setSubcategories([]);
          }
        } else {
          setError(data.message || "Failed to load category");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) fetchCategoryAndSubcategories();
  }, [categoryId, backendUrl]);

  // Extract all category images
  const categoryImages = Array.isArray(category?.images) && category.images.length > 0
    ? category.images.map((img) => (typeof img === "string" ? img : img.url)).filter(Boolean)
    : [];

  // Auto-cycle hero images if category has multiple images
  useEffect(() => {
    if (categoryImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % categoryImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [categoryImages.length]);

  const sortedSubcategories = [...subcategories]
    .filter(sub => !inStock || sub.inStock)
    .sort((a, b) => {
      if (sortOption === "nameAZ") return a.name.localeCompare(b.name);
      if (sortOption === "nameZA") return b.name.localeCompare(a.name);
      if (sortOption === "dateNew") return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <div className="w-12 h-12 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin"></div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Loading Collection</p>
    </div>
  );

  return (
    <div className="bg-[var(--bg)] text-[var(--text)] min-h-screen">
      {/* Dynamic Luxury Hero Slider */}
      <section className="relative h-[40vh] md:h-[55vh] overflow-hidden flex items-center justify-center mt-16 group">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentHeroIndex}
              src={
                categoryImages[currentHeroIndex] ||
                "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=2000"
              }
              initial={{ opacity: 0.5, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.5, scale: 1.02 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full h-full object-cover absolute inset-0"
              alt={category?.name || "Category banner"}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/40 to-black/30 backdrop-blur-[1px]"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          <span className="text-[var(--accent)] text-xs font-black uppercase tracking-[0.5em] mb-3 block">
            Store Directory
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase mb-4 drop-shadow-2xl">
            {category?.name}
          </h1>
          <div className="w-16 h-1 bg-[var(--accent)] mx-auto shadow-2xl rounded-full mb-4"></div>
          {category?.description && (
            <p className="text-white/80 text-sm max-w-xl mx-auto font-medium leading-relaxed drop-shadow-md">
              {category.description}
            </p>
          )}

          {/* Dots Indicator for multiple category hero images */}
          {categoryImages.length > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              {categoryImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentHeroIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentHeroIndex ? "w-8 bg-[var(--accent)]" : "w-2 bg-white/50 hover:bg-white"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </section>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 py-12">
        {/* Navigation / Filter Bar */}
        <div className="sticky top-20 z-30 bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] py-4 flex flex-col md:flex-row justify-between items-center gap-6 mb-12 rounded-2xl px-6 shadow-md">
          <div className="flex items-center gap-3 text-xs font-bold text-[var(--text-muted)]">
            <Link to="/" className="hover:text-[var(--accent)] transition-colors">
              HOME
            </Link>
            <span>/</span>
            <Link to="/collection" className="hover:text-[var(--accent)] transition-colors">
              SHOP
            </Link>
            <span>/</span>
            <span className="text-[var(--text)]">{category?.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilterPanel(true)}
              className="flex items-center gap-3 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-md cursor-pointer"
            >
              <FaFilter className="text-[var(--accent)]" /> Customize View
            </button>
          </div>
        </div>

        {/* Subcategories Grid */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)] uppercase">
              Subcategories ({sortedSubcategories.length})
            </h2>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12"
          >
            {sortedSubcategories.map((sub) => (
              <SubcategoryCard key={sub.id} sub={sub} itemVariants={itemVariants} />
            ))}
          </motion.div>

          {sortedSubcategories.length === 0 && (
            <div className="py-24 text-center border border-[var(--border)] bg-[var(--surface)]/50 rounded-3xl max-w-xl mx-auto my-12 p-8">
              <p className="text-base font-bold text-[var(--text)] mb-2">No Subcategories Found</p>
              <p className="text-xs text-[var(--text-muted)] mb-6">
                There are currently no subcategories available for this category.
              </p>
              <Link
                to="/collection"
                className="inline-block px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--accent)] text-black"
              >
                Explore All Collections
              </Link>
            </div>
          )}
        </div>

        {/* Category Image Gallery (if category has multiple showcase images) */}
        {categoryImages.length > 1 && (
          <div className="mt-16 pt-12 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                  Visual Showcase
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-[var(--text)] uppercase mt-1">
                  {category?.name} Gallery
                </h3>
              </div>
              <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                {categoryImages.length} Images
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {categoryImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentHeroIndex(idx);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`aspect-[3/4] rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-md group relative ${
                    idx === currentHeroIndex
                      ? "border-[var(--accent)] ring-2 ring-[var(--accent)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${category?.name} showcase ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-end p-3">
                    <span className="text-[10px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      View as Banner
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Luxury Filter Sidebar Overlay */}
      <AnimatePresence>
        {showFilterPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterPanel(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[101] shadow-2xl p-12 flex flex-col"
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-3xl font-black tracking-tighter">REFINE VIEW</h2>
                <button onClick={() => setShowFilterPanel(false)} className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center hover:scale-110 transition-transform">
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-10 flex-1">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Stock Availability</h4>
                  <button
                    onClick={() => setInStock(!inStock)}
                    className={`flex items-center gap-4 w-full p-4 rounded-2xl border transition-all ${inStock ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-500'}`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${inStock ? 'border-white' : 'border-gray-300'}`}>
                      {inStock && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                    </div>
                    <span className="font-bold text-sm">Strictly In-Stock Only</span>
                  </button>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Sort Arrangement</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'featured', label: 'Featured Suggestions' },
                      { id: 'nameAZ', label: 'Alphabetical (A-Z)' },
                      { id: 'nameZA', label: 'Alphabetical (Z-A)' },
                      { id: 'dateNew', label: 'Latest Arrivals' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setSortOption(opt.id)}
                        className={`w-full text-left p-4 rounded-2xl font-bold text-sm transition-all ${sortOption === opt.id ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-black'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t space-y-3">
                <button onClick={() => setShowFilterPanel(false)} className="w-full py-5 bg-black text-white font-black uppercase text-xs tracking-widest rounded-3xl shadow-2xl">Apply Customization</button>
                <button
                  onClick={() => { setInStock(false); setSortOption('featured'); }}
                  className="w-full py-4 text-xs font-black uppercase tracking-widest text-gray-300 hover:text-black transition-colors"
                >Reset Filters</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryPage;
