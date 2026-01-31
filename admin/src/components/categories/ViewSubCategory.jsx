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
      if (isActive !== null && isActive !== "" && typeof isActive !== "undefined") params.isActive = isActive;
      if (includeDeleted !== null && includeDeleted !== "" && typeof includeDeleted !== "undefined") params.includeDeleted = includeDeleted;

      const response = await axios.get(`${backendUrl}/api/subcategories/${subCategoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.status === 200) {
        const responseData = response.data?.responseBody?.data;
        if (responseData) {
          const { products: subCategoryProducts, ...subCategoryData } = responseData;

          // Normalize subcategory images
          if (subCategoryData.images) {
            subCategoryData.images = subCategoryData.images.map(img => ({
              ...img,
              url: img.url?.startsWith("http") ? img.url : `${backendUrl}/${img.url}`
            }));
          }

          setSubCategory(subCategoryData);

          if (Array.isArray(subCategoryProducts)) {
            // Normalize product images
            const normalizedProducts = subCategoryProducts.map(p => ({
              ...p,
              images: p.images?.map(img => ({
                ...img,
                url: img.url?.startsWith("http") ? img.url : `${backendUrl}/${img.url}`
              }))
            }));
            setProducts(normalizedProducts);
          }
        } else {
          setSubCategory(null);
        }
        setError(null);
      }
    } catch (err) {
      console.error("❌ Error fetching subcategory:", err);
      setError(err.response?.data?.message || "Failed to retrieve node intelligence.");
    } finally {
      setLoading(false);
    }
  }, [subCategoryId, token, isActive, includeDeleted]);

  useEffect(() => {
    if (subCategoryId) fetchSubCategory();
  }, [subCategoryId, fetchSubCategory]);

  const handleAction = async (action, successMsg) => {
    if (!subCategory) return;
    setActionLoading(true);
    try {
      const endpoint = action === 'delete' ? '' : `/${action}`;
      const method = action === 'delete' ? 'delete' : 'patch';

      await axios[method](`${backendUrl}/api/subcategories/${subCategory.id}${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(successMsg);
      await fetchSubCategory();
    } catch (err) {
      toast.error(err.response?.data?.message || `${action} operation failed`);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteImage = async (id, isMain = false) => {
    if (!subCategory || !id) return;
    setActionLoading(true);
    try {
      await axios.delete(`${backendUrl}/api/subcategories/${subCategory.id}/images/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Visual asset decommissioned");
      await fetchSubCategory();
      setSelectedImageIndex(0);
    } catch (err) {
      toast.error("Asset removal failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (!subCategoryId) return (
    <div className="py-20 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-[48px] border-2 border-dashed border-gray-100">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="font-black uppercase tracking-widest text-[10px]">Awaiting Node Sequence</p>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="h-10 bg-gray-100 rounded-2xl w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 h-[400px] bg-gray-100 rounded-[48px]" />
      </div>
    </div>
  );

  if (error) return (
    <div className="py-20 flex flex-col items-center justify-center text-rose-500 bg-rose-50/30 rounded-[48px] border border-rose-100">
      <p className="font-black uppercase tracking-widest text-[10px] mb-2">System Error</p>
      <p className="font-bold text-lg">{error}</p>
    </div>
  );

  if (!subCategory) return null;

  const images = subCategory.images || [];
  const isDeletedFlag = !!(subCategory.isDeleted || subCategory.deleted || subCategory.deletedAt);

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Action Command Center */}
      <div className="bg-gray-900 rounded-[40px] p-8 flex flex-wrap items-center justify-between gap-6 shadow-2xl shadow-gray-200">
        <div className="flex flex-col gap-1">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">Node Intelligence</p>
          <h2 className="text-3xl font-black text-white">{subCategory.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${subCategory.isActive ? "bg-green-500/10 text-green-400" : "bg-rose-500/10 text-rose-400"}`}>
              {subCategory.isActive ? "Live Sequence" : "Paused Sequence"}
            </div>
            {isDeletedFlag && <div className="px-4 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest">In Warehouse Archive</div>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {subCategory.isActive ? (
            <button onClick={() => handleAction('deactivate', 'Sequence paused')} className="px-6 py-3 bg-amber-500 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all">Pause Node</button>
          ) : (
            <button onClick={() => handleAction('activate', 'Sequence launched')} className="px-6 py-3 bg-green-500 text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-green-400 transition-all">Launch Node</button>
          )}

          {!isDeletedFlag ? (
            <button onClick={() => handleAction('delete', 'Moved to archive')} className="px-6 py-3 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 transition-all">Archive</button>
          ) : (
            <button onClick={() => handleAction('restore', 'Restored to grid')} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all">Restore</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Visual Matrix */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="relative aspect-square sm:aspect-video rounded-[48px] overflow-hidden bg-gray-50 border border-gray-100 group shadow-lg">
            {images[selectedImageIndex] ? (
              <img src={images[selectedImageIndex].url} className="w-full h-full object-contain p-8" alt="Asset Preview" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-xs">No Visual Data</div>
            )}

            {images[selectedImageIndex] && (
              <button
                onClick={() => deleteImage(images[selectedImageIndex].id)}
                className="absolute top-6 right-6 p-4 bg-white/80 backdrop-blur-md text-rose-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-rose-600 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {images.length > 1 && (
              <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                <button onClick={() => setSelectedImageIndex(i => (i === 0 ? images.length - 1 : i - 1))} className="p-4 bg-white/80 backdrop-blur-md rounded-2xl pointer-events-auto shadow-xl hover:bg-blue-600 hover:text-white transition-all">←</button>
                <button onClick={() => setSelectedImageIndex(i => (i === images.length - 1 ? 0 : i + 1))} className="p-4 bg-white/80 backdrop-blur-md rounded-2xl pointer-events-auto shadow-xl hover:bg-blue-600 hover:text-white transition-all">→</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative aspect-square rounded-[24px] overflow-hidden border-4 transition-all ${selectedImageIndex === idx ? "border-blue-600 scale-105 shadow-xl" : "border-white hover:border-gray-100 shadow-sm"}`}
              >
                <img src={img.url} className="w-full h-full object-cover" alt="Thumbnail" />
                {img.isMain && <div className="absolute bottom-2 inset-x-2 bg-blue-600 text-white text-[8px] font-black uppercase text-center py-1 rounded-lg">Main</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Intelligence Schema */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Narrative Overview</p>
              <p className="text-gray-600 font-medium leading-relaxed">{subCategory.description || "Node sequence narrative is not defined in current protocol."}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-50">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Node Identifier</p>
                <p className="font-black text-gray-900 tracking-tight">#{subCategory.id}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Primary Root</p>
                <p className="font-black text-gray-900 tracking-tight">#{subCategory.categoryId}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Display Priority</p>
                <p className="font-black text-gray-900 tracking-tight">{subCategory.displayOrder}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Initialization</p>
                <p className="font-black text-gray-900 tracking-tight text-xs">{new Date(subCategory.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Child Node Grid (Products) */}
          <div className="bg-gray-50/50 rounded-[40px] p-8 border border-gray-100 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Connected Child Nodes ({products.length})</h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">Expand Logic</button>
            </div>

            <div className="flex flex-col gap-3">
              {products.slice(0, 5).map(product => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 hover:shadow-lg transition-all text-left"
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden shadow-sm shrink-0">
                    <img src={product.images?.[0]?.url || ""} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 truncate text-sm">{product.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Valuation: ${product.price}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${product.isActive ? "bg-green-500" : "bg-rose-500 shadow-rose-200 shadow-lg"}`} />
                </button>
              ))}
              {products.length > 5 && <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 py-2">And {products.length - 5} additional nodes...</p>}
              {products.length === 0 && <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 py-6">No child nodes detected.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSubCategory;
