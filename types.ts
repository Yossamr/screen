import { LucideIcon } from "lucide-react";

export type DeviceType = 'light' | 'ac' | 'heater' | 'fan' | 'tv' | 'outlet' | 'fridge' | 'router' | 'washer';

// --- NEW: Automation Types ---
export interface TimerConfig {
  type: 'duration' | 'target'; // duration = "in 30 mins", target = "at 5:00 PM"
  targetTime: number;          // Timestamp when action triggers
  action: 'ON' | 'OFF';
}

export interface Habit {
  id: string;
  enabled: boolean;
  days: number[]; // 0=Sunday, 1=Monday... 6=Saturday
  time: string;   // "14:30" (24h format)
  action: 'ON' | 'OFF';
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  isOn: boolean;
  watts: number;
  extraData?: string; 
  
  // --- REAL TIME CONSUMPTION TRACKING ---
  lastStartTime?: number | null; 
  usageSeconds: number;          
  
  // --- NEW: Automation Data ---
  activeTimer?: TimerConfig | null;
  habits?: Habit[];

  params?: {
    temperature?: number;
    mode?: 'cool' | 'heat' | 'dry' | 'fan';
    fanSpeed?: 'low' | 'med' | 'high';
  };
}

export interface SceneTarget {
  isOn: boolean;
  params?: Device['params'];
}

export interface Scene {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
  targets: Record<string, SceneTarget>; 
}

export interface NexusSimulatorProps {
  devices: Device[];
  scenes: Scene[];
  wifiSsid: string;
  wifiIp: string;
  maxLoadWatts: number;
  isConnected: boolean;
  onToggleDevice: (id: string) => void;
  onUpdateDeviceParams: (id: string, params: Partial<Device['params']>) => void;
  
  // Automation Handlers
  onSetDeviceTimer: (id: string, timer: TimerConfig | null) => void;
  onUpdateDeviceHabits: (id: string, habits: Habit[]) => void;

  // Scene Management
  onApplyScene: (sceneId: string) => void;
  onAddScene: (name: string, color: string) => void;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onDeleteScene: (sceneId: string) => void;
}