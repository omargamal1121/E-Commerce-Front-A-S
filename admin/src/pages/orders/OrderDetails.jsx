import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl, currency } from "../../App";

const OrderDetails = ({ token }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [markingPaid, setMarkingPaid] = useState(false);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [creatingPayment, setCreatingPayment] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      // Try by order number first, then by ID
      let res;
      try {
        res = await axios.get(`${backendUrl}/api/Order/number/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        res = await axios.get(`${backendUrl}/api/Order/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const data = res.data?.responseBody?.data || res.data?.data;
      if (data) {
        setOrder(data);
      } else {
        toast.error("Order not found");
        navigate("/orders");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order details");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrderDetails();
  }, [orderId, token]);

  const handleMarkAsPaid = async () => {
    // Validate transaction ID if provided
    if (transactionId && (transactionId.length < 3 || transactionId.length > 100)) {
      toast.error("Transaction ID must be between 3 and 100 characters if provided");
      return;
    }

    setMarkingPaid(true);
    try {
      const response = await axios.put(
        `${backendUrl}/api/payment/cash-on-delivery/pay`,
        {
          paymentId: firstPayment?.id,
          transactionId: transactionId || null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.status === 200) {
        toast.success("Payment marked as paid successfully");
        setShowMarkPaidModal(false);
        setTransactionId("");
        fetchOrderDetails(); // Refresh order details
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark payment as paid");
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleCreatePayment = async () => {
    setCreatingPayment(true);
    try {
      // Use the same payment flow as frontend
      const paymentPayload = {
        orderNumber: order.orderNumber,
        paymentDetails: {
          walletPhoneNumber: "",
          paymentMethod: firstPayment?.paymentMethodId || 2, // Default to Visa if not specified
          currency: "EGP",
          notes: "Payment initiated by admin"
        }
      };

      const response = await axios.post(
        `${backendUrl}/api/Payment`,
        paymentPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.statuscode === 200) {
        const pData = response.data.responseBody?.data;

        if (pData?.isRedirectRequired && pData?.redirectUrl) {
          // Show redirect URL in modal for admin to copy/share
          const returnUrl = `${window.location.origin}/orders`;
          const separator = pData.redirectUrl.includes('?') ? '&' : '?';
          const redirectUrlWithReturn = `${pData.redirectUrl}${separator}return_url=${encodeURIComponent(returnUrl)}`;
          
          setPaymentLink(redirectUrlWithReturn);
          setShowPaymentLinkModal(true);
          toast.success("Payment link generated successfully");
        } else {
          toast.success("Payment processed successfully!");
          fetchOrderDetails(); // Refresh order details
        }
      } else {
        toast.error(response.data.responseBody?.message || "Payment failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create payment");
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleCopyPaymentLink = () => {
    navigator.clipboard.writeText(paymentLink).then(() => {
      toast.success("Payment link copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy payment link");
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  // Payment is an array, get the first payment for COD detection
  const payments = Array.isArray(order?.payment) ? order.payment : [];
  const firstPayment = payments[0] || null;
  
  const isCashOnDelivery = firstPayment?.paymentMethod === 'CashOnDelivery';
  const canMarkAsPaid = isCashOnDelivery && firstPayment?.status !== 'Paid';
  const canCreatePayment = firstPayment?.status === 'Pending' || firstPayment?.status === 'Failed' || order.status === 'PendingPayment';

  const STATUS_LABELS = {
    "Pending": { label: "Pending", color: "bg-gray-100 text-gray-600 border-gray-200" },
    "Confirmed": { label: "Confirmed", color: "bg-blue-50 text-blue-600 border-blue-100" },
    "Processing": { label: "Processing", color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
    "Shipped": { label: "Shipped", color: "bg-purple-50 text-purple-600 border-purple-100" },
    "Delivered": { label: "Delivered", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    "Cancelled": { label: "Cancelled", color: "bg-rose-50 text-rose-600 border-rose-100" },
    "PaymentExpired": { label: "Payment Expired", color: "bg-orange-50 text-orange-600 border-orange-100" },
  };

  const currentStatus = STATUS_LABELS[order.statusDisplay] || { label: order.statusDisplay || "Unknown", color: "bg-gray-50 text-gray-400 border-gray-100" };

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 mt-6">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-[28px] flex items-center justify-center text-2xl md:text-3xl shadow-inner border border-blue-100/50 text-blue-600">
            📦
          </div>
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase">Order #{order.orderNumber}</h1>
              <span className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
            </div>
            <p className="text-gray-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.3em] mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {canCreatePayment && (
            <button 
              onClick={handleCreatePayment}
              disabled={creatingPayment}
              className="px-6 py-2 md:px-8 md:py-3 bg-blue-600 text-white rounded-[22px] text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {creatingPayment ? 'Creating...' : 'Create Payment'}
            </button>
          )}
          {canMarkAsPaid && (
            <button 
              onClick={() => setShowMarkPaidModal(true)}
              className="px-6 py-2 md:px-8 md:py-3 bg-emerald-600 text-white rounded-[22px] text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
            >
              Mark as Paid
            </button>
          )}
          <button onClick={() => window.print()} className="px-6 py-2 md:px-8 md:py-3 bg-gray-50 border border-gray-100 rounded-[22px] text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
            Print Invoice
          </button>
          <button onClick={() => navigate('/orders')} className="px-6 py-2 md:px-8 md:py-3 bg-gray-900 text-white rounded-[22px] text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95">
            Back to List
          </button>
        </div>
      </div>

      {/* Order Items Section */}
      <div className="bg-white p-6 md:p-10 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-blue-500 rounded-full" />
            <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter">Order Items</h3>
          </div>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 md:px-6 py-1.5 md:py-2 rounded-full">
            {order.items?.length} Items
          </span>
        </div>

        <div className="flex flex-col gap-4 md:gap-6">
          {order.items?.map((item, idx) => (
            <div key={idx} className="group p-4 md:p-8 bg-gray-50 rounded-[16px] md:rounded-[24px] border border-gray-100 flex flex-col md:flex-row items-center gap-4 md:gap-8 transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[16px] md:rounded-[20px] overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
                <img src={item.product?.mainImageUrl} alt={item.product?.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
              </div>
              
              <div className="flex-1 flex flex-col gap-2 md:gap-3 text-center md:text-left">
                <h4 className="text-base md:text-xl font-black text-gray-900 uppercase tracking-tight">{item.product?.name}</h4>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
                  {item.product?.productVariantForCartDto && (
                    <>
                      <span className="px-2 py-1 md:px-3 md:py-1 bg-white border border-gray-200 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        Color: 
                        {item.product.productVariantForCartDto.color && item.product.productVariantForCartDto.color.startsWith('#') ? (
                          <span 
                            className="w-3 h-3 md:w-4 md:h-4 rounded-full border border-gray-300 shadow-sm"
                            style={{ backgroundColor: item.product.productVariantForCartDto.color }}
                            title={item.product.productVariantForCartDto.color}
                          />
                        ) : (
                          <span>{item.product.productVariantForCartDto.color || 'N/A'}</span>
                        )}
                      </span>
                      <span className="px-2 py-1 md:px-3 md:py-1 bg-white border border-gray-200 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-500">Size: {item.product.productVariantForCartDto.size || 'N/A'}</span>
                      {item.product.productVariantForCartDto.waist > 0 && (
                        <span className="px-2 py-1 md:px-3 md:py-1 bg-white border border-gray-200 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-500">Waist: {item.product.productVariantForCartDto.waist}</span>
                      )}
                      {item.product.productVariantForCartDto.length > 0 && (
                        <span className="px-2 py-1 md:px-3 md:py-1 bg-white border border-gray-200 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-500">Length: {item.product.productVariantForCartDto.length}</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end gap-1">
                <span className="text-xl md:text-2xl font-black text-gray-900">{currency} {item.totalPrice.toFixed(2)}</span>
                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qty: {item.quantity} × {item.unitPrice.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout for Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Left Column: Customer & Shipping */}
        <div className="flex flex-col gap-6 md:gap-8">
          {/* Customer Details */}
          <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4 md:mb-6">
              <div className="w-2 h-8 bg-blue-500 rounded-full" />
              <h3 className="text-base md:text-lg font-black uppercase tracking-tighter">Customer Information</h3>
            </div>
            
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-lg md:text-xl text-blue-600">👤</div>
                <div>
                  <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Full Name</p>
                  <p className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight">{order.customer?.fullName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-lg md:text-xl text-gray-400">📧</div>
                <div>
                  <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Email Address</p>
                  <p className="text-xs md:text-sm font-bold text-gray-700">{order.customer?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-lg md:text-xl text-gray-400">📞</div>
                <div>
                  <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Phone Number</p>
                  <p className="text-xs md:text-sm font-bold text-gray-700">{order.customer?.phoneNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4 md:mb-6">
              <div className="w-2 h-8 bg-purple-500 rounded-full" />
              <h3 className="text-base md:text-lg font-black uppercase tracking-tighter">Shipping Address</h3>
            </div>
            
            <div className="bg-gray-50 p-4 md:p-6 rounded-[16px] md:rounded-[24px] border border-gray-100 flex flex-col gap-3 md:gap-4 shadow-inner">
              <p className="text-base md:text-lg font-black text-gray-900 leading-tight">
                {order.customer?.customerAddress?.streetAddress} 
                {order.customer?.customerAddress?.apartmentSuite && `, ${order.customer.customerAddress.apartmentSuite}`}
              </p>
              <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-tight">
                {order.customer?.customerAddress?.city}, {order.customer?.customerAddress?.state}, {order.customer?.customerAddress?.country}
              </p>
              <p className="text-xs md:text-sm font-black text-blue-600">Postal Code: {order.customer?.customerAddress?.postalCode}</p>

              {order.customer?.customerAddress?.fullAddress && (
                <div className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-gray-200/50 shadow-sm mt-3 md:mt-4">
                  <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase mb-2">Complete Address</p>
                  <p className="text-xs md:text-sm font-medium text-gray-700 leading-relaxed">{order.customer.customerAddress.fullAddress}</p>
                </div>
              )}

              {(order.customer?.customerAddress?.additionalNotes || order.notes) && (
                <div className="p-3 md:p-4 bg-blue-600 rounded-xl md:rounded-2xl shadow-lg shadow-blue-100 text-white mt-3 md:mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm md:text-base text-blue-100">📝</span>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-100">Delivery Notes</p>
                  </div>
                  <p className="text-xs md:text-sm font-bold leading-relaxed italic">
                    {order.customer?.customerAddress?.additionalNotes || order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Payment & Pricing */}
        <div className="flex flex-col gap-6 md:gap-8">
          {/* Payment Information */}
          <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4 md:mb-6">
              <div className="w-2 h-8 bg-emerald-500 rounded-full" />
              <h3 className="text-base md:text-lg font-black uppercase tracking-tighter">Payment Information</h3>
            </div>
            
            <div className="flex flex-col gap-3 md:gap-4">
              {payments.length > 0 ? (
                payments.map((payment, index) => (
                  <div key={payment.id || index} className={`p-4 md:p-5 rounded-xl md:rounded-2xl border ${index === 0 ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'}`}>
                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                      <div>
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Method</p>
                        <p className="text-sm md:text-base font-black text-gray-900 uppercase">{payment.paymentMethod || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Status</p>
                        <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest ${
                          payment.status === 'Paid' || payment.status === 'Success'
                            ? 'bg-emerald-100 text-emerald-600 border-emerald-200' 
                            : payment.status === 'Failed'
                            ? 'bg-rose-100 text-rose-600 border-rose-200'
                            : 'bg-amber-100 text-amber-600 border-amber-200'
                        }`}>
                          {payment.status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    {payment.providerOrderId && (
                      <div className="mb-3 md:mb-4">
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Provider Order ID</p>
                        <p className="text-xs md:text-sm font-bold text-gray-700 font-mono">{payment.providerOrderId}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                      <div>
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Date</p>
                        <p className="text-xs md:text-sm font-bold text-gray-700">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Amount</p>
                        <p className="text-xl md:text-2xl font-black text-gray-900">{currency} {(payment.amount || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    {payment.paymentProvider && (
                      <div>
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Provider</p>
                        <p className="text-xs md:text-sm font-bold text-gray-700">{payment.paymentProvider}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 md:py-8 bg-gray-50 rounded-xl md:rounded-2xl">
                  <p className="text-xs md:text-sm font-bold text-gray-400">No payment information available</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-gray-900 p-6 md:p-8 rounded-[24px] md:rounded-[32px] text-white flex flex-col gap-4 md:gap-6 shadow-2xl shadow-blue-900/20 border border-blue-900/30">
            <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 text-center">Payment Summary</h4>
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4 md:pb-6">
                <span className="text-[9px] md:text-[10px] font-bold uppercase text-gray-500 tracking-widest">Subtotal</span>
                <span className="text-xs md:text-sm font-black text-white">{currency} {order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-4 md:pb-6">
                <span className="text-[9px] md:text-[10px] font-bold uppercase text-gray-500 tracking-widest">Shipping</span>
                <span className="text-xs md:text-sm font-black text-white">{currency} {order.shippingCost?.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between items-center border-b border-white/5 pb-4 md:pb-6">
                  <span className="text-[9px] md:text-[10px] font-bold uppercase text-gray-500 tracking-widest">Discount</span>
                  <span className="text-xs md:text-sm font-black text-emerald-400">-{currency} {order.discountAmount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Grand Total</span>
                  <span className="text-3xl md:text-4xl font-black tracking-tighter text-white">{currency} {order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mark as Paid Modal */}
      {showMarkPaidModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-10 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Mark as Paid</h3>
              <button 
                onClick={() => setShowMarkPaidModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter reference number (3-100 chars)"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 outline-none transition-all text-sm font-medium"
                />
                <p className="text-[9px] font-bold text-gray-400 mt-2">
                  Leave empty if no transaction ID available
                </p>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowMarkPaidModal(false)}
                  disabled={markingPaid}
                  className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  disabled={markingPaid}
                  className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  {markingPaid ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Link Modal */}
      {showPaymentLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-10 max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Payment Link Generated</h3>
              <button 
                onClick={() => setShowPaymentLinkModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                  Payment Link
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={paymentLink}
                    readOnly
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium pr-24"
                  />
                  <button
                    onClick={handleCopyPaymentLink}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[9px] font-bold text-gray-400 mt-2">
                  Share this link with the customer to complete payment
                </p>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowPaymentLinkModal(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.open(paymentLink, '_blank');
                  }}
                  className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-100"
                >
                  Open Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
