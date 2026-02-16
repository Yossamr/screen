import React from 'react';
import { Device } from '../types';
import { X, Minimize2 } from 'lucide-react';
import ACRemote from './ACRemote';
import SimpleRemote from './SimpleRemote';

interface DeviceModalProps {
  device: Device;
  onClose: () => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, params: any) => void;
}

const DeviceModal: React.FC<DeviceModalProps> = ({ device, onClose, onToggle, onUpdate }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      {/* HUD Container */}
      <div 
        className="relative w-full max-w-sm md:max-w-md lg:max-w-lg bg-[#0a0a0f]/90 rounded-[2.5rem] overflow-hidden border border-cyan-500/20 shadow-[0_0_80px_rgba(6,182,212,0.15)] transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '85vh' }}
      >
        {/* Cinematic Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 relative overflow-hidden">
           {/* Scanline effect on header */}
           <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(6,182,212,0.1)_50%,transparent_100%)] w-full h-full animate-[shimmer_3s_infinite]"></div>
           
           <div className="flex flex-col z-10">
             <h3 className="text-white font-bold tracking-[0.2em] uppercase text-lg drop-shadow-md">{device.name}</h3>
             <span className="text-[10px] text-cyan-400 font-mono tracking-widest">{device.type.toUpperCase()}_CONTROLLER_V2</span>
           </div>

           <button 
             onClick={onClose}
             className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all active:scale-90 z-10"
           >
             <X size={20} />
           </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
           {/* Background Grid Texture */}
           <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#06b6d4 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
           </div>

           <div className="p-6 h-full">
             {device.type === 'ac' ? (
               <ACRemote 
                 device={device} 
                 onToggle={() => onToggle(device.id)} 
                 onUpdate={(params) => onUpdate(device.id, params)} 
               />
             ) : (
               <SimpleRemote 
                 device={device} 
                 onToggle={() => onToggle(device.id)}
                 onUpdate={(params) => onUpdate(device.id, params)}
               />
             )}
           </div>
        </div>

        {/* Footer info */}
        <div className="bg-[#050505] p-4 text-center border-t border-white/5 flex justify-between items-center px-8">
           <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${device.isOn ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-red-500'}`}></div>
              <p className="text-[10px] text-gray-500 font-mono">STATUS: {device.isOn ? 'ONLINE' : 'SUSPENDED'}</p>
           </div>
           <p className="text-[10px] text-gray-700 font-mono">ID: {device.id}</p>
        </div>
      </div>
    </div>
  );
};

export default DeviceModal;
