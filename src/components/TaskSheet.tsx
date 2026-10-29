import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../useTheme';
import { spacing, type, type Palette } from '../theme';
import { Card, Chip, GhostButton, PrimaryButton } from './ui';
import ProBadge from './ProBadge';
import { addDays, formatDayLabel, todayKey } from '../lib/dates';
import { newId } from '../lib/seed';
import type { SubTask, Task, TaskList, TaskPriority, TaskRepeat } from '../types';
import { TASK_LISTS } from '../types';

export interface SheetSub { id: string; title: string; done: boolean; }

export interface TaskSheetProps {
  initialTask?: Task | null;
  initialSubtasks?: SubTask[];
  defaultDate?: string;
  isPremium: boolean;
  onOpenPaywall: () => void;
  onSave: (task: Task, subtasks: SubTask[]) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 15, 30, 45];
const pad = (n: number): string => String(n).padStart(2, '0');

function to24h(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  const h = hour12 % 12 + (period === 'PM' ? 12 : 0);
  return `${pad(h)}:${pad(minute)}`;
}

function from24h(t: string | null): { hour12: number; minute: number; period: 'AM' | 'PM' } {
  if (!t) return { hour12: 9, minute: 0, period: 'AM' };
  const [h, m] = t.split(':').map(Number);
  return { hour12: h % 12 === 0 ? 12 : h % 12, minute: m, period: h >= 12 ? 'PM' : 'AM' };
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { flexGrow: 1, padding: spacing.lg, gap: 14, backgroundColor: c.bg },
    sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26 },
    grabber: { width: 48, height: 5, borderRadius: 999, backgroundColor: c.border, alignSelf: 'center' },
    hero: { fontSize: type.title, fontWeight: '800', color: c.ink },
    label: { fontSize: type.body, fontWeight: '700', color: c.ink, marginTop: 4 },
    hint: { fontSize: type.small, color: c.muted, lineHeight: 19 },
    input: { borderWidth: 1, borderColor: c.border, borderRadius: 12, minHeight: 52, paddingHorizontal: 12, fontSize: type.body, backgroundColor: c.surface, color: c.ink },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    toggleLabel: { fontSize: type.body, fontWeight: '700', color: c.ink, flex: 1 },
    toggle: { width: 56, height: 32, borderRadius: 16, backgroundColor: c.border, justifyContent: 'center', paddingHorizontal: 4 },
    toggleOn: { backgroundColor: c.primary },
    toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
    toggleKnobOn: { alignSelf: 'flex-end' },
    toggleDisabled: { opacity: 0.45 },
    subRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
    box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: c.muted, alignItems: 'center', justifyContent: 'center' },
    boxOn: { backgroundColor: c.primary, borderColor: c.primary },
    boxText: { color: '#fff', fontWeight: '800' },
    subLabel: { fontSize: type.body, color: c.ink, flex: 1 },
    doneText: { textDecorationLine: 'line-through', color: c.muted },
    deleteText: { color: c.red, fontSize: type.body, fontWeight: '700', textAlign: 'center' },
    deleteBtn: { minHeight: 48, justifyContent: 'center', borderTopWidth: 1, borderTopColor: c.border, marginTop: 8 },
    addRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    addInput: { flex: 1 },
  });
}

