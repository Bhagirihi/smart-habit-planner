import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore } from '../store';
import { HABIT_COLORS } from '../theme';
import { newId } from '../lib/seed';
import { formatTime12h, todayKey } from '../lib/dates';
import { requestNotificationPermission } from '../lib/notifications';
import type { Habit, HabitType } from '../types';

/**
 * Interactive onboarding, fixed dark style (near-black + bright green) so the
 * first impression is the same in Light and Dark mode. This is a deliberate
 * exception to the app-wide useTheme() rule, limited to this screen.
 *
 * Entry/exit contract is unchanged: this screen takes no props and finishes
 * by calling completeOnboarding(habits, goal, wakeTime) from the store, which
 * sets onboarded=true and lands the user on Today. The old goal + starter
 * habit picker was dropped: it made onboarding longer without the user
 * doing anything, and these 5 steps already create one real habit.
 *
 * No Tasks/todo data model is built here. Step 3 is a demo list only:
 * its checked state lives in local component state and is never persisted.
 */

const BG = '#0A0A0A';
const CARD = '#1C1C1E';
const BORDER = '#2A2A2E';
const GREEN = '#4ADE80';
const WHITE = '#FFFFFF';
const GREY = '#9CA3AF';
const DIM = '#71717A';

const TICK_CELLS = Array.from({ length: 28 }, (_, i) => i % 3 !== 2);
const MEASURABLE_VALUES = [2, 1, 3, 0, 2, 1, 2, 3, 1, 2];

