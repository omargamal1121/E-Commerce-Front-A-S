import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';

const SmallNavbar = () => {
  const { backendUrl } = useContext(ShopContext);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/Discount?page=1&pageSize=10`);
        const data = await res.json();
        
        if (Array.isArray(data.responseBody?.data)) {
          const now = new Date();
          const activeDiscounts = data.responseBody.data.filter(discount => {
            const startDate = new Date(discount.startDate);
            const endDate = new Date(discount.endDate);
            return discount.isActive && now >= startDate && now <= endDate;
          });
          setDiscounts(activeDiscounts);
        }
      } catch (err) {
        console.error('Error fetching discounts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, [backendUrl]);

  // Don't render if no discounts or still loading
  if (loading || discounts.length === 0) {
    return null;
  }

  // Create announcement text from discounts
  const announcements = discounts.map(d => `${d.discountPercent}% OFF - ${d.name}`);
  const announcementText = announcements.join(' — ');

  // Repeat for marquee effect
  const repeats = 12;

  return (
    <div className="w-full bg-[#151515] text-white text-xs font-semibold px-2 py-3 overflow-hidden relative group cursor-pointer">
      <div
        className="flex whitespace-nowrap animate-marquee group-hover:paused"
        style={{ minWidth: '100%', animationPlayState: 'running' }}
      >
        {Array.from({ length: repeats }).map((_, i) => (
          <span className="mx-4" key={i}>{announcementText}</span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .group:hover .animate-marquee {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
};

export default SmallNavbar;
