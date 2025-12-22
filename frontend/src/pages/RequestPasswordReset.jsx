import React, { useState, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // 👈 استدعاء useNavigate

const RequestPasswordReset = () => {
  const { backendUrl } = useContext(ShopContext);
  const navigate = useNavigate(); // 👈 تفعيل النافيجيت

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${backendUrl}/api/Account/request-password-reset?Email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          data.responseBody?.message ||
            "A reset link/token has been sent to your email!"
        );

        // 👇 بعد ثانيتين يروح لصفحة reset-password مع تمرير الايميل في الـ URL
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 2000);

        setEmail("");
      } else {
        setError(
          data.responseBody?.message ||
            "Failed to send reset token. Please try again."
        );
      }
    } catch (err) {
      console.error("Request password reset error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-25 gap-4 text-gray-800"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 60 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: "easeOut" },
        },
      }}
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="text-3xl prata-regular">Request Password Reset</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>
      <p className="text-sm text-gray-600 w-full text-center">
        Enter your email to receive a reset token.
      </p>

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
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="outline-none w-full border-2 border-gray-300 py-2 px-3 rounded-md focus:border-gray-600 transition-colors"
        placeholder="Email Address"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className={`w-full font-light py-2 px-8 mt-4 border border-black transition-all duration-300 cursor-pointer ${
          loading
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-black text-white hover:bg-white hover:text-black"
        }`}
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
    </motion.form>
  );
};

export default RequestPasswordReset;
