import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getJson, postJson } from "../api/client";
import { useAuth } from "../context/AuthContext";

const FALLBACK_AFTER_LOGIN = "/workbench";

function safeInternalPath(p: string | null | undefined, fallback: string): string {
  if (!p || !p.startsWith("/") || p.startsWith("//") || p.includes("\\")) return fallback;
  return p;
}

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const fromState = (location.state as { from?: string } | null)?.from;
  const nextParam = searchParams.get("next");
  const redirectTo = safeInternalPath(nextParam, safeInternalPath(fromState, FALLBACK_AFTER_LOGIN));

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoUser, setDemoUser] = useState("demo");
  const [demoPassword, setDemoPassword] = useState("ira.vin");
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  // 检查后端服务状态
  useEffect(() => {
    let cancelled = false;

    const checkBackend = async () => {
      try {
        await getJson<{ status: string }>("/system/health");
        if (!cancelled) {
          setBackendStatus("online");
        }
      } catch {
        if (!cancelled) {
          setBackendStatus("offline");
        }
      }
    };

    checkBackend();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (backendStatus === "offline") return; // 服务离线时不加载配置

    getJson<{ username: string; password: string }>("/auth/public-config")
      .then((c) => {
        setDemoUser(c.username);
        setDemoPassword(c.password);
        setUsername((u) => (u ? u : c.username));
      })
      .catch(() => {
        /* 离线时使用页面内默认 */
      });
  }, [backendStatus]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await postJson<{ ok: boolean }>("/auth/login", { username: username.trim(), password });
      login(username.trim());
      navigate(redirectTo, { replace: true });
    } catch (error) {
      // 区分服务离线和认证失败
      if (backendStatus === "offline") {
        setErr("后端服务未启动，请联系管理员。");
      } else {
        setErr("账号或密码错误，请重试。");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ira-login">
      <div className="ira-login__card">
        <h1 className="ira-login__title">控制台登录</h1>
        <p className="ira-login__lead">登录后进入投研智能工作台（内部演示环境）</p>

        {/* 后端服务状态指示器 */}
        <div className="ira-login__status" role="status">
          {backendStatus === "checking" && (
            <span className="ira-login__status-checking">
              <span className="ira-login__status-dot ira-login__status-dot--checking"></span>
              正在检查服务状态…
            </span>
          )}
          {backendStatus === "online" && (
            <span className="ira-login__status-online">
              <span className="ira-login__status-dot ira-login__status-dot--online"></span>
              后端服务正常运行
            </span>
          )}
          {backendStatus === "offline" && (
            <span className="ira-login__status-offline">
              <span className="ira-login__status-dot ira-login__status-dot--offline"></span>
              后端服务未启动，请联系管理员
            </span>
          )}
        </div>

        <div className="ira-login__hint" role="note">
          <strong>演示账号（与 config/auth_login.json 一致）</strong>
          <dl className="ira-login__dl">
            <dt>账号</dt>
            <dd>{demoUser}</dd>
            <dt>密码</dt>
            <dd>
              <code className="ira-login__code">{demoPassword}</code>
            </dd>
          </dl>
          <p className="ira-login__hint-sub">可通过环境变量 <code>IRA_LOGIN_PASSWORD</code> 覆盖密码（不修改配置文件）。</p>
        </div>

        <form className="ira-login__form" onSubmit={onSubmit}>
          <label className="ira-login__label">
            账号
            <input className="ira-input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </label>
          <label className="ira-login__label">
            密码
            <input
              className="ira-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {err && <p className="ira-login__err">{err}</p>}
          <button type="submit" className="ira-login__submit" disabled={loading}>
            {loading ? "登录中…" : "登录"}
          </button>
        </form>

        <p className="ira-login__back">
          <Link to="/">← 返回官网首页</Link>
        </p>
      </div>
    </div>
  );
}
