import { completeTutorial,tutorialComplete } from '../systems/TutorialProgress';
import { gameStore } from '../systems/PlayContext';
import { gameArt } from './GameArt';
/** A short packing action introduces tap, choice and pointer drag in the world. */
export function firstTrailTutorial(lifecycle?:{once:(event:string,fn:()=>void)=>unknown;off:(event:string,fn:()=>void)=>unknown}):Promise<void>{
 const store=gameStore();if(tutorialComplete(store))return Promise.resolve();
 return new Promise(resolve=>{
  const panel=document.createElement('section');panel.className='trail-tutorial';panel.setAttribute('aria-label','First trail lesson');
  panel.innerHTML='<h2>A little help for the trail</h2><p>Tap the scarf to pick it up. Kiki is ready to explore!</p><div class="tutorial-tray"></div>';
  const tray=panel.querySelector<HTMLElement>('.tutorial-tray')!,copy=panel.querySelector('p')!;
  const scarf=document.createElement('button'),bag=document.createElement('button');scarf.type=bag.type='button';scarf.setAttribute('aria-label','Pick up the scarf');bag.setAttribute('aria-label','Pack scarf in backpack');gameArt(scarf,'🧣');bag.textContent='BACKPACK';tray.append(scarf,bag);document.body.append(panel);
  const cleanup=()=>{panel.remove();lifecycle?.off('shutdown',cleanup);resolve();};lifecycle?.once('shutdown',cleanup);
  let selected=false,dragged=false,pointer:number|undefined,startX=0,startY=0;
  const choose=()=>{selected=true;scarf.classList.add('selected');copy.textContent='Slide the scarf into the backpack — or tap the backpack to pack it.';};
  scarf.onclick=()=>{if(!dragged)choose();dragged=false;};
  const pack=()=>{if(!selected){copy.textContent='Pick up the scarf first.';return;}scarf.remove();bag.disabled=true;bag.textContent='Packed!';copy.textContent='Now turn the trail map. Outside, fading pawprints suggest the way. Tap a landmark and Kiki will follow.';const next=document.createElement('button');next.textContent='Let’s explore';next.onclick=()=>{completeTutorial(store);cleanup();};tray.append(next);};
  bag.onclick=pack;
  scarf.onpointerdown=e=>{pointer=e.pointerId;startX=e.clientX;startY=e.clientY;scarf.setPointerCapture(pointer);choose();};
  scarf.onpointermove=e=>{if(pointer!==e.pointerId)return;dragged=true;scarf.style.transform=`translate(${e.clientX-startX}px,${e.clientY-startY}px)`;};
  scarf.onpointerup=e=>{if(pointer!==e.pointerId)return;pointer=undefined;scarf.style.transform='';const rect=bag.getBoundingClientRect();if(e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom)pack();};
  scarf.onpointercancel=()=>{pointer=undefined;scarf.style.transform='';};
 });
}
