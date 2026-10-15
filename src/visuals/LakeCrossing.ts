import Phaser from "phaser";
import { RingoKikiMover } from "../systems/RingoKikiMover";
import { CharacterMotion } from "../motion/CharacterMotion";
import { complete,completed,record } from "../systems/PolishRun";
import { TERRAIN_PATHS } from "./HuskyTerrain";

/** Lake stones are terrain anchors. Kiki moves on the ice, while cracks and
 * contact FX stay beneath her; nothing replaces the live map with a card. */
export async function crossLakeInWorld(scene:Phaser.Scene,kiki:CharacterMotion,mover:RingoKikiMover,status:Phaser.GameObjects.Text):Promise<void> {
  if(completed("cross-stones"))return;
  record("interaction-started","frozen-lake",{interactionId:"cross-stones",kind:"choose-path"});
  const points=TERRAIN_PATHS.lake.walkPath.points.slice(1);
  status.setText("Follow the pale, solid ice. Dark cracks mean a safer detour.");
  const cracks=scene.add.image(1800,590,"dl-ice-cracks").setDisplaySize(270,100).setDepth(13).setAlpha(.6);
  const hud=document.createElement("div");hud.className="bridge-access";hud.setAttribute("role","group");hud.setAttribute("aria-label","Frozen Lake stepping stones");document.body.append(hud);
  const objects:Phaser.GameObjects.GameObject[]=[cracks];let busy=false,step=0;
  await new Promise<void>(resolve=>{
    const safe=points.map((p,i)=>scene.add.ellipse(p.x,p.y,58,20,0xc4ecf5,.85).setStrokeStyle(2,0xf7faff).setDepth(12).setInteractive({useHandCursor:true}).setData("stone",i));
    objects.push(...safe);
    const risky=scene.add.ellipse(1800,602,62,18,0x426b89,.9).setStrokeStyle(2,0x17384d).setDepth(12).setInteractive({useHandCursor:true});objects.push(risky);
    const buttons:HTMLButtonElement[]=[];
    const visit=async(i:number)=>{
      if(busy||i!==step)return;
      busy=true;buttons.forEach(b=>b.disabled=true);const p=points[i];
      const curve=new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(kiki.x,kiki.y),new Phaser.Math.Vector2((kiki.x+p.x)/2,Math.min(kiki.y,p.y)-8),new Phaser.Math.Vector2(p.x,p.y));
      await mover.walk({curve,gait:"careful",terrain:"ice",arrivalReaction:"none"});
      safe[i].setFillStyle(0xf8e2a4,.8).disableInteractive();step++;busy=false;buttons.forEach((b,j)=>b.disabled=j<step);
      if(step===points.length){complete("cross-stones","frozen-lake","solid-ice");cleanup();resolve();}
      else status.setText("That ice holds. Look for the next pale stone.");
    };
    safe.forEach((s,i)=>{s.on("pointerdown",()=>{void visit(i);});const b=document.createElement("button");b.textContent=["Near shore ice","Pale middle ice","Far bank ice","Leave the lake"][i];b.onclick=()=>{void visit(i);};buttons.push(b);hud.append(b);});
    const warn=()=>{if(busy)return;status.setText("A crack! Kiki tests it and chooses the solid ice nearby.");kiki.react("unsure");cracks.setAlpha(1);record("micro-decision-made","frozen-lake",{choiceId:"avoid-cracked-ice"});};
    risky.on("pointerdown",warn);const b=document.createElement("button");b.textContent="Inspect dark cracked ice";b.onclick=warn;hud.append(b);
    const cleanup=()=>{hud.remove();objects.forEach(o=>o.destroy());};scene.events.once("shutdown",cleanup);
  });
}
