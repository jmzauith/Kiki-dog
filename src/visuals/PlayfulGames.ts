import { boardResult, boltMove, lightSolution, makeLights, Mark, pathStep, scentDistance, shuffled, toggleLights } from "../systems/PlayfulPuzzles";
import "./playful-games.css";

export const PLAYFUL_GAMES = {
  "inspect-trail-sign": ["The mixed-up trail map", "Rotate the map tiles until the golden trail connects the paw to the flag.", "map"],
  "sniff-pawprints": ["The forest has changed!", "Find five differences. Tap the changed objects in the right-hand picture.", "difference"],
  "search-igloo-objects": ["The explorer’s memory chest", "Find six matching pairs. Turn over two cards at a time.", "memory"],
  "uncover-bone-cache": ["Kiki’s scent detective", "Three bones are buried here. Dig a snow patch, then use the scent numbers to search nearby.", "bones"],
  "follow-trail-markers": ["Remember the mountain trail", "Watch the markers light up, then repeat their order. Three trails to remember!", "sequence"],
  "cave-crystals": ["Crystal echoes", "Watch the crystals glow. Repeat three growing patterns.", "crystals"],
  "clear-fallen-tree": ["Untangle the branches", "Move the branches to the woodpile. A branch can move only when nothing lies over it.", "branches"],
  "summit-ice": ["The nine lantern gate", "Light all nine lanterns. Each lantern also switches its neighbours above, below, left and right.", "lights"],
  "greet-bolt": ["Paws versus snowflakes", "You are paws. Make a line of three! A win or a draw earns Bolt’s friendship.", "tictactoe"],
  "inspect-sled": ["Pack the racing sled", "Match each piece of equipment to its outline. Choose a piece, then its space — or drag it there.", "packing"],
  "race-downhill": ["Ready, set, glide!", "Catch the moving paw inside the gold zone three times to launch your sled.", "timing"],
  "race-icy-turn": ["Slalom through the snow", "Steer into the glowing lane before each snowbank arrives. Clear six snowbanks.", "steering"],
  "race-deep-snow": ["Paddle through powder", "Follow the glowing paddle: left, then right. Build eight strong strokes.", "rhythm"],
  "race-final-sprint": ["The cheering stretch", "Catch four stars to cheer Kiki across the finish line!", "stars"],
  "lake-path-puzzle": ["Find a way across the ice", "Connect the paw to the flag. Move one ice tile at a time, avoiding the cracked tiles.", "lake"],
  "igloo-bonus-game": ["Bolt’s rematch", "Another friendly game of paws and snowflakes. Win or draw for a golden bonus.", "tictactoe"],
} as const;
export type PlayfulId = keyof typeof PLAYFUL_GAMES;
export function isPlayfulId(id:string): id is PlayfulId { return id in PLAYFUL_GAMES; }

type Board = {
  area: HTMLElement; status: HTMLElement; score: HTMLElement;
  later: (fn:()=>void, ms:number)=>void;
  button: (label:string, glyph:string, parent?:HTMLElement)=>HTMLButtonElement;
  win: ()=>void; hint: (fn:()=>void)=>void;
};
const symbols=["🐾","🌲","🏔️","⛺","❄️","🦴"];

/** A board is an actual game, not a list of completion buttons. The underlying
 * scene remains mounted; only the calling encounter awards progression. */
