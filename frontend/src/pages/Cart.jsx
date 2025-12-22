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
    <div className="mt-[120px] mb-5 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      {/* Title Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
        className="flex justify-between items-center mb-3"
      >
        <div className="text-2xl">
          <Title text1={"YOUR"} text2={"CART"} />
        </div>
        {cartData.length > 0 && (
          <button
            disabled={loading}
            onClick={handleClearCart}
            className={`bg-red-500 text-white px-4 py-2 text-sm rounded transition-all duration-300
              ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600"}`}
          >
            {loading ? "Clearing..." : "Clear Cart"}
          </button>
        )}
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
              className="py-4 border-t border-gray-200 text-gray-700 grid grid-cols-[4fr_1.5fr_0.5fr] items-center gap-4"
            >
              <div className="flex items-start gap-6">
                <img
                  src={item.image || (productData.image && productData.image[0]) || ""}
                  alt={productData.name}
                  className="w-16 sm:w-20"
                />
                <div>
                  <p className="text-xs sm:text-lg font-medium">
                    {productData.name}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <p>
                      {currency}
                      {item.price || productData.finalPrice || productData.price}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="px-2 sm:px-3 sm:py-1 border border-gray-300 bg-slate-50">
                        Size: {item.size}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Color:</span>
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                          style={{
                            backgroundColor: item.color?.toLowerCase() || '#000000',
                            minWidth: '24px',
                            minHeight: '24px'
                          }}
                          title={item.color || 'Unknown'}
                        >
                          {!item.color || item.color === 'Unknown' ? (
                            <span className="text-xs text-gray-500">?</span>
                          ) : null}
                        </div>
                        {item.color && item.color !== 'Unknown' && (
                          <span className="text-xs text-gray-600">{item.color}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                className="border border-gray-300 max-w-10 sm:max-w-20 px-1 sm:px-2 py-1 sm:py-2"
              />
              <img
                className={`w-4 mr-4 sm:w-5 cursor-pointer ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                src={assets.bin_icon}
                alt=""
                onClick={() =>
                  !loading && handleDeleteItem(item._id, item.variantId || item.size)
                }
              />
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
        className="flex justify-end my-20"
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
