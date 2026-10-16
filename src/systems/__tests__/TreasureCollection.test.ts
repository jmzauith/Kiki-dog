import { describe, it, expect } from "vitest";
import { memoryStore, ProfileScopedStore } from "../ProfileStore";
import { awardGoldenBone, hasGoldenBone } from "../TreasureCollection";
describe("golden bone collectible",()=>{
 it("awards once and survives a new store wrapper",()=>{const base=memoryStore();const store=new ProfileScopedStore(base,"one");expect(hasGoldenBone(store)).toBe(false);expect(awardGoldenBone(store)).toBe(true);expect(awardGoldenBone(store)).toBe(false);expect(hasGoldenBone(new ProfileScopedStore(base,"one"))).toBe(true);});
 it("keeps each child's collection separate",()=>{const base=memoryStore();awardGoldenBone(new ProfileScopedStore(base,"one"));expect(hasGoldenBone(new ProfileScopedStore(base,"two"))).toBe(false);});
});
