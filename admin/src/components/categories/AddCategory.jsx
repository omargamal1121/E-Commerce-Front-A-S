import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";
import { useNavigate } from "react-router-dom";

const AddCategory = ({
  token,
  editCategoryMode = false,
  editCategoryId = null,
  fetchCategories,
  setCategories,
  setActiveTab,
}) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [images, setImages] = useState([]);
  const [mainImage, setMainImage] = useState(null);

  // 🆕 لعرض الصور القديمة لو بنعمل Edit
  const [oldImages, setOldImages] = useState([]);
  const [oldMainImage, setOldMainImage] = useState(null);

  const navigate = useNavigate();

  // 🧹 Clean text helper
  const cleanText = (text) => text?.replace(/\s+/g, " ").trim();

  // 🧹 Reset form
  const resetForm = () => {
    setName("");
    setDescription("");
    setDisplayOrder(1);
    setImages([]);
    setMainImage(null);
    setOldImages([]);
    setOldMainImage(null);
    setActiveTab && setActiveTab("category-list");
  };

  // 🆕 Fetch category details when editing
  useEffect(() => {
    const fetchCategoryDetails = async () => {
      if (editCategoryMode && editCategoryId && token) {
        try {
          const res = await axios.get(
            `${backendUrl}/api/categories/${editCategoryId}`,
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
            setOldImages(cat.images.filter((img) => !img.isMain));
            setOldMainImage(cat.images.find((img) => img.isMain));
          }
        } catch (err) {
          console.error("❌ Error fetching category:", err);
          toast.error("Failed to load category details");
        }
      }
    };

    fetchCategoryDetails();
  }, [editCategoryMode, editCategoryId, token]);

  // ➕ Add or Update Category
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("You must log in first!");

    const cleanedName = cleanText(name);
    const cleanedDescription = cleanText(description);
    const cleanedOrder = Math.max(1, Number(displayOrder));

    if (!cleanedName || cleanedName.length < 3 || cleanedName.length > 50)
      return toast.error("Name must be 3-50 characters");
    if (
      !cleanedDescription ||
      cleanedDescription.length < 5 ||
      cleanedDescription.length > 200
    )
      return toast.error("Description must be 5-200 characters");

    setLoading(true);
    try {
      // Prepare the request body
      const body = {
        name: cleanedName,
        description: cleanedDescription,
        displayOrder: cleanedOrder,
      };
      
      // Add image IDs to keep when editing
      if (editCategoryMode && editCategoryId) {
        // Keep track of existing images we want to retain
        body.imageIds = [
          ...(oldMainImage ? [oldMainImage.id] : []),
          ...(oldImages?.map(img => img.id) || [])
        ];
      }

      let res;
      if (editCategoryMode && editCategoryId) {
        // 📝 Update
        res = await axios.put(
          `${backendUrl}/api/categories/${editCategoryId}`,
          body,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        // ➕ Create
        res = await axios.post(`${backendUrl}/api/categories`, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json-patch+json",
          },
        });
      }

      const categoryId =
        res.data?.responseBody?.data?.id || res.data?.data?.id || res.data?.id;

      if (!categoryId) throw new Error("Failed to get category ID");

      toast.success(
        editCategoryMode ? "Category updated ✅" : "Category created ✅"
      );

      // 2️⃣ رفع الصور الإضافية
      if (images?.length > 0) {
        const imgForm = new FormData();
        images.forEach((file) => imgForm.append("Images", file));
        await axios.post(
          `${backendUrl}/api/categories/${categoryId}/images`,
          imgForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // 3️⃣ رفع الصورة الرئيسية
      if (mainImage) {
        const mainForm = new FormData();
        mainForm.append("Image", mainImage);
        await axios.post(
          `${backendUrl}/api/categories/${categoryId}/images/main`,
          mainForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // ✅ تحديث الليستة
      if (typeof fetchCategories === "function") await fetchCategories();
      else if (typeof setCategories === "function")
        setCategories((prev) => [...prev, res.data?.data]);

      resetForm();
      navigate(`/category/view/${categoryId}`);
    } catch (error) {
      console.error("❌ Error saving category:", error);
      const apiError =
        error.response?.data?.responseBody?.errors?.messages?.[0] ||
        error.response?.data?.responseBody?.message ||
        "Error saving category";
      toast.error(apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-xl font-bold mb-4">
          {editCategoryMode ? "Edit Category" : "Add New Category"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Category Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border px-3 py-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              placeholder="Category Name"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border px-3 py-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              placeholder="Description"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Display Order</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="border px-3 py-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              min="1"
            />
          </div>

        {/* 🖼️ Old Main Image */}
        {oldMainImage && !mainImage && (
          <div>
            <p className="text-sm text-gray-600">Current Main Image:</p>
            <img
              src={oldMainImage.url}
              alt="Old Main"
              className="h-24 w-24 object-cover rounded mt-2"
            />
          </div>
        )}

          <div>
            <label className="block text-sm text-gray-700 mb-1">Main Image</label>
            <input
              type="file"
              onChange={(e) => setMainImage(e.target.files[0])}
              className="border px-3 py-2 w-full rounded"
              accept="image/*"
            />
            {mainImage && (
              <img
                src={URL.createObjectURL(mainImage)}
                alt="Main"
                className="h-24 w-24 object-cover rounded mt-2"
              />
            )}
          </div>

        {/* 🖼️ Old Additional Images */}
        {oldImages?.length > 0 && images.length === 0 && (
          <div>
            <p className="text-sm text-gray-600">Current Additional Images:</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {oldImages.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt="Old"
                  className="h-20 w-20 object-cover rounded"
                />
              ))}
            </div>
          </div>
        )}

          <div>
            <label className="block text-sm text-gray-700 mb-1">Additional Images</label>
            <input
              type="file"
              multiple
              onChange={(e) => setImages(Array.from(e.target.files))}
              className="border px-3 py-2 w-full rounded"
              accept="image/*"
            />
            {images?.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {images.map((file, idx) => (
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
            className={`px-4 py-2 rounded text-white ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading
              ? editCategoryMode
                ? "Updating..."
                : "Adding..."
              : editCategoryMode
                ? "Update Category"
                : "Add Category"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCategory;
