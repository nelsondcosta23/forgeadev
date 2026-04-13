import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuizAnswers } from "./questions";
import { ArrowLeft, Share2, Download, Copy, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ShareDialog } from "./ShareDialog";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TrackableLink from "./TrackableLink";
import { BuildCard, BuildData } from "./BuildCard";
import { BuildReport } from "./BuildReport";

interface ResultsProps {
  answers: QuizAnswers;
  onRestart: () => void;
  onBack: () => void;
  sessionId: string;
  aiRecommendation?: string;
}

const Results = ({ answers, onRestart, onBack, sessionId, aiRecommendation }: ResultsProps) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/build/${sessionId}`;

  if (!sessionId || sessionId === "" || sessionId === "undefined") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-12 max-w-md mx-4 text-center space-y-6">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Invalid Session</h2>
            <p className="text-muted-foreground">Unable to load results. Please restart the quiz.</p>
          </div>
          <Button onClick={onRestart}>Restart Quiz</Button>
        </Card>
      </div>
    );
  }

  const structuredRecommendation = (() => {
    if (!aiRecommendation) return null;
    try {
      const parsed = JSON.parse(aiRecommendation);
      return (parsed.session_info && parsed.recommendations) ? parsed : null;
    } catch (e) {
      return null;
    }
  })();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Copy failed");
    }
  };

  const handleExport = async () => {
    const element = document.getElementById('pdf-content');
    if (!element) return;

    const toastId = toast.loading("Preparing build report PDF...");

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('pdf-content');
          if (el) {
            el.style.padding = "40px";
            el.style.color = "#000000";
            el.querySelectorAll('.no-print').forEach(e => (e as HTMLElement).style.display = 'none');
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      doc.save(`Forgea-PC-Builds-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.dismiss(toastId);
      toast.success("Report exported");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Export failure");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-6xl mx-auto mb-12">
          <div className="flex justify-between items-center mb-6">
            <h1 
              className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
              onClick={onBack}
            >
              FORGEA
            </h1>
            <Button variant="outline" onClick={onRestart} className="border-primary text-foreground hover:bg-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retake Quiz
            </Button>
          </div>

          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold">
              Your Custom
              <span className="block mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Builds</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Based on your answers, we recommend these configurations
            </p>
            
            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={() => setShareDialogOpen(true)} className="gap-2">
                <Share2 className="w-4 h-4" /> Share
              </Button>
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" /> Export PDF
              </Button>
            </div>
          </div>

          <Card className="mb-8 p-6 bg-card/50 border-primary/20">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Share2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Your Unique Build URL</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-background/50 rounded-lg border border-border overflow-hidden">
                  <code className="text-sm text-primary break-all">{shareUrl}</code>
                </div>
                <Button variant="outline" size="icon" onClick={handleCopyLink} className="shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Save or share this unique link to access your recommendations anytime.
              </p>
            </div>
          </Card>

          <div id="pdf-content" className="space-y-8 bg-background">
            <div className="text-center space-y-2 mb-12 hidden print:block">
              <h1 className="text-3xl font-bold">FORGEA PC BUILD REPORT</h1>
              <p className="text-sm text-muted-foreground">{shareUrl}</p>
            </div>

            {structuredRecommendation ? (
              <BuildReport
                recommendation={structuredRecommendation.session_info.recommendation}
                ai_report={structuredRecommendation.session_info.ai_report}
                metadata={structuredRecommendation.session_info.metadata}
                sessionId={sessionId}
                recommendations={structuredRecommendation.recommendations}
              />
            ) : aiRecommendation && (
              <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => (
                        <TrackableLink href={href} sessionId={sessionId}>{children}</TrackableLink>
                      ),
                    }}
                  >
                    {aiRecommendation.startsWith('{') ? JSON.parse(aiRecommendation).explanation : aiRecommendation}
                  </ReactMarkdown>
                </div>
              </Card>
            )}
            
            {!structuredRecommendation && (
              <div className="text-center p-8 border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground italic">Scroll up to view recommendations</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2026 Forgea. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="/terms" className="hover:text-primary">Terms</a>
              <a href="/privacy" className="hover:text-primary">Privacy</a>
            </div>
          </div>
        </div>
      </footer>

      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} shareUrl={shareUrl} />
    </div>
  );
};

export default Results;
