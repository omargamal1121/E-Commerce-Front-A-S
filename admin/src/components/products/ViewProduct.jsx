import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";
import { currency } from "../../App";
import { useNavigate } from "react-router-dom";

const ViewProduct = ({ token, productId }) => {
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await API.products.getById(productId, token);
      const data = res?.responseBody?.data || res?.data || res;
      setProduct(data || null);
      setError(null);
    } catch (err) {
      const emsg =
        err?.response?.data?.responseBody?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load product";
      setError(emsg);
      toast.error(emsg);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId, token]);

  const fetchVariants = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await API.variants.getByProductId(productId, token);
      const list = res?.responseBody?.data || res?.data || [];
      setVariants(Array.isArray(list) ? list : []);
    } catch (err) {
      // Variants failure shouldn't block the page
      const emsg =
        err?.response?.data?.responseBody?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load variants";
      toast.error(emsg);
      setVariants([]);
    }
  }, [productId, token]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchVariants();
    }
  }, [productId, fetchProduct, fetchVariants]);

  // Image deletion functions
  const deleteMainImage = async () => {
    if (!product) return;
    if (!window.confirm("Delete main image?")) return;
    try {
      setActionLoading(true);
      const res = await API.images.delete(productId, "main", token);
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        "Main image deleted";
      toast.success(msg);
      await fetchProduct();
      // Reset selected image index if it was the main image
      setSelectedImageIndex(0);
    } catch (err) {
      const emsg =
        err?.response?.data?.responseBody?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete main image";
      toast.error(emsg);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteImageById = async (imageId) => {
    if (!product || !imageId) return;
    if (!window.confirm("Delete this image?")) return;
    try {
      setActionLoading(true);
      const res = await API.images.delete(productId, imageId, token);
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        "Image deleted";
      toast.success(msg);
      await fetchProduct();
      // Adjust selected image index if needed
      const currentImages = product.images || [];
      const deletedIndex = currentImages.findIndex(img => img.id === imageId);
      if (deletedIndex !== -1 && selectedImageIndex >= deletedIndex) {
        setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
      }
    } catch (err) {
      const emsg =
        err?.response?.data?.responseBody?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete image";
      toast.error(emsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle product active/inactive status
  const toggleProductStatus = async () => {
    if (!product) return;
    try {
      const hasImage =
        (product.images && product.images.length > 0) || product.mainImage;

      if (!hasImage && !product.isActive) {
        toast.error("Cannot activate product without an image");
        return;
      }

      setActionLoading(true);
      if (product.isActive) {
        await API.products.deactivate(product.id, token);
        toast.success("Product deactivated successfully");
      } else {
        await API.products.activate(product.id, token);
        toast.success("Product activated successfully");
      }
      await fetchProduct();
    } catch (error) {
      console.error("Error toggling product status:", error?.response || error);
      toast.error(
        error?.response?.data?.responseBody?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to toggle product status"
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (!productId) return <div className="p-4">Enter product ID to view.</div>;
  if (loading && !product) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!product) return <div className="p-4">No product found.</div>;

  const images = product.images || [];
  const mainImage = images.find((img) => img.isMain) || images[0] || null;
  const discountPercent = Number(
    // Support multiple shapes: direct percentage or nested discount object
    (product.discount && (product.discount.discountPercent ?? product.discount.percentage)) ??
    product.discountPercentage ??
    product.discountPrecentage ??
    0
  );
  const hasDiscount = !Number.isNaN(discountPercent) && discountPercent > 0;
  // Prefer server-provided finalPrice when available
  const serverFinalPrice = product.finalPrice != null ? Number(product.finalPrice) : null;
  const basePrice = Number(product.price);
  const discountedPrice = hasDiscount
    ? (serverFinalPrice != null && !Number.isNaN(serverFinalPrice)
      ? serverFinalPrice
      : basePrice * (1 - discountPercent / 100))
    : basePrice;

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-bold">Product: {product.name}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${product.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {product.isActive ? "Active" : "Inactive"}
          </span>
          {product.deletedAt && (
            <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-200 text-gray-700">
              Deleted
            </span>
          )}

          {hasDiscount && (
            <span className="px-2 py-1 text-xs rounded-full font-medium bg-purple-100 text-purple-700">
              {discountPercent}% OFF
            </span>
          )}

          {/* Action buttons */}
          {!product.deletedAt && (
            <div className="flex items-center gap-2 ml-2">
              <button
                type="button"
                onClick={toggleProductStatus}
                disabled={actionLoading}
                className={`px-3 py-1 rounded text-xs ${product.isActive
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
                  }`}
              >
                {product.isActive ? "Deactivate" : "Activate"}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/add?edit=${product.id}`)}
                className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-xs"
              >
                Update
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Images Section */}
      {images.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Product Images</h3>

          {/* Main Image Display */}
          <div className="mb-4">
            <div className="relative bg-gray-50 rounded-lg p-4 group">
              {images[selectedImageIndex] ? (
                <img
                  src={images[selectedImageIndex].url}
                  alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                  className="w-full max-w-md mx-auto h-80 object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full max-w-md mx-auto h-80 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg">
                  No Image Available
                </div>
              )}

              {/* Delete button for main image */}
              {images[selectedImageIndex]?.isMain && (
                <button
                  type="button"
                  onClick={deleteMainImage}
                  disabled={actionLoading}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition bg-red-600 text-white text-xs px-2 py-1 rounded shadow"
                >
                  Delete Main
                </button>
              )}

              {/* Delete button for regular images */}
              {images[selectedImageIndex] && !images[selectedImageIndex].isMain && images[selectedImageIndex].id && (
                <button
                  type="button"
                  onClick={() => deleteImageById(images[selectedImageIndex].id)}
                  disabled={actionLoading}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition bg-red-600 text-white text-xs px-2 py-1 rounded shadow"
                >
                  Delete
                </button>
              )}

              {/* Image Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="text-center mt-2 text-sm text-gray-600">
                Image {selectedImageIndex + 1} of {images.length}
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <button
                    onClick={() => setSelectedImageIndex(idx)}
                    className="w-full h-20 block"
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>

                  {/* Main badge */}
                  {img.isMain && (
                    <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                      Main
                    </div>
                  )}

                  {/* Delete button for thumbnails */}
                  {img.id && (
                    <button
                      type="button"
                      onClick={() => deleteImageById(img.id)}
                      disabled={actionLoading}
                      className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition bg-red-600 text-white text-xs px-1 py-0.5 rounded shadow"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Details */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Product Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex">
              <span className="font-semibold text-gray-700 w-24">ID:</span>
              <span className="text-gray-900">{product.id}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-24">Price:</span>
              {hasDiscount ? (
                <span className="text-gray-900 font-bold text-lg">
                  <span className="line-through text-gray-500 mr-2">{currency} {basePrice.toFixed(2)}</span>
                  <span className="text-green-700">{currency} {discountedPrice.toFixed(2)}</span>
                </span>
              ) : (
                <span className="text-gray-900 font-bold text-lg">{currency} {basePrice.toFixed(2)}</span>
              )}
            </div>
            {hasDiscount && (
              <div className="flex">
                <span className="font-semibold text-gray-700 w-24">Discount:</span>
                <span className="text-purple-700 font-semibold">{discountPercent}%</span>
              </div>
            )}
            {hasDiscount && product.discount && (
              <div className="flex">
                <span className="font-semibold text-gray-700 w-24">Offer:</span>
                <span className="text-gray-900">
                  {product.discount.name || "Discount"}
                  {typeof product.discount.isActive === 'boolean' && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${product.discount.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {product.discount.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </span>
              </div>
            )}
            {hasDiscount && product.discount && (product.discount.startDate || product.discount.endDate) && (
              <div className="flex text-sm text-gray-600">
                <span className="font-semibold text-gray-700 w-24">Validity:</span>
                <span>
                  {product.discount.startDate ? new Date(product.discount.startDate).toLocaleDateString() : '-'}
                  {" "}to{" "}
                  {product.discount.endDate ? new Date(product.discount.endDate).toLocaleDateString() : '-'}
                </span>
              </div>
            )}
            {typeof product.availableQuantity !== "undefined" && (
              <div className="flex">
                <span className="font-semibold text-gray-700 w-24">Stock:</span>
                <span className={`font-semibold ${product.availableQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.availableQuantity} units
                </span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {product.createdAt && (
              <div className="flex">
                <span className="font-semibold text-gray-700 w-24">Created:</span>
                <span className="text-gray-900">{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
            )}
            {product.modifiedAt && (
              <div className="flex">
                <span className="font-semibold text-gray-700 w-24">Modified:</span>
                <span className="text-gray-900">{new Date(product.modifiedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {product.description && (
          <div className="mt-4">
            <span className="font-semibold text-gray-700">Description:</span>
            <p className="text-gray-900 mt-1 leading-relaxed">{product.description}</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Variants ({variants.length})</h3>
        {variants.length === 0 ? (
          <p className="text-gray-600">No variants found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Waist/Length</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {variants.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-2 whitespace-nowrap">{v.color || "-"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{v.size ?? "-"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {v.waist ? `W: ${v.waist}` : ""}
                      {v.waist && v.length ? " / " : ""}
                      {v.length ? `L: ${v.length}` : ""}
                      {!v.waist && !v.length && "-"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{v.quantity ?? 0}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {v.isDeleted ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Deleted</span>
                      ) : v.isActive ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewProduct;
