import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../App";

const SubCategories = ({ token }) => {
  const [activeTab, setActiveTab] = useState("add");
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [mainImage, setMainImage] = useState(null);
  const [images, setImages] = useState([]);

  const [editMode, setEditMode] = useState(false);
  const [editSubCategoryId, setEditSubCategoryId] = useState(null);
  const [categoryId, setCategoryId] = useState("");

  const cleanText = (text) => text.replace(/[^a-zA-Z0-9\s.,!?-]/g, "").trim();

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/categories`);
      setCategories(res.data.data || []); // ✅ استخدم data فقط
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
      setCategories([]); // ✅ fallback
    }
  };

  const createSubCategory = async (name, description, categoryId, token) => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/subcategories`,
        {
          name,
          description,
          categoryId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ ضيف التوكن هنا
          },
        }
      );
      console.log("✅ SubCategory Created:", res.data);
    } catch (err) {
      console.error(
        "❌ Error creating subcategory:",
        err.response?.data || err
      );
    }
  };

  useEffect(() => {
    fetchCategories();
    createSubCategory();
  }, []);

  // ✅ Add / Update SubCategory
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("You must log in first!");
      return;
    }

    const cleanedName = cleanText(name);
    const cleanedDescription = cleanText(description);

    setLoading(true);
    try {
      // 1️⃣ Add SubCategory (without images)
      const res = await axios.post(
        `${backendUrl}/api/subcategories`,
        {
          name: cleanedName,
          description: cleanedDescription,
          categoryId: Number(categoryId), // Convert to number to avoid validation error
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newSubCategoryId = res.data.id; // ✅ Get ID from response

      // 2️⃣ Upload Main Image if exists
      if (mainImage) {
        const formData = new FormData();
        formData.append("file", mainImage);

        await axios.post(
          `${backendUrl}/api/subcategories/${newSubCategoryId}/images/main`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // 3️⃣ Upload Additional Images if exist
      if (images.length > 0) {
        const formData = new FormData();
        for (let file of images) {
          formData.append("files", file);
        }

        await axios.post(
          `${backendUrl}/api/subcategories/${newSubCategoryId}/images`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      toast.success("SubCategory added successfully!");
      resetForm();
      createSubCategory();
    } catch (error) {
      console.error("❌ Error saving subcategory:", error);
      toast.error(error.response?.data?.message || "Error saving subcategory");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reset Form
  const resetForm = () => {
    setName("");
    setDescription("");
    setParentCategoryId("");
    setMainImage(null);
    setImages([]);
    setEditMode(false);
    setEditSubCategoryId(null);
    setCategoryId(""); // Reset to empty string, will be converted to number when selected
  };

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab("add")}
          className={`px-4 py-2 rounded ${
            activeTab === "add" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Add SubCategory
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 rounded ${
            activeTab === "list" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          List SubCategories
        </button>
      </div>

      {/* Add/Edit SubCategory */}
      {activeTab === "add" && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 max-w-[600px]"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="SubCategory Name"
            required
            className="px-3 py-2 border rounded"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="px-3 py-2 border rounded"
          />

          {/* ✅ Parent Category Select */}
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
            required
            className="px-3 py-2 border rounded"
          >
            <option value="">-- Select Parent Category --</option>
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))
            ) : (
              <option disabled>No Categories Found</option>
            )}
          </select>

          {/* ✅ Main Image */}
          <input
            type="file"
            onChange={(e) => setMainImage(e.target.files[0])}
          />

          {/* ✅ Multiple Images */}
          <input
            type="file"
            multiple
            onChange={(e) => setImages([...e.target.files])}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            {loading ? "Saving..." : editMode ? "Update" : "Add"}
          </button>
        </form>
      )}

      {/* SubCategory List */}
      {activeTab === "list" && (
        <div className="flex flex-col gap-3 mt-4">
          <p className="mb-2">All SubCategories</p>
          {subCategories.length === 0 ? (
            <p className="text-center py-4">No SubCategories found</p>
          ) : (
            subCategories.map((sub) => (
              <div
                key={sub.id}
                className="grid grid-cols-[2fr_2fr_2fr] items-center py-2 px-3 border rounded text-sm"
              >
                <p>{sub.name}</p>
                <p>{sub.description}</p>
                <p>
                  {sub.parentCategory?.name || (
                    <span className="text-gray-400">No Parent</span>
                  )}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SubCategories;
