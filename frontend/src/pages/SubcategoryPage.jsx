import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { motion, AnimatePresence } from "framer-motion";
import ProductItem from "../components/ProductItem";
import { FaFilter, FaTimes, FaSortAmountDown } from "react-icons/fa";

const SubcategoryPage = () => {
  const { subcategoryId } = useParams();
  const { backendUrl, currency } = useContext(ShopContext);
  const [subcategory, setSubcategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOption, setSortOption] = useState("featured");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 20000 });

  useEffect(() => {
    const fetchSubcategoryAndProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${backendUrl}/api/subcategories/${subcategoryId}?isActive=true&isDeleted=false`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.responseBody) {
          setSubcategory(data.responseBody.data);
          setProducts((data.responseBody.data.products || []).filter(p => p.isActive));
        } else {
          setError(data.message || "Failed to load subcategory");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (subcategoryId) fetchSubcategoryAndProducts();
  }, [subcategoryId, backendUrl]);

  const sortedProducts = [...products]
    .filter(p => (!inStock || p.inStock) && p.price >= priceRange.min && p.price <= priceRange.max)
    .sort((a, b) => {
      if (sortOption === "priceLow") return a.price - b.price;
      if (sortOption === "priceHigh") return b.price - a.price;
      if (sortOption === "nameAZ") return a.name.localeCompare(b.name);
      if (sortOption === "dateNew") return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-gray-400">Curating Products</p>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      {/* Cinematic Header */}
      <section className="bg-gray-50 pt-32 pb-20 px-4 md:px-12 border-b border-gray-100">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] text-gray-400 uppercase mb-4">
              <Link to="/" className="hover:text-black transition-colors">Home</Link>
              <span>/</span>
              <Link to="/collection" className="hover:text-black transition-colors">Shop</Link>
              <span>/</span>
              <span className="text-black">{subcategory?.name}</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-4 leading-[0.8]">{subcategory?.name}</h1>
            <p className="text-gray-400 font-medium italic max-w-xl">{subcategory?.description || "A masterfully curated selection of high-end fashion pieces for the discerning eye."}</p>
          </motion.div>

          <div className="flex flex-col items-end gap-4">
            <span className="text-[10px] font-black bg-black text-white px-4 py-1 rounded-full uppercase tracking-widest">{products.length} Items Found</span>
            <button
              onClick={() => setShowFilterPanel(true)}
              className="group flex items-center gap-4 bg-white border border-gray-200 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:border-black transition-all shadow-sm hover:shadow-xl"
            >
              <FaFilter className="group-hover:rotate-180 transition-transform duration-500" />
              Open Filter Desk
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid Section */}
      <main className="max-w-screen-2xl mx-auto px-4 md:px-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {sortedProducts.map((p, idx) => (
            <motion.div
              key={p.id || idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (idx % 4) * 0.1 }}
            >
              <ProductItem
                id={p.id || p._id}
                image={p.images?.map(img => img.url) || [p.mainImageUrl]}
                name={p.name}
                price={p.price}
                finalPrice={p.finalPrice}
                discountPrecentage={p.discountPrecentage}
              />
            </motion.div>
          ))}
        </div>

        {sortedProducts.length === 0 && (
          <div className="py-40 text-center rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="mb-6 opacity-20"><FaSortAmountDown size={40} className="mx-auto" /></div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-300">Null Set Matching Criteria</p>
            <button onClick={() => { setInStock(false); setPriceRange({ min: 0, max: 20000 }); }} className="mt-8 text-xs font-black underline hover:text-gray-500">Reset System</button>
          </div>
        )}
      </main>

      {/* Modern Filter Sidebar */}
      <AnimatePresence>
        {showFilterPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilterPanel(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[101] shadow-2xl p-12 flex flex-col"
            >
              <div className="flex justify-between items-center mb-16">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter">FILTERS</h2>
                  <div className="h-1 w-12 bg-black mt-2"></div>
                </div>
                <button onClick={() => setShowFilterPanel(false)} className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center hover:scale-110 transition-transform">
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-12 flex-1 custom-scrollbar overflow-y-auto pr-4">
                {/* Stock Section */}
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 font-bold">Inventory Status</h4>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="font-bold text-sm group-hover:tracking-widest transition-all">Available Only</span>
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={() => setInStock(!inStock)}
                      className="w-5 h-5 accent-black border-2 border-gray-200 rounded cursor-pointer"
                    />
                  </label>
                </section>

                {/* Price Section */}
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 font-bold">Price Ceiling</h4>
                    <span className="text-sm font-black">{currency}{priceRange.max}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20000"
                    step="500"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-gray-100 appearance-none cursor-ew-resize accent-black"
                  />
                  <div className="flex justify-between mt-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    <span>{currency}0</span>
                    <span>{currency}20,000</span>
                  </div>
                </section>

                {/* Sort Section */}
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 font-bold">Visual Ordering</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'featured', label: 'Curated Picks' },
                      { id: 'priceLow', label: 'Price: Low-High' },
                      { id: 'priceHigh', label: 'Price: High-Low' },
                      { id: 'nameAZ', label: 'Name: A-Z' },
                      { id: 'dateNew', label: 'Latest Drop' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setSortOption(opt.id)}
                        className={`text-left p-4 rounded-2xl text-xs font-bold transition-all ${sortOption === opt.id ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-black'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="pt-8 border-t space-y-4">
                <button onClick={() => setShowFilterPanel(false)} className="w-full py-5 bg-black text-white font-black uppercase text-xs tracking-widest rounded-[2rem] shadow-2xl hover:scale-[1.02] transition-transform">Confirm Refinement</button>
                <button
                  onClick={() => { setInStock(false); setPriceRange({ min: 0, max: 20000 }); setSortOption('featured'); }}
                  className="w-full text-xs font-black uppercase tracking-widest text-gray-300 hover:text-black"
                >Reset All</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubcategoryPage;
