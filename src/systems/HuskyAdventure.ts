/**
 * HuskyAdventure — the Snowy Peaks mini-adventure definition.
 *
 * The Husky level is a COMPLETE MINI-ADVENTURE, not a short walk to the race.
 * Target first-play duration: ~12–18 minutes.
 *
 * Structure:
 *   trailhead → broken-bridge → forest → fork choice
 *     ├─ safe:     frozen-lake → fallen-tree ─┐
 *     └─ challenge: ice-cave ────────────────┤
 *                                              ▼
 *                        snow-pass → summit-camp → sled-race → husky-reward
 *   secrets: secret-igloo + snow-cache (unlock at snow-pass)
 *
 * Required encounters: 6 on the safe path (bridge, forest, lake, tree,
 * summit, race), 5 on the challenge path (bridge, forest, cave, summit,
 * race). Optional: secret igloo (+bonus challenge), hidden bone cache.
 *
 * Rhythm: ~60% exploration/gameplay (walks, choice, discovery, secrets),
 * ~40% explicit educational interaction (math that changes the world:
 * repairing the bridge, lighting the safe ice path, opening the summit
 * gate, race decisions).
 *
 * Presentation mapping: several nodes reuse Harrison's existing landmark
 * art via LANDMARK_FOR. Nodes mapped to null get a lightweight placeholder
 * marker (AdventureMarkers) that Harrison can reskin later.
 */
import { NODE_POSITIONS, FUTURE_NODE_SPOTS, SCENERY_SPOTS } from "../worlds/husky/HuskyWorldLayout";
import {
  AdventureDefinition,
  AdventureNodeDef,
} from "./AdventureState";

export const HUSKY_SAVE_KEY = "kiki-dog-adventure-husky-v1";

const N = (
  id: string,
  label: string,
  x: number,
  y: number,
  encounter: AdventureNodeDef["encounter"],
  extra: Partial<AdventureNodeDef> = {},
): AdventureNodeDef => ({ id, label, x, y, encounter, ...extra });

