// Ruta del fichero: /frontend/src/core/state/types.ts

export interface SystemConfig {
    servers: ServerConfig[];
    serverStatuses: Record<string, ServerStatus>;
    activeProject?: Project;
    globalSettings: GlobalSettings;
   }
   
   export interface GlobalSettings {
    autoReconnect: boolean;
    reconnectDelay: number;
    maxReconnectAttempts: number;
    defaultTransitionTime: number;
    logLevel: LogLevel;
   }
   
   export interface ServerConfig {
    id: string;
    type: ServerType;
    host: string;
    port: number;
    name: string;
    enabled: boolean;
   }
   
   export enum ServerType {
    CASPAR = 'caspar',
    VMIX = 'vmix',
    ATEM = 'atem'
   }
   
   export enum ServerStatus {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    ERROR = 'error'
   }
   
   export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug'
   }
   
   export interface SystemState {
    config: SystemConfig;
    connectionState: ConnectionState;
    lastError?: string;
    pendingCommands: Map<string, CommandInfo>;
   }
   
   export interface ConnectionState {
    connected: boolean;
    reconnecting: boolean;
    reconnectAttempt: number;
    lastConnected?: Date;
    lastDisconnected?: Date;
   }
   
   export interface CommandInfo {
    id: string;
    type: string;
    target: string;
    params: any;
    timestamp: Date;
    timeout: number;
   }
   
   export interface Project {
    id: number;
    name: string;
    events: ProjectEvent[];
    modified: boolean;
    lastSaved?: Date;
   }
   
   export interface ProjectEvent {
    id: number;
    name: string;
    order: number;
    items: ProjectItem[];
    union?: ItemUnion;
   }
   
   export interface ProjectItem {
    id: number;
    type: ItemType;
    server: string;
    config: any;
    position: ItemPosition;
    union?: ItemUnion;
   }
   
   export interface ItemPosition {
    row: number;
    column: number;
   }
   
   export interface ItemUnion {
    type: UnionType;
    delay: number;
    position: number;
   }
   
   export enum ItemType {
    CLIP = 'clip',
    CAMERA = 'camera',
    GRAPHICS = 'graphics',
    PROMPT = 'prompt',
    SOUND = 'sound',
    MIC = 'mic'
   }
   
   export enum UnionType {
    PARALLEL = 'parallel',
    SEQUENTIAL = 'sequential',
    MANUAL = 'manual',
    INFINITE = 'infinite'
   }
   
   export interface SystemStateContextType {
    state: SystemState;
    dispatch: React.Dispatch<SystemStateAction>;
   }
   
   export type SystemStateAction = 
    | { type: 'SET_CONFIG'; payload: Partial<SystemConfig> }
    | { type: 'SET_CONNECTION_STATE'; payload: Partial<ConnectionState> }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'CLEAR_ERROR' }
    | { type: 'ADD_PENDING_COMMAND'; payload: CommandInfo }
    | { type: 'REMOVE_PENDING_COMMAND'; payload: string }
    | { type: 'SET_SERVER_STATUS'; payload: { serverId: string; status: ServerStatus } }
    | { type: 'SET_ACTIVE_PROJECT'; payload: Project }
    | { type: 'UPDATE_PROJECT'; payload: Partial<Project> }
    | { type: 'CLEAR_PROJECT' };