export default function TaskSheet(props: TaskSheetProps): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const today = todayKey();
  const editing = Boolean(props.initialTask);
  const [title, setTitle] = useState(props.initialTask?.title ?? '');
  const [list, setList] = useState<TaskList>(props.initialTask?.list ?? 'My Tasks');
  const [priority, setPriority] = useState<TaskPriority>(props.initialTask?.priority ?? 'none');
  const [date, setDate] = useState(props.initialTask?.date ?? props.defaultDate ?? today);
  const [hasTime, setHasTime] = useState(Boolean(props.initialTask?.time));
  const initTime = from24h(props.initialTask?.time ?? null);
  const [hour12, setHour12] = useState(initTime.hour12);
  const [minute, setMinute] = useState(initTime.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initTime.period);
  const [reminderOn, setReminderOn] = useState(props.initialTask?.reminderEnabled ?? false);
  const [repeat, setRepeat] = useState<TaskRepeat>(props.initialTask?.repeat ?? 'never');
  const [subs, setSubs] = useState<SheetSub[]>(
    (props.initialSubtasks ?? []).map((s) => ({ id: s.id, title: s.title, done: s.done })),
  );
  const [subTitle, setSubTitle] = useState('');

  const dateOptions = useMemo(() => {
    const opts = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    if (!opts.includes(date)) opts.unshift(date);
    return opts;
  }, [today, date]);

  const cleanTitle = title.trim();
  const time24 = hasTime ? to24h(hour12, minute, period) : null;

  function handleRepeat(r: TaskRepeat) {
    if (r !== 'never' && !props.isPremium) {
      props.onOpenPaywall();
      return;
    }
    setRepeat(r);
  }

  function save() {
    if (!cleanTitle) return;
    const id = props.initialTask?.id ?? newId('task');
    const allSubsDone = subs.length > 0 && subs.every((s) => s.done);
    const wasAuto = props.initialTask?.autoFinished ?? false;
    const done = allSubsDone ? true : wasAuto ? false : (props.initialTask?.done ?? false);
    const task: Task = {
      id,
      title: cleanTitle,
      list,
      priority,
      date,
      time: time24,
      reminderTime: reminderOn && time24 ? time24 : null,
      reminderEnabled: reminderOn && Boolean(time24),
      repeat,
      done,
      autoFinished: allSubsDone ? true : wasAuto && !allSubsDone ? false : (props.initialTask?.autoFinished ?? false),
      createdAt: props.initialTask?.createdAt ?? today,
    };
    const outSubs: SubTask[] = subs.map((s) => ({ id: s.id, taskId: id, title: s.title.trim(), done: s.done }));
    props.onSave(task, outSubs);
  }

  function confirmDelete() {
    Alert.alert('Delete task?', 'This deletes the task and its sub-tasks. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => props.onDelete?.() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.grabber} />
      <Text style={styles.hero}>{editing ? 'Edit task' : 'New task'}</Text>
      <Text style={styles.label}>Task title</Text>
      <TextInput style={styles.input} placeholder="Task title" placeholderTextColor={c.muted} value={title} onChangeText={setTitle} maxLength={120} />

      <Text style={styles.label}>Date</Text>
      <View style={styles.chipRow}>
        {dateOptions.map((d) => (
          <Chip key={d} label={d === today ? 'Today' : d === addDays(today, 1) ? 'Tomorrow' : formatDayLabel(d)} selected={date === d} onPress={() => setDate(d)} />
        ))}
      </View>

      <Text style={styles.label}>Time</Text>
      <View style={styles.chipRow}>
        <Chip label="No time" selected={!hasTime} onPress={() => { setHasTime(false); setReminderOn(false); }} />
        <Chip label="Set a time" selected={hasTime} onPress={() => setHasTime(true)} />
      </View>
      {hasTime ? (
        <>
          <Text style={styles.label}>Hour</Text>
          <View style={styles.chipRow}>{HOURS.map((h) => (<Chip key={h} label={pad(h)} selected={hour12 === h} onPress={() => setHour12(h)} />))}</View>
          <Text style={styles.label}>Minute</Text>
          <View style={styles.chipRow}>{MINUTES.map((m) => (<Chip key={m} label={pad(m)} selected={minute === m} onPress={() => setMinute(m)} />))}</View>
          <Text style={styles.label}>AM / PM</Text>
          <View style={styles.chipRow}>{(['AM', 'PM'] as const).map((p) => (<Chip key={p} label={p} selected={period === p} onPress={() => setPeriod(p)} />))}</View>
        </>
      ) : null}

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Reminder</Text>
        <Pressable
          disabled={!hasTime}
          onPress={() => setReminderOn((v) => !v)}
          style={[styles.toggle, reminderOn && hasTime && styles.toggleOn, !hasTime && styles.toggleDisabled]}
          accessibilityRole="switch"
          accessibilityState={{ disabled: !hasTime, checked: reminderOn }}
        >
          <View style={[styles.toggleKnob, reminderOn && hasTime && styles.toggleKnobOn]} />
        </Pressable>
      </View>
      {!hasTime ? <Text style={styles.hint}>Set a time first to enable a reminder for this task.</Text> : null}

      <Text style={styles.label}>Repeat</Text>
      <View style={styles.chipRow}>
        <Chip label="Never" selected={repeat === 'never'} onPress={() => setRepeat('never')} />
        <Chip label="Daily" selected={repeat === 'daily'} onPress={() => handleRepeat('daily')} />
        <Chip label="Weekly" selected={repeat === 'weekly'} onPress={() => handleRepeat('weekly')} />
        {!props.isPremium ? <ProBadge /> : null}
      </View>
      <Text style={styles.hint}>Daily and Weekly repeats are Premium. Tapping them on Free opens the paywall.</Text>

      <Text style={styles.label}>List</Text>
      <View style={styles.chipRow}>{TASK_LISTS.map((l) => (<Chip key={l} label={l} selected={list === l} onPress={() => setList(l)} />))}</View>

      <Text style={styles.label}>Priority</Text>
      <View style={styles.chipRow}>
        <Chip label="No Priority" selected={priority === 'none'} onPress={() => setPriority('none')} />
        <Chip label="Low" selected={priority === 'low'} onPress={() => setPriority('low')} />
        <Chip label="High" selected={priority === 'high'} onPress={() => setPriority('high')} />
      </View>

      <Text style={styles.label}>Sub-tasks</Text>
      {subs.length === 0 ? <Text style={styles.hint}>No sub-tasks yet. Add one below — finishing all of them finishes the task automatically.</Text> : null}
      {subs.map((s) => (
        <View key={s.id} style={styles.subRow}>
          <Pressable onPress={() => setSubs((p) => p.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))} style={[styles.box, s.done && styles.boxOn]}>
            <Text style={styles.boxText}>{s.done ? '✓' : ''}</Text>
          </Pressable>
          <Text style={[styles.subLabel, s.done && styles.doneText]}>{s.title}</Text>
          <Pressable onPress={() => setSubs((p) => p.filter((x) => x.id !== s.id))} hitSlop={8}><Text style={styles.deleteText}>✕</Text></Pressable>
        </View>
      ))}
      <View style={styles.addRow}>
        <TextInput style={[styles.input, styles.addInput]} placeholder="Add a sub-task" placeholderTextColor={c.muted} value={subTitle} onChangeText={setSubTitle} maxLength={120} />
        <GhostButton label="Add" onPress={() => { const t = subTitle.trim(); if (!t) return; setSubs((p) => [...p, { id: newId('sub'), title: t, done: false }]); setSubTitle(''); }} />
      </View>

      <PrimaryButton label={editing ? 'Save task' : 'Save task'} onPress={save} disabled={!cleanTitle} />
      <GhostButton label="Cancel" onPress={props.onCancel} />
      {editing && props.onDelete ? (
        <Pressable onPress={confirmDelete} style={styles.deleteBtn}><Text style={styles.deleteText}>Delete</Text></Pressable>
      ) : null}
    </ScrollView>
  );
}
