// Ruta del fichero: /frontend/src/components/caspar/MClip/types.ts

import { MItemBase } from '../../common/MEvent/types';

export interface ClipState {
  isPlaying: boolean;
  position?: number; // Frame actual
  duration?: number; // Duración total en frames
  fps?: number;      // Frames por segundo
  error?: string;
}

export interface CasparClipConfig {
  channel: number;
  layer: number;
  loop?: boolean;
  autoPlay?: boolean;
}

export interface MClipData extends MItemBase {
  type: 'mclip';
  title: string;
  videoId: string;
  clipPath: string;
  config: CasparClipConfig;
}

export interface MClipProps {
  item: MClipData;
  isActive?: boolean;
  onToggle?: () => void;
  onStateChange?: (state: ClipState) => void;
  onError?: (error: string) => void;
}

export interface MClipControlsProps {
  state: ClipState;
  config: CasparClipConfig;
  onPlay: () => void;
  onStop: () => void;
  onLoop?: (enable: boolean) => void;
  disabled?: boolean;
}

export type ClipCommand = 
  | { type: 'PLAY'; channel: number; layer: number; clipPath: string }
  | { type: 'STOP'; channel: number; layer: number }
  | { type: 'LOOP'; channel: number; layer: number; enable: boolean };