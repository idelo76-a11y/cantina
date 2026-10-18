// Service worker: tiene in memoria l'app così si apre anche con poco segnale.
// I dati (bottiglie e foto) passano sempre da Supabase e non vengono messi qui.
const VERSION = "cantina-v3";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "vendor/supabase.js", "vendor/jszip.min.js",
  "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return; // Supabase e Google Fonts: rete normale
  // Prima la rete (così gli aggiornamenti arrivano subito), poi la copia salvata se manca il segnale
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request).then((m) => m || caches.match("index.html")))
  );
});
