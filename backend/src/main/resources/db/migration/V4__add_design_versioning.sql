-- V4 Migration: Add Design Versioning, Surface Map Snapshot, Favorites, and Parent Tracking

ALTER TABLE room_designs ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE room_designs ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE room_designs ADD COLUMN parent_design_id BIGINT REFERENCES room_designs(id) ON DELETE SET NULL;
ALTER TABLE room_designs ADD COLUMN surface_customization_map TEXT NOT NULL DEFAULT '{}';
ALTER TABLE room_designs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX idx_room_designs_version ON room_designs(room_id, version_number);
CREATE INDEX idx_room_designs_favorite ON room_designs(room_id, is_favorite);
