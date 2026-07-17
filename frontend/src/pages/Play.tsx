import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineCode,
  HiOutlineTerminal,
  HiOutlineInformationCircle,
  HiOutlinePlay,
} from 'react-icons/hi';
import { getScenario, submitAnswer } from '../lib/api';
import type { ScenarioDetail, Stage } from '../lib/api';
import { CodeSandbox } from '../components/CodeEditor';
import { TerminalSandbox } from '../components/TerminalEmulator';
import { DragDropStage } from '../components/DragDropStage';

// ─── Timer ────────────────────────────────────────────────────────────────────
function Timer({ totalSeconds, isActive, onExpire }: { totalSeconds: number; isActive: boolean; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (!isActive) return;
    if (remaining <= 0) { onExpire(); return; }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, isActive]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const pct = (remaining / totalSeconds) * 100;
  const urgent = remaining < 60;

  return (
    <div className="flex items-center gap-3">
      <div className={`w-32 h-2 rounded-full bg-gray-800 overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full ${urgent ? 'bg-red-500' : 'bg-blue-500'}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className={`font-mono font-bold tabular-nums ${urgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
        <HiOutlineClock className="w-4 h-4 inline mr-1 -mt-0.5" />
        {mm}:{ss}
      </div>
    </div>
  );
}

// ─── Stage Step Pill ───────────────────────────────────────────────────────────
const STAGE_META: Record<string, { icon: React.ReactNode; color: string }> = {
  detect:     { icon: <HiOutlineShieldCheck className="w-4 h-4" />, color: 'text-blue-400'   },
  assess:     { icon: <HiOutlineLightningBolt className="w-4 h-4" />, color: 'text-yellow-400' },
  root_cause: { icon: <HiOutlineInformationCircle className="w-4 h-4" />, color: 'text-purple-400' },
  fix:        { icon: <HiOutlinePlay className="w-4 h-4" />, color: 'text-green-400'   },
};

// ─── MCQ Component ─────────────────────────────────────────────────────────────
function MCQStage({ options, onSubmit, disabled }: { options: string[]; onSubmit: (a: string) => void; disabled: boolean }) {
  const [selected, setSelected] = useState('');
  return (
    <div className="space-y-3">
      {options.map((opt, i) => (
        <label
          key={i}
          className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
            selected === opt
              ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500'
              : 'bg-[#1a1a2e]/50 border-gray-700 hover:border-gray-500'
          }`}
        >
          <input
            type="radio"
            name="mcq"
            value={opt}
            checked={selected === opt}
            onChange={() => setSelected(opt)}
            className="mt-0.5 text-blue-500 focus:ring-blue-500 bg-transparent border-gray-500 shrink-0"
          />
          <span className="text-sm text-gray-200 leading-relaxed">{opt}</span>
        </label>
      ))}
      <button
        onClick={() => onSubmit(selected)}
        disabled={!selected || disabled}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl mt-4 transition-colors shadow-lg"
      >
        <HiOutlineCheckCircle className="w-5 h-5" />
        {disabled ? 'Analyzing...' : 'Submit Answer'}
      </button>
    </div>
  );
}

// ─── Free Text Component ───────────────────────────────────────────────────────
function FreeTextStage({ onSubmit, disabled }: { onSubmit: (a: string) => void; disabled: boolean }) {
  const [val, setVal] = useState('');
  return (
    <div className="space-y-4">
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Explain your technical reasoning in detail..."
        rows={6}
        className="w-full bg-[#1a1a2e]/50 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
        spellCheck={false}
      />
      <button
        onClick={() => onSubmit(val)}
        disabled={!val.trim() || disabled}
        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
      >
        <HiOutlineCheckCircle className="w-5 h-5" />
        {disabled ? 'AI Grading...' : 'Submit Explanation'}
      </button>
    </div>
  );
}

// ─── Scenario Scene (left panel) ───────────────────────────────────────────────
const TRACK_SCENES: Record<string, { bg: string; grid: string; label: string }> = {
  cybersecurity: {
    bg: 'radial-gradient(ellipse at 20% 80%, #0d0d1a 0%, #0a0a14 60%, #050510 100%)',
    grid: 'rgba(0,200,100,0.06)',
    label: 'THREAT GRID',
  },
  software: {
    bg: 'radial-gradient(ellipse at 80% 20%, #0a1628 0%, #060d1a 60%, #030612 100%)',
    grid: 'rgba(50,130,255,0.07)',
    label: 'SYSTEM MAP',
  },
  cloud: {
    bg: 'radial-gradient(ellipse at 50% 10%, #0a1220 0%, #06101a 60%, #030810 100%)',
    grid: 'rgba(20,184,166,0.07)',
    label: 'CLOUD TOPOLOGY',
  },
};

const STAGE_POSITIONS = [
  { x: 28, y: 38 }, { x: 68, y: 28 }, { x: 52, y: 67 }, { x: 80, y: 78 },
];

function SceneNode({
  stage, index, currentIdx, onClick,
}: {
  stage: Stage; index: number; currentIdx: number; onClick: () => void;
}) {
  const status = index < currentIdx ? 'done' : index === currentIdx ? 'active' : 'locked';
  const pos = STAGE_POSITIONS[index] || { x: 50, y: 50 };
  const meta = STAGE_META[stage.label] || STAGE_META.detect;

  return (
    <motion.button
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
      onClick={status === 'active' ? onClick : undefined}
      disabled={status !== 'active'}
      whileHover={status === 'active' ? { scale: 1.1 } : {}}
      whileTap={status === 'active' ? { scale: 0.95 } : {}}
    >
      <motion.div
        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-xl transition-all ${
          status === 'done'    ? 'border-green-500 bg-green-500/20 text-green-400' :
          status === 'active' ? 'border-blue-400 bg-blue-500/20 text-blue-300 cursor-pointer' :
                                'border-gray-700 bg-gray-900/50 text-gray-600 cursor-not-allowed'
        }`}
        animate={status === 'active' ? { boxShadow: ['0 0 0px rgba(59,130,246,0)', '0 0 20px rgba(59,130,246,0.5)', '0 0 0px rgba(59,130,246,0)'] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {status === 'done' ? <HiOutlineCheckCircle className="w-5 h-5" /> : meta.icon}
      </motion.div>
      <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap px-2 py-0.5 rounded ${
        status === 'active' ? 'text-blue-300 bg-blue-900/40' :
        status === 'done'   ? 'text-green-400 bg-green-900/30' :
                              'text-gray-600'
      }`}>
        {stage.label.replace('_', ' ')}
      </span>

      {status === 'active' && (
        <motion.div
          className="absolute -inset-3 rounded-full border border-blue-500/30"
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}

// ─── Main Play Page ────────────────────────────────────────────────────────────
export default function Play() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();

  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [activeStage, setActiveStage] = useState<Stage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hint, setHint] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getScenario(scenarioId!);
        setScenario(data);
        setIsActive(true);
        toast('📡 Simulation loaded — click the glowing node to begin', { icon: '🧪' });
      } catch {
        toast.error('Failed to load scenario');
        navigate('/catalog');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [scenarioId, navigate]);

  const handleNodeClick = () => {
    if (!scenario) return;
    setActiveStage(scenario.stages[currentStageIdx]);
    setHint('');
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!activeStage) return;
    setIsSubmitting(true);
    try {
      const result = await submitAnswer(activeStage.id, answer, 45);
      if (result.is_correct) {
        toast.success(`+${result.xp_earned} XP — Stage cleared!`, { icon: '⚡' });
        if (result.ai_feedback) toast(result.ai_feedback, { icon: '🤖', duration: 5000 });
        setActiveStage(null);
        if (currentStageIdx < (scenario?.stages.length ?? 0) - 1) {
          setCurrentStageIdx((p) => p + 1);
        } else {
          setIsActive(false);
          setCompleted(true);
          toast.success('🎉 Incident contained! Simulation complete!', { duration: 5000 });
          setTimeout(() => navigate('/catalog'), 4000);
        }
      } else {
        toast.error('Incorrect — review your approach', { icon: '✗' });
        if (result.ai_feedback) toast(result.ai_feedback, { icon: '🔍', duration: 5000 });
        if (result.hint) setHint(result.hint);
      }
    } catch {
      toast.error('Grading server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeExpire = () => {
    setIsActive(false);
    setActiveStage(null);
    toast.error('⏰ TIME UP — Incident breached containment!', { duration: 5000 });
    setTimeout(() => navigate('/catalog'), 3500);
  };

  if (loading || !scenario) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-blue-400 font-mono text-sm tracking-widest uppercase">Initialising simulation...</p>
        </div>
      </div>
    );
  }

  const trackSlug = scenario.stages[0]?.scenario?.toString() || 'software'; // fallback
  const scene = TRACK_SCENES['software']; // We'll detect from track later

  // Detect which track this scenario belongs to from its stage types
  const hasCyberPattern = scenario.stages.some(
    (s) => s.answer_type === 'terminal' || s.label === 'detect'
  );

  const sceneKey = hasCyberPattern ? 'cybersecurity' : 'software';
  const sceneStyle = TRACK_SCENES[sceneKey];

  // The right panel width depends on whether a sandbox is open
  const sandboxTypes = ['code_editor', 'terminal'];
  const isSandbox = activeStage && sandboxTypes.includes(activeStage.answer_type);
  const rightWidth = isSandbox ? 'w-[55%]' : 'w-[420px]';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#050510] text-white">
      {/* HUD Header */}
      <header className="h-14 bg-[#0a0a1a] border-b border-gray-800 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/catalog')}
            className="text-gray-500 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Abort
          </button>
          <span className="text-gray-700">|</span>
          <div className="flex items-center gap-2">
            {sceneKey === 'cybersecurity' ? (
              <HiOutlineShieldCheck className="w-5 h-5 text-red-400" />
            ) : (
              <HiOutlineCode className="w-5 h-5 text-blue-400" />
            )}
            <h1 className="font-display font-bold text-white text-sm truncate max-w-xs">{scenario.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Stage progress pills */}
          <div className="hidden md:flex items-center gap-2">
            {scenario.stages.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                  i < currentStageIdx ? 'bg-green-900/40 border-green-700 text-green-400' :
                  i === currentStageIdx ? 'bg-blue-900/40 border-blue-600 text-blue-300' :
                  'bg-transparent border-gray-800 text-gray-600'
                }`}
              >
                {STAGE_META[s.label]?.icon}
                {s.label.replace('_', ' ')}
              </div>
            ))}
          </div>

          <Timer totalSeconds={scenario.time_limit_seconds} isActive={isActive} onExpire={handleTimeExpire} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Scenario scene */}
        <div
          className={`relative flex-1 overflow-hidden transition-all duration-500 ${activeStage ? '' : 'flex-1'}`}
          style={{ background: sceneStyle.bg }}
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(${sceneStyle.grid} 1px, transparent 1px), linear-gradient(90deg, ${sceneStyle.grid} 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Corner label */}
          <div className="absolute top-4 left-4 text-[10px] font-bold tracking-widest text-gray-600 font-mono uppercase">
            {sceneStyle.label}
          </div>

          {/* Connection lines between nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            {STAGE_POSITIONS.slice(0, scenario.stages.length - 1).map((pos, i) => {
              const next = STAGE_POSITIONS[i + 1];
              return (
                <line
                  key={i}
                  x1={`${pos.x}%`} y1={`${pos.y}%`}
                  x2={`${next.x}%`} y2={`${next.y}%`}
                  stroke={i < currentStageIdx ? '#22c55e' : '#374151'}
                  strokeWidth="1"
                  strokeDasharray={i >= currentStageIdx ? '4 4' : ''}
                />
              );
            })}
          </svg>

          {/* Stage nodes */}
          {scenario.stages.map((stage, idx) => (
            <SceneNode
              key={stage.id}
              stage={stage}
              index={idx}
              currentIdx={currentStageIdx}
              onClick={handleNodeClick}
            />
          ))}

          {/* Initial narrative overlay */}
          {!activeStage && !completed && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-lg text-center pointer-events-none px-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/70 backdrop-blur border border-gray-700 rounded-xl p-5 text-sm text-gray-300 font-mono"
              >
                {scenario.narrative}
                <br /><br />
                <span className="text-blue-400 text-xs animate-pulse">
                  ▶ Click the glowing node to begin the incident
                </span>
              </motion.div>
            </div>
          )}

          {/* Completion overlay */}
          {completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur"
            >
              <div className="text-center">
                <HiOutlineCheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
                <h2 className="text-3xl font-display font-black text-green-400 mb-2">INCIDENT CONTAINED</h2>
                <p className="text-gray-400">Returning to catalog...</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT — Stage Panel */}
        <AnimatePresence>
          {activeStage && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className={`${rightWidth} shrink-0 flex flex-col bg-[#0d0d1a] border-l border-gray-800 shadow-2xl z-10 h-full overflow-hidden`}
            >
              {/* Panel header */}
              <div className="px-5 py-4 border-b border-gray-800 bg-[#0a0a14] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${STAGE_META[activeStage.label]?.color} border-current bg-current/10`}>
                    {STAGE_META[activeStage.label]?.icon}
                    {activeStage.label.replace('_', ' ').toUpperCase()}
                  </div>
                  <span className="text-gray-600 text-sm">Stage {activeStage.order} / {scenario.stages.length}</span>
                  {activeStage.answer_type === 'code_editor' && (
                    <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-800">
                      <HiOutlineCode className="w-3 h-3" /> Code
                    </div>
                  )}
                  {activeStage.answer_type === 'terminal' && (
                    <div className="flex items-center gap-1 text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-800">
                      <HiOutlineTerminal className="w-3 h-3" /> Terminal
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setActiveStage(null); setHint(''); }}
                  className="text-gray-600 hover:text-white transition-colors"
                >
                  <HiOutlineXCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                {/* Prompt + artifact (only non-sandbox) */}
                {activeStage.answer_type !== 'code_editor' && activeStage.answer_type !== 'terminal' && (
                  <div className="p-5 space-y-4 border-b border-gray-800">
                    <h3 className="text-base font-bold text-white leading-snug">{activeStage.prompt}</h3>
                    {activeStage.artifact && (
                      <div className="bg-black border border-gray-800 rounded-lg p-4 overflow-x-auto max-h-52">
                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{activeStage.artifact}</pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Sandbox types — full-height */}
                {(activeStage.answer_type === 'code_editor' || activeStage.answer_type === 'terminal') && (
                  <div className="p-4 border-b border-gray-800 space-y-2">
                    <h3 className="text-sm font-bold text-white leading-snug">{activeStage.prompt}</h3>
                    {activeStage.artifact && (
                      <details className="group">
                        <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 flex items-center gap-1">
                          <HiOutlineInformationCircle className="w-3.5 h-3.5" /> View context / environment
                        </summary>
                        <div className="mt-2 bg-black border border-gray-800 rounded p-3 overflow-x-auto max-h-40">
                          <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">{activeStage.artifact}</pre>
                        </div>
                      </details>
                    )}
                  </div>
                )}

                {/* Answer Input */}
                <div className={`${activeStage.answer_type === 'code_editor' || activeStage.answer_type === 'terminal' ? 'flex-1 min-h-0' : 'p-5'}`}>
                  {activeStage.answer_type === 'mcq' && (
                    <MCQStage
                      options={activeStage.mcq_options}
                      onSubmit={handleSubmitAnswer}
                      disabled={isSubmitting}
                    />
                  )}

                  {activeStage.answer_type === 'free_text' && (
                    <FreeTextStage onSubmit={handleSubmitAnswer} disabled={isSubmitting} />
                  )}

                  {activeStage.answer_type === 'drag_drop' && (
                    <DragDropStage
                      items={activeStage.drag_items}
                      onSubmit={(ordered) => handleSubmitAnswer(JSON.stringify(ordered))}
                      disabled={isSubmitting}
                    />
                  )}

                  {activeStage.answer_type === 'code_editor' && (
                    <div className="h-full">
                      <CodeSandbox
                        prompt={activeStage.prompt}
                        artifact={activeStage.artifact}
                        onSubmit={handleSubmitAnswer}
                        disabled={isSubmitting}
                      />
                    </div>
                  )}

                  {activeStage.answer_type === 'terminal' && (
                    <div className="h-full">
                      <TerminalSandbox
                        onSubmit={handleSubmitAnswer}
                        disabled={isSubmitting}
                      />
                    </div>
                  )}
                </div>

                {/* Hint */}
                <AnimatePresence>
                  {hint && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mx-5 mb-5 p-4 bg-yellow-500/10 border border-yellow-600/30 rounded-xl text-yellow-300 text-sm flex gap-2"
                    >
                      <HiOutlineInformationCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div><strong>Hint:</strong> {hint}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
