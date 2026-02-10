import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <CardTitle className="text-xl text-red-900">Something went wrong</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-neutral-600">
                            <p className="mb-4">
                                An unexpected error occurred. Please try again or reload the page.
                            </p>
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="text-left bg-neutral-50 p-3 rounded text-xs overflow-auto max-h-40">
                                    <summary className="cursor-pointer font-medium">Error Details</summary>
                                    <pre className="mt-2 whitespace-pre-wrap break-words">
                                        {this.state.error.message}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            )}
                        </CardContent>
                        <CardFooter className="flex gap-2 justify-center">
                            <Button variant="outline" onClick={this.handleRetry}>
                                <RefreshCcw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                            <Button onClick={this.handleReload}>
                                Reload Page
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
