import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/api";

const ProductVariant = ({ token }) => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [variantsLoading, setVariantsLoading] = useState(false);

  // New variant form
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [waist, setWaist] = useState("");
  const [length, setLength] = useState("");
  const [quantity, setQuantity] = useState("");

  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const SIZE_OPTIONS = [
    { value: 0, label: "XS" }, { value: 1, label: "S" }, { value: 2, label: "M" },
    { value: 3, label: "L" }, { value: 4, label: "XL" }, { value: 5, label: "XXL" }, { value: 6, label: "XXXL" },
  ];

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await API.products.getById(productId, token);
      setProduct(res.responseBody.data);
    } catch (e) {
      if (e.response?.status === 404) {
        toast.error("Product not found or deleted. Please restore it first.");
      } else {
        toast.error("Failed to load product");
      }
    }
    finally { setLoading(false); }
  };

  // Check if product is deleted (deletedAt is not null)
  const isDeleted = product?.deletedAt !== null && product?.deletedAt !== undefined;

  const fetchVariants = async () => {
    setVariantsLoading(true);
    try {
      const res = await API.variants.getByProductId(productId, token);
      setVariants(res.responseBody.data || []);
    } catch (e) { console.error("Failed to load variants"); }
    finally { setVariantsLoading(false); }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchVariants();
    }
  }, [productId, token]);

  const handleAddVariant = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        color: color || undefined,
        size: size !== "" ? Number(size) : undefined,
        waist: waist !== "" ? Number(waist) : undefined,
        length: length !== "" ? Number(length) : undefined,
        quantity: quantity ? Number(quantity) : 0,
      };
      await API.variants.add(productId, payload, token);
      toast.success("Variant added");
      setColor(""); setSize(""); setWaist(""); setLength(""); setQuantity("");
      fetchVariants();
    } catch (e) {
      if (e.response?.status === 404) {
        toast.error("Product is deleted. Please restore it first before adding variants.");
      } else {
        toast.error("Failed to add variant");
      }
    }
    finally { setLoading(false); }
  };

  const handleAdjust = async (type) => {
    if (!selectedVariantId || !adjustQuantity) return;
    try {
      if (type === 'add') await API.variants.addQuantity(productId, selectedVariantId, adjustQuantity, token);
      else await API.variants.removeQuantity(productId, selectedVariantId, adjustQuantity, token);
      toast.success("Quantity updated");
      setSelectedVariantId(null); setAdjustQuantity("");
      fetchVariants();
    } catch (e) { toast.error("Failed to update quantity"); }
  };

  const handleToggleStatus = async (variant) => {
    setLoading(true);
    try {
      if (variant.isActive) {
        await API.variants.deactivate(productId, variant.id, token);
        toast.success("Variant deactivated");
      } else {
        await API.variants.activate(productId, variant.id, token);
        toast.success("Variant activated");
      }
      fetchVariants();
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProduct = async () => {
    if (!product) return;
    setActionLoading(true);
    try {
      await API.products.restore(product.id, token);
      toast.success("Product restored");
      fetchProduct();
      fetchVariants();
    } catch (e) {
      toast.error("Restore failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-20">

      {/* Configuration Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-[28px] flex items-center justify-center text-3xl shadow-inner border border-blue-100/50 text-blue-600">
            🧬
          </div>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{product?.name || "Product"} Variants</h1>
              {isDeleted && (
                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white border border-rose-500">
                  Deleted
                </span>
              )}
            </div>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Manage variations and stock levels</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isDeleted && (
            <button 
              onClick={handleRestoreProduct} 
              disabled={actionLoading}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {actionLoading ? "Restoring..." : "Restore Product"}
            </button>
          )}
          <button onClick={() => navigate('/products')} className="px-8 py-3 bg-gray-50 border border-gray-100 rounded-[22px] text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
            Back to Products
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Molecular Forge (Add Form) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-gray-900 p-10 rounded-[56px] text-white shadow-2xl shadow-blue-900/20 border border-blue-900/30 flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-blue-500 rounded-full" />
              <h3 className="text-xl font-black uppercase tracking-tighter">Add New Variant</h3>
            </div>

            {isDeleted ? (
              <div className="flex flex-col items-center gap-4 p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <div className="text-4xl">⚠️</div>
                <p className="text-center text-white/80 font-bold text-sm">
                  This product is deleted. Please restore it first before adding variants.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddVariant} className="flex flex-col gap-6">
                {[
                  { label: "Color", state: color, set: setColor, type: "text", p: "e.g. Black, Red..." },
                  { label: "Waist Size", state: waist, set: setWaist, type: "number", p: "0" },
                  { label: "Length Size", state: length, set: setLength, type: "number", p: "0" },
                  { label: "Initial Stock", state: quantity, set: setQuantity, type: "number", p: "0" },
                ].map(f => (
                  <div key={f.label} className="flex flex-col gap-2">
                    <label className="text-[9px] font-bold uppercase text-gray-500 tracking-widest ml-1">{f.label}</label>
                    <input
                      type={f.type} value={f.state} onChange={(e) => f.set(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 outline-none focus:border-blue-500 font-bold text-sm transition-all"
                      placeholder={f.p}
                    />
                  </div>
                ))}

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-bold uppercase text-gray-500 tracking-widest ml-1">Size</label>
                  <select
                    value={size} onChange={(e) => setSize(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 outline-none focus:border-blue-500 font-bold text-sm transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900">Select Size</option>
                    {SIZE_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>)}
                  </select>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[28px] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-900/50 active:scale-95 disabled:opacity-20"
                >
                  {loading ? "Adding..." : "Add Variant"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Configuration Registry (Grid) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-sm flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-2 h-10 bg-blue-500 rounded-full" />
                <h3 className="text-xl font-black uppercase tracking-tighter">All Variants</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-6 py-2 rounded-full">
                {variants.length} Variants Found
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              {variants.map(v => (
                <div key={v.id} className="group p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col gap-6 transition-all hover:bg-white hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Color</span>
                      <span className="text-xl font-black text-gray-900 uppercase tracking-tight">{v.color || "Static"}</span>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(v)}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${v.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100" : "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100"}`}
                      title={v.isActive ? "Click to Deactivate" : "Click to Activate"}
                    >
                      {v.isActive ? "Live" : "Inactive"}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-200/60">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-bold uppercase text-gray-400">Size</span>
                      <span className="text-sm font-black text-gray-900">{SIZE_OPTIONS.find(o => o.value === v.size)?.label || "—"}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-l border-gray-200/60 pl-4">
                      <span className="text-[8px] font-bold uppercase text-gray-400">Waist</span>
                      <span className="text-sm font-black text-gray-900">{v.waist || "—"}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-l border-gray-200/60 pl-4">
                      <span className="text-[8px] font-bold uppercase text-gray-400">Length</span>
                      <span className="text-sm font-black text-gray-900">{v.length || "—"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Stock</span>
                      <span className="text-lg font-black text-blue-600 tracking-tighter">{v.quantity} Units</span>
                    </div>
                    <button
                      onClick={() => setSelectedVariantId(v.id)}
                      className="p-4 bg-gray-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-90"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Adjust Payload Modal (Pseudo-Scientific) */}
      {selectedVariantId && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-xl flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[64px] shadow-2xl w-full max-w-md flex flex-col gap-8 animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-[32px] flex items-center justify-center text-4xl shadow-inner border border-blue-100">⚖️</div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Adjust Stock</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Update current inventory level</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Quantity</label>
              <input
                type="number" value={adjustQuantity} onChange={(e) => setAdjustQuantity(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-[32px] px-10 py-6 outline-none focus:ring-8 focus:ring-blue-50 focus:border-blue-500 transition-all font-black text-4xl text-center tracking-tighter"
                placeholder="00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleAdjust('add')} className="py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[28px] text-xs font-black uppercase tracking-widest transition-all shadow-lg">Add Stock</button>
              <button onClick={() => handleAdjust('remove')} className="py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-[28px] text-xs font-black uppercase tracking-widest transition-all shadow-lg">Remove Stock</button>
            </div>

            <button onClick={() => setSelectedVariantId(null)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariant;
