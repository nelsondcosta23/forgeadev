import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import QuestionCard from "./quiz/QuestionCard";
import Results from "./quiz/Results";
import { questions, QuizAnswers } from "./quiz/questions";

interface QuizProps {
  onBack: () => void;
}

const Quiz = ({ onBack }: QuizProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestions = questions.filter(q => {
    if (!q.condition) return true;
    return q.condition(answers);
  });

  const currentQuestion = currentQuestions[currentStep];
  const progress = ((currentStep + 1) / currentQuestions.length) * 100;

  const handleAnswer = (answer: string | number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);

    if (currentStep < currentQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
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
    return <Results answers={answers} onRestart={() => {
      setAnswers({});
      setCurrentStep(0);
      setShowResults(false);
    }} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6 hover:bg-card"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

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
    </div>
  );
};

export default Quiz;