export function playGame(id:PlayfulId, onHint?:()=>void):Promise<string> {
  const [title,instructions,kind]=PLAYFUL_GAMES[id];
  return new Promise(resolve=>{
    const previous=document.activeElement as HTMLElement|null;
    const overlay=document.createElement("div"); overlay.className="kiki-game-overlay";
    overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label",title);
    const panel=document.createElement("section");panel.className="kiki-game-panel";
    const eyebrow=document.createElement("div");eyebrow.className="game-eyebrow";eyebrow.textContent="KIKI’S MOUNTAIN GAMES";
    const heading=document.createElement("h2");heading.textContent=title;
    const copy=document.createElement("p");copy.textContent=instructions;
    const score=document.createElement("div");score.className="game-score";
    const area=document.createElement("div");area.className=`game-board game-${kind}`;
    const status=document.createElement("p");status.className="game-feedback";status.setAttribute("aria-live","polite");
    const footer=document.createElement("footer");
    panel.append(eyebrow,heading,copy,score,area,status,footer);overlay.append(panel);document.body.append(overlay);
    const timers=new Set<ReturnType<typeof setTimeout>>();let won=false;let round=0;
    const later=(fn:()=>void,ms:number)=>{const generation=round;const t=setTimeout(()=>{timers.delete(t);if(overlay.isConnected&&!won&&generation===round)fn();},ms);timers.add(t);};
    const button=(label:string,glyph:string,parent:HTMLElement=area)=>{const b=document.createElement("button");b.type="button";b.setAttribute("aria-label",label);b.textContent=glyph;parent.append(b);return b;};
    const help=button("Show a hint","💡 Hint",footer);
    const retry=button("Restart this puzzle","↻ Start over",footer);
    const stop=()=>{round++;timers.forEach(clearTimeout);timers.clear();};
    const close=()=>{stop();observer.disconnect();overlay.remove();previous?.focus();resolve(id==="greet-bolt"?"wave":id==="inspect-trail-sign"?"paw-map":"solved");};
    const win=()=>{if(won)return;won=true;stop();score.textContent="✦  WELL PLAYED!  ✦";status.textContent="You did it! Kiki is ready for the next adventure.";area.classList.add("game-won");area.querySelectorAll<HTMLButtonElement>("button").forEach(b=>b.disabled=true);footer.replaceChildren();const next=button("Continue adventure","Continue with Kiki →",footer);next.className="game-continue";next.onclick=close;next.focus();};
    const board:Board={area,status,score,later,button,win,hint:fn=>help.onclick=()=>{onHint?.();fn();}};
    const start=()=>{stop();won=false;area.replaceChildren();area.classList.remove("game-won");score.textContent="";status.textContent="Take your time. Every puzzle can be tried again.";build(board,kind);};
    retry.onclick=start;
    overlay.addEventListener("keydown",e=>{if(e.key!=="Tab")return;const buttons=[...overlay.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];const i=buttons.indexOf(document.activeElement as HTMLButtonElement);if(e.shiftKey&&i<=0){e.preventDefault();buttons.at(-1)?.focus();}else if(!e.shiftKey&&i===buttons.length-1){e.preventDefault();buttons[0]?.focus();}});
    // Player switching and scene cleanup must never leave a live puzzle timer.
    const observer=new MutationObserver(()=>{if(!overlay.isConnected){stop();observer.disconnect();}});observer.observe(document.body,{childList:true});
    start();(area.querySelector("button") as HTMLButtonElement|null)?.focus();
  });
}

function build(b:Board,kind:string):void {
  switch(kind){
    case "memory":return memory(b);
    case "bones":return bones(b);
    case "sequence":case "crystals":return sequence(b,kind==="crystals");
    case "difference":return differences(b);
    case "tictactoe":return ticTacToe(b);
    case "branches":return branches(b);
    case "lights":return lights(b);
    case "map":return map(b);
    case "packing":return packing(b);
    case "lake":return lake(b);
    case "steering":return steering(b);
    case "rhythm":return rhythm(b);
    case "stars":return stars(b);
    default:return timing(b);
  }
}

