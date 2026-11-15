import React, { useState, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { placeGuestOrder } from '../services/guestCheckoutService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const isCOD = (method) => {
  if (!method) return false;
  if (method.id === 1) return true;
  const name = String(method.name || method.paymentMethod || "").toLowerCase().replace(/[\s_-]/g, "");
  return name.includes("cash") || name.includes("cod");
};

const GuestCheckoutForm = () => {
  const { 
    navigate, 
    backendUrl, 
    cartItems, 
    setCartItems, 
    products,
    getCartAmount,
    delivery_fee,
    resolveVariantId,
    updateGuestToken,
    setGuestOrderInfo,
    clearGuestCart
  } = useContext(ShopContext);

  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(1);
  const [walletPhoneNumber, setWalletPhoneNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    governorate: '',
    city: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
    state: '',
    postalCode: '',
    notes: ''
  });

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/Enums/PaymentMethods`);
      const data = await response.json();
      const methods = data?.responseBody?.data || data?.data || [];
      setPaymentMethods(methods);

      const cod = methods.find(isCOD) || methods.find(m => m.id === 1);
      if (cod) {
        setSelectedPaymentMethod(cod.id);
      } else if (methods.length > 0) {
        setSelectedPaymentMethod(methods[0].id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setPaymentMethods([
        { id: 1, name: 'Cash on Delivery', paymentMethod: 'COD' },
        { id: 2, name: 'Credit / Debit Card', paymentMethod: 'Visa / Mastercard' },
        { id: 4, name: 'Mobile Wallet', paymentMethod: 'Vodafone / Orange / Etisalat' }
      ]);
      setSelectedPaymentMethod(1);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const required = ['customerName', 'phoneNumber', 'email', 'governorate', 'city', 'street'];
    for (const field of required) {
      if (!formData[field].trim()) {
        toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        return false;
      }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const prepareOrderItems = async () => {
    const items = [];
    for (const productId in cartItems) {
      for (const itemKey in cartItems[productId]) {
        const quantity = cartItems[productId][itemKey];
        if (quantity > 0) {
          const [size, color] = itemKey.split('_');
          const productVariantId = await resolveVariantId(productId, size);
          
          if (productVariantId) {
            items.push({
              productId: Number(productId),
              productVariantId: productVariantId,
              quantity: quantity
            });
          }
        }
      }
    }
    return items;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (Object.keys(cartItems).length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsLoading(true);

    try {
      const items = await prepareOrderItems();
      
      if (items.length === 0) {
        toast.error('No valid items in cart');
        setIsLoading(false);
        return;
      }

      const orderPayload = {
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        governorate: formData.governorate,
        city: formData.city,
        street: formData.street,
        building: formData.building || null,
        floor: formData.floor || null,
        apartment: formData.apartment || null,
        state: formData.state || null,
        postalCode: formData.postalCode || null,
        notes: formData.notes || null,
        items: items
      };

      const result = await placeGuestOrder(orderPayload);

      if (result.success) {
        // Save guest token from response
        if (result.guestToken) {
          updateGuestToken(result.guestToken);
        }
        
        // Store order info
        setGuestOrderInfo({
          orderNumber: result.orderNumber,
          orderId: result.orderId,
          guestToken: result.guestToken
        });

        // Clear cart
        clearGuestCart();

        toast.success('Order placed successfully!');
        
        // Navigate to success page
        navigate(`/checkout/success?orderNumber=${encodeURIComponent(result.orderNumber)}`);
      } else {
        toast.error(result.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Guest checkout error:', error);
      toast.error('An error occurred during checkout');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPaymentMethods();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-black mb-4">Contact Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="Enter your phone number"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-black mb-4">Shipping Address</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Governorate *</label>
              <input
                type="text"
                name="governorate"
                value={formData.governorate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                placeholder="Governorate"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                placeholder="City"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Street Address *</label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Building</label>
              <input
                type="text"
                name="building"
                value={formData.building}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                placeholder="Building number"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Floor</label>
              <input
                type="text"
                name="floor"
                value={formData.floor}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                placeholder="Floor number"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Apartment</label>
              <input
                type="text"
                name="apartment"
                value={formData.apartment}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                placeholder="Apartment number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">State/Region</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                placeholder="State or region"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                placeholder="Postal code"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Order Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all resize-none"
              placeholder="Any special instructions for your order"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-black mb-4">Payment Method</h3>
        
        <div className="space-y-3">
          {(paymentMethods.length > 0 ? paymentMethods : [
            { id: 1, name: 'Cash on Delivery' },
            { id: 2, name: 'Credit / Debit Card' },
            { id: 4, name: 'Mobile Wallet' }
          ]).map(method => {
            const isMethodCOD = isCOD(method);
            const isSelected = selectedPaymentMethod === method.id;

            return (
              <label
                key={method.id}
                className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
                  isMethodCOD
                    ? isSelected
                      ? 'border-black bg-gray-50 cursor-pointer shadow-sm'
                      : 'border-gray-200 hover:border-black cursor-pointer'
                    : 'border-gray-200 bg-gray-50/70 opacity-50 cursor-not-allowed select-none'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    disabled={!isMethodCOD}
                    checked={isMethodCOD && isSelected}
                    onChange={(e) => {
                      if (isMethodCOD) setSelectedPaymentMethod(Number(e.target.value));
                    }}
                    className="w-4 h-4 text-black focus:ring-black cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="ml-3">
                    <span className={`font-semibold ${isMethodCOD ? 'text-gray-900' : 'text-gray-500'}`}>
                      {method.name}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isMethodCOD ? 'Pay in cash upon delivery' : 'Available soon'}
                    </p>
                  </div>
                </div>
                {!isMethodCOD && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    Soon
                  </span>
                )}
              </label>
            );
          })}
        </div>

        {selectedPaymentMethod && paymentMethods.find(m => m.id === selectedPaymentMethod)?.name?.toLowerCase().includes('wallet') && (
          <div className="mt-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Wallet Phone Number</label>
            <input
              type="tel"
              value={walletPhoneNumber}
              onChange={(e) => setWalletPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="Enter wallet phone number"
            />
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">Payment Notes (Optional)</label>
          <textarea
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            rows="2"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all resize-none"
            placeholder="Any additional payment notes"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing Order...' : 'Place Order as Guest'}
      </button>

      <p className="text-center text-sm text-gray-500">
        By placing this order as a guest, you can later create an account with the same email to view your order history.
      </p>
    </form>
  );
};

export default GuestCheckoutForm;
