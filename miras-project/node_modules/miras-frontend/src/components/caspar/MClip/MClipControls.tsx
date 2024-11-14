// Ruta del fichero: /frontend/src/components/caspar/MClip/MClipControls.tsx

import React, { useState } from 'react';
import { Play, Square, Repeat } from 'lucide-react';
import { MClipControlsProps } from './types';

const MClipControls: React.FC<MClipControlsProps> = ({
  state,
  config,
  onPlay,
  onStop,
  onLoop,
  disabled = false
}) => {
  const [isLoopEnabled, setIsLoopEnabled] = useState(config.loop || false);

  const handleLoopToggle = () => {
    const newLoopState = !isLoopEnabled;
    setIsLoopEnabled(newLoopState);
    onLoop?.(newLoopState);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={state.isPlaying ? onStop : onPlay}
        disabled={disabled}
        className={`
          flex items-center justify-center p-1.5 rounded
          transition-colors
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-black/20'}
        `}
        title={state.isPlaying ? 'Detener' : 'Reproducir'}
      >
        {state.isPlaying ? (
          <Square className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </button>

      {onLoop && (
        <button
          onClick={handleLoopToggle}
          disabled={disabled}
          className={`
            flex items-center justify-center p-1.5 rounded
            transition-colors
            ${isLoopEnabled ? 'text-blue-300' : 'text-white/60'}
            ${disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-black/20'}
          `}
          title="Repetir"
        >
          <Repeat className="h-4 w-4" />
        </button>
      )}

      {state.position !== undefined && state.duration !== undefined && state.fps && (
        <div className="ml-1 text-xs opacity-80">
          {Math.floor(state.position / state.fps)}s
        </div>
      )}
    </div>
  );
};

export default MClipControls;