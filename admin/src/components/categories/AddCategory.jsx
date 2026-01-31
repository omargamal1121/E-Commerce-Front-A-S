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

  const [oldImages, setOldImages] = useState([]);
  const [oldMainImage, setOldMainImage] = useState(null);

  const navigate = useNavigate();

  const cleanText = (text) => text?.replace(/\s+/g, " ").trim();

  const resetForm = () => {
    setName("");
    setDescription("");
    setDisplayOrder(1);
    setImages([]);
    setMainImage(null);
    setOldImages([]);
    setOldMainImage(null);
    if (setActiveTab) setActiveTab("list");
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("You must log in first!");

    const cleanedName = cleanText(name);
    const cleanedDescription = cleanText(description);
    const cleanedOrder = Math.max(1, Number(displayOrder));

    if (!cleanedName || cleanedName.length < 2)
      return toast.error("Name is too short");

    setLoading(true);
    try {
      const body = {
        name: cleanedName,
        description: cleanedDescription,
        displayOrder: cleanedOrder,
      };

      if (editCategoryMode && editCategoryId) {
        body.imageIds = [
          ...(oldMainImage ? [oldMainImage.id] : []),
          ...(oldImages?.map(img => img.id) || [])
        ];
      }

      let res;
      if (editCategoryMode && editCategoryId) {
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

      // Upload Additional Images
      if (images?.length > 0) {
        const imgForm = new FormData();
        images.forEach((file) => imgForm.append("Images", file));
        await axios.post(
          `${backendUrl}/api/categories/${categoryId}/images`,
          imgForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Upload Main Image
      if (mainImage) {
        const mainForm = new FormData();
        mainForm.append("Image", mainImage);
        await axios.post(
          `${backendUrl}/api/categories/${categoryId}/images/main`,
          mainForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success(editCategoryMode ? "Changes saved successfully! ✨" : "New category created! 🚀");

      if (typeof fetchCategories === "function") await fetchCategories();

      resetForm();
    } catch (error) {
      console.error("❌ Error saving category:", error);
      toast.error("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-top-4 duration-500 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          {editCategoryMode ? "Refine Category" : "Define New Category"}
        </h2>
        <p className="text-gray-500 font-medium">
          {editCategoryMode ? "Update your category details and visuals" : "Set up a new category to organize your inventory"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-12 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Identity Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-bold text-gray-700"
                  placeholder="e.g. Summer Essentials"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Display Priority</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-bold text-gray-700"
                  min="1"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Narrative Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium text-gray-600 min-h-[120px]"
                placeholder="Describe the essence of this category..."
              />
            </div>
          </div>
        </div>

        {/* Visual Assets Section */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Visual */}
          <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Hero Visual</label>
                <p className="text-[11px] text-gray-400 ml-1 mt-0.5 font-bold">Primary display image for this category</p>
              </div>
            </div>

            <div className="relative group">
              <label className="flex flex-col items-center justify-center w-full aspect-[16/9] border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all overflow-hidden bg-gray-50/50">
                {(mainImage || oldMainImage) ? (
                  <img
                    src={mainImage ? URL.createObjectURL(mainImage) : oldMainImage.url}
                    className="w-full h-full object-cover"
                    alt="Main Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-bold">Drop main image here</span>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setMainImage(e.target.files[0])}
                  accept="image/*"
                />
              </label>
              {(mainImage || oldMainImage) && (
                <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase px-4 py-2 rounded-2xl border border-white/30">Click to change</span>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Gallery */}
          <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Support Gallery</label>
                <p className="text-[11px] text-gray-400 ml-1 mt-0.5 font-bold">Additional images for detail views</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Previews of existing/new images */}
              {[...oldImages, ...images].slice(0, 5).map((img, idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                  <img
                    src={img instanceof File ? URL.createObjectURL(img) : img.url}
                    className="w-full h-full object-cover"
                    alt="Gallery item"
                  />
                </div>
              ))}

              <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer hover:border-blue-300 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setImages([...images, ...Array.from(e.target.files)])}
                  accept="image/*"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="lg:col-span-12 flex items-center justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-8 py-4 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Discard Changes
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] text-sm font-black shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              editCategoryMode ? "Update Repository" : "Publish Category"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCategory;
