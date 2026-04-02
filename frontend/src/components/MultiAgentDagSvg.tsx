/**
 * 多 Agent 协作 DAG 示意图：User → BFF → 编排 → 并行子 Agent → 合并 → 合规闸门
 * phase：loading 时 0–5 顺序高亮；completed 时全图完成态
 */

type Props = {
  phase: number;
  loading: boolean;
  completed: boolean;
};

const VB_W = 560;
const VB_H = 280;

export default function MultiAgentDagSvg({ phase, loading, completed }: Props) {
  const p = phase;

  const u = loading && p === 0;
  const b = loading && p === 1;
  const o = loading && p === 2;
  const w = loading && p === 3;
  const m = loading && p === 4;
  const g = loading && p === 5;

  const e0 = loading && p >= 1;
  const e1 = loading && p >= 2;
  const e2 = loading && p >= 3;
  const e3 = loading && p >= 4;
  const e4 = loading && p >= 5;

  return (
    <figure className="ira-magent-dag" aria-labelledby="magent-dag-title">
      <figcaption id="magent-dag-title" className="ira-magent-dag__caption">
        编排关系示意图（扇出并行 · 汇总 · 合规）
      </figcaption>
      <svg
        className={`ira-magent-dag__svg${loading ? " ira-magent-dag__svg--running" : ""}${completed ? " ira-magent-dag__svg--done" : ""}`}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height="auto"
        role="img"
        aria-label="用户经 BFF 到编排 Agent，并行连接行业量化合规三只子 Agent，汇入合并节点再进入合规闸门"
      >
        <title>多 Agent DAG</title>
        <desc>从左到右为请求路径，编排向下扇出至三只 Agent，再汇聚至合并与合规。</desc>

        <defs>
          <marker id="magent-arr-off" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 z" fill="#94a3b8" />
          </marker>
          <marker id="magent-arr-on" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 z" fill="#004099" />
          </marker>
        </defs>

        <g className="ira-magent-dag__edges" fill="none" strokeWidth="2" strokeLinecap="round">
          <line
            className={`ira-magent-dag__edge ${e0 ? "ira-magent-dag__edge--on" : ""}`}
            x1="88"
            y1="54"
            x2="108"
            y2="54"
            markerEnd={e0 ? "url(#magent-arr-on)" : "url(#magent-arr-off)"}
          />
          <line
            className={`ira-magent-dag__edge ${e1 ? "ira-magent-dag__edge--on" : ""}`}
            x1="180"
            y1="54"
            x2="218"
            y2="54"
            markerEnd={e1 ? "url(#magent-arr-on)" : "url(#magent-arr-off)"}
          />
          <path
            className={`ira-magent-dag__edge ${e2 ? "ira-magent-dag__edge--on" : ""}`}
            d="M 280 80 L 84 140"
            markerEnd={e2 ? "url(#magent-arr-on)" : "url(#magent-arr-off)"}
          />
          <path
            className={`ira-magent-dag__edge ${e2 ? "ira-magent-dag__edge--on" : ""}`}
            d="M 280 80 L 280 140"
            markerEnd={e2 ? "url(#magent-arr-on)" : "url(#magent-arr-off)"}
          />
          <path
            className={`ira-magent-dag__edge ${e2 ? "ira-magent-dag__edge--on" : ""}`}
            d="M 280 80 L 476 140"
            markerEnd={e2 ? "url(#magent-arr-on)" : "url(#magent-arr-off)"}
          />
          <path
            className={`ira-magent-dag__edge ${e3 ? "ira-magent-dag__edge--on" : ""}`}
            d="M 84 184 L 268 210"
            markerEnd={e3 ? "url(#magent-arr-on)" : "url(#magent-arr-off)"}
          />
          <path
            className={`ira-magent-dag__edge ${e3 ? "ira-magent-dag__edge--on" : ""}`}
            d="M 280 184 L 280 210"
            markerEnd={e3 ? "url(#magent-arr-on)" : "url(#magent-arr-off)"}
          />
          <path
            className={`ira-magent-dag__edge ${e3 ? "ira-magent-dag__edge--on" : ""}`}
            d="M 476 184 L 292 210"
            markerEnd={e3 ? "url(#magent-arr-on)" : "url(#magent-arr-off)"}
          />
          <line
            className={`ira-magent-dag__edge ${e4 ? "ira-magent-dag__edge--on" : ""}`}
            x1="324"
            y1="232"
            x2="398"
            y2="232"
            markerEnd={e4 ? "url(#magent-arr-on)" : "url(#magent-arr-off)"}
          />
          <path
            className="ira-magent-dag__edge ira-magent-dag__edge--dash"
            d="M 160 168 Q 260 120 360 168"
            strokeDasharray="6 5"
          />
        </g>

        <g className="ira-magent-dag__nodes" strokeWidth="1.5">
          <g className={`ira-magent-dag__node ${u ? "ira-magent-dag__node--active" : ""}`} transform="translate(8, 32)">
            <rect width="80" height="44" rx="8" />
            <text x="40" y="28" textAnchor="middle">
              用户
            </text>
          </g>
          <g className={`ira-magent-dag__node ${b ? "ira-magent-dag__node--active" : ""}`} transform="translate(108, 32)">
            <rect width="72" height="44" rx="8" />
            <text x="36" y="28" textAnchor="middle">
              BFF
            </text>
          </g>
          <g className={`ira-magent-dag__node ira-magent-dag__node--orch ${o ? "ira-magent-dag__node--active" : ""}`} transform="translate(218, 22)">
            <rect width="124" height="58" rx="10" />
            <text x="62" y="28" textAnchor="middle">
              编排 Agent
            </text>
            <text x="62" y="46" textAnchor="middle" className="ira-magent-dag__sub">
              fan-out
            </text>
          </g>
          <g className={`ira-magent-dag__node ira-magent-dag__node--ind ${w ? "ira-magent-dag__node--active" : ""}`} transform="translate(40, 140)">
            <rect width="88" height="44" rx="8" />
            <text x="44" y="28" textAnchor="middle">
              行业
            </text>
          </g>
          <g className={`ira-magent-dag__node ira-magent-dag__node--quant ${w ? "ira-magent-dag__node--active" : ""}`} transform="translate(236, 140)">
            <rect width="88" height="44" rx="8" />
            <text x="44" y="28" textAnchor="middle">
              量化
            </text>
          </g>
          <g className={`ira-magent-dag__node ira-magent-dag__node--risk ${w ? "ira-magent-dag__node--active" : ""}`} transform="translate(432, 140)">
            <rect width="88" height="44" rx="8" />
            <text x="44" y="28" textAnchor="middle">
              合规
            </text>
          </g>
          <g className={`ira-magent-dag__node ira-magent-dag__node--merge ${m ? "ira-magent-dag__node--active" : ""}`} transform="translate(236, 210)">
            <rect width="88" height="44" rx="8" />
            <text x="44" y="28" textAnchor="middle">
              合并
            </text>
          </g>
          <g className={`ira-magent-dag__node ira-magent-dag__node--gate ${g ? "ira-magent-dag__node--active" : ""}`} transform="translate(398, 210)">
            <rect width="120" height="44" rx="8" />
            <text x="60" y="28" textAnchor="middle">
              合规闸门
            </text>
          </g>
        </g>

        <text x="260" y="128" textAnchor="middle" className="ira-magent-dag__reply-hint">
          reply_to
        </text>
      </svg>
    </figure>
  );
}
