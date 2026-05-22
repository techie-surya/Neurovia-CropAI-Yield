import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { LanguageProvider } from "./context/LanguageContext";

import "./index.css";

/* =========================================================
   Root Element Validation
========================================================= */

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root container with id "root" not found.');
}

/* =========================================================
   Application Bootstrap
========================================================= */

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
