-- Add country tracking columns to quiz_sessions table
ALTER TABLE public.quiz_sessions
ADD COLUMN country_code TEXT,
ADD COLUMN country_name TEXT;