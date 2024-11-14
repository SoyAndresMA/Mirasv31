// Ruta del fichero: /frontend/src/types/index.ts

// Tipos base para todos los servidores
export interface ServerConfig {
    id: string;
    name: string;
    type: 'caspar' | 'vmix' | 'atem';
    host: string;
    port: number;
    status: 'connected' | 'disconnected' | 'error';
    lastError?: string;
  }
  
  // Tipos específicos para CasparCG
  export interface CasparConfig extends ServerConfig {
    type: 'caspar';
    channels: number[];
    amcpPort: number;
    oscPort: number;
  }
  
  // Tipos para estado del sistema
  export interface SystemState {
    servers: {
      [key: string]: ServerConfig;
    };
    activeProject?: Project;
    lastError?: string;
    isConnected: boolean;
  }
  
  // Tipos para WebSocket
  export type WSMessageType = 
    | 'DEVICE_COMMAND' 
    | 'PROJECT_OPERATION' 
    | 'STATE_UPDATE' 
    | 'ERROR' 
    | 'DEVICE_CONNECT';
  
  export interface WSMessage<T = unknown> {
    type: WSMessageType;
    payload: T;
  }
  
  // Tipos para proyectos y eventos
  export interface Project {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    events: MEvent[];
  }
  
  export interface MEvent {
    id: number;
    title: string;
    order: number;
    projectId: number;
    items: MItem[];
    union?: MItemUnion;
  }
  
  // Tipos base para items
  export interface MItemBase {
    id: number;
    type: string;
    position: {
      row: number;
      column: number;
    };
    union?: MItemUnion;
  }
  
  // Tipos específicos para CasparCG
  export interface MClipCaspar extends MItemBase {
    type: 'mclip';
    channel: number;
    layer: number;
    clipName: string;
    videoPath: string;
    loop?: boolean;
  }
  
  export interface MGraphicsCaspar extends MItemBase {
    type: 'mgraphics';
    channel: number;
    layer: number;
    templateName: string;
    templatePath: string;
    data: Record<string, unknown>;
  }
  
  export interface MPromptCaspar extends MItemBase {
    type: 'mprompt';
    channel: number;
    layer: number;
    text: string;
  }
  
  // Tipo unión para todos los items
  export type MItem = MClipCaspar | MGraphicsCaspar | MPromptCaspar;
  
  // Tipos para uniones
  export interface MItemUnion {
    id: number;
    type: 'parallel' | 'sequential' | 'manual' | 'infinite';
    position: number;
    delay: number;
  }
  
  // Tipos para comandos
  export interface DeviceCommand {
    deviceId: string;
    command: string;
    parameters: unknown[];
  }
  
  export interface ProjectOperation {
    type: 'create' | 'update' | 'delete';
    projectId?: number;
    data?: unknown;
  }
  
  // Tipos para respuestas de error
  export interface ErrorResponse {
    message: string;
    code?: string;
    details?: unknown;
  }
  
  // Type guards
  export function isMClipCaspar(item: MItem): item is MClipCaspar {
    return item.type === 'mclip';
  }
  
  export function isMGraphicsCaspar(item: MItem): item is MGraphicsCaspar {
    return item.type === 'mgraphics';
  }
  
  export function isMPromptCaspar(item: MItem): item is MPromptCaspar {
    return item.type === 'mprompt';
  }
  
  // Tipos para estado de items
  export type ItemState = 'playing' | 'stopped' | 'paused' | 'error';
  
  export interface ItemStatus {
    id: number;
    state: ItemState;
    error?: string;
    position?: number;
    duration?: number;
  }
  
  // Tipos para configuración de la aplicación
  export interface AppConfig {
    wsUrl: string;
    apiUrl: string;
    environment: 'development' | 'production';
    debug: boolean;
  }
  
  // Tipos para autenticación
  export interface AuthState {
    isAuthenticated: boolean;
    user?: {
      id: string;
      name: string;
      role: string;
    };
    token?: string;
  }
  
  // Tipos para notificaciones
  export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number;
  }