// Ruta del fichero: /backend/src/devices/caspar/items/MPrompt.ts

import { BaseItem } from '../../base/types';
import { CasparPromptConfig, CasparPromptState } from '../types';
import { CasparServer } from '../CasparServer';

export class CasparMPrompt implements BaseItem {
    private state: CasparPromptState = 'stopped';
    private server: CasparServer;
    private config: CasparPromptConfig;
    private currentText: string = '';

    constructor(server: CasparServer, config: CasparPromptConfig) {
        this.server = server;
        this.config = config;
        this.currentText = config.text || '';
    }

    async play(): Promise<void> {
        try {
            await this.server.playPrompt(
                this.config.channel,
                this.config.layer,
                this.currentText
            );
            this.state = 'playing';
        } catch (error) {
            console.error('Error playing prompt:', error);
            throw new Error(`Failed to play prompt: ${error.message}`);
        }
    }

    async stop(): Promise<void> {
        try {
            await this.server.stopPrompt(this.config.channel, this.config.layer);
            this.state = 'stopped';
        } catch (error) {
            console.error('Error stopping prompt:', error);
            throw new Error(`Failed to stop prompt: ${error.message}`);
        }
    }

    async update(text: string): Promise<void> {
        try {
            await this.server.updatePrompt(
                this.config.channel,
                this.config.layer,
                text
            );
            this.currentText = text;
        } catch (error) {
            console.error('Error updating prompt:', error);
            throw new Error(`Failed to update prompt: ${error.message}`);
        }
    }

    async getState(): Promise<CasparPromptState> {
        try {
            const state = await this.server.getPromptState(
                this.config.channel,
                this.config.layer
            );
            this.state = state;
            return state;
        } catch (error) {
            console.error('Error getting prompt state:', error);
            return this.state;
        }
    }

    getText(): string {
        return this.currentText;
    }

    getConfig(): CasparPromptConfig {
        return { ...this.config };
    }

    private validateText(): boolean {
        return Boolean(this.currentText.trim());
    }

    private validateChannel(): boolean {
        return this.config.channel > 0 && this.config.layer >= 0;
    }
}