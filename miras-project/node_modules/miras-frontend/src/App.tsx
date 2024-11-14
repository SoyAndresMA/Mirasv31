// Ruta del fichero: /frontend/src/App.tsx

import React, { useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useGlobalState } from './core/state/GlobalContext';
import MEvent from './components/common/MEvent/MEvent';
import { AlertCircle, Server, Wifi, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const { connect, disconnect, isConnected } = useWebSocket();
  const { state } = useGlobalState();
  
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Mostrar estado de conexión
  const renderConnectionStatus = () => {
    if (isConnected) {
      return (
        <div className="flex items-center gap-2 text-green-500">
          <Wifi size={20} />
          <span>Conectado</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-red-500">
        <WifiOff size={20} />
        <span>Desconectado</span>
      </div>
    );
  };

  // Mostrar estado de dispositivos
  const renderDeviceStatus = () => {
    return (
      <div className="flex items-center gap-4">
        {state.devices.map((device) => (
          <div 
            key={device.id}
            className={`flex items-center gap-2 ${
              device.connected ? 'text-green-500' : 'text-red-500'
            }`}
          >
            <Server size={20} />
            <span>{device.name}</span>
          </div>
        ))}
      </div>
    );
  };

  // Mostrar errores si existen
  const renderErrors = () => {
    if (state.errors.length === 0) return null;
    
    return (
      <div className="fixed bottom-4 right-4 max-w-md">
        {state.errors.map((error, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 bg-red-500 text-white p-4 rounded-lg mb-2"
          >
            <AlertCircle size={20} />
            <span>{error.message}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Sistema de Control</h1>
            <div className="flex items-center gap-6">
              {renderConnectionStatus()}
              {renderDeviceStatus()}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {state.currentProject ? (
          <div className="space-y-6">
            {state.currentProject.events.map((event) => (
              <MEvent 
                key={event.id}
                event={event}
                availableUnions={state.availableUnions}
                onEventChange={() => {/* TODO: Implementar cambios de evento */}}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center text-gray-500">
              <h2 className="text-2xl font-bold mb-2">No hay proyecto activo</h2>
              <p>Selecciona un proyecto para comenzar</p>
            </div>
          </div>
        )}
      </main>

      {/* Error notifications */}
      {renderErrors()}
    </div>
  );
};

export default App;