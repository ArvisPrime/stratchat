import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center text-foreground">
                    <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-4">
                        <AlertTriangle className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                    <p className="text-muted-foreground max-w-md mb-6">
                        An unexpected error occurred. Use the button below to reload the application.
                    </p>
                    <div className="bg-secondary/50 p-4 rounded-lg mb-6 w-full max-w-md overflow-x-auto">
                        <code className="text-xs text-muted-foreground font-mono">
                            {this.state.error?.message || 'Unknown Error'}
                        </code>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
