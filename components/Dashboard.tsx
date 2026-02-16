import React, { useRef, useState } from 'react';
import { Device } from '../types';
import { Power, ThermometerSnowflake, Tv, Fan, Lightbulb, Router, WashingMachine, Refrigerator, Plug, Zap, Sliders, Timer, Repeat } from 'lucide-react';

interface DashboardProps {
  devices: Device[];
  onToggle: (id: string) => void;
  onLongPress: (id: string) => void; // Callback for Timer Modal
}

const Dashboard: React.FC<DashboardProps> = ({ devices, onToggle, onLongPress }) => {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressingId, setPressingId] = useState<string | null>(null);

  const handlePointerDown = (id: string) => {
    setPressingId(id);
    pressTimer.current = setTimeout(() => {
      onLongPress(id);
      setPressingId(null);
      pressTimer.current = null; // Prevent click from firing after long press
    }, 800); // 800ms for long press
  };

  const handlePointerUp = (id: string) => {
    if (pressTimer.current) {
      // If timer still exists, it means it wasn't a long press, so it's a click
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
      setPressingId(null);
      onToggle(id);
    }
  };

  const handlePointerLeave = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
      setPressingId(null);
    }
  };
  
  const getIcon = (type: Device['type']) => {
    switch (type) {
      case 'ac': return ThermometerSnowflake;
      case 'tv': return Tv;
      case 'fan': return Fan;
      case 'router': return Router;
      case 'washer': return WashingMachine;
      case 'fridge': return Refrigerator;
      case 'outlet': return Plug;
      case 'light': return Lightbulb;
      default: return Power;
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-32 px-1">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8 select-none">
        {devices.map((device) => {
          const Icon = getIcon(device.type);
          const isHighWattage = device.watts > 1000;
          const isBeingPressed = pressingId === device.id;
          const hasTimer = device.activeTimer && device.activeTimer.targetTime > Date.now();
          const hasHabits = device.habits && device.habits.some(h => h.enabled);
          
          return (
            <div
              key={device.id}
              onPointerDown={() => handlePointerDown(device.id)}
              onPointerUp={() => handlePointerUp(device.id)}
              onPointerLeave={handlePointerLeave}
              className={`
                holo-card group relative aspect-[1/1] md:aspect-[4/3] rounded-3xl p-4 md:p-5 flex flex-col justify-between text-left cursor-pointer
                ${device.isOn ? 'active-device' : 'opacity-80 hover:opacity-100'}
                ${isBeingPressed ? 'scale-95 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)]' : 'active:scale-95'}
                transition-all duration-200
              `}
            >
              {/* Active State - Cyber Border Animation */}
              {device.isOn && (
                 <>
                    {/* Top Right Corner Accent */}
                    <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-bl-[40px] border-t border-r border-cyan-500/30"></div>
                 </>
              )}

              {/* Long Press Loading Indicator */}
              {isBeingPressed && (
                  <div className="absolute inset-0 z-50 rounded-3xl overflow-hidden pointer-events-none">
                      <div className="absolute top-0 left-0 h-1 bg-cyan-500 animate-[width_0.8s_linear_forwards]" style={{width: '0%'}}></div>
                  </div>
              )}

              {/* TOP ROW */}
              <div className="flex justify-between items-start z-10 w-full">
                  <div className={`
                    w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border
                    ${device.isOn 
                       ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]' 
                       : 'bg-white/5 border-white/10 text-gray-500 group-hover:bg-white/10 group-hover:text-white'}
                  `}>
                    <Icon size={20} strokeWidth={2} className="md:w-6 md:h-6" />
                  </div>

                  <div className="flex flex-col items-end gap-1">
                     {/* Status Indicators */}
                     <div className="flex gap-1">
                         {hasTimer && <div className="p-0.5 rounded bg-amber-500/20 text-amber-500"><Timer size={10} /></div>}
                         {hasHabits && <div className="p-0.5 rounded bg-purple-500/20 text-purple-500"><Repeat size={10} /></div>}
                     </div>

                     {device.isOn ? (
                       <>
                        <div className="flex items-center gap-1">
                            <Zap size={10} className={isHighWattage ? "text-amber-400 fill-amber-400" : "text-cyan-400 fill-cyan-400"} />
                            <span className={`font-mono font-bold text-lg md:text-xl leading-none tracking-tight ${isHighWattage ? 'text-amber-400' : 'text-cyan-300'}`}>
                              {device.watts}
                            </span>
                        </div>
                        <span className="text-[8px] md:text-[9px] text-gray-500 font-bold tracking-widest mt-0.5">WATTS</span>
                       </>
                     ) : (
                       <div className="w-2 h-2 rounded-full bg-red-500/50 shadow-[0_0_5px_red]"></div>
                     )}
                  </div>
              </div>

              {/* MIDDLE - EXTRA DATA PILL */}
              <div className="flex-1 flex items-center z-10 mt-2">
                 {device.extraData && device.isOn ? (
                    <div className="px-2 py-0.5 md:px-3 md:py-1 rounded bg-black/60 border border-cyan-500/30 text-cyan-300 text-[10px] md:text-xs font-mono shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                      {device.extraData}
                    </div>
                 ) : hasTimer ? (
                     <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1 animate-pulse">
                         <Timer size={10} />
                         <span>TIMER ACTIVE</span>
                     </div>
                 ) : (
                    <div className="h-4"></div> /* Spacer */
                 )}
              </div>

              {/* BOTTOM - LABELING */}
              <div className="w-full z-10 flex items-end justify-between">
                 <div className="bg-white/5 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sliders size={12} className="text-gray-400" />
                 </div>

                 <div className="text-right">
                    <h3 className={`font-bold text-sm md:text-lg leading-tight transition-colors drop-shadow-md line-clamp-1 ${device.isOn ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} dir="rtl">
                      {device.name}
                    </h3>
                    <div className="flex items-center justify-end gap-2 mt-1">
                        <div className={`h-[2px] w-4 md:w-8 rounded-full ${device.isOn ? 'bg-cyan-500 shadow-[0_0_5px_#00FFFF]' : 'bg-gray-700'}`}></div>
                        <span className={`text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-mono ${device.isOn ? 'text-cyan-400' : 'text-gray-600'}`}>
                          {device.isOn ? 'ONLINE' : 'OFF'}
                        </span>
                    </div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;