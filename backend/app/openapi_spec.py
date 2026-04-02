"""OpenAPI 3.0 描述（与 Flask /api/v1 路由对齐；含示例与生产 JWT 占位）。"""

from __future__ import annotations


def build_openapi_spec() -> dict:
    return {
        "openapi": "3.0.3",
        "info": {
            "title": "IRA Workshop · 投研智能演示 API",
            "version": "1.2.0",
            "description": (
                "基金公司投研辅助 Workshop 后端：研报问答、合规扫描、血缘、舆情、推送、报告登记等。"
                " 业务数据默认落本地 JSON（演示）。\n\n"
                "**Swagger UI**：开发时经前端代理访问路径 `/api/docs`（需后端进程已加载最新代码并已启动）。\n\n"
                "**鉴权**：`bearerAuth` 为生产常见 **JWT Bearer** 占位；本演示服务**不校验**令牌，"
                "Try it out 可不填；对接网关后在网关或中间件统一校验即可。"
            ),
        },
        "servers": [{"url": "/api/v1", "description": "当前服务（Vite dev 下与页面同源代理）"}],
        # 空对象 {} = 允许匿名；bearerAuth = 可选带 JWT（满足其一即可）
        "security": [{}, {"bearerAuth": []}],
        "tags": [
            {"name": "system", "description": "健康检查、工作台设置与偏好"},
            {"name": "dashboard", "description": "工作台待办与 KPI"},
            {"name": "compliance", "description": "合规规则与扫描"},
            {"name": "lineage", "description": "结论与调用血缘"},
            {"name": "research", "description": "研报问答与个股/多 Agent"},
            {"name": "sentiment", "description": "舆情关键词与预警"},
            {"name": "notify", "description": "消息推送 dry-run"},
            {"name": "kb", "description": "知识库文档与索引状态"},
            {"name": "reports", "description": "投研报告草稿与流转（登记簿）"},
        ],
        "paths": _paths(),
        "components": {
            "securitySchemes": {
                "bearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT",
                    "description": "Authorization: Bearer <access_token>。生产由统一认证（如 OAuth2/OIDC）签发；Workshop 不校验。",
                }
            },
            "schemas": _schemas(),
            "examples": _examples_map(),
        },
    }


