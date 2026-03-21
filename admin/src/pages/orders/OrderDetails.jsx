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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

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
    <div className="flex flex-col gap-10 max-w-[1400px] mx-auto animate-in fade-in duration-700 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 mt-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-[28px] flex items-center justify-center text-3xl shadow-inner border border-blue-100/50 text-blue-600">
            📦
          </div>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Order #{order.orderNumber}</h1>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
            </div>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => window.print()} className="px-8 py-3 bg-gray-50 border border-gray-100 rounded-[22px] text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
            Print Invoice
          </button>
          <button onClick={() => navigate('/orders')} className="px-8 py-3 bg-gray-900 text-white rounded-[22px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95">
            Back to List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main Content: Order Items */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-sm flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-2 h-10 bg-blue-500 rounded-full" />
                <h3 className="text-xl font-black uppercase tracking-tighter">Order Items</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-6 py-2 rounded-full">
                {order.items?.length} Items Found
              </span>
            </div>

            <div className="flex flex-col gap-6">
              {order.items?.map((item, idx) => (
                <div key={idx} className="group p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col md:flex-row items-center gap-8 transition-all hover:bg-white hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1">
                  <div className="w-32 h-32 bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
                    <img src={item.product?.mainImageUrl} alt={item.product?.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-3 text-center md:text-left">
                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">{item.product?.name}</h4>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      {item.product?.productVariantForCartDto && (
                        <>
                          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">Color: {item.product.productVariantForCartDto.color || 'N/A'}</span>
                          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">Size: {item.product.productVariantForCartDto.size || 'N/A'}</span>
                          {item.product.productVariantForCartDto.waist > 0 && (
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">Waist: {item.product.productVariantForCartDto.waist}</span>
                          )}
                          {item.product.productVariantForCartDto.length > 0 && (
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">Length: {item.product.productVariantForCartDto.length}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center md:items-end gap-1">
                    <span className="text-2xl font-black text-gray-900">{currency} {item.totalPrice.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qty: {item.quantity} × {item.unitPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Customer & Pricing */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          
          {/* Pricing Summary */}
          <div className="bg-gray-900 p-10 rounded-[56px] text-white flex flex-col gap-8 shadow-2xl shadow-blue-900/20 border border-blue-900/30">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 text-center">Payment Summary</h4>
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Subtotal</span>
                <span className="text-sm font-black text-white">{currency} {order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Shipping</span>
                <span className="text-sm font-black text-white">{currency} {order.shippingCost?.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                  <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Discount</span>
                  <span className="text-sm font-black text-emerald-400">-{currency} {order.discountAmount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Grand Total</span>
                  <span className="text-4xl font-black tracking-tighter text-white">{currency} {order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-sm flex flex-col gap-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Customer Info</h4>
            
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-xl text-blue-600">👤</div>
                <div>
                  <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Full Name</p>
                  <p className="text-base font-black text-gray-900 uppercase tracking-tight">{order.customer?.fullName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl text-gray-400">📧</div>
                <div>
                  <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Email Address</p>
                  <p className="text-sm font-bold text-gray-700">{order.customer?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl text-gray-400">📞</div>
                <div>
                  <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Phone Number</p>
                  <p className="text-sm font-bold text-gray-700">{order.customer?.phoneNumber}</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100" />
            
            {/* Expanded Shipping & Delivery Section */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-900">Shipping & Delivery</p>
              </div>
              
              <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 flex flex-col gap-6 shadow-inner">
                {/* Main Address String */}
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery Destination</p>
                  <p className="text-lg font-black text-gray-900 leading-tight">
                    {order.customer?.customerAddress?.streetAddress} 
                    {order.customer?.customerAddress?.apartmentSuite && `, ${order.customer.customerAddress.apartmentSuite}`}
                  </p>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-tight">
                    {order.customer?.customerAddress?.city}, {order.customer?.customerAddress?.state}, {order.customer?.customerAddress?.country}
                  </p>
                  <p className="text-sm font-black text-blue-600">Postal Code: {order.customer?.customerAddress?.postalCode}</p>
                </div>

                {/* Full Concatenated Address */}
                {order.customer?.customerAddress?.fullAddress && (
                  <div className="p-5 bg-white rounded-3xl border border-gray-200/50 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Complete Address Text</p>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed">{order.customer.customerAddress.fullAddress}</p>
                  </div>
                )}

                {/* Delivery Notes */}
                {(order.customer?.customerAddress?.additionalNotes || order.notes) && (
                  <div className="p-5 bg-blue-600 rounded-3xl shadow-xl shadow-blue-100 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base text-blue-100">📝</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Important Delivery Notes</p>
                    </div>
                    <p className="text-sm font-bold leading-relaxed italic">
                      {order.customer?.customerAddress?.additionalNotes || order.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
