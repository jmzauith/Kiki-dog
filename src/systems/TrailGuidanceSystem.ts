/** World-neutral guidance schedule. Renderers choose prints, leaves or shells. */
export class TrailGuidanceSystem {
  private elapsed=0;
  constructor(readonly experienced=false, readonly optional=false) {}
  advance(deltaMs:number):number {
    this.elapsed+=Math.max(0,Math.min(deltaMs,250));
    const delay=this.experienced?6500:1500;
    const repeat=this.experienced?14000:10000;
    if(this.elapsed<delay)return 0;
    const phase=(this.elapsed-delay)%repeat;
    const strength=this.optional?.3:this.experienced?.45:.7;
    return phase<4000?Math.sin(Math.PI*phase/4000)*strength:0;
  }
}
