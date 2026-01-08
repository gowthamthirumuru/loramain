import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    };

    return (
        <div className={`${sizeClasses[size]} ${className}`}>
            <svg
                className="animate-spin text-cyan-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
        </div>
    );
}

interface LoadingOverlayProps {
    message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
    return (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center space-y-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-neutral-600">{message}</p>
            </div>
        </div>
    );
}

interface LoadingCardProps {
    rows?: number;
}

export function LoadingCard({ rows = 3 }: LoadingCardProps) {
    return (
        <div className="p-4 space-y-3 animate-pulse">
            <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-3 bg-neutral-100 rounded w-full"></div>
            ))}
        </div>
    );
}

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
                <div className="text-red-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <p className="text-sm text-red-800">{message}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                        >
                            Try again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
