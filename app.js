import { ToyEngine } from "./engine.js?v=15";
import { MatterAdventureScene } from "./matter-adventure.js?v=15";

const canvas = document.querySelector("#toyCanvas");
const scene = new MatterAdventureScene();
const engine = new ToyEngine(canvas, scene);
window.__adventureLab = { scene, engine, physics: "Matter.js 0.20.0" };

const activeLabel = document.querySelector("#activeLabel");
const mapLabel = document.querySelector("#mapLabel");
const missionText = document.querySelector("#missionText");
const inventoryButtons = [...document.querySelectorAll(".inventory-tool")];
const powerButtons = [...document.querySelectorAll(".power-choice")];
const powerBtn = document.querySelector("#powerBtn");
const eraserBtn = document.querySelector("#eraserBtn");
const installBtn = document.querySelector("#installBtn");
const joystick = document.querySelector("#joystick");
const knob = document.querySelector("#joystickKnob");
const toast = document.querySelector("#toast");

const heroName = document.querySelector("#heroName");
const heroType = document.querySelector("#heroType");
const heroHelmet = document.querySelector("#heroHelmet");
const heroColor = document.querySelector("#heroColor");
const heroAccent = document.querySelector("#heroAccent");
const heroEmblem = document.querySelector("#heroEmblem");
const heroCape = document.querySelector("#heroCape");
const shipName = document.querySelector("#shipName");
const shipHull = document.querySelector("#shipHull");
const shipWings = document.querySelector("#shipWings");
const shipColor = document.querySelector("#shipColor");
const shipAccent = document.querySelector("#shipAccent");

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

scene.setStateListener(state => {
  activeLabel.textContent = state.activeName;
  mapLabel.textContent = state.mapName;
  missionText.textContent = state.message;
  for (const button of inventoryButtons) {
    const tool = button.dataset.tool;
    const unlocked = state.unlocked.includes(tool);
    button.disabled = !unlocked;
    button.classList.toggle("locked", !unlocked);
    button.classList.toggle("selected", state.selectedTool === tool);
  }
  for (const button of powerButtons) button.classList.toggle("selected", state.selectedPower === button.dataset.power);
  const powerIcons = { fire: "🔥", ice: "❄️", lightning: "⚡" };
  powerBtn.textContent = `THROW ${powerIcons[state.selectedPower]}`;
  eraserBtn.classList.toggle("active", state.eraseMode);
  eraserBtn.setAttribute("aria-pressed", String(state.eraseMode));
});

for (const button of inventoryButtons) {
  button.addEventListener("click", () => {
    scene.selectTool(button.dataset.tool);
    showToast(`${button.querySelector("small").textContent} selected`);
  });
}

for (const button of powerButtons) {
  button.addEventListener("click", () => {
    scene.selectPower(button.dataset.power);
    showToast(`${button.querySelector("small").textContent} power selected`);
  });
}

document.querySelector("#jumpBtn").addEventListener("pointerdown", event => { event.preventDefault(); scene.jump(); });
document.querySelector("#toolBtn").addEventListener("pointerdown", event => { event.preventDefault(); scene.useTool(); });
powerBtn.addEventListener("pointerdown", event => { event.preventDefault(); scene.throwPower(); });
eraserBtn.addEventListener("click", () => scene.toggleErase());
document.querySelector("#switchBtn").addEventListener("click", () => scene.switchActive());
document.querySelector("#mapBtn").addEventListener("click", () => scene.cycleMap());
document.querySelector("#resetBtn").addEventListener("click", () => { scene.resetMap(true); showToast("World reset"); });

const heroDialog = document.querySelector("#heroDialog");
const shipDialog = document.querySelector("#shipDialog");

document.querySelector("#heroBtn").addEventListener("click", () => {
  const config = scene.heroConfig;
  heroName.value = config.name; heroType.value = config.type; heroHelmet.value = config.helmet;
  heroColor.value = config.color; heroAccent.value = config.accent; heroEmblem.value = config.emblem; heroCape.checked = config.cape;
  heroDialog.showModal();
});

document.querySelector("#shipBtn").addEventListener("click", () => {
  const config = scene.shipConfig;
  shipName.value = config.name; shipHull.value = config.hull; shipWings.value = config.wings;
  shipColor.value = config.color; shipAccent.value = config.accent;
  shipDialog.showModal();
});

document.querySelector("#saveHeroBtn").addEventListener("click", () => {
  scene.updateHero({
    name: heroName.value.trim() || "Tomás", type: heroType.value, helmet: heroHelmet.value,
    color: heroColor.value, accent: heroAccent.value, emblem: heroEmblem.value, cape: heroCape.checked
  });
  showToast("Hero saved");
});

document.querySelector("#saveShipBtn").addEventListener("click", () => {
  scene.updateShip({
    name: shipName.value.trim() || "Comet", hull: shipHull.value, wings: shipWings.value,
    color: shipColor.value, accent: shipAccent.value
  });
  showToast("Vehicle saved");
});

let joystickPointer = null;
function updateJoystick(event) {
  const rect = joystick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  let x = (event.clientX - centerX) / (rect.width * .32);
  let y = (event.clientY - centerY) / (rect.height * .32);
  const length = Math.hypot(x, y);
  if (length > 1) { x /= length; y /= length; }
  knob.style.transform = `translate(${x * 34}px, ${y * 34}px)`;
  scene.setInput(x, y);
}
joystick.addEventListener("pointerdown", event => {
  joystickPointer = event.pointerId;
  joystick.setPointerCapture?.(event.pointerId);
  engine.audio.unlock();
  updateJoystick(event);
});
joystick.addEventListener("pointermove", event => { if (event.pointerId === joystickPointer) updateJoystick(event); });
function releaseJoystick(event) {
  if (event.pointerId !== joystickPointer) return;
  joystickPointer = null;
  knob.style.transform = "translate(0, 0)";
  scene.setInput(0, 0);
}
joystick.addEventListener("pointerup", releaseJoystick);
joystick.addEventListener("pointercancel", releaseJoystick);

let deferredInstall = null;
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstall = event;
  installBtn.classList.add("ready");
});
installBtn.addEventListener("click", async () => {
  if (window.matchMedia("(display-mode: standalone)").matches) {
    showToast("Already installed");
    return;
  }
  if (deferredInstall) {
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    installBtn.classList.remove("ready");
  } else {
    showToast("Chrome menu ⋮ → Add to Home screen");
  }
});
window.addEventListener("appinstalled", () => {
  installBtn.hidden = true;
  showToast("Adventure Lab installed");
});
if (window.matchMedia("(display-mode: standalone)").matches) installBtn.hidden = true;

engine.start();

if (!engine.store.get("heroCreated", false)) {
  engine.store.set("heroCreated", true);
  setTimeout(() => document.querySelector("#heroBtn").click(), 250);
}

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js?v=15").catch(() => {});
