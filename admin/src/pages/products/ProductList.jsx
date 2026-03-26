import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import API from "../../services/api";
import { currency, backendUrl } from "../../App";

const ProductCard = React.memo(({ p, navigate, toggleStatus, handleRestore, handleDelete, handleRemoveDiscount, currency }) => {
  const discountPercent = Number(p.discountPrecentage ?? p.discountPercentage ?? p.discount?.discountPercent ?? 0);
  const hasDiscount = discountPercent > 0;
  const finalPrice = p.finalPrice ?? p.price;

  return (
    <div className="group relative bg-white rounded-[48px] border border-gray-100 p-4 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 hover:-translate-y-3">
      {/* Product Image */}
      <div className="relative aspect-[4/5] rounded-[38px] overflow-hidden bg-gray-50 mb-6">
        <img
          src={p.mainImageUrl}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          alt={p.name}
          loading="lazy"
          onError={(e) => {
            e.target.src = "https://placehold.co/400x500?text=No+Image";
          }}
        />

        {/* Status Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {(p.deletedAt !== null && p.deletedAt !== undefined) ? (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white border border-rose-500 backdrop-blur-md shadow-sm">
              Deleted
            </span>
          ) : (
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border shadow-sm ${p.isActive ? "bg-emerald-500/80 text-white border-emerald-400" : "bg-gray-500/80 text-white border-gray-400"}`}>
              {p.isActive ? "Active" : "Inactive"}
            </span>
          )}
          {hasDiscount && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white border border-rose-400 backdrop-blur-md shadow-sm">
              -{discountPercent.toFixed(0)}%
            </span>
          )}
          {p.discountStatus !== null && p.discountStatus !== undefined && (
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md ${p.discountStatus ? "bg-amber-500/80 text-white border-amber-400" : "bg-gray-400/80 text-white border-gray-300"}`}>
              {p.discountStatus ? "Discount Active" : "Discount Inactive"}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
          <button onClick={() => navigate(`/add?edit=${p.id}`)} className="p-4 bg-white/10 hover:bg-white text-white hover:text-gray-900 rounded-full transition-all border border-white/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          <button onClick={() => navigate(`/products/${p.id}`)} className="p-4 bg-white/10 hover:bg-emerald-500 text-white rounded-full transition-all border border-white/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="px-4 pb-4">
        <div className="flex justify-between items-start mb-2">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">ID: {p.id}</p>
          <p className={`text-[10px] font-black uppercase tracking-widest ${p.availableQuantity > 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {p.availableQuantity > 0 ? `Stock: ${p.availableQuantity}` : "Out of stock"}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#BBA14F]">
            Sold: {p.totalSold ?? p.totalsold ?? 0}
          </p>
        </div>
        <h4 className="text-xl font-black text-gray-900 leading-tight uppercase tracking-tighter mb-4 truncate">
          {p.name}
        </h4>

        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</span>
            {hasDiscount && finalPrice !== p.price ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black text-emerald-600 tracking-tighter">{currency} {Number(finalPrice).toFixed(2)}</span>
                <span className="text-sm text-gray-400 line-through font-bold">{currency} {Number(p.price).toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-2xl font-black text-gray-900 tracking-tighter">{currency} {Number(p.price).toFixed(2)}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasDiscount && !(p.deletedAt !== null && p.deletedAt !== undefined) && (
              <button
                onClick={() => handleRemoveDiscount && handleRemoveDiscount(p.id)}
                className="p-3 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                title="Remove Discount"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            {!(p.deletedAt !== null && p.deletedAt !== undefined) && (
              <button
                onClick={() => toggleStatus(p)}
                className={`p-3 rounded-2xl transition-all border ${p.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-gray-400 border-gray-100"}`}
                title="Toggle Status"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>
            )}
            {(p.deletedAt !== null && p.deletedAt !== undefined) ? (
              <button
                onClick={() => handleRestore(p.id)}
                className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"
                title="Restore Product"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            ) : (
              <button
                onClick={() => handleDelete(p.id)}
                className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"
                title="Delete Product"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const ProductList = ({ token }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subcategoryIdFromUrl = searchParams.get("subcategory") || searchParams.get("subcategoryId");
  const collectionIdFromUrl = searchParams.get("collection") || searchParams.get("collectionId");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [deletedFilter, setDeletedFilter] = useState("not_deleted");
  const [specialFilter, setSpecialFilter] = useState("all"); // all, newarrivals, bestsellers
  const [stockFilter, setStockFilter] = useState("all"); // all, instock, outofstock
  const [genderFilter, setGenderFilter] = useState(""); // "", 0, 1, 2, 3
  const [subcategoryFilter, setSubcategoryFilter] = useState(subcategoryIdFromUrl || "");
  const [subcategories, setSubcategories] = useState([]);
  const pageSize = 12;

  // Fetch subcategories for filter
  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const subs = await API.subcategories.getAll(token);
        setSubcategories(subs);
      } catch (err) {
        console.error("Failed to load subcategories for filter");
      }
    };
    if (token) fetchSubs();
  }, [token]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      
      // Select the correct endpoint based on URL params or special filters
      if (collectionIdFromUrl) {
        res = (await axios.get(`${backendUrl}/api/Collection/${collectionIdFromUrl}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        })).data;
      } else if (subcategoryFilter && subcategoryFilter !== "") {
        res = (await axios.get(`${backendUrl}/api/Products/subcategory/${subcategoryFilter}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page, pageSize }
        })).data;
      } else if (specialFilter !== "all") {
        const specialParams = { page, pageSize };
        if (statusFilter === "active") specialParams.isActive = true;
        else if (statusFilter === "inactive") specialParams.isActive = false;
        if (deletedFilter === "deleted") specialParams.includeDeleted = true;

        const rawRes = await axios.get(`${backendUrl}/api/Products/${specialFilter}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: specialParams
        });
        // Handle both wrapped and unwrapped response shapes from specialty endpoints
        res = rawRes.data;
      } else {
        const filters = {
          searchTerm: debouncedSearch,
          page,
          pageSize,
          isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : null,
        };

        // Send inStock only when explicitly filtered (true or false) — omit when "all"
        if (stockFilter === "instock") filters.inStock = true;
        else if (stockFilter === "outofstock") filters.inStock = false;

        // Send gender only when a specific gender is selected
        if (genderFilter !== "") filters.gender = genderFilter;

        if (deletedFilter === "all") {
          filters.includeDeleted = null;
        } else if (deletedFilter === "deleted") {
          filters.includeDeleted = true;
        }

        res = await API.products.list(filters, token);
      }

      // Support multiple response wrapper shapes from different endpoints
      const body = res?.responseBody ?? res;
      const data = body?.data || [];
      const total = body?.totalCount ?? body?.total ?? 0;

      const normalizeUrl = (raw) => {
        if (!raw || typeof raw !== "string") return null;
        if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
        const cleanPath = raw.startsWith("/") ? raw.substring(1) : raw;
        const baseUrl = backendUrl.endsWith("/") ? backendUrl : `${backendUrl}/`;
        return `${baseUrl}${cleanPath}`;
      };

      const normalizedData = data.map((p) => {
        let imgUrl = null;
        if (p.images && p.images.length > 0) {
          imgUrl = normalizeUrl(p.images[0].url) || normalizeUrl(p.images[0].filePath);
        }
        if (!imgUrl) {
          imgUrl = normalizeUrl(p.mainImage) || normalizeUrl(p.imageUrl);
        }
        return { ...p, mainImageUrl: imgUrl };
      });

      setProducts(normalizedData);
      setTotalCount(deletedFilter === "all" ? total : normalizedData.length);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [token, debouncedSearch, page, statusFilter, deletedFilter, subcategoryFilter, collectionIdFromUrl, specialFilter, stockFilter, genderFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, deletedFilter, debouncedSearch, specialFilter, stockFilter, genderFilter, subcategoryFilter]);

  const toggleStatus = useCallback(async (product) => {
    try {
      if (product.isActive) await API.products.deactivate(product.id, token);
      else await API.products.activate(product.id, token);
      toast.success("Status updated");
      fetchProducts();
    } catch (e) { toast.error("Update failed"); }
  }, [token, fetchProducts]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await API.products.delete(id, token);
      toast.success("Product deleted");
      fetchProducts();
    } catch (e) { toast.error("Delete failed"); }
  }, [token, fetchProducts]);

  const handleRemoveDiscount = useCallback(async (id) => {
    if (!window.confirm("Remove discount from this product?")) return;
    try {
      await API.products.removeDiscount(id, token);
      toast.success("Discount removed");
      fetchProducts();
    } catch (e) { toast.error("Failed to remove discount"); }
  }, [token, fetchProducts]);

  const handleRestore = useCallback(async (id) => {
    try {
      await API.products.restore(id, token);
      toast.success("Product restored");
      fetchProducts();
    } catch (e) { toast.error("Restore failed"); }
  }, [token, fetchProducts]);

  // Sync filter when URL params change (from external navigation)
  useEffect(() => {
    if (subcategoryIdFromUrl) setSubcategoryFilter(subcategoryIdFromUrl);
  }, [subcategoryIdFromUrl]);

  return (
    <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-6 duration-700">
      
      {/* Contextual Filter Indicator */}
      {(subcategoryFilter || collectionIdFromUrl) && (
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[32px] flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg">🎯</div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active Content Matrix</span>
              <span className="text-sm font-bold text-emerald-900 leading-none">
                {subcategoryFilter ? `Filtering Products by Subcategory #${subcategoryFilter}` : `Filtering Products by Collection #${collectionIdFromUrl}`}
              </span>
            </div>
          </div>
          <button 
            onClick={() => {
              setSubcategoryFilter("");
              navigate("/products");
            }}
            className="px-6 py-2.5 bg-white border border-emerald-200 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
          >
            Clear Filter Matrix
          </button>
        </div>
      )}
      <div className="flex flex-col gap-8">
        {/* Top Control Bar: Search & Master Action */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex-1 relative group">
            <input
              type="text"
              placeholder="Search products by identity, code, or keyword..."
              className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-transparent rounded-[28px] outline-none focus:ring-8 focus:ring-emerald-50 focus:bg-white focus:border-emerald-300 transition-all font-bold text-sm shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <button onClick={() => navigate('/add')} className="px-12 py-5 bg-gray-900 text-white rounded-[28px] text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl hover:scale-[1.02] active:scale-95 shrink-0">
            Publish New Asset
          </button>
        </div>

        {/* Bottom Control Bar: Refined Filtering Matrix */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-[40px] border border-gray-100 shadow-sm overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-6 min-w-max">
            {/* Strategy Selectors */}
            <div className="flex bg-gray-100 p-1.5 rounded-[22px] border border-gray-200 shadow-inner">
              {[
                { id: 'all', label: 'All', icon: '🌍' },
                { id: 'newarrivals', label: 'Recent', icon: '✨' },
                { id: 'bestsellers', label: 'Best Sellers', icon: '📈' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSpecialFilter(f.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[9px] font-black uppercase tracking-widest transition-all ${specialFilter === f.id ? "bg-white text-emerald-600 shadow-xl" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <span>{f.icon}</span> {f.label}
                </button>
              ))}
            </div>

            <div className="w-px h-8 bg-gray-100" />

            {/* Matrix Filters */}
            <div className="flex items-center gap-4">
              {[
                { label: 'Status', value: statusFilter, setter: setStatusFilter, options: [{v:'all', l:'All'}, {v:'active', l:'Live'}, {v:'inactive', l:'Inactive'}] },
                { label: 'Archive', value: deletedFilter, setter: setDeletedFilter, options: [{v:'all', l:'Combined'}, {v:'deleted', l:'Trashed'}, {v:'not_deleted', l:'Active Only'}] },
                { label: 'Stock', value: stockFilter, setter: setStockFilter, options: [{v:'all', l:'Quantity: All'}, {v:'instock', l:'In Stock'}, {v:'outofstock', l:'Exhausted'}] },
                { label: 'Gender', value: genderFilter, setter: setGenderFilter, options: [{v:'', l:'Gender: All'}, {v:'0', l:'Man'}, {v:'1', l:'Woman'}, {v:'2', l:'Kids'}, {v:'3', l:'Unisex'}] }
              ].map((filter, i) => (
                <div key={i} className="flex bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-colors">
                  <select
                    value={filter.value}
                    onChange={(e) => filter.setter(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-gray-600 hover:text-emerald-600 transition-colors appearance-none"
                  >
                    {filter.options.map(opt => <option key={opt.v} value={opt.v}>{opt.l}</option>)}
                  </select>
                </div>
              ))}

              {/* Specialized Subcategory Filter */}
              <div className="flex bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-colors">
                <select
                  value={subcategoryFilter}
                  onChange={(e) => setSubcategoryFilter(e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-emerald-700 hover:text-emerald-900 transition-colors appearance-none max-w-[120px]"
                >
                  <option value="">Type: All</option>
                  {subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {loading ? (
          [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white h-[450px] rounded-[48px] border border-gray-100 animate-pulse" />
          ))
        ) : products.length === 0 ? (
          <div className="col-span-full py-40 flex flex-col items-center gap-6 text-gray-300">
            <div className="text-8xl opacity-20">🌫️</div>
            <p className="font-black uppercase tracking-[0.3em] text-xs">No products found</p>
          </div>
        ) : (
          products.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              navigate={navigate}
              toggleStatus={toggleStatus}
              handleRestore={handleRestore}
              handleDelete={handleDelete}
              handleRemoveDiscount={handleRemoveDiscount}
              currency={currency}
            />
          ))
        )}
      </div>

      {totalCount > pageSize && (
        <div className="flex justify-center mt-10">
          <div className="inline-flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-[30px] shadow-2xl">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-4 rounded-full hover:bg-gray-100 disabled:opacity-20 transition-all text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center gap-3 px-2">
              <span className="text-sm font-black text-gray-900">{page}</span>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">of</span>
              <span className="text-sm font-bold text-gray-400">{Math.ceil(totalCount / pageSize)}</span>
            </div>
            <button
              disabled={page === Math.ceil(totalCount / pageSize)}
              onClick={() => setPage(p => p + 1)}
              className="p-4 rounded-full hover:bg-gray-100 disabled:opacity-20 transition-all text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
