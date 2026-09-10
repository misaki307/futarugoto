import { store } from "../store.js";
import { escapeHtml, formatRelativeTime, illustration, sticker } from "../util.js";

function formatEventDate(dateKey) {
  const [, m, d] = dateKey.split("-").map(Number);
  const dow = "日月火水木金土"[new Date(dateKey).getDay()];
  return `${m}/${d}(${dow})`;
}

export function mount(root, switchView) {
  function render() {
    const profile = store.getProfile();
    const days = store.getDaysTogether();
    const latestPost = store.getPosts()[0];
    const nextEvent = store.getNextEvent();
    const wannaGo = store.getLists().find((l) => l.id === "wanna-go");
    const recentPhotos = store.getAllPhotos().slice(0, 6);

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
          <span class="couple-avatar">${escapeHtml(profile.people[0].avatar)}</span>
          <span class="couple-avatars__heart">💛</span>
          <span class="couple-avatar">${escapeHtml(profile.people[1].avatar)}</span>
        </div>
        <div class="couple-days">
          <div class="couple-days__label">${days !== null ? "出会ってから" : "設定で出会った日を登録しよう"}</div>
          ${days !== null ? `<div class="couple-days__value">${days}<span>日</span></div>` : ""}
        </div>
        ${sticker("assets/characters/star.png", "", "sticker--pop")}
      </div>

      <section class="home-section">
        <button class="home-section__link" data-nav="timeline">
          <span class="home-section__title">
            ${illustration("assets/icons/speech-bubble.png", "💬", { className: "illust--sm" })}
            最近の投稿
          </span>
          <span class="home-section__chevron">›</span>
        </button>
        ${
          latestPost
            ? `<button class="home-post-preview" data-nav="timeline">
                <span class="home-post-preview__avatar">${escapeHtml(profile.people[latestPost.author ?? 0]?.avatar || "🙂")}</span>
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
  }

  render();
  const unsubs = [
    store.subscribeProfile(render),
    store.subscribePosts(render),
    store.subscribeLists(render),
    store.subscribeEvents(render),
    store.subscribePhotos(render),
  ];
  return () => unsubs.forEach((fn) => fn());
}
