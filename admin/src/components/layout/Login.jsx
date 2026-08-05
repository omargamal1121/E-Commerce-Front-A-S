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
      // ✅ Using new staff login endpoint
      const response = await axios.post(
        `${backendUrl}/api/Account/staff/login`,
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      console.log("Full response:", response.data);

      // ✅ Handle multiple possible response structures
      const responseData = response.data;
      
      // Try structure 1: { success, message, data }
      let success = responseData?.success;
      let message = responseData?.message;
      let data = responseData?.data;
      
      // Try structure 2: { responseBody: { data, message } }
      if (!success && responseData?.responseBody) {
        success = responseData.statuscode === 200;
        message = responseData.responseBody?.message;
        data = responseData.responseBody?.data;
      }
      
      // Try structure 3: Direct token in response
      if (!data && responseData?.token) {
        data = responseData;
        success = true;
      }

      const token = data?.token || responseData?.token;
      const refreshToken = data?.refreshToken || responseData?.refreshToken;
      const roles = data?.roles || responseData?.roles || [];

      console.log("Parsed login data:", { success, message, token, refreshToken, roles });

      if (success && token) {
        setToken(token);
        sessionStorage.setItem("token", token);
        if (refreshToken) {
          sessionStorage.setItem("refreshToken", refreshToken);
        }
        sessionStorage.setItem("roles", JSON.stringify(roles));
        toast.success(message || "Login successful");
      } else {
        // Handle backend-provided error messages
        const errMsg = message || "Login failed. Please check your credentials.";
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
            toast.error(apiMessage || "Invalid email or password");
            break;
          case 403:
            toast.error(apiMessage || "You do not have permission to access this panel");
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
