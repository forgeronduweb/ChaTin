import { syncAnnouncementStatuses } from './admin-store.js';

const SYNC_INTERVAL_MS = 2 * 60 * 1000;

// Scheduled/published are time-relative states (see schema.ts) - this is
// what actually makes "publier plus tard" / "expire le" take effect instead
// of just sitting there until an admin manually flips the status.
export function scheduleAnnouncementSync(): void {
  const run = () => void syncAnnouncementStatuses().catch((error) => console.error('Announcement status sync failed:', error));
  run();
  setInterval(run, SYNC_INTERVAL_MS);
}
