import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";

const ViewCategory = ({ token, categoryId, isActive = null, includeDeleted = null, onSelectId, onUpdateCategory }) => {
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localIsActive, setLocalIsActive] = useState(isActive);
  const [localIncludeDeleted, setLocalIncludeDeleted] = useState(includeDeleted);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const navigate = useNavigate();
  
  // Fallback no-op if parent didn't pass handler
  const handleSelectId = onSelectId || (() => {});

  const fetchCategory = useCallback(async () => {
    if (!categoryId) return;

    setLoading(true);
    try {
      const params = {};
      if (localIsActive !== null && localIsActive !== "" && typeof localIsActive !== "undefined") {
        params.isActive = localIsActive;
      }
      if (localIncludeDeleted !== null && localIncludeDeleted !== "" && typeof localIncludeDeleted !== "undefined") {
        params.includeDeleted = localIncludeDeleted;
      }

      const response = await axios.get(`${backendUrl}/api/categories/${categoryId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          params,
          }
        );

        if (response.status === 200) {
          setCategory(response.data?.responseBody?.data || null);
          setError(null);
      } else {
        setCategory(null);
        setError("Category not found");
      }
    } catch (err) {
      console.error("❌ Error fetching category:", err);
      if (err.response?.status === 404) setError("Category not found.");
      else setError(err.response?.data?.message || err.message || "Error fetching category.");
      setCategory(null);
    } finally {
          setLoading(false);
    }
  }, [categoryId, token, localIsActive, localIncludeDeleted]);

  useEffect(() => {
    if (categoryId) fetchCategory();
  }, [categoryId, fetchCategory]);

  // Sync local filters if parent props change explicitly
  useEffect(() => {
    setLocalIsActive(isActive);
  }, [isActive]);
  useEffect(() => {
    setLocalIncludeDeleted(includeDeleted);
  }, [includeDeleted]);

  // Actions
  const triggerUpdate = () => {
    if (!category) return;
    if (typeof onUpdateCategory === "function") {
      onUpdateCategory(category);
      return;
    }
    // Fallback: if route not available, do nothing to avoid white screen
  };

  const activateCategory = async () => {
    if (!category) return;
    // Ensure main image exists to activate
    const hasMain = category.images?.some((img) => img.isMain);
    if (!hasMain) {
      toast.error("Upload a main image first!");
          return;
        }
    try {
      setActionLoading(true);
      const res = await axios.patch(`${backendUrl}/api/categories/${category.id}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const serverMessage =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        (typeof res?.data === "string" ? res.data : null) ||
        "Category activated";
      toast.success(serverMessage);
      await fetchCategory();
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

  const deactivateCategory = async () => {
    if (!category) return;
    try {
      setActionLoading(true);
      const res = await axios.patch(`${backendUrl}/api/categories/${category.id}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        params: { isActive: false },
      });
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        "Category deactivated";
      toast.success(msg);
      await fetchCategory();
    } catch (err) {
      const emsg =
        err?.response?.data?.responseBody?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Deactivation failed";
      toast.error(emsg);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCategory = async () => {
    if (!category) return;
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      setActionLoading(true);
      const res = await axios.delete(`${backendUrl}/api/categories/${category.id}` , {
        headers: { Authorization: `Bearer ${token}` },
      });
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        (typeof res?.data === "string" ? res.data : null) ||
        "Category deleted";
      toast.success(msg);
      await fetchCategory();
    } catch (err) {
      const apiMsg =
        err?.response?.data?.responseBody?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Delete failed";
      const already = err.response?.data?.responseBody?.message?.includes("already deleted");
      if (already) {
        toast.info(apiMsg);
        await fetchCategory();
      } else {
        toast.error(apiMsg);
      } 
    } finally {
      setActionLoading(false);
    }
  };

  const restoreCategory = async () => {
    if (!category) return;
    try {
      setActionLoading(true);
      const res = await axios.patch(`${backendUrl}/api/categories/${category.id}/restore`, {}, {
          headers: { Authorization: `Bearer ${token}` },
      });
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        "Category restored";
      toast.success(msg);
      await fetchCategory();
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
    if (!category) return;
    if (!window.confirm("Delete main image?")) return;
    try {
      setActionLoading(true);
      const mainImg = Array.isArray(category.images)
        ? category.images.find((img) => img && img.isMain)
        : null;
      if (!mainImg || !mainImg.id) {
        toast.error("No main image found to delete");
        return;
      }
      const res = await axios.delete(
        `${backendUrl}/api/categories/${category.id}/images/${mainImg.id}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'text/plain' } }
      );
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        "Main image deleted";
      toast.success(msg);
      await fetchCategory();
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
    if (!category || !imageId) return;
    if (!window.confirm("Delete this image?")) return;
    try {
      setActionLoading(true);
      const res = await axios.delete(
        `${backendUrl}/api/categories/${category.id}/images/${imageId}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'text/plain' } }
      );
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        "Image deleted";
      toast.success(msg);
      await fetchCategory();
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

  if (!categoryId)
    return <div className="p-4">Enter category ID to search.</div>;
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
  if (!category) return <div className="p-4">No data found.</div>;

  // Handle category view (existing code)
  const images = category.images || [];

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-bold">
          Category: {category.name}
      </h2>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${category.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {category.isActive ? "Active" : "Inactive"}
          </span>
          {category.isDeleted && (
            <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-200 text-gray-700">
              Deleted
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={triggerUpdate}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          disabled={actionLoading}
        >
          Update
        </button>
        {!category.isDeleted ? (
          <button
            type="button"
            onClick={deleteCategory}
            className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
            disabled={actionLoading}
          >
            Delete
          </button>
        ) : (
          <button
            type="button"
            onClick={restoreCategory}
            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
            disabled={actionLoading}
          >
            Restore
          </button>
        )}
        {category.isActive ? (
          <button
            type="button"
            onClick={deactivateCategory}
            className="px-4 py-2 rounded bg-yellow-500 text-white disabled:opacity-50"
            disabled={actionLoading}
          >
            Deactivate
          </button>
        ) : (
          <button
            type="button"
            onClick={activateCategory}
            className="px-4 py-2 rounded bg-green-500 text-white disabled:opacity-50"
            disabled={actionLoading}
          >
            Activate
          </button>
        )}
      </div>

      <div className="mb-4">
        <p>
          <strong>ID:</strong> {category.id}
        </p>
        <p>
          <strong>Description:</strong> {category.description}
        </p>
        <p>
          <strong>Display Order:</strong> {category.displayOrder}
        </p>
        <p>
          <strong>Active:</strong> {category.isActive ? "Yes" : "No"}
        </p>
        <p>
          <strong>Created At:</strong>{" "}
          {new Date(category.createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Modified At:</strong>{" "}
          {new Date(category.modifiedAt).toLocaleString()}
        </p>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Category Images</h3>
          
          {/* Main Image Display */}
          <div className="mb-4">
            <div className="relative bg-gray-50 rounded-lg p-4 group">
              {images[selectedImageIndex] ? (
                <img
                  src={images[selectedImageIndex].url}
                  alt={`${category.name} - Image ${selectedImageIndex + 1}`}
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
                      alt={`${category.name} thumbnail ${idx + 1}`}
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

      {category.subCategories && category.subCategories.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-3">Sub Categories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.subCategories.map((sub) => {
              const subMain = sub.images?.find((i) => i.isMain) || sub.images?.[0];
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSelectId(sub.id)}
                  className="group text-left border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  {subMain ? (
                    <img
                      src={subMain.url}
                      alt={sub.name}
                      className="w-full h-36 object-cover"
                    />
                  ) : (
                    <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-gray-500">
                      No Image
                  </div>
                )}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold truncate">{sub.name}</h4>
                      <span className={`ml-2 px-2 py-0.5 text-[10px] rounded-full ${sub.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {sub.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{sub.description || "No description"}</p>
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

export default ViewCategory;
