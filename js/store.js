// データ層。Firestoreのリアルタイム購読(onSnapshot)でクラウド同期する。
// 画面側からの呼び出し方(getX/subscribeX/addX...)はローカル版から変えていない。

import { db, getCurrentUser } from "./auth.js";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDocs,
  onSnapshot,
  increment,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { dateKeyOf, toDateKey } from "./util.js";

// Firestoreの1ドキュメントは1MBまでのため、写真(base64)はこれより十分小さく保つ
const MAX_PHOTO_BYTES = 700000;
function assertPhotoSize(photo) {
  if (photo && photo.length > MAX_PHOTO_BYTES) {
    throw new Error("STORAGE_FULL");
  }
}

export const DEFAULT_LISTS = [
  { id: "wanna-go", name: "行きたい場所", emoji: "🗺️", icon: "assets/icons/pin.png", tagLabel: "行きたい!" },
  { id: "wanna-do", name: "したいこと", emoji: "✨", icon: "assets/icons/star.png", tagLabel: "したい!" },
  { id: "wanna-share", name: "共有したいこと", emoji: "💌", icon: "assets/icons/envelope.png", tagLabel: "シェアしたい!" },
];

const DEFAULT_PROFILE = {
  people: [
    { name: "わたし", avatar: "🐶", photo: null, bio: "" },
    { name: "友だち", avatar: "🐱", photo: null, bio: "" },
  ],
  startDate: null,
};

let coupleId = null;
let posts = [];
let listItems = {}; // { [listId]: Item[] }
let events = [];
let profile = DEFAULT_PROFILE;
let photoFavoriteIds = new Set();
let standalonePhotos = [];
let albums = [];
let coupleMembers = [];
let lastSeen = {};

const listeners = {
  posts: new Set(),
  lists: new Set(),
  events: new Set(),
  profile: new Set(),
  photos: new Set(),
  albums: new Set(),
  lastSeen: new Set(),
};
const getters = {
  posts: () => getPosts(),
  lists: () => getLists(),
  events: () => getEvents(),
  photos: () => getAllPhotos(),
  profile: () => getProfile(),
  albums: () => getAlbums(),
  lastSeen: () => lastSeen,
};
function notify(key) {
  const value = getters[key]();
  listeners[key].forEach((cb) => cb(value));
}
function subscribe(key, cb) {
  listeners[key].add(cb);
  cb(getters[key]());
  return () => listeners[key].delete(cb);
}

const col = (name) => collection(db, "couples", coupleId, name);
const ref = (name, id) => doc(db, "couples", coupleId, name, id);

let unsubFns = [];

// ログイン後、所属するカップルが決まったタイミングで一度だけ呼ぶ
export function init(id) {
  coupleId = id;
  unsubFns.forEach((fn) => fn());
  unsubFns = [];

  unsubFns.push(
    onSnapshot(col("posts"), (snap) => {
      posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      notify("posts");
      notify("photos");
    })
  );

  unsubFns.push(
    onSnapshot(col("listItems"), (snap) => {
      const next = {};
      snap.docs.forEach((d) => {
        const item = { id: d.id, ...d.data() };
        if (!next[item.listId]) next[item.listId] = [];
        next[item.listId].push(item);
      });
      listItems = next;
      notify("lists");
    })
  );

  unsubFns.push(
    onSnapshot(col("events"), (snap) => {
      events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      notify("events");
      notify("photos");
    })
  );

  unsubFns.push(
    onSnapshot(col("photos"), (snap) => {
      standalonePhotos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      notify("photos");
    })
  );

  unsubFns.push(
    onSnapshot(col("albums"), (snap) => {
      albums = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      notify("albums");
    })
  );

  unsubFns.push(
    onSnapshot(doc(db, "couples", coupleId), (snap) => {
      const data = snap.data() || {};
      profile = data.profile || DEFAULT_PROFILE;
      photoFavoriteIds = new Set(data.photoFavorites || []);
      coupleMembers = data.members || [];
      notify("profile");
      notify("photos");
    })
  );

  const uid = getCurrentUser()?.uid;
  if (uid) {
    unsubFns.push(
      onSnapshot(doc(db, "users", uid), (snap) => {
        lastSeen = (snap.data() || {}).lastSeen || {};
        notify("lastSeen");
      })
    );
  }
}

// ---- profile ----
function getProfile() {
  return profile;
}
async function setProfile(next) {
  profile = { ...profile, ...next };
  await setDoc(doc(db, "couples", coupleId), { profile }, { merge: true });
}
function subscribeProfile(cb) {
  return subscribe("profile", cb);
}
function getDaysTogether() {
  if (!profile.startDate) return null;
  const [y, m, d] = profile.startDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const diff = Math.floor((Date.now() - start.getTime()) / 86400000);
  return diff >= 0 ? diff + 1 : null;
}
// ログイン中の自分が profile.people の何番目か(0 or 1)。カップル作成/参加した順。
function getMyAuthorIndex() {
  const uid = getCurrentUser()?.uid;
  const idx = coupleMembers.indexOf(uid);
  return idx === -1 ? 0 : idx;
}

