// Ruta del fichero: /backend/src/devices/caspar/CasparServerConfig.ts

interface CasparChannel {
    id: number;
    videoMode: string;
    frameRate: number;
   }
   
   interface CasparLayer {
    id: number;
    type: 'video' | 'graphics' | 'audio';
   }
   
   interface CasparTemplate {
    name: string;
    path: string;
    fields: {
      name: string;
      type: 'text' | 'number' | 'boolean' | 'color';
      default?: any;
    }[];
   }
   
   export interface CasparServerConfig {
    // Conexión básica
    host: string;
    amcpPort: number;
    oscPort?: number;
    
    // Tiempo de espera para operaciones
    connectionTimeout: number;
    commandTimeout: number;
    
    // Configuración de canales
    channels: CasparChannel[];
    
    // Configuración de capas por canal
    layers: Record<number, CasparLayer[]>;
    
    // Rutas de medios
    mediaPath: string;
    templatesPath: string;
    
    // Templates disponibles
    templates: CasparTemplate[];
    
    // Opciones de reproducción por defecto
    defaultVideoMode?: string;
    defaultFrameRate?: number;
    
    // Opciones de reconexión
    reconnectAttempts: number;
    reconnectInterval: number;
    
    // Logging y debug
    enableOscLogging?: boolean;
    enableAmcpLogging?: boolean;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
    
    // Callbacks personalizados
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
   }
   
   export const DEFAULT_CONFIG: Partial<CasparServerConfig> = {
    connectionTimeout: 5000,
    commandTimeout: 2000,
    reconnectAttempts: 3,
    reconnectInterval: 5000,
    enableOscLogging: false,
    enableAmcpLogging: false,
    logLevel: 'info'
   };
   
   export function validateConfig(config: Partial<CasparServerConfig>): CasparServerConfig {
    if (!config.host) throw new Error('CasparCG host is required');
    if (!config.amcpPort) throw new Error('CasparCG AMCP port is required');
    if (!config.channels || config.channels.length === 0) {
      throw new Error('At least one channel must be configured');
    }
   
    return {
      ...DEFAULT_CONFIG,
      ...config
    } as CasparServerConfig;
   }