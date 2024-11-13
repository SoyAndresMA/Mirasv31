// Ruta del fichero: /frontend/src/components/caspar/MClip/MClip.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, AlertCircle } from 'lucide-react';
import { MClipProps, ClipState } from './types';
import { useWebSocket } from '../../../hooks/useWebSocket';
import MClipControls from './MClipControls';

const MClip: React.FC<MClipProps> = ({
  item,
  isActive = false,
  onToggle,
  onStateChange,
  onError
}) => {
  const ws = useWebSocket();
  const [state, setState] = useState<ClipState>({
    isPlaying: false
  });
  const [error, setError] = useState<string | null>(null);

  // Suscripción a actualizaciones de estado vía WebSocket
  useEffect(() => {
    if (!ws) return;

    const handleStateUpdate = (data: any) => {
      if (data.itemId === item.id && data.type === 'mclip') {
        setState({
          isPlaying: data.isPlaying,
          position: data.position,
          duration: data.duration,
          fps: data.fps
        });
        onStateChange?.(data);
      }
    };

    const handleError = (data: any) => {
      if (data.itemId === item.id) {
        setError(data.message);
        onError?.(data.message);
      }
    };

    ws.on('clip:stateUpdate', handleStateUpdate);
    ws.on('clip:error', handleError);

    return () => {
      ws.off('clip:stateUpdate', handleStateUpdate);
      ws.off('clip:error', handleError);
    };
  }, [ws, item.id, onStateChange, onError]);

  const handlePlay = useCallback(async () => {
    if (!ws) return;

    try {
      setError(null);
      // Estado optimista
      setState(prev => ({ ...prev, isPlaying: true }));

      await ws.emit('clip:play', {
        itemId: item.id,
        channel: item.config.channel,
        layer: item.config.layer,
        clipPath: item.clipPath,
        timestamp: Date.now()
      });

      onToggle?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error reproduciendo clip';
      setError(errorMessage);
      setState(prev => ({ ...prev, isPlaying: false }));
      onError?.(errorMessage);
    }
  }, [ws, item, onToggle, onError]);

  const handleStop = useCallback(async () => {
    if (!ws) return;

    try {
      await ws.emit('clip:stop', {
        itemId: item.id,
        channel: item.config.channel,
        layer: item.config.layer,
        timestamp: Date.now()
      });

      setState(prev => ({ ...prev, isPlaying: false }));
      onToggle?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deteniendo clip';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [ws, item, onToggle, onError]);

  const handleLoopChange = useCallback(async (enable: boolean) => {
    if (!ws) return;

    try {
      await ws.emit('clip:loop', {
        itemId: item.id,
        channel: item.config.channel,
        layer: item.config.layer,
        enable,
        timestamp: Date.now()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error configurando loop';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [ws, item, onError]);

  const backgroundColor = isActive ? item.activeColor : item.inactiveColor;

  return (
    <div className="flex gap-[1px] h-12 select-none" style={{ width: '265px' }}>
      {/* Union Slot */}
      <div 
        className="w-12 h-full flex flex-col items-center justify-center rounded text-center text-white"
        style={{ backgroundColor }}
      >
        {item.union && (
          <>
            <div 
              className="h-6 w-6 flex items-center justify-center text-white"
              dangerouslySetInnerHTML={{ __html: item.union.icon }}
            />
            <div className="text-xs font-mono">{item.union.position || '0'}</div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div
        className="flex items-center gap-2 px-2 py-0.5 text-white rounded h-full w-[217px]"
        style={{ backgroundColor }}
      >
        <MClipControls
          state={state}
          config={item.config}
          onPlay={handlePlay}
          onStop={handleStop}
          onLoop={handleLoopChange}
        />

        <div className="flex flex-col min-w-0 flex-grow">
          <span className="text-sm font-bold leading-none whitespace-nowrap overflow-hidden overflow-ellipsis">
            {item.title}
          </span>
          <span className="text-xs leading-none whitespace-nowrap overflow-hidden overflow-ellipsis opacity-80">
            {item.videoId}
          </span>
          {state.position !== undefined && state.duration !== undefined && (
            <span className="text-xs opacity-60">
              {Math.floor(state.position / (state.fps || 25))}s / {Math.floor(state.duration / (state.fps || 25))}s
            </span>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-full left-0 w-full p-2 bg-red-900/90 rounded shadow-lg mb-1">
          <div className="flex items-center gap-2 text-red-200 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MClip;