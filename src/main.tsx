import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

console.log("[Forgea] Mounting app – V1.3.1");
const root = document.getElementById("root")!;
createRoot(root).render(<App />);
document.documentElement.dataset.appBoot = "ok";
console.log("[Forgea] App mounted successfully");
