import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";
import { useNavigate } from "react-router-dom";

const ListCategory = ({
  token,
  categories,
  setCategories,
  handleEditCategory,
  handleViewCategory,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [isDeleted, setIsDeleted] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: search || undefined,
          isActive: isActive || undefined,
          isDeleted: isDeleted || undefined,
          page,
          pageSize,
        },
      });

      const cats = res.data?.responseBody?.data || [];
      const totalCount = res.data?.responseBody?.totalCount || cats.length;

      const normalized = cats.map((cat) => {
        let mainImage = cat.images?.find((i) => i.isMain) || cat.images?.[0] || null;

        if (mainImage && mainImage.url) {
          mainImage = {
            ...mainImage,
            url: mainImage.url.startsWith("http") ? mainImage.url : `${backendUrl}/${mainImage.url}`
          };
        }

        return {
          ...cat,
          mainImage,
          wasDeleted: cat.isDeleted || false,
        };
      });

      setCategories(normalized);
      setTotalPages(Math.ceil(totalCount / pageSize));
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token, search, isActive, isDeleted, page]);

  const removeCategory = async (id) => {
    try {
      setDeleteLoading(true);
      const res = await axios.delete(`${backendUrl}/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id ? { ...cat, isDeleted: true, wasDeleted: true } : cat
        )
      );

      toast.success("Category moved to trash");
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const activateCategory = async (cat) => {
    if (!cat.mainImage) return toast.error("Upload a main image first!");
    try {
      await axios.patch(`${backendUrl}/api/categories/${cat.id}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Category is now live! ✨");
      fetchCategories();
    } catch (err) {
      toast.error("Activation failed");
    }
  };

  const deactivateCategory = async (id) => {
    try {
      await axios.patch(`${backendUrl}/api/categories/${id}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        params: { isActive: false },
      });
      toast.info("Category hidden from customers");
      fetchCategories();
    } catch (err) {
      toast.error("Deactivation failed");
    }
  };

  const restoreCategory = async (id) => {
    try {
      await axios.patch(`${backendUrl}/api/categories/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Category restored from trash");
      fetchCategories();
    } catch (err) {
      toast.error("Restore failed");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Search & Filter Shell */}
      <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="relative w-full lg:max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name or keyword..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all text-sm font-medium shadow-sm shadow-blue-50/10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
              <select
                value={isActive}
                onChange={(e) => {
                  setIsActive(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent border-none outline-none text-xs font-bold text-gray-600 px-3 py-1 cursor-pointer"
              >
                <option value="">Visibility: All</option>
                <option value="true">Visible</option>
                <option value="false">Hidden</option>
              </select>
              <div className="w-px h-4 bg-gray-200" />
              <select
                value={isDeleted}
                onChange={(e) => {
                  setIsDeleted(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent border-none outline-none text-xs font-bold text-gray-600 px-3 py-1 cursor-pointer"
              >
                <option value="">Trash: Exclude</option>
                <option value="true">Trash: Include</option>
              </select>
            </div>

            <button
              onClick={() => handleEditCategory(null)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 border border-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New
            </button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-4 h-[380px] animate-pulse">
              <div className="w-full h-48 bg-gray-100 rounded-2xl mb-4" />
              <div className="h-6 bg-gray-100 rounded-lg w-3/4 mb-2" />
              <div className="h-4 bg-gray-100 rounded-lg w-1/2 mb-6" />
              <div className="flex gap-2">
                <div className="h-10 bg-gray-100 rounded-xl flex-1" />
                <div className="h-10 bg-gray-100 rounded-xl flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50/30 rounded-3xl border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">No categories found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="group relative bg-white border border-gray-100 rounded-[32px] p-4 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gray-50 mb-5">
                {cat.mainImage ? (
                  <img
                    src={cat.mainImage.url}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 select-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-widest">No Visual</span>
                  </div>
                )}

                {/* Status Badges on Image */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <div className={`px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter shadow-lg backdrop-blur-md ${cat.isActive ? 'bg-green-500/90 text-white' : 'bg-rose-500/90 text-white'
                    }`}>
                    {cat.isActive ? 'Live' : 'Hidden'}
                  </div>
                  {cat.isDeleted && (
                    <div className="px-3 py-1.5 rounded-2xl bg-gray-900/90 text-white text-[10px] font-black uppercase tracking-tighter shadow-lg backdrop-blur-md">
                      In Trash
                    </div>
                  )}
                </div>
              </div>

              {/* Text Info */}
              <div className="px-1 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-gray-900 text-lg leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                    ID: {cat.id}
                  </span>
                </div>
                <p className="text-gray-500 text-sm font-medium line-clamp-2 leading-relaxed h-[40px]">
                  {cat.description || "Establish a new frontier of organization for this category."}
                </p>
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewCategory(cat)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-2xl text-xs font-bold transition-all border border-transparent hover:border-blue-100"
                >
                  Inspect
                </button>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleEditCategory(cat)}
                    className="p-2.5 bg-gray-50 hover:bg-amber-50 text-gray-600 hover:text-amber-600 rounded-2xl transition-all"
                    title="Edit Details"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>

                  {cat.isActive ? (
                    <button
                      onClick={() => deactivateCategory(cat.id)}
                      className="p-2.5 bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-600 rounded-2xl transition-all"
                      title="Hide Category"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => activateCategory(cat)}
                      className="p-2.5 bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-600 rounded-2xl transition-all"
                      title="Go Live"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}

                  {!cat.isDeleted ? (
                    <button
                      onClick={() => setDeleteId(cat.id)}
                      className="p-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-2xl transition-all"
                      title="Move to Trash"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => restoreCategory(cat.id)}
                      className="p-2.5 bg-green-50 hover:bg-green-600 text-green-600 hover:text-white rounded-2xl transition-all"
                      title="Restore from Trash"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Shell */}
      {!loading && totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <div className="inline-flex items-center gap-2 p-1.5 bg-white border border-gray-100 rounded-[28px] shadow-sm">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex px-4 items-center">
              <span className="text-sm font-black text-gray-900">{page}</span>
              <span className="text-gray-300 mx-2 text-xs font-bold">/</span>
              <span className="text-sm font-bold text-gray-400">{totalPages}</span>
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md border border-gray-100 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center mb-6 text-rose-500 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 text-center mb-2 tracking-tight">Move to Trash?</h3>
            <p className="text-gray-500 text-center mb-10 font-medium leading-relaxed px-4">
              This category will be hidden from your store but can be restored later from the trash filters.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-3xl transition-all"
              >
                Keep it
              </button>
              <button
                onClick={() => removeCategory(deleteId)}
                disabled={deleteLoading}
                className={`flex-1 px-4 py-4 shadow-lg shadow-rose-200 border border-rose-600 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-3xl transition-all ${deleteLoading ? "opacity-50" : ""}`}
              >
                {deleteLoading ? "Processing..." : "Trash it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListCategory;
