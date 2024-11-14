// Ruta del fichero: /frontend/src/components/common/MItemUnion/MItemUnion.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { Play, Square, AlertCircle } from 'lucide-react';
import { MItemUnionProps, UnionExecutionState } from './types';
import { useWebSocket } from '../../../hooks/useWebSocket';

const MItemUnion: React.FC<MItemUnionProps> = ({
  config,
  onToggle,
  onConfigChange,
  isActive = false,
  disabled = false,
  children
}) => {
  const ws = useWebSocket();
  const [executionState, setExecutionState] = useState<UnionExecutionState>({
    isExecuting: false
  });
  const [error, setError] = useState<string | null>(null);

  // Escuchar eventos de estado del WebSocket
  useEffect(() => {
    if (!ws) return;

    const handleStateUpdate = (data: any) => {
      if (data.unionId === config.id) {
        setExecutionState({
          isExecuting: data.isExecuting,
          startTime: data.startTime
        });
      }
    };

    const handleError = (data: any) => {
      if (data.unionId === config.id) {
        setError(data.message);
        setExecutionState(prev => ({
          ...prev,
          isExecuting: false,
          error: data
        }));
      }
    };

    ws.on('union:stateUpdate', handleStateUpdate);
    ws.on('union:error', handleError);

    return () => {
      ws.off('union:stateUpdate', handleStateUpdate);
      ws.off('union:error', handleError);
    };
  }, [ws, config.id]);

  const handleExecute = useCallback(async () => {
    if (!ws || disabled) return;

    try {
      setError(null);
      setExecutionState(prev => ({ ...prev, isExecuting: true }));

      await ws.emit('union:execute', {
        unionId: config.id,
        type: config.type,
        timestamp: Date.now()
      });

      onToggle?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error ejecutando unión');
      setExecutionState(prev => ({ ...prev, isExecuting: false }));
    }
  }, [ws, config, disabled, onToggle]);

  const handleCancel = useCallback(async () => {
    if (!ws || disabled) return;

    try {
      await ws.emit('union:cancel', {
        unionId: config.id,
        timestamp: Date.now()
      });

      setExecutionState({ isExecuting: false });
      onToggle?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cancelando unión');
    }
  }, [ws, config.id, disabled, onToggle]);

  return (
    <div className={`
      flex flex-col items-center gap-2 p-2 rounded-lg
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${error ? 'bg-red-500/10' : 'bg-gray-800/50'}
    `}>
      {/* Icono y controles */}
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: config.icon }}
        />
        
        <button
          onClick={executionState.isExecuting ? handleCancel : handleExecute}
          disabled={disabled}
          className={`
            p-1 rounded
            ${disabled 
              ? 'bg-gray-700 cursor-not-allowed' 
              : 'hover:bg-gray-700'}
          `}
        >
          {executionState.isExecuting ? (
            <Square className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nombre y posición */}
      <div className="text-center">
        <div className="text-sm font-medium">{config.name}</div>
        {config.position !== undefined && (
          <div className="text-xs opacity-60">Pos: {config.position}</div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1 text-red-400 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Contenido adicional */}
      {children}
    </div>
  );
};

export default MItemUnion;