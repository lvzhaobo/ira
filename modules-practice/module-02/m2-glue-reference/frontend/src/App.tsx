import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

type JobStatus = "queued" | "running" | "success" | "failed";

interface SyncJobRow {
  jobId: string;
  sourceName: string;
  status: JobStatus;
  mode: string;
  statsLabel: string;
}

const initialSources = [
  { sourceId: "src-mock-1", name: "Mock 资讯源", providerType: "mock", enabled: true },
  { sourceId: "src-demo-2", name: "演示行情聚合", providerType: "sina", enabled: true },
];

function shortId(): string {
  return `job-${crypto.randomUUID().slice(0, 8)}`;
}

export default function App() {
  const [jobs, setJobs] = useState<SyncJobRow[]>([
    {
      jobId: "job-seed-01",
      sourceName: "Mock 资讯源",
      status: "success",
      mode: "incremental",
      statsLabel: "fetched 3 · published 3",
    },
  ]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const pushJob = useCallback((sourceName: string) => {
    const jobId = shortId();
    const row: SyncJobRow = {
      jobId,
      sourceName,
      status: "queued",
      mode: "incremental",
      statsLabel: "—",
    };
    setJobs((prev) => [row, ...prev]);

    const t1 = setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) => (j.jobId === jobId ? { ...j, status: "running" as const } : j))
      );
    }, 400);
    timers.current.push(t1);

    const t2 = setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.jobId === jobId
            ? {
                ...j,
                status: "success" as const,
                statsLabel: "fetched 2 · normalized 2 · publishedToM1 2",
              }
            : j
        )
      );
    }, 1600);
    timers.current.push(t2);
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>多源数据 · Ingest 运维台（参考实现）</h1>
        <span className="app-header__badge">M2 · Glue</span>
      </header>

      <main className="app-main">
        <section className="app-section">
          <h2 className="app-section__title">数据源</h2>
          <div className="card">
            <div className="card__body">
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>sourceId</th>
                      <th>名称</th>
                      <th>providerType</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialSources.map((s) => (
                      <tr key={s.sourceId}>
                        <td className="mono">{s.sourceId}</td>
                        <td>{s.name}</td>
                        <td>{s.providerType}</td>
                        <td>{s.enabled ? "已启用" : "停用"}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn--accent"
                            onClick={() => pushJob(s.name)}
                          >
                            触发同步
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="hint">
                对齐契约见仓库 <span className="mono">docs-5modules/02-…/09</span>（
                <span className="mono">POST /ingest/jobs</span>
                ）；此处为前端演示状态机，不调用真实 BFF。
              </p>
            </div>
          </div>
        </section>

        <section className="app-section">
          <h2 className="app-section__title">同步任务</h2>
          <div className="card">
            <div className="btn-row">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => pushJob("Mock 资讯源")}
              >
                快速演示 · 新建任务
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setJobs([])}>
                清空列表
              </button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>jobId</th>
                    <th>数据源</th>
                    <th>mode</th>
                    <th>status</th>
                    <th>stats</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ color: "var(--color-text-muted)" }}>
                        暂无任务
                      </td>
                    </tr>
                  ) : (
                    jobs.map((j) => (
                      <tr key={j.jobId}>
                        <td className="mono">{j.jobId}</td>
                        <td>{j.sourceName}</td>
                        <td>{j.mode}</td>
                        <td>
                          <span className={`status-pill status-pill--${j.status}`}>
                            {j.status}
                          </span>
                        </td>
                        <td className="mono">{j.statsLabel}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        工作坊参考 UI · 展示数据均为模拟 · 不构成任何投资建议
      </footer>
    </div>
  );
}
