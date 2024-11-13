// Ruta del fichero: /backend/src/devices/caspar/items/MClip.ts

import { BaseItem } from '../../base/types';
import { CasparClipConfig, CasparClipState } from '../types';
import { CasparServer } from '../CasparServer';

export class CasparMClip implements BaseItem {
    private state: CasparClipState = 'stopped';
    private server: CasparServer;
    private config: CasparClipConfig;

    constructor(server: CasparServer, config: CasparClipConfig) {
        this.server = server;
        this.config = config;
    }

    async play(): Promise<void> {
        try {
            await this.server.play(
                this.config.channel,
                this.config.layer,
                this.config.clipName,
                this.config.loop
            );
            this.state = 'playing';
        } catch (error) {
            console.error('Error playing clip:', error);
            throw new Error(`Failed to play clip: ${error.message}`);
        }
    }

    async stop(): Promise<void> {
        try {
            await this.server.stop(this.config.channel, this.config.layer);
            this.state = 'stopped';
        } catch (error) {
            console.error('Error stopping clip:', error);
            throw new Error(`Failed to stop clip: ${error.message}`);
        }
    }

    async getState(): Promise<CasparClipState> {
        try {
            const state = await this.server.getClipState(
                this.config.channel,
                this.config.layer
            );
            this.state = state;
            return state;
        } catch (error) {
            console.error('Error getting clip state:', error);
            return this.state;
        }
    }

    setLoop(enabled: boolean): void {
        this.config.loop = enabled;
    }

    getConfig(): CasparClipConfig {
        return { ...this.config };
    }

    private validateClipPath(): boolean {
        return Boolean(this.config.clipName && this.config.clipName.trim());
    }

    private validateChannel(): boolean {
        return this.config.channel > 0 && this.config.layer >= 0;
    }
}