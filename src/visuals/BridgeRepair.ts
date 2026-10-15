import Phaser from "phaser";
import { complete, completed, record } from "../systems/PolishRun";
import { bridgePath } from "./HuskyTerrain";

/** Drag real planks onto gaps on the live bridge. Tap plank then gap is the
 * keyboard/touch alternative. Partial repairs restart safely after refresh. */
export function repairBridgeInWorld(scene:Phaser.Scene,status:Phaser.GameObjects.Text):Promise<void> {
  if(completed("bridge-repair-kit")) return Promise.resolve();
  record("interaction-started","broken-bridge",{interactionId:"bridge-repair-kit",kind:"drag-to-target"});
  status.setText("Drag each board onto a glowing gap — or tap board, then gap.");
  const points=bridgePath().slice(1,4);
  return new Promise(resolve=>{
    const objects:Phaser.GameObjects.GameObject[]=[];
    const hud=document.createElement("div"); hud.className="bridge-access";
    hud.setAttribute("role","group");hud.setAttribute("aria-label","Repair the bridge");
    document.body.append(hud);
    let selected=-1,finished=false;
    const fitted=new Set<number>();
    const occupied=new Set<number>();
    const gaps=points.map(p=>scene.add.ellipse(p.x,p.y,54,19,0xffd878,0.5).setAngle(-23).setDepth(12).setInteractive({useHandCursor:true}));
    const boards=points.map((_,i)=>scene.add.image(660+i*38,610,"wood-panel").setDisplaySize(58,22).setDepth(17).setInteractive({draggable:true,useHandCursor:true}));
    const fit=(i:number)=>{
      if(finished||selected<0||occupied.has(i)||fitted.has(selected))return;
      const board=boards[selected];fitted.add(selected);occupied.add(i);const p=points[i];
      board.disableInteractive();board.setDepth(12);
      scene.tweens.add({targets:board,x:p.x,y:p.y,angle:-23,duration:180});gaps[i].disableInteractive().setAlpha(0);
      status.setText(`${fitted.size} / 3 boards fitted`);selected=-1;
      if(fitted.size!==3)return;
      finished=true;complete("bridge-repair-kit","broken-bridge","bridge-repaired");
      scene.time.delayedCall(250,()=>{cleanup();resolve();});
    };
    const cleanup=()=>{hud.remove();objects.forEach(o=>o.destroy());scene.input.off("drag",drag);scene.input.off("dragend",end);};
    const drag=(_p:Phaser.Input.Pointer,obj:Phaser.GameObjects.Image,x:number,y:number)=>{if(!boards.includes(obj)||finished)return;selected=boards.indexOf(obj);obj.setPosition(x,y);};
    const end=(_p:Phaser.Input.Pointer,obj:Phaser.GameObjects.Image)=>{const i=points.findIndex((p,j)=>gaps[j].input?.enabled&&Phaser.Math.Distance.Between(p.x,p.y,obj.x,obj.y)<65);if(i>=0)fit(i);else if(boards.includes(obj))obj.setPosition(660+boards.indexOf(obj)*38,610);};
    scene.input.on("drag",drag);scene.input.on("dragend",end);
    boards.forEach((board,i)=>{board.on("pointerdown",()=>{selected=i;status.setText("Choose a glowing bridge gap.");});const b=document.createElement("button");b.textContent=`Pick up board ${i+1}`;b.onclick=()=>{selected=i;};hud.append(b);});
    gaps.forEach((gap,i)=>{gap.on("pointerdown",()=>fit(i));const b=document.createElement("button");b.textContent=`Place in gap ${i+1}`;b.onclick=()=>fit(i);hud.append(b);});
    objects.push(...gaps,...boards);
    scene.events.once("shutdown",cleanup);
  });
}
