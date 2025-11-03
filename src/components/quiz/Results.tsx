import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuizAnswers } from "./questions";
import { ArrowLeft, Share2, Download, Cpu, MemoryStick, HardDrive, Zap, Box, Fan } from "lucide-react";
import { toast } from "sonner";

interface ResultsProps {
  answers: QuizAnswers;
  onRestart: () => void;
}

interface Build {
  name: string;
  description: string;
  price: number;
  components: {
    cpu: string;
    gpu: string;
    ram: string;
    storage: string;
    motherboard: string;
    psu: string;
    case: string;
    cooler: string;
  };
  performance: string[];
  reasoning: string[];
}

const generateBuilds = (answers: QuizAnswers): Build[] => {
  const budget = answers.budget as number || 1000;
  const purpose = answers.purpose as string;
  
  // Budget-friendly build
  const budgetBuild: Build = {
    name: "Best Value",
    description: "Maximum performance for the best price",
    price: Math.min(budget * 0.7, budget - 300),
    components: {
      cpu: purpose === "gaming" ? "AMD Ryzen 5 7600" : "AMD Ryzen 5 7600X",
      gpu: answers.resolution === "4k" ? "NVIDIA RTX 4070" : "NVIDIA RTX 4060 Ti",
      ram: "16GB DDR5 6000MHz",
      storage: "1TB NVMe Gen4",
      motherboard: "B650 (AM5)",
      psu: "650W 80+ Gold",
      case: answers.casePreference === "rgb" ? "Mid Tower RGB" : "Mid Tower",
      cooler: "Torre Air Cooler",
    },
    performance: [
      answers.purpose === "gaming" ? "1080p: 144+ FPS in competitive games" : "",
      answers.purpose === "gaming" ? "1440p: 60-100 FPS in AAA" : "",
      "Smooth multitasking",
    ].filter(Boolean),
    reasoning: [
      `The Ryzen 5 7600 offers excellent performance for ${purpose === "gaming" ? "gaming" : "professional tasks"}`,
      `The RTX 4060 Ti is ideal for ${answers.resolution || "1080p"} with ray tracing`,
      "16GB of fast DDR5 RAM ensures smooth multitasking",
      answers.upgradability === "yes" ? "AM5 platform allows future upgrades" : "",
    ].filter(Boolean),
  };

  // Balanced build
  const balancedBuild: Build = {
    name: "Balanced",
    description: "Premium performance with quality components",
    price: Math.min(budget * 0.85, budget - 150),
    components: {
      cpu: purpose === "content" ? "AMD Ryzen 7 7800X3D" : "AMD Ryzen 7 7700X",
      gpu: answers.resolution === "4k" ? "NVIDIA RTX 4070 Ti Super" : "NVIDIA RTX 4070 Super",
      ram: purpose === "content" ? "32GB DDR5 6000MHz" : "32GB DDR5 6000MHz",
      storage: "2TB NVMe Gen4",
      motherboard: "X670 (AM5)",
      psu: "750W 80+ Gold Modular",
      case: answers.casePreference === "rgb" ? "Mid Tower RGB Premium" : "Mid Tower Premium",
      cooler: "280mm AIO Liquid Cooler",
    },
    performance: [
      answers.purpose === "gaming" ? "1440p: 144+ FPS in all games" : "",
      answers.purpose === "gaming" ? "4K: 60+ FPS with ray tracing" : "",
      answers.purpose === "content" ? "4K Render: 2-3x faster" : "",
      "Extreme multitasking without limitations",
    ].filter(Boolean),
    reasoning: [
      purpose === "gaming" ? "The Ryzen 7 7800X3D is the best gaming CPU on the market" : "Ryzen 7 7700X offers 8 cores for heavy multitasking",
      `The RTX 4070 Super dominates ${answers.resolution || "1440p"} with full ray tracing`,
      "32GB of RAM allows professional editing and VMs",
      "280mm AIO keeps temperatures low under extreme load",
    ].filter(Boolean),
  };

  // High-end build
  const highEndBuild: Build = {
    name: "High Performance",
    description: "The best on the market without compromises",
    price: budget,
    components: {
      cpu: "AMD Ryzen 9 7950X",
      gpu: answers.resolution === "4k" ? "NVIDIA RTX 4090" : "NVIDIA RTX 4080 Super",
      ram: "64GB DDR5 6400MHz",
      storage: "2TB NVMe Gen5 + 2TB Gen4",
      motherboard: "X670E (AM5)",
      psu: answers.resolution === "4k" ? "1000W 80+ Platinum" : "850W 80+ Platinum",
      case: answers.casePreference === "compact" ? "Mid Tower Premium" : "Full Tower",
      cooler: "360mm AIO Liquid Cooler RGB",
    },
    performance: [
      answers.purpose === "gaming" ? "4K: 120+ FPS in all games" : "",
      answers.purpose === "gaming" ? "VR: Extreme performance" : "",
      answers.purpose === "content" ? "4K Render: 4x faster than average" : "",
      "Complete professional workstation",
    ].filter(Boolean),
    reasoning: [
      "Ryzen 9 7950X: 16 cores for the most demanding tasks",
      answers.resolution === "4k" ? "RTX 4090: The most powerful GPU on the market" : "RTX 4080 Super: Extreme power for 4K",
      "64GB of RAM for 8K editing and massive projects",
      "Gen5 storage for record-breaking speeds",
      answers.streaming === "yes" ? "NVENC encoder for streaming without FPS loss" : "",
    ].filter(Boolean),
  };

  return [budgetBuild, balancedBuild, highEndBuild];
};

