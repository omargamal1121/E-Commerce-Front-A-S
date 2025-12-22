import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";

const ViewSubCategory = ({ token, subCategoryId, isActive = null, includeDeleted = null }) => {
  const [subCategory, setSubCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const navigate = useNavigate();
  
  const fetchSubCategory = useCallback(async () => {
    if (!subCategoryId) return;

    setLoading(true);
    try {
      const params = {};
      if (isActive !== null && isActive !== "" && typeof isActive !== "undefined") {
        params.isActive = isActive;
      }
      if (includeDeleted !== null && includeDeleted !== "" && typeof includeDeleted !== "undefined") {
        params.includeDeleted = includeDeleted;
      }

      const response = await axios.get(`${backendUrl}/api/subcategories/${subCategoryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      if (response.status === 200) {
        const responseData = response.data?.responseBody?.data;
        if (responseData) {
          // Set subcategory data (excluding products)
          const { products: subCategoryProducts, ...subCategoryData } = responseData;
          setSubCategory(subCategoryData);
          
          // Set products if they exist in the response
          if (Array.isArray(subCategoryProducts)) {
            setProducts(subCategoryProducts);
          }
        } else {
          setSubCategory(null);
        }
        setError(null);
      } else {
        setSubCategory(null);
        setError("Subcategory not found");
      }
    } catch (err) {
      console.error("❌ Error fetching subcategory:", err);
      if (err.response?.status === 404) setError("Subcategory not found.");
      else setError(err.response?.data?.message || err.message || "Error fetching subcategory.");
      setSubCategory(null);
    } finally {
      setLoading(false);
    }
  }, [subCategoryId, token, isActive, includeDeleted]);

  useEffect(() => {
    if (subCategoryId) {
      fetchSubCategory();
    }
  }, [subCategoryId, fetchSubCategory]);

  // Actions
  const activateSubCategory = async () => {
    if (!subCategory) return;
    // Ensure main image exists to activate
    const hasMain = subCategory.images?.some((img) => img.isMain);
    if (!hasMain) {
      toast.error("Upload a main image first!");
      return;
    }
    try {
      setActionLoading(true);
      const res = await axios.patch(`${backendUrl}/api/subcategories/${subCategory.id}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const serverMessage =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        (typeof res?.data === "string" ? res.data : null) ||
        "Subcategory activated";
      toast.success(serverMessage);
      await fetchSubCategory();
    } catch (err) {
      const errorMessage =
        err.response?.data?.responseBody?.message ||
        err.response?.data?.message ||
        err.message ||
        "Activation failed";
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const deactivateSubCategory = async () => {
    if (!subCategory) return;
    try {
      setActionLoading(true);
      const res = await axios.patch(`${backendUrl}/api/subcategories/${subCategory.id}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        (typeof res?.data === "string" ? res.data : null) ||
        "Subcategory deactivated";
      toast.success(msg);
      await fetchSubCategory();
    } catch (err) {
      const emsg =
        err?.response?.data?.responseBody?.message ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message ||
        "Deactivation failed";
      toast.error(emsg);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteSubCategory = async () => {
    if (!subCategory) return;
    if (!window.confirm("Are you sure you want to delete this subcategory?")) return;
    try {
      setActionLoading(true);
      const res = await axios.delete(`${backendUrl}/api/subcategories/${subCategory.id}` , {
        headers: { Authorization: `Bearer ${token}` },
      });
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        (typeof res?.data === "string" ? res.data : null) ||
        "Subcategory deleted";
      toast.success(msg);
      await fetchSubCategory();
    } catch (err) {
      const apiMsg =
        err?.response?.data?.responseBody?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Delete failed";
      const already = err.response?.data?.responseBody?.message?.includes("already deleted");
      if (already) {
        toast.info(apiMsg);
        await fetchSubCategory();
      } else {
        toast.error(apiMsg);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const restoreSubCategory = async () => {
    if (!subCategory) return;
    try {
      setActionLoading(true);
      const res = await axios.patch(`${backendUrl}/api/subcategories/${subCategory.id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        "Subcategory restored";
      toast.success(msg);
      await fetchSubCategory();
    } catch (err) {
      const emsg =
        err?.response?.data?.responseBody?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Restore failed";
      toast.error(emsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Image deletion actions
  const deleteMainImage = async () => {
    if (!subCategory) return;
    if (!window.confirm("Delete main image?")) return;
    try {
      setActionLoading(true);
      const mainImg = Array.isArray(subCategory.images)
        ? subCategory.images.find((img) => img && img.isMain)
        : null;
      if (!mainImg || !mainImg.id) {
        toast.error("No main image found to delete");
        return;
      }
      const res = await axios.delete(
        `${backendUrl}/api/subcategories/${subCategory.id}/images/${mainImg.id}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'text/plain' } }
      );
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        "Main image deleted";
      toast.success(msg);
      await fetchSubCategory();
      setSelectedImageIndex(0); // Reset to first image
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
    if (!subCategory || !imageId) return;
    if (!window.confirm("Delete this image?")) return;
    try {
      setActionLoading(true);
      const res = await axios.delete(
        `${backendUrl}/api/subcategories/${subCategory.id}/images/${imageId}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'text/plain' } }
      );
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        "Image deleted";
      toast.success(msg);
      await fetchSubCategory();
      // Adjust selected index if needed
      if (selectedImageIndex >= images.length - 1) {
        setSelectedImageIndex(Math.max(0, images.length - 2));
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

  if (!subCategoryId)
    return <div className="p-4">Enter subcategory ID to search.</div>;
  if (loading) return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!subCategory) return <div className="p-4">No data found.</div>;

  const images = subCategory.images || [];
  const isDeletedFlag = !!(subCategory.isDeleted || subCategory.deleted || subCategory.deletedAt);

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-bold">
          Subcategory: {subCategory.name}
        </h2>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${subCategory.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {subCategory.isActive ? "Active" : "Inactive"}
          </span>
          {isDeletedFlag && (
            <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-200 text-gray-700">
              Deleted
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        {!isDeletedFlag ? (
          <button
            type="button"
            onClick={deleteSubCategory}
            className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
            disabled={actionLoading}
          >
            Delete
          </button>
        ) : (
          <button
            type="button"
            onClick={restoreSubCategory}
            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
            disabled={actionLoading}
          >
            Restore
          </button>
        )}
        {subCategory.isActive ? (
          <button
            type="button"
            onClick={deactivateSubCategory}
            className="px-4 py-2 rounded bg-yellow-500 text-white disabled:opacity-50"
            disabled={actionLoading}
          >
            Deactivate
          </button>
        ) : (
          <button
            type="button"
            onClick={activateSubCategory}
            className="px-4 py-2 rounded bg-green-500 text-white disabled:opacity-50"
            disabled={actionLoading}
          >
            Activate
          </button>
        )}
      </div>

      <div className="mb-4">
        <p>
          <strong>ID:</strong> {subCategory.id}
        </p>
        <p>
          <strong>Description:</strong> {subCategory.description}
        </p>
        <p>
          <strong>Category ID:</strong> {subCategory.categoryId}
        </p>
        <p>
          <strong>Display Order:</strong> {subCategory.displayOrder}
        </p>
        <p>
          <strong>Active:</strong> {subCategory.isActive ? "Yes" : "No"}
        </p>
        <p>
          <strong>Created At:</strong>{" "}
          {new Date(subCategory.createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Modified At:</strong>{" "}
          {new Date(subCategory.modifiedAt).toLocaleString()}
        </p>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">SubCategory Images</h3>
          
          {/* Main Image Display */}
          <div className="mb-4">
            <div className="relative bg-gray-50 rounded-lg p-4 group">
              {images[selectedImageIndex] ? (
                <img
                  src={images[selectedImageIndex].url}
                  alt={`${subCategory.name} - Image ${selectedImageIndex + 1}`}
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
              
              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1)}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0)}
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
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx 
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
                      alt={`${subCategory.name} thumbnail ${idx + 1}`}
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

      {products && products.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-3">Products ({products.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              const productMain = product.images?.find((i) => i.isMain) || product.images?.[0];
              return (
                <button
                  key={product.id}
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="group text-left border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow w-full"
                >
                  {productMain ? (
                    <img
                      src={productMain.url}
                      alt={product.name}
                      className="w-full h-36 object-cover"
                    />
                  ) : (
                    <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold truncate">{product.name}</h4>
                      <span className={`ml-2 px-2 py-0.5 text-[10px] rounded-full ${product.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description || "No description"}</p>
                    <p className="text-sm font-medium text-blue-600 mt-1">
                      Price: ${product.price || "N/A"}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      Click to view details →
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewSubCategory;
