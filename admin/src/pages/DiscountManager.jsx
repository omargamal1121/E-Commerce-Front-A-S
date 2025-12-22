import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api";
import DiscountForm from "../components/discounts/DiscountForm";
import DiscountList from "../components/discounts/DiscountList";
import DiscountFilter from "../components/discounts/DiscountFilter";
import BulkDiscountManager from "../components/products/BulkDiscountManager";

const DiscountManager = ({ token }) => {
  // UI: simple tabs to merge bulk discount page here
  const [activeTab, setActiveTab] = useState("manage"); // manage | bulk
  const location = useLocation();

  // Sync tab from query string (?tab=manage|bulk)
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const tab = sp.get("tab");
    if (tab === "bulk" || tab === "manage") {
      setActiveTab(tab);
    }
  }, [location.search]);
  // Helper: extract detailed API error messages
  const extractApiErrors = (err, fallbackMessage) => {
    const rb = err?.response?.data?.responseBody;
    const msgs = [];
    if (Array.isArray(rb?.errors?.messages) && rb.errors.messages.length) {
      msgs.push(...rb.errors.messages);
    }
    const modelState = rb?.errors?.modelState || rb?.errors?.ModelState || rb?.errors?.details;
    if (modelState && typeof modelState === "object") {
      Object.values(modelState).forEach((v) => {
        if (Array.isArray(v)) msgs.push(...v);
        else if (typeof v === "string") msgs.push(v);
      });
    }
    if (msgs.length) return msgs.join("\n");
    return (
      rb?.message ||
      err?.response?.data?.message ||
      err?.message ||
      fallbackMessage ||
      "Operation failed"
    );
  };
  // State for discount form
  const [formData, setFormData] = useState({
    name: "",
    discountPercent: 0,
    startDate: "",
    endDate: "",
    description: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  // State for discounts
  const [discounts, setDiscounts] = useState([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);

  // Pagination and filtering
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filter, setFilter] = useState({
    where: "",
    orderBy: "",
    minDiscount: "",
    maxDiscount: "",
    startDateAfter: "",
    endDateBefore: "",
  });

  // Fetch all discounts
  const fetchDiscounts = async () => {
    setDiscountsLoading(true);
    try {
      // Apply filters to the API call
      const params = {
        page,
        pageSize,
        ...filter
      };

      // Transform 'where' filter to specific params
      if (filter.where) {
        switch (filter.where) {
          case 'active':
            params.isActive = true;
            break;
          case 'inactive':
            params.isActive = false;
            break;
          case 'deleted':
            params.isDeleted = true;
            break;
          case 'expired':
            params.endDateBefore = new Date().toISOString();
            break;
          case 'upcoming':
            params.startDateAfter = new Date().toISOString();
            break;
          default:
            break;
        }
        delete params.where; // Remove the raw 'where' param
      }

      const response = await API.discounts.list(params, token);
      setDiscounts(response?.responseBody?.data || response?.data || []);
      setTotalItems(response?.responseBody?.totalCount || 0);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      toast.error(extractApiErrors(error, "Failed to load discounts"));
    } finally {
      setDiscountsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [token, page, pageSize]); // Re-fetch when pagination changes

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      discountPercent: 0,
      startDate: "",
      endDate: "",
      description: "",
    });
    setEditMode(false);
    setEditId(null);
  };

  // Load discount for editing
  const handleEditDiscount = async (id) => {
    try {
      const res = await API.discounts.getById(id, token);
      const discount = res?.responseBody?.data || res?.data || res;
      setFormData({
        id: id, // Include the ID for product association
        name: discount.name || "",
        discountPercent: discount.discountPercent || 0,
        startDate: discount.startDate
          ? new Date(discount.startDate).toISOString().slice(0, 16)
          : "",
        endDate: discount.endDate
          ? new Date(discount.endDate).toISOString().slice(0, 16)
          : "",
        description: discount.description || "",
      });
      setEditMode(true);
      setEditId(id);
    } catch (error) {
      console.error("Error loading discount for edit:", error);
      toast.error(extractApiErrors(error, "Failed to load discount details"));
    }
  };

  // Submit form (create or update)
  const handleSubmitDiscount = async (e) => {
    e.preventDefault();
    if (
      !formData.name ||
      formData.discountPercent < 1 ||
      formData.discountPercent > 100
    ) {
      toast.error(
        "Please fill all required fields. Discount percentage must be between 1 and 100."
      );
      return;
    }

    setDiscountLoading(true);
    try {
      const discountData = {
        name: formData.name,
        discountPercent: parseInt(formData.discountPercent, 10),
        startDate: formData.startDate || new Date().toISOString(),
        endDate:
          formData.endDate ||
          new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ).toISOString(),
        description: formData.description || "",
      };

      if (!token) {
        toast.error("User is not authenticated");
        return;
      }

      if (editMode) {
        await API.discounts.update(editId, discountData, token);
        toast.success("Discount updated successfully");
      } else {
        await API.discounts.create(discountData, token);
        toast.success("Discount created successfully");
      }

      resetForm();
      fetchDiscounts(); // Refresh list
    } catch (error) {
      console.error("Error saving discount:", error.response?.data || error);
      toast.error(
        extractApiErrors(
          error,
          editMode ? "Failed to update discount" : "Failed to create discount"
        )
      );
    } finally {
      setDiscountLoading(false);
    }
  };

  // Delete discount
  const handleDeleteDiscount = async (id) => {
    if (!window.confirm("Are you sure you want to delete this discount?"))
      return;

    try {
      await API.discounts.delete(id, token);
      toast.success("Discount deleted successfully");

      // تحديث الجدول بعد الحذف
      await fetchDiscounts();
    } catch (error) {
      console.error("Error deleting discount:", error);
      toast.error(extractApiErrors(error, "Failed to delete discount"));
    }
  };

  // Activate/Deactivate discount
  const handleToggleActive = async (id, currentStatus) => {
    try {
      if (currentStatus) {
        // Deactivate
        await API.discounts.deactivate(id, token);
        toast.success("Discount deactivated");
      } else {
        // Activate
        await API.discounts.activate(id, token);
        toast.success("Discount activated");
      }

      // Optimistically update local state so UI reflects immediately
      setDiscounts((prev) =>
        Array.isArray(prev)
          ? prev.map((d) =>
            d.id === id ? { ...d, isActive: !currentStatus } : d
          )
          : prev
      );

      // تحديث الجدول بعد نجاح العملية
      // await fetchDiscounts();
    } catch (error) {
      console.error("Error toggling discount status:", error);
      toast.error(extractApiErrors(error, "Failed to update discount status"));
    }
  };

  // Restore deleted discount
  const handleRestoreDiscount = async (id) => {
    try {
      await API.discounts.restore(id, token);
      toast.success("Discount restored successfully");

      // تحديث الجدول بعد الاستعادة
      await fetchDiscounts();
    } catch (error) {
      console.error("Error restoring discount:", error);
      toast.error(extractApiErrors(error, "Failed to restore discount"));
    }
  };

  // Validate discount
  const handleValidateDiscount = async (id) => {
    try {
      const res = await API.discounts.validate(id, token);
      const result = res?.responseBody?.data ?? res?.data ?? res;
      const valid = typeof result === "boolean" ? result : !!result?.isValid;
      toast.info(`Discount validation: ${valid ? "Valid" : "Invalid"}`);
    } catch (error) {
      console.error("Error validating discount:", error);
      toast.error(extractApiErrors(error, "Failed to validate discount"));
    }
  };

  // Calculate discount
  const handleCalculateDiscount = async (id, originalPrice) => {
    try {
      const res = await API.discounts.calculate(id, originalPrice, token);
      return res?.responseBody?.data ?? res?.data ?? res;
    } catch (error) {
      console.error("Error calculating discount:", error);
      if (
        error?.response?.data?.message === "No products associated with this discount" ||
        error?.response?.data?.responseBody?.message === "No products associated with this discount"
      ) {
        // If the backend explicitly tells us there are no products, let's handle it
        toast.info("Please associate products with this discount first");
      } else {
        toast.error(extractApiErrors(error, "Failed to calculate discount"));
      }
      return null;
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Apply filters and fetch discounts
  const handleApplyFilters = () => {
    // Reset to first page when applying new filters
    setPage(1);
    fetchDiscounts();
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Discounts</h2>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-2 rounded-full transition ${activeTab === "manage" ? "bg-blue-600 text-white shadow" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
        >
          Manage Discounts
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`px-4 py-2 rounded-full transition ${activeTab === "bulk" ? "bg-blue-600 text-white shadow" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
        >
          Bulk Apply
        </button>
      </div>

      {activeTab === "manage" && (
        <>
          {/* Discount Form */}
          <DiscountForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmitDiscount={handleSubmitDiscount}
            resetForm={resetForm}
            editMode={editMode}
            discountLoading={discountLoading}
            token={token}
          />

          {/* Filters */}
          <DiscountFilter
            filters={filter}
            handleFilterChange={handleFilterChange}
            handleApplyFilters={handleApplyFilters}
          />

          {/* Discount List */}
          <DiscountList
            discounts={discounts}
            loading={discountsLoading}
            handleEditDiscount={handleEditDiscount}
            handleDeleteDiscount={handleDeleteDiscount}
            handleToggleActive={handleToggleActive}
            handleRestoreDiscount={handleRestoreDiscount}
            handleCalculateDiscount={handleCalculateDiscount}
            fetchDiscounts={fetchDiscounts}
            currentPage={page}
            totalPages={Math.ceil(totalItems / pageSize)}
            handlePreviousPage={() => handlePageChange(page - 1)}
            handleNextPage={() => handlePageChange(page + 1)}
          />
        </>
      )}

      {activeTab === "bulk" && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-2">Bulk Discount Management</h3>
          <p className="mb-4 text-gray-600">Apply an existing discount to multiple products at once.</p>
          <BulkDiscountManager token={token} />
        </div>
      )}
    </div>
  );
}

export default DiscountManager;
