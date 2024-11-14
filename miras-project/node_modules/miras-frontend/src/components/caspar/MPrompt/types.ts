// /frontend/src/components/caspar/MPrompt/types.ts

import { Position } from '../../../core/types';
import { MItemUnion } from '../../common/MItemUnion/types';

export interface MPromptCasparProps {
    id: number;
    channel: number;
    layer: number;
    text: string;
    position: Position;
    union?: MItemUnion;
    active?: boolean;
    onStateChange?: (state: MPromptState) => void;
}

export interface MPromptState {
    isPlaying: boolean;
    text: string;
    error?: string;
}

export interface MPromptControls {
    play: () => Promise<void>;
    stop: () => Promise<void>;
    updateText: (text: string) => Promise<void>;
}