(async()=>{
  const root=new URL('./',import.meta.url);
  const r=await fetch(new URL('game-v6.pack?v=7.0',root),{cache:'no-store'});
  if(!r.ok) throw new Error('game-v6.pack '+r.status);
  const b64=(await r.text()).trim();
  const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  if(!('DecompressionStream' in globalThis)) throw new Error('This browser needs DecompressionStream support. Please update Chrome.');
  const ds=new DecompressionStream('gzip');
  let js=await new Response(new Blob([bin]).stream().pipeThrough(ds)).text();
  const imports={'levels.js':'challenge-levels.js','nil-levels.js':'nil-levels.js','engine.js':'engine.js','facts.js':'facts.js'};
  for(const [from,to] of Object.entries(imports)){const absolute=new URL(to+'?v=7.0',root).href;js=js.replaceAll(`from './${from}'`,`from '${absolute}'`);js=js.replaceAll(`from "./${from}"`,`from "${absolute}"`);}
  js+='\n//# sourceURL=zero-is-you-v7.js';
  const url=URL.createObjectURL(new Blob([js],{type:'text/javascript'}));
  try{await import(url)}finally{setTimeout(()=>URL.revokeObjectURL(url),10000)}
})().catch(e=>{console.error(e);document.body.insertAdjacentHTML('beforeend','<pre style="color:#ffcd75;padding:8px">ZERO loader failed: '+String(e)+'</pre>')});
