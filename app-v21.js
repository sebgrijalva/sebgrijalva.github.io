import "./app-v19.js?v=19";
import { applyV21PixelArt } from "./visual-v21.js?v=21";

const lab = window.__adventureLab;
if (!lab?.scene) throw new Error("v19 scene did not initialize before v21 art patch");
applyV21PixelArt(lab.scene);
lab.mode = "platformer-v21-hd2d-pixel";
lab.graphics = "authored-pixel-sprites-layered-biomes-modern-lighting";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
    .then(() => navigator.serviceWorker.register("./sw.js?v=21"))
    .catch(() => {});
}
