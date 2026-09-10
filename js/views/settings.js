import { THEMES, getTheme, setTheme } from "../theme.js";
import { store } from "../store.js";
import { logOut } from "../auth.js";
import { showToast, illustration } from "../util.js";

export function mount(root) {
  const profile = store.getProfile();

  root.innerHTML = `
    <section class="screen-hero">
      <h1 class="screen-hero__title">SETTINGS</h1>
      <p class="screen-hero__subtitle">ふたりらしく、着せ替えよう。</p>
    </section>

    <div class="view-section">
      <h3 class="settings-heading">${illustration("assets/decorations/star.png", "🎨", { className: "illust--sm" })}テーマ</h3>
      <div class="theme-grid" id="theme-grid"></div>
    </div>

    <div class="view-section">
      <h3 class="settings-heading">${illustration("assets/characters/dog.png", "🐾", { className: "illust--sm" })}プロフィール</h3>
      <form class="profile-editor card" id="profile-form">
        ${profile.people
          .map(
            (p, i) => `
          <div class="profile-editor__person">
            <input class="input profile-editor__avatar" maxlength="2" id="avatar-${i}" value="${p.avatar}" />
            <input class="input profile-editor__name" maxlength="12" id="name-${i}" value="${p.name}" placeholder="なまえ" />
          </div>`
          )
          .join("")}
        <div class="profile-editor__date-row">
          <label for="start-date">出会った日</label>
          <input class="input" type="date" id="start-date" value="${profile.startDate || ""}" />
        </div>
        <button class="btn btn-primary btn-block" type="submit">保存する</button>
      </form>
    </div>

    <div class="view-section">
      <button class="settings-row" id="reset-btn" type="button">
        <span class="settings-row__label">データを初期化</span>
        <span class="settings-row__chevron">›</span>
      </button>
      <button class="settings-row" id="about-btn" type="button">
        <span class="settings-row__label">このアプリについて</span>
        <span class="settings-row__chevron">›</span>
      </button>
      <button class="settings-row" id="logout-btn" type="button">
        <span class="settings-row__label">ログアウト</span>
        <span class="settings-row__chevron">›</span>
      </button>
      <div class="about-card" id="about-card" hidden>
        「ふたりごと」は二人だけの投稿・やりたいことリスト・カレンダー・写真をまとめる共有アプリです。<br />
        データはクラウド(Firebase)に保存され、ペアになったふたりの間でリアルタイムに共有されます。
      </div>
    </div>
  `;

  const themeGrid = root.querySelector("#theme-grid");

  function renderThemes() {
    const current = getTheme();
    themeGrid.innerHTML = THEMES.map(
      (t) => `
      <button class="theme-option ${t.id === current ? "is-active" : ""}" data-id="${t.id}" type="button">
        <span class="theme-swatch">${t.swatch.map((c) => `<span style="background:${c}"></span>`).join("")}</span>
        <span>
          <div class="theme-option__name">${t.name}</div>
          <div style="font-size:12px;color:var(--color-text-muted);">${t.desc}</div>
        </span>
        <span class="theme-option__check">✓</span>
      </button>`
    ).join("");
  }

  themeGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-option");
    if (!btn) return;
    setTheme(btn.dataset.id);
    renderThemes();
    showToast("テーマを変更しました");
  });

  root.querySelector("#profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector("button[type=submit]");
    const people = profile.people.map((p, i) => ({
      avatar: root.querySelector(`#avatar-${i}`).value.trim() || p.avatar,
      name: root.querySelector(`#name-${i}`).value.trim() || p.name,
    }));
    const startDate = root.querySelector("#start-date").value || null;
    submitBtn.disabled = true;
    try {
      await store.setProfile({ people, startDate });
      showToast("プロフィールを保存しました");
    } catch {
      showToast("保存に失敗しました");
    } finally {
      submitBtn.disabled = false;
    }
  });

  root.querySelector("#reset-btn").addEventListener("click", async (e) => {
    if (!confirm("すべてのデータを削除します。よろしいですか?")) return;
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await store.resetAll();
      showToast("データを初期化しました");
    } catch {
      showToast("初期化に失敗しました");
    } finally {
      btn.disabled = false;
    }
  });

  root.querySelector("#logout-btn").addEventListener("click", () => {
    if (confirm("ログアウトしますか?")) logOut();
  });

  const aboutCard = root.querySelector("#about-card");
  root.querySelector("#about-btn").addEventListener("click", () => {
    aboutCard.hidden = !aboutCard.hidden;
  });

  renderThemes();
  return () => {};
}
