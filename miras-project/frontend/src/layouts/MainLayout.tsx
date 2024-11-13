// Ruta del fichero: /frontend/src/layouts/MainLayout.tsx

import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Settings, LogOut, Menu } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useServerConnection } from '../hooks/useServerConnection';
import Notifications from '../components/common/Notifications';
import ServerStatus from '../components/common/ServerStatus';
import { useAuth } from '../context/AuthContext';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected } = useWebSocket();
  const { serverStatus } = useServerConnection();
  const { logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="ml-4 text-xl font-bold text-white">
                MIRAS Production System
              </h1>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-4">
              <ServerStatus 
                isWebSocketConnected={isConnected}
                serverStatus={serverStatus}
              />
              
              <div className="relative">
                <button
                  className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="h-6 w-6" />
                </button>
              </div>

              {user && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300">{user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                  >
                    <LogOut className="h-6 w-6" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Sidebar content */}
          <div className="fixed inset-y-0 left-0 w-64 bg-gray-800 border-r border-gray-700">
            <div className="flex flex-col h-full">
              <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                <button
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-md"
                  onClick={() => {
                    navigate('/projects');
                    setIsMenuOpen(false);
                  }}
                >
                  Proyectos
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-md"
                  onClick={() => {
                    navigate('/devices');
                    setIsMenuOpen(false);
                  }}
                >
                  Dispositivos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Notifications */}
      <Notifications />
    </div>
  );
};

export default MainLayout;