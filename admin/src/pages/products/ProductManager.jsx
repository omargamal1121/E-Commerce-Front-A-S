import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";
import { useParams, useLocation, useNavigate } from "react-router-dom";

// Import components
import ProductList from "./ProductList";
import ProductAdd from "./ProductAdd";

const ProductManager = ({ token }) => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("inventory");

    // Sync state with URL
    useEffect(() => {
        if (location.pathname.includes("/add") || location.pathname.includes("/edit")) {
            setActiveTab("forge");
        } else {
            setActiveTab("inventory");
        }
    }, [location.pathname]);

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-10">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-50 rounded-[24px] flex items-center justify-center text-3xl shadow-inner border border-emerald-100/50">
                        🏬
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
                            Product Forge
                        </h1>
                        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">
                            Centralized Inventory & Asset Management
                        </p>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-[24px]">
                    {[
                        { id: "inventory", label: "Registry", icon: "📦" },
                        { id: "forge", label: "Initialize", icon: "🔨" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                navigate(tab.id === "inventory" ? "/products" : "/add");
                            }}
                            className={`flex items-center gap-2 px-8 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                                ? "bg-white text-emerald-600 shadow-xl shadow-emerald-900/5 scale-[1.05]"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-200/50"
                                }`}
                        >
                            <span className="text-base">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Experience Area */}
            <div className="min-h-[700px]">
                {activeTab === "inventory" && <ProductList token={token} />}
                {activeTab === "forge" && <ProductAdd token={token} />}
            </div>
        </div>
    );
};

export default ProductManager;
