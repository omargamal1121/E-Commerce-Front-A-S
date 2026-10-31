import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/api";
import { useTranslation } from "react-i18next";

const PRESET_COLORS = [
  { name: "White",  hex: "#FFFFFF" },
  { name: "Black",  hex: "#000000" },
  { name: "Red",    hex: "#FF0000" },
  { name: "Blue",   hex: "#0000FF" },
  { name: "Green",  hex: "#008000" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Gray",   hex: "#808080" },
  { name: "Navy",   hex: "#000080" },
  { name: "Purple", hex: "#800080" },
  { name: "Orange", hex: "#FFA500" },
];

const EMPTY_FORM = { color: "", size: "", waist: "", length: "", chest: "", hip: "", sleeveLength: "", isFreeSize: false, quantity: "" };
const EMPTY_FILTERS = { color: "", size: "", waist: "", length: "", isActive: "", deletedOnly: false };

const getColorName = (c) => {
  if (!c) return "—";
  if (!c.startsWith("#")) return c;
  const found = PRESET_COLORS.find(p => p.hex.toLowerCase() === c.toLowerCase());
  return found ? found.name : c;
};

const VariantFormFields = ({ form, setForm, darkMode = false }) => {
  const inputCls = darkMode
    ? "bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-blue-500 font-bold text-sm transition-all text-white"
    : "bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 font-bold text-sm transition-all text-gray-900";
  const labelCls = darkMode
    ? "text-[9px] font-bold uppercase text-gray-500 tracking-widest ml-1"
    : "text-[9px] font-bold uppercase text-gray-400 tracking-widest ml-1";

  return (
    <>
      {/* Color */}
      <div className="flex flex-col gap-2">
        <label className={labelCls}>Color (Hex or Name)</label>
        <div className="flex gap-2">
          <input
            type="text" value={form.color}
            onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            className={`flex-1 ${inputCls}`}
            placeholder="#FFFFFF or Black"
          />
          <div className="relative">
            <input
              type="color"
              value={form.color.startsWith("#") ? form.color : "#000000"}
              onChange={e => setForm(f => ({ ...f, color: e.target.value.toUpperCase() }))}
              className="w-12 h-[50px] opacity-0 absolute inset-0 z-10 cursor-pointer"
            />
            <div
              className="w-12 h-[50px] rounded-2xl border border-white/10 flex items-center justify-center text-lg"
              style={{ backgroundColor: form.color || "transparent" }}
            >
              {!form.color && "🎨"}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c.hex} type="button"
              onClick={() => setForm(f => ({ ...f, color: c.hex }))}
              title={c.name}
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-125 ${form.color === c.hex ? "border-blue-500 scale-110" : darkMode ? "border-white/20" : "border-gray-300"}`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      {/* Numeric fields */}
      {[
        { key: "waist",       label: "Waist" },
        { key: "length",      label: "Length" },
        { key: "chest",       label: "Chest" },
        { key: "hip",         label: "Hip" },
        { key: "sleeveLength",label: "Sleeve Length" },
      ].map(f => (
        <div key={f.key} className="flex flex-col gap-2">
          <label className={labelCls}>{f.label}</label>
          <input
            type="number" min="0"
            value={form[f.key]}
            onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
            className={inputCls} placeholder="0"
          />
        </div>
      ))}

      {/* Free Size */}
      <div
        className={`flex items-center gap-3 ${darkMode ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"} rounded-2xl px-5 py-3.5 cursor-pointer`}
        onClick={() => setForm(f => ({ ...f, isFreeSize: !f.isFreeSize }))}
      >
        <input
          type="checkbox" checked={form.isFreeSize} readOnly
          className="w-5 h-5 accent-blue-600 rounded cursor-pointer pointer-events-none"
        />
        <label className={`text-xs font-bold uppercase cursor-pointer select-none ${darkMode ? "text-white/90" : "text-gray-700"}`}>
          Free Size
        </label>
      </div>

      {/* Size */}
      <div className="flex flex-col gap-2">
        <label className={labelCls}>Size</label>
        <div className="flex flex-wrap gap-2 mb-1">
          {["S", "M", "L", "XL", "XXL"].map(s => (
            <button
              key={s} type="button"
              onClick={() => setForm(f => ({ ...f, size: s }))}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${form.size === s ? "bg-blue-600 text-white" : darkMode ? "bg-white/10 text-white/70 hover:bg-white/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          type="text" value={form.size}
          onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
          placeholder="Or custom (e.g. 30, 32, 3XL)"
          className={inputCls}
        />
      </div>
    </>
  );
};

const ProductVariant = ({ token }) => {
  const { t } = useTranslation();
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Add form
  const [addForm, setAddForm] = useState(EMPTY_FORM);

  // Filters
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  // Quantity adjust modal
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState("");

  // Edit modal
  const [editVariant, setEditVariant] = useState(null); // the variant being edited
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isDeleted = product?.deletedAt !== null && product?.deletedAt !== undefined;

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await API.products.getById(productId, token);
      setProduct(res.responseBody.data);
    } catch (e) {
      toast.error(e.response?.status === 404 ? t("productNotFound") : t("failedToLoadProduct"));
    } finally { setLoading(false); }
  };

  const fetchVariants = useCallback(async (filterOverride) => {
    setVariantsLoading(true);
    const active = filterOverride ?? appliedFilters;
    try {
      const res = await API.variants.getByProductId(productId, active, token);
      setVariants(res.responseBody?.data || []);
    } catch (e) {
      if (e.response?.status === 404) setVariants([]);
      else console.error(t("failedToLoadVariants"), e);
    } finally { setVariantsLoading(false); }
  }, [productId, token, appliedFilters]);

  useEffect(() => {
    if (productId) { fetchProduct(); fetchVariants(EMPTY_FILTERS); }
  }, [productId, token]);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    fetchVariants({ ...filters });
  };

  const handleResetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    fetchVariants(EMPTY_FILTERS);
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    const { color, size, waist, length, chest, hip, sleeveLength } = addForm;
    if (!color && !size && !waist && !length && !chest && !hip && !sleeveLength) {
      toast.error("Provide at least one attribute.");
      return;
    }
    setLoading(true);
    try {
      await API.variants.add(productId, {
        color: color || undefined,
        size: size || undefined,
        waist: waist !== "" ? Number(waist) : undefined,
        length: length !== "" ? Number(length) : undefined,
        chest: chest !== "" ? Number(chest) : undefined,
        hip: hip !== "" ? Number(hip) : undefined,
        sleeveLength: sleeveLength !== "" ? Number(sleeveLength) : undefined,
        isFreeSize: Boolean(addForm.isFreeSize),
        quantity: addForm.quantity ? Number(addForm.quantity) : 0,
      }, token);
      toast.success(t("variantAdded"));
      setAddForm(EMPTY_FORM);
      fetchVariants();
    } catch (e) {
      if (e.response?.data?.errors?.messages?.length) {
        e.response.data.errors.messages.forEach(m => toast.error(m));
      } else {
        toast.error(e.response?.data?.message || t("failedToAddVariant"));
      }
    } finally { setLoading(false); }
  };

  const handleAdjust = async (type) => {
    if (!selectedVariantId || !adjustQuantity) return;
    try {
      if (type === "add") await API.variants.addQuantity(productId, selectedVariantId, adjustQuantity, token);
      else await API.variants.removeQuantity(productId, selectedVariantId, adjustQuantity, token);
      toast.success(t("quantityUpdated"));
      setSelectedVariantId(null); setAdjustQuantity("");
      fetchVariants();
    } catch { toast.error(t("failedToUpdateQuantity")); }
  };

  const handleToggleStatus = async (v) => {
    try {
      if (v.isActive) await API.variants.deactivate(productId, v.id, token);
      else await API.variants.activate(productId, v.id, token);
      toast.success(v.isActive ? t("variantDeactivated") : t("variantActivated"));
      fetchVariants();
    } catch { toast.error(t("failedToUpdateStatus")); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await API.variants.delete(productId, deleteTarget.id, token);
      toast.success("Variant deleted.");
      setDeleteTarget(null);
      fetchVariants();
    } catch { toast.error("Failed to delete variant."); }
    finally { setDeleteLoading(false); }
  };

  const openEdit = (v) => {
    setEditVariant(v);
    setEditForm({
      color: v.color || "",
      size: v.size || "",
      waist: v.waist ?? "",
      length: v.length ?? "",
      chest: v.chest ?? "",
      hip: v.hip ?? "",
      sleeveLength: v.sleeveLength ?? "",
      isFreeSize: v.isFreeSize || false,
    });
  };

  const handleEditSave = async () => {
    if (!editVariant) return;
    setEditLoading(true);
    try {
      await API.variants.update(productId, editVariant.id, editForm, token);
      toast.success("Variant updated.");
      setEditVariant(null);
      fetchVariants();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update variant.");
    } finally { setEditLoading(false); }
  };

  const handleRestoreProduct = async () => {
    setActionLoading(true);
    try {
      await API.products.restore(product.id, token);
      toast.success(t("productRestored"));
      fetchProduct(); fetchVariants();
    } catch { toast.error(t("restoreFailed")); }
    finally { setActionLoading(false); }
  };

  const activeFilterCount = Object.entries(appliedFilters).filter(([k, v]) =>
    k === "deletedOnly" ? v === true : v !== ""
  ).length;

  return (
    <div className="flex flex-col gap-10 max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-[28px] flex items-center justify-center text-3xl shadow-inner border border-blue-100/50 text-blue-600">🧬</div>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
                {product?.name || t("products")} {t("variantsManagement")}
              </h1>
              {isDeleted && (
                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white border border-rose-500">
                  {t("deleted")}
                </span>
              )}
            </div>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">{t("manageVariationsAndStock")}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isDeleted && (
            <button onClick={handleRestoreProduct} disabled={actionLoading}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50">
              {actionLoading ? t("restoring") : t("restoreProduct")}
            </button>
          )}
          <button onClick={() => navigate("/products")}
            className="px-8 py-3 bg-gray-50 border border-gray-100 rounded-[22px] text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
            {t("backToProducts")}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-[36px] border border-gray-100 shadow-sm p-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Color */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Color</label>
            <input
              type="text" value={filters.color}
              onChange={e => setFilters(f => ({ ...f, color: e.target.value }))}
              placeholder="e.g. #FFFFFF"
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all w-36"
            />
          </div>
          {/* Size */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Size</label>
            <input
              type="text" value={filters.size}
              onChange={e => setFilters(f => ({ ...f, size: e.target.value }))}
              placeholder="e.g. M, 32"
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all w-28"
            />
          </div>
          {/* Waist */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Waist</label>
            <input
              type="number" min="0" value={filters.waist}
              onChange={e => setFilters(f => ({ ...f, waist: e.target.value }))}
              placeholder="0"
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all w-24"
            />
          </div>
          {/* Length */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Length</label>
            <input
              type="number" min="0" value={filters.length}
              onChange={e => setFilters(f => ({ ...f, length: e.target.value }))}
              placeholder="0"
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all w-24"
            />
          </div>
          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Status</label>
            <select
              value={filters.isActive}
              onChange={e => setFilters(f => ({ ...f, isActive: e.target.value }))}
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
          {/* Deleted Only */}
          <label className="flex items-center gap-2 cursor-pointer select-none pb-1">
            <input
              type="checkbox" checked={filters.deletedOnly}
              onChange={e => setFilters(f => ({ ...f, deletedOnly: e.target.checked }))}
              className="w-4 h-4 accent-rose-500 cursor-pointer"
            />
            <span className="text-xs font-black uppercase tracking-tight text-gray-600">Deleted Only</span>
          </label>

          {/* Buttons */}
          <div className="flex items-center gap-3 ml-auto">
            {activeFilterCount > 0 && (
              <button onClick={handleResetFilters}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                Reset
              </button>
            )}
            <button onClick={handleApplyFilters}
              className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/10 flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Apply{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Add Form */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-gray-900 p-10 rounded-[56px] text-white shadow-2xl shadow-blue-900/20 border border-blue-900/30 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-blue-500 rounded-full" />
              <h3 className="text-xl font-black uppercase tracking-tighter">{t("addNewVariant")}</h3>
            </div>

            {isDeleted ? (
              <div className="flex flex-col items-center gap-4 p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <div className="text-4xl">⚠️</div>
                <p className="text-center text-white/80 font-bold text-sm">{t("productDeletedWarning")}</p>
              </div>
            ) : (
              <form onSubmit={handleAddVariant} className="flex flex-col gap-5">
                <VariantFormFields form={addForm} setForm={setAddForm} darkMode />
                {/* Quantity */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-bold uppercase text-gray-500 tracking-widest ml-1">{t("quantity")}</label>
                  <input
                    type="number" min="0" value={addForm.quantity}
                    onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-blue-500 font-bold text-sm transition-all text-white"
                    placeholder="0"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[28px] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-900/50 active:scale-95 disabled:opacity-20">
                  {loading ? t("adding") : t("addVariant")}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Variants Grid */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-sm flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-2 h-10 bg-blue-500 rounded-full" />
                <h3 className="text-xl font-black uppercase tracking-tighter">{t("variantList")}</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-6 py-2 rounded-full">
                {variantsLoading ? "..." : variants.length} variants
              </span>
            </div>

            {variantsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-gray-100 rounded-[40px] animate-pulse" />
                ))}
              </div>
            ) : variants.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-4 text-gray-300">
                <div className="text-6xl opacity-20">🧬</div>
                <p className="font-black uppercase tracking-[0.3em] text-xs">No variants found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {variants.map(v => (
                  <div key={v.id} className="group p-7 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col gap-5 transition-all hover:bg-white hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1">
                    {/* Top row */}
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t("color")}</span>
                        <div className="flex items-center gap-2">
                          {v.color ? (
                            <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: v.color }} />
                          ) : null}
                          <span className="text-lg font-black text-gray-900 uppercase tracking-tight">
                            {v.color ? getColorName(v.color) : "No Color"}
                          </span>
                          {v.isFreeSize && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-700">Free</span>
                          )}
                          {v.deletedAt && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-700">Deleted</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleStatus(v)}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${v.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100" : "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100"}`}
                      >
                        {v.isActive ? t("active") : t("inactive")}
                      </button>
                    </div>

                    {/* Specs grid */}
                    <div className="grid grid-cols-3 gap-3 py-4 border-y border-gray-200/60 text-center">
                      {[
                        { label: "Size",    val: v.isFreeSize ? "Free" : (v.size || "—") },
                        { label: "Waist",   val: v.waist   ?? "—" },
                        { label: "Length",  val: v.length  ?? "—" },
                        { label: "Chest",   val: v.chest   ?? "—" },
                        { label: "Hip",     val: v.hip     ?? "—" },
                        { label: "Sleeve",  val: v.sleeveLength ?? "—" },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-bold uppercase text-gray-400">{s.label}</span>
                          <span className="text-sm font-black text-gray-900">{s.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Stock + Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t("stock")}</span>
                        <span className="text-lg font-black text-blue-600 tracking-tighter">{v.quantity} {t("units")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Adjust Stock */}
                        <button
                          onClick={() => setSelectedVariantId(v.id)}
                          title="Adjust Stock"
                          className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-90"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                        {/* Edit */}
                        {!v.deletedAt && (
                          <button
                            onClick={() => openEdit(v)}
                            title="Edit Variant"
                            className="p-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl hover:bg-amber-500 hover:text-white transition-all active:scale-90"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(v)}
                          title="Delete Variant"
                          className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adjust Stock Modal */}
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
                type="number" value={adjustQuantity}
                onChange={e => setAdjustQuantity(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-[32px] px-10 py-6 outline-none focus:ring-8 focus:ring-blue-50 focus:border-blue-500 transition-all font-black text-4xl text-center tracking-tighter"
                placeholder="00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleAdjust("add")} className="py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[28px] text-xs font-black uppercase tracking-widest transition-all shadow-lg">Add Stock</button>
              <button onClick={() => handleAdjust("remove")} className="py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-[28px] text-xs font-black uppercase tracking-widest transition-all shadow-lg">Remove Stock</button>
            </div>
            <button onClick={() => { setSelectedVariantId(null); setAdjustQuantity(""); }} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all">Cancel</button>
          </div>
        </div>
      )}

      {/* Edit Variant Modal */}
      {editVariant && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-xl flex items-center justify-center z-[100] animate-in fade-in duration-300 p-4">
          <div className="bg-white p-10 rounded-[56px] shadow-2xl w-full max-w-lg flex flex-col gap-6 animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-50 rounded-[24px] flex items-center justify-center text-2xl border border-amber-100">✏️</div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Edit Variant</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID #{editVariant.id}</p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <VariantFormFields form={editForm} setForm={setEditForm} darkMode={false} />
            </div>

            <div className="flex gap-4 pt-2">
              <button onClick={() => setEditVariant(null)}
                className="flex-1 py-4 bg-gray-50 border border-gray-200 text-gray-600 rounded-[28px] text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                Cancel
              </button>
              <button onClick={handleEditSave} disabled={editLoading}
                className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-[28px] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-900/10 active:scale-95 disabled:opacity-50">
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-xl flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[64px] shadow-2xl w-full max-w-md flex flex-col gap-8 animate-in zoom-in-95 duration-500 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center text-4xl shadow-inner border border-rose-100">🗑️</div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Delete Variant</h3>
              <p className="text-sm font-bold text-gray-500">
                Delete variant <span className="text-rose-600">#{deleteTarget.id}</span>
                {deleteTarget.color ? ` (${getColorName(deleteTarget.color)})` : ""}
                {deleteTarget.size ? ` / ${deleteTarget.size}` : ""}?<br />
                <span className="text-xs text-gray-400">This action cannot be undone.</span>
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}
                className="flex-1 py-4 bg-gray-50 border border-gray-200 text-gray-600 rounded-[28px] text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} disabled={deleteLoading}
                className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-[28px] text-xs font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 active:scale-95">
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariant;
