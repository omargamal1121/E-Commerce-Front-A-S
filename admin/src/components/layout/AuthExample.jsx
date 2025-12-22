import React, { useState } from "react";
import authService from "../services/authService";
import axios from "axios";
import { backendUrl } from "../../App";

const AuthExample = () => {
  const [testResult, setTestResult] = useState("");

  const handleManualRefresh = async () => {
    try {
      const newToken = await authService.manualRefresh();
      if (newToken) {
        console.log("Token refreshed manually:", newToken);
        window.showToast("Token refreshed successfully!", "success");
        setTestResult("✅ Manual refresh successful");
      }
    } catch (error) {
      console.error("Manual refresh failed:", error);
      setTestResult("❌ Manual refresh failed: " + error.message);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  const handleValidateToken = async () => {
    const currentToken = authService.getCurrentToken();
    if (currentToken) {
      const isValid = await authService.validateToken(currentToken);
      const message = isValid ? "Token is valid" : "Token is invalid";
      window.showToast(message, isValid ? "success" : "error");
      setTestResult(message);
    } else {
      window.showToast("No token found", "error");
      setTestResult("❌ No token found");
    }
  };

  const handleTestAPI = async () => {
    try {
      console.log("🧪 Testing API call...");
      const response = await axios.get(`${backendUrl}/api/categories`);
      console.log("✅ API call successful:", response.status);
      setTestResult("✅ API call successful: " + response.status);
      window.showToast("API call successful!", "success");
    } catch (error) {
      console.error("❌ API call failed:", error);
      setTestResult("❌ API call failed: " + error.message);
      window.showToast("API call failed: " + error.message, "error");
    }
  };

  const handleTestRefreshEndpoint = async () => {
    try {
      console.log("🧪 Testing refresh endpoint directly...");
      const currentToken = authService.getCurrentToken();
      const response = await fetch("https://fashion-v1.runasp.net/api/Account/refresh-token", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Refresh endpoint response:", data);
        setTestResult("✅ Refresh endpoint works: " + JSON.stringify(data));
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ Refresh endpoint failed:", error);
      setTestResult("❌ Refresh endpoint failed: " + error.message);
    }
  };

  const handleClearToken = () => {
    localStorage.removeItem("token");
    setTestResult("🗑️ Token cleared from localStorage");
    window.showToast("Token cleared", "info");
  };

  const handleForce401 = async () => {
    try {
      console.log("🧪 Testing 401 scenario...");
      // Set an invalid token to force 401
      localStorage.setItem("token", "invalid-token-123");
      const response = await axios.get(`${backendUrl}/api/categories`);
      console.log("✅ API call successful:", response.status);
      setTestResult("✅ API call successful: " + response.status);
    } catch (error) {
      console.error("❌ API call failed:", error);
      setTestResult("❌ API call failed: " + error.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Auth Service Debug</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Current Token: {authService.getCurrentToken() ? 
            authService.getCurrentToken().substring(0, 20) + "..." : 
            "None"
          }
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={handleManualRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Manual Refresh
        </button>
        <button
          onClick={handleValidateToken}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          Validate Token
        </button>
        <button
          onClick={handleTestAPI}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
        >
          Test API Call
        </button>
        <button
          onClick={handleTestRefreshEndpoint}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
        >
          Test Refresh Endpoint
        </button>
        <button
          onClick={handleForce401}
          className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 text-sm"
        >
          Force 401 Error
        </button>
        <button
          onClick={handleClearToken}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
        >
          Clear Token
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Logout
        </button>
      </div>

      {testResult && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm font-mono">{testResult}</p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>Check browser console for detailed logs</p>
        <p>Backend URL: {backendUrl}</p>
      </div>
    </div>
  );
};

export default AuthExample;
