import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate, Link } from "react-router-dom";

const Footer = () => {
  const context = useContext(ShopContext);
  const setShowSearch = context?.setShowSearch;
  const navigate = useNavigate();

  return (
    <footer className="bg-[var(--surface)] text-[var(--text)] border-t border-[var(--border)] pt-16 pb-12">
      <div className="max-w-screen-2xl mx-auto px-6 sm:px-[3vw] lg:px-[4vw]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-[var(--border)]">
          
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-2xl font-serif-title font-bold tracking-tight text-[var(--text)]">
              R&S <span className="text-[var(--accent)] text-sm font-sans uppercase tracking-[0.2em] block font-normal">Fashion Wear</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Curated everyday luxury apparel designed for the modern lifestyle. Quality craftsmanship meets contemporary elegance.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <p className="uppercase tracking-[0.25em] text-[10px] font-bold text-[var(--accent)]">Quick Links</p>
            <ul className="space-y-2.5 text-xs text-[var(--text-muted)]">
              <li><Link to="/" className="hover:text-[var(--text)] transition-colors">Home</Link></li>
              <li><Link to="/collection" className="hover:text-[var(--text)] transition-colors">Collections</Link></li>
              <li><Link to="/about" className="hover:text-[var(--text)] transition-colors">Our Story</Link></li>
              <li>
                <button
                  onClick={() => { setShowSearch?.(true); navigate("/collection"); }}
                  className="hover:text-[var(--text)] transition-colors text-left"
                >
                  Search Catalog
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div className="flex flex-col gap-4">
            <p className="uppercase tracking-[0.25em] text-[10px] font-bold text-[var(--accent)]">Customer Care</p>
            <ul className="space-y-2.5 text-xs text-[var(--text-muted)]">
              <li><Link to="/policy" className="hover:text-[var(--text)] transition-colors">Return &amp; Exchange Policy</Link></li>
              <li><Link to="/policy" className="hover:text-[var(--text)] transition-colors">Shipping & Delivery</Link></li>
              <li><Link to="/contact" className="hover:text-[var(--text)] transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col gap-4">
            <p className="uppercase tracking-[0.25em] text-[10px] font-bold text-[var(--accent)]">Get In Touch</p>
            <div className="space-y-2 text-xs text-[var(--text-muted)]">
              <p className="flex items-center gap-2">
                <span className="text-[var(--accent)]">Phone:</span>
                <a href="tel:01555522161" className="hover:text-[var(--text)] font-semibold">01555522161</a>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[var(--accent)]">Email:</span>
                <a href="mailto:r.s.store.0012@gmail.com" className="hover:text-[var(--text)] font-semibold">r.s.store.0012@gmail.com</a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]/80">
          <p>© {new Date().getFullYear()} R&S Fashion Wear. All rights reserved.</p>
          <p>
            Powered by{" "}
            <a
              href="https://omar-gamal-eng.vercel.app/#"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] underline hover:text-[var(--text)] transition-colors"
            >
              Omar Gamal
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
