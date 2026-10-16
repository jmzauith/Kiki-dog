import { PLAYFUL_GAMES, PlayfulId, playGame } from "./PlayfulGames";

/** Development-only QA surface. Does not select a profile, save progress or
 * award rewards. It exercises the same board code used by the adventure. */
export function showGameLab():void {
  const root=document.createElement("main");root.style.cssText="min-height:100vh;box-sizing:border-box;padding:36px;background:#153544;color:#fff0d1;font:18px Georgia";
  const title=document.createElement("h1");title.textContent="Mountain games · inspection";
  const note=document.createElement("p");note.textContent="Practice any board. Adventure saves are not changed.";root.append(title,note);
  const grid=document.createElement("div");grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px";root.append(grid);
  for(const id of Object.keys(PLAYFUL_GAMES) as PlayfulId[]){const button=document.createElement("button");button.textContent=PLAYFUL_GAMES[id][0];button.style.cssText="padding:18px;color:#ffe3a0;background:#295566;border:1px solid #d4b474;border-radius:14px;font:18px Georgia;cursor:pointer";button.onclick=async()=>{await playGame(id);button.textContent="✓ "+PLAYFUL_GAMES[id][0];};grid.append(button);}
  document.body.append(root);
}
