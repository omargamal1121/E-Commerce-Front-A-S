import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { ToastContainer } from "react-toastify";

/**
 * Renders ToastContainer directly into document.body so it is never
 * trapped inside a framer-motion stacking context.
 */
const ToastPortal = ({ theme }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme === "light" ? "light" : "dark"}
      style={{ marginTop: "80px", zIndex: 2147483647 }}
    />,
    document.body
  );
};

export default ToastPortal;
