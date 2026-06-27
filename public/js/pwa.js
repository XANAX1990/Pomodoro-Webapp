// pwa.js — PWA registration + Web Notification helper

/* ── Service Worker ── */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register("service-worker.js");
    console.log("Service Worker registered:", reg.scope);

    // พบ SW เวอร์ชันใหม่ → สั่งเข้าควบคุมทันที
    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        // เมื่อ SW ใหม่ติดตั้งเสร็จและรออยู่ → สั่งให้เข้าควบคุม
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          newWorker.postMessage("SKIP_WAITING");
        }
      });
    });

    // เมื่อ SW ใหม่เข้าควบคุมแล้ว → reload เพื่อโหลดโค้ดใหม่
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  } catch (e) {
    console.warn("Service Worker registration failed:", e);
  }
}

/* ── Web Notifications ── */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}

export function sendTimerNotification(mode) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const messages = {
    pomodoro: { title: "🍅 Pomodoro จบแล้ว!", body: "ได้เวลาพักแล้ว ยืดเส้นยืดสายหน่อยนะ 🧘" },
    rest: { title: "⏰ หมดเวลาพัก!", body: "กลับมาโฟกัสกันต่อเลย 💪" },
    long: { title: "🎉 Long Break จบแล้ว!", body: "ทำได้ดีมาก! พร้อมไปต่อไหม?" },
  };

  const msg = messages[mode] || messages.pomodoro;
  try {
    new Notification(msg.title, {
      body: msg.body,
      icon: "/icons/pwa-192.png",
      badge: "/icons/pwa-192.png",
      tag: "pomodoro-timer",
      renotify: true,
    });
  } catch (e) {
    console.warn("Notification failed:", e);
  }
}
