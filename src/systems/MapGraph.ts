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