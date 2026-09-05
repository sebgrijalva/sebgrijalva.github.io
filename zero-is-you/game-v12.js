import { WORLDS, LEVELS, LEVEL_BY_ID } from "./levels-v11-runtime.js";
import { NIL_LEVELS, NIL_LEVEL_BY_ID } from "./nil-levels.js";
import { createState, stepState, validateNope } from "./engine-v11.js";
import { clueFeedback } from "./feedback.js";
import { displayFactKey } from "./facts.js";
import { createMusicV10 } from "./music-v10.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d", { alpha: false });
ctx.imageSmoothingEnabled = false;
const $ = (s) => document.querySelector(s);
const controls = $("#controls"),
  modal = $("#modal");
const TILE = 32,
  BOARD_W = 12 * TILE,
  BOARD_H = 8 * TILE;
const PORTRAIT = { w: 384, h: 448, bx: 0, by: 64, panelY: 320 };
const LAND = { w: 768, h: 320, bx: 0, by: 64, panelY: 320 };
const P = {
  bg: "#111827",
  deep: "#202943",
  ink: "#090b12",
  black: "#05060a",
  white: "#f5f1e8",
  gray: "#a9b7cc",
  dusk: "#566c86",
  sand: "#ffcd75",
  gold: "#f7b849",
  mint: "#38b764",
  lime: "#71c837",
  ice: "#41a6f6",
  cyan: "#73eff7",
  red: "#b13e53",
  rust: "#ef7d57",
  violet: "#a56de2",
  paper: "#fff0c2",
  soil: "#594d35",
  grass: "#486b3d",
  grass2: "#567744",
  water: "#245a7a",
  stone: "#414c61",
  navy: "#29334b",
};
const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  0: ["01110", "10011", "10101", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  6: ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
  ":": ["00000", "00110", "00110", "00000", "00110", "00110", "00000"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "<": ["00010", "00100", "01000", "10000", "01000", "00100", "00010"],
  ">": ["01000", "00100", "00010", "00001", "00010", "00100", "01000"],
  "#": ["01010", "11111", "01010", "01010", "11111", "01010", "00000"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};
function glyph(ch) {
  return GLYPHS[ch] || GLYPHS["?"];
}
function textWidth(t, s = 2, spacing = 1) {
  return [...String(t)].reduce((n) => n + 5 * s + spacing * s, 0) - spacing * s;
}
function ptext(t, px, py, col = P.white, s = 2, align = "left", spacing = 1) {
  t = String(t).toUpperCase();
  let w = textWidth(t, s, spacing);
  if (align === "center") px -= Math.floor(w / 2);
  if (align === "right") px -= w;
  ctx.fillStyle = col;
  for (const ch of t) {
    const g = glyph(ch);
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 5; c++)
        if (g[r][c] === "1") ctx.fillRect(px + c * s, py + r * s, s, s);
    px += (5 + spacing) * s;
  }
}
function fitPtext(
  t,
  x,
  y,
  maxW,
  col = P.white,
  maxS = 3,
  minS = 1,
  align = "center",
) {
  let s = maxS;
  while (s > minS && textWidth(String(t).toUpperCase(), s, 1) > maxW) s--;
  ptext(t, x, y, col, s, align, s === 1 ? 0 : 1);
}
function rect(x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function outline(x, y, w, h, c, t = 2) {
  ctx.strokeStyle = c;
  ctx.lineWidth = t;
  ctx.strokeRect(x + t / 2, y + t / 2, w - t, h - t);
}
function hash(s) {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
function layout() {
  return canvas.width === PORTRAIT.w ? PORTRAIT : LAND;
}
function cellXY(e) {
  const L = layout();
  return [L.bx + e.x * TILE, L.by + e.y * TILE];
}
const NUMERAL = {
  ZERO: "0",
  ONE: "1",
  TWO: "2",
  THREE: "3",
  FOUR: "4",
  FIVE: "5",
  SIX: "6",
  SEVEN: "7",
  EIGHT: "8",
  NINE: "9",
  TEN: "10",
  ELEVEN: "11",
  TWELVE: "12",
  THIRTEEN: "13",
  FOURTEEN: "14",
  FIFTEEN: "15",
  SIXTEEN: "16",
  SEVENTEEN: "17",
  EIGHTEEN: "18",
  NINETEEN: "19",
  TWENTY: "20",
  TWENTYONE: "21",
  TWENTYTWO: "22",
  TWENTYTHREE: "23",
  TWENTYFOUR: "24",
  TWENTYFIVE: "25",
  TWENTYSIX: "26",
  TWENTYSEVEN: "27",
  TWENTYEIGHT: "28",
  TWENTYNINE: "29",
  THIRTY: "30",
  FORTY: "40",
  FIFTY: "50",
};
const SYMBOL = {
  PLUS: "+",
  MINUS: "-",
  TIMES: "X",
  SAME: "=",
  MOD: "MOD",
  "DIVIDED-BY": "/",
};
function wordGlyph(t) {
  return (
    NUMERAL[t] ||
    SYMBOL[t] ||
    t
      .replace("TWOQUARTERS", "2/4")
      .replace("QUARTER", "1/4")
      .replace("HALF", "1/2")
  );
}
function wordColor(t) {
  if (NUMERAL[t] || ["HALF", "QUARTER", "TWOQUARTERS"].includes(t))
    return P.ice;
  if (["PLUS", "MINUS", "TIMES", "MOD", "DIVIDED-BY", "SAME"].includes(t))
    return P.gold;
  if (["IS", "HAS"].includes(t)) return P.red;
  if (["YOU", "WIN", "PUSH", "STOP", "EVEN", "ODD", "PRIME"].includes(t))
    return P.mint;
  return P.violet;
}
function drawWord(e) {
  const [px, py] = cellXY(e),
    col = wordColor(e.text),
    g = wordGlyph(e.text),
    seed = hash(e.id) % 2;
  rect(px + 2, py + 4 + seed, 28, 27, "#03040a");
  rect(px + 3, py + 2 + seed, 26, 27, col);
  rect(px + 5, py + 4 + seed, 22, 23, P.deep);
  rect(px + 5, py + 4 + seed, 22, 2, "#ffffff30");
  rect(px + 5, py + 25 + seed, 22, 2, "#00000070");
  rect(px + 3, py + 2 + seed, 4, 4, P.white);
  rect(px + 25, py + 2 + seed, 4, 4, P.white);
  rect(px + 3, py + 25 + seed, 4, 4, "#00000088");
  rect(px + 25, py + 25 + seed, 4, 4, "#00000088");
  const tw = textWidth(g, 2, 0),
    ss = tw <= 22 ? 2 : 1;
  ptext(g, px + 16, py + (ss === 2 ? 9 : 12) + seed, P.white, ss, "center", 0);
}
function drawZero(px, py) {
  rect(px + 8, py + 3, 16, 2, P.gold);
  rect(px + 5, py + 5, 22, 21, P.black);
  rect(px + 7, py + 4, 18, 23, P.gold);
  rect(px + 9, py + 6, 14, 19, "#f8c45a");
  rect(px + 11, py + 9, 10, 12, P.deep);
  rect(px + 8, py + 10, 4, 4, P.white);
  rect(px + 20, py + 10, 4, 4, P.white);
  rect(px + 10, py + 11, 2, 2, P.black);
  rect(px + 20, py + 11, 2, 2, P.black);
  rect(px + 12, py + 18, 8, 2, P.rust);
  rect(px + 5, py + 11, 2, 8, P.gold);
  rect(px + 25, py + 11, 2, 8, P.gold);
  rect(px + 8, py + 27, 6, 3, P.red);
  rect(px + 18, py + 27, 6, 3, P.red);
  rect(px + 9, py + 7, 5, 1, "#ffe3a1");
  rect(px + 14, py + 5, 8, 1, "#ffe3a1");
}
function drawFlag(px, py) {
  rect(px + 8, py + 4, 4, 25, P.black);
  rect(px + 10, py + 4, 2, 25, P.paper);
  rect(px + 12, py + 6, 15, 11, P.black);
  rect(px + 13, py + 7, 13, 9, P.gold);
  rect(px + 13, py + 7, 10, 2, "#ffe4a0");
  rect(px + 22, py + 15, 4, 3, P.rust);
  rect(px + 5, py + 28, 14, 2, P.sand);
  rect(px + 7, py + 26, 8, 2, P.sand);
}
function drawCrab(px, py) {
  rect(px + 6, py + 12, 20, 13, P.black);
  rect(px + 8, py + 11, 16, 13, P.rust);
  rect(px + 4, py + 14, 5, 5, P.red);
  rect(px + 23, py + 14, 5, 5, P.red);
  rect(px + 3, py + 9, 5, 4, P.rust);
  rect(px + 24, py + 9, 5, 4, P.rust);
  rect(px + 10, py + 8, 4, 5, P.paper);
  rect(px + 18, py + 8, 4, 5, P.paper);
  rect(px + 12, py + 9, 2, 2, P.black);
  rect(px + 18, py + 9, 2, 2, P.black);
  rect(px + 10, py + 16, 3, 2, P.white);
  rect(px + 19, py + 16, 3, 2, P.white);
  rect(px + 7, py + 24, 3, 4, P.red);
  rect(px + 12, py + 24, 3, 4, P.red);
  rect(px + 18, py + 24, 3, 4, P.red);
  rect(px + 23, py + 24, 3, 4, P.red);
}
function drawClump(px, py, v) {
  rect(px + 5, py + 5, 22, 22, P.black);
  rect(px + 6, py + 4, 20, 22, P.ice);
  rect(px + 8, py + 6, 16, 17, "#77c9ff");
  rect(px + 9, py + 7, 14, 2, "#bfe8ff");
  const dots = [
    [12, 11],
    [20, 11],
    [12, 18],
    [20, 18],
    [16, 14],
    [16, 21],
  ];
  ctx.fillStyle = P.deep;
  for (const [dx, dy] of dots.slice(0, Math.min(Number(v) || 0, 6)))
    ctx.fillRect(px + dx, py + dy, 3, 3);
  ptext(String(v ?? ""), px + 16, py + 25, P.white, 1, "center", 0);
}
function drawDoor(px, py, target) {
  rect(px + 4, py + 2, 24, 29, P.black);
  rect(px + 6, py + 4, 20, 27, P.rust);
  rect(px + 8, py + 6, 16, 3, P.sand);
  rect(px + 8, py + 9, 4, 19, P.sand);
  rect(px + 20, py + 9, 4, 19, P.sand);
  rect(px + 12, py + 10, 8, 18, P.deep);
  rect(px + 20, py + 18, 2, 2, P.paper);
  if (target != null) ptext(target, px + 16, py + 1, P.white, 1, "center", 0);
}
function drawWall(px, py) {
  rect(px, py, 32, 32, P.black);
  rect(px + 2, py + 2, 28, 28, P.stone);
  for (let y = 5; y < 29; y += 8) {
    rect(px + 2, py + y, 28, 2, P.navy);
    for (let xx = y % 16 ? 10 : 2; xx < 30; xx += 16)
      rect(px + xx, py + y, 2, 8, P.navy);
  }
  rect(px + 3, py + 3, 26, 2, "#65738a");
  rect(px + 2, py + 28, 28, 2, "#202838");
}
function drawLamp(px, py, on) {
  rect(px + 10, py + 4, 12, 25, P.black);
  rect(px + 11, py + 6, 10, 12, on ? P.gold : P.dusk);
  rect(px + 13, py + 8, 6, 7, on ? P.paper : P.gray);
  rect(px + 12, py + 19, 8, 8, P.deep);
  rect(px + 9, py + 27, 14, 2, P.black);
  if (on) {
    rect(px + 2, py + 8, 5, 2, P.paper);
    rect(px + 25, py + 8, 5, 2, P.paper);
    rect(px + 15, py, 2, 5, P.paper);
    rect(px + 5, py + 3, 2, 2, P.paper);
    rect(px + 25, py + 3, 2, 2, P.paper);
  }
}
function drawHome(px, py) {
  rect(px + 4, py + 11, 24, 19, P.black);
  rect(px + 6, py + 12, 20, 18, P.rust);
  rect(px + 3, py + 10, 26, 4, P.sand);
  rect(px + 7, py + 6, 18, 4, P.sand);
  rect(px + 11, py + 2, 10, 4, P.sand);
  rect(px + 9, py + 16, 5, 5, P.paper);
  rect(px + 18, py + 16, 5, 5, P.paper);
  rect(px + 14, py + 21, 6, 9, P.deep);
}
function drawGeneric(px, py, e) {
  rect(px + 5, py + 5, 22, 22, P.black);
  rect(px + 7, py + 7, 18, 18, P.sand);
  ptext(e.noun?.[0] || "?", px + 16, py + 11, P.deep, 2, "center");
}
function drawObject(e) {
  const [px, py] = cellXY(e);
  if (e.noun === "ZERO") return drawZero(px, py);
  if (e.noun === "FLAG") return drawFlag(px, py);
  if (e.noun === "CRAB") return drawCrab(px, py);
  if (e.noun === "CLUMP") return drawClump(px, py, e.value);
  if (e.noun === "DOOR") return drawDoor(px, py, e.target);
  if (e.noun === "WALL") return drawWall(px, py);
  if (e.noun === "LAMP") return drawLamp(px, py, !!state?.lamps?.[e.lampId]);
  if (e.noun === "HOME") return drawHome(px, py);
  return drawGeneric(px, py, e);
}
function drawFloor(e) {
  const [px, py] = cellXY(e);
  switch (e.floorType) {
    case "FACT_RAIL":
      rect(px, py + 25, 32, 4, P.gold);
      rect(px + 4, py + 21, 4, 4, P.paper);
      rect(px + 24, py + 21, 4, 4, P.paper);
      rect(px + 6, py + 28, 20, 2, P.rust);
      break;
    case "FACT_LOCK":
      rect(px + 5, py + 4, 22, 26, P.black);
      rect(px + 7, py + 6, 18, 22, P.rust);
      rect(px + 10, py + 10, 12, 10, P.paper);
      rect(px + 14, py + 12, 4, 6, P.black);
      ptext(e.label || "", px + 16, py + 22, P.gold, 1, "center", 0);
      break;
    case "HOLE":
      rect(px + 5, py + 13, 22, 14, P.black);
      rect(px + 8, py + 11, 16, 4, "#17121c");
      rect(px + 10, py + 16, 12, 8, "#000");
      break;
    case "ZONE":
      outline(px + 4, py + 4, 24, 24, P.mint, 3);
      rect(px + 9, py + 9, 14, 14, "#274a36");
      break;
    case "SOCKET":
      outline(px + 3, py + 3, 26, 26, P.violet, 3);
      rect(px + 7, py + 7, 18, 18, P.black);
      if (e.label) ptext(e.label, px + 16, py + 10, P.paper, 2, "center", 0);
      break;
    case "LEVER":
    case "SWITCH":
      rect(px + 5, py + 5, 22, 22, P.black);
      rect(px + 7, py + 7, 18, 18, P.gray);
      rect(px + 14, py + 9, 4, 12, P.red);
      rect(px + 16, py + 7, 8, 4, P.paper);
      ptext(
        e.label || e.weight || "",
        px + 16,
        py + 23,
        P.white,
        1,
        "center",
        0,
      );
      break;
    case "TAKE":
      rect(px + 4, py + 5, 24, 22, P.black);
      rect(px + 6, py + 7, 20, 18, P.ice);
      ptext(e.label || e.amount || "", px + 16, py + 12, P.deep, 2, "center");
      break;
    default:
      rect(px + 7, py + 7, 18, 18, P.gray);
      ptext(e.label || e.weight || "", px + 16, py + 12, P.black, 2, "center");
  }
}
function terrain(world, gx, gy) {
  const L = layout(),
    px = L.bx + gx * TILE,
    py = L.by + gy * TILE,
    n = hash(world + ":" + gx + ":" + gy),
    pal = [
      [P.grass, P.grass2, "#2f5c3f"],
      ["#355d46", "#426d4e", "#284b3b"],
      ["#244d68", "#315f78", "#1c4059"],
      ["#40385f", "#51436d", "#332d50"],
      ["#65503b", "#765d42", "#4e3d30"],
      ["#303b5d", "#3a466a", "#252e4c"],
    ][Math.max(0, (world || 1) - 1)] || [P.grass, P.grass2, "#31553b"],
    base = pal[(gx + gy + (n & 1)) % 2];
  rect(px, py, 32, 32, base);
  rect(px, py, 32, 2, "#ffffff10");
  rect(px, py, 2, 32, "#ffffff08");
  rect(px + 30, py, 2, 32, "#00000020");
  rect(px, py + 30, 32, 2, "#00000028");
  for (let i = 0; i < 3; i++) {
    const ox = 4 + ((n >>> (i * 5)) % 23),
      oy = 5 + ((n >>> (i * 7 + 3)) % 21);
    rect(px + ox, py + oy, 2, 2, pal[2]);
  }
  if (world <= 2) {
    const ox = 5 + (n % 18),
      oy = 8 + ((n >> 4) % 15);
    rect(px + ox, py + oy, 2, 7, pal[2]);
    rect(px + ox + 2, py + oy - 2, 5, 2, pal[2]);
  } else if (world === 3) {
    rect(px + 5 + (n % 16), py + 7, 2, 16, pal[2]);
    rect(px + 7 + (n % 16), py + 20, 6, 2, pal[2]);
  } else if (world === 4) {
    rect(px + 5, py + 23, 22, 2, "#292342");
    rect(px + 8 + (n % 12), py + 8, 3, 8, P.violet);
  } else if (world === 5) {
    rect(px + 5, py + 24, 22, 3, "#352b24");
    rect(px + 8 + (n % 12), py + 7, 4, 4, P.gold);
  } else {
    rect(px + 4 + (n % 20), py + 5 + (n % 17), 2, 2, P.ice);
    rect(px + 24 - (n % 12), py + 19, 2, 7, P.red);
  }
}
function drawGraph() {
  const L = layout(),
    g = level.graph;
  if (!g) return;
  ctx.lineWidth = 4;
  ctx.lineCap = "square";
  for (const e of g.edges) {
    const a = g.nodes[e.a],
      b = g.nodes[e.b];
    ctx.strokeStyle = state.graphUsed.includes(e.id) ? P.red : P.sand;
    ctx.beginPath();
    ctx.moveTo(L.bx + a.x * TILE + 16, L.by + a.y * TILE + 16);
    ctx.lineTo(L.bx + b.x * TILE + 16, L.by + b.y * TILE + 16);
    ctx.stroke();
  }
  for (const [id, n] of Object.entries(g.nodes)) {
    const px = L.bx + n.x * TILE,
      py = L.by + n.y * TILE;
    rect(px + 8, py + 8, 16, 16, id === state.graphNode ? P.ice : P.paper);
    outline(px + 7, py + 7, 18, 18, P.black, 2);
    ptext(id, px + 16, py + 11, P.black, 2, "center");
  }
}
function drawFactGlow() {
  const L = layout();
  for (const f of state.factScans || []) {
    ctx.strokeStyle = f.truth ? P.paper : P.red;
    ctx.lineWidth = 3;
    for (const q of f.cells)
      ctx.strokeRect(L.bx + q.x * TILE + 3, L.by + q.y * TILE + 3, 26, 26);
  }
}
function specialOverlay() {
  const L = layout();
  if (level.checkerboard) {
    const q = level.checkerboard;
    for (let y = 0; y < q.h; y++)
      for (let x = 0; x < q.w; x++) {
        const gx = q.x + x,
          gy = q.y + y;
        if (q.missing?.some((m) => m[0] === gx && m[1] === gy)) continue;
        rect(
          L.bx + gx * TILE,
          L.by + gy * TILE,
          TILE,
          TILE,
          (x + y) % 2 ? P.paper : P.black,
        );
      }
  }
  if (level.waterline) rect(L.bx, L.by + 4 * TILE, BOARD_W, 3, P.cyan);
}
const old = JSON.parse(localStorage.getItem("ziy-progress") || '{"done":{}}');
let progress = {
  version: 8,
  ...old,
  done: old.done || {},
  nilExpansion: old.nilExpansion || {
    enabled: true,
    facts: [],
    theoremDiscoveries: [],
    archiveOpen: false,
    telemetry: {},
  },
};
progress.nilExpansion.enabled = true;
progress.nilExpansion.facts ??= [];
progress.nilExpansion.telemetry ??= {};
const save = () =>
  localStorage.setItem("ziy-progress", JSON.stringify(progress));
save();
let screen = "map",
  world = 1,
  level = null,
  state = null,
  undo = [],
  hits = [],
  pointer = null,
  longWordTimer = null;
let sfx = localStorage.getItem("ziy-sfx") !== "off",
  music = localStorage.getItem("ziy-music") === "on",
  audioCtx = null,
  musicTimer = null;
function audio() {
  return (audioCtx ??= new (
    window.AudioContext || window.webkitAudioContext
  )());
}
function beep(freq = 440, d = 0.06, type = "square", vol = 0.025) {
  if (!sfx) return;
  try {
    const a = audio(),
      o = a.createOscillator(),
      g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(a.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + d);
    o.stop(a.currentTime + d);
  } catch {}
}
function winSound() {
  [660, 880, 1100].forEach((f, i) =>
    setTimeout(() => beep(f, 0.09, "square", 0.035), i * 80),
  );
}
const musicV10 = createMusicV10(audio);
function syncMusic() {
  if (music) {
    musicV10.setScene(screen === "nil" ? 6 : world);
    musicV10.setIntensity(
      screen === "play"
        ? 1 + Math.min(0.8, (level?.reasoningSteps || 1) / 12)
        : 1,
    );
    musicV10.start(screen === "nil" ? 6 : world);
  } else musicV10.stop();
}
function fit() {
  const L =
    screen === "play" && innerWidth >= 720 && innerWidth > innerHeight
      ? LAND
      : PORTRAIT;
  canvas.width = L.w;
  canvas.height = L.h;
  ctx.imageSmoothingEnabled = false;
  const top = $("#topbar")?.offsetHeight || 0,
    ctrl = controls?.classList.contains("hidden")
      ? 0
      : controls?.offsetHeight || 0;
  const maxW = innerWidth - 8,
    maxH = innerHeight - top - ctrl - 16,
    scale = Math.max(0.5, Math.min(maxW / L.w, maxH / L.h));
  canvas.style.width = Math.floor(L.w * scale) + "px";
  canvas.style.height = Math.floor(L.h * scale) + "px";
  draw();
}
addEventListener("resize", fit);
addEventListener("orientationchange", () => setTimeout(fit, 60));
function addHit(x, y, w, h, fn) {
  hits.push({ x, y, w, h, fn });
}
function clear() {
  hits = [];
  rect(0, 0, canvas.width, canvas.height, P.deep);
}
function menuBackdrop(seed = 0) {
  clear();
  rect(0, 0, canvas.width, canvas.height, "#10182b");
  for (let i = 0; i < 58; i++) {
    const n = hash("star:" + seed + ":" + i),
      x = n % canvas.width,
      y = (n >>> 9) % canvas.height,
      z = (n >>> 18) % 9 === 0 ? 2 : 1;
    rect(
      x,
      y,
      z,
      z,
      (n >>> 22) % 4 === 0 ? P.sand : (n >>> 20) % 3 === 0 ? P.ice : P.gray,
    );
  }
  const px = 292 + ((seed * 17) % 46),
    py = 78 + ((seed * 31) % 80),
    r = 22 + (seed % 3) * 7;
  rect(px - r, py - r, r * 2, r * 2, "#17233c");
  for (let yy = -r; yy < r; yy += 3) {
    const span = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)));
    rect(px - span, py + yy, span * 2, 3, seed % 2 ? P.violet : P.water);
  }
  rect(px - r - 9, py + 2, r * 2 + 18, 2, "#ffffff18");
  for (let y = 54; y < canvas.height; y += 32)
    rect(0, y, canvas.width, 1, "#ffffff06");
}
function bandColor(w) {
  return (
    [P.sand, P.mint, P.ice, P.violet, P.rust, P.red][
      Math.max(0, (w || 1) - 1)
    ] || P.sand
  );
}
function card(x, y, w, h, accent, title, sub, done = false) {
  rect(x, y, w, h, P.black);
  rect(x + 2, y + 2, w - 4, h - 4, accent);
  rect(x + 5, y + 5, w - 10, h - 10, P.ink);
  if (done) {
    rect(x + 7, y + 7, w - 14, 4, accent);
    rect(x + w - 13, y + 8, 5, 5, accent);
  }
  fitPtext(title, x + w / 2, y + 17, w - 22, P.white, 2, 1, "center");
  if (sub)
    fitPtext(
      sub,
      x + w / 2,
      y + h - 16,
      w - 18,
      done ? P.paper : P.gray,
      1,
      1,
      "center",
    );
}
function factEntry(f) {
  return typeof f === "string" ? f : f.display || displayFactKey(f.key || "");
}
function drawBookIcon(px, py) {
  rect(px, py, 38, 32, P.black);
  rect(px + 2, py + 2, 16, 28, P.paper);
  rect(px + 20, py + 2, 16, 28, P.paper);
  rect(px + 17, py + 4, 4, 24, P.rust);
  rect(px + 6, py + 9, 8, 2, P.rust);
  rect(px + 24, py + 9, 8, 2, P.rust);
}
function drawMap() {
  menuBackdrop(0);
  ptext("A SMALL WORLD OF BIG IDEAS", 192, 17, P.gray, 1, "center");
  fitPtext("ZERO IS YOU", 192, 38, 360, P.sand, 4, 2);
  ptext("CHANGE A RULE. FIND A WAY.", 192, 76, P.paper, 1, "center");
  const names = [
    "FIRST LIGHT",
    "HIDDEN PATHS",
    "TIDAL LOGIC",
    "PATTERN GROVE",
    "THE INVARIANTS",
    "BEYOND THE MAP",
  ];
  WORLDS.forEach((w, i) => {
    const x = 10 + (i % 2) * 190,
      y = 104 + Math.floor(i / 2) * 76,
      done = LEVELS.filter(
        (l) => l.world === w.id && progress.done[l.id],
      ).length,
      a = bandColor(w.id);
    rect(x, y + 3, 174, 65, P.black);
    rect(x, y, 174, 64, P.navy);
    rect(x + 2, y + 2, 170, 60, P.ink);
    rect(x + 2, y + 2, 3, 60, a);
    const words = names[i].split(" "),
      mid = Math.ceil(words.length / 2);
    ptext(words.slice(0, mid).join(" "), x + 88, y + 10, a, 2, "center", 0);
    ptext(words.slice(mid).join(" "), x + 88, y + 28, a, 2, "center", 0);
    ptext(done + "/10 DISCOVERED", x + 88, y + 48, P.gray, 1, "center");
    for (let k = 0; k < 10; k++)
      rect(x + 17 + k * 14, y + 59, 10, 2, k < done ? a : P.navy);
    addHit(x, y, 174, 68, () => {
      world = w.id;
      screen = "world";
      beep(330);
      draw();
    });
  });
  drawBookIcon(24, 354);
  ptext("FACT BOOK", 75, 360, P.paper, 1);
  ptext("KEEP WHAT YOU FIND", 75, 377, P.gray, 1);
  addHit(16, 345, 178, 56, () => {
    screen = "book";
    draw();
  });
  card(
    204,
    348,
    170,
    58,
    P.gold,
    "FACT FORGE",
    progress.nilExpansion.facts.length + " DISCOVERIES",
  );
  addHit(204, 348, 170, 58, () => {
    screen = "nil";
    draw();
  });
  ptext(
    "TAKE YOUR TIME. EVERY MOVE CAN BE UNDONE.",
    192,
    427,
    P.gray,
    1,
    "center",
  );
}
function drawWorld() {
  menuBackdrop(world);
  const accent = bandColor(world),
    names = [
      "FIRST LIGHT",
      "HIDDEN PATHS",
      "TIDAL LOGIC",
      "PATTERN GROVE",
      "THE INVARIANTS",
      "BEYOND THE MAP",
    ];
  ptext("< MAP", 10, 12, P.gray, 1);
  addHit(0, 0, 70, 36, () => {
    screen = "map";
    draw();
  });
  fitPtext(names[world - 1], 192, 38, 350, accent, 3, 2);
  ptext("CHOOSE A QUESTION TO EXPLORE", 192, 68, P.gray, 1, "center");
  LEVELS.filter((l) => l.world === world).forEach((l, i) => {
    const x = 7 + (i % 2) * 190,
      y = 89 + Math.floor(i / 2) * 62;
    card(
      x,
      y,
      180,
      56,
      accent,
      i + 1 + ". " + l.title,
      progress.done[l.id] ? "DISCOVERED" : "EXPLORE",
      !!progress.done[l.id],
    );
    addHit(x, y, 180, 56, () => openLevel(l));
  });
  ptext("SWIPE TO MOVE. SNAIL TO UNDO.", 192, 423, P.gray, 1, "center");
}
function drawNilWorld() {
  menuBackdrop(6);
  ptext("< MAP", 10, 10, P.gray, 1);
  addHit(0, 0, 70, 36, () => {
    screen = "map";
    draw();
  });
  fitPtext("FACT FORGE", canvas.width / 2, 12, 300, P.gold, 3, 2);
  ptext("AUTHOR TRUE RELATIONS", canvas.width / 2, 43, P.paper, 1, "center");
  const cw = 180,
    ch = 59;
  NIL_LEVELS.forEach((l, i) => {
    const x = 7 + (i % 2) * 190,
      y = 66 + Math.floor(i / 2) * 65;
    card(
      x,
      y,
      cw,
      ch,
      P.gold,
      i + 1 + ". " + l.title,
      "R" +
        (l.reasoningSteps || 3) +
        " " +
        (progress.done[l.id] ? "DONE" : "OPEN"),
      !!progress.done[l.id],
    );
    addHit(x, y, cw, ch, () => openLevel(l));
  });
}
function drawFactBook() {
  menuBackdrop(6);
  ptext("< MAP", 10, 10, P.gray, 1);
  addHit(0, 0, 70, 36, () => {
    screen = "map";
    draw();
  });
  fitPtext("THE FACT BOOK", canvas.width / 2, 10, 300, P.paper, 3, 2);
  rect(14, 54, 356, 372, P.black);
  rect(18, 58, 172, 364, P.paper);
  rect(194, 58, 172, 364, P.paper);
  rect(188, 62, 8, 356, P.rust);
  const facts = progress.nilExpansion.facts || [];
  if (!facts.length) {
    ptext("EMPTY", canvas.width / 2, 145, "#5a4638", 3, "center");
    ptext(
      "TRUE FACTS FROM THE FORGE LIVE HERE",
      canvas.width / 2,
      186,
      "#795e4a",
      1,
      "center",
    );
  } else
    facts.slice(0, 20).forEach((f, i) => {
      const col = i < 10 ? 0 : 1,
        row = i % 10,
        px = col ? 204 : 28,
        py = 76 + row * 33;
      fitPtext(factEntry(f), px, py, 150, "#30251e", 1, 1, "left");
      ptext(
        (f.familyKey || "").startsWith("add:") ? "FAMILY" : "FACT",
        px,
        py + 14,
        "#7b5c45",
        1,
      );
    });
}
function drawPlay() {
  clear();
  const L = layout(),
    accent = bandColor(level.world);
  fitPtext(
    level.expansion === "nil" ? "FACT FORGE" : level.title,
    10,
    7,
    245,
    level.expansion === "nil" ? P.gold : accent,
    2,
    1,
    "left",
  );
  ptext("MOVES " + state.moves, canvas.width - 8, 8, P.gray, 1, "right");
  fitPtext(level.concept || "", 10, 31, 245, P.gray, 1, 1, "left");
  for (let gy = 0; gy < 8; gy++)
    for (let gx = 0; gx < 12; gx++) terrain(level.world, gx, gy);
  specialOverlay();
  if (level.mode === "graph") drawGraph();
  else {
    for (const e of state.entities.filter((e) => e.kind === "floor"))
      drawFloor(e);
    for (const e of state.entities.filter((e) => e.kind === "object"))
      drawObject(e);
    for (const e of state.entities.filter((e) => e.kind === "word"))
      drawWord(e);
  }
  if (level.expansion === "nil" || level.goal?.type === "facts") drawFactGlow();
  {
    ctx.save();
    if (L === LAND) ctx.translate(384, -256);
    rect(0, L.panelY, 384, 128, P.black);
    rect(0, L.panelY, 384, 4, accent);
    if (level.lockPuzzle) {
      fitPtext("MAKE EVERY CLUE TRUE", 12, 330, 350, P.white, 2, 1, "left");
      clueFeedback(state, level).forEach((q, i) => {
        const y = 350 + i * 14;
        ptext(
          q.status === "true" ? "=" : q.status === "false" ? "!" : ".",
          12,
          y,
          q.status === "true" ? P.mint : q.status === "false" ? P.rust : P.gray,
          1,
        );
        fitPtext(
          q.text,
          27,
          y,
          341,
          q.status === "true"
            ? P.mint
            : q.status === "false"
              ? P.rust
              : P.paper,
          2,
          1,
          "left",
        );
      });
      ptext("= TRUE   ! REVISE   . INCOMPLETE", 12, 439, P.gray, 1);
    } else if (level.goal?.type === "facts") {
      fitPtext("BUILD THE TRUE RELATION", 12, 334, 350, P.white, 2, 1, "left");
      ptext("FACTS AUTHORED", 12, 364, P.gray, 1);
      (state.authoredInLevel || [])
        .slice(-3)
        .forEach((k, i) =>
          fitPtext(
            "+ " + displayFactKey(k),
            16,
            382 + i * 18,
            350,
            P.paper,
            1,
            1,
            "left",
          ),
        );
    } else {
      fitPtext(
        level.goalText || "REASON, THEN MOVE",
        12,
        334,
        350,
        P.white,
        2,
        1,
        "left",
      );
      ptext("ACTIVE RULES", 12, 364, P.gray, 1);
      (state.rules || [])
        .slice(0, 3)
        .forEach((r, i) =>
          fitPtext(
            r.subject + " " + r.verb + " " + r.object,
            16,
            382 + i * 18,
            350,
            i === 0 ? P.sand : P.white,
            1,
            1,
            "left",
          ),
        );
      if (level.hint) ptext("HOLD SNAIL = HINT", 372, 423, P.gray, 1, "right");
    }
    ctx.restore();
  }
}
function draw() {
  if (music) musicV10.setScene(screen === "nil" ? 6 : world);
  if (screen === "map") drawMap();
  else if (screen === "world") drawWorld();
  else if (screen === "nil") drawNilWorld();
  else if (screen === "book") drawFactBook();
  else if (screen === "play") drawPlay();
}
function openLevel(l) {
  level = l;
  state = createState(l);
  undo = [];
  screen = "play";
  controls.classList.remove("hidden");
  $("#nope").hidden = !l.nope;
  $("#lens").hidden = !l.lens;
  beep(392);
  fit();
}
function closePlay() {
  screen = level?.expansion === "nil" ? "nil" : "world";
  controls.classList.add("hidden");
  level = null;
  state = null;
  undo = [];
  fit();
}
function recordFacts() {
  for (const f of state.factEvents || []) {
    if (f.truth) {
      if (
        !progress.nilExpansion.facts.some(
          (x) => (typeof x === "string" ? x : x.key) === f.key,
        )
      ) {
        progress.nilExpansion.facts.push({
          key: f.key,
          familyKey: f.familyKey,
          display: f.display,
        });
        progress.nilExpansion.telemetry.facts_authored =
          (progress.nilExpansion.telemetry.facts_authored || 0) + 1;
        beep(784, 0.08);
      }
    } else
      progress.nilExpansion.telemetry.false_fact_attempts =
        (progress.nilExpansion.telemetry.false_fact_attempts || 0) + 1;
  }
  save();
}
function move(dir) {
  if (screen !== "play" || state?.won || !modal.classList.contains("hidden"))
    return;
  undo.push(structuredClone(state));
  const before = state;
  state = stepState(state, level, dir);
  recordFacts();
  if (state.event === "bump") beep(110, 0.035, "square", 0.018);
  else beep(220 + (state.moves % 4) * 35, 0.03, "square", 0.012);
  if (!before.won && state.won) {
    progress.done[level.id] = true;
    save();
    winSound();
    setTimeout(() => {
      if (screen === "play" && state?.won) showWin();
    }, 180);
  }
  draw();
}
function doUndo() {
  if (screen !== "play" || !undo.length) return;
  state = undo.pop();
  beep(170);
  draw();
}
function showWin() {
  if (!level || !state?.won) return;
  const ls = level.expansion === "nil" ? NIL_LEVELS : LEVELS,
    next = ls[ls.findIndex((l) => l.id === level.id) + 1];
  const question = level.lockPuzzle
    ? "Which clue ruled out the most possibilities?"
    : level.mode === "graph"
      ? "What made a route possible or impossible?"
      : level.goal?.type === "lamps"
        ? "Which switches changed things together?"
        : "What changed when you moved the rule?";
  modal.classList.remove("hidden");
  modal.innerHTML = `<div class="modalbox"><h2>A NEW PATH FOUND</h2><div class="trophy">◆</div><p>${level.title}</p><p>${question}</p><div class="modalrow"><button id="again">REVISIT</button><button id="back">MAP</button>${next ? '<button id="next">EXPLORE NEXT</button>' : ""}</div></div>`;
  $("#again").onclick = () => {
    modal.classList.add("hidden");
    openLevel(level);
  };
  $("#back").onclick = () => {
    modal.classList.add("hidden");
    closePlay();
  };
  if (next)
    $("#next").onclick = () => {
      modal.classList.add("hidden");
      world = next.world;
      openLevel(next);
    };
  $("#next")?.focus();
}

