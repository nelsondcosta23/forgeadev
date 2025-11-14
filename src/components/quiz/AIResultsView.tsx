import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Share2, Download, Copy, Link2 } from "lucide-react";
import { BuildCard, BuildData, ComponentDetail } from "./BuildCard";
import { ShareDialog } from "./ShareDialog";
import { useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
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
      toast.warning("Aguarde enquanto geramos o link da build...");
      return;
    }

    try {
      toast.info("A gerar PDF...");
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Branding - Forgea logo/title
      pdf.setFontSize(24);
      pdf.setTextColor(59, 130, 246); // primary blue
      pdf.text("FORGEA", margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text("PC Build Recommendations", margin, yPos);
      yPos += 15;

      // Generate QR Code
      const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 80,
        margin: 1,
      });
      pdf.addImage(qrCodeDataUrl, "PNG", pageWidth - margin - 25, margin, 25, 25);

      // Session Info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`País: ${sessionInfo.country}`, margin, yPos);
      yPos += 7;
      pdf.text(`Session ID: ${finalSessionId}`, margin, yPos);
      yPos += 7;
      pdf.text(`Data: ${new Date(sessionInfo.completed_at).toLocaleDateString()}`, margin, yPos);
      yPos += 15;

      // URL
      pdf.setFontSize(9);
      pdf.setTextColor(59, 130, 246);
      pdf.textWithLink("Ver online: " + shareUrl, margin, yPos, { url: shareUrl });
      yPos += 15;

      // AI Report Details
      if (sessionInfo.ai_report) {
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Análise IA", margin, yPos);
        yPos += 10;

        pdf.setFontSize(10);
        if (sessionInfo.ai_report.budget_range) {
          pdf.text(`Orçamento: ${sessionInfo.ai_report.budget_range}`, margin, yPos);
          yPos += 6;
        }
        if (sessionInfo.ai_report.primary_use) {
          pdf.text(`Uso Principal: ${sessionInfo.ai_report.primary_use}`, margin, yPos);
          yPos += 6;
        }
        if (sessionInfo.ai_report.performance_level) {
          pdf.text(`Nível de Performance: ${sessionInfo.ai_report.performance_level}`, margin, yPos);
          yPos += 6;
        }
        if (sessionInfo.ai_report.upgrade_priority) {
          pdf.text(`Prioridade de Upgrade: ${sessionInfo.ai_report.upgrade_priority}`, margin, yPos);
          yPos += 6;
        }
        yPos += 10;
      }

      // Recommendations
      const buildTypes = ["Best Value", "Balanced", "High Performance"] as const;
      
      buildTypes.forEach((buildType, index) => {
        if (yPos > pageHeight - 60) {
          pdf.addPage();
          yPos = margin;
        }

        const build = recommendations[buildType];
        
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text(buildType, margin, yPos);
        yPos += 8;

        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Nível: ${build.performance_tier || "—"}`, margin, yPos);
        yPos += 6;
        pdf.text(`Preço Estimado: ${build.estimated_price_range || "—"}`, margin, yPos);
        yPos += 8;

        // Components
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        const processorModel = getComponentModel(build.processor);
        if (processorModel !== "—") {
          pdf.text(`• Processador: ${processorModel}`, margin + 5, yPos);
          yPos += 5;
        }
        const gpuModel = getComponentModel(build.graphics_card);
        if (gpuModel !== "—") {
          pdf.text(`• Placa Gráfica: ${gpuModel}`, margin + 5, yPos);
          yPos += 5;
        }
        const ramModel = getComponentModel(build.ram);
        if (ramModel !== "—") {
          pdf.text(`• RAM: ${ramModel}`, margin + 5, yPos);
          yPos += 5;
        }
        const storageModel = getComponentModel(build.storage);
        if (storageModel !== "—") {
          pdf.text(`• Armazenamento: ${storageModel}`, margin + 5, yPos);
          yPos += 5;
        }
        const psuModel = getComponentModel(build.power_supply);
        if (psuModel !== "—") {
          pdf.text(`• Fonte: ${psuModel}`, margin + 5, yPos);
          yPos += 5;
        }
        
        yPos += 10;
      });

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        "Estas recomendações são geradas por IA. Preços e disponibilidade podem variar.",
        margin,
        pageHeight - 10
      );

      pdf.save(`forgea-build-${finalSessionId}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    }
  };

  const handleCopyUrl = () => {
    if (!finalSessionId) {
      toast.warning("A criar ligação da build... aguarde um momento");
      return;
    }
    navigator.clipboard.writeText(shareUrl);
    toast.success("URL copiada para a área de transferência!");
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
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download PDF</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (!finalSessionId) {
                    toast.warning("O link ainda está a ser gerado.");
                    return;
                  }
                  setShareDialogOpen(true);
                }}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button onClick={onRestart}>
                New Quiz
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
            Your PC Build Recommendations
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Personalized builds for {sessionInfo.country}, crafted by AI based on your preferences
          </p>
        </div>

        {/* Shareable URL Section */}
        <Card className="mb-8 p-6 bg-gradient-to-br from-card to-card/80 border-border">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Your Unique Build URL</h2>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted/30 rounded-md px-4 py-3 border border-border/50">
              <code className="text-sm text-primary font-mono break-all">
                {finalSessionId ? shareUrl : "Gerando link da build..."}
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
            Save or share this unique link to access your custom PC build recommendations anytime.
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
