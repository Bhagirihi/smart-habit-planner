import React, { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { c, spacing } from '../theme';
import { Back, Btn, Field, Note, Screen, Sub, Title } from '../components/ui';
import type { ScreenProps } from './props';

function PreviewNote() {
  return <Note>UI preview — no account is created or signed in. Continue goes to payment setup first (optional, skippable), then Today, only so you can demo the navigation. It does not mean sign-in succeeded.</Note>;
}
function GoogleBtn({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: c.white, borderRadius: 12, marginVertical: spacing.sm }}>
      <Text style={{ color: '#111111', fontWeight: '700' }}>G  Continue with Google</Text>
    </Pressable>
  );
}

export function Login({ nav }: ScreenProps) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
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
      </ScrollView>
    </Screen>
  );
}

export function Signup({ nav }: ScreenProps) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
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
      </ScrollView>
    </Screen>
  );
}

export function Forgot({ nav }: ScreenProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
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
