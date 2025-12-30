import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { motion, AnimatePresence } from "framer-motion";
import Title from "../components/Title";
import { FaChevronDown, FaTimes, FaFilter, FaThLarge, FaList } from "react-icons/fa";

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

  useEffect(() => {
    const fetchCategoryAndSubcategories = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${backendUrl}/api/categories/${categoryId}?isActive=true&includeDeleted=false`, { credentials: 'include' });
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
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-gray-400">Loading Collection</p>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      {/* Dynamic Luxury Hero */}
      <section className="relative h-[40vh] md:h-[60vh] overflow-hidden flex items-center justify-center mt-16 group">
        <div className="absolute inset-0 z-0">
          <img
            src={category?.images?.[0]?.url || "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=2000"}
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-10000 ease-out"
            alt={category?.name}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center px-4"
        >
          <span className="text-white/60 text-xs font-black uppercase tracking-[0.5em] mb-4 block">Store Directory</span>
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase mb-6 drop-shadow-2xl">{category?.name}</h1>
          <div className="w-20 h-1 bg-white mx-auto shadow-2xl"></div>
        </motion.div>
      </section>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 py-12">
        {/* Navigation / Filter Bar */}
        <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 flex flex-col md:flex-row justify-between items-center gap-6 mb-12 rounded-2xl px-6 shadow-sm">
          <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
            <Link to="/" className="hover:text-black">HOME</Link>
            <span>/</span>
            <Link to="/collection" className="hover:text-black">SHOP</Link>
            <span>/</span>
            <span className="text-black">{category?.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilterPanel(true)}
              className="flex items-center gap-3 bg-black text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
            >
              <FaFilter /> Customize View
            </button>
            <div className="hidden md:flex items-center bg-gray-100 p-1 rounded-full text-gray-400">
              <button className="p-2 rounded-full hover:bg-white hover:text-black transition-all"><FaThLarge size={12} /></button>
              <button className="p-2 rounded-full transition-all text-black bg-white shadow-sm"><FaList size={12} /></button>
            </div>
          </div>
        </div>

        {/* Subcategories Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12"
        >
          {sortedSubcategories.map((sub) => (
            <motion.div key={sub.id} variants={itemVariants} className="group">
              <Link to={`/subcategory/${sub.id}`} className="block relative">
                <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-gray-50 relative">
                  {sub.images?.[0] ? (
                    <img
                      src={sub.images[0].url}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt={sub.name}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-gray-300">NO VISUAL</div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500"></div>
                  <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <button className="w-full py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-2xl">
                      Explore Sub-Selection
                    </button>
                  </div>
                </div>

                <div className="mt-6 px-2">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-black tracking-tighter text-gray-900 leading-none">{sub.name}</h3>
                    <span className="text-[10px] font-bold text-gray-300 uppercase">Featured</span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium line-clamp-1 italic">{sub.description || "Discover high-end curated items"}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {sortedSubcategories.length === 0 && (
          <div className="py-32 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
            <p className="text-xs font-black uppercase tracking-[0.5em] text-gray-300">Collection Empty</p>
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
