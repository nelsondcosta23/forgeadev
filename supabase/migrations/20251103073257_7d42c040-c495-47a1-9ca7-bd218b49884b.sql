-- Create quiz_sessions table to track each quiz attempt
CREATE TABLE public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_score INTEGER
);

-- Create quiz_responses table to store individual answers
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.quiz_sessions(session_id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  selected_answer TEXT NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anyone to insert and read their own data
CREATE POLICY "Anyone can insert quiz sessions"
  ON public.quiz_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read quiz sessions"
  ON public.quiz_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update quiz sessions"
  ON public.quiz_sessions
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can insert quiz responses"
  ON public.quiz_responses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read quiz responses"
  ON public.quiz_responses
  FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_quiz_responses_session_id ON public.quiz_responses(session_id);
CREATE INDEX idx_quiz_sessions_session_id ON public.quiz_sessions(session_id);