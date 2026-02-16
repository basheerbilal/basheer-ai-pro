
import React, { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const hasCodeBlocks = content.includes('```');

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text.trim()).then(() => {
      if (id) {
        setCopiedStates(prev => ({ ...prev, [id]: true }));
        setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
      } else {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      }
    });
  };

  const handleCopyAll = () => {
    const codeBlocks: string[] = [];
    const lines = content.split('\n');
    let currentBlock = '';
    let inBlock = false;

    lines.forEach(line => {
      if (line.trim().startsWith('```')) {
        if (inBlock) {
          codeBlocks.push(currentBlock);
          currentBlock = '';
          inBlock = false;
        } else {
          inBlock = true;
        }
      } else if (inBlock) {
        currentBlock += line + '\n';
      }
    });

    copyToClipboard(codeBlocks.join('\n\n/* --- Next Snippet --- */\n\n'));
  };

  const renderContent = () => {
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeLanguage = '';
    const rendered = [];
    let currentCode = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle Code Blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          const blockId = `code-${i}`;
          const codeToCopy = currentCode;
          rendered.push(
            <div key={blockId} className="my-4 md:my-6 rounded-lg md:rounded-xl overflow-hidden bg-[#0d1117] border border-slate-700/50 shadow-2xl group/code">
              <div className="bg-slate-800/80 px-3 md:px-4 py-1.5 md:py-2 text-[9px] md:text-[10px] font-black text-slate-400 flex justify-between items-center border-b border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500/30" />
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500/30" />
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500/30" />
                  </div>
                  <span className="uppercase tracking-[0.2em] ml-1 md:ml-2">{codeLanguage || 'code'}</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(codeToCopy, blockId)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all active:scale-95 ${
                    copiedStates[blockId] ? 'text-emerald-400 bg-emerald-500/10' : 'hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {copiedStates[blockId] ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      <span className="hidden xs:inline">COPIED!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      <span className="hidden xs:inline">COPY</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 md:p-5 overflow-x-auto text-[11px] md:text-sm code-font text-blue-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 selection:bg-indigo-500/30">
                <code>{currentCode}</code>
              </pre>
            </div>
          );
          currentCode = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3);
        }
        continue;
      }

      if (inCodeBlock) {
        currentCode += line + '\n';
        continue;
      }

      // Handle Math Symbols & Notations (Basic regex for Big O and Math vars)
      let processedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-300 font-bold">$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-slate-900/50 text-indigo-400 px-1.5 py-0.5 rounded border border-slate-700/50 code-font text-[0.9em] break-all">$1</code>')
        // Styling Big O notations
        .replace(/\b(O\(.*?\))\b/g, '<span class="font-mono text-emerald-400 font-bold">$1</span>')
        // Styling math equations if wrapped in $ $
        .replace(/\$(.*?)\$/g, '<span class="font-serif italic text-amber-200 px-1">$1</span>');

      // Handle Headings
      if (line.trim().startsWith('### ')) {
        rendered.push(
          <h3 key={i} className="text-base md:text-lg font-black text-white mt-6 mb-3 flex items-center gap-2 md:gap-3">
            <div className="w-1 md:w-1.5 h-5 md:h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            {line.replace('### ', '')}
          </h3>
        );
        continue;
      }

      // Handle Bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        rendered.push(
          <li key={i} className="ml-5 list-disc mb-2 text-slate-300 marker:text-indigo-500 text-[13px] md:text-base" dangerouslySetInnerHTML={{ __html: processedLine.replace(/^[*|-]\s/, '') }} />
        );
      } else if (line.trim() === '') {
        rendered.push(<div key={i} className="h-2" />);
      } else {
        rendered.push(
          <p key={i} className="mb-3 text-slate-200 leading-relaxed text-[13px] md:text-base" dangerouslySetInnerHTML={{ __html: processedLine }} />
        );
      }
    }

    return rendered;
  };

  return (
    <div className="relative group/renderer">
      {hasCodeBlocks && (
        <div className="flex justify-end mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <button 
            onClick={handleCopyAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all shadow-xl border ${
              copiedAll 
                ? 'bg-emerald-600 border-emerald-500 text-white scale-105' 
                : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 backdrop-blur-md'
            }`}
          >
            {copiedAll ? 'ALL COPIED!' : 'COPY ALL'}
          </button>
        </div>
      )}
      <div className="markdown-content">{renderContent()}</div>
    </div>
  );
};

export default MarkdownRenderer;
