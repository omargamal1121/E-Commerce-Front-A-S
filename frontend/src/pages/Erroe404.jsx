import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const Erroe404 = () => {
  const navigate = useNavigate();
  const { getProducts } = useContext(ShopContext);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (retrying) return;
    try {
      setRetrying(true);
      await getProducts();
    } catch (e) {
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0b] text-white px-6">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-5xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-300 mb-8">
          We couldn’t connect to our servers right now. Please check your internet
          connection or try again in a moment.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="bg-white text-black px-6 py-3 rounded-md font-medium hover:bg-gray-200 transition disabled:opacity-60"
            onClick={handleRetry}
            disabled={retrying}
          >
            {retrying ? "Retrying..." : "Retry"}
          </button>

          <button
            className="border border-white px-6 py-3 rounded-md font-medium hover:bg-white hover:text-black transition"
            onClick={() => navigate("/", { replace: true })}
          >
            Back to Home
          </button>
        </div>

        <div className="mt-10 text-sm text-gray-400">
          <p>Error code: 404 / Service Unavailable</p>
        </div>
      </div>
    </div>
  );
};

export default Erroe404;


