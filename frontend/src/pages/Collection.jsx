import React, { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "../components/ProductItem";
import { Link, useParams } from "react-router-dom";
import TypeCollection from "../components/TypeCollection";
import { motion, AnimatePresence } from "framer-motion";

const Collection = () => {
    const { products, search, showSearch } = useContext(ShopContext);
    const [showFilter, setShowFilter] = useState(false);
    const [sortOption, setSortOption] = useState("featured");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [inStock, setInStock] = useState(false);

    const { type } = useParams();
    const normalize = str => str.toLowerCase().replace(/[\s-]+/g, '');
    const collectionType = type ? type : 'All Products';
    const displayName = collectionType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // If type is present, filter by it. Otherwise show all.
    let filteredProducts = type
        ? products.filter((item) => item.category && normalize(item.category) === normalize(collectionType))
        : products;

    // Apply Search Filter
    if (showSearch && search) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Apply filters
    if (inStock) {
        filteredProducts = filteredProducts.filter((item) => item.inStock);
    }
    if (minPrice) {
        filteredProducts = filteredProducts.filter((item) => Number(item.price) >= Number(minPrice));
    }
    if (maxPrice) {
        filteredProducts = filteredProducts.filter((item) => Number(item.price) <= Number(maxPrice));
    }

    // Apply sorting
    if (sortOption === "price-low-high") {
        filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-high-low") {
        filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
    } else if (sortOption === "az") {
        filteredProducts = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "za") {
        filteredProducts = [...filteredProducts].sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === "date-old-new") {
        filteredProducts = [...filteredProducts].sort((a, b) => a.date - b.date);
    } else if (sortOption === "date-new-old") {
        filteredProducts = [...filteredProducts].sort((a, b) => b.date - a.date);
    }

    return (
        <motion.div
            className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 text-[var(--text)]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
        >
            {/* Breadcrumbs */}
            <div className="text-xs text-[var(--text-muted)] mb-6 flex items-center gap-2">
                <Link to="/" className="hover:underline hover:text-[var(--accent)] transition-colors">Home</Link>
                <span>/</span>
                <Link to="/collection" className="hover:underline hover:text-[var(--accent)] transition-colors">Shop</Link>
                <span>/</span>
                <span className="text-[var(--text)] font-semibold">{displayName}</span>
            </div>

            {/* Display Categories First When Browsing General Collection */}
            {!type && (
                <div className="mb-14">
                    <TypeCollection />
                    <div className="border-b border-[var(--border)] my-12" />
                </div>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-center my-8 tracking-widest text-[var(--text)] uppercase">{displayName}</h1>

            {/* Filter/Sort Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 py-4 border-b border-[var(--border)]">
                <button
                    className="text-xs font-bold tracking-widest flex items-center gap-2 cursor-pointer bg-[var(--surface-raised)] border border-[var(--border)] px-4 py-2 rounded-xl text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                    onClick={() => setShowFilter(true)}
                >
                    {/* Tune SVG icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17h6m0 0v-2m0 2v2m6-6h6m0 0v-2m0 2v2M3 7h6m0 0V5m0 2v2m6 6h6m0 0v-2m0 2v2" /></svg>
                    FILTER AND SORT
                </button>
                <div className="flex items-center gap-6">
                    <select
                        className="text-xs font-semibold tracking-wider border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] rounded-xl px-3 py-2 outline-none cursor-pointer"
                        value={sortOption}
                        onChange={e => setSortOption(e.target.value)}
                    >
                        <option value="featured">FEATURED</option>
                        <option value="best-selling">BEST SELLING</option>
                        <option value="az">ALPHABETICALLY, A-Z</option>
                        <option value="za">ALPHABETICALLY, Z-A</option>
                        <option value="price-low-high">PRICE, LOW TO HIGH</option>
                        <option value="price-high-low">PRICE, HIGH TO LOW</option>
                        <option value="date-old-new">DATE, OLD TO NEW</option>
                        <option value="date-new-old">DATE, NEW TO OLD</option>
                    </select>
                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{filteredProducts.length} PRODUCTS</span>
                </div>
            </div>

            {/* Filter Sidebar/Modal */}
            <AnimatePresence>
                {showFilter && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setShowFilter(false)}
                            style={{ pointerEvents: 'auto' }}
                        />
                        {/* Sidebar */}
                        <motion.div
                            className="fixed top-0 left-0 h-full w-80 sm:w-96 bg-[var(--surface)] text-[var(--text)] border-r border-[var(--border)] p-6 sm:p-8 shadow-2xl z-50 flex flex-col justify-between"
                            initial={{ x: -380 }}
                            animate={{ x: 0 }}
                            exit={{ x: -380 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                        >
                            <div>
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                                    <h2 className="text-lg font-bold tracking-wider text-[var(--text)] uppercase">FILTER AND SORT</h2>
                                    <button className="text-2xl text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer" onClick={() => setShowFilter(false)}>×</button>
                                </div>
                                <div className="mb-6">
                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-sm font-semibold">
                                        <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="w-4 h-4 accent-[var(--accent)] cursor-pointer" />
                                        In Stock Only
                                    </label>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Price Range</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            className="border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] rounded-xl outline-none px-3 py-2 w-1/2 text-sm"
                                            value={minPrice}
                                            onChange={e => setMinPrice(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            className="border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] rounded-xl outline-none px-3 py-2 w-1/2 text-sm"
                                            value={maxPrice}
                                            onChange={e => setMaxPrice(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Sort By</label>
                                    <select
                                        className="w-full border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] rounded-xl outline-none px-3 py-2 text-sm cursor-pointer"
                                        value={sortOption}
                                        onChange={e => setSortOption(e.target.value)}
                                    >
                                        <option value="featured">FEATURED</option>
                                        <option value="best-selling">BEST SELLING</option>
                                        <option value="az">ALPHABETICALLY, A-Z</option>
                                        <option value="za">ALPHABETICALLY, Z-A</option>
                                        <option value="price-low-high">PRICE, LOW TO HIGH</option>
                                        <option value="price-high-low">PRICE, HIGH TO LOW</option>
                                        <option value="date-old-new">DATE, OLD TO NEW</option>
                                        <option value="date-new-old">DATE, NEW TO OLD</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-[var(--border)] gap-3">
                                <button className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer py-2 px-3" onClick={() => {
                                    setInStock(false);
                                    setMinPrice("");
                                    setMaxPrice("");
                                    setSortOption("featured");
                                }}>CLEAR</button>
                                <button className="bg-[var(--accent)] text-black font-extrabold px-6 py-2.5 text-xs rounded-xl tracking-wider uppercase cursor-pointer hover:opacity-90 shadow-md" onClick={() => setShowFilter(false)}>APPLY</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                        <ProductItem
                            key={product._id}
                            id={product._id}
                            name={product.name}
                            price={product.price}
                            finalPrice={product.finalPrice}
                            image={product.image}
                            discountPrecentage={product.discountPrecentage}
                            discountName={product.discountName}
                            quantity={product.quantity}
                        />
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center rounded-3xl border border-[var(--border)] bg-[var(--surface)]/50 p-8 my-6">
                        <p className="text-lg font-bold text-[var(--text)] mb-2">No products found</p>
                        <p className="text-xs text-[var(--text-muted)] mb-6">No products match your current search or filter criteria.</p>
                        <button
                            onClick={() => {
                                setInStock(false);
                                setMinPrice("");
                                setMaxPrice("");
                                setSortOption("featured");
                            }}
                            className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--accent)] text-black cursor-pointer hover:opacity-90"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}
            </div>

            {/* For specific category view, show TypeCollection at bottom for exploring other categories */}
            {type && (
                <div className="mt-20 pt-12 border-t border-[var(--border)]">
                    <TypeCollection />
                </div>
            )}
        </motion.div>
    );
};

export default Collection;
