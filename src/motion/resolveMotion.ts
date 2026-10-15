import { MOTIONS, type MotionBinding } from "./motionData";
import type { CharacterId, MotionId } from "./motionTypes";

/** Commands describe action; they must never change a character's identity. */
export function resolveMotion(character:CharacterId,id:MotionId):MotionBinding {
  const base=MOTIONS[id];
  if(character === "husky") {
    if(id === "idle") return {...base,char:character,rig:"husky-idle",cycle:"husky-idle"};
    const cycle=id === "run" || id === "race-fast" ? "husky-fast" : id === "race-turbo" ? "husky-turbo" : "husky-steady";
    return {...base,char:character,rig:"husky-race",cycle};
  }
  if(id.startsWith("race-")) return {...base,char:character,rig:id === "race-steady"?"kiki-trot":"kiki-run",cycle:id === "race-steady"?"kiki-trot":"kiki-run"};
  return base;
}
