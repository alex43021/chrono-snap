import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { type Project } from '../hooks/useProjects';
import { ProgressBar } from './ProgressBar';
import { calculateProgressData } from '../hooks/useTimeProgress';
import dayjs from 'dayjs';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  now: dayjs.Dayjs; // Pass now down to sync the high frequency ticks
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete, now }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  // Calculate progress on the fly for the card, synced with the main time engine
  const progressData = calculateProgressData(dayjs(project.createdAt), dayjs(project.targetDate), now);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl p-5 shadow-sm transition-colors duration-500 relative group"
    >
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors opacity-40 hover:opacity-100 focus:opacity-100"
        >
          <MoreHorizontal size={18} />
        </button>
        
        <AnimatePresence>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden"
              >
                <button 
                  onClick={() => { setShowMenu(false); onEdit(project); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button 
                  onClick={() => { setShowMenu(false); onDelete(project.id); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1 pr-8">
          {project.title}
        </h2>
        {project.note && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
            {project.note}
          </p>
        )}
        <div className={!project.note ? "mt-4" : ""}>
          <ProgressBar label="Progress" data={progressData} className="mb-0" />
        </div>
      </div>
    </motion.div>
  );
};
