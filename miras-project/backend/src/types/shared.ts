// Ruta del fichero: /backend/src/types/shared.ts

// Estados base
export enum ConnectionState {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    ERROR = 'error'
  }
  
  export enum ItemState {
    STOPPED = 'stopped',
    PLAYING = 'playing',
    PAUSED = 'paused',
    LOADING = 'loading',
    ERROR = 'error'
  }
  
  // Interfaces base
  export interface Device {
    id: string;
    type: 'caspar' | 'vmix' | 'atem';
    name: string;
    state: ConnectionState;
    error?: string;
  }
  
  export interface MItemBase {
    id: number;
    type: string;
    name: string;
    deviceId: string;
    state: ItemState;
    error?: string;
  }
  
  // Tipos específicos de CasparCG
  export interface CasparClip extends MItemBase {
    type: 'mclip';
    channel: number;
    layer: number;
    clipName: string;
    videoPath: string;
    loop?: boolean;
    inPoint?: number;
    outPoint?: number;
  }
  
  export interface CasparGraphics extends MItemBase {
    type: 'mgraphics';
    channel: number;
    layer: number;
    templatePath: string;
    templateData?: Record<string, any>;
  }
  
  export interface CasparPrompt extends MItemBase {
    type: 'mprompt';
    channel: number;
    layer: number;
    text: string;
    speed?: number;
  }
  
  // Comandos WebSocket
  export enum WSCommandType {
    // Comandos de sistema
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    GET_STATUS = 'get_status',
    
    // Comandos de dispositivos
    DEVICE_CONNECT = 'device_connect',
    DEVICE_DISCONNECT = 'device_disconnect',
    DEVICE_GET_STATUS = 'device_get_status',
    
    // Comandos de items
    ITEM_PLAY = 'item_play',
    ITEM_STOP = 'item_stop',
    ITEM_PAUSE = 'item_pause',
    ITEM_UPDATE = 'item_update',
    
    // Comandos de proyectos
    PROJECT_LOAD = 'project_load',
    PROJECT_SAVE = 'project_save',
    PROJECT_CLOSE = 'project_close'
  }
  
  export interface WSCommand {
    id: string;
    type: WSCommandType;
    payload: any;
    timestamp: number;
  }
  
  export interface WSResponse {
    commandId: string;
    success: boolean;
    data?: any;
    error?: string;
    timestamp: number;
  }
  
  // Eventos WebSocket
  export enum WSEventType {
    CONNECTION_CHANGED = 'connection_changed',
    DEVICE_CHANGED = 'device_changed',
    ITEM_CHANGED = 'item_changed',
    PROJECT_CHANGED = 'project_changed',
    ERROR = 'error'
  }
  
  export interface WSEvent {
    type: WSEventType;
    payload: any;
    timestamp: number;
  }
  
  // Tipos de error
  export interface SystemError {
    code: string;
    message: string;
    details?: any;
    timestamp: number;
  }
  
  export interface DeviceError extends SystemError {
    deviceId: string;
    deviceType: string;
  }
  
  export interface ItemError extends SystemError {
    itemId: number;
    itemType: string;
    deviceId: string;
  }