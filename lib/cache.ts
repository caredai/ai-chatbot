import { Buffer, INSPECT_MAX_BYTES } from "buffer";
import { LRUCache } from "lru-cache";

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const serverCache = new Map<string, CacheEntry<any>>();

export function cache<T>(
  fetchDataFn: () => Promise<T>,
  keyParts: string[],
  {
    revalidate: ttl,
  }: {
    // The number of seconds after which the cache should be revalidated
    revalidate: number;
  }
): () => Promise<T> {
  return async () => {
    const key = keyParts.join(",");
    const cached = serverCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const data = await fetchDataFn();
    serverCache.set(key, { data, expiresAt: Date.now() + ttl * 1000 });
    return data;
  };
}

export const lruCache = new LRUCache<string, object>({
  maxSize: 50 * 1024 * 1024, // 50MB

  // https://github.com/isaacs/node-lru-cache/issues/358#issue-2612104848
  sizeCalculation: (value, key) => {
    let sum = 0;
    const keySize = Buffer.byteLength(key, "utf8");

    const valSize =
      typeof value === "string"
        ? Buffer.byteLength(value, "utf8")
        : Buffer.byteLength(JSON.stringify(value), "utf-8");

    // calc KeysMap key + index(int)
    sum += keySize + INT_SIZE_BYTES;
    // calc keyList key size
    sum += keySize;
    // calc valList val size
    sum += valSize;

    // calc ttl start + ttl
    // next arr
    sum += INT_SIZE_BYTES;
    // prev arr
    sum += INSPECT_MAX_BYTES;

    // size of the size itself
    sum += INT_SIZE_BYTES;

    // ttl start arr
    sum += INT_SIZE_BYTES;

    return Math.floor(sum * 1.5);
  },

  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

const INT_SIZE_BYTES = 64;
