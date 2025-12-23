
import React, { useEffect, useRef, useState } from 'react';
import { Mic, X, Volume2, AlertCircle, ShieldCheck, MessageSquare } from 'lucide-react';
import { urduAI } from '../services/geminiService';
import { UserSettings } from '../types';

interface LiveModeProps {
  onClose: () => void;
  settings: UserSettings;
}

interface HistoryItem {
  role: 'user' | 'assistant';
  text: string;
}

export const LiveMode: React.FC<LiveModeProps> = ({ onClose, settings }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  const currentTurnUserRef = useRef('');
  const currentTurnAssistantRef = useRef('');
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startSession();
    return () => {
      stopSession();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, transcription]);

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  const startVisualizer = (stream: MediaStream) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128; // Smaller for speed
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 40;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * 45;
        const angle = (i * 2 * Math.PI) / bufferLength;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + (dataArray[i] / 255)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };
    draw();
  };

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startVisualizer(stream);
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      if (outputCtx.state === 'suspended') await outputCtx.resume();
      if (inputCtx.state === 'suspended') await inputCtx.resume();

      audioContextRef.current = outputCtx;
      outputNodeRef.current = outputCtx.createGain();
      outputNodeRef.current.connect(outputCtx.destination);

      const sessionPromise = urduAI.connectLive({
        voiceName: settings.voiceName,
        callbacks: {
          onAudio: async (base64) => {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
            const buffer = await decodeAudioData(decode(base64), audioContextRef.current);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            
            // Apply speed to live feedback
            source.playbackRate.value = settings.voiceSpeed;
            
            source.connect(outputNodeRef.current!);
            
            const now = audioContextRef.current.currentTime;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
            source.start(nextStartTimeRef.current);
            
            // Adjust duration based on speed
            const duration = buffer.duration / settings.voiceSpeed;
            nextStartTimeRef.current += duration;
            
            sourcesRef.current.add(source);
            source.onended = () => sourcesRef.current.delete(source);
          },
          onTranscription: (text, isUser) => {
            if (isUser) {
              currentTurnUserRef.current += text;
              setTranscription(currentTurnUserRef.current);
              setIsUserSpeaking(true);
            } else {
              currentTurnAssistantRef.current += text;
              setTranscription(currentTurnAssistantRef.current);
              setIsUserSpeaking(false);
            }
          },
          onTurnComplete: () => {
            const newUserText = currentTurnUserRef.current.trim();
            const newAssistantText = currentTurnAssistantRef.current.trim();
            if (newUserText || newAssistantText) {
              setHistory(prev => [
                ...prev,
                ...(newUserText ? [{ role: 'user', text: newUserText } as HistoryItem] : []),
                ...(newAssistantText ? [{ role: 'assistant', text: newAssistantText } as HistoryItem] : [])
              ]);
            }
            currentTurnUserRef.current = '';
            currentTurnAssistantRef.current = '';
            setTranscription('');
          },
          onInterrupted: () => {
            sourcesRef.current.forEach(s => {
              try { s.stop(); } catch(e) {}
            });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          },
          onClose: () => onClose()
        }
      });

      sessionPromiseRef.current = sessionPromise;

      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(1024, 1, 1); // Smaller buffer for less delay
      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16[i] = s < 0 ? s * 32768 : s * 32767;
        }
        const base64Data = encode(new Uint8Array(int16.buffer));
        sessionPromiseRef.current?.then(session => {
          session.sendRealtimeInput({ 
            media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' } 
          });
        });
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);
      setIsActive(true);
    } catch (err: any) {
      setError("Microphone access denied.");
      setTimeout(onClose, 3000);
    }
  };

  const stopSession = () => {
    sessionPromiseRef.current?.then(s => {
      try { s.close(); } catch(e) {}
    });
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/98 backdrop-blur-3xl p-0 md:p-4">
      <div className="w-full h-full md:h-auto md:max-w-2xl md:max-h-[90vh] glass-panel md:rounded-[3rem] border-sky-500/20 flex flex-col relative overflow-hidden shadow-2xl">
        
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[120px] transition-all duration-1000 pointer-events-none ${isUserSpeaking ? 'scale-150 opacity-100' : 'scale-100 opacity-20'}`} />

        <div className="p-5 md:p-8 flex items-center justify-between border-b border-white/5 relative z-20 bg-black/40 shrink-0">
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-2xl transition-colors duration-500 ${isUserSpeaking ? 'bg-sky-500/30' : 'bg-slate-800/50'}`}>
                <Mic size={22} className={`text-sky-300 ${isUserSpeaking ? 'animate-pulse' : ''}`} />
             </div>
             <div>
                <h2 className="text-base md:text-xl font-bold urdu-text text-white">براہِ راست گفتگو</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[10px] text-sky-300 font-bold uppercase tracking-widest">Turbo Audio Link Active</p>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-white transition-all hover:bg-white/10 rounded-full active:scale-90">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-10 flex flex-col items-center gap-6 shrink-0 relative">
          <div className={`relative w-28 h-28 md:w-40 md:h-40 rounded-full flex items-center justify-center transition-all duration-700 z-10 ${isUserSpeaking ? 'scale-110 shadow-[0_0_60px_rgba(14,165,233,0.4)]' : 'scale-100 shadow-2xl'}`}>
            <canvas ref={canvasRef} width={200} height={200} className="absolute inset-0 w-full h-full pointer-events-none" />
            <div className={`absolute inset-0 rounded-full border-2 border-sky-400/30 ${isUserSpeaking ? 'animate-ping opacity-30' : 'opacity-0'}`} />
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-sky-800 to-sky-400 flex items-center justify-center z-10 border-4 border-white/10 shadow-2xl overflow-hidden ring-4 ring-sky-500/5">
              {isUserSpeaking ? <Mic size={40} className="text-white" /> : <Volume2 size={40} className="text-white" />}
            </div>
          </div>
          
          <div className="w-full min-h-[80px] flex items-center justify-center px-4">
            {error ? (
              <div className="flex items-center gap-3 text-red-400 urdu-text bg-red-500/10 px-6 py-3 rounded-2xl border border-red-500/20">
                <AlertCircle size={20} />
                <span className="text-sm md:text-base">{error}</span>
              </div>
            ) : (
              <p className="urdu-text text-center text-sky-50 font-medium leading-relaxed text-base md:text-2xl transition-all duration-300 drop-shadow-sm" dir="rtl">
                {transcription || (isUserSpeaking ? "سن رہا ہوں..." : "کچھ پوچھیں، میں حاضر ہوں...")}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-12 py-6 space-y-5 no-scrollbar bg-black/20 border-t border-white/5">
          {history.length === 0 && !transcription && (
            <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
              <MessageSquare size={64} className="text-sky-300" />
              <p className="urdu-text text-sm md:text-lg">کوئی گفتگو نہیں ہوئی</p>
            </div>
          )}
          
          {history.map((item, idx) => (
            <div key={idx} className={`flex ${item.role === 'user' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[90%] px-5 py-3 md:py-4 rounded-2xl md:rounded-3xl text-sm md:text-xl urdu-text leading-relaxed shadow-xl ${
                item.role === 'user' 
                ? 'bg-slate-800/80 text-sky-100 border border-white/5' 
                : 'bg-sky-600/30 text-white border border-sky-400/30'
              }`} dir="rtl">
                <span className="text-[8px] md:text-[10px] block mb-1.5 opacity-40 uppercase tracking-[0.2em] font-black">
                  {item.role === 'user' ? 'USER' : 'CHAT GRC'}
                </span>
                {item.text}
              </div>
            </div>
          ))}

          {transcription && (
            <div className={`flex ${isUserSpeaking ? 'justify-start' : 'justify-end'} animate-in fade-in`}>
              <div className={`max-w-[90%] px-5 py-3 md:py-4 rounded-2xl md:rounded-3xl text-sm md:text-xl urdu-text leading-relaxed ${
                isUserSpeaking ? 'bg-slate-700/40 text-sky-300 border border-sky-400/10' : 'bg-sky-500/20 text-sky-100 border border-sky-400/20'
              }`} dir="rtl">
                {transcription}
              </div>
            </div>
          )}
          <div ref={historyEndRef} className="h-4" />
        </div>

        <div className="p-6 md:p-10 border-t border-white/5 shrink-0 bg-black/60">
           <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 text-[9px] md:text-[11px] text-sky-400/80 font-black uppercase tracking-[0.3em]">
                <ShieldCheck size={14} className="text-sky-400" />
                <span>Encrypted Research Stream • GRC GLOBAL</span>
              </div>
              <p className="text-[10px] md:text-[12px] text-slate-500 font-bold uppercase tracking-[0.3em] md:tracking-[0.6em] urdu-text text-center opacity-60">
                <span className="text-white font-black">Qari Khalid Mahmood</span> Gold Medalist
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
