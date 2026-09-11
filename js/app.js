import { initTheme } from "./theme.js";
import { store } from "./store.js";
import { subscribeAuth, getMyGroups, getCurrentUser } from "./auth.js";
import * as authView from "./views/auth.js";
import * as home from "./views/home.js";
import * as timeline from "./views/timeline.js";
import * as lists from "./views/lists.js";
import * as calendar from "./views/calendar.js";
import * as photos from "./views/photos.js";
import * as settings from "./views/settings.js";

const views = { home, timeline, lists, calendar, photos, settings };
const root = document.getElementById("view-root");
const tabBar = document.querySelector(".tab-bar");
const tabButtons = document.querySelectorAll(".tab-bar__item");
const timelineBadge = document.getElementById("tab-badge-timeline");

const LAST_GROUP_KEY = "sharedapp:v1:lastCoupleId";

let cleanup = null;

function switchView(viewName) {
  const view = views[viewName];
  if (!view) return;
  if (cleanup) cleanup();
  tabButtons.forEach((btn) => {
    if (btn.dataset.view === viewName) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });
  root.scrollTop = 0;
  root.dataset.view = viewName;
  cleanup = view.mount(root, switchView) || null;
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

function showAuthScreen(stage, user, extra = {}) {
  tabBar.hidden = true;
  if (cleanup) cleanup();
  root.removeAttribute("data-view");
  root.scrollTop = 0;
  cleanup = authView.mount(root, { stage, user, onReady: (coupleId) => enterApp(coupleId), ...extra }) || null;
}

// タイムラインに新着があれば、どの画面を見ていてもタブに気づけるようバッジで知らせる
function updateTimelineBadge() {
  const count = store.getUnseenPostCount();
  timelineBadge.hidden = count === 0;
  timelineBadge.textContent = count > 9 ? "9+" : String(count);
}

function enterApp(coupleId) {
  store.init(coupleId);
  try {
    localStorage.setItem(LAST_GROUP_KEY, coupleId);
  } catch {}
  tabBar.hidden = false;
  store.subscribePosts(updateTimelineBadge);
  store.subscribeLastSeen(updateTimelineBadge);
  switchView("home");
}

// 設定画面などから、いつでもグループの選択・追加画面に戻れるようにする入り口。
// ログアウトはせず、同じアカウントのまま所属グループを選び直せる。
export function openGroupPicker() {
  const user = getCurrentUser();
  if (!user) return;
  const previousView = root.dataset.view || "home";
  showAuthScreen("pair", user, {
    onBack: () => {
      tabBar.hidden = false;
      switchView(previousView);
    },
  });
}

initTheme();

subscribeAuth(async (user) => {
  if (!user) {
    showAuthScreen("login", null);
    return;
  }
  try {
    const groups = await getMyGroups(user.uid);
    if (groups.length === 0) {
      showAuthScreen("pair", user);
      return;
    }
    let last = null;
    try {
      last = localStorage.getItem(LAST_GROUP_KEY);
    } catch {}
    enterApp(last && groups.includes(last) ? last : groups[0]);
  } catch {
    showAuthScreen("pair", user);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
