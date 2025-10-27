// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { GoogleAuthProvider } from "./context/GoogleAuthProvider.jsx"; // ✅ import your provider

import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleAuthProvider>  {/* ✅ Wrap the whole app */}
        <App />
      </GoogleAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

