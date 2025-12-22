import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../App";
import { useParams, useLocation, useNavigate } from "react-router-dom";

// Import components
import AddCategory from "../components/categories/AddCategory";
import ViewCategory from "../components/categories/ViewCategory";
import ListCategory from "../components/categories/ListCategory";
// Subcategory management moved to dedicated SubCategoryManager page

const Categorys = ({ token }) => {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const [activeTab, setActiveTab] = useState("add");
  const [hasInitializedFromUrl, setHasInitializedFromUrl] = useState(false);
  const [categories, setCategories] = useState([]);

  // form states for category
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [images, setImages] = useState([]);
  const [mainImage, setMainImage] = useState(null);

  // edit category states
  const [editMode, setEditMode] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState(null);

  // Subcategory states removed (managed in SubCategoryManager page)

  // search states for ViewCategory
  const [searchId, setSearchId] = useState(categoryId || "");
  const [searchActive, setSearchActive] = useState(
    searchParams.get("isActive") || ""
  );
  const [searchDeleted, setSearchDeleted] = useState(
    searchParams.get("includeDeleted") || ""
  );

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
  }, [token]);

  // Update search states when URL parameters change
  useEffect(() => {
    if (categoryId && !hasInitializedFromUrl) {
      setSearchId(categoryId);

      // Check if we're on the edit page
      if (location.pathname.includes("/edit/")) {
        // Set edit mode
        setEditMode(true);
        setEditCategoryId(Number(categoryId));
        setActiveTab("add");

        // Fetch category details for editing
        const fetchCategoryDetails = async () => {
          try {
            const res = await axios.get(
              `${backendUrl}/api/categories/${categoryId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            const cat =
              res.data?.responseBody?.data || res.data?.data || res.data;
            setName(cat.name || "");
            setDescription(cat.description || "");
            setDisplayOrder(cat.displayOrder || 1);

            if (cat.images?.length > 0) {
              const mainImg = cat.images.find((img) => img.isMain);
              if (mainImg) {
                setMainImage(mainImg);
              }
              setImages(cat.images.filter((img) => !img.isMain));
            }
          } catch (err) {
            console.error("❌ Error fetching category:", err);
            toast.error("Failed to load category details");
          }
        };

        fetchCategoryDetails();
      } else if (location.pathname.includes("/view/")) {
        setActiveTab("category");
      } else {
        setActiveTab("add");
      }

      setHasInitializedFromUrl(true);
    }
    if (searchParams.get("isActive")) {
      setSearchActive(searchParams.get("isActive"));
    }
    if (searchParams.get("includeDeleted")) {
      setSearchDeleted(searchParams.get("includeDeleted"));
    }
  }, [
    categoryId,
    searchParams,
    hasInitializedFromUrl,
    location.pathname,
    token,
  ]);

  // Subcategory edit handled in SubCategoryManager page

  // ✅ Handle Edit Category
  const handleEditCategory = (cat) => {
    if (cat) {
      // 🟢 وضع التعديل
      setEditMode(true);
      setEditCategoryId(cat.id);

      setName(cat.name || "");
      setDescription(cat.description || "");
      setDisplayOrder(cat.displayOrder || 1);
      setImages(cat.images || []);
      setMainImage(cat.mainImage || null);

      // Stay on the collections page and switch to the Add (edit) tab
      setActiveTab("add");
    } else {
      // 🔴 وضع الإضافة (تفريغ الحقول)
      setEditMode(false);
      setEditCategoryId(null);

      setName("");
      setDescription("");
      setDisplayOrder(1);
      setImages([]);
      setMainImage(null);

      setActiveTab("add");
    }
  };

  // ✅ Handle View Category
  const handleViewCategory = (cat) => {
    setSearchId(cat.id);
    setSearchActive(cat.isActive ? "true" : "false");
    setSearchDeleted(cat.isDeleted ? "true" : "false");
    setActiveTab("category");
    // Reflect current status in URL
    navigate(`/category/view/${cat.id}?isActive=${cat.isActive ? "true" : "false"}&includeDeleted=${cat.isDeleted ? "true" : "false"}`);
  };

  // ✅ When a subcategory is selected in ViewCategory, go to subcategory details page
  const handleSelectIdFromView = (id) => {
    navigate(`/subcategories/${id}`);
  };

  // Subcategory view handled in SubCategoryManager page

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Category Management</h1>
        <div className="text-sm text-gray-500">Create, view and organize categories</div>
      </div>

      {/* Quick navigation to dedicated details pages */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-4 rounded-xl shadow">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Category ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="border px-3 py-2 rounded w-44 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
          />
          <button
            onClick={() => {
              if (!searchId) return toast.error("Enter category ID");
              navigate(`/category/view/${searchId}`);
            }}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Open Category Details Page
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="SubCategory ID"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.currentTarget.value;
                if (!val) return toast.error("Enter subcategory ID");
                navigate(`/subcategories/${val}`);
              }
            }}
            className="border px-3 py-2 rounded w-44 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
          />
          <button
            onClick={(e) => {
              const input = (e.currentTarget.previousElementSibling);
              const val = input && 'value' in input ? input.value : '';
              if (!val) return toast.error("Enter subcategory ID");
              navigate(`/subcategories/${val}`);
            }}
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          >
            Open SubCategory Details Page
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab("add")}
          className={`px-4 py-2 rounded-full transition ${
            activeTab === "add" ? "bg-blue-600 text-white shadow" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          Add Category
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 rounded-full transition ${
            activeTab === "list" ? "bg-blue-600 text-white shadow" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          Categories List
        </button>
        <button
          onClick={() => setActiveTab("category")}
          className={`px-4 py-2 rounded-full transition ${
            activeTab === "category" ? "bg-blue-600 text-white shadow" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          View Category
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "add" && (
        <AddCategory
          token={token}
          fetchCategories={fetchCategories}
          setActiveTab={setActiveTab}
          editMode={editMode}
          editCategoryId={editCategoryId}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          displayOrder={displayOrder}
          setDisplayOrder={setDisplayOrder}
          images={images}
          setImages={setImages}
          mainImage={mainImage}
          setMainImage={setMainImage}
          setEditMode={setEditMode} // عشان نرجعه false بعد الحفظ
          editCategoryMode={editMode}
        />
      )}

      {activeTab === "list" && (
        <ListCategory
          token={token}
          categories={categories}
          setCategories={setCategories}
          setActiveTab={setActiveTab}
          handleEditCategory={handleEditCategory}
          handleViewCategory={handleViewCategory}
          fetchCategories={fetchCategories}
        />
      )}

      {activeTab === "category" && (
        <div className="p-4 bg-white rounded-xl shadow">
          <h2 className="text-xl font-bold mb-2">View Category</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="number"
              placeholder="Enter Category ID"
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
          <ViewCategory
            token={token}
            categoryId={searchId}
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
            onUpdateCategory={handleEditCategory}
            onSelectId={handleSelectIdFromView}
          />
        </div>
      )}
    </div>
  );
};

export default Categorys;