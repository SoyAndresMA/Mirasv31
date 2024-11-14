// /backend/src/devices/caspar/CasparConnection.ts

import { CasparcgConnection } from 'casparcg-connection';
import { CasparConfig } from './types';
import { DeviceConnectionError } from '../base/errors';

export class CasparConnection {
  private connection: CasparcgConnection | null = null;
  private config: CasparConfig;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: CasparConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.connection = new CasparcgConnection({
        host: this.config.host,
        port: this.config.port,
        autoConnect: false,
      });

      await this.connection.connect();
      console.log(`[CasparCG] Connected to ${this.config.host}:${this.config.port}`);
      
      this.connection.on('error', this.handleError.bind(this));
      this.connection.on('disconnected', this.handleDisconnect.bind(this));

      // Reset reconnection state on successful connection
      this.reconnectAttempts = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    } catch (error) {
      throw new DeviceConnectionError('CasparCG', error.message);
    }
  }

  private handleError(error: Error): void {
    console.error('[CasparCG] Connection error:', error);
    this.attemptReconnect();
  }

  private handleDisconnect(): void {
    console.log('[CasparCG] Disconnected');
    this.attemptReconnect();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[CasparCG] Max reconnection attempts reached');
      return;
    }

    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(async () => {
        this.reconnectAttempts++;
        console.log(`[CasparCG] Attempting reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        try {
          await this.connect();
        } catch (error) {
          console.error('[CasparCG] Reconnection failed:', error);
          this.reconnectTimer = null;
          this.attemptReconnect();
        }
      }, 5000); // 5 second delay between attempts
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.disconnect();
      this.connection = null;
    }
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.connection) {
      throw new DeviceConnectionError('CasparCG', 'Not connected');
    }

    try {
      await this.connection.executeCommand(command);
    } catch (error) {
      throw new DeviceConnectionError('CasparCG', `Command failed: ${error.message}`);
    }
  }

  isConnected(): boolean {
    return this.connection?.connected || false;
  }
}