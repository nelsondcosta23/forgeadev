import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MousePointerClick, TrendingUp, Euro, AlertTriangle } from "lucide-react";

export const AnalyticsDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["billing-stats"],
    queryFn: async () => {
      // Total de cliques válidos
      const { count: validClicks } = await supabase
        .from("clicks")
        .select("*", { count: "exact", head: true })
        .eq("is_valid", true);

      // Total de cliques inválidos
      const { count: invalidClicks } = await supabase
        .from("clicks")
        .select("*", { count: "exact", head: true })
        .eq("is_valid", false);

      // Custo total
      const { data: costData } = await supabase
        .from("clicks")
        .select("cost")
        .eq("is_valid", true);
      
      const totalCost = costData?.reduce((sum, click) => sum + (parseFloat(click.cost as any) || 0), 0) || 0;

      // CPC médio
      const avgCpc = validClicks ? totalCost / validClicks : 0;

      // Empresas com saldo baixo
      const { data: lowBalanceCompanies } = await supabase
        .from("companies")
        .select("id, name, credits, low_balance_threshold")
        .lt("credits", 100)
        .eq("status", true);

      return {
        validClicks: validClicks || 0,
        invalidClicks: invalidClicks || 0,
        totalCost,
        avgCpc,
        lowBalanceCompanies: lowBalanceCompanies || [],
      };
    },
    refetchInterval: 30000, // atualizar a cada 30s
  });

  const { data: topLinks } = useQuery({
    queryKey: ["top-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracked_links")
        .select("id, label, short_code, valid_clicks, total_cost")
        .order("valid_clicks", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: recentClicks } = useQuery({
    queryKey: ["recent-clicks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clicks")
        .select(`
          id,
          clicked_at,
          country_name,
          referer,
          is_valid,
          invalid_reason,
          cost,
          tracked_links (short_code, label)
        `)
        .order("clicked_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Analytics & Estatísticas</h3>
        <p className="text-sm text-muted-foreground">Visão geral do sistema CPC</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques Válidos</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.validClicks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.invalidClicks || 0} inválidos filtrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPC Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats?.avgCpc.toFixed(4) || "0.0000"}</div>
            <p className="text-xs text-muted-foreground">Por clique válido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats?.totalCost.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Total cobrado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lowBalanceCompanies.length || 0}</div>
            <p className="text-xs text-muted-foreground">Empresas com saldo baixo</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Links */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Links</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Link</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="text-right">Cliques Válidos</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topLinks?.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {link.short_code}
                    </code>
                  </TableCell>
                  <TableCell>{link.label || "-"}</TableCell>
                  <TableCell className="text-right">{link.valid_clicks}</TableCell>
                  <TableCell className="text-right">€{link.total_cost.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cliques Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Cliques Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentClicks?.map((click: any) => (
                <TableRow key={click.id}>
                  <TableCell className="text-xs">
                    {new Date(click.clicked_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {click.tracked_links?.short_code || "N/A"}
                    </code>
                  </TableCell>
                  <TableCell>{click.country_name || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs">
                    {click.referer || "Direto"}
                  </TableCell>
                  <TableCell>
                    {click.is_valid ? (
                      <span className="text-xs text-green-600">✓ Válido</span>
                    ) : (
                      <span className="text-xs text-red-600">✗ {click.invalid_reason}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {click.cost ? `€${parseFloat(click.cost).toFixed(4)}` : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};