import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  const { t } = useTranslation();

  const faqs = [
    { id: "1", question: t("faq.q1.question"), answer: t("faq.q1.answer") },
    { id: "2", question: t("faq.q2.question"), answer: t("faq.q2.answer") },
    { id: "3", question: t("faq.q3.question"), answer: t("faq.q3.answer") },
    { id: "4", question: t("faq.q4.question"), answer: t("faq.q4.answer") },
    { id: "5", question: t("faq.q5.question"), answer: t("faq.q5.answer") },
    { id: "6", question: t("faq.q6.question"), answer: t("faq.q6.answer") },
    { id: "7", question: t("faq.q7.question"), answer: t("faq.q7.answer") },
    { id: "8", question: t("faq.q8.question"), answer: t("faq.q8.answer") },
    { id: "9", question: t("faq.q9.question"), answer: t("faq.q9.answer") },
    { id: "10", question: t("faq.q10.question"), answer: t("faq.q10.answer") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          {t("faq.backToHome")}
        </Link>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t("faq.title")}
            </CardTitle>
            <CardDescription className="text-lg">
              {t("faq.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border border-border/50 rounded-lg px-6 data-[state=open]:shadow-md transition-all"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 pt-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;
