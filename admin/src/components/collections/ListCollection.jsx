import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";
import { useNavigate } from "react-router-dom";

const ListCollection = ({
  token,
  collections,
  setCollections,
  setActiveTab,
  handleEditCollection,
  handleViewCollection,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [isDeleted, setIsDeleted] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/Collection`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: search || undefined,
          isActive: isActive || undefined,
          isDeleted: isDeleted || undefined,
          page,
          pageSize,
        },
      });

      const cols = res.data?.responseBody?.data || [];
      const totalCount = res.data?.responseBody?.totalCount || cols.length;

      const normalized = cols.map((col) => {
        let mainImg = col.images?.find((i) => i.isMain) || col.images?.[0] || null;
        let imgUrl = null;
        if (mainImg) {
          if (mainImg.url) {
            imgUrl = mainImg.url.startsWith("https") ? mainImg.url : `${backendUrl}${mainImg.url.startsWith('/') ? '' : '/'}${mainImg.url}`;
          } else if (mainImg.filePath) {
            imgUrl = `${backendUrl}/${mainImg.filePath}`;
          }
        }
        return { ...col, mainImage: { url: imgUrl }, wasDeleted: col.isDeleted || false };
      });

      setCollections(normalized);
      setTotalPages(Math.ceil(totalCount / pageSize));
    } catch (err) {
      console.error("Error fetching collections:", err);
      toast.error("Failed to load inventory repository");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [token, search, isActive, isDeleted, page, pageSize]);

  const removeCollection = async (id) => {
    try {
      setDeleteLoading(true);
      await axios.delete(`${backendUrl}/api/Collection/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCollections((prev) =>
        prev.map((col) =>
          col.id === id ? { ...col, isDeleted: true, wasDeleted: true } : col
        )
      );
      toast.success("Collection moved to internal archive");
    } catch (error) {
      toast.error("Archive operation failed");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const restoreCollection = async (id) => {
    try {
      await axios.patch(
        `${backendUrl}/api/Collection/Restore/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Collection restored to active registry");
      fetchCollections();
    } catch (error) {
      toast.error("Restoration sequence failed");
    }
  };

  const toggleStatus = async (col) => {
    if (!col.mainImage && !col.isActive) return toast.error("Headshot required for activation");

    try {
      const endpoint = col.isActive ? "deactivate" : "activate";
      await axios.patch(
        `${backendUrl}/api/Collection/${endpoint}/${col.id}`,
        null,
        { headers: { Authorization: `Bearer ${token}`, Accept: "text/plain" } }
      );
      toast.success(col.isActive ? "Collection cached" : "Collection deployed");
      fetchCollections();
    } catch (error) {
      toast.error("State transition failed");
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Dynamic Filter Sub-system */}
      <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100 backdrop-blur-sm flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="relative w-full lg:max-w-md group">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-rose-50/50 focus:border-rose-400 outline-none transition-all text-sm font-medium shadow-sm"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
            <select
              value={isActive}
              onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
              className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-gray-500 px-4 py-2 cursor-pointer"
            >
              <option value="">Status: All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <div className="w-px h-4 bg-gray-100" />
            <select
              value={isDeleted}
              onChange={(e) => { setIsDeleted(e.target.value); setPage(1); }}
              className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-gray-500 px-4 py-2 cursor-pointer"
            >
              <option value="">Show: All</option>
              <option value="false">Show: not Deleted</option>
              <option value="true">Show: Deleted</option>
            </select>
          </div>

          <button
            onClick={() => handleEditCollection(null)}
            className="flex items-center gap-2 px-8 py-3.5 bg-rose-600 text-white rounded-2xl text-sm font-black hover:bg-rose-700 transition-all shadow-xl shadow-rose-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Collection
          </button>
        </div>
      </div>

      {/* Grid of Collection Nodes */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[4/5] bg-gray-50 rounded-[40px] animate-pulse" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-gray-50/30 rounded-[48px] border border-dashed border-gray-200">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-gray-900">No collections found</h3>
          <p className="text-gray-500 mt-2 font-medium">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              className="group relative bg-white border border-gray-100 rounded-[40px] p-5 hover:border-rose-200 hover:shadow-2xl hover:shadow-rose-500/5 transition-all duration-500 flex flex-col"
            >
              {/* Image Hub */}
              <div className="relative aspect-square rounded-[32px] overflow-hidden bg-gray-50 mb-6">
                {col.mainImage && col.mainImage.url ? (
                  <img
                    src={col.mainImage.url}
                    alt={col.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
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
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg ${col.isActive ? 'bg-green-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                    {col.isActive ? 'Active' : 'Inactive'}
                  </div>
                  {(col.isDeleted || col.wasDeleted) && (
                    <div className="px-4 py-1.5 rounded-full bg-gray-900/90 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg">
                      Deleted
                    </div>
                  )}
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                  <button
                    onClick={() => handleViewCollection(col)}
                    className="flex-1 py-3 bg-white hover:bg-gray-900 text-gray-900 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEditCollection(col)}
                    className="p-3 bg-white hover:bg-amber-500 text-gray-900 hover:text-white rounded-2xl transition-all shadow-xl"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Data Field */}
              <div className="flex flex-col gap-1 px-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-gray-900 text-lg leading-tight line-clamp-1 group-hover:text-rose-600 transition-colors">
                    {col.name}
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400">#{col.id}</span>
                </div>
                <p className="text-gray-500 text-xs font-medium line-clamp-2 leading-relaxed h-[32px] mt-1 mb-6">
                  {col.description || "No description available."}
                </p>

                {/* Bottom Control Bar */}
                <div className="mt-auto flex items-center gap-2 border-t border-gray-50 pt-5">
                  <button
                    onClick={() => toggleStatus(col)}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${col.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white" : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white"}`}
                  >
                    {col.isActive ? "Deactivate" : "Activate"}
                  </button>

                  <div className="flex gap-1.5">
                    {!col.isDeleted ? (
                      <button
                        onClick={() => setDeleteId(col.id)}
                        className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => restoreCollection(col.id)}
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
          ))}
        </div>
      )}

      {/* Pagination Command Bar */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-12 pb-10">
          <div className="inline-flex items-center gap-2 p-2 bg-white border border-gray-100 rounded-full shadow-lg">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-3 rounded-full hover:bg-gray-100 disabled:opacity-20 transition-all text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex items-center px-4">
              <span className="text-sm font-black text-gray-900">{page}</span>
              <span className="mx-2 text-gray-300 font-bold text-xs">/</span>
              <span className="text-sm font-bold text-gray-400">{totalPages}</span>
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-3 rounded-full hover:bg-gray-100 disabled:opacity-20 transition-all text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Archive Verification Shell */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-md z-[100] p-4">
          <div className="bg-white p-10 rounded-[48px] shadow-2xl w-full max-w-md border border-gray-100 text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-rose-50 rounded-[32px] flex items-center justify-center text-rose-500 mx-auto mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Delete Collection?</h3>
            <p className="text-gray-500 font-medium mb-10 leading-relaxed px-4">
              This collection will be removed from the store.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-3xl font-black text-sm hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => removeCollection(deleteId)}
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

export default ListCollection;
