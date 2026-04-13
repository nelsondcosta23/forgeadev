import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TrackableLink from "./TrackableLink";
import { DollarSign, Target, TrendingUp, Wrench, Calendar, Cpu, Box, MemoryStick, HardDrive, Zap } from "lucide-react";

interface ComponentDetail {
  model: string;
  where_to_buy: string[];
  video_link: string;
  recommended_price: string;
}

interface BuildTier {
  processor: ComponentDetail;
  graphics_card: ComponentDetail;
  ram: ComponentDetail;
  storage: ComponentDetail;
  power_supply: ComponentDetail;
  estimated_price_range: string;
  performance_tier: string;
}

interface BuildReportProps {
  recommendation: string;
  ai_report: {
    budget_range: string;
    primary_use: string;
    performance_level: string;
    upgrade_priority: string;
  };
  metadata: {
    model_used: string;
    tokens_used: number;
    created_at: string;
  };
  sessionId: string;
  recommendations?: {
    "Best Value": BuildTier;
    "Balanced": BuildTier;
    "High Performance": BuildTier;
  };
}

export const BuildReport = ({ recommendation, ai_report, metadata, sessionId, recommendations }: BuildReportProps) => {
  const reportItems = [
    { icon: DollarSign, label: "Budget Range", value: `€${ai_report.budget_range}`, color: "text-emerald-600" },
    { icon: Target, label: "Primary Use", value: ai_report.primary_use, color: "text-primary" },
    { icon: TrendingUp, label: "Performance Level", value: ai_report.performance_level, color: "text-purple-600" },
    { icon: Wrench, label: "Upgrade Priority", value: ai_report.upgrade_priority, color: "text-orange-600" }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4 md:p-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Your PC Build Report
        </h1>
        <p className="text-muted-foreground">Personalized recommendations based on your answers</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted/50 ${item.color}`}><Icon className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <p className="font-semibold text-sm truncate">{item.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Build Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => <TrackableLink href={href} sessionId={sessionId}>{children}</TrackableLink>,
                h2: ({ children }) => <h2 className="text-xl md:text-2xl font-bold mt-6 mb-4 flex items-center gap-2">{children}</h2>,
                ul: ({ children }) => <ul className="space-y-2 my-4">{children}</ul>,
                li: ({ children }) => (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="flex-1">{children}</span>
                  </li>
                ),
              }}
            >
              {recommendation}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {recommendations && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Detailed Build Components</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(recommendations).map(([tierName, build]) => (
              <Card key={tierName} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-primary/10 to-secondary/10 border-b">
                  <CardTitle className="text-lg">{tierName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{build.performance_tier}</p>
                  <Badge variant="secondary" className="w-fit mt-2">{build.estimated_price_range}</Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {[
                    { icon: Cpu, label: "Processor", data: build.processor },
                    { icon: Box, label: "Graphics Card", data: build.graphics_card },
                    { icon: MemoryStick, label: "RAM", data: build.ram },
                    { icon: HardDrive, label: "Storage", data: build.storage },
                    { icon: Zap, label: "Power Supply", data: build.power_supply }
                  ].map((comp, idx, arr) => (
                    <div key={comp.label}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <comp.icon className="h-4 w-4 text-primary" />
                          {comp.label}
                        </div>
                        <p className="text-sm font-medium">{comp.data?.model}</p>
                        <p className="text-xs text-muted-foreground">{comp.data?.recommended_price}</p>
                        {comp.data?.where_to_buy?.length > 0 && (
                          <p className="text-xs text-muted-foreground">Buy at: {comp.data.where_to_buy.join(", ")}</p>
                        )}
                        {comp.data?.video_link && (
                          <a href={comp.data.video_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                            Watch Review →
                          </a>
                        )}
                      </div>
                      {idx < arr.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>Generated: {new Date(metadata.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">{metadata.model_used}</Badge>
              {metadata.tokens_used > 0 && <span>{metadata.tokens_used.toLocaleString()} tokens</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
