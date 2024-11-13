// Ruta del fichero: backend/src/devices/base/types.ts

/** Estado general de un dispositivo */
export enum DeviceStatus {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    ERROR = 'error'
  }
  
  /** Tipo de dispositivo soportado */
  export enum DeviceType {
    CASPAR = 'caspar',
    VMIX = 'vmix',
    ATEM = 'atem'
  }
  
  /** Configuración base para cualquier dispositivo */
  export interface DeviceConfig {
    id: number;
    name: string;
    type: DeviceType;
    host: string;
    port: number;
    enabled: boolean;
    reconnectAttempts?: number;
    reconnectInterval?: number;
    timeout?: number;
  }
  
  /** Estado completo de un dispositivo */
  export interface DeviceState {
    id: number;
    status: DeviceStatus;
    lastError?: string;
    lastConnection?: Date;
    config: DeviceConfig;
  }
  
  /** Interfaz base para manejo de errores de dispositivo */
  export interface DeviceError extends Error {
    code: string;
    deviceId: number;
    deviceType: DeviceType;
    originalError?: unknown;
  }
  
  /** Opciones para operaciones de dispositivo */
  export interface DeviceOperationOptions {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    force?: boolean;
  }
  
  /** Eventos que puede emitir un dispositivo */
  export enum DeviceEvent {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    ERROR = 'error',
    STATE_CHANGE = 'stateChange',
    OPERATION_COMPLETE = 'operationComplete',
    OPERATION_ERROR = 'operationError'
  }
  
  /** Interfaz para manejadores de eventos de dispositivo */
  export interface DeviceEventHandlers {
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: DeviceError) => void;
    onStateChange?: (state: DeviceState) => void;
  }
  
  /** Resultado de una operación de dispositivo */
  export interface DeviceOperationResult<T = unknown> {
    success: boolean;
    deviceId: number;
    operationId: string;
    timestamp: Date;
    data?: T;
    error?: DeviceError;
  }