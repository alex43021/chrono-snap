import React, { useRef, useState } from 'react';
import { Camera, X, Download, Move, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import * as htmlToImage from 'html-to-image';

interface CameraOverlayProps {
  children: React.ReactNode;
  onBeforeExport?: (proceed: () => Promise<void>) => void;
  onAfterExport?: () => void;
  actionButtons?: React.ReactNode;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({ children, onBeforeExport, onAfterExport, actionButtons }) => {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  
  // Dragging & Zooming state
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
  const [bgScale, setBgScale] = useState(1);
  const [showDragHint, setShowDragHint] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startBgPos = useRef({ x: 0, y: 0 });
  
  // Multi-touch tracking
  const activePointers = useRef<Map<number, { x: number, y: number }>>(new Map());
  const initialPinchDistance = useRef<number | null>(null);
  const initialPinchScale = useRef<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBgImage(reader.result as string);
        setBgPos({ x: 0, y: 0 });
        setBgScale(1);
        setShowDragHint(true);
        setTimeout(() => setShowDragHint(false), 4000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!bgImage) return;
    
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 1) {
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      startBgPos.current = { ...bgPos };
    } else if (activePointers.current.size === 2) {
      isDragging.current = false; // Stop panning while pinching
      const points = Array.from(activePointers.current.values());
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      initialPinchDistance.current = dist;
      initialPinchScale.current = bgScale;
    }
    
    setShowDragHint(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(e.pointerId)) return;
    
    // Update pointer position
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 1 && isDragging.current) {
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      setBgPos({
        x: startBgPos.current.x + deltaX,
        y: startBgPos.current.y + deltaY,
      });
    } else if (activePointers.current.size === 2 && initialPinchDistance.current !== null) {
      const points = Array.from(activePointers.current.values());
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const newScale = initialPinchScale.current * (dist / initialPinchDistance.current);
      setBgScale(Math.min(Math.max(0.2, newScale), 5)); // Clamp scale between 0.2 and 5
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(e.pointerId);
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (activePointers.current.size < 2) {
      initialPinchDistance.current = null;
    }
    
    if (activePointers.current.size === 1) {
      // Resume panning with the remaining finger
      isDragging.current = true;
      const remainingPointer = Array.from(activePointers.current.values())[0];
      dragStart.current = { x: remainingPointer.x, y: remainingPointer.y };
      startBgPos.current = { ...bgPos };
    } else if (activePointers.current.size === 0) {
      isDragging.current = false;
    }
  };

  const executeExport = async () => {
    if (!captureRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await htmlToImage.toPng(captureRef.current, {
        quality: 1.0,
        pixelRatio: 3,
      });
      const link = document.createElement('a');
      link.download = `chrono-snap-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
      alert('Failed to export image');
    } finally {
      setIsExporting(false);
      if (onAfterExport) onAfterExport();
    }
  };

  const handleExportClick = () => {
    if (onBeforeExport) {
      onBeforeExport(executeExport);
    } else {
      executeExport();
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-black overflow-hidden sm:p-8 transition-colors duration-500">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <div 
        ref={captureRef}
        className="relative w-full h-[100dvh] sm:h-auto sm:aspect-[9/16] sm:max-h-[900px] bg-slate-50 dark:bg-[#0f0f11] overflow-hidden sm:rounded-[2rem] shadow-sm flex flex-col transition-colors duration-500"
      >
        {/* Background Image Layer */}
        {bgImage && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <img 
              src={bgImage} 
              alt="Background"
              className="absolute min-w-full min-h-full object-cover max-w-none" 
              style={{ 
                top: '50%', left: '50%',
                transform: `translate(calc(-50% + ${bgPos.x}px), calc(-50% + ${bgPos.y}px)) scale(${bgScale})`,
                willChange: 'transform'
              }} 
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          </div>
        )}

        {/* Touch Interceptor Layer for Background Dragging & Pinching (Only active in Reposition Mode) */}
        {bgImage && isRepositioning && (
          <div 
            className="absolute inset-0 z-20 touch-none cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        )}

        {/* Drag Hint Toast */}
        <AnimatePresence>
          {(showDragHint || isRepositioning) && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
            >
              <div className="bg-black/60 backdrop-blur-md text-white px-5 py-3 rounded-full flex items-center gap-2 shadow-2xl border border-white/20">
                <span className="text-xl">🖐️</span>
                <span className="text-sm font-semibold tracking-wide">Drag to move, Pinch to zoom</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slider for Zoom (Only in Reposition Mode) */}
        <AnimatePresence>
          {isRepositioning && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 w-64 z-50 bg-black/60 backdrop-blur-md rounded-full px-5 py-3 flex items-center gap-3 shadow-2xl border border-white/20"
              onPointerDown={(e) => e.stopPropagation()} // Prevent triggering drag when touching slider
            >
              <span className="text-white/80 text-xs font-mono font-semibold w-9 text-right">
                {Math.round(bgScale * 100)}%
              </span>
              <input 
                type="range" 
                min="0.2" max="3" step="0.05" 
                value={bgScale} 
                onChange={(e) => setBgScale(parseFloat(e.target.value))}
                onPointerDown={(e) => e.stopPropagation()} // Prevent triggering drag when touching slider
                onTouchStart={(e) => e.stopPropagation()} // Ensure native mobile touch works
                className="flex-1 accent-white h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer touch-pan-x"
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Children (The Progress Bars) */}
        <div className={`relative z-10 flex-1 flex flex-col w-full h-full p-6 sm:p-8 transition-opacity duration-500 ${isRepositioning ? 'opacity-20' : 'opacity-100'}`}>
          {children}
        </div>
        
        {/* Watermark only visible in export or at bottom */}
        <div className="absolute bottom-6 left-0 right-0 text-center z-10 opacity-30">
          <span className="text-[10px] tracking-[0.3em] font-semibold text-slate-800 dark:text-white font-mono transition-colors duration-500 uppercase">Chrono·Snap</span>
        </div>
      </div>

      {/* Pill Dock for Actions */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-full shadow-lg z-50 transition-all duration-300 ${isExporting ? 'opacity-0' : 'opacity-100'}`}>
        {isRepositioning ? (
          <button 
            onClick={() => setIsRepositioning(false)}
            className="px-6 py-3 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-full transition-colors flex items-center gap-2"
            title="Done"
          >
            <Check size={18} strokeWidth={3} />
            <span className="text-sm">Done</span>
          </button>
        ) : (
          <>
            {bgImage && (
              <>
                <button 
                  onClick={() => setIsRepositioning(true)}
                  className="p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                  title="Reposition Photo"
                >
                  <Move size={18} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={() => {
                    setBgImage(null);
                    setIsRepositioning(false);
                  }}
                  className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                  title="Remove Photo"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
              title="Take Photo / Upload"
            >
              <Camera size={18} strokeWidth={2.5} />
            </button>
            <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10 mx-1" />
            <button 
              onClick={handleExportClick}
              className="p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
              title="Export Image"
            >
              <Download size={18} strokeWidth={2.5} />
            </button>
            
            {actionButtons && (
              <>
                <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                {actionButtons}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
