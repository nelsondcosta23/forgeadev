import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const TermsAndConditions = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 py-12 px-4">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="text-primary hover:underline">
            {t('terms.backToHome')}
          </Link>
          
          <LanguageSwitcher />
        </div>
        
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t('terms.title')}
            </CardTitle>
            <CardDescription>
              <Alert className="border-amber-500 bg-amber-500/10">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <AlertDescription className="text-foreground">
                  <strong>{t('terms.alertTitle')}</strong> {t('terms.alertDesc')}
                </AlertDescription>
              </Alert>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.acceptance.title')}</h2>
                <p>
                  {t('terms.acceptance.content')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.aiContent.title')}</h2>
                <p>
                  {t('terms.aiContent.content')}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{t('terms.aiContent.item1')}</li>
                  <li>{t('terms.aiContent.item2')}</li>
                  <li>{t('terms.aiContent.item3')}</li>
                  <li>{t('terms.aiContent.item4')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.useOfService.title')}</h2>
                <p>
                  {t('terms.useOfService.content')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.intellectual.title')}</h2>
                <p>
                  {t('terms.intellectual.content')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.limitation.title')}</h2>
                <p>
                  {t('terms.limitation.content')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.accuracy.title')}</h2>
                <p>
                  {t('terms.accuracy.content')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.changes.title')}</h2>
                <p>
                  {t('terms.changes.content')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.governing.title')}</h2>
                <p>
                  {t('terms.governing.content')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.contact.title')}</h2>
                <p>
                  {t('terms.contact.content')}
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditions;
