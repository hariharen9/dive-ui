import React, { useState, useEffect, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Keyboard, LayoutGrid } from 'lucide-react';
import AnimatedWelcome from './terminal/AnimatedWelcome';
import SystemCrash from './terminal/SystemCrash';
import { getNode } from '../data/fileSystem';
import './Terminal.css';
import { HistoryLine } from './terminal/types';
import { executeSingleCommand, handleCd, COMMANDS } from './terminal/commands';
import { usePreferences } from '../contexts/PreferencesContext';

const MatrixRain = React.lazy(() => import('./terminal/MatrixRain'));
const SnakeGame = React.lazy(() => import('./terminal/SnakeGame'));

interface TerminalProps {
  isActive: boolean;
  onSwitchView?: () => void;
  setIsFocused: (isFocused: boolean) => void;
}

const QUICK_COMMANDS = [
  { cmd: 'whoami', label: 'Who Am I 👤' },
  { cmd: 'skills', label: 'Skills ⚡' },
  { cmd: 'projects', label: 'Projects 🚀' },
  { cmd: 'experience', label: 'Experience 💼' },
  { cmd: 'socials', label: 'Socials 🌐' },
  { cmd: 'neofetch', label: 'Sys Info 🖥️' },
  { cmd: 'contact', label: 'Contact 📬' },
  { cmd: 'help', label: 'Help ❓' },
];