def _examples_map() -> dict:
    """供 $ref: '#/components/examples/Name' 引用（部分工具亦支持内联 examples）。"""
    return {
        "HealthLive": {
            "summary": "百炼已配置",
            "value": {
                "ok": True,
                "ruleset_version": "rules-v1.0.0",
                "index_ver": "v2.3.0",
                "mock_quote": True,
                "copaw_bridge": "disabled",
                "research_qa_llm": {"enabled": True, "provider": "dashscope", "model": "qwen-plus"},
            },
        },
        "HealthOffline": {
            "summary": "百炼未配置",
            "value": {
                "ok": True,
                "ruleset_version": "rules-v1.0.0",
                "index_ver": "v2.3.0",
                "mock_quote": True,
                "copaw_bridge": "disabled",
                "research_qa_llm": {"enabled": False, "provider": None, "model": None},
            },
        },
        "SettingsBundle": {
            "summary": "设置与偏好",
            "value": {
                "api_base": "/api/v1",
                "mock_quote": True,
                "build": "ira-workshop-dev",
                "data_classification": "演示数据 · 不得用于投资决策",
                "swagger_ui_path": "/api/docs",
                "openapi_spec_path": "/api/v1/openapi.json",
                "preferences": {
                    "default_route": "/workbench",
                    "show_workshop_panel": True,
                    "show_research_qa_mvp_nav": False,
                    "reports_default_filter_stage": "all",
                    "updated_at": "2026-04-02T00:00:00Z",
                },
            },
        },
        "QaAskRequest": {
            "summary": "MVP 问答",
            "value": {
                "session_id": "sess_mvp_abc123",
                "query": "请根据知识库摘要消费行业景气度，并列出引用材料标题（不构成投资建议）。",
                "spec_milestone": "mvp-v1",
            },
        },
        "QaAskRequestChange": {
            "summary": "需求变更场景（带头部 X-Spec-Version）",
            "value": {
                "session_id": "sess_change_xyz",
                "query": "请说明组合集中度风险及依据范围。",
                "require_risk_label": True,
            },
        },
        "QaAskResponse": {
            "summary": "问答返回",
            "value": {
                "answer": "（示例）基于已登记材料的摘要…\n\n【风险标签】中",
                "trace_id": "tr_qa_demo_001",
                "risk_level": "中",
                "model": {"model_id": "qwen-plus"},
                "evidence_refs": [{"doc_id": "d1", "title": "消费行业周报.pdf", "snippet": "…"}],
            },
        },
        "ComplianceScanRequest": {
            "summary": "含敏感词（易命中 R-G01）",
            "value": {"text": "建议您全仓买入白酒龙头，明天开盘清仓债券。", "context_trace_id": None},
        },
        "ComplianceScanResponseHit": {
            "summary": "命中规则",
            "value": {
                "trace_id": "tr_scan_001",
                "blocked": True,
                "hits": [{"rule_id": "R-G01", "span": "investment_ops", "message": "疑似个性化投资操作表述"}],
                "ruleset_version": "rules-v1.0.0",
            },
        },
        "NotifyPushRequest": {
            "summary": "飞书渠道 dry-run",
            "value": {
                "channel_id": "feishu",
                "payload": "【演示】研报摘要已生成，请登录工作台查看。",
                "source_trace_id": "tr_qa_demo_001",
            },
        },
        "NotifyPushResponse": {
            "summary": "推送已记录",
            "value": {"trace_id": "tr_push_001", "dry_run": True},
        },
        "ReportDraftPatchRequest": {
            "summary": "推进至内审",
            "value": {"workflow_stage": "内审中", "compliance_status": "未送审"},
        },
        "ReportDraftRow": {
            "summary": "登记簿一行",
            "value": {
                "id": "rep-2026-041",
                "title": "XX消费领先混合 · 2026Q1 季报观点（内部讨论稿）",
                "report_type": "季度策略",
                "product_line": "公募 · 混合型",
                "product_code": "000001",
                "report_period": "2026-Q1",
                "department": "权益研究部",
                "owner": "张研",
                "reviewer": "李总监",
                "workflow_stage": "合规审核",
                "compliance_status": "待合规意见",
                "confidentiality": "内部",
                "updated_at": "2026-04-02",
                "due_at": "2026-04-06",
                "trace_id": "tr_rep_041",
            },
        },
        "LineageTrace": {
            "summary": "血缘单条",
            "value": {
                "trace_id": "tr_qa_demo_001",
                "artifact_type": "qa_answer",
                "summary": "消费行业问答",
                "created_at": "2026-04-02T10:00:00",
                "model": {"model_id": "qwen-plus", "prompt_version": "ira-qa-v1", "temperature": 0.2},
                "compliance": {"ruleset_version": "rules-v1.0.0", "filtered": False, "decline_reason": None},
            },
        },
    }


def _schemas() -> dict:
    return {
        "Error": {
            "type": "object",
            "properties": {
                "error": {
                    "type": "object",
                    "properties": {"code": {"type": "string"}, "message": {"type": "string"}},
                }
            },
            "example": {"error": {"code": "NOT_FOUND", "message": "unknown_id"}},
        },
        "ReportDraft": {
            "type": "object",
            "description": "报告登记簿行（字段随业务扩展）",
            "properties": {
                "id": {"type": "string"},
                "title": {"type": "string"},
                "report_type": {"type": "string"},
                "product_line": {"type": "string"},
                "product_code": {"type": "string"},
                "report_period": {"type": "string"},
                "department": {"type": "string"},
                "owner": {"type": "string"},
                "reviewer": {"type": "string"},
                "workflow_stage": {"type": "string", "description": "编制中/内审中/合规审核/待签章/已定稿"},
                "compliance_status": {"type": "string"},
                "confidentiality": {"type": "string"},
                "updated_at": {"type": "string", "format": "date"},
                "due_at": {"type": "string"},
                "trace_id": {"type": "string"},
            },
        },
        "ReportDraftPatch": {
            "type": "object",
            "properties": {
                "workflow_stage": {"type": "string"},
                "compliance_status": {"type": "string"},
                "owner": {"type": "string"},
                "reviewer": {"type": "string"},
                "title": {"type": "string"},
            },
            "example": {"workflow_stage": "内审中"},
        },
        "WorkspacePreferences": {
            "type": "object",
            "properties": {
                "default_route": {"type": "string", "example": "/workbench"},
                "show_workshop_panel": {"type": "boolean"},
                "reports_default_filter_stage": {"type": "string", "enum": ["all", "编制中", "内审中", "合规审核", "待签章", "已定稿"]},
                "updated_at": {"type": "string"},
            },
            "example": {"default_route": "/reports", "show_workshop_panel": False, "reports_default_filter_stage": "合规审核"},
        },
    }