function memory(b:Board):void {
  const deck=shuffled([...symbols,...symbols]);let first=-1,locked=false,pairs=0,moves=0;const matched=new Set<number>();
  b.area.classList.add("grid-four");
  const cards=deck.map((glyph,i)=>{const card=b.button(`Face-down card ${i+1}`,"❄");card.className="memory-card";card.onclick=()=>{
    if(locked||matched.has(i)||first===i)return;
    card.textContent=glyph;card.setAttribute("aria-label",`Card ${i+1}: ${glyph}`);card.classList.add("flipped");
    if(first<0){first=i;return;}
    moves++;const other=first;first=-1;
    if(deck[other]===glyph){matched.add(i);matched.add(other);cards[other].disabled=card.disabled=true;pairs++;b.score.textContent=`${pairs} / 6 pairs · ${moves} turns`;b.status.textContent="A match! Those treasures stay uncovered.";if(pairs===6)b.win();}
    else{locked=true;b.status.textContent="Remember those pictures. Try another pair.";b.later(()=>{for(const j of [i,other]){cards[j].textContent="❄";cards[j].classList.remove("flipped");cards[j].setAttribute("aria-label",`Face-down card ${j+1}`);}locked=false;},1000);}
  };return card;});
  b.score.textContent="0 / 6 pairs";
  b.hint(()=>{if(locked||first>=0)return;locked=true;cards.forEach((card,i)=>{if(!matched.has(i)){card.textContent=deck[i];card.setAttribute("aria-label",`Card ${i+1}: ${deck[i]}`);}});b.status.textContent="A quick peek — remember where the pairs live!";b.later(()=>{cards.forEach((card,i)=>{if(!matched.has(i)){card.textContent="❄";card.setAttribute("aria-label",`Face-down card ${i+1}`);}});locked=false;},2200);});
}
function bones(b:Board):void {
  const hidden=shuffled(Array.from({length:16},(_,i)=>i)).slice(0,3);const found=new Set<number>();const dug=new Set<number>();
  b.area.classList.add("grid-four");
  const cells=Array.from({length:16},(_,i)=>{const cell=b.button(`Dig row ${Math.floor(i/4)+1}, column ${i%4+1}`,"◡");cell.className="snow-patch";cell.onclick=()=>{if(dug.has(i))return;dug.add(i);cell.disabled=true;
    if(hidden.includes(i)){found.add(i);cell.textContent="🦴";cell.setAttribute("aria-label",`Bone found at row ${Math.floor(i/4)+1}, column ${i%4+1}`);cell.classList.add("found");b.status.textContent="A bone! Kiki’s nose was right.";if(found.size===3){b.win();return;}}
    else b.status.textContent="The number counts steps to the nearest bone still hidden. Smaller means closer!";
    const remaining=hidden.filter(j=>!found.has(j));cells.forEach((c,j)=>{if(dug.has(j)&&!hidden.includes(j)){const d=scentDistance(j,remaining);c.textContent=String(d);c.setAttribute("aria-label",`${d} steps from a hidden bone`);c.classList.toggle("warm",d===1);}});b.score.textContent=`${found.size} / 3 bones found`;
  };return cell;});
  b.score.textContent="0 / 3 bones · numbers are walking steps";
  b.hint(()=>{const i=hidden.find(j=>!found.has(j))!;b.status.textContent=`Kiki smells a bone in row ${Math.floor(i/4)+1}.`;});
}
function sequence(b:Board,crystals:boolean):void {
  const glyphs=crystals?["◆","⬟","▲","●"]:symbols.slice(0,4);const names=crystals?["Blue diamond","Purple crystal","Amber triangle","Pink pearl"]:["Paw","Pine","Mountain","Camp"];
  const pattern=Array.from({length:5},()=>Math.floor(Math.random()*4));let stage=0,index=0,showing=false;
  b.area.classList.add("sequence-board");
  const pads=glyphs.map((glyph,i)=>{const pad=b.button(names[i],glyph);pad.className=`sequence-pad tone-${i}`;pad.onclick=()=>{if(showing)return;pad.classList.add("lit");b.later(()=>pad.classList.remove("lit"),250);
    if(i!==pattern[index]){b.status.textContent="Let’s watch that trail again. You keep your completed rounds.";index=0;show();return;}
    index++;b.status.textContent=`${index} of ${stage+3} remembered!`;if(index===stage+3){showing=true;stage++;if(stage===3){b.win();return;}index=0;b.later(show,700);}
  };return pad;});
  const show=()=>{showing=true;index=0;pads.forEach(p=>p.disabled=true);b.score.textContent=`Round ${stage+1} / 3 · ${stage+3} markers`;b.status.textContent="Watch closely…";
    for(let n=0;n<stage+3;n++){b.later(()=>{pads[pattern[n]].classList.add("lit");b.status.textContent=`Watch: ${names[pattern[n]]}`;},400+n*850);b.later(()=>pads[pattern[n]].classList.remove("lit"),1000+n*850);}
    b.later(()=>{showing=false;pads.forEach(p=>p.disabled=false);b.status.textContent="Your turn! Repeat the order.";},500+(stage+3)*850);
  };
  b.hint(()=>{if(!showing)show();});show();
}
function ticTacToe(b:Board):void {
  let board:Mark[]=Array(9).fill(null),busy=false;let rounds=1;
  b.area.classList.add("grid-three");
  const render=()=>cells.forEach((c,i)=>{c.textContent=board[i]==="paw"?"🐾":board[i]==="snow"?"❄":"";c.classList.toggle("paw-mark",board[i]==="paw");c.disabled=!!board[i]||busy;c.setAttribute("aria-label",`Square ${i+1}${board[i]?": "+board[i]:", empty"}`);});
  const result=()=>{const r=boardResult(board);if(!r)return false;if(r==="paw"||r==="draw"){b.win();return true;}busy=true;render();b.status.textContent="Bolt found a line! Try blocking two snowflakes next time. Tap Rematch.";const rematch=b.button("Rematch Bolt","↻ Rematch");rematch.className="board-wide";rematch.onclick=()=>{board=Array(9).fill(null);busy=false;rounds++;b.score.textContent=`You 🐾 · Bolt ❄ · Game ${rounds}`;rematch.remove();render();};return true;};
  const cells=Array.from({length:9},(_,i)=>{const c=b.button(`Square ${i+1}, empty`,"");c.onclick=()=>{if(busy||board[i])return;board[i]="paw";render();if(result())return;busy=true;render();b.status.textContent="Bolt is thinking…";b.later(()=>{const move=boltMove(board);if(move>=0)board[move]="snow";busy=false;render();if(!result())b.status.textContent="Your move. Can you build a line or block Bolt?";},650);};return c;});
  b.score.textContent="You 🐾 · Bolt ❄ · A draw counts too!";
  b.hint(()=>{if(busy)return;const swapped=board.map(m=>m==="paw"?"snow":m==="snow"?"paw":null);const move=boltMove(swapped);if(move>=0){cells[move].classList.add("hinted");b.status.textContent="Try the glowing square. Look for two in a row!";b.later(()=>cells[move].classList.remove("hinted"),2000);}});
}
function lights(b:Board):void {
  let state=makeLights(shuffled([0,1,2,3,4,5,6,7,8]).slice(0,3));let moves=0;
  b.area.classList.add("grid-three");
  const render=()=>{cells.forEach((c,i)=>{c.textContent=state[i]?"☀":"☾";c.classList.toggle("lit",state[i]);c.setAttribute("aria-label",`Lantern ${i+1}, ${state[i]?"lit":"dark"}`);});b.score.textContent=`${state.filter(Boolean).length} / 9 lanterns · ${moves} moves`;};
  const cells=state.map((_,i)=>{const c=b.button(`Lantern ${i+1}`,"");c.className="lantern";c.onclick=()=>{state=toggleLights(state,i);moves++;render();if(state.every(Boolean))b.win();};return c;});render();
  b.hint(()=>{const solution=lightSolution(state);if(solution.length){const c=cells[solution[0]];c.classList.add("hinted");b.status.textContent=`Try lantern ${solution[0]+1}. ${solution.length} moves can light them all.`;b.later(()=>c.classList.remove("hinted"),2200);}});
}
function map(b:Board):void {
  // A six-tile hairpin trail: enter top-left, turn down, leave bottom-left.
  const target=[0,0,0,0,0,1];let rotations=target.map(t=>(t+1+Math.floor(Math.random()*3))%4);
  const aligned=(i:number)=>i===2||i===5?rotations[i]===target[i]:rotations[i]%2===0;
  b.area.classList.add("map-board");
  const start=document.createElement("div");start.className="board-wide";start.textContent="🐾 START → → →    ↴    (camp is below the start)";b.area.append(start);
  const tiles=rotations.map((_,i)=>{const tile=b.button(`Trail tile ${i+1}`,"");const path=i===2||i===5?'M0 50H50V100':'M0 50H100';tile.innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g><path d="${path}" fill="none" stroke="#e7bc64" stroke-width="18"/><path d="${path}" fill="none" stroke="#fff2bf" stroke-width="3" stroke-dasharray="7 6"/></g></svg>`;tile.onclick=()=>{rotations[i]=(rotations[i]+1)%4;render();if(rotations.every((_,j)=>aligned(j)))b.win();};return tile;});
  const render=()=>{tiles.forEach((tile,i)=>{tile.querySelector("g")!.setAttribute("transform",`rotate(${rotations[i]*90} 50 50)`);tile.setAttribute("aria-label",`Trail tile ${i+1}, ${aligned(i)?"connected":"needs turning"}`);});b.score.textContent=`${rotations.filter((_,i)=>aligned(i)).length} / 6 trail tiles connected`;};const finish=document.createElement("div");finish.className="board-wide";finish.textContent="⚑ CAMP ← ← ←";b.area.append(finish);render();b.hint(()=>{b.status.textContent="The right-hand corners connect the two rows. Make a U-shaped trail: across, down, then back to camp.";});
}
function branches(b:Board):void {
  const remaining=new Set([0,1,2,3,4,5]);const order=shuffled([0,1,2,3,4,5]);
  b.area.classList.add("branch-board");
  const pile=b.button("Place branch in woodpile","WOODPILE  🪵");pile.className="woodpile";let selected=-1;
  const branches=order.map((id,layer)=>{const branch=b.button(`Branch ${id+1}`,"");branch.className="branch-piece";branch.style.cssText=`top:${12+layer*10}%;left:${8+(layer%2)*10}%;transform:rotate(${layer%2?18:-18}deg);z-index:${layer+1}`;branch.innerHTML='<svg viewBox="0 0 300 35" aria-hidden="true"><path d="M12 20L285 15M90 18L70 2M180 17L215 32" fill="none" stroke="#2a1d13" stroke-width="19" stroke-linecap="round"/><path d="M12 16L285 11M90 14L70 2" fill="none" stroke="#b9854e" stroke-width="10" stroke-linecap="round"/></svg>';
    branch.onclick=()=>{if(!remaining.has(id))return;const top=[...order].reverse().find(j=>remaining.has(j));if(top!==id){b.status.textContent="That branch is underneath another. Find the one lying on top.";return;}selected=id;branch.classList.add("selected");b.status.textContent="Now move it to the woodpile.";};
    branch.draggable=true;branch.ondragstart=e=>{branch.click();if(selected!==id)e.preventDefault();};return branch;});
  const move=()=>{if(selected<0)return;remaining.delete(selected);branches[order.indexOf(selected)].remove();selected=-1;b.score.textContent=`${6-remaining.size} / 6 branches cleared`;pile.textContent="🪵 ".repeat(6-remaining.size);if(!remaining.size)b.win();};
  pile.setAttribute("role","button");pile.tabIndex=0;pile.setAttribute("aria-label","Place branch in woodpile");pile.onclick=move;pile.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();move();}};pile.ondragover=e=>e.preventDefault();pile.ondrop=e=>{e.preventDefault();move();};
  b.score.textContent="0 / 6 branches cleared";b.hint(()=>{const top=[...order].reverse().find(j=>remaining.has(j))!;branches[order.indexOf(top)].classList.add("hinted");b.status.textContent=`Branch ${top+1} is on top.`;});
}
function packing(b:Board):void {
  const gear=["🧤","🪢","🔔","🧣","🥾","🦴"];const names=["Mittens","Rope","Bell","Scarf","Boots","Snack"];let selected=-1;const placed=new Set<number>();
  const slots=document.createElement("div");slots.className="gear-slots";b.area.append(slots);
  const tray=document.createElement("div");tray.className="gear-tray";b.area.append(tray);
  const targets=gear.map((g,i)=>{const t=b.button(`Pack ${names[i]} here`,g,slots);t.className="gear-slot";t.onclick=()=>{if(selected<0)return;if(selected!==i){b.status.textContent="Look at the outline. That piece belongs in another space.";return;}placed.add(i);t.classList.add("packed");pieces[i].disabled=true;pieces[i].classList.remove("selected");selected=-1;b.score.textContent=`${placed.size} / 6 packed`;if(placed.size===6)b.win();};t.ondragover=e=>e.preventDefault();t.ondrop=e=>{e.preventDefault();t.click();};return t;});
  const pieces:HTMLButtonElement[]=[];
  shuffled(gear.map((_,i)=>i)).forEach(i=>{const p=b.button(names[i],gear[i],tray);pieces[i]=p;p.draggable=true;const select=()=>{if(placed.has(i))return;selected=i;pieces.forEach(p=>p.classList.remove("selected"));p.classList.add("selected");};p.onclick=select;p.ondragstart=select;});
  b.score.textContent="0 / 6 packed";b.hint(()=>{if(selected<0){b.status.textContent="Choose an item below the sled bag first.";return;}targets[selected].classList.add("hinted");b.later(()=>targets.forEach(t=>t.classList.remove("hinted")),1800);});
}
function lake(b:Board):void {
  const cracked=new Set([0,1,2,6,13,14]);let current=12;const visited=[12];b.area.classList.add("grid-four");
  const cells=Array.from({length:16},(_,i)=>{const cell=b.button(`Ice tile ${i+1}${cracked.has(i)?", cracked":""}`,cracked.has(i)?"╳":i===3?"⚑":"◇");cell.className="ice-tile";cell.classList.toggle("cracked",cracked.has(i));cell.onclick=()=>{if(cracked.has(i)){b.status.textContent="That ice is cracked. Kiki stays safe — try a solid tile.";return;}if(!pathStep(current,i)){b.status.textContent="One tile at a time: up, down, left or right.";return;}current=i;visited.push(i);render();if(i===3)b.win();};return cell;});
  const render=()=>{cells.forEach((c,i)=>{c.textContent=i===current?"🐾":cracked.has(i)?"╳":i===3?"⚑":visited.includes(i)?"•":"◇";c.classList.toggle("selected",i===current);});};render();b.score.textContent="🐾 → ⚑ · Up, down, left or right";
  b.hint(()=>{b.status.textContent="Try up, up, right, down, right, right — then follow the right edge up to the flag.";});
}
function differences(b:Board):void {
  const before=["🌲","🌲","☀","🐦","🏔️","⛺","🪵","🌼","🦴","🐾","🌲","❄"];
  const after=["🌲","🌲","☾","🦋","🏔️","⛺","🪵","🍄","🦴","👣","🌲","⭐"];
  const changed=[2,3,7,9,11];const found=new Set<number>();
  const left=document.createElement("div");left.className="difference-scene";left.setAttribute("aria-label","Original forest picture");
  const right=document.createElement("div");right.className="difference-scene";right.setAttribute("aria-label","Changed forest picture");b.area.append(left,right);
  before.forEach((g,i)=>{const s=document.createElement("span");s.textContent=g;s.setAttribute("aria-label",`Original object ${i+1}: ${g}`);left.append(s);});
  const items=after.map((g,i)=>{const item=b.button(`Compare object ${i+1}: ${g}`,g,right);item.onclick=()=>{if(found.has(i))return;if(!changed.includes(i)){b.status.textContent="Those two match. Look carefully at another pair of objects.";return;}found.add(i);item.classList.add("found");item.disabled=true;left.children[i].classList.add("found");b.score.textContent=`${found.size} / 5 differences`;if(found.size===5)b.win();};return item;});
  b.score.textContent="BEFORE                         AFTER · 0 / 5";b.hint(()=>{const i=changed.find(j=>!found.has(j))!;items[i].classList.add("hinted");b.status.textContent="Compare the glowing object with the same place on the left.";b.later(()=>items[i].classList.remove("hinted"),1800);});
}
function timing(b:Board):void {
  let hits=0;let assisted=false;const track=document.createElement("div");track.className="launch-track";track.innerHTML='<div class="launch-zone"></div><div class="launch-paw">🐾</div>';b.area.append(track);const start=performance.now();
  const tap=b.button("Launch when the paw reaches gold","🐾");tap.className="launch-button";
  tap.onclick=()=>{const phase=((performance.now()-start)%2200)/2200;if(phase<(assisted?.2:.35)||phase>(assisted?.8:.65)){b.status.textContent="A little early or late. Watch for the gold zone — your catches stay.";return;}hits++;b.score.textContent=`${hits} / 3 good launches`;tap.disabled=true;if(hits===3)b.win();else b.later(()=>tap.disabled=false,700);};b.score.textContent="0 / 3 good launches";b.hint(()=>{assisted=true;track.classList.add("wide-zone");b.status.textContent="A bigger gold zone! Tap while the paw is near the middle.";});
}
function steering(b:Board):void {
  let cleared=0,lane=1,target=0;const track=document.createElement("div");track.className="slalom-track";b.area.append(track);
  const lanes=Array.from({length:3},(_,i)=>{const l=b.button(`Steer to lane ${i+1}`,i===lane?"🛷":"",track);l.onclick=()=>{lane=i;render();};return l;});
  const render=()=>lanes.forEach((l,i)=>{l.textContent=i===lane?"🛷":"";l.classList.toggle("safe-lane",i===target);});
  const wave=()=>{target=Math.floor(Math.random()*3);render();track.classList.remove("approaching");void track.offsetWidth;track.classList.add("approaching");b.status.textContent=`Open trail: lane ${target+1}. Steer into the glow!`;b.score.textContent=`${cleared} / 6 snowbanks passed`;
    b.later(()=>{if(lane===target){cleared++;if(cleared===6){b.win();return;}b.status.textContent="Smooth turn!";}else b.status.textContent="Soft snow slows the sled. Try that turn again — no progress lost.";b.later(wave,600);},2600);
  };b.hint(()=>{lane=target;render();b.status.textContent="Kiki helps steer this one. Follow the glowing lane next time.";});wave();
}
function rhythm(b:Board):void {
  let strokes=0;const paddle=[b.button("Left paddle","◀ 🛶"),b.button("Right paddle","🛶 ▶")];
  const render=()=>{paddle.forEach((p,i)=>p.classList.toggle("lit",i===strokes%2));b.score.textContent=`${strokes} / 8 strokes`;};
  paddle.forEach((p,i)=>p.onclick=()=>{if(i!==strokes%2){b.status.textContent="Other side! Follow the glow to keep the sled straight.";return;}strokes++;render();p.disabled=true;b.later(()=>p.disabled=false,250);if(strokes===8)b.win();});render();b.hint(()=>{b.status.textContent="Alternate left and right. The bright paddle is next.";});
}
function stars(b:Board):void {
  let caught=0;const places=shuffled([0,1,2,3,4,5,6,7,8]);b.area.classList.add("grid-three");
  const cells=places.map((_,i)=>{const c=b.button(`Cheer spot ${i+1}`,"");c.onclick=()=>{if(i!==places[caught])return;caught++;if(caught===4){b.win();return;}render();};return c;});
  const render=()=>{cells.forEach((c,i)=>{c.textContent=i===places[caught]?"⭐":"·";c.setAttribute("aria-label",i===places[caught]?"Catch the cheering star":`Empty cheer spot ${i+1}`);});b.score.textContent=`${caught} / 4 cheers`;};render();b.hint(()=>{b.status.textContent="Tap the golden star. It moves to a new place after each cheer.";});
}
