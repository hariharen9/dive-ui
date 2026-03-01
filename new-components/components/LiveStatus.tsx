import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Cloud, Sun, Moon, CloudRain, Zap } from 'lucide-react';

const LiveStatus: React.FC = () => {
  const [time, setTime] = useState<string>('');
  const [status, setStatus] = useState<{ text: string; color: string }>({ text: '', color: '' });
  const [weather, setWeather] = useState<{ icon: React.ElementType; temp: string }>({ icon: Sun, temp: '' });

  useEffect(() => {
    const updateStatus = () => {
      // Time & Date in Bengaluru
      const now = new Date();
      const optionsTime: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      const blrTime = new Intl.DateTimeFormat('en-US', optionsTime).format(now);
      
      const optionsDay: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        weekday: 'short', // Mon, Tue...
        hour: 'numeric',
        hour12: false,
      };
      
      const parts = new Intl.DateTimeFormat('en-US', optionsDay).formatToParts(now);
      const day = parts.find(p => p.type === 'weekday')?.value || 'Mon';
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');

      setTime(blrTime);

      const isWeekend = day === 'Sat' || day === 'Sun';

      // --- Status Logic ---
      if (hour >= 0 && hour < 6) {
        setStatus({ text: 'Recharging 😴', color: 'bg-indigo-400' });
      } else if (hour >= 6 && hour < 9) {
        setStatus({ text: isWeekend ? 'Slow Morning ☕' : 'Morning Routine 🏃', color: 'bg-orange-400' });
      } else if (hour >= 9 && hour < 18) {
        if (isWeekend) {
            setStatus({ text: 'Learning / Gaming 🎮', color: 'bg-purple-500' });
        } else {
            setStatus({ text: 'Building at IBM 🚀', color: 'bg-green-500' });
        }
      } else if (hour >= 18 && hour < 21) {
        setStatus({ text: isWeekend ? 'Touching Grass 🌳' : 'Side Project Grind 💻', color: 'bg-blue-500' });
      } else {
        setStatus({ text: 'Reading / Winding Down 📖', color: 'bg-indigo-500' });
      }

      // --- Simulated Weather Logic (Seasonal/Time based) ---
      // This is a simulation since we don't have a backend/API key for real weather
      // Assuming generally "Good" weather for the portfolio vibe
      let WeatherIcon = Sun;
      let tempVal = '24°C';

      if (hour >= 6 && hour < 18) {
         // Daytime
         if (hour > 12 && hour < 16) {
             WeatherIcon = Sun; // Peak sun
             tempVal = '28°C';
         } else {
             WeatherIcon = Cloud; // Morning/Evening clouds
             tempVal = '24°C';
         }
      } else {
          // Nighttime
          WeatherIcon = Moon;
          tempVal = '20°C';
      }

      // Random rain chance for "realism" (deterministic based on hour to avoid flickering)
      if (hour % 7 === 0) {
          WeatherIcon = CloudRain;
          tempVal = '22°C';
      }

      setWeather({ icon: WeatherIcon, temp: tempVal });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); 
    return () => clearInterval(interval);
  }, []);

  // --- Latency Logic ---
  const [latency, setLatency] = useState<number>(24);

  useEffect(() => {
    const updateLatency = () => {
      // Simulate realistic network jitter between 18ms and 45ms
      const newLatency = Math.floor(Math.random() * (45 - 18 + 1)) + 18;
      setLatency(newLatency);
    };

    const latencyInterval = setInterval(updateLatency, 3000);
    return () => clearInterval(latencyInterval);
  }, []);

  const WeatherIcon = weather.icon;

  return (
    <div className="flex flex-col items-center md:items-start space-y-2 text-xs font-mono">
      <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-1">
            <MapPin size={12} />
            <span>Bengaluru</span>
        </div>
        <span className="opacity-30">|</span>
        <div className="flex items-center space-x-1">
            <Clock size={12} />
            <span>{time}</span>
        </div>
        <span className="opacity-30">|</span>
        <div className="flex items-center space-x-1" title="Simulated Weather">
            <WeatherIcon size={12} />
            <span>{weather.temp}</span>
        </div>
        <span className="opacity-30">|</span>
        <div className="flex items-center space-x-1" title="Network Latency">
            <Zap size={12} className={latency < 100 ? "text-green-500" : "text-yellow-500"} />
            <span>{latency}ms</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.color} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${status.color}`}></span>
        </span>
        <span className="text-gray-600 dark:text-gray-300 font-medium uppercase tracking-wider">
          {status.text}
        </span>
      </div>
    </div>
  );
};

export default LiveStatus;
