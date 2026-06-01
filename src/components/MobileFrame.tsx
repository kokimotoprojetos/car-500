import React, { useEffect, useState } from 'react';
import { Battery, Wifi, ShieldAlert, Cpu } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      const strHours = hours < 10 ? '0' + hours : hours;
      const strMinutes = minutes < 10 ? '0' + minutes : minutes;
      setTime(`${strHours}:${strMinutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center p-0 md:p-6 select-none font-sans overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#06b6d4] opacity-5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3b82f6] opacity-5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container - Framed on desktop, borderless on mobile */}
      <div className="w-full max-w-md h-screen md:h-[880px] bg-[#090d1f] md:rounded-[40px] md:border-8 md:border-slate-800 shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* Notch & Speaker simulating real phone, hidden on actual mobile screen sizes */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 rounded-b-2xl z-50">
          <div className="w-16 h-1 bg-slate-800 rounded-full mx-auto mt-2" />
          <div className="absolute right-8 top-1.5 w-2.5 h-2.5 bg-[#090d1f] rounded-full border border-slate-800" />
        </div>

        {/* Status Bar */}
        <div className="w-full h-11 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0 z-40 select-none">
          <div className="flex items-center gap-2">
            <span>Robi</span>
            <span className="text-[10px] text-[#06b6d4] font-bold bg-[#06b6d4]/10 px-1 py-0.2 rounded border border-[#06b6d4]/20">5G</span>
          </div>
          <div>{time || '12:00'}</div>
          <div className="flex items-center gap-2">
            <Wifi size={14} className="text-slate-400" />
            <div className="flex items-center gap-1">
              <span className="text-[10px]">69%</span>
              <Battery size={16} className="text-emerald-400 rotate-0" />
            </div>
          </div>
        </div>

        {/* App Content viewport */}
        <div className="flex-1 w-full flex flex-col overflow-y-auto relative bg-[#070b19] scrollbar-thin scrollbar-thumb-slate-800">
          {children}
        </div>

        {/* Decorative Home Indicator Bar for phone simulation */}
        <div className="w-full h-5 bg-slate-950 flex items-center justify-center pb-1 shrink-0 z-40 select-none">
          <div className="w-32 h-1 bg-slate-700/80 rounded-full" />
        </div>
      </div>
    </div>
  );
}
