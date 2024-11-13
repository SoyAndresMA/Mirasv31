// Ruta del fichero: /frontend/src/components/caspar/MPrompt/MPrompt.tsx

import React, { useState } from 'react';
import { Play, Square } from 'lucide-react';
import { MPromptProps } from './types';
import { useCasparPromptControl } from '../../../hooks/useItemControl';
import MItemUnionSelector from '../../common/MItemUnion/MItemUnionSelector';

const MPrompt: React.FC<MPromptProps> = ({
    item,
    isActive = false,
    onToggle,
    availableUnions,
    onUnionChange
}) => {
    const [isUnionSelectorOpen, setIsUnionSelectorOpen] = useState<{
        open: boolean;
        x: number;
        y: number;
    }>({
        open: false,
        x: 0,
        y: 0
    });

    const {
        play,
        stop,
        update,
        isPlaying,
        error
    } = useCasparPromptControl(item.id);

    const backgroundColor = isActive ? item.activeColor : item.inactiveColor;

    const handlePlayPause = async () => {
        try {
            if (isPlaying) {
                await stop();
            } else {
                await play({ text: item.text });
            }
            onToggle?.();
        } catch (err) {
            console.error('Error controlling prompt:', err);
        }
    };

    const handleUnionIconDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setIsUnionSelectorOpen({
            open: true,
            x: rect.left + rect.width/2,
            y: rect.top + rect.height/2
        });
    };

    const handleUnionSelect = (union: any) => {
        if (onUnionChange) {
            onUnionChange(item.id, union);
        }
    };

    const handleTextUpdate = async (newText: string) => {
        try {
            await update({ text: newText });
        } catch (err) {
            console.error('Error updating prompt text:', err);
        }
    };

    return (
        <div className="flex gap-[1px] h-12" style={{ width: '265px' }}>
            <div 
                className="w-12 h-full flex flex-col items-center justify-center rounded text-center text-white"
                style={{ backgroundColor }}
                onDoubleClick={handleUnionIconDoubleClick}
            >
                {item.munion && (
                    <>
                        <div 
                            className="h-6 w-6 flex items-center justify-center text-white"
                            dangerouslySetInnerHTML={{ __html: item.munion.icon }}
                        />
                        <div className="text-xs font-mono">
                            {item.munion.position || '0'}
                        </div>
                    </>
                )}
            </div>

            <div
                className="flex items-center gap-2 px-2 py-0.5 text-white rounded h-full w-[217px]"
                style={{ backgroundColor }}
            >
                <button
                    onClick={handlePlayPause}
                    className="flex items-center justify-center p-1.5 rounded transition-colors hover:bg-opacity-80"
                    disabled={Boolean(error)}
                >
                    {isPlaying ? (
                        <Square size={24} className="fill-current" />
                    ) : (
                        <Play size={24} className="fill-current" />
                    )}
                </button>

                <div className="flex-grow text-sm line-clamp-2">
                    {item.text}
                </div>
            </div>

            <MItemUnionSelector
                isOpen={isUnionSelectorOpen.open}
                position={{x: isUnionSelectorOpen.x, y: isUnionSelectorOpen.y}}
                onClose={() => setIsUnionSelectorOpen({open: false, x: 0, y: 0})}
                onSelect={handleUnionSelect}
                currentUnion={item.munion}
                availableUnions={availableUnions}
            />
        </div>
    );
};

export default MPrompt;