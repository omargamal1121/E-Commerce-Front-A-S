import React, { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "../components/ProductItem";
import { Link } from "react-router-dom";
import TypeCollection from "../components/TypeCollection";
import { AnimatePresence } from "framer-motion";

const DenimCollection = () => {
  const { products } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [sortOption, setSortOption] = useState("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);

  // Filter only denim products
  let denimProducts = products.filter(
    (item) => item.category && item.category.toLowerCase() === "denim"
  );

  // Apply filters
  if (inStock) {
    denimProducts = denimProducts.filter((item) => item.inStock);
  }
  if (minPrice) {
    denimProducts = denimProducts.filter((item) => Number(item.price) >= Number(minPrice));
  }
  if (maxPrice) {
    denimProducts = denimProducts.filter((item) => Number(item.price) <= Number(maxPrice));
  }

  // Apply sorting
  if (sortOption === "price-low-high") {
    denimProducts = [...denimProducts].sort((a, b) => a.price - b.price);
  } else if (sortOption === "price-high-low") {
    denimProducts = [...denimProducts].sort((a, b) => b.price - a.price);
  } else if (sortOption === "az") {
    denimProducts = [...denimProducts].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOption === "za") {
    denimProducts = [...denimProducts].sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortOption === "date-old-new") {
    denimProducts = [...denimProducts].sort((a, b) => a.date - b.date);
  } else if (sortOption === "date-new-old") {
    denimProducts = [...denimProducts].sort((a, b) => b.date - a.date);
  }

  return (
    <motion.div
      className="max-w-screen-2xl mx-auto px-4 py-8 mt-20"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {/* Breadcrumbs */}
      <div className="text-xs text-gray-500 mb-4 flex gap-2">
        <Link to="/" className="hover:underline">Home</Link> /
        <Link to="/collection" className="hover:underline">Shop</Link> /
        <span className="text-black">Denim</span>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold text-center my-20 tracking-widest">DENIM</h1>


      {/* Filter/Sort Row */}
      <div className="flex justify-between items-center mb-8">
        <button
          className="text-xs font-semibold tracking-widest flex items-center gap-2 cursor-pointer"
          onClick={() => setShowFilter(true)}
        >
          {/* Tune SVG icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17h6m0 0v-2m0 2v2m6-6h6m0 0v-2m0 2v2M3 7h6m0 0V5m0 2v2m6 6h6m0 0v-2m0 2v2" /></svg>
          FILTER AND SORT
        </button>
        <div className="flex items-center gap-8">
          <select
            className="text-xs w-[180px] font-semibold tracking-widest border-none outline-none bg-transparent cursor-pointer"
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
          <span className="text-xs text-gray-500">{denimProducts.length} PRODUCTS</span>
        </div>
      </div>

      {/* Filter Sidebar/Modal */}
      <AnimatePresence>
        {showFilter && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setShowFilter(false)}
              style={{ pointerEvents: 'auto' }}
            />
            {/* Sidebar */}
            <motion.div
              className="fixed top-0 left-0 h-full w-100 bg-white p-6 shadow-lg z-50"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -380 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            >
              <button className="absolute top-4 right-4 text-xl" onClick={() => setShowFilter(false)}>×</button>
              <h2 className="text-lg font-bold mb-4">FILTER AND SORT</h2>
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} />
                  Availability (In stock)
                </label>
              </div>
              <div className="mb-4">
                <label className="block mb-1">Price</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="border border-gray-200 outline-none px-2 py-1 w-1/2"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="border border-gray-200 outline-none px-2 py-1 w-1/2" 
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-1">Sort By</label>
                <select
                  className="w-full border border-gray-200 outline-none px-2 py-1"
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
              <div className="flex justify-between mt-8">
                <button className="text-xs cursor-pointer" onClick={() => {
                  setInStock(false);
                  setMinPrice("");
                  setMaxPrice("");
                  setSortOption("featured");
                }}>CLEAR</button>
                <button className="bg-black text-white px-4 py-2 text-xs cursor-pointer" onClick={() => setShowFilter(false)}>APPLY</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {denimProducts.length > 0 ? (
          denimProducts.map(product => (
            <ProductItem
              key={product._id}
              id={product._id}
              name={product.name}
              price={product.price}
              finalPrice={product.finalPrice}
              image={product.image}
              discountPrecentage={product.discountPrecentage}
              discountName={product.discountName}
            />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-400">No denim products found.</p>
        )}
      </div>

      {/* Type Collection Row */}
      <div className="mt-12">
        <TypeCollection />
        <div className='border-2 border-gray-200 mt-20' />
        <div className='border-2 border-gray-200 mt-20' />
      </div>
    </motion.div>
  );
};

export default DenimCollection;