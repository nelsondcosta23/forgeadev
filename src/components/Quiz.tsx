import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import QuestionCard from "./quiz/QuestionCard";
import Results from "./quiz/Results";
import { questions, QuizAnswers } from "./quiz/questions";
import { supabase } from "@/integrations/supabase/client";
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
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showResults, setShowResults] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string>("");
  const { toast } = useToast();

  // Create a quiz session when component mounts
  useEffect(() => {
    const createSession = async () => {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      setSessionId(newSessionId);

      // Detect user's country
      let countryCode = null;
      let countryName = null;
      
      try {
        const { data: countryData } = await supabase.functions.invoke('detect-country');
        if (countryData && !countryData.error) {
          countryCode = countryData.country_code;
          countryName = countryData.country_name;
          setDetectedCountry(countryCode); // Store detected country for pre-selection
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error detecting country:', error);
        }
      }

      const { error } = await supabase
        .from('quiz_sessions')
        .insert({
          session_id: newSessionId,
          country_code: countryCode,
          country_name: countryName,
        });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error creating quiz session:', error);
        }
        toast({
          title: "Error",
          description: "Unable to start quiz session.",
          variant: "destructive",
        });
      } else {
        // Session created successfully, ready to accept answers
        setIsSessionReady(true);
      }
    };

    createSession();
  }, []);

  // Function to get currency based on country
  const getCurrencyInfo = (countryCode: string) => {
    const currencyMap: Record<string, { symbol: string, code: string }> = {
      PT: { symbol: '€', code: 'EUR' },
      ES: { symbol: '€', code: 'EUR' },
      FR: { symbol: '€', code: 'EUR' },
      DE: { symbol: '€', code: 'EUR' },
      IT: { symbol: '€', code: 'EUR' },
      NL: { symbol: '€', code: 'EUR' },
      BE: { symbol: '€', code: 'EUR' },
      AT: { symbol: '€', code: 'EUR' },
      IE: { symbol: '€', code: 'EUR' },
      FI: { symbol: '€', code: 'EUR' },
      GR: { symbol: '€', code: 'EUR' },
      BR: { symbol: 'R$', code: 'BRL' },
      GB: { symbol: '£', code: 'GBP' },
      US: { symbol: '$', code: 'USD' },
      CA: { symbol: 'CA$', code: 'CAD' },
      AU: { symbol: 'AU$', code: 'AUD' },
      NZ: { symbol: 'NZ$', code: 'NZD' },
      MX: { symbol: 'MX$', code: 'MXN' },
      AR: { symbol: 'AR$', code: 'ARS' },
      CL: { symbol: 'CL$', code: 'CLP' },
      CO: { symbol: 'CO$', code: 'COP' },
      PE: { symbol: 'S/', code: 'PEN' },
      JP: { symbol: '¥', code: 'JPY' },
      KR: { symbol: '₩', code: 'KRW' },
      CN: { symbol: '¥', code: 'CNY' },
      IN: { symbol: '₹', code: 'INR' },
      CH: { symbol: 'CHF', code: 'CHF' },
      SE: { symbol: 'kr', code: 'SEK' },
      NO: { symbol: 'kr', code: 'NOK' },
      DK: { symbol: 'kr', code: 'DKK' },
      PL: { symbol: 'zł', code: 'PLN' },
      CZ: { symbol: 'Kč', code: 'CZK' },
      HU: { symbol: 'Ft', code: 'HUF' },
      RO: { symbol: 'lei', code: 'RON' },
      TR: { symbol: '₺', code: 'TRY' },
      ZA: { symbol: 'R', code: 'ZAR' },
      SG: { symbol: 'S$', code: 'SGD' },
      AE: { symbol: 'AED', code: 'AED' },
      SA: { symbol: 'SAR', code: 'SAR' },
      IL: { symbol: '₪', code: 'ILS' },
    };
    
    return currencyMap[countryCode] || { symbol: '$', code: 'USD' };
  };

  const currentQuestions = questions.filter(q => {
    if (!q.condition) return true;
    return q.condition(answers);
  }).map(q => {
    // Dynamically update budget question based on selected country
    if (q.id === 'budget' && answers.country) {
      const currency = getCurrencyInfo(answers.country as string);
      return {
        ...q,
        description: `In ${currency.code} (${currency.symbol})`,
        suffix: currency.symbol,
      };
    }
    return q;
  });

  const currentQuestion = currentQuestions[currentStep];
  const progress = ((currentStep + 1) / currentQuestions.length) * 100;

  const handleAnswer = async (answer: string | number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);

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

        const { error } = await supabase
          .from('quiz_responses')
          .insert(responseData);

        if (error) {
          if (import.meta.env.DEV) {
            console.error('Error saving quiz response:', error);
          }
          toast({
            title: "Error",
            description: "Unable to save your response. Please try again.",
            variant: "destructive",
          });
          return;
        }
      } catch (validationError) {
        if (import.meta.env.DEV) {
          console.error('Validation error:', validationError);
        }
        toast({
          title: "Error",
          description: "Invalid response data.",
          variant: "destructive",
        });
        return;
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
      
      console.log('Calling analyze-quiz function...');
      const { data, error } = await supabase.functions.invoke('analyze-quiz', {
        body: {
          answers: finalAnswers,
          questions: answeredQuestions,
          sessionId: sessionId
        }
      });

      if (error) {
        console.error('Error analyzing quiz:', error);
        console.error('Error details:', { message: error.message, status: (error as any)?.status });
        
        // Handle 409: Session already analyzed
        if ((error as any)?.status === 409 || error.message?.includes('409') || error.message?.toLowerCase().includes('already analyzed')) {
          console.log('Session already analyzed, fetching existing recommendation...');
          try {
            const { data: rec, error: recError } = await supabase
              .from('ai_recommendations')
              .select('recommendation_text')
              .eq('session_id', sessionId)
              .maybeSingle();
            
            if (recError) {
              console.error('Error fetching existing recommendation:', recError);
            } else if (rec?.recommendation_text) {
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
      } else if (data?.recommendation && data?.ai_report && data?.metadata) {
        // New format: recommendation (markdown string), ai_report, metadata
        console.log('AI analysis received with new format');
        console.log('Recommendation:', data.recommendation);
        console.log('AI Report:', data.ai_report);
        console.log('Metadata:', data.metadata);
        
        // Store the full response as JSON string for Results component
        setAiRecommendation(JSON.stringify({
          recommendation: data.recommendation,
          ai_report: data.ai_report,
          metadata: data.metadata
        }));
      } else if (data?.session_info && data?.recommendations) {
        console.log('AI analysis received with structured data');
        console.log('Session info:', data.session_info);
        console.log('Recommendations:', data.recommendations);
        console.log('Metadata:', data.metadata);
        
        // Store the explanation/recommendation text
        setAiRecommendation(data.explanation || '');
        
        // Store the full response for Results component (including builds)
        setAiRecommendation(JSON.stringify({
          builds: data.recommendations,
          explanation: data.explanation
        }));
      } else if (data?.success && data?.build_data) {
        // Fallback for old format
        console.log('AI analysis received with build_data:', data.build_data);
        setAiRecommendation(data.build_data.recommendation);
        
        console.log('Quiz data:', data.quiz_data);
        console.log('AI Report:', data.build_data.ai_report);
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

    // Edge function will mark session as completed
    // Just show results
    console.log('Analysis successful, showing results');
    setIsAnalyzing(false);
    setShowResults(true);
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
            <h2 className="text-2xl font-bold">Analysis Error</h2>
            <p className="text-muted-foreground">{analysisError}</p>
          </div>
          <div className="flex flex-col gap-4">
            <Button 
              onClick={() => analyzeAnswers(answers)}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setAnalysisError(null);
                setShowResults(true);
              }}
            >
              View Results Without AI
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
            <h2 className="text-2xl font-bold">Analyzing your answers...</h2>
            <p className="text-muted-foreground">
              AI is processing your preferences to create personalized recommendations
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

  if (showResults) {
    return <Results answers={answers} sessionId={sessionId} aiRecommendation={aiRecommendation} onBack={onBack} onRestart={async () => {
      setAnswers({});
      setCurrentStep(0);
      setShowResults(false);
      setAiRecommendation("");
      setIsAnalyzing(false);
      setIsSessionReady(false);
      
      // Create new session for restart
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      setSessionId(newSessionId);
      
      // Detect country for new session
      let countryCode = null;
      let countryName = null;
      
      try {
        const { data: countryData } = await supabase.functions.invoke('detect-country');
        if (countryData && !countryData.error) {
          countryCode = countryData.country_code;
          countryName = countryData.country_name;
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error detecting country:', error);
        }
      }

      const { error } = await supabase
        .from('quiz_sessions')
        .insert({
          session_id: newSessionId,
          country_code: countryCode,
          country_name: countryName,
        });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error creating new quiz session:', error);
        }
      } else {
        // Session ready for new answers
        setIsSessionReady(true);
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
          {!isSessionReady && (
            <div className="text-center text-muted-foreground mb-4">
              Initializing session...
            </div>
          )}
          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            disabled={!isSessionReady}
            defaultValue={currentQuestion.id === "country" ? detectedCountry : undefined}
          />
        </div>
      </div>

      {/* Footer - Hidden on mobile during quiz */}
      <footer className="hidden md:block border-t border-border/50 bg-card/30 backdrop-blur-sm">
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
