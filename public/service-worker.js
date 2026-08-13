// service-worker.js
const CACHE_NAME = "pomodoro-13-08-2026";

// ใช้ path สัมพัทธ์กับ scope ของ service worker เอง (ไม่ hardcode "/")
// เพื่อให้ deploy ใน subfolder (เช่น /pomodoro/) แล้วไม่ 404 ทำให้ install ทั้งชุดพัง
const BASE = new URL("./", self.registration.scope).pathname;
const STATIC_FILES = [
  BASE,
  BASE + "index.html",
  BASE + "adhd.html",
  BASE + "styles.css",
  BASE + "manifest.json",
  BASE + "firebase-config.js",
  BASE + "js/main.js",
  BASE + "js/config.js",
  BASE + "js/state.js",
  BASE + "js/timer.js",
  BASE + "js/render.js",
  BASE + "js/tasks.js",
  BASE + "js/audio.js",
  BASE + "js/darkmode.js",
  BASE + "js/ui.js",
  BASE + "js/utils.js",
  BASE + "js/rating.js",
  BASE + "js/movement.js",
  BASE + "js/reward.js",
  BASE + "js/milestone.js",
  BASE + "js/pwa.js",
  BASE + "icons/PWA512.png",
  BASE + "icons/PWA192.png",
  BASE + "icons/favicon.png",
  // Firebase SDK (static JS ไฟล์จาก CDN) — ต้องแคชไว้ด้วย เพราะ main.js import
  // ไฟล์พวกนี้แบบ top-level ถ้าโหลดไม่ได้ตอน offline โมดูลทั้งชุดจะพังไปด้วย
  // (ต่างจาก Firestore/Analytics ที่เป็น live API เรียกจริงตอน runtime เท่านั้น)
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js",
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js",
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-app-check.js"
];

// Install — cache static files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        STATIC_FILES.map((url) =>
          cache.add(url).catch((err) => {
            // ไฟล์เดียวหาย (404/network) ไม่ควรทำให้ SW ทั้งตัวติดตั้งไม่ผ่าน
            console.warn("SW: cache ไฟล์ไม่สำเร็จ", url, err);
          })
        )
      )
    )
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

  // Firebase SDK ไฟล์ static จาก gstatic (firebase-app.js, firebase-auth.js, ...)
  // แคช cache-first ได้เหมือนไฟล์ static อื่น เพราะ pin เวอร์ชันไว้ตายตัวแล้ว (12.14.0)
  // ต่างจาก live API call ด้านล่างที่ต้อง network เสมอ
  const isFirebaseSdkFile = url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/");

  // Firebase live API / analytics collect / recaptcha / cdnjs — ต้อง network เสมอ ห้าม cache
  if (
    !isFirebaseSdkFile &&
    (
      url.hostname.includes("firebase") ||
      url.hostname.includes("gstatic") ||
      url.hostname.includes("googleapis") ||
      url.hostname.includes("cdnjs")
    )
  ) {
    return;
  }

  // Audio files (BGM/Alarm) — network-first (files too large to cache)
  if (url.pathname.includes("/assets/")) {
    return;
  }

  // HTML/JS/CSS — network-first (เดี๋ยวๆ ตรวจของใหม่เสมอ)
  // ป้องกันปัญหา user ค้างโค้ดเก่าถ้าลืม bump CACHE_NAME ตอน release
  // (ก่อนหน้านี้ cache-first ทั้งหมด ทำให้ถ้าลืมเปลี่ยนชื่อ cache ผู้ใช้เดิมจะไม่เห็นโค้ด/สไตล์ใหม่เลย)
  const isCodeFile = /\.(html|js|css)$/.test(url.pathname) || url.pathname.endsWith("/");
  if (isCodeFile) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && event.request.url.startsWith("http")) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // ไฟล์ static อื่น (ไอคอน, manifest ฯลฯ) — cache-first ตามเดิม
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