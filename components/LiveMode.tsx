
import React, { useEffect, useRef, useState } from 'react';
import { Mic, X, Volume2, AlertCircle, ShieldCheck, MessageSquare, Radio } from 'lucide-react';
import { chatGRC } from '../services/geminiService';
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
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
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
      const radius = 50;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * 50;
        const angle = (i * 2 * Math.PI) / bufferLength;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.strokeStyle = isUserSpeaking ? `rgba(14, 165, 233, ${0.4 + (dataArray[i] / 255)})` : `rgba(14, 165, 233, 0.3)`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
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
      
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      
      if (outputCtx.state === 'suspended') await outputCtx.resume();
      if (inputCtx.state === 'suspended') await inputCtx.resume();

      audioContextRef.current = outputCtx;
      outputNodeRef.current = outputCtx.createGain();
      outputNodeRef.current.connect(outputCtx.destination);

      const sessionPromise = chatGRC.connectLive({
        voiceName: settings.voiceName,
        callbacks: {
          onAudio: async (base64) => {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
            const buffer = await decodeAudioData(decode(base64), audioContextRef.current);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = settings.voiceSpeed;
            source.connect(outputNodeRef.current!);
            const now = audioContextRef.current.currentTime;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
            source.start(nextStartTimeRef.current);
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
            sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          },
          onClose: () => onClose()
        }
      });

      sessionPromiseRef.current = sessionPromise;

      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(1024, 1, 1);
      scriptProcessor.onaudioprocess = (e: any) => {
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
      setError("مائیکروفون تک رسائی ممکن نہیں۔");
      setTimeout(onClose, 3000);
    }
  };

  const stopSession = () => {
    sessionPromiseRef.current?.then(s => { try { s.close(); } catch(e) {} });
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch(e) {} }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl p-4">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] border border-slate-200 flex flex-col relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 h-[80vh] md:h-[70vh]">
        
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#0369a1] flex items-center justify-center shadow-lg shadow-[#0369a1]/20">
                <Radio size={20} className="text-white animate-pulse" />
             </div>
             <div>
                <h2 className="text-lg font-black urdu-text text-[#0c4a6e]">لائیو گفتگو</h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-[#0369a1] font-black tracking-widest uppercase">Live Research</span>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-[#0c4a6e] hover:bg-slate-100 rounded-full transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>

        {/* Interaction Area */}
        <div className="p-10 flex flex-col items-center justify-center gap-8 shrink-0 bg-gradient-to-b from-slate-50 to-transparent">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <canvas ref={canvasRef} width={250} height={250} className="absolute inset-0 w-full h-full" />
            <div className={`w-24 h-24 rounded-full bg-gradient-to-tr from-[#0c4a6e] to-[#0369a1] flex items-center justify-center z-10 border-4 border-white shadow-2xl transition-transform duration-500 ${isUserSpeaking ? 'scale-110' : 'scale-100'}`}>
              <Mic size={32} className="text-white" />
            </div>
          </div>

          <div className="w-full min-h-[60px] flex items-center justify-center text-center">
            {error ? (
              <p className="text-red-500 urdu-text font-bold text-lg">{error}</p>
            ) : (
              <p className="urdu-text text-[#0c4a6e] font-black text-xl md:text-2xl drop-shadow-sm leading-relaxed" dir="rtl">
                {transcription || (isUserSpeaking ? "سن رہا ہوں..." : "کچھ پوچھیں، میں حاضر ہوں...")}
              </p>
            )}
          </div>
        </div>

        {/* History Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 no-scrollbar bg-white shadow-inner">
          {history.length === 0 && !transcription && (
            <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-3">
              <MessageSquare size={48} className="text-[#0369a1]" />
              <p className="urdu-text font-bold">کوئی گفتگو نہیں ہوئی</p>
            </div>
          )}
          {history.map((item, idx) => (
            <div key={idx} className={`flex ${item.role === 'user' ? 'justify-start' : 'justify-end'} animate-in fade-in`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-base urdu-text font-medium shadow-sm border ${
                item.role === 'user' ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-[#0369a1] text-white border-[#0c4a6e]'
              }`} dir="rtl">{item.text}</div>
            </div>
          ))}
          {transcription && (
            <div className={`flex ${isUserSpeaking ? 'justify-start' : 'justify-end'} animate-in fade-in`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-base urdu-text font-bold border-2 border-dashed ${
                isUserSpeaking ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-sky-50 border-sky-200 text-[#0369a1]'
              }`} dir="rtl">{transcription}</div>
            </div>
          )}
          <div ref={historyEndRef} className="h-2" />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col items-center gap-1 shrink-0">
           <p className="text-[12px] text-[#0c4a6e] font-black uppercase tracking-widest text-center">
             Global Research Centre
           </p>
           <p className="text-[10px] text-slate-500 urdu-text font-black text-center">
             از قاری خالد محمود گولڈ میڈلسٹ
           </p>
        </div>
      </div>
    </div>
  );
};
