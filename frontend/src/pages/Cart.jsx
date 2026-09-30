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
    fetchUserCart,
  } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(""); // 🛠️ Error state
  const [loading, setLoading] = useState(false); // 🛠️ Loading state
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      fetchUserCart();
    }
  }, [token]);

  useEffect(() => {
    // 🆕 Extract items correctly whether serverCart is an array or object
    const cartItemsList = Array.isArray(serverCart)
      ? serverCart
      : (serverCart?.items || []);

    if (cartItemsList.length > 0) {
      // 🆕 Use server cart data directly if available
      console.log("Using server cart data:", cartItemsList);
      const tempData = cartItemsList.map(item => {
        const product = item.product || {};
        return {
          _id: item.productId || product.id || null,
          quantity: item.quantity,
          size: item.productVariant?.size || product.productVariantForCartDto?.size || item.size || 'Unknown',
          color: item.productVariant?.color || product.productVariantForCartDto?.color || item.color || 'Unknown',
          variantId: item.productVariantId || item.productVariant?.id || product.productVariantForCartDto?.id, // Store variant ID for actions
          productData: product, // Store full product data
          price: item.currentPrice || product.finalPrice || product.price,
          priceAtAddTime: item.priceAtAddTime || product.price || product.finalPrice,
          isPriceChanged: item.isPriceChanged || false,
          image: product.mainImageUrl || item.productVariant?.images?.[0]?.url || product.image?.[0]
        };
      }).filter(item => item._id); // Filter out invalid items

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

            // Look up productData from loaded products state if possible
            const productData = products.find(p => String(p._id) === String(items)) || {};

            tempData.push({
              _id: items,
              quantity: cartItems[items][item],
              size: size,
              color: color,
              productData: productData,
              price: productData.finalPrice || productData.price || 0,
              priceAtAddTime: productData.price || productData.finalPrice || 0,
              image: productData.image?.[0] || ""
            });
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, serverCart, products]);

  // 🗑️ Delete single item
  const handleDeleteItem = async (productId, productVariantId) => {
    setErrorMessage("");
    setLoading(true);
    try {
      console.log("Deleting item:", { productId, productVariantId, variantIdType: typeof productVariantId });

      // Only make API call if user is logged in
      if (token) {
        await axios.delete(
          `${backendUrl}/api/Cart/items`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json-patch+json"
            },
            withCredentials: true, // 🆕 Send cookies with request
            data: {
              productId: Number(productId),
              productVariantId: Number(productVariantId) || 0
            }
          }
        );
      }

      // تحديث الـ state بعد الحذف - using current cartData for matching
      const itemToDelete = cartData.find(item => {
        const matchId = String(item._id) === String(productId);
        const matchVariant = item.variantId ? String(item.variantId) === String(productVariantId) : item.size === productVariantId;
        return matchId && matchVariant;
      });

      console.log("Item to delete found:", itemToDelete);

      setCartData((prev) => {
        const filtered = prev.filter((item) => {
          const matchId = String(item._id) === String(productId);
          const matchVariant = item.variantId ? String(item.variantId) === String(productVariantId) : item.size === productVariantId;
          return !(matchId && matchVariant);
        });
        console.log("Filtered cartData:", filtered);
        return filtered;
      });

      setCartItems((prev) => {
        const next = structuredClone(prev);
        if (next[productId]) {
          // Find the item key that matches the variantId
          if (itemToDelete) {
            // Handle both old format (just size) and new format (size_color)
            const itemKey = itemToDelete.color && itemToDelete.color !== 'Unknown'
              ? `${itemToDelete.size}_${itemToDelete.color}`
              : itemToDelete.size;
            console.log("Deleting item key:", itemKey);
            delete next[productId][itemKey];
            if (Object.keys(next[productId]).length === 0) {
              delete next[productId];
            }
          }
        }
        console.log("Updated cartItems:", next);
        return next;
      });

      // Show success message
      toast.success("Item removed from cart");
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
      // Only make API call if user is logged in
      if (token) {
        await axios.delete(`${backendUrl}/api/Cart/items/clear`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true, // 🆕 Send cookies with request
        });
      }

      // Clear local state for both guest and logged-in users
      setCartData([]);
      setCartItems({});
      toast.success("Cart cleared successfully");
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
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3"
      >
        <div className="text-xl sm:text-2xl">
          <Title text1={"YOUR"} text2={"CART"} />
        </div>
        {cartData.length > 0 && (
          <button
            disabled={loading}
            onClick={handleClearCart}
            className={`bg-[var(--danger)] text-[var(--text)] px-3 sm:px-4 py-2 text-xs sm:text-sm rounded transition-all duration-300 w-full sm:w-auto
              ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--danger)]/80"}`}
          >
            {loading ? "Clearing..." : "Clear Cart"}
          </button>
        )}
      </motion.div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-[var(--danger)]/10 text-[var(--danger)] px-4 py-2 rounded mb-4 border border-[var(--danger)]/30">
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
          ) || {};

          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className="py-4 border-t border-[var(--border)] text-[var(--text)] grid grid-cols-1 sm:grid-cols-[3fr_1fr_0.5fr] md:grid-cols-[4fr_1.5fr_0.5fr] items-start sm:items-center gap-3 sm:gap-4"
            >
              <div className="flex items-start gap-3 sm:gap-6">
                <img
                  src={item.image || (productData.image && productData.image[0]) || ""}
                  alt={productData.name || "Product"}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-sm sm:text-base md:text-lg font-medium line-clamp-2">
                    {productData.name || "Product"}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                    <div className="flex flex-col">
                      {item.priceAtAddTime && item.price !== item.priceAtAddTime ? (
                        <>
                          <p className="text-xs text-[var(--text-muted)] line-through">
                            Added: {currency}{item.priceAtAddTime}
                          </p>
                          <p className="font-semibold text-sm sm:text-base text-[var(--accent)]">
                            Now: {currency}{item.price}
                          </p>
                        </>
                      ) : (
                        <p className="font-semibold text-sm sm:text-base text-[var(--accent)]">
                          {currency}{item.price || item.priceAtAddTime}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="px-2 py-1 text-xs sm:text-sm border border-[var(--border)] bg-[var(--surface-raised)] rounded">
                        Size: {item.size}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-xs sm:text-sm">Color:</span>
                        <div
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[var(--border)] flex items-center justify-center"
                          style={{
                            backgroundColor: item.color && item.color !== 'Unknown'
                              ? (item.color.startsWith('#') ? item.color : (/^[0-9A-Fa-f]{3,8}$/.test(item.color) ? `#${item.color}` : item.color.toLowerCase()))
                              : '#000000',
                            minWidth: '20px',
                            minHeight: '20px'
                          }}
                          title={item.color || 'Unknown'}
                        >
                          {!item.color || item.color === 'Unknown' ? (
                            <span className="text-xs text-[var(--text-muted)]">?</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-0 sm:block">
                <label className="text-xs sm:text-sm text-[var(--text-muted)] sm:hidden">Quantity:</label>
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
                  className="input-field w-16 sm:max-w-20 px-2 py-1 sm:py-2 rounded text-center"
                />
              </div>
              <div className="flex justify-end sm:justify-center">
                <button
                  onClick={() => {
                    console.log("Delete button clicked for:", item._id, item.variantId || item.size);
                    !loading && handleDeleteItem(item._id, item.variantId || item.size);
                  }}
                  disabled={loading}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--danger)]/20"}`}
                  title="Remove from cart"
                >
                  <img
                    className="w-5 sm:w-5"
                    src={assets.bin_icon}
                    alt="Delete"
                  />
                </button>
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
        className="flex justify-center sm:justify-end my-10 sm:my-20"
      >
        <div className="w-full sm:w-[450px]">
          <CartTotal />
          <div className="w-full text-center sm:text-end">
            <button
              onClick={async () => {
                if (cartData.length === 0) {
                  toast.error("Your cart is empty. Please add items before checkout.");
                  return;
                }

                // 🆕 Guest users go directly to the guest checkout form
                if (!token) {
                  navigate("/guest-checkout");
                  return;
                }

                // Authenticated users: validate cart on the server first
                setLoading(true);
                try {
                  const response = await axios.post(
                    `${backendUrl}/api/Cart/checkout`,
                    {},
                    {
                      headers: { Authorization: `Bearer ${token}` }
                    }
                  );

                  if (response.status === 200 || response.status === 201) {
                    toast.success(response.data?.responseBody?.message || "Checkout successful");
                    // Navigate to place order (payment and address page)
                    navigate("/place-order");
                  } else {
                    toast.error("Checkout failed.");
                  }
                } catch (error) {
                  const errMsg = error.response?.data?.responseBody?.message || "Checkout failed. Please try again.";
                  toast.error(errMsg);
                  console.error("Checkout error:", error);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || cartData.length === 0}
              className="btn-cta-fashion px-6 sm:px-8 py-3 my-8 uppercase font-medium cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-sm sm:text-base"
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
