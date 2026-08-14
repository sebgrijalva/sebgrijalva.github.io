const root = new URL('./', import.meta.url);
const pack = await fetch(new URL('game-v5.pack?v=5', root), { cache: 'no-store' });
if (!pack.ok) throw new Error(`ZERO IS YOU v5 pack failed: ${pack.status}`);
const b64 = (await pack.text()).trim();
const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
if (!('DecompressionStream' in globalThis)) throw new Error('This browser needs DecompressionStream support. Please update Chrome.');
const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
let source = await new Response(stream).text();
for (const file of ['levels.js','nil-levels.js','engine.js','facts.js']) source = source.replace(`from './${file}'`, `from '${new URL(file+'?v=5', root).href}'`);
source += '\n//# sourceURL=zero-is-you-v5.js';
const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
try { await import(url); }
finally { setTimeout(() => URL.revokeObjectURL(url), 10000); }
