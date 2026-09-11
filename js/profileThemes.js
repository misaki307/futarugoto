// プロフィールページ専用の「背景テーマ」。
// アプリ全体の配色(theme.js)とは完全に別物で、ひとりひとりが自分のプロフィールにだけ設定する。
// キャラクターは使わず、色・グラデーション・装飾だけのシンプルな背景(hero画像)を選べる。
// プロフィールアイコン(ICON_ASSETS)とは完全に独立していて、背景テーマを変えてもアイコンは変わらない。

export const PROFILE_THEMES = [
  { id: "pink", label: "ピンク", hero: "assets/themes/pink-hero.jpg", bg: "#FFE3EC" },
  { id: "yellow", label: "イエロー", hero: "assets/themes/yellow-hero.jpg", bg: "#FFF3C4" },
  { id: "blue", label: "ブルー", hero: "assets/themes/blue-hero.jpg", bg: "#DCEEFF" },
  { id: "green", label: "グリーン", hero: "assets/themes/green-hero.jpg", bg: "#E1F5E6" },
  { id: "purple", label: "パープル", hero: "assets/themes/purple-hero.jpg", bg: "#F1E6FB" },
  { id: "red", label: "レッド", hero: "assets/themes/red-hero.jpg", bg: "#FFE1E1" },
  { id: "beige", label: "ベージュ", hero: "assets/themes/beige-hero.jpg", bg: "#FBF1E3" },
  { id: "lightblue", label: "ライトブルー", hero: "assets/themes/lightblue-hero.jpg", bg: "#E4F6FB" },
  { id: "orange", label: "オレンジ", hero: "assets/themes/orange-hero.jpg", bg: "#FFEBD6" },
  { id: "cherry", label: "チェリー", hero: "assets/themes/cherry-hero.jpg", bg: "#FFE0EA" },
  { id: "navy", label: "ネイビー", hero: "assets/themes/navy-hero.jpg", bg: "#E4E8F5" },
  { id: "rainbow", label: "レインボー", hero: "assets/themes/rainbow-hero.jpg", bg: "#FFF6E9" },
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
