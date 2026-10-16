import Phaser from 'phaser';
import { TrailGuidanceSystem } from '../systems/TrailGuidanceSystem';
export class TrailGuidance {
  private cues:{images:Phaser.GameObjects.Image[]; clock:TrailGuidanceSystem}[]=[];
  constructor(private scene:Phaser.Scene){}
  add(from:{x:number;y:number},to:{x:number;y:number},experienced:boolean,optional=false):void {
    const images:Phaser.GameObjects.Image[]=[];
    // A short suggestion near Kiki, not an always-visible full route.
    const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy)||1;
    for(let i=1;i<=6;i++){
      const t=Math.min(.65,(i*22)/len), side=i%2?5:-5;
      images.push(this.scene.add.image(from.x+dx*t-dy/len*side,from.y+dy*t+dx/len*side,'fx-paw').setScale(.85).setTint(0x506d86).setRotation(Math.atan2(dy,dx)+Math.PI/2).setAlpha(0).setDepth(9));
    }
    this.cues.push({images,clock:new TrailGuidanceSystem(experienced,optional)});
  }
  update(delta:number):void {for(const cue of this.cues){const a=cue.clock.advance(delta);cue.images.forEach((p,i)=>p.setAlpha(a*(1-i*.09)));}}
  clear():void {for(const c of this.cues)c.images.forEach(i=>i.destroy());this.cues=[];}
}
