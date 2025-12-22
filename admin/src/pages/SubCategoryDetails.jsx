import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../App";
import ViewSubCategory from "../components/categories/ViewSubCategory";
import AddSubCategory from "../components/categories/AddSubCategory";
import ListSubCategory from "../components/categories/ListSubCategory";

const SubCategoryDetails = ({ token }) => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("view");
  const [hasInitializedFromUrl, setHasInitializedFromUrl] = useState(false);
  const [categories, setCategories] = useState([]);

  // form states for subcategory
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [subCategoryDescription, setSubCategoryDescription] = useState("");
  const [subCategoryDisplayOrder, setSubCategoryDisplayOrder] = useState(1);
  const [subCategoryImages, setSubCategoryImages] = useState([]);
  const [subCategoryMainImage, setSubCategoryMainImage] = useState(null);
  const [editSubCategoryId, setEditSubCategoryId] = useState(null);
  const [editSubCategoryMode, setEditSubCategoryMode] = useState(false);

  // search states for ViewSubCategory
  const [searchId, setSearchId] = useState(id || "");
  const [searchActive, setSearchActive] = useState("");
  const [searchDeleted, setSearchDeleted] = useState("");

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const cats = res.data?.responseBody?.data || [];
      setCategories(cats);

      console.log(
        "📌 Available categories:",
        cats.map((c) => ({ id: c.id, name: c.name }))
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error fetching categories");
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("Please login again.");
      return;
    }
    fetchCategories();
  }, [token]);

  // Update search states when URL parameters change
  useEffect(() => {
    if (id && !hasInitializedFromUrl) {
      setSearchId(id);
      setActiveTab("view");
      setHasInitializedFromUrl(true);
    }
  }, [id, hasInitializedFromUrl]);

  // ✅ Handle Edit SubCategory
  const handleEditSubCategory = (subCat) => {
    setEditSubCategoryMode(true);
    setEditSubCategoryId(subCat.id);
    setSubCategoryName(subCat.name);
    setSubCategoryDescription(subCat.description);
    setSubCategoryDisplayOrder(subCat.displayOrder);
    setParentCategoryId(Number(subCat.parentCategoryId));
    setActiveTab("add-sub");
  };

  // ✅ Handle View SubCategory
  const handleViewSubCategory = (subCat) => {
    setSearchId(subCat.id);
    setSearchActive(subCat.isActive ? "true" : "false");
    setSearchDeleted(subCat.isDeleted ? "true" : "false");
    setActiveTab("view");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">SubCategory Management</h1>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab("add-sub")}
          className={`px-4 py-2 rounded ${
            activeTab === "add-sub" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Add Sub-Category
        </button>
        <button
          onClick={() => setActiveTab("sub-list")}
          className={`px-4 py-2 rounded ${
            activeTab === "sub-list" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Sub-Categories List
        </button>
        <button
          onClick={() => setActiveTab("view")}
          className={`px-4 py-2 rounded ${
            activeTab === "view" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          View SubCategory
        </button>
      </div>

      {/* Tab Content */}
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
          subCategoryDisplayOrder={subCategoryDisplayOrder}
          setSubCategoryDisplayOrder={setSubCategoryDisplayOrder}
          subCategoryImages={subCategoryImages}
          setSubCategoryImages={setSubCategoryImages}
          subCategoryMainImage={subCategoryMainImage}
          setSubCategoryMainImage={setSubCategoryMainImage}
          editSubCategoryMode={editSubCategoryMode}
          editSubCategoryId={editSubCategoryId}
        />
      )}

      {activeTab === "sub-list" && (
        <ListSubCategory
          token={token}
          subCategories={[]}
          setSubCategories={() => {}}
          categories={categories}
          setActiveTab={setActiveTab}
          handleEditSubCategory={handleEditSubCategory}
          handleViewSubCategory={handleViewSubCategory}
        />
      )}

      {activeTab === "view" && (
        <div className="p-4 bg-gray-50 rounded-md">
          <h2 className="text-xl font-bold mb-2">View SubCategory</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="number"
              placeholder="Enter SubCategory ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="border px-3 py-2 rounded"
            />
            <select
              value={searchActive}
              onChange={(e) => setSearchActive(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="">All Active Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select
              value={searchDeleted}
              onChange={(e) => setSearchDeleted(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="">All Deleted Status</option>
              <option value="true">Include Deleted</option>
              <option value="false">Exclude Deleted</option>
            </select>
          </div>
          <ViewSubCategory
            token={token}
            subCategoryId={searchId}
            isActive={
              searchActive === "true"
                ? true
                : searchActive === "false"
                  ? false
                  : null
            }
            includeDeleted={
              searchDeleted === "true"
                ? true
                : searchDeleted === "false"
                  ? false
                  : null
            }
          />
        </div>
      )}
    </div>
  );
};

export default SubCategoryDetails;


