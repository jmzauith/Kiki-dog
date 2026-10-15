/** Sled-root paths fitted to the snow in each 1280 × 720 race painting.
 * Race scores stay in RaceProgress; these coordinates only stage the camera shot. */
export const RACE_TERRAIN = [
  [{x:270,y:560,scale:1},{x:560,y:465,scale:0.85},{x:920,y:325,scale:0.62}],
  [{x:220,y:580,scale:1},{x:650,y:470,scale:0.8},{x:300,y:340,scale:0.55}],
  [{x:350,y:595,scale:1},{x:570,y:510,scale:0.82},{x:850,y:420,scale:0.62}],
  [{x:480,y:550,scale:0.95},{x:620,y:440,scale:0.75},{x:700,y:385,scale:0.6}],
] as const;
