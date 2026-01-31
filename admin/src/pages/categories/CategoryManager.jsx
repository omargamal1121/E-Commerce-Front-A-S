import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";
import { useParams, useLocation, useNavigate } from "react-router-dom";

// Import components
import AddCategory from "../../components/categories/AddCategory";
import ViewCategory from "../../components/categories/ViewCategory";
import ListCategory from "../../components/categories/ListCategory";
// Subcategory management moved to dedicated SubCategoryManager page

const CategoryManager = ({ token }) => {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const [activeTab, setActiveTab] = useState("list");
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
    fetchCategories();
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
        setActiveTab("list");
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
    navigate(`/category/view/${cat.id}`);
  };

  // ✅ When a subcategory is selected in ViewCategory, go to subcategory details page
  const handleSelectIdFromView = (id) => {
    navigate(`/subcategories/${id}`);
  };

  // Subcategory view handled in SubCategoryManager page

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Category Manager
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Manage your store's product hierarchy and organization
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {[
              { id: "list", label: "Categories List", icon: "📋" },
              { id: "category", label: "View Details", icon: "🔍" },
              { id: "add", label: editMode ? "Edit Category" : "Add Category", icon: editMode ? "✏️" : "➕" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "add" && !editMode) handleEditCategory(null);
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
            onClick={() => navigate('/sub-category')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Sub-Category Manager →
          </button>
        </div>
      </div>

      {/* Quick Access Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 group focus-within:border-blue-300 transition-colors">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-focus-within:bg-blue-600 group-focus-within:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="number"
            placeholder="Quick search by Category ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm font-medium"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchId) navigate(`/category/view/${searchId}`);
            }}
          />
          <button
            onClick={() => {
              if (!searchId) return toast.error("Enter category ID");
              setActiveTab("category");
              navigate(`/category/view/${searchId}`);
            }}
            className="px-4 py-1.5 bg-gray-900 border border-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Find
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 group focus-within:border-purple-300 transition-colors">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-focus-within:bg-purple-600 group-focus-within:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
          </div>
          <input
            type="number"
            placeholder="Jump to SubCategory ID..."
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm font-medium"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.currentTarget.value;
                if (!val) return toast.error("Enter subcategory ID");
                navigate(`/subcategories/${val}`);
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = (e.currentTarget.previousElementSibling);
              const val = input && 'value' in input ? input.value : '';
              if (!val) return toast.error("Enter subcategory ID");
              navigate(`/subcategories/${val}`);
            }}
            className="px-4 py-1.5 bg-gray-900 border border-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] transition-all duration-300">
        <div className="p-1"> {/* Inset border for better look */}
          {activeTab === "add" && (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
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
                setEditMode={setEditMode}
                editCategoryMode={editMode}
              />
            </div>
          )}

          {activeTab === "list" && (
            <div className="p-2 md:p-4">
              <ListCategory
                token={token}
                categories={categories}
                setCategories={setCategories}
                setActiveTab={setActiveTab}
                handleEditCategory={handleEditCategory}
                handleViewCategory={handleViewCategory}
                fetchCategories={fetchCategories}
              />
            </div>
          )}

          {activeTab === "category" && (
            <div className="p-4 md:p-8">
              <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Category Detail View</h2>
                  <p className="text-sm text-gray-500">Exploring ID: {searchId}</p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={searchActive}
                    onChange={(e) => setSearchActive(e.target.value)}
                    className="p-2 text-xs font-bold bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Status: All</option>
                    <option value="true">Status: Active</option>
                    <option value="false">Status: Inactive</option>
                  </select>
                  <select
                    value={searchDeleted}
                    onChange={(e) => setSearchDeleted(e.target.value)}
                    className="p-2 text-xs font-bold bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Trash: Exclude</option>
                    <option value="true">Trash: Include</option>
                  </select>
                </div>
              </div>

              <ViewCategory
                token={token}
                categoryId={searchId}
                isActive={
                  searchActive === "true" ? true : searchActive === "false" ? false : null
                }
                includeDeleted={
                  searchDeleted === "true" ? true : searchDeleted === "false" ? false : null
                }
                onUpdateCategory={handleEditCategory}
                onSelectId={handleSelectIdFromView}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;