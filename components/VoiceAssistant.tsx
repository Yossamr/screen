import React, { useEffect, useState, useRef } from 'react';
import { Device, Scene } from '../types';
import { Mic, MicOff, Sparkles, Save } from 'lucide-react';

interface VoiceAssistantProps {
  devices: Device[];
  scenes: Scene[];
  onToggleDevice: (id: string) => void;
  onApplyScene: (id: string) => void;
  onUpdateDeviceParams: (id: string, params: any) => void;
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

// Persist custom aliases in LocalStorage
const STORAGE_KEY = 'nexus_voice_aliases';

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  devices, 
  scenes, 
  onToggleDevice, 
  onApplyScene, 
  onUpdateDeviceParams 
}) => {
  // State
  const [isListening, setIsListening] = useState(false);
  const [isAwake, setIsAwake] = useState(false); // True when "Nexus" is heard
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [aliases, setAliases] = useState<Record<string, string>>({});
  
  const recognitionRef = useRef<any>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load aliases on mount
  useEffect(() => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) setAliases(JSON.parse(stored));
      } catch(e) {}
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; 
      recognition.interimResults = true; // We need interim to catch "Nexus" fast
      recognition.lang = 'ar-EG'; // Arabic engine handles mixed English well

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        // Auto-restart to simulate "Always On"
        // Note: User must interact with page first for this to work indefinitely
        if (isListening) {
           try { recognition.start(); } catch(e) {}
        }
      };

      recognition.onresult = (event: any) => {
        const resultsLength = event.results.length;
        const latestResult = event.results[resultsLength - 1];
        const text = latestResult[0].transcript.trim();
        const isFinal = latestResult.isFinal;

        handleSpeechInput(text, isFinal);
      };

      recognitionRef.current = recognition;
    }
  }, [devices, scenes, aliases, isAwake]); // Dependencies updated to include aliases

  // 1. Core Logic: Wake Word & Command Parsing
  const handleSpeechInput = (text: string, isFinal: boolean) => {
      const lowerText = text.toLowerCase();
      
      // WAKE WORD DETECTION
      // We look for "Nexus" or Arabic variants
      const wakeWords = ['nexus', 'نكسس', 'نكزس', 'يا نكسس', 'يا نكزس', 'he nexus', 'hey nexus'];
      const detectedWakeWord = wakeWords.find(w => lowerText.includes(w));

      if (detectedWakeWord) {
          if (!isAwake) {
              setIsAwake(true); // ACTIVATE GLOW
              // Optional: Play a sound here
          }
          
          // Reset silence timer since we heard something
          if (silenceTimer.current) clearTimeout(silenceTimer.current);
          silenceTimer.current = setTimeout(() => {
              setIsAwake(false); // Go back to sleep after 5s of silence
              setTranscript('');
              setFeedback('');
          }, 5000);
      }

      if (isAwake) {
          // If awake, show what user is saying
          // Strip the wake word for cleaner UI
          let cleanTranscript = lowerText;
          wakeWords.forEach(w => cleanTranscript = cleanTranscript.replace(w, ''));
          setTranscript(cleanTranscript.trim());

          // Only execute logic if the sentence is "Final" (user paused)
          if (isFinal) {
              processCommand(cleanTranscript.trim());
          }
      }
  };

  // 2. Command Processor
  const processCommand = (command: string) => {
    if (!command) return;

    let actionExecuted = false;
    let responseMsg = '';

    // Normalize text (unify Alef, Ha, Ya)
    const normalizedCmd = command.replace(/[أإآ]/g, 'ا').replace(/[ى]/g, 'ي').replace(/[ة]/g, 'ه');

    // --- A. CHECK CUSTOM ALIASES (Saved Commands) ---
    // Example: User defined "bed time" -> maps to "s_sleep"
    Object.entries(aliases).forEach(([alias, targetId]) => {
        if (normalizedCmd.includes(alias.toLowerCase())) {
            // Check if target is scene
            const scene = scenes.find(s => s.id === targetId);
            if (scene) {
                onApplyScene(scene.id);
                responseMsg = `Executing Custom: ${alias}`;
                actionExecuted = true;
            } else {
                // Check if target is device
                const device = devices.find(d => d.id === targetId);
                if (device) {
                   onToggleDevice(device.id);
                   responseMsg = `Toggling ${alias}`;
                   actionExecuted = true;
                }
            }
        }
    });

    // --- B. "LEARN" COMMAND (Define Alias) ---
    // Syntax: "Nexus define [phrase] as [existing scene/device name]"
    // Arabic: "Nexus احفظ [جملة] ك [اسم المشهد]"
    if (!actionExecuted && (normalizedCmd.includes('define') || normalizedCmd.includes('احفظ') || normalizedCmd.includes('سمي'))) {
        const splitWord = normalizedCmd.includes(' as ') ? ' as ' : (normalizedCmd.includes(' ك ') ? ' ك ' : null);
        
        if (splitWord) {
            const parts = normalizedCmd.split(splitWord);
            if (parts.length === 2) {
                // Part 1: New Alias (remove "define")
                let newAlias = parts[0].replace('define', '').replace('احفظ', '').replace('سمي', '').trim();
                const targetName = parts[1].trim();

                // Find target ID
                const targetScene = scenes.find(s => s.name.toLowerCase().includes(targetName) || targetName.includes(s.name.toLowerCase()));
                const targetDevice = devices.find(d => d.name.toLowerCase().includes(targetName) || targetName.includes(d.name.toLowerCase()));
                
                if (targetScene || targetDevice) {
                    const id = targetScene ? targetScene.id : targetDevice!.id;
                    
                    // Save to State & LocalStorage
                    const newAliases = { ...aliases, [newAlias]: id };
                    setAliases(newAliases);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAliases));
                    
                    responseMsg = `Learned: "${newAlias}" -> ${targetScene?.name || targetDevice?.name}`;
                    actionExecuted = true;
                } else {
                    responseMsg = "Couldn't find that scene or device to learn.";
                }
            }
        }
    }

    // --- C. NATIVE SCENE COMMANDS ---
    if (!actionExecuted) {
        const sceneMatch = scenes.find(s => normalizedCmd.includes(s.name.replace(/[أإآ]/g, 'ا').replace(/[ى]/g, 'ي').replace(/[ة]/g, 'ه')));
        // Keywords: Mode, Scene, Activate, Turn on, شغل, وضع, مود
        const isSceneTrigger = ['mode', 'scene', 'activate', 'run', 'شغل', 'فعل', 'وضع', 'مود'].some(w => normalizedCmd.includes(w));
        
        if (sceneMatch && (isSceneTrigger || normalizedCmd.includes(sceneMatch.name))) { // Relaxed check
            onApplyScene(sceneMatch.id);
            responseMsg = `Activating ${sceneMatch.name}`;
            actionExecuted = true;
        }
    }

    // --- D. NATIVE DEVICE COMMANDS ---
    if (!actionExecuted) {
        // Find mentioned device (Fuzzy match)
        const deviceMatch = devices.find(d => normalizedCmd.includes(d.name.replace(/[أإآ]/g, 'ا').replace(/[ى]/g, 'ي').replace(/[ة]/g, 'ه')));
        
        if (deviceMatch) {
            // Action: ON
            if (['on', 'start', 'open', 'شغل', 'افتح', 'نور', 'دور'].some(w => normalizedCmd.includes(w))) {
                if (!deviceMatch.isOn) onToggleDevice(deviceMatch.id);
                responseMsg = `ON: ${deviceMatch.name}`;
                actionExecuted = true;
            }
            // Action: OFF
            else if (['off', 'stop', 'close', 'shutdown', 'اطفي', 'اقفل', 'بطل', 'وقف'].some(w => normalizedCmd.includes(w))) {
                if (deviceMatch.isOn) onToggleDevice(deviceMatch.id);
                responseMsg = `OFF: ${deviceMatch.name}`;
                actionExecuted = true;
            }
            // Action: Temperature
            else if (deviceMatch.type === 'ac') {
                const numbers = normalizedCmd.match(/\d+/);
                if (numbers) {
                    const temp = parseInt(numbers[0]);
                    if (temp >= 16 && temp <= 30) {
                        onUpdateDeviceParams(deviceMatch.id, { temperature: temp });
                        if (!deviceMatch.isOn) onToggleDevice(deviceMatch.id);
                        responseMsg = `${deviceMatch.name} set to ${temp}°C`;
                        actionExecuted = true;
                    }
                }
            }
        }
    }
    
    // --- E. SPECIAL COMMANDS ---
    if (!actionExecuted) {
         if (normalizedCmd.includes('sleep') || normalizedCmd.includes('نوم') || normalizedCmd.includes('تصبح علي خير')) {
             const sleepScene = scenes.find(s => s.id.includes('sleep') || s.id.includes('bed'));
             if (sleepScene) {
                 onApplyScene(sleepScene.id);
                 responseMsg = "Good Night. System Sleeping.";
                 actionExecuted = true;
             }
         } else if (normalizedCmd.includes('status') || normalizedCmd.includes('حاله') || normalizedCmd.includes('تقرير')) {
              const activeCount = devices.filter(d => d.isOn).length;
              responseMsg = `System Nominal. ${activeCount} devices active.`;
              actionExecuted = true;
         }
    }

    // Feedback Logic
    if (actionExecuted) {
        setFeedback(responseMsg);
        // Green Flash
        setTimeout(() => {
            setIsAwake(false);
            setFeedback('');
            setTranscript('');
        }, 2500);
    } else {
        setFeedback("???");
        // Shake/Error effect could go here
    }
  };

  const toggleMic = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
          setIsAwake(false);
      } else {
          try {
             recognitionRef.current?.start();
             setIsListening(true);
          } catch(e) {}
      }
  };

  return (
    <>
        {/* 1. Toggle Button (Visible only when system is 'Off') */}
        {!isListening && (
            <button 
                onClick={toggleMic}
                className="fixed bottom-24 right-6 z-50 w-12 h-12 rounded-full bg-red-900/80 text-red-400 border border-red-500/30 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg backdrop-blur-md"
            >
                <MicOff size={20} />
            </button>
        )}

        {/* 2. THE ALEXA GLOW BAR (Bottom Overlay) */}
        {/* Only visible when listening */}
        <div className={`
            fixed bottom-0 left-0 w-full z-[100] pointer-events-none transition-all duration-700 ease-out flex flex-col items-center justify-end pb-8
            ${isListening ? 'opacity-100' : 'opacity-0'}
            ${isAwake ? 'h-[40vh] bg-gradient-to-t from-black via-black/80 to-transparent' : 'h-0'}
        `}>
            
            {/* Feedback Text Area */}
            <div className={`
                mb-8 text-center transition-all duration-500 transform
                ${isAwake ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
            `}>
                 {/* What Nexus Heard */}
                 {transcript && (
                     <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" dir="auto">
                         "{transcript}"
                     </h2>
                 )}
                 
                 {/* Nexus Response */}
                 {feedback && (
                     <div className="mt-2 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                         <Sparkles size={16} className="text-green-400" />
                         <p className="text-green-400 font-mono text-sm md:text-lg tracking-widest uppercase">{feedback}</p>
                     </div>
                 )}
                 
                 {/* Idle Hint */}
                 {!transcript && !feedback && isAwake && (
                     <p className="text-cyan-500/50 font-mono text-xs tracking-[0.5em] animate-pulse">LISTENING...</p>
                 )}
            </div>

            {/* The Light Bar Animation */}
            <div className={`
                w-full h-2 relative transition-all duration-500
                ${isAwake ? 'opacity-100 scale-100' : 'opacity-0 scale-y-0'}
            `}>
                {/* Core Beam */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white opacity-50 blur-[2px]"></div>
                
                {/* Cyan Glow (Moving Mesh) */}
                <div className="absolute bottom-[-20px] left-0 w-full h-[80px] bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 blur-[40px] opacity-80 animate-shine-flow"></div>
                
                {/* Secondary Pulse */}
                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-3/4 h-[40px] bg-cyan-400 blur-[60px] animate-pulse"></div>
            </div>

            {/* Always-on Bottom Line (When mic is active but not awake) */}
            {!isAwake && isListening && (
                 <div className="absolute bottom-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-900 to-transparent opacity-30"></div>
            )}
        </div>
    </>
  );
};

export default VoiceAssistant;