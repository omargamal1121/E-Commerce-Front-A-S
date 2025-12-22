import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const Payment = () => {
    const { orderNumber } = useParams();
    const { backendUrl, token, currency } = useContext(ShopContext);
    const navigate = useNavigate();

    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [walletPhoneNumber, setWalletPhoneNumber] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [processingPayment, setProcessingPayment] = useState(false);

    // Fetch order details
    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/api/Order/number/${orderNumber}`, {
                headers: { 'Authorization': `Bearer ${token}` }
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
            if (methods.length > 0) {
                setSelectedPaymentMethod(methods[0].id);
            }
        } catch (error) {
            console.error("Error fetching payment methods:", error);
            toast.error("Failed to load payment methods");
        }
    };

    useEffect(() => {
        if (token && orderNumber) {
            fetchOrderDetails();
            fetchPaymentMethods();
        }
    }, [token, orderNumber]);

    const handlePayment = async () => {
        if (!selectedPaymentMethod) {
            toast.error("Please select a payment method");
            return;
        }

        setProcessingPayment(true);
        try {
            const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);

            // Validate payment method logic (similar to Orders.jsx)
            let methodValue = NaN;
            const selectedName = (selectedMethod?.paymentMethod || "").toString().toLowerCase();
            const enumMatch = paymentMethods.find(
                (e) => (e.name || e.Name || "").toString().toLowerCase() === selectedName
            );

            if (enumMatch) {
                methodValue = Number(enumMatch.id);
            } else {
                const selNum = Number(selectedPaymentMethod);
                if (Number.isFinite(selNum)) {
                    methodValue = selNum;
                }
            }

            if (!Number.isFinite(methodValue) || methodValue <= 0) {
                throw new Error("Invalid payment method");
            }

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

            console.log("Sending payment request:", paymentData);

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
            console.error("Error response data:", error.response?.data);

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

        setProcessingPayment(true);
        try {
            const response = await axios.put(`${backendUrl}/api/Order/${orderData?.id || orderNumber}/status?status=5`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data?.success || response.status === 200) {
                toast.success(response.data?.message || 'Order cancelled successfully');
                navigate('/orders');
            } else {
                toast.error(response.data?.message || 'Failed to cancel order');
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            console.error('Error response data:', error.response?.data);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error cancelling order';
            toast.error(`Failed: ${errorMessage}`);
        } finally {
            setProcessingPayment(false);
        }
    };

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
                                <span className="font-medium">{new Date(orderData?.createdAt).toLocaleDateString()}</span>
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
                            {paymentMethods.map((method) => (
                                <div
                                    key={method.id}
                                    onClick={() => setSelectedPaymentMethod(method.id)}
                                    className={`border rounded-md p-4 cursor-pointer flex items-center justify-between transition-all ${selectedPaymentMethod === method.id
                                        ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === method.id ? 'border-green-500' : 'border-gray-300'
                                            }`}>
                                            {selectedPaymentMethod === method.id && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{method.name}</p>
                                            <p className="text-xs text-gray-500">{method.paymentMethod}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                    disabled={!selectedPaymentMethod || processingPayment}
                                    className={`flex-1 px-4 py-3 rounded text-white font-medium transition-colors ${!selectedPaymentMethod || processingPayment
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-black hover:bg-gray-800'
                                        }`}
                                >
                                    {processingPayment ? 'Processing...' : `Pay ${currency}${orderData?.total}`}
                                </button>
                            </div>

                            {/* Cancel Order Button - Only if status is pending/consistent with what allows cancellation */}
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
