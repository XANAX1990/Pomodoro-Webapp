import { queryEls } from "./config.js";
import { state } from "./state.js";
import {
  initTimer, setTimerRefs, switchModeManually, toggleTimer, syncTimerAfterBackground,
  buildPresetList, updatePreset, updateCustomValue, completeSession
} from "./timer.js";
import { initDarkMode, toggleDarkMode, updateDarkModeUI } from "./darkmode.js";
import { initTasks, addTask, clearDoneTasks, clearAllTasks, renderTasks } from "./tasks.js";
import {
  initAudio, setAudioRefs, playAlarm, stopAlarm, updateMusic,
  prevTrack, nextTrack, renderPlaylist
} from "./audio.js";
import {
  initUI, setUIRefs, openCustomizerPanel, toggleDropdown, closeDropdowns,
  toggleFullscreen, toggleMobileMenu
} from "./ui.js";
import { initRender, render } from "./render.js";
import { initRating, setFabOpen, setRatingRefs, markLongBreakRatingPending } from "./rating.js";
import { initMovement, showMovementPopup, setMovementRefs, closeMovementPopup } from "./movement.js";
import { initReward, showRewardPopup, setRewardRefs, closeRewardPopup, closeRewardEditPopup } from "./reward.js";
import { showMilestoneToast } from "./milestone.js";
import { registerServiceWorker, requestNotificationPermission, sendTimerNotification } from "./pwa.js";

const els = queryEls();

// Wire up modules
initTimer(els, render);
setTimerRefs({
  playAlarm,
  toggleDarkMode,
  onLongComplete: () => {
    sendTimerNotification("long");
    els.rating_container?.classList.add("show");
    setFabOpen(true);
    markLongBreakRatingPending();
  },
  onRestComplete: () => {
    sendTimerNotification("rest");
  },
  onPomodoroComplete: (count) => {
    sendTimerNotification("pomodoro");
    // ต้องตั้ง pendingReward ก่อนเรียก showMovementPopup() — หน้า General ไม่มี movementPopup
    // เลยเรียก onMovementDone แบบ synchronous ทันทีในบรรทัดถัดไป ถ้าตั้ง pendingReward
    // หลังจากนั้น onMovementDone จะอ่านค่าเก่า (false) ไปแล้ว ทำให้ reward รอบที่ 4 ไม่ขึ้นเลย
    if (count % 4 === 0) pendingReward = true;
    showMovementPopup();
  },
  onMilestone: (minutesElapsed) => {
    // Micro-reward toast เป็นฟีเจอร์เฉพาะ ADHD (ข้อ 1.3.4) — gate ด้วย page-adhd
    // ไม่งั้นหน้า General ก็จะเห็น toast ทุก milestone ไปด้วยทั้งที่ไม่ควรมี
    if (document.body.classList.contains("page-adhd")) showMilestoneToast(minutesElapsed);
  },
});
initDarkMode(els, render);
initTasks(els);
initAudio(els);
setAudioRefs({ closeDropdowns });
initUI(els);
setUIRefs({ stopAlarm });
initRender(els);
initRating(els);
initMovement();
initReward();

// Movement → Reward → Break chain
// รอบปกติ: Movement ปิด -> auto-start break ได้เลย
// รอบที่มี reward (ครบ 4 pomodoro): Movement ปิด -> เปิด Reward -> "รอ Reward ปิดก่อน" ค่อย auto-start
// long break กันไม่ให้ break timer วิ่งซ้อนกับ reward popup ที่ยังเปิดอยู่
let pendingReward = false;
setMovementRefs({
  onMovementDone: () => {
    if (pendingReward) {
      pendingReward = false;
      setTimeout(() => showRewardPopup(), 400);
    } else if (state.autoBreaks && !state.running && (state.mode === "rest" || state.mode === "long")) {
      toggleTimer(true, toggleDarkMode);
    }
  },
});
setRewardRefs({
  onRewardDone: () => {
    if (state.autoBreaks && !state.running && (state.mode === "rest" || state.mode === "long")) {
      toggleTimer(true, toggleDarkMode);
    }
  },
});
setRatingRefs({
  // เรียกเมื่อ rating popup ที่เปิดจาก Long Break จบ ถูกปิดแล้วจริงๆ (ข้าม/ให้คะแนนเสร็จ)
  // ค่อย auto-start pomodoro รอบถัดไป — ดู completeSession() ใน timer.js ที่ตั้งใจไม่ auto-start ทันที
  onRatingFlowDone: () => {
    if (state.autoPomodoro && !state.running && state.mode === "pomodoro") {
      toggleTimer(true, toggleDarkMode);
    }
  },
});

