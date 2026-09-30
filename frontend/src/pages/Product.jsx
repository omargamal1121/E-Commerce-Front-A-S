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
import { FaChevronLeft, FaChevronRight, FaPlus, FaMinus, FaRulerCombined, FaTruck, FaShieldAlt, FaUndo, FaTimes } from "react-icons/fa";

const OPTION_KEYS = [
  { key: "size", label: "Size", isNumeric: false },
  { key: "color", label: "Color", isNumeric: false, isColor: true },
  { key: "chest", label: "Chest (cm)", isNumeric: true },
  { key: "length", label: "Length (cm)", isNumeric: true },
  { key: "waist", label: "Waist (cm)", isNumeric: true },
  { key: "hip", label: "Hip (cm)", isNumeric: true },
  { key: "sleeveLength", label: "Sleeve (cm)", isNumeric: true },
];

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
  const [selections, setSelections] = useState({}); // Progressive filtering state: { optionKey: value | undefined }
  const [variantImages, setVariantImages] = useState({});
  const [localStock, setLocalStock] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoFilledKeys, setAutoFilledKeys] = useState({});

  // Helper: Get value of an option key from a variant
  const getOptValue = (v, key) => {
    if (!v) return null;
    if (key === "size") {
      if (v.isFreeSize) return "Free Size";
      const val = v.size || v.sizeLabel;
      return val != null ? String(val).trim() : null;
    }
    if (key === "color") {
      const val = v.color || v.colorHex || v.colorName;
      return val != null ? String(val).trim() : null;
    }
    return v[key] != null ? String(v[key]).trim() : null;
  };

  // Helper: Get effective quantity
  const getEffectiveQty = (variant) => {
    if (!variant) return 0;
    const localQty = localStock[variant.id] || 0;
    return Math.max(0, (variant.quantity ?? 0) - localQty);
  };

  // Pure function 1: getMatching (in-stock variants matching ALL current non-null selections)
  const getMatching = (allVariants, currentSelections) => {
    if (!allVariants || allVariants.length === 0) return [];
    return allVariants.filter(v => {
      if (getEffectiveQty(v) <= 0) return false;
      return OPTION_KEYS.every(opt => {
        const selectedVal = currentSelections[opt.key];
        if (!selectedVal) return true;
        const vVal = getOptValue(v, opt.key);
        return vVal === selectedVal;
      });
    });
  };

  // Pure function 2: getEnabledValues (distinct values for key K among variants matching all selections EXCEPT K)
  const getEnabledValues = (allVariants, currentSelections, key) => {
    if (!allVariants || allVariants.length === 0) return [];
    const matchingExceptKey = allVariants.filter(v => {
      if (getEffectiveQty(v) <= 0) return false;
      return OPTION_KEYS.every(opt => {
        if (opt.key === key) return true;
        const selectedVal = currentSelections[opt.key];
        if (!selectedVal) return true;
        const vVal = getOptValue(v, opt.key);
        return vVal === selectedVal;
      });
    });

    const values = matchingExceptKey
      .map(v => getOptValue(v, key))
      .filter(Boolean);

    return [...new Set(values)];
  };

  // Pure function 3: applyClick (returns new selections object and auto-filled keys)
  const applyClick = (allVariants, currentSelections, clickedKey, clickedValue) => {
    let nextSel = { ...currentSelections };

    // 1. Toggle off if already selected
    if (nextSel[clickedKey] === clickedValue) {
      delete nextSel[clickedKey];
    } else {
      nextSel[clickedKey] = clickedValue;
    }

    // 2. Clear any previously selected value in another section if it cannot coexist with the new selection
    OPTION_KEYS.forEach(opt => {
      if (opt.key === clickedKey) return;
      const curVal = nextSel[opt.key];
      if (curVal && nextSel[clickedKey]) {
        const isPossibleCombo = allVariants.some(v => {
          if (getEffectiveQty(v) <= 0) return false;
          return getOptValue(v, clickedKey) === nextSel[clickedKey] && getOptValue(v, opt.key) === curVal;
        });
        if (!isPossibleCombo) {
          delete nextSel[opt.key];
        }
      }
    });

    // 3. Recompute matching in-stock variants
    let matchingVars = getMatching(allVariants, nextSel);

    const newlyAutoFilled = {};

    // 4. If matching contains EXACTLY ONE variant -> auto-fill ALL other sections from that variant
    if (matchingVars.length === 1) {
      const targetVar = matchingVars[0];
      OPTION_KEYS.forEach(opt => {
        const vVal = getOptValue(targetVar, opt.key);
        if (vVal) {
          if (opt.key !== clickedKey && nextSel[opt.key] !== vVal) {
            newlyAutoFilled[opt.key] = true;
          }
          nextSel[opt.key] = vVal;
        }
      });
    } else if (matchingVars.length > 1) {
      // 5. If matching contains MORE THAN ONE variant: auto-fill sections that have only 1 unique value among matching
      OPTION_KEYS.forEach(opt => {
        if (opt.key === clickedKey) return;
        const uniqueVals = [...new Set(matchingVars.map(v => getOptValue(v, opt.key)).filter(Boolean))];
        if (uniqueVals.length === 1) {
          const singleVal = uniqueVals[0];
          if (nextSel[opt.key] !== singleVal) {
            newlyAutoFilled[opt.key] = true;
            nextSel[opt.key] = singleVal;
          }
        }
      });
    }

    return { nextSelections: nextSel, autoFilled: newlyAutoFilled };
  };

  // Derived memoized matching variants
  const matchingVariants = React.useMemo(() => {
    return getMatching(variants, selections);
  }, [variants, selections, localStock]);

  // Derived selectedVariant (exists ONLY when exactly one variant matches, or fallback if 1 variant exists)
  const selectedVariant = React.useMemo(() => {
    if (matchingVariants.length === 1) {
      return matchingVariants[0];
    }
    if (variants.length === 1) {
      return variants[0];
    }
    return null;
  }, [matchingVariants, variants]);

  // Derived sections to display (only if at least 2 distinct non-null values across variants)
  const derivedSections = React.useMemo(() => {
    const sections = [];

    OPTION_KEYS.forEach(opt => {
      let rawValues = variants.map(v => getOptValue(v, opt.key)).filter(Boolean);

      let distinctVals = [];
      if (opt.key === "size" || opt.key === "color") {
        distinctVals = [...new Set(rawValues)];
      } else if (opt.isNumeric) {
        distinctVals = [...new Set(rawValues)].sort((a, b) => Number(a) - Number(b));
      }

      if (distinctVals.length >= 2) {
        sections.push({ ...opt, options: distinctVals });
      }
    });

    return sections;
  }, [variants]);

  // Handle single variant product auto-selection on load
  useEffect(() => {
    if (variants.length === 1) {
      const v = variants[0];
      const initialSel = {};
      OPTION_KEYS.forEach(opt => {
        const val = getOptValue(v, opt.key);
        if (val) initialSel[opt.key] = val;
      });
      setSelections(initialSel);
    }
  }, [variants]);

  // Reset quantity stepper to 1 when selected variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?.id]);

  // Update gallery image when selected variant color changes
  useEffect(() => {
    if (selectedVariant?.color && variantImages[selectedVariant.color]?.[0]) {
      setActiveImage(variantImages[selectedVariant.color][0].url || variantImages[selectedVariant.color][0]);
    }
  }, [selectedVariant?.id]);

  // Handle chip click
  const handleChipClick = (key, val) => {
    const { nextSelections, autoFilled } = applyClick(variants, selections, key, val);
    setSelections(nextSelections);

    if (Object.keys(autoFilled).length > 0) {
      setAutoFilledKeys(autoFilled);
      setTimeout(() => setAutoFilledKeys({}), 800);
    }
  };

  // Reset all selections
  const handleResetSelections = () => {
    setSelections({});
    setAutoFilledKeys({});
  };

  // Intersection observer for related products
  const { ref: relatedProductsRef, inView: isRelatedInView } = useInView({ threshold: 0.2, triggerOnce: true });


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
      const res = await axios.get(`${backendUrl}/api/Products/${productId}/Variants/${variantId}?isActive=true&includeDeleted=false`);
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
        const res = await axios.get(`${backendUrl}/api/Products/${productId}/Variants?isActive=true&includeDeleted=false`);
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
    if (!selectedVariant) {
      toast.warning(t("SELECT_SIZE_COLOR"));
      return;
    }

    const targetSize = getOptValue(selectedVariant, "size") || "Free Size";
    const targetColor = getOptValue(selectedVariant, "color") || "";

    if (getEffectiveQty(selectedVariant) < quantity) {
      toast.error(t("OUT_OF_STOCK"));
      return;
    }

    setIsSubmitting(true);
    try {
      await addToCart(productData._id || productData.id, targetSize, targetColor, quantity);
      updateLocalStock(selectedVariant.id, quantity);
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
  const availableSizes = [...new Set(variants.map(v => v.size))].filter(Boolean);

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-24 pb-20">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-12">
          <Link to="/" className="hover:text-[var(--text)] transition-colors">Home</Link>
          <span>/</span>
          <Link to="/collection" className="hover:text-[var(--text)] transition-colors">Collections</Link>
          <span>/</span>
          <span className="text-[var(--text)]">{productData.name}</span>
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

            <div className="col-span-10 relative group bg-[var(--surface-raised)] rounded-3xl overflow-hidden shadow-2xl">
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
                <div className="absolute top-6 left-6 bg-[var(--brand)] text-[var(--text)] text-[10px] font-black py-2 px-6 rounded-full uppercase tracking-widest shadow-xl">
                  Exclusive Sale
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Product Info (Sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-10">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">R&S Boutique Edition</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => <div key={s} className="w-1 h-1 rounded-full bg-[var(--text-muted)]/20" />)}
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85] mb-6">{productData.name}</h1>

              <div className="flex items-center gap-4">
                <span className="text-4xl font-black text-[var(--accent)]">{currency}{selectedVariant?.finalPrice || productData.finalPrice || productData.price}</span>
                {(selectedVariant?.finalPrice || productData.finalPrice) < (selectedVariant?.price || productData.price) && (
                  <span className="text-xl text-[var(--text-muted)] line-through font-bold">{currency}{selectedVariant?.price || productData.price}</span>
                )}
              </div>
            </div>

            <div className="h-px bg-[var(--border)] w-full"></div>

            {/* Dynamic Multi-Section Progressive Option Selector */}
            {derivedSections.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    {Object.keys(selections).length > 0
                      ? `${matchingVariants.length} variant${matchingVariants.length === 1 ? '' : 's'} match selection`
                      : 'Select options to narrow variants'}
                  </span>
                  {Object.keys(selections).length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetSelections}
                      className="text-xs font-bold text-[var(--accent)] underline hover:text-[var(--text)] transition-colors"
                    >
                      Reset selection
                    </button>
                  )}
                </div>

                {derivedSections.map(sec => {
                  const currentSelectedVal = selections[sec.key];
                  const enabledVals = getEnabledValues(variants, selections, sec.key);
                  const isAutoFilled = Boolean(autoFilledKeys[sec.key]);

                  return (
                    <div
                      key={sec.key}
                      role="radiogroup"
                      aria-label={`Select ${sec.label}`}
                      className={`transition-all duration-300 rounded-2xl p-2 bg-[var(--surface)] border border-[var(--border)] ${isAutoFilled ? 'ring-2 ring-[var(--accent)] animate-pulse' : ''}`}
                    >
                      <div className="flex justify-between items-center mb-2.5">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
                          {sec.label} {sec.unit ? `(${sec.unit})` : ''}
                        </h4>
                        {sec.key === 'size' && (
                          <button type="button" onClick={() => setShowSizeGuide(true)} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text)]">
                            <FaRulerCombined /> Size Map
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {sec.options.map(optVal => {
                          const isSelected = currentSelectedVal === optVal;
                          const isDisabled = !enabledVals.includes(optVal);

                          if (sec.isColor || sec.key === "color") {
                            return (
                              <button
                                key={optVal}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                aria-disabled={isDisabled}
                                aria-label={optVal}
                                onClick={() => handleChipClick(sec.key, optVal)}
                                className={`w-9 h-9 rounded-full border-2 transition-all p-0.5 flex items-center justify-center relative ${isSelected ? 'border-[var(--text)] ring-2 ring-[var(--text)] ring-offset-2 ring-offset-[var(--bg)] scale-110' : 'border-[var(--border)] hover:border-[var(--text)]'} ${isDisabled ? 'opacity-40 line-through' : ''}`}
                                title={optVal}
                              >
                                <div className="w-full h-full rounded-full shadow-inner border border-black/10" style={{ backgroundColor: optVal }} />
                              </button>
                            );
                          }

                          return (
                            <button
                              key={optVal}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              aria-disabled={isDisabled}
                              onClick={() => handleChipClick(sec.key, optVal)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-baseline gap-1 focus:ring-2 focus:ring-[var(--accent)] outline-none ${isSelected ? 'bg-[var(--brand)] text-[var(--text)] border-[var(--brand)] shadow-md' : 'bg-transparent text-[var(--text)] border-[var(--border)] hover:border-[var(--brand-hover)]'} ${isDisabled ? 'opacity-40 line-through' : ''}`}
                            >
                              <span>{optVal}</span>
                              {sec.unit && <span className={`text-[9px] font-normal ${isSelected ? 'text-[var(--text)]/80' : 'text-[var(--text-muted)]'}`}>{sec.unit}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quantity Stepper & Add to Cart */}
            <div className="space-y-4 pt-2">
              {/* Availability Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-muted)]">Availability</span>
                {selectedVariant ? (
                  getEffectiveQty(selectedVariant) <= 0 ? (
                    <span className="badge-danger">Out of stock</span>
                  ) : getEffectiveQty(selectedVariant) <= 5 ? (
                    <span className="badge-danger">Only {getEffectiveQty(selectedVariant)} left</span>
                  ) : (
                    <span className="badge-success">{getEffectiveQty(selectedVariant)} in stock</span>
                  )
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">Select options to see availability</span>
                )}
              </div>

              <div className="flex gap-4 items-center">
                <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-full px-5 py-3 gap-5">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!selectedVariant || getEffectiveQty(selectedVariant) <= 0}
                    className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-30"
                  >
                    <FaMinus size={10} />
                  </button>
                  <span className="font-bold text-base w-6 text-center text-[var(--text)]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(getEffectiveQty(selectedVariant) || 1, quantity + 1))}
                    disabled={!selectedVariant || quantity >= getEffectiveQty(selectedVariant)}
                    className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-30"
                  >
                    <FaPlus size={10} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isSubmitting || !selectedVariant || getEffectiveQty(selectedVariant) <= 0}
                  className="flex-1 btn-cta-fashion py-4 rounded-full text-xs font-bold tracking-[0.2em] shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Authenticating...' : (!selectedVariant) ? 'SELECT OPTIONS' : (getEffectiveQty(selectedVariant) <= 0) ? 'OUT OF STOCK' : 'ADD TO PRIVATE COLLECTION'}
                </button>
              </div>
            </div>

            {/* Variant Measurements */}
            {selectedVariant && (selectedVariant.waist || selectedVariant.length || selectedVariant.chest || selectedVariant.hip || selectedVariant.sleeveLength || selectedVariant.isFreeSize) && (
              <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)]">
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-[var(--text)]">{t('VARIANT_DETAILS')}</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {selectedVariant.waist && (
                    <div className="flex flex-col items-center p-3 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] shadow-sm">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">{t('WAIST')}</span>
                      <span className="text-lg font-black text-[var(--text)]">{selectedVariant.waist}<span className="text-xs font-bold text-[var(--text-muted)] ml-0.5">cm</span></span>
                    </div>
                  )}
                  {selectedVariant.length && (
                    <div className="flex flex-col items-center p-3 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] shadow-sm">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">{t('LENGTH')}</span>
                      <span className="text-lg font-black text-[var(--text)]">{selectedVariant.length}<span className="text-xs font-bold text-[var(--text-muted)] ml-0.5">cm</span></span>
                    </div>
                  )}
                  {selectedVariant.chest && (
                    <div className="flex flex-col items-center p-3 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] shadow-sm">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">{t('CHEST')}</span>
                      <span className="text-lg font-black text-[var(--text)]">{selectedVariant.chest}<span className="text-xs font-bold text-[var(--text-muted)] ml-0.5">cm</span></span>
                    </div>
                  )}
                  {selectedVariant.hip && (
                    <div className="flex flex-col items-center p-3 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] shadow-sm">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">{t('HIP')}</span>
                      <span className="text-lg font-black text-[var(--text)]">{selectedVariant.hip}<span className="text-xs font-bold text-[var(--text-muted)] ml-0.5">cm</span></span>
                    </div>
                  )}
                  {selectedVariant.sleeveLength && (
                    <div className="flex flex-col items-center p-3 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] shadow-sm">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">{t('SLEEVE_LENGTH') || 'SLEEVE LENGTH'}</span>
                      <span className="text-lg font-black text-[var(--text)]">{selectedVariant.sleeveLength}<span className="text-xs font-bold text-[var(--text-muted)] ml-0.5">cm</span></span>
                    </div>
                  )}
                  {selectedVariant.isFreeSize && (
                    <div className="flex flex-col items-center p-3 bg-[var(--brand)] text-[var(--text)] rounded-2xl border border-[var(--brand)] shadow-sm">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">{t('SIZE')}</span>
                      <span className="text-xs font-black uppercase tracking-wider">{t('FREE_SIZE') || 'FREE SIZE'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Details & Specs */}
            <div className="grid grid-cols-1 gap-4 pt-10">
              <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-6">
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-[var(--text)]">Master Narrative</h5>
                  <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">{productData.description}</p>
                </div>
                {productData.fitType && (
                  <div className="flex items-center gap-3">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text)] m-0">Fit Type:</h5>
                    <span className="text-xs font-bold text-[var(--text)] bg-[var(--surface-raised)] px-3 py-1.5 rounded-full shadow-sm border border-[var(--border)] capitalize">{productData.fitType}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: <FaTruck />, label: 'Prime Hub' },
                  { icon: <FaShieldAlt />, label: 'Guaranteed' },
                  { icon: <FaUndo />, label: 'Elite Returns' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)]">
                    <div className="text-[var(--text)] mb-2">{item.icon}</div>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-[var(--text-muted)]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        <section ref={relatedProductsRef} className="mt-40 border-t border-[var(--border)] pt-24">
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
            <button onClick={() => setIsZoomOpen(false)} className="absolute top-10 right-10 text-[var(--text)] hover:rotate-90 transition-transform duration-500"><FaTimes size={30} /></button>
            <motion.img
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              src={activeImage}
              className="max-w-full max-h-screen object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIZE GUIDE MODAL */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowSizeGuide(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative bg-[var(--surface)] w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl border border-[var(--border)]">
              <h2 className="text-4xl font-black tracking-tighter mb-8 uppercase text-[var(--text)]">AESTHETIC MAP</h2>
              <div className="overflow-hidden rounded-3xl border border-[var(--border)]">
                <table className="w-full text-xs">
                  <thead className="bg-[var(--brand)] text-[var(--text)] px-4">
                    <tr>
                      <th className="py-5 px-6 text-left font-black uppercase tracking-widest">Size</th>
                      <th className="py-5 px-6 text-left font-black uppercase tracking-widest">{t('WAIST')} (cm)</th>
                      <th className="py-5 px-6 text-left font-black uppercase tracking-widest">{t('LENGTH')} (cm)</th>
                      <th className="py-5 px-6 text-left font-black uppercase tracking-widest">{t('CHEST')} (cm)</th>
                      <th className="py-5 px-6 text-left font-black uppercase tracking-widest">{t('HIP')} (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-bold text-[var(--text)]">
                    <tr><td className="py-5 px-6">S</td><td className="py-5 px-6 text-[var(--text-muted)]">72–76</td><td className="py-5 px-6 text-[var(--text-muted)]">98–100</td><td className="py-5 px-6 text-[var(--text-muted)]">86–90</td><td className="py-5 px-6 text-[var(--text-muted)]">90–94</td></tr>
                    <tr><td className="py-5 px-6">M</td><td className="py-5 px-6 text-[var(--text-muted)]">80–84</td><td className="py-5 px-6 text-[var(--text-muted)]">102–104</td><td className="py-5 px-6 text-[var(--text-muted)]">94–98</td><td className="py-5 px-6 text-[var(--text-muted)]">98–102</td></tr>
                    <tr><td className="py-5 px-6">L</td><td className="py-5 px-6 text-[var(--text-muted)]">88–92</td><td className="py-5 px-6 text-[var(--text-muted)]">104–106</td><td className="py-5 px-6 text-[var(--text-muted)]">102–106</td><td className="py-5 px-6 text-[var(--text-muted)]">106–110</td></tr>
                    <tr><td className="py-5 px-6">XL</td><td className="py-5 px-6 text-[var(--text-muted)]">96–100</td><td className="py-5 px-6 text-[var(--text-muted)]">106–108</td><td className="py-5 px-6 text-[var(--text-muted)]">110–114</td><td className="py-5 px-6 text-[var(--text-muted)]">114–118</td></tr>
                    <tr><td className="py-5 px-6">XXL</td><td className="py-5 px-6 text-[var(--text-muted)]">104–110</td><td className="py-5 px-6 text-[var(--text-muted)]">108–110</td><td className="py-5 px-6 text-[var(--text-muted)]">118–124</td><td className="py-5 px-6 text-[var(--text-muted)]">122–128</td></tr>
                  </tbody>
                </table>
              </div>
              <button onClick={() => setShowSizeGuide(false)} className="w-full mt-8 py-5 bg-[var(--brand)] text-[var(--text)] rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Dismiss Gallery</button>
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
