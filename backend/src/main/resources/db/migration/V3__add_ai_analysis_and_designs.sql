-- V3 Migration: Add Room Analysis and Room Designs persistence tables

CREATE TABLE room_analyses (
    id BIGSERIAL PRIMARY KEY,
    room_scan_id BIGINT NOT NULL REFERENCES room_scans(id) ON DELETE CASCADE,
    detected_wall_category VARCHAR(100) NOT NULL,
    wall_model_score NUMERIC(5, 4) NOT NULL,
    detected_floor_category VARCHAR(100) NOT NULL,
    floor_model_score NUMERIC(5, 4) NOT NULL,
    openings_detected TEXT NOT NULL DEFAULT '[]',
    furniture_detected TEXT NOT NULL DEFAULT '[]',
    raw_vision_output TEXT NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE room_designs (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    style_package VARCHAR(50) NOT NULL,
    wall_recommendations TEXT NOT NULL DEFAULT '{}',
    compatibility_breakdown TEXT NOT NULL DEFAULT '{}',
    overall_compatibility_score NUMERIC(5, 2) NOT NULL,
    subtotal_cost_inr NUMERIC(12, 2) NOT NULL,
    tax_rate_percent NUMERIC(5, 2) NOT NULL,
    tax_amount_inr NUMERIC(12, 2) NOT NULL,
    estimated_total_cost_inr NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_room_analyses_scan_id ON room_analyses(room_scan_id);
CREATE INDEX idx_room_designs_room_id ON room_designs(room_id);
