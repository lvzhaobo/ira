import { useEffect, useState } from "react";
import { getJson, postJson } from "../api/client";
import PageShell from "../components/PageShell";
import type { NotifyChannel, NotifyRule } from "./notify/types";

export default function NotifyDispatch() {
  const [rules, setRules] = useState<NotifyRule[]>([]);
  const [channels, setChannels] = useState<NotifyChannel[]>([]);
  const [ruleId, setRuleId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [title, setTitle] = useState("研报摘要");
  const [body, setBody] = useState("今日行业摘要已生成，请前往工作台查看。");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([
      getJson<{ items: NotifyRule[] }>("/notify/rules"),
      getJson<{ items: NotifyChannel[] }>("/notify/channels"),
    ])
      .then(([rs, cs]) => {
        setRules(rs.items || []);
        setChannels(cs.items || []);
        setRuleId((rs.items || [])[0]?.ruleId || "");
        setChannelId((cs.items || [])[0]?.id || "");
      })
      .catch(() => setMsg("加载调度数据失败"));
  }, []);

  async function sendByRule() {
    try {
      const res = await postJson<{ delivery: { traceId: string } }>("/notify/dispatch", {
        ruleId,
        payload: { title, body, variables: {} },
        dryRun: true,
      });
      setMsg(`按规则已提交 dry-run，trace=${res.delivery.traceId}`);
    } catch (e) {
      setMsg(`按规则发送失败：${String(e)}`);
    }
  }

  async function sendByChannel() {
    try {
      const res = await postJson<{ delivery: { traceId: string } }>("/notify/dispatch", {
        channelIds: [channelId],
        payload: { title, body, variables: {} },
        dryRun: true,
      });
      setMsg(`按渠道已提交 dry-run，trace=${res.delivery.traceId}`);
    } catch (e) {
      setMsg(`按渠道发送失败：${String(e)}`);
    }
  }

  return (
    <PageShell title="推送调度">
      <div className="ira-card">
        <p className="ira-muted">M4 dispatch：支持 ruleId 或 channelIds 两种发送方式（当前默认 dry-run）。</p>
        <div className="ira-grid" style={{ gap: 10 }}>
          <label>
            标题
            <input className="ira-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            正文
            <textarea className="ira-textarea" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label className="ira-muted">按规则发送</label>
              <select className="ira-input" value={ruleId} onChange={(e) => setRuleId(e.target.value)}>
                <option value="">请选择规则</option>
                {rules.map((r) => (
                  <option key={r.ruleId} value={r.ruleId}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button type="button" className="ira-btn" onClick={() => void sendByRule()} disabled={!ruleId}>
                规则 dry-run
              </button>
            </div>
            <div>
              <label className="ira-muted">按渠道直发</label>
              <select className="ira-input" value={channelId} onChange={(e) => setChannelId(e.target.value)}>
                <option value="">请选择渠道</option>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button type="button" className="ira-btn" onClick={() => void sendByChannel()} disabled={!channelId}>
                渠道 dry-run
              </button>
            </div>
          </div>
        </div>
        {msg && <p className="ira-muted">{msg}</p>}
      </div>
    </PageShell>
  );
}
