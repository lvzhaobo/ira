import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "投研智能",
    desc: "研报问答、个股覆盖与多 Agent 编排演示，贴合机构工作流。",
    to: "/login?next=/research-qa-change",
    link: "进入研报问答",
  },
  {
    title: "合规与可追溯",
    desc: "合规扫描、数据血缘与审计线索，关键操作带 trace 展示。",
    to: "/login?next=/compliance",
    link: "合规扫描",
  },
  {
    title: "舆情与报告",
    desc: "舆情看板、报告登记与系统设置，支持 Workshop 扩展联调。",
    to: "/login?next=/sentiment",
    link: "舆情监控",
  },
];

export default function Landing() {
  return (
    <div className="ira-landing">
      <section className="ira-landing-hero" aria-labelledby="ira-landing-hero-title">
        <div className="ira-landing-hero__bg" aria-hidden />
        <div className="ira-landing-hero__inner">
          <p className="ira-landing-hero__eyebrow">IRA Workshop · 内部演示环境</p>
          <h1 id="ira-landing-hero-title" className="ira-landing-hero__title">
            投研智能工作台
          </h1>
          <p className="ira-landing-hero__lead">
            面向基金与资管团队的统一入口：问答、合规、血缘、舆情与报告流转。浅色界面、可演示、可扩展至 CoPaw 与百炼能力。
          </p>
          <div className="ira-landing-hero__actions">
            <Link to="/login?next=/workbench" className="ira-landing-btn ira-landing-btn--primary">
              进入工作台
            </Link>
            <Link to="/login?next=/settings" className="ira-landing-btn ira-landing-btn--ghost">
              系统与 OpenAPI
            </Link>
          </div>
          <p className="ira-landing-hero__note">不构成投资建议 · 数据均为演示或 Mock，请勿用于实盘决策</p>
        </div>
      </section>

      <section className="ira-landing-features" aria-label="能力概览">
        <h2 className="ira-landing-features__heading">能力概览</h2>
        <ul className="ira-landing-features__grid">
          {FEATURES.map((f) => (
            <li key={f.title} className="ira-landing-card">
              <h3 className="ira-landing-card__title">{f.title}</h3>
              <p className="ira-landing-card__desc">{f.desc}</p>
              <Link to={f.to} className="ira-landing-card__link">
                {f.link} →
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
