import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = 
        this.state.error?.message?.includes("fetch") ||
        this.state.error?.message?.includes("network") ||
        this.state.error?.message?.includes("Network");

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">
              {isNetworkError ? "Verbindingsprobleem" : "Er ging iets mis"}
            </h1>
            
            <p className="text-muted-foreground mb-6">
              {isNetworkError 
                ? "Er kon geen verbinding worden gemaakt met de server. Controleer je internetverbinding en probeer het opnieuw."
                : "Er is een onverwachte fout opgetreden. Probeer de pagina opnieuw te laden."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleRetry} className="gradient-primary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Opnieuw proberen
              </Button>
              <Button variant="outline" onClick={this.handleGoHome}>
                <Home className="w-4 h-4 mr-2" />
                Naar Dashboard
              </Button>
            </div>

            {this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                  Technische details
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
