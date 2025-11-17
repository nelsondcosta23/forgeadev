import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Cpu, Monitor, Sparkles } from "lucide-react";
import Quiz from "@/components/Quiz";

const Index = () => {
  const { t } = useTranslation();
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
            {/* Logo/Brand */}
            <div className="mb-4">
              <h2 className="text-2xl lg:text-3xl font-bold text-primary tracking-wider">{t('landing.brand')}</h2>
            </div>
            
            {/* Title */}
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
              {t('landing.title')}
            </h1>

            {/* Description */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('landing.subtitle')}
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                onClick={() => setShowQuiz(true)}
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)] transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t('landing.startQuiz')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </div>


            {/* How It Works */}
            <div className="pt-12 max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">{t('landing.howItWorksTitle')}</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    step: "01",
                    title: t('landing.step1Title'),
                    description: t('landing.step1Desc'),
                  },
                  {
                    step: "02",
                    title: t('landing.step2Title'),
                    description: t('landing.step2Desc'),
                  },
                  {
                    step: "03",
                    title: t('landing.step3Title'),
                    description: t('landing.step3Desc'),
                  },
                ].map((feature, i) => (
                  <Card key={i} className="p-8 bg-gradient-to-br from-card to-card/50 border-primary/50 relative overflow-hidden group hover:border-primary hover:shadow-[var(--glow-primary)] transition-all">
                    <div className="absolute top-0 right-0 text-8xl font-bold text-primary/[0.23] -mr-4 -mt-4">
                      {feature.step}
                    </div>
                    <div className="relative">
                      <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
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
              <a href="/faq" className="hover:text-primary transition-colors">
                {t('landing.faq')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
