export interface QuizAnswers {
  [key: string]: string | number;
}

export interface Question {
  id: string;
  question: string;
  description?: string;
  type: "single" | "number";
  options?: Array<{
    value: string;
    label: string;
    icon?: string;
    description?: string;
  }>;
  condition?: (answers: QuizAnswers) => boolean;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

export const questions: Question[] = [
  {
    id: "purpose",
    question: "Para que precisa do PC?",
    description: "Selecione o uso principal do seu computador",
    type: "single",
    options: [
      { value: "gaming", label: "Gaming/Jogos", icon: "🎮" },
      { value: "professional", label: "Uso Profissional/Office", icon: "💼" },
      { value: "content", label: "Criação de Conteúdo", icon: "🎨" },
      { value: "mixed", label: "Uso Misto", icon: "🔄" },
    ],
  },
  // Gaming branch
  {
    id: "games",
    question: "Quais os jogos ou géneros que mais joga?",
    type: "single",
    condition: (answers) => answers.purpose === "gaming" || answers.purpose === "mixed",
    options: [
      { value: "fps", label: "FPS Competitivos", description: "CS2, Valorant, Apex" },
      { value: "aaa", label: "AAA Modernos", description: "Cyberpunk, RDR2, Starfield" },
      { value: "moba", label: "MOBA/Strategy", description: "LoL, Dota 2, Civilization" },
      { value: "vr", label: "VR Gaming", description: "Half-Life: Alyx, Beat Saber" },
    ],
  },
  {
    id: "resolution",
    question: "Em que resolução quer jogar?",
    type: "single",
    condition: (answers) => answers.purpose === "gaming" || answers.purpose === "mixed",
    options: [
      { value: "1080p", label: "1080p (Full HD)", description: "Melhor performance" },
      { value: "1440p", label: "1440p (2K)", description: "Equilíbrio ideal" },
      { value: "4k", label: "4K (Ultra HD)", description: "Máxima qualidade" },
    ],
  },
  {
    id: "fps",
    question: "Quantos FPS deseja atingir?",
    type: "single",
    condition: (answers) => answers.purpose === "gaming" || answers.purpose === "mixed",
    options: [
      { value: "60", label: "60 FPS", description: "Experiência suave" },
      { value: "120", label: "120 FPS", description: "Gaming competitivo" },
      { value: "144+", label: "144+ FPS", description: "Performance extrema" },
    ],
  },
  {
    id: "streaming",
    question: "Tem intenções de fazer streaming ou gravações?",
    type: "single",
    condition: (answers) => answers.purpose === "gaming" || answers.purpose === "mixed",
    options: [
      { value: "yes", label: "Sim", description: "Preciso de encoder forte" },
      { value: "no", label: "Não", description: "Apenas jogar" },
    ],
  },
  // Professional branch
  {
    id: "software",
    question: "Que tipo de software utiliza?",
    type: "single",
    condition: (answers) => answers.purpose === "professional",
    options: [
      { value: "office", label: "Office & Web", description: "Word, Excel, navegação" },
      { value: "cad", label: "CAD/Engineering", description: "AutoCAD, SolidWorks" },
      { value: "design", label: "Design Gráfico", description: "Photoshop, Illustrator" },
      { value: "dev", label: "Programação", description: "IDEs, VMs, Docker" },
    ],
  },
  {
    id: "multitask",
    question: "Precisa executar várias aplicações em simultâneo?",
    type: "single",
    condition: (answers) => answers.purpose === "professional",
    options: [
      { value: "light", label: "Uso Ligeiro", description: "2-3 programas" },
      { value: "moderate", label: "Uso Moderado", description: "5-10 programas" },
      { value: "heavy", label: "Uso Intensivo", description: "10+ programas, VMs" },
    ],
  },
  // Content creation branch
  {
    id: "contentSoftware",
    question: "Quais os programas que usa para criar conteúdo?",
    type: "single",
    condition: (answers) => answers.purpose === "content",
    options: [
      { value: "video", label: "Edição de Vídeo", description: "Premiere, DaVinci" },
      { value: "3d", label: "Modelação 3D", description: "Blender, Maya" },
      { value: "photo", label: "Fotografia", description: "Lightroom, Capture One" },
      { value: "music", label: "Produção Musical", description: "Ableton, FL Studio" },
    ],
  },
  {
    id: "render4k",
    question: "Renderiza vídeo em 4K ou superior?",
    type: "single",
    condition: (answers) => answers.purpose === "content" && answers.contentSoftware === "video",
    options: [
      { value: "yes", label: "Sim", description: "Preciso de muita RAM e CPU" },
      { value: "no", label: "Não", description: "1080p é suficiente" },
    ],
  },
  {
    id: "gpuAcceleration",
    question: "Precisa de acelerar renderizações com a GPU?",
    type: "single",
    condition: (answers) => answers.purpose === "content",
    options: [
      { value: "yes", label: "Sim", description: "CUDA/OpenCL essencial" },
      { value: "no", label: "Não", description: "CPU é suficiente" },
    ],
  },
  // Universal questions
  {
    id: "budget",
    question: "Qual o seu orçamento máximo?",
    description: "Em euros (€)",
    type: "number",
    min: 300,
    max: 5000,
    step: 100,
    suffix: "€",
  },
  {
    id: "casePreference",
    question: "Existe preferência por estética ou tamanho?",
    type: "single",
    options: [
      { value: "compact", label: "Compacto (Mini-ITX)", description: "Pequeno e portátil" },
      { value: "standard", label: "Standard (Mid Tower)", description: "Equilíbrio perfeito" },
      { value: "full", label: "Full Tower", description: "Máxima expansão" },
      { value: "rgb", label: "RGB & Estética", description: "Visual impressionante" },
    ],
  },
  {
    id: "peripherals",
    question: "Precisa de monitor, teclado ou rato?",
    type: "single",
    options: [
      { value: "none", label: "Não", description: "Só o PC" },
      { value: "monitor", label: "Monitor", description: "Incluir monitor" },
      { value: "keyboard", label: "Teclado & Rato", description: "Periféricos básicos" },
      { value: "all", label: "Setup Completo", description: "Monitor + periféricos" },
    ],
  },
  {
    id: "upgradability",
    question: "Pretende possibilidade de upgrade futuro?",
    type: "single",
    options: [
      { value: "yes", label: "Sim", description: "Plataforma expansível" },
      { value: "no", label: "Não", description: "Configuração fixa" },
    ],
  },
];
