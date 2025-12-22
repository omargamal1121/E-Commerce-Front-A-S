import React, { useState, useContext, useEffect, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

const Profile = () => {
  const { token, backendUrl } = useContext(ShopContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

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
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Your profile photo has been updated successfully!");

        // تحديث user في localStorage
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const updatedUser = { ...storedUser, image: data.imageUrl }; // backend لازم يرجع الرابط
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // ⚡ تحديث الـ context (لو عندك setUser في ShopContext)
        if (typeof setUser === "function") {
          setUser(updatedUser);
        }

        // تحديث الـ preview عشان يظهر الصورة الجديدة فورًا
        setPreviewUrl(data.imageUrl);

        setImage(null);
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
    <motion.div
      className="w-[90%] sm:max-w-2xl m-auto mt-14 text-gray-800 mt-40"
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
      <div className="inline-flex items-center gap-2 mb-6 mt-10">
        <h1 className="text-3xl prata-regular">My Account</h1>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {user && (
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <div className="md:w-1/3">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden">
                  {previewUrl || user?.image ? (
                    <img
                      src={previewUrl || user?.image}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-medium">{user.name}</h2>
                <p className="text-gray-500">{user.email}</p>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {error && (
                <div className="w-full p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="w-full p-3 mb-4 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="block w-full py-2 px-4 text-center bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {previewUrl ? "Change Photo" : "Upload Photo"}
                </button>

                {previewUrl && (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`block w-full py-2 px-4 text-center border rounded transition-colors ${loading ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"}`}
                  >
                    {loading ? "Uploading..." : "Save Photo"}
                  </button>
                )}

                <Link
                  to="/orders"
                  className="block w-full py-2 px-4 text-center bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  My Orders
                </Link>

                <button
                  onClick={handleLogout}
                  className="block w-full py-2 px-4 text-center bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="md:w-2/3">
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-lg font-medium mb-4">Account Management</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/change-password"
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="mr-3 text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Change Password</h4>
                      <p className="text-sm text-gray-500">
                        Update your account password
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/change-email"
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="mr-3 text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Change Email</h4>
                      <p className="text-sm text-gray-500">
                        Update your email address
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/upload-photo"
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="mr-3 text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Upload Photo</h4>
                      <p className="text-sm text-gray-500">
                        Change your profile picture
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Profile;
