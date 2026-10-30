import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { c, spacing, type } from '../theme';
import { Back, Btn, Card, Note, Row, Screen, Sub, Title } from '../components/ui';
import { tourMeasure } from '../components/Tooltip';
import type { ScreenProps } from './props';

function SettingRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm }}>
      <Text style={{ color: c.ink }}>{label}</Text><Text style={{ color: c.primary }}>›</Text>
    </Pressable>
  );
}

export function Settings({ nav, ui }: ScreenProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const onRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    setRestoreMessage(null);
    try {
      const premium = await ui.restorePurchases();
      setRestoreMessage(premium
        ? 'Premium restored ✓ — your previous purchase was confirmed by RevenueCat.'
        : 'No active premium purchase found to restore. Nothing was unlocked.');
    } catch (e) {
      setRestoreMessage(e instanceof Error ? e.message : 'Restore failed.');
    } finally {
      setRestoring(false);
    }
  };
  const tourRowRef = useRef<any>(null);
  useEffect(() => {
    ui.registerTourTarget('settings-tour', tourMeasure(tourRowRef));
    return () => ui.unregisterTourTarget('settings-tour');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onSignOut = async () => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await ui.signOut();
    } catch (e) {
      setSignOutError(e instanceof Error ? e.message : 'Sign-out failed.');
    } finally {
      setSigningOut(false);
    }
  };
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Title>Settings</Title>
        <Card>
          <Row><Text style={{ color: c.ink, fontWeight: '700' }}>Account</Text><Text style={{ color: c.muted }}>{ui.authLoading ? 'Checking session…' : ui.authUser ? 'Signed in' : ui.supabaseConfigured ? 'Not signed in' : 'Not signed in (UI preview)'}</Text></Row>
          {ui.authUser ? (
            <>
              <Text style={{ color: c.ink, marginTop: spacing.sm }}>{ui.authUser.email ?? 'Signed in'}</Text>
              <Text style={{ color: c.muted, marginTop: 4 }}>Your habits and completions are saved to Supabase under this account.</Text>
              {signOutError && <Text style={{ color: c.error, marginTop: spacing.sm }}>{signOutError}</Text>}
              <Btn label={signingOut ? 'Signing out…' : 'Sign out'} ghost onPress={onSignOut} />
            </>
          ) : (
            <>
              <Text style={{ color: c.muted, marginTop: 4 }}>{ui.supabaseConfigured ? 'Sign in to sync your habits — or keep using the app without an account.' : 'Supabase is not configured, so this is a preview only.'}</Text>
              <Btn label="Log in / Sign up" ghost onPress={() => nav.push({ name: 'login' })} />
            </>
          )}
        </Card>
        <Card>
          <Row><Text style={{ color: c.ink }}>Notifications</Text><Switch value={ui.notifEnabled} onValueChange={ui.toggleNotif} trackColor={{ true: c.primary, false: c.surfaceAlt }} thumbColor={c.ink} /></Row>
          <Text style={{ color: c.muted, marginTop: spacing.sm }}>
            {!ui.notifEnabled
              ? 'Off — no reminders are scheduled. Turn the switch on to schedule them.'
              : ui.notifPermission === 'granted'
                ? 'On — a daily reminder is scheduled for each habit at its reminder time, plus an evening review at 9:00 PM. Tapping a notification opens Today.'
                : ui.notifPermission === 'denied'
                  ? 'On, but permission is denied — nothing is scheduled. The system prompt will not show again; use system settings to allow notifications, then return here.'
                  : 'On, but permission has not been granted yet — nothing is scheduled until you allow it.'}
          </Text>
          {ui.notifPermission === 'denied' && (
            <Btn label="Open system settings" ghost onPress={() => { void ui.openNotifSettings(); }} />
          )}
          {ui.notifPermission !== 'granted' && ui.notifPermission !== 'denied' && ui.notifEnabled && (
            <Btn label="Allow notifications" ghost onPress={() => { void ui.requestNotifPermission(); }} />
          )}
          {ui.notifError && <Text style={{ color: c.error, marginTop: spacing.sm }}>{ui.notifError}</Text>}
        </Card>
        <Card>
          <Text style={{ color: c.ink, fontWeight: '700' }}>Database</Text>
          <Text style={{ color: c.muted, marginTop: 4 }}>
            {ui.supabaseConfigured
              ? (ui.supabaseError
                ? `Supabase is configured, but the last load or save failed: ${ui.supabaseError} — showing the static list until it succeeds.`
                : ui.authUser
                  ? 'Supabase connected — habits and completions are saved to your project.'
                  : 'Supabase is configured, but no account is signed in — habits are stored in this session only until you sign in.')
              : 'Supabase not configured — habits are stored in this session only and are lost on reload. See README for setup (a real project + keys are needed).'}
          </Text>
        </Card>
        <Card>
          <Text style={{ color: c.ink, fontWeight: '700' }}>Premium</Text>
          <Text style={{ color: c.muted, marginTop: 4 }}>
            {ui.isPremium
              ? 'Premium ✓ — unlimited habits & routines, confirmed by RevenueCat.'
              : ui.revenueCatConfigured
                ? (ui.revenueCatLoading ? 'Checking premium status…' : 'Free — 5 habits, 1 routine. Upgrade to unlock unlimited habits & routines.')
                : 'RevenueCat not configured — premium state is not checked, and no purchase is connected. See README for setup (a real project + API key are needed).'}
          </Text>
          {ui.revenueCatError && <Text style={{ color: c.error, marginTop: spacing.sm }}>{ui.revenueCatError}</Text>}
          {restoreMessage && <Text style={{ color: c.muted, marginTop: spacing.sm }}>{restoreMessage}</Text>}
          {ui.revenueCatConfigured ? (
            <Btn label={restoring ? 'Restoring…' : 'Restore purchases'} ghost onPress={onRestore} />
          ) : (
            <Btn label="Restore purchases (preview — not connected)" ghost onPress={() => setRestoreMessage('RevenueCat is not configured, so there is nothing to restore yet.')} />
          )}
          <Btn label="Upgrade to Premium" ghost onPress={nav.openPaywall} />
        </Card>
        <Card>
          <Row><Text style={{ color: c.ink, fontWeight: '700' }}>Analytics</Text><Switch value={ui.analyticsEnabled} onValueChange={ui.toggleAnalytics} trackColor={{ true: c.primary, false: c.surfaceAlt }} thumbColor={c.ink} /></Row>
          <Text style={{ color: c.muted, marginTop: spacing.sm }}>
            {ui.firebaseConfigured
              ? (ui.analyticsEnabled
                ? 'On — Firebase Analytics logs only real, privacy-respecting events (app open, habit completed/created, routine started/completed, paywall shown, purchase completed). No names, prices, emails, or user-entered text are ever sent.'
                : 'Off — no analytics events are sent and Crashlytics collection is disabled. Turn the switch on to resume.')
              : 'Firebase not configured — no events are sent, and nothing is faked. To connect: add google-services.json from your Firebase console, add the @react-native-firebase plugins back to app.json, and install a development build (see README). The switch above still saves your preference for when Firebase is connected.'}
          </Text>
        </Card>
        <Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>Help & Legal</Text>
        <View ref={tourRowRef} collapsable={false}><SettingRow label="How to use this app — guided tour" onPress={ui.startTour} /></View>
        <SettingRow label="Help — Show guide again" onPress={() => nav.push({ name: 'legal', page: 'Help' })} />
        <SettingRow label="Payment setup (optional, skippable)" onPress={() => nav.push({ name: 'paymentSetup' })} />
        <SettingRow label="Home widget preview" onPress={() => nav.push({ name: 'widgetPreview' })} />
        <SettingRow label="Terms of Use" onPress={() => nav.push({ name: 'legal', page: 'Terms' })} />
        <SettingRow label="Privacy Policy" onPress={() => nav.push({ name: 'legal', page: 'Privacy' })} />
        <Card>
          <Text style={{ color: c.error, fontWeight: '700' }}>Delete my data</Text>
          <Text style={{ color: c.muted, marginTop: 4 }}>This button currently does nothing — it does not delete server data. To request deletion, contact the app owner at the address in the Privacy Policy (Settings → Privacy Policy) until a real delete flow is built.</Text>
          {!confirmDelete ? (
            <Btn label="Delete my data" ghost onPress={() => setConfirmDelete(true)} />
          ) : (
            <View><Text style={{ color: c.muted, marginTop: spacing.sm }}>Are you sure? This button currently does nothing — nothing will be deleted. Use the Privacy Policy contact address to request deletion.</Text><Btn label="Understood (no action taken)" onPress={() => setConfirmDelete(false)} /></View>
          )}
        </Card>
        <Note>{ui.isPremium ? 'Premium is active (RevenueCat). ' : ui.revenueCatConfigured ? 'RevenueCat is connected — premium state is checked on launch and on restore. ' : 'No purchase is connected yet — RevenueCat is not configured. '}Build v1.0.2 — Supabase + Auth + RevenueCat + Notifications + Firebase + live widget + real routines/reports + QA fixes (real-date week, streak recompute on toggle, empty/not-found states, real privacy + terms). If this line does not say v1.0.2, you are running an older build.</Note>
      </ScrollView>
    </Screen>
  );
}

