import React, { useEffect, useState, useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  const statusMap = {
    0: 'Pending Payment',
    1: 'Confirmed',
    2: 'Processing',
    3: 'Shipped',
    4: 'Delivered',
    5: 'Cancelled by User',
    6: 'Refunded',
    7: 'Returned',
    8: 'Payment Expired',
    9: 'Cancelled by Admin',
    10: 'Complete'
  };

  // Helper function to check if status is pending payment
  const isPendingPayment = (status) => {
    if (typeof status === 'number') {
      return status === 0;
    }
    if (typeof status === 'string') {
      const normalizedStatus = status.toLowerCase().replace(/\s+/g, '');
      return ['pendingpayment', 'pending'].includes(normalizedStatus);
    }
    return false;
  };

  // Helper function to check if status is confirmed
  const isConfirmed = (status) => {
    if (typeof status === 'number') {
      return status === 1;
    }
    if (typeof status === 'string') {
      const normalizedStatus = status.toLowerCase().replace(/\s+/g, '');
      return normalizedStatus === 'confirmed';
    }
    return false;
  };

  // Helper function to get status display text
  const getStatusDisplay = (status) => {
    // If status is already a string, return it
    if (typeof status === 'string') {
      return status;
    }
    // If it's numeric, use the mapping
    return statusMap[status] || `Status ${status}`;
  };

  // Helper function to get status color class
  const getStatusColorClass = (status) => {
    const statusStr = typeof status === 'string' ? status.toLowerCase() : statusMap[status]?.toLowerCase() || '';

    if (statusStr.includes('delivered') || statusStr.includes('complete')) {
      return 'bg-green-100 text-green-800';
    } else if (statusStr.includes('shipped')) {
      return 'bg-blue-100 text-blue-800';
    } else if (statusStr.includes('cancelled') || statusStr.includes('failed') || statusStr.includes('expired')) {
      return 'bg-red-100 text-red-800';
    } else if (statusStr.includes('confirmed') || statusStr.includes('processing')) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const loadOrderData = async (status = statusFilter) => {
    try {
      setLoading(true);
      if (!token) {
        return null
      }

      console.log('Loading order data with status filter:', status);

      // Build query parameters
      let queryParams = 'page=1&pageSize=20';
      if (status !== 'All') {
        queryParams += `&status=${status}`;
        console.log('Adding status to query params:', status);
      }

      // First, get the list of orders
      const res = await fetch(`${backendUrl}/api/Order?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const orders = data?.responseBody?.data || [];

      // Then, fetch detailed information for each order to get product details
      const detailedOrders = await Promise.all(
        orders.map(async (order) => {
          try {
            const detailRes = await axios.get(`${backendUrl}/api/Order/${order.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const orderDetail = detailRes.data?.responseBody?.data;
            console.log(`Order ${order.orderNumber}:`, {
              status: orderDetail?.status,
              statusType: typeof orderDetail?.status,
              payment: orderDetail?.payment
            });

            // Get the last payment attempted/made
            const lastPayment = orderDetail?.payment?.length > 0
              ? orderDetail.payment[orderDetail.payment.length - 1]
              : null;

            // Transform order items to display format using the correct API structure
            const orderItems = (orderDetail?.items || []).map(item => ({
              id: orderDetail?.id || order.id,
              orderNumber: orderDetail?.orderNumber || order.orderNumber,
              customerName: orderDetail?.customer?.fullName || order.customerName,
              status: orderDetail?.status || order.status, // Keep original status (string or number)
              statusDisplay: getStatusDisplay(orderDetail?.status || order.status), // Add display text
              total: orderDetail?.total || order.total,
              date: orderDetail?.createdAt || order.createdAt,
              // Use actual product image from mainImageUrl
              image: item.product?.mainImageUrl
                ? [item.product.mainImageUrl]
                : ['/api/placeholder/80/80'], // Fallback to placeholder if no image
              name: item.product?.name || `Order #${orderDetail?.orderNumber || order.orderNumber}`,
              price: item.unitPrice || item.product?.finalPrice || item.product?.price || item.totalPrice,
              quantity: item.quantity || 1,
              size: item.product?.productVariantForCartDto?.size || 'N/A',
              color: item.product?.productVariantForCartDto?.color || 'N/A',
              paymentMethod: lastPayment?.paymentMethod?.paymentMethod || lastPayment?.paymentMethod || 'N/A',
              paymentStatus: lastPayment?.status,
              canBeCancelled: orderDetail?.canBeCancelled
            }));

            return orderItems;
          } catch (error) {
            console.error(`Error fetching details for order ${order.id}:`, error);
            // Fallback to basic order info if detailed fetch fails
            return [{
              id: order.id,
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              status: order.status,
              statusDisplay: getStatusDisplay(order.status),
              total: order.total,
              date: order.createdAt,
              image: ['/api/placeholder/80/80'],
              name: `Order #${order.orderNumber}`,
              price: order.total,
              quantity: 1,
              size: 'N/A',
              color: 'N/A',
              paymentMethod: 'N/A'
            }];
          }
        })
      );

      // Flatten the array of order items and reverse for newest first
      const allOrderItems = detailedOrders.flat().reverse();
      console.log('Sample order item:', allOrderItems[0]);
      setOrderData(allOrderItems);
    } catch (error) {
      console.error("Error loading order data:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Handle payment return from external gateways
  const handlePaymentReturn = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status') || urlParams.get('payment_status');
    const pendingOrderNumber = localStorage.getItem('pendingOrderNumber');
    const paymentRedirectTime = localStorage.getItem('paymentRedirectTime');

    // Check if user is returning from a payment gateway
    if (pendingOrderNumber && paymentRedirectTime) {
      const timeDiff = Date.now() - parseInt(paymentRedirectTime);
      // Only show message if return is within 10 minutes (to avoid stale messages)
      if (timeDiff < 10 * 60 * 1000) {
        if (paymentStatus === 'success' || paymentStatus === 'completed' || paymentStatus === 'approved') {
          toast.success(`Payment completed successfully! Order #${pendingOrderNumber} has been processed.`);
        } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled' || paymentStatus === 'declined') {
          toast.error(`Payment was not completed. Please try again or contact support for Order #${pendingOrderNumber}.`);
        } else {
          // Generic success message if no specific status but user returned from payment
          toast.success(`Thank you! Your order #${pendingOrderNumber} has been submitted. Please check the status below.`);
        }
      }

      // Clear stored payment info
      localStorage.removeItem('pendingOrderNumber');
      localStorage.removeItem('paymentRedirectTime');

      // Clean up URL parameters
      if (urlParams.toString()) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  };

  // Handle track order button click
  const handleTrackOrder = async (orderNumber) => {
    try {
      setModalLoading(true);
      setShowModal(true);

      const response = await axios.get(`${backendUrl}/api/Order/number/${orderNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const orderDetails = response.data?.responseBody?.data;
      setSelectedOrderDetails(orderDetails);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Pay button click
  const handlePayClick = (order) => {
    navigate(`/payment/${order.orderNumber}`);
  };

  // Handle Cancel Order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    const reason = window.prompt("Please enter a reason for cancellation:", "Changed my mind");
    if (reason === null) return;

    try {
      setLoading(true);
      const response = await axios.put(`${backendUrl}/api/Order/${orderId}/status?status=5`,
        { reason: reason },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data?.success || response.status === 200) {
        toast.success(response.data?.message || 'Order cancelled successfully');
        await loadOrderData(); // Reload data
      } else {
        toast.error(response.data?.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      console.error('Error response data:', error.response?.data);

      let errorMessage = 'Error cancelling order';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') errorMessage = error.response.data;
        else if (error.response.data.message) errorMessage = error.response.data.message;
        else if (error.response.data.error) errorMessage = error.response.data.error;
        else if (error.response.data.errors) errorMessage = JSON.stringify(error.response.data.errors);
      }

      toast.error(`Failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedOrderDetails(null);
  };

  useEffect(() => {
    loadOrderData();
    handlePaymentReturn();
  }, [token]);

  // Apply filters and sorting to orders
  useEffect(() => {
    console.log('Filter/Sort effect triggered with statusFilter:', statusFilter);
    console.log('Current orderData length:', orderData.length);

    if (orderData.length > 0) {
      let result = [...orderData];

      // Apply status filter
      if (statusFilter !== 'All') {
        console.log('Filtering by status:', statusFilter);
        console.log('Sample order status before filtering:', orderData[0].status, typeof orderData[0].status);
        result = result.filter(order => {
          const matches = order.status === parseInt(statusFilter);
          return matches;
        });
        console.log('Filtered results count:', result.length);
      }

      // Apply sorting
      if (sortOrder === 'newest') {
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
      } else if (sortOrder === 'oldest') {
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
      }

      console.log('Final filtered results count:', result.length);
      setFilteredOrders(result);
    } else {
      setFilteredOrders([]);
    }
  }, [orderData, sortOrder, statusFilter]);

  // Handle status filter change
  const handleStatusFilterChange = async (e) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);

    // Reload data with new filter
    await loadOrderData(newStatus);
  };

  return (
    <div className='border-t border-gray-300 pt-16 mt-[80px] mb-5 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
      <div className='text-2xl mb-10'>
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="All">All Orders</option>
              <option value="0">Pending Payment</option>
              <option value="1">Confirmed</option>
              <option value="2">Processing</option>
              <option value="3">Shipped</option>
              <option value="4">Delivered</option>
              <option value="5">Cancelled by User</option>
              <option value="6">Refunded</option>
              <option value="7">Returned</option>
              <option value="8">Payment Expired</option>
              <option value="9">Cancelled by Admin</option>
              <option value="10">Complete</option>
            </select>
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
        </div>
      </div>

      <div>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3">Loading orders...</span>
          </div>
        ) : orderData.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No orders found</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No orders match the selected filters</p>
          </div>
        ) : (
          filteredOrders.map((item, index) => {
            // Debug logging for button visibility
            const showPayButton = isPendingPayment(item.status);
            const showCancelButton = isPendingPayment(item.status) ||
              (isConfirmed(item.status) && String(item.paymentMethod).toLowerCase().replace(/\s/g, '') === 'cashondelivery');

            console.log(`Order ${item.orderNumber}:`, {
              status: item.status,
              statusType: typeof item.status,
              showPayButton,
              showCancelButton,
              paymentMethod: item.paymentMethod
            });

            return (
              <div key={index} className='py-4 border-t border-b border-gray-300 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                <div className='flex items-start gap-6 text-sm'>
                  <img
                    className='w-16 sm:w-20 h-16 sm:h-20 object-cover rounded-md'
                    src={item.image[0]}
                    alt={item.name}
                    onError={(e) => {
                      e.target.src = '/api/placeholder/80/80';
                    }}
                  />
                  <div>
                    <p className='sm:text-base font-medium'>{item.name}</p>
                    <div className='flex items-center gap-3 text-gray-700'>
                      <p className='text-lg font-medium'>{currency}{item.price}</p>
                      <p className=''>Quantity: {item.quantity}</p>
                      <p className=''>Size: {item.size}</p>
                      <p className=''>Color: {item.color}</p>
                    </div>
                    <p className='mt-2'>Date: <span className='text-gray-400'>{new Date(item.date).toDateString()}</span></p>
                    <p className='mt-2'>Payment Method: <span className='text-gray-400'>{item.paymentMethod}</span></p>
                  </div>
                </div>
                <div className='md:w-1/2 flex justify-between'>
                  <div className='flex items-center gap-2'>
                    <p className={`min-w-2 h-2 rounded-full ${isPendingPayment(item.status) ? 'bg-yellow-500' : item.status === 8 ? 'bg-red-500' : 'bg-green-500'}`}></p>
                    <p className='text-sm md:text-base'>{item.statusDisplay}</p>
                  </div>
                  <div className='flex gap-2 font-medium'>
                    <button onClick={() => handleTrackOrder(item.orderNumber)} className='border px-4 py-2 text-sm font-medium rounded-sm'>Track Order</button>

                    {/* Pay Button - Only for Pending Payment */}
                    {showPayButton && (
                      <button
                        onClick={() => handlePayClick(item)}
                        className={`border px-4 py-2 text-sm font-medium rounded-sm text-white ${item.paymentStatus && String(item.paymentStatus).toLowerCase() === 'failed'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-black hover:bg-gray-800'
                          }`}
                      >
                        {item.paymentStatus && String(item.paymentStatus).toLowerCase() === 'failed' ? 'Try Pay Again' : 'Pay Now'}
                      </button>
                    )}

                    {/* Cancel Button - For Pending OR (Confirmed + COD) */}
                    {showCancelButton && (
                      <button
                        onClick={() => handleCancelOrder(item.id)}
                        className='border px-4 py-2 text-sm font-medium rounded-sm text-red-600 border-red-600 hover:bg-red-50'
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">Order Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {modalLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="ml-3">Loading order details...</span>
                </div>
              ) : selectedOrderDetails ? (
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">Order Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Order Number:</span> {selectedOrderDetails.orderNumber}</p>
                        <p><span className="font-medium">Status:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColorClass(selectedOrderDetails.status)}`}>
                            {selectedOrderDetails.statusDisplay || selectedOrderDetails.status}
                          </span>
                        </p>
                        <p><span className="font-medium">Order Date:</span> {new Date(selectedOrderDetails.createdAt).toLocaleDateString()}</p>
                        <p><span className="font-medium">Total:</span> {currency}{selectedOrderDetails.total}</p>
                        <p><span className="font-medium">Can Cancel:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${selectedOrderDetails.canBeCancelled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {selectedOrderDetails.canBeCancelled ? 'Yes' : 'No'}
                          </span>
                        </p>
                        <p><span className="font-medium">Can Return:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${selectedOrderDetails.canBeReturned ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {selectedOrderDetails.canBeReturned ? 'Yes' : 'No'}
                          </span>
                        </p>
                        {selectedOrderDetails.notes && (
                          <p><span className="font-medium">Notes:</span> {selectedOrderDetails.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">Shipping Address</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Name:</span> {selectedOrderDetails.customer?.fullName}</p>
                        <p><span className="font-medium">Email:</span> {selectedOrderDetails.customer?.email}</p>
                        <p><span className="font-medium">Phone:</span> {selectedOrderDetails.customer?.phoneNumber}</p>
                        {selectedOrderDetails.customer?.customerAddress && (
                          <>
                            <p><span className="font-medium">Address Type:</span> {selectedOrderDetails.customer.customerAddress.addressType}</p>
                            <p><span className="font-medium">Full Address:</span> {selectedOrderDetails.customer.customerAddress.fullAddress}</p>
                            {selectedOrderDetails.customer.customerAddress.additionalNotes && (
                              <p><span className="font-medium">Additional Notes:</span> {selectedOrderDetails.customer.customerAddress.additionalNotes}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                    <div className="space-y-4">
                      {selectedOrderDetails.items?.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 flex items-start gap-4">
                          <img
                            src={item.product?.mainImageUrl || '/api/placeholder/80/80'}
                            alt={item.product?.name}
                            className="w-20 h-20 object-cover rounded-md"
                            onError={(e) => {
                              e.target.src = '/api/placeholder/80/80';
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product?.name}</h4>
                            <div className="text-sm text-gray-600 mt-1">
                              <p>Size: {item.product?.productVariantForCartDto?.size || 'N/A'}</p>
                              <p>Color: {item.product?.productVariantForCartDto?.color || 'N/A'}</p>
                              {item.product?.productVariantForCartDto?.waist && (
                                <p>Waist: {item.product.productVariantForCartDto.waist}cm</p>
                              )}
                              {item.product?.productVariantForCartDto?.length && (
                                <p>Length: {item.product.productVariantForCartDto.length}cm</p>
                              )}
                              <p>Quantity: {item.quantity}</p>
                              <p>Unit Price: {currency}{item.unitPrice}</p>
                              <p className="font-medium">Total: {currency}{item.totalPrice}</p>
                              {item.product?.discountPrecentage > 0 && (
                                <p className="text-green-600">Discount: {item.product.discountPrecentage}% off</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Information */}
                  {selectedOrderDetails.payment && selectedOrderDetails.payment.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {selectedOrderDetails.payment.map((payment, index) => (
                          <div key={index} className="space-y-2 text-sm">
                            <p><span className="font-medium">Payment Method:</span> {payment.paymentMethod}</p>
                            <p><span className="font-medium">Amount:</span> {currency}{payment.amount}</p>
                            <p><span className="font-medium">Payment Date:</span> {new Date(payment.paymentDate).toLocaleDateString()}</p>
                            <p><span className="font-medium">Status:</span>
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColorClass(payment.status)}`}>
                                {payment.status}
                              </span>
                            </p>
                            {payment.paymentProvider && (
                              <p><span className="font-medium">Provider:</span> {payment.paymentProvider}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{currency}{selectedOrderDetails.subtotal}</span>
                      </div>
                      {selectedOrderDetails.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{currency}{selectedOrderDetails.taxAmount}</span>
                        </div>
                      )}
                      {selectedOrderDetails.shippingCost > 0 && (
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span>{currency}{selectedOrderDetails.shippingCost}</span>
                        </div>
                      )}
                      {selectedOrderDetails.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-{currency}{selectedOrderDetails.discountAmount}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{currency}{selectedOrderDetails.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Status Timeline */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Order Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Order Placed - {new Date(selectedOrderDetails.createdAt).toLocaleDateString()}</span>
                      </div>

                      {selectedOrderDetails.status !== 'PaymentExpired' && selectedOrderDetails.status !== 'Failed' && (
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${selectedOrderDetails.status === 'Confirmed' || selectedOrderDetails.isShipped || selectedOrderDetails.isDelivered ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm">Payment:{selectedOrderDetails.status}</span>
                        </div>
                      )}

                      {(selectedOrderDetails.shippedAt || selectedOrderDetails.isShipped) && (
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Shipped - {selectedOrderDetails.shippedAt ? new Date(selectedOrderDetails.shippedAt).toLocaleDateString() : 'Shipped'}</span>
                        </div>
                      )}

                      {(selectedOrderDetails.deliveredAt || selectedOrderDetails.isDelivered) && (
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Delivered - {selectedOrderDetails.deliveredAt ? new Date(selectedOrderDetails.deliveredAt).toLocaleDateString() : 'Delivered'}</span>
                        </div>
                      )}

                      {(selectedOrderDetails.cancelledAt || selectedOrderDetails.isCancelled) && (
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm">Cancelled - {selectedOrderDetails.cancelledAt ? new Date(selectedOrderDetails.cancelledAt).toLocaleDateString() : 'Cancelled'}</span>
                        </div>
                      )}

                      {selectedOrderDetails.status === 'PaymentExpired' && (
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm">Payment Expired</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>Failed to load order details</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders