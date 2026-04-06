import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getJson } from "../api/client";
import WorkshopPanel from "./WorkshopPanel";
import { filterNavItems, NAV_SECTIONS } from "../config/nav";
import { useAuth } from "../context/AuthContext";
import { usePersistedBoolean } from "../hooks/usePersistedBoolean";

const LS_SIDEBAR = "ira-workshop.ui.sidebarCollapsed";
const LS_WORKSHOP = "ira-workshop.ui.workshopCollapsed";

export default function ConsoleLayout() {
  const navigate = useNavigate();
  const { logout, username } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistedBoolean(LS_SIDEBAR, false);
  const [workshopCollapsed, setWorkshopCollapsed] = usePersistedBoolean(LS_WORKSHOP, false);
  const [showMvpResearchNav, setShowMvpResearchNav] = useState(false);

  useEffect(() => {
    function loadNavPrefs() {
      getJson<{ preferences?: { show_research_qa_mvp_nav?: boolean } }>("/system/settings")
        .then((s) => setShowMvpResearchNav(Boolean(s.preferences?.show_research_qa_mvp_nav)))
        .catch(() => setShowMvpResearchNav(false));
    }
    loadNavPrefs();
    window.addEventListener("ira-workshop-prefs-updated", loadNavPrefs);
    return () => window.removeEventListener("ira-workshop-prefs-updated", loadNavPrefs);
  }, []);

  return (
    <div className="ira-app">
      <div className="ira-app__shell">
        <div className="ira-app__left">
          <header className="ira-global-header" role="banner">
            <div className="ira-global-header__bar">
              <div className="ira-global-header__brand">
                <div className="ira-global-header__title-row">
                  <button
                    type="button"
                    className="ira-header__sidebar-toggle"
                    onClick={() => setSidebarCollapsed((c) => !c)}
                    title={sidebarCollapsed ? "展开菜单" : "收起菜单"}
                    aria-expanded={!sidebarCollapsed}
                    aria-label={sidebarCollapsed ? "展开主导航" : "收起主导航"}
                  >
                    <span className="ira-header__sidebar-toggle-icon" aria-hidden>
                      <span className="ira-header__burger-line" />
                      <span className="ira-header__burger-line" />
                      <span className="ira-header__burger-line" />
                    </span>
                  </button>
                  <div>
                    <h1 className="ira-global-header__title">投研智能工作台</h1>
                    <p className="ira-global-header__subtitle">机构级投研辅助 · 合规与可追溯演示环境</p>
                  </div>
                </div>
              </div>
              <div className="ira-global-header__meta">
                <span className="ira-chip ira-chip--info" title={`已登录：${username ?? ""}`}>
                  {username ?? "—"}
                </span>
                <span className="ira-chip ira-chip--info">内部演示</span>
                <button
                  type="button"
                  className="ira-console-logout"
                  onClick={() => {
                    logout();
                    navigate("/", { replace: true });
                  }}
                  title="退出并返回官网"
                >
                  退出
                </button>
              </div>
            </div>
            <div className="ira-global-header__accent" aria-hidden />
          </header>

          <div className="ira-app__body">
            <aside className={`ira-sidebar${sidebarCollapsed ? " ira-sidebar--collapsed" : ""}`}>
              <nav className="ira-sidebar__nav" aria-label="主导航">
                {NAV_SECTIONS.map((sec) => {
                  const items = filterNavItems(sec.items, showMvpResearchNav);
                  if (items.length === 0) return null;
                  return (
                    <div key={sec.id} className="ira-sidebar__group">
                      {!sidebarCollapsed && (
                        <div className="ira-sidebar__section-title" aria-hidden>
                          {sec.title}
                        </div>
                      )}
                      {items.map(({ to, label, short, secondary, workshopModule }) => (
                        <NavLink
                          key={to}
                          to={to}
                          className={({ isActive }) =>
                            `ira-navlink${isActive ? " ira-navlink--active" : ""}${secondary ? " ira-navlink--secondary" : ""}`
                          }
                          title={
                            secondary
                              ? `${label}（扩展演示${workshopModule ? ` · ${workshopModule}` : ""}）`
                              : workshopModule
                                ? `${label} · ${workshopModule}`
                                : label
                          }
                        >
                          <span className="ira-navlink__full">
                            <span className="ira-navlink__label">{label}</span>
                            <span className="ira-navlink__badges">
                              {workshopModule ? (
                                <span
                                  className="ira-navlink__mod"
                                  title={
                                    workshopModule === "M2"
                                      ? "对照 modules-practice/module-02（Glue 多源 / Ingest）"
                                      : `对照 modules-practice（${workshopModule}）`
                                  }
                                >
                                  {workshopModule}
                                </span>
                              ) : null}
                              {secondary ? (
                                <span className="ira-navlink__badge" title="扩展演示">
                                  扩展
                                </span>
                              ) : null}
                            </span>
                          </span>
                          <span className="ira-navlink__short" aria-hidden>
                            {short}
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  );
                })}
              </nav>
            </aside>

            <div className="ira-app__main-wrap">
              <main className="ira-main">
                <div className="ira-main__body">
                  <Outlet />
                </div>
              </main>

              <footer className="ira-app-footer" role="contentinfo">
                <div className="ira-app-footer__inner">
                  <span
                    className="ira-app-footer__muted"
                    title="Workshop 演示环境；未嵌入 CoPaw 运行时，可通过外链 / MCP / Skills 与 CoPaw 联动。"
                  >
                    IRA Workshop · 内部演示
                  </span>
                  <span className="ira-app-footer__risk" title="法律与合规提示">
                    不构成投资建议
                  </span>
                </div>
              </footer>
            </div>
          </div>
        </div>

        <WorkshopPanel collapsed={workshopCollapsed} onToggle={() => setWorkshopCollapsed((c) => !c)} />
      </div>
    </div>
  );
}