// STEP 8 (production hardening): REAL privacy policy + terms, written
// for how this app actually works — not placeholder text. Rules kept:
//   - Every claim matches the code: Supabase stores account data when
//     configured + signed in; RevenueCat/Google Play handle payments
//     (we never see card details); Firebase Analytics, when configured
//     and not opted out, sends only the anonymous events listed in
//     Settings → Analytics (no names, prices, emails, or user text);
//     local notifications and the home widget stay on the device /
//     use only your habit data, with no separate collection.
//   - The contact email is a PLACEHOLDER marked TO BE FILLED by the
//     app owner with a real address — never an invented address.
//     Until that placeholder is replaced AND this policy is hosted at
//     a real URL for the Play listing (owner-supplied hosting, also
//     not invented here), the app is not ready for a Play release —
//     see README "Production hardening (STEP 8)".
//   - The in-app Delete button currently does nothing (it is a
//     preview control); the policy therefore does NOT claim in-app
//     deletion works — deletion requests go via the contact address
//     until a real delete flow is built.
const PRIVACY_BODY = `Smart Habit — Privacy Policy (version 1.0.2)

What this app is: a habit and routine planner. You create habits and routines, check them off, and see streaks, a weekly report, and a home widget. An account is optional — you can use the app without signing in.

What we collect, and why:
• If you create an account and sign in (Supabase): your email address, and the habits, routines, completions, and suggestion states you create. These are stored in Supabase under your account so they survive reloads and sync to your account. If you do not sign in, this data stays in the app session only and is lost on reload.
• If Firebase Analytics is configured and you have not opted out (Settings → Analytics): anonymous events only — app open, habit completed (habit id + time slot only), habit created (time slot only), routine started/completed (routine id + step count only), paywall shown, and purchase completed (no parameters). No habit names, targets, prices, product ids, emails, or text you typed are ever sent as analytics. Turning Analytics off in Settings stops all future events and disables Crashlytics collection immediately.
• Crash reports (Firebase Crashlytics, when configured): generic crash identifiers for genuine app failures (for example, a failed Supabase or RevenueCat load). No emails, tokens, or user-entered text are sent in crash reports.
• Purchases (RevenueCat + Google Play): when you buy Premium, payment is handled by Google Play and RevenueCat. We never see, store, or process your card details. We only learn whether the Premium entitlement is active, so the app can unlock unlimited habits and routines.

What we do NOT do: we do not sell your data, we do not share it with advertisers, and we do not use your habit names or targets for advertising or analytics.

What stays on your device: local notification schedules (habit reminders and the 9:00 PM evening review) and the home widget snapshot, which is built from your own habits and completions. No separate data is collected for the widget.

Your choices: use the app without an account; sign out at any time from Settings (signing out does not delete server data — it only ends the local session); turn Analytics off in Settings; turn notifications off in Settings. To request deletion of your account data, or to ask any privacy question, contact the app owner at: [CONTACT EMAIL TO BE FILLED BY THE OWNER]. Deletion requests made to that address will be handled by the owner — the in-app "Delete my data" button currently does nothing and must not be relied on for deletion until a real delete flow is built.

Changes to this policy will be reflected in a new app version. If a hosted copy of this policy is published for the Play listing, that hosted copy is the same text as this in-app version.`;

