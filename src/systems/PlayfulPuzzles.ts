/** Pure rules shared by the playable boards and their regression tests. */
export function shuffled<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export type Mark = "paw" | "snow" | null;
const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export function boardResult(board: readonly Mark[]): Mark | "draw" {
  for (const [a,b,c] of lines) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return board.every(Boolean) ? "draw" : null;
}
/** Bolt spots immediate wins and blocks, but leaves strategic forks for kids. */
export function boltMove(board: readonly Mark[]): number {
  if (boardResult(board)) return -1;
  for (const mark of ["snow", "paw"] as const) {
    for (let i=0;i<9;i++) if (!board[i]) {
      const trial = [...board]; trial[i] = mark;
      if (boardResult(trial) === mark) return i;
    }
  }
  return [4,0,8,2,6,1,3,5,7].find(i => !board[i]) ?? -1;
}
export function scentDistance(index: number, hidden: readonly number[], width=4): number {
  return Math.min(...hidden.map(target => Math.abs(index%width-target%width)+Math.abs(Math.floor(index/width)-Math.floor(target/width))));
}
export function toggleLights(board: readonly boolean[], index: number): boolean[] {
  return board.map((on,i) => (i===index || (Math.abs(i%3-index%3)+Math.abs(Math.floor(i/3)-Math.floor(index/3))===1)) ? !on : on);
}
export function makeLights(moves: readonly number[]): boolean[] {
  return moves.reduce<boolean[]>((board,i)=>toggleLights(board,i),Array(9).fill(true));
}
export function lightSolution(board: readonly boolean[]): number[] {
  for (let mask=0;mask<512;mask++) {
    let trial=[...board]; const moves:number[]=[];
    for(let i=0;i<9;i++) if(mask&(1<<i)){trial=toggleLights(trial,i);moves.push(i);}
    if(trial.every(Boolean)) return moves;
  }
  return [];
}
export function pathStep(current: number, next: number, width=4): boolean {
  return Math.abs(current%width-next%width)+Math.abs(Math.floor(current/width)-Math.floor(next/width))===1;
}
