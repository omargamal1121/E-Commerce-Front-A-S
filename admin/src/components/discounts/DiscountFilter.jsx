import React, { useState } from "react";

const DiscountFilter = ({ filters, handleFilterChange, handleApplyFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Filter Discounts</h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-500 text-sm hover:underline"
        >
          {isExpanded ? "Hide Advanced Filters" : "Show Advanced Filters"}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            name="where"
            value={filters.where}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="upcoming">Upcoming</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Order By</label>
          <select
            name="orderBy"
            value={filters.orderBy}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name (A-Z)</option>
            <option value="nameDesc">Name (Z-A)</option>
            <option value="discountPercent">Discount % (Low to High)</option>
            <option value="discountPercentDesc">Discount % (High to Low)</option>
          </select>
        </div>
      </div>
      
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Minimum Discount %</label>
            <input
              type="number"
              name="minDiscount"
              value={filters.minDiscount || ""}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded"
              min="0"
              max="100"
              placeholder="Min %"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Maximum Discount %</label>
            <input
              type="number"
              name="maxDiscount"
              value={filters.maxDiscount || ""}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded"
              min="0"
              max="100"
              placeholder="Max %"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date (After)</label>
            <input
              type="date"
              name="startDateAfter"
              value={filters.startDateAfter || ""}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date (Before)</label>
            <input
              type="date"
              name="endDateBefore"
              value={filters.endDateBefore || ""}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      )}
      
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => {
            // Reset all filters
            Object.keys(filters).forEach(key => {
              handleFilterChange({
                target: { name: key, value: "" }
              });
            });
            handleApplyFilters();
          }}
          className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
        >
          Reset Filters
        </button>
        <button
          onClick={handleApplyFilters}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default DiscountFilter;