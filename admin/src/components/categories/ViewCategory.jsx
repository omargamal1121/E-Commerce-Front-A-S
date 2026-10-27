import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";
import { useTranslation } from "react-i18next";

const ViewCategory = ({ token, categoryId, isActive = null, includeDeleted = true, onSelectId, onUpdateCategory }) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localIsActive, setLocalIsActive] = useState(isActive);
  const [localIncludeDeleted, setLocalIncludeDeleted] = useState(includeDeleted !== false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const navigate = useNavigate();

  const handleSelectId = onSelectId || (() => { });

  const fetchCategory = useCallback(async () => {
    if (!categoryId) return;

    setLoading(true);
    try {
      const params = {};
      if (localIsActive !== null && localIsActive !== "" && typeof localIsActive !== "undefined") {
        params.isActive = localIsActive;
      }
      // Always include deleted items by default when viewing by ID unless explicitly disabled
      params.includeDeleted = localIncludeDeleted === false ? false : true;

      const response = await axios.get(`${backendUrl}/api/categories/${categoryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      if (response.status === 200) {
        const cat = response.data?.responseBody?.data || null;
        if (cat && cat.images) {
          cat.images = cat.images.map(img => ({
            ...img,
            url: img.url?.startsWith("http") ? img.url : `${backendUrl}/${img.url}`
          }));
        }
        if (cat && cat.subCategories) {
          cat.subCategories = cat.subCategories.map(sub => ({
            ...sub,
            images: sub.images?.map(img => ({
              ...img,
              url: img.url?.startsWith("http") ? img.url : `${backendUrl}/${img.url}`
            }))
          }));
        }
        setCategory(cat);
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

  useEffect(() => {
    setLocalIsActive(isActive);
  }, [isActive]);

  useEffect(() => {
    setLocalIncludeDeleted(includeDeleted);
  }, [includeDeleted]);

  const triggerUpdate = () => {
    if (!category) return;
    if (typeof onUpdateCategory === "function") {
      onUpdateCategory(category);
    }
  };

  const activateCategory = async () => {
    if (!category) return;
    const hasMain = category.images?.some((img) => img.isMain);
    if (!hasMain) return toast.error("Upload a main image first!");
    try {
      setActionLoading(true);
      await axios.patch(`${backendUrl}/api/categories/${category.id}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Category activated");
      await fetchCategory();
    } catch (err) {
      toast.error("Activation failed");
    } finally {
      setActionLoading(false);
    }
  };

  const deactivateCategory = async () => {
    if (!category) return;
    try {
      setActionLoading(true);
      await axios.patch(`${backendUrl}/api/categories/${category.id}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        params: { isActive: false },
      });
      toast.success("Category deactivated");
      await fetchCategory();
    } catch (err) {
      toast.error("Deactivation failed");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCategory = async () => {
    if (!category) return;
    if (!window.confirm("Move this category to trash?")) return;
    try {
      setActionLoading(true);
      await axios.delete(`${backendUrl}/api/categories/${category.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Moved to trash");
      setLocalIncludeDeleted(true);
      await fetchCategory();
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const restoreCategory = async () => {
    if (!category) return;
    try {
      setActionLoading(true);
      await axios.patch(`${backendUrl}/api/categories/${category.id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Category restored");
      await fetchCategory();
    } catch (err) {
      toast.error("Restore failed");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteImageById = async (imageId) => {
    if (!category || !imageId) return;
    if (!window.confirm("Permanently delete this visual asset?")) return;
    try {
      setActionLoading(true);
      await axios.delete(
        `${backendUrl}/api/categories/${category.id}/images/${imageId}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'text/plain' } }
      );
      toast.success("Visual removed");
      await fetchCategory();
      setSelectedImageIndex(0);
    } catch (err) {
      toast.error("Failed to delete image");
    } finally {
      setActionLoading(false);
    }
  };

  if (!categoryId) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="font-bold">Enter a Category ID to explore its details</p>
    </div>
  );

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-10 bg-gray-100 rounded-xl w-1/3" />
        <div className="flex gap-2">
          <div className="h-10 bg-gray-100 rounded-xl w-24" />
          <div className="h-10 bg-gray-100 rounded-xl w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[400px] bg-gray-100 rounded-[32px]" />
        <div className="space-y-4">
          <div className="h-6 bg-gray-100 rounded w-full" />
          <div className="h-6 bg-gray-100 rounded w-full" />
          <div className="h-6 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-rose-50 border border-rose-100 p-6 rounded-[24px] flex flex-col items-center gap-3">
      <div className="text-rose-500 font-bold text-center">{error}</div>
      <button onClick={() => fetchCategory()} className="text-rose-600 text-xs font-black uppercase tracking-widest border-b-2 border-rose-200">Retry Fetch</button>
    </div>
  );
  if (!category) return null;

  const images = category.images || [];
  const subCategories = category.subCategories || [];
  const isDeletedFlag = !!(category.isDeleted || category.deleted || category.deletedAt);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Control Center */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 md:p-8 flex flex-wrap items-center justify-between gap-6 shadow-xl border border-gray-800">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-blue-400 text-xs font-black uppercase tracking-[0.2em]">Category Deployment</span>
            <span className="text-gray-500">•</span>
            <span className="text-xs font-bold text-gray-400">ID #{category.id}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{category.name}</h2>
          <div className="flex items-center gap-3 mt-1">
            <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${category.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
              {category.isActive ? "Live" : "Inactive"}
            </div>
            {isDeletedFlag && <div className="px-4 py-1 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-widest border border-white/10">Archived</div>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={triggerUpdate}
            className="px-5 py-2.5 bg-white/10 text-white border border-white/15 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-gray-900 transition-all shadow-md"
          >
            Edit Metadata
          </button>

          {category.isActive ? (
            <button onClick={deactivateCategory} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-xl text-xs font-bold uppercase tracking-wider transition-all font-bold shadow-md">Deactivate</button>
          ) : (
            <button onClick={activateCategory} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-900 rounded-xl text-xs font-bold uppercase tracking-wider transition-all font-bold shadow-md">Activate</button>
          )}

          {!isDeletedFlag ? (
            <button onClick={deleteCategory} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all font-bold shadow-md">Delete</button>
          ) : (
            <button onClick={restoreCategory} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all font-bold shadow-md">Restore</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visual Gallery & Connected Subcategories under image */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          {/* Visual Gallery */}
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="relative aspect-[16/10] sm:aspect-video max-h-[380px] w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group shadow-sm flex items-center justify-center">
              {images[selectedImageIndex] ? (
                <img src={images[selectedImageIndex].url} className="w-full h-full object-contain p-3" alt="Asset Preview" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-sm">No Visual Data</div>
              )}

              {images[selectedImageIndex] && !actionLoading && (
                <button
                  onClick={() => deleteImageById(images[selectedImageIndex].id)}
                  className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur-md text-rose-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-rose-600 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}

              {images.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                  <button onClick={() => setSelectedImageIndex(i => (i === 0 ? images.length - 1 : i - 1))} className="p-3 bg-white/90 backdrop-blur-md rounded-2xl pointer-events-auto shadow-md border border-gray-100/50 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold">←</button>
                  <button onClick={() => setSelectedImageIndex(i => (i === images.length - 1 ? 0 : i + 1))} className="p-3 bg-white/90 backdrop-blur-md rounded-2xl pointer-events-auto shadow-md border border-gray-100/50 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold">→</button>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${selectedImageIndex === idx ? "border-blue-600 scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={img.url} className="w-full h-full object-cover" alt="Thumbnail" />
                    {img.isMain && <div className="absolute bottom-1 inset-x-1 bg-blue-600 text-white text-[8px] font-black uppercase text-center py-0.5 rounded-md">Hero</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Connected Sub-categories (under image) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-base">📁</span>
                <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs">Subcategories ({subCategories.length})</h3>
              </div>
              <button
                onClick={() => navigate('/sub-category')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Manage All →
              </button>
            </div>

            {subCategories.length === 0 ? (
              <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">No subcategories linked to this category</p>
                <button
                  onClick={() => navigate('/sub-category')}
                  className="mt-2 text-xs font-bold text-blue-600 hover:underline inline-block"
                >
                  + Add Subcategory
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {subCategories.map(sub => {
                  const isSubDeleted = !!(sub.isDeleted || sub.deleted || sub.deletedAt);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSelectId(sub)}
                      className={`flex items-center gap-3 bg-gray-50 hover:bg-white p-3 rounded-2xl border ${isSubDeleted ? 'border-rose-200 bg-rose-50/20' : 'border-gray-100'} hover:border-blue-300 hover:shadow-md transition-all text-left group cursor-pointer`}
                    >
                      <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm shrink-0 border border-gray-100">
                        <img
                          src={sub.images?.find(i => i.isMain)?.url || sub.images?.[0]?.url || ""}
                          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ${isSubDeleted ? 'opacity-60 grayscale' : ''}`}
                          alt={sub.name}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`font-bold text-gray-900 truncate text-sm group-hover:text-blue-600 transition-colors ${isSubDeleted ? 'line-through text-gray-500' : ''}`}>{sub.name}</p>
                          {isSubDeleted && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full shrink-0">
                              Deleted
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Rank: {sub.displayOrder}</p>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSubDeleted ? "bg-gray-400" : sub.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"}`} title={isSubDeleted ? "Deleted" : sub.isActive ? "Active" : "Inactive"} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Information Panel & Metadata (in side after description) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          {/* Inventory Narrative / Description */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Inventory Narrative</h3>
            <p className="text-gray-600 font-medium leading-relaxed text-sm">
              {category.description || "No narrative established for this category yet."}
            </p>
          </div>

          {/* Metadata Specifications */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Category Specifications</h3>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Category UID</p>
                <p className="font-black text-gray-900 text-base">#{category.id}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Display Rank</p>
                <p className="font-black text-gray-900 text-base">{category.displayOrder}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Created At</p>
                <p className="font-bold text-gray-900 text-xs">{new Date(category.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Last Evolution</p>
                <p className="font-bold text-gray-900 text-xs">{new Date(category.modifiedAt || category.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCategory;
