import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QuizAnswers } from "@/components/quiz/questions";
import { questions } from "@/components/quiz/questions";
import Results from "@/components/quiz/Results";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SharedResults = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<QuizAnswers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<string>("");

  useEffect(() => {
    const fetchResults = async () => {
      if (!sessionId) {
        setError("Invalid session ID");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/results/${sessionId}`);
        if (!response.ok) throw new Error("Results not found");
        
        const data = await response.json();
        
        setAnswers(data.answers);
        setAiRecommendation(JSON.stringify(data.recommendation));
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading build results...</p>
        </div>
      </div>
    );
  }

  if (error || !answers) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold">Results Not Found</h1>
          <p className="text-muted-foreground">
            {error || "This build doesn't exist or has been removed."}
          </p>
          <Button 
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            Create Your Own Build
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Results 
      answers={answers} 
      onRestart={() => navigate("/")} 
      onBack={() => navigate("/")}
      sessionId={sessionId || ""} 
      aiRecommendation={aiRecommendation}
    />
  );
};

export default SharedResults;
