import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";

const AddSubCategory = ({
  token,
  categories = [],
  fetchSubCategories,
  setActiveTab,
  parentCategoryId,
  setParentCategoryId,
  subCategoryName,
  setSubCategoryName,
  subCategoryDescription,
  setSubCategoryDescription,
  setSubCategoryDisplayOrder,
  subCategoryImages,
  setSubCategoryImages,
  subCategoryMainImage,
  setSubCategoryMainImage,
  editSubCategoryMode = false,
  editSubCategoryId = null,
  setSubCategories,
}) => {
  const [loading, setLoading] = useState(false);

  // 🧹 Clean text helper
  const cleanText = (text) => text?.replace(/\s+/g, " ").trim();

  // 🧹 Reset form
  const resetForm = () => {
    setSubCategoryName("");
    setSubCategoryDescription("");
    setSubCategoryDisplayOrder(1);
    setSubCategoryImages([]);
    setSubCategoryMainImage(null);
    setParentCategoryId("");
    setActiveTab && setActiveTab("sub-list");
  };

  // ➕ Add or Update sub-category
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("You must log in first!");
    if (!parentCategoryId)
      return toast.error("Please select a parent category");

    const name = cleanText(subCategoryName);
    const description = cleanText(subCategoryDescription);

    if (!name || name.length < 5 || name.length > 20)
      return toast.error("Name must be 5-20 characters");
    if (!description || description.length < 10 || description.length > 50)
      return toast.error("Description must be 10-50 characters");

    setLoading(true);

    try {
      // Body لازم يكون JSON زي swagger
      const body = {
        name,
        description,
        categoryId: Number(parentCategoryId),
      };

      let res;
      if (editSubCategoryMode && editSubCategoryId) {
        // Update
        res = await axios.put(
          `${backendUrl}/api/subcategories/${editSubCategoryId}`,
          body,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        // Create
        res = await axios.post(`${backendUrl}/api/subcategories`, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      const newId =
        res.data?.data?.id || res.data?.id || res.data?.responseBody?.data?.id;

      if (!newId) throw new Error("Failed to get subcategory ID");

      toast.success(
        editSubCategoryMode ? "Subcategory updated!" : "Subcategory created!"
      );

      // Main Image
      if (subCategoryMainImage) {
        const mainForm = new FormData();
        mainForm.append("Image", subCategoryMainImage);
        await axios.post(
          `${backendUrl}/api/subcategories/${newId}/images/main`,
          mainForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Additional Images
      if (subCategoryImages?.length > 0) {
        const addForm = new FormData();
        subCategoryImages.forEach((file) => addForm.append("Images", file));
        await axios.post(
          `${backendUrl}/api/subcategories/${newId}/images`,
          addForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Refresh list
      if (typeof fetchSubCategories === "function") await fetchSubCategories();
      else if (typeof setSubCategories === "function")
        setSubCategories((prev) => [...prev, res.data?.data]);

      // Reset
      resetForm();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.responseBody?.message || "Error saving subcategory";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        {editSubCategoryMode ? "Edit Sub-Category" : "Add New Sub-Category"}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label>Parent Category</label>
          <select
            value={parentCategoryId || ""}
            onChange={(e) => setParentCategoryId(Number(e.target.value))}
            className="border px-3 py-2 w-full"
            required
          >
            <option value="">Select Parent Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Sub-Category Name</label>
          <input
            value={subCategoryName || ""}
            onChange={(e) => setSubCategoryName(e.target.value)}
            className="border px-3 py-2 w-full"
            placeholder="Sub-Category Name"
            required
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            value={subCategoryDescription || ""}
            onChange={(e) => setSubCategoryDescription(e.target.value)}
            className="border px-3 py-2 w-full"
            rows="3"
            placeholder="Description"
          />
        </div>

        <div>
          <label>Main Image</label>
          <input
            type="file"
            onChange={(e) => setSubCategoryMainImage(e.target.files[0])}
            accept="image/*"
            className="border px-3 py-2 w-full"
          />
          {subCategoryMainImage && (
            <img
              src={URL.createObjectURL(subCategoryMainImage)}
              alt="Main"
              className="h-24 w-24 object-cover rounded mt-2"
            />
          )}
        </div>

        <div>
          <label>Additional Images</label>
          <input
            type="file"
            multiple
            onChange={(e) => setSubCategoryImages(Array.from(e.target.files))}
            accept="image/*"
            className="border px-3 py-2 w-full"
          />
          {subCategoryImages?.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {subCategoryImages.map((file, idx) => (
                <img
                  key={idx}
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${idx}`}
                  className="h-20 w-20 object-cover rounded"
                />
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${
            loading ? "bg-gray-400" : "bg-blue-600"
          } text-white py-2 rounded`}
        >
          {loading
            ? editSubCategoryMode
              ? "Updating..."
              : "Adding..."
            : editSubCategoryMode
              ? "Update Sub-Category"
              : "Add Sub-Category"}
        </button>
      </form>
    </div>
  );
};

export default AddSubCategory;
