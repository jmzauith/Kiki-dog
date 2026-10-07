export type RouteKind = "safe" | "challenge";

export type MapNodeId = "start" | "math1" | "fork" | "safe" | "challenge" | "goal";

export type MapNode = {
  id: MapNodeId;
  x: number;
  y: number;
  label: string;
  revealed: boolean;
};

export type MapEdge = {
  from: MapNodeId;
  to: MapNodeId;
  kind: RouteKind;
};

export const nodes: Record<MapNodeId, MapNode> = {
  start: { id: "start", x: 170, y: 560, label: "Trailhead", revealed: true },
  math1: { id: "math1", x: 390, y: 505, label: "Broken Bridge", revealed: true },
  fork: { id: "fork", x: 610, y: 420, label: "Fork", revealed: false },
  safe: { id: "safe", x: 850, y: 500, label: "Snow Trail", revealed: false },
  challenge: { id: "challenge", x: 850, y: 300, label: "Ice Shortcut", revealed: false },
  goal: { id: "goal", x: 1080, y: 390, label: "Lookout", revealed: false },
};

export const edges: MapEdge[] = [
  { from: "start", to: "math1", kind: "safe" },
  { from: "math1", to: "fork", kind: "safe" },
  { from: "fork", to: "safe", kind: "safe" },
  { from: "fork", to: "challenge", kind: "challenge" },
  { from: "safe", to: "goal", kind: "safe" },
  { from: "challenge", to: "goal", kind: "challenge" },
];

/**
 * Alias for the initial map state. Treat as a read-only template: scenes must
 * call createMapState() to get their own copy and must NEVER mutate this
 * export. Mutating it leaks reveal state across scene restarts (the map would
 * stay revealed when HuskyScene is re-entered).
 */
export const initialNodes: Record<MapNodeId, MapNode> = nodes;

/**
 * Create a fresh, independent copy of the map state for one scene instance.
 * Each scene owns its copy, so restarting a scene can never inherit stale
 * reveal state from a previous run.
 */
export function createMapState(): Record<MapNodeId, MapNode> {
  return Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [id, { ...node }]),
  ) as Record<MapNodeId, MapNode>;
}

/**
 * Pure helper: which edges can the player take right now from `currentNode`?
 * Only edges whose destination node has been revealed are offered.
 */
export function getForwardChoices(
  currentNode: MapNodeId,
  state: Record<MapNodeId, MapNode>,
): MapEdge[] {
  return edges.filter((e) => e.from === currentNode && state[e.to].revealed);
}