// Ruta del fichero: /frontend/src/core/state/SystemState.ts

import { DeviceState, PlaybackState } from '../websocket/types';

export interface SystemStateItem {
    id: number;
    type: string;
    state: PlaybackState;
    lastUpdate: number;
    details?: any;
}

export interface SystemStateDevice {
    id: number;
    type: string;
    name: string;
    state: DeviceState;
    lastUpdate: number;
    details?: any;
}

export interface SystemState {
    items: Map<number, SystemStateItem>;
    devices: Map<number, SystemStateDevice>;
    lastUpdate: number;
}

class SystemStateManager {
    private state: SystemState;
    private listeners: Set<(state: SystemState) => void>;

    constructor() {
        this.state = {
            items: new Map(),
            devices: new Map(),
            lastUpdate: Date.now()
        };
        this.listeners = new Set();
    }

    public updateItem(itemId: number, update: Partial<SystemStateItem>): void {
        const currentItem = this.state.items.get(itemId) || {
            id: itemId,
            type: update.type || 'unknown',
            state: PlaybackState.STOPPED,
            lastUpdate: Date.now()
        };

        this.state.items.set(itemId, {
            ...currentItem,
            ...update,
            lastUpdate: Date.now()
        });

        this.notifyListeners();
    }

    public updateDevice(deviceId: number, update: Partial<SystemStateDevice>): void {
        const currentDevice = this.state.devices.get(deviceId) || {
            id: deviceId,
            type: update.type || 'unknown',
            name: update.name || 'Unknown Device',
            state: DeviceState.OFFLINE,
            lastUpdate: Date.now()
        };

        this.state.devices.set(deviceId, {
            ...currentDevice,
            ...update,
            lastUpdate: Date.now()
        });

        this.notifyListeners();
    }

    public getState(): SystemState {
        return {
            items: new Map(this.state.items),
            devices: new Map(this.state.devices),
            lastUpdate: this.state.lastUpdate
        };
    }

    public subscribe(listener: (state: SystemState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.state.lastUpdate = Date.now();
        for (const listener of this.listeners) {
            listener(this.getState());
        }
    }

    public reset(): void {
        this.state = {
            items: new Map(),
            devices: new Map(),
            lastUpdate: Date.now()
        };
        this.notifyListeners();
    }
}

export default SystemStateManager;