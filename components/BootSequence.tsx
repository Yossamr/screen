import React, { useEffect, useState } from 'react';
import { Cpu, Wifi, Shield, Zap } from 'lucide-react';

interface BootSequenceProps {
  onComplete: () => void;
}

const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sequence = [
      "Initializing KERNEL...",
      "Loading NEXUS_CORE v21.0...",
      "Mounting File System... OK",
      "Checking Peripherals... OK",
      "Establishing Secure Link (MQTT)...",
      "Calibrating Touch Sensors...",
      "Optimizing Power Grid...",
      "SYSTEM READY."
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];
    let delay = 0;

    sequence.forEach((line, index) => {
      delay += Math.random() * 400 + 100;
      const t = setTimeout(() => {
        setLogs(prev => [...prev, line]);
        setProgress(((index + 1) / sequence.length) * 100);
      }, delay);
      timers.push(t);
    });

    const completionTimer = setTimeout(onComplete, delay + 800);
    timers.push(completionTimer);

    // Cleanup function to clear timeouts if component unmounts
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center font-mono text-cyan-500 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* Main Logo Loader */}
      <div className="relative mb-12">
         <div className="w-24 h-24 border-4 border-cyan-900 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-16 h-16 border-t-4 border-cyan-400 rounded-full animate-spin"></div>
         </div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold tracking-widest text-2xl animate-pulse">
            NX
         </div>
      </div>

      {/* Progress Bar */}
      <div className="w-64 h-1 bg-gray-900 rounded-full overflow-hidden mb-8 relative">
        <div 
          className="h-full bg-cyan-400 shadow-[0_0_15px_#00FFFF] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Log Console */}
      <div className="w-full max-w-md px-6 h-32 overflow-hidden flex flex-col justify-end">
        {logs.map((log, i) => (
          <div key={i} className="text-xs md:text-sm tracking-wide opacity-80 animate-pulse">
             <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
             {log.includes('OK') ? (
               <span>{log.split('OK')[0]} <span className="text-green-400 font-bold">OK</span></span>
             ) : (
               log
             )}
          </div>
        ))}
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-[10px] text-gray-600 tracking-[0.5em] uppercase">
         Quantum Embedded Systems
      </div>
    </div>
  );
};

export default BootSequence;