// Ruta del fichero: /backend/src/websocket/server.ts

import { WebSocket, WebSocketServer } from 'ws';
import { 
    MessageType, 
    WSMessage, 
    ConnectedClient, 
    ConnectionState,
    WSError 
} from './types';

class WebSocketManager {
    private wss: WebSocketServer;
    private clients: Map<string, ConnectedClient>;
    private pingInterval: NodeJS.Timeout;

    constructor(port: number) {
        this.clients = new Map();
        this.wss = new WebSocketServer({ port });
        this.setupWebSocket();
        this.startPingInterval();
    }

    private setupWebSocket(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            const clientId = this.generateClientId();
            
            // Registrar nuevo cliente
            this.clients.set(clientId, {
                id: clientId,
                connectionTime: Date.now(),
                lastPing: Date.now(),
                state: ConnectionState.CONNECTED
            });

            // Manejar mensajes
            ws.on('message', (message: string) => {
                try {
                    const parsedMessage = JSON.parse(message) as WSMessage;
                    this.handleMessage(clientId, ws, parsedMessage);
                } catch (error) {
                    this.sendError(ws, {
                        code: 'INVALID_MESSAGE',
                        message: 'Invalid message format'
                    });
                }
            });

            // Manejar desconexión
            ws.on('close', () => {
                this.clients.delete(clientId);
                console.log(`Cliente ${clientId} desconectado`);
            });

            // Manejar errores
            ws.on('error', (error) => {
                console.error(`Error en cliente ${clientId}:`, error);
                this.clients.get(clientId)!.state = ConnectionState.ERROR;
            });

            // Enviar confirmación de conexión
            this.sendMessage(ws, {
                type: MessageType.CONNECT,
                timestamp: Date.now(),
                payload: { clientId }
            });
        });
    }

    private handleMessage(clientId: string, ws: WebSocket, message: WSMessage): void {
        // Actualizar último ping
        const client = this.clients.get(clientId);
        if (client) {
            client.lastPing = Date.now();
        }

        // Procesar mensaje según tipo
        switch (message.type) {
            case MessageType.PING:
                this.sendMessage(ws, {
                    type: MessageType.PONG,
                    timestamp: Date.now(),
                    payload: null,
                    requestId: message.requestId
                });
                break;

            case MessageType.STATE_REQUEST:
                // TODO: Implementar envío de estado del sistema
                break;

            case MessageType.ITEM_PLAY:
            case MessageType.ITEM_STOP:
            case MessageType.ITEM_UPDATE:
                // TODO: Implementar control de items
                break;

            default:
                this.sendError(ws, {
                    code: 'UNKNOWN_MESSAGE_TYPE',
                    message: `Unknown message type: ${message.type}`
                });
        }
    }

    private sendMessage(ws: WebSocket, message: WSMessage): void {
        try {
            ws.send(JSON.stringify(message));
        } catch (error) {
            console.error('Error enviando mensaje:', error);
        }
    }

    private sendError(ws: WebSocket, error: WSError): void {
        this.sendMessage(ws, {
            type: MessageType.ERROR,
            timestamp: Date.now(),
            payload: error
        });
    }

    private startPingInterval(): void {
        this.pingInterval = setInterval(() => {
            const now = Date.now();
            this.clients.forEach((client, clientId) => {
                if (now - client.lastPing > 30000) { // 30 segundos sin ping
                    console.log(`Cliente ${clientId} inactivo, desconectando...`);
                    this.clients.delete(clientId);
                }
            });
        }, 10000); // Verificar cada 10 segundos
    }

    private generateClientId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    public broadcast(message: WSMessage): void {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                this.sendMessage(client, message);
            }
        });
    }

    public shutdown(): void {
        clearInterval(this.pingInterval);
        this.wss.close();
    }
}

export default WebSocketManager;