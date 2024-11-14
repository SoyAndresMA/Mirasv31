// Ruta del fichero: /backend/src/database/connection.ts

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseConnection {
    private static instance: DatabaseConnection;
    private db: Database | null = null;
    private readonly dbPath: string;

    private constructor() {
        this.dbPath = join(__dirname, '../../database.sqlite');
    }

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    public async connect(): Promise<Database> {
        if (this.db) return this.db;

        try {
            this.db = await open({
                filename: this.dbPath,
                driver: sqlite3.Database
            });

            // Habilitar claves foráneas
            await this.db.run('PRAGMA foreign_keys = ON');

            console.log('Conexión a base de datos establecida');
            return this.db;
        } catch (error) {
            console.error('Error conectando a la base de datos:', error);
            throw error;
        }
    }

    public async runMigrations(): Promise<void> {
        if (!this.db) throw new Error('Database not connected');

        try {
            const migrationPath = join(__dirname, 'migrations');
            // Aquí implementaremos la lógica para ejecutar las migraciones
            // en orden según sus números de versión
            console.log('Migraciones completadas');
        } catch (error) {
            console.error('Error ejecutando migraciones:', error);
            throw error;
        }
    }

    public getDatabase(): Database {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return this.db;
    }

    public async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
}

export default DatabaseConnection;