function showHint() {
  if (!level?.hint) return;
  modal.classList.remove("hidden");
  modal.innerHTML = `<div class="modalbox"><h2>SNAIL HINT</h2><p>${level.hint}</p><button id="okhint">BACK</button></div>`;
  $("#okhint").onclick = () => modal.classList.add("hidden");
}
function showNope() {
  if (!level?.nope) return;
  const r = validateNope(level),
    reasons = level.nopeReasons || [r.reason];
  modal.classList.remove("hidden");
  modal.innerHTML = `<div class="modalbox"><h2>WHY NOPE?</h2><div class="reasons">${reasons.map((q, i) => `<button data-i="${i}">${q}</button>`).join("")}</div><button id="closem">BACK</button></div>`;
  modal.querySelectorAll("[data-i]").forEach(
    (b) =>
      (b.onclick = () => {
        const i = +b.dataset.i;
        if (i === (level.correctReason ?? 0) && r.valid) {
          state.won = true;
          progress.done[level.id] = true;
          save();
          modal.classList.add("hidden");
          winSound();
          setTimeout(() => {
            if (screen === "play" && state?.won) showWin();
          }, 120);
        } else {
          b.classList.add("wrong");
          beep(90);
        }
      }),
  );
  $("#closem").onclick = () => modal.classList.add("hidden");
}
function showLens() {
  modal.classList.remove("hidden");
  modal.innerHTML = `<div class="modalbox"><h2>${level.lens || "INVARIANT LENS"}</h2><p>${level.hint || "Look for what cannot change under the allowed moves."}</p><button id="closel">BACK</button></div>`;
  $("#closel").onclick = () => modal.classList.add("hidden");
}
function showParent() {
  const done = Object.keys(progress.done).filter(
    (k) => progress.done[k],
  ).length;
  modal.classList.remove("hidden");
  modal.innerHTML = `<div class="modalbox"><h2>THE EXPLORER'S NOTEBOOK</h2><p>${done} puzzles explored · ${progress.nilExpansion.facts.length} facts discovered</p><p>Ask: What changed? What stayed the same? Could a different rule work?</p><p>The six islands explore constraints, equivalence, strategy and invariants. There is no clock and no penalty for undoing a move.</p><button id="closep">RETURN</button></div>`;
  $("#closep").onclick = () => modal.classList.add("hidden");
}
function logical(ev) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((ev.clientX - r.left) * canvas.width) / r.width,
    y: ((ev.clientY - r.top) * canvas.height) / r.height,
  };
}
canvas.addEventListener("pointerdown", (ev) => {
  if (!ev.isPrimary || pointer || !modal.classList.contains("hidden")) return;
  const p = logical(ev);
  pointer = { ...p, t: performance.now(), id: ev.pointerId };
  canvas.setPointerCapture(ev.pointerId);
  if (screen === "play") {
    const L = layout(),
      gx = Math.floor((p.x - L.bx) / TILE),
      gy = Math.floor((p.y - L.by) / TILE),
      w = state.entities.find(
        (e) => e.kind === "word" && e.x === gx && e.y === gy,
      );
    if (w)
      longWordTimer = setTimeout(() => {
        try {
          speechSynthesis.cancel();
          speechSynthesis.speak(
            new SpeechSynthesisUtterance(w.text.replaceAll("-", " ")),
          );
        } catch {}
      }, 550);
  }
});
canvas.addEventListener("pointerup", (ev) => {
  clearTimeout(longWordTimer);
  if (!pointer || ev.pointerId !== pointer.id) return;
  const p = logical(ev),
    dx = p.x - pointer.x,
    dy = p.y - pointer.y,
    dist = Math.hypot(dx, dy),
    dt = performance.now() - pointer.t;
  pointer = null;
  if (screen === "play" && dist > 18 && dt < 1000) {
    move(
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : dy > 0 ? "D" : "U",
    );
    return;
  }
  if (dist < 14) {
    const h = [...hits]
      .reverse()
      .find(
        (h) => p.x >= h.x && p.x < h.x + h.w && p.y >= h.y && p.y < h.y + h.h,
      );
    if (h) h.fn();
  }
});
canvas.addEventListener("pointercancel", () => {
  pointer = null;
  clearTimeout(longWordTimer);
});
addEventListener("keydown", (e) => {
  if (!modal.classList.contains("hidden")) return;
  const d = {
    ArrowLeft: "L",
    ArrowRight: "R",
    ArrowUp: "U",
    ArrowDown: "D",
    a: "L",
    d: "R",
    w: "U",
    s: "D",
  }[e.key];
  if (d) {
    e.preventDefault();
    move(d);
  }
  if (e.key === "z") doUndo();
});
$("#mapbtn").onclick = closePlay;
$("#nope").onclick = showNope;
$("#lens").onclick = showLens;
$("#parent").onclick = showParent;
let snailLong = false,
  snailTimer = null;
