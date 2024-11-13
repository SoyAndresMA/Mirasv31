// Ruta del fichero: backend/src/core/CommandManager.ts

import { EventEmitter } from 'events';
import { DeviceManager } from './DeviceManager';
import { ProjectManager } from './ProjectManager';
import { StateManager } from './StateManager';

export interface CommandContext {
  deviceManager: DeviceManager;
  projectManager: ProjectManager;
  stateManager: StateManager;
}

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface CommandDefinition {
  name: string;
  description: string;
  params?: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'object';
      required?: boolean;
      description?: string;
    }
  };
  handler: (params: any, context: CommandContext) => Promise<CommandResult>;
}

export class CommandManager extends EventEmitter {
  private static instance: CommandManager;
  private commands: Map<string, CommandDefinition>;
  private context: CommandContext;

  private constructor(context: CommandContext) {
    super();
    this.commands = new Map();
    this.context = context;
    this.registerBaseCommands();
  }

  public static getInstance(context: CommandContext): CommandManager {
    if (!CommandManager.instance) {
      CommandManager.instance = new CommandManager(context);
    }
    return CommandManager.instance;
  }

  public registerCommand(command: CommandDefinition): void {
    if (this.commands.has(command.name)) {
      throw new Error(`Command ${command.name} already registered`);
    }
    this.commands.set(command.name, command);
  }

  public async executeCommand(name: string, params: any = {}): Promise<CommandResult> {
    const command = this.commands.get(name);
    if (!command) {
      return {
        success: false,
        error: `Command ${name} not found`
      };
    }

    try {
      // Validar parámetros
      this.validateParams(command, params);

      // Ejecutar comando
      const result = await command.handler(params, this.context);

      // Emitir evento de comando ejecutado
      this.emit('commandExecuted', {
        command: name,
        params,
        result
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Emitir evento de error
      this.emit('commandError', {
        command: name,
        params,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private validateParams(command: CommandDefinition, params: any): void {
    if (!command.params) return;

    for (const [paramName, paramDef] of Object.entries(command.params)) {
      // Verificar parámetros requeridos
      if (paramDef.required && !(paramName in params)) {
        throw new Error(`Required parameter ${paramName} missing`);
      }

      // Verificar tipos
      if (paramName in params) {
        const value = params[paramName];
        const actualType = typeof value;
        if (actualType !== paramDef.type) {
          throw new Error(
            `Invalid type for parameter ${paramName}. Expected ${paramDef.type}, got ${actualType}`
          );
        }
      }
    }
  }

  private registerBaseCommands(): void {
    // Comandos de dispositivos
    this.registerCommand({
      name: 'connectDevice',
      description: 'Conecta un dispositivo específico',
      params: {
        deviceId: {
          type: 'number',
          required: true,
          description: 'ID del dispositivo'
        }
      },
      handler: async (params, context) => {
        const device = context.deviceManager.getDevice(params.deviceId);
        if (!device) {
          return { success: false, error: 'Device not found' };
        }
        await device.connect();
        return { success: true };
      }
    });

    this.registerCommand({
      name: 'disconnectDevice',
      description: 'Desconecta un dispositivo específico',
      params: {
        deviceId: {
          type: 'number',
          required: true,
          description: 'ID del dispositivo'
        }
      },
      handler: async (params, context) => {
        const device = context.deviceManager.getDevice(params.deviceId);
        if (!device) {
          return { success: false, error: 'Device not found' };
        }
        await device.disconnect();
        return { success: true };
      }
    });

    // Comandos de proyecto
    this.registerCommand({
      name: 'saveProject',
      description: 'Guarda el proyecto actual',
      handler: async (_, context) => {
        await context.projectManager.saveProject();
        return { success: true };
      }
    });

    this.registerCommand({
      name: 'closeProject',
      description: 'Cierra el proyecto actual',
      handler: async (_, context) => {
        await context.projectManager.closeProject();
        return { success: true };
      }
    });

    // Comandos de estado
    this.registerCommand({
      name: 'getSystemState',
      description: 'Obtiene el estado actual del sistema',
      handler: async (_, context) => {
        const state = context.stateManager.getState();
        return { 
          success: true,
          data: state
        };
      }
    });
  }

  public getCommands(): Map<string, CommandDefinition> {
    return new Map(this.commands);
  }

  public getCommandDefinition(name: string): CommandDefinition | undefined {
    return this.commands.get(name);
  }

  public getCommandList(): Array<{ name: string; description: string }> {
    return Array.from(this.commands.values()).map(cmd => ({
      name: cmd.name,
      description: cmd.description
    }));
  }
}