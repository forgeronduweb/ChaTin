import { File, Paths } from 'expo-file-system';

const file = new File(Paths.document, 'seen-announcements.json');

function readSeenIds(): string[] {
  if (!file.exists) return [];
  try {
    const data = JSON.parse(file.textSync()) as { ids?: string[] };
    return Array.isArray(data.ids) ? data.ids : [];
  } catch {
    return [];
  }
}

export function hasSeenAnnouncement(id: string): boolean {
  return readSeenIds().includes(id);
}

export function markAnnouncementSeen(id: string): void {
  const ids = readSeenIds();
  if (ids.includes(id)) return;
  // Capped so this can't grow forever - only recent history matters for
  // deciding whether to show the "next launch" modal again.
  const updated = [...ids, id].slice(-200);
  if (!file.exists) file.create();
  file.write(JSON.stringify({ ids: updated }));
}
