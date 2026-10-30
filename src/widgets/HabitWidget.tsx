import { Box, Column, LinearProgressIndicator, Row, Text } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, fillMaxWidth, padding, paddingAll, size } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

// REAL Android home-screen widget for Smart Habit UI (expo-widgets, SDK 58).
// This file runs in an isolated widget runtime: no React hooks, no app state,
// no async work, and nothing declared outside this function may be referenced
// (the bundler serializes only the function body). That is why the widget
// renders ONLY the snapshot props it receives: App.tsx calls
// HabitWidget.updateSnapshot(...) whenever today's done count, total,
// percent, done names, or week status change (STEP 6), so a placed home
// widget updates without reinstalling. Before the app ever sends a
// snapshot, the widget shows the initialProps below (the long-standing
// static values: 3 of 6 done today, Mon–Wed done week) — that initial
// state is a fallback, not live data, and is replaced by the first
// snapshot the app sends. The widget never reads app state directly,
// never invents history, streaks, or steps.
//
// Layout (from the reference widget, adapted — not copied):
//   1. Week at the top: Mon–Sun circles first, day labels below them
//      (exactly like the reference: circles on top, Mon–Sun underneath),
//      no legend line — green = done, amber = today, grey = missed,
//      mid-tonal = coming up, as in the reference's own colour logic.
//   2. Below that: "Habit completed today" with count, % and a progress
//      bar (the reference's STEPS + bar section, adapted to our code:
//      this app tracks habits completed, not system steps).
// No steps counter: this app tracks habits, not system steps.
// No streak line: dropped to keep week + completed-today clean in 4x4.
//
// CONTRAST RULE: nothing on a dark background may be the same (or nearly
// the same) colour as that background. Widget background is tonal
// #12312C (visibly lighter than a dark home screen), done circles are
// bright green #34D399, missed circles are light grey-green #8A9E98,
// today-in-progress is amber #FBBF24, future circles are mid-tonal
// #334F49 (not near-black), and the progress track is #334F49
// (not #1B2F2B, which vanished on the old #0D1917 background).
// Text is ink #E9F5F1 or muted #A7C2BB, never dark-on-dark.
//
// Supported Android components only (per Expo Widgets docs): Column, Row,
// Box, Text, LinearProgressIndicator. Supported modifiers only: background,
// cornerRadius, fillMaxSize, fillMaxWidth, padding, paddingAll, size.

type HabitWidgetProps = {
  doneCount: number;
  total: number;
  percent: number;
  // Done-habit names for today, already joined with ' · ' (empty =
  // nothing done yet today). Supplied by the app snapshot (STEP 6).
  doneNames: string;
  // Week status, Monday first, one per day: 'done' | 'today' |
  // 'missed' | 'future'. Supplied by the app snapshot from real
  // completion history when available, else the static fallback.
  weekStatus: string[];
  // Index of today within the Mon–Sun week (0 = Monday). Supplied by
  // the app snapshot; used only to highlight today's day label.
  todayIndex: number;
};

const HabitWidget = (props: HabitWidgetProps) => {
  'widget';
  // Week, Mon–Sun, circles first, labels below. Status and today index
  // come from the snapshot; if a snapshot is ever incomplete (wrong
  // length, out-of-range index), fall back to a week computed from
  // the REAL local date (STEP 8, QA fix M1 — never the old hardcoded
  // Thursday): past days 'done', today 'today', future days 'future'.
  // This runs inside the function body, so no outside import is
  // needed (the widget bundler serializes only this body).
  const days: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const realTodayIndex: number = (new Date().getDay() + 6) % 7;
  const fallbackStatus: string[] = [0, 1, 2, 3, 4, 5, 6].map((i) =>
    i < realTodayIndex ? 'done' : i === realTodayIndex ? 'today' : 'future',
  );
  const status: string[] =
    props.weekStatus && props.weekStatus.length === 7 ? props.weekStatus : fallbackStatus;
  const todayIndex: number =
    typeof props.todayIndex === 'number' && props.todayIndex >= 0 && props.todayIndex <= 6
      ? props.todayIndex
      : realTodayIndex;
  const circleColor = (s: string): string => {
    if (s === 'done') return '#34D399';
    if (s === 'today') return '#FBBF24';
    if (s === 'missed') return '#8A9E98';
    return '#334F49';
  };
  const progress = props.total > 0 ? props.doneCount / props.total : 0;
  return (
    <Column modifiers={[fillMaxSize(), background('#12312C'), cornerRadius(24), paddingAll(16)]}>
      <Text color="#E9F5F1" style={{ fontSize: 16, fontWeight: 'bold' }}>
        Smart Habit
      </Text>
      {/* 1. WEEK AT THE TOP */}
      <Text color="#E9F5F1" style={{ fontSize: 13, fontWeight: 'bold' }}>
        This week
      </Text>
      <Row modifiers={[fillMaxWidth(), padding(0, 2, 0, 2)]}>
        {status.map((s, i) => (
          <Row key={i} modifiers={[size(42, 28)]}>
            <Box modifiers={[size(28, 28), background(circleColor(s)), cornerRadius(14)]} />
          </Row>
        ))}
      </Row>
      <Row modifiers={[fillMaxWidth(), padding(0, 2, 0, 8)]}>
        {days.map((d, i) => (
          <Text key={d} color={i === todayIndex ? '#2DD4BF' : '#A7C2BB'} style={{ fontSize: 11, fontWeight: i === todayIndex ? 'bold' : 'normal' }} modifiers={[size(42, 14)]}>
            {d}
          </Text>
        ))}
      </Row>
      {/* 2. HABIT COMPLETED TODAY, BELOW THE WEEK */}
      <Text color="#E9F5F1" style={{ fontSize: 16, fontWeight: 'bold' }}>
        Habit completed today
      </Text>
      <Text color="#E9F5F1" style={{ fontSize: 24, fontWeight: 'bold' }}>
        {props.doneCount} of {props.total} · {props.percent}%
      </Text>
      <LinearProgressIndicator
        progress={progress}
        color="#2DD4BF"
        trackColor="#334F49"
        modifiers={[fillMaxWidth(), padding(0, 6, 0, 6)]}
      />
      <Text color="#A7C2BB" style={{ fontSize: 12 }}>
        Done: {props.doneNames ? props.doneNames : 'Nothing yet today'}
      </Text>
    </Column>
  );
};

// STEP 8 note: these initialProps are compile-time constants — they
// CANNOT call date helpers, so the old Thursday week survives here
// ONLY as the pre-first-snapshot placeholder, documented in the header
// above. It is replaced by the app's first real snapshot on launch,
// and the component-level fallback above is already real-date.
export default createWidget('HabitWidget', HabitWidget, {
  doneCount: 3,
  total: 6,
  percent: 50,
  doneNames: 'Drink water · Morning run · Walk',
  weekStatus: ['done', 'done', 'done', 'today', 'future', 'future', 'future'],
  todayIndex: 3,
});
