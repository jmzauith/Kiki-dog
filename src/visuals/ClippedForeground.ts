import Phaser from "phaser";
/** Bake a world-aligned foreground once. Phaser 4 WebGL does not support the
 * old GeometryMask API; alpha textures work in both Canvas and WebGL. */
export function clippedForeground(scene:Phaser.Scene,key:string,sourceKey:string,frameName:string|undefined,x:number,y:number,w:number,h:number,points:number[][]):Phaser.GameObjects.Image {
 if(!scene.textures.exists(key)) {
  const texture=scene.textures.createCanvas(key,Math.ceil(w),Math.ceil(h));
  if(!texture)throw new Error("Could not create foreground: "+key);
  const context=texture.getContext();
  const source=scene.textures.get(sourceKey), frame=source.get(frameName);
  context.beginPath();points.forEach(([px,py],i)=>i?context.lineTo(px-x,py-y):context.moveTo(px-x,py-y));context.closePath();context.clip();
  context.drawImage(source.getSourceImage() as HTMLImageElement,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,w,h);
  texture.refresh();
 }
 return scene.add.image(x,y,key).setOrigin(0).setDepth(16);
}
