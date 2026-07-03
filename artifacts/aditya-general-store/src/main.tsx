import { createRoot } from "react-dom/client";
import App from "./App";
import { initAdminAuth } from "./lib/admin-auth";
import "./index.css";

initAdminAuth();

createRoot(document.getElementById("root")!).render(<App />);
