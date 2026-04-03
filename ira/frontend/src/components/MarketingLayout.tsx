import { Link, Outlet } from "react-router-dom";

export default function MarketingLayout() {
  return (
    <div className="ira-site">
      <header className="ira-site-header">
        <div className="ira-site-header__inner">
          <Link to="/" className="ira-site-logo">
            <span className="ira-site-logo__mark" aria-hidden />
            <span className="ira-site-logo__text">投研智能</span>
          </Link>
          <nav className="ira-site-header__nav" aria-label="官网导航">
            <Link to="/" className="ira-site-header__link">
              首页
            </Link>
            <Link to="/login?next=/workbench" className="ira-site-header__cta">
              控制台
            </Link>
          </nav>
        </div>
      </header>
      <main className="ira-site-main">
        <Outlet />
      </main>
      <footer className="ira-site-footer">
        <div className="ira-site-footer__inner">
          <span>© Workshop 演示 · 不构成投资建议</span>
          <span className="ira-site-footer__muted">数据均为演示或 Mock</span>
        </div>
      </footer>
    </div>
  );
}
