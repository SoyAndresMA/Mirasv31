// Ruta del fichero: /frontend/src/hooks/useProjectOperations.ts

import { useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useSystemState } from '../core/state/GlobalContext';
import { Project, ProjectEvent, ProjectItem } from '../core/state/types';
import { WS_COMMANDS, WS_EVENTS } from '../core/websocket/constants';

interface UseProjectOperationsReturn {
 loadProject: (id: number) => Promise<Project>;
 saveProject: (project: Project) => Promise<void>;
 createProject: (name: string) => Promise<Project>;
 deleteProject: (id: number) => Promise<void>;
 updateEvent: (projectId: number, event: ProjectEvent) => Promise<void>;
 deleteEvent: (projectId: number, eventId: number) => Promise<void>;
 updateItem: (projectId: number, eventId: number, item: ProjectItem) => Promise<void>;
 deleteItem: (projectId: number, eventId: number, itemId: number) => Promise<void>;
 isModified: boolean;
}

export function useProjectOperations(): UseProjectOperationsReturn {
 const ws = useWebSocket();
 const { state, dispatch } = useSystemState();

 const loadProject = useCallback(async (id: number): Promise<Project> => {
   if (!ws) throw new Error('WebSocket not initialized');

   try {
     const project = await ws.emit(WS_COMMANDS.LOAD_PROJECT, { id });
     dispatch({ type: 'SET_ACTIVE_PROJECT', payload: project });
     return project;
   } catch (error) {
     dispatch({ 
       type: 'SET_ERROR', 
       payload: `Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`
     });
     throw error;
   }
 }, [ws, dispatch]);

 const saveProject = useCallback(async (project: Project): Promise<void> => {
   if (!ws) throw new Error('WebSocket not initialized');

   try {
     await ws.emit(WS_COMMANDS.SAVE_PROJECT, project);
     dispatch({ 
       type: 'UPDATE_PROJECT', 
       payload: { ...project, modified: false, lastSaved: new Date() } 
     });
   } catch (error) {
     dispatch({ 
       type: 'SET_ERROR', 
       payload: `Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`
     });
     throw error;
   }
 }, [ws, dispatch]);

 const createProject = useCallback(async (name: string): Promise<Project> => {
   if (!ws) throw new Error('WebSocket not initialized');

   try {
     const newProject = await ws.emit(WS_COMMANDS.CREATE_PROJECT, { name });
     dispatch({ type: 'SET_ACTIVE_PROJECT', payload: newProject });
     return newProject;
   } catch (error) {
     dispatch({ 
       type: 'SET_ERROR', 
       payload: `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`
     });
     throw error;
   }
 }, [ws, dispatch]);

 const deleteProject = useCallback(async (id: number): Promise<void> => {
   if (!ws) throw new Error('WebSocket not initialized');

   try {
     await ws.emit(WS_COMMANDS.DELETE_PROJECT, { id });
     dispatch({ type: 'CLEAR_PROJECT' });
   } catch (error) {
     dispatch({ 
       type: 'SET_ERROR', 
       payload: `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`
     });
     throw error;
   }
 }, [ws, dispatch]);

 const updateEvent = useCallback(async (projectId: number, event: ProjectEvent): Promise<void> => {
   if (!ws) throw new Error('WebSocket not initialized');

   try {
     await ws.emit(WS_COMMANDS.UPDATE_ITEM, { projectId, event });
     if (state.config.activeProject?.id === projectId) {
       const updatedEvents = state.config.activeProject.events.map(e => 
         e.id === event.id ? event : e
       );
       dispatch({ 
         type: 'UPDATE_PROJECT', 
         payload: { events: updatedEvents } 
       });
     }
   } catch (error) {
     dispatch({ 
       type: 'SET_ERROR', 
       payload: `Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`
     });
     throw error;
   }
 }, [ws, dispatch, state.config.activeProject]);

 const deleteEvent = useCallback(async (projectId: number, eventId: number): Promise<void> => {
   if (!ws) throw new Error('WebSocket not initialized');

   try {
     await ws.emit(WS_COMMANDS.DELETE_ITEM, { projectId, eventId });
     if (state.config.activeProject?.id === projectId) {
       const updatedEvents = state.config.activeProject.events.filter(e => e.id !== eventId);
       dispatch({ 
         type: 'UPDATE_PROJECT', 
         payload: { events: updatedEvents } 
       });
     }
   } catch (error) {
     dispatch({ 
       type: 'SET_ERROR', 
       payload: `Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`
     });
     throw error;
   }
 }, [ws, dispatch, state.config.activeProject]);

 const updateItem = useCallback(async (
   projectId: number, 
   eventId: number, 
   item: ProjectItem
 ): Promise<void> => {
   if (!ws) throw new Error('WebSocket not initialized');

   try {
     await ws.emit(WS_COMMANDS.UPDATE_ITEM, { projectId, eventId, item });
     if (state.config.activeProject?.id === projectId) {
       const updatedEvents = state.config.activeProject.events.map(event => {
         if (event.id !== eventId) return event;
         return {
           ...event,
           items: event.items.map(i => i.id === item.id ? item : i)
         };
       });
       dispatch({ 
         type: 'UPDATE_PROJECT', 
         payload: { events: updatedEvents } 
       });
     }
   } catch (error) {
     dispatch({ 
       type: 'SET_ERROR', 
       payload: `Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`
     });
     throw error;
   }
 }, [ws, dispatch, state.config.activeProject]);

 const deleteItem = useCallback(async (
   projectId: number, 
   eventId: number, 
   itemId: number
 ): Promise<void> => {
   if (!ws) throw new Error('WebSocket not initialized');

   try {
     await ws.emit(WS_COMMANDS.DELETE_ITEM, { projectId, eventId, itemId });
     if (state.config.activeProject?.id === projectId) {
       const updatedEvents = state.config.activeProject.events.map(event => {
         if (event.id !== eventId) return event;
         return {
           ...event,
           items: event.items.filter(i => i.id !== itemId)
         };
       });
       dispatch({ 
         type: 'UPDATE_PROJECT', 
         payload: { events: updatedEvents } 
       });
     }
   } catch (error) {
     dispatch({ 
       type: 'SET_ERROR', 
       payload: `Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`
     });
     throw error;
   }
 }, [ws, dispatch, state.config.activeProject]);

 return {
   loadProject,
   saveProject,
   createProject,
   deleteProject,
   updateEvent,
   deleteEvent,
   updateItem,
   deleteItem,
   isModified: state.config.activeProject?.modified || false
 };
}