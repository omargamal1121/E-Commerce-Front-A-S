import React from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../../assets/assets";

// Reusable nav link with consistent styling
const SideLink = ({ to, icon, iconAlt, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50 ${
        isActive ? "bg-blue-50 text-blue-700" : "text-gray-700"
      }`
    }
  >
    {({ isActive }) => (
      <>
        {/* Active indicator bar */}
        <span
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r transition-colors ${
            isActive ? "bg-blue-600" : "bg-transparent"
          }`}
        />
        <img className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" src={icon} alt={iconAlt} />
        {label && <p>{label}</p>}
      </>
    )}
  </NavLink>
);

const SectionLabel = ({ children }) => (
  <div className="px-2 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 first:pt-2">
    {children}
  </div>
);

const Sidebar = ({ isOpen = false, onClose = () => {}, deliveryOnly = false }) => {
  // Build nav sections — shared between desktop and mobile
  const navSections = [
    {
      label: "Overview",
      items: [
        { to: "/", icon: assets.dashboard_icon, iconAlt: "Dashboard", label: "Dashboard" },
      ],
    },
    ...(!deliveryOnly
      ? [
          {
            label: "Catalog",
            items: [
              { to: "/add",      icon: assets.add_icon,        iconAlt: "Add product",    label: "Add Items" },
              { to: "/products", icon: assets.collection_icon, iconAlt: "Products list",  label: "Products" },
              { to: "/discounts",icon: assets.discount_icon,   iconAlt: "Discounts",      label: "Discounts" },
            ],
          },
          {
            label: "Collections",
            items: [
              { to: "/collections",       icon: assets.collection_icon, iconAlt: "Categories",      label: "Categories" },
              { to: "/sub-category",      icon: assets.collection_icon, iconAlt: "Subcategories",   label: "Subcategories" },
              { to: "/collection-manager",icon: assets.collection_icon, iconAlt: "Collections",     label: "Collections" },
            ],
          },
        ]
      : []),
    {
      label: "Operations",
      items: [
        { to: "/orders", icon: assets.order_icon, iconAlt: "Orders", label: "Orders" },
        ...(!deliveryOnly
          ? [
              { to: "/users",            icon: assets.users_icon, iconAlt: "Users",            label: "Users" },
              { to: "/admin-operations", icon: assets.order_icon, iconAlt: "Admin operations", label: "Admin Operations" },
            ]
          : []),
      ],
    },
    ...(!deliveryOnly
      ? [
          {
            label: "Settings",
            items: [
              { to: "/settings", icon: assets.settings_icon, iconAlt: "Settings", label: "Settings" },
            ],
          },
        ]
      : []),
  ];

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <div className="hidden md:block w-[18%] min-h-screen border-r border-gray-200 bg-white sticky top-14 overflow-y-auto">
        <div className="flex flex-col gap-1 pt-4 px-3 text-[15px]">
          {navSections.map((section) => (
            <React.Fragment key={section.label}>
              <SectionLabel>{section.label}</SectionLabel>
              {section.items.map((item) => (
                <SideLink key={item.to} {...item} />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Mobile drawer ────────────────────────────────────── */}
      <div
        className={`${isOpen ? "fixed" : "hidden"} inset-0 z-50 md:hidden`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        {/* Panel */}
        <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 p-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm text-gray-600 px-2">Menu</div>
            <button
              className="p-2 rounded hover:bg-gray-100"
              onClick={onClose}
              aria-label="Close navigation menu"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-1 text-[15px]">
            {navSections.map((section) => (
              <React.Fragment key={section.label}>
                <SectionLabel>{section.label}</SectionLabel>
                {section.items.map((item) => (
                  <SideLink key={item.to} {...item} onClick={onClose} />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
