// Ruta del fichero: frontend/src/hooks/useWebSocket.ts

import { useState, useEffect, useCallback } from 'react';
import { WebSocketClient } from '../core/websocket/client';
import { WebSocketMessage } from '../core/websocket/types';

const WS_RECONNECT_DELAY = 5000;
const WS_MAX_RECONNECT_ATTEMPTS = 5;

export function useWebSocket() {
  const [ws, setWs] = useState<WebSocketClient | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (isConnecting || (ws && ws.isConnected())) return;

    setIsConnecting(true);

    try {
      const client = new WebSocketClient();
      await client.connect();
      
      setWs(client);
      setReconnectAttempts(0);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      
      if (reconnectAttempts < WS_MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          setIsConnecting(false);
        }, WS_RECONNECT_DELAY);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [ws, isConnecting, reconnectAttempts]);

  useEffect(() => {
    connect();

    return () => {
      if (ws) {
        ws.disconnect();
      }
    };
  }, [connect]);
  
  useEffect(() => {
    if (!ws) return;

    const handleDisconnect = () => {
      if (reconnectAttempts < WS_MAX_RECONNECT_ATTEMPTS) {
        setTimeout(connect, WS_RECONNECT_DELAY);
      }
    };

    ws.on('disconnect', handleDisconnect);

    return () => {
      ws.off('disconnect', handleDisconnect);
    };
  }, [ws, connect, reconnectAttempts]);

  const send = useCallback(async (type: string, payload?: any): Promise<void> => {
    if (!ws || !ws.isConnected()) {
      throw new Error('WebSocket is not connected');
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    await ws.send(message);
  }, [ws]);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!ws) return () => {};
    
    ws.on(event, callback);
    return () => ws.off(event, callback);
  }, [ws]);

  return {
    ws,
    isConnected: ws?.isConnected() || false,
    isConnecting,
    reconnectAttempts,
    send,
    subscribe,
    connect
  };
}

// Hooks auxiliares para casos de uso específicos
export function useWebSocketEvent<T = any>(event: string, callback: (data: T) => void) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    return subscribe(event, callback);
  }, [event, callback, subscribe]);
}

export function useWebSocketState<T = any>(event: string) {
  const [state, setState] = useState<T | null>(null);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    return subscribe(event, (data: T) => setState(data));
  }, [event, subscribe]);

  return state;
}

export function useWebSocketCommand() {
  const { send, isConnected } = useWebSocket();

  const executeCommand = useCallback(async (command: string, params?: any) => {
    if (!isConnected) {
      throw new Error('No WebSocket connection available');
    }

    try {
      await send('command', { command, params });
    } catch (error) {
      console.error('Failed to execute command:', error);
      throw error;
    }
  }, [send, isConnected]);

  return {
    executeCommand,
    isConnected
  };
}