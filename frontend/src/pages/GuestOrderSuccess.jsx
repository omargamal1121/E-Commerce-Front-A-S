import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { getGuestOrderByNumber } from "../services/guestCheckoutService";

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
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderNumber) return;

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
      <div className="mt-[80px] min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="animate-spin h-12 w- border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="mt-[80px] min-h-[80vh] flex items-center justify-center px-4 py-16">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="w-full max-w-lg text-center"
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

        {/* ── order number card ── */}
        {orderNumber && (
          <motion.div
            variants={itemFade}
            className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 mb-8 mx-auto"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Order Number
            </p>
            <p className="text-xl font-bold text-gray-900 font-mono tracking-wide break-all">
              {orderNumber}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Save this number for your records.
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
