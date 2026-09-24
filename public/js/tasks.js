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
    <input type="checkbox" class="task-check" ${task.done ? "checked" : ""} aria-label="Complete ${escapeHtml(task.title)}">
    <span class="task-title" title="Double-click to edit">${escapeHtml(task.title)}</span>
    <input type="text" class="task-edit-input" value="${escapeHtml(task.title)}" maxlength="200" aria-label="Edit task title">
    <div class="task-actions">
      <button type="button" class="task-icon-btn edit-task" aria-label="Edit task" title="Edit task">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      </button>
      <button type="button" class="task-icon-btn delete-task" aria-label="Delete task" title="Delete task">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <button type="button" class="task-icon-btn save-task" aria-label="Save changes" title="Save">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
      <button type="button" class="task-icon-btn cancel-task" aria-label="Cancel editing" title="Cancel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;

  const checkbox = item.querySelector(".task-check");
  const titleSpan = item.querySelector(".task-title");
  const editInput = item.querySelector(".task-edit-input");
  const editBtn = item.querySelector(".edit-task");
  const deleteBtn = item.querySelector(".delete-task");
  const saveBtn = item.querySelector(".save-task");
  const cancelBtn = item.querySelector(".cancel-task");

  checkbox.addEventListener("change", () => {
    task.done = checkbox.checked;
    item.classList.toggle("done", task.done);
    if (task.done) {
      item.classList.remove("just-completed");
      void item.offsetWidth;
      item.classList.add("just-completed");
      setTimeout(() => item.classList.remove("just-completed"), 500);
    }
    saveTasks();
    els.taskCount.textContent = state.tasks.filter((t) => !t.done).length;
  });

  function startEdit() {
    // Close other task items currently in edit mode
    els.taskList.querySelectorAll(".task-item.editing").forEach((otherItem) => {
      if (otherItem !== item) {
        otherItem.classList.remove("editing");
      }
    });

    item.classList.add("editing");
    editInput.value = task.title;
    editInput.focus();
    editInput.select();
  }

  function cancelEdit() {
    item.classList.remove("editing");
    editInput.value = task.title;
  }

  function saveEdit() {
    const newTitle = editInput.value.trim();
    if (newTitle && newTitle !== task.title) {
      task.title = newTitle;
      titleSpan.textContent = newTitle;
      checkbox.setAttribute("aria-label", `Complete ${newTitle}`);
      saveTasks();
    } else {
      editInput.value = task.title;
    }
    item.classList.remove("editing");
  }

  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startEdit();
  });

  titleSpan.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    startEdit();
  });

  saveBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    saveEdit();
  });

  saveBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    saveEdit();
  });

  cancelBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    cancelEdit();
  });

  cancelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    cancelEdit();
  });

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  });

  editInput.addEventListener("blur", () => {
    if (item.classList.contains("editing")) {
      saveEdit();
    }
  });

  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    state.tasks = state.tasks.filter((candidate) => candidate.id !== task.id);
    saveTasks();
    renderTasks();
  });

  return item;
}

export function renderTasks() {
  const existingIds = new Set(
    [...els.taskList.querySelectorAll(".task-item")].map((el) => el.dataset.id)
  );
  const currentIds = new Set(state.tasks.map((t) => t.id));

  // ลบ element ที่หายไปแล้ว
  existingIds.forEach((id) => {
    if (!currentIds.has(id)) els.taskList.querySelector(`[data-id="${id}"]`)?.remove();
  });

  // เพิ่มหรืออัปเดต
  state.tasks.forEach((task) => {
    let item = els.taskList.querySelector(`[data-id="${task.id}"]`);
    if (!item) {
      item = createTaskElement(task);
      els.taskList.appendChild(item);
    } else {
      // อัปเดตเฉพาะ class และ properties ที่เปลี่ยน
      item.classList.toggle("done", task.done);
      const checkbox = item.querySelector(".task-check");
      if (checkbox) checkbox.checked = task.done;
      if (!item.classList.contains("editing")) {
        const titleSpan = item.querySelector(".task-title");
        if (titleSpan && titleSpan.textContent !== task.title) {
          titleSpan.textContent = task.title;
        }
        const editInput = item.querySelector(".task-edit-input");
        if (editInput && editInput.value !== task.title) {
          editInput.value = task.title;
        }
      }
    }
  });

  els.taskCount.textContent = state.tasks.filter((t) => !t.done).length;
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