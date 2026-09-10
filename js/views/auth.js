import { signUp, signIn, logOut, createCouple, joinCouple } from "../auth.js";
import { illustration } from "../util.js";

const ERROR_MESSAGES = {
  "auth/email-already-in-use": "このメールアドレスは既に登録されています",
  "auth/invalid-email": "メールアドレスの形式が正しくありません",
  "auth/weak-password": "パスワードは6文字以上にしてください",
  "auth/invalid-credential": "メールアドレスかパスワードが違います",
  "auth/wrong-password": "メールアドレスかパスワードが違います",
  "auth/user-not-found": "メールアドレスかパスワードが違います",
  "auth/too-many-requests": "試行回数が多すぎます。しばらくしてから試してください",
};

function friendlyError(err) {
  if (err?.message === "NOT_FOUND") return "その招待コードは見つかりませんでした";
  if (err?.message === "FULL") return "このペアは既に2人揃っています";
  return ERROR_MESSAGES[err?.code] || "エラーが発生しました。もう一度お試しください";
}

// stage: "login" | "pair"
export function mount(root, { onReady, stage = "login", user = null }) {
  let mode = "login"; // login | signup
  let pairMode = "create"; // create | join

  function renderLogin() {
    root.innerHTML = `
      <section class="screen-hero" style="text-align:center;">
        ${illustration("assets/characters/heart-buddy.png", "💛", { className: "illust--xl" })}
        <h1 class="screen-hero__title" style="margin-top:8px;">OUR DAYS</h1>
        <p class="screen-hero__subtitle" style="justify-content:center;">ふたりだけの共有スペースへようこそ</p>
      </section>
      <form class="card" id="auth-form" style="display:flex;flex-direction:column;gap:12px;">
        <input class="input" type="email" id="auth-email" placeholder="メールアドレス" autocomplete="email" required />
        <input class="input" type="password" id="auth-password" placeholder="パスワード(6文字以上)" autocomplete="${mode === "login" ? "current-password" : "new-password"}" minlength="6" required />
        <div id="auth-error" style="color:var(--color-danger);font-size:12px;display:none;"></div>
        <button class="btn btn-primary btn-block" type="submit">${mode === "login" ? "ログイン" : "新規登録"}</button>
      </form>
      <button class="settings-row" id="auth-switch" type="button" style="margin-top:12px;justify-content:center;">
        <span class="settings-row__label">${mode === "login" ? "はじめての方はこちら(新規登録)" : "アカウントをお持ちの方はこちら(ログイン)"}</span>
      </button>
    `;
    const form = root.querySelector("#auth-form");
    const errorEl = root.querySelector("#auth-error");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.style.display = "none";
      const email = root.querySelector("#auth-email").value.trim();
      const password = root.querySelector("#auth-password").value;
      const submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      try {
        if (mode === "login") await signIn(email, password);
        else await signUp(email, password);
        // 成功時はonAuthStateChangedが発火し、app.js側で次の画面に遷移する
      } catch (err) {
        errorEl.textContent = friendlyError(err);
        errorEl.style.display = "block";
        submitBtn.disabled = false;
      }
    });
    root.querySelector("#auth-switch").addEventListener("click", () => {
      mode = mode === "login" ? "signup" : "login";
      renderLogin();
    });
  }

  function renderPair() {
    root.innerHTML = `
      <section class="screen-hero" style="text-align:center;">
        ${illustration("assets/characters/rabbit.png", "🐰", { className: "illust--xl" })}
        <h1 class="screen-hero__title" style="margin-top:8px;">PAIRING</h1>
        <p class="screen-hero__subtitle" style="justify-content:center;">パートナーとふたりの空間をつくろう</p>
      </section>

      <div class="segmented" id="pair-tabs">
        <button class="segmented__item ${pairMode === "create" ? "is-active" : ""}" data-mode="create" type="button">新しく作る</button>
        <button class="segmented__item ${pairMode === "join" ? "is-active" : ""}" data-mode="join" type="button">招待コードで参加</button>
      </div>

      <div class="card" id="pair-body" style="display:flex;flex-direction:column;gap:12px;"></div>

      <button class="settings-row" id="auth-logout" type="button" style="margin-top:12px;justify-content:center;">
        <span class="settings-row__label">ログアウト</span>
      </button>
    `;

    const body = root.querySelector("#pair-body");

    function renderBody() {
      if (pairMode === "create") {
        body.innerHTML = `
          <p style="font-size:13px;color:var(--color-text-muted);line-height:1.6;">
            新しく共有スペースを作ります。作成後に表示される招待コードをパートナーに伝えて、
            「招待コードで参加」から入力してもらってください。
          </p>
          <div id="pair-error" style="color:var(--color-danger);font-size:12px;display:none;"></div>
          <button class="btn btn-primary btn-block" id="pair-create-btn" type="button">共有スペースを作る</button>
          <div id="pair-code-box" hidden style="text-align:center;">
            <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:6px;">この招待コードをパートナーに伝えてください</div>
            <div style="font-family:var(--font-display);font-size:32px;font-weight:800;letter-spacing:0.1em;color:var(--color-primary);" id="pair-code-text"></div>
            <button class="btn btn-ghost btn-sm" id="pair-continue-btn" type="button" style="margin-top:14px;">はじめる</button>
          </div>
        `;
        const errorEl = body.querySelector("#pair-error");
        body.querySelector("#pair-create-btn").addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          btn.disabled = true;
          try {
            const { code } = await createCouple(user.uid);
            btn.hidden = true;
            body.querySelector("#pair-code-box").hidden = false;
            body.querySelector("#pair-code-text").textContent = code;
          } catch (err) {
            errorEl.textContent = friendlyError(err);
            errorEl.style.display = "block";
            btn.disabled = false;
          }
        });
        body.querySelector("#pair-continue-btn")?.addEventListener("click", () => onReady());
      } else {
        body.innerHTML = `
          <p style="font-size:13px;color:var(--color-text-muted);line-height:1.6;">
            パートナーから聞いた6桁の招待コードを入力してください。
          </p>
          <input class="input" id="pair-code-input" placeholder="例: AB12CD" maxlength="6" style="text-align:center;letter-spacing:0.15em;font-weight:700;" />
          <div id="pair-error" style="color:var(--color-danger);font-size:12px;display:none;"></div>
          <button class="btn btn-primary btn-block" id="pair-join-btn" type="button">参加する</button>
        `;
        const errorEl = body.querySelector("#pair-error");
        body.querySelector("#pair-join-btn").addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          const code = body.querySelector("#pair-code-input").value;
          if (!code.trim()) return;
          btn.disabled = true;
          try {
            await joinCouple(user.uid, code);
            onReady();
          } catch (err) {
            errorEl.textContent = friendlyError(err);
            errorEl.style.display = "block";
            btn.disabled = false;
          }
        });
      }
    }
    renderBody();

    root.querySelector("#pair-tabs").addEventListener("click", (e) => {
      const btn = e.target.closest(".segmented__item");
      if (!btn) return;
      pairMode = btn.dataset.mode;
      root.querySelectorAll("#pair-tabs .segmented__item").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderBody();
    });
    root.querySelector("#auth-logout").addEventListener("click", async () => {
      await logOut();
    });
  }

  if (stage === "pair") renderPair();
  else renderLogin();

  return () => {};
}
