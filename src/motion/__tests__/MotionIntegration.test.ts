import {describe,it,expect} from "vitest";
import {resolveMotion} from "../resolveMotion";
import {MOTIONS,CYCLES,ONESHOTS} from "../motionData";
import {RIGS} from "../rigManifests";
import {NEUTRAL_MODS,newPartState,sampleTracks} from "../KeyframeEngine";
import type {MotionId} from "../motionTypes";
describe("Recovered semantic motion identity",()=>{
  for(const character of ["kiki","husky"] as const) for(const id of Object.keys(MOTIONS) as MotionId[]) {
    it(`${character} stays ${character} during ${id}`,()=>{
      const binding=resolveMotion(character,id);
      expect(binding.rig.startsWith(character+"-")).toBe(true);
      expect(CYCLES[binding.cycle].rig).toBe(binding.rig);
      expect(RIGS[binding.rig]).toBeDefined();
    });
  }
  it("root reactions actually move the body above its ground contact",()=>{
    const root=newPartState();const states=new Map([["@root",root]]);
    const def=ONESHOTS.happy;
    sampleTracks(def.tracks,def.durationMs/2,states,NEUTRAL_MODS);
    expect(root.y).toBeLessThan(0);
  });
});