// Dev test panel — เรียก popup/toast ตรงๆ เพื่อทดสอบ ไม่ผ่าน flow ของ timer จริง
document.getElementById("testMovementBtn")?.addEventListener("click", () => showMovementPopup());
document.getElementById("testRewardBtn")?.addEventListener("click", () => showRewardPopup());
document.getElementById("testMilestoneBtn")?.addEventListener("click", () => showMilestoneToast(5));

/* ---------- Audio bar (mobile collapse) ----------
   เดิม body padding-bottom เป็นค่าคงที่ (92px) แต่พอ audio bar ล้นเป็น 2 แถวบนจอแคบ
   ความสูงจริงมากกว่านั้น ทำให้ไปทับพื้นที่ timer/tasks ด้านล่าง — วัดความสูงจริงด้วย
   ResizeObserver แล้ว sync เข้า body padding เสมอ ไม่ว่าจะพับ/กางออก */
if (els.audioBar) {
  const syncAudioBarSpacing = () => {
    document.body.style.paddingBottom = `${els.audioBar.offsetHeight + 12}px`;
  };
  new ResizeObserver(syncAudioBarSpacing).observe(els.audioBar);
  syncAudioBarSpacing();

  els.audioCollapseBtn?.addEventListener("click", () => {
    const collapsed = els.audioBar.classList.toggle("collapsed");
    els.audioCollapseBtn.setAttribute("aria-expanded", String(!collapsed));
  });
}

/* ---------- Modal focus trap (accessibility) ----------
   เดิม modal ไม่ trap focus — เวลาเปิด modal คนที่ใช้คีย์บอร์ด/สกรีนรีดเดอร์
   ยังกด Tab ไปโดนปุ่มลอย (FAB, audio-bar, theme toggle ฯลฯ) ที่ "มองไม่เห็น" อยู่หลัง
   overlay ได้ ทำให้งง/ใช้งานไม่ได้ ต้องดักปุ่ม Tab ให้วนอยู่แต่ใน modal ที่เปิดอยู่ */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

let lastFocusedBeforeModal = null;

function getOpenModal() {
  return document.querySelector(".modal-container.show");
}

function trapModalFocus(event) {
  const modal = getOpenModal();
  if (!modal || event.key !== "Tab") return;
  const focusable = [...modal.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (el) => el.offsetParent !== null
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  } else if (!modal.contains(document.activeElement)) {
    event.preventDefault();
    first.focus();
  }
}
document.addEventListener("keydown", trapModalFocus);

