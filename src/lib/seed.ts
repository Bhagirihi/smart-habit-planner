import type { Habit, TimeSlot } from '../types';
import { HABIT_COLORS } from '../theme';

export interface StarterOption {
  name: string;
  color: string;
  type: 'do' | 'measurable';
  target: number;
  unit: string;
  slot: TimeSlot;
  reminderTime: string;
}

const byGoal: Record<string, StarterOption[]> = {
  Fitness: [
    { name: 'Morning Walk', color: HABIT_COLORS[5], type: 'do', target: 1, unit: '', slot: 'morning', reminderTime: '07:00' },
    { name: 'Drink Water', color: HABIT_COLORS[7], type: 'measurable', target: 8, unit: 'glasses', slot: 'morning', reminderTime: '09:00' },
    { name: 'Stretch 10 Minutes', color: HABIT_COLORS[2], type: 'do', target: 1, unit: '', slot: 'evening', reminderTime: '18:30' },
    { name: 'Sleep by 11 PM', color: HABIT_COLORS[1], type: 'do', target: 1, unit: '', slot: 'evening', reminderTime: '22:30' },
  ],
  Study: [
    { name: 'Read 10 Pages', color: HABIT_COLORS[1], type: 'measurable', target: 10, unit: 'pages', slot: 'morning', reminderTime: '08:00' },
    { name: 'Revise Notes', color: HABIT_COLORS[2], type: 'do', target: 1, unit: '', slot: 'afternoon', reminderTime: '16:00' },
    { name: 'No Phone for 1 Hour', color: HABIT_COLORS[6], type: 'do', target: 1, unit: '', slot: 'evening', reminderTime: '19:00' },
  ],
  Health: [
    { name: 'Drink Water', color: HABIT_COLORS[7], type: 'measurable', target: 8, unit: 'glasses', slot: 'morning', reminderTime: '09:00' },
    { name: 'Walk 30 Minutes', color: HABIT_COLORS[5], type: 'do', target: 1, unit: '', slot: 'morning', reminderTime: '07:30' },
    { name: 'Meditate 5 Minutes', color: HABIT_COLORS[2], type: 'do', target: 1, unit: '', slot: 'morning', reminderTime: '07:00' },
  ],
  Productivity: [
    { name: 'Plan Today', color: HABIT_COLORS[0], type: 'do', target: 1, unit: '', slot: 'morning', reminderTime: '08:00' },
    { name: 'Deep Work 1 Hour', color: HABIT_COLORS[1], type: 'do', target: 1, unit: '', slot: 'morning', reminderTime: '10:00' },
    { name: 'Review the Day', color: HABIT_COLORS[4], type: 'do', target: 1, unit: '', slot: 'evening', reminderTime: '21:00' },
  ],
  'Better Mornings': [
    { name: 'Wake on Time', color: HABIT_COLORS[4], type: 'do', target: 1, unit: '', slot: 'morning', reminderTime: '07:00' },
    { name: 'Drink Water', color: HABIT_COLORS[7], type: 'measurable', target: 8, unit: 'glasses', slot: 'morning', reminderTime: '09:00' },
    { name: 'Make the Bed', color: HABIT_COLORS[0], type: 'do', target: 1, unit: '', slot: 'morning', reminderTime: '07:15' },
    { name: 'Read 10 Pages', color: HABIT_COLORS[1], type: 'measurable', target: 10, unit: 'pages', slot: 'evening', reminderTime: '20:00' },
  ],
};

export const GOALS = Object.keys(byGoal);

export function starterOptions(goal: string): StarterOption[] {
  return byGoal[goal] ?? byGoal['Better Mornings'];
}

export function starterToHabit(opt: StarterOption, createdAt: string, id: string): Habit {
  return {
    id,
    name: opt.name,
    color: opt.color,
    type: opt.type,
    target: opt.target,
    unit: opt.unit,
    frequency: { kind: 'daily' },
    slot: opt.slot,
    reminderTime: opt.reminderTime,
    reminderEnabled: true,
    skipDates: [],
    paused: false,
    createdAt,
  };
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 100000).toString(36)}`;
}
