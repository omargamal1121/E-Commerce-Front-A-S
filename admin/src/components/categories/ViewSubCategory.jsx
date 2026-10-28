import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl, currency } from "../../App";
import { useTranslation } from "react-i18next";

const ViewSubCategory = ({ token, subCategoryId, isActive = null, includeDeleted = true, onUpdateSubCategory }) => {
  const { t } = useTranslation();
  const [subCategory, setSubCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const navigate = useNavigate();

  const triggerUpdate = () => {
    if (!subCategory) return;
    if (typeof onUpdateSubCategory === "function") {
      onUpdateSubCategory(subCategory);
    }
  };

  const fetchSubCategory = useCallback(async () => {
    if (!subCategoryId) return;

    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/subcategories/${subCategoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        const responseData = response.data?.responseBody?.data;
        if (responseData) {
          const subCategoryData = { ...responseData };

          // Normalize subcategory images
          if (subCategoryData.images) {
            subCategoryData.images = subCategoryData.images.map(img => ({
              ...img,
              url: img.url?.startsWith("http") ? img.url : `${backendUrl}/${img.url}`
            }));
          }

          setSubCategory(subCategoryData);
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

  const fetchProducts = useCallback(async () => {
    if (!subCategoryId) return;
    try {
      const response = await axios.get(`${backendUrl}/api/Products/subcategory/${subCategoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 20 }
      });

      if (response.status === 200) {
        const productData = response.data?.responseBody?.data || [];
        const normalizedProducts = productData.map(p => ({
          ...p,
          images: p.images?.map(img => ({
            ...img,
            url: img.url?.startsWith("http") ? img.url : `${backendUrl}/${img.url}`
          })) || []
        }));
        setProducts(normalizedProducts);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setProducts([]);
      } else {
        console.error("❌ Error fetching subcategory products:", err);
      }
    }
  }, [subCategoryId, token]);

  useEffect(() => {
    if (subCategoryId) {
      fetchSubCategory();
      fetchProducts();
    }
  }, [subCategoryId, fetchSubCategory, fetchProducts]);

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
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Control Center */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 md:p-8 flex flex-wrap items-center justify-between gap-6 shadow-xl border border-gray-800">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-blue-400 text-xs font-black uppercase tracking-[0.2em]">Subcategory Node</span>
            <span className="text-gray-500">•</span>
            <span className="text-xs font-bold text-gray-400">ID #{subCategory.id}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{subCategory.name}</h2>
          <div className="flex items-center gap-3 mt-1">
            <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${subCategory.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
              {subCategory.isActive ? "Live" : "Inactive"}
            </div>
            {isDeletedFlag && <div className="px-4 py-1 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-widest border border-white/10">Archived</div>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/collections')}
            className="px-5 py-2.5 bg-white/10 text-white border border-white/15 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-gray-900 transition-all shadow-md"
          >
            ← Back to Categories
          </button>

          {typeof onUpdateSubCategory === "function" && (
            <button
              onClick={triggerUpdate}
              className="px-5 py-2.5 bg-white/10 text-white border border-white/15 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-gray-900 transition-all shadow-md"
            >
              Edit Metadata
            </button>
          )}

          {subCategory.isActive ? (
            <button onClick={() => handleAction('deactivate', 'Subcategory deactivated')} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-xl text-xs font-bold uppercase tracking-wider transition-all font-bold shadow-md">Deactivate</button>
          ) : (
            <button onClick={() => handleAction('activate', 'Subcategory activated')} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-900 rounded-xl text-xs font-bold uppercase tracking-wider transition-all font-bold shadow-md">Activate</button>
          )}

          {!isDeletedFlag ? (
            <button onClick={() => handleAction('delete', 'Subcategory moved to archive')} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all font-bold shadow-md">Delete</button>
          ) : (
            <button onClick={() => handleAction('restore', 'Subcategory restored')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all font-bold shadow-md">Restore</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visual Gallery & Linked Products under image */}
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
                  onClick={() => deleteImage(images[selectedImageIndex].id)}
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

          {/* Connected Products (under image) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-base">🛍️</span>
                <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs">Linked Inventory ({products.length})</h3>
              </div>
              <button
                onClick={() => navigate(`/products?subcategory=${subCategoryId}`)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                View All →
              </button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">No products linked to this subcategory</p>
                <button
                  onClick={() => navigate('/add')}
                  className="mt-2 text-xs font-bold text-blue-600 hover:underline inline-block"
                >
                  + Add Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {products.slice(0, 9).map(product => (
                  <button
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="flex items-center gap-3 bg-gray-50 hover:bg-white p-3 rounded-2xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all text-left group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm shrink-0 border border-gray-100">
                      <img
                        src={product.mainImage?.url || product.productImages?.[0]?.url || product.images?.[0]?.url || ""}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        alt={product.name}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate text-sm group-hover:text-blue-600 transition-colors">{product.name}</p>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">EGP {product.price}</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${product.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"}`} title={product.isActive ? "Active" : "Inactive"} />
                  </button>
                ))}
              </div>
            )}
            {products.length > 9 && (
              <div className="pt-2 text-center border-t border-gray-50">
                <button
                  onClick={() => navigate(`/products?subcategory=${subCategoryId}`)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  +{products.length - 9} more products — View Full Inventory →
                </button>
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
              {subCategory.description || "No description provided for this subcategory."}
            </p>
          </div>

          {/* Metadata Specifications */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Subcategory Specifications</h3>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Unique UID</p>
                <p className="font-black text-gray-900 text-base">#{subCategory.id}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Display Rank</p>
                <p className="font-black text-gray-900 text-base">{subCategory.displayOrder}</p>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Parent Category</p>
                {subCategory.parentCategoryId || subCategory.categoryId ? (
                  <button
                    onClick={() => navigate(`/category/view/${subCategory.parentCategoryId || subCategory.categoryId}`)}
                    className="font-bold text-blue-600 hover:underline text-left text-sm truncate"
                  >
                    {subCategory.parentCategoryName || `Category #${subCategory.parentCategoryId || subCategory.categoryId}`} →
                  </button>
                ) : (
                  <p className="font-bold text-gray-700 text-sm">{subCategory.parentCategoryName || "Root"}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Created At</p>
                <p className="font-bold text-gray-900 text-xs">{new Date(subCategory.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Linked Products</p>
                <p className="font-black text-emerald-600 text-base">{products.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSubCategory;
