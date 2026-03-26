import axios from "axios";
import { backendUrl } from "../App";

const logApiError = () => { };

// Helper to convert UTC dates from server to Egypt local time (Africa/Cairo)
const toEgyptTime = (date) => {
  if (!date) return date;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date; // Return original if invalid
    
    // sv-SE gives YYYY-MM-DD HH:mm:ss
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(d).replace(' ', 'T');
  } catch (e) {
    return date;
  }
};

const fromEgyptTime = (dateStr) => {
  if (!dateStr) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    // Use Intl to find the offset for Cairo on this specific date
    const parts = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Africa/Cairo',
      timeZoneName: 'shortOffset'
    }).formatToParts(d);
    
    // offsetPart.value is like "GMT+2" or "GMT+3"
    const offset = parts.find(p => p.type === 'timeZoneName')?.value.replace('GMT', '') || "";
    
    // Append the offset to ensure it's parsed as Cairo time, then convert to UTC
    return new Date(dateStr + offset).toISOString();
  } catch (e) {
    return dateStr;
  }
};

const convertDiscountDates = (d) => {
  if (!d) return d;
  return {
    ...d,
    startDate: toEgyptTime(d.startDate),
    endDate: toEgyptTime(d.endDate),
    isDeleted: d.deletedAt !== null && d.deletedAt !== undefined
  };
};

const prepareDiscountForServer = (d) => {
  if (!d) return d;
  return {
    ...d,
    startDate: fromEgyptTime(d.startDate),
    endDate: fromEgyptTime(d.endDate)
  };
};

