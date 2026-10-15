import { profiles, selectPlayer } from "../systems/PlayContext";
import type { PlayerProfile } from "../systems/PlayerProfiles";

/** Preview UI; avatar portraits remain a production-art backlog item. */
export function choosePlayer(): Promise<void> {
  return new Promise((resolve) => {
    const gate = document.createElement("section");
    gate.className = "player-start";
    gate.innerHTML = `<div class="start-card"><div class="eyebrow">KIKI'S DOG ADVENTURE · VISUAL PREVIEW</div>
      <h1>Adventure awaits.</h1><p>Who is exploring Snowy Peaks?</p>
      <div class="player-list"></div><form><label for="nickname">Create an adventurer</label>
      <div class="create-row"><input id="nickname" name="nickname" maxlength="24" placeholder="Your nickname" required autocomplete="off"><button>Create & play</button></div>
      <p class="start-error" role="status"></p></form>
      <small>Your adventures are saved separately on this device.</small></div>
      <img class="start-kiki" src="/assets/characters/kiki/kiki-a-idle.svg" alt="Kiki, the tailless tricolor corgi">`;
    document.body.append(gate);
    const start = (player: PlayerProfile) => {
      selectPlayer(player);
      gate.remove();
      const switcher = document.createElement("button");
      switcher.className = "player-switch";
      switcher.textContent = `${player.displayName} · Switch player`;
      switcher.addEventListener("click", () => location.reload());
      document.body.append(switcher);
      resolve();
    };
    const list = gate.querySelector(".player-list")!;
    for (const player of profiles.listProfiles()) {
      const button = document.createElement("button");
      button.className = "player-card";
      button.textContent = player.displayName;
      button.addEventListener("click", () => start(player));
      list.append(button);
    }
    gate.querySelector("form")!.addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        start(profiles.createProfile({ displayName: (gate.querySelector("input") as HTMLInputElement).value }));
      } catch {
        gate.querySelector(".start-error")!.textContent = "Choose a nickname to begin.";
      }
    });
  });
}
