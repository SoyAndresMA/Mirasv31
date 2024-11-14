// Ruta del fichero: /frontend/src/utils/validation.ts

import { ValidationError } from './errors';

export interface ValidationRule<T> {
    validate: (value: T) => boolean;
    message: string;
}

export function validateRequired(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
        throw new ValidationError(
            `${fieldName} is required`,
            fieldName,
            value
        );
    }
}

export function validateNumber(value: any, fieldName: string, options: {
    min?: number;
    max?: number;
    integer?: boolean;
} = {}): void {
    const num = Number(value);
    
    if (isNaN(num)) {
        throw new ValidationError(
            `${fieldName} must be a valid number`,
            fieldName,
            value
        );
    }

    if (options.integer && !Number.isInteger(num)) {
        throw new ValidationError(
            `${fieldName} must be an integer`,
            fieldName,
            value
        );
    }

    if (options.min !== undefined && num < options.min) {
        throw new ValidationError(
            `${fieldName} must be greater than or equal to ${options.min}`,
            fieldName,
            value
        );
    }

    if (options.max !== undefined && num > options.max) {
        throw new ValidationError(
            `${fieldName} must be less than or equal to ${options.max}`,
            fieldName,
            value
        );
    }
}

export function validateString(value: any, fieldName: string, options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
} = {}): void {
    if (typeof value !== 'string') {
        throw new ValidationError(
            `${fieldName} must be a string`,
            fieldName,
            value
        );
    }

    if (options.minLength !== undefined && value.length < options.minLength) {
        throw new ValidationError(
            `${fieldName} must be at least ${options.minLength} characters long`,
            fieldName,
            value
        );
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
        throw new ValidationError(
            `${fieldName} must be no more than ${options.maxLength} characters long`,
            fieldName,
            value
        );
    }

    if (options.pattern && !options.pattern.test(value)) {
        throw new ValidationError(
            `${fieldName} has an invalid format`,
            fieldName,
            value
        );
    }
}

export function validateUrl(value: string, fieldName: string): void {
    try {
        new URL(value);
    } catch {
        throw new ValidationError(
            `${fieldName} must be a valid URL`,
            fieldName,
            value
        );
    }
}

export function validatePort(value: number, fieldName: string): void {
    validateNumber(value, fieldName, {
        min: 1,
        max: 65535,
        integer: true
    });
}

export function validateIpAddress(value: string, fieldName: string): void {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    if (!ipv4Pattern.test(value) && !ipv6Pattern.test(value)) {
        throw new ValidationError(
            `${fieldName} must be a valid IP address`,
            fieldName,
            value
        );
    }

    if (ipv4Pattern.test(value)) {
        const parts = value.split('.').map(Number);
        if (parts.some(part => part < 0 || part > 255)) {
            throw new ValidationError(
                `${fieldName} contains invalid IPv4 octets`,
                fieldName,
                value
            );
        }
    }
}

export function validateEnum<T extends string>(
    value: any,
    fieldName: string,
    validValues: T[]
): asserts value is T {
    if (!validValues.includes(value)) {
        throw new ValidationError(
            `${fieldName} must be one of: ${validValues.join(', ')}`,
            fieldName,
            value
        );
    }
}

export function validateArray<T>(
    value: any,
    fieldName: string,
    itemValidator: (item: T, index: number) => void,
    options: {
        minLength?: number;
        maxLength?: number;
    } = {}
): void {
    if (!Array.isArray(value)) {
        throw new ValidationError(
            `${fieldName} must be an array`,
            fieldName,
            value
        );
    }

    if (options.minLength !== undefined && value.length < options.minLength) {
        throw new ValidationError(
            `${fieldName} must contain at least ${options.minLength} items`,
            fieldName,
            value
        );
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
        throw new ValidationError(
            `${fieldName} must contain no more than ${options.maxLength} items`,
            fieldName,
            value
        );
    }

    value.forEach((item, index) => {
        try {
            itemValidator(item, index);
        } catch (error) {
            if (error instanceof ValidationError) {
                throw new ValidationError(
                    `${fieldName}[${index}]: ${error.message}`,
                    `${fieldName}[${index}]`,
                    item
                );
            }
            throw error;
        }
    });
}