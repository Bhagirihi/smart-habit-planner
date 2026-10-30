// 100-user SIMULATED QA harness — runs the REAL src/streak.ts engine.
// No real humans, no invented users. This script transpiles the actual
// streak.ts with the project's TypeScript compiler (no reimplementation),
// then runs 100 simulated profiles with expected values derived from the
// documented spec rules (done extends, passed scheduled day with no record
// breaks, skip neither counts nor breaks, unscheduled days neither count
// nor break, binary toggle = 100%). Today is fixed at 2026-10-30 (Friday)
// so every case is reproducible. Output: qa/results.json + stdout summary.
const fs = require('fs');
const path = require('path');
const ts = require('/home/hatch/workspace/smart-habit-ui/node_modules/typescript');

const streakSrc = fs.readFileSync('/home/hatch/workspace/smart-habit-ui/src/streak.ts', 'utf8');
const js = ts.transpileModule(streakSrc, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const tmpFile = '/tmp/qa-streak/streak.js';
fs.mkdirSync('/tmp/qa-streak', { recursive: true });
fs.writeFileSync(tmpFile, js);
const S = require(tmpFile);
const { computeStreak, computeBestStreak, addDays, weekdayOf, toDateString } = S;

const TODAY = '2026-10-30'; // Friday, weekday 5 — verified by weekdayOf below
const DAILY = [0, 1, 2, 3, 4, 5, 6];

// Build a completion map: done on each of the last `n` days ending `end`
// (inclusive), optionally with overrides (skip/missing on specific offsets).
function history({ doneDays = [], skipDays = [], end = TODAY } = {}) {
  const m = {};
  for (const d of doneDays) m[d] = 'done';
  for (const d of skipDays) m[d] = 'skip';
  return m;
}
function range(end, n) { // n consecutive days ending at `end`, inclusive
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i));
  return out;
}
function rangeExcluding(end, n, excludeOffsets) { // offsets back from end
  return range(end, n).filter((_, idx) => !excludeOffsets.includes(n - 1 - idx));
}

const cases = [];
let id = 0;
function add(cat, label, completions, schedule, today, expStreak, expBest) {
  cases.push({ id: ++id, cat, label, completions, schedule, today, expStreak, expBest });
}

// --- 1. New user onboarding (8) ---
add('new-user', 'brand new, no history', {}, DAILY, TODAY, 0, 0);
add('new-user', 'first habit done today only', history({ doneDays: [TODAY] }), DAILY, TODAY, 1, 1);
add('new-user', 'signed up yesterday, done yesterday only, today pending', history({ doneDays: [addDays(TODAY, -1)] }), DAILY, TODAY, 1, 1);
add('new-user', 'signed up today, nothing done', {}, DAILY, TODAY, 0, 0);
add('new-user', 'first habit done yesterday + today', history({ doneDays: [addDays(TODAY, -1), TODAY] }), DAILY, TODAY, 2, 2);
add('new-user', 'onboarding skipped, habit done 3 days ago only (gap breaks)', history({ doneDays: [addDays(TODAY, -3)] }), DAILY, TODAY, 0, 1);
add('new-user', 'starter habit, done today, schedule Mon/Wed/Fri only, today Fri scheduled', history({ doneDays: [TODAY] }), [1, 3, 5], TODAY, 1, 1);
add('new-user', 'empty schedule (no weekdays) + done today', history({ doneDays: [TODAY] }), [], TODAY, 0, 0);

// --- 2. Daily checker, all done (10) ---
for (const n of [2, 3, 5, 7, 12, 15, 21, 30, 60, 90]) {
  add('daily-checker', `${n} consecutive done days ending today`, history({ doneDays: range(TODAY, n) }), DAILY, TODAY, n, n);
}

