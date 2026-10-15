import {describe,it,expect} from "vitest";
import {bridgePath,pathScale} from "../../visuals/HuskyTerrain";
describe("Harrison terrain integration",()=>{
  it("crosses the approved diagonal bridge with a continuous depth change",()=>{
    const path=bridgePath();
    // Arrival must clear the far abutment, including after checkpoint restore.
    expect(path.at(-1)!.x).toBeGreaterThan(1000);
    expect(path.at(-1)!.scale).toBe(path.at(-2)!.scale);
    expect(path.at(-1)!.x).toBeGreaterThan(path[0].x);
    expect(path.at(-1)!.y).toBeLessThan(path[0].y);
    expect(Math.min(...path.map(p=>p.scale))).toBeLessThan(path[0].scale);
    for(let t=0;t<=1;t+=.05) expect(pathScale(path,t)).toBeGreaterThan(.5);
  });
  it("clamps endpoint scales without a pop",()=>{
    const points=bridgePath();
    expect(pathScale(points,-1)).toBe(points[0].scale);
    expect(pathScale(points,2)).toBe(points.at(-1)!.scale);
  });
});
