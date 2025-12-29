import { motion, AnimatePresence } from "framer-motion";
import React, { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import axios from "axios";
import { toast } from "react-toastify";
import WishlistButton from "../components/WishlistButton";
import MostWanted from "../components/MostWanted";
import { FaChevronLeft, FaChevronRight, FaPlus, FaMinus, FaRulerCombined, FaTruck, FaShieldAlt, FaUndo } from "react-icons/fa";

const Product = () => {
  const { t } = useTranslation();
  const { productId } = useParams();
  const { products, addToCart, backendUrl, currency } = useContext(ShopContext);

  const [productData, setProductData] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variantImages, setVariantImages] = useState({});
  const [localStock, setLocalStock] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Intersection observer for related products
  const { ref: relatedProductsRef, inView: isRelatedInView } = useInView({ threshold: 0.2, triggerOnce: true });

  const mapSizeToLabel = (value) => {
    if (!value) return "N/A";
    const val = String(value).toLowerCase();
    const map = {
      "30": "S", "31": "S", "32": "S",
      "33": "M", "34": "M", "35": "M",
      "36": "L", "37": "L", "38": "L",
      "39": "XL", "40": "XL", "41": "XL",
      "42": "XXL", "43": "XXL", "44": "XXL"
    };
    return map[val] || value;
  };

  const updateLocalStock = (variantId, qty) => {
    if (variantId) {
      setLocalStock(prev => ({ ...prev, [variantId]: Math.max(0, (prev[variantId] || 0) + qty) }));
    }
  };

  const getCurrentStock = (variant) => {
    if (!variant) return 10;
    const localQty = localStock[variant.id] || 0;
    return Math.max(0, (variant.quantity || 10) - localQty);
  };

  const fetchVariantDetails = async (variantId) => {
    try {
      const res = await axios.get(`${backendUrl}/api/Products/${productId}/Variants/${variantId}`);
      return res.data?.responseBody?.data;
    } catch (err) {
      console.error("Error fetching variant details", err);
      return null;
    }
  }

  useEffect(() => {
    if (products.length > 0) {
      const found = products.find(p => p._id === productId || p.id === productId);
      if (found) {
        setProductData(found);
        setActiveImage(found.image?.[0] || found.mainImageUrl);
      }
    }
  }, [products, productId]);

  useEffect(() => {
    const fetchVariants = async () => {
      if (!productId) return;
      try {
        const res = await axios.get(`${backendUrl}/api/Products/${productId}/Variants`);
        if (res.data?.responseBody?.data) {
          const vData = res.data.responseBody.data;
          setVariants(vData);

          const imagesMap = {};
          // Only fetch images for unique colors to save requests
          const uniqueColors = [...new Set(vData.map(v => v.color))].filter(Boolean);
          for (const color of uniqueColors) {
            const firstVarOfColor = vData.find(v => v.color === color);
            const detail = await fetchVariantDetails(firstVarOfColor.id);
            imagesMap[color] = detail?.images || [];
          }
          setVariantImages(imagesMap);
        }
      } catch (err) {
        console.error("Error fetching variants", err);
      }
    };
    fetchVariants();
  }, [productId, backendUrl]);

  const handleAddToCart = async () => {
    if (!size || !selectedVariant) {
      toast.warning(t("SELECT_SIZE_COLOR"));
      return;
    }
    if (getCurrentStock(selectedVariant) < quantity) {
      toast.error(t("OUT_OF_STOCK"));
      return;
    }

    setIsSubmitting(true);
    try {
      await addToCart(productData._id || productData.id, size, selectedVariant.color, quantity);
      updateLocalStock(selectedVariant.id, quantity);
      toast.success(t("ADDED_TO_CART"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!productData) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
    </div>
  );

  const colors = [...new Set(variants.map(v => v.color))].filter(Boolean);
  const availableSizes = [...new Set(variants.map(v => mapSizeToLabel(v.size)))].filter(Boolean);

  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-12">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <Link to="/collection" className="hover:text-black transition-colors">Collections</Link>
          <span>/</span>
          <span className="text-black">{productData.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* LEFT: Image Gallery */}
          <div className="lg:col-span-7 grid grid-cols-12 gap-4">
            <div className="col-span-2 space-y-4">
              {(variantImages[selectedVariant?.color]?.length > 0 ? variantImages[selectedVariant.color] : productData.image || []).map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImage(img.url || img)}
                  className={`aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${activeImage === (img.url || img) ? 'border-black' : 'border-transparent shadow-sm'}`}
                >
                  <img src={img.url || img} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <div className="col-span-10 relative group bg-gray-50 rounded-3xl overflow-hidden shadow-2xl">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                src={activeImage}
                className="w-full h-auto object-cover aspect-[3/4] cursor-zoom-in"
                onClick={() => setIsZoomOpen(true)}
              />
              <div className="absolute top-6 right-6">
                <WishlistButton productId={productData._id || productData.id} variant="floating" size="lg" />
              </div>

              {/* Badges */}
              {productData.finalPrice < productData.price && (
                <div className="absolute top-6 left-6 bg-black text-white text-[10px] font-black py-2 px-6 rounded-full uppercase tracking-widest shadow-xl">
                  Exclusive Sale
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Product Info (Sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-10">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-300">R&S Boutique Edition</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => <div key={s} className="w-1 h-1 rounded-full bg-black/10" />)}
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85] mb-6">{productData.name}</h1>

              <div className="flex items-center gap-4">
                <span className="text-4xl font-black">{currency}{selectedVariant?.finalPrice || productData.finalPrice || productData.price}</span>
                {(selectedVariant?.finalPrice || productData.finalPrice) < (selectedVariant?.price || productData.price) && (
                  <span className="text-xl text-gray-300 line-through font-bold">{currency}{selectedVariant?.price || productData.price}</span>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full"></div>

            {/* Selection - Color */}
            {colors.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4">Color Palette</h4>
                <div className="flex flex-wrap gap-4">
                  {colors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const v = variants.find(v => v.color === c);
                        setSelectedVariant(v);
                        if (variantImages[c]?.[0]) setActiveImage(variantImages[c][0].url || variantImages[c][0]);
                      }}
                      className={`w-12 h-12 rounded-full border-2 transition-all p-1 ${selectedVariant?.color === c ? 'border-black' : 'border-transparent'}`}
                    >
                      <div className="w-full h-full rounded-full shadow-inner" style={{ backgroundColor: c.toLowerCase() }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selection - Size */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Select Proportions</h4>
                <button onClick={() => setShowSizeGuide(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                  <FaRulerCombined /> Sizing Map
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {availableSizes.map((s, i) => {
                  const isAvailable = variants.some(v => mapSizeToLabel(v.size) === s && v.color === selectedVariant?.color);
                  return (
                    <button
                      key={i}
                      disabled={!isAvailable}
                      onClick={() => setSize(s)}
                      className={`py-4 rounded-2xl text-xs font-black transition-all border-2 ${size === s ? 'bg-black text-white border-black shadow-xl' : 'bg-white text-black border-gray-100 hover:border-black'} disabled:opacity-20 disabled:cursor-not-allowed`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quantity & Actions */}
            <div className="flex gap-4">
              <div className="flex items-center bg-gray-50 rounded-full px-6 py-2 gap-6">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-gray-400 hover:text-black transition-colors"><FaMinus size={10} /></button>
                <span className="font-black text-lg w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="text-gray-400 hover:text-black transition-colors"><FaPlus size={10} /></button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={isSubmitting}
                className="flex-1 bg-black text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating...' : 'Add To Private Collection'}
              </button>
            </div>

            {/* Details & Specs */}
            <div className="grid grid-cols-1 gap-4 pt-10">
              <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100">
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-black">Master Narrative</h5>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{productData.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: <FaTruck />, label: 'Prime Hub' },
                  { icon: <FaShieldAlt />, label: 'Guaranteed' },
                  { icon: <FaUndo />, label: 'Elite Returns' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50/30 border border-gray-50">
                    <div className="text-black mb-2">{item.icon}</div>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        <section ref={relatedProductsRef} className="mt-40 border-t border-gray-100 pt-24">
          {isRelatedInView && <MostWanted />}
        </section>
      </div>

      {/* ZOOM MODAL */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black p-10 flex items-center justify-center overflow-auto"
          >
            <button onClick={() => setIsZoomOpen(false)} className="absolute top-10 right-10 text-white hover:rotate-90 transition-transform duration-500"><FaTimes size={30} /></button>
            <motion.img
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              src={activeImage}
              className="max-w-full max-h-screen object-contain shadow-[0_0_100px_rgba(255,255,255,0.1)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIZE GUIDE MODAL */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowSizeGuide(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl">
              <h2 className="text-4xl font-black tracking-tighter mb-8 uppercase">AESTHETIC MAP</h2>
              <div className="overflow-hidden rounded-3xl border border-gray-100">
                <table className="w-full text-xs">
                  <thead className="bg-black text-white px-4">
                    <tr><th className="py-5 px-6 text-left font-black uppercase tracking-widest">Global Size</th><th className="py-5 px-6 text-left font-black uppercase tracking-widest">Dimension Info</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-bold">
                    <tr><td className="py-5 px-6">SMALL</td><td className="py-5 px-6 text-gray-400 font-medium">Standard Fit (EU 30-32)</td></tr>
                    <tr><td className="py-5 px-6">MEDIUM</td><td className="py-5 px-6 text-gray-400 font-medium">Standard Fit (EU 33-35)</td></tr>
                    <tr><td className="py-5 px-6">LARGE</td><td className="py-5 px-6 text-gray-400 font-medium">Standard Fit (EU 36-38)</td></tr>
                    <tr><td className="py-5 px-6">X-LARGE</td><td className="py-5 px-6 text-gray-400 font-medium">Standard Fit (EU 39-41)</td></tr>
                  </tbody>
                </table>
              </div>
              <button onClick={() => setShowSizeGuide(false)} className="w-full mt-8 py-5 bg-black text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Dismiss Gallery</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 3px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Product;
