// Ruta del fichero: /backend/src/database/models/Project.ts

import DatabaseConnection from '../connection';
import { BaseModel, SearchOptions, PaginatedResult } from './index';
import Event from './Event';

export interface Project extends BaseModel {
    name: string;
    description?: string;
    active: boolean;
    events?: Event[];
}

export interface CreateProjectData {
    name: string;
    description?: string;
}

export interface UpdateProjectData {
    name?: string;
    description?: string;
    active?: boolean;
}

class ProjectModel {
    private static instance: ProjectModel;
    private db = DatabaseConnection.getInstance();

    private constructor() {}

    public static getInstance(): ProjectModel {
        if (!ProjectModel.instance) {
            ProjectModel.instance = new ProjectModel();
        }
        return ProjectModel.instance;
    }

    async create(data: CreateProjectData): Promise<Project> {
        const db = await this.db.connect();
        
        try {
            const result = await db.run(
                `INSERT INTO projects (name, description) 
                 VALUES (?, ?)`,
                [data.name, data.description]
            );

            if (!result.lastID) throw new Error('Error creating project');

            return this.getById(result.lastID);
        } catch (error) {
            console.error('Error in create project:', error);
            throw error;
        }
    }

    async getById(id: number, includeEvents: boolean = false): Promise<Project> {
        const db = await this.db.connect();
        
        try {
            const project = await db.get<Project>(
                'SELECT * FROM projects WHERE id = ?',
                id
            );

            if (!project) throw new Error('Project not found');

            if (includeEvents) {
                project.events = await db.all(
                    `SELECT * FROM events 
                     WHERE project_id = ? 
                     ORDER BY event_order`,
                    id
                );
            }

            return project;
        } catch (error) {
            console.error('Error in getById project:', error);
            throw error;
        }
    }

    async update(id: number, data: UpdateProjectData): Promise<Project> {
        const db = await this.db.connect();
        
        try {
            const updates: string[] = [];
            const values: any[] = [];

            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined) {
                    updates.push(`${key} = ?`);
                    values.push(value);
                }
            });

            if (updates.length === 0) {
                return this.getById(id);
            }

            values.push(id);

            await db.run(
                `UPDATE projects 
                 SET ${updates.join(', ')} 
                 WHERE id = ?`,
                values
            );

            return this.getById(id);
        } catch (error) {
            console.error('Error in update project:', error);
            throw error;
        }
    }

    async delete(id: number): Promise<void> {
        const db = await this.db.connect();
        
        try {
            const result = await db.run(
                'DELETE FROM projects WHERE id = ?',
                id
            );

            if (result.changes === 0) {
                throw new Error('Project not found');
            }
        } catch (error) {
            console.error('Error in delete project:', error);
            throw error;
        }
    }

    async search(options: SearchOptions = {}): Promise<PaginatedResult<Project>> {
        const db = await this.db.connect();
        
        try {
            const {
                page = 1,
                pageSize = 10,
                orderBy = 'created_at',
                orderDirection = 'DESC',
                search = '',
                filters = {}
            } = options;

            let whereClause = 'WHERE 1=1';
            const values: any[] = [];

            if (search) {
                whereClause += ' AND (name LIKE ? OR description LIKE ?)';
                values.push(`%${search}%`, `%${search}%`);
            }

            Object.entries(filters).forEach(([key, value]) => {
                whereClause += ` AND ${key} = ?`;
                values.push(value);
            });

            const offset = (page - 1) * pageSize;

            const [total, rows] = await Promise.all([
                db.get<{ count: number }>(
                    `SELECT COUNT(*) as count 
                     FROM projects ${whereClause}`,
                    values
                ),
                db.all<Project>(
                    `SELECT * 
                     FROM projects 
                     ${whereClause} 
                     ORDER BY ${orderBy} ${orderDirection}
                     LIMIT ? OFFSET ?`,
                    [...values, pageSize, offset]
                )
            ]);

            return {
                data: rows,
                total: total?.count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((total?.count || 0) / pageSize)
            };
        } catch (error) {
            console.error('Error in search projects:', error);
            throw error;
        }
    }

    // Métodos adicionales específicos del proyecto
    async duplicate(id: number, newName?: string): Promise<Project> {
        const db = await this.db.connect();
        
        try {
            await db.run('BEGIN TRANSACTION');

            const originalProject = await this.getById(id, true);
            const projectName = newName || `${originalProject.name} (copy)`;

            // Crear nuevo proyecto
            const newProject = await this.create({
                name: projectName,
                description: originalProject.description
            });

            // Duplicar eventos si existen
            if (originalProject.events) {
                for (const event of originalProject.events) {
                    await db.run(
                        `INSERT INTO events (project_id, title, event_order) 
                         VALUES (?, ?, ?)`,
                        [newProject.id, event.title, event.event_order]
                    );
                }
            }

            await db.run('COMMIT');
            return this.getById(newProject.id, true);
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('Error in duplicate project:', error);
            throw error;
        }
    }
}

export default ProjectModel;