import { useEffect, useMemo, useState } from "react";
import { getJson } from "../api/client";
import PageShell from "../components/PageShell";
import { KB_COLLECTIONS, KB_KPIS, KB_PIPELINE } from "../data/knowledgeMock";

type Doc = {
  doc_id?: string;
  filename?: string;
  stored_path?: string;
  collection?: string;
  chunk_count?: number;
  tags?: string[];
  updated_at?: string;
  acl?: string;
};

export default function Knowledge() {
  const [status, setStatus] = useState("");
  const [indexVer, setIndexVer] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [q, setQ] = useState("");
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ index_ver: string; updated_at: string }>("/kb/index/status")
      .then((s) => {
        setIndexVer(s.index_ver || "");
        setStatus(`索引 ${s.index_ver} · 更新 ${s.updated_at}`);
      })
      .catch(() => setStatus("无法读取索引状态"));
    getJson<{ items: Doc[] }>("/kb/documents")
      .then((d) => setDocs(d.items || []))
      .catch(() => setDocs([]));
  }, []);

  const collectionsFromDocs = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of docs) {
      const c = d.collection || "未分类";
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return m;
  }, [docs]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return docs.filter((d) => {
      if (collectionFilter && (d.collection || "未分类") !== collectionFilter) return false;
      if (!t) return true;
      const blob = [d.filename, d.doc_id, d.stored_path, ...(d.tags || [])].filter(Boolean).join(" ").toLowerCase();
      return blob.includes(t);
    });
  }, [docs, q, collectionFilter]);

  const chunkTotal = useMemo(() => docs.reduce((s, d) => s + (d.chunk_count ?? 0), 0), [docs]);

  const kpis = useMemo(() => {
    return KB_KPIS.map((k) => {
      if (k.id === "docs") return { ...k, value: String(docs.length), sub: "当前环境列表" };
      if (k.id === "chunks") return { ...k, value: chunkTotal ? String(chunkTotal) : "—", sub: "来自文档 chunk_count 汇总" };
      return k;
    });
  }, [docs.length, chunkTotal]);

  return (
    <PageShell title="知识库">
      <div className="ira-kb">
        <p className="ira-kb__lead">
          机构投研知识中台：<strong>多格式入库</strong>、<strong>分块与向量索引</strong>、<strong>集合与 ACL</strong> 示意。列表数据来自{" "}
          <code className="ira-kb__code">/kb/documents</code>，可与研报上传接口联动扩展。
        </p>

        <div className="ira-kb__toolbar">
          <input
            className="ira-input ira-kb__search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索文件名、ID、标签…"
            aria-label="搜索知识库文档"
          />
          <span className="ira-kb__pill">{status || "加载中…"}</span>
        </div>

        <section className="ira-kb__kpis" aria-label="知识库指标">
          {kpis.map((k) => (
            <article key={k.id} className="ira-kb-kpi">
              <div className="ira-kb-kpi__label">{k.label}</div>
              <div className="ira-kb-kpi__value">{k.value}</div>
              {k.sub && <div className="ira-kb-kpi__sub">{k.sub}</div>}
            </article>
          ))}
        </section>

        <div className="ira-kb__grid2">
          <div className="ira-kb__stack">
            <section className="ira-card ira-kb-card">
              <h2 className="ira-kb-card__title">知识域（集合）</h2>
              <p className="ira-kb-card__sub">以下为 Workshop 规模示意；右侧表格可点击筛选。</p>
              <ul className="ira-kb-collections">
                {KB_COLLECTIONS.map((c) => (
                  <li key={c.name} className="ira-kb-collections__row">
                    <button
                      type="button"
                      className={`ira-kb-collections__btn${collectionFilter === c.name ? " ira-kb-collections__btn--active" : ""}`}
                      onClick={() => setCollectionFilter((f) => (f === c.name ? null : c.name))}
                    >
                      <span className="ira-kb-collections__name">{c.name}</span>
                      <span className="ira-kb-collections__count">{collectionsFromDocs.get(c.name) ?? "—"} 本库</span>
                    </button>
                    <span className="ira-kb-collections__note">{c.note}</span>
                  </li>
                ))}
              </ul>
              {collectionFilter && (
                <button type="button" className="ira-kb__linkbtn" onClick={() => setCollectionFilter(null)}>
                  清除集合筛选
                </button>
              )}
            </section>

            <section className="ira-card ira-kb-card">
              <h2 className="ira-kb-card__title">索引管线</h2>
              <ul className="ira-kb-pipeline">
                {KB_PIPELINE.map((p) => (
                  <li key={p.step} className="ira-kb-pipeline__row">
                    <span className={`ira-kb-pipeline__dot ira-kb-pipeline__dot--${p.status}`} aria-hidden />
                    <div>
                      <div className="ira-kb-pipeline__step">{p.step}</div>
                      <div className="ira-kb-pipeline__detail">{p.detail}</div>
                    </div>
                    <span className={`ira-kb-pipeline__tag ira-kb-pipeline__tag--${p.status}`}>{p.status}</span>
                  </li>
                ))}
              </ul>
              {indexVer && (
                <p className="ira-kb-pipeline__foot">
                  当前 API 索引版本：<strong>{indexVer}</strong>
                </p>
              )}
            </section>
          </div>

          <section className="ira-card ira-kb-card">
            <div className="ira-kb-card__head">
              <h2 className="ira-kb-card__title">文档清单</h2>
              <span className="ira-kb-card__sub">
                共 {filtered.length} 条
                {q.trim() || collectionFilter ? "（已筛选）" : ""}
              </span>
            </div>
            <div className="ira-table-wrap">
              <table className="ira-table ira-kb-table">
                <thead>
                  <tr>
                    <th>文档 ID</th>
                    <th>文件名</th>
                    <th>集合</th>
                    <th>Chunks</th>
                    <th>标签</th>
                    <th>ACL</th>
                    <th>更新时间</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="ira-muted">
                        无匹配文档（可检查 data/kb_documents.json 或上传接口）
                      </td>
                    </tr>
                  ) : (
                    filtered.map((d, i) => (
                      <tr key={d.doc_id ?? i}>
                        <td className="ira-kb-mono">{d.doc_id ?? "—"}</td>
                        <td>{d.filename ?? d.stored_path ?? "—"}</td>
                        <td>{d.collection ?? "—"}</td>
                        <td>{d.chunk_count ?? "—"}</td>
                        <td>
                          {(d.tags || []).length ? (
                            <span className="ira-kb-tags">
                              {d.tags!.map((t) => (
                                <span key={t} className="ira-kb-tag">
                                  {t}
                                </span>
                              ))}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{d.acl ?? "—"}</td>
                        <td className="ira-kb-mono">{d.updated_at ? d.updated_at.slice(0, 10) : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
