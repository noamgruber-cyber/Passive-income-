-- Add level column to existing courses table (run if you applied 001 already)
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'beginner'
    CHECK (level IN ('beginner', 'intermediate', 'advanced'));
