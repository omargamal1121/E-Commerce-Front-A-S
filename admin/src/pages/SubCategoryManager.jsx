import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

// Reuse existing components (no logic changes)
import AddSubCategory from "../components/categories/AddSubCategory";
import ListSubCategory from "../components/categories/ListSubCategory";
import ViewSubCategory from "../components/categories/ViewSubCategory";

const SubCategoryManager = ({ token }) => {
  const [activeTab, setActiveTab] = useState("sub-list");

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
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sub-Categories</h1>
        <div className="text-sm text-gray-500">Create, view and manage sub-categories</div>
      </div>

      {/* Quick View */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="SubCategory ID"
            value={viewId}
            onChange={(e) => setViewId(e.target.value)}
            className="border px-3 py-2 rounded w-44 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
          />
          <select
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value)}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
          >
            <option value="">All Active Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            value={includeDeletedFilter}
            onChange={(e) => setIncludeDeletedFilter(e.target.value)}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
          >
            <option value="">All Deleted Status</option>
            <option value="true">Include Deleted</option>
            <option value="false">Exclude Deleted</option>
          </select>
          <button
            type="button"
            onClick={() => {
              if (!viewId) return toast.error("Enter subcategory ID");
              setActiveTab("view-sub");
            }}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Open
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab("add-sub")}
          className={`px-4 py-2 rounded-full transition ${
            activeTab === "add-sub" ? "bg-blue-600 text-white shadow" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          Add Sub-Category
        </button>
        <button
          onClick={() => setActiveTab("sub-list")}
          className={`px-4 py-2 rounded-full transition ${
            activeTab === "sub-list" ? "bg-blue-600 text-white shadow" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          Sub-Categories List
        </button>
        <button
          onClick={() => setActiveTab("view-sub")}
          className={`px-4 py-2 rounded-full transition ${
            activeTab === "view-sub" ? "bg-blue-600 text-white shadow" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          View Sub-Category
        </button>
      </div>

      {/* Content */}
      {activeTab === "add-sub" && (
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
      )}

      {activeTab === "sub-list" && (
        <ListSubCategory
          token={token}
          categories={categories}
          setActiveTab={setActiveTab}
          handleEditSubCategory={handleEditSubCategory}
          handleViewSubCategory={handleViewSubCategory}
        />
      )}

      {activeTab === "view-sub" && (
        <div className="p-4 bg-white rounded-xl shadow">
          <h2 className="text-xl font-bold mb-2">View Sub-Category</h2>
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
  );
};

export default SubCategoryManager;
