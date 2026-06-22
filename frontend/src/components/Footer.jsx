import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const context = useContext(ShopContext);
  const setShowSearch = context?.setShowSearch;
  const navigate = useNavigate();

  return (
    <footer className="bg-[#151515] text-white mt-24">
      <div className="px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw] pt-20 pb-10">

        {/* Top row: Support + Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* Support */}
          <div>
            <p className="uppercase tracking-widest text-xs text-gray-400 mb-4">Support</p>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <a
                  onClick={() => { setShowSearch(true); navigate("/collection"); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Search
                </a>
              </li>
              <li>
                <a href="/policy" className="hover:text-white transition-colors cursor-pointer">
                  Return &amp; Exchange Policy
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-white transition-colors cursor-pointer">
                  About
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white transition-colors cursor-pointer">
                  Contact Info
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="uppercase tracking-widest text-xs text-gray-400 mb-4">Newsletter</p>
            <div className="flex items-center bg-transparent border border-gray-600 focus-within:border-gray-300 transition-colors max-w-xl">
              <input
                type="email"
                placeholder="Email"
                className="flex-1 bg-transparent text-gray-200 placeholder-gray-400 px-4 py-3 focus:outline-none"
              />
              <button className="px-4 py-3 text-gray-300 hover:text-white" aria-label="Subscribe">
                →
              </button>
            </div>
          </div>

        </div>

        {/* Bottom row: language, copyright */}
        <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <select className="bg-transparent border border-gray-600 px-3 py-2">
              <option className="text-black">English</option>
              <option className="text-black">Arabic</option>
            </select>
          </div>

          <div className="w-full md:w-auto text-right md:text-left text-gray-500">
            <span>© 2025 R&amp;S , All rights reserved. </span>
            <a href="/about" className="underline hover:text-gray-300">Powered by Omar Gamal</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
