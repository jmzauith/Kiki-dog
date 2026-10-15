import { gameStore } from "./PlayContext";
import { PlaythroughLog, TelemetryEventType } from "./HuskyTelemetry";
const KEY = "husky:polish-run:v1";
export const polishLog = new PlaythroughLog();
let done = new Set<string>();
let ended = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let cleanup: (() => void) | undefined;
function save(): void { gameStore().setItem(KEY, JSON.stringify({events: polishLog.getEvents(), done: [...done]})); }
export function record(type: TelemetryEventType, nodeId?: string, detail?: Record<string,string|number|boolean>): void {
  if (ended) return;
  polishLog.record(type,nodeId,detail); if(type === "run-ended") ended = true; save();
}
export function completed(id: string): boolean { return done.has(id); }
export function complete(id: string, nodeId: string, choice = ""): void {
  if(done.has(id)) return;
  done.add(id); record("interaction-completed",nodeId,{interactionId:id,choice}); save();
}
export function startPolishRun(fresh = false): void {
  if(fresh) { gameStore().removeItem("husky:race-checkpoint"); document.getElementById("playtest-stats")?.remove(); }
  cleanup?.(); clearTimeout(timer); ended = false; done = new Set(); polishLog.clear();
  if(!fresh) try {
    const saved = JSON.parse(gameStore().getItem(KEY) ?? "null");
    if(saved && Array.isArray(saved.events) && Array.isArray(saved.done)) {
      polishLog.restore(saved.events); done = new Set(saved.done);
      ended = saved.events.some((e: {type:string}) => e.type === "run-ended");
    }
  } catch { /* A malformed optional log never blocks an adventure. */ }
  if(!polishLog.getEvents().length) record("run-started");
  const active = () => {
    if(ended) return;
    polishLog.markActive(); save(); clearTimeout(timer);
    timer = setTimeout(() => { if(!ended) { polishLog.markIdle(); save(); } },PlaythroughLog.IDLE_THRESHOLD_MS);
  };
  const visibility = () => { if(document.hidden && !ended) { clearTimeout(timer); polishLog.markIdle(); save(); } else active(); };
  window.addEventListener("pointerdown",active); window.addEventListener("keydown",active); document.addEventListener("visibilitychange",visibility);
  cleanup = () => { window.removeEventListener("pointerdown",active); window.removeEventListener("keydown",active); document.removeEventListener("visibilitychange",visibility); };
  active();
}
export function finishPolishRun(): void { polishLog.markActive(); record("run-ended"); clearTimeout(timer); }
export function showPlaytestStats(): void {
  if(!new URLSearchParams(location.search).has("playtest")) return;
  document.getElementById("playtest-stats")?.remove();
  const details = document.createElement("details"); details.id="playtest-stats";
  details.style.cssText="position:fixed;bottom:4px;left:4px;z-index:1000;max-height:35vh;overflow:auto;background:#142e40;color:#fff;padding:8px;font:12px monospace";
  const title=document.createElement("summary"); title.textContent="Local playtest results";
  const pre=document.createElement("pre"); pre.textContent=JSON.stringify(JSON.parse(polishLog.toJSON()),null,2);
  details.append(title,pre); document.body.append(details);
}
