import type { StorageLike } from "./ProfileStore";
export type Operation = "+" | "−" | "×" | "÷";
export type MathQuestion = {
  prompt: string; answers: number[]; correct: number;
  difficulty: "normal" | "challenge"; hint: string;
  story?: string; explanation?: string; fact?: string; operation?: Operation; warmup?: boolean;
};
export const MATH_HISTORY_KEY = "math:history:v1";
const shuffle = <T>(items:T[]):T[] => {
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
};
/** Bounded pools guarantee termination even with a fixed random source. History is
 * supplied by the caller's profile store, never by global browser storage. */
export class MathEngine {
  private recent:string[]=[];
  private ordinal=0;
  constructor(private readonly store?:()=>StorageLike) {}
  nextQuestion(difficulty:MathQuestion["difficulty"]="normal", previousPrompt?:string, options:{operation?:Operation;warmup?:boolean}={}):MathQuestion {
    try {const data=JSON.parse(this.store?.().getItem(MATH_HISTORY_KEY)??"null");
      if(data && Array.isArray(data.recent)){this.recent=data.recent.filter((v:unknown)=>typeof v==="string").slice(-120);this.ordinal=Number.isSafeInteger(data.ordinal)&&data.ordinal>=0?data.ordinal:0;}
    } catch { /* Keep in-memory history if persistence is unavailable. */ }
    const operations:Operation[]=["+","−","×","+","×","−","÷"];
    // Randomize the initial phase per profile; subsequent questions cover a mix.
    if(!this.ordinal && !this.recent.length) this.ordinal=Math.floor(Math.random()*6);
    const operation=options.operation ?? (options.warmup?(["+","−"] as const)[this.ordinal%2]:operations[this.ordinal%operations.length]);
    const pool:MathQuestion[]=[];
    const harder=difficulty==="challenge" && !options.warmup;
    const additive=operation==="+"||operation==="−";
    const min=harder?(additive?12:6):2;
    const max=harder?(additive?25:12):9;
    const bMin=harder?(additive?6:4):2;
    const bMax=harder&&additive?15:9;
    for(let a=min;a<=max;a++) for(let b=bMin;b<=bMax;b++) {
      const left=operation==="−"?a+b:operation==="÷"?a*b:a;
      const result=operation==="+"?a+b:operation==="−"?a:operation==="×"?a*b:a;
      const fact=(operation==="+"||operation==="×")?`${Math.min(a,b)}${operation}${Math.max(a,b)}`:`${left}${operation}${b}`;
      const missing=this.ordinal%4===2 && operation!=="÷";
      const correct=missing?b:result;
      const prompt=missing?`${left} ${operation} ? = ${result}`:`${left} ${operation} ${b} = ?`;
      let hint:string,explanation:string,story:string;
      if(operation==="+"){hint="Start with the larger number and count on.";explanation=`Start with ${a}. Add ${b} more to reach ${result}. ${a} + ${b} = ${result}.`;story=`Kiki packs ${a} treats, then ${b} more. How many treats?`;}
      else if(operation==="−"){hint="Count back, or think about the addition that undoes it.";explanation=`There were ${left} treats. Taking away ${b} leaves ${result}. Check: ${result} + ${b} = ${left}.`;story=`Kiki has ${left} treats and shares ${b}. How many remain?`;}
      else if(operation==="×"){hint=`Add ${b} for each of the ${a} equal groups.`;explanation=`${a} equal groups of ${b}: ${Array(a).fill(b).join(" + ")} = ${result}.`;story=`${a} supply bags hold ${b} treats each. How many treats altogether?`;}
      else {hint=`Which number multiplied by ${b} makes ${left}?`;explanation=`Share ${left} treats equally between ${b} bowls. Each gets ${a}, because ${b} × ${a} = ${left}.`;story=`Share ${left} treats equally between ${b} bowls. How many in each?`;}
      if(missing){story="Find the missing number to balance the supply count.";explanation+=` The missing number is ${b}.`;}
      if(this.ordinal%4===0)story="Help Kiki check the supplies.";
      const answers=new Set<number>([correct]);
      for(const offset of shuffle([-b,b,-1,1,-2,2,3]))if(correct+offset>0&&answers.size<4)answers.add(correct+offset);
      for(let n=1;answers.size<4;n++)answers.add(correct+n);
      pool.push({prompt,answers:shuffle([...answers]),correct,difficulty,hint,story,explanation,fact,operation,warmup:options.warmup});
    }
    const candidates=pool.filter(q=>q.prompt!==previousPrompt);
    const fresh=candidates.filter(q=>!this.recent.includes(q.fact!));
    const q=shuffle(fresh.length?fresh:candidates)[0];
    this.recent=[...this.recent,q.fact!].slice(-120);this.ordinal++;
    try{this.store?.().setItem(MATH_HISTORY_KEY,JSON.stringify({recent:this.recent,ordinal:this.ordinal}));}catch{/* Play remains possible without storage. */}
    return q;
  }
}
