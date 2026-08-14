(async()=>{
  const r=await fetch('./game-v6.pack?v=6.0',{cache:'no-store'});
  if(!r.ok) throw new Error('game-v6.pack '+r.status);
  const b64=(await r.text()).trim();
  const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  const ds=new DecompressionStream('gzip');
  const js=await new Response(new Blob([bin]).stream().pipeThrough(ds)).text();
  const url=URL.createObjectURL(new Blob([js],{type:'text/javascript'}));
  try{await import(url)}finally{URL.revokeObjectURL(url)}
})().catch(e=>{console.error(e);document.body.insertAdjacentHTML('beforeend','<pre style="color:#ffcd75;padding:8px">ZERO loader failed: '+String(e)+'</pre>')});
