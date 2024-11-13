// Ruta del fichero: /backend/src/database/models/Item.ts

import DatabaseConnection from '../connection';
import { BaseModel } from './index';

export interface Position {
    row: number;
    column: number;
}

export interface ItemUnion {
    union_id: number;
    position: number;
    delay: number;
}

export interface Item extends BaseModel {
    event_id: number;
    type_id: number;
    device_server_id: number;
    position_row: number;
    position_column: number;
    config_json?: string;
    unions?: ItemUnion[];
}

export interface CreateItemData {
    event_id: number;
    type_id: number;
    device_server_id: number;
    position: Position;
    config?: any;
}

export interface UpdateItemData {
    type_id?: number;
    device_server_id?: number;
    position?: Position;
    config?: any;
}

class ItemModel {
    private static instance: ItemModel;
    private db = DatabaseConnection.getInstance();

    private constructor() {}

    public static getInstance(): ItemModel {
        if (!ItemModel.instance) {
            ItemModel.instance = new ItemModel();
        }
        return ItemModel.instance;
    }

    async create(data: CreateItemData): Promise<Item> {
        const db = await this.db.connect();
        
        try {
            // Verificar si la posición está ocupada
            const existing = await db.get(
                `SELECT id FROM items 
                 WHERE event_id = ? 
                 AND position_row = ? 
                 AND position_column = ?`,
                [data.event_id, data.position.row, data.position.column]
            );

            if (existing) {
                throw new Error('Position already occupied');
            }

            const result = await db.run(
                `INSERT INTO items (
                    event_id, type_id, device_server_id, 
                    position_row, position_column, config_json
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    data.event_id,
                    data.type_id,
                    data.device_server_id,
                    data.position.row,
                    data.position.column,
                    data.config ? JSON.stringify(data.config) : null
                ]
            );

            if (!result.lastID) throw new Error('Error creating item');

            return this.getById(result.lastID);
        } catch (error) {
            console.error('Error in create item:', error);
            throw error;
        }
    }

    async getById(id: number, includeUnions: boolean = false): Promise<Item> {
        const db = await this.db.connect();
        
        try {
            const item = await db.get<Item>(
                'SELECT * FROM items WHERE id = ?',
                id
            );

            if (!item) throw new Error('Item not found');

            if (includeUnions) {
                item.unions = await db.all(
                    `SELECT union_id, position, delay 
                     FROM item_unions 
                     WHERE item_id = ?
                     ORDER BY position`,
                    id
                );
            }

            return item;
        } catch (error) {
            console.error('Error in getById item:', error);
            throw error;
        }
    }

    async update(id: number, data: UpdateItemData): Promise<Item> {
        const db = await this.db.connect();
        
        try {
            if (data.position) {
                // Verificar si la nueva posición está ocupada
                const existing = await db.get(
                    `SELECT id FROM items 
                     WHERE event_id = (SELECT event_id FROM items WHERE id = ?)
                     AND position_row = ? 
                     AND position_column = ?
                     AND id != ?`,
                    [id, data.position.row, data.position.column, id]
                );

                if (existing) {
                    throw new Error('Position already occupied');
                }
            }

            const updates: string[] = [];
            const values: any[] = [];

            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (key === 'position') {
                        updates.push('position_row = ?', 'position_column = ?');
                        values.push(value.row, value.column);
                    } else if (key === 'config') {
                        updates.push('config_json = ?');
                        values.push(JSON.stringify(value));
                    } else {
                        updates.push(`${key} = ?`);
                        values.push(value);
                    }
                }
            });

            if (updates.length > 0) {
                values.push(id);
                await db.run(
                    `UPDATE items 
                     SET ${updates.join(', ')} 
                     WHERE id = ?`,
                    values
                );
            }

            return this.getById(id);
        } catch (error) {
            console.error('Error in update item:', error);
            throw error;
        }
    }

    async delete(id: number): Promise<void> {
        const db = await this.db.connect();
        
        try {
            const result = await db.run(
                'DELETE FROM items WHERE id = ?',
                id
            );

            if (result.changes === 0) {
                throw new Error('Item not found');
            }
        } catch (error) {
            console.error('Error in delete item:', error);
            throw error;
        }
    }

    async getByEventId(eventId: number, includeUnions: boolean = false): Promise<Item[]> {
        const db = await this.db.connect();
        
        try {
            const items = await db.all<Item>(
                `SELECT * FROM items 
                 WHERE event_id = ? 
                 ORDER BY position_row, position_column`,
                eventId
            );

            if (includeUnions && items.length > 0) {
                const unions = await db.all(
                    `SELECT item_id, union_id, position, delay 
                     FROM item_unions 
                     WHERE item_id IN (${items.map(() => '?').join(',')})
                     ORDER BY position`,
                    items.map(item => item.id)
                );

                items.forEach(item => {
                    item.unions = unions.filter(u => u.item_id === item.id);
                });
            }

            return items;
        } catch (error) {
            console.error('Error in getByEventId:', error);
            throw error;
        }
    }

    async addUnion(itemId: number, unionId: number, position: number = 0, delay: number = 0): Promise<void> {
        const db = await this.db.connect();
        
        try {
            await db.run(
                `INSERT INTO item_unions (item_id, union_id, position, delay)
                 VALUES (?, ?, ?, ?)`,
                [itemId, unionId, position, delay]
            );
        } catch (error) {
            console.error('Error in addUnion:', error);
            throw error;
        }
    }

    async removeUnion(itemId: number, unionId: number): Promise<void> {
        const db = await this.db.connect();
        
        try {
            await db.run(
                `DELETE FROM item_unions 
                 WHERE item_id = ? AND union_id = ?`,
                [itemId, unionId]
            );
        } catch (error) {
            console.error('Error in removeUnion:', error);
            throw error;
        }
    }

    async updateUnion(
        itemId: number, 
        unionId: number, 
        updates: { position?: number; delay?: number }
    ): Promise<void> {
        const db = await this.db.connect();
        
        try {
            const setClause = [];
            const values = [];

            if (updates.position !== undefined) {
                setClause.push('position = ?');
                values.push(updates.position);
            }
            if (updates.delay !== undefined) {
                setClause.push('delay = ?');
                values.push(updates.delay);
            }

            if (setClause.length > 0) {
                values.push(itemId, unionId);
                await db.run(
                    `UPDATE item_unions 
                     SET ${setClause.join(', '// Ruta del fichero: /backend/src/database/models/Item.ts

import DatabaseConnection from '../connection';
import { BaseModel } from './index';

export interface Position {
    row: number;
    column: number;
}

export interface ItemUnion {
    union_id: number;
    position: number;
    delay: number;
}

export interface Item extends BaseModel {
    event_id: number;
    type_id: number;
    device_server_id: number;
    position_row: number;
    position_column: number;
    config_json?: string;
    unions?: ItemUnion[];
}

export interface CreateItemData {
    event_id: number;
    type_id: number;
    device_server_id: number;
    position: Position;
    config?: any;
}

export interface UpdateItemData {
    type_id?: number;
    device_server_id?: number;
    position?: Position;
    config?: any;
}

class ItemModel {
    private static instance: ItemModel;
    private db = DatabaseConnection.getInstance();

    private constructor() {}

    public static getInstance(): ItemModel {
        if (!ItemModel.instance) {
            ItemModel.instance = new ItemModel();
        }
        return ItemModel.instance;
    }

    async create(data: CreateItemData): Promise<Item> {
        const db = await this.db.connect();
        
        try {
            // Verificar si la posición está ocupada
            const existing = await db.get(
                `SELECT id FROM items 
                 WHERE event_id = ? 
                 AND position_row = ? 
                 AND position_column = ?`,
                [data.event_id, data.position.row, data.position.column]
            );

            if (existing) {
                throw new Error('Position already occupied');
            }

            const result = await db.run(
                `INSERT INTO items (
                    event_id, type_id, device_server_id, 
                    position_row, position_column, config_json
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    data.event_id,
                    data.type_id,
                    data.device_server_id,
                    data.position.row,
                    data.position.column,
                    data.config ? JSON.stringify(data.config) : null
                ]
            );

            if (!result.lastID) throw new Error('Error creating item');

            return this.getById(result.lastID);
        } catch (error) {
            console.error('Error in create item:', error);
            throw error;
        }
    }

    async getById(id: number, includeUnions: boolean = false): Promise<Item> {
        const db = await this.db.connect();
        
        try {
            const item = await db.get<Item>(
                'SELECT * FROM items WHERE id = ?',
                id
            );

            if (!item) throw new Error('Item not found');

            if (includeUnions) {
                item.unions = await db.all(
                    `SELECT union_id, position, delay 
                     FROM item_unions 
                     WHERE item_id = ?
                     ORDER BY position`,
                    id
                );
            }

            return item;
        } catch (error) {
            console.error('Error in getById item:', error);
            throw error;
        }
    }

    async update(id: number, data: UpdateItemData): Promise<Item> {
        const db = await this.db.connect();
        
        try {
            if (data.position) {
                // Verificar si la nueva posición está ocupada
                const existing = await db.get(
                    `SELECT id FROM items 
                     WHERE event_id = (SELECT event_id FROM items WHERE id = ?)
                     AND position_row = ? 
                     AND position_column = ?
                     AND id != ?`,
                    [id, data.position.row, data.position.column, id]
                );

                if (existing) {
                    throw new Error('Position already occupied');
                }
            }

            const updates: string[] = [];
            const values: any[] = [];

            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (key === 'position') {
                        updates.push('position_row = ?', 'position_column = ?');
                        values.push(value.row, value.column);
                    } else if (key === 'config') {
                        updates.push('config_json = ?');
                        values.push(JSON.stringify(value));
                    } else {
                        updates.push(`${key} = ?`);
                        values.push(value);
                    }
                }
            });

            if (updates.length > 0) {
                values.push(id);
                await db.run(
                    `UPDATE items 
                     SET ${updates.join(', ')} 
                     WHERE id = ?`,
                    values
                );
            }

            return this.getById(id);
        } catch (error) {
            console.error('Error in update item:', error);
            throw error;
        }
    }

    async delete(id: number): Promise<void> {
        const db = await this.db.connect();
        
        try {
            const result = await db.run(
                'DELETE FROM items WHERE id = ?',
                id
            );

            if (result.changes === 0) {
                throw new Error('Item not found');
            }
        } catch (error) {
            console.error('Error in delete item:', error);
            throw error;
        }
    }

    async getByEventId(eventId: number, includeUnions: boolean = false): Promise<Item[]> {
        const db = await this.db.connect();
        
        try {
            const items = await db.all<Item>(
                `SELECT * FROM items 
                 WHERE event_id = ? 
                 ORDER BY position_row, position_column`,
                eventId
            );

            if (includeUnions && items.length > 0) {
                const unions = await db.all(
                    `SELECT item_id, union_id, position, delay 
                     FROM item_unions 
                     WHERE item_id IN (${items.map(() => '?').join(',')})
                     ORDER BY position`,
                    items.map(item => item.id)
                );

                items.forEach(item => {
                    item.unions = unions.filter(u => u.item_id === item.id);
                });
            }

            return items;
        } catch (error) {
            console.error('Error in getByEventId:', error);
            throw error;
        }
    }

    async addUnion(itemId: number, unionId: number, position: number = 0, delay: number = 0): Promise<void> {
        const db = await this.db.connect();
        
        try {
            await db.run(
                `INSERT INTO item_unions (item_id, union_id, position, delay)
                 VALUES (?, ?, ?, ?)`,
                [itemId, unionId, position, delay]
            );
        } catch (error) {
            console.error('Error in addUnion:', error);
            throw error;
        }
    }

    async removeUnion(itemId: number, unionId: number): Promise<void> {
        const db = await this.db.connect();
        
        try {
            await db.run(
                `DELETE FROM item_unions 
                 WHERE item_id = ? AND union_id = ?`,
                [itemId, unionId]
            );
        } catch (error) {
            console.error('Error in removeUnion:', error);
            throw error;
        }
    }

    async updateUnion(
        itemId: number, 
        unionId: number, 
        updates: { position?: number; delay?: number }
    ): Promise<void> {
        const db = await this.db.connect();
        
        try {
            const setClause = [];
            const values = [];

            if (updates.position !== undefined) {
                setClause.push('position = ?');
                values.push(updates.position);
            }
            if (updates.delay !== undefined) {
                setClause.push('delay = ?');
                values.push(updates.delay);
            }

            if (setClause.length > 0) {
                values.push(itemId, unionId);
                await db.run(`UPDATE item_unions 
                     SET ${setClause.join(', ')} 
                     WHERE item_id = ? AND union_id = ?`,
                    values
                );
            }
        } catch (error) {
            console.error('Error in updateUnion:', error);
            throw error;
        }
    }

    async getItemConfig<T = any>(id: number): Promise<T | null> {
        const item = await this.getById(id);
        if (!item.config_json) return null;
        return JSON.parse(item.config_json) as T;
    }

    async setItemConfig<T = any>(id: number, config: T): Promise<Item> {
        return this.update(id, { config });
    }

    async moveItem(id: number, newPosition: Position): Promise<Item> {
        const db = await this.db.connect();
        
        try {
            await db.run('BEGIN TRANSACTION');

            // Obtener información del item actual
            const item = await this.getById(id);

            // Verificar si la nueva posición está ocupada
            const existing = await db.get(
                `SELECT id FROM items 
                 WHERE event_id = ? 
                 AND position_row = ? 
                 AND position_column = ?
                 AND id != ?`,
                [item.event_id, newPosition.row, newPosition.column, id]
            );

            if (existing) {
                // Si la posición está ocupada, intercambiar posiciones
                await db.run(
                    `UPDATE items 
                     SET position_row = ?, position_column = ? 
                     WHERE id = ?`,
                    [item.position_row, item.position_column, existing.id]
                );
            }

            // Mover el item a la nueva posición
            await db.run(
                `UPDATE items 
                 SET position_row = ?, position_column = ? 
                 WHERE id = ?`,
                [newPosition.row, newPosition.column, id]
            );

            await db.run('COMMIT');
            return this.getById(id);
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('Error in moveItem:', error);
            throw error;
        }
    }

    async validateItemPositions(eventId: number): Promise<boolean> {
        const db = await this.db.connect();
        
        try {
            // Buscar posiciones duplicadas
            const duplicates = await db.all(
                `SELECT position_row, position_column, COUNT(*) as count
                 FROM items 
                 WHERE event_id = ?
                 GROUP BY position_row, position_column
                 HAVING count > 1`,
                eventId
            );

            return duplicates.length === 0;
        } catch (error) {
            console.error('Error in validateItemPositions:', error);
            throw error;
        }
    }

    async getItemsMatrix(eventId: number): Promise<(Item | null)[][]> {
        const items = await this.getByEventId(eventId, true);
        const matrix: (Item | null)[][] = [];

        // Encontrar el número máximo de filas
        const maxRow = Math.max(...items.map(item => item.position_row), 0);

        // Inicializar matriz con nulls
        for (let i = 0; i <= maxRow; i++) {
            matrix[i] = Array(3).fill(null);
        }

        // Rellenar matriz con items
        items.forEach(item => {
            matrix[item.position_row - 1][item.position_column - 1] = item;
        });

        return matrix;
    }

    async duplicateItem(id: number, newPosition: Position): Promise<Item> {
        const db = await this.db.connect();
        
        try {
            await db.run('BEGIN TRANSACTION');

            // Obtener item original con uniones
            const originalItem = await this.getById(id, true);

            // Crear nuevo item
            const newItem = await this.create({
                event_id: originalItem.event_id,
                type_id: originalItem.type_id,
                device_server_id: originalItem.device_server_id,
                position: newPosition,
                config: originalItem.config_json ? JSON.parse(originalItem.config_json) : undefined
            });

            // Duplicar uniones si existen
            if (originalItem.unions) {
                for (const union of originalItem.unions) {
                    await this.addUnion(
                        newItem.id,
                        union.union_id,
                        union.position,
                        union.delay
                    );
                }
            }

            await db.run('COMMIT');
            return this.getById(newItem.id, true);
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('Error in duplicateItem:', error);
            throw error;
        }
    }
}

export default ItemModel;