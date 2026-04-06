import { useEffect, useState } from "react";
import { getJson } from "../api/client";
import PageShell from "../components/PageShell";
import type { NotifyDelivery } from "./notify/types";

export default function NotifyHistory() {
  const [items, setItems] = useState<NotifyDelivery[]>([]);
  const [status, setStatus] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    const data = await getJson<{ items: NotifyDelivery[] }>(`/notify/deliveries${q}`);
    setItems(data.items || []);
  }

  useEffect(() => {
    load().catch(() => setMsg("加载推送历史失败"));
  }, [status]);

  return (
    <PageShell title="推送历史">
      <div className="ira-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p className="ira-muted" style={{ margin: 0 }}>
            Delivery 审计列表（可按状态过滤）
          </p>
          <select className="ira-input" style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            <option value="sent">sent</option>
            <option value="pending">pending</option>
            <option value="failed">failed</option>
            <option value="blocked">blocked</option>
          </select>
        </div>
        {msg && <p className="ira-muted">{msg}</p>}
        <div className="ira-table-wrap">
          <table className="ira-table">
            <thead>
              <tr>
                <th>deliveryId</th>
                <th>ruleId</th>
                <th>channelId</th>
                <th>status</th>
                <th>dryRun</th>
                <th>traceId</th>
                <th>createdAt</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="ira-muted">
                    暂无记录
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.deliveryId}>
                    <td>
                      <code>{it.deliveryId}</code>
                    </td>
                    <td>{it.ruleId || "—"}</td>
                    <td>{it.channelId}</td>
                    <td>{it.status}</td>
                    <td>{it.dryRun ? "true" : "false"}</td>
                    <td>
                      <code>{it.traceId}</code>
                    </td>
                    <td>{it.createdAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
