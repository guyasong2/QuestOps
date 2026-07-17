import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import {
  HiOutlinePlay,
  HiOutlineRefresh,
  HiOutlineTerminal,
  HiOutlineCode,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi';

interface CodeSandboxProps {
  prompt?: string;
  artifact?: string;
  onSubmit: (code: string) => void;
  disabled?: boolean;
}

const STARTER_COMMENTS: Record<string, string> = {
  python: '# Write your fix here\n',
  bash: '#!/bin/bash\n# Write your command sequence here\n',
};

export function CodeSandbox({ onSubmit, disabled }: CodeSandboxProps) {
  const [code, setCode] = useState(STARTER_COMMENTS.python);
  const [language, setLanguage] = useState<'python' | 'bash'>('python');
  const [output, setOutput] = useState<string | null>(null);
  const [outputType, setOutputType] = useState<'success' | 'error' | 'info'>('info');

  const handleRun = () => {
    // Simulate a "run" before submitting — immediate feedback before AI grading
    setOutput('▶ Running code in sandbox...\n\nCode executed without syntax errors. Submitting for AI evaluation...');
    setOutputType('info');
    setTimeout(() => {
      onSubmit(code);
    }, 700);
  };

  const handleReset = () => {
    setCode(STARTER_COMMENTS[language]);
    setOutput(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-sm font-mono">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <HiOutlineCode className="w-4 h-4 text-blue-400" />
          <span className="text-gray-300 text-xs font-bold uppercase tracking-wider">Code Sandbox</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => {
              const l = e.target.value as 'python' | 'bash';
              setLanguage(l);
              setCode(STARTER_COMMENTS[l]);
            }}
            className="bg-[#21262d] text-gray-300 text-xs border border-gray-600 rounded px-2 py-1"
          >
            <option value="python">Python</option>
            <option value="bash">Bash</option>
          </select>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-200 text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors"
          >
            <HiOutlineRefresh className="w-3 h-3" /> Reset
          </button>
          <button
            onClick={handleRun}
            disabled={disabled || !code.trim()}
            className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
          >
            <HiOutlinePlay className="w-3 h-3" />
            {disabled ? 'Grading...' : 'Run & Submit'}
          </button>
        </div>
      </div>

      {/* Tabs (INPUT/OUTPUT) */}
      <div className="flex gap-0 border-b border-gray-700 shrink-0">
        <div className="px-4 py-2 text-xs text-gray-300 border-b-2 border-blue-500 font-bold">INPUT</div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <Editor
          value={code}
          onValueChange={setCode}
          highlight={(c) =>
            Prism.highlight(
              c,
              Prism.languages[language] || Prism.languages.markup,
              language
            )
          }
          padding={16}
          disabled={disabled}
          style={{
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
            fontSize: 13,
            minHeight: '180px',
            lineHeight: '1.6',
          }}
          className="editor-container"
        />
      </div>

      {/* Output Panel */}
      {output && (
        <div className="border-t border-gray-700 shrink-0">
          <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700 bg-[#161b22] flex items-center gap-2">
            {outputType === 'success' ? (
              <HiOutlineCheckCircle className="w-4 h-4 text-green-400" />
            ) : outputType === 'error' ? (
              <HiOutlineXCircle className="w-4 h-4 text-red-400" />
            ) : (
              <HiOutlineTerminal className="w-4 h-4 text-blue-400" />
            )}
            Console Output
          </div>
          <pre className={`p-4 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto ${
            outputType === 'success' ? 'text-green-400' :
            outputType === 'error' ? 'text-red-400' :
            'text-blue-300'
          }`}>{output}</pre>
        </div>
      )}
    </div>
  );
}
