// Ruta del fichero: backend/src/core/DeviceManager.ts

import { EventEmitter } from 'events';
import { DeviceServer } from '../devices/base/DeviceServer';
import { DeviceConfig, DeviceType, DeviceState, DeviceStatus, DeviceError } from '../devices/base/types';
import { Database } from '../database/connection';

export enum DeviceManagerEvent {
  DEVICE_REGISTERED = 'deviceRegistered',
  DEVICE_UNREGISTERED = 'deviceUnregistered',
  DEVICE_CONNECTED = 'deviceConnected',
  DEVICE_DISCONNECTED = 'deviceDisconnected',
  DEVICE_ERROR = 'deviceError',
  CONFIG_UPDATED = 'configUpdated'
}

interface DeviceConstructor {
  new (config: DeviceConfig): DeviceServer;
}

export class DeviceManager extends EventEmitter {
  private static instance: DeviceManager;
  private devices: Map<number, DeviceServer>;
  private deviceFactories: Map<DeviceType, DeviceConstructor>;
  private readonly db: Database;

  private constructor(db: Database) {
    super();
    this.devices = new Map();
    this.deviceFactories = new Map();
    this.db = db;
  }

  public static getInstance(db: Database): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager(db);
    }
    return DeviceManager.instance;
  }

  /**
   * Registra un nuevo tipo de dispositivo en el sistema
   */
  public registerDeviceType(type: DeviceType, factory: DeviceConstructor): void {
    this.deviceFactories.set(type, factory);
  }

  /**
   * Inicializa los dispositivos desde la base de datos
   */
  public async initialize(): Promise<void> {
    try {
      const configs = await this.db.getAllDeviceConfigs();
      
      for (const config of configs) {
        if (config.enabled) {
          await this.registerDevice(config);
        }
      }
    } catch (error) {
      console.error('Error initializing devices:', error);
      throw error;
    }
  }

  /**
   * Registra un nuevo dispositivo
   */
  public async registerDevice(config: DeviceConfig): Promise<DeviceServer> {
    const factory = this.deviceFactories.get(config.type);
    if (!factory) {
      throw new Error(`Unsupported device type: ${config.type}`);
    }

    try {
      // Crear instancia del dispositivo
      const device = new factory(config);
      
      // Configurar listeners
      this.setupDeviceListeners(device);
      
      // Almacenar dispositivo
      this.devices.set(config.id, device);
      
      // Emitir evento
      this.emit(DeviceManagerEvent.DEVICE_REGISTERED, device.getState());

      // Intentar conexión inicial si está habilitado
      if (config.enabled) {
        await device.connect();
      }

      return device;
    } catch (error) {
      console.error(`Error registering device ${config.id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un dispositivo del sistema
   */
  public async unregisterDevice(deviceId: number): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return;
    }

    try {
      // Desconectar el dispositivo
      await device.disconnect();
      
      // Eliminar listeners
      device.removeAllListeners();
      
      // Eliminar del mapa
      this.devices.delete(deviceId);
      
      // Emitir evento
      this.emit(DeviceManagerEvent.DEVICE_UNREGISTERED, deviceId);
    } catch (error) {
      console.error(`Error unregistering device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza la configuración de un dispositivo
   */
  public async updateDeviceConfig(deviceId: number, updates: Partial<DeviceConfig>): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    try {
      // Actualizar en base de datos
      const currentConfig = device.getState().config;
      const newConfig = { ...currentConfig, ...updates };
      await this.db.updateDeviceConfig(deviceId, newConfig);

      // Reconectar si es necesario
      if (device.getState().status === DeviceStatus.CONNECTED) {
        await device.disconnect();
        await device.connect();
      }

      this.emit(DeviceManagerEvent.CONFIG_UPDATED, deviceId, newConfig);
    } catch (error) {
      console.error(`Error updating device ${deviceId} config:`, error);
      throw error;
    }
  }

  /**
   * Obtiene un dispositivo por su ID
   */
  public getDevice(deviceId: number): DeviceServer | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Obtiene el estado de un dispositivo
   */
  public getDeviceState(deviceId: number): DeviceState | undefined {
    return this.devices.get(deviceId)?.getState();
  }

  /**
   * Obtiene todos los dispositivos registrados
   */
  public getAllDevices(): Map<number, DeviceServer> {
    return new Map(this.devices);
  }

  /**
   * Conecta todos los dispositivos habilitados
   */
  public async connectAllDevices(): Promise<void> {
    const promises = Array.from(this.devices.values())
      .filter(device => device.getState().config.enabled)
      .map(device => device.connect());

    await Promise.all(promises);
  }

  /**
   * Desconecta todos los dispositivos
   */
  public async disconnectAllDevices(): Promise<void> {
    const promises = Array.from(this.devices.values())
      .map(device => device.disconnect());

    await Promise.all(promises);
  }

  /**
   * Configura los listeners para un dispositivo
   */
  private setupDeviceListeners(device: DeviceServer): void {
    device.on('connected', () => {
      this.emit(DeviceManagerEvent.DEVICE_CONNECTED, device.getState());
    });

    device.on('disconnected', () => {
      this.emit(DeviceManagerEvent.DEVICE_DISCONNECTED, device.getState());
    });

    device.on('error', (error: DeviceError) => {
      this.emit(DeviceManagerEvent.DEVICE_ERROR, device.getState(), error);
    });

    device.on('stateChange', (state: DeviceState) => {
      // Propagar cambios de estado
      this.emit('deviceStateChange', state);
    });
  }

  /**
   * Limpieza al cerrar la aplicación
   */
  public async shutdown(): Promise<void> {
    await this.disconnectAllDevices();
    this.devices.clear();
    this.deviceFactories.clear();
    this.removeAllListeners();
    DeviceManager.instance = undefined as any;
  }
}