import { BloodSugarStatus } from '../types';

export function getBloodSugarStatus(value: number): BloodSugarStatus {
  if (value < 70) return 'low';
  if (value <= 140) return 'normal';
  if (value <= 200) return 'high';
  return 'very_high';
}

export function getStatusColor(status: BloodSugarStatus): string {
  switch (status) {
    case 'low':
      return '#dc2626'; // red
    case 'normal':
      return '#16a34a'; // green
    case 'high':
      return '#d97706'; // amber
    case 'very_high':
      return '#dc2626'; // red
  }
}

export function getStatusBgColor(status: BloodSugarStatus): string {
  switch (status) {
    case 'low':
      return '#fee2e2';
    case 'normal':
      return '#dcfce7';
    case 'high':
      return '#fef3c7';
    case 'very_high':
      return '#fee2e2';
  }
}

export function getStatusLabel(status: BloodSugarStatus): string {
  switch (status) {
    case 'low':
      return 'Low';
    case 'normal':
      return 'Normal';
    case 'high':
      return 'Elevated';
    case 'very_high':
      return 'High';
  }
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(isoString: string): string {
  return `${formatDate(isoString)} at ${formatTime(isoString)}`;
}

export function getTodayISO(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function isToday(isoString: string): boolean {
  return isoString.startsWith(getTodayISO());
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function getDayLabel(isoDate: string): string {
  const date = new Date(isoDate + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getShortDate(isoDate: string): string {
  const date = new Date(isoDate + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateStreak(readingDates: string[]): number {
  if (readingDates.length === 0) return 0;
  const uniqueDays = [...new Set(readingDates.map((d) => d.split('T')[0]))].sort().reverse();
  let streak = 0;
  const today = getTodayISO();
  let checkDate = today;
  for (const day of uniqueDays) {
    if (day === checkDate) {
      streak++;
      const prev = new Date(checkDate);
      prev.setDate(prev.getDate() - 1);
      checkDate = prev.toISOString().split('T')[0];
    } else {
      break;
    }
  }
  return streak;
}
