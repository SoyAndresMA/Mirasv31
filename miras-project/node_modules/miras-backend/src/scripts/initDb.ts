// Ruta del fichero: /backend/src/scripts/initDb.ts

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Database } from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
  const dbPath = path.join(__dirname, '../../database/miras.db');
  const migrationsPath = path.join(__dirname, '../database/migrations');

  try {
    // Eliminar base de datos existente si existe
    try {
      await fs.unlink(dbPath);
      console.log('Base de datos existente eliminada');
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    // Crear directorio de base de datos si no existe
    await fs.mkdir(path.dirname(dbPath), { recursive: true });

    // Abrir conexión
    const db = await open({
      filename: dbPath,
      driver: Database
    });

    // Activar foreign keys
    await db.exec('PRAGMA foreign_keys = ON;');

    // Leer y ejecutar migraciones en orden
    const files = await fs.readdir(migrationsPath);
    const migrations = files
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    for (const migration of migrations) {
      console.log(`Ejecutando migración: ${migration}`);
      const sql = await fs.readFile(
        path.join(migrationsPath, migration),
        'utf-8'
      );
      await db.exec(sql);
    }

    // Insertar datos iniciales
    const baseDataPath = path.join(__dirname, '../database/seeds/base_data.sql');
    if (await fs.stat(baseDataPath)) {
      console.log('Insertando datos base...');
      const baseData = await fs.readFile(baseDataPath, 'utf-8');
      await db.exec(baseData);
    }

    // Insertar datos de prueba en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const testDataPath = path.join(__dirname, '../database/seeds/test_data.sql');
      if (await fs.stat(testDataPath)) {
        console.log('Insertando datos de prueba...');
        const testData = await fs.readFile(testDataPath, 'utf-8');
        await db.exec(testData);
      }
    }

    console.log('Base de datos inicializada correctamente');
    await db.close();

  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initDb();
}

export default initDb;