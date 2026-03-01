import React, { lazy, Suspense } from 'react';
import { HistoryLine } from './types';
import { getNode } from '../../data/fileSystem';
import AnimatedResponse from './AnimatedResponse';
import HelpOutput from './output/HelpOutput';

// Lazy load output components
const WhoamiOutput = lazy(() => import('./output/WhoamiOutput'));
const SocialsOutput = lazy(() => import('./output/SocialsOutput'));
const LsOutput = lazy(() => import('./output/LsOutput'));
const NeofetchOutput = lazy(() => import('./output/NeofetchOutput'));
const SkillsOutput = lazy(() => import('./output/SkillsOutput'));
const ProjectsOutput = lazy(() => import('./output/ProjectsOutput'));
const ExperienceOutput = lazy(() => import('./output/ExperienceOutput'));
const ContactOutput = lazy(() => import('./output/ContactOutput'));
const TopOutput = lazy(() => import('./output/TopOutput'));

export const COMMANDS = [
    'help', 'whoami', 'socials', 'skills', 'experience', 'projects', 'contact', 
    'neofetch', 'fetch', 'ls', 'cat', 'cd', 'pwd', 'clear', 
    'sudo', 'rm', 'matrix', 'hack', 'coffee', 'date', 'echo', 'exit', 'quit',
    'resume', 'start-game', 'stop-game', 'start-snake', 'weather', 'top'
  ];

// Helper to render lazy components with Suspense
const renderLazyOutput = (Component: React.LazyExoticComponent<any>, props = {}) => (
  <Suspense fallback={<div className="text-gray-500 italic">Loading...</div>}>
    <Component {...props} />
  </Suspense>
);

const handleGrep = (args: string[], input: any): HistoryLine => {
    if (args.length === 0) {
        return { type: 'error', content: 'grep: missing pattern' };
    }
    const pattern = args[0];
    const inputAsArray = Array.isArray(input) ? input : (input || '').toString().split('\n');

    const filtered = inputAsArray.filter((line: string) => line.includes(pattern));

    return { type: 'output', content: filtered };
};

const handleLs = (args: string[], isLastCommand: boolean, cwd: string): HistoryLine => {
    const path = args[0] || cwd;
    const node = getNode(path === '~' ? '/' : path);

    if (!node) {
        return { type: 'error', content: `ls: cannot access '${path}': No such file or directory` };
    }

    if (node.type === 'file') {
        return { type: 'output', content: path };
    }

    if (node.children) {
        const items = Object.entries(node.children).map(([name, child]) => ({
            name,
            isDir: child.type === 'directory'
        }));
        if (isLastCommand) {
            return { type: 'output', content: renderLazyOutput(LsOutput, { items }) };
        }
        return { type: 'output', content: Object.keys(node.children) };
    }
    return { type: 'output', content: [] };
};

