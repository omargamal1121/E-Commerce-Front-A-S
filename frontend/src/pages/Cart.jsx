import React, { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/frontend_assets/assets";
import CartTotal from "../components/CartTotal";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    updataQuantity,
    navigate,
    backendUrl,
    checkout,
    setCartItems,
    serverCart, // 🆕 Get server cart data
  } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(""); // 🛠️ Error state
  const [loading, setLoading] = useState(false); // 🛠️ Loading state
  const token = localStorage.getItem("token");

  useEffect(() => {
    // 🆕 Extract items correctly whether serverCart is an array or object
    const cartItemsList = Array.isArray(serverCart)
      ? serverCart
      : (serverCart?.items || []);

    if (cartItemsList.length > 0) {
      // 🆕 Use server cart data directly if available
      console.log("Using server cart data:", cartItemsList);
      const tempData = cartItemsList.map(item => ({
        _id: item.productId || (item.product ? item.product.id : null),
        quantity: item.quantity,
        size: item.productVariant?.size || item.product?.productVariantForCartDto?.size || item.size || 'Unknown',
        color: item.productVariant?.color || item.product?.productVariantForCartDto?.color || item.color || 'Unknown',
        variantId: item.productVariantId || item.productVariant?.id || item.product?.productVariantForCartDto?.id, // Store variant ID for actions
        productData: item.product, // Store full product data
        price: item.product?.finalPrice || item.product?.price,
        image: item.productVariant?.images?.[0]?.url || item.product?.mainImageUrl || item.product?.image?.[0]
      })).filter(item => item._id); // Filter out invalid items

      setCartData(tempData);
    } else {
      // 🔄 Fallback to local cart reconstruction
      const tempData = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            // Parse size and color from the item key (format: "size_color" or just "size")
            const parts = item.split('_');
            const size = parts[0];
            const color = parts[1] || 'Unknown'; // Default to 'Unknown' if no color

            tempData.push({
              _id: items,
              quantity: cartItems[items][item],
              size: size,
              color: color,
            });
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, serverCart]);

  // 🗑️ Delete single item
  const handleDeleteItem = async (productId, productVariantId) => {
    setErrorMessage("");
    setLoading(true);
    try {
      await axios.delete(
        `${backendUrl}/api/Cart/items`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json-patch+json"
          },
          data: {
            productId: Number(productId),
            productVariantId: Number(productVariantId) || 0
          }
        }
      );

      // تحديث الـ state بعد الحذف
      setCartData((prev) =>
        prev.filter(
          (item) => !(item._id === productId && item.size === productVariantId)
        )
      );

      setCartItems((prev) => {
        const next = structuredClone(prev);
        if (next[productId]) {
          // Find the item key that matches the size and color
          const itemToDelete = cartData.find(item =>
            item._id === productId && item.size === productVariantId
          );
          if (itemToDelete) {
            // Handle both old format (just size) and new format (size_color)
            const itemKey = itemToDelete.color && itemToDelete.color !== 'Unknown'
              ? `${itemToDelete.size}_${itemToDelete.color}`
              : itemToDelete.size;
            delete next[productId][itemKey];
            if (Object.keys(next[productId]).length === 0) {
              delete next[productId];
            }
          }
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to delete item:", error);
      setErrorMessage(
        error.response?.data?.responseBody?.message ||
        "Failed to delete item. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  // 🧹 Clear cart
  const handleClearCart = async () => {
    setErrorMessage("");
    setLoading(true);
    try {
      await axios.delete(`${backendUrl}/api/Cart/items/clear`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCartData([]);
      // Also clear global cart state
      setCartItems({});
    } catch (error) {
      console.error("Failed to clear cart:", error);
      setErrorMessage(
        error.response?.data?.responseBody?.message ||
        "Failed to clear cart. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="mt-[100px] sm:mt-[120px] mb-10 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      {/* Title Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="text-2xl sm:text-3xl">
            <Title text1={"YOUR"} text2={"CART"} />
          </div>
          {cartData.length > 0 && (
            <button
              disabled={loading}
              onClick={handleClearCart}
              className={`bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500 px-5 py-2 text-xs font-bold rounded-full transition-all duration-300 uppercase tracking-widest border border-gray-200
                ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? "Clearing..." : "Clear Cart"}
            </button>
          )}
        </div>
      </motion.div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
          {errorMessage}
        </div>
      )}

      {/* Cart Items */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        {cartData.map((item, index) => {
          // 🆕 Use product data linked in item if available, otherwise look it up
          const productData = item.productData || products.find(
            (product) => String(product._id) === String(item._id)
          );
          if (!productData) return null;

          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className="py-6 border-t border-gray-100 text-gray-700 flex flex-col sm:grid sm:grid-cols-[4fr_1.5fr_0.5fr] items-start sm:items-center gap-4 group"
            >
              <div className="flex items-start gap-4 sm:gap-6 w-full">
                <div className="relative overflow-hidden rounded-lg bg-gray-50 border border-gray-100 min-w-[80px]">
                  <img
                    src={item.image || (productData.image && productData.image[0]) || ""}
                    alt={productData.name}
                    className="w-20 sm:w-24 aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                    {productData.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <p className="text-base font-semibold text-black">
                      {currency}
                      {item.price || productData.finalPrice || productData.price}
                    </p>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-2">
                      <p className="px-2 py-0.5 text-xs font-medium border border-gray-200 bg-gray-50 rounded text-gray-600">
                        {item.size}
                      </p>
                      {item.color && item.color !== 'Unknown' && (
                        <div className="flex items-center gap-1.5 ml-1">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm"
                            style={{ backgroundColor: item.color?.toLowerCase() || '#000000' }}
                            title={item.color}
                          ></div>
                          <span className="text-xs text-gray-500 capitalize">{item.color}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-4 mt-2 sm:mt-0">
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    defaultValue={item.quantity}
                    disabled={loading}
                    onChange={(e) =>
                      e.target.value === "" || e.target.value === "0"
                        ? handleDeleteItem(item._id, item.variantId || item.size)
                        : updataQuantity(
                          item._id,
                          item.size,
                          item.color !== 'Unknown' ? item.color : undefined,
                          Number(e.target.value)
                        )
                    }
                    className="w-12 sm:w-16 px-2 py-2 text-center text-sm font-bold focus:outline-none"
                  />
                </div>

                <div className="sm:hidden">
                  <button
                    onClick={() => !loading && handleDeleteItem(item._id, item.variantId || item.size)}
                    className="p-2 text-red-500 bg-red-50 rounded-full"
                  >
                    <img className="w-4" src={assets.bin_icon} alt="Delete" />
                  </button>
                </div>
              </div>

              <div className="hidden sm:flex justify-end pr-4">
                <img
                  className={`w-5 cursor-pointer hover:scale-110 transition-transform ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  src={assets.bin_icon}
                  alt="Delete"
                  onClick={() =>
                    !loading && handleDeleteItem(item._id, item.variantId || item.size)
                  }
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Checkout Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
        className="flex justify-end my-12 sm:my-20"
      >
        <div className="w-full sm:w-[450px]">
          <CartTotal />
          <div className="w-full text-end">
            <button
              onClick={async () => {
                if (cartData.length === 0) {
                  toast.error("Your cart is empty. Please add items before checkout.");
                  return;
                }
                setLoading(true);
                try {
                  const success = await checkout();
                  if (success) {
                    // Navigate to place order
                    navigate("/place-order");
                  }
                } catch (error) {
                  toast.error("Checkout failed. Please try again.");
                  console.error("Checkout error:", error);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || cartData.length === 0}
              className="bg-black text-white px-8 py-3 my-8 uppercase font-medium cursor-pointer 
                         hover:bg-white hover:text-black border border-black transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : cartData.length === 0 ? "Cart is Empty" : "Proceed to Checkout"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Cart;
