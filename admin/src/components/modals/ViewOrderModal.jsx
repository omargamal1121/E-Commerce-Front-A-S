import React from 'react';
import { currency } from '../../App';

const ViewOrderModal = ({ selectedOrder, setShowViewModal }) => {
  if (!selectedOrder) return null;

  // Normalize core fields
  const orderId = selectedOrder.id || selectedOrder._id || "";
  const orderNumber = selectedOrder.orderNumber || "PENDING";
  const orderDate = selectedOrder.createdAt || selectedOrder.orderDate || new Date().toISOString();
  const orderStatus = selectedOrder.statusText || selectedOrder.statusDisplay || selectedOrder.status || "N/A";

  const items = (Array.isArray(selectedOrder.items) ? selectedOrder.items :
    Array.isArray(selectedOrder.orderItems) ? selectedOrder.orderItems : []).map(it => ({
      name: it.productName || it.name || "Manifest Item",
      quantity: it.quantity || 1,
      price: it.price || it.unitPrice || 0,
      image: it.product?.mainImageUrl || it.itemImageUrl || it.image || "",
      variant: it.size || it.color || (it.productVariantForCartDto ? `${it.productVariantForCartDto.color || ''} ${it.productVariantForCartDto.size || ''}` : "Default")
    }));

  const customer = selectedOrder.customer || {};
  const address = selectedOrder.customerAddress || selectedOrder.address || {};

  const financial = {
    subtotal: selectedOrder.subtotal || selectedOrder.totalAmount || 0,
    shipping: selectedOrder.shippingCost || 0,
    tax: selectedOrder.taxAmount || 0,
    discount: selectedOrder.discountAmount || 0,
    total: selectedOrder.total || selectedOrder.totalAmount || 0
  };

  const STATUS_LABELS = {
    0: 'Pending',
    1: 'Confirmed',
    2: 'Processing',
    3: 'Shipped',
    4: 'Delivered',
    5: 'Cancelled (U)',
    6: 'Refunded',
    7: 'Returned',
    8: 'Expired',
    9: 'Cancelled (A)',
    10: 'Complete',
  };

  const getStatusColor = (status) => {
    const s = Number(status);
    if ([4, 10].includes(s)) return 'text-green-500 bg-green-50 border-green-100';
    if ([5, 9, 8].includes(s)) return 'text-rose-500 bg-rose-50 border-rose-100';
    if ([1, 2, 3].includes(s)) return 'text-blue-500 bg-blue-50 border-blue-100';
    return 'text-gray-400 bg-gray-50 border-gray-100';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowViewModal(false)} />

      <div className="relative bg-white w-full max-w-6xl h-full max-h-[900px] rounded-[48px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        {/* Superior Navigation Bar */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-gray-100">
          <div className="flex flex-col gap-1">
            <h3 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
              Order Logistics Manifest
              <span className="text-xl text-gray-300 font-bold">#{orderNumber}</span>
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Transaction ID: {orderId}</p>
          </div>
          <button
            onClick={() => setShowViewModal(false)}
            className="p-4 bg-gray-50 hover:bg-gray-900 text-gray-400 hover:text-white rounded-[24px] transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Data Grid */}
            <div className="lg:col-span-8 flex flex-col gap-10">
              {/* Lifecycle Protocol Tracker */}
              <div className="bg-gray-50 p-10 rounded-[40px] border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Lifecycle Evolution</h4>
                  <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedOrder.status)} shadow-lg`}>
                    {STATUS_LABELS[selectedOrder.status] || orderStatus}
                  </div>
                </div>

                <div className="relative flex justify-between">
                  <div className="absolute top-[15px] left-0 w-full h-1 bg-gray-200 -z-0" />
                  <div className={`absolute top-[15px] left-0 h-1 bg-blue-500 transition-all duration-1000 -z-0`} style={{ width: `${(Math.min(Number(selectedOrder.status), 4) / 4) * 100}%` }} />

                  {[0, 1, 3, 4].map((s) => (
                    <div key={s} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border-4 shadow-sm transition-all duration-500 ${Number(selectedOrder.status) >= s ? "bg-blue-600 border-white scale-125" : "bg-white border-gray-200"}`} />
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${Number(selectedOrder.status) >= s ? "text-gray-900" : "text-gray-300"}`}>{STATUS_LABELS[s]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manifest Items List */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Inventory Matrix</h4>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">{items.length} Units</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-6 p-6 bg-white border border-gray-100 rounded-[32px] hover:shadow-xl hover:shadow-gray-100 transition-all group">
                      <div className="w-24 h-24 rounded-[24px] bg-gray-50 overflow-hidden border border-gray-50">
                        {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="product" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <span className="font-black text-gray-900 text-lg tracking-tight group-hover:text-blue-600 transition-colors uppercase">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.variant}</span>
                          <div className="w-1 h-1 bg-gray-200 rounded-full" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col gap-1">
                        <span className="text-xl font-black text-gray-900">{currency} {(item.price * item.quantity).toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Unit: {currency} {item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Information Nodes */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Financial Dashboard */}
              <div className="bg-gray-900 text-white p-10 rounded-[48px] shadow-2xl shadow-blue-900/10 flex flex-col gap-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Execution Summary</h4>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="text-[10px] font-black uppercase tracking-widest">Subtotal Payload</span>
                    <span className="font-bold">{currency} {financial.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="text-[10px] font-black uppercase tracking-widest">Logistic Cost</span>
                    <span className="font-bold">{currency} {financial.shipping.toFixed(2)}</span>
                  </div>
                  {financial.discount > 0 && (
                    <div className="flex justify-between items-center text-green-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">Optimized Value</span>
                      <span className="font-bold">-{currency} {financial.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Final Transaction</span>
                      <span className="text-4xl font-black tracking-tighter">{currency} {financial.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Intelligence */}
              <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 flex flex-col gap-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Entity Intelligence</h4>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Node Identity</span>
                  <p className="font-black text-gray-900 text-lg uppercase tracking-tight">{selectedOrder.customerName || "Anonymous Unit"}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Communication Channel</span>
                  <p className="font-bold text-gray-700 text-sm">{address.phoneNumber || "PENDING_SYNC"}</p>
                </div>

                <div className="h-px bg-gray-200" />

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Vector Source</span>
                  <p className="text-xs font-semibold text-gray-600 leading-relaxed uppercase">
                    {address.streetAddress || address.addressLine || "UNRESOLVED_VECTOR"}
                    <br />
                    {address.city || "CITY_MISSING"}, {address.state || "STATE_PENDING"}
                    <br />
                    {address.postalCode || "ZIP_PENDING"}
                  </p>
                </div>
              </div>

              {/* Technical Metadata */}
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 flex flex-col gap-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Technical Log</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Initialize Date</span>
                    <p className="text-xs font-black text-gray-900">{new Date(orderDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Protocol</span>
                    <p className="text-xs font-black text-gray-900 uppercase">{selectedOrder.paymentMethodName || "CREDIT_DEFAULT"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Action Bar */}
        <div className="px-10 py-8 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4">
          <button
            onClick={() => window.print()}
            className="px-8 py-3.5 bg-white border border-gray-200 hover:bg-gray-900 hover:text-white text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
          >
            Export Manifest
          </button>
          <button
            onClick={() => setShowViewModal(false)}
            className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-100"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewOrderModal;