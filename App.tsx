import React, { useState, useCallback, useEffect, useRef } from 'react';
import NexusSimulator from './components/NexusSimulator';
import { Device, Scene, SceneTarget, TimerConfig, Habit } from './types';
import mqtt from 'mqtt';
import { createClient } from '@libsql/client';
import { MQTT_CONFIG, DB_CONFIG } from './constants';

// --- EXPANDED SEED DATA WITH REALISTIC USAGE STATS ---
const SEED_DEVICES: Device[] = [
  // --- Living Room ---
  { id: 'ac_master', name: 'تكييف المعيشة', type: 'ac', isOn: true, watts: 1200, extraData: '24°C', params: { temperature: 24, mode: 'cool', fanSpeed: 'low' }, lastStartTime: Date.now() - 3600000, usageSeconds: 45000 },
  { id: 'tv_living', name: 'شاشة LG الذكية', type: 'tv', isOn: false, watts: 150, extraData: 'HDMI1', lastStartTime: null, usageSeconds: 12000 },
  { id: 'light_main', name: 'نجفة الصالة', type: 'light', isOn: true, watts: 60, lastStartTime: Date.now() - 7200000, usageSeconds: 80000 },
  { id: 'sound_sys', name: 'ساوند سيستم Sony', type: 'outlet', isOn: false, watts: 80, lastStartTime: null, usageSeconds: 5000 },
  { id: 'router_main', name: 'راوتر فائق السرعة', type: 'router', isOn: true, watts: 15, lastStartTime: Date.now() - 86400000, usageSeconds: 2500000 },

  // --- Bedroom ---
  { id: 'ac_bed', name: 'تكييف النوم', type: 'ac', isOn: false, watts: 0, extraData: 'OFF', params: { temperature: 22, mode: 'cool', fanSpeed: 'med' }, lastStartTime: null, usageSeconds: 28000 },
  { id: 'light_bed_1', name: 'أباجورة يمين', type: 'light', isOn: false, watts: 9, lastStartTime: null, usageSeconds: 3000 },
  { id: 'light_bed_2', name: 'أباجورة يسار', type: 'light', isOn: false, watts: 9, lastStartTime: null, usageSeconds: 3200 },
  { id: 'curtain_master', name: 'ستائر ذكية', type: 'outlet', isOn: false, watts: 50, lastStartTime: null, usageSeconds: 100 },

  // --- Kitchen ---
  { id: 'fridge_1', name: 'ثلاجة شارب', type: 'fridge', isOn: true, watts: 250, lastStartTime: Date.now() - 90000000, usageSeconds: 2000000 },
  { id: 'coffee_maker', name: 'ماكينة القهوة', type: 'outlet', isOn: false, watts: 1400, lastStartTime: null, usageSeconds: 1800 },
  { id: 'microwave', name: 'ميكروويف', type: 'outlet', isOn: false, watts: 1200, lastStartTime: null, usageSeconds: 4500 },
  { id: 'light_kitchen', name: 'ليد المطبخ', type: 'light', isOn: true, watts: 30, lastStartTime: Date.now() - 1800000, usageSeconds: 50000 },
  { id: 'washer_1', name: 'غسالة ملابس', type: 'washer', isOn: false, watts: 2200, lastStartTime: null, usageSeconds: 14000 },

  // --- Office / Gaming ---
  { id: 'pc_gaming', name: 'PC Gaming Beast', type: 'outlet', isOn: true, watts: 650, lastStartTime: Date.now() - 10800000, usageSeconds: 75000 },
  { id: 'monitors', name: 'شاشات العمل', type: 'tv', isOn: true, watts: 120, extraData: 'DP', lastStartTime: Date.now() - 10800000, usageSeconds: 75000 },
  { id: 'fan_office', name: 'مروحة المكتب', type: 'fan', isOn: true, watts: 55, params: { fanSpeed: 'low' }, lastStartTime: Date.now() - 500000, usageSeconds: 30000 },
  { id: 'led_strip', name: 'إضاءة RGB', type: 'light', isOn: true, watts: 25, lastStartTime: Date.now() - 10800000, usageSeconds: 75000 },
  
  // --- Bathroom & Others ---
  { id: 'heater_1', name: 'سخان الحمام', type: 'heater', isOn: true, watts: 1500, lastStartTime: Date.now() - 1200000, usageSeconds: 90000 },
  { id: 'fan_bath', name: 'شفاط الحمام', type: 'fan', isOn: false, watts: 40, params: { fanSpeed: 'high' }, lastStartTime: null, usageSeconds: 1200 },
  { id: 'd5', name: 'فيشة الطرقة', type: 'outlet', isOn: false, watts: 0, lastStartTime: null, usageSeconds: 0 }, 
];

