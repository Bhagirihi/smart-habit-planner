import type { SubTask, Task } from '../types';
import { HABIT_COLORS } from '../theme';

export function subtasksFor(taskId: string, all: SubTask[]): SubTask[] {
  return all.filter((s) => s.taskId === taskId);
}

export function subtaskCount(taskId: string, all: SubTask[]): { done: number; total: number } {
  const subs = subtasksFor(taskId, all);
  return { done: subs.filter((s) => s.done).length, total: subs.length };
}

/** Deterministic colour per list, from the existing habit palette. */
export function listColor(list: string): string {
  const lists = ['My Tasks', 'Personal', 'Work', 'Shopping'];
  const i = lists.indexOf(list);
  return HABIT_COLORS[(i < 0 ? 0 : i) % HABIT_COLORS.length];
}

export function sortTasksForList(a: Task, b: Task): number {
  const rank = (p: Task['priority']): number => (p === 'high' ? 0 : p === 'low' ? 1 : 2);
  if (rank(a.priority) !== rank(b.priority)) return rank(a.priority) - rank(b.priority);
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if ((a.time ?? '') !== (b.time ?? '')) return (a.time ?? '') < (b.time ?? '') ? -1 : 1;
  return a.title.localeCompare(b.title);
}
