import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePaperAirplane,
  HiOutlineChip,
  HiOutlineChat,
} from 'react-icons/hi';
import { getGlobalChatHistory, globalChat } from '../lib/api';

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

export default function Chat() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history
  useEffect(() => {
    async function load() {
      try {
        const history = await getGlobalChatHistory();
        if (history.length > 0) {
          setMessages(history);
        } else {
          // Greet user with an initial AI message if no history
          setMessages([
            {
              id: 'init',
              role: 'assistant',
              content: `👋 Welcome to your global AI assistant!\n\nI can help you with anything related to cybersecurity, software engineering, and cloud infrastructure. Feel free to ask me questions, debug code, or discuss best practices!`,
            },
          ]);
        }
      } catch {
        toast.error('Failed to load chat history.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const { reply } = await globalChat(trimmed);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-text-muted font-mono text-sm">Loading chat terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden text-text">
      {/* Top Bar */}
      <header className="h-14 bg-surface border-b border-border flex items-center px-6 shrink-0 shadow-[2px_2px_0_#111214] border-2 border-text z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-text-muted hover:text-text transition-colors flex items-center gap-1.5 text-sm mr-4"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
        <span className="text-border mr-4">|</span>
        <HiOutlineChat className="w-5 h-5 text-blue-500 mr-2" />
        <span className="font-display font-bold text-sm truncate max-w-xs">Global AI Assistant</span>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden justify-center">
        {/* Chat Container */}
        <div className="w-full max-w-4xl flex flex-col bg-bg overflow-hidden border-l border-r border-border shadow-[8px_8px_0_#111214] border-[3px] border-text my-4 rounded-xl">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-border bg-surface flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-text">
              <HiOutlineChip className="w-4 h-4 text-text" />
            </div>
            <div>
              <p className="font-bold text-text text-sm">AI Copilot</p>
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
                        : 'bg-gray-200 text-gray-600 border-2 border-text'
                    }`}
                  >
                    {msg.role === 'user' ? 'Y' : <HiOutlineChip className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-text border-2 border-text shadow-[2px_2px_0_#111214] rounded-tr-sm'
                        : 'bg-surface border-[3px] border-text text-text shadow-[4px_4px_0_#111214] rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                          code: ({ inline, children }: any) =>
                            inline ? (
                              <code className="bg-gray-100 text-blue-700 px-1 py-0.5 rounded font-mono text-xs">
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg overflow-x-auto my-3 border-[3px] border-text">
                                <code>{children}</code>
                              </pre>
                            ),
                          ul: ({ children }) => (
                            <ul className="space-y-2 my-3 pl-2">{children}</ul>
                          ),
                          li: ({ children }) => (
                            <li className="flex gap-2 text-sm">
                              <span className="text-blue-500 shrink-0 mt-0.5">▸</span>
                              <span>{children}</span>
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-bold text-blue-300">{children}</strong>
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
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-text flex items-center justify-center">
                    <HiOutlineChip className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-surface border-[3px] border-text shadow-[4px_4px_0_#111214] rounded-2xl rounded-tl-sm px-4 py-3">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-surface shrink-0">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message your AI Copilot... (Enter to send, Shift+Enter for newline)"
                className="flex-1 bg-bg border-[3px] border-text shadow-[4px_4px_0_#111214] text-text placeholder-text-muted rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-400 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-text rounded-xl border-[3px] border-text shadow-[4px_4px_0_#111214] flex items-center justify-center shrink-0 transition-colors hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#111214]"
              >
                <HiOutlinePaperAirplane className="w-5 h-5 rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
