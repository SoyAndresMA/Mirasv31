// Ruta del fichero: /frontend/src/components/common/ServerStatus.tsx

import React from 'react';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { ServerState } from '../../core/state/types';
import { useServerConnection } from '../../hooks/useServerConnection';

interface ServerStatusProps {
  serverId: string;
  serverName: string;
  className?: string;
}

const ServerStatus: React.FC<ServerStatusProps> = ({ serverId, serverName, className = '' }) => {
  const { status, lastError } = useServerConnection(serverId);

  const getStatusColor = (status: ServerState) => {
    switch (status) {
      case 'connected':
        return 'text-green-400';
      case 'connecting':
        return 'text-yellow-400';
      case 'disconnected':
        return 'text-red-400';
      case 'error':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: ServerState) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Error';
      default:
        return 'Desconocido';
    }
  };

  const getStatusIcon = (status: ServerState) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4" />;
      case 'connecting':
        return <Wifi className="h-4 w-4 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 ${getStatusColor(status)}`}
        title={lastError || getStatusText(status)}
      >
        {getStatusIcon(status)}
        <span className="text-sm font-medium">{serverName}</span>
      </div>
      
      {status === 'error' && lastError && (
        <div className="text-xs text-red-400 truncate max-w-xs" title={lastError}>
          {lastError}
        </div>
      )}
    </div>
  );
};

export default ServerStatus;