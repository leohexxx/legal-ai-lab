-- Legal AI Lab - 数据库初始化脚本
-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 法律知识库 schema
CREATE SCHEMA IF NOT EXISTS knowledge;

-- 来源登记表
CREATE TABLE IF NOT EXISTS knowledge.sources (
    id SERIAL PRIMARY KEY,
    source_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    issuing_authority VARCHAR(200),
    source_type VARCHAR(50),        -- law, regulation,司法解释, case, etc.
    official_url TEXT,
    publication_date DATE,
    effective_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, amended, repealed, draft
    jurisdiction VARCHAR(100),
    retrieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content_hash VARCHAR(64),
    supersedes TEXT[],
    superseded_by TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 法律规则卡
CREATE TABLE IF NOT EXISTS knowledge.rules (
    id SERIAL PRIMARY KEY,
    rule_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    domain VARCHAR(50) NOT NULL,        -- labor, civil, contract, etc.
    topic VARCHAR(100) NOT NULL,         -- wage_arrears, unfair_dismissal, etc.
    jurisdiction VARCHAR(100),
    effective_from DATE,
    effective_to DATE,
    status VARCHAR(20) DEFAULT 'active',
    conditions JSONB,                    -- 适用条件列表
    legal_effect TEXT,                   -- 法律效果
    exceptions JSONB,                    -- 但书/例外
    facts_required JSONB,                -- 需要确认的事实
    evidence_related JSONB,              -- 相关证据类型
    procedure_related JSONB,             -- 相关程序
    source_id VARCHAR(100) REFERENCES knowledge.sources(source_id),
    article_ref VARCHAR(50),             -- 具体条款号
    review_status VARCHAR(20) DEFAULT 'draft', -- draft, reviewed, published
    embedding VECTOR(768),               -- 用于语义检索
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 证据卡
CREATE TABLE IF NOT EXISTS knowledge.evidence (
    id SERIAL PRIMARY KEY,
    evidence_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    evidence_type VARCHAR(50),            -- document, electronic, witness, etc.
    description TEXT,
    supports JSONB,                       -- 能证明什么
    cannot_prove_alone JSONB,             -- 不能单独证明什么
    preservation_tips TEXT,               -- 保存建议
    privacy_risks TEXT,                   -- 隐私风险
    domain VARCHAR(50) NOT NULL,
    topic VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 程序卡
CREATE TABLE IF NOT EXISTS knowledge.procedures (
    id SERIAL PRIMARY KEY,
    procedure_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    topic VARCHAR(100),
    prerequisites JSONB,                  -- 进入条件
    authority VARCHAR(200),               -- 主管机关
    required_materials JSONB,             -- 所需材料
    steps JSONB,                          -- 具体步骤
    possible_outcomes JSONB,              -- 可能结果
    deadlines JSONB,                      -- 期限
    jurisdiction VARCHAR(100),
    risks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 案例卡
CREATE TABLE IF NOT EXISTS knowledge.cases (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(100) UNIQUE NOT NULL,
    case_number VARCHAR(100) NOT NULL,    -- 案号
    court VARCHAR(200),
    judgment_date DATE,
    domain VARCHAR(50),
    topic VARCHAR(100),
    facts_abstract TEXT,                   -- 事实摘要
    dispute_focus TEXT,                    -- 争议焦点
    reasoning TEXT,                        -- 裁判理由（原文引用）
    result TEXT,                           -- 裁判结果
    applicable_rules JSONB,                -- 适用规则引用
    source TEXT,                           -- 来源
    limitations TEXT,                      -- 适用范围和边界说明
    embedding VECTOR(768),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 向量检索索引
CREATE INDEX IF NOT EXISTS idx_rules_embedding ON knowledge.rules
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_cases_embedding ON knowledge.cases
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 全文检索索引
CREATE INDEX IF NOT EXISTS idx_rules_fulltext ON knowledge.rules
    USING gin(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(legal_effect, '')));

CREATE INDEX IF NOT EXISTS idx_cases_fulltext ON knowledge.cases
    USING gin(to_tsvector('simple', coalesce(facts_abstract, '') || ' ' || coalesce(reasoning, '')));

-- 审计日志表
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS audit.retrieval_log (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    query_text TEXT,
    retrieved_sources JSONB,
    response_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit.user_actions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    action_type VARCHAR(50),
    action_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
