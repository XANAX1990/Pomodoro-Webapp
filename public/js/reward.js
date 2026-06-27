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

export function showRewardPopup() {
  const popup = document.getElementById("rewardPopup");
  if (!popup) return;

  document.getElementById("rewardDisplay").textContent    = rewardData.text;
  document.getElementById("rewardRoundCount").textContent = state.counts.pomodoro;
  startRewardTimer(rewardData.mins * 60);
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

export function closeRewardPopup() {
  clearInterval(rewardTimerId);
  document.getElementById("rewardPopup")?.classList.remove("show");
}

export function initReward() {
  document.getElementById("rewardSkipBtn")?.addEventListener("click", closeRewardPopup);

  document.getElementById("rewardEditBtn")?.addEventListener("click", () => {
    closeRewardPopup();
    const ep = document.getElementById("rewardEditPopup");
    if (!ep) return;
    document.getElementById("rewardInput").value         = rewardData.text;
    document.getElementById("rewardDurationInput").value = rewardData.mins;
    ep.classList.add("show");
  });

  document.getElementById("rewardEditCancelBtn")?.addEventListener("click", () => {
    document.getElementById("rewardEditPopup")?.classList.remove("show");
  });

  document.getElementById("rewardEditSaveBtn")?.addEventListener("click", () => {
    const text = document.getElementById("rewardInput").value.trim();
    const mins = parseInt(document.getElementById("rewardDurationInput").value, 10);
    if (text)   rewardData.text = text;
    if (mins > 0) rewardData.mins = mins;
    localStorage.setItem("pomodoroReward", JSON.stringify(rewardData));
    document.getElementById("rewardEditPopup")?.classList.remove("show");
  });
}
