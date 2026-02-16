import React from 'react';
import { Device } from '../types';
import { Power, Wind, Snowflake, Flame, Droplets, Fan, Plus, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { COLORS } from '../constants';

interface ACRemoteProps {
  device: Device;
  onToggle: () => void;
  onUpdate: (params: Partial<Device['params']>) => void;
}

const ACRemote: React.FC<ACRemoteProps> = ({ device, onToggle, onUpdate }) => {
  const { temperature = 24, mode = 'cool', fanSpeed = 'low' } = device.params || {};

  const handleTemp = (delta: number) => {
    const newTemp = Math.min(30, Math.max(16, temperature + delta));
    onUpdate({ temperature: newTemp });
  };

  const cycleMode = () => {
    const modes: Array<NonNullable<Device['params']>['mode']> = ['cool', 'heat', 'dry', 'fan'];
    const idx = modes.indexOf(mode);
    onUpdate({ mode: modes[(idx + 1) % modes.length] });
  };

  const cycleFan = () => {
    const speeds: Array<NonNullable<Device['params']>['fanSpeed']> = ['low', 'med', 'high'];
    const idx = speeds.indexOf(fanSpeed);
    onUpdate({ fanSpeed: speeds[(idx + 1) % speeds.length] });
  };

  const getModeColor = () => {
    if (!device.isOn) return 'text-gray-600';
    switch(mode) {
      case 'cool': return 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]';
      case 'heat': return 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]';
      case 'dry': return 'text-blue-400';
      default: return 'text-white';
    }
  };

  const getModeIcon = () => {
    switch(mode) {
      case 'cool': return <Snowflake size={24} className={getModeColor()} />;
      case 'heat': return <Flame size={24} className={getModeColor()} />;
      case 'dry': return <Droplets size={24} className={getModeColor()} />;
      default: return <Wind size={24} className={getModeColor()} />;
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 select-none">
      
      {/* 1. MAIN CIRCULAR DISPLAY */}
      <div className="relative w-full aspect-square max-h-[280px] mx-auto flex items-center justify-center">
         
         {/* Outer Rings */}
         <div className={`absolute inset-0 rounded-full border-2 border-dashed transition-all duration-700 ${device.isOn ? 'border-cyan-900 rotate-180' : 'border-gray-800'}`}></div>
         <div className={`absolute inset-4 rounded-full border border-white/5`}></div>
         
         {/* Active Glow Ring */}
         {device.isOn && (
           <div className={`absolute inset-0 rounded-full border-t-2 border-l-2 animate-spin-slow duration-[8s] ${mode === 'heat' ? 'border-amber-500' : 'border-cyan-500'}`}></div>
         )}

         {/* Center Core */}
         <div className={`
            relative w-48 h-48 rounded-full flex flex-col items-center justify-center
            bg-gradient-to-br from-[#151520] to-black shadow-[inset_0_0_20px_rgba(0,0,0,1)]
            border border-white/10 transition-all duration-500
            ${device.isOn ? 'scale-100' : 'scale-95 grayscale'}
         `}>
             {!device.isOn ? (
                <div className="flex flex-col items-center gap-2 opacity-50">
                   <Power size={32} />
                   <span className="text-xs tracking-widest font-mono">OFFLINE</span>
                </div>
             ) : (
                <>
                  <span className="text-[10px] text-gray-500 font-mono tracking-[0.2em] mb-1">TARGET TEMP</span>
                  <div className="flex items-start">
                    <span className={`text-7xl font-bold tracking-tighter transition-colors duration-300 ${mode === 'heat' ? 'text-amber-500' : 'text-white'}`}>
                      {temperature}
                    </span>
                    <span className="text-2xl text-gray-500 mt-2">°C</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                     {getModeIcon()}
                     <span className="text-[10px] font-bold uppercase text-gray-400">{mode}</span>
                  </div>
                </>
             )}
         </div>

         {/* Orbital Buttons (Temp Control) */}
         {device.isOn && (
           <>
             <button 
               onClick={() => handleTemp(1)}
               className="absolute -right-2 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#1a1a20] border border-white/10 shadow-lg flex items-center justify-center hover:bg-white/10 hover:border-cyan-500/50 hover:text-cyan-400 active:scale-90 transition-all z-20"
             >
               <ChevronUp size={28} />
             </button>
             <button 
               onClick={() => handleTemp(-1)}
               className="absolute -left-2 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#1a1a20] border border-white/10 shadow-lg flex items-center justify-center hover:bg-white/10 hover:border-cyan-500/50 hover:text-cyan-400 active:scale-90 transition-all z-20"
             >
               <ChevronDown size={28} />
             </button>
           </>
         )}
      </div>

      {/* 2. CONTROL GRID */}
      <div className="grid grid-cols-3 gap-3">
        
        {/* Power Toggle */}
        <button 
          onClick={onToggle}
          className={`
             h-20 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all duration-300 active:scale-95
             ${device.isOn 
                ? 'bg-gradient-to-br from-cyan-900/40 to-black border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'}
          `}
        >
          <Power size={24} className={device.isOn ? "text-cyan-400" : "text-gray-500"} />
          <span className={`text-[10px] font-bold tracking-widest ${device.isOn ? 'text-cyan-400' : 'text-gray-600'}`}>POWER</span>
        </button>

        {/* Mode Selector */}
        <button 
          onClick={cycleMode}
          disabled={!device.isOn}
          className={`
             h-20 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all duration-300 active:scale-95 disabled:opacity-30
             bg-[#111] border-white/10 hover:border-white/30
          `}
        >
          <div className="p-2 rounded-full bg-white/5">{getModeIcon()}</div>
          <span className="text-[10px] font-bold tracking-widest text-gray-400">MODE</span>
        </button>

        {/* Fan Speed */}
        <button 
          onClick={cycleFan}
          disabled={!device.isOn}
          className={`
             h-20 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all duration-300 active:scale-95 disabled:opacity-30
             bg-[#111] border-white/10 hover:border-white/30
          `}
        >
           <div className="flex gap-0.5 items-end h-6">
              <div className={`w-1.5 bg-gray-600 rounded-sm ${['low','med','high'].includes(fanSpeed!) ? 'bg-cyan-400 h-3' : 'h-3'}`}></div>
              <div className={`w-1.5 bg-gray-600 rounded-sm ${['med','high'].includes(fanSpeed!) ? 'bg-cyan-400 h-4' : 'h-4'}`}></div>
              <div className={`w-1.5 bg-gray-600 rounded-sm ${['high'].includes(fanSpeed!) ? 'bg-cyan-400 h-6' : 'h-6'}`}></div>
           </div>
           <span className="text-[10px] font-bold tracking-widest text-gray-400">FAN {fanSpeed?.toUpperCase()}</span>
        </button>

      </div>
    </div>
  );
};

export default ACRemote;
