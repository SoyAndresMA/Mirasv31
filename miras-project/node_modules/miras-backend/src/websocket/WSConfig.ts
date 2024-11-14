// Ruta del fichero: /backend/src/websocket/WSConfig.ts

import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { WSMessageType, WSClient, WSEventCallback } from './types';
import { DeviceManager } from '../core/DeviceManager';
import { StateManager } from '../core/StateManager';
import { CommandManager } from '../core/CommandManager';
import { ProjectManager } from '../core/ProjectManager';
import { logger } from '../utils/logger';

interface WSManagerConfig {
  deviceManager: DeviceManager;
  stateManager: StateManager;
  commandManager: CommandManager;
  projectManager: ProjectManager;
}

export class WSManager {
  private clients: Map<string, WSClient>;
  private deviceManager: DeviceManager;
  private stateManager: StateManager;
  private commandManager: CommandManager;
  private projectManager: ProjectManager;
  private eventHandlers: Map<WSMessageType, WSEventCallback[]>;

  constructor(config: WSManagerConfig) {
    this.clients = new Map();
    this.deviceManager = config.deviceManager;
    this.stateManager = config.stateManager;
    this.commandManager = config.commandManager;
    this.projectManager = config.projectManager;
    this.eventHandlers = new Map();
    this.initializeEventHandlers();
  }

  handleConnection(ws: WebSocket, request: IncomingMessage) {
    const clientId = this.generateClientId();
    
    const client: WSClient = {
      id: clientId,
      ws,
      isAlive: true,
      lastPing: Date.now()
    };

    this.clients.set(clientId, client);
    logger.info(`Cliente WebSocket conectado: ${clientId}`);

    // Configurar ping/pong
    ws.on('pong', () => this.handlePong(clientId));

    // Manejar mensajes
    ws.on('message', (data: string) => this.handleMessage(clientId, data));

    // Manejar desconexión
    ws.on('close', () => this.handleDisconnection(clientId));

    // Enviar estado inicial
    this.sendInitialState(client);
  }

  private sendInitialState(client: WSClient) {
    const state = this.stateManager.getCurrentState();
    this.sendToClient(client, {
      type: 'STATE_UPDATE',
      payload: state
    });
  }

  private handleMessage(clientId: string, data: string) {
    try {
      const message = JSON.parse(data);
      if (!this.isValidMessage(message)) {
        throw new Error('Mensaje inválido');
      }

      const handlers = this.eventHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => handler(message.payload, clientId));
      }

    } catch (error) {
      logger.error(`Error procesando mensaje de ${clientId}:`, error);
      this.sendError(clientId, 'Error procesando mensaje');
    }
  }

  private initializeEventHandlers() {
    // Comandos de dispositivo
    this.on('DEVICE_COMMAND', async (payload, clientId) => {
      try {
        await this.commandManager.executeCommand(payload);
        const newState = this.stateManager.getCurrentState();
        this.broadcastState(newState);
      } catch (error) {
        this.sendError(clientId, `Error ejecutando comando: ${error.message}`);
      }
    });

    // Operaciones de proyecto
    this.on('PROJECT_OPERATION', async (payload, clientId) => {
      try {
        await this.projectManager.handleOperation(payload);
        const newState = this.stateManager.getCurrentState();
        this.broadcastState(newState);
      } catch (error) {
        this.sendError(clientId, `Error en operación de proyecto: ${error.message}`);
      }
    });

    // Estado de conexión de dispositivo
    this.on('DEVICE_CONNECT', async (payload, clientId) => {
      try {
        await this.deviceManager.connectDevice(payload.deviceId);
        const newState = this.stateManager.getCurrentState();
        this.broadcastState(newState);
      } catch (error) {
        this.sendError(clientId, `Error conectando dispositivo: ${error.message}`);
      }
    });
  }

  private broadcastState(state: any) {
    this.broadcast({
      type: 'STATE_UPDATE',
      payload: state
    });
  }

  private broadcast(message: any) {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    });
  }

  private sendToClient(client: WSClient, message: any) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private sendError(clientId: string, error: string) {
    const client = this.clients.get(clientId);
    if (client) {
      this.sendToClient(client, {
        type: 'ERROR',
        payload: { message: error }
      });
    }
  }

  private handlePong(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.isAlive = true;
      client.lastPing = Date.now();
    }
  }

  private handleDisconnection(clientId: string) {
    this.clients.delete(clientId);
    logger.info(`Cliente WebSocket desconectado: ${clientId}`);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isValidMessage(message: any): message is { type: WSMessageType; payload: any } {
    return message && typeof message.type === 'string' && message.hasOwnProperty('payload');
  }

  public on(type: WSMessageType, callback: WSEventCallback) {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type)?.push(callback);
  }

  public startHeartbeat(interval: number = 30000) {
    setInterval(() => {
      this.clients.forEach((client, id) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(id);
          return;
        }

        client.isAlive = false;
        client.ws.ping();
      });
    }, interval);
  }
}