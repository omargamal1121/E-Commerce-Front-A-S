import React, { useContext, useEffect, useState, useRef, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/frontend_assets/assets";
import ProductImage from "./common/ProductImage";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SearchBar = () => {
  const { t } = useTranslation();
  const context = useContext(ShopContext);
  const search = context?.search;
  const setSearch = context?.setSearch;
  const showSearch = context?.showSearch;
  const setShowSearch = context?.setShowSearch;
  const products = context?.products || [];
  const currency = context?.currency;

  const [visible, setVisible] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search || "");
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    // Show search bar on collection page or when showSearch is true
    if (location.pathname.includes("collection")) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [location]);

  // Auto-navigate to collection when user starts typing (optional enhancement)
  useEffect(() => {
    if (search && search.length >= 2 && !location.pathname.includes("collection")) {
      // Optional: Auto-navigate to collection page when user starts searching
      // Uncomment the line below if you want this behavior
      // navigate('/collection');
    }
  }, [search, location.pathname, navigate]);

  // Filter products based on search term
  const searchResults = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return [];

    const lowerSearch = debouncedSearch.toLowerCase();

    return products
      .filter((product) => {
        const nameMatch = product.name?.toLowerCase().includes(lowerSearch);
        const categoryMatch = product.category?.toLowerCase().includes(lowerSearch);
        const subcategoryMatch = product.subCategory?.toLowerCase().includes(lowerSearch);
        const descriptionMatch = product.description?.toLowerCase().includes(lowerSearch);

        return nameMatch || categoryMatch || subcategoryMatch || descriptionMatch;
      })
      .slice(0, 8); // Limit to 8 suggestions
  }, [debouncedSearch, products]);

  // Show/hide suggestions based on search results and focus
  useEffect(() => {
    setShowSuggestions(searchResults.length > 0 && debouncedSearch.length >= 2);
    setSelectedIndex(-1);
  }, [searchResults, debouncedSearch]);

  // Handle input change
  const handleInputChange = (e) => {
    setSearch(e.target.value);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (searchResults.length > 0 && debouncedSearch.length >= 2) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur (with delay to allow clicking on suggestions)
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleProductSelect(searchResults[selectedIndex]);
        } else {
          // Navigate to collection page with current search
          navigate('/collection');
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  // Handle product selection
  const handleProductSelect = (product) => {
    navigate(`/product/${product._id}`);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      // Navigate to collection page and ensure search is visible
      navigate('/collection');
      setShowSuggestions(false);
      // Keep the search bar open on collection page
      if (!location.pathname.includes('collection')) {
        setShowSearch(true);
      }
    }
  };

  // Handle "View All Results" click
  const handleViewAllResults = () => {
    navigate('/collection');
    setShowSuggestions(false);
    // Ensure search bar stays visible on collection page
    setShowSearch(true);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearch("");
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return showSearch && visible ? (
    <div className="mt-[90px] mb-5 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <div className="text-center relative">
        <form onSubmit={handleSearchSubmit} className="relative inline-block w-3/4 sm:w-1/2">
          <div className="inline-flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] px-5 py-2 mt-20 rounded-xl w-full relative shadow-sm">
            <input
              ref={searchInputRef}
              value={search || ""}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              className="flex-1 outline-none bg-inherit text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
              type="text"
              placeholder={t('SEARCH_PRODUCTS')}
              autoComplete="off"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="mr-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <img src={assets.cross_icon} className="w-3 nav-icon" alt="Clear" />
              </button>
            )}
            <button type="submit" className="focus:outline-none">
              <img src={assets.search_icon} className="w-4 nav-icon" alt="Search" />
            </button>
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 bg-[var(--surface)] border border-[var(--border)] rounded-b-2xl shadow-2xl z-50 max-h-96 overflow-y-auto"
            >
              {searchResults.map((product, index) => (
                <div
                  key={product._id}
                  className={`flex items-center p-3 hover:bg-[var(--surface-raised)] cursor-pointer border-b border-[var(--border)] last:border-b-0 transition-colors ${index === selectedIndex ? 'bg-[var(--surface-raised)]' : ''
                    }`}
                  onClick={() => handleProductSelect(product)}
                >
                  {/* Product Image */}
                  <div className="w-12 h-12 mr-3 flex-shrink-0">
                    <ProductImage
                      src={product.image?.[0]}
                      alt={product.name}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="text-sm font-medium text-[var(--text)] truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {product.category} {product.subCategory && `• ${product.subCategory}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {product.finalPrice && product.finalPrice < product.price ? (
                        <>
                          <span className="text-xs text-[var(--danger)] font-medium">
                            {currency}{product.finalPrice}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] line-through">
                            {currency}{product.price}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-[var(--text)] font-medium">
                          {currency}{product.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* View All Results */}
              <div
                className={`p-3 text-center border-t border-[var(--border)] bg-[var(--surface-raised)] cursor-pointer hover:opacity-90 transition-opacity ${selectedIndex === searchResults.length ? 'bg-[var(--surface-raised)]' : ''
                  }`}
                onClick={handleViewAllResults}
              >
                <span className="text-sm text-[var(--accent)] font-bold">
                  {t('VIEW_ALL_RESULTS')} ({searchResults.length}+)
                </span>
              </div>
            </div>
          )}
        </form>

        {/* Close Search Button */}
        <button
          onClick={() => setShowSearch(false)}
          className="inline-flex items-center justify-center p-1.5 ml-2 text-[var(--text-muted)] hover:text-[var(--text)] focus:outline-none"
          title="Close search"
        >
          <img
            src={assets.cross_icon}
            className="w-3.5 nav-icon"
            alt="Close"
          />
        </button>
      </div>
    </div>
  ) : (
    <div></div>
  );
};

export default SearchBar;
