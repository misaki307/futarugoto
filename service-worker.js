const CACHE_NAME = "sharedapp-v6";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/tokens.css",
  "./css/base.css",
  "./css/components.css",
  "./js/app.js",
  "./js/store.js",
  "./js/theme.js",
  "./js/profileThemes.js",
  "./js/util.js",
  "./js/auth.js",
  "./js/firebase-config.js",
  "./js/views/auth.js",
  "./js/views/home.js",
  "./js/views/timeline.js",
  "./js/views/lists.js",
  "./js/views/calendar.js",
  "./js/views/photos.js",
  "./js/views/settings.js",
  "./js/views/profile.js",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// ネットワーク優先: 常に最新のファイルを取得し、オフライン時だけキャッシュにフォールバックする。
// (以前はキャッシュ優先だったため、デプロイ後もしばらく古い画面が表示され続ける不具合があった)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
