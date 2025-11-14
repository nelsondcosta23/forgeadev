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
    question: "questions.country.question",
    description: "questions.country.description",
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
      { value: "AT", label: "Austria", icon: "🇦🇹" },
      { value: "CH", label: "Switzerland", icon: "🇨🇭" },
      { value: "PL", label: "Poland", icon: "🇵🇱" },
      { value: "SE", label: "Sweden", icon: "🇸🇪" },
      { value: "NO", label: "Norway", icon: "🇳🇴" },
      { value: "DK", label: "Denmark", icon: "🇩🇰" },
      { value: "FI", label: "Finland", icon: "🇫🇮" },
      { value: "IE", label: "Ireland", icon: "🇮🇪" },
      { value: "MX", label: "Mexico", icon: "🇲🇽" },
      { value: "AR", label: "Argentina", icon: "🇦🇷" },
      { value: "CL", label: "Chile", icon: "🇨🇱" },
      { value: "CO", label: "Colombia", icon: "🇨🇴" },
      { value: "PE", label: "Peru", icon: "🇵🇪" },
      { value: "CA", label: "Canada", icon: "🇨🇦" },
      { value: "AU", label: "Australia", icon: "🇦🇺" },
      { value: "NZ", label: "New Zealand", icon: "🇳🇿" },
      { value: "JP", label: "Japan", icon: "🇯🇵" },
      { value: "KR", label: "South Korea", icon: "🇰🇷" },
      { value: "CN", label: "China", icon: "🇨🇳" },
      { value: "IN", label: "India", icon: "🇮🇳" },
      { value: "SG", label: "Singapore", icon: "🇸🇬" },
      { value: "TH", label: "Thailand", icon: "🇹🇭" },
      { value: "MY", label: "Malaysia", icon: "🇲🇾" },
      { value: "ID", label: "Indonesia", icon: "🇮🇩" },
      { value: "PH", label: "Philippines", icon: "🇵🇭" },
      { value: "VN", label: "Vietnam", icon: "🇻🇳" },
      { value: "ZA", label: "South Africa", icon: "🇿🇦" },
      { value: "AE", label: "United Arab Emirates", icon: "🇦🇪" },
      { value: "SA", label: "Saudi Arabia", icon: "🇸🇦" },
      { value: "IL", label: "Israel", icon: "🇮🇱" },
      { value: "TR", label: "Turkey", icon: "🇹🇷" },
      { value: "RU", label: "Russia", icon: "🇷🇺" },
      { value: "UA", label: "Ukraine", icon: "🇺🇦" },
      { value: "CZ", label: "Czech Republic", icon: "🇨🇿" },
      { value: "GR", label: "Greece", icon: "🇬🇷" },
      { value: "RO", label: "Romania", icon: "🇷🇴" },
      { value: "HU", label: "Hungary", icon: "🇭🇺" },
      { value: "OTHER", label: "Other", icon: "🌍" },
    ],
  },
  {
    id: "purpose",
    question: "questions.purpose.question",
    description: "questions.purpose.description",
    type: "single",
    options: [
      { value: "gaming", label: "questions.purpose.gaming", icon: "🎮" },
      { value: "professional", label: "questions.purpose.professional", icon: "💼" },
      { value: "content", label: "questions.purpose.content", icon: "🎨" },
      { value: "mixed", label: "questions.purpose.mixed", icon: "🔄" },
    ],
  },
  // Gaming branch
  {
    id: "games",
    question: "questions.games.question",
    type: "single",
    condition: (answers) => answers.purpose === "gaming" || answers.purpose === "mixed",
    options: [
      { value: "fps", label: "questions.games.fps", description: "questions.games.fpsDesc" },
      { value: "aaa", label: "questions.games.aaa", description: "questions.games.aaaDesc" },
      { value: "moba", label: "questions.games.moba", description: "questions.games.mobaDesc" },
      { value: "vr", label: "questions.games.vr", description: "questions.games.vrDesc" },
    ],
  },
  {
    id: "resolution",
    question: "questions.resolution.question",
    type: "single",
    condition: (answers) => answers.purpose === "gaming" || answers.purpose === "mixed",
    options: [
      { value: "1080p", label: "questions.resolution.1080p", description: "questions.resolution.1080pDesc" },
      { value: "1440p", label: "questions.resolution.1440p", description: "questions.resolution.1440pDesc" },
      { value: "4k", label: "questions.resolution.4k", description: "questions.resolution.4kDesc" },
    ],
  },
  {
    id: "fps",
    question: "questions.fps.question",
    type: "single",
    condition: (answers) => answers.purpose === "gaming" || answers.purpose === "mixed",
    options: [
      { value: "60", label: "questions.fps.60", description: "questions.fps.60Desc" },
      { value: "120", label: "questions.fps.120", description: "questions.fps.120Desc" },
      { value: "144+", label: "questions.fps.144", description: "questions.fps.144Desc" },
    ],
  },
  {
    id: "streaming",
    question: "questions.streaming.question",
    type: "single",
    condition: (answers) => answers.purpose === "gaming" || answers.purpose === "mixed",
    options: [
      { value: "yes", label: "questions.streaming.yes", description: "questions.streaming.yesDesc" },
      { value: "no", label: "questions.streaming.no", description: "questions.streaming.noDesc" },
    ],
  },
  // Professional branch
  {
    id: "software",
    question: "questions.software.question",
    type: "single",
    condition: (answers) => answers.purpose === "professional",
    options: [
      { value: "office", label: "questions.software.office", description: "questions.software.officeDesc" },
      { value: "cad", label: "questions.software.cad", description: "questions.software.cadDesc" },
      { value: "design", label: "questions.software.design", description: "questions.software.designDesc" },
      { value: "dev", label: "questions.software.dev", description: "questions.software.devDesc" },
    ],
  },
  {
    id: "multitask",
    question: "questions.multitask.question",
    type: "single",
    condition: (answers) => answers.purpose === "professional",
    options: [
      { value: "light", label: "questions.multitask.light", description: "questions.multitask.lightDesc" },
      { value: "moderate", label: "questions.multitask.moderate", description: "questions.multitask.moderateDesc" },
      { value: "heavy", label: "questions.multitask.heavy", description: "questions.multitask.heavyDesc" },
    ],
  },
  // Content creation branch
  {
    id: "contentSoftware",
    question: "questions.contentSoftware.question",
    type: "single",
    condition: (answers) => answers.purpose === "content",
    options: [
      { value: "video", label: "questions.contentSoftware.video", description: "questions.contentSoftware.videoDesc" },
      { value: "3d", label: "questions.contentSoftware.3d", description: "questions.contentSoftware.3dDesc" },
      { value: "photo", label: "questions.contentSoftware.photo", description: "questions.contentSoftware.photoDesc" },
      { value: "music", label: "questions.contentSoftware.music", description: "questions.contentSoftware.musicDesc" },
    ],
  },
  {
    id: "render4k",
    question: "questions.render4k.question",
    type: "single",
    condition: (answers) => answers.purpose === "content" && answers.contentSoftware === "video",
    options: [
      { value: "yes", label: "questions.render4k.yes", description: "questions.render4k.yesDesc" },
      { value: "no", label: "questions.render4k.no", description: "questions.render4k.noDesc" },
    ],
  },
  {
    id: "gpuAcceleration",
    question: "questions.gpuAcceleration.question",
    type: "single",
    condition: (answers) => answers.purpose === "content",
    options: [
      { value: "yes", label: "questions.gpuAcceleration.yes", description: "questions.gpuAcceleration.yesDesc" },
      { value: "no", label: "questions.gpuAcceleration.no", description: "questions.gpuAcceleration.noDesc" },
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
    question: "questions.casePreference.question",
    type: "single",
    options: [
      { value: "compact", label: "questions.casePreference.compact", description: "questions.casePreference.compactDesc" },
      { value: "standard", label: "questions.casePreference.standard", description: "questions.casePreference.standardDesc" },
      { value: "full", label: "questions.casePreference.full", description: "questions.casePreference.fullDesc" },
      { value: "rgb", label: "questions.casePreference.rgb", description: "questions.casePreference.rgbDesc" },
    ],
  },
  {
    id: "peripherals",
    question: "questions.peripherals.question",
    type: "single",
    options: [
      { value: "none", label: "questions.peripherals.none", description: "questions.peripherals.noneDesc" },
      { value: "monitor", label: "questions.peripherals.monitor", description: "questions.peripherals.monitorDesc" },
      { value: "keyboard", label: "questions.peripherals.keyboard", description: "questions.peripherals.keyboardDesc" },
      { value: "all", label: "questions.peripherals.all", description: "questions.peripherals.allDesc" },
    ],
  },
  {
    id: "upgradability",
    question: "questions.upgradability.question",
    type: "single",
    options: [
      { value: "yes", label: "questions.upgradability.yes", description: "questions.upgradability.yesDesc" },
      { value: "no", label: "questions.upgradability.no", description: "questions.upgradability.noDesc" },
    ],
  },
];
