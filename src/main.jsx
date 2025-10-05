import React, {StrictMode} from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./App.css";
import "./index.css"; // <- IMPORTANTE
import {AuthProvider} from "./auth/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
    <BrowserRouter>
        <AuthProvider>
        <App />
        </AuthProvider>
    </BrowserRouter>
    </StrictMode>
);
