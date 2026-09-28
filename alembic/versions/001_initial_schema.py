"""001 Initial schema with tenders, bidders, evidence, results, and immutable audit trail

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-09-28 17:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Tenders table
    op.create_table(
        'tenders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tender_id', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('version', sa.String(length=32), nullable=False, server_default='1.0.0'),
        sa.Column('rule_set_version', sa.String(length=32), nullable=False),
        sa.Column('bid_opening_date', sa.Date(), nullable=False),
        sa.Column('estimated_value', sa.Float(), nullable=True),
        sa.Column('local_content_threshold', sa.Float(), nullable=True),
        sa.Column('raw_config', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_tenders_tender_id', 'tenders', ['tender_id'], unique=True)

    # 2. Bidders table
    op.create_table(
        'bidders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tender_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('bidder_name', sa.String(length=255), nullable=False),
        sa.Column('pan', sa.String(length=10), nullable=False),
        sa.Column('gstin', sa.String(length=15), nullable=True),
        sa.Column('udyam_number', sa.String(length=19), nullable=True),
        sa.Column('bidder_type', sa.String(length=64), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_bidders_tender_id', 'bidders', ['tender_id'])
    op.create_index('ix_bidders_pan', 'bidders', ['pan'])
    op.create_index('ix_bidders_gstin', 'bidders', ['gstin'])

    # 3. Evidence table
    op.create_table(
        'evidence',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('bidder_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('bidders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('doc_type', sa.String(length=64), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_hash', sa.String(length=64), nullable=False),
        sa.Column('extracted_fields', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('is_grounded', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_evidence_bidder_id', 'evidence', ['bidder_id'])

    # 4. Verification Results table
    op.create_table(
        'verification_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('bidder_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('bidders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tender_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('overall_state', sa.String(length=32), nullable=False),
        sa.Column('compliance_score', sa.Float(), nullable=True),
        sa.Column('risk_level', sa.String(length=32), nullable=True),
        sa.Column('requirement_results', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('evaluated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_verification_results_bidder_id', 'verification_results', ['bidder_id'])
    op.create_index('ix_verification_results_tender_id', 'verification_results', ['tender_id'])

    # 5. Audit Trail table (Append-only)
    op.create_table(
        'audit_trail',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tender_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bidder_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('prev_hash', sa.String(length=64), nullable=False),
        sa.Column('record_hash', sa.String(length=64), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_audit_trail_tender_id', 'audit_trail', ['tender_id'])
    op.create_index('ix_audit_trail_record_hash', 'audit_trail', ['record_hash'])

    # 6. Immutable trigger on audit_trail table (PostgreSQL specific)
    op.execute("""
        CREATE OR REPLACE FUNCTION prevent_audit_tampering()
        RETURNS TRIGGER AS $$
        BEGIN
            RAISE EXCEPTION 'Audit trail is immutable. UPDATE or DELETE operations are strictly prohibited (AUDT-02).';
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("""
        CREATE TRIGGER trg_prevent_audit_tampering
        BEFORE UPDATE OR DELETE ON audit_trail
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_prevent_audit_tampering ON audit_trail;")
    op.execute("DROP FUNCTION IF EXISTS prevent_audit_tampering();")
    op.drop_table('audit_trail')
    op.drop_table('verification_results')
    op.drop_table('evidence')
    op.drop_table('bidders')
    op.drop_table('tenders')
