import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary capturou erro:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  handleClearCache = async () => {
    try {
      // Limpar cache do service worker
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Desregistrar service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      
      // Limpar localStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Recarregar
      window.location.href = "/";
    } catch (err) {
      console.error("Erro ao limpar cache:", err);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-6 h-6" />
              <h1 className="text-xl font-semibold">Erro ao carregar</h1>
            </div>
            
            <p className="text-sm text-muted-foreground">
              O aplicativo encontrou um problema ao inicializar. Isso pode acontecer após atualizações.
            </p>

            {this.state.error && (
              <details className="text-xs bg-muted p-3 rounded-md">
                <summary className="cursor-pointer font-medium mb-2">Detalhes técnicos</summary>
                <code className="text-destructive break-all">
                  {this.state.error.toString()}
                </code>
              </details>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Voltar ao início
              </button>
              
              <button
                onClick={this.handleClearCache}
                className="w-full inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Limpar cache e reiniciar
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2">
              Se o problema persistir, desinstale e reinstale o aplicativo
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
