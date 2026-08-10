import "./app-v18.js?v=18";
import { applyV19Graphics } from "./visual-v19.js?v=19";

const lab = window.__adventureLab;
if (!lab?.scene) throw new Error("v18 scene did not initialize before v19 graphics patch");
applyV19Graphics(lab.scene);
lab.mode = "platformer-v19-cinematic-graphics";
lab.graphics = "cinematic-parallax-biomes-expressive-characters";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
    .then(() => navigator.serviceWorker.register("./sw.js?v=19"))
    .catch(() => {});
}
