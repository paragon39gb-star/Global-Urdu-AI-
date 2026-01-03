
import React, { useRef, useState } from 'react';
import { PresentationData } from '../types';
import { Sparkles, Award, Zap, CheckCircle2, Download, Loader2, Image as ImageIcon } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

interface PresentationCardProps {
  data: PresentationData;
}

export const PresentationCard: React.FC<PresentationCardProps> = ({ data }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      const dataUrl = await htmlToImage.toJpeg(cardRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `UrduAI-Poster-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Poster export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getColorTheme = (color?: string) => {
    switch (color) {
      case 'gold': return { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-900', accent: 'bg-amber-500' };
      case 'ruby': return { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-900', accent: 'bg-rose-600' };
      case 'emerald': return { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-900', accent: 'bg-emerald-600' };
      case 'onyx': return { bg: 'bg-slate-50', border: 'border-slate-400', text: 'text-slate-900', accent: 'bg-slate-800' };
      case 'blue': 
      default: return { bg: 'bg-sky-50', border: 'border-sky-400', text: 'text-sky-900', accent: 'bg-sky-600' };
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 py-4">
      <div className="flex gap-2">
        <button 
          onClick={handleDownloadImage}
          disabled={isExporting}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#0c4a6e] to-sky-700 text-white rounded-2xl text-sm font-black urdu-text hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
          <span>{isExporting ? 'تصویر تیار ہو رہی ہے...' : 'جے پی جی (JPG) پوسٹر ڈاؤن لوڈ کریں'}</span>
        </button>
      </div>

      {/* Main Poster Canvas */}
      <div 
        ref={cardRef}
        className="w-[500px] h-[500px] bg-white relative overflow-hidden flex flex-col border-[12px] border-[#0c4a6e] shadow-2xl urdu-font-nastaleeq"
        dir="rtl"
      >
        {/* Poster Header */}
        <div className="bg-[#0c4a6e] p-6 text-center text-white relative">
           <div className="absolute top-2 right-4 opacity-20"><Sparkles size={40} /></div>
           <h2 className="text-3xl font-black mb-1 leading-tight">{data.title}</h2>
           <div className="h-1 w-20 bg-yellow-400 mx-auto rounded-full mb-2"></div>
           <p className="text-sm font-bold opacity-90">{data.theme}</p>
        </div>

        {/* Poster Body */}
        <div className="flex-1 p-4 grid grid-cols-1 gap-3 overflow-hidden bg-slate-50">
          {data.stations.slice(0, 4).map((station, idx) => {
            const theme = getColorTheme(station.color);
            return (
              <div key={idx} className={`${theme.bg} ${theme.border} border-2 rounded-2xl p-3 flex gap-4 items-center`}>
                <div className={`${theme.accent} w-10 h-10 rounded-full flex items-center justify-center text-white font-black shrink-0 shadow-md`}>
                  {idx + 1}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className={`font-black text-sm mb-0.5 ${theme.text}`}>{station.title}</h4>
                  <p className="text-xs font-bold leading-relaxed truncate-2-lines text-slate-700">{station.urdu}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Poster Footer (Conclusion) */}
        <div className="bg-white p-4 border-t-2 border-[#0c4a6e]/10">
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex items-center gap-3">
             <div className="bg-yellow-400 p-2 rounded-lg"><Zap size={16} className="text-white" /></div>
             <div className="flex-1">
                <p className="text-[10px] font-black text-yellow-800 leading-tight">حاصلِ کلام: {data.conclusion}</p>
                <p className="text-sm font-black text-[#0c4a6e]">{data.formula}</p>
             </div>
          </div>
          
          <div className="mt-3 flex justify-between items-center px-1">
             <div className="flex items-center gap-1">
                <div className="w-5 h-5 bg-[#0c4a6e] rounded flex items-center justify-center text-[8px] text-white">GRC</div>
                <span className="text-[8px] font-black text-slate-400">URDU AI RESEARCH ENGINE</span>
             </div>
             <span className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-pink-600 urdu-text">طالب دعا: قاری خالد محمود بانی اردو اے آئی</span>
          </div>
        </div>

        {/* Watermark/Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
           <Award size={300} />
        </div>
      </div>
      
      <p className="urdu-text text-xs text-slate-400 font-bold">آپ اس تصویر کو واٹس ایپ اسٹیٹس یا دیگر جگہوں پر شیئر کر سکتے ہیں۔</p>
    </div>
  );
};
