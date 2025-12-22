import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { motion } from "framer-motion";
import Title from "../components/Title";
import ProductCard from "../components/ProductCard";
import { FaChevronDown, FaTimes } from "react-icons/fa";

const SubcategoryPage = () => {
  const { subcategoryId } = useParams();
  const { backendUrl } = useContext(ShopContext);
  const [subcategory, setSubcategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOption, setSortOption] = useState("featured");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [inStock, setInStock] = useState(false);

  useEffect(() => {
    const fetchSubcategoryAndProducts = async () => {
      try {
        setLoading(true);
        setError("");

        // جلب بيانات الـ Subcategory
        const subcategoryResponse = await fetch(
          `${backendUrl}/api/subcategories/${subcategoryId}?isActive=true&isDeleted=false`
        );
        const subcategoryData = await subcategoryResponse.json();

        if (subcategoryResponse.ok && subcategoryData.responseBody) {
          setSubcategory(subcategoryData.responseBody.data);

          // Get products from subcategory response
          if (subcategoryData.responseBody.data.products) {
            setProducts(subcategoryData.responseBody.data.products.filter(product => product.isActive));
          } else {
            setProducts([]);
          }
        } else {
          setError(subcategoryData.message || "Failed to load subcategory");
        }
      } catch (err) {
        console.error("Error fetching subcategory and products:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (subcategoryId) {
      fetchSubcategoryAndProducts();
    }
  }, [subcategoryId, backendUrl]);

  // Filter and sort products based on selected options
  const filteredAndSortedProducts = [...products]
    .filter((product) => {
      // Apply in-stock filter if enabled
      if (inStock && !product.inStock) {
        return false;
      }

      // Apply price range filter
      if (product.price < priceRange.min || product.price > priceRange.max) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "priceLow":
          return a.price - b.price;
        case "priceHigh":
          return b.price - a.price;
        case "nameAZ":
          return a.name.localeCompare(b.name);
        case "nameZA":
          return b.name.localeCompare(a.name);
        case "dateOld":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "dateNew":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "bestSelling":
          // Assuming there's a sales or popularity field, fallback to featured if not
          return (b.sales || 0) - (a.sales || 0);
        default:
          return 0; // featured
      }
    });

  // For display in the UI
  const sortedProducts = filteredAndSortedProducts;

  return (
    <motion.div
      className="max-w-screen-2xl mx-auto px-4 py-8 mt-25"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 60 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: "easeOut" },
        },
      }}
    >
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-600 p-4 bg-red-100 rounded-md">
          {error}
        </div>
      ) : subcategory ? (
        <>
          {/* Breadcrumb */}
          <div className="text-sm text-gray-600 mb-6">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link to="/collection" className="hover:underline">
              Shop
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-900">
              {subcategory?.name}
            </span>
          </div>

          {/* Subcategory Header with Name and Description */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-wide mb-4 uppercase">
              {subcategory.name}
            </h1>
            <p className="text-gray-600 max-w-3xl mx-auto">
              {subcategory.description ||
                "Explore our collection of products in this subcategory."}
            </p>
          </div>

          {/* Filter and Sort Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-t border-b border-gray-300 py-4">
            <div className="flex items-center mb-4 md:mb-0">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="flex items-center gap-2 border border-gray-300 rounded px-4 py-2 hover:bg-gray-100"
              >
                <span>FILTER AND SORT</span>
                <FaChevronDown size={12} />
              </button>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto">
              <p className="text-gray-600 mr-4">
                {sortedProducts.length} Products
              </p>

              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 border border-gray-300 rounded px-4 py-2 hover:bg-gray-100"
                >
                  <span>FEATURED</span>
                  <FaChevronDown size={12} />
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setSortOption("featured");
                          setShowSortDropdown(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${sortOption === "featured" ? "bg-gray-100" : ""}`}
                      >
                        FEATURED
                      </button>
                      <button
                        onClick={() => {
                          setSortOption("bestSelling");
                          setShowSortDropdown(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${sortOption === "bestSelling" ? "bg-gray-100" : ""}`}
                      >
                        BEST SELLING
                      </button>
                      <button
                        onClick={() => {
                          setSortOption("nameAZ");
                          setShowSortDropdown(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${sortOption === "nameAZ" ? "bg-gray-100" : ""}`}
                      >
                        ALPHABETICALLY, A-Z
                      </button>
                      <button
                        onClick={() => {
                          setSortOption("nameZA");
                          setShowSortDropdown(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${sortOption === "nameZA" ? "bg-gray-100" : ""}`}
                      >
                        ALPHABETICALLY, Z-A
                      </button>
                      <button
                        onClick={() => {
                          setSortOption("priceLow");
                          setShowSortDropdown(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${sortOption === "priceLow" ? "bg-gray-100" : ""}`}
                      >
                        PRICE, LOW TO HIGH
                      </button>
                      <button
                        onClick={() => {
                          setSortOption("priceHigh");
                          setShowSortDropdown(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${sortOption === "priceHigh" ? "bg-gray-100" : ""}`}
                      >
                        PRICE, HIGH TO LOW
                      </button>
                      <button
                        onClick={() => {
                          setSortOption("dateOld");
                          setShowSortDropdown(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${sortOption === "dateOld" ? "bg-gray-100" : ""}`}
                      >
                        DATE, OLD TO NEW
                      </button>
                      <button
                        onClick={() => {
                          setSortOption("dateNew");
                          setShowSortDropdown(false);
                        }}
                        className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${sortOption === "dateNew" ? "bg-gray-100" : ""}`}
                      >
                        DATE, NEW TO OLD
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex justify-center items-start pt-20">
              <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium">FILTER AND SORT</h2>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {sortedProducts.length} PRODUCTS
                </p>

                {/* Availability Filter */}
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-3">AVAILABILITY</h3>
                  <label
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setInStock(!inStock)}
                  >
                    <div
                      className={`w-10 h-6 rounded-full p-1 ${inStock ? "bg-green-500" : "bg-gray-300"} transition-colors duration-300 ease-in-out`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${inStock ? "translate-x-4" : ""}`}
                      ></div>
                    </div>
                    <span>In stock</span>
                  </label>
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-3">PRICE</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    The highest price is LE 10000.00
                  </p>

                  <input
                    type="range"
                    min="0"
                    max="2000"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange({
                        ...priceRange,
                        max: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />

                  <div className="flex gap-4 mt-4">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">
                        Min
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          LE
                        </span>
                        <input
                          type="number"
                          value={priceRange.min}
                          onChange={(e) =>
                            setPriceRange({
                              ...priceRange,
                              min: parseInt(e.target.value),
                            })
                          }
                          className="w-full border rounded py-2 pl-8 pr-2"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">
                        Max
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          LE
                        </span>
                        <input
                          type="number"
                          value={priceRange.max}
                          onChange={(e) =>
                            setPriceRange({
                              ...priceRange,
                              max: parseInt(e.target.value),
                            })
                          }
                          className="w-full border rounded py-2 pl-8 pr-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sort By */}
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-3">SORT BY</h3>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full border rounded p-2"
                  >
                    <option value="featured">Featured</option>
                    <option value="bestSelling">Best Selling</option>
                    <option value="nameAZ">Alphabetically, A-Z</option>
                    <option value="nameZA">Alphabetically, Z-A</option>
                    <option value="priceLow">Price, Low to High</option>
                    <option value="priceHigh">Price, High to Low</option>
                    <option value="dateOld">Date, Old to New</option>
                    <option value="dateNew">Date, New to Old</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setPriceRange({ min: 0, max: 2000 });
                      setInStock(false);
                      setSortOption("featured");
                    }}
                    className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    CLEAR
                  </button>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="flex-1 py-2 bg-black text-white rounded hover:bg-gray-800"
                  >
                    APPLY
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* عرض المنتجات */}
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 my-8">
              No products available in this subcategory.
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500">Subcategory not found.</div>
      )}
    </motion.div>
  );
};

export default SubcategoryPage;
