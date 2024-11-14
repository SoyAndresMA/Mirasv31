// Ruta del fichero: /frontend/src/hooks/useDeviceState.ts

import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import { DeviceState, DeviceType } from '../core/types';

export function useDeviceState(deviceId: string, type: DeviceType) {
    const ws = useWebSocket();
    const [state, setState] = useState<DeviceState>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!ws) return;

        // Suscribirse a actualizaciones de estado del dispositivo
        const handleStateUpdate = (message: any) => {
            if (message.deviceId === deviceId) {
                setState(message.state);
                setError(message.error || null);
                setIsLoading(false);
            }
        };

        ws.subscribe('DEVICE_STATE_UPDATE', handleStateUpdate);

        // Solicitar estado inicial
        ws.send('GET_DEVICE_STATE', { deviceId, type }).catch(err => {
            console.error('Error getting device state:', err);
            setError(err.message);
            setIsLoading(false);
        });

        return () => {
            ws.unsubscribe('DEVICE_STATE_UPDATE', handleStateUpdate);
        };
    }, [ws, deviceId, type]);

    const reconnect = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await ws?.send('RECONNECT_DEVICE', { deviceId, type });
        } catch (err) {
            setError(err.message);
            console.error('Error reconnecting device:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        state,
        error,
        isLoading,
        reconnect
    };
}

// Hook específico para CasparCG
export function useCasparState(deviceId: string) {
    const { state, error, isLoading, reconnect } = useDeviceState(deviceId, 'caspar');
    
    return {
        state,
        error,
        isLoading,
        reconnect,
        isPlaying: state === 'playing',
        isPaused: state === 'paused',
        isStopped: state === 'stopped',
        isConnected: state !== 'disconnected',
        hasError: Boolean(error)
    };
}

// Hook específico para VMix
export function useVMixState(deviceId: string) {
    const { state, error, isLoading, reconnect } = useDeviceState(deviceId, 'vmix');
    
    return {
        state,
        error,
        isLoading,
        reconnect,
        isStreaming: state === 'streaming',
        isPreview: state === 'preview',
        isProgram: state === 'program',
        isConnected: state !== 'disconnected',
        hasError: Boolean(error)
    };
}

// Hook específico para ATEM
export function useATEMState(deviceId: string) {
    const { state, error, isLoading, reconnect } = useDeviceState(deviceId, 'atem');
    
    return {
        state,
        error,
        isLoading,
        reconnect,
        isPreview: state === 'preview',
        isProgram: state === 'program',
        isConnected: state !== 'disconnected',
        hasError: Boolean(error)
    };
}