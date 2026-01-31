import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../services/api";

const ProductAdd = ({ token }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const editId = searchParams.get("edit");
  const [loading, setLoading] = useState(false);
  const [subcategories, setSubcategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "", description: "", subcategoryid: "", fitType: "", gender: "", price: "",
    isActive: true, inStock: true, onSale: false, material: "", careInstructions: "", shippingInfo: ""
  });

  const [images, setImages] = useState({ main: null, additional: [] });
  const [previews, setPreviews] = useState({ main: null, additional: [] });

  useEffect(() => {
    (async () => {
      try {
        const subs = await API.subcategories.getAll(token);
        setSubcategories(subs);
      } catch (e) { toast.error("Failed to load categories"); }
    })();
  }, [token]);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await API.products.getById(editId, token);
        const p = res?.responseBody?.data;
        if (p) setFormData({
          name: p.name || "", description: p.description || "", subcategoryid: p.subCategoryId || "",
          fitType: p.fitType?.toString() || "", gender: p.gender?.toString() || "", price: p.price?.toString() || "",
          isActive: p.isActive ?? true, inStock: p.inStock ?? true, onSale: p.onSale ?? false,
          material: p.material || "", careInstructions: p.careInstructions || "", shippingInfo: p.shippingInfo || ""
        });
      } catch (e) { toast.error("Failed to load product details"); }
    })();
  }, [editId, token]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImages(prev => ({ ...prev, main: file }));
      setPreviews(prev => ({ ...prev, main: URL.createObjectURL(file) }));
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => ({ ...prev, additional: [...prev.additional, ...files] }));
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => ({ ...prev, additional: [...prev.additional, ...newPreviews] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const productPayload = { ...formData, subcategoryid: Number(formData.subcategoryid), fitType: Number(formData.fitType), gender: Number(formData.gender), price: Number(formData.price) };

      let productId = editId;
      if (editId) {
        await API.products.update(editId, productPayload, token);
      } else {
        const res = await API.products.create(productPayload, token);
        productId = res.responseBody?.data?.id;
      }

      if (productId && images.main) await API.images.uploadMain(productId, images.main, token);
      if (productId && images.additional.length) await API.images.uploadAdditional(productId, images.additional, token);

      toast.success(editId ? "Product updated successfully" : "Product created successfully");
      navigate("/products");
    } catch (err) {
      toast.error("Failed to save product");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-6 duration-700">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Product Details Area */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col gap-10">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-emerald-500 rounded-full" />
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Product Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Product Name</label>
                <input
                  name="name" value={formData.name} onChange={handleInputChange} required
                  className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-8 py-4 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-bold text-lg"
                  placeholder="Enter product name"
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description</label>
                <textarea
                  name="description" value={formData.description} onChange={handleInputChange} required
                  className="w-full bg-gray-50 border border-gray-100 rounded-[32px] px-8 py-6 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium text-gray-600 min-h-[150px]"
                  placeholder="Enter product description..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Price</label>
                <input
                  name="price" type="number" value={formData.price} onChange={handleInputChange} required
                  className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-8 py-4 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-black text-xl"
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Subcategory</label>
                <select
                  name="subcategoryid" value={formData.subcategoryid} onChange={handleInputChange} required
                  className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-8 py-4 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-bold"
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fit Type</label>
                <select
                  name="fitType" value={formData.fitType} onChange={handleInputChange} required
                  className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-8 py-4 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-bold"
                >
                  <option value="">Select Fit Type</option>
                  <option value="1">Slim</option>
                  <option value="2">Regular</option>
                  <option value="3">Oversized</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Gender</label>
                <select
                  name="gender" value={formData.gender} onChange={handleInputChange} required
                  className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-8 py-4 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-bold"
                >
                  <option value="">Select Gender</option>
                  <option value="1">Male</option>
                  <option value="2">Female</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col gap-8">
            <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Product Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { label: "Material", name: "material", p: "e.g. 100% Cotton" },
                { label: "Care Instructions", name: "careInstructions", p: "e.g. Wash cold" },
                { label: "Shipping Information", name: "shippingInfo", p: "e.g. Ships in 3-5 days" },
              ].map(f => (
                <div key={f.name} className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{f.label}</label>
                  <input
                    name={f.name} value={formData[f.name]} onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-[20px] px-6 py-3.5 outline-none focus:ring-4 focus:ring-emerald-50 font-bold text-sm"
                    placeholder={f.p}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Images & Settings */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Main Visual Uplink */}
          <div className="bg-emerald-900 p-10 rounded-[48px] shadow-2xl shadow-emerald-900/20 text-white flex flex-col gap-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Primary Image</h4>
            <div className="relative aspect-square rounded-[40px] bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group">
              {previews.main ? (
                <img src={previews.main} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="text-center p-6">
                  <div className="text-4xl mb-4 opacity-30">📸</div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Upload Main Photo</p>
                </div>
              )}
              <input type="file" onChange={handleMainImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
              <div className="absolute bottom-6 right-6 p-4 bg-white text-emerald-900 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              </div>
            </div>
          </div>

          {/* Additional Asset Matrix */}
          <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm flex flex-col gap-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-2">Gallery Images</h4>
            <div className="grid grid-cols-3 gap-3">
              {previews.additional.map((src, idx) => (
                <div key={idx} className="aspect-square rounded-[24px] overflow-hidden bg-gray-50 border border-gray-100 shadow-inner">
                  <img src={src} className="w-full h-full object-cover" alt="" />
                </div>
              ))}
              <div className="relative aspect-square rounded-[24px] bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer group">
                <span className="text-2xl opacity-20 group-hover:opacity-100 group-hover:scale-125 transition-all">➕</span>
                <input type="file" multiple onChange={handleAdditionalImagesChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
              </div>
            </div>
          </div>

          {/* Status Protocols */}
          <div className="bg-gray-50 p-8 rounded-[48px] border border-gray-100 flex flex-col gap-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-2">Availability & Visibility</h4>
            <div className="flex flex-col gap-4">
              {[
                { label: "Is Product Active", name: "isActive" },
                { label: "In Stock", name: "inStock" },
                { label: "On Sale", name: "onSale" },
              ].map(p => (
                <label key={p.name} className="flex items-center justify-between p-4 bg-white rounded-[24px] border border-gray-100 transition-all cursor-pointer group hover:shadow-lg hover:shadow-gray-900/5">
                  <span className="text-[11px] font-black uppercase text-gray-600 tracking-tight">{p.label}</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name={p.name} checked={formData[p.name]} onChange={handleInputChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </div>
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[32px] text-sm font-black uppercase tracking-widest transition-all shadow-2xl shadow-emerald-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {editId ? "Update Product" : "Create Product"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductAdd;
