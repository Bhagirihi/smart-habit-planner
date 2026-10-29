import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';
import { spacing, type, type Palette, HABIT_COLORS } from '../theme';
import { useTheme } from '../useTheme';
import { Card, EmptyState, GhostButton, PrimaryButton } from '../components/ui';
import ProBadge from '../components/ProBadge';
import type { Nav } from '../navigation';
import type { Task } from '../types';
import { TASK_LISTS } from '../types';
import { addDays, formatDayLabel, formatTime12h, parseDateKey, todayKey, toDateKey } from '../lib/dates';
import { listColor, sortTasksForList, subtaskCount } from '../lib/tasks';

type ViewMode = 'timeline' | 'all' | 'plan';

const WEEK_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { flexGrow: 1, padding: spacing.lg, gap: 14, backgroundColor: c.bg },
    header: { fontSize: type.title, fontWeight: '800', color: c.ink },
    sub: { fontSize: type.body, color: c.muted, lineHeight: 22 },
    tabRow: { flexDirection: 'row', gap: 8 },
    tabBtn: { flex: 1, minHeight: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
    tabBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
    tabText: { fontSize: type.body, fontWeight: '700', color: c.ink },
    tabTextActive: { color: '#fff' },
    dateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    dateTitle: { fontSize: type.subtitle, fontWeight: '800', color: c.ink },
    dateCount: { fontSize: type.small, color: c.muted, fontWeight: '700' },
    allDone: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: c.greenSoft, borderRadius: 14, padding: 12 },
    allDoneText: { fontSize: type.body, fontWeight: '700', color: c.green },
    taskRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 6 },
    circle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    circleText: { color: '#fff', fontWeight: '800', fontSize: 18 },
    taskMain: { flex: 1, gap: 2 },
    taskTitle: { fontSize: type.body, fontWeight: '700', color: c.ink },
    taskTitleDone: { textDecorationLine: 'line-through', color: c.muted },
    taskMeta: { fontSize: type.small, color: c.muted, lineHeight: 19 },
    taskDate: { fontSize: type.small, color: c.muted, fontWeight: '700' },
    box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: c.muted, alignItems: 'center', justifyContent: 'center' },
    boxOn: { backgroundColor: c.primary, borderColor: c.primary },
    boxText: { color: '#fff', fontWeight: '800' },
    subRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 56, minHeight: 40 },
    subLabel: { fontSize: type.body, color: c.ink, flex: 1 },
    subLabelDone: { textDecorationLine: 'line-through', color: c.muted },
    sectionTitle: { fontSize: type.subtitle, fontWeight: '800', color: c.ink, marginTop: 8 },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
    weekDay: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8, borderRadius: 14, minHeight: 56, justifyContent: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    weekDaySelected: { backgroundColor: c.primary, borderColor: c.primary },
    weekDayLabel: { fontSize: type.caption, color: c.muted, fontWeight: '700' },
    weekDayLabelSelected: { color: '#fff' },
    weekDayNum: { fontSize: type.body, fontWeight: '800', color: c.ink },
    weekDayNumSelected: { color: '#fff' },
    timelineLine: { width: 4, backgroundColor: c.border, borderRadius: 2 },
    timeLabel: { fontSize: type.small, color: c.muted, fontWeight: '700', width: 72 },
    nowRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    nowDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: c.primary },
    nowText: { fontSize: type.body, fontWeight: '800', color: c.primary },
    gapCard: { backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 12, gap: 8 },
    gapText: { fontSize: type.body, color: c.muted },
    importRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  });
}

function priorityLabel(p: Task['priority']): string {
  return p === 'high' ? 'High priority' : p === 'low' ? 'Low priority' : 'No Priority';
}

