import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Share2, Download, Copy, Link2 } from "lucide-react";
import { BuildCard, BuildData } from "./BuildCard";
import { ShareDialog } from "./ShareDialog";
import { useState } from "react";
import { toast } from "sonner";

interface AIResultsViewProps {
  sessionInfo: {
    session_id: string;
    country: string;
    country_code: string;
    total_score: number | null;
    completed_at: string;
  };
  recommendations: {
    "Best Value": BuildData;
    "Balanced": BuildData;
    "High Performance": BuildData;
  };
  onRestart: () => void;
  onBack: () => void;
}

export const AIResultsView = ({ 
  sessionInfo, 
  recommendations, 
  onRestart, 
  onBack 
}: AIResultsViewProps) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const shareUrl = `${window.location.origin}/build/${sessionInfo.session_id}`;

  const handleDownload = () => {
    toast.info("PDF download feature coming soon!");
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("URL copied to clipboard!");
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
                onClick={() => setShareDialogOpen(true)}
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
                {shareUrl}
              </code>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyUrl}
              className="shrink-0"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Country</p>
              <p className="font-semibold">{sessionInfo.country}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Session ID</p>
              <p className="font-mono text-xs truncate">{sessionInfo.session_id}</p>
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
