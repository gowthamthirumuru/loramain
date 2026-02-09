import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { DataProvider } from "./api/DataProvider";
import { AuthProvider } from "./auth/AuthContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <DataProvider>
      <App />
    </DataProvider>
  </AuthProvider>
);