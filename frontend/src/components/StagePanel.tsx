import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stage } from '../lib/api';
import { CodeSandbox } from './CodeEditor';
import { TerminalSandbox } from './TerminalEmulator';
import { DragDropStage } from './DragDropStage';

interface StagePanelProps {
  stage: Stage | null;
  onClose: () => void;
  onSubmit: (answer: string) => void;
  isSubmitting: boolean;
  hint: string;
}

export default function StagePanel({ stage, onClose, onSubmit, isSubmitting, hint }: StagePanelProps) {
  const [mcqAnswer, setMcqAnswer] = useState<string>('');
  const [freeTextAnswer, setFreeTextAnswer] = useState<string>('');
  
  if (!stage) return null;

  const handleSubmit = (answerOverride?: string) => {
    if (answerOverride !== undefined) {
      onSubmit(answerOverride);
      return;
    }
    if (stage.answer_type === 'mcq') {
      onSubmit(mcqAnswer);
    } else {
      onSubmit(freeTextAnswer);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 w-full md:w-[500px] h-full bg-surface border-l border-border shadow-[8px_8px_0_#111214] border-[3px] border-text z-50 flex flex-col"
      >
        <div className="p-6 border-b border-border flex justify-between items-center bg-bg">
          <div className="flex items-center gap-3">
            <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {stage.label.replace('_', ' ')}
            </span>
            <span className="text-text-muted font-mono text-sm">Stage {stage.order}/4</span>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-text">{stage.prompt}</h3>
            
            {stage.artifact && (
              <div className="bg-black border-[3px] border-text rounded p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-text whitespace-pre-wrap">{stage.artifact}</pre>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            {stage.answer_type === 'mcq' && (
              <div className="space-y-3">
                {stage.mcq_options.map((opt, i) => (
                  <label key={i} className={`flex items-start p-4 rounded border cursor-pointer transition-colors ${mcqAnswer === opt ? 'bg-blue-600/10 border-blue-500' : 'bg-bg border-border hover:border-gray-500'}`}>
                    <input
                      type="radio"
                      name="mcq"
                      value={opt}
                      checked={mcqAnswer === opt}
                      onChange={(e) => setMcqAnswer(e.target.value)}
                      className="mt-1 mr-3 text-blue-600 focus:ring-blue-500 bg-black border-gray-600"
                    />
                    <span className="text-sm text-text">{opt}</span>
                  </label>
                ))}
                <button
                  onClick={() => handleSubmit()}
                  disabled={!mcqAnswer || isSubmitting}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-text font-medium py-3 px-4 rounded transition-colors"
                >
                  {isSubmitting ? 'Analyzing...' : 'Submit Assessment'}
                </button>
              </div>
            )}

            {stage.answer_type === 'free_text' && (
              <div className="space-y-4">
                <textarea
                  value={freeTextAnswer}
                  onChange={(e) => setFreeTextAnswer(e.target.value)}
                  placeholder="Explain your technical reasoning..."
                  className="w-full h-32 bg-bg border-[3px] border-text rounded p-4 text-sm text-text focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  spellCheck={false}
                />
                <button
                  onClick={() => handleSubmit()}
                  disabled={!freeTextAnswer.trim() || isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-text font-medium py-3 px-4 rounded transition-colors"
                >
                  {isSubmitting ? 'AI is Grading...' : 'Submit Explanation'}
                </button>
              </div>
            )}

            {stage.answer_type === 'code_editor' && (
              <CodeSandbox
                onSubmit={(code: string) => handleSubmit(code)}
                disabled={isSubmitting}
              />
            )}

            {stage.answer_type === 'terminal' && (
              <TerminalSandbox
                onSubmit={(cmd: string) => handleSubmit(cmd)}
                disabled={isSubmitting}
              />
            )}

            {stage.answer_type === 'drag_drop' && (
              <DragDropStage
                items={stage.drag_items}
                onSubmit={(ordered) => handleSubmit(JSON.stringify(ordered))}
                disabled={isSubmitting}
              />
            )}
          </div>

          {hint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm flex gap-3 items-start"
            >
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Hint:</strong> {hint}</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
