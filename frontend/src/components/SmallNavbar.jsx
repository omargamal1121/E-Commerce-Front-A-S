import React from 'react';

const announcement = '50% OFF all tees — while stocks last! 🌶️';

const SmallNavbar = () => {
  // Repeat the announcement 12 times for a long marquee
  const repeats = 12;
  return (
    <div className="w-full bg-[#151515] text-white text-xs font-semibold px-2 py-3 overflow-hidden relative group cursor-pointer">
      <div
        className="flex whitespace-nowrap animate-marquee group-hover:paused"
        style={{ minWidth: '100%', animationPlayState: 'running' }}
      >
        {Array.from({ length: repeats }).map((_, i) => (
          <span className="mx-4" key={i}>{announcement}</span>
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