import { presets } from "./config.js";
import { state } from "./state.js";
import { formatTime } from "./utils.js";

let els;
const isAdhdPage = document.body.classList.contains("page-adhd");

export function initRender(elements) {
  els = elements;
}

const MODE_COLORS = {
  light: {
    pomodoro: { border: "#dce8ff", bg: "#f8fbff" },
    rest: { border: "#d9f3e7", bg: "#f7fffb" },
    long: { border: "#f1e3ff", bg: "#fcf8ff" }
  },
  dark: {
    pomodoro: { border: "#1e3a8a", bg: "#172554" },
    rest: { border: "#064e3b", bg: "#022c22" },
    long: { border: "#581c87", bg: "#3b0764" }
  }
};

function durationFor(mode = state.mode) {
  const preset = presets[state.preset];
  if (mode === "pomodoro") return preset.pomodoro * 60;
  if (mode === "rest") return preset.rest * 60;
  return preset.long * 60;
}

function updateHourglassProgress() {
  if (!isAdhdPage || !els.timerCircle) return;

  const total = Math.max(1, durationFor(state.mode));
  const elapsed = Math.max(0, Math.min(total, total - state.remaining));
  const progress = elapsed / total;
  const topSand = 74 - (progress * 60);
  const bottomSand = 24 + (progress * 58);

  els.timerCircle.style.setProperty("--sand-top", `${topSand}%`);
  els.timerCircle.style.setProperty("--sand-bottom", `${bottomSand}%`);
}

// Renders only the timer-related UI. This runs every second while the
// timer is counting down, so it must stay cheap and must NOT touch the
// task list — task rendering is handled separately by tasks.js whenever
// the task data actually changes (see renderTasks()).
export function render() {
  els.timeDisplay.textContent = formatTime(state.remaining);
  els.levelName.textContent = presets[state.preset].label;

  // New split-button UI: show startBtn when idle, show runningControls when running
  if (els.runningControls) {
    els.startBtn.hidden = state.running;
    els.runningControls.hidden = !state.running;
  } else {
    // Fallback for pages that still use the single start button
    els.startBtn.textContent = state.running ? "Pause" : "Start";
    els.startBtn.classList.toggle("is-running", state.running);
  }

  els.timerCircle.classList.toggle("is-running", state.running);
  els.timerCircle.classList.toggle("mode-pomodoro", state.mode === "pomodoro");
  els.timerCircle.classList.toggle("mode-rest", state.mode === "rest");
  els.timerCircle.classList.toggle("mode-long", state.mode === "long");
  updateHourglassProgress();

  if (!isAdhdPage) {
    const palette = MODE_COLORS[state.darkMode ? "dark" : "light"][state.mode];
    els.timerCircle.style.borderColor = palette.border;
    els.timerCircle.style.background = palette.bg;
  }
}