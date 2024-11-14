// Ruta del fichero: /backend/src/database/models/Device.ts

import DatabaseConnection from '../connection';
import { BaseModel } from './index';

export interface Device extends BaseModel {
    name: string;
    type: 'caspar' | 'vmix' | 'atem';
    host: string;
    port: number;
    config_json?: string;
    active: boolean;
}

export interface DeviceConfig {
    // Configuración común
    reconnectAttempts?: number;
    reconnectInterval?: number;
    timeout?: number;

    // Configuración específica por tipo
    caspar?: {
        channels: number[];
        clearOnConnect?: boolean;
    };
    vmix?: {
        protocol: 'tcp' | 'http';
        preview?: boolean;
    };
    atem?: {
        mixEffects: number[];
        audioMonitoring?: boolean;
    };
}

export interface CreateDeviceData {
    name: string;
    type: Device['type'];
    host: string;
    port: number;
    config?: DeviceConfig;
}

export interface UpdateDeviceData {
    name?: string;
    host?: string;
    port?: number;
    config?: Partial<DeviceConfig>;
    active?: boolean;
}

class DeviceModel {
    private static instance: DeviceModel;
    private db = DatabaseConnection.getInstance();

    private constructor() {}

    public static getInstance(): DeviceModel {
        if (!DeviceModel.instance) {
            DeviceModel.instance = new DeviceModel();
        }
        return DeviceModel.instance;
    }

    async create(data: CreateDeviceData): Promise<Device> {
        const db = await this.db.connect();
        
        try {
            const result = await db.run(
                `INSERT INTO device_servers (name, type, host, port, config_json) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    data.name,
                    data.type,
                    data.host,
                    data.port,
                    data.config ? JSON.stringify(data.config) : null
                ]
            );

            if (!result.lastID) throw new Error('Error creating device');

            return this.getById(result.lastID);
        } catch (error) {
            console.error('Error in create device:', error);
            throw error;
        }
    }

    async getById(id: number): Promise<Device> {
        const db = await this.db.connect();
        
        try {
            const device = await db.get<Device>(
                'SELECT * FROM device_servers WHERE id = ?',
                id
            );

            if (!device) throw new Error('Device not found');

            return device;
        } catch (error) {
            console.error('Error in getById device:', error);
            throw error;
        }
    }

    async getByType(type: Device['type']): Promise<Device[]> {
        const db = await this.db.connect();
        
        try {
            return db.all<Device>(
                'SELECT * FROM device_servers WHERE type = ? AND active = 1',
                type
            );
        } catch (error) {
            console.error('Error in getByType device:', error);
            throw error;
        }
    }

    async update(id: number, data: UpdateDeviceData): Promise<Device> {
        const db = await this.db.connect();
        
        try {
            const updates: string[] = [];
            const values: any[] = [];

            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (key === 'config') {
                        updates.push('config_json = ?');
                        values.push(JSON.stringify(value));
                    } else {
                        updates.push(`${key} = ?`);
                        values.push(value);
                    }
                }
            });

            if (updates.length === 0) {
                return this.getById(id);
            }

            values.push(id);

            await db.run(
                `UPDATE device_servers 
                 SET ${updates.join(', ')} 
                 WHERE id = ?`,
                values
            );

            return this.getById(id);
        } catch (error) {
            console.error('Error in update device:', error);
            throw error;
        }
    }

    async delete(id: number): Promise<void> {
        const db = await this.db.connect();
        
        try {
            const result = await db.run(
                'DELETE FROM device_servers WHERE id = ?',
                id
            );

            if (result.changes === 0) {
                throw new Error('Device not found');
            }
        } catch (error) {
            console.error('Error in delete device:', error);
            throw error;
        }
    }

    async getDeviceConfig<T extends keyof DeviceConfig>(
        id: number,
        type: T
    ): Promise<DeviceConfig[T] | null> {
        const device = await this.getById(id);
        if (!device.config_json) return null;

        const config = JSON.parse(device.config_json) as DeviceConfig;
        return config[type] || null;
    }

    async setDeviceConfig<T extends keyof DeviceConfig>(
        id: number,
        type: T,
        config: DeviceConfig[T]
    ): Promise<Device> {
        const device = await this.getById(id);
        const currentConfig = device.config_json ? 
            JSON.parse(device.config_json) as DeviceConfig : 
            {};

        return this.update(id, {
            config: {
                ...currentConfig,
                [type]: config
            }
        });
    }
}

export default DeviceModel;