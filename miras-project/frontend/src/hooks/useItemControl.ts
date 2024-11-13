// Ruta del fichero: /frontend/src/hooks/useItemControl.ts

import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { ItemCommand, ItemState, ItemType } from '../core/types';

interface ItemControlOptions {
    optimisticUpdate?: boolean;
    retryCount?: number;
    retryDelay?: number;
}

export function useItemControl(
    itemId: string,
    type: ItemType,
    options: ItemControlOptions = {}
) {
    const {
        optimisticUpdate = true,
        retryCount = 3,
        retryDelay = 1000
    } = options;

    const ws = useWebSocket();
    const [state, setState] = useState<ItemState>('stopped');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const sendCommand = useCallback(async (
        command: ItemCommand,
        params: Record<string, any> = {}
    ) => {
        setError(null);
        setIsLoading(true);

        // Actualización optimista del estado
        if (optimisticUpdate) {
            switch (command) {
                case 'PLAY':
                    setState('playing');
                    break;
                case 'STOP':
                    setState('stopped');
                    break;
                case 'PAUSE':
                    setState('paused');
                    break;
            }
        }

        let attempts = 0;
        while (attempts < retryCount) {
            try {
                await ws?.send('ITEM_COMMAND', {
                    itemId,
                    type,
                    command,
                    ...params
                });
                setIsLoading(false);
                return true;
            } catch (err) {
                attempts++;
                if (attempts === retryCount) {
                    setError(err.message);
                    setIsLoading(false);
                    // Revertir estado optimista si falló
                    if (optimisticUpdate) {
                        setState(prev => prev === 'playing' ? 'stopped' : prev);
                    }
                    throw err;
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }, [ws, itemId, type, optimisticUpdate, retryCount, retryDelay]);

    const play = useCallback(async (params?: Record<string, any>) => {
        return sendCommand('PLAY', params);
    }, [sendCommand]);

    const stop = useCallback(async (params?: Record<string, any>) => {
        return sendCommand('STOP', params);
    }, [sendCommand]);

    const pause = useCallback(async (params?: Record<string, any>) => {
        return sendCommand('PAUSE', params);
    }, [sendCommand]);

    const update = useCallback(async (params: Record<string, any>) => {
        return sendCommand('UPDATE', params);
    }, [sendCommand]);

    return {
        state,
        error,
        isLoading,
        play,
        stop,
        pause,
        update,
        isPlaying: state === 'playing',
        isPaused: state === 'paused',
        isStopped: state === 'stopped',
        hasError: Boolean(error)
    };
}

// Hooks específicos por tipo de item
export function useCasparClipControl(itemId: string, options?: ItemControlOptions) {
    return useItemControl(itemId, 'caspar_clip', options);
}

export function useCasparGraphicsControl(itemId: string, options?: ItemControlOptions) {
    return useItemControl(itemId, 'caspar_graphics', options);
}

export function useCasparPromptControl(itemId: string, options?: ItemControlOptions) {
    return useItemControl(itemId, 'caspar_prompt', options);
}

export function useVMixInputControl(itemId: string, options?: ItemControlOptions) {
    return useItemControl(itemId, 'vmix_input', options);
}

export function useATEMInputControl(itemId: string, options?: ItemControlOptions) {
    return useItemControl(itemId, 'atem_input', options);
}