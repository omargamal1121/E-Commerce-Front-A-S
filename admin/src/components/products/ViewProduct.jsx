import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";
import { currency } from "../../App";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const PRESET_COLORS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Green", hex: "#008000" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Gray", hex: "#808080" },
  { name: "Navy", hex: "#000080" },
  { name: "Purple", hex: "#800080" },
  { name: "Orange", hex: "#FFA500" },
];

const getColorName = (c) => {
  if (!c) return "—";
  if (!c.startsWith('#')) return c;
  const found = PRESET_COLORS.find(p => p.hex.toLowerCase() === c.toLowerCase());
  return found ? found.name : c;
};

const ViewProduct = ({ token, productId }) => {
  const { t } = useTranslation();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [salesData, setSalesData] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const navigate = useNavigate();

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await API.products.getById(productId, token);
      setProduct(res?.responseBody?.data || null);
    } catch {
      toast.error("Failed to load product details");
    } finally { setLoading(false); }
  }, [productId, token]);

  const fetchVariants = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await API.variants.getByProductId(productId, token);
      setVariants(res?.responseBody?.data || []);
    } catch (e) {
      if (e.response?.status === 404) setVariants([]);
      else console.error("Failed to load variants", e);
    }
  }, [productId, token]);

  const fetchSales = useCallback(async () => {
    if (!productId) return;
    setLoadingSales(true);
    try {
      const res = await API.products.getSales(productId, token);
      setSalesData(res?.responseBody?.data || null);
    } catch (e) {
      if (e.response?.status === 404) setSalesData(null);
      else toast.error("Failed to load sales data");
    } finally { setLoadingSales(false); }
  }, [productId, token]);

  const fetchCollections = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await API.products.getCollections(productId, token);
      setCollections(res?.responseBody?.data || []);
    } catch (e) {
      if (e.response?.status === 404) setCollections([]);
      else console.error("Failed to load product collections", e);
    }
  }, [productId, token]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchVariants();
      fetchSales();
      fetchCollections();
    }
  }, [productId, fetchProduct, fetchVariants, fetchSales, fetchCollections]);

  const handleDelete = async () => {
    if (!product) return;
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setActionLoading(true);
    try {
      await API.products.delete(product.id, token);
      toast.success("Product deleted");
      fetchProduct();
    } catch { toast.error("Delete failed"); }
    finally { setActionLoading(false); }
  };

  const handleRestore = async () => {
    if (!product) return;
    setActionLoading(true);
    try {
      await API.products.restore(product.id, token);
      toast.success("Product restored");
      fetchProduct();
    } catch { toast.error("Restore failed"); }
    finally { setActionLoading(false); }
  };

  const handleToggleStatus = async () => {
    if (!product) return;
    setActionLoading(true);
    try {
      if (product.isActive) {
        await API.products.deactivate(product.id, token);
        toast.success("Product deactivated");
      } else {
        await API.products.activate(product.id, token);
        toast.success("Product activated");
      }
      fetchProduct();
    } catch { toast.error("Failed to update status"); }
    finally { setActionLoading(false); }
  };

  const handleRemoveDiscount = async () => {
    if (!product) return;
    if (!window.confirm("Are you sure you want to remove the discount from this product?")) return;
    setActionLoading(true);
    try {
      await API.products.removeDiscount(product.id, token);
      toast.success("Discount removed");
      fetchProduct();
    } catch { toast.error("Failed to remove discount"); }
    finally { setActionLoading(false); }
  };

  const removeFromCollection = async (collectionId) => {
    if (!product || !collectionId) return;
    if (!window.confirm("Remove this product from the specified collection?")) return;
    setActionLoading(true);
    try {
      const axios = (await import("axios")).default;
      const { backendUrl } = await import("../../App");
      await axios.delete(`${backendUrl}/api/Collection/${collectionId}/products`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { productIds: [product.id] }
      });
      toast.success("Detached from collection 🔗");
      fetchCollections();
    } catch { toast.error("Detach failed"); }
    finally { setActionLoading(false); }
  };

  if (loading && !product) return (
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

  if (!product) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-4xl">🖼️</div>
      <p className="font-bold">Product Not Found</p>
    </div>
  );

  const isDeleted = product.deletedAt !== null && product.deletedAt !== undefined;
  const images = product.images || [];
  const discountPercent = Number(
    product.discount?.discountPercent ??
    product.discount?.percentage ??
    product.discountPercentage ??
    0
  );
  const hasDiscount = discountPercent > 0;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Control Center Header */}
      <div className={`rounded-3xl p-6 md:p-8 flex flex-wrap items-center justify-between gap-6 shadow-xl border ${isDeleted ? "bg-gradient-to-r from-rose-900 via-rose-800 to-rose-900 border-rose-700" : "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-gray-800"}`}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-black uppercase tracking-[0.2em] ${isDeleted ? "text-rose-400" : "text-emerald-400"}`}>
              Product Deployment
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-xs font-bold text-gray-400">ID #{product.id}</span>
          </div>
          <h2 className={`text-3xl md:text-4xl font-black text-white tracking-tight ${isDeleted ? "line-through opacity-70" : ""}`}>
            {product.name}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            {isDeleted ? (
              <div className="px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Archived / Deleted
              </div>
            ) : (
              <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${product.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                {product.isActive ? "Live" : "Inactive"}
              </div>
            )}
            {hasDiscount && (
              <div className="px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-400/10 text-amber-400 border border-amber-400/20">
                -{discountPercent}% Off
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isDeleted && (
            <>
              <button
                onClick={() => navigate(`/add?edit=${product.id}`)}
                className="px-5 py-2.5 bg-white/10 text-white border border-white/15 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-gray-900 transition-all shadow-md"
              >
                Edit
              </button>
              <button
                onClick={() => navigate(`/products/${product.id}/variants`)}
                className="px-5 py-2.5 bg-white/10 text-white border border-white/15 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-gray-900 transition-all shadow-md"
              >
                Variants
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 ${product.isActive ? "bg-amber-500 text-white hover:bg-amber-400" : "bg-emerald-500 text-white hover:bg-emerald-400"}`}
              >
                {actionLoading ? "..." : product.isActive ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-500 hover:text-white transition-all shadow-md disabled:opacity-50"
              >
                {actionLoading ? "..." : "Delete"}
              </button>
            </>
          )}
          {isDeleted && (
            <button
              onClick={handleRestore}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-400 transition-all shadow-md disabled:opacity-50"
            >
              {actionLoading ? "Restoring..." : "Restore Product"}
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Image Gallery + Variants + Collections */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">

          {/* Image Gallery */}
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden border group ${isDeleted ? "border-rose-300" : "border-gray-100"}`}>
              {isDeleted && (
                <div className="absolute inset-0 bg-rose-500/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl mb-2">🗑️</div>
                    <span className="text-xl font-black text-white drop-shadow-lg uppercase tracking-widest">Deleted</span>
                  </div>
                </div>
              )}
              {images[selectedImageIndex] ? (
                <img
                  src={images[selectedImageIndex].url}
                  className={`w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105 ${isDeleted ? "opacity-30 grayscale" : ""}`}
                  alt={product.name}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-200 text-8xl">🖼️</div>
              )}

              {/* Status badge on image */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {isDeleted ? (
                  <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-rose-600 text-white backdrop-blur-xl">Deleted</span>
                ) : (
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-xl border ${product.isActive ? "bg-emerald-500/80 text-white border-emerald-400" : "bg-rose-500/80 text-white border-rose-400"}`}>
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                )}
                {hasDiscount && (
                  <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-amber-400 text-gray-900 border border-amber-300 backdrop-blur-xl">
                    -{discountPercent}% Off
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${selectedImageIndex === idx ? "border-emerald-500 scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={img.url} className="w-full h-full object-cover" alt="Thumb" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Variants */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-base">🧩</span>
                <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs">Product Variants ({variants.length})</h3>
              </div>
              <button
                onClick={() => navigate(`/products/${product.id}/variants`)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
              >
                Manage All →
              </button>
            </div>

            {variants.length === 0 ? (
              <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">No variants configured</p>
                <button
                  onClick={() => navigate(`/products/${product.id}/variants`)}
                  className="mt-2 text-xs font-bold text-emerald-600 hover:underline inline-block"
                >
                  + Add Variant
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {variants.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 bg-gray-50 hover:bg-white p-3 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all">
                    <div
                      className="w-8 h-8 rounded-xl border-2 border-white shadow-sm shrink-0"
                      style={{ backgroundColor: v.color || "#e5e7eb" }}
                      title={getColorName(v.color)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{getColorName(v.color)}</p>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        Size: {v.size || "Universal"} · Qty: {v.quantity}
                      </p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${v.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-rose-400"}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Store Collections */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-base">📁</span>
                <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs">Store Collections ({collections.length})</h3>
              </div>
            </div>

            {collections.length === 0 ? (
              <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Not assigned to any collection</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {collections.map((col) => {
                  const mainImg = col.images?.find(img => img.isMain)?.url || col.images?.[0]?.url;
                  return (
                    <div key={col.id} className="relative group flex items-center gap-3 bg-gray-50 hover:bg-white p-3 rounded-2xl border border-gray-100 hover:border-rose-200 hover:shadow-md transition-all">
                      <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm shrink-0 border border-gray-100">
                        {mainImg ? (
                          <img src={mainImg} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 font-black">?</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate text-sm group-hover:text-rose-600 transition-colors">{col.name}</p>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">CID: #{col.id}</p>
                      </div>
                      <button
                        onClick={() => removeFromCollection(col.id)}
                        disabled={actionLoading}
                        className="w-8 h-8 bg-rose-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center disabled:opacity-50 shrink-0"
                        title="Remove from Collection"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Info, Pricing, Actions, Specs, Sales */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">

          {/* Product Name & Description */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Product Narrative</h3>
            <h2 className={`text-2xl font-black leading-tight tracking-tight ${isDeleted ? "text-rose-500 line-through" : "text-gray-900"}`}>
              {product.name}
            </h2>
            <p className="text-gray-500 font-medium leading-relaxed text-sm">
              {product.description || "No description provided for this product."}
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-3">Financial Summary</p>
            <div className="flex items-baseline gap-3 flex-wrap mb-5">
              {hasDiscount && product.finalPrice ? (
                <>
                  <span className="text-4xl font-black tracking-tighter text-emerald-400">{currency} {Number(product.finalPrice).toFixed(2)}</span>
                  <span className="text-lg text-gray-500 line-through font-bold">{currency} {Number(product.price).toFixed(2)}</span>
                  <span className="text-sm font-bold text-emerald-400">-{discountPercent}%</span>
                </>
              ) : (
                <span className="text-4xl font-black tracking-tighter">{currency} {Number(product.price).toFixed(2)}</span>
              )}
            </div>

            {/* Discount Info */}
            {product.discount && (
              <div className="mb-5 p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Active Discount</span>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${product.discount.isActive ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                    {product.discount.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight">{product.discount.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{product.discount.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-amber-400 rounded-xl text-gray-900 text-xs font-black">
                    -{Number(product.discount.discountPercent).toFixed(0)}%
                  </div>
                  {product.discount.endDate && (
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Ends</span>
                      <span className="text-[10px] font-black uppercase">{new Date(product.discount.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                {hasDiscount && !isDeleted && (
                  <button
                    onClick={handleRemoveDiscount}
                    disabled={actionLoading}
                    className="w-full py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-500 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? "Removing..." : "Remove Discount"}
                  </button>
                )}
              </div>
            )}

            {/* Stock & Subcategory */}
            <div className="grid grid-cols-2 gap-3 pb-5 border-b border-white/10">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Stock</span>
                <span className={`text-base font-black ${product.availableQuantity > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {product.availableQuantity} Units
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Subcategory</span>
                <span className="text-base font-black uppercase tracking-tighter">
                  #{product.subCategoryId || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata Specs */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Product Specifications</h3>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
              {[
                { label: "Product UID", value: `#${product.id}` },
                { label: "Status", value: product.isActive ? "Active" : "Inactive" },
                { label: "Stock Status", value: product.availableQuantity > 0 ? "In Stock" : "Out of Stock" },
                { label: "Discount", value: hasDiscount ? `${discountPercent}% Off` : "None" },
                { label: "Total Sold", value: `${salesData?.totalSold ?? product.totalSold ?? 0} Units` },
                { label: "Created", value: new Date(product.createdAt).toLocaleDateString() },
              ].map((spec, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{spec.label}</p>
                  <p className="font-bold text-gray-900 text-sm">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Performance */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-base">📊</span>
                <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs">Sales Performance</h3>
              </div>
              <button
                onClick={fetchSales}
                disabled={loadingSales}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
              >
                {loadingSales ? "Loading..." : "Refresh →"}
              </button>
            </div>

            {salesData ? (
              <div className="flex flex-col gap-3">
                {salesData.variantSales?.map((vs) => (
                  <div key={vs.variantId} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div
                      className="w-8 h-8 rounded-xl border-2 border-white shadow-sm shrink-0"
                      style={{ backgroundColor: vs.color || "#e5e7eb" }}
                      title={getColorName(vs.color)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{getColorName(vs.color)} / {vs.size}</p>
                      {vs.waist && vs.length && (
                        <p className="text-[10px] text-gray-400 font-semibold">W: {vs.waist} · L: {vs.length}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-xs font-black text-blue-600">{vs.totalSold} sold</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{vs.remainingQuantity} left</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Click Refresh to load sales data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProduct;
