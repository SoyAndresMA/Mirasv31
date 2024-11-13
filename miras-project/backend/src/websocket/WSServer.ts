// Ruta del fichero: backend/src/websocket/WSServer.ts

import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { 
  StateManager, 
  StateManagerEvent 
} from '../core/StateManager';
import { 
  ProjectManager, 
  ProjectManagerEvent 
} from '../core/ProjectManager';
import { 
  DeviceManager, 
  DeviceManagerEvent 
} from '../core/DeviceManager';
import { WebSocketMessage, WSCommandMessage } from './types';

export class WSServer extends EventEmitter {
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;
  private readonly stateManager: StateManager;
  private readonly projectManager: ProjectManager;
  private readonly deviceManager: DeviceManager;

  constructor(
    port: number,
    stateManager: StateManager,
    projectManager: ProjectManager,
    deviceManager: DeviceManager
  ) {
    super();
    this.wss = new WebSocketServer({ port });
    this.clients = new Set();
    this.stateManager = stateManager;
    this.projectManager = projectManager;
    this.deviceManager = deviceManager;

    this.setupWSServer();
    this.setupStateListeners();
    this.setupProjectListeners();
    this.setupDeviceListeners();
  }

  private setupWSServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New client connected');
      this.clients.add(ws);
      this.stateManager.clientConnected();

      // Enviar estado inicial
      this.sendToClient(ws, 'initialState', {
        system: this.stateManager.getState(),
        project: this.projectManager.getCurrentProject()
      });

      ws.on('message', (data: string) => {
        try {
          const message: WebSocketMessage = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error handling message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
        this.stateManager.clientDisconnected();
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.sendError(ws, 'WebSocket error occurred');
      });
    });
  }

  private setupStateListeners(): void {
    this.stateManager.on(StateManagerEvent.STATE_UPDATED, (state) => {
      this.broadcast('stateUpdate', state);
    });

    this.stateManager.on(StateManagerEvent.DEVICE_UPDATED, (deviceState) => {
      this.broadcast('deviceUpdate', deviceState);
    });

    this.stateManager.on(StateManagerEvent.ERROR, (error) => {
      this.broadcast('error', error);
    });
  }

  private setupProjectListeners(): void {
    this.projectManager.on(ProjectManagerEvent.PROJECT_LOADED, (project) => {
      this.broadcast('projectLoaded', project);
    });

    this.projectManager.on(ProjectManagerEvent.PROJECT_SAVED, (project) => {
      this.broadcast('projectSaved', project);
    });

    this.projectManager.on(ProjectManagerEvent.EVENT_UPDATED, (event) => {
      this.broadcast('eventUpdated', event);
    });

    this.projectManager.on(ProjectManagerEvent.ITEM_UPDATED, (item) => {
      this.broadcast('itemUpdated', item);
    });
  }

  private setupDeviceListeners(): void {
    this.deviceManager.on(DeviceManagerEvent.DEVICE_CONNECTED, (deviceState) => {
      this.broadcast('deviceConnected', deviceState);
    });

    this.deviceManager.on(DeviceManagerEvent.DEVICE_DISCONNECTED, (deviceState) => {
      this.broadcast('deviceDisconnected', deviceState);
    });

    this.deviceManager.on(DeviceManagerEvent.DEVICE_ERROR, (deviceState, error) => {
      this.broadcast('deviceError', { deviceState, error });
    });
  }

  private async handleMessage(ws: WebSocket, message: WebSocketMessage): Promise<void> {
    console.log('Received message:', message.type);

    try {
      switch (message.type) {
        case 'command':
          await this.handleCommand(ws, message as WSCommandMessage);
          break;

        case 'loadProject':
          await this.projectManager.loadProject(message.payload.projectId);
          break;

        case 'saveProject':
          await this.projectManager.saveProject();
          break;

        case 'updateEvent':
          await this.projectManager.updateEvent(
            message.payload.eventId,
            message.payload.updates
          );
          break;

        case 'updateItem':
          await this.projectManager.updateItem(
            message.payload.itemId,
            message.payload.updates
          );
          break;

        case 'deviceCommand':
          const device = this.deviceManager.getDevice(message.payload.deviceId);
          if (device) {
            await device.executeCommand(
              message.payload.command,
              message.payload.params
            );
          } else {
            throw new Error(`Device ${message.payload.deviceId} not found`);
          }
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendError(ws, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async handleCommand(ws: WebSocket, message: WSCommandMessage): Promise<void> {
    const { command, params } = message.payload;
    console.log('Executing command:', command, params);

    try {
      const result = await this.executeCommand(command, params);
      this.sendToClient(ws, 'commandResult', {
        command,
        success: true,
        result
      });
    } catch (error) {
      this.sendError(ws, `Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeCommand(command: string, params: any): Promise<any> {
    // Implementar lógica de comandos según necesidades
    switch (command) {
      // Añadir casos según se necesiten
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  private broadcast(type: string, payload: any): void {
    const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private sendToClient(ws: WebSocket, type: string, payload: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type,
        payload,
        timestamp: new Date().toISOString()
      }));
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendToClient(ws, 'error', { message: error });
  }

  public shutdown(): void {
    this.clients.forEach(client => {
      client.close();
    });
    this.wss.close();
    this.removeAllListeners();
  }
}