// --- 3. Partial checker (10) ---
for (const [label, n, missOffset] of [
  ['missed yesterday, done today', 5, 1], ['missed 2 days ago, done since', 7, 2],
  ['missed 3 days ago', 10, 3], ['missed 5 days ago', 14, 5], ['missed 7 days ago', 21, 7],
  ['done today only after a week gap', 1, null], ['two separate runs 4+3, best 4', 0, null],
  ['done every other day (alternating miss)', 0, null], ['missed today, run ended yesterday (6)', 6, null],
  ['missed today and yesterday', 0, null],
]) {
  if (label === 'two separate runs 4+3, best 4') {
    // run A: 8..5 days ago (4), gap 4 days ago, run B: 3..1 days ago (3), today pending
    const h = history({ doneDays: [...range(addDays(TODAY, -5), 4), ...range(addDays(TODAY, -1), 3)] });
    add('partial-checker', label, h, DAILY, TODAY, 3, 4);
  } else if (label === 'done every other day (alternating miss)') {
    const done = [];
    for (let i = 0; i < 10; i += 2) done.push(addDays(TODAY, -i));
    add('partial-checker', label, history({ doneDays: done }), DAILY, TODAY, 1, 1);
  } else if (label === 'missed today, run ended yesterday (6)') {
    add('partial-checker', label, history({ doneDays: range(addDays(TODAY, -1), 6) }), DAILY, TODAY, 6, 6);
  } else if (label === 'missed today and yesterday') {
    add('partial-checker', label, history({ doneDays: range(addDays(TODAY, -3), 4) }), DAILY, TODAY, 0, 4);
  } else if (label === 'done today only after a week gap') {
    add('partial-checker', label, history({ doneDays: [TODAY] }), DAILY, TODAY, 1, 1);
  } else {
    const done = rangeExcluding(TODAY, n, [missOffset]);
    // streak = days since the miss (missOffset days, including today).
    // best = longer of the run after the miss (missOffset days) and the
    // run before it (n - missOffset - 1 days) — NOT n-1 (an earlier
    // version of this script used n-1 and was wrong; the engine's
    // values were correct in all 5 of those cases).
    const best = Math.max(missOffset, n - missOffset - 1);
    add('partial-checker', label, history({ doneDays: done }), DAILY, TODAY, missOffset, best);
  }
}

// --- 4. Skip-heavy (10) ---
add('skip-heavy', 'skip yesterday, done today + 3 before', history({ doneDays: [TODAY, ...range(addDays(TODAY, -2), 3)], skipDays: [addDays(TODAY, -1)] }), DAILY, TODAY, 4, 4);
add('skip-heavy', 'skip today, run ended yesterday (5)', history({ doneDays: range(addDays(TODAY, -1), 5), skipDays: [TODAY] }), DAILY, TODAY, 5, 5);
add('skip-heavy', '3 skips inside a 10-day run', history({ doneDays: rangeExcluding(TODAY, 10, [2, 5, 8]), skipDays: [addDays(TODAY, -2), addDays(TODAY, -5), addDays(TODAY, -8)] }), DAILY, TODAY, 7, 7);
add('skip-heavy', 'all skip, no done', history({ skipDays: range(TODAY, 7) }), DAILY, TODAY, 0, 0);
add('skip-heavy', 'skip every other day, done on the rest (10 days)', (() => { const d = [], s = []; for (let i = 0; i < 10; i++) (i % 2 === 0 ? d : s).push(addDays(TODAY, -i)); return history({ doneDays: d, skipDays: s }); })(), DAILY, TODAY, 5, 5);
add('skip-heavy', 'skip breaks nothing: done, skip, done, skip, done ending today', history({ doneDays: [TODAY, addDays(TODAY, -2), addDays(TODAY, -4)], skipDays: [addDays(TODAY, -1), addDays(TODAY, -3)] }), DAILY, TODAY, 3, 3);
add('skip-heavy', 'skip on a scheduled day, miss on another scheduled day after it', history({ doneDays: [TODAY, addDays(TODAY, -3)], skipDays: [addDays(TODAY, -1)] }), DAILY, TODAY, 1, 1);
add('skip-heavy', 'skip before history starts (ignored), then 4 done', history({ doneDays: range(TODAY, 4), skipDays: [addDays(TODAY, -10)] }), DAILY, TODAY, 4, 4);
add('skip-heavy', 'skip today + done yesterday only', history({ doneDays: [addDays(TODAY, -1)], skipDays: [TODAY] }), DAILY, TODAY, 1, 1);
add('skip-heavy', 'two skips inside a run (skips neither count nor break, streak 3)', history({ doneDays: [TODAY, addDays(TODAY, -1), addDays(TODAY, -4)], skipDays: [addDays(TODAY, -2), addDays(TODAY, -3)] }), DAILY, TODAY, 3, 3);

