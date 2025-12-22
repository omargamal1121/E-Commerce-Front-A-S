import React, { useEffect, useState } from "react";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "";
  const whatsappMessage = encodeURIComponent("Hello! I need some help with my order.");

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* WhatsApp floating button stacked above */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className={`fixed bottom-20 right-6 z-50 rounded-full bg-green-500 shadow-md p-3 transition-all duration-300 hover:bg-green-600 hover:shadow-lg ${
          isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="h-6 w-6 text-white"
          fill="currentColor"
        >
          <path d="M19.11 17.58c-.27-.14-1.59-.79-1.84-.88-.25-.09-.43-.14-.62.14-.18.27-.71.88-.88 1.06-.16.18-.32.2-.59.07-.27-.14-1.13-.42-2.16-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.62-1.5-.85-2.05-.22-.53-.45-.46-.62-.46-.16 0-.34-.02-.52-.02-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.36.98 2.67 1.12 2.86.14.18 1.93 2.95 4.67 4.14.65.28 1.16.45 1.56.58.66.21 1.25.18 1.72.11.52-.08 1.59-.65 1.81-1.27.23-.62.23-1.14.16-1.27-.07-.11-.25-.18-.52-.32z"/>
          <path d="M27.54 4.46A15.92 15.92 0 0016 .02C7.18.02.02 7.18.02 16c0 2.8.73 5.54 2.12 7.95L.02 32l8.22-2.09A15.9 15.9 0 0016 31.98c8.82 0 15.98-7.16 15.98-15.98 0-4.27-1.66-8.29-4.44-11.54zM16 29.32c-2.66 0-5.26-.71-7.53-2.06l-.54-.32-4.88 1.24 1.3-4.75-.35-.58A13.3 13.3 0 012.68 16C2.68 8.65 8.65 2.68 16 2.68S29.32 8.65 29.32 16 23.35 29.32 16 29.32z"/>
        </svg>
      </a>

      <button
      aria-label="Scroll to top"
      onClick={handleClick}
      className={`fixed bottom-6 right-6 z-50 rounded-full border border-gray-300 bg-white shadow-md p-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-400 active:translate-y-0 ${
        isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-gray-800"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
    </>
  );
};

export default ScrollToTopButton;


