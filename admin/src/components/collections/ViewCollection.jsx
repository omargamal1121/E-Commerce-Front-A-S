import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../../App";
import { useNavigate } from "react-router-dom";

const ViewCollection = ({ token, collectionId, isActive = null, includeDeleted = null, onUpdateCollection }) => {
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
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

  const fetchProductsByCollection = useCallback(async () => {
    if (!collectionId) return;
    try {
      const response = await axios.get(`${backendUrl}/api/Collection/${collectionId}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        const productData = response.data?.responseBody?.data || [];
        const normalizedProducts = productData.map(p => ({
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
        setProducts(normalizedProducts);
      }
    } catch (err) {
      console.error("❌ Error fetching collection products:", err);
    }
  }, [collectionId, token]);

  useEffect(() => {
    if (collectionId) {
      fetchCollection();
      fetchProductsByCollection();
    }
  }, [collectionId, fetchCollection, fetchProductsByCollection]);

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

  const removeProductFromCollection = async (productId) => {
    if (!collection || !productId) return;
    if (!window.confirm("Remove this product from the collection?")) return;

    setActionLoading(true);
    try {
      await axios.delete(`${backendUrl}/api/Collection/${collection.id}/products`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { productIds: [productId] }
      });
      toast.success("Product detached from collection 🔗");
      await fetchProductsByCollection();
    } catch (err) {
      toast.error("Failed to detach product");
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
  const isDeletedFlag = !!(collection.isDeleted || collection.deleted || collection.deletedAt);
  return (
    <div className="flex flex-col gap-16 animate-in slide-in-from-bottom-6 duration-1000">
      {/* Control Center Header */}
      <div className="bg-gray-900 rounded-[50px] p-10 flex flex-wrap items-center justify-between gap-8 shadow-2xl shadow-gray-200 border border-gray-800">
        <div className="flex flex-col gap-2">
          <p className="text-rose-400 text-xs font-black uppercase tracking-[0.3em] mb-1">Collection Management</p>
          <h2 className="text-5xl font-black text-white tracking-tighter">{collection.name}</h2>
          <div className="flex items-center gap-4 mt-4">
            <div className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest ${collection.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
              {collection.isActive ? "Live" : "Inactive"}
            </div>
            {isDeletedFlag && <div className="px-6 py-2 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-widest border border-white/10">Archived</div>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {collection.isActive ? (
            <button onClick={() => handleAction('deactivate', 'Deployment paused')} className="px-8 py-4 bg-amber-500 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all font-bold shadow-lg">Deactivate</button>
          ) : (
            <button onClick={() => handleAction('activate', 'Deployment synchronized')} className="px-8 py-4 bg-emerald-500 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all font-bold shadow-lg">Activate</button>
          )}
          {!isDeletedFlag ? (
            <button onClick={() => handleAction('delete', 'Moved to archive')} className="px-8 py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 transition-all font-bold shadow-lg">Delete</button>
          ) : (
            <button onClick={() => handleAction('restore', 'Node restored')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all font-bold shadow-lg">Restore</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Gallery / Media Panel */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="relative aspect-square sm:aspect-video rounded-[56px] overflow-hidden bg-white border border-gray-100 group shadow-sm transition-all hover:bg-gray-50/20">
            {images[selectedImageIndex] ? (
              <img src={images[selectedImageIndex].url} className="w-full h-full object-contain p-2" alt="Collection Asset" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-sm">No Primary Media</div>
            )}

            {images[selectedImageIndex] && !actionLoading && (
              <button
                onClick={() => deleteImage(images[selectedImageIndex].id)}
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
                className={`relative aspect-square rounded-[28px] overflow-hidden border-4 transition-all ${selectedImageIndex === idx ? "border-rose-600 scale-105 shadow-2xl" : "border-white hover:border-gray-100 shadow-sm"}`}
              >
                <img src={img.url} className="w-full h-full object-cover" alt="Thumbnail" />
                {img.isMain && <div className="absolute bottom-3 inset-x-3 bg-rose-600 text-white text-[9px] font-black uppercase text-center py-1.5 rounded-xl">Hero</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Data / Info Panel */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-white rounded-[50px] p-12 border border-gray-100 shadow-sm flex flex-col gap-10">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Inventory Narrative</p>
              <p className="text-gray-600 font-medium leading-relaxed text-lg">{collection.description || "Establish a new thematic frontier for this collection."}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-10 border-t border-gray-50">
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Unique UID</p>
                <p className="font-black text-gray-900 tracking-tight text-xl">#{collection.id}</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Created At</p>
                <p className="font-black text-gray-900 tracking-tight text-sm">{new Date(collection.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Last Evolution</p>
                <p className="font-black text-gray-900 tracking-tight text-sm">{new Date(collection.modifiedAt || collection.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Asset Count</p>
                <p className="font-black text-rose-600 tracking-tight text-xl">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-[50px] p-10 border border-gray-100 flex flex-col gap-8 shadow-inner overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Linked Inventory ({products.length})</h3>
              <button onClick={() => navigate(`/products?collection=${collectionId}`)} className="text-[9px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-800 transition-colors">View All →</button>
            </div>

            <div className="flex flex-col gap-4">
              {products.slice(0, 8).map(product => (
                <div key={product.id} className="relative group">
                  <button
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="w-full flex items-center gap-6 bg-white p-4 rounded-3xl border border-gray-100 hover:shadow-xl transition-all text-left group-hover:border-rose-100"
                  >
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-gray-50">
                      <img src={product.mainImage?.url || product.productImages?.[0]?.url || product.images?.[0]?.url || ""} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate text-base group-hover:text-rose-600 transition-colors uppercase tracking-tight">{product.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">EGP {product.price}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full shrink-0 ${product.isActive ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProductFromCollection(product.id);
                    }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-rose-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-rose-700 flex items-center justify-center z-10"
                    title="Remove from Collection"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {products.length > 8 && <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 py-2">+{products.length - 8} deeper layers</p>}
              {products.length === 0 && <p className="text-center text-xs font-bold text-gray-400 py-10 uppercase tracking-widest">No associated assets</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCollection;