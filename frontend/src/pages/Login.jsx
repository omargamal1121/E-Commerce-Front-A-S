import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import authService from "../services/authService";

const Login = () => {
  const { setToken, backendUrl, setUser } = useContext(ShopContext);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${backendUrl}/api/Account/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse);
        setError("Server returned an invalid response. Please try again.");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setSuccess("Login successful!");

        if (data.responseBody && data.responseBody.data) {
          const tokenData = data.responseBody.data;

          // ✅ Save tokens + user info
          localStorage.setItem("token", tokenData.token);
          localStorage.setItem("refreshToken", tokenData.refreshToken);

          // Prefer full user from API; fallback to email-only
          const userData = tokenData.user || { email: formData.email };
          localStorage.setItem("user", JSON.stringify(userData));

          // ✅ Update context
          setToken(tokenData.token);
          setUser(userData);

          // 🔀 Role-based redirect
          const rawRoles = userData.roles || userData.role || userData.userRoles || [];
          const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
          const norm = roles.map((r) => String(r || '').toLowerCase());

          const isAdmin = norm.includes('admin');
          const isDelivery = norm.includes('deliverycompany') || norm.includes('delivery');

          if (isAdmin) {
            const adminUrl = import.meta.env.VITE_ADMIN_URL;
            if (adminUrl) {
              window.location.href = adminUrl;
            } else {
              // Fallback: keep user on frontend home if admin panel URL not set
              navigate('/', { replace: true });
            }
          } else if (isDelivery) {
            navigate('/orders', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } else {
          // If no data envelope, fallback to home
          navigate('/', { replace: true });
        }
      } else {
        const errorMessage =
          data.responseBody?.message ||
          data.responseBody?.error?.message ||
          "Login failed. Please check your credentials.";
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  return (
    <motion.form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto gap-4 text-gray-800 mt-40"
      initial="hidden"
      animate="visible"
      variants={formVariants}
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="text-3xl prata-regular">Login</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm"
        >
          {success}
        </motion.div>
      )}

      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        className="outline-none w-full border-2 border-gray-300 py-2 px-3 rounded-md focus:border-gray-600 transition-colors"
        placeholder="Enter your Email"
        required
      />
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleInputChange}
        className="outline-none w-full border-2 border-gray-300 py-2 px-3 rounded-md focus:border-gray-600 transition-colors"
        placeholder="Enter your Password"
        required
      />
      <div className="w-full flex justify-between text-sm mt-[-8px]">
        <p>
          Don’t have an account?{" "}
          <Link to="/signup" className="hover:text-gray-600 hover:underline">
            Sign Up
          </Link>
        </p>
        <Link
          to="/request-password"
          className="hover:text-gray-600 hover:underline"
        >
          Forgot Password?
        </Link>
      </div>
      <button
        type="submit"
        disabled={loading}
        className={`w-full font-light py-2 px-8 mt-4 border border-black transition-all duration-300 ${loading
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-black text-white hover:bg-white hover:text-black"
          }`}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      <div className="w-full flex items-center justify-between mt-4">
        <hr className="w-full border-gray-300" />
        <span className="px-2 text-gray-500 text-sm">OR</span>
        <hr className="w-full border-gray-300" />
      </div>

      <button
        type="button"
        onClick={() => authService.initiateGoogleLogin()}
        className="w-full flex items-center justify-center gap-2 py-2 px-8 border border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-300 mt-2"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="w-5 h-5"
        />
        <span className="text-gray-700 font-medium">Sign in with Google</span>
      </button>
    </motion.form>
  );
};

export default Login;
