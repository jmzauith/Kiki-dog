import { MathQuestion } from "../systems/MathEngine";
import "./playful-games.css";

export function explainMath(q: MathQuestion, consequence: string, nextLabel: string): Promise<void> {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "kiki-game-overlay";
    overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Let’s work it out");
    const panel = document.createElement("section"); panel.className = "kiki-game-panel";
    const title = document.createElement("h2"); title.textContent = "Let’s work it out";
    const answer = document.createElement("p"); answer.style.cssText = "font-size:32px;color:#ffe3a0;margin:22px auto";
    answer.textContent = q.prompt.replace("?", String(q.correct));
    const operands = q.prompt.match(/(\d+) × (\d+)/);
    const explanation = document.createElement("p");
    if (q.explanation) explanation.textContent = q.explanation;
    else if (operands) {
      const a = Number(operands[1]), b = Number(operands[2]);
      explanation.textContent = `${a} groups of ${b} means adding ${b}, ${a} times: ${Array(a).fill(b).join(" + ")} = ${q.correct}.`;
    } else explanation.textContent = q.hint;
    const message = document.createElement("p"); message.textContent = consequence;
    const footer = document.createElement("footer"); const next = document.createElement("button");
    next.className = "game-continue"; next.textContent = nextLabel;
    next.onclick = () => { overlay.remove(); resolve(); };
    next.onkeydown = event => { if(event.key === "Tab") { event.preventDefault(); next.focus(); } };
    footer.append(next); panel.append(title, answer, explanation, message, footer); overlay.append(panel);
    document.body.append(overlay); next.focus();
  });
}
