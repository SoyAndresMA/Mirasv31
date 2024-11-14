// Ruta del fichero: /frontend/src/core/state/reducer.ts

import { SystemState, SystemStateAction, ServerStatus, ConnectionState } from './types';

const initialConnectionState: ConnectionState = {
 connected: false,
 reconnecting: false,
 reconnectAttempt: 0
};

export const initialState: SystemState = {
 config: {
   servers: [],
   serverStatuses: {},
   globalSettings: {
     autoReconnect: true,
     reconnectDelay: 3000,
     maxReconnectAttempts: 5,
     defaultTransitionTime: 1000,
     logLevel: 'info'
   }
 },
 connectionState: initialConnectionState,
 pendingCommands: new Map()
};

export function systemStateReducer(state: SystemState, action: SystemStateAction): SystemState {
 switch (action.type) {
   case 'SET_CONFIG':
     return {
       ...state,
       config: {
         ...state.config,
         ...action.payload
       }
     };

   case 'SET_CONNECTION_STATE':
     return {
       ...state,
       connectionState: {
         ...state.connectionState,
         ...action.payload
       }
     };

   case 'SET_ERROR':
     return {
       ...state,
       lastError: action.payload
     };

   case 'CLEAR_ERROR':
     const { lastError, ...stateWithoutError } = state;
     return stateWithoutError;

   case 'ADD_PENDING_COMMAND':
     const newCommands = new Map(state.pendingCommands);
     newCommands.set(action.payload.id, action.payload);
     return {
       ...state,
       pendingCommands: newCommands
     };

   case 'REMOVE_PENDING_COMMAND':
     const updatedCommands = new Map(state.pendingCommands);
     updatedCommands.delete(action.payload);
     return {
       ...state,
       pendingCommands: updatedCommands
     };

   case 'SET_SERVER_STATUS':
     return {
       ...state,
       config: {
         ...state.config,
         serverStatuses: {
           ...state.config.serverStatuses,
           [action.payload.serverId]: action.payload.status
         }
       }
     };

   case 'SET_ACTIVE_PROJECT':
     return {
       ...state,
       config: {
         ...state.config,
         activeProject: action.payload
       }
     };

   case 'UPDATE_PROJECT':
     if (!state.config.activeProject) {
       return state;
     }
     return {
       ...state,
       config: {
         ...state.config,
         activeProject: {
           ...state.config.activeProject,
           ...action.payload,
           modified: true
         }
       }
     };

   case 'CLEAR_PROJECT':
     const configWithoutProject = { ...state.config };
     delete configWithoutProject.activeProject;
     return {
       ...state,
       config: configWithoutProject
     };

   default:
     return state;
 }
}

export function isServerConnected(status: ServerStatus): boolean {
 return status === ServerStatus.CONNECTED;
}

export function canReconnect(state: SystemState): boolean {
 const { autoReconnect, maxReconnectAttempts } = state.config.globalSettings;
 const { reconnectAttempt } = state.connectionState;
 
 return autoReconnect && reconnectAttempt < maxReconnectAttempts;
}