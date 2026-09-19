import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import "./styles/workspace-theme.css";
import "./styles/future-ui.css";
import "./styles/studio-ui.css";
import {initializeTheme} from "./components/layouts/ThemeToggle";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

initializeTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
