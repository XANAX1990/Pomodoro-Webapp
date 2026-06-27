import { presets } from "./config.js";
import { state } from "./state.js";
import { formatTime } from "./utils.js";

let els;
let onTickRender; // callback into render.js, injected to avoid circular import

export function initTimer(elements, renderCallback) {
  els = elements;
  onTickRender = renderCallback;
}

export function durationFor(mode = state.mode) {
  const preset = presets[state.preset];
  if (mode === "pomodoro") return preset.pomodoro * 60;
  if (mode === "rest") return preset.rest * 60;
  return preset.long * 60;
}

export function setMode(mode, reset = true) {
  state.mode = mode;
  if (reset) state.remaining = durationFor(mode);
  els.modeTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  onTickRender();
}

function tick() {
  state.remaining -= 1;

  // Milestone: ทุก 5 นาที ระหว่าง Pomodoro
  if (state.mode === "pomodoro" && state.running) {
    const total   = durationFor("pomodoro");
    const elapsed = total - state.remaining;
    if (elapsed > 0 && elapsed % 300 === 0) {
      onMilestoneRef?.(elapsed / 60); // ส่งจำนวนนาทีที่ผ่านไป
    }
  }

  if (state.remaining <= 0) {
    completeSession();
    return;
  }
  onTickRender();
}

export function toggleTimer(force, toggleDarkMode) {
  const shouldRun = typeof force === "boolean" ? force : !state.running;
  state.running = shouldRun;
  clearInterval(state.timerId);

  if (state.running) {
    // บันทึกเวลาจริงที่เริ่ม
    state.startedAt = Date.now();
    state.remainingAtStart = state.remaining;

    state.timerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
      state.remaining = Math.max(0, state.remainingAtStart - elapsed);
      if (state.remaining <= 0) {
        completeSession();
        return;
      }
      onTickRender();
    }, 500); // poll ทุก 500ms เพื่อให้แม่นขึ้น
  }
  onTickRender();
}

function completeSession() {
  clearInterval(state.timerId);
  state.running = false;
  state.counts[state.mode] += 1;
  playAlarmRef?.();

  if (state.mode === "pomodoro") {
    const nextMode = state.counts.pomodoro % 4 === 0 ? "long" : "rest";
    onPomodoroCompleteRef?.(state.counts.pomodoro);
    setMode(nextMode);
    if (state.autoBreaks) toggleTimer(true, toggleDarkModeRef);
  } else {
    if (state.mode === "long") {
      onLongCompleteRef?.();
    }
    setMode("pomodoro");
    if (state.autoPomodoro) toggleTimer(true, toggleDarkModeRef);
  }
}

// References injected from main.js to avoid circular imports with audio/darkmode modules
let playAlarmRef = null;
let toggleDarkModeRef = null;
let onLongCompleteRef = null;
let onPomodoroCompleteRef = null;
let onMilestoneRef = null;
export function setTimerRefs({ playAlarm, toggleDarkMode, onLongComplete, onPomodoroComplete, onMilestone }) {
  playAlarmRef          = playAlarm;
  toggleDarkModeRef     = toggleDarkMode;
  onLongCompleteRef     = onLongComplete;
  onPomodoroCompleteRef = onPomodoroComplete;
  onMilestoneRef        = onMilestone;
}

// Stops the timer then switches mode — used by mode tabs and skip buttons
export function switchModeManually(mode) {
  toggleTimer(false, toggleDarkModeRef);
  setMode(mode);
}

export function resetSession() {
  clearInterval(state.timerId);
  state.running = false;
  if (state.autoDarkTimeoutId) {
    clearTimeout(state.autoDarkTimeoutId);
    state.autoDarkTimeoutId = null;
  }
  state.counts = { pomodoro: 0, rest: 0, long: 0 };
  setMode("pomodoro");
}

export function buildPresetList() {
  els.presetList.innerHTML = "";
  Object.entries(presets).forEach(([key, preset]) => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="radio" name="preset" value="${key}" ${state.preset === key ? "checked" : ""}>
      <span><strong>${preset.label}</strong><small>${preset.pomodoro} min &bull; ${preset.rest} min &bull; ${preset.long} min</small></span>
    `;
    els.presetList.append(label);
  });
  updateCustomSliders();
}

export function updatePreset(key) {
  // หยุด timer ก่อนถ้ากำลังเดิน
  if (state.running) {
    toggleTimer(false, toggleDarkModeRef);
  }
  state.preset = key;
  const custom = key === "custom";
  [els.customPomodoro, els.customRest, els.customLong].forEach((slider) => {
    slider.disabled = !custom;
  });
  state.remaining = durationFor();
  buildPresetList();
  onTickRender();
}

export function updateCustomSliders() {
  els.customPomodoro.value = presets.custom.pomodoro;
  els.customRest.value = presets.custom.rest;
  els.customLong.value = presets.custom.long;
  els.customPomodoro.disabled = state.preset !== "custom";
  els.customRest.disabled = state.preset !== "custom";
  els.customLong.disabled = state.preset !== "custom";
  els.customPomodoroLabel.textContent = `${presets.custom.pomodoro} min`;
  els.customRestLabel.textContent = `${presets.custom.rest} min`;
  els.customLongLabel.textContent = `${presets.custom.long} min`;
}

export function updateCustomValue(name, value) {
  presets.custom[name] = Number(value);
  localStorage.setItem("pomodoroCustomPreset", JSON.stringify(presets.custom)); // persist
  updateCustomSliders();
  if (state.preset === "custom") {
    state.remaining = durationFor();
    buildPresetList();
    onTickRender();
  }
}

export { formatTime };