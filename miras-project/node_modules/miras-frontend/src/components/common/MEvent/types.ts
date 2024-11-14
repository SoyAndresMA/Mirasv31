import { ReactNode } from 'react';
import { MUnionConfig } from '../MItemUnion/types';

export interface MItemPosition {
  row: number;
  column: number;
}

export interface MItemBase {
  id: number;
  type: string;
  position: MItemPosition;
  union?: MUnionConfig;
}

export interface MEventState {
  isExecuting: boolean;
  activeRows: Record<number, boolean>;
  activeItems: Record<number, boolean>;
  error?: string;
}

export interface MEventProps {
  id: number;
  title: string;
  order: number;
  items: MItemBase[];
  union?: MUnionConfig;
  onEventChange?: (eventId: number, changes: Partial<MEventProps>) => void;
  onUnionChange?: (eventId: number, union: MUnionConfig | null) => void;
  onItemChange?: (eventId: number, itemId: number, changes: Partial<MItemBase>) => void;
  children?: ReactNode;
}

export interface MEventRowProps {
  rowNumber: number;
  items: (MItemBase | null)[];
  isActive: boolean;
  onToggleRow: (row: number) => void;
  onItemChange?: (itemId: number, changes: Partial<MItemBase>) => void;
  availableUnions: MUnionConfig[];
}

export interface MEventErrorProps {
  message: string;
  details?: string;
}

export type ItemsByRow = Record<number, (MItemBase | null)[]>;