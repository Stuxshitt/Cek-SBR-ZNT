// Service worker Cek SBR: halaman utama ambil versi terbaru dulu (fallback ke cache kalau offline),
// library dari CDN dan font disimpan di cache. Data upload gak pernah lewat sini.
const VER = "cek-sbr-v3";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
const LIBS = [
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.9.0/proj4.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL).then(() => Promise.all(LIBS.map(u => fetch(u, {mode: "no-cors"}).then(r => c.put(u, r)).catch(() => {}))))));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.mode === "navigate" || (url.origin === location.origin && url.pathname.endsWith(".html"))) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VER).then(c => c.put("./index.html", cp)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  if (url.host === "cdnjs.cloudflare.com" || url.host.endsWith("fonts.googleapis.com") || url.host.endsWith("fonts.gstatic.com") || url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp)); return r; })));
  }
  // tile peta dasar (Esri) gak di-cache: selalu ambil online
});
