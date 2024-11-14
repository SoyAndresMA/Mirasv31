// Ruta del fichero: /frontend/src/components/caspar/MGraphics/types.ts

import { MUnion } from '../../../core/types';

export interface MGraphicsType {
    id: number;
    type: 'mgraphics';
    name: string;
    idgraphics: number;
    urlweb: string;
    position_row: number;
    position_column: number;
    activeColor: string;
    inactiveColor: string;
    munion?: MUnion | null;
}

export interface MGraphicsProps {
    item: MGraphicsType;
    isActive?: boolean;
    onToggle?: () => void;
    availableUnions: MUnion[];
    onUnionChange?: (itemId: number, union: MUnion | null) => void;
}

export interface MGraphicsData {
    template: string;
    data: Record<string, any>;
}

export interface MGraphicsState {
    isPlaying: boolean;
    currentData: Record<string, any>;
    error?: string;
}

export type MGraphicsCommand = 
    | { type: 'PLAY'; data?: Record<string, any> }
    | { type: 'STOP' }
    | { type: 'UPDATE'; data: Record<string, any> };

export interface MGraphicsConfig {
    templatePath: string;
    channel: number;
    layer: number;
    initialData?: Record<string, any>;
}