import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { currency } from "../../App";

const ProductList = ({ token }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive
  const [deletedFilter, setDeletedFilter] = useState("not_deleted"); // all, deleted, not_deleted
  const pageSize = 12;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        searchTerm,
        page,
        pageSize,
        isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : null,
        includeDeleted: deletedFilter === "all" || deletedFilter === "deleted"
      };

      const res = await API.products.list(filters, token);
      let data = res?.responseBody?.data || [];
      let total = res?.responseBody?.totalCount || 0;

      // If "deleted" filter is selected, we filter client-side if the API doesn't support "deletedOnly"
      // Check deletedAt instead of isDeleted (deletedAt !== null means deleted)
      if (deletedFilter === "deleted") {
        data = data.filter(p => p.deletedAt !== null && p.deletedAt !== undefined);
        total = data.length; // This is a limitation of the current API if it only has includeDeleted
      } else if (deletedFilter === "not_deleted") {
        data = data.filter(p => p.deletedAt === null || p.deletedAt === undefined);
        total = data.length;
      }

      setProducts(data);
      setTotalCount(total);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [token, searchTerm, page, statusFilter, deletedFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, deletedFilter, searchTerm]);

  const toggleStatus = async (product) => {
    try {
      if (product.isActive) await API.products.deactivate(product.id, token);
      else await API.products.activate(product.id, token);
      toast.success("Status updated");
      fetchProducts();
    } catch (e) { toast.error("Update failed"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await API.products.delete(id, token);
      toast.success("Product deleted");
      fetchProducts();
    } catch (e) { toast.error("Delete failed"); }
  };

  const handleRestore = async (id) => {
    try {
      await API.products.restore(id, token);
      toast.success("Product restored");
      fetchProducts();
    } catch (e) { toast.error("Restore failed"); }
  };

  return (
    <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-6 duration-700">
      {/* Search Products */}
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative w-full max-w-xl group">
          <input
            type="text"
            placeholder="Search products by ID or name..."
            className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[28px] outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-bold text-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-gray-100 p-1.5 rounded-[22px] border border-gray-200 shadow-inner">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-transparent text-[11px] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer hover:text-emerald-600 transition-colors"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="w-[1px] bg-gray-300 my-1"></div>
            <select
              value={deletedFilter}
              onChange={(e) => { setDeletedFilter(e.target.value); setPage(1); }}
              className="bg-transparent text-[11px] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer hover:text-emerald-600 transition-colors"
            >
              <option value="not_deleted">Not</option>
              <option value="deleted">Deleted</option>
              <option value="all">Include</option>
            </select>
          </div>

          <button onClick={() => navigate('/add')} className="px-10 py-4 bg-gray-900 text-white rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl hover:scale-[1.05] active:scale-95">
            Add New Product
          </button>
        </div>
      </div>

      {/* Product List */}
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
          products.map((p) => {
            // Get discount percent - API uses discountPrecentage (with typo)
            const discountPercent = Number(p.discountPrecentage ?? p.discountPercentage ?? p.discount?.discountPercent ?? 0);
            const hasDiscount = discountPercent > 0;
            const finalPrice = p.finalPrice ?? p.price;
            
            return (
              <div key={p.id} className="group relative bg-white rounded-[48px] border border-gray-100 p-4 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 hover:-translate-y-3">
                {/* Product Image */}
                <div className="relative aspect-[4/5] rounded-[38px] overflow-hidden bg-gray-50 mb-6">
                  <img
                    src={p.images?.[0]?.url || p.mainImage}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    alt={p.name}
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
                    {hasDiscount && discountPercent > 0 && (
                      <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white border border-rose-400 backdrop-blur-md shadow-sm">
                        -{discountPercent.toFixed(0)}%
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
            )
          })
        )}
      </div>

      {/* Pagination */}
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
