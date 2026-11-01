import { Directory, File, Paths } from 'expo-file-system';
import type { CueKind } from '@/src/practice/types';

/**
 * Custom cue recordings live in the app's DOCUMENTS directory, and settings store only the
 * file NAME. Two reasons:
 *  - the recorder writes to the caches directory, which iOS may purge at any time;
 *  - an absolute path embeds the app-container UUID, which changes when the app is updated,
 *    so a stored absolute URI silently stops resolving after an update.
 */
const DIR_NAME = 'custom-sounds';

function soundsDir(): Directory {
  return new Directory(Paths.document, DIR_NAME);
}

/** True for a value written by an older build (an absolute URI rather than a file name). */
export function isLegacyUri(stored: string): boolean {
  return stored.includes('://') || stored.startsWith('/');
}

/** Copy a fresh recording out of the cache into documents; returns the name to persist. */
export async function persistRecording(kind: CueKind, tempUri: string): Promise<string> {
  const dir = soundsDir();
  dir.create({ idempotent: true, intermediates: true });
  const ext = tempUri.split('?')[0].split('.').pop() || 'm4a';
  const name = `${kind}-${Date.now()}.${ext}`;
  await new File(tempUri).copy(new File(dir, name));
  return name;
}

/** Resolve a stored value (file name, or a legacy absolute URI) to a URI that can be read. */
export function resolveCustomSound(stored: string): string {
  return isLegacyUri(stored) ? stored : new File(soundsDir(), stored).uri;
}

/** Best-effort delete of a previously saved recording (ignores legacy URIs and missing files). */
export function deleteCustomSound(stored: string | undefined): void {
  if (!stored || isLegacyUri(stored)) return;
  try {
    const f = new File(soundsDir(), stored);
    if (f.exists) f.delete();
  } catch {
    /* already gone */
  }
}
