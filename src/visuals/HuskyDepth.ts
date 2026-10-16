import { isPlayfulId, playGame } from "./PlayfulGames";
import { complete, completed, record } from "../systems/PolishRun";
import { HUSKY_INTERACTIONS } from "../systems/HuskyInteractions";
import "./husky-depth.css";
type Option = {id:string; label:string};
type Mode = "choice"|"search"|"ordered"|"timing";
/** Accessible interaction HUD over the live world; never a second scene painting. */
export async function depth(id:string,node:string,title:string,body:string,options:Option[],_art="lm-fork-sign", mode:Mode="choice"): Promise<string> {
  if(completed(id)) return "";
  const spec=HUSKY_INTERACTIONS.find(i=>i.id===id);
  record("interaction-started",node,{interactionId:id,kind:spec?.kind??mode});
  if (isPlayfulId(id)) {
    const choice = await playGame(id,()=>record("hint-shown",node,{interactionId:id}));
    complete(id,node,choice);
    return choice;
  }
  return new Promise(resolve=>{
    const overlay=document.createElement("div"); overlay.className="husky-depth";
    overlay.setAttribute("role","dialog"); overlay.setAttribute("aria-modal","true"); overlay.setAttribute("aria-label",title);
    const panel=document.createElement("section");
    const heading=document.createElement("h2"); heading.textContent=title;
    const copy=document.createElement("p"); copy.textContent=body;
    const actions=document.createElement("div"); actions.className="depth-actions";
    const feedback=document.createElement("p"); feedback.setAttribute("aria-live","polite"); feedback.className="depth-feedback";
    panel.append(heading,copy,actions,feedback); overlay.append(panel); document.body.append(overlay);
    let count=0; const seen=new Set<string>(); const pulls=new Set<string>();
    let revealTimer:ReturnType<typeof setTimeout>|undefined;
    const reveal=()=>{actions.classList.add("markers-revealed");clearTimeout(revealTimer);revealTimer=setTimeout(()=>actions.classList.remove("markers-revealed"),2500);};
    if(id==="follow-trail-markers") reveal();
    const start=performance.now(); let timing:HTMLDivElement|undefined;
    if(mode==="timing") { timing=document.createElement("div");timing.className="depth-timing";timing.innerHTML='<span class="timing-zone"></span><span class="timing-paw">🐾</span>';timing.setAttribute("aria-label","Tap when the paw is in the gold zone");actions.append(timing); }
    const finish=(choice:string)=>{clearTimeout(revealTimer);complete(id,node,choice);overlay.remove();resolve(choice);};
    options.forEach((option,index)=>{
      const button=document.createElement("button"); button.textContent=option.label;button.setAttribute("aria-label",option.label);
      actions.append(button);
      button.onclick=()=>{
        if(mode==="timing") {
          const phase=((performance.now()-start)%1800)/1800;
          if(phase<0.22||phase>0.88) {feedback.textContent="Almost! Try when the paw reaches the gold snow.";return;}
        }
        if(mode==="ordered"&&index!==count) {feedback.textContent="A little wobble! Follow the trail in order — your progress is safe.";reveal();button.animate([{transform:"rotate(-4deg)"},{transform:"rotate(4deg)"},{transform:"rotate(0)"}],{duration:250});return;}
        if(id==="clear-fallen-tree"&&index>=3&&!pulls.has(option.id)) {pulls.add(option.id);feedback.textContent="A heavy log! Give Kiki one more pull.";button.classList.add("loosened");return;}
        if(mode==="search"||mode==="ordered") {
          if(seen.has(option.id))return; seen.add(option.id);count++;button.disabled=true;button.classList.add("target-complete");
          button.textContent="✓ "+option.label;
          feedback.textContent=`${count} of ${options.length} — Kiki is following your lead!`;
          if(id==="search-igloo-objects")feedback.textContent=["An old expedition lantern — it still glows.","Paw stamps trace the explorers’ path to the summit.","A hidden treat! The explorers left a surprise for their next visitor."][index];
          if(id==="cross-stones") { feedback.textContent=index%2?"The ice creaks, but holds. Kiki lands safely!":"A safe landing — on to the next stone!"; }
          if(count<options.length)return;
        }
        finish(option.id);
      };
    });
    // Keep keyboard focus inside the interaction; all pointer tasks have button equivalents.
    overlay.addEventListener("keydown",event=>{
      if(event.key!=="Tab")return;
      const buttons=[...overlay.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
      const current=buttons.indexOf(document.activeElement as HTMLButtonElement);
      if(event.shiftKey&&current<=0){event.preventDefault();buttons.at(-1)?.focus();}
      else if(!event.shiftKey&&current===buttons.length-1){event.preventDefault();buttons[0]?.focus();}
    });
    (overlay.querySelector("button") as HTMLButtonElement)?.focus();
  });
}
export async function advice(id:string,node:string,line:string,options:Option[]):Promise<string>{
  const choice=await depth(id,node,"Kiki asks you…",line,options);
  if(choice)record("advice-choice-made",node,{choiceId:choice});
  return choice;
}
