import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/api";

// Sub-components
import DiscountForm from "../../components/discounts/DiscountForm";
import DiscountList from "../../components/discounts/DiscountList";
import DiscountFilter from "../../components/discounts/DiscountFilter";
import BulkDiscountManager from "../../components/products/BulkDiscountManager";

const DiscountManager = ({ token }) => {
  const [activeTab, setActiveTab] = useState("registry"); // registry | forge | bulk | view
  const location = useLocation();
  const navigate = useNavigate();

  // State for discounts
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive
  const [deletedFilter, setDeletedFilter] = useState("not_deleted"); // all, deleted, not_deleted
  const pageSize = 10;

  // Form State
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: "", discountPercent: 0, startDate: "", endDate: "", description: ""
  });

  // View discount state
  const [viewDiscountId, setViewDiscountId] = useState(null);
  const [viewDiscountData, setViewDiscountData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [discountProducts, setDiscountProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Loading state for toggle actions
  const [toggleLoading, setToggleLoading] = useState(null); // stores the ID being toggled

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
      };

      // Pass deleted filter to API
      if (deletedFilter === "all") {
        params.includeDeleted = null; // Pass null for "all"
      } else if (deletedFilter === "deleted") {
        params.includeDeleted = true; // Pass true for "deleted"
      }
      // For "not_deleted", don't pass includeDeleted - API will handle it

      // Pass status filter if not "all"
      if (statusFilter === "active") {
        params.isActive = true;
      } else if (statusFilter === "inactive") {
        params.isActive = false;
      }

      const res = await API.discounts.list(params, token);
      let data = res?.responseBody?.data || [];

      // Note: Removed client-side filtering as the API already handles it
      // This prevents discounts from disappearing when toggling status

      setDiscounts(data);
      setTotalItems(res?.responseBody?.totalCount || 0);
    } catch (e) {
      console.error('❌ Error fetching discounts:', e);
      toast.error("Failed to load discounts");
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [token, page, statusFilter, deletedFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, deletedFilter]);

  const handleEdit = async (id) => {
    try {
      const res = await API.discounts.getById(id, token);
      const d = res?.responseBody?.data;
      if (d) {
        setFormData({
          name: d.name || "",
          discountPercent: d.discountPercent || 0,
          startDate: d.startDate ? new Date(d.startDate).toISOString().slice(0, 16) : "",
          endDate: d.endDate ? new Date(d.endDate).toISOString().slice(0, 16) : "",
          description: d.description || ""
        });
        setEditId(id);
        setActiveTab("forge");
      }
    } catch (e) { toast.error("Failed to load discount details"); }
  };

  const handleToggle = async (id, current) => {
    setToggleLoading(id); // Set loading state for this specific discount
    try {
      console.log(`🔄 Toggling discount ${id} from ${current ? 'active' : 'inactive'} to ${!current ? 'active' : 'inactive'}`);

      // Call the API and wait for response
      const response = current
        ? await API.discounts.deactivate(id, token)
        : await API.discounts.activate(id, token);

      console.log('✅ Toggle response:', response);

      toast.success(`Discount ${!current ? 'activated' : 'deactivated'} successfully`);

      // Refresh from server to get the updated state
      await fetchDiscounts();
    } catch (e) {
      console.error('❌ Error toggling discount:', e);
      toast.error(e.response?.data?.message || "Update failed");
      // Refresh on error to ensure UI is in sync
      fetchDiscounts();
    } finally {
      setToggleLoading(null); // Clear loading state
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this discount?")) return;
    try {
      await API.discounts.delete(id, token);

      // Update local state immediately
      setDiscounts(prevDiscounts =>
        prevDiscounts.map(d =>
          d.id === id ? { ...d, deletedAt: new Date().toISOString() } : d
        )
      );

      toast.success("Discount deleted");
      fetchDiscounts();
    } catch (e) {
      toast.error("Delete failed");
      fetchDiscounts();
    }
  };

  const handleRestore = async (id) => {
    try {
      await API.discounts.restore(id, token);

      // Update local state immediately
      setDiscounts(prevDiscounts =>
        prevDiscounts.map(d =>
          d.id === id ? { ...d, deletedAt: null } : d
        )
      );

      toast.success("Discount restored");
      fetchDiscounts();
    } catch (e) {
      toast.error("Restore failed");
      fetchDiscounts();
    }
  };

  const fetchProductsByDiscount = async (id) => {
    setProductsLoading(true);
    try {
      const res = await API.discounts.getProductsByDiscount(id, token);
      const data = res?.responseBody?.data || [];
      setDiscountProducts(data);
    } catch (e) {
      console.error('❌ Error loading discount products:', e);
      toast.error("Failed to load associated products");
    } finally {
      setProductsLoading(false);
    }
  };

  const handleViewDiscount = async (id) => {
    setViewLoading(true);
    setViewDiscountId(id);
    setActiveTab("view");
    setDiscountProducts([]); // Reset products list

    try {
      const res = await API.discounts.getById(id, token);
      const discountData = res?.responseBody?.data || res?.data;
      setViewDiscountData(discountData);
      console.log('📊 Viewing discount:', discountData);

      // Fetch associated products
      await fetchProductsByDiscount(id);
    } catch (e) {
      console.error('❌ Error loading discount details:', e);
      toast.error("Failed to load discount details");
      setActiveTab("registry");
    } finally {
      setViewLoading(false);
    }
  };

  const handleRemoveProductDiscount = async (productId) => {
    if (!window.confirm("Remove discount from this product?")) return;

    try {
      await API.discounts.removeDiscountFromProduct(productId, token);
      toast.success("Discount removed from product");
      // Refresh products list
      if (viewDiscountId) {
        fetchProductsByDiscount(viewDiscountId);
      }
    } catch (e) {
      console.error('❌ Error removing product discount:', e);
      toast.error("Failed to remove discount");
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-10">

      {/* Discounts & Promotions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-purple-50 rounded-[24px] flex items-center justify-center text-3xl shadow-inner border border-purple-100/50 text-purple-600">
            🏷️
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Discounts</h1>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Manage product discounts and promotional campaigns</p>
          </div>
        </div>

        <div className="flex bg-gray-50 p-2 rounded-[28px] border border-gray-100">
          {[
            { id: "registry", label: "Discount List", icon: "📋" },
            { id: "forge", label: "Create New", icon: "✨" },
            { id: "bulk", label: "Bulk Discounts", icon: "⚡" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== "forge") setEditId(null);
              }}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                ? "bg-purple-600 text-white shadow-xl shadow-purple-900/20 scale-[1.05]"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-200/50"
                }`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Operation Area */}
      <div className="min-h-[600px]">
        {activeTab === "registry" && (
          <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-700">
            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-[40px] border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex bg-gray-100 p-1.5 rounded-[22px] border border-gray-200 shadow-inner">
                  <div className="flex items-center px-3">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Status:</span>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="bg-transparent text-[11px] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer hover:text-purple-600 transition-colors"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex bg-gray-100 p-1.5 rounded-[22px] border border-gray-200 shadow-inner">
                  <div className="flex items-center px-3">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Delete:</span>
                  </div>
                  <select
                    value={deletedFilter}
                    onChange={(e) => { setDeletedFilter(e.target.value); setPage(1); }}
                    className="bg-transparent text-[11px] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer hover:text-purple-600 transition-colors"
                  >
                    <option value="all">All</option>
                    <option value="deleted">Deleted</option>
                    <option value="not_deleted">Not Deleted</option>
                  </select>
                </div>
              </div>
            </div>

            <DiscountList
              discounts={discounts}
              loading={loading}
              handleEditDiscount={handleEdit}
              handleViewDiscount={handleViewDiscount}
              handleToggleActive={handleToggle}
              handleDeleteDiscount={handleDelete}
              handleRestoreDiscount={handleRestore}
              toggleLoading={toggleLoading}
              fetchDiscounts={fetchDiscounts}
              currentPage={page}
              totalPages={Math.ceil(totalItems / pageSize)}
              handlePreviousPage={() => setPage(p => Math.max(1, p - 1))}
              handleNextPage={() => setPage(p => p + 1)}
            />
          </div>
        )}

        {activeTab === "forge" && (
          <div className="animate-in zoom-in-95 duration-500">
            <DiscountForm
              formData={formData}
              handleInputChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
              handleSubmitDiscount={async (e) => {
                e.preventDefault();
                try {
                  if (editId) await API.discounts.update(editId, formData, token);
                  else await API.discounts.create(formData, token);
                  toast.success("Discount saved successfully");
                  setActiveTab("registry");
                  fetchDiscounts();
                } catch (err) { toast.error("Save failed"); }
              }}
              resetForm={() => { setEditId(null); setFormData({ name: "", discountPercent: 0, startDate: "", endDate: "", description: "" }); }}
              editMode={!!editId}
              token={token}
            />
          </div>
        )}

        {activeTab === "bulk" && (
          <div className="animate-in fade-in duration-700">
            <BulkDiscountManager token={token} />
          </div>
        )}

        {activeTab === "view" && (
          <div className="animate-in fade-in duration-500 p-8">
            {viewLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : viewDiscountData ? (
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-gray-900">Discount Details</h2>
                  <button
                    onClick={() => setActiveTab("registry")}
                    className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    ← Back to List
                  </button>
                </div>

                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 space-y-6">
                    {/* Discount Name and Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{viewDiscountData.name}</h3>
                        <p className="text-sm text-gray-500 mt-2">{viewDiscountData.description || "No description provided"}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${viewDiscountData.isActive ? "bg-emerald-50 text-emerald-600 border-2 border-emerald-200" : "bg-rose-50 text-rose-600 border-2 border-rose-200"}`}>
                        {viewDiscountData.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Discount Percentage */}
                    <div className="bg-purple-50 rounded-[24px] p-6 border border-purple-100">
                      <div className="text-center">
                        <p className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-2">Discount Amount</p>
                        <p className="text-6xl font-black text-purple-600">-{viewDiscountData.discountPercent}%</p>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 rounded-[24px] p-6 border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Start Date</p>
                        <p className="text-lg font-black text-gray-900">{new Date(viewDiscountData.startDate).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(viewDiscountData.startDate).toLocaleTimeString()}</p>
                      </div>
                      <div className="bg-rose-50 rounded-[24px] p-6 border border-rose-100">
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-2">End Date</p>
                        <p className="text-lg font-black text-gray-900">{new Date(viewDiscountData.endDate).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(viewDiscountData.endDate).toLocaleTimeString()}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(viewDiscountData.id)}
                        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-[20px] font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                      >
                        Edit Discount
                      </button>
                      <button
                        onClick={() => handleToggle(viewDiscountData.id, viewDiscountData.isActive)}
                        disabled={toggleLoading === viewDiscountData.id}
                        className={`flex-1 px-6 py-3 rounded-[20px] font-bold transition-all ${toggleLoading === viewDiscountData.id
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : viewDiscountData.isActive
                            ? "bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white border-2 border-orange-200"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-2 border-emerald-200"
                          }`}
                      >
                        {toggleLoading === viewDiscountData.id ? "Processing..." : (viewDiscountData.isActive ? "Deactivate" : "Activate")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Products with this discount */}
                <div className="mt-8 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-gray-900">Associated Products</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Products currently using this discount
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold">
                      {discountProducts.length} Products
                    </span>
                  </div>

                  {productsLoading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Products...</p>
                    </div>
                  ) : discountProducts.length > 0 ? (
                    <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                      {discountProducts.map((product) => (
                        <div key={product.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
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
                              <p className="text-sm font-black text-gray-900 line-clamp-1">{product.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-black text-purple-600">-{product.discountPrecentage || product.discountPercent}%</span>
                                <span className="text-[10px] font-bold text-gray-400 border-l border-gray-200 pl-2">ID: {product.id}</span>
                                <span className="text-[10px] font-bold text-gray-400 border-l border-gray-200 pl-2 line-through">${product.price}</span>
                                <span className="text-[10px] font-black text-emerald-600 border-l border-gray-200 pl-2">${product.finalPrice}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveProductDiscount(product.id)}
                            className="p-2.5 bg-rose-50 text-rose-600 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            title="Remove Discount from Product"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-20 flex flex-col items-center justify-center gap-4 opacity-40">
                      <div className="text-4xl">🏷️</div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No products associated yet</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-400 font-bold">No discount data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountManager;
