import { Box, Column, LinearProgressIndicator, Row, Text } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, fillMaxWidth, padding, paddingAll, size } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

// REAL Android home-screen widget for Smart Habit UI (expo-widgets, SDK 58).
// This file runs in an isolated widget runtime: no React hooks, no app state,
// no async work, and nothing declared outside this function may be referenced
// (the bundler serializes only the function body). That is why the habit grid
// below is STATIC data duplicated from src/data.ts inside this function, with
// the same values as the UI preview (3 of 6 done today: water, run, walk).
// Once the app has real persistence, the app should call
// HabitWidget.updateSnapshot({ doneCount, total, percent }) from app code to
// refresh what the home widget shows. Until then, the widget always shows
// these static values — it does not read live app state.
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
  // Static grid: one string per habit, one character per day (last 7 days,
  // last character = today). D = done, P = partial, M = missed, . = not done yet.
  const rows: { name: string; days: string }[] = [
    { name: 'Drink water', days: 'DDMDDMD' },
    { name: 'Morning run', days: 'MDDMDDD' },
    { name: 'Read pages', days: 'DMDMPM.' },
    { name: 'Meditate', days: 'MMDMD..' },
    { name: 'Journal', days: 'DMMDM..' },
    { name: 'Walk steps', days: 'DDDMDDD' },
  ];
  const cellColor = (ch: string): string => {
    if (ch === 'D') return '#2DD4BF';
    if (ch === 'P') return '#FBBF24';
    if (ch === 'M') return '#1B2F2B';
    return '#0F1E1B';
  };
  const progress = props.total > 0 ? props.doneCount / props.total : 0;
  return (
    <Column modifiers={[fillMaxSize(), background('#0D1917'), paddingAll(16)]}>
      <Text color="#E9F5F1" style={{ fontSize: 16, fontWeight: 'bold' }}>
        Smart Habit
      </Text>
      <Text color="#E9F5F1" style={{ fontSize: 20, fontWeight: 'bold' }}>
        {props.doneCount} of {props.total} · {props.percent}%
      </Text>
      <Text color="#A7C2BB" style={{ fontSize: 12 }}>
        Completed today
      </Text>
      <LinearProgressIndicator
        progress={progress}
        color="#2DD4BF"
        trackColor="#1B2F2B"
        modifiers={[fillMaxWidth(), padding(0, 6, 0, 6)]}
      />
      <Text color="#A7C2BB" style={{ fontSize: 12 }}>
        M T W T F S S
      </Text>
      {rows.map((row) => (
        <Row key={row.name} modifiers={[fillMaxWidth(), padding(0, 2, 0, 2)]}>
          <Text color="#E9F5F1" style={{ fontSize: 12 }} modifiers={[size(84, 14)]}>
            {row.name}
          </Text>
          {row.days.split('').map((ch, i) => (
            <Box key={i} modifiers={[size(12, 12), background(cellColor(ch)), cornerRadius(3)]} />
          ))}
        </Row>
      ))}
    </Column>
  );
};

export default createWidget('HabitWidget', HabitWidget, { doneCount: 3, total: 6, percent: 50 });
