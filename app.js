import { ToyEngine } from "./engine.js";
import { MarbleLab } from "./marble-lab.js";

const canvas = document.querySelector("#toyCanvas");
const scene = new MarbleLab();
const engine = new ToyEngine(canvas, scene);

const welcome = document.querySelector("#welcomeDialog");
const profileSelect = document.querySelector("#profileSelect");
const startBtn = document.querySelector("#startBtn");
const clearBtn = document.querySelector("#clearBtn");
const modeBtn = document.querySelector("#modeBtn");
const gravityBtn = document.querySelector("#gravityBtn");
const sceneBtn = document.querySelector("#sceneBtn");
const installBtn = document.querySelector("#installBtn");
const toast = document.querySelector("#toast");
const tools = [...document.querySelectorAll(".tool")];

let deferredInstall = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1500);
}

function setTool(name) {
  scene.setTool(name);
  tools.forEach(b => b.classList.toggle("active", b.dataset.tool === name));
}

tools.forEach(btn => btn.addEventListener("click", () => setTool(btn.dataset.tool)));

clearBtn.addEventListener("click", () => {
  scene.clear();
  showToast("Fresh workshop");
});

modeBtn.addEventListener("click", () => {
  scene.setProfile(scene.profile === "builder" ? "little" : "builder");
  modeBtn.textContent = scene.profile === "builder" ? "Builder" : "Little";
  engine.store.set("profile", scene.profile);
  showToast(scene.profile === "builder" ? "Builder mode" : "Little explorer mode");
});

gravityBtn.addEventListener("click", () => {
  const on = scene.toggleGravity();
  gravityBtn.textContent = on ? "Gravity" : "Float";
  showToast(on ? "Gravity on" : "Floating world");
});

sceneBtn.addEventListener("click", () => {
  const name = scene.cycleScene();
  engine.store.set("sceneIndex", scene.sceneIndex);
  showToast(`${name} map`);
});

startBtn.addEventListener("click", () => {
  const profile = profileSelect.value;
  scene.setProfile(profile);
  modeBtn.textContent = profile === "builder" ? "Builder" : "Little";
  engine.store.set("profile", profile);
});

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredInstall = e;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  installBtn.hidden = true;
});

window.addEventListener("appinstalled", () => showToast("Installed"));

const savedProfile = engine.store.get("profile", null);
const savedScene = engine.store.get("sceneIndex", 0);
scene.sceneIndex = savedScene % scene.sceneNames.length;
scene.clear();

if (savedProfile) {
  profileSelect.value = savedProfile;
  scene.setProfile(savedProfile);
  modeBtn.textContent = savedProfile === "builder" ? "Builder" : "Little";
} else {
  welcome.showModal();
}

engine.start();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {
    showToast("Offline cache unavailable");
  });
}
