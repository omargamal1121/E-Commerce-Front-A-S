import React from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../../assets/assets";

const Sidebar = ({ isOpen = false, onClose = () => { }, deliveryOnly = false }) => {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block w-[18%] min-h-screen border-r border-gray-200 bg-white sticky top-14">
        <div className="flex flex-col gap-1 pt-4 px-3 text-[15px]">
          <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Overview</div>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`
            }
          >
            <span className={({ isActive }) => ''} />
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-transparent group-[.active]:bg-blue-600" />
            <img
              className="w-5 h-5 sm:w-6 sm:h-6"
              src={assets.dashboard_icon}
              alt="dashboard"
            />
            <p className="hidden sm:block">Dashboard</p>
          </NavLink>

          <div className="px-2 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Catalog</div>
          <NavLink
            to="/add"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`
            }
          >
            <img
              className="w-5 h-5 sm:w-6 sm:h-6"
              src={assets.add_icon}
              alt="logo"
            />
            <p className="hidden sm:block">Add Items</p>
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`
            }
          >
            <img
              className="w-5 h-5 sm:w-6 sm:h-6"
              src={assets.collection_icon}
              alt="logo"
            />
            <p className="hidden sm:block">Products</p>
          </NavLink>
          <NavLink
            to="/discounts"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`
            }
          >
            <img
              className="w-5 h-5 sm:w-6 sm:h-6"
              src={assets.discount_icon}
              alt="discount"
            />
            <p className="hidden sm:block">Discounts</p>
          </NavLink>

          {/* Bulk Discount merged into Discounts page (tab). Link removed. */}

          <div className="px-2 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Collections</div>
          <NavLink
            to="/collections"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`
            }
          >
            <img
              className="w-5 h-5 sm:w-6 sm:h-6"
              src={assets.collection_icon}
              alt="logo"
            />
            <p className="hidden sm:block">Categories</p>
          </NavLink>

          <NavLink
            to="/sub-category"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`
            }
          >
            <img
              className="w-5 h-5 sm:w-6 sm:h-6"
              src={assets.collection_icon}
              alt="subcategories"
            />
            <p className="hidden sm:block">Subcategories</p>
          </NavLink>

          <NavLink
            to="/collection-manager"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`
            }
          >
            <img
              className="w-5 h-5 sm:w-6 sm:h-6"
              src={assets.collection_icon}
              alt="collection"
            />
            <p className="hidden sm:block">Collections</p>
          </NavLink>

          <div className="px-2 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Operations</div>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`
            }
          >
            <img
              className="w-5 h-5 sm:w-6 sm:h-6"
              src={assets.order_icon}
              alt="logo"
            />
            <p className="hidden sm:block">Orders</p>
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`
            }
          >
            <img
              className="w-5 h-5 sm:w-6 sm:h-6"
              src={assets.users_icon}
              alt="users"
            />
            <p className="hidden sm:block">Users</p>
          </NavLink>
          <NavLink
            to="/admin-operations"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`
            }
          >
            <img
              className="w-5 h-5 sm:w-6 sm:h-6"
              src={assets.order_icon}
              alt="admin operations"
            />
            <p className="hidden sm:block">Admin Operations</p>
          </NavLink>
          <div className="px-2 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Settings</div>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`
            }
          >
            <img
              className="w-5 h-5 sm:w-6 sm:h-6"
              src={assets.settings_icon}
              alt="settings"
            />
            <p className="hidden sm:block">Settings</p>
          </NavLink>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`${isOpen ? 'fixed' : 'hidden'} inset-0 z-50 md:hidden`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        {/* Panel */}
        <div className={`absolute left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 p-3 overflow-y-auto`}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm text-gray-600 px-2">Menu</div>
            <button className="p-2 rounded hover:bg-gray-100" onClick={onClose} aria-label="Close sidebar">✕</button>
          </div>
          <div className="flex flex-col gap-1 text-[15px]">
            {/* Duplicate the same nav as desktop */}
            <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Overview</div>
            <NavLink
              to="/"
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
                }`
              }
            >
              <img className="w-5 h-5" src={assets.dashboard_icon} alt="dashboard" />
              <p>Dashboard</p>
            </NavLink>

            {!deliveryOnly && <div className="px-2 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Catalog</div>}
            {!deliveryOnly && <NavLink to="/add" onClick={onClose} className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
              <img className="w-5 h-5" src={assets.add_icon} alt="add" />
              <p>Add Items</p>
            </NavLink>}
            {!deliveryOnly && <NavLink to="/products" onClick={onClose} className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
              <img className="w-5 h-5" src={assets.collection_icon} alt="products" />
              <p>Products</p>
            </NavLink>}
            {!deliveryOnly && <NavLink to="/discounts" onClick={onClose} className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
              <img className="w-5 h-5" src={assets.discount_icon} alt="discounts" />
              <p>Discounts</p>
            </NavLink>}

            {!deliveryOnly && <div className="px-2 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Collections</div>}
            {!deliveryOnly && <NavLink to="/collections" onClick={onClose} className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
              <img className="w-5 h-5" src={assets.collection_icon} alt="categories" />
              <p>Categories</p>
            </NavLink>}
            {!deliveryOnly && <NavLink to="/sub-category" onClick={onClose} className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
              <img className="w-5 h-5" src={assets.collection_icon} alt="subcategories" />
              <p>Subcategories</p>
            </NavLink>}
            {!deliveryOnly && <NavLink to="/collection-manager" onClick={onClose} className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
              <img className="w-5 h-5" src={assets.collection_icon} alt="collection manager" />
              <p>Collections</p>
            </NavLink>}

            <div className="px-2 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Operations</div>
            <NavLink to="/orders" onClick={onClose} className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
              <img className="w-5 h-5" src={assets.order_icon} alt="orders" />
              <p>Orders</p>
            </NavLink>
            {!deliveryOnly && <NavLink to="/users" onClick={onClose} className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
              <img className="w-5 h-5" src={assets.users_icon} alt="users" />
              <p>Users</p>
            </NavLink>}
            {!deliveryOnly && <NavLink to="/admin-operations" onClick={onClose} className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
              <img className="w-5 h-5" src={assets.order_icon} alt="admin operations" />
              <p>Admin Operations</p>
            </NavLink>}

            <div className="px-2 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Settings</div>
            {!deliveryOnly && <NavLink to="/settings" onClick={onClose} className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
              <img className="w-5 h-5" src={assets.settings_icon} alt="settings" />
              <p>Settings</p>
            </NavLink>}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
