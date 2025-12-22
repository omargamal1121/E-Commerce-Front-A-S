import React, { useState, useEffect, useContext } from 'react';
import { assets } from '../assets/frontend_assets/assets.js'
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';

const HeroBanner = ({ collectionId  }) => {
  const { backendUrl } = useContext(ShopContext);
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch collection data
  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch collection details (includes images array)
        const collectionResponse = await axios.get(`${backendUrl}/api/Collection/${collectionId}`);
        
        if (collectionResponse.data?.responseBody?.data) {
          const collectionData = collectionResponse.data.responseBody.data;
          setCollection(collectionData);
        }
      } catch (err) {
        console.error('Error fetching collection data:', err);
        setError('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    if (collectionId) {
      fetchCollectionData();
    }
  }, [collectionId, backendUrl]);

  // Normalize image URL (handles absolute Cloudinary URLs and relative backend paths)
  const resolveImageUrl = (url) => {
    if (!url) return null;
    const lower = String(url).toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${backendUrl}${url}`;
    return url;
  };

  const isValidUrl = (url) => {
    try {
      if (!url) return false;
      // Allow data/blob/http/https
      return /^(https?:|data:|blob:)/i.test(String(url));
    } catch { return false; }
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative w-full h-[400px] md:h-[520px] flex items-center justify-center bg-gray-200">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="text-gray-600">Loading collection...</span>
        </div>
      </div>
    );
  }

  // Error state - fallback to default banner
  if (error || !collection) {
    return (
      <div
        className="relative w-full h-[400px] md:h-[520px] flex items-center justify-center"
        style={{
          backgroundImage: `url(${assets.hero_banner_img})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <div className="relative z-10 flex flex-col items-center text-center text-white">
          <span className="tracking-widest text-sm mb-2">New Arrivals</span>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Shop Now</h1>
          <Link to="/collection">
            <button className="bg-white text-black px-6 py-2 font-semibold hover:bg-gray-200 transition">
              SHOP NOW
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Get main image from collection images array
  const rawBackgroundImage =
    collection?.images?.find((img) => img.isMain === true)?.url ||
    collection?.images?.[0]?.url ||
    assets.hero_banner_img;
  const backgroundImage = resolveImageUrl(rawBackgroundImage);

  // Debug logs to help diagnose missing image issues
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[HeroBanner] collection:', collection);
    // eslint-disable-next-line no-console
    console.log('[HeroBanner] rawBackgroundImage:', rawBackgroundImage, 'resolved:', backgroundImage);
    // eslint-disable-next-line no-console
    console.log('[HeroBanner] main image found:', collection?.images?.find((img) => img.isMain === true));
  }

  return (
    <div
      className="relative w-full h-[400px] md:h-[520px] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <img
        src={isValidUrl(backgroundImage) ? backgroundImage : assets.hero_banner_img}
        alt="Collection Background"
        className="absolute inset-0 w-full h-full object-cover object-center z-0"
        onError={(e) => {
          console.error('[HeroBanner] Image failed to load, using fallback');
          e.target.src = assets.hero_banner_img;
        }}
        onLoad={() => console.log('[HeroBanner] Image loaded successfully')}
      />
      
      {/* Overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/30 bg-opacity-40 z-10"></div>
      
      <div className="relative z-20 flex flex-col items-center text-center text-white">
        <span className="tracking-widest text-sm mb-2">Collection</span>
        <h1 className="text-3xl md:text-5xl font-bold mb-6 drop-shadow-lg">
          {collection.name || 'Shop Now'}
        </h1>
        <Link to={`/collection-products/${collectionId}`}>
          <button className="relative overflow-hidden bg-transparent text-white px-8 py-3 border border-white font-semibold shadow-lg transition-colors duration-300 group">
            <span className="relative z-10 transition-colors duration-300 group-hover:text-black">
              SHOP COLLECTION
            </span>
            <span className="absolute inset-0 bg-white transform translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0"></span>
          </button>
        </Link>
      </div>
    </div>
  );
};

export default HeroBanner;