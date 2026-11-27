import React, { useEffect, useState, useContext } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import ProductCard from "../components/ProductCard";

const DiscountProducts = () => {
  const { discountId } = useParams();
  const location = useLocation();
  const { backendUrl } = useContext(ShopContext);

  const [discount, setDiscount] = useState(location.state?.discount || null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDiscountProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(
          `${backendUrl}/api/Products/Discount/${discountId}/Products`
        );

        const data =
          res.data?.responseBody?.data ||
          res.data?.data ||
          (Array.isArray(res.data) ? res.data : []);

        setProducts(Array.isArray(data) ? data : []);

        // If discount details weren't passed via router state, fetch them
        if (!discount) {
          try {
            const discRes = await axios.get(
              `${backendUrl}/api/Discount?includeDeleted=false&page=1&pageSize=50`
            );
            const discList =
              discRes.data?.responseBody?.data || discRes.data?.data || [];
            const found = discList.find(
              (d) => String(d.id) === String(discountId)
            );
            if (found) setDiscount(found);
          } catch {
            // Non-critical if discount metadata fails
          }
        }
      } catch (err) {
        console.error("Failed to fetch discount products:", err);
        setError("Failed to load products for this discount.");
      } finally {
        setLoading(false);
      }
    };

    if (backendUrl && discountId) {
      fetchDiscountProducts();
    }
  }, [backendUrl, discountId]);

  if (loading) {
    return (
      <div className="pt-32 sm:pt-36 min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-[var(--brand)] rounded-full" />
      </div>
    );
  }

  return (
    <div className="pt-28 sm:pt-32 pb-16 px-4 sm:px-8 max-w-7xl mx-auto min-h-[75vh]">
      {/* Header */}
      <div className="mb-8 border-b border-[var(--border)] pb-6">
        <Link
          to="/"
          className="inline-block text-xs font-semibold text-[var(--text)]/60 hover:text-[var(--brand)] mb-3"
        >
          &larr; Back to Home
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] capitalize">
            {discount?.name || `Discount #${discountId}`}
          </h1>
          {discount?.discountPercent != null && (
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              {discount.discountPercent}% OFF
            </span>
          )}
        </div>

        {discount?.description && (
          <p className="mt-2 text-sm text-[var(--text)]/70 max-w-2xl">
            {discount.description}
          </p>
        )}

        <p className="mt-2 text-xs font-semibold text-[var(--text)]/50">
          {products.length} {products.length === 1 ? "Product" : "Products"}
        </p>
      </div>

      {/* Content */}
      {error ? (
        <div className="text-center py-16">
          <p className="text-red-500 font-semibold mb-4">{error}</p>
          <Link
            to="/collection"
            className="px-6 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-bold"
          >
            Browse All Products
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text)]/70 text-base mb-4">
            No products found for this discount.
          </p>
          <Link
            to="/collection"
            className="px-6 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-bold"
          >
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscountProducts;
