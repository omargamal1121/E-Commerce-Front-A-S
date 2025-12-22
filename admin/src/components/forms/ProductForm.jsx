import React from "react";
import FormInput from "./FormInput";
import { toast } from "react-toastify"; // Make sure react-toastify is installed and configured

const ProductForm = ({
  formData,
  handleInputChange,
  handleFileChange,
  handleSubmit,
  loading,
  subcategories,
  fitTypes,
  submitButtonText = "Add Product",
  loadingButtonText = "Adding...",
  resetForm,
  previewProducts,
}) => {
  const {
    name,
    description,
    subcategoryid,
    fitType,
    gender,
    price,
    mainImage,
    additionalImages,
    isActive,
    inStock,
    onSale,
    status,
  } = formData;

  const validateForm = () => {
    if (!name) return "Product name is required";
    if (!price) return "Price is required";
    if (!subcategoryid) return "Subcategory is required";
    if (!fitType) return "Fit type is required";
    if (!gender) return "Gender is required";
    if (!description) return "Description is required";
    if (!mainImage) return "Main image is required";
    return null;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }
    handleSubmit(e);
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow"
    >
      <h2 className="text-xl font-semibold mb-2">Product Information</h2>

      {/* Main Image Upload */}
      <div>
        <p className="mb-2">Upload Main Image</p>
        {mainImage && (
          <div className="mb-2">
            <img
              src={
                typeof mainImage === "string"
                  ? mainImage
                  : URL.createObjectURL(mainImage)
              }
              alt="Preview"
              className="w-32 h-32 object-cover rounded"
            />
          </div>
        )}
        <FormInput
          type="file"
          name="mainImage"
          value={mainImage}
          onChange={(e) => handleFileChange("mainImage", e.target.files[0])}
          accept="image/*"
          required={!mainImage}
        />
      </div>

      {/* Additional Images Upload */}
      <div>
        <p className="mb-2">Upload Additional Images</p>
        <FormInput
          type="file"
          name="additionalImages"
          value={additionalImages}
          onChange={(e) =>
            handleFileChange("additionalImages", Array.from(e.target.files))
          }
          multiple
          accept="image/*"
        />
      </div>

      {/* Basic Product Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Product Name"
          name="name"
          value={name}
          onChange={handleInputChange}
          placeholder="Enter product name"
          required
        />

        <FormInput
          label="Price"
          type="number"
          name="price"
          value={price}
          onChange={handleInputChange}
          placeholder="Enter price"
          min="0"
          step="0.01"
          required
        />

        <FormInput
          label="Subcategory"
          type="select"
          name="subcategoryid"
          value={subcategoryid}
          onChange={handleInputChange}
          options={subcategories}
          placeholder="Select Subcategory"
          required
        />

        <FormInput
          label="Fit Type"
          type="select"
          name="fitType"
          value={fitType}
          onChange={handleInputChange}
          options={fitTypes}
          placeholder="Select Fit Type"
          required
        />

        <FormInput
          label="Gender"
          type="select"
          name="gender"
          value={gender}
          onChange={handleInputChange}
          options={[
            { id: "1", name: "Male" },
            { id: "2", name: "Female" },
            { id: "3", name: "Both" },
          ]}
          placeholder="Select Gender"
          required
        />
      </div>

      {/* Description */}
      <FormInput
        label="Description"
        type="textarea"
        name="description"
        value={description}
        onChange={handleInputChange}
        placeholder="Enter product description"
        required
      />

      {/* Product Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormInput
          label="Status"
          type="select"
          name="status"
          value={status || (isActive ? "active" : "inactive")}
          onChange={(e) => {
            const newStatus = e.target.value;
            const newIsActive = newStatus === "active";

            const syntheticEvent = {
              target: {
                name: "isActive",
                type: "checkbox",
                checked: newIsActive,
              },
            };

            handleInputChange(e);
            handleInputChange(syntheticEvent);
          }}
          options={[
            { id: "active", name: "Active" },
            { id: "inactive", name: "Inactive" },
          ]}
          placeholder="Select Status"
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="inStock"
            name="inStock"
            checked={inStock}
            onChange={(e) => {
              handleInputChange(e);
              if (
                e.target.checked &&
                (!formData.quantity || formData.quantity === 0)
              ) {
                const syntheticEvent = {
                  target: { name: "quantity", value: "1" },
                };
                handleInputChange(syntheticEvent);
              }
            }}
            className="mr-2"
          />
          <label
            htmlFor="inStock"
            className="text-sm font-medium text-gray-700"
          >
            In Stock
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="onSale"
            name="onSale"
            checked={onSale}
            onChange={handleInputChange}
            className="mr-2"
          />
          <label htmlFor="onSale" className="text-sm font-medium text-gray-700">
            On Sale
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 w-full mt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-black text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? loadingButtonText : submitButtonText}
        </button>

        {resetForm && (
          <button
            type="button"
            onClick={resetForm}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
          >
            Reset Form
          </button>
        )}

        {previewProducts && (
          <button
            type="button"
            onClick={previewProducts}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
          >
            Preview Products
          </button>
        )}
      </div>
    </form>
  );
};

export default ProductForm;
