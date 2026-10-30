// Supabase service layer — PREPARED, NOT CONNECTED. No URL, key, or account
// is configured. All data lives in local SQLite, so the app works fully offline.
// Backup and Sync in Settings must show exactly this status.
export const SYNC_CONFIGURED = false;
export function syncStatus(): string {
  return SYNC_CONFIGURED
    ? 'Connected to cloud backup.'
    : 'Not connected. Your data is stored only on this device and the app works fully offline. Cloud backup is not set up yet, so no data has been uploaded.';
}
