// プロフィールページ専用の「背景テーマ」。
// アプリ全体の配色(theme.js)とは完全に別物で、ひとりひとりが自分のプロフィールにだけ設定する。
// テーマを選ぶと、背景色・メインキャラクター・装飾がまとめて描かれた画像(hero)が切り替わる。
// hero画像は提供されたデザイン素材(OUR_DAYS_background_themes)から、ステータスバー/ヘッダー部分を
// 除いて背景・キャラクター・あいさつ文だけを残す形で切り出したもの。

export const PROFILE_THEMES = [
  { id: "pink", label: "ピンク", sub: "うさぎ", hero: "assets/themes/pink-hero.png", character: "assets/characters/rabbit.png", bg: "#FFE3EC" },
  { id: "yellow", label: "イエロー", sub: "いぬ", hero: "assets/themes/yellow-hero.png", character: "assets/characters/dog.png", bg: "#FFF3C4" },
  { id: "blue", label: "ブルー", sub: "さかな", hero: "assets/themes/blue-hero.png", character: "assets/characters/fish.png", bg: "#DCEEFF" },
  { id: "green", label: "グリーン", sub: "はっぱ", hero: "assets/themes/green-hero.png", character: "assets/characters/leaf.png", bg: "#E1F5E6" },
  { id: "purple", label: "パープル", sub: "はな", hero: "assets/themes/purple-hero.png", character: "assets/characters/flower.png", bg: "#F1E6FB" },
  { id: "red", label: "レッド", sub: "はーと", hero: "assets/themes/red-hero.png", character: "assets/characters/heart-buddy.png", bg: "#FFE1E1" },
  { id: "beige", label: "ベージュ", sub: "食パン", hero: "assets/themes/beige-hero.png", character: "assets/characters/bread.png", bg: "#FBF1E3" },
  { id: "lightblue", label: "ライトブルー", sub: "とり", hero: "assets/themes/lightblue-hero.png", character: "assets/characters/bird.png", bg: "#E4F6FB" },
  { id: "orange", label: "オレンジ", sub: "ほし", hero: "assets/themes/orange-hero.png", character: "assets/characters/star.png", bg: "#FFEBD6" },
  { id: "cherry", label: "チェリー", sub: "さくらんぼ", hero: "assets/themes/cherry-hero.png", character: "assets/characters/cherries.png", bg: "#FFE0EA" },
  { id: "navy", label: "ネイビー", sub: "ねこ", hero: "assets/themes/navy-hero.png", character: "assets/characters/cat.png", bg: "#E4E8F5" },
  { id: "rainbow", label: "レインボー", sub: "にじ", hero: "assets/themes/rainbow-hero.png", character: "assets/decorations/rainbow.png", bg: "#FFF6E9" },
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
