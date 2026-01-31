import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";
import { useParams, useLocation, useNavigate } from "react-router-dom";

// Import components
import OrderList from "./OrderList";
import OrderCreate from "./OrderCreate";
import ViewOrderModal from "../../components/modals/ViewOrderModal";

const OrderManager = ({ token }) => {
    const { orderId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);

    const [activeTab, setActiveTab] = useState("list");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    // Sync state with URL
    useEffect(() => {
        if (location.pathname.includes("/orders/create")) {
            setActiveTab("create");
        } else if (location.pathname.includes("/orders/view/")) {
            setActiveTab("list"); // Keep list open but show modal or dedicated view
            // Handle fetching order details for the view
            fetchOrderDetails(orderId);
        } else {
            setActiveTab("list");
        }
    }, [location.pathname, orderId]);

    const fetchOrderDetails = async (id) => {
        if (!id) return;
        try {
            // First try by order number (common for this app)
            const res = await axios.get(`${backendUrl}/api/Order/number/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res.data?.responseBody?.data;
            if (data) {
                setSelectedOrder(data);
                setShowViewModal(true);
            } else {
                // Try by ID
                const resId = await axios.get(`${backendUrl}/api/Order/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const dataId = resId.data?.responseBody?.data;
                if (dataId) {
                    setSelectedOrder(dataId);
                    setShowViewModal(true);
                }
            }
        } catch (error) {
            console.error("Error fetching order details:", error);
            toast.error("Failed to load order details");
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Orders
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">
                        View and manage customer orders and fulfillment
                    </p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {[
                        { id: "list", label: "Orders", icon: "📦" },
                        { id: "create", label: "New Order", icon: "➕" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                navigate(tab.id === "list" ? "/orders" : "/orders/create");
                            }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
                {activeTab === "list" && <OrderList token={token} />}
                {activeTab === "create" && <OrderCreate token={token} />}
            </div>

            {/* Reusable View Modal with Premium Design */}
            {showViewModal && selectedOrder && (
                <ViewOrderModal
                    selectedOrder={selectedOrder}
                    setShowViewModal={(val) => {
                        setShowViewModal(val);
                        if (!val) navigate("/orders");
                    }}
                />
            )}
        </div>
    );
};

export default OrderManager;
