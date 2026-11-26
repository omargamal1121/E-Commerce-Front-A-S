import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import ShopContextProvider from "./context/ShopContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { PromoProvider } from "./context/PromoContext.jsx";
import './i18n';

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <ShopContextProvider>
        <PromoProvider>
          <App />
        </PromoProvider>
      </ShopContextProvider>
    </ThemeProvider>
  </BrowserRouter>
);
