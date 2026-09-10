import { store } from "../store.js";
import { escapeHtml, avatarHtml, compressImageFile, showToast } from "../util.js";
import { PROFILE_THEMES, getProfileTheme, ICON_ASSETS, MBTI_OPTIONS, BLOOD_TYPE_OPTIONS } from "../profileThemes.js";

function formatBirthday(dateStr) {
  if (!dateStr) return "未設定";
  const parts = dateStr.split("-").map(Number);
  const m = parts[1];
  const d = parts[2];
  return `${m}月${d}日`;
}

export function mount(root, switchView) {
  const myIndex = store.getMyAuthorIndex();
  const pending = store.consumePendingProfileOpen();
  let viewIndex = pending === null || pending === undefined ? myIndex : Number(pending);
  let editing = false;
  let selectedThemeId = null;
  let touchX = null;
  let touchY = null;

  function goTo(index) {
    const people = store.getProfile().people;
    if (index < 0 || index >= people.length) return;
    viewIndex = index;
    editing = false;
    render();
  }

  function render() {
    const profile = store.getProfile();
    const people = profile.people;
    const person = people[viewIndex] || people[0];
    const isSelf = viewIndex === myIndex;
    const theme = getProfileTheme(person.profileTheme);
    const posts = store.getPosts().filter((p) => (p.author ?? 0) === viewIndex);
    const todayPost = posts[0];
    const nextEvent = store.getNextEvent();

    if (editing && isSelf) selectedThemeId = selectedThemeId || person.profileTheme || "pink";

    const cardHtml =
      editing && isSelf
        ? `
      <form class="profile-edit-form" id="profile-edit-form">
        <label class="profile-edit-form__label">名前</label>
        <input class="input" id="ed-name" maxlength="12" value="${escapeHtml(person.name)}" />

        <label class="profile-edit-form__label">自己紹介</label>
        <textarea class="textarea" id="ed-bio" maxlength="60" placeholder="ひとこと">${escapeHtml(person.bio || "")}</textarea>

        <div class="profile-edit-form__row">
          <div style="flex:1;">
            <label class="profile-edit-form__label">MBTI</label>
            <select class="input" id="ed-mbti">
              <option value="">未設定</option>
              ${MBTI_OPTIONS.map((m) => `<option value="${m}" ${person.mbti === m ? "selected" : ""}>${m}</option>`).join("")}
            </select>
          </div>
          <div style="flex:1;">
            <label class="profile-edit-form__label">血液型</label>
            <select class="input" id="ed-blood">
              <option value="">未設定</option>
              ${BLOOD_TYPE_OPTIONS.map((b) => `<option value="${b}" ${person.bloodType === b ? "selected" : ""}>${b}</option>`).join("")}
            </select>
          </div>
        </div>

        <label class="profile-edit-form__label">誕生日</label>
        <input class="input" type="date" id="ed-birthday" value="${person.birthday || ""}" />

        <label class="profile-edit-form__label">好きなもの</label>
        <input class="input" id="ed-likes" maxlength="40" placeholder="例: 甘いもの、映画" value="${escapeHtml(person.likes || "")}" />

        <label class="profile-edit-form__label">背景テーマ</label>
        <div class="theme-swatch-grid" id="ed-theme-grid">
          ${PROFILE_THEMES.map(
            (t) => `
            <button type="button" class="theme-swatch-option ${t.id === selectedThemeId ? "is-active" : ""}" data-theme-id="${t.id}" style="--swatch-bg:${t.bg};">
              <span class="theme-swatch-option__thumb"><img src="${t.character}" alt="" /></span>
              <span class="theme-swatch-option__label">${escapeHtml(t.label)}</span>
            </button>`
          ).join("")}
        </div>

        <div style="display:flex; gap:8px; margin-top:14px;">
          <button type="button" class="btn btn-ghost" id="ed-cancel-btn" style="flex:1;">キャンセル</button>
          <button type="submit" class="btn btn-primary" id="ed-save-btn" style="flex:1;">保存する</button>
        </div>
      </form>`
        : `
      <div class="profile-card__head">
        <div style="flex:1; min-width:0;">
          <div class="profile-card__name">${escapeHtml(person.name)}</div>
          <div class="profile-card__bio">${person.bio ? escapeHtml(person.bio) : "ひとこと未設定"}</div>
        </div>
        ${isSelf ? `<button class="btn btn-ghost btn-sm" id="profile-edit-btn" type="button">編集</button>` : ""}
      </div>

      <div class="profile-info-grid">
        <div class="profile-info-row"><span class="profile-info-row__icon">💫</span><span class="profile-info-row__label">MBTI</span><span class="profile-info-row__value">${person.mbti ? escapeHtml(person.mbti) : "未設定"}</span></div>
        <div class="profile-info-row"><span class="profile-info-row__icon">🩸</span><span class="profile-info-row__label">血液型</span><span class="profile-info-row__value">${person.bloodType ? escapeHtml(person.bloodType) : "未設定"}</span></div>
        <div class="profile-info-row"><span class="profile-info-row__icon">🎂</span><span class="profile-info-row__label">誕生日</span><span class="profile-info-row__value">${formatBirthday(person.birthday)}</span></div>
        <div class="profile-info-row"><span class="profile-info-row__icon">⭐</span><span class="profile-info-row__label">好きなもの</span><span class="profile-info-row__value">${person.likes ? escapeHtml(person.likes) : "未設定"}</span></div>
      </div>

      <div class="profile-today-next">
        <div class="profile-today-next__item">
          <div class="profile-today-next__label">Today</div>
          <div class="profile-today-next__body">${todayPost ? escapeHtml(todayPost.text || "(写真の投稿)") : "まだ投稿がありません"}</div>
        </div>
        <div class="profile-today-next__item">
          <div class="profile-today-next__label">Next</div>
          <div class="profile-today-next__body">${nextEvent ? escapeHtml(nextEvent.title) : "まだ予定がありません"}</div>
        </div>
      </div>`;

    root.innerHTML = `
      <div class="profile-page">
        <div class="profile-page__topbar">
          <button class="profile-page__icon-btn" id="profile-back-btn" type="button" aria-label="戻る">‹</button>
          <span class="profile-page__topbar-title">プロフィール</span>
          <button class="profile-page__icon-btn" id="profile-friends-btn" type="button" aria-label="友達一覧">👥</button>
        </div>

        <div class="profile-hero" style="--profile-bg:${theme.bg};">
          <img class="profile-hero__img" src="${theme.hero}" alt="${escapeHtml(theme.label)}テーマ" />
          <div class="profile-hero__icon-wrap">
            <span class="profile-hero__icon">${avatarHtml(person, "profile-hero__icon-img")}</span>
            ${isSelf ? `<button class="profile-hero__icon-edit" id="profile-icon-edit-btn" type="button" aria-label="アイコンを変更">📷</button>` : ""}
          </div>
        </div>

        <div class="profile-card card">${cardHtml}</div>

        <div class="profile-page__nav">
          <button class="profile-page__nav-btn" id="profile-prev-btn" type="button" ${viewIndex === 0 ? "disabled" : ""}>‹ ${escapeHtml(people[0]?.name || "")}</button>
          <button class="profile-page__nav-btn" id="profile-next-btn" type="button" ${viewIndex === people.length - 1 ? "disabled" : ""}>${escapeHtml(people[1]?.name || "")} ›</button>
        </div>
      </div>

      <div class="lightbox" id="friend-list-overlay">
        <div class="lightbox__inner" style="width:100%; max-height:80vh; overflow-y:auto;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
            <span style="color:#fff; font-weight:800;">友達一覧</span>
            <button class="lightbox__close" id="friend-list-close" type="button">閉じる</button>
          </div>
          <div class="friend-list">
            ${people
              .map(
                (p, i) => `
              <button class="friend-row" data-friend-index="${i}" type="button">
                ${avatarHtml(p, "friend-row__avatar")}
                <span class="friend-row__body">
                  <span class="friend-row__name">${escapeHtml(p.name)}${i === myIndex ? "(あなた)" : ""}</span>
                  <span class="friend-row__bio">${p.bio ? escapeHtml(p.bio) : ""}</span>
                </span>
              </button>`
              )
              .join("")}
          </div>
        </div>
      </div>

      ${
        isSelf
          ? `
      <div class="lightbox" id="icon-picker-overlay">
        <div class="lightbox__inner" style="width:100%; max-height:80vh; overflow-y:auto;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
            <span style="color:#fff; font-weight:800;">アイコンを選ぶ</span>
            <button class="lightbox__close" id="icon-picker-close" type="button">閉じる</button>
          </div>
          <input type="file" accept="image/*" id="icon-photo-input" hidden />
          <button class="btn btn-primary btn-block" id="icon-photo-btn" type="button" style="margin-bottom:12px;">📷 カスタム画像を使う</button>
          <div class="icon-picker-grid">
            ${ICON_ASSETS.map(
              (ic) => `
              <button class="icon-picker-item" data-icon-asset="${ic.path}" type="button">
                <img src="${ic.path}" alt="" />
                <span>${escapeHtml(ic.label)}</span>
              </button>`
            ).join("")}
          </div>
        </div>
      </div>`
          : ""
      }
    `;

    wireEvents(person, isSelf);
  }

  function wireEvents(person, isSelf) {
    root.querySelector("#profile-back-btn").addEventListener("click", () => switchView("home"));
    root.querySelector("#profile-prev-btn").addEventListener("click", () => goTo(viewIndex - 1));
    root.querySelector("#profile-next-btn").addEventListener("click", () => goTo(viewIndex + 1));

    const friendOverlay = root.querySelector("#friend-list-overlay");
    root.querySelector("#profile-friends-btn").addEventListener("click", () => friendOverlay.classList.add("is-visible"));
    root.querySelector("#friend-list-close").addEventListener("click", () => friendOverlay.classList.remove("is-visible"));
    friendOverlay.addEventListener("click", (e) => {
      if (e.target === friendOverlay) friendOverlay.classList.remove("is-visible");
    });
    friendOverlay.querySelectorAll("[data-friend-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        friendOverlay.classList.remove("is-visible");
        goTo(Number(btn.dataset.friendIndex));
      });
    });

    if (isSelf) {
      const iconOverlay = root.querySelector("#icon-picker-overlay");
      root.querySelector("#profile-icon-edit-btn").addEventListener("click", () => iconOverlay.classList.add("is-visible"));
      root.querySelector("#icon-picker-close").addEventListener("click", () => iconOverlay.classList.remove("is-visible"));
      iconOverlay.addEventListener("click", (e) => {
        if (e.target === iconOverlay) iconOverlay.classList.remove("is-visible");
      });
      iconOverlay.querySelectorAll("[data-icon-asset]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const people = store.getProfile().people.map((p, i) =>
            i === viewIndex ? { ...p, iconAsset: btn.dataset.iconAsset, photo: null } : p
          );
          try {
            await store.setProfile({ people });
            showToast("アイコンを変更しました");
            iconOverlay.classList.remove("is-visible");
            render();
          } catch {
            showToast("変更に失敗しました");
          }
        });
      });
      const iconPhotoBtn = root.querySelector("#icon-photo-btn");
      const iconPhotoInput = root.querySelector("#icon-photo-input");
      iconPhotoBtn.addEventListener("click", () => iconPhotoInput.click());
      iconPhotoInput.addEventListener("change", async () => {
        const file = iconPhotoInput.files?.[0];
        if (!file) return;
        try {
          const photo = await compressImageFile(file, { maxDim: 300, quality: 0.7 });
          const people = store.getProfile().people.map((p, i) =>
            i === viewIndex ? { ...p, photo, iconAsset: null } : p
          );
          await store.setProfile({ people });
          showToast("アイコンを変更しました");
          iconOverlay.classList.remove("is-visible");
          render();
        } catch {
          showToast("写真の読み込みに失敗しました");
        }
      });
    }

    if (editing && isSelf) {
      const themeGrid = root.querySelector("#ed-theme-grid");
      themeGrid.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-theme-id]");
        if (!btn) return;
        selectedThemeId = btn.dataset.themeId;
        themeGrid.querySelectorAll(".theme-swatch-option").forEach((b) => b.classList.toggle("is-active", b === btn));
      });
      root.querySelector("#ed-cancel-btn").addEventListener("click", () => {
        editing = false;
        selectedThemeId = null;
        render();
      });
      root.querySelector("#profile-edit-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const saveBtn = root.querySelector("#ed-save-btn");
        const name = root.querySelector("#ed-name").value.trim() || person.name;
        const bio = root.querySelector("#ed-bio").value.trim();
        const mbti = root.querySelector("#ed-mbti").value;
        const bloodType = root.querySelector("#ed-blood").value;
        const birthday = root.querySelector("#ed-birthday").value || null;
        const likes = root.querySelector("#ed-likes").value.trim();
        const profileTheme = selectedThemeId || person.profileTheme;
        const people = store.getProfile().people.map((p, i) =>
          i === viewIndex ? { ...p, name, bio, mbti, bloodType, birthday, likes, profileTheme } : p
        );
        saveBtn.disabled = true;
        try {
          await store.setProfile({ people });
          showToast("プロフィールを保存しました");
          editing = false;
          selectedThemeId = null;
          render();
        } catch {
          showToast("保存に失敗しました");
          saveBtn.disabled = false;
        }
      });
    } else if (isSelf) {
      root.querySelector("#profile-edit-btn").addEventListener("click", () => {
        editing = true;
        selectedThemeId = person.profileTheme;
        render();
      });
    }

    const page = root.querySelector(".profile-page");
    page.addEventListener("touchstart", (e) => {
      if (editing) return;
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    });
    page.addEventListener("touchend", (e) => {
      if (editing || touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      touchX = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        goTo(dx < 0 ? viewIndex + 1 : viewIndex - 1);
      }
    });
  }

  render();
  const unsubs = [store.subscribeProfile(render), store.subscribePosts(render), store.subscribeEvents(render)];
  return () => unsubs.forEach((fn) => fn());
}
