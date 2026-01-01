
import React, { useState } from 'react';
import { X, Sparkles, BookOpen, ShieldCheck, Award, MessageCircle, ExternalLink, Scale, Target, Zap, GraduationCap, Microscope } from 'lucide-react';
import { ABOUT_TEXT, USAGE_PROCEDURE_TEXT, WHATSAPP_LINK, DETAILED_INFO_SECTIONS } from '../constants';
import { UserSettings } from '../types';

interface IntroModalProps {
  onClose: () => void;
  settings: UserSettings;
}

export const IntroModal: React.FC<IntroModalProps> = ({ onClose, settings }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`relative w-full max-w-2xl overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] ${settings.highContrast ? 'bg-slate-900 border-slate-700' : 'bg-white border-sky-100'}`}>
        
        {/* Header Background */}
        <div className="shrink-0 h-28 md:h-36 bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0369a1] relative">
            <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-20">
              <X size={20} />
            </button>
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center border-4 border-sky-50 z-10 p-2">
                <Sparkles size={32} className="text-sky-600 mb-1" />
                <span className="text-[8px] font-black text-sky-900 urdu-text">اُردو اے آئی</span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pt-16 pb-6 px-6 md:px-10">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl md:text-3xl font-black urdu-text text-sky-950">گلوبل ریسرچ سینٹر (GRC)</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-sky-200"></div>
              <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-[10px] font-black uppercase tracking-widest">تحقیقی منشور</span>
              <div className="h-px w-8 bg-sky-200"></div>
            </div>
          </div>

          <div className="space-y-10" dir="rtl">
            {/* Founder Info */}
            <div className="flex items-start gap-4 p-5 bg-sky-50 rounded-3xl border border-sky-100/50">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                    <GraduationCap size={28} className="text-sky-700" />
                </div>
                <div>
                    <h3 className="text-lg font-black urdu-text text-sky-900">قاری خالد محمود گولڈ میڈلسٹ</h3>
                    <p className="text-xs text-slate-600 urdu-text leading-relaxed">
                        بانی و سرپرستِ اعلیٰ گلوبل ریسرچ سینٹر۔ آپ کا وژن مصنوعی ذہانت کو علمی دیانت اور مستند حوالوں کے ساتھ ہم آہنگ کرنا ہے۔
                    </p>
                </div>
            </div>

            {/* Detailed Sections */}
            <div className="grid grid-cols-1 gap-6">
                {DETAILED_INFO_SECTIONS.map((section, idx) => (
                    <section key={idx} className="space-y-3">
                        <div className="flex items-center gap-3 text-sky-800 border-b border-sky-100 pb-2">
                            {idx === 0 ? <Microscope size={20} /> : idx === 1 ? <ShieldCheck size={20} /> : <BookOpen size={20} />}
                            <h3 className="text-xl font-black urdu-text">{section.title}</h3>
                        </div>
                        <p className="urdu-text text-sm md:text-base text-slate-700 leading-[2] text-justify">
                            {section.content}
                        </p>
                    </section>
                ))}
            </div>

            {/* Directives (Strict Policies) */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-sky-800 border-b border-sky-100 pb-2">
                <Scale size={20} className="shrink-0" />
                <h3 className="text-xl font-black urdu-text">سخت علمی ضابطے</h3>
              </div>
              <div className="bg-[#0c4a6e] text-sky-50 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 p-4 opacity-10 rotate-12">
                    <ShieldCheck size={100} />
                </div>
                <ul className="space-y-4 relative z-10">
                    <li className="flex gap-4 text-sm">
                        <div className="w-6 h-6 rounded-full bg-sky-400/20 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold">1</span>
                        </div>
                        <p className="urdu-text">کسی بھی غیر مستند یا فرضی حوالے کی قطعی اجازت نہیں ہے۔</p>
                    </li>
                    <li className="flex gap-4 text-sm">
                        <div className="w-6 h-6 rounded-full bg-sky-400/20 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold">2</span>
                        </div>
                        <p className="urdu-text">حدیث کا حوالہ صرف 'اسلام 360' کے تصدیق شدہ ڈیٹا بیس سے ہی دیا جاتا ہے۔</p>
                    </li>
                    <li className="flex gap-4 text-sm">
                        <div className="w-6 h-6 rounded-full bg-sky-400/20 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold">3</span>
                        </div>
                        <p className="urdu-text">اگر کسی معاملے میں علم کا فقدان ہو تو اے آئی 'معذرت' کرنے کا پابند ہے۔</p>
                    </li>
                </ul>
              </div>
            </section>

            {/* Usage */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-sky-800 border-b border-sky-100 pb-2">
                <Target size={20} className="shrink-0" />
                <h3 className="text-xl font-black urdu-text">استعمال کا طریقہ</h3>
              </div>
              <p className="urdu-text text-sm text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-3xl border border-slate-100">
                {USAGE_PROCEDURE_TEXT}
              </p>
            </section>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
             <a 
               href={WHATSAPP_LINK}
               target="_blank"
               rel="noopener noreferrer"
               className="w-full flex items-center justify-center gap-3 p-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-black transition-all shadow-lg active:scale-95"
             >
                <MessageCircle size={20} />
                <span className="urdu-text text-lg">علمی رہنمائی (واٹس ایپ)</span>
                <ExternalLink size={16} />
             </a>
             <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest urdu-text">
                Urdu AI - A Global Research Centre Project
             </p>
        </div>
      </div>
    </div>
  );
};
