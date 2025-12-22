import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl, currency } from "../App";
import API from "../services/api";

const OrderCreate = ({ token }) => {
  const navigate = useNavigate();

  // State for products
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // State for cart
  const [cartItems, setCartItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // State for checkout
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [notes, setNotes] = useState("");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    phoneNumber: "",
    country: "",
    state: "",
    city: "",
    streetAddress: "",
    postalCode: "",
    isDefault: true,
    additionalNotes: "",
  });

  // State for payment
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [walletPhoneNumber, setWalletPhoneNumber] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("EGP");
  const [paymentNotes, setPaymentNotes] = useState("");

  // State for created order id (required by Payment API)
  const [createdOrderId, setCreatedOrderId] = useState(null);

  // State for payment provider
  const [paymentProviders, setPaymentProviders] = useState([]);
  const [showAddPaymentProvider, setShowAddPaymentProvider] = useState(false);
  const [paymentProviderForm, setPaymentProviderForm] = useState({
    name: "",
    apiEndpoint: "",
    publicKey: "",
    privateKey: "",
    hmac: "",
    paymentProvider: 0,
    iframeId: "",
  });

  // Parallelize initial fetches for faster page readiness
  useEffect(() => {
    (async () => {
      await Promise.all([
        fetchProducts(),
        fetchAddresses(),
        fetchPaymentMethods(),
        fetchPaymentProviders(),
      ]);
    })();
  }, []);

  // Filter products when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await API.products.getAll(token);
      if (response && response.responseBody && response.responseBody.data) {
        setProducts(response.responseBody.data);
        setFilteredProducts(response.responseBody.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer addresses
  const fetchAddresses = async () => {
    try {
      const response = await API.customerAddresses.getAll(token);
      if (response && response.responseBody && response.responseBody.data) {
        const list = response.responseBody.data || [];
        // Show default addresses first
        const sorted = [...list].sort(
          (a, b) => Number(b.isDefault) - Number(a.isDefault)
        );
        setAddresses(sorted);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load customer addresses");
    }
  };

  // Fetch payment methods (prefer PaymentMethod list, fallback to Enums)
  const fetchPaymentMethods = async () => {
    try {
      const pmResp = await axios.get(`${backendUrl}/api/PaymentMethod`, {
        params: { isActive: true, isDeleted: false, page: 1, pageSize: 100 },
        headers: { Authorization: `Bearer ${token}` },
      });
      const pmList = pmResp?.data?.responseBody?.data;
      if (Array.isArray(pmList) && pmList.length > 0) {
        setPaymentMethods(pmList);
        return;
      }

      const enumsResp = await axios.get(
        `${backendUrl}/api/Enums/PaymentMethods`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const enumList = enumsResp?.data?.responseBody?.data;
      if (Array.isArray(enumList) && enumList.length > 0) {
        setPaymentMethods(enumList);
        return;
      }
      toast.error("Failed to load payment methods");
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Failed to load payment methods");
    }
  };

  // Fetch payment providers
  const fetchPaymentProviders = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/PaymentProvider`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (
        response &&
        response.data &&
        response.data.responseBody &&
        response.data.responseBody.data
      ) {
        setPaymentProviders(response.data.responseBody.data);
      }
    } catch (error) {
      console.error("Error fetching payment providers:", error);
      toast.error("Failed to load payment providers");
    }
  };

  // Handle payment provider form input changes
  const handlePaymentProviderFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentProviderForm({
      ...paymentProviderForm,
      [name]: value,
    });
  };

  // Submit payment provider
  const submitPaymentProvider = async () => {
    // Validate required fields
    if (!paymentProviderForm.name || !paymentProviderForm.apiEndpoint) {
      toast.error("Name and API Endpoint are required");
      return;
    }

    setLoading(true);
    try {
      // Create form data for the API request
      const formData = new FormData();
      formData.append("Name", paymentProviderForm.name);
      formData.append("ApiEndpoint", paymentProviderForm.apiEndpoint);

      // Append optional fields if they exist
      if (paymentProviderForm.publicKey) {
        formData.append("PublicKey", paymentProviderForm.publicKey);
      }
      if (paymentProviderForm.privateKey) {
        formData.append("PrivateKey", paymentProviderForm.privateKey);
      }
      if (paymentProviderForm.hmac) {
        formData.append("Hmac", paymentProviderForm.hmac);
      }
      if (paymentProviderForm.paymentProvider) {
        formData.append("PaymentProvider", paymentProviderForm.paymentProvider);
      }
      if (paymentProviderForm.iframeId) {
        formData.append("IframeId", paymentProviderForm.iframeId);
      }

      // Call the payment provider API
      const response = await axios.post(
        `${backendUrl}/api/PaymentProvider`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Payment provider response:", response.data);

      const statusOk =
        response?.data?.statuscode === 200 || response?.data?.statuscode === 0;
      if (statusOk) {
        toast.success("Payment provider added successfully");

        // Reset form and refresh payment providers
        setPaymentProviderForm({
          name: "",
          apiEndpoint: "",
          publicKey: "",
          privateKey: "",
          hmac: "",
          paymentProvider: 0,
          iframeId: "",
        });
        setShowAddPaymentProvider(false);
        fetchPaymentProviders();
      } else {
        const errorMessage =
          response?.data?.responseBody?.message ||
          "Failed to add payment provider";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error adding payment provider:", error);

      // Extract error message from response if available
      const errorResponse = error.response?.data;
      const errorMessage =
        errorResponse?.responseBody?.message ||
        errorResponse?.responseBody?.errors?.messages?.[0] ||
        "Failed to add payment provider";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle product selection
  const handleProductSelect = async (product) => {
    setSelectedProduct(product);
    setSelectedVariant(null); // Reset selected variant

    try {
      // Fetch variants directly from the API
      console.log(`Fetching variants for product ID: ${product.id}`);
      const variantsResponse = await axios.get(
        `${backendUrl}/api/Products/${product.id}/Variants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Check if we got valid variants data
      if (
        variantsResponse.data &&
        (variantsResponse.data.statuscode === 0 ||
          variantsResponse.data.statuscode === 200) &&
        variantsResponse.data.responseBody &&
        variantsResponse.data.responseBody.data &&
        Array.isArray(variantsResponse.data.responseBody.data) &&
        variantsResponse.data.responseBody.data.length > 0
      ) {
        // Store all variants for this product
        const variants = variantsResponse.data.responseBody.data;
        console.log(`Found ${variants.length} variants for product:`);

        // Update the product object with the variants
        const updatedProduct = { ...product, productVariants: variants };
        setSelectedProduct(updatedProduct);

        // Select the first variant by default
        const firstVariant = variants[0];
        handleVariantSelect(firstVariant);
        toast.success(`Found ${variants.length} variant(s) for this product`);
      } else {
        // No variants found or invalid response
        console.log("No variants found or invalid response structure");

        // Create a default variant
        const defaultVariant = {
          id: 0,
          size: 0,
          color: "Default",
          quantity: product.quantity || 10,
          isActive: true,
          waist: 0,
          length: 0,
          productId: product.id,
        };

        const updatedProduct = {
          ...product,
          productVariants: [defaultVariant],
        };
        setSelectedProduct(updatedProduct);
        setSelectedVariant(defaultVariant);

        toast.warning(
          "No variants available for this product. Using default variant."
        );
      }
    } catch (error) {
      console.error("Error fetching variants:", error);

      // Create a default variant on error
      const defaultVariant = {
        id: 0,
        size: 0,
        color: "Default",
        quantity: product.quantity || 10,
        isActive: true,
        waist: 0,
        length: 0,
        productId: product.id,
      };

      const updatedProduct = { ...product, productVariants: [defaultVariant] };
      setSelectedProduct(updatedProduct);
      setSelectedVariant(defaultVariant);

      toast.error("Failed to load product variants. Using default variant.");
    }
  };

  // Handle variant selection
  const handleVariantSelect = (variant) => {
    console.log("Selected variant:", variant);
    setSelectedVariant(variant);
    toast.success(
      `Selected variant: ${variant.color || "Default"} - Size: ${variant.size || "N/A"}`
    );
  };

  // Test variant selection functionality
  const testVariantSelection = () => {
    if (
      !selectedProduct ||
      !selectedProduct.productVariants ||
      selectedProduct.productVariants.length === 0
    ) {
      toast.error("Please select a product with variants first");
      return;
    }

    // Log current state for debugging
    console.log("Testing variant selection with product:", selectedProduct);
    console.log("Available variants:", selectedProduct.productVariants);

    // Try each variant in sequence
    let currentIndex = 0;

    const testNextVariant = () => {
      if (currentIndex < selectedProduct.productVariants.length) {
        const variant = selectedProduct.productVariants[currentIndex];
        console.log(
          `Testing variant ${currentIndex + 1}/${selectedProduct.productVariants.length}:`,
          variant
        );
        handleVariantSelect(variant);
        currentIndex++;
        setTimeout(testNextVariant, 1500); // Wait 1.5 seconds before testing next variant
      } else {
        toast.success("Variant testing completed");
      }
    };

    toast.info("Starting variant test sequence");
    testNextVariant();
  };

  // Test variant loading with different products
  const testProductVariantLoading = () => {
    if (products.length === 0) {
      toast.error("No products available to test");
      return;
    }

    // Get active products only
    const activeProducts = products.filter((p) => p.isActive);
    if (activeProducts.length === 0) {
      toast.error("No active products available to test");
      return;
    }

    toast.info(
      `Testing variant loading for ${Math.min(5, activeProducts.length)} products...`
    );
    console.log(
      `Starting product variant loading test for ${Math.min(5, activeProducts.length)} products`
    );

    // Test up to 5 products
    const productsToTest = activeProducts.slice(0, 5);

    let productIndex = 0;

    const testNextProduct = () => {
      if (productIndex < productsToTest.length) {
        const product = productsToTest[productIndex];
        console.log(
          `Testing product ${productIndex + 1}/${productsToTest.length}: ${product.name}`
        );
        toast.info(`Testing product ${productIndex + 1}: ${product.name}`);

        // Select the product
        handleProductSelect(product);
        productIndex++;

        // Wait 2 seconds before testing next product
        setTimeout(testNextProduct, 2000);
      } else {
        toast.success(
          `Completed testing variant loading for ${productsToTest.length} products`
        );
      }
    };

    toast.info("Starting product test sequence");
    testNextProduct();
  };

  // Debug API response structure
  const debugApiResponse = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product first");
      return;
    }

    try {
      console.log("=== DEBUGGING API RESPONSE ===");
      console.log("Product ID:", selectedProduct.id);
      console.log("Product Name:", selectedProduct.name);

      const response = await axios.get(
        `${backendUrl}/api/Products/${selectedProduct.id}/Variants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("=== FULL API RESPONSE ===");
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      console.log("Response data:", response.data);

      console.log("=== RESPONSE STRUCTURE ANALYSIS ===");
      console.log("Has statuscode:", "statuscode" in response.data);
      console.log("Statuscode value:", response.data.statuscode);
      console.log(
        "Statuscode is valid (0 or 200):",
        response.data.statuscode === 0 || response.data.statuscode === 200
      );
      console.log("Has responseBody:", "responseBody" in response.data);
      console.log("ResponseBody type:", typeof response.data.responseBody);

      if (response.data.responseBody) {
        console.log(
          "ResponseBody keys:",
          Object.keys(response.data.responseBody)
        );
        console.log("Has data:", "data" in response.data.responseBody);
        console.log("Data type:", typeof response.data.responseBody.data);
        console.log(
          "Data is array:",
          Array.isArray(response.data.responseBody.data)
        );

        if (Array.isArray(response.data.responseBody.data)) {
          console.log("Data length:", response.data.responseBody.data.length);
          if (response.data.responseBody.data.length > 0) {
            console.log(
              "First variant structure:",
              response.data.responseBody.data[0]
            );
            console.log(
              "First variant keys:",
              Object.keys(response.data.responseBody.data[0])
            );
            console.log("First variant details:", {
              id: response.data.responseBody.data[0].id,
              color: response.data.responseBody.data[0].color,
              size: response.data.responseBody.data[0].size,
              quantity: response.data.responseBody.data[0].quantity,
              isActive: response.data.responseBody.data[0].isActive,
            });
          }
        } else {
          console.log(
            "Data is not an array, it's:",
            typeof response.data.responseBody.data
          );
          console.log("Data value:", response.data.responseBody.data);
        }
      }

      toast.success("API response debug info logged to console");
    } catch (error) {
      console.error("=== API ERROR DEBUG ===");
      console.error("Error:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);

      toast.error("API error debug info logged to console");
    }
  };

  // Add item to cart
  const addToCart = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    if (!selectedVariant) {
      toast.error("Please select a product variant");
      return;
    }

    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    try {
      // Define the request payload
      const payload = {
        productId: selectedProduct.id,
        quantity: quantity,
        productVariantId: selectedVariant.id,
      };

      // Define the request headers
      const headers = {
        "Content-Type": "application/json-patch+json",
        Authorization: `Bearer ${token}`,
      };

      // Single server call – no local fallback or local cart mode
      const endpoint = `${backendUrl}/api/Cart/items`;
      console.log("Adding to cart via:", endpoint, payload);
      const response = await axios.post(endpoint, payload, { headers });
      console.log("Add to cart response:", response.data);

      const ok =
        response?.data?.statuscode === 0 || response?.data?.statuscode === 200;
      const serverAffirmative =
        response?.data?.responseBody?.data === true ||
        response?.data?.responseBody?.data === "true";

      if (ok && serverAffirmative) {
        // Update UI cart to reflect server state (can be replaced with fetch cart API)
        const serverItem = {
          product: selectedProduct,
          variant: selectedVariant,
          quantity: quantity,
          price: selectedProduct.price,
          totalPrice: selectedProduct.price * quantity,
        };
        setCartItems([...cartItems, serverItem]);
        toast.success(
          response.data.responseBody?.message || "Product added to cart"
        );

        // Reset selection
        setSelectedProduct(null);
        setSelectedVariant(null);
        setQuantity(1);

        // Cart now visible in the single-page layout
      } else {
        const apiMsg = response?.data?.responseBody?.message;
        toast.error(apiMsg || "Failed to add product to cart");
      }
    } catch (error) {
      console.error("Error in addToCart:", error);
      const status = error?.response?.status;
      const msg = error?.response?.data?.responseBody?.message || error.message;
      if (status === 401) toast.error("Unauthorized. Please login again.");
      else if (status === 404) toast.error("Cart API not found (404)");
      else if (status === 500)
        toast.error("Server error while adding to cart (500)");
      else toast.error(msg || "Failed to add product to cart");
    }
  };

  // Remove item from cart
  const removeFromCart = async (index) => {
    try {
      // Update local state first for immediate UI feedback
      const updatedCart = [...cartItems];
      const removedItem = updatedCart[index];
      updatedCart.splice(index, 1);
      setCartItems(updatedCart);

      // Try to sync with backend if available
      if (backendUrl && token && removedItem?.product?.id) {
        try {
          // Note: This is a placeholder as we don't know the exact endpoint
          // We would need to implement this when we know the correct endpoint
          // For now, we'll just show a warning that it's only removed locally
          toast.warning(
            "Item removed from local cart only. Server sync unavailable."
          );
        } catch (apiError) {
          console.error("Error removing from cart on server:", apiError);
          toast.warning(
            "Item removed from local cart only. Server sync failed."
          );
        }
      } else {
        toast.success("Item removed from cart");
      }

      // Cart is now always visible in the single-page layout
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Failed to remove item from cart");
    }
  };

  // Fetch the latest product variant stock information
  const fetchLatestVariantStock = async (productId, variantId) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/Products/${productId}/variants/${variantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const ok =
        response?.data?.statuscode === 200 || response?.data?.statuscode === 0;
      if (ok && response?.data?.responseBody?.data) {
        return response.data.responseBody.data;
      }
      return null;
    } catch (error) {
      console.error(
        `Error fetching variant ${variantId} for product ${productId}:`,
        error
      );
      return null;
    }
  };

  // Check if products in cart have sufficient stock
  const checkProductAvailability = async () => {
    try {
      // Check all items in parallel for speed
      const results = await Promise.all(
        cartItems.map(async (item) => {
          if (!item.product || !item.variant) return { ok: true };
          const latestVariant = await fetchLatestVariantStock(
            item.product.id,
            item.variant.id
          );
          const currentQuantity = latestVariant
            ? latestVariant.quantity
            : item.variant.quantity;
          const ok = currentQuantity >= item.quantity;
          return { ok, item, currentQuantity };
        })
      );

      const failed = results.find((r) => r && r.ok === false);
      if (failed) {
        const { item, currentQuantity } = failed;
        toast.error(
          `Not enough stock for ${item.product.name} (${item.variant.color || "Default"}). Only ${currentQuantity} available.`
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking product availability:", error);
      toast.error("Could not verify product availability");
      return false;
    }
  };

  // Place order
  const placeOrder = async () => {
    // Check if products have sufficient stock before placing order
    const hasStock = await checkProductAvailability();
    if (!hasStock) {
      toast.error("Cannot place order due to insufficient stock");
      return;
    }

    // Check if cart is empty
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate payment method
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    // Step 1: Checkout cart on the server (then order, then payment)
    toast.info("Checking out your cart...");
    try {
      const coResp = await axios.post(
        `${backendUrl}/api/Cart/checkout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const coOk =
        coResp?.data?.statuscode === 200 || coResp?.data?.statuscode === 0;
      if (!coOk) {
        const coMsg =
          coResp?.data?.responseBody?.message || "Checkout failed";
        toast.error(coMsg);
        return;
      }
      toast.success(
        coResp?.data?.responseBody?.message || "Checkout successful"
      );
    } catch (coError) {
      console.error("Checkout API error:", coError?.response?.data || coError);
      const coMsg =
        coError?.response?.data?.responseBody?.message ||
        coError?.message ||
        "Could not complete checkout";
      toast.error(coMsg);
      return;
    }

    // Validate address data
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    const selectedAddress = addresses.find(
      (a) => String(a.id) === String(selectedAddressId)
    );
    if (!selectedAddress) {
      toast.error("Selected address not found");
      return;
    }

    // Check if address has required fields
    const requiredFields = ["country", "city", "streetAddress", "postalCode"];
    const missingFields = requiredFields.filter(
      (field) => !selectedAddress[field]
    );

    if (missingFields.length > 0) {
      toast.error(
        `Address is missing required information: ${missingFields.join(", ")}`
      );
      return;
    }

    setLoading(true);
    try {
      // Resolve selected payment method id for Order API
      const selectedMethodForOrder = paymentMethods.find((method) => {
        const selStr = (selectedPaymentMethod ?? "").toString().toLowerCase();
        const byName = (method?.name ?? "").toString().toLowerCase() === selStr;
        const byMethodName = (method?.paymentMethod ?? "").toString().toLowerCase() === selStr;
        const selNum = Number(selectedPaymentMethod);
        const byId = Number(method?.id) === selNum;
        return byName || byMethodName || byId;
      });
      const paymentMethodIdForOrder = Number(selectedMethodForOrder?.id);
      if (!Number.isFinite(paymentMethodIdForOrder) || paymentMethodIdForOrder <= 0) {
        toast.error("Invalid payment method selection for order");
        return;
      }

      // Create order payload according to API schema
      const orderData = {
        addressId: parseInt(selectedAddressId),
        notes: notes || "",
        paymentMethodId: paymentMethodIdForOrder,
      };

      console.log("Payload to /api/Order:", orderData);

      const response = await axios.post(`${backendUrl}/api/Order`, orderData, {
        headers: {
          "Content-Type": "application/json-patch+json",
          Accept: "text/plain",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Order create response:", response.data);

      const statusOk =
        response?.data?.statuscode === 201 || response?.data?.statuscode === 0;
      if (statusOk) {
        // Extract order information from the response
        const responseBody = response.data.responseBody || {};
        const orderData = responseBody.data || {};
        const orderInfo = orderData.order || {};

        // Try to extract order ID from multiple possible locations in the response
        let orderId = null;
        if (orderInfo.id) {
          orderId = orderInfo.id;
        } else if (orderData.id) {
          orderId = orderData.id;
        } else if (orderInfo.orderId) {
          orderId = orderInfo.orderId;
        } else if (responseBody.id) {
          orderId = responseBody.id;
        } else if (typeof responseBody === "object" && responseBody !== null) {
          // Last resort: look for any property that might contain the order ID
          for (const key of ["order_id", "orderID", "OrderId", "order_ID"]) {
            if (responseBody[key]) {
              orderId = responseBody[key];
              break;
            }
          }
        }

        console.log("Extracted order ID:", orderId);

        // Get order number for display purposes
        const orderNumber = orderInfo.orderNumber || orderId;

        if (orderNumber) {
          toast.success(`Order #${orderNumber} created successfully!`);
        } else {
          toast.success("Order created successfully");
        }

        // Process payment for the created order
        if (orderId) {
          console.log("Processing payment for order ID:", orderId);
          const paymentSuccess = await processPayment(orderId, orderNumber);
          if (paymentSuccess) {
            // Navigate to orders page after successful payment
            navigate("/orders");
          }
        } else {
          console.error("Order ID not found in response:", response.data);
          toast.error("Order ID not found in response, cannot process payment");
          navigate("/orders");
        }
      } else {
        // Handle different error scenarios based on response
        const apiMsg = response?.data?.responseBody?.message;
        const errorDetails = response?.data?.responseBody?.errors?.messages;
        toast.error(errorDetails?.[0] || apiMsg || "Failed to create order");
      }
    } catch (error) {
      // Surface useful diagnostics
      const status = error?.response?.status;
      const apiBody = error?.response?.data || {};
      console.error("Error creating order:", { status, apiBody, error });

      if (status === 500) {
        // Check for specific stock reduction error
        const errorMessage = apiBody?.responseBody?.message || "";
        const errorDetails = apiBody?.responseBody?.errors?.messages || [];

        if (
          errorMessage.includes("Failed to reduce stock") ||
          errorMessage.includes("Error removing quantity")
        ) {
          toast.error(
            "Not enough stock available for one or more items in your cart"
          );
        } else if (errorDetails.length > 0) {
          toast.error(errorDetails[0]);
        } else {
          toast.error(
            "Server error occurred while placing the order. Please try again later."
          );
        }
      } else if (status === 400) {
        // Handle validation errors
        const errorDetails = apiBody?.responseBody?.errors?.messages || [];
        const errorTitle = apiBody?.responseBody?.errors?.title;

        if (errorDetails.length > 0) {
          toast.error(`Validation error: ${errorDetails[0]}`);
        } else if (errorTitle) {
          toast.error(errorTitle);
        } else {
          toast.error(apiBody?.responseBody?.message || "Invalid order data");
        }
      } else if (status === 401) {
        toast.error("Authentication failed. Please log in again.");
        // Could redirect to login page here
        // navigate("/login");
      } else if (status === 404) {
        const errorMessage = apiBody?.responseBody?.message || "";
        if (errorMessage.includes("address")) {
          toast.error("Address not found. Please select a valid address.");
        } else {
          toast.error("Resource not found");
        }
      } else {
        // Handle any other errors
        const errorDetails = apiBody?.responseBody?.errors?.messages || [];
        if (errorDetails.length > 0) {
          toast.error(errorDetails[0]);
        } else {
          toast.error(
            apiBody?.responseBody?.message ||
              error.message ||
              "Failed to create order"
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Select payment method
  const selectPaymentMethod = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setLoading(true);
    try {
      // Get the selected payment method details
      const selectedMethod = paymentMethods.find((method) => {
        const selStr = (selectedPaymentMethod ?? "").toString().toLowerCase();
        const byName = (method?.name ?? "").toString().toLowerCase() === selStr;
        const byMethodName = (method?.paymentMethod ?? "").toString().toLowerCase() === selStr;
        const selNum = Number(selectedPaymentMethod);
        const byId = Number(method?.id) === selNum;
        return byName || byMethodName || byId;
      });

      if (!selectedMethod) {
        toast.error("Selected payment method not found");
        return;
      }

      // Create form data for the API request
      const formData = new FormData();
      formData.append("Name", selectedMethod.name);
      formData.append("paymentMethod", selectedMethod.paymentMethod);
      formData.append(
        "PaymentProviderid",
        selectedMethod.paymentProviderid || 0
      );
      formData.append("IsActive", true);
      formData.append("Integrationid", selectedMethod.integrationId || "");

      // Call the payment method API
      const response = await axios.post(
        `${backendUrl}/api/PaymentMethod`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Payment method response:", response.data);

      const statusOk =
        response?.data?.statuscode === 200 || response?.data?.statuscode === 0;
      if (statusOk) {
        toast.success("Payment method selected successfully");

        // Navigate to orders page or show confirmation
        navigate("/orders");
      } else {
        const errorMessage =
          response?.data?.responseBody?.message ||
          "Failed to select payment method";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error selecting payment method:", error);

      // Extract error message from response if available
      const errorResponse = error.response?.data;
      const errorMessage =
        errorResponse?.responseBody?.message ||
        errorResponse?.responseBody?.errors?.messages?.[0] ||
        "Failed to select payment method";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Process payment for an order
  const processPayment = async (orderId, orderNumberFromCreate = null) => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return false;
    }

    if (!orderId) {
      toast.error("Invalid order ID");
      return false;
    }

    // Basic input validations per API schema
    const phoneInput = (walletPhoneNumber || "").trim();
    const e164Regex = /^\+[1-9]\d{9,14}$/; // + followed by 10-15 digits
    // Try to normalize common local formats (Egypt as default based on EGP)
    let normalizedPhone = phoneInput.replace(/\s|-/g, "");
    if (!normalizedPhone.startsWith("+")) {
      // If starts with 0 and length 11 (e.g. 01XXXXXXXXX), convert to +20XXXXXXXXXX
      if (/^0\d{10}$/.test(normalizedPhone)) {
        normalizedPhone = "+20" + normalizedPhone.slice(1);
      } else if (/^20\d{10}$/.test(normalizedPhone)) {
        // If starts with 20XXXXXXXXXX, add leading +
        normalizedPhone = "+" + normalizedPhone;
      }
    }
    if (!e164Regex.test(normalizedPhone)) {
      toast.error(
        "Enter wallet phone in international format e.g. +201XXXXXXXXX"
      );
      return false;
    }

    const currencyCode = (paymentCurrency || "EGP").toUpperCase();
    const isIso3 = /^[A-Z]{3}$/.test(currencyCode);
    if (!isIso3) {
      toast.error("Currency must be a 3-letter code (e.g., EGP)");
      return false;
    }

    setLoading(true);
    try {
      // Get the selected payment method details
      const selectedMethod = paymentMethods.find((method) => {
        const selStr = (selectedPaymentMethod ?? "").toString().toLowerCase();
        const byName = (method?.name ?? "").toString().toLowerCase() === selStr;
        const byMethodName = (method?.paymentMethod ?? "").toString().toLowerCase() === selStr;
        const selNum = Number(selectedPaymentMethod);
        const byId = Number(method?.id) === selNum;
        return byName || byMethodName || byId;
      });

      if (!selectedMethod) {
        toast.error("Selected payment method not found");
        return false;
      }

      // Resolve and validate numeric payment method against Enums API (map name -> id)
      let methodValue = NaN;
      let enumList = [];
      try {
        const enumResp = await axios.get(
          `${backendUrl}/api/Enums/PaymentMethods`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        enumList = enumResp?.data?.responseBody?.data || [];
      } catch (e) {
        console.warn("Could not load payment method enums:", e?.response?.data || e.message);
      }

      const selectedName = (
        selectedMethod?.paymentMethod || selectedMethod?.name || selectedPaymentMethod
      )
        .toString()
        .toLowerCase();

      const enumMatch = enumList.find(
        (e) => (e.name || e.Name || "").toString().toLowerCase() === selectedName
      );
      if (enumMatch) {
        methodValue = Number(enumMatch.id);
      }

      // If not matched by name, and selected value is numeric and exists in enum ids, accept it
      if (!Number.isFinite(methodValue) || methodValue <= 0) {
        const selNum = Number(selectedPaymentMethod);
        const allowed = new Set(
          enumList
            .map((e) => Number(e.id))
            .filter((n) => Number.isFinite(n) && n > 0)
        );
        if (Number.isFinite(selNum) && allowed.has(selNum)) {
          methodValue = selNum;
        }
      }

      if (!Number.isFinite(methodValue) || methodValue <= 0) {
        console.error("Could not resolve valid payment method.", {
          selectedPaymentMethod,
          selectedMethod,
          enumList,
        });
        toast.error("Invalid payment method selection. Please reselect a method.");
        return false;
      }

      console.log("Resolved payment method value:", methodValue, {
        selectedPaymentMethod,
        selectedMethod,
      });

      // Validate order ID format and existence (string required by API schema)
      const orderIdNum = Number(orderId);
      if (!Number.isFinite(orderIdNum)) {
        console.error("Invalid order ID format:", orderId);
        toast.error(
          "Invalid order ID format. API requires a valid numeric ID that can be converted to string."
        );
        return false;
      }

      // We'll resolve orderNumber, required by Payment API
      let orderNumber = orderNumberFromCreate || null;

      // Verify order exists before processing payment
      try {
        const orderCheckResponse = await axios.get(
          `${backendUrl}/api/Order/${String(orderIdNum)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (
          orderCheckResponse?.data?.statuscode !== 200 &&
          orderCheckResponse?.data?.statuscode !== 0
        ) {
          console.error("Order not found in database:", orderIdNum);
          toast.error("Order not found. Cannot process payment.");
          return false;
        }
        // Try to extract orderNumber if not provided
        if (!orderNumber) {
          const orderCheckData = orderCheckResponse?.data?.responseBody?.data;
          const orderCheckInfo = orderCheckData?.order || orderCheckData;
          orderNumber = orderCheckInfo?.orderNumber || String(orderIdNum);
        }
      } catch (error) {
        console.error("Error verifying order:", error);
        toast.error("Could not verify order. Please try again later.");
        return false;
      }

      if (!orderNumber) {
        toast.error("Order number is required but could not be resolved.");
        return false;
      }

      // Create payment payload according to API schema (uses orderNumber)
      const paymentData = {
        orderNumber: String(orderNumber),
        paymentDetails: {
          walletPhoneNumber: normalizedPhone,
          paymentMethod: methodValue,
          currency: currencyCode,
          notes: (paymentNotes || notes || "").toString(),
        },
      };

      // Validate JSON format
      try {
        const jsonString = JSON.stringify(paymentData);
        JSON.parse(jsonString);
        console.log("Payment payload is valid JSON:", jsonString);
      } catch (error) {
        console.error("Invalid JSON format in payment data:", error);
        toast.error("Error in payment data format");
        return false;
      }

      console.log("Payload to /api/Payment:", paymentData);

      // Call the payment API
      try {
        const response = await axios.post(
          `${backendUrl}/api/Payment`,
          paymentData,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Payment response:", response.data);

        const statusOk =
          response?.data?.statuscode === 200 ||
          response?.data?.statuscode === 0;

        if (!statusOk) {
          const errorMessage =
            response?.data?.responseBody?.message || "Unknown payment error";
          console.error(
            "Payment failed with status:",
            response?.data?.statuscode,
            errorMessage
          );
          toast.error(`Payment failed: ${errorMessage}`);
          return false;
        }

        // Handle successful payment
        const responseBody = response.data.responseBody || {};
        const paymentInfo = responseBody.data || {};

        // If redirect URL is provided, navigate to it (prefer same-tab) and stop further navigation
        if (paymentInfo?.redirectUrl) {
          const url = paymentInfo.redirectUrl;
          console.log("Redirect URL provided by payment:", url);
          toast.info("Redirecting to payment gateway...");
          try {
            window.location.assign(url); // same-tab redirect
          } catch (e) {
            console.warn("Same-tab redirect failed, opening new tab:", e);
            window.open(url, "_blank", "noopener,noreferrer");
          }
          // Prevent caller from navigating to /orders while redirecting
          return false;
        } else {
          const successMessage =
            paymentInfo?.message ||
            responseBody?.message ||
            "Payment processed successfully";
          toast.success(successMessage);
          return true;
        }
      } catch (error) {
        console.error(
          "Payment API error:",
          error.response?.data || error.message
        );
        const errorMessage =
          error.response?.data?.responseBody?.message ||
          error.response?.data?.message ||
          "Payment processing failed";
        toast.error(`Payment error: ${errorMessage}`);

        // Handle specific error status codes
        const status = error?.response?.status;
        const apiBody = error?.response?.data || {};
        console.error("Error processing payment:", {
          status,
          apiBody,
          errorMessage: error.message,
          stack: error.stack,
        });

        if (status === 400) {
          toast.error(
            apiBody?.responseBody?.message ||
              "Bad Request: check phone, currency, and method values"
          );
        } else if (status === 401) {
          toast.error("Authentication error. Please log in again.");
          navigate("/login");
        } else if (status === 404) {
          toast.error(
            "Payment endpoint not found or order not found. Please check order ID format."
          );
        } else if (status === 500) {
          toast.error(
            "Server error processing payment. Please try again later."
          );
        } else {
          toast.error(
            apiBody?.responseBody?.message ||
              error.message ||
              "Failed to process payment"
          );
        }
        return false;
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate cart total
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  // Handle new address form changes
  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Submit new customer address to API and select it
  const submitNewAddress = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const payload = { ...addressForm };
      const resp = await axios.post(`${backendUrl}/api/CustomerAddress`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const ok = resp?.data?.statuscode === 201 || resp?.data?.statuscode === 0 || resp?.status === 201;
      const newAddr = resp?.data?.responseBody?.data;
      if (ok && newAddr?.id != null) {
        // Update local list and select new address
        setAddresses((prev) => [newAddr, ...prev]);
        setSelectedAddressId(String(newAddr.id));
        toast.success(resp?.data?.responseBody?.message || "Address added successfully");
        setShowAddAddress(false);
        setAddressForm({
          phoneNumber: "",
          country: "",
          state: "",
          city: "",
          streetAddress: "",
          postalCode: "",
          isDefault: true,
          additionalNotes: "",
        });
      } else {
        const msg = resp?.data?.responseBody?.message || "Failed to add address";
        toast.error(msg);
      }
    } catch (error) {
      console.error("Error adding customer address:", error?.response?.data || error);
      const msg =
        error?.response?.data?.responseBody?.errors?.messages?.[0] ||
        error?.response?.data?.responseBody?.message ||
        error?.message ||
        "Failed to add address";
      toast.error(msg);
    }
  };

  // Render product selection step
  const renderProductSelection = () => {
    // Helper: consider a variant Active if its stock quantity > 0
    const isVariantInStock = (variant) => Number(variant?.quantity || 0) > 0;

    return (
      <div className="space-y-6">
        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Product list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p>Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <p>No products found</p>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`border rounded-md p-4 cursor-pointer transition-all ${selectedProduct?.id === product.id ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-300"}`}
                onClick={() => handleProductSelect(product)}
              >
                {product.images && product.images.length > 0 && (
                  <img
                    src={
                      product.images.find((img) => img.isMain)?.url ||
                      product.images[0].url
                    }
                    alt={product.name}
                    className="w-full h-40 object-cover mb-2 rounded"
                  />
                )}
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-gray-600">
                  {currency} {product.price.toFixed(2)}
                </p>
                {product.isActive ? (
                  <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded mt-2">
                    Active
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded mt-2">
                    Inactive
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Product details and variant selection */}
        {selectedProduct && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-medium text-lg mb-3">{selectedProduct.name}</h3>

            {/* Variant selection */}
            {selectedProduct.productVariants &&
            selectedProduct.productVariants.length > 0 ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Variant
                </label>
                <select
                  value={selectedVariant?.id || ""}
                  onChange={(e) => {
                    const variant = selectedProduct.productVariants.find(
                      (v) => v.id === parseInt(e.target.value)
                    );
                    if (variant) {
                      handleVariantSelect(variant);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a variant...</option>
                  {selectedProduct.productVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.color || "Color N/A"} - Size:{" "}
                      {typeof variant.size === "number"
                        ? variant.size
                        : variant.size || "N/A"}{" "}
                      (Stock: {variant.quantity || 0}){" "}
                      {isVariantInStock(variant) ? "- Active" : "- Inactive"}
                    </option>
                  ))}
                </select>
                {selectedVariant && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded">
                    <div className="flex items-center mb-3">
                      <strong className="mr-2 text-lg">
                        Selected Variant Details:
                      </strong>
                      {selectedVariant.color &&
                        selectedVariant.color !== "Default" && (
                          <div
                            className="w-6 h-6 rounded-full mr-2 border border-gray-300"
                            style={{
                              backgroundColor:
                                selectedVariant.color.toLowerCase(),
                            }}
                            title={selectedVariant.color}
                          ></div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center">
                        <strong className="w-24">Color:</strong>
                        <span className="px-3 py-1 bg-white border border-gray-300 rounded">
                          {selectedVariant.color || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <strong className="w-24">Size:</strong>
                        <span className="px-3 py-1 bg-white border border-gray-300 rounded">
                          {typeof selectedVariant.size === "number"
                            ? selectedVariant.size
                            : selectedVariant.size || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <strong className="w-24">Stock:</strong>
                        <span
                          className={`px-3 py-1 rounded ${(selectedVariant.quantity || 0) > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {selectedVariant.quantity || 0} units
                        </span>
                      </div>

                      <div className="flex items-center">
                        <strong className="w-24">Status:</strong>
                        <span
                          className={`px-3 py-1 rounded ${isVariantInStock(selectedVariant) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {isVariantInStock(selectedVariant) ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {(selectedVariant.waist > 0 ||
                      selectedVariant.length > 0) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <strong className="block mb-2">
                          Additional Measurements:
                        </strong>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedVariant.waist > 0 && (
                            <div className="flex items-center">
                              <strong className="w-24">Waist:</strong>
                              <span className="px-3 py-1 bg-white border border-gray-300 rounded">
                                {selectedVariant.waist}
                              </span>
                            </div>
                          )}
                          {selectedVariant.length > 0 && (
                            <div className="flex items-center">
                              <strong className="w-24">Length:</strong>
                              <span className="px-3 py-1 bg-white border border-gray-300 rounded">
                                {selectedVariant.length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedVariant.id === 0 && (
                      <div className="mt-3 pt-3 border-t border-yellow-200 bg-yellow-50 rounded p-2">
                        <p className="text-yellow-800 text-sm">
                          <strong>Note:</strong> This is a default variant. The
                          product may not have specific variants configured.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="mb-4 text-gray-600">No variants available</p>
            )}

            {/* Quantity selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Add to cart button */}
            <button
              onClick={addToCart}
              disabled={!selectedVariant || loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add to Cart"}
            </button>

            {/* Test controls - only visible in development mode */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Development Testing Tools
                  </span>
                  <div className="flex space-x-2">
                    {selectedProduct && (
                      <button
                        onClick={debugApiResponse}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Debug API Response
                      </button>
                    )}
                    {selectedProduct &&
                      selectedProduct.productVariants &&
                      selectedProduct.productVariants.length > 0 && (
                        <button
                          onClick={testVariantSelection}
                          className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Test All Variants
                        </button>
                      )}
                    <button
                      onClick={testProductVariantLoading}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Test Product Loading
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Render cart step
  const renderCart = () => {
    return (
      <div className="space-y-6">
        {cartItems.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <div className="space-y-4">
            {/* Cart items */}
            {cartItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 border rounded-md"
              >
                <div className="flex items-center space-x-4">
                  {item.product.images && item.product.images.length > 0 && (
                    <img
                      src={
                        item.product.images.find((img) => img.isMain)?.url ||
                        item.product.images[0].url
                      }
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-sm text-gray-600">
                      Variant: {item.variant.color} - Size: {item.variant.size}
                    </p>
                    <p className="text-sm">
                      {currency} {item.price.toFixed(2)} x {item.quantity} ={" "}
                      {currency} {item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(index)}
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
            ))}

            {/* Cart total */}
            <div className="p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>
                  {currency} {calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Cart actions */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <button
            onClick={placeOrder}
            disabled={
              !selectedAddressId ||
              loading ||
              !selectedPaymentMethod ||
              cartItems.length === 0
            }
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>
    );
  };

  // Render checkout step
  const renderCheckout = () => {
    return (
      <div className="space-y-6">
        {/* Address selection grid */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Delivery Address
          </label>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Choose an existing address or add a new one.</span>
            <button
              type="button"
              onClick={() => setShowAddAddress((s) => !s)}
              className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {showAddAddress ? "Close" : "Add Address"}
            </button>
          </div>

          {showAddAddress && (
            <form onSubmit={submitNewAddress} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 mb-4 border rounded-md bg-gray-50">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Phone Number</label>
                <input name="phoneNumber" value={addressForm.phoneNumber} onChange={handleAddressFormChange} className="w-full border rounded px-2 py-1" placeholder="e.g. +201234567890" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Country</label>
                <input name="country" value={addressForm.country} onChange={handleAddressFormChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">State</label>
                <input name="state" value={addressForm.state} onChange={handleAddressFormChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">City</label>
                <input name="city" value={addressForm.city} onChange={handleAddressFormChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Street Address</label>
                <input name="streetAddress" value={addressForm.streetAddress} onChange={handleAddressFormChange} className="w-full border rounded px-2 py-1" placeholder="Street, building, apartment" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Postal Code</label>
                <input name="postalCode" value={addressForm.postalCode} onChange={handleAddressFormChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isDefault" name="isDefault" checked={!!addressForm.isDefault} onChange={handleAddressFormChange} />
                <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default</label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Additional Notes</label>
                <textarea name="additionalNotes" value={addressForm.additionalNotes} onChange={handleAddressFormChange} className="w-full border rounded px-2 py-1" rows={2} />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddAddress(false)} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700">Save Address</button>
              </div>
            </form>
          )}
          {addresses.length === 0 ? (
            <p className="text-red-500">
              No addresses available. Please add an address first.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {addresses.map((address) => {
                const isSelected =
                  String(selectedAddressId) === String(address.id);
                return (
                  <button
                    type="button"
                    key={address.id}
                    onClick={() => setSelectedAddressId(String(address.id))}
                    className={`text-left p-4 border rounded-md transition-all hover:border-blue-400 hover:bg-blue-50 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-medium">
                        {address.addressType || "Address"}
                        {address.isDefault && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
                            Default
                          </span>
                        )}
                      </div>
                      <div
                        className={`ml-2 text-xs px-2 py-0.5 rounded ${(selectedAddressId === address.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700")}`}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      {address.fullAddress ? (
                        <div>{address.fullAddress}</div>
                      ) : (
                        <>
                          <div>{address.streetAddress}</div>
                          {address.apartmentSuite && (
                            <div>{address.apartmentSuite}</div>
                          )}
                          <div>
                            {address.city}
                            {address.city &&
                            (address.state || address.postalCode)
                              ? ", "
                              : ""}
                            {address.state} {address.postalCode}
                          </div>
                          {address.country && <div>{address.country}</div>}
                        </>
                      )}
                      {address.phoneNumber && (
                        <div className="mt-1 text-gray-600">
                          Phone: {address.phoneNumber}
                        </div>
                      )}
                      {address.additionalNotes && (
                        <div className="mt-1 text-gray-500">
                          Notes: {address.additionalNotes}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Order notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows="3"
            placeholder="Add any special instructions or notes"
          ></textarea>
        </div>

        {/* Order summary */}
        <div className="p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium mb-2">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Items ({cartItems.length}):</span>
              <span>
                {currency} {calculateTotal().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total:</span>
              <span>
                {currency} {calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render payment method selection step
  const renderPaymentSelection = () => {
    return (
      <div className="space-y-6">
        {/* Payment method selection */}
        <div className="mb-4">
          {paymentMethods.length === 0 ? (
            <p className="text-red-500">No payment methods available.</p>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`payment-${method.id}`}
                    name="paymentMethod"
                    value={method.paymentMethod ?? method.name ?? method.id}
                    checked={
                      selectedPaymentMethod ===
                      (method.paymentMethod ?? method.name ?? method.id)
                    }
                    onChange={() =>
                      setSelectedPaymentMethod(
                        method.paymentMethod ?? method.name ?? method.id
                      )
                    }
                    className="mr-2"
                  />
                  <label
                    htmlFor={`payment-${method.id}`}
                    className="flex-grow cursor-pointer"
                  >
                    {method.name || method.paymentMethod} - {method.paymentMethod || method.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wallet Phone Number
            </label>
            <input
              type="tel"
              value={walletPhoneNumber}
              onChange={(e) => setWalletPhoneNumber(e.target.value)}
              placeholder="e.g., 01012345678"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency (ISO 4217)
            </label>
            <input
              type="text"
              value={paymentCurrency}
              onChange={(e) => setPaymentCurrency(e.target.value.toUpperCase())}
              placeholder="EGP"
              className="w-full p-2 border border-gray-300 rounded-md"
              maxLength={3}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Notes
          </label>
          <input
            type="text"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder="Optional notes for payment"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Place order button */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <button
            onClick={placeOrder}
            disabled={
              !selectedAddressId ||
              loading ||
              !selectedPaymentMethod ||
              cartItems.length === 0
            }
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Place Order"}
          </button>
        </div>

        {/* Payment Provider Management */}
        <div className="mb-6 border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Payment Providers</h3>
            <button
              type="button"
              onClick={() => setShowAddPaymentProvider(!showAddPaymentProvider)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
            >
              {showAddPaymentProvider ? "Cancel" : "Add New Provider"}
            </button>
          </div>

          {/* Payment Provider Form */}
          {showAddPaymentProvider && (
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <h4 className="font-medium mb-3">Add Payment Provider</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={paymentProviderForm.name}
                    onChange={handlePaymentProviderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Endpoint *
                  </label>
                  <input
                    type="text"
                    name="apiEndpoint"
                    value={paymentProviderForm.apiEndpoint}
                    onChange={handlePaymentProviderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Public Key
                  </label>
                  <input
                    type="text"
                    name="publicKey"
                    value={paymentProviderForm.publicKey}
                    onChange={handlePaymentProviderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Private Key
                  </label>
                  <input
                    type="password"
                    name="privateKey"
                    value={paymentProviderForm.privateKey}
                    onChange={handlePaymentProviderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HMAC
                  </label>
                  <input
                    type="text"
                    name="hmac"
                    value={paymentProviderForm.hmac}
                    onChange={handlePaymentProviderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Provider Type
                  </label>
                  <input
                    type="number"
                    name="paymentProvider"
                    value={paymentProviderForm.paymentProvider}
                    onChange={handlePaymentProviderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Iframe ID
                  </label>
                  <input
                    type="text"
                    name="iframeId"
                    value={paymentProviderForm.iframeId}
                    onChange={handlePaymentProviderFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={submitPaymentProvider}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Save Payment Provider"}
                </button>
              </div>
            </div>
          )}

          {/* Payment Providers List */}
          <div className="mt-2">
            {paymentProviders.length === 0 ? (
              <p className="text-gray-500 italic">
                No payment providers available.
              </p>
            ) : (
              <div className="bg-white border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        API Endpoint
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentProviders.map((provider) => (
                      <tr key={provider.id}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {provider.name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {provider.apiEndpoint}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {new Date(provider.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div className="p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium mb-2">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Items ({cartItems.length}):</span>
              <span>
                {currency} {calculateTotal().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total:</span>
              <span>
                {currency} {calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Single page layout no longer needs step indicator

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Order</h1>

      <div className="grid grid-cols-1 gap-6">
        {/* Product Selection - Left Column */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Select Products</h2>
          {renderProductSelection()}
        </div>

        {/* Cart and Checkout - Middle Column */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
          {renderCart()}
        </div>

        {/* Payment and Order - Right Column */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Checkout</h2>
            {renderCheckout()}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            {renderPaymentSelection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCreate;
