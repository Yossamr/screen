import React, { useState, useEffect } from 'react';
import { Scene, Device, SceneTarget, Habit } from '../types';
import { X, Trash2, Edit2, Plus, Check, MonitorSmartphone, Settings as SettingsIcon, ArrowLeft, Power, MinusCircle, CheckCircle, XCircle, Calendar, Repeat, Cpu, Activity, Zap, Volume2, Layers, RefreshCw, AlertTriangle, Globe } from 'lucide-react';

interface SettingsModalProps {
  scenes: Scene[];
  devices: Device[]; // Need devices list to configure scenes
  onClose: () => void;
  onAddScene: (name: string, color: string) => void;
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
  onDeleteScene: (id: string) => void;
  // New props for Habits
  onUpdateDeviceHabits?: (id: string, habits: Habit[]) => void;
}

const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
];

const DAYS_MAP = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const SettingsModal: React.FC<SettingsModalProps> = ({ scenes, devices, onClose, onAddScene, onUpdateScene, onDeleteScene, onUpdateDeviceHabits }) => {
  const [activeTab, setActiveTab] = useState<'scenes' | 'habits' | 'system'>('scenes');
  
  // Scene Name/Color Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  
  // Create New Scene
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#06b6d4');

  // Deep Configuration (Device Toggles)
  const [configuringSceneId, setConfiguringSceneId] = useState<string | null>(null);
  const [tempTargets, setTempTargets] = useState<Record<string, SceneTarget>>({});

  // -- HABIT STATE --
  const [selectedDeviceForHabit, setSelectedDeviceForHabit] = useState<string | null>(null);
  const [tempHabits, setTempHabits] = useState<Habit[]>([]);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabit, setNewHabit] = useState<Partial<Habit>>({ days: [0,1,2,3,4,5,6], time: '09:00', action: 'ON', enabled: true });

  // -- SYSTEM SETTINGS STATE --
  const [sysVoice, setSysVoice] = useState(true);
  const [sysAnim, setSysAnim] = useState(true);
  const [isRebooting, setIsRebooting] = useState(false);
  const [sysUptime, setSysUptime] = useState(14500); // Dummy seconds

  useEffect(() => {
    // Simulate Uptime tick
    const interval = setInterval(() => setSysUptime(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      return `${h}h ${m}m`;
  };

  const handleReboot = () => {
      setIsRebooting(true);
      setTimeout(() => {
          setIsRebooting(false);
          // In a real app, this would trigger a reload
      }, 3000);
  };


  // -- HANDLERS FOR BASIC EDIT --
  const startEdit = (scene: Scene) => {
    setEditingId(scene.id);
    setEditName(scene.name);
    setEditColor(scene.color);
    setIsCreating(false);
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdateScene(editingId, { name: editName, color: editColor });
      setEditingId(null);
    }
  };

  // -- HANDLERS FOR CREATION --
  const createScene = () => {
    if (newName.trim()) {
      onAddScene(newName, newColor);
      setIsCreating(false);
      setNewName('');
    }
  };

  // -- HANDLERS FOR DEEP CONFIGURATION --
  const openDeviceConfig = (scene: Scene) => {
      setConfiguringSceneId(scene.id);
      // Initialize temp targets with current scene targets, or defaults
      setTempTargets(scene.targets || {});
  };

  const setDeviceState = (deviceId: string, state: 'ON' | 'OFF' | 'IGNORE') => {
      setTempTargets(prev => {
          const next = { ...prev };
          
          if (state === 'IGNORE') {
              // Remove from targets map completely
              delete next[deviceId];
          } else {
              // Add/Update in targets map
              next[deviceId] = {
                  ...prev[deviceId],
                  isOn: state === 'ON'
              };
          }
          return next;
      });
  };

  const saveDeviceConfig = () => {
      if (configuringSceneId) {
          onUpdateScene(configuringSceneId, { targets: tempTargets });
          setConfiguringSceneId(null);
      }
  };

  // -- HANDLERS FOR HABITS --
  const openHabitsForDevice = (device: Device) => {
      setSelectedDeviceForHabit(device.id);
      setTempHabits(device.habits || []);
      setIsAddingHabit(false);
  };

  const saveHabit = () => {
      if (!selectedDeviceForHabit || !onUpdateDeviceHabits) return;
      
      const habitToAdd: Habit = {
          id: `h_${Date.now()}`,
          enabled: true,
          days: newHabit.days || [],
          time: newHabit.time || '00:00',
          action: newHabit.action || 'ON'
      };

      const updatedList = [...tempHabits, habitToAdd];
      setTempHabits(updatedList);
      onUpdateDeviceHabits(selectedDeviceForHabit, updatedList);
      setIsAddingHabit(false);
  };

  const deleteHabit = (hId: string) => {
      if (!selectedDeviceForHabit || !onUpdateDeviceHabits) return;
      const updatedList = tempHabits.filter(h => h.id !== hId);
      setTempHabits(updatedList);
      onUpdateDeviceHabits(selectedDeviceForHabit, updatedList);
  };
  
  const toggleHabitDay = (dayIndex: number) => {
      const currentDays = newHabit.days || [];
      if (currentDays.includes(dayIndex)) {
          setNewHabit({ ...newHabit, days: currentDays.filter(d => d !== dayIndex) });
      } else {
          setNewHabit({ ...newHabit, days: [...currentDays, dayIndex].sort() });
      }
  };

  const configuringScene = scenes.find(s => s.id === configuringSceneId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-2xl bg-[#0a0a0f] rounded-[2rem] overflow-hidden border border-cyan-500/20 shadow-[0_0_100px_rgba(6,182,212,0.1)] flex flex-col h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-cyan-900/20 to-transparent border-b border-white/10">
           <div className="flex items-center gap-3">
              {configuringSceneId || selectedDeviceForHabit ? (
                 <button onClick={() => { setConfiguringSceneId(null); setSelectedDeviceForHabit(null); }} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                     <ArrowLeft size={20} className="text-cyan-400" />
                 </button>
              ) : (
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
                    <MonitorSmartphone size={24} />
                </div>
              )}
              
              <div>
                <h2 className="text-xl font-bold tracking-[0.2em] text-white">
                    {configuringSceneId ? `CONFIG: ${configuringScene?.name}` : selectedDeviceForHabit ? 'DEVICE HABITS' : 'SYSTEM CONFIG'}
                </h2>
                <p className="text-[10px] text-gray-500 font-mono tracking-widest">
                    {configuringSceneId ? 'SELECT_ACTIVE_DEVICES' : selectedDeviceForHabit ? 'AUTOMATION_ROUTINES' : ''}
                </p>
              </div>
           </div>
           <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X size={24} />
           </button>
        </div>

        {/* TABS (Only show if not configuring specific item) */}
        {!configuringSceneId && !selectedDeviceForHabit && (
            <div className="flex border-b border-white/5 px-8">
                <button 
                className={`py-4 px-4 text-xs font-bold tracking-[0.2em] border-b-2 transition-colors ${activeTab === 'scenes' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-600 hover:text-white'}`}
                onClick={() => setActiveTab('scenes')}
                >
                SCENE EDITOR
                </button>
                <button 
                className={`py-4 px-4 text-xs font-bold tracking-[0.2em] border-b-2 transition-colors ${activeTab === 'habits' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-600 hover:text-white'}`}
                onClick={() => setActiveTab('habits')}
                >
                HABITS
                </button>
                <button 
                className={`py-4 px-4 text-xs font-bold tracking-[0.2em] border-b-2 transition-colors ${activeTab === 'system' ? 'border-gray-500 text-gray-400' : 'border-transparent text-gray-600 hover:text-white'}`}
                onClick={() => setActiveTab('system')}
                >
                SYSTEM
                </button>
            </div>
        )}

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
           {/* Background Grid */}
           <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>

           {/* --- SCENE CONTENT --- */}
           {configuringSceneId ? (
               // ... existing Device Configuration View ...
               <div className="space-y-4 relative z-10 animate-in slide-in-from-right-4">
                  {/* Reuse existing code for device config list */}
                  {/* ... (Code omitted for brevity, same as before) ... */}
                   <div className="flex items-center justify-between mb-2 px-2">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">Device List</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">Action</span>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-3">
                       {devices.map(device => {
                           const targetState = tempTargets[device.id];
                           let currentState: 'ON' | 'OFF' | 'IGNORE' = 'IGNORE';
                           if (targetState) {
                               currentState = targetState.isOn ? 'ON' : 'OFF';
                           }

                           return (
                               <div key={device.id} className={`border rounded-xl p-3 flex items-center justify-between transition-all duration-200 ${currentState !== 'IGNORE' ? 'bg-black/60 border-white/20' : 'bg-black/20 border-white/5 opacity-70'}`}>
                                   <div className="flex items-center gap-3">
                                       <div className={`p-2 rounded-lg transition-colors ${currentState === 'ON' ? 'bg-cyan-500 text-black' : (currentState === 'OFF' ? 'bg-red-900/50 text-red-500' : 'bg-gray-800 text-gray-600')}`}>
                                            <Power size={18} />
                                       </div>
                                       <div>
                                           <h4 className={`text-sm font-bold ${currentState !== 'IGNORE' ? 'text-white' : 'text-gray-500'}`} dir="rtl">{device.name}</h4>
                                       </div>
                                   </div>
                                   <div className="flex items-center bg-black border border-white/10 rounded-lg p-1 gap-1">
                                       <button onClick={() => setDeviceState(device.id, 'ON')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${currentState === 'ON' ? 'bg-cyan-500 text-black' : 'text-gray-500 hover:text-cyan-400'}`}><CheckCircle size={10} /> ON</button>
                                       <button onClick={() => setDeviceState(device.id, 'IGNORE')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${currentState === 'IGNORE' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}><MinusCircle size={10} /> IGNORE</button>
                                       <button onClick={() => setDeviceState(device.id, 'OFF')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${currentState === 'OFF' ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-red-400'}`}><XCircle size={10} /> OFF</button>
                                   </div>
                               </div>
                           );
                       })}
                   </div>
                   <div className="pt-4 mt-4 border-t border-white/10 sticky bottom-0 bg-[#0a0a0f]/95 backdrop-blur pb-2">
                       <button onClick={saveDeviceConfig} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95"><Check size={18} /> Save Configuration</button>
                   </div>
               </div>
           ) : selectedDeviceForHabit ? (
               // --- SPECIFIC DEVICE HABIT LIST ---
               <div className="relative z-10 space-y-6 animate-in slide-in-from-right-4">
                  {!isAddingHabit ? (
                      <>
                        <button 
                            onClick={() => setIsAddingHabit(true)}
                            className="w-full py-4 border border-dashed border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2 group"
                        >
                            <Plus size={20} />
                            <span className="text-xs font-bold tracking-widest uppercase">Create New Routine</span>
                        </button>

                        <div className="space-y-3">
                            {tempHabits.length === 0 && <p className="text-center text-gray-500 text-xs mt-4">No routines set for this device.</p>}
                            {tempHabits.map(habit => (
                                <div key={habit.id} className="bg-[#15151f] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex gap-4 items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${habit.action === 'ON' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                                            {habit.action}
                                        </div>
                                        <div>
                                            <div className="text-white font-mono text-xl font-bold">{habit.time}</div>
                                            <div className="flex gap-1 mt-1">
                                                {DAYS_MAP.map((d, i) => (
                                                    <span key={i} className={`text-[9px] w-4 h-4 rounded flex items-center justify-center ${habit.days.includes(i) ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-600'}`}>
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteHabit(habit.id)} className="p-2 text-gray-500 hover:text-red-400"><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                      </>
                  ) : (
                      // ADD HABIT FORM
                      <div className="bg-[#15151f] border border-purple-500/30 rounded-xl p-6">
                          <h4 className="text-purple-400 font-bold tracking-widest uppercase mb-4 text-xs">Configure Routine</h4>
                          
                          <div className="space-y-6">
                              <div>
                                  <label className="block text-[10px] text-gray-500 uppercase mb-2">Time of Day</label>
                                  <input 
                                    type="time" 
                                    value={newHabit.time}
                                    onChange={(e) => setNewHabit({...newHabit, time: e.target.value})}
                                    className="w-full bg-black border border-white/20 rounded-lg p-3 text-white text-xl font-mono text-center outline-none focus:border-purple-500"
                                  />
                              </div>

                              <div>
                                  <label className="block text-[10px] text-gray-500 uppercase mb-2">Days Active</label>
                                  <div className="flex justify-between">
                                      {DAYS_MAP.map((d, i) => (
                                          <button 
                                            key={i}
                                            onClick={() => toggleHabitDay(i)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${newHabit.days?.includes(i) ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                                          >
                                              {d}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-[10px] text-gray-500 uppercase mb-2">Action</label>
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => setNewHabit({...newHabit, action: 'ON'})}
                                        className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase border transition-all ${newHabit.action === 'ON' ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/10 text-gray-500'}`}
                                      >Turn On</button>
                                      <button 
                                        onClick={() => setNewHabit({...newHabit, action: 'OFF'})}
                                        className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase border transition-all ${newHabit.action === 'OFF' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-white/10 text-gray-500'}`}
                                      >Turn Off</button>
                                  </div>
                              </div>

                              <div className="flex gap-2 pt-4">
                                  <button onClick={() => setIsAddingHabit(false)} className="flex-1 py-3 text-gray-400 text-xs font-bold hover:bg-white/5 rounded-lg">CANCEL</button>
                                  <button onClick={saveHabit} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold tracking-widest shadow-[0_0_15px_rgba(147,51,234,0.4)]">SAVE ROUTINE</button>
                              </div>
                          </div>
                      </div>
                  )}
               </div>
           ) : (
               // --- MAIN TABS ---
               <>
                 {activeTab === 'scenes' && (
                    <div className="space-y-6 relative z-10">
                        {/* Reuse Existing Scene List logic */}
                        {/* CREATE NEW BUTTON */}
                        {!isCreating ? (
                        <button onClick={() => setIsCreating(true)} className="w-full py-4 border border-dashed border-gray-700 rounded-xl text-gray-500 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-2 group"><Plus size={20} className="group-hover:rotate-90 transition-transform" /><span className="text-xs font-bold tracking-widest uppercase">Capture Current State as New Scene</span></button>
                        ) : (
                        <div className="bg-white/5 border border-cyan-500/30 rounded-xl p-4 animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-4"><span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">New Scene Details</span><button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-red-400"><X size={16}/></button></div>
                            <div className="grid gap-4"><input type="text" placeholder="Scene Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-cyan-500 focus:outline-none" dir="auto" /><div className="flex gap-2 flex-wrap">{COLORS.map(c => (<button key={c} onClick={() => setNewColor(c)} className={`w-8 h-8 rounded-full border-2 transition-transform ${newColor === c ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`} style={{ backgroundColor: c }} />))}</div><button onClick={createScene} disabled={!newName.trim()} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg text-xs tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Save Scene</button></div>
                        </div>
                        )}
                        <div className="space-y-3">
                        {scenes.map(scene => (
                            <div key={scene.id} className="bg-[#111] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/20 transition-colors">
                                {editingId === scene.id ? (
                                    <div className="flex-1 flex gap-4 items-center animate-in fade-in"><input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 bg-black/50 border border-white/20 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" /><div className="flex gap-1">{COLORS.slice(0, 5).map(c => (<button key={c} onClick={() => setEditColor(c)} className={`w-4 h-4 rounded-full ${editColor === c ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: c }} />))}</div><button onClick={saveEdit} className="p-2 bg-green-900/50 text-green-400 rounded hover:bg-green-900"><Check size={16}/></button></div>
                                ) : (
                                    <>
                                    <button onClick={() => openDeviceConfig(scene)} className="flex items-center gap-4 flex-1 text-left group-hover:bg-white/5 p-2 -m-2 rounded-lg transition-colors">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/10 shrink-0" style={{ backgroundColor: `${scene.color}20`, color: scene.color }}><div className="w-3 h-3 rounded-full" style={{ backgroundColor: scene.color }}></div></div>
                                        <div><h3 className="text-white font-bold text-sm" dir="rtl">{scene.name}</h3><p className="text-[10px] text-gray-600 uppercase tracking-wider flex items-center gap-1">{Object.keys(scene.targets || {}).length} Targets <SettingsIcon size={10} /></p></div>
                                    </button>
                                    <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity"><button onClick={() => startEdit(scene)} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white"><Edit2 size={16}/></button><button onClick={() => onDeleteScene(scene.id)} className="p-2 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400"><Trash2 size={16}/></button></div>
                                    </>
                                )}
                            </div>
                        ))}
                        </div>
                    </div>
                 )}

                 {activeTab === 'habits' && (
                     <div className="space-y-3 relative z-10 animate-in slide-in-from-right-2">
                         <div className="mb-4 text-center">
                             <p className="text-[10px] text-gray-500 uppercase tracking-widest">Select a device to configure routines</p>
                         </div>
                         {devices.map(device => (
                             <button 
                                key={device.id}
                                onClick={() => openHabitsForDevice(device)}
                                className="w-full bg-[#111] border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/5 rounded-xl p-4 flex items-center justify-between group transition-all"
                             >
                                 <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-purple-400 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all">
                                         {device.type === 'ac' ? <SettingsIcon size={20} /> : <Power size={20} />}
                                     </div>
                                     <div className="text-left">
                                         <h3 className="text-white font-bold text-sm" dir="rtl">{device.name}</h3>
                                         <p className="text-[10px] text-gray-600 uppercase tracking-wider flex items-center gap-1">
                                             {device.habits?.length || 0} Active Routines
                                         </p>
                                     </div>
                                 </div>
                                 <Repeat size={16} className="text-gray-600 group-hover:text-purple-400" />
                             </button>
                         ))}
                     </div>
                 )}

                 {activeTab === 'system' && (
                     <div className="space-y-6 relative z-10 animate-in slide-in-from-right-2">
                        
                        {/* 1. CORE METRICS */}
                        <div className="grid grid-cols-3 gap-3">
                           <div className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
                              <Cpu size={16} className="text-cyan-500 mx-auto mb-2" />
                              <div className="text-xs font-bold text-white">42%</div>
                              <div className="text-[9px] text-gray-500 mt-1">CPU LOAD</div>
                           </div>
                           <div className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
                              <Zap size={16} className="text-amber-500 mx-auto mb-2" />
                              <div className="text-xs font-bold text-white">2.4W</div>
                              <div className="text-[9px] text-gray-500 mt-1">IDLE PWR</div>
                           </div>
                           <div className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
                              <Activity size={16} className="text-green-500 mx-auto mb-2" />
                              <div className="text-xs font-bold text-white font-mono">{formatUptime(sysUptime)}</div>
                              <div className="text-[9px] text-gray-500 mt-1">UPTIME</div>
                           </div>
                        </div>

                        {/* 2. PREFERENCES */}
                        <div className="bg-[#111] border border-white/5 rounded-xl p-5">
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <SettingsIcon size={14} /> Global Preferences
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer" onClick={() => setSysVoice(!sysVoice)}>
                                    <div className="flex items-center gap-3">
                                        <Volume2 size={16} className={sysVoice ? "text-cyan-400" : "text-gray-600"} />
                                        <span className="text-sm font-bold text-white">Neural Voice Feedback</span>
                                    </div>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${sysVoice ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${sysVoice ? 'left-4.5' : 'left-0.5'}`} style={{ left: sysVoice ? '18px' : '2px' }}></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer" onClick={() => setSysAnim(!sysAnim)}>
                                    <div className="flex items-center gap-3">
                                        <Layers size={16} className={sysAnim ? "text-purple-400" : "text-gray-600"} />
                                        <span className="text-sm font-bold text-white">Holographic FX</span>
                                    </div>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${sysAnim ? 'bg-purple-500' : 'bg-gray-700'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all`} style={{ left: sysAnim ? '18px' : '2px' }}></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <Globe size={16} className="text-gray-400" />
                                        <span className="text-sm font-bold text-white">Interface Language</span>
                                    </div>
                                    <span className="text-[10px] bg-black/50 border border-white/10 px-2 py-1 rounded text-gray-400">EN / AR</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. DANGER ZONE */}
                        <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-5">
                            <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <AlertTriangle size={14} /> Core Maintenance
                            </h4>
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleReboot}
                                    disabled={isRebooting}
                                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg py-3 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isRebooting ? <RefreshCw size={16} className="animate-spin" /> : <Power size={16} />}
                                    <span className="text-xs font-bold">{isRebooting ? 'REBOOTING...' : 'REBOOT CORE'}</span>
                                </button>
                                <button className="flex-1 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 rounded-lg py-3 flex items-center justify-center gap-2 transition-all">
                                    <Trash2 size={16} />
                                    <span className="text-xs font-bold">CLEAR CACHE</span>
                                </button>
                            </div>
                        </div>

                     </div>
                 )}
               </>
           )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;