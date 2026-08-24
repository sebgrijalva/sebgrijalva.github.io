const GLYPHS={diamond:'◆',ring:'◎',cross:'✦',hex:'⬢',kite:'◈'};
export class Renderer{
  constructor(){this.board=document.querySelector('#board');this.overlay=document.querySelector('#overlay');}
  grid(n){this.board.innerHTML='';this.board.style.setProperty('--n',n);for(let r=0;r<n;r++)for(let c=0;c<n;c++){const b=document.createElement('button');b.type='button';b.className='cell';b.dataset.r=r;b.dataset.c=c;b.setAttribute('aria-label',`row ${r+1}, column ${c+1}`);this.board.appendChild(b);}return this.board;}
  cell(p){return this.board.querySelector(`.cell[data-r="${p.r}"][data-c="${p.c}"]`);}
  clear(){for(const c of this.board.querySelectorAll('.cell')){c.className='cell';c.textContent='';}this.overlay.innerHTML='';this.overlay.className='overlay pointer-silent';}
  pulse(p,text=''){const c=this.cell(p);if(!c)return;c.classList.add('pulse');c.textContent=text;}
  glyph(p,id){const c=this.cell(p);if(!c)return;c.classList.add('glyph');c.textContent=GLYPHS[id]||'◆';}
  overlayText(html,interactive=false){this.overlay.className='overlay '+(interactive?'interactive':'pointer-silent');this.overlay.innerHTML=html;}
}
