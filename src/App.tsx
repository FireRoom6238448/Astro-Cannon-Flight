/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Game } from './game/Game';
import { MobileControls } from './components/MobileControls';
import { Maximize, Minimize } from 'lucide-react';

type GameState = 'START' | 'PLAYING' | 'GAME_OVER';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const finalScoreRef = useRef<number>(0);
  const [gameState, setGameState] = useState<GameState>('START');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('asteroidEvasion_highScore') || '0', 10);
  });
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (!canvasRef.current || gameState !== 'PLAYING') return;

    const game = new Game(canvasRef.current);
    gameRef.current = game;
    
    game.onScoreUpdate = (newScore) => {
      finalScoreRef.current = newScore;
      if (scoreRef.current) {
        scoreRef.current.textContent = newScore.toString();
      }
    };

    game.onGameOver = () => {
      setGameState('GAME_OVER');
      setHighScore((prev) => {
        if (finalScoreRef.current > prev) {
          localStorage.setItem('asteroidEvasion_highScore', finalScoreRef.current.toString());
          return finalScoreRef.current;
        }
        return prev;
      });
    };

    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, [gameState]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050510] text-white font-mono selection:bg-cyan-500/30">
      <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full block outline-none touch-none ${gameState !== 'PLAYING' ? 'hidden' : ''}`} tabIndex={0} />
      
      <button 
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-50 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-xl border border-white/10 transition-colors"
      >
        {isFullscreen ? <Minimize className="w-6 h-6 text-cyan-400" /> : <Maximize className="w-6 h-6 text-cyan-400" />}
      </button>

      {gameState === 'START' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050510] z-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050510] to-[#050510]">
          <div className="p-8 md:p-12 border border-cyan-500/20 rounded-3xl flex flex-col items-center max-w-lg w-[90%] shadow-[0_0_50px_rgba(6,182,212,0.1)] text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-br from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-4 tracking-widest uppercase relative">
              Asteroid<br/>Evasion
            </h1>
            <p className="text-cyan-400/80 text-sm md:text-base tracking-widest uppercase mb-12 font-semibold">Survival Protocol Initiated</p>
            
            <button 
              onClick={() => setGameState('PLAYING')}
              className="w-full py-4 bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all duration-300 border border-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] tracking-widest uppercase text-sm md:text-base relative overflow-hidden group"
            >
              <span className="relative z-10">Launch Sequence</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            </button>
          </div>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <>
          {/* UI Overlay */}
          <div className="absolute top-4 left-4 p-4 md:p-6 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 select-none shadow-2xl z-10 pointer-events-none">
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-br from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-1 md:mb-2 tracking-widest uppercase">
              Asteroid Evasion
            </h1>
            <div className="flex items-baseline gap-2">
              <span className="text-xs md:text-sm text-cyan-500/80 uppercase tracking-widest font-semibold">Score</span>
              <span ref={scoreRef} className="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">0</span>
            </div>
            
            <div className="hidden md:block mt-6 space-y-1">
              <p className="text-[10px] text-cyan-500/60 uppercase tracking-[0.2em] border-b border-white/10 pb-1 mb-2 font-bold">Flight Systems</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-gray-400">
                <span className="text-white/80 font-bold bg-white/10 px-1 rounded text-center">W / S</span><span className="text-right">Thrust / Brake</span>
                <span className="text-white/80 font-bold bg-white/10 px-1 rounded text-center">A / D</span><span className="text-right">Yaw L / R</span>
                <span className="text-white/80 font-bold bg-white/10 px-1 rounded text-center">Q / E</span><span className="text-right">Pitch Dn / Up</span>
              </div>
            </div>
          </div>

          <MobileControls />
        </>
      )}

      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
          <div className="p-8 md:p-12 bg-red-950/40 border border-red-500/30 rounded-3xl flex flex-col items-center max-w-lg w-[90%] shadow-[0_0_50px_rgba(220,38,38,0.2)] text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />
            <h2 className="text-3xl md:text-5xl font-black text-red-500 mb-2 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] relative">
              Hull Breach
            </h2>
            <p className="text-red-400/80 text-sm md:text-base tracking-widest uppercase mb-8 font-semibold relative">Critical Failure Detected</p>
            
            <div className="bg-black/50 w-full py-4 rounded-xl border border-white/5 mb-8 relative">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Final Score</p>
              <p className="text-4xl md:text-5xl font-bold text-white mb-4">{finalScoreRef.current}</p>
              <div className="w-16 h-px bg-white/10 mx-auto mb-4"></div>
              <p className="text-[10px] text-cyan-500/80 uppercase tracking-widest mb-1">All-Time High Score</p>
              <p className="text-xl md:text-2xl font-bold text-cyan-400">{highScore}</p>
            </div>

            <button 
              onClick={() => setGameState('START')}
              className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all duration-300 border border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] tracking-widest uppercase text-sm md:text-base relative"
            >
              Reboot Systems
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
