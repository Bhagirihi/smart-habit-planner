// RevenueCat service layer — PREPARED, NOT CONNECTED.
// No credentials, no API key, no products are configured in this build, so:
// - products list is empty, no prices are shown or invented
// - purchase/restore never claim success and never unlock Premium
// - isPremium is always false in v2.1; wiring RevenueCat later means filling
//   configure() with a real key and product IDs, then re-testing the paywall.
export const SUBSCRIPTION_CONFIGURED = false;
export interface ProductInfo { id: string; title: string; price: string; period: string; }
export const AVAILABLE_PRODUCTS: ProductInfo[] = [];
export function isPremium(): boolean { return false; }
export async function restorePurchases(): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: 'No subscription products are configured yet, so there is nothing to restore. This build runs in demo mode and no purchase has been made.' };
}
export async function purchaseProduct(_id: string): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: 'Purchases are not configured in this build. No payment was taken and Premium was not unlocked.' };
}
