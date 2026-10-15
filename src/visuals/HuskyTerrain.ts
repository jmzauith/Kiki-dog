import bridge from "../../public/assets/worlds/snowy-peaks/depth/bridge.json";
import lake from "../../public/assets/worlds/snowy-peaks/depth/lake.json";
import cave from "../../public/assets/worlds/snowy-peaks/depth/ice-cave.json";
import igloo from "../../public/assets/worlds/snowy-peaks/depth/igloo.json";
import pass from "../../public/assets/worlds/snowy-peaks/depth/snow-pass.json";
import summit from "../../public/assets/worlds/snowy-peaks/depth/summit.json";
export type GroundPoint = {x:number;y:number;scale:number};
export const TERRAIN_PATHS = {bridge,lake,cave,igloo,pass,summit};
/** The depth guide targets the earlier bridge layout. Fit that path to the
 * approved diagonal landmark without changing progression or the source art. */
export function bridgePath(): GroundPoint[] {
  // Same depth scale contract, with feet fitted to the replacement deck pixels.
  const deckY=[610,594,578,558,546];
  return [...bridge.walkPath.points.map((p,i)=>({...p,y:deckY[i]})), {x:1040,y:565,scale:0.8}];
}
export function pathScale(points: readonly GroundPoint[], t:number): number {
  const u=Math.max(0,Math.min(1,t))*(points.length-1);
  const i=Math.min(points.length-2,Math.floor(u));
  return points[i].scale+(points[i+1].scale-points[i].scale)*(u-i);
}
