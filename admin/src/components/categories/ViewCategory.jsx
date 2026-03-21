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

  const handleSelectId = onSelectId || (() => { });

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
    <div className="flex flex-col gap-16 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Control Center */}
      <div className="bg-gray-900 rounded-[50px] p-10 flex flex-wrap items-center justify-between gap-8 shadow-2xl shadow-gray-200 border border-gray-800">
        <div className="flex flex-col gap-2">
          <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-1">Category Deployment</p>
          <h2 className="text-5xl font-black text-white tracking-tighter">{category.name}</h2>
          <div className="flex items-center gap-4 mt-4">
            <div className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest ${category.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
              {category.isActive ? "Live" : "Inactive"}
            </div>
            {isDeletedFlag && <div className="px-6 py-2 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-widest border border-white/10">Archived</div>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={triggerUpdate}
            className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-gray-900 transition-all shadow-xl"
          >
            Edit Metadata
          </button>

          {category.isActive ? (
            <button onClick={deactivateCategory} className="px-8 py-4 bg-amber-500 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all font-bold shadow-lg">Deactivate</button>
          ) : (
            <button onClick={activateCategory} className="px-8 py-4 bg-emerald-500 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all font-bold shadow-lg">Activate</button>
          )}

          {!isDeletedFlag ? (
            <button onClick={deleteCategory} className="px-8 py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 transition-all font-bold shadow-lg">Delete</button>
          ) : (
            <button onClick={restoreCategory} className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all font-bold shadow-lg">Restore</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Visual Gallery */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="relative aspect-square sm:aspect-video rounded-[56px] overflow-hidden bg-white border border-gray-100 group shadow-sm transition-all hover:bg-gray-50/20">
            {images[selectedImageIndex] ? (
              <img src={images[selectedImageIndex].url} className="w-full h-full object-contain p-2" alt="Asset Preview" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-sm">No Visual Data</div>
            )}

            {images[selectedImageIndex] && !actionLoading && (
              <button
                onClick={() => deleteImageById(images[selectedImageIndex].id)}
                className="absolute top-8 right-8 p-5 bg-white/80 backdrop-blur-md text-rose-600 rounded-3xl opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-rose-600 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {images.length > 1 && (
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                <button onClick={() => setSelectedImageIndex(i => (i === 0 ? images.length - 1 : i - 1))} className="p-6 bg-white/90 backdrop-blur-md rounded-3xl pointer-events-auto shadow-2xl border border-gray-100/50 hover:bg-blue-600 hover:text-white transition-all">←</button>
                <button onClick={() => setSelectedImageIndex(i => (i === images.length - 1 ? 0 : i + 1))} className="p-6 bg-white/90 backdrop-blur-md rounded-3xl pointer-events-auto shadow-2xl border border-gray-100/50 hover:bg-blue-600 hover:text-white transition-all">→</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-7 gap-6">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative aspect-square rounded-[28px] overflow-hidden border-4 transition-all ${selectedImageIndex === idx ? "border-blue-600 scale-105 shadow-2xl" : "border-white hover:border-gray-100 shadow-sm"}`}
              >
                <img src={img.url} className="w-full h-full object-cover" alt="Thumbnail" />
                {img.isMain && <div className="absolute bottom-3 inset-x-3 bg-blue-600 text-white text-[9px] font-black uppercase text-center py-1.5 rounded-xl">Hero</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Information Panel */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-white rounded-[50px] p-12 border border-gray-100 shadow-sm flex flex-col gap-10">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Inventory Narrative</p>
              <p className="text-gray-600 font-medium leading-relaxed text-lg">{category.description || "No description provided."}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-10 border-t border-gray-50">
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category UID</p>
                <p className="font-black text-gray-900 tracking-tight text-xl">#{category.id}</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Display Rank</p>
                <p className="font-black text-gray-900 tracking-tight text-xl">{category.displayOrder}</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Created At</p>
                <p className="font-black text-gray-900 tracking-tight text-sm">{new Date(category.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Last Evolution</p>
                <p className="font-black text-gray-900 tracking-tight text-sm">{new Date(category.modifiedAt || category.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Connected Sub-categories */}
          <div className="bg-gray-50/50 rounded-[50px] p-10 border border-gray-100 flex flex-col gap-8 shadow-inner overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Sub-segments ({subCategories.length})</h3>
            </div>

            <div className="flex flex-col gap-4">
              {subCategories.slice(0, 8).map(sub => (
                <button
                  key={sub.id}
                  onClick={() => handleSelectId(sub.id)}
                  className="flex items-center gap-6 bg-white p-4 rounded-3xl border border-gray-100 hover:shadow-xl transition-all text-left group"
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-gray-50">
                    <img src={sub.images?.find(i => i.isMain)?.url || sub.images?.[0]?.url || ""} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 truncate text-base group-hover:text-blue-600 transition-colors">{sub.name}</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Rank: {sub.displayOrder}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${sub.isActive ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"}`} />
                </button>
              ))}
              {subCategories.length > 8 && <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 py-2">+{subCategories.length - 8} deeper layers</p>}
              {subCategories.length === 0 && <p className="text-center text-xs font-bold text-gray-400 py-10 uppercase tracking-widest">No associated segments</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCategory;
