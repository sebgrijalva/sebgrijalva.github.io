import "./app-v19.js?v=19";
import { applyV22BossCelebration } from "./visual-v22.js?v=22";

const lab = window.__adventureLab;
if (!lab?.scene) throw new Error("v19 scene did not initialize before v22 art patch");
applyV22BossCelebration(lab.scene);
lab.mode = "platformer-v22-boss-party";
lab.graphics = "larger-pixel-characters-dual-bosses-croissant-finale";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
    .then(() => navigator.serviceWorker.register("./sw.js?v=22"))
    .catch(() => {});
}
