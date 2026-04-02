import { useCallback, useEffect, useState } from "react";
import { getJson, putJson } from "../api/client";
import PageShell from "../components/PageShell";

type Health = {
  ok?: boolean;
  ruleset_version?: string;
  index_ver?: string;
  mock_quote?: boolean;
  copaw_bridge?: string;
  research_qa_llm?: { enabled?: boolean; provider?: string | null; model?: string | null };
};

type SettingsPayload = {
  api_base?: string;
  mock_quote?: boolean;
  build?: string;
  data_classification?: string;
  swagger_ui_path?: string;
  openapi_spec_path?: string;
  preferences?: {
    default_route?: string;
    show_workshop_panel?: boolean;
    show_research_qa_mvp_nav?: boolean;
    reports_default_filter_stage?: string;
    updated_at?: string;
  };
};

const ROUTES = [
  { value: "/workbench", label: "工作台" },
  { value: "/research-qa-change", label: "研报问答（规格迭代场景）" },
  { value: "/research-qa", label: "研报问答①（MVP 学习页）" },
  { value: "/reports", label: "报告与披露登记" },
  { value: "/sentiment", label: "舆情监控" },
];

export default function Settings() {
  const [health, setHealth] = useState<Health | null>(null);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [prefs, setPrefs] = useState<SettingsPayload["preferences"]>({});
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [h, s] = await Promise.all([getJson<Health>("/system/health"), getJson<SettingsPayload>("/system/settings")]);
    setHealth(h);
    setSettings(s);
    setPrefs(s.preferences ?? {});
  }, []);

  useEffect(() => {
    load().catch(() => setMsg("无法加载系统参数（请确认后端已启动）"));
  }, [load]);

  async function savePreferences() {
    setSaving(true);
    setMsg("");
    try {
      const next = await putJson<NonNullable<SettingsPayload["preferences"]>>("/system/preferences", {
        default_route: prefs?.default_route,
        show_workshop_panel: prefs?.show_workshop_panel,
        show_research_qa_mvp_nav: prefs?.show_research_qa_mvp_nav,
        reports_default_filter_stage: prefs?.reports_default_filter_stage,
      });
      setPrefs(next);
      window.dispatchEvent(new Event("ira-workshop-prefs-updated"));
      setMsg("已保存。侧栏「研报问答①」与左侧菜单联动；侧栏折叠仍由浏览器本地存储控制。");
    } catch {
      setMsg("保存失败");
    } finally {
      setSaving(false);
    }
  }

  const llmOn = health?.research_qa_llm?.enabled;

  return (
    <PageShell title="系统参数与运维" note={null}>
      <div className="ira-fund-page">
        <header className="ira-fund-page__masthead">
          <div>
            <h2 className="ira-fund-page__h2">系统参数与运维视图</h2>
            <p className="ira-fund-page__sub">
              对齐基金公司常见「参数集中展示 + 对接状态一览 + 保密提示」布局；本环境为 Workshop，非生产配置中心。
            </p>
          </div>
          <div className="ira-fund-page__masthead-actions">
            <a className="ira-btn ira-btn--xs" href="/api/docs" target="_blank" rel="noreferrer">
              打开 Swagger UI（经 Vite 代理）
            </a>
            <a className="ira-btn ira-btn--ghost ira-btn--xs" href="http://127.0.0.1:5000/api/docs" target="_blank" rel="noreferrer">
              直连后端 :5000
            </a>
            <span className="ira-fund-pill ira-fund-pill--muted">OpenAPI：{settings?.openapi_spec_path ?? "/api/v1/openapi.json"}</span>
          </div>
        </header>

        <div className="ira-fund-callout">
          若 <code>/api/docs</code> 打不开：① 确认 Flask 已在 <strong>5000</strong> 端口运行；② <strong>修改过 Python 后需重启</strong> Flask 进程；③ 或点上方「直连后端
          :5000」。Swagger 中可点 <strong>Authorize</strong> 填入 JWT（演示后端不校验）。
        </div>

        {msg && <p className={msg.includes("失败") ? "ira-fund-banner ira-fund-banner--warn" : "ira-fund-banner ira-fund-banner--ok"}>{msg}</p>}

        <section className="ira-fund-section">
          <div className="ira-fund-section__bar">
            <h3 className="ira-fund-section__title">运行环境与数据分级</h3>
            <span className="ira-fund-section__code">BUILD {settings?.build ?? "—"}</span>
          </div>
          <table className="ira-fund-matrix">
            <tbody>
              <tr>
                <th scope="row">API 根路径</th>
                <td>{settings?.api_base ?? "—"}</td>
                <td className="ira-fund-matrix__hint">前后端约定前缀；网关接入后通常对客隐藏版本号。</td>
              </tr>
              <tr>
                <th scope="row">数据分级与用途</th>
                <td>{settings?.data_classification ?? "—"}</td>
                <td className="ira-fund-matrix__hint">生产需对接公司数据分级与脱敏策略；此处为文案提示。</td>
              </tr>
              <tr>
                <th scope="row">行情与外部工具</th>
                <td>{settings?.mock_quote ? "演示 Mock" : "—"}</td>
                <td className="ira-fund-matrix__hint">Wind/同花顺等需单独采购与专线；本环境不发起外网行情。</td>
              </tr>
              <tr>
                <th scope="row">规则集 / 索引版本</th>
                <td>
                  {health?.ruleset_version ?? "—"} · 索引 {health?.index_ver ?? "—"}
                </td>
                <td className="ira-fund-matrix__hint">合规与检索版本号用于变更留痕与回归测试对齐。</td>
              </tr>
              <tr>
                <th scope="row">CoPaw / MCP 桥</th>
                <td>{health?.copaw_bridge ?? "—"}</td>
                <td className="ira-fund-matrix__hint">Workshop 未嵌入运行时；可通过外链、MCP、Skills 与 CoPaw 协同。</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="ira-fund-section">
          <div className="ira-fund-section__bar">
            <h3 className="ira-fund-section__title">模型与智能能力</h3>
            <span className={`ira-fund-tag ${llmOn ? "ira-fund-tag--on" : "ira-fund-tag--off"}`}>
              {llmOn ? "百炼已配置" : "百炼未启用"}
            </span>
          </div>
          <table className="ira-fund-matrix">
            <tbody>
              <tr>
                <th scope="row">研报问答 LLM</th>
                <td>
                  {llmOn ? `${health?.research_qa_llm?.provider ?? ""} / ${health?.research_qa_llm?.model ?? ""}` : "占位 / 离线"}
                </td>
                <td className="ira-fund-matrix__hint">密钥自环境变量读取；未配置时接口仍可用占位回答。</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="ira-fund-section">
          <div className="ira-fund-section__bar">
            <h3 className="ira-fund-section__title">工作台偏好（演示持久化）</h3>
            <span className="ira-fund-section__code">PUT /system/preferences</span>
          </div>
          <p className="ira-fund-lead">
            模拟「个人门户默认落地页、报告列表默认筛选」等配置项；写入服务端 <code>workspace_preferences.json</code>，便于联调与验收演示。
          </p>
          <div className="ira-fund-formgrid">
            <label className="ira-fund-field">
              <span className="ira-fund-field__label">登录后默认打开</span>
              <select
                className="ira-fund-select"
                value={prefs?.default_route ?? "/workbench"}
                onChange={(e) => setPrefs((p) => ({ ...p, default_route: e.target.value }))}
              >
                {ROUTES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="ira-fund-field ira-fund-field--check">
              <input
                type="checkbox"
                checked={prefs?.show_workshop_panel !== false}
                onChange={(e) => setPrefs((p) => ({ ...p, show_workshop_panel: e.target.checked }))}
              />
              <span>显示右侧 Workshop 说明面板（偏好位，演示）</span>
            </label>
            <label className="ira-fund-field ira-fund-field--check">
              <input
                type="checkbox"
                checked={prefs?.show_research_qa_mvp_nav === true}
                onChange={(e) => setPrefs((p) => ({ ...p, show_research_qa_mvp_nav: e.target.checked }))}
              />
              <span>在左侧菜单显示「研报问答①」（MVP 学习页；默认关闭，主入口为「研报问答」）</span>
            </label>
            <label className="ira-fund-field">
              <span className="ira-fund-field__label">报告登记簿默认环节筛选</span>
              <select
                className="ira-fund-select"
                value={prefs?.reports_default_filter_stage ?? "all"}
                onChange={(e) => setPrefs((p) => ({ ...p, reports_default_filter_stage: e.target.value }))}
              >
                <option value="all">全部环节</option>
                <option value="编制中">编制中</option>
                <option value="内审中">内审中</option>
                <option value="合规审核">合规审核</option>
                <option value="待签章">待签章</option>
                <option value="已定稿">已定稿</option>
              </select>
            </label>
          </div>
          <div className="ira-fund-actions">
            <button type="button" className="ira-btn ira-btn--xs" disabled={saving} onClick={() => void savePreferences()}>
              {saving ? "保存中…" : "保存偏好"}
            </button>
            {prefs?.updated_at && <span className="ira-fund-muted">上次写入：{prefs.updated_at}</span>}
          </div>
        </section>

        <section className="ira-fund-section ira-fund-section--risk">
          <div className="ira-fund-section__bar">
            <h3 className="ira-fund-section__title">审计与合规提示</h3>
          </div>
          <ul className="ira-fund-risklist">
            <li>关键写操作（扫描、推送、报告环节变更）均带 trace，可在「血缘追溯」按 trace_id 复核字段快照（演示）。</li>
            <li>对外发送材料须走公司邮件/公文/披露系统，本页推送为 dry-run，不得替代正式流程。</li>
            <li>Swagger 仅内网开放；生产应对接网关鉴权、审计日志与速率限制。</li>
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
