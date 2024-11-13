// Ruta del fichero: /frontend/src/utils/errors.ts

export class DeviceError extends Error {
    deviceId: string;
    deviceType: string;
    code: string;

    constructor(message: string, deviceId: string, deviceType: string, code: string) {
        super(message);
        this.name = 'DeviceError';
        this.deviceId = deviceId;
        this.deviceType = deviceType;
        this.code = code;
    }
}

export class ConnectionError extends DeviceError {
    constructor(deviceId: string, deviceType: string, details?: string) {
        super(
            `Failed to connect to ${deviceType} device (${deviceId})${details ? ': ' + details : ''}`,
            deviceId,
            deviceType,
            'CONNECTION_ERROR'
        );
        this.name = 'ConnectionError';
    }
}

export class CommandError extends DeviceError {
    command: string;
    params?: Record<string, any>;

    constructor(
        command: string,
        deviceId: string,
        deviceType: string,
        details?: string,
        params?: Record<string, any>
    ) {
        super(
            `Failed to execute command ${command} on ${deviceType} device (${deviceId})${details ? ': ' + details : ''}`,
            deviceId,
            deviceType,
            'COMMAND_ERROR'
        );
        this.name = 'CommandError';
        this.command = command;
        this.params = params;
    }
}

export class ValidationError extends Error {
    field: string;
    value: any;

    constructor(message: string, field: string, value: any) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
    }
}

export class WebSocketError extends Error {
    code: number;

    constructor(message: string, code: number) {
        super(message);
        this.name = 'WebSocketError';
        this.code = code;
    }
}

export const isDeviceError = (error: any): error is DeviceError => {
    return error instanceof DeviceError;
};

export const isConnectionError = (error: any): error is ConnectionError => {
    return error instanceof ConnectionError;
};

export const isCommandError = (error: any): error is CommandError => {
    return error instanceof CommandError;
};

export const isValidationError = (error: any): error is ValidationError => {
    return error instanceof ValidationError;
};

export const isWebSocketError = (error: any): error is WebSocketError => {
    return error instanceof WebSocketError;
};

export const formatErrorMessage = (error: Error): string => {
    if (isDeviceError(error)) {
        return `Device Error (${error.deviceType}): ${error.message}`;
    }
    if (isValidationError(error)) {
        return `Validation Error: ${error.message} (${error.field})`;
    }
    if (isWebSocketError(error)) {
        return `WebSocket Error (${error.code}): ${error.message}`;
    }
    return error.message;
};