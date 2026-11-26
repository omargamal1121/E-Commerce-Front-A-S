import React, { useState, useEffect, useContext } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import CheckoutModeSelector from "../components/CheckoutModeSelector";
import GuestCheckoutForm from "../components/GuestCheckoutForm";
import { ShopContext } from "../context/ShopContext";
import { usePromo } from "../context/PromoContext";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { MAX_PRODUCT_QUANTITY, notifyB2BMaxQuantity } from "../utils/b2bValidation";
import axios from "axios";

const isCOD = (method) => {
  if (!method) return false;
  if (method.id === 1) return true;
  const name = String(method.name || method.paymentMethod || "").toLowerCase().replace(/[\s_-]/g, "");
  return name.includes("cash") || name.includes("cod");
};

const PlaceOrder = () => {
  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    delivery_fee,
    products,
    getCartCount,
    isGuestCheckout,
    setGuestCheckoutMode
  } = useContext(ShopContext);
  const { appliedPromo, clearPromo } = usePromo();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(1); // COD only
  const [walletPhoneNumber, setWalletPhoneNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [addressFormData, setAddressFormData] = useState({
    phoneNumber: "",
    country: "",
    state: "",
    city: "",
    streetAddress: "",
    postalCode: "",
    isDefault: false,
    additionalNotes: "",
  });

  // Fetch addresses from API
  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/CustomerAddress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedAddresses = response.data.responseBody?.data || [];
      setAddresses(fetchedAddresses);

      const defaultAddress = fetchedAddresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (fetchedAddresses.length > 0) {
        setSelectedAddressId(fetchedAddresses[0].id);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load your saved addresses. Please try again.");
    }
  };

  // Fetch payment methods from API
  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/Enums/PaymentMethods`);
      const methods = response.data.responseBody?.data || [];
      setPaymentMethods(methods);

      // Auto-select COD method
      const codMethod = methods.find(isCOD) || methods.find(m => m.id === 1);
      if (codMethod) {
        setSelectedPaymentMethod(codMethod.id);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setPaymentMethods([
        { id: 1, name: "Cash on Delivery", paymentMethod: "COD" },
        { id: 2, name: "Credit / Debit Card", paymentMethod: "Visa / Mastercard" },
        { id: 4, name: "Mobile Wallet", paymentMethod: "Vodafone / Orange / Etisalat" },
      ]);
      setSelectedPaymentMethod(1);
    }
  };

  const addAddress = async (addressData) => {
    try {
      const response = await axios.post(`${backendUrl}/api/CustomerAddress`, addressData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.statuscode === 201) {
        toast.success("Address added successfully");
        setShowAddAddressForm(false);
        fetchAddresses();
      } else {
        toast.error(response.data.responseBody?.message || "Failed to add address");
      }
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("Failed to add address. Please try again.");
    }
  };

  const updateAddress = async (addressId, addressData) => {
    try {
      const response = await axios.put(`${backendUrl}/api/CustomerAddress/${addressId}`, addressData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.statuscode === 200) {
        toast.success("Address updated successfully");
        fetchAddresses();
      } else {
        toast.error(response.data.responseBody?.message || "Failed to update address");
      }
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error("Failed to update address. Please try again.");
    }
  };

  useEffect(() => {
    if (token) {
      fetchAddresses();
    }
    fetchPaymentMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeHandler = (e) => {
    const { name, type, checked, value } = e.target;
    setAddressFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (editingAddressId) {
      // Update existing address
      await updateAddress(editingAddressId, addressFormData);
      setEditingAddressId(null);
    } else {
      // Add new address
      await addAddress(addressFormData);
    }
    // Reset form and hide it
    setAddressFormData({
      phoneNumber: "",
      country: "",
      state: "",
      city: "",
      streetAddress: "",
      postalCode: "",
      isDefault: false,
      additionalNotes: "",
    });
    setShowAddAddressForm(false);
  };

  const handleAddressSelect = (id) => {
    setSelectedAddressId(id);
  };

  const handleAddNewAddress = () => {
    setEditingAddressId(null);
    setAddressFormData({
      phoneNumber: "",
      country: "",
      state: "",
      city: "",
      streetAddress: "",
      postalCode: "",
      isDefault: false,
      additionalNotes: "",
    });
    setShowAddAddressForm(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressFormData({
      phoneNumber: address.phoneNumber || "",
      country: address.country || "",
      state: address.state || "",
      city: address.city || "",
      streetAddress: address.streetAddress || "",
      postalCode: address.postalCode || "",
      isDefault: address.isDefault || false,
      additionalNotes: address.additionalNotes || "",
    });
    setShowAddAddressForm(true);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    // Check if user has items in cart
    const cartCount = getCartCount();
    console.log("Cart count:", cartCount);
    console.log("Cart items:", cartItems);
    console.log("Cart items keys:", Object.keys(cartItems));
    console.log("Cart items values:", Object.values(cartItems));

    if (cartCount === 0) {
      console.log("Cart is empty - showing error");
      toast.error("Your cart is empty. Please add items before placing an order.");
      setIsLoading(false);
      return;
    }

    // Validate maximum 5 items per product
    for (const [pId, variants] of Object.entries(cartItems || {})) {
      const totalForProduct = Object.values(variants || {}).reduce((sum, q) => sum + (Number(q) || 0), 0);
      if (totalForProduct > MAX_PRODUCT_QUANTITY) {
        const productInfo = products.find(p => String(p._id) === String(pId) || String(p.id) === String(pId));
        notifyB2BMaxQuantity(productInfo?.name);
        setIsLoading(false);
        return;
      }
    }

    // Resolve method value from already-loaded list – no second network call needed
    const methodValue = 1; // Cash on Delivery only

    setIsLoading(true);
    try {
      // Step 1: Create Order
      const orderPayload = {
        addressId: parseInt(selectedAddressId),
        notes: paymentNotes || "Order placed via website",
        ...(appliedPromo ? { promoCode: appliedPromo.code } : {}),
      };

      const orderResponse = await axios.post(
        `${backendUrl}/api/Order`,
        orderPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (orderResponse.data.statuscode === 201 || orderResponse.data.statuscode === 200) {
        const createdOrder = orderResponse.data.responseBody?.data;
        const orderNumber = createdOrder?.orderNumber;

        if (!orderNumber) {
          throw new Error("Order number not received from server");
        }

        // Clear promo after order created successfully
        clearPromo();

        toast.success("Order created successfully! Processing payment...");

        // Step 2: Process Payment (COD)
        const paymentPayload = {
          orderNumber: orderNumber,
          paymentDetails: {
            walletPhoneNumber: "",
            paymentMethod: 1, // Cash on Delivery
            currency: "EGP",
            notes: paymentNotes || ""
          }
        };

        const paymentResponse = await axios.post(
          `${backendUrl}/api/Payment`,
          paymentPayload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (paymentResponse.data.statuscode === 200) {
          const pData = paymentResponse.data.responseBody?.data;

          if (pData?.isRedirectRequired && pData?.redirectUrl) {
            toast.success("Redirecting to payment gateway...");

            localStorage.setItem('pendingOrderNumber', orderNumber);
            localStorage.setItem('paymentRedirectTime', Date.now().toString());

            const returnUrl = `${window.location.origin}/orders`;
            const separator = pData.redirectUrl.includes('?') ? '&' : '?';
            const redirectUrlWithReturn = `${pData.redirectUrl}${separator}return_url=${encodeURIComponent(returnUrl)}`;

            window.location.href = redirectUrlWithReturn;
          } else {
            // Clear cart after successful payment
            try {
              await axios.delete(`${backendUrl}/api/Cart/items/clear`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setCartItems({});
              localStorage.removeItem('cartItems');
            } catch (clearError) {
              console.error("Failed to clear cart after order:", clearError);
            }

            toast.success("Payment processed successfully!");
            navigate("/orders");
          }
        } else {
          toast.error(paymentResponse.data.responseBody?.message || "Payment failed");
        }
      } else {
        toast.error(orderResponse.data.responseBody?.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Error placing order:", error.response?.data || error.message);
      console.error("Full error object:", error);

      // Promo code expired/invalid between apply and submit — clear it and let user retry
      const errMsg = error.response?.data?.responseBody?.message || "";
      const isPromoError = errMsg.toLowerCase().includes("promo") || errMsg.toLowerCase().includes("code");
      if (isPromoError && appliedPromo) {
        clearPromo();
        toast.error("Your promo code is no longer valid. Please try another code or place the order without it.");
      } else if (error.response?.status === 403) {
        toast.error("Authentication failed. Please login again.");
      } else if (error.response?.status === 400) {
        toast.error(errMsg || "Invalid order data. Please check your information.");
      } else {
        toast.error(errMsg || "Failed to process order. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const sectionVariants = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } };
  const formVariants = { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } } };
  const paymentVariants = { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } } };
  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  // Show checkout mode selector if user is not logged in and hasn't selected guest checkout
  if (!token && !isGuestCheckout) {
    return <CheckoutModeSelector />;
  }

  // Show guest checkout form if guest checkout mode is selected
  if (!token && isGuestCheckout) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] bg-[var(--bg)]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Title text1={'GUEST'} text2={'CHECKOUT'} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <GuestCheckoutForm />
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <CartTotal />
                <button
                  onClick={() => setGuestCheckoutMode(false)}
                  className="w-full mt-4 px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-semibold hover:bg-[var(--surface-raised)] transition-all text-[var(--text)]"
                >
                  ← Back to Checkout Options
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 sm:pt-36 pb-16 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] bg-[var(--bg)] text-[var(--text)]">
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2 min-h-[80vh] overflow-hidden">
        {/* Left - Address */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={formVariants} className="flex flex-col gap-4 w-full sm:max-w-[480px]">
          <motion.div variants={sectionVariants} className="text-xl sm:text-2xl my-3">
            <Title text1={"DELIVERY"} text2={"ADDRESS"} />
          </motion.div>

          <motion.div variants={containerVariants} className="flex flex-col gap-4">
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Select Delivery Address
              </label>
              {addresses.map((address) => (
                <motion.div
                  key={address.id}
                  className={`border rounded-md p-3 transition-colors ${selectedAddressId === address.id
                    ? "border-[var(--success)] bg-[var(--success)]/10"
                    : "border-[var(--border)] hover:border-gray-400"
                    }`}
                >
                  <div
                    onClick={() => handleAddressSelect(address.id)}
                    className="cursor-pointer"
                  >
                    <p className="font-medium">{address.streetAddress}</p>
                    <p>
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p>{address.country}</p>
                    <p>Phone: {address.phoneNumber}</p>
                    {address.isDefault && (
                      <span className="inline-block bg-[var(--accent)]/20 text-[var(--accent)] text-xs px-2 py-1 rounded mt-1">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => handleEditAddress(address)}
                      className="text-sm px-3 py-1 rounded-md border border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const response = await axios.delete(
                            `${backendUrl}/api/CustomerAddress/${address.id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          if (response.data.statuscode === 200) {
                            toast.success("Address deleted successfully");
                            fetchAddresses();
                          } else {
                            toast.error(
                              response.data.responseBody.message ||
                              "Failed to delete address"
                            );
                          }
                        } catch (error) {
                          console.error("Error deleting address:", error);
                          toast.error("Failed to delete address");
                        }
                      }}
                      className="text-sm px-3 py-1 rounded-md border border-red-500 text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants}>
              <button type="button" onClick={() => {
                if (showAddAddressForm) {
                  setShowAddAddressForm(false);
                  setEditingAddressId(null);
                  setAddressFormData({
                    phoneNumber: "",
                    country: "",
                    state: "",
                    city: "",
                    streetAddress: "",
                    postalCode: "",
                    isDefault: false,
                    additionalNotes: "",
                  });
                } else {
                  // Add new address - open form in add mode
                  handleAddNewAddress();
                }
              }} className="w-full border border-[var(--border)] rounded-md px-3.5 py-2 text-[var(--text)] hover:border-gray-400 transition-colors">
                {showAddAddressForm ? "Cancel" : "+ Add New Address"}
              </button>
            </motion.div>

            {showAddAddressForm && (
              <motion.div initial="hidden" animate="visible" variants={containerVariants} className="border border-gray-200 rounded-md p-4 bg-[var(--surface)] mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingAddressId ? "Update Address" : "Add New Address"}
                </h3>
                <form onSubmit={handleAddAddress}>
                  <motion.input variants={itemVariants} className="border border-[var(--border)] rounded-md px-3.5 py-1.5 w-full mb-3" type="text" name="streetAddress" onChange={onChangeHandler} value={addressFormData.streetAddress} placeholder="Street Address" required />
                  <motion.div variants={itemVariants} className="flex gap-3 mb-3">
                    <input className="border border-[var(--border)] rounded-md px-3.5 py-1.5 w-full" type="text" name="city" onChange={onChangeHandler} value={addressFormData.city} placeholder="City" required />
                    <input className="border border-[var(--border)] rounded-md px-3.5 py-1.5 w-full" type="text" name="state" onChange={onChangeHandler} value={addressFormData.state} placeholder="State" required />
                  </motion.div>
                  <motion.div variants={itemVariants} className="flex gap-3 mb-3">
                    <input className="border border-[var(--border)] rounded-md px-3.5 py-1.5 w-full" type="text" name="postalCode" onChange={onChangeHandler} value={addressFormData.postalCode} placeholder="Postal Code" required />
                    <input className="border border-[var(--border)] rounded-md px-3.5 py-1.5 w-full" type="text" name="country" onChange={onChangeHandler} value={addressFormData.country} placeholder="Country" required />
                  </motion.div>
                  <motion.input variants={itemVariants} className="border border-[var(--border)] rounded-md px-3.5 py-1.5 w-full mb-3" type="tel" name="phoneNumber" onChange={onChangeHandler} value={addressFormData.phoneNumber} placeholder="Phone Number" required />
                  <motion.textarea variants={itemVariants} className="border border-[var(--border)] rounded-md px-3.5 py-1.5 w-full mb-3" name="additionalNotes" onChange={onChangeHandler} value={addressFormData.additionalNotes} placeholder="Additional Notes (Optional)" rows="2" />
                  <motion.div variants={itemVariants} className="flex items-center gap-2 mb-3">
                    <input type="checkbox" name="isDefault" onChange={onChangeHandler} checked={addressFormData.isDefault} className="rounded" />
                    <label className="text-sm text-[var(--text)]">Set as default address</label>
                  </motion.div>
                  <motion.button variants={itemVariants} type="submit" className="w-full bg-[var(--brand)] text-[var(--text)] px-4 py-2 rounded-md hover:bg-gray-800 transition-colors">
                    {editingAddressId ? "Update Address" : "Add Address"}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Right - Order Summary */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={paymentVariants} className="mt-8 p-3">
          {/* Payment Method Selection */}
          <motion.div variants={sectionVariants} className="mb-8">
            <Title text1={"PAYMENT"} text2={"METHOD"} />
            <div className="mt-4 space-y-3">
              {(paymentMethods.length > 0
                ? paymentMethods
                : [
                    { id: 1, name: "Cash on Delivery", paymentMethod: "COD" },
                    { id: 2, name: "Credit / Debit Card", paymentMethod: "Visa / Mastercard" },
                    { id: 4, name: "Mobile Wallet", paymentMethod: "Vodafone / Orange / Etisalat" }
                  ]
              ).map((method) => {
                const isMethodCOD = isCOD(method);
                const isSelected = selectedPaymentMethod === method.id;

                return (
                  <div
                    key={method.id}
                    onClick={() => {
                      if (isMethodCOD) {
                        setSelectedPaymentMethod(method.id);
                      }
                    }}
                    className={`border rounded-xl p-4 flex items-center justify-between transition-all ${
                      isMethodCOD
                        ? isSelected
                          ? "border-[var(--success)] bg-[var(--success)]/10 cursor-pointer shadow-sm"
                          : "border-[var(--border)] hover:border-gray-400 cursor-pointer"
                        : "border-[var(--border)] bg-gray-50/70 dark:bg-gray-800/30 opacity-50 cursor-not-allowed select-none"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isMethodCOD && isSelected
                            ? "border-[var(--success)] bg-[var(--success)]"
                            : "border-gray-300"
                        }`}
                      >
                        {isMethodCOD && isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold text-sm ${isMethodCOD ? "text-[var(--text)]" : "text-gray-500"}`}>
                            {method.name}
                          </p>
                          {!isMethodCOD && (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-700">
                              Soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {isMethodCOD
                            ? "Pay in cash when your order arrives"
                            : "Available soon"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={sectionVariants} className="mt-8 min-w-80">
            <CartTotal />
          </motion.div>
          <motion.div variants={containerVariants} className="mt-12">
            <motion.div variants={itemVariants} className="w-full text-end mt-8">
              <motion.button
                type="button"
                whileHover={{ scale: selectedAddressId ? 1.01 : 1 }}
                whileTap={{ scale: selectedAddressId ? 0.95 : 1 }}
                onClick={onSubmitHandler}
                disabled={!selectedAddressId || isLoading}
                className={`px-16 py-3 uppercase font-medium transition-all duration-300 ${selectedAddressId && !isLoading ? "bg-[var(--brand)] text-[var(--text)] cursor-pointer hover:bg-white hover:text-black border border-black" : "bg-gray-300 text-gray-500 cursor-not-allowed border border-[var(--border)]"}`}
              >
                {isLoading ? "Processing..." : "Place Order"}
              </motion.button>
              {!selectedAddressId && <p className="text-red-500 text-sm mt-2">Please select a delivery address</p>}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlaceOrder;
