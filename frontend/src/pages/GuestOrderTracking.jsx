import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Title from "../components/Title";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

/* ── animation variants ───────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };
const itemFade = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38 } } };

/* ── status badge helper ──────────────────────────────────────────────────── */
const STATUS_MAP = {
  0: { label: "Pending Payment", color: "bg-yellow-100 text-yellow-800" },
  1: { label: "Confirmed",        color: "bg-blue-100 text-blue-800" },
  2: { label: "Processing",       color: "bg-indigo-100 text-indigo-800" },
  3: { label: "Shipped",          color: "bg-purple-100 text-purple-800" },
  4: { label: "Delivered",        color: "bg-green-100 text-green-800" },
  5: { label: "Cancelled",        color: "bg-red-100 text-red-800" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] ?? { label: String(status ?? "Unknown"), color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${s.color}`}>
      {s.label}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   GuestOrderTracking
   ══════════════════════════════════════════════════════════════════════════════ */
const GuestOrderTracking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState(
    searchParams.get("orderNumber") || localStorage.getItem("pendingGuestOrderNumber") || ""
  );
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ── auto-lookup if orderNumber in URL or localStorage ── */
  useEffect(() => {
    const preset = searchParams.get("orderNumber") || localStorage.getItem("pendingGuestOrderNumber");
    if (preset) {
      setInputValue(preset);
      fetchOrder(preset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrder = async (number = inputValue) => {
    const cleaned = number.trim();
    if (!cleaned) {
      setError("Please enter an order number.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(`${backendUrl}/api/order/number/${encodeURIComponent(cleaned)}`, {
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      console.log("[GuestOrderTracking] GET order response:", { httpStatus: response.status, data });

      // Support both envelope shapes
      const body = data?.data ?? data?.responseBody?.data ?? null;
      const success = data?.success ?? response.ok;

      if (success && body) {
        setOrder(body);
      } else {
        setError(
          data?.message || data?.responseBody?.message || "Order not found. Please check the order number."
        );
      }
    } catch (err) {
      console.error("[GuestOrderTracking] fetch error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchOrder();
  };

  /* ── helpers ── */
  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="mt-[90px] mb-16 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] min-h-[70vh]">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="pt-8 pb-6 border-b border-gray-100 mb-8">
        <div className="text-2xl sm:text-3xl mb-1">
          <Title text1="TRACK" text2="ORDER" />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Enter your order number to check the status of your order.
        </p>
      </motion.div>

      {/* Search form */}
      <motion.form
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 max-w-xl mb-10"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setError(""); }}
          placeholder="e.g. ORD-20260709142055-7832"
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-black focus:ring-2 focus:ring-gray-200 transition-all font-mono"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded-xl font-semibold text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
        >
          {loading ? (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Track
            </>
          )}
        </button>
      </motion.form>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-8"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order result */}
      <AnimatePresence>
        {order && (
          <motion.div
            key={order.orderNumber}
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-2xl space-y-5"
          >
            {/* Order header card */}
            <motion.div variants={itemFade} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Order Number</p>
                  <p className="text-lg font-bold font-mono text-gray-900">{order.orderNumber}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm border-t border-gray-50 pt-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Placed on</p>
                  <p className="font-medium text-gray-800">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Total</p>
                  <p className="font-bold text-gray-900">EGP {order.total ?? order.totalAmount ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Items</p>
                  <p className="font-medium text-gray-800">{order.items?.length ?? 0} item(s)</p>
                </div>
              </div>
            </motion.div>

            {/* Items */}
            {Array.isArray(order.items) && order.items.length > 0 && (
              <motion.div variants={itemFade} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Order Items</h3>
                <div className="divide-y divide-gray-50">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      {item.product?.mainImageUrl || item.imageUrl ? (
                        <img
                          src={item.product?.mainImageUrl || item.imageUrl}
                          alt={item.product?.name || item.productName || "Product"}
                          className="w-14 h-14 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-xl text-gray-300">
                          🛍
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {item.product?.name || item.productName || `Item #${idx + 1}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {(item.productVariant?.size || item.size) && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                              Size: {item.productVariant?.size || item.size}
                            </span>
                          )}
                          {(item.productVariant?.color || item.color) && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                              Color: {item.productVariant?.color || item.color}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">× {item.quantity}</span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                        EGP {item.totalPrice ?? item.price ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Shipping address */}
            {(order.shippingAddress || order.address || order.governorate) && (
              <motion.div variants={itemFade} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Shipping Address</h3>
                <div className="text-sm text-gray-600 space-y-1 leading-relaxed">
                  {(() => {
                    const addr = order.shippingAddress || order.address || order;
                    return (
                      <>
                        {addr.customerName && <p className="font-semibold text-gray-800">{addr.customerName}</p>}
                        {addr.street && <p>{addr.street}{addr.building ? `, ${addr.building}` : ""}{addr.floor ? `, ${addr.floor}` : ""}{addr.apartment ? `, ${addr.apartment}` : ""}</p>}
                        {addr.city && <p>{addr.city}{addr.governorate ? `, ${addr.governorate}` : ""}</p>}
                        {addr.state && <p>{addr.state}{addr.postalCode ? ` ${addr.postalCode}` : ""}</p>}
                        {addr.phoneNumber && <p className="text-gray-500">📞 {addr.phoneNumber}</p>}
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            )}

            {/* Notes */}
            {order.notes && (
              <motion.div variants={itemFade} className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800">
                <span className="font-semibold">Delivery note: </span>{order.notes}
              </motion.div>
            )}

            {/* CTA */}
            <motion.div variants={itemFade} className="flex gap-3">
              <button
                onClick={() => navigate("/")}
                className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => { setOrder(null); setInputValue(""); }}
                className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Track Another Order
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuestOrderTracking;
