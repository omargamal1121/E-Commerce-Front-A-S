import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import ProductCard from "../components/ProductCard";
import { FaChevronDown, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import axios from "axios";
import HeroImage from "../components/HeroImage";
// testing 
const CollectionProducts = () => {
  const { t } = useTranslation();
  const { collectionId } = useParams();
  const { backendUrl } = useContext(ShopContext);
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOption, setSortOption] = useState("featured");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [inStock, setInStock] = useState(false);

  // Get token from context or localStorage
  const { token } = useContext(ShopContext);

  useEffect(() => {
    const fetchCollectionAndProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const authToken = localStorage.getItem("token");

        const baseHeaders = { "Content-Type": "application/json", Accept: "text/plain" };
        const authHeaders = authToken
          ? { ...baseHeaders, Authorization: `Bearer ${authToken}` }
          : baseHeaders;

        // ---- Fetch collection ----
        // Try unauthenticated first for public access; if 401 retry with token
        let collectionResponse;
        try {
          collectionResponse = await axios.get(
            `${backendUrl}/api/Collection/${collectionId}`,
            { headers: baseHeaders }
          );
        } catch (e) {
          if (e.response && e.response.status === 401 && authToken) {
            collectionResponse = await axios.get(
              `${backendUrl}/api/Collection/${collectionId}`,
              { headers: authHeaders }
            );
          } else {
            throw e;
          }
        }

        if (!collectionResponse.data?.responseBody?.data) {
          setError("Collection not found.");
          return;
        }

        setCollection(collectionResponse.data.responseBody.data);

        // ---- Fetch products ----
        try {
          console.log(`Fetching products for collection ${collectionId} from: ${backendUrl}/api/Collection/${collectionId}/products`);
          // Products: try unauthenticated first, then retry with auth on 401
          let productsResponse;
          try {
            productsResponse = await axios.get(
              `${backendUrl}/api/Collection/${collectionId}/products`,
              { headers: baseHeaders }
            );
            console.log("Products response (unauthenticated):", productsResponse.data);
          } catch (errFirst) {
            console.log("Unauthenticated request failed:", errFirst.response?.status, errFirst.response?.data);
            if (errFirst.response && errFirst.response.status === 401 && authToken) {
              console.log("Retrying with authentication...");
              productsResponse = await axios.get(
                `${backendUrl}/api/Collection/${collectionId}/products`,
                { headers: authHeaders }
              );
              console.log("Products response (authenticated):", productsResponse.data);
            } else {
              throw errFirst;
            }
          }

          console.log("Full products response structure:", productsResponse.data);
          console.log("Response body data:", productsResponse.data?.responseBody?.data);

          if (productsResponse.data?.responseBody?.data) {
            console.log("Setting products:", productsResponse.data.responseBody.data);
            setProducts(productsResponse.data.responseBody.data);
          } else if (productsResponse.data?.data) {
            // Alternative response structure
            console.log("Using alternative data structure:", productsResponse.data.data);
            setProducts(productsResponse.data.data);
          } else if (Array.isArray(productsResponse.data)) {
            // Direct array response
            console.log("Using direct array response:", productsResponse.data);
            setProducts(productsResponse.data);
          } else {
            console.log("No products found in response, setting empty array");
            setProducts([]);
          }
        } catch (productErr) {
          console.error("Product fetch error:", productErr);
          console.error("Error response:", productErr.response?.data);
          if (productErr.response) {
            // Error from server with status
            if (productErr.response.status === 401) {
              setError("You must be logged in to view these products.");
            } else if (productErr.response.status === 403) {
              setError("You do not have permission to view these products.");
            } else if (productErr.response.status === 404) {
              setError("Products not found for this collection.");
            } else {
              setError(`Failed to load products (${productErr.response.status}): ${productErr.response.data?.message || 'Please try again later.'}`);
            }
          } else {
            // Network / unexpected error
            setError("Network error while fetching products.");
          }
          setProducts([]);
        }
      } catch (err) {
        if (err.response) {
          if (err.response.status === 401) {
            setError("Unauthorized. Please log in again.");
          } else if (err.response.status === 403) {
            setError("You are not allowed to view this collection.");
          } else if (err.response.status === 404) {
            setError("Collection not found.");
          } else {
            setError("An unexpected server error occurred.");
          }
        } else {
          setError("Network error while fetching collection.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (collectionId) {
      fetchCollectionAndProducts();
    }
  }, [collectionId, backendUrl, token]);

  console.log("Current products state:", products);

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      // Price filter
      const price = parseFloat(product.price) || 0;
      const inPriceRange = price >= priceRange.min && price <= priceRange.max;

      // Stock filter
      const hasStock = !inStock || product.availableQuantity > 0;

      return inPriceRange && hasStock;
    })
    .sort((a, b) => {
      // Sort products
      switch (sortOption) {
        case "price-low-high":
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        case "price-high-low":
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "featured":
        default:
          return 0; // Keep original order
      }
    });

  console.log("Filtered products:", filteredProducts);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{t("ERROR")}</h2>
          <p className="text-gray-700">{error}</p>
          <Link
            to="/"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            {t("BACK_TO_HOME")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <HeroImage height={60}/>
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        {/* Collection Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-wide my-5 uppercase">
            {collection?.name}
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            {collection?.description ||
              "Explore our collection of products in this subcategory."}
          </p>
        </div>


        {/* Filter and Sort Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center my-6 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <span>{t("FILTER")}</span>
              <FaChevronDown
                className={`transition-transform ${showFilterPanel ? "rotate-180" : ""}`}
              />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span>{t("SORT_BY")}</span>
                <FaChevronDown
                  className={`transition-transform ${showSortDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showSortDropdown && (
                <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                  <ul className="py-1">
                    <li
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortOption === "featured" ? "bg-gray-100" : ""}`}
                      onClick={() => {
                        setSortOption("featured");
                        setShowSortDropdown(false);
                      }}
                    >
                      {t("FEATURED")}
                    </li>
                    <li
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortOption === "price-low-high" ? "bg-gray-100" : ""}`}
                      onClick={() => {
                        setSortOption("price-low-high");
                        setShowSortDropdown(false);
                      }}
                    >
                      {t("PRICE_LOW_TO_HIGH")}
                    </li>
                    <li
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortOption === "price-high-low" ? "bg-gray-100" : ""}`}
                      onClick={() => {
                        setSortOption("price-high-low");
                        setShowSortDropdown(false);
                      }}
                    >
                      {t("PRICE_HIGH_TO_LOW")}
                    </li>
                    <li
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortOption === "newest" ? "bg-gray-100" : ""}`}
                      onClick={() => {
                        setSortOption("newest");
                        setShowSortDropdown(false);
                      }}
                    >
                      {t("NEWEST")}
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {filteredProducts.length} {t("PRODUCTS_FOUND")}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">{t("FILTER_OPTIONS")}</h3>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price Range Filter */}
              <div>
                <h4 className="font-medium mb-2">{t("PRICE_RANGE")}</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange({
                        ...priceRange,
                        min: Number(e.target.value),
                      })
                    }
                    className="w-24 p-2 border border-gray-300 rounded-md"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="0"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange({
                        ...priceRange,
                        max: Number(e.target.value),
                      })
                    }
                    className="w-24 p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* In Stock Filter */}
              <div>
                <h4 className="font-medium mb-2">{t("AVAILABILITY")}</h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={() => setInStock(!inStock)}
                    className="h-5 w-5 text-blue-600"
                  />
                  <span>{t("IN_STOCK_ONLY")}</span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setPriceRange({ min: 0, max: 10000 });
                  setInStock(false);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 mr-2"
              >
                {t("RESET")}
              </button>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                {t("APPLY")}
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">{t("NO_PRODUCTS_FOUND")}</p>
            <Link
              to="/"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              {t("CONTINUE_SHOPPING")}
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default CollectionProducts;
