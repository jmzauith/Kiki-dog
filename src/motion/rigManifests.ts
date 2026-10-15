// GENERATED — do not hand-edit. Rig part manifests (multi-atlas).
// Coordinates: rig-root px, origin at ground point between paws.
import type { RigDef } from './motionTypes';

export const RIGS: Record<string, RigDef> = {
  'kiki-idle': {
    atlases: [
      { key: 'motion-kiki-idle-0', file: 'assets/motion/kiki/kiki-idle-0.svg', width: 256, height: 375 },
    ],
    order: ['legFR', 'legFL', 'torso', 'head', 'earFar', 'earNear', 'headClosed'],
    parts: {
      'legFR': { atlas: 0, frame: 'legFR', ax: 149, ay: 206, w: 39, h: 91, pivotX: 0.500, pivotY: 0.060, restX: 3.5, restY: -83.5 },
      'legFL': { atlas: 0, frame: 'legFL', ax: 100, ay: 206, w: 45, h: 97, pivotX: 0.500, pivotY: 0.060, restX: 28.5, restY: -83.2 },
      'torso': { atlas: 0, frame: 'torso', ax: 2, ay: 2, w: 151, h: 200, pivotX: 0.500, pivotY: 1.000, restX: 0.5, restY: 8.0 },
      'head': { atlas: 0, frame: 'head', ax: 157, ay: 2, w: 94, h: 108, pivotX: 0.500, pivotY: 0.820, restX: 29.0, restY: -103.4 },
      'earFar': { atlas: 0, frame: 'earFar', ax: 2, ay: 318, w: 51, h: 55, pivotX: 0.500, pivotY: 0.850, restX: 7.5, restY: -141.2 },
      'earNear': { atlas: 0, frame: 'earNear', ax: 192, ay: 206, w: 54, h: 64, pivotX: 0.500, pivotY: 0.850, restX: 43.0, restY: -137.6 },
      'headClosed': { atlas: 0, frame: 'headClosed', ax: 2, ay: 206, w: 94, h: 108, pivotX: 0.500, pivotY: 0.820, restX: 29.0, restY: -103.4 },
    },
  },
  'kiki-trot': {
    atlases: [
      { key: 'motion-kiki-trot-0', file: 'assets/motion/kiki/kiki-trot-0.svg', width: 256, height: 235 },
    ],
    order: ['legFR', 'legBR', 'legFL', 'legBL', 'torso', 'earFar', 'earNear'],
    parts: {
      'legFR': { atlas: 0, frame: 'legFR', ax: 142, ay: 2, w: 39, h: 77, pivotX: 0.500, pivotY: 0.060, restX: 6.5, restY: -72.4 },
      'legBR': { atlas: 0, frame: 'legBR', ax: 58, ay: 164, w: 34, h: 65, pivotX: 0.500, pivotY: 0.060, restX: -20.0, restY: -73.1 },
      'legFL': { atlas: 0, frame: 'legFL', ax: 185, ay: 2, w: 57, h: 75, pivotX: 0.450, pivotY: 0.060, restX: 32.7, restY: -76.5 },
      'legBL': { atlas: 0, frame: 'legBL', ax: 2, ay: 164, w: 52, h: 69, pivotX: 0.550, pivotY: 0.060, restX: -37.4, restY: -76.9 },
      'torso': { atlas: 0, frame: 'torso', ax: 2, ay: 2, w: 136, h: 158, pivotX: 0.500, pivotY: 1.000, restX: 1.0, restY: 0.0 },
      'earFar': { atlas: 0, frame: 'earFar', ax: 137, ay: 164, w: 45, h: 31, pivotX: 0.500, pivotY: 0.850, restX: 13.5, restY: -127.7 },
      'earNear': { atlas: 0, frame: 'earNear', ax: 96, ay: 164, w: 37, h: 40, pivotX: 0.500, pivotY: 0.850, restX: 40.5, restY: -124.0 },
    },
  },
  'kiki-run': {
    atlases: [
      { key: 'motion-kiki-run-0', file: 'assets/motion/kiki/kiki-run-0.svg', width: 256, height: 252 },
    ],
    order: ['legFR', 'legBR', 'legFL', 'legBL', 'torso', 'earFar', 'earNear'],
    parts: {
      'legFR': { atlas: 0, frame: 'legFR', ax: 197, ay: 2, w: 36, h: 73, pivotX: 0.500, pivotY: 0.060, restX: 27.0, restY: -64.6 },
      'legBR': { atlas: 0, frame: 'legBR', ax: 2, ay: 132, w: 35, h: 69, pivotX: 0.500, pivotY: 0.060, restX: -20.5, restY: -64.9 },
      'legFL': { atlas: 0, frame: 'legFL', ax: 41, ay: 132, w: 59, h: 65, pivotX: 0.400, pivotY: 0.060, restX: 55.6, restY: -65.1 },
      'legBL': { atlas: 0, frame: 'legBL', ax: 104, ay: 132, w: 61, h: 63, pivotX: 0.600, pivotY: 0.060, restX: -43.4, restY: -65.2 },
      'torso': { atlas: 0, frame: 'torso', ax: 2, ay: 2, w: 191, h: 126, pivotX: 0.500, pivotY: 1.000, restX: 1.5, restY: 6.0 },
      'earFar': { atlas: 0, frame: 'earFar', ax: 2, ay: 205, w: 48, h: 45, pivotX: 0.500, pivotY: 0.850, restX: 27.0, restY: -81.8 },
      'earNear': { atlas: 0, frame: 'earNear', ax: 169, ay: 132, w: 51, h: 49, pivotX: 0.500, pivotY: 0.850, restX: 53.5, restY: -73.3 },
    },
  },
  'husky-idle': {
    atlases: [
      { key: 'motion-husky-idle-0', file: 'assets/motion/husky/husky-idle-0.svg', width: 256, height: 228 },
      { key: 'motion-husky-idle-1', file: 'assets/motion/husky/husky-idle-1.svg', width: 256, height: 247 },
    ],
    order: ['tail', 'legFR', 'legBR', 'legFL', 'legBL', 'torso', 'head', 'earFar', 'earNear', 'headClosed'],
    parts: {
      'tail': { atlas: 1, frame: 'tail', ax: 120, ay: 107, w: 56, h: 71, pivotX: 0.850, pivotY: 0.550, restX: -14.4, restY: -126.9 },
      'legFR': { atlas: 1, frame: 'legFR', ax: 2, ay: 107, w: 35, h: 87, pivotX: 0.500, pivotY: 0.060, restX: 4.5, restY: -79.8 },
      'legBR': { atlas: 1, frame: 'legBR', ax: 41, ay: 107, w: 31, h: 83, pivotX: 0.500, pivotY: 0.060, restX: -7.5, restY: -80.0 },
      'legFL': { atlas: 1, frame: 'legFL', ax: 194, ay: 2, w: 37, h: 93, pivotX: 0.500, pivotY: 0.060, restX: 21.5, restY: -79.4 },
      'legBL': { atlas: 1, frame: 'legBL', ax: 76, ay: 107, w: 40, h: 74, pivotX: 0.500, pivotY: 0.060, restX: -18.0, restY: -80.6 },
      'torso': { atlas: 0, frame: 'torso', ax: 2, ay: 2, w: 139, h: 224, pivotX: 0.500, pivotY: 1.000, restX: 7.5, restY: 8.0 },
      'head': { atlas: 1, frame: 'head', ax: 2, ay: 2, w: 92, h: 101, pivotX: 0.500, pivotY: 0.820, restX: 31.0, restY: -133.2 },
      'earFar': { atlas: 1, frame: 'earFar', ax: 2, ay: 198, w: 35, h: 47, pivotX: 0.500, pivotY: 0.850, restX: 18.5, restY: -176.1 },
      'earNear': { atlas: 1, frame: 'earNear', ax: 180, ay: 107, w: 47, h: 50, pivotX: 0.500, pivotY: 0.850, restX: 40.5, restY: -173.5 },
      'headClosed': { atlas: 1, frame: 'headClosed', ax: 98, ay: 2, w: 92, h: 101, pivotX: 0.500, pivotY: 0.820, restX: 31.0, restY: -133.2 },
    },
  },
  'husky-race': {
    atlases: [
      { key: 'motion-husky-race-0', file: 'assets/motion/husky/husky-race-0.svg', width: 256, height: 228 },
      { key: 'motion-husky-race-1', file: 'assets/motion/husky/husky-race-1.svg', width: 256, height: 174 },
    ],
    order: ['tail', 'legFR', 'legBR', 'legFL', 'legBL', 'torso', 'earFar', 'earNear'],
    parts: {
      'tail': { atlas: 1, frame: 'tail', ax: 82, ay: 2, w: 66, h: 79, pivotX: 0.850, pivotY: 0.500, restX: -38.9, restY: -107.5 },
      'legFR': { atlas: 1, frame: 'legFR', ax: 43, ay: 2, w: 35, h: 88, pivotX: 0.500, pivotY: 0.060, restX: 27.5, restY: -77.7 },
      'legBR': { atlas: 1, frame: 'legBR', ax: 2, ay: 2, w: 37, h: 93, pivotX: 0.500, pivotY: 0.060, restX: -23.5, restY: -77.4 },
      'legFL': { atlas: 1, frame: 'legFL', ax: 152, ay: 2, w: 63, h: 78, pivotX: 0.400, pivotY: 0.060, restX: 55.2, restY: -78.3 },
      'legBL': { atlas: 1, frame: 'legBL', ax: 2, ay: 99, w: 61, h: 73, pivotX: 0.600, pivotY: 0.060, restX: -45.4, restY: -78.6 },
      'torso': { atlas: 0, frame: 'torso', ax: 2, ay: 2, w: 194, h: 224, pivotX: 0.500, pivotY: 1.000, restX: 2.0, restY: 32.0 },
      'earFar': { atlas: 1, frame: 'earFar', ax: 67, ay: 99, w: 44, h: 53, pivotX: 0.500, pivotY: 0.850, restX: 23.0, restY: -129.9 },
      'earNear': { atlas: 1, frame: 'earNear', ax: 115, ay: 99, w: 45, h: 53, pivotX: 0.500, pivotY: 0.850, restX: 48.5, restY: -126.0 },
    },
  },
};

