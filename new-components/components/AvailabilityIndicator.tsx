import React, { useEffect, useState } from 'react';
import { Moon, Sun, Monitor, Gamepad2, Coffee, Zap, Info, Clock, RefreshCw } from 'lucide-react';
import Tooltip from '@uiw/react-tooltip';

type StatusType = 'sleeping' | 'morning' | 'working' | 'gaming' | 'winding_down';

interface StatusConfig {
  icon: React.ElementType;
  label: string;
  subLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  nextChangeHour: number; // The hour when this status typically ends
}

const CONFIGS: Record<StatusType, StatusConfig> = {
  sleeping: {
    icon: Moon,
    label: "Currently Sleeping",
    subLabel: "I'll see this when I wake up!",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    nextChangeHour: 8
  },
  morning: {
    icon: Coffee,
    label: "Morning Routine",
    subLabel: "Fueling up for the day",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    nextChangeHour: 10
  },
  working: {
    icon: Monitor,
    label: "Online / Coding",
    subLabel: "Fastest reply time",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    nextChangeHour: 20
  },
  gaming: {
    icon: Gamepad2,
    label: "Likely Gaming",
    subLabel: "AFK but reachable",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    nextChangeHour: 2 
  },
  winding_down: {
    icon: Zap,
    label: "Winding Down",
    subLabel: "Working on side projects",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    nextChangeHour: 1 
  }
};

const AvailabilityIndicator: React.FC = () => {
  const [status, setStatus] = useState<StatusType>('working');
  const [timeString, setTimeString] = useState('');
  const [nextUpdateText, setNextUpdateText] = useState('');

  const updateStatus = () => {
    const now = new Date();
    // Convert to IST (UTC +5:30)
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(utcTime + istOffset);

    const hours = istDate.getHours();
    const day = istDate.getDay(); 

    setTimeString(istDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' IST');

    const isWeekend = day === 0 || day === 6;
    let currentStatus: StatusType = 'working';

    if (isWeekend) {
        if (hours >= 2 && hours < 9) {
             currentStatus = 'sleeping';
        } else {
             currentStatus = 'gaming';
        }
    } else {
      if (hours >= 1 && hours < 8) {
        currentStatus = 'sleeping';
      } else if (hours >= 8 && hours < 10) {
        currentStatus = 'morning';
      } else if (hours >= 10 && hours < 20) {
        currentStatus = 'working';
      } else {
        currentStatus = 'winding_down';
      }
    }
    
    setStatus(currentStatus);

    const nextHour = CONFIGS[currentStatus].nextChangeHour;
    let nextTimeStr = '';
    if (nextHour === 0) nextTimeStr = '12:00 AM';
    else if (nextHour === 12) nextTimeStr = '12:00 PM';
    else if (nextHour > 12) nextTimeStr = `${nextHour - 12}:00 PM`;
    else nextTimeStr = `${nextHour}:00 AM`;
    
    setNextUpdateText(`Status updates at ${nextTimeStr}`);
  };

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 60000); 
    return () => clearInterval(interval);
  }, []);

  const currentConfig = CONFIGS[status];
  const Icon = currentConfig.icon;

  const TooltipContent = () => (
    <div className="p-3 max-w-[250px] space-y-2 text-left">
      <div className="flex items-center gap-2 border-b border-white/20 pb-2 mb-2">
         <RefreshCw size={14} className="animate-spin" />
         <span className="font-bold text-sm">Live Status System</span>
      </div>
      <p className="text-xs opacity-90 leading-relaxed">
        My availability is automatically updated based on my local time (IST, UTC+05:30).
      </p>
      <div className="space-y-1 mt-2">
        <div className="flex justify-between text-[10px] opacity-70">
            <span>2AM - 8AM</span>
            <span>Sleeping 😴</span>
        </div>
        <div className="flex justify-between text-[10px] opacity-70">
            <span>8AM - 10AM</span>
            <span>Morning Routine ☕</span>
        </div>
        <div className="flex justify-between text-[10px] opacity-70">
            <span>10AM - 8PM</span>
            <span>Working / Coding 💻</span>
        </div>
        <div className="flex justify-between text-[10px] opacity-70">
            <span>8PM - 1AM</span>
            <span>Side Projects ⚡</span>
        </div>
        <div className="flex justify-between text-[10px] opacity-70">
            <span>Weekends</span>
            <span>Gaming 🎮</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`group relative p-6 md:p-8 backdrop-blur-xl rounded-3xl md:rounded-[2.5rem] border shadow-xl overflow-visible transition-all duration-500 ${currentConfig.bgColor} ${currentConfig.borderColor} dark:bg-opacity-20 bg-opacity-60`}>
        {/* Info Tooltip - Top Left */}
        <div className="absolute top-6 left-6 z-50">
             <Tooltip 
                content={<TooltipContent />} 
                placement="bottom-start" 
                className="z-50"
                style={{ zIndex: 9999 }}
             >
                <div className="cursor-help bg-white/10 p-1.5 rounded-full hover:bg-white/20 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all">
                    <Info size={14} />
                </div>
             </Tooltip>
        </div>

        {/* Status Pulse Animation & Time - Top Right */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
             <span className="text-[10px] font-mono font-bold opacity-60 uppercase tracking-widest">{timeString}</span>
             <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentConfig.color.replace('text-', 'bg-')}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${currentConfig.color.replace('text-', 'bg-')}`}></span>
            </span>
        </div>

        <div className="relative flex flex-col items-center text-center mt-4">
            <div className="relative mb-6">
                <div className={`absolute inset-0 rounded-full blur-xl animate-pulse opacity-40 ${currentConfig.color.replace('text-', 'bg-')}`} />
                <div className={`relative w-16 h-16 md:w-20 md:h-20 border rounded-full flex items-center justify-center transition-colors duration-500 ${currentConfig.bgColor} ${currentConfig.borderColor}`}>
                    <Icon className={`${currentConfig.color}`} size={32} />
                </div>
                
                {/* Live Badge */}
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full px-2 py-0.5 shadow-sm flex items-center gap-1">
                    <RefreshCw size={8} className={`animate-spin ${currentConfig.color}`} style={{ animationDuration: '3s' }} />
                    <span className="text-[8px] font-bold text-gray-500 dark:text-gray-400 uppercase">Live</span>
                </div>
            </div>
            
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentConfig.label}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-4">
                {currentConfig.subLabel}
            </p>

            {/* Next Update Indicator */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium border ${currentConfig.borderColor} ${currentConfig.color.replace('text-', 'bg-').replace('500', '500/10')} ${currentConfig.color}`}>
                <Clock size={10} />
                {nextUpdateText}
            </div>
        </div>
    </div>
  );
};

export default AvailabilityIndicator;