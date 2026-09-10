export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}

export function formatRelativeTime(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}日前`;
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dateKeyOf(timestamp) {
  return toDateKey(new Date(timestamp));
}

// 画像ファイルを読み込み、長辺 maxDim px に縮小してJPEGのdata URLにする。
// Firestoreの1ドキュメント上限(1MB)に収まるよう、大きすぎる場合は品質を下げて再試行する。
export function compressImageFile(file, { maxDim = 800, quality = 0.62 } = {}) {
  const MAX_LEN = 650000;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        for (let q = quality; dataUrl.length > MAX_LEN && q > 0.25; q -= 0.15) {
          dataUrl = canvas.toDataURL("image/jpeg", q);
        }
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// 装飾イラスト用のタグを組み立てる。
// assets/配下のPNGを差し替え前提の構造で参照し、読み込みに失敗する間(ファイル未配置時)は
// 絵文字に自動でフォールバックする。用意ができたらPNGを置くだけで自動的に切り替わる。
export function illustration(src, fallbackEmoji, { alt = "", className = "" } = {}) {
  return `<span class="illust ${className}">
    <span class="illust__fallback" aria-hidden="true">${fallbackEmoji}</span>
    <img class="illust__img" src="${src}" alt="${escapeHtml(alt)}" loading="lazy"
      onload="this.previousElementSibling.style.display='none'"
      onerror="this.style.display='none'" />
  </span>`;
}

// 大きめに配置する「貼り付けステッカー」用。assets/のイラストをそのまま表示する。
export function sticker(src, alt, className = "") {
  return `<span class="sticker ${className}"><img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" /></span>`;
}

let toastTimer = null;
export function showToast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 1800);
}
