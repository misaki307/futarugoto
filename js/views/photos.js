import { store } from "../store.js";
import { compressImageFile, showToast, toDateKey, illustration } from "../util.js";

export function mount(root) {
  let filter = "all";
  let pendingPhoto = null;
  let openPhotoId = null;

  root.innerHTML = `
    <section class="screen-hero screen-hero--row">
      <div>
        <h1 class="screen-hero__title">PHOTOS</h1>
        <p class="screen-hero__subtitle">
          ${illustration("assets/icons/camera.png", "📷", { className: "illust--sm" })}
          ふたりの思い出を、ずっと。
        </p>
      </div>
      <button class="hero-action-btn" id="photo-add-toggle">＋ 写真を追加</button>
    </section>

    <div class="add-panel" id="photo-add-panel" hidden>
      <input type="file" accept="image/*" id="photo-add-input" hidden />
      <button class="btn btn-ghost btn-block" id="photo-pick-btn" type="button">📷 写真を選ぶ</button>
      <div class="composer__preview" id="photo-add-preview">
        <img id="photo-add-preview-img" alt="" />
        <button class="composer__preview-remove" id="photo-add-preview-remove" type="button" aria-label="写真を外す">✕</button>
      </div>
      <input class="input" id="photo-add-caption" placeholder="キャプション(任意)" maxlength="60" />
      <input class="input" type="date" id="photo-add-date" />
      <button class="btn btn-primary btn-block" id="photo-add-submit" type="button">追加する</button>
    </div>

    <div class="segmented" id="photo-filters">
      <button class="segmented__item is-active" data-filter="all">すべて</button>
      <button class="segmented__item" data-filter="favorite">お気に入り</button>
      <button class="segmented__item" data-filter="album">アルバム</button>
    </div>
    <div id="photo-content"></div>

    <div class="lightbox" id="lightbox">
      <div class="lightbox__inner">
        <img id="lightbox-img" alt="" />
        <div class="lightbox__caption" id="lightbox-caption"></div>
        <div style="display:flex; gap:8px; justify-content:center; margin-top:12px;">
          <button class="lightbox__close" id="lightbox-close">閉じる</button>
          <button class="lightbox__close" id="lightbox-delete" hidden>削除</button>
        </div>
      </div>
    </div>
  `;

  const addToggle = root.querySelector("#photo-add-toggle");
  const addPanel = root.querySelector("#photo-add-panel");
  const photoInput = root.querySelector("#photo-add-input");
  const pickBtn = root.querySelector("#photo-pick-btn");
  const preview = root.querySelector("#photo-add-preview");
  const previewImg = root.querySelector("#photo-add-preview-img");
  const previewRemove = root.querySelector("#photo-add-preview-remove");
  const captionInput = root.querySelector("#photo-add-caption");
  const dateInput = root.querySelector("#photo-add-date");
  const submitBtn = root.querySelector("#photo-add-submit");

  const filtersEl = root.querySelector("#photo-filters");
  const contentEl = root.querySelector("#photo-content");
  const lightbox = root.querySelector("#lightbox");
  const lightboxImg = root.querySelector("#lightbox-img");
  const lightboxCaption = root.querySelector("#lightbox-caption");
  const lightboxDelete = root.querySelector("#lightbox-delete");

  dateInput.value = toDateKey(new Date());

  function tile(p) {
    return `
      <button class="photo-tile" data-open="${p.id}">
        <img src="${p.photo}" alt="" />
        <button class="photo-tile__fav ${p.favorite ? "is-active" : ""}" data-fav="${p.id}">${p.favorite ? "★" : "☆"}</button>
      </button>`;
  }

  function render() {
    const photos = store.getAllPhotos();
    let visible = photos;
    if (filter === "favorite") visible = photos.filter((p) => p.favorite);

    if (photos.length === 0) {
      contentEl.innerHTML = `<div class="empty-illust">
        ${illustration("assets/characters/rabbit.png", "🐰", { className: "illust--lg" })}
        まだ思い出がないよ。<br>上のボタンから追加しよう。
      </div>`;
      return;
    }

    if (filter === "album") {
      const groups = new Map();
      photos.forEach((p) => {
        const key = p.dateKey.slice(0, 7);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(p);
      });
      contentEl.innerHTML = [...groups.entries()]
        .map(([month, items]) => {
          const [y, m] = month.split("-");
          return `
          <div class="photo-album__label">${y}年${Number(m)}月</div>
          <div class="photo-grid">${items.map(tile).join("")}</div>`;
        })
        .join("");
      return;
    }

    if (visible.length === 0) {
      contentEl.innerHTML = `<div class="empty-state">お気に入りの写真はまだありません</div>`;
      return;
    }
    contentEl.innerHTML = `<div class="photo-grid">${visible.map(tile).join("")}</div>`;
  }

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".segmented__item");
    if (!btn) return;
    filter = btn.dataset.filter;
    filtersEl.querySelectorAll(".segmented__item").forEach((b) => b.classList.toggle("is-active", b === btn));
    render();
  });

  contentEl.addEventListener("click", (e) => {
    const favBtn = e.target.closest("[data-fav]");
    if (favBtn) {
      store.togglePhotoFavorite(favBtn.dataset.fav);
      return;
    }
    const openBtn = e.target.closest("[data-open]");
    if (openBtn) {
      const photo = store.getAllPhotos().find((p) => p.id === openBtn.dataset.open);
      if (!photo) return;
      openPhotoId = photo.id;
      lightboxImg.src = photo.photo;
      lightboxCaption.textContent = photo.caption ? photo.caption : "";
      lightboxDelete.hidden = !photo.id.startsWith("photo:");
      lightbox.classList.add("is-visible");
    }
  });

  root.querySelector("#lightbox-close").addEventListener("click", () => lightbox.classList.remove("is-visible"));
  lightboxDelete.addEventListener("click", () => {
    if (!openPhotoId || !confirm("この写真をアルバムから削除しますか?")) return;
    store.removePhoto(openPhotoId);
    lightbox.classList.remove("is-visible");
  });
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.classList.remove("is-visible");
  });

  addToggle.addEventListener("click", () => {
    addPanel.hidden = !addPanel.hidden;
  });
  pickBtn.addEventListener("click", () => photoInput.click());
  function clearPendingPhoto() {
    pendingPhoto = null;
    photoInput.value = "";
    preview.classList.remove("is-visible");
    previewImg.src = "";
  }
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
  previewRemove.addEventListener("click", clearPendingPhoto);

  submitBtn.addEventListener("click", async () => {
    if (!pendingPhoto) {
      showToast("写真を選んでください");
      return;
    }
    submitBtn.disabled = true;
    try {
      await store.addPhoto(pendingPhoto, captionInput.value, dateInput.value);
    } catch {
      showToast("追加に失敗しました。写真が大きすぎるかもしれません");
      submitBtn.disabled = false;
      return;
    }
    submitBtn.disabled = false;
    clearPendingPhoto();
    captionInput.value = "";
    dateInput.value = toDateKey(new Date());
    addPanel.hidden = true;
  });

  render();
  const unsubs = [store.subscribePosts(render), store.subscribeEvents(render), store.subscribePhotos(render)];
  return () => unsubs.forEach((fn) => fn());
}
