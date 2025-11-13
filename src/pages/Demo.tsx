import { AIResultsView } from "@/components/quiz/AIResultsView";
import { BuildData } from "@/components/quiz/BuildCard";

const Demo = () => {
  const demoSessionInfo = {
    session_id: "demo-123-456-789",
    country: "Portugal",
    country_code: "PT",
    total_score: 85,
    completed_at: new Date().toISOString(),
  };

  const demoRecommendations: {
    "Best Value": BuildData;
    "Balanced": BuildData;
    "High Performance": BuildData;
  } = {
    "Best Value": {
      processor: "AMD Ryzen 5 5600G",
      graphics_card: "Integrated Radeon Graphics",
      ram: "16GB DDR4 3200MHz",
      storage: "512GB NVMe SSD",
      power_supply: "600W 80+ Bronze",
      estimated_price_range: "€480-500",
      performance_tier: "Best Price/Performance",
    },
    "Balanced": {
      processor: "AMD Ryzen 5 5600X",
      graphics_card: "NVIDIA GeForce GTX 1660 Super",
      ram: "16GB DDR4 3200MHz",
      storage: "1TB NVMe SSD",
      power_supply: "650W 80+ Bronze",
      estimated_price_range: "€550-600",
      performance_tier: "Balanced Performance",
    },
    "High Performance": {
      processor: "AMD Ryzen 7 5800X",
      graphics_card: "NVIDIA GeForce RTX 3060",
      ram: "16GB DDR4 3200MHz",
      storage: "1TB NVMe SSD",
      power_supply: "750W 80+ Gold",
      estimated_price_range: "€700-800",
      performance_tier: "High-End Performance",
    },
  };

  const demoExplanation = `Based on your quiz responses, I've crafted these three PC build options tailored for the Portuguese market:

**Best Value Build (€480-500)**
This build focuses on delivering solid everyday performance without breaking the bank. The Ryzen 5 5600G's integrated graphics are perfect for light gaming, office work, and multimedia tasks. The 16GB of RAM ensures smooth multitasking, while the 512GB NVMe SSD provides fast boot times and application loading. This is ideal if you're on a tight budget or don't need dedicated graphics power.

**Balanced Build (€550-600)**
The sweet spot for most users. By adding the GTX 1660 Super, this build can handle modern games at 1080p with medium to high settings. The Ryzen 5 5600X offers excellent single-core performance for gaming and productivity. The larger 1TB SSD gives you plenty of storage for games and files. This configuration strikes the perfect balance between price and performance.

**High Performance Build (€700-800)**
For enthusiasts and content creators who demand more power. The Ryzen 7 5800X's 8 cores excel at both gaming and productivity tasks like video editing or 3D rendering. The RTX 3060 brings ray tracing capabilities and can handle AAA games at high settings. The 80+ Gold power supply ensures efficiency and reliability under heavy loads.

All builds are optimized for availability and pricing in Portugal, with components that offer the best value in the current market.`;

  const handleRestart = () => {
    window.location.href = "/";
  };

  const handleBack = () => {
    window.location.href = "/";
  };

  return (
    <AIResultsView
      sessionInfo={demoSessionInfo}
      recommendations={demoRecommendations}
      explanation={demoExplanation}
      onRestart={handleRestart}
      onBack={handleBack}
    />
  );
};

export default Demo;
