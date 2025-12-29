import React, { useEffect, useState, useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

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
    if (typeof status === 'string') {
      return status;
    }
    return statusMap[status] || `Status ${status}`;
  };

  // Helper function to get status color class
  const getStatusColorClass = (status) => {
    const statusStr = typeof status === 'string' ? status.toLowerCase() : statusMap[status]?.toLowerCase() || '';

    if (statusStr.includes('delivered') || statusStr.includes('complete')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (statusStr.includes('shipped')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (statusStr.includes('cancelled') || statusStr.includes('failed') || statusStr.includes('expired')) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (statusStr.includes('confirmed') || statusStr.includes('processing')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const compareStatus = (orderStatus, filterValue) => {
    if (filterValue === 'All') return true;
    const filterId = parseInt(filterValue);
    const normalizedOrderStatus = (typeof orderStatus === 'string' && !isNaN(orderStatus) && orderStatus.trim() !== '')
      ? Number(orderStatus)
      : orderStatus;

    if (normalizedOrderStatus === filterId) return true;

    if (typeof orderStatus === 'string') {
      const normalizedOrder = orderStatus.toLowerCase().replace(/\s+/g, '');
      const normalizedMap = (statusMap[filterId] || '').toLowerCase().replace(/\s+/g, '');
      if (normalizedOrder === normalizedMap) return true;

      if (filterId === 0) return ['pending', 'pendingpayment', 'waiting', 'unpaid'].includes(normalizedOrder);
      if (filterId === 1) return ['confirmed', 'approved', 'paid', 'success'].includes(normalizedOrder);
      if (filterId === 2) return ['processing', 'inprogress', 'preparing'].includes(normalizedOrder);
      if (filterId === 3) return ['shipped', 'outfordelivery', 'intransit'].includes(normalizedOrder);
      if (filterId === 4) return ['delivered', 'received', 'complete', 'completed'].includes(normalizedOrder);
      if (filterId === 5) return ['cancelled', 'canceled', 'usercancelled'].includes(normalizedOrder);
    }
    return String(orderStatus) === String(filterValue);
  };

  const loadOrderData = async (status = statusFilter) => {
    try {
      setLoading(true);
      if (!token) return null;

      let queryParams = 'page=1&pageSize=40';
      if (status !== 'All') queryParams += `&status=${status}`;

      const res = await fetch(`${backendUrl}/api/Order?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const orders = data?.responseBody?.data || [];

      const detailedOrders = await Promise.all(
        orders.map(async (order) => {
          try {
            const detailRes = await axios.get(`${backendUrl}/api/Order/${order.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const orderDetail = detailRes.data?.responseBody?.data;

            const payments = orderDetail?.payment || [];
            const lastPayment = payments.length > 0 ? payments[payments.length - 1] : null;

            return (orderDetail?.items || []).map(item => {
              const rawStatus = orderDetail?.status !== undefined ? orderDetail.status : order.status;
              const statusNum = (typeof rawStatus === 'number' || (typeof rawStatus === 'string' && !isNaN(rawStatus) && rawStatus.trim() !== ''))
                ? Number(rawStatus)
                : rawStatus;

              return {
                id: orderDetail?.id || order.id,
                orderNumber: orderDetail?.orderNumber || order.orderNumber,
                status: statusNum,
                statusDisplay: getStatusDisplay(statusNum),
                total: orderDetail?.total || order.total,
                date: orderDetail?.createdAt || order.createdAt,
                image: item.product?.mainImageUrl ? [item.product.mainImageUrl] : ['/api/placeholder/80/80'],
                name: item.product?.name || `Order #${orderDetail?.orderNumber || order.orderNumber}`,
                price: item.unitPrice || item.product?.finalPrice || item.product?.price || item.totalPrice,
                quantity: item.quantity || 1,
                size: item.product?.productVariantForCartDto?.size || 'N/A',
                color: item.product?.productVariantForCartDto?.color || 'N/A',
                paymentMethod: lastPayment?.paymentMethod?.paymentMethod || lastPayment?.paymentMethod || 'N/A',
                paymentStatus: lastPayment?.status,
                canBeCancelled: orderDetail?.canBeCancelled
              };
            });
          } catch (error) {
            return [{
              id: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
              statusDisplay: getStatusDisplay(order.status),
              total: order.total,
              date: order.createdAt,
              image: ['/api/placeholder/80/80'],
              name: `Order #${order.orderNumber}`,
              price: order.total,
              quantity: 1,
              paymentMethod: 'N/A'
            }];
          }
        })
      );

      setOrderData(detailedOrders.flat().reverse());
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = async (orderNumber) => {
    try {
      setModalLoading(true);
      setShowModal(true);
      const response = await axios.get(`${backendUrl}/api/Order/number/${orderNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSelectedOrderDetails(response.data?.responseBody?.data);
    } catch (error) {
      toast.error('Failed to load details');
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    const reason = window.prompt("Reason:", "Changed my mind");
    if (!reason) return;

    try {
      setLoading(true);
      await axios.put(`${backendUrl}/api/Order/${orderId}/status?status=5`, { reason }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Order cancelled');
      await loadOrderData();
    } catch (error) {
      toast.error('Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [token]);

  useEffect(() => {
    if (orderData.length > 0) {
      let result = [...orderData];
      if (statusFilter !== 'All') {
        result = result.filter(order => compareStatus(order.status, statusFilter));
      }
      if (sortOrder === 'newest') result.sort((a, b) => new Date(b.date) - new Date(a.date));
      else result.sort((a, b) => new Date(a.date) - new Date(b.date));
      setFilteredOrders(result);
    } else setFilteredOrders([]);
  }, [orderData, sortOrder, statusFilter]);

  return (
    <div className='min-h-screen pt-24 pb-20 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] bg-gray-50/30'>
      <div className='mb-12'>
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-6">
          <div className="group">
            <label className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2 block">Status filter</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); loadOrderData(e.target.value); }}
              className="bg-gray-50 border-none rounded-lg px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-black transition-all cursor-pointer"
            >
              <option value="All">All Vibe</option>
              {Object.entries(statusMap).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2 block">Sort By</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-gray-50 border-none rounded-lg px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-black transition-all cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
        <div className="text-sm font-bold text-gray-900 bg-gray-100 px-4 py-2 rounded-full">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center"><div className="animate-spin h-10 w-10 border-b-2 border-black mx-auto"></div></div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-medium">No matches found.</div>
        ) : (
          filteredOrders.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group'
            >
              <div className='flex flex-col md:flex-row md:items-center gap-6'>
                <div className='relative w-24 h-24 shrink-0 overflow-hidden rounded-xl'>
                  <img className='w-full h-full object-cover transition-transform group-hover:scale-110 duration-500' src={item.image[0]} alt={item.name} />
                </div>

                <div className='flex-1 space-y-1'>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded font-black tracking-tighter">#{item.orderNumber}</span>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${getStatusColorClass(item.status)}`}>{item.statusDisplay}</span>
                  </div>
                  <h3 className='text-lg font-black text-gray-900'>{item.name}</h3>
                  <div className='flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500'>
                    <p className='text-black font-black text-sm'>{currency}{item.price}</p>
                    <p>Qty: {item.quantity}</p>
                    <p>• {item.size} / {item.color}</p>
                    <p>• {new Date(item.date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className='flex md:flex-col items-center md:items-end gap-3 shrink-0'>
                  <button onClick={() => handleTrackOrder(item.orderNumber)} className='btn-premium bg-black text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg'>
                    Track Vibe
                  </button>
                  {isPendingPayment(item.status) && (
                    <button onClick={() => navigate(`/payment/${item.orderNumber}`)} className='text-xs font-black underline hover:text-black transition-colors'>
                      {item.paymentStatus === 'Failed' ? 'Pay Again' : 'Pay Now'}
                    </button>
                  )}
                  {item.canBeCancelled && (
                    <button onClick={() => handleCancelOrder(item.id)} className='text-xs font-black text-red-500 hover:text-red-700 transition-colors'>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* TRACKING MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col"
            >
              {modalLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20">
                  <div className="animate-spin h-12 w-12 border-b-2 border-black mb-4"></div>
                  <p className="font-black tracking-widest uppercase text-xs">Fetching Vibe Details...</p>
                </div>
              ) : selectedOrderDetails && (
                <>
                  {/* Header */}
                  <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
                    <div>
                      <h2 className="text-3xl font-black tracking-tighter">ORDER #{selectedOrderDetails.orderNumber}</h2>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Placed on {new Date(selectedOrderDetails.createdAt).toLocaleLongDateString || new Date(selectedOrderDetails.createdAt).toDateString()}</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Stepper Progress */}
                    <div className="relative flex justify-between items-start max-w-2xl mx-auto mb-10">
                      {[
                        { label: 'Placed', icon: '📝', active: true },
                        { label: 'Confirmed', icon: '✅', active: selectedOrderDetails.status !== 'PendingPayment' && selectedOrderDetails.status !== 'Cancelled' },
                        { label: 'Shipped', icon: '🚚', active: selectedOrderDetails.isShipped },
                        { label: 'Delivered', icon: '🎁', active: selectedOrderDetails.isDelivered }
                      ].map((step, i, arr) => (
                        <div key={i} className="flex flex-col items-center relative z-10">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-all duration-1000 ${step.active ? 'bg-black scale-110' : 'bg-gray-100 grayscale opacity-40'}`}>
                            {step.icon}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest mt-3 transition-colors ${step.active ? 'text-black' : 'text-gray-300'}`}>{step.label}</span>
                          {i < arr.length - 1 && (
                            <div className={`absolute top-6 left-1/2 w-[calc(200%-3rem)] h-1 -z-10 transition-all duration-1000 ${step.active && arr[i + 1].active ? 'bg-black' : 'bg-gray-100'}`} />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left Column: Details */}
                      <div className="lg:col-span-2 space-y-8">
                        {/* Products */}
                        <section>
                          <h3 className="section-title-small mb-4">Items In Package</h3>
                          <div className="space-y-3">
                            {selectedOrderDetails.items?.map((item, idx) => (
                              <div key={idx} className="flex gap-4 p-3 rounded-2xl border border-gray-100 bg-gray-50/30">
                                <img className="w-20 h-20 object-cover rounded-xl shadow-sm" src={item.product?.mainImageUrl || '/api/placeholder/80/80'} alt="" />
                                <div className="flex-1 flex flex-col justify-center">
                                  <h4 className="font-black text-sm leading-tight">{item.product?.name}</h4>
                                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{item.product?.productVariantForCartDto?.size} / {item.product?.productVariantForCartDto?.color}</p>
                                  <div className="flex justify-between items-end mt-2">
                                    <p className="text-xs font-black">{currency}{item.unitPrice} <span className="text-gray-300 ml-1">x {item.quantity}</span></p>
                                    <p className="text-xs font-black text-black">{currency}{item.totalPrice}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* Payment History - MULTIPLE PAYMENTS */}
                        <section>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="section-title-small">Payment Timeline</h3>
                            <span className="text-[10px] bg-gray-100 px-3 py-1 rounded-full font-black uppercase">{selectedOrderDetails.payment?.length || 0} Attempts</span>
                          </div>
                          <div className="space-y-3">
                            {selectedOrderDetails.payment?.map((pay, idx) => (
                              <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${pay.status === 'Paid' || pay.status === 'Success' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg">{pay.paymentMethod?.toLowerCase().includes('card') ? '💳' : '💵'}</div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <p className="font-black text-sm uppercase tracking-tighter">{pay.paymentMethod}</p>
                                    <span className="text-[10px] font-black">{new Date(pay.paymentDate).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs font-bold text-gray-400">{pay.paymentProvider || 'In-House'}</p>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${pay.status === 'Paid' || pay.status === 'Success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{pay.status}</span>
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-sm font-black">{currency}{pay.amount}</p>
                                </div>
                              </div>
                            ))}
                            {(!selectedOrderDetails.payment || selectedOrderDetails.payment.length === 0) && (
                              <div className="text-center py-6 text-xs font-bold text-gray-300 italic">No payment records found.</div>
                            )}
                          </div>
                        </section>
                      </div>

                      {/* Right Column: Address & Bill */}
                      <div className="space-y-6">
                        <div className="p-6 rounded-3xl bg-black text-white shadow-xl">
                          <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-4 text-white/50">Shipping Details</h3>
                          <p className="font-black text-lg mb-1">{selectedOrderDetails.customer?.fullName}</p>
                          <p className="text-xs text-white/60 mb-4">{selectedOrderDetails.customer?.email}</p>
                          <div className="space-y-2 text-xs font-medium text-white/80 border-t border-white/10 pt-4">
                            <p className="flex justify-between"><span>Phone:</span> <span className="font-black">{selectedOrderDetails.customer?.phoneNumber}</span></p>
                            <p className="leading-relaxed"><span className="block text-white/40 mb-1">Address:</span> {selectedOrderDetails.customer?.customerAddress?.fullAddress}</p>
                          </div>
                        </div>

                        <div className="p-6 rounded-3xl border border-gray-100 bg-gray-50/50">
                          <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-4 text-gray-400">Bill Summary</h3>
                          <div className="space-y-3 text-xs">
                            <div className="flex justify-between text-gray-500 font-bold"><span>Subtotal</span> <span>{currency}{selectedOrderDetails.subtotal}</span></div>
                            <div className="flex justify-between text-gray-500 font-bold"><span>Tax</span> <span>{currency}{selectedOrderDetails.taxAmount || 0}</span></div>
                            <div className="flex justify-between text-gray-500 font-bold"><span>Shipping</span> <span>{currency}{selectedOrderDetails.shippingCost || 0}</span></div>
                            {selectedOrderDetails.discountAmount > 0 && <div className="flex justify-between text-green-600 font-black"><span>Discount</span> <span>-{currency}{selectedOrderDetails.discountAmount}</span></div>}
                            <div className="flex justify-between items-center text-lg font-black border-t border-gray-200 pt-3 mt-3"><span>TOTAL</span> <span className="text-black">{currency}{selectedOrderDetails.total}</span></div>
                          </div>
                        </div>

                        {selectedOrderDetails.notes && (
                          <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 text-xs text-gray-400 italic">
                            <p className="font-black uppercase tracking-widest text-[9px] mb-1 not-italic">Admin Notes:</p>
                            {selectedOrderDetails.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t flex justify-between gap-4 bg-gray-50/30">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order is Live</span>
                    </div>
                    <button onClick={() => setShowModal(false)} className="px-10 py-3 bg-black text-white font-black uppercase text-[10px] tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl">Close View</button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .section-title-small { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; color: #999; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
      `}</style>
    </div>
  )
}

export default Orders