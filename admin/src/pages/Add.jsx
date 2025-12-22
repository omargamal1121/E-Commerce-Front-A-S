import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import ProductForm from "../components/forms/ProductForm";

const Add = ({ token }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const editId = searchParams.get("edit");
  const [loading, setLoading] = useState(false);

  // Helper: extract detailed API error messages
  const extractApiErrors = (err, fallbackMessage) => {
    // Check for responseBody structure from the user's example
    const rb = err?.response?.data?.responseBody;

    // 1. Check for messages array in errors object
    if (rb?.errors?.messages && Array.isArray(rb.errors.messages) && rb.errors.messages.length > 0) {
      return rb.errors.messages.join("\n");
    }

    // 2. Check for other common error structures
    const modelState = rb?.errors?.modelState || rb?.errors?.ModelState || rb?.errors?.details;
    if (modelState && typeof modelState === "object") {
      const msgs = [];
      Object.values(modelState).forEach((v) => {
        if (Array.isArray(v)) msgs.push(...v);
        else if (typeof v === "string") msgs.push(v);
      });
      if (msgs.length) return msgs.join("\n");
    }

    // 3. Fallbacks
    return (
      rb?.message ||
      err?.response?.data?.message ||
      err?.message ||
      fallbackMessage ||
      "Operation failed"
    );
  };

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subcategoryid: "",
    fitType: "",
    gender: "",
    price: "",
    mainImage: null,
    additionalImages: [],
    isActive: true,
    inStock: true,
    onSale: false,
    color: "",
    size: "",
    quantity: "",
    material: "",
    careInstructions: "",
    shippingInfo: ""
  });

  // Store subcategories fetched from API
  const [subcategories, setSubcategories] = useState([]);

  // Fit Types (static list)
  const fitTypes = [
    { id: 1, name: "Slim" },
    { id: 2, name: "Regular" },
    { id: 3, name: "Oversized" },
  ];

  // Fetch subcategories on mount
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const subs = await API.subcategories.getAll(token);
        console.log("📦 Subcategories response:", subs);
        setSubcategories(subs);
      } catch (err) {
        console.error("❌ Failed to fetch subcategories:", err);
        toast.error("Failed to load subcategories");
      }
    };

    fetchSubcategories();
  }, [token]);

  // Prefill form when editing
  useEffect(() => {
    const loadForEdit = async () => {
      if (!editId) return;
      try {
        const res = await API.products.getById(editId, token);
        const p = res?.responseBody?.data;
        if (!p) return;
        setFormData((prev) => ({
          ...prev,
          name: p.name || "",
          description: p.description || "",
          subcategoryid: p.subCategoryId || p.subcategoryid || "",
          fitType: p.fitType?.toString() || "",
          gender: p.gender?.toString() || "",
          price: p.price?.toString() || "",
          isActive: p.isActive ?? true,
          // keep images fields empty; edits won't re-upload unless changed
        }));
      } catch (e) {
        console.error("Failed to load product for edit", e);
        toast.error("Failed to load product for update");
      }
    };
    loadForEdit();
  }, [editId, token]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Handle file changes
  const handleFileChange = (fieldName, files) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Extract product data
      const productData = {
        name: formData.name,
        description: formData.description,
        subcategoryid: Number(formData.subcategoryid),
        fitType: Number(formData.fitType),
        gender: Number(formData.gender),
        price: Number(formData.price),
        color: formData.color,
        size: formData.size,
        quantity: formData.quantity ? Number(formData.quantity) : undefined,
        material: formData.material,
        careInstructions: formData.careInstructions,
        shippingInfo: formData.shippingInfo,
        isActive: formData.isActive,
        inStock: formData.inStock,
        onSale: formData.onSale
      };

      console.log("📤 Product Data Sent:", JSON.stringify(productData, null, 2));
      let productId = editId;
      if (editId) {
        // Update existing product
        await API.products.update(editId, productData, token);
        productId = editId;
      } else {
        // 2. Create the product
        const productRes = await API.products.create(productData, token);
        console.log("📥 Full Product Response:", productRes);
        productId = productRes.responseBody?.data?.id;
        if (!productId) throw new Error("❌ Product ID not returned from API.");
        console.log("✅ Extracted Product ID:", productId);
      }

      // 3. Upload main image
      if (!editId && formData.mainImage) {
        try {
          const mainImgRes = await API.images.uploadMain(
            productId,
            formData.mainImage,
            token
          );
          console.log("📤 Main image uploaded!", mainImgRes);

          const imageUrl = mainImgRes.responseBody?.data?.url;
          if (imageUrl) {
            console.log("🖼️ Main image URL:", imageUrl);
          }
        } catch (err) {
          console.error("❌ Error uploading main image:", err);
          toast.warning("⚠️ Product created but main image upload failed");
        }
      }

      // 4. Upload additional images
      if (!editId && formData.additionalImages && formData.additionalImages.length > 0) {
        try {
          await API.images.uploadAdditional(
            productId,
            formData.additionalImages,
            token
          );
          console.log("📤 Additional images uploaded!");
        } catch (err) {
          console.error("❌ Error uploading additional images:", err);
          toast.warning("⚠️ Product created but some additional images failed");
        }
      }

      // 5. Success message
      toast.success(editId ? "✅ Product updated successfully!" : "🎉 Product added successfully!");

      // Ask if user wants to add variants
      if (!editId) {
        const addVariants = window.confirm(
          "Do you want to add variants for this product?"
        );
        if (addVariants) {
          navigate(`/products/${productId}/variants`);
          return; // Skip resetForm if navigating away
        }
      }

      resetForm();
    } catch (err) {
      console.error("❌ Error adding product:", err.response?.data || err.message);
      const msg = extractApiErrors(err, "Failed to add product");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewProducts = () => {
    navigate("/products");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      subcategoryid: "",
      fitType: "",
      gender: "",
      price: "",
      mainImage: null,
      additionalImages: [],
      isActive: true,
      inStock: true,
      onSale: false,
      color: "",
      size: "",
      quantity: "",
      material: "",
      careInstructions: "",
      shippingInfo: ""
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">{editId ? "Update Product" : "Add New Product"}</h2>

      <ProductForm
        formData={formData}
        handleInputChange={handleInputChange}
        handleFileChange={handleFileChange}
        handleSubmit={handleSubmit}
        loading={loading}
        subcategories={subcategories}
        fitTypes={fitTypes}
        submitButtonText={editId ? "Update Product" : "Add Product"}
        loadingButtonText={editId ? "Updating..." : "Adding..."}
        resetForm={resetForm}
        previewProducts={handlePreviewProducts}
      />
    </div>
  );
};

export default Add;
