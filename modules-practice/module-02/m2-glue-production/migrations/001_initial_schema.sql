-- ============================================================
-- M2 数据库迁移脚本 (S0 阶段)
-- 
-- 【来源】按照 10-数据模型与存储规格 §2 表定义生成
-- 【说明】创建 ingest_* 表结构
-- ============================================================

-- 2.1 ingest_data_sources 表
-- 【来源】抄自 10-数据模型 §2.1
CREATE TABLE IF NOT EXISTS ingest_data_sources (
    id UUID PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    provider_type VARCHAR(32) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    config JSONB NOT NULL,
    secret_ref VARCHAR(256),  -- KMS/环境变量键名，禁止明文落库
    schedule_cron VARCHAR(64),
    last_job_id UUID,  -- FK → ingest_sync_jobs.id (延迟创建)
    last_success_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_sources_enabled ON ingest_data_sources(enabled);
CREATE INDEX idx_sources_provider_type ON ingest_data_sources(provider_type);


-- 2.2 ingest_sync_jobs 表
-- 【来源】抄自 10-数据模型 §2.2
CREATE TABLE IF NOT EXISTS ingest_sync_jobs (
    id UUID PRIMARY KEY,
    source_id UUID NOT NULL REFERENCES ingest_data_sources(id),
    status VARCHAR(24) NOT NULL,  -- queued/running/success/failed/partial/cancelled
    mode VARCHAR(16) NOT NULL,  -- full/incremental
    idempotency_key VARCHAR(128),
    stats JSONB,  -- fetched/normalized/publishedToM1/skipped
    errors JSONB,  -- 抽样数组
    error_summary TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 唯一约束（幂等）
    CONSTRAINT uq_source_idempotency UNIQUE (source_id, idempotency_key)
);

-- 索引
CREATE INDEX idx_jobs_source_created ON ingest_sync_jobs(source_id, created_at DESC);
CREATE INDEX idx_jobs_status_active ON ingest_sync_jobs(status) 
    WHERE status IN ('queued', 'running');


-- 2.3 ingest_feed_items 表（可选 · M1 未联通时缓冲）
-- 【来源】抄自 10-数据模型 §2.3
CREATE TABLE IF NOT EXISTS ingest_feed_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ingest_sync_jobs(id),
    source_id UUID NOT NULL REFERENCES ingest_data_sources(id),
    external_ref VARCHAR(256) NOT NULL,  -- 上游主键，去重用
    normalized_title TEXT,
    normalized_summary TEXT,
    normalized_body TEXT,
    raw_payload_ref TEXT,  -- OSS 大报文
    published_message_id UUID,  -- 对应 M1 research_messages.id
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 唯一约束（去重，延迟添加）
    CONSTRAINT uq_source_external_ref UNIQUE (source_id, external_ref)
);

-- 索引
CREATE INDEX idx_feed_items_job ON ingest_feed_items(job_id);
CREATE INDEX idx_feed_items_source ON ingest_feed_items(source_id);


-- 种子数据（S0 阶段）
-- 【来源】参考 12-实施计划 S0: 种子数据源
INSERT INTO ingest_data_sources (id, name, provider_type, enabled, config, secret_ref)
VALUES 
    ('source-sina-mock', '新浪财经 (Mock)', 'sina', true, 
     '{"feed_url": "${IRA_VIN_MOCK_BASE}/mock/v1/sina/finance/news/list.json"}', 
     'SINA_API_KEY'),
    ('source-em-mock', '东方财富 (Mock)', 'eastmoney', true,
     '{"feed_url": "${IRA_VIN_MOCK_BASE}/mock/v1/eastmoney/api/news/flash"}',
     'EASTMONEY_API_KEY')
ON CONFLICT (id) DO NOTHING;
