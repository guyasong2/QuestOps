import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineArrowUp, HiOutlineArrowDown, HiOutlineCheckCircle } from 'react-icons/hi';

interface DragDropStageProps {
  items: string[];
  onSubmit: (orderedItems: string[]) => void;
  disabled?: boolean;
}

export function DragDropStage({ items, onSubmit, disabled }: DragDropStageProps) {
  const [order, setOrder] = useState<string[]>([...items]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const moveItem = (from: number, to: number) => {
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
  };

  // Drag handlers
  const onDragStart = (idx: number) => setDraggingIdx(idx);
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const onDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggingIdx !== null && draggingIdx !== idx) {
      moveItem(draggingIdx, idx);
    }
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted mb-2">Drag items into the correct order, or use the arrows.</p>
      <div className="space-y-2">
        {order.map((item, idx) => (
          <motion.div
            key={item}
            layout
            draggable={!disabled}
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDrop={(e) => onDrop(e, idx)}
            onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null); }}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing select-none transition-all ${
              dragOverIdx === idx
                ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                : draggingIdx === idx
                ? 'opacity-40 border-dashed border-gray-300'
                : 'bg-surface border-border hover:border-blue-300'
            }`}
          >
            {/* Drag handle */}
            <div className="flex flex-col gap-0.5 text-text-muted shrink-0">
              <div className="w-3.5 h-0.5 bg-current rounded" />
              <div className="w-3.5 h-0.5 bg-current rounded" />
              <div className="w-3.5 h-0.5 bg-current rounded" />
            </div>

            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold shrink-0">
              {idx + 1}
            </span>

            <span className="flex-1 text-sm text-text">{item}</span>

            {/* Arrow buttons (fallback for non-drag) */}
            <div className="flex flex-col gap-1 shrink-0">
              <button
                disabled={idx === 0 || disabled}
                onClick={() => moveItem(idx, idx - 1)}
                className="text-text-muted hover:text-blue-600 disabled:opacity-20 transition-colors"
              >
                <HiOutlineArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={idx === order.length - 1 || disabled}
                onClick={() => moveItem(idx, idx + 1)}
                className="text-text-muted hover:text-blue-600 disabled:opacity-20 transition-colors"
              >
                <HiOutlineArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <button
        onClick={() => onSubmit(order)}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-3 rounded-lg mt-4 transition-colors shadow"
      >
        <HiOutlineCheckCircle className="w-5 h-5" />
        {disabled ? 'Checking...' : 'Submit Sequence'}
      </button>
    </div>
  );
}
