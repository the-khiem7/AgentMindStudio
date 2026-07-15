CREATE TABLE harness_installations (
  id TEXT PRIMARY KEY NOT NULL,
  harness_kind TEXT NOT NULL CHECK (harness_kind IN ('copilot', 'codex', 'kiro', 'kilo')),
  display_name TEXT NOT NULL,
  executable_path TEXT,
  client_version TEXT,
  version_source TEXT,
  status TEXT NOT NULL CHECK (status IN ('available', 'unavailable', 'unknown')),
  observed_at TEXT NOT NULL
) STRICT;

CREATE TABLE surfaces (
  id TEXT PRIMARY KEY NOT NULL,
  harness_installation_id TEXT NOT NULL REFERENCES harness_installations(id) ON DELETE CASCADE,
  surface_kind TEXT NOT NULL,
  display_name TEXT NOT NULL,
  adapter_id TEXT NOT NULL,
  adapter_contract_version TEXT NOT NULL,
  UNIQUE (harness_installation_id, surface_kind)
) STRICT;

CREATE TABLE config_sources (
  id TEXT PRIMARY KEY NOT NULL,
  resolved_path TEXT NOT NULL UNIQUE,
  format TEXT NOT NULL,
  ownership TEXT NOT NULL,
  writable INTEGER NOT NULL CHECK (writable IN (0, 1)),
  source_fingerprint TEXT,
  last_observed_at TEXT NOT NULL
) STRICT;

CREATE TABLE surface_sources (
  surface_id TEXT NOT NULL REFERENCES surfaces(id) ON DELETE CASCADE,
  config_source_id TEXT NOT NULL REFERENCES config_sources(id) ON DELETE CASCADE,
  PRIMARY KEY (surface_id, config_source_id)
) STRICT;

CREATE TABLE config_layers (
  id TEXT PRIMARY KEY NOT NULL,
  config_source_id TEXT NOT NULL REFERENCES config_sources(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('user', 'global')),
  layer_kind TEXT NOT NULL,
  precedence INTEGER NOT NULL,
  ownership TEXT NOT NULL,
  writable INTEGER NOT NULL CHECK (writable IN (0, 1)),
  UNIQUE (config_source_id, layer_kind, precedence)
) STRICT;

CREATE TABLE logical_assets (
  id TEXT PRIMARY KEY NOT NULL,
  artifact_kind TEXT NOT NULL CHECK (artifact_kind IN ('mcp', 'skill', 'instruction')),
  canonical_name TEXT NOT NULL,
  identity_fingerprint TEXT,
  identity_confidence TEXT NOT NULL CHECK (identity_confidence IN ('verified', 'probable', 'possible', 'unknown')),
  provenance_kind TEXT,
  provenance_reference TEXT,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE asset_aliases (
  id TEXT PRIMARY KEY NOT NULL,
  logical_asset_id TEXT NOT NULL REFERENCES logical_assets(id) ON DELETE CASCADE,
  surface_id TEXT REFERENCES surfaces(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  alias_kind TEXT NOT NULL CHECK (alias_kind IN ('native', 'linked', 'display')),
  UNIQUE (logical_asset_id, surface_id, alias)
) STRICT;

CREATE TABLE installed_contents (
  id TEXT PRIMARY KEY NOT NULL,
  logical_asset_id TEXT NOT NULL REFERENCES logical_assets(id) ON DELETE RESTRICT,
  content_root_path TEXT NOT NULL UNIQUE,
  content_sha256 TEXT NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0),
  observed_at TEXT NOT NULL
) STRICT;

CREATE TABLE bindings (
  id TEXT PRIMARY KEY NOT NULL,
  logical_asset_id TEXT NOT NULL REFERENCES logical_assets(id) ON DELETE RESTRICT,
  surface_id TEXT NOT NULL REFERENCES surfaces(id) ON DELETE CASCADE,
  config_layer_id TEXT NOT NULL REFERENCES config_layers(id) ON DELETE CASCADE,
  installed_content_id TEXT REFERENCES installed_contents(id) ON DELETE RESTRICT,
  native_identity TEXT NOT NULL,
  effective_state TEXT NOT NULL CHECK (effective_state IN ('enabled', 'disabled', 'shadowed', 'unknown')),
  compatibility_state TEXT NOT NULL CHECK (compatibility_state IN ('exact', 'convertible', 'partial', 'unsupported', 'blocked', 'unknown')),
  credential_binding_kind TEXT CHECK (credential_binding_kind IN ('environment', 'header', 'profile', 'client-native', 'none', 'unknown')),
  credential_binding_present INTEGER NOT NULL CHECK (credential_binding_present IN (0, 1)),
  UNIQUE (surface_id, config_layer_id, native_identity)
) STRICT;

CREATE TABLE content_references (
  id TEXT PRIMARY KEY NOT NULL,
  installed_content_id TEXT NOT NULL REFERENCES installed_contents(id) ON DELETE RESTRICT,
  binding_id TEXT NOT NULL REFERENCES bindings(id) ON DELETE CASCADE,
  retained INTEGER NOT NULL DEFAULT 1 CHECK (retained IN (0, 1)),
  UNIQUE (installed_content_id, binding_id)
) STRICT;

CREATE VIEW shared_content_deletion_checks AS
SELECT
  installed_contents.id AS installed_content_id,
  COUNT(content_references.id) AS reference_count,
  COALESCE(SUM(content_references.retained), 0) AS retained_reference_count
FROM installed_contents
LEFT JOIN content_references ON content_references.installed_content_id = installed_contents.id
GROUP BY installed_contents.id;

CREATE TRIGGER prevent_referenced_content_delete
BEFORE DELETE ON installed_contents
WHEN EXISTS (
  SELECT 1 FROM content_references
  WHERE installed_content_id = OLD.id AND retained = 1
)
BEGIN
  SELECT RAISE(ABORT, 'installed content still has retained bindings');
END;

CREATE TABLE content_fingerprints (
  id TEXT PRIMARY KEY NOT NULL,
  logical_asset_id TEXT REFERENCES logical_assets(id) ON DELETE CASCADE,
  binding_id TEXT REFERENCES bindings(id) ON DELETE CASCADE,
  algorithm TEXT NOT NULL CHECK (algorithm = 'sha256'),
  fingerprint TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  CHECK (logical_asset_id IS NOT NULL OR binding_id IS NOT NULL)
) STRICT;

CREATE TABLE schema_evidence (
  id TEXT PRIMARY KEY NOT NULL,
  surface_id TEXT NOT NULL REFERENCES surfaces(id) ON DELETE CASCADE,
  schema_identifier TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('verified', 'inferred', 'unknown')),
  client_version_min TEXT,
  client_version_max TEXT,
  evidence_reference TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  UNIQUE (surface_id, schema_identifier, evidence_reference)
) STRICT;

CREATE TABLE capability_evidence (
  id TEXT PRIMARY KEY NOT NULL,
  surface_id TEXT NOT NULL REFERENCES surfaces(id) ON DELETE CASCADE,
  schema_evidence_id TEXT NOT NULL REFERENCES schema_evidence(id) ON DELETE RESTRICT,
  artifact_kind TEXT NOT NULL CHECK (artifact_kind IN ('mcp', 'skill', 'instruction')),
  scope TEXT NOT NULL CHECK (scope IN ('user', 'global')),
  read_level TEXT NOT NULL CHECK (read_level IN ('supported', 'read-only', 'unsupported', 'blocked', 'unknown')),
  write_level TEXT NOT NULL CHECK (write_level IN ('supported', 'read-only', 'unsupported', 'blocked', 'unknown')),
  preserves_unknown_fields INTEGER NOT NULL CHECK (preserves_unknown_fields IN (0, 1)),
  preserves_credentials INTEGER NOT NULL CHECK (preserves_credentials IN (0, 1)),
  reload_kind TEXT NOT NULL,
  UNIQUE (surface_id, schema_evidence_id, artifact_kind, scope)
) STRICT;

