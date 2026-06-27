import { tracks } from "./config.js";
import { state } from "./state.js";
import { getFolderName } from "./utils.js";

let els;
let bgmAudio = null;
let currentBgmFile = null;

export function initAudio(elements) {
  els = elements;
}

// Maps each alarm option to its sound file.
const ALARM_FILES = {
  Hassium: "assets/Alarm/hassium.mp3",
  "Chilled": "assets/Alarm/Chilled.mp3",
  "Radial": "assets/Alarm/Radial.mp3",
  "Morning glory": "assets/Alarm/Morning glory.mp3",
  "Whale calls": "assets/Alarm/Whale calls.mp3"
};

// Cache one Audio object per alarm file so switching alarms doesn't
// leak previous Audio instances.
const alarmAudioCache = {};
let currentlyPlayingAlarm = null;

function stopCurrentAlarm() {
  if (currentlyPlayingAlarm) {
    currentlyPlayingAlarm.pause();
    currentlyPlayingAlarm.currentTime = 0;
  }
}

function playAlarmFile(file) {
  stopCurrentAlarm();

  if (!alarmAudioCache[file]) {
    alarmAudioCache[file] = new Audio(file);
  }
  const audio = alarmAudioCache[file];
  audio.currentTime = 0;
  audio.volume = state.alarmVolume / 100;
  audio.play().catch((e) => console.error("Failed to play alarm sound:", e));
  currentlyPlayingAlarm = audio;
}

export function playAlarm() {
  const alarm = document.querySelector('input[name="alarm"]:checked')?.value;
  if (!alarm || alarm === "None") return;

  const file = ALARM_FILES[alarm];
  if (file) {
    playAlarmFile(file);
    return;
  }

  // Fallback: synthesized beep for any alarm option without an audio file
  stopCurrentAlarm();
  const context = getAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = alarm === "Soft chime" ? 660 : alarm === "School bell" ? 920 : 780;
  gain.gain.value = 0.08 * (state.alarmVolume / 100);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.25);
}

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!state.audio) {
    // สร้างเฉพาะเมื่อจำเป็น (user gesture required anyway)
    state.audio = { context: null, gain: null, oscillator: null };
  }
  if (!state.audio.context) {
    const context = new AudioContext();
    const gain = context.createGain();
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = 196;
    gain.gain.value = 0;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    state.audio = { context, gain, oscillator };
  }
  return state.audio.context;
}

export function updateMusic() {
  const track = tracks[state.selectedTrack];
  const volume = state.muted ? 0 : Number(els.volumeSlider.value) / 100;

  if (!track.file) return;

  if (state.audio && state.audio.gain) {
    state.audio.gain.gain.value = 0;
  }

  if (currentBgmFile !== track.file) {
    if (bgmAudio) bgmAudio.pause();
    bgmAudio = new Audio(track.file);
    bgmAudio.loop = true;
    currentBgmFile = track.file;
  }
  bgmAudio.volume = volume;

  if (state.musicPlaying) {
    bgmAudio.play().catch((e) => console.error("Failed to play local BGM:", e));
  } else {
    bgmAudio.pause();
  }

  els.trackName.textContent = `Background music - ${track.name}`;

  const playIcon = els.musicPlayBtn.querySelector(".play-icon");
  const pauseIcon = els.musicPlayBtn.querySelector(".pause-icon");
  if (playIcon) playIcon.style.display = state.musicPlaying ? "none" : "block";
  if (pauseIcon) pauseIcon.style.display = state.musicPlaying ? "block" : "none";
}

// Moves selectedTrack by `delta` (+1/-1), wrapping within the current track's folder only.
function stepTrackWithinFolder(delta) {
  const folder = getFolderName(tracks[state.selectedTrack].file);
  const folderIndexes = tracks
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => getFolderName(t.file) === folder)
    .map(({ i }) => i);
  const pos = folderIndexes.indexOf(state.selectedTrack);
  state.selectedTrack = folderIndexes[(pos + delta + folderIndexes.length) % folderIndexes.length];
  state.musicPlaying = true;
  updateMusic();
}

export function prevTrack() {
  stepTrackWithinFolder(-1);
}

export function nextTrack() {
  stepTrackWithinFolder(1);
}

export function renderPlaylist() {
  const container = els.playlistFolders;
  if (!container) return;
  container.innerHTML = "";

  const groups = {};
  tracks.forEach((track, index) => {
    const folder = getFolderName(track.file);
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push({ track, index });
  });

  Object.keys(groups).forEach((folder) => {
    const groupTracks = groups[folder];
    const folderItem = document.createElement("div");
    folderItem.className = "folder-item";

    const isExpanded = state.playlistExpandedFolders[folder];

    folderItem.innerHTML = `
      <button class="folder-header ${isExpanded ? "expanded" : ""}" data-folder="${folder}">
        <svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; margin-right: 6px;">
          <path d="M2 6a2 2 0 012-2h5l2 3h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" fill="rgba(47, 104, 223, 0.1)"></path>
        </svg>
        <span>${folder}</span>
        <span class="folder-count">(${groupTracks.length})</span>
        <svg class="folder-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 10px; height: 10px; margin-left: 6px;">
          <polyline points="5,3 11,8 5,13"></polyline>
        </svg>
      </button>
      <div class="folder-tracks" ${isExpanded ? "" : "hidden"}>
        ${groupTracks.map((item) => {
      const isActive = state.selectedTrack === item.index;
      return `
            <button class="playlist-track-btn ${isActive ? "active" : ""}" data-index="${item.index}">
              ${isActive ? `
                <svg viewBox="0 0 24 24" fill="currentColor" style="width: 12px; height: 12px; margin-right: 6px; color: var(--blue-dark); flex: 0 0 auto;">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              ` : ""}
              <span>${item.track.name}</span>
            </button>
          `;
    }).join("")}
      </div>
    `;

    folderItem.querySelector(".folder-header").addEventListener("click", () => {
      state.playlistExpandedFolders[folder] = !state.playlistExpandedFolders[folder];
      renderPlaylist();
    });

    folderItem.querySelectorAll(".playlist-track-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.index, 10);
        state.selectedTrack = index;
        state.musicPlaying = true;
        updateMusic();
        closeDropdownsRef?.();
      });
    });

    container.appendChild(folderItem);
  });
}

// Injected from ui.js to avoid a circular import
let closeDropdownsRef = null;
export function setAudioRefs({ closeDropdowns }) {
  closeDropdownsRef = closeDropdowns;
}