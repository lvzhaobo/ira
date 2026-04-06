/** 知识库页：指标与管线说明（与 /kb/* API 并存） */

export type KbKpi = { id: string; label: string; value: string; sub?: string };

export const KB_KPIS: KbKpi[] = [
  { id: "docs", label: "已入库文档", value: "—", sub: "与下方列表同步" },
  { id: "chunks", label: "向量 Chunk 总数", value: "—", sub: "按切片策略估算" },
  { id: "collections", label: "知识域 / 集合", value: "5", sub: "研报 · 合规 · 纪要 · 数据 · 公告" },
  { id: "latency", label: "检索 P95（Mock）", value: "180ms", sub: "生产可接观测" },
];

export const KB_COLLECTIONS: { name: string; count: string; note: string }[] = [
  { name: "卖方研报", count: "1.2k+", note: "OCR + 表格解析" },
  { name: "合规制度", count: "86", note: "版本与生效日" },
  { name: "内部纪要", count: "340", note: "权限：投研" },
  { name: "数据表", count: "520", note: "Wind / 导出" },
  { name: "公告", count: "2.1k+", note: "上交所/深交所" },
];

export const KB_PIPELINE: { step: string; status: "ok" | "mock" | "delay"; detail: string }[] = [
  { step: "解析与分块", status: "ok", detail: "PDF/DOCX/MD，滑动窗口 + 重叠" },
  { step: "向量化", status: "mock", detail: "演示：本地维度 768 Mock" },
  { step: "索引（HNSW）", status: "ok", detail: "版本见 API index_ver" },
  { step: "权限标签", status: "ok", detail: "ACL：内部 / 投研 / 公开" },
];
