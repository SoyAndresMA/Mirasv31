// Ruta del fichero: /frontend/src/hooks/useServerConnection.ts

import { useEffect, useCallback, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import { useSystemState } from '../core/state/GlobalContext';
import { ServerStatus, ServerConfig } from '../core/state/types';
import { WS_EVENTS, WS_COMMANDS } from '../core/websocket/constants';

interface UseServerConnectionReturn {
 connect: (config: ServerConfig) => Promise<void>;
 disconnect: (serverId: string) => Promise<void>;
 getStatus: (serverId: string) => ServerStatus;
 isConnected: (serverId: string) => boolean;
 connectionError: string | null;
 isConnecting: boolean;
}

export function useServerConnection(): UseServerConnectionReturn {
 const ws = useWebSocket();
 const { state, dispatch } = useSystemState();
 const [connectionError, setConnectionError] = useState<string | null>(null);
 const [isConnecting, setIsConnecting] = useState(false);

 useEffect(() => {
   if (!ws) return;

   const handleServerStatus = ({ serverId, status }: { serverId: string; status: ServerStatus }) => {
     dispatch({ 
       type: 'SET_SERVER_STATUS', 
       payload: { serverId, status } 
     });
   };

   const handleServerError = ({ serverId, error }: { serverId: string; error: string }) => {
     setConnectionError(error);
     dispatch({
       type: 'SET_SERVER_STATUS',
       payload: { serverId, status: ServerStatus.ERROR }
     });
   };

   ws.on(WS_EVENTS.SERVER_STATUS, handleServerStatus);
   ws.on(WS_EVENTS.SERVER_ERROR, handleServerError);

   return () => {
     ws.off(WS_EVENTS.SERVER_STATUS, handleServerStatus);
     ws.off(WS_EVENTS.SERVER_ERROR, handleServerError);
   };
 }, [ws, dispatch]);

 const connect = useCallback(async (config: ServerConfig) => {
   if (!ws) throw new Error('WebSocket not initialized');
   
   setIsConnecting(true);
   setConnectionError(null);

   try {
     await ws.emit(WS_COMMANDS.CONNECT_SERVER, config);
     dispatch({
       type: 'SET_SERVER_STATUS',
       payload: { serverId: config.id, status: ServerStatus.CONNECTING }
     });
   } catch (error) {
     setConnectionError(error instanceof Error ? error.message : 'Connection failed');
     dispatch({
       type: 'SET_SERVER_STATUS',
       payload: { serverId: config.id, status: ServerStatus.ERROR }
     });
     throw error;
   } finally {
     setIsConnecting(false);
   }
 }, [ws, dispatch]);

 const disconnect = useCallback(async (serverId: string) => {
   if (!ws) throw new Error('WebSocket not initialized');

   try {
     await ws.emit(WS_COMMANDS.DISCONNECT_SERVER, { serverId });
     dispatch({
       type: 'SET_SERVER_STATUS',
       payload: { serverId, status: ServerStatus.DISCONNECTED }
     });
   } catch (error) {
     setConnectionError(error instanceof Error ? error.message : 'Disconnection failed');
     throw error;
   }
 }, [ws, dispatch]);

 const getStatus = useCallback((serverId: string): ServerStatus => {
   return state.config.serverStatuses[serverId] || ServerStatus.DISCONNECTED;
 }, [state.config.serverStatuses]);

 const isConnected = useCallback((serverId: string): boolean => {
   return getStatus(serverId) === ServerStatus.CONNECTED;
 }, [getStatus]);

 return {
   connect,
   disconnect,
   getStatus,
   isConnected,
   connectionError,
   isConnecting
 };
}