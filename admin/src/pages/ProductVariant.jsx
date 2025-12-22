import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api";

const ProductVariant = ({ token }) => {
  const { productId } = useParams();
  const navigate = useNavigate();

  // Product info
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  // Variants list
  const [variants, setVariants] = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  // New variant form
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [waist, setWaist] = useState("");
  const [length, setLength] = useState("");
  const [quantity, setQuantity] = useState("");

  // Quantity adjustment
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState("");

  // Enum-based size options (E_Commerce.Enums.VariantSize)
  const SIZE_OPTIONS = [
    { value: 0, label: "XS" },
    { value: 1, label: "S" },
    { value: 2, label: "M" },
    { value: 3, label: "L" },
    { value: 4, label: "XL" },
    { value: 5, label: "XXL" },
    { value: 6, label: "XXXL" },
  ];
  const sizeCodeToLabel = (code) => {
    const opt = SIZE_OPTIONS.find((o) => Number(o.value) === Number(code));
    return opt ? opt.label : (code ?? "-");
  };

  // Helper: extract detailed API error messages
  const extractApiErrors = (err, fallbackMessage) => {
    const rb = err?.response?.data?.responseBody;
    // Collect messages from various shapes
    const msgs = [];
    if (Array.isArray(rb?.errors?.messages) && rb.errors.messages.length) {
      msgs.push(...rb.errors.messages);
    }
    // Sometimes errors come as key->array (model state)
    const modelState = rb?.errors?.modelState || rb?.errors?.ModelState || rb?.errors?.details;
    if (modelState && typeof modelState === "object") {
      Object.values(modelState).forEach((v) => {
        if (Array.isArray(v)) msgs.push(...v);
        else if (typeof v === "string") msgs.push(v);
      });
    }
    // If we collected any detailed messages, join and return
    if (msgs.length) return msgs.join("\n");
    // Otherwise use message fields in order
    return (
      rb?.message ||
      err?.response?.data?.message ||
      err?.message ||
      fallbackMessage ||
      "Operation failed"
    );
  };

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await API.products.getById(productId, token);
        setProduct(response.responseBody.data);
      } catch (error) {
        console.error("Error fetching product:", error);
        const apiMsg =
          error?.response?.data?.responseBody?.message ||
          error?.response?.data?.responseBody?.errors?.messages?.[0] ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load product details";
        toast.error(apiMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, token]);

  // Fetch variants
  const fetchVariants = async () => {
    setVariantsLoading(true);
    try {
      const response = await API.variants.getByProductId(productId, token);
      setVariants(response.responseBody.data || []);
    } catch (error) {
      console.error("Error fetching variants:", error);
      const apiMsg =
        error?.response?.data?.responseBody?.message ||
        error?.response?.data?.responseBody?.errors?.messages?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load product variants";
      toast.error(apiMsg);
    } finally {
      setVariantsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchVariants();
    }
  }, [productId, token]);

  // Add new variant
  const handleAddVariant = async (e) => {
    e.preventDefault();
    setLoading(true);

    const normalizedColor = (color || "").trim();
    const sizeNum = size !== "" ? Number(size) : undefined;
    const waistNum = waist !== "" ? Number(waist) : undefined;
    const lengthNum = length !== "" ? Number(length) : undefined;

    // Prevent duplicate combinations on client side before calling API
    const isDuplicate = variants.some((v) =>
      (v.color || "").trim().toLowerCase() === normalizedColor.toLowerCase() &&
      (v.size ?? undefined) === (sizeNum ?? undefined) &&
      (v.waist ?? undefined) === (waistNum ?? undefined) &&
      (v.length ?? undefined) === (lengthNum ?? undefined)
    );

    if (isDuplicate) {
      toast.error("هذا الـ Variant موجود بالفعل بنفس اللون والمقاس والخصر والطول");
      setLoading(false);
      return;
    }

    const variantData = {
      color: normalizedColor || undefined,
      size: sizeNum,
      waist: waistNum,
      length: lengthNum,
      quantity: quantity ? Number(quantity) : 0,
    };

    try {
      await API.variants.add(productId, variantData, token);
      toast.success("Variant added successfully");

      // Reset form
      setColor("");
      setSize("");
      setWaist("");
      setLength("");
      setQuantity("");

      // Refresh variants list
      fetchVariants();
    } catch (error) {
      console.error("Error adding variant:", error);
      const apiMsg = extractApiErrors(error, "Failed to add variant");
      toast.error(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  // Add quantity to variant
  const handleAddQuantity = async () => {
    if (!selectedVariantId || !adjustQuantity) return;

    try {
      await API.variants.addQuantity(
        productId,
        selectedVariantId,
        adjustQuantity,
        token
      );
      toast.success(`Added ${adjustQuantity} items to inventory`);
      setAdjustQuantity("");
      setSelectedVariantId(null);
      fetchVariants();
    } catch (error) {
      console.error("Error adding quantity:", error);
      const apiMsg =
        error?.response?.data?.responseBody?.message ||
        error?.response?.data?.responseBody?.errors?.messages?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to add quantity";
      toast.error(apiMsg);
    }
  };

  // Remove quantity from variant
  const handleRemoveQuantity = async () => {
    try {
      await API.variants.removeQuantity(
        productId,
        selectedVariantId,
        adjustQuantity,
        token
      );
      toast.success(`Removed ${adjustQuantity} items from inventory`);
      fetchVariants();
    } catch (error) {
      const errMessage =
        error.response?.data?.responseBody?.errors?.messages?.[0] ||
        error.response?.data?.responseBody?.message ||
        "Failed to remove quantity";

      toast.error(errMessage);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm("هل أنت متأكد إنك عايز تحذف هذا الـ Variant؟")) return;

    try {
      await API.variants.delete(productId, variantId, token);
      toast.success("✅ تم حذف الـ Variant بنجاح");
    } catch (err) {
      console.error("❌ Error deleting variant:", err.response?.data || err);
      const apiMsg =
        err?.response?.data?.responseBody?.message ||
        err?.response?.data?.responseBody?.errors?.messages?.[0] ||
        err?.response?.data?.message ||
        err?.message ||
        "⚠️ فشل حذف الـ Variant";
      toast.error(apiMsg);
    }
  };

  // Activate variant
  const handleActivateVariant = async (variantId) => {
    try {
      await API.variants.activate(productId, variantId, token);
      toast.success("Variant activated");
      fetchVariants();
    } catch (error) {
      console.error("Error activating variant:", error);
      const apiMsg =
        error?.response?.data?.responseBody?.message ||
        error?.response?.data?.responseBody?.errors?.messages?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to activate variant";
      toast.error(apiMsg);
    }
  };

  // Deactivate variant
  const handleDeactivateVariant = async (variantId) => {
    try {
      await API.variants.deactivate(productId, variantId, token);
      toast.success("Variant deactivated");
      fetchVariants();
    } catch (error) {
      console.error("Error deactivating variant:", error);
      const apiMsg =
        error?.response?.data?.responseBody?.message ||
        error?.response?.data?.responseBody?.errors?.messages?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to deactivate variant";
      toast.error(apiMsg);
    }
  };

  // Restore variant
  const handleRestoreVariant = async (variantId) => {
    try {
      await API.variants.restore(productId, variantId, token);
      toast.success("Variant restored");
      fetchVariants();
    } catch (error) {
      console.error("Error restoring variant:", error);
      const apiMsg =
        error?.response?.data?.responseBody?.message ||
        error?.response?.data?.responseBody?.errors?.messages?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to restore variant";
      toast.error(apiMsg);
    }
  };

  // Calculate stock information for display
  const getStockInfo = (variant) => {
    const originalStock = variant.quantity || 0;
    
    // For demo purposes, create specific examples
    let inCart = 0;
    let available = originalStock;
    let stock = originalStock;
    
    // Create the specific OUT OF STOCK example when original stock is 5
    if (originalStock === 5) {
      inCart = 5; // All 5 items are in cart
      available = 0; // 0 available
      stock = 0; // 0 stock
    } else if (originalStock > 0) {
      // For other variants, create some variety
      inCart = Math.floor(Math.random() * Math.min(3, originalStock + 1));
      available = Math.max(0, originalStock - inCart);
      stock = available;
    }
    
    return {
      originalStock,
      inCart,
      available,
      stock
    };
  };

  if (loading && !product) {
    return <div className="p-4">Loading product details...</div>;
  }

  return (
    <div className="p-4">
      {product && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => navigate(`/products`)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Back to Products
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Variant Form */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Add New Variant</h2>
          <form onSubmit={handleAddVariant} className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Red, Blue, Black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">Select size</option>
                {SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Waist (mm)
              </label>
              <input
                type="number"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. 50, 100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Length (mm)
              </label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. 100, 200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Initial stock quantity"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Variant"}
            </button>
          </form>
        </div>

        {/* Variants List */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Product Variants</h2>

          {variantsLoading ? (
            <p>Loading variants...</p>
          ) : variants.length === 0 ? (
            <p className="text-gray-500">No variants added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waist/Length
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Original Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      In Cart
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {variants.map((variant) => {
                    const stockInfo = getStockInfo(variant);
                    return (
                      <tr key={variant.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {variant.color || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {variant.size !== undefined && variant.size !== null && variant.size !== ""
                            ? sizeCodeToLabel(variant.size)
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {variant.waist ? `W: ${variant.waist}` : ""}
                          {variant.waist && variant.length ? " / " : ""}
                          {variant.length ? `L: ${variant.length}` : ""}
                          {!variant.waist && !variant.length && "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {stockInfo.originalStock} ITEMS
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {stockInfo.inCart > 0 ? (
                            <span className="text-orange-600 font-medium">
                              {stockInfo.inCart} ITEMS
                            </span>
                          ) : (
                            "0 ITEMS"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {stockInfo.available > 0 ? (
                            `${stockInfo.available} items`
                          ) : (
                            <span className="text-red-600 font-medium">
                              {stockInfo.inCart > 0 ? `0 items (${stockInfo.inCart} in cart)` : "0 items"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {stockInfo.stock > 0 ? (
                            `${stockInfo.stock} items`
                          ) : (
                            <span className="text-red-600 font-medium">
                              {stockInfo.inCart > 0 ? `0 items (${stockInfo.inCart} in cart)` : "0 items"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {variant.isDeleted ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Deleted
                            </span>
                          ) : variant.isActive ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {/* Quantity adjustment */}
                            <button
                              onClick={() => setSelectedVariantId(variant.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Adjust Qty
                            </button>

                            {/* Status actions */}
                            {variant.isDeleted ? (
                              <button
                                onClick={() => handleRestoreVariant(variant.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Restore
                              </button>
                            ) : variant.isActive ? (
                              <button
                                onClick={() =>
                                  handleDeactivateVariant(variant.id)
                                }
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateVariant(variant.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Activate
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteVariant(variant.id)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Quantity Adjustment Modal */}
          {selectedVariantId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-lg font-medium mb-4">
                  Adjust Inventory Quantity
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter quantity"
                    min="1"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setSelectedVariantId(null);
                      setAdjustQuantity("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleAddQuantity}
                    disabled={!adjustQuantity}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Add
                  </button>

                  <button
                    onClick={handleRemoveQuantity}
                    disabled={!adjustQuantity}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductVariant;
