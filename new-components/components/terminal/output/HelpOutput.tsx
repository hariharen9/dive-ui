import React from 'react';

const HelpOutput: React.FC = () => (
  <div className="space-y-2 text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
    <div className="text-cyan-600 dark:text-cyan-400 font-bold mb-3">📚 Available Commands:</div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">help</span> - Show this help message</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">whoami</span> - About me</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">socials</span> - Social media links</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">skills</span> - Technical skills</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">experience</span> - My Journey</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">projects</span> - Featured projects</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">contact</span> - Contact information</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">neofetch</span> - System info</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">top</span> - System monitor</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">ls [path]</span> - List directory</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">cat &lt;file&gt;</span> - Read file</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">cd &lt;dir&gt;</span> - Change directory</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">pwd</span> - Current directory</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">clear</span> - Clear terminal</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">resume</span> - View my resume</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">start-game</span> - Play Number Guess</div>
      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">start-snake</span> - Play Snake 🐍</div>
    </div>
    <div className="text-purple-600 dark:text-purple-400 mt-3">🎮 Easter Eggs: sudo, rm -rf /, matrix, hack, coffee</div>
    <div className="text-pink-600 dark:text-pink-400">💡 Explore: projects/, skills/</div>
  </div>
);

export default HelpOutput;