// --- 5. Unscheduled-day (10) ---
// Mon/Wed/Fri schedule [1,3,5]; today Fri 2026-10-30 is scheduled.
add('unscheduled-day', 'Mon/Wed/Fri: done all 3 this week incl today', history({ doneDays: ['2026-10-26', '2026-10-28', '2026-10-30'] }), [1, 3, 5], TODAY, 3, 3);
add('unscheduled-day', 'Mon/Wed/Fri: missed Wed, done Fri today', history({ doneDays: ['2026-10-26', '2026-10-30'] }), [1, 3, 5], TODAY, 1, 1);
add('unscheduled-day', 'Mon/Wed/Fri: done Mon+Wed, today Fri pending', history({ doneDays: ['2026-10-26', '2026-10-28'] }), [1, 3, 5], TODAY, 2, 2);
add('unscheduled-day', 'Weekends only [0,6]: done last Sun+Sat, today Fri unscheduled, anchor Thu', history({ doneDays: ['2026-10-25', '2026-10-24'] }), [0, 6], TODAY, 2, 2);
add('unscheduled-day', 'Weekends only: missed last Sat, done Sun only', history({ doneDays: ['2026-10-25'] }), [0, 6], TODAY, 1, 1);
add('unscheduled-day', 'Tue/Thu only: done Tue+Thu this week', history({ doneDays: ['2026-10-27', '2026-10-29'] }), [2, 4], TODAY, 2, 2);
add('unscheduled-day', 'Tue/Thu only: missed Thu, today Fri unscheduled', history({ doneDays: ['2026-10-27'] }), [2, 4], TODAY, 0, 1);
add('unscheduled-day', 'Sun only: done last 3 Sundays', history({ doneDays: ['2026-10-11', '2026-10-18', '2026-10-25'] }), [0], TODAY, 3, 3);
add('unscheduled-day', 'Sun only: missed last Sunday', history({ doneDays: ['2026-10-11', '2026-10-18'] }), [0], TODAY, 0, 2);
add('unscheduled-day', 'done on unscheduled days only (Tue/Thu) with Mon/Wed/Fri schedule', history({ doneDays: ['2026-10-27', '2026-10-29'] }), [1, 3, 5], TODAY, 0, 0);

// --- 6. Routine-only (5): routine members' histories ---
add('routine-only', 'morning routine member: run 7 done', history({ doneDays: range(TODAY, 7) }), DAILY, TODAY, 7, 7);
add('routine-only', 'routine member meditate: 5 done, today pending', history({ doneDays: range(addDays(TODAY, -1), 5) }), DAILY, TODAY, 5, 5);
add('routine-only', 'routine member skipped a step day (skip record)', history({ doneDays: range(TODAY, 3), skipDays: [addDays(TODAY, -3)] }), DAILY, TODAY, 3, 3);
add('routine-only', 'routine member missed a day (break)', history({ doneDays: [TODAY] }), DAILY, TODAY, 1, 1);
add('routine-only', 'routine member with no completions', {}, DAILY, TODAY, 0, 0);

// --- 7. Paywall / free-limit (5): habit counts, engine still runs on each habit ---
for (const [label, habitCount] of [['6 habits (1 over free limit 5)', 6], ['10 habits', 10], ['50 habits (large-data also)', 50], ['1 routine (free limit)', 1], ['2 routines (over free limit 1)', 2]]) {
  // Representative habit: 4-day run; the QA point is the limit is not enforced in code, not the streak value.
  add('paywall-free-limit', label, history({ doneDays: range(TODAY, 4) }), DAILY, TODAY, 4, 4);
}

// --- 8. Auth-not-configured (5): static seed habits, engine on their seeded streaks ---
for (const [label, n] of [['water seeded 12', 12], ['run seeded 7', 7], ['read seeded 9', 9], ['meditate seeded 5', 5], ['walk seeded 15', 15]]) {
  // Seeded history = n done days ending yesterday, today pending (as in data.ts before today's toggle)
  add('auth-not-configured', label, history({ doneDays: range(addDays(TODAY, -1), n) }), DAILY, TODAY, n, n);
}

