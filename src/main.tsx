import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Fontlar yüklenince <html>'e sınıf ekle: font değişiminden etkilenen dekoratif öğeler
// (hero'daki dev yazı) ancak o zaman görünür → düzen kayması (CLS) olmaz.
document.fonts?.ready.then(() => document.documentElement.classList.add("fonts-ready"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
