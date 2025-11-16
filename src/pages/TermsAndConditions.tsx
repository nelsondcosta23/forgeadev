import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const TermsAndConditions = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link to="/" className="text-primary hover:underline mb-8 inline-block">
          ← {t('terms.backToHome')}
        </Link>
        
        <h1 className="text-4xl font-bold mb-8 text-foreground">{t('terms.title')}</h1>
        
        <Alert className="mb-8 border-amber-500 bg-amber-500/10">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <AlertDescription className="text-foreground">
            <strong>{t('terms.importantNotice.title')}</strong> {t('terms.importantNotice.content')}
          </AlertDescription>
        </Alert>
        
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
              {t('terms.aiContent.intro')}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.aiContent.point1')}</li>
              <li>{t('terms.aiContent.point2')}</li>
              <li>{t('terms.aiContent.point3')}</li>
              <li>{t('terms.aiContent.point4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.useOfService.title')}</h2>
            <p>
              {t('terms.useOfService.content')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.intellectualProperty.title')}</h2>
            <p>
              {t('terms.intellectualProperty.content')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.liability.title')}</h2>
            <p>
              {t('terms.liability.content')}
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
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.governingLaw.title')}</h2>
            <p>
              {t('terms.governingLaw.content')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.contact.title')}</h2>
            <p>
              {t('terms.contact.content')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
