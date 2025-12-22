import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";
import { FiSearch, FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const BulkDiscountManager = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filters, setFilters] = useState({
    inStock: false,
    hasDiscount: "",
    minPrice: "",
    maxPrice: ""
  });

  // Fetch available discounts
  const fetchDiscounts = useCallback(async () => {
    try {
      const response = await API.discounts.list({}, token);
      setAvailableDiscounts(response.responseBody?.data || []);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      toast.error("Failed to load discounts");
    }
  }, [token]);

  // Fetch products with filters and pagination
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = {
        page: currentPage,
        pageSize: itemsPerPage,
        searchTerm: searchTerm || undefined,
        inStock: filters.inStock || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        hasDiscount: filters.hasDiscount || undefined
      };
      
      const response = await API.products.list(params, token);
      setProducts(response.responseBody?.data || []);
      setTotalProducts(response.responseBody?.totalCount || 0);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  }, [token, currentPage, itemsPerPage, searchTerm, filters]);

  // Initial data fetch
  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // Fetch products when filters or search changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [fetchProducts]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Handle product selection
  const handleProductSelection = (productId) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Handle select all products on current page
  const handleSelectAll = () => {
    const currentPageProductIds = products.map(p => p.id);
    
    // If all current page products are selected, deselect them
    if (currentPageProductIds.every(id => selectedProductIds.includes(id))) {
      setSelectedProductIds(prev => prev.filter(id => !currentPageProductIds.includes(id)));
    } else {
      // Otherwise, select all current page products
      setSelectedProductIds(prev => {
        const newSelection = [...prev];
        currentPageProductIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedProductIds([]);
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Apply discount to selected products
  const handleApplyBulkDiscount = async () => {
    if (selectedDiscountId === null) {
      toast.error("Please select a discount");
      return;
    }

    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setLoading(true);
    try {
      await API.discounts.applyBulkDiscount(selectedDiscountId, selectedProductIds, token);
      toast.success(`Discount applied to ${selectedProductIds.length} products successfully`);
      
      // Reset selection and refresh products
      setSelectedProductIds([]);
      fetchProducts();
    } catch (error) {
      console.error("Error applying bulk discount:", error);
      const msg = error.response?.data?.responseBody?.message || error.response?.data?.message || error.message || "Failed to apply discount";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Get selected discount details
  const selectedDiscount = availableDiscounts.find(d => d.id === selectedDiscountId);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Bulk Discount Manager</h2>
        <p className="text-gray-600">Apply discounts to multiple products at once. Select a discount and the products you want to apply it to.</p>
      </div>

      {/* Discount Selection Card */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 mb-3">1. Select Discount</h3>
        
        {availableDiscounts.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-2">No discounts available.</p>
            <a 
              href="/discounts/new"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Create a new discount
            </a>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <select
              value={selectedDiscountId || ""}
              onChange={(e) => setSelectedDiscountId(e.target.value ? parseInt(e.target.value) : null)}
              className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select a discount --</option>
              {availableDiscounts.map((discount) => (
                <option key={discount.id} value={discount.id}>
                  {discount.name} ({discount.discountPercent}% Off) - {discount.isActive ? 'Active' : 'Inactive'}
                </option>
              ))}
            </select>
            
            {selectedDiscount && (
              <div className="bg-white p-3 rounded border flex-1">
                <h4 className="font-medium text-gray-800">{selectedDiscount.name}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-medium">
                    <span className={`px-2 py-1 rounded-full text-xs ${selectedDiscount.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedDiscount.discountPercent}% Off
                      <span className="ml-1">
                        {selectedDiscount.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </span>
                  <span className="text-sm text-gray-500">
                    {selectedDiscount.startDate ? new Date(selectedDiscount.startDate).toLocaleDateString() : 'No start date'}
                    {' - '}
                    {selectedDiscount.endDate ? new Date(selectedDiscount.endDate).toLocaleDateString() : 'No end date'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Product Selection */}
      <div className="mb-6 border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-medium text-gray-800">2. Select Products</h3>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Filter Button */}
            <button
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50"
              title="Filters"
            >
              <FiFilter className="w-5 h-5 text-gray-500" />
            </button>
            
            {/* Select All Button */}
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 text-sm bg-white border rounded-md hover:bg-gray-50 text-gray-700 whitespace-nowrap"
            >
              {selectedProductIds.length > 0 && selectedProductIds.length === products.length ? 'Deselect Page' : 'Select Page'}
            </button>
            
            {selectedProductIds.length > 0 && (
              <button
                onClick={clearSelection}
                className="px-3 py-2 text-sm bg-white border border-red-100 text-red-600 rounded-md hover:bg-red-50 whitespace-nowrap"
              >
                Clear ({selectedProductIds.length})
              </button>
            )}
          </div>
        </div>
        
        {/* Filters Panel */}
        <div className="bg-white p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min $"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                />
                <span className="flex items-center">to</span>
                <input
                  type="number"
                  placeholder="Max $"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
              <div className="flex items-center space-x-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Status</label>
              <select
                value={filters.hasDiscount}
                onChange={(e) => handleFilterChange('hasDiscount', e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="">Any</option>
                <option value="true">Has Discount</option>
                <option value="false">No Discount</option>
              </select>
            </div>
          </div>
        </div>
        
        {loadingProducts ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No products found matching your criteria.</p>
            {(searchTerm || filters.inStock || filters.hasDiscount || filters.minPrice || filters.maxPrice) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    inStock: false,
                    hasDiscount: "",
                    minPrice: "",
                    maxPrice: ""
                  });
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={products.length > 0 && products.every(p => selectedProductIds.includes(p.id))}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => {
                    // Check if product has a discount and if it's active
                    const discountPercent = product.discountPrecentage || product.discountPercent || 0;
                    const hasDiscount = discountPercent > 0;
                    
          
                    const isDiscountActive = product.discount 
                      ? product.discount.isActive 
                      : hasDiscount; 
                    
                    const originalPrice = parseFloat(product.price) || 0;
                    const finalPrice = hasDiscount && isDiscountActive
                      ? originalPrice * (1 - discountPercent / 100) 
                      : originalPrice;
                    
                    return (
                      <tr 
                        key={product.id} 
                        className={`${selectedProductIds.includes(product.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(product.id)}
                            onChange={() => handleProductSelection(product.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.images && product.images.length > 0 && (
                              <div className="flex-shrink-0 h-10 w-10">
                                <img 
                                  className="h-10 w-10 rounded-md object-cover" 
                                  src={product.images.find(img => img.isMain)?.url || product.images[0].url} 
                                  alt={product.name}
                                />
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.subCategory?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{product.category?.name || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasDiscount ? (
                            <div>
                              <span className="text-sm line-through text-gray-500">
                                ${originalPrice.toFixed(2)}
                              </span>
                              <span className={`ml-2 text-sm font-medium ${isDiscountActive ? 'text-green-600' : 'text-gray-600'}`}>
                                ${finalPrice.toFixed(2)}
                              </span>
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                isDiscountActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {discountPercent}% OFF
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-900">
                              ${originalPrice.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.availableQuantity > 10 ? 'bg-green-100 text-green-800' : 
                            product.availableQuantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.availableQuantity || 0} in stock
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasDiscount ? (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              isDiscountActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isDiscountActive ? `Active (${discountPercent}% Off)` : `Inactive (${discountPercent}% Off)`}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">No discount</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={products.length < itemsPerPage}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, totalProducts)}
                    </span>{' '}
                    of <span className="font-medium">{totalProducts}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <FiChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={products.length < itemsPerPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <FiChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Summary and Action Bar */}
      {selectedProductIds.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 border rounded-lg transition-all duration-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h4 className="font-medium text-gray-800">Selected Items Summary</h4>
              <p className="text-sm text-gray-600">
                {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected • 
                {selectedDiscount ? (
                  <span>Will apply <span className="font-medium">{selectedDiscount.discountPercent}%</span> discount</span>
                ) : (
                  <span>No discount selected</span>
                )}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={clearSelection}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Selection
              </button>
              
              <button
                onClick={handleApplyBulkDiscount}
                disabled={!selectedDiscountId || selectedProductIds.length === 0 || loading}
                className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  !selectedDiscountId || selectedProductIds.length === 0 || loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </span>
                ) : (
                  `Apply Discount to ${selectedProductIds.length} Product${selectedProductIds.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkDiscountManager;