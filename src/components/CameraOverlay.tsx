import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Download } from 'lucide-react';
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
  
  // Dragging state
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
  const [showDragHint, setShowDragHint] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startBgPos = useRef({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBgImage(reader.result as string);
        setBgPos({ x: 0, y: 0 });
        setShowDragHint(true);
        setTimeout(() => setShowDragHint(false), 4000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!bgImage) return;
    const target = e.target as HTMLElement;
    // Don't drag if clicking on buttons or scrollable areas
    if (target.closest('button') || target.closest('.no-drag')) return;
    
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    startBgPos.current = { ...bgPos };
    e.currentTarget.setPointerCapture(e.pointerId);
    setShowDragHint(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    setBgPos({
      x: startBgPos.current.x + deltaX,
      y: startBgPos.current.y + deltaY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      isDragging.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-full h-[100dvh] sm:h-auto sm:aspect-[9/16] sm:max-h-[900px] bg-slate-50 dark:bg-[#0f0f11] overflow-hidden sm:rounded-[2rem] shadow-sm flex flex-col transition-colors duration-500 ${bgImage ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
      >
        {/* Background Image Layer (Pannable) */}
        {bgImage && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <img 
              src={bgImage} 
              alt="Background"
              className="absolute min-w-full min-h-full object-cover max-w-none" 
              style={{ 
                top: '50%', left: '50%',
                transform: `translate(calc(-50% + ${bgPos.x}px), calc(-50% + ${bgPos.y}px))`,
                willChange: 'transform'
              }} 
            />
            {/* Darker overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          </div>
        )}

        {/* Drag Hint Toast */}
        <AnimatePresence>
          {showDragHint && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
            >
              <div className="bg-black/60 backdrop-blur-md text-white px-5 py-3 rounded-full flex items-center gap-2 shadow-2xl border border-white/20">
                <span className="text-xl">🖐️</span>
                <span className="text-sm font-semibold tracking-wide">Drag to reposition</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Children (The Progress Bars) */}
        <div className="relative z-10 flex-1 flex flex-col w-full h-full p-6 sm:p-8">
          {children}
        </div>
        
        {/* Watermark only visible in export or at bottom */}
        <div className="absolute bottom-6 left-0 right-0 text-center z-10 opacity-30">
          <span className="text-[10px] tracking-[0.3em] font-semibold text-slate-800 dark:text-white font-mono transition-colors duration-500 uppercase">Chrono·Snap</span>
        </div>
      </div>

      {/* Pill Dock for Actions */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-full shadow-lg z-50 transition-opacity duration-300 ${isExporting ? 'opacity-0' : 'opacity-100'}`}>
        {bgImage && (
          <button 
            onClick={() => setBgImage(null)}
            className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
            title="Remove Photo"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
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
      </div>
    </div>
  );
};
