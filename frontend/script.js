const BACKEND_URL = "https://leetcode-question-tracker.onrender.com";

const form = document.getElementById("questionForm");
const questionNumberInput = document.getElementById("questionNumber");
const titleInput = document.getElementById("title");
const codeInput = document.getElementById("code");
const statusInput = document.getElementById("status");
const tagInput = document.getElementById("tag");
const submitBtn = document.getElementById("submitBtn");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const questionListEl = document.getElementById("questionList");

let editingId = null;

function setLoading(isLoading) {
  loadingEl.textContent = isLoading ? "Loading..." : "";
}

function setError(message) {
  errorEl.textContent = message || "";
}

function resetForm() {
  form.reset();
  editingId = null;
  submitBtn.textContent = "Create";
}

function getFormData() {
  return {
    questionNumber: Number(questionNumberInput.value),
    title: titleInput.value.trim(),
    code: codeInput.value,
    status: statusInput.value,
    tag: tagInput.value.trim(),
    date: new Date().toISOString(),
  };
}

function fillForm(item) {
  questionNumberInput.value = item.questionNumber;
  titleInput.value = item.title;
  codeInput.value = item.code;
  statusInput.value = item.status;
  tagInput.value = item.tag;
  editingId = item.id;
  submitBtn.textContent = "Update";
}

function renderItems(items) {
  questionListEl.innerHTML = "";

  if (items.length === 0) {
    questionListEl.textContent = "No questions yet.";
    return;
  }

  items.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "item";

    const title = document.createElement("h3");
    title.textContent = `${item.questionNumber}. ${item.title}`;

    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = `Status: ${item.status} | Tag: ${item.tag}`;

    const actions = document.createElement("div");
    actions.className = "inline-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "secondary";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => fillForm(item));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      await deleteItem(item.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    wrapper.appendChild(title);
    wrapper.appendChild(meta);
    wrapper.appendChild(actions);
    questionListEl.appendChild(wrapper);
  });
}

async function loadItems() {
  setLoading(true);
  setError("");

  try {
    const response = await fetch(`${BACKEND_URL}/items`);
    if (!response.ok) {
      throw new Error("Failed to load items");
    }

    const items = await response.json();
    renderItems(items);
  } catch (error) {
    setError(error.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
}

async function createItem(payload) {
  const response = await fetch(`${BACKEND_URL}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create item");
  }

  return response.json();
}

async function updateItem(id, payload) {
  const response = await fetch(`${BACKEND_URL}/items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to update item");
  }

  return response.json();
}

async function deleteItem(id) {
  setLoading(true);
  setError("");

  try {
    const response = await fetch(`${BACKEND_URL}/items/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete item");
    }

    await loadItems();
  } catch (error) {
    setError(error.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoading(true);
  setError("");

  try {
    const payload = getFormData();

    if (editingId) {
      await updateItem(editingId, payload);
    } else {
      await createItem(payload);
    }

    resetForm();
    await loadItems();
  } catch (error) {
    setError(error.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
});

loadItems();