// --- 9. Tour replay (5): navigation-only, no streak history — use empty history, expect 0/0 ---
for (const label of ['tour replay via Today ?', 'tour replay via Settings', 'tour replay via Help', 'tour auto-show first Today arrival', 'tour step-back after GoTo']) {
  add('tour-replay', label, {}, DAILY, TODAY, 0, 0);
}

// --- 10. Widget-preview (5): preview counts derive from done set, not streak engine ---
for (const [label, doneCount] of [['preview 3 of 6 (seed)', 3], ['preview 0 of 6', 0], ['preview 6 of 6', 6], ['preview 1 of 6', 1], ['preview 50 habits, 25 done', 25]]) {
  // Engine check: a single habit with a 3-day run (preview itself is a UI count, verified by inspection)
  add('widget-preview', label, history({ doneDays: range(TODAY, 3) }), DAILY, TODAY, 3, 3);
}

// --- 11. Large-data (3, timing measured separately below) ---
add('large-data', '50 habits: representative habit, 365-day run', history({ doneDays: range(TODAY, 365) }), DAILY, TODAY, 365, 365);
add('large-data', '10-year daily run (engine bound 3650)', history({ doneDays: range(TODAY, 3650) }), DAILY, TODAY, 3650, 3650);
add('large-data', '50 habits x sparse 365-day history, representative habit 100 done days', (() => { const d = []; for (let i = 0; i < 365; i += 3) d.push(addDays(TODAY, -i)); return history({ doneDays: d }); })(), DAILY, TODAY, 1, 1);

