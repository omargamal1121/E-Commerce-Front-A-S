import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";

const ProductDiscountManager = ({ productId, token }) => {
  const [product, setProduct] = useState(null);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper: extract detailed API error messages
  const extractApiErrors = (err, fallbackMessage) => {
    const rb = err?.response?.data?.responseBody;
    const msgs = [];
    if (Array.isArray(rb?.errors?.messages) && rb.errors.messages.length) {
      msgs.push(...rb.errors.messages);
    }
    const modelState = rb?.errors?.modelState || rb?.errors?.ModelState || rb?.errors?.details;
    if (modelState && typeof modelState === "object") {
      Object.values(modelState).forEach((v) => {
        if (Array.isArray(v)) msgs.push(...v);
        else if (typeof v === "string") msgs.push(v);
      });
    }
    if (msgs.length) return msgs.join("\n");
    return (
      rb?.message ||
      err?.response?.data?.message ||
      err?.message ||
      fallbackMessage ||
      "Operation failed"
    );
  };

  // Fetch product details and discount info
  useEffect(() => {
    if (!productId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get product details
        const productResponse = await API.products.getById(productId, token);
        setProduct(productResponse.responseBody.data);
        
        // Get discount info
        try {
          const discountResponse = await API.products.getDiscount(productId, token);
          setDiscountInfo(discountResponse.responseBody.data);
        } catch (error) {
          // If 404, it means no discount is applied
          if (error.response && error.response.status === 404) {
            setDiscountInfo(null);
          } else {
            const msg = extractApiErrors(error, "Failed to load discount info");
            toast.error(msg);
          }
        }
        
        // Get available discounts
        try {
          const discountsResponse = await API.discounts.list({}, token);
          setAvailableDiscounts(discountsResponse.responseBody?.data || []);
        } catch (error) {
          const msg = extractApiErrors(error, "Failed to load discounts list");
          toast.error(msg);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        const msg = extractApiErrors(error, "Failed to load data");
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, token]);

  // Apply discount to product
  const handleApplyDiscount = async () => {
    if (selectedDiscountId === null || selectedDiscountId === undefined) {
      toast.error("Please select a discount");
      return;
    }

    setLoading(true);
    try {
      await API.products.applyDiscount(productId, selectedDiscountId, token);
      toast.success("Discount applied successfully");
      
      // Refresh discount info
      const response = await API.products.getDiscount(productId, token);
      setDiscountInfo(response.responseBody.data);
    } catch (error) {
      console.error("Error applying discount:", error);
      const msg = extractApiErrors(error, "Failed to apply discount");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Remove discount from product
  const handleRemoveDiscount = async () => {
    setLoading(true);
    try {
      // Use DELETE endpoint to remove discount
      await API.products.removeDiscount(productId, token);
      toast.success("Discount removed");
      setDiscountInfo(null);
    } catch (error) {
      console.error("Error removing discount:", error);
      const msg = extractApiErrors(error, "Failed to remove discount");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !product) {
    return <div className="p-4">Loading...</div>;
  }

  if (!product) {
    return <div className="p-4">Select a product to manage discounts.</div>;
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-medium mb-4">Manage Discount for {product.name}</h3>
      
      {/* Current Discount */}
      <div className="mb-6 p-4 border rounded">
        <h4 className="text-md font-medium mb-2">Current Discount</h4>
        {loading ? (
          <p>Loading...</p>
        ) : discountInfo ? (
          <div>
            <p><strong>Name:</strong> {discountInfo.name}</p>
            <p><strong>Discount:</strong> {discountInfo.discountPercent}%</p>
            <p><strong>Status:</strong> {discountInfo.isActive ? "Active" : "Inactive"}</p>
            
            <button
              onClick={handleRemoveDiscount}
              disabled={loading}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Removing..." : "Remove Discount"}
            </button>
          </div>
        ) : (
          <p>No discount applied to this product.</p>
        )}
      </div>
      
      {/* Apply New Discount */}
      <div className="p-4 border rounded">
        <h4 className="text-md font-medium mb-2">Apply New Discount</h4>
        
        {availableDiscounts.length === 0 ? (
          <p>No discounts available. Create discounts first.</p>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Discount
              </label>
              <select
                value={selectedDiscountId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDiscountId(val === "" ? null : Number(val));
                }}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select a discount --</option>
                {availableDiscounts.map((discount) => (
                  <option key={discount.id} value={discount.id}>
                    {discount.name} ({discount.discountPercent}%)
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleApplyDiscount}
              disabled={selectedDiscountId === null || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Applying..." : "Apply Discount"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDiscountManager;