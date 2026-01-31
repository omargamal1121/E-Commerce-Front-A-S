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

  const cleanText = (text) => text?.replace(/\s+/g, " ").trim();

  const resetForm = () => {
    setSubCategoryName("");
    setSubCategoryDescription("");
    setSubCategoryDisplayOrder(1);
    setSubCategoryImages([]);
    setSubCategoryMainImage(null);
    setParentCategoryId("");
    if (setActiveTab) setActiveTab("sub-list");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("Authentication required");
    if (!parentCategoryId) return toast.error("Segment must have a parent node");

    const name = cleanText(subCategoryName);
    const description = cleanText(subCategoryDescription);

    if (!name || name.length < 2) return toast.error("Identity name too short");

    setLoading(true);

    try {
      const body = {
        name,
        description,
        categoryId: Number(parentCategoryId),
      };

      let res;
      if (editSubCategoryMode && editSubCategoryId) {
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
        res = await axios.post(`${backendUrl}/api/subcategories`, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      const newId = res.data?.data?.id || res.data?.id || res.data?.responseBody?.data?.id;

      if (!newId) throw new Error("ID synchronization failed");

      // Main Visual Asset
      if (subCategoryMainImage) {
        const mainForm = new FormData();
        mainForm.append("Image", subCategoryMainImage);
        await axios.post(
          `${backendUrl}/api/subcategories/${newId}/images/main`,
          mainForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Supplementary Gallery
      if (subCategoryImages?.length > 0) {
        const addForm = new FormData();
        subCategoryImages.forEach((file) => addForm.append("Images", file));
        await axios.post(
          `${backendUrl}/api/subcategories/${newId}/images`,
          addForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success(editSubCategoryMode ? "Segment evolution complete! ✨" : "New segment published! 🚀");

      if (typeof fetchSubCategories === "function") await fetchSubCategories();
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-top-4 duration-500 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          {editSubCategoryMode ? "Refine Segment" : "Initialize New Segment"}
        </h2>
        <p className="text-gray-500 font-medium text-sm">
          {editSubCategoryMode ? "Update the structural properties of this node" : "Define a child node under a primary category"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Primary Details */}
        <div className="lg:col-span-12 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Hierarchy Parent</label>
                <select
                  value={parentCategoryId || ""}
                  onChange={(e) => setParentCategoryId(Number(e.target.value))}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-bold text-gray-700"
                  required
                >
                  <option value="">Select Root Node...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Identity Name</label>
                <input
                  value={subCategoryName || ""}
                  onChange={(e) => setSubCategoryName(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-bold text-gray-700"
                  placeholder="e.g. Slim Fit Denims"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Narrative Insight</label>
              <textarea
                value={subCategoryDescription || ""}
                onChange={(e) => setSubCategoryDescription(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium text-gray-600 min-h-[120px]"
                placeholder="Describe the specialized nature of this segment..."
              />
            </div>
          </div>
        </div>

        {/* Visual Strategy Section */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Visual */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Headshot Visual</label>
              <p className="text-[11px] text-gray-400 ml-1 mt-0.5 font-bold">The primary identifier for this segment</p>
            </div>

            <div className="relative group">
              <label className="flex flex-col items-center justify-center w-full aspect-[16/9] border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all overflow-hidden bg-gray-50/50">
                {subCategoryMainImage ? (
                  <img
                    src={URL.createObjectURL(subCategoryMainImage)}
                    className="w-full h-full object-cover"
                    alt="Main Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-bold">Mount focal image</span>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setSubCategoryMainImage(e.target.files[0])}
                  accept="image/*"
                />
              </label>
            </div>
          </div>

          {/* Additional Visuals */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Supporting Matrix</label>
              <p className="text-[11px] text-gray-400 ml-1 mt-0.5 font-bold">Secondary angles or detail shots</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {subCategoryImages?.length > 0 && subCategoryImages.map((file, idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                  <img
                    src={URL.createObjectURL(file)}
                    className="w-full h-full object-cover"
                    alt={`Preview ${idx}`}
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
                  onChange={(e) => setSubCategoryImages(Array.from(e.target.files))}
                  accept="image/*"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Action Control */}
        <div className="lg:col-span-12 flex items-center justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-8 py-4 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Clear Data
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] text-sm font-black shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Syncing...
              </>
            ) : (
              editSubCategoryMode ? "Push Updates" : "Validate & Publish"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSubCategory;
