import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";
import { useNavigate } from "react-router-dom";

const ListCategory = ({
  token,
  categories,
  setCategories,
  handleEditCategory,
  handleViewCategory,
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

  // ✅ Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: search || undefined,
          isActive: isActive || undefined,
          isDeleted: isDeleted || undefined,
          page,
          pageSize,
        },
      });

      const cats = res.data?.responseBody?.data || [];
      const totalCount = res.data?.responseBody?.totalCount || cats.length;

      const normalized = cats.map((cat) => {
        const mainImage =
          cat.images?.find((i) => i.isMain) || cat.images?.[0] || null;

        // لو السيرفر رجع isDeleted=true لازم نخليه يظهر كده
        return {
          ...cat,
          mainImage,
          wasDeleted: cat.isDeleted || false, // يبقى عندنا flag دائم إن الكاتيجوري اتشالت قبل كده
        };
      });

      setCategories(normalized);
      setTotalPages(Math.ceil(totalCount / pageSize));
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token, search, isActive, isDeleted, page]);

  // ✅ Delete
  // ✅ Delete
  const removeCategory = async (id) => {
    try {
      setDeleteLoading(true); // Start loading

      const res = await axios.delete(`${backendUrl}/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Update state locally instead of full fetch
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id ? { ...cat, isDeleted: true, wasDeleted: true } : cat
        )
      );

      const okMsg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        (typeof res?.data === "string" ? res.data : null) ||
        "Category deleted successfully";
      toast.success(okMsg);
    } catch (error) {
      const errData = error.response?.data;
      const apiMsg =
        errData?.responseBody?.message ||
        errData?.message ||
        error.message ||
        "Failed to delete category";
      if (errData?.responseBody?.message?.includes("already deleted")) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === id ? { ...cat, isDeleted: true, wasDeleted: true } : cat
          )
        );
        toast.info(apiMsg);
      } else {
        toast.error(apiMsg);
      }
    } finally {
      setDeleteLoading(false); // ✅ Reset loading
      setDeleteId(null); // ✅ Close modal
    }
  };

  // ✅ Activate / Deactivate / Restore
  const activateCategory = async (cat) => {
    if (!cat.mainImage) return toast.error("Upload a main image first!");
    try {
      const res = await axios.patch(
        `${backendUrl}/api/categories/${cat.id}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        "Category activated ✅";
      toast.success(msg);
      fetchCategories(); // ⬅️ هنا نعمل refresh من السيرفر
    } catch (err) {
      console.error("Activation failed:", err.response?.data || err);
      const emsg =
        err.response?.data?.responseBody?.message ||
        err.response?.data?.message ||
        "Activation failed";
      toast.error(emsg);
    }
  };

  const deactivateCategory = async (id) => {
    try {
      const res = await axios.patch(
        `${backendUrl}/api/categories/${id}/deactivate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { isActive: false }, // ✨ مهم
        }
      );
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        "Category deactivated ❌";
      toast.success(msg);
      fetchCategories();
    } catch (err) {
      console.error("Deactivation failed:", err.response?.data || err);
      const emsg =
        err?.response?.data?.responseBody?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Deactivation failed";
      toast.error(emsg);
    }
  };

  const restoreCategory = async (id) => {
    try {
      const res = await axios.patch(
        `${backendUrl}/api/categories/${id}/restore`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const msg =
        res?.data?.responseBody?.message ||
        res?.data?.message ||
        "Category restored ✅";
      toast.success(msg);

      // Update the category locally to keep track that it was once deleted
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id ? { ...cat, isDeleted: false, wasDeleted: true } : cat
        )
      );
    } catch (err) {
      console.error("Restore failed:", err);
      const emsg =
        err.response?.data?.responseBody?.message ||
        err.response?.data?.message ||
        "Restore failed";
      toast.error(emsg);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Categories List</h2>
        <button
          onClick={() => handleEditCategory(null)}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        >
          Add New Category
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 bg-white p-4 rounded-xl shadow flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border px-3 py-2 rounded w-60 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
        />
        <select
          value={isActive}
          onChange={(e) => {
            setIsActive(e.target.value);
            setPage(1);
          }}
          className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
        >
          <option value="">All (Active/Inactive)</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select
          value={isDeleted}
          onChange={(e) => {
            setIsDeleted(e.target.value);
            setPage(1);
          }}
          className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
        >
          <option value="">All (Deleted/Not Deleted)</option>
          <option value="true">Deleted</option>
          <option value="false">Not Deleted</option>
        </select>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <p>No categories found.</p>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="border p-4 rounded-lg shadow-sm hover:shadow-md transition bg-white"
            >
              {cat.mainImage ? (
                <img
                  src={cat.mainImage.url}
                  alt={cat.name}
                  className="w-full h-40 object-cover rounded mb-3"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded mb-3 text-gray-500">
                  No Image
                </div>
              )}
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{cat.name}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {cat.description || "No description"}
              </p>
              <p />
              {/* ✅ Status */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
                {cat.isDeleted ? (
                  <span className="px-2 py-0.5 text-[11px] rounded-full font-medium bg-gray-100 text-gray-700">Deleted</span>
                ) : cat.wasDeleted ? (
                  <span className="px-2 py-0.5 text-[11px] rounded-full font-medium bg-amber-100 text-amber-700">Was Deleted</span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCategory(cat);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>

                {/* ✅ شرط: إذا الكاتيجوري محذوفة، لا تظهر زر Delete بل Restore */}
                {!cat.isDeleted ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(cat.id);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      restoreCategory(cat.id);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                  >
                    Restore
                  </button>
                )}

                {cat.isActive ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deactivateCategory(cat.id);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      activateCategory(cat);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                  >
                    Activate
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewCategory(cat);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-3 mt-6">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[350px]">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this category?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => removeCategory(deleteId)}
                disabled={deleteLoading}
                className={`px-4 py-2 ${deleteLoading ? "bg-red-300" : "bg-red-500 hover:bg-red-600"} text-white rounded-md`}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListCategory;
