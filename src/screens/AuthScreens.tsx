import React, { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { c, spacing } from '../theme';
import { Back, Btn, Field, Note, Screen, Sub, Title } from '../components/ui';
import {
  isSupabaseConfigured,
  resetPasswordForEmail,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../supabase';
import type { ScreenProps } from './props';

// Auth screens (STEP 2: Supabase Auth).
//
// When Supabase is NOT configured, these screens stay EXACTLY as they
// were: UI previews with a PreviewNote, and Continue navigates to
// payment setup only to demo navigation — it does NOT mean sign-in
// succeeded, and no account, token, or password is stored or sent.
// When Supabase IS configured, the same screens perform real auth:
// email/password sign up + sign in, password reset via Supabase's
// reset email, and Google sign-in via Supabase OAuth. Errors are shown
// on screen and never navigate as if sign-in had succeeded.
// Auth is OPTIONAL, never a gate: every screen here has a
// "Continue without an account" path to Today, onboarding already has
// Skip, and Settings works without an account. Signing in never wipes
// data — App's sign-in merge (ensureUserHabits) claims anonymous demo
// habits or seeds demo habits for the new user, and never deletes rows.
// Passwords are passed straight to Supabase Auth and are never logged,
// stored in a file, or pasted anywhere by this code.
function PreviewNote() {
  return <Note>UI preview — no account is created or signed in. Continue goes to payment setup first (optional, skippable), then Today, only so you can demo the navigation. It does not mean sign-in succeeded.</Note>;
}
function GoogleBtn({ onPress, label }: { onPress: () => void; label?: string }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: c.white, borderRadius: 12, marginVertical: spacing.sm }}>
      <Text style={{ color: '#111111', fontWeight: '700' }}>G  {label ?? 'Continue with Google'}</Text>
    </Pressable>
  );
}
function SkipAccount({ nav }: { nav: ScreenProps['nav'] }) {
  return (
    <Pressable onPress={() => nav.goTab('today')} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: c.primary, fontWeight: '700' }}>Continue without an account →</Text>
    </Pressable>
  );
}

export function Login({ nav, ui }: ScreenProps) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured;

  // Unconfigured: keep the old preview behaviour exactly.
  if (!configured) {
    return (
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Back label="‹ Back" onPress={nav.back} />
          <Title>Log in</Title>
          <Sub>Welcome back. This screen is a UI preview only.</Sub>
          <PreviewNote />
          <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Field label="Password" value={pass} onChange={setPass} secure={!show} placeholder="Your password" />
          <Pressable onPress={() => setShow(!show)} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: c.primary }}>{show ? 'Hide password' : 'Show password'}</Text></Pressable>
          <Btn label="Log in (preview → payment setup)" onPress={() => nav.push({ name: 'paymentSetup' })} />
          <GoogleBtn onPress={() => nav.push({ name: 'paymentSetup' })} />
          <Pressable onPress={() => nav.push({ name: 'forgot' })} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.primary, fontWeight: '700' }}>Forgot password?</Text></Pressable>
          <Pressable onPress={() => nav.push({ name: 'signup' })} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.primary, fontWeight: '700' }}>No account? Sign up</Text></Pressable>
          <SkipAccount nav={nav} />
        </ScrollView>
      </Screen>
    );
  }

  const onLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail(email, pass);
      nav.push({ name: 'paymentSetup' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };
  const onGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      nav.push({ name: 'paymentSetup' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>Log in</Title>
        <Sub>Welcome back. Signing in syncs your habits to Supabase — or skip it and use the app without an account.</Sub>
        {error && <Note>{error}</Note>}
        <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" value={pass} onChange={setPass} secure={!show} placeholder="Your password" />
        <Pressable onPress={() => setShow(!show)} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: c.primary }}>{show ? 'Hide password' : 'Show password'}</Text></Pressable>
        <Btn label={busy ? 'Signing in…' : 'Log in'} onPress={onLogin} />
        <GoogleBtn onPress={onGoogle} />
        <Pressable onPress={() => nav.push({ name: 'forgot' })} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.primary, fontWeight: '700' }}>Forgot password?</Text></Pressable>
        <Pressable onPress={() => nav.push({ name: 'signup' })} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.primary, fontWeight: '700' }}>No account? Sign up</Text></Pressable>
        <SkipAccount nav={nav} />
      </ScrollView>
    </Screen>
  );
}

