import { Leaf, LoaderCircle, LogIn, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { supabase } from "../../services/supabase";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setMessage("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) setMessage("注册成功，请打开邮箱中的确认链接，然后回来登录。");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <span className="brand-mark">
            <Leaf aria-hidden="true" size={22} />
          </span>
          <div>
            <strong>栖页</strong>
            <small>SHARED LINKHAVEN</small>
          </div>
        </div>
        <p className="eyebrow">TWO PEOPLE · ONE COLLECTION</p>
        <h1 id="auth-title">{mode === "login" ? "欢迎回来" : "创建你的账号"}</h1>
        <p className="auth-intro">登录后，你和朋友可以共同收藏天猫、京东和得物的网址。</p>

        <div className="auth-tabs" role="tablist" aria-label="登录或注册">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            登录
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
          >
            注册
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            邮箱
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            密码
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 位"
            />
          </label>
          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}
          <button className="button primary auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <LoaderCircle className="spin" aria-hidden="true" size={18} />
            ) : mode === "login" ? (
              <LogIn aria-hidden="true" size={18} />
            ) : (
              <UserPlus aria-hidden="true" size={18} />
            )}
            {loading ? "请稍候…" : mode === "login" ? "登录收藏夹" : "注册账号"}
          </button>
        </form>
      </section>
    </main>
  );
}
