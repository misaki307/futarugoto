// プロフィールページ専用の「アクセントカラー」。
// 画面全体の背景は常に共通のクリーム色(--screen-home-bg)のままで、
// ここで選んだ色は編集ボタンやアイコンのふち、Today/Nextの見出しなど一部の装飾にだけ使う。
// プロフィールアイコン(ICON_ASSETS)とは完全に独立していて、アクセントカラーを変えてもアイコンは変わらない。

export const ACCENT_COLORS = [
  { id: "pink", label: "ピンク", color: "#F06BA8" },
  { id: "yellow", label: "イエロー", color: "#E8A93D" },
  { id: "blue", label: "ブルー", color: "#2F80D6" },
  { id: "green", label: "グリーン", color: "#4CAF7D" },
  { id: "purple", label: "パープル", color: "#9B6FD1" },
  { id: "red", label: "レッド", color: "#E14F4F" },
  { id: "beige", label: "ベージュ", color: "#B98A55" },
  { id: "lightblue", label: "ライトブルー", color: "#4FB6E0" },
  { id: "orange", label: "オレンジ", color: "#F08A3C" },
  { id: "cherry", label: "チェリー", color: "#D6336C" },
  { id: "navy", label: "ネイビー", color: "#3E4E7D" },
  { id: "rainbow", label: "ラベンダー", color: "#7C6FD1" },
];

export function getAccentColor(id) {
  return ACCENT_COLORS.find((c) => c.id === id) || ACCENT_COLORS[0];
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