$("#undo").addEventListener("pointerdown", () => {
  snailLong = false;
  snailTimer = setTimeout(() => {
    snailLong = true;
    showHint();
  }, 600);
});
$("#undo").addEventListener("pointerup", () => {
  clearTimeout(snailTimer);
  if (!snailLong) doUndo();
});
$("#undo").addEventListener("pointercancel", () => clearTimeout(snailTimer));
$("#undo").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    doUndo();
  }
});
$("#langbtn").textContent = "EN";
$("#langbtn").hidden = true;
$("#soundbtn").textContent = sfx ? "SFX ON" : "SFX OFF";
$("#soundbtn").onclick = () => {
  sfx = !sfx;
  localStorage.setItem("ziy-sfx", sfx ? "on" : "off");
  $("#soundbtn").textContent = sfx ? "SFX ON" : "SFX OFF";
  if (sfx) beep(440);
};
$("#musicbtn").textContent = music ? "MUSIC ON" : "MUSIC OFF";
$("#musicbtn").onclick = () => {
  music = !music;
  localStorage.setItem("ziy-music", music ? "on" : "off");
  $("#musicbtn").textContent = music ? "MUSIC ON" : "MUSIC OFF";
  syncMusic();
};
syncMusic();
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js?v=12.0").catch(() => {});
controls.classList.add("hidden");
fit();
//# sourceURL=zero-is-you-v9.js

if (new URLSearchParams(location.search).get("test") === "1")
  window.__ZERO__ = {
    snapshot: () =>
      structuredClone({ screen, level, state, undoDepth: undo.length }),
    open: (id) => openLevel(LEVEL_BY_ID[id] || NIL_LEVEL_BY_ID[id]),
    levels: LEVELS.map((l) => ({ id: l.id, lock: !!l.lockPuzzle })),
  };
