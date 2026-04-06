import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";

export default function Messages() {
  return (
    <PageShell title="消息推送">
      <div className="ira-grid" style={{ gap: 12 }}>
        <section className="ira-card">
          <h3 style={{ marginTop: 0 }}>M4 能力导航</h3>
          <p className="ira-muted">已按模块拆为 4 个页面，便于与 M4 规格和角色分工对齐。</p>
          <div style={{ display: "grid", gap: 8 }}>
            <Link to="/messages/channels">1) 渠道管理（Channels）</Link>
            <Link to="/messages/rules">2) 规则与模板（Rules/Templates）</Link>
            <Link to="/messages/dispatch">3) 调度试发（Dispatch）</Link>
            <Link to="/messages/history">4) 投递历史（Deliveries）</Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
