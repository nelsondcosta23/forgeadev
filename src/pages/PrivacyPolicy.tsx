import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="text-primary hover:underline">
            {t('privacy.backToHome')}
          </Link>
          
          <LanguageSwitcher />
        </div>
        
        <h1 className="text-4xl font-bold mb-8 text-foreground">{t('privacy.title')}</h1>
        
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8">
          <p className="text-foreground font-medium">
            {t('privacy.securityNotice')}
          </p>
        </div>
        
        <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('privacy.intro.title')}</h2>
            <p>
              {t('privacy.intro.content')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('privacy.collected.title')}</h2>
            <p>
              {t('privacy.collected.content')}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.collected.item1')}</li>
            </ul>
            <p className="mt-4">
              {t('privacy.collected.note')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('privacy.usage.title')}</h2>
            <p>
              {t('privacy.usage.content')}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.usage.item1')}</li>
              <li>{t('privacy.usage.item2')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('privacy.security.title')}</h2>
            <p>
              {t('privacy.security.content')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('privacy.thirdParty.title')}</h2>
            <p>
              {t('privacy.thirdParty.content')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('privacy.rights.title')}</h2>
            <p>
              {t('privacy.rights.content')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('privacy.changes.title')}</h2>
            <p>
              {t('privacy.changes.content')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('privacy.contact.title')}</h2>
            <p>
              {t('privacy.contact.content')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
