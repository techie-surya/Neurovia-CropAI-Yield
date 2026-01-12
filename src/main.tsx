
  import { createRoot } from "react-dom/client";
  import { BrowserRouter } from "react-router-dom";
  import App from "./App.tsx";
  import { LanguageProvider } from "./context/LanguageContext";
  import "./index.css";

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  );
  