export default function Tasks({ nav }: { nav: Nav }): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { state, isPremium, toggleTask, toggleSubTask } = useStore();
  const tasks = state.tasks ?? [];
  const subtasks = state.subtasks ?? [];
  const today = todayKey();
  const [view, setView] = useState<ViewMode>('timeline');
  const [planDay, setPlanDay] = useState(today);

  function openImportCalendar() {
    if (!isPremium) {
      nav.openPaywall();
      return;
    }
    Alert.alert('Calendar import is coming soon', 'Import Calendar is a Premium feature. Real calendar import is not built yet in this version — nothing has been imported.');
  }

  function taskCard(t: Task, showDate: boolean): React.JSX.Element {
    const { done, total } = subtaskCount(t.id, subtasks);
    const subs = subtasks.filter((s) => s.taskId === t.id);
    const color = listColor(t.list);
    return (
      <View key={t.id}>
        <Pressable onPress={() => nav.push({ name: 'taskForm', taskId: t.id })} style={styles.taskRow}>
          <Pressable onPress={() => toggleTask(t.id)} style={[styles.box, t.done && styles.boxOn]} hitSlop={8}>
            <Text style={styles.boxText}>{t.done ? '✓' : ''}</Text>
          </Pressable>
          <View style={[styles.circle, { backgroundColor: color }]}>
            <Text style={styles.circleText}>{t.title.trim().charAt(0).toUpperCase() || 'T'}</Text>
          </View>
          <View style={styles.taskMain}>
            <Text style={[styles.taskTitle, t.done && styles.taskTitleDone]}>{t.title}</Text>
            <Text style={styles.taskMeta}>
              {t.list} · {priorityLabel(t.priority)}
              {total > 0 ? ` · ${done}/${total} sub-tasks` : ''}
              {t.time ? ` · ${formatTime12h(t.time)}` : ''}
              {t.repeat !== 'never' ? ` · ${t.repeat}` : ''}
            </Text>
          </View>
          {showDate ? <Text style={styles.taskDate}>{t.date === today ? 'Today' : t.date === addDays(today, 1) ? 'Tomorrow' : formatDayLabel(t.date)}</Text> : null}
        </Pressable>
        {subs.map((s) => (
          <Pressable key={s.id} onPress={() => toggleSubTask(s.id)} style={styles.subRow}>
            <View style={[styles.box, s.done && styles.boxOn]}><Text style={styles.boxText}>{s.done ? '✓' : ''}</Text></View>
            <Text style={[styles.subLabel, s.done && styles.subLabelDone]}>{s.title}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  // ---- Timeline dates: Today, Tomorrow, future, then past (newest first) ----
  const timelineDates = useMemo(() => {
    const dates = Array.from(new Set(tasks.map((t) => t.date)));
    const ordered: string[] = [];
    const pushIf = (d: string) => { if (dates.includes(d) && !ordered.includes(d)) ordered.push(d); };
    pushIf(today);
    pushIf(addDays(today, 1));
    dates.filter((d) => d > addDays(today, 1)).sort().forEach(pushIf);
    dates.filter((d) => d < today).sort().reverse().forEach(pushIf);
    // Always show Today and Tomorrow groups even when empty, so Add task is discoverable.
    if (!ordered.includes(today)) ordered.unshift(today);
    if (!ordered.includes(addDays(today, 1))) ordered.splice(1, 0, addDays(today, 1));
    return ordered;
  }, [tasks, today]);

  // ---- Plan day ----
  const planWeekStart = useMemo(() => {
    // Sunday start for the Plan week strip, matching the reference pattern.
    const start = parseDateKey(planDay);
    start.setDate(start.getDate() - start.getDay());
    return start;
  }, [planDay]);

  const planWeekDays = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(planWeekStart);
      d.setDate(d.getDate() + i);
      out.push(toDateKey(d));
    }
    return out;
  }, [planWeekStart]);

  type PlanEntry = { time: string; label: string; detail: string; color: string; kind: 'task' | 'habit' };
  const planEntries = useMemo<PlanEntry[]>(() => {
    const entries: PlanEntry[] = [];
    tasks.filter((t) => t.date === planDay && t.time).forEach((t) => {
      entries.push({ time: t.time as string, label: t.title, detail: `${t.list} · ${priorityLabel(t.priority)}`, color: listColor(t.list), kind: 'task' });
    });
    state.habits.filter((h) => h.reminderTime && !h.paused).forEach((h, i) => {
      entries.push({ time: h.reminderTime as string, label: h.name, detail: 'Habit reminder', color: HABIT_COLORS[i % HABIT_COLORS.length], kind: 'habit' });
    });
    return entries.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
  }, [tasks, state.habits, planDay]);

  function gapHours(a: string, b: string): number {
    const [ah, am] = a.split(':').map(Number);
    const [bh, bm] = b.split(':').map(Number);
    return (bh * 60 + bm - (ah * 60 + am)) / 60;
  }

  const nowTime = useMemo(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.header}>Tasks</Text>
      <Text style={styles.sub}>One-time tasks live next to your habits. Check a sub-task, and the task finishes itself when they are all done.</Text>

      <View style={styles.tabRow}>
        {([['timeline', 'Timeline'], ['all', 'All Tasks'], ['plan', 'Plan']] as [ViewMode, string][]).map(([k, label]) => (
          <Pressable key={k} onPress={() => setView(k)} style={[styles.tabBtn, view === k && styles.tabBtnActive]}>
            <Text style={[styles.tabText, view === k && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <PrimaryButton label="+ New Task" onPress={() => nav.push({ name: 'taskForm' })} />

      {view === 'timeline' ? (
        tasks.length === 0 ? (
          <EmptyState title="No tasks yet" detail="Add your first task and it will appear here grouped by date, with a Today group first." actionLabel="Add your first task" onAction={() => nav.push({ name: 'taskForm' })} />
        ) : (
          timelineDates.map((d) => {
            const dayTasks = tasks.filter((t) => t.date === d).sort(sortTasksForList);
            const doneCount = dayTasks.filter((t) => t.done).length;
            const label = d === today ? 'Today' : d === addDays(today, 1) ? 'Tomorrow' : formatDayLabel(d);
            const isTodayGroup = d === today;
            return (
              <View key={d}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateTitle}>{label}{isTodayGroup ? ' · TODAY' : ''}</Text>
                  <Text style={styles.dateCount}>{dayTasks.length === 0 ? '' : `${doneCount}/${dayTasks.length}`}</Text>
                </View>
                {dayTasks.length > 0 && doneCount === dayTasks.length ? (
                  <View style={styles.allDone}><Text style={styles.allDoneText}>✓ All done! {dayTasks.length} task{dayTasks.length === 1 ? '' : 's'} completed</Text></View>
                ) : null}
                {dayTasks.length === 0 ? (
                  <Text style={styles.sub}>Nothing on this day yet.</Text>
                ) : (
                  <Card>{dayTasks.map((t) => taskCard(t, false))}</Card>
                )}
                <GhostButton label={`+ Add task on ${label}`} onPress={() => nav.push({ name: 'taskForm', date: d })} />
              </View>
            );
          })
        )
      ) : view === 'all' ? (
        <>
          {TASK_LISTS.map((listName) => {
            const listTasks = tasks.filter((t) => t.list === listName && !t.done).sort(sortTasksForList);
            if (listTasks.length === 0) return null;
            return (
              <View key={listName}>
                <Text style={styles.sectionTitle}>{listName}</Text>
                <Card>{listTasks.map((t) => taskCard(t, true))}</Card>
              </View>
            );
          })}
          {tasks.filter((t) => t.done).length > 0 ? (
            <View>
              <Text style={styles.sectionTitle}>Completed</Text>
              <Card>{tasks.filter((t) => t.done).sort(sortTasksForList).map((t) => taskCard(t, true))}</Card>
            </View>
          ) : null}
          {tasks.length === 0 ? (
            <EmptyState title="No tasks yet" detail="Tasks are grouped by list and priority here, with sub-task counts and dates on the right." actionLabel="Add your first task" onAction={() => nav.push({ name: 'taskForm' })} />
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.weekRow}>
            {planWeekDays.map((d, i) => {
              const selected = d === planDay;
              return (
                <Pressable key={d} onPress={() => setPlanDay(d)} style={[styles.weekDay, selected && styles.weekDaySelected]}>
                  <Text style={[styles.weekDayLabel, selected && styles.weekDayLabelSelected]}>{WEEK_SUN[i]}</Text>
                  <Text style={[styles.weekDayNum, selected && styles.weekDayNumSelected]}>{Number(d.slice(8, 10))}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.importRow}>
            <GhostButton label="Import Calendar" onPress={openImportCalendar} />
            {!isPremium ? <ProBadge /> : null}
          </View>
          <Text style={styles.sectionTitle}>{planDay === today ? 'Today' : formatDayLabel(planDay)}</Text>
          {planEntries.length === 0 ? (
            <EmptyState title="Nothing timed on this day" detail="Add a task with a time, or set a habit reminder, and it will appear on this timeline. Use Plan this slot to fill a gap." actionLabel="Plan this day" onAction={() => nav.push({ name: 'taskForm', date: planDay })} />
          ) : (
            <Card>
              {planEntries.map((e, idx) => {
                const prev = planEntries[idx - 1];
                const gap = prev ? gapHours(prev.time, e.time) : 0;
                const showNow = planDay === today && prev !== undefined && nowTime > prev.time && nowTime < e.time;
                const nowBeforeFirst = planDay === today && idx === 0 && nowTime < e.time;
                return (
                  <View key={`${e.kind}-${e.label}-${e.time}`}>
                    {gap >= 1 ? (
                      <View style={styles.gapCard}>
                        <Text style={styles.gapText}>⏱ {gap >= 1 ? `${Math.round(gap * 10) / 10}h gap` : ''} between {formatTime12h(prev.time)} and {formatTime12h(e.time)}</Text>
                        <GhostButton label="+ Plan this slot" onPress={() => nav.push({ name: 'taskForm', date: planDay })} />
                      </View>
                    ) : null}
                    {(showNow || nowBeforeFirst) ? (
                      <View style={styles.nowRow}><View style={styles.nowDot} /><Text style={styles.nowText}>Now · {formatTime12h(nowTime)}</Text></View>
                    ) : null}
                    <View style={styles.taskRow}>
                      <Text style={styles.timeLabel}>{formatTime12h(e.time)}</Text>
                      <View style={[styles.circle, { backgroundColor: e.color, width: 40, height: 40, borderRadius: 20 }]}><Text style={styles.circleText}>{e.label.trim().charAt(0).toUpperCase() || 'T'}</Text></View>
                      <View style={styles.taskMain}>
                        <Text style={styles.taskTitle}>{e.label}</Text>
                        <Text style={styles.taskMeta}>{e.detail}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
              {planDay === today ? (
                <View style={styles.nowRow}><View style={styles.nowDot} /><Text style={styles.nowText}>Now · {formatTime12h(nowTime)}</Text></View>
              ) : null}
            </Card>
          )}
          <GhostButton label="+ Plan this slot" onPress={() => nav.push({ name: 'taskForm', date: planDay })} />
        </>
      )}
    </ScrollView>
  );
}