const SEED_SCENES: Scene[] = [
  { 
    id: 's_gaming', name: 'مود الجيمينج', color: '#a855f7', 
    targets: { 
      'pc_gaming': { isOn: true }, 'monitors': { isOn: true }, 'led_strip': { isOn: true }, 'light_main': { isOn: false }, 'ac_master': { isOn: true, params: { temperature: 22 } } 
    } 
  },
  { 
    id: 's_movie', name: 'سينما مود', color: '#ef4444', 
    targets: { 
      'tv_living': { isOn: true }, 'sound_sys': { isOn: true }, 'light_main': { isOn: false }, 'curtain_master': { isOn: false }, 'ac_master': { isOn: true, params: { fanSpeed: 'low' } } 
    } 
  },
  { 
    id: 's_sleep', name: 'وقت النوم', color: '#1e293b', 
    targets: { 
      'light_main': { isOn: false }, 'tv_living': { isOn: false }, 'pc_gaming': { isOn: false }, 'ac_bed': { isOn: true, params: { temperature: 24, mode: 'cool' } }, 'light_bed_1': { isOn: true }, 'light_bed_2': { isOn: true } 
    } 
  },
  { 
    id: 's_focus', name: 'تركيز وشغل', color: '#06b6d4', 
    targets: { 
      'tv_living': { isOn: false }, 'pc_gaming': { isOn: true }, 'monitors': { isOn: true }, 'fan_office': { isOn: true }, 'light_main': { isOn: true } 
    } 
  },
  { 
    id: 's_leave', name: 'خروج (إغلاق الكل)', color: '#f59e0b', 
    targets: { 
      'ac_master': { isOn: false }, 'tv_living': { isOn: false }, 'light_main': { isOn: false }, 'ac_bed': { isOn: false }, 'pc_gaming': { isOn: false }, 'heater_1': { isOn: false } 
    } 
  },
];

