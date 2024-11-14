import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Play, Square, AlertCircle } from 'lucide-react';
import { MEventProps, MEventState, ItemsByRow, MEventErrorProps } from './types';
import { useWebSocket } from '../../../hooks/useWebSocket';

// Componente para mostrar errores
const ErrorDisplay: React.FC<MEventErrorProps> = ({ message, details }) => (
  <div className="bg-red-900/20 p-4 rounded-lg border border-red-700 text-red-400 flex items-center gap-2">
    <AlertCircle className="h-5 w-5 flex-shrink-0" />
    <div className="flex flex-col">
      <span>{message}</span>
      {details && <span className="text-sm opacity-75">{details}</span>}
    </div>
  </div>
);

const MEvent: React.FC<MEventProps> = ({
  id,
  title,
  items,
  union,
  onEventChange,
  onUnionChange,
  onItemChange,
  children
}) => {
  const ws = useWebSocket();
  
  const [state, setState] = useState<MEventState>({
    isExecuting: false,
    activeRows: {},
    activeItems: {}
  });

  // Organizar items por filas
  const itemsByRow = useMemo(() => {
    try {
      if (!items || !Array.isArray(items)) {
        throw new Error('No hay items válidos en el evento');
      }

      const rows: ItemsByRow = {};
      
      items.forEach(item => {
        const row = item.position.row;
        const col = item.position.column;
        
        if (!rows[row]) {
          rows[row] = new Array(3).fill(null);
        }
        
        if (col < 1 || col > 3) {
          console.warn(`MEvent: Posición de columna inválida (${col}) para item ${item.id}`);
          return;
        }
        
        rows[row][col - 1] = item;
      });

      return rows;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Error al procesar los items'
      }));
      return {};
    }
  }, [items]);

  // Lista de números de fila ordenados
  const rows = useMemo(() => 
    Object.keys(itemsByRow)
      .map(Number)
      .sort((a, b) => a - b),
    [itemsByRow]
  );

  // Escuchar eventos de WebSocket
  useEffect(() => {
    if (!ws) return;

    const handleStateUpdate = (data: any) => {
      if (data.eventId === id) {
        setState(prev => ({
          ...prev,
          isExecuting: data.isExecuting,
          activeItems: data.activeItems || {}
        }));
      }
    };

    const handleError = (data: any) => {
      if (data.eventId === id) {
        setState(prev => ({
          ...prev,
          error: data.message
        }));
      }
    };

    ws.on('event:stateUpdate', handleStateUpdate);
    ws.on('event:error', handleError);

    return () => {
      ws.off('event:stateUpdate', handleStateUpdate);
      ws.off('event:error', handleError);
    };
  }, [ws, id]);

  // Manejadores de eventos
  const toggleRow = useCallback(async (row: number) => {
    if (!ws) return;

    const newRowState = !state.activeRows[row];
    const rowItems = itemsByRow[row] || [];
    const itemIds = rowItems.filter(item => item !== null).map(item => item!.id);

    try {
      await ws.emit('event:toggleRow', {
        eventId: id,
        row,
        itemIds,
        active: newRowState
      });

      setState(prev => ({
        ...prev,
        activeRows: {
          ...prev.activeRows,
          [row]: newRowState
        }
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Error al cambiar estado de fila'
      }));
    }
  }, [ws, id, state.activeRows, itemsByRow]);

  const executeEvent = useCallback(async () => {
    if (!ws) return;

    try {
      setState(prev => ({ ...prev, isExecuting: true, error: undefined }));
      
      await ws.emit('event:execute', {
        eventId: id,
        timestamp: Date.now()
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isExecuting: false,
        error: err instanceof Error ? err.message : 'Error al ejecutar evento'
      }));
    }
  }, [ws, id]);

  const stopEvent = useCallback(async () => {
    if (!ws) return;

    try {
      await ws.emit('event:stop', {
        eventId: id,
        timestamp: Date.now()
      });

      setState(prev => ({
        ...prev,
        isExecuting: false,
        activeRows: {},
        activeItems: {}
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Error al detener evento'
      }));
    }
  }, [ws, id]);

  // Si hay error general en el evento
  if (state.error) {
    return <ErrorDisplay message={state.error} />;
  }

  const isAnyItemActive = Object.values(state.activeItems).some(active => active);
  const eventBackgroundColor = isAnyItemActive ? 'bg-blue-600' : 'bg-gray-700';

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
      {/* Cabecera del evento */}
      <div className="flex items-center gap-2 mb-2 select-none">
        {union && (
          <div className="grid grid-cols-2 gap-[1px] h-10 w-20">
            <div
              className={`flex items-center justify-center ${eventBackgroundColor} rounded cursor-pointer hover:bg-gray-600 transition-colors`}
              style={{ height: '100%', width: '100%' }}
            >
              <div
                className="h-6 w-6"
                dangerouslySetInnerHTML={{ __html: union.icon }}
              />
            </div>
            <div
              className={`flex items-center justify-center ${eventBackgroundColor} rounded`}
              style={{ height: '100%', width: '100%' }}
            >
              <button
                onClick={state.isExecuting ? stopEvent : executeEvent}
                className="flex items-center justify-center p-1.5 rounded transition-colors hover:bg-opacity-80"
              >
                {state.isExecuting ? (
                  <Square size={24} className="fill-current" />
                ) : (
                  <Play size={24} className="fill-current" />
                )}
              </button>
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold text-white select-none">
          {title}
        </h2>

        {children}
      </div>

      {/* Filas de items */}
      <div className="space-y-0">
        {rows.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No hay items en este evento
          </div>
        ) : (
          rows.map((rowNum, index) => {
            const isRowActive = state.activeRows[rowNum] || false;
            const rowItems = itemsByRow[rowNum];

            return (
              <div key={rowNum}>
                <div className="flex gap-2 py-2">
                  <button
                    onClick={() => toggleRow(rowNum)}
                    className={`
                      w-12 h-12 rounded flex items-center justify-center transition-colors shrink-0
                      ${isRowActive ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}
                    `}
                    title={isRowActive ? 'Detener fila' : 'Reproducir fila'}
                  >
                    {isRowActive ? (
                      <Square className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white" />
                    )}
                  </button>

                  {/* Contenedor con scroll horizontal */}
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 min-w-min">
                      {rowItems?.map((item, colIndex) => (
                        <React.Fragment key={item?.id || `empty-${rowNum}-${colIndex}`}>
                          {item ? (
                            <div className="w-[265px] h-12">
                              {/* Aquí se renderizará el componente específico según item.type */}
                              {children}
                            </div>
                          ) : (
                            <div className="w-[265px] h-12 bg-gray-700/20 rounded shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                {index < rows.length - 1 && (
                  <div className="border-b border-gray-300/10" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MEvent;