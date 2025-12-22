import React from 'react';
import { assets } from '../../assets/assets';
import { currency } from '../../App';

const OrderTable = ({
  currentOrders,
  filteredOrders,
  handleViewOrder,
  statusHandler
}) => {
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

  const getStatusLabel = (val) => {
    const num = Number(val);
    if (Number.isFinite(num) && STATUS_LABELS.hasOwnProperty(num)) return STATUS_LABELS[num];
    // If backend sends string labels sometimes, pass through
    if (typeof val === 'string' && val.trim()) return val;
    return 'Pending';
  };

  const statusBadgeClass = (label) => {
    const l = String(label).toLowerCase();
    if (l.includes('cancel')) return 'bg-red-100 text-red-700';
    if (l.includes('return')) return 'bg-orange-100 text-orange-700';
    if (l.includes('deliver')) return 'bg-green-100 text-green-700';
    if (l.includes('ship')) return 'bg-blue-100 text-blue-700';
    if (l.includes('process')) return 'bg-indigo-100 text-indigo-700';
    if (l.includes('hold')) return 'bg-yellow-100 text-yellow-700';
    if (l.includes('refund')) return 'bg-emerald-100 text-emerald-700';
    if (l.includes('fail')) return 'bg-rose-100 text-rose-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">
              Order Items
            </th>
            <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">
              Customer
            </th>
            <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">
              Date
            </th>
            <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">
              Amount
            </th>
            <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">
              Status
            </th>
            <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                No orders found
              </td>
            </tr>
          ) : (
            currentOrders.map((order, index) => {
              // Normalize fields to support both detailed and summary shapes
              const orderId = order._id || order.id;
              const items = Array.isArray(order.items) ? order.items : [];
              const itemsCount =
                (Array.isArray(items) ? items.length : 0) ||
                Number(order.itemsCount || order.totalItems || 0);
              const customerName = order.address?.firstName
                ? `${order.address?.firstName} ${order.address?.lastName || ""}`.trim()
                : order.customerName || "Customer";
              const phone = order.address?.phone || "";
              const paymentMethod =
                order.paymentMethod ||
                order.paymentMethodName ||
                order.payment?.methodName ||
                order.payment?.name ||
                "N/A";
              const date = order.date || order.createdAt || new Date().toISOString();
              const amount = typeof order.amount === "number" ? order.amount : (order.total ?? 0);
              const status = order.status;
              const isNumericStatus = typeof status === "number";

              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <img
                        className="w-10 h-10"
                        src={assets.parcel_icon}
                        alt=""
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium">
                          {itemsCount} items
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {items.length > 0 ? items.map((item, i) => (
                            <span key={i}>
                              {item.name} x {item.quantity}
                              {i < items.length - 1 ? ", " : ""}
                            </span>
                          )) : (
                            <span>
                              Order #{order.orderNumber || orderId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      {customerName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {phone}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-500">
                      {new Date(date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium">
                      {currency} {Number(amount || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <select
                        className="p-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                        value={Number(status) || 0}
                        onChange={(e) => statusHandler(orderId, e)}
                      >
                        {Object.entries(STATUS_LABELS).map(([code, label]) => (
                          <option key={code} value={code}>{label}</option>
                        ))}
                      </select>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeClass(getStatusLabel(status))}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => {
                        const num = order.orderNumber || orderId;
                        console.log("Order number:", num);
                        handleViewOrder(orderId, order.orderNumber);
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-all"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;