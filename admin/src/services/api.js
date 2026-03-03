import axios from "axios";
import { backendUrl } from "../App";

// util function عشان تطبع كل تفاصيل الـ error
const logApiError = (error, context = "") => {
  if (error.response) {
    console.error(`❌ API Error in ${context}:`, {
      status: error.response.status,
      statusText: error.response.statusText,
      headers: error.response.headers,
      data: error.response.data,
    });
  } else if (error.request) {
    console.error(`❌ No response received in ${context}:`, error.request);
  } else {
    console.error(`❌ Unexpected error in ${context}:`, error.message);
  }
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
        logApiError(err, "createOrder");
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
        logApiError(err, "getOrderById");
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
        logApiError(err, "getCustomerAddresses");
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
              Authorization: `Bearer ${token}`, // لو الـ API Protected
            },
          }
        );

        console.log("✅ Product added successfully:", res.data);
        return res.data; // ⬅️ مهم جداً
      } catch (err) {
        console.error("❌ Error adding product:", err.response?.data || err);
        throw err; // ⬅️ كمان مهم عشان الـ Add.jsx يعرف فيه Error
      }
    },

    // Get all products
    getAll: async (token) => {
      try {
        const res = await axios.get(`${backendUrl}/api/Products`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { page: 1, pageSize: 100 }, // Get a reasonable number of products
        });

        return res.data;
      } catch (err) {
        console.error("❌ Error fetching products:", err.response?.data || err);
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
          filters.inStock ||
          filters.onSale ||
          filters.color ||
          filters.minSize ||
          filters.maxSize ||
          filters.sortBy;

        if (useAdvancedSearch) {
          const queryParams = new URLSearchParams();
          queryParams.append("page", page);
          queryParams.append("pageSize", pageSize);

          if (filters.isActive !== undefined && filters.isActive !== null) {
            queryParams.append("isActive", filters.isActive);
          } else if (filters.isActive === null) {
            queryParams.append("isActive", "null");
          }

          if (filters.includeDeleted !== undefined) {
            if (filters.includeDeleted === null) {
              queryParams.append("includeDeleted", "null");
            } else {
              queryParams.append("includeDeleted", filters.includeDeleted);
            }
          }
          const requestBody = {
            searchTerm: filters.searchTerm || "",
            subcategoryid: filters.subcategoryId
              ? parseInt(filters.subcategoryId)
              : 0,
            gender: filters.gender ? parseInt(filters.gender) : 0, // 0=None, 1=Men, 2=Women, 3=Both
            fitType: filters.fitType ? parseInt(filters.fitType) : 0,
            minPrice: filters.minPrice ? parseFloat(filters.minPrice) : 0,
            maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : 0,
            inStock: filters.inStock || false,
            onSale: filters.onSale || false,
            sortBy: filters.sortBy || "price",
            sortDescending:
              filters.sortDescending !== undefined
                ? filters.sortDescending
                : true,
            color: filters.color || "",
            minSize: filters.minSize ? parseInt(filters.minSize) : 0,
            maxSize: filters.maxSize ? parseInt(filters.maxSize) : 0,
            page: page,
            pageSize: pageSize,
          };

          try {
            const response = await axios.post(
              `${backendUrl}/api/Products/advanced-search?${queryParams.toString()}`,
              requestBody,
              {
                headers: {
                  "Content-Type": "application/json", // ✅ التغيير هنا
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            return response.data;
          } catch (error) {
            if (error.response?.status === 404) {
              console.warn("⚠️ لا توجد منتجات مطابقة للبحث");
              return { data: [], totalCount: 0 }; // ✅ عشان الكود ما يبوظش
            }
            throw error;
          }
        }

        // If not using advanced search, use the regular list endpoint
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("pageSize", pageSize);

        // Parse enhanced search term to extract price, fit type, and status information
        let basicSearchTerm = filters.searchTerm || "";
        let extractedFilters = {};

        // Extract price range pattern: price(min:X-max:Y)
        const pricePattern =
          /price\(min:(\d+)(?:-max:(\d+))?\)|price\(max:(\d+)\)/;
        const priceMatch = basicSearchTerm.match(pricePattern);
        if (priceMatch) {
          if (priceMatch[1])
            extractedFilters.minPrice = parseInt(priceMatch[1]);
          if (priceMatch[2])
            extractedFilters.maxPrice = parseInt(priceMatch[2]);
          if (priceMatch[3])
            extractedFilters.maxPrice = parseInt(priceMatch[3]);
          basicSearchTerm = basicSearchTerm.replace(pricePattern, "").trim();
        }

        // Extract fit type pattern: fit:X
        const fitPattern = /fit:(\S+)/;
        const fitMatch = basicSearchTerm.match(fitPattern);
        if (fitMatch) {
          extractedFilters.fitType = fitMatch[1];
          basicSearchTerm = basicSearchTerm.replace(fitPattern, "").trim();
        }

        // Extract status pattern: status:active or status:inactive
        const statusPattern = /status:(active|inactive)/;
        const statusMatch = basicSearchTerm.match(statusPattern);
        if (statusMatch) {
          extractedFilters.isActive = statusMatch[1] === "active";
          basicSearchTerm = basicSearchTerm.replace(statusPattern, "").trim();
        }

        // Set the cleaned search term
        params.append("searchTerm", basicSearchTerm);

        // Add extracted filters with priority over original filters
        const mergedFilters = { ...filters, ...extractedFilters };

        // Add filter parameters if they exist
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
        if (mergedFilters.subcategoryId)
          params.append("subcategoryId", mergedFilters.subcategoryId);
        if (mergedFilters.gender) params.append("gender", mergedFilters.gender);
        if (mergedFilters.fitType)
          params.append("fitType", mergedFilters.fitType);
        if (mergedFilters.minPrice)
          params.append("minPrice", mergedFilters.minPrice);
        if (mergedFilters.maxPrice)
          params.append("maxPrice", mergedFilters.maxPrice);
        if (mergedFilters.inStock)
          params.append("inStock", mergedFilters.inStock);
        if (mergedFilters.onSale) params.append("onSale", mergedFilters.onSale);
        if (mergedFilters.sortBy) params.append("sortBy", mergedFilters.sortBy);
        if (mergedFilters.sortDescending !== undefined)
          params.append("sortDescending", mergedFilters.sortDescending);
        if (mergedFilters.color) params.append("color", mergedFilters.color);
        if (mergedFilters.minSize)
          params.append("minSize", mergedFilters.minSize);
        if (mergedFilters.maxSize)
          params.append("maxSize", mergedFilters.maxSize);

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
        console.error("❌ Error fetching products:");
        if (error.response) {
          console.error("Status:", error.response.status);
          console.error("Data:", error.response.data);
        } else if (error.request) {
          console.error("No response received:", error.request);
        } else {
          console.error("Request error:", error.message);
        }
        throw error;
      }
    },

    // Get a single product by ID
    getById: async (productId, token) => {
      // eslint-disable-next-line no-useless-catch
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

    // Update a product
    update: async (productId, productData, token) => {
      // eslint-disable-next-line no-useless-catch
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
          `${backendUrl}/api/Products/${id}`, // ✅ Products بحرف P كبير
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error(
          "Error deleting product:",
          error.response?.data || error.message
        );

        // نرمي Error فيه تفاصيل مفهومة
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
        null, // مهم! لازم تبعته null مش {}
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },

    deactivate: async (id, token) => {
      return await axios.patch(
        `${backendUrl}/api/Products/${id}/deactivate`,
        null, // نفس الفكرة هنا
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

    // Get discount information for a product
    getDiscount: async (productId, token) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/Products/${productId}/Discount`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "text/plain", // Match API response format
            },
          }
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ Error fetching product discount:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // Apply discount to a product
    applyDiscount: async (productId, discountId, token) => {
      try {
        const response = await axios.post(
          `${backendUrl}/api/Products/${productId}/Discount`,
          discountId, // Send the discount ID directly as the request body
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json-patch+json", // Updated content type to match API requirements
              Accept: "text/plain", // Updated accept header to match API response
            },
          }
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ Error applying discount:",
          error.response?.data || error
        );
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
      const res = await axios.get(`${backendUrl}/api/subcategories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ رجّع الـ array مباشرة
      return res.data?.responseBody?.data || [];
    },
  },

  // Image APIs
  images: {
    // ✅ Upload main image for a product
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

        console.log("✅ Main image uploaded successfully:", res.data);
        return res.data;
      } catch (err) {
        console.error(
          "❌ Error uploading main image:",
          err.response?.data || err
        );
        throw err.response?.data || err;
      }
    },

    // Upload additional images for a product
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

        console.log("✅ Additional images uploaded:", res.data);
        return res.data;
      } catch (err) {
        console.error(
          "❌ Error uploading additional images:",
          err.response?.data || err
        );
        throw err.response?.data || err;
      }
    },

    // Delete an image
    delete: async (productId, imageId, token) => {
      // eslint-disable-next-line no-useless-catch
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

  // Discount APIs
  discounts: {
    // Create a discount
    create: async (discountData, token) => {
      try {
        const response = await axios.post(
          `${backendUrl}/api/Discount`,
          discountData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ Error creating discount:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // Apply bulk discount to multiple products
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
        console.error(
          "❌ Error applying bulk discount:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // Associate products with a discount (apply to each product)
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
            console.error(
              `❌ Failed to associate product ${productId}:`,
              err.response?.data || err
            );
            results.push({
              productId,
              ok: false,
              error: err.response?.data || err.message,
            });
          }
        }
        return { responseBody: { data: results } };
      } catch (error) {
        console.error(
          "❌ Error associating products with discount:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // Delete a discount
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
        console.error(
          "❌ Error deleting discount:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // Activate a discount
    activate: async (discountId, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Discount/${discountId}/activate`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ Error activating discount:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // Deactivate a discount
    deactivate: async (discountId, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Discount/${discountId}/deactivate`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ Error deactivating discount:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // Restore a deleted discount
    restore: async (discountId, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Discount/${discountId}/restore`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ Error restoring discount:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // Calculate discount amount
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
        console.error(
          "❌ Error calculating discount:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // List all discounts
    list: async (params, token) => {
      try {
        const response = await axios.get(`${backendUrl}/api/Discount`, {
          headers: { Authorization: `Bearer ${token}` },
          params: params,
        });
        return response.data;
      } catch (error) {
        console.error(
          "❌ Error fetching discounts:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // Get discount by ID
    getById: async (discountId, token) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/Discount/${discountId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error(
          "❌ Error fetching discount details:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // Update a discount
    update: async (discountId, discountData, token) => {
      try {
        const response = await axios.put(
          `${backendUrl}/api/Discount/${discountId}`,
          {
            name: discountData.name,
            discountPercent: discountData.discountPercent,
            startDate: discountData.startDate,
            endDate: discountData.endDate,
            description: discountData.description,
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
        console.error(
          "❌ Error updating discount:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // Get products by discount ID
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
        console.error(
          "❌ Error fetching products by discount:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // Remove discount from a product
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
        console.error(
          "❌ Error removing discount from product:",
          error.response?.data || error
        );
        throw error;
      }
    },

    // This function has been moved to the products section for better organization
    // and updated to match the API requirements
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
        logApiError(error, "fetching admin operations");
        throw error;
      }
    },
  },

  // Product Variants APIs
  variants: {
    // Add a variant to a product
    add: async (productId, variantData, token) => {
      try {
        // API expects an array of variants; wrap single object if needed
        const payload = Array.isArray(variantData)
          ? variantData
          : [variantData];
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
        logApiError(error, "adding product variant");
        throw error;
      }
    },

    // Get variants for a product
    getByProductId: async (productId, token) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/Products/${productId}/Variants`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        logApiError(error, "getting product variants");
        throw error;
      }
    },

    // Add quantity to a variant
    addQuantity: async (productId, variantId, quantity, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Products/${productId}/Variants/${variantId}/quantity/add?quantity=${quantity}`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        logApiError(error, "adding variant quantity");
        throw error;
      }
    },

    // ✅ Remove quantity from variant
    removeQuantity: async (productId, variantId, quantity, token) => {
      try {
        const res = await axios.patch(
          `${backendUrl}/api/Products/${productId}/Variants/${variantId}/quantity/remove`,
          null, // مفيش body, كله params
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "text/plain", // 👈 مهم حسب Swagger
            },
            params: { quantity }, // الكمية في query string
          }
        );

        return res.data;
      } catch (error) {
        console.error("❌ API Error in removing variant quantity:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
        throw error;
      }
    },

    // Activate a variant
    activate: async (productId, variantId, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Products/${productId}/Variants/${variantId}/activate`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        logApiError(error, "activating variant");
        throw error;
      }
    },

    // Deactivate a variant
    deactivate: async (productId, variantId, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Products/${productId}/Variants/${variantId}/deactivate`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        logApiError(error, "deactivating variant");
        throw error;
      }
    },

    // Restore a variant
    restore: async (productId, variantId, token) => {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/Products/${productId}/Variants/${variantId}/restore`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        logApiError(error, "restoring variant");
        throw error;
      }
    },

    // Delete a variant
    delete: async (productId, variantId, token) => {
      try {
        const response = await axios.delete(
          `${backendUrl}/api/Products/${productId}/Variants/${variantId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        console.error("❌ API Error while deleting variant:");
        console.error("Status:", error.response?.status);
        console.error("Message:", error.response?.data?.message);
        console.error("Errors:", error.response?.data?.errors);
        console.error("Full Error Object:", error.response?.data || error);
        throw error;
      }
    },
  },

  // Bulk Discount APIs
  bulkDiscounts: {
    // Create a bulk discount
    create: async (bulkDiscountData, token) => {
      // eslint-disable-next-line no-useless-catch
      try {
        const response = await axios.post(
          `${backendUrl}/api/Products/bulk/discount`,
          bulkDiscountData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // Get all bulk discounts
    getAll: async (token) => {
      // eslint-disable-next-line no-useless-catch
      try {
        const response = await axios.get(
          `${backendUrl}/api/Products/bulk/discount`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // Update a bulk discount
    update: async (bulkDiscountId, bulkDiscountData, token) => {
      // eslint-disable-next-line no-useless-catch
      try {
        const response = await axios.put(
          `${backendUrl}/api/Products/bulk/discount/${bulkDiscountId}`,
          bulkDiscountData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // Delete a bulk discount
    delete: async (bulkDiscountId, token) => {
      // eslint-disable-next-line no-useless-catch
      try {
        const response = await axios.delete(
          `${backendUrl}/api/Products/bulk/discount/${bulkDiscountId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  },
  // Order APIs
  // orders: {
  //   // Create a new order
  //   create: async (orderData, token) => {
  //     try {
  //       const response = await axios.post(
  //         `${backendUrl}/api/Order`,
  //         orderData,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "application/json",
  //             Accept: "text/plain"
  //           }
  //         }
  //       );
  //       return response.data;
  //     } catch (error) {
  //       logApiError(error, "creating order");
  //       throw error;
  //     }
  //   },

  //   // Get all orders with optional filters
  //   list: async (params, token) => {
  //     try {
  //       const response = await axios.get(
  //         `${backendUrl}/api/Order`,
  //         {
  //           headers: { Authorization: `Bearer ${token}` },
  //           params: params
  //         }
  //       );
  //       return response.data;
  //     } catch (error) {
  //       logApiError(error, "fetching orders");
  //       throw error;
  //     }
  //   },

  //   // Get order by ID
  //   getById: async (orderId, token) => {
  //     try {
  //       const response = await axios.get(
  //         `${backendUrl}/api/Order/${orderId}`,
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  //       return response.data;
  //     } catch (error) {
  //       logApiError(error, "fetching order details");
  //       throw error;
  //     }
  //   },

  //   // Update order status
  //   updateStatus: async (orderId, status, token) => {
  //     try {
  //       const response = await axios.patch(
  //         `${backendUrl}/api/Order/${orderId}/status`,
  //         { status },
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  //       return response.data;
  //     } catch (error) {
  //       logApiError(error, "updating order status");
  //       throw error;
  //     }
  //   }
  // },
};

export default API;