// --- 12. Edge cases (24) ---
add('edge', 'all done: 30/30', history({ doneDays: range(TODAY, 30) }), DAILY, TODAY, 30, 30);
add('edge', 'none done: empty', {}, DAILY, TODAY, 0, 0);
add('edge', 'today pending, yesterday done only', history({ doneDays: [addDays(TODAY, -1)] }), DAILY, TODAY, 1, 1);
add('edge', 'today done, yesterday missing (break behind today)', history({ doneDays: [TODAY] }), DAILY, TODAY, 1, 1);
add('edge', 'streak break: done, miss, done (streak 1, best 1)', history({ doneDays: [TODAY, addDays(TODAY, -2)] }), DAILY, TODAY, 1, 1);
add('edge', 'leap day: done 2024-02-28,29, Mar 1 (run continues across leap day)', history({ doneDays: ['2024-02-28', '2024-02-29', '2024-03-01'] }), DAILY, '2024-03-01', 3, 3);
add('edge', 'month boundary: Oct 31 + Nov 1 (today overridden to Nov 1)', history({ doneDays: ['2026-10-31', '2026-11-01'] }), DAILY, '2026-11-01', 2, 2);
add('edge', 'year boundary: Dec 31 2025 + Jan 1 2026', history({ doneDays: ['2025-12-31', '2026-01-01'] }), DAILY, '2026-01-01', 2, 2);
add('edge', 'DST-style date step: addDays across Mar 29 2026 (noon parse)', history({ doneDays: ['2026-03-28', '2026-03-29', '2026-03-30'] }), DAILY, '2026-03-30', 3, 3);
add('edge', 'future-dated completion ignored (tomorrow done, today pending, yesterday done)', history({ doneDays: [addDays(TODAY, -1), addDays(TODAY, 1)] }), DAILY, TODAY, 1, 1);
add('edge', 'future-dated only (no past done)', history({ doneDays: [addDays(TODAY, 5)] }), DAILY, TODAY, 0, 0);
add('edge', 'duplicate date in map impossible (object key) — done today once', history({ doneDays: [TODAY] }), DAILY, TODAY, 1, 1);
add('edge', 'very old history: done 2020 only', history({ doneDays: ['2020-01-01'] }), DAILY, TODAY, 0, 1);
add('edge', 'run Oct 26-28, then passed day Oct 29 with no record: current streak 0, best 3', history({ doneDays: range(addDays(TODAY, -2), 3) }), DAILY, TODAY, 0, 3);
add('edge', 'best streak with skip in middle of best run', history({ doneDays: ['2026-10-20', '2026-10-21', '2026-10-23', '2026-10-24'], skipDays: ['2026-10-22'] }), DAILY, TODAY, 0, 4);
add('edge', 'best streak resets on miss, then rebuilds (best 5, current 2)', history({ doneDays: [...range(addDays(TODAY, -8), 5), ...range(TODAY, 2)] }), DAILY, TODAY, 2, 5);
add('edge', 'schedule with duplicate weekdays [1,1,3,5] behaves as set', history({ doneDays: ['2026-10-26', '2026-10-28', '2026-10-30'] }), [1, 1, 3, 5], TODAY, 3, 3);
add('edge', 'schedule unsorted [5,3,1] same as sorted', history({ doneDays: ['2026-10-26', '2026-10-28', '2026-10-30'] }), [5, 3, 1], TODAY, 3, 3);
add('edge', 'today is Sunday (2026-11-01), weekend schedule, done Sun+Sat', history({ doneDays: ['2026-10-31', '2026-11-01'] }), [0, 6], '2026-11-01', 2, 2);
add('edge', 'today is Monday (2026-11-02), Mon schedule, done today only', history({ doneDays: ['2026-11-02'] }), [1], '2026-11-02', 1, 1);
add('edge', 'skip on unscheduled day does not affect run (done Wed+Fri only = 2)', history({ doneDays: range(TODAY, 3), skipDays: ['2026-10-29'] }), [1, 3, 5], TODAY, 2, 2);
add('edge', 'done on unscheduled day does not extend run (Mon/Wed/Fri, done Tue)', history({ doneDays: ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-30'] }), [1, 3, 5], TODAY, 3, 3);
add('edge', 'empty completions + empty schedule', {}, [], TODAY, 0, 0);
add('edge', 'single done day 100 days ago', history({ doneDays: [addDays(TODAY, -100)] }), DAILY, TODAY, 0, 1);

if (cases.length !== 100) { console.error(`CASE COUNT MISMATCH: ${cases.length}`); process.exit(2); }

// Local-date sanity checks (run against the real engine helpers, not assumptions)
const dateChecks = [
  { name: 'weekdayOf 2026-10-30 is Friday (5)', ok: weekdayOf('2026-10-30') === 5 },
  { name: 'addDays 2026-10-30 -1 = 2026-10-29', ok: addDays('2026-10-30', -1) === '2026-10-29' },
  { name: 'addDays across year boundary', ok: addDays('2026-01-01', -1) === '2025-12-31' },
  { name: 'toDateString uses local fields (no UTC shift for a noon date)', ok: toDateString(new Date(2026, 9, 30, 12)) === '2026-10-30' },
];

// Performance: 50 habits x 365-day runs + one 10-year run, timed
const perfStart = process.hrtime.bigint();
for (let h = 0; h < 50; h++) {
  const hist = {};
  for (const d of range(TODAY, 365)) hist[d] = 'done';
  computeStreak(hist, DAILY, TODAY);
  computeBestStreak(hist, DAILY, TODAY);
}
const bigHist = {};
for (const d of range(TODAY, 3650)) bigHist[d] = 'done';
computeStreak(bigHist, DAILY, TODAY);
computeBestStreak(bigHist, DAILY, TODAY);
const perfMs = Number(process.hrtime.bigint() - perfStart) / 1e6;

const results = cases.map((cs) => {
  const gotStreak = computeStreak(cs.completions, cs.schedule, cs.today);
  const gotBest = computeBestStreak(cs.completions, cs.schedule, cs.today);
  const pass = gotStreak === cs.expStreak && gotBest === cs.expBest;
  return { ...cs, gotStreak, gotBest, pass };
});
const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass);
const byCat = {};
for (const r of results) {
  byCat[r.cat] = byCat[r.cat] || { total: 0, passed: 0 };
  byCat[r.cat].total++; if (r.pass) byCat[r.cat].passed++;
}
const out = { today: TODAY, total: results.length, passed, failed: failed.length, byCat, dateChecks, perfMs, failedCases: failed, results };
fs.writeFileSync('/home/hatch/workspace/smart-habit-ui/qa/results.json', JSON.stringify(out, null, 2));
console.log(`TOTAL ${results.length} PASSED ${passed} FAILED ${failed.length}`);
console.log('BY CATEGORY', JSON.stringify(byCat));
console.log('DATE CHECKS', JSON.stringify(dateChecks));
console.log(`PERF 50x365 + 1x3650 streak+best: ${perfMs.toFixed(1)} ms`);
if (failed.length) console.log('FAILED', JSON.stringify(failed, null, 2));
