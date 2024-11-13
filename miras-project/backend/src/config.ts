// Ruta del fichero: /backend/src/config.ts

import path from 'path';

interface DeviceConfig {
  id: string;
  type: 'caspar' | 'vmix' | 'atem';
  name: string;
  host: string;
  port: number;
  enabled: boolean;
  options?: Record<string, any>;
}

interface WebSocketConfig {
  port: number;
  heartbeatInterval: number;
  reconnectTimeout: number;
}

interface DatabaseConfig {
  path: string;
  backupPath: string;
  maxBackups: number;
}

interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  path: string;
  maxFiles: number;
  maxSize: string;
}

export interface Config {
  env: string;
  devices: DeviceConfig[];
  websocket: WebSocketConfig;
  database: DatabaseConfig;
  logging: LogConfig;
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  
  devices: [
    {
      id: 'caspar1',
      type: 'caspar',
      name: 'CasparCG Main',
      host: '127.0.0.1',
      port: 5250,
      enabled: true,
      options: {
        channels: [1, 2],
        reconnectDelay: 5000,
        osc: {
          port: 6250
        }
      }
    }
  ],

  websocket: {
    port: parseInt(process.env.WS_PORT || '8080', 10),
    heartbeatInterval: 30000,
    reconnectTimeout: 5000
  },

  database: {
    path: path.join(__dirname, '../database.sqlite'),
    backupPath: path.join(__dirname, '../backups'),
    maxBackups: 5
  },

  logging: {
    level: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
    path: path.join(__dirname, '../logs'),
    maxFiles: 5,
    maxSize: '10mb'
  }
};

export { config };