// Ruta del fichero: backend/src/devices/caspar/types.ts

import { DeviceConfig, DeviceOperationResult } from '../base/types';

/** Configuración específica de CasparCG */
export interface CasparConfig extends DeviceConfig {
  channels: number[];
  layers: number[];
  defaultChannel?: number;
  defaultLayer?: number;
  mediaPath?: string;
  templatePath?: string;
  logLevel?: 'trace' | 'debug' | 'info' | 'warning' | 'error';
}

/** Estados posibles de un item en CasparCG */
export enum CasparItemState {
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  LOADING = 'loading',
  ERROR = 'error'
}

/** Tipos de comandos soportados */
export enum CasparCommandType {
  PLAY = 'play',
  PAUSE = 'pause',
  RESUME = 'resume',
  STOP = 'stop',
  LOAD = 'load',
  CLEAR = 'clear',
  CALL = 'call',
  SWAP = 'swap',
  ADD = 'add',
  REMOVE = 'remove',
  INFO = 'info'
}

/** Información de un clip de video */
export interface CasparClipInfo {
  type: 'clip';
  clipName: string;
  path: string;
  frames: number;
  fps: number;
  duration: number;
  width: number;
  height: number;
  channels: number;
  format: string;
}

/** Información de un template */
export interface CasparTemplateInfo {
  type: 'template';
  name: string;
  path: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  fields: string[];
}

/** Parámetros para comando PLAY */
export interface CasparPlayParams {
  channel: number;
  layer: number;
  clipName: string;
  loop?: boolean;
  transition?: {
    type: 'cut' | 'mix' | 'push' | 'wipe';
    duration?: number;
  };
}

/** Parámetros para comando LOAD */
export interface CasparLoadParams {
  channel: number;
  layer: number;
  clipName: string;
  loop?: boolean;
}

/** Parámetros para comando ADD */
export interface CasparTemplateParams {
  channel: number;
  layer: number;
  template: string;
  playOnLoad?: boolean;
  data?: Record<string, unknown>;
}

/** Resultado de una operación con clip */
export interface CasparClipResult extends DeviceOperationResult {
  data?: {
    state: CasparItemState;
    info?: CasparClipInfo;
    position?: number;
    duration?: number;
  };
}

/** Resultado de una operación con template */
export interface CasparTemplateResult extends DeviceOperationResult {
  data?: {
    state: CasparItemState;
    info?: CasparTemplateInfo;
    fields?: Record<string, unknown>;
  };
}

/** Estado de un canal */
export interface CasparChannelState {
  channel: number;
  layers: Map<number, CasparLayerState>;
  format: string;
  width: number;
  height: number;
  fps: number;
}

/** Estado de una capa */
export interface CasparLayerState {
  layer: number;
  type: 'empty' | 'clip' | 'template';
  state: CasparItemState;
  info?: CasparClipInfo | CasparTemplateInfo;
  background?: boolean;
}