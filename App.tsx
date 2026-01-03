
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { IntroModal } from './components/IntroModal';
import { LoginModal } from './components/LoginModal';
import { ChatSession, Message, Attachment, UserSettings, User } from './types';
import { chatGRC } from './services/geminiService';
import { NEWS_PROMPT, AI_UPDATES_PROMPT, INTRO_PROMPT, ADMIN_EMAIL } from './constants';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isApiError, setIsApiError] = useState(false);
  
  // Updated model selection to use Gemini 3 Flash Preview for better performance.
  const selectedModel = 'gemini-3-flash-preview';
  const [customInstructions, setCustomInstructions] = useState('');
  const [settings, setSettings] = useState<UserSettings>({
    fontSize: 12,
    fontFamily: 'sans',
    highContrast: false,
    voiceName: 'Kore',
    currentUser: null,
    voicePitch: 1.0,
    voiceSpeed: 1.0
  });

  const safeGet = (key: string) => {
    try { 
      const val = localStorage.getItem(key); 
      return (val === 'undefined' || val === null) ? null : val;
    } catch (e) { return null; }
  };

  const safeSet = (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch (e) {}
  };

  const createNewChat = useCallback(() => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'نئی تحقیق',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    chatGRC.resetChat();
    setIsApiError(false);
  }, [selectedModel]);

  // Handle "Home Page" action: if current is empty, stay. If not, create new.
  const handleGoHome = useCallback(() => {
    const activeSession = sessions.find(s => s.id === currentSessionId);
    if (activeSession && activeSession.messages.length === 0) {
      // Already on home (empty chat)
      return;
    }
    // Check if there's already an empty chat we can switch to
    const emptySession = sessions.find(s => s.messages.length === 0);
    if (emptySession) {
      setCurrentSessionId(emptySession.id);
    } else {
      createNewChat();
    }
  }, [sessions, currentSessionId, createNewChat]);

  const handleUpdateKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setIsApiError(false);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        const savedSettings = safeGet('chat_grc_settings');
        let currentParsedUser = null;
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
          currentParsedUser = parsed.currentUser;
        }

        const savedInstructions = safeGet('chat_grc_custom_instructions');
        if (savedInstructions) setCustomInstructions(savedInstructions);

        const storageKey = currentParsedUser ? `chat_grc_sessions_${currentParsedUser.id}` : 'chat_grc_sessions_guest';
        const savedSessions = safeGet(storageKey);
        if (savedSessions) {
          const parsed = JSON.parse(savedSessions);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSessions(parsed);
            const newId = Date.now().toString();
            const homeSession: ChatSession = {
              id: newId,
              title: 'نئی تحقیق',
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              model: selectedModel
            };
            setSessions(prev => [homeSession, ...parsed]);
            setCurrentSessionId(newId);
          }
        }
      } catch (e) {
        console.error("Initialization failed", e);
      } finally {
        setIsAppReady(true);
      }
    };
    initApp();
  }, [selectedModel]);

  useEffect(() => {
    if (!isAppReady) return;
    const storageKey = settings.currentUser ? `chat_grc_sessions_${settings.currentUser.id}` : 'chat_grc_sessions_guest';
    safeSet(storageKey, JSON.stringify(sessions));
    safeSet('chat_grc_settings', JSON.stringify(settings));
    safeSet('chat_grc_custom_instructions', customInstructions);
  }, [sessions, settings, customInstructions, isAppReady]);

  useEffect(() => {
    if (isAppReady && sessions.length === 0) {
      createNewChat();
    }
  }, [isAppReady, sessions.length, createNewChat]);

  const currentSession = useMemo(() => 
    sessions.find(s => s.id === currentSessionId) || null
  , [sessions, currentSessionId]);

  const handleSendMessage = async (content: string, attachments: Attachment[] = [], isHidden: boolean = false) => {
    if (!currentSessionId || !currentSession) return;
    setIsApiError(false);

    const isFirstMessage = currentSession.messages.length === 0;
    
    if (!isHidden) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: Date.now(),
        attachments: attachments.length > 0 ? attachments : undefined
      };
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMessage], updatedAt: Date.now() } : s));
    }

    setIsLoading(true);
    const assistantMessageId = (Date.now() + 1).toString();
    try {
      const assistantMessage: Message = { id: assistantMessageId, role: 'assistant', content: '', timestamp: Date.now() };
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s));

      const isAdmin = settings.currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      let instructions = isAdmin ? customInstructions : '';

      const fullResponse = await chatGRC.sendMessageStream(
        content,
        selectedModel,
        currentSession?.messages || [],
        attachments,
        instructions,
        (text, sources) => {
          setSessions(prev => prev.map(s => 
            s.id === currentSessionId 
              ? { 
                  ...s, 
                  messages: s.messages.map(m => m.id === assistantMessageId ? { ...m, content: text, sources: sources || m.sources } : m) 
                } 
              : s
          ));
        }
      );

      if (isFirstMessage) {
        chatGRC.generateTitle(content).then(newTitle => {
          setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newTitle } : s));
        });
      }

      const historyForSuggestions = [...currentSession.messages];
      if (isHidden) historyForSuggestions.push({ role: 'user', content } as Message);
      historyForSuggestions.push({ role: 'assistant', content: fullResponse } as Message);

      const newSuggestions = await chatGRC.generateSuggestions(historyForSuggestions);
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === assistantMessageId ? { ...m, suggestions: newSuggestions } : m) } : s));
      
    } catch (error: any) {
      const errorStr = JSON.stringify(error).toLowerCase();
      const statusMatch = errorStr.match(/status[:\s]+(\d+)/) || errorStr.match(/(\d{3})/);
      const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;

      if (statusCode === 403 || statusCode === 401 || statusCode === 429 || errorStr.includes("permission") || errorStr.includes("quota")) {
        setIsApiError(true);
      }
      
      let errorMessage = "معذرت! اس وقت رابطہ ممکن نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔";
      
      if (statusCode === 401 || statusCode === 403) {
        errorMessage = "معذرت! اے پی آئی کی (API Key) درست نہیں ہے یا اس کی رسائی بند کر دی گئی ہے۔ براہ کرم سیٹنگز میں جا کر کی (Key) چیک کریں۔";
      } else if (statusCode === 429 || errorStr.includes("quota")) {
        errorMessage = "معذرت! آج کے لیے مختص تحقیقی لمٹ (Limit) ختم ہو چکی ہے۔ براہ کرم کچھ دیر بعد دوبارہ کوشش کریں یا اپنی ذاتی اے پی آئی کی استعمال کریں۔";
      } else if (statusCode === 400) {
        errorMessage = "آپ کی درخواست میں کوئی تکنیکی مسئلہ ہے (مثلاً فائل کا سائز زیادہ ہونا)۔ براہ کرم دوبارہ چیک کر کے سوال لکھیں۔";
      } else if (statusCode && statusCode >= 500) {
        errorMessage = "گوگل کے سرورز اس وقت بہت زیادہ بوجھ کا شکار ہیں۔ براہ کرم چند سیکنڈز بعد دوبارہ کوشش کریں۔";
      } else if (errorStr.includes("safety") || errorStr.includes("blocked")) {
        errorMessage = "معذرت! آپ کے سوال کا مواد ہمارے حفاظتی ضوابط (Safety Policy) کے خلاف ہو سکتا ہے، اس لیے جواب فراہم نہیں کیا جا سکا۔";
      } else if (errorStr.includes("network") || errorStr.includes("fetch")) {
        errorMessage = "انٹرنیٹ کنکشن میں خرابی معلوم ہو رہی ہے۔ براہ کرم اپنا نیٹ ورک چیک کر کے دوبارہ کوشش کریں۔";
      }

      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === assistantMessageId ? { ...m, content: errorMessage } : m) } : s));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshContext = () => {
    setIsLoading(true);
    setTimeout(() => {
      createNewChat();
      setIsLoading(false);
    }, 500);
  };

  if (!isAppReady) {
    return (
      <div className="fixed inset-0 bg-[#0c4a6e] flex flex-col items-center justify-center z-[9999] text-white">
        <Sparkles size={50} className="text-sky-400 animate-pulse mb-4" />
        <h1 className="text-2xl font-black urdu-text tracking-widest">اُردو اے آئی</h1>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-300 mt-2">Urdu AI Loading...</p>
      </div>
    );
  }

  const fontClass = settings.fontFamily === 'nastaleeq' ? 'urdu-font-nastaleeq' : settings.fontFamily === 'naskh' ? 'urdu-font-naskh' : 'urdu-font-sans';

  return (
    <div className={`flex h-screen w-full overflow-hidden ${fontClass}`}>
      <Sidebar 
        sessions={sessions}
        activeId={currentSessionId}
        onSelect={setCurrentSessionId}
        onNewChat={createNewChat}
        onDelete={(id) => setSessions(prev => prev.filter(s => s.id !== id))}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        settings={settings}
        setSettings={setSettings}
        customInstructions={customInstructions}
        setCustomInstructions={setCustomInstructions}
        onLogout={() => { setSettings(prev => ({ ...prev, currentUser: null })); setSessions([]); setCurrentSessionId(null); }}
        onShowLogin={() => setShowLoginModal(true)}
        onSendFeedback={() => window.open(`https://wa.me/923099572321`)}
        isAuthorized={true}
      />
      <ChatArea 
        session={currentSession}
        onSendMessage={handleSendMessage}
        onFetchNews={() => handleSendMessage(NEWS_PROMPT, [], true)}
        onFetchAIUpdates={() => handleSendMessage(AI_UPDATES_PROMPT, [], true)}
        onFetchIntro={() => handleSendMessage(INTRO_PROMPT, [], true)}
        isLoading={isLoading}
        settings={settings}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onRefreshContext={handleRefreshContext}
        isAuthorized={true}
        onAuthorize={() => setShowLoginModal(true)}
        isApiError={isApiError}
        onUpdateKey={handleUpdateKey}
        onGoHome={handleGoHome}
      />
      {showIntroModal && <IntroModal settings={settings} onClose={() => setShowIntroModal(false)} />}
      {showLoginModal && (
        <LoginModal 
          onLogin={(u) => { setSettings(prev => ({...prev, currentUser: u})); setShowLoginModal(false); }} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}
    </div>
  );
};

export default App;
