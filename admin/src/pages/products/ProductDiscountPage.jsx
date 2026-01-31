import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";

const ProductDiscountPage = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [currentDiscount, setCurrentDiscount] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pRes, dRes] = await Promise.all([
          API.products.getAll(token),
          API.discounts.list({}, token)
        ]);
        setProducts(pRes?.responseBody?.data || []);
        setAvailableDiscounts(dRes?.responseBody?.data || []);
      } catch (e) { toast.error("Asset sync failed"); }
      finally { setLoading(false); }
    })();
  }, [token]);

  const fetchProductDiscount = async (id) => {
    try {
      const res = await API.products.getDiscount(id, token);
      setCurrentDiscount(res?.responseBody?.data || null);
    } catch (e) { setCurrentDiscount(null); }
  };

  useEffect(() => {
    if (selectedProductId) fetchProductDiscount(selectedProductId);
    else setCurrentDiscount(null);
  }, [selectedProductId, token]);

  const handleApply = async () => {
    if (!selectedProductId || !selectedDiscountId) return toast.error("Incomplete Mapping Parameters");
    try {
      await API.products.applyDiscount(selectedProductId, selectedDiscountId, token);
      toast.success("Protocol Applied");
      fetchProductDiscount(selectedProductId);
    } catch (e) { toast.error("Mapping Failed"); }
  };

  const handleRemove = async () => {
    try {
      await API.products.removeDiscount(selectedProductId, token);
      toast.success("Protocol Severed");
      setCurrentDiscount(null);
    } catch (e) { toast.error("Excision Failed"); }
  };

  const activeProduct = products.find(p => p.id === Number(selectedProductId));
  const activeDiscount = availableDiscounts.find(d => d.id === Number(selectedDiscountId));

  return (
    <div className="flex flex-col gap-10 max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-20">

      {/* Header Context */}
      <div className="flex items-center gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-emerald-50 rounded-[28px] flex items-center justify-center text-3xl shadow-inner border border-emerald-100/50">
          📍
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Protocol Mapping</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Single-Target Campaign Association</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Mapping Controls */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col gap-10">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-emerald-500 rounded-full" />
              <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Association Matrix</h3>
            </div>

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Target Asset (Product)</label>
                <select
                  className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-8 py-4 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-bold"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">Select Target Asset</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Ref: {p.id})</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Proposed Protocol (Discount)</label>
                <select
                  className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-8 py-4 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-bold"
                  value={selectedDiscountId}
                  onChange={(e) => setSelectedDiscountId(e.target.value)}
                >
                  <option value="">Select Protocol</option>
                  {availableDiscounts.map(d => <option key={d.id} value={d.id}>{d.name} (-{d.discountPercent}%)</option>)}
                </select>
              </div>

              <button
                onClick={handleApply}
                disabled={!selectedProductId || !selectedDiscountId}
                className="w-full py-6 bg-gray-900 text-white rounded-[32px] text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl hover:scale-[1.02] disabled:opacity-20"
              >
                Establish Association
              </button>
            </div>
          </div>

          {/* Current Mapping Visualization */}
          {currentDiscount && (
            <div className="bg-emerald-600 p-10 rounded-[48px] text-white shadow-2xl shadow-emerald-900/10 animate-in zoom-in-95 duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">Active Association Node</span>
                  <button onClick={handleRemove} className="text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full transition-all border border-white/10">Sever Mapping</button>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-4xl font-black tracking-tighter uppercase">{currentDiscount.name}</h4>
                    <p className="text-sm font-bold opacity-60">Applied to {activeProduct?.name}</p>
                  </div>
                  <span className="text-6xl font-black tracking-tighter">-{currentDiscount.discountPercent}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Engagement Intel */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col gap-8 items-center text-center">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Target Asset Preview</h4>
            <div className="w-40 h-56 rounded-[32px] overflow-hidden bg-gray-50 border border-gray-100 shadow-inner">
              {activeProduct ? (
                <img src={activeProduct.images?.[0]?.url || activeProduct.mainImage} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl opacity-10">🛍️</div>
              )}
            </div>
            <div>
              <h5 className="text-xl font-black text-gray-900 uppercase tracking-tighter truncate w-full max-w-[200px]">{activeProduct?.name || "No Asset"}</h5>
              <p className="text-[10px] font-black text-emerald-500 tracking-widest uppercase mt-1">EGP {activeProduct?.price || "0.00"}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-8 rounded-[48px] border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Protocol Analytics</span>
            </div>
            <p className="text-[11px] font-medium text-gray-400 leading-relaxed italic">
              Mapping a protocol to a target asset will immediately adjust the market value for all active transaction channels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDiscountPage;