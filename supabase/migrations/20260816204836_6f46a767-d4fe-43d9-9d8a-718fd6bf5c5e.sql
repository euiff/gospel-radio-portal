CREATE TABLE public.pwa_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version bigint NOT NULL UNIQUE,
  manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  assets jsonb NOT NULL DEFAULT '[]'::jsonb,
  sw_version text NOT NULL,
  force_update boolean NOT NULL DEFAULT false,
  change_note text,
  source_version bigint,
  integrity_status text NOT NULL DEFAULT 'valid' CHECK (integrity_status IN ('valid', 'warning', 'invalid')),
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pwa_versions TO authenticated;
GRANT ALL ON public.pwa_versions TO service_role;
ALTER TABLE public.pwa_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view PWA versions" ON public.pwa_versions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can create PWA versions" ON public.pwa_versions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND created_by = auth.uid());
CREATE POLICY "Admins can update PWA versions" ON public.pwa_versions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE UNIQUE INDEX pwa_versions_one_active_idx ON public.pwa_versions (is_active) WHERE is_active = true;
CREATE INDEX pwa_versions_created_at_idx ON public.pwa_versions (created_at DESC);

CREATE TABLE public.pwa_installations (
  installation_id uuid PRIMARY KEY,
  applied_version bigint NOT NULL DEFAULT 0,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pwa_installations TO authenticated;
GRANT ALL ON public.pwa_installations TO service_role;
ALTER TABLE public.pwa_installations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view PWA adoption" ON public.pwa_installations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.publish_pwa_version(
  _manifest jsonb,
  _assets jsonb,
  _force_update boolean DEFAULT true,
  _change_note text DEFAULT NULL,
  _source_version bigint DEFAULT NULL,
  _integrity_status text DEFAULT 'valid'
)
RETURNS public.pwa_versions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _next_version bigint;
  _settings_id uuid;
  _result public.pwa_versions;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF jsonb_typeof(_manifest) <> 'object' OR jsonb_typeof(_assets) <> 'array' THEN
    RAISE EXCEPTION 'Invalid PWA payload';
  END IF;
  IF _integrity_status NOT IN ('valid', 'warning', 'invalid') THEN
    RAISE EXCEPTION 'Invalid integrity status';
  END IF;

  SELECT id INTO _settings_id FROM public.site_settings ORDER BY updated_at DESC LIMIT 1 FOR UPDATE;
  IF _settings_id IS NULL THEN
    RAISE EXCEPTION 'Site settings not configured';
  END IF;

  SELECT GREATEST(
    COALESCE(MAX(version), 0),
    COALESCE((SELECT (pwa_settings->>'asset_version')::bigint FROM public.site_settings WHERE id = _settings_id), 0)
  ) + 1 INTO _next_version FROM public.pwa_versions;

  UPDATE public.pwa_versions SET is_active = false WHERE is_active = true;
  INSERT INTO public.pwa_versions (
    version, manifest, assets, sw_version, force_update, change_note,
    source_version, integrity_status, is_active, created_by
  ) VALUES (
    _next_version,
    _manifest || jsonb_build_object('asset_version', _next_version, 'assets', _assets),
    _assets,
    _next_version::text,
    _force_update,
    NULLIF(trim(_change_note), ''),
    _source_version,
    _integrity_status,
    true,
    auth.uid()
  ) RETURNING * INTO _result;

  UPDATE public.site_settings
  SET pwa_settings = _result.manifest, updated_at = now()
  WHERE id = _settings_id;

  RETURN _result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.publish_pwa_version(jsonb, jsonb, boolean, text, bigint, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rollback_pwa_version(_version bigint, _change_note text DEFAULT NULL)
RETURNS public.pwa_versions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _source public.pwa_versions;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT * INTO _source FROM public.pwa_versions WHERE version = _version;
  IF _source.id IS NULL THEN
    RAISE EXCEPTION 'PWA version not found';
  END IF;
  RETURN public.publish_pwa_version(
    _source.manifest - 'asset_version',
    _source.assets,
    true,
    COALESCE(NULLIF(trim(_change_note), ''), 'Rollback para v' || _version::text),
    _version,
    _source.integrity_status
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.rollback_pwa_version(bigint, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.report_pwa_installation(_installation_id uuid, _applied_version bigint)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.pwa_installations (installation_id, applied_version)
  VALUES (_installation_id, GREATEST(_applied_version, 0))
  ON CONFLICT (installation_id) DO UPDATE
  SET applied_version = GREATEST(EXCLUDED.applied_version, public.pwa_installations.applied_version),
      last_seen_at = now(),
      updated_at = now();
$$;
GRANT EXECUTE ON FUNCTION public.report_pwa_installation(uuid, bigint) TO anon, authenticated;

INSERT INTO public.pwa_versions (
  version, manifest, assets, sw_version, force_update, change_note,
  integrity_status, is_active, created_by
)
SELECT
  COALESCE((pwa_settings->>'asset_version')::bigint, 1),
  pwa_settings,
  COALESCE(pwa_settings->'assets', '[]'::jsonb),
  COALESCE(pwa_settings->>'asset_version', '1'),
  false,
  'Versão inicial importada',
  'warning',
  true,
  NULL
FROM public.site_settings
ORDER BY updated_at DESC
LIMIT 1
ON CONFLICT (version) DO NOTHING;