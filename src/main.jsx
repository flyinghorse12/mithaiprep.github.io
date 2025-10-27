// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { GoogleAuthProvider } from "./context/GoogleAuthProvider.jsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleAuthProvider>
      <App />
    </GoogleAuthProvider>
  </React.StrictMode>
);

