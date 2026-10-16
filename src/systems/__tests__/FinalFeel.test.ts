import { describe,it,expect } from 'vitest';
import { BridgeSlots } from '../BridgeSlots';
import { TrailGuidanceSystem } from '../TrailGuidanceSystem';
import { tutorialComplete,completeTutorial } from '../TutorialProgress';
import { memoryStore } from '../BreedRewards';
describe('physical bridge ownership',()=>{
 it('rejects mismatched, duplicate and missing slots',()=>{const s=new BridgeSlots([76,54,36]);expect(s.place(0,1)).toBe(false);expect(s.place(0,0)).toBe(true);expect(s.place(0,0)).toBe(false);expect(s.place(3,3)).toBe(false);});
 it('uses tight rotated drop bounds instead of large distance circles',()=>{const s=new BridgeSlots([76,54,36]);expect(s.near(0,0,0)).toBe(true);expect(s.near(0,60,0)).toBe(false);expect(s.near(2,0,35)).toBe(false);});
});
it('guidance waits, fades and returns without permanent arrows',()=>{const s=new TrailGuidanceSystem();expect(s.advance(0)).toBe(0);let a=0;for(let i=0;i<14;i++)a=s.advance(250);expect(a).toBeCloseTo(.7);for(let i=0;i<20;i++)a=s.advance(250);expect(a).toBe(0);for(let i=0;i<20;i++)a=s.advance(250);expect(a).toBeCloseTo(.7);});
it('replay guidance waits longer',()=>{const s=new TrailGuidanceSystem(true);for(let i=0;i<20;i++)expect(s.advance(250)).toBe(0);});
it('tutorial completion stays in the supplied profile namespace',()=>{const a=memoryStore(),b=memoryStore();completeTutorial(a);expect(tutorialComplete(a)).toBe(true);expect(tutorialComplete(b)).toBe(false);});

import { pointerDrag } from '../../visuals/PointerDrag';
it('pointer drop rejects outside bounds and accepts only its owning pointer',()=>{
 const piece:any={style:{transform:'rotate(8deg)'},classList:{add(){},remove(){}},setPointerCapture(){},addEventListener(){}};
 const target:any={getBoundingClientRect:()=>({left:100,right:150,top:100,bottom:150})};
 let drops=0;pointerDrag(piece,()=>true,()=>[target],()=>drops++);
 piece.onpointerdown({pointerId:1,clientX:0,clientY:0});
 piece.onpointermove({pointerId:2,clientX:120,clientY:120});
 piece.onpointerup({pointerId:2,clientX:120,clientY:120});expect(drops).toBe(0);
 piece.onpointermove({pointerId:1,clientX:70,clientY:70});piece.onpointerup({pointerId:1,clientX:70,clientY:70});expect(drops).toBe(0);expect(piece.style.transform).toBe('rotate(8deg)');
 piece.onpointerdown({pointerId:3,clientX:0,clientY:0});piece.onpointermove({pointerId:3,clientX:120,clientY:120});piece.onpointerup({pointerId:3,clientX:120,clientY:120});expect(drops).toBe(1);
});
it('cancelled pointer drag preserves the piece and never drops',()=>{
 const piece:any={style:{transform:''},classList:{add(){},remove(){}},setPointerCapture(){},addEventListener(){}};
 let drops=0;pointerDrag(piece,()=>true,()=>[],()=>drops++);
 piece.onpointerdown({pointerId:1,clientX:0,clientY:0});piece.onpointermove({pointerId:1,clientX:30,clientY:30});piece.onpointercancel();expect(piece.style.transform).toBe('');expect(drops).toBe(0);
});
