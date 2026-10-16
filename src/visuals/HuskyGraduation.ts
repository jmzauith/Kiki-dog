import { HUSKY_READING, HuskyGraduation } from '../systems/HuskyGraduation';
import { HUSKY_PROFILE } from '../systems/HuskyFacts';
import { modal, element, button } from './Collectibles';

export function showHuskyGraduation(quiz:HuskyGraduation):Promise<void>{
 return new Promise(resolve=>{
  const overlay=modal('Meet the Siberian Husky');
  const panel=element('section','breed-lesson');overlay.append(panel);
  const reading=()=>{
   panel.replaceChildren(element('span','collect-eyebrow','BOLT’S BREED BOOK · SIBERIAN HUSKY'),element('h1','','A snowy adventure. A new friend.'));
   for(const paragraph of HUSKY_READING)panel.append(element('p','',paragraph));
   panel.append(element('p','lesson-instruction','Read at your own pace. Answer three questions to earn your Golden Husky sticker. You can read this page again whenever you need it.'));
   const start=button(quiz.count?'Continue my quiz':'Start the three-question quiz',question);panel.append(start);start.focus();
  };
  const question=()=>{
   const q=quiz.question;if(!q){overlay.remove();resolve();return;}
   panel.replaceChildren(element('span','collect-eyebrow',`HUSKY QUIZ · QUESTION ${quiz.count+1} OF 3`),element('h1','',q.prompt));
   const feedback=element('p','quiz-feedback');feedback.setAttribute('role','status');
   const choices=element('div','breed-choices');
   q.choices.forEach((choice,index)=>{const answer=button(choice,()=>{
    if(quiz.answer(index)){
     choices.querySelectorAll('button').forEach(b=>b.disabled=true);
     feedback.textContent='That’s right! '+HUSKY_PROFILE.facts.find(f=>f.id===q.factId)!.text;
     const next=button(quiz.passed?'Open my golden sticker book':'Next question',()=>{if(quiz.passed){overlay.remove();resolve();}else question();});panel.append(next);next.focus();
    }else{feedback.textContent='Not quite. '+HUSKY_PROFILE.facts.find(f=>f.id===q.factId)!.text+' Try again — you can do it.';answer.disabled=true;}
   });choices.append(answer);});
   panel.append(choices,feedback,button('Read about Huskies again',reading));choices.querySelector('button')!.focus();
  };
  reading();
 });
}
