import React from 'react';
import { currency } from '../../App';
import { toast } from 'react-toastify';

const AddOrderForm = ({
  newOrder,
  handleInputChange,
  handleProductChange,
  addProductToOrder,
  removeProductFromOrder,
  handleAddOrder,
  addresses,
  products,
  loading,
  setShowAddModal
}) => {
  // Calculate total order amount
  const orderTotal = newOrder.products.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );

  return (
    <form onSubmit={handleAddOrder} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Address *
        </label>
        <select
          name="addressId"
          value={newOrder.addressId}
          onChange={handleInputChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
          required
        >
          <option value="">Select a delivery address</option>
          {addresses.map((address) => (
            <option key={address.id} value={address.id}>
              {address.firstName} {address.lastName} - {address.addressLine}, {address.city}, {address.state} {address.postalCode}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Order Notes
        </label>
        <textarea
          name="notes"
          value={newOrder.notes}
          onChange={handleInputChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
          placeholder="Add any special instructions or notes"
          rows="2"
        ></textarea>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-3">Add Products</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product *
            </label>
            <select
              value={newOrder.selectedProduct.productId}
              onChange={(e) => handleProductChange("productId", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {currency} {product.price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size
            </label>
            <select
              value={newOrder.selectedProduct.size}
              onChange={(e) => handleProductChange("size", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
            >
              <option value="">Select size (optional)</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
              <option value="N/A">N/A</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={newOrder.selectedProduct.quantity}
              onChange={(e) =>
                handleProductChange("quantity", parseInt(e.target.value) || 1)
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={addProductToOrder}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm w-full"
            >
              Add Product
            </button>
          </div>
        </div>

        {/* Product List */}
        {newOrder.products.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-medium mb-2">Order Items</h4>
            <div className="bg-gray-50 p-3 rounded-md">
              {newOrder.products.map((product, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b last:border-b-0"
                >
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">
                      {product.size ? `Size: ${product.size}` : ""} | Qty: {product.quantity}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="font-medium mr-3">
                      {currency} {(product.price * product.quantity).toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProductFromOrder(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-200">
                <div className="font-bold">Total:</div>
                <div className="font-bold">
                  {currency} {orderTotal.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={() => setShowAddModal(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || newOrder.products.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Order"}
        </button>
      </div>
    </form>
  );
};

export default AddOrderForm;