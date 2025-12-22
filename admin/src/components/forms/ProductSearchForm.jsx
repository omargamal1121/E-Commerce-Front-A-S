import React from "react";
import FormInput from "./FormInput";

const ProductSearchForm = ({
  searchParams,
  handleInputChange,
  handleSearch,
  subcategories,
  fitTypes,
  loading,
}) => {
  const {
    searchTerm,
    subcategoryId,
    gender,
    fitType,
    minPrice,
    maxPrice,
    status,
    inStock,
    onSale,
    sortBy,
    sortDescending,
    includeDeleted,
  } = searchParams;

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-4">Search Products</h2>
      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <FormInput
          label="Search Term"
          name="searchTerm"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder="Search by name or description"
        />

        <FormInput
          label="Subcategory"
          type="select"
          name="subcategoryId"
          value={subcategoryId}
          onChange={handleInputChange}
          options={[{ id: "", name: "All Subcategories" }, ...subcategories]}
        />

        <FormInput
          label="Gender"
          type="select"
          name="gender"
          value={gender}
          onChange={handleInputChange}
          options={[
            { id: "", name: "All Genders" },
            { id: "1", name: "Male" },
            { id: "2", name: "Female" },
            { id: "3", name: "Both" },
          ]}
        />

        <FormInput
          label="Fit Type"
          type="select"
          name="fitType"
          value={fitType}
          onChange={handleInputChange}
          options={[{ id: "", name: "All Fit Types" }, ...fitTypes]}
        />

        <div className="flex gap-2">
          <FormInput
            label="Min Price"
            type="number"
            name="minPrice"
            value={minPrice}
            onChange={handleInputChange}
            placeholder="Min"
            min="0"
            step="1"
            className="w-full"
          />
          <FormInput
            label="Max Price"
            type="number"
            name="maxPrice"
            value={maxPrice}
            onChange={handleInputChange}
            placeholder="Max"
            min="0"
            step="1"
            className="w-full"
          />
        </div>

        <FormInput
          label="Status"
          type="select"
          name="status"
          value={status}
          onChange={(e) => {
            // Update status field
            handleInputChange(e);

            // If status is active, automatically set inStock to true
            if (e.target.value === "active") {
              const syntheticEvent = {
                target: {
                  name: "inStock",
                  type: "checkbox",
                  checked: true,
                },
              };
              handleInputChange(syntheticEvent);
            }
          }}
          options={[
            { id: "", name: "All Status" },
            { id: "active", name: "Active" },
            { id: "inactive", name: "Inactive" },
            { id: "deleted", name: "Deleted" },
          ]}
        />

        <FormInput
          label="Sort By"
          type="select"
          name="sortBy"
          value={sortBy || "price"}
          onChange={handleInputChange}
          options={[
            { id: "price", name: "Price" },
            { id: "name", name: "Name" },
            { id: "createdAt", name: "Date Created" },
            { id: "availableQuantity", name: "Stock" },
          ]}
        />

        <FormInput
          label="Sort Order"
          type="select"
          name="sortDescending"
          value={
            sortDescending !== undefined ? sortDescending.toString() : "true"
          }
          onChange={handleInputChange}
          options={[
            { id: "true", name: "Descending" },
            { id: "false", name: "Ascending" },
          ]}
        />

        <div className="flex flex-col gap-2 md:col-span-3">
          <div className="text-sm font-medium text-gray-700 mb-1">Filters</div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="inStock"
                name="inStock"
                checked={inStock}
                onChange={(e) => {
                  handleInputChange(e);

                  // If inStock is unchecked, make sure status is not set to active
                  if (!e.target.checked && status === "active") {
                    const statusEvent = {
                      target: {
                        name: "status",
                        value: "",
                      },
                    };
                    handleInputChange(statusEvent);
                  }
                }}
                className="mr-2"
              />
              <label
                htmlFor="inStock"
                className="text-sm font-medium text-gray-700"
              >
                In Stock Only
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
              <label
                htmlFor="onSale"
                className="text-sm font-medium text-gray-700"
              >
                On Sale Only
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeDeleted"
                name="includeDeleted"
                checked={includeDeleted}
                onChange={(e) => {
                  handleInputChange(e);

                  // If includeDeleted is checked, reset status
                  if (e.target.checked && status !== "deleted") {
                    const statusEvent = {
                      target: {
                        name: "status",
                        value: "deleted",
                      },
                    };
                    handleInputChange(statusEvent);
                  }
                }}
                className="mr-2"
              />
              <label
                htmlFor="includeDeleted"
                className="text-sm font-medium text-gray-700"
              >
                Include Deleted
              </label>
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end mt-4">
            <button
              type="button"
              onClick={() => {
                // Reset all search params
                const resetParams = {
                  searchTerm: "",
                  subcategoryId: "",
                  gender: "",
                  fitType: "",
                  minPrice: "",
                  maxPrice: "",
                  status: "",
                  inStock: false,
                  onSale: false,
                  includeDeleted: false,
                  sortBy: "price",
                  sortDescending: true,
                };

                // Update all form fields
                Object.keys(resetParams).forEach((key) => {
                  handleInputChange({
                    target: {
                      name: key,
                      value: resetParams[key],
                      type:
                        typeof resetParams[key] === "boolean"
                          ? "checkbox"
                          : "text",
                      checked: resetParams[key],
                    },
                  });
                });

                // Trigger search with reset params
                setTimeout(() => handleSearch(new Event("submit")), 0);
              }}
              className="ml-2 bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductSearchForm;
