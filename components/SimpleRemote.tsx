import React, { useEffect, useState } from 'react';
import { Device } from '../types';
import { Power, Tv, Activity, Volume2, Volume1, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Menu, Square, Lightbulb, Fan } from 'lucide-react';
import { COLORS } from '../constants';

interface SimpleRemoteProps {
  device: Device;
  onToggle: () => void;
  onUpdate?: (params: Partial<Device['params']>) => void;
}

const SimpleRemote: React.FC<SimpleRemoteProps> = ({ device, onToggle, onUpdate }) => {
  const [durationStr, setDurationStr] = useState('--:--:--');

  useEffect(() => {
    if (!device.isOn || !device.lastStartTime) {
      setDurationStr('--:--:--');
      return;
    }

    const updateTime = () => {
      const seconds = Math.floor((Date.now() - (device.lastStartTime || Date.now())) / 1000);
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      setDurationStr(`${h}:${m}:${s}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [device.isOn, device.lastStartTime]);
  
  // RENDER: TV REMOTE LAYOUT
  if (device.type === 'tv') {
    return (
      <div className="flex flex-col h-full gap-4">
         {/* Screen Mockup */}
         <div className={`
            w-full h-32 rounded-xl bg-black border-4 border-gray-800 relative overflow-hidden flex items-center justify-center shadow-inner
            ${device.isOn ? 'shadow-[0_0_30px_rgba(0,0,255,0.2)]' : ''}
         `}>
             {!device.isOn ? (
                <div className="w-2 h-2 rounded-full bg-red-900 animate-pulse"></div>
             ) : (
                <div className="text-center animate-pulse">
                  <Tv size={32} className="text-blue-500 mx-auto mb-2" />
                  <span className="text-xs font-mono text-blue-400">HDMI 1 • 1080p</span>
                  <div className="mt-1 text-[10px] text-gray-500 font-mono">{durationStr}</div>
                </div>
             )}
             {device.isOn && <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none"></div>}
         </div>

         {/* D-Pad Area */}
         <div className="flex-1 flex flex-col items-center justify-center py-4">
             <div className="w-48 h-48 rounded-full bg-[#151515] border border-white/10 relative shadow-2xl flex items-center justify-center">
                 <button className="absolute top-2 left-1/2 -translate-x-1/2 p-3 text-gray-500 hover:text-white active:scale-90 transition-all"><ChevronUp size={24}/></button>
                 <button className="absolute bottom-2 left-1/2 -translate-x-1/2 p-3 text-gray-500 hover:text-white active:scale-90 transition-all"><ChevronDown size={24}/></button>
                 <button className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-gray-500 hover:text-white active:scale-90 transition-all"><ChevronLeft size={24}/></button>
                 <button className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-gray-500 hover:text-white active:scale-90 transition-all"><ChevronRight size={24}/></button>
                 
                 <div className="w-16 h-16 rounded-full bg-[#202025] shadow-inner flex items-center justify-center text-[10px] font-bold text-gray-400 border border-white/5 active:bg-cyan-900/50 active:text-cyan-400 cursor-pointer hover:bg-white/5 transition-colors">
                    OK
                 </div>
             </div>
         </div>

         {/* Bottom Controls */}
         <div className="grid grid-cols-3 gap-3">
            <button className="h-14 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/5 active:scale-95"><Volume2 size={20}/></button>
            <button 
              onClick={onToggle}
              className={`h-14 rounded-xl flex items-center justify-center border active:scale-95 transition-all ${device.isOn ? 'bg-blue-900/50 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-red-900/20 border-red-900/50 text-red-500'}`}
            >
              <Power size={24} />
            </button>
            <button className="h-14 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/5 active:scale-95"><Menu size={20}/></button>
         </div>
      </div>
    );
  }

  // RENDER: FAN CONTROLLER
  if (device.type === 'fan') {
    let animDuration = '0s';
    if (device.isOn) {
      if (device.params?.fanSpeed === 'high') animDuration = '0.3s';
      else if (device.params?.fanSpeed === 'med') animDuration = '0.8s';
      else animDuration = '1.5s';
    }

    const setSpeed = (speed: 'low' | 'med' | 'high') => {
      if (onUpdate) onUpdate({ fanSpeed: speed });
    };

    return (
      <div className="flex flex-col h-full items-center justify-between py-4">
         <div className="relative w-56 h-56 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-white/5"></div>
            <div className={`transition-all duration-1000 ease-in-out ${device.isOn ? 'opacity-100' : 'opacity-30'}`}>
               <Fan size={180} className={`text-cyan-500 transition-all ${device.isOn ? 'animate-spin' : ''}`} style={{ animationDuration: animDuration }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-16 h-16 rounded-full bg-[#111] border border-white/10 shadow-xl flex items-center justify-center z-10 flex-col">
                  <span className={`font-mono text-xl font-bold ${device.isOn ? 'text-cyan-400' : 'text-gray-600'}`}>
                    {device.isOn ? (device.params?.fanSpeed?.toUpperCase().substring(0,3) || 'ON') : 'OFF'}
                  </span>
                  {device.isOn && <span className="text-[9px] text-cyan-700 font-mono mt-0.5">{durationStr}</span>}
               </div>
            </div>
         </div>

         <div className="w-full grid grid-cols-1 gap-4">
             <div className="w-full h-12 bg-gray-800/50 rounded-full overflow-hidden relative flex p-1 gap-1">
                {(['low', 'med', 'high'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    disabled={!device.isOn}
                    className={`flex-1 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all
                      ${device.params?.fanSpeed === s && device.isOn ? 'bg-cyan-500 text-black shadow-[0_0_10px_cyan]' : 'text-gray-500 hover:text-white'}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {s}
                  </button>
                ))}
             </div>

             <button 
               onClick={onToggle}
               className={`
                 mt-2 w-full h-16 rounded-2xl flex items-center justify-center gap-3 border transition-all duration-300 active:scale-95
                 ${device.isOn 
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                    : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}
               `}
             >
               <Power size={24} />
               <span className="font-bold tracking-widest">TOGGLE POWER</span>
             </button>
         </div>
      </div>
    );
  }

  // RENDER: DEFAULT (LIGHT/OUTLET)
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 relative">
      <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${device.isOn ? 'opacity-20' : 'opacity-0'}`}>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/30 blur-[100px] rounded-full"></div>
      </div>

      <button
        onClick={onToggle}
        className={`
          relative w-48 h-48 rounded-[3rem] flex items-center justify-center
          transition-all duration-500 border-[6px] shadow-2xl active:scale-95 group
          ${device.isOn 
             ? 'bg-gradient-to-br from-[#1a2e1a] to-black border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]' 
             : 'bg-[#111] border-[#222] shadow-[inset_0_0_20px_rgba(0,0,0,1)]'}
        `}
      >
         <div className={`absolute inset-2 rounded-[2.5rem] border border-white/5 ${device.isOn ? 'animate-pulse' : ''}`}></div>

         <div className="flex flex-col items-center gap-2 z-10">
            <Power size={64} className={`transition-all duration-500 ${device.isOn ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,1)]' : 'text-gray-700 group-hover:text-gray-500'}`} />
            <span className={`text-xs font-bold tracking-[0.3em] ${device.isOn ? 'text-green-400' : 'text-gray-700'}`}>
               {device.isOn ? 'ACTIVE' : 'PRESS'}
            </span>
         </div>
      </button>

      <div className="w-full bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/5">
         <div className="flex items-center gap-3">
             <div className="p-2 bg-black rounded-lg text-amber-500"><Activity size={18}/></div>
             <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Consumption</span>
                <span className="text-sm font-mono text-white">{device.isOn ? device.watts : 0}W</span>
             </div>
         </div>
         <div className="h-8 w-[1px] bg-white/10"></div>
         <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Session</span>
            <span className="text-sm font-mono text-white tabular-nums">{durationStr}</span>
         </div>
      </div>
    </div>
  );
};

export default SimpleRemote;