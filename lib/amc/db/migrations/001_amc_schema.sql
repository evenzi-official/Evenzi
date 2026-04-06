-- AMC Phase 1: Core Schema
-- All tables prefixed with mc_ for namespace isolation

-- Projects registered with AMC
CREATE TABLE IF NOT EXISTS mc_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  repo_url TEXT,
  description TEXT,
  webhook_secret TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent role definitions (global when project_id is NULL, else project-specific)
CREATE TABLE IF NOT EXISTS mc_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  prompt TEXT,
  capabilities JSONB DEFAULT '[]',
  pipeline_order INTEGER,
  token_budget INTEGER,
  provider TEXT DEFAULT 'anthropic'
    CHECK (provider IN ('anthropic', 'openai', 'google', 'mistral', 'groq', 'ollama', 'custom')),
  model_id TEXT DEFAULT 'claude-sonnet-4-6',
  project_id UUID REFERENCES mc_projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Named pipeline configurations
CREATE TABLE IF NOT EXISTS mc_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stages JSONB NOT NULL DEFAULT '[]',
  project_id UUID REFERENCES mc_projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pipeline execution runs
CREATE TABLE IF NOT EXISTS mc_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES mc_pipelines(id),
  project_id UUID NOT NULL REFERENCES mc_projects(id) ON DELETE CASCADE,
  trigger_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'aborted')),
  current_stage INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  checkpoint_data JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual agent execution within a run
CREATE TABLE IF NOT EXISTS mc_run_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES mc_runs(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES mc_agents(id),
  stage_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  input JSONB,
  output JSONB,
  tokens_used INTEGER DEFAULT 0,
  provider TEXT,
  model_id TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  estimated_cost_usd NUMERIC(10, 6) DEFAULT 0,
  duration_ms INTEGER,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Kanban tasks
CREATE TABLE IF NOT EXISTS mc_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES mc_runs(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES mc_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog'
    CHECK (status IN ('backlog', 'in_progress', 'review', 'done')),
  assigned_agent_id UUID REFERENCES mc_agents(id),
  priority TEXT DEFAULT 'normal'
    CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documents/artifacts produced by agents
CREATE TABLE IF NOT EXISTS mc_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_stage_id UUID REFERENCES mc_run_stages(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES mc_projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('spec', 'design', 'plan', 'data_model', 'code', 'review', 'qa_report', 'security_audit', 'other')),
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Real-time event stream from CLI
CREATE TABLE IF NOT EXISTS mc_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES mc_projects(id) ON DELETE CASCADE,
  run_id UUID REFERENCES mc_runs(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES mc_agents(id),
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Journal/memory entries
CREATE TABLE IF NOT EXISTS mc_memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES mc_projects(id) ON DELETE CASCADE,
  run_id UUID REFERENCES mc_runs(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES mc_agents(id),
  type TEXT NOT NULL
    CHECK (type IN ('decision', 'observation', 'error', 'milestone', 'note')),
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_mc_events_project_created ON mc_events(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_events_run ON mc_events(run_id);
CREATE INDEX IF NOT EXISTS idx_mc_run_stages_run ON mc_run_stages(run_id);
CREATE INDEX IF NOT EXISTS idx_mc_tasks_project_status ON mc_tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_mc_artifacts_project ON mc_artifacts(project_id);
CREATE INDEX IF NOT EXISTS idx_mc_artifacts_run_stage ON mc_artifacts(run_stage_id);
CREATE INDEX IF NOT EXISTS idx_mc_memory_project_created ON mc_memory_entries(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_memory_tags ON mc_memory_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_mc_agents_project ON mc_agents(project_id);

-- Row Level Security (single-user v1: authenticated users can access all AMC tables)
ALTER TABLE mc_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_run_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_memory_entries ENABLE ROW LEVEL SECURITY;

-- Policies: any authenticated user can read/write (v1 single-user model)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'mc_projects', 'mc_agents', 'mc_pipelines', 'mc_runs',
    'mc_run_stages', 'mc_tasks', 'mc_artifacts', 'mc_events', 'mc_memory_entries'
  ] LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS "authenticated_access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;

-- Updated_at trigger for tables that have it
CREATE OR REPLACE FUNCTION mc_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER mc_projects_updated_at
  BEFORE UPDATE ON mc_projects
  FOR EACH ROW EXECUTE FUNCTION mc_set_updated_at();

CREATE OR REPLACE TRIGGER mc_agents_updated_at
  BEFORE UPDATE ON mc_agents
  FOR EACH ROW EXECUTE FUNCTION mc_set_updated_at();

CREATE OR REPLACE TRIGGER mc_tasks_updated_at
  BEFORE UPDATE ON mc_tasks
  FOR EACH ROW EXECUTE FUNCTION mc_set_updated_at();
