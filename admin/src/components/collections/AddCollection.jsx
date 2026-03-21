import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";

const AddCollection = ({
  token,
  editCollectionMode = false,
  editCollectionId = null,
  fetchCollections,
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
    if (!editCollectionMode) {
      setName("");
      setDescription("");
      setDisplayOrder(1);
      setImages([]);
      setMainImage(null);
      setOldImages([]);
      setOldMainImage(null);
      return;
    }

    const fetchCollectionDetails = async () => {
      if (editCollectionMode && editCollectionId && token) {
        try {
          const res = await axios.get(
            `${backendUrl}/api/Collection/${editCollectionId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const col = res.data?.responseBody?.data || res.data?.data || res.data;
          setName(col.name || "");
          setDescription(col.description || "");
          setDisplayOrder(col.displayOrder || 1);

          if (col.images?.length > 0) {
            const normalizedImages = col.images.map(img => ({
              ...img,
              url: img.url?.startsWith("http") ? img.url : `${backendUrl}/${img.url}`
            }));
            setOldImages(normalizedImages.filter((img) => !img.isMain));
            setOldMainImage(normalizedImages.find((img) => img.isMain));
          }
        } catch (err) {
          console.error("❌ Error fetching collection details:", err);
          toast.error("Failed to load node intelligence");
        }
      }
    };

    fetchCollectionDetails();
  }, [editCollectionMode, editCollectionId, token]);

  const removeOldImage = async (imgId, isMain = false) => {
    if (!editCollectionId) return;
    if (!window.confirm("Permanently delete this visual asset?")) return;

    try {
      await axios.delete(
        `${backendUrl}/api/Collection/${editCollectionId}/images/${imgId}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "text/plain" } }
      );
      toast.success("Image removed");
      if (isMain) {
        setOldMainImage(null);
      } else {
        setOldImages(prev => prev.filter(img => img.id !== imgId));
      }
    } catch {
      toast.error("Failed to delete image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("Authentication required");

    const cleanedName = cleanText(name);
    const cleanedDescription = cleanText(description);

    if (!cleanedName || cleanedName.length < 2) return toast.error("Identity name too short");

    setLoading(true);
    try {
      const body = {
        name: cleanedName,
        description: cleanedDescription,
        displayOrder: Number(displayOrder),
      };

      let res;
      let collectionId;

      if (editCollectionMode && editCollectionId) {
        res = await axios.put(
          `${backendUrl}/api/Collection/${editCollectionId}`,
          body,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json-patch+json",
              Accept: "text/plain",
            },
          }
        );
        collectionId = editCollectionId;
      } else {
        res = await axios.post(`${backendUrl}/api/Collection`, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json-patch+json",
            Accept: "text/plain",
          },
        });
        collectionId = res.data?.responseBody?.data?.id || res.data?.data?.id || res.data?.id;
      }

      if (!collectionId) throw new Error("ID synchronization failed");

      // Upload Main Image
      if (mainImage) {
        const mainForm = new FormData();
        mainForm.append("Image", mainImage);
        await axios.put(
          `${backendUrl}/api/Collection/${collectionId}/main-image`,
          mainForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Upload Supplementary Matrix
      if (images.length > 0) {
        const addForm = new FormData();
        images.forEach((file) => addForm.append("Images", file));
        await axios.post(
          `${backendUrl}/api/Collection/${collectionId}/images`,
          addForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success(editCollectionMode ? "Repository evolution complete! ✨" : "New collection published! 🚀");
      if (typeof fetchCollections === "function") await fetchCollections();
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-top-4 duration-500 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          {editCollectionMode ? "Refine Collection" : "Initialize New Collection"}
        </h2>
        <p className="text-gray-500 font-medium text-sm">
          {editCollectionMode ? "Update the structural properties of this aggregate" : "Define a new specialized product grouping"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Core Schematic Details */}
        <div className="lg:col-span-12 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Identity Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-rose-50 focus:border-rose-400 transition-all font-bold text-gray-700"
                  placeholder="e.g. Winter Nexus 2024"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Display Rank</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-rose-50 focus:border-rose-400 transition-all font-bold text-gray-700"
                  min="1"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Narrative Insight</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-rose-50 focus:border-rose-400 transition-all font-medium text-gray-600 min-h-[120px]"
                placeholder="Describe the specialized nature of this grouping..."
                required
              />
            </div>
          </div>
        </div>

        {/* Visual Strategy Section */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Visual */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Hero Visual</label>
              <p className="text-[11px] text-gray-400 ml-1 mt-0.5 font-bold">The primary identifier for this collection</p>
            </div>

            <div className="relative group">
              <label className="flex flex-col items-center justify-center w-full aspect-[16/9] border-2 border-dashed border-gray-100 rounded-3xl cursor-pointer hover:border-rose-400 hover:bg-rose-50/20 transition-all overflow-hidden bg-gray-50/50">
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
                    <span className="text-sm font-bold">Mount hero visual</span>
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
                <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-auto">
                  <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase px-4 py-2 rounded-2xl border border-white/30 pointer-events-none">Click to change</span>
                  {oldMainImage && !mainImage && (
                    <button
                      type="button"
                      onClick={() => removeOldImage(oldMainImage.id, true)}
                      className="bg-rose-600 text-white text-[10px] font-black uppercase px-4 py-2 rounded-2xl border border-rose-500 hover:bg-rose-700 transition-all shadow-xl active:scale-90"
                    >
                      Purge Asset
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Supporting Matrix */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Supporting Gallery</label>
              <p className="text-[11px] text-gray-400 ml-1 mt-0.5 font-bold">Secondary angles or thematic shots</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {oldImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 group">
                  <img src={img.url} className="w-full h-full object-cover" alt="Gallery item" />
                  <button
                    type="button"
                    onClick={() => removeOldImage(img.id)}
                    className="absolute top-2 right-2 p-2 bg-rose-600/90 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-rose-700 active:scale-90"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-gray-900 text-white text-[7px] font-black uppercase rounded-full">Saved</div>
                </div>
              ))}
              {images.map((file, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 group">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Gallery item" />
                  <button
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 p-2 bg-rose-600/90 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-rose-700 active:scale-90"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-[7px] font-black uppercase rounded-full">New</div>
                </div>
              ))}
              <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer hover:border-rose-300 transition-all">
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

        {/* Action Controls */}
        <div className="lg:col-span-12 flex items-center justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={resetForm}
            className="px-8 py-4 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
          >
            Discard Changes
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-[24px] text-sm font-black shadow-xl shadow-rose-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deploying...
              </>
            ) : (
              editCollectionMode ? "Push Evolution" : "Validate & Publish"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCollection;
