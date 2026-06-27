export const presets = {
  baby: { label: "Beginner", pomodoro: 10, rest: 5, long: 10 },
  popular: { label: "Standard", pomodoro: 20, rest: 5, long: 15 },
  medium: { label: "Medium", pomodoro: 40, rest: 8, long: 20 },
  extended: { label: "Expert", pomodoro: 60, rest: 10, long: 25 },
  custom: { label: "Custom", pomodoro: 15, rest: 8, long: 10 }
};

// load saved custom preset กลับมา
const savedCustom = JSON.parse(localStorage.getItem("pomodoroCustomPreset") || "null");
if (savedCustom) Object.assign(presets.custom, savedCustom);

export const tracks = [
  { name: "Lofi", file: "assets/BGM/Lofi/Lofi.mp3" },
  { name: "Calm Rain Lofi [3 Hr]", file: "assets/BGM/Lofi/Calm Rain Lofi [3 Hr].mp3" },
  { name: "Dreamy Rain Lofi [3 Hr]", file: "assets/BGM/Lofi/Dreamy Rain Lofi [3 Hr].mp3" },
  { name: "Ambient [Sea]", file: "assets/BGM/Ambient/Ambient [Sea].mp3" },
  { name: "Ambient [Forest]", file: "assets/BGM/Ambient/Ambient [Forest].mp3" },
  { name: "Ambient [Space]", file: "assets/BGM/Ambient/Ambient [Space].mp3" },
  { name: "Jazz Bar", file: "assets/BGM/Jazz/Jazz Bar.mp3" },
  { name: "Jazz Noir [1 Hr]", file: "assets/BGM/Jazz/Jazz Noir.mp3" },
  { name: "Retro Jazz [3 Hr]", file: "assets/BGM/Jazz/Retro Jazz.mp3" },
];

export function queryEls() {
  return {
    customizeBtn: document.getElementById("customizeBtn"),
    customizer: document.getElementById("customizer"),
    modeTabs: document.querySelectorAll(".mode-tab"),
    timeDisplay: document.getElementById("timeDisplay"),
    levelName: document.getElementById("levelName"),
    timerCircle: document.getElementById("timerCircle"),
    startBtn: document.getElementById("startBtn"),
    runningControls: document.getElementById("runningControls"),
    pauseBtn: document.getElementById("pauseBtn"),
    finishBtn: document.getElementById("finishBtn"),
    presetList: document.getElementById("presetList"),
    customPomodoro: document.getElementById("customPomodoro"),
    customRest: document.getElementById("customRest"),
    customLong: document.getElementById("customLong"),
    customPomodoroLabel: document.getElementById("customPomodoroLabel"),
    customRestLabel: document.getElementById("customRestLabel"),
    customLongLabel: document.getElementById("customLongLabel"),

    taskForm: document.getElementById("taskForm"),
    taskInput: document.getElementById("taskInput"),
    taskFormActions: document.getElementById("taskFormActions"),
    taskCancelBtn: document.getElementById("taskCancelBtn"),
    taskList: document.getElementById("taskList"),
    taskCount: document.getElementById("taskCount"),
    tasksMenuBtn: document.getElementById("tasksMenuBtn"),
    taskMenu: document.getElementById("taskMenu"),
    clearDoneBtn: document.getElementById("clearDoneBtn"),
    clearAllBtn: document.getElementById("clearAllBtn"),

    skipBreakBtn: document.getElementById("skipBreakBtn"),
    skipLongBreakBtn: document.getElementById("skipLongBreakBtn"),
    autoPomodoro: document.getElementById("autoPomodoro"),
    autoBreaks: document.getElementById("autoBreaks"),

    darkModeBtn: document.getElementById("darkModeBtn"),
    autoDarkMode: document.getElementById("autoDarkMode"),

    alarmVolumeSlider: document.getElementById("alarmVolumeSlider"),
    alarmVolumeLabel: document.getElementById("alarmVolumeLabel"),
    testAlarmBtn: document.getElementById("testAlarmBtn"),

    musicPlayBtn: document.getElementById("musicPlayBtn"),
    prevTrackBtn: document.getElementById("prevTrackBtn"),
    nextTrackBtn: document.getElementById("nextTrackBtn"),
    muteBtn: document.getElementById("muteBtn"),
    volumeSlider: document.getElementById("volumeSlider"),
    trackName: document.getElementById("trackName"),
    playlistBtn: document.getElementById("playlistBtn"),
    playlistMenu: document.getElementById("playlistMenu"),
    playlistFolders: document.getElementById("playlistFolders"),

    yesBtn: document.getElementById("yesBtn"),
    noBtn: document.getElementById("noBtn"),
    submitRatingBtn: document.getElementById("submitRatingBtn"),
    okBtn: document.getElementById("okBtn"),
    modal_container: document.getElementById('modal_container'),
    rating_container: document.getElementById('rating_container'),
    success_container: document.getElementById('success_container'),
    starRating: document.getElementById('starRating'),
    stars: document.querySelectorAll('.star'),

    fullscreenBtn: document.getElementById("fullscreenBtn"),
    mobileMenuBtn: document.getElementById("mobileMenuBtn"),
    topActions: document.querySelector(".top-actions"),
  };
}