export function Signup({ nav, ui }: ScreenProps) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const configured = isSupabaseConfigured;

  if (!configured) {
    return (
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Back label="‹ Back" onPress={nav.back} />
          <Title>Sign up</Title>
          <Sub>Create an account to sync later. This screen is a UI preview only.</Sub>
          <PreviewNote />
          <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Field label="Password" value={pass} onChange={setPass} secure={!show} placeholder="Choose a password" />
          <Pressable onPress={() => setShow(!show)} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: c.primary }}>{show ? 'Hide password' : 'Show password'}</Text></Pressable>
          <Btn label="Sign up (preview → payment setup)" onPress={() => nav.push({ name: 'paymentSetup' })} />
          <GoogleBtn onPress={() => nav.push({ name: 'paymentSetup' })} />
          <Pressable onPress={() => nav.push({ name: 'login' })} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.primary, fontWeight: '700' }}>Already have an account? Log in</Text></Pressable>
          <SkipAccount nav={nav} />
        </ScrollView>
      </Screen>
    );
  }

  const onSignup = async () => {
    setBusy(true);
    setError(null);
    try {
      const { needsConfirmation: confirm } = await signUpWithEmail(email, pass);
      if (confirm) {
        // Email confirmation required: there is no session yet, so this
        // is NOT a sign-in — show the confirmation state and stay here.
        setNeedsConfirmation(true);
      } else {
        nav.push({ name: 'paymentSetup' });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-up failed.');
    } finally {
      setBusy(false);
    }
  };
  const onGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      nav.push({ name: 'paymentSetup' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };
  if (needsConfirmation) {
    return (
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Back label="‹ Back" onPress={nav.back} />
          <Title>Check your email</Title>
          <Sub>We sent a confirmation email to the address you entered. Open it and confirm, then come back and log in — you are not signed in yet.</Sub>
          <Btn label="Back to Log in" onPress={() => nav.push({ name: 'login' })} />
          <SkipAccount nav={nav} />
        </ScrollView>
      </Screen>
    );
  }
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>Sign up</Title>
        <Sub>Create an account to sync your habits to Supabase — or skip it and use the app without an account.</Sub>
        {error && <Note>{error}</Note>}
        <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" value={pass} onChange={setPass} secure={!show} placeholder="Choose a password" />
        <Pressable onPress={() => setShow(!show)} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: c.primary }}>{show ? 'Hide password' : 'Show password'}</Text></Pressable>
        <Btn label={busy ? 'Creating account…' : 'Sign up'} onPress={onSignup} />
        <GoogleBtn onPress={onGoogle} />
        <Pressable onPress={() => nav.push({ name: 'login' })} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.primary, fontWeight: '700' }}>Already have an account? Log in</Text></Pressable>
        <SkipAccount nav={nav} />
      </ScrollView>
    </Screen>
  );
}

export function Forgot({ nav, ui }: ScreenProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured;

  if (!configured) {
    return (
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Back label="‹ Back" onPress={nav.back} />
          <Title>Forgot password</Title>
          <Sub>Enter your email and we would send a reset link — in the real app. This is a UI preview only.</Sub>
          <PreviewNote />
          {!sent ? (
            <>
              <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
              <Btn label="Send reset link (preview)" onPress={() => setSent(true)} />
            </>
          ) : (
            <>
              <Text style={{ color: c.accent, fontWeight: '700', marginVertical: spacing.md }}>Check your email (preview state)</Text>
              <Text style={{ color: c.muted }}>No email was actually sent. This state only shows what the screen would look like after sending.</Text>
              <Btn label="Back to Log in" onPress={() => nav.push({ name: 'login' })} />
            </>
          )}
        </ScrollView>
      </Screen>
    );
  }

  const onSend = async () => {
    setBusy(true);
    setError(null);
    try {
      await resetPasswordForEmail(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the reset email.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>Forgot password</Title>
        <Sub>Enter your email and Supabase will send you a reset link.</Sub>
        {error && <Note>{error}</Note>}
        {!sent ? (
          <>
            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Btn label={busy ? 'Sending…' : 'Send reset link'} onPress={onSend} />
          </>
        ) : (
          <>
            <Text style={{ color: c.accent, fontWeight: '700', marginVertical: spacing.md }}>Check your email</Text>
            <Text style={{ color: c.muted }}>A password reset email was sent via Supabase. Open it and follow the link to choose a new password.</Text>
            <Btn label="Back to Log in" onPress={() => nav.push({ name: 'login' })} />
          </>
        )}
        <SkipAccount nav={nav} />
      </ScrollView>
    </Screen>
  );
}
