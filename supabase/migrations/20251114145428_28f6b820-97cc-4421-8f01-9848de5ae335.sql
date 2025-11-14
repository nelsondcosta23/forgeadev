-- Add status column to admin_roadmap table
ALTER TABLE public.admin_roadmap 
ADD COLUMN status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed'));