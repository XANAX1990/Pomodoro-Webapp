// service-worker.js
const CACHE_NAME = "pomodoro-02-07-2025-3";

const STATIC_FILES = [
  "/",
  "/index.html",
  "/adhd.html",
  "/styles.css",
  "/manifest.json",
  "/firebase-config.js",
  "/js/main.js",
  "/js/config.js",
  "/js/state.js",
  "/js/timer.js",
  "/js/render.js",
  "/js/tasks.js",
  "/js/audio.js",
  "/js/darkmode.js",
  "/js/ui.js",
  "/js/utils.js",
  "/js/rating.js",
  "/js/movement.js",
  "/js/reward.js",
  "/js/milestone.js",
  "/js/pwa.js",
  "/icons/PWA512.png",
  "/icons/PWA192.png",
  "/icons/favicon.png"
];

// Install — cache static files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

// Activate — clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// หลัง SW ใหม่เข้าควบคุม → สั่งหน้าเว็บที่เปิดอยู่ให้ reload
// เพื่อป้องกันไม่ให้ผู้ใช้ติดอยู่กับโค้ดเวอร์ชันเก่าผสมใหม่
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// Fetch — cache-first for static, network-first for Firebase
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Firebase / CDN — always network
  if (
    url.hostname.includes("firebase") ||
    url.hostname.includes("gstatic") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("cdnjs")
  ) {
    return;
  }

  // Audio files (BGM/Alarm) — network-first (files too large to cache)
  if (url.pathname.includes("/assets/")) {
    return;
  }

  // Static files — cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        // ไม่ cache chrome-extension หรือ non-http URLs
        if (!event.request.url.startsWith("http")) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});