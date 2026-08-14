const root = new URL('./', import.meta.url);
const pack = await fetch(new URL('game-v4.pack?v=4', root), { cache: 'no-store' });
if (!pack.ok) throw new Error(`ZERO IS YOU v4 pack failed: ${pack.status}`);
const b64 = (await pack.text()).trim();
const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
if (!('DecompressionStream' in globalThis)) throw new Error('This browser needs DecompressionStream support. Please update Chrome.');
const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
let source = await new Response(stream).text();
source = source
  .replace("from './levels.js'", `from '${new URL('levels.js?v=4', root).href}'`)
  .replace("from './engine.js'", `from '${new URL('engine.js?v=4', root).href}'`);
source += '\n//# sourceURL=zero-is-you-v4.js';
const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
try { await import(url); }
finally { setTimeout(() => URL.revokeObjectURL(url), 10000); }
