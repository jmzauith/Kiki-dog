import Phaser from "phaser";
/** Atlas rectangles measured against the generated sheet, not an assumed equal grid. */
const FRAMES: Record<string,[number,number,number,number]>={
 "lm-trailhead":[0,35,362,380],
 "lm-bridge-broken":[362,140,362,275],
 "lm-bridge-fixed":[724,140,382,275],
 "lm-fork-sign":[1108,65,340,355],
 "ip-fl-safe":[0,470,370,245],
 "lm-ice-cave":[371,420,353,300],
 "lm-igloo-discovered":[729,465,357,255],
 "lm-fallentree-blocked":[1088,480,360,240],
 "lm-snowpass-blocked":[0,758,365,280],
 "ip-sg-open":[365,725,360,310],
 "lm-race-gate":[727,748,365,295],
 "lm-bonecache-revealed":[1095,815,353,225],
};
const ALIASES:Record<string,string>={"lm-bridge-repairing":"lm-bridge-broken","lm-igloo-hidden":"lm-igloo-discovered","lm-igloo-glow":"lm-igloo-discovered","lm-fallentree-cleared":"lm-fallentree-blocked","lm-snowpass-cleared":"lm-snowpass-blocked","ip-sg-locked":"ip-sg-open","lm-bonecache-hidden":"lm-bonecache-revealed"};
export function createPremiumProps(scene:Phaser.Scene):void {
 const texture=scene.textures.get("premium-props");
 for(const [name,rect] of Object.entries(FRAMES))if(!texture.has(name))texture.add(name,0,...rect);
 for(const [name,target] of Object.entries(ALIASES))if(!texture.has(name))texture.add(name,0,...FRAMES[target]);
}
