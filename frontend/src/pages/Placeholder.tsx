import PageShell from "../components/PageShell";

export default function Placeholder({ title }: { title: string }) {
  return (
    <PageShell title={title}>
      <div className="ira-card">
        <p className="ira-muted" style={{ margin: 0 }}>
          占位页：暂无对应后端 API，后续按任务清单对接。
        </p>
      </div>
    </PageShell>
  );
}
