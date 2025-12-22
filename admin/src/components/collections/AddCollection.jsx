import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";
import { useNavigate } from "react-router-dom";

const AddCollection = ({
  token,
  editCollectionMode = false,
  editCollectionId = null,
  fetchCollections,
  setCollections,
  setActiveTab,
}) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [images, setImages] = useState([]);
  const [mainImage, setMainImage] = useState(null);

  // For showing old images when editing
  const [oldImages, setOldImages] = useState([]);
  const [oldMainImage, setOldMainImage] = useState(null);

  const navigate = useNavigate();

  // Clean text helper
  const cleanText = (text) => text?.replace(/\s+/g, " ").trim();

  // Reset form
  const resetForm = () => {
    setName("");
    setDescription("");
    setDisplayOrder(1);
    setImages([]);
    setMainImage(null);
    setOldImages([]);
    setOldMainImage(null);
    setActiveTab && setActiveTab("collection-list");
  };

  // Fetch collection details when editing
  useEffect(() => {
    const fetchCollectionDetails = async () => {
      if (editCollectionMode && editCollectionId && token) {
        try {
          const res = await axios.get(
            `${backendUrl}/api/Collection/${editCollectionId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const col =
            res.data?.responseBody?.data || res.data?.data || res.data;
          setName(col.name || "");
          setDescription(col.description || "");
          setDisplayOrder(col.displayOrder || 1);

          if (col.images?.length > 0) {
            setOldImages(col.images.filter((img) => !img.isMain));
            setOldMainImage(col.images.find((img) => img.isMain));
          }
        } catch (err) {
          console.error("❌ Error fetching collection:", err);
          toast.error("Failed to load collection details");
        }
      }
    };

    fetchCollectionDetails();
  }, [editCollectionMode, editCollectionId, token]);

  // Add or Update Collection
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("You must log in first!");

    const cleanedName = cleanText(name);
    const cleanedDescription = cleanText(description);
    const cleanedOrder = Math.max(1, Number(displayOrder));

    // Validations
    if (!cleanedName || cleanedName.length < 3 || cleanedName.length > 50)
      return toast.error("Name must be 3-50 characters");
    if (
      !cleanedDescription ||
      cleanedDescription.length < 5 ||
      cleanedDescription.length > 200
    )
      return toast.error("Description must be 5-200 characters");

    setLoading(true);
    try {
      // JSON body (as required by API)
      const body = {
        name: cleanedName,
        description: cleanedDescription,
        displayOrder: cleanedOrder,
      };

      let response;
      let collectionId;

      if (editCollectionMode && editCollectionId) {
        // Update existing collection
        response = await axios.put(
          `${backendUrl}/api/Collection/${editCollectionId}`,
          body,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json-patch+json",
              Accept: "text/plain",
            },
          }
        );
        collectionId = editCollectionId;
        toast.success("Collection updated successfully!");
      } else {
        // Create new collection
        response = await axios.post(`${backendUrl}/api/Collection`, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json-patch+json",
            Accept: "text/plain",
          },
        });
        collectionId =
          response.data?.responseBody?.data?.id ||
          response.data?.data?.id ||
          response.data?.id;
        toast.success("Collection created successfully!");
      }

      // ✅ Upload main image if exists
      if (mainImage && collectionId) {
        const formData = new FormData();
        formData.append("Image", mainImage);

        await axios.put(
          // ← بدلناها من post إلى put
          `${backendUrl}/api/Collection/${collectionId}/main-image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Main image uploaded successfully!");
      }

      // ✅ Upload additional images if exists
      if (images.length > 0 && collectionId) {
        const formData = new FormData();
        images.forEach((img) => {
          formData.append("Images", img);
        });

        await axios.post(
          `${backendUrl}/api/Collection/${collectionId}/images`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Additional images uploaded successfully!");
      }

      // Reset form and update collections list
      resetForm();
      fetchCollections && fetchCollections();

      // Navigate to collection list
      setActiveTab && setActiveTab("collection-list");
    } catch (error) {
      console.error("Error:", error);
      const apiMsg =
        error.response?.data?.responseBody?.message ||
        error.response?.data?.responseBody?.errors?.messages?.[0] ||
        error.response?.data?.message ||
        error.message ||
        "Failed to save collection. Please try again.";
      toast.error(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages([...images, ...files]);
    }
  };

  // Handle main image selection
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
    }
  };

  // Remove image from selection
  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Remove main image
  const removeMainImage = () => {
    setMainImage(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {editCollectionMode ? "Edit Collection" : "Add New Collection"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Collection Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter collection name"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter collection description"
            rows="3"
            required
          ></textarea>
        </div>

        {/* Display Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Order
          </label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
          />
        </div>

        {/* Main Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Main Image
          </label>
          <input
            type="file"
            onChange={handleMainImageChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            accept="image/*"
          />

          {/* Preview main image */}
          {mainImage && (
            <div className="mt-2 relative inline-block">
              <img
                src={URL.createObjectURL(mainImage)}
                alt="Main Preview"
                className="h-24 w-24 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={removeMainImage}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          )}

          {/* Show old main image if editing */}
          {!mainImage && oldMainImage && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-1">Current Main Image:</p>
              <img
                src={oldMainImage.url}
                alt="Current Main"
                className="h-24 w-24 object-cover rounded-md"
              />
            </div>
          )}
        </div>

        {/* Additional Images Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Images
          </label>
          <input
            type="file"
            onChange={handleImageChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            accept="image/*"
            multiple
          />

          {/* Preview additional images */}
          {images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative inline-block">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Preview ${index}`}
                    className="h-24 w-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Show old images if editing */}
          {oldImages.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-1">Current Images:</p>
              <div className="flex flex-wrap gap-2">
                {oldImages.map((img, index) => (
                  <img
                    key={index}
                    src={img.url}
                    alt={`Current ${index}`}
                    className="h-24 w-24 object-cover rounded-md"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md mr-2 hover:bg-gray-400"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : editCollectionMode
                ? "Update Collection"
                : "Add Collection"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCollection;
