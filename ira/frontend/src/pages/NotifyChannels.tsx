import { useEffect, useState } from "react";
import { getJson, postJson, putJson } from "../api/client";
import PageShell from "../components/PageShell";
import type { NotifyChannel } from "./notify/types";

export default function NotifyChannels() {
  const [items, setItems] = useState<NotifyChannel[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await getJson<{ items: NotifyChannel[] }>("/notify/channels");
    setItems(data.items || []);
  }

  useEffect(() => {
    load().catch(() => setMsg("加载渠道失败"));
  }, []);

  async function ensureDefaults() {
    const seed: NotifyChannel[] = [
      { id: "dingtalk", name: "钉钉机器人", kind: "dingtalk", connected: false, hint: "演示渠道" },
      { id: "feishu", name: "飞书机器人", kind: "feishu", connected: false, hint: "演示渠道" },
      { id: "email", name: "邮件列表", kind: "email", connected: false, hint: "演示渠道" },
    ];
    await putJson("/notify/channels", { items: seed });
    setMsg("已初始化默认渠道");
    await load();
  }

  async function testChannel(ch: NotifyChannel) {
    try {
      const tp = (ch.kind === "email" ? "email" : ch.kind === "feishu" ? "feishu" : "dingtalk") as
        | "dingtalk"
        | "feishu"
        | "email";
      await postJson(`/notify/channels/${tp}/test`, { channelId: ch.id });
      setMsg(`测试通过：${ch.name}`);
      await load();
    } catch (e) {
      setMsg(`测试失败：${String(e)}`);
    }
  }

  return (
    <PageShell title="推送渠道">
      <div className="ira-card">
        <p className="ira-muted">M4 渠道中心：统一管理渠道配置与连通性测试。</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button type="button" className="ira-btn" onClick={() => void ensureDefaults()}>
            初始化默认渠道
          </button>
        </div>
        {msg && <p className="ira-muted">{msg}</p>}
        <div className="ira-table-wrap">
          <table className="ira-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>名称</th>
                <th>类型</th>
                <th>最近测试</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="ira-muted">
                    暂无渠道，请先初始化
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id}>
                    <td>
                      <code>{it.id}</code>
                    </td>
                    <td>{it.name}</td>
                    <td>{it.kind || "dingtalk"}</td>
                    <td>{it.last_test_status || "未测试"}</td>
                    <td>
                      <button type="button" className="ira-btn ira-btn--ghost" onClick={() => void testChannel(it)}>
                        测试
                      </button>
                    </td>
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
