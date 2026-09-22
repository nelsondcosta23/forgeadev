import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Question } from "./questions";
import { Check } from "lucide-react";
import { CountrySelect } from "./CountrySelect";

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: string | number) => void;
  disabled?: boolean;
  defaultValue?: string;
}

const QuestionCard = ({ question, onAnswer, disabled = false, defaultValue }: QuestionCardProps) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<string | null>(defaultValue || null);
  const [numberValue, setNumberValue] = useState<number>(question.min ?? 0);

  useEffect(() => {
    if (defaultValue) {
      setSelectedOption(defaultValue);
    }
  }, [defaultValue]);

  const handleOptionSelect = (value: string) => {
    setSelectedOption(value);
    // Auto-advance for questions that don't require confirmation
    if (question.id !== "country" && question.id !== "budget") {
      setTimeout(() => {
        onAnswer(value);
        setSelectedOption(null);
      }, 300);
    }
  };

  const handleOptionSubmit = () => {
    const finalAnswer = selectedOption || defaultValue;
    if (finalAnswer) {
      onAnswer(finalAnswer);
    }
  };

  const handleNumberSubmit = () => {
    onAnswer(numberValue);
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-card to-card/50 border-primary/10 backdrop-blur-sm">
      <div className="space-y-6">
        {/* Question Title */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">{t(question.question)}</h2>
          {question.description && (
            <p className="text-muted-foreground">{t(question.description)}</p>
          )}
        </div>

        {/* Options */}
        {question.type === "single" && question.options && (
          <div className="space-y-6">
            {/* Special country selector with search */}
            {question.id === "country" ? (
              <div className="pt-4">
                <CountrySelect
                  countries={question.options.map(opt => ({
                    value: opt.value,
                    label: opt.label,
                    icon: opt.icon || ""
                  }))}
                  onSelect={handleOptionSelect}
                  defaultValue={defaultValue}
                  disabled={disabled}
                />
              </div>
            ) : (
              <div className="grid gap-4 pt-4">
                {question.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    disabled={disabled}
                    className={`group relative p-6 rounded-lg border-2 text-left transition-all duration-300 ${
                      disabled ? "opacity-50 cursor-not-allowed" : ""
                    } ${
                      selectedOption === option.value
                        ? "border-primary bg-primary/10 scale-[0.98]"
                        : "border-border hover:border-primary/50 hover:bg-card/80"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {option.icon && (
                        <span className="text-3xl">{option.icon}</span>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-lg mb-1">{t(option.label)}</div>
                        {option.description && (
                          <div className="text-sm text-muted-foreground">
                            {t(option.description)}
                          </div>
                        )}
                      </div>
                      {selectedOption === option.value && (
                        <Check className="w-6 h-6 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Show Continue button only for country and budget questions */}
            {selectedOption && (question.id === "country" || question.id === "budget") && (
              <Button
                onClick={handleOptionSubmit}
                disabled={disabled}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)]"
                size="lg"
              >
                {t('quiz.submit')}
              </Button>
            )}
          </div>
        )}

        {/* Number Input */}
        {question.type === "number" && (
          <div className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-5xl font-bold text-primary">
                  {numberValue}
                </span>
                {question.suffix && (
                  <span className="text-2xl text-muted-foreground ml-2">
                    {question.suffix}
                  </span>
                )}
              </div>
              
              <Slider
                value={[numberValue]}
                onValueChange={([value]) => setNumberValue(value)}
                min={question.min || 0}
                max={question.max || 100}
                step={question.step || 1}
                className="py-4"
              />
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{question.min}{question.suffix}</span>
                <span>{question.max}{question.suffix}</span>
              </div>
            </div>

            <Button
              onClick={handleNumberSubmit}
              disabled={disabled}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)]"
              size="lg"
            >
              {t('quiz.submit')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default QuestionCard;
