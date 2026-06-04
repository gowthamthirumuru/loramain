import React from 'react';
import { useWebSocket } from '../services/websocket';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

export function ConnectionStatus() {
    const { status, isConnected, isConnecting, connect, disconnect, simulateAlert } = useWebSocket();

    const handleClick = () => {
        if (isConnected) {
            disconnect();
            toast.info('Disconnected from real-time updates');
        } else if (!isConnecting) {
            connect();
            toast.info('Connecting to real-time updates...');
        }
    };

    const handleSimulateAlert = () => {
        simulateAlert();
        toast.success('Simulated alert generated!');
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleClick}
                className={`h-8 px-2 gap-1.5 text-xs font-medium transition-colors ${isConnected
                        ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        : isConnecting
                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                            : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
                    }`}
            >
                {isConnecting ? (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Connecting...</span>
                    </>
                ) : isConnected ? (
                    <>
                        <Wifi className="w-3.5 h-3.5" />
                        <span>Live</span>
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-3.5 h-3.5" />
                        <span>Offline</span>
                    </>
                )}
            </Button>

            {/* Dev mode: simulate alerts button */}
            {isConnected && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulateAlert}
                    className="h-8 px-2 text-xs border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                >
                    + Alert
                </Button>
            )}
        </div>
    );
}
