// Ruta del fichero: /frontend/src/components/common/MItemUnion/types.ts

import { ReactNode } from 'react';

export type UnionType = 'parallel' | 'infinite' | 'manual' | 'sequential';

export interface MUnionConfig {
  id: number;
  type: UnionType;
  name: string;
  icon: string;
  compatibleItems: string[];
  position?: number;
  delay?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface MItemUnionProps {
  config: MUnionConfig;
  onToggle?: () => void;
  onConfigChange?: (config: Partial<MUnionConfig>) => void;
  isActive?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

export interface MItemUnionSelectorProps {
  isOpen: boolean;
  position: Position;
  onClose: () => void;
  onSelect: (config: MUnionConfig | null) => void;
  currentConfig?: MUnionConfig;
  availableConfigs: MUnionConfig[];
}

export interface UnionValidationError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface UnionExecutionState {
  isExecuting: boolean;
  startTime?: number;
  error?: UnionValidationError;
}

export interface UnionCompatibility {
  isCompatible: boolean;
  error?: UnionValidationError;
  warnings?: string[];
}