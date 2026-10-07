-- V6 Migration: Add Design Feedback persistence table with unique user-design constraint

CREATE TABLE design_feedbacks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    design_id BIGINT NOT NULL REFERENCES room_designs(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_design_feedback UNIQUE (user_id, design_id)
);

CREATE INDEX idx_design_feedbacks_design ON design_feedbacks(design_id);
CREATE INDEX idx_design_feedbacks_user ON design_feedbacks(user_id);
