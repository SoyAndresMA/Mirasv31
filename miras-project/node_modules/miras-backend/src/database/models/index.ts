// Ruta del fichero: /backend/src/database/models/index.ts

export { default as Project } from './Project';
export { default as Device } from './Device';
export { default as Event } from './Event';
export { default as Item } from './Item';
export * from './types';

// Tipos comunes para los modelos
export interface BaseModel {
    id: number;
    created_at?: string;
    updated_at?: string;
}

// Interface para resultados paginados
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Opciones de paginación
export interface PaginationOptions {
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
}

// Opciones de búsqueda
export interface SearchOptions extends PaginationOptions {
    filters?: Record<string, any>;
    search?: string;
}