const handleCat = (args: string[], cwd: string): HistoryLine => {
    if (args.length === 0) {
        return { type: 'error', content: 'cat: missing file operand' };
    }

    const filename = args[0];
    const fullPath = cwd === '~' ? filename : `${cwd}/${filename}`;
    const node = getNode(fullPath);

    if (!node) {
        return { type: 'error', content: `cat: ${filename}: No such file or directory` };
    }

    if (node.type === 'directory') {
        return { type: 'error', content: `cat: ${filename}: Is a directory` };
    }

    return { type: 'output', content: <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-mono">{node.content}</pre> };
};

const handleWeather = async (args: string[]): Promise<HistoryLine> => {
    const city = args.join('+') || '';
    const url = `https://wttr.in/${city}?ATm`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather service unavailable');
        const text = await response.text();
        return { type: 'output', content: <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm">{text}</pre> };
    } catch (error) {
        return { type: 'error', content: 'Unable to fetch weather data. Please try again later.' };
    }
};

export const handleCd = (args: string[], cwd: string): { newCwd: string, error?: string } => {
    if (args.length === 0 || args[0] === '~') {
      return { newCwd: '~' };
    }

    const target = args[0];

    if (target === '..') {
      if (cwd === '~') return { newCwd: cwd };
      const parts = cwd.split('/');
      parts.pop();
      return { newCwd: parts.length === 0 ? '~' : parts.join('/') };
    }

    const newPath = cwd === '~' ? target : `${cwd}/${target}`;
    const node = getNode(newPath);

    if (!node) {
      return { newCwd: cwd, error: `cd: ${target}: No such file or directory` };
    }

    if (node.type !== 'directory') {
      return { newCwd: cwd, error: `cd: ${target}: Not a directory` };
    }

    return { newCwd: newPath };
};

export const executeSingleCommand = async (
    command: string, 
    args: string[], 
    input: any, 
    isLastCommand: boolean,
    cwd: string,
    showMatrix: (show: boolean) => void,
    clearHistory: () => void,
    setGame: (active: boolean) => void,
    setSecretNumber: (num: number | null) => void,
    setGuessesLeft: (guesses: number) => void,
    setSnakeActive: (active: boolean) => void,
    triggerCrash: () => void
    ): Promise<HistoryLine> => {
    switch (command) {
      case 'help':
        return { type: 'output', content: <HelpOutput /> };
      case 'whoami':
        return { type: 'output', content: renderLazyOutput(WhoamiOutput) };
      case 'socials':
        return { type: 'output', content: renderLazyOutput(SocialsOutput) };
      case 'ls':
        return handleLs(args, isLastCommand, cwd);
      case 'cat':
        return handleCat(args, cwd);
      case 'clear':
        clearHistory();
        return { type: 'output', content: '' };
      case 'sudo':
        const fullCommand = args.join(' ');
        if (fullCommand.includes('rm -rf /') || fullCommand.includes('rm -rf *')) {
            triggerCrash();
            return { type: 'output', content: 'Initiating root sequence...' };
        }
        return { type: 'error', content: '🚫 Nice try! But you\'re not in the sudoers file. This incident will be reported... to nobody. 😄' };
      case 'rm':
        if (args.includes('-rf') && (args.includes('/') || args.includes('*'))) {
          triggerCrash();
          return { type: 'output', content: 'Deleting critical system files...' };
        }
        return { type: 'error', content: 'rm: cannot remove: Permission denied, try sudo' };
      case 'matrix':
        showMatrix(true);
        setTimeout(() => showMatrix(false), 5000);
        return { type: 'output', content: 'Entering the matrix...' };
      case 'pwd':
        return { type: 'output', content: cwd === '~' ? '/home/hariharen' : `/home/hariharen/${cwd}` };
      case 'date':
        return { type: 'output', content: new Date().toString() };
      case 'echo':
        const contentToEcho = input ? String(input) : args.join(' ');
        return { type: 'output', content: contentToEcho };
      case 'neofetch':
      case 'fetch':
        return { type: 'output', content: renderLazyOutput(NeofetchOutput) };
      case 'skills':
        return { type: 'output', content: renderLazyOutput(SkillsOutput) };
      case 'experience':
        return { type: 'output', content: renderLazyOutput(ExperienceOutput) };
      case 'projects':
        return { type: 'output', content: renderLazyOutput(ProjectsOutput) };
      case 'contact':
        return { type: 'output', content: renderLazyOutput(ContactOutput) };
      case 'hack':
        const hackFrames = [
            '🔐 Initiating hacker mode...', 
            '⚡ Bypassing firewall...', 
            '🎯 Accessing mainframe...', 
            '❌ Just kidding! I\'m a developer, not a hacker. 😄'
        ];
        return { type: 'output', content: <AnimatedResponse frames={hackFrames} delay={400} /> };
      case 'coffee':
        const coffeeFrames = [
            '☕ Brewing coffee...', 
            'This might take a while.', 
            '☕ Coffee ready!', 
            '*sip* Ahh, much better.', 
            'Now back to coding!'
        ];
        return { type: 'output', content: <AnimatedResponse frames={coffeeFrames} delay={800} /> };
      case 'exit':
      case 'quit':
        return { type: 'output', content: '👋 Thanks for visiting! But you can\'t escape that easily... 😉' };
      case 'grep':
        return handleGrep(args, input);
      case 'resume':
        window.open('https://drive.google.com/file/d/1emagYjcTNNaGeL23jY2i1icrTJSoKxGr/view?usp=sharing', '_blank');
        return { type: 'output', content: 'Opening resume in a new tab...' };
    case 'start-game':
        setGame(true);
        setSecretNumber(Math.floor(Math.random() * 100) + 1);
        setGuessesLeft(7);
        return { type: 'output', content: '🎮 Guess the number between 1 and 100. You have 7 guesses!' };
      case 'stop-game':
        setGame(false);
        return { type: 'output', content: 'Game stopped.' };
      case 'start-snake':
        setSnakeActive(true);
        return { type: 'output', content: '🐍 Starting Snake... GLHF!' };
      case 'top':
        return { type: 'output', content: renderLazyOutput(TopOutput) };
      case 'weather':
        return await handleWeather(args);
      default:
        return { type: 'error', content: `Command not found: ${command}. Type "help" for available commands.` };
    }
  };
