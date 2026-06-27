// movement.js — Pomodoro Movement popup logic

export const MOVEMENTS = [
  { emoji: "🧘", title: "Deep Breathing",  desc: "หายใจเข้าลึกๆ 5 ครั้ง แล้วผ่อนคลาย",      secs: 30 },
  { emoji: "🚶", title: "เดินรอบห้อง",      desc: "ลุกเดินรอบห้องหรือเดินในที่ 30 วินาที",    secs: 30 },
  { emoji: "💪", title: "ยืดแขน",           desc: "ยกแขนทั้งสองข้างขึ้นเหนือหัว ค้างไว้",     secs: 20 },
  { emoji: "🔄", title: "หมุนคอ",           desc: "หมุนคอช้าๆ ซ้าย-ขวา 5 รอบ",              secs: 25 },
  { emoji: "🦵", title: "ยืดขา",            desc: "ยืดขาทีละข้าง ค้างไว้ข้างละ 15 วินาที",   secs: 30 },
  { emoji: "🙆", title: "ยืดหลัง",          desc: "เอี้ยวลำตัวซ้าย-ขวา ช้าๆ 5 ครั้ง",        secs: 25 },
  { emoji: "👀", title: "พักสายตา",         desc: "มองออกไปไกลๆ นอกหน้าต่าง 20 วินาที",     secs: 20 },
];

const RING_CIRCUM = 213.6;
let movementTimerId = null;
let movementSecsLeft = 0;

// Injected callback — called when movement popup closes (completed=true)
let onMovementDoneRef = null;
export function setMovementRefs({ onMovementDone }) {
  onMovementDoneRef = onMovementDone;
}

export function showMovementPopup() {
  const popup = document.getElementById("movementPopup");
  if (!popup) {
    // หน้านี้ไม่มี movement popup — ถือว่าเสร็จทันที
    onMovementDoneRef?.();
    return;
  }

  const m = MOVEMENTS[Math.floor(Math.random() * MOVEMENTS.length)];
  document.getElementById("movementEmoji").textContent = m.emoji;
  document.getElementById("movementTitle").textContent = m.title;
  document.getElementById("movementDesc").textContent  = m.desc;
  movementSecsLeft = m.secs;
  updateMovementRing(m.secs, m.secs);

  clearInterval(movementTimerId);
  movementTimerId = setInterval(() => {
    movementSecsLeft--;
    updateMovementRing(movementSecsLeft, m.secs);
    if (movementSecsLeft <= 0) closeMovementPopup(true);
  }, 1000);

  popup.classList.add("show");
}

function updateMovementRing(left, total) {
  const el   = document.getElementById("movementCountdown");
  const ring = document.getElementById("movementRingProgress");
  if (el)   el.textContent = left;
  if (ring) ring.style.strokeDashoffset = RING_CIRCUM * (1 - left / total);
}

export function closeMovementPopup(completed = false) {
  clearInterval(movementTimerId);
  document.getElementById("movementPopup")?.classList.remove("show");
  if (completed) onMovementDoneRef?.();
}

export function initMovement() {
  document.getElementById("movementSkipBtn")?.addEventListener("click", () => closeMovementPopup(true));
  document.getElementById("movementDoneBtn")?.addEventListener("click", () => closeMovementPopup(true));
}
