import { state } from "./state.js";

let els;
let onAfterToggle; // render callback

export function initDarkMode(elements, renderCallback) {
  els = elements;
  onAfterToggle = renderCallback;
}

export function toggleDarkMode(force) {
  const isDark = typeof force === "boolean" ? force : !document.documentElement.classList.contains("dark-mode");
  document.documentElement.classList.toggle("dark-mode", isDark);
  state.darkMode = isDark;
  localStorage.setItem("pomodoroDarkMode", String(isDark));
  updateDarkModeUI();
  onAfterToggle();
}

export function updateDarkModeUI() {
  const isDark = document.documentElement.classList.contains("dark-mode");
  const btn = els.darkModeBtn;
  if (!btn) return;

  if (isDark) {
    btn.innerHTML = `
      <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.46 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
      </svg>
      <span>Light Mode</span>
    `;
  } else {
    btn.innerHTML = `
      <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
      <span>Dark Mode</span>
    `;
  }
}
