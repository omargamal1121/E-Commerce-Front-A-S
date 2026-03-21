import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import API from "../../services/api";

const BulkDiscountManager = ({ token }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialDiscountId = queryParams.get("discountId");

  const [products, setProducts] = useState([]);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState(initialDiscountId ? Number(initialDiscountId) : null);
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
    } catch (e) { toast.error("Failed to load discounts"); }
  }, [token]);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await API.products.list({ 
        searchTerm, 
        page, 
        pageSize,
        includeDeleted: false 
      }, token);
      
      const data = res?.responseBody?.data || [];
      setTotalCount(res?.responseBody?.totalCount || 0);
      setProducts(data);
    } catch (e) { toast.error("Failed to load products"); }
    finally { setLoadingProducts(false); }
  }, [token, searchTerm, page]);

  useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);
  
  // Debounced search & pagination effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, searchTerm ? 400 : 0); // debounce only if searching
    return () => clearTimeout(timer);
  }, [searchTerm, page, fetchProducts]);

  const handleSelectAll = () => {
    if (selectedProductIds.length === products.length) setSelectedProductIds([]);
    else setSelectedProductIds(products.map(p => p.id));
  };

  const handleApply = async () => {
    if (!selectedDiscountId || !selectedProductIds.length) return toast.error("Please select a discount and products");
    setLoading(true);
    try {
      await API.discounts.applyBulkDiscount(selectedDiscountId, selectedProductIds, token);
      toast.success("Discounts applied successfully");
      setSelectedProductIds([]);
      fetchProducts();
    } catch (e) { toast.error("Failed to apply discounts"); }
    finally { setLoading(false); }
  };

  const selectedDiscount = availableDiscounts.find(d => d.id === selectedDiscountId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-8 flex flex-col gap-10 bg-white p-10 rounded-[56px] border border-gray-100 shadow-sm shadow-purple-900/5">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-xl">⚡</div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Bulk Actions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-50 pb-10">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Discount</label>
            <select
              className="w-full bg-gray-50 border border-gray-100 rounded-[22px] px-6 py-4 outline-none focus:ring-8 focus:ring-purple-50 focus:border-purple-300 font-bold text-sm transition-all shadow-inner"
              value={selectedDiscountId || ""}
              onChange={(e) => setSelectedDiscountId(Number(e.target.value))}
            >
              <option value="">Choose a discount...</option>
              {availableDiscounts.map(d => (
                <option key={d.id} value={d.id}>{d.name} (-{d.discountPercent}%)</option>
              ))}
            </select>
          </div>

          {selectedDiscount && (
            <div className="bg-purple-600 rounded-[28px] p-6 text-white flex justify-between items-center shadow-xl shadow-purple-900/10 transition-all scale-in-center">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-200/60">Percentage</span>
                <span className="text-4xl font-black">-{selectedDiscount.discountPercent}%</span>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-purple-200/60">Ends On</span>
                <span className="text-xs font-bold">{new Date(selectedDiscount.endDate).toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Target Products</h4>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Select products to update</p>
            </div>
            <button onClick={handleSelectAll} className="px-5 py-2 bg-gray-50 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100">
              {selectedProductIds.length === products.length ? "Deselect All" : "Select Current Page"}
            </button>
          </div>

          <div className="relative group">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[28px] outline-none focus:ring-8 focus:ring-purple-50 focus:border-purple-300 transition-all font-bold text-sm shadow-inner"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
            <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2">
            {loadingProducts ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="aspect-square bg-gray-50 rounded-[32px] animate-pulse" />)
            ) : products.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProductIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                className={`flex flex-col items-center justify-center p-4 aspect-square rounded-[38px] transition-all duration-500 border-2 relative overflow-hidden group ${selectedProductIds.includes(p.id)
                  ? "bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-900/20 scale-95"
                  : "bg-white border-gray-50 text-gray-500 hover:border-purple-200 hover:bg-purple-50/30"
                  }`}
              >
                {selectedProductIds.includes(p.id) && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-white text-purple-600 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg animate-in zoom-in duration-300">
                    ✓
                  </div>
                )}
                <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden mb-3 group-hover:scale-110 transition-all duration-500 shadow-sm border border-gray-100">
                  {(() => {
                    const mainImg = p.images?.find(img => img.isMain) || p.images?.[0];
                    return mainImg?.url ? (
                      <img src={mainImg.url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                    );
                  })()}
                </div>
                <span className="text-[10px] font-black uppercase text-center line-clamp-2 px-2 leading-tight tracking-tighter">{p.name}</span>
              </button>
            ))}
          </div>

          {totalCount > pageSize && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 disabled:opacity-20 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="px-6 py-3 bg-gray-50 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Page <span className="text-purple-600">{page}</span> of {Math.ceil(totalCount / pageSize)}
              </div>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(totalCount / pageSize)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 disabled:opacity-20 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-gray-900 p-10 rounded-[56px] text-white flex flex-col gap-8 h-full shadow-2xl shadow-purple-900/10 border border-purple-900/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 text-center relative z-10">Summary</h4>

          <div className="flex-1 flex flex-col justify-center items-center gap-8 py-10 relative z-10">
            <div className="relative">
              <div className="w-24 h-24 bg-purple-600/20 rounded-[32px] flex items-center justify-center text-4xl border border-purple-500/30 shadow-2xl shadow-purple-900/50">
                {selectedProductIds.length}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-lg shadow-xl shadow-purple-900/50 border-4 border-gray-900">📦</div>
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Products Selected</p>
          </div>

          <div className="flex flex-col gap-4 relative z-10">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Active Discount</span>
                <span className="text-sm font-black uppercase text-purple-300 tracking-tight truncate max-w-[150px]">
                  {selectedDiscount?.name || "None Selected"}
                </span>
              </div>
              {selectedDiscount && <span className="text-3xl font-black text-white tracking-tighter">-{selectedDiscount.discountPercent}%</span>}
            </div>

            <button
              onClick={handleApply}
              disabled={loading || !selectedDiscountId || !selectedProductIds.length}
              className="w-full py-6 bg-purple-600 hover:bg-purple-700 text-white rounded-[32px] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-900/50 active:scale-95 disabled:opacity-20 flex items-center justify-center gap-4 mt-4"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? "PROCESSING..." : "APPLY DISCOUNT"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkDiscountManager;