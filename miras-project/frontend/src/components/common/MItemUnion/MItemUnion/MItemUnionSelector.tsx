import React, { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { MItemUnionSelectorProps, MUnionConfig } from './types';

const MItemUnionSelector: React.FC<MItemUnionSelectorProps> = ({
  isOpen,
  position,
  onClose,
  onSelect,
  currentConfig,
  availableConfigs
}) => {
  const [selectedConfig, setSelectedConfig] = useState<MUnionConfig | null>(null);
  const [delay, setDelay] = useState<number>(0);
  const [position_, setPosition] = useState<number>(0);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (currentConfig) {
      setSelectedConfig(currentConfig);
      setDelay(currentConfig.delay || 0);
      setPosition_(currentConfig.position || 0);
    } else {
      setSelectedConfig(null);
      setDelay(0);
      setPosition_(0);
    }
  }, [currentConfig]);

  useEffect(() => {
    if (isOpen && position) {
      const menuWidth = 400;
      const menuHeight = 400;
      
      let x = position.x - (menuWidth / 2);
      let y = position.y;

      // Ajustes para mantener visible
      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 10;
      }
      if (x < 0) {
        x = 10;
      }
      if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 10;
      }
      if (y < 0) {
        y = 10;
      }

      setStyle({
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 50,
      });
    }
  }, [isOpen, position]);

  const handleApply = () => {
    if (selectedConfig) {
      onSelect({
        ...selectedConfig,
        delay,
        position: position_
      });
    } else {
      onSelect(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      <div 
        className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-[400px]"
        style={style}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-white">Configuración de Unión</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Lista de uniones */}
        <div className="max-h-[250px] overflow-y-auto">
          <button
            onClick={() => setSelectedConfig(null)}
            className={`
              w-full p-3 flex items-center gap-3 transition-colors
              hover:bg-gray-700
              ${!selectedConfig ? 'bg-blue-600/20' : 'bg-transparent'}
              border-b border-gray-700
            `}
          >
            <div className="flex flex-col items-start text-left min-w-0">
              <span className="font-medium text-white text-sm">Sin unión</span>
              <span className="text-xs text-gray-400">Eliminar la unión actual</span>
            </div>
          </button>

          {availableConfigs.map((config) => (
            <button
              key={config.id}
              onClick={() => setSelectedConfig(config)}
              className={`
                w-full p-3 flex items-center gap-3 transition-colors
                hover:bg-gray-700
                ${selectedConfig?.id === config.id ? 'bg-blue-600/20' : 'bg-transparent'}
              `}
            >
              <div 
                className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                dangerouslySetInnerHTML={{ __html: config.icon }}
              />
              
              <div className="flex flex-col items-start text-left min-w-0">
                <span className="font-medium text-white text-sm truncate w-full">
                  {config.name}
                </span>
                <span className="text-xs text-gray-400 truncate w-full">
                  {config.compatibleItems.join(', ')}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Configuración adicional */}
        <div className="p-4 border-t border-gray-700">
          <div className="space-y-4">
            {/* Delay */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white">
                Tiempo de espera (segundos)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={delay}
                onChange={(e) => setDelay(parseFloat(e.target.value) || 0)}
                className="bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedConfig}
              />
            </div>

            {/* Position */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white">
                Posición de ejecución
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={position_}
                onChange={(e) => setPosition_(parseInt(e.target.value) || 0)}
                className="bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedConfig}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </>
  );
};

export default MItemUnionSelector;