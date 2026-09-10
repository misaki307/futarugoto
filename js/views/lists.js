import { store } from "../store.js";
import { escapeHtml, compressImageFile, showToast, illustration } from "../util.js";

const catVar = (listId) => `var(--cat-${listId})`;
const catBgVar = (listId) => `var(--cat-${listId}-bg)`;

function formatAddedDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} 追加`;
}

export function mount(root) {
  let activeListId = null;
  let pendingPhoto = null;

  root.innerHTML = `
    <section class="screen-hero">
      <h1 class="screen-hero__title">LIST</h1>
      <p class="screen-hero__subtitle">ふたりでやりたいこと、集めよう。</p>
    </section>

    <div class="list-tabs" id="list-tabs"></div>
    <div class="list-stats" id="list-stats"></div>

    <div class="place-grid" id="list-items"></div>

    <div class="add-panel" id="add-panel" hidden>
      <input class="input" id="item-input" placeholder="タイトルを入力" maxlength="60" />
      <div class="composer__row">
        <button class="composer__photo-btn" id="item-photo-btn" aria-label="写真を追加">📷</button>
        <input type="file" accept="image/*" id="item-photo-input" hidden />
        <button class="btn btn-primary" id="item-submit">追加する</button>
      </div>
      <div class="composer__preview" id="item-preview">
        <img id="item-preview-img" alt="" />
        <button class="composer__preview-remove" id="item-preview-remove" aria-label="写真を外す">✕</button>
      </div>
    </div>
    <button class="btn btn-primary btn-block" id="add-toggle">＋ 新しい場所を追加</button>
  `;

  const tabsEl = root.querySelector("#list-tabs");
  const statsEl = root.querySelector("#list-stats");
  const itemsEl = root.querySelector("#list-items");
  const addToggle = root.querySelector("#add-toggle");
  const addPanel = root.querySelector("#add-panel");
  const input = root.querySelector("#item-input");
  const submitBtn = root.querySelector("#item-submit");
  const photoBtn = root.querySelector("#item-photo-btn");
  const photoInput = root.querySelector("#item-photo-input");
  const preview = root.querySelector("#item-preview");
  const previewImg = root.querySelector("#item-preview-img");
  const previewRemove = root.querySelector("#item-preview-remove");

  function renderTabs(lists) {
    tabsEl.innerHTML = lists
      .map(
        (list) => `
      <button class="list-tab ${list.id === activeListId ? "is-active" : ""}" data-id="${list.id}" style="--tab-color:${catVar(list.id)}">
        ${illustration(list.icon, list.emoji, { className: "illust--sm" })} ${escapeHtml(list.name)}
      </button>`
      )
      .join("");
  }

  function renderItems(lists) {
    const active = lists.find((l) => l.id === activeListId) || lists[0];
    statsEl.textContent = active ? `${active.name}のリスト・${active.items.length}件` : "";
    if (!active) {
      itemsEl.innerHTML = "";
      return;
    }
    if (active.items.length === 0) {
      itemsEl.innerHTML = `<div class="empty-illust">
        ${illustration("assets/characters/cat.png", "🐱", { className: "illust--lg" })}
        まだ何もありません。<br>下のボタンから追加してみよう。
      </div>`;
      return;
    }
    itemsEl.innerHTML = active.items
      .map(
        (item) => `
      <div class="place-card ${item.done ? "is-done" : ""}" data-id="${item.id}" data-list="${active.id}">
        <div class="place-card__media">
          ${item.photo ? `<img src="${item.photo}" alt="" />` : illustration(active.icon, active.emoji, { className: "illust--lg" })}
          <button class="place-card__fav ${item.favorite ? "is-active" : ""}" data-action="favorite">${item.favorite ? "★" : "☆"}</button>
        </div>
        <div class="place-card__body">
          <div class="place-card__title">${escapeHtml(item.text)}</div>
          <span class="place-card__tag" style="--stub-color:${catVar(active.id)};--stub-bg:${catBgVar(active.id)}">${escapeHtml(active.tagLabel)}</span>
          <div class="place-card__date">${formatAddedDate(item.createdAt)}</div>
        </div>
        <button class="place-card__done" data-action="toggle">${item.done ? "✓" : ""}</button>
      </div>`
      )
      .join("");
  }

  function render(lists) {
    if (!activeListId || !lists.some((l) => l.id === activeListId)) {
      activeListId = lists[0]?.id ?? null;
    }
    renderTabs(lists);
    renderItems(lists);
  }

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".list-tab");
    if (!btn) return;
    activeListId = btn.dataset.id;
    render(store.getLists());
  });

  addToggle.addEventListener("click", () => {
    addPanel.hidden = !addPanel.hidden;
    if (!addPanel.hidden) input.focus();
  });

  function clearPhoto() {
    pendingPhoto = null;
    photoInput.value = "";
    preview.classList.remove("is-visible");
    previewImg.src = "";
  }
  photoBtn.addEventListener("click", () => photoInput.click());
  photoInput.addEventListener("change", async () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    try {
      pendingPhoto = await compressImageFile(file);
      previewImg.src = pendingPhoto;
      preview.classList.add("is-visible");
    } catch {
      showToast("写真の読み込みに失敗しました");
    }
  });
  previewRemove.addEventListener("click", clearPhoto);

  async function addItem() {
    if (!input.value.trim() || !activeListId) return;
    submitBtn.disabled = true;
    try {
      await store.addItem(activeListId, input.value, pendingPhoto);
    } catch {
      showToast("追加に失敗しました。写真が大きすぎるかもしれません");
      submitBtn.disabled = false;
      return;
    }
    submitBtn.disabled = false;
    input.value = "";
    clearPhoto();
    addPanel.hidden = true;
  }
  submitBtn.addEventListener("click", addItem);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addItem();
  });

  itemsEl.addEventListener("click", (e) => {
    const cell = e.target.closest(".place-card");
    if (!cell) return;
    const { id, list } = cell.dataset;
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "toggle") {
      store.toggleItem(list, id);
    } else if (action === "favorite") {
      store.toggleFavorite(list, id);
    }
  });

  const unsubscribe = store.subscribeLists(render);
  return () => unsubscribe();
}
