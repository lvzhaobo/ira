import { useCallback, useEffect, useMemo, useState } from "react";
import { getJson, postJson } from "../api/client";
import PageShell from "../components/PageShell";
import { NOTIFY_KPIS, NOTIFY_TEMPLATES } from "../data/messagesMock";

type Channel = { id: string; name: string; connected?: boolean; kind?: string; hint?: string };
type Hist = { trace_id: string; channel_id?: string; payload?: string; subject?: string | null; source_trace_id?: string | null };

function channelIcon(kind?: string): string {
  switch (kind) {
    case "feishu":
      return "飞";
    case "email":
      return "@";
    case "ding":
    default:
      return "钉";
  }
}

function channelClass(kind?: string): string {
  switch (kind) {
    case "feishu":
      return "ira-notify-ch--feishu";
    case "email":
      return "ira-notify-ch--email";
    default:
      return "ira-notify-ch--ding";
  }
}

export default function Messages() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [history, setHistory] = useState<Hist[]>([]);
  const [payload, setPayload] = useState("【演示】研报摘要已生成，请查看工作台。");
  const [subject, setSubject] = useState("【投研助手】摘要通知");
  const [channelId, setChannelId] = useState("feishu");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [c, h] = await Promise.all([
      getJson<{ items: Channel[] }>("/notify/channels"),
      getJson<{ items: Hist[] }>("/notify/history"),
    ]);
    const list = c.items || [];
    setChannels(list);
    setHistory(h.items || []);
    setChannelId((prev) => (list.some((x) => x.id === prev) ? prev : list[0]?.id ?? prev));
  }, []);

  useEffect(() => {
    load().catch(() => setMsg("无法加载推送数据"));
  }, [load]);

  const activeChannel = useMemo(() => channels.find((c) => c.id === channelId), [channels, channelId]);

  const kpis = useMemo(() => {
    return NOTIFY_KPIS.map((k) => {
      if (k.id === "today") return { ...k, value: String(history.length), sub: "本环境 dry-run 历史条数" };
      if (k.id === "channels") return { ...k, value: String(channels.length || 0), sub: "钉钉 · 飞书 · 邮件" };
      return k;
    });
  }, [channels.length, history.length]);

  async function push() {
    setMsg("");
    try {
      const body: { payload: string; channel_id: string; subject?: string } = {
        payload,
        channel_id: channelId,
      };
      if (activeChannel?.kind === "email") {
        body.subject = subject;
      }
      const r = await postJson<{ trace_id: string; dry_run?: boolean }>("/notify/push", body);
      setMsg(`已记录 dry-run，trace: ${r.trace_id}`);
      await load();
    } catch (e: unknown) {
      const err = e as Error;
      setMsg(err.message?.includes("400") ? "合规拦截：请修改文案后再试" : String(e));
    }
  }

  function applyTemplate(t: { title: string; body: string }) {
    setPayload(t.body.replace("{标的}", "贵州茅台"));
    if (activeChannel?.kind === "email") {
      setSubject(`【投研助手】${t.title}`);
    }
  }

  return (
    <PageShell title="消息推送">
      <div className="ira-notify">
        <p className="ira-notify__lead">
          统一触达层：<strong>钉钉</strong>、<strong>飞书</strong>与<strong>邮件</strong>渠道配置与 dry-run 审计；发送前经合规扫描（命中禁宣词则拒绝）。生产可替换为真实 Webhook / SMTP / 飞书开放平台。
        </p>

        {msg && <p className={msg.includes("合规") ? "ira-notify__warn" : "ira-notify__ok"}>{msg}</p>}

        <section className="ira-notify__kpis" aria-label="推送概览">
          {kpis.map((k) => (
            <article key={k.id} className="ira-notify-kpi">
              <div className="ira-notify-kpi__label">{k.label}</div>
              <div className="ira-notify-kpi__value">{k.value}</div>
              {k.sub && <div className="ira-notify-kpi__sub">{k.sub}</div>}
            </article>
          ))}
        </section>

        <section className="ira-card ira-notify-card" aria-labelledby="notify-ch-title">
          <h2 id="notify-ch-title" className="ira-notify-card__title">
            渠道配置
          </h2>
          <p className="ira-notify-card__sub">点击卡片选择默认发送渠道；连接状态为演示示意。</p>
          <div className="ira-notify-ch-grid">
            {channels.length === 0 ? (
              <p className="ira-muted">暂无渠道（检查 data/notify_channels.json）</p>
            ) : (
              channels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  className={`ira-notify-ch ${channelClass(ch.kind)}${channelId === ch.id ? " ira-notify-ch--selected" : ""}`}
                  onClick={() => setChannelId(ch.id)}
                >
                  <span className="ira-notify-ch__icon" aria-hidden>
                    {channelIcon(ch.kind)}
                  </span>
                  <div className="ira-notify-ch__body">
                    <div className="ira-notify-ch__name">{ch.name}</div>
                    <div className="ira-notify-ch__id">
                      id: <code>{ch.id}</code>
                    </div>
                    {ch.hint && <div className="ira-notify-ch__hint">{ch.hint}</div>}
                  </div>
                  <span className={`ira-notify-ch__badge${ch.connected ? " ira-notify-ch__badge--on" : ""}`}>
                    {ch.connected ? "已连接" : "未接生产"}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <div className="ira-notify__grid2">
          <section className="ira-card ira-notify-card">
            <h2 className="ira-notify-card__title">模拟推送（dry-run）</h2>
            <p className="ira-notify-card__sub">
              当前渠道：<strong>{activeChannel?.name ?? channelId}</strong>
              {activeChannel?.kind === "email" ? " · 将附带邮件主题" : ""}
            </p>
            {activeChannel?.kind === "email" && (
              <label className="ira-notify-field">
                邮件主题
                <input className="ira-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="主题" />
              </label>
            )}
            <label className="ira-notify-field">
              正文
              <textarea className="ira-textarea" value={payload} onChange={(e) => setPayload(e.target.value)} rows={6} />
            </label>
            <div className="ira-notify-templates">
              <span className="ira-notify-templates__label">快速模板</span>
              <div className="ira-notify-templates__btns">
                {NOTIFY_TEMPLATES.map((t) => (
                  <button key={t.title} type="button" className="ira-notify-template-btn" onClick={() => applyTemplate(t)}>
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="ira-btn" onClick={push}>
              推送（dry-run）
            </button>
          </section>

          <section className="ira-card ira-notify-card">
            <h2 className="ira-notify-card__title">说明</h2>
            <ul className="ira-notify-notes">
              <li>
                <strong>钉钉</strong>：群机器人 / 工作通知，演示仅写审计流水。
              </li>
              <li>
                <strong>飞书</strong>：应用机器人或群卡片 JSON，可与投研工作台 deep link。
              </li>
              <li>
                <strong>邮件</strong>：SMTP 分发列表；主题与正文一并过合规扫描并落库。
              </li>
            </ul>
          </section>
        </div>

        <section className="ira-card ira-notify-card">
          <h2 className="ira-notify-card__title">推送历史</h2>
          <div className="ira-table-wrap">
            <table className="ira-table ira-notify-table">
              <thead>
                <tr>
                  <th>trace</th>
                  <th>渠道</th>
                  <th>主题</th>
                  <th>正文摘要</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="ira-muted">
                      暂无
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.trace_id}>
                      <td className="ira-notify-mono">{h.trace_id}</td>
                      <td>
                        <span className="ira-notify-chtag">{h.channel_id}</span>
                      </td>
                      <td>{h.subject || "—"}</td>
                      <td>{(h.payload || "").slice(0, 100)}{(h.payload || "").length > 100 ? "…" : ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
