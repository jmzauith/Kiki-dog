import Phaser from "phaser";
import { clippedForeground } from "./ClippedForeground";
import { createSnowyEffects } from "./textures";
import { WORLD_W } from "../worlds/husky/HuskyWorldLayout";

/** Single painterly environment renderer. Procedural mountains, trees, lake
 * sheets and terrain geometry are retired. FX generation is white/alpha only.
 * The camera may move the distant painting; the ground and actors share 1x.
 */
export class SnowyWorld {
  constructor(private scene: Phaser.Scene) {}
  build(): void {
    createSnowyEffects(this.scene);
    if(!this.scene.textures.exists("snowy-panorama")) throw new Error("Missing continuous Snowy Peaks panorama");
    // One full-resolution painting: no repeated snow tile or independently sliding ground.
    this.scene.add.image(0,-400,"snowy-panorama").setOrigin(0)
      .setDisplaySize(WORLD_W,1120).setDepth(8).setScrollFactor(1);
    // Foreground snow uses the same painting at exactly the same transform.
    // Only the near snow edge occludes actors: no independently placed backdrop fragments.
    clippedForeground(this.scene,"world-near-snow","snowy-panorama",undefined,0,-400,WORLD_W,1120,
      [[0,635],[120,615],[245,650],[400,638],[600,670],[1100,650],[1650,675],[2150,648],[2680,662],[3050,625],[3360,590],[3360,720],[0,720]]);
    this.scene.add.particles(0,-30,"snow-dot",{
      x:{min:-100,max:WORLD_W+100},y:-30,lifespan:{min:5200,max:9000},
      speedY:{min:25,max:55},speedX:{min:-15,max:15},scale:{min:.15,max:.45},
      alpha:{min:.15,max:.5},quantity:1,frequency:160,
    }).setDepth(17);
  }
}
