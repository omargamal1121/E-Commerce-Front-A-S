import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Fires fbq('track', 'PageView') on every route change.
 * Must be rendered inside a React Router context (inside <BrowserRouter> or <Router>).
 * Renders nothing — returns null.
 */
const MetaPixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [location.pathname, location.search]);

  return null;
};

export default MetaPixelTracker;

