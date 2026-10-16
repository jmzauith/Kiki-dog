import type { StorageLike } from "./ProfileStore";
const KEY = "husky:golden-bone:v1";
export function hasGoldenBone(store: StorageLike): boolean { return store.getItem(KEY) === "earned"; }
export function awardGoldenBone(store: StorageLike): boolean {
  const fresh = !hasGoldenBone(store);
  store.setItem(KEY, "earned");
  return fresh;
}
