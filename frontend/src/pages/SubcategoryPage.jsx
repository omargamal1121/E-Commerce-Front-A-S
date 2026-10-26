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
        const res = await fetch(`${backendUrl}/api/subcategories/${subcategoryId}?isActive=true&isDeleted=false`);
        const data = await res.json();
        if (res.ok && data.responseBody) {
          setSubcategory(data.responseBody.data);
          // Map products robustly. If data has products, use them. Don't restrict to isActive if it is set to false in the database for cached active subcategories, or allow them all.
          setProducts((data.responseBody.data.products || []));
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <div className="w-12 h-12 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin"></div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Curating Products</p>
    </div>
  );

  return (
    <div className="bg-[var(--bg)] text-[var(--text)] min-h-screen">
      {/* Cinematic Header */}
      <section className="bg-[var(--surface)] pt-28 sm:pt-36 pb-12 sm:pb-16 px-4 md:px-12 border-b border-[var(--border)] transition-colors">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase mb-3">
              <Link to="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
              <span>/</span>
              <Link to="/collection" className="hover:text-[var(--accent)] transition-colors">Shop</Link>
              <span>/</span>
              <span className="text-[var(--text)]">{subcategory?.name}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight uppercase mb-3 text-[var(--text)] leading-tight">
              {subcategory?.name}
            </h1>
            <p className="text-[var(--text-muted)] text-sm sm:text-base font-normal max-w-2xl leading-relaxed">
              {subcategory?.description || "A masterfully curated selection of high-end fashion pieces for the discerning eye."}
            </p>
          </motion.div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4">
            <span className="text-[11px] font-bold bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] px-4 py-1.5 rounded-full uppercase tracking-wider">
              {products.length} {products.length === 1 ? 'Item' : 'Items'} Found
            </span>
            <button
              onClick={() => setShowFilterPanel(true)}
              className="group flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all shadow-sm cursor-pointer"
            >
              <FaFilter className="group-hover:rotate-180 transition-transform duration-500 text-[var(--accent)]" />
              <span>Filters</span>
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
                image={p.images && p.images.length > 0 ? p.images.map(img => img.url) : [p.mainImageUrl]}
                name={p.name}
                price={p.price}
                finalPrice={p.finalPrice}
                discountPrecentage={p.discountPrecentage}
                quantity={p.quantity}
              />
            </motion.div>
          ))}
        </div>

        {sortedProducts.length === 0 && (
          <div className="py-24 sm:py-32 px-6 text-center rounded-3xl border border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
              <FaFilter size={22} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-2">
              No Products Found
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-8 leading-relaxed">
              We couldn't find any products in this subcategory matching your selected filters. Try adjusting your filters or browse our full catalog.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {(inStock || priceRange.max < 20000 || sortOption !== "featured") && (
                <button
                  onClick={() => {
                    setInStock(false);
                    setPriceRange({ min: 0, max: 20000 });
                    setSortOption("featured");
                  }}
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--accent)] text-black hover:opacity-90 transition-all shadow-md cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
              <Link
                to="/collection"
                className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all cursor-pointer"
              >
                Browse All Collections
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Modern Filter Sidebar */}
      <AnimatePresence>
        {showFilterPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilterPanel(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--surface)] text-[var(--text)] border-l border-[var(--border)] z-[101] shadow-2xl p-8 sm:p-12 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10 pb-4 border-b border-[var(--border)]">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase text-[var(--text)]">FILTERS</h2>
                  <div className="h-1 w-10 bg-[var(--accent)] mt-2 rounded-full"></div>
                </div>
                <button
                  onClick={() => setShowFilterPanel(false)}
                  className="h-10 w-10 rounded-full bg-[var(--surface-raised)] text-[var(--text)] flex items-center justify-center hover:text-[var(--accent)] hover:scale-105 transition-all cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-10 flex-1 custom-scrollbar overflow-y-auto pr-2">
                {/* Stock Section */}
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-4">Inventory Status</h4>
                  <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--accent)] transition-all">
                    <span className="font-semibold text-sm text-[var(--text)]">In Stock Only</span>
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={() => setInStock(!inStock)}
                      className="w-5 h-5 accent-[var(--accent)] rounded cursor-pointer"
                    />
                  </label>
                </section>

                {/* Price Section */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Price Ceiling</h4>
                    <span className="text-sm font-bold text-[var(--accent)]">{currency}{priceRange.max}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20000"
                    step="500"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-[var(--surface-raised)] rounded-lg appearance-none cursor-ew-resize accent-[var(--accent)]"
                  />
                  <div className="flex justify-between mt-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    <span>{currency}0</span>
                    <span>{currency}20,000</span>
                  </div>
                </section>

                {/* Sort Section */}
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-4">Visual Ordering</h4>
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
                        className={`text-left p-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          sortOption === opt.id
                            ? 'bg-[var(--accent)] text-black shadow-md font-extrabold'
                            : 'bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]/80'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="pt-6 border-t border-[var(--border)] space-y-3">
                <button
                  onClick={() => setShowFilterPanel(false)}
                  className="w-full py-4 bg-[var(--accent)] text-black font-extrabold uppercase text-xs tracking-widest rounded-xl shadow-lg hover:opacity-90 transition-all cursor-pointer"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => { setInStock(false); setPriceRange({ min: 0, max: 20000 }); setSortOption('featured'); }}
                  className="w-full py-2.5 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                >
                  Reset All
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubcategoryPage;
