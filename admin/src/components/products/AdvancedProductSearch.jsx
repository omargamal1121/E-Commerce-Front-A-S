import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { currency } from "../../App";

const FIT_TYPE_SUGGESTIONS = [
  "Regular",
  "Slim",
  "Oversized",
  "Relaxed",
  "Wide-leg",
  "Skinny",
  "Loose",
  "Cargo"
];

const COLOR_SUGGESTIONS = [
  { name: "Black", hex: "#111827" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Beige", hex: "#D4B996" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Grey", hex: "#6B7280" },
  { name: "Brown", hex: "#78350F" },
  { name: "Green", hex: "#059669" },
  { name: "Red", hex: "#DC2626" }
];

const AdvancedProductSearch = ({
  filters,
  onChange,
  onApply,
  onReset,
  subcategories = [],
  activeFiltersCount = 0,
  isOpen = false,
  onToggle
}) => {
  const { t } = useTranslation();

  const handleFieldChange = (field, value) => {
    onChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white rounded-[36px] border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
      {/* Header bar that toggles panel visibility */}
      <div 
        onClick={onToggle}
        className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 transition-colors select-none"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-inner border border-emerald-100/50">
            🔍
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">
                Advanced Product Search
              </h3>
              {activeFiltersCount > 0 && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-sm">
                  {activeFiltersCount} Active
                </span>
              )}
            </div>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">
              Filter by subcategory, gender, fit type, price, size, color, stock, and status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-3 bg-gray-50 border border-gray-200/60 rounded-2xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            aria-label="Toggle Advanced Search"
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180 text-emerald-600" : ""}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="border-t border-gray-100 p-6 md:p-8 bg-gray-50/40 space-y-8 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. Search Term */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Keyword / Search Term
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.searchTerm || ""}
                  onChange={(e) => handleFieldChange("searchTerm", e.target.value)}
                  placeholder="Product name, description..."
                  className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all shadow-sm"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* 2. Subcategory */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Subcategory
              </label>
              <select
                value={filters.subcategoryid || ""}
                onChange={(e) => handleFieldChange("subcategoryid", e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
              >
                <option value="">All Subcategories</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Gender */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Gender
              </label>
              <select
                value={filters.gender !== undefined && filters.gender !== null ? filters.gender : ""}
                onChange={(e) => handleFieldChange("gender", e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
              >
                <option value="">All Genders</option>
                <option value="0">Man (Men)</option>
                <option value="1">Woman (Women)</option>
                <option value="2">Kids</option>
                <option value="3">Unisex</option>
              </select>
            </div>

            {/* 4. Fit Type with suggestions */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Fit Type
              </label>
              <input
                type="text"
                list="fitTypeSuggestions"
                value={filters.fitType || ""}
                onChange={(e) => handleFieldChange("fitType", e.target.value)}
                placeholder="e.g. Regular, Slim, Oversized..."
                className="w-full px-4 py-3.5 bg-white border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all shadow-sm"
              />
              <datalist id="fitTypeSuggestions">
                {FIT_TYPE_SUGGESTIONS.map(f => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>

            {/* 5. Price Range */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Price Range ({currency})
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={filters.minPrice || ""}
                  onChange={(e) => handleFieldChange("minPrice", e.target.value)}
                  placeholder="Min Price"
                  className="w-full px-3 py-3.5 bg-white border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all shadow-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={filters.maxPrice || ""}
                  onChange={(e) => handleFieldChange("maxPrice", e.target.value)}
                  placeholder="Max Price"
                  className="w-full px-3 py-3.5 bg-white border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* 6. Numeric Size Range */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Size Range (Numeric)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={filters.minSize || ""}
                  onChange={(e) => handleFieldChange("minSize", e.target.value)}
                  placeholder="Min Size"
                  className="w-full px-3 py-3.5 bg-white border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all shadow-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={filters.maxSize || ""}
                  onChange={(e) => handleFieldChange("maxSize", e.target.value)}
                  placeholder="Max Size"
                  className="w-full px-3 py-3.5 bg-white border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* 7. Color Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Color
              </label>
              <input
                type="text"
                value={filters.color || ""}
                onChange={(e) => handleFieldChange("color", e.target.value)}
                placeholder="e.g. Black, Beige, Blue..."
                className="w-full px-4 py-3.5 bg-white border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all shadow-sm"
              />
              {/* Quick Color Badges */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {COLOR_SUGGESTIONS.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleFieldChange("color", filters.color === c.name ? "" : c.name)}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all flex items-center gap-1.5 ${
                      filters.color?.toLowerCase() === c.name.toLowerCase()
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full border border-gray-300"
                      style={{ backgroundColor: c.hex }} 
                    />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 8. Sorting */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy || ""}
                  onChange={(e) => handleFieldChange("sortBy", e.target.value)}
                  className="flex-1 px-3 py-3.5 bg-white border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                >
                  <option value="">Default Order</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                  <option value="createdAt">Date Created</option>
                  <option value="availableQuantity">Stock Quantity</option>
                  <option value="totalSold">Total Sold</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleFieldChange("sortDescending", !filters.sortDescending)}
                  title={filters.sortDescending ? "Descending (High to Low / Newest)" : "Ascending (Low to High / Oldest)"}
                  className={`px-3 py-3.5 rounded-2xl border text-xs font-black transition-all flex items-center justify-center shrink-0 ${
                    filters.sortDescending 
                      ? "bg-gray-900 text-white border-gray-900" 
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {filters.sortDescending ? "DESC ▼" : "ASC ▲"}
                </button>
              </div>
            </div>

          </div>

          {/* Availability, Status & Flags Row */}
          <div className="pt-4 border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-6">
            
            <div className="flex flex-wrap items-center gap-6">
              {/* In Stock */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock:</span>
                <select
                  value={filters.inStock === undefined || filters.inStock === "" ? "" : String(filters.inStock)}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleFieldChange("inStock", val === "" ? "" : val === "true");
                  }}
                  className="bg-white border border-gray-200/80 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="">All Stock</option>
                  <option value="true">In Stock Only</option>
                  <option value="false">Out of Stock Only</option>
                </select>
              </div>

              {/* On Sale toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(filters.onSale)}
                  onChange={(e) => handleFieldChange("onSale", e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-black text-gray-700 uppercase tracking-tight">
                  On Sale / Discounted Only
                </span>
              </label>

              {/* Active Status (query param isActive) */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active:</span>
                <select
                  value={filters.isActive === undefined || filters.isActive === "" ? "" : String(filters.isActive)}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleFieldChange("isActive", val === "" ? "" : val === "true");
                  }}
                  className="bg-white border border-gray-200/80 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="">All (Active & Inactive)</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>

              {/* Include Deleted (query param includeDeleted) */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(filters.includeDeleted)}
                  onChange={(e) => handleFieldChange("includeDeleted", e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-xs font-black text-gray-700 uppercase tracking-tight">
                  Include Trashed / Deleted
                </span>
              </label>
            </div>

            {/* Action buttons: Apply & Reset */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onReset}
                className="flex-1 sm:flex-none px-6 py-3.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={onApply}
                className="flex-1 sm:flex-none px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/10 active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Apply Filters
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedProductSearch;
