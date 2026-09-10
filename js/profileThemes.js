// プロフィールページ専用の「背景テーマ」。
// アプリ全体の配色(theme.js)とは完全に別物で、ひとりひとりが自分のプロフィールにだけ設定する。
// テーマを選ぶと、背景色・メインキャラクター・吹き出しの一言が一緒に切り替わる。

export const PROFILE_THEMES = [
  { id: "pink", label: "ピンク", sub: "うさぎ", character: "assets/characters/rabbit.png", bg: "#FFE3EC", bg2: "#FFF6F8", accent: "#FF6F91", greeting: "GOOD DAY!" },
  { id: "yellow", label: "イエロー", sub: "いぬ", character: "assets/characters/dog.png", bg: "#FFF3C4", bg2: "#FFFBEA", accent: "#E8A400", greeting: "HELLO!" },
  { id: "blue", label: "ブルー", sub: "さかな", character: "assets/characters/fish.png", bg: "#DCEEFF", bg2: "#F0F8FF", accent: "#2F7BD9", greeting: "GOOD DAY!" },
  { id: "green", label: "グリーン", sub: "はっぱ", character: "assets/characters/leaf.png", bg: "#E1F5E6", bg2: "#F1FAF3", accent: "#2FA360", greeting: "いつもありがとう" },
  { id: "purple", label: "パープル", sub: "はな", character: "assets/characters/flower.png", bg: "#F1E6FB", bg2: "#F8F2FD", accent: "#9B6BD1", greeting: "すてきな毎日に" },
  { id: "red", label: "レッド", sub: "はーと", character: "assets/characters/heart-buddy.png", bg: "#FFE1E1", bg2: "#FFF3F3", accent: "#E5484D", greeting: "LOVE YOU!" },
  { id: "beige", label: "ベージュ", sub: "食パン", character: "assets/characters/bread.png", bg: "#FBF1E3", bg2: "#FFFAF2", accent: "#C08A3E", greeting: "のんびりいこう" },
  { id: "lightblue", label: "ライトブルー", sub: "とり", character: "assets/characters/bird.png", bg: "#E4F6FB", bg2: "#F2FBFD", accent: "#2E9DB8", greeting: "GOOD MORNING!" },
  { id: "orange", label: "オレンジ", sub: "ほし", character: "assets/characters/star.png", bg: "#FFEBD6", bg2: "#FFF6EC", accent: "#FF9540", greeting: "GOOD DAY!" },
  { id: "cherry", label: "チェリー", sub: "さくらんぼ", character: "assets/characters/cherries.png", bg: "#FFE0EA", bg2: "#FFF1F5", accent: "#D6336C", greeting: "あまずっぱい毎日" },
  { id: "navy", label: "ネイビー", sub: "ねこ", character: "assets/characters/cat.png", bg: "#E4E8F5", bg2: "#F1F3FA", accent: "#3B4A78", greeting: "おつかれさま" },
  {
    id: "rainbow",
    label: "レインボー",
    sub: "にじ",
    character: "assets/decorations/rainbow.png",
    bg: "linear-gradient(135deg, #FFE3EC, #FFF3C4, #DCEEFF, #E1F5E6, #F1E6FB)",
    bg2: "#FFFDF7",
    accent: "#FF6F91",
    greeting: "自分だけのいろどりを",
  },
];

export function getProfileTheme(id) {
  return PROFILE_THEMES.find((t) => t.id === id) || PROFILE_THEMES[0];
}

// プロフィールアイコンとして選べる、アプリ内のキャラクター素材一覧
export const ICON_ASSETS = [
  { id: "rabbit", path: "assets/characters/rabbit.png", label: "うさぎ" },
  { id: "dog", path: "assets/characters/dog.png", label: "いぬ" },
  { id: "cat", path: "assets/characters/cat.png", label: "ねこ" },
  { id: "fish", path: "assets/characters/fish.png", label: "さかな" },
  { id: "bird", path: "assets/characters/bird.png", label: "とり" },
  { id: "cherries", path: "assets/characters/cherries.png", label: "チェリー" },
  { id: "bread", path: "assets/characters/bread.png", label: "食パン" },
  { id: "flower", path: "assets/characters/flower.png", label: "はな" },
  { id: "leaf", path: "assets/characters/leaf.png", label: "はっぱ" },
  { id: "heart-buddy", path: "assets/characters/heart-buddy.png", label: "ハート" },
  { id: "star", path: "assets/characters/star.png", label: "ほし" },
  { id: "rainbow", path: "assets/decorations/rainbow.png", label: "レインボー" },
];

export const MBTI_OPTIONS = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

export const BLOOD_TYPE_OPTIONS = ["A型", "B型", "O型", "AB型"];
