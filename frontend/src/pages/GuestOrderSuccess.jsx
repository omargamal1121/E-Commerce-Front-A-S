import React, { useEffect, useState, useContext } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { getGuestOrderByNumber } from "../services/guestCheckoutService";
import { ShopContext } from "../context/ShopContext";
import ProductImage from "../components/common/ProductImage";

/* ─── animation variants ────────────────────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };
const itemFade = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

/* ── tick SVG drawn with a stroke animation ─────────────────────────────── */
const CheckCircle = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24" fill="none">
    <motion.circle
      cx="50" cy="50" r="45"
      stroke="#16a34a" strokeWidth="5"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    />
    <motion.path
      d="M28 52 L43 67 L72 36"
      stroke="#16a34a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.5 }}
    />
  </svg>
);

/* ════════════════════════════════════════════════════════════════════════════
   GuestOrderSuccess
   ════════════════════════════════════════════════════════════════════════════ */
const GuestOrderSuccess = () => {
  const { currency = "EGP " } = useContext(ShopContext) || {};
  const { orderNumber: orderNumberParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const orderNumber =
    searchParams.get("orderNumber") ||
    orderNumberParam ||
    localStorage.getItem("pendingGuestOrderNumber");
  const paymentFailed = searchParams.get("paymentFailed") === "1";

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderNumber) {
        setLoading(false);
        return;
      }

      try {
        const result = await getGuestOrderByNumber(orderNumber);
        if (result.success) {
          setOrderData(result.data);
        }
      } catch (error) {
        console.error('Error fetching guest order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="pt-32 sm:pt-36 min-h-[80vh] flex items-center justify-center px-4 py-16 bg-[var(--bg)] text-[var(--text)]">
        <div className="animate-spin h-12 w-12 border-b-2 border-[var(--brand)]"></div>
      </div>
    );
  }

  return (
    <div className="pt-32 sm:pt-36 min-h-[80vh] flex items-center justify-center px-4 py-16 bg-[var(--bg)] text-[var(--text)]">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="w-full max-w-2xl text-center"
      >
        {/* ── animated check ── */}
        <motion.div variants={itemFade} className="flex justify-center mb-6">
          <CheckCircle />
        </motion.div>

        {/* ── headline ── */}
        <motion.h1
          variants={itemFade}
          className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2"
        >
          Order Confirmed!
        </motion.h1>

        <motion.p variants={itemFade} className="text-gray-500 text-sm sm:text-base mb-8">
          Thank you for your purchase. We'll start preparing your order right away. Our team will contact you shortly regarding your order.
        </motion.p>

        {paymentFailed && (
          <motion.p variants={itemFade} className="text-red-500 text-sm sm:text-base mb-6">
            Payment could not be initiated. Your order is confirmed, but please contact support to complete payment if needed.
          </motion.p>
        )}

        {/* ── order number & snapshot receipt card ── */}
        {orderNumber && (
          <motion.div
            variants={itemFade}
            className="bg-gray-50 border border-gray-100 rounded-3xl p-6 sm:p-8 mb-8 text-left shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/60 pb-5 mb-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                  Order Number
                </p>
                <p className="text-xl sm:text-2xl font-black text-gray-900 font-mono tracking-wide break-all">
                  #{orderNumber}
                </p>
              </div>
              {orderData?.statusDisplay && (
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  {orderData.statusDisplay}
                </span>
              )}
            </div>

            {/* Order Items with Snapshot data */}
            {orderData?.items && orderData.items.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                  Purchased Items ({orderData.items.length})
                </p>
                <div className="space-y-3">
                  {orderData.items.map((item, idx) => {
                    const isAvailable = (item.isProductAvailable === undefined || item.isProductAvailable) && 
                                        (item.isVariantAvailable === undefined || item.isVariantAvailable);
                    const itemImage = item.imageUrl || item.product?.mainImageUrl || '/api/placeholder/150/150';
                    const itemName = item.productName || item.product?.name || "Order Item";
                    const itemColor = item.color || item.product?.productVariantForCartDto?.color;
                    const itemSize = item.size || item.product?.productVariantForCartDto?.size;

                    return (
                      <div key={item.id || idx} className="flex gap-4 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm items-center">
                        <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                          <ProductImage
                            src={itemImage}
                            alt={itemName}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-sm text-gray-900 truncate">{itemName}</h4>
                            {!isAvailable && (
                              <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                No longer available
                              </span>
                            )}
                          </div>
                          {(itemSize || itemColor) && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {[itemSize && `Size: ${itemSize}`, itemColor && `Color: ${itemColor}`].filter(Boolean).join(' • ')}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-1 text-xs">
                            <span className="text-gray-500 font-medium">Qty: {item.quantity} × {currency}{item.unitPrice}</span>
                            <span className="font-black text-gray-900">{currency}{item.totalPrice}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Latest Payment info & Bill Breakdown */}
            {orderData && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 text-xs">
                {(() => {
                  const latestPay = Array.isArray(orderData.payment) ? orderData.payment[0] : orderData.payment;
                  if (!latestPay) return null;
                  return (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Payment ({latestPay.paymentMethod || 'Method'})</span>
                      <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {latestPay.status || 'Pending'}
                      </span>
                    </div>
                  );
                })()}
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{currency}{orderData.subtotal}</span>
                </div>
                {orderData.shippingCost > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Shipping</span>
                    <span>{currency}{orderData.shippingCost}</span>
                  </div>
                )}
                {orderData.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-{currency}{orderData.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{currency}{orderData.total}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center mt-4">
              Save your order number for reference and tracking.
            </p>
          </motion.div>
        )}

        {/* ── what happens next ── */}
        <motion.div
          variants={itemFade}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left"
        >
          {[
            { icon: "📦", title: "Processing", desc: "We're preparing your items for dispatch." },
            { icon: "🚚", title: "Shipping", desc: "You'll receive a delivery update via phone." },
            { icon: "🏠", title: "Delivery", desc: "Your order arrives at your doorstep." },
          ].map((step) => (
            <div
              key={step.title}
              className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm"
            >
              <span className="text-2xl">{step.icon}</span>
              <p className="text-sm font-semibold text-gray-800">{step.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* ── CTAs ── */}
        <motion.div variants={itemFade} className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-900 transition-colors shadow-lg shadow-black/10"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Create an Account
          </button>
        </motion.div>

        <motion.p variants={itemFade} className="text-xs text-gray-400 mt-8">
          Create an account to track your orders, view history, and enjoy a faster checkout next time.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default GuestOrderSuccess;