// API service for products, discounts, bulk discounts, images, customer addresses, and orders
const API = {
  // Order APIs
  orders: {
    // Create a new order
    create: async (orderData, token) => {
      try {
        const res = await axios.post(`${backendUrl}/api/Order`, orderData, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data;
      } catch (err) {
        throw err;
      }
    },

    // Get order by ID
    getById: async (orderId, token) => {
      try {
        const res = await axios.get(`${backendUrl}/api/Order/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data;
      } catch (err) {
        throw err;
      }
    },
  },

  // Customer Address APIs
  customerAddresses: {
    // Get all customer addresses
    getAll: async (token) => {
      try {
        const res = await axios.get(`${backendUrl}/api/CustomerAddress`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data;
      } catch (err) {
        throw err;
      }
    },
  },

  // Product APIs
  products: {
    // Create a new product
    create: async (productData, token) => {
      try {
        const res = await axios.post(
          `${backendUrl}/api/Products`,
          productData,
          {
            headers: {
              "Content-Type": "application/json-patch+json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        return res.data;
      } catch (err) {
        throw err;
      }
    },

    // Get all products
    getAll: async (token) => {
      try {
        const res = await axios.get(`${backendUrl}/api/Products`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { page: 1, pageSize: 100 },
        });
        return res.data;
      } catch (err) {
        throw err;
      }
    },

    // Get product list with advanced search
    list: async ({ page = 1, pageSize = 10, ...filters }, token) => {
      try {
        const useAdvancedSearch =
          filters.subcategoryId ||
          filters.gender ||
          filters.fitType ||
          filters.minPrice ||
          filters.maxPrice ||
          filters.inStock !== undefined ||
          filters.onSale === true ||
          filters.color ||
          filters.minSize ||
          filters.maxSize ||
          filters.sortBy;

        if (useAdvancedSearch) {
          const queryParams = new URLSearchParams();
          queryParams.append("page", page);
          queryParams.append("pageSize", pageSize);

          // Only append isActive when explicitly active or inactive — omit when "all"
          if (filters.isActive === true || filters.isActive === false) {
            queryParams.append("isActive", filters.isActive);
          }

          // Only append includeDeleted when explicitly set
          if (filters.includeDeleted === true) {
            queryParams.append("includeDeleted", true);
          }
          const requestBody = {};

          if (filters.subcategoryId && parseInt(filters.subcategoryId) !== 0)
            requestBody.subcategoryid = parseInt(filters.subcategoryId);
          if (filters.gender && parseInt(filters.gender) !== 0)
            requestBody.gender = parseInt(filters.gender);
          if (filters.fitType && parseInt(filters.fitType) !== 0)
            requestBody.fitType = parseInt(filters.fitType);
          if (filters.minPrice && parseFloat(filters.minPrice) !== 0)
            requestBody.minPrice = parseFloat(filters.minPrice);
          if (filters.maxPrice && parseFloat(filters.maxPrice) !== 0)
            requestBody.maxPrice = parseFloat(filters.maxPrice);
          // inStock: send true or false when explicitly set, omit when not filtered
          if (filters.inStock === true) requestBody.inStock = true;
          else if (filters.inStock === false) requestBody.inStock = false;
          if (filters.onSale === true) requestBody.onSale = true;
          if (filters.sortBy && filters.sortBy !== "")
            requestBody.sortBy = filters.sortBy;
          if (filters.sortDescending !== undefined && filters.sortDescending !== null)
            requestBody.sortDescending = filters.sortDescending;
          if (filters.color && filters.color !== "")
            requestBody.color = filters.color;
          if (filters.minSize && parseInt(filters.minSize) !== 0)
            requestBody.minSize = parseInt(filters.minSize);
          if (filters.maxSize && parseInt(filters.maxSize) !== 0)
            requestBody.maxSize = parseInt(filters.maxSize);

          try {
            const url = `${backendUrl}/api/Products/advanced-search?${queryParams.toString()}`;
            console.log("🔍 Advanced Search Request:", { url, body: requestBody });
            const response = await axios.post(
              url,
              requestBody,
              {
                headers: {
                  "accept": "text/plain",
                  "Content-Type": "application/json-patch+json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            return response.data;
          } catch (error) {
            if (error.response?.status === 404) {
              return { data: [], totalCount: 0 };
            }
            throw error;
          }
        }

        const params = new URLSearchParams();
        params.append("page", page);
        params.append("pageSize", pageSize);

        let basicSearchTerm = filters.searchTerm || "";
        let extractedFilters = {};

        const pricePattern = /price\(min:(\d+)(?:-max:(\d+))?\)|price\(max:(\d+)\)/;
        const priceMatch = basicSearchTerm.match(pricePattern);
        if (priceMatch) {
          if (priceMatch[1]) extractedFilters.minPrice = parseInt(priceMatch[1]);
          if (priceMatch[2]) extractedFilters.maxPrice = parseInt(priceMatch[2]);
          if (priceMatch[3]) extractedFilters.maxPrice = parseInt(priceMatch[3]);
          basicSearchTerm = basicSearchTerm.replace(pricePattern, "").trim();
        }

        const fitPattern = /fit:(\S+)/;
        const fitMatch = basicSearchTerm.match(fitPattern);
        if (fitMatch) {
          extractedFilters.fitType = fitMatch[1];
          basicSearchTerm = basicSearchTerm.replace(fitPattern, "").trim();
        }

        const statusPattern = /status:(active|inactive)/;
        const statusMatch = basicSearchTerm.match(statusPattern);
        if (statusMatch) {
          extractedFilters.isActive = statusMatch[1] === "active";
          basicSearchTerm = basicSearchTerm.replace(statusPattern, "").trim();
        }

        params.append("searchTerm", basicSearchTerm);
        const mergedFilters = { ...filters, ...extractedFilters };

        if (mergedFilters.isActive !== undefined && mergedFilters.isActive !== null) {
          params.append("isActive", mergedFilters.isActive);
        } else if (mergedFilters.isActive === null) {
          params.append("isActive", "null");
        }

        if (mergedFilters.includeDeleted !== undefined) {
          if (mergedFilters.includeDeleted === null) {
            params.append("includeDeleted", "null");
          } else {
            params.append("includeDeleted", mergedFilters.includeDeleted);
          }
        }
        if (mergedFilters.subcategoryId) params.append("subcategoryId", mergedFilters.subcategoryId);
        if (mergedFilters.gender) params.append("gender", mergedFilters.gender);
        if (mergedFilters.fitType) params.append("fitType", mergedFilters.fitType);
        if (mergedFilters.minPrice) params.append("minPrice", mergedFilters.minPrice);
        if (mergedFilters.maxPrice) params.append("maxPrice", mergedFilters.maxPrice);
        if (mergedFilters.inStock === true) params.append("inStock", "true");
        if (mergedFilters.onSale === true) params.append("onSale", "true");
        if (mergedFilters.sortBy) params.append("sortBy", mergedFilters.sortBy);
        if (mergedFilters.sortDescending !== undefined) params.append("sortDescending", mergedFilters.sortDescending);
        if (mergedFilters.color) params.append("color", mergedFilters.color);
        if (mergedFilters.minSize) params.append("minSize", mergedFilters.minSize);
        if (mergedFilters.maxSize) params.append("maxSize", mergedFilters.maxSize);

        const response = await axios.get(
          `${backendUrl}/api/Products?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // Get a single product by ID
    getById: async (productId, token) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/products/${productId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // Get sales data for a product
    getSales: async (productId, token) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/Products/${productId}/sales`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    // Get all collections for a product
    getCollections: async (productId, token) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/Products/${productId}/collections`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    // Update a product
    update: async (productId, productData, token) => {
      try {
        const response = await axios.put(
          `${backendUrl}/api/products/${productId}`,
          productData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json-patch+json",
              Accept: "text/plain",
            },
          }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // Delete a product
    delete: async (id, token) => {
      try {
        const response = await axios.delete(
          `${backendUrl}/api/Products/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (error) {
        throw {
          statuscode: error.response?.status || 500,
          responseBody: error.response?.data || {
            message: "Failed to delete product",
          },
        };
      }
    },

    // Activate a product
    activate: async (id, token) => {
      return await axios.patch(
        `${backendUrl}/api/Products/${id}/activate`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },

    deactivate: async (id, token) => {
      return await axios.patch(
        `${backendUrl}/api/Products/${id}/deactivate`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },

    restore: async (id, token) => {
      return await axios.patch(
        `${backendUrl}/api/Products/${id}/restore`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },

    getDiscount: async (productId, token) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/Products/${productId}/Discount`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "text/plain",
            },
          }
        );
        const data = response.data;
        if (data?.responseBody?.data) {
          data.responseBody.data = convertDiscountDates(data.responseBody.data);
        }
        return data;
      } catch (error) {
        throw error;
      }
    },

    applyDiscount: async (productId, discountId, token) => {
      try {
        const response = await axios.post(
          `${backendUrl}/api/Products/${productId}/Discount`,
          discountId,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json-patch+json",
              Accept: "text/plain",
            },
          }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    removeDiscount: async (productId, token) => {
      return await axios.delete(
        `${backendUrl}/api/Products/${productId}/Discount`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
  },

  subcategories: {
    getAll: async (token) => {
      try {
        const res = await axios.get(`${backendUrl}/api/subcategories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data?.responseBody?.data || [];
      } catch (err) {
        throw err;
      }
    },
    deleteImage: async (subCatId, imageId, token) => {
      try {
        const response = await axios.delete(
          `${backendUrl}/api/subcategories/${subCatId}/images/${imageId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  },

  images: {
    uploadMain: async (productId, imageFile, token) => {
      const formData = new FormData();
      formData.append("Files", imageFile);

      try {
        const res = await axios.post(
          `${backendUrl}/api/Products/${productId}/main-image`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        return res.data;
      } catch (err) {
        throw err.response?.data || err;
      }
    },

    uploadAdditional: async (productId, imageFiles, token) => {
      const formData = new FormData();
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      try {
        const res = await axios.post(
          `${backendUrl}/api/Products/${productId}/images`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        return res.data;
      } catch (err) {
        throw err.response?.data || err;
      }
    },

    delete: async (productId, imageId, token) => {
      try {
        const response = await axios.delete(
          `${backendUrl}/api/Products/${productId}/images/${imageId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  },

  discounts: {
    create: async (discountData, token) => {
      try {
        const payload = prepareDiscountForServer(discountData);
        const response = await axios.post(
          `${backendUrl}/api/Discount`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    applyBulkDiscount: async (discountId, productIds, token) => {
      try {
        const response = await axios.post(
          `${backendUrl}/api/Products/bulk/Discount`,
          {
            discountid: discountId,
            productsId: productIds,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    associateProducts: async (discountId, productIds, token) => {
      try {
        const results = [];
        for (const productId of productIds) {
          try {
            const res = await axios.post(
              `${backendUrl}/api/Product/${productId}/Discount`,
              Number(discountId),
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
              }
            );
            results.push({ productId, ok: true, data: res.data });
          } catch (err) {
            results.push({
              productId,
              ok: false,
              error: err.response?.data || err.message,
            });
          }
        }
        return { responseBody: { data: results } };
      } catch (error) {
        throw error;
      }
    },

    delete: async (discountId, token) => {
      try {
        const response = await axios.delete(
          `${backendUrl}/api/Discount/${discountId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    activate: async (discountId, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Discount/${discountId}/activate`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    deactivate: async (discountId, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Discount/${discountId}/deactivate`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    restore: async (discountId, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Discount/${discountId}/restore`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    calculate: async (discountId, originalPrice, token) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/Discount/${discountId}/calculate`,
          {
            params: { originalPrice },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    list: async (params, token) => {
      try {
        const response = await axios.get(`${backendUrl}/api/Discount`, {
          headers: { Authorization: `Bearer ${token}` },
          params: params,
        });
        const data = response.data;
        if (data?.responseBody?.data && Array.isArray(data.responseBody.data)) {
          data.responseBody.data = data.responseBody.data.map(convertDiscountDates);
        }
        return data;
      } catch (error) {
        throw error;
      }
    },

    getById: async (discountId, token) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/Discount/${discountId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = response.data;
        if (data?.responseBody?.data) {
          data.responseBody.data = convertDiscountDates(data.responseBody.data);
        }
        return data;
      } catch (error) {
        throw error;
      }
    },

    update: async (discountId, discountData, token) => {
      try {
        const payload = prepareDiscountForServer({
          name: discountData.name,
          discountPercent: discountData.discountPercent,
          startDate: discountData.startDate,
          endDate: discountData.endDate,
          description: discountData.description,
        });
        const response = await axios.put(
          `${backendUrl}/api/Discount/${discountId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    getProductsByDiscount: async (discountId, token) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/Products/Discount/${discountId}/Products`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    removeDiscountFromProduct: async (productId, token) => {
      try {
        const response = await axios.delete(
          `${backendUrl}/api/Products/${productId}/Discount`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  },

  adminOperations: {
    getAll: async (params, token) => {
      try {
        const response = await axios.get(`${backendUrl}/api/AdminOperation`, {
          headers: { Authorization: `Bearer ${token}` },
          params: params,
        });
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  },

  variants: {
    add: async (productId, variantData, token) => {
      try {
        const payload = Array.isArray(variantData) ? variantData : [variantData];
        const response = await axios.post(
          `${backendUrl}/api/Products/${productId}/Variants`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    getByProductId: async (productId, token) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/Products/${productId}/Variants`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    addQuantity: async (productId, variantId, quantity, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Products/${productId}/Variants/${variantId}/quantity/add?quantity=${quantity}`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    removeQuantity: async (productId, variantId, quantity, token) => {
      try {
        const res = await axios.patch(
          `${backendUrl}/api/Products/${productId}/Variants/${variantId}/quantity/remove`,
          null,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "text/plain",
            },
            params: { quantity },
          }
        );
        return res.data;
      } catch (error) {
        throw error;
      }
    },

    activate: async (productId, variantId, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Products/${productId}/Variants/${variantId}/activate`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    deactivate: async (productId, variantId, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Products/${productId}/Variants/${variantId}/deactivate`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    restore: async (productId, variantId, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Products/${productId}/Variants/${variantId}/restore`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    delete: async (productId, variantId, token) => {
      try {
        const response = await axios.delete(
          `${backendUrl}/api/Products/${productId}/Variants/${variantId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  },
};

export default API;
