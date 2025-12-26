
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { LiveMode } from './components/LiveMode';
import { LoginModal } from './components/LoginModal';
import { ChatSession, Message, Attachment, UserSettings, User, Contact } from './types';
import { chatGRC } from './services/geminiService';
import { NEWS_PROMPT, AI_UPDATES_PROMPT, MOCK_CONTACTS } from './constants';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [showLiveMode, setShowLiveMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [selectedModel, setSelectedModel] = useState('gemini-3-pro-preview');
  const [customInstructions, setCustomInstructions] = useState('');
  const [settings, setSettings] = useState<UserSettings>({
    fontSize: 18,
    fontFamily: 'sans', 
    highContrast: false,
    voiceName: 'Kore',
    currentUser: null,
    voicePitch: 1.0,
    voiceSpeed: 1.0
  });

  // Background API Key validation (non-blocking)
  useEffect(() => {
    const initKey = async () => {
      try {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey && !process.env.API_KEY) {
            // Only trigger if no environment key exists
            console.warn("API Key might be missing.");
          }
        }
      } catch (e) {
        console.error("Key init error", e);
      }
    };
    initKey();
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
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
  }, [selectedModel]);

  const startChatWithContact = (contact: Contact) => {
    const existing = sessions.find(s => s.contactId === contact.id);
    if (existing) {
      setCurrentSessionId(existing.id);
      setIsSidebarOpen(false);
      return;
    }

    const newId = `contact_${contact.id}_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: contact.name,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
      contactId: contact.id
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setIsSidebarOpen(false);
    chatGRC.resetChat();
  };

  useEffect(() => {
    const savedInstructions = localStorage.getItem('chat_grc_custom_instructions');
    const savedSettings = localStorage.getItem('chat_grc_settings');
    if (savedInstructions) setCustomInstructions(savedInstructions);
    if (savedSettings) {
      try { 
        const parsed = JSON.parse(savedSettings);
        if (typeof parsed.fontSize === 'string') {
          parsed.fontSize = parsed.fontSize === 'large' ? 22 : 18;
        }
        setSettings(prev => ({ ...prev, ...parsed })); 
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (settings.currentUser) {
      const saved = localStorage.getItem(`chat_grc_sessions_${settings.currentUser.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSessions(parsed);
            setCurrentSessionId(parsed[0].id);
          } else { createNewChat(); }
        } catch (e) { createNewChat(); }
      } else { createNewChat(); }
    } else if (sessions.length === 0) { createNewChat(); }
  }, [settings.currentUser, createNewChat]);

  useEffect(() => {
    if (settings.currentUser) {
      localStorage.setItem(`chat_grc_sessions_${settings.currentUser.id}`, JSON.stringify(sessions));
    }
    localStorage.setItem('chat_grc_settings', JSON.stringify(settings));
    document.body.className = settings.highContrast ? 'high-contrast bg-slate-950 text-white' : 'bg-[#f8fafc] text-slate-900';
    document.documentElement.classList.toggle('dark', settings.highContrast);
    localStorage.setItem('chat_grc_custom_instructions', customInstructions);
  }, [sessions, settings, customInstructions]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {
    if (!currentSessionId || !currentSession) return;

    const isFirstMessage = currentSession.messages.length === 0;
    
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: s.messages.map(m => ({ ...m, suggestions: undefined })) }
        : s
    ));

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { 
            ...s, 
            messages: [...s.messages, userMessage], 
            updatedAt: Date.now()
          }
        : s
    ));

    setIsLoading(true);
    const assistantMessageId = (Date.now() + 1).toString();
    try {
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s
      ));

      let instructions = customInstructions;
      if (currentSession.contactId) {
        const contact = MOCK_CONTACTS.find(c => c.id === currentSession.contactId);
        if (contact) {
          instructions = `${contact.persona}\n\n${customInstructions}`;
        }
      }

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
                  messages: s.messages.map(m => 
                    m.id === assistantMessageId ? { ...m, content: text, sources } : m
                  ) 
                } 
              : s
          ));
        }
      );

      if (isFirstMessage && !currentSession.contactId) {
        chatGRC.generateTitle(content).then(newTitle => {
          setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newTitle } : s));
        });
      }

      const newSuggestions = await chatGRC.generateSuggestions([
        ...currentSession.messages,
        userMessage,
        { role: 'assistant', content: fullResponse }
      ]);
      
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              messages: s.messages.map(m => 
                m.id === assistantMessageId ? { ...m, suggestions: newSuggestions } : m
              ) 
            } 
          : s
      ));
      
    } catch (error: any) {
      console.error("Chat Error:", error);
      let errorMessage = "معذرت! جواب موصول کرنے میں دشواری پیش آئی۔";
      
      if (error.message?.includes("API key not valid") || error.message?.includes("API_KEY")) {
        errorMessage = "API Key درست نہیں یا غائب ہے۔ براہ کرم ماحول چیک کریں۔";
      } else if (error.message?.includes("Safety")) {
        errorMessage = "معذرت، یہ مواد ہماری پالیسی کے مطابق نہیں ہے۔";
      }
      
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              messages: s.messages.map(m => 
                m.id === assistantMessageId ? { ...m, content: errorMessage } : m
              ) 
            } 
          : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentNews = () => {
    const today = new Date().toLocaleDateString('ur-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = NEWS_PROMPT.replace('[CURRENT_DATE]', today);
    handleSendMessage(prompt);
  };

  const fetchAIUpdates = () => {
    const today = new Date().toLocaleDateString('ur-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = AI_UPDATES_PROMPT.replace('[CURRENT_DATE]', today);
    handleSendMessage(prompt);
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) { setTimeout(() => createNewChat(), 0); return []; }
      if (id === currentSessionId) setCurrentSessionId(filtered[0].id);
      return filtered;
    });
  };

  const handleWhatsAppFeedback = () => {
    const message = encodeURIComponent("سلام اردو اے آئی! میں اپنی رائے دینا چاہتا ہوں: ");
    window.open(`https://wa.me/923099572321?text=${message}`, '_blank');
  };

  const getFontClass = () => {
    switch(settings.fontFamily) {
      case 'nastaleeq': return 'urdu-font-nastaleeq';
      case 'naskh': return 'urdu-font-naskh';
      default: return 'urdu-font-sans';
    }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden ${getFontClass()}`}>
      <Sidebar 
        sessions={sessions}
        activeId={currentSessionId}
        onSelect={setCurrentSessionId}
        onNewChat={createNewChat}
        onSelectContact={startChatWithContact}
        onDelete={deleteSession}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        settings={settings}
        setSettings={setSettings}
        customInstructions={customInstructions}
        setCustomInstructions={setCustomInstructions}
        onLogout={() => setSettings({...settings, currentUser: null})}
        onShowLogin={() => setShowLoginModal(true)}
        onSendFeedback={handleWhatsAppFeedback}
        onInstall={deferredPrompt ? handleInstall : undefined}
      />
      <ChatArea 
        session={currentSession}
        onSendMessage={handleSendMessage}
        onFetchNews={fetchCurrentNews}
        onFetchAIUpdates={fetchAIUpdates}
        isImageMode={false}
        setIsImageMode={() => {}}
        onStartVoice={() => setShowLiveMode(true)}
        isLoading={isLoading}
        selectedModel={selectedModel}
        onModelChange={(m) => { setSelectedModel(m); chatGRC.resetChat(); }}
        settings={settings}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onRefreshContext={() => { chatGRC.resetChat(); createNewChat(); }}
      />
      {showLiveMode && <LiveMode settings={settings} onClose={() => setShowLiveMode(false)} />}
      {showLoginModal && (
        <LoginModal 
          onLogin={(u) => { setSettings({...settings, currentUser: u}); setShowLoginModal(false); }} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}
    </div>
  );
};

export default App;
