import React, { useState, useContext, useRef, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  validateImageFile,
  compressImage,
  createImagePreview,
} from "../utils/uploadUtils";

const UploadPhoto = () => {
  const { backendUrl, token } = useContext(ShopContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const previewRevokeRef = useRef(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Clean up object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewRevokeRef.current) {
        previewRevokeRef.current();
      }
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate using centralized utility (formats + 5MB profile photo limit)
    const validation = validateImageFile(file, { isProfile: true });
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Revoke old preview URL if exists
    if (previewRevokeRef.current) {
      previewRevokeRef.current();
    }

    const preview = createImagePreview(file);
    previewRevokeRef.current = preview.revoke;

    setImage(file);
    setPreviewUrl(preview.url);
    setError("");
    setSuccess("");
    setUploadProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image) {
      setError("Please select an image to upload");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setUploadProgress(10);
    setStatusText("Optimizing profile photo...");

    try {
      // 1. Client-side compression tailored for avatar dimensions (800x800 max)
      const processedImage = await compressImage(image, {
        maxWidthOrHeight: 800,
        initialQuality: 0.85,
        fileType: "image/webp",
        useWebWorker: true,
      });

      setUploadProgress(35);
      setStatusText("Uploading image...");

      const formData = new FormData();
      formData.append("image", processedImage);

      // 2. Upload via Axios with progress events
      const response = await axios.patch(
        `${backendUrl}/api/Account/upload-photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                35 + (progressEvent.loaded / progressEvent.total) * 60
              );
              setUploadProgress(Math.min(percent, 95));
            }
          },
        }
      );

      const data = response.data;
      setUploadProgress(100);
      setStatusText("Completed!");
      setSuccess("Your profile photo has been updated successfully!");

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...storedUser, image: data.imageUrl };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Upload photo error:", err);
      const msg =
        err?.response?.data?.responseBody?.message ||
        err?.response?.data?.message ||
        "Failed to upload photo. Please try again.";
      setError(msg);
      setUploadProgress(0);
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
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
      <div className="inline-flex items-center gap-2 mb-2 mt-40">
        <p className="text-3xl prata-regular">Upload Photo</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>
      <p className="text-sm text-gray-600 w-full text-center">
        Supported formats: JPEG, PNG, WebP. Maximum size: 5MB.
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

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label="Upload profile photo"
      />

      {/* Image preview */}
      {previewUrl && (
        <div className="w-full flex justify-center my-4">
          <img
            src={previewUrl}
            alt="Profile preview"
            className="w-40 h-40 object-cover rounded-full border-2 border-gray-300 shadow-sm"
          />
        </div>
      )}

      {/* Upload Progress Bar */}
      {loading && (
        <div className="w-full my-2">
          <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
            <span>{statusText || "Processing..."}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-black h-2 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Custom file upload button */}
      <button
        type="button"
        onClick={triggerFileInput}
        disabled={loading}
        className="w-full font-light py-2 px-8 border border-gray-400 text-gray-700 hover:bg-gray-100 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black rounded"
      >
        {previewUrl ? "Change Photo" : "Select Photo"}
      </button>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading || !image}
        className={`w-full font-light py-2 px-8 mt-4 border border-black transition-all duration-300 rounded ${
          loading || !image
            ? "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300"
            : "bg-black text-white hover:bg-white hover:text-black cursor-pointer focus:ring-2 focus:ring-black"
        }`}
      >
        {loading ? "Uploading..." : "Upload Photo"}
      </button>
    </motion.form>
  );
};

export default UploadPhoto;
