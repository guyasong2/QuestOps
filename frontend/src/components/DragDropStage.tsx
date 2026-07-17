import React, { useState, useRef } from 'react';
import { HiOutlineCheckCircle, HiOutlineMenuAlt4 } from 'react-icons/hi';

interface DragDropStageProps {
  items: string[];
  onSubmit: (orderedItems: string[]) => void;
  disabled?: boolean;
}

export function DragDropStage({ items, onSubmit, disabled }: DragDropStageProps) {
  const [order, setOrder] = useState<string[]>([...items]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    setDraggingIdx(idx);
    // Set drag data so drop works cross-browser
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    // Make the ghost image mostly transparent
    const ghost = document.createElement('div');
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    setOverIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overIdx !== idx) setOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    if (draggingIdx !== null && draggingIdx !== idx) {
      const next = [...order];
      const [moved] = next.splice(draggingIdx, 1);
      next.splice(idx, 0, moved);
      setOrder(next);
    }
    setDraggingIdx(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggingIdx(null);
    setOverIdx(null);
  };

  const moveItem = (from: number, to: number) => {
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted mb-2 flex items-center gap-2">
        <HiOutlineMenuAlt4 className="w-4 h-4" />
        Drag items into the correct order, or use the ↑↓ arrows.
      </p>

      <div className="space-y-2">
        {order.map((item, idx) => {
          const isDragging = draggingIdx === idx;
          const isOver = overIdx === idx && draggingIdx !== idx;

          return (
            <div
              key={item}
              ref={isDragging ? dragNode : null}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnter={(e) => handleDragEnter(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 p-3 rounded-xl border-[3px] cursor-grab active:cursor-grabbing select-none transition-all duration-150
                ${isDragging
                  ? 'opacity-30 scale-95 border-dashed border-text-muted bg-bg'
                  : isOver
                    ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_0_3px_rgba(59,130,246,0.25)] scale-[1.01]'
                    : 'bg-surface border-text hover:border-blue-400 shadow-[2px_2px_0_#111214]'
                }
              `}
            >
              {/* Drag Handle */}
              <div className="shrink-0 flex flex-col gap-[3px] cursor-grab text-text-muted px-1">
                <div className="w-4 h-0.5 bg-current rounded-full" />
                <div className="w-4 h-0.5 bg-current rounded-full" />
                <div className="w-4 h-0.5 bg-current rounded-full" />
              </div>

              {/* Position Number Badge */}
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 shrink-0 transition-colors ${
                isOver ? 'bg-blue-500 border-blue-500 text-white' : 'bg-bg border-text text-text'
              }`}>
                {idx + 1}
              </span>

              {/* Item Text */}
              <span className="flex-1 text-sm font-medium text-text leading-snug">{item}</span>

              {/* Arrow Buttons */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  disabled={idx === 0 || disabled}
                  onClick={() => moveItem(idx, idx - 1)}
                  className="p-1 text-text-muted hover:text-blue-500 disabled:opacity-20 transition-colors rounded hover:bg-blue-50"
                >
                  ▲
                </button>
                <button
                  disabled={idx === order.length - 1 || disabled}
                  onClick={() => moveItem(idx, idx + 1)}
                  className="p-1 text-text-muted hover:text-blue-500 disabled:opacity-20 transition-colors rounded hover:bg-blue-50"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onSubmit(order)}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl mt-4 transition-colors border-[3px] border-text shadow-[4px_4px_0_#111214] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#111214]"
      >
        <HiOutlineCheckCircle className="w-5 h-5" />
        {disabled ? 'Checking...' : 'Submit Sequence'}
      </button>
    </div>
  );
}
