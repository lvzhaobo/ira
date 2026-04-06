import { useEffect, useMemo, useState } from "react";
import { deleteJson, getJson, patchJson, postJson } from "../api/client";
import PageShell from "../components/PageShell";
import type { NotifyChannel, NotifyRule, NotifyTemplate } from "./notify/types";

export default function NotifyTemplatesRules() {
  const [channels, setChannels] = useState<NotifyChannel[]>([]);
  const [templates, setTemplates] = useState<NotifyTemplate[]>([]);
  const [rules, setRules] = useState<NotifyRule[]>([]);
  const [msg, setMsg] = useState("");

  const [tplName, setTplName] = useState("日报模板");
  const [tplType, setTplType] = useState("feishu");
  const [tplBody, setTplBody] = useState("标题：{{title}}\n正文：{{body}}");

  const [ruleName, setRuleName] = useState("研报摘要推送");
  const [ruleTpl, setRuleTpl] = useState("");
  const [ruleChannelIds, setRuleChannelIds] = useState<string[]>([]);

  async function load() {
    const [cs, ts, rs] = await Promise.all([
      getJson<{ items: NotifyChannel[] }>("/notify/channels"),
      getJson<{ items: NotifyTemplate[] }>("/notify/templates"),
      getJson<{ items: NotifyRule[] }>("/notify/rules"),
    ]);
    setChannels(cs.items || []);
    setTemplates(ts.items || []);
    setRules(rs.items || []);
  }

  useEffect(() => {
    load().catch(() => setMsg("加载规则与模板失败"));
  }, []);

  const channelMap = useMemo(() => new Map(channels.map((c) => [c.id, c.name])), [channels]);

  async function createTemplate() {
    setMsg("");
    try {
      const res = await postJson<{ template: NotifyTemplate }>("/notify/templates", {
        name: tplName,
        channelType: tplType,
        bodyMarkdown: tplBody,
      });
      setMsg(`模板已创建：${res.template.name}`);
      setRuleTpl(res.template.templateId);
      await load();
    } catch (e) {
      setMsg(`创建模板失败：${String(e)}`);
    }
  }

  async function createRule() {
    setMsg("");
    try {
      await postJson<{ rule: NotifyRule }>("/notify/rules", {
        name: ruleName,
        triggerType: "manual",
        channelIds: ruleChannelIds,
        templateId: ruleTpl || null,
      });
      setMsg("规则已创建");
      await load();
    } catch (e) {
      setMsg(`创建规则失败：${String(e)}`);
    }
  }

  async function toggleRule(rule: NotifyRule) {
    try {
      await patchJson(`/notify/rules/${rule.ruleId}`, { enabled: !rule.enabled });
      await load();
    } catch (e) {
      setMsg(`更新规则失败：${String(e)}`);
    }
  }

  async function removeRule(ruleId: string) {
    try {
      await deleteJson(`/notify/rules/${ruleId}`);
      await load();
    } catch (e) {
      setMsg(`删除规则失败：${String(e)}`);
    }
  }

  return (
    <PageShell title="推送规则与模板">
      <div className="ira-grid" style={{ gap: 12 }}>
        <section className="ira-card">
          <h3 style={{ marginTop: 0 }}>创建模板</h3>
          <div className="ira-stack">
            <input className="ira-input" value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="模板名" />
            <select className="ira-input" value={tplType} onChange={(e) => setTplType(e.target.value)}>
              <option value="dingtalk">dingtalk</option>
              <option value="feishu">feishu</option>
              <option value="email">email</option>
            </select>
            <textarea className="ira-textarea" rows={4} value={tplBody} onChange={(e) => setTplBody(e.target.value)} />
            <button type="button" className="ira-btn" onClick={() => void createTemplate()}>
              新建模板
            </button>
          </div>
        </section>

        <section className="ira-card">
          <h3 style={{ marginTop: 0 }}>创建规则</h3>
          <div className="ira-stack">
            <input className="ira-input" value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="规则名" />
            <select className="ira-input" value={ruleTpl} onChange={(e) => setRuleTpl(e.target.value)}>
              <option value="">不绑定模板</option>
              {templates.map((t) => (
                <option key={t.templateId} value={t.templateId}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="ira-grid" style={{ gap: 6 }}>
              {channels.map((c) => (
                <label key={c.id} className="ira-muted">
                  <input
                    type="checkbox"
                    checked={ruleChannelIds.includes(c.id)}
                    onChange={(e) =>
                      setRuleChannelIds((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)))
                    }
                  />{" "}
                  {c.name}
                </label>
              ))}
            </div>
            <button type="button" className="ira-btn" onClick={() => void createRule()}>
              新建规则
            </button>
          </div>
          {msg && <p className="ira-muted">{msg}</p>}
        </section>

        <section className="ira-card">
          <h3 style={{ marginTop: 0 }}>规则列表</h3>
          <div className="ira-table-wrap">
            <table className="ira-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>状态</th>
                  <th>模板</th>
                  <th>渠道</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="ira-muted">
                      暂无规则
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => (
                    <tr key={r.ruleId}>
                      <td>{r.name}</td>
                      <td>{r.enabled ? "启用" : "禁用"}</td>
                      <td>{templates.find((t) => t.templateId === r.templateId)?.name || "—"}</td>
                      <td>{(r.channelIds || []).map((id) => channelMap.get(id) || id).join(" / ")}</td>
                      <td style={{ display: "flex", gap: 8 }}>
                        <button type="button" className="ira-btn ira-btn--ghost" onClick={() => void toggleRule(r)}>
                          {r.enabled ? "禁用" : "启用"}
                        </button>
                        <button type="button" className="ira-btn ira-btn--ghost" onClick={() => void removeRule(r.ruleId)}>
                          删除
                        </button>
                      </td>
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
