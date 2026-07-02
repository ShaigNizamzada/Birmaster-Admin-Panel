import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "./styles/global.scss";
import { CookiesProvider } from "react-cookie";

createRoot(document.getElementById("root")).render(
  <CookiesProvider defaultSetOptions={{ path: "/" }}>
    <StrictMode>
      <App />
    </StrictMode>
  </CookiesProvider>
);
