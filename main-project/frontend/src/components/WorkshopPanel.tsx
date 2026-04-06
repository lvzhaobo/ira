import { useLocation } from "react-router-dom";
import { resolveWorkshopContent } from "../config/workshopContent";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

function WorkshopBlock({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ira-workshop__block" aria-label={kicker}>
      <p className="ira-workshop__block-kicker">{kicker}</p>
      {title ? <p className="ira-workshop__block-title">{title}</p> : null}
      <div className="ira-workshop__block-body">{children}</div>
    </section>
  );
}

export default function WorkshopPanel({ collapsed, onToggle }: Props) {
  const { pathname } = useLocation();
  const c = resolveWorkshopContent(pathname);

  if (collapsed) {
    return (
      <div className="ira-workshop ira-workshop--collapsed">
        <button
          type="button"
          className="ira-workshop__peek"
          onClick={onToggle}
          title={`展开 Workshop · ${c.moduleLabel}`}
          aria-expanded={false}
          aria-label="展开 Workshop 侧栏"
        >
          <span className="ira-workshop__peek-label">W</span>
        </button>
      </div>
    );
  }

  return (
    <aside className="ira-workshop" aria-label="Workshop 教学法与实现说明">
      <div className="ira-workshop__head">
        <span className="ira-workshop__head-title">Workshop</span>
        <button
          type="button"
          className="ira-workshop__collapse-btn"
          onClick={onToggle}
          title="收起 Workshop"
          aria-expanded
        >
          <span aria-hidden>▶</span>
        </button>
      </div>
      <div className="ira-workshop__scroll">
        <header className="ira-workshop__hero">
          <p className="ira-workshop__module-pill">{c.moduleLabel}</p>
          <h2 className="ira-workshop__page-title">{c.title}</h2>
          <p className="ira-workshop__summary">{c.summary}</p>
        </header>

        <WorkshopBlock kicker="教学法阶段" title={`${c.phase.indexLabel} ${c.phase.name}`}>
          <p className="ira-workshop__p">{c.phase.teachingFocus}</p>
        </WorkshopBlock>

        <WorkshopBlock kicker="本页主练环节（对照总表 §一）">
          <ul className="ira-workshop__ul">
            {c.primaryPedagogy.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </WorkshopBlock>

        <WorkshopBlock kicker="练习目标">
          <ul className="ira-workshop__ul">
            {c.practiceGoals.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </WorkshopBlock>

        <WorkshopBlock kicker="后端接口（/api/v1）">
          <ul className="ira-workshop__ul ira-workshop__ul--mono">
            {c.apis.map((x, i) => (
              <li key={i}>
                <code className="ira-workshop__code">{x}</code>
              </li>
            ))}
          </ul>
        </WorkshopBlock>

        <WorkshopBlock kicker="复刻与落地（Spec / Glue / Debug / 联调）">
          <div className="ira-workshop__impl-stack">
            {c.implementation.map((block) => (
              <div key={block.title} className="ira-workshop__impl-item">
                <p className="ira-workshop__impl-item-title">{block.title}</p>
                <p className="ira-workshop__p">{block.body}</p>
              </div>
            ))}
          </div>
        </WorkshopBlock>

        {c.epicHint ? (
          <WorkshopBlock kicker="Epic 对照（§四）">
            <p className="ira-workshop__p">{c.epicHint}</p>
          </WorkshopBlock>
        ) : null}

        <div className="ira-workshop__placeholder ira-workshop__placeholder--footer">
          <p className="ira-workshop__placeholder-title">文档与配置</p>
          <p className="ira-workshop__placeholder-text">
            完整映射见仓库{" "}
            <code className="ira-workshop__code">投研助手-Workshop-环节与教学法映射.md</code>；侧栏数据来自{" "}
            <code className="ira-workshop__code">workshopContent.ts</code>。
          </p>
        </div>
      </div>
    </aside>
  );
}
