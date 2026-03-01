import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface SnakeGameProps {
  onExit: () => void;
}

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

const SnakeGame: React.FC<SnakeGameProps> = ({ onExit }) => {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Use refs for values accessed inside the interval to avoid stale closures
  // without re-creating the interval constantly
  const snakeRef = useRef(snake);
  const directionRef = useRef(direction);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('terminal-snake-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // Make sure food doesn't spawn on snake
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    setFood(newFood);
  }, []);

  const resetGame = () => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    snakeRef.current = initialSnake;
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    generateFood(initialSnake);
    startGameLoop();
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    const currentHead = snakeRef.current[0];
    const currentDirection = directionRef.current;
    
    const newHead = { ...currentHead };

    switch (currentDirection) {
      case 'UP': newHead.y -= 1; break;
      case 'DOWN': newHead.y += 1; break;
      case 'LEFT': newHead.x -= 1; break;
      case 'RIGHT': newHead.x += 1; break;
    }

    // Check collisions
    if (
      newHead.x < 0 || 
      newHead.x >= GRID_SIZE || 
      newHead.y < 0 || 
      newHead.y >= GRID_SIZE ||
      snakeRef.current.some(segment => segment.x === newHead.x && segment.y === newHead.y)
    ) {
      handleGameOver();
      return;
    }

    const newSnake = [newHead, ...snakeRef.current];
    
    // Check food
    if (newHead.x === food.x && newHead.y === food.y) {
      setScore(s => {
        const newScore = s + 10;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('terminal-snake-highscore', newScore.toString());
        }
        return newScore;
      });
      generateFood(newSnake);
    } else {
      newSnake.pop(); // Remove tail
    }

    setSnake(newSnake);
  }, [food, gameOver, isPaused, highScore, generateFood]);

  const handleGameOver = () => {
    setGameOver(true);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
  };

  const startGameLoop = useCallback(() => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    gameLoopRef.current = setInterval(moveSnake, INITIAL_SPEED);
  }, [moveSnake]);

  useEffect(() => {
    startGameLoop();
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [startGameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
          if (directionRef.current !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (directionRef.current !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (directionRef.current !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (directionRef.current !== 'LEFT') setDirection('RIGHT');
          break;
        case 'Escape':
          onExit();
          break;
        case ' ':
          if (gameOver) resetGame();
          else setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, onExit]);

  return (
    <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center font-mono text-green-500 rounded-b-lg">
      <div className="absolute top-4 right-4">
        <button 
          onClick={onExit}
          className="p-1 hover:bg-green-500/20 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold mb-2">🐍 TERMINAL SNAKE</h2>
        <div className="flex gap-6 text-sm">
          <span>SCORE: {score}</span>
          <span>HIGH SCORE: {highScore}</span>
        </div>
      </div>

      <div 
        className="relative bg-black border-2 border-green-500/50"
        style={{
          width: '300px',
          height: '300px',
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
        }}
      >
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 text-center p-4">
            <h3 className="text-xl font-bold text-red-500 mb-2">GAME OVER</h3>
            <p className="mb-4 text-sm">Score: {score}</p>
            <p className="text-xs text-green-400 animate-pulse">Press SPACE to Restart</p>
            <p className="text-xs text-gray-400 mt-2">Press ESC to Quit</p>
          </div>
        )}
        
        {isPaused && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <p className="text-xl font-bold text-yellow-500 animate-pulse">PAUSED</p>
          </div>
        )}

        {/* Grid Cells */}
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const isSnake = snake.some(s => s.x === x && s.y === y);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isFood = food.x === x && food.y === y;

          let cellClass = '';
          if (isHead) cellClass = 'bg-green-400';
          else if (isSnake) cellClass = 'bg-green-600/80';
          else if (isFood) cellClass = 'bg-red-500 animate-pulse rounded-full transform scale-75';

          return (
            <div key={i} className={`w-full h-full ${cellClass}`} />
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Use ARROW KEYS to move</p>
        <p>SPACE to pause/restart • ESC to quit</p>
      </div>
    </div>
  );
};

export default SnakeGame;
