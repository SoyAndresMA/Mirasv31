// Ruta del fichero: /frontend/src/core/websocket/constants.ts

export const WS_EVENTS = {
    // Eventos de conexión
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
    RECONNECT_ATTEMPT: 'reconnect_attempt',
    RECONNECT_FAILED: 'reconnect_failed',
    RECONNECT_SUCCESS: 'reconnect_success',
   
    // Eventos de servidor
    SERVER_STATUS: 'server_status',
    SERVER_ERROR: 'server_error',
    SERVER_COMMAND: 'server_command',
    SERVER_RESPONSE: 'server_response',
   
    // Eventos de proyecto
    PROJECT_LOADED: 'project_loaded',
    PROJECT_SAVED: 'project_saved',
    PROJECT_ERROR: 'project_error',
    PROJECT_CHANGED: 'project_changed',
   
    // Eventos de items
    ITEM_STATE_CHANGED: 'item_state_changed',
    ITEM_ERROR: 'item_error',
    ITEM_COMMAND: 'item_command',
    ITEM_RESPONSE: 'item_response',
   
    // Eventos de uniones
    UNION_ACTIVATED: 'union_activated',
    UNION_DEACTIVATED: 'union_deactivated',
    UNION_ERROR: 'union_error'
   } as const;
   
   export const WS_COMMANDS = {
    // Comandos de servidor
    CONNECT_SERVER: 'connect_server',
    DISCONNECT_SERVER: 'disconnect_server',
    GET_SERVER_STATUS: 'get_server_status',
   
    // Comandos de proyecto
    LOAD_PROJECT: 'load_project',
    SAVE_PROJECT: 'save_project',
    CREATE_PROJECT: 'create_project',
    DELETE_PROJECT: 'delete_project',
   
    // Comandos de items
    PLAY_ITEM: 'play_item',
    STOP_ITEM: 'stop_item',
    UPDATE_ITEM: 'update_item',
    DELETE_ITEM: 'delete_item',
   
    // Comandos de uniones
    ACTIVATE_UNION: 'activate_union',
    DEACTIVATE_UNION: 'deactivate_union',
    UPDATE_UNION: 'update_union'
   } as const;
   
   export const WS_DEFAULT_CONFIG = {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
    timeout: 10000,
    pingInterval: 10000,
    pingTimeout: 5000
   } as const;
   
   export const WS_ERROR_CODES = {
    CONNECTION_FAILED: 'CONNECTION_FAILED',
    SERVER_ERROR: 'SERVER_ERROR',
    COMMAND_FAILED: 'COMMAND_FAILED',
    TIMEOUT: 'TIMEOUT',
    INVALID_MESSAGE: 'INVALID_MESSAGE'
   } as const;
   
   export const COMMAND_TIMEOUT = 30000; // 30 segundos
   
   export const MAX_RECONNECTION_ATTEMPTS = 5;
   
   export const PING_INTERVAL = 10000; // 10 segundos
   
   export const CONNECTION_TIMEOUT = 10000; // 10 segundos