import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../../App";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warn("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      // ✅ Proper API request with correct content type
      const response = await axios.post(
        `${backendUrl}/api/Account/login`,
        { email, password },
        {
          headers: {
            "Content-Type": "application/json-patch+json",
            Accept: "text/plain",
          },
        }
      );

      // ✅ Handle API response according to schema
      const { statuscode, responseBody } = response.data || {};
      const token = responseBody?.data?.token;
      const roles = responseBody?.data?.roles || [];

      if (statuscode === 200 && token) {
        setToken(token);
        localStorage.setItem("token", token);
        localStorage.setItem("roles", JSON.stringify(roles));
        toast.success(responseBody?.message || "Login successful");
      } else {
        // Handle backend-provided error messages
        const errMsg =
          responseBody?.message ||
          responseBody?.errors?.messages?.join(", ") ||
          "Login failed. Please check your credentials.";
        toast.error(errMsg);
      }
    } catch (error) {
      console.error("Login Error:", error);

      // ✅ Error with HTTP response (server responded but not 2xx)
      if (error.response) {
        const { status, data } = error.response;
        const apiMessage =
          data?.responseBody?.message ||
          data?.responseBody?.errors?.messages?.join(", ") ||
          "Unexpected error occurred.";

        switch (status) {
          case 400:
            toast.error(apiMessage || "Bad Request — please check your input.");
            break;
          case 401:
            toast.error(apiMessage || "Unauthorized — invalid email or password.");
            break;
          case 500:
            toast.error(apiMessage || "Internal Server Error — please try again later.");
            break;
          default:
            toast.error(apiMessage || `Server returned status ${status}`);
        }
      }

      // ✅ Error with no response (e.g., network issue)
      else if (error.request) {
        toast.error("No response from the server. Please check your connection.");
      }

      // ✅ Something went wrong before sending the request
      else {
        toast.error(`Error setting up the request: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full">
      <div className="bg-white shadow-md rounded-lg px-8 py-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Admin Panel</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Email Address</p>
            <input
              type="email"
              className="rounded-md w-full px-3 py-2 border border-gray-300 outline-none"
              placeholder="Enter Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Password</p>
            <input
              type="password"
              className="rounded-md w-full px-3 py-2 border border-gray-300 outline-none"
              placeholder="Enter Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
            } text-white px-4 py-2 rounded-md w-full transition`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
