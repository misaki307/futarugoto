const KEY = "sharedapp:v1:theme";

export const THEMES = [
  { id: "classic", name: "ブルー&イエロー", desc: "青と黄色のポップな定番カラー", swatch: ["#0058A3", "#FFDA1A", "#F3F5F8"] },
  { id: "natural", name: "ナチュラル", desc: "木目とセージグリーンの落ち着いた配色", swatch: ["#7C9473", "#E3A857", "#F6F1E7"] },
  { id: "dark", name: "ダーク", desc: "夜でも目に優しいダークモード", swatch: ["#4C8DFF", "#FFDA1A", "#12151C"] },
  { id: "cherry", name: "チェリー", desc: "さくらんぼみたいな甘辛ピンク", swatch: ["#D6336C", "#40C463", "#FFF3F4"] },
  { id: "soda", name: "クリームソーダ", desc: "ミントとチェリーのソーダポップ", swatch: ["#3FB68A", "#FF6F61", "#F2FBF6"] },
  { id: "retro", name: "レトロ", desc: "70年代っぽいマスタード×アボカド", swatch: ["#C9622A", "#4C7A5A", "#F4E8D0"] },
  { id: "mono", name: "モノクロ", desc: "白黒だけのミニマルな配色", swatch: ["#2B2B2B", "#B5B5B5", "#F2F2F2"] },
];

export function getTheme() {
  const saved = localStorage.getItem(KEY);
  return THEMES.some((t) => t.id === saved) ? saved : "classic";
}

export function setTheme(id) {
  localStorage.setItem(KEY, id);
  document.documentElement.setAttribute("data-theme", id);
}

export function initTheme() {
  document.documentElement.setAttribute("data-theme", getTheme());
}
