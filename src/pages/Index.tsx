import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Cpu, Monitor, Sparkles } from "lucide-react";
import Quiz from "@/components/Quiz";

const Index = () => {
  const [showQuiz, setShowQuiz] = useState(false);

  if (showQuiz) {
    return <Quiz onBack={() => setShowQuiz(false)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(195_92%_55%_/_0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(155_85%_45%_/_0.15),transparent_50%)]" />
        
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Custom Configuration</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
              Find Your
              <span className="block mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Perfect PC
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Answer a few simple questions and get personalized recommendations 
              based on your needs and budget.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                onClick={() => setShowQuiz(true)}
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)] transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Quiz
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
              {[
                { icon: Cpu, label: "Components", value: "500+" },
                { icon: Monitor, label: "Builds", value: "50+" },
                { icon: Sparkles, label: "Satisfaction", value: "98%" },
              ].map((stat, i) => (
                <Card key={i} className="p-6 bg-card/50 border-primary/10 backdrop-blur-sm hover:border-primary/30 transition-colors">
                  <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Answer",
                description: "Simple questions about intended use and preferences",
              },
              {
                step: "02",
                title: "Analyze",
                description: "Our system analyzes your answers and budget",
              },
              {
                step: "03",
                title: "Receive",
                description: "Personalized builds with detailed explanations",
              },
            ].map((feature, i) => (
              <Card key={i} className="p-8 bg-gradient-to-br from-card to-card/50 border-primary/10 relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="absolute top-0 right-0 text-8xl font-bold text-primary/5 -mr-4 -mt-4">
                  {feature.step}
                </div>
                <div className="relative">
                  <div className="text-primary font-bold text-sm mb-3">{feature.step}</div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
