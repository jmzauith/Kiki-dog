import type { MapNodeId } from "../../systems/MapGraph";

/**
 * HuskyWorldLayout — the shared spatial contract for the Snowy Peaks expansion.
 *
 * Snowy Peaks is now a REAL scrolling level: 3360x720 world units (~2.6x the
 * 1280x720 viewport), three visually distinct regions, camera follows Kiki.
 *
 * WHO OWNS WHAT
 * - Harrison (world art): owns this file, region art, landmark placement,
 *   camera feel, discovery fog, secret/optional scenery.
 * - McCartney (progression): owns MapGraph nodes/edges/encounters. When adding
 *   new gameplay nodes, place them at the FUTURE_NODE_SPOTS coordinates below
 *   (or update this file and tell Harrison) so art and logic stay aligned.
 * - Lead dev: merges both.
 *
 * COORDINATE NOTES
 * - World origin is top-left (0,0). Y grows downward. Ground level sits
 *   around y=520-600 depending on region; sky occupies roughly y<380.
 * - Gameplay node positions here MUST match src/systems/MapGraph.ts `nodes`.
 *   (Only coordinates are duplicated — the graph remains the source of truth
 *   for ids, labels, edges and reveal state.)
 * - Camera: bounds (0,0,WORLD_W,WORLD_H), follows Kiki's container with lerp
 *   + deadzone + lookahead offset (see CAMERA). UI (prompts, status pill,
 *   title plaque) is pinned with setScrollFactor(0).
 */

export const WORLD_W = 3360;
export const WORLD_H = 720;

export type RegionId = "forest" | "valley" | "summit";

export interface RegionDef {
  id: RegionId;
  /** world x-range */
  x0: number;
  x1: number;
  name: string;
  /** short art-direction brief for this region */
  mood: string;
}

/** West -> east travel order. */
export const REGIONS: RegionDef[] = [
  {
    id: "forest",
    x0: 0,
    x1: 1250,
    name: "Trailhead Forest",
    mood:
      "Cozy and sheltered. Warm morning light, dense varied pines, soft green-" +
      "tinted snow, dappled shadows. The start of the adventure.",
  },
  {
    id: "valley",
    x0: 1250,
    x1: 2350,
    name: "Frozen Valley",
    mood:
      "Dramatic and cold. Frozen lake, ice cliffs and rock formations, " +
      "stronger wind and blowing snow, blue-hour palette. Secrets hide here.",
  },
  {
    id: "summit",
    x0: 2350,
    x1: WORLD_W,
    name: "Summit Race Camp",
    mood:
      "Triumphant altitude. Steeper peaks, thinner air, crisp bright light, " +
      "prayer-flag lines, sled structures. The destination must feel earned.",
  },
];

/** Current gameplay nodes (mirrors MapGraph.ts coordinates). */
export const NODE_POSITIONS: Record<MapNodeId, { x: number; y: number }> = {
  start: { x: 260, y: 560 }, // Trailhead
  math1: { x: 820, y: 530 }, // Broken Bridge (forest ravine)
  fork: { x: 1330, y: 500 }, // Forest Fork (forest/valley threshold)
  safe: { x: 1830, y: 545 }, // Frozen Lake crossing
  challenge: { x: 1860, y: 300 }, // Ice Cave (north cliff face)
  goal: { x: 3080, y: 470 }, // Summit Race Camp
};

/**
 * Intended positions for McCartney's future progression nodes.
 * Visual scenery for these spots is built modularly (see SCENERY_SPOTS) so
 * the art already suggests the route before the logic lands.
 */
export const FUTURE_NODE_SPOTS: Record<string, { x: number; y: number; label: string }> = {
  fallenTree: { x: 2160, y: 570, label: "Fallen Tree" },
  snowCache: { x: 2350, y: 620, label: "Bone Cache" },
  forest: { x: 1050, y: 520, label: "Whisper Forest" },
  snowPass: { x: 2470, y: 470, label: "Snow Pass" },
  summitCamp: { x: 2720, y: 430, label: "Summit Gate" },
};

/** Visual-only scenery: NOT gameplay nodes, never interactive. */
export const SCENERY_SPOTS = {
  /** Secret igloo, tucked behind ice rocks in the valley. Reward TBD (not implemented). */
  igloo: { x: 2150, y: 250 },
  /** Optional discovery branch: frozen waterfall overlook with a bonus star shard. Dead-end, bonus only. */
  waterfallOverlook: { x: 2560, y: 220 },
  /** Natural ice arch the trail threads through (future Snow Pass node site). */
  snowPassArch: { x: 2470, y: 470 },
  /** Summit checkpoint flag (future Summit Camp encounter site). */
  summitFlag: { x: 2720, y: 430 },
} as const;

/** Camera feel. Tuned for a 9-year-old: smooth, never jerky, lookahead right.
 *  No deadzone: the camera always eases toward Kiki so travelling is felt.
 *  NOTE: Phaser SUBTRACTS followOffset from the target, so lookAhead is
 *  stored negative to place Kiki left-of-center (more path ahead visible). */
export const CAMERA = {
  followLerpX: 0.075,
  followLerpY: 0.075,
  /** Kiki rides left-of-center, revealing more of the path ahead. */
  lookAheadX: -170,
  lookAheadY: -10,
} as const;

/** Fog banks hide unrevealed regions until Kiki travels there. */
export const FOG_ZONES = {
  /** Blows away when the bridge is crossed. Hides the valley entrance. */
  valleyGate: { x: 1330, y: 390, w: 460, h: 540 },
  /** Blows away when lake/cave is reached. Hides the summit approach. */
  summitVeil: { x: 2620, y: 380, w: 620, h: 580 },
} as const;
