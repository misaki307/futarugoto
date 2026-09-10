import { store } from "../store.js";
import { escapeHtml, formatRelativeTime, compressImageFile, showToast, illustration, avatarHtml } from "../util.js";

const REACTION_EMOJIS = ["❤️", "👍", "😂"];
const CORNER_DECOS = ["assets/decorations/heart.png", "assets/decorations/star.png", "assets/decorations/flower-small.png"];
const CORNER_ROTATIONS = [-10, 8, -6];

export function mount(root) {
  let pendingPhoto = null;
  let author = store.getMyAuthorIndex();
  const profile = store.getProfile();
  store.markSeen("timeline");

  root.innerHTML = `
    <section class="screen-hero screen-hero--row">
      <div>
        <h1 class="screen-hero__title">TIMELINE</h1>
        <p class="screen-hero__subtitle">ふたりのこと、なんでも。</p>
      </div>
      <button class="hero-action-btn" id="composer-toggle">＋ 投稿する</button>
    </section>

    <div class="composer card" id="composer" hidden>
      <div class="composer__author" id="composer-author">
        ${profile.people
          .map(
            (p, i) => `<button class="author-pick ${i === author ? "is-active" : ""}" data-author="${i}" type="button">
              ${avatarHtml(p, "")} ${escapeHtml(p.name)}
            </button>`
          )
          .join("")}
      </div>
      <textarea class="textarea" id="composer-input" maxlength="500"
        placeholder="今日あったこと、話したいことをつぶやこう"></textarea>
      <div class="composer__preview" id="composer-preview">
        <img id="composer-preview-img" alt="" />
        <button class="composer__preview-remove" id="composer-preview-remove" aria-label="写真を外す">✕</button>
      </div>
      <div class="composer__row">
        <button class="composer__photo-btn" id="composer-photo-btn" aria-label="写真を追加">📷</button>
        <input type="file" accept="image/*" id="composer-photo-input" hidden />
        <button class="btn btn-primary" id="composer-submit">投稿する</button>
      </div>
    </div>

    <div class="post-list" id="post-list"></div>
  `;

  const composer = root.querySelector("#composer");
  const composerToggle = root.querySelector("#composer-toggle");
  const composerAuthor = root.querySelector("#composer-author");
  const listEl = root.querySelector("#post-list");
  const input = root.querySelector("#composer-input");
  const submitBtn = root.querySelector("#composer-submit");
  const photoBtn = root.querySelector("#composer-photo-btn");
  const photoInput = root.querySelector("#composer-photo-input");
  const preview = root.querySelector("#composer-preview");
  const previewImg = root.querySelector("#composer-preview-img");
  const previewRemove = root.querySelector("#composer-preview-remove");

  composerToggle.addEventListener("click", () => {
    composer.hidden = !composer.hidden;
    if (!composer.hidden) input.focus();
  });
  composerAuthor.addEventListener("click", (e) => {
    const btn = e.target.closest(".author-pick");
    if (!btn) return;
    author = Number(btn.dataset.author);
    composerAuthor.querySelectorAll(".author-pick").forEach((b) => b.classList.toggle("is-active", b === btn));
  });

  function renderPosts(posts) {
    if (posts.length === 0) {
      listEl.innerHTML = `<div class="empty-illust">
        ${illustration("assets/characters/cat.png", "🐱", { className: "illust--xl" })}
        まだ投稿がないよ。<br>最初のひとことを残してみよう。
      </div>`;
      return;
    }
    listEl.innerHTML = posts
      .map((post, i) => {
        const person = profile.people[post.author ?? 0] || profile.people[0];
        const rot = CORNER_ROTATIONS[i % CORNER_ROTATIONS.length];
        const decoSrc = CORNER_DECOS[i % CORNER_DECOS.length];
        const deco = `<span class="sticker sticker--pop" style="transform:rotate(${rot}deg)"><img src="${decoSrc}" alt="" loading="lazy" /></span>`;
        return `
      <article class="card post-card" data-id="${post.id}">
        ${deco}
        <div class="post-card__meta">
          ${avatarHtml(person, "post-avatar")}
          <span class="post-card__who">
            <span class="post-card__author">${escapeHtml(person.name)}</span>
            <span class="post-card__time">${formatRelativeTime(post.createdAt)}</span>
          </span>
          <button class="post-card__menu" data-id="${post.id}" aria-label="投稿メニュー">⋯</button>
        </div>
        ${post.photo ? `<img class="post-card__photo" src="${post.photo}" alt="" />` : ""}
        ${post.text ? `<p class="post-card__text">${escapeHtml(post.text)}</p>` : ""}
        <div class="reaction-row">
          ${REACTION_EMOJIS.map(
            (emoji) => `
            <button class="reaction-chip" data-emoji="${emoji}" data-id="${post.id}">
              <span>${emoji}</span><span>${post.reactions[emoji] || 0}</span>
            </button>`
          ).join("")}
        </div>
      </article>`;
      })
      .join("");
  }

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

  async function submit() {
    if (!input.value.trim() && !pendingPhoto) return;
    submitBtn.disabled = true;
    try {
      await store.addPost(input.value, pendingPhoto, author);
    } catch {
      showToast("投稿に失敗しました。写真が大きすぎるかもしれません");
      submitBtn.disabled = false;
      return;
    }
    submitBtn.disabled = false;
    input.value = "";
    clearPhoto();
    composer.hidden = true;
  }

  submitBtn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
  });

  listEl.addEventListener("click", (e) => {
    const reactBtn = e.target.closest(".reaction-chip");
    if (reactBtn) {
      store.reactPost(reactBtn.dataset.id, reactBtn.dataset.emoji);
      return;
    }
    const menuBtn = e.target.closest(".post-card__menu");
    if (menuBtn && confirm("この投稿を削除しますか?")) {
      store.removePost(menuBtn.dataset.id);
    }
  });

  const unsubscribe = store.subscribePosts(renderPosts);
  return () => unsubscribe();
}
