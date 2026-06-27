let els;

export function initUI(elements) {
  els = elements;
}

export function openCustomizerPanel(name = "home") {
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== name;
  });
}

export function toggleDropdown(button, dropdown) {
  if (dropdown === els.playlistMenu) {
    const willOpen = !dropdown.classList.contains("open");
    closeDropdowns();
    if (willOpen) dropdown.classList.add("open");
    if (button) button.setAttribute("aria-expanded", String(willOpen));
    return;
  }
  const willOpen = dropdown.hidden;
  closeDropdowns();
  dropdown.hidden = !willOpen;
  if (button) button.setAttribute("aria-expanded", String(willOpen));
}

export function closeDropdowns() {
  if (els.customizer) els.customizer.hidden = true;
  if (els.taskMenu) els.taskMenu.hidden = true;
  if (els.playlistMenu) els.playlistMenu.classList.remove("open");
  if (els.customizeBtn) els.customizeBtn.setAttribute("aria-expanded", "false");
  if (els.playlistBtn) els.playlistBtn.setAttribute("aria-expanded", "false");
}

export function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

export function toggleMobileMenu() {
  els.topActions.classList.toggle("open");
}