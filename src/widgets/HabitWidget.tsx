import { Box, Column, LinearProgressIndicator, Row, Text } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, fillMaxWidth, padding, paddingAll, size } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

// REAL Android home-screen widget for Smart Habit UI (expo-widgets, SDK 58).
// This file runs in an isolated widget runtime: no React hooks, no app state,
// no async work, and nothing declared outside this function may be referenced
// (the bundler serializes only the function body). That is why the data below
// is STATIC, duplicated from src/data.ts inside this function, with the same
// values as the UI preview (3 of 6 done today: water, run, walk).
// Once the app has real persistence, the app should call
// HabitWidget.updateSnapshot({ doneCount, total, percent }) from app code to
// refresh what the home widget shows. Until then, the widget always shows
// these static values — it does not read live app state.
//
// Layout (new, from the reference widget, adapted — not copied):
//   1. Week at the top: Mon–Sun row with a coloured circle per day.
//   2. Below that: "Habit completed today" with count, % and a progress bar.
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
};

const HabitWidget = (props: HabitWidgetProps) => {
  'widget';
  // This week, Mon–Sun. Today is Thursday (index 3, matching the app's
  // week strip): Mon–Wed done, Thu in progress today, Fri–Sun future.
  const days: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const status: string[] = ['done', 'done', 'done', 'today', 'future', 'future', 'future'];
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
      <Row modifiers={[fillMaxWidth(), padding(0, 4, 0, 4)]}>
        {days.map((d, i) => (
          <Text key={d} color={i === 3 ? '#2DD4BF' : '#A7C2BB'} style={{ fontSize: 11, fontWeight: i === 3 ? 'bold' : 'normal' }} modifiers={[size(42, 14)]}>
            {d}
          </Text>
        ))}
      </Row>
      <Row modifiers={[fillMaxWidth(), padding(0, 2, 0, 8)]}>
        {status.map((s, i) => (
          <Row key={i} modifiers={[size(42, 28)]}>
            <Box modifiers={[size(28, 28), background(circleColor(s)), cornerRadius(14)]} />
          </Row>
        ))}
      </Row>
      <Text color="#A7C2BB" style={{ fontSize: 11 }}>
        Green = done · Amber = today · Grey = missed · Dark = coming up
      </Text>
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
        Done: Drink water · Morning run · Walk
      </Text>
    </Column>
  );
};

export default createWidget('HabitWidget', HabitWidget, { doneCount: 3, total: 6, percent: 50 });
