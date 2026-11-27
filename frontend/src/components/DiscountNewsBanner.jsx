import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";

const DiscountNewsBanner = () => {
  const { backendUrl } = useContext(ShopContext);
  const [discounts, setDiscounts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActiveDiscounts = async () => {
      try {
        const res = await axios.get(
          `${backendUrl}/api/Discount?includeDeleted=false&page=1&pageSize=10`
        );
        const list =
          res.data?.responseBody?.data ||
          res.data?.data ||
          (Array.isArray(res.data) ? res.data : []);
        const active = list.filter((d) => d.isActive === true && !d.deletedAt);
        setDiscounts(active);
      } catch (err) {
        console.error("Failed to fetch active discounts:", err);
      }
    };

    if (backendUrl) {
      fetchActiveDiscounts();
    }
  }, [backendUrl]);

  if (discounts.length === 0) return null;

  // Duplicate items so the marquee loops seamlessly
  const tickerItems = [...discounts, ...discounts, ...discounts];

  return (
    <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] mt-[72px] sm:mt-[84px] bg-black text-white border-y border-white/10 overflow-hidden z-30">
      <style>{`
        @keyframes discount-marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }
        .discount-marquee-track {
          display: flex;
          width: max-content;
          animation: discount-marquee 24s linear infinite;
        }
        .discount-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex items-center h-10 sm:h-11">
        {/* Static "NEW" / "OFFERS" label */}
        <div className="shrink-0 z-10 bg-red-600 text-white px-3 sm:px-4 h-full flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-md">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>New Offers</span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden">
          <div className="discount-marquee-track items-center">
            {tickerItems.map((discount, idx) => (
              <button
                key={`${discount.id}-${idx}`}
                type="button"
                onClick={() =>
                  navigate(`/discount/${discount.id}`, { state: { discount } })
                }
                className="inline-flex items-center gap-2 px-6 text-xs sm:text-sm font-medium text-white/90 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-black font-extrabold text-[11px]">
                  {discount.discountPercent}% OFF
                </span>
                <span className="font-bold capitalize">{discount.name}</span>
                {discount.description && (
                  <span className="text-white/60 hidden sm:inline">
                    — {discount.description}
                  </span>
                )}
                <span className="text-amber-400 font-bold underline underline-offset-2 ml-1">
                  Shop Now &rarr;
                </span>
                <span className="text-white/30 ml-4">•</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountNewsBanner;
