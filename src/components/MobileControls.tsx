import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronsUp, ChevronsDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const ControlButton = ({ 
  code, 
  icon: Icon, 
  label, 
  className = "" 
}: { 
  code: string, 
  icon?: any, 
  label?: string, 
  className?: string 
}) => {
  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if ((window as any).setVirtualKey) {
      (window as any).setVirtualKey(code, true);
    }
  };

  const handleEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if ((window as any).setVirtualKey) {
      (window as any).setVirtualKey(code, false);
    }
  };

  return (
    <button
      className={`bg-white/10 active:bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center touch-none select-none transition-colors ${className}`}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
    >
      {Icon && <Icon className="w-8 h-8 text-white/80" />}
      {label && <span className="text-white/80 font-bold">{label}</span>}
    </button>
  );
};

export const MobileControls = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  if (!isTouch) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex justify-between items-end p-6 pb-12 sm:p-12">
      {/* Left side: Pitch and Yaw (D-PAD) */}
      <div className="relative w-44 h-44 pointer-events-auto">
        <ControlButton code="KeyQ" icon={ArrowUp} className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 rounded-t-xl rounded-b-md" />
        <ControlButton code="KeyA" icon={ArrowLeft} className="absolute top-1/2 left-0 -translate-y-1/2 w-14 h-14 rounded-l-xl rounded-r-md" />
        <ControlButton code="KeyD" icon={ArrowRight} className="absolute top-1/2 right-0 -translate-y-1/2 w-14 h-14 rounded-r-xl rounded-l-md" />
        <ControlButton code="KeyE" icon={ArrowDown} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-14 rounded-b-xl rounded-t-md" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]" />
      </div>
      
      {/* Right side: Thrust and Brake */}
      <div className="flex flex-col gap-6 pointer-events-auto">
        <ControlButton 
          code="KeyW" 
          icon={ChevronsUp} 
          className="w-20 h-20 rounded-2xl bg-cyan-500/20 active:bg-cyan-500/40 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
        />
        <ControlButton 
          code="KeyS" 
          icon={ChevronsDown} 
          className="w-16 h-16 rounded-2xl bg-orange-500/10 active:bg-orange-500/30 border-orange-500/30 text-orange-400 self-center" 
        />
      </div>
    </div>
  );
};
