import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import QuestionCard from "./quiz/QuestionCard";
import Results from "./quiz/Results";
import { questions, QuizAnswers } from "./quiz/questions";
import { api } from "@/lib/api";
import { mapCountryToLanguage } from "@/i18n/config";
import { getCurrencyInfo } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const quizResponseSchema = z.object({
  session_id: z.string().min(1).max(100),
  question_number: z.number().int().positive(),
  question_text: z.string().min(1).max(500),
  selected_answer: z.string().min(1).max(200),
});

interface QuizProps {
  onBack: () => void;
}

const Quiz = ({ onBack }: QuizProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [sessionId, setSessionId] = useState<string>("");
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string>("");
  const { toast } = useToast();

  // Create a quiz session when component mounts
  useEffect(() => {
    const createSession = async () => {
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);

      // Detect user's country (Local fallback to avoid external API dependencies causing CORS/429)
      const countryCode = 'PT'; // Default to PT, user can change in quiz
      const countryName = 'Portugal';
      setDetectedCountry(countryCode);

      try {
        const res = await fetch('/api/pb/quiz_sessions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
          },
          body: JSON.stringify({
            session_id: newSessionId,
            country_code: countryCode,
            country_name: countryName,
          })
        });
        if (!res.ok) throw new Error('Failed to create session');
        setIsSessionReady(true);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error creating quiz session:', error);
        }
        toast({
          title: "Error",
          description: "Unable to start quiz session.",
          variant: "destructive",
        });
      }
    };

    createSession();
  }, []);

  const currentQuestions = questions.filter(q => {
    if (!q.condition) return true;
    return q.condition(answers);
  }).map(q => {
    // Dynamically update budget question based on selected country
    if (q.id === 'budget' && answers.country) {
      const currency = getCurrencyInfo(answers.country as string);
      return {
        ...q,
        description: `${i18n.t('questions.budget.currencyLabel')} ${currency.code} (${currency.symbol})`,
        suffix: currency.symbol,
      };
    }
    return q;
  });

  // Dynamic total questions based on current branch
  const totalQuestions = currentQuestions.length;

  const currentQuestion = currentQuestions[currentStep];
  const progress = ((currentStep + 1) / totalQuestions) * 100;

  const handleAnswer = async (answer: string | number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);

    // If this is the country question, change language based on country selection
    if (currentQuestion.id === 'country') {
      const selectedCountryCode = String(answer);
      const newLanguage = mapCountryToLanguage(selectedCountryCode);
      if (i18n.language !== newLanguage) {
        await i18n.changeLanguage(newLanguage);
      }
    }

    // Save the response to database with validation
    if (sessionId) {
      try {
        const responseData = {
          session_id: sessionId,
          question_number: currentStep + 1,
          question_text: currentQuestion.question,
          selected_answer: String(answer),
        };

        // Validate data before inserting
        quizResponseSchema.parse(responseData);

        const res = await fetch('/api/pb/quiz_responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(responseData)
        });

        if (!res.ok) {
          if (import.meta.env.DEV) {
            console.warn('Non-fatal: could not persist intermediate quiz response');
          }
        }
      } catch (validationError) {
        if (import.meta.env.DEV) {
          console.error('Validation error:', validationError);
        }
      }
    }

    if (currentStep < currentQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last question - analyze with AI before showing results
      await analyzeAnswers(newAnswers);
    }
  };

  const analyzeAnswers = async (finalAnswers: QuizAnswers) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    // Small backoff to ensure last insert is persisted
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      // Get all questions that were answered
      const answeredQuestions = currentQuestions.filter(q => finalAnswers[q.id] !== undefined);
      
      console.log('Calling /api/quiz/analyze endpoint...');
      const res = await fetch('/api/quiz/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: finalAnswers,
          questions: answeredQuestions,
          sessionId: sessionId
        })
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Error analyzing quiz:', error);
        
        // Handle 409: Session already analyzed
        if ((error as any)?.status === 409 || error.message?.includes('409') || error.message?.toLowerCase().includes('already analyzed')) {
          console.log('Session already analyzed, fetching existing recommendation...');
          try {
            const data = await api.get(`/api/pb/ai_recommendations?session_id=${sessionId}`);
            const rec = data && data.length > 0 ? data[0] : null;
            
            if (rec?.recommendation_text) {
              console.log('Found existing recommendation, displaying results');
              setAiRecommendation(rec.recommendation_text);
              setShowResults(true);
              setIsAnalyzing(false);
              return;
            }
          } catch (fetchError) {
            console.error('Failed to fetch existing recommendation:', fetchError);
          }
        }
        
        // Check for specific error codes
        if ((error as any)?.status === 402 || error.message?.includes('402') || error.message?.toLowerCase().includes('credits')) {
          setAnalysisError('Insufficient AI credits. Please contact support to continue.');
        } else if ((error as any)?.status === 429 || error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
          setAnalysisError('Too many requests. Please wait a few moments and try again.');
        } else if (error.message?.toLowerCase().includes('timeout') || error.message?.toLowerCase().includes('abort')) {
          setAnalysisError('AI service timeout. Please try again.');
        } else if (error.message?.toLowerCase().includes('parse') || error.message?.toLowerCase().includes('invalid')) {
          setAnalysisError('Failed to parse AI response. Please try again.');
        } else if (error.message?.toLowerCase().includes('network') || error.message?.toLowerCase().includes('connection')) {
          setAnalysisError('Network connection lost. Please check your internet and try again.');
        } else {
          setAnalysisError('Error analyzing your responses. Please try again.');
        }
        setIsAnalyzing(false);
        return;
      } 
      
      const data = await res.json();
      
      if (data?.recommendation && data?.ai_report && data?.metadata) {
        console.log('AI analysis received with new format');
        setAiRecommendation(JSON.stringify({
          recommendation: data.recommendation,
          ai_report: data.ai_report,
          metadata: data.metadata
        }));
      } else if (data?.session_info && data?.recommendations) {
        console.log('AI analysis received with structured data');
        setAiRecommendation(JSON.stringify(data));
      } else if (data?.success && data?.build_data) {
        console.log('AI analysis received with build_data:', data.build_data);
        setAiRecommendation(data.build_data.recommendation);
      } else {
        setAnalysisError('Unexpected error. Please try again.');
        setIsAnalyzing(false);
        return;
      }
    } catch (error) {
      console.error('Error calling analyze-quiz:', error);
      setAnalysisError('Connection error. Please check your internet and try again.');
      setIsAnalyzing(false);
      return;
    }

    console.log('Analysis successful, navigating to results');
    setIsAnalyzing(false);
    navigate(`/build/${sessionId}`);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  // Error state with retry option
  if (analysisError) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-12 max-w-md mx-4 text-center space-y-6">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t('quiz.errorTitle')}</h2>
            <p className="text-muted-foreground">{analysisError}</p>
          </div>
          <div className="flex flex-col gap-4">
            <Button 
              onClick={() => analyzeAnswers(answers)}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('quiz.tryAgain')}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (!sessionId || !isSessionReady) {
                  toast({
                    title: "Please wait",
                    description: "Session is being created...",
                    variant: "default",
                  });
                  return;
                }
                setAnalysisError(null);
                setShowResults(true);
              }}
            >
              {t('quiz.viewWithoutAI')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-12 max-w-md mx-4 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Sparkles className="w-16 h-16 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-ping" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t('quiz.analyzingTitle')}</h2>
            <p className="text-muted-foreground">
              {t('quiz.analyzingDescription')}
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </Card>
      </div>
    );
  }

  if (showResults && sessionId && isSessionReady) {
    return <Results answers={answers} sessionId={sessionId} aiRecommendation={aiRecommendation} onBack={onBack} onRestart={async () => {
      setAnswers({});
      setCurrentStep(0);
      setShowResults(false);
      setAiRecommendation("");
      setIsAnalyzing(false);
      setIsSessionReady(false);
      
      // Create new session for restart with UUID
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      
      // Local fallback for restart
      const countryCode = 'PT';
      const countryName = 'Portugal';

      try {
        await fetch('/api/pb/quiz_sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: newSessionId,
            country_code: countryCode,
            country_name: countryName,
          })
        });
        setIsSessionReady(true);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error creating new quiz session:', error);
        }
      }
    }} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 
              className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
              onClick={onBack}
            >
              FORGEA
            </h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-primary text-foreground hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('quiz.back')}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{t('quiz.question')} {currentStep + 1} {t('quiz.of')} {totalQuestions}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Mobile back button */}
          {currentStep > 0 && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="md:hidden mt-4 gap-2 text-muted-foreground"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('quiz.back')}
            </Button>
          )}
        </div>

        {/* Question */}
        <div className="max-w-3xl mx-auto">
          {!isSessionReady ? (
            <Card className="p-8">
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="space-y-3 pt-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </Card>
          ) : (
            <div key={currentQuestion.id} className="animate-fade-in">
              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                onAnswer={handleAnswer}
                disabled={!isSessionReady}
                defaultValue={currentQuestion.id === "country" ? detectedCountry : undefined}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer - Hidden on mobile during quiz */}
      <footer className="hidden md:block border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>{t('landing.copyright')}</p>
            <div className="flex gap-6">
              <a href="/terms" className="hover:text-primary transition-colors">
                {t('landing.terms')}
              </a>
              <a href="/privacy" className="hover:text-primary transition-colors">
                {t('landing.privacy')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Quiz;
