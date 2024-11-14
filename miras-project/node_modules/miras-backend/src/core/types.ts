// Ruta del fichero: /backend/src/core/types.ts

import { DeviceType, DeviceStatus, DeviceCommand } from '../devices/base/types';
import { WebSocketMessage } from '../websocket/types';

// System State Types
export interface SystemState {
 devices: Record<string, DeviceState>;
 projects: Record<number, ProjectState>;
 connections: Record<string, ConnectionState>;
}

export interface DeviceState {
 id: string;
 type: DeviceType;
 status: DeviceStatus;
 lastError?: string;
 lastCommand?: DeviceCommand;
 lastUpdate: number;
}

export interface ProjectState {
 id: number;
 name: string;
 events: Record<number, EventState>;
 isActive: boolean;
 activeEventId?: number;
}

export interface EventState {
 id: number;
 name: string;
 items: Record<number, ItemState>;
 isActive: boolean;
 activeItemIds: number[];
}

export interface ItemState {
 id: number;
 type: string;
 status: 'idle' | 'playing' | 'error';
 lastError?: string;
 deviceId: string;
 unionId?: number;
}

export interface ConnectionState {
 id: string;
 clientId: string;
 connected: boolean;
 lastMessage?: WebSocketMessage;
 lastPing: number;
}

// Manager Types
export interface ManagerConfig {
 debug?: boolean;
 logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

export interface ProjectConfig {
 name: string;
 description?: string;
 devices: string[];
}

// Command Types
export interface Command {
 id: string;
 type: CommandType;
 target: CommandTarget;
 data: unknown;
 timestamp: number;
 status: CommandStatus;
 error?: string;
}

export type CommandType = 
 | 'DEVICE_CONNECT'
 | 'DEVICE_DISCONNECT'
 | 'DEVICE_COMMAND'
 | 'PROJECT_LOAD'
 | 'PROJECT_SAVE'
 | 'EVENT_START'
 | 'EVENT_STOP'
 | 'ITEM_START'
 | 'ITEM_STOP';

export interface CommandTarget {
 type: 'device' | 'project' | 'event' | 'item';
 id: string | number;
}

export type CommandStatus = 'pending' | 'executing' | 'completed' | 'failed';

// Event Types
export interface SystemEvent {
 type: SystemEventType;
 timestamp: number;
 data: unknown;
}

export type SystemEventType = 
 | 'DEVICE_STATUS_CHANGE'
 | 'PROJECT_STATE_CHANGE'
 | 'CONNECTION_STATE_CHANGE'
 | 'COMMAND_STATUS_CHANGE'
 | 'ERROR';

// Validation Types
export interface ValidationResult {
 valid: boolean;
 errors?: string[];
}

// Utility Types
export type Listener<T> = (data: T) => void;
export type UnsubscribeFn = () => void;

export interface Logger {
 error: (message: string, ...args: unknown[]) => void;
 warn: (message: string, ...args: unknown[]) => void;
 info: (message: string, ...args: unknown[]) => void;
 debug: (message: string, ...args: unknown[]) => void;
}