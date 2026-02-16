
import React, { useState, useRef, useEffect } from 'react';
import { MentorMode, Message, ChatSession, MessageImage } from './types';
import { MODES_CONFIG } from './constants';
import { gemini } from './services/geminiService';
import { speechService } from './services/speechService';
import { voiceService } from './services/voiceService';
import MarkdownRenderer from './components/MarkdownRenderer';
import CodeEditor from './components/CodeEditor';

const SESSIONS_STORAGE_KEY = 'basheer_ai_pro_sessions_v5';
const ACTIVE_SESSION_ID_KEY = 'basheer_ai_pro_active_id_v5';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_SESSION_ID_KEY);
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMode, setCurrentMode] = useState<MentorMode>(MentorMode.TEACHING);

  const [input, setInput] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [currentlySpeaking, setCurrentlySpeaking] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isKeyConfigured = gemini.isConfigured();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_ID_KEY, activeSessionId);
      const session = sessions.find(s => s.id === activeSessionId);
      if (session) {
        setMessages(session.messages);
        setCurrentMode(session.mode);
      }
    } else if (sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    } else {
      startNewChat();
    }
  }, [activeSessionId, sessions.length]);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 150;
    setShowScrollButton(!isAtBottom);
  };

  const startNewChat = () => {
    const newId = Date.now().toString();
    const welcomeMsg: Message = {
      id: 'welcome-' + newId,
      role: 'assistant',
      content: "Main aapka web-basheerbilal AI Agent technical mentor ke taur par guide karne ke liye hazir hoon. Aaj hum coding ya logic mein kaunsi nayi 'tabahi' machayenge? Main tayyar hoon!",
      timestamp: Date.now(),
      mode: MentorMode.TEACHING
    };
    const newSession: ChatSession = {
      id: newId,
      name: 'New Chat',
      messages: [welcomeMsg],
      mode: MentorMode.TEACHING,
      lastModified: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessages([welcomeMsg]);
    setIsSidebarOpen(false);
  };

  const clearAllHistory = () => {
    const confirmed = window.confirm("Basheer, kya aap waqai apni TAMAM chat history delete karna chahte hain?");
    if (!confirmed) return;
    setSessions([]);
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
    startNewChat();
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = window.confirm("Session delete karein?");
    if (!confirmed) return;
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      if (filtered.length > 0) setActiveSessionId(filtered[0].id);
      else startNewChat();
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const finalInput = overrideInput || input;
    if (!finalInput.trim() && !codeSnippet.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: finalInput,
      timestamp: Date.now(),
      mode: currentMode,
      image: selectedImage || undefined
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        let newName = s.name;
        if (newName === 'New Chat') {
          newName = finalInput.slice(0, 30) + (finalInput.length > 30 ? '...' : '');
        }
        return { ...s, messages: updatedMessages, lastModified: Date.now(), name: newName };
      }
      return s;
    }));

    setInput('');
    setSelectedImage(null);
    setIsThinking(true);

    try {
      const response = await gemini.sendMessage(updatedMessages, finalInput, currentMode, codeSnippet, selectedImage || undefined);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        mode: currentMode
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: finalMessages, lastModified: Date.now() };
        }
        return s;
      }));

      if (codeSnippet) {
        setCodeSnippet('');
        setShowCodeInput(false);
      }
    } catch (error: any) {
      const errorText = error?.message || "Masla aa gaya hai connection mein. API key check karein.";
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorText.includes('429') || errorText.includes('RESOURCE_EXHAUSTED') 
          ? "Basheer, Google API ki quota limit hit ho gayi hai. System fallback kar raha hai, lekin agar phir bhi na chale toh 1 minute wait kar ke try karein." 
          : errorText,
        timestamp: Date.now()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      voiceService.stop();
      setIsListening(false);
    } else {
      voiceService.start(
        (text, isFinal) => {
          setInput(text);
          if (isFinal) setIsListening(false);
        },
        () => setIsListening(false),
        (err) => setIsListening(false)
      );
      setIsListening(true);
    }
  };

  const handleSpeak = async (msg: Message) => {
    if (currentlySpeaking === msg.id) {
      await speechService.stop();
      setCurrentlySpeaking(null);
      return;
    }
    setCurrentlySpeaking(msg.id);
    await speechService.speak(msg.content.replace(/[#*`]/g, ''), () => setCurrentlySpeaking(null));
  };

  return (
    <div className="flex h-screen w-full bg-[#020617] text-slate-100 overflow-hidden font-sans">
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            setSelectedImage({ data: base64String, mimeType: file.type });
          };
          reader.readAsDataURL(file);
        }
      }} />

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-[#0f172a] border-r border-slate-800 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 md:p-6 border-b border-slate-800 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
            <span className="p-1.5 bg-indigo-600 rounded text-white text-xs font-black">WBB</span>
            web-basheerbilal
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 shrink-0">
          <button onClick={startNewChat} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            New Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 px-2">Recent Sessions</div>
          {sessions.map(session => (
            <div key={session.id} className="relative group/session">
              <button onClick={() => { setActiveSessionId(session.id); setIsSidebarOpen(false); }} className={`w-full text-left p-3 pr-10 rounded-xl transition-all border ${activeSessionId === session.id ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'border-transparent hover:bg-slate-800/40 text-slate-300'}`}>
                <p className="text-sm font-medium truncate">{session.name}</p>
                <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter">{MODES_CONFIG[session.mode].label}</p>
              </button>
              <button onClick={(e) => deleteSession(e, session.id)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover/session:opacity-100 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
          <button onClick={clearAllHistory} className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-400 transition-colors flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Clear History
          </button>
          <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${isKeyConfigured ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
            <div className={`w-2 h-2 rounded-full ${isKeyConfigured ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{isKeyConfigured ? 'Agent Online' : 'Agent Locked'}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-[#020617] overflow-hidden">
        <header className="h-20 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md flex items-center px-4 md:px-6 z-20 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-800 rounded-lg mr-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1 flex items-center justify-center overflow-x-auto no-scrollbar gap-2">
             {Object.entries(MODES_CONFIG).map(([key, config]) => (
               <button key={key} onClick={() => setCurrentMode(key as MentorMode)} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border ${currentMode === key ? 'bg-indigo-600 border-indigo-500 text-white' : 'hover:bg-slate-800 border-transparent text-slate-400'}`}>
                 <span className="shrink-0">{config.icon}</span>
                 <span className="text-[11px] font-bold whitespace-nowrap">{config.label}</span>
               </button>
             ))}
          </div>
        </header>

        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 md:px-12 py-6 space-y-6 custom-scrollbar scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={msg.id} className="space-y-6">
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[95%] md:max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-center gap-2 mb-1 px-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{msg.role === 'user' ? 'Basheer' : 'Elite Agent'}</span>
                    {msg.role === 'assistant' && (
                      <button onClick={() => handleSpeak(msg)} className={`p-1 rounded-lg ${currentlySpeaking === msg.id ? 'text-indigo-400' : 'text-slate-600'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                      </button>
                    )}
                  </div>
                  <div className={`p-4 rounded-2xl border ${msg.role === 'user' ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none' : 'bg-[#1e293b] border-slate-700 text-slate-100 rounded-tl-none'}`}>
                    {msg.image && <img src={`data:${msg.image.mimeType};base64,${msg.image.data}`} className="mb-4 rounded-xl border border-white/10" alt="Shared" />}
                    <MarkdownRenderer content={msg.content} />
                  </div>
                </div>
              </div>
              
              {idx === 0 && messages.length < 3 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto py-6 animate-in fade-in slide-in-from-bottom-4">
                  <button onClick={() => handleQuickAction("Let's build a new React feature. Logic design se shuru karein?")} className="bg-slate-900/50 hover:bg-slate-800 border border-slate-800 p-4 rounded-2xl transition-all text-left">
                    <div className="text-xl mb-2">🚀</div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Build</p>
                    <p className="text-[11px] text-slate-400">Feature Design</p>
                  </button>
                  <button onClick={() => handleQuickAction("Is code snippet ka security audit karein aur loopholes batayein.")} className="bg-slate-900/50 hover:bg-slate-800 border border-slate-800 p-4 rounded-2xl transition-all text-left">
                    <div className="text-xl mb-2">🛡️</div>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Audit</p>
                    <p className="text-[11px] text-slate-400">Security Check</p>
                  </button>
                  <button onClick={() => handleQuickAction("Is DSA problem ka most optimized logic kya hoga?")} className="bg-slate-900/50 hover:bg-slate-800 border border-slate-800 p-4 rounded-2xl transition-all text-left">
                    <div className="text-xl mb-2">📊</div>
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Logic</p>
                    <p className="text-[11px] text-slate-400">Algorithm Expert</p>
                  </button>
                  <button onClick={() => handleQuickAction("Frontend ko optimize karne ke liye best practices batayein.")} className="bg-slate-900/50 hover:bg-slate-800 border border-slate-800 p-4 rounded-2xl transition-all text-left">
                    <div className="text-xl mb-2">🌐</div>
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">UI/UX</p>
                    <p className="text-[11px] text-slate-400">Pro Optimization</p>
                  </button>
                </div>
              )}
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-700 flex items-center gap-2">
                <div className="flex gap-1"><div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" /><div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.1s]" /><div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.2s]" /></div>
                <span className="text-[9px] font-black text-slate-500 uppercase">Agent Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {showScrollButton && (
          <button onClick={scrollToBottom} className="absolute bottom-32 right-6 p-3 bg-indigo-600 rounded-full shadow-2xl z-40 animate-bounce">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M19 14l-7 7-7-7" /></svg>
          </button>
        )}

        <div className="p-4 md:p-8 bg-[#0f172a] border-t border-slate-800 shrink-0">
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            {(showCodeInput || selectedImage) && (
              <div className="flex flex-col gap-3">
                {selectedImage && <div className="relative w-20 h-20 rounded-xl border-2 border-indigo-500 overflow-hidden shadow-2xl"><img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} className="w-full h-full object-cover" alt="Preview" /><button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-rose-500 p-1 rounded-full text-white"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button></div>}
                {showCodeInput && <div className="border border-slate-700 rounded-xl overflow-hidden bg-[#0d1117]"><div className="bg-slate-800 px-4 py-1.5 flex justify-between items-center text-[9px] font-bold text-slate-400"><span>CODE CONTEXT</span><button onClick={() => setShowCodeInput(false)} className="text-rose-400">DISMISS</button></div><CodeEditor value={codeSnippet} onChange={setCodeSnippet} placeholder="Paste code snippet..." /></div>}
              </div>
            )}
            <div className={`bg-[#1e293b] border border-slate-700 p-1.5 rounded-3xl flex items-end gap-2 focus-within:border-indigo-500 shadow-2xl transition-all ${!isKeyConfigured ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-1 pb-1 pl-1">
                <button onClick={() => setShowCodeInput(!showCodeInput)} className={`p-2 rounded-xl ${showCodeInput ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-400'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg></button>
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                <button onClick={toggleListening} className={`p-2 rounded-xl ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-indigo-400'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></button>
              </div>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} rows={1} placeholder="Ask your Elite Agent..." className="flex-1 bg-transparent py-3 px-2 outline-none resize-none text-slate-100 placeholder-slate-600 text-[14px]" />
              <button onClick={() => handleSend()} disabled={isThinking || !isKeyConfigured || (!input.trim() && !codeSnippet.trim() && !selectedImage)} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 p-3 rounded-2xl text-white mr-1 mb-1 transition-all"><svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};

export default App;
