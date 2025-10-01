import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log mínimo para depuração. Em produção, integrar com observabilidade.
    console.error('ErrorBoundary capturou um erro:', { error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-6">
            <div className="text-red-600 font-semibold mb-2">Ocorreu um erro ao carregar este conteúdo.</div>
            <div className="text-gray-600 text-sm">Tente novamente mais tarde ou recarregue a página.</div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}