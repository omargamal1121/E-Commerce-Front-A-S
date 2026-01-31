import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../../App";
import { useParams, useLocation, useNavigate } from "react-router-dom";

// Import components
import AddCollection from "../../components/collections/AddCollection";
import ViewCollection from "../../components/collections/ViewCollection";
import ListCollection from "../../components/collections/ListCollection";

const CollectionManager = ({ token }) => {
  const { collectionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const [activeTab, setActiveTab] = useState("list");
  const [hasInitializedFromUrl, setHasInitializedFromUrl] = useState(false);
  const [collections, setCollections] = useState([]);

  // edit collection states
  const [editMode, setEditMode] = useState(false);
  const [editCollectionId, setEditCollectionId] = useState(null);

  // search states for ViewCollection
  const [searchId, setSearchId] = useState(collectionId || "");
  const [searchActive, setSearchActive] = useState(
    searchParams.get("isActive") || ""
  );
  const [searchDeleted, setSearchDeleted] = useState(
    searchParams.get("includeDeleted") || ""
  );

  // Fetch collections
  const fetchCollections = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/Collection`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const cols = res.data?.responseBody?.data || [];
      setCollections(cols);

      console.log(
        "📌 Available collections:",
        cols.map((c) => ({ id: c.id, name: c.name }))
      );
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast.error("Error fetching collections");
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("Please login again.");
      return;
    }
    fetchCollections();
  }, [token]);

  // Update search states when URL parameters change
  useEffect(() => {
    if (collectionId && !hasInitializedFromUrl) {
      setSearchId(collectionId);

      if (location.pathname.includes("/edit/")) {
        setEditMode(true);
        setEditCollectionId(Number(collectionId));
        setActiveTab("add");
      } else if (location.pathname.includes("/view/")) {
        setActiveTab("collection-view");
      } else {
        setActiveTab("list");
      }

      setHasInitializedFromUrl(true);
    }
    if (searchParams.get("isActive")) {
      setSearchActive(searchParams.get("isActive"));
    }
    if (searchParams.get("includeDeleted")) {
      setSearchDeleted(searchParams.get("includeDeleted"));
    }
  }, [
    collectionId,
    searchParams,
    hasInitializedFromUrl,
    location.pathname,
    token,
  ]);

  // ✅ Handle Edit Collection
  const handleEditCollection = (col) => {
    if (col) {
      setEditMode(true);
      setEditCollectionId(col.id);
      setActiveTab("add");
      navigate(`/collection/edit/${col.id}`);
    } else {
      setEditMode(false);
      setEditCollectionId(null);
      setActiveTab("add");
      navigate(`/collection-manager`);
    }
  };

  // ✅ Handle View Collection
  const handleViewCollection = (col) => {
    setSearchId(col.id);
    setSearchActive(col.isActive ? "true" : "false");
    setSearchDeleted(col.isDeleted ? "true" : "false");
    setActiveTab("collection-view");
    navigate(`/collection/view/${col.id}`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Collections
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Group products into collections for display on your store
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {[
              { id: "list", label: "Collection List", icon: "📋" },
              { id: "collection-view", label: "View Collection", icon: "🔍" },
              { id: "add", label: editMode ? "Edit" : "Add Collection", icon: editMode ? "✏️" : "➕" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "add" && !editMode) handleEditCollection(null);
                  if (tab.id === "list") navigate('/collection-manager');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/category')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            ← Back to Categories
          </button>
        </div>
      </div>

      {/* Quick Access Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 group focus-within:border-rose-300 transition-colors">
        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-focus-within:bg-rose-600 group-focus-within:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="number"
          placeholder="Enter Collection ID..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm font-medium"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchId) navigate(`/collection/view/${searchId}`);
          }}
        />
        <div className="flex gap-2">
          <select
            value={searchActive}
            onChange={(e) => setSearchActive(e.target.value)}
            className="p-1.5 text-[10px] font-black uppercase bg-gray-50 border-none rounded-lg focus:ring-0"
          >
            <option value="">Status: All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button
            onClick={() => {
              if (!searchId) return toast.error("Enter collection ID");
              setActiveTab("collection-view");
              navigate(`/collection/view/${searchId}`);
            }}
            className="px-4 py-1.5 bg-gray-900 border border-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors"
          >
            View
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden min-h-[600px] transition-all duration-300">
        <div className="p-1">
          {activeTab === "add" && (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
              <AddCollection
                token={token}
                fetchCollections={fetchCollections}
                setActiveTab={setActiveTab}
                editCollectionMode={editMode}
                editCollectionId={editCollectionId}
              />
            </div>
          )}

          {activeTab === "list" && (
            <div className="p-2 md:p-4">
              <ListCollection
                token={token}
                collections={collections}
                setCollections={setCollections}
                setActiveTab={setActiveTab}
                handleEditCollection={handleEditCollection}
                handleViewCollection={handleViewCollection}
              />
            </div>
          )}

          {activeTab === "collection-view" && (
            <div className="p-4 md:p-8">
              <div className="mb-8 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-black text-gray-900">Collection Details</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Viewing Collection ID: {searchId || "Pending Input"}</p>
              </div>

              <ViewCollection
                token={token}
                collectionId={searchId}
                isActive={
                  searchActive === "true" ? true : searchActive === "false" ? false : null
                }
                includeDeleted={
                  searchDeleted === "true" ? true : searchDeleted === "false" ? false : null
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionManager;