const TERMS_BODY = `Smart Habit — Terms of Use (version 1.0.2)

Using the app: Smart Habit is provided as a habit and routine planner. You may use it with or without an account. You are responsible for keeping your account credentials safe and for the habits and routines you create.

Free and Premium: the free tier allows 5 habits and 1 routine. Premium (unlimited habits and routines) is sold through Google Play via RevenueCat as monthly, yearly, and lifetime options, at the prices shown in the app at purchase time (prices come from RevenueCat/Google Play, never from this document). Purchases, renewals, cancellations, and refunds are governed by Google Play's terms and by RevenueCat's handling of your entitlement; cancel a subscription through Google Play, not through this app. Restoring a previous purchase is available in Settings → Restore purchases. If a purchase cannot be verified, Premium stays off.

Your data: habits, routines, and completions you create remain yours. By using an account, you allow the app to store them in Supabase under your account so they can be shown back to you. Do not enter sensitive personal, medical, or financial information as habit names or targets — the app is not designed to store or protect that kind of data.

Not medical advice: Smart Habit is a planning and tracking tool, not a medical, health, or fitness advice service. Nothing in the app — including streaks, scores, suggestions, or weekly reports — is medical advice, and suggestions are generic (for example, moving a habit to another time of day or lowering a target). Use your own judgement, and consult a professional for health decisions.

Availability and liability: the app is provided as-is, without guarantees of uninterrupted service, and may change in future versions. To the extent permitted by law, the owner is not liable for losses arising from reliance on streaks, scores, or suggestions, or from service interruptions.

Changes and contact: these terms may change with a new app version. Questions about these terms, or requests about your data (including deletion requests — see the Privacy Policy), go to the app owner at: [CONTACT EMAIL TO BE FILLED BY THE OWNER].`;

