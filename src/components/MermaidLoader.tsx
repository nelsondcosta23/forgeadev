import { useEffect, useRef, useState } from "react";

interface MermaidLoaderProps {
  chart: string;
  className?: string;
}

export const MermaidLoader = ({ chart, className = "" }: MermaidLoaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadMermaid = async () => {
      try {
        // Dynamically import Mermaid only when this component is mounted
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#3b82f6",
            primaryTextColor: "#fff",
            primaryBorderColor: "#2563eb",
            lineColor: "#64748b",
            secondaryColor: "#f59e0b",
            tertiaryColor: "#4ade80",
            background: "#1e293b",
            mainBkg: "#0f172a",
            secondBkg: "#1e293b",
            tertiaryBkg: "#334155",
          },
        });

        setIsLoaded(true);

        // Render diagram
        if (containerRef.current) {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        }
      } catch (error) {
        console.error("Failed to load/render Mermaid:", error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre>${chart}</pre>`;
        }
      }
    };

    loadMermaid();
  }, [chart]);

  return (
    <div 
      ref={containerRef} 
      className={className}
    >
      {!isLoaded && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};
