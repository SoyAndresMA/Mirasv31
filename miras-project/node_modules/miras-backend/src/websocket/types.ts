// Ruta del fichero: /backend/src/websocket/types.ts

// Tipos de mensajes del sistema
export enum MessageType {
    // Conexión y sistema
    CONNECT = 'CONNECT',
    DISCONNECT = 'DISCONNECT',
    ERROR = 'ERROR',
    PING = 'PING',
    PONG = 'PONG',
    
    // Dispositivos
    DEVICE_CONNECT = 'DEVICE_CONNECT',
    DEVICE_DISCONNECT = 'DEVICE_DISCONNECT',
    DEVICE_STATUS = 'DEVICE_STATUS',
    
    // Items
    ITEM_PLAY = 'ITEM_PLAY',
    ITEM_STOP = 'ITEM_STOP',
    ITEM_UPDATE = 'ITEM_UPDATE',
    ITEM_STATUS = 'ITEM_STATUS',
    
    // Eventos
    EVENT_EXECUTE = 'EVENT_EXECUTE',
    EVENT_STOP = 'EVENT_STOP',
    EVENT_STATUS = 'EVENT_STATUS',
    
    // Estado del sistema
    STATE_UPDATE = 'STATE_UPDATE',
    STATE_REQUEST = 'STATE_REQUEST'
}

// Estructura base de mensaje
export interface WSMessage {
    type: MessageType;
    timestamp: number;
    payload: any;
    requestId?: string;
    error?: string;
}

// Estados de conexión
export enum ConnectionState {
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED',
    ERROR = 'ERROR'
}

// Estados de dispositivos
export enum DeviceState {
    OFFLINE = 'OFFLINE',
    CONNECTING = 'CONNECTING',
    ONLINE = 'ONLINE',
    ERROR = 'ERROR'
}

// Estados de reproducción
export enum PlaybackState {
    STOPPED = 'STOPPED',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    ERROR = 'ERROR'
}

// Interfaz para clientes conectados
export interface ConnectedClient {
    id: string;
    connectionTime: number;
    lastPing: number;
    state: ConnectionState;
}

// Tipos de respuesta
export interface WSResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    requestId?: string;
}

// Tipos de error
export interface WSError {
    code: string;
    message: string;
    details?: any;
}