export function Legal({ nav, ui }: ScreenProps) {
  const route = nav.route;
  const page = route.name === 'legal' ? route.page : 'Help';
  const body = page === 'Terms'
    ? TERMS_BODY
    : page === 'Privacy'
      ? PRIVACY_BODY
      : (ui.supabaseConfigured && ui.authUser
        ? 'Help: tap a habit row for detail, tap ✓ to check it off, use + to add a habit or routine, and open Weekly Report to try Apply / Dismiss on suggestions. Habits, routines, and suggestion states are saved to your account and survive reloads.'
        : 'Help: tap a habit row for detail, tap ✓ to check it off, use + to add a habit or routine, and open Weekly Report to try Apply / Dismiss on suggestions. When Supabase is not configured or no account is signed in, checking a habit only changes this session and reloading resets to the static data.');
  return (
    <Screen>
      <Back label="‹ Back" onPress={nav.back} />
      <Title>{page}</Title>
      <Sub>{page === 'Help' ? 'Sub-screen, reached from Settings.' : 'Sub-screen, reached from Settings. Contact email and hosted Play URL are still to be filled by the app owner — see README.'}</Sub>
      <Card><Text style={{ color: c.ink, fontSize: type.body }}>{body}</Text></Card>
      {page === 'Help' && <Btn label="Start guided tour" onPress={ui.startTour} />}
    </Screen>
  );
}