const DEMO_TASKS = [
  {
    id: 'morning',
    title: 'Plan your morning',
    subs: [
      { id: 'm1', label: 'Drink a glass of water' },
      { id: 'm2', label: 'Stretch for 5 minutes' },
      { id: 'm3', label: "Write today's top task" },
    ],
  },
  {
    id: 'evening',
    title: 'Evening wind-down',
    subs: [
      { id: 'e1', label: 'Put the phone away' },
      { id: 'e2', label: 'Read 10 pages' },
    ],
  },
];

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 15, 30, 45];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export default function Onboarding(): React.JSX.Element {
  const { completeOnboarding, updateSettings } = useStore();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<HabitType | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [reminderOn, setReminderOn] = useState(true);
  const [hour12, setHour12] = useState(9);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Habit | null>(null);
  const [savingReminder, setSavingReminder] = useState(false);

  function to24h(): string {
    const h = hour12 % 12 + (period === 'PM' ? 12 : 0);
    return `${pad(h)}:${pad(minute)}`;
  }

  const cleanName = name.trim();

  /** Step 2: create the real habit object (saved to the store at step 5). */
  function createDraft() {
    if (!cleanName || !kind) return;
    setDraft({
      id: newId('habit'),
      name: cleanName,
      color,
      type: kind,
      target: 1,
      unit: '',
      frequency: { kind: 'daily' },
      slot: 'morning',
      reminderTime: reminderOn ? to24h() : null,
      reminderEnabled: reminderOn,
      skipDates: [],
      paused: false,
      createdAt: todayKey(),
    });
    setStep(2);
  }

  /** Step 4: save the reminder time onto the habit from step 2. */
  async function saveReminder() {
    if (!draft) return;
    setSavingReminder(true);
    let enabled = reminderOn;
    if (reminderOn) {
      // Best-effort: ask the OS once, because the user just switched a
      // reminder on. If permission is refused, the time is still stored.
      const granted = await requestNotificationPermission();
      if (granted) updateSettings({ notificationsEnabled: true });
      else enabled = false;
    }
    setDraft({
      ...draft,
      reminderTime: enabled ? to24h() : null,
      reminderEnabled: enabled,
    });
    setSavingReminder(false);
    setStep(4);
  }

  function finish() {
    if (!draft) return;
    // Goal choice was dropped (see header comment); wake time keeps its
    // previous default so Settings still shows a value.
    completeOnboarding([draft], '', '07:00');
  }

  const demoTapped = Object.values(checked).some(Boolean);

  return (
    <ScrollView contentContainerStyle={styles.wrap} style={styles.screen}>
      <View style={styles.progressRow}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.progressSeg, i <= step && styles.progressDone]} />
        ))}
      </View>
      <Text style={styles.stepLabel}>Step {step + 1} of 5</Text>

      {step === 0 ? (
        <>
          <Text style={styles.hero}>How do you want to track it?</Text>
          <Text style={styles.body}>Pick one. You can change the type later when you edit the habit.</Text>
          <Pressable onPress={() => setKind('do')} style={[styles.pickCard, kind === 'do' && styles.pickSelected]}>
            <View style={styles.pickHead}>
              <View style={[styles.pickMark, kind === 'do' && styles.pickMarkOn]}>
                <Text style={styles.pickMarkText}>{kind === 'do' ? '✓' : ''}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickTitle}>Tick</Text>
                <Text style={styles.pickSub}>Tap done each day and watch the streak grow.</Text>
              </View>
            </View>
            <View style={styles.grid}>
              {TICK_CELLS.map((on, i) => (
                <View key={i} style={[styles.tickCell, on && styles.tickCellOn]} />
              ))}
            </View>
          </Pressable>
          <Pressable onPress={() => setKind('measurable')} style={[styles.pickCard, kind === 'measurable' && styles.pickSelected]}>
            <View style={styles.pickHead}>
              <View style={[styles.pickMark, kind === 'measurable' && styles.pickMarkOn]}>
                <Text style={styles.pickMarkText}>{kind === 'measurable' ? '✓' : ''}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickTitle}>Measurable</Text>
                <Text style={styles.pickSub}>Log a number each day, like pages or glasses.</Text>
              </View>
            </View>
            <View style={styles.valueGrid}>
              {MEASURABLE_VALUES.map((v, i) => (
                <View key={i} style={styles.valueCell}>
                  <Text style={styles.valueText}>{v}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.pickSub}>Total this week: {MEASURABLE_VALUES.reduce((a, b) => a + b, 0)}</Text>
          </Pressable>
          <GreenButton label="Continue" disabled={!kind} onPress={() => setStep(1)} />
        </>
      ) : step === 1 ? (
        <>
          <Text style={styles.hero}>Create your first habit</Text>
          <Text style={styles.body}>Give it a name you will recognise at a glance tomorrow morning.</Text>
          <Text style={styles.label}>Habit name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Morning Walk"
            placeholderTextColor={DIM}
            value={name}
            onChangeText={setName}
            maxLength={60}
          />
          <Text style={styles.label}>Colour</Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorSelected]}>
                <Text style={styles.colorCheck}>{color === c ? '✓' : ' '}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Daily reminder</Text>
            <Pressable onPress={() => setReminderOn((v) => !v)} style={[styles.toggle, reminderOn && styles.toggleOn]}>
              <View style={[styles.toggleKnob, reminderOn && styles.toggleKnobOn]} />
            </Pressable>
          </View>
          <Text style={styles.body}>{reminderOn ? 'You will set the exact time in step 4.' : 'No reminder for now. You can add one later from the habit.'}</Text>
          <GreenButton label="Continue" disabled={!cleanName} onPress={createDraft} />
          <GhostButton label="Back" onPress={() => setStep(0)} />
        </>
      ) : step === 2 ? (
        <>
          <Text style={styles.hero}>Try a task list</Text>
          <Text style={styles.body}>This is just a practice list, nothing here is saved. Tap at least one box to feel how checking things off works.</Text>
          {DEMO_TASKS.map((task) => {
            const done = task.subs.every((s) => checked[s.id]);
            return (
              <View key={task.id} style={styles.demoCard}>
                <View style={styles.demoHead}>
                  <Text style={[styles.demoTitle, done && styles.doneText]}>{task.title}</Text>
                  <Text style={[styles.demoState, done && styles.demoStateDone]}>{done ? '✓ Completed' : `${task.subs.filter((s) => checked[s.id]).length}/${task.subs.length}`}</Text>
                </View>
                {task.subs.map((s) => (
                  <Pressable key={s.id} onPress={() => setChecked((p) => ({ ...p, [s.id]: !p[s.id] }))} style={styles.subRow}>
                    <View style={[styles.box, checked[s.id] && styles.boxOn]}>
                      <Text style={styles.boxText}>{checked[s.id] ? '✓' : ''}</Text>
                    </View>
                    <Text style={[styles.subLabel, checked[s.id] && styles.doneText]}>{s.label}</Text>
                  </Pressable>
                ))}
              </View>
            );
          })}
          <GreenButton label="Continue" disabled={!demoTapped} onPress={() => setStep(3)} />
          <GhostButton label="Back" onPress={() => setStep(1)} />
        </>
      ) : step === 3 ? (
        <>
          <Text style={styles.hero}>Set a daily reminder</Text>
          <Text style={styles.body}>People who set a reminder are more likely to stick with a habit. Pick a time you are actually awake.</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Reminder for {draft?.name ?? 'your habit'}</Text>
            <Pressable onPress={() => setReminderOn((v) => !v)} style={[styles.toggle, reminderOn && styles.toggleOn]}>
              <View style={[styles.toggleKnob, reminderOn && styles.toggleKnobOn]} />
            </Pressable>
          </View>
          {reminderOn ? (
            <>
              <View style={styles.timeDisplay}>
                <Text style={styles.timeText}>{formatTime12h(to24h())}</Text>
              </View>
              <Text style={styles.label}>Hour</Text>
              <View style={styles.chipRow}>
                {HOURS.map((h) => (
                  <Pressable key={h} onPress={() => setHour12(h)} style={[styles.chip, hour12 === h && styles.chipOn]}>
                    <Text style={[styles.chipText, hour12 === h && styles.chipTextOn]}>{pad(h)}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>Minute</Text>
              <View style={styles.chipRow}>
                {MINUTES.map((m) => (
                  <Pressable key={m} onPress={() => setMinute(m)} style={[styles.chip, minute === m && styles.chipOn]}>
                    <Text style={[styles.chipText, minute === m && styles.chipTextOn]}>{pad(m)}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>AM / PM</Text>
              <View style={styles.chipRow}>
                {(['AM', 'PM'] as const).map((p) => (
                  <Pressable key={p} onPress={() => setPeriod(p)} style={[styles.chip, period === p && styles.chipOn]}>
                    <Text style={[styles.chipText, period === p && styles.chipTextOn]}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.body}>Reminder off. Your habit will still appear on Today, with no notification.</Text>
          )}
          <GreenButton label={savingReminder ? 'Saving…' : 'Save Habit'} disabled={savingReminder} onPress={() => void saveReminder()} />
          <GhostButton label="Back" onPress={() => setStep(2)} />
        </>
      ) : (
        <>
          <Text style={styles.hero}>You are all set</Text>
          <Text style={styles.body}>Here is what you just made. Nothing else to set up.</Text>
          <View style={styles.summaryCard}>
            <View style={styles.demoHead}>
              <View style={[styles.colorDot, { backgroundColor: draft?.color ?? color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.demoTitle}>{draft?.name ?? cleanName}</Text>
                <Text style={styles.pickSub}>{draft?.type === 'measurable' ? 'Measurable' : 'Tick'} · Daily</Text>
              </View>
            </View>
            <Text style={styles.summaryLine}>
              Reminder: {draft?.reminderEnabled && draft.reminderTime ? formatTime12h(draft.reminderTime) : 'Off'}
            </Text>
            <Text style={styles.summaryLine}>✓ Picked how to track it</Text>
            <Text style={styles.summaryLine}>✓ Created your first habit</Text>
            <Text style={styles.summaryLine}>✓ Tried a task list</Text>
            <Text style={styles.summaryLine}>✓ Set your reminder</Text>
          </View>
          <GreenButton label="Start My Day" disabled={!draft} onPress={finish} />
        </>
      )}
    </ScrollView>
  );
}

function GreenButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }): React.JSX.Element {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.greenBtn, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={styles.greenBtnText}>{label}</Text>
    </Pressable>
  );
}

function GhostButton({ label, onPress }: { label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}>
      <Text style={styles.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BG },
  wrap: { flexGrow: 1, padding: 22, gap: 14, backgroundColor: BG },
  progressRow: { flexDirection: 'row', gap: 6 },
  progressSeg: { flex: 1, height: 6, borderRadius: 999, backgroundColor: BORDER },
  progressDone: { backgroundColor: GREEN },
  stepLabel: { fontSize: 13, color: GREY },
  hero: { fontSize: 30, fontWeight: '800', color: WHITE, lineHeight: 36 },
  body: { fontSize: 15, color: GREY, lineHeight: 22 },
  label: { fontSize: 15, fontWeight: '700', color: WHITE, marginTop: 6 },
  pickCard: { backgroundColor: CARD, borderRadius: 22, borderWidth: 2, borderColor: BORDER, padding: 16, gap: 12 },
  pickSelected: { borderColor: GREEN },
  pickHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pickMark: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: DIM, alignItems: 'center', justifyContent: 'center' },
  pickMarkOn: { backgroundColor: GREEN, borderColor: GREEN },
  pickMarkText: { color: '#0A0A0A', fontWeight: '800' },
  pickTitle: { fontSize: 18, fontWeight: '800', color: WHITE },
  pickSub: { fontSize: 13, color: GREY, lineHeight: 19 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tickCell: { width: 18, height: 18, borderRadius: 5, backgroundColor: BORDER },
  tickCellOn: { backgroundColor: GREEN },
  valueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  valueCell: { width: 52, height: 36, borderRadius: 8, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  valueText: { color: WHITE, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 12, minHeight: 52, paddingHorizontal: 12, fontSize: 15, backgroundColor: CARD, color: WHITE },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  colorSelected: { borderWidth: 3, borderColor: WHITE },
  colorCheck: { color: WHITE, fontWeight: '800' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14 },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: WHITE, flex: 1 },
  toggle: { width: 56, height: 32, borderRadius: 16, backgroundColor: BORDER, justifyContent: 'center', paddingHorizontal: 4 },
  toggleOn: { backgroundColor: GREEN },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: WHITE },
  toggleKnobOn: { alignSelf: 'flex-end' },
  demoCard: { backgroundColor: CARD, borderRadius: 22, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 10 },
  demoHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  demoTitle: { fontSize: 17, fontWeight: '700', color: WHITE, flex: 1 },
  demoState: { fontSize: 13, color: GREY, fontWeight: '700' },
  demoStateDone: { color: GREEN },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: DIM, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: GREEN, borderColor: GREEN },
  boxText: { color: '#0A0A0A', fontWeight: '800' },
  subLabel: { fontSize: 15, color: WHITE, flex: 1 },
  doneText: { textDecorationLine: 'line-through', color: GREY },
  timeDisplay: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 18, alignItems: 'center' },
  timeText: { fontSize: 34, fontWeight: '800', color: GREEN },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minWidth: 52, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  chipOn: { backgroundColor: GREEN, borderColor: GREEN },
  chipText: { color: WHITE, fontWeight: '700' },
  chipTextOn: { color: '#0A0A0A' },
  summaryCard: { backgroundColor: CARD, borderRadius: 22, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 10 },
  summaryLine: { fontSize: 15, color: WHITE, lineHeight: 22 },
  greenBtn: { borderRadius: 14, minHeight: 56, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  greenBtnText: { color: '#0A0A0A', fontSize: 16, fontWeight: '800' },
  ghostBtn: { borderRadius: 14, minHeight: 48, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { color: WHITE, fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
});
