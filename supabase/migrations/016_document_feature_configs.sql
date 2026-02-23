-- Per-document feature configuration storage (hooks, integrations, automations)

CREATE TABLE IF NOT EXISTS public.document_feature_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (note_id, feature_type),
  CONSTRAINT document_feature_configs_feature_type_check
    CHECK (feature_type IN ('hooks', 'integrations', 'automations'))
);

CREATE INDEX IF NOT EXISTS idx_document_feature_configs_note_id
  ON public.document_feature_configs(note_id);

CREATE INDEX IF NOT EXISTS idx_document_feature_configs_feature_type
  ON public.document_feature_configs(feature_type);

ALTER TABLE public.document_feature_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view feature config for accessible notes" ON public.document_feature_configs;
CREATE POLICY "Users can view feature config for accessible notes"
  ON public.document_feature_configs FOR SELECT
  USING (public.has_note_access(note_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can insert feature config with capability" ON public.document_feature_configs;
CREATE POLICY "Users can insert feature config with capability"
  ON public.document_feature_configs FOR INSERT
  WITH CHECK (
    updated_by = (SELECT auth.uid())
    AND public.can_manage_feature(note_id, feature_type, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update feature config with capability" ON public.document_feature_configs;
CREATE POLICY "Users can update feature config with capability"
  ON public.document_feature_configs FOR UPDATE
  USING (public.can_manage_feature(note_id, feature_type, (SELECT auth.uid())))
  WITH CHECK (
    updated_by = (SELECT auth.uid())
    AND public.can_manage_feature(note_id, feature_type, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete feature config with capability" ON public.document_feature_configs;
CREATE POLICY "Users can delete feature config with capability"
  ON public.document_feature_configs FOR DELETE
  USING (public.can_manage_feature(note_id, feature_type, (SELECT auth.uid())));

DROP TRIGGER IF EXISTS update_document_feature_configs_updated_at ON public.document_feature_configs;
CREATE TRIGGER update_document_feature_configs_updated_at
  BEFORE UPDATE ON public.document_feature_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
