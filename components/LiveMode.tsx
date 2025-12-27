
import React, { useEffect, useRef, useState } from 'react';
import { Mic, X, Volume2, AlertCircle, ShieldCheck, MessageSquare, Radio, Loader2, Info } from 'lucide-react';
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
  const [isConnecting, setIsConnecting] = useState(true);
  
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
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
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
    analyser.fftSize = 256;
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
      
      // Dynamic Glowing Pulse (ChatGPT Style)
      const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const baseRadius = 75;
      const dynamicRadius = baseRadius + (avg / 255) * 60;

      // Outer glow
      const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, dynamicRadius + 40);
      gradient.addColorStop(0, isUserSpeaking ? 'rgba(14, 165, 233, 0.4)' : 'rgba(3, 105, 161, 0.2)');
      gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius + 40, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Bars in circle
      for (let i = 0; i < bufferLength; i += 2) {
        const barHeight = (dataArray[i] / 255) * 80;
        const angle = (i * 2 * Math.PI) / bufferLength;
        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

        ctx.strokeStyle = isUserSpeaking 
          ? `hsla(199, 89%, 48%, ${0.6 + (dataArray[i] / 255)})` 
          : `hsla(199, 89%, 30%, 0.4)`;
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
          onOpen: () => {
            setIsConnecting(false);
            setIsActive(true);
            
            // Send a tiny silent buffer to trigger the initial greeting from system instruction
            const silentPcm = new Int16Array(1600);
            const base64Silent = encode(new Uint8Array(silentPcm.buffer));
            
            sessionPromiseRef.current?.then(session => {
              session.sendRealtimeInput({ 
                media: { data: base64Silent, mimeType: 'audio/pcm;rate=16000' } 
              });
            });
          },
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
            // Stop all current audio immediately when user interrupts
            sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setIsUserSpeaking(true);
          },
          onClose: () => onClose()
        }
      });

      sessionPromiseRef.current = sessionPromise;

      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/98 backdrop-blur-3xl p-4">
      {/* ChatGPT Like Fullscreen Layout */}
      <div className="w-full max-w-2xl h-full flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                <Radio size={24} className="text-sky-400 animate-pulse" />
             </div>
             <div>
                <h2 className="text-xl font-black urdu-text text-white">لائیو ریسرچ</h2>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-[10px] text-sky-400 font-black tracking-widest uppercase">Urdu AI Native Voice</span>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition-all active:scale-90 border border-white/10">
            <X size={24} />
          </button>
        </div>

        {/* Visualizer Area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-12 px-6">
          {isConnecting && !error ? (
            <div className="flex flex-col items-center gap-6 py-12">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-sky-500/20 animate-ping absolute inset-0" />
                <Loader2 className="w-24 h-24 text-sky-500 animate-spin relative z-10" />
              </div>
              <p className="urdu-text font-black text-sky-100 text-2xl">رابطہ کیا جا رہا ہے...</p>
            </div>
          ) : (
            <div className="relative w-72 h-72 flex items-center justify-center">
              <canvas ref={canvasRef} width={400} height={400} className="absolute inset-0 w-full h-full" />
              <div className={`w-36 h-36 rounded-full bg-gradient-to-tr from-[#0c4a6e] to-[#0ea5e9] flex items-center justify-center z-10 border-4 border-white/20 shadow-[0_0_50px_rgba(14,165,233,0.3)] transition-transform duration-500 ${isUserSpeaking ? 'scale-110 shadow-sky-500/60' : 'scale-100'}`}>
                <Mic size={54} className="text-white" />
              </div>
            </div>
          )}

          <div className="w-full min-h-[100px] flex items-center justify-center text-center px-4 max-w-lg">
            {error ? (
              <p className="text-red-500 urdu-text font-bold text-2xl">{error}</p>
            ) : !isConnecting && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <p className="urdu-text text-white font-black text-2xl md:text-4xl drop-shadow-lg leading-relaxed" dir="rtl">
                  {transcription || (isUserSpeaking ? "سن رہا ہوں..." : "میں حاضر ہوں...")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Transcription History (Slide up from bottom) */}
        <div className="h-48 overflow-y-auto px-10 py-6 space-y-4 no-scrollbar bg-gradient-to-t from-black/20 to-transparent">
          {history.map((item, idx) => (
            <div key={idx} className={`flex ${item.role === 'user' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-lg urdu-text font-medium shadow-2xl border ${
                item.role === 'user' ? 'bg-white/10 text-sky-100 border-white/10' : 'bg-sky-600 text-white border-sky-400'
              }`} dir="rtl">{item.text}</div>
            </div>
          ))}
          <div ref={historyEndRef} className="h-4" />
        </div>

        {/* Footer Info */}
        <div className="p-8 flex flex-col items-center gap-2 shrink-0">
           <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
             <ShieldCheck size={14} className="text-emerald-400" />
             <span className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em]">End-to-End Secure Research Session</span>
           </div>
           <p className="text-[11px] text-sky-300 urdu-text font-black opacity-40">
             Global Research Centre - قاری خالد محمود گولڈ میڈلسٹ
           </p>
        </div>
      </div>
    </div>
  );
};
