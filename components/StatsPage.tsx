import React, { useEffect, useState, useMemo } from 'react';
import { Device } from '../types';
import { Zap, Activity, DollarSign, TrendingUp, AlertTriangle, Calendar, Info } from 'lucide-react';

interface StatsPageProps {
  devices: Device[];
  billCost?: number;
  monthKwh?: number;
}

const StatsPage: React.FC<StatsPageProps> = ({ devices }) => {
  const [now, setNow] = useState(Date.now());
  const [rotation, setRotation] = useState(0);

  // 1. Force update every second to show live billing increment
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Animation Loop
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setRotation(prev => (prev + 0.5) % 360);
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // 3. CORE LOGIC: REAL CONSUMPTION & BILLING ENGINE
  const { totalWatts, totalKwh, totalCost, deviceStats, tierDetails } = useMemo(() => {
    let currentWatts = 0;
    let accumulatedKwh = 0;

    // A. Calculate KWh per device
    const stats = devices.map(d => {
      // 1. Current Load (Live Watts)
      // Ensure watts is a number, default to 0 if undefined/NaN
      const realWatts = Number(d.watts) || 0;
      if (d.isOn) currentWatts += realWatts;

      // 2. Calculate Total Duration in Seconds
      // Combine stored DB time + Current Session time
      let totalSeconds = Number(d.usageSeconds) || 0;
      
      if (d.isOn && d.lastStartTime) {
        const startTime = Number(d.lastStartTime);
        if (!isNaN(startTime) && startTime > 0) {
           const sessionDuration = Math.max(0, (now - startTime) / 1000);
           totalSeconds += sessionDuration;
        }
      }

      // 3. Handle "Rated Power" for cost calculation
      // If device is OFF, d.watts is 0. We need its "Running Wattage" to calculate past cost.
      // We assume a standard wattage based on type if current watt is 0.
      let ratedWatts = realWatts;
      if (ratedWatts === 0) {
         if (d.type === 'ac') ratedWatts = 1200;
         else if (d.type === 'light') ratedWatts = 25;
         else if (d.type === 'fan') ratedWatts = 55;
         else if (d.type === 'fridge') ratedWatts = 250;
         else if (d.type === 'heater') ratedWatts = 1500;
         else if (d.type === 'tv') ratedWatts = 120;
         else if (d.type === 'router') ratedWatts = 15;
         else if (d.type === 'washer') ratedWatts = 2200;
         else ratedWatts = 100; // Outlet default
      }

      // Formula: (Watts * Seconds) / (1000 * 3600) = KWh
      const deviceKwh = (ratedWatts * totalSeconds) / 3600000;
      accumulatedKwh += deviceKwh;

      return { 
        ...d, 
        calculatedKwh: deviceKwh, 
        usageSeconds: totalSeconds,
        ratedWattsForCalc: ratedWatts 
      };
    });

    // B. EGYPTIAN ELECTRICITY TARIFF 2026 (STRICT IMPLEMENTATION)
    // Source: User provided data.
    let bill = 0;
    const kwh = accumulatedKwh;
    let currentTier = 0;
    let tierRate = 0;

    if (kwh === 0) {
        bill = 0;
        currentTier = 1;
        tierRate = 0.68;
    } 
    // TIER 7: > 1000 KWh (No Subsidy - Calculated from Zero)
    else if (kwh > 1000) {
      bill = kwh * 2.23;
      currentTier = 7;
      tierRate = 2.23;
    } 
    // TIER 6: 651 - 1000 KWh (Fixed Rate with Deduction)
    else if (kwh > 650) {
      // "2.10 جنيه (مع خصم 378 جنيهاً كفرق محاسبة)"
      bill = (kwh * 2.10) - 378;
      currentTier = 6;
      tierRate = 2.10;
    } 
    // PROGRESSIVE TIERS (1 - 5)
    else {
      // Tier 1: 0 - 50 @ 0.68
      let remaining = kwh;
      const t1 = Math.min(remaining, 50);
      bill += t1 * 0.68;
      remaining -= t1;
      currentTier = 1;
      tierRate = 0.68;

      // Tier 2: 51 - 100 @ 0.78
      if (remaining > 0) {
        const t2 = Math.min(remaining, 50); // 100 - 50 = 50 width
        bill += t2 * 0.78;
        remaining -= t2;
        currentTier = 2;
        tierRate = 0.78;
      }

      // Tier 3: 101 - 200 @ 0.95
      if (remaining > 0) {
        const t3 = Math.min(remaining, 100); // 200 - 100 = 100 width
        bill += t3 * 0.95;
        remaining -= t3;
        currentTier = 3;
        tierRate = 0.95;
      }

      // Tier 4: 201 - 350 @ 1.55
      if (remaining > 0) {
        const t4 = Math.min(remaining, 150); // 350 - 200 = 150 width
        bill += t4 * 1.55;
        remaining -= t4;
        currentTier = 4;
        tierRate = 1.55;
      }

      // Tier 5: 351 - 650 @ 1.95
      if (remaining > 0) {
        const t5 = Math.min(remaining, 300); // 650 - 350 = 300 width
        bill += t5 * 1.95;
        remaining -= t5;
        currentTier = 5;
        tierRate = 1.95;
      }
    }

    return { 
      totalWatts: currentWatts, 
      totalKwh: accumulatedKwh, 
      totalCost: Math.max(0, bill), // Safety against negative
      deviceStats: stats.sort((a, b) => b.calculatedKwh - a.calculatedKwh),
      tierDetails: { id: currentTier, price: tierRate }
    };
  }, [devices, now]);

  // Color Coding for Tiers
  const getTierColor = (id: number) => {
      if (id >= 7) return 'text-red-500 border-red-500/50';
      if (id === 6) return 'text-orange-500 border-orange-500/50';
      if (id === 5) return 'text-amber-500 border-amber-500/50';
      if (id === 4) return 'text-yellow-400 border-yellow-400/50';
      if (id === 3) return 'text-cyan-300 border-cyan-300/50';
      return 'text-green-400 border-green-400/50';
  };

  const currentMonthName = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 md:gap-8 pb-24 font-mono overflow-hidden">
      
      {/* LEFT COLUMN: VISUALS & METRICS */}
      <div className="flex-1 flex flex-col gap-4 md:gap-6">
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
              {/* BILL CARD */}
              <div className={`holo-card p-4 md:p-6 rounded-2xl border-l-[6px] flex flex-col relative overflow-hidden group ${getTierColor(tierDetails.id).split(' ')[1]}`}>
                 <div className="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity rotate-12"><DollarSign size={120} /></div>
                 
                 <div className="flex justify-between items-start mb-2 z-10">
                    <span className="text-gray-400 text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase">Current Bill</span>
                    <span className={`text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded border bg-black/50 ${getTierColor(tierDetails.id).split(' ')[0]}`}>
                       TIER {tierDetails.id}
                    </span>
                 </div>

                 <div className="flex items-baseline gap-2 z-10 mt-auto">
                    <div className="text-3xl md:text-5xl font-bold text-white tracking-tighter shadow-black drop-shadow-lg tabular-nums">
                      {/* Using toLocaleString with strict decimals */}
                      {totalCost.toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <span className="text-xs md:text-sm text-gray-400 font-sans font-bold">EGP</span>
                 </div>
                 
                 <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-gray-500 flex justify-between">
                    <span>Rate: {tierDetails.price} EGP/kWh</span>
                    {tierDetails.id === 6 && <span className="text-orange-400">(-378 EGP Ded.)</span>}
                    {tierDetails.id >= 7 && <span className="text-red-400">(No Subsidy)</span>}
                 </div>
              </div>

              {/* CONSUMPTION CARD */}
              <div className="holo-card p-4 md:p-6 rounded-2xl border-l-[6px] border-cyan-500 flex flex-col relative overflow-hidden group">
                 <div className="absolute -right-6 -top-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity rotate-12"><Zap size={120} /></div>
                 
                 <span className="text-cyan-500 text-[9px] md:text-[10px] font-bold tracking-[0.2em] mb-auto uppercase">Total Consumption</span>
                 
                 <div className="flex items-baseline gap-2 z-10">
                    <div className="text-3xl md:text-5xl font-bold text-white tracking-tighter shadow-black drop-shadow-lg tabular-nums">
                       {totalKwh.toFixed(2)}
                    </div>
                    <span className="text-xs md:text-sm text-gray-400 font-sans font-bold">KWh</span>
                 </div>
                 
                 <div className="mt-3 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                    {/* Visual bar maxes at 1000 KWh */}
                    <div className="h-full bg-cyan-500 shadow-[0_0_10px_cyan]" style={{ width: `${Math.min((totalKwh / 1000) * 100, 100)}%` }}></div>
                 </div>
              </div>
          </div>

          {/* REACTOR CORE VISUALIZER (Live Load) */}
          <div className="flex-1 holo-card rounded-3xl flex items-center justify-center relative min-h-[250px] md:min-h-[350px] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.15)_0%,_transparent_70%)]"></div>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

              {/* Central Reactor */}
              <div className="relative w-[200px] h-[200px] md:w-[300px] md:h-[300px] flex items-center justify-center scale-75 md:scale-100">
                  <div className="absolute inset-0 rounded-full border border-cyan-900"></div>
                  
                  {/* Ticks */}
                  {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="absolute w-1 h-3 bg-cyan-700" style={{ top: '0', left: '50%', transformOrigin: '0 150px', transform: `translateX(-50%) rotate(${i * 30}deg)` }}></div>
                  ))}
                  
                  {/* Rotating Rings */}
                  <div className="absolute inset-4 rounded-full border-2 border-dashed border-cyan-800 opacity-50" style={{ transform: `rotate(${rotation * 0.5}deg)` }}></div>
                  <div className="absolute inset-10 rounded-full border-[1px] border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]" style={{ transform: `rotate(-${rotation}deg)` }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_white]"></div>
                  </div>
                  
                  {/* Core Spinner */}
                  <div className={`absolute inset-20 rounded-full border-4 border-cyan-900 border-t-cyan-400 border-b-cyan-400 shadow-[0_0_15px_#00FFFF] ${totalWatts > 0 ? 'animate-spin-slow' : ''}`}></div>

                  {/* Digital Readout */}
                  <div className="z-10 flex flex-col items-center justify-center bg-black/60 w-32 h-32 rounded-full backdrop-blur-sm border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-pulse-glow">
                      <Zap size={32} className={`text-white mb-1 transition-colors ${totalWatts > 3000 ? 'fill-red-500 drop-shadow-[0_0_5px_red]' : 'fill-cyan-500 drop-shadow-[0_0_5px_cyan]'}`} />
                      <div className="text-3xl font-bold text-white tracking-tighter drop-shadow-lg tabular-nums">{totalWatts}</div>
                      <div className="text-cyan-400 text-[9px] tracking-[0.3em] font-bold uppercase mt-1">Watts</div>
                  </div>
              </div>
          </div>
      </div>

      {/* RIGHT COLUMN: LISTING */}
      <div className="flex-1 holo-card rounded-2xl p-4 md:p-6 overflow-hidden flex flex-col min-h-[400px]">
         <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-cyan-900/30 rounded text-cyan-400"><Calendar size={20} /></div>
                 <div>
                    <h3 className="text-sm font-bold tracking-[0.2em] text-white uppercase">Analytics</h3>
                    <p className="text-[10px] text-cyan-300 font-bold" dir="rtl">{currentMonthName}</p>
                 </div>
             </div>
             {totalKwh > 650 && (
                <div className="flex items-center gap-1 text-[9px] text-orange-400 animate-pulse border border-orange-500/30 px-2 py-1 rounded">
                  <AlertTriangle size={12} />
                  <span>HIGH USAGE</span>
                </div>
             )}
         </div>
         
         {/* Device List */}
         <div className="flex-1 overflow-y-auto no-scrollbar pr-1 space-y-3">
            {deviceStats.map((d, idx) => {
                // Determine percentage of total bill this device is responsible for
                const percentOfBill = totalCost > 0 
                  ? ((d.calculatedKwh / totalKwh) * totalCost) / totalCost * 100 
                  : 0;
                
                // Calculate device specific cost share (approximate based on average rate for visualization)
                // Note: Exact cost per device is complex in sliding scale because "which device pushed me to tier 2?". 
                // We use weighted average for display.
                const deviceCostShare = totalCost > 0 ? (d.calculatedKwh / totalKwh) * totalCost : 0;

                const hrs = Math.floor(d.usageSeconds / 3600);
                const mins = Math.floor((d.usageSeconds % 3600) / 60);

                return (
                    <div key={d.id} className="group relative flex items-center gap-4 p-3 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all">
                        <div className="w-8 h-8 flex items-center justify-center bg-black/50 rounded font-mono text-xs text-gray-400 font-bold border border-white/5">
                            {idx + 1}
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex justify-between mb-1.5 items-end">
                                <span className="text-sm font-bold text-gray-200" dir="rtl">{d.name}</span>
                                <div className="text-right">
                                  <span className="block text-sm font-bold text-white tabular-nums">
                                      {deviceCostShare.toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-gray-500">EGP</span>
                                  </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1 font-mono">
                               <span>{hrs}h {mins}m active</span>
                               <span>{d.calculatedKwh.toFixed(3)} kWh</span>
                            </div>
                            <div className="h-1 bg-gray-800 rounded-full overflow-hidden relative">
                                <div 
                                    className={`h-full rounded-full ${d.isOn ? 'bg-cyan-500' : 'bg-gray-600'}`}
                                    style={{ width: `${Math.max(1, percentOfBill)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                );
            })}
         </div>
         
         {/* Footer Note */}
         <div className="mt-4 pt-3 border-t border-white/5 flex items-start gap-2 text-[9px] text-gray-600">
            <Info size={12} className="shrink-0 mt-0.5" />
            <p>Calculated based on EEHC 2026 Tariffs. Tiers 1-5 are progressive. Tier 6 implies fixed rate calculation with deduction. Tier 7 implies full un-subsidized rate.</p>
         </div>
      </div>
    </div>
  );
};

export default StatsPage;