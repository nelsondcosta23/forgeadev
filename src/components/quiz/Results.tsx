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
    name: "Custo/Benefício",
    description: "Máximo desempenho pelo melhor preço",
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
      answers.purpose === "gaming" ? "1080p: 144+ FPS em jogos competitivos" : "",
      answers.purpose === "gaming" ? "1440p: 60-100 FPS em AAA" : "",
      "Multitasking fluido",
    ].filter(Boolean),
    reasoning: [
      `O Ryzen 5 7600 oferece excelente desempenho para ${purpose === "gaming" ? "gaming" : "tarefas profissionais"}`,
      `A RTX 4060 Ti é ideal para ${answers.resolution || "1080p"} com ray tracing`,
      "16GB de RAM DDR5 rápida garante fluidez em multitasking",
      answers.upgradability === "yes" ? "Plataforma AM5 permite upgrades futuros" : "",
    ].filter(Boolean),
  };

  // Balanced build
  const balancedBuild: Build = {
    name: "Equilibrada",
    description: "Performance premium com componentes de qualidade",
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
      answers.purpose === "gaming" ? "1440p: 144+ FPS em todos os jogos" : "",
      answers.purpose === "gaming" ? "4K: 60+ FPS com ray tracing" : "",
      answers.purpose === "content" ? "Render 4K: 2-3x mais rápido" : "",
      "Multitasking extremo sem limitações",
    ].filter(Boolean),
    reasoning: [
      purpose === "gaming" ? "O Ryzen 7 7800X3D é o melhor CPU para gaming do mercado" : "Ryzen 7 7700X oferece 8 cores para multitasking pesado",
      `A RTX 4070 Super domina ${answers.resolution || "1440p"} com ray tracing completo`,
      "32GB de RAM permite edição profissional e VMs",
      "AIO 280mm mantém temperaturas baixas sob carga extrema",
    ].filter(Boolean),
  };

  // High-end build
  const highEndBuild: Build = {
    name: "Alto Desempenho",
    description: "O melhor do mercado sem compromissos",
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
      answers.purpose === "gaming" ? "4K: 120+ FPS em todos os jogos" : "",
      answers.purpose === "gaming" ? "VR: Performance extrema" : "",
      answers.purpose === "content" ? "Render 4K: 4x mais rápido que média" : "",
      "Workstation profissional completa",
    ].filter(Boolean),
    reasoning: [
      "Ryzen 9 7950X: 16 cores para as tarefas mais exigentes",
      answers.resolution === "4k" ? "RTX 4090: A GPU mais poderosa do mercado" : "RTX 4080 Super: Potência extrema para 4K",
      "64GB de RAM para edição 8K e projetos massivos",
      "Armazenamento Gen5 para velocidades recordes",
      answers.streaming === "yes" ? "Encoder NVENC para streaming sem perda de FPS" : "",
    ].filter(Boolean),
  };

  return [budgetBuild, balancedBuild, highEndBuild];
};

const Results = ({ answers, onRestart }: ResultsProps) => {
  const builds = generateBuilds(answers);

  const handleShare = () => {
    toast.success("Link de partilha copiado!");
  };

  const handleExport = () => {
    toast.success("Build exportada!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-12">
          <Button
            variant="ghost"
            onClick={onRestart}
            className="mb-6 hover:bg-card"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Refazer Quiz
          </Button>

          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold">
              As Suas Builds
              <span className="block mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Personalizadas
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Baseado nas suas respostas, recomendamos estas configurações
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Partilhar
            </Button>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar PDF
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
                    <div className="text-3xl font-bold text-primary">{build.price}€</div>
                    <div className="text-sm text-muted-foreground">Estimativa</div>
                  </div>
                </div>

                {/* Components Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Componentes</h3>
                    {[
                      { icon: Cpu, label: "CPU", value: build.components.cpu },
                      { icon: Box, label: "GPU", value: build.components.gpu },
                      { icon: MemoryStick, label: "RAM", value: build.components.ram },
                      { icon: HardDrive, label: "Armazenamento", value: build.components.storage },
                      { icon: Zap, label: "Motherboard", value: build.components.motherboard },
                      { icon: Zap, label: "PSU", value: build.components.psu },
                      { icon: Box, label: "Caixa", value: build.components.case },
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
                      <h3 className="text-lg font-semibold mb-4">Performance Esperada</h3>
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
                      <h3 className="text-lg font-semibold mb-4">Porque Esta Build?</h3>
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
                    Ver Componentes Detalhados
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Results;
