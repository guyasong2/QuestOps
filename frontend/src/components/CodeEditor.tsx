import { useState } from 'react';
import _Editor from 'react-simple-code-editor';
const Editor: any = (_Editor as any).default || _Editor;
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/themes/prism-tomorrow.css';
import { HiOutlineRefresh, HiOutlineX } from 'react-icons/hi';

interface CodeSandboxProps {
  prompt?: string;
  artifact?: string;
  onSubmit: (code: string) => void;
  disabled?: boolean;
}

export function CodeSandbox({ onSubmit, disabled }: CodeSandboxProps) {
  const [code, setCode] = useState('function compute() {\n  // write your code here\n\n}');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState<string | null>(null);

  const handleRun = () => {
    setOutput('▶ Executing...\n\nCode evaluated successfully. Submitting results...');
    setTimeout(() => {
      onSubmit(code);
    }, 700);
  };

  const handleReset = () => {
    setCode('function compute() {\n  // write your code here\n\n}');
    setOutput(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#1b2028] text-sm font-sans w-full max-w-[600px] shadow-2xl overflow-hidden border-l border-gray-800">
      {/* Top Tabs */}
      <div className="flex bg-[#12151b] border-b border-gray-800 text-xs overflow-x-auto select-none shrink-0 scrollbar-hide">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#1b2028] text-white border-r border-gray-800 min-w-max cursor-pointer border-t-2 border-t-blue-500">
          <span>Troubled T...</span>
          <HiOutlineX className="w-3 h-3 text-gray-500 hover:text-white" />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:bg-[#1b2028] hover:text-gray-300 border-r border-gray-800 min-w-max cursor-pointer">
          <span>Andrew_REA</span>
          <HiOutlineX className="w-3 h-3 opacity-50" />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:bg-[#1b2028] hover:text-gray-300 border-r border-gray-800 min-w-max cursor-pointer">
          <span>Enigmida</span>
          <HiOutlineX className="w-3 h-3 opacity-50" />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:bg-[#1b2028] hover:text-gray-300 border-r border-gray-800 min-w-max cursor-pointer">
          <span>Advisory A...</span>
          <HiOutlineX className="w-3 h-3 opacity-50" />
        </div>
        <div className="flex items-center justify-center px-3 py-2 text-gray-500 hover:text-white cursor-pointer hover:bg-[#1b2028]">
          +
        </div>
      </div>

      {/* Sub-header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <span>Manual</span>
            <div className="w-8 h-4 bg-gray-600 rounded-full relative flex items-center px-0.5 cursor-pointer">
              <div className="w-3 h-3 bg-white rounded-full translate-x-4"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-300 font-bold">Code</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#242b35] text-gray-400 text-xs rounded px-2 py-1 outline-none border border-gray-700"
            >
              <option value="javascript">javascript</option>
              <option value="python">python</option>
            </select>
          </div>
        </div>
        <button onClick={handleReset} className="text-gray-500 hover:text-gray-300 transition-colors">
          <HiOutlineRefresh className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#1e232b] p-4 flex flex-col gap-6">
        
        {/* INPUT Section */}
        <div className="flex gap-3">
          <div className="flex-none">
            <div className="w-6 h-6 rounded-full border-2 border-gray-600 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-700 transition-colors">
              +
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Input</span>
            <div className="bg-[#1b2028] border border-gray-800 rounded-md overflow-hidden relative">
              {/* Pseudo line numbers */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#161a20] border-r border-gray-800 flex flex-col items-center py-4 text-[11px] text-gray-600 font-mono select-none pointer-events-none">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
              </div>
              <Editor
                value={code}
                onValueChange={setCode}
                highlight={(c: string) => Prism.highlight(c, Prism.languages[language] || Prism.languages.javascript, language)}
                padding={16}
                disabled={disabled}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  lineHeight: '1.6',
                  marginLeft: '32px',
                  minHeight: '120px'
                }}
                className="text-gray-300 outline-none"
              />
            </div>
          </div>
        </div>

        {/* OUTPUT Section */}
        <div className="flex gap-3">
          <div className="flex-none">
            <div className="w-6 h-6 rounded-full border-2 border-gray-600 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-700 transition-colors">
              +
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Output</span>
            <div className="bg-[#1b2028] border border-gray-800 rounded-md overflow-hidden relative opacity-70">
              {/* Pseudo line numbers */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#161a20] border-r border-gray-800 flex flex-col items-center py-4 text-[11px] text-gray-600 font-mono select-none pointer-events-none">
                <span>8</span><span>9</span><span>10</span><span>11</span><span>12</span>
              </div>
              <Editor
                value="/* Ignore and do not change the code below */\n// #region main---"
                onValueChange={() => {}}
                highlight={(c: string) => Prism.highlight(c, Prism.languages[language] || Prism.languages.javascript, language)}
                padding={16}
                disabled={true}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  lineHeight: '1.6',
                  marginLeft: '32px'
                }}
                className="text-gray-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161a20] border-t border-gray-800 shrink-0">
        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Actions</span>
        <button
          onClick={handleRun}
          disabled={disabled}
          className="bg-[#2a3644] hover:bg-[#344252] text-gray-300 border border-gray-600 text-[11px] font-bold uppercase tracking-wider px-10 py-2.5 rounded transition-colors flex items-center gap-2"
        >
          <span className="text-[10px]">▶</span> EXECUTE
        </button>
      </div>

      {/* Console Output Footer */}
      <div className="flex flex-col border-t border-gray-800 shrink-0 bg-[#12151b]">
        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          Console output
        </div>
        {output && (
          <div className="px-4 pb-4 pt-1">
            <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