const Terminal: React.FC<TerminalProps> = ({ isActive, onSwitchView, setIsFocused }) => {
  const { playSound } = usePreferences();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryLine[]>([
    { type: 'output', content: <AnimatedWelcome /> },
    { type: 'output', content: '' }
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cwd, setCwd] = useState('~');
  const [showMatrix, setShowMatrix] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [snakeActive, setSnakeActive] = useState(false);
  const [secretNumber, setSecretNumber] = useState<number | null>(null);
  const [guessesLeft, setGuessesLeft] = useState(0);
  const [showCrash, setShowCrash] = useState(false);
  const [crashExiting, setCrashExiting] = useState(false);
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);
  const [isMobileMode, setIsMobileMode] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (window.innerWidth < 640) {
      setIsMobileMode(true);
    }
  }, []);

  useEffect(() => {
    if (isActive && !snakeActive && !isMobileMode) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, snakeActive, isMobileMode]);

  const handleButtonHover = (e: React.MouseEvent<HTMLElement>, message: string) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ content: message, x: rect.left, y: rect.top - 10 });
    tooltipTimeoutRef.current = setTimeout(() => setTooltip(null), 2000);
  };

  const handleButtonLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setTooltip(null);
  };

  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [history, isMobileMode]);

  const addToHistory = (lines: HistoryLine[]) => {
    setHistory(prev => [...prev, ...lines]);
  };

  const handleCrash = () => {
    setShowCrash(true);
    setCrashExiting(false);
    
    // Start fade out slightly before removal
    setTimeout(() => {
        setCrashExiting(true);
    }, 7500);

    setTimeout(() => {
        setShowCrash(false);
        setCrashExiting(false);
        addToHistory([{ type: 'output', content: '😅 System rebooted successfully. Phew! That was close. Please don\'t try to delete the internet again.' }]);
    }, 8000);
  };

  const executeCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    setCommandHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);
    addToHistory([{ type: 'command', content: trimmedCmd, cwd }]);

    if (gameActive) {
      handleGuess(trimmedCmd);
      return;
    }
    
    // 'cd' is a special case that modifies shell state directly
    const commandParts = trimmedCmd.split(' ');
    const command = commandParts[0].toLowerCase();

    if (command === 'cd') {
        const { newCwd, error } = handleCd(commandParts.slice(1), cwd);
        if (error) {
            playSound('error');
            addToHistory([{ type: 'error', content: error }]);
        }
        setCwd(newCwd);
        return;
    }

    const commands = trimmedCmd.split('|').map(c => c.trim());
    let inputData: any = null;
    let output: HistoryLine | null = null;

    for (let i = 0; i < commands.length; i++) {
      const singleCmd = commands[i];
      const isLastCommand = i === commands.length - 1;
      const parts = singleCmd.split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);
      
      const result = await executeSingleCommand(
          command, 
          args, 
          inputData, 
          isLastCommand,
          cwd,
          setShowMatrix,
          () => setHistory([]),
          setGameActive,
          setSecretNumber,
          setGuessesLeft,
          setSnakeActive,
          handleCrash
        );

      if (result.type === 'error') {
        playSound('error');
        output = result;
        break; // Stop execution on error
      }
      
      inputData = result.content; // Pass output as input to the next command
      
      if (isLastCommand) {
        output = { type: 'output', content: result.content };
      }
    }

    if (output) {
      addToHistory([output]);
    }
  };

  const handleGuess = (guess: string) => {
    const num = parseInt(guess, 10);
    if (isNaN(num)) {
      playSound('error');
      addToHistory([{ type: 'error', content: "That's not a number! Try again." }]);
      return;
    }

    const newGuessesLeft = guessesLeft - 1;

    if (num === secretNumber) {
      playSound('success');
      addToHistory([{ type: 'output', content: `🎉 You guessed it! The number was ${secretNumber}.` }]);
      setGameActive(false);
    } else if (newGuessesLeft === 0) {
      playSound('error');
      addToHistory([{ type: 'output', content: `😥 Out of guesses! The number was ${secretNumber}. Better luck next time!` }]);
      setGameActive(false);
    } else {
      setGuessesLeft(newGuessesLeft);
      if (num < secretNumber!) {
        addToHistory([{ type: 'output', content: `Higher... You have ${newGuessesLeft} guesses left.` }]);
      } else {
        addToHistory([{ type: 'output', content: `Lower... You have ${newGuessesLeft} guesses left.` }]);
      }
    }
  }
  
  const handleTabCompletion = () => {
    const parts = input.split(' ');
    const currentWord = parts[parts.length - 1];

    if (parts.length === 1) {
      // Command completion
      const matchingCommands = COMMANDS.filter(c => c.startsWith(currentWord));
      if (matchingCommands.length === 1) {
        setInput(matchingCommands[0] + ' ');
      }
    } else {
      // File/directory completion
      const command = parts[0];
      if (command === 'cd' || command === 'cat' || command === 'ls') {
        const path = parts.length > 1 ? parts[parts.length - 1] : '';
        const parentPath = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : (cwd === '~' ? '' : cwd);
        const partialName = path.includes('/') ? path.substring(path.lastIndexOf('/') + 1) : path;

        const nodePath = parentPath === '' ? (cwd === '~' ? '/' : cwd) : (cwd === '~' ? parentPath : `${cwd}/${parentPath}`);
        const node = getNode(nodePath);

        if (node && node.type === 'directory' && node.children) {
          const childrenNames = Object.keys(node.children);
          const matchingFiles = childrenNames.filter(name => name.startsWith(partialName));

          if (matchingFiles.length === 1) {
            const completedPath = parentPath ? `${parentPath}/${matchingFiles[0]}` : matchingFiles[0];
            const newParts = [...parts.slice(0, parts.length - 1), completedPath];
            setInput(newParts.join(' ') + (node.children[matchingFiles[0]].type === 'directory' ? '/' : ' '));
          }
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
    }

    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      handleTabCompletion();
    }
  };

  return (
    <>
      <div 
        className="flex flex-col h-full bg-white/90 dark:bg-[#0d1117]/95 border border-gray-200 dark:border-gray-600/50 rounded-lg shadow-2xl w-full max-w-2xl mx-auto backdrop-blur-sm transition-colors duration-300 relative overflow-hidden"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        tabIndex={isActive ? 0 : -1}
        onKeyDown={(e) => {
          if (snakeActive) return; // Let snake game handle keys
          if (e.key === 'Enter' || e.key === 'Tab') {
            e.stopPropagation();
          }
        }}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-200 dark:border-gray-600/50 flex-shrink-0">
          <div className="flex space-x-1.5 sm:space-x-2">
            <div 
              onMouseEnter={(e) => handleButtonHover(e, "It's glued on. You're stuck with me. 😄")}
              onMouseLeave={handleButtonLeave}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors cursor-pointer"></div>
            <div 
              onMouseEnter={(e) => handleButtonHover(e, "Nope, can't hide from my awesomeness.")}
              onMouseLeave={handleButtonLeave}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 transition-colors cursor-pointer"></div>
            <div 
              onMouseEnter={(e) => handleButtonHover(e, "Already at maximum awesome.")}
              onMouseLeave={handleButtonLeave}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full hover:bg-green-600 transition-colors cursor-pointer"></div>
          </div>
          <p className="flex-1 text-center text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 font-mono truncate px-2">
            root@prod: {cwd}
          </p>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMobileMode(!isMobileMode)}
              onMouseEnter={(e) => handleButtonHover(e, isMobileMode ? "Switch to keyboard mode" : "Switch to mobile buttons")}
              onMouseLeave={handleButtonLeave}
              className={`p-1 sm:p-1.5 rounded-md transition-all duration-300 group flex-shrink-0 sm:hidden shadow-[0_0_15px_rgba(59,130,246,0.4)] ${
                isMobileMode 
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse' 
                  : 'bg-blue-500/5 text-gray-500 dark:text-gray-400 hover:bg-blue-500/10'
              }`}
            >
              {isMobileMode ? (
                <Keyboard size={14} className="sm:w-4 sm:h-4" />
              ) : (
                <LayoutGrid size={14} className="sm:w-4 sm:h-4" />
              )}
            </button>
            {onSwitchView && (
              <button
                onClick={onSwitchView}
                className="p-1 sm:p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors group flex-shrink-0"
                title="Switch to photo view"
              >
                <Camera size={14} className="sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
              </button>
            )}
          </div>
        </div>

        {/* Terminal Body */}
        <div
          ref={terminalBodyRef}
          className="p-3 sm:p-4 font-mono text-[11px] sm:text-xs md:text-sm text-gray-800 dark:text-white flex-grow overflow-auto overscroll-contain"
          onClick={() => !snakeActive && !isMobileMode && inputRef.current?.focus()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.stopPropagation();
            }
          }}
        >
          {history.map((line, index) => (
            <div key={index} className="animate-fade-in mb-1">
              {line.type === 'command' ? (
                <div className="flex">
                  <span className="text-green-600 dark:text-green-400 mr-2 flex-shrink-0 font-bold">
                    {line.cwd} $
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">{line.content}</span>
                </div>
              ) : line.type === 'error' ? (
                <div className="text-red-600 dark:text-red-400 font-bold">{line.content}</div>
              ) : (
                <div className="text-gray-700 dark:text-gray-300">
                  {Array.isArray(line.content) ? (
                    <pre className="whitespace-pre-wrap font-mono">{line.content.join('\n')}</pre>

                  ) : (
                    line.content
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Input Line */}
          {!snakeActive && !isMobileMode && (
            <div className="flex items-center mt-1">
              <span className="text-green-600 dark:text-green-400 mr-2 flex-shrink-0 font-bold">{cwd} $</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-gray-700 dark:text-gray-300 caret-green-600 dark:caret-green-400 touch-manipulation font-mono"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
          )}

          {/* Quick Actions (Mobile Mode) */}
          {!snakeActive && isMobileMode && (
            <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700/50 animate-fade-in-up">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-bold uppercase tracking-wider">Quick Actions:</div>
              <div className="flex flex-wrap gap-2">
                {QUICK_COMMANDS.map((item) => (
                  <button
                    key={item.cmd}
                    onClick={() => executeCommand(item.cmd)}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full text-xs font-mono border border-gray-200 dark:border-gray-700 transition-all duration-200 active:scale-95"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => executeCommand('clear')}
                  className="px-3 py-1.5 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-mono border border-red-100 dark:border-red-900/30 transition-all duration-200 active:scale-95 ml-auto"
                >
                  Clear 🧹
                </button>
              </div>
            </div>
          )}

          <div ref={historyEndRef} />
        </div>
        
        {/* Snake Game Overlay */}
        {snakeActive && (
          <Suspense fallback={<div className="absolute inset-0 bg-black/90 flex items-center justify-center text-green-500">Loading Snake...</div>}>
            <SnakeGame onExit={() => {
              setSnakeActive(false);
              setTimeout(() => inputRef.current?.focus(), 100);
            }} />
          </Suspense>
        )}

        {/* System Crash Effect - Contained within Terminal */}
        {showCrash && <SystemCrash isExiting={crashExiting} />}
      </div>


      {/* Matrix Effect */}
      {showMatrix && <Suspense fallback={null}><MatrixRain /></Suspense>}

      {tooltip && createPortal(
        <div 
          className="fixed z-[10000] px-3 py-1 text-xs text-white bg-black/50 rounded-md shadow-lg pointer-events-none"
          style={{ top: tooltip.y, left: tooltip.x, transform: 'translateY(-100%)' }}
        >
          {tooltip.content}
        </div>,
        document.body
      )}
    </>
  );
};

export default Terminal;