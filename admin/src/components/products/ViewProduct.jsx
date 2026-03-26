import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";
import { currency } from "../../App";
import { useNavigate } from "react-router-dom";

const ViewProduct = ({ token, productId }) => {
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await API.products.getById(productId, token);
      setProduct(res?.responseBody?.data || null);
    } catch {
      toast.error("Failed to load product details");
    }
    finally { setLoading(false); }
  }, [productId, token]);

  const fetchVariants = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await API.variants.getByProductId(productId, token);
      setVariants(res?.responseBody?.data || []);
    } catch {
      console.error("Failed to load variants");
    }
  }, [productId, token]);

  const [salesData, setSalesData] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);

  const fetchSales = useCallback(async () => {
    if (!productId) return;
    setLoadingSales(true);
    try {
      const res = await API.products.getSales(productId, token);
      setSalesData(res?.responseBody?.data || null);
    } catch {
      toast.error("Failed to load sales data");
    } finally {
      setLoadingSales(false);
    }
  }, [productId, token]);

  const fetchCollections = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await API.products.getCollections(productId, token);
      setCollections(res?.responseBody?.data || []);
    } catch {
      console.error("Failed to load product collections");
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
    } catch {
      toast.error("Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!product) return;
    setActionLoading(true);
    try {
      await API.products.restore(product.id, token);
      toast.success("Product restored");
      fetchProduct();
    } catch {
      toast.error("Restore failed");
    } finally {
      setActionLoading(false);
    }
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
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveDiscount = async () => {
    if (!product) return;
    if (!window.confirm("Are you sure you want to remove the discount from this product?")) return;
    setActionLoading(true);
    try {
      await API.products.removeDiscount(product.id, token);
      toast.success("Discount removed");
      fetchProduct();
    } catch {
      toast.error("Failed to remove discount");
    } finally {
      setActionLoading(false);
    }
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
    } catch {
      toast.error("Detach failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !product) return (
    <div className="flex flex-col gap-10 animate-pulse">
      <div className="h-[500px] bg-gray-100 rounded-[48px]" />
    </div>
  );

  if (!product) return <div className="p-20 text-center text-gray-300 font-black uppercase tracking-widest">Product Not Found</div>;

  // Check if product is deleted (deletedAt is not null)
  const isDeleted = product.deletedAt !== null && product.deletedAt !== undefined;

  const images = product.images || [];
  // Get discount percent from discount object or direct property
  const discountPercent = Number(
    product.discount?.discountPercent ?? 
    product.discount?.percentage ?? 
    product.discountPercentage ?? 
    0
  );
  const hasDiscount = discountPercent > 0;

  return (
    <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-10 duration-1000">

      {/* Deleted Product Alert Banner */}
      {isDeleted && (
        <div className="bg-rose-500/10 border-2 border-rose-500 rounded-[32px] p-6 flex items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-rose-600 uppercase tracking-tighter">
                This Product Has Been Deleted
              </span>
              <span className="text-sm font-bold text-rose-500/80">
                Restore the product to make it available again
              </span>
            </div>
          </div>
          <button 
            onClick={handleRestore} 
            disabled={actionLoading}
            className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-[24px] text-xs font-black uppercase tracking-widest transition-all shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {actionLoading ? "Restoring..." : "Restore Product"}
          </button>
        </div>
      )}

      {/* Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

        {/* Product Gallery */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className={`relative aspect-[4/5] bg-white rounded-[56px] overflow-hidden border shadow-2xl group ${isDeleted ? "border-rose-500/50" : "border-gray-100"}`}>
            {isDeleted && (
              <div className="absolute inset-0 bg-rose-500/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🗑️</div>
                  <span className="text-2xl font-black text-rose-600 uppercase tracking-widest text-white drop-shadow-lg">Deleted</span>
                </div>
              </div>
            )}
            {images[selectedImageIndex] ? (
              <img
                src={images[selectedImageIndex].url}
                className={`w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 ${isDeleted ? "opacity-30 grayscale" : ""}`}
                alt={product.name}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-200 text-9xl">🖼️</div>
            )}

            {/* Badges */}
            <div className="absolute top-10 left-10 flex flex-col gap-3">
              {isDeleted ? (
                <span className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-rose-600 text-white border border-rose-500 backdrop-blur-xl">
                  Deleted
                </span>
              ) : (
                <span className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-xl border ${product.isActive ? "bg-emerald-500/80 text-white border-emerald-400" : "bg-rose-500/80 text-white border-rose-400"}`}>
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              )}
              {hasDiscount && (
                <span className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-amber-400 text-gray-900 border border-amber-300 backdrop-blur-xl">
                  -{discountPercent}% Discount
                </span>
              )}
              {product.discountStatus !== null && product.discountStatus !== undefined && (
                <span className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-xl border ${product.discountStatus ? "bg-amber-600 text-white border-amber-500" : "bg-gray-600 text-white border-gray-500"}`}>
                  Discount: {product.discountStatus ? "Active" : "Inactive"}
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`flex-shrink-0 w-32 h-40 rounded-[28px] overflow-hidden border-4 transition-all ${selectedImageIndex === idx ? "border-emerald-500 scale-105 shadow-xl" : "border-transparent opacity-50 hover:opacity-100"}`}
              >
                <img src={img.url} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Product ID: {product.id}</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <h1 className={`text-5xl font-black leading-[0.9] uppercase tracking-tighter ${isDeleted ? "text-rose-500 line-through" : "text-gray-900"}`}>
              {product.name}
            </h1>
            <p className={`font-medium text-lg leading-relaxed mt-4 ${isDeleted ? "text-rose-400" : "text-gray-500"}`}>
              {product.description}
            </p>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-gray-900 p-10 rounded-[48px] text-white shadow-2xl shadow-emerald-900/20">
            <div className="flex flex-col gap-2 mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Financial Summary</p>
              <div className="flex items-baseline gap-4 flex-wrap">
                {hasDiscount && product.finalPrice ? (
                  <>
                    <span className="text-5xl font-black tracking-tighter text-emerald-400">{currency} {Number(product.finalPrice).toFixed(2)}</span>
                    <span className="text-xl text-gray-500 line-through font-bold">{currency} {Number(product.price).toFixed(2)}</span>
                    <span className="text-sm font-bold text-emerald-400">-{discountPercent}%</span>
                  </>
                ) : (
                  <span className="text-5xl font-black tracking-tighter">{currency} {Number(product.price).toFixed(2)}</span>
                )}
              </div>
            </div>

            {/* Detailed Discount Info */}
            {product.discount && (
              <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-[32px] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Active Strategy</span>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${product.discount.isActive ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                    {product.discount.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black uppercase tracking-tight">{product.discount.name}</span>
                  <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{product.discount.description}</p>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="px-4 py-2 bg-amber-400 rounded-2xl text-gray-900 text-xs font-black">
                    -{Number(product.discount.discountPercent).toFixed(0)}%
                  </div>
                  {product.discount.endDate && (
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Ends At</span>
                      <span className="text-[10px] font-black uppercase">{new Date(product.discount.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pb-8 border-b border-white/10">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Available Stock</span>
                <span className={`text-lg font-black ${product.availableQuantity > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {product.availableQuantity} Units
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Subcategory</span>
                <span className="text-lg font-black uppercase tracking-tighter">
                  #{product.subCategoryId || "N/A"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-8">
              {!isDeleted && (
                <>
                  <button onClick={() => navigate(`/add?edit=${product.id}`)} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-gray-900 rounded-[32px] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:scale-[1.02]">
                    Edit Product
                  </button>
                  {hasDiscount && (
                    <button 
                      onClick={handleRemoveDiscount} 
                      disabled={actionLoading}
                      className="w-full py-5 bg-rose-600 text-white rounded-[32px] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:scale-[1.02] disabled:opacity-50"
                    >
                      {actionLoading ? "Removing..." : "Remove Discount"}
                    </button>
                  )}
                  <button onClick={() => navigate(`/products/${product.id}/variants`)} className="w-full py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[32px] text-xs font-black uppercase tracking-[0.2em] transition-all">
                    Manage Variants
                  </button>
                  <button 
                    onClick={handleToggleStatus} 
                    disabled={actionLoading}
                    className={`w-full py-5 rounded-[32px] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:scale-[1.02] disabled:opacity-50 ${
                      product.isActive 
                        ? "bg-amber-500 hover:bg-amber-400 text-white" 
                        : "bg-emerald-500 hover:bg-emerald-400 text-white"
                    }`}
                  >
                    {actionLoading ? (product.isActive ? "Deactivating..." : "Activating...") : (product.isActive ? "Deactivate Product" : "Activate Product")}
                  </button>
                  <button 
                    onClick={handleDelete} 
                    disabled={actionLoading}
                    className="w-full py-5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-[32px] text-xs font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                  >
                    {actionLoading ? "Deleting..." : "Delete Product"}
                  </button>
                </>
              )}
              {isDeleted && (
                <button 
                  onClick={handleRestore} 
                  disabled={actionLoading}
                  className="w-full py-5 bg-blue-500 hover:bg-blue-400 text-white rounded-[32px] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:scale-[1.02] disabled:opacity-50"
                >
                  {actionLoading ? "Restoring..." : "Restore Product"}
                </button>
              )}
            </div>
          </div>

          {/* Technical Specs & Metadata */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🛍️", label: "Status", value: product.isActive ? "Active Asset" : "Inactive" },
              { icon: "📦", label: "Stock", value: product.availableQuantity > 0 ? "In Stock" : "Unavailable" },
              { icon: "🏷️", label: "Discount", value: product.discountStatus === true ? "Active" : (product.discountStatus === false ? "Inactive" : (product.discount?.isActive ? "Active" : "None")) },
              { icon: "📈", label: "Total Sold", value: `${salesData?.totalSold ?? product.totalSold ?? product.totalsold ?? 0} Units` },
              { icon: "📅", label: "Deployment", value: new Date(product.createdAt).toLocaleDateString() },
            ].map((spec, i) => (
              <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{spec.icon}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{spec.label}</span>
                </div>
                <span className="text-xs font-bold text-gray-900 truncate">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commercial Performance Matrix */}
      <div className="bg-gray-900 p-12 rounded-[56px] shadow-2xl shadow-blue-900/10 text-white flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-[20px] flex items-center justify-center text-2xl">📊</div>
              <h3 className="text-3xl font-black uppercase tracking-tighter">Commercial Performance</h3>
            </div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest pl-20">Sales Velocity & Inventory Drain</p>
          </div>
          <button 
            onClick={fetchSales}
            disabled={loadingSales}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50"
          >
            {loadingSales ? "Generating..." : "View Detailed Sales Report"}
          </button>
        </div>

        {salesData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
            {salesData.variantSales?.map((vs) => (
              <div key={vs.variantId} className="p-8 bg-white/5 border border-white/10 rounded-[40px] flex flex-col gap-6 hover:bg-white/10 transition-all group">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Variant</span>
                    <span className="text-2xl font-black uppercase tracking-tighter">{vs.color} / {vs.size}</span>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xl">✨</div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Sold Units</span>
                    <span className="text-xl font-black text-blue-400">{vs.totalSold}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Remaining</span>
                    <span className="text-xl font-black">{vs.remainingQuantity}</span>
                  </div>
                </div>

                {vs.waist && vs.length && (
                  <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase">
                    <span>W: {vs.waist}</span>
                    <div className="w-1 h-1 rounded-full bg-gray-700" />
                    <span>L: {vs.length}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variant Information Matrix */}
      <div className="bg-white p-12 rounded-[56px] border border-gray-100 shadow-sm flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-[20px] flex items-center justify-center text-2xl">🧩</div>
            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Product Variants</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-6 py-2 rounded-full">
            {variants.length} Variants Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {variants.map((v) => (
            <div key={v.id} className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 flex flex-col gap-4 transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-900/5 group">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Color</span>
                  <span className="text-lg font-black text-gray-900 uppercase">{v.color || "Static"}</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${v.isActive ? "bg-emerald-500 shadow-lg shadow-emerald-200" : "bg-gray-300"}`} />
              </div>

              <div className="flex items-center gap-6 border-t border-gray-200 pt-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Size</span>
                  <span className="text-sm font-black text-gray-900">{v.size || "Universal"}</span>
                </div>
                <div className="flex flex-col border-l border-gray-200 pl-6">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Qty</span>
                  <span className="text-sm font-black text-emerald-600 underline decoration-2 underline-offset-4">{v.quantity} Units</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Store Collections Connectivity */}
      <div className="bg-gray-50/50 p-12 rounded-[56px] border border-gray-100 flex flex-col gap-10 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-rose-50 rounded-[20px] flex items-center justify-center text-2xl">📁</div>
            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Store Collections</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-6 py-2 rounded-full border border-rose-100">
            Attached to {collections.length} Collections
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map((col) => {
            const mainImg = col.images?.find(img => img.isMain)?.url || col.images?.[0]?.url;
            return (
              <div key={col.id} className="relative group bg-white p-6 rounded-[40px] border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl overflow-hidden shrink-0 border border-gray-100">
                    {mainImg ? (
                      <img src={mainImg} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl font-black uppercase">?</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 truncate text-lg tracking-tight uppercase group-hover:text-rose-600 transition-colors">{col.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                       CID: #{col.id}
                    </p>
                  </div>
                </div>

                {/* Hover Action Overlay */}
                <button
                  onClick={() => removeFromCollection(col.id)}
                  disabled={actionLoading}
                  className="absolute top-4 right-4 w-10 h-10 bg-rose-600 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-rose-700 flex items-center justify-center disabled:opacity-50"
                  title="Remove from Collection"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {col.isActive && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] group-hover:opacity-0 transition-opacity" />
                )}
              </div>
            );
          })}
          {collections.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-300 gap-4 opacity-50">
              <div className="text-4xl">🌫️</div>
              <p className="text-xs font-black uppercase tracking-widest">Isolated Asset - No Associated Collections</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewProduct;
