// Ruta del fichero: /frontend/src/core/websocket/client.ts

import { 
    MessageType, 
    WSClientState, 
    WSClientConfig,
    WSEventHandlers 
} from './types';

class WebSocketClient {
    private ws: WebSocket | null = null;
    private config: Required<WSClientConfig>;
    private state: WSClientState;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private pingInterval: NodeJS.Timeout | null = null;
    private messageQueue: any[] = [];
    private handlers: WSEventHandlers = {};

    private readonly defaultConfig: Required<WSClientConfig> = {
        url: 'ws://localhost:8080',
        reconnectInterval: 5000,
        maxReconnectAttempts: 5,
        pingInterval: 30000,
        debug: false
    };

    constructor(config: WSClientConfig, handlers: WSEventHandlers = {}) {
        this.config = { ...this.defaultConfig, ...config };
        this.handlers = handlers;
        this.state = {
            connected: false,
            reconnecting: false,
            connectionAttempts: 0
        };
    }

    public connect(): void {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        try {
            this.ws = new WebSocket(this.config.url);
            this.setupWebSocket();
        } catch (error) {
            this.handleError(error as Error);
        }
    }

    private setupWebSocket(): void {
        if (!this.ws) return;

        this.ws.onopen = () => {
            this.state.connected = true;
            this.state.reconnecting = false;
            this.state.connectionAttempts = 0;
            this.state.lastError = undefined;

            // Procesar mensajes en cola
            while (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift();
                this.send(message);
            }

            this.startPingInterval();
            this.handlers.onConnect?.();
            this.log('Conexión establecida');
        };

        this.ws.onclose = () => {
            this.state.connected = false;
            this.clearPingInterval();
            this.handlers.onDisconnect?.();
            this.attemptReconnect();
            this.log('Conexión cerrada');
        };

        this.ws.onerror = (error) => {
            this.handleError(error as Error);
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                this.handleError(new Error('Error parsing message'));
            }
        };
    }

    private handleMessage(message: any): void {
        this.state.lastMessageTime = Date.now();

        switch (message.type) {
            case MessageType.PONG:
                this.log('Pong recibido');
                break;

            case MessageType.ERROR:
                this.handleError(new Error(message.payload.message));
                break;

            default:
                this.handlers.onMessage?.(message);
        }
    }

    private handleError(error: Error): void {
        this.state.lastError = error.message;
        this.handlers.onError?.(error);
        this.log('Error:', error.message);
    }

    private attemptReconnect(): void {
        if (
            this.state.connectionAttempts >= this.config.maxReconnectAttempts ||
            this.reconnectTimeout
        ) return;

        this.state.reconnecting = true;
        this.state.connectionAttempts++;

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.handlers.onReconnect?.();
            this.connect();
        }, this.config.reconnectInterval);

        this.log(`Intento de reconexión ${this.state.connectionAttempts}/${this.config.maxReconnectAttempts}`);
    }

    private startPingInterval(): void {
        this.pingInterval = setInterval(() => {
            this.send({
                type: MessageType.PING,
                timestamp: Date.now(),
                payload: null
            });
        }, this.config.pingInterval);
    }

    private clearPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    public send(message: any): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.messageQueue.push(message);
            return;
        }

        try {
            this.ws.send(JSON.stringify(message));
        } catch (error) {
            this.handleError(error as Error);
        }
    }

    public getState(): WSClientState {
        return { ...this.state };
    }

    public disconnect(): void {
        this.clearPingInterval();
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.ws?.close();
    }

    private log(...args: any[]): void {
        if (this.config.debug) {
            console.log('[WebSocketClient]', ...args);
        }
    }
}

export default WebSocketClient;