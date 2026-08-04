// reward.js — Reward Pomodoro popup logic
import { state } from "./state.js";

let rewardData;
try {
  rewardData = JSON.parse(localStorage.getItem("pomodoroReward")) || null;
} catch {
  rewardData = null;
}
rewardData = rewardData || { text: "ดู YouTube 15 นาที", mins: 15 };

let rewardTimerId = null;
let rewardOpen = false; // กันไม่ให้ onRewardDone ยิงตอนที่ยังไม่เคยเปิด popup จริง (เช่นตอนกดปุ่มแก้ไข reward)

// Injected callback — เรียกเมื่อ reward popup ปิด "เพราะหมดเวลา/กด skip" เท่านั้น
// (ไม่เรียกตอนปิดเพื่อไปเปิดหน้าแก้ไข reward)
let onRewardDoneRef = null;
export function setRewardRefs({ onRewardDone }) {
  onRewardDoneRef = onRewardDone;
}

export function showRewardPopup() {
  const popup = document.getElementById("rewardPopup");
  if (!popup) return;

  document.getElementById("rewardDisplay").textContent = rewardData.text;
  document.getElementById("rewardRoundCount").textContent = state.counts.pomodoro;
  startRewardTimer(rewardData.mins * 60);
  rewardOpen = true;
  popup.classList.add("show");
}

function startRewardTimer(totalSecs) {
  let left = totalSecs;
  updateRewardCountdown(left);
  clearInterval(rewardTimerId);
  rewardTimerId = setInterval(() => {
    left--;
    updateRewardCountdown(left);
    if (left <= 0) closeRewardPopup();
  }, 1000);
}

function updateRewardCountdown(secs) {
  const el = document.getElementById("rewardCountdown");
  if (!el) return;
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(Math.max(0, secs % 60)).padStart(2, "0");
  el.textContent = `${m}:${s}`;
}

export function closeRewardPopup(fireCallback = true) {
  clearInterval(rewardTimerId);
  document.getElementById("rewardPopup")?.classList.remove("show");
  if (fireCallback && rewardOpen) onRewardDoneRef?.();
  rewardOpen = false;
}

export function initReward() {
  document.getElementById("rewardSkipBtn")?.addEventListener("click", () => closeRewardPopup());

  document.getElementById("rewardEditBtn")?.addEventListener("click", () => {
    // แค่ "ซ่อน" reward popup ไปแก้ไข ไม่ปิดจริง — timer เบื้องหลังยังเดินต่อ และ
    // rewardOpen ยังเป็น true อยู่ ไม่งั้นพอกด Save/Cancel แล้ว flow จะขาดไปเลย
    // (ก่อนหน้านี้ปิดด้วย closeRewardPopup(false) ทำให้ auto-start Long Break ไม่ทำงานตอน Save/Cancel)
    document.getElementById("rewardPopup")?.classList.remove("show");
    const ep = document.getElementById("rewardEditPopup");
    if (!ep) return;
    document.getElementById("rewardInput").value = rewardData.text;
    document.getElementById("rewardDurationInput").value = rewardData.mins;
    ep.classList.add("show");
  });

  document.getElementById("rewardEditCancelBtn")?.addEventListener("click", () => {
    document.getElementById("rewardEditPopup")?.classList.remove("show");
    backToRewardPopupIfStillOpen();
  });

  document.getElementById("rewardEditSaveBtn")?.addEventListener("click", () => {
    const text = document.getElementById("rewardInput").value.trim();
    const mins = parseInt(document.getElementById("rewardDurationInput").value, 10);
    if (text) rewardData.text = text;
    if (mins > 0) rewardData.mins = mins;
    localStorage.setItem("pomodoroReward", JSON.stringify(rewardData));
    document.getElementById("rewardEditPopup")?.classList.remove("show");
    backToRewardPopupIfStillOpen();
  });
}

// เรียกหลังปิด Edit popup (ทั้ง Save และ Cancel) — ถ้า reward ยัง "เปิดอยู่จริง" (ยังไม่หมดเวลา/ยังไม่กด skip)
// ให้โชว์ popup กลับมา ตัว interval ไม่เคยถูกหยุดเลยตั้งแต่แรก จึงนับต่อได้ถูกต้อง ไม่รีเซ็ตเวลา
function backToRewardPopupIfStillOpen() {
  if (rewardOpen) {
    document.getElementById("rewardDisplay").textContent = rewardData.text;
    document.getElementById("rewardPopup")?.classList.add("show");
  }
}