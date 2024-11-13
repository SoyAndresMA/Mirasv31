// Ruta del fichero: /backend/src/index.ts

import { WSServer } from './websocket/WSServer';
import { ProjectManager } from './core/ProjectManager';
import { StateManager } from './core/StateManager';
import { DeviceManager } from './core/DeviceManager';
import { CommandManager } from './core/CommandManager';
import { initDatabase } from './database/connection';
import { config } from './config';

async function startServer() {
  try {
    // Inicializar managers
    const stateManager = new StateManager();
    const deviceManager = new DeviceManager(config.devices);
    const projectManager = new ProjectManager();
    const commandManager = new CommandManager(deviceManager);

    // Inicializar base de datos
    await initDatabase();
    
    // Inicializar servidor WebSocket
    const wsServer = new WSServer({
      port: config.websocket.port,
      stateManager,
      deviceManager,
      projectManager,
      commandManager
    });

    // Conectar dispositivos configurados
    await deviceManager.connectAll();

    console.log(`Server running on ws://localhost:${config.websocket.port}`);
    
    // Manejadores de cierre
    const cleanup = async () => {
      console.log('Shutting down server...');
      await deviceManager.disconnectAll();
      await wsServer.close();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();