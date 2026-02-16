import React, { useState, useEffect, useCallback } from 'react';
import { NexusSimulatorProps, Device, Scene, TimerConfig } from '../types';
import Dashboard from './Dashboard';
import StatsPage from './StatsPage';
import ScenesPage from './ScenesPage';
import BootSequence from './BootSequence';
import DeviceModal from './DeviceModal';
import SettingsModal from './SettingsModal';
import TimerModal from './TimerModal';
import VoiceAssistant from './VoiceAssistant'; // --- NEW IMPORT
import { Home, BarChart2, Layers, Wifi, Battery, Clock, Zap, Cpu, Settings, WifiOff, CheckCircle2, Activity, Terminal, Hash } from 'lucide-react';

const NexusSimulator: React.FC<NexusSimulatorProps> = ({
  devices,
  scenes,
  maxLoadWatts,
  isConnected,
  onToggleDevice,
  onUpdateDeviceParams,
  onApplyScene,
  onAddScene,
  onUpdateScene,
  onDeleteScene,
  onSetDeviceTimer, 
  onUpdateDeviceHabits 
}) => {
  const [booting, setBooting] = useState(true);
  const [activePage, setActivePage] = useState<0 | 1 | 2>(1);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [timerDeviceId, setTimerDeviceId] = useState<string | null>(null); 
  const [showSettings, setShowSettings] = useState(false);
  const [time, setTime] = useState('');

  // --- NEW: ACTIVATION OVERLAY STATE ---
  const [activatingScene, setActivatingScene] = useState<Scene | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBootComplete = useCallback(() => {
    setBooting(false);
  }, []);

  const handleDeviceClick = (id: string) => {
    setSelectedDeviceId(id);
  };

  const handleDeviceLongPress = (id: string) => {
    setTimerDeviceId(id);
  }

  // --- WRAPPER TO TRIGGER ANIMATION ---
  const handleApplySceneWrapper = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene) {
        setActivatingScene(scene);
        // Apply logic immediately
        onApplyScene(sceneId);
        // Remove overlay after animation
        setTimeout(() => {
            setActivatingScene(null);
        }, 2000); // Slightly longer for the new cool effect
    }
  };

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  const timerDevice = devices.find(d => d.id === timerDeviceId);

  if (booting) {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  return (
    <div className="w-full h-full relative flex flex-col font-sans bg-[#020202] overflow-hidden selection:bg-cyan-500/30">
      
      {/* --- VOICE ASSISTANT --- */}
      <VoiceAssistant 
        devices={devices}
        scenes={scenes}
        onToggleDevice={onToggleDevice}
        onApplyScene={handleApplySceneWrapper}
        onUpdateDeviceParams={onUpdateDeviceParams}
      />

      {/* --- CINEMATIC VFX LAYERS --- */}
      <div className="bg-hex-grid opacity-20"></div>
      <div className="bg-noise"></div>
      <div className="bg-scanlines"></div>
      
      {/* Dynamic Nebulas (CSS Blobs) */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* --- HEADER (HUD Style) --- */}
      <header className="glass-panel z-20 h-16 md:h-20 flex items-center justify-between px-4 md:px-8 shrink-0 relative mt-2 mx-2 rounded-2xl md:mx-0 md:mt-0 md:rounded-none md:border-t-0 md:border-x-0 overflow-hidden">
         
         {/* Left: Settings Button (Independent) */}
         <div className="relative z-30">
             <button 
               onClick={() => setShowSettings(true)}
               className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center group focus:outline-none"
             >
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin-slow group-hover:border-cyan-400/80 transition-colors"></div>
                <div className="absolute inset-2 rounded-full border border-cyan-500/20 border-b-cyan-400 animate-spin-reverse"></div>
                <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_#00FFFF] animate-pulse ${isConnected ? 'bg-cyan-400' : 'bg-red-500 shadow-red-500'}`}></div>
                
                {/* Tooltip hint */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[8px] bg-black border border-cyan-500/30 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-cyan-400 pointer-events-none">
                  SYSTEM CONFIG
                </div>
             </button>
         </div>

         {/* Center: THE UBER LOGO */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
             <div className="relative transform scale-x-125 md:scale-x-150 origin-center flex flex-col items-center">
                 {/* Main Glowing Text */}
                 <h1 className="text-4xl md:text-5xl tracking-[0.1em] nexus-uber-logo cursor-default drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" data-text="NEXUS">
                    NEXUS
                 </h1>
                 
                 {/* Decorative Underlines */}
                 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"></div>
                 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-[4px] bg-cyan-500/30 blur-md rounded-full"></div>
             </div>
         </div>

         {/* Right: Status Data HUD */}
         <div className="relative z-30 flex items-center gap-4 md:gap-8">
            <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>

            {/* Time & Connectivity */}
            <div className="flex items-center gap-4 md:gap-6 text-gray-400">
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-[9px] text-gray-500 tracking-widest mb-0.5">HUB LINK</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono transition-colors ${isConnected ? 'text-green-400' : 'text-red-400 animate-pulse'}`}>
                           {isConnected ? 'ONLINE' : 'SEARCHING...'}
                        </span>
                        {isConnected ? (
                           <Wifi size={16} className="text-green-400" />
                        ) : (
                           <WifiOff size={16} className="text-red-400" />
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
                    <Clock size={14} className="text-cyan-500 md:w-4 md:h-4" />
                    <span className="font-mono text-sm md:text-xl text-white font-bold tracking-widest">{time}</span>
                </div>
            </div>
         </div>
      </header>

      {/* --- MAIN STAGE --- */}
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col p-2 md:p-6 lg:px-12 pb-28 md:pb-6">
         {activePage === 0 && (
            <ScenesPage 
              scenes={scenes} 
              onApply={handleApplySceneWrapper} 
            />
         )}
         {activePage === 1 && (
            <Dashboard 
                devices={devices} 
                onToggle={handleDeviceClick} 
                onLongPress={handleDeviceLongPress} // --- HANDLER WIRED
            />
         )}
         {activePage === 2 && (
            <StatsPage 
              devices={devices} 
            />
         )}
      </main>

      {/* --- DOCK (Floating Island) --- */}
      <footer className="fixed bottom-6 left-0 w-full z-40 flex justify-center pointer-events-none">
         <div className="glass-panel px-6 md:px-10 py-3 rounded-2xl md:rounded-full flex items-center gap-8 md:gap-10 pointer-events-auto shadow-[0_10px_50px_rgba(0,0,0,0.8)] border border-cyan-500/20 ring-1 ring-cyan-500/10 backdrop-blur-xl transform transition-transform hover:scale-105">
            
            <NavButton 
              active={activePage === 0} 
              onClick={() => setActivePage(0)} 
              icon={Layers} 
              label="SCENES" 
            />
            
            <NavButton 
              active={activePage === 1} 
              onClick={() => setActivePage(1)} 
              icon={Home} 
              label="HOME" 
              main
            />
            
            <NavButton 
              active={activePage === 2} 
              onClick={() => setActivePage(2)} 
              icon={BarChart2} 
              label="STATS" 
            />
         </div>
      </footer>

      {/* --- MODALS --- */}
      {selectedDeviceId && selectedDevice && (
        <DeviceModal 
          device={selectedDevice}
          onClose={() => setSelectedDeviceId(null)}
          onToggle={onToggleDevice}
          onUpdate={onUpdateDeviceParams}
        />
      )}

      {/* --- NEW: TIMER MODAL --- */}
      {timerDeviceId && timerDevice && (
          <TimerModal 
            device={timerDevice}
            onClose={() => setTimerDeviceId(null)}
            onSetTimer={(timer) => onSetDeviceTimer(timerDeviceId, timer)}
          />
      )}

      {showSettings && (
        <SettingsModal
          scenes={scenes}
          devices={devices} 
          onClose={() => setShowSettings(false)}
          onAddScene={onAddScene}
          onUpdateScene={onUpdateScene}
          onDeleteScene={onDeleteScene}
          onUpdateDeviceHabits={onUpdateDeviceHabits} // --- HANDLER WIRED
        />
      )}
      
      {/* --- SCENE ACTIVATION OVERLAY (V2.0 - HOLOGRAPHIC) --- */}
      {activatingScene && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050508]/90 backdrop-blur-xl animate-in fade-in duration-300">
             
             {/* 1. Background Pulse */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--scene-color-alpha),transparent_70%)] opacity-20"
                  style={{ '--scene-color-alpha': `${activatingScene.color}40` } as any}></div>
             
             <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg">
                 
                 {/* 2. Central Hologram Ring Structure */}
                 <div className="relative w-64 h-64 flex items-center justify-center mb-10">
                    {/* Outer Static Ring with Ticks */}
                    <div className="absolute inset-0 rounded-full border border-white/10"></div>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="absolute w-full h-[1px] bg-white/10" style={{ transform: `rotate(${i * 45}deg)` }}></div>
                    ))}

                    {/* Rotating Dashed Ring 1 */}
                    <div className="absolute inset-4 rounded-full border-2 border-dashed opacity-60 animate-[spin_10s_linear_infinite]"
                         style={{ borderColor: activatingScene.color }}></div>
                    
                    {/* Rotating Dashed Ring 2 (Counter) */}
                    <div className="absolute inset-8 rounded-full border border-t-transparent border-b-transparent opacity-80 animate-[spin_3s_linear_infinite_reverse]"
                         style={{ borderColor: activatingScene.color }}></div>

                    {/* Center Glow */}
                    <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl" style={{ backgroundColor: `${activatingScene.color}20` }}></div>
                    
                    {/* The Icon */}
                    <div className="relative z-10 w-24 h-24 rounded-full bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl animate-pulse">
                        <Zap size={48} style={{ color: activatingScene.color, filter: `drop-shadow(0 0 10px ${activatingScene.color})` }} />
                    </div>
                 </div>

                 {/* 3. Text & Decoding Effect */}
                 <div className="text-center space-y-4 relative z-20">
                     <div className="flex items-center justify-center gap-2 text-xs font-mono tracking-[0.5em] text-gray-500 uppercase">
                        <Activity size={12} className="animate-bounce" />
                        <span>System Override</span>
                     </div>
                     
                     <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase drop-shadow-2xl glitch-text" 
                         data-text={activatingScene.name}
                         dir="auto"
                     >
                         {activatingScene.name}
                     </h2>

                     {/* Fake Terminal Output */}
                     <div className="mt-8 flex flex-col items-start gap-1 p-4 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] w-64 mx-auto text-left text-gray-400 shadow-inner">
                        <div className="flex gap-2 items-center text-white/50 border-b border-white/5 w-full pb-1 mb-1">
                            <Terminal size={10} />
                            <span>EXEC_LOG.log</span>
                        </div>
                        <p>> INIT_SEQUENCE: <span style={{ color: activatingScene.color }}>{activatingScene.id.toUpperCase()}</span></p>
                        <p className="animate-pulse">> BROADCASTING_MQTT...</p>
                        <p className="delay-150 animate-in fade-in fill-mode-forwards">> UPDATING_TARGETS...</p>
                        <p className="delay-300 animate-in fade-in fill-mode-forwards text-green-400">> SUCCESS_ACK_RECEIVED</p>
                     </div>
                 </div>

                 {/* 4. Bottom Loading Bar */}
                 <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-1 bg-gray-900 rounded-full overflow-hidden">
                     <div className="h-full animate-[width_1.8s_ease-out_forwards]" 
                          style={{ backgroundColor: activatingScene.color, width: '0%', boxShadow: `0 0 10px ${activatingScene.color}` }}></div>
                 </div>

             </div>
          </div>
      )}

    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label, main = false }: any) => (
  <button 
    onClick={onClick}
    className={`
      relative group flex flex-col items-center justify-center gap-1 transition-all duration-300
      ${active ? '-translate-y-2' : 'opacity-60 hover:opacity-100 hover:-translate-y-1'}
    `}
  >
     {/* Active Glow Floor */}
     {active && (
        <div className="absolute -bottom-6 w-8 md:w-12 h-1 bg-cyan-500 rounded-full blur-sm shadow-[0_0_10px_#00FFFF]"></div>
     )}

     <div className={`
       relative z-10 flex items-center justify-center transition-all duration-300
       ${main 
          ? (active 
              ? 'w-14 h-14 md:w-16 md:h-16 bg-cyan-500 text-black shadow-[0_0_30px_rgba(6,182,212,0.6)]' 
              : 'w-14 h-14 md:w-16 md:h-16 bg-gray-800/80 text-gray-400 border border-white/10') 
          : (active ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-gray-400')}
       ${main ? 'rounded-2xl rotate-45 group-hover:rotate-0' : ''}
     `}>
        <Icon size={main ? 28 : 26} strokeWidth={main ? 2 : 1.5} className={main ? "-rotate-45 group-hover:rotate-0 transition-transform" : ""} />
     </div>
     
     <span className={`hidden md:block text-[9px] font-bold tracking-[0.2em] ${active ? 'text-cyan-400' : 'text-gray-500'}`}>
       {label}
     </span>
  </button>
);

export default NexusSimulator;