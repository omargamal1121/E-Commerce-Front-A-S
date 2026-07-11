import React, { useState, useEffect, useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { placeGuestOrder, initiateGuestPayment } from "../services/guestCheckoutService";
import axios from "axios";

/* ─── animation variants ──────────────────────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } } };
const fadeLeft = { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: "easeOut" } } };
const fadeRight = { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: "easeOut" } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const itemFade = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38 } } };

/* ─── helper ──────────────────────────────────────────────────────────────── */
const EMPTY_FORM = {
  customerName: "",
  phoneNumber: "",
  email: "",
  governorate: "",
  city: "",
  street: "",
  building: "",
  notes: "",
};

const REQUIRED_FIELDS = ["customerName", "phoneNumber", "city", "street"];

const FIELD_LABELS = {
  customerName: "Full Name",
  phoneNumber: "Phone Number",
  email: "Email Address",
  governorate: "Governorate (Optional)",
  city: "City",
  street: "Street Address",
  building: "Building (Optional)",
  notes: "Delivery Notes",
};

const FIELD_PLACEHOLDERS = {
  customerName: "John Doe",
  phoneNumber: "+201234567890",
  email: "john@example.com",
  governorate: "e.g. Cairo",
  city: "e.g. Maadi",
  street: "e.g. 9th Street",
  building: "e.g. Building 12",
  notes: "Any special delivery instructions…",
};

/* ─── layout config: how fields are grouped into rows ────────────────────── */
const FIELD_ROWS = [
  ["customerName"],
  ["phoneNumber", "email"],
  ["governorate", "city"],
  ["street"],
  ["building"],
  ["notes"],
];

/* ════════════════════════════════════════════════════════════════════════════
   GuestCheckout component
   ════════════════════════════════════════════════════════════════════════════ */
const GuestCheckout = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    products,
    currency,
    delivery_fee,
    clearGuestCart,
    resolveVariantId,
    backendUrl,
    token,
  } = useContext(ShopContext);

  /* ── redirect authenticated users to the normal flow ── */
  useEffect(() => {
    if (token) {
      navigate("/place-order", { replace: true });
    }
  }, [token, navigate]);

  /* ── local state ── */
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [walletPhone, setWalletPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvingVariants, setResolvingVariants] = useState(false);

  /* ── fetch payment methods ── */
  useEffect(() => {
    axios
      .get(`${backendUrl}/api/Enums/PaymentMethods`)
      .then((res) => {
        const methods = res.data.responseBody?.data || res.data?.data || [];
        setPaymentMethods(methods);
        if (methods.length > 0) setSelectedPaymentMethod(methods[0].id);
      })
      .catch(() => toast.error("Failed to load payment methods."));
  }, [backendUrl]);

  /* ── derive flat cart list from cartItems + products ── */
  const cartLines = useMemo(() => {
    const lines = [];
    for (const productId in cartItems) {
      const variants = cartItems[productId];
      for (const key in variants) {
        const qty = variants[key];
        if (qty <= 0) continue;
        const parts = key.split("_");
        const size = parts[0];
        const color = parts[1] || null;
        const productData = products.find((p) => String(p._id) === String(productId)) || {};
        lines.push({
          productId: Number(productId),
          size,
          color,
          quantity: qty,
          name: productData.name || "Product",
          price: productData.finalPrice || productData.price || 0,
          image: productData.image?.[0] || "",
        });
      }
    }
    return lines;
  }, [cartItems, products]);

  /* ── computed totals ── */
  const subtotal = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [cartLines]
  );

  /* ─── form helpers ─────────────────────────────────────────────────────── */
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    REQUIRED_FIELDS.forEach((field) => {
      if (!form[field].trim()) newErrors[field] = `${FIELD_LABELS[field]} is required.`;
    });
    // basic email check
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address.";
    }
    // basic phone check
    if (form.phoneNumber && !/^\+?[0-9\s\-()]{7,20}$/.test(form.phoneNumber)) {
      newErrors.phoneNumber = "Enter a valid phone number.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ─── submit handler ───────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartLines.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    setIsSubmitting(true);

    try {
      /* 1. Resolve productVariantId for every cart line */
      setResolvingVariants(true);
      const resolvedItems = await Promise.all(
        cartLines.map(async (line) => {
          const variantId = await resolveVariantId(line.productId, line.size);
          return {
            productId: line.productId,
            productVariantId: variantId,
            quantity: line.quantity,
          };
        })
      );
      setResolvingVariants(false);

      const unresolvedCount = resolvedItems.filter((i) => !i.productVariantId).length;
      if (unresolvedCount > 0) {
        toast.error(
          `Could not resolve ${unresolvedCount} item variant(s). Please check your cart sizes.`
        );
        setIsSubmitting(false);
        return;
      }

      /* 2. Build and submit the guest order */
      const orderPayload = {
        customerName: form.customerName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        governorate: form.governorate.trim() || null,
        city: form.city.trim(),
        street: form.street.trim(),
        building: form.building.trim() || null,
        notes: form.notes.trim() || null,
        items: resolvedItems,
      };

      const orderResult = await placeGuestOrder(orderPayload);
      console.log("[GuestCheckout] placeGuestOrder result:", orderResult);

      if (!orderResult.success) {
        toast.error(orderResult.message || "Failed to place order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const { orderNumber } = orderResult;
      toast.success("Order placed successfully!");

      /* 3. Clear guest cart */
      clearGuestCart();

      /* 4. Always store the order number in localStorage so GuestOrderSuccess
            can retrieve it after Paymob redirects back (query params may be
            stripped by some payment gateways). */
      localStorage.setItem("pendingGuestOrderNumber", orderNumber);
      localStorage.setItem("paymentRedirectTime", Date.now().toString());

      /* 5. Call the payment API for ALL methods — the backend decides whether
            a redirect is needed (online card/wallet) or not (COD). */
      const payResult = await initiateGuestPayment(
        orderNumber,
        Number(selectedPaymentMethod),
        walletPhone,
        ""
      );

      if (!payResult.success) {
        // Payment API failed but the order exists — show success with a warning
        toast.error(payResult.message || "Payment initiation failed. Please contact support.");
        navigate(`/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}&paymentFailed=1`);
        return;
      }

      if (payResult.redirectUrl) {
        // Online payment (Card / Wallet): redirect to Paymob checkout page
        toast.success("Redirecting to payment gateway…");

        const returnUrl = `${window.location.origin}/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}`;
        const sep = payResult.redirectUrl.includes("?") ? "&" : "?";
        window.location.href = `${payResult.redirectUrl}${sep}return_url=${encodeURIComponent(returnUrl)}`;
      } else {
        // COD or any non-redirect method: order + payment processed, go to success
        toast.success("Order confirmed!");
        navigate(`/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}`);
      }
    } catch (err) {
      console.error("[GuestCheckout] submit error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
      setResolvingVariants(false);
    }
  };

  /* ─── field renderer ────────────────────────────────────────────────────── */
  const renderField = (fieldName) => {
    const isTextarea = fieldName === "notes";
    const label = FIELD_LABELS[fieldName];
    const placeholder = FIELD_PLACEHOLDERS[fieldName];
    const isRequired = REQUIRED_FIELDS.includes(fieldName);
    const hasError = !!errors[fieldName];

    const inputClasses = `w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all duration-200
      ${hasError
        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300"
        : "border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
      }`;

    return (
      <motion.div key={fieldName} variants={itemFade} className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {label}
          {isRequired && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {isTextarea ? (
          <textarea
            name={fieldName}
            value={form[fieldName]}
            onChange={onChange}
            placeholder={placeholder}
            rows={3}
            className={inputClasses + " resize-none"}
          />
        ) : (
          <input
            type={fieldName === "email" ? "email" : fieldName === "phoneNumber" ? "tel" : "text"}
            name={fieldName}
            value={form[fieldName]}
            onChange={onChange}
            placeholder={placeholder}
            className={inputClasses}
          />
        )}
        <AnimatePresence>
          {hasError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs text-red-500 mt-0.5"
            >
              {errors[fieldName]}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  /* ─── selected method label ─────────────────────────────────────────────── */
  const selectedMethodObj = paymentMethods.find((m) => m.id === selectedPaymentMethod);
  const isWallet = selectedMethodObj?.name?.toLowerCase().includes("wallet") ||
    selectedMethodObj?.paymentMethod?.toLowerCase().includes("wallet");

  if (cartLines.length === 0 && !isSubmitting) {
    return (
      <div className="mt-[100px] mb-10 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl">🛒</div>
        <h2 className="text-2xl font-semibold text-gray-800">Your cart is empty</h2>
        <p className="text-gray-500 text-center max-w-sm">
          Add some items to your cart before proceeding to checkout.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  /* ─── render ────────────────────────────────────────────────────────────── */
  return (
    <div className="mt-[90px] mb-16 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      {/* Page header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="pt-8 pb-2 mb-8 border-b border-gray-100"
      >
        <div className="text-2xl sm:text-3xl mb-1">
          <Title text1="GUEST" text2="CHECKOUT" />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          No account needed.{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-black underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            Sign in
          </button>{" "}
          for faster checkout and order tracking.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col lg:flex-row gap-10">

          {/* ══ LEFT — Shipping / Contact form ══ */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeLeft}
            className="flex-1"
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">1</span>
                Contact & Shipping Details
              </h2>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="flex flex-col gap-4"
              >
                {FIELD_ROWS.map((row, ri) => (
                  <motion.div
                    key={ri}
                    variants={itemFade}
                    className={`grid gap-4 ${row.length === 1 ? "grid-cols-1" : row.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}
                  >
                    {row.map((field) => renderField(field))}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* ══ RIGHT — Order Summary + Payment ══ */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeRight}
            className="w-full lg:w-[400px] flex flex-col gap-6"
          >
            {/* Order Summary card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">2</span>
                Order Summary
              </h2>

              {cartLines.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Cart is empty</p>
              ) : (
                <div className="flex flex-col divide-y divide-gray-50">
                  {cartLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      {line.image ? (
                        <img
                          src={line.image}
                          alt={line.name}
                          className="w-14 h-14 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-xl">
                          🛍
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{line.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {line.size}
                          </span>
                          {line.color && line.color !== "Unknown" && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-gray-200 inline-block"
                              style={{ backgroundColor: line.color.startsWith("#") ? line.color : `#${line.color}` }}
                              title={line.color}
                            />
                          )}
                          <span className="text-xs text-gray-400">× {line.quantity}</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                        {currency}{(line.price * line.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="mt-5 pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{currency}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Calculated at delivery</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{currency}{subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">3</span>
                Payment Method
              </h2>

              {paymentMethods.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
                  Loading payment methods…
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {paymentMethods.map((method) => {
                    const active = selectedPaymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(method.id)}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 ${active
                            ? "border-black bg-gray-50 shadow-sm"
                            : "border-gray-100 hover:border-gray-300"
                          }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${active ? "border-black" : "border-gray-300"
                            }`}
                        >
                          {active && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{method.name}</p>
                          {method.paymentMethod && method.paymentMethod !== method.name && (
                            <p className="text-xs text-gray-400">{method.paymentMethod}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Wallet phone – conditional */}
              <AnimatePresence>
                {isWallet && (
                  <motion.div
                    key="wallet-phone"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Wallet Phone Number
                      </label>
                      <input
                        type="tel"
                        value={walletPhone}
                        onChange={(e) => setWalletPhone(e.target.value)}
                        placeholder="+201234567890"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-200 text-sm outline-none transition-all duration-200"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isSubmitting || cartLines.length === 0}
              whileHover={!isSubmitting ? { scale: 1.01 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              className={`w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all duration-300 flex items-center justify-center gap-3
                ${isSubmitting || cartLines.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-900 shadow-lg shadow-black/10"
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  {resolvingVariants ? "Validating items…" : "Placing order…"}
                </>
              ) : (
                <>
                  Place Order
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </motion.button>

            <p className="text-xs text-gray-400 text-center -mt-2">
              By placing an order you agree to our{" "}
              <button
                type="button"
                onClick={() => navigate("/policy")}
                className="underline hover:text-gray-700 transition-colors"
              >
                Privacy Policy
              </button>
              .
            </p>
          </motion.div>
        </div>
      </form>
    </div>
  );
};

export default GuestCheckout;
