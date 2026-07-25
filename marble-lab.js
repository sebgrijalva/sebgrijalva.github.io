import { Vec2, TAU } from "./engine.js";
import c1 from "./marble-code-1.js";
import c2 from "./marble-code-2.js";
import c3 from "./marble-code-3.js";
import c4 from "./marble-code-4.js";
import c5 from "./marble-code-5.js";
import c6 from "./marble-code-6.js";
const source = [c1,c2,c3,c4,c5,c6].join("") + "\nreturn MarbleLab;";
export const MarbleLab = new Function("Vec2", "TAU", source)(Vec2, TAU);
