import { store } from "../store.js";
import { escapeHtml, formatRelativeTime, illustration, sticker, avatarHtml, compressImageFile, showToast } from "../util.js";

function formatEventDate(dateKey) {
  const [, m, d] = dateKey.split("-").map(Number);
  const dow = "日月火水木金土"[new Date(dateKey).getDay()];
  return `${m}/${d}(${dow})`;
}

export function mount(root, switchView) {
  let openProfileIndex = null; // どちらのプロフィールを編集中か(0/1/null)
  let composerOpen = false;
  let pendingPhoto = null;
  let author = store.getMyAuthorIndex();

  function render() {
    const profile = store.getProfile();
    const days = store.getDaysTogether();
    const latestPost = store.getPosts()[0];
    const nextEvent = store.getNextEvent();
    const wannaGo = store.getLists().find((l) => l.id === "wanna-go");
    const recentPhotos = store.getAllPhotos().slice(0, 6);
    const unseenCount = store.getUnseenPostCount();

    root.innerHTML = `
      <section class="screen-hero home-hero">
        ${sticker("assets/characters/dog.png", "", "sticker--pop")}
        ${sticker("assets/characters/rabbit.png", "", "sticker--pop")}
        ${sticker("assets/decorations/heart.png", "", "sticker--pop")}
        <h1 class="screen-hero__title">OUR DAYS</h1>
        <p class="screen-hero__subtitle">ふたりの毎日を、もっとたのしく。</p>
      </section>

      <div class="couple-card">
        <div class="couple-avatars">
          <button class="couple-avatar" data-edit-profile="0">${avatarHtml(profile.people[0], "couple-avatar__img")}</button>
          <span class="couple-avatars__heart">💛</span>
          <button class="couple-avatar" data-edit-profile="1">${avatarHtml(profile.people[1], "couple-avatar__img")}</button>
        </div>
        <div class="couple-days">
          <div class="couple-days__label">${days !== null ? "出会ってから" : "設定で出会った日を登録しよう"}</div>
          ${days !== null ? `<div class="couple-days__value">${days}<span>日</span></div>` : ""}
        </div>
        ${sticker("assets/characters/star.png", "", "sticker--pop")}
      </div>

      <div class="profile-quickedit card" id="profile-quickedit" ${openProfileIndex === null ? "hidden" : ""}></div>

      <section class="home-section">
        <button class="home-section__link" id="home-composer-toggle" style="width:100%;">
          <span class="home-section__title">
            ${illustration("assets/icons/speech-bubble.png", "💬", { className: "illust--sm" })}
            今日のひとこと、つぶやく
          </span>
          <span class="home-section__chevron">${composerOpen ? "︿" : "›"}</span>
        </button>
        <div class="composer card" id="home-composer" ${composerOpen ? "" : "hidden"}>
          <div class="composer__author" id="home-composer-author">
            ${profile.people
              .map(
                (p, i) => `<button class="author-pick ${i === author ? "is-active" : ""}" data-author="${i}" type="button">
                  ${avatarHtml(p, "")} ${escapeHtml(p.name)}
                </button>`
              )
              .join("")}
          </div>
          <textarea class="textarea" id="home-composer-input" maxlength="500" placeholder="今日あったこと、話したいことをつぶやこう"></textarea>
          <div class="composer__preview" id="home-composer-preview">
            <img id="home-composer-preview-img" alt="" />
            <button class="composer__preview-remove" id="home-composer-preview-remove" aria-label="写真を外す">✕</button>
          </div>
          <div class="composer__row">
            <button class="composer__photo-btn" id="home-composer-photo-btn" aria-label="写真を追加">📷</button>
            <input type="file" accept="image/*" id="home-composer-photo-input" hidden />
            <button class="btn btn-primary" id="home-composer-submit">投稿する</button>
          </div>
        </div>
      </section>

      <section class="home-section">
        <button class="home-section__link" data-nav="timeline">
          <span class="home-section__title">
            ${illustration("assets/icons/speech-bubble.png", "💬", { className: "illust--sm" })}
            最近の投稿
            ${unseenCount > 0 ? `<span class="badge-count">${unseenCount}</span>` : ""}
          </span>
          <span class="home-section__chevron">›</span>
        </button>
        ${
          latestPost
            ? `<button class="home-post-preview" data-nav="timeline">
                ${avatarHtml(profile.people[latestPost.author ?? 0] || { avatar: "🙂" }, "home-post-preview__avatar")}
                <span class="home-post-preview__body">
                  <div class="home-post-preview__text">${escapeHtml(latestPost.text || "(写真のみの投稿)")}</div>
                  <div class="home-post-preview__time">${formatRelativeTime(latestPost.createdAt)}</div>
                </span>
                ${latestPost.photo ? `<img class="home-post-preview__thumb" src="${latestPost.photo}" alt="" />` : ""}
                ${sticker("assets/decorations/heart.png", "", "sticker--pop")}
              </button>`
            : `<div class="empty-illust">${illustration("assets/characters/bird.png", "🐦", { className: "illust--md" })}まだ投稿がないよ</div>`
        }
      </section>

      <div class="home-stats">
        <button class="home-stat home-stat--primary" data-nav="calendar">
          ${sticker("assets/icons/calendar.png", "", "sticker--pop")}
          <div class="home-stat__label">次の予定</div>
          ${
            nextEvent
              ? `<div class="home-stat__value">${formatEventDate(nextEvent.date)}</div>
                 <div class="home-stat__sub">${escapeHtml(nextEvent.title)}</div>`
              : `<div class="home-stat__sub">まだ予定がありません</div>`
          }
        </button>
        <button class="home-stat home-stat--accent" data-nav="lists">
          ${sticker("assets/icons/pin.png", "", "sticker--pop")}
          <div class="home-stat__label">行きたいところ</div>
          <div class="home-stat__value">${wannaGo ? wannaGo.openCount : 0}件</div>
        </button>
      </div>

      <section class="home-section">
        <button class="home-section__link" data-nav="photos">
          <span class="home-section__title">
            ${illustration("assets/icons/camera.png", "📷", { className: "illust--sm" })}
            最近の写真
          </span>
          <span class="home-section__chevron">›</span>
        </button>
        ${
          recentPhotos.length > 0
            ? `<div class="home-photos-row">${recentPhotos.map((p) => `<img src="${p.photo}" alt="" />`).join("")}</div>`
            : `<div class="empty-illust">${illustration("assets/characters/rabbit.png", "🐰", { className: "illust--md" })}まだ写真がありません</div>`
        }
      </section>
    `;

    root.querySelectorAll("[data-nav]").forEach((el) => {
      el.addEventListener("click", () => switchView(el.dataset.nav));
    });

    // ---- プロフィールのクイック編集 ----
    root.querySelectorAll("[data-edit-profile]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.editProfile);
        openProfileIndex = openProfileIndex === idx ? null : idx;
        renderProfileEditor();
      });
    });
    const quickEditBox = root.querySelector("#profile-quickedit");
    function renderProfileEditor() {
      if (openProfileIndex === null) {
        quickEditBox.hidden = true;
        quickEditBox.innerHTML = "";
        return;
      }
      quickEditBox.hidden = false;
      const p = profile.people[openProfileIndex];
      quickEditBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="profile-quickedit__preview">${avatarHtml(p, "profile-quickedit__avatar")}</span>
          <div style="flex:1; display:flex; flex-direction:column; gap:8px;">
            <input class="input" id="qe-name" maxlength="12" value="${escapeHtml(p.name)}" placeholder="なまえ" />
            <div style="display:flex; gap:8px;">
              <input class="input" id="qe-emoji" maxlength="2" value="${escapeHtml(p.avatar)}" style="width:64px; text-align:center;" placeholder="絵文字" />
              <button class="btn btn-ghost btn-sm" id="qe-photo-btn" type="button">📷 写真を選ぶ</button>
              <input type="file" accept="image/*" id="qe-photo-input" hidden />
              ${p.photo ? `<button class="btn btn-ghost btn-sm" id="qe-photo-remove" type="button">写真を外す</button>` : ""}
            </div>
          </div>
        </div>
        <button class="btn btn-primary btn-block" id="qe-save" style="margin-top:10px;">保存する</button>
      `;
      let pendingProfilePhoto = p.photo || null;
      quickEditBox.querySelector("#qe-photo-btn").addEventListener("click", () => {
        quickEditBox.querySelector("#qe-photo-input").click();
      });
      quickEditBox.querySelector("#qe-photo-input").addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          pendingProfilePhoto = await compressImageFile(file, { maxDim: 300, quality: 0.7 });
          quickEditBox.querySelector(".profile-quickedit__preview").innerHTML = avatarHtml(
            { ...p, photo: pendingProfilePhoto },
            "profile-quickedit__avatar"
          );
        } catch {
          showToast("写真の読み込みに失敗しました");
        }
      });
      quickEditBox.querySelector("#qe-photo-remove")?.addEventListener("click", () => {
        pendingProfilePhoto = null;
        quickEditBox.querySelector(".profile-quickedit__preview").innerHTML = avatarHtml(
          { ...p, photo: null },
          "profile-quickedit__avatar"
        );
      });
      quickEditBox.querySelector("#qe-save").addEventListener("click", async () => {
        const name = quickEditBox.querySelector("#qe-name").value.trim() || p.name;
        const avatar = quickEditBox.querySelector("#qe-emoji").value.trim() || p.avatar;
        const people = profile.people.map((person, i) =>
          i === openProfileIndex ? { name, avatar, photo: pendingProfilePhoto } : person
        );
        try {
          await store.setProfile({ people });
          showToast("プロフィールを保存しました");
          openProfileIndex = null;
        } catch {
          showToast("保存に失敗しました");
        }
      });
    }
    renderProfileEditor();

    // ---- ホームからのクイック投稿 ----
    const composerToggle = root.querySelector("#home-composer-toggle");
    const composerBox = root.querySelector("#home-composer");
    composerToggle.addEventListener("click", () => {
      composerOpen = !composerOpen;
      composerBox.hidden = !composerOpen;
      composerToggle.querySelector(".home-section__chevron").textContent = composerOpen ? "︿" : "›";
      if (composerOpen) root.querySelector("#home-composer-input")?.focus();
    });
    const authorBox = root.querySelector("#home-composer-author");
    authorBox?.addEventListener("click", (e) => {
      const btn = e.target.closest(".author-pick");
      if (!btn) return;
      author = Number(btn.dataset.author);
      authorBox.querySelectorAll(".author-pick").forEach((b) => b.classList.toggle("is-active", b === btn));
    });
    const input = root.querySelector("#home-composer-input");
    const submitBtn = root.querySelector("#home-composer-submit");
    const photoBtn = root.querySelector("#home-composer-photo-btn");
    const photoInput = root.querySelector("#home-composer-photo-input");
    const preview = root.querySelector("#home-composer-preview");
    const previewImg = root.querySelector("#home-composer-preview-img");
    function clearPhoto() {
      pendingPhoto = null;
      photoInput.value = "";
      preview.classList.remove("is-visible");
      previewImg.src = "";
    }
    photoBtn?.addEventListener("click", () => photoInput.click());
    photoInput?.addEventListener("change", async () => {
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
    root.querySelector("#home-composer-preview-remove")?.addEventListener("click", clearPhoto);
    submitBtn?.addEventListener("click", async () => {
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
      composerOpen = false;
      render();
    });
  }

  render();
  const unsubs = [
    store.subscribeProfile(render),
    store.subscribePosts(render),
    store.subscribeLists(render),
    store.subscribeEvents(render),
    store.subscribePhotos(render),
    store.subscribeLastSeen(render),
  ];
  return () => unsubs.forEach((fn) => fn());
}