const Results = ({ answers, onRestart }: ResultsProps) => {
  const builds = generateBuilds(answers);

  const handleShare = () => {
    toast.success("Share link copied!");
  };

  const handleExport = () => {
    toast.success("Build exported!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              FORGEA
            </h1>
            <Button
              variant="outline"
              onClick={onRestart}
              className="border-primary text-foreground hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retake Quiz
            </Button>
          </div>

          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold">
              Your Custom
              <span className="block mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Builds
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Based on your answers, we recommend these configurations
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Builds */}
        <div className="max-w-6xl mx-auto space-y-8">
          {builds.map((build, index) => (
            <Card key={index} className="p-8 bg-gradient-to-br from-card to-card/50 border-primary/10 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-secondary/10 blur-3xl rounded-full -mr-32 -mt-32" />
              
              <div className="relative space-y-6">
                {/* Build Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{build.name}</h2>
                    <p className="text-muted-foreground">{build.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">${build.price}</div>
                    <div className="text-sm text-muted-foreground">Estimate</div>
                  </div>
                </div>

                {/* Components Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Components</h3>
                    {[
                      { icon: Cpu, label: "CPU", value: build.components.cpu },
                      { icon: Box, label: "GPU", value: build.components.gpu },
                      { icon: MemoryStick, label: "RAM", value: build.components.ram },
                      { icon: HardDrive, label: "Storage", value: build.components.storage },
                      { icon: Zap, label: "Motherboard", value: build.components.motherboard },
                      { icon: Zap, label: "PSU", value: build.components.psu },
                      { icon: Box, label: "Case", value: build.components.case },
                      { icon: Fan, label: "Cooler", value: build.components.cooler },
                    ].map((component, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                        <component.icon className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground">{component.label}</div>
                          <div className="font-medium">{component.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    {/* Performance */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Expected Performance</h3>
                      <div className="space-y-3">
                        {build.performance.map((perf, i) => (
                          <div key={i} className="p-3 rounded-lg bg-background/50 text-sm">
                            • {perf}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Why This Build?</h3>
                      <div className="space-y-3">
                        {build.reasoning.map((reason, i) => (
                          <div key={i} className="p-3 rounded-lg bg-primary/5 text-sm">
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-6 border-t border-border">
                  <Button className="w-full md:w-auto bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--glow-primary)]">
                    View Detailed Components
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2025 Forgea. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="/terms" className="hover:text-primary transition-colors">
                Terms & Conditions
              </a>
              <a href="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Results;
