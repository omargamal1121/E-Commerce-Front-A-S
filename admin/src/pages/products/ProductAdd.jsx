import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import API from "../../services/api";
import { useTranslation } from "react-i18next";

const ProductAdd = ({ token }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const editId = searchParams.get("edit");
  const [loading, setLoading] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [currentSubcategoryName, setCurrentSubcategoryName] = useState("");
  const [collections, setCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);

  const [formData, setFormData] = useState({
    name: "", description: "", subcategoryid: "", fitType: "", gender: "", price: "",
    isActive: true, inStock: true, onSale: false, material: "", careInstructions: "", shippingInfo: ""
  });

  const [images, setImages] = useState({ main: null, additional: [] });
  const [previews, setPreviews] = useState({ main: null, additional: [] });

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/subcategories`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            // Don't send isActive and includeDeleted to get all subcategories
          }
        });
        const subcategoriesData = response.data?.responseBody?.data || [];
        setSubcategories(subcategoriesData);
      } catch (e) { 
        console.error("Failed to load subcategories:", e);
        toast.error(t("failedToLoadCategories")); 
      }
    })();
  }, [token, t]);

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/Collection`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const collectionsData = response.data?.responseBody?.data || [];
        setCollections(collectionsData);
      } catch (e) { 
        console.error("Failed to load collections:", e);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await API.products.getById(editId, token);
        const p = res?.responseBody?.data;
        if (p) {
          const genderMap = { "Man": "0", "Woman": "1", "Kids": "2", "Uni": "3", "Both": "3" };

          setFormData({
            name: p.name || "", 
            description: p.description || "", 
            subcategoryid: p.subCategoryId?.toString() || "",
            fitType: p.fitType || "", 
            gender: genderMap[p.gender] || p.gender?.toString() || "", 
            price: p.price?.toString() || "",
            isActive: p.isActive ?? true, 
            inStock: p.inStock ?? true, 
            onSale: p.onSale ?? false,
            material: p.material || "", 
            careInstructions: p.careInstructions || "", 
            shippingInfo: p.shippingInfo || ""
          });
          
          // Set the current subcategory name for display
          setCurrentSubcategoryName(p.subCategoryName || "");

          // Set existing images for preview with backend URL resolution
          const normalizeUrl = (u) => u?.startsWith("http") ? u : (u ? `${import.meta.env.VITE_BACKEND_URL}/${u}` : null);
          
          const mainImg = p.images?.find(i => i.isMain);
          const extraImgs = p.images?.filter(i => !i.isMain) || [];
          setPreviews({
            main: normalizeUrl(mainImg?.url),
            additional: extraImgs.map(img => ({ 
              url: normalizeUrl(img.url), 
              id: img.id,
              isNew: false 
            }))
          });

          // Load existing collections for this product
          try {
            const collectionsRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/Products/${editId}/collections`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const productCollections = collectionsRes.data?.responseBody?.data || [];
            setSelectedCollections(productCollections.map(c => c.id));
          } catch (e) {
            console.error("Failed to load product collections:", e);
          }
        }
      } catch (e) { toast.error(t("failedToLoadProductDetails")); }
    })();
  }, [editId, token]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // Custom Searchable Dropdown Component
  const SearchableSubcategoryDropdown = ({ value, onChange, subcategories, token, currentSubcategoryName, setCurrentSubcategoryName }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredSubcategories, setFilteredSubcategories] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
          setSearchTerm("");
          setFilteredSubcategories(subcategories);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [subcategories]);

    // Focus search input when dropdown opens and load initial data
    useEffect(() => {
      if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus();
        // Load initial subcategories when dropdown opens
        setFilteredSubcategories(subcategories);
      }
    }, [isOpen, subcategories]);

    // Debounced search function
    const debouncedSearch = useCallback((term) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      setIsSearching(true);

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/subcategories`, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              key: term || undefined,
            }
          });
          const data = response.data?.responseBody?.data || [];
          setFilteredSubcategories(data);
        } catch (error) {
          console.error("Search failed:", error);
          setFilteredSubcategories([]);
        } finally {
          setIsSearching(false);
        }
      }, 450); // 450ms debounce
    }, [token]);

    // Handle search input changes
    const handleSearchChange = (e) => {
      const term = e.target.value;
      setSearchTerm(term);
      debouncedSearch(term);
    };

    // Handle subcategory selection
    const handleSelect = (subcategory) => {
      onChange(subcategory.id);
      setCurrentSubcategoryName(subcategory.name); // Update the displayed name
      setIsOpen(false);
      setSearchTerm("");
    };

    // Get selected subcategory name
    const selectedSubcategory = subcategories.find(s => s.id === value);
    const displaySubcategoryName = selectedSubcategory ? selectedSubcategory.name : currentSubcategoryName || "";

    return (
      <div className="relative" ref={dropdownRef}>
        {/* Main dropdown trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-8 py-4 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-bold text-left flex items-center justify-between"
        >
          <span className={displaySubcategoryName ? "text-gray-900" : "text-gray-400"}>
            {displaySubcategoryName || "Select Subcategory"}
          </span>
          <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown panel */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-[24px] shadow-xl max-h-[300px] overflow-hidden">
            {/* Search input */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search subcategories..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all font-medium"
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[220px] overflow-y-auto">
              {isSearching ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm">Searching...</p>
                </div>
              ) : filteredSubcategories.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-sm">No subcategories found</p>
                </div>
              ) : (
                filteredSubcategories.map((subcategory) => (
                  <button
                    key={subcategory.id}
                    type="button"
                    onClick={() => handleSelect(subcategory)}
                    className="w-full px-6 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{subcategory.name}</div>
                    {subcategory.categoryName && (
                      <div className="text-xs text-gray-500 mt-1">{subcategory.categoryName}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImages(prev => ({ ...prev, main: file }));
      setPreviews(prev => ({ ...prev, main: URL.createObjectURL(file) }));
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => ({ ...prev, additional: [...prev.additional, ...files] }));
    const newPreviews = files.map(file => ({ url: URL.createObjectURL(file), isNew: true }));
    setPreviews(prev => ({ ...prev, additional: [...prev.additional, ...newPreviews] }));
  };

  const removeImage = async (imgId, isNew, idx) => {
    if (isNew) {
      setImages(prev => ({
        ...prev,
        additional: prev.additional.filter((_, i) => i !== idx)
      }));
      setPreviews(prev => ({
        ...prev,
        additional: prev.additional.filter((_, i) => i !== idx)
      }));
      return;
    }

    if (!editId) return;
    if (!window.confirm(t("deleteImagePermanently"))) return;

    try {
      await API.images.delete(editId, imgId, token);
      toast.success(t("imageDeleted"));
      setPreviews(prev => ({
        ...prev,
        additional: prev.additional.filter(img => img.id !== imgId)
      }));
    } catch {
      toast.error(t("failedDeleteImage"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const productPayload = { ...formData, subcategoryid: Number(formData.subcategoryid), gender: Number(formData.gender), price: Number(formData.price) };

      let productId = editId;
      if (editId) {
        await API.products.update(editId, productPayload, token);
      } else {
        const res = await API.products.create(productPayload, token);
        productId = res.responseBody?.data?.id;
      }

      if (productId && images.main) await API.images.uploadMain(productId, images.main, token);
      if (productId && images.additional.length) await API.images.uploadAdditional(productId, images.additional, token);

      // Handle collections - add to each selected collection
      if (productId && selectedCollections.length > 0) {
        for (const collectionId of selectedCollections) {
          try {
            const formData = new FormData();
            formData.append('ProductIds', productId.toString());
            
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/Collection/${collectionId}/products`, 
              formData,
              { 
                headers: { 
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data'
                } 
              }
            );
          } catch (e) {
            console.error(`Failed to add to collection ${collectionId}:`, e);
          }
        }
        toast.success(t("addedToCollection"));
      }

      toast.success(editId ? t("productUpdated") : t("productCreated"));
      navigate("/products");
    } catch (err) {
      // Extract the actual server message to give the admin useful feedback
      const serverMsg =
        err?.response?.data?.responseBody?.message ||
        err?.response?.data?.message ||
        (err?.response?.data?.errors && Object.values(err.response.data.errors).flat()[0]) ||
        err?.message ||
        t("failedToSaveProduct");
      toast.error(serverMsg);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-6 duration-700">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Product Details Area */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col gap-10">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-emerald-500 rounded-full" />
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{t("productDetails")}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{t("productName")}</label>
                <input
                  name="name" value={formData.name} onChange={handleInputChange} required
                  className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-8 py-4 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-bold text-lg"
                  placeholder={t("enterProductName")}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{t("description")}</label>
                <textarea
                  name="description" value={formData.description} onChange={handleInputChange} required
                  className="w-full bg-gray-50 border border-gray-100 rounded-[32px] px-8 py-6 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-medium text-gray-600 min-h-[150px]"
                  placeholder={t("enterProductDescription")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{t("price")}</label>
                <input
                  name="price" type="number" value={formData.price} onChange={handleInputChange} required
                  className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-8 py-4 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-black text-xl"
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{t("subcategory")}</label>
                <SearchableSubcategoryDropdown
                  value={formData.subcategoryid}
                  onChange={(value) => setFormData(prev => ({ ...prev, subcategoryid: value }))}
                  subcategories={subcategories}
                  token={token}
                  currentSubcategoryName={currentSubcategoryName}
                  setCurrentSubcategoryName={setCurrentSubcategoryName}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{t("fitType")}</label>
                <input
                  name="fitType" value={formData.fitType} onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-8 py-4 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-bold"
                  placeholder="Enter fit type (e.g. Regular, Slim)"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{t("gender")}</label>
                <select
                  name="gender" value={formData.gender} onChange={handleInputChange} required
                  className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-8 py-4 outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 transition-all font-bold"
                >
                  <option value="">{t("selectGenderOption")}</option>
                  <option value="0">{t("man")}</option>
                  <option value="1">{t("woman")}</option>
                  <option value="2">{t("kids")}</option>
                  <option value="3">{t("uni")}</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{t("addToCollection")}</label>
                <div className="grid grid-cols-2 gap-3">
                  {collections.map(c => (
                    <label key={c.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-6 py-4 cursor-pointer hover:bg-gray-100 transition-all border border-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedCollections.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCollections(prev => [...prev, c.id]);
                          } else {
                            setSelectedCollections(prev => prev.filter(id => id !== c.id));
                          }
                        }}
                        className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-gray-700 text-sm">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Images & Settings */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Main Visual Uplink */}
          <div className="bg-emerald-900 p-10 rounded-[48px] shadow-2xl shadow-emerald-900/20 text-white flex flex-col gap-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">{t("primaryImage")}</h4>
            <div className="relative aspect-square rounded-[40px] bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group">
              {previews.main ? (
                <img src={previews.main} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="text-center p-6">
                  <div className="text-4xl mb-4 opacity-30">📸</div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t("uploadMainPhoto")}</p>
                </div>
              )}
              <input type="file" onChange={handleMainImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
              <div className="absolute bottom-6 right-6 p-4 bg-white text-emerald-900 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              </div>
            </div>
          </div>

          {/* Gallery Assets */}
          <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm flex flex-col gap-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-2">{t("galleryImages")}</h4>
            <div className="grid grid-cols-3 gap-3">
              {previews.additional.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-[24px] overflow-hidden bg-gray-50 border border-gray-100 shadow-inner group">
                  <img src={img.url || img} className="w-full h-full object-cover" alt="" />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id, img.isNew, idx)}
                    className="absolute top-2 right-2 p-2 bg-rose-600/90 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-rose-700 active:scale-90"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {img.isNew && <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-[7px] font-black uppercase rounded-full">New</div>}
                </div>
              ))}
              <div className="relative aspect-square rounded-[24px] bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer group">
                <span className="text-2xl opacity-20 group-hover:opacity-100 group-hover:scale-125 transition-all">➕</span>
                <input type="file" multiple onChange={handleAdditionalImagesChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[32px] text-sm font-black uppercase tracking-widest transition-all shadow-2xl shadow-emerald-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {editId ? t("updateProduct") : t("saveProduct")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductAdd;
