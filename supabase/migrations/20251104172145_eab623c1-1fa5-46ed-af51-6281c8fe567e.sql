-- Add DELETE policy for quiz_sessions
CREATE POLICY "Allow delete quiz sessions"
ON public.quiz_sessions
FOR DELETE
USING (true);

-- Add DELETE policy for quiz_responses  
CREATE POLICY "Allow delete quiz responses"
ON public.quiz_responses
FOR DELETE
USING (true);