import React, { useState, useEffect } from "react";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import { Routes, Route, Navigate } from "react-router-dom";
// Dashboard
import Dashboard from "./pages/dashboard/Dashboard";

// Products
import ProductManager from "./pages/products/ProductManager";
import ProductVariant from "./pages/products/ProductVariant";
import ProductDiscountPage from "./pages/products/ProductDiscountPage";
import ProductDetails from "./pages/products/ProductDetails";

// Orders
import OrderManager from "./pages/orders/OrderManager";
import OrderDetails from "./pages/orders/OrderDetails";

// Categories
import CategoryManager from "./pages/categories/CategoryManager";
import SubCategoryDetails from "./pages/categories/SubCategoryDetails";
import SubCategoryManager from "./pages/categories/SubCategoryManager";

// Collections
import CollectionManager from "./pages/collections/CollectionManager";

// Discounts
import DiscountManager from "./pages/discounts/DiscountManager";
import DiscountDetails from "./pages/discounts/DiscountDetails";
import BulkDiscountPage from "./pages/discounts/BulkDiscountPage";

// Users
import UserList from "./pages/users/UserList";
import AdminOperations from "./pages/users/AdminOperations";

// Settings
import Settings from "./pages/settings/Settings";
import Login from "./components/layout/Login";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import authService from "./services/authService";

export const currency = "EGP";

export const backendUrl = import.meta.env.VITE_BACKEND_URL;

/** Decode JWT roles without a library */
const decodeJwtRoles = (jwt) => {
  try {
    const parts = String(jwt).split(".");
    if (parts.length < 2) return [];
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64));
    const rolesClaim =
      json?.role ||
      json?.roles ||
      json?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      [];
    const roles = Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim];
    return roles.filter(Boolean).map((r) => String(r).toLowerCase());
  } catch {
    return [];
  }
};

function App() {
  // Migrate any leftover token from localStorage → sessionStorage (one-time)
  useEffect(() => {
    const legacyToken = localStorage.getItem("token");
    if (legacyToken) {
      sessionStorage.setItem("token", legacyToken);
      localStorage.removeItem("token");
    }
  }, []);

  const [token, setToken] = useState(sessionStorage.getItem("token") || "");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDeliveryOnly, setIsDeliveryOnly] = useState(false);
  // Prevents the login page from flashing while we validate / refresh the token
  const [authLoading, setAuthLoading] = useState(true);

  // Persist token in sessionStorage whenever it changes
  useEffect(() => {
    if (token) {
      sessionStorage.setItem("token", token);
    } else {
      sessionStorage.removeItem("token");
    }
  }, [token]);

  // Determine role-based access
  useEffect(() => {
    const current = sessionStorage.getItem("token");
    const roles = decodeJwtRoles(current);
    const delivery =
      roles.includes("deliverycompany") || roles.includes("delivery");
    setIsDeliveryOnly(Boolean(delivery));
  }, [token]);

  // Validate token on app load — refresh if expired, redirect if unrecoverable
  useEffect(() => {
    const validateTokenOnLoad = async () => {
      const currentToken = sessionStorage.getItem("token");
      if (!currentToken) {
        setAuthLoading(false);
        return;
      }

      const isValid = authService.hasValidToken(); // checks JWT exp claim
      if (!isValid) {
        const newToken = await authService.manualRefresh();
        if (newToken) {
          setToken(newToken);
        } else {
          // refresh failed → force login (manualRefresh already clears storage)
          setToken("");
        }
      }
      setAuthLoading(false);
    };

    validateTokenOnLoad();
  }, []);

  // Expose toast globally for the auth service interceptor
  useEffect(() => {
    window.showToast = (message, type = "error") => {
      if (type === "error") toast.error(message);
      else if (type === "success") toast.success(message);
      else if (type === "info") toast.info(message);
      else toast(message);
    };

    window.toast = {
      error: toast.error,
      success: toast.success,
      info: toast.info,
    };
  }, []);

  // Show a minimal full-screen loader while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-medium">Checking session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <ToastContainer />
      {token === "" ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <Navbar
            setToken={setToken}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <div className="flex w-full items-start">
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              deliveryOnly={isDeliveryOnly}
            />
            <main className="flex-1 w-full mx-auto px-3 sm:px-6 md:px-8 text-gray-700 text-base max-w-screen-lg lg:max-w-[1800px] overflow-x-hidden">
              <Routes>
                {isDeliveryOnly ? (
                  <>
                    <Route path="/orders" element={<OrderManager token={token} />} />
                    <Route path="*" element={<Navigate to="/orders" replace />} />
                  </>
                ) : (
                  <>
                    <Route path="/" element={<Dashboard token={token} />} />
                    {/* Unified Product Flow */}
                    <Route path="/products" element={<ProductManager token={token} />} />
                    <Route path="/add" element={<ProductManager token={token} />} />
                    <Route path="/products/:id" element={<ProductDetails token={token} />} />
                    <Route path="/products/:productId/variants" element={<ProductVariant token={token} />} />
                    <Route path="/products/:productId/discount" element={<ProductDiscountPage token={token} />} />

                    <Route path="/discounts" element={<DiscountManager token={token} />} />
                    <Route path="/discounts/:id" element={<DiscountDetails token={token} />} />
                    <Route path="/bulk-discount" element={<BulkDiscountPage token={token} />} />
                    <Route path="/sub-category" element={<SubCategoryManager token={token} />} />
                    <Route path="/collections" element={<CategoryManager token={token} backendUrl={backendUrl} />} />
                    <Route path="/orders" element={<OrderManager token={token} />} />
                    <Route path="/orders/create" element={<OrderManager token={token} />} />
                    <Route path="/orders/view/:orderId" element={<OrderDetails token={token} />} />
                    <Route path="/users" element={<UserList token={token} />} />
                    <Route path="/admin-operations" element={<AdminOperations token={token} />} />
                    <Route path="/settings" element={<Settings token={token} />} />
                    <Route path="/category/view/:categoryId" element={<CategoryManager token={token} backendUrl={backendUrl} />} />
                    <Route path="/category/edit/:categoryId" element={<CategoryManager token={token} backendUrl={backendUrl} />} />
                    <Route path="/collection-manager" element={<CollectionManager token={token} />} />
                    <Route path="/collection/view/:collectionId" element={<CollectionManager token={token} />} />
                    <Route path="/collection/edit/:collectionId" element={<CollectionManager token={token} />} />
                    {/* Dedicated details pages */}
                    <Route path="/subcategories/:id" element={<SubCategoryDetails token={token} />} />
                  </>
                )}
              </Routes>
            </main>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
