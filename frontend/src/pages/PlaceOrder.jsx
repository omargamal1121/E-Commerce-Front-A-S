import React, { useState, useEffect, useContext } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { ShopContext } from "../context/ShopContext";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";

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
    getCartCount
  } = useContext(ShopContext);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
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
    const response = await axios.get(`${backendUrl}/api/CustomerAddress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const fetchedAddresses = response.data.responseBody.data || [];
    setAddresses(fetchedAddresses);

    // لو فيه عنوان Default يختاره
    const defaultAddress = fetchedAddresses.find(addr => addr.isDefault);
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
    } else if (fetchedAddresses.length > 0) {
      setSelectedAddressId(fetchedAddresses[0].id);
    }
  };

  // Fetch payment methods from API
  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/Enums/PaymentMethods`);
      const methods = response.data.responseBody?.data || [];
      setPaymentMethods(methods);

      // Auto-select first payment method
      if (methods.length > 0) {
        setSelectedPaymentMethod(methods[0].id);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Failed to load payment methods");
    }
  };

  const addAddress = async (addressData) => {
    const response = await axios.post(`${backendUrl}/api/CustomerAddress`, addressData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.statuscode === 201) {
      toast.success("Address added successfully");
      setShowAddAddressForm(false);
      fetchAddresses();
    }
  };

  const updateAddress = async (addressId, addressData) => {
    const response = await axios.put(`${backendUrl}/api/CustomerAddress/${addressId}`, addressData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.statuscode === 200) {
      toast.success("Address updated successfully");
      fetchAddresses();
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchPaymentMethods();

    // Debug cart state on component mount
    console.log("PlaceOrder mounted - Cart items:", cartItems);
    console.log("PlaceOrder mounted - Cart count:", getCartCount());
    console.log("PlaceOrder mounted - localStorage cart:", localStorage.getItem("cartItems"))
  }, [cartItems, getCartCount]);

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
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
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

    setIsLoading(true);
    try {
      // Step 1: Create Order
      console.log("Selected address ID (raw):", selectedAddressId);
      console.log("Selected address ID type:", typeof selectedAddressId);

      const orderData = {
        addressId: parseInt(selectedAddressId), // Ensure it's an integer
        notes: paymentNotes || "Order placed via website"
      };

      console.log("Submitting order data:", JSON.stringify(orderData, null, 2));
      console.log("Request headers:", {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });

      const orderResponse = await axios.post(
        `${backendUrl}/api/Order`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Order response:", orderResponse.data);

      if (orderResponse.data.statuscode === 201 || orderResponse.data.statuscode === 200) {
        const orderData = orderResponse.data.responseBody?.data;
        const orderNumber = orderData?.orderNumber;

        console.log("Order created successfully. Order data:", orderData);
        console.log("Order number:", orderNumber);

        if (!orderNumber) {
          console.error("Order number missing from response:", orderData);
          throw new Error("Order number not received from server");
        }

        toast.success("Order created successfully! Processing payment...");

        // Find the selected payment method details for debugging
        const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
        console.log("Selected payment method:", selectedMethod);
        console.log("Selected payment method ID:", selectedPaymentMethod);

        // Validate payment method against Enums API to get correct enum value
        let methodValue = NaN;
        try {
          const enumResp = await axios.get(
            `${backendUrl}/api/Enums/PaymentMethods`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const enumList = enumResp?.data?.responseBody?.data || [];
          console.log("Payment method enums:", enumList);

          // Try to match by payment method name
          const selectedName = (selectedMethod?.paymentMethod || "").toString().toLowerCase();
          const enumMatch = enumList.find(
            (e) => (e.name || e.Name || "").toString().toLowerCase() === selectedName
          );

          if (enumMatch) {
            methodValue = Number(enumMatch.id);
          } else {
            // If not matched by name, try to use the ID directly if it exists in enum ids
            const selNum = Number(selectedPaymentMethod);
            const allowed = new Set(
              enumList
                .map((e) => Number(e.id))
                .filter((n) => Number.isFinite(n) && n > 0)
            );
            if (Number.isFinite(selNum) && allowed.has(selNum)) {
              methodValue = selNum;
            }
          }

          if (!Number.isFinite(methodValue) || methodValue <= 0) {
            console.error("Could not resolve valid payment method.", {
              selectedPaymentMethod,
              selectedMethod,
              enumList
            });
            toast.error("Invalid payment method selected. Please try again.");
            return;
          }

          console.log("Resolved payment method value:", methodValue, {
            selectedPaymentMethod,
            selectedMethod,
          });

        } catch (error) {
          console.error("Error fetching payment method enums:", error);
          toast.error("Failed to validate payment method. Please try again.");
          return;
        }

        // Step 2: Process Payment
        const paymentData = {
          orderNumber: orderNumber,
          paymentDetails: {
            walletPhoneNumber: walletPhoneNumber || "",
            paymentMethod: methodValue, // Use validated enum value
            currency: "EGP",
            notes: paymentNotes || ""
          }
        };

        console.log("Processing payment with data:", JSON.stringify(paymentData, null, 2));

        const paymentResponse = await axios.post(
          `${backendUrl}/api/Payment`,
          paymentData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Payment response:", paymentResponse.data);

        if (paymentResponse.data.statuscode === 200) {
          const paymentData = paymentResponse.data.responseBody?.data;

          console.log("Payment successful. Payment data:", paymentData);

          if (paymentData?.isRedirectRequired && paymentData?.redirectUrl) {
            console.log("Redirecting to payment URL:", paymentData.redirectUrl);
            toast.success("Redirecting to payment gateway...");

            // Store order info in localStorage for return handling
            localStorage.setItem('pendingOrderNumber', orderNumber);
            localStorage.setItem('paymentRedirectTime', Date.now().toString());

            // Add return URL parameter if the payment gateway supports it
            const returnUrl = `${window.location.origin}/orders`;
            const separator = paymentData.redirectUrl.includes('?') ? '&' : '?';
            const redirectUrlWithReturn = `${paymentData.redirectUrl}${separator}return_url=${encodeURIComponent(returnUrl)}`;

            window.location.href = redirectUrlWithReturn;
          } else {
            console.log("Payment completed without redirect");
            // Clear cart after successful payment
            try {
              await axios.delete(`${backendUrl}/api/Cart/items/clear`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setCartItems({}); // Clear global state
              // Local storage clearing if needed
              localStorage.removeItem('cartItems');
            } catch (clearError) {
              console.error("Failed to clear cart after order:", clearError);
            }

            toast.success("Payment processed successfully!");
            navigate("/orders");
          }
        } else {
          console.error("Payment failed with status:", paymentResponse.data.statuscode);
          toast.error(paymentResponse.data.responseBody?.message || "Payment failed");
        }
      } else {
        console.error("Order creation failed with status:", orderResponse.data.statuscode);
        toast.error(orderResponse.data.responseBody?.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Error placing order:", error.response?.data || error.message);
      console.error("Full error object:", error);

      if (error.response?.status === 403) {
        toast.error("Authentication failed. Please login again.");
      } else if (error.response?.status === 400) {
        toast.error("Invalid order data. Please check your information.");
      } else {
        toast.error(error.response?.data?.responseBody?.message || "Failed to process order. Please try again.");
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

  return (
    <div className="mt-[80px] mb-5 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] overflow-hidden">
        {/* Left - Address */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={formVariants} className="flex flex-col gap-4 w-full sm:max-w-[480px]">
          <motion.div variants={sectionVariants} className="text-xl sm:text-2xl my-3">
            <Title text1={"DELIVERY"} text2={"ADDRESS"} />
          </motion.div>

          <motion.div variants={containerVariants} className="flex flex-col gap-4">
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Delivery Address
              </label>
              {addresses.map((address) => (
                <motion.div
                  key={address.id}
                  className={`border rounded-md p-3 transition-colors ${selectedAddressId === address.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
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
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
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
              }} className="w-full border border-gray-300 rounded-md px-3.5 py-2 text-gray-700 hover:border-gray-400 transition-colors">
                {showAddAddressForm ? "Cancel" : "+ Add New Address"}
              </button>
            </motion.div>

            {showAddAddressForm && (
              <motion.div initial="hidden" animate="visible" variants={containerVariants} className="border border-gray-200 rounded-md p-4 bg-gray-50 mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingAddressId ? "Update Address" : "Add New Address"}
                </h3>
                <form onSubmit={handleAddAddress}>
                  <motion.input variants={itemVariants} className="border border-gray-300 rounded-md px-3.5 py-1.5 w-full mb-3" type="text" name="streetAddress" onChange={onChangeHandler} value={addressFormData.streetAddress} placeholder="Street Address" required />
                  <motion.div variants={itemVariants} className="flex gap-3 mb-3">
                    <input className="border border-gray-300 rounded-md px-3.5 py-1.5 w-full" type="text" name="city" onChange={onChangeHandler} value={addressFormData.city} placeholder="City" required />
                    <input className="border border-gray-300 rounded-md px-3.5 py-1.5 w-full" type="text" name="state" onChange={onChangeHandler} value={addressFormData.state} placeholder="State" required />
                  </motion.div>
                  <motion.div variants={itemVariants} className="flex gap-3 mb-3">
                    <input className="border border-gray-300 rounded-md px-3.5 py-1.5 w-full" type="text" name="postalCode" onChange={onChangeHandler} value={addressFormData.postalCode} placeholder="Postal Code" required />
                    <input className="border border-gray-300 rounded-md px-3.5 py-1.5 w-full" type="text" name="country" onChange={onChangeHandler} value={addressFormData.country} placeholder="Country" required />
                  </motion.div>
                  <motion.input variants={itemVariants} className="border border-gray-300 rounded-md px-3.5 py-1.5 w-full mb-3" type="tel" name="phoneNumber" onChange={onChangeHandler} value={addressFormData.phoneNumber} placeholder="Phone Number" required />
                  <motion.textarea variants={itemVariants} className="border border-gray-300 rounded-md px-3.5 py-1.5 w-full mb-3" name="additionalNotes" onChange={onChangeHandler} value={addressFormData.additionalNotes} placeholder="Additional Notes (Optional)" rows="2" />
                  <motion.div variants={itemVariants} className="flex items-center gap-2 mb-3">
                    <input type="checkbox" name="isDefault" onChange={onChangeHandler} checked={addressFormData.isDefault} className="rounded" />
                    <label className="text-sm text-gray-700">Set as default address</label>
                  </motion.div>
                  <motion.button variants={itemVariants} type="submit" className="w-full bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors">
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
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${selectedPaymentMethod === method.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
                    }`}
                >
                  <div
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className="cursor-pointer"
                  >
                    <p className="font-medium">{method.name}</p>
                    <p className="text-sm text-gray-500">{method.paymentMethod}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${selectedPaymentMethod === method.id
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300"
                    }`}>
                    {selectedPaymentMethod === method.id && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Wallet Phone Number (if needed) */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={walletPhoneNumber}
                onChange={(e) => setWalletPhoneNumber(e.target.value)}
                className="border border-gray-300 rounded-md px-3.5 py-1.5 w-full"
                placeholder="Enter wallet phone number"
              />
            </div>

            {/* Payment Notes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Notes (Optional)
              </label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="border border-gray-300 rounded-md px-3.5 py-1.5 w-full"
                placeholder="Add any payment notes"
                rows="2"
              />
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
                disabled={!selectedAddressId || !selectedPaymentMethod || isLoading}
                className={`px-16 py-3 uppercase font-medium transition-all duration-300 ${selectedAddressId && selectedPaymentMethod && !isLoading ? "bg-black text-white cursor-pointer hover:bg-white hover:text-black border border-black" : "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-300"}`}
              >
                {isLoading ? "Processing..." : "Place Order & Pay"}
              </motion.button>
              {!selectedAddressId && <p className="text-red-500 text-sm mt-2">Please select a delivery address</p>}
              {!selectedPaymentMethod && <p className="text-red-500 text-sm mt-2">Please select a payment method</p>}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlaceOrder;