const App: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]); 
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  
  const mqttClient = useRef<mqtt.MqttClient | null>(null);
  const dbClient = useRef<ReturnType<typeof createClient> | null>(null);

  // Helper: Persist single device
  const persistDevice = async (device: Device) => {
    if (!dbClient.current) return;
    try {
      await dbClient.current.execute({
        sql: "INSERT INTO devices (id, json) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET json=excluded.json",
        args: [device.id, JSON.stringify(device)]
      });
    } catch (e) {}
  };

  // Helper: Persist single scene
  const persistScene = async (scene: Scene) => {
    if (!dbClient.current) return;
    try {
      await dbClient.current.execute({
        sql: "INSERT INTO scenes (id, json) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET json=excluded.json",
        args: [scene.id, JSON.stringify(scene)]
      });
    } catch (e) {}
  };

  const deleteSceneFromDb = async (id: string) => {
    if (!dbClient.current) return;
    try {
      await dbClient.current.execute({
        sql: "DELETE FROM scenes WHERE id = ?",
        args: [id]
      });
    } catch (e) {}
  };

  // Helper: Publish MQTT
  const publishCommand = (id: string, deviceState: Device) => {
    if (mqttClient.current && mqttClient.current.connected) {
      mqttClient.current.publish(`nexus/${id}/command`, JSON.stringify(deviceState), { qos: 1, retain: false });
      mqttClient.current.publish(`nexus/${id}/state`, JSON.stringify(deviceState), { qos: 1, retain: true });
    }
  };

  // --- BILLING CYCLE CHECKER ---
  const checkAndResetBillingCycle = async (currentDevices: Device[]) => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`; // e.g. "2023-10"
    const lastMonthKey = localStorage.getItem('nexus_billing_month');

    if (lastMonthKey !== currentMonthKey) {
      console.log(`[Nexus Billing] New Month Detected (${currentMonthKey}). Resetting Usage Stats...`);
      
      const resetDevices = currentDevices.map(d => ({
        ...d,
        usageSeconds: 0,
        lastStartTime: d.isOn ? Date.now() : null 
      }));

      setDevices(resetDevices);
      localStorage.setItem('nexus_billing_month', currentMonthKey);

      if (dbClient.current) {
        await Promise.all(resetDevices.map(d => persistDevice(d)));
      }
      return resetDevices;
    }
    return currentDevices;
  };

  // 1. Initialize Database
  useEffect(() => {
    const initDB = async () => {
      if (dbClient.current) return; 

      try {
        let finalUrl = DB_CONFIG.url;
        if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://')) {
          finalUrl = finalUrl.replace(/^https?:\/\//, 'libsql://');
        } else if (!finalUrl.startsWith('libsql://')) {
          finalUrl = `libsql://${finalUrl}`;
        }
        
        const client = createClient({ url: finalUrl, authToken: DB_CONFIG.authToken });
        dbClient.current = client;

        await client.batch([
          `CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, json TEXT)`,
          `CREATE TABLE IF NOT EXISTS scenes (id TEXT PRIMARY KEY, json TEXT)`
        ], "write");

        const deviceRes = await client.execute("SELECT * FROM devices");
        
        // Seeding Logic
        const existingDeviceIds = new Set(deviceRes.rows.map(row => row.id));
        const devicesToInsert = SEED_DEVICES.filter(d => !existingDeviceIds.has(d.id));

        if (devicesToInsert.length > 0) {
          await Promise.all(devicesToInsert.map(d => 
            client.execute({ sql: "INSERT INTO devices (id, json) VALUES (?, ?)", args: [d.id, JSON.stringify(d)] })
          ));
        }

        // Load & Parse Devices
        const finalDevicesRes = await client.execute("SELECT * FROM devices");
        let loadedDevices: Device[] = [];
        for (const row of finalDevicesRes.rows) {
          try { 
            const d = JSON.parse(row.json as string);
            loadedDevices.push({
              ...d,
              watts: Number(d.watts) || 0,
              usageSeconds: Number(d.usageSeconds) || 0,
              lastStartTime: (d.lastStartTime && Number(d.lastStartTime) > 0) ? Number(d.lastStartTime) : null
            }); 
          } catch (e) {}
        }
        loadedDevices.sort((a, b) => a.type.localeCompare(b.type));
        loadedDevices = await checkAndResetBillingCycle(loadedDevices);
        setDevices(loadedDevices);

        // Load Scenes
        const sceneRes = await client.execute("SELECT * FROM scenes");
        const existingSceneIds = new Set(sceneRes.rows.map(row => row.id));
        const scenesToInsert = SEED_SCENES.filter(s => !existingSceneIds.has(s.id));
        if (scenesToInsert.length > 0) {
           await Promise.all(scenesToInsert.map(s => 
             client.execute({ sql: "INSERT INTO scenes (id, json) VALUES (?, ?)", args: [s.id, JSON.stringify(s)] })
           ));
        }
        const finalScenesRes = await client.execute("SELECT * FROM scenes");
        const loadedScenes: Scene[] = [];
        for (const row of finalScenesRes.rows) {
           try { loadedScenes.push(JSON.parse(row.json as string)); } catch(e) {}
        }
        // Fallback for empty scenes or missing targets in old DB data
        if (loadedScenes.length === 0 || !loadedScenes[0].targets) {
            setScenes(SEED_SCENES);
        } else {
            setScenes(loadedScenes);
        }

        setIsDbReady(true);
      } catch (err) {
        console.error("DB Init Error", err);
        setDevices(SEED_DEVICES);
        setScenes(SEED_SCENES);
        setIsDbReady(true);
      }
    };
    initDB();
  }, []);

  // 2. Poll Database
  useEffect(() => {
    if (!isDbReady) return;
    const syncInterval = setInterval(async () => {
      if (!dbClient.current) return;
      try {
        const [devRes, sceneRes] = await Promise.all([
          dbClient.current.execute("SELECT * FROM devices"),
          dbClient.current.execute("SELECT * FROM scenes")
        ]);
        const remoteDevices: Device[] = [];
        for (const row of devRes.rows) { 
            try { 
                const d = JSON.parse(row.json as string);
                remoteDevices.push({
                    ...d,
                    watts: Number(d.watts) || 0,
                    usageSeconds: Number(d.usageSeconds) || 0,
                    lastStartTime: (d.lastStartTime && Number(d.lastStartTime) > 0) ? Number(d.lastStartTime) : null
                }); 
            } catch(e) {} 
        }
        remoteDevices.sort((a, b) => a.id.localeCompare(b.id));

        const remoteScenes: Scene[] = [];
        for (const row of sceneRes.rows) { try { remoteScenes.push(JSON.parse(row.json as string)); } catch(e) {} }
        remoteScenes.sort((a, b) => a.id.localeCompare(b.id));

        setDevices(prev => {
          // Optimization: Only update if changed to prevent jitter, but allow local overrides
          const prevSorted = [...prev].sort((a, b) => a.id.localeCompare(b.id));
          // Simple stringify compare is expensive but safe for this scale
          if (JSON.stringify(prevSorted) !== JSON.stringify(remoteDevices)) {
             // We need to be careful not to overwrite local transient state if user is dragging sliders etc.
             // But for ON/OFF it's better to sync.
             return remoteDevices;
          }
          return prev;
        });
        setScenes(prev => {
          const prevSorted = [...prev].sort((a, b) => a.id.localeCompare(b.id));
          if (JSON.stringify(prevSorted) !== JSON.stringify(remoteScenes)) return remoteScenes;
          return prev;
        });
      } catch (e) {}
    }, 2500); 
    return () => clearInterval(syncInterval);
  }, [isDbReady]);

  // 3. MQTT
  useEffect(() => {
    if (mqttClient.current) return; 
    const connectMQTT = () => {
      try {
        const connectionUrl = `${MQTT_CONFIG.protocol}://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}${MQTT_CONFIG.path}`;
        const client = mqtt.connect(connectionUrl, {
          username: MQTT_CONFIG.username,
          password: MQTT_CONFIG.password,
          clientId: `nexus_web_${Math.random().toString(16).slice(2, 10)}`,
          keepalive: 60, clean: true, reconnectPeriod: 5000,
        });
        client.on('connect', () => { setIsConnected(true); client.subscribe('nexus/+/state', { qos: 1 }); });
        client.on('message', (topic, message) => {
          try {
             const topicParts = topic.split('/');
             const deviceId = topicParts[1];
             const payload = JSON.parse(message.toString());
             handleExternalUpdate(deviceId, payload);
          } catch (e) {}
        });
        client.on('error', () => setIsConnected(false));
        client.on('offline', () => setIsConnected(false));
        mqttClient.current = client;
      } catch (error) {}
    };
    connectMQTT();
    return () => { if (mqttClient.current) { mqttClient.current.end(); mqttClient.current = null; } };
  }, []);

  // --- AUTO-SAVE & SCHEDULER HEARTBEAT (The Engine) ---
  useEffect(() => {
    if (!isDbReady) return;

    // We run a faster loop (every 5 seconds) to check Timers/Habits efficiently
    // This also handles the consumption tracking save
    const heartBeat = setInterval(() => {
      setDevices(currentDevices => {
        const now = Date.now();
        const dateObj = new Date();
        const currentDay = dateObj.getDay(); // 0-6
        const currentHours = dateObj.getHours().toString().padStart(2, '0');
        const currentMinutes = dateObj.getMinutes().toString().padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;
        
        let hasChanges = false;

        const updatedDevices = currentDevices.map(d => {
            let modifiedDevice = { ...d };
            let deviceChanged = false;

            // 1. Check Usage Time (Consumption)
            if (d.isOn && d.lastStartTime) {
                const elapsedSeconds = (now - d.lastStartTime) / 1000;
                if (elapsedSeconds > 5) { // Only update if > 5s passed to reduce DB writes
                    const newUsage = (Number(d.usageSeconds) || 0) + elapsedSeconds;
                    modifiedDevice = {
                        ...modifiedDevice,
                        usageSeconds: newUsage,
                        lastStartTime: now // Checkpoint
                    };
                    deviceChanged = true;
                }
            }

            // 2. Check Active Timers
            if (d.activeTimer) {
                if (now >= d.activeTimer.targetTime) {
                    console.log(`[Timer] Triggering ${d.activeTimer.action} for ${d.name}`);
                    const shouldBeOn = d.activeTimer.action === 'ON';
                    
                    // Only apply if state is different to avoid redundant logic
                    if (d.isOn !== shouldBeOn) {
                        modifiedDevice = applyStateChange(modifiedDevice, shouldBeOn, now);
                    }
                    
                    // Clear Timer
                    modifiedDevice.activeTimer = null;
                    deviceChanged = true;
                }
            }

            // 3. Check Habits
            if (d.habits && d.habits.length > 0) {
                d.habits.forEach(habit => {
                    if (habit.enabled && habit.days.includes(currentDay) && habit.time === currentTimeStr) {
                         const shouldBeOn = habit.action === 'ON';
                         // Simple check to see if we already triggered this minute? 
                         // To handle this properly we ideally need "lastTriggered" on the habit.
                         // For now, in a 5s interval, this might fire multiple times in the same minute.
                         // But setting state to ON when already ON is harmless in our applyStateChange logic
                         // IF applyStateChange checks d.isOn !== shouldBeOn.
                         if (d.isOn !== shouldBeOn) {
                             console.log(`[Habit] Executing routine: ${habit.action} ${d.name}`);
                             modifiedDevice = applyStateChange(modifiedDevice, shouldBeOn, now);
                             deviceChanged = true;
                         }
                    }
                });
            }

            if (deviceChanged) {
                hasChanges = true;
                persistDevice(modifiedDevice);
                // Also publish MQTT if state changed (toggle logic handles this, but here we do it manually if automation triggered)
                if (d.isOn !== modifiedDevice.isOn) {
                    publishCommand(modifiedDevice.id, modifiedDevice);
                }
            }

            return modifiedDevice;
        });

        return hasChanges ? updatedDevices : currentDevices;
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(heartBeat);
  }, [isDbReady]);

  // Helper Logic to apply state changes (Shared between manual toggle and automation)
  const applyStateChange = (device: Device, shouldBeOn: boolean, nowTimestamp: number): Device => {
      let newExtra = device.extraData;
      let newWatts = device.watts;
      let newUsageSeconds = Number(device.usageSeconds) || 0;
      let newLastStartTime = device.lastStartTime;

      if (!shouldBeOn) {
          // Turning OFF
          if (device.lastStartTime && device.lastStartTime > 0) {
             const sessionSeconds = (nowTimestamp - device.lastStartTime) / 1000;
             newUsageSeconds += sessionSeconds;
          }
          newLastStartTime = null;
          newWatts = 0;
          if (device.type === 'ac') newExtra = 'OFF';
      } else {
          // Turning ON
          newLastStartTime = nowTimestamp;
          // Restore default watts based on type
          if (device.type === 'ac') { newWatts = 1200; newExtra = `${device.params?.temperature || 24}°C`; }
          else if (device.type === 'light') newWatts = 25;
          else if (device.type === 'fan') newWatts = 55;
          else if (device.type === 'fridge') newWatts = 250;
          else if (device.type === 'heater') newWatts = 1500;
          else if (device.type === 'tv') newWatts = 120;
          else if (device.type === 'router') newWatts = 15;
          else if (device.type === 'washer') newWatts = 2000;
          else if (device.type === 'outlet') newWatts = 100;
      }

      return {
          ...device,
          isOn: shouldBeOn,
          watts: newWatts,
          extraData: newExtra,
          lastStartTime: newLastStartTime,
          usageSeconds: newUsageSeconds
      };
  };

  const handleExternalUpdate = useCallback((id: string, data: any) => {
    setDevices(prev => {
      const targetIndex = prev.findIndex(d => d.id === id);
      if (targetIndex === -1) return prev; 
      const oldDevice = prev[targetIndex];
      const updatedParams = (oldDevice.params || data.params) ? { ...oldDevice.params, ...(data.params || {}) } : undefined;
      
      const newDevice = { 
          ...oldDevice, 
          ...data, 
          params: updatedParams,
          // Safety Checks
          watts: data.watts !== undefined ? Number(data.watts) : oldDevice.watts,
          usageSeconds: data.usageSeconds !== undefined ? Number(data.usageSeconds) : oldDevice.usageSeconds
      };

      const newDevices = [...prev];
      newDevices[targetIndex] = newDevice;
      return newDevices;
    });
  }, []);

  // 4. Logic: Toggle Device
  const handleToggleDevice = useCallback((id: string) => {
    setDevices(prev => {
      const newDevices = prev.map(d => {
        if (d.id === id) {
          const newState = !d.isOn;
          const updatedDevice = applyStateChange(d, newState, Date.now());
          
          persistDevice(updatedDevice);
          publishCommand(id, updatedDevice);
          return updatedDevice;
        }
        return d;
      });
      return newDevices;
    });
  }, []);

  const handleUpdateDeviceParams = useCallback((id: string, params: Partial<Device['params']>) => {
    setDevices(prev => {
      const newDevices = prev.map(d => {
        if (d.id === id) {
          const updatedParams = { ...d.params, ...params };
          let updatedExtra = d.extraData;
          if (d.type === 'ac' && d.isOn) updatedExtra = `${updatedParams.temperature}°C`;
          if (d.type === 'fan' && d.isOn && params.fanSpeed) updatedExtra = params.fanSpeed.toUpperCase();

          const updatedDevice = { ...d, params: updatedParams, extraData: updatedExtra };
          persistDevice(updatedDevice);
          publishCommand(id, updatedDevice);
          return updatedDevice;
        }
        return d;
      });
      return newDevices;
    });
  }, []);

  // --- AUTOMATION HANDLERS ---
  const handleSetDeviceTimer = useCallback((id: string, timer: TimerConfig | null) => {
      setDevices(prev => {
          const newDevices = prev.map(d => {
              if (d.id === id) {
                  const updated = { ...d, activeTimer: timer };
                  persistDevice(updated);
                  return updated;
              }
              return d;
          });
          return newDevices;
      });
  }, []);

  const handleUpdateDeviceHabits = useCallback((id: string, habits: Habit[]) => {
      setDevices(prev => {
          const newDevices = prev.map(d => {
              if (d.id === id) {
                  const updated = { ...d, habits: habits };
                  persistDevice(updated);
                  return updated;
              }
              return d;
          });
          return newDevices;
      });
  }, []);

  // --- SCENE MANAGEMENT LOGIC ---

  const handleApplyScene = useCallback((sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || !scene.targets) return;

    setDevices(prevDevices => {
      const newDevices = prevDevices.map(device => {
        const target = scene.targets[device.id];
        // Only modify devices that are targeted by the scene
        if (target) {
          const shouldBeOn = target.isOn;
          const currentIsOn = device.isOn;
          
          // Re-use logic to calculate consumption/time correctly during scene switch
          let updatedDevice = device;
          if (shouldBeOn !== currentIsOn) {
              updatedDevice = applyStateChange(device, shouldBeOn, Date.now());
          }
          
          // Apply Params from Scene
          updatedDevice = {
              ...updatedDevice,
              params: target.params ? { ...updatedDevice.params, ...target.params } : updatedDevice.params,
          };
          
          // Update Extra Data for visual if params changed
          if (updatedDevice.type === 'ac' && updatedDevice.isOn && target.params?.temperature) {
              updatedDevice.extraData = `${target.params.temperature}°C`;
          }

          persistDevice(updatedDevice);
          publishCommand(device.id, updatedDevice);
          return updatedDevice;
        }
        return device;
      });
      return newDevices;
    });
  }, [scenes]);

  const handleAddScene = useCallback((name: string, color: string) => {
    // Capture current state of all devices
    const targets: Record<string, SceneTarget> = {};
    devices.forEach(d => {
       targets[d.id] = { isOn: d.isOn, params: d.params };
    });

    const newScene: Scene = {
       id: `scene_${Date.now()}`,
       name,
       color,
       targets
    };

    setScenes(prev => {
        const next = [...prev, newScene];
        persistScene(newScene);
        return next;
    });
  }, [devices]);

  const handleUpdateScene = useCallback((id: string, updates: Partial<Scene>) => {
      setScenes(prev => {
          const next = prev.map(s => {
              if (s.id === id) {
                  const updated = { ...s, ...updates };
                  persistScene(updated);
                  return updated;
              }
              return s;
          });
          return next;
      });
  }, []);

  const handleDeleteScene = useCallback((id: string) => {
      setScenes(prev => prev.filter(s => s.id !== id));
      deleteSceneFromDb(id);
  }, []);

  if (!isDbReady) {
    return (
      <div className="w-screen h-screen bg-black text-cyan-500 flex flex-col items-center justify-center font-mono gap-4">
        <div className="w-16 h-16 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse tracking-widest">CALIBRATING ENERGY METERS...</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white">
      <NexusSimulator 
        devices={devices}
        scenes={scenes}
        wifiSsid="Nexus_Master"
        wifiIp="192.168.1.105"
        maxLoadWatts={6000} 
        isConnected={isConnected}
        onToggleDevice={handleToggleDevice}
        onUpdateDeviceParams={handleUpdateDeviceParams}
        onApplyScene={handleApplyScene}
        onAddScene={handleAddScene}
        onUpdateScene={handleUpdateScene}
        onDeleteScene={handleDeleteScene}
        onSetDeviceTimer={handleSetDeviceTimer} // --- NEW HANDLER
        onUpdateDeviceHabits={handleUpdateDeviceHabits} // --- NEW HANDLER
      />
    </div>
  );
};

export default App;