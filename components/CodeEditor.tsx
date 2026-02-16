
import React, { useRef } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      
      if (preRef.current) {
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
      }
      
      if (gutterRef.current) {
        gutterRef.current.scrollTop = scrollTop;
      }
    }
  };

  const highlightCode = (code: string) => {
    if (!code) return '';

    // Escape HTML to prevent injection and rendering issues
    let highlighted = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Pro Syntax Theme - Enhanced Contrast
    
    // 1. Comments: Muted Steel Gray
    const comments = /(\/\/.*|\/\*[\s\S]*?\*\/|#.*)/g;
    highlighted = highlighted.replace(comments, '<span class="text-[#5c6370] italic">$1</span>');

    // 2. Strings: Soft Emerald
    const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
    highlighted = highlighted.replace(strings, '<span class="text-[#98c379] font-medium">$1</span>');

    // 3. Keywords: Elegant Lavender
    const keywords = /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|extends|php|echo|public|private|protected|static|namespace|use|as|new|try|catch|finally|throw|break|continue|case|switch|default|interface|type|async|await|yield|void|delete|typeof|instanceof|in|of|null|undefined|true|false)\b/g;
    highlighted = highlighted.replace(keywords, '<span class="text-[#c678dd] font-bold">$1</span>');

    // 4. Functions & Methods: Sky Blue
    const functions = /\b([a-zA-Z_]\w*)(?=\s*\()/g;
    highlighted = highlighted.replace(functions, '<span class="text-[#61afef]">$1</span>');

    // 5. Numbers & Constants: Warm Amber
    const numbers = /\b(\d+(\.\d+)?|NaN|Infinity|null|undefined|true|false)\b/g;
    highlighted = highlighted.replace(numbers, '<span class="text-[#d19a66]">$1</span>');

    // 6. Types & HTML Tags: Golden Yellow
    const types = /\b(String|Number|Boolean|Array|Object|Promise|any|void|never|Int|Float|bool|React|HTML\w*|CSS\w*|div|span|h1|h2|h3|p|button|input|section|main|aside|header|footer)\b/g;
    highlighted = highlighted.replace(types, '<span class="text-[#e5c07b] font-medium">$1</span>');

    // 7. Operators: Subtle Slate
    const operators = /(&lt;=|&gt;=|==|===|!=|!==|\|\||&amp;&amp;|=&gt;|\+|\-|\*|\/|%|=|\!)/g;
    highlighted = highlighted.replace(operators, '<span class="text-[#56b6c2]">$1</span>');

    return highlighted;
  };

  const lineNumbers = value.split('\n').length;

  return (
    <div className="relative flex bg-[#0d1117] rounded-xl border border-slate-700/50 overflow-hidden min-h-[160px] md:min-h-[200px] max-h-[40vh] md:max-h-[500px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] group/editor ring-1 ring-white/5 transition-all duration-300 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50">
      
      {/* Sophisticated Layered Backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.05),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.03),transparent_40%)] pointer-events-none" />

      {/* Gutter Area */}
      <div 
        ref={gutterRef}
        className="bg-[#0b0e14]/80 backdrop-blur-sm border-r border-slate-800/60 py-5 px-3 text-right select-none min-w-[48px] md:min-w-[60px] overflow-hidden z-10"
      >
        {Array.from({ length: Math.max(lineNumbers, 1) }).map((_, i) => (
          <div key={i} className={`text-[10px] md:text-[11px] font-mono leading-6 transition-all duration-300 ${value.split('\n')[i]?.trim() ? 'text-slate-500 font-medium' : 'text-slate-800'}`}>
            {i + 1}
          </div>
        ))}
      </div>

      {/* Editor Surface */}
      <div className="relative flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={placeholder}
          className="absolute inset-0 w-full h-full p-5 bg-transparent text-transparent caret-indigo-400 code-font text-[13px] md:text-[15px] leading-6 resize-none outline-none z-10 whitespace-pre overflow-auto custom-editor-scrollbar selection:bg-indigo-500/30 touch-auto"
          style={{ fontVariantLigatures: 'none' }}
        />
        <pre
          ref={preRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full p-5 m-0 code-font text-[13px] md:text-[15px] leading-6 whitespace-pre overflow-hidden z-0 pointer-events-none text-[#abb2bf]"
          dangerouslySetInnerHTML={{ __html: highlightCode(value) + '\n' }}
        />
        {!value && (
          <div className="absolute inset-0 p-5 text-slate-600/60 code-font text-[13px] md:text-[15px] leading-6 pointer-events-none italic tracking-wide">
            {placeholder}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-editor-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-editor-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-editor-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(99, 102, 241, 0.2); 
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .custom-editor-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: rgba(99, 102, 241, 0.4); 
        }
        .code-font { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
        
        /* Smooth selection color */
        ::selection {
          background: rgba(99, 102, 241, 0.3);
          color: inherit;
        }
      `}} />
    </div>
  );
};

export default CodeEditor;
