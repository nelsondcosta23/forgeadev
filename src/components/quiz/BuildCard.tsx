import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, MonitorPlay, MemoryStick, HardDrive, Zap, TrendingUp, ExternalLink, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ComponentDetail {
  model: string;
  where_to_buy?: string[];
  video_link?: string;
  website_link?: string;
  youtube_link?: string;
  recommended_price?: string;
}

export interface BuildData {
  processor: string | ComponentDetail;
  graphics_card: string | ComponentDetail;
  ram: string | ComponentDetail;
  storage: string | ComponentDetail;
  power_supply: string | ComponentDetail;
  estimated_price_range: string;
  performance_tier: string;
}

interface BuildCardProps {
  title: string;
  build: BuildData;
  variant?: "value" | "balanced" | "premium";
  featured?: boolean;
}

const variantStyles = {
  value: {
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    border: "border-emerald-500/30",
    glow: "shadow-lg shadow-emerald-500/10",
    icon: "text-emerald-600"
  },
  balanced: {
    badge: "bg-primary/10 text-primary border-primary/20",
    border: "border-primary/30",
    glow: "shadow-lg shadow-primary/10",
    icon: "text-primary"
  },
  premium: {
    badge: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    border: "border-purple-500/30",
    glow: "shadow-lg shadow-purple-500/10",
    icon: "text-purple-600"
  }
};

export const BuildCard = ({ title, build, variant = "balanced", featured = false }: BuildCardProps) => {
  const styles = variantStyles[variant];

  // Helper to extract string value from component (handles both string and object formats)
  const getComponentValue = (component: string | ComponentDetail): string => {
    if (typeof component === 'string') return component;
    return component.model;
  };

  const components = [
    { icon: Cpu, label: "Processor", value: getComponentValue(build.processor), data: build.processor },
    { icon: MonitorPlay, label: "Graphics Card", value: getComponentValue(build.graphics_card), data: build.graphics_card },
    { icon: MemoryStick, label: "RAM", value: getComponentValue(build.ram), data: build.ram },
    { icon: HardDrive, label: "Storage", value: getComponentValue(build.storage), data: build.storage },
    { icon: Zap, label: "Power Supply", value: getComponentValue(build.power_supply), data: build.power_supply },
  ];

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
        styles.border,
        styles.glow,
        featured && "ring-2 ring-primary/50"
      )}
    >
      {/* Header */}
      <div className="p-6 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
            <Badge variant="outline" className={cn("font-medium", styles.badge)}>
              {build.performance_tier}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Price Range</p>
            <p className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {build.estimated_price_range}
            </p>
          </div>
        </div>
      </div>

      {/* Components List */}
      <div className="px-6 pb-6 space-y-3">
        {components.map((component, index) => {
          const Icon = component.icon;
          const componentData = typeof component.data === 'object' ? component.data : null;
          
          return (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className={cn("mt-0.5 flex-shrink-0", styles.icon)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">{component.label}</p>
                <p className="text-sm font-medium leading-relaxed">{component.value}</p>
              </div>
              
              {/* Component Action Icons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-7 w-7 p-0", styles.icon, !componentData?.website_link && "opacity-30")}
                  onClick={() => componentData?.website_link && window.open(componentData.website_link, '_blank')}
                  disabled={!componentData?.website_link}
                  title={componentData?.website_link ? "Ver no site" : "Link não disponível"}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-7 w-7 p-0", styles.icon, !componentData?.youtube_link && "opacity-30")}
                  onClick={() => componentData?.youtube_link && window.open(componentData.youtube_link, '_blank')}
                  disabled={!componentData?.youtube_link}
                  title={componentData?.youtube_link ? "Ver review no YouTube" : "Vídeo não disponível"}
                >
                  <Youtube className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Badge at Bottom */}
      <div className={cn(
        "px-6 py-4 border-t flex items-center justify-center gap-2",
        "bg-gradient-to-br from-background to-muted/20"
      )}>
        <TrendingUp className={cn("h-4 w-4", styles.icon)} />
        <p className="text-sm font-medium">{build.performance_tier}</p>
      </div>
    </Card>
  );
};
