// Ruta del fichero: /backend/src/devices/base/ServerManager.ts

import { EventEmitter } from 'events';
import { DeviceServer } from './DeviceServer';
import { ServerStatus, ServerConfig, ServerType } from './types';

export class ServerManager extends EventEmitter {
  private servers: Map<string, DeviceServer> = new Map();

  constructor() {
    super();
  }

  async addServer(config: ServerConfig): Promise<string> {
    const serverId = `${config.type}-${config.host}:${config.port}`;
    
    if (this.servers.has(serverId)) {
      throw new Error(`Server ${serverId} already exists`);
    }

    const server = this.createServer(config);
    this.servers.set(serverId, server);

    // Configurar event listeners
    server.on('statusChange', (status: ServerStatus) => {
      this.emit('serverStatusChange', { serverId, status });
    });

    server.on('error', (error: Error) => {
      this.emit('serverError', { serverId, error });
    });

    try {
      await server.connect();
      return serverId;
    } catch (error) {
      this.servers.delete(serverId);
      throw error;
    }
  }

  removeServer(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.disconnect();
      this.servers.delete(serverId);
    }
  }

  getServer(serverId: string): DeviceServer | undefined {
    return this.servers.get(serverId);
  }

  getAllServers(): Map<string, DeviceServer> {
    return new Map(this.servers);
  }

  private createServer(config: ServerConfig): DeviceServer {
    switch (config.type) {
      case ServerType.CASPAR:
        const CasparServer = require('../caspar/CasparServer').default;
        return new CasparServer(config);
      // Aquí se añadirán más tipos de servidores en el futuro
      default:
        throw new Error(`Unsupported server type: ${config.type}`);
    }
  }

  async initialize(configs: ServerConfig[]): Promise<void> {
    const initPromises = configs.map(config => this.addServer(config));
    await Promise.all(initPromises);
  }

  async shutdown(): Promise<void> {
    const shutdownPromises = Array.from(this.servers.values()).map(server => 
      server.disconnect().catch(error => 
        console.error(`Error shutting down server: ${error.message}`)
      )
    );
    await Promise.all(shutdownPromises);
    this.servers.clear();
  }
}

export default ServerManager;