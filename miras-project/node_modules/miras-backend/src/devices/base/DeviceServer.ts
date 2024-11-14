// Ruta del fichero: backend/src/devices/base/DeviceServer.ts

import { EventEmitter } from 'events';
import {
  DeviceConfig,
  DeviceState,
  DeviceStatus,
  DeviceError,
  DeviceEvent,
  DeviceEventHandlers,
  DeviceOperationOptions,
  DeviceOperationResult
} from './types';

export abstract class DeviceServer extends EventEmitter {
  protected state: DeviceState;
  protected connectionTimer?: NodeJS.Timeout;
  protected reconnectTimer?: NodeJS.Timeout;
  protected operationTimeouts: Map<string, NodeJS.Timeout>;

  constructor(config: DeviceConfig) {
    super();
    this.operationTimeouts = new Map();
    this.state = {
      id: config.id,
      status: DeviceStatus.DISCONNECTED,
      config: config
    };
  }

  /**
   * Inicia la conexión con el dispositivo
   */
  public async connect(): Promise<boolean> {
    try {
      if (this.state.status === DeviceStatus.CONNECTED) {
        return true;
      }

      this.updateState({ status: DeviceStatus.CONNECTING });
      
      // Implementar en la clase concreta
      await this.establishConnection();
      
      this.updateState({ 
        status: DeviceStatus.CONNECTED,
        lastConnection: new Date()
      });
      
      this.emit(DeviceEvent.CONNECTED);
      return true;
    } catch (error) {
      const deviceError = this.createError('CONNECTION_FAILED', error);
      this.handleError(deviceError);
      return false;
    }
  }

  /**
   * Cierra la conexión con el dispositivo
   */
  public async disconnect(): Promise<void> {
    try {
      // Implementar en la clase concreta
      await this.closeConnection();
      
      this.updateState({ status: DeviceStatus.DISCONNECTED });
      this.emit(DeviceEvent.DISCONNECTED);
    } catch (error) {
      const deviceError = this.createError('DISCONNECT_FAILED', error);
      this.handleError(deviceError);
    }
  }

  /**
   * Obtiene el estado actual del dispositivo
   */
  public getState(): DeviceState {
    return { ...this.state };
  }

  /**
   * Registra manejadores de eventos
   */
  public registerEventHandlers(handlers: DeviceEventHandlers): void {
    if (handlers.onConnected) {
      this.on(DeviceEvent.CONNECTED, handlers.onConnected);
    }
    if (handlers.onDisconnected) {
      this.on(DeviceEvent.DISCONNECTED, handlers.onDisconnected);
    }
    if (handlers.onError) {
      this.on(DeviceEvent.ERROR, handlers.onError);
    }
    if (handlers.onStateChange) {
      this.on(DeviceEvent.STATE_CHANGE, handlers.onStateChange);
    }
  }

  /**
   * Ejecuta una operación con control de timeout
   */
  protected async executeWithTimeout<T>(
    operation: () => Promise<T>,
    options?: DeviceOperationOptions
  ): Promise<DeviceOperationResult<T>> {
    const operationId = Math.random().toString(36).substring(7);
    const timeout = options?.timeout ?? this.state.config.timeout ?? 5000;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Operation timeout'));
        }, timeout);
        this.operationTimeouts.set(operationId, timer);
      });

      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);

      return {
        success: true,
        deviceId: this.state.id,
        operationId,
        timestamp: new Date(),
        data: result
      };
    } catch (error) {
      const deviceError = this.createError('OPERATION_FAILED', error);
      return {
        success: false,
        deviceId: this.state.id,
        operationId,
        timestamp: new Date(),
        error: deviceError
      };
    } finally {
      const timer = this.operationTimeouts.get(operationId);
      if (timer) {
        clearTimeout(timer);
        this.operationTimeouts.delete(operationId);
      }
    }
  }

  /**
   * Actualiza el estado del dispositivo
   */
  protected updateState(update: Partial<DeviceState>): void {
    this.state = { ...this.state, ...update };
    this.emit(DeviceEvent.STATE_CHANGE, this.getState());
  }

  /**
   * Maneja errores del dispositivo
   */
  protected handleError(error: DeviceError): void {
    this.updateState({
      status: DeviceStatus.ERROR,
      lastError: error.message
    });
    this.emit(DeviceEvent.ERROR, error);

    // Intentar reconexión si está configurado
    if (this.state.config.reconnectAttempts && this.state.config.reconnectInterval) {
      this.scheduleReconnect();
    }
  }

  /**
   * Programa un intento de reconexión
   */
  protected scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(async () => {
      await this.connect();
    }, this.state.config.reconnectInterval);
  }

  /**
   * Crea un error tipado del dispositivo
   */
  protected createError(code: string, originalError?: unknown): DeviceError {
    const error = new Error() as DeviceError;
    error.name = 'DeviceError';
    error.code = code;
    error.deviceId = this.state.id;
    error.deviceType = this.state.config.type;
    error.message = originalError instanceof Error ? originalError.message : 'Unknown error';
    error.originalError = originalError;
    return error;
  }

  /**
   * Métodos abstractos que deben implementar las clases concretas
   */
  protected abstract establishConnection(): Promise<void>;
  protected abstract closeConnection(): Promise<void>;
  protected abstract validateConnection(): boolean;
  public abstract executeCommand(command: string, params?: unknown): Promise<DeviceOperationResult>;
}