import { initTheme } from "./theme.js";
import { store } from "./store.js";
import { subscribeAuth, getMyCoupleId } from "./auth.js";
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

function showAuthScreen(stage, user) {
  tabBar.hidden = true;
  if (cleanup) cleanup();
  root.removeAttribute("data-view");
  root.scrollTop = 0;
  cleanup = authView.mount(root, { stage, user, onReady: () => enterApp(user) }) || null;
}

function enterApp(user) {
  store.init(user.__coupleId);
  tabBar.hidden = false;
  switchView("home");
}

initTheme();

subscribeAuth(async (user) => {
  if (!user) {
    showAuthScreen("login", null);
    return;
  }
  try {
    const coupleId = await getMyCoupleId(user.uid);
    if (!coupleId) {
      showAuthScreen("pair", user);
      return;
    }
    user.__coupleId = coupleId;
    enterApp(user);
  } catch {
    showAuthScreen("pair", user);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
