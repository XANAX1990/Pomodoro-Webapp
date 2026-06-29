import { app } from "../firebase-config.js";
import { queryEls } from "./config.js";
import { state } from "./state.js";
import {
  initTimer, setTimerRefs, switchModeManually, toggleTimer, resetSession,
  buildPresetList, updatePreset, updateCustomValue
} from "./timer.js";
import { initDarkMode, toggleDarkMode, updateDarkModeUI } from "./darkmode.js";
import { initTasks, addTask, clearDoneTasks, clearAllTasks, renderTasks } from "./tasks.js";
import {
  initAudio, setAudioRefs, playAlarm, updateMusic,
  prevTrack, nextTrack, renderPlaylist
} from "./audio.js";
import {
  initUI, openCustomizerPanel, toggleDropdown, closeDropdowns,
  toggleFullscreen, toggleMobileMenu
} from "./ui.js";
import { initRender, render } from "./render.js";
import { initRating, setFabOpen } from "./rating.js";
import { initMovement, showMovementPopup, setMovementRefs } from "./movement.js";
import { initReward, showRewardPopup } from "./reward.js";
import { showMilestoneToast } from "./milestone.js";
import { registerServiceWorker, requestNotificationPermission, sendTimerNotification } from "./pwa.js";

console.log("เชื่อมต่อสำเร็จโดยใช้ข้อมูลจาก firebase-config.js");

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
  },
  onPomodoroComplete: (count) => {
    sendTimerNotification("pomodoro");
    showMovementPopup();
    if (count % 4 === 0) pendingReward = true;
  },
  onMilestone: (minutesElapsed) => {
    showMilestoneToast(minutesElapsed);
  },
});
initDarkMode(els, render);
initTasks(els);
initAudio(els);
setAudioRefs({ closeDropdowns });
initUI(els);
initRender(els);
initRating(els);
initMovement();
initReward();

// Movement → Reward chain
let pendingReward = false;
setMovementRefs({
  onMovementDone: () => {
    if (pendingReward) {
      pendingReward = false;
      setTimeout(() => showRewardPopup(), 400);
    }
  },
});

/* ---------- Global click-outside ---------- */
document.addEventListener("click", (event) => {
  if (!event.target.closest(".dropdown, .top-actions, .task-menu, .more-btn")) {
    if (els.customizer) els.customizer.hidden = true;
    if (els.taskMenu) els.taskMenu.hidden = true;
    if (els.customizeBtn) els.customizeBtn.setAttribute("aria-expanded", "false");
  }
  if (!event.target.closest("#taskForm") && els.taskFormActions) {
    els.taskFormActions.hidden = true;
  }
  if (event.target.classList.contains("modal-container")) {
    event.target.classList.remove("show");
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
els.startBtn.addEventListener("click", () => toggleTimer(undefined, toggleDarkMode));
els.pauseBtn?.addEventListener("click", () => toggleTimer(false, toggleDarkMode));
els.finishBtn?.addEventListener("click", () => {
  toggleTimer(false, toggleDarkMode);
  els.modal_container?.classList.add("show");
});
if (els.restartBtn) els.restartBtn.addEventListener("click", resetSession);
els.modeTabs.forEach((tab) => tab.addEventListener("click", () => switchModeManually(tab.dataset.mode)));
els.skipBreakBtn.addEventListener("click", () => switchModeManually("rest"));
els.skipLongBreakBtn.addEventListener("click", () => switchModeManually("long"));

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
els.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = els.taskInput.value.trim();
  if (!title) {
    if (els.taskFormActions) els.taskFormActions.hidden = true;
    return;
  }
  addTask(title);
  els.taskInput.value = "";
  if (els.taskFormActions) els.taskFormActions.hidden = true;
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
updateMusic();

// PWA init
registerServiceWorker();
requestNotificationPermission();
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
  if (iconClose) iconClose.style.display = tasksOpen ? "" : "none";
  if (iconOpen) iconOpen.style.display = tasksOpen ? "none" : "";
});