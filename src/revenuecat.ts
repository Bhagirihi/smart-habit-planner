// RevenueCat payments (STEP 3) — the ONLY place the app talks to
// RevenueCat. Everything else reads plain objects from App state, so
// screens never import react-native-purchases and never see the SDK.
//
// Configuration comes ONLY from one environment variable — never
// hardcoded, never invented, never pasted here:
//   EXPO_PUBLIC_REVENUECAT_API_KEY   (Google Play public SDK key)
// Set it in a local .env file for `expo start` (see .env.example),
// or as an EAS secret for builds. EXPO_PUBLIC variables are inlined
// at build time, so changing the key requires restarting the dev
// server / rebuilding. If the variable is missing or empty, there is
// NO client: `isRevenueCatConfigured` is false, and the app must keep
// its exact preview behaviour (plan names only, no prices, no fake
// purchase, no fake unlock, no fake entitlement) — see App.tsx.
//
// ENTITLEMENT: premium status is checked against ONE entitlement id,
// below. It MUST match the entitlement identifier created in the
// RevenueCat dashboard exactly; if the dashboard uses a different
// name, change this one constant and nothing else. The app never
// claims a user is Premium unless that entitlement is active in a
// CustomerInfo returned by RevenueCat.
//
// NATIVE MODULE NOTE: react-native-purchases is a native module and
// is NOT included in Expo Go, so it is loaded LAZILY (dynamic
// import) only on the configured path. The unconfigured path never
// touches the module at all, so the app still runs in Expo Go.
// The configured path (real offerings / purchase / restore) needs a
// development build, exactly like the real home widget — it cannot
// be tested in Expo Go. If the native module is unavailable (e.g.
// someone runs a configured build in Expo Go), every function here
// throws a truthful "development build required" error instead of
// reporting a fake success or a fake premium state.
//
// PRICES: prices are NEVER hardcoded here. The only prices the UI
// ever shows are `priceString` values returned by RevenueCat for
// the current offering's packages. If RevenueCat returns no
// offering or no packages, the UI shows "No products available"
// and never invents a price.

declare const process:
  | { env: Record<string, string | undefined> }
  | undefined;

function envVar(name: string): string {
  try {
    if (typeof process !== 'undefined' && process?.env) {
      return process.env[name] ?? '';
    }
  } catch {
    // Never crash on env access — missing config just means unconfigured.
  }
  return '';
}

// Single place to correct the entitlement id (see the comment above).
export const PREMIUM_ENTITLEMENT_ID = 'premium';

export interface RcPackage {
  identifier: string;
  packageType: string;
  title: string;
  description: string;
  priceString: string;
}

const apiKey = envVar('EXPO_PUBLIC_REVENUECAT_API_KEY').trim();

export const isRevenueCatConfigured = apiKey.length > 0;

let configured = false;
let purchasesModule: any = null;

// Load the native SDK lazily (see the native-module note above) and
// configure it once. Throws a truthful error if the module is
// unavailable instead of ever faking a configured state.
async function loadPurchases(): Promise<any> {
  if (!isRevenueCatConfigured) {
    throw new Error('RevenueCat is not configured — set EXPO_PUBLIC_REVENUECAT_API_KEY, then restart / rebuild.');
  }
  if (!purchasesModule) {
    try {
      const mod = await import('react-native-purchases');
      purchasesModule = mod.default ?? mod;
    } catch {
      throw new Error('RevenueCat needs a development build — it is not available in Expo Go. Install a dev build of this code, then try again.');
    }
  }
  if (!purchasesModule || typeof purchasesModule.configure !== 'function') {
    throw new Error('RevenueCat needs a development build — it is not available in Expo Go. Install a dev build of this code, then try again.');
  }
  if (!configured) {
    purchasesModule.configure({ apiKey });
    configured = true;
  }
  return purchasesModule;
}

function isPremiumCustomerInfo(customerInfo: any): boolean {
  if (!customerInfo) return false;
  const active = customerInfo.entitlements?.active;
  if (!active) return false;
  // `active` is a map keyed by entitlement id. Premium only when the
  // configured entitlement id is present and active.
  const entry = active[PREMIUM_ENTITLEMENT_ID];
  return Boolean(entry);
}

function toRcPackage(pkg: any): RcPackage {
  const product = pkg?.product ?? {};
  return {
    identifier: String(pkg?.identifier ?? product?.identifier ?? ''),
    packageType: String(pkg?.packageType ?? ''),
    title: String(product?.title ?? pkg?.identifier ?? ''),
    description: String(product?.description ?? ''),
    priceString: String(product?.priceString ?? ''),
  };
}

// Fetch the current offering's packages (prices come from RevenueCat
// only). Returns [] when there is no current offering or no packages
// — callers must show "No products available", never invent prices.
export async function fetchOfferings(): Promise<RcPackage[]> {
  const Purchases = await loadPurchases();
  const offerings = await Purchases.getOfferings();
  const packages = offerings?.current?.availablePackages ?? [];
  return packages.map(toRcPackage).filter((p: RcPackage) => p.identifier.length > 0);
}

// True only when the premium entitlement is active in RevenueCat's
// CustomerInfo. Any error (including a missing native module) is
// thrown so callers can surface it — it is never swallowed into a
// fake "not premium" or a fake "premium".
export async function checkPremium(): Promise<boolean> {
  const Purchases = await loadPurchases();
  const customerInfo = await Purchases.getCustomerInfo();
  return isPremiumCustomerInfo(customerInfo);
}

// Purchase one package by its identifier (looked up from a fresh
// offerings fetch, never from a hardcoded product id). Returns true
// only when the resulting CustomerInfo has the premium entitlement
// active. A user-cancelled purchase or any other error is thrown so
// the UI can surface it truthfully — it is never reported as success.
export async function purchasePackageById(identifier: string): Promise<boolean> {
  const Purchases = await loadPurchases();
  const offerings = await Purchases.getOfferings();
  const packages = offerings?.current?.availablePackages ?? [];
  const pkg = packages.find((p: any) => String(p?.identifier) === identifier);
  if (!pkg) {
    throw new Error('That product is not available in the current RevenueCat offering. Check the products in the RevenueCat dashboard, then try again.');
  }
  const result = await Purchases.purchasePackage(pkg);
  const customerInfo = result?.customerInfo ?? result;
  return isPremiumCustomerInfo(customerInfo);
}

// Restore previous purchases. Returns true only when the restored
// CustomerInfo has the premium entitlement active; otherwise false
// (the user simply has no active premium purchase to restore — that
// is not an error, and the UI must say so, not claim success).
export async function restorePurchases(): Promise<boolean> {
  const Purchases = await loadPurchases();
  const customerInfo = await Purchases.restorePurchases();
  return isPremiumCustomerInfo(customerInfo);
}
