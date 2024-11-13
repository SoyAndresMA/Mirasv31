// Ruta del fichero: backend/src/devices/caspar/CasparServer.ts

import net from 'net';
import { DeviceServer } from '../base/DeviceServer';
import { DeviceOperationResult, DeviceStatus } from '../base/types';
import {
  CasparConfig,
  CasparCommandType,
  CasparPlayParams,
  CasparLoadParams,
  CasparTemplateParams,
  CasparChannelState,
  CasparItemState,
  CasparClipResult,
  CasparTemplateResult
} from './types';

export class CasparServer extends DeviceServer {
  private socket: net.Socket | null = null;
  private messageBuffer: string = '';
  private channels: Map<number, CasparChannelState>;
  private commandQueue: Array<{
    command: string;
    resolve: (value: DeviceOperationResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private readonly config: CasparConfig;

  constructor(config: CasparConfig) {
    super(config);
    this.config = config;
    this.channels = new Map();
    this.initializeChannels();
  }

  private initializeChannels(): void {
    this.config.channels.forEach(channelNumber => {
      this.channels.set(channelNumber, {
        channel: channelNumber,
        layers: new Map(),
        format: 'unknown',
        width: 1,
        height: 1080,
        fps: 25
      });
    });
  }

  protected async establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();

      this.socket.on('connect', () => {
        this.socket?.write('VERSION\r\n'); // Verificar versión al conectar
        resolve();
      });

      this.socket.on('data', (data) => {
        this.handleData(data.toString());
      });

      this.socket.on('error', (error) => {
        this.handleError(this.createError('SOCKET_ERROR', error));
      });

      this.socket.on('close', () => {
        if (this.state.status !== DeviceStatus.DISCONNECTED) {
          this.handleError(this.createError('CONNECTION_CLOSED'));
        }
      });

      try {
        this.socket.connect({
          host: this.config.host,
          port: this.config.port
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  protected async closeConnection(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket) {
        this.socket.end(() => {
          this.socket = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  protected validateConnection(): boolean {
    return this.socket !== null && this.socket.writable;
  }

  private handleData(data: string): void {
    this.messageBuffer += data;

    // Procesar mensajes completos
    let newlineIndex;
    while ((newlineIndex = this.messageBuffer.indexOf('\r\n')) !== -1) {
      const message = this.messageBuffer.substring(0, newlineIndex);
      this.messageBuffer = this.messageBuffer.substring(newlineIndex + 2);
      
      if (message.startsWith('RET')) {
        this.handleResponse(message);
      } else {
        this.handleInfo(message);
      }
    }
  }

  private handleResponse(message: string): void {
    const cmd = this.commandQueue.shift();
    if (!cmd) return;

    if (message.startsWith('RET 200')) {
      cmd.resolve({
        success: true,
        deviceId: this.state.id,
        operationId: message.split(' ')[2] || '0',
        timestamp: new Date()
      });
    } else {
      const error = this.createError('COMMAND_FAILED', new Error(message));
      cmd.reject(error);
    }
  }

  private handleInfo(message: string): void {
    // Procesar información de estado de canales y capas
    if (message.startsWith('INFO')) {
      const parts = message.split(' ');
      const channel = parseInt(parts[1]);
      const channelState = this.channels.get(channel);
      
      if (channelState && parts.length > 2) {
        const info = this.parseInfoMessage(parts.slice(2).join(' '));
        this.updateChannelState(channel, info);
      }
    }
  }

  private parseInfoMessage(info: string): Partial<CasparChannelState> {
    try {
      const data = JSON.parse(info);
      return {
        format: data.format,
        width: data.width,
        height: data.height,
        fps: data.fps
      };
    } catch {
      return {};
    }
  }

  private updateChannelState(channel: number, update: Partial<CasparChannelState>): void {
    const current = this.channels.get(channel);
    if (current) {
      this.channels.set(channel, { ...current, ...update });
      this.emit('channelStateChange', channel, this.channels.get(channel));
    }
  }

  public async executeCommand(
    command: string,
    params?: unknown
  ): Promise<DeviceOperationResult> {
    if (!this.validateConnection()) {
      throw this.createError('NOT_CONNECTED');
    }

    return new Promise((resolve, reject) => {
      const formattedCommand = this.formatCommand(command, params);
      
      this.commandQueue.push({ command: formattedCommand, resolve, reject });
      
      this.socket?.write(formattedCommand + '\r\n', (error) => {
        if (error) {
          const cmd = this.commandQueue.pop();
          if (cmd) {
            cmd.reject(this.createError('SEND_FAILED', error));
          }
        }
      });
    });
  }

  private formatCommand(command: string, params?: unknown): string {
    switch (command) {
      case CasparCommandType.PLAY:
        return this.formatPlayCommand(params as CasparPlayParams);
      case CasparCommandType.LOAD:
        return this.formatLoadCommand(params as CasparLoadParams);
      case CasparCommandType.ADD:
        return this.formatTemplateCommand(params as CasparTemplateParams);
      // Añadir más casos según sea necesario
      default:
        return command;
    }
  }

  private formatPlayCommand(params: CasparPlayParams): string {
    const { channel, layer, clipName, loop, transition } = params;
    let cmd = `PLAY ${channel}-${layer} "${clipName}"`;
    
    if (loop) {
      cmd += ' LOOP';
    }
    
    if (transition) {
      cmd += ` ${transition.type.toUpperCase()}`;
      if (transition.duration) {
        cmd += ` ${transition.duration}`;
      }
    }
    
    return cmd;
  }

  private formatLoadCommand(params: CasparLoadParams): string {
    const { channel, layer, clipName, loop } = params;
    let cmd = `LOAD ${channel}-${layer} "${clipName}"`;
    
    if (loop) {
      cmd += ' LOOP';
    }
    
    return cmd;
  }

  private formatTemplateCommand(params: CasparTemplateParams): string {
    const { channel, layer, template, playOnLoad, data } = params;
    let cmd = `CG ${channel}-${layer} ADD "${template}" ${playOnLoad ? '1' : '0'}`;
    
    if (data) {
      cmd += ` '${JSON.stringify(data)}'`;
    }
    
    return cmd;
  }

  // Métodos públicos de conveniencia
  public async play(params: CasparPlayParams): Promise<CasparClipResult> {
    return this.executeCommand(CasparCommandType.PLAY, params) as Promise<CasparClipResult>;
  }

  public async loadTemplate(params: CasparTemplateParams): Promise<CasparTemplateResult> {
    return this.executeCommand(CasparCommandType.ADD, params) as Promise<CasparTemplateResult>;
  }

  public async getChannelInfo(channel: number): Promise<CasparChannelState | undefined> {
    await this.executeCommand(`INFO ${channel}`);
    return this.channels.get(channel);
  }

  public getDefaultChannel(): number {
    return this.config.defaultChannel || this.config.channels[0];
  }

  public getDefaultLayer(): number {
    return this.config.defaultLayer || 1;
  }
}