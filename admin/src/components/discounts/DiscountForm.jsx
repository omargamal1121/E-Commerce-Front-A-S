import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";

const DiscountForm = ({
  formData,
  handleInputChange,
  handleSubmitDiscount,
  resetForm,
  editMode,
  discountLoading,
  token,
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch products when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await API.products.list({}, token);
        setProducts(response.responseBody?.data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [token]);


  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h3 className="text-lg font-medium mb-4">
        {editMode ? "Edit Discount" : "Create New Discount"}
      </h3>
      <form onSubmit={handleSubmitDiscount}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {/* Discount Percent */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Percent
            </label>
            <input
              type="number"
              name="discountPercent"
              value={formData.discountPercent}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              min="1"
              max="100"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4 col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Start Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="datetime-local"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {/* End Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="datetime-local"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          {editMode && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={discountLoading}
          >
            {discountLoading
              ? "Loading..."
              : editMode
                ? "Update Discount"
                : "Create Discount"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DiscountForm;
