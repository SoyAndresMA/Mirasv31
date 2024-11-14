// Ruta del fichero: frontend/src/core/state/GlobalContext.tsx

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { SystemState } from './SystemState';
import { useWebSocket } from '../../hooks/useWebSocket';

// Tipos de acciones
export enum ActionType {
  SET_STATE = 'setState',
  UPDATE_DEVICE = 'updateDevice',
  SET_ERROR = 'setError',
  CLEAR_ERROR = 'clearError',
  SET_LOADING = 'setLoading'
}

interface Action {
  type: ActionType;
  payload?: any;
}

interface GlobalContextState extends SystemState {
  loading: boolean;
  error: string | null;
}

interface GlobalContextValue {
  state: GlobalContextState;
  dispatch: React.Dispatch<Action>;
}

const initialState: GlobalContextState = {
  activeProject: null,
  devices: new Map(),
  connectedClients: 0,
  lastUpdate: new Date(),
  loading: false,
  error: null
};

const GlobalContext = createContext<GlobalContextValue | undefined>(undefined);

function reducer(state: GlobalContextState, action: Action): GlobalContextState {
  switch (action.type) {
    case ActionType.SET_STATE:
      return {
        ...state,
        ...action.payload,
        lastUpdate: new Date()
      };
    
    case ActionType.UPDATE_DEVICE:
      const newDevices = new Map(state.devices);
      newDevices.set(action.payload.id, action.payload);
      return {
        ...state,
        devices: newDevices,
        lastUpdate: new Date()
      };
    
    case ActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case ActionType.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case ActionType.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    default:
      return state;
  }
}

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const ws = useWebSocket();

  useEffect(() => {
    if (!ws) return;

    // Suscribirse a actualizaciones de estado
    ws.on('stateUpdate', (newState) => {
      dispatch({ type: ActionType.SET_STATE, payload: newState });
    });

    // Suscribirse a actualizaciones de dispositivos
    ws.on('deviceUpdate', (deviceState) => {
      dispatch({ type: ActionType.UPDATE_DEVICE, payload: deviceState });
    });

    // Suscribirse a errores
    ws.on('error', (error) => {
      dispatch({ type: ActionType.SET_ERROR, payload: error.message });
    });

    // Limpiar suscripciones
    return () => {
      ws.off('stateUpdate');
      ws.off('deviceUpdate');
      ws.off('error');
    };
  }, [ws]);

  return (
    <GlobalContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};