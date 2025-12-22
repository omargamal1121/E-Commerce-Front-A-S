import React from 'react';
import { currency } from '../../App';

const ViewOrderModal = ({ selectedOrder, setShowViewModal }) => {
  if (!selectedOrder) return null;

  // Normalize core fields to support both detailed and summary shapes
  const orderId = selectedOrder._id || selectedOrder.id || selectedOrder.orderId || "";
  const orderDate = selectedOrder.createdAt || selectedOrder.date || new Date().toISOString();
  const orderStatus = selectedOrder.status || selectedOrder.statusText || "N/A";
  const orderPaymentMethod = selectedOrder.paymentMethod || selectedOrder.paymentMethodName || "N/A";

  const items = Array.isArray(selectedOrder.items)
    ? selectedOrder.items
    : Array.isArray(selectedOrder.orderItems)
      ? selectedOrder.orderItems.map((it) => ({
        name: it.productName || it.name || "Item",
        quantity: it.quantity || 0,
        size: it.size || "N/A",
        price: it.price || 0,
        image: it.product?.mainImageUrl || it.image || "",
        discountPercentage: it.product?.discountPrecentage || 0
      }))
      : [];

  // Calculate order total (fallback to amount/total when items not present)
  const computedItemsTotal = items.reduce(
    (total, item) => total + (Number(item.price || 0) * Number(item.quantity || 0)),
    0
  );
  const orderTotal = Number(
    computedItemsTotal || selectedOrder.total || selectedOrder.amount || 0
  );

  // Normalize customer/address block
  const customerName =
    selectedOrder.customerName ||
    `${selectedOrder.address?.firstName || ""} ${selectedOrder.address?.lastName || ""}`.trim() ||
    "N/A";
  const customerEmail = selectedOrder.customerEmail || "N/A";
  const phone = selectedOrder.address?.phone || selectedOrder.customerPhone || "N/A";
  const addressLine =
    selectedOrder.address?.address ||
    selectedOrder.address?.addressLine ||
    selectedOrder.shippingAddress ||
    "N/A";
  const city = selectedOrder.address?.city || "";
  const state = selectedOrder.address?.state || "";
  const zipCode = selectedOrder.address?.zipCode || selectedOrder.address?.postalCode || "";
  const country = selectedOrder.address?.country || "";
  const apartmentSuite = selectedOrder.address?.apartmentSuite || "";
  const addressType = selectedOrder.address?.addressType || "";
  const additionalNotes = selectedOrder.address?.additionalNotes || "";

  // Payment information (prefer detailed payment[0], fallback to order-level fields)
  const paymentInfo = (Array.isArray(selectedOrder.payment) && selectedOrder.payment.length > 0)
    ? selectedOrder.payment[0]
    : {};
  const paymentStatus =
    paymentInfo.status ||
    selectedOrder.paymentStatus ||
    selectedOrder.status ||
    "N/A";
  const paymentMethod = paymentInfo.paymentMethod || selectedOrder.paymentMethod || "N/A";
  const paymentDate = paymentInfo.paymentDate || "";

  // Debug logging
  console.log('ViewOrderModal - Payment Info:', paymentInfo);
  console.log('ViewOrderModal - Payment Status:', paymentStatus);
  console.log('ViewOrderModal - Payment Method:', paymentMethod);

  // Order financial details
  const subtotal = selectedOrder.subtotal || 0;
  const taxAmount = selectedOrder.taxAmount || 0;
  const shippingCost = selectedOrder.shippingCost || 0;
  const discountAmount = selectedOrder.discountAmount || 0;
  const total = selectedOrder.total || orderTotal;

  // Order status details
  const isCancelled = selectedOrder.isCancelled || false;
  const isDelivered = selectedOrder.isDelivered || false;
  const isShipped = selectedOrder.isShipped || false;
  const shippedAt = selectedOrder.shippedAt;
  const deliveredAt = selectedOrder.deliveredAt;
  const cancelledAt = selectedOrder.cancelledAt;

  // Status helpers (match OrderTable.jsx behavior)
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
    if (Number.isFinite(num) && Object.prototype.hasOwnProperty.call(STATUS_LABELS, num)) {
      return STATUS_LABELS[num];
    }
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
    if (l.includes('fail') || l.includes('expired')) return 'bg-rose-100 text-rose-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Timeline steps
  const timelineSteps = [
    { label: 'Placed', date: orderDate, active: true },
    { label: 'Shipped', date: shippedAt, active: isShipped || isDelivered },
    { label: 'Delivered', date: deliveredAt, active: isDelivered },
  ];

  if (isCancelled) {
    timelineSteps.push({ label: 'Cancelled', date: cancelledAt, active: true, isError: true });
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Order Details
            </h3>
            <button
              onClick={() => setShowViewModal(false)}
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

          {/* Order Timeline */}
          <div className="mb-8 px-4">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
              {timelineSteps.map((step, index) => (
                <div key={index} className={`flex flex-col items-center bg-white px-2 ${step.active ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step.active ? (step.isError ? 'border-red-500 bg-red-50 text-red-500' : 'border-blue-600 bg-blue-50 text-blue-600') : 'border-gray-300 bg-white'}`}>
                    {index + 1}
                  </div>
                  <span className="text-xs font-medium mt-1">{step.label}</span>
                  {step.date && <span className="text-[10px] text-gray-500">{new Date(step.date).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Order Information</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="mb-2">
                  <span className="text-gray-600 text-sm">Order Number:</span>
                  <p className="font-medium">{selectedOrder.orderNumber || orderId}</p>
                </div>
                <div className="mb-2">
                  <span className="text-gray-600 text-sm">Order ID:</span>
                  <p className="font-medium">{orderId}</p>
                </div>
                <div className="mb-2">
                  <span className="text-gray-600 text-sm">Date:</span>
                  <p className="font-medium">
                    {new Date(orderDate).toLocaleString()}
                  </p>
                </div>
                <div className="mb-2">
                  <span className="text-gray-600 text-sm">Status:</span>
                  <p className="font-medium">{orderStatus}</p>
                </div>
                <div className="mb-2">
                  <span className="text-gray-600 text-sm">Notes:</span>
                  <p className="font-medium">{selectedOrder.notes || 'No notes'}</p>
                </div>
                {shippedAt && (
                  <div className="mb-2">
                    <span className="text-gray-600 text-sm">Shipped At:</span>
                    <p className="font-medium">{new Date(shippedAt).toLocaleString()}</p>
                  </div>
                )}
                {deliveredAt && (
                  <div className="mb-2">
                    <span className="text-gray-600 text-sm">Delivered At:</span>
                    <p className="font-medium">{new Date(deliveredAt).toLocaleString()}</p>
                  </div>
                )}
                {cancelledAt && (
                  <div className="mb-2">
                    <span className="text-gray-600 text-sm">Cancelled At:</span>
                    <p className="font-medium">{new Date(cancelledAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">Customer Information</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="mb-2">
                  <span className="text-gray-600 text-sm">Name:</span>
                  <p className="font-medium">{customerName}</p>
                </div>
                <div className="mb-2">
                  <span className="text-gray-600 text-sm">Email:</span>
                  <p className="font-medium">{customerEmail}</p>
                </div>
                <div className="mb-2">
                  <span className="text-gray-600 text-sm">Phone:</span>
                  <p className="font-medium">{phone}</p>
                </div>
                <div className="mb-2">
                  <span className="text-gray-600 text-sm">Address Type:</span>
                  <p className="font-medium">{addressType || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Full Address:</span>
                  <p className="font-medium">
                    {addressLine}
                    {apartmentSuite && `, ${apartmentSuite}`}
                    {city && `, ${city}`}
                    {state && `, ${state}`}
                    {zipCode && ` ${zipCode}`}
                    {country && `, ${country}`}
                  </p>
                </div>
                {additionalNotes && (
                  <div className="mt-2">
                    <span className="text-gray-600 text-sm">Additional Notes:</span>
                    <p className="font-medium">{additionalNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-2">Payment Information</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600 text-sm">Payment Method:</span>
                  <p className="font-medium">{paymentMethod}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Payment Status:</span>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClass(getStatusLabel(paymentStatus))}`}>
                      {getStatusLabel(paymentStatus)}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Payment Date:</span>
                  <p className="font-medium">
                    {paymentDate ? new Date(paymentDate).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-2">Financial Summary</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Subtotal:</span>
                  <span className="font-medium">{currency} {Number(subtotal).toFixed(2)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Tax Amount:</span>
                    <span className="font-medium">{currency} {Number(taxAmount).toFixed(2)}</span>
                  </div>
                )}
                {shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Shipping Cost:</span>
                    <span className="font-medium">{currency} {Number(shippingCost).toFixed(2)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Discount Amount:</span>
                    <span className="font-medium text-green-600">-{currency} {Number(discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-800 font-medium">Total Amount:</span>
                  <span className="font-bold text-lg">{currency} {Number(total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-800 mb-2">Order Items</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              {items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Variant
                        </th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="py-2 px-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-10 w-10 rounded-md object-cover mr-3"
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.name}
                                </div>
                                {item.discountPercentage > 0 && (
                                  <div className="text-xs text-green-600">
                                    {item.discountPercentage}% off
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {item.color && item.size ? `${item.color}, Size ${item.size}` :
                                item.size ? `Size ${item.size}` :
                                  item.color ? item.color : 'N/A'}
                            </div>
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {item.quantity}
                            </div>
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {currency} {Number(item.unitPrice || item.price || 0).toFixed(2)}
                              {item.originalPrice && item.originalPrice !== item.unitPrice && (
                                <div className="text-xs text-gray-400 line-through">
                                  {currency} {Number(item.originalPrice).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {currency} {Number(item.totalPrice || (item.unitPrice || item.price || 0) * (item.quantity || 0)).toFixed(2)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td
                          colSpan="4"
                          className="py-2 px-4 whitespace-nowrap text-right font-medium"
                        >
                          Total:
                        </td>
                        <td className="py-2 px-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {currency} {Number(orderTotal || 0).toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  Items details not available for this order summary.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowViewModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewOrderModal;