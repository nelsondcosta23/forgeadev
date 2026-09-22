import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "http://994ebcb62592da248c0fa74514c61fa7@localhost:9000/8";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tunnel: "/api/sentry-tunnel",
    environment: import.meta.env.MODE || "production",
    tracesSampleRate: 1.0,
  });
}

console.log("[Forgea] Mounting app – V1.3.1");
const root = document.getElementById("root")!;
createRoot(root).render(<App />);
document.documentElement.dataset.appBoot = "ok";
console.log("[Forgea] App mounted successfully");
