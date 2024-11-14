-- Ruta del fichero: /backend/src/database/migrations/001_initial_schema.sql

-- Habilitar claves foráneas
PRAGMA foreign_keys = ON;

-- Tabla de servidores de dispositivos
CREATE TABLE IF NOT EXISTS device_servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('caspar', 'vmix', 'atem')),
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    config_json TEXT,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT 1
);

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    event_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, event_order)
);

-- Tabla de tipos de items
CREATE TABLE IF NOT EXISTS item_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    device_type TEXT NOT NULL,
    properties_schema TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de items base
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    type_id INTEGER NOT NULL,
    device_server_id INTEGER NOT NULL,
    position_row INTEGER NOT NULL,
    position_column INTEGER NOT NULL CHECK (position_column BETWEEN 1 AND 3),
    config_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES item_types(id),
    FOREIGN KEY (device_server_id) REFERENCES device_servers(id),
    UNIQUE(event_id, position_row, position_column)
);

-- Tabla de uniones
CREATE TABLE IF NOT EXISTS unions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT NOT NULL,
    properties_schema TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación items-uniones
CREATE TABLE IF NOT EXISTS item_unions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    union_id INTEGER NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    delay DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (union_id) REFERENCES unions(id) ON DELETE CASCADE
);

-- Tabla de estado del sistema
CREATE TABLE IF NOT EXISTS system_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_type TEXT NOT NULL,
    component_id INTEGER NOT NULL,
    state TEXT NOT NULL,
    details_json TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(component_type, component_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);
CREATE INDEX IF NOT EXISTS idx_items_event ON items(event_id);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type_id);
CREATE INDEX IF NOT EXISTS idx_items_device ON items(device_server_id);
CREATE INDEX IF NOT EXISTS idx_item_unions_item ON item_unions(item_id);
CREATE INDEX IF NOT EXISTS idx_system_state_component ON system_state(component_type, component_id);

-- Trigger para actualizar updated_at en proyectos
CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para actualizar updated_at en eventos
CREATE TRIGGER IF NOT EXISTS update_events_timestamp 
AFTER UPDATE ON events
BEGIN
    UPDATE events SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para actualizar updated_at en items
CREATE TRIGGER IF NOT EXISTS update_items_timestamp 
AFTER UPDATE ON items
BEGIN
    UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;