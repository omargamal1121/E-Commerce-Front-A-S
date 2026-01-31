import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../../App";

// Reuse existing components (no logic changes)
import AddSubCategory from "../../components/categories/AddSubCategory";
import ListSubCategory from "../../components/categories/ListSubCategory";
import ViewSubCategory from "../../components/categories/ViewSubCategory";

const SubCategoryManager = ({ token }) => {
  const [activeTab, setActiveTab] = useState("sub-list");
  const navigate = useNavigate();

  // Categories are needed for AddSubCategory and ListSubCategory
  const [categories, setCategories] = useState([]);

  // For quick view
  const [viewId, setViewId] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [includeDeletedFilter, setIncludeDeletedFilter] = useState("");

  const [parentCategoryId, setParentCategoryId] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [subCategoryDescription, setSubCategoryDescription] = useState("");
  const [subCategoryDisplayOrder, setSubCategoryDisplayOrder] = useState(1);
  const [subCategoryImages, setSubCategoryImages] = useState([]);
  const [subCategoryMainImage, setSubCategoryMainImage] = useState(null);
  const [editSubCategoryMode, setEditSubCategoryMode] = useState(false);
  const [editSubCategoryId, setEditSubCategoryId] = useState(null);

  // ListSubCategory manages its own list state; keep a local list when needed
  const [subCategories, setSubCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cats = res.data?.responseBody?.data || [];
      setCategories(cats);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error fetching categories");
    }
  };

  useEffect(() => {
    if (token) fetchCategories();
  }, [token]);

  // Handlers to reuse existing component logic
  const handleEditSubCategory = (subCat) => {
    setEditSubCategoryMode(true);
    setEditSubCategoryId(subCat.id);
    setSubCategoryName(subCat.name);
    setSubCategoryDescription(subCat.description);
    setSubCategoryDisplayOrder(subCat.displayOrder || 1);
    setParentCategoryId(Number(subCat.parentCategoryId || subCat.categoryId));
    setActiveTab("add-sub");
  };

  const handleViewSubCategory = (subCat) => {
    setViewId(subCat.id);
    setActiveTab("view-sub");
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Sub-Category Manager
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Manage and organize product subcategories
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {[
              { id: "sub-list", label: "Subcategory List", icon: "📋" },
              { id: "view-sub", label: "View Subcategory", icon: "🔍" },
              { id: "add-sub", label: editSubCategoryMode ? "Edit Subcategory" : "Add Subcategory", icon: editSubCategoryMode ? "✏️" : "➕" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "add-sub" && !editSubCategoryMode) {
                    setEditSubCategoryMode(false);
                    setSubCategoryName("");
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/category')}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-all duration-200"
          >
            ← Back to Categories
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 group focus-within:border-blue-300 transition-colors">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-focus-within:bg-blue-600 group-focus-within:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="number"
          placeholder="Enter Subcategory ID..."
          value={viewId}
          onChange={(e) => setViewId(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm font-medium"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && viewId) setActiveTab("view-sub");
          }}
        />
        <div className="flex gap-2">
          <select
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value)}
            className="p-1.5 text-[10px] font-black uppercase bg-gray-50 border-none rounded-lg focus:ring-0"
          >
            <option value="">Status: All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button
            onClick={() => {
              if (!viewId) return toast.error("Enter subcategory ID");
              setActiveTab("view-sub");
            }}
            className="px-4 py-1.5 bg-gray-900 border border-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors"
          >
            View
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        {activeTab === "add-sub" && (
          <div className="p-8 max-w-4xl mx-auto">
            <AddSubCategory
              token={token}
              categories={categories}
              setActiveTab={setActiveTab}
              parentCategoryId={parentCategoryId}
              setParentCategoryId={setParentCategoryId}
              subCategoryName={subCategoryName}
              setSubCategoryName={setSubCategoryName}
              subCategoryDescription={subCategoryDescription}
              setSubCategoryDescription={setSubCategoryDescription}
              setSubCategoryDisplayOrder={setSubCategoryDisplayOrder}
              subCategoryImages={subCategoryImages}
              setSubCategoryImages={setSubCategoryImages}
              subCategoryMainImage={subCategoryMainImage}
              setSubCategoryMainImage={setSubCategoryMainImage}
              editSubCategoryMode={editSubCategoryMode}
              editSubCategoryId={editSubCategoryId}
              setSubCategories={setSubCategories}
            />
          </div>
        )}

        {activeTab === "sub-list" && (
          <div className="p-6">
            <ListSubCategory
              token={token}
              categories={categories}
              setActiveTab={setActiveTab}
              handleEditSubCategory={handleEditSubCategory}
              handleViewSubCategory={handleViewSubCategory}
            />
          </div>
        )}

        {activeTab === "view-sub" && (
          <div className="p-8">
            <div className="mb-8 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-black text-gray-900">Subcategory Details</h2>
              <p className="text-sm text-gray-500">ID Focus: {viewId || "Pending selection"}</p>
            </div>

            <ViewSubCategory
              token={token}
              subCategoryId={viewId}
              isActive={
                isActiveFilter === "true" ? true : isActiveFilter === "false" ? false : null
              }
              includeDeleted={
                includeDeletedFilter === "true" ? true : includeDeletedFilter === "false" ? false : null
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SubCategoryManager;
