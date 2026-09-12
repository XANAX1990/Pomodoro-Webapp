// pwa.js — PWA registration + Web Notification helper

// เก็บ registration ไว้ใช้ยิง notification ผ่าน SW เอง (ต่างจาก new Notification()
// ที่ผูกกับ page เท่านั้น — พอปิดหน้า/มือถือ minimize app มักไม่ยิง ส่วน
// reg.showNotification() วิ่งผ่าน service worker ทำให้ขึ้นแม้แอปไม่ได้เปิดอยู่)
let swRegistration = null;

/* ── Service Worker ── */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // มี SW คุมหน้านี้อยู่ก่อนแล้วหรือยัง ณ ตอนที่เริ่ม register — ใช้แยกว่านี่คือการ "อัปเดต"
  // SW เวอร์ชันเก่าเป็นใหม่ (ควร reload) หรือเป็นการ "ติดตั้งครั้งแรก" (ไม่ควร reload)
  // เพราะ activate handler ของ SW เรียก self.clients.claim() ทำให้แม้แต่ครั้งแรกก็ยิง
  // controllerchange เหมือนกัน ถ้าไม่กันไว้จะ reload หน้าเดโม่ทันทีโดยไม่จำเป็น
  const hadController = !!navigator.serviceWorker.controller;
  try {
    const reg = await navigator.serviceWorker.register("service-worker.js");
    swRegistration = reg;
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
      if (refreshing || !hadController) return; // ครั้งแรกที่ติดตั้ง ไม่ต้อง reload
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
  const options = {
    body: msg.body,
    icon: "icons/PWA192.png",
    badge: "icons/PWA192.png",
    tag: "pomodoro-timer",
    renotify: true,
  };

  try {
    // ยิงผ่าน service worker registration ก่อนเสมอ (รองรับ PWA ตอนแอปไม่ได้เปิดอยู่/มือถือ)
    if (swRegistration) {
      swRegistration.showNotification(msg.title, options).catch((e) => {
        console.warn("showNotification failed:", e);
      });
      return;
    }
    // fallback กรณี SW ยังไม่ได้ register (เช่น browser ไม่รองรับ SW)
    new Notification(msg.title, options);
  } catch (e) {
    console.warn("Notification failed:", e);
  }
}