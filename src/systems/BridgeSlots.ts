/** A plank owns exactly one matching slot; drops use local slot coordinates. */
export class BridgeSlots {
  readonly occupied=new Set<number>();
  constructor(readonly widths:readonly number[]){}
  accepts(plank:number,slot:number):boolean {return plank===slot&&slot>=0&&slot<this.widths.length&&!this.occupied.has(slot);}
  place(plank:number,slot:number):boolean {if(!this.accepts(plank,slot))return false;this.occupied.add(slot);return true;}
  near(plank:number,dx:number,dy:number,angle=-23):boolean {
    const a=-angle*Math.PI/180,x=dx*Math.cos(a)-dy*Math.sin(a),y=dx*Math.sin(a)+dy*Math.cos(a);
    return Math.abs(x)<=Math.min(28,this.widths[plank]/2)&&Math.abs(y)<=22;
  }
}