export const HUSKY_ADVENTURE: AdventureDefinition = {
  id: "husky",
  name: "Snowy Peaks — Husky Adventure",
  stickerName: "Husky",
  startNodeId: "trailhead",
  raceNodeId: "sled-race",
  rewardNodeId: "husky-reward",

  nodes: [
    N("trailhead", "Trailhead", NODE_POSITIONS.start.x, NODE_POSITIONS.start.y, "checkpoint", {
      checkpoint: true,
      hint: "Kiki's adventure begins!",
    }),
    N("broken-bridge", "Broken Bridge", NODE_POSITIONS.math1.x, NODE_POSITIONS.math1.y, "math-normal", {
      required: true,
      mathDifficulty: "normal",
      curriculum: ["multiplication"],
      hint: "Math repairs the bridge — the planks swing back into place!",
    }),
    N("forest", "Whisper Forest", FUTURE_NODE_SPOTS.forest.x, FUTURE_NODE_SPOTS.forest.y, "choice", {
      required: true,
      hint: "Kiki sniffs both trails. Which one looks safe?",
    }),
    // Safe branch
    N("frozen-lake", "Frozen Lake", NODE_POSITIONS.safe.x, NODE_POSITIONS.safe.y, "math-normal", {
      required: true,
      mathDifficulty: "normal",
      curriculum: ["multiplication"],
      hint: "Math lights the safe stepping stones across the ice!",
    }),
    N("fallen-tree", "Fallen Tree", FUTURE_NODE_SPOTS.fallenTree.x, FUTURE_NODE_SPOTS.fallenTree.y, "discovery", {
      required: true,
      hint: "Tap the fallen tree to help Kiki push it aside!",
    }),
    // Challenge branch
    N("ice-cave", "Ice Cave", NODE_POSITIONS.challenge.x, NODE_POSITIONS.challenge.y, "math-challenge", {
      required: true,
      mathDifficulty: "challenge",
      curriculum: ["multiplication"],
      hint: "The shortcut is fast but the math is harder!",
    }),
    // Rejoin
    N("snow-pass", "Snow Pass", FUTURE_NODE_SPOTS.snowPass.x, FUTURE_NODE_SPOTS.snowPass.y, "checkpoint", {
      checkpoint: true,
      hint: "Rest stop — Kiki catches her breath.",
    }),
    N("summit-camp", "Summit Gate", FUTURE_NODE_SPOTS.summitCamp.x, FUTURE_NODE_SPOTS.summitCamp.y, "math-normal", {
      required: true,
      mathDifficulty: "normal",
      curriculum: ["multiplication"],
      hint: "Solve the gatekeeper's math to open the Summit Gate!",
    }),
    // Secrets (optional)
    N("secret-igloo", "Secret Igloo", SCENERY_SPOTS.igloo.x, SCENERY_SPOTS.igloo.y, "secret", {
      optional: true,
      secret: true,
      mathDifficulty: "challenge",
      curriculum: ["multiplication"],
      hint: "A hidden igloo! Knock to see who is home…",
    }),
    N("snow-cache", "Bone Cache", FUTURE_NODE_SPOTS.snowCache.x, FUTURE_NODE_SPOTS.snowCache.y, "secret", {
      optional: true,
      secret: true,
      hint: "Something sparkles in the snow…",
    }),
    // Virtual nodes (no map marker)
    N("sled-race", "Sled Race", 0, 0, "race", { required: true }),
    N("husky-reward", "Husky Reward", 0, 0, "reward"),
  ],

  edges: [
    { from: "trailhead", to: "broken-bridge", kind: "safe" },
    { from: "broken-bridge", to: "forest", kind: "safe" },
    { from: "forest", to: "frozen-lake", kind: "safe", requiresRoute: "safe" },
    { from: "forest", to: "ice-cave", kind: "challenge", requiresRoute: "challenge" },
    { from: "frozen-lake", to: "fallen-tree", kind: "safe" },
    { from: "fallen-tree", to: "snow-pass", kind: "safe" },
    { from: "ice-cave", to: "snow-pass", kind: "challenge" },
    { from: "snow-pass", to: "summit-camp", kind: "safe" },
    { from: "summit-camp", to: "sled-race", kind: "safe" },
    { from: "snow-pass", to: "secret-igloo", kind: "secret" },
    { from: "snow-pass", to: "snow-cache", kind: "secret" },
  ],

  requiredAlways: ["broken-bridge", "forest", "summit-camp"],
  requiredByRoute: {
    safe: ["frozen-lake", "fallen-tree"],
    challenge: ["ice-cave"],
  },
};

/**
 * Maps new adventure node ids to Harrison's existing landmark art keys
 * (from Landmarks.ts). Nodes mapped to null have no dedicated art yet and
 * get a lightweight placeholder marker — Harrison can reskin them.
 */
export const LANDMARK_FOR: Record<string, "start" | "math1" | "fork" | "safe" | "challenge" | "goal" | "igloo" | null> = {
  "trailhead": "start",
  "broken-bridge": "math1",
  "forest": "fork",
  "frozen-lake": "safe",
  "fallen-tree": null,
  "ice-cave": "challenge",
  "snow-pass": null,
  "summit-camp": null,
  "secret-igloo": "igloo",
  "snow-cache": null,
  "sled-race": "goal",
  "husky-reward": null,
};

/** Where Kiki stands relative to each node marker (tuned per landmark). */
export const KIKI_OFFSETS: Record<string, { x: number; y: number }> = {
  "trailhead": { x: -108, y: -2 },
  "broken-bridge": { x: -118, y: -6 },
  "forest": { x: -64, y: 24 },
  "frozen-lake": { x: -98, y: 8 },
  "fallen-tree": { x: -90, y: 12 },
  "ice-cave": { x: -104, y: 28 },
  "snow-pass": { x: -100, y: 4 },
  "summit-camp": { x: -124, y: 12 },
  "secret-igloo": { x: -60, y: 6 },
  "snow-cache": { x: -40, y: 0 },
};

export function kikiTargetFor(node: AdventureNodeDef): { x: number; y: number } {
  const o = KIKI_OFFSETS[node.id] ?? { x: 0, y: -26 };
  return { x: node.x + o.x, y: node.y + o.y };
}
