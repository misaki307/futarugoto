import { store } from "../store.js";
import { compressImageFile, showToast, toDateKey, illustration, escapeHtml } from "../util.js";

export function mount(root) {
  let filter = "all";
  let pendingPhoto = null;
  let openPhotoId = null;
  let openAlbumId = null;

  const pendingAlbum = store.consumePendingAlbumOpen();
  if (pendingAlbum) {
    filter = "album";
    openAlbumId = pendingAlbum;
  }

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
      <button class="segmented__item ${filter === "all" ? "is-active" : ""}" data-filter="all">すべて</button>
      <button class="segmented__item ${filter === "favorite" ? "is-active" : ""}" data-filter="favorite">お気に入り</button>
      <button class="segmented__item ${filter === "album" ? "is-active" : ""}" data-filter="album">アルバム</button>
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

    <div class="lightbox" id="picker-overlay">
      <div class="lightbox__inner" style="max-height:80vh; overflow-y:auto; width:100%;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
          <span style="color:#fff; font-weight:800;">写真を選ぶ</span>
          <button class="lightbox__close" id="picker-done">完了</button>
        </div>
        <div class="photo-grid" id="picker-grid"></div>
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
  const pickerOverlay = root.querySelector("#picker-overlay");
  const pickerGrid = root.querySelector("#picker-grid");

  dateInput.value = toDateKey(new Date());

  function tile(p) {
    return `
      <button class="photo-tile" data-open="${p.id}">
        <img src="${p.photo}" alt="" />
        <button class="photo-tile__fav ${p.favorite ? "is-active" : ""}" data-fav="${p.id}">${p.favorite ? "★" : "☆"}</button>
      </button>`;
  }

  function albumCard(album, photos) {
    const albumPhotos = photos.filter((p) => p.albumId === album.id);
    const cover = albumPhotos[0];
    return `
      <button class="album-card" data-open-album="${album.id}">
        <span class="album-card__cover">${cover ? `<img src="${cover.photo}" alt="" />` : "📁"}</span>
        <span class="album-card__body">
          <span class="album-card__name">${escapeHtml(album.name)}</span>
          <span class="album-card__count">${albumPhotos.length}枚</span>
        </span>
      </button>`;
  }

  function renderAlbumList(photos) {
    const albums = store.getAlbums();
    contentEl.innerHTML = `
      <button class="btn btn-primary btn-block" id="album-create-btn" style="margin-bottom:12px;">＋ 新しいアルバムを作る</button>
      ${
        albums.length === 0
          ? `<div class="empty-state">まだアルバムがありません。<br>「ディズニー」「この前遊んだ日」のように名前をつけて作ってみよう。</div>`
          : `<div class="album-list">${albums.map((a) => albumCard(a, photos)).join("")}</div>`
      }
    `;
    contentEl.querySelector("#album-create-btn").addEventListener("click", async () => {
      const name = prompt("アルバムの名前を入力してください(例: ディズニーの思い出)");
      if (!name || !name.trim()) return;
      try {
        const id = await store.createAlbum(name);
        openAlbumId = id;
        render();
      } catch {
        showToast("作成に失敗しました");
      }
    });
    contentEl.querySelectorAll("[data-open-album]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openAlbumId = btn.dataset.openAlbum;
        render();
      });
    });
  }

  function renderAlbumDetail(photos) {
    const album = store.getAlbums().find((a) => a.id === openAlbumId);
    if (!album) {
      openAlbumId = null;
      renderAlbumList(photos);
      return;
    }
    const albumPhotos = photos.filter((p) => p.albumId === openAlbumId);
    contentEl.innerHTML = `
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:12px;">
        <button class="calendar-nav__btn" id="album-back-btn" aria-label="戻る">‹</button>
        <span style="font-weight:800; font-size:15px; flex:1;">${escapeHtml(album.name)}</span>
        <button class="settings-row__chevron" id="album-rename-btn" style="border:none;background:none;font-size:16px;cursor:pointer;">✏️</button>
        <button class="settings-row__chevron" id="album-delete-btn" style="border:none;background:none;font-size:16px;cursor:pointer;">🗑️</button>
      </div>
      <button class="btn btn-ghost btn-block" id="album-add-photos-btn" style="margin-bottom:12px;">＋ 写真を選んで追加</button>
      ${
        albumPhotos.length === 0
          ? `<div class="empty-state">まだ写真がありません</div>`
          : `<div class="photo-grid">${albumPhotos.map(tile).join("")}</div>`
      }
    `;
    contentEl.querySelector("#album-back-btn").addEventListener("click", () => {
      openAlbumId = null;
      render();
    });
    contentEl.querySelector("#album-rename-btn").addEventListener("click", async () => {
      const name = prompt("新しいアルバム名を入力してください", album.name);
      if (!name || !name.trim()) return;
      try {
        await store.renameAlbum(album.id, name);
      } catch {
        showToast("変更に失敗しました");
      }
    });
    contentEl.querySelector("#album-delete-btn").addEventListener("click", async () => {
      if (!confirm(`「${album.name}」を削除しますか?(写真自体は残ります)`)) return;
      try {
        await store.removeAlbum(album.id);
        openAlbumId = null;
      } catch {
        showToast("削除に失敗しました");
      }
    });
    contentEl.querySelector("#album-add-photos-btn").addEventListener("click", () => openPicker());
  }

  function openPicker() {
    const photos = store.getAllPhotos();
    pickerGrid.innerHTML = photos
      .map(
        (p) => `
      <button class="photo-tile" data-pick="${p.id}">
        <img src="${p.photo}" alt="" />
        ${p.albumId === openAlbumId ? `<span class="photo-tile__fav is-active" style="pointer-events:none;">✓</span>` : ""}
      </button>`
      )
      .join("");
    pickerOverlay.classList.add("is-visible");
  }
  pickerGrid.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-pick]");
    if (!btn) return;
    const id = btn.dataset.pick;
    const photos = store.getAllPhotos();
    const photo = photos.find((p) => p.id === id);
    const nextAlbumId = photo.albumId === openAlbumId ? null : openAlbumId;
    try {
      await store.setPhotoAlbum(id, nextAlbumId);
      openPicker();
    } catch {
      showToast("更新に失敗しました");
    }
  });
  root.querySelector("#picker-done").addEventListener("click", () => {
    pickerOverlay.classList.remove("is-visible");
    render();
  });
  pickerOverlay.addEventListener("click", (e) => {
    if (e.target === pickerOverlay) pickerOverlay.classList.remove("is-visible");
  });

  function render() {
    const photos = store.getAllPhotos();

    if (filter === "album") {
      if (openAlbumId) renderAlbumDetail(photos);
      else renderAlbumList(photos);
      return;
    }

    let visible = photos;
    if (filter === "favorite") visible = photos.filter((p) => p.favorite);

    if (photos.length === 0) {
      contentEl.innerHTML = `<div class="empty-illust">
        ${illustration("assets/characters/rabbit.png", "🐰", { className: "illust--lg" })}
        まだ思い出がないよ。<br>上のボタンから追加しよう。
      </div>`;
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
    if (filter !== "album") openAlbumId = null;
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
  const unsubs = [
    store.subscribePosts(render),
    store.subscribeEvents(render),
    store.subscribePhotos(render),
    store.subscribeAlbums(render),
  ];
  return () => unsubs.forEach((fn) => fn());
}
