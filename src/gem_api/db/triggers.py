"""SQL definitions for PostgreSQL audit trail immutability triggers."""

CREATE_AUDIT_TRIGGER_FUNCTION_SQL = """
CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit trail is immutable. UPDATE or DELETE operations are strictly prohibited (AUDT-02).';
END;
$$ LANGUAGE plpgsql;
"""

CREATE_AUDIT_TRIGGER_SQL = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_audit_tampering'
    ) THEN
        CREATE TRIGGER trg_prevent_audit_tampering
        BEFORE UPDATE OR DELETE ON audit_trail
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();
    END IF;
END $$;
"""

DROP_AUDIT_TRIGGER_SQL = """
DROP TRIGGER IF EXISTS trg_prevent_audit_tampering ON audit_trail;
DROP FUNCTION IF EXISTS prevent_audit_tampering();
"""
