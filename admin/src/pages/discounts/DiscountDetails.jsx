import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/api";

const DiscountDetails = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [removeProductLoading, setRemoveProductLoading] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await API.discounts.getById(id, token);
      const discountData = res?.responseBody?.data || res?.data;
      setData(discountData);
    } catch (e) {
      toast.error("Failed to load discount details");
      navigate("/discounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && token) fetchDetails();
  }, [id, token]);

  const handleToggle = async () => {
    setToggleLoading(true);
    try {
      if (data.isActive) await API.discounts.deactivate(id, token);
      else await API.discounts.activate(id, token);
      
      toast.success(`Discount ${data.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchDetails();
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    } finally {
      setToggleLoading(false);
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!window.confirm("Remove discount from this product?")) return;
    setRemoveProductLoading(productId);
    try {
      await API.discounts.removeDiscountFromProduct(productId, token);
      toast.success("Discount removed from product");
      fetchDetails();
    } catch (e) {
      toast.error("Failed to remove discount");
    } finally {
      setRemoveProductLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this discount?")) return;
    try {
      await API.discounts.delete(id, token);
      toast.success("Discount deleted");
      navigate("/discounts");
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 shadow-xl"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-10 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/discounts")} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl hover:bg-purple-600 hover:text-white transition-all shadow-sm">
            ←
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Discount Details</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Full information and linked products</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/bulk-discount?discountId=${data.id}`)}
            className="px-6 py-3 bg-white text-purple-600 border border-purple-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-50 transition-all shadow-sm flex items-center gap-2"
          >
            <span className="text-sm">+</span> Add Products
          </button>
          <button
            onClick={() => window.print()}
            className="w-12 h-12 bg-white text-gray-400 border border-gray-100 rounded-2xl flex items-center justify-center hover:text-purple-600 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Core Metadata */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-10 space-y-10">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-8 bg-purple-500 rounded-full" />
                    <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tight">{data.name}</h3>
                  </div>
                  <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-2xl">{data.description || "No description provided for this discount."}</p>
                </div>
                <div className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${data.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                  {data.isActive ? "Active" : "Inactive"}
                </div>
              </div>

              {/* Yield Visualization */}
              <div className="bg-gray-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-purple-900/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400">Discount Percentage</span>
                    <span className="text-8xl font-black tracking-tighter">-{data.discountPercent}%</span>
                  </div>
                  <div className="h-24 w-px bg-white/10" />
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Start Date</span>
                      <span className="text-sm font-black">{new Date(data.startDate).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' })}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">End Date</span>
                      <span className="text-sm font-black text-rose-400">{new Date(data.endDate).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Array */}
              <div className="flex gap-4 pt-6 border-t border-gray-50">
                <button
                  onClick={handleToggle}
                  disabled={toggleLoading}
                  className={`flex-1 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 ${data.isActive 
                    ? "bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-600 hover:text-white" 
                    : "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white"}`}
                >
                  {toggleLoading ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : null}
                  {data.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-10 py-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-xl active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Associated Product Matrix */}
          <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-10 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-xl">📦</div>
                <div>
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Linked Products</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Products using this discount</p>
                </div>
              </div>
              <span className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-black uppercase tracking-[0.2em]">
                {data.products?.length || 0} Products
              </span>
            </div>

            <div className="divide-y divide-gray-50">
              {data.products && data.products.length > 0 ? (
                data.products.map((product) => (
                  <div key={product.id} className="p-8 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-gray-100 rounded-3xl overflow-hidden shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                        {(() => {
                          const mainImg = product.images?.find(img => img.isMain) || product.images?.[0];
                          return mainImg?.url ? (
                            <img src={mainImg.url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                          );
                        })()}
                      </div>
                      <div>
                        <p className="text-lg font-black text-gray-900 uppercase tracking-tight">{product.name}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xl font-black text-emerald-600 tracking-tighter">EGP {product.finalPrice}</span>
                          <span className="text-xs font-bold text-gray-400 line-through decoration-rose-500/30Decoration decoration-2">EGP {product.price}</span>
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black border border-rose-100">
                             -{Math.round(((product.price - product.finalPrice) / product.price) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveProduct(product.id)}
                      disabled={removeProductLoading === product.id}
                      className="p-4 bg-rose-50 text-rose-500 rounded-2xl opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {removeProductLoading === product.id ? <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-20 flex flex-col items-center justify-center gap-6 opacity-30">
                  <div className="text-8xl">🌫️</div>
                  <p className="text-sm font-black uppercase tracking-[0.4em] text-gray-400">No products linked</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-10">
          <div className="bg-gray-900 p-10 rounded-[56px] text-white flex flex-col gap-8 shadow-2xl shadow-purple-900/10 border border-purple-900/30">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">System Information</h4>
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest text-[#555]">Discount ID</span>
                <span className="text-sm font-black text-purple-300">#{data.id}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest text-[#555]">Discount Strategy</span>
                <span className="text-sm font-black text-white">REDUCTION (%)</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest text-[#555]">Campaign Duration</span>
                <span className="text-sm font-black text-white">
                  {(() => {
                    const diffDays = Math.ceil(Math.abs(new Date(data.endDate) - new Date(data.startDate)) / (1000 * 60 * 60 * 24));
                    return `${diffDays} Day${diffDays !== 1 ? 's' : ''}`;
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest text-[#555]">Created Date</span>
                <span className="text-[11px] font-bold text-gray-400">
                  {new Date(data.createdAt).toLocaleDateString('en-GB')} {new Date(data.createdAt).toLocaleTimeString('en-GB')}
                </span>
              </div>
              {data.modifiedAt && data.modifiedAt !== data.createdAt && (
                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                  <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest text-[#555]">Last Modified</span>
                  <span className="text-[11px] font-bold text-gray-400">
                    {new Date(data.modifiedAt).toLocaleDateString('en-GB')} {new Date(data.modifiedAt).toLocaleTimeString('en-GB')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountDetails;
