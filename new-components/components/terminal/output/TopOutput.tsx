import React, { useState, useEffect } from 'react';
import { XCircle, Activity, Cpu, Server } from 'lucide-react';

interface Process {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  time: string;
  command: string;
  status: 'R' | 'S' | 'Z';
}

const TopOutput: React.FC = () => {
  const [isActive, setIsActive] = useState(true);
  const [uptime, setUptime] = useState(0);
  const [processes, setProcesses] = useState<Process[]>([
    { pid: 1, user: 'root', cpu: 0.1, mem: 0.4, time: '12:00.00', command: 'system_init', status: 'S' },
    { pid: 1337, user: 'hari', cpu: 0.0, mem: 12.5, time: '00:42.00', command: 'portfolio_v2', status: 'R' },
    { pid: 404, user: 'hari', cpu: 0.0, mem: 0.1, time: '00:00.00', command: 'bug_hunter', status: 'S' },
    { pid: 8080, user: 'root', cpu: 0.0, mem: 2.1, time: '01:23.45', command: 'web_server', status: 'S' },
    { pid: 22, user: 'root', cpu: 0.0, mem: 0.2, time: '05:12.11', command: 'sshd', status: 'S' },
  ]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setUptime(t => t + 1);
      
      setProcesses(prev => prev.map(p => {
        // Randomize CPU/Mem slightly to simulate activity
        const cpuChange = (Math.random() - 0.5) * 2;
        const memChange = (Math.random() - 0.5) * 0.5;
        
        // Specific logic for the "portfolio" process to be active
        if (p.command === 'portfolio_v2') {
             return {
                ...p,
                cpu: Math.max(0, Math.min(100, p.cpu + cpuChange + 1)), // Use more CPU
                mem: Math.max(0, Math.min(100, p.mem + memChange)),
             };
        }

        return {
          ...p,
          cpu: Math.max(0, Math.min(100, p.cpu + cpuChange)),
          mem: Math.max(0, Math.min(100, p.mem + memChange)),
        };
      }).sort((a, b) => b.cpu - a.cpu));

    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const loadAvg = [
    (0.5 + Math.random() * 0.5).toFixed(2),
    (0.4 + Math.random() * 0.3).toFixed(2),
    (0.3 + Math.random() * 0.2).toFixed(2)
  ].join(', ');

  if (!isActive) {
    return (
        <div className="text-gray-500 italic border-l-2 border-gray-500 pl-2">
            [top] Process terminated by user.
        </div>
    );
  }

  return (
    <div className="bg-[#1e1e1e] text-green-400 font-mono p-2 rounded-md border border-green-900/30 text-xs sm:text-sm overflow-hidden shadow-lg mb-2">
      {/* Header Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 border-b border-green-800/50 pb-2">
        <div>
            <div className="flex items-center space-x-2">
                <span className="font-bold text-white">top -</span>
                <span>{new Date().toLocaleTimeString()}</span>
                <span className="text-gray-400">up {formatTime(uptime + 123456)},</span>
                <span className="text-gray-400">1 user,</span>
            </div>
            <div className="text-gray-300">
                load average: <span className="text-blue-400 font-bold">{loadAvg}</span>
            </div>
        </div>
        <div className="flex justify-end items-start">
             <button 
                onClick={() => setIsActive(false)}
                className="flex items-center space-x-1 px-2 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded transition-colors"
             >
                <XCircle size={14} />
                <span>Stop</span>
             </button>
        </div>
      </div>

      {/* Resource Bars */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
            <Cpu size={14} className="text-blue-400" />
            <span className="text-blue-400 font-bold">CPU:</span>
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${processes.reduce((acc, p) => acc + p.cpu, 0).toFixed(1)}%` }}
                />
            </div>
            <span className="w-10 text-right">{processes.reduce((acc, p) => acc + p.cpu, 0).toFixed(1)}%</span>
        </div>
        <div className="flex items-center space-x-2">
            <Activity size={14} className="text-purple-400" />
            <span className="text-purple-400 font-bold">Mem:</span>
             <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${processes.reduce((acc, p) => acc + p.mem, 0) * 2}%` }}
                />
            </div>
            <span className="w-10 text-right">{(processes.reduce((acc, p) => acc + p.mem, 0) * 0.16).toFixed(1)}GB</span>
        </div>
      </div>

      {/* Process Table */}
      <table className="w-full text-left border-collapse">
        <thead>
            <tr className="bg-white/5 text-gray-300">
                <th className="p-1">PID</th>
                <th className="p-1">USER</th>
                <th className="p-1">CPU%</th>
                <th className="p-1">MEM%</th>
                <th className="p-1 hidden sm:table-cell">TIME+</th>
                <th className="p-1">COMMAND</th>
            </tr>
        </thead>
        <tbody>
            {processes.map((p) => (
                <tr key={p.pid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-1 text-blue-300">{p.pid}</td>
                    <td className="p-1">{p.user}</td>
                    <td className={`p-1 font-bold ${p.cpu > 10 ? 'text-red-400' : 'text-green-400'}`}>{p.cpu.toFixed(1)}</td>
                    <td className="p-1">{p.mem.toFixed(1)}</td>
                    <td className="p-1 hidden sm:table-cell text-gray-400">{p.time}</td>
                    <td className={`p-1 font-bold ${p.command === 'portfolio_v2' ? 'text-yellow-400' : 'text-white'}`}>{p.command}</td>
                </tr>
            ))}
             <tr className="border-b border-white/5 hover:bg-white/5 transition-colors opacity-50">
                    <td className="p-1">8192</td>
                    <td className="p-1">guest</td>
                    <td className="p-1">0.0</td>
                    <td className="p-1">0.1</td>
                    <td className="p-1 hidden sm:table-cell">00:00.05</td>
                    <td className="p-1">reading_this</td>
             </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TopOutput;
