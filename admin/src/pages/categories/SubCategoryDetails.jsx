import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";
import ViewSubCategory from "../../components/categories/ViewSubCategory";
import AddSubCategory from "../../components/categories/AddSubCategory";
import ListSubCategory from "../../components/categories/ListSubCategory";
import { useTranslation } from "react-i18next";

const SubCategoryDetails = ({ token }) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const [activeTab, setActiveTab] = useState("view");
  const [categories, setCategories] = useState([]);
  const [, setSubCategories] = useState([]);

  // Form states for subcategory edit/add
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [subCategoryDescription, setSubCategoryDescription] = useState("");
  const [subCategoryDisplayOrder, setSubCategoryDisplayOrder] = useState(1);
  const [subCategoryImages, setSubCategoryImages] = useState([]);
  const [subCategoryMainImage, setSubCategoryMainImage] = useState(null);
  const [editSubCategoryId, setEditSubCategoryId] = useState(null);
  const [editSubCategoryMode, setEditSubCategoryMode] = useState(false);

  // Search states for ViewSubCategory - Default active is All (""), deleted defaults to true ("true") so viewing direct IDs never 404s
  const [searchId, setSearchId] = useState(id || "");
  const [searchActive, setSearchActive] = useState(searchParams.get("isActive") || "");
  const [searchDeleted, setSearchDeleted] = useState(searchParams.get("includeDeleted") || "true");

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 200 },
      });
      const cats = res.data?.responseBody?.data || [];
      setCategories(cats);
    } catch (error) {
      if (error.response?.status === 404) {
        setCategories([]);
      } else {
        toast.error(t('failedToLoadCategories') || "Failed to load categories");
      }
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error(t('authRequired') || "Authentication required");
      return;
    }
    fetchCategories();
  }, [token]);

  // Update search states when URL parameters change
  useEffect(() => {
    if (id) {
      setSearchId(id);
      setActiveTab("view");
    }
    const isActiveParam = searchParams.get("isActive");
    const includeDeletedParam = searchParams.get("includeDeleted");
    if (isActiveParam !== null) setSearchActive(isActiveParam);
    if (includeDeletedParam !== null) {
      setSearchDeleted(includeDeletedParam);
    } else {
      setSearchDeleted("true");
    }
  }, [id, location.search]);

  // Handle Edit SubCategory
  const handleEditSubCategory = (subCat) => {
    if (subCat) {
      setEditSubCategoryMode(true);
      setEditSubCategoryId(subCat.id);
      setSubCategoryName(subCat.name || "");
      setSubCategoryDescription(subCat.description || "");
      setSubCategoryDisplayOrder(subCat.displayOrder || 1);
      setParentCategoryId(Number(subCat.parentCategoryId || subCat.categoryId || ""));
      setSubCategoryMainImage(subCat.mainImageUrl || null);
      setSubCategoryImages(subCat.images?.map(img => ({ url: img.url, id: img.id, isNew: false })) || []);
      setActiveTab("add-sub");
    } else {
      setEditSubCategoryMode(false);
      setEditSubCategoryId(null);
      setSubCategoryName("");
      setSubCategoryDescription("");
      setSubCategoryDisplayOrder(1);
      setParentCategoryId("");
      setSubCategoryImages([]);
      setSubCategoryMainImage(null);
      setActiveTab("add-sub");
    }
  };

  // Handle View SubCategory
  const handleViewSubCategory = (subCat) => {
    setSearchId(subCat.id);
    setSearchActive(""); // No status filter
    setSearchDeleted(""); // No deleted filter
    setActiveTab("view");
    navigate(`/subcategories/${subCat.id}`);
  };

  return (
    <div className="flex flex-col gap-6 w-full mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t('subCategoryManager') || 'Subcategory Manager'}
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            {t('categoryManagementSubtitle') || 'Configure catalog sub-segments and hierarchies'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {[
              { id: "sub-list", label: t('categoryList') || 'Subcategories', icon: "📋" },
              { id: "view", label: t('viewCategory') || 'View Details', icon: "🔍" },
              { id: "add-sub", label: editSubCategoryMode ? (t('editCategory') || 'Edit') : (t('addCategory') || 'Add New'), icon: editSubCategoryMode ? "✏️" : "➕" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "add-sub" && !editSubCategoryMode) {
                    handleEditSubCategory(null);
                  }
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
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
            onClick={() => navigate('/collections')}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-all duration-200"
          >
            ← {t('categoryManager') || 'Categories'}
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
            placeholder={t('searchCategory') || 'Search subcategory by ID...'}
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm font-medium"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchId) {
                setActiveTab("view");
                navigate(`/subcategories/${searchId}`);
              }
            }}
          />
          <button
            onClick={() => {
              if (!searchId) return toast.error(t('searchCategory') || 'Enter SubCategory ID');
              setActiveTab("view");
              navigate(`/subcategories/${searchId}`);
            }}
            className="px-4 py-1.5 bg-gray-900 border border-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t('find') || 'Find'}
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
            placeholder="Jump to Parent Category ID..."
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm font-medium"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.currentTarget.value;
                if (!val) return toast.error(t('searchCategory') || 'Enter Category ID');
                navigate(`/category/view/${val}`);
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling;
              const val = input && 'value' in input ? input.value : '';
              if (!val) return toast.error(t('searchCategory') || 'Enter Category ID');
              navigate(`/category/view/${val}`);
            }}
            className="px-4 py-1.5 bg-gray-900 border border-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t('go') || 'Go'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] transition-all duration-300">
        <div className="p-1">
          {activeTab === "add-sub" && (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
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
                setSubCategories={setSubCategories}
              />
            </div>
          )}

          {activeTab === "sub-list" && (
            <div className="p-2 md:p-4">
              <ListSubCategory
                token={token}
                categories={categories}
                setActiveTab={setActiveTab}
                handleEditSubCategory={handleEditSubCategory}
                handleViewSubCategory={handleViewSubCategory}
              />
            </div>
          )}

          {activeTab === "view" && (
            <div className="p-4 md:p-8">
              <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('categoryDetailView') || 'Subcategory Detail View'}</h2>
                  <p className="text-sm text-gray-500">{t('exploringId') || 'Exploring ID'}: {searchId || 'None selected'}</p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={searchActive}
                    onChange={(e) => setSearchActive(e.target.value)}
                    className="p-2 text-xs font-bold bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">{t('statusAll') || 'Status: All'}</option>
                    <option value="true">{t('statusActive') || 'Active'}</option>
                    <option value="false">{t('statusInactive') || 'Inactive'}</option>
                  </select>
                  <select
                    value={searchDeleted}
                    onChange={(e) => setSearchDeleted(e.target.value)}
                    className="p-2 text-xs font-bold bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="true">{t('trashInclude') || 'Include Trash'}</option>
                    <option value="false">{t('trashExclude') || 'Exclude Trash'}</option>
                    <option value="">{t('statusAll') || 'Show All'}</option>
                  </select>
                </div>
              </div>

              <ViewSubCategory
                token={token}
                subCategoryId={searchId}
                isActive={
                  searchActive === "true" ? true : searchActive === "false" ? false : null
                }
                includeDeleted={
                  searchDeleted === "false" ? false : true
                }
                onUpdateSubCategory={handleEditSubCategory}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubCategoryDetails;
