import React, { useState } from 'react';
import { Settings, Volume2, VolumeX, Vibrate, VibrateOff, Star, X, Info, Code } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import AboutWebsiteModal from './AboutWebsiteModal';

const SettingsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const { 
    soundEnabled, 
    setSoundEnabled, 
    hapticEnabled, 
    setHapticEnabled, 
    easterEggsFound,
    playSound,
    triggerHaptic 
  } = usePreferences();

  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    if (newValue) {
      playSound('click');
    }
    triggerHaptic('light');
  };

  const handleHapticToggle = () => {
    const newValue = !hapticEnabled;
    setHapticEnabled(newValue);
    playSound('click');
    if (newValue) {
      triggerHaptic('medium');
    }
  };

  const easterEggProgress = () => {
    const totalEggs = 4; // We now have 5 easter eggs
    return Math.round((easterEggsFound.length / totalEggs) * 100);
  };

  const easterEggHints = [
    { id: 'konami-master', hint: 'Konami Code on the home page: ↑ ↑ ↓ ↓ ← → ← → B A' },
    { id: 'sequence-master', hint: 'Type H, A, R, I on your keyboard' },
    { id: 'dev-sequence', hint: 'Type D, E, V on your keyboard' },
    { id: 'about-photo-click', hint: 'Click on the photo in the about page' }
  ];

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          playSound('click');
          triggerHaptic('light');
        }}
        className="global-settings-fab cursor-target fixed bottom-6 right-6 z-[9999] p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 border border-gray-200 dark:border-gray-700"
        aria-label="Settings"
      >
        <Settings 
          size={24} 
          className={`text-gray-600 dark:text-gray-400 transition-transform duration-300 ${
            isOpen ? 'rotate-90' : ''
          }`} 
        />
      </button>

      {/* Settings Panel */}
      <div className={`fixed bottom-24 right-6 z-[9999] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform ${
        isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
      }`}>
        <div className="p-6 w-80">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Settings
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <X size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* About This Website */}
          <div className="mb-6">
            <button
              onClick={() => {
                setShowAboutModal(true);
                setIsOpen(false);
                playSound('click');
              }}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Code size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">About This Website</div>
                  <div className="text-[10px] text-blue-100 font-medium">See how it was built</div>
                </div>
              </div>
              <Info size={18} className="text-white/80 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center space-x-3">
              {soundEnabled ? (
                <Volume2 size={20} className="text-blue-500" />
              ) : (
                <VolumeX size={20} className="text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sound Effects
              </span>
            </div>
            <button
              onClick={handleSoundToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                soundEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Haptic Toggle */}
          <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center space-x-3">
              {hapticEnabled ? (
                <Vibrate size={20} className="text-purple-500" />
              ) : (
                <VibrateOff size={20} className="text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Haptic Feedback
              </span>
            </div>
            <button
              onClick={handleHapticToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                hapticEnabled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  hapticEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Easter Egg Progress */}
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <Star size={20} className="text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Easter Eggs
                </span>
              </div>
              <button
                onClick={() => setShowHints(!showHints)}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Info size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span>Found: {easterEggsFound.length}/4</span>
              <span>{easterEggProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${easterEggProgress()}%` }}
              />
            </div>
            {easterEggsFound.length === 4 && (
              <div className="mt-2 text-xs text-center text-yellow-600 dark:text-yellow-400 font-medium">
                🎉 All Easter Eggs Found! 🎉
              </div>
            )}
            {showHints && (
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400">Hints:</h4>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  {easterEggHints.map(egg => (
                    <li key={egg.id} className={easterEggsFound.includes(egg.id) ? 'line-through' : ''}>
                      - {egg.hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Hint */}
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 <strong>Tip:</strong> Try clicking hidden areas, hovering over elements, or using keyboard shortcuts to discover Easter eggs!
            </p>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9998] bg-black bg-opacity-10 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      {/* About Modal */}
      {showAboutModal && (
        <AboutWebsiteModal onClose={() => setShowAboutModal(false)} />
      )}
    </>
  );
};

export default SettingsPanel;