import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";

const BulkDiscountManager = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [totalCount, setTotalCount] = useState(0);

  const fetchDiscounts = useCallback(async () => {
    try {
      const res = await API.discounts.list({}, token);
      setAvailableDiscounts(res?.responseBody?.data || []);
    } catch (e) { toast.error("Campaign discovery failed"); }
  }, [token]);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await API.products.getAll(token);
      const data = res?.responseBody?.data || [];
      // Filter out deleted products (deletedAt is null/undefined means not deleted)
      const notDeleted = data.filter(p => p.deletedAt === null || p.deletedAt === undefined);
      // Then filter by search term
      const filtered = notDeleted.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      setTotalCount(filtered.length);
      setProducts(filtered.slice((page - 1) * pageSize, page * pageSize));
    } catch (e) { toast.error("Asset sync failed"); }
    finally { setLoadingProducts(false); }
  }, [token, searchTerm, page]);

  useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSelectAll = () => {
    if (selectedProductIds.length === products.length) setSelectedProductIds([]);
    else setSelectedProductIds(products.map(p => p.id));
  };

  const handleApply = async () => {
    if (!selectedDiscountId || !selectedProductIds.length) return toast.error("Incomplete Propagation Parameters");
    setLoading(true);
    try {
      await API.discounts.applyBulkDiscount(selectedDiscountId, selectedProductIds, token);
      toast.success("Mass Propagation Successful");
      setSelectedProductIds([]);
      fetchProducts();
    } catch (e) { toast.error("Propagation Error"); }
    finally { setLoading(false); }
  };

  const selectedDiscount = availableDiscounts.find(d => d.id === selectedDiscountId);

  return (
    <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-8 duration-700">

      {/* Configuration Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Protocol Selector */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-xl">⚡</div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Mass Propagation Matrix</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Active Protocol</label>
              <select
                className="w-full bg-gray-50 border border-gray-100 rounded-[22px] px-6 py-4 outline-none focus:ring-8 focus:ring-purple-50 focus:border-purple-300 font-bold text-sm transition-all"
                value={selectedDiscountId || ""}
                onChange={(e) => setSelectedDiscountId(Number(e.target.value))}
              >
                <option value="">Awaiting Protocol Selection</option>
                {availableDiscounts.map(d => (
                  <option key={d.id} value={d.id}>{d.name} (-{d.discountPercent}% Magnitude)</option>
                ))}
              </select>
            </div>

            {selectedDiscount && (
              <div className="bg-purple-600 rounded-[28px] p-6 text-white flex justify-between items-center shadow-xl shadow-purple-900/10">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-purple-200">Protocol Magnitude</span>
                  <span className="text-3xl font-black tracking-tighter">-{selectedDiscount.discountPercent}%</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-purple-200">Operational End</span>
                  <span className="text-xs font-bold">{new Date(selectedDiscount.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Asset Discovery Console */}
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target Asset Selection</span>
              <button onClick={handleSelectAll} className="text-[10px] font-black uppercase tracking-widest text-purple-600 hover:underline">
                {selectedProductIds.length === products.length ? "Deselect Vector" : "Select Entire Vector"}
              </button>
            </div>
            <div className="relative group">
              <input
                placeholder="Filter assets by name..."
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[28px] outline-none focus:ring-8 focus:ring-purple-50 focus:border-purple-300 transition-all font-bold text-sm"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
              <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingProducts ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="aspect-square bg-gray-50 rounded-[32px] animate-pulse border border-gray-100" />)
            ) : (
              products.map(p => {
                // Get discount info
                const discountPercent = p.discount?.discountPercent ?? p.discountPercentage ?? 0;
                const hasDiscount = discountPercent > 0;
                const finalPrice = p.finalPrice ?? p.price;
                
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProductIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                    className={`group relative p-3 rounded-[32px] border transition-all cursor-pointer ${selectedProductIds.includes(p.id) ? "bg-purple-600 border-purple-600 shadow-xl shadow-purple-900/10" : "bg-gray-50 border-gray-100 hover:border-purple-200"}`}
                  >
                    <div className="aspect-square rounded-[24px] overflow-hidden mb-3 bg-white shadow-inner relative">
                      <img src={p.images?.[0]?.url || p.mainImage} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                      {hasDiscount && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-rose-500 text-white rounded-full text-[8px] font-black uppercase">
                          -{discountPercent}%
                        </div>
                      )}
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-tighter truncate text-center mb-1 ${selectedProductIds.includes(p.id) ? "text-white" : "text-gray-900"}`}>{p.name}</p>
                    <div className={`text-[9px] font-bold text-center ${selectedProductIds.includes(p.id) ? "text-purple-200" : "text-gray-500"}`}>
                      {hasDiscount && finalPrice ? (
                        <>
                          <span className="text-emerald-500">{finalPrice.toFixed(2)}</span>
                          <span className="line-through opacity-60 ml-1">{p.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span>{p.price.toFixed(2)}</span>
                      )}
                    </div>
                    {selectedProductIds.includes(p.id) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-white text-purple-600 rounded-full flex items-center justify-center text-xs font-black shadow-lg animate-in zoom-in-50">✓</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Transmission Summary */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-gray-900 p-10 rounded-[56px] text-white flex flex-col gap-8 h-full shadow-2xl shadow-purple-900/10 border border-purple-900/30">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 text-center">Propagation Manifest</h4>

            <div className="flex-1 flex flex-col justify-center items-center gap-8 py-10">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-purple-500/20 flex items-center justify-center">
                  <span className="text-5xl font-black tracking-tighter">{selectedProductIds.length}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-lg shadow-xl shadow-purple-900/50">📤</div>
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Target Asset Units Engaged</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end border-t border-white/5 pt-8">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Selected Protocol</span>
                  <span className="text-sm font-black uppercase text-purple-400 tracking-tight truncate max-w-[150px]">
                    {selectedDiscount?.name || "None Engaged"}
                  </span>
                </div>
                {selectedDiscount && <span className="text-3xl font-black text-white tracking-tighter">-{selectedDiscount.discountPercent}%</span>}
              </div>

              <button
                onClick={handleApply}
                disabled={loading || !selectedDiscountId || !selectedProductIds.length}
                className="w-full py-6 bg-purple-600 hover:bg-purple-700 text-white rounded-[32px] text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-900/50 active:scale-95 disabled:opacity-20 flex items-center justify-center gap-4 mt-4"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Execute Mass Propagation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkDiscountManager;