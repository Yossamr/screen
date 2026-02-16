import React from 'react';
import { Scene } from '../types';
import { Moon, Clapperboard, Leaf, LogOut, ArrowRight, Zap, Gamepad2, Briefcase } from 'lucide-react';

interface ScenesPageProps {
  scenes: Scene[];
  onApply: (id: string) => void;
}

const ScenesPage: React.FC<ScenesPageProps> = ({ scenes, onApply }) => {
  
  // Heuristic to pick an icon based on name (since icons aren't stored in DB)
  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('sleep') || n.includes('نوم')) return <Moon size={32} />;
    if (n.includes('movie') || n.includes('سينما')) return <Clapperboard size={32} />;
    if (n.includes('game') || n.includes('جيمينج')) return <Gamepad2 size={32} />;
    if (n.includes('work') || n.includes('focus') || n.includes('شغل')) return <Briefcase size={32} />;
    if (n.includes('leave') || n.includes('خروج') || n.includes('off')) return <LogOut size={32} />;
    return <Zap size={32} />;
  };

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto pb-24 w-full">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold tracking-[0.5em] text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Environment Control</h2>
        <div className="h-[1px] w-32 bg-cyan-500 mx-auto mt-4 shadow-[0_0_10px_#00FFFF]"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 w-full px-4 overflow-y-auto max-h-[70vh] no-scrollbar">
        {scenes.map((scene) => {
          return (
            <button
              key={scene.id}
              onClick={() => onApply(scene.id)}
              className={`
                 group relative h-28 md:h-32 rounded-2xl border flex items-center px-6 gap-6
                 bg-gradient-to-br from-gray-900/80 to-black border-white/10
                 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl
                 active:scale-95 overflow-hidden backdrop-blur-md
              `}
              style={{
                  // Dynamic Glow based on scene color
                  borderColor: `${scene.color}40`,
                  boxShadow: `0 0 20px -10px ${scene.color}`
              }}
            >
              {/* Noise Overlay */}
              <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
              
              {/* Hover Light Sweep (Colored) */}
              <div 
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out opacity-20"
                style={{ background: `linear-gradient(90deg, transparent, ${scene.color}, transparent)` }}
              ></div>

              <div 
                className={`
                   relative z-10 w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center
                   bg-black/40 border border-white/10 shadow-inner group-hover:bg-black/60 transition-colors
                `}
                style={{ color: scene.color }}
              >
                 {getIcon(scene.name)}
              </div>
              
              <div className="relative z-10 flex-1 text-right">
                 <span className="text-xl md:text-2xl font-bold text-white tracking-tight block drop-shadow-md group-hover:tracking-wide transition-all duration-300" dir="rtl">{scene.name}</span>
                 <div className="flex justify-end items-center gap-2 mt-1 opacity-60 group-hover:opacity-100">
                    <span className="text-[9px] uppercase tracking-widest text-white">ACTIVATE SCENE</span>
                    <div 
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: scene.color }}
                    ></div>
                 </div>
              </div>

              {/* Arrow Icon */}
              <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                <ArrowRight className="text-white/70" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ScenesPage;