import React, { useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
  FaUndo,
  FaCalculator,
} from "react-icons/fa";
import { toast } from "react-toastify";

const DiscountList = ({
  discounts,
  loading,
  handleEditDiscount,
  handleDeleteDiscount,
  handleToggleActive,
  handleRestoreDiscount,
  handleCalculateDiscount,
  fetchDiscounts, // auto-refresh
  currentPage,
  totalPages,
  handlePreviousPage,
  handleNextPage,
}) => {
  const [calculatingDiscount, setCalculatingDiscount] = useState(null);
  const [originalPrice, setOriginalPrice] = useState("");


  const submitCalculation = async () => {
    if (!originalPrice || isNaN(originalPrice) || parseFloat(originalPrice) <= 0) {
      toast.error("Please enter a valid original price");
      return;
    }

    try {
      // Call the calculate function with the original price
      const result = await handleCalculateDiscount(calculatingDiscount.id, parseFloat(originalPrice));

      if (result) {
        toast.success(`Discount calculation successful: ${result.responseBody?.data}`);
      } else {
        toast.info("No calculation result returned");
      }

      // Reset after calculation
      setCalculatingDiscount(null);
      setOriginalPrice("");
    } catch (error) {
      console.error("Error calculating discount:", error);
      toast.error("Failed to calculate discount");
    }
  };

  const cancelCalculation = () => {
    setCalculatingDiscount(null);
    setOriginalPrice("");
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      {/* Original Price Input Modal */}
      {calculatingDiscount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-medium mb-4">Calculate Discount</h3>
            <p className="mb-2">Enter the original price to calculate the discount for {calculatingDiscount.name}:</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter original price"
                min="0.01"
                step="0.01"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelCalculation}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={submitCalculation}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Calculate
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">All Discounts</h3>
        {discounts.length > 0 && (
          <span className="text-sm text-gray-500">
            Showing {discounts.length} result{discounts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-center py-4">Loading discounts...</p>
      ) : discounts.length === 0 ? (
        <p className="text-center py-4">No discounts found.</p>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {discount.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {discount.discountPercent}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {discount.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${discount.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {discount.isActive ? "Active" : "Inactive"}{" "}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                        <div>
                          Start:{" "}
                          {new Date(discount.startDate).toLocaleDateString()}
                        </div>
                        <div>
                          End: {new Date(discount.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditDiscount(discount.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={async () => {
                            await handleToggleActive(
                              discount.id,
                              discount.isActive
                            );
                          }}
                          className={`${discount.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}`}
                          title={discount.isActive ? "Deactivate" : "Activate"}
                        >
                          {discount.isActive ? <FaTimes /> : <FaCheck />}
                        </button>
                        {!discount.isDeleted ? (
                          <button
                            onClick={async () => {
                              await handleDeleteDiscount(discount.id);
                              fetchDiscounts();
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              await handleRestoreDiscount(discount.id);
                              fetchDiscounts();
                            }}
                            className="text-amber-600 hover:text-amber-900"
                            title="Restore"
                          >
                            <FaUndo />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 px-6 py-3 border-t">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 border rounded bg-gray-100">
                {currentPage}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )
      }
    </div>
  );
};


export default DiscountList;
