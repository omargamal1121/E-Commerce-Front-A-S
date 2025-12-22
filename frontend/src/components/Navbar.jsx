import React, { useContext, useState, useEffect, useRef } from "react";
import { assets } from "../assets/frontend_assets/assets";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import SmallNavbar from "./SmallNavbar";

const Navbar = () => {
  const { backendUrl } = useContext(ShopContext);
  const [visible, setvisible] = useState(false);
  const navigate = useNavigate();
  const context = useContext(ShopContext);
  const setShowSearch = context?.setShowSearch;
  const getCartCount = context?.getCartCount;
  const getWishlistCount = context?.getWishlistCount;
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const [hoveredCategoryId, setHoveredCategoryId] = useState(null);

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // 🔹 لإدارة القائمة
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);

    // 🔹 إغلاق القائمة عند الضغط برّه
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    setUser(null);
    navigate("/login");
  };

  // const toggleLanguage = () => {
  //   i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");
  // };

  const [categories, setCategories] = useState([]);
  const [categorySubcategories, setCategorySubcategories] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `${backendUrl}/api/categories?isActive=true&isDeleted=false&page=1&pageSize=50`
        );
        const data = await res.json();

        // Get categories from responseBody
        if (Array.isArray(data.responseBody?.data)) {
          // Set categories directly from API response
          setCategories(data.responseBody.data);
        } else {
          setCategories([]); // fallback to prevent errors
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, [backendUrl]);

  useEffect(() => {
    const fetchCategoriesWithSubcategories = async () => {
      try {
        const promises = categories.map(async (category) => {
          const categoryRes = await fetch(
            `${backendUrl}/api/categories/${category.id}?isActive=true&includeDeleted=false`
          );
          const categoryData = await categoryRes.json();

          // Get subcategories from category detail response
          if (categoryData.responseBody?.data?.subCategories) {
            return {
              [category.id]:
                categoryData.responseBody.data.subCategories.filter(
                  (sub) => sub.isActive
                ),
            };
          }
          return { [category.id]: [] };
        });

        const subcategories = await Promise.all(promises);
        const mergedSubcategories = subcategories.reduce(
          (acc, curr) => ({ ...acc, ...curr }),
          {}
        );

        setCategorySubcategories(mergedSubcategories);
      } catch (err) {
        console.error("Error fetching categories with subcategories:", err);
        setCategorySubcategories({});
      }
    };

    if (categories.length > 0) {
      fetchCategoriesWithSubcategories();
    }
  }, [categories, backendUrl]);

  const navbarVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      {/* Small Navbar at the top */}
      <SmallNavbar />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={navbarVariants}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`w-full transition-all duration-300 ${scrolled ? "shadow-md" : ""
          } border-b border-gray-300 flex items-center py-3 font-medium px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw]
        relative `}
      >
        {/* Background animation overlay */}
        <div
          className="absolute inset-0 bg-white z-[-1] transition-all duration-500"
          style={{
            transform: `translateY(${scrolled || hovered ? "0%" : "-100%"})`,
          }}
        />

        {/* --- الروابط الرئيسية --- */}
        <ul
          className={`hidden sm:flex gap-5 text-sm ${scrolled || hovered ? "text-gray-700" : "text-white"
            } flex-1`}
        >
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 group ${isActive ? "font-bold" : ""
              }`
            }
          >
            <p>{t("HOME")}</p>
            <span className="w-2/4 h-[2px] transition-all duration-300 bg-gray-700 group-hover:w-full group-hover:bg-gray-300 group-hover:opacity-100 opacity-0"></span>
          </NavLink>

          <div className="relative group">
            <NavLink
              to="/collection"
              className="flex items-center gap-1 focus:outline-none"
            >
              SHOP <span className="ml-1">&#9662;</span>
            </NavLink>

            {/* Menu */}
            <div className="absolute left-1/2 -translate-x-1/3 mt-2 w-80 bg-white shadow-lg z-[100] opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200">
              <ul className="flex flex-col py-2">
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((cat) => (
                    <li
                      key={cat.id}
                      className="relative"
                      onMouseEnter={() => setHoveredCategoryId(cat.id)}
                      onMouseLeave={() => setHoveredCategoryId(null)}
                    >
                      <Link
                        to={`/category/${cat.id}`}
                        className="block px-6 py-3 hover:bg-gray-100 cursor-pointer text-gray-700 font-medium transition-colors duration-150"
                      >
                        <div className="flex justify-between items-center">
                          <span>{cat.name}</span>
                        </div>
                      </Link>

                      {/* Subcategories */}
                      {Array.isArray(categorySubcategories[cat.id]) &&
                        categorySubcategories[cat.id].length > 0 && (
                          <ul
                            className={`absolute left-full top-0 w-64 bg-white shadow-lg transition-all duration-200 z-50 ${hoveredCategoryId === cat.id
                              ? "opacity-100 visible"
                              : "opacity-0 invisible"
                              }`}
                          >
                            {categorySubcategories[cat.id].map((sub) => (
                              <li key={sub.id}>
                                <Link
                                  to={`/subcategory/${sub.id}`}
                                  className="block px-6 py-3 hover:bg-gray-100 cursor-pointer text-gray-700 transition-colors duration-150"
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                    </li>
                  ))
                ) : (
                  <li className="px-6 py-3 text-gray-500">
                    No categories available
                  </li>
                )}
              </ul>
            </div>
          </div>

          <NavLink
            to="/policy"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 group ${isActive ? "font-bold" : ""
              }`
            }
          >
            <p>{t("POLICY")}</p>
            <span className="w-2/4 h-[2px] transition-all duration-300 bg-gray-700 group-hover:w-full group-hover:bg-gray-300 group-hover:opacity-100 opacity-0"></span>
          </NavLink>
        </ul>

        {/* --- اللوجو --- */}
        <div className="flex-1 flex justify-center">
          <Link to={"/"}>
            <img
              src={assets.logo}
              className={`w-20 transition-opacity duration-300 ${scrolled || hovered ? "opacity-100" : "opacity-0"
                }`}
              alt="ImgLogo"
              style={{ pointerEvents: scrolled || hovered ? "auto" : "none" }}
            />
          </Link>
        </div>

        {/* --- أيقونات يمين --- */}
        <div className="flex items-center gap-6 flex-1 justify-end">
          {/* البحث */}
          <img
            onClick={() => {
              setShowSearch(true);
              navigate("/collection");
            }}
            src={assets.search_icon}
            className="w-5 cursor-pointer"
            alt=""
          />

          {/* Wishlist */}
          <Link to="/wishlist" className="relative">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {getWishlistCount() > 0 && (
              <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-red-500 text-white aspect-square rounded-full text-[8px]">
                {getWishlistCount()}
              </p>
            )}
          </Link>

          {/* قائمة البروفايل */}
          <div className="relative z-50" ref={profileRef}>
            {user ? (
              <>
                <img
                  src={assets.profile_icon}
                  className="w-5 cursor-pointer"
                  alt=""
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                />

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 transition-all duration-200">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Orders
                    </Link>
                    <Link
                      to="/change-email"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Change Email
                    </Link>
                    <Link
                      to="/change-password"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Change Password
                    </Link>
                    <Link
                      to="/upload-photo"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Upload Photo
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login">
                <img
                  src={assets.profile_icon}
                  className="w-5 cursor-pointer"
                  alt=""
                />
              </Link>
            )}
          </div>

          {/* عربة التسوق */}
          <Link to="/cart" className="relative">
            <img src={assets.cart_icon} className="w-5 min-w-5" alt="" />
            <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]">
              {getCartCount()}
            </p>
          </Link>

          {/* القائمة للموبايل */}
          <img
            src={assets.menu_icon}
            className="w-5 cursor-pointer sm:hidden"
            alt=""
            onClick={() => setvisible(true)}
          />
        </div>

        {/* Sidebar menu for small screen */}
        <div
          className={`absolute top-0 right-0 bottom-0 bg-white h-screen transition-all ${visible ? "w-full" : "w-0"
            }`}
        >
          <div className="flex flex-col text-gray-600">
            <div
              onClick={() => setvisible(false)}
              className="flex items-center gap-4 p-3 cursor-pointer"
            >
              <img
                src={assets.dropdown_icon}
                className="h-4 rotate-180"
                alt=""
              />
              <p>Back</p>
            </div>
            <NavLink
              onClick={() => setvisible(false)}
              to="/"
              className="py-2 pl-6 border-b-2"
            >
              {t("HOME")}
            </NavLink>
            <NavLink
              onClick={() => setvisible(false)}
              to="/collection"
              className="py-2 pl-6 border-b-2"
            >
              {t("COLLECTION")}
            </NavLink>
            <NavLink
              onClick={() => setvisible(false)}
              to="/about"
              className="py-2 pl-6 border-b-2"
            >
              {t("ABOUT")}
            </NavLink>
            <NavLink
              onClick={() => setvisible(false)}
              to="/contact"
              className="py-2 pl-6 border-b-2"
            >
              {t("CONTACT")}
            </NavLink>
            <NavLink
              onClick={() => setvisible(false)}
              to="/policy"
              className="py-2 pl-6 border-b-2"
            >
              {t("POLICY")}
            </NavLink>
            <NavLink
              onClick={() => setvisible(false)}
              to="/wishlist"
              className="py-2 pl-6 border-b-2"
            >
              {t("WISHLIST")}
            </NavLink>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Navbar;
