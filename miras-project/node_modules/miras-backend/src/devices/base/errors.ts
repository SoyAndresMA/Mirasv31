// Ruta del fichero: /backend/src/devices/base/errors.ts

export class DeviceConnectionError extends Error {
    constructor(deviceId: string, message: string, cause?: Error) {
      super(`Device ${deviceId} connection error: ${message}`);
      this.name = 'DeviceConnectionError';
      this.cause = cause;
    }
  }
  
  export class DeviceCommandError extends Error {
    constructor(deviceId: string, command: string, message: string, cause?: Error) {
      super(`Device ${deviceId} command "${command}" failed: ${message}`);
      this.name = 'DeviceCommandError';
      this.cause = cause;
    }
  }
  
  export class DeviceTimeoutError extends Error {
    constructor(deviceId: string, operation: string, timeout: number) {
      super(`Device ${deviceId} timeout after ${timeout}ms during ${operation}`);
      this.name = 'DeviceTimeoutError';
    }
  }
  
  export class DeviceNotFoundError extends Error {
    constructor(deviceId: string) {
      super(`Device ${deviceId} not found`);
      this.name = 'DeviceNotFoundError';
    }
  }
  
  export class DeviceValidationError extends Error {
    constructor(deviceId: string, message: string) {
      super(`Device ${deviceId} validation error: ${message}`);
      this.name = 'DeviceValidationError';
    }
  }
  
  export class DeviceStateError extends Error {
    constructor(deviceId: string, state: string, message: string) {
      super(`Device ${deviceId} in state "${state}": ${message}`);
      this.name = 'DeviceStateError';
    }
  }
  
  export class DeviceConfigError extends Error {
    constructor(deviceId: string, message: string) {
      super(`Device ${deviceId} configuration error: ${message}`);
      this.name = 'DeviceConfigError';
    }
  }