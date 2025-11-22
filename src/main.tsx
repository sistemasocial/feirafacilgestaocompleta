import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";

// Register service worker
registerSW({ immediate: true });

async function hardResetAndReload() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn("[BOOT] Falha ao limpar cache/service workers no fallback:", error);
  } finally {
    window.location.replace("/");
  }
}

console.log("[BOOT] Iniciando aplicação");

try {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Elemento root não encontrado");
  }

  const root = createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </React.StrictMode>
  );

  console.log("[BOOT] Render concluído com sucesso");
} catch (error) {
  console.error("[BOOT] Erro fatal ao iniciar app:", error);

  const fallback = document.createElement("div");
  fallback.className = "min-h-screen flex flex-col items-center justify-center px-4 text-center bg-white text-black";
  fallback.innerHTML = `
    <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">Erro ao iniciar o aplicativo</h1>
    <p style="margin-bottom: 16px; max-width: 320px; color: #4b5563;">
      Ocorreu um problema ao carregar o app instalado. Toque no botão abaixo para limpar o cache e tentar novamente.
    </p>
    <button id="pwa-hard-reset" style="padding: 8px 16px; border-radius: 9999px; border: none; background-color: #10b981; color: white; font-weight: 500;">
      Corrigir e reabrir app
    </button>
  `;

  document.body.innerHTML = "";
  document.body.appendChild(fallback);

  const btn = document.getElementById("pwa-hard-reset");
  if (btn) {
    btn.addEventListener("click", () => {
      hardResetAndReload();
    });
  }
}
