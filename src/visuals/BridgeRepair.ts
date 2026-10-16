import { BridgeSlots } from "../systems/BridgeSlots";
import Phaser from "phaser";
import { complete, completed, record } from "../systems/PolishRun";
import { bridgePath } from "./HuskyTerrain";

/** Drag real planks onto gaps on the live bridge. Tap plank then gap is the
 * pointer/touch alternative. Partial repairs restart safely after refresh. */
export function repairBridgeInWorld(scene:Phaser.Scene,status:Phaser.GameObjects.Text):Promise<void> {
  if(completed("bridge-repair-kit")) return Promise.resolve();
  record("interaction-started","broken-bridge",{interactionId:"bridge-repair-kit",kind:"drag-to-target"});
  status.setText("Match each board’s length to its gap. Drag it there, or tap the board and then the gap.");
  const points=bridgePath().slice(1,4);
  return new Promise(resolve=>{
    const objects:Phaser.GameObjects.GameObject[]=[];
    const hud=document.createElement("div"); hud.className="bridge-access spatial-access";
    hud.setAttribute("role","group");hud.setAttribute("aria-label","Repair the bridge");
    document.body.append(hud);
    let selected=-1,finished=false;
    const fitted=new Set<number>();
    const occupied=new Set<number>();
    const sizes=[76,54,36];
    const slots=new BridgeSlots(sizes);
    const gaps=points.map((p,i)=>scene.add.rectangle(p.x,p.y,sizes[i],22,0x203c49,.9).setStrokeStyle(2,0xf3d29a,.85).setAngle(-23).setDepth(12).setInteractive({useHandCursor:true}));
    const boards=points.map((_,i)=>scene.add.image([600,690,765][i],650,"wood-panel").setDisplaySize(sizes[i],22).setDepth(17).setInteractive({draggable:true,useHandCursor:true}));
    const fit=(i:number)=>{
      if(finished||selected<0||occupied.has(i)||fitted.has(selected))return;
      if(!slots.place(selected,i)){status.setText("That board does not fit. Match its length to the glowing gap.");return;}
      const board=boards[selected];fitted.add(selected);occupied.add(i);const p=points[i];
      board.disableInteractive();board.setDepth(12);
      scene.events.emit("kiki-feedback",{name:"plank-snap"});
      scene.tweens.add({targets:board,x:p.x,y:p.y,angle:-23,duration:180});gaps[i].disableInteractive().setAlpha(0);
      status.setText(`${fitted.size} / 3 boards fitted`);selected=-1;
      if(fitted.size!==3)return;
      finished=true;complete("bridge-repair-kit","broken-bridge","bridge-repaired");
      scene.time.delayedCall(650,()=>{cleanup();resolve();});
    };
    const cleanup=()=>{hud.remove();objects.forEach(o=>o.destroy());scene.input.off("drag",drag);scene.input.off("dragend",end);};
    const home=(obj:Phaser.GameObjects.Image)=>scene.tweens.add({targets:obj,x:[600,690,765][boards.indexOf(obj)],y:650,angle:0,duration:220,ease:"Sine.out"});
    const drag=(_p:Phaser.Input.Pointer,obj:Phaser.GameObjects.Image,x:number,y:number)=>{if(!boards.includes(obj)||finished)return;selected=boards.indexOf(obj);obj.setPosition(x,y).setAngle(-23);gaps.forEach((gap,i)=>gap.setStrokeStyle(2,0xffdf91,i===selected&&slots.near(i,x-points[i].x,y-points[i].y)?1:.4));};
    const end=(_p:Phaser.Input.Pointer,obj:Phaser.GameObjects.Image)=>{
      const plank=boards.indexOf(obj);if(plank<0||fitted.has(plank))return;
      selected=plank;const point=points[plank];
      if(slots.near(plank,obj.x-point.x,obj.y-point.y)){fit(plank);}else {home(obj);status.setText("Almost! Bring the board over the matching dark slot, or tap its gap.");}
    };
    scene.input.on("drag",drag);scene.input.on("dragend",end);
    boards.forEach((board,i)=>{board.setInteractive(new Phaser.Geom.Rectangle(0,-board.height*.6,board.width,board.height*2.2),Phaser.Geom.Rectangle.Contains);scene.input.setDraggable(board);board.on("pointerdown",()=>{selected=i;status.setText("Choose a glowing bridge gap.");});const b=document.createElement("button");b.textContent=`Pick up board ${i+1}`;b.onclick=()=>{selected=i;};hud.append(b);});
    gaps.forEach((gap,i)=>{gap.setInteractive(new Phaser.Geom.Rectangle(-3,-14,gap.width+6,50),Phaser.Geom.Rectangle.Contains);gap.on("pointerdown",()=>fit(i));const b=document.createElement("button");b.textContent=`Place in gap ${i+1}`;b.onclick=()=>fit(i);hud.append(b);});
    objects.push(...gaps,...boards);
    scene.events.once("shutdown",cleanup);
  });
}
