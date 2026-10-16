import { describe, expect, it } from "vitest";
import { boardResult, boltMove, lightSolution, makeLights, Mark, pathStep, scentDistance, shuffled, toggleLights } from "../PlayfulPuzzles";

describe("playable puzzle rules",()=>{
  it("shuffles without losing or inventing memory pairs",()=>{
    const cards=shuffled([0,0,1,1,2,2,3,3,4,4,5,5],()=>.37);
    expect(cards).toHaveLength(12);
    for(let i=0;i<6;i++)expect(cards.filter(c=>c===i)).toHaveLength(2);
  });
  it("recognizes rows, columns and diagonals for either player",()=>{
    for(const line of [[0,1,2],[0,3,6],[0,4,8],[2,4,6]])for(const mark of ["paw","snow"] as const){
      const board:Mark[]=Array(9).fill(null);line.forEach(i=>board[i]=mark);expect(boardResult(board)).toBe(mark);
    }
  });
  it("recognizes a draw without awarding a win",()=>{
    expect(boardResult(["paw","snow","paw","paw","snow","snow","snow","paw","paw"])).toBe("draw");
    expect(boardResult(Array(9).fill(null))).toBeNull();
  });
  it("Bolt takes a winning square and blocks an immediate threat",()=>{
    expect(boltMove(["snow","snow",null,"paw",null,"paw",null,null,null])).toBe(2);
    expect(boltMove(["paw","paw",null,null,"snow",null,null,null,null])).toBe(2);
  });
  it("Bolt never overwrites a piece or moves after the game ends",()=>{
    expect(boltMove(["paw","paw","paw",null,null,null,null,null,null])).toBe(-1);
    const board:Mark[]=["paw",null,null,null,"snow",null,null,null,null];
    expect(board[boltMove(board)]).toBeNull();
  });
  it("all generated gate scrambles have a working hint solution",()=>{
    for(let a=0;a<9;a++)for(let c=0;c<9;c++)for(let d=0;d<9;d++){
      const start=makeLights([a,c,d]);
      const solution=lightSolution(start);
      expect(solution.reduce((state,i)=>toggleLights(state,i),start).every(Boolean)).toBe(true);
    }
  });
  it("gate toggles do not wrap across rows and are reversible",()=>{
    const state=Array(9).fill(false);const next=toggleLights(state,2);
    expect(next.map((on,i)=>on?i:-1).filter(i=>i>=0)).toEqual([1,2,5]);
    expect(toggleLights(next,2)).toEqual(state);
  });
  it("bone scent counts walking steps and updates when a bone is found",()=>{
    expect(scentDistance(0,[1,15])).toBe(1);
    expect(scentDistance(0,[15])).toBe(6);
    expect(scentDistance(15,[15])).toBe(0);
  });
  it("lake steps cannot jump diagonally or wrap between rows",()=>{
    expect(pathStep(3,4)).toBe(false);expect(pathStep(0,5)).toBe(false);
    expect(pathStep(12,8)).toBe(true);expect(pathStep(8,4)).toBe(true);
  });
  it("the frozen lake has a traversable safe path",()=>{
    const route=[12,8,4,5,9,10,11,7,3];const cracked=[0,1,2,6,13,14];
    for(let i=1;i<route.length;i++){expect(pathStep(route[i-1],route[i])).toBe(true);expect(cracked).not.toContain(route[i]);}
  });
});
