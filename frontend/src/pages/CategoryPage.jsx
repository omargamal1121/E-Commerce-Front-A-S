import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { motion } from "framer-motion";
import Title from "../components/Title";
import { FaChevronDown, FaTimes } from "react-icons/fa";

const CategoryPage = () => {
  const { categoryId } = useParams();
  const { backendUrl } = useContext(ShopContext);
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOption, setSortOption] = useState("featured");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });
  const [inStock, setInStock] = useState(false);

  useEffect(() => {
    const fetchCategoryAndSubcategories = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch category details
        const response = await fetch(
          `${backendUrl}/api/categories/${categoryId}?isActive=true&includeDeleted=false`
        );
        const data = await response.json();

        if (response.ok && data.responseBody) {
          setCategory(data.responseBody.data);

          // Get subcategories from category response
          if (data.responseBody.data.subCategories) {
            setSubcategories(data.responseBody.data.subCategories.filter(sub => sub.isActive));
          } else {
            setSubcategories([]);
          }
        } else {
          setError(data.message || "Failed to load category");
        }
      } catch (err) {
        console.error("Error fetching category:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategoryAndSubcategories();
    }
  }, [categoryId, backendUrl]);

  // Filter and sort subcategories based on selected options
  const filteredAndSortedSubcategories = [...subcategories]
    .filter((subcat) => {
      // Apply in-stock filter if enabled
      if (inStock) {
        return subcat.inStock === true;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "nameAZ":
          return a.name.localeCompare(b.name);
        case "nameZA":
          return b.name.localeCompare(a.name);
        case "dateOld":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "dateNew":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "bestSelling":
          // Assuming there's a popularity field, fallback to featured if not
          return (b.popularity || 0) - (a.popularity || 0);
        default:
          return 0; // featured
      }
    });

  // For display in the UI
  const sortedSubcategories = filteredAndSortedSubcategories;

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
      ) : category ? (
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
            <span className="font-medium text-gray-900">{category?.name}</span>
          </div>
          {/* Category Header with Name and Description */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-wide mb-4 uppercase">
              {category.name}
            </h1>
            <p className="text-gray-600 max-w-3xl mx-auto">
              {category.description ||
                "Explore our collection of subcategories in this category."}
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
                {sortedSubcategories.length} Subcategories
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
                  {sortedSubcategories.length} SUBCATEGORIES
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
                    <option value="dateOld">Date, Old to New</option>
                    <option value="dateNew">Date, New to Old</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
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
          {sortedSubcategories.length > 0 ? (
            <div className="mb-12">
              <h2 className="text-2xl font-medium mb-4">SUBCATEGORIES</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sortedSubcategories.map((subcategory) => (
                  <Link
                    key={subcategory.id}
                    to={`/subcategory/${subcategory.id}`}
                    className="block border border-gray-200 rounded-lg hover:shadow-lg transition-all"
                  >
                    <div className="overflow-hidden rounded-t-lg h-100 bg-gray-100 flex items-center justify-center">
                      {subcategory.images && subcategory.images.length > 0 ? (
                        <img
                          src={subcategory.images[0].url}
                          alt={subcategory.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400">No Image</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-lg">
                        {subcategory.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {subcategory.description || "View products"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 my-8">
              No subcategories available for this category.
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500">Category not found.</div>
      )}
    </motion.div>
  );
};

export default CategoryPage;
