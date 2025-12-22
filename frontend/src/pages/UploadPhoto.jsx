import React, { useState, useContext, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const UploadPhoto = () => {
  const { backendUrl, token } = useContext(ShopContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.match("image.*")) {
        setError("Please select an image file (JPEG, PNG, etc.)");
        return;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError("");
    }
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

    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch(`${backendUrl}/api/Account/upload-photo`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type here, it will be set automatically with the boundary
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Your profile photo has been updated successfully!");

        // تحديث user في localStorage
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const updatedUser = { ...storedUser, image: data.imageUrl }; // backend لازم يرجع رابط الصورة
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // 👇 إعادة تحميل الصفحة عشان Profile.jsx يقرأ الصورة الجديدة
        window.location.reload();
      } else {
        setError(
          data.responseBody?.message ||
            data.message ||
            "Failed to upload photo. Please try again."
        );
      }
    } catch (err) {
      console.error("Upload photo error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
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
        Upload a new profile photo. Supported formats: JPEG, PNG. Max size: 5MB.
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
        accept="image/*"
        className="hidden"
      />

      {/* Image preview */}
      {previewUrl && (
        <div className="w-full flex justify-center my-4">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-40 h-40 object-cover rounded-full border-2 border-gray-300"
          />
        </div>
      )}

      {/* Custom file upload button */}
      <button
        type="button"
        onClick={triggerFileInput}
        className="w-full font-light py-2 px-8 border border-gray-400 text-gray-700 hover:bg-gray-100 transition-all duration-300 cursor-pointer"
      >
        {previewUrl ? "Change Photo" : "Select Photo"}
      </button>

      <button
        type="submit"
        disabled={loading || !image}
        className={`w-full font-light py-2 px-8 mt-4 border border-black transition-all duration-300 cursor-pointer ${loading || !image ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-black text-white hover:bg-white hover:text-black"}`}
      >
        {loading ? "Uploading..." : "Upload Photo"}
      </button>
    </motion.form>
  );
};

export default UploadPhoto;
