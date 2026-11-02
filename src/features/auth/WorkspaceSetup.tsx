import { ArrowRight, KeyRound, LoaderCircle, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";

type Props = {
  onCreate: (name: string) => Promise<void>;
  onJoin: (code: string) => Promise<void>;
  onSignOut: () => void;
};

export function WorkspaceSetup({ onCreate, onJoin, onSignOut }: Props) {
  const [name, setName] = useState("我们的收藏夹");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join">();
  const [error, setError] = useState("");

  async function run(kind: "create" | "join", action: () => Promise<void>) {
    setLoading(kind);
    setError("");
    try {
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "操作失败，请检查后重试");
    } finally {
      setLoading(undefined);
    }
  }

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    void run("create", () => onCreate(name));
  }

  function handleJoin(event: FormEvent) {
    event.preventDefault();
    void run("join", () => onJoin(code));
  }

  return (
    <main className="workspace-setup-page">
      <section className="workspace-setup-card">
        <p className="eyebrow">SHARED SPACE</p>
        <h1>开始共同收藏</h1>
        <p>第一个人创建收藏夹并分享邀请码；朋友登录后输入邀请码即可加入。</p>
        <div className="workspace-choice-grid">
          <form onSubmit={handleCreate}>
            <span className="setup-icon">
              <Plus aria-hidden="true" />
            </span>
            <h2>创建收藏夹</h2>
            <label>
              名称
              <input
                required
                maxLength={40}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <button className="button primary" type="submit" disabled={Boolean(loading)}>
              {loading === "create" ? (
                <LoaderCircle className="spin" aria-hidden="true" size={17} />
              ) : (
                <ArrowRight aria-hidden="true" size={17} />
              )}{" "}
              创建
            </button>
          </form>
          <form onSubmit={handleJoin}>
            <span className="setup-icon">
              <KeyRound aria-hidden="true" />
            </span>
            <h2>加入朋友的收藏夹</h2>
            <label>
              邀请码
              <input
                required
                maxLength={16}
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="输入邀请码"
              />
            </label>
            <button className="button secondary" type="submit" disabled={Boolean(loading)}>
              {loading === "join" ? (
                <LoaderCircle className="spin" aria-hidden="true" size={17} />
              ) : (
                <ArrowRight aria-hidden="true" size={17} />
              )}{" "}
              加入
            </button>
          </form>
        </div>
        {error && (
          <p className="auth-message" role="alert">
            {error}
          </p>
        )}
        <button className="text-button" type="button" onClick={onSignOut}>
          退出当前账号
        </button>
      </section>
    </main>
  );
}
