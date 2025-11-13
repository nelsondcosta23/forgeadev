import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { MousePointerClick, TrendingUp, Calendar, Download } from "lucide-react";
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from "date-fns";

interface CompanyClicksTabProps {
  companyId: string;
}

interface ClickData {
  id: string;
  session_id: string;
  country_name: string;
  country_code: string;
  clicked_at: string;
  is_valid: boolean;
}

export const CompanyClicksTab = ({ companyId }: CompanyClicksTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch clicks data
  const { data: clicks, isLoading } = useQuery({
    queryKey: ["company-clicks", companyId],
    queryFn: async () => {
      // Get all clicks for this specific company
      const { data: clicksData, error } = await supabase
        .from("clicks")
        .select("*")
        .eq("company_id", companyId)
        .order("clicked_at", { ascending: false });

      if (error) throw error;
      return clicksData as ClickData[];
    },
  });

  // Filter clicks by search and date range
  const filteredClicks = useMemo(() => {
    return clicks?.filter((click) => {
      const matchesSearch = 
        click.session_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        click.country_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const clickDate = new Date(click.clicked_at);
      const matchesStartDate = !startDate || clickDate >= new Date(startDate);
      const matchesEndDate = !endDate || clickDate <= new Date(endDate);

      return matchesSearch && matchesStartDate && matchesEndDate;
    }) || [];
  }, [clicks, searchTerm, startDate, endDate]);

  // Calculate statistics
  const totalClicks = filteredClicks.length;
  
  const weeklyClicks = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    
    return filteredClicks.filter(click => {
      const clickDate = new Date(click.clicked_at);
      return clickDate >= weekStart && clickDate <= weekEnd;
    }).length;
  }, [filteredClicks]);

  const monthlyClicks = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    return filteredClicks.filter(click => {
      const clickDate = new Date(click.clicked_at);
      return clickDate >= monthStart && clickDate <= monthEnd;
    }).length;
  }, [filteredClicks]);

  const handleExport = () => {
    const csvContent = [
      ["ID do Quiz", "País", "Data", "Status"],
      ...filteredClicks.map(click => [
        click.session_id,
        click.country_name || "N/A",
        format(new Date(click.clicked_at), "dd/MM/yyyy HH:mm"),
        click.is_valid ? "Válido" : "Inválido"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clicks-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-primary" />
              Total de Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyClicks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyClicks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input
            placeholder="Pesquisar por ID do quiz ou país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Data inicial"
          />
        </div>
        <div>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Data final"
          />
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Clicks Table */}
      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      ) : filteredClicks.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum click encontrado</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID do Quiz</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Data e Hora</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClicks.map((click) => (
                <TableRow key={click.id}>
                  <TableCell className="font-mono text-sm">{click.session_id}</TableCell>
                  <TableCell>{click.country_name || "N/A"}</TableCell>
                  <TableCell>{format(new Date(click.clicked_at), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell>
                    <span className={click.is_valid ? "text-green-600" : "text-red-600"}>
                      {click.is_valid ? "Válido" : "Inválido"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
