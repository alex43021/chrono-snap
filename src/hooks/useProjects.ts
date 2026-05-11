import { useState, useEffect } from 'react';

export interface Project {
  id: string;
  title: string;
  note: string;
  targetDate: string; // ISO string
  createdAt: string; // ISO string
}

const STORAGE_KEY = 'chrono-projects';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    // Default demo project if none exists
    return [
      {
        id: 'demo-1',
        title: 'Project X Launch',
        note: 'Finalize MVP features and prepare for public release.',
        targetDate: '2026-07-15T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const newProject: Project = {
      ...project,
      id,
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, newProject]);
    return id;
  };

  const updateProject = (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return { projects, addProject, updateProject, deleteProject };
};
