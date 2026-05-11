import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('dark'); // Default fallback

  useEffect(() => {
    // 1. Check local storage first
    const storedTheme = localStorage.getItem('chrono-theme') as Theme | null;
    
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // 2. If no stored theme, check system preference on first load
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = isSystemDark ? 'dark' : 'light';
      setTheme(initialTheme);
      // We don't save to localStorage yet, only when user manually toggles
    }
  }, []);

  useEffect(() => {
    // Apply theme to HTML element for Tailwind's dark selector
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('chrono-theme', newTheme);
      return newTheme;
    });
  };

  return { theme, toggleTheme };
};
