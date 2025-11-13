import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuizAnswers } from "./questions";
import { ArrowLeft, Share2, Download, Cpu, MemoryStick, HardDrive, Zap, Box, Fan, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { ShareDialog } from "./ShareDialog";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import QRCode from "qrcode";
import TrackableLink from "./TrackableLink";
import { AIResultsView } from "./AIResultsView";
import { BuildData } from "./BuildCard";

interface ResultsProps {
  answers: QuizAnswers;
  onRestart: () => void;
  onBack: () => void;
  sessionId: string;
  aiRecommendation?: string;
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

const Results = ({ answers, onRestart, onBack, sessionId, aiRecommendation }: ResultsProps) => {
  // Try to parse AI recommendation as structured JSON
  const parseAIRecommendation = (): { 
    session_info: any; 
    recommendations: { "Best Value": BuildData; "Balanced": BuildData; "High Performance": BuildData } 
  } | null => {
    if (!aiRecommendation) return null;
    
    try {
      const parsed = JSON.parse(aiRecommendation);
      
      // Check if it has the expected structure
      if (parsed.session_info && parsed.recommendations) {
        const hasRequiredBuilds = 
          parsed.recommendations["Best Value"] &&
          parsed.recommendations["Balanced"] &&
          parsed.recommendations["High Performance"];
        
        if (hasRequiredBuilds) {
          return parsed;
        }
      }
    } catch (e) {
      // Not valid JSON, use markdown rendering
      console.log("AI recommendation is not structured JSON, using markdown display");
    }
    
    return null;
  };

  const structuredRecommendation = parseAIRecommendation();

  // If we have structured AI recommendations, use the new AIResultsView
  if (structuredRecommendation) {
    return (
      <AIResultsView
        sessionInfo={structuredRecommendation.session_info}
        recommendations={structuredRecommendation.recommendations}
        onRestart={onRestart}
        onBack={onBack}
      />
    );
  }

  // Otherwise, use the original layout
  const builds = generateBuilds(answers);
  const shareUrl = `${window.location.origin}/build/${sessionId}`;
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Error copying link");
    }
  };

  const handleExport = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPos = 20;

    // Generate QR Code for the share URL
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
    }

    // Helper function to add watermark to current page
    const addWatermark = () => {
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const watermarkText = `Generated on ${currentDate} | www.forgea.com`;
      
      doc.setTextColor(220, 220, 220);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text(watermarkText, pageWidth / 2, pageHeight - 5, { align: "center" });
    };

    // Helper function to check if we need a new page
    const checkNewPage = (spaceNeeded: number = 20) => {
      if (yPos + spaceNeeded > pageHeight - 25) {
        addWatermark(); // Add watermark before creating new page
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Header with Forgea branding and QR code
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, pageWidth, 50, "F");
    
    doc.setTextColor(255, 120, 50);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("FORGEA", pageWidth / 2, 22, { align: "center" });
    
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.text("www.forgea.com", pageWidth / 2, 32, { align: "center" });
    
    // Add clickable share URL
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    const urlText = shareUrl;
    const urlWidth = doc.getTextWidth(urlText);
    const urlX = (pageWidth - urlWidth) / 2;
    doc.textWithLink(urlText, urlX, 40, { url: shareUrl });
    
    // Add QR code in top right corner if generated successfully
    if (qrCodeDataUrl) {
      const qrSize = 35;
      doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - qrSize - 5, 8, qrSize, qrSize);
      
      // Add "Scan to view online" text below QR code
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(6);
      doc.text("Scan to view", pageWidth - qrSize / 2 - 5, 45, { align: "center" });
    }

    yPos = 60;

    // Title section with gradient-like effect
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, yPos, contentWidth, 25, "F");
    
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Your Custom PC Builds", pageWidth / 2, yPos + 12, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Personalized recommendations based on your preferences", pageWidth / 2, yPos + 20, { align: "center" });
    
    yPos += 35;

    // AI Recommendation section (if available)
    if (aiRecommendation) {
      // Section header with colored bar
      doc.setFillColor(255, 120, 50);
      doc.rect(margin, yPos, 4, 12, "F");
      
      doc.setFillColor(255, 245, 240);
      doc.rect(margin + 6, yPos, contentWidth - 6, 12, "F");
      
      doc.setTextColor(255, 90, 30);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("AI Personalized Recommendation", margin + 10, yPos + 8);
      
      yPos += 18;

      // Process AI recommendation with improved formatting
      // Remove all emojis from the content
      const cleanedRecommendation = aiRecommendation
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
        .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Remove misc symbols
        .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Remove dingbats
        .replace(/[🤖🔧⚡💡💰🛒🎯✅📋🌍🗣️]/g, ''); // Remove specific emojis
      
      const recLines = cleanedRecommendation.replace(/\r\n/g, "\n").split("\n");
      let inTable = false;
      let tableHeaders: string[] = [];
      let tableRows: string[][] = [];
      let isHeaderSeparator = false;
      let currentHeaderLevel = 0;

      recLines.forEach((line, lineIndex) => {
        const trimmed = line.trim();
        
        // Handle empty lines
        if (!trimmed) {
          if (!inTable) {
            yPos += 4;
          }
          return;
        }

        // Detect header level (# ## ###)
        const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
        if (headerMatch) {
          checkNewPage(25);
          const level = headerMatch[1].length;
          const headerText = headerMatch[2].trim();
          
          yPos += level === 1 ? 8 : 5;
          
          // H1 - Main sections
          if (level === 1) {
            doc.setFillColor(50, 50, 50);
            doc.rect(margin, yPos - 2, contentWidth, 10, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.text(headerText, margin + 5, yPos + 5);
            yPos += 14;
          }
          // H2 - Subsections
          else if (level === 2) {
            doc.setFillColor(255, 120, 50);
            doc.rect(margin, yPos, 3, 8, "F");
            doc.setTextColor(255, 90, 30);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(headerText, margin + 8, yPos + 5);
            yPos += 11;
          }
          // H3 - Minor sections
          else {
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(headerText, margin, yPos + 5);
            yPos += 9;
          }
          
          currentHeaderLevel = level;
          return;
        }

        // Detect and process tables
        if (trimmed.includes("|")) {
          const cells = trimmed
            .split("|")
            .map(c => c.trim())
            .filter(c => c.length > 0);

          // Check if it's a separator line
          if (cells.every(c => /^[-:]+$/.test(c))) {
            isHeaderSeparator = true;
            return;
          }

          // First row is header
          if (!inTable) {
            inTable = true;
            tableHeaders = cells;
            tableRows = [];
            return;
          }

          // Collect table rows
          if (isHeaderSeparator && cells.length > 0) {
            tableRows.push(cells);
          }
          return;
        } else if (inTable) {
          // End of table - render it
          checkNewPage(tableRows.length * 8 + 20);
          
          // Table container
          yPos += 5;
          const tableStartY = yPos;
          
          // Render table header
          doc.setFillColor(70, 70, 70);
          doc.rect(margin, yPos, contentWidth, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          
          const colWidth = contentWidth / Math.max(tableHeaders.length, 1);
          tableHeaders.forEach((header, idx) => {
            const xPos = margin + (idx * colWidth) + 2;
            const headerText = doc.splitTextToSize(header, colWidth - 4);
            doc.text(headerText[0] || header, xPos, yPos + 5);
          });
          yPos += 8;
          
          // Render table rows
          tableRows.forEach((row, rowIdx) => {
            checkNewPage(8);
            
            // Alternating row colors
            if (rowIdx % 2 === 0) {
              doc.setFillColor(248, 248, 248);
              doc.rect(margin, yPos, contentWidth, 7, "F");
            }
            
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            
            row.forEach((cell, cellIdx) => {
              const xPos = margin + (cellIdx * colWidth) + 2;
              const cellText = doc.splitTextToSize(cell, colWidth - 4);
              doc.text(cellText[0] || cell, xPos, yPos + 5);
            });
            yPos += 7;
          });
          
          // Table border
          doc.setDrawColor(200, 200, 200);
          doc.rect(margin, tableStartY, contentWidth, yPos - tableStartY);
          
          inTable = false;
          tableHeaders = [];
          tableRows = [];
          isHeaderSeparator = false;
          yPos += 8;
          return;
        }

        // Process bold text (keep formatting)
        const hasBold = /\*\*(.+?)\*\*/.test(trimmed);
        
        // Detect list items and checkboxes
        const isBullet = /^\s*[-*•]\s+/.test(trimmed);
        const isNumbered = /^\s*\d+\.\s+/.test(trimmed);
        const isCheckbox = /^\s*\[[ xX✓]\]\s+/.test(trimmed) || trimmed.toLowerCase().startsWith('cpu:') || 
                           trimmed.toLowerCase().startsWith('gpu:') || trimmed.toLowerCase().startsWith('ram:') ||
                           trimmed.toLowerCase().startsWith('motherboard:') || trimmed.toLowerCase().startsWith('psu:') ||
                           trimmed.toLowerCase().startsWith('storage:') || trimmed.toLowerCase().startsWith('case:') ||
                           trimmed.toLowerCase().startsWith('cooler:');
        
        if (isBullet || isNumbered || isCheckbox) {
          checkNewPage(12);
          let cleanLine = trimmed
            .replace(/^\s*[-*•]\s+/, "")
            .replace(/^\s*\d+\.\s+/, "")
            .replace(/^\s*\[[ xX✓]\]\s+/, "")
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/\*(.*?)\*/g, "$1")
            .replace(/`(.*?)`/g, "$1");
          
          // Extract links and show URLs
          const linkMatches = [...cleanLine.matchAll(/\[(.*?)\]\((.*?)\)/g)];
          linkMatches.forEach(match => {
            const linkText = match[1];
            const url = match[2];
            cleanLine = cleanLine.replace(match[0], `${linkText} (${url})`);
          });

          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          
          const wrapped = doc.splitTextToSize(cleanLine, contentWidth - 15);
          wrapped.forEach((wLine: string, idx: number) => {
            checkNewPage(6);
            if (idx === 0) {
              // Use checkbox symbol for checkbox items, bullet for others
              if (isCheckbox) {
                doc.setTextColor(50, 150, 50);
                doc.text("[✓]", margin + 2, yPos);
              } else {
                doc.setTextColor(255, 120, 50);
                doc.text("•", margin + 2, yPos);
              }
              doc.setTextColor(60, 60, 60);
              doc.text(wLine, margin + 12, yPos);
            } else {
              doc.text(wLine, margin + 12, yPos);
            }
            yPos += 5;
          });
          yPos += 1;
          return;
        }

        // Regular paragraph
        if (trimmed) {
          checkNewPage(12);
          
          let cleanLine = trimmed
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/\*(.*?)\*/g, "$1")
            .replace(/`(.*?)`/g, "$1")
            .replace(/^>\s+/, "");
          
          // Extract and show URLs for links
          const linkMatches = [...cleanLine.matchAll(/\[(.*?)\]\((.*?)\)/g)];
          linkMatches.forEach(match => {
            const linkText = match[1];
            const url = match[2];
            cleanLine = cleanLine.replace(match[0], `${linkText} (${url})`);
          });

          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(70, 70, 70);
          
          const wrapped = doc.splitTextToSize(cleanLine, contentWidth);
          wrapped.forEach((wLine: string) => {
            checkNewPage(6);
            doc.text(wLine, margin, yPos);
            yPos += 5;
          });
          yPos += 2;
        }
      });

      yPos += 12;
      
      // Add watermark to AI recommendation pages
      addWatermark();
    }

    // Build details - only if no AI recommendation or as supplement
    if (!aiRecommendation && builds.length > 0) {
      builds.forEach((build, index) => {
        if (index > 0 || aiRecommendation) {
          doc.addPage();
          yPos = margin;
        }

        // Build header with gradient-like effect
        doc.setFillColor(255, 120, 50);
        doc.rect(margin, yPos, contentWidth, 15, "F");
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(build.name, margin + 5, yPos + 10);
        
        doc.setFontSize(14);
        doc.text(`$${build.price}`, pageWidth - margin - 5, yPos + 10, { align: "right" });
        
        yPos += 20;

        // Description box
        doc.setFillColor(255, 245, 240);
        doc.rect(margin, yPos, contentWidth, 10, "F");
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text(build.description, margin + 5, yPos + 7);
        yPos += 16;

        // Components section with header
        doc.setFillColor(70, 70, 70);
        doc.rect(margin, yPos, contentWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Components", margin + 5, yPos + 6);
        yPos += 12;

        const components = [
          { icon: ">", label: "CPU", value: build.components.cpu },
          { icon: ">", label: "GPU", value: build.components.gpu },
          { icon: ">", label: "RAM", value: build.components.ram },
          { icon: ">", label: "Storage", value: build.components.storage },
          { icon: ">", label: "Motherboard", value: build.components.motherboard },
          { icon: ">", label: "PSU", value: build.components.psu },
          { icon: ">", label: "Case", value: build.components.case },
          { icon: ">", label: "Cooler", value: build.components.cooler },
        ];

        components.forEach((comp, idx) => {
          checkNewPage(8);
          
          // Alternating backgrounds
          if (idx % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(margin, yPos - 1, contentWidth, 7, "F");
          }
          
          doc.setTextColor(255, 120, 50);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(comp.icon, margin + 3, yPos + 4);
          
          doc.setTextColor(50, 50, 50);
          doc.text(`${comp.label}:`, margin + 8, yPos + 4);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(70, 70, 70);
          doc.text(comp.value, margin + 35, yPos + 4);
          
          yPos += 7;
        });

        yPos += 8;

        // Performance section
        doc.setFillColor(255, 120, 50);
        doc.rect(margin, yPos, 3, 8, "F");
        doc.setTextColor(255, 90, 30);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Expected Performance", margin + 8, yPos + 6);
        yPos += 12;

        build.performance.forEach((perf) => {
          checkNewPage(7);
          doc.setTextColor(255, 120, 50);
          doc.setFontSize(9);
          doc.text(">", margin + 3, yPos);
          
          doc.setTextColor(60, 60, 60);
          doc.setFont("helvetica", "normal");
          doc.text(perf, margin + 10, yPos);
          yPos += 6;
        });

        yPos += 8;

        // Reasoning section
        doc.setFillColor(255, 120, 50);
        doc.rect(margin, yPos, 3, 8, "F");
        doc.setTextColor(255, 90, 30);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Why This Build?", margin + 8, yPos + 6);
        yPos += 12;

        build.reasoning.forEach((reason) => {
          checkNewPage(12);
          
          doc.setTextColor(255, 120, 50);
          doc.setFontSize(9);
          doc.text(">", margin + 3, yPos);
          
          doc.setTextColor(60, 60, 60);
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(reason, contentWidth - 15);
          lines.forEach((line: string, idx: number) => {
            if (idx > 0) checkNewPage(6);
            doc.text(line, margin + 10, yPos);
            yPos += 5;
          });
          yPos += 2;
        });

        // Add watermark to each build page
        addWatermark();
      });
    }


    // Save the PDF
    doc.save(`Forgea-PC-Builds-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("PDF downloaded successfully!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="flex justify-between items-center mb-6">
            <h1 
              className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
              onClick={onBack}
            >
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
            
            {/* Action Buttons - Moved to top */}
            <div className="flex justify-center gap-4 pt-4">
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

          {/* Unique URL Section */}
          <Card className="mb-8 p-6 bg-card/50 border-primary/20">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Share2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Your Unique Build URL</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-background/50 rounded-lg border border-border">
                  <code className="text-sm text-primary break-all">{shareUrl}</code>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Save or share this unique link to access your custom PC build recommendations anytime.
              </p>
            </div>
          </Card>

          {/* AI Recommendation */}
          {aiRecommendation && (
            <Card className="mb-8 p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
              <div className="flex items-start gap-6">
                <div className="p-3 rounded-lg bg-primary/20 shrink-0">
                  <Cpu className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                    🤖 AI Personalized Recommendation
                  </h3>
                  <div className="prose prose-invert prose-lg max-w-none ai-recommendation">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => (
                          <TrackableLink href={href} sessionId={sessionId}>
                            {children}
                          </TrackableLink>
                        ),
                      }}
                    >
                      {aiRecommendation}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </Card>
          )}
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

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareUrl={shareUrl}
      />
    </div>
  );
};

export default Results;
