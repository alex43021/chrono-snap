import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

export interface TimeItem {
  percent: number;
  remainingText: string;
}

export interface TimeProgress {
  today: TimeItem;
  week: TimeItem;
  month: TimeItem;
  year: TimeItem;
  custom: TimeItem;
  now: Date;
}

const formatRemaining = (end: dayjs.Dayjs, now: dayjs.Dayjs): string => {
  // Add 999ms to mathematically Ceil the seconds.
  // Because the Clock shows floor(now), we must show ceil(remaining) so they always add up to exactly the total time.
  const diffMs = end.diff(now) + 999;
  if (diffMs <= 0) return '00h 00m 00s';

  const d = dayjs.duration(diffMs);
  const days = Math.floor(d.asDays());
  const hours = d.hours().toString().padStart(2, '0');
  const minutes = d.minutes().toString().padStart(2, '0');
  const seconds = d.seconds().toString().padStart(2, '0');

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  return `${hours}h ${minutes}m ${seconds}s`;
};

export const calculateProgressData = (start: dayjs.Dayjs, end: dayjs.Dayjs, now: dayjs.Dayjs): TimeItem => {
  const total = end.diff(start);
  const passed = now.diff(start);
  const percent = total > 0 ? Math.min(100, Math.max(0, (passed / total) * 100)) : 100;
  return {
    percent,
    remainingText: formatRemaining(end, now)
  };
};

export const useTimeProgress = (): TimeProgress => {
  const [progress, setProgress] = useState<TimeProgress>({
    today: { percent: 0, remainingText: '' },
    week: { percent: 0, remainingText: '' },
    month: { percent: 0, remainingText: '' },
    year: { percent: 0, remainingText: '' },
    custom: { percent: 0, remainingText: '' },
    now: new Date(),
  });

  useEffect(() => {
    const calculateProgress = () => {
      const now = dayjs();
      
      // Add 1 millisecond to endOf() methods because they return 23:59:59.999
      // This ensures our countdown doesn't magically "lose" 1 second in calculations.
      
      // Today
      const startOfDay = now.startOf('day');
      const endOfDay = now.endOf('day').add(1, 'millisecond');
      
      // Week
      const startOfWeek = now.startOf('week');
      const endOfWeek = now.endOf('week').add(1, 'millisecond');

      // Month
      const startOfMonth = now.startOf('month');
      const endOfMonth = now.endOf('month').add(1, 'millisecond');

      // Year
      const startOfYear = now.startOf('year');
      const endOfYear = now.endOf('year').add(1, 'millisecond');

      setProgress({
        today: calculateProgressData(startOfDay, endOfDay, now),
        week: calculateProgressData(startOfWeek, endOfWeek, now),
        month: calculateProgressData(startOfMonth, endOfMonth, now),
        year: calculateProgressData(startOfYear, endOfYear, now),
        custom: { percent: 0, remainingText: '' }, // Deprecated field
        now: now.toDate(),
      });
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 50);

    return () => clearInterval(interval);
  }, []);

  return progress;
};
