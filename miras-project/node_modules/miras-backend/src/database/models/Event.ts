// Ruta del fichero: /backend/src/database/models/Event.ts

import DatabaseConnection from '../connection';
import { BaseModel } from './index';
import Item from './Item';

export interface Event extends BaseModel {
    project_id: number;
    title: string;
    event_order: number;
    items?: Item[];
}

export interface CreateEventData {
    project_id: number;
    title: string;
    event_order?: number;
}

export interface UpdateEventData {
    title?: string;
    event_order?: number;
}

class EventModel {
    private static instance: EventModel;
    private db = DatabaseConnection.getInstance();

    private constructor() {}

    public static getInstance(): EventModel {
        if (!EventModel.instance) {
            EventModel.instance = new EventModel();
        }
        return EventModel.instance;
    }

    async create(data: CreateEventData): Promise<Event> {
        const db = await this.db.connect();
        
        try {
            await db.run('BEGIN TRANSACTION');

            // Si no se proporciona order, obtener el siguiente
            if (!data.event_order) {
                const maxOrder = await db.get<{ max_order: number }>(
                    `SELECT MAX(event_order) as max_order 
                     FROM events 
                     WHERE project_id = ?`,
                    data.project_id
                );
                data.event_order = (maxOrder?.max_order || 0) + 1;
            }

            // Verificar si hay que reordenar eventos existentes
            await db.run(
                `UPDATE events 
                 SET event_order = event_order + 1 
                 WHERE project_id = ? AND event_order >= ?`,
                [data.project_id, data.event_order]
            );

            const result = await db.run(
                `INSERT INTO events (project_id, title, event_order) 
                 VALUES (?, ?, ?)`,
                [data.project_id, data.title, data.event_order]
            );

            await db.run('COMMIT');

            if (!result.lastID) throw new Error('Error creating event');

            return this.getById(result.lastID);
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('Error in create event:', error);
            throw error;
        }
    }

    async getById(id: number, includeItems: boolean = false): Promise<Event> {
        const db = await this.db.connect();
        
        try {
            const event = await db.get<Event>(
                'SELECT * FROM events WHERE id = ?',
                id
            );

            if (!event) throw new Error('Event not found');

            if (includeItems) {
                const ItemModel = (await import('./Item')).default;
                event.items = await ItemModel.getInstance().getByEventId(id);
            }

            return event;
        } catch (error) {
            console.error('Error in getById event:', error);
            throw error;
        }
    }

    async update(id: number, data: UpdateEventData): Promise<Event> {
        const db = await this.db.connect();
        
        try {
            await db.run('BEGIN TRANSACTION');

            const event = await this.getById(id);

            if (data.event_order && data.event_order !== event.event_order) {
                // Reordenar eventos si el orden cambió
                if (data.event_order > event.event_order) {
                    await db.run(
                        `UPDATE events 
                         SET event_order = event_order - 1 
                         WHERE project_id = ? 
                         AND event_order > ? 
                         AND event_order <= ?`,
                        [event.project_id, event.event_order, data.event_order]
                    );
                } else {
                    await db.run(
                        `UPDATE events 
                         SET event_order = event_order + 1 
                         WHERE project_id = ? 
                         AND event_order >= ? 
                         AND event_order < ?`,
                        [event.project_id, data.event_order, event.event_order]
                    );
                }
            }

            const updates: string[] = [];
            const values: any[] = [];

            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined) {
                    updates.push(`${key} = ?`);
                    values.push(value);
                }
            });

            if (updates.length > 0) {
                values.push(id);
                await db.run(
                    `UPDATE events 
                     SET ${updates.join(', ')} 
                     WHERE id = ?`,
                    values
                );
            }

            await db.run('COMMIT');
            return this.getById(id);
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('Error in update event:', error);
            throw error;
        }
    }

    async delete(id: number): Promise<void> {
        const db = await this.db.connect();
        
        try {
            await db.run('BEGIN TRANSACTION');

            const event = await this.getById(id);

            // Eliminar el evento
            const result = await db.run(
                'DELETE FROM events WHERE id = ?',
                id
            );

            if (result.changes === 0) {
                throw new Error('Event not found');
            }

            // Reordenar eventos restantes
            await db.run(
                `UPDATE events 
                 SET event_order = event_order - 1 
                 WHERE project_id = ? AND event_order > ?`,
                [event.project_id, event.event_order]
            );

            await db.run('COMMIT');
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('Error in delete event:', error);
            throw error;
        }
    }

    async getByProjectId(projectId: number, includeItems: boolean = false): Promise<Event[]> {
        const db = await this.db.connect();
        
        try {
            const events = await db.all<Event>(
                `SELECT * FROM events 
                 WHERE project_id = ? 
                 ORDER BY event_order`,
                projectId
            );

            if (includeItems && events.length > 0) {
                const ItemModel = (await import('./Item')).default;
                for (const event of events) {
                    event.items = await ItemModel.getInstance().getByEventId(event.id);
                }
            }

            return events;
        } catch (error) {
            console.error('Error in getByProjectId:', error);
            throw error;
        }
    }

    async reorderEvents(projectId: number, eventOrders: { id: number, order: number }[]): Promise<void> {
        const db = await this.db.connect();
        
        try {
            await db.run('BEGIN TRANSACTION');

            for (const { id, order } of eventOrders) {
                await db.run(
                    'UPDATE events SET event_order = ? WHERE id = ? AND project_id = ?',
                    [order, id, projectId]
                );
            }

            await db.run('COMMIT');
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('Error in reorderEvents:', error);
            throw error;
        }
    }
}

export default EventModel;