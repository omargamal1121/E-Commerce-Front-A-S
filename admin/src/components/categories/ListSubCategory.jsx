import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { backendUrl } from "../../App";

const ListSubCategory = ({
  token,
  categories,
  setActiveTab,
  handleEditSubCategory,
  handleViewSubCategory,
}) => {
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [isDeleted, setIsDeleted] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pageSize, setPageSize] = useState(12);
  const [subcategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSubCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/subcategories`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          key: search || undefined,
          isActive: isActive === "" ? undefined : isActive === "true",
          includeDeleted: isDeleted === "" ? undefined : isDeleted === "true",
          page,
          pageSize,
        },
      });

      if (res.data?.responseBody) {
        const subCats = res.data.responseBody.data || [];
        const totalCount = res.data.responseBody.totalCount || subCats.length;

        const normalized = subCats.map((sc) => {
          const mainImg = sc.mainImage || sc.images?.find((i) => i.isMain) || sc.images?.[0] || null;
          let imgUrl = null;

          const normalizeUrl = (raw) => {
            if (!raw || typeof raw !== "string") return null;
            if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
            const cleanPath = raw.startsWith("/") ? raw.substring(1) : raw;
            const baseUrl = backendUrl.endsWith("/") ? backendUrl : `${backendUrl}/`;
            return `${baseUrl}${cleanPath}`;
          };

          if (mainImg) {
            imgUrl =
              normalizeUrl(mainImg.url) ||
              normalizeUrl(mainImg.filePath) ||
              normalizeUrl(mainImg.imageUrl) ||
              normalizeUrl(mainImg.path) ||
              (typeof mainImg === "string" ? normalizeUrl(mainImg) : null);
          }

          if (!imgUrl) {
            imgUrl =
              normalizeUrl(sc.mainImageUrl) ||
              normalizeUrl(sc.imageUrl) ||
              normalizeUrl(sc.thumbnailUrl) ||
              normalizeUrl(sc.mainImage?.url) ||
              normalizeUrl(sc.image?.url) ||
              (typeof sc.mainImage === "string" ? normalizeUrl(sc.mainImage) : null) ||
              (typeof sc.image === "string" ? normalizeUrl(sc.image) : null);
          }

          return {
            ...sc,
            mainImageUrl: imgUrl,
            deleted: !!sc.deletedAt,
          };
        });

        setSubCategories(normalized);
        setTotalPages(Math.ceil(totalCount / pageSize));
      }
    } catch (error) {
      toast.error("Failed to load subcategories");
    } finally {
      setLoading(false);
    }
  }, [token, search, isActive, isDeleted, page, pageSize]);

  useEffect(() => {
    if (token) fetchSubCategories();
  }, [token, fetchSubCategories]);

  const removeSubCategory = async (id) => {
    setDeleteLoading(true);
    try {
      await axios.delete(`${backendUrl}/api/subcategories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubCategories((prev) =>
        prev.map((sc) => (sc.id === id ? { ...sc, deleted: true } : sc))
      );
      toast.success("Subcategory deleted successfully");
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const toggleActivation = async (subCat) => {
    if (!subCat.isActive && !subCat.mainImageUrl) return toast.error("Image required for activation");

    try {
      const endpoint = subCat.isActive ? "deactivate" : "activate";
      await axios.patch(`${backendUrl}/api/subcategories/${subCat.id}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(subCat.isActive ? "Subcategory deactivated" : "Subcategory activated");
      fetchSubCategories();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleRestore = async (id) => {
    try {
      await axios.patch(`${backendUrl}/api/subcategories/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Subcategory restored");
      fetchSubCategories();
    } catch {
      toast.error("Restore failed");
    }
  };

  const getParentName = (categoryId) => {
    return categories.find((cat) => cat.id === categoryId)?.name || "Primary Root";
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Search & Filter Shell */}
      <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 flex-1">
          <div className="relative flex-1 min-w-[280px]">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-white border border-gray-200 rounded-2xl px-12 py-3.5 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium text-gray-700"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={isActive}
            onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-widest text-gray-500 focus:ring-4 focus:ring-blue-50 outline-none"
          >
            <option value="">Status: All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <select
            value={isDeleted}
            onChange={(e) => { setIsDeleted(e.target.value); setPage(1); }}
            className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-widest text-gray-500 focus:ring-4 focus:ring-blue-50 outline-none"
          >
            <option value="">Show: All</option>
            <option value="true">Show: Deleted</option>
            <option value="false">Show: not Deleted</option>
          </select>
        </div>

        <button
          onClick={() => setActiveTab("add-sub")}
          className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl text-sm font-black shadow-lg shadow-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Create Subcategory
        </button>
      </div>

      {/* Grid of Segments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 pb-10 min-h-[400px]">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-50 rounded-[40px] animate-pulse" />
          ))
        ) : subcategories.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
            <p className="font-bold text-lg">No subcategories found.</p>
            <button onClick={() => { setSearch(""); setIsActive(""); setIsDeleted(""); }} className="text-blue-600 text-xs font-black uppercase mt-2 tracking-widest">Clear Filters</button>
          </div>
        ) : (
          subcategories.map((subCat) => (
            <div
              key={subCat.id}
              className="group relative bg-white border border-gray-100 rounded-[40px] p-5 hover:border-blue-200 hover:shadow-2xl transition-all duration-500 flex flex-col"
            >
              {/* Image Hub */}
              <div className="relative aspect-square rounded-[32px] overflow-hidden bg-gray-50 mb-6">
                {subCat.mainImageUrl ? (
                  <img
                    src={subCat.mainImageUrl}
                    alt={subCat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 select-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">No Image</span>
                  </div>
                )}

                {/* Status Overlays */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg ${subCat.isActive ? 'bg-green-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                    {subCat.isActive ? 'Active' : 'Inactive'}
                  </div>
                  {subCat.deleted && (
                    <div className="px-4 py-1.5 rounded-full bg-gray-900/90 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg">
                      Deleted
                    </div>
                  )}
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                  <button
                    onClick={() => handleViewSubCategory(subCat)}
                    className="flex-1 py-3 bg-white hover:bg-gray-900 text-gray-900 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => handleEditSubCategory(subCat)}
                    className="p-3 bg-white hover:bg-amber-500 text-gray-900 hover:text-white rounded-2xl transition-all shadow-xl"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Data Field */}
              <div className="flex flex-col gap-1 px-1 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 line-clamp-1">
                  Parent: {getParentName(subCat.parentCategoryId || subCat.categoryId)}
                </p>
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-gray-900 text-lg leading-tight line-clamp-1">{subCat.name}</h3>
                  <span className="text-[10px] font-bold text-gray-400">#{subCat.id}</span>
                </div>
                <p className="text-gray-500 text-xs font-medium line-clamp-2 leading-relaxed h-[32px] mt-1 mb-6">
                  {subCat.description || "No description available."}
                </p>

                {/* Bottom Control Bar */}
                <div className="mt-auto flex items-center gap-2 border-t border-gray-50 pt-5">
                  <button
                    onClick={() => toggleActivation(subCat)}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${subCat.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white" : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white"}`}
                  >
                    {subCat.isActive ? "Deactivate" : "Activate"}
                  </button>

                  <div className="flex gap-1.5">
                    {!subCat.deleted ? (
                      <button
                        onClick={() => setDeleteId(subCat.id)}
                        className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestore(subCat.id)}
                        className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="Restore"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modern Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Pagination</p>
          <div className="flex items-center gap-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 disabled:opacity-30 transition-all font-bold text-gray-600"
            >
              ← Prev
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === i + 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "hover:bg-gray-50 text-gray-400"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 disabled:opacity-30 transition-all font-bold text-gray-600"
            >
              Next →
            </button>
          </div>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="p-3 bg-gray-50 border-none rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 focus:ring-0"
          >
            <option value={12}>12 Rows</option>
            <option value={24}>24 Rows</option>
            <option value={48}>48 Rows</option>
          </select>
        </div>
      )}

      {/* Action Confirmation Shell */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[48px] shadow-2xl w-full max-w-[440px] border border-gray-100 text-center flex flex-col gap-6">
            <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center text-rose-500 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Delete Subcategory?</h3>
              <p className="text-gray-500 font-medium mt-2 leading-relaxed">
                This subcategory will be removed from the store.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-3xl font-black text-sm hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => removeSubCategory(deleteId)}
                disabled={deleteLoading}
                className="flex-1 py-4 bg-rose-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListSubCategory;
