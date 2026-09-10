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
  query,
  where,
  getDocs,
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

// このユーザーが既にどこかのカップルに所属していればそのIDを返す
export async function getMyCoupleId(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data().coupleId || null : null;
}

// 新しいカップル(2人組の共有スペース)を作り、招待コードを発行する
export async function createCouple(uid) {
  const code = randomCode();
  const coupleRef = doc(collection(db, "couples"));
  await setDoc(coupleRef, { code, members: [uid], createdAt: Date.now() });
  await setDoc(doc(db, "users", uid), { coupleId: coupleRef.id }, { merge: true });
  return { coupleId: coupleRef.id, code };
}

// 招待コードを使って既存のカップルに参加する
export async function joinCouple(uid, code) {
  const trimmed = code.trim().toUpperCase();
  const q = query(collection(db, "couples"), where("code", "==", trimmed));
  const snaps = await getDocs(q);
  if (snaps.empty) throw new Error("NOT_FOUND");
  const coupleDoc = snaps.docs[0];
  const data = coupleDoc.data();
  if (!data.members.includes(uid)) {
    if (data.members.length >= 2) throw new Error("FULL");
    await updateDoc(coupleDoc.ref, { members: arrayUnion(uid) });
  }
  await setDoc(doc(db, "users", uid), { coupleId: coupleDoc.id }, { merge: true });
  return coupleDoc.id;
}

export async function getCoupleInfo(coupleId) {
  const snap = await getDoc(doc(db, "couples", coupleId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
