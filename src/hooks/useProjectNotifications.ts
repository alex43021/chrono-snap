import { useEffect, useRef } from 'react';
import type { Project } from './useProjects';

const NOTIFIED_KEY = 'chrono-notified-projects';

const getNotifiedSet = (): Set<string> => {
  try {
    const saved = localStorage.getItem(NOTIFIED_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
};

const saveNotifiedSet = (set: Set<string>) => {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

export const useProjectNotifications = (projects: Project[]) => {
  const notifiedRef = useRef(getNotifiedSet());

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      
      for (const project of projects) {
        const targetTime = new Date(project.targetDate).getTime();
        
        // Project has completed and we haven't notified yet
        if (now >= targetTime && !notifiedRef.current.has(project.id)) {
          notifiedRef.current.add(project.id);
          saveNotifiedSet(notifiedRef.current);

          // Fire notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🎯 ChronoSnap', {
              body: `「${project.title}」has reached its target date!`,
              icon: '/chrono-snap/icon-192.png',
              tag: `chrono-${project.id}`, // Prevents duplicate notifications
            });
          }
        }
      }
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [projects]);

  // Clean up notified entries for deleted projects
  useEffect(() => {
    const projectIds = new Set(projects.map(p => p.id));
    let changed = false;
    for (const id of notifiedRef.current) {
      if (!projectIds.has(id)) {
        notifiedRef.current.delete(id);
        changed = true;
      }
    }
    if (changed) saveNotifiedSet(notifiedRef.current);
  }, [projects]);
};
