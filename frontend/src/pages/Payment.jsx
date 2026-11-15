import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getGuestToken } from '../utils/guestSession';

const isCOD = (method) => {
    if (!method) return false;
    if (method.id === 1) return true;
    const name = String(method.name || method.paymentMethod || "").toLowerCase().replace(/[\s_-]/g, "");
    return name.includes("cash") || name.includes("cod");
};

const Payment = () => {
    const { orderNumber } = useParams();
    const { backendUrl, token, currency } = useContext(ShopContext);
    const navigate = useNavigate();
    const guestToken = getGuestToken();
    const buildAuthHeaders = (additionalHeaders = {}) => {
        const headers = { "Content-Type": "application/json", ...additionalHeaders };
        if (token) return { ...headers, Authorization: `Bearer ${token}` };
        if (guestToken) return { ...headers, "X-Guest-Token": guestToken };
        return headers;
    };

    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [walletPhoneNumber, setWalletPhoneNumber] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        if (!token && !guestToken) {
            navigate('/login', { replace: true });
        }
    }, [token, guestToken, navigate]);

    // Fetch order details
    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const endpoint = token ? `/api/Order/number/${orderNumber}` : `/api/Order/guest/number/${orderNumber}`;
            const response = await axios.get(`${backendUrl}${endpoint}`, {
                headers: buildAuthHeaders()
            });
            if (response.data.statuscode === 200) {
                setOrderData(response.data.responseBody.data);
            } else {
                toast.error("Failed to load order details");
                navigate('/orders');
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            toast.error("Error loading order details");
            navigate('/orders');
        } finally {
            setLoading(false);
        }
    };

    // Fetch payment methods
    const fetchPaymentMethods = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/Enums/PaymentMethods`);
            const methods = response.data.responseBody?.data || [];
            setPaymentMethods(methods);
            const cod = methods.find(isCOD) || methods.find(m => m.id === 1);
            if (cod) {
                setSelectedPaymentMethod(cod.id);
            } else if (methods.length > 0) {
                setSelectedPaymentMethod(methods[0].id);
            }
        } catch (error) {
            console.error("Error fetching payment methods:", error);
            setPaymentMethods([
                { id: 1, name: "Cash on Delivery", paymentMethod: "COD" },
                { id: 2, name: "Credit / Debit Card", paymentMethod: "Visa / Mastercard" },
                { id: 4, name: "Mobile Wallet", paymentMethod: "Vodafone / Orange / Etisalat" }
            ]);
            setSelectedPaymentMethod(1);
        }
    };

    useEffect(() => {
        if ((token || guestToken) && orderNumber) {
            fetchOrderDetails();
            fetchPaymentMethods();
        }
    }, [token, guestToken, orderNumber]);

    const handlePayment = async () => {
        if (selectedPaymentMethod === null || selectedPaymentMethod === undefined) {
            toast.error("Please select a payment method");
            return;
        }

        // Use the id directly – it IS the enum value the API expects.
        const methodValue = Number(selectedPaymentMethod);
        if (!Number.isFinite(methodValue)) {
            toast.error("Invalid payment method selected. Please try again.");
            return;
        }

        setProcessingPayment(true);
        try {
            const paymentData = {
                orderId: orderData?.id,
                orderNumber: orderNumber,
                paymentDetails: {
                    walletPhoneNumber: walletPhoneNumber || "",
                    paymentMethod: methodValue,
                    currency: "EGP",
                    notes: paymentNotes || ""
                }
            };

            const paymentResponse = await axios.post(
                `${backendUrl}/api/payment`,
                paymentData,
                {
                    headers: {
                        ...buildAuthHeaders(),
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
                    toast.success("Payment processed successfully!");
                    navigate('/orders');
                }
            } else {
                toast.error(paymentResponse.data.responseBody?.message || "Payment failed");
            }
        } catch (error) {
            console.error("Error processing payment:", error);

            let errorMessage = "Failed to process payment";
            const errData = error.response?.data;
            if (errData) {
                if (typeof errData === 'string') errorMessage = errData;
                else if (typeof errData === 'object') {
                    if (errData.responseBody?.message) errorMessage = errData.responseBody.message;
                    else if (errData.message) errorMessage = errData.message;
                    else if (errData.error) errorMessage = errData.error;
                    else if (errData.errors) errorMessage = JSON.stringify(errData.errors);
                }
            }

            toast.error(errorMessage);
        } finally {
            setProcessingPayment(false);
        }
    };

    // Handle Cancel Order
    const handleCancelOrder = async () => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;

        // Use numeric id only – orderNumber is a string and not valid as a path segment for status update
        const orderId = orderData?.id;
        if (!orderId) {
            toast.error("Cannot cancel: order ID not found.");
            return;
        }

        setProcessingPayment(true);
        try {
            const response = await axios.put(
                `${backendUrl}/api/Order/${orderId}/status?status=5`,
                {},
                { headers: buildAuthHeaders() }
            );

            if (response.data?.success || response.status === 200) {
                toast.success(response.data?.message || 'Order cancelled successfully');
                navigate('/orders');
            } else {
                toast.error(response.data?.message || 'Failed to cancel order');
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error cancelling order';
            toast.error(`Failed: ${errorMessage}`);
        } finally {
            setProcessingPayment(false);
        }
    };

    if (!token && !guestToken) return null;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className='border-t border-gray-300 pt-16 mt-[80px] mb-5 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
            <div className='text-2xl mb-8'>
                <Title text1={'COMPLETE'} text2={'PAYMENT'} />
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Order Summary */}
                <div className="w-full md:w-1/2">
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                        <h3 className="text-xl font-medium mb-4">Order Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600">Order Number</span>
                                <span className="font-medium">#{orderData?.orderNumber}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600">Date</span>
                                <span className="font-medium">
                                    {orderData?.createdAt
                                        ? new Date(orderData.createdAt).toLocaleDateString()
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600">Items</span>
                                <span className="font-medium">{orderData?.items?.length || 0} items</span>
                            </div>
                            <div className="flex justify-between pt-2 text-lg font-bold">
                                <span>Total Amount</span>
                                <span>{currency}{orderData?.total}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Method Selection */}
                <div className="w-full md:w-1/2">
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h3 className="text-xl font-medium mb-4">Select Payment Method</h3>

                        <div className="space-y-3 mb-6">
                            {(paymentMethods.length > 0 ? paymentMethods : [
                                { id: 1, name: "Cash on Delivery", paymentMethod: "COD" },
                                { id: 2, name: "Credit / Debit Card", paymentMethod: "Visa / Mastercard" },
                                { id: 4, name: "Mobile Wallet", paymentMethod: "Vodafone / Orange / Etisalat" }
                            ]).map((method) => {
                                const isMethodCOD = isCOD(method);
                                const isSelected = selectedPaymentMethod === method.id;

                                return (
                                    <div
                                        key={method.id}
                                        onClick={() => {
                                            if (isMethodCOD) setSelectedPaymentMethod(method.id);
                                        }}
                                        className={`border rounded-xl p-4 flex items-center justify-between transition-all ${
                                            isMethodCOD
                                                ? isSelected
                                                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500 cursor-pointer'
                                                    : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                                                : 'border-gray-200 bg-gray-50/70 opacity-50 cursor-not-allowed select-none'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                isMethodCOD && isSelected ? 'border-green-500' : 'border-gray-300'
                                            }`}>
                                                {isMethodCOD && isSelected && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-semibold text-sm ${isMethodCOD ? 'text-gray-800' : 'text-gray-500'}`}>{method.name}</p>
                                                    {!isMethodCOD && (
                                                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                                            Soon
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {isMethodCOD ? "Pay in cash upon delivery" : "Available soon"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Wallet Phone Number */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Wallet Phone Number (Optional)
                            </label>
                            <input
                                type="tel"
                                value={walletPhoneNumber}
                                onChange={(e) => setWalletPhoneNumber(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-1 focus:ring-black focus:border-black outline-none"
                                placeholder="Enter wallet phone number"
                            />
                        </div>

                        {/* Notes */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Notes (Optional)
                            </label>
                            <textarea
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-1 focus:ring-black focus:border-black outline-none"
                                placeholder="Add any notes here..."
                                rows="2"
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => navigate('/orders')}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                    disabled={processingPayment}
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handlePayment}
                                    disabled={selectedPaymentMethod === null || selectedPaymentMethod === undefined || processingPayment}
                                    className={`flex-1 px-4 py-3 rounded text-white font-medium transition-colors ${selectedPaymentMethod === null || selectedPaymentMethod === undefined || processingPayment
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-black hover:bg-gray-800'
                                        }`}
                                >
                                    {processingPayment ? 'Processing...' : `Pay ${currency}${orderData?.total}`}
                                </button>
                            </div>

                            {/* Cancel Order Button */}
                            {(orderData?.status === 0 || orderData?.status === 'Pending Payment' || orderData?.canBeCancelled) && (
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={processingPayment}
                                    className="w-full px-4 py-3 border border-red-500 text-red-500 rounded font-medium hover:bg-red-50 transition-colors mt-2"
                                >
                                    Cancel Order
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
