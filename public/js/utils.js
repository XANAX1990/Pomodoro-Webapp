export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.max(0, totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function escapeHtml(value) {
  const str = value == null ? "" : String(value);
  return str.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

export function getFolderName(file) {
  if (!file) return "Synthesized";
  const parts = file.split("/");
  if (parts.length > 2) return parts[2];
  return "Other";
}