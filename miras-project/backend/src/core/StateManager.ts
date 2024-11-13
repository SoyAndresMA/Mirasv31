// Ruta del fichero: backend/src/core/StateManager.ts

import { EventEmitter } from 'events';
import { DeviceServer } from '../devices/base/DeviceServer';
import { DeviceState, DeviceStatus } from '../devices/base/types';
import { ProjectManager, ProjectManagerEvent } from './ProjectManager';

export interface SystemState {
  activeProject: number | null;
  devices: Map<number, DeviceState>;
  connectedClients: number;
  lastUpdate: Date;
}

export enum StateManagerEvent {
  STATE_UPDATED = 'stateUpdated',
  DEVICE_UPDATED = 'deviceUpdated',
  CLIENT_CONNECTED = 'clientConnected',
  CLIENT_DISCONNECTED = 'clientDisconnected',
  ERROR = 'error'
}

export class StateManager extends EventEmitter {
  private static instance: StateManager;
  private state: SystemState;
  private devices: Map<number, DeviceServer>;
  private projectManager: ProjectManager;

  private constructor(projectManager: ProjectManager) {
    super();
    this.projectManager = projectManager;
    this.devices = new Map();
    this.state = {
      activeProject: null,
      devices: new Map(),
      connectedClients: 0,
      lastUpdate: new Date()
    };

    this.setupProjectManagerListeners();
  }

  public static getInstance(projectManager: ProjectManager): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager(projectManager);
    }
    return StateManager.instance;
  }

  public getState(): SystemState {
    return {
      ...this.state,
      devices: new Map(this.state.devices),
      lastUpdate: new Date(this.state.lastUpdate)
    };
  }

  public registerDevice(device: DeviceServer): void {
    this.devices.set(device.getState().id, device);
    this.state.devices.set(device.getState().id, device.getState());
    
    device.on('stateChange', (deviceState: DeviceState) => {
      this.updateDeviceState(deviceState);
    });

    this.updateState();
  }

  public unregisterDevice(deviceId: number): void {
    this.devices.delete(deviceId);
    this.state.devices.delete(deviceId);
    this.updateState();
  }

  public getDevice(deviceId: number): DeviceServer | undefined {
    return this.devices.get(deviceId);
  }

  public getDeviceState(deviceId: number): DeviceState | undefined {
    return this.state.devices.get(deviceId);
  }

  public clientConnected(): void {
    this.state.connectedClients++;
    this.emit(StateManagerEvent.CLIENT_CONNECTED, this.state.connectedClients);
    this.updateState();
  }

  public clientDisconnected(): void {
    this.state.connectedClients--;
    this.emit(StateManagerEvent.CLIENT_DISCONNECTED, this.state.connectedClients);
    this.updateState();
  }

  private updateDeviceState(deviceState: DeviceState): void {
    this.state.devices.set(deviceState.id, deviceState);
    this.emit(StateManagerEvent.DEVICE_UPDATED, deviceState);
    this.updateState();
  }

  private updateState(): void {
    this.state.lastUpdate = new Date();
    this.emit(StateManagerEvent.STATE_UPDATED, this.getState());
  }

  public async connectAllDevices(): Promise<void> {
    const connectionPromises = Array.from(this.devices.values()).map(device => {
      return device.connect().catch(error => {
        this.emit(StateManagerEvent.ERROR, {
          deviceId: device.getState().id,
          error
        });
      });
    });

    await Promise.all(connectionPromises);
  }

  public async disconnectAllDevices(): Promise<void> {
    const disconnectionPromises = Array.from(this.devices.values()).map(device => {
      return device.disconnect().catch(error => {
        this.emit(StateManagerEvent.ERROR, {
          deviceId: device.getState().id,
          error
        });
      });
    });

    await Promise.all(disconnectionPromises);
  }

  private setupProjectManagerListeners(): void {
    this.projectManager.on(ProjectManagerEvent.PROJECT_LOADED, (project) => {
      this.state.activeProject = project.id;
      this.updateState();
    });

    this.projectManager.on(ProjectManagerEvent.PROJECT_CLOSED, () => {
      this.state.activeProject = null;
      this.updateState();
    });
  }

  public async shutdown(): Promise<void> {
    await this.disconnectAllDevices();
    this.removeAllListeners();
    StateManager.instance = undefined as any;
  }
}