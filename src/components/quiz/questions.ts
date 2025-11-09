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
    id: "country",
    question: "What country are you from?",
    description: "This helps us provide more accurate recommendations",
    type: "single",
    options: [
      { value: "PT", label: "Portugal", icon: "🇵🇹" },
      { value: "BR", label: "Brazil", icon: "🇧🇷" },
      { value: "ES", label: "Spain", icon: "🇪🇸" },
      { value: "US", label: "United States", icon: "🇺🇸" },
      { value: "GB", label: "United Kingdom", icon: "🇬🇧" },
      { value: "FR", label: "France", icon: "🇫🇷" },
      { value: "DE", label: "Germany", icon: "🇩🇪" },
      { value: "IT", label: "Italy", icon: "🇮🇹" },
      { value: "NL", label: "Netherlands", icon: "🇳🇱" },
      { value: "BE", label: "Belgium", icon: "🇧🇪" },
      { value: "MX", label: "Mexico", icon: "🇲🇽" },
      { value: "AR", label: "Argentina", icon: "🇦🇷" },
      { value: "CA", label: "Canada", icon: "🇨🇦" },
      { value: "AU", label: "Australia", icon: "🇦🇺" },
      { value: "OTHER", label: "Other", icon: "🌍" },
    ],
  },
  {
    id: "purpose",
    question: "What do you need the PC for?",
    description: "Select your computer's primary use",
    type: "single",
    options: [
      { value: "gaming", label: "Gaming", icon: "🎮" },
      { value: "professional", label: "Professional/Office Use", icon: "💼" },
      { value: "content", label: "Content Creation", icon: "🎨" },
      { value: "mixed", label: "Mixed Use", icon: "🔄" },
    ],
  },
  // Gaming branch
  {
    id: "games",
    question: "What games or genres do you play the most?",
    type: "single",
    condition: (answers) => answers.purpose === "gaming" || answers.purpose === "mixed",
    options: [
      { value: "fps", label: "Competitive FPS", description: "CS2, Valorant, Apex" },
      { value: "aaa", label: "Modern AAA", description: "Cyberpunk, RDR2, Starfield" },
      { value: "moba", label: "MOBA/Strategy", description: "LoL, Dota 2, Civilization" },
      { value: "vr", label: "VR Gaming", description: "Half-Life: Alyx, Beat Saber" },
    ],
  },
  {
    id: "resolution",
    question: "What resolution do you want to play at?",
    type: "single",
    condition: (answers) => answers.purpose === "gaming" || answers.purpose === "mixed",
    options: [
      { value: "1080p", label: "1080p (Full HD)", description: "Best performance" },
      { value: "1440p", label: "1440p (2K)", description: "Ideal balance" },
      { value: "4k", label: "4K (Ultra HD)", description: "Maximum quality" },
    ],
  },
  {
    id: "fps",
    question: "How many FPS do you want to achieve?",
    type: "single",
    condition: (answers) => answers.purpose === "gaming" || answers.purpose === "mixed",
    options: [
      { value: "60", label: "60 FPS", description: "Smooth experience" },
      { value: "120", label: "120 FPS", description: "Competitive gaming" },
      { value: "144+", label: "144+ FPS", description: "Extreme performance" },
    ],
  },
  {
    id: "streaming",
    question: "Do you plan to stream or record?",
    type: "single",
    condition: (answers) => answers.purpose === "gaming" || answers.purpose === "mixed",
    options: [
      { value: "yes", label: "Yes", description: "I need a strong encoder" },
      { value: "no", label: "No", description: "Just gaming" },
    ],
  },
  // Professional branch
  {
    id: "software",
    question: "What type of software do you use?",
    type: "single",
    condition: (answers) => answers.purpose === "professional",
    options: [
      { value: "office", label: "Office & Web", description: "Word, Excel, browsing" },
      { value: "cad", label: "CAD/Engineering", description: "AutoCAD, SolidWorks" },
      { value: "design", label: "Graphic Design", description: "Photoshop, Illustrator" },
      { value: "dev", label: "Programming", description: "IDEs, VMs, Docker" },
    ],
  },
  {
    id: "multitask",
    question: "Do you need to run multiple applications simultaneously?",
    type: "single",
    condition: (answers) => answers.purpose === "professional",
    options: [
      { value: "light", label: "Light Use", description: "2-3 programs" },
      { value: "moderate", label: "Moderate Use", description: "5-10 programs" },
      { value: "heavy", label: "Heavy Use", description: "10+ programs, VMs" },
    ],
  },
  // Content creation branch
  {
    id: "contentSoftware",
    question: "What programs do you use to create content?",
    type: "single",
    condition: (answers) => answers.purpose === "content",
    options: [
      { value: "video", label: "Video Editing", description: "Premiere, DaVinci" },
      { value: "3d", label: "3D Modeling", description: "Blender, Maya" },
      { value: "photo", label: "Photography", description: "Lightroom, Capture One" },
      { value: "music", label: "Music Production", description: "Ableton, FL Studio" },
    ],
  },
  {
    id: "render4k",
    question: "Do you render video in 4K or higher?",
    type: "single",
    condition: (answers) => answers.purpose === "content" && answers.contentSoftware === "video",
    options: [
      { value: "yes", label: "Yes", description: "I need lots of RAM and CPU" },
      { value: "no", label: "No", description: "1080p is enough" },
    ],
  },
  {
    id: "gpuAcceleration",
    question: "Do you need to accelerate rendering with GPU?",
    type: "single",
    condition: (answers) => answers.purpose === "content",
    options: [
      { value: "yes", label: "Yes", description: "CUDA/OpenCL essential" },
      { value: "no", label: "No", description: "CPU is enough" },
    ],
  },
  // Universal questions
  {
    id: "budget",
    question: "What is your maximum budget?",
    description: "In dollars ($)",
    type: "number",
    min: 300,
    max: 5000,
    step: 100,
    suffix: "$",
  },
  {
    id: "casePreference",
    question: "Do you have a preference for aesthetics or size?",
    type: "single",
    options: [
      { value: "compact", label: "Compact (Mini-ITX)", description: "Small and portable" },
      { value: "standard", label: "Standard (Mid Tower)", description: "Perfect balance" },
      { value: "full", label: "Full Tower", description: "Maximum expansion" },
      { value: "rgb", label: "RGB & Aesthetics", description: "Stunning visuals" },
    ],
  },
  {
    id: "peripherals",
    question: "Do you need a monitor, keyboard or mouse?",
    type: "single",
    options: [
      { value: "none", label: "No", description: "Just the PC" },
      { value: "monitor", label: "Monitor", description: "Include monitor" },
      { value: "keyboard", label: "Keyboard & Mouse", description: "Basic peripherals" },
      { value: "all", label: "Complete Setup", description: "Monitor + peripherals" },
    ],
  },
  {
    id: "upgradability",
    question: "Do you want future upgrade capability?",
    type: "single",
    options: [
      { value: "yes", label: "Yes", description: "Expandable platform" },
      { value: "no", label: "No", description: "Fixed configuration" },
    ],
  },
];
