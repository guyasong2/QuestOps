import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePaperAirplane,
  HiOutlineBookOpen,
  HiOutlineChip,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlinePlay,
  HiOutlineLightningBolt,
  HiOutlineChat,
} from 'react-icons/hi';
import { getScenario, lessonChat, getLessonChatHistory } from '../lib/api';
import type { ScenarioDetail } from '../lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-blue-500"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export default function Lesson() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();

  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [loadingScenario, setLoadingScenario] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load scenario
  useEffect(() => {
    async function load() {
      try {
        const [data, history] = await Promise.all([
          getScenario(scenarioId!),
          getLessonChatHistory(parseInt(scenarioId!))
        ]);
        setScenario(data);
        
        if (history.length > 0) {
          setMessages(history);
        } else {
          // Greet user with an initial AI message if no history
          setMessages([
            {
              id: 'init',
              role: 'assistant',
              content: `👋 Welcome to the **${data.title}** briefing!\n\nI'm your AI tutor. I've studied this incident in depth and I'm here to help you understand it before you jump into the simulation.\n\nFeel free to ask me anything about the concepts covered — whether it's about the technology, attack vectors, diagnostic steps, or best practices. What would you like to explore first?`,
            },
          ]);
        }
      } catch {
        toast.error('Failed to load scenario briefing or chat history.');
        navigate('/dashboard');
      } finally {
        setLoadingScenario(false);
      }
    }
    load();
  }, [scenarioId, navigate]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping || !scenario) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const { reply } = await lessonChat(scenario.id, trimmed);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: reply },
      ]);
    } catch {
      toast.error('AI tutor is unavailable. Please try again.');
      // Remove the user message so they can retry
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(trimmed);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartSimulation = () => {
    toast.success('Entering simulation…', { icon: '🧪' });
    setTimeout(() => navigate(`/play/${scenarioId}`), 800);
  };

  if (loadingScenario || !scenario) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-text-muted font-mono text-sm">Loading briefing room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden text-text">
      {/* Top Bar */}
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0 shadow-[2px_2px_0_#111214] border-2 border-text z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-text-muted hover:text-text transition-colors flex items-center gap-1.5 text-sm"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Back to Catalog
          </button>
          <span className="text-border">|</span>
          <HiOutlineBookOpen className="w-5 h-5 text-blue-500" />
          <span className="font-display font-bold text-sm truncate max-w-xs">{scenario.title}</span>
        </div>

        <button
          onClick={handleStartSimulation}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-text border-[3px] border-text shadow-[4px_4px_0_#111214] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#111214] text-sm font-bold px-4 py-2 rounded-lg shadow transition-colors"
        >
          <HiOutlinePlay className="w-4 h-4" />
          Start Simulation
        </button>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left Panel — Lesson Content */}
        <aside className="w-full md:w-1/2 flex-1 md:flex-none border-b md:border-b-0 md:border-r border-border overflow-y-auto bg-surface p-4 sm:p-8">
          {/* Scenario Header */}
          <div className="mb-8 pb-6 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineShieldCheck className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-bold text-blue-600 tracking-widest uppercase">
                Pre-Simulation Briefing
              </span>
            </div>
            <h1 className="text-3xl font-display font-black text-text leading-tight mb-3">
              {scenario.title}
            </h1>
            <p className="text-text-muted leading-relaxed">{scenario.narrative}</p>
          </div>

          {/* Lesson Markdown */}
          <div className="lesson-content">
            {scenario.lesson_content ? (
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-display font-black text-text mt-6 mb-3 flex items-center gap-2">
                      <HiOutlineChip className="w-6 h-6 text-blue-500 shrink-0" />
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-display font-bold text-text mt-5 mb-2 flex items-center gap-2">
                      <HiOutlineLightningBolt className="w-5 h-5 text-blue-400 shrink-0" />
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-bold text-text mt-4 mb-1">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-text-muted leading-relaxed mb-4">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-1.5 mb-4 pl-4">{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="flex gap-2 text-text-muted text-sm leading-relaxed">
                      <span className="text-blue-500 shrink-0 mt-1">▸</span>
                      <span>{children}</span>
                    </li>
                  ),
                  code: ({ inline, children }: any) =>
                    inline ? (
                      <code className="bg-gray-100 text-blue-700 px-1.5 py-0.5 rounded font-mono text-xs">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg overflow-x-auto my-4 border-[3px] border-text">
                        <code>{children}</code>
                      </pre>
                    ),
                  strong: ({ children }) => (
                    <strong className="text-text font-bold">{children}</strong>
                  ),
                }}
              >
                {scenario.lesson_content}
              </ReactMarkdown>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <HiOutlineRefresh className="w-8 h-8 text-text-muted mb-3 animate-spin" />
                <p className="text-text-muted text-sm">
                  Lesson content not yet generated for this scenario.
                  <br />
                  Re-run <code className="text-xs bg-gray-100 px-1 rounded">python manage.py generate_scenarios</code>.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Panel — AI Tutor Chat */}
        <div className="w-full md:w-1/2 flex-1 md:flex-none flex flex-col bg-bg overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-border bg-surface flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <HiOutlineChat className="w-4 h-4 text-text" />
            </div>
            <div>
              <p className="font-bold text-text text-sm">AI Tutor</p>
              <p className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                Online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-text border-2 border-text shadow-[2px_2px_0_#111214]'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {msg.role === 'user' ? 'Y' : <HiOutlineChip className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-text border-2 border-text shadow-[2px_2px_0_#111214] rounded-tr-sm'
                        : 'bg-surface border-[3px] border-text text-text rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          code: ({ inline, children }: any) =>
                            inline ? (
                              <code className="bg-gray-100 text-blue-700 px-1 py-0.5 rounded font-mono text-xs">
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-gray-900 text-green-400 font-mono text-xs p-3 rounded-lg overflow-x-auto my-2">
                                <code>{children}</code>
                              </pre>
                            ),
                          ul: ({ children }) => (
                            <ul className="space-y-1 my-2 pl-2">{children}</ul>
                          ),
                          li: ({ children }) => (
                            <li className="flex gap-2 text-sm">
                              <span className="text-blue-500 shrink-0">▸</span>
                              <span>{children}</span>
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-bold">{children}</strong>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3 items-end"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <HiOutlineChip className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-surface border-[3px] border-text rounded-2xl rounded-tl-sm px-4 py-3">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Suggested prompts (shown when no messages exchanged yet) */}
          {messages.length <= 1 && (
            <div className="px-6 pb-3 flex gap-2 flex-wrap">
              {[
                'Explain the key concepts',
                'What should I watch for?',
                'Give me a quick quiz',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="text-xs border-[3px] border-text text-text-muted hover:border-blue-400 hover:text-blue-600 px-3 py-1.5 rounded-full transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-surface shrink-0">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the AI tutor anything about this scenario… (Enter to send, Shift+Enter for newline)"
                className="flex-1 bg-bg border-[3px] border-text text-text placeholder-text-muted rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-400 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-text rounded-xl flex items-center justify-center shrink-0 transition-colors shadow"
              >
                <HiOutlinePaperAirplane className="w-5 h-5 rotate-90" />
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2 text-center">
              The AI tutor won't give away quiz answers — it guides your thinking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
