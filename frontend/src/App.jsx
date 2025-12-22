import React, { useEffect, useContext } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import authService from "./services/authService";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import Payment from "./pages/Payment";
import PlaceOrder from "./pages/PlaceOrder";
import Product from "./pages/Product";
import Navbar from "./components/Navbar";
import NavbarPage from "./components/NavbarPage";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DenimCollection from "./pages/DenimCollection";
import Collection from "./pages/Collection";
import Policy from "./pages/Policy";
import ApiTest from "./components/ApiTest";
import ChangeEmail from "./pages/ChangeEmail";
import ChangePassword from "./pages/ChangePassword";
import UploadPhoto from "./pages/UploadPhoto";
import Profile from "./pages/Profile";
import CategoryPage from "./pages/CategoryPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import CollectionProducts from "./pages/CollectionProducts";
import RequestPasswordReset from "./pages/RequestPasswordReset";
import ScrollToTopButton from "./components/ScrollToTopButton";
import Wishlist from "./pages/Wishlist";
import Erroe404 from "./pages/Erroe404";
import GoogleCallback from "./pages/GoogleCallback";
import { ShopContext } from "./context/ShopContext";
import ShopContextProvider from "./context/ShopContext";

// Component to scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  const location = useLocation();
  const { user } = useContext(ShopContext);
  useEffect(() => {
    // Ensure interceptors are initialized (constructor already does this)
    // Optionally, you could test cookie availability here if needed
    void authService.hasValidToken();
  }, []);
  // Determine if user is DeliveryCompany (or Delivery)
  const rawRoles = user?.roles || user?.role || user?.userRoles || [];
  const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const normalized = roles.map((r) => String(r || "").toLowerCase());
  const isDeliveryOnly =
    normalized.includes("deliverycompany") || normalized.includes("delivery");

  if (isDeliveryOnly) {
    return (
      <>
        <div>
          <ScrollToTop />
          <ToastContainer />
          <Routes>
            <Route path="/orders" element={<Orders />} />
            <Route path="*" element={<Navigate to="/orders" replace />} />
          </Routes>
        </div>
      </>
    );
  }

  return (
    <ShopContextProvider>
      <div>
        <ScrollToTop />
        {location.pathname === "/" ? <Navbar /> : <NavbarPage />}
        <ToastContainer />
        <SearchBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/error" element={<Erroe404 />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/about" element={<About />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/google-callback" element={<GoogleCallback />} />
          <Route path="/google-callback/auth-success" element={<GoogleCallback />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/payment/:orderNumber" element={<Payment />} />
          <Route path="/place-order" element={<PlaceOrder />} />
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/request-password" element={<RequestPasswordReset />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/denim-collection" element={<DenimCollection />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/api-test" element={<ApiTest />} />
          <Route path="/change-email" element={<ChangeEmail />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/upload-photo" element={<UploadPhoto />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route
            path="/subcategory/:subcategoryId"
            element={<SubcategoryPage />}
          />
          <Route
            path="/collection-products/:collectionId"
            element={<CollectionProducts />}
          />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="*" element={<Erroe404 />} />
        </Routes>
        <Footer />
        <ScrollToTopButton />
      </div>
    </ShopContextProvider>
  );
};

export default App;
