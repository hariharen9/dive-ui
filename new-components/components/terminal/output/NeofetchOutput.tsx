import React from 'react';

const NeofetchOutput: React.FC = () => {
  // Generate dynamic values for a more lively feel
  const usedMemory = (Math.random() * 50 + 50).toFixed(2); // Random value between 50.00 and 100.00
  const totalMemory = 128;
  const uptimeHours = Math.floor(Math.random() * 72) + 1;
  const uptimeMinutes = Math.floor(Math.random() * 60);
  const runningPods = Math.floor(Math.random() * 200) + 1200;
  const pendingPods = Math.floor(Math.random() * 50);
  
  // A generic color palette
  const colors = ['#3776AB', '#61DAFB', '#F7DF1E', '#00ADD8', '#4479A1', '#339933', '#FF9900', '#D24939'];

  return (
    <div className="flex flex-col sm:flex-row gap-4 text-gray-700 dark:text-gray-300">
      <div className="text-cyan-600 dark:text-cyan-400 text-xs sm:text-sm">
        <pre>{`
    ██╗  ██╗ █████╗ ██████╗ ██╗
    ██║  ██║██╔══██╗██╔══██╗██║
    ███████║███████║██████╔╝██║
    ██╔══██║██╔══██║██╔══██╗██║
    ██║  ██║██║  ██║██║  ██║██║
    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝
        `}</pre>
      </div>
      <div className="space-y-1 text-xs sm:text-sm">
        <div className="font-bold"><span className="text-cyan-600 dark:text-cyan-400">hariharen</span><span className="text-gray-500">@</span><span className="text-cyan-600 dark:text-cyan-400">node-69</span></div>
        <div className="w-24 border-b border-gray-300 dark:border-gray-500 my-1"></div>
        <div><span className="text-cyan-600 dark:text-cyan-400 font-bold">OS:</span> Kali Linux x86_64</div>
        <div><span className="text-cyan-600 dark:text-cyan-400 font-bold">Host:</span> Linux KVM</div>
        <div><span className="text-cyan-600 dark:text-cyan-400 font-bold">Kernel:</span> 5.4.0-150-generic</div>
        <div><span className="text-cyan-600 dark:text-cyan-400 font-bold">Uptime:</span> {`${uptimeHours} hours, ${uptimeMinutes} mins`}</div>
        <div><span className="text-cyan-600 dark:text-cyan-400 font-bold">Pods:</span> {`${runningPods} running, ${pendingPods} pending`}</div>
        <div><span className="text-cyan-600 dark:text-cyan-400 font-bold">Shell:</span> zsh + Go</div>
        <div><span className="text-cyan-600 dark:text-cyan-400 font-bold">Orchestrator:</span> Kubernetes v1.28.2</div>
        <div><span className="text-cyan-600 dark:text-cyan-400 font-bold">CPU:</span>AMD Ryzen Threadripper PRO 7995WX (192) @ 5.4GHz</div>
        <div><span className="text-cyan-600 dark:text-cyan-400 font-bold">GPU:</span>Nvidia RTX 6000 (Blackwell) </div>
        <div><span className="text-cyan-600 dark:text-cyan-400 font-bold">Memory:</span> {`${usedMemory}GiB / ${totalMemory}.00GiB`}</div>
        <div className="flex space-x-1 pt-2">

          {colors.map(color => (
            <div key={color} className="w-4 h-4" style={{ backgroundColor: color }}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NeofetchOutput;
