import { store } from "../store.js";
import { escapeHtml, toDateKey, compressImageFile, showToast, illustration } from "../util.js";

const DOW = ["日", "月", "火", "水", "木", "金", "土"];
const DAY_ICONS = [
  ["assets/decorations/heart.png", "💛"],
  ["assets/decorations/star.png", "⭐"],
  ["assets/icons/plane.png", "✈️"],
];

export function mount(root) {
  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let selectedKey = toDateKey(today);
  let allEvents = [];
  let pendingEventPhoto = null;

  root.innerHTML = `
    <section class="screen-hero">
      <h1 class="screen-hero__title">CALENDAR</h1>
      <p class="screen-hero__subtitle">ふたりの予定を、毎日カラフルに。</p>
    </section>
    <div class="calendar-nav">
      <button class="calendar-nav__btn" id="cal-prev" aria-label="前の月">‹</button>
      <div class="calendar-nav__label">
        ${illustration("assets/decorations/sparkle.png", "✨", { className: "illust--sm calendar-nav__deco" })}
        <span id="cal-label"></span>
        ${illustration("assets/decorations/sparkle.png", "✨", { className: "illust--sm calendar-nav__deco" })}
      </div>
      <button class="calendar-nav__btn" id="cal-next" aria-label="次の月">›</button>
    </div>
    <div class="calendar-grid" id="cal-grid"></div>
    <div id="cal-day-section"></div>
  `;

  const labelEl = root.querySelector("#cal-label");
  const gridEl = root.querySelector("#cal-grid");
  const daySection = root.querySelector("#cal-day-section");

  function eventsOn(dateKey) {
    return allEvents.filter((e) => e.date === dateKey);
  }

  function renderGrid() {
    labelEl.textContent = `${viewYear}年${viewMonth + 1}月`;
    const startOffset = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const dowHtml = DOW.map((d) => `<div class="calendar-dow">${d}</div>`).join("");
    const cellsHtml = cells
      .map((d) => {
        if (d === null) return `<button class="calendar-cell is-outside" disabled></button>`;
        const dateKey = toDateKey(new Date(viewYear, viewMonth, d));
        const isToday = dateKey === toDateKey(today);
        const isSelected = dateKey === selectedKey;
        const hasEvents = eventsOn(dateKey).length > 0;
        const [iconSrc, iconFallback] = DAY_ICONS[d % DAY_ICONS.length];
        return `
        <button class="calendar-cell ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}" data-date="${dateKey}">
          <span>${d}</span>
          ${hasEvents ? illustration(iconSrc, iconFallback, { className: "illust--sm calendar-cell__icon" }) : ""}
        </button>`;
      })
      .join("");
    gridEl.innerHTML = dowHtml + cellsHtml;
  }

  function renderDaySection() {
    pendingEventPhoto = null;
    const dayEvents = eventsOn(selectedKey).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    const [, m, d] = selectedKey.split("-").map(Number);

    daySection.innerHTML = `
      <h3 class="settings-heading" style="margin-top:var(--space-2)">${m}月${d}日の予定</h3>
      <div class="event-list" id="event-list">
        ${
          dayEvents.length === 0
            ? `<div class="empty-state">予定はまだありません</div>`
            : dayEvents
                .map(
                  (ev) => `
          <div class="event-card ${ev.done ? "is-done" : ""}">
            <button class="event-card__check" data-action="toggle-done" data-id="${ev.id}">${ev.done ? "✓" : ""}</button>
            ${ev.photo ? `<img class="event-card__photo" src="${ev.photo}" alt="" />` : ""}
            <div class="event-card__time">${ev.time ? escapeHtml(ev.time) : "終日"}</div>
            <div class="event-card__body">
              <div class="event-card__title">${escapeHtml(ev.title)}</div>
              ${ev.memo ? `<div class="event-card__memo">${escapeHtml(ev.memo)}</div>` : ""}
            </div>
            <button class="event-card__del" data-action="delete" data-id="${ev.id}">削除</button>
          </div>`
                )
                .join("")
        }
      </div>
      <form class="event-form card" id="event-form">
        <input class="input" id="ev-title" placeholder="予定のタイトル" maxlength="60" required />
        <div class="event-form__row">
          <input class="input" type="time" id="ev-time" />
          <input class="input" id="ev-memo" placeholder="メモ(任意)" maxlength="80" />
        </div>
        <div class="event-form__photo-row">
          <button type="button" class="event-form__photo-btn" id="ev-photo-btn">📷 思い出の写真を追加</button>
          <input type="file" accept="image/*" id="ev-photo-input" hidden />
          <div class="event-form__photo-preview" id="ev-photo-preview">
            <img id="ev-photo-preview-img" alt="" />
            <button type="button" class="event-form__photo-remove" id="ev-photo-remove">外す</button>
          </div>
        </div>
        <button class="btn btn-primary btn-block" type="submit">この日に予定を追加</button>
      </form>
    `;

    daySection.querySelector("#event-list").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      if (btn.dataset.action === "delete") store.removeEvent(btn.dataset.id);
      else if (btn.dataset.action === "toggle-done") store.toggleEventDone(btn.dataset.id);
    });

    const photoBtn = daySection.querySelector("#ev-photo-btn");
    const photoInput = daySection.querySelector("#ev-photo-input");
    const photoPreview = daySection.querySelector("#ev-photo-preview");
    const photoPreviewImg = daySection.querySelector("#ev-photo-preview-img");
    photoBtn.addEventListener("click", () => photoInput.click());
    photoInput.addEventListener("change", async () => {
      const file = photoInput.files?.[0];
      if (!file) return;
      try {
        pendingEventPhoto = await compressImageFile(file);
        photoPreviewImg.src = pendingEventPhoto;
        photoPreview.classList.add("is-visible");
      } catch {
        showToast("写真の読み込みに失敗しました");
      }
    });
    daySection.querySelector("#ev-photo-remove").addEventListener("click", () => {
      pendingEventPhoto = null;
      photoInput.value = "";
      photoPreview.classList.remove("is-visible");
    });

    daySection.querySelector("#event-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = daySection.querySelector("#ev-title").value;
      const time = daySection.querySelector("#ev-time").value;
      const memo = daySection.querySelector("#ev-memo").value;
      const submitBtn = e.target.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      try {
        await store.addEvent({ date: selectedKey, time, title, memo, photo: pendingEventPhoto });
      } catch {
        showToast("保存に失敗しました。写真が大きすぎるかもしれません");
        submitBtn.disabled = false;
        return;
      }
      submitBtn.disabled = false;
      e.target.reset();
    });
  }

  function renderAll() {
    renderGrid();
    renderDaySection();
  }

  gridEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".calendar-cell[data-date]");
    if (!btn) return;
    selectedKey = btn.dataset.date;
    renderGrid();
    renderDaySection();
  });

  root.querySelector("#cal-prev").addEventListener("click", () => {
    viewMonth -= 1;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear -= 1;
    }
    renderGrid();
  });
  root.querySelector("#cal-next").addEventListener("click", () => {
    viewMonth += 1;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear += 1;
    }
    renderGrid();
  });

  const unsubscribe = store.subscribeEvents((events) => {
    allEvents = events;
    renderAll();
  });
  return () => unsubscribe();
}