def _ex_ref(name: str) -> dict:
    return {"$ref": f"#/components/examples/{name}"}


def _json_multi_examples(*names: str) -> dict:
    return {"application/json": {"examples": {n: _ex_ref(n) for n in names}}}


def _json_example_response(*names: str) -> dict:
    return {"description": "OK", "content": _json_multi_examples(*names)}


def _paths() -> dict:
    return {
        "/system/health": {
            "get": {
                "tags": ["system"],
                "summary": "服务健康与百炼等能力探测",
                "responses": {
                    "200": _json_example_response("HealthLive", "HealthOffline"),
                },
            }
        },
        "/system/settings": {
            "get": {
                "tags": ["system"],
                "summary": "工作台静态配置 + 用户偏好（演示持久化）",
                "responses": {"200": _json_example_response("SettingsBundle")},
            }
        },
        "/system/preferences": {
            "put": {
                "tags": ["system"],
                "summary": "更新工作台偏好（写入 workspace_preferences.json）",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/WorkspacePreferences"},
                            "examples": {
                                "partial": {
                                    "summary": "仅改默认页",
                                    "value": {"default_route": "/research-qa", "show_workshop_panel": True},
                                },
                                "reports_filter": {
                                    "summary": "报告页默认环节",
                                    "value": {"reports_default_filter_stage": "合规审核"},
                                },
                            },
                        }
                    },
                },
                "responses": {
                    "200": {
                        "description": "更新后的偏好对象",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/WorkspacePreferences"},
                                "examples": {
                                    "saved": {
                                        "value": {
                                            "default_route": "/workbench",
                                            "show_workshop_panel": True,
                                            "reports_default_filter_stage": "合规审核",
                                            "updated_at": "2026-04-02T12:00:00Z",
                                        }
                                    }
                                },
                            }
                        },
                    }
                },
            }
        },
        "/dashboard/todos": {
            "get": {"tags": ["dashboard"], "summary": "待办列表", "responses": {"200": {"description": "OK"}}}
        },
        "/dashboard/kpi": {
            "get": {"tags": ["dashboard"], "summary": "工作台 KPI", "responses": {"200": {"description": "OK"}}}
        },
        "/sessions/recent": {
            "get": {"tags": ["dashboard"], "summary": "最近会话摘要", "responses": {"200": {"description": "OK"}}}
        },
        "/compliance/rules": {
            "get": {"tags": ["compliance"], "summary": "规则集与条目", "responses": {"200": {"description": "OK"}}}
        },
        "/compliance/scan": {
            "post": {
                "tags": ["compliance"],
                "summary": "文本扫描（命中写审计 blocks）",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "text": {"type": "string"},
                                    "context_trace_id": {"type": "string", "nullable": True},
                                },
                            },
                            "examples": {
                                "hit_ops": _ex_ref("ComplianceScanRequest"),
                                "pass": {
                                    "summary": "无命中（示例）",
                                    "value": {"text": "本材料仅供内部研究使用，不构成投资建议。", "context_trace_id": None},
                                },
                            },
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "trace_id / blocked / hits",
                        "content": _json_multi_examples("ComplianceScanResponseHit"),
                    }
                },
            }
        },
        "/compliance/blocks/recent": {
            "get": {"tags": ["compliance"], "summary": "最近拦截/扫描摘要", "responses": {"200": {"description": "OK"}}}
        },
        "/lineage/traces/{trace_id}": {
            "get": {
                "tags": ["lineage"],
                "summary": "按 trace_id 取单条血缘记录",
                "parameters": [{"name": "trace_id", "in": "path", "required": True, "schema": {"type": "string", "example": "tr_qa_demo_001"}}],
                "responses": {
                    "200": {
                        "description": "记录",
                        "content": _json_multi_examples("LineageTrace"),
                    },
                    "404": {"description": "NOT_FOUND"},
                },
            }
        },
        "/lineage/search": {
            "get": {
                "tags": ["lineage"],
                "summary": "按摘要或 trace 片段检索",
                "parameters": [
                    {"name": "q", "in": "query", "schema": {"type": "string", "example": "消费"}},
                    {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 20}},
                ],
                "responses": {"200": {"description": "items[]"}},
            }
        },
        "/research/qa/ask": {
            "post": {
                "tags": ["research"],
                "summary": "研报问答",
                "parameters": [
                    {
                        "name": "X-Spec-Version",
                        "in": "header",
                        "schema": {"type": "string", "example": "ira-1.1.0"},
                        "description": "需求变更场景传 ira-1.1.0",
                    }
                ],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["session_id", "query"],
                                "properties": {
                                    "session_id": {"type": "string"},
                                    "query": {"type": "string"},
                                    "spec_milestone": {"type": "string"},
                                    "require_risk_label": {"type": "boolean"},
                                },
                            },
                            "examples": {
                                "mvp": _ex_ref("QaAskRequest"),
                                "change": _ex_ref("QaAskRequestChange"),
                            },
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "answer / trace_id / evidence_refs",
                        "content": _json_multi_examples("QaAskResponse"),
                    }
                },
            }
        },
        "/research/qa/upload": {
            "post": {
                "tags": ["research"],
                "summary": "上传研报进入知识库（multipart）",
                "requestBody": {
                    "content": {"multipart/form-data": {"schema": {"type": "object", "properties": {"file": {"type": "string", "format": "binary"}, "session_id": {"type": "string"}}}}}
                },
                "responses": {"200": {"description": "doc_id / trace_id"}},
            }
        },
        "/research/stock/analysis": {
            "post": {
                "tags": ["research"],
                "summary": "个股分析草稿（Mock）",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {"symbol": {"type": "string"}, "mock": {"type": "boolean", "default": True}},
                            },
                            "examples": {
                                "maotai": {"summary": "贵州茅台", "value": {"symbol": "600519.SH", "mock": True}},
                            },
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "content / trace_id / sources",
                        "content": {
                            "application/json": {
                                "examples": {
                                    "draft": {
                                        "summary": "Markdown 草稿",
                                        "value": {
                                            "trace_id": "tr_stock_001",
                                            "content_format": "markdown",
                                            "content": "## 摘要\n…\n**免责声明**：不构成投资建议。",
                                            "sources": [{"name": "Wind", "mock": True}],
                                        },
                                    }
                                }
                            }
                        },
                    }
                },
            }
        },
        "/research/stock/quote": {
            "get": {
                "tags": ["research"],
                "summary": "演示行情",
                "parameters": [
                    {"name": "symbol", "in": "query", "schema": {"type": "string", "example": "600519.SH"}},
                    {"name": "mock", "in": "query", "schema": {"type": "string", "enum": ["true", "false"]}},
                ],
                "responses": {
                    "200": {
                        "description": "last / pe_ttm",
                        "content": {
                            "application/json": {
                                "examples": {
                                    "mock_on": {
                                        "value": {"symbol": "600519.SH", "last": 1688.0, "pe_ttm": 28.1, "mock": True},
                                    }
                                }
                            }
                        },
                    }
                },
            }
        },
        "/research/stock/multi-agent/run": {
            "post": {
                "tags": ["research"],
                "summary": "多 Agent 编排演示运行",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {"symbol": {"type": "string"}, "mock": {"type": "boolean"}},
                            },
                            "examples": {"default": {"value": {"symbol": "600519.SH", "mock": True}}},
                        }
                    }
                },
                "responses": {"200": {"description": "merged_text / discussion / trace_id"}},
            }
        },
        "/sentiment/watchlist": {
            "get": {"tags": ["sentiment"], "summary": "关键词列表", "responses": {"200": {"description": "OK"}}},
            "post": {
                "tags": ["sentiment"],
                "summary": "新增关键词",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {"type": "object", "properties": {"keyword": {"type": "string"}}},
                            "examples": {"kw": {"value": {"keyword": "降准"}}},
                        }
                    }
                },
                "responses": {"200": {"description": "OK"}},
            },
            "delete": {
                "tags": ["sentiment"],
                "summary": "删除关键词",
                "parameters": [{"name": "keyword", "in": "query", "required": True, "schema": {"type": "string"}}],
                "responses": {"204": {"description": "No Content"}},
            },
        },
        "/sentiment/alerts": {
            "get": {"tags": ["sentiment"], "summary": "预警列表", "responses": {"200": {"description": "OK"}}}
        },
        "/sentiment/ingest": {
            "post": {
                "tags": ["sentiment"],
                "summary": "手工灌入一条舆情（演示）",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {"type": "object"},
                            "examples": {
                                "one": {
                                    "value": {
                                        "title": "监管动态",
                                        "summary": "示例摘要",
                                        "source_type": "manual",
                                        "source_name": "console",
                                        "published_at": "2026-04-02",
                                    }
                                }
                            },
                        }
                    }
                },
                "responses": {"200": {"description": "OK"}},
            }
        },
        "/notify/channels": {
            "get": {"tags": ["notify"], "summary": "渠道列表", "responses": {"200": {"description": "OK"}}},
            "put": {
                "tags": ["notify"],
                "summary": "覆盖写渠道配置（演示）",
                "requestBody": {"content": {"application/json": {"schema": {"type": "object"}}}},
                "responses": {"200": {"description": "ok"}},
            },
        },
        "/notify/history": {
            "get": {"tags": ["notify"], "summary": "推送 dry-run 历史", "responses": {"200": {"description": "OK"}}}
        },
        "/notify/push": {
            "post": {
                "tags": ["notify"],
                "summary": "发送推送（dry-run + 合规预扫）",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["payload", "channel_id"],
                                "properties": {
                                    "payload": {"type": "string"},
                                    "channel_id": {"type": "string"},
                                    "subject": {"type": "string"},
                                    "source_trace_id": {"type": "string"},
                                },
                            },
                            "examples": {"feishu": _ex_ref("NotifyPushRequest")},
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "trace_id",
                        "content": _json_multi_examples("NotifyPushResponse"),
                    },
                    "400": {"description": "合规拦截"},
                },
            }
        },
        "/kb/index/status": {
            "get": {"tags": ["kb"], "summary": "索引版本状态", "responses": {"200": {"description": "OK"}}}
        },
        "/kb/documents": {
            "get": {"tags": ["kb"], "summary": "已登记文档", "responses": {"200": {"description": "OK"}}}
        },
        "/reports/drafts": {
            "get": {
                "tags": ["reports"],
                "summary": "报告登记簿列表",
                "responses": {
                    "200": {
                        "description": "items: ReportDraft[]",
                        "content": {
                            "application/json": {
                                "examples": {
                                    "list": {
                                        "summary": "登记簿列表示意",
                                        "value": {
                                            "items": [
                                                {
                                                    "id": "rep-2026-041",
                                                    "title": "XX消费领先混合 · 2026Q1 季报观点（内部讨论稿）",
                                                    "report_type": "季度策略",
                                                    "workflow_stage": "合规审核",
                                                    "compliance_status": "待合规意见",
                                                    "updated_at": "2026-04-02",
                                                    "trace_id": "tr_rep_041",
                                                }
                                            ]
                                        },
                                    }
                                }
                            }
                        },
                    }
                },
            }
        },
        "/reports/drafts/{draft_id}": {
            "get": {
                "tags": ["reports"],
                "summary": "单条报告草稿详情",
                "parameters": [{"name": "draft_id", "in": "path", "required": True, "schema": {"type": "string", "example": "rep-2026-041"}}],
                "responses": {
                    "200": {
                        "description": "ReportDraft",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ReportDraft"},
                                "examples": {"one": _ex_ref("ReportDraftRow")},
                            }
                        },
                    },
                    "404": {"description": "NOT_FOUND"},
                },
            },
            "patch": {
                "tags": ["reports"],
                "summary": "更新流转节点或编制信息（演示写回 JSON）",
                "parameters": [{"name": "draft_id", "in": "path", "required": True, "schema": {"type": "string"}}],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/ReportDraftPatch"},
                            "examples": {"next": _ex_ref("ReportDraftPatchRequest")},
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "更新后的草稿",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ReportDraft"},
                                "examples": {"updated": _ex_ref("ReportDraftRow")},
                            }
                        },
                    },
                    "404": {"description": "NOT_FOUND"},
                },
            },
        },
    }
