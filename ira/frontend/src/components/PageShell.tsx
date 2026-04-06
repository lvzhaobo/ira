import { useLocation } from "react-router-dom";
import { isSecondaryNavPath } from "../config/nav";
import { resolvePageMode, tagLabel, type PageTagKind } from "../config/pageModes";
import { workshopModuleCode, workshopModuleTitleHint } from "../config/workshopModuleTags";

function tagClass(kind: PageTagKind): string {
  switch (kind) {
    case "api":
      return "ira-tag ira-tag--api";
    case "demo":
      return "ira-tag ira-tag--demo";
    case "placeholder":
      return "ira-tag ira-tag--placeholder";
    case "live":
      return "ira-tag ira-tag--live";
    case "mockWarn":
      return "ira-tag ira-tag--mock-warn";
    case "liveLlm":
      return "ira-tag ira-tag--live-llm";
    case "extended":
      return "ira-tag ira-tag--extended";
    default:
      return "ira-tag ira-tag--demo";
  }
}

export default function PageShell({
  title,
  children,
  extraTags,
  note,
}: {
  title: string;
  children: React.ReactNode;
  /** 可选：完全自定义标签行（如动态 LLM 状态） */
  extraTags?: { kind: PageTagKind; label?: string }[];
  /** 可选：覆盖页头下方说明（不传则使用路由默认 note） */
  note?: string | null;
}) {
  const { pathname } = useLocation();
  const mode = resolvePageMode(pathname);
  const baseTags = extraTags?.length
    ? extraTags.map((x) => ({ kind: x.kind, label: x.label ?? tagLabel(x.kind) }))
    : mode.tags.map((k) => ({ kind: k, label: tagLabel(k) }));
  const extLabel = tagLabel("extended");
  let tags =
    isSecondaryNavPath(pathname) && !baseTags.some((t) => t.label === extLabel)
      ? [...baseTags, { kind: "extended" as PageTagKind, label: extLabel }]
      : baseTags;
  const wm = workshopModuleCode(pathname);
  const wmHint = workshopModuleTitleHint(pathname);
  if (wm && !tags.some((t) => t.label === wm)) {
    tags = [...tags, { kind: "placeholder" as PageTagKind, label: wm }];
  }
  const displayNote =
    note === null ? null : note !== undefined ? note : extraTags?.length ? null : mode.note;
  const tagTitle = typeof displayNote === "string" ? displayNote : mode.note;

  return (
    <div className="ira-stack">
      <div className="ira-page-header">
        <h1>{title}</h1>
        <div>
          <div className="ira-tags">
            {tags.map((t) => {
              const isWm = wm && t.label === wm;
              return (
                <span
                  key={`${t.kind}-${t.label}`}
                  className={isWm ? "ira-tag ira-tag--workshop-mod" : tagClass(t.kind)}
                  title={isWm ? wmHint ?? tagTitle : tagTitle}
                >
                  {isWm ? `${t.label} · Glue` : t.label}
                </span>
              );
            })}
          </div>
          {displayNote ? (
            <p className="ira-tag-note" style={{ margin: "0.35rem 0 0" }}>
              {displayNote}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}
