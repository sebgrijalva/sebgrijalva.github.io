export const TAU = Math.PI * 2;

export class Vec2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  clone() { return new Vec2(this.x, this.y); }
  set(x, y) { this.x = x; this.y = y; return this; }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  mul(s) { this.x *= s; this.y *= s; return this; }
  length() { return Math.hypot(this.x, this.y); }
  normalize() { const n = this.length() || 1; this.x /= n; this.y /= n; return this; }
  static sub(a, b) { return new Vec2(a.x - b.x, a.y - b.y); }
  static dot(a, b) { return a.x * b.x + a.y * b.y; }
}

export class Store {
  constructor(namespace = "family-adventure") { this.namespace = namespace; }
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(`${this.namespace}:${key}`);
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  }
  set(key, value) {
    try { localStorage.setItem(`${this.namespace}:${key}`, JSON.stringify(value)); } catch { }
  }
}

export class TinyAudio {
  constructor() { this.ctx = null; }
  unlock() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
  }
  ping(freq = 360, duration = .07, gain = .025, type = "sine") {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }
}

export class PointerHub {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = new Map();
    this.handlers = { down: [], move: [], up: [] };
    canvas.addEventListener("pointerdown", e => this.onDown(e));
    canvas.addEventListener("pointermove", e => this.onMove(e));
    canvas.addEventListener("pointerup", e => this.onUp(e));
    canvas.addEventListener("pointercancel", e => this.onUp(e));
  }
  on(type, handler) { this.handlers[type].push(handler); }
  point(e) {
    const r = this.canvas.getBoundingClientRect();
    return new Vec2(
      (e.clientX - r.left) * this.canvas.width / r.width,
      (e.clientY - r.top) * this.canvas.height / r.height
    );
  }
  emit(type, payload) { for (const handler of this.handlers[type]) handler(payload); }
  onDown(e) {
    this.canvas.setPointerCapture?.(e.pointerId);
    const p = this.point(e);
    this.active.set(e.pointerId, p);
    this.emit("down", { id: e.pointerId, point: p, event: e });
  }
  onMove(e) {
    if (!this.active.has(e.pointerId)) return;
    const p = this.point(e);
    this.active.set(e.pointerId, p);
    this.emit("move", { id: e.pointerId, point: p, event: e });
  }
  onUp(e) {
    const p = this.point(e);
    this.active.delete(e.pointerId);
    this.emit("up", { id: e.pointerId, point: p, event: e });
  }
}

export class ToyEngine {
  constructor(canvas, scene) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.scene = scene;
    this.pointer = new PointerHub(canvas);
    this.audio = new TinyAudio();
    this.store = new Store();
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.running = false;
    this.lastTime = 0;
    window.addEventListener("resize", () => this.resize(), { passive: true });
    window.addEventListener("orientationchange", () => setTimeout(() => this.resize(), 100), { passive: true });
    this.resize();
    scene.mount?.(this);
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.round(rect.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * this.dpr));
    this.scene.resize?.(this.canvas.width, this.canvas.height, this.dpr);
  }
  start() {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(t => this.frame(t));
  }
  frame(t) {
    if (!this.running) return;
    const dt = this.lastTime ? Math.min((t - this.lastTime) / 1000, 1 / 30) : 0;
    this.lastTime = t;
    this.scene.update?.(dt);
    this.scene.render?.(this.ctx);
    requestAnimationFrame(next => this.frame(next));
  }
}
