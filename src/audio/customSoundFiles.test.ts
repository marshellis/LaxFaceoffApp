const mockCopied: Array<{ from: string; to: string }> = [];
const mockDeleted: string[] = [];
const mockExisting = new Set<string>();

jest.mock('expo-file-system', () => {
  const join = (parts: unknown[]) =>
    parts.map((p) => (typeof p === 'string' ? p : (p as { uri: string }).uri)).join('/');
  class Directory {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = join(parts);
    }
    create() {}
  }
  class File {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = join(parts);
    }
    get exists() {
      return mockExisting.has(this.uri);
    }
    delete() {
      mockDeleted.push(this.uri);
    }
    async copy(dest: File) {
      mockCopied.push({ from: this.uri, to: dest.uri });
    }
  }
  return { Directory, File, Paths: { document: { uri: 'file:///docs' } } };
});

import {
  deleteCustomSound,
  isLegacyUri,
  persistRecording,
  resolveCustomSound,
} from './customSoundFiles';

beforeEach(() => {
  mockCopied.length = 0;
  mockDeleted.length = 0;
  mockExisting.clear();
});

test('persistRecording copies the take into documents and returns only a file name', async () => {
  const name = await persistRecording('whistle', 'file:///caches/rec-123.m4a');
  expect(name).toMatch(/^whistle-\d+\.m4a$/);
  expect(mockCopied).toEqual([
    { from: 'file:///caches/rec-123.m4a', to: `file:///docs/custom-sounds/${name}` },
  ]);
});

test('resolveCustomSound maps a stored name into documents, keeps legacy absolute URIs', () => {
  expect(resolveCustomSound('down-1.m4a')).toBe('file:///docs/custom-sounds/down-1.m4a');
  expect(resolveCustomSound('file:///old/container/rec.m4a')).toBe('file:///old/container/rec.m4a');
  expect(isLegacyUri('/var/mobile/rec.m4a')).toBe(true);
  expect(isLegacyUri('set-2.m4a')).toBe(false);
});

test('deleteCustomSound removes saved files only, never legacy URIs', () => {
  mockExisting.add('file:///docs/custom-sounds/set-2.m4a');
  deleteCustomSound('set-2.m4a');
  deleteCustomSound('file:///old/rec.m4a');
  deleteCustomSound('missing.m4a');
  deleteCustomSound(undefined);
  expect(mockDeleted).toEqual(['file:///docs/custom-sounds/set-2.m4a']);
});
