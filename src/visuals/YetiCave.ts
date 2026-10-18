import { MathEngine, MathQuestion } from "../systems/MathEngine";
import { gameStore } from "../systems/PlayContext";
import { record } from "../systems/PolishRun";
import { element, button } from "./Collectibles";
import "./yeti-cave.css";

/** A separate, optional practice visit: never changes race turns or rewards. */
export async function visitYetiCave(lifecycle?:{once:(event:string,fn:()=>void)=>unknown;off:(event:string,fn:()=>void)=>unknown}):Promise<void> {
  const art=new Image();art.src="assets/premium/yeti-cave-interior.png";
  await art.decode().catch(()=>undefined);
  return new Promise(resolve=>{
    const room=element("section","yeti-room");room.setAttribute("role","dialog");room.setAttribute("aria-modal","true");room.setAttribute("aria-label","Inside the Ice Cave with Yeti");
    const kiki=element("img","yeti-kiki");kiki.src="assets/premium/kiki-idle-v1.png";kiki.alt="Kiki visiting Yeti";
    const panel=element("div","yeti-panel");const title=element("h2","","A warm welcome from Yeti");
    const text=element("p","","“My toes are chilly, but my brain is warming up! Try three practice questions with me?”");
    const choices=element("div","yeti-choices");const feedback=element("p","yeti-feedback");feedback.setAttribute("aria-live","polite");
    panel.append(title,text,choices,feedback);room.append(kiki,panel);document.body.append(room);
    const engine=new MathEngine(gameStore);let count=0,wrong=0;let q:MathQuestion;
    const close=()=>{lifecycle?.off("shutdown",close);room.remove();resolve();};
    lifecycle?.once("shutdown",close);
    const show=()=>{
      wrong=0;q=engine.nextQuestion("normal",undefined,{operation:(["+","−","×"] as const)[count]});
      record("math-asked","yeti-practice",{required:false});title.textContent=`Yeti’s warm-up · ${count+1} / 3`;
      text.textContent=q.story??"Help Yeti check the supplies.";feedback.textContent="Take your time. Practice never costs a race turn.";choices.replaceChildren();
      const equation=element("strong","yeti-equation",q.prompt);choices.append(equation);
      for(const answer of q.answers) choices.append(button(String(answer),()=>{
        record("math-answered","yeti-practice",{correct:answer===q.correct});
        if(answer===q.correct){count++;feedback.textContent=count===3?"“Three warm-ups done! You’ve warmed my heart, too.”":"“Nicely done! Let’s try a different kind.”";choices.replaceChildren(button(count===3?"Back to the mountain trail":"Next practice question",count===3?close:show));}
        else{wrong++;feedback.textContent=wrong<2?`“Good try! ${q.hint}”`:(q.explanation??q.hint);if(wrong>=2){choices.replaceChildren(button("I understand — try a fresh question",show));}}
      }));choices.querySelector("button")?.focus();
    };
    choices.append(button("Practice with Yeti",show),button("Back to the mountain trail",close));choices.querySelector("button")?.focus();
    room.addEventListener("keydown",e=>{if(e.key!=="Tab")return;const buttons=[...room.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];const i=buttons.indexOf(document.activeElement as HTMLButtonElement);if(e.shiftKey&&i<=0){e.preventDefault();buttons.at(-1)?.focus();}else if(!e.shiftKey&&i===buttons.length-1){e.preventDefault();buttons[0]?.focus();}});
  });
}
