import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { backendUrl } from "../../App";
import { FaSync } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ViewCollection = ({ token, collectionId, isActive, includeDeleted }) => {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const navigate = useNavigate();

  const fetchCollection = useCallback(async () => {
    if (!collectionId) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/api/Collection/${collectionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            isActive: isActive?.toString(),
            includeDeleted: includeDeleted?.toString(),
          },
        }
      );

      if (response.status === 200) {
        setCollection(response.data?.responseBody?.data || null);
        setError(null);
      } else {
        setError("Unexpected status code: " + response.status);
      }
    } catch (err) {
      console.error("❌ Error fetching collection:", err);
      if (err.response) {
        console.error("❌ API error response:", err.response.data);
        const status = err.response.status;
        if (status === 404) setError("Collection not found.");
        else if (status === 500) setError("Server error. Try later.");
        else setError(err.response.data?.message || "Error fetching collection.");
      } else {
        setError(err.message || "Network error.");
      }
    } finally {
      setLoading(false);
    }
  }, [collectionId, isActive, includeDeleted, token]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchCollection();
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      // Turn off auto-refresh
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      setAutoRefresh(false);
    } else {
      // Turn on auto-refresh - refresh every 10 seconds
      const interval = setInterval(() => {
        fetchCollection();
      }, 10000);
      setRefreshInterval(interval);
      setAutoRefresh(true);
    }
  };

  useEffect(() => {
    if (collectionId) fetchCollection();

    // Clean up interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [collectionId, isActive, includeDeleted, fetchCollection, refreshInterval]);

  if (!collectionId)
    return <div className="p-4">Enter collection ID to search.</div>;
  if (loading) return <div className="p-4">Loading collection details...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!collection) return <div className="p-4">No collection found.</div>;

  const images = Array.isArray(collection.images) ? collection.images : [];
  const mainImage = images.find((img) => img.isMain) || images[0] || null;
  const safeSelected = images[selectedImageIndex] ? selectedImageIndex : 0;

  return (
    <div className="p-4 sm:p-6 bg-white shadow-lg rounded-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-800">
          Collection Details: {collection.name}
        </h2>
        <div className="flex items-center mt-3 md:mt-0 space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium transition-colors shadow-sm"
            disabled={loading}
          >
            <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={toggleAutoRefresh}
            className={`px-4 py-2 text-white rounded-md text-sm font-medium transition-colors shadow-sm flex items-center ${autoRefresh ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {autoRefresh ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Stop Auto-refresh
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Auto-refresh
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">Collection Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-gray-600 font-medium w-32">ID:</span>
                <span className="text-gray-800">{collection.id}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 font-medium w-32">Display Order:</span>
                <span className="text-gray-800">{collection.displayOrder}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-600 font-medium w-32 mt-1">Status:</span>
                <div className="flex flex-col gap-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${collection.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {collection.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {(collection.isDeleted || collection.deletedAt) && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium w-fit bg-gray-100 text-gray-800">
                      Deleted
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-gray-600 font-medium w-32">Created:</span>
                <span className="text-gray-800">{new Date(collection.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 font-medium w-32">Modified:</span>
                <span className="text-gray-800">{new Date(collection.modifiedAt).toLocaleString()}</span>
              </div>
              {collection.deletedAt && (
                <div className="flex items-center">
                  <span className="text-gray-600 font-medium w-32 text-red-600">Deleted At:</span>
                  <span className="text-red-600 font-medium">{new Date(collection.deletedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-sm">
          <h4 className="text-gray-600 font-medium mb-2">Description</h4>
          <p className="text-gray-800">{collection.description || 'No description provided'}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">Collection Images</h3>

        {images.length > 0 ? (
          <div className="mb-8">
            {/* Main Image Display (like product) */}
            <div className="mb-4">
              <div className="relative bg-gray-50 rounded-lg p-4 group">
                {images[safeSelected] ? (
                  <img
                    src={images[safeSelected].url}
                    alt={`${collection.name} - Image ${safeSelected + 1}`}
                    className="w-full max-w-md mx-auto h-80 object-contain rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full max-w-md mx-auto h-80 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg">
                    No Image Available
                  </div>
                )}

                {/* Image Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="text-center mt-2 text-sm text-gray-600">
                  Image {safeSelected + 1} of {images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all ${safeSelected === idx ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <button
                      onClick={() => setSelectedImageIndex(idx)}
                      className="w-full h-20 block"
                    >
                      <img
                        src={img.url}
                        alt={`${collection.name} thumbnail ${idx + 1}`}
                        className="w-full h-20 object-cover"
                      />
                    </button>
                    {img.isMain && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                        Main
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">No images available for this collection.</div>
        )}
      </div>

      {/* Products within the collection */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">Products in this Collection</h3>
        {(() => {
          // Support multiple shapes for products list from API
          const products =
            collection.products ||
            collection.productList ||
            collection.items ||
            [];
          if (!Array.isArray(products) || products.length === 0) {
            return <p className="text-gray-500">No products associated with this collection.</p>;
          }

          return (
            <div className="overflow-x-auto bg-white rounded shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((p, i) => {
                    const dp = Number(
                      (p.discount && (p.discount.discountPercent ?? p.discount.percentage)) ??
                      p.discountPercentage ??
                      p.discountPrecentage ??
                      0
                    );
                    const hasDiscount = !Number.isNaN(dp) && dp > 0;
                    const basePrice = Number(p.price || 0);
                    const serverFinal = p.finalPrice != null ? Number(p.finalPrice) : null;
                    const finalPrice = hasDiscount
                      ? (serverFinal != null && !Number.isNaN(serverFinal)
                        ? serverFinal
                        : basePrice * (1 - dp / 100))
                      : basePrice;
                    const imgUrl =
                      p.images?.find((img) => img.isMain)?.url || p.images?.[0]?.url || p.mainImage?.url;
                    return (
                      <tr key={p.id || i}>
                        <td className="px-4 py-2">{p.id}</td>
                        <td className="px-4 py-2">
                          {imgUrl ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/products/${p.id}`)}
                              className="focus:outline-none"
                              title="View Product"
                            >
                              <img src={imgUrl} alt={p.name} className="w-12 h-12 object-cover rounded hover:opacity-90" />
                            </button>
                          ) : (
                            <span className="text-gray-400">No Image</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/products/${p.id}`)}
                              className="text-left text-blue-700 hover:underline"
                              title="View Product Details"
                            >
                              {p.name}
                            </button>
                            {hasDiscount && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">{dp}% OFF</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {hasDiscount ? (
                            <div className="font-semibold">
                              <span className="line-through text-gray-500 mr-2">${basePrice.toFixed(2)}</span>
                              <span className="text-green-700">${finalPrice.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="font-semibold">${basePrice.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          {autoRefresh ? 'Auto-refreshing every 10 seconds' : 'Click refresh to update data'}
        </p>
      </div>
    </div>
  );
};

export default ViewCollection;