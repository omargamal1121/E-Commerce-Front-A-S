import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";
import { currency } from "../../App";
import { useNavigate } from "react-router-dom";

const ViewProduct = ({ token, productId }) => {
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const navigate = useNavigate();

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await API.products.getById(productId, token);
      setProduct(res?.responseBody?.data || null);
    } catch (err) { toast.error("Failed to extract asset details"); }
    finally { setLoading(false); }
  }, [productId, token]);

  const fetchVariants = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await API.variants.getByProductId(productId, token);
      setVariants(res?.responseBody?.data || []);
    } catch (err) { console.error("Variants sync failed"); }
  }, [productId, token]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchVariants();
    }
  }, [productId, fetchProduct, fetchVariants]);

  if (loading && !product) return (
    <div className="flex flex-col gap-10 animate-pulse">
      <div className="h-[500px] bg-gray-100 rounded-[48px]" />
    </div>
  );

  if (!product) return <div className="p-20 text-center text-gray-300 font-black uppercase tracking-widest">Asset Not Found</div>;

  const images = product.images || [];
  const discountPercent = Number((product.discount && (product.discount.discountPercent ?? product.discount.percentage)) ?? product.discountPercentage ?? 0);
  const hasDiscount = discountPercent > 0;

  return (
    <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-10 duration-1000">

      {/* Immersive Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Visual Engine */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="relative aspect-[4/5] bg-white rounded-[56px] overflow-hidden border border-gray-100 shadow-2xl group">
            {images[selectedImageIndex] ? (
              <img
                src={images[selectedImageIndex].url}
                className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                alt={product.name}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-200 text-9xl">🖼️</div>
            )}

            {/* Status & Overlays */}
            <div className="absolute top-10 left-10 flex flex-col gap-3">
              <span className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-xl border ${product.isActive ? "bg-emerald-500/80 text-white border-emerald-400" : "bg-rose-500/80 text-white border-rose-400"}`}>
                {product.isActive ? "Operational" : "Offline"}
              </span>
              {hasDiscount && (
                <span className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-400 text-gray-900 border border-emerald-300 backdrop-blur-xl">
                  -{discountPercent}% Campaign
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail Array */}
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`flex-shrink-0 w-24 h-32 rounded-[24px] overflow-hidden border-4 transition-all ${selectedImageIndex === idx ? "border-emerald-500 scale-105 shadow-xl" : "border-transparent opacity-50 hover:opacity-100"}`}
              >
                <img src={img.url} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Intelligence Context */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Asset Ref: {product.id}</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <h1 className="text-5xl font-black text-gray-900 leading-[0.9] uppercase tracking-tighter">
              {product.name}
            </h1>
            <p className="text-gray-500 font-medium text-lg leading-relaxed mt-4">
              {product.description}
            </p>
          </div>

          {/* Financial Summary */}
          <div className="bg-gray-900 p-10 rounded-[48px] text-white shadow-2xl shadow-emerald-900/20">
            <div className="flex flex-col gap-2 mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Market Settlement</span>
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-black tracking-tighter">{currency} {product.price}</span>
                {hasDiscount && <span className="text-xl text-gray-500 line-through font-bold">{currency} {product.price}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-8 border-b border-white/10">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Inventory Load</span>
                <span className={`text-lg font-black ${product.availableQuantity > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {product.availableQuantity} Units Available
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Structural Node</span>
                <span className="text-lg font-black uppercase tracking-tighter">
                  {product.subCategoryId || "Unbound"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-8">
              <button onClick={() => navigate(`/add?edit=${product.id}`)} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-gray-900 rounded-[32px] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:scale-[1.02]">
                Re-Forge Manifest
              </button>
              <button onClick={() => navigate(`/products/${product.id}/variants`)} className="w-full py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[32px] text-xs font-black uppercase tracking-[0.2em] transition-all">
                Configure Variants
              </button>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🧶", label: "Material", value: product.material || "Technical Synth" },
              { icon: "🧼", label: "Protocol", value: product.careInstructions || "Standard Care" },
              { icon: "📦", label: "Logistic", value: product.shippingInfo || "Global Link" },
              { icon: "🕰️", label: "Modified", value: new Date(product.modifiedAt || product.createdAt).toLocaleDateString() },
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

      {/* Variant Information Matrix */}
      <div className="bg-white p-12 rounded-[56px] border border-gray-100 shadow-sm flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-[20px] flex items-center justify-center text-2xl">🧩</div>
            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Variant Matrix</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-6 py-2 rounded-full">
            {variants.length} Active Vectors
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {variants.map((v) => (
            <div key={v.id} className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 flex flex-col gap-4 transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-900/5 group">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Spectrum</span>
                  <span className="text-lg font-black text-gray-900 uppercase">{v.color || "Static"}</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${v.isActive ? "bg-emerald-500 shadow-lg shadow-emerald-200" : "bg-gray-300"}`} />
              </div>

              <div className="flex items-center gap-6 border-t border-gray-200 pt-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Scale</span>
                  <span className="text-sm font-black text-gray-900">{v.size || "Universal"}</span>
                </div>
                <div className="flex flex-col border-l border-gray-200 pl-6">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Quant</span>
                  <span className="text-sm font-black text-emerald-600 underline decoration-2 underline-offset-4">{v.quantity} Units</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewProduct;
