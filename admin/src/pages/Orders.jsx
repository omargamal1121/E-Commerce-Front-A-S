import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

// Import components
import OrderTable from "../components/orders/OrderTable";
import OrderFilters from "../components/orders/OrderFilters";
import AddOrderForm from "../components/orders/AddOrderForm";
import ViewOrderModal from "../components/modals/ViewOrderModal";
import Pagination from "../components/layout/Pagination";

const Orders = ({ token }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrder, setNewOrder] = useState({
    addressId: 0,
    notes: "",
    products: [],
    selectedProduct: {
      productId: "",
      quantity: 1,
      size: "",
      price: 0,
    },
  });
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Status mapping helpers
  const STATUS_LABELS = {
    0: 'PendingPayment',
    1: 'Confirmed',
    2: 'Processing',
    3: 'Shipped',
    4: 'Delivered',
    5: 'CancelledByUser',
    6: 'Refunded',
    7: 'Returned',
    8: 'PaymentExpired',
    9: 'CancelledByAdmin',
    10: 'Complete',
  };

  const labelToCode = (val) => {
    if (Number.isFinite(val)) return val;
    const s = String(val || '').trim().toLowerCase();
    const match = Object.entries(STATUS_LABELS).find(([, label]) => label.toLowerCase() === s);
    return match ? Number(match[0]) : undefined;
  };

  // Helper function to normalize order data from API response
  const normalizeOrderData = (d) => {
    const paymentStatusMap = {
      0: 'PendingPayment',
      1: 'Confirmed',
      2: 'Processing',
      3: 'Shipped',
      4: 'Delivered',
      5: 'CancelledByUser',
      6: 'Refunded',
      7: 'Returned',
      8: 'PaymentExpired',
      9: 'CancelledByAdmin',
      10: 'Complete',
    };

    return {
      _id: d.id,
      id: d.id,
      orderNumber: d.orderNumber,
      date: d.createdAt,
      status: d.statusDisplay || d.status,
      customerName: d.customer?.fullName || 'N/A',
      customerEmail: d.customer?.email || 'N/A',
      customerPhone: d.customer?.phoneNumber || 'N/A',
      subtotal: d.subtotal || 0,
      taxAmount: d.taxAmount || 0,
      shippingCost: d.shippingCost || 0,
      discountAmount: d.discountAmount || 0,
      total: d.total || 0,
      notes: d.notes || 'No notes',
      items: d.items?.map(item => ({
        name: item.product?.name || 'N/A',
        quantity: item.quantity,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
        image: item.product?.mainImageUrl || '',
        variant: item.product?.productVariantForCartDto ?
          `${item.product.productVariantForCartDto.color || ''} ${item.product.productVariantForCartDto.size || ''}`.trim() : '',
        price: item.unitPrice ?? item.product?.finalPrice ?? item.product?.price ?? 0,
        size: item.product?.productVariantForCartDto?.size || 'N/A',
        color: item.product?.productVariantForCartDto?.color || 'N/A',
        discountPercentage: item.product?.discountPrecentage || 0,
        originalPrice: item.product?.price || 0
      })) || [],
      payment: d.payment?.map(payment => ({
        amount: payment.amount || 0,
        paymentDate: payment.paymentDate,
        status: paymentStatusMap[payment.status] || payment.status || 'Unknown',
        statusCode: payment.status,
        paymentMethodId: payment.paymentMethodId,
        paymentMethod: payment.paymentMethod || 'N/A'
      })) || [],
      paymentMethod: d.payment?.[0]?.paymentMethod || d.payment?.[0]?.paymentMethod?.name || d.payment?.[0]?.paymentMethodName || 'N/A',
      paymentStatus: d.payment?.[0]?.status ? (paymentStatusMap[d.payment[0].status] || d.payment[0].status) : 'N/A',
      isCancelled: d.isCancelled || false,
      isDelivered: d.isDelivered || false,
      isShipped: d.isShipped || false,
      canBeCancelled: d.canBeCancelled || false,
      canBeReturned: d.canBeReturned || false,
      shippedAt: d.shippedAt,
      deliveredAt: d.deliveredAt,
      cancelledAt: d.cancelledAt,
      address: {
        firstName: d.customer?.fullName || "Customer",
        lastName: "",
        address: d.customer?.customerAddress?.fullAddress || d.customer?.customerAddress?.streetAddress || "",
        city: d.customer?.customerAddress?.city || "",
        state: d.customer?.customerAddress?.state || "",
        zipCode: d.customer?.customerAddress?.postalCode || "",
        phone: d.customer?.customerAddress?.phoneNumber || d.customer?.phoneNumber || "",
        country: d.customer?.customerAddress?.country || "",
        apartmentSuite: d.customer?.customerAddress?.apartmentSuite || "",
        addressType: d.customer?.customerAddress?.addressType || "",
        additionalNotes: d.customer?.customerAddress?.additionalNotes || ""
      },
    };
  };

  // Helper function to fetch order by number using the primary endpoint
  // This endpoint provides complete order data including customer, items, payment, and address details
  const fetchOrderByNumber = async (orderNumber) => {
    const response = await axios.get(
      `${backendUrl}/api/Order/number/${encodeURIComponent(orderNumber)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const d = response?.data?.responseBody?.data;
    if (d) {
      return normalizeOrderData(d);
    }
    return null;
  };

  // Handle product selection
  const handleProductChange = (field, value) => {
    if (field === "productId") {
      const selectedProduct = products.find((p) => p.id === value);
      const price = selectedProduct ? selectedProduct.price : 0;

      setNewOrder({
        ...newOrder,
        selectedProduct: {
          ...newOrder.selectedProduct,
          [field]: value,
          price: price,
        },
      });
    } else {
      setNewOrder({
        ...newOrder,
        selectedProduct: {
          ...newOrder.selectedProduct,
          [field]: value,
        },
      });
    }
  };

  // Add product to order
  const addProductToOrder = () => {
    if (!newOrder.selectedProduct.productId) {
      toast.error("Please select a product");
      return;
    }

    const selectedProductDetails = products.find(
      (p) => p.id === newOrder.selectedProduct.productId
    );

    if (!selectedProductDetails) {
      toast.error("Product not found");
      return;
    }

    const productToAdd = {
      ...newOrder.selectedProduct,
      name: selectedProductDetails.name,
      totalPrice: newOrder.selectedProduct.price * newOrder.selectedProduct.quantity,
    };

    setNewOrder({
      ...newOrder,
      products: [...newOrder.products, productToAdd],
      selectedProduct: {
        productId: "",
        quantity: 1,
        size: "",
        price: 0,
      },
    });
  };

  // Remove product from order
  const removeProductFromOrder = (index) => {
    const updatedProducts = [...newOrder.products];
    updatedProducts.splice(index, 1);
    setNewOrder({
      ...newOrder,
      products: updatedProducts,
    });
  };

  // Handle input change for add order form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrder({
      ...newOrder,
      [name]: name === "addressId" ? parseInt(value) : value,
    });
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  // Handle add order form submission
  const handleAddOrder = async (e) => {
    e.preventDefault();

    if (!newOrder.addressId) {
      toast.error("Please select a delivery address");
      return;
    }

    if (newOrder.products.length === 0) {
      toast.error("Please add at least one product to the order");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        addressId: newOrder.addressId,
        notes: newOrder.notes,
        orderItems: newOrder.products.map((product) => ({
          productId: product.productId,
          quantity: product.quantity,
          size: product.size || "N/A",
          price: product.price,
        })),
      };

      console.log("Submitting order data:", orderData);
      const response = await API.orders.create(orderData, token);

      if (response && response.statuscode === 200) {
        toast.success("Order created successfully!");
        setShowAddModal(false);
        setNewOrder({
          addressId: 0,
          notes: "",
          products: [],
          selectedProduct: {
            productId: "",
            quantity: 1,
            size: "",
            price: 0,
          },
        });
        fetchAllOrders(false);
      } else {
        const errorMessage = response?.responseBody?.message || "Unknown error occurred";
        toast.error(`Failed to create order: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.responseBody?.message ||
        error.response?.data?.message ||
        error.message ||
        "Unknown error occurred";
      toast.error(`Failed to create order: ${errorMessage}`);
      console.error("Order creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle view order details
  const handleViewOrder = async (orderId, orderNumber) => {
    console.log('Viewing order:', { orderId, orderNumber });
    setLoading(true);

    try {
      // Primary method: Fetch by order number using the dedicated endpoint
      if (orderNumber) {
        try {
          console.log('Fetching order by number:', orderNumber);
          const normalizedOrder = await fetchOrderByNumber(orderNumber);

          if (normalizedOrder) {
            console.log('Order details from API:', normalizedOrder);
            console.log('Payment data:', normalizedOrder.payment);
            console.log('Payment method:', normalizedOrder.paymentMethod);
            console.log('Payment status:', normalizedOrder.paymentStatus);
            setSelectedOrder(normalizedOrder);
            setShowViewModal(true);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error fetching order by number:', error);
          toast.error('Failed to load order details. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Fallback: Try to find in current orders state
      const foundInState = orders.find(o =>
        String(o.id) === String(orderId) ||
        String(o._id) === String(orderId) ||
        o.orderNumber === orderNumber
      );

      if (foundInState) {
        console.log('Found order in state:', foundInState);
        setSelectedOrder(foundInState);
        setShowViewModal(true);
        setLoading(false);
        return;
      }

      // Final fallback: If no order number available, show error
      toast.error('Could not load order details. Order number is required.');
      console.error('Order not found - order number required:', { orderId, orderNumber });

    } catch (error) {
      console.error('Error in handleViewOrder:', error);
      toast.error('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOrders = useCallback(async (includeDetails = false) => {
    if (!token) {
      return null;
    }
    try {
      setOrdersLoading(true);
      // Try the new Fashion-main API endpoint first
      try {
        const fashionMainResponse = await axios.get(`${backendUrl}/api/Order`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { pageSize: 1000 }, // Fetch more orders for client-side pagination
        });
        const apiData = fashionMainResponse?.data?.responseBody?.data;
        console.log("Fashion-main response:", apiData);
        if (Array.isArray(apiData)) {
          // Transform API response into table-friendly structure
          const transformedOrders = apiData.map((order) => {
            const hasDetailed = !!order.orderItems || !!order.customerAddress;
            if (hasDetailed) {
              return {
                _id: order.id,
                items:
                  order.orderItems?.map((item) => ({
                    name: item.productName,
                    quantity: item.quantity,
                    size: item.size || "N/A",
                    price: item.price,
                  })) || [],
                address: {
                  firstName: order.customerAddress?.firstName || "N/A",
                  lastName: order.customerAddress?.lastName || "",
                  address: order.customerAddress?.addressLine || "N/A",
                  city: order.customerAddress?.city || "N/A",
                  state: order.customerAddress?.state || "N/A",
                  zipCode: order.customerAddress?.postalCode || "N/A",
                  phone: order.customerAddress?.phoneNumber || "N/A",
                },
                paymentMethod: order.paymentMethod || "N/A",
                date: order.orderDate || order.createdAt || new Date().toISOString(),
                amount: order.totalAmount ?? order.total ?? 0,
                status: order.status,
                orderNumber: order.orderNumber,
              };
            }
            // Summary shape
            return {
              _id: order.id,
              items: [],
              address: {
                firstName: order.customerName || "Customer",
                lastName: "",
                address: "",
                city: "",
                state: "",
                zipCode: "",
                phone: "",
              },
              paymentMethod: "N/A",
              date: order.createdAt || new Date().toISOString(),
              amount: order.total ?? 0,
              status: order.status,
              orderNumber: order.orderNumber,
            };
          });

          if (includeDetails) {
            // Optional slow enrichment (disabled by default for speed)
            try {
              const detailedList = await Promise.all(
                apiData.map(async (o) => {
                  try {
                    const detailResp = await axios.get(
                      `${backendUrl}/api/Order/${encodeURIComponent(o.id)}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const detail = detailResp?.data?.responseBody?.data;
                    if (!detail) return null;
                    const items = Array.isArray(detail.items)
                      ? detail.items.map((it) => ({
                        name: it.product?.name || it.name || "Item",
                        quantity: it.quantity || 0,
                        size:
                          it.product?.productVariantForCartDto?.size || it.size || "N/A",
                        price:
                          it.unitPrice ?? it.product?.finalPrice ?? it.product?.price ?? it.price ?? 0,
                      }))
                      : Array.isArray(detail.orderItems)
                        ? detail.orderItems.map((it) => ({
                          name: it.productName || it.name || "Item",
                          quantity: it.quantity || 0,
                          size: it.size || "N/A",
                          price: it.price || 0,
                        }))
                        : [];
                    const pm0 = Array.isArray(detail.payment) ? detail.payment[0] : null;
                    const paymentMethod =
                      pm0?.paymentMethod?.name ||
                      pm0?.paymentMethod?.paymentMethod ||
                      detail.paymentMethod ||
                      detail.paymentMethodName ||
                      "N/A";
                    return { id: o.id, items, paymentMethod };
                  } catch {
                    return null;
                  }
                })
              );

              const byId = new Map(
                detailedList.filter(Boolean).map((d) => [String(d.id), d])
              );
              const merged = transformedOrders.map((t) => {
                const d = byId.get(String(t._id));
                if (!d) return t;
                return {
                  ...t,
                  items: d.items?.length ? d.items : t.items,
                  paymentMethod: d.paymentMethod || t.paymentMethod,
                };
              });
              setOrders(merged);
            } catch (mergeErr) {
              console.warn("Could not enrich orders with details:", mergeErr);
              setOrders(transformedOrders);
            }
          } else {
            setOrders(transformedOrders);
          }
          // Reset to page 1 when new data is loaded
          setCurrentPage(1);
          return;
        }
      } catch (fashionMainError) {
        console.log("Fashion-main API error:", fashionMainError);
      }

      // Fallback to original API
      const response = await axios.post(
        backendUrl + "/api/order/list",
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        setOrders(response.data.orders);
        // Reset to page 1 when new data is loaded
        setCurrentPage(1);
      } else {
        toast.error(response.data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.log("Error fetching orders:", error);
      toast.error(error.message || "Failed to fetch orders");
    } finally {
      setOrdersLoading(false);
    }
  }, [token]);

  const statusHandler = async (orderId, event) => {
    try {
      const raw = event?.target?.value;
      const newStatus = Number(raw);

      if (!Number.isFinite(newStatus)) {
        toast.error("Please select a numeric order status (0..10)");
        return;
      }

      const oid = Number(orderId);
      if (!Number.isFinite(oid)) {
        toast.error("Invalid order ID");
        return;
      }

      const putResp = await axios.put(
        `${backendUrl}/api/Order/${oid}/status`,
        { notes: "" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          params: { status: newStatus },
        }
      );

      const ok =
        putResp?.data?.statuscode === 200 ||
        putResp?.data?.statuscode === 0 ||
        putResp?.data?.responseBody?.data === true;
      if (ok) {
        toast.success("Order status updated successfully");
        await fetchAllOrders(false);
        return;
      }

      const msg =
        putResp?.data?.responseBody?.message ||
        putResp?.data?.responseBody?.errors?.messages?.[0] ||
        "Failed to update order status";
      toast.error(msg);

      // Retry sending status in body
      try {
        const altResp = await axios.put(
          `${backendUrl}/api/Order/${oid}/status`,
          { status: newStatus, notes: "" },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        const altOk =
          altResp?.data?.statuscode === 200 ||
          altResp?.data?.statuscode === 0 ||
          altResp?.data?.responseBody?.data === true;
        if (altOk) {
          toast.success("Order status updated successfully");
          await fetchAllOrders(false);
          return;
        }
        const altMsg =
          altResp?.data?.responseBody?.message ||
          altResp?.data?.responseBody?.errors?.messages?.[0] ||
          "Failed to update order status";
        toast.error(altMsg);
      } catch (altErr) {
        console.error("Retry PUT with status in body failed:", altErr?.response?.data || altErr);
        throw altErr;
      }
    } catch (error) {
      const errMsg =
        error?.response?.data?.responseBody?.message ||
        error?.response?.data?.responseBody?.errors?.messages?.[0] ||
        error?.message ||
        "Failed to update order status";
      console.error("PUT /api/Order/{id}/status error:", error);
      toast.error(errMsg);
    }
  };

  // Filter and sort orders based on user selections
  const getFilteredOrders = () => {
    let filtered = [...orders];

    const normalizeAmount = (val) => {
      const raw = val ?? 0;
      if (typeof raw === "number") return raw;
      const num = parseFloat(String(raw).replace(/[^0-9.+-]/g, ""));
      return Number.isFinite(num) ? num : 0;
    };

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((order) => {
        const firstName = String(order.address?.firstName || "");
        const lastName = String(order.address?.lastName || "");
        const customerName = `${firstName} ${lastName}`.trim().toLowerCase();
        const orderId = String(order._id || order.id || "").toLowerCase();
        const orderNumber = String(order.orderNumber || "").toLowerCase();

        const itemsA = Array.isArray(order.items) ? order.items : [];
        const itemsB = Array.isArray(order.orderItems) ? order.orderItems : [];
        const itemNamesMatch = [...itemsA, ...itemsB].some((it) =>
          String(it?.name || it?.productName || "").toLowerCase().includes(term)
        );

        return (
          customerName.includes(term) ||
          orderId.includes(term) ||
          orderNumber.includes(term) ||
          itemNamesMatch
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "") {
      const wanted = Number(statusFilter);
      filtered = filtered.filter((order) => {
        const s = order.status;
        if (Number.isFinite(s)) return Number(s) === wanted;
        const code = labelToCode(s);
        return Number.isFinite(code) ? Number(code) === wanted : false;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "newest": {
        filtered.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        break;
      }
      case "oldest": {
        filtered.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
        break;
      }
      case "amount-high":
      case "highestAmount": {
        filtered.sort((a, b) => {
          const aAmt = normalizeAmount(a.amount ?? a.total ?? 0);
          const bAmt = normalizeAmount(b.amount ?? b.total ?? 0);
          return bAmt - aAmt;
        });
        break;
      }
      case "amount-low":
      case "lowestAmount": {
        filtered.sort((a, b) => {
          const aAmt = normalizeAmount(a.amount ?? a.total ?? 0);
          const bAmt = normalizeAmount(b.amount ?? b.total ?? 0);
          return aAmt - bAmt;
        });
        break;
      }
      default: {
        filtered.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      }
    }

    return filtered;
  };

  // Get filtered orders
  const filteredOrders = getFilteredOrders();

  // Client-side pagination for filtered results
  const itemsPerPage = 10; // Show 10 orders per page
  const totalFilteredPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Change page (client-side pagination)
  const paginate = (pageNumber) => {
    if (ordersLoading) return;
    const target = Math.max(1, Math.min(pageNumber, totalFilteredPages));
    setCurrentPage(target);
  };

  // Fetch customer addresses
  const fetchAddresses = useCallback(async () => {
    if (!token) return;

    try {
      const response = await API.customerAddresses.getAll(token);

      if (response && response.responseBody && response.responseBody.data) {
        setAddresses(response.responseBody.data);
        console.log("Customer addresses loaded:", response.responseBody.data);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load customer addresses");
    }
  }, [token]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!token) return;

    try {
      const response = await API.products.getAll(token);

      if (response && response.responseBody && response.responseBody.data) {
        setProducts(response.responseBody.data);
        console.log("Products loaded:", response.responseBody.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAllOrders(false);
      fetchAddresses();
      fetchProducts();
    }
  }, [token, fetchAllOrders, fetchAddresses, fetchProducts]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">
          Orders Management
        </h2>
        <div className="flex items-center">
          <button
            onClick={() => navigate('/orders/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Order
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <OrderFilters
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        handleStatusFilterChange={handleStatusFilterChange}
        sortBy={sortBy}
        handleSortChange={handleSortChange}
      />

      {/* Results Summary */}
      {(searchTerm || statusFilter !== "") && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {currentOrders.length} of {filteredOrders.length} orders
          {searchTerm && ` matching "${searchTerm}"`}
          {statusFilter !== "" && ` with status ${STATUS_LABELS[statusFilter] || statusFilter}`}
        </div>
      )}

      {/* Orders Table */}
      <OrderTable
        currentOrders={currentOrders}
        filteredOrders={filteredOrders}
        handleViewOrder={handleViewOrder}
        statusHandler={statusHandler}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalFilteredPages}
        paginate={paginate}
      />

      {ordersLoading && (
        <div className="flex justify-center items-center mt-2 text-sm text-gray-600">
          Loading orders...
        </div>
      )}

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Add New Order
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <AddOrderForm
                newOrder={newOrder}
                handleInputChange={handleInputChange}
                handleProductChange={handleProductChange}
                addProductToOrder={addProductToOrder}
                removeProductFromOrder={removeProductFromOrder}
                handleAddOrder={handleAddOrder}
                addresses={addresses}
                products={products}
                loading={loading}
                setShowAddModal={setShowAddModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <ViewOrderModal
          selectedOrder={selectedOrder}
          setShowViewModal={setShowViewModal}
        />
      )}
    </div>
  );
};

export default Orders;