import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#020617] text-slate-100 flex flex-col font-sans overflow-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#06b6d4]/5 opacity-50 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#3b82f6]/5 opacity-50 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container - Responsive layout for web */}
      <div className="w-full flex-1 flex flex-col relative h-full overflow-hidden">
        {/* App Content viewport */}
        <div className="flex-1 w-full max-w-lg mx-auto bg-[#070b19] border-x border-slate-900 shadow-2xl flex flex-col relative h-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

