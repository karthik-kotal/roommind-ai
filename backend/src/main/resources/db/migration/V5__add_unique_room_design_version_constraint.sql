-- V5 Migration: Add Unique Constraint on (room_id, version_number) for Database-Level Version Concurrency Safety

ALTER TABLE room_designs
ADD CONSTRAINT uq_room_design_version
UNIQUE (room_id, version_number);
