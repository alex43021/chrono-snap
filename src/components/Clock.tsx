import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

export const Clock: React.FC = () => {
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    // High frequency tick (50ms) ensures the clock seconds update exactly when the system clock ticks over,
    // perfectly matching the progress bar updates and preventing visual desync.
    const timer = setInterval(() => setNow(dayjs()), 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col mb-8 mt-4"
    >
      <h1 className="text-7xl font-light tracking-tighter text-slate-900 dark:text-white font-mono flex items-baseline drop-shadow-sm dark:drop-shadow-lg transition-colors duration-500">
        {now.format('HH:mm')}
        <span className="text-3xl text-slate-500 dark:text-white/50 ml-1 font-normal transition-colors duration-500">{now.format('ss')}</span>
      </h1>
      <p className="text-sm font-bold tracking-widest uppercase text-slate-500 dark:text-white/60 mt-2 pl-1 transition-colors duration-500">
        {now.format('MMM DD, YYYY')}
      </p>
    </motion.div>
  );
};
