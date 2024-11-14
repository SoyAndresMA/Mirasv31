// Ruta del fichero: /backend/src/devices/caspar/items/MGraphics.ts

import { BaseItem } from '../../base/types';
import { CasparGraphicsConfig, CasparGraphicsState } from '../types';
import { CasparServer } from '../CasparServer';

export class CasparMGraphics implements BaseItem {
    private state: CasparGraphicsState = 'stopped';
    private server: CasparServer;
    private config: CasparGraphicsConfig;
    private currentData: Record<string, any> = {};

    constructor(server: CasparServer, config: CasparGraphicsConfig) {
        this.server = server;
        this.config = config;
    }

    async play(): Promise<void> {
        try {
            await this.server.playGraphics(
                this.config.channel,
                this.config.layer,
                this.config.templatePath,
                this.currentData
            );
            this.state = 'playing';
        } catch (error) {
            console.error('Error playing graphics:', error);
            throw new Error(`Failed to play graphics: ${error.message}`);
        }
    }

    async stop(): Promise<void> {
        try {
            await this.server.stopGraphics(this.config.channel, this.config.layer);
            this.state = 'stopped';
        } catch (error) {
            console.error('Error stopping graphics:', error);
            throw new Error(`Failed to stop graphics: ${error.message}`);
        }
    }

    async update(data: Record<string, any>): Promise<void> {
        try {
            await this.server.updateGraphics(
                this.config.channel,
                this.config.layer,
                data
            );
            this.currentData = { ...this.currentData, ...data };
        } catch (error) {
            console.error('Error updating graphics:', error);
            throw new Error(`Failed to update graphics: ${error.message}`);
        }
    }

    async getState(): Promise<CasparGraphicsState> {
        try {
            const state = await this.server.getGraphicsState(
                this.config.channel,
                this.config.layer
            );
            this.state = state;
            return state;
        } catch (error) {
            console.error('Error getting graphics state:', error);
            return this.state;
        }
    }

    getData(): Record<string, any> {
        return { ...this.currentData };
    }

    getConfig(): CasparGraphicsConfig {
        return { ...this.config };
    }

    private validateTemplatePath(): boolean {
        return Boolean(this.config.templatePath && this.config.templatePath.trim());
    }

    private validateChannel(): boolean {
        return this.config.channel > 0 && this.config.layer >= 0;
    }
}