CREATE TABLE observations (
  id TEXT PRIMARY KEY NOT NULL,
  config_source_id TEXT NOT NULL REFERENCES config_sources(id) ON DELETE CASCADE,
  binding_id TEXT REFERENCES bindings(id) ON DELETE CASCADE,
  schema_evidence_id TEXT REFERENCES schema_evidence(id) ON DELETE RESTRICT,
  adapter_id TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  parse_status TEXT NOT NULL CHECK (parse_status IN ('valid', 'malformed', 'partial', 'unsupported')),
  redaction_status TEXT NOT NULL CHECK (redaction_status IN ('not-required', 'redacted', 'metadata-only')),
  unknown_field_count INTEGER NOT NULL DEFAULT 0 CHECK (unknown_field_count >= 0),
  safe_error_code TEXT,
  observed_at TEXT NOT NULL
) STRICT;

CREATE TABLE intentional_differences (
  id TEXT PRIMARY KEY NOT NULL,
  logical_asset_id TEXT NOT NULL REFERENCES logical_assets(id) ON DELETE CASCADE,
  left_binding_id TEXT NOT NULL REFERENCES bindings(id) ON DELETE CASCADE,
  right_binding_id TEXT NOT NULL REFERENCES bindings(id) ON DELETE CASCADE,
  difference_kind TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  CHECK (left_binding_id <> right_binding_id),
  UNIQUE (logical_asset_id, left_binding_id, right_binding_id, difference_kind)
) STRICT;

CREATE TABLE sync_plans (
  id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'reviewed', 'confirmed', 'cancelled', 'executed')),
  observation_set_fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL,
  confirmed_at TEXT
) STRICT;

CREATE TABLE sync_plan_actions (
  id TEXT PRIMARY KEY NOT NULL,
  sync_plan_id TEXT NOT NULL REFERENCES sync_plans(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  operation_kind TEXT NOT NULL CHECK (operation_kind IN ('AddBinding', 'UpdateBinding', 'DisableBinding', 'RemoveBinding', 'UninstallContent', 'RemoveEverywhere', 'RestoreSnapshot')),
  logical_asset_id TEXT REFERENCES logical_assets(id) ON DELETE RESTRICT,
  target_binding_id TEXT REFERENCES bindings(id) ON DELETE RESTRICT,
  field_selector TEXT,
  preserves_credentials INTEGER NOT NULL CHECK (preserves_credentials IN (0, 1)),
  UNIQUE (sync_plan_id, ordinal)
) STRICT;

CREATE TABLE operations (
  id TEXT PRIMARY KEY NOT NULL,
  sync_plan_id TEXT REFERENCES sync_plans(id) ON DELETE RESTRICT,
  operation_kind TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('planned', 'confirmed', 'snapshotting', 'applying', 'verifying', 'succeeded', 'failed', 'recovery_required', 'recovering', 'recovered', 'partial_recovery')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  failure_code TEXT,
  recovery_attempts INTEGER NOT NULL DEFAULT 0 CHECK (recovery_attempts >= 0)
) STRICT;

CREATE TABLE operation_affected_paths (
  id TEXT PRIMARY KEY NOT NULL,
  operation_id TEXT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  resolved_path TEXT NOT NULL,
  before_sha256 TEXT,
  after_sha256 TEXT,
  UNIQUE (operation_id, ordinal),
  UNIQUE (operation_id, resolved_path)
) STRICT;

CREATE TABLE snapshot_indexes (
  id TEXT PRIMARY KEY NOT NULL,
  operation_id TEXT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
  affected_path_id TEXT NOT NULL REFERENCES operation_affected_paths(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL UNIQUE,
  relative_path TEXT NOT NULL,
  content_sha256 TEXT NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0),
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE operation_results (
  id TEXT PRIMARY KEY NOT NULL,
  operation_id TEXT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (outcome IN ('succeeded', 'failed', 'recovered', 'partial_recovery')),
  result_code TEXT NOT NULL,
  affected_path_count INTEGER NOT NULL CHECK (affected_path_count >= 0),
  recorded_at TEXT NOT NULL
) STRICT;

CREATE INDEX idx_surfaces_installation ON surfaces(harness_installation_id);
CREATE INDEX idx_layers_source_precedence ON config_layers(config_source_id, precedence);
CREATE INDEX idx_bindings_asset ON bindings(logical_asset_id);
CREATE INDEX idx_observations_source_time ON observations(config_source_id, observed_at);
CREATE INDEX idx_operations_state ON operations(state);
CREATE INDEX idx_affected_paths_operation ON operation_affected_paths(operation_id);