// เฝ้าดู class "show" ของทุก modal-container — พอเปิด ให้ย้าย focus เข้าไปข้างในทันที
// พอปิด ให้คืน focus กลับไปที่ปุ่มเดิมที่เปิด modal (กันโฟกัสหลุดไปที่ <body>)
document.querySelectorAll(".modal-container").forEach((modal) => {
  const observer = new MutationObserver(() => {
    if (modal.classList.contains("show")) {
      lastFocusedBeforeModal = document.activeElement;
      const focusable = modal.querySelector(FOCUSABLE_SELECTOR);
      focusable?.focus();
    } else if (lastFocusedBeforeModal && !getOpenModal()) {
      lastFocusedBeforeModal.focus();
      lastFocusedBeforeModal = null;
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
});

/* ---------- Global click-outside ---------- */
document.addEventListener("click", (event) => {
  if (!event.target.closest(".dropdown, .top-actions, .task-menu, .more-btn")) {
    // เดิมปิด customizer ตรงๆ โดยไม่ผ่าน closeDropdowns() เลย ทำให้ข้าม logic ดับ alarm
    // ที่เล่นทดสอบค้างอยู่ (testAlarmBtn / เปลี่ยน radio ใน Customize) — คลิกออกนอกแผง
    // Customize แล้วเสียงยังเล่นต่อ เพราะ path นี้ไม่เคยเรียก stopAlarm เลย
    if (els.customizer && !els.customizer.hidden) stopAlarm();
    if (els.customizer) els.customizer.hidden = true;
    if (els.taskMenu) els.taskMenu.hidden = true;
    if (els.customizeBtn) els.customizeBtn.setAttribute("aria-expanded", "false");
  }
  if (!event.target.closest("#taskForm") && els.taskFormActions) {
    els.taskFormActions.hidden = true;
  }
  if (event.target.classList.contains("modal-container")) {
    // popup บางตัวมี timer/callback ผูกอยู่เบื้องหลัง (Reward, Movement) ถ้าแค่ลบ class "show"
    // เฉยๆ โดยไม่เรียกฟังก์ชันปิดจริง จะทำให้ interval เดินต่อแบบมองไม่เห็น และ auto-break ไม่ทำงาน
    if (event.target.id === "rewardPopup") {
      closeRewardPopup();
    } else if (event.target.id === "movementPopup") {
      closeMovementPopup(true);
    } else if (event.target.id === "rewardEditPopup") {
      closeRewardEditPopup(); // ปิด backdrop ของ Edit Reward ต้องกลับไป Reward popup เหมือนกด Cancel
    } else {
      event.target.classList.remove("show");
    }
    if (event.target === els.rating_container) setFabOpen(false);
  }
});

/* ---------- Dark mode ---------- */
els.darkModeBtn?.addEventListener("click", () => toggleDarkMode());

/* ---------- Customizer ---------- */
els.customizeBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  openCustomizerPanel("home");
  toggleDropdown(els.customizeBtn, els.customizer);
});
document.querySelectorAll("[data-open-panel]").forEach((btn) => {
  btn.addEventListener("click", () => openCustomizerPanel(btn.dataset.openPanel));
});
document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", () => openCustomizerPanel("home"));
});

/* ---------- Presets ---------- */
els.presetList.addEventListener("change", (e) => {
  if (e.target.name === "preset") updatePreset(e.target.value);
});
els.customPomodoro.addEventListener("input", (e) => updateCustomValue("pomodoro", e.target.value));
els.customRest.addEventListener("input", (e) => updateCustomValue("rest", e.target.value));
els.customLong.addEventListener("input", (e) => updateCustomValue("long", e.target.value));

/* ---------- Timer controls ---------- */
function maybeAskNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "default") return; // ตัดสินใจไปแล้ว (granted/denied) ไม่ต้องถามซ้ำ
  let alreadyAsked = false;
  try {
    alreadyAsked = localStorage.getItem("pomodoroNotifAsked") === "1";
  } catch {
    alreadyAsked = false;
  }
  if (alreadyAsked) return;
  try {
    localStorage.setItem("pomodoroNotifAsked", "1");
  } catch {
    /* ignore เขียน localStorage ไม่ได้ */
  }
  const wantsNotif = window.confirm(
    "อยากให้แจ้งเตือนตอน Pomodoro/พักจบไหม? ถ้ากดตกลง เบราว์เซอร์จะขอสิทธิ์แจ้งเตือนอีกครั้ง (ถ้ากด Block ตรงนั้น จะเปิดใหม่ทีหลังต้องไปตั้งค่าเบราว์เซอร์เอง)"
  );
  if (wantsNotif) requestNotificationPermission();
}

