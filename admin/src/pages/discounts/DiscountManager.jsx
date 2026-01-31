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
  const [activeTab, setActiveTab] = useState("registry"); // registry | forge | bulk
  const location = useLocation();
  const navigate = useNavigate();

  // State for discounts
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Form State
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: "", discountPercent: 0, startDate: "", endDate: "", description: ""
  });

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await API.discounts.list({ page, pageSize }, token);
      setDiscounts(res?.responseBody?.data || []);
      setTotalItems(res?.responseBody?.totalCount || 0);
    } catch (e) { toast.error("Failed to load discounts"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [token, page]);

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
    try {
      if (current) await API.discounts.deactivate(id, token);
      else await API.discounts.activate(id, token);
      toast.success("Status updated");
      fetchDiscounts();
    } catch (e) { toast.error("Update failed"); }
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
            <DiscountList
              discounts={discounts}
              loading={loading}
              handleEditDiscount={handleEdit}
              handleToggleActive={handleToggle}
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
      </div>
    </div>
  );
};

export default DiscountManager;
