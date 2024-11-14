// Ruta del fichero: /backend/src/core/errors.ts

export class CoreError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'CoreError';
    }
   }
   
   export class DatabaseError extends CoreError {
    constructor(operation: string, message: string, cause?: Error) {
      super(`Database error during ${operation}: ${message}`);
      this.name = 'DatabaseError';
      this.cause = cause;
    }
   }
   
   export class ProjectError extends CoreError {
    constructor(projectId: number, message: string) {
      super(`Project ${projectId}: ${message}`);
      this.name = 'ProjectError';
    }
   }
   
   export class StateError extends CoreError {
    constructor(message: string, state?: unknown) {
      super(`State error: ${message}${state ? ` (current state: ${JSON.stringify(state)})` : ''}`);
      this.name = 'StateError';
    }
   }
   
   export class WebSocketError extends CoreError {
    constructor(message: string, code?: number) {
      super(`WebSocket error${code ? ` (${code})` : ''}: ${message}`);
      this.name = 'WebSocketError';
    }
   }
   
   export class ValidationError extends CoreError {
    constructor(message: string, data?: unknown) {
      super(`Validation error: ${message}${data ? ` (data: ${JSON.stringify(data)})` : ''}`);
      this.name = 'ValidationError';
    }
   }
   
   export class AuthenticationError extends CoreError {
    constructor(message: string) {
      super(`Authentication error: ${message}`);
      this.name = 'AuthenticationError';
    }
   }
   
   export class CommandError extends CoreError {
    constructor(command: string, message: string) {
      super(`Command "${command}" error: ${message}`);
      this.name = 'CommandError';
    }
   }
   
   export class DeviceManagerError extends CoreError {
    constructor(message: string) {
      super(`Device manager error: ${message}`);
      this.name = 'DeviceManagerError';
    }
   }
   
   export class ProjectManagerError extends CoreError {
    constructor(message: string) {
      super(`Project manager error: ${message}`);
      this.name = 'ProjectManagerError';
    }
   }
   
   export class StateManagerError extends CoreError {
    constructor(message: string) {
      super(`State manager error: ${message}`);
      this.name = 'StateManagerError';
    }
   }
   
   export class CommandManagerError extends CoreError {
    constructor(message: string) {
      super(`Command manager error: ${message}`);
      this.name = 'CommandManagerError';
    }
   }