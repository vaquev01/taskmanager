import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                        <AlertTriangle size={28} className="text-rose-400" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">
                        Algo deu errado
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] max-w-md mb-1">
                        Um erro inesperado ocorreu nesta seção.
                    </p>
                    <p className="text-xs text-[var(--text-dim)] font-mono max-w-md mb-6 break-all">
                        {this.state.error?.message}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="btn btn-primary px-6 h-10 text-sm"
                    >
                        <RotateCcw size={14} />
                        <span>Tentar Novamente</span>
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
