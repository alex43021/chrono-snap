import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TimeItem } from '../hooks/useTimeProgress';

interface ProgressBarProps {
  label: string;
  data: TimeItem;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ label, data, className }) => {
  const percentage = data.percent;
  const formatted = percentage.toFixed(4);
  const [integerPart, fractionalPart] = formatted.split('.');

  // Elegant, matte color palette without extreme glow or pulse animations
  const { colorTheme, isUrgent } = useMemo(() => {
    if (percentage >= 80) return { colorTheme: 'urgent', isUrgent: true };
    if (percentage >= 50) return { colorTheme: 'warning', isUrgent: false };
    return { colorTheme: 'safe', isUrgent: false };
  }, [percentage]);

  const themeClasses = {
    safe: {
      text: 'text-slate-800 dark:text-slate-200',
      bar: 'bg-slate-800 dark:bg-slate-300',
      track: 'bg-slate-200 dark:bg-white/10'
    },
    warning: {
      text: 'text-amber-700 dark:text-amber-400',
      bar: 'bg-amber-500 dark:bg-amber-500',
      track: 'bg-amber-100 dark:bg-amber-900/30'
    },
    urgent: {
      text: 'text-red-600 dark:text-red-400',
      bar: 'bg-red-500 dark:bg-red-500',
      track: 'bg-red-100 dark:bg-red-900/30'
    }
  };

  const currentTheme = themeClasses[colorTheme as keyof typeof themeClasses];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={twMerge("flex flex-col gap-1.5 mb-5 w-full", className)}
    >
      <div className="flex justify-between items-end px-1">
        <div className="flex flex-col">
          <span className={clsx("text-[10px] font-semibold tracking-wider uppercase transition-colors duration-500", isUrgent ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400")}>
            {label}
          </span>
          <span className={clsx("text-xs font-mono font-medium mt-0.5 transition-colors duration-500", currentTheme.text)}>
            {percentage >= 100 ? 'COMPLETED' : data.remainingText}
          </span>
        </div>
        <div className={clsx("font-mono flex items-baseline transition-colors duration-500", currentTheme.text)}>
          {percentage >= 100 ? (
            <span className="text-lg font-semibold tracking-tight">100%</span>
          ) : (
            <>
              <span className="text-lg font-semibold tracking-tight">{integerPart}</span>
              <span className="text-xs font-medium opacity-70">.{fractionalPart}%</span>
            </>
          )}
        </div>
      </div>
      
      {/* Clean, simple track without drop shadows or glass borders */}
      <div className={clsx(
        "h-2 w-full rounded-full overflow-hidden transition-colors duration-500",
        currentTheme.track
      )}>
        {/* Solid Fill */}
        <motion.div 
          className={clsx(
            "h-full rounded-full transition-colors duration-500", 
            currentTheme.bar
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 15, mass: 1 }}
        />
      </div>
    </motion.div>
  );
};
