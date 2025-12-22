import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";
import { useNavigate } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";

const ListCollection = ({
  token,
  collections,
  setCollections,
  setActiveTab,
  handleEditCollection,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState(""); // "", "true", "false"
  const [isDeleted, setIsDeleted] = useState(""); // "", "true", "false"
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectingCategory, setSelectingCategory] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Fetch collections
  const fetchCollections = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/Collection`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: search || undefined,
          isActive: isActive || undefined,
          isDeleted: isDeleted || undefined,
          page,
          pageSize,
        },
      });

      const cols = res.data?.responseBody?.data || [];
      const totalCount = res.data?.responseBody?.totalCount || cols.length;

      const normalized = cols.map((col) => {
        const mainImage =
          col.images?.find((i) => i.isMain) || col.images?.[0] || null;

        // Preserve wasDeleted flag if it exists in the current state
        const existingCol = collections.find((c) => c.id === col.id);
        const wasDeleted = existingCol?.wasDeleted || false;

        return { ...col, mainImage, wasDeleted: col.isDeleted || wasDeleted };
      });

      setCollections(normalized);
      setTotalPages(Math.ceil(totalCount / pageSize));
    } catch (err) {
      console.error("Error fetching collections:", err);
      toast.error("Failed to fetch collections");
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [token, search, isActive, isDeleted, page]);

  // Delete
  const removeCollection = async (id) => {
    try {
      setDeleteLoading(true);

      await axios.delete(`${backendUrl}/api/Collection/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update state locally instead of full fetch
      setCollections((prev) =>
        prev.map((col) =>
          col.id === id ? { ...col, isDeleted: true, wasDeleted: true } : col
        )
      );

      toast.success("Collection deleted successfully");
    } catch (error) {
      const errData = error.response?.data;
      if (errData?.responseBody?.message?.includes("already deleted")) {
        setCollections((prev) =>
          prev.map((col) =>
            col.id === id ? { ...col, isDeleted: true, wasDeleted: true } : col
          )
        );
        toast.info("Collection was already deleted");
      } else {
        toast.error("Failed to delete collection");
      }
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  // Restore
  const restoreCollection = async (id) => {
    try {
      await axios.patch(
        `${backendUrl}/api/Collection/Restore/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update state locally
      setCollections((prev) =>
        prev.map((col) =>
          col.id === id ? { ...col, isDeleted: false, wasDeleted: false } : col
        )
      );

      toast.success("Collection restored successfully");
    } catch (error) {
      console.error("Restore error:", error);
      const msg =
        error.response?.data?.responseBody?.message ||
        error.response?.data?.message ||
        "Failed to restore collection";
      toast.error(msg);
    }
  };

  // Activate / Deactivate / Restore
  const activateCollection = async (col) => {
    if (!col.mainImage) return toast.error("Upload a main image first!");
    if (col.isDeleted || col.wasDeleted) return toast.error("Cannot activate a deleted collection!");

    try {
      await axios.patch(
        `${backendUrl}/api/Collection/activate/${col.id}`,
        null, // 👈 مفيش body
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/plain", // 👈 السيرفر متوقع text/plain
          },
        }
      );

      // Update state locally
      setCollections((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, isActive: true } : c))
      );

      toast.success("Collection activated successfully");
    } catch (error) {
      console.error("Activation error:", error.response || error);
      const msg =
        error.response?.data?.responseBody?.message ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.responseBody?.errors?.detail ||
        "Failed to activate collection";
      toast.error(msg);
    }
  };

  // Activate collection with products
  const activateCollectionWithProducts = async (collection, productIds) => {
    try {
      const formData = new FormData();
      productIds.forEach((id) => {
        formData.append("ProductIds", id); // لازم يتكرر بنفس الاسم عشان يبقى Array
      });

      const res = await axios.post(
        `${backendUrl}/api/Collection/${collection.id}/products`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data?.responseBody?.data) {
        toast.success("Collection activated with selected products!");
      } else {
        toast.warn("Request sent but no confirmation returned.");
      }
    } catch (error) {
      console.error("❌ Error activating collection with products:", error);
      toast.error(
        error.response?.data?.message ||
        "Failed to activate collection with products"
      );
    }
  };

  const deactivateCollection = async (id) => {
    try {
      await axios.patch(
        `${backendUrl}/api/Collection/deactivate/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update state locally
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: false } : c))
      );

      toast.success("Collection deactivated successfully");
    } catch (error) {
      const msg =
        error.response?.data?.responseBody?.message ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to deactivate collection";
      toast.error(msg);
    }
  };

  // Fetch products for activation modal with enhanced filtering
  const fetchProducts = async (searchTerm = "", category = "", sortBy = "") => {
    setProductsLoading(true);
    try {
      // Build query parameters
      const params = {
        isActive: true,
        isDeleted: false,
        pageSize: 100, // Get a reasonable number of products
      };

      // Add search term if provided
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Add category filter if provided
      if (category) {
        params.category = category;
      }

      const res = await axios.get(`${backendUrl}/api/Products`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      let productData = res.data?.responseBody?.data || [];

      // Normalize product fields for preview (main image + category display)
      productData = productData.map((p) => {
        const mainImageUrl = p?.images?.find((i) => i.isMain)?.url
          || p?.images?.[0]?.url
          || p?.mainImage?.url
          || (Array.isArray(p?.image) ? p.image[0] : undefined);
        const categoryDisplay =
          p?.category?.name ||
          p?.category ||
          p?.categoryName ||
          p?.subCategory?.category?.name ||
          p?.subCategoryName ||
          p?.subCategory?.name ||
          "Uncategorized";
        return { ...p, mainImageUrl, categoryDisplay };
      });

      // Client-side sorting if sortBy is specified
      if (sortBy) {
        switch (sortBy) {
          case "name-asc":
            productData.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case "name-desc":
            productData.sort((a, b) => b.name.localeCompare(a.name));
            break;
          case "price-asc":
            productData.sort((a, b) => a.price - b.price);
            break;
          case "price-desc":
            productData.sort((a, b) => b.price - a.price);
            break;
          case "newest":
            productData.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            break;
          default:
            break;
        }
      }

      setProducts(productData);

      // Build unique categories from returned products
      const uniqueCats = Array.from(
        new Set(
          (productData || [])
            .map((p) => p.categoryDisplay)
            .filter((c) => typeof c === "string" && c.trim().length > 0)
        )
      ).sort((a, b) => a.localeCompare(b));
      setCategories(uniqueCats);

      // Show appropriate toast message based on search/filter criteria
      if (searchTerm || category) {
        const filterDesc = [];
        if (searchTerm) filterDesc.push(`matching "${searchTerm}"`);
        if (category) filterDesc.push(`in ${category} category`);

        toast.success(
          `Found ${productData.length} products ${filterDesc.join(" ")}`
        );
      } else {
        toast.success(`Found ${productData.length} products`);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to fetch products");
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch active categories for dropdown
  const fetchActiveCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/categories`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "text/plain" },
        params: { isActive: true, isDeleted: false, page: 1, pageSize: 1000 },
      });
      const catData = res.data?.responseBody?.data || [];
      const names = catData
        .map((c) => c?.name)
        .filter((n) => typeof n === "string" && n.trim().length > 0)
        .sort((a, b) => a.localeCompare(b));
      // If none returned, keep existing categories list
      if (names.length > 0) {
        setCategories(names);
        // Display toast with all active categories
        toast.success(`Found ${names.length} active categories: ${names.join(', ')}`);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to fetch active categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Handle opening the activate with products modal
  const openActivateModal = (col) => {
    if (!col.mainImage) {
      return toast.error("Upload a main image first!");
    }
    if (col.isDeleted || col.wasDeleted) {
      return toast.error("Cannot activate a deleted collection!");
    }
    setSelectedCollection(col);
    setSelectedProductIds([]);
    setActivateModalOpen(true);
    // Call fetchProducts with default empty parameters
    fetchProducts("", "", "");
    // Also fetch active categories list
    fetchActiveCategories();
  };

  // Handle product selection
  const toggleProductSelection = (productId) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Handle bulk selection by category
  const selectProductsByCategory = async (category) => {
    if (!category) return;

    setSelectingCategory(true);

    try {
      // Get all products with the specified category
      const categoryProductIds = products
        .filter((product) => product.category === category)
        .map((product) => product.id);

      // Add these products to the selection if they're not already selected
      setSelectedProductIds((prev) => {
        const newSelection = [...prev];

        categoryProductIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });

        return newSelection;
      });

      const addedCount = categoryProductIds.length;
      if (addedCount > 0) {
        toast.success(`Added ${addedCount} products from ${category} category`);
      } else {
        toast.info(`No new products from ${category} category to add`);
      }
    } catch (error) {
      console.error("Error selecting products by category:", error);
      toast.error("Failed to select products");
    } finally {
      setSelectingCategory(false);
    }
  };

  // Handle activation with selected products
  const handleActivateWithProducts = () => {
    if (!selectedCollection) {
      return toast.error("No collection selected");
    }

    if (selectedCollection.isDeleted || selectedCollection.wasDeleted) {
      return toast.error("Cannot activate a deleted collection");
    }

    if (selectedProductIds.length === 0) {
      return toast.error("Please select at least one product");
    }
    activateCollectionWithProducts(selectedCollection, selectedProductIds);
    setActivateModalOpen(false);
  };

  // View collection details
  const viewCollection = (id) => {
    navigate(`/collection/view/${id}`);
  };

  // Pagination
  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">
          Collections List
        </h2>
        <div className="text-sm text-gray-500">
          Manage your product collections
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2 pl-3 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                placeholder="Search by name"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Show Deleted
            </label>
            <select
              value={isDeleted}
              onChange={(e) => setIsDeleted(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
            >
              <option value="">All Items</option>
              <option value="true">Deleted Only</option>
              <option value="false">Not Deleted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collections Table */}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 border-b text-left font-semibold text-gray-700 hidden md:table-cell">
                ID
              </th>
              <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">
                Image
              </th>
              <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">
                Name
              </th>
              <th className="py-3 px-4 border-b text-left font-semibold text-gray-700 hidden md:table-cell">
                Description
              </th>
              <th className="py-3 px-4 border-b text-left font-semibold text-gray-700 hidden md:table-cell">
                Order
              </th>
              <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">
                Status
              </th>
              <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {collections.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                  No collections found
                </td>
              </tr>
            ) : (
              collections.map((col) => (
                <tr key={col.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 border-b hidden md:table-cell">
                    {col.id}
                  </td>
                  <td className="py-3 px-4 border-b">
                    {col.mainImage ? (
                      <img
                        src={col.mainImage.url}
                        alt={col.name}
                        className="w-12 h-12 object-cover rounded-md shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 border-b font-medium">{col.name}</td>
                  <td className="py-3 px-4 border-b hidden md:table-cell">
                    {col.description.length > 50
                      ? `${col.description.substring(0, 50)}...`
                      : col.description}
                  </td>
                  <td className="py-3 px-4 border-b hidden md:table-cell">
                    {col.displayOrder}
                  </td>
                  <td className="py-3 px-4 border-b">
                    <div className="flex flex-col gap-1">
                      {col.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium w-fit">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium w-fit">
                          Inactive
                        </span>
                      )}
                      {(col.isDeleted || col.wasDeleted || col.deletedAt) && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium w-fit">
                          Deleted
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => viewCollection(col.id)}
                        className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs font-medium transition-colors shadow-sm flex items-center justify-center min-w-[60px]"
                      >
                        View
                      </button>

                      {!col.isDeleted && !col.wasDeleted && (
                        <button
                          onClick={() => handleEditCollection(col.id)}
                          className="px-2 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-xs font-medium transition-colors shadow-sm flex items-center justify-center min-w-[60px]"
                        >
                          Edit
                        </button>
                      )}

                      {!col.isDeleted && !col.wasDeleted && !col.deletedAt ? (
                        <button
                          onClick={() => setDeleteId(col.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs font-medium transition-colors shadow-sm flex items-center justify-center min-w-[60px]"
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          onClick={() => restoreCollection(col.id)}
                          className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs font-medium transition-colors shadow-sm flex items-center justify-center min-w-[60px]"
                        >
                          Restore
                        </button>
                      )}

                      {!col.isDeleted && !col.wasDeleted ? (
                        <>
                          {col.isActive ? (
                            <button
                              onClick={() => deactivateCollection(col.id)}
                              className="px-2 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs font-medium transition-colors shadow-sm flex items-center justify-center min-w-[80px]"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              <button
                                onClick={() => activateCollection(col)}
                                className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs font-medium transition-colors shadow-sm flex items-center justify-center min-w-[70px]"
                              >
                                Activate
                              </button>
                              <button
                                onClick={() => openActivateModal(col)}
                                className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs font-medium transition-colors shadow-sm flex items-center justify-center min-w-[90px]"
                              >
                                With Products
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          <button
                            className="px-2 py-1 bg-gray-400 text-white rounded-md text-xs font-medium transition-colors shadow-sm flex items-center justify-center min-w-[70px] cursor-not-allowed"
                            disabled
                          >
                            Activate
                          </button>
                          <button
                            className="px-2 py-1 bg-gray-400 text-white rounded-md text-xs font-medium transition-colors shadow-sm flex items-center justify-center min-w-[90px] cursor-not-allowed"
                            disabled
                          >
                            With Products
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm">
        <div className="mb-3 sm:mb-0">
          <span className="text-sm font-medium text-gray-700">
            Page {page} of {totalPages} • {collections.length} items
          </span>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center min-w-[100px] font-medium"
          >
            ← Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 hover:bg-blue-600 transition-colors shadow-sm flex items-center justify-center min-w-[100px] font-medium"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full transform transition-all">
            <div className="flex items-center mb-4 text-red-500 border-b pb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            </div>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this collection? This action can
              be undone later.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-reverse space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => removeCollection(deleteId)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-red-300 transition-colors font-medium flex items-center justify-center"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate with Products Modal */}
      {activateModalOpen && selectedCollection && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                Activate Collection with Products
              </h3>
              <button
                onClick={() => setActivateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full h-8 w-8 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">
                  Select products to add to{" "}
                  <strong className="text-gray-800">
                    {selectedCollection.name}
                  </strong>{" "}
                  collection:
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (products.length > 0) {
                        setSelectedProductIds(products.map((p) => p.id));
                        toast.success(
                          `Selected all ${products.length} products`
                        );
                      } else {
                        toast.info("No products available to select");
                      }
                    }}
                    disabled={
                      productsLoading ||
                      selectingCategory ||
                      (selectedCollection &&
                        (selectedCollection.isDeleted ||
                          selectedCollection.wasDeleted))
                    }
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${productsLoading || selectingCategory || (selectedCollection && (selectedCollection.isDeleted || selectedCollection.wasDeleted)) ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProductIds([]);
                      if (selectedProductIds.length > 0) {
                        toast.success("Selection cleared");
                      }
                    }}
                    disabled={
                      productsLoading ||
                      selectingCategory ||
                      selectedProductIds.length === 0 ||
                      (selectedCollection &&
                        (selectedCollection.isDeleted ||
                          selectedCollection.wasDeleted))
                    }
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${productsLoading || selectingCategory || selectedProductIds.length === 0 || (selectedCollection && (selectedCollection.isDeleted || selectedCollection.wasDeleted)) ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Active Categories Preview */}
              <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                  Active Categories {categories.length > 0 && `(${categories.length})`}:
                  {categoriesLoading && (
                    <svg
                      className="animate-spin ml-2 h-4 w-4 text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                </h4>
                {categoriesLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <p className="text-sm text-gray-500">Loading categories...</p>
                  </div>
                ) : categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-1 bg-white text-blue-600 text-xs rounded-md border border-blue-200 cursor-pointer hover:bg-blue-100"
                        onClick={() => {
                          document.getElementById("categoryFilter").value = cat;
                          const searchTerm = document.querySelector('input[placeholder="Search products..."]').value;
                          const sortBy = document.getElementById("sortByFilter").value;
                          fetchProducts(searchTerm, cat, sortBy);
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center py-4">
                    <p className="text-sm text-gray-500">No active categories found</p>
                  </div>
                )}
              </div>

              {/* Search and Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                    onChange={(e) => {
                      const searchTerm = e.target.value;

                      // Debounce search to avoid too many API calls
                      clearTimeout(window.searchTimeout);
                      window.searchTimeout = setTimeout(() => {
                        fetchProducts(
                          searchTerm,
                          document.getElementById("categoryFilter").value,
                          document.getElementById("sortByFilter").value
                        );
                      }, 300);
                    }}
                    disabled={
                      selectedCollection &&
                      (selectedCollection.isDeleted ||
                        selectedCollection.wasDeleted)
                    }
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    {productsLoading ? (
                      <svg
                        className="animate-spin h-4 w-4 text-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2">
                  <select
                    id="categoryFilter"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all disabled:bg-gray-100 disabled:text-gray-500"
                    onChange={(e) => {
                      const categoryValue = e.target.value;
                      const searchTerm = document.querySelector(
                        'input[placeholder="Search products..."]'
                      ).value;
                      const sortBy =
                        document.getElementById("sortByFilter").value;
                      fetchProducts(searchTerm, categoryValue, sortBy);
                    }}
                    disabled={
                      selectedCollection &&
                      (selectedCollection.isDeleted ||
                        selectedCollection.wasDeleted)
                    }
                  >
                    <option value="">All Categories ({categories.length})</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const categoryValue =
                        document.getElementById("categoryFilter").value;
                      if (categoryValue) {
                        selectProductsByCategory(categoryValue);
                      } else {
                        toast.info("Please select a category first");
                      }
                    }}
                    disabled={
                      selectingCategory ||
                      (selectedCollection &&
                        (selectedCollection.isDeleted ||
                          selectedCollection.wasDeleted))
                    }
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${selectingCategory || (selectedCollection && (selectedCollection.isDeleted || selectedCollection.wasDeleted)) ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
                    title="Select all products from this category"
                  >
                    {selectingCategory ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Selecting...
                      </span>
                    ) : (
                      "Select"
                    )}
                  </button>
                </div>

                {/* Sort By */}
                <div>
                  <select
                    id="sortByFilter"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all disabled:bg-gray-100 disabled:text-gray-500"
                    onChange={(e) => {
                      const sortByValue = e.target.value;
                      const searchTerm = document.querySelector(
                        'input[placeholder="Search products..."]'
                      ).value;
                      const category =
                        document.getElementById("categoryFilter").value;
                      fetchProducts(searchTerm, category, sortByValue);
                    }}
                    disabled={
                      selectedCollection &&
                      (selectedCollection.isDeleted ||
                        selectedCollection.wasDeleted)
                    }
                  >
                    <option value="">Sort By</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Product Count */}
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {productsLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading products...
                    </span>
                  ) : (
                    <span>
                      Showing <strong>{products.length}</strong> products
                      {selectedProductIds.length > 0 && (
                        <span>
                          {" "}
                          (<strong>{selectedProductIds.length}</strong>{" "}
                          selected)
                        </span>
                      )}
                    </span>
                  )}
                </p>
              </div>

              {productsLoading ? (
                <div className="flex flex-col justify-center items-center py-12">
                  <FaSpinner className="animate-spin text-blue-500 text-3xl mb-2" />
                  <span className="text-gray-600">Loading products...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col justify-center items-center py-12 text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-gray-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p>No products available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-md p-4 transition-all ${selectedProductIds.includes(product.id) ? "border-blue-500 bg-blue-50" : "border-gray-200"} ${selectedCollection && (selectedCollection.isDeleted || selectedCollection.wasDeleted) ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:shadow-md hover:border-gray-300"}`}
                      onClick={() => {
                        if (
                          !(
                            selectedCollection &&
                            (selectedCollection.isDeleted ||
                              selectedCollection.wasDeleted)
                          )
                        ) {
                          toggleProductSelection(product.id);
                        }
                      }}
                    >
                      {selectedProductIds.includes(product.id) && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="mr-3 h-5 w-5 text-blue-500 focus:ring-blue-400"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 truncate">
                            {product.name}
                          </p>
                        </div>
                      </div>

                      <div className="pl-8">
                        {/* Product Image */}
                        {product.mainImageUrl ? (
                          <div className="mb-2 flex justify-center">
                            <img
                              src={product.mainImageUrl}
                              alt={product.name}
                              className="h-24 w-24 object-cover rounded-md shadow-sm"
                            />
                          </div>
                        ) : (
                          <div className="mb-2 flex justify-center">
                            <div className="h-24 w-24 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                              No image
                            </div>
                          </div>
                        )}

                        {/* Product Details */}
                        <div className="text-sm text-gray-600">
                          {/* Category */}
                          <p className="mb-1">
                            <span className="font-medium">Category:</span>{" "}
                            {product.categoryDisplay}
                          </p>

                          {/* Price and Discount */}
                          {(() => {
                            const original = Number(product.price) || 0;
                            const final = Number(product.finalPrice ?? original);
                            const hasDiscount = final > 0 && final < original;
                            const percent = hasDiscount && original > 0
                              ? Math.round(((original - final) / original) * 100)
                              : 0;

                            return (
                              <div className="mb-1 flex items-center gap-2">
                                {hasDiscount ? (
                                  <>
                                    <span className="line-through text-gray-400 text-xs">${original.toFixed(2)}</span>
                                    <span className="text-red-600 font-medium text-sm">${final.toFixed(2)}</span>
                                    <span className="bg-red-100 text-red-700 text-[10px] px-1 py-0.5 rounded">{percent}% OFF</span>
                                  </>
                                ) : (
                                  <span>${original.toFixed(2)}</span>
                                )}
                              </div>
                            );
                          })()}

                          {/* SKU */}
                          <p className="mb-1">
                            <span className="font-medium">SKU:</span>{" "}
                            {product.sku || "N/A"}
                          </p>

                          {/* Description */}
                          <p className="text-sm text-gray-500 mt-2">
                            <span className="font-medium">Description:</span>{" "}
                            {product.description?.substring(0, 80)}
                            {product.description?.length > 80 ? "..." : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview Section */}
            {selectedProductIds.length > 0 &&
              selectedCollection &&
              !selectedCollection.isDeleted &&
              !selectedCollection.wasDeleted && (
                <div className="p-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Preview: Selected Products
                  </h4>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-gray-50 rounded-md">
                    {products
                      .filter((product) =>
                        selectedProductIds.includes(product.id)
                      )
                      .slice(0, 10) // Show only first 10 products in preview
                      .map((product) => (
                        <div
                          key={`preview-${product.id}`}
                          className="flex items-center bg-white px-2 py-1 rounded border text-xs"
                        >
                          {product.mainImage ? (
                            <img
                              src={product.mainImage}
                              alt={product.name}
                              className="w-4 h-4 object-cover rounded mr-1"
                            />
                          ) : (
                            <div className="w-4 h-4 bg-gray-200 rounded mr-1"></div>
                          )}
                          <span className="truncate max-w-[100px]">
                            {product.name}
                          </span>
                        </div>
                      ))}
                    {selectedProductIds.length > 10 && (
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        +{selectedProductIds.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            {selectedCollection &&
              (selectedCollection.isDeleted ||
                selectedCollection.wasDeleted) && (
                <div className="p-4 border-t">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
                    <p className="text-sm font-medium">
                      Cannot add products to a deleted collection
                    </p>
                  </div>
                </div>
              )}

            <div className="border-t p-4 sm:p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm font-medium text-gray-700 bg-white px-3 py-1 rounded-full border">
                  {selectedProductIds.length} products selected
                  {selectedProductIds.length > 0 && (
                    <button
                      onClick={() => setSelectedProductIds([])}
                      className="ml-2 text-blue-500 hover:text-blue-700 text-xs underline"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setActivateModalOpen(false)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium w-full sm:w-auto shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleActivateWithProducts}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors font-medium w-full sm:w-auto flex items-center justify-center shadow-sm"
                    disabled={
                      selectedProductIds.length === 0 ||
                      (selectedCollection &&
                        (selectedCollection.isDeleted ||
                          selectedCollection.wasDeleted))
                    }
                  >
                    {selectedCollection &&
                      (selectedCollection.isDeleted ||
                        selectedCollection.wasDeleted)
                      ? "Cannot Activate Deleted Collection"
                      : selectedProductIds.length === 0
                        ? "Select Products to Activate"
                        : `Activate with ${selectedProductIds.length} ${selectedProductIds.length === 1 ? "Product" : "Products"}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListCollection;
