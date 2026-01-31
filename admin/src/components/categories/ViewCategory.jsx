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

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Banner & Control */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{category.name}</h2>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${category.isActive ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}>
              {category.isActive ? "Live" : "Internal"}
            </div>
            {category.isDeleted && (
              <div className="px-3 py-1 rounded-full bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest">
                In Trash
              </div>
            )}
          </div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-tighter">System Reference UID: {category.id}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={triggerUpdate}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            Edit Metadata
          </button>

          <div className="w-px h-10 bg-gray-100 mx-2 hidden md:block" />

          {category.isActive ? (
            <button onClick={deactivateCategory} className="p-3 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-2xl transition-all" title="Deactivate">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            </button>
          ) : (
            <button onClick={activateCategory} className="p-3 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-2xl transition-all" title="Activate">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}

          {!category.isDeleted ? (
            <button onClick={deleteCategory} className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl transition-all" title="Trash">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <button onClick={restoreCategory} className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all" title="Restore">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Media Gallery */}
        <div className="lg:col-span-12 flex flex-col gap-6">
          <div className="bg-gray-50 rounded-[48px] p-8 border border-gray-100">
            {images.length > 0 ? (
              <div className="flex flex-col gap-6">
                <div className="relative group aspect-video lg:aspect-[21/9] bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-gray-200">
                  <img
                    src={images[selectedImageIndex].url}
                    className="w-full h-full object-contain"
                    alt="Gallery item"
                  />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => deleteImageById(images[selectedImageIndex].id)}
                      className="p-3 bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-2xl hover:bg-rose-600 hover:border-rose-600 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                      Purge Asset
                    </button>
                  </div>

                  {images[selectedImageIndex].isMain && (
                    <div className="absolute top-4 left-4 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">
                      Hero Asset
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-20 h-20 rounded-2xl border-2 transition-all overflow-hidden ${selectedImageIndex === idx ? "border-blue-600 ring-4 ring-blue-50" : "border-gray-100 hover:border-gray-200"}`}
                      >
                        <img src={img.url} className="w-full h-full object-cover" alt="thumbnail" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[21/9] flex flex-col items-center justify-center text-gray-300 gap-2 font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                No Visual Materials Uploaded
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Chronology</h3>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Created</p>
                <p className="text-sm font-bold text-gray-900">{new Date(category.createdAt).toLocaleString()}</p>
              </div>
              <div className="w-full h-px bg-gray-50" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Last Evolution</p>
                <p className="text-sm font-bold text-gray-900">{new Date(category.modifiedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Inventory Narrative</h3>
            <p className="text-gray-600 font-medium leading-relaxed">{category.description || "No narrative established for this category yet. Consider adding a description to improve SEO and customer experience."}</p>
            <div className="mt-auto flex items-center gap-4">
              <div className="bg-gray-50 px-4 py-2 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Display Index</p>
                <p className="text-lg font-black text-gray-900">{category.displayOrder}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Categories Section */}
        {category.subCategories && category.subCategories.length > 0 && (
          <div className="lg:col-span-12 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Connected Sub-Categories</h3>
              <span className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-500">{category.subCategories.length} Nodes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.subCategories.map((sub) => {
                const subMain = sub.images?.find((i) => i.isMain) || sub.images?.[0];
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectId(sub.id)}
                    className="group flex flex-col text-left bg-white border border-gray-100 rounded-[32px] overflow-hidden hover:border-blue-200 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-gray-50">
                      {subMain ? (
                        <img src={subMain.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={sub.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 font-black text-xs uppercase">No Visual</div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900 line-clamp-1">{sub.name}</h4>
                        <div className={`w-2 h-2 rounded-full ${sub.isActive ? "bg-green-500" : "bg-rose-500"}`} title={sub.isActive ? "Live" : "Inactive"} />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 font-medium">{sub.description || "Node narrative missing."}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewCategory;
