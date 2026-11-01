import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { resolveCustomSound } from './customSoundFiles';

/**
 * Resolve a require()'d asset module (number) or a stored custom-sound value (string: a file
 * name in documents, or a legacy absolute URI) to an ArrayBuffer of its bytes.
 *
 * Native reads go through expo-file-system rather than fetch(): since SDK 56 the global fetch is
 * expo/fetch, and reading local files directly avoids depending on fetch's file:// handling.
 */
export async function toArrayBuffer(source: number | string): Promise<ArrayBuffer> {
  let uri: string;
  if (typeof source === 'number') {
    const asset = Asset.fromModule(source);
    await asset.downloadAsync();
    uri = asset.localUri ?? asset.uri;
  } else {
    uri = Platform.OS === 'web' ? source : resolveCustomSound(source);
  }
  if (Platform.OS === 'web' || !uri.startsWith('file://')) {
    const res = await fetch(uri);
    return res.arrayBuffer();
  }
  return new File(uri).arrayBuffer();
}
