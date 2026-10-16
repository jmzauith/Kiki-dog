/** Reusable, presentation-only book sequence. Ownership stays in collection data. */
export function animateAlbum(book:HTMLElement,sticker:HTMLElement|null):()=>void {
 const cover=document.createElement('div');cover.className='album-cover';cover.innerHTML='<span>KIKI’S DOG ADVENTURE</span><strong>Friends<br>along the way</strong><small>THE DOG COLLECTION</small>';book.append(cover);
 book.classList.add('physical-album');sticker?.classList.add('sticker-arriving');
 const event=(name:string)=>book.dispatchEvent(new CustomEvent('kiki-feedback',{bubbles:true,detail:{name}}));
 event('page-turn');
 const timer=setTimeout(()=>{if(sticker)event('sticker-press');cover.remove();},3100);
 return ()=>{clearTimeout(timer);cover.remove();book.classList.remove('physical-album');sticker?.classList.remove('sticker-arriving');};
}
