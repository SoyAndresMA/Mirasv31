// Ruta del fichero: /frontend/src/core/websocket/types.ts

// Re-exportamos los tipos base del backend para mantener consistencia
export { 
    MessageType,
    ConnectionState,
    DeviceState,
    PlaybackState 
} from '../../../../backend/src/websocket/types';

// Estado del cliente WebSocket
export interface WSClientState {
    connected: boolean;
    reconnecting: boolean;
    lastError?: string;
    connectionAttempts: number;
    lastMessageTime?: number;
}

// Opciones de configuración del cliente
export interface WSClientConfig {
    url: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    pingInterval?: number;
    debug?: boolean;
}

// Manejadores de eventos
export interface WSEventHandlers {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
    onReconnect?: () => void;
    onMessage?: (message: any) => void;
}

// Tipos de respuesta específicos del frontend
export interface StateUpdateResponse {
    systemState: any; // TODO: Definir tipo específico
    timestamp: number;
}

export interface ItemStatusResponse {
    itemId: number;
    state: PlaybackState;
    timestamp: number;
    details?: any;
}

export interface DeviceStatusResponse {
    deviceId: number;
    state: DeviceState;
    timestamp: number;
    details?: any;
}