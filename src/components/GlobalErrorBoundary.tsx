import React from "react";

interface GlobalErrorBoundaryState {
  hasError: boolean;
}

export class GlobalErrorBoundary extends React.Component<
  React.PropsWithChildren,
  GlobalErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    // Logar no console para facilitar debug no PWA
    console.error("Erro global capturado:", error, errorInfo);
  }

  private async resetApp() {
    try {
      // Tentar limpar service workers antigos
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }

      // Tentar limpar caches antigos
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (error) {
      console.warn("Falha ao limpar cache/service workers:", error);
    } finally {
      // Recarregar app após limpeza
      window.location.replace("/");
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-background text-foreground">
          <h1 className="text-2xl font-bold mb-2">Algo deu errado ao iniciar o app</h1>
          <p className="text-muted-foreground mb-4 max-w-md">
            Toque no botão abaixo para tentar corrigir automaticamente o problema
            limpando o cache e reiniciando o aplicativo.
          </p>
          <button
            type="button"
            onClick={() => this.resetApp()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium shadow"
          >
            Corrigir e reabrir app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