// ---- 既読管理(アプリ内通知バッジ用) ----
function getLastSeen(key) {
  return lastSeen[key] || 0;
}
async function markSeen(key) {
  const uid = getCurrentUser()?.uid;
  if (!uid) return;
  lastSeen = { ...lastSeen, [key]: Date.now() };
  await setDoc(doc(db, "users", uid), { lastSeen: { [key]: lastSeen[key] } }, { merge: true });
}
function subscribeLastSeen(cb) {
  return subscribe("lastSeen", cb);
}
// パートナー(自分以外)からの新着投稿数
function getUnseenPostCount() {
  const myIndex = getMyAuthorIndex();
  const since = getLastSeen("timeline");
  return posts.filter((p) => (p.author ?? 0) !== myIndex && p.createdAt > since).length;
}

// ---- posts ----
function getPosts() {
  return [...posts].sort((a, b) => b.createdAt - a.createdAt);
}
async function addPost(text, photo, author = 0) {
  const trimmed = (text || "").trim();
  if (!trimmed && !photo) return;
  assertPhotoSize(photo);
  await addDoc(col("posts"), {
    text: trimmed,
    photo: photo || null,
    author,
    createdAt: Date.now(),
    reactions: { "❤️": 0, "👍": 0, "😂": 0 },
  });
}
function removePost(id) {
  return deleteDoc(ref("posts", id));
}
function reactPost(postId, emoji) {
  return updateDoc(ref("posts", postId), { [`reactions.${emoji}`]: increment(1) });
}
function subscribePosts(cb) {
  return subscribe("posts", cb);
}

// ---- lists ----
function ensureList(listId) {
  if (!listItems[listId]) listItems[listId] = [];
  return listItems[listId];
}
function getLists() {
  return DEFAULT_LISTS.map((def) => ({
    ...def,
    items: [...ensureList(def.id)].sort((a, b) => a.done - b.done || b.createdAt - a.createdAt),
    doneCount: ensureList(def.id).filter((i) => i.done).length,
    openCount: ensureList(def.id).filter((i) => !i.done).length,
  }));
}
function getTotalDoneCount() {
  return Object.values(listItems).reduce((sum, items) => sum + items.filter((i) => i.done).length, 0);
}
async function addItem(listId, text, photo) {
  const trimmed = (text || "").trim();
  if (!trimmed) return;
  assertPhotoSize(photo);
  await addDoc(col("listItems"), {
    listId,
    text: trimmed,
    photo: photo || null,
    done: false,
    favorite: false,
    createdAt: Date.now(),
    doneAt: null,
  });
}
function toggleItem(listId, itemId) {
  const item = ensureList(listId).find((i) => i.id === itemId);
  if (!item) return;
  const done = !item.done;
  updateDoc(ref("listItems", itemId), { done, doneAt: done ? Date.now() : null });
  return done;
}
function toggleFavorite(listId, itemId) {
  const item = ensureList(listId).find((i) => i.id === itemId);
  if (!item) return;
  const favorite = !item.favorite;
  updateDoc(ref("listItems", itemId), { favorite });
  return favorite;
}
function subscribeLists(cb) {
  return subscribe("lists", cb);
}

// ---- events ----
function getEvents() {
  return [...events].sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
}
async function addEvent({ date, time, title, memo, photo }) {
  const trimmedTitle = (title || "").trim();
  if (!date || !trimmedTitle) return;
  assertPhotoSize(photo);
  await addDoc(col("events"), {
    date,
    time: time || null,
    title: trimmedTitle,
    memo: (memo || "").trim(),
    photo: photo || null,
    done: false,
    createdAt: Date.now(),
  });
}
function toggleEventDone(id) {
  const event = events.find((e) => e.id === id);
  if (!event) return;
  return updateDoc(ref("events", id), { done: !event.done });
}
// 既存の予定を編集する。指定したフィールドだけを上書きし、他は変更しない
// (作成日時や完了状態、二人のどちらが作ったかなどはそのまま残る)
async function updateEvent(id, { date, time, title, memo, photo }) {
  const trimmedTitle = (title || "").trim();
  if (!trimmedTitle) return;
  assertPhotoSize(photo);
  await updateDoc(ref("events", id), {
    date,
    time: time || null,
    title: trimmedTitle,
    memo: (memo || "").trim(),
    photo: photo || null,
  });
}
function removeEvent(id) {
  return deleteDoc(ref("events", id));
}
function subscribeEvents(cb) {
  return subscribe("events", cb);
}
// 今日以降でいちばん近い、未完了の予定
function getNextEvent() {
  const todayKey = toDateKey(new Date());
  return getEvents().find((e) => !e.done && e.date >= todayKey) || null;
}

// ---- アルバム ----
function getAlbums() {
  return [...albums].sort((a, b) => b.createdAt - a.createdAt);
}
async function createAlbum(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return;
  const docRef = await addDoc(col("albums"), { name: trimmed, createdAt: Date.now() });
  return docRef.id;
}
async function renameAlbum(albumId, name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return;
  await updateDoc(ref("albums", albumId), { name: trimmed });
}
async function removeAlbum(albumId) {
  await deleteDoc(ref("albums", albumId));
}
function subscribeAlbums(cb) {
  return subscribe("albums", cb);
}
// 写真(post:/event:/photo: プレフィックス付きID)をアルバムに割り当てる。albumId=nullで外す
async function setPhotoAlbum(photoId, albumId) {
  if (photoId.startsWith("post:")) {
    await updateDoc(ref("posts", photoId.slice("post:".length)), { albumId: albumId || null });
  } else if (photoId.startsWith("event:")) {
    await updateDoc(ref("events", photoId.slice("event:".length)), { albumId: albumId || null });
  } else if (photoId.startsWith("photo:")) {
    await updateDoc(ref("photos", photoId.slice("photo:".length)), { albumId: albumId || null });
  }
}

// ---- 写真ギャラリー ----
// 投稿・カレンダー予定に添付された写真に加え、アルバムへ直接追加した写真もまとめて「思い出」として扱う
function getAllPhotos() {
  const fromPosts = posts
    .filter((p) => p.photo)
    .map((p) => ({
      id: `post:${p.id}`,
      photo: p.photo,
      caption: p.text,
      at: p.createdAt,
      dateKey: dateKeyOf(p.createdAt),
      albumId: p.albumId || null,
    }));
  const fromEvents = events
    .filter((e) => e.photo)
    .map((e) => ({
      id: `event:${e.id}`,
      photo: e.photo,
      caption: e.title,
      at: e.createdAt,
      dateKey: e.date,
      albumId: e.albumId || null,
    }));
  const fromAlbum = standalonePhotos.map((p) => ({
    id: `photo:${p.id}`,
    photo: p.photo,
    caption: p.caption,
    at: p.createdAt,
    dateKey: p.date,
    albumId: p.albumId || null,
  }));
  return [...fromPosts, ...fromEvents, ...fromAlbum]
    .map((p) => ({ ...p, favorite: photoFavoriteIds.has(p.id) }))
    .sort((a, b) => b.at - a.at);
}
async function togglePhotoFavorite(id) {
  if (photoFavoriteIds.has(id)) photoFavoriteIds.delete(id);
  else photoFavoriteIds.add(id);
  await setDoc(doc(db, "couples", coupleId), { photoFavorites: [...photoFavoriteIds] }, { merge: true });
}
// ホームのハイライトから写真タブへ遷移する際、開くアルバムを一時的に受け渡す
let pendingAlbumOpen = null;
function requestOpenAlbum(albumId) {
  pendingAlbumOpen = albumId;
}
function consumePendingAlbumOpen() {
  const id = pendingAlbumOpen;
  pendingAlbumOpen = null;
  return id;
}
// アルバムに写真を直接追加する(投稿や予定に紐付かない単独の思い出)
async function addPhoto(photo, caption, date) {
  if (!photo) return;
  assertPhotoSize(photo);
  await addDoc(col("photos"), {
    photo,
    caption: (caption || "").trim(),
    date: date || toDateKey(new Date()),
    createdAt: Date.now(),
    albumId: null,
  });
}
// id は `photo:` プレフィックス付き(getAllPhotosが返す形式)のどちらでも受け付ける
function removePhoto(id) {
  const rawId = id.startsWith("photo:") ? id.slice("photo:".length) : id;
  return deleteDoc(ref("photos", rawId));
}
function subscribePhotos(cb) {
  return subscribe("photos", cb);
}

async function resetAll() {
  const names = ["posts", "listItems", "events", "photos", "albums"];
  for (const name of names) {
    const snap = await getDocs(col(name));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }
  await setDoc(doc(db, "couples", coupleId), { photoFavorites: [] }, { merge: true });
}

export const store = {
  init,
  getProfile,
  setProfile,
  subscribeProfile,
  getDaysTogether,
  getMyAuthorIndex,
  getLastSeen,
  markSeen,
  subscribeLastSeen,
  getUnseenPostCount,
  getPosts,
  addPost,
  removePost,
  reactPost,
  subscribePosts,
  getLists,
  getTotalDoneCount,
  addItem,
  toggleItem,
  toggleFavorite,
  subscribeLists,
  getEvents,
  addEvent,
  updateEvent,
  toggleEventDone,
  removeEvent,
  subscribeEvents,
  getNextEvent,
  getAlbums,
  createAlbum,
  renameAlbum,
  removeAlbum,
  subscribeAlbums,
  setPhotoAlbum,
  requestOpenAlbum,
  consumePendingAlbumOpen,
  getAllPhotos,
  togglePhotoFavorite,
  addPhoto,
  removePhoto,
  subscribePhotos,
  resetAll,
};
