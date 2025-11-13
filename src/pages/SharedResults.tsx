import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QuizAnswers } from "@/components/quiz/questions";
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
        // Fetch quiz responses for this session
        const { data: responses, error: fetchError } = await supabase
          .from("quiz_responses")
          .select("*")
          .eq("session_id", sessionId)
          .order("question_number", { ascending: true });

        if (fetchError) throw fetchError;

        if (!responses || responses.length === 0) {
          setError("No results found for this session");
          setLoading(false);
          return;
        }

        // Reconstruct the answers object from responses
        const reconstructedAnswers: QuizAnswers = {};
        responses.forEach((response) => {
          const questionId = extractQuestionId(response.question_text);
          if (questionId) {
            // Try to parse as number first, otherwise keep as string
            const value = isNaN(Number(response.selected_answer)) 
              ? response.selected_answer 
              : Number(response.selected_answer);
            reconstructedAnswers[questionId] = value;
          }
        });

        setAnswers(reconstructedAnswers);

        // Fetch AI recommendation for this session
        const { data: aiData, error: aiError } = await supabase
          .from("ai_recommendations")
          .select("recommendation_text")
          .eq("session_id", sessionId)
          .maybeSingle();

        if (aiError) {
          console.error("Error fetching AI recommendation:", aiError);
        } else if (aiData?.recommendation_text) {
          // Try to parse as JSON to add ai_report if it's structured data
          try {
            const parsed = JSON.parse(aiData.recommendation_text);
            if (parsed.session_info && !parsed.session_info.ai_report) {
              // Add ai_report from reconstructed answers
              parsed.session_info.ai_report = {
                budget_range: reconstructedAnswers.budget ? `${reconstructedAnswers.budget}` : 'Not specified',
                primary_use: reconstructedAnswers.purpose || 'Not specified',
                performance_level: reconstructedAnswers.fps ? `${reconstructedAnswers.fps} FPS @ ${reconstructedAnswers.resolution || '1080p'}` : 'Standard',
                upgrade_priority: reconstructedAnswers.upgradability === 'yes' ? 'Upgrade Capable' : 'New Build',
              };
              setAiRecommendation(JSON.stringify(parsed));
            } else {
              setAiRecommendation(aiData.recommendation_text);
            }
          } catch {
            // Not JSON, use as is
            setAiRecommendation(aiData.recommendation_text);
          }
        }

      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [sessionId]);

  // Helper function to extract question ID from question text
  const extractQuestionId = (questionText: string): string | null => {
    // Map question texts to their IDs based on the questions.ts structure
    const questionMap: { [key: string]: string } = {
      "What country are you from?": "country",
      "What do you need the PC for?": "purpose",
      "What games or genres do you play the most?": "games",
      "What resolution do you want to play at?": "resolution",
      "How many FPS do you want to achieve?": "fps",
      "Do you plan to stream or record?": "streaming",
      "What type of software do you use?": "software",
      "Do you need to run multiple applications simultaneously?": "multitask",
      "What programs do you use to create content?": "contentSoftware",
      "Do you render video in 4K or higher?": "render4k",
      "Do you need to accelerate rendering with GPU?": "gpuAcceleration",
      "What is your maximum budget?": "budget",
      "Do you have a preference for aesthetics or size?": "casePreference",
      "Do you need a monitor, keyboard or mouse?": "peripherals",
      "Do you want future upgrade capability?": "upgradability",
    };

    return questionMap[questionText] || null;
  };

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
