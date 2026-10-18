/** Small carved/painted game pieces share Snowy Peaks' ink, cream and brass palette.
 * Unicode identifiers are internal only; no platform emoji is rendered. */
const shapes:Record<string,string>={
 '🐾':'<ellipse cx="32" cy="42" rx="13" ry="10"/><ellipse cx="15" cy="25" rx="6" ry="8"/><ellipse cx="30" cy="18" rx="6" ry="8"/><ellipse cx="46" cy="24" rx="6" ry="8"/>',
 '🌲':'<path d="M30 4L10 29H20L6 46H26V59H36V46H56L43 29H53Z"/>',
 '🏔️':'<path d="M4 54L28 9L43 31L50 21L63 54Z"/><path d="M19 27L28 9L38 26L29 21Z" fill="#f5f3e7"/>',
 '⛺':'<path d="M4 53L32 10L60 53Z" fill="#b77b47"/><path d="M22 53L32 29L42 53Z" fill="#253e46"/>',
 '🦴':'<path d="M17 24C0 7 0 36 15 33L39 48C45 63 65 46 51 40C66 28 43 16 42 33L22 22C28 5 7 5 17 24Z" fill="#ecd6a2"/>',
 '❄':'<path d="M32 6V58M9 19L55 45M9 45L55 19M24 11L32 19L40 11M24 53L32 45L40 53" fill="none" stroke="#a8cfdb" stroke-width="5"/>',
 '🪵':'<path d="M10 13L53 39L46 54L4 29Z" fill="#8b5b36"/><ellipse cx="49" cy="46" rx="10" ry="12" fill="#c89b60"/><ellipse cx="49" cy="46" rx="5" ry="7" fill="none"/>',
 '🧤':'<path d="M19 55L11 32Q8 22 17 21L24 29V10Q34 2 36 13V27Q55 17 54 35L45 55Z" fill="#ac634a"/>',
 '🪢':'<path d="M21 50C1 32 13 9 31 14S55 49 35 49S6 13 40 10M35 49L53 58" fill="none" stroke="#d9ad68" stroke-width="8"/>',
 '🔔':'<path d="M12 46L18 33V23Q18 8 32 8Q46 8 46 23V33L52 46Z" fill="#d4a451"/><circle cx="32" cy="52" r="5"/>',
 '🧣':'<path d="M10 13H53V28H40L48 55H31L23 28H10Z" fill="#b95f47"/><path d="M32 37H43M34 45H46" stroke="#efd8a7"/>',
 '🥾':'<path d="M16 9H40V37L56 44V55H9V43L16 37Z" fill="#8c6240"/><path d="M21 18H35M21 26H35M21 34H35" stroke="#e1bf81"/>',
 '🛷':'<path d="M12 16H49L43 42H8Z" fill="#a36d3e"/><path d="M5 51H49Q62 51 59 40M20 21L15 46M42 21L37 46" fill="none" stroke="#e2c38a" stroke-width="5"/>',
 '🛶':'<path d="M35 5L21 42M21 36Q5 37 10 53Q22 65 30 48Z" fill="#c89855" stroke-width="5"/>',
 '💡':'<path d="M22 49V40C1 13 23 2 35 8S59 25 42 40V49Z" fill="#e2b45b"/><path d="M22 55H42" stroke-width="5"/>',
};
shapes['⭐']='<path d="M32 4L39 23L59 24L43 37L48 58L32 46L15 58L21 37L4 24L25 23Z" fill="#e0b95d"/>';
shapes['☀']='<path d="M18 17H46L50 52H14Z" fill="#e8b858"/><path d="M23 17V9Q32 0 41 9V17M10 55H54" fill="none" stroke-width="4"/><path d="M25 24V46M39 24V46" stroke="#fff4b8"/>';
shapes['☾']=shapes['☀'].replace('#e8b858','#506573').replace('#fff4b8','#8fa0a5');
for(const [token,colour] of [['◆','#6ca9c6'],['⬟','#a287c4'],['▲','#d4b06a'],['●','#c88f9f']])shapes[token]=`<path d="M24 6L42 12L54 39L32 58L10 39Z" fill="${colour}"/><path d="M24 6L20 35L32 58L40 34L42 12M10 39L20 35L40 34L54 39" fill="none" stroke="#e4eff0"/>`;
shapes['❄️']=shapes['❄'];shapes['👣']=shapes['🐾'];
const painted:Record<string,number>={'🐾':0,'👣':0,'🌲':1,'🏔️':2,'⛺':3,'❄':4,'❄️':4,'🦴':5,'🪵':6,'🧤':7,'🪢':8,'🔔':9,'🧣':10,'🥾':11,'🛷':12,'🛶':13,'💡':14,'☀':14,'☾':14,'◆':15,'⬟':15,'▲':15,'●':15};
const tokens=Object.keys(shapes).sort((a,b)=>b.length-a.length);
export function gameArt(target:HTMLElement,text:string):void {
 target.replaceChildren();
 while(text){const key=tokens.find(k=>text.startsWith(k));if(key){const span=document.createElement('span');span.className='game-piece-art';span.setAttribute('aria-hidden','true');if(key in painted){const i=painted[key];span.classList.add('painted-piece');span.style.backgroundPosition=`${(i%4)*100/3}% ${Math.floor(i/4)*100/3}%`;}else span.innerHTML=`<svg viewBox="0 0 64 64" fill="#b18448" stroke="#513d2b" stroke-width="2" stroke-linejoin="round">${shapes[key]}</svg>`;target.append(span);text=text.slice(key.length);}else{let n=1;while(n<text.length&&!tokens.some(k=>text.startsWith(k,n)))n++;target.append(document.createTextNode(text.slice(0,n)));text=text.slice(n);}}
}