els.startBtn.addEventListener("click", () => {
  // เดิมยิง native permission prompt ทันทีตอนกด Start โดยไม่มีคำอธิบายเลย
  // คนส่วนมากเจอ prompt แปลกๆ แบบนี้มักกด "Block" เป็นปฏิกิริยาอัตโนมัติ และเบราว์เซอร์
  // ส่วนใหญ่จะไม่ถามซ้ำให้อีกเลยหลังจากนั้น (ต้องไปเปิดเองใน browser settings) เสียโอกาสถามตอนที่เหมาะสมกว่า
  // เปลี่ยนเป็น: อธิบายก่อนด้วย confirm ของแอปเอง แล้วค่อยยิง native prompt เฉพาะตอนผู้ใช้ตกลง
  // และถามแค่ครั้งเดียวต่อเครื่อง ไม่ถามซ้ำทุกครั้งที่กด Start
  maybeAskNotificationPermission();
  toggleTimer(undefined, toggleDarkMode);
});
els.pauseBtn?.addEventListener("click", () => toggleTimer(false, toggleDarkMode));
els.finishBtn?.addEventListener("click", () => {
  toggleTimer(false, toggleDarkMode);
  els.modal_container?.classList.add("show");
});
els.modeTabs.forEach((tab) => tab.addEventListener("click", () => switchModeManually(tab.dataset.mode)));
els.skipBreakBtn.addEventListener("click", () => switchModeManually("rest"));
els.skipLongBreakBtn.addEventListener("click", () => switchModeManually("long"));

// iPadOS จะหยุด setInterval ระหว่างล็อกจอ จึงตรวจ deadline จาก wall-clock
// ทันทีที่กลับมา visible/focus เพื่อไม่ให้ timer ค้าง และให้มี notification ทันทีที่ระบบปลุก PWA
function syncTimerWhenAppReturns() {
  if (!document.hidden) syncTimerAfterBackground();
}
document.addEventListener("visibilitychange", syncTimerWhenAppReturns);
window.addEventListener("pageshow", syncTimerWhenAppReturns);
window.addEventListener("focus", syncTimerWhenAppReturns);

els.autoPomodoro.addEventListener("change", () => {
  state.autoPomodoro = els.autoPomodoro.checked;
  localStorage.setItem("pomodoroAutoPomodoro", String(state.autoPomodoro));
});
els.autoBreaks.addEventListener("change", () => {
  state.autoBreaks = els.autoBreaks.checked;
  localStorage.setItem("pomodoroAutoBreaks", String(state.autoBreaks));
});
els.autoDarkMode?.addEventListener("change", () => {
  state.autoDarkMode = els.autoDarkMode.checked;
  localStorage.setItem("pomodoroAutoDarkMode", String(state.autoDarkMode));
});

/* ---------- Tasks ---------- */
function submitTaskInput() {
  const title = els.taskInput.value.trim();
  if (!title) {
    if (els.taskFormActions) els.taskFormActions.hidden = true;
    return;
  }
  addTask(title);
  els.taskInput.value = "";
  if (els.taskFormActions) els.taskFormActions.hidden = true;
}
els.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitTaskInput();
});
// เดิมพึ่ง implicit form submission ล้วนๆ ซึ่งบางเบราว์เซอร์/คีย์บอร์ดมือถือ
// (โดยเฉพาะตอนที่มีปุ่ม submit มากกว่า 1 ตัวในฟอร์ม — ปุ่ม "+" กับปุ่ม "Add") ไม่ยิง submit
// ให้ตอนกด Enter ดักจับ Enter บน input ตรงๆ เพื่อบันทึกงานได้ทันทีเสมอ
els.taskInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitTaskInput();
  }
});
els.taskInput.addEventListener("focus", () => {
  if (els.taskFormActions) els.taskFormActions.hidden = false;
});
els.taskCancelBtn?.addEventListener("click", () => {
  els.taskInput.value = "";
  els.taskInput.blur();
  if (els.taskFormActions) els.taskFormActions.hidden = true;
});
els.tasksMenuBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  els.taskMenu.hidden = !els.taskMenu.hidden;
});
els.clearDoneBtn.addEventListener("click", () => { clearDoneTasks(); closeDropdowns(); });
els.clearAllBtn.addEventListener("click", () => { clearAllTasks(); closeDropdowns(); });

