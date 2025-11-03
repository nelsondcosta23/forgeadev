import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import QuestionCard from "./quiz/QuestionCard";
import Results from "./quiz/Results";
import { questions, QuizAnswers } from "./quiz/questions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuizProps {
  onBack: () => void;
}

const Quiz = ({ onBack }: QuizProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showResults, setShowResults] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const { toast } = useToast();

  // Create a quiz session when component mounts
  useEffect(() => {
    const createSession = async () => {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      setSessionId(newSessionId);

      const { error } = await supabase
        .from('quiz_sessions')
        .insert({
          session_id: newSessionId,
        });

      if (error) {
        console.error('Error creating quiz session:', error);
        toast({
          title: "Erro",
          description: "Não foi possível iniciar a sessão do quiz.",
          variant: "destructive",
        });
      }
    };

    createSession();
  }, []);

  const currentQuestions = questions.filter(q => {
    if (!q.condition) return true;
    return q.condition(answers);
  });

  const currentQuestion = currentQuestions[currentStep];
  const progress = ((currentStep + 1) / currentQuestions.length) * 100;

  const handleAnswer = async (answer: string | number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);

    // Save the response to database
    if (sessionId) {
      const { error } = await supabase
        .from('quiz_responses')
        .insert({
          session_id: sessionId,
          question_number: currentStep + 1,
          question_text: currentQuestion.question,
          selected_answer: String(answer),
        });

      if (error) {
        console.error('Error saving quiz response:', error);
      }
    }

    if (currentStep < currentQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate total score (example: count all answers)
      const totalScore = Object.keys(newAnswers).length;
      
      // Update session as completed
      if (sessionId) {
        await supabase
          .from('quiz_sessions')
          .update({
            completed_at: new Date().toISOString(),
            total_score: totalScore,
          })
          .eq('session_id', sessionId);
      }

      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  if (showResults) {
    return <Results answers={answers} sessionId={sessionId} onRestart={() => {
      setAnswers({});
      setCurrentStep(0);
      setShowResults(false);
      // Create new session for restart
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      setSessionId(newSessionId);
      
      supabase
        .from('quiz_sessions')
        .insert({
          session_id: newSessionId,
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error creating new quiz session:', error);
          }
        });
    }} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              FORGEA
            </h1>
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-primary text-foreground hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Question {currentStep + 1} of {currentQuestions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question */}
        <div className="max-w-3xl mx-auto">
          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2025 Forgea. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="/terms" className="hover:text-primary transition-colors">
                Terms & Conditions
              </a>
              <a href="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Quiz;
