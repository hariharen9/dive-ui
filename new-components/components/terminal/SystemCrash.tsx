import React from 'react';

interface SystemCrashProps {
    isExiting?: boolean;
}

const SystemCrash: React.FC<SystemCrashProps> = ({ isExiting = false }) => {
  return (
    <div className={`absolute inset-0 z-50 bg-[#0078d7] flex flex-col items-center justify-center p-4 font-mono text-white cursor-none overflow-hidden select-none animate-bsod-enter rounded-lg transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-full max-w-lg space-y-4 sm:space-y-6 transform scale-75 sm:scale-90 origin-center">
        <div className="text-[4rem] sm:text-[6rem] mb-4 animate-pulse leading-none">:(</div>
        
        <div className="space-y-4">
          <h1 className="text-lg sm:text-xl font-normal leading-relaxed">
            Your terminal ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.
          </h1>
          
          <div className="text-lg sm:text-xl mt-4">
            0% complete
          </div>
        </div>

        <div className="flex flex-row items-center mt-8 gap-4 pt-4">
          <div className="w-16 h-16 bg-white p-1 flex-shrink-0">
            <div className="w-full h-full bg-[#0078d7] flex items-center justify-center border-2 border-[#0078d7]">
                <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
                    <div className="bg-white"></div>
                    <div className="bg-[#0078d7]"></div>
                    <div className="bg-[#0078d7]"></div>
                    <div className="bg-white"></div>
                </div>
            </div>
          </div>
          
          <div className="space-y-1 text-xs opacity-90">
            <p>For more information about this issue and possible fixes, visit https://www.windows.com/stopcode</p>
            <p className="mt-2">If you call a support person, give them this info:</p>
            <p>Stop code: CRITICAL_PROCESS_DIED</p>
          </div>
        </div>
      </div>
      
      {/* Glitch Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10 animate-glitch-overlay bg-repeat" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/ %3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'1\'/ %3E%3C/svg%3E")' }}></div>
    </div>
  );
};

export default SystemCrash;