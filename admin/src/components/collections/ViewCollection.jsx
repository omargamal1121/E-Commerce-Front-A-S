import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../../App";
import { useNavigate } from "react-router-dom";

const ViewCollection = ({ token, collectionId, isActive = null, includeDeleted = null }) => {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const navigate = useNavigate();

  const fetchCollection = useCallback(async () => {
    if (!collectionId) return;

    setLoading(true);
    try {
      const params = {};
      if (isActive !== null && isActive !== "" && typeof isActive !== "undefined") params.isActive = isActive;
      if (includeDeleted !== null && includeDeleted !== "" && typeof includeDeleted !== "undefined") params.includeDeleted = includeDeleted;

      const response = await axios.get(`${backendUrl}/api/Collection/${collectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.status === 200) {
        const col = response.data?.responseBody?.data || null;
        if (col) {
          if (col.images) {
            col.images = col.images.map(img => ({
              ...img,
              url: img.url?.startsWith("http") ? img.url : `${backendUrl}/${img.url}`
            }));
          }
          if (col.products) {
            col.products = col.products.map(p => ({
              ...p,
              productImages: p.productImages?.map(img => ({
                ...img,
                url: img.url?.startsWith("http") ? img.url : `${backendUrl}/${img.url}`
              })) || [],
              mainImage: p.mainImage ? {
                ...p.mainImage,
                url: p.mainImage.url?.startsWith("http") ? p.mainImage.url : `${backendUrl}/${p.mainImage.url}`
              } : null,
              images: p.images?.map(img => ({
                ...img,
                url: img.url?.startsWith("http") ? img.url : `${backendUrl}/${img.url}`
              })) || []
            }));
          }
        }
        setCollection(col);
        setError(null);
      }
    } catch (err) {
      console.error("❌ Error fetching collection:", err);
      setError(err.response?.data?.message || "Failed to retrieve node intelligence.");
    } finally {
      setLoading(false);
    }
  }, [collectionId, token, isActive, includeDeleted]);

  useEffect(() => {
    if (collectionId) fetchCollection();
  }, [collectionId, fetchCollection]);

  const handleAction = async (action, successMsg) => {
    if (!collection) return;
    setActionLoading(true);
    try {
      const endpoint = action === 'delete' ? '' : `/${action}`;
      const method = action === 'delete' ? 'delete' : 'patch';

      await axios[method](`${backendUrl}/api/Collection${endpoint}/${collection.id}`,
        action === 'delete' ? { headers: { Authorization: `Bearer ${token}` } } : {},
        { headers: { Authorization: `Bearer ${token}` }, params: action === 'deactivate' ? { isActive: false } : {} }
      );

      toast.success(successMsg);
      await fetchCollection();
    } catch (err) {
      toast.error(`${action.charAt(0).toUpperCase() + action.slice(1)} sequence failed`);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteImage = async (imageId) => {
    if (!collection || !imageId) return;
    if (!window.confirm("Permanently decommission this visual asset?")) return;

    setActionLoading(true);
    try {
      await axios.delete(`${backendUrl}/api/Collection/${collection.id}/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/plain' }
      });
      toast.success("Visual asset decommissioned");
      await fetchCollection();
      setSelectedImageIndex(0);
    } catch (err) {
      toast.error("Asset decommissioning failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (!collectionId) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
      <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="font-black uppercase tracking-widest text-xs">Node initialization pending search parameters</p>
    </div>
  );

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-center"><div className="h-10 bg-gray-100 rounded-2xl w-1/3" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[400px] bg-gray-100 rounded-[48px]" />
        <div className="space-y-4"><div className="h-6 bg-gray-100 rounded w-full" /><div className="h-6 bg-gray-100 rounded w-full" /></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-rose-50 border border-rose-100 p-8 rounded-[32px] flex flex-col items-center gap-4">
      <div className="text-rose-500 font-black text-center">{error}</div>
      <button onClick={fetchCollection} className="px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Retry Synchronization</button>
    </div>
  );

  if (!collection) return null;

  const images = collection.images || [];

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Schematic Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{collection.name}</h2>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${collection.isActive ? "bg-green-500 text-white" : "bg-rose-500 text-white"}`}>
              {collection.isActive ? "Live projection" : "Internal Cache"}
            </div>
          </div>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">Deployment UID: {collection.id}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {collection.isActive ? (
            <button
              onClick={() => handleAction('deactivate', 'Deployment paused')}
              className="p-4 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-[24px] transition-all shadow-xl shadow-amber-100 group"
              title="Pause Projection"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => handleAction('activate', 'Deployment synchronized')}
              className="p-4 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-[24px] transition-all shadow-xl shadow-green-100 group"
              title="Resume Projection"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => handleAction('Restore', 'Node restored')}
            className="p-4 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-[24px] transition-all shadow-xl shadow-blue-100 group"
            title="Restore Structure"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => handleAction('delete', 'Moved to archive')}
            className="p-4 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-[24px] transition-all shadow-xl shadow-rose-100 group"
            title="Archive Node"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Visual Matrix */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-gray-50 rounded-[48px] p-10 border border-gray-100">
            {images.length > 0 ? (
              <div className="flex flex-col gap-8">
                <div className="relative group aspect-square bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-gray-200 border border-gray-50">
                  <img src={images[selectedImageIndex].url} className="w-full h-full object-cover" alt="Focus Asset" />
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => deleteImage(images[selectedImageIndex].id)}
                      className="p-4 bg-rose-600 text-white rounded-[20px] shadow-xl hover:scale-110 transition-all font-black"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {images[selectedImageIndex].isMain && (
                    <div className="absolute top-6 left-6 px-4 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                      Hero Asset
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="grid grid-cols-5 gap-3">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`aspect-square rounded-[18px] border-2 transition-all overflow-hidden ${selectedImageIndex === idx ? "border-rose-600 ring-4 ring-rose-50" : "border-transparent hover:border-gray-200"}`}
                      >
                        <img src={img.url} className="w-full h-full object-cover" alt="thumbnail" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square flex flex-col items-center justify-center text-gray-300 gap-4 font-black">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="uppercase tracking-widest text-xs">No Visual Materials Found</p>
              </div>
            )}
          </div>
        </div>

        {/* Intelligence Data Matrix */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Node Priority</h3>
              <p className="text-3xl font-black text-gray-900">{collection.displayOrder || "Default"}</p>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Chronicle</h3>
              <p className="text-xs font-bold text-gray-500">INIT: {new Date(collection.createdAt).toLocaleDateString()}</p>
              <p className="text-xs font-bold text-gray-500">EVOLVE: {new Date(collection.modifiedAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col gap-6 flex-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Narrative</h3>
            <p className="text-gray-600 font-medium leading-[1.8] text-lg">
              {collection.description || "Schematic narrative missing for this aggregate. Deploy metadata for enhanced indexing."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Connected Units</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        </div>

        {/* Child Node Matrix (Products) */}
        <div className="lg:col-span-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              Associated Units
              <span className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-xs font-black">{(collection.products || []).length}</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {(collection.products || []).map((product) => {
              const mainImg = product.productImages?.find(img => img.isMain)?.url || product.mainImage?.url || (product.images && product.images[0]?.url);
              return (
                <div key={product.id} onClick={() => navigate(`/products/${product.id}`)} className="group cursor-pointer">
                  <div className="aspect-[3/4] rounded-[24px] overflow-hidden bg-gray-50 border border-transparent group-hover:border-rose-200 group-hover:shadow-xl transition-all duration-500">
                    <img src={mainImg} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                  </div>
                  <h4 className="mt-3 text-[11px] font-black text-gray-900 group-hover:text-rose-600 transition-colors uppercase tracking-wider line-clamp-1 px-1">{product.name}</h4>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCollection;