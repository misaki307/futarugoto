// Firebase Authentication + ペアリング(招待コード)まわりのロジック。
// store.js はここで作る db / coupleId を使ってデータを読み書きする。

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  arrayUnion,
  enableIndexedDbPersistence,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});
enableIndexedDbPersistence(db).catch(() => {});

export function subscribeAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function signUp(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export function logOut() {
  return signOut(auth);
}

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい 0/O, 1/I を除外
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// このユーザーが所属している全グループ(カップル)のIDを返す。
// 古いデータ(単一の coupleId しか持たない頃のアカウント)にも対応するため、
// coupleIds 配列が無ければ単一の coupleId をフォールバックとして使う。
export async function getMyGroups(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return [];
  const data = snap.data();
  if (Array.isArray(data.coupleIds) && data.coupleIds.length) return data.coupleIds;
  return data.coupleId ? [data.coupleId] : [];
}

// ユーザーの所属グループ一覧に1件追加する(既存分は消さない)
async function addGroupToUser(uid, coupleId) {
  const snap = await getDoc(doc(db, "users", uid));
  const data = snap.exists() ? snap.data() : {};
  const current = Array.isArray(data.coupleIds) && data.coupleIds.length ? data.coupleIds : data.coupleId ? [data.coupleId] : [];
  const next = current.includes(coupleId) ? current : [...current, coupleId];
  await setDoc(doc(db, "users", uid), { coupleIds: next }, { merge: true });
}

// 新しいカップル(2人組の共有スペース)を作り、招待コードを発行する。
// 招待コードは inviteCodes/{code} という別ドキュメントに保存する。
// (couples/{coupleId} 自体は非公開データも含むため、まだメンバーでない人には検索させたくない。
//  inviteCodes は coupleId への案内板だけを持つので、誰でも読めても問題ない)
export async function createCouple(uid) {
  const code = randomCode();
  const coupleRef = doc(collection(db, "couples"));
  await setDoc(coupleRef, { code, members: [uid], createdAt: Date.now() });
  await setDoc(doc(db, "inviteCodes", code), { coupleId: coupleRef.id });
  await addGroupToUser(uid, coupleRef.id);
  return { coupleId: coupleRef.id, code };
}

// 招待コードを使って既存のカップルに参加する。
// couples/{coupleId} はメンバー以外は読めない設計のため、参加前に中身を確認する
// 事前チェックはできない。そのままFirestoreへ更新を試み、ルール側で
// (メンバー本人 or まだ1人しかいない枠への参加)だけを許可する。
export async function joinCouple(uid, code) {
  const trimmed = code.trim().toUpperCase();
  const inviteSnap = await getDoc(doc(db, "inviteCodes", trimmed));
  if (!inviteSnap.exists()) throw new Error("NOT_FOUND");
  const coupleId = inviteSnap.data().coupleId;
  const coupleRef = doc(db, "couples", coupleId);
  try {
    await updateDoc(coupleRef, { members: arrayUnion(uid) });
  } catch {
    throw new Error("FULL");
  }
  await addGroupToUser(uid, coupleId);
  return coupleId;
}

export async function getCoupleInfo(coupleId) {
  const snap = await getDoc(doc(db, "couples", coupleId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
