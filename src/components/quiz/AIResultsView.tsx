import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Share2, Download, Copy, Link2 } from "lucide-react";
import { BuildCard, BuildData, ComponentDetail } from "./BuildCard";
import { ShareDialog } from "./ShareDialog";
import { useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

interface AIResultsViewProps {
  sessionInfo: {
    session_id?: string;
    country: string;
    country_code: string;
    total_score: number | null;
    completed_at: string;
    ai_report?: {
      budget_range?: string;
      primary_use?: string;
      performance_level?: string;
      upgrade_priority?: string;
      [key: string]: any;
    };
  };
  sessionId?: string;
  recommendations: {
    "Best Value": BuildData;
    "Balanced": BuildData;
    "High Performance": BuildData;
  };
  explanation?: string;
  onRestart: () => void;
  onBack: () => void;
}

export const AIResultsView = ({ 
  sessionInfo, 
  sessionId,
  recommendations,
  explanation,
  onRestart, 
  onBack 
}: AIResultsViewProps) => {
  const { t } = useTranslation();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const finalSessionId = sessionInfo?.session_id || sessionId || "";
  const shareUrl = finalSessionId ? `${window.location.origin}/build/${finalSessionId}` : "";

  const getComponentModel = (component: string | ComponentDetail | undefined): string => {
    if (!component) return "—";
    if (typeof component === "string") return component;
    return component.model || "—";
  };

  const handleDownload = async () => {
    if (!finalSessionId) {
      toast.warning(t('results.generatingLink', { defaultValue: 'A gerar link da build...' }));
      return;
    }

    try {
      toast.info(t('results.generatingPDF', { defaultValue: 'A gerar PDF profissional...' }));
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Forgea Brand Colors
      const primaryColor: [number, number, number] = [255, 117, 26];
      const secondaryColor: [number, number, number] = [31, 41, 55]; // Slate 800
      const lightBg: [number, number, number] = [249, 250, 251]; // Gray 50
      const borderColor: [number, number, number] = [229, 231, 235]; // Gray 200

      // 1. Header Section
      // Background for header
      pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.rect(0, 0, pageWidth, 45, "F");

      // logo
      pdf.setFontSize(28);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont(undefined, "bold");
      pdf.text("FORGEA", margin, 28);

      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(200, 200, 200);
      pdf.text("Build Inteligente de PC", margin, 35);

      // Generate QR Code
      const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 150,
        margin: 1,
        color: { dark: "#1F2937", light: "#FFFFFF" }
      });
      
      const qrSize = 30;
      // QR Box on the right
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(pageWidth - margin - qrSize - 4, 6, qrSize + 8, qrSize + 8, 2, 2, "F");
      pdf.addImage(qrCodeDataUrl, "PNG", pageWidth - margin - qrSize - 2, 8, qrSize + 4, qrSize + 4);
      
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      pdf.text("SCAN TO VIEW ONLINE", pageWidth - margin - qrSize - 1, 42);

      yPos = 55;

      // 2. Build Summary Banner
      pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), 25, 2, 2, "FD");

      const sessionDate = new Date(sessionInfo.completed_at).toLocaleDateString();
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, "bold");
      pdf.text("SESSION ID", margin + 5, yPos + 8);
      pdf.text("COUNTRY", margin + 70, yPos + 8);
      pdf.text("DATE", margin + 130, yPos + 8);

      pdf.setFontSize(10);
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.setFont(undefined, "normal");
      pdf.text(finalSessionId.substring(0, 18) + "...", margin + 5, yPos + 15);
      pdf.text(sessionInfo.country || "Global", margin + 70, yPos + 15);
      pdf.text(sessionDate, margin + 130, yPos + 15);

      yPos += 35;

      // 3. User Requirements (Optional but good)
      if (sessionInfo.ai_report) {
        pdf.setFontSize(14);
        pdf.setFont(undefined, "bold");
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text("O Teu Perfil", margin, yPos);
        yPos += 8;

        autoTable(pdf, {
          startY: yPos,
          margin: { left: margin },
          theme: 'plain',
          styles: { fontSize: 10, cellPadding: 2 },
          columnStyles: { 0: { fontStyle: 'bold', textColor: [100, 100, 100], width: 40 } },
          body: [
            ["Orçamento:", sessionInfo.ai_report.budget_range || "N/A"],
            ["Uso Principal:", sessionInfo.ai_report.primary_use || "N/A"],
            ["Performance:", sessionInfo.ai_report.performance_level || "N/A"],
          ],
        });
        yPos = (pdf as any).lastAutoTable.finalY + 15;
      }

      // 4. Recommendation Cards
      const buildTypes = ["Best Value", "Balanced", "High Performance"] as const;
      const buildColors: Record<string, [number, number, number]> = {
        "Best Value": [16, 185, 129],    // Emerald 500
        "Balanced": [255, 117, 26],      // Forgea Orange
        "High Performance": [139, 92, 246] // Purple 500
      };

      pdf.setFontSize(16);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.text("Configurações Recomendadas", margin, yPos);
      yPos += 10;

      for (const buildType of buildTypes) {
        const build = recommendations[buildType];
        const color = buildColors[buildType];

        if (yPos > pageHeight - 80) {
          pdf.addPage();
          yPos = margin;
        }

        // Card Header
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), 10, 1, 1, "F");
        
        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont(undefined, "bold");
        pdf.text(`${buildType.toUpperCase()} - ${build.performance_tier}`, margin + 5, yPos + 6.5);
        
        pdf.setTextColor(255, 255, 255);
        const priceText = build.estimated_price_range;
        const priceWidth = pdf.getTextWidth(priceText);
        pdf.text(priceText, pageWidth - margin - priceWidth - 5, yPos + 6.5);

        yPos += 10;

        // Components Table
        autoTable(pdf, {
          startY: yPos,
          margin: { left: margin, right: margin },
          theme: 'striped',
          head: [['Componente', 'Modelo Recomendado']],
          headStyles: { fillColor: [240, 240, 40], textColor: [0,0,0], fontSize: 0, cellPadding: 0 }, // Hide header but keep structure
          showHead: false,
          styles: { fontSize: 9, cellPadding: 4 },
          columnStyles: { 
            0: { fontStyle: 'bold', width: 45, textColor: color },
            1: { cellWidth: 'auto' }
          },
          body: [
            ['Processador', getComponentModel(build.processor)],
            ['Placa Gráfica', getComponentModel(build.graphics_card)],
            ['Memória RAM', getComponentModel(build.ram)],
            ['Armazenamento', getComponentModel(build.storage)],
            ['Fonte Alimentação', getComponentModel(build.power_supply)],
          ],
        });

        yPos = (pdf as any).lastAutoTable.finalY + 12;
      }

      // 5. AI Explanation
      if (explanation) {
        if (yPos > pageHeight - 60) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont(undefined, "bold");
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text("Análise da Nossa IA", margin, yPos);
        yPos += 8;

        pdf.setFontSize(10);
        pdf.setFont(undefined, "normal");
        pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        
        const splitExplanation = pdf.splitTextToSize(explanation, pageWidth - (margin * 2));
        
        // Handle multipage text carefully
        for (const line of splitExplanation) {
          if (yPos > pageHeight - 15) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.text(line, margin, yPos);
          yPos += 5.5;
        }
      }

      // 6. Share Section at bottom
      yPos += 15;
      if (yPos < pageHeight - 30) {
        pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
        
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text("Link Direto para Partilha:", margin, yPos);
        yPos += 5;
        
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.setFont(undefined, "bold");
        pdf.text(shareUrl, margin, yPos);
      }

      // Save PDF
      pdf.save(`forgea-build-${finalSessionId}.pdf`);
      toast.success(t('results.pdfDownloaded', { defaultValue: 'PDF gerado com sucesso!' }));
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(t('results.pdfError', { defaultValue: 'Erro ao gerar PDF. Tenta novamente.' }));
    }
  };

  const handleCopyUrl = () => {
    if (!finalSessionId) {
      toast.warning(t('results.generatingLink', { defaultValue: 'Generating build link...' }));
      return;
    }
    navigator.clipboard.writeText(shareUrl);
    toast.success(t('results.copied'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('quiz.back')}
            </Button>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">{t('results.export')}</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (!finalSessionId) {
                    toast.warning(t('results.generatingLink', { defaultValue: 'Generating build link...' }));
                    return;
                  }
                  setShareDialogOpen(true);
                }}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('results.share')}</span>
              </Button>
              <Button onClick={onRestart}>
                {t('results.restart')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            {t('results.title')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('results.subtitle')}
          </p>
        </div>

        {/* Shareable URL Section */}
        <Card className="mb-8 p-6 bg-gradient-to-br from-card to-card/80 border-border">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('results.uniqueBuildUrl', { defaultValue: 'Your Unique Build URL' })}</h2>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted/30 rounded-md px-4 py-3 border border-border/50">
              <code className="text-sm text-primary font-mono break-all">
                {finalSessionId ? shareUrl : t('results.generatingLink', { defaultValue: 'Generating build link...' })}
              </code>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyUrl}
              className="shrink-0"
              disabled={!finalSessionId}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {t('results.saveShareNote', { defaultValue: 'Save or share this unique link to access your custom PC build recommendations anytime.' })}
          </p>
        </Card>

        {/* Session Info Card */}
        <Card className="mb-8 p-6 bg-gradient-to-br from-muted/30 to-muted/10 border-muted">
          <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-border/50">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Country</p>
                <p className="font-semibold">{sessionInfo.country}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Session ID</p>
                <p className="font-mono text-xs truncate">{finalSessionId || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-sm">
                  {new Date(sessionInfo.completed_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Builds</p>
                <p className="font-semibold">3 Options</p>
              </div>
            </div>

            {/* AI Report Details */}
            {sessionInfo.ai_report && (
              <div>
                <h3 className="text-lg font-semibold mb-4">AI Analysis Report</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {sessionInfo.ai_report.budget_range && (
                    <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Budget Range</p>
                      <p className="font-semibold text-sm">{sessionInfo.ai_report.budget_range}</p>
                    </div>
                  )}
                  {sessionInfo.ai_report.primary_use && (
                    <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Primary Use</p>
                      <p className="font-semibold text-sm">{sessionInfo.ai_report.primary_use}</p>
                    </div>
                  )}
                  {sessionInfo.ai_report.performance_level && (
                    <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Performance Level</p>
                      <p className="font-semibold text-sm">{sessionInfo.ai_report.performance_level}</p>
                    </div>
                  )}
                  {sessionInfo.ai_report.upgrade_priority && (
                    <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Upgrade Priority</p>
                      <p className="font-semibold text-sm">{sessionInfo.ai_report.upgrade_priority}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Build Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <BuildCard 
            title="Best Value"
            build={recommendations["Best Value"]}
            variant="value"
          />
          <BuildCard 
            title="Balanced"
            build={recommendations["Balanced"]}
            variant="balanced"
            featured={true}
          />
          <BuildCard 
            title="High Performance"
            build={recommendations["High Performance"]}
            variant="premium"
          />
        </div>

        {/* AI Explanation Section */}
        {explanation && (
          <Card className="mt-12 p-8 bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">AI Recommendation Explanation</h2>
                <p className="text-sm text-muted-foreground">
                  Why these specific configurations were chosen for your needs
                </p>
              </div>
            </div>
            <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
              <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {explanation}
              </p>
            </div>
          </Card>
        )}

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            These recommendations are AI-generated based on your quiz responses.
            <br className="hidden sm:block" />
            Prices and availability may vary by location and retailer.
          </p>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareDialog 
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareUrl={shareUrl}
      />
    </div>
  );
};
