import { Asset } from 'expo-asset';

/**
 * Resolve a require()'d asset module (number) or a file URI (string) to an
 * ArrayBuffer of its bytes.
 */
export async function toArrayBuffer(source: number | string): Promise<ArrayBuffer> {
  let uri: string;
  if (typeof source === 'number') {
    const asset = Asset.fromModule(source);
    await asset.downloadAsync();
    uri = asset.localUri ?? asset.uri;
  } else {
    uri = source;
  }
  const res = await fetch(uri);
  return res.arrayBuffer();
}
