import { useState } from 'react';
import { CameraOverlay } from './components/CameraOverlay';
import { Clock } from './components/Clock';
import { ProgressBar } from './components/ProgressBar';
import { useTimeProgress } from './hooks/useTimeProgress';
import { useTheme } from './hooks/useTheme';
import { useProjects, type Project } from './hooks/useProjects';
import { ProjectCard } from './components/ProjectCard';
import { ProjectFormModal } from './components/ProjectFormModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Plus } from 'lucide-react';
import dayjs from 'dayjs';

function App() {
  const progress = useTimeProgress();
  const { theme, toggleTheme } = useTheme();
  const { projects, addProject, updateProject, deleteProject } = useProjects();

  const lifecycleItems = [
    { id: 'today', label: 'Today', data: progress.today },
    { id: 'week', label: 'This Week', data: progress.week },
    { id: 'month', label: 'This Month', data: progress.month },
    { id: 'year', label: 'This Year', data: progress.year },
  ];

  const allItems = [
    ...projects.map(p => ({ id: p.id, label: p.title, type: 'project' })),
    ...lifecycleItems.map(l => ({ id: l.id, label: l.label, type: 'lifecycle' }))
  ];

  const [visibleItems, setVisibleItems] = useState<string[]>(allItems.map(i => i.id));
  const [isExportSelecting, setIsExportSelecting] = useState(false);
  const [exportProceed, setExportProceed] = useState<(() => Promise<void>) | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleBeforeExport = (proceed: () => Promise<void>) => {
    setExportProceed(() => proceed);
    setIsExportSelecting(true);
  };

  const handleAfterExport = () => {
    setVisibleItems(allItems.map(i => i.id));
  };

  const confirmExport = () => {
    setIsExportSelecting(false);
    if (exportProceed) {
      setTimeout(() => {
        exportProceed();
      }, 300);
    }
  };

  const toggleItem = (id: string) => {
    setVisibleItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSaveProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    if (editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      const newId = addProject(projectData);
      setVisibleItems(prev => [...prev, newId]);
    }
  };

  const openAddModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const themeButton = (
    <button
      onClick={toggleTheme}
      className="p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
      title="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
    </button>
  );

  const addButton = (
    <button
      onClick={openAddModal}
      className="p-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-colors"
      title="Add Project"
    >
      <Plus size={18} strokeWidth={3} />
    </button>
  );

  const actionButtons = (
    <>
      {addButton}
      <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10 mx-1" />
      {themeButton}
    </>
  );

  const nowDayjs = dayjs(progress.now);

  return (
    <>
      <CameraOverlay 
        onBeforeExport={handleBeforeExport} 
        onAfterExport={handleAfterExport}
        actionButtons={actionButtons}
      >
        
        <Clock />
        
        <div className="flex-1 flex flex-col justify-end pb-16 gap-6 w-full max-w-md mx-auto z-10 overflow-y-auto hide-scrollbar no-drag touch-pan-y">
          
          {/* Custom Projects Area */}
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {projects.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center gap-3 transition-colors duration-500 border-dashed"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2">
                    <Plus size={24} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Projects Yet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">Click the + button below to create your first countdown project.</p>
                </motion.div>
              ) : (
                projects.filter(p => visibleItems.includes(p.id)).map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    now={nowDayjs}
                    onEdit={openEditModal}
                    onDelete={deleteProject}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Life Cycles (Shrunk and subtle) */}
          <AnimatePresence>
            {lifecycleItems.some(item => visibleItems.includes(item.id)) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                className="bg-white/40 dark:bg-black/20 backdrop-blur-md border border-slate-200/30 dark:border-white/5 rounded-xl p-4 shadow-sm flex flex-col gap-1 transition-colors duration-500 mt-2"
              >
                <div className="mb-2 flex items-center gap-2 opacity-60">
                  <h2 className="text-[9px] font-bold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">
                    Life Cycles
                  </h2>
                  <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
                </div>
                
                <AnimatePresence>
                  {lifecycleItems.map((item, index) => visibleItems.includes(item.id) && (
                    <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <ProgressBar 
                        label={item.label} 
                        data={item.data} 
                        className={index === lifecycleItems.length - 1 ? "mb-0 scale-y-90 transform-origin-top" : "mb-3 scale-y-90 transform-origin-top"} 
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </CameraOverlay>

      <ProjectFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        editingProject={editingProject}
      />

      {/* Export Selection Modal */}
      <AnimatePresence>
        {isExportSelecting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-xl flex flex-col gap-6 max-h-[80vh] overflow-y-auto hide-scrollbar"
            >
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Export Selection</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Select elements to include in snapshot.</p>
              </div>

              <div className="flex flex-col gap-4">
                {projects.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects</h4>
                    {allItems.filter(i => i.type === 'project').map(item => (
                      <label 
                        key={item.id} 
                        onClick={(e) => { e.preventDefault(); toggleItem(item.id); }}
                        className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          visibleItems.includes(item.id) ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900' : 'border-slate-300 dark:border-slate-600 bg-transparent'
                        }`}>
                          {visibleItems.includes(item.id) && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.label}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Life Cycles</h4>
                  {allItems.filter(i => i.type === 'lifecycle').map(item => (
                    <label 
                      key={item.id} 
                      onClick={(e) => { e.preventDefault(); toggleItem(item.id); }}
                      className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        visibleItems.includes(item.id) ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900' : 'border-slate-300 dark:border-slate-600 bg-transparent'
                      }`}>
                        {visibleItems.includes(item.id) && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2 mt-auto">
                <button 
                  onClick={() => setIsExportSelecting(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmExport}
                  disabled={visibleItems.length === 0}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Export Image
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
