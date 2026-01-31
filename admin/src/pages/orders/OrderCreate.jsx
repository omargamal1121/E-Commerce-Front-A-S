import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl, currency } from "../../App";
import API from "../../services/api";

const OrderCreate = ({ token }) => {
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [notes, setNotes] = useState("");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    phoneNumber: "", country: "", state: "", city: "", streetAddress: "", postalCode: "", isDefault: true, additionalNotes: ""
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [walletPhoneNumber, setWalletPhoneNumber] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("EGP");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [currentStep, setCurrentStep] = useState(1); // 1: Products, 2: Checkout/Address, 3: Payment

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchAddresses(), fetchPaymentMethods()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") setFilteredProducts(products);
    else setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const res = await API.products.getAll(token);
      if (res?.responseBody?.data) {
        setProducts(res.responseBody.data);
        setFilteredProducts(res.responseBody.data);
      }
    } catch (e) { toast.error("Failed to load products"); }
  };

  const fetchAddresses = async () => {
    try {
      const res = await API.customerAddresses.getAll(token);
      if (res?.responseBody?.data) {
        const sorted = [...res.responseBody.data].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
        setAddresses(sorted);
        if (sorted.length > 0) setSelectedAddressId(String(sorted[0].id));
      }
    } catch (e) { toast.error("Failed to load addresses"); }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/PaymentMethod`, {
        params: { isActive: true, isDeleted: false, page: 1, pageSize: 100 },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res?.data?.responseBody?.data) setPaymentMethods(res.data.responseBody.data);
      else {
        const enums = await axios.get(`${backendUrl}/api/Enums/PaymentMethods`, { headers: { Authorization: `Bearer ${token}` } });
        setPaymentMethods(enums.data?.responseBody?.data || []);
      }
    } catch (e) { toast.error("Failed to load payment methods"); }
  };

  const handleProductSelect = async (product) => {
    setSelectedProduct(product);
    setSelectedVariant(null);
    try {
      const res = await axios.get(`${backendUrl}/api/Products/${product.id}/Variants`, { headers: { Authorization: `Bearer ${token}` } });
      const variants = res.data?.responseBody?.data || [];
      const updatedProduct = { ...product, productVariants: variants.length ? variants : [{ id: 0, size: "N/A", color: "Default", quantity: product.quantity || 10, isActive: true, productId: product.id }] };
      setSelectedProduct(updatedProduct);
      if (updatedProduct.productVariants.length) setSelectedVariant(updatedProduct.productVariants[0]);
    } catch (e) { toast.error("Failed to load variants"); }
  };

  const addToCart = async () => {
    if (!selectedProduct || !selectedVariant) return toast.error("Please select a product and size/color");
    try {
      const payload = { productId: selectedProduct.id, quantity, productVariantId: selectedVariant.id };
      await axios.post(`${backendUrl}/api/Cart/items`, payload, { headers: { "Content-Type": "application/json-patch+json", Authorization: `Bearer ${token}` } });
      setCartItems([...cartItems, { product: selectedProduct, variant: selectedVariant, quantity, price: selectedProduct.price, totalPrice: selectedProduct.price * quantity }]);
      toast.success("Product added to cart");
      setSelectedProduct(null); setSelectedVariant(null); setQuantity(1);
    } catch (e) { toast.error("Failed to add to cart"); }
  };

  const placeOrder = async () => {
    if (!selectedAddressId || !selectedPaymentMethod || cartItems.length === 0) return toast.error("Please complete all required fields");
    setLoading(true);
    try {
      await axios.post(`${backendUrl}/api/Cart/checkout`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const selectedMethod = paymentMethods.find(m => (m.paymentMethod ?? m.name ?? m.id).toString().toLowerCase() === selectedPaymentMethod.toString().toLowerCase());
      const payload = { addressId: parseInt(selectedAddressId), notes, paymentMethodId: Number(selectedMethod?.id) };
      const res = await axios.post(`${backendUrl}/api/Order`, payload, { headers: { "Content-Type": "application/json-patch+json", Authorization: `Bearer ${token}` } });
      const orderId = res.data?.responseBody?.data?.order?.id || res.data?.responseBody?.data?.id;
      const orderNumber = res.data?.responseBody?.data?.order?.orderNumber || orderId;

      if (orderId) {
        // Process Payment
        const pPayload = { orderNumber: String(orderNumber), paymentDetails: { walletPhoneNumber, paymentMethod: Number(selectedMethod?.id), currency: paymentCurrency, notes: paymentNotes || notes } };
        const pRes = await axios.post(`${backendUrl}/api/Payment`, pPayload, { headers: { Authorization: `Bearer ${token}` } });
        if (pRes.data?.responseBody?.data?.redirectUrl) {
          window.location.assign(pRes.data.responseBody.data.redirectUrl);
        } else {
          toast.success("Order created successfully");
          navigate("/orders");
        }
      }
    } catch (e) { toast.error("Failed to create order"); }
    finally { setLoading(false); }
  };

  const calculateTotal = () => cartItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-700 p-6 md:p-10">
      {/* Checkout Steps */}
      <div className="flex items-center justify-center max-w-2xl mx-auto w-full gap-4 mb-2">
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div className={`flex flex-col items-center gap-2 flex-1 transition-all duration-500 ${currentStep >= step ? "opacity-100" : "opacity-30"}`}>
              <div className={`h-2 w-full rounded-full transition-all duration-500 ${currentStep >= step ? "bg-blue-600 shadow-lg shadow-blue-100" : "bg-gray-200"}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 0{step}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Product Selection Workspace */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {currentStep === 1 && (
            <div className="flex flex-col gap-8">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Product Catalog</h3>
                  <div className="relative group w-64">
                    <input
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all text-sm font-bold"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleProductSelect(p)}
                      className={`group p-4 rounded-[32px] border transition-all cursor-pointer ${selectedProduct?.id === p.id ? "bg-blue-600 border-blue-600 shadow-xl shadow-blue-100" : "bg-gray-50/50 border-gray-100 hover:border-blue-200 hover:bg-white"}`}
                    >
                      <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-white">
                        <img src={p.images?.[0]?.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                      </div>
                      <p className={`text-[11px] font-black uppercase tracking-tighter truncate ${selectedProduct?.id === p.id ? "text-white" : "text-gray-900"}`}>{p.name}</p>
                      <p className={`text-sm font-black mt-1 ${selectedProduct?.id === p.id ? "text-blue-100" : "text-blue-600"}`}>{currency} {p.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedProduct && (
                <div className="bg-white p-8 rounded-[40px] border border-blue-100 shadow-xl shadow-blue-50 animate-in slide-in-from-bottom-6 duration-500">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-32 h-32 rounded-[32px] overflow-hidden bg-gray-50 flex-shrink-0">
                      <img src={selectedProduct.images?.[0]?.url} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 flex flex-col gap-4">
                      <div>
                        <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{selectedProduct.name}</h4>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Select Options</p>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[150px]">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Variant</label>
                          <select
                            className="w-full mt-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50 font-bold text-sm"
                            onChange={(e) => setSelectedVariant(selectedProduct.productVariants.find(v => v.id === Number(e.target.value)))}
                          >
                            {selectedProduct.productVariants?.map(v => (
                              <option key={v.id} value={v.id}>{v.color} - Size {v.size} (Stock: {v.quantity})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Quantity</label>
                          <input
                            type="number"
                            className="w-full mt-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50 font-bold text-sm text-center"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            min="1"
                          />
                        </div>
                      </div>

                      <button
                        onClick={addToCart}
                        className="w-full py-4 bg-gray-900 text-white rounded-[24px] text-sm font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl hover:scale-[1.02]"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-500">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Shipping Addresses</h3>
                  <button onClick={() => setShowAddAddress(!showAddAddress)} className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-6 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-all">
                    {showAddAddress ? "Cancel" : "Add Address"}
                  </button>
                </div>

                {showAddAddress && (
                  <div className="bg-gray-50 p-8 rounded-[32px] border border-blue-100 animate-in zoom-in-95 duration-300 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: "Phone Number", name: "phoneNumber", placeholder: "+20..." },
                        { label: "Country", name: "country", placeholder: "Egypt" },
                        { label: "State/Region", name: "state", placeholder: "Cairo" },
                        { label: "City", name: "city", placeholder: "New Cairo" },
                        { label: "Street Address", name: "streetAddress", placeholder: "e.g. 123 Main St", full: true },
                        { label: "Postal Code", name: "postalCode", placeholder: "11835" },
                      ].map(f => (
                        <div key={f.name} className={f.full ? "md:col-span-2" : ""}>
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{f.label}</label>
                          <input
                            className="w-full mt-1.5 bg-white border border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-blue-100 font-bold text-xs"
                            placeholder={f.placeholder}
                            value={addressForm[f.name]}
                            onChange={(e) => setAddressForm({ ...addressForm, [f.name]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const res = await axios.post(`${backendUrl}/api/CustomerAddress`, addressForm, { headers: { Authorization: `Bearer ${token}` } });
                          if (res.data) {
                            toast.success("Address saved successfully");
                            fetchAddresses();
                            setShowAddAddress(false);
                          }
                        } catch (e) { toast.error("Failed to save address"); }
                      }}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                      Save Address
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(String(addr.id))}
                      className={`p-6 rounded-[32px] border transition-all cursor-pointer flex flex-col gap-3 ${selectedAddressId === String(addr.id) ? "bg-blue-600 border-blue-600 shadow-xl shadow-blue-100 text-white" : "bg-gray-50/50 border-gray-100 hover:border-blue-200"}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Address #{addr.id}</span>
                        {addr.isDefault && <span className="bg-white/20 text-[8px] font-black uppercase px-3 py-1 rounded-full">Primary</span>}
                      </div>
                      <p className="font-bold text-sm leading-relaxed">{addr.streetAddress}, {addr.city}</p>
                      <p className={`text-[10px] font-bold ${selectedAddressId === String(addr.id) ? "text-blue-100" : "text-gray-400"}`}>{addr.phoneNumber}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Order Notes</label>
                  <textarea
                    className="w-full bg-gray-50 border border-gray-100 rounded-[32px] p-6 outline-none focus:ring-4 focus:ring-blue-50 font-medium text-gray-600 text-sm min-h-[120px]"
                    placeholder="Enter any delivery instructions or shipping notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-500">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col gap-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Payment Method</h3>

                <div className="grid grid-cols-1 gap-4">
                  {paymentMethods.map(m => {
                    const id = (m.paymentMethod ?? m.name ?? m.id).toString();
                    return (
                      <div
                        key={id}
                        onClick={() => setSelectedPaymentMethod(id)}
                        className={`p-6 rounded-[32px] border transition-all cursor-pointer flex items-center justify-between ${selectedPaymentMethod === id ? "bg-blue-600 border-blue-600 shadow-xl shadow-blue-100 text-white text-xl" : "bg-gray-50/50 border-gray-100 hover:border-blue-200"}`}
                      >
                        <span className="font-black uppercase tracking-tighter">{m.name || m.paymentMethod}</span>
                        <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center ${selectedPaymentMethod === id ? "bg-white border-blue-400" : "border-gray-200 bg-white"}`}>
                          {selectedPaymentMethod === id && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Wallet Phone Number</label>
                    <input
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-50 font-bold"
                      placeholder="+20 000 000 0000"
                      value={walletPhoneNumber}
                      onChange={(e) => setWalletPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Currency</label>
                    <input
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-50 font-bold uppercase"
                      maxLength={3}
                      value={paymentCurrency}
                      onChange={(e) => setPaymentCurrency(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-gray-900 text-white p-8 rounded-[48px] shadow-2xl shadow-blue-900/10 flex flex-col gap-8 h-fit sticky top-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 text-center">Your Cart</h4>

            <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar-white">
              {cartItems.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-4 text-gray-600">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <p className="text-[10px] font-black uppercase tracking-widest">Cart is empty</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-[24px]">
                    <img src={item.product.images?.[0]?.url} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase truncate">{item.product.name}</p>
                      <p className="text-[9px] text-blue-400 font-bold">QTY: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-black">{currency} {item.totalPrice}</span>
                  </div>
                ))
              )}
            </div>

            <div className="h-px bg-white/10 my-2" />

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                <span className="font-bold">{currency} {calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Grand Total</span>
                  <span className="text-4xl font-black tracking-tighter">{currency} {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={cartItems.length === 0 || (currentStep === 2 && !selectedAddressId)}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20 disabled:opacity-30"
                >
                  Continue to Step 0{currentStep + 1}
                </button>
              ) : (
                <button
                  onClick={placeOrder}
                  disabled={loading || !selectedPaymentMethod || !walletPhoneNumber}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-[24px] text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-green-900/20 disabled:opacity-30 flex items-center justify-center gap-3"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  Place Order
                </button>
              )}
              {currentStep > 1 && (
                <button onClick={() => setCurrentStep(prev => prev - 1)} className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Back to previous step</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCreate;