/* ---------- Music ---------- */
els.musicPlayBtn.addEventListener("click", () => {
  state.musicPlaying = !state.musicPlaying;
  updateMusic();
});
els.prevTrackBtn.addEventListener("click", () => { prevTrack(); renderPlaylist(); });
els.nextTrackBtn.addEventListener("click", () => { nextTrack(); renderPlaylist(); });
els.muteBtn.addEventListener("click", () => {
  state.muted = !state.muted;
  els.muteBtn.style.opacity = state.muted ? "0.35" : "1";
  updateMusic();
});
els.volumeSlider.addEventListener("input", updateMusic);
els.playlistBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleDropdown(els.playlistBtn, els.playlistMenu);
  renderPlaylist();
});

/* ---------- Fullscreen / mobile ---------- */
els.fullscreenBtn.addEventListener("click", toggleFullscreen);
els.mobileMenuBtn.addEventListener("click", toggleMobileMenu);

/* ---------- Alarm ---------- */
if (els.alarmVolumeSlider) els.alarmVolumeSlider.value = state.alarmVolume;
if (els.alarmVolumeLabel) els.alarmVolumeLabel.textContent = `${state.alarmVolume}%`;
els.alarmVolumeSlider?.addEventListener("input", (e) => {
  const vol = Number(e.target.value);
  state.alarmVolume = vol;
  els.alarmVolumeLabel.textContent = `${vol}%`;
  localStorage.setItem("pomodoroAlarmVolume", String(vol));
});
els.testAlarmBtn?.addEventListener("click", () => playAlarm());
document.querySelectorAll('input[name="alarm"]').forEach((radio) => {
  radio.addEventListener("change", () => playAlarm());
});

/* ---------- Initial paint ---------- */
if (state.darkMode) document.documentElement.classList.add("dark-mode");
updateDarkModeUI();
if (els.autoDarkMode) els.autoDarkMode.checked = state.autoDarkMode;
if (els.autoPomodoro) els.autoPomodoro.checked = state.autoPomodoro;
if (els.autoBreaks) els.autoBreaks.checked = state.autoBreaks;

buildPresetList();
render();
renderTasks();

// Restore เพลง/volume/mute ที่ค้างไว้จาก sessionStorage ก่อนสลับหน้า index.html <-> adhd.html
if (els.volumeSlider) els.volumeSlider.value = state.volume;
if (state.muted) els.muteBtn.style.opacity = "0.35";
updateMusic();

// ถ้า timer กำลังรันอยู่ตอนโหลดหน้า (ค้างมาจาก sessionStorage ตอนสลับ index.html <-> adhd.html)
// ต้องสร้าง interval ใหม่จริงๆ ไม่งั้น UI จะโชว์ว่ากำลังวิ่งแต่เวลาไม่ลด
if (state.running) {
  toggleTimer(true, toggleDarkMode);
} else if (state.expiredWhileAway) {
  // timer หมดเวลาไปแล้วระหว่างที่สลับหน้า/ปิดแท็บไป ต้อง complete session ย้อนหลังให้ครบ flow
  // (นับรอบ, เล่นเสียง, เปิด Movement/Reward popup, เปลี่ยนโหมดถัดไป) ไม่ใช่แค่โชว์ 00:00 ค้างเฉยๆ
  state.expiredWhileAway = false;
  completeSession();
}

// PWA init
registerServiceWorker();
/* ---------- Tasks panel toggle ---------- */
const tasksToggleBtn = document.getElementById("tasksToggleBtn");
const tasksPane = document.getElementById("tasksPane");
const workspace = document.querySelector(".workspace");
const iconClose = tasksToggleBtn?.querySelector(".tasks-toggle-icon--close");
const iconOpen = tasksToggleBtn?.querySelector(".tasks-toggle-icon--open");

let tasksOpen = true;

tasksToggleBtn?.addEventListener("click", () => {
  tasksOpen = !tasksOpen;
  tasksPane.classList.toggle("collapsed", !tasksOpen);
  workspace.classList.toggle("tasks-collapsed", !tasksOpen);
  document.body.classList.toggle("tasks-collapsed", !tasksOpen);
  if (iconClose) iconClose.style.display = tasksOpen ? "" : "none";
  if (iconOpen) iconOpen.style.display = tasksOpen ? "none" : "";
});