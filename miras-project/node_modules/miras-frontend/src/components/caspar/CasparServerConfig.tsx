// Ruta del fichero: /frontend/src/components/caspar/CasparServerConfig.tsx

import React, { useState, useEffect } from 'react';
import { Save, X, PlaySquare, AlertCircle } from 'lucide-react';

interface CasparConfig {
  host: string;
  port: number;
  channels: number[];
  autoConnect: boolean;
}

interface CasparServerConfigProps {
  initialConfig?: CasparConfig;
  onSave: (config: CasparConfig) => Promise<void>;
  onClose: () => void;
}

const CasparServerConfig: React.FC<CasparServerConfigProps> = ({
  initialConfig,
  onSave,
  onClose
}) => {
  const [config, setConfig] = useState<CasparConfig>({
    host: 'localhost',
    port: 5250,
    channels: [1],
    autoConnect: true,
    ...initialConfig
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await onSave(config);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChannelToggle = (channel: number) => {
    setConfig(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel].sort((a, b) => a - b)
    }));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <PlaySquare className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Configuración CasparCG</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Host
          </label>
          <input
            type="text"
            value={config.host}
            onChange={e => setConfig(prev => ({ ...prev, host: e.target.value }))}
            className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Puerto
          </label>
          <input
            type="number"
            value={config.port}
            onChange={e => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 5250 }))}
            className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Canales
          </label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map(channel => (
              <button
                key={channel}
                type="button"
                onClick={() => handleChannelToggle(channel)}
                className={`
                  px-3 py-1 rounded-full text-sm font-medium transition-colors
                  ${config.channels.includes(channel)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                `}
              >
                Canal {channel}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoConnect"
            checked={config.autoConnect}
            onChange={e => setConfig(prev => ({ ...prev, autoConnect: e.target.checked }))}
            className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="autoConnect" className="text-sm text-gray-300">
            Conectar automáticamente al iniciar
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CasparServerConfig;