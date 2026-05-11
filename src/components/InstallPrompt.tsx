import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running as standalone (installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isiOS);

    // Listen for the native install prompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Don't show button if already installed
  if (isStandalone) return null;
  // Don't show if not iOS and no native prompt available
  if (!isIOS && !canInstall) return null;

  const handleInstallClick = async () => {
    if (canInstall && deferredPrompt.current) {
      // Android / Chrome: trigger native install prompt
      await deferredPrompt.current.prompt();
      const choice = await deferredPrompt.current.userChoice;
      if (choice.outcome === 'accepted') {
        setCanInstall(false);
      }
      deferredPrompt.current = null;
    } else if (isIOS) {
      // iOS: show guide modal
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {/* Install Button */}
      <button
        onClick={handleInstallClick}
        className="p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
        title="Add to Home Screen"
      >
        <PlusSquare size={18} strokeWidth={2.5} />
      </button>

      {/* iOS Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 text-center">
                Add to Home Screen
              </h3>

              {/* Step 1 */}
              <div className="flex items-start gap-4 mb-5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-500 font-bold text-sm">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Tap the <Share size={14} className="inline-block mx-1 text-blue-500" /> <strong>Share</strong> button in Safari's toolbar.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4 mb-5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-500 font-bold text-sm">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Scroll down and tap <PlusSquare size={14} className="inline-block mx-1 text-blue-500" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-emerald-500 font-bold text-sm">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Tap <strong>Add</strong> to confirm. ChronoSnap will appear on your home screen!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
