// Ruta del fichero: backend/src/core/ProjectManager.ts

import { EventEmitter } from 'events';
import { Database } from '../database/connection';
import { Project, Event, Item } from '../database/models';

export enum ProjectManagerEvent {
  PROJECT_LOADED = 'projectLoaded',
  PROJECT_SAVED = 'projectSaved',
  PROJECT_CLOSED = 'projectClosed',
  EVENT_ADDED = 'eventAdded',
  EVENT_REMOVED = 'eventRemoved',
  EVENT_UPDATED = 'eventUpdated',
  ITEM_ADDED = 'itemAdded',
  ITEM_REMOVED = 'itemRemoved',
  ITEM_UPDATED = 'itemUpdated',
  ERROR = 'error'
}

export class ProjectManager extends EventEmitter {
  private static instance: ProjectManager;
  private currentProject: Project | null = null;
  private readonly db: Database;
  private modifiedEvents: Set<number> = new Set();
  private modifiedItems: Set<number> = new Set();

  private constructor(db: Database) {
    super();
    this.db = db;
  }

  public static getInstance(db: Database): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager(db);
    }
    return ProjectManager.instance;
  }

  public async loadProject(projectId: number): Promise<Project> {
    try {
      // Cerrar proyecto actual si existe
      if (this.currentProject) {
        await this.closeProject();
      }

      // Cargar nuevo proyecto con eventos e items
      const project = await this.db.getProjectWithDetails(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      this.currentProject = project;
      this.emit(ProjectManagerEvent.PROJECT_LOADED, project);
      
      return project;
    } catch (error) {
      this.emit(ProjectManagerEvent.ERROR, error);
      throw error;
    }
  }

  public async saveProject(): Promise<void> {
    if (!this.currentProject) {
      throw new Error('No project currently loaded');
    }

    try {
      await this.db.transaction(async () => {
        // Guardar eventos modificados
        for (const eventId of this.modifiedEvents) {
          const event = this.currentProject?.events.find(e => e.id === eventId);
          if (event) {
            await this.db.updateEvent(event);
          }
        }

        // Guardar items modificados
        for (const itemId of this.modifiedItems) {
          const item = this.findItemById(itemId);
          if (item) {
            await this.db.updateItem(item);
          }
        }

        // Actualizar timestamp del proyecto
        await this.db.updateProject({
          ...this.currentProject,
          modification_date: new Date()
        });
      });

      this.modifiedEvents.clear();
      this.modifiedItems.clear();
      
      this.emit(ProjectManagerEvent.PROJECT_SAVED, this.currentProject);
    } catch (error) {
      this.emit(ProjectManagerEvent.ERROR, error);
      throw error;
    }
  }

  public async closeProject(): Promise<void> {
    if (!this.currentProject) {
      return;
    }

    // Verificar cambios pendientes
    if (this.hasUnsavedChanges()) {
      throw new Error('Project has unsaved changes');
    }

    this.currentProject = null;
    this.modifiedEvents.clear();
    this.modifiedItems.clear();
    
    this.emit(ProjectManagerEvent.PROJECT_CLOSED);
  }

  public async updateEvent(eventId: number, updates: Partial<Event>): Promise<void> {
    const event = this.currentProject?.events.find(e => e.id === eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    Object.assign(event, updates);
    this.modifiedEvents.add(eventId);
    
    this.emit(ProjectManagerEvent.EVENT_UPDATED, event);
  }

  public async updateItem(itemId: number, updates: Partial<Item>): Promise<void> {
    const item = this.findItemById(itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }

    Object.assign(item, updates);
    this.modifiedItems.add(itemId);
    
    this.emit(ProjectManagerEvent.ITEM_UPDATED, item);
  }

  public getCurrentProject(): Project | null {
    return this.currentProject;
  }

  public hasUnsavedChanges(): boolean {
    return this.modifiedEvents.size > 0 || this.modifiedItems.size > 0;
  }

  private findItemById(itemId: number): Item | undefined {
    for (const event of this.currentProject?.events || []) {
      const item = event.items.find(i => i.id === itemId);
      if (item) return item;
    }
    return undefined;
  }
}