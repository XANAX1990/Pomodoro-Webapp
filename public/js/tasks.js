import { state, saveTasks } from "./state.js";
import { escapeHtml } from "./utils.js";

let els;

export function initTasks(elements) {
  els = elements;
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.done ? " done" : ""}`;
  item.dataset.id = task.id;
  if (task.isNew) {
    item.classList.add("new-task");
    delete task.isNew;
  }
  item.innerHTML = `
    <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Complete ${escapeHtml(task.title)}">
    <span class="task-title">${escapeHtml(task.title)}</span>
    <button class="delete-task" aria-label="Delete task">×</button>
  `;
  item.querySelector("input").addEventListener("change", () => {
    task.done = !task.done;
    if (task.done) task.justCompleted = true;
    saveTasks();
    renderTasks();
  });
  item.querySelector(".delete-task").addEventListener("click", () => {
    state.tasks = state.tasks.filter((candidate) => candidate.id !== task.id);
    saveTasks();
    renderTasks();
  });
  return item;
}

export function renderTasks() {
  const existingIds = new Set(
    [...els.taskList.querySelectorAll(".task-item")].map(el => el.dataset.id)
  );
  const currentIds = new Set(state.tasks.map(t => t.id));

  // ลบ element ที่หายไปแล้ว
  existingIds.forEach(id => {
    if (!currentIds.has(id)) els.taskList.querySelector(`[data-id="${id}"]`)?.remove();
  });

  // เพิ่มหรืออัปเดต
  state.tasks.forEach((task, index) => {
    let item = els.taskList.querySelector(`[data-id="${task.id}"]`);
    if (!item) {
      item = createTaskElement(task);
      els.taskList.appendChild(item);
    } else {
      // อัปเดตเฉพาะ class ที่เปลี่ยน
      item.classList.toggle("done", task.done);
      item.querySelector("input").checked = task.done;
    }
  });

  els.taskCount.textContent = state.tasks.filter(t => !t.done).length;
}

export function addTask(title) {
  const taskId = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : (String(Date.now()) + Math.random().toString(36).slice(2));
  state.tasks.push({ id: taskId, title, done: false, isNew: true });
  saveTasks();
  renderTasks();
}

export function clearDoneTasks() {
  state.tasks = state.tasks.filter((task) => !task.done);
  saveTasks();
  renderTasks();
}

export function clearAllTasks() {
  state.tasks = [];
  saveTasks();
  renderTasks();
}